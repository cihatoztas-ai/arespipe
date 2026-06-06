// api/devre-inceleme.js
// İnceleme & Onay okuma endpoint'i (oturum 127 / MK-127.3/4/5).
//
// AMAÇ: Bir taslak devrenin kabuk (Excel/BOM) spool'larını, o devreye yüklenmiş izometri
//   parse sonuçlarıyla eşleyip SPOOL BAŞINA 4-DURUM (okundu/zayif/eksik/fazla) döndürür.
//   devre_wizard_v3.html İnceleme tablosu bunu render eder; drenaj ilerledikçe yeniden çağrılır.
//
// SAF OKUMA — bu endpoint HİÇBİR ŞEYE YAZMAZ (spooller/parse_sonuc/devre_dokumanlari dokunulmaz).
//   Kanonik bağ (spool_id/cizim_durumu/montaj_json) TERFİDE yazılır (mevcut matcher, MK-127.4).
//   izometri-oku.js'e DOKUNULMAZ (MK-49.1).
//
// EŞLEŞTİRME = kanonik eşleştiriciyle (kuyruk-isle-izometri.js eslestir) BİREBİR aynı anahtar:
//   normPipeline(dosyaAdiParse(dosya_adi).pipeline_no) | normSpoolNo(spool_no).
//   Dosya adından pipeline çıkmazsa parse.pipeline_no'ya FALLBACK YOK — terfide sürpriz olmasın
//   (İnceleme = terfinin önizlemesi). Eşleşmeyen → 🟠 fazla, sebep ekranda (MK-124.1 görünür).
//
// A1 (oturum 127): 🟡 zayıf = AĞIRLIK+YÜZEY çelişkisi (bindir, Node'da sorunsuz) + düşük güven.
//   Et/çap çelişkisi sonraki turda (kabuk çapı client'tan gelince). Kabuk et/çap=null → bindir
//   onları "kabuk_bos_dolduruldu" sayar (flag:false) → A1'de et/çap asla yanlış 🟡 üretmez.
//
// Tetik: POST /api/devre-inceleme
//   Body: { devre_id: 'uuid', kabuk_spoollar: [ ARES_KABUK.grupla().spoollar ] }
//     kabuk_spoollar elemanı: { pipeline, spoolNo, rev, anaMalzeme, toplamKg, yuzeyHam }
//
// Env: SUPABASE_URL + SUPABASE_SERVICE_KEY (MK-101.4).

import { createClient } from '@supabase/supabase-js';
import { normPipeline, normSpoolNo, dosyaAdiParse, montajDosyaKok } from './kuyruk-isle-izometri.js';
import { bindir } from '../lib/bindir.js';
import { incelemeTablosu } from '../lib/izo-eslesme.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY;

export const config = { maxDuration: 30 };

// ── Kabuk spool (grupla şekli) → bindir'in beklediği "hedef" şekli.
//    A1: et/çap kabukta yok (null) → bindir kabuk_bos sayar, flag üretmez. Ağırlık+yüzey aktif.
function kabukBindirHedef(sp) {
  return {
    // W-2.20 (161): MK-139.1'den beri client cap/et GÖNDERİYOR (grupla başlıkta türetir) —
    //   "client göndermiyor" notu bayattı (MK-159.3 üçüncü vaka). Önizleme artık et/çap çelişkisini de görür.
    et_kalinligi_mm: (sp.et != null) ? sp.et : null,
    dis_cap_mm: (sp.cap != null) ? sp.cap : null,
    agirlik_kg: (sp.toplamKg != null) ? sp.toplamKg : null,
    yuzey: sp.yuzeyHam || null,
  };
}

/**
 * SAF ÇEKİRDEK — izometri kuyruk kayıtları + kabuk → incelemeTablosu girdisi (izometriler[]).
 * Test edilebilir; DB yok. Kanonik primitifler + bindir DIŞARIDAN gelir (tek kaynak).
 *
 * @param izoKayitlar [{ dosya_adi, islendi:bool, parse_sonuc }]
 * @param kabukSpoollar grupla().spoollar
 */
