# AresPipe — Vizyon ve Modüler Mimari

> **Bu belge ne yapacağımızın değil, yapabileceğimiz altyapının haritasıdır.**
> 40. oturumda Cihat ile yapılan kahve sohbetinden çıkmıştır.
> Sıkıldıkça okunmak için yazılmıştır — peşpeşe okumak zorunda değil.

---

## Önsöz — Korkuyla Vizyon Arasında Denge

Vizyonun en büyük tehlikesi *"hepsini yapmak"* tuzağıdır. Vizyonu olmamanın en büyük tehlikesi ise *"yapma zamanı geldiğinde altyapı yok diye baştan başlamak"*.

Cihat'ın dediği gibi:

> *"Şunun olması lazım ama onun için programı baştan yazmak lazım"dan korkuyorum.
> Altyapı olsun, biz mevcut mütevazi hedeflerimizle başlayalım,
> ama modüler olarak sağına soluna parçalar ekleyebilelim."*

Bu belgenin amacı tek: **yapacağımız hiçbir şey, ileride yapacağımız bir şeyi imkansız kılmasın.**

### Üç Temel Prensip

**1. Modülerlik birinci sınıf vatandaş.**
Yeni bir tablo, yeni bir doküman tipi, yeni bir AI kanalı eklemek için programı yeniden yazmak gerekmemeli. Schema esnek, prompt'lar template'lı, parse'lar register'lanabilir olmalı.

**2. Tetik koşulu olmadan iş yok.**
Vizyondaki bir özellik, bir müşteri talebi/sinyal/ihtiyaç tetiklemeden koda dönüşmez. *"Lazım olabilir"* yeterli sebep değil. *"Şu pilot müşteri X istiyor"* yeterli sebep.

**3. Yol haritası taahhüt değil.**
Buradaki her özellik *"olabilir"* statüsündedir. Müşteriye satış konuşmasında *"yol haritamızda var"* derken bile ay/tarih vermeyiz. *"Talep şekillendirir"* deriz.

---

## Bölüm 1 — Şu Anki Yer (Kategori A)

### Çalışan Altyapı

**Veri katmanı:**
- Multi-tenant Supabase (tenants, kullanicilar, projeler, devreler, spooller, ...)
- 28 aktif tablo, RLS aktif, GDPR-uyumlu
- Standart ölçü kütüphanesi: `boru_olculer` (358 kayıt — ASME, DIN, CuNi)

**İşlem akışı:**
- IFS Excel veya PAOR PDF yükle → AI parse → spool listesi
- 5 operasyon adımı: kesim → büküm → markalama → KK → sevkiyat
- Her adım kendi sayfası, ortak tasarım dilinde (hero+stat-pill standardı)
- Çoklu tersane, çoklu proje, çoklu devre yönetimi

**3D altyapı:**
- Three.js + OrbitControls (spool_detay.html'de)
- `buildChain()` chain renderer — hem mutlak (p1/p2) hem göreli (yön+uzunluk) format kabul ediyor
- 4 parça tipi destekli: boru, dirsek, flanş, redüktör
- DB'de `segmentler_json` kolonu hazır (Lambda'nın doldurması bekleniyor)

**i18n:**
- 3 dil (TR/EN/AR) tam destek
- 1651 anahtar (40. oturum sonu)
- RTL hazır

### Eksik Olan Ama Zaten Bilinen

