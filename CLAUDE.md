# AresPipe — Claude Proje Bağlamı

> **⚠️ OTURUM BAŞLANGICI — BU BLOK ATLANMAZ**
>
> Bu dosya her oturum başında okunuyor. İlk 40 satır mekanik bir ritüel — Claude dahil kimse atlamıyor. Sebep: 22 oturumluk çalışmada "hatırlıyorum, kontrol etmeme gerek yok" tutumu 10 günlük yerinde sayma yarattı (detay: `.github/son-durum.md`). Artık makineye güveniyoruz, ezbere değil.

---

## 🔒 ZORUNLU OTURUM BAŞLANGIÇ RİTÜELİ

**Claude:** Oturumun ilk mesajında, başka hiçbir iş yapmadan önce aşağıdaki 4 soruyu kullanıcıya sor. Cevaplar gelmeden teknik iş başlamaz. Kullanıcı "atla, acelem var" dese bile ısrar et — 30 saniyelik iş, kurulmuş disiplin.

```
Oturum başlangıç ritüeli. 4 kısa kontrol:

1. Şunu çalıştırır mısın ve çıktıyı yapıştırır mısın:
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3

2. GitHub Actions sekmesinde son build rengi nedir? (yeşil / sarı / kırmızı)

3. .github/son-durum.md dosyasını bana yükler misin veya içeriğini yapıştırır mısın?

4. Bugün hangi sayfayla çalışacağız? (Sayfayı söyle, açık uyarıları göstereyim.)
```

**Bu 4 cevap geldikten sonra Claude şunu yapar:**
- Git durumu temiz mi kontrol eder (stash kalıntısı, commitlenmemiş değişiklik yok mu)
- CI rengi yeşil değilse önce onu düzeltir
- son-durum.md'den son oturum özetini + açık borçları okur
- **`docs/CIHAT-PROFIL.md`'yi okur** (kullanıcının çalışma tarzını, tercihlerini, allerjilerini hatırlamak için — Cihat'a "nasıl çalışıyoruz" diye sordurmaz, kendi okur)
- **`docs/SPOOL-AI-VIZYON.md`'yi hatırlar** (gündelik iş vizyona hizmet ediyor mu?)
- **`docs/PANO-TASARIM.md`'yi kontrol eder** (24+ oturumda pano implementasyonu gündemde)
- Kullanıcı söylediği sayfa için açık uyarı listesini `kurallar.json`'dan eşleştirir, "bugün bu uyarıları da düzeltelim mi?" diye sorar

---

## 🔒 OTURUM SONU KAPANIŞI (her oturum bitiminde)

**Claude:** Oturumun kapanırken **mutlaka** şunu yapar:
1. `.github/son-durum.md`'i günceller (CI son durum, kural sayısı, açık borç, yapılanlar, sonraki oturum notu)
2. `CLAUDE-SON-OTURUM.md` yazar (detaylı özet)
3. `CLAUDE-SONRAKI-OTURUM.md` yazar (bir sonraki oturum gündemi)
4. Bu 3 dosyayı `present_files` ile kullanıcıya verir
5. Kullanıcıya şu cümleyi söyler: **"Bu 3 dosyayı GitHub'a yükle, CI çalışsın, yeşil göresin. Sonra molana gidebilirsin."**

---

## 🔒 KURAL ÇAKIŞMASI DURUMU

**Claude:** Kullanıcı yeni bir istek söylediğinde, Claude bu istek **önceki bir kural ile çelişiyor mu** diye kontrol eder. Kontrol yolu:
- `kurallar.json`'a bakar
- `docs/rules/` altındaki (varsa) ilgili dosyaya bakar
- Önceki 2 oturum özetine bakar (`son-durum.md` + `CLAUDE-SON-OTURUM.md`)

Çakışma varsa **sessizce eski kuralı çiğneyerek yeni iş yapmaz.** Şunu söyler:

> "Dikkat: isteğin X kuralıyla çelişiyor. Üç seçenek var:
> (A) X kuralını güncelleyelim (eski uygulanmış yerlere etkisi olabilir, kontrol edelim)
> (B) Bu sayfa için istisna ekleyelim (X kuralı genel kalır)
> (C) İsteği iptal edelim (X kuralı doğru kalır)
> Hangisi?"

---

