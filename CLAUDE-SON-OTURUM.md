# AresPipe — Son Oturum Deploy Listesi

**Tarih:** 20 Nisan 2026 (6. oturum)
**Risk seviyesi:** DÜŞÜK — hepsi küçük, lokalize fix'ler; her biri bağımsız test edilebilir; DB migration'ları canlıda ve geri dönüşlü değil

---

## ⚡ Kaldığımız Yer (Özet)

**DB tarafı:** ✅ Tamamlandı (3 migration bu oturumda)

**Kod tarafı:** ✅ 2 dosya hazır, **deploy BEKLIYOR** (kullanıcı manuel push edecek)

**Yarım kalan iş var mı?** Evet — **Tenant prefix sisteminin spool_detay + qr_tara tarafları kaldı** (kritik, sonraki oturum Öncelik 1). Detay CLAUDE-SONRAKI-OTURUM.md'de.

**Sonraki oturumun ilk işi:** QR payload formatı + qr_tara.html cross-tenant kontrolü.

---

## Bu Oturumda Ne Yapıldı

Bu oturumun ana teması: **spool_detay.html sessiz bug avı + tenant prefix sisteminin temelini atma.** 12 fix çıktı, tamamı DB'yle UI arasındaki senkron kopukluklarını kapatıyor.

### 1. spool_detay.html — 11 fix

#### Notlar bug'ları (2 fix)
- Satır 1109 — `n.yapan_id` → `n.ekleyen_id` (map)
- Satır 1829 — `yapan_id` → `ekleyen_id` (insert)

**Canlı etkisi:** Kullanıcı not ekleyip sayfayı yeniliyordu → **not kayboluyordu.** DB'de `notlar.yapan_id` kolonu yok (sadece `ekleyen_id` var), insert silent fail oluyordu. Ayrıca okuma tarafında da yanlış kolon okunduğu için not kişisi UI'da hep "Admin" görünüyordu.

#### Fotograflar migration (3 fix + 1 değişken ayrımı + 1 UI fallback)
- Satır 915 — select'e `yukleyen_id` eklendi (legacy `yapan_id` de kalıyor)
- Satır 1051 — map eski davranış korundu (`f.yapan_id`), UUID göstermemek için
- Satır 1679 — `var yapan=_kullaniciAd()` → `yapanId` (UUID) + `yapanAd` (ad_soyad) ikisi ayrı
- Satır 1696 — insert `yukleyen_id: yapanId` (UUID kolonuna UUID)
- Satır 1700 — FOTOLAR.push `kisi: yapanAd` (UI için ad_soyad)

**Arka plan:** DB'de hem `fotograflar.yapan_id` (TEXT, legacy) hem `yukleyen_id` (UUID, canonical) var — migration-in-progress. 32 kayıttan 11'i eski, 21'i yeni. Eski kod TEXT kolonuna email yazıyordu, canonical UUID'ye migrate edildi.

**DB migration:** `UPDATE fotograflar SET yukleyen_id = k.id FROM kullanicilar k WHERE yukleyen_id IS NULL AND yapan_id = k.email` — 11 satır etkilendi, canlıda.

#### Spool ağırlık — sessiz veri kaybı (1 fix)
- Satır 2373-2377 — spooller UPDATE'e `agirlik:agrN` eklendi

**Canlı etkisi:** Spool düzenleme modalında ağırlık değiştirilebiliyordu, "Güncellendi" toast'ı geliyordu, UI güncelleniyordu — **ama DB'ye yazılmıyordu.** Sayfa yenilenince eski değer geri geliyordu.

