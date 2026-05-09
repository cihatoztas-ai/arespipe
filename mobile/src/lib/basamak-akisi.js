// mobile/src/lib/basamak-akisi.js
// 3f.3 — Sonraki basamak resolver + kaynak alt-tip mantigi
//
// Mimari (71 sonu):
//   - Ana basamak listesi: basamak_tanimlari tablosu (tenant bazinda dinamik)
//   - i18n: gorunen_ad{,_en,_ar} — DB'de
//   - Kaynak alt-tipleri: aktif_basamak text kolonunda 'argon_kaynagi' / 'gazalti_kaynagi'
//     (enum DEGIL — text kolonu, sinirsiz alt-tip eklenebilir)
//   - Tablo gostermesinde prefix normalize: hepsi "Kaynak" alias'i
//
// MK-71.1 [DISIPLIN]: Mobile basamak adlarini i18n'a hardcode etmez,
// basamak_tanimlari'ndan dinamik ceker.

/**
 * Tenant'in aktif basamak listesini DB'den ceker.
 * RLS otomatik tenant filtresi yapar (get_tenant_id() pattern, MK-70.3).
 *
 * @param {object} supabase
 * @returns {Promise<Array>} basamak satirlari (sira ASC)
 */
export async function basamakListesiniGetir(supabase) {
  const { data, error } = await supabase
    .from('basamak_tanimlari')
    .select('sistem_adi, gorunen_ad, gorunen_ad_en, gorunen_ad_ar, sira, ilerleme_puani')
    .eq('aktif', true)
    .order('sira', { ascending: true });

  if (error) {
    console.error('[basamak-akisi] basamak_tanimlari fetch hatasi:', error);
    throw error;
  }
  return data || [];
}

/**
 * Mevcut aktif basamaktan SONRAKI tum basamaklari dondurur.
 * Cihat 71: "imalattan kaynagi atlayip on kontrole gidebilsin" — coklu secim mumkun.
 *
 * @param {string} aktifBasamak - spooller.aktif_basamak (sistem_adi veya kaynak alt-tipi)
 * @param {Array} liste - basamakListesiniGetir() ciktisi
 * @returns {Array} sonraki basamak satirlari (sira ASC, bos array = son basamak)
 */
export function sonrakiBasamaklar(aktifBasamak, liste) {
  if (!Array.isArray(liste) || liste.length === 0) return [];

  // Kaynak alt-tipinden basamak listesindeki ana 'kaynak' satirina normalize et
  const normalizeAktif = anaBasamakSistemAdi(aktifBasamak);

  const idx = liste.findIndex((b) => b.sistem_adi === normalizeAktif);
  if (idx < 0) return [];
  return liste.slice(idx + 1);
}

/**
 * Basamagin secilen dile gore gorunen adini dondurur.
 * Fallback zinciri: dil-spesifik -> gorunen_ad (TR) -> sistem_adi.
 *
 * @param {object} basamak - basamak_tanimlari satiri
 * @param {string} dil - 'tr' | 'en' | 'ar'
 */
export function basamakAdi(basamak, dil = 'tr') {
  if (!basamak) return '';
  if (dil === 'en' && basamak.gorunen_ad_en) return basamak.gorunen_ad_en;
  if (dil === 'ar' && basamak.gorunen_ad_ar) return basamak.gorunen_ad_ar;
  return basamak.gorunen_ad || basamak.sistem_adi || '';
}

// ─────────────────────────────────────────────────────────────────
// Kaynak alt-tip mantigi (3f.3 + tablo gostermesi)
// ─────────────────────────────────────────────────────────────────

/** Kaynak alt-tipi kodlari ve i18n etiketleri (3f.3 alt drawer'da kullanilir) */
export const KAYNAK_ALT_TIPLERI = [
  { kod: 'argon_kaynagi', i18nKey: 'm_ib_sd_kaynak_yontemi_argon' },
  { kod: 'gazalti_kaynagi', i18nKey: 'm_ib_sd_kaynak_yontemi_gazalti' },
];

/**
 * Bir aktif_basamak degeri kaynak ailesinden mi?
 * 'kaynak', 'argon_kaynagi', 'gazalti_kaynagi' — hepsi true.
 */
export function kaynakAltTipiMi(sistemAdi) {
  if (!sistemAdi) return false;
  return /kaynak/i.test(sistemAdi);
}

/**
 * Kaynak alt-tipini ana 'kaynak' sistem_adi'na normalize eder.
 * basamak_tanimlari lookup'i ve tablo gostermesinde kullanilir.
 *
 *   argon_kaynagi  -> kaynak
 *   gazalti_kaynagi -> kaynak
 *   kaynak         -> kaynak (degismez)
 *   imalat         -> imalat (degismez)
 */
export function anaBasamakSistemAdi(sistemAdi) {
  if (kaynakAltTipiMi(sistemAdi)) return 'kaynak';
  return sistemAdi;
}
