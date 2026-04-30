// =====================================================================
// api/batch-baslat.js -- 49. oturum
// =====================================================================
// Async batch akışında ilk adım. Yeni bir izometri batch'i açar, batch_id
// döndürür. Frontend bu batch_id ile Storage'a paralel PDF yükler, sonra
// /api/batch-kuyruga-al endpoint'ini TEK çağrı ile çalıştırır.
//
// Sözleşme:
//   POST /api/batch-baslat
//   Body: { tenant_id, kullanici_id, dosya_toplami }
//   Response: { ok, batch_id }
//
// Akış:
//   1. Validasyon (UUID + sayı kontrolü)
//   2. izometri_batch_kayitlari'na INSERT (durum='yukleniyor', dosyalar=[])
//   3. batch_id döndür
//
// 49 mimari notu: Bu endpoint sadece batch açar, dosya bilgisi almaz.
//                 Storage upload + kuyruk INSERT batch-kuyruga-al'da yapılır.
//
// Süre: ~50-200ms (tek INSERT). maxDuration 10 yeterli.
// =====================================================================

export const config = { maxDuration: 10 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tenant_id, kullanici_id, dosya_toplami } = req.body || {};

    // --- Validasyon ---
    if (!tenant_id)    return res.status(400).json({ error: 'tenant_id zorunlu' });
    if (!kullanici_id) return res.status(400).json({ error: 'kullanici_id zorunlu' });
    if (!dosya_toplami || dosya_toplami < 1) {
      return res.status(400).json({ error: 'dosya_toplami 1 veya buyuk olmali' });
    }
    if (dosya_toplami > 5000) {
      return res.status(400).json({ error: 'dosya_toplami sinir asildi (max 5000)' });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase env eksik' });
    }

    // --- Batch aç ---
    const data = await supaFetch('izometri_batch_kayitlari', {
      method: 'POST',
      body: {
        tenant_id,
        kullanici_id,
        dosya_sayisi: dosya_toplami,
        dosyalar: [],                      // batch-kuyruga-al doldurur
        format_durumu: 'taraniyor',
        durum: 'yukleniyor',               // Storage upload sırasında
        baslangic_at: new Date().toISOString(),
      },
    });

    const batch_id = data?.[0]?.id;
    if (!batch_id) {
      return res.status(500).json({ error: 'Batch olusturulamadi (bos cevap)' });
    }

    console.log('[batch-baslat] Yeni batch:', batch_id, '— dosya_toplami:', dosya_toplami);

    return res.status(200).json({ ok: true, batch_id });

  } catch (e) {
    console.error('[batch-baslat] Beklenmedik hata:', e);
    return res.status(500).json({ error: e.message });
  }
}

// =====================================================================
// SUPABASE HELPER (izometri-oku.js'ten kopya — 50/51'de lib/supabase.js'e taşınır)
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
