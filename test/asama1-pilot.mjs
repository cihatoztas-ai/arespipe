'use strict';

// ============================================================================
// asama1-pilot.mjs — Aşama 1 self-test (oturum 119) + MONTAJ drift guard (120)
// ----------------------------------------------------------------------------
// PDF GEREKTİRMEZ. Kanıtladıkları:
//   T1. Composability: e1fb879d'yi (SPOOL ailesi) paketlere ayırıp birleştirici
//       ile geri kurmak fonksiyonel olarak aynı parser_kural'ı üretir.
//   T2. specificity: boru_sch (emperyal) her zaman boru_mm (metrik)'ten önce.
//   T3. Gerçek parse() wiring: sentetik karbon Tersan metni ok:true, cap_mm dolu.
//   T4. facet algılama: karbon/paslanmaz seçimi (NB1137 modeli).
//   T5. PİLOT kazanım: boru_sch inç(nps_inc)+Sch(schedule_kod) yakalıyor.
//   T6. aileBirlestir registry: spool+montaj BAĞLI, isometry/paor/null → null.
//   T7. MONTAJ drift guard (+120): montaj paketi = montaj sözleşmesi (montaj_modu,
//       liste_alanlar, min_spool, pipe_no'nun [[PIPE:]] OLMADIĞI), ve gerçek parse'ta
//       pipe_no dolu + `-ALS` → alistirma=PARCA (NB1137 pipeline_no kırılması düzeldi).
//
// + 120 NOT: TUM_PAKETLER artık ÇOK-AİLE envanteri (montaj dahil). Tek-aile
// composability testleri SPOOL ailesini (registry) kullanmalı — tüm havuzu değil,
// yoksa montaj (Katman 1) spool birleşimine sızar. Üretimde aileBirlestir zaten
// AILE_KAYIT[format_kodu] kullanır; aileler karışmaz.
//
// Gerçek PDF (MK-51.2: 5+ örnek) uçtan uca doğrulama AYRI yapılır (oturum 120'de
// 7 montaj + 8 spool PDF ile gerçek motorda yapıldı: montaj pipe_no doldu, spool 0 regresyon).
// ============================================================================

import { parse } from '../lib/l2-parser.js';
import { birlestir, facetAlgila, paketSec, aileBirlestir } from '../lib/katman-birlestirici.js';
import { TUM_PAKETLER, AILE_KAYIT } from '../lib/format-paketleri.js';
import { onar29, capaVar, metinNormalle } from '../lib/glyph-onar.js';

// SPOOL ailesi (registry = tek kaynak). Composability testleri bunu kullanır.
const SPOOL = AILE_KAYIT.tersan_cadmatic_spool;

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

console.log('\n=== T1. Composability (SPOOL ailesi, her iki malzeme facet dahil) ===');
const ikisiText = 'St.St 316L "Sch ... 168.3x4.5 Galvaniz';
const etkin = birlestir(paketSec(ikisiText, SPOOL).secili);
ok('alan kümesi e1fb879d ile aynı', setEsit(Object.keys(E1FB879D.alanlar), Object.keys(etkin.alanlar)),
   'etkin=' + Object.keys(etkin.alanlar).sort().join(','));
ok('satir_tipleri kümesi e1fb879d ile aynı',
   setEsit(E1FB879D.malzeme_tablosu.satir_tipleri.map(s => s.ad), etkin.malzeme_tablosu.satir_tipleri.map(s => s.ad)));
ok('ekstraktor_tipi korunur', etkin.ekstraktor_tipi === E1FB879D.ekstraktor_tipi);
ok('min_metin_uzunlugu korunur', etkin.min_metin_uzunlugu === E1FB879D.min_metin_uzunlugu);
ok('kabul_kriterleri korunur',
   etkin.kabul_kriterleri.min_overall_match_orani === 0.5 &&
   etkin.kabul_kriterleri.l3_fallback_yapilir === true &&
   etkin.kabul_kriterleri.min_malzeme_satir === 1);

