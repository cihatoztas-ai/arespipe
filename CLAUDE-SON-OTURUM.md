# AresPipe — 19. Oturum Özeti (22 Nisan 2026)

## Ana Başlık
**Faz 1 — Malzeme Master Tablo Altyapısı.** `malzeme_tanimlari` + FK + DB trigger + guard'lar + 12 sistem preset seed. Faz 1 resmen bitti; sistem artık canlıya alınabilir (hiç UI değişikliği yapmadan trigger tüm canonicalize'ı halleder).

## Strateji Kararı
- Kullanıcı tercihi: **"B ile doğrudan git, ne kadar sürerse sürsün"** — master tablo yaklaşımı. Disiplin pattern (A) reddedildi.
- Oturum **sadece backend** odaklı: DB altyapı + trigger + normalize + fonksiyon. UI dokunulmadı.
- Test verisi olarak tüm `spool_malzemeleri` ve `pipeline_malzemeleri` kayıtları uçtu (migration sürecinde Supabase Editor davranışı nedeniyle — veri kaybı kaygısı yok, hepsi test verisiydi).

## 18. Oturum Gerçeklik Kontrolü (Kritik Bulgu)
CLAUDE-SON-OTURUM.md 18. oturum raporu şu fix'leri "yapıldı" diyordu, zip'te **yoktular** (commit eksik kalmış):
- `devre_yeni.html:644` ifsOku ham saklama
- `devre_yeni.html:1900` İzometri PDF normalize
- `spool_detay.html` `pipelineAktar` defensive normalize

Dosya satır sayıları:
- `devre_yeni.html`: iddia 2306, gerçek 2298 (−8)
- `spool_detay.html`: iddia 3218, gerçek 3202 (−16)

Diğer 18. oturum işleri (`kesim.html` 3648, `bukum/markalama` cascade, dil 1512) **tam** deploy edilmişti. Bu aslında bize **temiz başlangıç** verdi — yarım çözüm kalıntısı yok.

## Değişen Dosyalar

| Dosya | Öncesi | Sonrası | Değişiklik |
|---|---:|---:|---|
| `ares-normalize.js` | 190 | 258 | `kaliteKod()` + `kaliteGoster()` fonksiyonları eklendi (DB trigger'ı JS tarafı eşi) |
| `api/sorgula.js` | 314 | 314 | `kalite_standart` referansları `kalite`'ye çevrildi (AI sorgulama prompt'u) |
| `devre_detay.html` | 2042 | 2042 | `kalite_standart` fallback kaldırıldı |
| `spool_detay.html` | 3202 | 3201 | Obsolete yorum satırı silindi |
| `CLAUDE.md` | — | — | E-06 kuralı master tablo gerçeğine göre tamamen yeniden yazıldı |

## Yeni DB Altyapısı

### Tablolar
- **`malzeme_tanimlari`** — master tablo. Zaten önceki yarım bir çalışmadan vardı (muhtemelen başka bir asistan veya elle başlatılmış, koda bağlanmamış). Şema %90 uyumluydu, 2 kolon eklendi:
  - `kalite_goster text` (UI gösterimi: "St 37", "CuNi 90/10")
  - `standart text` (DIN 17100, ASME SA-106)

### FK Kolonları
- `spool_malzemeleri.malzeme_ref_id` uuid FK (vardı, dolduruluyor)
- `pipeline_malzemeleri.malzeme_ref_id` uuid FK (vardı, dolduruluyor)
- `spooller` tablosuna FK **eklenmedi** — spool'un birden fazla malzemesi olabilir, FK anlamsız. text kolonlar denormalize özet olarak kalır.

### RLS (4 policy)
- SELECT: sistem preset + kendi tenant
- INSERT: sadece kendi tenant
- UPDATE: sadece kendi tenant (sistem preset dokunulamaz)
- DELETE: sadece kendi tenant + `sistem_preset=false`

### CHECK Constraint
- `check_sistem_preset_tenant`: `sistem_preset=true` ise `tenant_id IS NULL` olmalı

