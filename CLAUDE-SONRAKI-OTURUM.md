# 36. Oturum Gündemi — İzometri Batch Backend + 35 Canlı Doğrulama

> **Tarih:** 28 Nisan 2026 (veya sonrası)
> **Tema:** İzometri Batch backend dispatcher + DB tabloları + Ekran 2 (manuel onay UI)
> **Önkoşul:** 35'in canlı doğrulaması (4 dosya yüklü + migration çalıştı + test 50/50 + CI yeşil)
> **Önkoşul belge:** `docs/IZOMETRI-BATCH-KARAR.md` (Karar 1-10)

---

## 36. Oturum Açılışı (~10 dk — 35 doğrulama)

**Standart 5 soruluk ritüel** (CLAUDE.md), sonra:

### 1. 35'in canlı doğrulaması (öncelikli)

> "35'te ASME Lookup veri katmanını yapmıştık. 4 dosyayı yüklediğini söylemiştin. Şimdi kontrol edelim:"

```sql
-- Supabase SQL editor'de çalıştır:
SELECT 'asme_borular' AS tablo, COUNT(*) FROM asme_borular
UNION ALL
SELECT 'cuni_borular', COUNT(*) FROM cuni_borular;
```

**Beklenen:**
- `asme_borular` → 334 satır (karbon 214 + paslanmaz 70 + alüm 50)
- `cuni_borular` → 24 satır (cunife 20bar 12 + 16bar 12)

**Birim test:**
```bash
node tests/asme-lookup.test.js
```
**Beklenen:** "50 başarılı, 0 başarısız"

