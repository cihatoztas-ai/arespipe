# İzometri Batch — Mimari Karar Dokümanı

> **İlk yazım:** 26 Nisan 2026 — 34. oturum (tasarım + Ekran 1 frontend)
> **Son güncelleme:** 27 Nisan 2026 — 36. oturum (mimari sağlamlaştırma + halüsinasyon koruması)
> **Statü:** Mimari kararlar net. K6 (34) iptal edildi → K5 (36) ile değiştirildi. K11-K14 (36) eklendi. Ekran 1 frontend iskeleti yazıldı (demo modu). Backend + Ekran 2-3 sonraki oturumlarda.
> **Bağlantılı:** `docs/IZOMETRI-BATCH-NOTLARI.md` (brief, bu doküman onun üstüne inşa edildi)

---

## ⚠ 36. Oturum Güncellemeleri — Önce Oku

37. oturum açılışında bu bölüm okunur. Eski Karar 1-10 hâlâ geçerli, ama 4 önemli değişiklik var:

### Değişen Karar

- **K6 (34) — İPTAL.** Eski karar: *"Mevcut `izometri-oku.js` refactor edilir, atılmaz."*
  - **Sebep:** 36'da Cihat *"deneme için yapılmıştı, sıfırdan yazıp devam edelim"* dedi.
  - **Yeni K5 (36)** geçerli: izometri-oku.js sıfırdan yazılır.

### Yeni Kararlar (36'da alındı)

- **K1 (36) — 8 maddeli sağlam mimari** (boru standartları): tablo adlandırma + standart sözlüğü + NPS↔DN eşleme + schedule iki kolona ayrıldı + tolerans alanları + edisyon takibi + hesaplı kolonlar + hub içeriği.
- **K2 (36) — Çok-standart genişleme stratejisi:** 12 standart sözlüğü (4 aktif + 8 hazır tanım). Yeni standart eklemek = SQL INSERT, kod değişikliği yok.
- **K3 (36) — Halüsinasyon koruması:** AI'ın PDF okurken uydurması (Cihat'ın PAOR örneğindeki gibi: "52900-101540" yerine "50600-101358") DB seviyesinde tespit edilir. 7 maddeli şüpheli satır kriterleri.
- **K4 (36) — Yaklaşım Y:** AI'a "uydurma" demek yetersiz. Yapı: AI sadece **yazılı olanı okur**, hesaplama kod tarafında. Et/cap/ağırlık önce PDF'ten, yoksa `boru_olculer`'dan, yoksa manuel onay.
- **K5 (36) — Eski `izometri-oku.js` atılır:** K6 (34) iptal. Pilot AVEVA-PAOR satırı `parser_kural` BOŞ olarak DB'de duruyor — 37'de Format Kaydet ile dolacak.

### 7 Maddeli Şüpheli Satır Kriterleri (K3 detayı)

1. DN bulunamadı (zorunlu alan boş)
2. Çap-DN tutarsız (`boru_olculer` tablosunda eşleşmiyor)
3. Et kalınlığı tolerans dışı (`et_min` ≤ pdf_et ≤ `et_max` sınırı)
4. Boy negatif veya saçma (>50000 mm)
5. **Pipeline_no formatı dosya adıyla uyuşmuyor** (HALÜSİNASYON KORUMASI — kritik)
6. AI güven skoru düşük (<70%)
7. Malzeme bilinmeyen (sözlükte yok)

DB kolon: `izometri_batch_kayitlari.dogrulama_uyarilari JSONB` — spool başına liste tutulur.

---

## Bağlam

