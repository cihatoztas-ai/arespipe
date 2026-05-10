// mobile/src/lib/basamak-akisi.js
// 3f.3 — Sonraki basamak resolver + akis kural matrisi
//
// Mimari (71 sonu):
//   - basamak_tanimlari tablosu: ana basamak listesi (tenant bazinda dinamik)
//   - Akis kural matrisi: bir basamaktan hangi(ler)ine gidilebilir (Cihat 71 senaryosu)
//   - Kaynak alt-tipleri: argon_kaynagi, gazalti_kaynagi (basamak_tanimlari'nda yok,
//     sentetik satirlar uretilir; aktif_basamak text kolonuna direkt yazilir)
//   - Tablo gostermesinde prefix normalize: hepsi "Kaynak" alias'i
//
// Cihat 71 saha kurallari:
//   imalat            -> argon | gazalti | on_kontrol     (KK ve sevkiyat YASAK)
//   argon_kaynagi     -> gazalti | on_kontrol             (KK ve sevkiyat YASAK)
//   gazalti_kaynagi   -> argon | on_kontrol               (KK ve sevkiyat YASAK)
//   on_kontrol        -> kk
//   kk                -> sevkiyat
//
// MK-71.1 [DISIPLIN]: basamak adlari DB-driven (gorunen_ad{,_en,_ar}).
// Alt-tipler kodda hardcoded fallback (basamak_tanimlari kapsami disinda).

/**
 * Tenant'in aktif basamak listesini DB'den ceker.
 * RLS otomatik tenant filtresi yapar (get_tenant_id() pattern, MK-70.3).
 */
export async function basamakListesiniGetir(supabase) {
  const { data, error } = await supabase
    .from('basamak_tanimlari')
    .select('sistem_adi, gorunen_ad, gorunen_ad_en, gorunen_ad_ar, sira, ilerleme_puani')
    .eq('aktif', true)
    .order('sira', { ascending: true })

  if (error) {
    console.error('[basamak-akisi] basamak_tanimlari fetch hatasi:', error)
    throw error
  }
  return data || []
}

// ─────────────────────────────────────────────────────────────────
// Akis kural matrisi (Cihat 71 final saha senaryosu)
//
// Mobile saha basamaklari (QR akisi):
//   on_imalat / imalat / argon_kaynagi / gazalti_kaynagi / kaynak (eski) / on_kontrol
//
// on_kontrol = TERMINAL: saha biter, web devralir (KK ve Sevkiyat web tarafinda).
// Mobile QR akisi sadece bu 3 basamak grubunda calisir:
//   - imalat (on_imalat -> imalat)
//   - kaynak (argon / gazalti)
//   - on_kontrol (kontrol + foto + qr, sevk yok)
//
// kk ve sevkiyat AKIS_KURAL_MATRISI'nde YER ALMAZ — mobile drawer'inda gozukmez.
// ─────────────────────────────────────────────────────────────────

const AKIS_KURAL_MATRISI = {
  // Erken basamaklar (saha disi, varsayim — Cihat'in firmasinda kullanilmiyor)
  tasarim:        ['on_imalat'],
  on_imalat:      ['imalat'],
  alim_kontrol:   ['imalat'],

  // Saha akisi (Cihat 71 net kural)
  imalat:         ['argon_kaynagi', 'gazalti_kaynagi', 'on_kontrol'],
  argon_kaynagi:  ['gazalti_kaynagi', 'on_kontrol'],
  gazalti_kaynagi:['argon_kaynagi', 'on_kontrol'],
  // Eski 'kaynak' enum — fallback olarak alt-tipler + on_kontrol
  kaynak:         ['argon_kaynagi', 'gazalti_kaynagi', 'on_kontrol'],

  // SAHA TERMINAL: on_kontrol sonrasi mobile'da secim YOK, web devralir
  on_kontrol:     [],

  // kk ve sevkiyat mobile'da gozukmez (web tarafi yonetir)
}

