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
      sure_ms: ok ? (okuJson.sure_ms || null) : null
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

  return res.status(500).json({
    sonuc: 'hata',
    is_id: isId,
    hata: mesaj
  });
}