console.log('\n=== T2. specificity sıralaması (boru_sch < boru_mm indeksi) ===');
const adlar = etkin.malzeme_tablosu.satir_tipleri.map(s => s.ad);
ok('boru_sch, boru_mm-den ÖNCE deneniyor',
   adlar.indexOf('boru_sch') > -1 && adlar.indexOf('boru_mm') > -1 && adlar.indexOf('boru_sch') < adlar.indexOf('boru_mm'),
   'sıra=' + adlar.join(','));

console.log('\n=== T3. Gerçek parse() wiring (sentetik karbon Tersan metni) ===');
const sentetikKarbon = [
  'Drawing symbols SPOOL NAME WELDING NUMBER CUT NUMBER', '-S01_1', 'DN150 168.3x4.5', 'NOT: , ',
  'Malzeme Listesi', '1Boru Dikissiz Celik168.3x4.52000 ST371250.5', '25.5 kg', '01-02-26', 'Galvaniz'
].join('\n');
const r = parse(sentetikKarbon, birlestir(paketSec(sentetikKarbon, SPOOL).secili));
ok('parse ok:true (atılmadı, throw yok)', r && r.ok === true, JSON.stringify(r && r.sebep));
const sp = r && r.parsed && r.parsed.spoollar && r.parsed.spoollar[0];
ok('spool üretildi', !!sp);
ok('karbon spool cap_mm dolu (metrik ODxWT)', !!(sp && sp.cap_mm), 'cap_mm=' + (sp && sp.cap_mm));
ok('malzeme listesi en az 1 satır', !!(sp && sp.malzeme_listesi && sp.malzeme_listesi.length >= 1));

console.log('\n=== T4. facet algılama (per-satır karar A) ===');
const fKarbon = facetAlgila('Boru Dikissiz 168.3x4.5 ST37 Galvaniz');
ok('karbon-only → sadece karbon facet', fKarbon.malzeme_gruplari.includes('karbon') && !fKarbon.malzeme_gruplari.includes('paslanmaz'));
const fIkisi = facetAlgila(ikisiText);
ok('NB1137 modeli (ikisi de) → iki facet', fIkisi.malzeme_gruplari.includes('karbon') && fIkisi.malzeme_gruplari.includes('paslanmaz'));
const fPas = facetAlgila('Boru Dikissiz 2" Sch 10S 316L');
ok('paslanmaz-only → sadece paslanmaz facet', fPas.malzeme_gruplari.includes('paslanmaz') && !fPas.malzeme_gruplari.includes('karbon'));
ok('paslanmaz-only birleşimde metrik cap_mm alanı YOK',
   !('cap_mm' in birlestir(paketSec('2" Sch 10S 316L', SPOOL).secili).alanlar));

console.log('\n=== T5. + PİLOT kazanım: boru_sch inç+Sch yakalıyor ===');
const boruSch = etkin.malzeme_tablosu.satir_tipleri.find(s => s.ad === 'boru_sch');
ok('boru_sch grup_haritasi nps_inc içeriyor', !!(boruSch && boruSch.grup_haritasi.nps_inc));
ok('boru_sch grup_haritasi schedule_kod içeriyor', !!(boruSch && boruSch.grup_haritasi.schedule_kod));

console.log('\n=== T6. aileBirlestir registry (izometri-oku.js wiring mantığı) ===');
const rSpool = aileBirlestir('tersan_cadmatic_spool', ikisiText);
const spoolBoru = rSpool ? rSpool.malzeme_tablosu.satir_tipleri.filter(s => s.kategori === 'boru').map(s => s.ad) : [];
ok('tersan_cadmatic_spool → boru_sch + boru_mm içerir', spoolBoru.includes('boru_sch') && spoolBoru.includes('boru_mm'));
// + 120: montaj ARTIK BAĞLI (eski "→ null" assertion'ı değişti).
ok('tersan_cadmatic_montaj → etkin kural döner (BAĞLI, +120)', aileBirlestir('tersan_cadmatic_montaj', ikisiText) !== null);
ok('tersan_cadmatic_isometry → null (84c12f61 ölü satır, aktif=false)', aileBirlestir('tersan_cadmatic_isometry', ikisiText) === null);
ok('paor_aveva_ana → null (L3 yolu)', aileBirlestir('paor_aveva_ana', ikisiText) === null);
ok('tanımsız format (null) → null', aileBirlestir(null, ikisiText) === null);

