# Devre Wizard — OMURGA Belgesi (Final, Tek Kaynak)

> **AresPipe · Tek Omurga Tasarım Belgesi · 26 Mayıs 2026 (Oturum 125)**
>
> Bu belge, devre yükleme + format öğrenme akışının **tek ve güncel** referansıdır.
> Dört ayrı belgenin (97 mimarisi, 106 akışı, 124 omurgası, 117-123 format motoru) +
> oturum 125'te yapılan konsolidasyonun evrimleşmiş son hâlidir.
>
> **Kod yazmadan önce buraya bakılır.** Çelişki çıkarsa bu belge kazanır; eski belgeler arşivdir.

---

## 0. Bu belge ne / belge ekosistemi

Wizard tasarımı üç kez olgunlaştı (her biri öncekini çürütmedi, üstüne bindi):

| Belge | Oturum | Rolü | Bu omurgadaki yeri |
|---|---|---|---|
| `DEVRE-WIZARD-V2-MIMARISI.md` | 97 | Altyapı: 8 tablo, füzyon kuralları, migration 080 | KAYNAK (Bölüm 10, 15) |
| `MK-WIZARD-DEVRE-YUKLEME.md` | 106 | Akış: kabuk otoritesi, 5 adım, eşleştirme, soru politikası | KAYNAK (Bölüm 3-6, 11) |
| `DEVRE-WIZARD-VIZYON-v3.md` | 124 | Omurga: tek sayfa taslak modu, terfi | KAYNAK (Bölüm 2, 12-14) |
| `format-tanitma-kilavuzu.md` | 117-123 | Motor: facet tanıma, parse, glyph, **çapa** | KAYNAK (Bölüm 7-9) |
| `IZOMETRI-BATCH-KARAR.md` | 34-39 | Çapa kökeni (Karar 10 B+C) | ARŞİV (tarihsel) |
| `SPOOL-AI-VIZYON` + `VIZYON-MODULER` | — | Ürün felsefesi, katman yapısı | ÜST ÇATI |

**Sonuçtaki durum (oturum 125 tespiti):** motor hazır, kabuk yarım. Format tanıma/parse
motoru baştan sona kodlandı (Aşama 0-1.8). Wizard'ın tabloları + iskeleti + Excel parser'ı
yazıldı (97-101) ama mutabakat, füzyon UI, çapa arayüzü ve taslak modu hiç kodlanmadı.

### Koruma bantları (v3 Bölüm 9'dan — her fazda korunur)
- **KORUMA-1 — Yeniden yazma YOK, üstüne bin.** `izometri-oku`, drenaj client-loop (113/A),
  `devre_yeni` spool ID/QR/prefix üretimi — hepsi ÇAĞRILIR, kopyalanmaz.
- **KORUMA-2 — Açık borçlar wizard'a YEDİRİLMEZ.** Borçlar Bölüm 16'da kayıtlı, ayrı kapanır.
  İstisna: pipeline eşleşme borcu (MK-124.1) doğal olarak eşleştirme fazının parçası.
- **KORUMA-3 — Kararlar kilitli, UI detayı mockup'ta sınanır.** Mockup'ta tutmayan şey →
  belge değil o ekran düzeltilir.

---

## 1. Omurga fikir — tek sayfa, iki hâl (124)

**Wizard ayrı bir sayfa değildir; devre detay sayfasının "TASLAK MODU"dur.**

- **TASLAK:** turuncu "ÖNİZLEME" bandı + doğrulanmamış alanlar sarı + eksik/fazla spool
  mutabakatı görünür. Devre canlıya geçince nasıl görüneceğinin birebir simülasyonu.
- **CANLI:** onay sonrası aynı sayfa; bant kalkar, gerçek listeye düşer.

**Onay = taslağın canlıya terfisi.** Bu tek hamle "mevcut/yeni devre" ayrımını kaldırır,
önizleme→onay→canlı akışını kurar, taslak listesini bir sekmede bekletir.

---

## 2. Taslak nerede yaşar (124)

Taslak **gerçek bir devre DEĞİLDİR.** Onaya kadar `devreler`'de kayıt yok; spool ID, iş emri,
QR üretilmez. Mevcut katmandan **türetilir** (yeni staging tablosu YOK):
- Yüklenen dosyalar → `devre_dokumanlari` (var)
- Parse sonuçları → kuyruğun `parse_sonuc` JSONB'si (var)
- Excel kabuğu → parse edilmiş hâlde (var)

