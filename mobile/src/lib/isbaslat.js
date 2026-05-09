// mobile/src/lib/isbaslat.js
// AresPipe Mobile — İş Başlat helper'ları
// 64. oturumda yazıldı (rol seçimi + DB sorguları)
// 65. oturumda eklendi: BLOK_RENK_HEX (v3.2 palette), blokRenkHex(),
//                       rolBasamakKarsiligi(), islemBloklariniGetir().renkHex
// 70. oturumda eklendi (Adım 3d): basamakAdi(), aktifBasamakYetkili(),
//                                  yetkiliRolAdlari() — Footer matrisi gate'i.

import { supabase } from './supabase'

// ───────────────────────────────────────────────
// Operatör için kabul edilen "işlem" tipindeki yetki blokları
// (admin/yönetim blokları bu listeye girmez)
// ───────────────────────────────────────────────
export const ISLEM_BLOK_ADLARI = [
  'İmalat',
  'Argon Kaynağı',
  'Gazaltı Kaynağı',
  'Büküm',
  'Kesim',
  'Markalama',
  'Ön Kontrol',
]

// ───────────────────────────────────────────────
// Blok adına göre ikon — DB'de ikon kolonu yoksa fallback
// ───────────────────────────────────────────────
const BLOK_IKON = {
  'İmalat':           '🔧',
  'Argon Kaynağı':    '🔥',
  'Gazaltı Kaynağı':  '⚡',
  'Büküm':            '↩️',
  'Kesim':            '✂️',
  'Markalama':        '🏷️',
  'Ön Kontrol':       '✅',
}

export function blokIkon(blokAd) {
  return BLOK_IKON[blokAd] || '⚙️'
}

// ───────────────────────────────────────────────
// v3.2 Renk Palette'i — 65. oturum
// 5 işlem rengi (turkuaz/indigo/turuncu/pembe/mor) + 4 durum rengi
// (mavi/amber/yeşil/kırmızı) çakışmadan ayrı slotlara dağıtıldı.
// Mockup karar zinciri: v3.1 → v3.2 (ayrım netleştirildi).
// Bkz. son-durum.md MK-65 + IbQRTara mockup turu (v3.3).
// ───────────────────────────────────────────────
export const BLOK_RENK_HEX = {
  'İmalat':           '#6366f1', // indigo (mavi/scan tonundan farklı)
  'Argon Kaynağı':    '#f97316', // turuncu
  'Gazaltı Kaynağı':  '#f97316', // turuncu (Argon'la aynı kategori)
  'Büküm':            '#14b8a6', // turkuaz
  'Kesim':            '#ec4899', // pembe (kırmızı/hata tonundan farklı)
  'Markalama':        '#a855f7', // mor
  'Ön Kontrol':       '#a855f7', // mor (Markalama'yla aynı kategori)
}

const VARSAYILAN_RENK = '#888888'

export function blokRenkHex(blokAd) {
  if (!blokAd) return VARSAYILAN_RENK
  return BLOK_RENK_HEX[blokAd] || VARSAYILAN_RENK
}

// Hex string'i rgba'ya çevirir (ikon arka planı, glow vb. için).
// 3-haneli (#fff) ve 6-haneli (#ffffff) hex destekler.
// rgba(...) gibi string gelirse olduğu gibi döner.
export function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(136,136,136,${alpha})`
  if (typeof hex !== 'string') return `rgba(136,136,136,${alpha})`
  if (hex.startsWith('rgb')) return hex
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (h.length !== 6) return `rgba(136,136,136,${alpha})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ───────────────────────────────────────────────
// Rol → DB aktif_basamak karşılığı
// (Ekran 4 rol uyumsuzluğu kontrolü için — 65. oturum)
//
// DB'deki gerçek aktif_basamak değerleri (test sonucu):
//   'on_imalat', 'alim_kontrol', vs. — sürece özgü adlandırmalar
//
// Bir rol birden fazla aşamayı kapsayabilir (operatörün katma değer
// adımları). Bu yüzden DEĞER bir DİZİ. Spool.aktif_basamak listede
// varsa rol uyumlu sayılır.
//
// 65. oturum: Liste kasıtlı geniş tutuldu (false-positive uyumsuzluk
// engellenir). 66+ oturumlarda gerçek iş akışı haritasına göre daraltılır.
// ───────────────────────────────────────────────
const ROL_BASAMAK = {
  'İmalat':           ['imalat', 'on_imalat'],
  'Argon Kaynağı':    ['kaynak', 'argon_kaynak'],
  'Gazaltı Kaynağı':  ['kaynak', 'gazalti_kaynak'],
  'Büküm':            ['bukum'],
  'Kesim':            ['kesim'],
  'Markalama':        ['markalama'],
  'Ön Kontrol':       ['on_kontrol', 'alim_kontrol'],
}

