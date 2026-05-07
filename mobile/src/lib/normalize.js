// mobile/src/lib/normalize.js
//
// Web ares-normalize.js'in mobil ES module portu (oturum 67).
// Canonical kaynak: enum normalize + lokalize etiket + uyum matrisi + marka format.
//
// Web farkı:
//  - tv() global yerine fonksiyon parametresi olarak alınır (format.js konvansiyonu).
//  - ESM export, IIFE değil.
//  - Geri kalan davranış birebir aynı (revFmt, marka, malzemeKod, kaliteKod, vb.).
//
// Mobil müşteriler:
//   format.js — re-export köprüsü (revFmt, malzemeEtiket) + markaHesapla adapter
//   Ekran 3+ — yuzeyEtiket, kaliteGoster, uyumlu vb. doğrudan buradan
//
// Kanonik kodlar (web E-01 ile bire bir):
//   malzeme: karbon | paslanmaz | bakir | alum | diger
//   yuzey:   asit | galvaniz | siyah | boyali | diger
//   durum:   bekliyor | devam_ediyor | tamamlandi | iptal

// ── İç helper: TR karakter ASCII'ye + lowercase ──────────────────────────
function _ascii(s) {
  return String(s || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .trim()
}

// ── MALZEME: ham → kod ───────────────────────────────────────────────────
export function malzemeKod(raw) {
  const h = _ascii(raw)
  if (!h) return ''
  if (['karbon', 'paslanmaz', 'bakir', 'alum', 'diger'].indexOf(h) !== -1) return h
  if (/st37|s235|s275|a106|a53|a333|karbon|carbon|celik/.test(h)) return 'karbon'
  if (/316|304|321|347|paslanmaz|stainless|inox/.test(h))         return 'paslanmaz'
  if (/cuni|cu-ni|bakir|copper|bronze|pirinc|brass/.test(h))      return 'bakir'
  if (/alum|aluminum|aluminium|al-/.test(h))                      return 'alum'
  return 'diger'
}

// ── YÜZEY: ham → kod ─────────────────────────────────────────────────────
export function yuzeyKod(raw) {
  const h = _ascii(raw)
  if (!h) return ''
  if (['asit', 'galvaniz', 'siyah', 'boyali', 'diger'].indexOf(h) !== -1) return h
  if (/asit|acid/.test(h))        return 'asit'
  if (/galvaniz|galvan/.test(h))  return 'galvaniz'
  if (/siyah|black/.test(h))      return 'siyah'
  if (/boyal|boya|paint/.test(h)) return 'boyali'
  return 'diger'
}

// ── KALİTE: ham → canonical kod (master tablo eşi) ──────────────────────
// DB kalite_kod_normalize() fonksiyonunun JS karşılığı.
// Kategori isimleri (karbon, paslanmaz...) kalite DEĞİLDİR → null.
export function kaliteKod(raw) {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const h = trimmed.toUpperCase()
    .replace(/Ç/g, 'C').replace(/Ğ/g, 'G').replace(/İ/g, 'I')
    .replace(/Ö/g, 'O').replace(/Ş/g, 'S').replace(/Ü/g, 'U')

  const kategoriIsimleri = [
    'KARBON', 'PASLANMAZ', 'BAKIR', 'ALUM', 'ALUMINYUM', 'DIGER', 'DIĞER',
    'KARBONCELIK', 'KARBON CELIK', 'CARBONSTEEL', 'CARBON STEEL',
    'STAINLESS', 'COPPER', 'BAKIRALASIM', 'BAKIR ALASIM',
    'ALUMINUM', 'ALUMINIUM', 'BRONZE', 'BRASS', 'PIRINC',
  ]
  if (kategoriIsimleri.indexOf(h) !== -1) return null

  if (/CUNI|CU-NI|CU NI/.test(h))                              return 'CUNI9010'
  if (/^1[\.\s]?4571$/.test(h) || h === '316TI' || h === '316 TI') return '14571'
  if (/^A\s?312[-\s]?TP?\s?316\s?L$/.test(h))                  return 'A312TP316L'
  if (/^A\s?106[-\s]?GR?\s?B$/.test(h) ||
      /^A\s?106[-\s]?B$/.test(h) || h === 'A106')              return 'A106B'
  if (/^A\s?53([-\s]?[A-Z])?$/.test(h))                        return 'A53'
  if (/^ST[-\s]?37$/.test(h))                                  return 'ST37'
  if (/^S235/.test(h))                                         return 'S235JR'
  if (/^316\s?L$/.test(h))                                     return '316L'
  if (/^304\s?L$/.test(h))                                     return '304L'
  if (h === '316')                                             return '316'
  if (h === '304')                                             return '304'
  if (/^6061[-\s]?T6$/.test(h) || h === '6061')                return '6061T6'

  return null
}

// ── KALİTE: kod → görsel etiket (master kalite_goster eşi) ──────────────
export function kaliteGoster(kodOrRaw) {
  if (kodOrRaw == null) return ''
  let kod = String(kodOrRaw).toUpperCase().trim()
  if (!kod) return ''
  if (!/^[A-Z0-9]+$/.test(kod.replace(/\s/g, ''))) {
    const k = kaliteKod(kodOrRaw)
    if (!k) return String(kodOrRaw).trim()
    kod = k
  }
  const goster = {
    ST37: 'St 37', S235JR: 'S235JR', A106B: 'A106-B', A53: 'A53',
    '316L': '316L', '304L': '304L', '316': '316', '304': '304',
    '14571': '1.4571', A312TP316L: 'A312-TP316L',
    CUNI9010: 'CuNi 90/10',
    '6061T6': '6061-T6',
  }
  return goster[kod] || String(kodOrRaw).trim()
}

// ── DURUM: ham → kod ─────────────────────────────────────────────────────
export function durumKod(raw) {
  const h = _ascii(raw)
  if (!h) return ''
  if (['bekliyor', 'devam_ediyor', 'tamamlandi', 'iptal'].indexOf(h) !== -1) return h
  return h.replace(/\s+/g, '_')
}

// ── UYUM: malzeme + yüzey kombinasyon kontrolü ──────────────────────────
// karbon, diger → tüm yüzeyler
// paslanmaz, bakir → asit (+ diger)
// alum → asit + boyali (+ diger)
// yuzey='diger' her malzemeyle uyumlu (özel açıklama)
// Boş/NULL parametre → uyumlu kabul (henüz girilmedi)
export function uyumlu(malKodOrRaw, yuzKodOrRaw) {
  if (!malKodOrRaw || !yuzKodOrRaw) return true
  const mal = malzemeKod(malKodOrRaw)
  const yuz = yuzeyKod(yuzKodOrRaw)
  if (!mal || !yuz) return true
  if (mal === 'diger' || yuz === 'diger') return true
  if (mal === 'paslanmaz' && (yuz === 'galvaniz' || yuz === 'siyah' || yuz === 'boyali')) return false
  if (mal === 'bakir'     && (yuz === 'galvaniz' || yuz === 'siyah' || yuz === 'boyali')) return false
  if (mal === 'alum'      && (yuz === 'galvaniz' || yuz === 'siyah')) return false
  return true
}

export function uyumluYuzeyler(malKodOrRaw) {
  const mal = malKodOrRaw ? malzemeKod(malKodOrRaw) : ''
  if (!mal || mal === 'karbon' || mal === 'diger') {
    return ['asit', 'galvaniz', 'siyah', 'boyali', 'diger']
  }
  if (mal === 'paslanmaz' || mal === 'bakir') return ['asit', 'diger']
  if (mal === 'alum')                         return ['asit', 'boyali', 'diger']
  return ['asit', 'galvaniz', 'siyah', 'boyali', 'diger']
}

// ── MARKA: variadic birleştirici (E-04, web canonical) ──────────────────
// Boş/null parçaları otomatik atlar.
//   marka('NB1137', 'M100', 'S01')           → "NB1137-M100-S01"
//   marka('NB1137', 'M100', 'S01', 'Rev2')   → "NB1137-M100-S01-Rev2"
export function marka(...parcalar) {
  return parcalar
    .map(p => (p == null ? '' : String(p)).trim())
    .filter(Boolean)
    .join('-')
}

// ── REV: rev göstergesi (E-02) ──────────────────────────────────────────
// boş/null/0/Rev0 → ''
// 2 → 'Rev2', 'A' → 'RevA', 'Rev2' → 'Rev2' (idempotent)
// Web ile birebir semantik (alfanumerik destekli, mobil eski Number-only sürüm değil).
export function revFmt(rev) {
  if (rev === null || rev === undefined) return ''
  const r = String(rev).trim()
  if (!r) return ''
  if (/^(0+|rev[\s\-_]*0+|r[\s\-_]*0+)$/i.test(r)) return ''
  return /^rev/i.test(r) ? r : 'Rev' + r
}

// ── tv() yardımcıları — tv parametre olarak alınır ──────────────────────
// Web global tv()'ye karşılık mobile context-aware tv geçilir.
// Sığ fallback: tv yoksa default Türkçe etiket döner.

const _tvSafe = (tv) => (typeof tv === 'function' ? tv : (k, fb) => (fb || k))

export function tvMalzeme(kodOrRaw, tv, fb) {
  let kod = kodOrRaw
  if (kod && !/^[a-z_]+$/.test(String(kod))) kod = malzemeKod(kod)
  if (!kod) return fb || '—'
  const def = ({
    karbon: 'Karbon Çelik', paslanmaz: 'Paslanmaz',
    bakir: 'Bakır Alaşım', alum: 'Alüminyum', diger: 'Diğer',
  })[kod] || fb || kod
  return _tvSafe(tv)('cmn_malzeme_' + kod, def)
}

export function tvYuzey(kodOrRaw, tv, fb) {
  let kod = kodOrRaw
  if (kod && !/^[a-z_]+$/.test(String(kod))) kod = yuzeyKod(kod)
  if (!kod) return fb || '—'
  const def = ({
    asit: 'Asit', galvaniz: 'Galvaniz', siyah: 'Siyah',
    boyali: 'Boya', diger: 'Diğer',
  })[kod] || fb || kod
  return _tvSafe(tv)('cmn_yuzey_' + kod, def)
}

export function tvDurum(kodOrRaw, tv, fb) {
  const kod = durumKod(kodOrRaw)
  if (!kod) return fb || '—'
  const def = ({
    bekliyor: 'Bekliyor', devam_ediyor: 'Devam Ediyor',
    tamamlandi: 'Tamamlandı', iptal: 'İptal',
  })[kod] || fb || kod
  return _tvSafe(tv)('cmn_durum_' + kod, def)
}

// ── Kısa yol: ham → etiket ──────────────────────────────────────────────
// format.js'in mevcut malzemeEtiket(kod, tv) imzası ile uyumlu (hem ham hem kod kabul).
export function malzemeEtiket(raw, tv) {
  return raw ? tvMalzeme(malzemeKod(raw), tv, raw) : '—'
}

export function yuzeyEtiket(raw, tv) {
  return raw ? tvYuzey(yuzeyKod(raw), tv, raw) : '—'
}

export function durumEtiket(raw, tv) {
  return raw ? tvDurum(durumKod(raw), tv, raw) : '—'
}
