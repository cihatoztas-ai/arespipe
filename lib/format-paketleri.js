'use strict';

// ============================================================================
// format-paketleri.js — Aşama 1 PİLOT (oturum 119) + MONTAJ ailesi (oturum 120)
// ----------------------------------------------------------------------------
// Çalışan monolit `e1fb879d` parser_kural'ı, kılavuz Bölüm 4'teki katmanlara
// AYRIŞTIRILDI (MK-118.3 tembel refactor). Hiçbir regex DEĞİŞTİRİLMEDİ;
// yalnızca DOĞRU KATMANA TAŞINDI. Yeni eklenenler `// + PİLOT` ile işaretli.
//
// 120: İKİNCİ aile (montaj/izometri) eklendi — yapısal olarak FARKLI (montaj_modu,
// malzeme tablosu YOK). 39a2c81b'nin DB parser_kural'ı paket şekline taşındı +
// NB1137 pipeline_no kırılması düzeltildi (`[[PIPE:]]` markerı → gerçek SPOOL NAME).
//
// Katman sırası (Bölüm 4): 0 evrensel < 1 aile < 2 malzeme < 3 gemi.
// Çakışmada ÜST (büyük katman no) kazanır. specificity = katman sırası (Bölüm 6).
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
          // + 123 (MK-123.B): "Al.n Kayna" satiri bir ISLEM (kaynak), AGIRLIK TASIMAZ.
          // Eski pattern sonda zorunlu (\d+)$ istiyordu -> "Al.n Kayna - SahaDN50 3ST37"
          // tutmuyordu (ham_satir). Agirlik OPSIYONEL ((...)?) + SA/A dovme sinifi eklendi.
          ad: 'kaynak', kategori: 'islem', spesifiklik: 5,
          tetikleyici_regex: 'Al.n Kayna',
          pattern: '^\\d+(\\d)(.+?)DN(\\d+)\\s*\\d*(ST\\d{2}|316L|SA\\/A\\d+)(\\d+(?:\\.\\d+)?)?$',
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
        },
        {
          // + 123 (MK-123.C): Manson (bilezik/kovan) DN-bazli dovme parca. Onceden
          // HIC tetikleyicisi yoktu -> satir SESSIZCE dusuyordu (ne dolu ne ham).
          // "Man.on" wildcard (Turkce s'den kacin, mevcut 'Al.n'/'Flan\S*' stili).
          // Kalite SA/A105 (dovme); 'DN(\d+)' ic-grup, agirlik sonda.
          ad: 'manson', kategori: 'fitting', spesifiklik: 5,
          tetikleyici_regex: 'Man.on',
          pattern: '^\\d+(\\d)(Man.on.*?DN(\\d+).*?)(SA\\/A\\d+|316L|ST\\d{2}|St\\.St)(\\d+\\.\\d+)$',
          grup_haritasi: { adet: 1, tanim: 2, dn: 3, kalite: 4, agirlik_kg: 5 }
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
    kalite_token_regex: 'ST\\d{2}|Galvaniz|Siyah|\\d+\\.\\d+x\\d+\\.\\d'
  },
  parser_kural_parcasi: {
    alanlar: {
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
          grup_haritasi: { tanim: 1, nps_inc: 2, schedule_kod: 3, boy_mm: 4, kalite: 5, agirlik_kg: 6 }
        },
        {
          // + 123 (MK-123.A): EMPERYAL dirsek (inc+Sch). Tetikleyici 'Dirsek.*"\s*Sch'
          // -> metrik CuNi dirseginden (A1, tetik 'Dirsek') AYRISIR; spesifiklik 10 ile
          // metrik (5) ONCE denenir, ama tetikleyici daha kisitli oldugundan metrik
          // CuNi dirsek BUNA TAKILMAZ (boru_sch/boru_mm ile ayni desen). nps "2-1/2".
          ad: 'dirsek_sch', kategori: 'fitting', spesifiklik: 10,
          tetikleyici_regex: 'Dirsek.*"\\s*Sch',
          pattern: '^\\d+(\\d)(.+?)([\\d/-]+)"\\s*Sch\\s*(\\d+S?)\\s*([\\d.]+)\\s*(AISI\\s*316L|316L|ST\\d{2})(\\d+\\.\\d+)$',
          grup_haritasi: { adet: 1, tanim: 2, nps_inc: 3, schedule_kod: 4, boy_mm: 5, kalite: 6, agirlik_kg: 7 }
        },
        {
          // + 123 (MK-123.C): EMPERYAL reduksiyon (cift olcu "2\" x 1-1/4\""). Onceden
          // tetikleyicisi yoktu -> SESSIZCE dusuyordu. nps_inc=buyuk, nps_kucuk=kucuk uc.
          ad: 'reduksiyon_sch', kategori: 'fitting', spesifiklik: 10,
          tetikleyici_regex: 'Red.k.*"\\s*Sch',
          pattern: '^\\d+(\\d)(.+?)(\\d+)"\\s*x\\s*([\\d/-]+)"\\s*Sch\\s*([\\d.]+)\\s*(AISI\\s*316L|316L|ST\\d{2})(\\d+\\.\\d+)$',
          grup_haritasi: { adet: 1, tanim: 2, nps_inc: 3, nps_kucuk: 4, boy_mm: 5, kalite: 6, agirlik_kg: 7 }
        }
      ]
    }
  }
};

