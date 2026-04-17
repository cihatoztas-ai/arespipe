# AresPipe — Claude Proje Bağlamı

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: 17 Nisan 2026 (2. oturum)

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
□ Script yükleme sırası doğru
□ Flash prevention var
□ data-sayfa body tagine eklendi
```

**Mobil React sayfaları için:** CLAUDE-MOBILE.md'deki checklist geçerlidir.

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
  tr.json  — Türkçe (web)
  en.json  — İngilizce (web)
  ar.json  — Arapça (RTL destekli, web)
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

**kullanicilar (17 Nisan 2026 — 2. oturum notu):**
- `ad_soyad` (ad değil!) — hata kaynağı, dikkat
- `foto_url TEXT` — avatar için (upload UI henüz yok)
- `email`, `rol`, `tenant_id`, `firma`, `brans`, `tel`, `ui_tercihleri JSONB`
- `tenants(ad)` JOIN'i bazı RLS kombinasyonlarında 400 döndürür → tenant adını ayrı sorguyla çek

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
├── ares-store.js, ares-lang.js, ares-layout.js
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
- [ ] `kullanici_detay.html` — Yetkiler sekmesi i18n eksik
- [ ] `proje_liste.html` / `proje_detay.html` — Supabase entegrasyonu yok
- [ ] `malzeme.html` — yazılacak
- [ ] `api/izometri-oku.js` — 502 Bad Gateway
- [ ] **Yeni kaynak blokları UI'ya yansıma kontrolü** — Tanımlar sayfasında Argon/Gazaltı görünüyor mu?

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

## 11. SON OTURUM — 17 NİSAN 2026 (2. OTURUM)

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

## 11A. ÖNCEKİ OTURUM — 17 NİSAN 2026 (1. OTURUM)

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
