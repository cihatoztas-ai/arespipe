// api/kuyruk-isle-izometri.js
// Wizard'a yüklenen izometri PDF dokümanlarını parse eder, sonucu kuyrukta saklar.
// 107. oturum (21 Mayıs 2026) — MK-49.B
// 112. oturum (22 Mayıs 2026) — MK-112.1: self-chain (fire-and-forget) -> ic-dongu drenaj
//
// kuyruk-isle-excel.js deseninin BİREBİR izometri karşılığı. Tek fark:
//   excel  → lib/excel-parser.js'i lokalde çağırır (buffer ile).
//   izometri → /api/izometri-oku endpoint'ini HTTP ile çağırır (base64 ile).
//
// NEDEN HTTP çağrı: izometri-oku.js içeride batch açar, format dispatch yapar,
//   Vision AI çağırır, halüsinasyon filtresi uygular, DB'ye yazar — tam bir handler.
//   MK-49.1: "izometri-oku'ya DOKUNMA, çağır." HTTP çağrı bu semantiğin en temizi
//   (import edip mock req/res ile çalıştırmak kırılgan + sözleşmeyi bozar).
//
// Akış (tek iş — birIsIsle):
//   1. Durumu 'isleniyor' yap (lock)
//   2. devre_dokumanlari'ndan storage_yolu + yukleyen_id al
//   3. Supabase Storage'dan PDF'i indir → base64
//   4. /api/izometri-oku'ya POST (fingerprint→L2→L3, MK-49.1 sadece çağrı)
//   5. Sonuca göre durum:
//        ok:true + manuel_onay_sayisi === 0  →  'oneri_hazir'
//        ok:true + manuel_onay_sayisi > 0    →  'manuel_onay'
//        ok:false / HTTP hata                →  'hata'
//   6. parse_sonuc'a izometri-oku özetini (spoollar dahil) yaz, bitis_at güncelle
//   7. eslestir() — parse spoollar -> kabuk spool bindirme (111/PARÇA2a)
//
// Bu endpoint DB'ye spool INSERT YAPMAZ. Sadece parse eder + sonucu saklar.
// Onay UI (sonraki oturum) parse_sonuc'u okuyup spooller'a INSERT edecek.
//
// YAN ETKİ: izometri-oku her çağrıda izometri_batch_kayitlari'na bir batch açar
//   (MK-49.1 gereği önlenemez). Wizard akışında bu batch kayıtları kullanılmaz —
//   her PDF için bir "yetim" batch oluşur. Pilot için kabul edilebilir teknik borç.
//
// Tetik: POST /api/kuyruk-isle-izometri
//   Body: yok ('{}')        -> DRENAJ modu: maxDuration icinde ardisik N is isle (MK-112.1).
//                              Buton ve (ileride) Vercel Cron bu modu kullanir (MK-112.2).
//   Veya: { is_id: 'uuid' } -> TEK IS modu: spesifik isi zorla (wizard bunu kullanir, MK-108.1).
//
// MK-112.1 (NEDEN ic-dongu, neden self-chain DEGIL):
//   Onceki tasarim her is bitince fire-and-forget fetch ile kendini tekrar tetikliyordu
//   (zincirDevam). Vercel serverless'te response dondukten sonra container SUSPEND olur;
//   o fetch cogu zaman PAKET GITMEDEN olur. Sonuc: her tetik tam 1 is isler, zincir hic
//   baslamaz. 112'de kanitlandi (134 bekliyor, tek curl -> sadece 1 azaliyor).
//   Cozum: container ZATEN ayakta iken (maxDuration=60) ic while-dongusu ile ardisik isle.
//
// Env (Vercel):
//   SUPABASE_URL              (zaten var)
//   SUPABASE_SERVICE_KEY      (RLS bypass — DB için zorunlu, MK-101.4)
//   SELF_BASE_URL             (önerilen — örn. https://arespipe.vercel.app)
//                             Yoksa VERCEL_URL'den türetilir (deployment-spesifik, daha kırılgan).
//
// NOT: Pilot dönemde public erişim, sonra auth eklenecek (TODO).

import { createClient } from '@supabase/supabase-js';
import { bindir } from '../lib/bindir.js';   // 111/PARÇA2a: PDF→kabuk spool alan bindirme (et/çap/ağırlık/yüzey)

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_ADI   = 'devre-belgeleri';

// izometri-oku Vision AI 11-25 sn sürebilir; worker onu beklerken kendi limitini aşmasın.
export const config = { maxDuration: 60 };

// izometri-oku'nun base64 limiti ile aynı (5MB PDF ~= 6.7MB base64, 7MB güvenli sınır).
// Erken dön: opak relay hatası yerine net kuyruk hata_mesaji üret.
const MAX_BASE64_LEN = 7 * 1024 * 1024;