**Tek ekleme:** `devre_dokumanlari`'na `taslak_haric BOOLEAN` + `taslak_not JSONB` (klasör
işaretlemeleri + mutabakat düzeltmeleri kaybolmasın).

**Onay anı = terfi:** gerçek `devreler` INSERT + spool ID + QR. Bu, mevcut `devre_yeni.html`
mantığını **ÇAĞIRIR, KOPYALAMAZ** (KORUMA-1).

---

## 3. Kabuk otoritesi + üç hata sınıfı (106)

**Otorite kabuktur, PDF değil.** Bir klasördeki PDF'ler eksik/fazla/bozuk olabilir. Devrenin
spool listesi (kabuk) önce resmi kaynaktan kurulur; dökümanlar bu kabuğa karşı çetelelenir.

Üç hata sınıfı **asla sessizce geçmez:**
- **Eksik:** kabukta var, dökümanı yok/okunamadı
- **Fazla:** döküman var, kabukta yok
- **Şüpheli:** eşleşti ama parse zayıf / güven düşük

Mutabakat ekranı geçilmeden devre "tamamlandı" olmaz. "23/25 asla sessiz geçmez."

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

**Spool-no formatı (tenant bazlı, bir kez):** Kompozit ID (`NB1124-G200-350-FR38-Galv-S01`)
tersaneye göre değişir. Tek mekanizma: **her zaman parçalardan kur; hazır geleni parçalarına
ayırıp çapraz doğrula.** Format tenant'a kaydedilir (`spool_no_sablonu` taslağı), wizard'da önizlenir.

---

## 5. Giriş & klasör ağacı + revizyon ayıklama (124 + 106 + oturum 125)

> **MK-125.4 (oturum 125):** Wizard **iki adımdır** (5 değil): (1) Devre & Belgeler — devre tanımı +
> klasör yükleme TEK ekranda; (2) Mutabakat → Onay. Tersane kilitli (tenant tek seçenek), proje
> listeden seçilir. Sadece **proje + devre adı mecburi**; zone/malzeme/yüzey/termin/alıştırma
> opsiyonel ve girilirse dökümanlarla doğrulanır. İş emri no bu aşamada YOK — terfide üretilir.
> Belge yükleme alanı görünür alandadır; opsiyonel detaylar sayfa sonundadır.

