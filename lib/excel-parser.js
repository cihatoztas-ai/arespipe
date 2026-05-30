// lib/excel-parser.js
// Excel BOM parser v2 — sözlük + word-boundary substring match + özet satır filtresi
// 101. oturum (19 Mayıs 2026) — devre_yeni.html ifsOku() mantığını genelleyen sürüm
//
// v1'den farklar:
//  - Substring (word-boundary) match — "Pipeline No" → pipeline_no eşleşir
//  - En uzun eşleşme kazanır (çakışma çözümü)
//  - Sayfa önceliği: 'All' → 'import' → en yüksek skor (CADMATIC pattern)
//  - Özet satır filtresi: total/cog/sum/formül başlayanlar atılır
//  - Yeni alanlar: agirlik_kg, yuzey, revizyon, system, birim, ifs_kod
//  - Sayısal alanlar parseFloat ile temizlenir
//
// Test:  node lib/excel-parser.js <dosya.xlsx>

import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// ============================================================
// SÖZLÜK — Kanonik alan → eş anlamlı terimler
// ============================================================
// İpucu: Çok kısa kelimelerden (l, m, no, ad) kaçın — word-boundary
// match yapıyoruz ama yine de yanlış pozitif riski yüksek.
// Yeni terim eklerken min 3 karakter olmalı.

export const SOZLUK = {
  // Boyut / çap
  dn: [
    'dn', 'cap', 'çap', 'diameter', 'nominal diameter', 'nominal',
    'nps', 'pipe size', 'cap dn', 'nominal cap', 'diametre', 'boyut',
    'dimensions', 'dimension', 'dim', 'anma cap', 'anma'
  ],
  cap_mm: [
    'dis cap', 'dış çap', 'outer diameter', 'outside diameter',
    'pipe od', 'outside dia', 'od mm'
  ],

  // Malzeme / kalite
  malzeme: [
    'malzeme', 'material', 'madde', 'hammadde',
    'malzeme cinsi', 'material type', 'pipe material', 'mtrl'
  ],
  kalite: [
    'kalite', 'grade', 'material grade', 'cinsi', 'quality',
    'cins', 'material spec', 'mat grade', 'standart kalite'
  ],

  // Kalınlık / schedule
  et_mm: [
    'et', 'et kalinligi', 'et kalınlığı', 'wall thickness', 'thickness',
    'kalinlik', 'kalınlık', 'et mm', 'duvar kalınlığı', 'wall',
    'cidar', 'wt mm'
  ],
  schedule: [
    'schedule', 'sch', 'sched', 'şedül', 'sedul', 'sch no'
  ],

  // Boy / uzunluk
  uzunluk_mm: [
    'uzunluk', 'length', 'boy', 'total length', 'toplam uzunluk',
    'uzunluk mm', 'boy mm', 'length mm', 'len mm', 'len',
    'cut length', 'kesim uzunluğu', 'pipe length'
  ],

  // Miktar
  adet: [
    'adet', 'miktar', 'qty', 'quantity', 'count',
    'amount', 'pcs', 'pieces', 'sayi', 'sayı'
  ],

  // Açı (dirsek/bend) — IFS BOM 'Angle' kolonu. Dirseğin 15/30/45/90 derecesi
  // ağırlığı belirler; malzeme kalemi kimliğinin parçası (aynı DN farklı açı = farklı kalem).
  aci: [
    'angle', 'aci', 'açı', 'derece', 'degree', 'bend angle', 'aci derece'
  ],

  // Ağırlık — v2 yeni alan
  agirlik_kg: [
    'agirlik', 'ağırlık', 'weight', 'weight kg', 'mass',
    'kutle', 'kütle', 'agirlik kg', 'ağırlık kg'
  ],

  // Yüzey — v2 yeni alan
  yuzey: [
    'yuzey', 'yüzey', 'surface', 'finish', 'kaplama', 'coating',
    'yuzey kaplama', 'surface finish'
  ],

  // Tip / kategori / tanım
  parca_tipi: [
    'parca', 'parça', 'component', 'item type', 'tip', 'type',
    'fitting type', 'parca tipi', 'parça tipi', 'item', 'kalem',
    'kategori', 'category', 'parca türü', 'comp type'
  ],
  tanim: [
    'tanim', 'tanım', 'description', 'aciklama', 'açıklama',
    'item description', 'desc', 'malzeme açıklaması', 'item desc',
    'açıklamalar'
  ],

  // Referanslar
  standart: [
    'standart', 'standard', 'specification', 'norm', 'std no',
    'asme', 'din no', 'en standart'
  ],
  pozisyon: [
    'pozisyon', 'pos no', 'item no', 'tag', 'tag no',
    'item nr', 'kalem no', 'sira', 'sıra'
  ],
  pipeline_no: [
    'pipeline', 'pipeline no', 'line no', 'devre', 'devre no',
    'hat no', 'pipe line', 'line number'
  ],
  spool_no: [
    'spool', 'spool no', 'spoolno', 'spool nr', 'spool number'
  ],

  // CADMATIC ek alanları — v2
  ifs_kod: [
    'ifs', 'ifs no', 'ifs kod', 'ifs code', 'art code', 'article',
    'art no', 'article no'
  ],
  birim: [
    'unit', 'birim', 'olcu birimi', 'ölçü birimi'
  ],
  system: [
    'system', 'sistem', 'hat sistemi'
  ],
  revizyon: [
    'rev', 'revision', 'revizyon', 'rev no'
  ]
};

