'use strict';

// ============================================================================
// format-paketleri.js — Aşama 1 PİLOT (oturum 119)
// ----------------------------------------------------------------------------
// Çalışan monolit `e1fb879d` parser_kural'ı, kılavuz Bölüm 4'teki katmanlara
// AYRIŞTIRILDI (MK-118.3 tembel refactor). Hiçbir regex DEĞİŞTİRİLMEDİ;
// yalnızca DOĞRU KATMANA TAŞINDI. Yeni eklenenler `// + PİLOT` ile işaretli.
//
// Katman sırası (Bölüm 4): 0 evrensel < 1 aile < 2 malzeme < 3 gemi.
// Çakışmada ÜST (büyük katman no) kazanır. specificity = katman sırası (Bölüm 6).
//
// PİLOT alanı: boyut/çap (karbon=metrik ODxWT, paslanmaz=inç+Sch).
// Kanıt hedefi: NB1110 (karbon) + NB1137 (ikisi de) AYNI birleştirici koduyla.
// ============================================================================

// ---- Katman 0: EVRENSEL (herkese uyar, seselici yok) -----------------------
// Alıştırma ipucu zaten l2-parser motorunda merkezî varsayılan (MK-117.1).
// NPS<->DN eşleme deterministik kod-tarafı zenginleştirmede (boru_olculer, oturum 36/51).
// Pilot için evrensel katman parser_kural'a bir şey EKLEMEZ; varlığı katman
// modelinin tamlığı için (ileride halüsinasyon korumaları / sözlük buraya).
export const EVRENSEL = {
  id: 'evrensel',
  katman: 0,
  seselici: null,
  parser_kural_parcasi: {}
};

// ---- Katman 1: A1 ailesi (Cadmatic-Tersan şablonu, imalat/spool) -----------
// Seselici = YAPISAL PARMAK İZİ (MK-118.1): başlık token seti. Producer DEĞİL.
// İçerik: çizim iskeleti alanları + malzeme-grubundan BAĞIMSIZ satır tipleri
// (groove/kaynak/bilezik/dirsek/flans). boru satırları Katman 2'de.
export const A1_TERSAN_CADMATIC = {
  id: 'a1_tersan_cadmatic',
  katman: 1,
  seselici: {
    yapisal_token: ['SPOOL NAME', 'WELDING NUMBER', 'CUT NUMBER', 'Malzeme Listesi']
  },
  parser_kural_parcasi: {
    ekstraktor_tipi: 'regex_text',
    min_metin_uzunlugu: 100,
    kabul_kriterleri: {
      min_malzeme_satir: 1,
      l3_fallback_yapilir: true,
      min_overall_match_orani: 0.5
    },
    alanlar: {
      // dn/tarih/yuzey/spool_no/not_metni/agirlik_kg — malzeme grubundan bağımsız,
      // aile iskeletinin sabit alanları (e1fb879d'den birebir).
      dn:         { tip: 'int',    grup: 1, regex: 'DN(\\d+)\\s+(?:\\d|L=|OD:)' },
      tarih:      { tip: 'string', grup: 1, regex: '\\n(\\d{2}-\\d{2}-\\d{2})\\n' },
      yuzey:      { tip: 'string', grup: 1, regex: '\\n(Galvaniz|Paslanmaz|CUNIFE|Siyah|Asit|Boyal.)\\n' },
      spool_no:   { tip: 'string', grup: 1, regex: '\\n-(S\\d+(?:_\\d+)?)\\n' },
      not_metni:  { tip: 'string', flag: 'im', grup: 1, regex: 'NOT: *,? *(.+?)(?: {3,}| +[0-9]+[.,][0-9]+ *kg|$)' },
      agirlik_kg: { tip: 'float',  grup: 1, regex: '\\n(\\d+(?:\\.\\d+)?)\\s*kg\\n' }
    },
    malzeme_tablosu: {
      aktif: true,
      // İskelet satır tipleri (malzeme grubundan bağımsız). spesifiklik=5: tetikleyicileri
      // 'Boru Dik' ile çakışmaz, aralarındaki sıra önemsiz. (e1fb879d'den birebir.)
      satir_tipleri_ekle: [
        {
          ad: 'groove', kategori: 'islem', spesifiklik: 5,
          tetikleyici_regex: 'Groove',
          pattern: '^\\d+(\\d)(.+?)DN(\\d+)(?:\\s*OD:\\d+)?\\s*([\\d.]+)([A-Za-z.*]*)(\\d+)$',
          grup_haritasi: { dn: 3, adet: 1, tanim: 2, kalite: 5, agirlik_kg: 4 }
        },
        {
          ad: 'kaynak', kategori: 'islem', spesifiklik: 5,
          tetikleyici_regex: 'Al.n Kayna',
          pattern: '^\\d+(\\d)(.+?)DN(\\d+)\\s*\\d*(ST\\d{2}|316L)(\\d+)$',
          grup_haritasi: { dn: 3, adet: 1, tanim: 2, kalite: 4, agirlik_kg: 5 }
        },
        {
          ad: 'bilezik', kategori: 'fitting', spesifiklik: 5,
          tetikleyici_regex: 'Ic Bilezik',
          pattern: '^\\d+(\\d)(.+?)DN(\\d+)\\s+L=(\\d+)\\s*(\\d+)(ST\\d{2}|316L)(\\d+\\.\\d+)$',
          grup_haritasi: { dn: 3, adet: 1, tanim: 2, boy_mm: 4, kalite: 6, agirlik_kg: 7 }
        },
        {
          ad: 'dirsek', kategori: 'fitting', spesifiklik: 5,
          tetikleyici_regex: 'Dirsek',
          pattern: '^\\d+(\\d)(.+?)(\\d+\\.\\d+)x(\\d+\\.\\d)\\s*(\\d+)(CuNi\\d+Fe\\d+\\.|ST\\d{2}|316L)(\\d+\\.\\d+)$',
          grup_haritasi: { adet: 1, et_mm: 4, tanim: 2, boy_mm: 5, kalite: 6, agirlik_kg: 7, dis_cap_mm: 3 }
        },
        {
          ad: 'flans', kategori: 'fitting', spesifiklik: 5,
          tetikleyici_regex: 'Flan\\S*\\s+D',
          pattern: '^\\d+(\\d)(.+?)DN(\\d+)\\s*\\d+(ST\\d{2}|AISI\\s*316L|316L)(\\d+\\.\\d+)$',
          grup_haritasi: { dn: 3, adet: 1, tanim: 2, kalite: 4, agirlik_kg: 5 }
        }
      ]
    }
  }
};

