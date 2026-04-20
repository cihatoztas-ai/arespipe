# AresPipe — Claude Proje Bağlamı

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: 20 Nisan 2026 (7. oturum — marka formatı, etiket, malzeme tutarlılığı)

---

## 1. PROJE TANIMI

**AresPipe** — Tersane boru imalat takip sistemi.

**Stack:**
- **Web:** Vanilla HTML/CSS/JS + Supabase + Vercel → `arespipe.vercel.app`
- **Mobil:** React + Vite + react-router-dom + Supabase + Vercel → `arespipe-mob.vercel.app`

**GitHub:** cihatoztas-ai/arespipe (public repo)

**Multi-tenant:** Her müşteri firma (`tenant`) kendi izole verisini görür. Supabase RLS ile korunur.

**Temel iş akışı:**
```
Proje → Devre → Spool → [Kesim → Büküm → Markalama → KK → Test → Sevkiyat]
```

---

## 2. MİMARİ KURALLAR

### 2.1 Flash Prevention — HER WEB HTML SAYFASINDA ZORUNLU

`<head>` içinde, `<link>`'lerden ÖNCE:

```html
<script>(function(){
  var t=localStorage.getItem('ares_theme')||'light-anthracite';
  var l=localStorage.getItem('ares_lang')||'tr';
  document.documentElement.setAttribute('data-theme',t);
  document.documentElement.setAttribute('lang',l);
  document.documentElement.style.visibility='hidden';
})()</script>
```

**İstisnalar:** `giris.html`, `qr_tara.html`

**Not:** Mobil React uygulamasında bu kural UYGULANMAZ — React kendi lifecycle'ını yönetir (TemaProvider + I18nProvider).

### 2.2 Script Yükleme Sırası — WEB SAYFALARINDA ZORUNLU

```html
<script src="ares-store.js"></script>
<script src="ares-lang.js"></script>
<script src="ares-normalize.js"></script>
<script src="ares-layout.js"></script>
```

**Mobil React'te script yüklemesi yoktur** — import sistemi kullanılır.

### 2.3 Renk Sistemi — TEK SİSTEM

```css
:root {
  --ac: #2D8EFF;    /* Ana mavi */
  --gr: #16a36e;    /* Yeşil */
  --re: #e53e3e;    /* Kırmızı */
  --warn: #d97706;  /* Amber */
  --leg: #7c3aed;   /* Mor */
}
[data-theme=dark] {
  --bg: #0d1117; --sur: #161b24; --sur2: #1c2333;
  --bor: #262f3e; --tx: #e6ecf4; --txd: #6b7a90; --txm: #94a3b8;
}
[data-theme=light-anthracite] {
  --bg: #d8dde4; --sur: #e4e9ef; --sur2: #d0d7e0;
  --bor: #bcc5d0; --tx: #141e2b; --txm: #3a4f63; --txd: #637080;
}
```

**YASAK renkler:** `#3b82f6`, `#22c55e`, `#0a0b0e`, `#10b981`, `#0d0f1a`

**YASAK tema seçiciler — CSS'de:**
- `[data-theme="dark"]` → doğrusu `[data-theme=dark]` (tırnak yok)
- `:root[data-theme="dark"]` sözdizimi

**Not (17 Nisan 2026 — 2. oturum):** Mobil `index.css`'te de aynı kural geçerli, tırnaksız yazım zorunlu.

### 2.4 Sol Kenar Renk Sistemi (Kural B-01)

```css
.cl-ac  { border-left: 3px solid var(--ac)   !important; }
.cl-gr  { border-left: 3px solid var(--gr)   !important; }
.cl-re  { border-left: 3px solid var(--re)   !important; }
.cl-warn{ border-left: 3px solid var(--warn) !important; }
.cl-leg { border-left: 3px solid var(--leg)  !important; }
```

### 2.5 Font Size Kuralı (Kural F-01)

Minimum font-size: `14px`. **14px altı hiçbir yerde kullanılmaz.**

**İstisnalar (sadece bunlar):**
- PDF çıktı blokları — baskı layout'u
- `kurallar.html` demo alanları — kasıtlı gösterim

### 2.6 App Shell Yapısı (Web)

```html
<body>
  <div class="app-shell">
    <div class="main-content">
      <div class="page"><!-- sayfa içeriği --></div>
    </div>
  </div>
</body>
```

### 2.7 Auth Kontrolü (Kural A-01)

**Web:** `ares-layout.js`'deki `authKontrol()` otomatik çalışır.

**Mobil React:** `App.jsx`'te `supabase.auth.onAuthStateChange()` ile merkezi yönetim. Oturum yoksa `/giris` route'una yönlendirir.

### 2.8 Supabase Bağlantısı (Kural S-01)

**Web:** `ARES.supabase()` kullanılır — `supabase.createClient()` KULLANILMAZ

**Mobil React:** `import { supabase } from '../lib/supabase'` — `mobile/src/lib/supabase.js` merkezi bağlantı dosyası

**ÖNEMLİ (17 Nisan 2026):** Supabase anon key olarak **JWT formatındaki (eyJ...) legacy anon key** kullanılır — `sb_publishable_...` formatı auth sorunlarına yol açıyordu, kullanılmaz.

### 2.9 Dil Kuralları (Web için)

#### D-01: Çeviri Zorunluluğu

HTML statik metinler → `data-i18n` zorunlu
JS dinamik içerik → `tv()` zorunlu

#### D-02: Child Element Kuralı

Child elementi olan elementlere `data-i18n` konulmaz.

### 2.10 Feature Flag Sistemi ✅

`ARES.featureVar(kod)` — `tenant_features` tablosundan okur.

**Aktif feature flag kodları:** `3d_model`, `ai_izometri`, `hakedis`, `musteri_portal`, `raporlar_gelismis`

### 2.11 Yetki Sistemi — Blok Tabanlı ✅

**15 Nisan 2026'da tamamlandı. 17 Nisan 2026'da mimari rafine edildi.**

#### DB Tabloları
```
yetki_bloklari        — blok tanımları (sistem preset + firma özel)
blok_sayfa_yetkileri  — blok → sayfa eşleştirmesi + gizli_bolumler[]
kullanici_bloklar     — kullanıcı → blok atamaları (tenant_id ZORUNLU)
```

#### Mimari: Grup = Buton

**Kural (17 Nisan 2026):**
- Her blok kendi grubuna aittir (1:1 veya N:1)
- **Grup = ekrandaki buton adı** (kullanıcıya görünen)
- **Blok = teknik yetki varyantı** (kullanıcıya atanır)
- Aynı gruptaki birden fazla blok → **TEK buton** (grup adıyla)
- Sayfa içinde `gizli_bolumler` KESİŞİMİ alınır (bir blok gösteriyorsa kullanıcı görür)

#### Sistem Presetleri (Silinemez — Trigger Korumalı)

| Blok | Grup |
|---|---|
| Kesim | Kesim |
| İmalat | İmalat |
| Markalama | Markalama |
| Büküm | Büküm |
| **Argon Kaynağı** | **Argon Kaynağı** |
| **Gazaltı Kaynağı** | **Gazaltı Kaynağı** |
| Kalite Kontrol | Kalite Kontrol |
| Malzeme | Malzeme |
| Sevkiyat | Sevkiyat |
| Raporlar | Raporlar |
| Kullanıcı Yönetimi | Kullanıcı Yönetimi |
| Tanımlar | Tanımlar |

**17 Nisan 2026 Değişiklikleri:**
- "Kaynak" bloğu silindi, "Argon Kaynağı" ve "Gazaltı Kaynağı" olarak ayrıldı
- Markalama, Malzeme, Sevkiyat, Raporlar, Kullanıcı Yönetimi, Tanımlar **kendi gruplarına** çıkarıldı
- Her blok artık kendi grubunda (1:1) — ileride alt bloklar eklendiğinde aynı grupta toplanırlar

#### RLS ve tenant_id (KRİTİK)

`kullanici_bloklar` tablosunda RLS politikası:
```sql
tenant_id = kullanici.tenant_id
```

**tenant_id NULL olan satırlar RLS tarafından filtrelenir ve kullanıcıya görünmez!**

Blok atarken MUTLAKA tenant_id set edilmeli:
```sql
INSERT INTO kullanici_bloklar (kullanici_id, blok_id, tenant_id)
VALUES (?, ?, (SELECT tenant_id FROM kullanicilar WHERE id = ?));
```

### 2.12 Sayfa Teslim Kontrol Listesi — ZORUNLU (Kural G-01)

**Web sayfaları için:**
```
□ D-01: Tüm statik HTML metinlere data-i18n eklendi
□ D-01: Tüm dinamik JS metinlerde tv() kullanıldı
□ D-02: data-i18n child element kuralına uyuldu
□ F-01: Font-size 14px altı yok
□ CSS tırnak kuralı: [data-theme=dark] tırnak yok
□ YASAK renkler kullanılmadı
□ history.back() yok
□ S-01: ARES.supabase() kullanıldı
□ Script yükleme sırası doğru (store → lang → normalize → layout)
□ Flash prevention var
□ data-sayfa body tagine eklendi
□ E-01: Enum değerleri (malzeme/yüzey/durum) ARES_NORM üzerinden gösterildi
□ E-02: Malzeme-yüzey uyum kontrolü yapıldı (kaydet öncesi)
□ E-03: spool_id display'de ARES.markaId() ile gösterildi (eski prefix'siz kayıtlar için runtime prefix)
□ E-04: Spool marka format standart: gemi-pipeline-spool_no[-RevN] — ARES_NORM.marka + revFmt kullanıldı
□ E-05: QR etiket 90×40mm, mm cinsinden ölçüler, termal B/W uyumlu (eğer etiket basıyorsa)
```

**Mobil React sayfaları için:** CLAUDE-MOBILE.md'deki checklist geçerlidir.

---

### 2.13 Enum Normalize Sistemi — ZORUNLU (Kural E-01)