// ============================================================
// Normalize + word-boundary match
// ============================================================

export function normalize(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // diacritics (üöçşğı → uocsgi)
    .replace(/[^a-z0-9]/g, ' ')        // noktalama → boşluk
    .trim()
    .replace(/\s+/g, ' ');
}

// Sözlüğü "kelime → alan" şeklinde uzunluğa göre sıralı liste yap
// (En uzun ilk denenir, en uzun eşleşen kazanır)
const SOZLUK_SIRALI = [];
for (const [alan, kelimeler] of Object.entries(SOZLUK)) {
  for (const k of kelimeler) {
    const norm = normalize(k);
    if (norm && norm.length >= 2) {
      SOZLUK_SIRALI.push({ alan, kelime: norm, uzunluk: norm.length });
    }
  }
}
SOZLUK_SIRALI.sort((a, b) => b.uzunluk - a.uzunluk);  // En uzun ilk

// Word-boundary match: " word " olarak ara (start/end için pad'leme)
function alanBul(hucreNorm) {
  if (!hucreNorm) return null;
  const padded = ' ' + hucreNorm + ' ';
  for (const { alan, kelime } of SOZLUK_SIRALI) {
    if (padded.includes(' ' + kelime + ' ')) {
      return alan;
    }
  }
  return null;
}

// ============================================================
// L1 — Başlık satırı tespiti
// ============================================================

function tespitL1(sheet) {
  const aralik = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const taranacakSatir = Math.min(7, aralik.e.r);

  let enIyi = { satir: -1, eslesme: 0, harita: {} };

  for (let r = aralik.s.r; r <= taranacakSatir; r++) {
    const harita = {};
    let eslesme = 0;

    for (let c = aralik.s.c; c <= aralik.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const hucre = sheet[addr];
      if (!hucre || hucre.v === undefined || hucre.v === '') continue;

      const norm = normalize(hucre.v);
      if (!norm) continue;

      const alan = alanBul(norm);
      if (alan && harita[alan] === undefined) {
        harita[alan] = c;
        eslesme++;
      }
    }

    if (eslesme > enIyi.eslesme) {
      enIyi = { satir: r, eslesme, harita };
    }
  }

  if (enIyi.eslesme < 3) return null;
  return enIyi;
}

// ============================================================
// L2 — Pattern fallback (manuel onay için sinyal)
// ============================================================

function tespitL2(sheet) {
  const aralik = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');

  let ilkVeriSatir = -1;
  for (let r = aralik.s.r; r <= Math.min(15, aralik.e.r); r++) {
    let sayisalSayisi = 0;
    let metinSayisi = 0;
    for (let c = aralik.s.c; c <= aralik.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const hucre = sheet[addr];
      if (!hucre) continue;
      if (hucre.t === 'n') sayisalSayisi++;
      else if (hucre.t === 's') metinSayisi++;
    }
    if (sayisalSayisi >= 2 && (sayisalSayisi + metinSayisi) >= 3) {
      ilkVeriSatir = r;
      break;
    }
  }

  if (ilkVeriSatir < 1) return null;

  return {
    satir: ilkVeriSatir - 1,
    eslesme: 0,
    harita: {},
    pattern: true,
    not: 'L2 pattern: başlık sözlük dışı, manuel onay gerekli'
  };
}