// ---- Katman 2: MALZEME GRUBU — KARBON (ÇAPRAZ facet) -----------------------
// Seselici = malzeme/kalite tokeni (Bölüm 4). Boyut biçimi: metrik ODxWT.
// İçerik: spool-seviyesi metrik cap_mm/et_mm + metrik boru satır tipi (boru_mm).
export const MALZEME_KARBON = {
  id: 'malzeme_karbon',
  katman: 2,
  seselici: {
    // Metin bu tokenlerden birini taşırsa karbon paketi dahil edilir.
    kalite_token_regex: 'ST\\d{2}|Galvaniz|Siyah|\\d+\\.\\d+x\\d+\\.\\d'
  },
  parser_kural_parcasi: {
    alanlar: {
      // Metrik ODxWT — sadece karbon/galv spool'unda anlamlı (e1fb879d'den birebir).
      cap_mm: { tip: 'float', grup: 1, regex: '(\\d+\\.\\d+)x\\d+\\.\\d' },
      et_mm:  { tip: 'float', grup: 1, regex: '\\d+\\.\\d+x(\\d+\\.\\d)' }
    },
    malzeme_tablosu: {
      satir_tipleri_ekle: [
        {
          // En genel boru satırı (catch-all). spesifiklik=1 → boru_sch'ten SONRA denenir.
          ad: 'boru_mm', kategori: 'boru', spesifiklik: 1,
          tetikleyici_regex: 'Boru Dik',
          pattern: '^\\d+(.+?)(\\d+\\.\\d+)x(\\d+\\.\\d)(\\d+)\\s+(ST\\d{2}|CuNi\\d+Fe\\d+\\.|316L|St\\.St)(\\d+\\.\\d+)$',
          grup_haritasi: { et_mm: 3, tanim: 1, boy_mm: 4, kalite: 5, agirlik_kg: 6, dis_cap_mm: 2 }
        }
      ]
    }
  }
};