// 112/MK-112.1: drenaj turu limitleri. maxDuration=60sn; 50sn'de dur (pay birak),
//   en fazla 4 is (4 x ~11sn = ~44sn < 50sn; yavas izometri-oku'da bile 60'i asmaz).
const DRENAJ_MAX_IS = 4;
const DRENAJ_MAX_MS = 50 * 1000;

function selfBaseUrl() {
  if (process.env.SELF_BASE_URL) return process.env.SELF_BASE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_URL)    return `https://${process.env.VERCEL_URL}`;
  return null;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ hata: 'POST gerekli' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({
      hata: 'Env eksik: SUPABASE_URL ve SUPABASE_SERVICE_KEY zorunlu'
    });
  }

  const baseUrl = selfBaseUrl();
  if (!baseUrl) {
    return res.status(500).json({
      hata: 'Env eksik: SELF_BASE_URL (veya VERCEL_URL) zorunlu — izometri-oku çağrısı için'
    });
  }

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false }
  });

  // Spesifik is_id mi yoksa drenaj mi? (drenaj devre-ozgu olabilir: body.devre_id)
  const istenenIsId = req.body?.is_id || null;
  const istenenDevreId = req.body?.devre_id || null;

  try {
    // 108/Adim3: stale lock temizligi — 'isleniyor'da 5dk+ takili izometri isleri (worker crash)
    //            geri 'bekliyor'a alinir; 3+ denemede 'hata' (sonsuz Vision dongusu engeli).
    await staleLockTemizle(supa);

    // ── TEK IS modu (wizard, MK-108.1): spesifik is_id'yi zorla isle ──
    if (istenenIsId) {
      const { data, error } = await supa
        .from('dosya_isleme_kuyrugu')
        .select('*')
        .eq('id', istenenIsId)
        .eq('parser', 'izometri')
        .single();
      if (error || !data) {
        return res.status(404).json({ hata: 'İş bulunamadı: ' + (error?.message || 'null') });
      }
      if (data.durum !== 'bekliyor' && data.durum !== 'hata') {
        return res.status(409).json({
          hata: `İş zaten '${data.durum}' durumunda, tekrar işlenemez`
        });
      }
      // 113/A — tarayici (client-loop) parse sonucunu gonderdiyse skip-parse modu (server->server YOK)
      const sonuc = await birIsIsle(supa, baseUrl, data, {
        oncedenParse: req.body?.onceden_parse,
        oncedenParseHttp: req.body?.onceden_parse_http
      });
      const httpKod = sonuc._status || 200;
      delete sonuc._status;   // ic alan, disari sizmasin (eski sozlesme korunur)
      return res.status(httpKod).json(sonuc);
    }

    // ── DRENAJ modu (buton + ileride cron, MK-112.1/112.2) ──
    //    devre_id verilirse o devreye ozgu (buton, MK-112.3); yoksa global (cron).
    const { islenen, kalan_var } = await drenajTuru(supa, baseUrl, {
      maxIs: DRENAJ_MAX_IS,
      maxMs: DRENAJ_MAX_MS,
      devreId: istenenDevreId
    });
    return res.status(200).json({
      sonuc: 'drenaj',
      islenen_sayisi: islenen.length,
      kalan_var,
      detay: islenen.map((s) => ({
        is_id: s.is_id,
        dosya: s.dosya || null,
        durum: s.durum || null,
        sonuc: s.sonuc,
        hata: s.hata || null
      }))
    });

  } catch (e) {
    return res.status(500).json({
      hata: 'Beklenmedik hata: ' + e.message,
      stack: e.stack?.split('\n').slice(0, 3).join(' | ')
    });
  }
}

