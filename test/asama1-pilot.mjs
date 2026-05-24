'use strict';

// ============================================================================
// asama1-pilot.mjs — Aşama 1 PİLOT self-test (oturum 119)
// ----------------------------------------------------------------------------
// PDF GEREKTİRMEZ. 3 şeyi kanıtlar:
//   T1. Composability: e1fb879d'yi paketlere ayırıp birleştirici ile geri kurmak
//       fonksiyonel olarak aynı parser_kural'ı üretir (alan+satır kümeleri).
//   T2. specificity sıralaması: boru_sch (emperyal) her zaman boru_mm (metrik)'ten önce.
//   T3. Gerçek parse() wiring: birleştirici çıktısıyla l2-parser.parse çağrılınca
//       sentetik Tersan metni ok:true döner; karbon spool'da cap_mm dolu.
//   T4. facet algılama: karbon-only → tek paket; ikisi → iki paket (NB1137 modeli).
//   T5. + PİLOT kazanım: boru_sch artık inç(nps_inc)+Sch(schedule_kod) yakalıyor.
//
// Gerçek PDF (MK-51.2: 5+ örnek) ile uçtan uca doğrulama AYRI adım — Cihat PDF getirince.
// ============================================================================

import { parse } from '../lib/l2-parser.js';
import { birlestir, facetAlgila, paketSec, aileBirlestir } from '../lib/katman-birlestirici.js';
import { TUM_PAKETLER } from '../lib/format-paketleri.js';

// --- e1fb879d gerçek parser_kural'ı (Cihat'ın Supabase'den verdiği, fixture) ---
const E1FB879D = {
  ekstraktor_tipi: 'regex_text',
  min_metin_uzunlugu: 100,
  alanlar: {
    dn: { tip: 'int', grup: 1, regex: 'DN(\\d+)\\s+(?:\\d|L=|OD:)' },
    et_mm: { tip: 'float', grup: 1, regex: '\\d+\\.\\d+x(\\d+\\.\\d)' },
    tarih: { tip: 'string', grup: 1, regex: '\\n(\\d{2}-\\d{2}-\\d{2})\\n' },
    yuzey: { tip: 'string', grup: 1, regex: '\\n(Galvaniz|Paslanmaz|CUNIFE|Siyah|Asit|Boyal.)\\n' },
    cap_mm: { tip: 'float', grup: 1, regex: '(\\d+\\.\\d+)x\\d+\\.\\d' },
    spool_no: { tip: 'string', grup: 1, regex: '\\n-(S\\d+(?:_\\d+)?)\\n' },
    not_metni: { tip: 'string', flag: 'im', grup: 1, regex: 'NOT: *,? *(.+?)(?: {3,}| +[0-9]+[.,][0-9]+ *kg|$)' },
    agirlik_kg: { tip: 'float', grup: 1, regex: '\\n(\\d+(?:\\.\\d+)?)\\s*kg\\n' }
  },
  malzeme_tablosu: {
    aktif: true,
    satir_tipleri: [
      { ad: 'boru_sch' }, { ad: 'groove' }, { ad: 'kaynak' }, { ad: 'bilezik' },
      { ad: 'dirsek' }, { ad: 'flans' }, { ad: 'boru_mm' }
    ]
  },
  kabul_kriterleri: { min_malzeme_satir: 1, l3_fallback_yapilir: true, min_overall_match_orani: 0.5 }
};

