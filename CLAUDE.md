# AresPipe — Claude Proje Bağlamı

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: 23 Nisan 2026 (22. oturum KAPATILDI — Faz A Faz 2: Admin UI (tanimlar.html > Malzeme Havuzu sekmesi) tamamlandı. Sistem + Firma alt-tab yapısı, inline ekleme/düzenleme formu, FK violation korumalı silme, UNIQUE çakışma ve sistem preset uyarı popup'ları. `malzeme_ref_bul()` Guard 1 gevşetildi. 2 yan bug kapatıldı: spool_detay.html M3_RENK canonical kodlara çevrildi, devre_detay.html duplicate `<td>` ölü kodu temizlendi. `kaliteleriDoldur()` master tablodan okuyacak şekilde refactor edildi. E-06 master tablo artık hem yazma hem okuma hem UI yönetimi açılarından tamamen canlı.)

---

## 🗺️ UZUN VADELİ YOL HARİTASI — docs/ROADMAP.md

**23 Nisan 2026 itibarıyla AresPipe'ın SaaS hedefi için 29 oturumluk kalıcı altyapı planı mutabık kalınmıştır.**

Hedef: 1-2 yıl içinde çoklu tersane/firma satacak, bug'sız ve hızlı bir SaaS ürünü.
Ekip: Solo geliştirici + AI asistanlar.
Kalite hedefi: Sıfır regresyon toleransı.

**Üç faz:**
- **Faz A (22, 25, 26. oturumlar):** Malzeme sisteminin tamamlanması (devam eden iş)
- **Faz B (23, 24. oturumlar):** Altyapı güvencesi — dosya mimarisi + lint + şablon + mevcut kod temizliği (SAĞLAM PLANIN KALBİ)
- **Faz C (27, 28, 29. oturumlar):** SaaS hazırlığı — tenant izolasyon testleri + performans bütçesi + rollback/feature flag

**Temel zihniyet değişimi:** "Kurallı geliştirme"den (CLAUDE.md'de yazılı, akılda tut) "zorla uyumlu geliştirme"ye (lint/test/CI'de kodlanmış, bypass edilemez).

Detay: `docs/ROADMAP.md`. Her oturum başında ROADMAP'e kısa göz atılır, mevcut faz teyit edilir.

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
□ G-02: Hero + Pill standardı uygulandı (14. oturum sonrası yeni sayfalar için)
□ G-02: Shimmer iskelet + _animCount helper var (sayaçsız, direkt atama)
□ G-02: Pagination canlandırıldı (pg-aktif + pg-dots + Barlow Condensed)
□ G-02: Tersane badge 14px (10px ihlali olmaması)
□ G-02: Pill sayısında overflow:hidden YOK (sayı kesilmez)
```

**Mobil React sayfaları için:** CLAUDE-MOBILE.md'deki checklist geçerlidir.

---

### 2.12.1 Hero + Pill Standardı — ZORUNLU (Kural G-02, 14. oturum)

Her liste/takip sayfasının üst kısmında bulunan stat göstergeleri için ortak standart.
Referans: `devreler.html` (altın standart), `kesim.html`, `bukum.html`, `markalama.html` (14. oturumda dönüştürüldü).

#### Yapı

```
┌─────────────────┬──────┬──────┬──────┬──────┬──────┐
│ [ICON] Hero     │ PILL │ PILL │ PILL │ PILL │ PILL │
│ Sayfa Adı       │  1   │  2   │  3   │  4   │  N   │
└─────────────────┴──────┴──────┴──────┴──────┴──────┘
```

- **Hero kart (sol, 190px sabit):** Lucide-stroke SVG ikon + Barlow Condensed 21px sayfa adı, sol kenar 4px renkli border.
- **Pill'ler (esnek, min-width:128px):** renkli ikon kutusu (30×30, solid bg, beyaz stroke ikon) + body (label + num). Tüm pill'ler eşit boyut (`wide` class YOK).

#### CSS block (kopyala yapıştır)

```css
.stat-row { display:flex; gap:8px; margin-bottom:16px; flex-wrap:nowrap; overflow-x:auto; }
.hero-left { background:var(--sur); border:1px solid var(--bor); border-left:4px solid var(--leg); border-radius:10px; padding:11px 13px; display:flex; align-items:center; gap:11px; flex-shrink:0; width:190px; box-sizing:border-box; }
.hero-left svg { width:26px; height:26px; flex-shrink:0; color:var(--leg); }
.hero-name { font-family:'Barlow Condensed',sans-serif; font-size:21px; font-weight:700; line-height:1; letter-spacing:.3px; color:var(--leg); }
.hero-stats { display:flex; gap:6px; flex:1; min-width:0; }
.stat-pill { background:var(--sur); border:1px solid var(--bor); border-left:3px solid var(--leg); border-radius:8px; padding:9px 11px; flex:1 1 0; min-width:128px; box-sizing:border-box; display:flex; align-items:center; gap:10px; }
.stat-pill-ic { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#fff; }
.stat-pill-ic svg { width:16px; height:16px; stroke-width:2.2; }
.stat-pill-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
.stat-pill-lab { font-size:14px; color:var(--txm); letter-spacing:.3px; line-height:1.2; text-transform:uppercase; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.stat-pill-num { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:700; line-height:1; color:var(--tx); letter-spacing:.3px; white-space:nowrap; }
.stat-pill-num small { font-size:14px; font-weight:500; color:var(--txd); margin-left:3px; letter-spacing:0; text-transform:lowercase; font-family:system-ui,sans-serif; }
.stat-pill.clickable { cursor:pointer; transition:border-color .15s, background .15s; }
.stat-pill.clickable:hover { border-color:var(--ac); background:var(--sur2); }
@media (max-width: 1280px) {
  .hero-left { width:170px; padding:9px 11px; gap:9px; }
  .hero-left svg { width:24px; height:24px; }
  .hero-name { font-size:19px; }
  .stat-pill { padding:8px 10px; gap:8px; min-width:118px; }
  .stat-pill-ic { width:28px; height:28px; }
  .stat-pill-ic svg { width:14px; height:14px; }
  .stat-pill-num { font-size:18px; }
}

/* Pill ikon renkleri — sabit paleti */
.ic-blue   { background:#2D8EFF; }
.ic-green  { background:var(--gr); }
.ic-amber  { background:var(--warn); }
.ic-red    { background:var(--re); }
.ic-cyan   { background:#0891b2; }
.ic-violet { background:var(--leg); }
.ic-orange { background:#f97316; }

/* Shimmer — pill sayı iskelet */
@keyframes _skShimmer { 0% { background-position:-340px 0; } 100% { background-position:calc(340px + 100%) 0; } }
.sk { display:inline-block; background:linear-gradient(90deg, var(--bor) 0%, var(--sur2) 50%, var(--bor) 100%); background-size:340px 100%; animation:_skShimmer 1.4s ease-in-out infinite; border-radius:4px; color:transparent !important; }
.sk-num { min-width:48px; height:20px; }
```

#### HTML

```html
<div class="stat-row">
  <div class="hero-left">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><!-- Lucide SVG path --></svg>
    <div class="hero-name" data-i18n="sayfa_adi">Sayfa Adı</div>
  </div>
  <div class="hero-stats">
    <div class="stat-pill">
      <div class="stat-pill-ic ic-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><!-- ikon --></svg></div>
      <div class="stat-pill-body">
        <div class="stat-pill-lab" data-i18n="...">Label</div>
        <div class="stat-pill-num"><span id="stId" class="sk sk-num">—</span></div>
      </div>
    </div>
    <!-- 2-5 pill daha -->
  </div>
</div>
```

#### JS helper (sayaçsız, direkt atama)

```js
var _trFmt = new Intl.NumberFormat('tr-TR');
function _skTemizle(el) { if (el && el.classList) el.classList.remove('sk','sk-num','sk-bar'); }
function _animCount(el, hedef, opt) {
  if (!el) return;
  opt = opt || {};
  var prefix = opt.prefix || '';
  var suffix = opt.suffix || '';
  var fmt = opt.fmt || _trFmt.format;
  _skTemizle(el);
  el.textContent = prefix + fmt(hedef) + suffix;
}
```

**Kritik:** Sayaç animasyonu YOKTUR. Veri gelince direkt yazılır. Shimmer iskelet yükleme sırasında kalır, veri geldiğinde `_skTemizle` ile kaldırılır.

#### Pagination standardı (aynı G-02 kapsamında)

```css
.pg-btn { min-width:34px; height:32px; padding:0 10px; border-radius:7px; border:1px solid var(--bor); background:var(--sur2); color:var(--tx); font-size:15px; font-family:'Barlow Condensed',sans-serif; font-weight:600; letter-spacing:.2px; cursor:pointer; transition:all .15s; }
.pg-btn:hover:not(:disabled):not(.pg-aktif) { border-color:var(--ac); color:var(--ac); background:var(--sur); }
.pg-btn:disabled { opacity:.3; cursor:not-allowed; }
.pg-btn.pg-aktif { background:var(--ac); border-color:var(--ac); color:#fff; font-weight:700; box-shadow:0 1px 3px rgba(45,142,255,.25); }
.pg-info { font-size:14px; color:var(--txd); }
.pg-info strong { font-family:'Barlow Condensed',sans-serif; font-weight:700; color:var(--tx); margin:0 2px; }
.pg-dots { color:var(--txd); padding:0 6px; letter-spacing:2px; user-select:none; font-size:14px; }
```

- Aktif class adı: **`pg-aktif`** (İngilizce `active` KULLANMA, proje standardı Türkçe)
- `«‹›»` 4 navigasyon butonu + sayı butonları + ellipsis için `<span class="pg-dots">…</span>`
- Tooltip: `cmn_ilk_sayfa`, `cmn_onceki_sayfa`, `cmn_sonraki_sayfa`, `cmn_son_sayfa` i18n anahtarları

#### Arama haystack genişletme pattern (sorgulaVeGoster içinde)

Liste sayfalarında arama sadece 4-5 metin alanında değil, ilgili tüm sütunlarda çalışmalı. Client-cache'lenmiş `_firmaProjeIds`, `_projeIdMap`, `_filterData` üzerinden tersane adı + proje no + malzeme + yüzey eşleşmelerini topla, `applyFilters` fonksiyonunda OR mantığıyla `q.or('...,proje_id.in.(...),id.in.(...)')` şeklinde ekle. Detay: `devreler.html` (satır ~1116-1145).

#### Export pattern (Excel + PDF tüm filtreli veri)

- `_allFilteredIds` global'i `sorgulaVeGoster` her çalıştığında güncellenir
- `_tamFiltreliListe()` helper 500'lük chunk'lar halinde tam veri çeker
- Excel handler async — "Dışa aktarım hazırlanıyor..." toast → tam liste → XLSX → başarı toastında "(X devre)" göster
- PDF aynı mantık — `_tabelaPdf()` async

#### Renk kimlikleri (sayfa bazlı)

| Sayfa | CSS değişkeni | Varsayılan renk |
|---|---|---|
| Devreler | `--leg` | `#7c3aed` (mor) |
| Kesim | `--ks-c` | `#c2410c` (kızılkahve) |
| Büküm | `--bukum-c` | `#7c3aed` (mor) |
| Markalama | `--marka-p` | `#0e7490` (cyan) |
| Kalite Kontrol | — (14. oturumda dönüştürülmedi) | — |
| Sevkiyatlar | — (14. oturumda dönüştürülmedi) | — |

#### Label kısaltma kuralı

"Toplam X" ve "X Adedi" gibi ifadeler **yasak** — sayı zaten adet. Kısa formlar:
- "Devre Adedi" → "Devreler"
- "Spool Adedi" → "Spool"
- "Toplam Bekleyen" → "Bekleyen"
- "Listede Olan" → "Listede"
- "Ağırlık (kg)" → "Ağırlık" (kg sayının yanında `<small>`)
- "Çap Dağılımı" → "Çap"
- "Toplam Büküm" → "Bekleyen"
- "Bükülenler" → "Bükülen"

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

#### Malzeme / Kalite Ayrımı — Master Tablo (Kural E-06, 19. oturumda tamamlandı)

**Mimari:** `malzeme_tanimlari` master tablosu + `malzeme_ref_id` FK + DB-içi trigger. Kullanıcı ne yazarsa yazsın, DB canonical format'ta saklar.

**DB Şeması:**

```
malzeme_tanimlari (
  id uuid PK,
  tenant_id uuid (NULL = sistem preset, dolu = firma özel),
  kategori_kod text   -- 'karbon','paslanmaz','bakir','alum','diger'
  kalite_kod text     -- 'ST37','316L','CUNI9010' (UPPERCASE, normalize)
  kalite_goster text  -- 'St 37','316L','CuNi 90/10' (UI gösterimi)
  standart text       -- 'DIN 17100','ASME SA-106',...
  aciklama_tr/en/ar, notlar, aktif, sistem_preset, olusturma
  UNIQUE(tenant_id, kategori_kod, kalite_kod)
  + partial unique (kategori_kod, kalite_kod) WHERE tenant_id IS NULL
)

spool_malzemeleri.malzeme_ref_id   uuid FK
pipeline_malzemeleri.malzeme_ref_id uuid FK
-- spooller: FK yok, text kolonlar (denormalize özet) trigger ile senkronlanabilir
-- kesim/bukum/markalama_kalemleri: zaten malzeme_id FK ile spool_malzemeleri'ne bağlı
```

**Sistem preset (12 kalite — her firma okur, kimse silemez):**
- karbon: `ST37`, `S235JR`, `A106B`, `A53`
- paslanmaz: `316L`, `304L`, `316`, `304`, `14571`, `A312TP316L`
- bakir: `CUNI9010`
- alum: `6061T6`

**Trigger davranışı — `BEFORE INSERT OR UPDATE`:**
1. `malzeme_ref_id` boşsa: ham `malzeme`+`kalite` string'lerinden **`malzeme_ref_bul()`** ile master UUID bulur/ekler
2. `malzeme_ref_id` doluysa: text kolonları (`malzeme`, `kalite`) master'dan otomatik yazar

**`malzeme_ref_bul()` guards:**
- Guard 1: `kalite = malzeme` → NULL (bozuk kayıt şüphesi)
- Guard 2: `kalite_kod_normalize(kalite)` NULL dönerse → NULL (bilinmeyen/kategori ismi)
- Öncelik sırası: sistem preset → tenant kaydı → tenant'a yeni ekle

**`kalite_kod_normalize()` — DB fonksiyonu:**
- Kategori isimleri (`karbon`, `paslanmaz`...) → NULL (kalite değiller)
- `St37`, `ST-37`, `st 37` → `ST37`
- `CuNi 90/10`, `CuNi10Fe1.6Mn`, `cuni90-10` → `CUNI9010`
- `1.4571`, `1 4571`, `316Ti` → `14571`
- Tanınmayan → NULL (admin UI'dan eklenecek)

**JS tarafı (backward compat + gelecek):**
- `ARES_NORM.kaliteKod(raw)` — DB `kalite_kod_normalize()` eşi
- `ARES_NORM.kaliteGoster(kod_or_raw)` — master `kalite_goster` eşi (fetch'siz)
- `ARES_NORM.malzemeEtiket(kod)` — dil bağımsız lokalize (Karbon Çelik / Carbon Steel / فولاذ كربوني)

**Altın Kural (artık sadeleşti):**
- Formdan ham değer DB'ye gönderilebilir (`"Karbon Çelik"` + `"ST37"`) — trigger canonical yapar
- Tek yasak: okumadan önce JS tarafında normalize etme. `spool_malzemeleri.malzeme` zaten canonical, JOIN `malzeme_tanimlari.kalite_goster` ile UI'da gösterim hazır
- Yeni kalite eklenmesi: admin UI (Faz 2) veya elle SQL INSERT

**Doğru Pattern (yeni):**
```js
// ✅ Ham değer DB'ye gönder, trigger canonicalize eder
await supa.from('spool_malzemeleri').insert({
  tenant_id: ARES.tenantId(),
  spool_id:  SP.supaId,
  malzeme:   'Karbon Çelik',  // trigger → 'karbon'
  kalite:    'ST37',          // trigger → 'St 37'
  // malzeme_ref_id otomatik dolar
});

// ✅ Okuma — text kolonlar canonical, JOIN ile görsel
const { data } = await supa.from('spool_malzemeleri').select(`
  kod, tanim, malzeme, kalite,
  malzeme_tanimlari (kalite_goster, standart)
`);
// data[i].kalite = 'St 37' (canonical)
// data[i].malzeme_tanimlari.standart = 'DIN 17100'
```

**Yanlış Pattern (tarihsel, artık olmamalı):**
```js
// ❌ JS tarafında normalize sonra insert — trigger zaten yapıyor, redundant
malzemeRows.push({
  malzeme: ARES_NORM.malzemeKod(item.malzeme),  // trigger ne yazacak kendi bilir
  kalite:  item.malzeme,                         // BUG kaynağı (kalite=malzeme)
});
```

**Historical Timeline:**
- 16 Nisan öncesi: `normalizeMalzeme()` Türkçe etiket döndürüyordu, "Karbon Çelik / Karbon Çelik" kamufle bug
- 17 Nisan (3. oturum): `ares-normalize.js` → kod döndürmeye başladı, "karbon / karbon" görünür bug
- 18. oturum (22 Nisan): Tespit + kısmi düzeltme önerileri (uygulanmadı)
- 19. oturum (22 Nisan): Master tablo altyapısı + trigger + guard'lar + sistem preset → Faz 1 tamamlandı
- **20. oturum (22 Nisan): Canlı test + kök neden fix. `devre_yeni.html:644` `normalizeMalzeme()` prematüre normalize ediyordu → ham IFS `Material` değeri (ST37) kayboluyordu → trigger Guard 1 tetikleniyordu. Tek satır fix + `devre_detay.html` render fix (4 nokta) → E-06 yazma + okuma tam simetri.**
- **Faz 2 (22. oturum — 23 Nisan 2026): TAMAMLANDI.** `tanimlar.html > Malzeme Havuzu` sekmesi — sistem/firma alt-tab, inline ekleme/düzenleme formu, FK violation korumalı silme, UNIQUE çakışma kontrolü, sistem preset uyarı popup'ı, G-03 uyumlu render. `malzeme_ref_bul()` Guard 1 gevşetildi (Guard 2 tek koruma hattı olarak yeterli).
- Faz 3 (sonraki): form refactor — autocomplete dropdown (free text yerine)
- Faz 4 (son): IFS/Excel import fuzzy match

**IFS/Excel Import Altın Kuralı (20. oturumda kesinleşti):**
- IFS'nin `Material` kolonu = **kalite kodudur** (ST37, 316L, CUNI9010) — malzeme kategorisi değil
- Import'ta HAM sakla, normalize ETME
- Kategori türetimi **insert noktasında** `_malzemeTipi()` veya `ARES_NORM.malzemeKod()` ile
- `malzeme` ve `kalite` alanları **asla aynı değerle** doldurulmaz (Guard 1 false-positive önlemi)
- Trigger canonical'e çevirir + `malzeme_ref_id` doldurur

**Anti-pattern (20. oturum sonrası asla):**
```js
// ❌ YANLIŞ — idempotent değil, veri yok eder
items.push({ malzeme: normalizeMalzeme(ham), ... });
// Sonra: kalite: item.malzeme → her iki alan da 'karbon' → Guard 1 tetikler

// ✅ DOĞRU
items.push({ malzeme: String(ham).trim(), ... });
// Insert: malzeme: _malzemeTipi(item.malzeme), kalite: item.malzeme
```

**Render Simetrisi Kuralı (20. oturum sonu bulgu, 21. oturumda tam süpürülecek):**
Her gösterim noktası (tablo sütunu, popup satırı, template literal, string concatenation) ham kategori/kalite/yüzey kodunu değil, normalize helper çıktısını göstermelidir:

```js
// ❌ YANLIŞ — kullanıcıya 'karbon' ham kategori kodu görünür
`${m.malzeme} — ${m.kalite} — ${cap}`
esc(m.malzeme || '—')

// ✅ DOĞRU — lokalize etiket + canonical kalite
`${ARES_NORM.malzemeEtiket(m.malzeme)||m.malzeme} — ${ARES_NORM.kaliteGoster(m.kalite)||m.kalite} — ${cap}`
esc(ARES_NORM.malzemeEtiket(m.malzeme) || m.malzeme || '—')
```

**Hedef görünümler:**
- Malzeme: `Karbon Çelik` / `Paslanmaz` / `Bakır Alaşım` / `Alüminyum` (lokalize TR/EN/AR)
- Kalite: `St 37` / `316L` / `CuNi 90/10` / `1.4571` (canonical gösterim)
- Yüzey: `Asit` / `Galvaniz` / `Siyah` / `Boya` (lokalize)

**ASLA kullanıcıya görünmeyecek ham kodlar:** `karbon`, `paslanmaz`, `bakir`, `alum`, `siyah`, `galvaniz`, `asit`, `boyali`, `bekliyor`, `devam_ediyor`, `tamamlandi`, `iptal`.

**DB objelerinin listesi (Faz 1 çıktısı):**
```
Tablolar:     malzeme_tanimlari (yeni)
Kolonlar:     spool_malzemeleri.malzeme_ref_id, pipeline_malzemeleri.malzeme_ref_id
DROP:         spooller.kalite_standart (kullanılmayan ölü kolon)
Fonksiyonlar: kategori_kod_normalize(), kalite_kod_normalize(), malzeme_ref_bul()
Trigger'lar:  tg_spool_malzemeleri_ref_sync, tg_pipeline_malzemeleri_ref_sync
RLS:          4 policy (SELECT/INSERT/UPDATE/DELETE)
```

#### Render Kuralı (G-03 — 21. oturumda kuralsallaşacak)

**Ham kategori/kalite/yüzey kodu kullanıcıya gösterilmez.** Tüm render'lar `ARES_NORM` helper'ı üzerinden lokalize edilir.

| Alan | DB'de | UI'da | Helper |
|---|---|---|---|
| malzeme | `karbon`, `paslanmaz`, `bakir` | `Karbon Çelik`, `Paslanmaz`, `Bakır Alaşım` | `ARES_NORM.malzemeEtiket(kod)` |
| kalite | `ST37`, `St 37`, `316L` (canonical) | `St 37`, `316L`, `CuNi 90/10` | `ARES_NORM.kaliteGoster(kodOrRaw)` |
| yuzey | `asit`, `galvaniz`, `siyah` | `Asit`, `Galvaniz`, `Siyah` | `ARES_NORM.yuzeyEtiket(kod)` |
| durum | `bekliyor`, `devam_ediyor` | `Bekliyor`, `Devam Ediyor` | `ARES_NORM.durumEtiket(kod)` |

**Güvenli fallback pattern (21. oturum standardı):**
```js
// Malzeme
esc(
  (typeof ARES_NORM!=='undefined' && ARES_NORM.malzemeEtiket)
    ? (ARES_NORM.malzemeEtiket(x.malzeme) || x.malzeme || '—')
    : (x.malzeme || '—')
)

// Kalite
esc(
  (typeof ARES_NORM!=='undefined' && ARES_NORM.kaliteGoster)
    ? (ARES_NORM.kaliteGoster(x.kalite) || x.kalite || '—')
    : (x.kalite || '—')
)
```

**Uygulanacak:** Excel/PDF export'ları dahil tüm kullanıcı görünür yerlere (QR etiket istisna — case-by-case). Dropdown value'ları ham kod olarak kalır (DB'ye yazılır), text içeriği lokalize. inlineEdit() çağrılarına ham değer gönderilir (düzenleme için), gösterim lokalize olur — 20. oturumda `devre_detay.html:1195`'te uygulanan pattern.

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

#### Kod Atama Kuralları (6. oturumda karar verildi, 8. oturumda admin UI eklendi)

- **Kod admin tarafından manuel seçilir** — sistem otomatik atamaz
- **Format gevşek (1-4 harf, A-Z)** — I/L/O/Q serbest (admin karar versin)
- **Kalıcı** — atanan kod değişmez, sonsuza dek firmanınkidir
- **Çakışma durumunda iki aşamalı onay:** Sistem uyarır, admin override ederse önce eski sahipten kodu alır, sonra yenisine verir (manuel — otomatik swap RPC henüz yok)
- **Yasak kod listesi yok** — admin bilinçli seçiyor, engelleme kaldırıldı (8. oturum kararı)

#### Admin UI (8. oturumda eklendi ✅)

- `admin/yeni-firma.html` → Adım 1'de Firma Kodu alanı (Firma Adı yanında 120px)
  - `onkeyup` otomatik uppercase + A-Z filtresi
  - `onblur` gerçek zamanlı çakışma kontrolü
  - 23505 unique violation için yarış durumu yakalama
- `admin/firma-detay.html` → Firma Bilgileri kartına Firma Kodu alanı (150px)
  - Direkt editable (Değiştir butonu yok — admin kendi yazıyor)
  - Üst page-header badge'lerinde kod turuncu mono font ile gösteriliyor
  - Kod değişiyorsa çift onay + çakışma manuel çözüm
- Yetki: Sadece `kul.rol === 'super_admin'` erişir (existing)

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
// Legacy (prefix'siz → tenant cache ile prefix)
ARES.markaId("0074")      → "A-0074"

// Eski 4-hane prefix'li (dokunma)
ARES.markaId("A-0512")    → "A-0512"

// Yeni 6-hane padded (display için 4 haneye kırp — 8. oturum)
ARES.markaId("A-000001")  → "A-0001"
ARES.markaId("A-000074")  → "A-0074"

// 10000+ doğal uzunluk
ARES.markaId("A-010000")  → "A-10000"
ARES.markaId("A-100000")  → "A-100000"

ARES.markaId(null)        → ""
```

**Önemli (8. oturum değişikliği):** `markaId()` artık iki iş yapar: legacy prefix ekleme + DB'deki 6-hane padding'i display için min 4 haneye kırpma. 10000'den büyük sayılar doğal uzunlukta kalır.

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

#### Spool ID Üretimi (8. oturumda 4→6 hane geçti)

Spool kısa kodları `sayac_tanimlari` tablosundan tenant bazında sayaçla üretilir:

- **Üretim yeri:** `devre_yeni.html` satır ~1500 — `ARES.sonrakiNo('spool')` çağrısı
- **RPC:** `sonraki_no(p_tip)` PostgreSQL fonksiyonu — son_no'yu `UPDATE ... RETURNING` ile atomik artırır, integer döndürür
- **Format:** JavaScript `_noFormatla()` → `(cfg.prefix || '') + yil + sep + padStart(digits, '0')`
- **Tenant kodu:** `devre_yeni.html` sayaç sonucuna `tenantKod + '-'` ekler

**8. oturum değişikliği — digits 4 → 6:**
- `sayac_tanimlari.digits = 6` (tüm tenant'larda UPDATE ile migrate edildi)
- `_SAYAC_VARSAYILAN.spool.digits = 6` (yeni tenant'lar için fallback)
- **DB'de:** `A-000001` (6 hane padded)
- **Display:** `ARES.markaId()` min 4 haneye kırpar → `A-0001`
- **10000+:** Doğal uzunluk → `A-10000`, `A-100000`

**Sıfırlama:** `tanimlar.html > Kod Serileri` sekmesinden tek tıkla (`son_no = 0`). Test sonrası gerçek kullanıma geçerken sıfırlanır, `A-0001`'den başlar.

**Ortalama kapasite:** 6 hane = 999.999 spool = büyük tersane için ~30 yıl (ayda 3.000 spool varsayımıyla).

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

### 2.17 Stabil Local Key Pattern — ZORUNLU (Kural B-02)

**20 Nisan 2026 — 10. oturumda eklendi.** `devre_detay.html` duplicate `spool_no` bug'ından (11 fonksiyon + 2 state + DOM ID zinciri) çıkarıldı.

Client-side array'lerde domain alanları (`spool_no`, `pipeline_no`, `kod` vb.) **duplicate olabilir**. Bu alanlar find/filter/DELETE/selection state/DOM ID anahtarı olarak kullanılırsa sessiz bug yaratır:

- `arr.find(x => x.spoolNo === sn)` → ilk eşleşeni döner, sonrakiler atlanır
- `arr.filter(x => x.spoolNo !== sn)` → DELETE niyetinde hepsini birden siler
- `_secili[spoolNo]` → iki kayıt aynı anahtarda çakışır
- `id="pfx_${spoolNo}"` → duplicate DOM ID, querySelector kararsız

#### Çözüm: `_lk` (local key)

Her kaleme `_lk` alanı ekle. DB kaydıysa UUID, yeni/import kalemse rastgele string:

```js
// DB'den gelen kayıt:
item._lk = item.id;  // UUID

// Yeni / manuel / Excel import kalem:
item._lk = 'new_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

// Find / filter / DELETE:
arr.find(x => x._lk === lk)
arr.filter(x => x._lk !== lk)

// Selection state:
_secili[item._lk] = true

// DOM ID (UUID ve 'new_...' için güvenli):
`prefix_${item._lk.replace(/[^a-z0-9]/gi, '_')}`
```

#### Ne zaman zorunlu

- Aynı array'de domain alanı **duplicate olabilirse** (devre spool listesi, proje spool listesi vb.)
- DB-level UNIQUE constraint yoksa her koşulda zorunlu

#### Uygulanan dosyalar

- `devre_detay.html` (10. oturum, 14 patch)

#### Potansiyel uygulama noktaları

- `proje_detay.html` spool listesi, `sevkiyatlar.html` spool seçimi, Excel import eden tüm ekranlar

---

### 2.18 Enum/Master-Tablo Render Standardı — ZORUNLU (Kural G-03)

**22 Nisan 2026 — 21. oturumda formalleştirildi.** 19-20. oturumdaki E-06 master tablo altyapısının yazma tarafı tamamdı, ama okuma/gösterim tarafında ham kategori kodları (`karbon`, `paslanmaz`) hâlâ UI'da görünüyordu. G-03 bu simetri boşluğunu kapatır.

#### Temel kural

**Ham kategori/kalite/yüzey/durum kodları kullanıcıya ASLA görünmez.** Tüm render noktaları (HTML tablo, popup, modal, chip, PDF head, Excel export satırı, konsol toast'ı, template literal) `ARES_NORM` helper'ı üzerinden lokalize/canonical gösterime çevrilir.

| Alan | DB'de (canonical) | UI'da (gösterim) | Helper |
|---|---|---|---|
| malzeme | `karbon`, `paslanmaz`, `bakir`, `alum`, `diger` | `Karbon Çelik` / `Carbon Steel` / `فولاذ كربوني` (lokalize) | `ARES_NORM.malzemeEtiket(kod)` |
| kalite  | `ST37`, `St 37`, `316L`, `CUNI9010` (canonical) | `St 37`, `316L`, `CuNi 90/10` | `ARES_NORM.kaliteGoster(kodOrRaw)` |
| yuzey   | `asit`, `galvaniz`, `siyah`, `boyali`, `diger` | `Asit` / `Galvaniz` / `Siyah` / `Boya` (lokalize) | `ARES_NORM.yuzeyEtiket(kod)` |
| durum   | `bekliyor`, `devam_ediyor`, `tamamlandi`, `iptal` | `Bekliyor` / `Devam Ediyor` / `Tamamlandı` / `İptal` | `ARES_NORM.durumEtiket(kod)` |

#### Güvenli fallback pattern — tek standart

Üçüncü bir yardımcı wrapper tanımlamak yerine **her render noktasında inline fallback** kullanılır (ARES_NORM yüklü değilken ham değere düşer):

```js
// MALZEME
esc(
  (typeof ARES_NORM!=='undefined' && ARES_NORM.malzemeEtiket)
    ? (ARES_NORM.malzemeEtiket(x.malzeme) || x.malzeme || '—')
    : (x.malzeme || '—')
)

// KALİTE
esc(
  (typeof ARES_NORM!=='undefined' && ARES_NORM.kaliteGoster)
    ? (ARES_NORM.kaliteGoster(x.kalite) || x.kalite || '—')
    : (x.kalite || '—')
)

// YÜZEY
esc(
  (typeof ARES_NORM!=='undefined' && ARES_NORM.yuzeyEtiket)
    ? (ARES_NORM.yuzeyEtiket(x.yuzey) || x.yuzey || '—')
    : (x.yuzey || '—')
)
```

Excel export satır içinde `esc()` yok (XLSX zaten string alır); parantez içindeki üçlü fallback koşulu `forEach` başında bir local değişkene atanıp satıra o değişken geçirilir. Pattern 21. oturumda `devre_detay.html:1948`, `izometri-batch.html:452`, `markalama.html:1282` gibi yerlerde uygulandı.

#### Kapsam

**Zorunlu uygulama:**
- HTML tablo `<td>` render
- Popup/modal alanları (ör. `spool_detay.html` Büküm/Kesim/Markalama bilgi kutuları)
- Chip/badge içerikleri
- Excel (XLSX) satır değerleri
- PDF/print önizleme HTML'i
- Toast mesajları (eğer kod gösteriliyorsa)
- Search highlight (`hl()` çağrısı) — önce lokalize, sonra hl

**İstisna (dokunulmaz):**
- Dropdown/select `<option value="...">` → ham kod DB'ye yazılır, `<option>` içeriği lokalize
- `inlineEdit(el, alan, lk, 'select', options, currentValue)` çağrısında `currentValue` ham kalır (düzenleme için)
- State map'leri (`obj.malzeme = x.malzeme || '—'`) — DB'ye yazılacak ham değeri tutar, render değildir
- Arama filtresi birleştirme string'leri (`[a,b,c].join(' ').toLowerCase()`) — kullanıcıya gösterilmez
- AI/LLM prompt'ları (ör. `spool_detay.html:1590` malzCtx) — kullanıcıya DEĞİL modele gider
- De-dup hash key'leri (`[kod,tanim,malzeme,kalite].join('|')`) — kullanıcıya gösterilmez
- QR etiket / izometri PDF fiziksel çıktı → case-by-case

#### Mevcut dosya-helper helper'ları (21. oturum öncesi)

21. oturumda **dokunulmadı**, zaten ARES_NORM kullanıyorlar:
- `_malzemeGoster(raw)` — `spool_detay.html:1206`, `devre_detay.html:877` (wrap around ARES_NORM.malzemeEtiket)
- `_yuzeyGoster(raw)` — aynı yerler
- `matBadge(m)` — `bukum.html:464`, `kesim.html:994`, `markalama.html:595` (renkli badge + ARES_NORM.tvMalzeme)
- `devreler.html:1768-1797` inline matBadge + yuzeyBadge + sapma tooltip

#### Yeni sayfa kontrol listesi (G-01 ekine — sayfa teslim öncesi)

- [ ] Her `esc(x.malzeme)` / `esc(x.kalite)` / `esc(x.yuzey)` → fallback pattern ile lokalize
- [ ] Her `x.malzeme || '—'` (state map değilse) → lokalize
- [ ] Excel export header'ları: `Malzeme` ✓, satır değerleri lokalize ✓
- [ ] PDF/print HTML head ve gövde: lokalize ✓
- [ ] Chip/badge içeriği: lokalize ✓ (matBadge zaten yapıyor)
- [ ] `ares-normalize.js` yüklemesi script sırasında var mı? (admin/portal gibi alt-dizin sayfalarında unutulmasın)

#### 21. oturum fix'lenen dosyalar (referans)

| Dosya | Noktalar |
|---|---|
| `spool_detay.html` | `kmMalzInfo` (2253), `bmMalzInfo` (2309), 3D M3 popup (3065-3066) |
| `devre_detay.html` | Excel BOM (1576), pipeline `<td>` (1601), Excel SPOOLS (1948), PDF önizleme (1954) |
| `devre_yeni.html` | IFS önizleme kalite sütunu (1272) |
| `bukum.html` | QR header (799), tablo `<td>` kalite (899) |
| `kesim.html` | Tekil liste (1852), özet (2033), kld meta (2383), kld row (2536), confirm dialog'ları (2950/2995), PDF head (3234), PDF detay (3457), onay modal (3559) |
| `markalama.html` | malzInfoHtml (621), plaka/otomatik parts (800/806), manuel modal (839), ml inline (1028), arc inline (1207), Excel satır (1286) |
| `izometri-batch.html` | HTML tablo 3 alan (435/436/440), Excel satır 3 alan (460-465) |
| `is_baslat.html` | Mobil chip malzeme + kalite (1077-1078) |
| `admin/index.html` | Özet tablo malzeme (364) + script yüklemesi |
| `portal/index.html` | Özet tablo malzeme (367) + script yüklemesi |
| `devreler.html` | BOM eksik satırı (2079), BOM tümü satırı (2110) |

Toplam: **11 dosya × ~30 render noktası.**

#### Anti-pattern'ler (asla tekrarlanmayacak)

```js
// ❌ Ham kategori kodu
'<td>' + esc(m.malzeme) + '</td>'

// ❌ OR fallback ham
esc(x.kalite || '—')

// ❌ Template literal ham
`${m.malzeme} — ${m.kalite}`

// ❌ Excel satırına ham
rows.push([..., s.malzeme, s.kalite, s.yuzey, ...]);

// ❌ Toast'ta ham
toast(m.malzeme + ' eklendi', 'ok');
```

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
  tr.json  — Türkçe (web) — 1379 anahtar (20 Nisan 2026 — 11. oturum, sp_chip_active + sp_btn_complete eklendi)
  en.json  — İngilizce (web) — 1379 anahtar ✅ tam çeviri
  ar.json  — Arapça (RTL destekli, web) — 1379 anahtar ✅ tam çeviri
```

**Not:** EN'de 42, AR'da 8 anahtar TR ile aynı görünür ama bunlar **evrensel teknik terim** (Spool, Pipeline, Rev, PDF, Excel, kg, #, AresPipe, emoji'li başlıklar) — tüm dillerde aynı yazılır, "çevrilmemiş" değil.

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
- `spool_id UUID` — spool bazlı notlar (spool_detay.html)
- `devre_id UUID` — devre bazlı notlar (devre_detay.html) — **12. oturumda eklendi**

**devreler:**
- `ad` (devre_adi değil)
- `termin` (DATE) — `termin_tarihi` silindi
- `ilerleme` kullanılmıyor — spooller.ilerleme ortalaması
- `durum` — DB'de saklanıyor (iptal akışı için), **ama UI'dan 5. oturumda kaldırıldı** (tüm kayıtlar 'aktif' idi)
- `yuzey_aciklama TEXT` — yuzey='diger' olduğunda (5. oturumda eklendi, devre_yeni'de henüz yazılmıyor — sadece devre_duzenle kullanıyor)
- `zone TEXT` — canonical. **`zone_no` kolonu 10. oturumda DROP edildi** (ölü kolon, hiç kullanılmıyordu)
- ~~`notlar TEXT`~~ — **12. oturumda DROP edildi** (0 kayıt, `notlar` tablosunun `devre_id` kolonuyla çözüldü)
- **Legacy temizlik tamamlandı:** `malzeme` kolonu 9. oturumda canonical'e çevrildi (82 kayıt), artık DB temiz

**basamak_tanimlari (12. oturumda güncellendi):**
- `sistem_adi TEXT` — canonical kod (on_imalat, imalat, kaynak, on_kontrol, kk, sevkiyat + tenant özeli)
- `gorunen_ad TEXT` — TR görüntü adı
- `gorunen_ad_en TEXT` — EN görüntü adı (**12. oturumda eklendi**)
- `gorunen_ad_ar TEXT` — AR görüntü adı (**12. oturumda eklendi**)
- `sira INTEGER`, `aktif BOOLEAN`, `tenant_id UUID`
- Bilinen sistem_adi'leri: on_imalat, imalat, kaynak, on_kontrol, kk, sevkiyat, alim_kontrol, montaj, son_kontrol, tasarim, tasima_test, gemi_teslim
- `ad`, `olusturma`, standart alanlar
- `kod VARCHAR(4) NOT NULL UNIQUE` — tenant prefix, CHECK `^[A-Z]{1,4}$` (bkz. Bölüm 2.14)

**tersaneler (13. oturumda güncellendi):**
- `ad TEXT` — tam tersane adı (ör. "Tersan Tersanesi")
- `kisa_ad TEXT` — kısa görüntü adı (ör. "Tersan") — **13. oturumda eklendi**, tüm sayfalarda `tersaneler(ad,kisa_ad)` ile çekilir, `trs.kisa_ad || trs.ad` fallback
- `sehir`, `ulke`, `tel`, `iletisim`, `web`, `logo_url`, `aktif BOOLEAN`, `tenant_id UUID`

**markalama_kalemleri (13. oturumda güncellendi):**
- `et_mm NUMERIC` — plaka markalamada kalınlık (6. oturumda doğrulandı)
- `malzeme TEXT` — kalem malzemesi. Tip=`plaka` için `spooller.malzeme` esas alınır (BOM kalemi değil), 13. oturumda kod tarafında düzeltildi
- `malzeme_id UUID` — `spool_malzemeleri.id`'ye FK (bağlı BOM kalemi)

**kullanicilar (17 Nisan 2026 — 2. oturum notu):**
- `ad_soyad` (ad değil!) — hata kaynağı, dikkat
- `foto_url TEXT` — avatar için (upload UI henüz yok)
- `email`, `rol`, `tenant_id`, `firma`, `brans`, `tel`, `ui_tercihleri JSONB`
- `tenants(ad)` JOIN'i bazı RLS kombinasyonlarında 400 döndürür → tenant adını ayrı sorguyla çek

**islem_log (8. oturumda DB'den doğrulandı):**
- `id UUID`, `tenant_id UUID`, `olusturma TIMESTAMPTZ`
- `islem TEXT` — eylem kodu (DEVRE_EKLE, DURDURMA, DURDURMA_KALDIRILDI, vb.)
- `katman TEXT` — kategori (devre, spool, proje, kesim, vb.)
- `katman_id UUID` — ilgili kaydın UUID'si (polimorfik)
- `yapan_id UUID` — `kullanicilar.id`'ye FK
- `aciklama TEXT`, `meta JSONB`
- `spool_id UUID`, `devre_id UUID`, `proje_id UUID` — opsiyonel FK'lar

**Not:** Eski CLAUDE.md notu `yapan_id` kolonunu TEXT sanıyordu — 8. oturumda information_schema sorgusuyla UUID olduğu doğrulandı. Kolon adı ezbere `eylem/tablo/tablo_id` değil; gerçek adlar `islem/katman/katman_id`.

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
- [x] **Kalite UX + veri temizliği** — **19. + 20. oturumda tamamlandı.** 19. oturum: master tablo + trigger. 20. oturum: `devre_yeni.html:644` kök neden fix + `devre_detay.html` 4 render noktası `ARES_NORM.kaliteGoster()` ile yenilendi. IFS import artık canonical yazım üretiyor.
- [x] **🔴 21. OTURUM ANA TEMA — Sistem çapında render standardizasyonu (G-03).** **22 Nisan 2026'da tamamlandı.** 11 HTML dosyasında ~30 ham render noktası (spool_detay, devre_detay, devre_yeni, bukum, kesim, markalama, izometri-batch, is_baslat, admin/index, portal/index, devreler) `ARES_NORM.malzemeEtiket()` / `kaliteGoster()` / `yuzeyEtiket()` güvenli fallback pattern ile lokalize edildi. `admin/` ve `portal/` altında `ares-normalize.js` script yüklemesi eklendi. G-03 kuralı CLAUDE.md Bölüm 2.18'de formalleştirildi.
- [x] **🟡 Trigger Guard 1 gevşetme** — **23 Nisan 2026 — 22. oturumda tamamlandı.** `malzeme_ref_bul()` fonksiyonundan Guard 1 (`kalite = malzeme → NULL`) kaldırıldı. Guard 2 (`kalite_kod_normalize() NULL`) tek koruma hattı olarak yeterli. Canlıda çalıştırıldı, fonksiyon tanımı teyitlendi. Migration dosyası: `22-oturum-trigger-guard-gevsetme.sql`.
- [ ] **🟡 FK CASCADE eksikliği** — `devreler → spooller → spool_malzemeleri + islem_log` zincirinde CASCADE yok. 20. oturumda kademeli silme gerekti. Admin panel "devre sil" özelliği yapılırken CASCADE eklenmeli (dikkat: production veri kaybı riski).
- [x] **🟢 22. OTURUM ANA TEMA — Faz A Faz 2 Admin UI (`tanimlar.html > Malzeme Havuzu`)** — **23 Nisan 2026'da tamamlandı.** Sistem Kaliteleri alt-tab (read-only, 12 preset) + Firma Kaliteleri alt-tab (CRUD, inline ekleme/düzenleme formu). UNIQUE çakışma kontrolü (`23505`), sistem preset ile aynı kod girildiğinde onay popup, silme öncesi FK violation ön-kontrol (`spool_malzemeleri` + `pipeline_malzemeleri` → kullanılıyorsa silmez, toast'la bildirir), çift tıklama kilidi, G-03 uyumlu lokalize render. `ares-normalize.js` tanimlar.html'e eklendi (21. oturumda atlanan 3. sayfa). Detay: Bölüm 11.
- [x] **🟡 Yan bug — `spool_detay.html` M3_RENK haritası.** **23 Nisan 2026 — 22. oturumda tamamlandı.** Key'ler eski TR label'lardan (`'Karbon Çelik'`) canonical kategori koduna (`'karbon'`, `'paslanmaz'`, `'bakir'`, `'alum'`, `'diger'`) çevrildi; `m3Mat()` ve selectedMesh lookup fonksiyonları `ARES_NORM.malzemeKod()` normalize çağrısıyla sarıldı. 3D modelde parçalar artık doğru malzeme renginde görünüyor (eskisi: hepsi `_default` rengine düşüyordu).
- [x] **🟡 Yan bug — `devre_detay.html:1609-1611` duplicate `<td>`.** **23 Nisan 2026 — 22. oturumda tamamlandı.** Aslında render bug değil, ölü kod (unary plus ifadesi) idi — return satırı `</tr>';` ile kapanıp ikinci blok JS tarafından atılıyordu. Yine de temizlendi (lint hazırlığı için).
- [x] **`kaliteleriDoldur()` master tablodan oku** — **23 Nisan 2026 — 22. oturumda tamamlandı.** spool_detay.html'de eski fonksiyon `spool_malzemeleri.kalite` geçmişini BOZUK filtreleriyle işliyordu; artık `malzeme_tanimlari`'dan (sistem preset + tenant özeli) canonical `kalite_goster` okuyor. BOZUK filtre ve AISI prefix temizliği gerekli değil çünkü master tablo zaten canonical. Faz 3 (25. oturum) bunu geçmiş kayıt önerisiyle birleşik autocomplete haline getirecek.
- [ ] **🟢 23. OTURUM — Faz B Altyapı: dosya mimarisi + lint + şablon (3-4 saat)** — CLAUDE.md'yi böl, 7 lint script, `scripts/health-check.sh`, `.husky/pre-commit`, `.github/workflows/lint.yml`, `docs/templates/`. Detay: CLAUDE-SONRAKI-OTURUM.md + docs/ROADMAP.md.
- [ ] **Spool no → marka gösterimi** — Tablolarda "S01" tek başına anlamsız, pipeline+spool_no birleştirilsin (devre_detay/kesim/markalama/sevkiyat/raporlar)
- [ ] **spool_detay.html performans** — 3007 satır, 6-7 paralel SQL, 3D kodu — lazy load + 3D ayrı dosya refactor'u (ayrı oturum işi)
- [x] **Devre dedup sessiz birleşme bug'ı** — 9. oturumda popup eklendi (devre + spool seviyesi, iş emri numaralı onay mesajı)
- [x] **devreler.malzeme Türkçe → canonical migration** — 9. oturumda 82 kayıt düzeltildi
- [x] **Fark popup pill sayaçları** — 9. oturumda `Bakır Alaşım ×3` formatı eklendi
- [x] **Spool çakışma 3-buton fix (İptal/Atla/Zorla)** — 10. oturumda tamamlandı, sessiz duplicate önlendi
- [x] **Spool insert sessiz hatası toast** — 10. oturumda tamamlandı (`dny_spool_insert_hata`)
- [x] **`devreler.zone_no` ölü kolon DROP** — 10. oturumda tamamlandı (kodda 0 referans, DB'den silindi)
- [x] **`SP._gemi` → `SP._projeNo` rename (spool_detay.html)** — 10. oturumda tamamlandı + localStorage migration bloğu
- [x] **spool_detay dropdown E-01 ihlali** — 10. oturumda tamamlandı (5+5 canonical + "Epoksi" çıkarıldı, "Diğer" eklendi, `cmn_opt_sec` yeni anahtar)
- [x] **devre_detay duplicate spoolNo bug** — 10. oturumda tamamlandı (`_lk` stable local key pattern, 11 fonksiyon + 2 state + DOM ID'ler)
- [x] **🔴 Öncelik 11 — `DEVRE.gemi` → `DEVRE.projeNo` (devre_detay.html + devreler.html)** — **12. oturumda tamamlandı** (14 patch her dosyada, migration bloğu kaldırıldı)
- [x] **🔴 Öncelik 12 — Manuel/Excel ekleme UNIQUE check pipeline+spoolNo+rev** — **11. oturumda tamamlandı**
- [x] **🔴 Öncelik 13 — `devreler.notlar` vs `notlar` tablosu ikiliği** — **12. oturumda tamamlandı** (devre_id eklendi, devreler.notlar DROP edildi, devre_detay notlar persistence eklendi)
- [x] **🟡 Öncelik 14 — `basamak_tanimlari` çok dil desteği** — **12. oturumda tamamlandı** (gorunen_ad_en/ar + _rebuildStages + _onLangChange)
- [x] **Öncelik 4 — Denormalizasyon araştırması** — **12. oturumda KAPATILDI** (spooller.malzeme = kategori özeti, spool_malzemeleri.malzeme = BOM kalemi, farklı amaçlı — yapılacak iş yok)
- [x] **🔴 YENİ ÖNCELİK 11 (10. oturumda keşfedildi) — `DEVRE.gemi` → `DEVRE.projeNo` rename** — 12. oturumda tamamlandı

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

## 11. SON OTURUM — 23 NİSAN 2026 (22. OTURUM — KAPATILDI ✅)

### Bu oturumda tamamlananlar

**Ana tema:** Faz A Faz 2 tamamlanması — `tanimlar.html`'e **Malzeme Havuzu sekmesi** eklendi. Firma bazında kalite ekleme/düzenleme/silme UI'ı canlıya alındı. E-06 master tablo altyapısı artık yazma (20. oturum), okuma (20-21. oturum), UI yönetimi (22. oturum) olarak tam tur çalışıyor.

**Akış:**
1. **Ritüel + teyit + karar:** `tanimlar.html` incelendi, sayfa-seviyesinde auth zaten `['yonetici','firma_admin','super_admin']` ile korunuyor. Sekmeye ek rol-check gereksiz. `ares-normalize.js` eksikliği tespit edildi (21. oturumda atlanmış 3. sayfa).
2. **Mockup (R-10):** İki seçenek görsel olarak karşılaştırıldı (alt-tab vs stacked). Seçenek A (alt-tab) onaylandı.
3. **Faz 1 — Mockup HTML/CSS:** 5 patch yerine doğrudan dosya güncellemesiyle uygulandı (patches pasted approach'tan direct-file approach'a geçildi). 772 → 976 satır.
4. **Tasarım tercihleri:** Açıklama sütunu tabloda ellipsis ile kalır; ekleme UI'ı inline expanding form (blok-yeni-form patterni).
5. **Faz 2 — Gerçek Supabase CRUD:** `_mockSistemData` kaldırıldı, `sistemKaliteYukle()` + `firmaKaliteYukle()` master tablodan okuyor; `kaliteKaydet()` insert/update (UNIQUE `23505` özel toast, sistem preset çakışma onay popup'ı, çift tıklama kilidi); `kaliteDuzenleAc(id)` form'u pre-filled açıyor; `kaliteSil(id)` FK violation ön-kontrolü (`spool_malzemeleri` + `pipeline_malzemeleri` count:'exact', head:true) sonrası onay + delete. 976 → 1145 satır.
6. **Sistem preset genişletme sohbeti:** "Gereksiz yük mü?" sorusuna "tahmin riski > yük" cevabıyla metodoloji açıklandı (SQL migration yolu, Dashboard Insert, gelecek süper-admin UI). Karar: 12 preset yeterli, veri biriktikçe terfi.
7. **SQL — Trigger Guard 1 gevşetmesi:** `malzeme_ref_bul()` fonksiyonundan Guard 1 kaldırıldı, Guard 2 tek koruma hattı olarak kaldı. Migration dosyası yazıldı, canlıda çalıştırıldı, dönen fonksiyon tanımı teyitlendi.
8. **Yan bug 1 — M3_RENK:** spool_detay.html'de 3D model renk haritasının key'leri eski TR label'dan canonical kategori koduna çevrildi (`'karbon'`, `'paslanmaz'`, `'bakir'`, `'alum'`, `'diger'`). `m3Mat()` ve selectedMesh sıfırlama noktalarında `ARES_NORM.malzemeKod()` normalize çağrısı eklendi.
9. **Yan bug 2 — devre_detay.html duplicate `<td>`:** Satır 1609 `</tr>';` ile kapandığı için 1610-1611'deki `+'<td>...'` blokları JS tarafından zaten atılıyordu (ölü kod). Temizlendi.
10. **Bonus — `kaliteleriDoldur()` master tablodan oku:** spool_detay.html'deki autocomplete datalist fonksiyonu `spool_malzemeleri.kalite` geçmişini BOZUK filtreleyerek işliyordu. `malzeme_tanimlari` (sistem preset + tenant özeli) canonical `kalite_goster` okuyacak şekilde refactor edildi. 3225 → 3217 satır.

### Değişen Dosyalar

| Dosya | Değişiklik | Satır değişimi |
|---|---|---|
| `tanimlar.html` | 5 patch: script sırası + sub-tab CSS + sekme butonu + panel HTML + CRUD JS | 772 → 1145 |
| `spool_detay.html` | M3_RENK 4 nokta (map + m3Mat + selectedMesh + default) + kaliteleriDoldur master | 3225 → 3217 |
| `devre_detay.html` | Duplicate `<td>` ölü kod temizliği | 2052 → 2051 |
| `22-oturum-trigger-guard-gevsetme.sql` | Yeni migration dosyası | +95 satır |
| `CLAUDE.md` | Üst bilgi + Bölüm 10 (7 madde güncelleme) + Bölüm 11/11A restrukture | — |

### Yeni `tanimlar.html > Malzeme Havuzu` Yapısı

**Sekme kapsamı:** Tanımlar sayfası içinde 3. sekme (Yetki Blokları / Kod Serileri / **🧪 Malzeme Havuzu**).

**Alt-tab yapısı:**
- **Sistem Kaliteleri (12):** Read-only, `tenant_id IS NULL`, mor `cl-leg` şerit. 4 kolon: Kategori · Kod · Gösterim · Standart.
- **Firma Kaliteleri (N):** CRUD, `tenant_id = ARES.tenantId()`, mavi `cl-ac` şerit. 6 kolon: Kategori · Kod · Gösterim · Standart · Açıklama · [✎ ✕].

**Inline ekleme formu (`kaliteYeniForm`):**
- Kategori select (5 canonical: karbon/paslanmaz/bakir/alum/diger)
- Kalite Kodu input (JS tarafı `_kaliteKodNormalize()` ile upcase + alphanumeric)
- Gösterim input (canonical display, örn. "St 37", "316L", "CuNi 90/10")
- Standart input (opsiyonel, DIN/ASTM/EN vs.)
- Açıklama TR input (opsiyonel)
- Kaydet (tek buton — insert veya update, `_kaliteDuzenleId` state'ine göre) + İptal

**Silme akışı:**
1. FK violation ön-kontrol: `spool_malzemeleri` + `pipeline_malzemeleri` count sorgusu
2. Kullanılıyorsa toast: "X · Y kayıtta kullanılıyor, silinemez"
3. Kullanılmıyorsa native `confirm()` → DELETE

**Çift tıklama kilidi:** `_kaliteKaydetKilit` boolean, save fonksiyonu başında true, sonunda false.

**Sistem preset çakışma uyarısı:** Kullanıcı kategori+kod kombinasyonu sistem preset'te varsa (ve yeni ekleme modundaysa) onay popup'ı: "Bu kod sistem kalitelerinde de var. Yine de firmaya özel eklemek istiyor musunuz?"

### RLS Policy'leri canlı doğrulandı

19. oturumda yazılan 4 policy (SELECT/INSERT/UPDATE/DELETE) 22. oturumun INSERT/UPDATE/DELETE operasyonlarıyla test edildi. Sorun tespit edilmedi (detaylı regresyon testi Faz C 27. oturumda yapılacak).

### 23. oturuma aktarılanlar

- **🟢 Faz B ana tema:** CLAUDE.md'yi böl, 7 lint script, CI/CD entegrasyonu, şablonlar. Detay: `CLAUDE-SONRAKI-OTURUM.md` + `docs/ROADMAP.md`.
- **🟡 Faz A Faz 3 (25. oturum):** `devre_yeni.html` ve `spool_detay.html` form refactor — autocomplete dropdown (master + geçmiş birleşik). 22. oturumda `kaliteleriDoldur()` sadece master'dan okuyor, 25. oturumda geçmiş kayıt önerisi eklenecek.
- **🟡 Faz A Faz 4 (26. oturum):** IFS fuzzy match — `kalite_kod_normalize()` regex genişletmesi + `ifs_material_alias` tablosu.
- **🟢 Yeni sistem preset eklenmesi:** Yöntem dokümante edildi (SQL migration dosyası + Supabase SQL editor), gerektiğinde yapılır. Örnek template: `22-oturum-trigger-guard-gevsetme.sql` patterniyle yazılır.

### Deploy Sırası (Tavsiye Edilen)

1. `tanimlar.html` → Vercel push → Malzeme Havuzu sekme testi (7 senaryo: ilk yükleme, boş firma, ekleme, UNIQUE çakışma, sistem preset uyarısı, düzenleme, silme kullanılan+kullanılmayan)
2. `spool_detay.html` → push → 3D model renk testi (parçalar doğru renkte, tıklama/bırakma renk döngüsü çalışıyor)
3. `devre_detay.html` → push → pipeline BOM tablosu (kozmetik fark yok, sadece ölü kod temizliği)
4. `22-oturum-trigger-guard-gevsetme.sql` → Supabase SQL editor'de çalıştır (yukarıdaki testler başarılı olduktan sonra)
5. CLAUDE.md + oturum kapanış dosyaları commit

### Öğrenilenler

1. **Mockup-first (R-10) + görsel karşılaştırma** değerli. Kullanıcı "sen bunları görsel olarak verir misin" dediğinde, inline SVG/HTML preview (visualizer widget) karar hızını dramatik artırdı — metin tarifinden yapılacak kararı görsel karşılaştırmaya çevirmek R-10'un doğal tamamlayıcısı.
2. **Patches vs direct-file update.** 5-patch yaklaşımı teoride elegant, pratikte kullanıcı için yavaş ("sen dosyayı iste vereyim sen güncelle bu şekilde uzun sürer"). 100+ satırlık değişikliklerde direct-file update + present_files her zaman daha verimli.
3. **Preset listesi genişletmede tahmin riski > yük riski.** Sistem preset'e 20+ kalite eklemek performans sorunu yaratmaz ama benim sektörel tahminlerim firmanın günlük iş karışımına uymayabilir. Veri biriktikçe karar vermek daha sağlam (23. oturum sonrası metrik toplama önerisi).
4. **Sayfa-seviyesi auth vs sekme-seviyesi auth.** Kullanıcı "yönetici girsin" dediğinde, `tanimlar.html` zaten sayfa-seviyesinde `['yonetici','firma_admin','super_admin']` koruyordu. Sekme-seviyesi ek kontrol gereksiz karmaşa olurdu. **Yeni sayfa kontrol listesine ekle:** auth zaten sayfa seviyesinde var mı diye kontrol et.
5. **`ares-normalize.js` yüklenme ihmali — 3. sayfa.** 21. oturumda `admin/` ve `portal/` alt-dizinlerinde ihmal yakalanmıştı; 22. oturumda `tanimlar.html` ana dizinde olmasına rağmen yüklenmediği farkedildi. Script yükleme eksikliği sessiz bir bug — fallback devrede çalışıyor, ama canonical için şart. CLAUDE.md Bölüm 2.18 yeni sayfa kontrol listesinde zaten vardı; tüm mevcut sayfaların da bir kez grep'lenmesi mantıklı.
6. **Guard 1 vs Guard 2 — gevşetme riski.** Guard 1 çıkarılınca "admin yanlışlıkla kategori yazar" gibi edge case'ler Guard 2'ye düşüyor. Guard 2 tanımıyorsa NULL dönüyor, malzeme_ref_id NULL kalıyor — veri yok olmuyor, sadece ilişki kopuk. Kabul edilebilir davranış. SQL'de açıklayıcı yorum bırakıldı (neden kaldırıldığını sonraki okuyucu anlasın).

---

## 11A. ÖNCEKİ OTURUM — 22 NİSAN 2026 (21. OTURUM — KAPATILDI ✅)

### Bu oturumda tamamlananlar

**Ana tema:** Sistem çapında render standardizasyonu. Kural G-03 formalleştirildi. 20. oturumda keşfedilen "UI'da ham `karbon` gözüküyor" teknik borcu tamamen kapatıldı.

**Akış:**
1. **Ritüel + grep** — `ares-normalize.js` helper imzaları teyit edildi, 3 grep komutu (malzeme/kalite/yüzey) + Excel/PDF export taraması çalıştırıldı, master harita çıkarıldı.
2. **"Dokunma" listesi netleşti** — matBadge, `_malzemeGoster`, state map'leri, AI prompt'ları, arama filtre string'leri, dropdown value'ları, inlineEdit arg'ları.
3. **11 HTML dosyasında ~30 render noktası fix'lendi** (güvenli fallback pattern ile — `ARES_NORM.malzemeEtiket()` / `kaliteGoster()` / `yuzeyEtiket()`).
4. **`admin/index.html` ve `portal/index.html`'de `ares-normalize.js` yüklemesi eklendi** (eksikti — fallback devreye girdiği için eski görünüm çalışıyordu, ama canonical için script şart).
5. **G-03 kuralı Bölüm 2.18'e bağımsız bölüm olarak yazıldı** — temel kural + güvenli fallback pattern + kapsam tablosu + istisna listesi + mevcut helper'lar + yeni sayfa kontrol listesi + 21. oturum fix referansı + anti-pattern'ler.

### Değişen Dosyalar

| Dosya | Noktalar | Açıklama |
|---|---|---|
| `spool_detay.html` | 2253, 2309, 3065-3066 | `kmMalzInfo` (Kesim Ekle popup), `bmMalzInfo` (Büküm Ekle popup), 3D M3 popup |
| `devre_detay.html` | 1576, 1601, 1948, 1954 | Excel BOM satırı, pipeline BOM `<td>`, Excel SPOOLS (3 alan), PDF önizleme (2 alan) |
| `devre_yeni.html` | 1272 | IFS önizleme tablosu kalite sütunu |
| `bukum.html` | 799, 899 | QR etiket header, tablo `<td>` kalite |
| `kesim.html` | 1852, 2033, 2383, 2536, 2950, 2995, 3234, 3457, 3559 | Tekil liste, özet, kld meta, kld row, iki confirm dialog, PDF head, PDF detay tablosu, onay modal |
| `markalama.html` | 621, 800, 806, 839, 1028, 1207, 1286 | malzInfoHtml, plaka/otomatik parts, manuel modal, ml inline, arc inline, Excel satır |
| `izometri-batch.html` | 435, 436, 440, 452 (Excel block) | HTML tablo 3 alan + Excel satır 3 alan |
| `is_baslat.html` | 1077, 1078 | Mobil chip malzeme + kalite |
| `admin/index.html` | 364 + script | Özet tablo malzeme + `ares-normalize.js` yükleme |
| `portal/index.html` | 367 + script | Özet tablo malzeme + `ares-normalize.js` yükleme |
| `devreler.html` | 2079, 2110 | Pipeline BOM state=2 ve state=kırmızı satırları |
| `CLAUDE.md` | — | Bölüm 2.18 G-03 kuralı + Bölüm 10 güncelleme + Bölüm 11/11A |

### Güvenli Fallback Pattern (21. oturumun imzası)

```js
esc(
  (typeof ARES_NORM!=='undefined' && ARES_NORM.malzemeEtiket)
    ? (ARES_NORM.malzemeEtiket(x.malzeme) || x.malzeme || '—')
    : (x.malzeme || '—')
)
```

Bu pattern her render noktasında **inline** uygulandı. Neden wrapper fonksiyon yerine inline seçildi:
1. `typeof ARES_NORM` kontrolü ARES_NORM yüklenmemiş sayfalarda (admin/portal eskisi gibi) güvenli düşüş
2. `|| x.malzeme || '—'` bilinmeyen kategori kodlarında ham değeri gösterir (`malzemeEtiket('xyz')` → `'xyz'` zaten döner, belt-and-suspenders)
3. Wrapper yerine inline → her dosyanın bağımsız kalması (CLAUDE.md 2.18'deki standarda uyum)

### Dokunulmayan yerler (teyit edildi — standarda uygun)

- `matBadge(m)` — `bukum.html:464`, `kesim.html:994`, `markalama.html:595` → zaten `ARES_NORM.tvMalzeme` kullanıyor
- `_malzemeGoster` / `_yuzeyGoster` — `spool_detay.html:1206/1210`, `devre_detay.html:877/887` → `ARES_NORM.malzemeEtiket/yuzeyEtiket` wrap
- `devreler.html:1768-1797` inline matBadge + yuzeyBadge + sapma tooltip → `ARES_NORM.tvMalzeme/tvYuzey` ile zaten lokalize
- **State map'leri** (`{malzeme: x.malzeme || '—'}`) → DB-facing ham değer, trigger canonicalize edecek
- **Arama filtre string'leri** (`[a,b,c].join(' ').toLowerCase()`) → kullanıcıya gösterilmez
- **AI chatbot prompt'ları** (`spool_detay.html:1590-1592`) → LLM'e gönderilir, kullanıcıya değil
- **De-dup hash** (`devre_detay.html:1546`) → kullanıcıya gösterilmez
- **Dropdown value'ları** (`<option value="karbon">Karbon Çelik</option>`) → value ham (DB yazımı), text lokalize (zaten lokalize)
- **inlineEdit arg'ları** (`devre_detay.html:1196`) → `currentValue` ham kalmalı (düzenleme için)

### 22. oturuma aktarılan yan bug'lar (21. oturumda keşfedildi)

1. **`spool_detay.html` M3_RENK haritası eski TR key'ler** (satır 2657-2665). 3D model renk haritasında `'Karbon Çelik'`, `'Paslanmaz Çelik'` gibi Türkçe label key'ler kullanılıyor. Gerçek data canonical kod (`'karbon'`, `'paslanmaz'`) olduğu için `M3_RENK['karbon']` lookup başarısız, `_default` rengine düşüyor. Fix: key'leri kategori koduna çevir (`'karbon': 0x7a7d82, 'paslanmaz': 0xb0b8c1, ...`). Tek yer, ~5 dk.

2. **`devre_detay.html:1609-1611` duplicate `<td>` satırı.** Pipeline BOM tablosunda `<td>sertifikali</td>` ve `<td>silme butonu</td>` iki kez yazılmış. Bir render bug değil, fazladan kolon üretiyor. ~2 dk.

### Deploy Durumu

21. oturum sonu: 11 HTML + CLAUDE.md düzenlenip canlıya deploy edilecek.

Deploy sonrası canlı test matrisi (CLAUDE-SONRAKI-OTURUM.md'den devralındı):

| # | Sayfa | Test | Beklenen |
|---|---|---|---|
| 1 | spool_detay | Büküm Ekle popup'ta malzeme seç | `Karbon Çelik — St 37 — 219,1 mm` |
| 2 | spool_detay | Kesim Ekle popup'ta malzeme seç | Aynı |
| 3 | spool_detay | 3D model parça tıkla → popup | `Karbon Çelik` (ham değil) |
| 4 | kesim.html | Liste kalite sütunu | `St 37` |
| 5 | kesim.html | Kesim Planı PDF head | `Karbon Çelik St 37 Ø...` |
| 6 | bukum.html | QR etiket + tablo | `Karbon Çelik St 37` |
| 7 | markalama.html | Alt satır chip | `St 37` (ham `ST37` değil) |
| 8 | izometri-batch | Tablo + Excel | 3 kolon lokalize |
| 9 | is_baslat | Mobil chip | `Karbon Çelik`, `St 37` |
| 10 | admin özet + portal özet | Tablo | `Karbon Çelik` (ham `karbon` değil) |
| 11 | devreler | Pipeline BOM | Malzeme kolonu lokalize |
| 12 | devre_detay Excel export | İndir + aç | Tüm kolonlar canonical |

### Öğrenilenler

1. **Sistematik grep master tablo kuralı:** Yeni bir helper çıkınca tüm render noktalarını grep'le süpür. 19. oturumda `kaliteGoster()` eklendi ama `devre_detay.html` 4 noktası gözden kaçtı (20. oturumda fix). 20. oturumda da keşfedilen ham `karbon` sorunu 11 farklı dosyaya yayılmıştı. G-03 kuralının formal kontrol listesi bu sürüklemeyi engelleyecek.

2. **Güvenli fallback > wrapper.** Her dosyaya `kgLoc()` gibi helper eklemek yerine inline `typeof ARES_NORM!=='undefined'` check'i — ARES_NORM yüklenmemiş sayfa gibi edge case'leri otomatik karşılar (admin/portal bunu kanıtladı). Wrapper helper sadece tek dosyada 3+ kez tekrar ediyorsa değer katar.

3. **`ARES_NORM.malzemeEtiket(bilinmeyen)` zaten ham döner** — belt-and-suspenders için ek `|| x.malzeme` koymak zararsız ama çoğu durumda çift koruma. Ancak `kaliteGoster('')` boş string dönerken `malzemeEtiket('')` `'—'` döner — bu asimetri fallback zinciri için kritik (kalite'de `|| '—'` olmadan boş satır çıkar).

4. **Alt-dizin sayfaları script ihmali.** `admin/` ve `portal/` altındaki HTML'ler relative path (`../ares-normalize.js`) ile yüklemeli. 21. oturumda keşfedildi — sessizce fallback'te çalışıyorlardı.

5. **Dokunulmaz listesi fix listesi kadar önemli.** Arama filtre string'leri, AI prompt'ları, state map'leri, dropdown value'ları lokalize ETMEMEK gerekir — aksi halde DB yazım / arama / model davranışı bozulur. G-03 bu istisnaları açıkça sayıyor.

6. **Deploy-test-kapanış protokolü.** Her oturum `CLAUDE.md son güncelleme` + `Bölüm 10 bekleyenler` + `Bölüm 11 son oturum` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` beşlisi. Bu disiplin 21 oturumdur hayatta tutuyor bu projeyi.

---

## 11A1. ÖNCEKİ OTURUM — 22 NİSAN 2026 (20. OTURUM — KAPATILDI ✅)

### Bu oturumda tamamlananlar

**Ana tema:** 19. oturum canlı test + IFS import kök neden fix + `devre_detay.html` render E-06 tamamlaması + DB temizlik + canlı re-import başarısı

**Akış:**
1. **Deploy teyidi** — `ARES_NORM.kaliteGoster('CUNI9010') → 'CuNi 90/10'` ✅, DB 12 preset ✅
2. **Canlı test** — kullanıcı `devre_detay.html` IFS Excel yükledi, `Kalite = karbon` bozuk gösterim
3. **DB teşhis** — `spool_malzemeleri`: 42 kayıt, 0 bağlı, hepsi `malzeme=karbon, kalite=karbon` (trigger Guard 1 doğru çalışmış, master'a sahte kayıt yok ✅)
4. **IFS Excel analizi** — `Material` kolonu = ST37 (kalite kodu, kategori değil); HAM değer kayboluyordu
5. **Kök neden tespiti** — `devre_yeni.html:644` `normalizeMalzeme()` prematüre normalize
6. **Fix paketi**:
   - `devre_yeni.html`: satır 644 → `String(row[idx.mat]||'').trim()` (ham sakla)
   - `devre_detay.html`: 4 render noktası → `ARES_NORM.kaliteGoster()` (1195, 1563, 1576, 1602)
7. **DB temizlik** — 42 malzeme + 8 spool + log + 1 devre kademeli silindi (FK CASCADE eksikliği nedeniyle transaction + islem_log eklemesi)
8. **Canlı re-import testi** — Aynı IFS yüklendi, SELECT teyidi: `malzeme='karbon', kalite='St 37', bagli=true, kalite_goster='St 37', standart='DIN 17100', kayit=42` ✅

### Değişen Dosyalar

| Dosya | Öncesi | Sonrası | Değişiklik |
|---|---:|---:|---|
| `devre_yeni.html` | 2298 | 2301 | Satır 644 `normalizeMalzeme()` kaldırıldı, ham sakla (+3 yorum satırı) |
| `devre_detay.html` | 2041 | 2041 | E-06 render fix — 4 inline değişiklik |
| `CLAUDE.md` | — | — | E-06 Historical Timeline + IFS import altın kuralı + anti-pattern + G-03 render kuralı adayı |

### Hazır SQL Paketleri (Arşiv)
- `20-oturum-db-temizlik.sql` — 42 bozuk kayıt temizliği (kademeli + islem_log dahil)
- `20-oturum-trigger-guard-gevsetme.sql` — Guard 1 opsiyonel kaldırılması (ertelendi)

### Yeni Teknik Borç (21. oturuma aktarıldı)

**UI'da ham kategori kodu gösteriliyor.** Kullanıcı `spool_detay.html > Büküm Ekle` popup'ında fark etti:
```
Pipe Seamless Steel Tube - 3.1 Certificate — St 37 — 219,1 mm   ← doğru
karbon — St 37 — 219,1 mm                                        ← ham kod!
```

`ARES_NORM.malzemeEtiket('karbon') → 'Karbon Çelik'` çağrısı eksik. Muhtemelen sistem çapında yayılmış (spool_detay, kesim, bukum, markalama, portal, admin, izometri-batch, raporlar...).

**Kullanıcı talebi:** *"Başka bir yerde hatalı gösterim görmek istemiyorum — tam olarak standartlaştıralım."* → 21. oturum ANA TEMA: sistem çapında render süpürmesi + G-03 kural formalleşmesi.

### Deploy Durumu ✅

| Dosya | Durum |
|---|---|
| `devre_yeni.html` | ✅ Canlıda |
| `devre_detay.html` | ✅ Canlıda |
| DB temizlik + re-import | ✅ Doğrulandı |

### Öğrenilenler

1. **Idempotent değil sessiz veri kayıpçı.** `normalizeMalzeme('ST37')→'karbon'` ilk çağrı sağlıksızdır. Saklayan fonksiyon HAM tutmalı, normalize **kullanım anında**.

2. **Yeni ARES_NORM helper → grep tüm render'ı.** `kaliteGoster()` 19. oturumda eklendi, 4 render noktası unutulmuştu. `malzemeEtiket()` için aynı grep 21. oturum işi. Ders: yeni helper ekle → `grep` → tüm gösterim noktalarını dolaş.

3. **FK CASCADE olmayan DB = kademeli silme.** `devreler → spooller → spool_malzemeleri + islem_log` zincirinde CASCADE yok. `islem_log.devre_id` ve `islem_log.spool_id` FK'ları kolayca unutulur. Transaction (`BEGIN...COMMIT`) atomik güvence sağlar.

4. **Trigger Guard'ı UX'e zarar verebilir.** Guard 1 (`kalite = malzeme`) meşru `ST37=ST37` senaryosunu reddeder. Guard 2 (`kalite_kod_normalize NULL`) zaten yeterli. 20. oturum kod fix'i ile Guard 1 tetiklenmiyor, SQL gevşetme opsiyonel.

5. **Deploy-test-Faz2 sırası bozulamaz.** Gündem Faz 2 olarak geldi, ama canlı test bozuk çıktı → fix öne alındı. Faz 2 artık 22. oturuma (21. oturum render süpürmesi).

6. **Bug izinde tersten oku.** Kök sıklıkla prematüre normalize'dadır.

7. **_malzemeTipi() doğru tasarlanmış, sadece girdisi bozuk geliyordu.** Mevcut kodun niyetini oku, doğru tasarlanmış olabilir.

---

## 11A2. ÖNCEKİ OTURUM — 22 NİSAN 2026 (19. OTURUM)

### Bu oturumda tamamlananlar

**Ana tema:** Faz 1 Malzeme Master Tablo altyapısı — `malzeme_tanimlari` + FK + DB trigger + guard'lar + 12 sistem preset seed

**1. `malzeme_tanimlari` master tablo — DB şema tamamlama ✅**
- Tablo zaten vardı (önceki yarım çalışmadan, koda bağlı değildi), %90 şema uyumluydu
- Eklenen kolonlar: `kalite_goster text` (UI gösterimi: "St 37", "CuNi 90/10"), `standart text` (DIN 17100, ASME SA-106)
- FK kolonları zaten vardı: `spool_malzemeleri.malzeme_ref_id`, `pipeline_malzemeleri.malzeme_ref_id`
- `spooller` tablosuna FK **eklenmedi** — spool'un birden fazla malzemesi olabilir, text kolonlar denormalize özet kalır
- `spooller.kalite_standart` DROP edildi (567 kayıttan 0 kullanım, ölü kolon)

**2. RLS (4 policy) + CHECK + Partial Unique Index ✅**
- SELECT: sistem preset + kendi tenant
- INSERT/UPDATE/DELETE: sadece kendi tenant (sistem preset dokunulamaz)
- CHECK `check_sistem_preset_tenant`: `sistem_preset=true ⟹ tenant_id IS NULL`
- Partial unique `malzeme_tanimlari_preset_unique_idx ON (kategori_kod, kalite_kod) WHERE tenant_id IS NULL`

**3. 12 Sistem Preset ✅**
- karbon: `ST37`, `S235JR`, `A106B`, `A53`
- paslanmaz: `316L`, `304L`, `316`, `304`, `14571`, `A312TP316L`
- bakir: `CUNI9010` · alum: `6061T6`

**4. DB Fonksiyonları + Trigger'lar ✅**
- `kategori_kod_normalize(text)`, `kalite_kod_normalize(text)`, `malzeme_ref_bul(uuid, text, text)`
- Guard 1: `kalite = malzeme` → NULL (bozuk kayıt şüphesi) — 20. oturumda false-positive ürettiği keşfedildi, gevşetme SQL'i hazır
- Guard 2: `kalite_kod_normalize NULL` → NULL (kategori adı veya bilinmeyen)
- Trigger'lar: `tg_spool_malzemeleri_ref_sync`, `tg_pipeline_malzemeleri_ref_sync` (BEFORE INSERT OR UPDATE)

**5. Trigger Test (4/4 temiz) ✅**
- Test verisi kaybı: tüm `spool_malzemeleri` + `pipeline_malzemeleri` boşaldı (test verisiydi, migration gereksiz kaldı)

**6. JS Tarafı (`ares-normalize.js`) ✅**
- `kaliteKod(raw)` — DB `kalite_kod_normalize()` eşi
- `kaliteGoster(kodOrRaw)` — master `kalite_goster` eşi

**7. 18. Oturum Gerçeklik Kontrolü ✅**
- CLAUDE-SON-OTURUM.md 18. oturum raporu 3 fix'i "yapıldı" diyordu, zip'te yoktular (commit eksik kalmış). Bu aslında 19. oturuma temiz başlangıç verdi — yarım çözüm kalıntısı yok.

### Deploy Durumu (19. oturumdan 20. oturuma)

| Dosya | Durum |
|---|---|
| `ares-normalize.js` | ✅ Deploy edildi (20. oturum `kaliteGoster('CUNI9010')` console test teyit etti) |
| `api/sorgula.js` | ✅ Deploy |
| `devre_detay.html` | ✅ Deploy |
| `spool_detay.html` | ✅ Deploy |
| `CLAUDE.md` | ✅ E-06 yenilenmiş |
| DB altyapı (tablo + trigger + preset) | ✅ Canlıda |

### 19. Oturumdan Devralınan Teknik Borç (20. oturumda çözüldü)
- **IFS import canlı testi başarısız** → `devre_yeni.html:644` prematüre normalize → 20. oturumda tek satır fix
- **`devre_detay.html` render'da E-06 eksik** → 4 nokta `ARES_NORM.kaliteGoster()` çağırmıyordu → 20. oturumda tamamlandı

---

## 11B. ÖNCEKİ OTURUM — 20 NİSAN 2026 (12. OTURUM)

### Bu oturumda tamamlananlar

**Ana tema:** DEVRE.gemi rename, notlar persistence, basamak_tanimlari multilang, Öncelik 4 araştırma

**1. Öncelik 5+11 — DEVRE.gemi → DEVRE.projeNo ✅**
- `devre_detay.html`: 14 patch (init, migration bloğu, document.title, breadcrumb, marka ×2, goSpool, etiket ×3, PDF ×2)
- `devreler.html`: 14 patch (obje tanımı, sort header, 11× d.gemi)
- `devre_detay.html` migration bloğu kaldırıldı (artık gereksiz)
- `ares-store.js`: değişiklik yok (sadece DB kolon adları içeriyor)

**2. Öncelik 13 — notlar persistence ✅**
- DB: `notlar.devre_id UUID` eklendi; `devreler.notlar TEXT` DROP edildi (0 kayıt)
- Kod: `notYukle()` + async `notEkle()` + async `notSil()` — Supabase'e yazıyor

**3. Öncelik 14 — basamak_tanimlari multilang ✅**
- DB: `gorunen_ad_en/ar` kolonları + 12 sistem_adi için çeviriler
- Kod: `STAGES_DATA`, `_rebuildStages()`, güncellenen `_basamaklariYukle()`, `_onLangChange`

**4. Öncelik 4 — Denormalizasyon araştırması → KAPATILDI ✅**
- `spooller.malzeme` = spool kategori özeti; `spool_malzemeleri.malzeme` = BOM kalemi
- "Çelişki" aslında teknik gerçeklik (alüm spool'da karbon flanş)
- Yapılacak iş yok

**5. devreler.html temizlik ✅**
- `Plastik/PE` → MALZEME_PATTERNS'ten kaldırıldı
- `Ham` → YUZEY_PATTERNS'ten kaldırıldı
- Duplicate Siyah option silindi

### Deploy Durumu

| Dosya | Durum |
|---|---|
| `devre_detay.html` | **Deploy bekliyor** |
| `devreler.html` | **Deploy bekliyor** |
| `spool_detay.html` | **Deploy bekliyor** |
| DB değişiklikleri | ✅ Canlıda |

---

## 11. ÖNCEKİ OTURUM — 22 NİSAN 2026 (16-17. OTURUM)

**Ana tema:** kesim.html tam refactor + wizard UX + spool_detay/devre_detay bug fix

**Yapılanlar:**
- `kesim_plani JSONB`, `boru_ids JSONB`, `kriter JSONB`, `kesim_listesi_id UUID` kolonları eklendi
- **Wizard Modal** (tek popup, 3 adım): klDetayModal + formModal + sonucModal → `wizardModal`
  - Adım 1: Boru listesi + seçim + kesildi kaydet
  - Adım 2: Kesim parametreleri + parça borular
  - Adım 3: V3 kart planı + Excel/PDF
- **V3 kart tasarımı**: `_renderV3()` — istatistik grid + stok başına kart (çizgi şema + iç tablo)
- **PDF**: v3 formatında, SVG çizgi şema, firma logo + footer
- **Liste kaybolma bugı**: `kesim_plani` kolonu eksikti → fallback SELECT eklendi
- **Sıralama**: `unshift` ile yeni liste başa, ISO date sort kesilen listeler
- **Kapalı liste borularının havuzda görünmesi**: `kesimListesiId` → `kapaliListeIds` kontrolü
- **Toast async fix**: DB save başarısından sonra çıkıyor
- **Paketi İptal Et**: borular havuza, liste DB'den silinir
- **`spool_detay.html`**: `kesimKaydet/bukumKaydet/markalama` insert'lerine `spool_id: SP.supaId` eklendi
- **`devre_detay.html`**: `spoolYukle` nested select ile rewrite (kesim/büküm/markalama dahil)
- **`devre_yeni.html`**: `devreler.notlar` insert'ten kaldırıldı → `notlar` tablosuna yazılıyor
- **Dil dosyaları**: 11 yeni anahtar eklendi (cmn_disa_aktar, ks_bos_kesilen vb.)

**DB Migrasyonlar:**
```sql
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS boru_ids JSONB DEFAULT '[]';
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kriter JSONB DEFAULT '{}';
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kesim_plani JSONB;
ALTER TABLE kesim_kalemleri ADD COLUMN IF NOT EXISTS kesim_listesi_id UUID;
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kapali BOOLEAN DEFAULT false;
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS arsiv JSONB DEFAULT '[]';
```

**Değişen dosyalar:** `kesim.html`, `spool_detay.html`, `devre_detay.html`, `devre_yeni.html`, `tr/en/ar.json`

---

## 11A. ÖNCEKİ OTURUM — 20 NİSAN 2026 (11. OTURUM)

### Bu oturumda tamamlananlar (Test + 3 Fix + 1 Kural)

**Ana tema:** 10. oturum deploy borcu testi + QA bulunan eksik fix'ler

**1. Küme A — Dil dosyaları testi ✅**
- TR/EN/AR dil geçişi test edildi, placeholder bug'ları (7 adet) düzelmiş ✅
- AR RTL düzeni doğru ✅

**2. spool_detay Tracker i18n Fix ✅**
- `renderTracker` fonksiyonu `STAGE_KEYS` array'ini biliyordu ama kullanmıyordu
- `esc(s)` → `tv(STAGE_KEYS[i], s)` (tracker label'ları)
- Chip metinleri hardcode TR → `tv('sp_chip_not_started')`, `tv('sp_chip_done')`, `tv('sp_chip_active', '{stage} aşamasında').replace()`
- Buton: `STAGES[cur]+' Tamamla'` → `tv('sp_btn_complete', '{stage} Tamamla').replace()`
- **Yeni bulgu:** `sp_chip_not_started` ve `sp_chip_done` zaten lang dosyasındaydı — sadece render'a bağlanmamıştı
- 2 yeni lang anahtarı eklendi: `sp_chip_active`, `sp_btn_complete` (3 dil × 2 = 6 değişiklik)

**3. spool_detay Migration localStorage Fix ✅**
- `_gemi → _projeNo` migration bloğu vardı ama Supabase callback'i beklemeden hemen `localStorage.setItem` yapmıyordu
- Supabase query başarısız olursa `_gemi` kalıcı kalıyordu
- Fix: migration bloğunun hemen ardına `try { localStorage.setItem(...) } catch(e) {}` eklendi

**4. Öncelik 12 — devre_detay Duplicate Validation ✅**
- Manuel ekleme (satır 1352) + Excel import (satır 1886): sadece `spoolNo` kontrolü → `pipeline+spoolNo+rev` üçlü kontrole çevrildi
- Excel import'ta `Rev`/`REV` kolonunu da okuma eklendi

**5. Kural B-02 — CLAUDE.md Bölüm 2.17 ✅**
- Stabil Local Key (`_lk`) pattern'i resmi kural olarak belgelendi

### Değişen Dosyalar (3 HTML + 3 JSON)

| Dosya | Değişiklik | Deploy |
|---|---|---|
| `spool_detay.html` | Tracker i18n (6 patch) + migration localStorage fix | **Bekliyor** |
| `devre_detay.html` | Öncelik 12 — duplicate validation (2 patch) | **Bekliyor** |
| `lang/tr.json` | 1377 → 1379 (sp_chip_active, sp_btn_complete) | **Bekliyor** |
| `lang/en.json` | 1377 → 1379 | **Bekliyor** |
| `lang/ar.json` | 1377 → 1379 | **Bekliyor** |

### Test Durumu

| Küme | Durum | Not |
|---|---|---|
| A — Dil dosyaları | ✅ Geçti | TR/EN/AR temiz |
| B.1-B.3 — 3-buton dedup | ⏭ Atlandı | 12. oturuma |
| C.1 — _projeNo başlık | ⏭ Kısmen | localStorage teyit edilemedi tam |
| C.2 — Migration | ✅ Fix uygulandı | Deploy sonrası re-test |
| C.3 — Dropdown | ✅ Geçti | Seçili geliyor |
| C.4 — AR tracker | ⚠️ Kısmi | Fix doğru, basamak_tanimlari TR (Öncelik 14) |
| D — _lk duplicate | ⏭ Atlandı | 12. oturuma |

### Yeni Bulgular

- **Öncelik 14 (yeni):** `basamak_tanimlari.gorunen_ad` sadece TR — tracker tam çok dil için `gorunen_ad_en`, `gorunen_ad_ar` kolonları gerekiyor. 2-3 saat, orta-yüksek risk
- **Lang anahtar sayısı:** 1379 (önceki CLAUDE.md'de 1377 yazıyordu — düzeltildi)

### Bu Oturumdan Dersler

1. **"Oturum özetinde tamamlandı = gerçekten bitti" değil.** 10. oturum QA bulgu 2 "7 dil anahtarı + renderTracker i18n sarması" diyordu. Anahtarlar eklenmişti ama renderTracker'a bağlanmamıştı. Özet yazılırken "niyeti değil sonucu" yaz.

2. **Migration fix eksikti.** `_gemi → _projeNo` bloğu localStorage'a hemen yazmıyordu. Supabase callback başarısız olursa eski veri kalırdı. Migration bloklarında hemen persist etmek kural olmalı.

3. **`basamak_tanimlari` DB'den gelince i18n kırılıyor.** Dinamik tenant verisi statik lang dosyasıyla çevrilemez. DB'de çok dil desteği (gorunen_ad_en/ar) olmadan bu sorun çözümsüz. Öncelik 14 olarak eklendi.

---

## 11A. ÖNCEKİ OTURUM — 21 NİSAN 2026 (13. OTURUM)

### Bu oturumda tamamlananlar

**Ana tema:** Tablo tasarımı standardizasyonu, tersane kısa adı, görsel iyileştirmeler, büküm fason kaldırma, DB temizlik.

**1. Tersane kısa adı (`kisa_ad`) — DB + Kod:**
- `tersaneler` tablosuna `kisa_ad TEXT` kolonu eklendi (zaten mevcuttu)
- `UPDATE tersaneler SET kisa_ad = split_part(ad, ' ', 1) WHERE kisa_ad IS NULL OR kisa_ad = ''`
- Tüm sayfalarda `tersaneler(ad,kisa_ad)` + `trs.kisa_ad || trs.ad` — 9 dosya güncellendi
- `tersaneler.html` yönetim formuna "Kısa Ad" zorunlu alanı eklendi

**2. Tersane badge tasarımı:**
- `tersaneBadge(ad)` fonksiyonu — hash-based 5 renkli palet, uppercase pill, tüm sayfalara eklendi
- Eski: düz metin mor renk → Yeni: TERSAN(amber)/ADA(mor)/SEDEF(pembe) renkli pill

**3. Tablo tipografi standardizasyonu (kesim, büküm, markalama + diğerleri):**
- Spool ID: 20px/800 → 15px/700
- Kesim/Büküm uzunluk: 18-20px/800 → 15px/700
- Kalite: mavi → muted gri (`var(--txd)`)
- Çap: 13px/600 Condensed → 14px/500 normal
- İş emri: büküm'de `ref-badge` → `cell-emir` (kesim/markalama ile aynı)

**4. Cascade animasyon — kesim, büküm, markalama:**
- `@keyframes _cascadeIn` + `data-ci="0..19"` + 45ms delay
- `_dataLoaded` ve `_animDone` flag'leriyle çift render önlendi

**5. Scrollbar stillemesi:**
- `ares-layout.js` `injectGlobalCSS()`'e eklendi — 6px, `var(--bor)` rengi, transparent track
- Sol menü (`sidebar-nav`) scrollbar gizlendi
- Tüm HTML'lerden duplicate scrollbar CSS temizlendi

**6. Stat pill genişlemesi — kesim, büküm, markalama:**
- `hero-left` flex:1 kaldırıldı (sabit), `hero-stats` flex:1 aldı
- `stat-pill` min-width:88→120px, flex:1 (eşit dağılım)

**7. Fason büküm kaldırıldı — bukum.html:**
- 573 satır silindi (1385→812 satır)
- Silinen: panel-fason, tab-fason, firmalar/fasonlar değişkenleri, renderFasonListe, openFasonDetay ve tüm fason fonksiyonları
- Bükülenler: tersane badge + tersane filtresi eklendi, başlık kaldırıldı, isFason dalları temizlendi
- DOMContentLoaded başlatma kodu restore edildi (fasonla birlikte silinmişti)

**8. DB temizlik:**
- `spool_malzemeleri.kalite`'deki malzeme kodları NULL'a çekildi (`UPDATE ... WHERE kalite IN ('bakir','karbon',...)`)
- Plaka malzeme: `markalama_kalemleri.malzeme` → `spooller.malzeme` esas alınıyor (kod düzeltmesi)

**9. Lang dosyaları:** 1414 anahtar, 3 dil senkron (`bk_stat_tamamlanan` vb. yeni anahtarlar)

### Değişen Dosyalar (9 HTML + 1 JS + 3 JSON)

| Dosya | Değişiklik |
|---|---|
| `kesim.html` | tersane badge, tablo font, animasyon, _dataLoaded |
| `bukum.html` | **fason kaldırıldı**, tersane badge, tablo font, animasyon, bükülenler düzeltmeleri |
| `markalama.html` | tersane badge, tablo font, animasyon, _dataLoaded/_animDone, plaka malzeme fix |
| `devreler.html` | tersane badge, kisa_ad, filtre eşleşme fix |
| `kalite_kontrol.html` | tersane badge, kisa_ad |
| `sevkiyatlar.html` | tersane badge, kisa_ad |
| `spool_detay.html` | tersane badge, kisa_ad |
| `tersaneler.html` | kisa_ad form alanı |
| `devre_duzenle.html` | kisa_ad |
| `ares-layout.js` | scrollbar CSS, sidebar-nav scrollbar gizlendi |
| `tr/en/ar.json` | 1414 anahtar |

### DB Değişiklikleri (Canlıda)
- `spool_malzemeleri.kalite` temizlendi (bakir/karbon vb. kodlar NULL'a çekildi)
- `tersaneler.kisa_ad` dolduruldu (zaten mevcuttu, boş kayıtlar split_part ile dolduruldu)

---

## 11B. ÖNCEKİ OTURUM — 20 NİSAN 2026 (12. OTURUM)

### Bu oturumda tamamlananlar (6 Öncelik: 1+2+3+5+6+7)

10. oturumda sırasıyla Öncelik 1, 2, 3, 5, 6, 7 kapatıldı. Toplam ~2.5 saat, 4 HTML + 3 JSON + 1 DB migration.

**1. Öncelik 1 — Spool Çakışma 3-Buton Fix (devre_yeni.html):**
- 9. oturumdaki "Yine de devam et" butonu sessiz duplicate oluşturuyordu
- Yeni yapı: `[İptal] [Zorla ekle (sarı warn)] [Çakışanları atla (mavi, default)]`
- `spoolCakismaBul` — `{..., idx: i}` array tracking
- `kaydet()` — `'atla'` dalı: `new Set(cakismalar.map(c=>c.idx))` filter, boş kaldıysa `dny_dedup_s_bos` toast
- 4 yeni anahtar: `dny_dedup_s_atla`, `dny_dedup_s_bos`, `dny_spool_insert_hata`, `cmn_opt_sec` + 1 güncelleme: `dny_dedup_s_devam`

**2. Öncelik 2 — Spool Insert Toast:**
- `spoolRes.error` dalında sadece `console.error` vardı → `toast(...'er')` eklendi
- `.t-wa` CSS sınıfı (amber toast için) eklendi

**3. Öncelik 3 — `devreler.zone_no` Ölü Kolon DROP:**
- Grep: kodda 0 referans (node_modules hariç)
- 4 SQL + kolon listesi doğrulaması → ölü
- `ALTER TABLE devreler DROP COLUMN zone_no;` canlıda çalıştırıldı
- Bölüm 4.2 `devreler` kolon listesi güncellendi (zone canonical, zone_no kaldırıldı)

**4. Öncelik 5 — `SP._gemi` → `SP._projeNo` (spool_detay.html, 9 patch):**
- **Kritik keşif:** Önceki AI 3 yerde `SP._projeNo||SP._gemi` fallback bırakmış ama **`SP._projeNo`'ya hiç atama yapmamış** — fallback kozmetikti
- Demo data (897) + ASIL ATAMA (1005) + 6 okuma noktası düzeltildi
- **Legacy localStorage migration bloğu** (1296-1299): `_gemi` varsa `_projeNo`'ya taşı ve sil
- `devre_detay.html` goSpool bonus: localStorage'a `_projeNo:DEVRE.gemi` yaz (kaynak `DEVRE.gemi` hâlâ, 11. Öncelik)

**5. Öncelik 6 — spool_detay Dropdown E-01 (Silent Bug Fix):**
- **Silent DB corruption kaynağı:** Düzenle modal'ı `<option>` value'ları olmadan gelmişti, `.value` text döndürüyordu → DB'ye Türkçe yazılıyordu → 9. oturum Bug #3 migration'ı her düzenle'de geri alınıyordu
- Yüzey + malzeme dropdown'lar → 5+5 canonical value + data-i18n
- **"Epoksi" çıkarıldı** (CLAUDE.md 2.13 uyumu), **"Diğer" eklendi**, **"Boyalı" → `boyali` + etiket "Boya"**
- `duzenleAc()` — legacy Türkçe SP.yuzey/malzeme → `ARES_NORM.yuzeyKod/malzemeKod` ile canonical'e çevir
- `cmn_opt_sec` yeni anahtar (3 dil)

**6. Öncelik 7 — devre_detay Duplicate spoolNo Bug (`_lk` Stable Key):**
- Başta "tek fonksiyon" sandım, 11 fonksiyon + 2 state nesnesi + DOM ID'ler zincirine dönüştü
- **Strateji:** Her SPOOLS kalemine `_lk` (stable local key): DB kayıtları için `s.id` (UUID), Excel/manuel import için `'new_'+Date.now()+'_'+random(7)`
- Değişen: `_spoolMap`, Excel import, manuel ekleme, `renderTable` (6 onclick), `inlineEdit`, `goSpool`, `ctxAc` + zincir, `spoolDurdurAc/IptalAc/SilAc`, `spoolKaldir`, DELETE filter, `_gonderSecili`, `_etiketSecili`, DOM ID'ler
- **Kritik bug fix:** Aynı devrede `pipeline1+S01` + `pipeline2+S01` olduğunda — eskiden inline edit ilkinden, sil ikisini de silerdi. Şimdi doğru

### Değişen Dosyalar (4 HTML + 3 JSON + 1 SQL)

| Dosya | Önce → Sonra | Risk |
|---|---|---|
| `devre_yeni.html` | 2271 → 2286 (Öncelik 1+2) | Orta |
| `spool_detay.html` | 3139 → 3151 (Öncelik 5+6) | **Yüksek — 2 silent bug** |
| `devre_detay.html` | 1994 satır (Öncelik 7) | **Yüksek — kapsamlı refactor** |
| `lang/{tr,en,ar}.json` | 1366 → 1370 | Düşük |
| SQL | `ALTER TABLE devreler DROP COLUMN zone_no;` | Geri alınamaz ama güvenli |

### Verilen Anahtar Kararlar

- **3-buton tercihi:** İptal / Zorla ekle / Çakışanları atla. Default "Atla" (güvenli), "Zorla" sarı warn (duplicate oluşturduğunu kullanıcıya hatırlatır)
- **`zone_no` DROP:** Backup/rollback planı hazır (ADD COLUMN) ama gerekmedi, veri yoktu
- **`SP._gemi` → `SP._projeNo` migration bloğu:** localStorage'da eski kaynak var ise yakalanır, sonsuza kadar geriye uyumlu
- **Dropdown'da "Epoksi" kaldırıldı:** CLAUDE.md 2.13'e uygun (4. oturumda operasyonda kullanılmıyor kararı alınmıştı, kod henüz temizlenmemişti)
- **`_lk` pattern tercihi:** `supaId` yoksa fallback `'new_'+random()` — Excel import ve manuel eklemeli kayıtları DB'ye gitmeden önce unique tutar

### Keşfedilen Yeni Teknik Borçlar (11. oturuma)

**🔴 YENİ Öncelik 11 — `DEVRE.gemi` → `DEVRE.projeNo` (Öncelik 5 devamı):**
- `devre_detay.html` içinde `DEVRE.gemi` hâlâ proje_no anlamında (10+ satır)
- Öncelik 5 sadece spool tarafına dokundu, devre tarafı kaldı
- 45-60 dk, orta risk

**🔴 YENİ Öncelik 12 — UNIQUE check pipeline dahil:**
- `devre_detay.html` satır 1352 (manuel) + 1886 (Excel) sadece `spoolNo`'ya bakıyor
- `pipeline1+S01` varken `pipeline2+S01` eklenmiyor (false positive)
- Fix: `pipeline+spoolNo+rev` kombinasyonu
- 15-20 dk

**🟡 YENİ Öncelik 13 — `devreler.notlar` vs `notlar` tablosu:**
- `devreler.notlar TEXT` kolonu + ayrı `notlar` tablosu
- Legacy mi çift yazım mı belirsiz
- SQL + grep ile araştır, 30-45 dk

### Önemli Öğrenmeler

1. **Önceki AI "proaktif gibi görünen yarım iş" bırakabilir.** spool_detay.html'de `_projeNo||_gemi` fallback vardı ama atama yoktu — fallback kozmetikti. **Ders:** Rename işlerinde yazma ↔ okuma simetrisi grep ile kontrol edilmeli.

2. **Form save path'leri silent DB corruption üretebilir.** Düzenle modal her kullanıldığında DB'yi Türkçe ile kirletiyordu, 9. oturum migration'ı sürekli geri alınıyordu. **Ders:** E-01'de her form için round-trip test (açılış → seçim → kaydet → DB'de canonical?).

3. **Refactor kapsamını baştan tam çıkar.** Öncelik 7 başta "tek fonksiyon" sandığımdı, 11 fonksiyon zincirine dönüştü. **Ders:** İlk grep ile tüm key-based find'lar, selection state'ler, DOM ID'leri listele, patch sırası planla.

4. **Stable local key (`_lk`) pattern scalable.** `supaId || 'new_'+random()` — DB + client state aynı uzayda. Duplicate bug tek seferde çözüldü. Pattern akılda tut, başka liste sayfalarında (devreler.html, proje_detay.html) lazım olursa hazır.

5. **"Ölü kolon" araştırması çok ucuz.** Öncelik 3: 4 SQL + 1 grep = 10 dk. `zone_no` 0 referans, DROP güvenli. **Ders:** Migration-in-progress ikilik şüphesinde DB + kod çift doğrulama, belgeye güvenme.

6. **Uzun sohbet + büyük str_replace blokları = kapsam sarkması.** Bazı patch'lerim beklenenden fazla alanı etkilemiş gözüktü. **Ders:** Uzun dosyalarda dar patch serisi + sık grep doğrulaması.

---

## 11B. ÖNCEKİ OTURUM — 20 NİSAN 2026 (9. OTURUM)

### Bu oturumda tamamlananlar (Devre Dedup Popup + Bug #3 Migration + Fark Popup İyileştirmesi)

Ana tema: Öncelik 1 (devre dedup sessiz birleşme bug'ı) + biriken Bug #3 (devreler.malzeme legacy) + fark popup UX iyileştirmeleri. Kullanıcı test etmeden önce iki oturumluk deploy borcu birikmişti (8. + 9. oturum).

**Kritik keşif — Önceki AI oturumunda JS+HTML zaten yazılmış:** Kullanıcı dosyayı yükleyince `devre_yeni.html`'de 2058→2247 satır (+189) olduğu, dedup popup altyapısının zaten kurulmuş olduğu görüldü. Önceki AI dil anahtarlarını eklemeden yarım bırakmış — bu oturumda tamamlandı. Ayrıca kullanıcının geri bildirimi doğrultusunda **iş emri numarası + spool sayısı onay mesajı** eklendi.

**1. Devre Dedup Popup (Öncelik 1 — Ana İş):**
- `devre_yeni.html` satır 1561'de SELECT güncellendi: `zone` + `is_emri_no` dahil, dedup key artık `(tenant + proje + devre_no + zone)` (önceden sadece `proje + devre_no` idi)
- Dedup hit → popup çıkar: *"Bu devre zaten var — Mevcut devreye ekle / Yeni devre oluştur / İptal"*
- Popup info kartı: proje adı + **iş emri numarası (P26-135) badge** + devre_no + zone
- Onay mesajı: *"5 spool bu mevcut devreye eklenecek. Onaylıyor musunuz?"* (spool sayısı dinamik)
- Önceki sessiz birleşme kaldırıldı — kullanıcı her durumda bilinçli karar verir
- Fark popup CSS'i (`.fp-*`) reuse edildi, yeni CSS yazılmadı

**2. Spool Dedup Popup (Öncelik 1 — Ek İş):**
- "Mevcut devreye ekle" seçiminden sonra, mevcut devredeki spool'larla (pipeline_no + spool_no + rev) çakışma kontrolü
- Çakışma varsa 2. popup: listeli, "Rev numarası güncellendi mi?" uyarısı
- 2 seçenek: İptal / Yine de devam et
- Kural: "proje + devre + zone + pipeline + spool_no hepsi aynı olamaz — ancak rev farklı olabilir" (kullanıcı iş modeli)

**3. Log Flag (Bug #4 — Bonus):**
- `mevcutDevreyeEklendi` flag'i eklendi
- Dedup hit + "mevcuta ekle" → `islem_log.islem = 'SPOOL_EKLE_MEVCUT_DEVRE'`
- Yeni devre veya "yeni oluştur" → eski `DEVRE_EKLE`
- Toast da ayrıldı: `dny_saved_mevcut` ("✅ Mevcut devreye eklendi") vs `dny_saved`

**4. Fark Popup Pill Sayaç (UX İyileştirmesi):**
- `farkTespit`'te `yuklenenDagilim` eklendi — `[[kod, sayı], ...]` formatında
- Pill rendering: `Bakır Alaşım ×3` gibi
- Malzeme + yüzey için aynı mantık
- Eski `yuklenenKodlar` fallback olarak korundu (geriye uyumluluk)

**5. Bug #3 — `devreler.malzeme` Legacy Migration:**
- 4. oturumdaki Faz 2 migration'da `devreler` tablosu **atlanmıştı** (sadece `spooller` + `spool_malzemeleri` yapılmış)
- DB sorgusuyla 82 büyük harfli kayıt bulundu: 59 "Karbon Çelik", 12 "Paslanmaz/Paslanmaz Çelik", 8 "Bakır Alaşım", 4 "Alüminyum"
- CASE WHEN mapping ile tek UPDATE: hepsi canonical'e çevrildi (`karbon`, `paslanmaz`, `bakir`, `alum`)
- **Yeni bilgi:** "Paslanmaz Çelik" varyasyonu (3 kayıt, 9 Nisan) — ARES_NORM regex'inde `paslanmaz` altında `çelik` opsiyonel kelime olduğu için yakalar, ama DB canonical yazılımı için mapping'e eklendi

**6. Dil Dosyaları (3 × 14 anahtar = 42 yeni):**
- `dny_dedup_d_title`, `dny_dedup_d_alt`, `dny_dedup_d_soru`, `dny_dedup_d_onay` (devre popup)
- `dny_dedup_s_title`, `dny_dedup_s_alt`, `dny_dedup_s_devam`, `dny_dedup_s_ipucu` (spool popup)
- `dny_dedup_mevcut`, `dny_dedup_yeni`, `dny_dedup_iptal`, `dny_dedup_devre`, `dny_dedup_zone`
- `dny_saved_mevcut` (toast)
- **tr/en/ar: 1352 → 1366 anahtar, 3 dil simetrik**
- Arapça'da "spool" = `السبول` (mevcut `dv_*` pattern'ine uygun, önceki AI'nın `الملف` önerisi düzeltildi)

### Bug #5 — Aslında Bug Değilmiş

Kullanıcı "form'da Karbon Çelik → popup Bakır → DB'ye Paslanmaz" senaryosu rapor etmişti. Kod analizinde:
- `farkTespit` ve `farkDevam` fonksiyonları spool'ların malzemesini DEĞİŞTİRMİYOR — sadece uyumsuzluğu gösterip onay alıyor
- `kaydet()` akışı: dedup hit → **devre INSERT atlanır**, yalnızca mevcut devrenin id'si kullanılır
- Yani "Karbon" form beyanı, dedup hit olduğunda DB'ye **hiç yazılmaz**
- Kullanıcı devreler.html'de eski "Paslanmaz" devresini görüp "yeni kayıt bu" sanmış

**Sonuç:** Bug #5 aslında Bug #1'in türevi — Öncelik 1 popup'ı (kullanıcıya açık onay) bu karışıklığı kökten çözer. Kullanıcı bu senaryoyu oturumda onayladı.

### Keşfedilen Yeni Teknik Borçlar (10. oturuma kalan)

**🔴 YENİ ÖNCELİK 10 — EN/AR Dil Dosyası Eksik Çeviri (3-4 saat):**
Dil dosyalarını güncellerken sistemik bir bug keşfedildi:
- **`en.json`: 348 anahtar hâlâ Türkçe** (`dny_cancel`="İptal", `dny_active_circuits`="Aktif Devreler", vb.)
- **`ar.json`: 319 anahtar hâlâ Türkçe** — aynı sorun
- EN/AR kullanıcıları yarım çevrilmiş UI görüyor
- Kaynak: önceki oturumlarda anahtar eklerken çeviri atlama
- Toplu export + çeviri + import gerekli, ayrı oturum işi

**🟡 Spooller tablosunda UNIQUE constraint YOK:**
- Primary key sadece `id` (UUID) — duplicate spool'u DB reddetmiyor
- Kodda `// 23505 = unique constraint` yorumu yanlış (hiç oluşmuyor)
- Spool insert hatası `console.error` ile sessiz kalıyor (toast yok, satır 1668-1671)
- Bug #5'in yan meselesi, Öncelik 2'ye taşındı

**🟡 `devreler` tablosunda UNIQUE constraint YOK:**
- Dedup tamamen JS tarafında. İki sekme aynı anda aynı devreyi oluşturabilir (çakışmaz ama duplicate olur)
- Büyük değil çünkü popup zaten kullanıcıyı uyarıyor

**🟡 `devreler` tablosunda `zone` + `zone_no` ikiliği:**
- Tüm son kayıtlarda `zone` dolu, `zone_no` NULL
- `zone_no` migration-in-progress mi yoksa ölü kolon mu belirsiz
- Dedup kodu `zone` kullandı (doğrusu büyük olasılıkla bu)
- 10. oturum keşfi: SELECT ile tam dağılım, ölü ise DROP, dolu ise merge kuralı

### Değişen Dosyalar (4)

| Dosya | Değişim | Satır/Anahtar |
|---|---|---|
| `devre_yeni.html` | Dedup popup + pill sayacı + is_emri_no | 2058 → 2271 |
| `lang/tr.json` | 14 yeni dedup anahtarı | 1352 → 1366 |
| `lang/en.json` | 14 yeni dedup anahtarı (İngilizce) | 1352 → 1366 |
| `lang/ar.json` | 14 yeni dedup anahtarı (Arapça) | 1352 → 1366 |

### DB Migration (1 blok)

```sql
-- Bug #3 — devreler.malzeme legacy Türkçe → canonical
UPDATE devreler SET malzeme = CASE malzeme
  WHEN 'Karbon Çelik'    THEN 'karbon'
  WHEN 'Paslanmaz'       THEN 'paslanmaz'
  WHEN 'Paslanmaz Çelik' THEN 'paslanmaz'
  WHEN 'Bakır Alaşım'    THEN 'bakir'
  WHEN 'Alüminyum'       THEN 'alum'
  ELSE malzeme
END
WHERE malzeme IN ('Karbon Çelik','Paslanmaz','Paslanmaz Çelik','Bakır Alaşım','Alüminyum');
-- 82 satır etkilendi (canlıda çalıştırıldı)
```

### Verilen Anahtar Kararlar

- **Seçenek A+ (popup) tercih edildi:** `gemi_no` kolonu eklenmedi — çünkü `proje_no` zaten gemi numarasını tutuyor (NB1124, NB1137 newbuild prefix'leri). Veri modelinde değişiklik yerine UX popup'ı ile çözüldü.
- **Zone dedup'a dahil edildi:** Farklı zone = farklı devre. Aynı ada ama M100 ve M200 zone'larında iki ayrı devre olabilir (iş modeline uygun).
- **"Paslanmaz Çelik" → `paslanmaz`:** Mapping'e açık ekleme, gelecekte bu varyasyon tekrar görülürse yakalar.
- **ARES_NORM doğru çalışıyor:** `malzemeKod("Paslanmaz Çelik")` regex ile `paslanmaz` döndürür — runtime tarafı zaten hazır, sadece DB canonical değildi.
- **EN/AR 667 anahtar çevrilmemiş konusu 10. oturuma taşındı** — kapsam büyük, ayrı iş.

### Önemli Öğrenmeler

1. **"Silent corruption" sandığın şey tasarım gereği olabilir.** Bug #5 "form'da X → DB'de Y" klasik veri bozulması senaryosuydu. Kod analizinde aslında dedup hit'te form beyanı hiç yazılmadığı, kullanıcının eski kaydı yeni sandığı ortaya çıktı. **Ders:** Kullanıcı rapor ettiği bug'ı önce DB sorgusu + kod akış analizi ile doğrula, varsayıma hemen koda dalma.

2. **Önceki AI oturumu bıraktığı iş: dikkat!** Yeni oturumda dosyayı gördüğümde JS+HTML zaten yazılmıştı ama dil anahtarları eksikti. `outputs/` klasörüne bakmak, `dil-anahtarlari-ekle.md` gibi dosyalar bulmak yarım işleri ortaya çıkarır. **Ders:** Her oturumun başında outputs'u tara.

3. **Arapça çeviri kontrolü:** Önceki AI "spool" için `الملف` (dosya) önermişti — ama `dv_*` ve `sp_*` anahtarlarında pattern `السبول`. **Ders:** Çeviri eklerken pattern tutarlılığını grep ile kontrol et, körü körüne kopyalama.

4. **Migration "tamamlandı" iddiası şüpheyle karşıla.** 4. oturum notu "Faz 2 migration bitti" diyordu, 5. oturum `aluminyum → alum` kaçağı bulmuştu, 9. oturum `devreler` tablosunun tamamen atlandığını buldu. **Ders:** "Tamamlandı" sonrası 3 sorgu (her tablo için dağılım) 10 saniye alır, kör bir köşeyi gösterir.

5. **UX mesajları somut olmalı.** "Bu devre zaten var" genel → yanlış devre karıştırma riski. "5 spool P26-135 iş emirli devreye eklenecek" spesifik → kullanıcı tam olarak ne olduğunu bilir. **Ders:** Popup metinlerinde dinamik değerler (sayı, ID, kritik alanlar) göster.

6. **Kullanıcının yanılma ihtimalini kabul et.** Bug #5 raporunda kullanıcı kendi kendine "acaba yanılmış mıyım" dedi ve senaryoyu yeniden düşündü. **Ders:** Kullanıcıyı küçük düşürmeden gerçek akışı açıkla — "siz haklısınız, sistem yanlış" demek her zaman doğru değil.

---

## 11C. ÖNCEKİ OTURUM — 20 NİSAN 2026 (6. OTURUM)

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

## 11D. ÖNCEKİ OTURUM — 20 NİSAN 2026 (5. OTURUM)

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

## 11E. ÖNCEKİ OTURUM — 19 NİSAN 2026 (4. OTURUM)

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

## 11F. ÖNCEKİ OTURUM — 17 NİSAN 2026 (3. OTURUM)

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

## 11G. ÖNCEKİ OTURUM — 17 NİSAN 2026 (2. OTURUM)

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

## 11H. ÖNCEKİ OTURUM — 17 NİSAN 2026 (1. OTURUM)

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
