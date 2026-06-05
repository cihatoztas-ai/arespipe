// 160 mekanik test: is_id zinciri — izometrileriDerle → incelemeTablosu → endpoint enjeksiyon mantığı
import { izometrileriDerle } from './api/devre-inceleme.js';
import { incelemeTablosu } from './lib/izo-eslesme.js';

const kabuk = [
  { pipeline: 'M110-303-013', spoolNo: 'S01', anaMalzeme: 'karbon', toplamKg: 12 },
  { pipeline: 'M110-303-013', spoolNo: 'S02', anaMalzeme: 'karbon', toplamKg: 9 },
];
const izoKayitlar = [
  { is_id: 'IS-AAA', dosya_adi: 'M110-303-013 1(2).S01.1.pdf', islendi: true,
    parse_sonuc: { spoollar: [{ spool_no: 'S01', guven_skoru: 0.4, et_kaynagi: 'pdf_vision' }] } }, // zayıf+L3
  { is_id: 'IS-BBB', dosya_adi: 'M110-303-013 2(2).S02.1.pdf', islendi: true,
    parse_sonuc: { spoollar: [{ spool_no: 'S02', guven_skoru: 0.95, et_kaynagi: 'l2_regex' }] } },  // okundu L2
  { is_id: 'IS-CCC', dosya_adi: 'GARIP-AD.pdf', islendi: true,
    parse_sonuc: { spoollar: [{ spool_no: 'S09', guven_skoru: 0.9 }] } },                            // anahtarsız → fazla
];

const izometriler = izometrileriDerle(izoKayitlar, kabuk);
const sonuc = incelemeTablosu({ kabukSpoollar: kabuk, izometriler, guvenEsigi: 0.7 });

// endpoint enjeksiyonunun birebir kopyası
const isIdHarita = new Map();
for (const z of izometriler) { if (z.dosya_adi && z.is_id) isIdHarita.set(z.dosya_adi, z.is_id); }
for (const s of (sonuc.spoollar || [])) {
  if (s.izometri && s.izometri.dosya_adi) s.izometri.is_id = isIdHarita.get(s.izometri.dosya_adi) || null;
}
for (const f of (sonuc.fazla || [])) { if (f.dosya_adi) f.is_id = isIdHarita.get(f.dosya_adi) || null; }

let fail = 0;
const beklenti = (ad, kosul, detay) => { if (kosul) console.log('✓', ad); else { fail++; console.log('✗', ad, '→', detay); } };

const s1 = sonuc.spoollar.find(s => s.spoolNo === 'S01');
const s2 = sonuc.spoollar.find(s => s.spoolNo === 'S02');
beklenti('S01 zayıf + is_id=IS-AAA', s1 && s1.durum === 'zayif' && s1.izometri.is_id === 'IS-AAA', JSON.stringify(s1));
beklenti('S01 seviye L3 (Tanıt butonu koşulu)', s1 && /l3/i.test(String(s1.izometri.seviye || '')), s1 && s1.izometri.seviye);
beklenti('S02 okundu + is_id=IS-BBB', s2 && s2.durum === 'okundu' && s2.izometri.is_id === 'IS-BBB', JSON.stringify(s2));
beklenti('S02 L2 → wizard Tanıt göstermez', s2 && !/l3/i.test(String(s2.izometri.seviye || '')), s2 && s2.izometri.seviye);
beklenti('fazla satırı is_id=IS-CCC', (sonuc.fazla || []).some(f => f.is_id === 'IS-CCC'), JSON.stringify(sonuc.fazla));
beklenti('izometriler hepsinde is_id taşındı', izometriler.every(z => z.is_id), JSON.stringify(izometriler.map(z => z.is_id)));

console.log(fail === 0 ? '\n=== 6/6 YEŞİL ===' : `\n=== ${fail} KIRMIZI ===`);
process.exit(fail ? 1 : 0);