let gecen = 0, kalan = 0;
function ok(ad, kosul, detay) {
  if (kosul) { gecen++; console.log('  ✅ ' + ad); }
  else { kalan++; console.log('  ❌ ' + ad + (detay ? '  → ' + detay : '')); }
}
function setEsit(a, b) {
  const sa = new Set(a), sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

console.log('\n=== T1. Composability (her iki malzeme facet dahil) ===');
const ikisiText = 'St.St 316L "Sch ... 168.3x4.5 Galvaniz'; // hem karbon hem paslanmaz token
const { secili: seciliIkisi } = paketSec(ikisiText, TUM_PAKETLER);
const etkin = birlestir(seciliIkisi);

const e1Alanlar = Object.keys(E1FB879D.alanlar).sort();
const etkinAlanlar = Object.keys(etkin.alanlar).sort();
ok('alan kümesi e1fb879d ile aynı', setEsit(e1Alanlar, etkinAlanlar),
   'e1=' + e1Alanlar.join(',') + ' | etkin=' + etkinAlanlar.join(','));

const e1Satir = E1FB879D.malzeme_tablosu.satir_tipleri.map(s => s.ad).sort();
const etkinSatir = etkin.malzeme_tablosu.satir_tipleri.map(s => s.ad).sort();
ok('satir_tipleri kümesi e1fb879d ile aynı', setEsit(e1Satir, etkinSatir),
   'e1=' + e1Satir.join(',') + ' | etkin=' + etkinSatir.join(','));

ok('ekstraktor_tipi korunur', etkin.ekstraktor_tipi === E1FB879D.ekstraktor_tipi);
ok('min_metin_uzunlugu korunur', etkin.min_metin_uzunlugu === E1FB879D.min_metin_uzunlugu);
ok('kabul_kriterleri korunur',
   etkin.kabul_kriterleri.min_overall_match_orani === 0.5 &&
   etkin.kabul_kriterleri.l3_fallback_yapilir === true &&
   etkin.kabul_kriterleri.min_malzeme_satir === 1);

console.log('\n=== T2. specificity sıralaması (boru_sch < boru_mm indeksi) ===');
const adlar = etkin.malzeme_tablosu.satir_tipleri.map(s => s.ad);
const iSch = adlar.indexOf('boru_sch');
const iMm = adlar.indexOf('boru_mm');
ok('boru_sch, boru_mm-den ÖNCE deneniyor', iSch > -1 && iMm > -1 && iSch < iMm,
   'sıra=' + adlar.join(','));

console.log('\n=== T3. Gerçek parse() wiring (sentetik karbon Tersan metni) ===');
// Sentetik: e1fb879d alanlarını ve bir metrik boru satırını tetikleyecek minimal metin.
const sentetikKarbon = [
  'Drawing symbols SPOOL NAME WELDING NUMBER CUT NUMBER',
  '-S01_1',
  'DN150 168.3x4.5',
  'NOT: , ',
  'Malzeme Listesi',
  '1Boru Dikissiz Celik168.3x4.52000 ST371250.5',
  '25.5 kg',
  '01-02-26',
  'Galvaniz'
].join('\n');
const karbonEtkin = birlestir(paketSec(sentetikKarbon, TUM_PAKETLER).secili);
const r = parse(sentetikKarbon, karbonEtkin);
ok('parse ok:true (atılmadı, throw yok)', r && r.ok === true, JSON.stringify(r && r.sebep));
const sp = r && r.parsed && r.parsed.spoollar && r.parsed.spoollar[0];
ok('spool üretildi', !!sp);
ok('karbon spool cap_mm dolu (metrik ODxWT)', !!(sp && sp.cap_mm), 'cap_mm=' + (sp && sp.cap_mm));
ok('malzeme listesi en az 1 satır', !!(sp && sp.malzeme_listesi && sp.malzeme_listesi.length >= 1),
   'satır=' + (sp && sp.malzeme_listesi && sp.malzeme_listesi.length));

console.log('\n=== T4. facet algılama (per-satır karar A) ===');
const fKarbon = facetAlgila('Boru Dikissiz 168.3x4.5 ST37 Galvaniz');
ok('karbon-only metin → sadece karbon facet',
   fKarbon.malzeme_gruplari.includes('karbon') && !fKarbon.malzeme_gruplari.includes('paslanmaz'),
   fKarbon.malzeme_gruplari.join(','));
const fIkisi = facetAlgila(ikisiText);
ok('NB1137 modeli (ikisi de) → iki facet',
   fIkisi.malzeme_gruplari.includes('karbon') && fIkisi.malzeme_gruplari.includes('paslanmaz'),
   fIkisi.malzeme_gruplari.join(','));
const fPas = facetAlgila('Boru Dikissiz 2" Sch 10S 316L');
ok('paslanmaz-only metin → sadece paslanmaz facet',
   fPas.malzeme_gruplari.includes('paslanmaz') && !fPas.malzeme_gruplari.includes('karbon'),
   fPas.malzeme_gruplari.join(','));
// paslanmaz-only → karbon paketi DAHİL EDİLMEZ → metrik cap_mm alanı yok
const pasEtkin = birlestir(paketSec('2" Sch 10S 316L', TUM_PAKETLER).secili);
ok('paslanmaz-only birleşimde metrik cap_mm alanı YOK (yanlış metrik uygulanmaz)',
   !('cap_mm' in pasEtkin.alanlar), Object.keys(pasEtkin.alanlar).join(','));

console.log('\n=== T5. + PİLOT kazanım: boru_sch inç+Sch yakalıyor ===');
const boruSch = etkin.malzeme_tablosu.satir_tipleri.find(s => s.ad === 'boru_sch');
ok('boru_sch grup_haritasi nps_inc içeriyor', !!(boruSch && boruSch.grup_haritasi.nps_inc),
   JSON.stringify(boruSch && boruSch.grup_haritasi));
ok('boru_sch grup_haritasi schedule_kod içeriyor', !!(boruSch && boruSch.grup_haritasi.schedule_kod));

console.log('\n=== T6. aileBirlestir registry (izometri-oku.js wiring mantığı) ===');
const rSpool = aileBirlestir('tersan_cadmatic_spool', ikisiText);
ok('tersan_cadmatic_spool → etkin kural döner', !!rSpool && !!rSpool.malzeme_tablosu);
const spoolBoru = rSpool ? rSpool.malzeme_tablosu.satir_tipleri.filter(s=>s.kategori==='boru').map(s=>s.ad) : [];
ok('etkin kural boru_sch + boru_mm içerir', spoolBoru.includes('boru_sch') && spoolBoru.includes('boru_mm'),
   spoolBoru.join(','));
ok('tersan_cadmatic_montaj → null (DB kuralı yolu, imalat paketine bağlanmaz)',
   aileBirlestir('tersan_cadmatic_montaj', ikisiText) === null);
ok('paor_aveva_ana → null (L3 yolu)', aileBirlestir('paor_aveva_ana', ikisiText) === null);
ok('tersan_cadmatic_isometry → null (aday, henüz doğrulanmadı)',
   aileBirlestir('tersan_cadmatic_isometry', ikisiText) === null);
ok('tanımsız format (null) → null', aileBirlestir(null, ikisiText) === null);

console.log('\n=== SONUÇ ===');
console.log(`  Geçen: ${gecen} | Kalan: ${kalan}`);
if (kalan > 0) { console.log('  ⛔ PİLOT KIRMIZI'); process.exit(1); }
console.log('  ✅ PİLOT YEŞİL (composability + wiring kanıtlandı; gerçek PDF doğrulaması bekliyor)');
