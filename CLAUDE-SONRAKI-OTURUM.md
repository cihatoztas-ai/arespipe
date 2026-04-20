# AresPipe — 8. Oturum Gündemi

> 7. oturumda biriken işler ve sonraki oturum öncelikleri.
> Başlangıçta bu dosyayı + CLAUDE.md + CLAUDE-SON-OTURUM.md birlikte oku.

---

## Oturum Başı Ritüeli

1. **CLAUDE.md** oku — mimari, kurallar (E-01, E-02, E-03, E-04, E-05)
2. **CLAUDE-SON-OTURUM.md** oku — önceki oturum ne yapıldı, deploy durumu
3. Bu dosya (**CLAUDE-SONRAKI-OTURUM.md**) — ne yapılacak
4. Kullanıcıya sor: "7. oturum deploy'u test ettin mi? Hangi öncelikten başlayalım?"

---

## ÖNCELİK 1 — Admin UI Tenant Kod Yönetimi

**Konu:** 6-7. oturumda tenant prefix sistemi kuruldu (E-03). Kodlar şu an DB'de manuel `INSERT`/`UPDATE` ile atanıyor. Admin UI yok. Yeni firma oluşturunca kod atama ekranı gerek.

**Yer:** `tanimlar.html` (veya yeni admin sayfası)

**Gereken özellikler:**
- Firma (tenant) oluştururken "Kod" alanı (1-4 harf, A-Z, UPPERCASE zorlanır)
- Çakışma kontrolü: gerçek zamanlı (keyup) veya submit öncesi
- Çakışma durumunda iki aşamalı onay:
  - "Bu kod zaten X firmasına atanmış"
  - "Yine de atamak istiyor musun?" → "Evet" derse eski firmadan kodu çekip yeniye verir (atomic migration)
- **Yasak kod listesi** (uygunsuz çağrışımlar):
  ```js
  const YASAK_KODLAR = ['AM', 'OC', 'GO', 'SI', 'KK', 'TC', 'PK']; // örnek
  ```
  Not: Liste kullanıcıyla birlikte genişletilmeli (tersane jargonuna göre)
- Mevcut firmalar için "Kodu Değiştir" butonu (admin yetkisi gerekir)
- Kod değiştirilirse UYARI: "Bu işlem geri alınamaz ve eski QR'lar çalışmaz" (aslında çalışır ama dikkat çek)

**Risk:** Düşük — yeni sayfa/yeni UI, mevcut akışları bozmaz. RLS ve E-03 altyapısı hazır.

**Tahmini süre:** 1-2 saat

---

## ÖNCELİK 2 — Denormalizasyon Borcu: spooller ↔ spool_malzemeleri Sync

**Konu:** 7. oturumda fark edildi. Aynı bilgi iki tabloda saklanıyor, sync değil:

| Kolon | spooller | spool_malzemeleri |
|---|---|---|
| malzeme | `spooller.malzeme` (aggregate) | `spool_malzemeleri.malzeme` (kalem-seviyesi) |
| kalite  | `spooller.kalite` (baskın) | `spool_malzemeleri.kalite` (kalem-seviyesi) |

**Semptomlar:**
- `spool_malzemeleri.kalite` temizlendi ama `spooller.kalite` kirli kaldı (7. oturumda farkedildi, 46 kayıt düzeltildi)
- Kullanıcı "bir yerde düzelir başka yerde bozulur" hissi yaşıyor
- Hangi tablodan okunduğu belirsiz, her sayfa farklı kullanıyor

**Çözüm seçenekleri:**
- **Option A (önerilen):** `spooller.malzeme` ve `spooller.kalite` kolonlarını kaldır. UI her zaman `spool_malzemeleri`'den aggregate eder. En temiz. Ama devre_detay vs. sorguları refactor gerekir.
- **Option B:** Kolonlar kalır ama trigger ile spool_malzemeleri INSERT/UPDATE/DELETE'te otomatik güncellenir. Daha invazif, PostgreSQL trigger gerekir.
- **Option C:** Sadece UI konvansiyonu — "daima spool_malzemeleri'nden oku" kuralı ama sync problemi kalır.