// Rolün uyumlu olduğu basamak listesi (her zaman dizi döner; bilinmeyen rol = [])
export function rolBasamakKarsiligi(blokAd) {
  if (!blokAd) return []
  return ROL_BASAMAK[blokAd] || []
}

// Spool aşaması bu rol için uyumlu mu?
// Bilinmeyen aşama (haritada yok) için true döner — false-positive engellenir,
// operatör Ekran 3'te detayı görüp kendi karar verir.
export function aktifBasamakRolaUyumlu(blokAd, aktifBasamak) {
  if (!aktifBasamak) return true
  const liste = rolBasamakKarsiligi(blokAd)
  if (liste.length === 0) return true     // rol haritada yok → kontrolü pas geç
  return liste.includes(aktifBasamak)
}

// ───────────────────────────────────────────────
// 70. oturum (Adım 3d): Yetki + Footer CTA
// ───────────────────────────────────────────────

// aktif_basamak slug → operatöre gösterilecek küçük-harf etiket.
// Cümle akışında doğal okunsun diye lowercase ("imalat", "argon kaynağı").
const BASAMAK_AD_TR = {
  'imalat':         'imalat',
  'on_imalat':      'ön imalat',
  'kaynak':         'kaynak',
  'argon_kaynak':   'argon kaynağı',
  'gazalti_kaynak': 'gazaltı kaynağı',
  'bukum':          'büküm',
  'kesim':          'kesim',
  'markalama':      'markalama',
  'on_kontrol':     'ön kontrol',
  'alim_kontrol':   'alım kontrol',
}

// Spool'un aktif_basamak slug'ını insan-okunabilir TR etikete çevirir.
// Bilinmeyen slug → slug'ı olduğu gibi döner (fail-loud — eksik harita
// kolayca fark edilsin).
export function basamakAdi(slug) {
  if (!slug) return ''
  return BASAMAK_AD_TR[String(slug).toLowerCase()] || String(slug)
}

// Operatörün ATANMIŞ blokları arasında spool'un aktif basamağı için
// uyumlu olan EN AZ BİR blok var mı? "İşe Başla" butonunun visibility
// kararı (3d Footer matrisi) için kullanılır.
//
// Kural: ROL_BASAMAK haritasını yeniden kullanır — herhangi bir blok
// uyumluysa kullanıcı yetkilidir (BİRLEŞİM, gizli_bolumler kesişiminin tersi).
//
// Bilinmeyen basamak → false (yetki kontrolünde GÜVENLİ default —
// aktifBasamakRolaUyumlu'nun "true" davranışından KASTEN farklı, çünkü
// o fonksiyon rol uyumsuzluk uyarısı için, bu fonksiyon yetki gate'i için).
//
// @param aktif_basamak — spool.aktif_basamak (slug, ör. 'imalat', 'argon_kaynak')
// @param bloklar       — islemBloklariniGetir() çıktısı: [{ad, ...}, ...]
// @returns boolean
export function aktifBasamakYetkili(aktif_basamak, bloklar) {
  if (!aktif_basamak) return false
  if (!Array.isArray(bloklar) || !bloklar.length) return false
  const aktif = String(aktif_basamak).toLowerCase()
  for (const b of bloklar) {
    if (!b || !b.ad) continue
    const liste = ROL_BASAMAK[b.ad] || []
    if (liste.includes(aktif)) return true
  }
  return false
}

// Yetkili olduğu rolleri listele — info satırında "Senin yetkin: X, Y" için.
// Returns: ["Kesim", "Büküm"] gibi distinct rol adları (display order korunur).
export function yetkiliRolAdlari(bloklar) {
  if (!Array.isArray(bloklar) || !bloklar.length) return []
  const seen = new Set()
  const out = []
  for (const b of bloklar) {
    if (!b || !b.ad) continue
    if (!seen.has(b.ad)) {
      seen.add(b.ad)
      out.push(b.ad)
    }
  }
  return out
}

