# AresPipe — Claude Proje Bağlamı

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: 15 Nisan 2026

---

## 1. PROJE TANIMI

**AresPipe** — Tersane boru imalat takip sistemi.

**Stack:** Vanilla HTML/CSS/JS + Supabase (backend/DB/auth/storage) + Vercel (hosting)

**GitHub:** cihatoztas-ai/arespipe (public repo)

**URL:** arespipe.vercel.app

**Multi-tenant:** Her müşteri firma (`tenant`) kendi izole verisini görür. Supabase RLS ile korunur.

**Temel iş akışı:**
```
Proje → Devre → Spool → [Kesim → Büküm → Markalama → KK → Test → Sevkiyat]
```

---

## 2. MİMARİ KURALLAR

### 2.1 Flash Prevention — HER HTML SAYFASINDA ZORUNLU

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

**İstisnalar:** `giris.html`, `qr_tara.html`, `mobile/giris.html`, `mobile/qr.html`

### 2.2 Script Yükleme Sırası — ZORUNLU

**Web sayfaları:**
```html
<script src="ares-store.js"></script>
<script src="ares-lang.js"></script>
<script src="ares-layout.js"></script>
```

**Mobil sayfalar** (body sonunda, HEAD'de ASLA):
```html
<script src="../ares-store.js"></script>
<script src="../ares-lang.js"></script>
<script src="ares-mobile.js"></script>
```

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

**NOT:** `<html lang="tr" data-theme="dark">` HTML attribute'unda tırnak normaldir, ihlal değildir. Kural sadece CSS selector'larını kapsar.

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

```css
/* YASAK — her yerde, mobil dahil */
font-size: 9px;
font-size: 10px;
font-size: 11px;
font-size: 12px;
font-size: 13px;

/* DOĞRU */
font-size: 14px; /* minimum */
```

**İstisnalar (sadece bunlar):**
- PDF çıktı blokları — baskı layout'u
- `kurallar.html` demo alanları — kasıtlı gösterim
- Bu iki istisna dışında mobil dahil hiçbir yerde 14px altı kullanılmaz.

### 2.6 App Shell Yapısı (Web)

```html
<body>
  <div class="app-shell">
    <!-- sidebar ares-layout.js tarafından inject edilir -->
    <div class="main-content">
      <div class="page"><!-- sayfa içeriği --></div>
    </div>
  </div>
</body>
```

### 2.7 Auth Kontrolü (Kural A-01)

**Web:** `ares-layout.js`'deki `authKontrol()` — `sb-*-auth-token` localStorage key'ini kontrol eder.

**Mobil:** `mAuthKontrol()` `ares-mobile.js`'de — `mobile/giris.html`'e yönlendirir (`giris.html` değil, relative URL).

### 2.8 Supabase Bağlantısı (Kural S-01)

- `ARES.supabase()` kullanılır — `supabase.createClient()` KULLANILMAZ
- Mobilde `mSupabase()`, `mTenantId()`, `mOturum()` wrapper'ları kullanılır

### 2.9 Dil Kuralları

#### D-01: Çeviri Zorunluluğu — KESİN KURAL

**Her yeni veya güncellenen sayfada:**

HTML statik metinler → `data-i18n` zorunlu:
```html
<!-- YANLIŞ -->
<button>Kaydet</button>
<div class="baslik">Kullanıcılar</div>

<!-- DOĞRU -->
<button data-i18n="cmn_kaydet">Kaydet</button>
<div class="baslik" data-i18n="kul_title">Kullanıcılar</div>
```

JS dinamik içerik → `tv()` zorunlu:
```js
// YANLIŞ
el.innerHTML = '<div>Yükleniyor...</div>';

// DOĞRU
el.innerHTML = '<div>' + tv('genel_yukleniyor', 'Yükleniyor...') + '</div>';
```

**Bu kural atlanamaz.** Çeviri eksik sayfa teslim edilmez.

#### D-02: Child Element Kuralı

Child elementi olan elementlere `data-i18n` konulmaz.

```html
<!-- YANLIŞ -->
<button data-i18n="key">Metin <span id="badge">0</span></button>

<!-- DOĞRU -->
<button><span data-i18n="key">Metin</span> <span id="badge">0</span></button>
```

### 2.10 Feature Flag Sistemi ✅

`ARES.featureVar(kod)` — `tenant_features` tablosundan okur:
- `aktif: true` → özellik açık
- `aktif: false` veya kayıt yoksa → kapalı

Web'de doğrudan Supabase sorgusu, mobilde `mFeatureAktif(kod)` wrapper kullanılır.

**Aktif feature flag kodları:** `3d_model`, `ai_izometri`, `hakedis`, `musteri_portal`, `raporlar_gelismis`

### 2.11 Yetkilendirme Sistemi — Blok Tabanlı ✅

**15 Nisan 2026'da tamamlandı.**

#### Mimari

```
Katman 1 — Blok → sayfaya girebilir mi?
Katman 2 — bolumGorunur() → sayfa içinde bölüm gizlensin mi?
```

#### DB Tabloları

```
yetki_bloklari        — blok tanımları (sistem preset + firma özel)
blok_sayfa_yetkileri  — blok → sayfa eşleştirmesi + gizli_bolumler[]
kullanici_bloklar     — kullanıcı → blok atamaları
```

`yetki_bloklari` kolonları: `id`, `tenant_id`, `ad`, `aciklama`, `renk`, `sistem_preset`, `grup`, `sira`

#### ARES.SAYFA Sabitleri — Typo Koruması

```js
// Sayfa kodları ARES.SAYFA üzerinden kullanılır — string hardcode YASAK
ARES.SAYFA.KESIM          // 'kesim'
ARES.SAYFA.BUKUM          // 'bukum'
ARES.SAYFA.SPOOL_DETAY    // 'spool_detay'
// ... (ares-store.js içinde tam liste)
```

#### Kullanım

```js
// Sayfa guard — web (ares-layout.js otomatik yapar, data-sayfa ile)
if (!await ARES.sayfaYetkiKontrol(ARES.SAYFA.KESIM)) return;

// Eski sistem hâlâ çalışır (mevcut sayfalar bozulmaz)
if (!await ARES.sayfaYetkiKontrol(['yonetici', 'kk_uzmani'])) return;

// Bölüm gizleme
if (!await ARES.bolumGorunur(ARES.SAYFA.SPOOL_DETAY, 'islem_log')) {
  document.getElementById('islemLogSection').style.display = 'none';
}
```

#### Sayfa Guard — Merkezi (ares-layout.js)

Her sayfanın `<body>` tagine `data-sayfa` eklenir, guard otomatik çalışır:

```html
<body data-sayfa="kesim">
```

**⚠️ BEKLEYEN:** Tüm web sayfalarına `data-sayfa` eklenmesi — GitHub'dan zip alınınca toplu yapılacak. Sidebar'da yetkisiz linkler de aynı anda gizlenecek.

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

#### Cache

`_blokCache` — 15 dakika TTL. `ARES.yetkiCacheSifirla()` ile temizlenir.

### 2.12 Sayfa Teslim Kontrol Listesi — ZORUNLU (Kural G-01)

**Her yeni sayfa veya güncelleme tesliminde Claude şu listeyi işaretler ve eksik varsa teslim etmez:**

```
□ D-01: Tüm statik HTML metinlere data-i18n eklendi
□ D-01: Tüm dinamik JS metinlerde tv() kullanıldı
□ D-02: data-i18n child element kuralına uyuldu
□ F-01: Font-size 14px altı yok (PDF/demo istisnaları hariç)
□ CSS tırnak kuralı: [data-theme=dark] tırnak yok (CSS selector'da)
□ YASAK renkler kullanılmadı
□ history.back() yok
□ S-01: ARES.supabase() kullanıldı, supabase.createClient() yok
□ Script yükleme sırası doğru
□ Flash prevention var (giris.html ve istisna sayfaları hariç)
□ data-sayfa body tagine eklendi (web sayfaları)
□ CLAUDE.md Bölüm 10 Dosya Bazında Bekleyenler güncellendi
```

Bu liste atlanamaz. Eksik varsa önce tamamlanır, sonra dosya teslim edilir.

---

## 3. DİL SİSTEMİ

### 3.1 Tek Fonksiyon: tv()

```js
tv('anahtar_adi', 'Türkçe fallback')
```

### 3.2 Dil Dosyaları

```
lang/
  tr.json  — Türkçe — ~1129 anahtar
  en.json  — İngilizce — ~1782 anahtar
  ar.json  — Arapça — ~1782 anahtar (RTL destekli, mobilde aktif)
```

**Mobil prefix'leri:**
```
mob_nav_*    — Mobil navigasyon
mob_filtre_* — Filtre paneli
mob_stat_*   — Stat kartları
mob_dv_*     — mobile/devre_detay.html
mob_sp_*     — mobile/spool_detay.html
mob_durum_*  — Durum etiketleri
```

### 3.3 Anahtar Prefix Sistemi (Web)

```
nav_*, cmn_*, sp_*, dv_*, ks_*, bk_*, mk_*, kk_*, ts_*, log_*, sev_*, kul_*, izb_*
tanim_*  — tanimlar.html yetki blokları sekmesi (yeni)
```

### 3.4 vercel.json — Cache Kontrolü ✅

Tüm `.html`, `ares-*.js`, `ares-mobile.*`, `lang/*.json` — no-cache.

---

## 4. VERİTABANI

### 4.1 Aktif Tablolar

`tenants`, `kullanicilar`, `tersaneler`, `projeler`, `devreler`, `spooller`, `spool_malzemeleri`, `pipeline_malzemeleri`, `kesim_kalemleri`, `bukum_kalemleri`, `markalama_kalemleri`, `fotograflar`, `belgeler`, `notlar`, `islem_log`, `audit_log`, `kk_davetler`, `kk_davet_spooller`, `sevkiyatlar`, `sevkiyat_spooller`, `testler`, `test_spooller`, `basamak_tanimlari`, `basamak_sablonlari`, `sayac_tanimlari`, `feature_flags`, `tenant_features`, `firma_moduller`, `is_kayitlari`, `kullanici_yetkileri`, `yetki_tanimlari`, `feedback_kayitlari`, `customer_kullanicilar`, `customer_project_access`, **`yetki_bloklari`**, **`blok_sayfa_yetkileri`**, **`kullanici_bloklar`**

### 4.2 Kritik Kolon Adları (Supabase'de doğrulandı)

**spooller:**
- `dis_cap_mm` (cap_mm değil), `et_kalinligi_mm` (et_mm değil)
- `agirlik` (agirlik_kg boş), `rev` (revizyon değil)
- `durdurma_sebebi` (durdurma_aciklama değil)
- `alistirma` değerleri: `VAR` / `KISMI` / `YOK` (uppercase)
- `aktif_basamak` değerleri: `on_imalat`, `on_kontrol`, `kaynak`, `imalat`, `kk`, `sevkiyat`
- `ilerleme INTEGER DEFAULT 0` — kümülatif puan (0-100)
- `is_durumu TEXT` — `bekliyor` / `devam_ediyor`

**tenants:**
- `ilerleme_yontemi TEXT DEFAULT 'adet'` — `'adet'` veya `'agirlik'`
- `firma_tipi`: `imalat`, `montaj`, `imalat_montaj`, `tersane_tam`, `tersane_taseron`, `tersane_karma`, `diger`

**basamak_tanimlari:**
- `ilerleme_puani INTEGER DEFAULT 0`

**devreler:**
- `ad` (devre_adi değil), `durum`, `durdurma_sebebi`
- `termin` (DATE) — `termin_tarihi` silindi
- `ilerleme` kullanılmıyor — spooller.ilerleme ortalaması
- `agirlik` kullanılmıyor — spooller.agirlik toplamı

**fotograflar:**
- `dosya_url` (url değil), `yukleyen_id` (kullanici_id değil)
- `islem_turu` (asama değil), `spool_id` UUID

**yetki_bloklari:**
- `tenant_id` (NULL = sistem preset), `ad`, `aciklama`, `renk`
- `sistem_preset BOOLEAN` — true ise silinemez (trigger korumalı)
- `grup TEXT`, `sira INTEGER DEFAULT 0`

**kullanicilar:**
- `rol` CHECK: `super_admin`, `firma_admin`, `yonetici`, `kk_uzmani`, `operatör`, `musteri`

---

## 5. HESAPLAMALAR

### Ağırlık
`devreler.agirlik` KULLANILMAZ → `spooller.agirlik` toplamı

### İlerleme
`devreler.ilerleme` hep 0 → `spooller.ilerleme` ortalaması (puan bazlı 0-100)

**Adet bazlı:** `ORTALAMA(spooller.ilerleme)`
**Ağırlık bazlı:** `Σ(spool.agirlik × spool.ilerleme) / Σ(spool.agirlik)`

Hangi yöntem: firma iç → `tenants.ilerleme_yontemi`, müşteri → `customer_kullanicilar.ilerleme_yontemi`

### Alıştırma Agregasyonu
```js
if (agg.count > 0 && agg.varCount === agg.count) agg.alistirma = 'VAR';
else if (agg.varCount > 0 || agg.kismiCount > 0) agg.alistirma = 'KISMI';
else agg.alistirma = 'YOK';
```

---

## 6. RPC FONKSİYONLARI

### devre_istatistik(devre_ids uuid[])
Liste sayfalarında aggregate hesaplama. Nested join limiti yok.

```js
var { data } = await supa.rpc('devre_istatistik', { devre_ids: devreIdListesi });
```

---

## 7. DOSYA YAPISI

```
/
├── index.html
├── giris.html
├── devreler.html
├── devre_detay.html
├── spool_detay.html
├── proje_liste.html        ← Supabase entegrasyonu yok
├── proje_detay.html        ← Supabase entegrasyonu yok
├── qr_tara.html
├── is_baslat.html          ← yapılacak (yeni)
├── raporlar.html           ← sıfırdan yazılacak
├── malzeme.html            ← yapılacak (yeni)
├── [diğer web sayfaları]
├── ares-store.js           ← blok yetki motoru eklendi (v2.4)
├── ares-lang.js
├── ares-layout.js          ← merkezi sayfa guard eklendi
├── vercel.json
├── CLAUDE.md
├── CLAUDE-MOBILE.md
├── lang/
│   ├── tr.json
│   ├── en.json
│   └── ar.json
├── mobile/
│   ├── giris.html
│   ├── index.html
│   ├── devreler.html
│   ├── devre_detay.html
│   ├── spool_detay.html
│   ├── qr.html
│   ├── ares-mobile.js
│   └── ares-mobile.css
├── admin/
│   ├── panel.html
│   ├── firma.html
│   └── firma-detay.html
├── api/
│   ├── izometri-oku.js
│   └── sorgula.js
└── .github/
    ├── kurallar.json
    ├── kontrol.js
    └── workflows/kontrol.yml
```

---

## 8. KARARLAR VE MİMARİ NOTLAR

### Blok Tabanlı Yetki Sistemi (15 Nisan 2026)

Eski rol bazlı sistem (`sayfaYetkiKontrol(['yonetici'])`) korunuyor — mevcut sayfalar bozulmuyor. Yeni sayfalar string kod ile (`ARES.SAYFA.KESIM`) kullanır.

**Blok mantığı:** Bir kullanıcı birden fazla blok alabilir. Blokların sayfa listeleri birleşir. Gizli bölümler: tüm bloklarda gizliyse gizli kalır, herhangi birinde açıksa görünür.

**Firma özel blok:** Firma admini `tanimlar.html` → Yetki Blokları sekmesinden kendi bloklarını oluşturabilir. Sistem presetleri değiştirilemez/silinemez (DB trigger korumalı).

**Demo kullanıcılar (Demo Atölye tenant):**
| Email | Şifre | Bloklar |
|---|---|---|
| demo.yonetici@arespipe.dev | Demo1234! | Tüm bloklar |
| demo.imalatci@arespipe.dev | Demo1234! | İmalat + Markalama + Kesim |
| demo.testereci@arespipe.dev | Demo1234! | Kesim |
| demo.bukumcu@arespipe.dev | Demo1234! | Büküm |
| demo.kk@arespipe.dev | Demo1234! | KK + Sevkiyat |
| demo.malzeme@arespipe.dev | Demo1234! | Malzeme |

### RPC Kullanımı
Aggregate hesaplama gereken yerlerde RPC. Detay sayfaları için gerekli değil.

### Supabase Limiti
PostgREST default 1000 satır — nested join'den kaçın, direkt sorgu + limit kullan.

### is_durumu Akışı
```
on_imalat (bekliyor) → imalat/kaynak başlatınca → imalat (devam_ediyor) [PULSE]
                     → iş bitince → sonraki basamak (bekliyor)
```
Sadece `imalat` ve `kaynak` basamaklarında pulse animasyonu.

### Feature Flag
`tenant_features` tablosu — `ARES.featureVar(kod)` / `mFeatureAktif(kod)`

### İlerleme Hesaplama
`basamak_tanimlari.ilerleme_puani` — toplam 100 puan önerilir. Atlanılan basamak puanı sayılmaz.

---

## 9. SOHBET SONU GÜNCELLEME PROTOKOLÜ

Her sohbet bitiminde:

1. Yeni karar alındı mı? → Bölüm 8'e ekle
2. Tamamlanan var mı? → Bölüm 10'da `[x]` yap
3. Yeni sayfa eklendi mi? → Bölüm 7'yi güncelle
4. Veritabanı değişikliği? → Bölüm 4'ü güncelle
5. Yeni kural? → Bölüm 2'ye ekle
6. Son güncelleme tarihini değiştir

**Bu dosya güncel değilse bir sonraki sohbet bağlamsız başlar.**

---

## 10. DOSYA BAZINDA BEKLEYENLER

Bir dosya üzerinde çalışılırken bu bölüm kontrol edilmeli. Hazır dosya elindeyken ilgili görevler birlikte yapılır.

### Tüm web sayfaları — ACİL
- [ ] `<body data-sayfa="...">` eklenmesi — GitHub zip gelince toplu yapılacak
- [ ] Sidebar'da yetkisiz linkleri gizleme — aynı anda yapılacak
- [ ] Üst bilgi kutularında yazı boyutu/tipi standardize

### tanimlar.html
- [ ] Yetki Blokları sekmesi i18n eksik — `data-i18n` ve `tv()` eklenmeli (Kural G-01 ihlali)

### kullanici_detay.html
- [ ] Yetkiler sekmesi i18n eksik — `data-i18n` ve `tv()` eklenmeli (Kural G-01 ihlali)

### devreler.html
- [ ] Yüzey filtresi iyileştirmesi

### devre_detay.html
- [ ] 📋 Başlık formatı: Tersane / Gemi No / Devre Adı / Zone
- [ ] 🐛 Kesim listesine geçişte hata

### spool_detay.html
- [ ] is_durumu alanı tracker'da gösterilmeli

### kesim.html
- [ ] 🐛 Kesim listesine geçişte hata (devre_detay ile bağlantılı)

### proje_liste.html / proje_detay.html
- [ ] Supabase entegrasyonu yok — sıfırdan yazılacak
- [ ] 🐛 Proje ilerleme sistemi çalışmıyor

### malzeme.html
- [ ] Yazılacak — devre bazlı malzeme hazırlama listesi

### admin/panel.html
- [ ] 🐛 Geri bildirim fotoğrafları süper admin'e iletilmiyor

### api/izometri-oku.js
- [ ] 🐛 502 Bad Gateway

### mobile/devreler.html
- [ ] ASAMA_PCT kaldırılıp spooller.ilerleme kullanılmalı
- [ ] devre_istatistik RPC'ye geçiş

### mobile/devre_detay.html
- [ ] is_durumu pulse animasyonu eklenmeli

### mobile/is_baslat.html
- [ ] Kodlanacak — mockup onaylandı, personel yetki sistemi hazır

---

## 11. SON OTURUM — 15 NİSAN 2026

### Tamamlananlar
- Blok tabanlı yetki sistemi tasarlandı ve kuruldu (DB + motor + UI)
- `yetki_bloklari`, `blok_sayfa_yetkileri`, `kullanici_bloklar` tabloları oluşturuldu
- 11 sistem preset bloğu eklendi, `grup` ve `sira` kolonları eklendi
- Sistem presetleri için DB trigger eklendi (silinemez koruma)
- `ares-store.js` v2.4 — `sayfaYetkiKontrol()` dual-mode, `bolumGorunur()`, `kullaniciBloklari()`, `tumBloklar()`, `ARES.SAYFA` sabitleri, 15dk cache TTL
- `ares-layout.js` — merkezi sayfa guard (`data-sayfa` attribute)
- `kullanici_detay.html` — Yetkiler sekmesi blok sistemine geçirildi, gruplu görünüm
- `tanimlar.html` — Yetki Blokları sekmesi eklendi (blok CRUD, sayfa yönetimi, gruplu liste)
- Demo kullanıcılar oluşturuldu (6 adet, Demo Atölye tenant)
- Sayfa Teslim Kontrol Listesi kuralı eklendi (Kural G-01)

### Bekleyen
- Tüm sayfalara `data-sayfa` eklenmesi (zip gelince)
- Sidebar yetki filtresi (aynı anda)
- `mobile/devreler.html` RPC geçişi
- `mobile/devre_detay.html` pulse animasyonu
- `mobile/is_baslat.html` kodlanması
- `tanimlar.html` ve `kullanici_detay.html` i18n eksikleri
