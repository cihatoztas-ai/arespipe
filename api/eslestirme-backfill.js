// api/eslestirme-backfill.js
// Adim4 (110, MK-110.1): zaten islenmis izometri PDF'lerini kabuk spool'a baglar.
//
// 140 (MK-140.x): tip=malzeme dali eklendi. AYNI endpoint iki backfill yapar:
//   - tip=izometri (varsayilan): izometri PDF <-> spool eslestirme (orijinal, degismedi).
//   - tip=malzeme: spool_malzemeleri.boyut -> kutuphane (flansh/fitting_olculer) FK backfill.
//     Cekirdek lib/malzeme-kutuphane-eslesme.js (mm-kanonik). ARES_NORM'a DOKUNULMAZ
//     (malzeme kolonu zaten normalize kod). ARES_BORU+ARES_OLCU server'da requireable.
//   Yeni endpoint YOK -> Vercel 12 fonksiyon tavani korunur.
//
// Eslestirme cekirdegi worker'in eslestir()'i ile AYNI (import — tek kaynak, MK-109.1).
// Idempotent: izometri tarafi bekliyor->kismi; malzeme tarafi yalniz FK NULL satira yazar.
//
// Tetik: POST /api/eslestirme-backfill
//   { tip:'malzeme', tenant_id?, devre_id?, kuru?, limit? }   -> malzeme-kutuphane FK
//   { devre_id?, kuru?, limit? }  (tip yok/izometri)          -> izometri eslestirme
//
// Env: SUPABASE_URL + SUPABASE_SERVICE_KEY (MK-101.4).

import { createClient } from '@supabase/supabase-js';
import { eslestir, normSpoolNo, normPipeline, dosyaAdiParse } from './kuyruk-isle-izometri.js';
// 140: malzeme-kutuphane backfill cekirdegi + olcu motorlari (isomorphic, globalThis'e yazar).
//   Sira onemli: ares-asme (ARES_BORU) ONCE, sonra ares-olcu (onu cagirir).
import '../ares-asme.js';
import '../ares-olcu.js';
import { eslesmeAnahtari } from '../lib/malzeme-kutuphane-eslesme.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY;

export const config = { maxDuration: 60 };

