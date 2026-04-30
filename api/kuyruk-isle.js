// =====================================================================
// api/kuyruk-isle.js -- 49. oturum, self-trigger chain worker
// =====================================================================
// Async PDF parse kuyruğunun kalbi. Çağrıldığında is_kuyrugu'ndan en eski
// 'bekliyor' kayıtları alır, hibrit pattern ile max 2 PDF işler, sonra
// fire-and-forget HTTP çağrısı ile kendini yeniden tetikler.
//
// Sözleşme:
//   POST /api/kuyruk-isle
//   Body: { batch_id?, max_islem? }
//     - batch_id: opsiyonel, sadece o batch'in kayıtlarını işle (yoksa global FIFO)
//     - max_islem: opsiyonel, default 2 (Vercel 60s limit altı güvenli)
//   Response: { ok, islenen, basarili, hata, kalan_bekleyen, chain_baslatildi }
//
// Akış:
//   1. is_kuyrugu'dan max N (default 2) bekleyen al
//   2. Her birini sırayla işle (in-process loop):
//      a. Durumu 'isleniyor' yap (yarış koşulu engelle)
//      b. Storage'dan PDF indir (service key ile)
//      c. POST /api/izometri-oku → parse sonucu al
//      d. Sonuca göre kuyruk kaydını güncelle (tamam | hata | bekliyor+retry)
//   3. Hâlâ bekleyen kayıt varsa fire-and-forget POST /api/kuyruk-isle (chain)
//
// Hata stratejisi:
//   - PDF indirme hatası → deneme++ → max 3 → durum=hata (geçici sorun retry'lar)
//   - izometri-oku hatası (4xx) → durum=hata (kalıcı), retry yok
//   - izometri-oku hatası (5xx/timeout) → deneme++ → retry
//   - Worker'ın kendisi crash → bir sonraki çağrıda 'isleniyor' kayıt 5dk üstüyse
//     'bekliyor'a geri çevrilir (stale lock cleanup, basit timeout-based)
//
// Süre:
//   - 1 PDF: ~24s (L3) | ~3s (cache) | ~0.1s (50+ L2 sonrası)
//   - 2 PDF max: ~50s (worst case) — Vercel 60s limit altında
//   - Chain başlatma: ~50ms (fire-and-forget)
//
// 49 mimari notu: izometri-oku.js'e dokunulmaz. HTTP fetch ile çağrılır.
//                 Refactor 51+'a ertelendi.
// =====================================================================

export const config = { maxDuration: 60 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const STORAGE_BUCKET = 'izometri-pdfs';

// Self-fetch için kendi base URL'imiz. VERCEL_URL ve VERCEL_PROJECT_PRODUCTION_URL
// Vercel'de otomatik set edilir. Lokalde fallback: localhost.
const SELF_BASE_URL = (() => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
})();

