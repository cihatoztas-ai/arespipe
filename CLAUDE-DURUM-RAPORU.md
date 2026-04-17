# AresPipe — Proje Durum Raporu

**Tarama tarihi:** 17 Nisan 2026
**Kapsam:** Web tarafı (HTML/JS/CSS) + DB şema + RLS + RPC + Mobil
**Toplam kod taraması:** 35 HTML, 4634 satır dil dosyası, 77 tablo, 70 RLS politikası

---

## ÖZET SKOR

| Alan | Durum | Not |
|---|---|---|
| 🔴 Dil sistemi | **KRİTİK** | 594 anahtar TR'de eksik, 454 anahtar ölü, TR/EN/AR senkronsuz |
| 🔴 Şema uyumu | **KRİTİK** | Eski kolon adları 10+ sayfada hâlâ kullanılıyor |
| 🟡 Yavaşlık | **ÖNEMLİ** | 6 sayfa 100 KB+, sıralı query'ler, 43% JS inline |
| 🟡 Kural ihlalleri | **ORTA** | data-sayfa 29 sayfada eksik, tırnaklı tema seçiciler |
| 🟢 Güvenlik/RLS | **İYİ** | Çoğu tabloda RLS aktif, tenant_id zorunluluğu uygulanıyor |
| 🟢 Flash prevention | **İYİ** | Her sayfada var |

---

## 🔴 KRİTİK 1 — Dil Sisteminin Gerçek Durumu

### Sayısal Tablo

| Dosya | Anahtar sayısı |
|---|---|
| `lang/tr.json` | **1129** |
| `lang/en.json` | **1730** |
| `lang/ar.json` | **1730** |

### Kritik Uyumsuzluklar

- **Kodda kullanılan benzersiz anahtar:** 1269
- **Bunlardan TR'de tanımlı:** 675
- **TR'de tanımsız → fallback Türkçe kullanan:** **594 anahtar**
- **TR'de tanımlı ama hiç kullanılmayan (ÖLÜ):** **454 anahtar**
- **EN/AR'da tanımlı ama TR'de olmayan:** **601 anahtar**

### Problemin Kaynağı

Sen dedin ki "lang/ vardı → sayfa içi çeviriler → tekrar lang/ döndük ama eksik". 
Kod bunu doğruluyor:

1. Geçişlerde **TR'de tanımlı ama kullanılmayan 454 anahtar** (eski sistemin kalıntısı)
2. Yeni tarzda yazılan 594 anahtar **sadece EN/AR'a eklenmiş**, TR'ye eklenmemiş (fallback'e güvenilmiş)
3. Bu nedenle TR sayfası her zaman "çalışıyor gibi görünüyor" ama gerçekte yarısı hardcode

### En Çok Eksikli Sayfalar

| Sayfa | TR'de Eksik Anahtar |
|---|---|
| spool_detay.html | **132** |
| devre_detay.html | **103** |
| devre_yeni.html | **98** |
| is_baslat.html | **81** |
| proje_liste.html | **64** |
| tersaneler.html | 50 |
| log.html | 46 |
| kesim.html | 19 |
| giris.html | 15 |

### Çözüm — 3 Adım

**Adım 1: Otomatik senkronizasyon scripti yaz**
- EN/AR'daki 601 fazla anahtarı TR'ye kopyala (fallback metin kullan veya sayfada grep'le yakala)
- 594 TR eksiğini `tv('key', 'fallback')` çağrılarındaki fallback'lerden topla, TR'ye yaz

**Adım 2: Ölü anahtarları temizle**
- 454 kullanılmayan TR anahtar, EN'deki ve AR'daki karşılıklarıyla birlikte sil

**Adım 3: Standart bir i18n kontrol scripti**
- `npm run i18n-check` gibi bir komut — CI'da çalışsın
- Kodda kullanılan her `tv()` anahtarı 3 dilde var mı diye kontrol etsin

---

## 🔴 KRİTİK 2 — Şema Uyumsuzluğu (Eski Kolon Adları)

CLAUDE.md'de "kritik kolon adları" bölümü var ama **kodda hâlâ eski isimler kullanılıyor**. Bu **SESSIZ BUG'LAR** üretir — Supabase yanlış kolonu bulamayınca ya hata ya NULL döner.

### Tespit Edilen Tüm Yanlış Kolonlar

| Kolon Kullanımı | Olması Gereken | Sayı |
|---|---|---|
| `cap_mm` | `dis_cap_mm` | 28 kez, 4 sayfada |
| `et_mm` | `et_kalinligi_mm` | **57 kez**, 9 sayfada |
| `agirlik_kg` | `agirlik` | **36 kez**, 9 sayfada |
| `revizyon` | `rev` | 9 kez, 2 sayfada |
| `termin_tarihi` | `termin` | 5 kez, 1 sayfada |
| `icerik` | `metin` (notlar) | 24 kez, 5 sayfada |
| `yapan_id` | `ekleyen_id` (notlar) | 11 kez, 6 sayfada |
| `url` | `dosya_url` (fotograflar) | 34 kez, 7 sayfada |

### En Çok Etkilenen Sayfa — `spool_detay.html`

- `cap_mm`: 18 kez
- `et_mm`: 25 kez
- `agirlik_kg`: 8 kez
- `yapan_id`: 6 kez
- `url`: 21 kez

**→ spool_detay.html'de toplam 78 yanlış kolon referansı!** Bu sayfa muhtemelen en çok bug üreten sayfa.

### Çözüm

- Sayfa sayfa search-replace (dikkatli, bazı `url` gibi kelimeler masum da olabilir)
- Her değişiklikten sonra sayfayı canlıda test et
- Öncelik: **spool_detay → devre_detay → devre_yeni → is_baslat**

---

## 🟡 ÖNEMLİ — Yavaşlık Nedenleri

### Sayfa Boyutları (en büyük 10)

| Sayfa | KB | Inline CSS | Inline JS | Supabase Query | P.all | Fonksiyon |
|---|---|---|---|---|---|---|
| spool_detay.html | **177** | 20 KB | 104 KB | 25 | 1 | **132** |
| kurallar.html | 168 | 13 | 1 | 0 | 0 | — |
| giris.html | 144 | 135 | 5 | 0 | 0 | — |
| devre_detay.html | 132 | 19 | 81 | **15 (P.all=0!)** | 0 | **109** |
| devreler.html | 128 | 24 | 82 | 12 | 3 | 76 |
| proje_liste.html | 126 | 10 | 26 | 0 | 0 | 28 |
| kesim.html | 90 | 18 | 52 | 10 | 0 | 60 |
| devre_yeni.html | 90 | 8 | 60 | 8 | 0 | 55 |
| bukum.html | 84 | 19 | 45 | 3 | 0 | 48 |
| markalama.html | 79 | 17 | 49 | 13 | 0 | 56 |

### Ana Yavaşlık Sebepleri

**1. Sıralı (sequential) query'ler — Paralel olanlar kullanılmıyor**
- `devre_detay.html`: **15 query**, Promise.all=0 → **tüm query'ler peşi sıra beklemeli**
- `kesim.html`: 10 query, P.all=0
- `devre_yeni.html`: 8 query, P.all=0
- `markalama.html`: 13 query, P.all=0
- `kullanici_detay.html`: 11 query, P.all=0
- `tanimlar.html`: 14 query, P.all=0

**Kazanç tahmini:** Ortalama query ~200ms varsayılırsa, 10 sıralı query = 2000ms, 10 paralel = 250ms. **5-8x hızlanma**.

**2. Büyük inline JS (851 KB toplam)**
- Her sayfa yükleme aynı fonksiyonu yeniden parse eder
- HTML dosyası 177 KB olunca (spool_detay) ilk byte'tan render'a kadar gecikir
- **Çözüm:** Ortak fonksiyonları `ares-store.js`, `ares-layout.js`, yeni `ares-spool.js`, `ares-devre.js` gibi harici dosyalara taşı

**3. innerHTML bombardımanı**
- `spool_detay.html`: 31 innerHTML kullanımı
- `devre_detay.html`: 32 innerHTML
- `kesim.html`: 24 innerHTML
- innerHTML her seferinde reflow tetikler, büyük DOM'da ciddi gecikme

**4. select('*') kullanımı**
- `devre_detay.html`: 2 kez
- `spool_detay.html`: 3 kez
- `tersaneler.html`: 1 kez
- Gereksiz kolon çekimi = daha büyük payload = daha yavaş

**5. Potansiyel N+1 query'ler**
- `devreler.html`: 1 yer — devre listesi tararken her devre için ayrı sorgu atıyor olabilir
- `sevkiyatlar.html`: 1 yer

**6. Kopyalanmış fonksiyonlar**
- `spool_detay.html` 132 fonksiyon tanımlıyor — yarısı başka sayfalarda da var mı?
- Ortak `ares-helpers.js` veya `ares-sql.js` dosyasına taşımak bundle size'ı düşürür

### Çözüm Öncelik Sırası

1. **devre_detay.html** — 15 query'yi Promise.all'a çevir (büyük kazanç)
2. **spool_detay.html** — yanlış kolonları düzelt + Promise.all + inline JS'yi harici dosyaya böl
3. **Ortak modüller** çıkar — her sayfa küçülsün
4. **select('*') → select('gerekli_kolonlar')** tarama

---

## 🟡 ORTA — Kural İhlalleri

### data-sayfa Eksik Sayfalar (29 sayfa!)

CLAUDE.md Kural G-01 der: "data-sayfa body tagine eklendi". Ama EKSİK olan sayfalar:

```
ayarlar.html, bukum.html, devre_detay.html, devre_duzenle.html,
devre_yeni.html, devreler.html, etiketleme.html, index.html,
is_baslat.html, izometri-batch.html, kalite_kontrol.html,
kesim.html, kullanici_detay.html, kullanicilar.html, kurallar.html,
log.html, markalama.html, proje_detay.html, proje_liste.html,
qr_tara.html, raporlar.html, sevkiyatlar.html, sorgula.html,
spool_detay.html, tanimlar.html, tersaneler.html, testler.html,
tezgahlar.html, uyarilar.html
```

**Yani neredeyse tüm sayfalarda bu kural uygulanmamış.** Bu muhtemelen yetki sisteminin "sayfa bazlı yetki kontrolü"nü sakatlıyor.

### Tırnaklı Tema Seçici (CSS yasak)

CLAUDE.md: `[data-theme=dark]` tırnak yok. Ama:

| Sayfa | Tırnaklı kullanım |
|---|---|
| bukum.html | 4 kez |
| devre_yeni.html | 2 kez |
| devreler.html | 2 kez |
| log.html | 2 kez |
| markalama.html | 2 kez |
| testler.html | 2 kez |
| uyarilar.html | 2 kez |

**Toplam 16 tırnaklı kullanım** — bunlar tema değişikliğini bozabilir.

### Yasak Renkler

Sadece `index.html`:
- `#3b82f6` (mavi): 2 kez → `var(--ac)` olmalı
- `#10b981` (yeşil): 2 kez → `var(--gr)` olmalı

Küçük bir bulgu, kolay düzeltme.

### history.back() Kullanımı (YASAK)

- `is_baslat.html`: 3 kez
- `qr_tara.html`: 1 kez

Kural: navigasyon `navigate(-1)` veya açık URL olmalı.

---

## 🟢 İYİ — Doğru Yapılan Şeyler

### Flash Prevention
Tüm sayfalarda (`giris.html`, `qr_tara.html` ve hata sayfaları hariç) doğru uygulanmış ✅

### RLS Politikaları
- 70 politika, çoğu `tenant_id = get_tenant_id()` pattern'ini uyguluyor ✅
- `spooller` ve `devreler` için `silindi` filtresi RLS seviyesinde de var ✅
- `musteri_*` politikaları müşteri portalı için ayrılmış ✅
- Sadece `tanimlar.html`'de 2 insert tenant_id set etmiyor (RLS zaten filtreliyor, ama açık insert daha güvenli)

### Sistemin Büyüklüğü

77 public tablo keşfedildi. Çok zengin bir şema:

- **İş akışı:** projeler, devreler, spooller, spool_malzemeleri
- **Üretim:** kesim_kalemleri, bukum_kalemleri, markalama_kalemleri, kesim_listeleri
- **Kalite:** kk_davetler, kk_davet_spooller, testler
- **Sevkiyat:** sevkiyatlar, sevkiyat_spooller
- **Zaman takibi:** `is_kayitlari` ✅ (RLS var!) — mobilde bunu kullanabiliriz
- **Hakedis:** hakedis_kriterleri, hakedis_paketleri, hakedis_spooller
- **Müşteri portalı:** customers, customer_kullanicilar, customer_project_access
- **AI:** ai_analizler, tarama_sonuclari
- **Yetki:** yetki_bloklari, blok_sayfa_yetkileri, kullanici_bloklar, kullanici_yetkileri, rol_sablonlari
- **Tanımlar:** basamak_sablonlari, basamak_tanimlari, sayac_tanimlari, feature_flags, tenant_features

### Zaman Takibi Var!

`is_kayitlari` tablosu mevcut + RLS aktif. CLAUDE.md'de bahsi yok ama **mobilde zaman takibi için bu tabloyu kullanacağız**. Kolonlarını yakında görmeliyiz.

---

## AKSIYON PLANI — Öncelikli Sıra

### Faz 1 — Acil Düzeltmeler (1-2 oturum)

1. **Dil sistemi temizliği**
   - Script: EN/AR → TR eksik anahtarları kopyala
   - Script: 454 ölü anahtarı sil
   - CI check: i18n anahtar tutarlılığı

2. **Şema uyumu (kritik bug)**
   - spool_detay.html: 78 yanlış kolon referansını düzelt
   - devre_detay.html, devre_yeni.html, is_baslat.html sırasıyla
   - Her düzeltmeden sonra canlıda test

### Faz 2 — Yavaşlık (2-3 oturum)

3. **Promise.all dönüşümü**
   - devre_detay.html, markalama.html, kesim.html, devre_yeni.html, tanimlar.html, kullanici_detay.html
   - Her sayfada 4-8x hızlanma beklenir

4. **Inline JS parçalama**
   - spool_detay.html'den ortak fonksiyonlar çıkar
   - devre_detay.html'den aynı
   - Yeni modüller: `ares-spool.js`, `ares-devre.js`, `ares-ui.js`

### Faz 3 — Kural uyumu (1 oturum)

5. **data-sayfa ekleme**
   - Tek komutla 29 sayfaya eklenir (sed script)
   
6. **Tırnaklı tema seçicileri temizle**
   - Regex ile tek seferde

7. **history.back() → navigate(-1)**
   - 2 sayfa, 4 kullanım

8. **Yasak renkler → CSS değişkeni**
   - index.html'de 4 değişiklik

### Faz 4 — Mobil (başka oturum)

9. **MProfil** + **MIsBaslat** — mockup-first
10. **is_kayitlari** üzerinden zaman takibi entegrasyonu

---

## NOTLAR

### CLAUDE.md ile Gerçeklik Arasındaki Fark

Dokümantasyon iyi yazılmış ama **kuralların çoğu hayata geçirilmemiş**:
- data-sayfa: dokümante ✓, uygulama ✗
- Yanlış kolon adları: dokümante ✓, kod eski ✗
- Dil tv() kullanımı: dokümante ✓, yarı uygulama

**Öneri:** Her CLAUDE.md kuralı için bir otomatik check scripti yaz. Bu dokümanın kendisi çalışıyor olmalı.

### Gözden Kaçan Tablolar

CLAUDE.md "Aktif Tablolar" listesinde şunlar YOK ama DB'de var:
- `is_kayitlari` (zaman takibi!)
- `ai_analizler` (AI entegrasyonu)
- `audit_log`
- `belgeler`
- `customer_*` (müşteri portalı)
- `firma_moduller`
- `feedback_kayitlari`
- `feature_flags` (tenant_features'dan farklı)
- `hakedis_*`
- `kullanici_yetkileri` (blok sisteminin yanında?)
- `pipeline_malzemeleri`
- `rol_sablonlari`
- `sayac_tanimlari`
- `tarama_sonuclari`
- `tersane_firma_iliskileri`

**Öneri:** CLAUDE-DB.md adlı ayrı bir dosya oluştur, şema referansı orada olsun.

### Ölü Olabilecek Kod

- `lang/` ve `tv()` sisteminde 454 kullanılmayan anahtar
- `spool_detay.html`'de 132 fonksiyon — muhtemelen yarısı sadece bu sayfaya ait ama bazıları ortak olabilir
- `kurallar.html` 168 KB — tamamen doküman sayfası, muhtemelen production'dan çıkarılabilir veya küçültülebilir

---

## KAPANIŞ

**En kritik 3 işi yap → uygulamanın kalitesi dramatik artar:**

1. `spool_detay.html` yanlış kolonlarını düzelt → sessiz bug'lar gider
2. `devre_detay.html` 15 query'sini Promise.all'a çevir → sayfa 5-8x hızlanır
3. Dil sistemi senkronizasyonu → çeviri bug'ları biter

Toplam: 2-3 oturumluk iş. Ama etkisi bütün sistemi toparlayacak.

---

*Bu rapor Opus 4.7 tarafından 17 Nisan 2026'da hazırlandı. Kod, DB şema, RLS politikaları ve mobil dosyalar tarandı.*