**17 Nisan 2026 — 3. oturumda eklendi. 19 Nisan 2026 — 4. oturumda kanonik liste kesinleşti.**

Malzeme, yüzey ve durum değerleri **KOD** olarak saklanır. Ekrana basılırken `ARES_NORM` modülü üzerinden çevrilir.

#### Standart Kodlar (KANONİK — 4. oturumda kilitlendi)

| Alan | Kodlar | TR Etiketi |
|---|---|---|
| malzeme | `karbon` | Karbon Çelik |
| malzeme | `paslanmaz` | Paslanmaz |
| malzeme | `bakir` | Bakır Alaşım |
| malzeme | `alum` | Alüminyum |
| malzeme | `diger` | Diğer |
| yuzey | `asit` | Asit |
| yuzey | `galvaniz` | Galvaniz |
| yuzey | `siyah` | Siyah |
| yuzey | `boyali` | Boya |
| yuzey | `diger` | Diğer |
| durum | `bekliyor`, `devam_ediyor`, `tamamlandi`, `iptal` | — |

**Not:** Operasyonda şu anda `plastik` malzeme ve `epoksi` yüzey kullanılmıyor — 4. oturumda bu kodlar hem `ares-normalize.js`'ten hem dil dosyalarından kaldırıldı. İleride ihtiyaç olursa ARES_NORM regex'ine + 3 dil dosyasına `cmn_*` anahtarı ekleme yeterli (~10 dk iş).

#### API (ares-normalize.js)

```js
// Ham → Kod (DB'ye yazmadan önce)
ARES_NORM.malzemeKod('ST37')      // → 'karbon'
ARES_NORM.yuzeyKod('Boyalı')      // → 'boyali'

// Ham → Etiket (ekrana basmadan önce)
ARES_NORM.malzemeEtiket(raw)      // → "Karbon Çelik" (TR) / "Carbon Steel" (EN)
ARES_NORM.yuzeyEtiket(raw)
ARES_NORM.durumEtiket(raw)

// Alt seviyeli (kod zaten biliniyorsa)
ARES_NORM.tvMalzeme(kod, fb)
ARES_NORM.tvYuzey(kod, fb)
ARES_NORM.tvDurum(kod, fb)

// Malzeme-yüzey uyum kontrolü (5. oturumda eklendi)
ARES_NORM.uyumlu('paslanmaz','galvaniz')   // → false
ARES_NORM.uyumluYuzeyler('paslanmaz')      // → ['asit','diger']
```

#### Malzeme-Yüzey Uyum Matrisi (Kural E-02, 5. oturum)

DB'de CHECK constraint + frontend radio disable + fark tespit popup:

| Malzeme | Asit | Galvaniz | Siyah | Boya | Diğer |
|---|:-:|:-:|:-:|:-:|:-:|
| Karbon Çelik | ✅ | ✅ | ✅ | ✅ | ✅ |
| Paslanmaz | ✅ | ❌ | ❌ | ❌ | ✅ |
| Bakır Alaşım | ✅ | ❌ | ❌ | ❌ | ✅ |
| Alüminyum | ✅ | ❌ | ❌ | ✅ | ✅ |
| Diğer | ✅ | ✅ | ✅ | ✅ | ✅ |

`yuzey='diger'` her malzemeyle uyumlu (özel işlem açıklaması `yuzey_aciklama` alanına yazılır).

#### Kurallar

- **DB'ye KOD yazılır.** Yeni kayıt oluştururken `malzemeKod()` ile ham veri kod'a çevrilir
- **Okuma her iki formatı kabul eder.** Legacy Türkçe satırlar da doğru etikete dönüşür (regex-based fallback)
- **Hardcode Türkçe ASLA yazılmaz** — form'larda, normalize fonksiyonlarında, default değerlerde hep kod
- **Radio/select value'ları kod olmalı:** `<input value="karbon">`, `<label data-i18n="cmn_malzeme_karbon">`
- **i18n anahtar şeması:** `cmn_malzeme_<kod>`, `cmn_yuzey_<kod>`, `cmn_durum_<kod>` — 3 dilde tanımlı

#### Yeni malzeme/yüzey ekleme prosedürü

1. `ares-normalize.js` → regex pattern'e sinonim ekle (örn. `plastik|pe|pvc`)
2. `lang/tr.json`, `lang/en.json`, `lang/ar.json` → `cmn_malzeme_yenituru` anahtarı ekle (3 dilde)
3. Varsa `devre_yeni.html` radio listesine seçenek ekle
4. Deploy

**Admin UI yapılmadı** — gerektiğinde basit ve hızlı eklenebiliyor. 3 yılda 4-5 kez yapılacak iş için admin UI overengineering.

#### Faz 2 Migration — TAMAMLANDI (19 Nisan 2026 — 4. oturum)

DB'deki legacy yazımlar kod formatına çevrildi:
- `spooller.malzeme`: `karbon_celik`, `Karbon Çelik`, `bakir_alasim` → `karbon`, `bakir`
- `spooller.yuzey`: `Asit` → `asit`
- `spool_malzemeleri.malzeme`: aynı temizlik yapıldı

Sonuç: DB'de tek canonical format var. Yeni kayıtlar devre_yeni.html üzerinden zaten kod yazıyor (test edildi).

---

### 2.14 Tenant Prefix Sistemi — YENİ (Kural E-03, 6. oturumda başladı)

Her firma (tenant) için kısa bir harf kodu atanır (1-4 harf, A-Z). Spool kısa ID'leri artık bu prefix'le başlar: `A-0504`, `B-0504`.

**Amaç:** Cross-tenant QR çakışmasını önlemek. Atölyede üretilen spool gemide başka firmaya gidince, onların sisteminde aynı "0504" olabiliyordu. Prefix ile hangi firmanın spool'u olduğu net.

#### DB Kolonu

```sql
tenants.kod VARCHAR(4) NOT NULL UNIQUE
CHECK (kod ~ '^[A-Z]{1,4}$')
```

Mevcut 7 tenant'a atanan kodlar (6. oturum):
- `A` — Demo Atölye
- `B-G` — Diğer demo tenant'lar

#### Kod Atama Kuralları (6. oturumda karar verildi)

- **Kod admin tarafından manuel seçilir** — sistem otomatik atamaz
- **Format gevşek (1-4 harf, A-Z)** — I/L/O/Q serbest (admin karar versin)
- **Kalıcı** — atanan kod değişmez, sonsuza dek firmanınkidir
- **Çakışma durumunda iki aşamalı onay:** Sistem uyarır, admin override ederse önce eski sahipten kodu alır, sonra yenisine verir
- **Yasak kod listesi** (henüz implemente edilmedi): AM, OC, GO, SI vb. uygunsuz çağrışımlı kodlar

#### Yeni Spool ID Formatı

```
<tenant_kod>-<4_haneli_sayı>
Örnek: A-0504, B-0168, AB-0001
```

Üretim yeri: `devre_yeni.html` satır 1491-1500. Tenant kodu yoksa graceful fallback (prefix eklenmez, eski davranış).

#### QR Payload Formatı (7. oturumda implemente edildi ✅)

```
<spool_id>:<UUID>
Örnek: A-0504:f0cd6ae8-eddf-430b-aec0-ca637f7168f7
```

QR okuma mantığı (`qr_tara.html` → `parseQR()`):
1. `:` ile böl → kısa kod + UUID
2. `-` ile böl → tenant prefix + sayı
3. Prefix kendi tenant koduna eşit değilse: *"Bu spool [firma adı]'ne ait, görüntülenemiyor"* uyarısı
4. UUID ile DB lookup (RLS ek güvenlik katmanı)

#### Geriye Uyumluluk + Display Helper (7. oturum)

Eski `0504` formatındaki spool'lar DB'de prefix'siz kalır (migration yapmıyoruz). Display katmanında runtime prefix eklenir:

```js
ARES.markaId("0074")    → "A-0074"   // cache varsa runtime ekler
ARES.markaId("A-0512")  → "A-0512"   // zaten prefix'li, dokunmaz
ARES.markaId(null)      → ""
```

**Kullanım kuralı:** Her sayfa yüklenirken `await ARES.tenantKod()` ile cache ısıtılır. Render'larda `ARES.markaId(s.spool_id)` senkron çalışır. Prefix cache yoksa raw değer döner (güvenli fallback).

**Uygulanan sayfalar (7. oturum):** `devre_detay.html`, `spool_detay.html`, `kesim.html`, `markalama.html`, `kalite_kontrol.html`.

`qr_tara.html` her iki formatı da parse eder:
- Yeni: `A-0504:UUID`
- Eski: `0504` (sadece kısa kod, prefix yok — kendi tenant içinde aranır)

---

### 2.15 Spool Marka Formatı — ZORUNLU (Kural E-04, 7. oturum)

**Programın her yerinde tek tip spool marka formatı:**

```
<gemi/proje_no>-<pipeline_no>-<spool_no>[-Rev<N>]

Örnek:
  NB1137-M100-317-01-P2-S01              (rev yok)
  NB1137-M100-317-01-P2-S01-Rev2         (rev var)
  NB1099C-CF400-8033-029C-S01            (pipeline çok segmentli)
```

**Rev kuralı:**
- Rev boş/null/`0`/`Rev0`/`R0` → ek parça yazılmaz
- Rev `2`, `Rev2` → `Rev2` olarak eklenir
- Rev `A`, `RevA` → `RevA` olarak eklenir

**Helper'lar (`ares-normalize.js`):**

```js
ARES_NORM.marka(...parçalar)      // variadic join('-'), boş değerleri atar
ARES_NORM.revFmt(rev)             // rev-0 yok-say, aksi "RevN"

// Tipik kullanım:
ARES_NORM.marka(
  prj.proje_no,           // gemi/proje
  sp.pipeline_no,         // pipeline (çok segmentli olabilir)
  sp.spool_no,            // spool numarası
  ARES_NORM.revFmt(sp.rev) // rev (opsiyonel)
);
```