**Karar:** Option A en iyisi ama büyük refactor. Option C geçici. Option B PostgreSQL trigger'ı uzun vade sürdürülebilir değil.

**Risk:** Yüksek — DB değişikliği + 5-6 sayfa refactor. Dikkatli planlanmalı.

**Tahmini süre:** 3-4 saat (option A ile)

---

## ÖNCELİK 3 — Değişken Adlandırma Temizliği

**Konu:** `spool_detay.html`'de `SP._gemi` değişkeni aslında `dv.projeler.proje_no` tutuyor (satır 994). Ad yanıltıcı, kod sahtekarlığı. 7. oturumda yorumlarla not düşüldü ama yeniden adlandırılmadı.

**Yapılacak:**
- `SP._gemi` → `SP._projeNo` (gerçek anlamını yansıtsın)
- Eğer gerçek gemi adı istenirse `SP._gemiAdi = dv.projeler.gemi_adi` ayrı ekle
- Tüm `SP._gemi` referanslarını değiştir (spool_detay + lokalStorage + eski code paths)

**Dikkat:** `SP` localStorage'dan okunuyor (`ares_aktif_spool`). Migration gerekir: yeni kod eski formatı de okuyabilmeli.

**Risk:** Orta — çoklu dosya etkisi, localStorage backward compat

**Tahmini süre:** 1 saat

---

## ÖNCELİK 4 — spool_detay.html Dropdown E-01 İhlali

**Konu:** 7. oturumda farkedildi, düzeltilmedi. `spool_detay.html` satır 762-763:

```html
<select id="ed_malz"><option>Karbon Çelik</option><option>Paslanmaz</option>...</select>
<select id="ed_yuz"><option>Asit</option><option>Galvaniz</option><option>Epoksi</option>...</select>
```

**Sorunlar:**
- Option value'ları Türkçe ("Karbon Çelik" vs canonical kod "karbon") — E-01 ihlali
- "Epoksi" yüzey hâlâ var ama standart listede yok
- "Diğer" ve "Boya" eksik

**Yapılacak:**
- ARES_NORM'dan canonical kod listesi çek (`_malzemeMap` ve `_yuzeyMap` keys)
- Option'larda value=canonical, text=lokalize etiket
- Saving'de canonical kod kaydet
- Migrate mevcut varyantları (örn. "Epoksi" → "boya" veya "diger"?)

**Risk:** Orta — edit modal, save path etkili

**Tahmini süre:** 1-1.5 saat

---

## ÖNCELİK 5 — devre_detay Inline Edit Duplicate Bug

**Konu:** `devre_detay.html`'de spool satırları için inline edit `s.spoolNo` KEY kullanıyor (satır ~1197-1271, ~10 fonksiyon). Duplicate spool_no varsa (aynı devrede iki kayıt "S01" gibi), ilkini düzenler ve ikinciyi atlar.

**Çözüm:** `s.spoolNo` yerine `s.supaId` (UUID) kullan. DOM attribute olarak veya closure variable ile.

**Dikkat:** 10+ fonksiyon etkili, dikkatli bir refactor gerekir. Test senaryosu hazırla (iki duplicate spool_no yaratıp edit dene).

**Risk:** Orta-Yüksek — karmaşık state management

**Tahmini süre:** 2-3 saat

---

## ÖNCELİK 6 — Mobil Ekranlar Rafta

7. oturumda hiç dokunulmadı. Web işleri uzadıkça mobil geride kaldı.

**Yapılacak ekranlar (mockup-first, R-10 kuralı):**
- MProfil (kullanıcı profili)
- MIsBaslat (iş başlatma wizardı)
- MDevreler (devre listesi — zaten yarım implemente)
- MDevreDetay (devre detayı)
- MSpoolDetay (spool detayı)
- MQRTara (QR tarama, kamera permissive)

