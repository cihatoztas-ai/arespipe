# Devre Wizard — OMURGA Belgesi (Final, Tek Kaynak)

> **AresPipe · Tek Omurga Tasarım Belgesi · 26 Mayıs 2026 (Oturum 127)**
>
> Bu belge, devre yükleme + format öğrenme akışının **tek ve güncel** referansıdır.
> Dört ayrı belgenin (97 mimarisi, 106 akışı, 124 omurgası, 117-123 format motoru) +
> oturum 125 konsolidasyonu + oturum 126 "İnceleme & Onay" mockup turları +
> oturum 127 kod-öncesi mimari kararlarının evrimleşmiş son hâlidir.
>
> **Görsel referans:** `devre_wizard_mockup.html` (v5, oturum 126).
>
> **Kod yazmadan önce buraya bakılır.** Çelişki çıkarsa bu belge kazanır; eski belgeler arşivdir.

---

## 0. Bu belge ne / belge ekosistemi

Wizard tasarımı dört kez olgunlaştı (her biri öncekini çürütmedi, üstüne bindi):

| Belge | Oturum | Rolü | Bu omurgadaki yeri |
|---|---|---|---|
| `DEVRE-WIZARD-V2-MIMARISI.md` | 97 | Altyapı: 8 tablo, füzyon kuralları, migration 080 | KAYNAK (Bölüm 10, 15) |
| `MK-WIZARD-DEVRE-YUKLEME.md` | 106 | Akış: kabuk otoritesi, 5 adım, eşleştirme, soru politikası | KAYNAK (Bölüm 3-6, 11) |
| `DEVRE-WIZARD-VIZYON-v3.md` | 124 | Omurga: tek sayfa taslak modu, terfi | KAYNAK (Bölüm 2, 12-14) |
| `format-tanitma-kilavuzu.md` | 117-123 | Motor: facet tanıma, parse, glyph, **çapa** | KAYNAK (Bölüm 7-9) |
| `OMURGA-GUNCELLEME-126.md` | 126 | İnceleme & Onay mockup turları, MK-126.1..8 | İŞLENDİ (v3) |
| `IZOMETRI-BATCH-KARAR.md` | 34-39 | Çapa kökeni (Karar 10 B+C) | ARŞİV (tarihsel) |
| `SPOOL-AI-VIZYON` + `VIZYON-MODULER` | — | Ürün felsefesi, katman yapısı | ÜST ÇATI |

**Sonuçtaki durum (oturum 127 tespiti):** motor hazır, kabuk yarım, İnceleme & Onay kodlanmadı.
Format tanıma/parse motoru baştan sona kodlandı (Aşama 0-1.8). Wizard'ın tabloları + iskeleti +
Excel parser'ı + asenkron izometri drenajı yazıldı (97-101, 113). Ama İnceleme & Onay ekranı,
füzyon UI, çapa arayüzü ve taslak modu hiç kodlanmadı. **Oturum 127 bu işi başlatır** (yeni
dosya + flag, mevcut wizard'a dokunmadan — Bölüm 11.B).

### Koruma bantları (v3 Bölüm 9'dan — her fazda korunur)
- **KORUMA-1 — Yeniden yazma YOK, üstüne bin.** `izometri-oku`, drenaj client-loop (113/A),
  `devre_yeni` spool ID/QR/prefix üretimi, `ARES_KABUK.aktar/grupla`, `ARES_NORM`,
  `ARES_IZO_DRENAJ.izometriDreneEt`, eşleşme primitifleri (`normPipeline/normSpoolNo/
  dosyaAdiParse/montajDosyaKok`) — hepsi ÇAĞRILIR, kopyalanmaz.
- **KORUMA-2 — Açık borçlar wizard'a YEDİRİLMEZ.** Borçlar Bölüm 16'da kayıtlı, ayrı kapanır.
  İstisna: pipeline eşleşme borcu (MK-124.1) doğal olarak eşleştirme fazının parçası.
- **KORUMA-3 — Kararlar kilitli, UI detayı mockup'ta sınanır.** Mockup'ta tutmayan şey →
  belge değil o ekran düzeltilir.

---

## 1. Omurga fikir — tek sayfa, iki hâl (124)

**Wizard ayrı bir sayfa değildir; devre detay sayfasının "TASLAK MODU"dur.**

- **TASLAK:** turuncu "ÖNİZLEME" bandı + doğrulanmamış alanlar sarı + eksik/fazla spool
  İnceleme'si görünür. Devre canlıya geçince nasıl görüneceğinin birebir simülasyonu.
- **CANLI:** onay sonrası aynı sayfa; bant kalkar, gerçek listeye düşer.

**Onay = taslağın canlıya terfisi.** Bu tek hamle "mevcut/yeni devre" ayrımını kaldırır,
önizleme→onay→canlı akışını kurar, taslak listesini bir sekmede bekletir.

> **Oturum 126/127 netleşmesi:** İnceleme görünümü devre_detay düzenini **taklit eder**
> (MK-126.7) — hero stat kartları + sekmeler + `.dt` tablo + `ARES_NORM` rozetleri. Yani
> "tek sayfa, iki hâl" fikri görsel olarak da devre_detay üzerinden kurulur.

---

## 2. Taslak nerede yaşar (124)

Taslak **gerçek bir devre DEĞİLDİR.** Onaya kadar `devreler`'de kayıt yok; spool ID, iş emri,
QR üretilmez. Mevcut katmandan **türetilir** (yeni staging tablosu YOK):
- Yüklenen dosyalar → `devre_dokumanlari` (var)
- Parse sonuçları → kuyruğun `parse_sonuc` JSONB'si (var)
- Excel kabuğu → parse edilmiş hâlde (var)

**Tek ekleme:** `devre_dokumanlari`'na `taslak_haric BOOLEAN` + `taslak_not JSONB` (klasör
işaretlemeleri + İnceleme düzeltmeleri kaybolmasın — özellikle "Beklemeye Al → sürdür"
senaryosunda, MK-126.5).

**Onay anı = terfi:** gerçek `devreler` INSERT + spool ID + QR. Bu, mevcut `devre_yeni.html`
mantığını **ÇAĞIRIR, KOPYALAMAZ** (KORUMA-1).

