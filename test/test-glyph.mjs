import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { metinNormalle } from './lib/glyph-onar.js';
const buf = fs.readFileSync(process.argv[2]);
pdfParse(buf).then(({ text }) => {
  const r = metinNormalle(text);
  console.log('--- HAM (pdf-parse) ilk 400 ---\n' + JSON.stringify(text.slice(0, 400)));
  console.log('\ndurum:', r.durum, '| A:', r.glyph_band_a, 'B:', r.glyph_band_b);
  console.log('eslenmeyen:', r.band_b_meta && r.band_b_meta.eslenmeyen);
  console.log('\n--- TEMIZ ilk 400 ---\n' + JSON.stringify(r.metin.slice(0, 400)));
});