// ───────────────────────────────────────────────────────────────
// 112/MK-112.1: DRENAJ TURU — maxDuration icinde ardisik is isle.
//   Bir tetik (buton/cron) ile maxIs kadar veya maxMs dolana dek bekleyenleri isler.
//   Vercel suspend tuzagina takilmaz (container zaten ayakta, ic dongu).
//   Cron istenirse (MK-112.2) bu cekirdegi cagirir — yeni mantik gerekmez.
//   Doner: { islenen: [birIsIsle sonucu...], kalan_var: bool }
// ───────────────────────────────────────────────────────────────
export async function drenajTuru(supa, baseUrl, opts = {}) {
  const maxIs = opts.maxIs ?? DRENAJ_MAX_IS;
  const maxMs = opts.maxMs ?? DRENAJ_MAX_MS;
  const devreId = opts.devreId || null;   // 112/A: verilirse sadece o devrenin bekleyenleri
  const baslangic = Date.now();
  const islenen = [];

  // 112/A (devre-ozgu drenaj): kuyrukta devre_id KOLONU YOK (sema: tenant_id, devre_dokuman_id, ...).
  //   Devre filtresi icin once o devrenin dokuman id'lerini cek; kuyrugu .in(devre_dokuman_id) ile daralt.
  //   devreId yoksa -> GLOBAL drenaj (geriye uyumlu; cron/genel tetik icin acik).
  let dokIdler = null;
  if (devreId) {
    const { data: doklar, error: dokErr } = await supa
      .from('devre_dokumanlari')
      .select('id')
      .eq('devre_id', devreId);
    if (dokErr) {
      console.error('[izo-drenaj] devre dokuman cekme hatasi:', dokErr.message);
      return { islenen, kalan_var: false };
    }
    dokIdler = (doklar || []).map((d) => d.id);
    if (dokIdler.length === 0) return { islenen, kalan_var: false };   // devrede dokuman yok
  }

  for (let i = 0; i < maxIs; i++) {
    // Zaman butcesi doldu mu? (is BASLAMADAN kontrol — maxDuration'i asma)
    if (Date.now() - baslangic >= maxMs) break;

    // Siradaki bekleyeni cek (en yuksek oncelik, en eski). Lock'u birIsIsle yapar.
    let q = supa
      .from('dosya_isleme_kuyrugu')
      .select('*')
      .eq('parser', 'izometri')
      .eq('durum', 'bekliyor');
    if (dokIdler) q = q.in('devre_dokuman_id', dokIdler);   // 112/A: devre-ozgu filtre
    q = q.order('oncelik', { ascending: false })
         .order('olusturma', { ascending: true })
         .limit(1);
    const { data, error } = await q;
    if (error) {
      console.error('[izo-drenaj] kuyruk okuma hatasi:', error.message);
      break;
    }
    if (!data || data.length === 0) break;   // kuyruk bos -> dur

    const is = data[0];
    let sonuc;
    try {
      sonuc = await birIsIsle(supa, baseUrl, is);
    } catch (e) {
      // Beklenmedik hata: is 'isleniyor'da kalir; stale-lock 5dk sonra toparlar (sonsuz dongu yok,
      //   cunku 'isleniyor' olan is bir daha 'bekliyor' filtresine takilmaz).
      console.error('[izo-drenaj] birIsIsle beklenmedik hata:', e.message);
      sonuc = { sonuc: 'hata', is_id: is.id, hata: 'beklenmedik: ' + e.message };
    }
    if (sonuc && '_status' in sonuc) delete sonuc._status;
    islenen.push(sonuc);
  }

  // Hala bekleyen var mi? (frontend tekrar-tetik / cron karari icin) — ayni devre filtresiyle.
  const kalan_var = await bekleyenVarMi(supa, dokIdler);
  return { islenen, kalan_var };
}

