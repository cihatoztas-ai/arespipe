// api/kuyruk-isle-izometri.js
// Wizard'a yüklenen izometri PDF dokümanlarını parse eder, sonucu kuyrukta saklar.
// 107. oturum (21 Mayıs 2026) — MK-49.B
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
// Akış:
//   1. Kuyruktan bekleyen 'izometri' işi çek (en yüksek öncelik, en eski)
//   2. Durumu 'isleniyor' yap (lock)
//   3. devre_dokumanlari'ndan storage_yolu + yukleyen_id al
//   4. Supabase Storage'dan PDF'i indir → base64
//   5. /api/izometri-oku'ya POST (fingerprint→L2→L3, MK-49.1 sadece çağrı)
//   6. Sonuca göre durum:
//        ok:true + manuel_onay_sayisi === 0  →  'oneri_hazir'
//        ok:true + manuel_onay_sayisi > 0    →  'manuel_onay'
//        ok:false / HTTP hata                →  'hata'
//   7. parse_sonuc'a izometri-oku özetini (spoollar dahil) yaz, bitis_at güncelle
//
// Bu endpoint DB'ye spool INSERT YAPMAZ. Sadece parse eder + sonucu saklar.
// Onay UI (sonraki oturum) parse_sonuc'u okuyup spooller'a INSERT edecek.
//
// YAN ETKİ: izometri-oku her çağrıda izometri_batch_kayitlari'na bir batch açar
//   (MK-49.1 gereği önlenemez). Wizard akışında bu batch kayıtları kullanılmaz —
//   her PDF için bir "yetim" batch oluşur. Pilot için kabul edilebilir teknik borç.
//
// Tetik: POST /api/kuyruk-isle-izometri
//   Body: yok (kuyruktan en yüksek öncelikli bekleyeni alır)
//   Veya: { is_id: 'uuid' } — spesifik işi zorla (wizard bunu kullanır)
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

  // Spesifik is_id mi yoksa kuyruktan ilk bekleyen mi?
  const istenenIsId = req.body?.is_id || null;

  try {
    // 108/Adim3: stale lock temizligi — 'isleniyor'da 5dk+ takili izometri isleri (worker crash)
    //            geri 'bekliyor'a alinir; 3+ denemede 'hata' (sonsuz Vision dongusu engeli).
    await staleLockTemizle(supa);

    // 1) Kuyruktan iş çek
    let is;
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
      is = data;
    } else {
      const { data, error } = await supa
        .from('dosya_isleme_kuyrugu')
        .select('*')
        .eq('parser', 'izometri')
        .eq('durum', 'bekliyor')
        .order('oncelik', { ascending: false })
        .order('olusturma', { ascending: true })
        .limit(1);
      if (error) {
        return res.status(500).json({ hata: 'Kuyruk okunamadı: ' + error.message });
      }
      if (!data || data.length === 0) {
        return res.status(200).json({
          sonuc: 'bos',
          mesaj: 'Bekleyen izometri işi yok'
        });
      }
      is = data[0];
    }

    // 2) Durumu 'isleniyor' yap (lock)
    const { error: lockError } = await supa
      .from('dosya_isleme_kuyrugu')
      .update({
        durum: 'isleniyor',
        alindi_at: new Date().toISOString(),
        deneme_sayisi: (is.deneme_sayisi || 0) + 1
      })
      .eq('id', is.id);

    if (lockError) {
      return res.status(500).json({ hata: 'Lock alınamadı: ' + lockError.message });
    }

    // 3) Doküman bilgisini al
    const { data: dok, error: dokError } = await supa
      .from('devre_dokumanlari')
      .select('id, tenant_id, devre_id, storage_yolu, dosya_adi, uzanti, yukleyen_id')
      .eq('id', is.devre_dokuman_id)
      .single();

    if (dokError || !dok) {
      return await isiHataylaKapat(
        supa, is.id, res,
        'Doküman bulunamadı: ' + (dokError?.message || 'null')
      );
    }

    // izometri-oku kullanici_id zorunlu kılar (yoksa 400 döner). Net hata ver.
    if (!dok.yukleyen_id) {
      return await isiHataylaKapat(
        supa, is.id, res,
        'yukleyen_id boş — izometri-oku kullanici_id gerektirir'
      );
    }

    // 4) Storage'dan indir → base64
    const { data: blob, error: dlError } = await supa
      .storage
      .from(BUCKET_ADI)
      .download(dok.storage_yolu);

    if (dlError || !blob) {
      return await isiHataylaKapat(
        supa, is.id, res,
        'Storage indirme hatası: ' + (dlError?.message || 'blob null')
      );
    }

    const arrayBuffer = await blob.arrayBuffer();
    const pdf_base64 = Buffer.from(arrayBuffer).toString('base64');

    if (pdf_base64.length > MAX_BASE64_LEN) {
      const mb = (pdf_base64.length / 1024 / 1024).toFixed(1);
      return await isiHataylaKapat(
        supa, is.id, res,
        `PDF çok büyük (${mb}MB base64 > 7MB limit, ~5MB PDF)`
      );
    }

    // 5) izometri-oku'yu HTTP ile çağır (MK-49.1: çağır, dokunma)
    let okuYanit, okuJson;
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
      return await isiHataylaKapat(
        supa, is.id, res,
        'izometri-oku çağrı hatası: ' + e.message
      );
    }

    // 6) Durum belirle
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

    // 7) Sonucu kuyruğa yaz (parse_sonuc = izometri-oku özeti, spoollar dahil)
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
      return res.status(500).json({
        hata: 'Sonuç yazma hatası: ' + sonError.message,
        is_id: is.id
      });
    }

    // 7.5) Adim4 (MK-110.1): parse basariliysa spoollar'i kabuk spool'a esle.
    //      devre context FK'dan (dok.devre_id); anahtar = devre_id + spool_no (normSpoolNo).
    //      izometri-oku.js'e DOKUNULMAZ (MK-49.1) — bu adim worker'in parse SONRASI.
    //      Esleme hatasi parse'i gecersiz kilmaz (parse_sonuc zaten yazildi) — yut+logla.
    let eslesmeOzeti = null;
    if (ok && okuJson && Array.isArray(okuJson.spoollar)) {
      try {
        eslesmeOzeti = await eslestir(supa, dok.devre_id, is.id, okuJson, dok.id);
      } catch (eslErr) {
        console.error('[izo-eslestir] hata (yutuldu):', eslErr.message);
      }
    }

    // 108/Adim3: self-chain — kuyrukta baska bekleyen izometri varsa kendini fire-and-forget
    //            tetikle. Sirali drenaj (her is bitince bir sonrakini cagirir, kuyruk bosalinca durur).
    await zincirDevam(supa);

    return res.status(200).json({
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
      eslesme: eslesmeOzeti   // Adim4: {toplam, eslesen, atanmamis, yukseltilen} | null
    });

  } catch (e) {
    return res.status(500).json({
      hata: 'Beklenmedik hata: ' + e.message,
      stack: e.stack?.split('\n').slice(0, 3).join(' | ')
    });
  }
}

