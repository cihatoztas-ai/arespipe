#!/usr/bin/env node
// scripts/backfill-flansh-paslanmaz-198.mjs
// AresPipe — Paslanmaz flanş FK backfill (Oturum 198, A10.6 #4).
// spool_malzemeleri.flansh_olculer_id IS NULL olan paslanmaz flanş BOM satırlarını
// flansh_olculer (paslanmaz, 20 seed satır) ile eşleştirir.
//
// YÖNTEM: A10.1 / 192 karbon flanş backfill ile simetrik — tanim+boyut PARSE.
//   (BOM'da geometri_std/flansh_tipi/basinc_sinifi/cap_dn yapısal kolon DEĞİL; serbest metin.)
//   dis_cap_mm KULLANILMAZ (null veya OD, güvenilmez — A10.1).
//
// İdempotent: UPDATE ... WHERE id=<bomId> AND flansh_olculer_id IS NULL
//   → ikinci koşu hepsini ZATEN_DOLU sayar, çift-yazma yok.
//
// Kullanım:
//   node scripts/backfill-flansh-paslanmaz-198.mjs          # DRY-RUN (yazma YOK)
//   node scripts/backfill-flansh-paslanmaz-198.mjs --yaz    # gerçek update

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const YAZ = process.argv.includes('--yaz');

// ── ENV ──
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ── Grup ekseni (A10.5) ──
const grup = (k, m) => {
  const s = ((k || '') + ' ' + (m || '')).toLowerCase();
  if (/bakir|cuni/.test(s)) return 'cunife';
  if (/paslanmaz|316|304|1\.?4571|st\.?st|aisi\s?3/.test(s)) return 'paslanmaz';
  if (/karbon|st\s?37|st37|a105/.test(s)) return 'karbon';
  return '?';
};

// ── Parse (BOM örneklerinden — talep sayımı + ADIM1 ile aynı) ──
const NPS_DN = { '2':50,'2.5':65,'3':80,'4':100,'5':125,'6':150,'8':200,'10':250,'12':300,'14':350,'16':400 };
let enVarsayildi = 0;
function parseKey(r) {
  const t = r.tanim, b = (r.boyut || '').trim();
  let std = null, enAssumed = false;
  if (/EN\s*1092-1/i.test(t)) std = 'EN-1092-1';
  else if (/(ANSI|ASME)\s*B16\.5|B16\.5/i.test(t)) std = 'B16.5';
  let tipRaw = null;
  if (/slip[\s-]*on/i.test(t)) tipRaw = 'SO';
  else if (/weld(ing)?\s*neck/i.test(t)) tipRaw = 'WN';
  else if (/blind/i.test(t)) tipRaw = 'BL';
  else if (/lap/i.test(t)) tipRaw = 'LJ';
  if (!std && tipRaw === 'SO') { std = 'EN-1092-1'; enAssumed = true; }   // A10.1 — SO std-isimsiz → EN varsay
  let ft = null;
  if (std === 'EN-1092-1') ft = tipRaw === 'WN' ? 'EN-T11' : tipRaw === 'SO' ? 'EN-T12'
                              : tipRaw === 'BL' ? 'EN-T05' : tipRaw === 'LJ' ? 'EN-T12' : null;
  else if (std === 'B16.5') ft = tipRaw;   // literal WN/SO/BL
  let pn = null;
  const mp = t.match(/PN\s*(\d+)/i); if (mp) pn = mp[1];
  const mc = t.match(/(\d+)\s*LBS/i) || t.match(/class\s*(\d+)/i); if (!pn && mc) pn = mc[1];
  let dn = null;
  const md = b.match(/^DN?\s*(\d+)/i);
  if (md) dn = +md[1];
  else { const mx = b.match(/^(\d+)\s*x/i);
    if (mx) dn = +mx[1];
    else { const mn = b.replace(/[^\d.]/g, ''); if (mn && NPS_DN[mn] != null) dn = NPS_DN[mn]; } }
  if (enAssumed) enVarsayildi++;
  return { std, ft, pn, dn };
}

// ── BOM + library çek ──
let all = [], from = 0;
while (true) {
  const { data } = await supa.from('spool_malzemeleri')
    .select('id,tanim,boyut,malzeme,kalite,flansh_olculer_id').range(from, from + 999);
  if (!data.length) break; all = all.concat(data); if (data.length < 1000) break; from += 1000;
}
const reF = /\bflange\b|flan[şs]/i;
const hedef = all.filter(r => r.tanim && reF.test(r.tanim)
  && grup(r.kalite, r.malzeme) === 'paslanmaz' && !r.flansh_olculer_id);

const { data: lib } = await supa.from('flansh_olculer')
  .select('id,geometri_std,flansh_tipi,basinc_sinifi,cap_dn')
  .is('tenant_id', null).eq('malzeme_grubu', 'paslanmaz');
const libIdx = {};
lib.forEach(r => { libIdx[`${r.geometri_std}|${r.flansh_tipi}|${r.basinc_sinifi}|${r.cap_dn}`] = r.id; });

// ── Eşleştirme haritası ──
const updateMap = [], esmez = [];
hedef.forEach(r => {
  const k = parseKey(r);
  if (!k.std || !k.ft || !k.pn || k.dn == null) { esmez.push(k); return; }
  const libId = libIdx[`${k.std}|${k.ft}|${k.pn}|${k.dn}`];
  if (libId) updateMap.push({ bomId: r.id, libId });
  else esmez.push(k);
});

console.log('────────────────────────────────────────────');
console.log(`Mod          : ${YAZ ? '✍  YAZMA' : '🔍 DRY-RUN (yazma YOK)'}`);
console.log(`Hedef BOM    : ${hedef.length} paslanmaz flanş (FK null)`);
console.log(`Library satır: ${lib.length} paslanmaz`);
console.log(`EŞLEŞTİ      : ${updateMap.length}`);
console.log(`EŞLEŞMEDİ    : ${esmez.length}`);
console.log(`EN varsayıldı: ${enVarsayildi} (SO std-isimsiz)`);
console.log('────────────────────────────────────────────');

if (!YAZ) {
  console.log(`\n${updateMap.length} GÜNCELLENECEK, 0 zaten dolu (DRY-RUN, hiçbir update yapılmadı).`);
  console.log('İlk 5 atama (bomId → libId):');
  updateMap.slice(0, 5).forEach((u, i) => console.log(`  ${i + 1}. ${u.bomId}  →  ${u.libId}`));
  console.log(`\nGerçek yazmak için: node ${process.argv[1].split('/').pop()} --yaz`);
  process.exit(0);
}

// ── GERÇEK YAZMA (per-row, idempotent) ──
let guncellendi = 0, zatenDolu = 0, hata = 0;
for (const u of updateMap) {
  const { data, error } = await supa.from('spool_malzemeleri')
    .update({ flansh_olculer_id: u.libId })
    .eq('id', u.bomId)
    .is('flansh_olculer_id', null)   // idempotent koruma — dolu satıra dokunma
    .select('id');
  if (error) { hata++; console.error(`  ✗ ${u.bomId}: ${error.message}`); }
  else if (data && data.length) guncellendi++;
  else zatenDolu++;                  // WHERE null tutmadı → zaten doluydu
}
console.log(`\nSonuç: ${guncellendi} GÜNCELLENDI, ${zatenDolu} ZATEN_DOLU(atlandı), ${hata} HATA.`);
console.log('────────────────────────────────────────────');
process.exit(hata > 0 ? 1 : 0);