// Kuyrukta bekleyen izometri isi var mi? (hizli kontrol). dokIdler verilirse o devreye daraltir.
async function bekleyenVarMi(supa, dokIdler) {
  try {
    let q = supa
      .from('dosya_isleme_kuyrugu')
      .select('id')
      .eq('parser', 'izometri')
      .eq('durum', 'bekliyor');
    if (dokIdler) q = q.in('devre_dokuman_id', dokIdler);
    const { data } = await q.limit(1);
    return !!(data && data.length > 0);
  } catch (e) {
    console.error('[izo-drenaj] bekleyen kontrol hatasi (yutuldu):', e.message);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// TEK IS — lock -> dok -> indir -> izometri-oku -> durum yaz -> eslestir.
//   res'e DOKUNMAZ. Sonuc objesi doner (handler/drenajTuru kullanir).
//   _status: is_id modunda HTTP kodu icin (200 normal, 500 DB/sistem hatasi). Disari sizmaz.
// ───────────────────────────────────────────────────────────────
async function birIsIsle(supa, baseUrl, is, opts = {}) {
  // 113/A — CLIENT-LOOP skip-parse: tarayici (browser) PDF'i indirip izometri-oku'yu
  //   ZATEN cagirdiysa, sonucu (oncedenParse) gonderir. Bu modda server indir+izometri-oku
  //   adimini ATLAR -> server->server HTTP cagrisi YOK -> Vercel 508 (loop detected) YOK.
  //   opts verilmezse ESKI YOL (server indir+izometri-oku) calisir -> geriye tam uyum.
  const oncedenParse = opts.oncedenParse;
  const oncedenParseHttp = opts.oncedenParseHttp;
  const skipParse = (oncedenParse !== undefined && oncedenParse !== null);

  // 1) Durumu 'isleniyor' yap (lock)
  const { error: lockError } = await supa
    .from('dosya_isleme_kuyrugu')
    .update({
      durum: 'isleniyor',
      alindi_at: new Date().toISOString(),
      deneme_sayisi: (is.deneme_sayisi || 0) + 1
    })
    .eq('id', is.id);

  if (lockError) {
    return { _status: 500, sonuc: 'hata', is_id: is.id, hata: 'Lock alınamadı: ' + lockError.message };
  }

  // 2) Doküman bilgisini al
  const { data: dok, error: dokError } = await supa
    .from('devre_dokumanlari')
    .select('id, tenant_id, devre_id, storage_yolu, dosya_adi, uzanti, yukleyen_id')
    .eq('id', is.devre_dokuman_id)
    .single();

  if (dokError || !dok) {
    return await isiHataylaKapat(supa, is.id, 'Doküman bulunamadı: ' + (dokError?.message || 'null'));
  }

  // 113/A — okuJson/okuYanit kaynagi: skip modda tarayicidan, normal modda server fetch'inden.
  let okuYanit, okuJson;
  if (skipParse) {
    // CLIENT-LOOP: tarayici indirip izometri-oku'yu cagirdi; sonucu aynen kullan.
    okuJson = oncedenParse || {};
    const ph = (typeof oncedenParseHttp === 'number') ? oncedenParseHttp : 200;
    okuYanit = { ok: (ph >= 200 && ph < 300), status: ph };
  } else {
    // izometri-oku kullanici_id zorunlu kılar (yoksa 400 döner). Net hata ver.
    if (!dok.yukleyen_id) {
      return await isiHataylaKapat(supa, is.id, 'yukleyen_id boş — izometri-oku kullanici_id gerektirir');
    }

    // 3) Storage'dan indir → base64
    const { data: blob, error: dlError } = await supa
      .storage
      .from(BUCKET_ADI)
      .download(dok.storage_yolu);

    if (dlError || !blob) {
      return await isiHataylaKapat(supa, is.id, 'Storage indirme hatası: ' + (dlError?.message || 'blob null'));
    }

    const arrayBuffer = await blob.arrayBuffer();
    const pdf_base64 = Buffer.from(arrayBuffer).toString('base64');

    if (pdf_base64.length > MAX_BASE64_LEN) {
      const mb = (pdf_base64.length / 1024 / 1024).toFixed(1);
      return await isiHataylaKapat(supa, is.id, `PDF çok büyük (${mb}MB base64 > 7MB limit, ~5MB PDF)`);
    }

    // 4) izometri-oku'yu HTTP ile çağır (MK-49.1: çağır, dokunma)
    try {
      okuYanit = await fetch(`${baseUrl}/api/izometri-oku`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id:     dok.tenant_id,
          kullanici_id:  dok.yukleyen_id,
          batch_id:      null,            // her PDF kendi batch'i (yan etki — yukarı bkz.)
          pdf_base64,
          dosya_adi:     dok.dosya_adi,
          dosya_sirasi:  1,
          dosya_toplami: 1
        })
      });
      const t = await okuYanit.text();
      try { okuJson = t ? JSON.parse(t) : {}; } catch { okuJson = { _ham: t }; }
    } catch (e) {
      return await isiHataylaKapat(supa, is.id, 'izometri-oku çağrı hatası: ' + e.message);
    }
  }

  // 5) Durum belirle
  let yeniDurum, hataMesaji = null;
  const ok = okuYanit.ok && okuJson && okuJson.ok === true;

  if (!ok) {
    yeniDurum = 'hata';
    hataMesaji = (okuJson && (okuJson.error || okuJson.hata)) ||
                 `izometri-oku HTTP ${okuYanit.status}`;
  } else if ((okuJson.manuel_onay_sayisi || 0) > 0) {
    yeniDurum = 'manuel_onay';
  } else {
    yeniDurum = 'oneri_hazir';
  }

  // 6) Sonucu kuyruğa yaz (parse_sonuc = izometri-oku özeti, spoollar dahil)
  const { error: sonError } = await supa
    .from('dosya_isleme_kuyrugu')
    .update({
      durum: yeniDurum,
      bitis_at: new Date().toISOString(),
      parse_sonuc: ok ? okuJson : null,
      hata_mesaji: hataMesaji
    })
    .eq('id', is.id);

  if (sonError) {
    return { _status: 500, sonuc: 'hata', is_id: is.id, hata: 'Sonuç yazma hatası: ' + sonError.message };
  }

  // 7) Adim4 (MK-110.1): parse basariliysa spoollar'i kabuk spool'a esle (bindirme dahil).
  //    izometri-oku.js'e DOKUNULMAZ (MK-49.1) — bu adim worker'in parse SONRASI.
  //    Esleme hatasi parse'i gecersiz kilmaz (parse_sonuc zaten yazildi) — yut+logla.
  let eslesmeOzeti = null;
  if (ok && okuJson && Array.isArray(okuJson.spoollar)) {
    try {
      eslesmeOzeti = await eslestir(supa, dok.devre_id, is.id, okuJson, dok.id);
    } catch (eslErr) {
      console.error('[izo-eslestir] hata (yutuldu):', eslErr.message);
    }
  }

  return {
    _status: 200,
    sonuc: ok ? 'islendi' : 'hata',
    is_id: is.id,
    doc_id: dok.id,
    tenant_id: dok.tenant_id,
    devre_id: dok.devre_id,
    dosya: dok.dosya_adi,
    durum: yeniDurum,
    hata: hataMesaji,
    format: ok ? (okuJson.format || null) : null,
    izometri_batch_id: ok ? (okuJson.batch_id || null) : null,
    spool_sayisi: ok ? (okuJson.spool_sayisi || 0) : 0,
    manuel_onay_sayisi: ok ? (okuJson.manuel_onay_sayisi || 0) : 0,
    hazir_sayisi: ok ? (okuJson.hazir_sayisi || 0) : 0,
    sure_ms: ok ? (okuJson.sure_ms || null) : null,
    eslesme: eslesmeOzeti
  };
}

