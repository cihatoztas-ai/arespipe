// =====================================================================
// api/batch-spoollari.js -- 49. oturum
// =====================================================================
// Async batch tamamlandıktan sonra frontend bu endpoint'i çağırır,
// tüm dosyaların parse edilmiş spool listesini düz olarak alır.
// Excel export ve ana sayfa tablosu için kullanılır.
//
// Sözleşme:
//   GET /api/batch-spoollari?batch_id=xxx
//   Response: {
//     batch: { id, durum, dosya_sayisi },
//     spoollar: [
//       {
//         _dosya: "PAOR-50600-101514.pdf",
//         _batch_id: "...",
//         spool_no, pipeline_no, dn, cap_mm, kalite, malzeme,
//         et_mm, boy_mm, yuzey, rev, agirlik_kg,
//         _manuel_onay, malzeme_listesi, ...
//       }
//     ],
//     toplam_spool: 24
//   }
//
// Akış:
//   1. is_kuyrugu'ndan başarılı kayıtların storage_path + dosya_adi'ları al
//   2. Her dosya için ai_api_log'da en son başarılı kaydı bul
//      (cevap_full JSON'undaki spoollar dizisi)
//   3. Tüm spool'ları flatten et, _dosya ve _batch_id ile zenginleştir
//
// Süre: ~500ms-2s (50 dosyalık batch için 50 paralel SELECT). maxDuration 30 yeterli.
// =====================================================================

export const config = { maxDuration: 30 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase env eksik' });
    }

    const { batch_id } = req.query;
    if (!batch_id) return res.status(400).json({ error: 'batch_id zorunlu' });
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batch_id)) {
      return res.status(400).json({ error: 'batch_id geçerli UUID degil' });
    }

    // --- 1. Batch metadata ---
    const batchData = await supaFetch(
      `izometri_batch_kayitlari?id=eq.${batch_id}&select=id,durum,dosya_sayisi,tenant_id,sonuc_json`
    );
    if (!batchData || batchData.length === 0) {
      return res.status(404).json({ error: 'Batch bulunamadi' });
    }
    const batch = batchData[0];

    // --- 2. Hızlı yol: izometri_batch_kayitlari.sonuc_json doluysa onu kullan ---
    // izometri-oku.js akışı her başarılı parse'da batch'in sonuc_json'una ekleme yapıyor.
    // Format: { spoollar: [...], dosya_sonuclari: [...] }  (obje, doğrudan spool array'i değil)
    // Bu hızlı yol, ek sorgu gerektirmez.
    if (batch.sonuc_json && typeof batch.sonuc_json === 'object') {
      var spoollar = duzlestir(batch.sonuc_json, batch_id);
      if (spoollar.length > 0) {
        console.log(`[batch-spoollari] Hizli yol: sonuc_json'dan ${spoollar.length} spool`);
        return res.status(200).json({
          batch: { id: batch.id, durum: batch.durum, dosya_sayisi: batch.dosya_sayisi },
          spoollar,
          toplam_spool: spoollar.length,
          kaynak: 'sonuc_json',
        });
      }
    }

    // --- 3. Yedek yol: ai_api_log'dan dosya başına en son cevap_full ---
    // Eğer izometri-oku sonuc_json'a yazmıyorsa (ya da cache hit'te boş kaldıysa)
    // ai_api_log'dan tek tek çekeriz. Bu yol yavaştır ama defansif.
    const tamamKayitlar = await supaFetch(
      `is_kuyrugu?batch_id=eq.${batch_id}&durum=eq.tamam&select=id,dosya_adi,storage_path&order=dosya_sirasi.asc`
    );

    if (!tamamKayitlar || tamamKayitlar.length === 0) {
      return res.status(200).json({
        batch: { id: batch.id, durum: batch.durum, dosya_sayisi: batch.dosya_sayisi },
        spoollar: [],
        toplam_spool: 0,
        kaynak: 'bos',
      });
    }

    // Her dosya için ai_api_log'da en son başarılı kaydı bul (paralel)
    const dosyaCevaplari = await Promise.all(
      tamamKayitlar.map(async (k) => {
        const dosyaAdiEnc = encodeURIComponent(k.dosya_adi);
        const log = await supaFetch(
          `ai_api_log?tenant_id=eq.${batch.tenant_id}&basarili=eq.true&select=cevap_full,olusturma_at&dosya_adi=eq.${dosyaAdiEnc}&order=olusturma_at.desc&limit=1`
        ).catch(() => []);
        return { dosya_adi: k.dosya_adi, log: log?.[0] };
      })
    );

    const spoollar = [];
    for (const dc of dosyaCevaplari) {
      if (!dc.log?.cevap_full?.spoollar) continue;
      for (const sp of dc.log.cevap_full.spoollar) {
        spoollar.push({
          ...sp,
          _dosya: dc.dosya_adi,
          _batch_id: batch_id,
          _manuel_onay: sp.durum === 'manuel_onay',
        });
      }
    }

    console.log(`[batch-spoollari] Yedek yol: ai_api_log'dan ${spoollar.length} spool`);
    return res.status(200).json({
      batch: { id: batch.id, durum: batch.durum, dosya_sayisi: batch.dosya_sayisi },
      spoollar,
      toplam_spool: spoollar.length,
      kaynak: 'ai_api_log',
    });

  } catch (e) {
    console.error('[batch-spoollari] Beklenmedik hata:', e);
    return res.status(500).json({ error: e.message });
  }
}