İzometri PDF batch parser — farklı CAD program çıktılarını (AVEVA E3D, CAESAR II, Smart 3D, vb.) AresPipe sistemine otomatik çevirme özelliği. Mevcut yarım altyapı (`api/izometri-oku.js` + `izometri-batch.html`) tek formata kilitli (PAOR/AVEVA), 502 hatası vermiyor ama **yanlış sonuç üretiyor** (36'da Cihat keşfetti — AI uydurma davranışı). Bu doküman sıfırdan doğru mimariyi yazıya döker.

**34. oturum disiplini:** Brief'in Madde 18'i gereği oturum tasarım oturumu olarak başladı. Cihat'ın açık talimatıyla son aşamada Ekran 1 frontend yazımına geçildi. Backend ve Ekran 2-3 sonraki oturumlara bırakıldı.

**36. oturum disiplini:** Mimari sağlamlaştırma. 8 madde tespit, DB altyapısı kuruldu (3+3 = 6 yeni tablo). Kod yazımı 37'ye bilinçli erteleme.

---

## Karar 1 — Mimari: DB-driven (Seçenek C)

**Seçim:** Format kuralları **dış veri** olarak DB'de yaşar, kod sabit kalır.

**Reddedilen alternatifler:**
- A (tek dosya hardcoded): yeni format eklemek = kod commit + deploy. Dosya şişer. **Cihat'ın itirazı:** "tek dosyada toplayıp şişirmeden farklı formatlar için kullanmak istiyoruz"
- B (format başına ayrı dosya): kod dağılır, hâlâ deploy gerekir
- Karma: ek karmaşıklık, fayda yok

**Sebep:** Cihat'ın gerçek durumu — *"müşterinin formatını bilemeyiz, her batch yeni format olabilir"* — A ve B'yi mümkün kılmaz. Format önceden bilinmiyor → kod önceden yazılamaz → **dış veriden okumak zorunlu**.

**Sonuç:** `izometri-batch.html` ve `api/izometri-oku.js` tek dosya olarak kalır. Format eklemek için kod değişikliği yok, sadece DB INSERT.

---

## Karar 2 — Tenant İzolasyonu: Tenant-scope + Cihat onayıyla genelleştirme

**Seçim:** İki seviyeli format yaşam döngüsü.

**Faz 1 — Tenant-scope:**
- Yeni format kuralı önce **sadece o tenant için** kaydedilir (`tenant_id = X`)
- Diğer firmalar etkilenmez
- Yanlış kural sadece kendi firmasına zarar verir, sınırlı risk

**Faz 2 — Genelleştirme (Cihat onayı):**
- 5+ başarılı kullanım sonrası sistem Cihat'a (sistem sahibi) bildirim gönderir
- *"X firmasında 'AVEVA-PAOR' formatı 8 kez sorunsuz çalıştı. Tüm firmalar için açalım mı?"* [Evet] [Hayır] [Daha Bekle]
- Cihat: Evet → `tenant_id = NULL` (sistem geneli) olur

---

## Karar 3 — Süper admin test laboratuvarı sayfası: İPTAL

**Seçim:** Brief'in 12. maddesindeki "süper admin test laboratuvarı" sayfası yapılmaz. Format öğrenme süreci `izometri-batch.html` sayfası içinde çözülür.

**Sebep:** Cihat'ın kararı — *"süper admin kısmını devreden çıkarabiliriz, bunu sayfa içinde çözmemiz lazım."* Felsefe ile uyumlu (AresPipe ek iş çıkarmaz, ek sayfa açmaz).

**Boşluğu nasıl doldurduk:** Karar 2'deki tenant-scope, süper admin laboratuvarının "kötü kural yayılmasını önle" işlevini üstlendi.

---

## Karar 4 — Vision API Maliyet Kontrolü

**Eşik:** Tenant başına ayda **50 PDF** Vision API çağrısı (default).

**Aşılırsa:** Otomatik blok DEĞİL — sadece uyarı bildirimi:
1. Firma yöneticisine in-app bildirim
2. Cihat'a (sistem sahibi) e-posta/bildirim

**Sebep:** Cihat hacmi henüz bilmiyor (*"sistem hayata geçince göreceğiz"*). Konservatif başla, sistem ölçsün, 3 ay sonra eşik gerçek kullanıma göre ayarlansın.

**Maliyet/teknik göstergeler kullanıcı sayfasında YOK** — Cihat kararı: `admin/panel.html`'e yeni "AI API Kullanım" sekmesi eklenecek (40+ oturumda mockup).

---

## Karar 5 — Sıralama: ASME Lookup ÖNCE (A1)

**Seçim:** Brief Madde 15'in 1. sırası uygulanır — **A18-19 ASME Lookup tam sistemi izometri batch'ten ÖNCE** yapılır.

**Reddedilen alternatif:** A2 (hardcoded başla, sonra refactor) — Cihat sağlamlığı hıza tercih etti.

**Sonuç:**
- **35. oturum:** ASME Lookup tam sistemi (DB tablosu, helper'lar, 358 satır veri) ✅
- **36. oturum:** Mimari sağlamlaştırma (8 madde — K1/36) + İzometri Batch DB altyapısı ✅
- **37. oturum:** Backend dispatcher (sıfırdan, K5/36) + Ekran 2 (manuel onay)
- **38+:** Ekran 3 (Format Kaydet) + diğer parçalar

---

## Karar 6 — ⚠ İPTAL EDİLDİ (36'da)

> **Eski karar (34):** Mevcut `izometri-oku.js` refactor edilir, atılmaz. Sistem prompt'u DB'ye taşınır.
>
> **İPTAL nedeni (36):** Cihat *"mevcuttaki izometri-oku dosyası deneme için yapılmıştı, bunu düzeltmeye uğraşmayalım. Sıfırdan yazıp devam edelim"* dedi.
>
> **Yerine geçen:** **K5 (36)** — Yeni `api/izometri-oku.js` sıfırdan yazılır. Pilot AVEVA-PAOR satırı `parser_kural` BOŞ olarak DB'de durur, 37'de Format Kaydet ile dolacak.

---

## Karar 7 — Eğitim Modu: PDF + Opsiyonel IFS Excel

**Seçim:** Format öğrenmeyi hızlandırmak için Excel referansı opsiyonel destek.

**Akış:**
- Yeni format ilk yüklendiğinde Vision API çağrılır → manuel onay → "Format Kaydet" diyalogu (Ekran 3)
- Diyalogda **opsiyonel IFS Excel upload alanı** — kullanıcı yüklerse:
  - Sistem PDF tahmini (Vision çıktısı) ile Excel ground truth'unu **karşılaştırır**
  - Kural taslağı **garantili doğru** çıkar
  - DB alanı: `egitim_kaynagi = 'pdf_excel'`
- Excel yoksa: sadece manuel düzeltmelerden öğrenir (`egitim_kaynagi = 'vision_only'`)

**Mimari etki:** Drop zone, batch sonuç ekranı, manuel onay ekranı **değişmez**. Yalnızca Ekran 3 (Format Kaydet) Excel upload alanı içerir.

**Sebep:** Cihat'ın araştırması — IFS kullanan firmalarda Excel var (~%50), diğerlerinde yok. Sürekli çift kaynak modu yerine tek seferlik eğitim modu yeterli.

---

## Karar 8 — Aynı Batch = Aynı Format

**Seçim:** Bir batch'te yüklenen tüm PDF'ler **aynı CAD projeden** gelen PDF'lerdir, hepsi aynı formattadır.

**Cihat'ın düzeltmesi:** *"5 PDF'ten 3'ü bir format 2'si başka format olmaz zaten. Bir devreye ait spoollara ait olur."*

**Mimari basitleştirme:**
- Format eşleşmesi **batch başına bir kez** yapılır (ilk PDF analizine göre)
- Format tanınmadıysa → **tüm batch bilinmeyen format**
- Format öğrenildiğinde (Format Kaydet) → **kalan tüm PDF'ler otomatik tanınır, manuel onay listesinden düşer**
- "Çoklu format karışık batch" senaryosu YOK

**Manuel onayın asıl amacı:** Format farklılığı değil, **AI yanlış okuma düzeltme**. Tanınan formatta bile bir alanı yanlış çıkarmış olabilir → o spool manuel onay listesine düşer (sağlık uyarısı veya düşük güven).

**UI etkisi:**
- Ekran 1: "Manuel Onay (X)" butonu — X = tüm batch'teki şüpheli spool sayısı
- Ekran 2: "PDF 2/5" navigasyonu fazla — sadece "Şüpheli Spool 3/9" yeter

---

## Karar 9 — Aynı Program, Farklı Şablon: Mevcut Mimari Destekliyor

**Cihat'ın gözlemi:** *"Aynı programdan türetilmiş ama farklı sayfa tasarımında izometri olamaz mı?"*

**Cevap:** Evet, çok normal. Aynı CAD program (örn. AVEVA E3D) farklı tersaneler/projeler için farklı sayfa şablonu üretebilir.

**Çözüm:** Karar 1'deki DB-driven mimari zaten bunu destekliyor. Format kayıtları:
- "AVEVA E3D — Tersane X Şablonu"
- "AVEVA E3D — Tersane Y Şablonu"
- "AVEVA E3D — PAOR Projesi"

Her biri ayrı satır. `fingerprint` JSONB'si o şablonun tanıma kurallarını tutar. Parser dispatcher uygun olanı eşleştirir.

---

## Karar 10 — Format Tanıtma: B + C Kombinasyonu

**Cihat'ın asıl kritik sorusu:** *"Formatı ilk yüklediğimizde nerede ne var nasıl tanıtacağız?"*

**Seçim:** **B (AI öğretmen + Cihat onayı) + C (görsel işaretleme — gerekirse)** karma yaklaşım.

**Akış (Ekran 3 — Format Kaydet diyalogu):**

1. **B Adımı (otomatik AI önerisi):**
   - Sistem onaylanmış spool verilerinden **kendi haritayı önerir**
   - Pipeline No, Spool No, Malzeme tablosu, Çap, Et, vb. her alan için
   - Her alan için **güven skoru** (yüzde olarak)
   - Excel varsa cross-check otomatik (Karar 7)

2. **Cihat onay/düzeltme:**
   - Yeşil ✓ alanlar (95%+ güven) — onay yeter
   - Sarı ⚠ alanlar (50-90% güven) — Cihat kontrol etmeli
   - "Düzelt →" butonu açar **C bölümüne** (görsel işaretleme)

3. **C Adımı (görsel işaretleme — opsiyonel, sadece düzeltme için):**
   - PDF preview üzerinde Cihat **kutucukla doğru alanı işaretler**
   - Canvas tabanlı (pdf.js + drawing layer)
   - AI o koordinatları öğrenir, kural taslağı güncellenir

4. **Kayıt:**
   - "Kaydet ve Diğer PDF'lere Uygula" → tenant-scope'da DB'ye yazılır
   - Bu batch'in kalan PDF'leri otomatik tanınır

**Reddedilen alternatifler:**
- **A** (sadece form doldurma): kullanıcıya çok manuel iş
- **C tek başına**: canvas drawing yeterli geliştirme süresi yok
- **B tek başına**: AI yanlış öneri yaparsa düzeltme mekanizması olmaz

**Geliştirme önceliği:** B önce (38. oturum), C sonra (39. oturum).

---

## Karar 11 (36) — 8 Maddeli Sağlam Boru Standart Mimarisi

**Cihat'ın kritik sorusu:** *"Bu standartlar programın can damarı olacak, sistemi tam anlamıyla doğru kurmak için şu an eksik yaptığımız bir şey varsa düzeltelim."*

**Tespit edilen 8 eksik (36'da çözüldü):**

1. **Tablo adlandırma:** Boru ölçüleri için `boru_olculer`. Fitting/flanş için ayrı tablolar (37-38'de).
2. **Standart sözlüğü zenginliği:** `olcu_sistemi` (metric/imperial/hybrid), `dn_sistemi` (DN/NPS/NB/NS), `materyal_kodu_listesi` JSONB. PDF'te "P235GH" geçerse → DIN/EN olduğu sözlükten anlaşılır.
3. **NPS↔DN eşleme ayrı tabloda** (`boru_dn_isim_eslesme`): standart bazlı, hardcoded değil. ASME için 171 satır eklendi.
4. **Schedule iki kolona ayrıldı:** `schedule_tipi` (SCH/PN/BAR/GRADE/CLASS) + `schedule_deger`. Görüntüleme için `schedule_kod` (örn. 'SCH40', '20bar', 'PN16').
5. **Tolerans alanları:** `tolerans_et_yuzde` (default ±%12.5 ASME pratiği), `et_min_mm` ve `et_max_mm` GENERATED kolonlar.
6. **Edisyon takibi:** `edisyon_yili`, `gecerlilik_basla`, `gecerlilik_bitis`. Eski/yeni edisyon farkları için kritik.
7. **Hesaplı kolonlar GENERATED:** `ic_cap_mm`, `hacim_l_m`, `yuzey_alan_dis_m2_m`. Helper'da değil veride. Hub sayfasında SEO için zenginleştirilmiş.
8. **Hub içeriği hazır:** `slug`, `aciklama_tr`, `aciklama_en`, `kullanim_sektor`. Yeni site açılınca SEO/lead gen sıfır iş.

**Sonuç:** 358 satır boru ölçüsü + 12 standart sözlüğü + 171 NPS eşleme. Eski `asme_borular` ve `cuni_borular` tabloları korundu (35 helper'ı kırılmasın), 37-38'de helper yeni yapıya taşındıktan sonra silinecek (G-10).

---

## Karar 12 (36) — Çok-Standart Genişleme Stratejisi

**Sebep:** Tersane her türlü gemiye hizmet veriyor. ASME, DIN, JIS, GOST, GB/T standartları sürekli karşılaşılır.

**Çözüm:** Sözlüğe **önceden tanım** eklendi (veri yok ama PDF'te tanınır).

**Aktif (veri yüklü):** 4 standart
- ASME-B36.10M (karbon, 214 satır)
- ASME-B36.19M (paslanmaz, 70 satır)
- ASTM-B241 (alüminyum, 50 satır)
- EEMUA-144 (cunife, 24 satır)

**Hazır tanım (veri yok):** 8 standart
- DIN-2448, EN-10220, JIS-G3452, JIS-G3454, GOST-3262, GOST-8732, GB/T-3091, GB/T-8163

**Yeni standart eklemek:**
```sql
-- 1. Veri ekle
INSERT INTO boru_olculer (standart, malzeme_grubu, dn, ...) VALUES ('JIS-G3452', ...);
-- 2. Sözlükte aktif et
UPDATE boru_standart_sozluk SET veri_var = true WHERE standart = 'JIS-G3452';
```

Kod değişikliği yok. PDF'te "JIS G3452" geçerse sistem tanır, doğru tabloyu sorgular.

**G-11 defter:** Fitting (~9 standart kombinasyonu) ve flanş (~6) tabloları 37-38 oturumlarında.

---

## Karar 13 (36) — Halüsinasyon Koruması

**Cihat'ın 36'da yaşadığı:** PAOR PDF'ini sisteme verdi, sistem **tamamen uydurma** sonuç döndürdü:
- Pipeline: gerçek `52900-101540` → uydurma `50600-101358`
- DN: gerçek 150 → S01 yanlış 100, S02 doğru
- Boy: gerçek 149/141/379 cut → uydurma 1289/1314
- Yüzey: gerçek "Galvaniz" → uydurma "Siyah/Asit"

**Kök neden:** Few-shot leakage (prompt'taki örnek JSON'u kopyalamış) + AI'ın PDF'i okurken zorlandığında uydurması.

**Çözüm — DB seviyesinde tespit:**

7 maddeli şüpheli satır kriterleri (`izometri_batch_kayitlari.dogrulama_uyarilari` JSONB):
1. DN bulunamadı (zorunlu alan boş)
2. Çap-DN tutarsız (`boru_olculer` sorgusu eşleşmiyor)
3. Et kalınlığı tolerans dışı (`et_min` ≤ pdf_et ≤ `et_max`)
4. Boy negatif veya >50000 mm
5. **Pipeline_no formatı dosya adıyla uyuşmuyor** (kritik — uydurma yakalama)
6. AI güven skoru <70%
7. Malzeme bilinmeyen (`materyal_kodu_listesi` sözlüğünde yok)

**Sonuç:** Şüpheli satır manuel onaya düşer. AI uydurması canlıya çıkmaz.

---

## Karar 14 (36) — Yaklaşım Y: AI Sadece Okur, Hesaplama Kod Tarafında

**Reddedilen yaklaşım X:** AI'a "DN, et, çap, ağırlık hepsini çıkar" demek. Sorun: PDF'te yazmayan alanları uyduruyor.

**Yaklaşım Y (kabul):** AI'a "PDF'te ne yazılıysa onu döndür, yazılı değilse NULL yaz, **uydurma**" deriz.

**Akış:**
```
AI çıkışı (Yaklaşım Y):
  pipeline_no, spool_no, dn (sayı), malzeme, kalite_kodu, standart (raw), 
  schedule_kod (raw), et_mm (PDF'te varsa), boy_mm_listesi, yuzey, rev

Kod tarafı (deterministik):
  1. PDF'te et_mm varsa onu kullan
  2. Yoksa boru_olculer sorgu: (standart, malzeme_grubu, dn, schedule) → et/cap/agirlik
  3. boru_olculer'da yoksa manuel onaya at
  4. PDF'te yazılı et boru_olculer toleransı dışındaysa şüpheli işaretle (DIN olabilir, ASME tablosu yanlış cevap verir)
```

**Avantaj:** AI yalan söyleyemiyor (uydurma şansı kapatıldı). 35'te kurduğumuz `boru_olculer` yatırımı devreye girer (Karar 5'in karşılığı).

**Genel prompt şablonu (37'de yazılır):**

```
Sen bir tersane boru imalat sistemine PDF izometri parse asistanısın.

ÇOK ÖNEMLİ KURAL: PDF'te yazılı olmayan değer için NULL döndür. Tahmin yapma. Uydurma.

Sadece şu alanları çıkar (PDF'te ne yazılıysa, yorum yapma):
- pipeline_no, spool_no, spool_count
- dn (sadece sayı: 150, "DN150" değil)
- malzeme (Karbon Çelik | Paslanmaz Çelik | Alüminyum | Bakır Alaşım | Bilinmeyen)
- kalite_kodu (raw: ST37, A106-B, 6061, CuNi 90/10 vb.)
- standart (raw: DIN 2448, ASME B36.10, JIS G3452 — PDF'te ne yazılıysa)
- schedule_kod (raw: SCH40, 40, STD, PN16, 20bar — null olabilir)
- et_mm (PDF'te T:X.X yazılıysa al, yazılı değilse NULL)
- boy_mm_listesi (CUT LENGTH değerleri)
- yuzey (Galvaniz | Boyalı | Asit | Siyah)
- rev

ÖRNEK YOK — örnekleri verirsem AI onları kopyalıyor (few-shot leakage). Sadece şema.

Çıktı sadece JSON.
```

**DIN tablosu eksikliği:** PDF'te "DIN 2448" geçtiğinde tablomuz yok (G-12 defter). Bu durumda PDF'te yazılı et değeri kabul edilir, ASME tablosu sorgu yapılmaz. Şüpheli işaretlenir, manuel onay verir.

---

## DB Şeması (36'da kuruldu — TAM hali)

### Boru standart sistemi (3 tablo, 36'da)

```
boru_olculer              — 358 satır, 4 standart aktif
boru_standart_sozluk      — 12 standart (4 aktif + 8 hazır)
boru_dn_isim_eslesme      — 171 NPS yazımı (ASME ailesi)
```

Detay: bkz `migrations/004_standart_mimari.sql`

### İzometri batch sistemi (3 tablo, 36'da)

```
izometri_format_tanimlari — Format kuralları (DB-driven)
izometri_batch_kayitlari  — Batch yükleme + maliyet + sonuç + manuel onay
ai_api_log                — Her AI çağrısı (debug + maliyet)
```

`izometri_format_tanimlari` ana alanları:
- `id, ad, cad_program, cad_surum, firma_kodu`
- `parser_kural JSONB` — `{alanlar:[{ad,regex,kaynak}], kolon_mapping:{...}}`
- `prompt_template TEXT` — L3 Vision için (NULL ise genel prompt)
- `fingerprint JSONB` — `{pdf_uretici_anahtar, baslik_regex, dosya_adi_regex}`
- `egitim_kaynagi` — 'vision_only' | 'pdf_excel' (Karar 7)
- `tenant_id UUID NULL` — NULL = sistem geneli (Karar 2)
- `aktif, basari_orani, kullanim_sayisi, son_kullanim_at`

`izometri_batch_kayitlari` ana alanları:
- `tenant_id, kullanici_id, dosya_sayisi, dosyalar JSONB`
- `format_id, format_durumu` ('taraniyor' | 'taninan' | 'bilinmeyen')
- `durum` ('yukleniyor' | 'parse_ediliyor' | 'manuel_onay_bekliyor' | 'tamamlandi' | 'iptal' | 'hata')
- `sonuc_spool_sayisi, manuel_onay_sayisi, onaylanan_sayisi, reddedilen_sayisi`
- `sonuc_json JSONB, dogrulama_uyarilari JSONB, hata_detay`
- `ai_cagri_sayisi, toplam_token_input, toplam_token_output, toplam_maliyet_usd`
- `baslangic_at, bitis_at`

`ai_api_log` ana alanları:
- `tenant_id, kullanici_id, batch_id, format_id`
- `kaynak` ('izometri_oku' | 'format_taniyici' | 'b_adim_oneri' | 'genel')
- `cagri_tipi` ('L1_regex' | 'L2_haiku' | 'L3_vision'), `model`
- `input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, maliyet_usd, sure_ms`
- `basarili, http_status, hata_mesaji`
- `istek_kisaltma, cevap_kisaltma, istek_full JSONB, cevap_full JSONB`

**Pilot kayıt:** AVEVA E3D — Portuguese Navy AOR (PAOR). `parser_kural` ve `prompt_template` BOŞ, `fingerprint` dolu. 37'de Format Kaydet ile dolacak.

Detay: bkz `migrations/005_izometri_batch_tablolari.sql`

---

## 8 Adımlı Bilinmeyen Format Akışı (mimarinin kalbi)

1. **Yeni PDF gelir** → `izometri-batch.html`'e yüklenir
2. **Format dispatcher** `izometri_format_tanimlari`'ndaki tanıma kurallarını eşleştirir (PDF metadata, başlık paterni, ilk sayfa metni)
3. **Eşleşme YOK** → otomatik **L3 — Vision AI** devreye girer (Claude API). Maliyet doğar.
4. **Yaklaşım Y prompt'u** ile parse edilir (K14/36) — AI sadece okur, uydurmaz
5. **Halüsinasyon kontrolü** (K13/36) — 7 madde tarayıcı. Şüpheli satırlar manuel onaya düşer.
6. **Kullanıcı düzeltir + onaylar** → devre/spool oluşur, iş normal akışına girer
7. **Sayfada buton:** *"Bu formatı kaydet, bir sonraki PDF'te ücretsiz parse et"* — sistem **B Adımı (Karar 10)** ile harita önerir, kullanıcı onaylar/düzeltir, **tenant-scope** kayıt oluşur (Karar 2). Excel referansı opsiyonel (Karar 7).
8. **Aynı batch'in kalan PDF'leri otomatik tanınır** (Karar 8) → L1/L2 ile parse, sıfır API maliyeti
9. **5+ başarılı kullanım sonrası** sistem Cihat'a sorar: *"genelleştirelim mi?"* — Cihat **tek tıklama** ile tüm firmalara açar veya bekletir

---

## Ekran 1 Frontend — 34. Oturumda Yazıldı

**Dosya:** `izometri-batch.html` (536 → 707 satır, +171)

**Eklenenler:**
- 5. stat kartı: "Manuel Onay" sayısı (turuncu, sadece manuel onay > 0 ise görünür)
- "Yeni format tespit edildi" banner (gizli, bilinmeyen format çıkınca açılır)
- Dosya listesi: "Format" kolonu eklendi (badge: AVEVA E3D yeşil / Bilinmeyen turuncu)
- Sonuç tablosu: "Durum" kolonu (Hazır yeşil / Manuel onay turuncu) + şüpheli satırlar arka plan vurgulu
- "İncele →" turuncu butonları her şüpheli satırda
- "Manuel Onay (X)" turuncu buton (btn-row'da, X = bekleyen sayı)
- Yeni i18n string'leri (G-01 uyumlu)
- CSS yeni class'ları (G-05 uyumlu): `.stat-kart.man-onay`, `.yeni-format-banner`, `.format-badge.fb-eslesti/bilinmeyen/bekliyor`, `.satir-manuel`, `.btn-incele`, `.btn-manuel`

**Demo modu (`_DEMO_MOD = true`):**
- Backend henüz hazır değil (502 yerine artık AI uydurma sorunu — 36'da keşfedildi)
- Sahte gecikme (600-1500ms) + mock data ile akış test edilir
- 3. dosya bilinmeyen format simülasyonu (banner + manuel onay tetikleyici)
- Tanınmış formatta ~%15 spool şüpheli (sağlık uyarısı simülasyonu)
- URL `?canli=1` ile gerçek API zorlanabilir (geliştirici için)
- 37. oturumda backend hazır olduğunda `_DEMO_MOD = false` yapılacak

**ASME bağımlısı yerler:** `et_mm`, `boy_mm`, `agirlik_kg` mock data'da elle yazılı. 35'te `boru_olculer` hazır olduğunda backend bu değerleri DB sorgusu ile dolduracak (K14/36 — Yaklaşım Y).

**"İncele →" ve "Manuel Onay (X)" butonları:** Şu an alert ile *"Manuel onay sayfası 37. oturumda eklenecek"* gösteriyor. Ekran 2 yapılınca gerçek navigasyona dönüştürülecek.

---

## Sonraki Oturumlar İçin Sıra

| Oturum | İş | Önkoşul |
|---|---|---|
| **35** | ASME Lookup tam sistemi (`ares-asme.js` + 358 satır veri) | Karar 5 (A1) | ✅ |
| **36** | **Mimari sağlamlaştırma (8 madde — K1/36) + İzometri Batch DB altyapısı (3 tablo)** | 35 ✓ | **✅** |
| **37** | **Yeni `api/izometri-oku.js` (sıfırdan, K5/36) + Ekran 2 (manuel onay) + Ekran 1 demo kapatma** | 36 ✓ | **Sırada** |
| **38** | UI Ekran 3 (Format Kaydet) — B Adımı (AI harita önerisi) + Excel upload (Karar 7) + ZORUNLU SELF-TEST | 37 ✓ |
| **39** | C Adımı (görsel işaretleme — canvas drawing) + genelleştirme bildirimleri + Cihat onay UI'ı | 38 ✓ |
| **40+** | Pilot AVEVA-PAOR canlıya alınır, 2-3 örnek PDF ile test, super_admin "AI API Kullanım" sekmesi | 39 ✓ + Cihat'ın PDF örneklerini yüklemesi |

**Önemli:** 38. oturum aynı zamanda zorunlu self-test günü (33→38, 5 oturum). Self-test geçmezse o oturumda kural sistemi tamir edilir, izometri batch'e devam edilmez.

---

## Açık Sorular (Sonraki Oturumlarda Karar Verilecek)

1. **Maliyet eşiği aşıldığında**: sadece uyarı mı, yoksa belli bir aşımdan sonra sert blok da mı? (39. oturumda)
2. **Format kuralı önerisi mekanizması (B Adımı)**: Sistem ne kadar otomatik regex çıkarsın? (38. oturumda)
3. **C Adımı canvas implementasyonu**: PDF.js + native canvas mı, yoksa fabric.js gibi kütüphane mi? (39. oturumda)
4. **Format-spesifik prompt VS genel prompt:** Pilot AVEVA-PAOR'da prompt_template şu an boş. Cihat PDF örneği yükleyince B Adımı ile dolar. O zamana kadar genel prompt yeter. Karar: 37'de tek genel prompt, format-spesifik 38'de.
5. **DIN tablosu eksikliği** (G-12 defter): Şu an DIN borular için `boru_olculer`'da satır yok. PDF'te "DIN 2448" geçerse: PDF'te yazılı et değeri kabul edilir, ASME sorgusu yapılmaz, manuel onaya düşer. Tablo 38-40 oturumlarında eklenir.
6. **Fitting/flanş tabloları** (G-11 defter): 9-15 standart kombinasyonu. 38-39 oturumlarında.
