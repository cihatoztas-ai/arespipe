// api/eslestirme-backfill.js
// Adim4 (110, MK-110.1): zaten islenmis izometri PDF'lerini kabuk spool'a baglar.
//
// NEDEN: Eslestirme worker'in (kuyruk-isle-izometri.js) parse SONRASI adimina eklendi (1A).
//   Ama 110 oncesi islenmis (durum='oneri_hazir'/'manuel_onay') PDF'ler worker'dan tekrar
//   gecmez — onlarin parse_sonuc'u var ama _eslesme'si yok, kabuk spool 'bekliyor'da donmus.
//   Bu endpoint o gecmis kayitlari tek seferde (veya devre bazinda) esler.
//
// Eslestirme cekirdegi worker'daki eslestir() ile AYNI (import — tek kaynak, MK-109.1).
//   Yani backfill ile canli worker birebir ayni mantigi calistirir; sapma olmaz.
//
// Tetik: POST /api/eslestirme-backfill
//   Body (hepsi opsiyonel):
//     { devre_id: 'uuid' }   -> yalniz o devrenin PDF'leri (ONERILEN — kontrollu test)
//     { kuru: true }         -> KURU CALISMA: hangi PDF hangi spool'a eslesirdi raporla,
//                               DB'ye HICBIR sey yazma (spooller + parse_sonuc dokunulmaz).
//     { limit: N }           -> en fazla N kuyruk kaydi isle (varsayilan 500)
//   Body yok -> TUM tenant'larin tum islenmis izometri PDF'leri (dikkat — genis).
//
// Idempotent: eslestir() yalniz 'bekliyor'->'kismi' yukseltir; tekrar calisinca
//   zaten kismi/tam olanlara dokunmaz. Backfill'i bircok kez calistirmak guvenli.
//
// Env: SUPABASE_URL + SUPABASE_SERVICE_KEY (MK-101.4).

import { createClient } from '@supabase/supabase-js';
import { eslestir, normSpoolNo } from './kuyruk-isle-izometri.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY;

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ hata: 'POST gerekli' });

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ hata: 'Env eksik: SUPABASE_URL ve SUPABASE_SERVICE_KEY zorunlu' });
  }

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const devreId = req.body?.devre_id || null;
  const kuru    = req.body?.kuru === true;
  const limit   = Math.min(Number(req.body?.limit) || 500, 2000);

  try {
    // Islenmis izometri kuyruk kayitlarini cek (parse_sonuc dolu olanlar).
    // devre_dokumanlari uzerinden devre_id'yi getir (eslestir devre context ister).
    let q = supa
      .from('dosya_isleme_kuyrugu')
      .select('id, parse_sonuc, devre_dokumanlari!inner(devre_id)')
      .eq('parser', 'izometri')
      .in('durum', ['oneri_hazir', 'manuel_onay'])
      .not('parse_sonuc', 'is', null)
      .limit(limit);
    if (devreId) q = q.eq('devre_dokumanlari.devre_id', devreId);

    const { data: isler, error: qErr } = await q;
    if (qErr) return res.status(500).json({ hata: 'Kuyruk okuma hatasi: ' + qErr.message });

    const rapor = {
      kuru,
      devre_id: devreId,
      kuyruk_sayisi: (isler || []).length,
      toplam_spool: 0,
      toplam_eslesen: 0,
      toplam_atanmamis: 0,
      toplam_yukseltilen: 0,
      kayitlar: []
    };

    for (const is of (isler || [])) {
      const dvId = is.devre_dokumanlari?.devre_id;
      const okuJson = is.parse_sonuc;
      if (!dvId || !okuJson || !Array.isArray(okuJson.spoollar)) {
        rapor.kayitlar.push({ kuyruk_id: is.id, atlandi: 'devre_id veya spoollar yok' });
        continue;
      }

      if (kuru) {
        // KURU: eslesir miydi simule et, DB'ye yazma. (eslestir cagrilmaz.)
        const { data: spoollar } = await supa
          .from('spooller')
          .select('spool_no, cizim_durumu')
          .eq('devre_id', dvId)
          .eq('silindi', false);
        const set = new Set((spoollar || []).map(s => normSpoolNo(s.spool_no)));
        const bekleyenSet = new Set((spoollar || []).filter(s => s.cizim_durumu === 'bekliyor').map(s => normSpoolNo(s.spool_no)));
        let es = 0, at = 0, yuk = 0;
        for (const ps of okuJson.spoollar) {
          const k = normSpoolNo(ps.spool_no);
          if (k && set.has(k)) { es++; if (bekleyenSet.has(k)) yuk++; } else at++;
        }
        rapor.toplam_spool += okuJson.spoollar.length;
        rapor.toplam_eslesen += es;
        rapor.toplam_atanmamis += at;
        rapor.toplam_yukseltilen += yuk;
        rapor.kayitlar.push({ kuyruk_id: is.id, devre_id: dvId, spool: okuJson.spoollar.length, eslesen: es, atanmamis: at, yukseltilebilir: yuk });
      } else {
        // GERCEK: worker ile ayni eslestir() — bekliyor->kismi + _eslesme yaz.
        const ozet = await eslestir(supa, dvId, is.id, okuJson);
        if (ozet) {
          rapor.toplam_spool += ozet.toplam;
          rapor.toplam_eslesen += ozet.eslesen;
          rapor.toplam_atanmamis += ozet.atanmamis;
          rapor.toplam_yukseltilen += ozet.yukseltilen;
          rapor.kayitlar.push({ kuyruk_id: is.id, devre_id: dvId, spool: ozet.toplam, eslesen: ozet.eslesen, atanmamis: ozet.atanmamis, yukseltilen: ozet.yukseltilen });
        } else {
          rapor.kayitlar.push({ kuyruk_id: is.id, devre_id: dvId, atlandi: 'eslestir null dondu' });
        }
      }
    }

    return res.status(200).json({ ok: true, ...rapor });
  } catch (e) {
    return res.status(500).json({
      hata: 'Beklenmedik hata: ' + e.message,
      stack: e.stack?.split('\n').slice(0, 3).join(' | ')
    });
  }
}
