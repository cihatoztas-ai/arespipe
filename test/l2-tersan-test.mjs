// Tersan L2 parser regresyon testi (Oturum 105, MK-51.2)
// Calistir: node test/l2-tersan-test.mjs
// parser_kural'i (test/l2-tersan-kural.json) lib/l2-parser.js ile gercek + sentetik ornege karsi
// dogrular. izometri_format_tanimlari.parser_kural ile AYNI olmali (DB <-> repo senkron).
// Kapsar: spool alanlari, malzeme listesi, dn, adet (iki-haneli No / BUG1), NOT-disi (BUG2), not_metni + alistirma_ipucu (Oturum 106).
import { parse } from '../lib/l2-parser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const kural = JSON.parse(fs.readFileSync(path.join(__dir, 'l2-tersan-kural.json'), 'utf8'));
const fixtures = JSON.parse(fs.readFileSync(path.join(__dir, 'l2-tersan-fixtures.json'), 'utf8'));

let gecti = 0, kaldi = 0;
for (const fx of fixtures) {
  const r = parse(fx.metin, kural);
  const sp = r.parsed?.spoollar?.[0] || {};
  const ml = sp.malzeme_listesi || [];
  const b = fx.beklenen;
  const hatalar = [];
  if (r.ok !== b.ok) hatalar.push(`ok ${r.ok}!=${b.ok}`);
  if (b.ok) {
    if ((sp.spool_no||null) !== b.spool_no) hatalar.push(`spool_no ${sp.spool_no}!=${b.spool_no}`);
    if ((sp.agirlik_kg??null) !== b.agirlik_kg) hatalar.push(`agirlik ${sp.agirlik_kg}!=${b.agirlik_kg}`);
    if ((sp.yuzey||null) !== b.yuzey) hatalar.push(`yuzey ${sp.yuzey}!=${b.yuzey}`);
    if (b.dn !== undefined && (sp.dn??null) !== b.dn) hatalar.push(`dn ${sp.dn}!=${b.dn}`);
    if (ml.length !== b.malzeme_sayisi) hatalar.push(`malzeme ${ml.length}!=${b.malzeme_sayisi}`);
    const ham = ml.filter(m=>m.ham_satir).length;
    if (ham !== b.ham_sayisi) hatalar.push(`ham ${ham}!=${b.ham_sayisi}`);
    if (Array.isArray(b.adetler)) {
      const a = ml.map(m=>m.adet??null);
      if (JSON.stringify(a) !== JSON.stringify(b.adetler)) hatalar.push(`adet ${JSON.stringify(a)}!=${JSON.stringify(b.adetler)}`);
    }
    if (b.not_metni !== undefined && (sp.not_metni||null) !== (b.not_metni||null)) hatalar.push(`not_metni ${JSON.stringify(sp.not_metni)}!=${JSON.stringify(b.not_metni)}`);
    if (b.alistirma_ipucu !== undefined && (sp.alistirma_ipucu||null) !== (b.alistirma_ipucu||null)) hatalar.push(`alistirma_ipucu ${sp.alistirma_ipucu}!=${b.alistirma_ipucu}`);
    // BUG1 guard: malzeme tanimi rakamla baslamamali ("1Flans" hatasi)
    const kirli = ml.filter(m => /^\d/.test(m.tanim||'')).map(m=>m.tanim.slice(0,15));
    if (kirli.length) hatalar.push(`tanim rakamla basliyor: ${JSON.stringify(kirli)}`);
  }
  if (hatalar.length) { kaldi++; console.error(`FAIL ${fx.ad}: ${hatalar.join(', ')}`); }
  else { gecti++; console.log(`OK   ${fx.ad}`); }
}
console.log(`\n=== ${gecti}/${fixtures.length} gecti, ${kaldi} kaldi ===`);
process.exit(kaldi ? 1 : 0);