console.log('\n=== T7. MONTAJ drift guard (+120) — paket = montaj sözleşmesi ===');
const montajSentetik = [
  'PS', 'SB', 'Up', 'FW', '-', 'M100-317-18-ALS', '09-01-25', '31 kg', 'B1110', 'Siyah', 'ssdanis', '1()',
  '317-Fresh Water Cooling System-M100-ALS', 'Drawing symbols', 'SPOOL NAME', 'Total Weight:', 'S01',
  'M100-317-18-ALS', 'Continue: M100-317-21', 'MEZZ. DECK-5600', 'dolgu metni uzunluk icin yeterli olsun diye'
].join('\n');
const mk = aileBirlestir('tersan_cadmatic_montaj', montajSentetik);
ok('montaj_modu === true', mk && mk.montaj_modu === true);
ok('liste_alanlar: spool_listesi + continue + guverte',
   mk && mk.liste_alanlar && mk.liste_alanlar.spool_listesi && mk.liste_alanlar.continue_baglanti && mk.liste_alanlar.guverte);
ok('kabul_kriterleri.min_spool === 1', mk && mk.kabul_kriterleri && mk.kabul_kriterleri.min_spool === 1);
ok('pipe_no regex [[PIPE]] markerı DEĞİL (eski-kopya/drift guard)',
   mk && mk.alanlar.pipe_no && !/\[\[PIPE/.test(mk.alanlar.pipe_no.regex));
ok('montaj_alistirma_kurali -ALS parca_kelime',
   mk && mk.montaj_alistirma_kurali && JSON.stringify(mk.montaj_alistirma_kurali.parca_kelimeler).includes('-ALS'));
const mr = parse(montajSentetik, mk);
ok('montaj parse ok:true', mr && mr.ok === true, mr && mr.sebep);
ok('montaj pipe_no dolu (ARTIK null değil)', !!(mr && mr.montaj && mr.montaj.pipe_no), 'pipe_no=' + (mr && mr.montaj && mr.montaj.pipe_no));
ok('montaj -ALS → alistirma=PARCA (sinyal canlandı)', mr && mr.montaj && mr.montaj.alistirma === 'PARCA');
ok('montaj spool_listesi ≥ 1', !!(mr && mr.montaj && mr.montaj.spool_listesi.length >= 1));

console.log('\n=== T8. Glyph band-A onarımı (oturum 121, MK-120.3) ===');
// T8.1 — Deterministik -29 Sezar (gerçek NB1137 PDF'inden ham→gerçek çiftleri).
ok('onar29: "pmlli=k^jb" → "SPOOL NAME"', onar29('pmlli=k^jb') === 'SPOOL NAME', onar29('pmlli=k^jb'));
ok('onar29: "bNMMJUNTJMMR" → "E100-817-005"', onar29('bNMMJUNTJMMR') === 'E100-817-005', onar29('bNMMJUNTJMMR'));

// Gerçeğe sadık sentetik glyph üretici: band-A (büyük harf/rakam/noktalama) +29 kaydır;
// küçük harf a-z → band B'yi (0xC0+) taklit (onar29 dokunmaz, NB1137'de olduğu gibi).
function glyphlestir(t) {
  let o = '';
  for (const ch of t) {
    const c = ch.codePointAt(0);
    if (c >= 0x61 && c <= 0x7a) o += String.fromCharCode(c + 0x80);   // a-z → band B taklidi
    else if (c >= 0x20 && c <= 0x60) { const s = c + 29; o += (s <= 0x7e) ? String.fromCharCode(s) : ch; }
    else o += ch;                                                      // \n vs. olduğu gibi
  }
  return o;
}

// T8.2 — KAPI: temiz metin (ham'da çapa var) → DOKUNULMAZ (regresyon önleme).
const temizMontaj = montajSentetik;
const nTemiz = metinNormalle(temizMontaj);
ok('kapı: temiz metin durum=temiz', nTemiz.durum === 'temiz', nTemiz.durum);
ok('kapı: temiz metin DEĞİŞMEDİ (byte-byte)', nTemiz.metin === temizMontaj);
ok('kapı: temiz metin glyph_band_a=false', nTemiz.glyph_band_a === false);

// T8.3 — KAPI: glyph metin (ham'da çapa yok, -29 sonrası var) → ONARILIR.
const glyphMontaj = glyphlestir(temizMontaj);
ok('glyph ham metinde çapa YOK (gizli)', capaVar(glyphMontaj) === false);
const nGlyph = metinNormalle(glyphMontaj);
ok('kapı: glyph durum=glyph_band_a_onarildi', nGlyph.durum === 'glyph_band_a_onarildi', nGlyph.durum);
ok('kapı: glyph_band_a=true', nGlyph.glyph_band_a === true);
ok('onarım band-A çapaları açtı (SPOOL NAME)', capaVar(nGlyph.metin) === true);
ok('onarım: pipe_no metni geri geldi (M100-317-18-ALS)', nGlyph.metin.includes('M100-317-18-ALS'));

// T8.4 — Onarım sonrası MONTAJ parse: pipe_no + spool_listesi (band A) dolu.
const mGlyph = parse(nGlyph.metin, aileBirlestir('tersan_cadmatic_montaj', nGlyph.metin));
ok('glyph→onarım→montaj parse ok:true', mGlyph && mGlyph.ok === true, mGlyph && mGlyph.sebep);
ok('glyph→onarım: pipe_no dolu', !!(mGlyph && mGlyph.montaj && mGlyph.montaj.pipe_no), mGlyph && mGlyph.montaj && mGlyph.montaj.pipe_no);
ok('glyph→onarım: spool_listesi ≥ 1', !!(mGlyph && mGlyph.montaj && mGlyph.montaj.spool_listesi.length >= 1));

// T8.5 — KAPININ ZORUNLULUĞU (drift guard): KAPISIZ -29 temiz metni BOZAR.
// (Ölçüm kanıtı: 121'de kapısız -29 tüm temiz PDF'leri L3'e düşürdü.)
const koru29 = onar29(temizMontaj);
const temizMontajPipe = mr && mr.montaj && mr.montaj.pipe_no;  // T7'deki temiz parse sonucu
ok('kapısız -29 temiz metni DEĞİŞTİRİR (kapı şart)', koru29 !== temizMontaj);
const mKorumasiz = parse(koru29, aileBirlestir('tersan_cadmatic_montaj', koru29));
ok('kapısız -29 → montaj parse BOZULUR (kapı bunu önler)',
   !(mKorumasiz && mKorumasiz.ok && mKorumasiz.montaj && mKorumasiz.montaj.pipe_no === temizMontajPipe),
   'kapısız pipe_no=' + (mKorumasiz && mKorumasiz.montaj && mKorumasiz.montaj.pipe_no));

// T8.6 — GÜVENLİK: çapasız/bilinmeyen metin → DOKUNULMAZ (doğal L3, MK-119.3).
const yabanci = metinNormalle('rastgele izometri disi metin, hicbir capa yok 1234567890 abcdef');
ok('çapasız metin durum=capa_yok', yabanci.durum === 'capa_yok', yabanci.durum);
ok('çapasız metin DEĞİŞMEDİ', yabanci.metin === 'rastgele izometri disi metin, hicbir capa yok 1234567890 abcdef');

console.log('\n=== SONUÇ ===');
console.log(`  Geçen: ${gecen} | Kalan: ${kalan}`);
if (kalan > 0) { console.log('  ⛔ PİLOT KIRMIZI'); process.exit(1); }
console.log('  ✅ PİLOT YEŞİL (composability + wiring + montaj drift guard)');
