// =====================================================================
// api/batch-kuyruga-al.js -- 49. oturum
// =====================================================================
// Frontend Storage upload bittikten sonra TEK çağrı yapılır.
// Tüm kuyruk kayıtlarını batched INSERT ile is_kuyrugu'na yazar.
// Aynı zamanda izometri_batch_kayitlari.dosyalar JSONB özetini günceller.
//
// Sözleşme:
//   POST /api/batch-kuyruga-al
//   Body: {
//     batch_id,
//     tenant_id,
//     kullanici_id,
//     kayitlar: [
//       {
//         dosya_adi: "PAOR-50600-101514.pdf",     // orijinal
//         dosya_boyut: 1234567,                   // byte (opsiyonel)
//         dosya_sirasi: 1,                         // 1-indexed
//         storage_path: "{tenant_id}/{batch_id}/paor-50600-101514.pdf"
//       },
//       ...
//     ]
//   }
//   Response: { ok, basarili_sayi, kuyruk_idleri[] }
//
// Akış:
//   1. Validasyon (her kaydın storage_path'i tenant/batch ile başlamalı)
//   2. is_kuyrugu'na batched INSERT (Postgrest array body = tek SQL ile N satır)
//   3. izometri_batch_kayitlari.dosyalar JSONB özetini güncelle
//   4. ID listesi döndür (frontend polling için)
//
// 49 mimari notu: Storage upload başarılı olduktan sonra çağrılmalı.
//                 Storage upload BAŞARISIZ olan dosya için kayıt atlanmalı
//                 (frontend filtrele).
//
// Süre: ~500ms-3s (1000 kayıtlık batch). maxDuration 30 yeterli.
// =====================================================================

export const config = { maxDuration: 30 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const STORAGE_BUCKET = 'izometri-pdfs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { batch_id, tenant_id, kullanici_id, kayitlar } = req.body || {};

    // --- Validasyon: ana alanlar ---
    if (!batch_id)     return res.status(400).json({ error: 'batch_id zorunlu' });
    if (!tenant_id)    return res.status(400).json({ error: 'tenant_id zorunlu' });
    if (!kullanici_id) return res.status(400).json({ error: 'kullanici_id zorunlu' });
    if (!Array.isArray(kayitlar) || kayitlar.length === 0) {
      return res.status(400).json({ error: 'kayitlar bos olamaz (array bekleniyor)' });
    }
    if (kayitlar.length > 5000) {
      return res.status(400).json({ error: `kayitlar max 5000 (gelen: ${kayitlar.length})` });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase env eksik' });
    }

    const dosya_toplami = kayitlar.length;
    const beklenen_prefix = `${tenant_id}/${batch_id}/`;
    const insert_satirlari = [];

    // --- Validasyon: her kayıt + insert satırı hazırla ---
    for (let i = 0; i < kayitlar.length; i++) {
      const k = kayitlar[i];

      if (!k.dosya_adi) {
        return res.status(400).json({ error: `kayit[${i}]: dosya_adi zorunlu` });
      }
      if (!k.storage_path) {
        return res.status(400).json({ error: `kayit[${i}]: storage_path zorunlu` });
      }
      // Tenant izolasyonu — path tenant_id/batch_id/ ile başlamalı
      if (!k.storage_path.startsWith(beklenen_prefix)) {
        return res.status(400).json({
          error: `kayit[${i}]: storage_path "${beklenen_prefix}" ile baslamali (gelen: "${k.storage_path}")`
        });
      }
      // PDF uzantısı
      if (!/\.pdf$/i.test(k.storage_path)) {
        return res.status(400).json({ error: `kayit[${i}]: storage_path .pdf ile bitmeli` });
      }

      insert_satirlari.push({
        tenant_id,
        kullanici_id,
        batch_id,
        storage_bucket: STORAGE_BUCKET,
        storage_path: k.storage_path,
        dosya_adi: k.dosya_adi,
        dosya_boyut: k.dosya_boyut || null,
        dosya_sirasi: k.dosya_sirasi || (i + 1),
        dosya_toplami: dosya_toplami,
        durum: 'bekliyor',
      });
    }

    // --- is_kuyrugu'na batched INSERT (Postgrest array body) ---
    const eklenenler = await supaFetch('is_kuyrugu', {
      method: 'POST',
      body: insert_satirlari,
    });

    if (!Array.isArray(eklenenler) || eklenenler.length === 0) {
      return res.status(500).json({ error: 'Kuyruk kayitlari olusturulamadi (bos cevap)' });
    }

    if (eklenenler.length !== insert_satirlari.length) {
      console.warn('[batch-kuyruga-al] Kismi insert:', eklenenler.length, '/', insert_satirlari.length);
    }

    // --- izometri_batch_kayitlari.dosyalar JSONB özetini güncelle ---
    const ozet = eklenenler.map(k => ({
      ad: k.dosya_adi,
      sira: k.dosya_sirasi,
      durum: 'kuyrukta',
      kuyruk_id: k.id,
    }));

    await supaFetch(`izometri_batch_kayitlari?id=eq.${batch_id}`, {
      method: 'PATCH',
      body: {
        dosyalar: ozet,
        dosya_sayisi: dosya_toplami,
        durum: 'parse_ediliyor',
        guncelleme_at: new Date().toISOString(),
      },
    });

    console.log('[batch-kuyruga-al] Batch', batch_id, '—', eklenenler.length, 'kayit kuyruga alindi');

    return res.status(200).json({
      ok: true,
      basarili_sayi: eklenenler.length,
      kuyruk_idleri: eklenenler.map(k => k.id),
    });

  } catch (e) {
    console.error('[batch-kuyruga-al] Beklenmedik hata:', e);
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
