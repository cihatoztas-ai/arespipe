// =====================================================================
// api/kuyruk-durum.js -- 49. oturum, polling endpoint
// =====================================================================
// Frontend her 2-3 saniyede bunu çağırır, batch'in ilerleme durumunu
// alır. Detaylı (her dosyanın durumu) + özet sayılar + paginasyon.
//
// Sözleşme:
//   GET /api/kuyruk-durum?batch_id=xxx&limit=200&offset=0&sadece_hata=false
//   Response: {
//     batch: { id, durum, dosya_sayisi, olusturma_at, baslangic_at, bitis_at },
//     ozet: { bekliyor, isleniyor, tamam, hata, iptal,
//             ilerleme_yuzde, tamamlandi },
//     kayitlar: [
//       { id, dosya_adi, dosya_sirasi, durum, deneme_sayisi,
//         hata_mesaji, parse_baslangic_at, parse_bitis_at,
//         olusturma_at, guncelleme_at, storage_path }
//     ],
//     toplam_kayit: 50,
//     gosterilen: { offset: 0, limit: 200, count: 50 }
//   }
//
// Akış:
//   1. Validasyon (batch_id zorunlu)
//   2. Batch metadata (izometri_batch_kayitlari)
//   3. Özet sayıları topla (durum'a göre GROUP BY benzeri — Postgrest ile filter+count)
//   4. Detay kayıtları çek (limit/offset, sadece_hata filtresi)
//   5. Cevap birleştir
//
// 49 mimari notu: Bu endpoint salt-okunur. Eylem endpoint'leri
//   (yeniden-dene, sil, indir) 51+'a ertelendi.
//
// Süre: ~100-300ms (3 paralel sorgu). maxDuration 10 yeterli.
// =====================================================================

export const config = { maxDuration: 10 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

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

    // --- Query parametreleri ---
    const { batch_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const sadece_hata = req.query.sadece_hata === 'true';

    if (!batch_id) {
      return res.status(400).json({ error: 'batch_id zorunlu' });
    }

    // UUID format kontrolü (defansif — SQL injection değil ama tip emniyeti)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batch_id)) {
      return res.status(400).json({ error: 'batch_id geçerli UUID degil' });
    }

    // --- 3 sorguyu paralel çalıştır ---
    const [batchData, ozetData, kayitlar] = await Promise.all([
      // 1) Batch metadata
      supaFetch(
        `izometri_batch_kayitlari?id=eq.${batch_id}&select=id,durum,format_durumu,dosya_sayisi,olusturma_at,baslangic_at,bitis_at`
      ),

      // 2) Özet sayıları — durum'a göre count
      durumOzetiCek(batch_id),

      // 3) Detay kayıtlar
      kayitlariCek(batch_id, limit, offset, sadece_hata),
    ]);

    // --- Batch yoksa 404 ---
    if (!batchData || batchData.length === 0) {
      return res.status(404).json({ error: 'Batch bulunamadi' });
    }
    const batch = batchData[0];

    // --- Özet hesapla ---
    const tamam = ozetData.tamam || 0;
    const bekliyor = ozetData.bekliyor || 0;
    const isleniyor = ozetData.isleniyor || 0;
    const hata = ozetData.hata || 0;
    const iptal = ozetData.iptal || 0;
    const toplam = tamam + bekliyor + isleniyor + hata + iptal;

    // İlerleme yüzdesi: (tamam + hata + iptal) / toplam
    // — hata ve iptal de "bitmiş" sayılır, batch durmaz
    const bitmis = tamam + hata + iptal;
    const ilerleme_yuzde = toplam > 0 ? Math.round((bitmis / toplam) * 100) : 0;
    const tamamlandi = bekliyor === 0 && isleniyor === 0 && toplam > 0;

    // --- Cevap ---
    return res.status(200).json({
      batch: {
        id: batch.id,
        durum: batch.durum,
        format_durumu: batch.format_durumu,
        dosya_sayisi: batch.dosya_sayisi,
        olusturma_at: batch.olusturma_at,
        baslangic_at: batch.baslangic_at,
        bitis_at: batch.bitis_at,
      },
      ozet: {
        bekliyor,
        isleniyor,
        tamam,
        hata,
        iptal,
        toplam,
        ilerleme_yuzde,
        tamamlandi,
      },
      kayitlar: kayitlar || [],
      toplam_kayit: toplam,
      gosterilen: {
        offset,
        limit,
        count: kayitlar?.length || 0,
        sadece_hata,
      },
    });

  } catch (e) {
    console.error('[kuyruk-durum] Beklenmedik hata:', e);
    return res.status(500).json({ error: e.message });
  }
}

// =====================================================================
// DURUM ÖZETİ — Postgrest ile her durum için count çek
// =====================================================================
// Postgrest GROUP BY desteklemiyor, her durum için ayrı count sorgusu.
// 5 paralel sorgu = ~50-100ms toplam (paralel olduğu için lineer değil).
async function durumOzetiCek(batch_id) {
  const durumlar = ['bekliyor', 'isleniyor', 'tamam', 'hata', 'iptal'];

  const sayim = await Promise.all(
    durumlar.map(async (d) => {
      // count=exact ile Content-Range header'ından sayı al
      const url = `is_kuyrugu?batch_id=eq.${batch_id}&durum=eq.${d}&select=id`;
      const veri = await supaFetch(url);
      return [d, Array.isArray(veri) ? veri.length : 0];
    })
  );

  return Object.fromEntries(sayim);
}

// =====================================================================
// KAYITLARI ÇEK — limit/offset/filtre
// =====================================================================
async function kayitlariCek(batch_id, limit, offset, sadece_hata) {
  let url = `is_kuyrugu?batch_id=eq.${batch_id}`;
  url += `&select=id,dosya_adi,dosya_sirasi,durum,deneme_sayisi,hata_mesaji,parse_baslangic_at,parse_bitis_at,olusturma_at,guncelleme_at,storage_path`;
  url += `&order=dosya_sirasi.asc`;
  url += `&limit=${limit}&offset=${offset}`;

  if (sadece_hata) {
    url += `&durum=eq.hata`;
  }

  return await supaFetch(url);
}

// =====================================================================
// SUPABASE HELPER (izometri-oku.js'ten kopya)
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