**Borçlar listesi** (son-durum.md'de tutulur):
- Pano implementasyonu
- 4 yönetim sayfası standardizasyonu
- Test Yönetimi sayfası dönüşümü
- Pre-A.3 çoklu sayfa dispatcher
- Sevkiyat yıl filtresi
- Kesim son %10 (Excel TR)
- malzeme.html sıfırdan
- Pilot canlı test akışı

Bu liste **mevcut iş kapsamı** — vizyon değil, **bekleyen yap-listesi**.

---

## Bölüm 2 — Modüler Altyapı Taahhütleri

Bu bölüm en önemli. Aşağıdaki prensipler **bugünkü kod yazımını da etkilemeli** — vizyondan kopuk değil.

### A. Parça Kimliği Prensibi — Vizyonun Ana Damarı

> *"Sisteme giren bir malzeme yazı olarak değil, teknik bilgileri ile bir parça olarak tanımlansın."* — Cihat, 40. oturum kapanış sohbeti

Bu cümle vizyonun en kritik prensibidir. Tüm diğer maddeler bunun üstüne kurulur.

**Ne demek?**

Şu anki sistem: spool_malzemeleri tablosunda `malzeme_adi: "90LR Elbow 4 inch Sch40 A234 WPB"` yazıyor. Bu sadece bir **string**. Sistem metni okuyor ama parçayı **anlamıyor** — ne ölçüde, ne ağırlıkta, ne yönde.

Olması gereken: Aynı kayıt `parca_id → fitting_olculer.id` olarak bir **nesneye referans**. Nesnenin kendisi:
- Geometri: ASME B16.9 90LR Elbow, DN100, Sch40
- Ölçüler: A=152mm, yarıçap=152mm, ağırlık=5.4kg
- Malzeme: ASTM A234 WPB (karbon, 7.85 g/cm³)

Sistem artık parçayı **fiziksel olarak tanır**, yazı olarak değil.

**Bu Prensibin Kazandırdığı Beş Şey**

1. **3D doğru çizilir.** Three.js parçayı kütüphaneden ölçü olarak alır → buildChain her parçayı doğru ölçekte koyar → "dağınık görüntü" sorunu kalkar.

2. **Otomatik ağırlık hesabı.** Her parça ağırlığı kütüphanede → spool toplam ağırlığı otomatik. Sevkiyat planlaması, vinç kapasitesi, taşıma maliyeti hesabı bedava gelir.

3. **AI hatası yakalanır.** AI "DN105" gibi olmayan bir boyut çıkarırsa kütüphanede karşılığı yok → uyarı çıkar. Garbage-in koruması.

4. **Stok ve sipariş otomasyonu hazır.** Aynı parça birden fazla projede kullanılınca sistem sayar, toplam sipariş listesi otomatik çıkar.

5. **Müşteri bazlı kütüphane.** Tersane A spec'i Class 150 karbon, Tersane B spec'i Class 300 paslanmaz olabilir. Her tersanenin kendi fitting alt kümesi olur, projeye girince sadece o tersanenin parçaları gösterilir.

**Bu Prensip Vizyonun Diğer Parçalarıyla Nasıl Bağlanır**

- **3D ve yön çıkarımı** → parça kütüphaneden geometri alır, AI sadece yön tahmin eder. Sorumluluk paylaşılır.
- **Çoklu doküman parse** → IFS'ten gelen parça ID'si PAOR'dakiyle eşleşmeli (çapraz validasyon).
- **STEP koordinat çıkarımı** → STEP'teki silindir bizim kütüphanedeki hangi fitting'e karşılık geliyor (eşleştirme).
- **Pasif öğrenme** → AI'ın "bu metin → bu parça" eşleştirmesi zaman içinde gelişir.
- **Tier'lı servis** → kütüphane derinliği tier'a göre artar (tier 1 sadece boru, tier 3 fitting+flanş+custom).

**Bu Prensip Olmadan Olur Mu?**

Olmaz. Olmadan vizyondaki diğer her şey **yarım kalır**:
- 3D dağınık çizilir (parça ölçüsü bilinmiyor)
- Ağırlık hesaplanmaz (kütüphane yok)
- AI çıktısı doğrulanamaz (referans yok)
- Stok takibi yapılamaz (her parça farklı string)
- Sipariş otomasyonu yapılamaz (eşleşme yok)

Yani parça kimliği prensibi **vizyonun belkemiği**. Diğer her şey buna asılır.

**Modüler Altyapı Şartı**

Bu prensibi destekleyen DB yapısı şöyledir:

```sql
-- Standart kütüphane (geometri + malzeme)
fitting_olculer        -- ASME B16.9, B16.11, EN 10253, DIN 86089...
flansh_olculer         -- ASME B16.5, EN 1092, DIN 86087...
malzeme_kataloglari    -- ASTM A106/A234/A312/B361/B466 + EN/DIN eşdeğerleri
fitting_malzeme_uyum   -- hangi fitting hangi malzemeden olur

-- Standart dışı parçalar
ozel_parcalar          -- coupling sleeve, custom, üretici-spesifik

-- Spool'a bağlanma
spool_malzemeleri (
  spool_id, miktar,
  parca_id      → fitting_olculer (FK, opsiyonel)
  flansh_id     → flansh_olculer (FK, opsiyonel)
  ozel_parca_id → ozel_parcalar (FK, opsiyonel)
  malzeme_adi (legacy display, fallback için kalır)
)

-- Müşteri bazlı kütüphane
tenant_spec_seti       -- AVEVA-vari spec mantığı
spec_kural             -- "Bu spec'te şu parçalar uygundur"
```

**Bugünkü Taahhüt**

Bu prensip şu anki kod yazımını da etkilemeli:

- Yeni bir tablo eklerken **parça referansı** düşün, string değil
- AI prompt'larında çıktıyı **parametrik** iste (parça tipi + boyut + schedule), yapışkan metin değil
- spool_malzemeleri'ne yeni kolon eklenirken **referans yapısı** korunsun
- Three.js'in `buildChain` interface'i **kütüphane referansını** kabul edebilsin

Pilot başladıktan sonra kütüphane organik büyür. Modüler altyapı bugünden hazır olduğu için yeniden yazma gerekmez.

---

### B. Veri Kaynak Hiyerarşisi (Doküman Türleri)

Her bilgi parçasının **kanonik kaynağı** belirli olmalı:

| Bilgi türü | Kanonik kaynak | Yedek kaynak | Bilgi |
|---|---|---|---|
| Malzeme listesi | IFS Excel | — | Olmazsa olmaz |
| Geometri (koordinat) | STEP/IGES | PAOR + AI çıkarım | STEP altın, PAOR yedek |
| Yön (vektör) | STEP/IGES | PAOR 3-görünüş | PAOR ana çizim son çare |
| Görsel doğrulama | Spool detay PDF | — | Çapraz kontrol |
| Sertifika/Test | MTC | — | Bilgi olarak sakla |
| İzolasyon/cıvata | BOM Excel | — | İmalat dışı |

**Kural:** Çelişki çıkınca üst sıralı kaynak haklıdır. IFS ölçü için, STEP geometri için kanoniktir. Bu kuralı sistem otomatik uygular, kullanıcı manuel müdahale etmez.

### C. Tablo Modülerliği

Yeni doküman tipi, yeni ölçü tipi, yeni operasyon adımı eklemek için ALTER TABLE değil, **INSERT INTO** olmalı.

**Şu anki model bunu hangi noktalarda destekliyor:**

- `basamak_tanimlari` (operasyon adımları) — yeni adım ekle, INSERT yeter
- `tenant_features` (özellik bayrakları) — modüler etkinleştirme
- `yetki_bloklari` (rol/yetki) — yeni yetki ekle, INSERT
- `malzeme_tanimlari` — yeni malzeme tipi ekle, INSERT

**Eklenecek modüler tablolar (Kategori B-C):**

```sql
-- Doküman tip kütüphanesi (klasör yükleme için)
dokuman_tipleri (
  tenant_id, tip_kodu, dosya_pattern,
  parse_yapilacak_mi, prompt_template_id,
  depolama_yolu_pattern, aktif
)

-- Standart ölçü kütüphanesi genişlemesi
fitting_olculer  -- ASME B16.9 dirsek/te/redüksiyon/kapak
flansh_olculer   -- ASME B16.5 flanş

-- AI prompt template kütüphanesi
prompt_templates (
  tenant_id, kullanim_amaci, sablon_metni,
  versiyon, basari_orani, son_guncelleme
)

-- Doküman saklama
spool_dokumanlari (
  spool_id, dokuman_tipi, dosya_yolu,
  yuklendi_at, yukleyen_kullanici_id
)

devre_dokumanlari (
  devre_id, dokuman_tipi, dosya_yolu,
  yuklendi_at, yukleyen_kullanici_id
)

-- 3D tarama dosyaları (lazer tarama için)
spool_taramalari (
  spool_id, dosya_yolu, format,
  hassasiyet_mm, alindigi_zaman, tarayan_kullanici_id
)

-- Format öğrenme geçmişi (AI training feedback)
format_ogrenme_kayitlari (
  tenant_id, dokuman_tipi, ornek_dosya_yolu,
  ai_cikti, kullanici_duzeltmesi, basari_skor
)
```

**Bugünkü taahhüt:** Yeni tablo eklerken bu prensiplere uy — UUID PK, tenant_id, JSONB default '{}', _at suffix tarih kolonları.

### D. AI Prompt Katmanı

AI prompt'larını **kod içinde gömülü string** yerine **DB'de template** olarak tutmak. Sebep: müşteri başına özelleştirme, A/B test, format öğrenme geçmişi.

**Şu anki yer:** Lambda v4 prompt kodda gömülü.
**Hedef:** `prompt_templates` tablosu, Lambda template'i DB'den çeker.
**Tetik:** İkinci farklı format (PAOR dışında AVEVA tam parse, veya başka tersane formatı).

### E. Doküman Parse Pipeline

Şu an: tek dosya yüklenir → tek parse → tek sonuç.

Modüler hedef: çoklu dosya yüklenir → her dosya kendi pipeline'ında işlenir → çapraz validasyon katmanı → birleşik sonuç.

**Pipeline yapısı:**
```
[Yüklenen dosyalar]
       ↓
[Tip tanıma — pattern/header eşleşmesi]
       ↓
   ┌───┴───┬───────┬─────────┬────────┐
   ↓       ↓       ↓         ↓        ↓
[IFS]  [PAOR]  [STEP]  [Spool detay]  [Bilgi-saklama]
   ↓       ↓       ↓         ↓
[Parse] [Parse] [Parse]  [Parse]
   ↓       ↓       ↓         ↓
[Çapraz validasyon katmanı]
       ↓
[Birleşik sonuç + uyarılar]
       ↓
[DB'ye yazım]
```

**Bugünkü taahhüt:** Tek dosya parse mantığını da bu pipeline'ın **tek-dosyalı** versiyonu olarak kur. İleride çoklu dosya geldiğinde aynı mantık devam etsin.

### F. 3D Render Katmanı

Şu an: `buildChain(segs)` segmentleri zinciri kuran fonksiyon. Yeterince modüler.

**Hedef:** Veri kaynağı `buildChain`'in bilmediği yerden gelebilsin:
- AI çıktısı (mevcut, segmentler_json)
- STEP parser çıktısı (Kategori C)
- Lazer tarama mesh'i overlay olarak (Kategori C+)
- Manuel düzenleme (Kategori B)

**Bugünkü taahhüt:** `buildChain` interface'i **stabil** kalmalı. Yeni veri kaynakları eklenirken `buildChain`'in input formatına uyması beklenir, `buildChain` değişmez.

---

## Bölüm 3 — Vizyon Bölümleri (Anlama, Yapma Değil)

Aşağıdakiler şu an **yapılmıyor**. Sadece **kafamızda** netleştiği için yazılı. Tetik koşulları belirtilmiş.

### Vizyon 1 — Klasör Yükleme + Çoklu Doküman

**Problem:** Şu an "IFS veya PDF" seç. Gerçekte tersane bir devre için 4-5 doküman yolluyor (IFS, PAOR, Spool detay PDF, BOM, MTC, sertifikalar).

**Çözüm:** Devre yükleme sayfasında "Klasör sürükle-bırak" alanı. Sistem her dosyayı pattern + header ile tanır. Tanıyamadıklarını sorar. İlk gemi öğrenme (AI maliyeti yüksek), ikinci gemi sabit ($0.50 civarı).

**Tetik:** İkinci pilot tersane gelince. Tek tersane için "ya/ya da" yeterli.

**Modüler altyapı şartı:** `dokuman_tipleri` tablosu, format öğrenme kayıtları, parse pipeline.

### Vizyon 2 — STEP/IGES Koordinat Çıkarımı

**Problem:** AI'a yön çıkarmak hatalı, manuel onay gerekir.

**Çözüm:** Müşteri STEP/IGES verirse, AI'a sormadan matematiksel parse. Çıktı `buildChain`'in beklediği format (p1, p2, merkez, yon1, yon2). Sıfır AI maliyeti, %100 doğru.

**Cihat'ın anahtar buluşu:** *"Bize STEP'in görsel/render kısmı lazım değil, sadece koordinatlar."* Bu yaklaşım Lambda dönüşüm servisi ihtiyacını ortadan kaldırıyor, 1-2 oturum işine düşürüyor.

**Tetik:** Müşteri STEP veriyorsa (Tier 3 müşteri).

**Modüler altyapı şartı:** Parser modülü (`step-file-parser` veya custom regex), `buildChain` arayüzü zaten uyumlu.

### Vizyon 3 — Çapraz Validasyon

**Problem:** AI tek kaynaktan okuyor, hata yakalanmıyor.

**Çözüm:** Üç katmanlı kontrol:
1. **AI çıktı vs. IFS** — ölçü/malzeme eşleşme (token-free, sadece JSON karşılaştırma)
2. **3 görünüş** (üstten/önden/yandan varsa) — yön doğrulaması
3. **3D thumbnail** — bizim çizdiğimiz vs. PDF'teki render karşılaştırma (AI eğitimi)

**Tetik:** İlk pilot 3 ay sonra (hata pattern'i biriktiğinde).

**Modüler altyapı şartı:** Parse pipeline'ında validasyon katmanı yer rezervi.

### Vizyon 4 — Tier'lı Servis Modeli

**Problem:** Her müşteriye aynı paketi sunmak fiyat/değer dengesizliği yaratıyor.

**Çözüm:** 4 tier müşteri tipi, gelen veriye göre hizmet seviyesi:

| Tier | Müşteri verisi | Sunulan hizmet | Fiyat |
|---|---|---|---|
| Tier 0 | AutoCAD random | (giremiyoruz, filtre) | — |
| Tier 1 | Sadece spool listesi (Excel) | Operasyon takip | Düşük |
| Tier 2 | IFS + PAOR | Tam AresPipe (mevcut) | Orta |
| Tier 3 | STEP dahil | + Kanonik 3D + lazer tarama opsiyonu | Yüksek |

**Tetik:** İkinci satış konuşmasında fiyatlandırma sorusu çıkınca.

**Modüler altyapı şartı:** `tenant_features` tablosu zaten var, tier seviyesi de feature flag olarak modellenebilir.

### Vizyon 5 — Lazer Tarama (As-Built Doğrulama)

**Problem:** İmalat sonrası fiziksel sapma kontrolü manuel ve eksik.

**Çözüm:** iPhone/iPad LiDAR ile spool'u tara → STEP modeliyle karşılaştır → sapma haritası raporu.

- Donanım: iPhone Pro / iPad Pro yeterli ($1000-1500, ±2-5mm)
- Yazılım: Polycam, RealityScan (ücretsiz)
- Karşılaştırma: ICP algoritması + Open3D/PCL (Lambda fonksiyonu)
- Çıktı: PDF rapor — sapma haritası, geçti/kaldı kararı

**Tetik:** 5+ aktif müşteri + Tier 3 talep.

**Modüler altyapı şartı:** `spool_taramalari` tablosu, STEP entegrasyonu (Vizyon 2).

### Vizyon 6 — 3 Görünüş Okuma

**Problem:** AI tek izometrik projeksiyondan yön çıkarıyor — zor.

**Çözüm:** PAOR PDF'lerinde sıkça bulunan plan/elevation/side view'ları AI'a okutmak. Yön çıkarımı çok daha kolay.

**Tetik:** Tek izometrik yön çıkarımı %85'in altında kalırsa.

**Modüler altyapı şartı:** Prompt template kütüphanesi.

### Vizyon 7 — 3D Thumbnail Kontrolü

**Problem:** AI hatasını fark etmek için manuel onay gerekiyor.

**Çözüm:** Bizim çizdiğimiz 3D'yi alıp AI'a tekrar göster, PDF'teki thumbnail'la karşılaştırma istem. *"Aynı mı, fark var mı, hangi parça yanlış?"*

**Tetik:** AI çıktısı %90+ kalitesiyle stabilize olduktan sonra (kalite tavanını yükseltmek için).

**Modüler altyapı şartı:** Parse pipeline'ında ikinci AI çağrısı yer rezervi.

### Vizyon 8 — Pasif Öğrenme ve Bağlamsal Hafıza

> *"Atölyeye bir temizlikçi alsak, hiçbir sorumluluğu olmasa bile ortamda bulundukça akışla ilgili bir şeyler öğrenir. AI için de etiketleme dışında sistemde olan bitenden öğrenebileceği bir şey olmaz mı?"* — Cihat, 40. oturum sohbeti

**Problem:** Şu an her AI çağrısı sıfırdan başlıyor. Önceki çıkarımlar, kullanıcı düzeltmeleri, doğrulanmış parçalar AI'a hatırlatılmıyor. Sistem bilgi biriktirmiyor.

**Çözüm — 3 paralel kanal:**

1. **RAG (Retrieval-Augmented Generation):** Yeni PDF parse edilirken AI'a "bu tersanenin önceki 50 spool'u şu formatta gelmişti, kullanıcı şu noktaları düzeltmişti, dikkat et" bilgisi ekstra context olarak verilir.

2. **İstatistiksel tersane profili:** Her tersanenin tipik kullandığı malzeme/çap/spec patterm'leri otomatik çıkarılır. Yeni spool gelince *"bu sayı tuhaf, bu tersanenin tipik aralığı dışında"* uyarısı verilir.

3. **Pasif feedback log:** Kullanıcının değiştirmediği AI çıktısı = sessiz "doğru" sinyali. Düzelttiği = "yanlış" sinyali + doğru cevap. Bu log gelecek prompt'lara context olarak eklenir.

**Kritik nokta:** Bu **fine-tuning değil**. Model değişmiyor, sadece AI'a daha iyi soru sormayı öğreniyoruz. Maliyet düşük, geri alınabilir.

**Tetik:** Pilot 50+ spool parse edildikten sonra (öğrenecek malzeme birikince).

**Modüler altyapı şartı:**

```sql
tersane_profilleri      -- istatistiksel pattern özeti
ai_geri_bildirim        -- doğru/yanlış log
parse_gecmis            -- embedding vector ile geçmiş örnekler
```

### Vizyon 9 — Standart Kütüphane Stratejisi

**Problem:** Parça Kimliği Prensibi (Bölüm 2.A) çalışması için **kütüphane** lazım. Boş tablolarla "parça nesne olarak tanınsın" denemez.

**Çözüm — Kademeli kurulum (4 katman):**

**Katman 1 — Çekirdek Geometri Tabloları (DB schema)**
- `fitting_olculer` (~50-60 kolon, parça tipine göre dolar)
- `flansh_olculer`
- `malzeme_kataloglari`
- `fitting_malzeme_uyum` (çapraz)
- `ozel_parcalar` (custom)

**Katman 2 — Veri Doldurma Stratejisi**

Standart dokümanları satın almak gerek değil. Üç yasal yol:
- Üretici katalogları (Octal, Haihao, Sandvik gibi — public PDF'lerden parse)
- Açık kaynak datasetler (GitHub `pipe-fitting-data`, FreeCAD pipe library)
- Kullanıcının elindeki Excel/PDF tabloları (sektörde dolaşan public bilgi)

Çıkarım yöntemi: AI-asistanlı toplu çıkarım + örnekleme onayı.

**Katman 3 — Yönetim UI'sı**
- `fitting_kutuphane.html` sayfası: 5 sekme (Borular | Fittings | Flanşlar | Malzemeler | Uyum)
- Manuel ekleme modal'ı (eksik parça çıkınca)
- Excel import/export
- "Bu kayıt N projede kullanılıyor" istatistiği

**Katman 4 — Spool Akışına Entegrasyon**
- Spool kayıt formunda **Malzeme Seçici Widget** (3 seviye filtre: grup → spec → grade)
- AI parse çıktısı kütüphane ile eşleştirilir, eşleşmezse fuzzy match önerir
- Eşleşmeyen parça için **"kütüphaneye ekle"** butonu (custom parça tablosuna gider)

**Standart kapsamı (referans belge: KUTUPHANE-KAPSAM.md):**

Karbon, paslanmaz, duplex, CuNi, alüminyum, alaşımlı, nikel için ayrı malzeme spec'leri. Geometri için ASME B16.9, B16.11, B16.5 + EN/DIN eşdeğerleri. Toplam ~11.000 satır kapsam.

**Tetik:** Pilot başlamadan **DB schema kurulur** (Katman 1, 1 oturum). Veri doldurma pilot sırasında **kullanıldıkça** olur — boş kütüphane proje girişiyle organik büyür.

**Bu Stratejinin Avantajı**

11.000 satırı önceden manuel girmek yerine:
- Pilot başlar, bir spool gelir, içindeki 12 parça kütüphaneye eklenir
- Sonraki spool gelir, 8 parça zaten var, 4 yenisi eklenir
- 50 spool sonra %80 kütüphane organik dolmuş, sadece kullanılan parçalar var
- Hiç kullanılmayacak parçalar boşa girilmez

Vizyon belgesinin "tetik koşulu olmadan iş yok" prensibine birebir uyar.

---

## Bölüm 4 — Yol Haritası (Tetik Koşullu)

### Kategori A — Bugün (Aktif İş)

| Madde | Durum |
|---|---|
| 5 operasyon sayfası standardı | %95 (40'ta tamamlandı) |
| IFS + PAOR parse | %85 (39'da Lambda v4) |
| Çoklu tersane | %100 |
| 3 dil i18n | %100 (1651 anahtar) |
| 3D temel render | %80 (kod hazır, AI input eksik) |

### Kategori B — Pilot Sonrası İlk 3 Ay

**Tetik:** Pilot tersane sözleşme imzaladıktan sonra.

| Madde | Tahmini süre |
|---|---|
| Pano implementasyonu | 3-4 oturum |
| 4 yönetim sayfası standardı | 2-3 oturum |
| Test Yönetimi sayfası | 1 oturum |
| AI yön çıkarımı (3D iyileştirme) | 2-3 oturum |
| Sevkiyat yıl filtresi, küçük borçlar | 1-2 oturum |
| Pilot feedback iterasyonları | Sürekli |

### Kategori C — 6+ Ay Sonra (Vizyon Yatırımları)

**Tetikler:**
- Klasör yükleme: ikinci pilot tersane geldiğinde
- STEP entegrasyonu: STEP veren ilk müşteri çıkınca
- Çapraz validasyon: hata pattern'i biriktiğinde
- Tier modeli: ikinci satış konuşmasında fiyat sorusu çıkınca
- Lazer tarama: 5+ aktif müşteri + Tier 3 talep
- 3 görünüş okuma: AI yön kalitesi %85'in altında kalırsa
- Thumbnail kontrolü: kalite tavanını yükseltmek gerektiğinde

Hiçbiri zaman bazlı değil, **sinyal bazlı**. Sinyal gelmezse iş başlamaz. Sinyal gelirse altyapı zaten hazır olduğu için hızlı eklenir.

---

## Bölüm 5 — Risk ve Dikkat Noktaları

### Scope Drift (Kapsam Kayması)
Vizyondaki bir madde "şimdi yapılmalı" diye iç güdüsel başlamak. Çözüm: **tetik koşulu yoksa başlanmaz** kuralı.

### Vizyon Vaadi
Müşteriye satış konuşmasında "şu özellik 3 ayda gelecek" demek. Müşteri sinirlenir. Çözüm: *"Yol haritamızda var, müşteri talebi şekillendirir"* dili.

### Token Ekonomisi
Çoklu doküman + çapraz validasyon katmanları AI maliyetini katlayabilir. Çözüm: **Format tanıma + saklama** mantığı (parse edilmesi gereken doküman %30, kalan saklanır).

### Çelişki Paralizi
Çapraz validasyon her küçük farkta sistemi durdurursa kullanıcı bunalır. Çözüm: **Tolerans aralığı** + **kanonik kaynak hiyerarşisi**. Otomatik karar, kullanıcıya sadece büyük çelişkilerde danışılır.

### Format Versiyonlama
Tersane şablonu değişirse mevcut prompt çöker. Çözüm: `prompt_templates` versiyonlu, eskisi arşiv, yenisi öğrenilir.

### Kullanıcı Eğitimi
Lazer tarama, klasör yükleme gibi yeni alışkanlıklar tersanede direnir. Çözüm: **Adım adım tanıtım**, ilk başta opsiyonel, sonra önerilen, sonra varsayılan.

---

## Bölüm 6 — Karar Prensipleri

Bu belge bir kez yazıldıktan sonra **karar verirken referans noktası** olur:

1. **Bir özelliği hemen yapmak istiyorum** → Tetik koşulu var mı? Yoksa **bekle**.
2. **Bir tablo eklemek istiyorum** → Modüler mi? `tenant_id`, UUID PK, JSONB esnek alan var mı?
3. **Yeni bir AI prompt yazıyorum** → Template'leşebilir mi? Versiyonlanabilir mi?
4. **Müşteriye yeni özellik vaadi** → Yol haritasında **ay/tarih** vermiyorum mu?
5. **Vizyon belgesindeki bir madde değişti** → Belge güncellenir, karar altyapısı tekrar gözden geçirilir.

### Steve Jobs prensibi (Cihat'ın profile'ında oturan)

> *"Odak, çoğu şeye hayır demektir."*

Bin tane güzel fikir vardır. Her birine evet demek = hiçbiri tamamlanmaz. *"Bu güzel ama bugün değil"* demek **disiplin işi**.

---

## Sonuç — Bu Belgenin Sözü

Bu belge bir **iş bitirme listesi değil**. Bir **karar verme çerçevesi**. AresPipe'ın bugün yaptığı işleri **vizyon doğrultusunda** yapmasını sağlar — vizyona göre yapmadan.

Her satır taahhüt değil. Her bölüm bir **olasılık + altyapı şartı**. Tetik gelirse altyapı hazır, hızlı uygulanır. Gelmezse hayat devam eder, koda dönüşmez.

Bu sayede 6 ay + 8 ay = 14 ay yerine, **8 ay**'da bugünkü pilot ürün bitirilir, vizyonun her parçası **tetik gelince eklenir**, programı baştan yazma korkusu olmaz.

---

**İlgili belgeler:**
- `docs/SPOOL-AI-VIZYON.md` — AI özelinde vizyon (önceki oturumlardan)
- `docs/PANO-TASARIM.md` — Pano vizyonu (23. oturumdan)
- `docs/CIHAT-PROFIL.md` — Cihat'ın çalışma stili
- `.github/son-durum.md` — Aktif borçlar listesi
- `CLAUDE.md` + `CLAUDE-MOBILE.md` — Geliştirme kuralları

---

> Bu belge 40. oturum kapanışında yazıldı.
> Sıkıldıkça okunmak için, kahve içerken hatırlanmak için.
> Cihat istediğinde güncelleyebilir, eklemeler yapabilir.
> Vizyon sabit değil, **kafamızdaki haritanın yansıması**.
