# AresPipe — 21. Oturum Özeti (22 Nisan 2026)

## Ana Başlık
**Sistem Çapında Render Standardizasyonu.** 20. oturumda kapatılan IFS import kök neden fix'i sonrası keşfedilen "UI'da ham `karbon` kategori kodu" yayılımı bu oturumda tamamen temizlendi. 11 HTML dosyasında ~30 render noktası lokalize edildi. G-03 kuralı CLAUDE.md Bölüm 2.18'de formalleştirildi. Sistemde artık kullanıcıya görünür ham enum kodu yok.

## Strateji Kararı
- 20. oturumun kapanışında kullanıcı `spool_detay.html > Büküm Ekle` popup'ında ham `karbon` gördü
- 21. oturum gündemi bu temel üzerinden sistematik süpürme olarak belirlenmişti (CLAUDE-SONRAKI-OTURUM.md)
- Yaklaşım: **ritüel → grep → harita → pilot → dalga dalga fix → CLAUDE.md formalize → zip**
- Faz 2 (admin UI) 22. oturuma kaldı

## Akış

### 1. Ritüel + Grep
- CLAUDE.md + CLAUDE-SON-OTURUM okundu
- `ares-normalize.js` helper imzaları teyit edildi:
  - `malzemeEtiket(raw)`: boş → `'—'`, bilinmeyen → ham değer, bilinen kod → lokalize
  - `kaliteGoster(kodOrRaw)`: boş → `''`, bilinmeyen → ham, bilinen → canonical (`'St 37'`)
  - `yuzeyEtiket(raw)`: malzemeEtiket simetrisi
- 3 grep komutu (malzeme/kalite/yüzey) + Excel/PDF export taraması:
  - Malzeme render: 35 hit (state map hariç ~20 gerçek render)
  - Kalite render: ~50 hit (state map hariç ~35 gerçek render)
  - Yüzey render: ~20 hit
  - Excel export: 10 dosya

### 2. Harita Çıkarıldı
**"Dokunma" listesi:**
- `matBadge(m)` — zaten `ARES_NORM.tvMalzeme` kullanıyor
- `_malzemeGoster/_yuzeyGoster` — zaten wrap
- `devreler.html:1768-1797` inline — zaten lokalize
- State map'leri (`{malzeme: x.malzeme || '—'}`) — DB-facing ham
- Arama filtre string'leri — kullanıcıya görünmez
- AI chatbot prompt'ları — LLM'e
- Dropdown value'ları + inlineEdit arg'ları — ham kalmalı

**Fix listesi:** 11 dosya × ~30 nokta

### 3. Dosya Dosya Fix

| Dosya | Noktalar | Değişiklik |
|---|---|---|
| `spool_detay.html` | 2253, 2309, 3065-3066 | `kmMalzInfo` (Kesim Ekle), `bmMalzInfo` (Büküm Ekle), 3D M3 popup |
| `devre_detay.html` | 1576, 1601, 1948, 1954 | Excel BOM, pipeline `<td>`, Excel SPOOLS, PDF önizleme |
| `devre_yeni.html` | 1272 | IFS önizleme kalite |
| `bukum.html` | 799, 899 | QR etiket header, tablo `<td>` |
| `kesim.html` | 1852, 2033, 2383, 2536, 2950, 2995, 3234, 3457, 3559 | Liste, özet, kld meta/row, 2× confirm, PDF head/detay, onay modal |
| `markalama.html` | 621, 800, 806, 839, 1028, 1207, 1286 | malzInfoHtml, parts/parts2, modal, inline blocks, Excel |
| `izometri-batch.html` | 435-440 + 452 block | HTML 3 alan + Excel 3 alan |
| `is_baslat.html` | 1077, 1078 | Mobil chip |
| `admin/index.html` | 364 + script | Özet + `ares-normalize.js` yükle |
| `portal/index.html` | 367 + script | Özet + `ares-normalize.js` yükle |
| `devreler.html` | 2079, 2110 | Pipeline BOM state=2 + state=kırmızı |