// ============================================================
// Özet satır filtresi (ifsOku'dan alındı)
// ============================================================

const OZET_KELIMELERI = ['total', 'cog', 'center of gravity', 'sum', 'toplam'];

function ozetSatiriMi(satir) {
  for (const [alan, deger] of Object.entries(satir)) {
    if (alan === '_satir_no' || alan === '_uyari') continue;
    const s = String(deger || '').trim();
    if (!s) continue;
    // Formül başlangıcı
    if (s.startsWith('=')) return true;
    const norm = normalize(s);
    // Pipeline/spool alanlarında özet kelimesi
    if ((alan === 'pipeline_no' || alan === 'spool_no' || alan === 'tanim') &&
        OZET_KELIMELERI.some(kw => norm.includes(kw))) {
      return true;
    }
  }
  // pipeline_no veya spool_no varsa ve ikisi de sayıya dönüşüyorsa
  // (CADMATIC formül sonucu — gerçek spool no metindir)
  if (satir.spool_no !== undefined && !isNaN(parseFloat(satir.spool_no)) &&
      String(satir.spool_no).match(/^[\d.]+$/)) {
    return true;
  }
  return false;
}

// ============================================================
// Satır çıkarma
// ============================================================

const SAYISAL_ALANLAR = new Set(['agirlik_kg', 'uzunluk_mm', 'adet', 'et_mm', 'cap_mm', 'aci']);

function satirlariCikar(sheet, baslikInfo) {
  const aralik = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const satirlar = [];
  const harita = baslikInfo.harita;

  for (let r = baslikInfo.satir + 1; r <= aralik.e.r; r++) {
    const satir = {};
    let dolu = 0;

    for (const [alan, c] of Object.entries(harita)) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const hucre = sheet[addr];
      if (hucre && hucre.v !== undefined && hucre.v !== '') {
        let deger = hucre.v;
        // Sayısal alanlarda parseFloat
        if (SAYISAL_ALANLAR.has(alan)) {
          const f = parseFloat(deger);
          if (!isNaN(f)) deger = f;
        } else {
          // Metin alanları string'e çevir + trim
          deger = String(deger).trim();
        }
        if (deger !== '' && deger !== null) {
          satir[alan] = deger;
          dolu++;
        }
      }
    }

    if (dolu > 0) {
      satir._satir_no = r + 1;
      if (!ozetSatiriMi(satir)) {
        satirlar.push(satir);
      }
    }
  }

  return satirlar;
}

// ============================================================
// Sayfa öncelik mantığı (ifsOku'dan)
// ============================================================

const ONCELIKLI_SAYFA_ADLARI = ['all', 'import', 'malzeme', 'bom', 'spool'];

function sayfaSec(sayfalar) {
  // 1) İsim önceliği — 'All', 'import' gibi bilinen sayfa adları
  for (const oncelikli of ONCELIKLI_SAYFA_ADLARI) {
    const eslesme = sayfalar.find(s =>
      s.basari && normalize(s.sayfa) === oncelikli
    );
    if (eslesme) return eslesme;
  }

  // 2) En yüksek skor (güven × log(satır+1))
  let enIyi = null;
  let enIyiSkor = -1;
  for (const s of sayfalar) {
    const skor = (s.guven || 0) * Math.log((s.satir_sayisi || 0) + 1);
    if (skor > enIyiSkor) {
      enIyiSkor = skor;
      enIyi = s;
    }
  }
  return enIyi;
}

// ============================================================
// Ana fonksiyon
// ============================================================