// ───────────────────────────────────────────────
// (DEPRECATED ama korunur) Eski renk → CSS preset class sistemi
// MIslemler ve başka yerler hâlâ cl-ac/cl-gr/cl-re/cl-warn/cl-leg kullanıyor.
// İş Başlat akışı 65. oturumdan itibaren v3.2 hex sistemine geçti.
// ───────────────────────────────────────────────
function _renkAnahtari(renk) {
  if (!renk) return 'ac'
  const r = String(renk).toLowerCase().replace(/[^a-z0-9]/g, '')
  if (r.includes('2d8eff'))                  return 'ac'
  if (r.includes('16a36e'))                  return 'gr'
  if (r.includes('e53e3e') || r.includes('dc2626')) return 're'
  if (r.includes('d97706') || r.includes('f59e0b')) return 'warn'
  if (r.includes('7c3aed') || r.includes('8b5cf6')) return 'leg'
  if (['ac', 'mavi', 'blue'].includes(r))             return 'ac'
  if (['gr', 'yesil', 'yeşil', 'green'].includes(r))  return 'gr'
  if (['re', 'kirmizi', 'kırmızı', 'red'].includes(r)) return 're'
  if (['warn', 'turuncu', 'orange', 'amber'].includes(r)) return 'warn'
  if (['leg', 'mor', 'purple', 'violet'].includes(r)) return 'leg'
  return 'ac'
}

export function blokRenkSinifi(renk) {
  return 'cl-' + _renkAnahtari(renk)
}

export function blokIkonRenkStili(renk) {
  const k = _renkAnahtari(renk)
  const map = {
    ac:   'rgba(45, 142, 255, 0.12)',
    gr:   'rgba(22, 163, 110, 0.12)',
    re:   'rgba(229, 62, 62, 0.12)',
    warn: 'rgba(217, 119, 6, 0.12)',
    leg:  'rgba(124, 58, 237, 0.12)',
  }
  return { background: map[k] || map.ac }
}

// ───────────────────────────────────────────────
// Kullanıcının atanmış olduğu işlem bloklarını getir
// (sadece ISLEM_BLOK_ADLARI'nda olanları döner)
// 65. oturum: dönen object'e `renkHex` (v3.2 palette) eklendi.
// `renk` (DB) field'ı geriye uyumluluk için saklanır.
// ───────────────────────────────────────────────
export async function islemBloklariniGetir(kullaniciId, tenantId) {
  if (!kullaniciId || !tenantId) return []
  try {
    const { data, error } = await supabase
      .from('kullanici_bloklar')
      .select('id, blok_id, yetki_bloklari(id, ad, renk)')
      .eq('kullanici_id', kullaniciId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('[isbaslat] kullanici_bloklar:', error.message || error)
      return []
    }
    if (!Array.isArray(data)) return []

    return data
      .map(kb => {
        const b = kb.yetki_bloklari || {}
        return {
          id: b.id,
          blok_kayit_id: kb.id,
          ad: b.ad,
          renk: b.renk,                  // DB rengi (geriye uyum)
          renkHex: blokRenkHex(b.ad),    // v3.2 palette (yeni — IbQRTara/IbRolSec)
          tip: b.tip,
        }
      })
      .filter(b => b.id && ISLEM_BLOK_ADLARI.includes(b.ad))
  } catch (e) {
    console.error('[isbaslat] hata:', e && e.message)
    return []
  }
}

// ───────────────────────────────────────────────
// localStorage — rol hatırlama
// 65. oturum: artık sadece id + ad saklanır.
// renk runtime'da blokRenkHex(ad) ile çevrilir → palette güncellenirse
// localStorage'daki eski hex çakışma yapmaz.
// ───────────────────────────────────────────────
const ROL_KEY = 'ares_is_aktif_rol'

export function rolKaydet(blok) {
  if (!blok || !blok.id || !blok.ad) return
  try {
    localStorage.setItem(ROL_KEY, JSON.stringify({
      id: blok.id,
      ad: blok.ad,
    }))
  } catch (e) { /* private browsing fallback */ }
}

export function rolHatirla() {
  try {
    const v = localStorage.getItem(ROL_KEY)
    if (!v) return null
    const obj = JSON.parse(v)
    if (!obj || !obj.id || !obj.ad) return null
    return obj
  } catch {
    return null
  }
}

export function rolUnut() {
  try { localStorage.removeItem(ROL_KEY) } catch {}
}
