// Tersan L2 parser regresyon testi (Oturum 105, MK-51.2)
// Calistir: node test/l2-tersan-test.mjs
// parser_kural'i (test/l2-tersan-kural.json) lib/l2-parser.js ile 9 gercek ornege karsi
// dogrular. izometri_format_tanimlari.parser_kural ile AYNI olmali (DB <-> repo senkron).
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
    if (ml.length !== b.malzeme_sayisi) hatalar.push(`malzeme ${ml.length}!=${b.malzeme_sayisi}`);
    const ham = ml.filter(m=>m.ham_satir).length;
    if (ham !== b.ham_sayisi) hatalar.push(`ham ${ham}!=${b.ham_sayisi}`);
  }
  if (hatalar.length) { kaldi++; console.error(`FAIL ${fx.ad}: ${hatalar.join(', ')}`); }
  else { gecti++; console.log(`OK   ${fx.ad}`); }
}
console.log(`\n=== ${gecti}/${fixtures.length} gecti, ${kaldi} kaldi ===`);
process.exit(kaldi ? 1 : 0);