export function izometrileriDerle(izoKayitlar, kabukSpoollar) {
  // 138/A: ayni dosya_adi icin birden cok kuyruk kaydi (tekrar yukleme/yeniden-parse) olusabilir.
  //   En bilgilendirici kaydi sec; bos kopyalar Fazla (turuncu) uretmesin. Terfide de tek kanonik
  //   kayit eslesir (montaj dali). Skor: montaj{} 3 > spoollar dolu 2 > islendi 1 > bos 0.
  //   Esitlikte ilk gelen kalir. Adsiz kayitlar gruplanmaz, oldugu gibi gecer (gorunurluk korunur).
  const _ad = (kay) => ((kay && (kay.dosya_adi || (kay.parse_sonuc && kay.parse_sonuc.dosya_adi))) || '').toString().trim().toUpperCase();
  const _skor = (kay) => {
    const ps = kay && kay.parse_sonuc;
    if (!ps) return 0;
    if (ps.montaj) return 3;
    if (Array.isArray(ps.spoollar) && ps.spoollar.length > 0) return 2;
    if (kay.islendi) return 1;
    return 0;
  };
  const _enIyi = new Map();
  const _adsiz = [];
  for (const _k of (izoKayitlar || [])) {
    const ad = _ad(_k);
    if (!ad) { _adsiz.push(_k); continue; }
    const sk = _skor(_k);
    const onceki = _enIyi.get(ad);
    if (!onceki || sk > onceki.s) _enIyi.set(ad, { kay: _k, s: sk });
  }
  const calisilacak = Array.from(_enIyi.values(), (v) => v.kay).concat(_adsiz);

  // Kabuk anahtar → bindir hedefi (ağırlık/yüzey çelişki kıyası için)
  const kabukMap = new Map();
  for (const sp of (kabukSpoollar || [])) {
    const k = normPipeline(sp.pipeline) + '|' + normSpoolNo(sp.spoolNo);
    if (!kabukMap.has(k)) kabukMap.set(k, kabukBindirHedef(sp));
  }

  const izometriler = [];

  for (const kay of calisilacak) {
    const dosyaAdi = kay.dosya_adi || (kay.parse_sonuc && kay.parse_sonuc.dosya_adi) || null;

    // Henüz işlenmemiş → drenaj sürecek; isleniyor sayılır (anahtar yok).
    if (!kay.islendi || !kay.parse_sonuc) {
      izometriler.push({ dosya_adi: dosyaAdi, parse_durumu: 'bekliyor', anahtarlar: [], is_id: kay.is_id || null });
      continue;
    }

    const ps = kay.parse_sonuc;

    // ── 138/B(b) MONTAJ BELGE dalı: dosya adından DETERMİNİSTİK tespit (AI yok, MK-49.1 korunur).
    //   S-segmentsiz "*.1.pdf" montaj/genel çizimdir: dosyaAdiParse null AMA montajDosyaKok dolu.
    //   Spool çetelesine GİRMEZ → 🟠 Fazla üretmez. İçerik (montaj{}) varsa spool_listesi anahtara
    //   çevrilir (bağlı spool'lar görünür); yoksa (bayat cache) dosya adından montaj, icerik_okundu=false.
    const _mkok = montajDosyaKok(dosyaAdi);
    const _dpMontaj = dosyaAdiParse(dosyaAdi);
    if (_mkok && !_dpMontaj) {
      const liste = (ps.montaj && Array.isArray(ps.montaj.spool_listesi)) ? ps.montaj.spool_listesi : [];
      izometriler.push({
        dosya_adi: dosyaAdi, parse_durumu: 'tamamlandi',
        montaj_belge: true, is_id: kay.is_id || null,
        montaj_icerik_okundu: !!(ps.montaj && liste.length > 0),
        anahtarlar: liste.map((sp) => ({ pipeline: _mkok, spoolNo: sp })),
      });
      continue;
    }

    // ── MONTAJ (parse içeriği) dalı: nadiren S-segmentli ama montaj{} taşıyan PDF.
    if (ps.montaj) {
      const kok = montajDosyaKok(dosyaAdi);
      const liste = Array.isArray(ps.montaj.spool_listesi) ? ps.montaj.spool_listesi : [];
      izometriler.push({
        dosya_adi: dosyaAdi, parse_durumu: 'tamamlandi',
        montaj_belge: true, is_id: kay.is_id || null,
        montaj_icerik_okundu: !!(kok && liste.length > 0),
        anahtarlar: (kok ? liste.map((sp) => ({ pipeline: kok, spoolNo: sp })) : []),
      });
      continue;
    }

    // ── SPOOL (imalat) dalı
    const spoollar = Array.isArray(ps.spoollar) ? ps.spoollar : [];
    const dp = dosyaAdiParse(dosyaAdi);   // {pipeline_no, spool_no} | null — KANONİK, fallback yok

    const anahtarlar = [];
    let flagVar = false;
    let guven = null, etKaynagi = null, kritik = false;

    for (const psp of spoollar) {
      // KANONİK: pipeline yalnız dosya adından; spool dosya adı yoksa parse.
      const pl = dp ? dp.pipeline_no : null;
      const sn = (dp ? dp.spool_no : null) || psp.spool_no || null;
      if (!pl || !sn) continue;                    // anahtarsız → bu psp eşleşmeye katılamaz

      const a = { pipeline: pl, spoolNo: sn };
      anahtarlar.push(a);

      // A1: ağırlık+yüzey çelişkisi — eşleşen kabuk spool'una karşı bindir.
      const k = normPipeline(pl) + '|' + normSpoolNo(sn);
      const hedef = kabukMap.get(k);
      if (hedef) {
        const b = bindir(psp, hedef);              // {degisiklik, bindirme[], flagVar}
        if (b.flagVar) {
          flagVar = true;
          // W-2.20 (161): HANGİ alan çelişti — flag'li bindirme satırları anahtarla taşınır
          a.bindirme_celiski = b.bindirme.filter((x) => x.flag === true);
        }
      }
      // güven/seviye/kritik sinyalleri (psp seviyesinde)
      if (typeof psp.guven_skoru === 'number') guven = (guven == null) ? psp.guven_skoru : Math.min(guven, psp.guven_skoru);
      if (psp.et_kaynagi && !etKaynagi) etKaynagi = psp.et_kaynagi;
      if (psp.kritik_uyari_var === true) kritik = true;
    }

    if (anahtarlar.length === 0) {
      izometriler.push({
        dosya_adi: dosyaAdi, parse_durumu: 'tamamlandi', is_id: kay.is_id || null,
        anahtarlar: [], anahtar_yok_sebep: 'dosya_adi_pipeline_yok',
      });
    } else {
      izometriler.push({
        dosya_adi: dosyaAdi, parse_durumu: 'tamamlandi', is_id: kay.is_id || null,
        anahtarlar,
        et_kaynagi: etKaynagi, guven, bindirme_flag: flagVar,
        // NOT: A1'de kritik_uyari'yı 🟡 tetiği olarak KULLANMIYORUZ (Tersan'da çok yaygın = gürültü).
        //   Yalnız bindirme_flag (değer çelişkisi) + düşük güven 🟡 yapar. kritik bilgi olarak taşınır.
        kritik_uyari: false,
        _kritik_ham: kritik,    // ileride tanı/uyarı için (şimdilik durum etkilemez)
      });
    }
  }

  return izometriler;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ hata: 'POST gerekli' });
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ hata: 'Env eksik: SUPABASE_URL ve SUPABASE_SERVICE_KEY zorunlu' });
  }

  const devreId = req.body?.devre_id || null;
  const kabukSpoollar = Array.isArray(req.body?.kabuk_spoollar) ? req.body.kabuk_spoollar : [];
  if (!devreId) return res.status(400).json({ hata: 'devre_id zorunlu' });

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    // Devrenin izometri kuyruk kayıtlarını çek (parse_sonuc + dosya adı + durum). SADECE OKUMA.
    const { data: isler, error: qErr } = await supa
      .from('dosya_isleme_kuyrugu')
      .select('id, durum, parse_sonuc, devre_dokumanlari!inner(devre_id, dosya_adi, dokuman_tipi, silindi)')
      .eq('parser', 'izometri')
      .eq('devre_dokumanlari.devre_id', devreId)
      .eq('devre_dokumanlari.silindi', false);
    if (qErr) return res.status(500).json({ hata: 'Kuyruk okuma hatasi: ' + qErr.message });

    const izoKayitlar = (isler || []).map((is) => ({
      is_id: is.id,   // W-3.1 köprüsü (MK-159.2): format_tanit?is= hedefi
      dosya_adi: is.devre_dokumanlari?.dosya_adi || null,
      // İşlendi = parse_sonuc dolu (oneri_hazir/manuel_onay). bekliyor/isleniyor → henüz değil.
      islendi: !!is.parse_sonuc && ['oneri_hazir', 'manuel_onay'].includes(is.durum),
      parse_sonuc: is.parse_sonuc || null,
    }));

    const izometriler = izometrileriDerle(izoKayitlar, kabukSpoollar);
    const sonuc = incelemeTablosu({ kabukSpoollar, izometriler, guvenEsigi: 0.7 });

    // ── A2 (oturum 135): K2 malzeme kıyası enjeksiyonu — lib SAF kalır (izo-eslesme.js dokunulmaz).
    //   _eslesme.detay[] worker'da hazır (kuyruk-isle-izometri eslestir). Anahtar = kabuk anahtarıyla
    //   BİREBİR aynı (normPipeline|normSpoolNo). Yeniden hesaplama YOK — hazır raporu spool'a taşı.
    //   Bir spool'a birden çok izometri (detay+montaj) düşerse: malzeme_flag'i olan ilk kayıt kazanır
    //   (flag yoksa ilk bulunan). Soft sapma lib'de zaten celiski dışında — UI ek filtre gerektirmez.
    const malzemeHarita = new Map();   // "PIPE|SPOOL" -> { malzeme_flag, malzeme_kiyas }
    for (const kay of izoKayitlar) {
      const detay = kay.parse_sonuc && kay.parse_sonuc._eslesme && Array.isArray(kay.parse_sonuc._eslesme.detay)
        ? kay.parse_sonuc._eslesme.detay : null;
      if (!detay) continue;
      for (const d of detay) {
        if (d.durum !== 'eslesti' || !d.malzeme_kiyas) continue;
        const k = normPipeline(d.pipeline_no) + '|' + normSpoolNo(d.spool_no);
        const onceki = malzemeHarita.get(k);
        // flag'li kayit oncelikli; flag yoksa ilk gelen kalir.
        if (!onceki || (d.malzeme_flag && !onceki.malzeme_flag)) {
          malzemeHarita.set(k, { malzeme_flag: !!d.malzeme_flag, malzeme_kiyas: d.malzeme_kiyas });
        }
      }
    }
    let malzemeFlagSay = 0;
    for (const s of (sonuc.spoollar || [])) {
      const k = normPipeline(s.pipeline) + '|' + normSpoolNo(s.spoolNo);
      const m = malzemeHarita.get(k);
      s.malzeme_flag = m ? m.malzeme_flag : false;
      s.malzeme_kiyas = m ? m.malzeme_kiyas : null;
      if (s.malzeme_flag) malzemeFlagSay++;
    }
    if (sonuc.ozet) sonuc.ozet.malzeme_flag = malzemeFlagSay;   // özet şeridi/istatistik için

    // ── W-2.20 (161): bindirme çelişki DETAYI enjeksiyonu — K2 deseniyle aynı (lib SAF kalır).
    //   izometrileriDerle anahtarlarına iliştirilen flag'li bindirme satırları spool'a taşınır;
    //   operatör HANGİ alanın çeliştiğini modalda görür. İlk çelişkili kayıt kazanır (malzeme kuralı).
    const bindirmeHarita = new Map();   // "PIPE|SPOOL" -> { dosya_adi, celiski[] }
    for (const z of izometriler) {
      for (const a of (z.anahtarlar || [])) {
        if (!a.bindirme_celiski || !a.bindirme_celiski.length) continue;
        const kb = normPipeline(a.pipeline) + '|' + normSpoolNo(a.spoolNo);
        if (!bindirmeHarita.has(kb)) bindirmeHarita.set(kb, { dosya_adi: z.dosya_adi || null, celiski: a.bindirme_celiski });
      }
    }
    for (const s of (sonuc.spoollar || [])) {
      const kb = normPipeline(s.pipeline) + '|' + normSpoolNo(s.spoolNo);
      const bc = bindirmeHarita.get(kb);
      s.bindirme_celiski = bc ? bc.celiski : null;
      s.bindirme_dosya = bc ? bc.dosya_adi : null;
    }

    // ── W-3.1 köprüsü (MK-159.2): iş id'sini satıra taşı — lib SAF kalır (K2 enjeksiyon deseni).
    //   format_tanit?is=<id>&kaynak=devre hedefi. Eşleme dosya_adi üzerinden (derlenen kanonik kayıtlar).
    const isIdHarita = new Map();
    for (const z of izometriler) { if (z.dosya_adi && z.is_id) isIdHarita.set(z.dosya_adi, z.is_id); }
    // 160: parse_sonuc haritası (dosya_adi → ps) — spoollar dolu kayıt tercih edilir (bayat/boş kopya MK-138.1)
    const psHarita = new Map();
    for (const z of izoKayitlar) {
      if (!z.dosya_adi || !z.parse_sonuc) continue;
      const eski2 = psHarita.get(z.dosya_adi);
      if (eski2 && (eski2.spoollar || []).length && !(z.parse_sonuc.spoollar || []).length) continue;
      psHarita.set(z.dosya_adi, z.parse_sonuc);
    }
    const _norm = (v) => String(v == null ? '' : v).trim().toUpperCase();
    for (const s of (sonuc.spoollar || [])) {
      if (!s.izometri || !s.izometri.dosya_adi) continue;
      s.izometri.is_id = isIdHarita.get(s.izometri.dosya_adi) || null;
      // 160 (Cihat bulgusu): PDF'in okuduğu alıştırma/NOT/yüzey önizlemede de görünsün — taslakta
      //   spooller YOK (MK-157.1), eslestir bu alanları ancak terfi sonrası yazar. Önizleme satırına
      //   AYNI kurallarla türetilip taşınır; kalıcı yazım yine terfi/eslestir hattında.
      const ps = psHarita.get(s.izometri.dosya_adi);
      // 164/A v2.1: parse_sonuc kökündeki format_id önizleme izometrisine taşınır —
      //   izometri-kaynaklı düzeltmeler (G2a) formata adreslenebilsin.
      if (ps && s.izometri.format_id == null) s.izometri.format_id = ps.format_id || null;
      const dal = ps ? (((ps.spoollar || []).find((d) => _norm(d.spool_no) === _norm(s.spoolNo)))
                       || (((ps.spoollar || []).length === 1) ? ps.spoollar[0] : null)) : null;
      // 117 kuralı BİREBİR (kuyruk-isle-izometri ~587): dosya adı ALS → VAR; değilse alistirma_ipucu
      const _als = /(?:^|[-_ ])ALS(?:[-_. ]|$)/i.test(s.izometri.dosya_adi) ? 'VAR'
                 : ((dal && dal.alistirma_ipucu) || null);
      if (s.alistirma == null && _als) s.alistirma = _als;
      if (s.not == null && dal && dal.not_metni) s.not = dal.not_metni;
      // bindir'in kabuk_bos_dolduruldu kuralıyla uyumlu: kabuk yüzeyi boşsa PDF yüzeyi gösterilir
      if ((s.yuzeyHam == null || s.yuzeyHam === '') && dal && dal.yuzey) s.yuzeyHam = dal.yuzey;
    }
    for (const f of (sonuc.fazla || [])) { if (f.dosya_adi) f.is_id = isIdHarita.get(f.dosya_adi) || null; }

    return res.status(200).json({ ok: true, devre_id: devreId, ...sonuc });
  } catch (e) {
    return res.status(500).json({
      hata: 'Beklenmedik hata: ' + e.message,
      stack: e.stack?.split('\n').slice(0, 3).join(' | '),
    });
  }
}
