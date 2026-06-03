// test-l2-format.mjs — kaydedilen parser_kural'ı GERÇEK l2-parser ile çalıştır ($0, AI yok)
//   node test-l2-format.mjs <pdf-yolu> [kural.json]
// kural.json = izometri_format_tanimlari.parser_kural (DB'den kopyala)
import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { metinNormalle } from './lib/glyph-onar.js';
import { parse } from './lib/l2-parser.js';

const pdfPath = process.argv[2];
const kuralPath = process.argv[3] || 'kural.json';
if (!pdfPath) { console.error('Kullanım: node test-l2-format.mjs <pdf-yolu> [kural.json]'); process.exit(1); }

const buf = fs.readFileSync(pdfPath);
const kural = JSON.parse(fs.readFileSync(kuralPath, 'utf8'));

const { text } = await pdfParse(buf);
const temiz = metinNormalle(text).metin;          // izometri-oku ile aynı yol: pdf-parse + glyph-onar
const sonuc = parse(temiz, kural);                 // GERÇEK l2-parser

console.log('═══ L2 SONUÇ (AI çağrısı YOK, $0) ═══');
console.log('ok            :', sonuc.ok);
console.log('parser_seviye :', sonuc.parser_seviye || 'l2');
console.log('başarılı/toplam:', (sonuc.basarili != null ? sonuc.basarili : '?') + '/' + (sonuc.toplam != null ? sonuc.toplam : '?'));
if (sonuc.eksik_zorunlu && sonuc.eksik_zorunlu.length) console.log('eksik zorunlu  :', sonuc.eksik_zorunlu.join(', '));
console.log('\n── çıkarılan alanlar ──');
console.log(JSON.stringify(sonuc.cikarilan || sonuc, null, 2));