// ───────────────────────────────────────────────────────────────
// Yardımcı: işi hatayla kapat (res'e dokunmaz — sonuc objesi doner)
// ───────────────────────────────────────────────────────────────
async function isiHataylaKapat(supa, isId, mesaj) {
  await supa
    .from('dosya_isleme_kuyrugu')
    .update({
      durum: 'hata',
      bitis_at: new Date().toISOString(),
      hata_mesaji: mesaj
    })
    .eq('id', isId);

  return { _status: 500, sonuc: 'hata', is_id: isId, hata: mesaj };
}

// 'isleniyor'da 5dk+ takili kayitlar (worker crash) -> 'bekliyor' (3+ denemede 'hata').
async function staleLockTemizle(supa) {
  const STALE_DK = 5, MAX_DENEME = 3;
  const esik = new Date(Date.now() - STALE_DK * 60 * 1000).toISOString();
  try {
    const { data } = await supa
      .from('dosya_isleme_kuyrugu')
      .select('id, deneme_sayisi')
      .eq('parser', 'izometri')
      .eq('durum', 'isleniyor')
      .lt('alindi_at', esik);
    for (const s of (data || [])) {
      const yeni = (s.deneme_sayisi || 0) >= MAX_DENEME ? 'hata' : 'bekliyor';
      await supa
        .from('dosya_isleme_kuyrugu')
        .update({ durum: yeni, hata_mesaji: 'Stale lock — worker timeout/crash' })
        .eq('id', s.id);
    }
  } catch (e) {
    console.error('[izo-drenaj] stale lock temizleme hatasi (yutuldu):', e.message);
  }
}

// ───────────────────────────────────────────────────────────────
// Adim4 (MK-110.1 revize / MK-110.2): izometri PDF -> kabuk spool eslestirme.
// ───────────────────────────────────────────────────────────────
// ANAHTAR = devre (FK) + pipeline_no + spool_no.
//   MK-110.1 ilk hali "devre + spool_no" idi ve YANLISTI: bir devrede ayni spool_no (orn. S01)
//   ONLARCA farkli pipeline'da tekrar ediyor (canli: S01 -> 26 pipeline). Sadece spool_no ile
//   eslestirmek tum S01 PDF'lerini tek spool'a baglar (110'da 3 yanlis kismi yazildi, geri alindi).
//   Dogru tekil anahtar: (devre_id, pipeline_no, spool_no) — canli "no rows" ile dogrulandi.
//
// PIPELINE KAYNAGI = DOSYA ADI (parse_sonuc.dosya_adi). parse spoollar[].pipeline_no NULL geliyor.
//   dosyaAdiParse() formata-ozgu regex ile "M100-317-30-ALS 1(2).S01.1.pdf" -> {pipeline,spool}.
//   MK-110.1'in "dosya adi parse'i KULLANILMAZ" hukmu BURADA gevsetildi: pipeline disambiguation
//   icin dosya adi GEREKLI. Regex bu formata ozgu (Tersan/M100); baska format -> null -> atanmamis.
//
// A+B: regex tutarsa pipeline+spool ile eslestir (A). Tutmaz / pipeline kabukta yoksa -> ZORLAMA,
//   atanmamis birak (B). Yanlis eslesmektense eslesmesin (110'daki hata bunu ogretti).
// 2B: normSpoolNo + normPipeline (trim+upper) varyasyonlari yutar.
// 3C: eslesen spool 'bekliyor' ise 'kismi'ye yukselt. 'tam'/'kismi' -> DOKUNMA (MK-WIZARD.3).
// 4B: eslesmeyen -> _eslesme.detay[].durum='atanmamis' (+ sebep). Sema degismez (jsonb).
//
// supa: service-role client | devreId: uuid | kuyrukId: uuid
// okuJson: izometri-oku ciktisi (.spoollar + .dosya_adi bekleniyor)
// Doner: ozet {at, devre_id, dosya_adi, toplam, eslesen, atanmamis, yukseltilen, detay[]} | undefined
export const normSpoolNo  = (s) => String(s == null ? '' : s).trim().toUpperCase();
export const normPipeline = (s) => String(s == null ? '' : s).trim().toUpperCase();