## 🔒 YENİ KURAL EKLEME PROTOKOLÜ

**Claude:** Oturumda "bundan sonra hep şöyle olsun" ifadesi geçerse yeni kural işareti. Claude üç iş yapar:
1. `.github/kurallar.json`'a kural ekler (yeni kurallar `"siddet": "uyari"` ile başlar)
2. `.github/bozuk-ornekler/` altına kasten ihlal eden test dosyası yazar + `beklenen-hatalar.json`'u günceller
3. Yerel self-test koşturur: `node .github/kontrol.js --self-test`

Self-test yeşil olmadan "tamam, ekledim" demez.

---

## 🔒 HER 5 OTURUMDA BİR SAĞLIK KONTROLÜ

**Claude:** Son oturum sayısı 5'in katıysa (28, 33, 38...) kullanıcıya söyle:

> "Bu 5. oturum — self-test günü. Lütfen çalıştır: `node .github/kontrol.js --self-test`. Çıktısında '3/3 başarılı' olmasını bekliyoruz."

Çıktı temiz değilse o oturum Faz B kuralları bozulmuş demektir — diğer işleri bırak, önce kuralları tamir et.

---

## 🔒 ACİL DURUM BYPASS (nadiren)

Kritik bir hata varsa ve CI kırmızıyken yükleme zorunluysa: commit mesajına `[skip ci]` yazılır. Ama bu acil durum özelliği — bir oturumda 1 defadan fazla kullanılırsa sistemde bir şey bozuk demektir, Claude kullanıcıya söyler.

---

## 🔒 RİTÜEL TESTİ

Bu bloğu gören Claude, kullanıcının ilk "merhaba"sından sonra ritüeli başlatırsa sistem çalışıyor demektir. Aksi halde bu blok okunmadı demek — kullanıcı şöyle der: **"Ritüeli atladın, başlama."**

---

> Son güncelleme: 23 Nisan 2026 — 23. oturum (Faz B kurucu oturum) — CLAUDE sapmama protokolü aktif edildi.

---

_(Aşağıda proje bağlamı devam eder — Bölüm 1, 2, 3, ...)_


> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: 23 Nisan 2026 (23. oturum KAPATILDI — Faz B: Sapmama sistemi kuruldu, Pano tasarımı yapıldı. `.github/kontrol.js` regex + self-test + i18n destekli yeniden yazıldı, 14 aktif kural, 3 bozuk-örnek test dosyası, `.github/son-durum.md` kurumu. CI baseline: 0 hata / 22 uyarı / 74 dosya. Sapmama protokolü CLAUDE.md'nin tepesine ZORUNLU RİTÜEL olarak gömüldü. **Yeni belgeler:** `docs/SPOOL-AI-VIZYON.md` (ürün vizyonu), `docs/PANO-TASARIM.md` (Süper Admin Yönetim Panosu — 24. oturumda implement), `docs/CIHAT-PROFIL.md` (Cihat'ı tanımak için Claude'un not dosyası). 22. oturum [Faz A Faz 2 — tanimlar.html Malzeme Havuzu] Bölüm 11'de duruyor.)

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


## 11. OTURUM KAYITLARI

**Güncel oturum durumu, açık işler, CI sağlığı:** `.github/son-durum.md`
Bu dosya her oturum başında Claude tarafından zorunlu olarak okunur. Son oturumun detaylı özetini, bekleyen borçları ve bir sonraki oturumun gündemini içerir.

**Geçmiş oturum detayları (1-22. oturumlar):** `docs/sessions/archive-01-22.md`
Eskiden bu dosyanın Bölüm 11 ve alt bölümlerinde (11A-11H) tutulan eski oturum kayıtları 26. oturumda arşive taşındı. CLAUDE.md'nin fiziksel ağırlığını azaltmak, odağı aktif kurallarda ve belgelerde tutmak için.

**Oturum 23-25 özetleri:** şu an `.github/son-durum.md` içinde kümelenmiş; zamanla arşive göçecek (23-50 toplu arşivi gibi).

**Kapanış protokolü (oturum başına tek iş):** kapanışta Claude sadece `son-durum.md`'yi günceller. CLAUDE.md dokunulmaz — sistemsel kural değişikliği olmadıkça. Bu değişiklik 26. oturumda uygulandı.
