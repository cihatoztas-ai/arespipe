# İzometri Batch — Mimari Karar Dokümanı

> **Tarih:** 26 Nisan 2026 — 34. oturum (tasarım + Ekran 1 frontend)
> **Statü:** Mimari kararlar tamam. Ekran 1 frontend iskeleti yazıldı (demo modu). Backend + Ekran 2-3 sonraki oturumlarda.
> **Bağlantılı:** `docs/IZOMETRI-BATCH-NOTLARI.md` (brief, bu doküman onun üstüne inşa edildi)

---

## Bağlam

İzometri PDF batch parser — farklı CAD program çıktılarını (AVEVA E3D, CAESAR II, Smart 3D, vb.) AresPipe sistemine otomatik çevirme özelliği. Mevcut yarım altyapı (`api/izometri-oku.js` + `izometri-batch.html`) tek formata kilitli (PAOR/AVEVA), 502 hatası veriyor. Bu doküman sıfırdan doğru mimariyi yazıya döker.

**34. oturum disiplini:** Brief'in Madde 18'i gereği oturum tasarım oturumu olarak başladı. Cihat'ın açık talimatıyla son aşamada Ekran 1 frontend yazımına geçildi. Backend ve Ekran 2-3 sonraki oturumlara bırakıldı.

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

**Maliyet/teknik göstergeler kullanıcı sayfasında YOK** — Cihat kararı: `admin/panel.html`'e yeni "AI API Kullanım" sekmesi eklenecek (39+ oturumda mockup).

---

## Karar 5 — Sıralama: ASME Lookup ÖNCE (A1)

**Seçim:** Brief Madde 15'in 1. sırası uygulanır — **A18-19 ASME Lookup tam sistemi izometri batch'ten ÖNCE** yapılır.

**Reddedilen alternatif:** A2 (hardcoded başla, sonra refactor) — Cihat sağlamlığı hıza tercih etti.