// Dosya adindan {pipeline_no, spool_no} cikar. Formata-ozgu (Tersan/M100). Tutmazsa null.
//   "M100-317-30-ALS 1(2).S01.1.pdf" -> {pipeline_no:'M100-317-30-ALS', spool_no:'S01'}
//   "M100-317-55-ALS 1(2).S01_1.1.pdf" -> {..., spool_no:'S01_1'}
export function dosyaAdiParse(dosyaAdi) {
  if (!dosyaAdi || typeof dosyaAdi !== 'string') return null;
  const m = dosyaAdi.match(/^(.+?)(?:\s+\d+\(\d+\))?\.(S\d+(?:_\d+)?)\.\d+\.pdf$/i);
  if (!m) return null;
  return { pipeline_no: m[1].trim(), spool_no: m[2].toUpperCase() };
}

// 116/Is2: MONTAJ dosya adindan pipeline kokunu cikar. Montaj JSON'u pipeline_no TASIMAZ
//   (pipe_no null gelir -- oturum 116'da DOGRULANDI: PDF icinde PIPE NO = dosya adi koku).
//   Devre ici spool_no AMBIGU (M130-000-001 S01 vs M130-000-002 S01) -> pipeline SART.
//   Kok = dosya adi basi; opsiyonel " N(M)" parca eki; sonra [._]<rev>.pdf eki.
//   Iki aile: noktali (M130-000-002 1(2).1.pdf) + alt-cizgili (M130-000-001_1.pdf) -- ikisi de test edildi.
//   NOT: Sadece okuJson.montaj varken cagrilir; imalat (S segmentli) bu fonksiyona gelmez.
export function montajDosyaKok(dosyaAdi) {
  if (!dosyaAdi || typeof dosyaAdi !== 'string') return null;
  const m = dosyaAdi.match(/^(.+?)(?:\s+\d+\(\d+\))?[._]\d+\.pdf$/i);
  if (!m) return null;
  return m[1].trim();
}

