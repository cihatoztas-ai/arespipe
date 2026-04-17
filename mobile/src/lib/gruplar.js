// mobile/src/lib/gruplar.js
// Grup adı → ikon, renk, hedef sayfa, i18n anahtarı haritası.
// Yeni grup eklenince buraya da eklenmeli.
//
// Renkler CSS değişkeni veya hex olabilir. CSS değişkeni önerilir (tema uyumu).
// Hedef: hangi route'a gidecek. Dinamik parametreler query string ile.

export const GRUP_HARITASI = {
  // ÜRETİM BLOKLARI (işlem başlat akışı)
  'Kesim': {
    ikon: '✂️',
    renk: 'var(--ac)',
    hedef: '/is-baslat',
    param: 'islem=kesim',
    i18n: 'm_grup_kesim',
  },
  'Büküm': {
    ikon: '↩️',
    renk: 'var(--ac)',
    hedef: '/is-baslat',
    param: 'islem=bukum',
    i18n: 'm_grup_bukum',
  },
  'İmalat': {
    ikon: '🔧',
    renk: 'var(--ac)',
    hedef: '/is-baslat',
    param: 'islem=imalat',
    i18n: 'm_grup_imalat',
  },
  'Markalama': {
    ikon: '🏷️',
    renk: 'var(--warn)',
    hedef: '/is-baslat',
    param: 'islem=markalama',
    i18n: 'm_grup_markalama',
  },
  'Argon Kaynağı': {
    ikon: '🔥',
    renk: 'var(--warn)',
    hedef: '/is-baslat',
    param: 'islem=argon_kaynak',
    i18n: 'm_grup_argon_kaynak',
  },
  'Gazaltı Kaynağı': {
    ikon: '🔥',
    renk: 'var(--warn)',
    hedef: '/is-baslat',
    param: 'islem=gazalti_kaynak',
    i18n: 'm_grup_gazalti_kaynak',
  },

  // KALİTE
  'Kalite Kontrol': {
    ikon: '✅',
    renk: 'var(--leg)',
    hedef: '/kk',
    param: '',
    i18n: 'm_grup_kk',
  },

  // LOJİSTİK
  'Malzeme': {
    ikon: '📦',
    renk: 'var(--gr)',
    hedef: '/malzeme',
    param: '',
    i18n: 'm_grup_malzeme',
  },
  'Sevkiyat': {
    ikon: '🚚',
    renk: 'var(--gr)',
    hedef: '/sevkiyat',
    param: '',
    i18n: 'm_grup_sevkiyat',
  },

  // YÖNETİM
  'Raporlar': {
    ikon: '📊',
    renk: 'var(--txd)',
    hedef: '/raporlar',
    param: '',
    i18n: 'm_grup_raporlar',
  },
  'Kullanıcı Yönetimi': {
    ikon: '👥',
    renk: 'var(--txd)',
    hedef: '/kullanicilar',
    param: '',
    i18n: 'm_grup_kullanicilar',
  },
  'Tanımlar': {
    ikon: '⚙️',
    renk: 'var(--txd)',
    hedef: '/tanimlar',
    param: '',
    i18n: 'm_grup_tanimlar',
  },
}

/**
 * Grup adına göre görsel bilgileri getir.
 * Bilinmeyen grup için varsayılan döner.
 */
export function getGrupBilgisi(grup_adi) {
  return GRUP_HARITASI[grup_adi] || {
    ikon: '📋',
    renk: 'var(--txd)',
    hedef: '/',
    param: '',
    i18n: null,
  }
}
