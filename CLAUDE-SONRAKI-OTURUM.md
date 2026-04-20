# AresPipe — 9. Oturum Gündemi

> 8. oturumda biriken işler ve sonraki oturum öncelikleri.
> Başlangıçta bu dosyayı + CLAUDE.md + CLAUDE-SON-OTURUM.md birlikte oku.

---

## Oturum Başı Ritüeli

1. **CLAUDE.md** oku — mimari, kurallar (E-01, E-02, E-03, E-04, E-05)
2. **CLAUDE-SON-OTURUM.md** oku — önceki oturum ne yapıldı, deploy durumu
3. Bu dosya (**CLAUDE-SONRAKI-OTURUM.md**) — ne yapılacak
4. Kullanıcıya sor: "8. oturum deploy'u test ettin mi? Devre dedup bug'ı test edebildin mi?"

---

## ÖNCELİK 1 🔴 — Devre Dedup UX + Gemi Numarası Benzersizliği

**8. oturumun en kritik açık bulgusu.** İki bug birbirine bağlı:

### Bug A — Sessiz dedup
`devre_yeni.html`'de kullanıcı yeni devre oluşturmak isteyince, sistem proje + devre_adı + zone + tersane kombinasyonu mevcutsa **yeni devre yaratmıyor, mevcut devreye spool ekliyor**. Kullanıcıya bildirilmiyor.

**Semptom:**
- Form "kaydedildi" der
- Kullanıcı devreler listesinde göremez (çünkü mevcut devre eski, `ad=null`)
- Kullanıcı "kaydedilmedi" sanır
- Ama log'da `DEVRE_EKLE` var + spool'lar DB'de

### Bug B — Gemi numarası benzersizlikte yok
Tersanede aynı proje farklı gemilerde tekrar edilebilir:
- **NB1124** — 1. gemi, pipelinelar `M100-317-01-P2-S01` vb.
- **NB1125** — 2. gemi, AYNI pipeline'lar

Şu an sistem NB1124 ve NB1125'i ayırmıyor, dedup birleştiriyor.

### Çözüm seçenekleri

**Seçenek A — Sadece UX fix (kolay):**
- Dedup mantığı kalır, ama kullanıcıya popup çıkar:
  > "Bu kombinasyon zaten var — Devre: 803-Bilge, Proje: P26-127. Mevcut devreye spool eklensin mi yoksa yeni devre mi oluşturulsun?"
- 2 buton: "Mevcute ekle" / "Yeni devre oluştur (kombinasyonu zorla)"