export async function eslestir(supa, devreId, kuyrukId, okuJson, devreDokumanId) {
  if (!devreId || !okuJson) return;

  // 116/Is2: MONTAJ DALI. Montajda okuJson.spoollar=[] (115/MK-115.1); gercek veri okuJson.montaj'da.
  //   Montaj eslesmesi imalattan AYRI: bindirme/asme YOK (montaj agirligi != imalat agirligi,
  //   MK-111.2 ezme yok). Eslesen spool'a montaj_json YAZ (Karar 2-A); spooller.alistirma'ya
  //   DOKUNMA (Karar C). Imalat akisi degismez (montaj null -> bu blok atlanir).
  if (okuJson.montaj) {
    return await montajEslestir(supa, devreId, kuyrukId, okuJson, devreDokumanId);
  }

  if (!Array.isArray(okuJson.spoollar)) return;

  // Pipeline'i dosya adindan cikar (parse spoollar pipeline_no NULL).
  const dosyaAdi = okuJson.dosya_adi || null;
  const dosyaParse = dosyaAdiParse(dosyaAdi);   // {pipeline_no, spool_no} | null

  // O devredeki kabuk spool'lari cek. Anahtar = pipeline_no|spool_no (devre ici tekil).
  // 111/PARÇA2a: bindirme kiyasi icin et/cap/agirlik/yuzey de cekilir.
  const { data: spoollar, error: spErr } = await supa
    .from('spooller')
    .select('id, spool_no, pipeline_no, spool_id, cizim_durumu, et_kalinligi_mm, dis_cap_mm, agirlik, agirlik_kg, yuzey')
    .eq('devre_id', devreId)
    .eq('silindi', false);
  if (spErr) {
    console.error('[izo-eslestir] spool cekme hatasi:', spErr.message);
    return;
  }

  const harita = new Map();   // "PIPELINE|SPOOL" -> spool kaydi
  for (const sp of (spoollar || [])) {
    const k = normPipeline(sp.pipeline_no) + '|' + normSpoolNo(sp.spool_no);
    if (!harita.has(k)) harita.set(k, sp);
  }

  const detay = [];
  let yukseltilen = 0;

  for (const ps of okuJson.spoollar) {
    // Pipeline: dosya adindan (tum PDF tek pipeline). Spool: oncelik dosya adi, yoksa parse.
    const pipelineHam = dosyaParse?.pipeline_no || null;
    const spoolHam    = dosyaParse?.spool_no || ps.spool_no || null;

    let hedef = null, atanmaSebep = null;
    if (!pipelineHam) {
      atanmaSebep = 'dosya_adi_pipeline_yok';   // B: regex tutmadi -> zorlama
    } else if (!spoolHam) {
      atanmaSebep = 'spool_no_yok';
    } else {
      const anahtar = normPipeline(pipelineHam) + '|' + normSpoolNo(spoolHam);
      hedef = harita.get(anahtar) || null;
      if (!hedef) atanmaSebep = 'kabukta_yok';   // B: pipeline+spool devrede yok -> atanmamis
    }

    if (hedef) {
      // 111/PARÇA2a: PDF spool verisini kabuk spool'a bindir (et/çap/ağırlık/yüzey, %3 tolerans).
      // ps = parse_sonuc.spoollar[] elemani (et_mm, cap_mm, agirlik_kg, yuzey). hedef = kabuk spool.
      const b = bindir(ps, hedef);                 // {degisiklik, bindirme[], flagVar}
      const deg = Object.assign({}, b.degisiklik); // spooller UPDATE alanlari (bos olabilir)

      // 3C + MK-WIZARD.3: yalniz bekliyor -> kismi. Bindirme degisiklikleriyle TEK UPDATE'te birlesir.
      const bekliyorduMu = (hedef.cizim_durumu === 'bekliyor');
      if (bekliyorduMu) deg.cizim_durumu = 'kismi';

      if (Object.keys(deg).length > 0) {
        deg.guncelleme = new Date().toISOString();
        let q = supa.from('spooller').update(deg).eq('id', hedef.id);
        // cizim_durumu yukseltmesi varsa filtreli (yaris kosulu + idempotency); yoksa duz UPDATE.
        if (bekliyorduMu) q = q.eq('cizim_durumu', 'bekliyor');
        const { data: upData, error: upErr } = await q.select('id');
        if (upErr) console.error('[izo-eslestir] spooller update hatasi:', upErr.message);
        else if (bekliyorduMu && upData && upData.length > 0) yukseltilen++;
      }

      // 2b: PDF<->spool kalici bagi (spool detay sayfasi bu PDF'e erisecek). Idempotent.
      if (devreDokumanId) {
        const { error: dokErr } = await supa
          .from('devre_dokumanlari')
          .update({ spool_id: hedef.id })
          .eq('id', devreDokumanId);
        if (dokErr) console.error('[izo-eslestir] devre_dokumanlari.spool_id hatasi:', dokErr.message);
      }

      detay.push({
        spool_no: hedef.spool_no,
        pipeline_no: hedef.pipeline_no,
        durum: 'eslesti',
        spool_id: hedef.spool_id,
        spool_uuid: hedef.id,
        onceki_cizim_durumu: hedef.cizim_durumu,
        bindirme: b.bindirme,        // PARÇA2a: alan-bazli {kabuk,pdf,secilen,flag,sebep}
        bindirme_flag: b.flagVar     // celiski var mi (uyarilar sayfasi icin)
      });
    } else {
      detay.push({
        spool_no: spoolHam,
        pipeline_no: pipelineHam,
        durum: 'atanmamis',
        sebep: atanmaSebep
      });
    }
  }

  const ozet = {
    at: new Date().toISOString(),
    devre_id: devreId,
    dosya_adi: dosyaAdi,
    toplam: detay.length,
    eslesen: detay.filter(d => d.durum === 'eslesti').length,
    atanmamis: detay.filter(d => d.durum === 'atanmamis').length,
    yukseltilen,
    bindirme_flag_sayisi: detay.filter(d => d.bindirme_flag).length,   // PARÇA2a: celiskili eslesme sayisi
    detay
  };

  // parse_sonuc._eslesme yaz (oku-birlestir-yaz; mevcut parse_sonuc korunur).
  const { data: mevcut, error: okErr } = await supa
    .from('dosya_isleme_kuyrugu')
    .select('parse_sonuc')
    .eq('id', kuyrukId)
    .single();
  if (okErr) {
    console.error('[izo-eslestir] parse_sonuc okuma hatasi:', okErr.message);
    return ozet;  // spool yukseltmeleri zaten yapildi; meta yazilamadi ama ozeti dondur
  }
  const yeniParse = Object.assign({}, mevcut?.parse_sonuc || {}, { _eslesme: ozet });
  const { error: yzErr } = await supa
    .from('dosya_isleme_kuyrugu')
    .update({ parse_sonuc: yeniParse })
    .eq('id', kuyrukId);
  if (yzErr) console.error('[izo-eslestir] _eslesme yazma hatasi:', yzErr.message);

  return ozet;
}