// =====================================================================
// HELPER: sonuc_json'u flatten et
// =====================================================================
// izometri-oku.js'in yazdığı gerçek format (incelenen, 49.7 testi):
//   {
//     spoollar: [ { spool_no, pipeline_no, dn, kalite, ... }, ... ],
//     dosya_sonuclari: [ { dosya_adi, dosya_sirasi, spool_sayisi, ... } ]
//   }
// Spoollar dosya_adi içermiyor doğrudan. Eşleştirme `dosya_sirasi` üzerinden
// olabilir veya tek dosya batch'lerde dosya_sonuclari[0].dosya_adi her spool'a atanır.
//
// Yedek: doğrudan array gelirse onu da kabul et (eski format / başka sürüm).
// =====================================================================
function duzlestir(sonuc_json, batch_id) {
  var spoollar = [];

  // Format A: { spoollar: [...], dosya_sonuclari: [...] }  — gerçek izometri-oku format
  if (sonuc_json.spoollar && Array.isArray(sonuc_json.spoollar)) {
    var dosyaSonuclari = sonuc_json.dosya_sonuclari || [];
    var dosyaSirasiMap = {};  // dosya_sirasi → dosya_adi

    dosyaSonuclari.forEach(function(ds) {
      if (ds.dosya_sirasi != null && ds.dosya_adi) {
        dosyaSirasiMap[ds.dosya_sirasi] = ds.dosya_adi;
      }
    });

    // Tek dosyalı batch ise tüm spool'lar bu dosyaya ait
    var tekDosyaAdi = dosyaSonuclari.length === 1 ? dosyaSonuclari[0].dosya_adi : null;

    sonuc_json.spoollar.forEach(function(sp) {
      var dosyaAd = sp._dosya
                 || (sp.dosya_sirasi != null && dosyaSirasiMap[sp.dosya_sirasi])
                 || tekDosyaAdi
                 || '?';
      spoollar.push(Object.assign({}, sp, {
        _dosya: dosyaAd,
        _batch_id: batch_id,
        _manuel_onay: sp.durum === 'manuel_onay',
      }));
    });

    return spoollar;
  }

  // Format B: doğrudan array  — yedek/eski format
  if (Array.isArray(sonuc_json)) {
    for (var i = 0; i < sonuc_json.length; i++) {
      var item = sonuc_json[i];
      if (item.spoollar && Array.isArray(item.spoollar)) {
        // Format B1: array of { dosya_adi, spoollar }
        item.spoollar.forEach(function(sp) {
          spoollar.push(Object.assign({}, sp, {
            _dosya: item.dosya_adi || sp._dosya || '?',
            _batch_id: batch_id,
            _manuel_onay: sp.durum === 'manuel_onay',
          }));
        });
      } else if (item.spool_no || item.pipeline_no) {
        // Format B2: array of spool objects
        spoollar.push(Object.assign({}, item, {
          _batch_id: batch_id,
          _manuel_onay: item.durum === 'manuel_onay',
        }));
      }
    }
    return spoollar;
  }

  // Format bilinmeyen - boş döndür (yedek yol tetiklenir)
  console.warn('[batch-spoollari] duzlestir: bilinmeyen sonuc_json formati', typeof sonuc_json);
  return spoollar;
}

// =====================================================================
// SUPABASE HELPER
// =====================================================================
async function supaFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {}),
  };
  const fetchOpts = { method: options.method || 'GET', headers };
  if (options.body) fetchOpts.body = JSON.stringify(options.body);

  const res = await fetch(url, fetchOpts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch { data = text; }

  if (!res.ok) {
    console.error('[supaFetch] hata:', path, res.status, data);
    throw new Error(`Supabase ${res.status}: ${typeof data === 'string' ? data : data?.message || 'bilinmeyen'}`);
  }
  return data;
}