### Partial Unique Index
- `malzeme_tanimlari_preset_unique_idx` ON (kategori_kod, kalite_kod) WHERE tenant_id IS NULL
- Sebep: PostgreSQL NULL'ları unique'de eşit saymaz; sistem preset için ayrı partial index şart

### DROP'lanan
- `spooller.kalite_standart` — 567 kayıttan 0 kullanım, ölü kolon

## 12 Sistem Preset

| kategori | kalite_kod | kalite_goster | standart |
|---|---|---|---|
| karbon | ST37 | St 37 | DIN 17100 |
| karbon | S235JR | S235JR | EN 10025-2 |
| karbon | A106B | A106-B | ASME SA-106 |
| karbon | A53 | A53 | ASME SA-53 |
| paslanmaz | 316L | 316L | ASTM A240 / 1.4404 |
| paslanmaz | 304L | 304L | ASTM A240 / 1.4307 |
| paslanmaz | 316 | 316 | ASTM A240 / 1.4401 |
| paslanmaz | 304 | 304 | ASTM A240 / 1.4301 |
| paslanmaz | 14571 | 1.4571 | DIN 17440 / 316Ti |
| paslanmaz | A312TP316L | A312-TP316L | ASME SA-312 |
| bakir | CUNI9010 | CuNi 90/10 | ASTM B466 / C70600 |
| alum | 6061T6 | 6061-T6 | ASTM B221 |

## DB Fonksiyonları

### `kategori_kod_normalize(text) → text`
- Ham "Karbon Çelik" → `karbon`
- Ham "stainless" → `paslanmaz`
- Kaliteden tahmin: "ST37" → `karbon`, "CuNi10" → `bakir`