**Seçenek B — Gemi numarasını kolon olarak ekle (daha doğru):**
- `devreler` tablosuna `gemi_no TEXT` ekle (ya da `projeler.gemi_no` varsa JOIN'le çek)
- Benzersizlik: `(proje_id, gemi_no, devre_ad, zone)` dörtlüsü
- NB1124-M100-317 ve NB1125-M100-317 ayrı devreler olur

**Seçenek C — A + B:**
- Gemi_no ekle + popup da ekle

**Karar:** Kullanıcı tartışırken tercihini söyleyecek. Benim önerim **C** — hem doğru veri modeli hem güvenli UX.

### Risk
Yüksek — `devre_yeni.html` + `devreler.html` + DB schema + migration. Birkaç saat.

### Tahmini süre
3-5 saat (Seçenek C ile)

---

## ÖNCELİK 2 🔴 — devre_yeni.html INSERT Akışı Gözden Geçir (Bug #3-5)

### Bug #3 — "Paslanmaz" migration eksik
DB'de `malzeme = "Paslanmaz"` olan 1 eski kayıt (7 Nisan). Canonical olmalıydı (`paslanmaz`). 4. oturumun Faz 2 migration'ında atlandı.

**Fix:**
```sql
-- Önce tara
SELECT id, malzeme FROM devreler WHERE malzeme ~ '^[A-ZÇĞİÖŞÜ]';
SELECT id, malzeme FROM spooller WHERE malzeme ~ '^[A-ZÇĞİÖŞÜ]';
SELECT id, malzeme FROM spool_malzemeleri WHERE malzeme ~ '^[A-ZÇĞİÖŞÜ]';

-- Sonra lowercase
UPDATE devreler SET malzeme = lower(malzeme) WHERE malzeme ~ '^[A-ZÇĞİÖŞÜ]';
-- (hangi değerler çıkarsa ARES_NORM.malzemeKod ile canonical'e çevirmek gerekebilir)
```

**Risk:** Düşük
**Süre:** 30 dk

### Bug #4 — islem_log zamanlama
`DEVRE_EKLE` logu 13 gün önce oluşturulan devre için bugün yazılmış. Muhtemelen `devre_yeni.html`'de dedup sonrası log yanlış atılıyor (hem eski devreye hem de yeni iş için).

**Fix:** `devre_yeni.html` içinde `ARES.logEkle('DEVRE_EKLE', ...)` çağrı noktalarını tara. Dedup olduğunda `DEVRE_EKLE` yerine `SPOOL_EKLENDI` gibi farklı bir log atılmalı.

**Risk:** Orta
**Süre:** 1 saat

### Bug #5 — Fark popup malzeme yolu
3 farklı malzeme: form beyanı "Karbon Çelik", popup "Bakır Alaşım" beyan eder, DB'ye "Paslanmaz" yazılır. Çok kafa karıştırıcı.

**Fix:**
1. Popup "Yüklemeye devam et" dediğinde hangi malzemeyi INSERT'e koyuyor izlemek
2. `spooller.malzeme` alanında form değeri mi, IFS değeri mi, popup seçimi mi yazılıyor?
3. 5. oturumda fark popup eklenmişti ama akışı tam anlayıp tamamlamadık

**Risk:** Yüksek (silent data corruption riski)
**Süre:** 2 saat

---

## ÖNCELİK 3 — CLAUDE.md Güncellemesi

Bu oturumdan sonra CLAUDE.md'ye eklenmesi/güncellenmesi gereken 3 şey var:

1. **Bölüm 4.2 — islem_log tam şeması** (8. oturumda öğrendik):
   ```
   id, tenant_id, olusturma
   islem TEXT, katman TEXT, katman_id UUID, yapan_id UUID
   aciklama TEXT, meta JSONB
   spool_id UUID, devre_id UUID, proje_id UUID
   ```

2. **Bölüm 2.14 — E-03 tenant prefix** sonuna admin UI notu:
   > Admin UI: `admin/yeni-firma.html` (yeni firma kodu atama, çakışma kontrolü) + `admin/firma-detay.html` (mevcut firma kodu düzenleme, çift onay). Sadece `super_admin` rolü erişir.

3. **Bölüm 2.15 — E-04 marka formatı** sonuna digit notu:
   > `sayac_tanimlari.spool.digits = 6` (DB'de padded format). Display `ARES.markaId()` min 4 haneye kırpar. 9999 sonrası otomatik 5-6 hane görünür.

**Süre:** 15 dakika

---

## ÖNCELİK 4-9 — 7. Oturumdan Taşınan İşler (değişmedi)

### Öncelik 4: Denormalizasyon Borcu (spooller ↔ spool_malzemeleri)
- `spooller.malzeme` ve `spool_malzemeleri.malzeme` sync değil
- Option A (önerilen): `spooller.malzeme/kalite` kolonlarını kaldır, UI her zaman `spool_malzemeleri`'nden aggregate eder
- **Risk:** Yüksek, 3-4 saat
- **Not:** Bu iş Bug #5 ile ilişkili olabilir — birlikte çözülebilir

### Öncelik 5: Değişken Adlandırma (`SP._gemi` → `SP._projeNo`)
- `spool_detay.html` satır 994: `SP._gemi` aslında `projeler.proje_no` tutuyor
- localStorage backward compat gerekir
- **Risk:** Orta, 1 saat

### Öncelik 6: spool_detay Dropdown E-01 İhlali
- `spool_detay.html` satır 762-763: "Karbon Çelik" gibi Türkçe value'lar
- Canonical kod + ARES_NORM'dan lokalize etiket
- **Risk:** Orta, 1-1.5 saat

### Öncelik 7: devre_detay Duplicate spool_no Bug
- Inline edit `s.spoolNo` KEY kullanıyor, duplicate varsa ilki düzenler ikinciyi atlar
- Fix: `s.supaId` (UUID) kullan
- **Risk:** Orta-Yüksek, 2-3 saat

### Öncelik 8: Mobil Ekranlar
- MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- Mockup-first (R-10)
- **Risk:** Düşük her biri, toplam 6-12 saat

### Öncelik 9: Düşük Öncelik / Teknik Borç
- devreler.malzeme canonical migration
- QR indir butonu PNG/SVG export
- Search haystack markaId ekleme
- Dil dosyası 5 yeni anahtar güncellemesi
- **Toplam:** 2-3 saat

---

## Yeni Oturumda Başlangıç Tavsiyeleri

**Kullanıcı deploy test etti mi kontrol et:**
- Firma Kodu alanı admin/yeni-firma ve admin/firma-detay'da görünüyor mu?
- Yeni spool'lar DB'de 6 hane padded mi? Ekranda 4 hane mi görünüyor?
- Eski spool'lar hâlâ aynı görünüyor mu (regresyon yok mu)?

**Devre dedup bug'ı yeniden tetiklendi mi:**
- Aynı kombinasyonla yeni devre oluşturmaya çalışınca ne oluyor?
- Popup istenir mi, sessiz birleşmeli mi?

**Sonrasında öncelik soruşması:**
```
8. oturum deploy'u nasıl gitti?
Hangi öncelikten başlayalım?
- Öncelik 1: Devre dedup UX + gemi_no (3-5 saat, YÜKSEK risk) 🔴
- Öncelik 2: devre_yeni.html INSERT akışı bug avı (3-4 saat) 🔴
- Öncelik 3: CLAUDE.md güncellemesi (15 dk, risk yok)
- Öncelik 4: Denormalizasyon (3-4 saat, yüksek risk)
```

---

## Bilinmesi Gereken Yan Bulgular

### 8. Oturumdan Yenileri
- **islem_log şeması öğrenildi** — CLAUDE.md'ye eklenecek
- **`sayac_tanimlari.digits` tenant bazında DB'de tutuluyor** — hardcoded değil
- **`sonraki_no` RPC sadece integer döndürüyor** — padding JavaScript `_noFormatla`'da yapılıyor
- **`markaId()` hem legacy hem yeni formatı destekliyor** — unit test ile doğrulandı
- **Devre `ad` kolonu hep NULL** — UI'da başka alanlardan türetilen devre adı
- **7 Nisan devresinin `malzeme = "Paslanmaz"`** — migration atlandı, lowercase yapılmalı

### Hâlâ Geçerli (önceki oturumlardan)
- **`SP._gemi` = proje_no** (adı yalan söylüyor — Öncelik 5)
- **Migration-in-progress pattern yaygın:**
  - `fotograflar.yapan_id` / `yukleyen_id`
  - `spooller.agirlik` / `agirlik_kg`
  - `spooller.spool_id` (prefix'li / prefix'siz / yeni 6-hane / eski 4-hane)
- **RLS policy'leri hazır** — yeni işlere tenant_id eklemek şart
- **Supabase key'i hâlâ `sb_publishable_`** — tutarsız ama çalışıyor (Öncelik 9)

---

## Özet — 9. Oturum Ne Beklenebilir

**Kısa:** Kritik bir devre dedup bug'ı var. Öncelik 1 ile başlamak doğru — hem kullanıcıyı rahatlatır hem `devre_yeni.html` kodunun tam haritasını çıkarmamıza olanak sağlar. Bu harita sonra Bug #3-5 ve Öncelik 4 (denormalizasyon) için de değerli.

**Risk uyarısı:** `devre_yeni.html` 2058 satır, karmaşık. Bir şey değiştirirken ikinci bir şey kırma ihtimali yüksek. Dikkatli unit test + canlı doğrulama şart.
