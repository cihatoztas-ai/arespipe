// mobile/src/lib/yetki.js
// Yetki sistemi helper'ları.
//
// Mimari:
// - yetki_bloklari: Sistem blokları. Her bloğun 1 "grup"u var.
// - kullanici_bloklar: Kullanıcıya atanan bloklar (N:N).
// - blok_sayfa_yetkileri: Bloğun hangi sayfalara eriştiği + gizli bölümler.
//
// Kural: Grup = ekranda görünen buton. Blok = teknik yetki varyantı.
// Bir grupta birden fazla bloğa sahip kullanıcı için izinler BİRLEŞİR.
// gizli_bolumler içinse KESİŞİM alınır (ortak gizli olanlar gerçekten gizli).

import { supabase } from './supabase'

/**
 * Kullanıcının tüm bloklarını çeker.
 * @returns Array of { id, ad, grup, renk, aciklama, sistem_preset, sira }
 */
export async function getKullaniciBloklari() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from('kullanici_bloklar')
    .select(`
      blok_id,
      yetki_bloklari (
        id, ad, grup, renk, aciklama, sistem_preset, sira
      )
    `)
    .eq('kullanici_id', session.user.id)

  if (error) {
    console.warn('[yetki] Bloklar çekilemedi:', error)
    return []
  }

  // Flat'le ve null bloğu at
  return (data || [])
    .map(x => x.yetki_bloklari)
    .filter(Boolean)
}

/**
 * Kullanıcının atanmış bloklarından distinct grupları döner.
 * Her grup için bir temsil bloğu + o gruba ait tüm bloklar listelenir.
 *
 * @returns Array of {
 *   grup_adi,           // "Büküm", "Argon Kaynağı", vs.
 *   renk,               // Grup'un ana rengi (ilk bloktan alınır)
 *   sira,               // sıralama için
 *   bloklar: [...],     // Bu gruptaki tüm bloklar (kullanıcıya ait)
 * }
 */
export async function getKullaniciGruplari() {
  const bloklar = await getKullaniciBloklari()
  const grupMap = {}

  for (const blok of bloklar) {
    const grup = blok.grup || blok.ad
    if (!grupMap[grup]) {
      grupMap[grup] = {
        grup_adi: grup,
        renk: blok.renk,
        sira: blok.sira ?? 10,
        bloklar: [],
      }
    }
    grupMap[grup].bloklar.push(blok)
  }

  return Object.values(grupMap).sort((a, b) => {
    if (a.sira !== b.sira) return a.sira - b.sira
    return a.grup_adi.localeCompare(b.grup_adi, 'tr')
  })
}

/**
 * Bir sayfa için gizli bölümleri hesaplar.
 * Kullanıcının o sayfaya erişebilen tüm bloklarının gizli_bolumler
 * listelerinin KESİŞİMİ alınır.
 * Yani: Bir blok gösteriyorsa, kullanıcı görebilir.
 *
 * @param sayfa_kodu — 'mobile/bukum', 'is_baslat', 'spool_detay' vs.
 * @returns string[] — gerçekten gizli bölümler
 */
export async function getGizliBolumler(sayfa_kodu) {
  const bloklar = await getKullaniciBloklari()
  const blokIds = bloklar.map(b => b.id)
  if (!blokIds.length) return []

  const { data, error } = await supabase
    .from('blok_sayfa_yetkileri')
    .select('blok_id, gizli_bolumler')
    .eq('sayfa_kodu', sayfa_kodu)
    .in('blok_id', blokIds)

  if (error) {
    console.warn('[yetki] Gizli bölümler alınamadı:', error)
    return []
  }

  if (!data || !data.length) return []

  // Kesişim: hepsinin ortak gizli bölümleri
  let ortak = [...(data[0].gizli_bolumler || [])]
  for (let i = 1; i < data.length; i++) {
    const liste = data[i].gizli_bolumler || []
    ortak = ortak.filter(x => liste.includes(x))
    if (!ortak.length) break
  }

  return ortak
}

/**
 * Kullanıcının belirli bir sayfaya erişimi var mı?
 * Herhangi bir bloğunun o sayfaya izni varsa → true.
 */
export async function sayfaErisimiVar(sayfa_kodu) {
  const bloklar = await getKullaniciBloklari()
  if (!bloklar.length) return false

  const { data, error } = await supabase
    .from('blok_sayfa_yetkileri')
    .select('id')
    .eq('sayfa_kodu', sayfa_kodu)
    .in('blok_id', bloklar.map(b => b.id))
    .limit(1)

  if (error) return false
  return (data || []).length > 0
}

/**
 * Kullanıcının rolü yönetici/super_admin mi?
 * (MAnasayfa router buna göre yönlendirir.)
 */
export function yoneticiMi(kullanici) {
  if (!kullanici) return false
  return ['super_admin', 'yonetici'].includes(kullanici.rol)
}