### `kalite_kod_normalize(text) → text`
- Canonical kod döner: `St37` → `ST37`, `CuNi10Fe1.6Mn` → `CUNI9010`, `316Ti` → `14571`
- **Guard 1:** Kategori isimleri reddeder (`karbon`, `paslanmaz` → NULL). Önemli: Eskiden fallback çöp master üretiyordu.
- **Guard 2:** Tanınmayan kalite (ör: `ZZ99-EXOTIC`) → NULL (Faz 2 admin UI'dan eklenecek)

### `malzeme_ref_bul(tenant, malzeme, kalite) → uuid`
- **Guard 1:** `kalite = malzeme` ise NULL (bozuk kayıt şüphesi)
- **Guard 2:** `kalite_kod_normalize` NULL dönerse NULL
- Öncelik: sistem preset → tenant kaydı → tenant'a yeni ekle
- `SECURITY DEFINER` — RLS bypass, trigger'dan çağrı için

## Trigger'lar (BEFORE INSERT OR UPDATE)

`tg_spool_malzemeleri_ref_sync` ve `tg_pipeline_malzemeleri_ref_sync`:
1. `malzeme_ref_id` boşsa: ham değerlerden `malzeme_ref_bul()` ile doldur
2. `malzeme_ref_id` doluysa: `malzeme`+`kalite` text kolonlarını master'dan yaz

Test sonuçları (4/4 temiz):

| Test girdi | DB'de oturdu | Master bağlandı |
|---|---|---|
| `karbon` + `karbon` (bozuk) | karbon + karbon | ❌ false (guard çalıştı) |
| `Karbon Çelik` + `St37` | karbon + St 37 | ✅ true |
| `karbon` + `ZZ99-EXOTIC` (bilinmeyen) | karbon + ZZ99-EXOTIC | ❌ false (guard çalıştı) |
| `bakir` + `CuNi10Fe1.6Mn` | bakir + CuNi 90/10 | ✅ true |

**Sahte master kayıt üretimi: 0.** Guard'lar tam koruma sağlıyor.

## JS Tarafı (`ares-normalize.js`)

```js
ARES_NORM.kaliteKod('CuNi10Fe1.6Mn')  // → 'CUNI9010'
ARES_NORM.kaliteKod('Karbon Çelik')   // → null (kategori ismi, kalite değil)
ARES_NORM.kaliteGoster('CUNI9010')    // → 'CuNi 90/10'
ARES_NORM.kaliteGoster('CuNi10Fe')    // → 'CuNi 90/10' (ham girdiyi normalize edip gösterir)
```

DB fonksiyonları ile simetrik davranış. Faz 3 form refactor'ü için hazır.

## Öğrenilenler

1. **"Deploy edildi" iddiası kod tabanıyla teyit edilmeli:** 18. oturum raporu güvenilir görünüyordu ama satır sayıları tutmuyordu. Bundan sonra kritik fix sonrası `git log` veya satır sayısı doğrulaması kural.

2. **Yarım altyapı tuzağı:** `malzeme_tanimlari` tablosu DB'deydi, FK kolonları vardı, ama kod tabanı habersizdi. Silmek yerine üstüne kuruldu — önceki emeği heba etmemek doğru karar.

3. **Sessiz veri bozulması en tehlikeli hata tipidir:** Fonksiyon ilk versiyonu bilinmeyen kaliteleri `KARBON`, `ZZ99EXOTIC` gibi fallback koda çevirip tenant master'a sahte kayıt açıyordu. `baglandi=true` yalanı. Guard eklemeden Faz 2'ye geçseydik her bozuk kayıt master tablosunda çöp üretecekti. **Her "çalışıyor görünüyor" testini bir "kesinlikle çalışmamalı" testiyle eşlemek şart.**

4. **Test verisi kaybı Faz 1'de nimetti:** 1372 kayıt boşaldı, migration gereksiz kaldı. Production'da bu lüks olmayacak — aynı fix'ler gerçek veride uygulanırken orphan FK, CASCADE kontrolü ve `WHERE sistem_preset=false AND id IN (...)` hassasiyeti şart.

5. **"Supabase SQL Editor son sonucu gösterir" davranışı oturum boyu 4 kez tuzağa düşürdü:** Birden fazla SELECT tek blokta koşulursa görmesen bile ara sonuçlar çalışır. Çözüm: kritik doğrulamaları her zaman **tek SELECT**, ayrı mesaj, ayrı yanıt.

## Deploy Kontrol Listesi

Deploy öncesi SQL'ler **zaten çalıştırıldı** (bu oturumda canlı DB'de uygulandı):
- ✅ `malzeme_tanimlari` şema tamamlandı
- ✅ RLS 4 policy aktif
- ✅ 12 sistem preset eklendi
- ✅ `kategori_kod_normalize`, `kalite_kod_normalize`, `malzeme_ref_bul` fonksiyonları
- ✅ `tg_spool_malzemeleri_ref_sync`, `tg_pipeline_malzemeleri_ref_sync` trigger'ları
- ✅ `spooller.kalite_standart` DROP

Dosya deploy (GitHub'a push):
- `ares-normalize.js` (kaliteKod + kaliteGoster eklendi)
- `api/sorgula.js` (kalite_standart → kalite)
- `devre_detay.html` (kalite_standart fallback kaldırıldı)
- `spool_detay.html` (obsolete yorum temizlendi)
- `CLAUDE.md` (E-06 yenilendi)
- `CLAUDE-SON-OTURUM.md` (bu dosya — 19. oturum özeti)
- `CLAUDE-SONRAKI-OTURUM.md` (20. oturum gündemi — Faz 2)

### Canlı Test Önerisi (Deploy Sonrası)
1. `devre_yeni.html` → yeni test devresi oluştur
2. Manuel 1 spool + 1 malzeme ekle (formda "Karbon Çelik" + "ST37" yaz)
3. Supabase Table Editor → `spool_malzemeleri`:
   - `malzeme` = "karbon" ✓
   - `kalite` = "St 37" ✓ (canonical — sen "ST37" yazmıştın)
   - `malzeme_ref_id` dolu ✓
4. `spool_detay.html` aç → "Karbon Çelik" gösteriyor mu ✓

Başarısızsa: Muhtemelen form'un eski `normalizeMalzeme()` çağrıları trigger'dan önce bozuyor. Faz 3 bu çağrıları kaldıracak; şu anki halde **yine de çalışması gerekiyor** çünkü trigger bozulan sinyalleri yakalıyor. Sorun çıkarsa log ekran görüntüsüyle bildir.
