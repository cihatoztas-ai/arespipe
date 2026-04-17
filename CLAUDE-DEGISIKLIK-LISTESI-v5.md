# AresPipe — 3. Oturum Düzeltmeleri (v5 Patch)

**Tarih:** 17 Nisan 2026 (3. oturum)
**Risk seviyesi:** DÜŞÜK-ORTA — yeni modül + logic refactor, ama tamamı dry-run+onay ile yapıldı

---

## Bu Oturumda Ne Yapıldı

Enum anti-pattern temizliği. Mevcut durumda:
- Her sayfa kendi `_normalizeMalzeme`/`_normalizeYuzey` fonksiyonunu yazmıştı
- Bu fonksiyonlar hardcode Türkçe döndürüyordu ('Karbon Çelik', 'Paslanmaz')
- `markalama.html`'de `m.indexOf(tv('cmn_malzeme_alum','Alüminyum'))` pattern'i dil değişince fail oluyordu (EN'de `tv()` "Aluminum" döner, m ise "Alüminyum" kalır)
- `devre_yeni.html` DB'ye Türkçe etiketler yazıyordu — kaynak kirlenme noktası

**Sonuç:** Tek kaynak `ares-normalize.js`, DB'ye kod yazılıyor, okuma tarafı hem kod hem legacy Türkçe'yi tolere ediyor.

---

## Değişen Dosyalar (10)

### 1. Yeni Dosya
- **`ares-normalize.js`** (kök dizin) — 116 satır
  - `ARES_NORM.malzemeKod(raw)` → kod
  - `ARES_NORM.yuzeyKod(raw)` → kod
  - `ARES_NORM.durumKod(raw)` → kod
  - `ARES_NORM.malzemeEtiket/yuzeyEtiket/durumEtiket(raw)` → lokalize etiket
  - `ARES_NORM.tvMalzeme/tvYuzey/tvDurum(kod, fb)` → alt seviyeli
  - `plastik` ve `epoksi` kategorileri dahil (dil dosyalarında zaten vardı)

### 2. Dil Dosyaları (3)
- **`lang/tr.json`** — 1335 → 1340 anahtar (+5)
- **`lang/en.json`** — 1335 → 1340 anahtar (+5)
- **`lang/ar.json`** — 1335 → 1340 anahtar (+5)

Eklenen 5 anahtar (3 dilde tam çeviri):
- `cmn_durum_bekliyor` — Bekliyor / Pending / قيد الانتظار
- `cmn_durum_devam_ediyor` — Devam Ediyor / In Progress / قيد التنفيذ
- `cmn_durum_tamamlandi` — Tamamlandı / Completed / مكتمل
- `cmn_malzeme_diger` — Diğer / Other / أخرى
- `cmn_yuzey_diger` — Diğer / Other / أخرى

**Mevcut hiçbir anahtar silinmedi veya değiştirilmedi.** Diff minimum — sadece 5 satır eklendi + 1 trailing newline.

### 3. Patch'lenen HTML Dosyaları (6)

| Dosya | Değişiklik türü |
|---|---|
| `spool_detay.html` | `_normKey` silindi, `_malzemeGoster/_yuzeyGoster` ARES_NORM wrapper oldu, script tag eklendi |
| `kesim.html` | `matBadge` refactor (ARES_NORM), 2 display wrap (1178, 1373), script tag |
| `markalama.html` | 🔴 **BUG FIX:** `matBadge` kod bazlı karşılaştırmaya çevrildi (dil değişince renk doğru çıkar), script tag |
| `devre_yeni.html` | `normalizeMalzeme` ARES_NORM'a bağlı (KOD döndürüyor), `_malzemeTipi` inline kopyası ARES_NORM'a bağlı, radio value'lar kod'a ('Karbon Çelik' → 'karbon'), 'Diğer' kontrolleri 'diger'e, 3 display wrap, script tag |
| `is_baslat.html` | 2 display wrap (malzeme + yüzey), script tag (../ prefix'i korundu) |
| `devre_duzenle.html` | Radio value'lar kod'a + label'lara data-i18n eklendi + formDoldur ARES_NORM.malzemeKod ile legacy Türkçe veriyi de doğru radio'ya map eder, script tag |

---

## Test Önerileri

### 1. Dil değiştirme testi (kritik)
TR → EN → AR → TR geçişleri yaparak şunları kontrol et:
- **Markalama sayfası** — Paslanmaz badge yeşil, Alüminyum badge amber olmalı (BUG FIX kanıtı — önceki versiyonda EN modunda hepsi mavi kalıyordu)
- **Spool detay** sayfasında malzeme/yüzey kolonları her dilde çevrilmeli
- **Kesim** sayfasında matBadge'ler ve modal'daki display'ler çevrilmeli
- **Aktif Devreler** tablosundaki Malzeme kolonu her dilde çevrilmeli (örn. TR "Karbon Çelik" → EN "Carbon Steel" → AR "فولاذ كربوني")

### 2. Yeni devre oluşturma testi
1. `devre_yeni.html`'den yeni bir devre oluştur (örn. Paslanmaz seç)
2. Supabase'te `spooller` tablosuna bak → `malzeme` kolonu `'paslanmaz'` (kod) olmalı, `'Paslanmaz'` değil
3. Aynı spool'u `spool_detay` sayfasında aç → ekranda "Paslanmaz" (TR) görünmeli

### 3. Legacy veri testi
1. Supabase'te eski bir spool bul (malzeme='Karbon Çelik' gibi)
2. `devre_duzenle` ile ilgili devreyi aç → "Karbon Çelik" radio'su otomatik seçili olmalı
3. Başka bir seçenek seç + kaydet → DB'ye kod yazılır

### 4. Dropdown görsel testi
- `devreler.html`'de malzeme filter dropdown'u aç — option'lar "karbon_celik" gibi kod gösteriyorsa (muhtemelen gösterecek) bu Öncelik 1'de çözülecek. Deploy sonrası not et.

---

## Bilinen Açık Sorunlar (Sonraki Oturuma)

1. **Dropdown filter'larda kod görünüyor** — `devreler.html`, `kesim.html`, `markalama.html` (sonraki oturum Öncelik 1)
2. **Excel export hardcode Türkçe** — `kesim.html` Excel başlıkları, satır 1302 malzAdi
3. **islem_log aciklama kod içeriyor** — `k.malzeme + k.cap + k.kesimOlcusu + 'mm'` → `"karbon 48.3 2000mm"`
4. **is_baslat.html konumu belirsiz** — script path'leri `../` prefix'i kullanıyor, ama hangi alt klasörde olduğu onaylanmadı. Eğer kök dizindeyse deploy etmeden önce `../` prefix'lerini kaldır.
5. **Faz 2 SQL migration** — opsiyonel, CLAUDE-SONRAKI-OTURUM.md Öncelik 3'te detaylar

---

## Önemli Karar Özeti

**DB saklama formatı:** Kod (karbon, paslanmaz, asit, bekliyor...)

**Geçiş stratejisi:**
- **Faz 1 (tamamlandı):** Yazma KOD, okuma KOD+LEGACY — DB güvenle geçiş yapabilir
- **Faz 2 (opsiyonel):** SQL migration ile eski Türkçe satırlar kod'a çevrilir

**i18n anahtar şeması:** `cmn_<alan>_<kod>` — 3 dilde tanımlı, ARES_NORM otomatik kullanır

---

## Yeni Kural

**E-01: Enum Normalize Kuralı** (CLAUDE.md Bölüm 2.13):
> Malzeme, yüzey ve durum değerleri her zaman `ARES_NORM` modülü üzerinden gösterilir. Hardcode Türkçe etiket ('Karbon Çelik', 'Paslanmaz' vb.) YASAK. Radio/select value'ları kod olmalı.

Teslim checklist'ine (G-01) eklendi:
> □ E-01: Enum değerleri (malzeme/yüzey/durum) ARES_NORM üzerinden gösterildi

---

## Deploy Sırası (Önerilen)

1. **Önce dil dosyaları** (risksiz — sadece 5 yeni anahtar):
   - `lang/tr.json`, `lang/en.json`, `lang/ar.json`

2. **Sonra ares-normalize.js** (kök dizin — HTML'ler henüz bunu import etmiyor):
   - `ares-normalize.js`

3. **Son olarak 6 HTML** (herhangi sırayla):
   - `spool_detay.html`, `kesim.html`, `markalama.html`
   - `devre_yeni.html`, `is_baslat.html`, `devre_duzenle.html`

Adım 1 ve 2 deploy edildiğinde hiçbir şey bozulmaz — HTML'ler henüz yeni modülü yüklemiyor. Adım 3 ile birlikte yeni davranış devreye girer.

**Git commit önerisi:**
```
feat(enum): introduce ARES_NORM module + fix markalama badge i18n bug

- New ares-normalize.js module for malzeme/yuzey/durum enum handling
- DB now stores codes (karbon, paslanmaz, asit...) instead of Turkish labels
- Fix markalama.html matBadge bug: indexOf(tv()) failed in EN/AR modes
- devre_yeni.html now writes codes to DB
- devre_duzenle.html reads legacy Turkish + new codes uniformly
- Add 5 new cmn_* keys in 3 languages (1335 → 1340)
- Bumps script load: store → lang → normalize → layout
```