**Spot check (Cihat sektörel değerlerle karşılaştırır):**
- DN100 SCH40 karbon: et 6,02 mm — ağırlık 16,08 kg/m
- DN200 SCH40 karbon: et 8,18 mm — ağırlık 42,55 kg/m
- DN150 EEMUA 20bar cunife: OD 159 mm (ASME 168,3'ten farklı)

**Eğer doğrulama tamamsa:** 35 kapatılır, 36 ana işine geçilir.
**Eğer hata varsa:** Önce hata düzeltilir, sonra ana iş.

### 2. db-backup saat kontrolü

> "27-30 Nis sabahları izlemeye almıştık. `arespipe-backups` repo Commits sekmesinde son commit saati TR 03:00-03:30 (UTC 00:00-00:30) mı?"

- Doğru saatteyse: ✅ defter temizlenir, gözlem süresi biter
- Hâlâ kayıksa: `arespipe-backups` repo'sundaki `db-backup.yml` cron syntax kontrolü

### 3. Ekran 1 demo testi

> "izometri-batch.html'i tarayıcıda açıp demo modu test ettin mi? PDF yükleme + Batch Başlat + format badge'leri + manuel onay vurgusu görsel olarak çalışıyor mu?"

- Çalışıyorsa: ✅ Ekran 1 frontend kapatıldı (34'te yazılmıştı)
- Sorun varsa: kısa düzeltme, sonra 36 ana işine geç

### 4. Cihat'tan örnek PDF

> "2-3 örnek PAOR/AVEVA PDF yükleyebildin mi? 36-37'de format kuralı yazımı için lazım."

- Varsa: 36 sonunda kısa inceleme (parser'ın hangi alanları çıkarması gerektiği)
- Yoksa: 36 PDF'siz ilerler (genel yapı kurulur), 37'de PDF'ler gelirse format örneği hazırlanır

---

## 36. Oturumun Ana İşi — İzometri Batch Backend

### Hedef

Ekran 1 (34'te yazılı, demo modunda) backend ile bağlanır. Mock data silinir, gerçek API çalışır. Manuel onay UI'sı (Ekran 2) yapılır.

### Çıktılar (büyük oturum, belki 2'ye bölünür)

#### **1. DB tabloları**

`migrations/36-oturum-izometri-batch.sql`:

```sql
CREATE TABLE izometri_format_tanimlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  cad_program TEXT,
  cad_surum TEXT,
  firma_kodu TEXT,
  parser_kural JSONB NOT NULL,
  prompt_template TEXT,
  fingerprint JSONB NOT NULL,
  egitim_kaynagi TEXT DEFAULT 'vision_only',
  tenant_id UUID NULL,                  -- NULL = sistem geneli
  aktif BOOLEAN DEFAULT true,
  basari_orani DECIMAL DEFAULT NULL,
  kullanim_sayisi INT DEFAULT 0,
  son_kullanim TIMESTAMPTZ,
  olusturan_id UUID,
  olusturma TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE izometri_batch_kayitlari (
  -- Brief Madde 05'teki şema, bkz docs/IZOMETRI-BATCH-KARAR.md
);

-- ai_api_log tablosu (zaten varsa atla)
```

#### **2. Backend dispatcher refactor**

`api/izometri-oku.js`:
- 502 hatası fix (mevcut iş borcu, B katmanı önkoşulu)
- Format dispatcher: hangi format tespit edilir, ona uygun parser çağrılır
- L1 (regex), L2 (claude haiku), L3 (claude vision) cascade
- ASME helper entegrasyonu — `ARES_BORU` ile et/dış çap/iç çap/ağırlık dolduruluyor
- `ai_api_log` tablosuna her çağrı kaydı

#### **3. Ekran 2 (Manuel Onay UI)**

`izometri-batch-incele.html` veya `izometri-batch.html`'in alt sekmesi:

- Şüpheli satırların listesi (sağlık uyarısı çıkanlar)
- Her satır için: PDF orijinal görüntüsü + parser'ın çıkardığı değerler + düzeltme inputları
- "Bu formatı kaydet, bir sonraki PDF'te ücretsiz parse et" butonu
- Onaylanan satırlar yeşil, reddedilenler kırmızı, beklemedeler turuncu

#### **4. Ekran 1 demo modu kapanışı**

`izometri-batch.html`:
- `_DEMO_MOD = true` → `false`
- `_mockBatch()` fonksiyonu silinir
- Gerçek API çağrıları aktif
- Test: gerçek PDF yükle → backend ile parse et → sonuçları gör

### Yapılış Sırası (önerilen)

| Saat | İş |
|---|---|
| 1 | 35 doğrulama (10dk) + DB tablo şeması + migration |
| 2-3 | Backend dispatcher refactor + 502 fix |
| 3-4 | ASME helper entegrasyonu — boru ağırlıkları otomatik |
| 4-5 | Ekran 2 (manuel onay) iskelet + listeleme |
| 5+ | Ekran 1 demo modu kapanışı + canlı test |

**Eğer 5 saatten uzun olur:** 37'ye bölünür. 36'da DB + dispatcher + 502 fix + ASME entegrasyonu, 37'de Ekran 2 + Format Kaydet (B Adımı).

### Kapsam Dışı (36'da yapılmaz)

- **B Adımı (AI harita önerisi)** — 37'de
- **C Adımı (görsel işaretleme/canvas)** — 38'de
- **Excel upload (IFS eğitim modu)** — 37'de
- **Genelleştirme onay UI** — 38'de
- **super_admin "AI API Kullanım" sekmesi** — 39'da
- **Fitting/flanş tabloları** — 37-38

---

## Açılış Notları (Claude için)

### Sapmama Disiplini

- **35 doğrulamadan önce 36 ana işine başlama.** Migration çalışmamışsa veya test başarısızsa önce o düzeltilir.
- **PDF olmadan dispatcher kurabiliriz.** Cihat 36'ya kadar PDF yüklememişse, demo PDF veya generic test ile devam edilir.
- **502 fix öncelikli.** Backend dispatcher kurulurken ilk düzeltilecek mevcut bug.
- **ASME helper entegrasyonu Erken Adımda.** Backend boru parse ediyor → `ARES_BORU.etKalinligi(dn, sch, malzeme)` çağırıyor → ağırlık dolduruluyor. Bu test edilmeli.

### Veri Kaynakları

- ASME helper zaten hazır (35'te yapıldı)
- Demo PDF: brief'te referans var (`docs/IZOMETRI-BATCH-NOTLARI.md`)
- Cihat'ın PAOR PDF'si gelmeden de bir genel parser kurulabilir

### Statik vs DB

- `izometri_format_tanimlari` DB'de — runtime sorgu OK (her batch başlangıcında 1 kez fetch)
- ASME helper statik (35'te karar alındı, korunur)
- `ai_api_log` DB'de — her çağrı kayıt

### Sayfa Teslim Kontrol Listesi

- Lint geçer mi? `node .github/kontrol.js`
- G-08 yaygınlaştırma — yeni sayfa varsa standart uygula
- i18n — yeni metinler `tv()` ile, lang/{tr,en,ar}.json güncel
- RLS — yeni tablolar için tenant izolasyonu doğru mu?

---

## Açık Sorular (36'da kararlaştırılır)

1. **Şüpheli satır kriteri net mi?** Brief Madde 06'da var ama operasyonel: "DN yok" / "OD ölçüsüne uymuyor" / "ağırlık DN'den çok farklı" gibi tetikleyiciler.
2. **Format fingerprint nasıl oluşuyor?** PDF'in ilk sayfasındaki başlık + üretici metadata + dosya adı pattern. Net algoritma 36'da yazılır.
3. **Vision API maliyet eşiği soft uyarı mı, sert blok mu?** Brief tenant başına 50 PDF/ay default — aşılırsa ne olur?

---

## Olası Risk

- **502 fix beklenenden uzun sürebilir.** Cors, payload size, timeout sebepleri var. Eğer 1 saatten uzun sürerse Cihat'a ara verilir, alternatif yaklaşım tartışılır.
- **PDF'sız dispatcher demo amaçlı kalır.** Cihat PAOR PDF'i 37'ye gelirse 37'de gerçek format eklenir.
- **ASME helper'da bug çıkabilir.** 35'te 50/50 test geçti ama gerçek izometri parse'ında edge case'ler olabilir. Yeni keşif → defter, hızlı düzeltme.

---

## 37. Oturum Hatırlatıcı (yapılmadan biten önemli iş)

36 bitince Cihat'a hatırlat:

> **37. oturum:** Ekran 3 (Format Kaydet) — B Adımı (AI harita önerisi) + Excel upload (IFS eğitim modu, Karar 7) + fittings tabloları (eğer 36'da yetiştiremezsek). PAOR/AVEVA PDF örnekleri lazım — yüklediysen 37'de gerçek format kayıtları yapılır.

---

> **Bu doküman 36. oturum açıldığında okunur. Önce 35 doğrulama, sonra İzometri Batch backend.**
