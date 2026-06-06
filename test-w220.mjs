// 161 mekanik test: W-2.20 — bindirme çelişki DETAYI zinciri
//   izometrileriDerle (anahtara iliştir) → endpoint enjeksiyon mantığı (spool'a taşı)
import { izometrileriDerle } from './api/devre-inceleme.js';
import { incelemeTablosu } from './lib/izo-eslesme.js';
import { normPipeline, normSpoolNo } from './api/kuyruk-isle-izometri.js';

const kabuk = [
  // et 4.5 / cap 76.1 — PDF et 3.05 ile ÇELİŞECEK; cap eşit; S02 çelişkisiz kontrol
  { pipeline: 'M130-722-1104', spoolNo: 'S01', anaMalzeme: 'karbon', toplamKg: 22,
    et: 4.5, cap: 76.1 },
  { pipeline: 'M130-722-1104', spoolNo: 'S02', anaMalzeme: 'karbon', toplamKg: 9,
    et: 3.05, cap: 76.1 },
];
const izoKayitlar = [
  { is_id: 'IS-X', dosya_adi: 'M130-722-1104 1(2).S01.1.pdf', islendi: true,
    parse_sonuc: { spoollar: [{ spool_no: 'S01', guven_skoru: 1, et_kaynagi: 'l2_regex',
      et_mm: 3.05, cap_mm: 76.1, agirlik_kg: 22.1 }] } },     // et ÇELİŞKİ, cap eşit, ağırlık %3 içi
  { is_id: 'IS-Y', dosya_adi: 'M130-722-1104 2(2).S02.1.pdf', islendi: true,
    parse_sonuc: { spoollar: [{ spool_no: 'S02', guven_skoru: 1, et_kaynagi: 'l2_regex',
      et_mm: 3.05, cap_mm: 76.1 }] } },                        // tam eşit → çelişki yok
];

const izometriler = izometrileriDerle(izoKayitlar, kabuk);
const sonuc = incelemeTablosu({ kabukSpoollar: kabuk, izometriler, guvenEsigi: 0.7 });

// endpoint W-2.20 enjeksiyonunun birebir kopyası
const bindirmeHarita = new Map();
for (const z of izometriler) {
  for (const a of (z.anahtarlar || [])) {
    if (!a.bindirme_celiski || !a.bindirme_celiski.length) continue;
    const kb = normPipeline(a.pipeline) + '|' + normSpoolNo(a.spoolNo);
    if (!bindirmeHarita.has(kb)) bindirmeHarita.set(kb, { dosya_adi: z.dosya_adi || null, celiski: a.bindirme_celiski });
  }
}
for (const s of (sonuc.spoollar || [])) {
  const kb = normPipeline(s.pipeline) + '|' + normSpoolNo(s.spoolNo);
  const bc = bindirmeHarita.get(kb);
  s.bindirme_celiski = bc ? bc.celiski : null;
  s.bindirme_dosya = bc ? bc.dosya_adi : null;
}

let ok = 0, fail = 0;
function t(ad, kosul) { if (kosul) { ok++; console.log('✓ ' + ad); } else { fail++; console.log('✗ ' + ad); } }

const s1 = sonuc.spoollar.find((s) => s.spoolNo === 'S01');
const s2 = sonuc.spoollar.find((s) => s.spoolNo === 'S02');

t('S01 zayıf (çelişki sinyali)', s1 && s1.durum === 'zayif' && s1.bindirme_flag === true);
t('S01 bindirme_celiski dolu', s1 && Array.isArray(s1.bindirme_celiski) && s1.bindirme_celiski.length === 1);
t('S01 çelişen alan = et, kabuk 4.5 ↔ pdf 3.05',
  s1 && s1.bindirme_celiski[0].alan === 'et' && s1.bindirme_celiski[0].kabuk === 4.5 && s1.bindirme_celiski[0].pdf === 3.05);
t('S01 secilen = kabuk (ezme yok)', s1 && s1.bindirme_celiski[0].secilen === 4.5);
t('S01 kaynak dosya taşındı', s1 && s1.bindirme_dosya === 'M130-722-1104 1(2).S01.1.pdf');
t('S02 okundu + çelişki listesi yok (gürültü yok)', s2 && s2.durum === 'okundu' && s2.bindirme_celiski == null);

console.log(fail === 0 ? '\n=== ' + ok + '/' + (ok + fail) + ' YEŞİL ===' : '\n=== ' + fail + ' KIRMIZI ===');
process.exit(fail === 0 ? 0 : 1);