**Süreç:**
1. Her ekran için önce SVG mockup (kullanıcı onayı)
2. React component implementasyonu
3. Route'lara ekleme
4. Test (arespipe-mob.vercel.app üzerinden)

**Risk:** Düşük — React tarafı izole, web'i etkilemez

**Tahmini süre:** Her ekran ~1-2 saat, toplam 6-12 saat (birden fazla oturum)

---

## ÖNCELİK 7 — Düşük Öncelik / Teknik Borç

### 7.1 Tüm Sayfalarda Malzeme/Yüzey Display Audit
7. oturumda `devre_detay.html` düzeltildi. Diğer sayfalarda (`kesim.html`, `markalama.html`, `kalite_kontrol.html`, `sevkiyatlar.html`) malzeme/yüzey gösterimi düzgün mü?

Kontrol:
```bash
grep -n "s\.malzeme\|s\.yuzey\|\.malzeme ||\|\.yuzey ||" *.html
```
ARES_NORM'suz ham gösterim varsa düzelt.

### 7.2 devreler.malzeme Canonical Migration
4. oturumdan devam, hâlâ Türkçe format. `spooller.malzeme` ve `spool_malzemeleri.malzeme` temizlendi ama `devreler.malzeme` hâlâ `['Karbon Çelik', 'Paslanmaz']` formatında. Array tip.

```sql
-- Kontrol sorgusu:
SELECT malzeme FROM devreler WHERE malzeme IS NOT NULL LIMIT 10;
```

Format canonical'a geçirilmeli: `['karbon', 'paslanmaz']`.

### 7.3 QR İndir Butonu
Şu an "ileride" toast mesajı (NOT-02). İsteğe bağlı PNG/SVG export. Kanvas'tan `toDataURL()` + download link.

### 7.4 ares-store.js Supabase Key
Hâlâ `sb_publishable_...` formatında. CLAUDE.md "JWT anon key kullan" diyor. Web auth problem vermiyor ama tutarsız. Supabase dashboard'dan anon key al ve değiştir.

### 7.5 Search Haystack'te markaId
`kesim.html`, `markalama.html`, `kalite_kontrol.html` search haystack'te `h.spoolId` raw kullanılıyor. Kullanıcı "0074" yazıp arıyorsa bulur, "A-0074" arıyorsa bulmayabilir. Düşük öncelik çünkü kullanıcılar genelde kısa kod arıyor.

### 7.6 Dil Dosyası Güncelleme
`CLAUDE-SON-OTURUM.md`'de listelendi. 5 yeni anahtar eklenecek (TR/EN).

---

## Yeni Oturumda Başlangıç Tavsiyeleri

**Kullanıcı deploy test etti mi kontrol et:**
- QR etiket yazdırma çalışıyor mu?
- Prefix her sayfada görünüyor mu?
- Marka formatı tutarlı mı?
- Rev-0 atıldı mı, Rev-2 görünüyor mu?

**Sonrasında öncelik soruşması:**
```
7. oturum deploy'u nasıl gitti? Hangi öncelikten başlayalım?
- Öncelik 1: Admin UI tenant kod (1-2 saat, düşük risk)
- Öncelik 2: Denormalizasyon borcu (3-4 saat, yüksek risk)
- Öncelik 6: Mobil ekranlar (1-2 saat/ekran)
```

---

## Bilinmesi Gereken Yan Bulgular

- **`SP._gemi` = proje_no** (adı yalan söylüyor — bkz. Öncelik 3)
- **Migration-in-progress pattern yaygın:**
  - `fotograflar.yapan_id` / `yukleyen_id`
  - `spooller.agirlik` / `agirlik_kg`
  - `spooller.spool_id` (prefix'li / prefix'siz)
- **RLS policy'leri hazır** — yeni işlere tenant_id eklemek şart
- **Supabase key'i `sb_publishable_`** — tutarsız ama çalışıyor (Öncelik 7.4)
