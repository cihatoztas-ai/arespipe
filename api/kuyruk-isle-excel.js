// api/kuyruk-isle-excel.js
// Wizard'a yüklenen bom_excel dokümanlarını parse eder, sonucu kuyrukta saklar.
// 101. oturum (19 Mayıs 2026)
//
// Akış:
//   1. Kuyruktan bekleyen 'excel-generic' işi çek (en yüksek öncelik, en eski)
//   2. Durumu 'isleniyor' yap (lock — paralel çağrılar aynı işi yakalamasın)
//   3. devre_dokumanlari'ndan storage_yolu al
//   4. Supabase Storage'dan Excel'i indir
//   5. lib/excel-parser.js ile parse et
//   6. Sonuca göre durum belirle:
//        L1 + guven >= 70  →  'oneri_hazir' (kullanıcı onayını bekle)
//        L2 / düşük güven  →  'manuel_onay' (kolonları kullanıcı eşler)
//        fail              →  'hata'
//   7. parse_sonuc'a JSONB çıktıyı yaz, bitis_at güncelle
//
// Bu endpoint DB INSERT YAPMAZ. Sadece parse eder + sonucu saklar.
// 102'de UI'da kullanıcı onaylayınca spooller + spool_malzemeleri'ne INSERT olur.
//
// Tetik: POST /api/kuyruk-isle-excel
//   Body: yok (kuyruktan en yüksek öncelikli bekleyeni alır)
//   Veya: { is_id: 'uuid' } — spesifik işi zorla (test için)
//
// Env (Vercel):
//   SUPABASE_URL                  (zaten var)
//   SUPABASE_SERVICE_ROLE_KEY     (RLS bypass — DB için zorunlu)
//
// NOT: Pilot dönemde public erişim, 102+ auth eklenecek (TODO).

import { createClient } from '@supabase/supabase-js';
import { parseExcel } from '../lib/excel-parser.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_ADI   = 'devre-belgeleri';

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
      hata: 'Env eksik: SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY zorunlu'
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
        .eq('parser', 'excel-generic')
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
        .eq('parser', 'excel-generic')
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
          mesaj: 'Bekleyen excel-generic işi yok'
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
      .select('id, tenant_id, devre_id, storage_yolu, dosya_adi, dokuman_tipi, uzanti')
      .eq('id', is.devre_dokuman_id)
      .single();

    if (dokError || !dok) {
      return await isiHataylaKapat(
        supa, is.id, res,
        'Doküman bulunamadı: ' + (dokError?.message || 'null')
      );
    }

    // 4) Storage'dan indir
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
    const buffer = Buffer.from(arrayBuffer);

    // 5) Parse et
    let parseSonuc;
    try {
      parseSonuc = parseExcel(buffer, { maxSatir: 1000 });
    } catch (e) {
      return await isiHataylaKapat(
        supa, is.id, res,
        'Parse exception: ' + e.message
      );
    }

    // 6) Durum belirle (sert kural: L1 + guven >= 70 ise otomatik insert opsiyonel)
    let yeniDurum;
    let hataMesaji = null;

    if (parseSonuc.seviye === 'L1' && parseSonuc.guven >= 70) {
      yeniDurum = 'oneri_hazir';
    } else if (parseSonuc.seviye === 'L2' ||
               (parseSonuc.seviye === 'L1' && parseSonuc.guven < 70)) {
      yeniDurum = 'manuel_onay';
    } else {
      yeniDurum = 'hata';
      hataMesaji = parseSonuc.hata || 'Parse başarısız (fail)';
    }

    // 7) Sonucu kuyruğa yaz
    const { error: sonError } = await supa
      .from('dosya_isleme_kuyrugu')
      .update({
        durum: yeniDurum,
        bitis_at: new Date().toISOString(),
        parse_sonuc: parseSonuc,
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
      sonuc: 'islendi',
      is_id: is.id,
      doc_id: dok.id,
      tenant_id: dok.tenant_id,
      devre_id: dok.devre_id,
      dosya: dok.dosya_adi,
      durum: yeniDurum,
      seviye: parseSonuc.seviye,
      guven: parseSonuc.guven,
      secilen_sayfa: parseSonuc.secilen,
      satir_sayisi: parseSonuc.satirlar?.length || 0,
      otomatik_insert_uygun: parseSonuc.otomatik_insert_uygun || false
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