// ---- Katman 1: MONTAJ ailesi (Cadmatic-Tersan montaj/izometri) — + 120 -----
// A1 ile AYNI yapısal aile (Cadmatic-Tersan) ama FARKLI çizim tipi:
//   • imalat/spool (A1): "Malzeme Listesi" + parça satırları VAR.
//   • montaj/izometri (bu): malzeme listesi YOK; boru-seviyesi topoloji VAR
//     (çoklu spool + "Continue:" bağlantıları, sistem sınırı aşan). montaj_modu.
// 39a2c81b (tersan_cadmatic_montaj) DB parser_kural'ından paket şekline taşındı.
// 7 gerçek montaj PDF'inde (6 gemi) doğrulandı (oturum 120). Spool'a (A1) DOKUNULMADI.
//
// + 120 FIX (NB1137 pipeline_no kırılması — son-durum açık borç):
//   Eski pipe_no regex'i `\[\[PIPE:...\]\]` markerını arıyordu; o markerı ÜRETEN
//   kod hiç yoktu → cikarilan.pipe_no HEP null → `-ALS` alıştırma (PARCA) sinyali ölü.
//   Düzeltme: gerçek SPOOL NAME satırı; Bölüm 5.1 önek düzeltmesi [A-Z]{1,3}\d{2,3};
//   sheet eki (' 1(4)') yakalama dışı. 5/5 temiz montajda pipe_no doldu, M100 → PARCA.
//   (NB1137'nin 2 montajı Cadmatic glyph -29 kaymalı → L3; ayrı borç, MK-119.3.)
export const MONTAJ_TERSAN = {
  id: 'montaj_tersan_cadmatic',
  katman: 1,
  seselici: {
    // Montaj yapısal imzası: Continue: + SPOOL NAME, "Malzeme Listesi" YOK (A1'den ayıran).
    yapisal_token: ['SPOOL NAME', 'Continue:', 'Total Weight']
  },
  parser_kural_parcasi: {
    ekstraktor_tipi: 'regex_text',
    min_metin_uzunlugu: 100,
    montaj_modu: true,
    spool_listesi_alan: 'spool_listesi',
    kabul_kriterleri: { min_spool: 1, l3_fallback_yapilir: true },
    alanlar: {
      blok:    { tip: 'string', grup: 1, regex: '\\n(B\\d{3,})\\n' },
      tarih:   { tip: 'string', grup: 1, regex: '\\n(\\d{2}-\\d{2}-\\d{2})\\n' },
      yuzey:   { tip: 'string', grup: 1, regex: '\\n(Galvaniz|Paslanmaz|CUNIFE|Siyah|Asit|Boyal\\w*)\\n' },
      sistem:  { tip: 'string', grup: 1, regex: '\\n(\\d+-[^\\n]*System[^\\n]*?)\\s*-?\\n' },
      // + 120 FIX: gerçek SPOOL NAME satırı (eski [[PIPE:]] markerı DEĞİL).
      pipe_no: { tip: 'string', grup: 1, regex: '\\n([A-Z]{1,3}\\d{2,3}-\\d+-[\\dA-Z]+(?:-[A-Z\\d]+)*)(?: +\\d+\\(\\d+\\)?)?\\n' },
      agirlik_kg: { tip: 'float', grup: 1, regex: '\\n(\\d+(?:\\.\\d+)?)\\s*kg\\n' }
    },
    liste_alanlar: {
      guverte:           { grup: 1, regex: '\\n([A-Z][A-Z .]*DECK[^\\n]*)' },
      spool_listesi:     { grup: 1, regex: '(?<=\\n)(S\\d{2,})(?=\\n)' },
      continue_baglanti: { grup: 1, regex: 'Continue:\\s*([^\\n]+)' }
    },
    montaj_alistirma_kurali: {
      not_regex: 'Alistirma Parcasidir',
      bagli_deger: 'BAGLI',
      parca_deger: 'PARCA',
      continue_alan: 'continue_baglanti',
      parca_kelimeler: ['-ALS\\b']
    }
  }
};