### 4. Güvenli Fallback Pattern

CLAUDE.md 2.18'deki şablona uygun, her render noktasında inline uygulandı:

```js
esc(
  (typeof ARES_NORM!=='undefined' && ARES_NORM.malzemeEtiket)
    ? (ARES_NORM.malzemeEtiket(x.malzeme) || x.malzeme || '—')
    : (x.malzeme || '—')
)
```

Excel satırı için `esc()` çıkarılır, `forEach` başında local değişkene atanır:

```js
rows.forEach(function(s, i){
  var _me = (typeof ARES_NORM!=='undefined'&&ARES_NORM.malzemeEtiket)
    ? (ARES_NORM.malzemeEtiket(s.malzeme)||s.malzeme||'') : (s.malzeme||'');
  var _kg = ...;
  var _ye = ...;
  rows.push([..., _me, _kg, _ye, ...]);
});
```

### 5. CLAUDE.md G-03 Formalleştirme

**Bölüm 2.18** yazıldı:
- Temel kural
- DB/UI ayrım tablosu (4 alan × 3 sütun)
- Güvenli fallback pattern (3 alan için)
- Zorunlu uygulama kapsamı
- İstisna listesi (8 madde — dropdown, inlineEdit, state map, arama, AI, de-dup hash, QR, mevcut helper'lar)
- Mevcut helper envanteri (matBadge, _malzemeGoster, _yuzeyGoster, devreler.html inline)
- Yeni sayfa kontrol listesi (G-01 ekine)
- 21. oturum fix'lenen dosyalar referans tablosu
- Anti-pattern örnekleri

**Bölüm 10** güncellendi: 21. oturum checkbox kapatıldı, 22. oturum yönlendirmesi + 2 yan bug eklendi.
**Bölüm 11** yazıldı (21. oturum); eski 20. oturum 11A'ya taşındı; eski 11A (19. oturum) → 11A1'e taşındı.

## Dokunulmayan Yerler (kanıt)

**Temiz olduğu teyit edilen helper'lar:**
- `bukum.html:464` matBadge → `ARES_NORM.malzemeKod` + `tvMalzeme` ✓
- `kesim.html:994` matBadge → aynı ✓
- `markalama.html:595` matBadge → aynı ✓
- `spool_detay.html:1206/1210` `_malzemeGoster`/`_yuzeyGoster` → `ARES_NORM.malzemeEtiket/yuzeyEtiket` wrap ✓
- `devre_detay.html:877/887` aynı ✓
- `devreler.html:1768-1797` inline matBadge + yuzeyBadge + sapma tooltip → `ARES_NORM.tvMalzeme/tvYuzey` ✓

**Bilinçli dokunulmayan ham alanlar:**
- State map'leri (`devre_detay:1089-1090`, `devre_duzenle:605-606`, `devre_yeni:1499`, `devreler:1435-1436`, `kesim:1037-1039/3401`, `bukum:511-512`, `markalama:491-493`, `spool_detay:1068-1069/1160/2116`) — DB yazım için
- `devre_yeni.html:1467` — IFS preview input value (editable, DB yazım için ham)
- `devre_detay.html:1194/1196` — inlineEdit `currentValue` arg'ı (düzenleme için ham)
- Arama filtre/sort key'leri (`bukum:676/742/870`, `devre_detay:1546`, `kesim`, `markalama:668/721/890/774`) — kullanıcıya görünmez
- `spool_detay.html:1590-1592` — AI chatbot prompt, LLM'e gider

## 22. Oturuma Aktarılan Yan Bug'lar

1. **`spool_detay.html` M3_RENK eski TR key'ler** (2657-2665). 3D model renk haritası `'Karbon Çelik'` key'li ama gerçek data `'karbon'`. Lookup fail → `_default`. Fix: key'leri kategori koduna çevir. ~5 dk.

2. **`devre_detay.html:1609-1611` duplicate `<td>`.** Pipeline BOM tablosunda sertifika + silme buton hücreleri iki kez yazılmış. ~2 dk.

## Değişen Dosyalar

| Dosya | Durum |
|---|---|
| `spool_detay.html` | 3 blok değişti |
| `devre_detay.html` | 4 blok değişti |
| `devre_yeni.html` | 1 blok değişti |
| `bukum.html` | 2 blok değişti |
| `kesim.html` | 9 blok değişti |
| `markalama.html` | 7 blok değişti |
| `izometri-batch.html` | 2 blok değişti (HTML + Excel) |
| `is_baslat.html` | 1 blok (2 satır) değişti |
| `admin/index.html` | 2 blok (fix + script) değişti |
| `portal/index.html` | 2 blok (fix + script) değişti |
| `devreler.html` | 2 blok değişti |
| `CLAUDE.md` | Bölüm 2.18 eklendi + Bölüm 10 güncellendi + Bölüm 11/11A/11A1 restrukture |

## Deploy Kontrol Listesi

**Canlıya al:**
- ✅ 11 HTML dosyası
- ✅ `CLAUDE.md`

**Canlı test matrisi (deploy sonrası):**
1. spool_detay — Büküm Ekle seç → `Karbon Çelik — St 37 — 219,1 mm`
2. spool_detay — Kesim Ekle seç → aynı
3. spool_detay — 3D model parça tıkla → popup'ta `Karbon Çelik` + `St 37`
4. kesim.html — liste, kesim planı PDF, confirm dialog → `Karbon Çelik`, `St 37`
5. bukum.html — QR etiket + tablo → aynı
6. markalama.html — alt satır + manuel modal + Excel → `St 37` (ham `ST37` değil)
7. izometri-batch.html — tablo + Excel → 3 kolon lokalize
8. is_baslat.html — mobil chip → `Karbon Çelik`, `St 37`
9. admin/index + portal/index — özet tablo → `Karbon Çelik` (ham `karbon` değil)
10. devreler.html — pipeline BOM (kırmızı + sarı durum) → `Karbon Çelik`
11. devre_detay.html — Excel (malzeme + kalite + yüzey) + PDF önizleme → tümü canonical

## Öğrenilenler

1. **Yeni helper → grep → tüm render noktaları.** 19. oturumda `kaliteGoster()` eklendi, 20. oturumda 4 nokta düzeltildi, ama 21. oturumda hâlâ 11 farklı dosyada ~35 hit vardı. Grep disiplinini oturum başına ritüel yaptık (G-03 kontrol listesi).

2. **Güvenli fallback > wrapper.** `typeof ARES_NORM!=='undefined'` check'i ARES_NORM yüklenmemiş sayfalarda otomatik düşüş sağlar. `admin/index.html` ve `portal/index.html` ARES_NORM yüklemiyordu (21. oturumda keşfedildi) — fix yine de çalışıyordu, script eklenince canonical'e geçti.

3. **Helper asimetrisi — dikkat.** `malzemeEtiket('')` → `'—'` ama `kaliteGoster('')` → `''`. Fallback `|| '—'` koymak şart, aksi halde boş `<td>` görünür.

4. **İstisna listesi fix listesi kadar değerli.** Arama filtreleri, AI prompt'ları, state map'leri, dropdown value'ları lokalize ETMEMEK gerekir. G-03 bu istisnaları 8 maddeyle sayıyor.

5. **Alt-dizin sayfaları script ihmali.** `admin/` ve `portal/` relative path yüklemeleri kolay unutulur. Yeni sayfa kontrol listesine eklendi.

6. **Yan bug fark etme.** 21. oturumda 2 yan bug keşfedildi (M3_RENK, duplicate `<td>`) — 22. oturuma not edildi.

7. **Oturum protokolü çalışıyor.** Ritüel + grep + harita + pilot + dalga dalga + CLAUDE.md + zip formatı 21 oturumdur tekrarlanıyor; 21. oturum tamamlanması birkaç turda bitti.