> **MK-126/127 (KAPANDI) — kabuk→spool kayıt zamanı:** Taslakta `spooller`/`devreler`'e
> **yazılmaz**; spool ID **terfide** üretilir. Bölüm 16.B'de "açık soru" olarak bekleyen bu madde
> bu kararla kapanmıştır. (Doğal sonuç: İnceleme aşamasında spool'lar henüz yok → İnceleme
> eşleştirmesi `spooller`'dan okuyamaz; ayrı okuma katmanı gerekir — Bölüm 6, MK-127.4.)

---

## 3. Kabuk otoritesi + üç hata sınıfı (106)

**Otorite kabuktur, PDF değil.** Bir klasördeki PDF'ler eksik/fazla/bozuk olabilir. Devrenin
spool listesi (kabuk) önce resmi kaynaktan kurulur; dökümanlar bu kabuğa karşı çetelelenir.

Üç hata sınıfı **asla sessizce geçmez:**
- **Eksik:** kabukta var, dökümanı yok/okunamadı
- **Fazla:** döküman var, kabukta yok
- **Şüpheli:** eşleşti ama parse zayıf / güven düşük

İnceleme ekranı geçilmeden devre "tamamlandı" olmaz. "23/25 asla sessiz geçmez."

> **MK-126.2 — eksik = sert kilit değil, uyarı:** Eksik spool silinmez; kullanıcı bilgisini
> İnceleme'den tamamlayabilir VEYA eksik bırakabilir. Onay her zaman tıklanabilir; onay anında
> modal çıkar ("şu spool'lar eksik bilgiyle gidiyor"). "Asla sessiz geçmez" korunur — ama kapı
> değil, **uyarı**dır.

---

## 4. Kabuk kaynakları + spool-no formatı (106)

> **MK-125.3 (oturum 125):** Kabuk **Excel'den gelir ve ZORUNLUDUR** (güvenlik şartı). PDF'ten
> kabuk çıkarma (eski K3) wizard'dan düşürüldü. Kaynak seçim ekranı yoktur; sistem klasörde Excel arar.

Spool kümesi (S01…Snn) iki kaynaktan doğar:

| Kaynak | Ne zaman | Güven |
|---|---|---|
| **K1 — IFS/benzeri Excel** | Klasörde varsa: varsayılan, kabuk buradan | Yüksek |
| **K2 — Program şablonu** | Excel yoksa: wizard **boş şablon** üretir, doldurulup yüklenir (zorunlu) | Yüksek |

Excel bulunamazsa kabuk kurulamaz → "Devam Et" kapalı; kullanıcı şablonu indirip doldurur. Boş
şablonu wizard üretir (elle kurma = hata) — **MK-WIZARD.1**. Eski K3 (PDF'ten çıkar) kaldırıldı.

> **K2 şablon (oturum 126 netleşmesi):** Kolonlar onaylı — `Spool No · Pipeline No · Rev · Çap ·
> Et · Ağırlık · Malzeme · Kalite · Yüzey · Alıştırma`. Üretim client-side SheetJS. (Şablon üretim
> mantığının tam yeri — ayrı tablo mı `izometri_format_tanimlari` kardeşi mi — hâlâ açık, Bölüm 16.B.)

**Spool-no formatı (tenant bazlı, bir kez):** Kompozit ID (`NB1124-G200-350-FR38-Galv-S01`)
tersaneye göre değişir. Tek mekanizma: **her zaman parçalardan kur; hazır geleni parçalarına
ayırıp çapraz doğrula.** Format tenant'a kaydedilir (`spool_no_sablonu` taslağı), wizard'da önizlenir.

---

## 5. Giriş & klasör ağacı + revizyon ayıklama (124 + 106 + oturum 125-126)

> **MK-125.4 (oturum 125):** Wizard **iki adımdır** (5 değil): (1) Devre & Belgeler — devre tanımı +
> klasör yükleme TEK ekranda; (2) İnceleme → Onay. Sadece **proje + devre adı mecburi**;
> zone/malzeme/yüzey/termin/alıştırma opsiyonel ve girilirse dökümanlarla doğrulanır. İş emri no
> bu aşamada YOK — terfide üretilir. Belge yükleme alanı görünür alandadır; opsiyonel detaylar sayfa sonundadır.
>
> **MK-126.1 (oturum 126) — tersane SEÇİLEBİLİR:** v2'deki "tersane kilitli (tenant tek)" düşer.
> Tersane **devre-seviyesi seçilebilir alandır** (çok-tersaneli/çok-atölyeli tenant senaryosu).
> Giriş ekranında dropdown.

1. **Tersane + proje seçilir** (tersane dropdown, seçilebilir — MK-126.1); mevcut/yeni devre
   ayrımı YOK (tek akış). Devre detaydaki "Spool Ekle" bu akışa köprüdür, onaydan sonra devre detaya döner.
2. Form düzeni: satır-1 **Tersane + Proje**, satır-2 **Devre adı + Zone**. Proje gösterimi sade (sadece no).
3. Sürükle-bırak sonrası **Windows-gezgini benzeri ağaç** (KARAR-97.6 — `klasor_yolu` korunur).
   Yüklenince dosya/klasör **tam liste**, **aç-kapa klasör ağacı** (devre_detay `dokKlasorToggle`).
4. Kullanıcı eşleştirmeden ÖNCE klasörleri işaretler: "bilgi amaçlı" / "revizyon-öncesi" →
   eşleştirmeye sokulmaz. Yanlış eşleşmeyi kaynakta keser (fazla-spool vakalarının çoğunu eler).
5. Auto-detect: klasör adı → uzantı → `diger`; hidden/sistem dosya filtresi korunur.
6. **"⏸ Beklemeye Al" aksiyonu** (MK-126.5): büyük devre tek seferde işlenmek zorunda değil →
   onay bekleyenler listesinde durur → açınca kaldığı yerden sürer.
7. **L3 aç/kapa butonu** (MK-126.7) bu ekranda (Belgeler kartında). Devre bazlı L3 kontrolü (Bölüm 13).

**Ağaç wizard boyunca kalıcıdır.** Parse durumu hem ağaçta (dosya yanında rozet) hem İnceleme'de
(spool durumu) görünür — aynı gerçeğin iki açısı, drenaj ilerledikçe canlı güncellenir (Bölüm 12).

---

## 6. Eşleştirme — içerikten bağımsız (106) + canlı kod gerçeği (oturum 127)

**Kritik bulgu:** İzometri *içeriğini* parse edip eşleştirmek Tersan'da (text-PDF) çalışır,
PAOR'da (image-PDF) çalışmaz. İkisinde de ortak ve güvenilir olan **dosya adıdır.**

> **MK-126.8 / oturum 127 doğrulaması — canlı koddan teyit (`api/kuyruk-isle-izometri.js`):**
> Belge eskiden eşleşme anahtarını "resim_no + spool_no" diye yazıyordu. **`resim_no` diye bir
> kolon hiçbir tabloda yok.** Çalışan kod, eşleşmeyi şu anahtarla yapar:
> ```
> Anahtar:  normPipeline(pipeline_no) | normSpoolNo(spool_no)
>   - pipeline_no: DOSYA ADINDAN çıkarılır (dosyaAdiParse) — tüm PDF tek pipeline.
>   - spool_no:    öncelik dosya adı, yoksa parse çıktısı.
>   - normPipeline: 'B1110' ↔ 'NB1110' (N öneki normalize) içerir.
> ```
> Yani omurganın "resim_no" kavramı, Tersan'da **dosya adı kökü = pipeline_no** olarak somutlaşır.
> Eşleşme **ikilidir** (anahtar tutar/tutmaz); ayrı bir güven eşiği yok. "Zayıf" sinyali ayrı gelir
> (`bindir()`'in `bindirme_flag`'i = kabuk↔PDF değer çelişkisi, %3 tolerans).

**İki eşleştirme yolu (canlı kod — birleştirme bunları okumak zorunda):**
- **Spool çizimi (1 çizim → 1 spool):** eşleşince `spooller` güncellenir (`cizim_durumu` bekliyor→
  kısmi, et/çap/ağırlık/yüzey bindirme) + `devre_dokumanlari.spool_id = spool.id` yazılır.
- **Montaj çizimi (1 çizim → N spool):** `montajEslestir` → eşleşen her spool'a `spooller.montaj_json`
  yazılır. **`devre_dokumanlari.spool_id` YAZILMAZ** (1-çok tek kolona sığmaz — kod yorumu 649).
- Her iki yol da özeti `dosya_isleme_kuyrugu.parse_sonuc._eslesme`'ye yazar:
  `{tip?, toplam, detay:[{spool_no, pipeline_no, durum:'eslesti'|'atanmamis', sebep?, bindirme?, bindirme_flag?}]}`.

> **Tasarım↔kod farkı (oturum 127, kayıt için):** Omurga N:N bağı için `spool_dokumanlari`
> tablosunu (KARAR-97.7 / MK-WIZARD.5) hedefliyor. **Canlı kod bunu kullanmıyor** — spool çizimi
> `devre_dokumanlari.spool_id` (1:1), montaj `montaj_json` ile çözülüyor. `spool_dokumanlari`
> hedef mimaridir, henüz bağlanmadı. İnceleme okuma katmanı bugünkü gerçeğe (parse_sonuc + spool_id +
> montaj_json) göre kurulur; `spool_dokumanlari`'na geçiş ayrı bir iş.

**Eksik PDF ≠ Eksik spool (MK-WIZARD.2):** Spool kabuktan gelir; PDF'i bugün gelmemiş olabilir.
İnceleme "S07 eksik" derken spool'u silmez — "izometrisi henüz yok" der.

**Kabuk kilidi (MK-WIZARD.3):** Kabuk onaylanınca değişmez. "Aslında 26 spool varmış" çıkarsa
bilinçli geri-adım, sessizce 26'ya çıkmaz. Kabuk = imzalı sözleşme.

> **Açık borç — MK-124.1:** Parse `pipeline_no`'yu `722-1021-ALS` çıkarıyor, gerçek
> `E120-722-1021-ALS` — `E120-` öneki düşüyor → eşleşme sıfır. Önek normalizasyonu eşleştirme
> fazında çözülür (dosya adı regex'i `parser_kural.dosya_adi_regex`'te, format-spesifik — MK-51.2).

---

## 7. Parse & format tanıma motoru (format kılavuzu 117-123)

**Facet/aile tabanlı katmanlı kural paketleri.** Format ağaç (filesystem) değil, facet'lerle
(tasarım ofisi şablonu, sürüm, dil, standart ailesi) tanınır. Sürüm de bir facet'tir; sürüm
kayması = kısmi tanıma yolu (MK-118.5).

**Üç katman (sıfır→pahalı):**
- **L1/L2 — metin + kural (sıfır API):** dijital PDF'in metni `parser_kural`'daki alanlardan
  okunur. 1-2 ms, deterministik. ~10.000× hızlı.
- **L3 — Vision AI (maliyetli):** taranmış/elle çizilmiş/tanınmayan format. Güvenlik ağı.

**Tanıma:** fingerprint skoru + eşik (Bölüm 6 motoru). `dosya_adi_regex` eşleşmesi +5 tie-breaker.

**Glyph onarımı (MK-120.3 / 121.1-4):** Cadmatic çıktılarında gömülü font -29 Sezar kayması
yapar. Onarım KAPILI olmalı (ham'da çapa varsa dokunma; yoksa ve -29-onarılmışta varsa onar).
Metin-çıkarım sınırında, fingerprint skorlama ÖNCESİ uygulanır.

**Kod durumu:** Aşama 0 (kılavuz+facet), 1 (katman birleştirici), 1.5 (ikinci aile registry),
1.6-1.7 (glyph band-A/B), 1.8 (uçtan uca L2 + paslanmaz fitting) → **hepsi kodlandı (118-123).**

---

## 8. Format öğrenme & ÇAPA (format kılavuzu B.9)

**Çıkış noktası:** DB tablolarımız belli, neye ihtiyacımız olduğunu biz biliyoruz. Kullanıcı
formatı ANLATMAZ; eksik alanları GÖSTERİR/DOĞRULAR. Üç eylem: **onay** (evet/hayır), **seçim**
(a/b/c), **işaretleme** ("şu alan PDF'te nerede?" → kutu çiz).

**Akış:**
1. PDF image mi metinli mi (MK-50.2). Image → işaretleme değil, elle giriş modu.
2. Skorla → en yakın aile önerilir.
3. Yakalananları onaylat (güven kademesi, kısmi tanıma).
4. Eksik alan için sırayla sorar ("yüzey işlem nerede?") → kullanıcı kutuyla işaretler.
5. Kaydet → kullanıcı hemen kendi projesinde kullanır (statü: **firma-taslak**).
6. Bilgiler süper admin'e düşer; konum→metin eşlemesini orada AresPipe işler.

> **MK-118.7 (ÇAPA — son söz, oturum 125 teyit):** İşaretleme KOORDİNAT değil ÇAPA olarak
> saklanır. Kullanıcı kutuyu pikselde çizer; saklanan kalıcı kural = kutudaki METİN +
> çevresindeki SABİT ETİKET ("SURFACE:", "NOT:", "PIPE CLASS:"). Koordinat sadece "kullanıcı
> burayı gösterdi" ipucu. Sayfa kaysa da etiketi bulup yanından okur → sağlam.
>
> *Çapa evrimi:* Karar 10-C (oturum 39, koordinat odaklı) → MK-49.X (49-50, metin pattern) →
> MK-118.7 (118, ikisi birleşti). Karar 10-C atadır, MK-118.7 geçerlidir.

> **MK-118.8 (üç statü):** firma-taslak → firma-onaylı → evrensel. İki bağımsız firma aynı
> çapayı/değeri üretirse VEYA süper admin onaylarsa → evrensel. Terfide sadece KURAL+ETİKET
> anonim çıkar; firma PDF içeriği/proje/spool verisi ASLA (KARAR-48.1).

> **MK-118.2:** İki firma aynı alanı farklı işaretlerse → süper admin'e "hangisi?" "Aynılık"
> koordinat değil, çıkarılan çapa/değer üzerinden ölçülür.

> **MK-125.1 (oturum 125):** Format yeni VE L3 kapalıysa, akış sessizce geçmez —
> kullanıcıyı "bu devre için L3'ü bir kerelik aç, yoksa bu spool'ları okuyamam" diye **zorlar**.

---

## 9. Tanınan formatta eksik alan — sessiz hata yok (format kılavuzu B.10)

> **MK-118.9:** Eksik alan asla sessizce geçilmez; **format-seviyesi düzeltme** kuyruğun kalanına
> otomatik uygulanır.

> **MK-126.6 (oturum 126) — netleşme: hangi düzeltme yayılır:**
> - **Değer düzeltmesi** (yüzey/malzeme/alıştırma vb. — bir spool'un *verisi*) → **o spool'a**
>   işlenir, **yayılmaz**. Yüzey/malzeme veridir, kural değil; spool'dan spool'a değişir.
> - **"Formatın tümüne uygula"** YALNIZCA **çapada** anlamlıdır (konum/etiket öğretme = okuma
>   kuralı). MK-118.9'un oto-uygula'sı çapa düzeltmesi içindir, değer düzeltmesi için değil.
> - İnceleme düzeltme popup'ı **tüm kullanıcılara açıktır** (küçük değer düzeltmeleri).

Akış (10 PDF'lik kuyruk, çapa düzeltmesi):
1. Eksik alan yüzeye çıkar (sessiz değil).
2. Sistem sorar: **"Bu düzeltme bu PDF'e mi, formatın tümüne mi?"** — varsayılan "formatın tümüne".
3. "Formatın geneli" → aile/firma katmanına yazılır; aynı aileden diğerleri otomatik yeniden değerlendirilir.
4. "Sadece bu PDF" → o kayda işlenir, kural değişmez.
5. Otomatik yeniden değerlendirme özeti: "9 PDF işlendi, 7 çözüldü, 2'sinde eksik".

İnce noktalar: aile garantisi (skor+eşik), "boş vs okunamadı" ayrımı, "şimdilik atla" (manuel_onay'da bekler).

---

## 10. Füzyon motoru — alan başına skor (97)

Aynı alan iki kaynaktan farklı gelirse (Excel "WN flanş", izometri "SO flanş"):

- **İki boyutlu skor (KARAR-97.5):** parse güveni × kaynak içerik önceliği (JSONB).
  Excel direkt 1.0, dijital PDF L2 0.95, Vision L3 0.6-0.8, raster Vision 0.5.
- **Risk bazlı eylem (KARAR-97.3):** Yüksek riskli alanlar (cap_dn, et_mm, malzeme, kalite,
  flansh_tipi/sinif, adet) → **manuel onay**. Düşük riskli (boy_mm, agirlik_kg, yuzey, pipeline_no,
  spool_no, rev, montaj_koordinati, sertifika) → **otomatik** en yüksek skor kazanır.
- **Çelişki logu (KARAR-97.4):** `fuzyon_karar_log` her seçimi kaydeder; 5+ aynı yönde karar →
  sistem yeni öneri kuralı çıkarır.

Çıktı **spool detayın TÜM sekmelerini besler:** Excel/BOM→malzeme listesi, imalat PDF→çizim,
izometri→yön dizilimi, montaj resmi→montaj sekmesi.

> **Canlı kod karşılığı (oturum 127):** Spool yolu `bindir()` ile et/çap/ağırlık/yüzey'i %3
> toleransla kabuk spool'a bindiriyor; çelişki `bindirme_flag` ile işaretleniyor. Bu, füzyon
> motorunun bugünkü minimal hâli — alan başına tam skor henüz yok, ama çelişki sinyali var
> (İnceleme 🟡 zayıf bunu kullanır).

---

## 11. İnceleme ekranı — değişmez kalp (106 + 124 + oturum 126)

> **MK-126.3 (oturum 126) — adlandırma:** Her yerde **"Mutabakat" → "İnceleme ve Onay".**
> Tablo durum sütunu = **"Durum"**; özet şeridi = "Özet". (MK-125.4'teki "Mutabakat" adı da güncellenir.)

Taslak modunun ana alanı. Kabuk = otorite. Dört durum:

| Durum | Renk | Anlam | Davranış |
|---|---|---|---|
| Eşleşen + okundu | 🟢 yeşil | kabukta var, ≥1 izometri eşleşti, çelişki yok | tamam |
| Eşleşen, parse zayıf | 🟡 sarı | eşleşti AMA `bindirme_flag` çelişki / güven düşük (L3) | "doğrulanmadı" → kontrol/Düzelt |
| Eksik | 🔴 kırmızı | kabukta var, eşleşen izometri yok | "S07 için döküman yok" (spool silinmez) |
| Fazla | 🟠 turuncu | izometri `(pipeline\|spool)` üretti, hiçbir kabuğa eşleşmedi | **sessizce eklenmez — SORAR (ekle/yoksay)** |

> **MK-127.5 — 4-durum sinyalleri (canlı veriden, doğrulanmış):** Birleştirme okuma katmanı,
> kabuk satırlarını (BOM `parse_sonuc` → `kabukTuret`) × izometri `parse_sonuc`'larını
> `normPipeline|normSpoolNo` anahtarıyla eşler. 🟢 = ≥1 eşleşme + `bindirme_flag` yok ·
> 🟡 = eşleşti ama `bindirme_flag` çelişki VEYA parse L3 + güven<eşik · 🔴 = kabuk spool'una
> eşleşen izometri yok · 🟠 = izometri anahtar üretti ama hiçbir kabuğa eşleşmedi.

> **MK-126.7 (oturum 126) — görünüm devre_detay'ı taklit eder:** Kullanıcının aşina olduğu
> devre_detay düzeni — `.stat-grid` hero kartları + sekmeler (**Spool Listesi / Dökümanlar /
> Malzeme Listesi / Genel Bilgiler** — İşlem Kayıtları YOK) + `.dt` tablo + `ARES_NORM` rozetleri
> (mat-badge/yuzey-badge, marka mavi, rev chip, kalite mavi).
> - **Üretim sütunları ÇIKAR** (Durum/İlerleme/Son İşlem/Büküm/Kesim/Markalama/Test — üretim henüz başlamadı).
> - **Gelen sütunlar:** Durum (🟢🟡🔴🟠), İzometri (dosya adı + seviye L1/L2/L3), Alıştırma, İşlem.
> - **Spool ID** taslakta gri **"terfide üretilecek"**.
> - **Geliştirici tanı bölümü** (popup) = YALNIZCA spool detayda gösterilmeyen değerler
>   (`parse_sonuc`, `yon_dizilim`, glyph onarım) — rol/feature-flag arkasında.
> - Klasör ağacı bu ekranda YOK; **Dökümanlar sekmesinde** (aç-kapa, `dokKlasorToggle`).

> **MK-126.2 (oturum 126) — onay kilidi → uyarı modeli:** İnceleme temizlenmeden onay yasak
> DEĞİL. Onay her zaman tıklanabilir; eksik/fazla varsa **onay anında modal** uyarır (liste uzunsa
> gözden kaçmasın). Kapı kalktı, yerine bilinçli uyarı geçti.

Sarı bir alanda "Düzelt →" → değer düzeltme popup'ı (spool-özel, MK-126.6) veya çapa işaretleme
(format-yayılım, Bölüm 8). Bu ekran onay öncesi modalla özetlenir.

**"Doğrulanmadı" damgası (MK-WIZARD.4):** PDF'ten okunan ama teyit edilmemiş alan → sarı,
sonradan teyit edilebilir. Sistem uydurmaz, "emin değilim" der.

**Soru sorma politikası (MK-WIZARD, "bu mu/bu mu", asla sınav):** sadece cevabı bir şeyi
değiştiren belirsizlikte sor. Net eşleşme → sessiz kabul.

---

## 11.B İnceleme & Onay — kod mimarisi (oturum 127)

> **MK-127.2 — İZOLASYON (kaza önleme):** Mevcut `devre_wizard.html` (4-panel, canlı) **bir
> karaktere dokunulmadan** kalır. Yeni İnceleme & Onay akışı **ayrı dosyada** (`devre_wizard_v3.html`)
> + **ayrı flag** (`devre_wizard_v3`) yaşar. İlk pilot: **Demo Atölye**. Bayrak kapalıyken sistem
> bugünküyle bit-bit aynı. Pilot onaylanınca v2 emekliye ayrılır; iki dosyayı senkron tutma yükü
> doğmaz (v3 fork değil, yerine geçen). Ağır mantık ortak modüllerde (`ARES_KABUK/ARES_NORM/
> ARES_IZO_DRENAJ`) → v3 dahil eder, kopyalamaz (KORUMA-1). *Teyit (oturum 127): mevcut
> `devre_wizard.html`'de birleştirme/4-durum/eşleştirme kodu YOK — `grep` boş döndü; A kararıyla çakışma yok.*

> **MK-127.3 — A: İnceleme eşleştirmesi SERVER-SIDE okuma endpoint'i.** Draft 4-durum, yeni bir
> okuma endpoint'inde (`POST /api/devre-inceleme {devre_id}`) hesaplanır; mevcut eşleşme
> primitiflerini (`normPipeline/normSpoolNo/dosyaAdiParse/montajDosyaKok`) **çağırır**; client
> sadece render eder. Gerekçe: dosya-adı regex'i aktif geliştirilen, format-spesifik evrilen parça
> (MK-51.2, MK-124.1) — tek kaynakta kalmalı. Client'a port edilirse kaçınılmaz sapar (drift).
> A, draft eşleştirmeyi terfi-zamanı kanonik eşleştirmeyle **birebir aynı** mantıkla tutar.

> **MK-127.4 — Draft eşleştirme = OKUMA katmanı; kanonik bağ terfide.** Mevcut matcher
> (`api/kuyruk-isle-izometri.js`) `spooller`'dan okur → spool'lar var olduktan sonra çalışır.
> Taslakta spool YOK (MK-126/127, Bölüm 2). Bu yüzden İnceleme okuma katmanı, izometri
> `parse_sonuc`'undaki `spool_no`'yu **kabuk önizleme satırlarıyla** eşler — `spooller`'a YAZMAZ,
> **`izometri-oku.js`'e DOKUNMAZ (MK-49.1).** Onayla → spool'lar oluşur → mevcut matcher kanonik
> bağı yazar (`cizim_durumu`, `devre_dokumanlari.spool_id`, `montaj_json`). Sıfır kod tekrarı.
>
> *Açık alt-soru (A kilitli ama bu detay sonraki tur):* terfide kanonik bağı yazmak için PDF
> yeniden mi parse edilsin (basit/israf) yoksa mevcut `parse_sonuc`'tan ucuz yeniden-eşle yolu mu
> eklensin (ek backend). Karar verilmedi.

**Okuma endpoint'i sözleşmesi (taslak):**
```
POST /api/devre-inceleme  { devre_id }
→ {
    spoollar: [{ marka, pipeline_no, spool_no, rev, cap, agirlik_kg, malzeme, kalite, yuzey,
                 durum: 'okundu'|'zayif'|'eksik'|'fazla',
                 izometri: { dosya_adi, seviye:'L1'|'L2'|'L3', guven } | null,
                 bindirme_flag: bool }],
    fazla:   [{ pipeline_no, spool_no, dosya_adi }],   // 🟠 kabukta yok
    ozet:    { toplam, okundu, zayif, eksik, fazla }
  }
```
İnceleme ekranı bu JSON'u devre_detay düzeninde render eder; drenaj `onIlerleme`'de yeniden çağrılır (Bölüm 12).

---

## 12. Arka plan işleme — client-loop manuel (124 + oturum 126)

**Mevcut (113/A):** drenaj tarayıcıda döner (client-loop), server→server yok → Vercel 508
kökten çözülmüş. Helper lock'suz/atomik → sekme kapanırsa yarım iş `bekliyor`'da kalır, hata'ya
düşmez, tekrar işlenir. En kötü ihtimal: bir PDF iki kez parse (birkaç kuruş / bedava L2).
Motor: `window.ARES_IZO_DRENAJ.izometriDreneEt({filtre:{devreId}, onIlerleme})` — `onIlerleme`
faz `bitti/tamam` verir.

> **MK-126.5 (oturum 126) — arka plan oto-işleme YOK; client-loop manuel kalır.** v2'deki
> "A-oto + hibrit (server worker / Cron)" fikri **düştü** (sunucu maliyeti gerekmez). 113/A
> client-loop olduğu gibi kalır (sıfır maliyet):
> - Yükleme bitince drenaj **kendi başlamaz değil** — İnceleme ekranında **canlı poll** ile döner
>   (kullanıcı izlerken tablo 🔴→🟢 dolar — **B mimarisi, oturum 127**).
> - Büyük devre → giriş ekranında **"⏸ Beklemeye Al"** → onay bekleyenler listesinde durur →
>   açınca işleme **kaldığı yerden sürer**, tek tek incelenip onaylanır.
> - "Sessizce ilerleme" beklentisi iptal; yeni MK/sunucu maliyeti gerekmez.

> **B mimarisi (oturum 127 — İnceleme canlı dolum):** İnceleme ekranı `ARES_IZO_DRENAJ`'ı
> `onIlerleme` callback'iyle sürer; her PDF bittikçe okuma endpoint'i (MK-127.3) yeniden çağrılır
> → ilgili satır 🔴→🟢 döner. Senkron bekleme (A) yok; mevcut drenaj altyapısı yeniden kullanılır.

> **MK-126.4 (oturum 126) — onay bekleyen liste Devreler'de.** "Devre Yükle" girişi **yeni
> yükleme** başlatır. Onay bekleyen (taslak) devreler listesine **Devreler sayfasındaki bir
> butonla** ulaşılır — yükleme sekmesinden değil. Liste **yöneticiye de açık**; o da sürdürebilir.

**Asıl kaldıraç:** server worker değil **L2 öğrenme** — format öğrenilince 150 spool saniyeler
sürer, sekme derdi buharlaşır.

---

## 13. L3 maliyet kontrolü — devre bazlı (124 + format kılavuzu 12.1)

L3 üç durumlu: **otomatik / onaylı / kapalı**, devre (ve belge-tipi) bazında (MK-120.6).
Varsayılan otomatik, kullanıcı kapatabilir. **L3 aç/kapa butonu** giriş ekranı Belgeler kartında (MK-126.7).

**PAOR örneği:** taranmış izometri (L2 metin çıkaramaz, L3 pahalı) AMA o devrenin Excel'i
(IFS/BOM) spool+malzemeyi zaten veriyor → izometriden veri çıkarmaya gerek yok, sadece görsel
`'sakla'`. Bu devrede L3 kapalı → sıfır maliyet. (İstisna: format yeni + L3 kapalı → MK-125.1 zorlar.)

---

## 14. Taslak → onay → canlı terfi (124)

"Devreyi Onayla" → gerçek `devreler` INSERT + spool ID atama + QR üretimi + canlı listeye düşme +
D-katmanı veri damarına akış. Bu hamle `devre_yeni.html` mantığını ÇAĞIRIR (KORUMA-1). Onaydan
sonra aynı sayfa CANLI hâle döner; taslak bandı kalkar.

> **Onay öncesi modal (MK-126.2):** Onaya basınca, eksik bilgiyle giden spool'lar + fazla
> döküman kararları (ekle/yoksay) modalda özetlenir. Onay her zaman tıklanabilir (kapı değil uyarı).

> **Terfi sonrası kanonik eşleştirme (MK-127.4):** Spool'lar oluştuktan sonra mevcut matcher
> kanonik bağı yazar. İnceleme'deki draft 4-durum, terfide kanonik durumla aynı anahtar mantığını
> kullandığından tutarlı kalır.

---

## 15. Altyapı + kod durumu (97 + bugünkü gerçek)

**8 tablo (migration 080, 97'de yazıldı, 98'de çalıştırıldı):**

| Tablo | Ne tutar | tenant_id NULL? |
|---|---|---|
| `dokuman_tipleri` | uzantı→parser yolu | Evet |
| `klasor_isim_sozluk` | "izometri/"→tip | Evet |
| `devre_dokumanlari` | devre seviyesi ham dosya (+ `spool_id` 1:1 bağ) | Hayır |
| `spool_dokumanlari` | spool dosya referansı (sayfa aralık) — hedef, henüz bağlanmadı | Hayır |
| `dosya_isleme_kuyrugu` | async parse kuyruğu (+ `parse_sonuc._eslesme`) | Hayır |
| `alan_oncelik_kurallari` | füzyon kuralları | Evet |
| `excel_format_tanimlari` | Excel kolon öğrenme | Evet |
| `fuzyon_karar_log` | çelişki seçim logu | Hayır |

Diğer kararlar: çok-spoollu PDF tek kopya + N referans (97.7), ortak BOM `pipeline_malzemeleri`
(97.8), token limit→sayfa başına çağrı+kuyruk (97.9), soft delete 30 gün (97.12), RLS tek `ALL`
policy + `get_tenant_id()` (97.13).

**Kod durumu (oturum 127 gerçeği):**
- ✅ Format motoru: Aşama 0-1.8 (parse/tanıma/glyph/fitting) — kodlandı, çalışıyor.
- ✅ Wizard altyapı: migration 080, `devre_wizard.html` (4-panel) iskelet + drag-drop + Excel
  parser (99-101) + asenkron izometri drenajı (113/A) + kabuk önizleme + `ARES_KABUK.aktar` terfi.
- ✅ İzometri eşleştirme (canlı): `api/kuyruk-isle-izometri.js` — spool yolu (`spool_id`) + montaj
  yolu (`montaj_json`), terfi sonrası çalışır.
- ❌ Yazılmadı: **İnceleme & Onay ekranı** (devre_detay tabanlı, 4-durum), füzyon UI, **çapa görsel
  arayüzü**, taslak modu (`taslak_haric`/`taslak_not`), draft eşleştirme okuma endpoint'i.

---

## 16. Açık borçlar × faz + oturum 126-127'de netleşenler

| Borç | Wizard'la ilişki | Ne zaman |
|---|---|---|
| Pipeline eşleşme (MK-124.1, `E120-` önek) | Eşleştirme/İnceleme fazı | Wizard eşleştirme |
| Boş NOT parse (A-NOT) | Veri kalitesi | Wizard parse/İnceleme |
| Web-side spool durum sync (`aktif_basamak`/`ilerleme`) | Devre detay görünümü | Taslak/canlı elden geçerken |
| `boy_mm` int yuvarlama (`_tipCevir`) | İLGİSİZ (parse derininde) | AYRI, wizard sonrası |
| 117 (`yukleyen_id` null) | Wizard yeni vaka üretmez | Eski dosya/yükleme katmanı AYRI |
| Fitting (DIN 86087 / ASME B16.9) | İLGİSİZ | AYRI |
| `spool_dokumanlari` bağ tablosu bağlanmadı | N:N hedef mimari | Eşleştirme olgunlaşınca |

**MK-WIZARD açık soruları — durum (oturum 127):**
- kabuk→spool kayıt zamanı → **KAPANDI: terfide** (Bölüm 2).
- resim_no çıkarma regex → **netleşti:** `resim_no` kolonu yok; anahtar `normPipeline(dosya adı)|
  normSpoolNo`; format-spesifik regex işi = MK-124.1 (devam ediyor, ayrı).
- `spool_no_sablonu` ayrı tablo mı `izometri_format_tanimlari` kardeşi mi → **hâlâ açık** (K2 şablon).

---

## 16.B Oturum 125 — profesyonel kıyas & eleştiri kapanışı (bilinçli sınırlar)

Final omurga, profesyonel programlarla (AVEVA E3D / Smart 3D / ISOGEN / SpoolGen — izometri
*üretirler*; AresPipe çıktılarını *okur*, rakip değil tamamlayıcı; Voortman'a karşı interaktif
rapor avantajı, oturum 77) tartıldı. Çıkan eleştiriler ve kapanışları:

| # | Eleştiri | Kapanış (oturum 125) |
|---|---|---|
| 1 | Çapa ↔ image-PDF çelişkisi | **Bilinçli sınır.** Image-PDF (PAOR) tümüyle L3'e gider; yanında Excel varsa veri zaten orada, L3 kapalı, PDF görsel saklanır. Çapa/öğrenme yalnız text-PDF'te anlamlı. |
| 2 | Revizyon yönetimi sığ | **Kapsam dışı — mevcut sistemde çözülü.** Eski spool resmi iptal edilip pasife alınır, yenisi eklenir. Wizard yalnız rev no'yu okur. |
| 3 | Parça kimliği wizard'a bağlı değil | **Mevcut akışta var.** Malzeme listesi spool detay Malzeme sekmesine gider, normalize edilir, kütüphaneyle eşleşir. Wizard zinciri besler (Bölüm 10). |
| 4 | Eşzamanlılık belirsiz | **Kısmen çözülü.** Aynı devre 2. kez → hata (tekillik). İkiz gemiye yüklenebilir. Düşük öncelik açık: iki kullanıcı aynı taslağı aynı anda. |
| 5 | Tek-aşamalı onay | **Bilinçli sadelik** (KOBİ tersane). |
| 6 | 3D ertelenmiş | **Bilinçli erteleme** (FAZ 3, deterministik render MK-49.A). |

> **MK-125.2:** Image-PDF'te format öğrenme/çapa YOK; o devrede L3 kapalı, veri Excel/BOM'dan,
> PDF yalnız görsel. (İstisna: ne Excel ne metin → MK-125.1 L3'ü zorlar.)

**Kod-öncesi açık sorular — durum (oturum 127 kapanışı):**
- `resim_no` çıkarma regex'leri → **netleşti** (yukarıda; kolon yok, anahtar pipeline|spool, MK-124.1 devam).
- Kabuk onaylanınca spool kayıt zamanı → **KAPANDI: terfide.**
- K2 boş şablon üretim mantığı (`spool_no_sablonu` tablo yeri) → **hâlâ açık** (kolonlar onaylı, üretim SheetJS).

---

## 16.C Oturum 126-127 — İnceleme & Onay + kod-öncesi mimari (yeni)

**Oturum 126 (mockup turları, MK-126.1..8) — üretim kodu yazılmadı, bilinçli:**
tam İnceleme backend gerektiriyor, 127'ye bırakıldı. `devre_wizard_mockup.html` v5 onaylı tasarım
referansı. Yanlış başlangıç geri alındı: Tersan dosya adı çözücü sıfırdan yazılmıştı (`tersan-eslesme.js`),
oysa mantık zaten var (`izometri-oku` + `parser_kural` + fingerprint) → modül silindi (MK-126.8).

**Oturum 127 (kod-öncesi mimari) — MK-127.1..5 kilitlendi:**
- Mimari karar **A** (server-side okuma endpoint'i) seçildi; **B** (İnceleme canlı dolum, drenaj
  `onIlerleme`) onaylandı.
- İki eşleştirme yolu canlı koddan doğrulandı (spool `spool_id` / montaj `montaj_json`).
- "resim_no kolonu yok" + "kabuk→spool zamanı terfide" tespitleri belgeye işlendi.
- İzolasyon: `devre_wizard_v3.html` + flag `devre_wizard_v3`, pilot Demo Atölye.

> **MK-127.1 (YENİ) — Çakışma kapısı (kalıcı kural):** Wizard'a (v3 veya sonrası) **her dokunuşta,
> kod yazmadan önce** şu üçü taranır: (a) bu omurganın MK tablosu (Bölüm 17), (b) `.github/son-durum.md`
> açık borçlar, (c) son 2 oturum özeti. İstek bir kararla çelişiyorsa Claude **sessizce eski kuralı
> çiğneyerek ilerlemez** — "isteğin X kuralıyla çelişiyor" der, kullanıcı karar verir. (CLAUDE.md
> kural-çakışması protokolünün wizard'a özel, mekanik hâli. 22 oturumluk "ezbere güvenme" dersinin uygulaması.)

---

## 17. MK kararları özeti + atıf haritası

| MK | Karar | Kaynak |
|---|---|---|
| KARAR-97.0 | FK izolasyonu (yeni tablo mevcuta FK kurmaz) | V2-MIMARISI |
| KARAR-97.2/3/5 | Füzyon: alan başına 2 boyutlu skor, risk bazlı | V2-MIMARISI |
| KARAR-97.4 | Çelişki logu → 5+ karar = öneri | V2-MIMARISI |
| KARAR-97.6 | Windows Gezgini klasör görünümü | V2-MIMARISI |
| KARAR-97.7 | Çok-spoollu PDF: 1 kopya + N referans (`spool_dokumanlari` hedef) | V2-MIMARISI |
| MK-WIZARD.1 | Boş şablonu wizard üretir | MK-WIZARD |
| MK-WIZARD.2 | Eksik PDF ≠ eksik spool | MK-WIZARD |
| MK-WIZARD.3 | Kabuk kilidi | MK-WIZARD |
| MK-WIZARD.4 | "Doğrulanmadı" damgası | MK-WIZARD |
| MK-WIZARD.5 | N:N ilişki → `spool_dokumanlari` (hedef; canlı kod `spool_id`+`montaj_json`) | MK-WIZARD |
| MK-49.1 | `izometri-oku.js`'e DOKUNULMAZ | format/50 |
| MK-49.B | İzometri PDF wizard'da `izometri-oku`'ya yönlendirilir | MK-WIZARD |
| MK-51.2 | Format-spesifik `dosya_adi_regex` ≥5 gerçek örnekle test edilir | 51 |
| MK-118.5 | Sürüm bir facet; sürüm kayması = kısmi tanıma | format kılavuzu |
| MK-118.7 | İşaretleme koordinat değil ÇAPA | format kılavuzu |
| MK-118.8 | Üç statü: taslak→onaylı→evrensel | format kılavuzu |
| MK-118.9 | Eksik alan sessiz geçilmez; format-seviyesi oto-uygula (çapa) | format kılavuzu |
| MK-120.3 | Glyph = deterministik -29 Sezar (çapa-token dedektör) | format kılavuzu |
| MK-120.6 | L3 üç durumlu (otomatik/onaylı/kapalı), devre bazlı | format kılavuzu |
| MK-121.1 | Glyph onarımı KAPILI olmalı | format kılavuzu |
| MK-124.1 | Pipeline eşleşme borcu (`E120-` önek kaybı) | v3 / son-durum |
| MK-125.1 | Format yeni + L3 kapalı → L3'ü açmaya zorla | 125 |
| MK-125.2 | Image-PDF'te öğrenme/çapa yok; veri Excel'den, L3 kapalı, PDF görsel | 125 |
| MK-125.3 | Kabuk Excel zorunlu (güvenlik); eski K3 düştü; kaynak seçim ekranı yok | 125 |
| MK-125.4 | Wizard 2 adım (giriş+klasör → İnceleme); meta opsiyonel; iş emri terfide | 125 |
| MK-126.1 | Tersane seçilebilir (kilitli değil) | 126 |
| MK-126.2 | Onay: eksik = sert kilit değil, uyarı; eksik tamamlanır/bırakılır | 126 |
| MK-126.3 | Adlandırma "Mutabakat" → "İnceleme ve Onay"; sütun "Durum" | 126 |
| MK-126.4 | Onay bekleyen liste Devreler sayfasından; yöneticiye açık | 126 |
| MK-126.5 | Arka plan oto-işleme yok; client-loop manuel + beklemeye al/sürdür | 126 |
| MK-126.6 | Değer düzeltme spool-özel; format-yayılım yalnız çapada (118.9 netleşti) | 126 |
| MK-126.7 | İnceleme görünümü devre_detay tabanlı; üretim sütunları çıkar | 126 |
| MK-126.8 | Yeni modül/parser yazmadan önce mevcut kod + `parser_kural` + DB kontrol | 126 |
| MK-127.1 | Çakışma kapısı: wizard'a dokunmadan önce omurga+borç+son 2 oturum taranır | **bu oturum** |
| MK-127.2 | İzolasyon: `devre_wizard_v3.html` + flag `devre_wizard_v3`; v2 dokunulmaz; pilot Demo Atölye | **bu oturum** |
| MK-127.3 | A: İnceleme eşleştirmesi server-side okuma endpoint'i; primitifleri çağırır | **bu oturum** |
| MK-127.4 | Draft eşleştirme = okuma katmanı (spooller'a yazmaz); kanonik bağ terfide | **bu oturum** |
| MK-127.5 | 4-durum sinyalleri (kabuk × izometri parse, `bindirme_flag`/güven) | **bu oturum** |

---

## 18. Sonraki adım

1. ~~Omurga onaylanır~~ ✓ (125)
2. ~~Profesyonel program kıyaslaması~~ ✓ (Bölüm 16.B)
3. ~~Mockup — giriş/klasör/İnceleme/çapa~~ ✓ (125-126, mockup v5, KORUMA-3 ile sınandı)
4. ~~Kod-öncesi açık sorular netleşir~~ ✓ (127: resim_no/kabuk-zamanı kapandı, mimari A, izolasyon)
5. **Kod — FAZ 1 (oturum 127+):**
   a. Okuma endpoint'i (`/api/devre-inceleme`) — kabuk × izometri 4-durum, primitifleri çağırır (MK-127.3/4/5).
   b. `devre_wizard_v3.html` iskelesi — 2 adım, devre_detay tabanlı İnceleme, endpoint JSON'unu render (MK-126.7).
   c. B canlı dolum — drenaj `onIlerleme` → endpoint yeniden çağrı (Bölüm 12).
   d. Çapa/füzyon UI + taslak modu (`taslak_haric`/`taslak_not`) — sonraki fazlar.
   Sayfa pilot bitene kadar **canlıya alınmaz**; v2 flag arkasında durur.

---

## Sürüm geçmişi

| Sürüm | Tarih | Değişiklik |
|---|---|---|
| Omurga v1 | 2026-05-26 (125) | Dört belgenin (97/106/124 + 117-123 format motoru) tek sentezi; çapa evrimi mühürlendi (MK-118.7); MK-125.1; belge dağınıklığı kapatıldı |
| Omurga v2 | 2026-05-26 (125) | Eleştiri kapanışı; mockup turu; MK-125.3 (Excel zorunlu/K3 düştü), MK-125.4 (2 adım/meta opsiyonel/iş emri terfide) |
| Omurga v3 | 2026-05-26 (126) | İnceleme & Onay mockup turları; MK-126.1..8 (tersane seçilebilir, onay uyarı modeli, adlandırma, bekleyenler Devreler'de, oto-işleme yok, değer düzeltme spool-özel, görünüm devre_detay tabanlı, verification-first) |
| Omurga v3.1 | 2026-05-26 (127) | Kod-öncesi mimari: MK-127.1..5 (çakışma kapısı, izolasyon `devre_wizard_v3`+flag/Demo Atölye, A server-side okuma endpoint'i, draft eşleştirme okuma katmanı + kanonik terfide, 4-durum sinyalleri). Canlı kod doğrulamaları işlendi: `resim_no` kolonu yok → anahtar `normPipeline\|normSpoolNo`; iki eşleştirme yolu (`spool_id`/`montaj_json`); kabuk→spool zamanı = terfide (kapandı) |

> Bu belge tek kaynaktır. Karar değişikliği sürüm geçmişine işlenir; KORUMA-1/2/3 her fazda korunur.
> Eski belgeler (`DEVRE-WIZARD-VIZYON-v3`, `MK-WIZARD-DEVRE-YUKLEME`, `DEVRE-WIZARD-V2-MIMARISI`,
> `format-tanitma-kilavuzu`, `OMURGA-GUNCELLEME-126`) arşiv/kaynaktır; bu omurgaya atıf verilir.