// Pilot paket kataloğu (Aşama 2/3'te DB'ye taşınır; şimdilik kod tarafı).
// + 120: ÇOK-AİLE envanteri artık (spool A1 + montaj). DİKKAT: tek-aile composability
// için bu havuzu doğrudan paketSec'e verme — aileler Katman 1'de karışır. Aile-özgü iş
// için AILE_KAYIT[format_kodu] kullan (aileBirlestir zaten öyle yapar).
export const TUM_PAKETLER = [EVRENSEL, A1_TERSAN_CADMATIC, MALZEME_KARBON, MALZEME_PASLANMAZ, MONTAJ_TERSAN];

// ---- Aile kaydı (registry): format_kodu → katman paketleri -----------------
// parserKuralIle bunu sorar: format katalog-yönetimliyse paketlerden ETKİN KURAL
// üretilir; değilse DB parser_kural'ı AYNEN kullanılır. Yeni aile eklemek =
// buraya bir satır (izometri-oku.js'e dokunmadan). Özel-durum (if format_id) YOK.
//
// DOĞRULANMIŞ aileler:
//   tersan_cadmatic_spool (e1fb879d) — 119'da composability + 6/8 gerçek PDF ile kanıtlandı.
//   tersan_cadmatic_montaj (39a2c81b) — 120'de 7 gerçek montaj PDF (6 gemi) ile kanıtlandı;
//     yapısal olarak FARKLI aile (montaj_modu, malzeme tablosuz) → MK-119.1'in güçlü kanıtı.
// ASLA bağlanmaz:
//   tersan_cadmatic_isometry (84c12f61) — ölü/yinelenmiş satır: fingerprint'i SPOOL imzası
//     ister ("Malzeme Listesi"+"Cut & Bending") ama montaj PDF'inde ikisi de YOK → hiç eşleşmez;
//     parser_kural'ı da spool kuralının kopyası. 120'de aktif=false ile emekliye ayrıldı.
//   paor_aveva_* — image-PDF (E ailesi), L3.
//
// ⚠ SOURCE-OF-TRUTH NOTU (MK-119.2): Bir format buraya bağlandığında, parse kuralının
// KAYNAĞI kod paketleridir; DB satırı yalnız TANIMA (fingerprint) için kalır. Yani
// bağlı bir format için DB'deki parser_kural'ı elle değiştirmek parse'ı ETKİLEMEZ.
// (Aşama 3'te paketler DB'ye taşınınca bu ikilik tamamen kalkar — tek kaynak DB olur.)
export const AILE_KAYIT = {
  tersan_cadmatic_spool: [EVRENSEL, A1_TERSAN_CADMATIC, MALZEME_KARBON, MALZEME_PASLANMAZ],
  // + 120: ikinci aile — yapısal olarak FARKLI (montaj_modu, malzeme tablosuz).
  tersan_cadmatic_montaj: [EVRENSEL, MONTAJ_TERSAN],
};

export default {
  EVRENSEL, A1_TERSAN_CADMATIC, MALZEME_KARBON, MALZEME_PASLANMAZ, MONTAJ_TERSAN, TUM_PAKETLER, AILE_KAYIT
};