// ───────────────────────────────────────────────────────────────
// Yardımcı: işi hatayla kapat
// ───────────────────────────────────────────────────────────────

async function isiHataylaKapat(supa, isId, res, mesaj) {
  await supa
    .from('dosya_isleme_kuyrugu')
    .update({
      durum: 'hata',
      bitis_at: new Date().toISOString(),
      hata_mesaji: mesaj
    })
    .eq('id', isId);

  // 108/Adim3: hata da olsa drenaji surdur (kalan bekleyenler islensin)
  await zincirDevam(supa);

  return res.status(500).json({
    sonuc: 'hata',
    is_id: isId,
    hata: mesaj
  });
}

// ───────────────────────────────────────────────────────────────
// 108/Adim3: self-chain drenaj + stale lock temizligi
// ───────────────────────────────────────────────────────────────

// Kuyrukta baska bekleyen izometri isi varsa kendini fire-and-forget tetikle (sirali zincir).
async function zincirDevam(supa) {
  try {
    const { data } = await supa
      .from('dosya_isleme_kuyrugu')
      .select('id')
      .eq('parser', 'izometri')
      .eq('durum', 'bekliyor')
      .limit(1);
    if (data && data.length > 0) {
      const baseUrl = selfBaseUrl();
      if (!baseUrl) return;
      // fire-and-forget (kuyruk-isle.js ile ayni desen): await yok, response'tan once tetiklenir.
      fetch(`${baseUrl}/api/kuyruk-isle-izometri`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      }).catch((e) => console.error('[izo-drenaj] zincir tetik hatasi (yutuldu):', e.message));
    }
  } catch (e) {
    console.error('[izo-drenaj] zincir kontrol hatasi (yutuldu):', e.message);
  }
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

export async function eslestir(supa, devreId, kuyrukId, okuJson, devreDokumanId) {
  if (!devreId || !okuJson || !Array.isArray(okuJson.spoollar)) return;

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
