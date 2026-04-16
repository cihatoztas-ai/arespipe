# AresPipe — Claude Proje Bağlamı

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: 16 Nisan 2026

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

**Not:** Mobil React uygulamasında bu kural UYGULANMAZ — React kendi lifecycle'ını yönetir.

### 2.2 Script Yükleme Sırası — WEB SAYFALARINDA ZORUNLU

```html
<script src="ares-store.js"></script>
<script src="ares-lang.js"></script>
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

### 2.9 Dil Kuralları (Web için)

#### D-01: Çeviri Zorunluluğu

HTML statik metinler → `data-i18n` zorunlu
JS dinamik içerik → `tv()` zorunlu

#### D-02: Child Element Kuralı

Child elementi olan elementlere `data-i18n` konulmaz.

### 2.10 Feature Flag Sistemi ✅

`ARES.featureVar(kod)` — `tenant_features` tablosundan okur.

**Aktif feature flag kodları:** `3d_model`, `ai_izometri`, `hakedis`, `musteri_portal`, `raporlar_gelismis`

### 2.11 Yetkilendirme Sistemi — Blok Tabanlı ✅

**15 Nisan 2026'da tamamlandı.**

#### DB Tabloları
```
yetki_bloklari        — blok tanımları (sistem preset + firma özel)
blok_sayfa_yetkileri  — blok → sayfa eşleştirmesi + gizli_bolumler[]
kullanici_bloklar     — kullanıcı → blok atamaları
```

#### Sistem Presetleri (Silinemez — Trigger Korumalı)

| Blok | Grup |
|---|---|
| Kesim | Kesim |
| İmalat | İmalat |
| Kaynak | Kaynak |
| Büküm | Büküm |
| Markalama | İmalat |
| Kalite Kontrol | Kalite |
| Malzeme | Lojistik |
| Sevkiyat | Lojistik |
| Raporlar | Yönetim |
| Kullanıcı Yönetimi | Yönetim |
| Tanımlar | Yönetim |

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
□ Script yükleme sırası doğru
□ Flash prevention var
□ data-sayfa body tagine eklendi
```

**Mobil React sayfaları için:** CLAUDE-MOBILE.md'deki checklist geçerlidir.

---

## 3. DİL SİSTEMİ

### 3.1 Tek Fonksiyon: tv()

```js
tv('anahtar_adi', 'Türkçe fallback')
```

### 3.2 Dil Dosyaları

```
lang/
  tr.json  — Türkçe
  en.json  — İngilizce
  ar.json  — Arapça (RTL destekli)
```

---

## 4. VERİTABANI

### 4.1 Aktif Tablolar

`tenants`, `kullanicilar`, `tersaneler`, `projeler`, `devreler`, `spooller`, `spool_malzemeleri`, `kesim_kalemleri`, `bukum_kalemleri`, `markalama_kalemleri`, `fotograflar`, `notlar`, `islem_log`, `kk_davetler`, `sevkiyatlar`, `testler`, `basamak_tanimlari`, `tenant_features`, `yetki_bloklari`, `blok_sayfa_yetkileri`, `kullanici_bloklar`

### 4.2 Kritik Kolon Adları

**spooller:**
- `dis_cap_mm` (cap_mm değil), `et_kalinligi_mm` (et_mm değil)
- `agirlik` (agirlik_kg boş), `rev` (revizyon değil)
- `durdurma_sebebi` (durdurma_aciklama değil)
- `alistirma` değerleri: `VAR` / `KISMI` / `YOK` (uppercase)
- `aktif_basamak` değerleri: `on_imalat`, `on_kontrol`, `kaynak`, `imalat`, `kk`, `sevkiyat`
- `ilerleme INTEGER` — kümülatif puan (0-100)
- `is_durumu TEXT` — `bekliyor` / `devam_ediyor`
- `spool_id TEXT` — kısa görüntü ID (ör. "0431"), UUID değil

**fotograflar:**
- `dosya_url` (url değil), `yukleyen_id` (kullanici_id değil)
- `islem_turu` (asama değil), `spool_id` UUID

**notlar:**
- `metin` (icerik değil), `ekleyen_id` (yapan_id değil)
- `qr_goster BOOLEAN`, `silindi BOOLEAN`