1. **Tersane + proje seçilir** (tersane tenant'a göre tek); mevcut/yeni devre ayrımı YOK (tek akış).
   Devre detaydaki "Spool Ekle" bu akışa köprüdür, onaydan sonra devre detaya döner.
2. Sürükle-bırak sonrası **Windows-gezgini benzeri ağaç** (KARAR-97.6 — `klasor_yolu` korunur).
3. Kullanıcı eşleştirmeden ÖNCE klasörleri işaretler: "bilgi amaçlı" / "revizyon-öncesi" →
   eşleştirmeye sokulmaz. Yanlış eşleşmeyi kaynakta keser (fazla-spool vakalarının çoğunu eler).
4. Auto-detect: klasör adı → uzantı → `diger`; hidden/sistem dosya filtresi korunur.

**Ağaç wizard boyunca kalıcıdır** (sol panel). Parse durumu hem ağaçta (dosya yanında rozet)
hem mutabakatta (spool durumu) görünür — aynı gerçeğin iki açısı, A-oto ilerledikçe canlı güncellenir.

---

## 6. Eşleştirme — içerikten bağımsız (106)

**Kritik bulgu:** İzometri *içeriğini* parse edip eşleştirmek Tersan'da (text-PDF) çalışır,
PAOR'da (image-PDF) çalışmaz. İkisinde de ortak ve güvenilir olan **dosya adıdır**:

```
Eşleştirme anahtarı:  resim_no + spool_no   → image-PDF'te de çalışır (parse şart değil)
Proje kodu:           PDF "B1110" ↔ devre "NB1110" → 'N' ön-eki normalize edilir
```

**N:N ilişki (MK-WIZARD.5):** bir resim→çok spool (PAOR: tek çizimde [1]+[2]=S01+S02) +
bir spool→çok resim (detay+montaj). Bağ tablosu **`spool_dokumanlari`** (KARAR-97.7).

**Eksik PDF ≠ Eksik spool (MK-WIZARD.2):** Spool kabuktan gelir; PDF'i bugün gelmemiş olabilir.
Mutabakat "S07 eksik" derken spool'u silmez — "izometrisi henüz yok" der.

**Kabuk kilidi (MK-WIZARD.3):** Kabuk onaylanınca değişmez. "Aslında 26 spool varmış" çıkarsa
bilinçli geri-adım, sessizce 26'ya çıkmaz. Kabuk = imzalı sözleşme.

> **Açık borç — MK-124.1:** Parse `pipeline_no`'yu `722-1021-ALS` çıkarıyor, gerçek
> `E120-722-1021-ALS` — `E120-` öneki düşüyor → eşleşme sıfır. Önek normalizasyonu bu fazda çözülür.

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

> **MK-125.1 (YENİ — oturum 125):** Format yeni VE L3 kapalıysa, akış sessizce geçmez —
> kullanıcıyı "bu devre için L3'ü bir kerelik aç, yoksa bu spool'ları okuyamam" diye **zorlar**.
> Sağ kart (L3 kapalı, görsel sakla) ile orta kart (öğren) çelişkisi böyle çözülür.

---

## 9. Tanınan formatta eksik alan — sessiz hata yok (format kılavuzu B.10)

> **MK-118.9:** Eksik alan asla sessizce geçilmez; format-seviyesi düzeltme kuyruğun kalanına
> otomatik uygulanır.

Akış (10 PDF'lik kuyruk):
1. Eksik alan yüzeye çıkar (sessiz değil).
2. Sistem sorar: **"Bu düzeltme bu PDF'e mi, formatın tümüne mi?"** — varsayılan "formatın tümüne".
3. "Formatın geneli" → aile/firma katmanına yazılır; aynı aileden diğerleri otomatik yeniden
   değerlendirilir (kullanıcı 10 kez aynısını onaylamaz).
4. "Sadece bu PDF" → o kayda işlenir, kural değişmez.
5. Otomatik yeniden değerlendirme özeti gösterilir: "9 PDF işlendi, 7 çözüldü, 2'sinde eksik".

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

---

## 11. Mutabakat ekranı — değişmez kalp (106 + 124)

Taslak modunun ana alanı. Kabuk = otorite. Dört durum:

| Durum | Renk | Anlam | Davranış |
|---|---|---|---|
| Eşleşen + okundu | 🟢 yeşil | kabukta var, parse güçlü | tamam |
| Eşleşen, parse zayıf | 🟡 sarı | kabukta var, güven düşük | "doğrulanmadı" damgası → kontrol/Düzelt |
| Eksik | 🔴 kırmızı | kabukta var, PDF yok | "S07 için döküman yok" (spool silinmez) |
| Fazla | 🟠 turuncu | PDF'te var, kabukta yok | **sessizce eklenmez — SORAR** |

Sarı bir alanda "Düzelt →" → çapa işaretleme (Bölüm 8) açılır. Bu ekran temizlenmeden onay yok.

**"Doğrulanmadı" damgası (MK-WIZARD.4):** PDF'ten okunan ama teyit edilmemiş alan → sarı,
sonradan teyit edilebilir. Sistem uydurmaz, "emin değilim" der.

**Soru sorma politikası (MK-WIZARD, "bu mu/bu mu", asla sınav):** sadece cevabı bir şeyi
değiştiren belirsizlikte sor. Net eşleşme → sessiz kabul. Eşleştirme sorusu (ucuz, akış içi) ve
kabuk sorusu (pahalı, ayrı/vurgulu) karıştırılmaz.

---

## 12. Arka plan işleme — A-oto + hibrit (124)

**Mevcut (113/A):** drenaj tarayıcıda döner (client-loop), server→server yok → Vercel 508
kökten çözülmüş. Helper lock'suz/atomik → sekme kapanırsa yarım iş `bekliyor`'da kalır, hata'ya
düşmez, tekrar işlenir. En kötü ihtimal: bir PDF iki kez parse (birkaç kuruş / bedava L2).

**Faz şimdi — A-oto:** yükleme bitince drenaj kendi başlar (kullanıcı butona basmaz); tur bitince
`kalan>0` ise döngü kendini sürdürür (retry, helper ~188 eksik). Takas: işlenirken sekme açık kalmalı.

**Faz sonra — B (eşiğe bağlı):** `izometri-oku` modüle çıkar, server worker import eder, Cron sürer,
sekme serbest. Eşik: "ilk-görülen-format + 100+ spool devresi düzenli + sekme şikayeti". Asıl
kaldıraç B değil **L2 öğrenme** — format öğrenilince 150 spool saniyeler sürer, sekme derdi buharlaşır.

---

## 13. L3 maliyet kontrolü — devre bazlı (124 + format kılavuzu 12.1)

L3 üç durumlu: **otomatik / onaylı / kapalı**, devre (ve belge-tipi) bazında (MK-120.6).
Varsayılan otomatik, kullanıcı kapatabilir.

**PAOR örneği:** taranmış izometri (L2 metin çıkaramaz, L3 pahalı) AMA o devrenin Excel'i
(IFS/BOM) spool+malzemeyi zaten veriyor → izometriden veri çıkarmaya gerek yok, sadece görsel
`'sakla'`. Bu devrede L3 kapalı → sıfır maliyet. (İstisna: format yeni + L3 kapalı → MK-125.1 zorlar.)

---

## 14. Taslak → onay → canlı terfi (124)

"Devreyi Onayla" → gerçek `devreler` INSERT + spool ID atama + QR üretimi + canlı listeye düşme +
D-katmanı veri damarına akış. Bu hamle `devre_yeni.html` mantığını ÇAĞIRIR (KORUMA-1). Onaydan
sonra aynı sayfa CANLI hâle döner; taslak bandı kalkar.

---

## 15. Altyapı + kod durumu (97 + bugünkü gerçek)

**8 tablo (migration 080, 97'de yazıldı, 98'de çalıştırıldı):**

| Tablo | Ne tutar | tenant_id NULL? |
|---|---|---|
| `dokuman_tipleri` | uzantı→parser yolu | Evet |
| `klasor_isim_sozluk` | "izometri/"→tip | Evet |
| `devre_dokumanlari` | devre seviyesi ham dosya | Hayır |
| `spool_dokumanlari` | spool dosya referansı (sayfa aralık) | Hayır |
| `dosya_isleme_kuyrugu` | async parse kuyruğu | Hayır |
| `alan_oncelik_kurallari` | füzyon kuralları | Evet |
| `excel_format_tanimlari` | Excel kolon öğrenme | Evet |
| `fuzyon_karar_log` | çelişki seçim logu | Hayır |

Diğer kararlar: çok-spoollu PDF tek kopya + N referans (97.7), ortak BOM `pipeline_malzemeleri`
(97.8), token limit→sayfa başına çağrı+kuyruk (97.9), soft delete 30 gün (97.12), RLS tek `ALL`
policy + `get_tenant_id()` (97.13).

**Kod durumu (oturum 125 gerçeği):**
- ✅ Format motoru: Aşama 0-1.8 (parse/tanıma/glyph/fitting) — kodlandı, çalışıyor.
- ✅ Wizard altyapı: migration 080, `devre_wizard.html` iskelet + drag-drop + Excel parser (99-101).
- ❌ Yazılmadı: füzyon UI, mutabakat ekranı, **çapa görsel arayüzü (format kılavuzu Aşama 4)**,
  taslak modu, terfi mantığı.

---

## 16. Açık borçlar × faz + oturum 125'te netleşenler

| Borç | Wizard'la ilişki | Ne zaman |
|---|---|---|
| Pipeline eşleşme (MK-124.1, `E120-` önek) | Eşleştirme/mutabakat fazı | Wizard eşleştirme |
| Boş NOT parse (A-NOT) | Veri kalitesi | Wizard parse/mutabakat |
| Web-side spool durum sync (`aktif_basamak`/`ilerleme`) | Devre detay görünümü | Taslak/canlı elden geçerken |
| `boy_mm` int yuvarlama (`_tipCevir`) | İLGİSİZ (parse derininde) | AYRI, wizard sonrası |
| 117 (`yukleyen_id` null, ~11 dosya) | Wizard yeni vaka üretmez | Eski dosya temizliği AYRI |

**MK-WIZARD açık soruları (106, hâlâ kalan):** K1/K2/K3 sadeleştirme?; `spool_no_sablonu` ayrı
tablo mı `izometri_format_tanimlari` kardeşi mi?; kabuk→spool kaydı ne zaman (`spooller`'a hemen mi
mutabakat sonrası mı)?; resim_no çıkarma regex'leri (Tersan/PAOR).

**Oturum 125'te netleşenler:**
- Çapa = MK-118.7 (koordinat değil metin-çapası). Üç kaynaktaki kayıt çelişki değil evrimdi.
- MK-125.1: format yeni + L3 kapalı → L3'ü açmaya zorla.
- MK-125.3: kabuk Excel zorunlu, eski K3 (PDF'ten çıkar) düştü, kaynak seçim ekranı yok.
- MK-125.4: wizard 2 adım (Devre & Belgeler tek ekran → Mutabakat → Onay); meta opsiyonel; iş emri terfide.
- Format öğrenme akışı (B.8-9) wizard mutabakat ekranının içinde yaşar (Aşama 4 = mutabakat çapa UI).
- Tüm wizard ekranları mockup'landı (KORUMA-3): giriş+klasör → kabuk hazır → mutabakat 4 durum → çapa işaretleme.
- Belge dağınıklığı kapatıldı: bu omurga belge tek kaynak; v3 + 106 + 97 + format kılavuzu atıf/arşiv.

---

## 16.B Oturum 125 — profesyonel kıyas & eleştiri kapanışı (bilinçli sınırlar)

Final omurga, profesyonel programlarla (AVEVA E3D / Smart 3D / ISOGEN / SpoolGen — izometri
*üretirler*; AresPipe çıktılarını *okur*, rakip değil tamamlayıcı; Voortman'a karşı interaktif
rapor avantajı, oturum 77) tartıldı. Çıkan eleştiriler ve kapanışları:

| # | Eleştiri | Kapanış (oturum 125) |
|---|---|---|
| 1 | Çapa ↔ image-PDF çelişkisi | **Bilinçli sınır.** PAOR gibi image-PDF zaten tümüyle L3'e gider. Ama yanında Excel varsa, PDF'teki veri Excel'de zaten olduğundan boş yere L3'e gönderip token yakılmaz: L3 kapalı, PDF görsel saklanır, veri Excel'den gelir. Çapa/öğrenme yalnızca text-PDF'te anlamlı. (PAOR'a özel detay o formata çalışırken konuşulacak.) |
| 2 | Revizyon yönetimi sığ | **Kapsam dışı — mevcut sistemde çözülü.** Revizyonda eski spool resmi iptal edilip pasife alınır, yenisi eklenir (revizyonlar zaten takip ediliyor). Wizard yalnızca yüklenen spool bilgisindeki rev no'yu okur; rev-diff wizard işi değil. |
| 3 | Parça kimliği wizard'a bağlı değil | **Mevcut akışta var.** Excel/PDF'ten çekilen malzeme listesi spool detay sayfasının Malzeme sekmesine gider, orada normalize edilir ve kütüphaneyle eşleşip parça olarak tanınır. Wizard bu zinciri besler (Bölüm 10). |
| 4 | Eşzamanlılık belirsiz | **Kısmen çözülü.** Aynı devre aynı gemiye 2. kez yüklenmeye çalışılırsa hata verir (tekillik). Aynı projeyle yapılan ikiz gemiye yüklenebilir. *Gelecek özellik:* aynı devre iki farklı gemide → kıyaslama. *Düşük öncelik açık konu:* iki kullanıcı aynı taslağı aynı anda açarsa (nadir, küçük ekip). |
| 5 | Tek-aşamalı onay | **Bilinçli sadelik** (KOBİ tersane; çok-aşamalı sign-off fazla). |
| 6 | 3D ertelenmiş | **Bilinçli erteleme** (Claude önerisi; FAZ 3, deterministik render MK-49.A). |

> **MK-125.2 (YENİ):** Image-PDF'te (taranmış izometri) format öğrenme/çapa YOK; o devrede L3
> kapalı tutulur, veri Excel/BOM'dan alınır, PDF yalnızca görsel saklanır. Token, verinin başka
> kaynakta zaten bulunduğu yerde yakılmaz. (İstisna: ne Excel ne metin var → MK-125.1 L3'ü zorlar.)

**Kod öncesi netleşmesi gereken açık sorular (FAZ 1 ön koşulu, MK-WIZARD Madde 10):**
- `resim_no` çıkarma regex'leri (Tersan pipe-no gövdesi / PAOR çizim no — dosya adı desenleri).
- Kabuk onaylanınca spool'lar `spooller`'a hemen mi, mutabakat sonrası mı yazılır.
- K2 boş şablon üretim mantığı (`spool_no_sablonu` ayrı tablo mı, `izometri_format_tanimlari` kardeşi mi).

---

## 17. MK kararları özeti + atıf haritası

| MK | Karar | Kaynak |
|---|---|---|
| KARAR-97.0 | FK izolasyonu (yeni tablo mevcuta FK kurmaz) | V2-MIMARISI |
| KARAR-97.2/3/5 | Füzyon: alan başına 2 boyutlu skor, risk bazlı | V2-MIMARISI |
| KARAR-97.4 | Çelişki logu → 5+ karar = öneri | V2-MIMARISI |
| KARAR-97.6 | Windows Gezgini klasör görünümü | V2-MIMARISI |
| KARAR-97.7 | Çok-spoollu PDF: 1 kopya + N referans | V2-MIMARISI |
| MK-WIZARD.1 | Boş şablonu wizard üretir | MK-WIZARD |
| MK-WIZARD.2 | Eksik PDF ≠ eksik spool | MK-WIZARD |
| MK-WIZARD.3 | Kabuk kilidi | MK-WIZARD |
| MK-WIZARD.4 | "Doğrulanmadı" damgası | MK-WIZARD |
| MK-WIZARD.5 | N:N ilişki → `spool_dokumanlari` | MK-WIZARD |
| MK-49.B | İzometri PDF wizard'da `izometri-oku`'ya yönlendirilir | MK-WIZARD |
| MK-118.5 | Sürüm bir facet; sürüm kayması = kısmi tanıma | format kılavuzu |
| MK-118.7 | İşaretleme koordinat değil ÇAPA | format kılavuzu |
| MK-118.8 | Üç statü: taslak→onaylı→evrensel | format kılavuzu |
| MK-118.9 | Eksik alan sessiz geçilmez; format-seviyesi oto-uygula | format kılavuzu |
| MK-120.3 | Glyph = deterministik -29 Sezar (çapa-token dedektör) | format kılavuzu |
| MK-120.6 | L3 üç durumlu (otomatik/onaylı/kapalı), devre bazlı | format kılavuzu |
| MK-121.1 | Glyph onarımı KAPILI olmalı | format kılavuzu |
| MK-124.1 | Pipeline eşleşme borcu (`E120-` önek kaybı) | v3 / son-durum |
| MK-125.1 | Format yeni + L3 kapalı → L3'ü açmaya zorla | **bu oturum** |
| MK-125.2 | Image-PDF'te öğrenme/çapa yok; veri Excel'den, L3 kapalı, PDF görsel | **bu oturum** |
| MK-125.3 | Kabuk Excel zorunlu (güvenlik); eski K3 düştü; kaynak seçim ekranı yok | **bu oturum** |
| MK-125.4 | Wizard 2 adım (giriş+klasör → mutabakat); meta opsiyonel; iş emri terfide | **bu oturum** |

---

## 18. Sonraki adım

1. ~~Omurga onaylanır~~ ✓ (oturum 125)
2. ~~Profesyonel program kıyaslaması~~ ✓ — eleştiriler kapandı (Bölüm 16.B)
3. ~~Mockup — giriş/klasör/mutabakat/çapa~~ ✓ (oturum 125, KORUMA-3 ile sınandı)
4. **Kod-öncesi açık sorular netleşir:** `resim_no` regex (Tersan/PAOR), kabuk→spool kayıt zamanı, K2 şablon mantığı.
5. **Kod — FAZ 1**, küçük cerrahi (KORUMA-1/2/3). Motor hazır, kabuk yazılır.

---

## Sürüm geçmişi

| Sürüm | Tarih | Değişiklik |
|---|---|---|
| Omurga v1 | 2026-05-26 (125) | Dört belgenin (97/106/124 + 117-123 format motoru) tek sentezi; çapa evrimi mühürlendi (MK-118.7); MK-125.1 eklendi; belge dağınıklığı kapatıldı |
| Omurga v2 | 2026-05-26 (125) | Eleştiri kapanışı; mockup turu (giriş+klasör tek ekran, kabuk hazır, mutabakat, çapa); MK-125.3 (Excel zorunlu/K3 düştü), MK-125.4 (2 adım/meta opsiyonel/iş emri terfide) |

> Bu belge tek kaynaktır. Karar değişikliği sürüm geçmişine işlenir; KORUMA-1/2/3 her fazda korunur.
> Eski belgeler (`DEVRE-WIZARD-VIZYON-v3`, `MK-WIZARD-DEVRE-YUKLEME`, `DEVRE-WIZARD-V2-MIMARISI`,
> `format-tanitma-kilavuzu`) arşiv/kaynaktır; bu omurgaya atıf verilir.
