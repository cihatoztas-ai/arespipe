# Parser ve Yükleme Akışı — Mimari Referans Belgesi

> **AresPipe · Parser + Yükleme Katmanları · Tek Referans · 28 Mayıs 2026 (Oturum 130-131-132)**
>
> **Sahip:** Cihat + Claude
> **Tazelik penceresi:** Parser/eşleştirme kodu değiştikçe güncellenir; en geç 3 oturum sonra
> (oturum 135) doğrulanır. Çapraz doğrulama katmanı kodlanınca Bölüm 4 yeniden yazılır.
>
> **⚠ 132 DÜZELTMESİ (en güncel — önce bunu oku):** Bölüm 7.3 + Bölüm 8 K4 mührünün "glyph band-B
> boşluğu → AT110/E100 L3'e düşüyor" tezi **gerçek PDF'lerle uçtan uca çürütüldü.** Parse yolağı
> sağlam: `metinNormalle` band-A **VE** band-B onarır (122'den), tanıma onarılmış metni skorlar,
> dispatch L2'ye girer, kaymış montaj `montaj{}` üretir. **Yapacak glyph işi yok.** Tam kanıt: yeni
> **Bölüm 7.4**. 131'in tezi (7.3) ve Bölüm 8 K4 132-mührü **İPTAL** — 7.4 kazanır.
>
> **131 güncellemesi (artık geçersiz — 7.4 ile değişti):** Bölüm 7.3 eklenmişti (recognition glyph kök
> sebebi); sebep yanlış atfedilmişti (bayat kod yorumu + canlı yolak koşulmadı). Bkz. Bölüm 7.4.
>
> **Bu belge ne:** Klasör yüklemeden spool kabuğuna, oradan PDF içerik sömürmeye ve çapraz
> doğrulamaya kadar olan tüm akışın **tek ve birebir kod doğrulamalı** referansıdır. Oturum 130-140
> arası paylaşılan zemin. Omurga (`DEVRE-WIZARD-OMURGA.md` v3.1) *kararları* tutar; bu belge o
> kararların **canlı koddaki karşılığını** ve **eksik kalan katmanı** anlatır.
>
> **Çelişki çıkarsa:** Mimari karar için omurga kazanır; kodun *ne yaptığı* için bu belge + kod kazanır.
>
> **Kaynaklar (birebir okundu, oturum 130):** `lib/excel-parser.js`, `api/izometri-oku.js`,
> `api/kuyruk-isle-izometri.js`, `ares-kabuk.js`, `ares-normalize.js`, `devre_wizard.html` (v2),
> `DEVRE-WIZARD-OMURGA.md` (v3.1). MK atıfları omurga Bölüm 17 + satır-içi kod yorumları +
> oturum 129 devir dosyalarından; bu oturumda yüklenen `KARARLAR.md` bayat (MK-74.3'te kalmış),
> kullanılmadı.

---

## 0. Akışın kuşbakışı — beş katman

Klasör yüklenir; sistem önce **güvenlik kabuğunu** Excel'den kurar, sonra dosyalarda ne varsa
**katman katman sömürür**, her katmanı kabuğa karşı **çapraz doğrular**, çelişkiyi operatöre gösterir.

| Katman | Ne yapar | Durum |
|---|---|---|
| **0 — Güvenlik** | Excel kabuk zorunlu; yoksa İncele kapalı (MK-125.3) | ✅ Var |
| **1 — Kabuk türetme** | Excel BOM → spool listesi (`ARES_KABUK.grupla`) | ✅ Var |
| **2 — PDF içerik sömürme** | İzometri PDF → L1/L2/L3, format tanıma, halüsinasyon koruması | ✅ Var (L3 oto-karar kısmen) |
| **3 — Çapraz doğrulama** | PDF içeriği × Excel kabuk uyumsuzluk yakalama | ⚠️ **Büyük kısmı EKSİK** |
| **4 — Operatör onayı** | Çelişki → "Düzelt" akışı; eksik/fazla → uyarı | ⚠️ Kısmi (İnceleme ekranı v3'te) |

**Oturum 129 keşfi (bu belgenin doğum sebebi):** Cihat bir POAR PDF'i kopyalayıp yeni isimle yükledi.
Sistem parse etti, kabul etti, **hiçbir uyumsuzluk uyarısı vermedi.** Çünkü Katman 3'ün üç ayağından
ikisi hiç yok: PDF içeriğindeki pipeline dosya adıyla doğrulanmıyor, POAR'daki malzeme listesi Excel
BOM ile karşılaştırılmıyor. Bu, omurganın *"katman katman sömürüp uyumsuzlukları uyaracaktık"* sözünün
yapılmamış kısmı. Detay: Bölüm 4.

---

## 1. Klasör yükleme akışı (Katman 0-1 girişi)

**Kaynak:** `devre_wizard.html` (v2 — kanonik yükleme akışı). v3 (`devre_wizard_v3.html`) İnceleme &
Onay ekranını ekler ama yükleme/auto-detect mantığını **çağırır, kopyalamaz** (MK-127.2, KORUMA-1).

### 1.1 Giriş yolları

```
Sürükle-bırak (dropHandler)           → entryTraverse(entry, path)  → {file, klasor_yolu}
Klasör seç (folderInput webkitdirectory) → fileInputHandler(files, isFolder) → {file, klasor_yolu}
                                       ↓
                              dosyalariEkle(dosyalar)
```

`entryTraverse` klasör ağacını rekürsif gezer, `klasor_yolu`'nu korur (KARAR-97.6 — Windows-gezgini
görünümü için). `webkitRelativePath` klasör yolunu verir.

### 1.2 `dosyalariEkle` — filtre + dedup + sınıflandırma

Her dosya için sırayla:

1. **Gizli/sistem dosya filtresi** (`gizliDosyaMi`) — `.DS_Store`, `Thumbs.db`, hidden (MK-99.4 / MK-50.4).
2. **Dedup** — `dosya_adi + klasor_yolu + boyut` zaten listede mi? Aynı klasörü iki kez bırakmak
   yaygın; çift BOM parse tetiğini (A1) önler.
3. **Tip tespiti** (`autoDetect`) → `tip_kodu`.
4. **Parser yönlendirme** (`parserBul`) → `parser_yolu`.
5. Listeye: `{file, klasor_yolu, dosya_adi, uzanti, tip_kodu, parser_yolu, boyut, durum:'bekliyor'}`.

### 1.3 `autoDetect` — dört katmanlı sınıflandırma (sıralı, ilk tutan kazanır)

```
1) Klasör adı sözlüğü  → klasor_isim_sozluk (tam eşleşme, son klasör adı)   ← açık sinyal, hepsini yener
2) Excel ad-katmanı    → uzantı xls/xlsx/xlsm ise: excelBomMu(ad) ? 'bom_excel' : 'diger'
3) Uzantı              → dokuman_tipleri.uzanti eşleşmesi → tip_kodu
4) Varsayılan          → 'diger'
```

**Neden Excel'e özel katman (2):** Uzantı `.xlsx/.xlsm` BOM mu kontrol formu mu ayırt edemez. Tek
ayırt edici **dosya adı**. `excelBomMu` muhafazakâr çalışır:
- Çok kelimeli kalıplar (substring): `malzeme listesi`, `material list`, `material take`, `take off`,
  `spool listesi`, `parts list`, `bill of material`, ...
- Kısa token (kelime sınırı): `bom`, `mto`, `mtl`
- Emin değilse → `diger`. Gerekçe: yanlış oto-BOM, parse + spool zincirini boşa tetikler (daha kötü);
  kullanıcı dropdown'dan elle `bom_excel`'e çevirebilir.

### 1.4 `parserBul` — parser yönlendirme

| `tip_kodu` | `parser_yolu` | Kuyruk + tetik |
|---|---|---|
| `bom_excel` | `excel-generic` | excel kuyruğa `bekliyor` + worker tetiklenir (oto-parse, 103-A) |
| `izometri` | (dokuman_tipleri'nden) | izometri kuyruğa `bekliyor` + `/api/kuyruk-isle-izometri` (MK-49.B, 107) |
| diğer | `sakla` | parse yok; arşivlenir (sertifika, şartname vb.) |

`bom_excel` her uzantıda (xlsm dahil — seed'de xlsm yoktur) `excel-generic`'e gider. Bilinmeyen
tip/uzantı → `sakla`.

---

## 2. Katman 0-1 — Güvenlik kabuğu + spool türetme

### 2.1 Excel kabuk zorunlu (Katman 0, MK-125.3)

Kabuk **otoritedir, PDF değil** (omurga Bölüm 3). Klasördeki PDF'ler eksik/fazla/bozuk olabilir;
devrenin spool listesi önce resmi kaynaktan (Excel BOM) kurulur, dökümanlar bu kabuğa karşı çetelenir.
Excel yoksa kabuk kurulamaz → "Devam Et" kapalı; kullanıcı boş şablonu (K2, MK-WIZARD.1) indirip
doldurur. Eski "PDF'ten kabuk çıkar" (K3) düşürüldü.

### 2.2 Excel parse — `lib/excel-parser.js`

**Sözlük + word-boundary substring + özet satır filtresi.** Üç kademe:

**Normalize:** `toLowerCase → NFD → diacritics sök (üöçşğı→uocsgi) → noktalama boşluğa → trim`.

**Alan eşleştirme (`alanBul`):** `SOZLUK` (kanonik alan → eş anlamlılar) word-boundary substring ile
aranır; **en uzun eşleşme kazanır** (çakışma çözümü). Kanonik alanlar: `dn, cap_mm, malzeme, kalite,
et_mm, schedule, uzunluk_mm, adet, agirlik_kg, yuzey, parca_tipi, tanim, standart, pozisyon,
pipeline_no, spool_no, ifs_kod, birim, system, revizyon`.

**L1 — başlık tespiti (`tespitL1`):** İlk ~7 satır taranır; her satırda kaç kanonik alan eşleşiyor?
En çok eşleşen başlık satırı. **< 3 eşleşme → L1 başarısız.** Güven: `min(95, 40 + eşleşme×15)`
(3→55%, 4→70%, 5→85%, 6+→95%).

**L2 — pattern fallback (`tespitL2`):** Başlık sözlük dışıysa, sayısal/metin yoğunluğuyla ilk veri
satırı bulunur. Güven 25, `manuel_onay_gerekli`. Satır çıkarılmaz (sadece sinyal).

**Özet satır filtresi (`ozetSatiriMi`):** `total / cog / center of gravity / sum / toplam` içeren
veya `=` ile başlayan (formül) satırlar atılır; `spool_no` tamamen sayıya dönüşüyorsa (CADMATIC formül
sonucu) atılır.

**Sayfa seçimi (`sayfaSec`):** İsim önceliği `all → import → malzeme → bom → spool`; yoksa en yüksek
`güven × log(satır+1)`.

**Çıktı sözleşmesi:**
```js
{
  sayfa_sayisi, sayfalar:[...], secilen, basari, seviye:'L1'|'L2'|'fail', guven,
  satirlar:[ { dn, malzeme, kalite, et_mm, uzunluk_mm, adet, agirlik_kg, yuzey,
               tanim, standart, pipeline_no, spool_no, ifs_kod, system, rev, _satir_no } ],
  otomatik_insert_uygun: (seviye==='L1' && guven>=70),   // sert sınır
  manuel_onay_gerekli:   !(...)
}
```

### 2.3 Kabuk modeli — `ares-kabuk.js` (`grupla` → `aktar`)

`ARES_KABUK.grupla(parse_sonuc)` Excel satırlarını gruplu spool modeline çevirir:
- **Gruplama anahtarı:** `pipeline_no | spool_no | rev` (devre içi tekil).
- **Tip belirleme:** tanımda `pipe/tube/boru` → `boru`, değilse `fitting`.
- **Konsolidasyon:** aynı `tanim|malzeme|dn|tip` kalemleri toplanır (boru→boy_mm, fitting→adet).
- **spool_no'suz satır (Karar 2):** pipeline'da tek spool varsa ona bağlanır, çoksa `atanmamis`.
- Her spool: `{pipeline, spoolNo, rev, anaMalzeme, toplamKg, yuzeyHam, bom:[...]}`.

`ARES_KABUK.aktar(opts)` terfide spooller + spool_malzemeleri INSERT eder (idempotent — kabuk kilidi
MK-WIZARD.3): devrede mevcut `(pipeline_no, spool_no, rev)` tekrar yazılmaz. Spool ID `terfide`
üretilir (`ARES.sonrakiNo('spool')`), `tkod-no` formatlı. Boyut `ARES_OLCU.olcuParse` ile (MK-110.3 —
fakir DN tablosu kaldırıldı). Yeni spool varsayılanı: `durum='Bekliyor', cizim_durumu='bekliyor', ilerleme=0`.

---

## 3. Katman 2 — PDF içerik sömürme (izometri)

**Kaynak:** `api/izometri-oku.js` (MK-49.1: **bu dosyaya dokunulmaz**). Çağrı: `api/kuyruk-isle-izometri.js`
client-loop drenajından (`ARES_IZO_DRENAJ`, 113/A) — server→server yok, Vercel 508 çözülmüş.

### 3.1 Yapısal güvenlik (Anthropic kredisi yanmadan)

Sırayla erken-dönüş: uzantı `.pdf` (case-insensitive) → boyut ≤ 7MB base64 (~5MB PDF) → magic byte
ilk 4 bayt `%PDF`. Geçemezse 400, AI çağrılmaz.

### 3.2 Format tanıma (`formatTani` + `fingerprintSkor`)

`izometri_format_tanimlari`'ndan tenant-scope + global formatlar çekilir, **fingerprint skoru** ile
eşlenir. `pdfIpucuCikar` (pdf-parse) ile Producer + Creator + ilk 5K karakter metin çıkarılır
(glyph band-A **+ band-B** onarımı kapılı — MK-120.3 + 122, kaymalı Cadmatic export'larında çapaları
açar; `metinNormalle` band-B'yi de yapar — bkz. Bölüm 7.4).

**4 sinyal:**

| Sinyal | Puan | Kaynak |
|---|---|---|
| `dosya_adi_regex` tutar | **+5** (tie-breaker, MK-51.x) | dosya adı |
| `pdf_uretici_anahtar` (array, OR) | +1 | Producer/Creator |
| `baslik_regex` | +1 | ilk sayfa metni |
| `tablo_baslik_regex` | +1 | ilk sayfa metni |

**Eşik = 2**; eşiği geçenler arasında **en yüksek skor kazanır** (aynı tersanenin iki PDF tipi ortak
sinyal paylaşır, `dosya_adi_regex` ayırıcıdır). Format bulunamazsa → `requires_ai:true`, L3'e düşer.

### 3.3 Parser seçimi (handler akışı)

```
formatTani → format_id?
  ├─ CACHE HIT (pdf_sha256 + format_id daha önce başarıyla parse edilmiş) → eski cevap, $0, ~0.5sn
  ├─ format_id VAR + parser_kural DOLU → L1/L2 (parserKuralIle → lib/l2-parser.js, deterministik 1-2ms)
  │     └─ L2 fail (parser_seviye='l2_failed') → L3 fallback (visionAIParse), _l2_fallback meta
  └─ format YOK / parser_kural BOŞ → L3 (visionAIParse, Yaklaşım Y)
```

L2 başarısı `ai_api_log`'a `L2_deterministic` olarak yazılır (token/maliyet 0, görünürlük metriği).

### 3.4 L3 — Vision AI (Yaklaşım Y) + halüsinasyon koruması

Model: `claude-sonnet-4-5` (env override). `YAKLASIM_Y_PROMPT` kritik kuralları (Cihat'ın 36'daki
halüsinasyon dersinden):
1. **Sadece PDF'te yazılı değeri çıkar; yoksa `null`.** Et yoksa `et_mm=null, et_kaynagi='pdf_yok'`;
   hesap kod tarafında (`boru_olculer` ASME tablosu).
2. **Pipeline dosya adıyla uyuşmalı.** PDF'teki pipeline dosya adından tamamen farklıysa →
   `pipeline_no=null, uyari_dosya_adi=true`. *(Not: bu LLM'e verilen bir talimat; deterministik
   doğrulama Katman 3'te olmalı — bkz. Bölüm 4.)*
3. **Spool sayısını doğru say** (`[1][2]` = 2 spool; `<1><2>` PIPE CUT-LENGTHS = kesim parçası, spool değil).
4. **`FABRICATION MATERIAL LIST` al, `ERECTION MATERIAL LIST` (bolt/nut/gasket) tamamen atla.**
5. Yüzey: `GALVANIZATION:YES→Galvaniz`, `PAINT→Boyalı`, `ACID/PICKLE→Asit`, belirtilmemiş→`null`.
6. Her spool için **güven skoru** (0.0-1.0), dürüstçe.

Format ipucu: `tespit_edilen_format_ipucu: "AVEVA-PAOR" | "Smart 3D" | null`.

**Deterministik halüsinasyon filtresi (kod-tarafı, AI'a güvenmez):**
- **Yabancı kök alan** tespiti (`BEKLENEN_KOK_ALANLAR = [spoollar, tespit_edilen_format_ipucu, genel_notlar]`).
- `SUSPICIOUS_KEYWORDS` tarama (cevap metninde).
- `halusinasyonFiltresi`: DN↔çap tutarlılığı (`boru_olculer`), et tolerans sınırı, → kritik/orta uyarı;
  `kritik || orta≥2` ise `durum='manuel_onay'`, değilse `'hazir'`.

### 3.5 Montaj dalı (MK-115.1)

`parse_sonuc.montaj` varsa: montaj çizimi **boru-seviyesi topoloji** taşır (spool listesi + continue +
alıştırma), malzeme/spool detayı YOK. ASME doldurma / halüsinasyon filtresi / spool-hattı atlanır.
`spooller` tablosuna **dokunmaz** (eşleşme ayrı adım — Bölüm 3.6 montaj yolu).

### 3.6 L3 maliyet kontrolü (devre bazlı, MK-120.6)

Üç durumlu: **otomatik / onaylı / kapalı**. **PAOR örneği:** taranmış izometri (L2 metin çıkaramaz,
L3 pahalı) AMA devrenin Excel'i spool+malzemeyi zaten veriyor → izometriden veri çıkarmaya gerek yok,
sadece görsel `'sakla'`; L3 kapalı → $0 (MK-125.2). **İstisna:** format yeni + L3 kapalı → sistem
zorlar (MK-125.1). *Açık: resim-PDF tespitinde otomatik L3 kararı (Bölüm 4.4).*

---

## 4. Katman 3 — Çapraz doğrulama (EKSİK katman, 130'un kalbi)

**Kaynak:** `api/kuyruk-isle-izometri.js` — `eslestir`, `montajEslestir`, `bindir` (lib/bindir.js),
primitifler (`normPipeline/normSpoolNo/dosyaAdiParse/montajDosyaKok`).

### 4.1 Eşleştirme — anahtar mekaniği (var olan)

**Anahtar = `normPipeline(pipeline_no) | normSpoolNo(spool_no)`**, devre içinde. `norm*` = `trim().toUpperCase()`.

> **Kritik:** `MK-110.1` ilk hali "devre + spool_no" idi ve YANLIŞTI — bir devrede aynı `spool_no`
> (örn. S01) onlarca pipeline'da tekrar eder (canlı: S01 → 26 pipeline). Doğru tekil anahtar
> `(devre_id, pipeline_no, spool_no)`.

**`PIPELINE KAYNAĞI = DOSYA ADI`** (kod satır 458). `parse_sonuc.spoollar[].pipeline_no` NULL gelir;
pipeline `dosyaAdiParse(dosya_adi)`'dan çıkar:

```
dosyaAdiParse:  /^(.+?)(?:\s+\d+\(\d+\))?\.(S\d+(?:_\d+)?)\.\d+\.pdf$/i
   "M100-317-30-ALS 1(2).S01.1.pdf"   → {pipeline_no:'M100-317-30-ALS', spool_no:'S01'}
   "M100-317-55-ALS 1(2).S01_1.1.pdf" → {pipeline_no:'M100-317-55-ALS', spool_no:'S01_1'}

montajDosyaKok: /^(.+?)(?:\s+\d+\(\d+\))?[._]\d+\.pdf$/i   (montaj pipeline_no taşımaz)
```

Regex **formata özgü** (Tersan/M100). Tutmazsa `null`.

**A+B mantığı (yanlış eşleşmektense eşleşmesin — 110 dersi):**
- Regex tutar + pipeline kabukta var → eşleştir (A).
- Regex tutmaz → `atanmamis`, sebep `dosya_adi_pipeline_yok`.
- spool yok → `spool_no_yok`. Pipeline+spool kabukta yok → `kabukta_yok`.

### 4.2 Bindirme — `bindir(ps, hedef)` (var olan, dar)

Eşleşen spool için PDF verisi kabuk spool'a bindirilir: **et / çap / ağırlık / yüzey, %3 tolerans.**
Döner: `{degisiklik, bindirme:[{kabuk, pdf, secilen, flag, sebep}], flagVar}`. `flagVar` = `bindirme_flag`
= çelişki var mı.

Sonrasında (tek UPDATE'te birleşir):
- **`cizim_durumu`:** yalnız `bekliyor → kismi` (filtreli, yarış-güvenli); `tam/kismi` → DOKUNMA (MK-WIZARD.3).
- **Alıştırma (117):** dosya adında `ALS` → `'VAR'`; değilse parse `alistirma_ipucu`. PDF bir değer
  ürettiyse yazar, sessizse dokunmaz (KARAR-116.1).
- **İmalat NOT (117):** `not_metni` → `spooller.imalat_not`, ama alıştırma tam `VAR` ise yazmaz (tekrar).
- **İmalat bağı:** `devre_dokumanlari.spool_id = hedef.id` (1:1, idempotent).
- **Montaj bağı:** `montajEslestir` → eşleşen her spool'a `spooller.montaj_json`; `spool_id` YAZILMAZ
  (1-çok tek kolona sığmaz).

Her iki yol özeti `dosya_isleme_kuyrugu.parse_sonuc._eslesme`'ye:
```
{ tip?, toplam, eslesen, atanmamis, yukseltilen, bindirme_flag_sayisi,
  detay:[ {spool_no, pipeline_no, durum:'eslesti'|'atanmamis', sebep?, bindirme?, bindirme_flag?} ] }
```

### 4.3 EKSİK olan üç ayak (omurganın yapılmamış sözü)

| # | Sözü verilen | Bugünkü gerçek | Sonuç |
|---|---|---|---|
| **a** | PDF içeriğindeki pipeline, dosya adıyla **doğrulanmalı** | Pipeline **yalnız** dosya adından; PDF içeriği hiç kıyaslanmıyor | Yanlış adlandırma → **sessiz yanlış bağ** (Cihat'ın tetikçi testi) |
| **b** | POAR BOM **×** Excel BOM malzeme listesi **karşılaştırılmalı** | `bindir` yalnız et/çap/ağırlık/yüzey; **malzeme listesi kıyası YOK** | Excel ile PDF malzeme uyumsuzluğu görünmez |
| **c** | Çelişki **operatöre gösterilmeli** | `bindirme_flag` ham hâlde DB'ye yazılıyor, **UI'da görünmüyor** | Çelişki var ama kimse görmüyor |

> **Cihat'ın sözü (oturum 129):** *"klasör olarak yüklüyoruz, önce güvenlik için Excel kabuk çıkıyor,
> sonra katman katman dosyada ne varsa sömürüp elde edilebilecek tüm bilgileri sömürecektik,
> uyumsuzlukları uyaracaktık."* — (a) ve (b) hiç, (c) yarım. Bu A1 hatası değil; omurganın büyük adımı.

### 4.4 Tasarlanacak somut adımlar (belgeden çıkan, kod sonra)

1. **Pipeline doğrulama:** L3/L2 çıktısındaki PDF-içi pipeline metni (POAR header) `dosyaAdiParse`
   çıktısıyla kıyas; fark → 🟡 uyarı. (L3 prompt'taki "uyari_dosya_adi" sinyali zaten var ama
   text-PDF/L2'de deterministik kıyas yok — server-side eklenecek.)
2. **Malzeme listesi kıyası:** POAR `malzeme_listesi` × Excel BOM, satır bazlı diff (kategori + tanım
   + DN + malzeme normalize edip eşle; eksik/fazla/çelişki). Yeni mantık, mevcut hiçbir yere FK kurmaz.
3. **`bindirme_flag` UI gösterimi:** Spool tablosunda "çelişki var" rozeti + detay popup (`bindirme[]`
   alan-bazlı: kabuk vs pdf vs seçilen). İnceleme ekranı 🟡 sinyali bunu kullanır (MK-127.5).
4. **L3 otomatik karar:** Resim-PDF tespitinde (L2 metin çıkaramıyor + Excel yok) otomatik L3 tetik;
   operatör onaylar (MK-125.1 mekaniği). MK-49.1 korunur (`izometri-oku.js`'e dokunulmaz; karar
   çağıran tarafta).

> **İzolasyon (MK-127.3/4):** Çapraz doğrulama okuma katmanı = server-side endpoint
> (`/api/devre-inceleme` ailesi), kanonik eşleştirme primitiflerini **çağırır**, client'a port edilmez
> (drift riski). Taslakta spool yok → kabuk önizleme satırlarıyla eşler, `spooller`'a yazmaz; kanonik
> bağ terfide. **Function tavanı (MK-129.3): `api/*.js` = 12/12 (Hobby). Yeni endpoint = tavan aşımı
> → konsolidasyon veya Pro şart.** Yeni `api/*` yazmadan önce envanter zorunlu (MK-129.2, MK-126.8).

> **133 GÜNCELLEMESİ — adım 2 yapıldı (K2 v1 canlı):** Malzeme listesi kıyası `lib/malzeme-kiyas.js`
> olarak yazıldı (saf fonksiyon, evrensel katman, FK kurmaz), `api/kuyruk-isle-izometri.js` `eslestir`
> içine `bindir`'in yanına bağlandı — `spool_malzemeleri` batch-fetch + tek çağrı, çıktı
> `_eslesme.detay[].malzeme_kiyas` + `malzeme_flag`. Yeni endpoint **yok** (12/12 korundu). Tam detay
> ve canlı doğrulama: **Bölüm 7.5**. Mühürler: **MK-133.1 / .2 / .3** (Bölüm 9). Adım 1 (pipeline
> doğrulama) ve adım 3 (UI 🟡) hâlâ açık borç; 134 gündemi.

---

## 5. Katman 4 — Operatör onayı (İnceleme & Onay, v3)

Dört durum (MK-127.5, omurga Bölüm 11):

| Durum | Renk | Anlam | Davranış |
|---|---|---|---|
| Eşleşen + okundu | 🟢 | ≥1 izometri eşleşti, `bindirme_flag` yok | tamam |
| Eşleşen, parse zayıf | 🟡 | `bindirme_flag` çelişki VEYA L3 + güven<eşik | "doğrulanmadı" → Düzelt |
| Eksik | 🔴 | kabukta var, eşleşen izometri yok | spool silinmez (MK-WIZARD.2) |
| Fazla | 🟠 | izometri anahtar üretti, kabuğa eşleşmedi | sessizce eklenmez — SORAR |

Onay = taslağın canlıya **terfisi** (MK-126.2 uyarı modeli — kapı değil). Terfi sonrası kanonik
eşleştirme `eslestir`'i tekrar çağırır (oturum 129 entegrasyonu: `eslestirme-backfill`, MK-127.4/129.4).

---

## 6. Kayıt şeması

### 6.1 Tablolar (migration 080)

| Tablo | Ne tutar | Bu akıştaki rolü |
|---|---|---|
| `devre_dokumanlari` | devre seviyesi ham dosya + `spool_id` (1:1 imalat bağı) + `parse_durumu` + `yukleyen_id` | Yükleme + eşleşme hedefi |
| `dosya_isleme_kuyrugu` | async parse kuyruğu: `parser`, `durum`, `parse_sonuc` (JSONB), `devre_dokuman_id` (FK — `devre_id` kolonu YOK) | Parse + `_eslesme` özeti |
| `dokuman_tipleri` | uzantı → parser yolu | `autoDetect`/`parserBul` seed |
| `klasor_isim_sozluk` | klasör adı → tip | `autoDetect` 1. katman |
| `spool_dokumanlari` | N:N hedef mimari (sayfa aralık) | **henüz bağlanmadı** (KARAR-97.7) |
| `izometri_format_tanimlari` | fingerprint + `parser_kural` + `prompt_template` | Format tanıma |

### 6.2 `spooller.cizim_durumu` state machine

```
bekliyor ──(izometri eşleşti, eslestir)──▶ kismi ──(tüm dökümanlar tam?)──▶ tam
```

- `bekliyor → kismi`: filtreli UPDATE (`.eq('cizim_durumu','bekliyor')`), yarış-güvenli + idempotent.
- `tam/kismi`: tekrar eşleşmede DOKUNULMAZ (MK-WIZARD.3 kabuk kilidi).
- Üretim durumundan ayrı eksen (MK-108.3) — `cizim_durumu` veri-olgunluk, `is_durumu` üretim.

### 6.3 `parse_sonuc` JSONB iskeleti

```js
{
  spoollar: [ { pipeline_no:null, spool_no, dn, cap_mm, et_mm, et_kaynagi, boy_mm, agirlik_kg,
                malzeme_en_kodu, malzeme_astm_kodu, kalite, yuzey, rev, guven_skoru,
                uyari_dosya_adi, malzeme_listesi:[...], alistirma_ipucu, not_metni } ],
  montaj?: { ... },                         // montaj dalı (topoloji, MK-115.1)
  tespit_edilen_format_ipucu, genel_notlar,
  dosya_adi,                                 // eşleştirmenin pipeline kaynağı
  _eslesme: { toplam, eslesen, atanmamis, yukseltilen, bindirme_flag_sayisi, detay:[...] },
  _l2_fallback?, _cache_meta?
}
```

---

## 7. Oturum 130 canlı teşhis — iki problem, kesin kök sebep

### 7.1 Tetikçi testi — "hiç okumadan kabul etti" iddiası

Cihat bir POAR PDF'i kopyalayıp mevcut bir izometri ismiyle yükledi (devre `7702313c`,
`AT110-816-026 1(2).S01.1.pdf`). **DB kanıtı: sistem körü körüne kabul ETMEDİ.** Format tanınmadı
(`format_ipucu:null`) → L3 okudu → `bindir` çelişkiyi yakaladı (`et 6.55/6.3`, `cap 141.3/219.1`,
`celiski_et_cap_farkli`, `bindirme_flag:true`, `flag_sayisi:1`) → kuyruk `manuel_onay`'a düştü
(diğer 7 spool `oneri_hazir`, bu tek başına). `bindir`'in çalıştığı bağımsız da görüldü
(devre `de0dbbdf` S04: `cap 114.3/76.1` flag'li).

**Ama gerçek bug üç katmanlı:**
- **(a)** Çelişkili eşleşme **yine de** `spool_id` yazdı + `cizim_durumu` `bekliyor→kismi` yükseldi.
  "Şüpheli ama bağlı, kısmi olgun" yalanı.
- **(b)** **Malzeme listesi kıyası yok.** `bindir` yalnız et/çap/ağırlık/yüzey. Sahte PDF'in boyutu
  tutsaydı (benzer boyutlu PDF) **hiç yakalanmazdı.** Tesadüfen boyut uymadığı için yakalandı.
- **(c)** `flag_sayisi:1` + `manuel_onay` DB'de duruyor ama **UI'da uyarı yok.**

### 7.2 Montaj PDF spool detayda yok — UI bug DEĞİL

`spool_detay.html` montaj okuma yolu (satır 1262) **doğru:** `montaj_json.kaynak_dosya`'yı okur,
`devre_id + dosya_adi` ile `devre_dokumanlari`'ndan PDF'i çeker. Sorun yukarıda — `montaj_json`
her spool'da **null**, çünkü montaj hiç **tanınmadı.**

**Kök sebep: montaj tespiti yalnız L2 yolunda var.** `lib/l2-parser.js` montaj_modu'nda
`{ ok, montaj:{} }` döner (izometri-oku 905-910); **L3'te montaj kavramı yok** —
`YAKLASIM_Y_PROMPT` sadece `spoollar` üretir. Bu devrede S-segmentsiz genel/montaj PDF'ler
(`...1(2).1.pdf`, `...2(2).1.pdf`, `...027.1.pdf`) format tanınmadığı için L3'e gitti → montaj
asla `parseSonuc.montaj` olmadı → `montajEslestir` çalışmadı → `montaj_json` null. **"Bazı
sayfalarda çıkıyor"** = format tanınan (L2 + montaj_modu) devrelerde çıkar; tanınmayan (L3)
devrelerde çıkmaz.

**İyi haber:** `montajEslestir` doğru kurulmuş — `montaj_json.kaynak_dosya` yazar, `spool_listesi`'ni
pipeline+spool ile eşleyip **1 montaj → N spool**'a aynı veriyi yazar (K4'ün "ilgili spool'ların
hepsinde görünsün" davranışı hazır). Eksik tek şey: montajın L3 yolunda da tanınması. Spool listesi
zaten içerikten (`m.spool_listesi`), ama pipeline yine dosya adından (`montajDosyaKok`) — K4'ün
"içi okunarak" isteğinin pipeline ayağı Katman 3 ayak-a ile aynı kök.

> **131 düzeltmesi:** Yukarıdaki "format tanınmadığı için L3'e gitti" tespiti doğru ama sebebi
> eksikti — montaj L2'de VAR ve AT110'u okuyor; PDF ona ulaşamıyor çünkü tanıma katmanı glyph-decode
> yüzünden düşüyor. Bkz. 7.3.

### 7.3 Recognition glyph boşluğu — AT110 neden L3'e düştü (oturum 131) ⛔ İPTAL (132)

> **⛔ BU BÖLÜM GEÇERSİZ — 132'de çürütüldü. Bölüm 7.4 kazanır.** Aşağıdaki tez ("band-B boşluğu →
> L3") yanlış: band-B zaten onarılıyor, E100 tanınıyor, dispatch L2'ye giriyor. 131 canlı yolağı hiç
> koşmadan bayat bir kod yorumuna (`izometri-oku.js:889`) + onarım-öncesi ham metne bakarak vardı.
> Tarihsel kayıt için bırakıldı; **eyleme dökme.**

**Bağlam:** 130 "montaj L3'e gitti çünkü format tanınmadı" dedi; doğru ama sebep eksik atfedildi.
131'de gerçek AT110 PDF'leri (montaj `AT110-803-2311-P2_1.pdf` + imalat `..._S01_1.pdf`) canlı kodla
çalıştırılarak kök sebep mühürlendi.

**Format zaten öğretilmiş:** `format-paketleri.js` iki Tersan ailesini taşıyor —
`tersan_cadmatic_spool` (e1fb879d, oturum 119, 6/8 PDF) + `tersan_cadmatic_montaj` (39a2c81b, oturum
120, 7 montaj PDF / 6 gemi). `l2-parser.js` `montaj_modu` çalışıyor. Montaj parser AT110 montajını
**plain metinde kusursuz okudu** (pipe_no, spool S01, yüzey, blok B1137, sistem, 8 kg — 6/6). Yani
parse değil, PDF'in parser'a **ulaşamaması** sorun.

**Kök sebep — tanıma:** Gerçek `pdf-parse` + gerçek fingerprint skorlamasıyla AT110 montaj+imalat
ikisi de: Producer=`Cadmatic` (+1), ama metin sinyalleri (`Continue:` / `Malzeme Listesi` /
`Cut & Bending Info`) pdf-parse çıktısında **bulunamadı** → skor **1 < eşik 2** → L3. `pdffonts`:
font **gömülü-değil ArialMT, Identity-H, ToUnicode YOK** (`uni: no`). Metin ham glyph-ID; pdftotext
standart Arial sırasıyla çözüyor, pdf-parse çözemeyip çöp veriyor (`pmlli`="SPOOL",
`` `çåíáåìÉW ``="Continue:").

**Linchpin:** Hem tanıma (`pdfIpucuCikar`, satır 634) hem L2 (`parserKuralIle`, satır 882)
**pdf-parse** kullanır — `-layout` değil. Yani metin modu değil, **decode** sorun.

**Deterministik kanıt:** çöp→doğru eşleme **38 giriş / 0 çatışma.** Band-A (A-Z + 0-9) tekdüze **+29**
(glyph-onar zaten yapıyor, MK-120.3). Band-B (a-z + Türkçe) **sabit lookup tablosu** (~20 giriş,
aritmetik değil ama birebir tutarlı); glyph-onar **yapmıyor** (izometri-oku/l2-parser satır 889:
"Band B onarmaz"). Boşluk tam burası.

**Fix:** `lib/glyph-onar.js`'e band-B tablosu (gated — temiz metinde no-op). Tek değişiklik tanıma +
montaj + kaymış spool malzeme tablosu (NB1137 borcu) üçünü birden açar. **izometri-oku.js'e
dokunulmaz** (MK-49.1 güvenli). ArialMT standart glyph sırası → gömülü-değil ArialMT Identity-H her
PDF'e genellenir.

**Alt-sınıf uyarısı:** Tersan tek format değil — **temiz** (pdf-parse okur) vs **glyph-kaymış**
(düşer) iki alt-sınıf. 119/120 temiz gemileri kanıtladı; AT110/NB1137 kaymış varyant. Bulk
doğrulaması gelen gemilerin alt-sınıf dağılımını ölçer (kaç kaymış → tablo hepsini tek seferde kapatır).

### 7.4 Recognition glyph — 132 DÜZELTMESİ (7.3 + Bölüm 8 K4 132-mührü İPTAL) ✅

**7.3 tezi gerçek PDF'lerle uçtan uca çürütüldü.** Dört gerçek PDF (E100-817-005 montaj+imalat
[kaymış], M100-317-18-ALS montaj+imalat [temiz]) güncel kodla (`glyph-onar.js`, `izometri-oku.js`,
`format-paketleri.js`, `katman-birlestirici.js`, `l2-parser.js`) + gerçek DB fingerprint'leri ile
container'da koşuldu. Sonuç: **parse yolağı sağlam, yapılacak glyph işi yok.**

**Kanıt zinciri (her adım canlı):**

1. **Çöp doğrulandı.** pdf-parse v1.1.1 kaymış E100'de gerçekten çöp üretiyor (`pmlli=k^jb`,
   `m~ëä~åã~ò`). pdftotext doğru. Gömülü-değil ArialMT Identity-H teyitli (`pdffonts`).

2. **`metinNormalle` band-B'yi onarıyor.** Çöpe uygulandı: `SPOOL NAME` / `Malzeme Listesi` /
   `Cut & Bending Info` / `Continue:` + malzeme satırları **tam kurtarıldı, 0 eşlenmeyen.** Band-B
   tablosu 122'de eklenmiş ve çalışıyor. **"band-B boşluğu" yok.** (Tek kozmetik kayma: `Açıklama`
   başlığı `Aoıklama` — ç-çakışması, MK-122'de kabul, veri/çapa değil.)

3. **Bayat yorum = 131'in hatasının kökü.** `izometri-oku.js:887-890` "Band B onarmaz" diyor; ama
   altındaki `metinNormalle(hamText)` band-A **VE** band-B yapar. Yorum 121'den kalma (band-B 122'de
   eklendi, yorum güncellenmedi). 131 bu satırı okuyup teşhisi yanlış kurmuş. **132'de düzeltildi.**

4. **Tanıma onarılmış metni skorluyor.** `pdfIpucuCikar` (satır 642) `metinNormalle` çağırıp
   `normMetin`'i `ilk_sayfa_metni`'ne veriyor. Gerçek `fingerprintSkor` (DB fingerprint'leriyle):
   E100 montaj → `tersan_cadmatic_montaj` **skor 2** (üretici +1, `Continue:` +1); E100 imalat →
   `tersan_cadmatic_spool` **skor 3** (üretici +1, `Malzeme Listesi` +1, `Cut & Bending Info` +1);
   M100 ikisi de aynı. Producer=`Cadmatic`, Creator=`Piping Isometrics & Spools`. **Dördü de ≥2 →
   TANINIYOR.** 131'in "E100 tanınmıyor" tezi yanlış.

5. **Dispatch L2'ye giriyor.** Kapı (satır 215) DB `parser_kural` dolu mu diye bakar; SQL
   `pk_bos=false` ikisinde de → `parserKuralIle`. `requires_ai` dispatch'te kullanılmaz.

6. **Uçtan uca L2 doğru üretiyor.** pdf-parse → metinNormalle → `aileBirlestir` → `parse`, 4 PDF.
   Hepsi `parser_seviye=l2`, parse.ok=true. **Montaj PDF'leri `montaj{}` üretti — kaymış E100 dahil:**
   pipe E100-817-005, spool_listesi [S01–S06], continue [Y100, M110], blok B1137, Paslanmaz. İmalat
   PDF'leri spool + malzeme listesi üretti (E100: 2 satır, M100: 7 satır). Tersan `AILE_KAYIT`'te →
   etkin kural `format-paketleri.js`'ten (MK-119.2); DB parser_kural parse için ölü (yalnız fingerprint).

7. **ai_api_log + DB yer-gerçeği.** SHA aramasıyla bu PDF'lerin gerçekte ne ürettiği doğrulandı.
   Format dağılımı: Montaj Cizimi (genel) bugün L2 (l3 yalnız 23 May anlık 3 kayıt), İmalat Resmi L2
   (l3 eski, 1-9 May). **"Tersan M110 Montaj Resmi" (`tersan_cadmatic_isometry`) `aktif=false`** (120'de
   emekli) + fingerprint'i spool imzası (`Malzeme Listesi`+`Cut & Bending`) → montaja eşleşmez → suçsuz.

**Sonuç:** 132'nin planlı glyph baş işi konusuz. 130'un montaj_json-null symptom'u **parse bug'ı
değil**; kod doğru. Muhtemel sebep **bayat veri** (ilgili devre 120/122 düzeltmeleri inmeden L3'te
parse edildi → null kaldı). Çözüm gerekirse o devrenin **yeniden parse'ı (backfill)**, yeni kod değil.

**Açık kalan gerçek işler (glyph DEĞİL):** K2 malzeme listesi kıyası (Bölüm 4.4-2), K1/K3 bindirme_flag
UI (Bölüm 4.4-3). "Montaj Resmi" emekli formatın silinmesi/yeniden adlandırılması (52'den temizlik borcu).

### 7.5 K2 v1 — malzeme listesi kıyası canlı (133. oturum) ✅

132'nin "açık gerçek iş" diye işaret ettiği K2 (Bölüm 4.3 ayak-b) 133'te v1 olarak kodlandı.
**Mevcut akışa girdi, yeni endpoint yok, migration yok, MK-49.1 korundu** (izometri-oku.js'e dokunulmadı).

**Yerleşim:**

| Dosya | Rol | Boyut |
|---|---|---|
| `lib/malzeme-kiyas.js` (yeni) | Saf fonksiyon — PDF `malzeme_listesi[]` × Excel `spool_malzemeleri[]` → diff | ~225 satır |
| `api/kuyruk-isle-izometri.js` (5 lokasyon patch) | `eslestir`'de `bindir`'in yanına çağrı + batch fetch + `_eslesme.detay[].malzeme_kiyas` yazımı | +27 satır |

**Üç tasarım kararı — canlı veriyle ortaya çıktı (S02 fixture: 20 PDF satırı × 5 Excel satırı):**

1. **PDF ham kesim, Excel konsolide.** PDF her parçayı ayrı satır yazar (S02'de 12 ayrı 323.9 boru
   parça); Excel `ARES_KABUK.grupla` ile tek satıra konsolide eder. K2 önce PDF'i aynı anahtarda
   (parça-tipi + cap + et + kalite) konsolide eder, sonra kıyaslar. Naive satır-satır diff yanlış
   "11 fazla" üretir — bu adım kritik.

2. **Tanım iki dilde.** PDF Türkçe ("Boru Dikişli Çelik", "Dirsek"), Excel İngilizce ("Pipe Welded
   Steel", "Elbow"). Tanım metni üstünden eşleştirme yapılamaz. **Çözüm: evrensel parça-tipi sözlüğü**
   (TR + EN, kelime-sınırı eşleşmesi — "Steel" içindeki "Tee" gibi substring tuzaklarına dikkat) +
   geometri (cap/dn) üstünden eşleşme.

3. **Kapsam ayrımı (fab / montaj / işlem) evrensel katmanda.** İzometri PDF *imalat* listesi atölyede
   kesilen-üretileni kapsar; flanş/cıvata/conta gibi *montaj* parçaları sahada birleştirilir, BOM'da
   olur ama PDF'te genelde olmaz. Bu sapma 🟡 değil **info** olmalı. **İşlem** (kaynak/yiv/lehim) ise
   gerçek malzeme değil, kıyastan dışlanır. Üç kapsam evrensel sözlüğe bağlı, format-bağımsız.

**Karşılaştırma kuralı (kategoriye göre, MK-133.2/3):**

| Parça | Hard sinyal | Soft sinyal | Yok sayılan |
|---|---|---|---|
| **boru** | boy_mm (±%5) | agirlik_kg (±%10, info) | adet (PDF=parça, Excel=tek satır) |
| **dirsek** | toplam agirlik_kg (±%15, malzeme-korunumu) | — | adet (45°/60°/20° karışırsa yanıltıcı), boy |
| **diğer fitting + montaj** | adet (exact) + per-adet agirlik (±%5) | — | toplam boy |
| **işlem** | — | — | tamamı (kıyastan dışlanır) |

**Excel kaynak güveni (MK-133.1):** K2 lib `excel_guven` parametresi alır (`'otorite'` | `'parite'`).
v1'de sabit `'otorite'` (IFS varsayımı). Backlog: format paketinden (parser_kural / AILE_KAYIT) otomatik
türetilmesi.

**S02 canlı doğrulama (`G200-339b-001 S02`, devre `b310cfc5...`):**

| Sonuç | Sayı | İçerik |
|---|---|---|
| ✅ eşleşen | 3 | boru 406.4 ✓, boru 323.9 (boy %0.2 ✓, kg %7.5 soft-info), bilezik DN400 ✓ |
| 🟡 çelişki | 1 | **dirsek 323.9 — toplam kg: PDF 212.41 vs Excel 35.01** (~6× sapma) |
| ℹ excel_fazla → montaj | 1 | flanş Slip-On DN300 ×6 (info, alarm değil) |
| 🟡 excel_fazla → fab | 0 | — |
| `flagVar` (gerçek 🟡) | true | dirsek bulgusu |

Dirsek bulgusu (Excel-otorite varsayımıyla) gerçek bir K2 yakalaması: IFS BOM "6 dirsek toplam 35 kg"
diyor (per-elbow ~5.84 kg, DN300 için fiziksel olarak imkansız); PDF "her dirsek ~35 kg" diyor
(fiziksel olarak makul). Olası kökler: PDF parser dirsek ağırlık çıkarımı şüpheli, ya da Excel BOM
basis/parse hatası, ya da gerçek BOM tutarsızlığı. K2 bu üçünü ayırt etmiyor — sapmayı yüzeye çıkarıyor.

**Açık borçlar (134 gündemi adayları):**

- **adım 1 (pipeline doğrulama):** Bölüm 4.4-1 hâlâ yapılmadı (POAR header pipeline × `dosyaAdiParse` kıyası).
- **adım 3 (UI 🟡):** Bölüm 4.4-3 — `bindirme_flag` + `malzeme_flag` İnceleme ekranında 🟡 + düzelt popup.
- **`excel_guven` otomatik türetme:** Format paketinden / parser_kural'dan kaynak güveni türetilmesi (MK-133.1).
- **Dirsek açı verisi:** PDF'ten açı çıkarımı (kontur/regex) → tam kesim-optimizasyon v2 (MK-133.3).
- **Live re-parse:** S02 dirsek bulgusunun gerçek devre verisinde teyidi (132 bayat-veri pattern'i).

> **Notlar:**
> - K2 lib evrensel katmanda; tersane/gemi spesifik bir şey yok. Katman-birleştirici çıktısını tüketir.
> - Excel kaynak ayrımı (otorite/parite) MK-133.1 ile mühürlendi: davranış aynı, çıktı `meta.excel_guven`
>   tag'i ile UI dili değişir. Lib her iki durumda da aynı sapmaları üretir.
> - 12-function tavanı: korundu. `lib/` altında yeni dosya, `api/*` sayısı sabit.

> **134 GÜNCELLEMESİ — K2 canlı doğrulandı + K1+K3 v1 (uyarilar.html):**
> - **Canlı re-parse doğrulama (MK-132.1):** S02 (`f713eee4…`) üretim ortamında yeniden eşleştirildi.
>   Yöntem: durum→`bekliyor` → `kuyruk-isle-izometri` skipParse POST (`onceden_parse` = parse_sonuc
>   eksi `_eslesme`) → server indir+izometri-oku atlar (Vision'a dokunmaz), satır 385 `eslestir`
>   koşar → K2 tetiklenir. Sonuç **fixture'ı birebir tekrarladı** (k2-v3): eslesen 3, çelişki 1
>   (dirsek 323.9 — PDF 212.41 kg vs Excel 35.01 kg, ~6×), montaj-info 1 (flanş), `malzeme_flag_sayisi`=1.
>   K2 sadece lokal değil canlı yolakta da çelişkiyi yüzeye çıkarıyor.
> - **Dirsek kök sebebi hâlâ açık (135 borcu):** 212.41/6 ≈ 35.4 ≈ Excel 35.01 → güçlü hipotez: PDF
>   toplam-ağırlık, Excel birim-ağırlık veriyor olabilir (basis farkı, MK-133.2 PDF tarafı). 2-3
>   devre örneğiyle doğrulanacak; doğruysa düzeltme l2-parser'da, K2 bug'ı değil.
> - **K1+K3 v1 — yarısı (uyarilar.html):** İki yüzey ayrı veri yolu kullanıyor. `uyarilar.html`
>   `_eslesme`'yi DOĞRUDAN okur → `malzeme_kiyas` elinde; `malzeme_flag_sayisi>0` → `celiski[]`=uyarı
>   (🟡), `excel_fazla_montaj[]`=bilgi (ℹ). Soft sapma gösterilmez (134 karar: yalnız sert çelişki).
>   `devre_wizard_v3` İnceleme ekranı ise `/api/devre-inceleme` çıktısını render eder; o endpoint
>   `_eslesme`'yi KULLANMAZ (`izometrileriDerle` kendi eşleştirmesini sıfırdan yapar) → `malzeme_kiyas`
>   çıktıda yok. **v3 rozeti 135'e** (devre-inceleme.js'e malzeme_kiyas taşıma + popup; seçenek A:
>   `_eslesme`'den oku, yeniden hesaplama). Yeni endpoint yok (12/12).

---

## 8. Oturum 130 kararları (K1-K5) + montaj düzeltme yolları

| # | Karar | Cihat onayı | Düzeltme yeri |
|---|---|---|---|
| **K1** | Çelişki (`bindirme_flag`) varsa **uyarı ver.** Aktif öğrenme düzeltmelerle zenginleşecek. cizim_durumu enum'a dokunma; asıl iş UI yansıtma | ✓ | İnceleme 🟡 (Katman 3-2d) |
| **K2** | Excel'de malzeme listesi **varsa** PDF ile karşılaştır; **yoksa** PDF'ten oluştur. Malzeme her hâlükârda PDF'ten okunmalı (L3 `malzeme_listesi` zaten var, kullanılmıyor) | ✓ **133: v1 CANLI (Bölüm 7.5)** | Katman 3-2c → `lib/malzeme-kiyas.js` + `kuyruk-isle-izometri.js` |
| **K3** | `bindirme_flag` → v3 İnceleme 🟡 + düzelt popup (mockup v5'te tasarlı) | ✓ | v3 + function tavanı |
| **K4** | Montaj PDF, ilgilendirdiği spool(lar)ın detayında görünmeli; **montaj PDF'inin içi okunarak** eşleştirilmeli | ✓ | montaj tespiti (aşağıda) |
| **K5** | Function tavanı 12/12: Katman 3 endpoint = 13. Pilot tetiklenmeden **konsolidasyon** öner; Pro'yu pilota sakla | ✓ (MK-129.3) | Katman 3'ü blokluyor |

**K4 montaj düzeltme — üç yol (sonraki oturum kararı):**

| Yol | Ne yapar | Değerlendirme |
|---|---|---|
| 1. L3'e montaj tespiti ekle | L3 prompt'a montaj/genel branch'i | Evrensel; **`izometri-oku.js`'e dokunur (MK-49.1)** + L3 maliyeti + MK-125.2 gerilimi |
| 2. Formatı öğret | AT110/Demo Atölye için `parser_kural` + `montaj_modu` → L2 | **Doğru uzun-vade** ($0, içerik okur); bu devreye özgü format öğretme işi |
| 3. Sınıflandırma seviyesi | S-segmentsiz → `montaj/genel` tipi, devre-seviyesi | En ucuz; **içeriği okumaz → K4 şartını ELER** |

Cihat'ın "içi okunarak" şartı 3'ü eler. Kalıcı yol **2**, evrensel emniyet ağı **1**. Karar +
sonra kod (sonraki oturum, taze bağlam).

> **131 ÇÖZÜMÜ (mühür) ⛔ İPTAL — 132'de çürütüldü, Bölüm 7.4 kazanır:** Üç yolun **hiçbiri.** Gerçek AT110 PDF'leri canlı kodla çalıştırıldı —
> Tersan formatı zaten öğretilmiş (119 spool / 120 montaj), montaj parser AT110'u plain metinde
> kusursuz okuyor. Sorun parse değil **tanıma**: gömülü-değil ArialMT Identity-H + ToUnicode yok →
> pdf-parse glyph çözemiyor → fingerprint band-B çapaları (`Continue:`/`Malzeme Listesi`) kaçırılıyor
> → skor 1<2 → L3 (detay Bölüm 7.3). **Gerçek fix: `lib/glyph-onar.js`'e band-B decode tablosu**
> (gated, deterministik — çöp→doğru 38/0). izometri-oku.js'e dokunulmaz (MK-49.1). Yol 2 gereksizdi
> (öğretilmiş), Yol 1 gereksizdi (L2 montaj çalışıyor). K4 artık karar değil, kod işi (132).
>
> **⛔ 132 NOTU:** Yukarıdaki mühür de YANLIŞ. Band-B tablosu zaten var ve çalışıyor (122'den);
> E100 montaj+imalat **tanınıyor** (skor 2-3), dispatch **L2'ye giriyor**, kaymış montaj **`montaj{}`
> üretiyor.** "fingerprint band-B çapaları kaçırılıyor → skor 1<2" tespiti yanlış: tanıma onarılmış
> metni skorlar (642). Yapacak glyph işi yok. Tam kanıt Bölüm 7.4. K4 zaten çözük — kod doğru.

---

## 9. MK atıf haritası (bu belgede geçenler)

| MK | Özet | Kaynak |
|---|---|---|
| MK-49.1 | `izometri-oku.js`'e dokunulmaz | omurga / kod |
| MK-49.B | İzometri PDF wizard'da `izometri-oku`'ya yönlendirilir | omurga |
| MK-50.2 / 51.x | Image-PDF L2 imkansız; `dosya_adi_regex` ≥5 örnekle test | omurga / kod |
| MK-99.4 / 50.4 | Gizli/sistem dosya filtresi | kod |
| MK-108.3 | `cizim_durumu` = veri-olgunluk ekseni (üretimden ayrı) | `ares-kabuk.js` |
| MK-110.1 | Eşleşme anahtarı `(devre, pipeline, spool)` | kod (satır 450+) |
| MK-110.3 | Boyut tek ortak parser (`ARES_OLCU.olcuParse`) | `ares-kabuk.js` |
| MK-111.2 | Montaj ağırlığı ezilmez (imalattan ayrı) | kod |
| MK-115.1 | Montaj = topoloji; `spooller`'a dokunmaz | `izometri-oku.js` |
| MK-116.1 | Belirsiz değer → dokunma | kod |
| MK-117 | Alıştırma/NOT çıkarımı (ALS→VAR; PDF baz) | kod |
| MK-118.9 / 126.6 | Eksik alan sessiz geçilmez; format-yayılım yalnız çapada | omurga |
| MK-120.3 | Glyph -29 Sezar onarımı (kapılı) | `izometri-oku.js` |
| MK-120.6 | L3 üç durumlu, devre bazlı | omurga |
| MK-125.1/.2/.3 | Format yeni+L3 kapalı→zorla; image-PDF veri Excel'den; Excel kabuk zorunlu | omurga |
| MK-126.2/.7/.8 | Onay uyarı modeli; İnceleme devre_detay tabanlı; yeni kod öncesi envanter | omurga |
| MK-127.2/.3/.4/.5 | v3 izolasyon; server-side okuma endpoint'i; draft okuma katmanı; 4-durum | omurga |
| MK-129.1/.2/.3/.4 | PostgREST alias; endpoint öncesi envanter; 12-function tavanı; backfill best-effort | 129 devir |
| MK-WIZARD.1/.2/.3 | Boş şablon wizard'dan; eksik PDF≠eksik spool; kabuk kilidi | omurga |
| KARAR-97.6/.7 | Klasör ağacı; çok-spoollu PDF 1 kopya + N referans | omurga |
| MK-131.1 (aday) ⛔ | ~~Fingerprint çapaları pdf-parse'ın çözebildiği karakter sınıfında olmalı~~ → 132'de geçersiz: çapalar onarım sonrası skorlanır (band-B var) | 131→132 |
| MK-131.2 (aday) ⛔ | ~~Gömülü-değil ArialMT Identity-H → glyph-onar band-B decode (eksik)~~ → 132: band-B zaten var/çalışıyor | 131→132 |
| MK-131.3 (aday) | "Öğretilmiş" ≠ "tanınıyor"; tanıma ve parse ayrı katman, ayrı doğrula (DOĞRU — 132.1'e taşındı) | 131 |
| MK-131.4 (aday) ⛔ | ~~Aynı tersane = temiz + glyph-kaymış; kaymış L3'e düşer~~ → 132: kaymış da L2'de parse ediliyor (temiz/kaymış ayrımı doğru ama ikisi de tanınır) | 131→132 |
| **MK-132.1** | Teşhis, canlı yolağı uçtan uca çalıştırmadan kapatılmaz; kod yorumu/ham metin/"öğretilmiş" tek başına kanıt değil (pdf-parse→metinNormalle→fingerprintSkor→aileBirlestir→parse) | 132 |
| **MK-132.2** | metinNormalle band-A VE band-B yapar (122'den) + tanıma (642) ve L2 (891) yolağına bağlı; gömülü-değil ArialMT Identity-H kaymış Cadmatic L2'de tam parse (montaj{} + malzeme) | 132 |
| **MK-133.1** | K2'de Excel'in referans rolü kaynak güvenine bağlı: ERP çıktısı (IFS) → otorite ("PDF sapıyor"); manuel Excel → parite (simetrik). Lib aynı sapmayı üretir, çıktı `meta.excel_guven` tag'i UI dili belirler. v1'de sabit 'otorite'; format paketinden türetimi backlog | 133 |
| **MK-133.2** | `spool_malzemeleri.agirlik_kg` satır-toplamı semantik; per-adet türetimi `agirlik/adet`; fitting per-adet, boru toplam, dirsek toplam (özel) | 133 |
| **MK-133.3** | Dirsek 90° stoktan farklı açılarla kesilir → artan parça fire değil geri-stok → adet kıyası yanıltıcı. v1 invariantı: PDF/Excel toplam ağırlık ≈ (±%15). Tam bin-packing (açı verisi gelince) v2 borcu | 133 |
| **MK-134.1** | `[skip ci]` çok-commit push'ta tüm CI'yi atlar (HEAD mesajına bakılır → altındaki kod commit'i dahil atlanır). Kod commit'i + `[skip ci]` doc aynı push'ta doc-HEAD'de gönderilmez; kod ayrı/önce push (CI koşar) ya da HEAD=kod. Doğrulama: push sonrası kod hash'i için Actions run'ı göründü mü | 134 |

---

> **Bu belge tek referanstır.** Çapraz doğrulama katmanı (Bölüm 4) kodlandıkça Bölüm 4.4 güncellenir.
> Parser/eşleştirme kodu değişirse ilgili bölüm + kod satır atıfları yenilenir. Omurga *kararı*,
> bu belge *kodun gerçeğini* tutar.