// ── 140: tip=malzeme — spool_malzemeleri.boyut -> kutuphane FK (mm-kanonik) ──
async function malzemeBackfill(supa, { tenantId, devreId, kuru, limit }) {
  const OLCU = (typeof globalThis !== 'undefined' && globalThis.ARES_OLCU) ? globalThis.ARES_OLCU : null;
  if (!OLCU) return { hata: 'ARES_OLCU yuklenemedi (ares-olcu import?)' };

  let q = supa
    .from('spool_malzemeleri')
    .select('id, tip, malzeme, kalite, boyut, tanim, fitting_olculer_id, flansh_olculer_id, spooller!inner(devre_id, tenant_id)')
    .is('fitting_olculer_id', null)
    .is('flansh_olculer_id', null)
    .limit(limit);
  if (devreId)  q = q.eq('spooller.devre_id', devreId);
  if (tenantId) q = q.eq('spooller.tenant_id', tenantId);

  const { data: satirlar, error } = await q;
  if (error) return { hata: 'spool_malzemeleri okuma: ' + error.message };

  const rapor = { ok:true, kuru, tip:'malzeme', satir:(satirlar||[]).length,
    anahtar_uretildi:0, lookup_bulundu:0, fk_yazildi:0, standart_disi:0, kayitlar:[] };
  const cache = new Map();

  for (const m of (satirlar || [])) {
    const r = eslesmeAnahtari(m, OLCU);
    if (!r) { rapor.standart_disi++; continue; }
    rapor.anahtar_uretildi++;

    const tablo = (r.hedef_kolon === 'flansh_olculer_id') ? 'flansh_olculer' : 'fitting_olculer';
    const ck = tablo + '|' + JSON.stringify(r.lookup) + '|' + r.cap_alani + '|' + r.cap_mm;
    let libId = cache.get(ck);

    if (libId === undefined) {
      let lq = supa.from(tablo).select('id, ' + r.cap_alani).eq('aktif', true);
      for (const [k, v] of Object.entries(r.lookup)) lq = lq.eq(k, v);
      lq = lq.gte(r.cap_alani, r.cap_mm - 0.6).lte(r.cap_alani, r.cap_mm + 0.6).limit(2);
      const { data: hit, error: le } = await lq;
      if (le) { rapor.kayitlar.push({ id:m.id, hata: le.message }); cache.set(ck, null); continue; }
      libId = (hit && hit.length === 1) ? hit[0].id : null;  // tek net eslesme sart (belirsizse yazma)
      cache.set(ck, libId);
    }

    if (!libId) continue;  // kutuphanede yok -> NULL kalir -> super-admin
    rapor.lookup_bulundu++;

    if (kuru) {
      rapor.kayitlar.push({ id:m.id, tanim:m.tanim, boyut:m.boyut, mm:r.cap_mm, hedef:r.hedef_kolon, lib_id:libId });
    } else {
      const upd = {}; upd[r.hedef_kolon] = libId;
      const { error: ue } = await supa.from('spool_malzemeleri').update(upd)
        .eq('id', m.id).is(r.hedef_kolon, null);  // yaris guard
      if (ue) { rapor.kayitlar.push({ id:m.id, hata: ue.message }); continue; }
      rapor.fk_yazildi++;
    }
  }
  return rapor;
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

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // 140: tip=malzeme dali (izometri akisindan ONCE)
  const tip = req.body?.tip || 'izometri';
  if (tip === 'malzeme') {
    try {
      const out = await malzemeBackfill(supa, {
        tenantId: req.body?.tenant_id || null,
        devreId:  req.body?.devre_id || null,
        kuru:     req.body?.kuru === true,
        limit:    Math.min(Number(req.body?.limit) || 2000, 5000),
      });
      return res.status(out.hata ? 500 : 200).json(out);
    } catch (e) {
      return res.status(500).json({ hata: 'malzeme backfill: ' + e.message, stack: e.stack?.split('\n').slice(0,3).join(' | ') });
    }
  }

  // ── izometri akisi (ORIJINAL, degismedi) ──
  const devreId = req.body?.devre_id || null;
  const kuru    = req.body?.kuru === true;
  const limit   = Math.min(Number(req.body?.limit) || 500, 2000);

  try {
    let q = supa
      .from('dosya_isleme_kuyrugu')
      .select('id, dok_id:devre_dokuman_id, parse_sonuc, devre_dokumanlari!inner(devre_id)')
      .eq('parser', 'izometri')
      .in('durum', ['oneri_hazir', 'manuel_onay'])
      .not('parse_sonuc', 'is', null)
      .limit(limit);
    if (devreId) q = q.eq('devre_dokumanlari.devre_id', devreId);

    const { data: isler, error: qErr } = await q;
    if (qErr) return res.status(500).json({ hata: 'Kuyruk okuma hatasi: ' + qErr.message });

    const rapor = {
      kuru, devre_id: devreId, kuyruk_sayisi: (isler || []).length,
      toplam_spool: 0, toplam_eslesen: 0, toplam_atanmamis: 0, toplam_yukseltilen: 0, kayitlar: []
    };

    for (const is of (isler || [])) {
      const dvId = is.devre_dokumanlari?.devre_id;
      const okuJson = is.parse_sonuc;
      if (!dvId || !okuJson || !Array.isArray(okuJson.spoollar)) {
        rapor.kayitlar.push({ kuyruk_id: is.id, atlandi: 'devre_id veya spoollar yok' });
        continue;
      }

      if (kuru) {
        const { data: spoollar } = await supa
          .from('spooller')
          .select('spool_no, pipeline_no, cizim_durumu')
          .eq('devre_id', dvId)
          .eq('silindi', false);
        const harita = new Map();
        for (const s of (spoollar || [])) {
          const k = normPipeline(s.pipeline_no) + '|' + normSpoolNo(s.spool_no);
          if (!harita.has(k)) harita.set(k, s.cizim_durumu);
        }
        const dp = dosyaAdiParse(okuJson.dosya_adi || null);
        let es = 0, at = 0, yuk = 0;
        for (const ps of okuJson.spoollar) {
          const pl = dp?.pipeline_no || null;
          const sn = dp?.spool_no || ps.spool_no || null;
          if (!pl || !sn) { at++; continue; }
          const k = normPipeline(pl) + '|' + normSpoolNo(sn);
          if (harita.has(k)) { es++; if (harita.get(k) === 'bekliyor') yuk++; }
          else at++;
        }
        rapor.toplam_spool += okuJson.spoollar.length;
        rapor.toplam_eslesen += es; rapor.toplam_atanmamis += at; rapor.toplam_yukseltilen += yuk;
        rapor.kayitlar.push({ kuyruk_id: is.id, devre_id: dvId, dosya: okuJson.dosya_adi || null, spool: okuJson.spoollar.length, eslesen: es, atanmamis: at, yukseltilebilir: yuk });
      } else {
        const dokId = is.dok_id || null;
        const ozet = await eslestir(supa, dvId, is.id, okuJson, dokId);
        if (ozet) {
          rapor.toplam_spool += ozet.toplam; rapor.toplam_eslesen += ozet.eslesen;
          rapor.toplam_atanmamis += ozet.atanmamis; rapor.toplam_yukseltilen += ozet.yukseltilen;
          rapor.kayitlar.push({ kuyruk_id: is.id, devre_id: dvId, dok_id: dokId, spool: ozet.toplam, eslesen: ozet.eslesen, atanmamis: ozet.atanmamis, yukseltilen: ozet.yukseltilen });
        } else {
          rapor.kayitlar.push({ kuyruk_id: is.id, devre_id: dvId, dok_id: dokId, atlandi: 'eslestir null dondu' });
        }
      }
    }

    return res.status(200).json({ ok: true, ...rapor });
  } catch (e) {
    return res.status(500).json({ hata: 'Beklenmedik hata: ' + e.message, stack: e.stack?.split('\n').slice(0, 3).join(' | ') });
  }
}
