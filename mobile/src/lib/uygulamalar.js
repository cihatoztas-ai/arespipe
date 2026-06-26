// mobile/src/lib/uygulamalar.js
// Uygulamalar (spool'dan bağımsız araçlar) sabit listesi.
// Yetki gerektirmez — herkese açık. Tetik gelince DB tablosuna taşınır (MK-206.3).
// Yeni uygulama eklenince buraya bir kayıt + lang/{tr,en,ar}.json'a anahtarlar eklenir.
//
// durum: 'aktif' → tıklanınca hedef route açılır.
//        'yakinda' → tıklanınca "yakında" toast'u, gri rozet.
// Renkler CSS değişkeni (tema uyumu).

export const UYGULAMALAR = [
  {
    id: 'birim_cevirici',
    ikon: '🔢',
    renk: 'var(--gr)',
    i18n_ad: 'm_uyg_birim_cevirici',
    i18n_aciklama: 'm_uyg_birim_cevirici_alt',
    ad: 'Birim Çevirici',
    aciklama: 'DN ↔ inç, mm ↔ inç, ağırlık',
    hedef: '/uygulama/birim-cevirici',
    durum: 'yakinda',
  },
  {
    id: 'kutuphane',
    ikon: '📚',
    renk: 'var(--leg)',
    i18n_ad: 'm_uyg_kutuphane',
    i18n_aciklama: 'm_uyg_kutuphane_alt',
    ad: 'Kütüphane',
    aciklama: 'Boru, fitting, flanş ölçü sorgu',
    hedef: '/uygulama/kutuphane',
    durum: 'yakinda',
  },
  {
    id: 'kesim_opt',
    ikon: '✂️',
    renk: 'var(--ac)',
    i18n_ad: 'm_uyg_kesim_opt',
    i18n_aciklama: 'm_uyg_kesim_opt_alt',
    ad: 'Kesim Optimizasyonu',
    aciklama: 'Boy fire en aza indirme',
    hedef: '/uygulama/kesim-opt',
    durum: 'yakinda',
  },
  {
    id: 'parca_tanima',
    ikon: '📸',
    renk: 'var(--warn)',
    i18n_ad: 'm_uyg_parca_tanima',
    i18n_aciklama: 'm_uyg_parca_tanima_alt',
    ad: 'Parça Tanıma',
    aciklama: 'Flanş/fitting fotoğrafı → standart bilgi',
    hedef: '/uygulama/parca-tanima',
    durum: 'yakinda',
  },
]

/**
 * id'ye göre uygulama bilgisini getir. Bilinmeyen id için null.
 */
export function getUygulama(id) {
  return UYGULAMALAR.find((u) => u.id === id) || null
}