**DB select'lerinde `rev` kolonu çekilmeli** — aksi halde rev etiketi üretilemez. Yeni sorgu yazarken unutma:

```sql
SELECT id, spool_no, pipeline_no, rev, ... FROM spooller
```

**Uygulanan sayfalar (7. oturum):**
- `devre_detay.html` — MARKA sütunu (eski "Pipeline No" + "Spool No" iki ayrı sütundu, birleştirildi)
- `spool_detay.html` — başlık `shNo` + etiket alt marka + yazdır pencere başlığı
- `kesim.html` — spool label
- `markalama.html` — spool label
- `kalite_kontrol.html` — spool + paket spool listesi
- `sevkiyatlar.html` — hazır spoolS + sevkiyat detayları

**UI tutarlılık kuralı:** "Pipeline No" ve "Spool No" artık ayrı sütun olarak gösterilmez — tek "Marka" sütunu. Excel export'ta analitik amaçlı ayrı tutulabilir (devre_detay Excel export böyle kalmıştır).

---

### 2.16 Etiket Standardı — ZORUNLU (Kural E-05, 7. oturum)

**QR etiketi fiziksel standart:**

```
Boyut:       90mm × 40mm (yatay, termal etiket)
QR:          25×25mm, sol kenardan 6mm içeride (yazıcı kesme toleransı)
Metin alanı: QR sonu + 3mm'den itibaren, sağ kenarda 2mm pay
Layout:      Üst blok (25mm): QR + 4 satır bilgi
             Alt blok (tam satır): marka, 4mm bold
Renk:        Sadece siyah (termal B/W), renk yok
Font:        Arial sans-serif, tüm bilgiler 2.8mm (alt marka 4mm)
```

