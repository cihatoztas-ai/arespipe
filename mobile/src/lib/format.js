// mobile/src/lib/format.js
//
// Mobil ekranlar için ortak format/helper fonksiyonları.
// 60. oturum — Açık Borç #3 kapandı: MSpoolDetay ve MDevreDetay'da
// kopyalanan helper'lar burada birleştirildi.
//
// Kanonik kaynaklar:
//   - revFmt: MSpoolDetay sürümü (defensive — Number tipini garantiliyor).
//     MDevreDetay sürümünde "0" string'i veya NaN için bug vardı, düzeltildi.
//   - markaHesapla, formatSpoolId, alistirmaBilgi, nNRenkler,
//     formatTarih, formatTarihSaat, formatSure: MSpoolDetay sürümleri.
//   - malzemeEtiket, esc: MDevreDetay sürümleri.
//
// Kullanılmayan helper'lar (esc gibi) ileride lazım olur diye merkezi
// tutuldu — DRY prensibinden ödün, ama tek satırlık import maliyeti.
//
// MSpoolDetay'a özgü rev formatı için NOT:
//   revFmt(rev) string ya da number kabul eder. Geçersiz/0/negatif değerlerde
//   boş string döner. Pozitif sayı verilince "RevN" formatı.
//
// MDevreDetay'a özgü `getStageKey` BURADA YOK — UI semantiği taşır
// (on_imalat → bekliyor map'i, MK-59.1). Ekrana özgü kalsın.

// ── Sayı formatı ──────────────────────────────────────────────────────────

export function revFmt(rev) {
  const n = Number(rev)
  return Number.isFinite(n) && n > 0 ? `Rev${n}` : ''
}

// E-02 marka: proje_no-pipeline_no-spool_no[-RevN]
// Web spool_detay.html sat. 1968-1970'in birebir port'u.
// İkinci parametre `devre` şu an kullanılmıyor; signature stabil tutuldu
// (gelecekte devre-aware varyant gerekirse imza değişmesin).
export function markaHesapla(sp, devre, proje) {
  const parcalar = [
    proje?.proje_no || '',
    sp?.pipeline_no || '',
    sp?.spool_no || '',
    revFmt(sp?.rev),
  ].filter(Boolean)
  const m = parcalar.join('-')
  return m || sp?.spool_no || '—'
}

// devre_detay.html sat. 1400 islemMb helper'ının React port'u.
// 0 toplam → "—", 0/N → kırmızı, N/N → yeşil, n/N → sarı
export function nNRenkler(tamamlanan, toplam) {
  if (!toplam) return { txt: '—', cls: 'msd-pill-none' }
  if (!tamamlanan) return { txt: `0/${toplam}`, cls: 'msd-pill-red' }
  if (tamamlanan === toplam) return { txt: `${toplam}/${toplam}`, cls: 'msd-pill-green' }
  return { txt: `${tamamlanan}/${toplam}`, cls: 'msd-pill-yellow' }
}

// Spool ID formatı — A-553 → A-0553 (min 4 basamak pad, MK-58.7)
export function formatSpoolId(id) {
  if (!id) return ''
  const m = String(id).match(/^([A-Z]+)-(\d+)$/i)
  if (!m) return id
  const num = String(parseInt(m[2], 10)).padStart(4, '0')
  return `${m[1].toUpperCase()}-${num}`
}

// ── Alıştırma defensive ───────────────────────────────────────────────────

// 'tam'/'VAR' = yapıldı, 'kismi'/'KISMI' = kısmi, 'yok'/'YOK'/null = yok
// Mobile vanilla convention'ı: yapıldı=yeşil, kısmi=sarı, yok=kırmızı
// MK-58.1 — alistirma kolon enum migration sonrası bu defensive kalkabilir.
export function alistirmaBilgi(v, tv) {
  const x = (v || '').toString().toLowerCase()
  if (x === 'tam' || x === 'var') {
    return { txt: tv('mob_sp_alist_var', 'Var'), cls: 'msd-alist-tam' }
  }
  if (x === 'kismi') {
    return { txt: tv('mob_sp_alist_kismi', 'Kısmi'), cls: 'msd-alist-kismi' }
  }
  return { txt: tv('mob_sp_alist_yok', 'Yok'), cls: 'msd-alist-yok' }
}

// ── Tarih ─────────────────────────────────────────────────────────────────

const TR_AYLAR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']

export function formatTarih(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return '—'
    return `${d.getDate()} ${TR_AYLAR[d.getMonth()]} ${d.getFullYear()}`
  } catch { return '—' }
}

export function formatTarihSaat(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return '—'
    const ss = String(d.getMinutes()).padStart(2, '0')
    return `${d.getDate()} ${TR_AYLAR[d.getMonth()]} ${d.getFullYear()}, ${d.getHours()}:${ss}`
  } catch { return '—' }
}

export function formatSure(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return '—'
  const fark = (Date.now() - d.getTime()) / 1000
  if (fark < 60) return 'az önce'
  if (fark < 3600) return `${Math.floor(fark/60)} dk önce`
  if (fark < 86400) return `${Math.floor(fark/3600)} saat önce`
  if (fark < 604800) return `${Math.floor(fark/86400)} gün önce`
  return formatTarih(isoStr)
}

// ── Malzeme etiketi ───────────────────────────────────────────────────────

// Web ARES_NORM.malzemeEtiket eşi.
// Canonical kodlar: karbon, paslanmaz, bakir, alum, diger
export function malzemeEtiket(kod, tv) {
  if (!kod) return '—'
  const k = String(kod).toLowerCase().trim()
  const map = {
    karbon:    tv('cmn_malzeme_karbon',    'Karbon Çelik'),
    paslanmaz: tv('cmn_malzeme_paslanmaz', 'Paslanmaz'),
    bakir:     tv('cmn_malzeme_bakir',     'Bakır Alaşım'),
    alum:      tv('cmn_malzeme_alum',      'Alüminyum'),
    diger:     tv('cmn_malzeme_diger',     'Diğer'),
  }
  return map[k] || kod
}

// ── HTML escape (XSS koruması) ────────────────────────────────────────────

// MDevreDetay'da kart üstünde substring()'lenen serbest metin (durdurma_sebebi)
// için kullanılır. React JSX zaten kaçırır — bu helper sadece string concat
// yaparken (template literal) güvende kalmak için var.
export function esc(s) {
  if (s == null) return ''
  return String(s).replace(/[<>&"']/g, c => ({
    '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;',
  }[c]))
}
