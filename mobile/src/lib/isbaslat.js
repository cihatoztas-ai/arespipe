// mobile/src/lib/isbaslat.js
// AresPipe Mobile — İş Başlat helper'ları
// Eski mobile/is_baslat.html'in lib karşılığı (rol seçimi + DB sorguları)
// 64. oturumda yazıldı, R-10 mockup-first onayıyla.

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
// Renk normalize: DB'den hex/isim/preset kodu olabilir
// → ares-mobile.css preset class'ına çevir (.cl-ac/cl-warn/cl-gr/cl-leg/cl-re)
// ───────────────────────────────────────────────
function _renkAnahtari(renk) {
  if (!renk) return 'ac'
  const r = String(renk).toLowerCase().replace(/[^a-z0-9]/g, '')
  // hex eşleşmeleri
  if (r.includes('2d8eff'))                  return 'ac'
  if (r.includes('16a36e'))                  return 'gr'
  if (r.includes('e53e3e') || r.includes('dc2626')) return 're'
  if (r.includes('d97706') || r.includes('f59e0b')) return 'warn'
  if (r.includes('7c3aed') || r.includes('8b5cf6')) return 'leg'
  // sözcük eşleşmeleri
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
  // ares-mobile.css'te ic-blue/ic-green/ic-red preset'leri var, warn/leg yok
  // hepsini inline rgba ile veriyorum — tutarlı
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
        return { id: b.id, blok_kayit_id: kb.id, ad: b.ad, renk: b.renk, tip: b.tip }
      })
      .filter(b => b.id && ISLEM_BLOK_ADLARI.includes(b.ad))
  } catch (e) {
    console.error('[isbaslat] hata:', e && e.message)
    return []
  }
}

// ───────────────────────────────────────────────
// localStorage — rol hatırlama
// Operatör bir rol seçtiğinde, sonraki açılışta otomatik seçili gelir.
// Kart highlighted olduğu için kullanıcı yanlışı fark eder.
// ───────────────────────────────────────────────
const ROL_KEY = 'ares_is_aktif_rol'

export function rolKaydet(blok) {
  if (!blok || !blok.id) return
  try {
    localStorage.setItem(ROL_KEY, JSON.stringify({
      id:   blok.id,
      ad:   blok.ad,
      renk: blok.renk || null,
    }))
  } catch (e) { /* private browsing fallback */ }
}

export function rolHatirla() {
  try {
    const v = localStorage.getItem(ROL_KEY)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

export function rolUnut() {
  try { localStorage.removeItem(ROL_KEY) } catch {}
}
