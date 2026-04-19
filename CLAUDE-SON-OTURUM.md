# AresPipe — Son Oturum Deploy Listesi

**Tarih:** 19 Nisan 2026 (4. oturum)
**Risk seviyesi:** DÜŞÜK-ORTA — DB migration yapıldı (tamamlandı), kod refactor'ü adım adım doğrulandı, syntax check'ler temiz

---

## Bu Oturumda Ne Yapıldı

İki büyük iş ve onlarla çevreli birkaç küçük temizlik:

1. **DB Migration — Faz 2 TAMAMLANDI**
   - 3. oturumdan sonra `spooller.malzeme` ve `spool_malzemeleri.malzeme` hâlâ 3 farklı formatta karışık veri tutuyordu: `karbon_celik` (841), `Karbon Çelik` (126), `bakir_alasim` (77), `paslanmaz` (20)
   - Tek canonical formata dönüştürüldü: `karbon` (1005), `bakir` (83), `paslanmaz` (20)
   - Yüzey de aynı şekilde: `Asit` (24) → `asit`, toplam 4 kod
   - Test kaydı: `yuzey='epoksi'` silindi (7 Nisan 2026 test girişi)
   - devre_yeni.html canlıda doğru kod formatında yazıyor — test edildi (17:03 spool'u: `malzeme='karbon', yuzey='galvaniz'`)

2. **devreler.html + kesim.html — Tam Refactor**
   - `devreler.html` ARES_NORM'a entegre edildi (kendi `_normalizeMalzeme` fonksiyonu kod duplikasyonuydu, eski `karbon_celik` gibi kodlar dönüyordu)
   - `matBadge` renk sınıfı karşılaştırmaları eski kodlara göreydi — delegasyon sonrası kaybolacaktı, yeni kodlara (`karbon`, `bakir`, `alum`) güncellendi
   - `kesim.html` filter dropdown'u kod bazlı hale getirildi, tüm gösterimler lokalize edildi
   - Dil dosyalarından `plastik` ve `epoksi` anahtarları kaldırıldı (operasyonda kullanılmıyor)

---

## Değişen Dosyalar (6)

### 1. `ares-normalize.js` (116 satır)
- `yuzeyKod` regex'ine `boya` kelimesi eklendi: `/boyal|boya|paint/`
- Default etiket: `boyali: 'Boya'` (eski `'Boyalı'`)
- **plastik ve epoksi pattern'leri kaldırıldı** (operasyonda yok)

### 2. Dil Dosyaları (3) — 1340 → 1338 anahtar
- `lang/tr.json` — 3 değişiklik:
  - `cmn_malzeme_plastik` silindi
  - `cmn_yuzey_epoksi` silindi
  - `cmn_yuzey_boyali`: "Boyalı" → **"Boya"**
- `lang/en.json` — 2 silinti (plastik + epoksi), "Painted" korundu
- `lang/ar.json` — 2 silinti (plastik + epoksi), "مطلي" korundu

### 3. `devreler.html` (2357 satır) — 6 nokta, 106 satır fark
- **Script tag:** `ares-normalize.js` eklendi (kural 2.2 sırası: store → lang → normalize → layout)
- **`_normalizeMalzeme` / `_normalizeYuzey`:** 20 satırlık kendi gövdesi silindi, ARES_NORM'a delege edildi. Artık `karbon` formatında kod dönüyor (eski: `karbon_celik`)
- **`rebuildSelect`:** `alan` parametresi eklendi, option text'i lokalize ediliyor (`ARES_NORM.tvMalzeme/tvYuzey`)
- **Pie chart label'ları (2 yer):** `malzemeItems` ve `malzemeModalAc` — artık lokalize etiket gösteriyor
- **🔴 Kritik bug fix:** `matBadge`/`yuzeyBadge` eski kodlarla (`karbon_celik`, `bakir_alasim`, `aluminyum`, `plastik_pe`) renk sınıfı kontrolü yapıyordu. Delegasyon sonrası hiçbir `if` eşleşmeyecek, tüm badge'ler `mb-diger` olacaktı. Yeni kodlara güncellendi (`karbon`, `paslanmaz`, `bakir`, `alum`).

### 4. `kesim.html` (1476 satır) — 7 nokta, 69 satır fark
- **`borular` map:** Her kayda `malzemeKod` alanı eklendi (`ARES_NORM.malzemeKod(mal.malzeme)`)
- **`populateFilters.fill`:** `labelFn` parametresi desteği eklendi. `fMalzeme` için kod topluyor, text olarak lokalize etiket gösteriyor
- **`applyFilters`:** `k.malzeme !== gv('fMalzeme')` → `k.malzemeKod !== gv('fMalzeme')` (kod-vs-kod karşılaştırma)
- **Arama haystack:** Hem ham değer (`k.malzeme`) hem lokalize etiket (`malzEt`) dahil — kullanıcı "Karbon Çelik" arayabilir
- **Sorting:** Malzeme sortu lokalize etiket bazlı (kullanıcının gördüğü sırayla)
- **`openListeModal`:** Homojenlik kontrolü `malzemeKodlar` bazlı, önizleme lokalize etiket
- **Excel export `malzAdi` + `islem_log` açıklama:** `ARES_NORM.malzemeEtiket()` ile lokalize

---

## Test Önerileri

### 1. devreler.html — Dropdown ve Badge Testleri

**Filtre dropdown:**
- Malzeme dropdown'unu aç → "Karbon Çelik", "Paslanmaz", "Bakır Alaşım" görmelisin (kod değil, etiket)
- Yüzey dropdown → "Asit", "Galvaniz", "Boya", "Siyah"
- Birini seç → tablo filtrelensin
- Dil değiştir (TR → EN → AR → TR) → dropdown metinleri çevrilsin

**Tablo badge'leri (KRİTİK):**
- Her devre satırında malzeme hücresinde renkli badge görünmeli
- Karbon çelik = `mb-celik` (mavimsi), Paslanmaz = `mb-pas`, Bakır Alaşım = `mb-bakir`, Alüminyum = `mb-alum`, Diğer = `mb-diger`
- **Dil değiştirince renk değişmemeli, sadece metin** — bu bug fix'in doğruluk kanıtı

**Malzeme modal (üst stat karta tıkla):**
- Pie chart'ta "Karbon Çelik — 1005 spool" görmeli (kod değil)

### 2. kesim.html — Filter ve Liste Testleri

- Malzeme filter dropdown → "Karbon Çelik" vb. görmeli
- Seç → tablo doğru filtrelensin
- Chip'te "Malzeme: Karbon Çelik" (kod değil)
- Homojen bir grupla Liste Oluştur → Önizleme: "Malzeme: Karbon Çelik"
- Farklı malzeme grubuyla → Uyarıda lokalize etiketler

### 3. Dil testi — TR'de "Boya" görünmeli

Web'de herhangi bir yüzey gösteren yerde (spool_detay, kesim, devreler) **"Boyalı" yerine "Boya"** görmeli.

### 4. Yeni kayıt testi (opsiyonel doğrulama)

devre_yeni.html'den yeni bir spool ekle → Supabase'e bak → malzeme/yüzey canonical kod formatında (`karbon`, `asit` vb.)

---

## Bilinen Açık Sorunlar (Sonraki Oturuma)

Hepsi CLAUDE-SONRAKI-OTURUM.md'de detaylı:

1. **Malzeme-Yüzey uyum kontrolü yok:** Paslanmaz+galvaniz kombinasyonu DB'de kabul ediliyor, engellenmesi gerek (Öncelik 2A — kullanıcı bu oturumda gündeme getirdi)
2. **devre_yeni.html yüzey radio'sunda "Diğer" yok:** Nadir yüzey işlemleri için
3. **Excel export başlıkları hâlâ hardcode Türkçe:** `'KULLANILACAK MALZEME'` vb.
4. **`spool_malzemeleri.kalite='diger'` formatı:** Kalite alanı serbest metin, yanlış giriş mümkün (2 orphaned kayıt bu oturumda silindi, gelecekteki giriş önlenmedi)
5. **Diğer sayfaların enum refactor'ü yapılmadı:** `bukum.html`, `sevkiyat.html`, `raporlar.html` gibi diğer enum display yerleri taranmadı
6. **spool_detay.html kolon adları hâlâ yanlış:** 78 yanlış referans (önceki oturumun planlanan ama yapılamamış işi)

---

## Önemli Karar Özeti

**Kanonik enum listesi kesinleşti:**

| Alan | Kodlar |
|---|---|
| malzeme | `karbon`, `paslanmaz`, `bakir`, `alum`, `diger` |
| yuzey | `asit`, `galvaniz`, `siyah`, `boyali`, `diger` |

**Neden plastik/epoksi kaldırıldı?**
- Operasyonda kullanılmıyor (kullanıcı onayladı)
- DB'de sadece 1 test kaydı vardı (silindi)
- Dil dosyasında anahtar + ARES_NORM'da pattern tutmak ölü kod
- Gerektiğinde ~10 dakikada tekrar eklenebilir

**Neden "Boyalı" → "Boya"?**
- Kullanıcı tercihi (diğerleri de isim formu: galvaniz, asit, siyah)
- Sadece TR etiketi değişti; EN "Painted", AR "مطلي" her dilin doğal kullanımı olarak kaldı

---

## Deploy Sırası (Önerilen)

1. **Önce dil dosyaları** (risksiz — hiçbir HTML henüz bunu sorgulamıyor, sadece fallback'ler gözüküyordu):
   - `lang/tr.json`, `lang/en.json`, `lang/ar.json`

2. **Sonra ares-normalize.js** (mevcut HTML'lerle uyumlu — sadece default "Boyalı" → "Boya" değişikliği):
   - `ares-normalize.js`

3. **Son olarak 2 HTML** (yeni davranış devreye girer):
   - `devreler.html` — script tag yükleniyor, ARES_NORM entegrasyonu devreye giriyor
   - `kesim.html` — kod bazlı filter aktif oluyor

Adım 1 ve 2 deploy edildiğinde hiçbir şey bozulmaz. Adım 3'ten sonra iki sayfada dropdown'lar temizlenir, badge'ler doğru renkte gözükür.

**Git commit önerisi:**
```
feat(enum): phase-2 migration + devreler/kesim full refactor

DB Migration (Faz 2):
- spooller.malzeme: karbon_celik, Karbon Çelik, bakir_alasim → karbon, bakir
- spool_malzemeleri.malzeme: aynı temizlik
- spooller.yuzey: Asit → asit
- Tek canonical format (4 malzeme + 4 yüzey)

Canonical list locked (Bölüm 2.13):
- Malzeme: karbon, paslanmaz, bakir, alum, diger (5)
- Yüzey: asit, galvaniz, siyah, boyali, diger (5)
- plastik + epoksi removed (not used in operation)

devreler.html refactor:
- ARES_NORM integration (script tag + delegation)
- matBadge color classes updated (CRITICAL BUG FIX)
- Dropdowns now show localized labels

kesim.html refactor:
- Filter code-based (borular.malzemeKod)
- All displays localized (chips, sorting, liste modal, excel, log)

Lang files: 1340 → 1338 keys
- Removed: cmn_malzeme_plastik, cmn_yuzey_epoksi
- TR only: cmn_yuzey_boyali "Boyalı" → "Boya"
```

---

## Bu Dosyanın Ömrü

Bu dosya her oturum sonunda **üzerine yazılır**. Versiyon numarası tutulmaz. Deploy tamamlandıktan sonra içerik çöp olur, ama Claude'a yeni oturumda yüklendiğinde bir önceki oturumun ne yaptığını görmesini sağlar.

Uzun vadeli proje tarihçesi `CLAUDE.md` Bölüm 11 / 11A / 11B / 11C'de yaşar — oraya bakılır.
