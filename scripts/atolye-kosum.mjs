// ============================================================================
// atolye-kosum.mjs — Format atölyesi toplu kanıt koşumu (165)
// ----------------------------------------------------------------------------
// Kullanım:  node scripts/atolye-kosum.mjs <pdf_klasoru>
// Hat: pdfParse → glyph-onar(metinNormalle) → aileBirlestir → L2.parse
//      — sunucu hattının (kuyruk-isle-izometri → izometri-oku L2 yolu) birebiri.
// Aile seçimi yapısal: 'Malzeme Listesi' VAR → spool, YOK → montaj (B1/MK-118.1).
// Çıktı: PDF başına tek satır envanter (dn/cap/et/kaynak/sch + satır/ham sayısı,
//        montajda pipe/spool_n/continue/alıştırma/blok) + ham satırların dökümü.
// Amaç: her parser/paket değişikliğinde gerçek PDF seti üzerinde 30 sn regresyon
//       (MK-162.3: kanıt makamı sunucu metni; MK-105.8: üretim PDF'i > sentetik).
// ============================================================================
import fs from 'fs'; import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { metinNormalle } from '../lib/glyph-onar.js';
import { aileBirlestir } from '../lib/katman-birlestirici.js';
import L2 from '../lib/l2-parser.js';

const KOK = process.argv[2];
if (!KOK || !fs.existsSync(KOK)) {
  console.error('Kullanım: node scripts/atolye-kosum.mjs <pdf_klasoru>');
  process.exit(1);
}
const pdfler = [];
(function tara(d){ for (const f of fs.readdirSync(d)) {
  if (f.startsWith('.') || f === '__MACOSX') continue;
  const p = path.join(d, f);
  if (fs.statSync(p).isDirectory()) tara(p);
  else if (f.toLowerCase().endsWith('.pdf')) pdfler.push(p);
} })(KOK);
pdfler.sort();
console.log(`${pdfler.length} PDF bulundu — ${KOK}\n`);

let toplamHam = 0, fail = 0;
for (const p of pdfler) {
  const ad = path.basename(p);
  let satir = ad.padEnd(40) + ' | ';
  try {
    const data = await pdfParse(fs.readFileSync(p));
    const gn = metinNormalle(data.text || '');
    const text = gn.metin;
    const spoolMu = text.includes('Malzeme Listesi');
    const kod = spoolMu ? 'tersan_cadmatic_spool' : 'tersan_cadmatic_montaj';
    const r = L2.parse(text, aileBirlestir(kod, text));
    if (!r.ok) { fail++; console.log(satir + `${spoolMu?'SPOOL':'MONTAJ'} ✖ L2 FAIL: ${r.sebep}`); continue; }
    if (spoolMu) {
      const s = r.parsed?.spoollar?.[0] || {};
      const ml = s.malzeme_listesi || [];
      const hamlar = ml.filter(x => x.ham_satir);
      toplamHam += hamlar.length;
      satir += `SPOOL[${gn.durum}]  dn=${s.dn} cap=${s.cap_mm} et=${s.et_mm} (${s.et_kaynagi}) sch=${s.schedule||'-'} | satir=${ml.length} ham=${hamlar.length}`;
      console.log(satir);
      for (const h of hamlar) console.log(' '.repeat(43) + '⚠ HAM: ' + JSON.stringify(String(h.tanim)));
    } else {
      const m = r.montaj || {};
      console.log(satir + `MONTAJ[${gn.durum}] pipe=${m.pipe_no||'-'} spool_n=${(m.spool_listesi||[]).length} cont=${(m.continue_baglanti||[]).length} alistirma=${m.alistirma||'-'} blok=${m.blok||'-'}`);
    }
  } catch (e) { fail++; console.log(satir + '✖ HATA: ' + e.message.slice(0, 80)); }
}
console.log(`\n--- toplam: ${pdfler.length} PDF · L2 fail: ${fail} · ham satır: ${toplamHam}`);