#### Spool ID gösterim mantığı (2 fix)
- Satır 922 — `SP.spoolId = s.spool_id` atandı (spoolYukle'de hiç okunmuyordu!)
- Satır 1241, 2365 — Gösterim sırası ters (UUID[0-8] → kısa kod), düzeltildi

**Canlı etkisi:** 
- Sayfa başlığında "ID: 9D07969B" gibi UUID kısaltması görünüyordu — doğrusu "ID: A-0512" olmalıydı
- **QR kodu yanlış spool_id içeriyordu** — bu en kritik: tersanedeki operatör QR okuttuğunda yanlış spool açma riski vardı

#### Et kalınlığı header fallback (1 fix)
- Satır 929-939 — spooller.et_kalinligi_mm NULL ise malzemelerden en yaygın et_mm'yi kullan

**Canlı etkisi:** Spool detay header'ında "ET KALINLIĞI —" dash görünüyordu. Artık malzeme listesindeki en yaygın et değeri header'a yansıyor.

### 2. devre_yeni.html — Tenant Prefix (1 fix)

- Satır 1491-1500 — spooller insert'te tenant kodu + kısa kod birleşimi

**Canlı etkisi:** Yeni oluşturulan spool'ların `spool_id` kolonu artık `A-0504` formatında. Test edildi, canlıda çalışıyor (A-0512, A-0513 oluşturuldu).

**Graceful fallback:** Tenant kodu NULL ise eski davranış (prefix uygulanmaz). Geriye uyumlu.

### 3. DB Migration — 3 blok

**Blok A — Fotograflar UUID migration:**
```sql
UPDATE fotograflar f
SET yukleyen_id = k.id
FROM kullanicilar k
WHERE f.yukleyen_id IS NULL 
  AND f.yapan_id IS NOT NULL
  AND k.email = f.yapan_id;
-- 11 satır etkilendi
```

**Blok B — Tenants kod kolonu:**
```sql
ALTER TABLE tenants ADD COLUMN kod VARCHAR(4);
UPDATE tenants SET kod = 'A' WHERE id = '00000000-...-000000000001'; -- Demo Atölye
UPDATE tenants SET kod = 'B' WHERE id = 'aaaaaaaa-0001-...'; -- Demo İmalat
UPDATE tenants SET kod = 'C' WHERE id = 'aaaaaaaa-0002-...'; -- Demo Montaj
UPDATE tenants SET kod = 'D' WHERE id = 'aaaaaaaa-0003-...'; -- Demo Komple Boru
UPDATE tenants SET kod = 'E' WHERE id = 'aaaaaaaa-0004-...'; -- Demo Tersane
UPDATE tenants SET kod = 'F' WHERE id = 'aaaaaaaa-0005-...'; -- Demo Taşeron
UPDATE tenants SET kod = 'G' WHERE id = 'aaaaaaaa-0006-...'; -- Demo Karma
ALTER TABLE tenants ALTER COLUMN kod SET NOT NULL;
ALTER TABLE tenants ADD CONSTRAINT tenants_kod_unique UNIQUE (kod);
ALTER TABLE tenants ADD CONSTRAINT tenants_kod_format CHECK (kod ~ '^[A-Z]{1,4}$');
```

**Blok C — DB keşifleri (kod değişmedi ama CLAUDE.md güncellenecek):**
- `spool_malzemeleri` şeması: `dis_cap_mm`, `et_mm`, `boy_mm`, `agirlik_kg`, `kalite`, `malzeme`, `adet`, `boyut`, `kod`, `tip`, `tanim`, `heat_no`, `sertifikali` — hepsi canlıda
- `markalama_kalemleri.et_mm` var (plaka markalama için — numeric)
- `spooller.agirlik_kg` legacy kolon, 5/5 kayıt NULL (kullanılmıyor, DROP yapılabilir ileride)
- `fotograflar.yapan_id` legacy TEXT kolon (11 kayıtta email vardı, migrate edildi)

---

## Değişen Dosyalar (2)

| Dosya | Değişim | Satır (önce → sonra) |
|---|---|---|
| `spool_detay.html` | 11 fix (notlar, fotograflar, ağırlık, spool ID, et kalınlığı) | 2996 → 3007 |
| `devre_yeni.html` | 1 fix (tenant prefix) | 2009 → 2013 |

---

## Deploy Sırası (Önerilen)

Bu oturumdaki değişiklikler **sıra-bağımsız** — her ikisi de bağımsız fix'ler:

1. `devre_yeni.html` — yeni spool'lar doğru formatta doğar
2. `spool_detay.html` — mevcut + yeni spool'ların görüntülenmesi düzelir

DB migration zaten canlıda.

---

## Test Önerileri

### devre_yeni.html
1. Yeni devre oluştur, 2 spool ekle, kaydet
2. DB'den kontrol:
   ```sql
   SELECT spool_id, spool_no, olusturma 
   FROM spooller ORDER BY olusturma DESC LIMIT 5;
   ```
   Yeni spool'lar `A-05XX` formatında olmalı. ✅ test edildi (A-0512, A-0513)

### spool_detay.html
1. **Not ekleme:** Spoola git → not ekle → F5 → **not kalmalı** (önceden kayboluyordu)
2. **Fotoğraf yükleme:** Yeni fotoğraf yükle → `fotograflar.yukleyen_id` UUID dolu olmalı
3. **Eski fotoğraflar:** Kişi bilgisi "cihatoztas@gmail.com" göstermeye devam etmeli (11 legacy kayıt)
4. **Ağırlık kaydı:** Spool düzenle → ağırlık değiştir → kaydet → F5 → **yeni değer durmalı**
5. **Spool ID gösterimi:** Başlıkta "ID: A-0512" görünmeli (UUID kısaltması değil)
6. **QR kodu:** Aynı spool'dan QR üret → okut → aynı spool açılmalı
7. **Et kalınlığı header:** Malzeme listesinde et değeri olan spoollar için header'da artık dash değil gerçek değer

---

## Bilinen Açık Sorunlar (Sonraki Oturuma)

Detaylar CLAUDE-SONRAKI-OTURUM.md'de:

1. **Tenant prefix serisinin tamamlanması** — QR payload formatı `A-0504:UUID` + `qr_tara.html` cross-tenant kontrolü (Öncelik 1)
2. **Kalite UX + veri temizliği** — Form'daki kalite alanı malzeme radio grubu gibi davranıyor, "karbon/paslanmaz" değerleri alıyor. Olması gereken: ST37, A106-B, CuNi10Fe1Mn gibi kalite standartları (Öncelik 2)
3. **Spool No → marka gösterimi** — Tablolarda "S01" tek başına anlamsız, pipeline ile birleştirilmeli (Öncelik 3)
4. **Admin UI — tenant kod yönetimi** — Yeni firma oluştururken kod girişi, çakışma uyarısı, iki aşamalı onay override
5. **spool_detay.html performans** — 3000+ satır, 6-7 paralel SQL, 3D kod — optimize gerekli
6. **devreler.malzeme canonical migration** (4. oturumdan devam)
7. **CLAUDE.md güncellemesi** — spool_malzemeleri şeması + fotograflar.yapan_id legacy notu + tenants.kod kolonu

---

## Bu Dosyanın Ömrü

Bu dosya her oturum sonunda **üzerine yazılır**. Uzun vadeli proje tarihçesi `CLAUDE.md` Bölüm 11 / 11A / 11B / 11C / 11D'de yaşar — oraya bakılır.