// Alt-tipler basamak_tanimlari'nda yok — sentetik satir uretilir
const ALT_TIP_ETIKETLERI = {
  argon_kaynagi: {
    gorunen_ad: 'Argon Kaynağı',
    gorunen_ad_en: 'TIG (Argon) Welding',
    gorunen_ad_ar: 'لحام TIG (الأرغون)',
  },
  gazalti_kaynagi: {
    gorunen_ad: 'Gazaltı Kaynağı',
    gorunen_ad_en: 'MIG/MAG Welding',
    gorunen_ad_ar: 'لحام MIG/MAG',
  },
}

/**
 * Mevcut aktif basamaktan SONRAKI olası basamaklari dondurur.
 * Cihat 71 saha kurallarına gore filtreli — KK ve Sevkiyat'a imalat/kaynak'tan gecis YASAK.
 *
 * Donen array elemanlari basamak_tanimlari satiri formatinda
 * (sistem_adi, gorunen_ad, gorunen_ad_en, gorunen_ad_ar). Alt-tipler icin
 * sentetik satir uretilir.
 *
 * @param {string} aktifBasamak - spooller.aktif_basamak
 * @param {Array} liste - basamakListesiniGetir() ciktisi (ana basamaklar)
 * @returns {Array} sonraki basamak satirlari (bos array = son basamak)
 */
export function sonrakiBasamaklar(aktifBasamak, liste) {
  if (!Array.isArray(liste)) liste = []

  const sonrakiKodlar = AKIS_KURAL_MATRISI[aktifBasamak] || []
  if (sonrakiKodlar.length === 0) return []

  return sonrakiKodlar.map((kod) => {
    // Once basamak_tanimlari'nda ara (DB'deki tenant-spesifik etiket)
    const dbSatir = liste.find((b) => b.sistem_adi === kod)
    if (dbSatir) return dbSatir

    // Alt-tip — sentetik satir
    const altTip = ALT_TIP_ETIKETLERI[kod]
    if (altTip) {
      return {
        sistem_adi: kod,
        gorunen_ad: altTip.gorunen_ad,
        gorunen_ad_en: altTip.gorunen_ad_en,
        gorunen_ad_ar: altTip.gorunen_ad_ar,
        sira: null, // alt-tip, sira yok
      }
    }

    // Bilinmeyen kod — fallback
    return {
      sistem_adi: kod,
      gorunen_ad: kod,
    }
  })
}

/**
 * Basamagin secilen dile gore gorunen adini dondurur.
 * Fallback zinciri: dil-spesifik -> gorunen_ad (TR) -> sistem_adi.
 */
export function basamakAdi(basamak, dil = 'tr') {
  if (!basamak) return ''
  if (dil === 'en' && basamak.gorunen_ad_en) return basamak.gorunen_ad_en
  if (dil === 'ar' && basamak.gorunen_ad_ar) return basamak.gorunen_ad_ar
  return basamak.gorunen_ad || basamak.sistem_adi || ''
}

// ─────────────────────────────────────────────────────────────────
// Kaynak alt-tip mantigi (tablo gostermesi icin)
// ─────────────────────────────────────────────────────────────────

/**
 * Bir aktif_basamak degeri kaynak ailesinden mi?
 * 'kaynak', 'argon_kaynagi', 'gazalti_kaynagi' — hepsi true.
 */
export function kaynakAltTipiMi(sistemAdi) {
  if (!sistemAdi) return false
  return /kaynak/i.test(sistemAdi)
}

/**
 * Kaynak alt-tipini ana 'kaynak' sistem_adi'na normalize eder.
 * Tablo gostermesinde "Kaynak" alias'i icin.
 */
export function anaBasamakSistemAdi(sistemAdi) {
  if (kaynakAltTipiMi(sistemAdi)) return 'kaynak'
  return sistemAdi
}

/**
 * Spool son basamakta mi (sonraki yok)?
 */
export function sonBasamakMi(aktifBasamak, liste) {
  return sonrakiBasamaklar(aktifBasamak, liste).length === 0
}