**Etiket içerik sırası (üst blok, QR sağı):**
1. İş Emri (örn. P26-127)
2. Devre (örn. "803-Bilge Sludge Hand. System — CF400") — **uzun olursa 2 satır wrap**
3. Tersane (örn. "Tersan Tersanesi")
4. ID (E-03 prefix'li — örn. "A-0074")

**Alt blok:** Marka (E-04 kuralıyla — `NB1099C-CF400-8033-029C-S01[-Rev2]`), tam satır, bold 4mm, `white-space: nowrap; overflow: hidden;`

**Shared helper'lar (`spool_detay.html` içinde):**
```js
_etiketCSS()       // mm cinsinden tüm CSS
_etiketHTML(imgSrc) // etiket HTML string döner, hem modal hem yazdır window
```

**WYSIWYG modal kuralı:** QR modal'da gösterilen etiket, yazdırılacak olanla **birebir aynı** olmalı. Butonlar (Yazdır, İndir) etiket dışında, altta.

**Yazdır kuralları:**
```css
@page { size: 90mm 40mm; margin: 0; }
@media print { /* bar, hint gizlenir */ }
```
Tüm ölçüler **mm cinsinden** — browser scale/fit ayarlarına karşı dirençli. Kullanıcı "Ölçek %100" seçmelidir (etikete @screen mode'da uyarı notu konulmuş).

---

## 3. DİL SİSTEMİ

### 3.1 Web: tv()

```js
tv('anahtar_adi', 'Türkçe fallback')
```

### 3.2 Mobil React: useT() hook

```jsx
import { useT } from '../lib/i18n'
const { tv, dil, setDil } = useT()
tv('anahtar_adi', 'Türkçe fallback')
```

**Mobil'de dil dosyaları:** `mobile/src/lang/{tr,en,ar}.json` — Vite bundle'a dahil eder (fetch yok, hızlı).

### 3.3 Dil Dosyaları

```
lang/
  tr.json  — Türkçe (web) — 1348 anahtar (20 Nisan 2026 — 5. oturum, fark popup + uyum uyarı anahtarları)
  en.json  — İngilizce (web) — 1348 anahtar
  ar.json  — Arapça (RTL destekli, web) — 1348 anahtar
```

```
mobile/src/lang/
  tr.json  — Türkçe (mobil) — 17 Nisan 2026 itibarıyla 61 `m_*` anahtarı
  en.json  — İngilizce (mobil)
  ar.json  — Arapça (RTL destekli, mobil)
```

**Senkron tutma:** Web ve mobil ayrı JSON'ları var. İleride senkronize edilmesi için npm script eklenebilir.

---

## 4. VERİTABANI

### 4.1 Aktif Tablolar

`tenants`, `kullanicilar`, `tersaneler`, `projeler`, `devreler`, `spooller`, `spool_malzemeleri`, `kesim_kalemleri`, `bukum_kalemleri`, `markalama_kalemleri`, `fotograflar`, `notlar`, `islem_log`, `kk_davetler`, `sevkiyatlar`, `testler`, `basamak_tanimlari`, `tenant_features`, `yetki_bloklari`, `blok_sayfa_yetkileri`, `kullanici_bloklar`

### 4.2 Kritik Kolon Adları

**spooller:**
- `dis_cap_mm` (cap_mm değil), `et_kalinligi_mm` (et_mm değil)
- `agirlik` (canonical — `agirlik_kg` legacy kolon da DB'de var ama hep NULL, sonraki temizlikte DROP edilebilir)
- `rev` (revizyon değil)
- `durdurma_sebebi` (durdurma_aciklama değil)
- `alistirma` değerleri: `VAR` / `KISMI` / `YOK` (uppercase)
- `aktif_basamak` değerleri: `on_imalat`, `on_kontrol`, `kaynak`, `imalat`, `kk`, `sevkiyat`
- `ilerleme INTEGER` — kümülatif puan (0-100)
- `is_durumu TEXT` — `bekliyor` / `devam_ediyor`
- `spool_id TEXT` — kısa görüntü ID. **20 Nisan 2026 itibarıyla tenant prefix'li** (ör. "A-0504"). Eski kayıtlar prefix'siz ("0504") kalabilir — geriye uyumluluk var.
- `yuzey_aciklama TEXT` — yuzey='diger' olduğunda özel işlem açıklaması (5. oturumda eklendi)
- `olusturma TIMESTAMPTZ` — kayıt oluşturma tarihi (created_at DEĞİL!)
- CHECK constraint `malzeme_yuzey_uyumu` — matris dışı kombinasyonu engeller (5. oturum)

**spool_malzemeleri** (6. oturumda DB'den doğrulandı):
- `dis_cap_mm NUMERIC`, `et_mm NUMERIC` ⚠ **DİKKAT: spooller ile UYUMSUZ isimler — bu tabloda canonical `et_mm`'dir, `et_kalinligi_mm` değil**
- `boy_mm NUMERIC`, `agirlik_kg NUMERIC` (spooller'dan farklı — burada canonical)
- `kalite`, `malzeme`, `adet INTEGER`, `boyut TEXT`
- `kod`, `tip`, `tanim`, `heat_no`, `sertifikali BOOLEAN`

**markalama_kalemleri:**
- `et_mm NUMERIC` — plaka markalamada kalınlık (6. oturumda doğrulandı)

**fotograflar:**
- `dosya_url` (url değil)
- `yukleyen_id UUID` — canonical, kullanicilar'a FK (6. oturumda migrate edildi)
- `yapan_id TEXT` — **LEGACY kolon**, 11 eski kayıtta email vardı, 20 Nisan'da migrate edildi. İz olarak duruyor, DROP yapılabilir ileride
- `islem_turu` (asama değil), `spool_id` UUID

**notlar:**
- `metin` (icerik değil), `ekleyen_id` (yapan_id değil — 6. oturumda düzeltildi, eskiden silent fail oluyordu)
- `qr_goster BOOLEAN`, `silindi BOOLEAN`

**devreler:**
- `ad` (devre_adi değil)
- `termin` (DATE) — `termin_tarihi` silindi
- `ilerleme` kullanılmıyor — spooller.ilerleme ortalaması
- `durum` — DB'de saklanıyor (iptal akışı için), **ama UI'dan 5. oturumda kaldırıldı** (tüm kayıtlar 'aktif' idi)
- `yuzey_aciklama TEXT` — yuzey='diger' olduğunda (5. oturumda eklendi, devre_yeni'de henüz yazılmıyor — sadece devre_duzenle kullanıyor)
- **Legacy format:** `malzeme` kolonu hâlâ Türkçe ("Karbon Çelik", "Paslanmaz" vb.) — ARES_NORM okurken normalize ediyor ama DB temiz değil (sonraki oturum işi)

**tenants** (6. oturumda eklendi):
- `ad`, `olusturma`, standart alanlar
- `kod VARCHAR(4) NOT NULL UNIQUE` — tenant prefix, CHECK `^[A-Z]{1,4}$` (bkz. Bölüm 2.14)

**kullanicilar (17 Nisan 2026 — 2. oturum notu):**
- `ad_soyad` (ad değil!) — hata kaynağı, dikkat
- `foto_url TEXT` — avatar için (upload UI henüz yok)
- `email`, `rol`, `tenant_id`, `firma`, `brans`, `tel`, `ui_tercihleri JSONB`
- `tenants(ad)` JOIN'i bazı RLS kombinasyonlarında 400 döndürür → tenant adını ayrı sorguyla çek

**islem_log (6. oturumda not edildi, şema belirsiz):**
- `yapan_id` kolonu muhtemelen TEXT (email formatında), spool_detay.html satır 1101 bu sayede çalışıyor
- Tam şema CLAUDE.md'de henüz yok — ileride DB sorgusu ile doğrulanmalı

**yetki_bloklari:**
- `ad`, `grup`, `renk`, `sistem_preset`, `sira`, `tenant_id` (NULL = sistem preset)

**blok_sayfa_yetkileri:**
- `blok_id`, `sayfa_kodu` (ör: `bukum`, `mobile/spool_detay`), `gizli_bolumler TEXT[]`

**kullanici_bloklar:**
- `kullanici_id`, `blok_id`, `tenant_id` (ZORUNLU, RLS bunu kontrol eder)

### 4.3 Storage

**Bucket adı: `arespipe-dosyalar`**

```js
// Web
ARES.supabase().storage.from('arespipe-dosyalar').upload(...)

// Mobil React
supabase.storage.from('arespipe-dosyalar').upload(...)
```

---

## 5. HESAPLAMALAR

### İlerleme
`devreler.ilerleme` hep 0 → `spooller.ilerleme` ortalaması (puan bazlı 0-100)

### Alıştırma Agregasyonu
```js
if (agg.count > 0 && agg.varCount === agg.count) agg.alistirma = 'VAR';
else if (agg.varCount > 0 || agg.kismiCount > 0) agg.alistirma = 'KISMI';
else agg.alistirma = 'YOK';
```

### Kaynak basamağı ilerleme mantığı (17 Nisan 2026)

- `spooller.aktif_basamak` değeri `kaynak` olarak tek kalır
- Argon ve Gazaltı aynı basamağı ilerletir (ekrandaki buton farklı, DB'deki basamak aynı)
- Kaynak ilerleme yüzdesi tüm kaynak işlemleri bitince hesaplanır (kaynak türü fark etmez)

---

## 6. RPC FONKSİYONLARI

### devre_istatistik(devre_ids uuid[])

```js
var { data } = await supa.rpc('devre_istatistik', { devre_ids: devreIdListesi });
```

---

## 7. DOSYA YAPISI

```
/
├── index.html, giris.html, devreler.html, devre_detay.html ...  ← Web (vanilla)
├── ares-store.js, ares-lang.js, ares-normalize.js, ares-layout.js
├── vercel.json
├── CLAUDE.md
├── CLAUDE-MOBILE.md
├── lang/
│   ├── tr.json, en.json, ar.json
├── mobile/                          ← React uygulaması (arespipe-mob.vercel.app)
│   ├── src/
│   │   ├── main.jsx                 ← BrowserRouter + TemaProvider
│   │   ├── App.jsx                  ← Routes + auth guard + I18nProvider
│   │   ├── index.css                ← CSS değişkenleri + [data-theme=dark] + [data-theme=light-anthracite]
│   │   ├── lib/
│   │   │   ├── supabase.js          ← Supabase client (JWT anon key)
│   │   │   ├── auth.js              ← getOturum(), getTenantId()
│   │   │   ├── i18n.jsx             ✅ useT() hook + I18nProvider
│   │   │   ├── yetki.js             ✅ blok/grup/gizli_bolumler helper
│   │   │   ├── gruplar.js           ✅ grup → ikon/renk/hedef haritası
│   │   │   └── tema.jsx             ✅ TemaProvider + useTema Context (2. oturum)
│   │   ├── lang/                    ✅ tr.json, en.json, ar.json (61 m_* anahtarı)
│   │   ├── screens/
│   │   │   ├── MGiris.jsx            ✅ Giriş ekranı
│   │   │   ├── MAnasayfa.jsx         ✅ Router: role göre yönlendirir
│   │   │   ├── MAnasayfaYonetici.jsx ✅ Dashboard + İşlem Başlat + profil butonu
│   │   │   ├── MIslemler.jsx         ✅ Grup bazlı büyük buton ekranı + profil butonu
│   │   │   ├── MDevreler.jsx         ⏳ Placeholder
│   │   │   └── MIsBaslat.jsx         ⏳ Placeholder (mockup-first ile yazılacak)
│   │   └── components/
│   │       └── MDrawer.jsx          ✅ Profil + tema toggle + dil dropdown + çıkış
│   ├── package.json
│   └── vite.config.js
├── admin/
└── api/
```

---

## 8. KARARLAR VE MİMARİ NOTLAR

### Mobil React Mimarisi (16 Nisan 2026)

**Karar:** Mobil taraf vanilla HTML/JS'den React + Vite'a geçirildi.

**Nedenler:**
- Vanilla'da iOS viewport, event listener birikimi, state dağınıklığı sorunları çözümsüz kalıyordu
- React component lifecycle bu sorunları framework seviyesinde çözüyor
- Gelecekteki Capacitor (native app) geçişi React ile çok daha kolay

**Mimari:**
- Web tarafı (`arespipe.vercel.app`) değişmedi — vanilla HTML/JS olarak kalır
- Mobil taraf (`arespipe-mob.vercel.app`) ayrı Vercel projesi — React
- Aynı Supabase, aynı DB, aynı renk sistemi

### Blok Tabanlı Yetki Sistemi (15 Nisan 2026)

Eski rol bazlı sistem korunuyor. Yeni sayfalar blok kodu ile kullanır.

**Demo kullanıcılar (Demo Atölye tenant):**
| Email | Şifre | Bloklar |
|---|---|---|
| demo.yonetici@arespipe.dev | Demo1234! | Tüm bloklar |
| demo.imalatci@arespipe.dev | Demo1234! | İmalat, Markalama, Kesim, Argon Kaynağı, Gazaltı Kaynağı |
| demo.testereci@arespipe.dev | Demo1234! | Kesim |
| demo.bukumcu@arespipe.dev | Demo1234! | Büküm |
| demo.kk@arespipe.dev | Demo1234! | KK + Sevkiyat |
| demo.malzeme@arespipe.dev | Demo1234! | Malzeme |

### Yetki Mimarisi Rafine Edilmesi (17 Nisan 2026)

**Karar:** "Grup = Buton, Blok = Yetki Varyantı" mimarisi.

**Nedenler:**
- Aynı işlevin (örn. Büküm) farklı varyasyonları olabilir — bir operatör temel büküm yapar, diğeri ölçü de girer
- DB'de bu ayrım blok düzeyinde yapılır, ekranda grup düzeyinde gösterilir
- Kullanıcıya atanmış tüm blokların izinleri `gizli_bolumler` kesişimi ile birleştirilir

**Kural:**
- Her blok kendi grubunda (1:1) — ileride aynı grupta birden çok blok olabilir
- Mobilde İşlemler ekranı grupları listeler, blokları değil
- Sayfaya girince: kullanıcının o gruba ait tüm blokları kesiştirip gizli bölümleri hesaplar

### Kaynak İşlemleri Ayrıştırması (17 Nisan 2026)

**Karar:** "Kaynak" tek blok yerine "Argon Kaynağı" ve "Gazaltı Kaynağı" ayrı bloklar olarak tanımlandı.

**Nedenler:**
- Gerçek işleyişte argon ve gazaltı kaynakçıları farklı olabilir
- Bir operatör sadece argon, diğeri hem argon hem gazaltı yapabilir
- İleride başka kaynak türleri (tig, mig, vb.) eklenebilir

**Etki:**
- `aktif_basamak = 'kaynak'` değişmedi — DB'deki işlem basamağı tek
- Ekranda 2 farklı buton çıkıyor, ilerleme hesabı aynı

### Supabase Auth Sorunu Çözümü (17 Nisan 2026)

**Sorun:** `sb_publishable_...` formatındaki yeni anon key auth'u başlatabiliyordu ama sonraki schema query'lerde 500 hatası veriyordu ("Database error querying schema").

**Asıl sebep:** `auth.users` tablosunda eski kullanıcıların `confirmation_token`, `email_change`, `recovery_token` gibi kolonları NULL kalmıştı. GoTrue'nun güncel versiyonu NULL toleransı kaldırdığı için login'de patlıyordu.

**Çözüm (SQL):**
```sql
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
UPDATE auth.users SET email_change_token_current = '' WHERE email_change_token_current IS NULL;
UPDATE auth.users SET reauthentication_token = '' WHERE reauthentication_token IS NULL;
UPDATE auth.users SET phone_change = '' WHERE phone_change IS NULL;
UPDATE auth.users SET phone_change_token = '' WHERE phone_change_token IS NULL;
```

**Ek karar:** Mobil ve web'de JWT anon key (eyJ... formatı) kullanılır, `sb_publishable_` değil.

### Mobil MDrawer ve Tema Context (17 Nisan 2026 — 2. oturum)

**Karar:** Mobil drawer (profil + ayarlar) ve merkezi Tema Context'i eklendi.

**Bileşenler:**
- `mobile/src/lib/tema.jsx` — `TemaProvider` + `useTema()` hook. `main.jsx`'te TemaProvider root'a eklendi. `localStorage.ares_theme`'ye otomatik yazar.
- `mobile/src/components/MDrawer.jsx` — sağdan açılan panel:
  - Avatar (fotoğraf destekli, `kullanicilar.foto_url` alanı)
  - Kullanıcı adı (Barlow Condensed) + email
  - Rol + tenant pill badge
  - "Profili Düzenle" satırı (→ `/profil` — MProfil henüz yok)
  - Tema toggle (☀/🌙)
  - Dil dropdown (🇹🇷 TR ▼, açılan menüden seçim)
  - Çıkış (kırmızı ghost)
- `mobile/src/index.css` — `[data-theme=dark]` ve `[data-theme=light-anthracite]` blokları eklendi (önceden sadece light vardı, toggle çalışmıyordu).

**Tasarım kararları:**
- Web'in tasarım diliyle bütünlük: Barlow Condensed başlık, pill badge'ler
- Tema: toggle switch (web topbar'daki gibi)
- Dil: dropdown — 3+ dil eklenince bütünlük bozulmasın
- Drawer doldurulmadı, bilinçli nefes alan alanlar bırakıldı
- RTL uyumu: dropdown `insetInlineEnd` ile Arapça modunda doğru tarafa açılır

**Yeni i18n anahtarları:** 50+ `m_*` anahtarı (drawer, gruplar, rol, selamlama, süre) 3 dilde senkronize edildi — toplam 61 `m_*` anahtarı.

**Supabase sorgusu düzeltildi:** `kullanicilar.ad` yerine `kullanicilar.ad_soyad`; `tenants(ad)` JOIN yerine ayrı sorgu (RLS 400 sorunu).

**Mockup-first iş akışı:** MDrawer için 4 mockup iterasyonu yapıldı (v1→v4), kullanıcı onayıyla ilerlendi. Bu süreç yeni R-10 kuralı olarak CLAUDE-MOBILE.md'ye eklendi.

### is_durumu Akışı
```
bekliyor → işe başlayınca → devam_ediyor → iş bitince → bekliyor
```

### Mükerrer İş Önleme (Planlandı)
Spool tarandığında `is_durumu === 'devam_ediyor'` ise uyarı göster, işe başlatma.

### Tenant Prefix Sistemi (20 Nisan 2026 — 6. oturum)

**Karar:** Her firmaya 1-4 harflik bir kod atanır (`tenants.kod`). Spool kısa ID'leri artık `A-0504` formatında üretilir. QR payload'ı ileride `A-0504:UUID` olacak.

**Nedenler:**
- Cross-tenant QR çakışması: Atölyede üretilen spool gemide başka firmanın AresPipe kullanan ekibine gidebilir. Kendi DB'lerinde "0504" varsa yanlış spool açılır veya "bulunamadı" der. Prefix ile hangi firmanın olduğu net
- İnsan gözüyle de firma belli — etikette, sözlü iletişimde ("A-sıfır-beş-sıfır-dört"), matbu evrakta
- UUID alternatifi daha güvenli ama insan okunamaz; hibrit formatla ikisi de

**Mimari:**
- DB: `tenants.kod VARCHAR(4) UNIQUE`, CHECK regex `^[A-Z]{1,4}$` (gevşek, admin karar verir)
- Kod seçimi: Admin manuel yapar, sistem otomatik üretmez
- Çakışma: İki aşamalı onay — önce eski sahipten kodu al, sonra yenisine ver
- Kalıcı: Atanan kod değişmez, değiştirilirse eski QR'lar bozulur
- Yasak liste: AM, OC, GO, SI gibi uygunsuz kodlar (henüz implemente edilmedi)
- Geriye uyumluluk: Eski `0504` formatındaki QR'lar bozulmuyor; qr_tara her iki formatı da parse edecek

**İlerleme:**
- ✅ DB hazır (7 demo tenant'a A-G atandı)
- ✅ `devre_yeni.html` yeni spool'ları prefix'li üretiyor (A-0504 gibi — test edildi)
- ✅ `spool_detay.html` DB'den prefix'li kodu okuyor, UI'da gösteriyor
- ❌ QR payload hâlâ sadece kısa kod — **7. oturumda tamamlanacak**
- ❌ `qr_tara.html` prefix'i tanımıyor — **7. oturumda eklenecek**
- ❌ Admin UI (kod atama) — sonraki oturumda
- ❌ Yasak kod listesi UI'ı — sonraki oturumda

### Açık İş Kartı (17 Nisan 2026 — planlandı)
Kullanıcının açık işi varken:
- Üstte sabit kart olarak görünür (alta değil)
- Farklı bir iş başlatmayı BLOKLAMAZ (kullanıcı imalatta açık işi varken markalama başlatabilir)
- Birden fazla açık iş olabilir

### PWA + Capacitor Yol Haritası
```
Şu an:    PWA (tarayıcıda, Ana Ekrana Ekle)
Sonra:    React mobil tamamlanır
Sonra:    Capacitor → Android → Play Store
Sonra:    Mac/Xcode → iOS → App Store
```

---

## 9. SOHBET SONU GÜNCELLEME PROTOKOLÜ

Her sohbet bitiminde:
1. Yeni karar alındı mı? → Bölüm 8'e ekle
2. Tamamlanan var mı? → Bölüm 10'da `[x]` yap
3. Yeni sayfa eklendi mi? → Bölüm 7'yi güncelle
4. Veritabanı değişikliği? → Bölüm 4'ü güncelle
5. Yeni kural? → Bölüm 2'ye ekle
6. Son güncelleme tarihini değiştir

---

## 10. DOSYA BAZINDA BEKLEYENLER

### Web sayfaları
- [ ] `<body data-sayfa="...">` eklenmesi — toplu yapılacak
- [ ] Sidebar'da yetkisiz linkleri gizleme
- [ ] `tanimlar.html` — Yetki Blokları sekmesi i18n eksik
- [ ] **Yeni:** `tanimlar.html` — tenant kod yönetimi UI (yeni firma oluştururken kod, çakışma uyarısı, iki aşamalı override — 6. oturumda karar alındı, implement bekliyor)
- [ ] `kullanici_detay.html` — Yetkiler sekmesi i18n eksik
- [ ] `proje_liste.html` / `proje_detay.html` — Supabase entegrasyonu yok
- [ ] `malzeme.html` — yazılacak
- [ ] `api/izometri-oku.js` — 502 Bad Gateway
- [ ] **Yeni kaynak blokları UI'ya yansıma kontrolü** — Tanımlar sayfasında Argon/Gazaltı görünüyor mu?
- [x] **Dropdown filter'lar enum kod gösteriyor** (devreler/kesim) — 4. oturumda düzeltildi
- [ ] **Excel export i18n** — kesim.html'de 'KULLANILACAK MALZEME' vb. başlıklar hardcode Türkçe
- [x] **Faz 2 SQL migration** — 4. oturumda tamamlandı (spooller + spool_malzemeleri)
- [x] **Malzeme-Yüzey uyum kontrolü** — 5. oturumda tamamlandı (frontend disable + popup + DB CHECK constraint)
- [x] **devre_yeni.html yüzey "Diğer" seçeneği** — 5. oturumda eklendi
- [ ] **`spool_malzemeleri.kalite='diger'` UX sorunu** — kalite alanı serbest metin (6. oturumda büyüdü — bkz. aşağıda "Kalite UX" notu)
- [x] **devreler.html durum sütunu + filtresi** — 5. oturumda kaldırıldı (75/75 kayıt 'aktif' idi, ölü kod)
- [x] **Sapma mantığı çoğunluk-baz** — 5. oturumda düzeltildi (ilk-insert → çoğunluk)
- [ ] **devreler.malzeme DB migration** — hâlâ "Karbon Çelik" formatında (spooller gibi canonical'e çekilmeli)
- [ ] **devreler Excel export'ta hâlâ d.durum** — ölü veri, temizlenebilir
- [x] **spool_detay.html sessiz bug'ları** — 6. oturumda 11 fix (notlar insert+map, fotograflar migration, ağırlık UPDATE, spool_id okuma, ID gösterim sırası, et kalınlığı header fallback)
- [x] **devre_yeni.html tenant prefix** — 6. oturumda yeni spool'lar `A-0504` formatında üretiliyor
- [x] **fotograflar yapan_id → yukleyen_id migration** — 6. oturumda 11 legacy kayıt migrate edildi
- [x] **tenants.kod kolonu + 7 tenant'a kod ataması** — 6. oturum
- [ ] **Tenant prefix serisini tamamlama** — QR payload formatı (`A-0504:UUID`) ve `qr_tara.html` cross-tenant parse (7. oturum Öncelik 1)
- [ ] **Kalite UX + veri temizliği** — Form'da kalite alanı malzeme radio grubu gibi davranıyor ("karbon/paslanmaz" değerleri alıyor). Olması gereken: ST37, A106-B, 304L gibi alaşım standartları. DB'de karışmış veriler var — serbest text + autocomplete tasarımı (7. oturum Öncelik 2)
- [ ] **Spool no → marka gösterimi** — Tablolarda "S01" tek başına anlamsız, pipeline+spool_no birleştirilsin (devre_detay/kesim/markalama/sevkiyat/raporlar)
- [ ] **spool_detay.html performans** — 3007 satır, 6-7 paralel SQL, 3D kodu — lazy load + 3D ayrı dosya refactor'u (ayrı oturum işi)

### Mobil React sayfaları
- [x] MGiris.jsx — tamamlandı, i18n'li
- [x] MAnasayfa.jsx — router olarak çalışıyor
- [x] MAnasayfaYonetici.jsx — dashboard + İşlem Başlat + profil butonu
- [x] MIslemler.jsx — grup bazlı buton ekranı + profil butonu
- [x] **MDrawer.jsx** — profil, tema toggle, dil dropdown, çıkış (17 Nisan 2026 — 2. oturum)
- [x] **Tema state React Context'e taşındı** — `lib/tema.jsx`
- [x] **index.css dark tema eklendi** — `[data-theme=dark]` blokları
- [ ] **MProfil.jsx** — avatar yükleme + kişisel bilgi düzenleme (MDrawer'daki "Profili Düzenle" buraya gidecek)
- [ ] `MIsBaslat.jsx` — operatör iş akışı (mockup-first kuralı — R-10)
- [ ] `MDevreler.jsx`, `MDevreDetay.jsx`, `MSpoolDetay.jsx`, `MQRTara.jsx`
- [ ] Rol etiketinde bazen anahtar adı görünüyor (örn. `operatör` küçük) — i18n eşleşme kontrolü
- [ ] Supabase Storage avatar upload yolu (`foto_url` kolonu hazır, upload UI yok)
- [ ] Dil dosyaları (web/mobil) senkronizasyon scripti

---

## 11. SON OTURUM — 20 NİSAN 2026 (6. OTURUM)

### Bu oturumda tamamlananlar (spool_detay.html sessiz bug avı + tenant prefix temelleri)

Ana tema: DB ile UI arasındaki senkron kopukluklarını kapatma. 12 fix, 2 dosya, 3 DB migration.

**1. spool_detay.html — 11 fix, hepsi sessiz bug:**
- **Notlar (2 fix):** `yapan_id` → `ekleyen_id`. DB'de `notlar.yapan_id` kolonu YOK (sadece `ekleyen_id` var), insert silent fail ediyordu. Kullanıcı not ekleyip sayfa yeniledi → not kayboluyordu. Map tarafında da yanlış kolon okunduğu için kişi bilgisi UI'da hep "Admin" görünüyordu.
- **Fotograflar migration (5 değişiklik):** `fotograflar.yapan_id` (TEXT, legacy) → `yukleyen_id` (UUID, canonical). Tip uyumsuzluğunu çözmek için `yapan` değişkeni ikiye bölündü: `yapanId` (UUID, DB için), `yapanAd` (ad_soyad, UI için). DB'de de 11 legacy kayıt email lookup ile migrate edildi.
- **Spool ağırlık UPDATE (1 fix):** `spooller.agirlik` UPDATE bloğunda yoktu — ağırlık değiştiriliyor, "güncellendi" toast'ı çıkıyor, DB'ye yazılmıyordu. Klasik "UI gösteriyor ama DB'ye düşmüyor" pattern'i.
- **Spool ID okuma (1 fix):** `spoolYukle` fonksiyonu `s.spool_id`'yi hiç okumuyordu — başlıkta "ID: 9D07969B" (UUID[0-8]) görünüyordu. Satır 922'ye `SP.spoolId = s.spool_id` atandı.
- **Spool ID gösterim sırası (2 fix):** 1241 ve 2365'te öncelik UUID'deydi, kısa kod asla görünmüyordu. Düzeltildi — şimdi `A-0512` gibi insan okunabilir kod önce gösteriliyor.
- **QR kodu içeriği:** SP.spoolId atanınca QR payload artık doğru kısa kodu içeriyor. Önceden yanlış/eski değer içeriyordu → tersanedeki operatör yanlış spool açma riski vardı.
- **Et kalınlığı header fallback:** `spooller.et_kalinligi_mm` NULL ise malzemelerden en yaygın `et_mm` değerini alıp header'a yansıt. Önceden "ET KALINLIĞI —" dash görünüyordu.

**2. devre_yeni.html — Tenant Prefix (1 fix):**
- Spooller INSERT bloğunda tenant kodu bir kez çekilip her `spool_id`'ye prefix eklendi
- Yeni spool'lar artık `A-0504`, `A-0512` gibi formatta üretiliyor (test edildi)
- Graceful fallback: tenant kod NULL ise eski davranış (prefix yok)

**3. DB Migration — 3 blok:**

Blok A — Fotograflar UUID migration:
```sql
UPDATE fotograflar f SET yukleyen_id = k.id
FROM kullanicilar k
WHERE f.yukleyen_id IS NULL AND f.yapan_id = k.email;
-- 11 satır etkilendi (hepsi cihatoztas@gmail.com → UUID)
```

Blok B — Tenants.kod kolonu + 7 tenant'a atama:
```sql
ALTER TABLE tenants ADD COLUMN kod VARCHAR(4) NOT NULL UNIQUE;
ALTER TABLE tenants ADD CHECK (kod ~ '^[A-Z]{1,4}$');
-- Demo tenant'lara A-G atandı
```

Blok C — DB keşifleri (kod değişmedi, sadece belgelendi):
- `spool_malzemeleri` tam şeması (daha önce CLAUDE.md'de yoktu)
- `markalama_kalemleri.et_mm` varlığı
- `spooller.agirlik_kg` legacy NULL
- `fotograflar.yapan_id` legacy TEXT

### Değişen Dosyalar (2)

| Dosya | Değişim | Satır (önce → sonra) |
|---|---|---|
| `spool_detay.html` | 11 fix | 2996 → 3007 |
| `devre_yeni.html` | Tenant prefix | 2009 → 2013 |

### Verilen Anahtar Kararlar

**Tenant prefix sistemi (E-03):**
- Format: 1-4 harf, A-Z (Excel kolon mantığıyla genişler)
- Admin manuel seçer, sistem otomatik vermez
- Çakışma durumunda iki aşamalı onay (önce eski sahipten al, sonra yenisine ver)
- I/L/O/Q kısıtı yok — admin karar versin
- Kalıcı: atanan kod değişmez

**QR payload formatı (planlandı, 7. oturumda implemente edilecek):**
- Yeni: `A-0504:UUID`
- Eski: `0504` (geriye uyumlu, qr_tara iki formatı da parse eder)
- Cross-tenant okuma: uyarı mesajı gösterir ("Bu spool X firmasına aittir")

**Kalite alanı sorunu (6. oturumda tespit edildi):**
- Form'da kalite alanı ikinci bir malzeme radio grubu gibi davranıyor (canonical malzeme kodlarını alıyor)
- DB'de `spool_kalite = "karbon"` gibi bozuk veriler var (olması gereken ST37, A106-B, 304L...)
- Çözüm 7. oturuma bırakıldı — serbest text + autocomplete tasarımı

### Önemli Öğrenmeler

**1. "78 yanlış referans" tahmini büyük ölçüde yanlıştı.** Dosyada önceki oturumlardan kalan `✅ FIX` yorumları vardı — çoğu zaten düzeltilmişti. Gerçek bug sayısı kolon adı değişimi değil, **DB ile UI arasındaki senkron kopuklukları**: INSERT'te eksik alan, UPDATE'te yazılmayan kolon, okuma tarafında yanlış field adı. "78 referans düzelt" odağı yerine **"her INSERT/UPDATE'in form state ile simetrik mi"** bakışı daha verimli.

**2. DB şemasını varsayma, sorgu at.** CLAUDE.md Bölüm 4.2 eksikti — `spool_malzemeleri` şeması hiç yazılmamıştı. `et_mm` mi `et_kalinligi_mm` mi belirsizdi. 10 saniyelik DB sorgusu saatlerce belirsizliği kapattı. 6. oturumun en kritik dersi.

**3. Sessiz fail en sinsi düşman.** `_supaInsert` helper'ı `console.warn` atıyor ama toast yok. Kullanıcıya "başarılı" gibi gösteriliyor, DB'ye yazılmıyor. Notlar, ağırlık, fotoğraflar hep bu pattern'in kurbanıydı. Helper'ların error handling'i ciddi ele alınmalı.

**4. Migration-in-progress pattern'i yaygın.** `fotograflar.yapan_id/yukleyen_id`, `spooller.agirlik/agirlik_kg` — ikili kolon durumları. Yeni bir tane bulunduğunda aynı pattern'le çözülmeli: canonical'e yaz, fallback'i UI'da tut, legacy migration'ı ayrı SQL ile yap.

**5. Tip uyumsuzluğu sessiz bug yaratır.** `yapan_id` TEXT, `yukleyen_id` UUID — tip değişimini göz ardı ettim, INSERT patlayacaktı. Kullanıcı doğru soru ile yakaladı, düzelttim. 5. patch'im başlangıçta HATALIYDI. Şema detayları kritik.

**6. Oturum özetlerini skeptik oku.** Önceki özet "78 yanlış referans" diyordu, gerçek çok farklıydı. "Tamamlandı" iddialarını DB'den doğrulamak lazım — 4. ve 5. oturumda da benzer durumlar yaşanmıştı.

**7. Kullanıcı yorgunluğu + oturum uzunluğu.** Bu oturumda kullanıcı "sürekli oturum değişmek yorucu" dedi, haklıydı. CLAUDE-SON-OTURUM.md ve CLAUDE-SONRAKI-OTURUM.md'nin özenli yazılması sonraki oturumun "hatırlamak" yerine "direkt koda gir" olmasını sağlıyor — ihmal edilmemeli.

---

## 11A. ÖNCEKİ OTURUM — 20 NİSAN 2026 (5. OTURUM)

### Bu oturumda tamamlananlar (Malzeme-Yüzey Uyum + Fark Tespit + devreler.html refactor)

Bu oturumda üç büyük iş bitti:

**1. Malzeme-Yüzey Uyum Kontrolü (Kural E-02)**
- Matris kilitlendi: paslanmaz/bakır → sadece asit, alüminyum → asit+boya, karbon/diger → hepsi (`yuzey=diger` her zaman serbest)
- `ares-normalize.js` + `uyumlu()` ve `uyumluYuzeyler()` API'si
- `devre_yeni.html` + `devre_duzenle.html`: Malzeme değişince uyumsuz yüzey radio'ları disable + strikethrough + tooltip (`dny_uyum_uyari`)
- `devre_duzenle.html`'de grace period — sayfa açılınca mevcut uyumsuz seçimi zorla değiştirmez, kullanıcı manuel değiştirirse kural işler
- DB CHECK constraint `malzeme_yuzey_uyumu` eklendi

**2. "Diğer" Yüzey + yuzey_aciklama**
- `cmn_yuzey_diger` radio 4. oturumda eklenmişti, bu oturumda forma da eklendi
- `ALTER TABLE spooller ADD COLUMN yuzey_aciklama TEXT` (sadece INSERT yolu için)
- `ALTER TABLE devreler ADD COLUMN yuzey_aciklama TEXT` (devre_duzenle için)
- Frontend: radio "Diğer" seçilince text input görünür (`fYuzeyAciklama` / `yuzeyDigerAciklama`)
- "Boyalı" → "Boya" etiket düzeltmesi devre_yeni ve devre_duzenle formlarında da uygulandı

**3. Fark Tespit Popup (Generic Diff Framework)**
- Kaydet öncesi form beyanı ↔ spool'larda gerçek değerler karşılaştırılır
- Malzeme + yüzey için ayrı kartlar, her biri: beyan pill (mavi) → yüklenen pill'ler (kırmızı) + uyumsuz spool listesi
- 3 buton: **İptal et** (confirm + devreler.html'e dönüş), **Düzelt** (popup kapan + formda kal), **Yüklemeye devam et** (farkı kabul et, kayıt devam)
- Generic yapı: ileride yeni alanlar (kalite, çap toleransı vb.) kolayca eklenebilir
- `devre_yeni.html`: in-memory `spooller[]` array'i ile karşılaştırır
- `devre_duzenle.html`: DB'deki `_devreSpools` ile karşılaştırır

**4. DB Migration — 8 uyumsuz kayıt + aluminyum → alum**
- 4. oturumda gözden kaçan `aluminyum` → `alum` dönüşümü yapıldı (83 kayıt)
- 8 uyumsuz kayıt (paslanmaz+galvaniz, bakir+siyah, alum+galvaniz) → `asit`'e çevrildi (hepsi 7 Nisan toplu test verisiydi, ilerleme=0, bekliyor)

**5. devreler.html — Durum sütunu + sapma mantığı**
- `devreler.durum` tüm 75 kayıtta `'aktif'` idi → `DURUM_MAP` ölü kod → **UI sütunu + filtresi kaldırıldı**
- İptal akışı için DB kolonu korundu (`durum='iptal'`)
- **Sapma mantığı çoğunluk-baz'a çevrildi:** Eski kod "ilk insert" baz alıyordu (kırılgan: 60 karbon + 1 paslanmaz ama paslanmaz ilk girdiyse "Paslanmaz ⚠ +60" yazabiliyordu). Yeni: `malzemeSayim[mk]++` → en çok olan baz, badge sırası çoğunluktan aza.

### Dil Dosyaları (3) — 1338 → 1348 anahtar
10 yeni anahtar (TR/EN/AR):
- `dny_fark_title`, `dny_fark_alt`, `dny_fark_beyan`, `dny_fark_yuklenen`
- `dny_fark_duzelt`, `dny_fark_devam`, `dny_fark_iptal_tam`, `dny_fark_iptal_confirm`
- `dny_uyum_uyari` (placeholder: `{mal}`)
- `dny_ph_yuzey_diger`

### Değişen Dosyalar (7)
- `ares-normalize.js` (+uyumlu, +uyumluYuzeyler, 116 → 164 satır)
- `lang/{tr,en,ar}.json` (1338 → 1348)
- `devre_yeni.html` (1751 → 2009, +258 satır)
- `devre_duzenle.html` (358 → 628, +270 satır)
- `devreler.html` (2357 → 2340, −17 satır net; ölü kod temizlendi)

### Verilen Anahtar Kararlar
- **Bakır için boya kapalı (dar)** — operasyonda hiç kullanılmamış
- **Alüminyum için boya açık** — %65 oranında operasyonda kullanılıyor (54/83)
- **Fark popup sadece kaydet()'te** — her spool ekleme anında değil (tek güvenlik ağı, tüm import yolları oradan geçer)
- **`devreler.durum` DB'de kalıyor** — iptal akışı için gerekli, sadece UI sütunu kaldırıldı
- **devre_yeni hâlâ `devreler.yuzey_aciklama` yazmıyor** — sadece devre_duzenle yazıyor; sonraki oturumda tutarlılık için devre_yeni'ye de eklenebilir

### Önemli Öğrenmeler
1. **"4. oturumda tamamlandı" tamamlandı mı?** 4. oturumun son özeti "Faz 2 bitti" diyordu ama `aluminyum → alum` dönüşümü yapılmamış, gözden kaçmış. **Ders:** Oturum özetinde "tamamlandı" ifadesi her zaman sorgulayarak kabul et, DB doğrulaması tekrar yap.

2. **"İlk insert" sıralaması insertion-order bağımlı, kırılgan.** `Object.keys(malzemeSet)[0]` pattern'i browser'da insertion-order döner ama bu garanti değil. Çoğunluk-baz matematiksel olarak belirsizlik içermez.

3. **Generic diff framework scope'u büyütür.** İlk mockup sadece malzeme üzerineydi. Kullanıcı "devre adı, zone vb. de dahil" deyince yaklaşım "her alan için kart" generic hâle geldi. Pratikte şimdi sadece 2 alan karşılaştırılıyor ama structure 10'dan fazla alanı destekler.

4. **UX vs schema ayrımı (4. oturumun devamı).** `yuzey_aciklama` için: UI'da "Diğer" seçilince input açılması ayrı, DB'de kolonun olması ayrı. Mantıksal olarak eşlenmesi kolay ama implementation'da bile dikkat ettim — spool INSERT'te fallback pattern (`s.yuzeyAciklama || yuzeyAciklama`) devre geneli açıklamasını her spool'a miras yaptırıyor.

5. **Grace period**: `devre_duzenle.html`'de mevcut uyumsuz kombinasyon varsa form açılırken zorla değiştirmez (_formHazir flag'i). Bu UX dostu — kullanıcı "mevcut kayıt neden değişti?" diye şaşırmaz. Ama kullanıcı manuel değişiklik yaparsa kural işler.

---

## 11B. ÖNCEKİ OTURUM — 19 NİSAN 2026 (4. OTURUM)

### Bu oturumda tamamlananlar (Enum Refactor Tamamlama + DB Migration)

3. oturumda enum anti-pattern temizliği başlatılmıştı ama iki büyük boşluk kalmıştı: (1) `devreler.html` ARES_NORM'a bağlanmamıştı — kendi normalize fonksiyonu farklı kodlar üretiyordu (`karbon_celik` vs.), (2) DB'de üç farklı yazım yan yana yaşıyordu. Bu oturumda ikisi de kapatıldı.

**DB Migration ✅ (Faz 2 tamamlandı):**
- `spooller.malzeme`: `karbon_celik`, `Karbon Çelik` → `karbon` (1005 kayıt)
- `spooller.malzeme`: `bakir_alasim` → `bakir` (83 kayıt)
- `spooller.yuzey`: `Asit` → `asit` (24 kayıt)
- `spool_malzemeleri.malzeme`: aynı temizlik
- 1 epoksi test kaydı silindi
- **Sonuç:** DB'de canonical format tek başına

**Kanonik enum listesi kesinleşti (Bölüm 2.13):**
- 5 malzeme: `karbon`, `paslanmaz`, `bakir`, `alum`, `diger`
- 5 yüzey: `asit`, `galvaniz`, `siyah`, `boyali`, `diger`
- **`plastik`, `epoksi`, `ham` çıkarıldı** — operasyonda kullanılmıyor

**Kod değişiklikleri:**
- **`ares-normalize.js`** — yüzey regex temizliği, `tvYuzey` default "Boyalı" → **"Boya"**
- **`devreler.html`** (6 nokta refactor):
  - `ares-normalize.js` script tag eklendi
  - `_normalizeMalzeme`/`_normalizeYuzey` → ARES_NORM delegasyonu
  - `rebuildSelect` — alan parametresi ile lokalize option text
  - Pie chart + malzeme modal label lokalize
  - 🔴 **Kritik bug fix:** `matBadge`/`yuzeyBadge` eski kodları (`karbon_celik`, `bakir_alasim`, `aluminyum`, `plastik_pe`) karşılaştırıyordu — delegasyon sonrası `else` dalına düşecek, renk sınıfları kaybolacaktı. Yeni kodlara (`karbon`, `bakir`, `alum`, `diger`) güncellendi.
- **`kesim.html`** (7 nokta):
  - `borular` map'ine `malzemeKod` alanı
  - `populateFilters.fill` — `labelFn` parametresi
  - `applyFilters` — kod bazlı karşılaştırma
  - Arama haystack — ham değer + lokalize etiket
  - Sorting — lokalize etiket bazlı
  - `openListeModal` — homojenlik kod bazlı, önizleme lokalize
  - Excel `malzAdi` + `islem_log` aciklama — lokalize etiket

**Dil dosyaları (3) — 1340 → 1338 anahtar:**
- `cmn_malzeme_plastik` SİLİNDİ (3 dil)
- `cmn_yuzey_epoksi` SİLİNDİ (3 dil)
- TR `cmn_yuzey_boyali`: "Boyalı" → **"Boya"**

### Verilen Anahtar Kararlar

- **Çoklu dil hedefi korundu:** Yabancı çalışanlar olduğu için kod bazlı DB + dil bağımsız UI yaklaşımı sürer
- **"Paslanmaz" (yalın), "Bakır Alaşım", "Boya"** — kesin TR etiketleri
- **Admin UI ertelendi** — ihtiyaç açıkça doğana kadar overengineering (5 malzeme + 5 yüzey stabil)
- **Bakır ve alüminyum için yüzey kuralları netleşmedi** — sonraki oturuma kaldı

### Yan Bulgular (CLAUDE-SONRAKI-OTURUM'a not edildi)

- **Malzeme-yüzey uyum kuralı (YENİ — Öncelik 1):** paslanmaz + galvaniz/boya yasak olmalı, DB constraint + frontend validation
- `spool_malzemeleri.kalite='diger'` 2 kayıt — form UX sorunu
- `devre_yeni.html` yüzey radio'da "Diğer" seçeneği yok
- Excel export başlıkları hâlâ Türkçe hardcode
- Diğer HTML sayfalarında (bukum/sevkiyat/KK/raporlar) enum kullanımı taranmadı

### devre_yeni.html Canlı Test ✅

19 Nisan 17:03 testinde: Paslanmaz+Asit seçimi → DB'ye `malzeme='paslanmaz'`, `yuzey='asit'` yazıldı. 3. oturum patch'i doğru çalışıyor.

### Önemli Öğrenmeler

1. **Belge ≠ gerçeklik:** CLAUDE.md "plastik/epoksi canonical" diyordu, operasyonda yoktu. Varsayım değil **DB sorgusu** ile doğrula.

2. **DB sorgusu karar almanın en ucuz yolu:** 3 SQL (malzeme dist + yüzey dist + son kayıt tarihi) tüm varsayımları 30 dakikada çürüttü/doğruladı.

3. **"Kör nokta" testi değerli:** devre_yeni test edilmemişti — 2 dakikalık test 3 oturumluk belirsizliği kapattı.

4. **Delegasyon sırasında "switch-case bombası":** `_normalizeMalzeme`'yi ARES_NORM'a delege edince dönen değer formatı değişti, eski `matBadge` if koşulları eşleşmeyecekti. **Kural:** Delegasyon öncesi eski fonksiyonun tüm kullanım noktalarını grep'le tara.

5. **Canonical sözlük: 5+5 yeter.** "İleride olabilir" gerekçesiyle geniş tutmak tuzak — gerçek ihtiyaç doğunca ekleme ucuz.

---

## 11C. ÖNCEKİ OTURUM — 17 NİSAN 2026 (3. OTURUM)

### Bu oturumda tamamlananlar (Enum Anti-Pattern Temizliği)

- **`ares-normalize.js`** — yeni ortak modül (kök dizin). Malzeme/yüzey/durum için kod ↔ etiket dönüşümü, 3 dil bağımsız `cmn_*` anahtarlarıyla entegre
- **6 HTML sayfasında enum anti-pattern temizliği:**
  - `spool_detay.html` — `_normKey` silindi, `_malzemeGoster/_yuzeyGoster` ARES_NORM'a bağlandı
  - `kesim.html` — `matBadge` refactor + raw display wrap (1178, 1373)
  - `markalama.html` — 🔴 **BUG FIX:** `m.indexOf(tv('cmn_malzeme_alum'))` pattern'i dil değişince fail oluyordu, kod bazlı karşılaştırmaya çevrildi
  - `devre_yeni.html` — `normalizeMalzeme` artık KOD döndürüyor (DB'ye 'karbon' yazılır), radio value'lar kod'a, `_malzemeTipi` inline kopyası ARES_NORM'a bağlandı
  - `is_baslat.html` — malzeme/yüzey display wrap
  - `devre_duzenle.html` — radio value'lar kod'a + data-i18n eklendi + formDoldur ARES_NORM.malzemeKod ile legacy Türkçe veriyi doğru radio'ya map eder
- **Dil sistemi:** 1335 → 1340 anahtar. 5 yeni `cmn_*` eklendi (durum_bekliyor / devam_ediyor / tamamlandi + malzeme_diger + yuzey_diger). 3 dilde tam çeviri (TR/EN/AR)
- **ARES_NORM'a `plastik` ve `epoksi` kategorileri eklendi** — dil dosyalarında zaten vardı, senkron hale getirildi

### Yeni Kurallar

- **E-01: Enum Normalize** — malzeme/yüzey/durum değerleri ARES_NORM üzerinden gösterilir (Bölüm 2.13)
- **Script yükleme sırası güncellendi:** `store → lang → normalize → layout`

### Strateji: Hybrid Faz 1 (tamamlandı) + Faz 2 (opsiyonel)

- **Faz 1 ✅ tamamlandı:** Yazma tarafı KOD yazar, okuma tarafı hem kod hem legacy Türkçe'yi kabul eder. DB geçiş sürecini sorunsuz yaşayabilir.
- **Faz 2 (opsiyonel, sonraki oturum):** Tek seferlik SQL migration ile eski Türkçe veriler kod'a dönüşür. Detay CLAUDE-SONRAKI-OTURUM.md'de.

### Bilinen bekleyen UI sorunları

- **Dropdown filter'lar kod gösteriyor:** devreler/kesim/markalama sayfalarında malzeme/yüzey filter dropdown'larında option metinleri kod olarak görünüyor ("karbon_celik") — sonraki oturum Öncelik 1
- **Excel export i18n eksik:** kesim.html 1302 satırı + Excel başlıkları ('KULLANILACAK MALZEME' vb.) hâlâ hardcode Türkçe
- **islem_log aciklama:** Log metinlerinde kod görünür (`karbon 48.3 2000mm`) — log format'ı insan okunabilir kalmalıysa refactor

### Önemli Öğrenmeler

- **Dil dosyası tarama yöntemi:** Yeni anahtar eklenirken grep ile mevcut anahtarları kontrol et — `cmn_malzeme_plastik` ve `cmn_yuzey_epoksi` gibi kategorileri atlama riski yüksek
- **str_replace ile patch ederken** karmaşık fonksiyon bloklarını TAMAMEN kopyala — yanlışlıkla bir `+colors[cls]+` gibi parçayı atlayarak bozmak kolay (bu oturumda bir kez yaşandı, hemen düzeltildi)
- **Deploy sıralaması önemli:** Önce lang+js (risksiz), sonra HTML (yeni davranış devreye girer) — ara aşama sorunsuz

---

## 11D. ÖNCEKİ OTURUM — 17 NİSAN 2026 (2. OTURUM)

### Bu oturumda tamamlananlar (MDrawer + Tema Context)

- **`mobile/src/lib/tema.jsx`** — TemaProvider + `useTema()` hook. localStorage entegreli, `data-theme` attribute'unu otomatik set eder
- **`mobile/src/components/MDrawer.jsx`** — sağdan açılan drawer:
  - Avatar (kamera ikonu ile fotoğraf yükleme hazırlığı, `foto_url` kullanımı)
  - Kullanıcı adı (Barlow Condensed) + email + rol/tenant badge
  - Profili Düzenle satırı
  - Tema toggle switch (☀/🌙)
  - Dil dropdown (🇹🇷 TR ▼) — 3 dil seçimi, ✓ ile aktif gösterimi
  - Çıkış butonu (kırmızı ghost)
- **`mobile/src/main.jsx`** — TemaProvider root'a eklendi
- **`mobile/src/index.css`** — `[data-theme=dark]` + `[data-theme=light-anthracite]` blokları
- **Dil sistemi tamamlandı:** 61 `m_*` anahtarı üç dilde senkron (tr/en/ar)
- **MAnasayfaYonetici + MIslemler** — hamburger butonu yerine profil butonu, `<MDrawer />` entegrasyonu
- **Mockup-first iş akışı kurumsallaştı** — MDrawer için 4 iterasyon, kullanıcı onayıyla ilerlendi
- **Supabase sorgusu düzeltildi** — `ad` yerine `ad_soyad`, tenant ayrı sorgu (RLS 400 sorunu)
- **RTL uyumu** — dil dropdown `insetInlineEnd` ile Arapça modunda doğru tarafa açılıyor
- **Git push + Vercel deploy** — canlıda (arespipe-mob.vercel.app)

### Yeni Kurallar (CLAUDE-MOBILE.md)

- **R-09: Tema Yönetimi** — sadece `useTema()` ile, direct DOM manipulation YASAK
- **R-10: Mockup-First Kuralı** — yeni ekran/component yazılmadan ÖNCE artifact mockup + onay

### Önemli Öğrenmeler

- **`kullanicilar.ad` diye kolon yok** — `ad_soyad` kullanılır
- **`kullanicilar.foto_url`** DB'de mevcut (text), upload UI henüz yok
- **`tenants(ad)` JOIN RLS ile 400 verebiliyor** — tenant adını ayrı sorguyla çek
- **CSS `[data-theme=dark]` tırnak kuralı mobilde de geçerli** — tırnaksız şart
- **Mobilde dark tema tanımlı değilse toggle sadece attribute'u değiştirir, UI değişmez** — `index.css`'te her iki tema bloğunu da eklemek gerekiyor

### Bekleyen (öncelik sırası)

1. **MProfil.jsx** — avatar yükleme + kişisel bilgi düzenleme (mockup-first)
2. **MIsBaslat.jsx** — operatör iş akışı (mockup-first, eski is_baslat.html'den)
3. **MDevreler, MDevreDetay, MSpoolDetay, MQRTara** (mockup-first)
4. Rol etiketi i18n mapping düzeltmeleri
5. Supabase Storage avatar upload implementasyonu
6. Dil dosyaları (web/mobil) senkronizasyon scripti

---

## 11E. ÖNCEKİ OTURUM — 17 NİSAN 2026 (1. OTURUM)

### Tamamlananlar
- **i18n altyapısı kuruldu:** `mobile/src/lib/i18n.jsx` (I18nProvider + useT), `mobile/src/lang/` (tr/en/ar)
- **MGiris.jsx** güncellendi — tüm metinler tv() üzerinden
- **Yetki DB düzenlemesi:**
  - Markalama, Malzeme, Sevkiyat, Raporlar, Kullanıcı Yönetimi, Tanımlar kendi gruplarına çıkarıldı
  - "Kaynak" bloğu "Argon Kaynağı" olarak yeniden adlandırıldı
  - Yeni "Gazaltı Kaynağı" bloğu eklendi
  - Her iki yeni bloğun `blok_sayfa_yetkileri` kayıtları mevcut Kaynak'ınkiyle aynı
- **Yetki mimarisi rafine edildi:** Grup = Buton, Blok = Teknik yetki varyantı
- **mobile/src/lib/yetki.js:** getKullaniciBloklari, getKullaniciGruplari, getGizliBolumler, sayfaErisimiVar, yoneticiMi
- **mobile/src/lib/gruplar.js:** Grup → ikon/renk/hedef/i18n haritası
- **MAnasayfa.jsx** router'a dönüştürüldü (role göre yönlendirir)
- **MAnasayfaYonetici.jsx** oluşturuldu (eski dashboard + İşlem Başlat butonu)
- **MIslemler.jsx** oluşturuldu (grup bazlı büyük butonlar, blokları dinamik çeker)
- **Supabase auth sorunu çözüldü:** `auth.users` tablosundaki NULL token kolonları boş string'e güncellendi
- **Supabase anon key değiştirildi:** JWT formatı (eyJ...) kullanılıyor
- **App.jsx güncellendi:** /islemler route'u + I18nProvider
- **Git push + Vercel deploy:** Hem web (arespipe.vercel.app) hem mobil (arespipe-mob.vercel.app) canlıda
- **End-to-end test edildi:**
  - Yönetici girişi → Dashboard + İşlem Başlat butonu ✅
  - Operatör girişi → Direkt İşlemler ekranı ✅
  - 6 buton (İmalat, Kesim, Markalama, Argon, Gazaltı, QR) ✅

### Önemli Öğrenmeler
- **RLS ve tenant_id:** `kullanici_bloklar`'a INSERT yaparken tenant_id belirtmek zorunlu, NULL bırakılırsa RLS filtreler ve blok görünmez
- **Sistem preset koruması:** `yetki_bloklari`'nda silme trigger'ı var — sistem presetleri silmek için bypass gerekir (veya yeniden adlandırma kullanılır)
- **Supabase publishable key ≠ anon key:** Publishable key auth için yeterli değil, tam erişim için JWT anon key gerekir
- **auth.users NULL kolonları:** Eski kullanıcıların confirmation_token vs. NULL kalabilir, güncel GoTrue bunu kabul etmez