// ---- Katman 2: MALZEME GRUBU — PASLANMAZ (ÇAPRAZ facet) --------------------
// Boyut biçimi: emperyal inç+Sch. spesifiklik=10 → metrik boru_mm'den ÖNCE denenir.
// + PİLOT: boru_sch'in bugün ATILAN inç (grup 2) ve Sch (grup 3) gruplarını
//   grup_haritasi'na ekledik (nps_inc, schedule_kod). DN dönüşümü NPS<->DN
//   eşlemesiyle (Katman 0 / boru_olculer) kod-tarafı zenginleştirmede yapılır.
export const MALZEME_PASLANMAZ = {
  id: 'malzeme_paslanmaz',
  katman: 2,
  seselici: {
    kalite_token_regex: '316L|St\\.St|"\\s*Sch|Paslanmaz'
  },
  parser_kural_parcasi: {
    alanlar: {},
    malzeme_tablosu: {
      satir_tipleri_ekle: [
        {
          ad: 'boru_sch', kategori: 'boru', spesifiklik: 10,
          tetikleyici_regex: 'Boru Dik.*"\\s*Sch',
          pattern: '^\\d+(.+?)(\\d+)"\\s*Sch\\s*(\\d+S?)(\\d+)\\s+(316L|AISI\\s*316L|ST\\d{2})(\\d+\\.\\d+)$',
          // grup_haritasi: tanim=1, [+PİLOT nps_inc=2, schedule_kod=3], boy_mm=4, kalite=5, agirlik_kg=6
          grup_haritasi: { tanim: 1, nps_inc: 2, schedule_kod: 3, boy_mm: 4, kalite: 5, agirlik_kg: 6 }
        }
      ]
    }
  }
};

// Pilot paket kataloğu (Aşama 2/3'te DB'ye taşınır; şimdilik kod tarafı).
export const TUM_PAKETLER = [EVRENSEL, A1_TERSAN_CADMATIC, MALZEME_KARBON, MALZEME_PASLANMAZ];

// ---- Aile kaydı (registry): format_kodu → katman paketleri -----------------
// parserKuralIle bunu sorar: format katalog-yönetimliyse paketlerden ETKİN KURAL
// üretilir; değilse DB parser_kural'ı AYNEN kullanılır. Yeni aile eklemek =
// buraya bir satır (izometri-oku.js'e dokunmadan). Özel-durum (if format_id) YOK.
//
// SADECE DOĞRULANMIŞ aile bağlanır:
//   tersan_cadmatic_spool (e1fb879d) — 119'da composability + 6/8 gerçek PDF ile kanıtlandı.
// ADAY ama bağlı DEĞİL (kendi parser_kural'ı + gerçek PDF doğrulanmadan eklenmez):
//   tersan_cadmatic_isometry (84c12f61) — malzeme tablosu aktif, "Montaj Resmi" gerilim formatı.
// ASLA bağlanmaz:
//   tersan_cadmatic_montaj (montaj_modu) — kendi montaj yolunda kalır.
//   paor_aveva_* — image-PDF (E ailesi), L3.
//
// ⚠ SOURCE-OF-TRUTH NOTU (MK adayı): Bir format buraya bağlandığında, parse kuralının
// KAYNAĞI kod paketleridir; DB satırı yalnız TANIMA (fingerprint) için kalır. Yani
// tersan_cadmatic_spool için DB'deki parser_kural'ı elle değiştirmek parse'ı ETKİLEMEZ.
// (Aşama 3'te paketler DB'ye taşınınca bu ikilik tamamen kalkar — tek kaynak DB olur.)
export const AILE_KAYIT = {
  tersan_cadmatic_spool: [EVRENSEL, A1_TERSAN_CADMATIC, MALZEME_KARBON, MALZEME_PASLANMAZ],
};

export default {
  EVRENSEL, A1_TERSAN_CADMATIC, MALZEME_KARBON, MALZEME_PASLANMAZ, TUM_PAKETLER, AILE_KAYIT
};
