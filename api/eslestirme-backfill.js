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
import { eslestir, normSpoolNo, normPipeline, dosyaAdiParse, kabukYukle } from './kuyruk-isle-izometri.js';
// 157 (MK-157.2): 140'in createRequire cozumu Vercel runtime'inda OLU DOGMUS — Vercel'in modul
//   yukleyicisi (/opt/rust/nodejs.js) require(ESM) desteklemiyor; "type":"module" nedeniyle
//   ares-asme.js ESM sayilir -> ERR_REQUIRE_ESM, MODUL YUKLEMEDE tum endpoint coker (izometri
//   dali DAHIL — terfi sonrasi otomatik backfill bu yuzden 140'tan beri hep dustu, 129/130
//   "terfi sonrasi izometri baglanmiyor" borcunun koku). Lokal Node 20.19+/22 require(esm)
//   destekledigi icin lokalde gorunmuyordu (kanit: node 20.11 ile birebir repro, 157).
//   COZUM: zincir modul seviyesinden cikti, YALNIZ tip=malzeme dalinda dinamik import() ile
//   yuklenir. Uc dosya da UMD-guard'li ("typeof module" kontrollu) -> ESM olarak calisinca
//   module.exports atlanir, globalThis.ARES_BORU / ARES_OLCU / MALZEME_ESLESME dolar.
//   Sira korunur: ares-asme (ARES_BORU) ONCE, sonra ares-olcu. ares-normalize'a DOKUNULMAZ.
let _cjsHazir = false;
async function cjsZinciriYukle() {
  if (_cjsHazir) return;
  await import('../ares-asme.js');                     // globalThis.ARES_BORU
  await import('../ares-olcu.js');                     // globalThis.ARES_OLCU
  await import('../lib/malzeme-kutuphane-eslesme.js'); // globalThis.MALZEME_ESLESME
  _cjsHazir = true;
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY;

export const config = { maxDuration: 60 };

// ── 140: tip=malzeme — spool_malzemeleri.boyut -> kutuphane FK (mm-kanonik) ──
async function malzemeBackfill(supa, { tenantId, devreId, kuru, limit }) {
  await cjsZinciriYukle();   // 157: lazy — yukleme hatasi handler try/catch'inde JSON 500 olur, fonksiyon cokmez
  const OLCU = (typeof globalThis !== 'undefined' && globalThis.ARES_OLCU) ? globalThis.ARES_OLCU : null;
  if (!OLCU) return { hata: 'ARES_OLCU yuklenemedi (ares-olcu import?)' };
  const eslesmeAnahtari = globalThis.MALZEME_ESLESME && globalThis.MALZEME_ESLESME.eslesmeAnahtari;
  if (!eslesmeAnahtari) return { hata: 'MALZEME_ESLESME yuklenemedi (malzeme-kutuphane-eslesme import?)' };

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

  // ── izometri akisi (176/MK-176.2: SAYFALAMA — terfi timeout koku) ──
  //   ESKI: tum oneri_hazir/manuel_onay kayitlari TEK invocation'da islenirdi. Cok-belgeli
  //   devrede (orn. 356 PDF) her eslestir() kabugu bastan yukler (3 SELECT) + eslesme basina
  //   2 UPDATE -> ~1800 DB turu -> 60sn maxDuration asilir -> FUNCTION_INVOCATION_TIMEOUT ->
  //   terfide izoHata -> auto-close atlanir -> kuyruk birikir (129/130 borcunun GERCEK koku;
  //   157 ESM fix'inin altinda kalan olcek sorunu — MK-176.1 teshis).
  //   YENI: keyset imleci (id ASC + after_id) + sinirli batch + zaman butcesi. Istemci/terfi
  //   client-loop ile bitti=true olana dek cagirir (MK-113/A: sunucu-sunucu YOK). eslestir()'e
  //   DOKUNULMAZ (MK-109.1 tek-kaynak). eslestir durum'u degistirmez -> imlec tekrar secmez;
  //   idempotent (bekliyor->kismi tekrar guvenli).
  const devreId  = req.body?.devre_id || null;
  const kuru     = req.body?.kuru === true;
  const afterId  = req.body?.after_id || null;
  const batch    = Math.min(Number(req.body?.batch) || Number(req.body?.limit) || 40, 200);
  const BUTCE_MS = 40000;   // 60sn tavanindan 20sn pay: bir yavas eslestir + yanit + fetch tasmasi guvenli
  const _t0      = Date.now();   // 176/MK-176.4: budget FONKSIYON GIRISINDEN olculur — batch SELECT'in
  //   (dolu parse_sonuc JSONB transferi) wall-clock maliyeti de tavana sayilsin (eski hata: _baslangic
  //   fetch'ten SONRA basliyordu -> agir fetch + 45s islem 60s'yi asip hard-timeout veriyordu, MK-176.4).

  try {
    let q = supa
      .from('dosya_isleme_kuyrugu')
      .select('id, dok_id:devre_dokuman_id, parse_sonuc, devre_dokumanlari!inner(devre_id)')
      .eq('parser', 'izometri')
      .in('durum', ['oneri_hazir', 'manuel_onay'])
      .not('parse_sonuc', 'is', null)
      .order('id', { ascending: true })
      .limit(batch);
    if (devreId) q = q.eq('devre_dokumanlari.devre_id', devreId);
    if (afterId) q = q.gt('id', afterId);

    const { data: isler, error: qErr } = await q;
    if (qErr) return res.status(500).json({ hata: 'Kuyruk okuma hatasi: ' + qErr.message });

    const rapor = {
      kuru, devre_id: devreId, kuyruk_sayisi: (isler || []).length,
      toplam_spool: 0, toplam_eslesen: 0, toplam_atanmamis: 0, toplam_yukseltilen: 0, kayitlar: []
    };

    let _sonId = afterId;     // imlec: bu turda islenen SON (en buyuk) id
    let _kesildi = false;     // zaman butcesi nedeniyle erken kesildi mi

    // 176/MK-176.3: devre-bazli backfill -> kabuk (3 SELECT) batch basina TEK yuklenir, her eslestir'e
    //   ctx olarak gecer (kayit basi tekrar yukleme biter -> ~1.3sn/kayit darbogazi cozulur). Global
    //   backfill'de (devreId YOK) batch farkli devreleri kapsayabilir -> ctx YOK, eslestir kendi yukler.
    //   kuru dali eslestir cagirmaz -> ctx gereksiz. Hata (null) -> ctx yok say (eslestir kendi dener).
    const _ctx = (!kuru && devreId) ? (await kabukYukle(supa, devreId) || null) : null;

    for (const is of (isler || [])) {
      // Butce kontrolu islemden ONCE: _sonId her zaman TAM islenmis son kaydi gosterir.
      if (Date.now() - _t0 > BUTCE_MS) { _kesildi = true; break; }
      _sonId = is.id;
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
        const ozet = await eslestir(supa, dvId, is.id, okuJson, dokId, _ctx);
        if (ozet) {
          // 176/MK-176.4: montaj ozet'inde 'yukseltilen' alani YOK -> (||0) ile NaN/null onlenir.
          rapor.toplam_spool += (ozet.toplam || 0); rapor.toplam_eslesen += (ozet.eslesen || 0);
          rapor.toplam_atanmamis += (ozet.atanmamis || 0); rapor.toplam_yukseltilen += (ozet.yukseltilen || 0);
          rapor.kayitlar.push({ kuyruk_id: is.id, devre_id: dvId, dok_id: dokId, spool: ozet.toplam, eslesen: ozet.eslesen, atanmamis: ozet.atanmamis, yukseltilen: ozet.yukseltilen || 0 });
        } else {
          rapor.kayitlar.push({ kuyruk_id: is.id, devre_id: dvId, dok_id: dokId, atlandi: 'eslestir null dondu' });
        }
      }
    }

    // bitti: bu tur batch'i DOLDURMADI ve zaman butcesiyle KESILMEDI -> baska kayit yok.
    //   Istemci/terfi bunu gorunce loop'u durdurur. Aksi halde after_id=son_id ile devam eder.
    const _islenenSay = (isler || []).length;
    const bitti = !_kesildi && _islenenSay < batch;

    return res.status(200).json({ ok: true, son_id: _sonId, bitti, kesildi: _kesildi, ...rapor });
  } catch (e) {
    return res.status(500).json({ hata: 'Beklenmedik hata: ' + e.message, stack: e.stack?.split('\n').slice(0, 3).join(' | ') });
  }
}