**Sonuç:**
- **35. oturum:** ASME Lookup tam sistemi (DB tablosu, helper'lar, kapsamlı veri seti)
- **36. oturum:** İzometri batch backend (DB tabloları, dispatcher, parser engine) + Ekran 2 (manuel onay) UI
- **37+:** Ekran 3 (Format Kaydet) + diğer parçalar

---

## Karar 6 — Mevcut `izometri-oku.js`: Refactor edilir, atılmaz

**Seçim:** Mevcut kod boşa atılmaz. Şu şekilde dönüştürülür:

| Mevcut kod parçası | Yeni yer |
|---|---|
| Sistem prompt'u (DIN, ST37, FABRICATION/ERECTION ayrımı, DN→mm dönüşüm) | `izometri_format_tanimlari` tablosunda **AVEVA-E3D pilot satırının** `prompt_template` alanına geçer |
| `pipeline_no` parsing kuralı (`11D-PAOR-50600-101540`) | Aynı satırın `parser_kural` JSONB alanına regex olarak |
| API call infrastructure, hata yönetimi, base64 decoding | Sabit kod kalır (yeni dispatcher'ın altyapısı olur) |
| 502 hatası | Yeni mimaride debug + timeout artırma + chunking ile çözülür |

**Bonus:** AVEVA-PAOR formatı sistemin **ilk DB kaydı** olur — pilot, sıfırdan başlamıyoruz.

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

**Veri kanıtı:** Yüklenen IFS Excel örneği `All` sheet'inde Pipeline No, SpoolNo, Description, Dimensions, Length, Weight (Kg), Material kesin değerler içeriyor — ground truth olmaya uygun.

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

**Brief'te netleştirilmemişti** — KARAR.md'de açıkça yazıldı.

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

**Geliştirme önceliği:** B önce (37. oturum), C sonra (38. oturum).

---

## 8 Adımlı Bilinmeyen Format Akışı (mimarinin kalbi)

1. **Yeni PDF gelir** → `izometri-batch.html`'e yüklenir
2. **Format dispatcher** `izometri_format_tanimlari`'ndaki tanıma kurallarını eşleştirir (PDF metadata, başlık paterni, ilk sayfa metni)
3. **Eşleşme YOK** → otomatik **L3 — Vision AI** devreye girer (Claude API). Maliyet doğar.
4. **Vision çıktısı manuel onay ekranında gösterilir** — tüm alanlar şüpheli, kullanıcı düzeltebilir (Madde 08)
5. **Kullanıcı düzeltir + onaylar** → devre/spool oluşur, iş normal akışına girer
6. **Sayfada buton:** *"Bu formatı kaydet, bir sonraki PDF'te ücretsiz parse et"* — sistem **B Adımı (Karar 10)** ile harita önerir, kullanıcı onaylar/düzeltir, **tenant-scope** kayıt oluşur (Karar 2). Excel referansı opsiyonel (Karar 7).
7. **Aynı batch'in kalan PDF'leri otomatik tanınır** (Karar 8) → L1/L2 ile parse, sıfır API maliyeti
8. **5+ başarılı kullanım sonrası** sistem Cihat'a sorar: *"genelleştirelim mi?"* — Cihat **tek tıklama** ile tüm firmalara açar veya bekletir

---

## DB Şeması (34. oturumda netleşen tam hali)

### `izometri_format_tanimlari`

```sql
CREATE TABLE izometri_format_tanimlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,                    -- "AVEVA E3D — Tersane X Şablonu"
  cad_program TEXT,                    -- "AVEVA E3D" (Karar 9 — varyant gruplama)
  cad_surum TEXT,                      -- "2.1" (sürüm farkları için)
  firma_kodu TEXT,                     -- opsiyonel referans
  parser_kural JSONB NOT NULL,         -- {alanlar: [{ad, regex, koordinat?, kaynak}], kolon_mapping: {...}}
  prompt_template TEXT,                -- Vision için sistem prompt'u (L3 fallback)
  fingerprint JSONB NOT NULL,          -- {pdf_uretici_regex, basliik_regex, dosya_adi_regex}
  egitim_kaynagi TEXT DEFAULT 'vision_only', -- 'vision_only' | 'pdf_excel' (Karar 7)
  tenant_id UUID NULL,                 -- NULL = sistem geneli, dolu = tenant-scope (Karar 2)
  aktif BOOLEAN DEFAULT true,
  basari_orani DECIMAL DEFAULT NULL,   -- otomatik hesaplanır
  kullanim_sayisi INT DEFAULT 0,       -- genelleştirme tetikçisi (5+ ise sor)
  son_kullanim TIMESTAMPTZ,
  olusturan_id UUID,                   -- kim oluşturdu (kullanıcı ID)
  olusturma TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_format_tenant ON izometri_format_tanimlari(tenant_id) WHERE aktif = true;
CREATE INDEX idx_format_cad ON izometri_format_tanimlari(cad_program);
```

### `izometri_batch_kayitlari` & `ai_api_log`

Brief Madde 05 ve 06 — değişiklik yok.

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
- Backend henüz hazır değil (502 hatası)
- Sahte gecikme (600-1500ms) + mock data ile akış test edilir
- 3. dosya bilinmeyen format simülasyonu (banner + manuel onay tetikleyici)
- Tanınmış formatta ~%15 spool şüpheli (sağlık uyarısı simülasyonu)
- URL `?canli=1` ile gerçek API zorlanabilir (geliştirici için)
- 36. oturumda backend hazır olduğunda `_DEMO_MOD = false` yapılacak

**ASME bağımlısı yerler:** `et_mm`, `boy_mm`, `agirlik_kg` mock data'da elle yazılı. 35. oturumda ASME Lookup hazır olunca backend bu değerleri `ARES_BORU.etKalinligi()` + `ARES_AGIRLIK.hesapla()` ile dolduracak.

**"İncele →" ve "Manuel Onay (X)" butonları:** Şu an alert ile *"Manuel onay sayfası 36. oturumda eklenecek"* gösteriyor. Ekran 2 yapılınca gerçek navigasyona dönüştürülecek.

---

## Sonraki Oturumlar İçin Sıra

| Oturum | İş | Önkoşul |
|---|---|---|
| **35** | ASME Lookup tam sistemi (`ares-asme.js` + `ares-agirlik.js` + `asme_olculer` DB tablosu) | Karar 5 (A1) |
| **36** | DB tabloları (`izometri_format_tanimlari`, `izometri_batch_kayitlari`) + backend dispatcher (`api/izometri-oku.js` refactor + 502 fix) + UI Ekran 2 (manuel onay) | 35 ✓ |
| **37** | UI Ekran 3 (Format Kaydet) — B Adımı (AI harita önerisi) + Excel upload (Karar 7) | 36 ✓ |
| **38** | C Adımı (görsel işaretleme — canvas drawing) + genelleştirme bildirimleri + Cihat onay UI'ı + ZORUNLU SELF-TEST | 37 ✓ |
| **39+** | Pilot AVEVA-PAOR canlıya alınır, 2-3 örnek PDF ile test, super_admin "AI API Kullanım" sekmesi | 38 ✓ + Cihat'ın PDF örneklerini yüklemesi |

**Önemli:** 38. oturum aynı zamanda zorunlu self-test günü (33→38, 5 oturum). Self-test geçmezse o oturumda kural sistemi tamir edilir, izometri batch'e devam edilmez.

---

## Açık Sorular (Sonraki Oturumlarda Karar Verilecek)

1. **Maliyet eşiği aşıldığında**: sadece uyarı mı, yoksa belli bir aşımdan sonra sert blok da mı? (38. oturumda)
2. **Format kuralı önerisi mekanizması (B Adımı)**: Sistem ne kadar otomatik regex çıkarsın? (37. oturumda)
3. **C Adımı canvas implementasyonu**: PDF.js + native canvas mı, yoksa fabric.js gibi kütüphane mi? (38. oturumda)
4. **IFS Excel dönüşümü (Yol B)**: 39+ ürün dönemine bırakıldı
5. **Kabuller motoru** (DN50 altı argon, slip-on flanş = 2 kaynak vb.): pilot kuralın içinde mi, ayrı helper mı? (36'da)
6. **Süper admin "AI API Kullanım" sekmesi mockup**: 39'a bırakıldı

---

## Kapsam Dışında Bırakılanlar (NET)

- Süper admin test laboratuvarı sayfası (Karar 3 — iptal)
- Format başına ayrı `.js` dosyaları (Karar 1 — reddedildi)
- Doğrudan sistem geneli kaydetme (Karar 2 — reddedildi)
- Hardcoded ASME tablosu (Karar 5 — reddedildi, A1 seçildi)
- Sürekli çift kaynak modu (Karar 7 — sadece eğitim modu)
- Çoklu format karışık batch desteği (Karar 8 — bir batch = bir format)

---

> **Bu dokümanın amacı:** Sonraki oturumlar açıldığında Claude bu dosyayı okur, mimari kararları yeniden tartışmaz. Sadece bu kararları **uygulamaya** odaklanır. Yeni öneri çıkarsa açık sorular bölümüne eklenir, mevcut kararlar bozulmaz.