**devreler:**
- `ad` (devre_adi değil)
- `termin` (DATE) — `termin_tarihi` silindi
- `ilerleme` kullanılmıyor — spooller.ilerleme ortalaması

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
├── ares-store.js, ares-lang.js, ares-layout.js
├── vercel.json
├── CLAUDE.md
├── CLAUDE-MOBILE.md
├── lang/
│   ├── tr.json, en.json, ar.json
├── mobile/                          ← React uygulaması (arespipe-mob.vercel.app)
│   ├── src/
│   │   ├── main.jsx                 ← BrowserRouter
│   │   ├── App.jsx                  ← Routes + auth guard
│   │   ├── index.css                ← CSS değişkenleri + reset
│   │   ├── lib/
│   │   │   ├── supabase.js          ← Supabase client
│   │   │   └── auth.js              ← getOturum(), getTenantId()
│   │   ├── screens/
│   │   │   ├── Giris.jsx            ✅ Tamamlandı
│   │   │   ├── Anasayfa.jsx         ⏳ Placeholder
│   │   │   ├── Devreler.jsx         ⏳ Placeholder
│   │   │   └── IsBaslat.jsx         ⏳ Placeholder
│   │   └── components/              ← Ortak componentler
│   ├── package.json
│   └── vite.config.js
├── admin/
└── api/
```

---

## 8. KARARLAR VE MİMARİ NOTLAR

### Blok Tabanlı Yetki Sistemi (15 Nisan 2026)

Eski rol bazlı sistem korunuyor. Yeni sayfalar string kod ile kullanır.

**Demo kullanıcılar (Demo Atölye tenant):**
| Email | Şifre | Bloklar |
|---|---|---|
| demo.yonetici@arespipe.dev | Demo1234! | Tüm bloklar |
| demo.imalatci@arespipe.dev | Demo1234! | İmalat + Markalama + Kesim |
| demo.testereci@arespipe.dev | Demo1234! | Kesim |
| demo.bukumcu@arespipe.dev | Demo1234! | Büküm |
| demo.kk@arespipe.dev | Demo1234! | KK + Sevkiyat |
| demo.malzeme@arespipe.dev | Demo1234! | Malzeme |

### Mobil React Mimarisine Geçiş (16 Nisan 2026)

**Karar:** Mobil taraf vanilla HTML/JS'den React + Vite'a geçirildi.

**Nedenler:**
- Vanilla'da iOS viewport, event listener birikimi, state dağınıklığı sorunları çözümsüz kalıyordu
- React component lifecycle bu sorunları framework seviyesinde çözüyor
- Gelecekteki Capacitor (native app) geçişi React ile çok daha kolay

**Mimari:**
- Web tarafı (`arespipe.vercel.app`) değişmedi — vanilla HTML/JS olarak kalır
- Mobil taraf (`arespipe-mob.vercel.app`) ayrı Vercel projesi — React
- Aynı Supabase, aynı DB, aynı renk sistemi

**Deployment:**
- Mobil için ayrı Vercel projesi: `arespipe-mob`
- Root Directory: `mobile/`
- Her `git push` → otomatik deploy

### is_durumu Akışı
```
bekliyor → işe başlayınca → devam_ediyor → iş bitince → bekliyor
```

### Mükerrer İş Önleme (Planlandı)
Spool tarandığında `is_durumu === 'devam_ediyor'` ise uyarı göster, işe başlatma.

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
- [ ] `kullanici_detay.html` — Yetkiler sekmesi i18n eksik
- [ ] `proje_liste.html` / `proje_detay.html` — Supabase entegrasyonu yok
- [ ] `malzeme.html` — yazılacak
- [ ] `api/izometri-oku.js` — 502 Bad Gateway

### Mobil React sayfaları
- [ ] `Anasayfa.jsx` — gerçek içerik yazılacak
- [ ] `Devreler.jsx` — devre listesi
- [ ] `IsBaslat.jsx` — operatör iş akışı (mockup onaylandı)
- [ ] `DeveDetay.jsx`, `SpoolDetay.jsx`, `QRTara.jsx` — yazılacak
- [ ] Tema/dil state'i React Context'e taşınacak
- [ ] `useNavigate` hook'u ile navigasyon

---

## 11. SON OTURUM — 16 NİSAN 2026

### Tamamlananlar
- Mobil mimari React + Vite'a geçirildi
- `arespipe-mob.vercel.app` ayrı Vercel projesi kuruldu
- `mobile/src/lib/supabase.js` — Supabase client
- `mobile/src/lib/auth.js` — auth helpers
- `mobile/src/screens/Giris.jsx` — giriş ekranı (eski tasarımla uyumlu, çalışıyor)
- Vercel deployment pipeline kuruldu (git push → otomatik deploy)
- PWA/App Store yol haritası netleştirildi

### Bekleyen
- `Anasayfa.jsx`, `Devreler.jsx`, `IsBaslat.jsx` ekranlarının yazılması
- Tema/dil yönetimi React Context'e alınması
- Tüm web sayfalarına `data-sayfa` eklenmesi