const STALE_LOCK_DAKIKA = 5;       // 'isleniyor' kayıt 5 dk üstündeyse stale kabul edilir
const MAX_DENEME = 3;              // 3 deneme sonra durum='hata'
const DEFAULT_MAX_ISLEM = 2;       // Function başına işlenecek max PDF

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baslangic = Date.now();

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase env eksik' });
    }

    const { batch_id, max_islem } = req.body || {};
    const N = Math.min(max_islem || DEFAULT_MAX_ISLEM, 5);  // güvenlik tavanı

    // --- 0. Stale lock cleanup (defansif, idempotent) ---
    // 'isleniyor' kayıtlar 5 dakika üstündeyse worker crash olmuş demektir,
    // 'bekliyor'a geri çevir, deneme_sayisi artır.
    await staleLockTemizle();

    // --- 1. Bekleyen kayıtları al ---
    let url = `is_kuyrugu?durum=eq.bekliyor&deneme_sayisi=lt.${MAX_DENEME}&select=*&order=olusturma_at.asc&limit=${N}`;
    if (batch_id) url += `&batch_id=eq.${batch_id}`;

    const bekleyenler = await supaFetch(url);

    if (!bekleyenler || bekleyenler.length === 0) {
      console.log('[kuyruk-isle] Kuyrukta is yok', batch_id ? `(batch=${batch_id})` : '(global)');
      return res.status(200).json({
        ok: true,
        islenen: 0,
        basarili: 0,
        hata: 0,
        kalan_bekleyen: 0,
        chain_baslatildi: false,
        sure_ms: Date.now() - baslangic,
      });
    }

    console.log(`[kuyruk-isle] ${bekleyenler.length} kayit alindi, isleniyor...`);

    let basarili = 0;
    let hata = 0;

    // --- 2. Her birini işle (in-process loop) ---
    for (const kayit of bekleyenler) {
      try {
        const sonuc = await tekKayitIsle(kayit);
        if (sonuc.basarili) basarili++;
        else hata++;
      } catch (e) {
        console.error(`[kuyruk-isle] Kayit ${kayit.id} icin beklenmedik hata:`, e.message);
        hata++;
        // Kayıt durumunu güncelle (defansif)
        await supaFetch(`is_kuyrugu?id=eq.${kayit.id}`, {
          method: 'PATCH',
          body: {
            durum: 'bekliyor',  // retry için
            deneme_sayisi: (kayit.deneme_sayisi || 0) + 1,
            hata_mesaji: e.message?.substring(0, 500) || 'bilinmeyen hata',
          },
        }).catch(() => {});  // hata yutuyoruz, sonsuz döngü olmasın
      }
    }

    // --- 3. Kalan bekleyen var mı? Chain başlat ---
    const kalan = await kalanBekleyenSayisi(batch_id);
    let chain_baslatildi = false;

    if (kalan > 0) {
      // Fire-and-forget: await yok, response döndükten sonra çalışmaya devam etmez
      // ama Vercel function bitiş öncesi POST gönderilmiş olur (Promise zincirine giriyor)
      const chainBody = batch_id ? { batch_id, max_islem: N } : { max_islem: N };
      fetch(`${SELF_BASE_URL}/api/kuyruk-isle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chainBody),
      }).catch(e => {
        console.error('[kuyruk-isle] Chain baslatma hatasi (yutuldu):', e.message);
      });
      chain_baslatildi = true;
      console.log(`[kuyruk-isle] Chain baslatildi, ${kalan} kayit kaldi`);
    }

    const sure_ms = Date.now() - baslangic;
    console.log(`[kuyruk-isle] Bitti — islenen: ${bekleyenler.length}, basarili: ${basarili}, hata: ${hata}, kalan: ${kalan}, sure: ${sure_ms}ms`);

    return res.status(200).json({
      ok: true,
      islenen: bekleyenler.length,
      basarili,
      hata,
      kalan_bekleyen: kalan,
      chain_baslatildi,
      sure_ms,
    });

  } catch (e) {
    console.error('[kuyruk-isle] Beklenmedik hata:', e);
    return res.status(500).json({ error: e.message });
  }
}

// =====================================================================
// TEK KAYIT İŞLEME
// =====================================================================
async function tekKayitIsle(kayit) {
  const { id, batch_id, tenant_id, kullanici_id, storage_path, dosya_adi,
          dosya_sirasi, dosya_toplami, deneme_sayisi } = kayit;

  console.log(`[kuyruk-isle] Kayit ${id} basliyor: ${dosya_adi} (deneme: ${deneme_sayisi + 1})`);

  // --- A. Durumu 'isleniyor' yap (atomic) ---
  await supaFetch(`is_kuyrugu?id=eq.${id}`, {
    method: 'PATCH',
    body: {
      durum: 'isleniyor',
      parse_baslangic_at: new Date().toISOString(),
      deneme_sayisi: deneme_sayisi + 1,
    },
  });

  try {
    // --- B. Storage'dan PDF indir ---
    const pdfBuffer = await storagePdfIndir(storage_path);
    const pdf_base64 = pdfBuffer.toString('base64');

    // --- C. izometri-oku'ya gönder ---
    const parseUrl = `${SELF_BASE_URL}/api/izometri-oku`;
    const parseRes = await fetch(parseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id,
        kullanici_id,
        batch_id,
        pdf_base64,
        dosya_adi,
        dosya_sirasi,
        dosya_toplami,
      }),
    });

    const parseText = await parseRes.text();
    let parseData;
    try { parseData = JSON.parse(parseText); }
    catch { parseData = { error: 'parse cevabi JSON degil', raw: parseText.substring(0, 200) }; }

    if (!parseRes.ok) {
      const errMsg = parseData?.error || `HTTP ${parseRes.status}`;
      console.error(`[kuyruk-isle] izometri-oku hatasi (${parseRes.status}):`, errMsg);

      // 4xx kalıcı hata, retry yok. 5xx/timeout retry.
      const kaliciHata = parseRes.status >= 400 && parseRes.status < 500;
      await supaFetch(`is_kuyrugu?id=eq.${id}`, {
        method: 'PATCH',
        body: {
          durum: kaliciHata ? 'hata' : (deneme_sayisi + 1 >= MAX_DENEME ? 'hata' : 'bekliyor'),
          hata_mesaji: errMsg.substring(0, 500),
        },
      });
      return { basarili: false, hata: errMsg };
    }

    // --- D. Başarılı: kayıt durumunu güncelle ---
    await supaFetch(`is_kuyrugu?id=eq.${id}`, {
      method: 'PATCH',
      body: {
        durum: 'tamam',
        parse_bitis_at: new Date().toISOString(),
        hata_mesaji: null,
      },
    });

    console.log(`[kuyruk-isle] Kayit ${id} BASARILI: ${dosya_adi} (${parseData.spool_sayisi} spool, ${parseData.sure_ms}ms)`);
    return { basarili: true };

  } catch (e) {
    console.error(`[kuyruk-isle] Kayit ${id} ISLEME HATASI:`, e.message);

    const yeniDeneme = deneme_sayisi + 1;
    await supaFetch(`is_kuyrugu?id=eq.${id}`, {
      method: 'PATCH',
      body: {
        durum: yeniDeneme >= MAX_DENEME ? 'hata' : 'bekliyor',
        hata_mesaji: e.message?.substring(0, 500) || 'bilinmeyen',
      },
    });

    return { basarili: false, hata: e.message };
  }
}

// =====================================================================
// SUPABASE STORAGE: PDF INDIR (service key ile)
// =====================================================================
async function storagePdfIndir(storage_path) {
  const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storage_path}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Storage indirme hatasi (${res.status}): ${text.substring(0, 200)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// =====================================================================
// STALE LOCK CLEANUP
// =====================================================================
// 'isleniyor' kayıt 5 dakika üstündeyse worker crash demektir.
// 'bekliyor'a geri çevir, deneme_sayisi artır.
async function staleLockTemizle() {
  const esik = new Date(Date.now() - STALE_LOCK_DAKIKA * 60 * 1000).toISOString();

  // SELECT: stale 'isleniyor' kayıtlar
  const staleler = await supaFetch(
    `is_kuyrugu?durum=eq.isleniyor&parse_baslangic_at=lt.${esik}&select=id,deneme_sayisi`
  );

  if (!staleler || staleler.length === 0) return;

  console.log(`[kuyruk-isle] ${staleler.length} stale lock bulundu, temizleniyor...`);

  // Toplu UPDATE — Postgrest tek tek güncelliyor, döngüyle yapıyoruz
  for (const s of staleler) {
    const yeniDeneme = (s.deneme_sayisi || 0);  // zaten artırılmıştı, yeniden artırma
    await supaFetch(`is_kuyrugu?id=eq.${s.id}`, {
      method: 'PATCH',
      body: {
        durum: yeniDeneme >= MAX_DENEME ? 'hata' : 'bekliyor',
        hata_mesaji: 'Stale lock — worker crash veya timeout',
      },
    }).catch(e => console.error('[kuyruk-isle] Stale temizleme hatasi:', e.message));
  }
}

// =====================================================================
// KALAN BEKLEYEN SAYISI
// =====================================================================
async function kalanBekleyenSayisi(batch_id) {
  let url = `is_kuyrugu?durum=eq.bekliyor&deneme_sayisi=lt.${MAX_DENEME}&select=id`;
  if (batch_id) url += `&batch_id=eq.${batch_id}`;

  const data = await supaFetch(url, {
    headers: { 'Prefer': 'count=exact' },
  });

  return Array.isArray(data) ? data.length : 0;
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