// 116/Is2: MONTAJ eslesme. Montaj.spool_listesi (S01..) + pipeline (dosya adi koku) -> spooller
//   (devre_id sinirli, spool_no devre ici ambigu oldugundan pipeline SART). Eslesen spool'a
//   montaj ust-verisini montaj_json kolonuna YAZ (Karar 2-A). spooller.alistirma'ya DOKUNMA (Karar C).
//   Imalat bindirme/asme mantigi YOK -- montaj agirligi farkli anlam (MK-111.2 ezme yok).
//   devre_dokumanlari.spool_id YAZILMAZ: montaj 1-cok (bir montaj N spool kapsar), tek kolona sigmaz.
async function montajEslestir(supa, devreId, kuyrukId, okuJson, devreDokumanId) {
  const m = okuJson.montaj || {};
  const dosyaAdi = okuJson.dosya_adi || null;
  const pipelineKok = montajDosyaKok(dosyaAdi);   // pipeline = dosya adi koku | null
  const spoolListesi = Array.isArray(m.spool_listesi) ? m.spool_listesi : [];

  // Montaj ust-verisi (eslesen her spool'a yazilacak; alistirma salt-gosterim -- Karar C).
  const montajVeri = {
    pipeline_no: pipelineKok,
    blok: m.blok || null,
    sistem: m.sistem || null,
    yuzey: m.yuzey || null,
    guverte: Array.isArray(m.guverte) ? m.guverte : [],
    continue_baglanti: Array.isArray(m.continue_baglanti) ? m.continue_baglanti : [],
    toplam_agirlik_kg: (m.toplam_agirlik_kg != null) ? m.toplam_agirlik_kg : null,
    alistirma: m.alistirma || null,   // salt-gosterim; spooller.alistirma'ya YAZILMAZ (Karar C)
    tarih: m.tarih || null,
    kaynak_dosya: dosyaAdi,
    eslesme_at: new Date().toISOString(),
  };

  // O devredeki kabuk spool'lari cek (pipeline+spool anahtariyla harita).
  const { data: spoollar, error: spErr } = await supa
    .from('spooller')
    .select('id, spool_no, pipeline_no, spool_id')
    .eq('devre_id', devreId)
    .eq('silindi', false);
  if (spErr) {
    console.error('[izo-montaj-eslestir] spool cekme hatasi:', spErr.message);
    return;
  }
  const harita = new Map();   // "PIPELINE|SPOOL" -> spool kaydi
  for (const sp of (spoollar || [])) {
    const k = normPipeline(sp.pipeline_no) + '|' + normSpoolNo(sp.spool_no);
    if (!harita.has(k)) harita.set(k, sp);
  }

  const detay = [];
  for (const spoolNo of spoolListesi) {
    if (!pipelineKok) {
      detay.push({ spool_no: spoolNo, pipeline_no: null, durum: 'atanmamis', sebep: 'pipeline_kok_cikarilamadi' });
      continue;
    }
    const anahtar = normPipeline(pipelineKok) + '|' + normSpoolNo(spoolNo);
    const hedef = harita.get(anahtar) || null;
    if (!hedef) {
      detay.push({ spool_no: spoolNo, pipeline_no: pipelineKok, durum: 'atanmamis', sebep: 'kabukta_yok' });
      continue;
    }
    // Eslesen spool'a montaj_json yaz (idempotent: tekrar islemede uzerine yazar).
    const { error: upErr } = await supa
      .from('spooller')
      .update({ montaj_json: montajVeri, guncelleme: new Date().toISOString() })
      .eq('id', hedef.id);
    if (upErr) {
      console.error('[izo-montaj-eslestir] montaj_json yazma hatasi:', upErr.message);
      detay.push({ spool_no: spoolNo, pipeline_no: pipelineKok, durum: 'atanmamis', sebep: 'update_hata' });
      continue;
    }
    detay.push({ spool_no: hedef.spool_no, pipeline_no: hedef.pipeline_no, durum: 'eslesti', spool_id: hedef.spool_id, spool_uuid: hedef.id });
  }

  const ozet = {
    at: new Date().toISOString(),
    tip: 'montaj',
    devre_id: devreId,
    dosya_adi: dosyaAdi,
    pipeline_no: pipelineKok,
    toplam: detay.length,
    eslesen: detay.filter(d => d.durum === 'eslesti').length,
    atanmamis: detay.filter(d => d.durum === 'atanmamis').length,
    detay,
  };

  // parse_sonuc._eslesme yaz (oku-birlestir-yaz; mevcut parse_sonuc korunur).
  const { data: mevcut, error: okErr } = await supa
    .from('dosya_isleme_kuyrugu')
    .select('parse_sonuc')
    .eq('id', kuyrukId)
    .single();
  if (okErr) {
    console.error('[izo-montaj-eslestir] parse_sonuc okuma hatasi:', okErr.message);
    return ozet;
  }
  const yeniParse = Object.assign({}, mevcut?.parse_sonuc || {}, { _eslesme: ozet });
  const { error: yzErr } = await supa
    .from('dosya_isleme_kuyrugu')
    .update({ parse_sonuc: yeniParse })
    .eq('id', kuyrukId);
  if (yzErr) console.error('[izo-montaj-eslestir] _eslesme yazma hatasi:', yzErr.message);

  return ozet;
}