export function parseExcel(buffer, opts = {}) {
  const maxSatir = opts.maxSatir || 5000;
  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  } catch (e) {
    return {
      basari: false,
      seviye: 'fail',
      guven: 0,
      hata: 'Excel okunamadı: ' + e.message
    };
  }

  const sayfalar = [];

  for (const sheetAdi of wb.SheetNames) {
    const sheet = wb.Sheets[sheetAdi];
    if (!sheet || !sheet['!ref']) {
      sayfalar.push({ sayfa: sheetAdi, basari: false, seviye: 'fail', not: 'Boş sayfa' });
      continue;
    }

    let baslikInfo = tespitL1(sheet);
    let seviye = 'L1';
    let guven = 0;

    if (baslikInfo) {
      // 3 eşleşme → 55%, 4 → 70%, 5 → 85%, 6+ → 95%
      guven = Math.min(95, 40 + baslikInfo.eslesme * 15);
    } else {
      baslikInfo = tespitL2(sheet);
      seviye = 'L2';
      guven = 25;
    }

    if (!baslikInfo) {
      sayfalar.push({
        sayfa: sheetAdi,
        basari: false,
        seviye: 'fail',
        guven: 0,
        not: 'Başlık satırı tespit edilemedi'
      });
      continue;
    }

    let satirlar = [];
    if (seviye === 'L1') {
      satirlar = satirlariCikar(sheet, baslikInfo).slice(0, maxSatir);
    }

    sayfalar.push({
      sayfa: sheetAdi,
      basari: seviye === 'L1' && satirlar.length > 0,
      seviye,
      guven,
      baslik_satir: baslikInfo.satir + 1,
      eslesme_sayisi: baslikInfo.eslesme,
      kolon_haritasi: baslikInfo.harita,
      satir_sayisi: satirlar.length,
      satirlar
    });
  }

  const enIyi = sayfaSec(sayfalar) || sayfalar[0];

  return {
    sayfa_sayisi: wb.SheetNames.length,
    sayfalar,
    secilen: enIyi ? enIyi.sayfa : null,
    basari: enIyi ? enIyi.basari : false,
    seviye: enIyi ? enIyi.seviye : 'fail',
    guven: enIyi ? enIyi.guven : 0,
    satirlar: enIyi ? enIyi.satirlar : [],
    // Otomatik insert için sert sınır
    otomatik_insert_uygun: enIyi && enIyi.seviye === 'L1' && enIyi.guven >= 70,
    manuel_onay_gerekli: !enIyi || enIyi.seviye !== 'L1' || enIyi.guven < 70
  };
}

// ============================================================
// CLI test harness — node lib/excel-parser.js <dosya.xlsx>
// ============================================================

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const path = process.argv[2];

  if (!path) {
    console.log('Kullanım: node lib/excel-parser.js <dosya.xlsx>');
    process.exit(1);
  }

  let buf;
  try {
    buf = readFileSync(path);
  } catch (e) {
    console.error('Dosya okunamadı:', e.message);
    process.exit(1);
  }

  const sonuc = parseExcel(buf, { maxSatir: 50 });

  console.log('================================');
  console.log('Excel Parser v2 Sonucu');
  console.log('================================');
  console.log('Dosya:', path);
  console.log('Sayfa sayısı:', sonuc.sayfa_sayisi);
  console.log('Seçilen sayfa:', sonuc.secilen);
  console.log('Seviye:', sonuc.seviye, '| Güven: %' + sonuc.guven);
  console.log('Otomatik insert uygun:', sonuc.otomatik_insert_uygun ? '✅ EVET' : '❌ HAYIR (manuel onay)');
  console.log('');

  for (const s of sonuc.sayfalar || []) {
    console.log(`--- Sayfa: "${s.sayfa}" ---`);
    console.log('  Seviye:', s.seviye, '| Güven: %' + s.guven, '| Eşleşme:', s.eslesme_sayisi || 0);
    if (s.not) console.log('  Not:', s.not);
    if (s.kolon_haritasi && Object.keys(s.kolon_haritasi).length) {
      console.log('  Kolon haritası:');
      for (const [alan, c] of Object.entries(s.kolon_haritasi)) {
        console.log(`    ${alan.padEnd(15)} → ${XLSX.utils.encode_col(c)} (idx ${c})`);
      }
    }
    if (s.satirlar && s.satirlar.length) {
      console.log(`  Satır sayısı: ${s.satir_sayisi}`);
      console.log(`  İlk ${Math.min(5, s.satirlar.length)} satır:`);
      for (const r of s.satirlar.slice(0, 5)) {
        const ozet = Object.entries(r)
          .filter(([k]) => k !== '_satir_no')
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(', ');
        console.log(`    [#${r._satir_no}] ${ozet}`);
      }
    }
    console.log('');
  }
}
