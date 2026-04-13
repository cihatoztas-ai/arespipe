# AresPipe — Claude Proje Bağlamı

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: Nisan 2026

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
  var t=localStorage.getItem('ares_theme')||'dark';
  var l=localStorage.getItem('ares_lang')||'tr';
  document.documentElement.setAttribute('data-theme',t);
  document.documentElement.setAttribute('lang',l);
  document.documentElement.style.visibility='hidden';
})()</script>
```

**İstisnalar:** `giris.html`, `qr_tara.html` (kendi özel layout'u var)

### 2.2 Script Yükleme Sırası — ZORUNLU

```html
<script src="ares-store.js"></script>
<script src="ares-lang.js"></script>
<script src="ares-layout.js"></script>
```

Admin klasöründe: `../ares-store.js`, `../ares-lang.js`, `../ares-layout.js`

**ares-lang.js OLMADAN sayfaya çeviri çalışmaz.**

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
  --bg: #0d1117;
  --sur: #161b24;
  --sur2: #1c2333;
  --bor: #262f3e;
  --tx: #e6ecf4;
  --txd: #6b7a90;
  --txm: #94a3b8;
}
[data-theme=light-anthracite] {
  --bg: #d8dde4;
  --sur: #e4e9ef;
  --sur2: #d0d7e0;
  --bor: #bcc5d0;
  --tx: #141e2b;
  --txm: #3a4f63;
  --txd: #637080;
}
```

**YASAK renkler:** `#3b82f6`, `#22c55e`, `#0a0b0e`, `#10b981`, `#0d0f1a`

**YASAK tema seçiciler:**
- `[data-theme="light"]`, `[data-theme="slate"]`, `[data-theme="navy"]`
- `:root[data-theme="dark"]` sözdizimi — doğrusu `[data-theme=dark]`
- CSS attribute seçicilerinde tırnak kullanma: `[data-theme="dark"]` değil `[data-theme=dark]`

### 2.4 Sol Kenar Renk Sistemi (Kural B-01)

```css
.cl-ac  { border-left: 3px solid var(--ac)   !important; }
.cl-gr  { border-left: 3px solid var(--gr)   !important; }
.cl-re  { border-left: 3px solid var(--re)   !important; }
.cl-warn{ border-left: 3px solid var(--warn) !important; }
.cl-leg { border-left: 3px solid var(--leg)  !important; }
```

### 2.5 Font Size Kuralı

Minimum font-size: `14px`. `px14px` geçersiz CSS — tarayıcı yok sayar.

### 2.6 App Shell Yapısı

```html
<body>
  <div class="app-shell">
    <!-- sidebar ares-layout.js tarafından inject edilir -->
    <div class="main-content">
      <div class="page">
        <!-- sayfa içeriği -->
      </div>
    </div>
  </div>
</body>
```

### 2.7 Auth Kontrolü (Kural A-01)

`ares-layout.js`'deki `authKontrol()` Supabase native token'ını kontrol eder:
- `sb-*-auth-token` localStorage key'ini arar
- `access_token` yoksa `giris.html`'e yönlendirir
- Admin/portal klasöründeyse `../giris.html`'e yönlendirir

### 2.8 Supabase Bağlantısı (Kural S-01)

- Admin/portal sayfalarında `supabase.createClient()` KULLANILMAZ
- `ARES.supabase()` kullanılır — ares-store.js zaten yönetir
- Sayfa yüklenirken değil, ilk kullanımda başlatılır (lazy init):

```js
var _supa = null;
function _getSupa() {
  if (!_supa && typeof ARES !== 'undefined') _supa = ARES.supabase();
  return _supa;
}
```

### 2.9 data-i18n Kuralı (Kural D-02)

Child elementi olan elementlere `data-i18n` konulmaz. `ares-lang.js` `textContent` set edince child elementler silinir.

**YANLIŞ:**
```html
<button data-i18n="key">Metin <span id="badge">0</span></button>
```

**DOĞRU:**
```html
<button><span data-i18n="key">Metin</span> <span id="badge">0</span></button>
```

---

## 3. DİL SİSTEMİ

### 3.1 Tek Fonksiyon: tv()

```js
tv('anahtar_adi', 'Türkçe fallback')
```

`t()` fonksiyonu KULLANILMAZ — ares-layout.js içindeki eski sistem, kaldırılacak.

### 3.2 Dil Dosyaları

```
lang/
  tr.json  — Türkçe (primary, implicit) — şu an 1043 anahtar
  en.json  — İngilizce — şu an 1656 anahtar
  ar.json  — Arapça — şu an 1656 anahtar (test amaçlı, RTL desteği yok)
```

**tr.json notu:** Türkçe için ares-layout.js JSON yüklemez, HTML içi metinleri kullanır. tr.json referans ve ileri uyumluluk için tutulur.

### 3.3 Anahtar Prefix Sistemi

```
nav_*   — Sidebar navigasyon
cmn_*   — Ortak (malzeme, durum, buton, tablo başlıkları)
sp_*    — spool_detay.html
dv_*    — devre_detay.html
ks_*    — kesim.html
bk_*    — bukum.html
mk_*    — markalama.html
kk_*    — kalite_kontrol.html
ts_*    — testler.html
log_*   — log.html
sev_*   — sevkiyatlar.html
kul_*   — kullanicilar.html
izb_*   — izometri-batch.html
```

### 3.4 Nav Anahtarları Kuralı

NAV tanımında her item'ın `i18n` key'i olmalı. Eksik olursa o item hiç çevrilmez.

```js
{ type: 'item', key: 'izobatch', label: 'İzometri Batch', i18n: 'nav_izobatch', href: '...' }
```

### 3.5 Sidebar Çeviri Sistemi

Sidebar `ares-layout.js`'in `window.t()` fonksiyonunu kullanır (ares-lang.js'in `window.tv()`'sinden farklı). Bu eski sistem — ileride `tv()`'ye geçilecek.

### 3.6 vercel.json — Cache Kontrolü (YAPILACAK)

`ares-lang.js` ve `lang/*.json` no-cache eklenecek. Şu an eksik.

---

## 4. VERİTABANI

### 4.1 Aktif Tablolar

`tenants`, `kullanicilar`, `tersaneler`, `projeler`, `devreler`, `spooller`, `spool_malzemeleri`, `pipeline_malzemeleri`, `kesim_kalemleri`, `kesim_listeleri`, `bukum_kalemleri`, `markalama_kalemleri`, `markalama_listeleri`, `markalama_listesi_kalemleri`, `fotograflar`, `belgeler`, `notlar`, `islem_log`, `audit_log`, `kk_davetler`, `kk_davet_spooller`, `sevkiyatlar`, `sevkiyat_spooller`, `testler`, `test_spooller`, `egitim_verisi`, `basamak_tanimlari`, `basamak_sablonlari`, `sayac_tanimlari`, `feature_flags`, `tenant_features`, `firma_moduller`, `is_kayitlari`, `kullanici_yetkileri`, `yetki_tanimlari`, `customer_kullanicilar`, `customer_project_access`

### 4.2 Beklemedeki Tablolar

| Tablo | Durum | Ne Zaman |
|---|---|---|
| `hakedis_paketleri/spooller/kriterleri` | UI yok | hakedis.html yazılınca |
| `tarama_sonuclari` | 3D cihaz entegrasyonu | Cihaz gelince |
| `tersane_firma_iliskileri` | Multi-tenant taşeron | Geliştirme listesinde |
| `ai_analizler` | FAZ 2'de aktif olacak | Pipeline kurulunca |
| `rol_sablonlari` | Yetki sistemi | Rol UI yazılınca |

### 4.3 egitim_verisi Tablosu

Mevcut kolonlara eklenecekler:
```sql
kaynak_tipi    -- 'spool_foto'|'serbest_foto'|'tersane_geri_bildirim'|'arsiv'|'standart'|'dxf'|'video'
egitim_durumu  -- 'bekliyor'|'onaylandi'|'kullanildi'|'silinecek'
dogrulayici_id -- yetkili kişi UUID
onay_sayisi    -- 1 yeterli (1 yetkili + süper admin final kontrol)
```

### 4.4 tersaneler Tablosu

Eklenecek kolon:
```sql
format_profili JSONB  -- tersane izometri format bilgisi
```

---

## 5. SAYFA ENVANTERİ

### 5.1 Aktif ve Temiz Sayfalar

| Sayfa | Flash | lang.js | Renk | Dil | Durum |
|---|---|---|---|---|---|
| `giris.html` | ✅ | — | ✅ | — | Temiz |
| `index.html` | ✅ | ✅ | ✅ | — | Ölü tema CSS var |
| `devreler.html` | ✅ | ✅ | ✅ | — | Temiz |
| `devre_detay.html` | ✅ | ✅ | ✅ | — | Temiz |
| `devre_yeni.html` | ✅ | ✅ | ✅ | — | Temiz |
| `spool_detay.html` | ✅ | ✅ | ✅ | — | URL param fix gerekli |
| `kesim.html` | ✅ | ✅ | ✅ | ✅ | Temiz |
| `bukum.html` | ✅ | ✅ | ✅ | — | Temiz |
| `markalama.html` | ✅ | ✅ | ✅ | — | Temiz |
| `kalite_kontrol.html` | ✅ | ✅ | ✅ | ✅ | Temiz |
| `sevkiyatlar.html` | ✅ | ✅ | ✅ | ✅ | Temiz |
| `testler.html` | ✅ | ✅ | ✅ | ✅ | Temiz |
| `log.html` | ✅ | ✅ | ✅ | ✅ | Temiz |
| `tanimlar.html` | ✅ | ✅ | ✅ | — | Temiz |
| `tezgahlar.html` | ✅ | ✅ | ✅ | — | Temiz |
| `kullanicilar.html` | ✅ | ✅ | ✅ | ✅ | Temiz |
| `kullanici_detay.html` | ✅ | ✅ | ✅ | — | Temiz |
| `qr_tara.html` | ✅ | ✅ | ✅ | — | Rol yönlendirmesi eklenecek |
| `proje_liste.html` | ✅ | ✅ | ✅ | — | Temiz |
| `proje_detay.html` | ✅ | ✅ | ✅ | — | Temiz |
| `uyarilar.html` | ✅ | ✅ | ✅ | — | Temiz |
| `ayarlar.html` | ✅ | ✅ | ✅ | — | Temiz |
| `tersaneler.html` | ✅ | ✅ | ✅ | kısmi | Yerel _I18N + ares-lang entegre |
| `izometri-batch.html` | ✅ | ✅ | ✅ | ✅ | Temiz |
| `sorgula.html` | ✅ | ✅ | ✅ | — | Temiz |
| `devre_duzenle.html` | ✅ | ✅ | ✅ | — | Temiz |
| `admin/panel.html` | ✅ | ✅ | ✅ | — | Temiz |
| `admin/firma.html` | ✅ | ✅ | ✅ | — | Temiz |
| `admin/firma-detay.html` | ✅ | ✅ | ✅ | — | Temiz |
| `portal/index.html` | ✅ | ✅ | ✅ | — | Temiz |

### 5.2 Düzeltme Gereken Sayfalar

| Sayfa | Sorun |
|---|---|
| `raporlar.html` | Sıfırdan yazılacak |
| `index.html` | Ölü tema CSS var |

### 5.3 Silinecek Sayfalar

- `personel.html` — iptal edildi
- `personel_yeni.html` — iptal edildi
- `senaryolar.html` — gerek kalmadı

---

## 6. GÜVENLİK (TAMAMLANDI)

### 6.1 Auth Kontrolü ✅
`authKontrol()` Supabase native token (`sb-*-auth-token`) kontrolü yapıyor.

### 6.2 Logout ✅
`ARES.cikisYap()` çağrılıyor.

### 6.3 Debug Badge ✅
Kaldırıldı.

### 6.4 Davet Sistemi ✅
`kullanicilar.html` — `auth.admin.*` metodları kaldırıldı, sadece `signInWithOtp()` (magic link) kullanılıyor. Service role key gerektiren metodlar frontend'de kullanılmaz.

---

## 7. YAPILACAKLAR LİSTESİ

### FAZ 0 — Güvenlik ✅ TAMAMLANDI
- [x] `ares-layout.js` logout → `ARES.cikisYap()`
- [x] `ares-layout.js` authKontrol() → Supabase token kontrolü
- [x] `ares-layout.js` debug badge → kaldırıldı

### FAZ 1 — Renk sistemi ✅ TAMAMLANDI
- [x] `admin/panel.html`, `admin/firma.html`, `admin/firma-detay.html`
- [x] `portal/index.html`
- [x] `sorgula.html`, `izometri-batch.html`, `devre_duzenle.html`

### FAZ 2 — Flash prevention + ares-lang.js ✅ TAMAMLANDI
- [x] `proje_detay.html`, `uyarilar.html`, `ayarlar.html`
- [x] `tersaneler.html` — yerel _I18N + ares-lang.js entegre
- [ ] `raporlar.html` → sona bırakıldı, sıfırdan yazılacak

### FAZ 3 — CSS + Dil Sistemi ✅ TAMAMLANDI
- [x] `kesim.html` — renk + dil analizi
- [x] `testler.html` — sıfırdan dil sistemi (46 data-i18n, 26 tv())
- [x] `kalite_kontrol.html` — renk + dil sistemi
- [x] `sevkiyatlar.html` — CSS tırnak + 76 dil anahtarı
- [x] `log.html` — CSS tırnak

### FAZ 4 — Tekil düzeltmeler (DEVAM EDİYOR)
- [x] `kullanicilar.html` → davet → magic link + dil sistemi
- [x] `izometri-batch.html` → dil sistemi eklendi
- [x] `ares-layout.js` → `nav_izobatch` eklendi
- [x] `nav_kullanicilar` + `nav_izobatch` → 3 dil dosyasına eklendi
- [ ] `qr_tara.html` → rol bazlı yönlendirme
- [ ] `spool_detay.html` → URL param localStorage'dan önce gelsin + `tarama_sonuclari` sorgusunu kaldır
- [ ] `vercel.json` → `ares-lang.js` + `lang/*.json` no-cache ekle
- [ ] `en.json` + `ar.json` → `nav_personel` sil
- [ ] `ares-layout.js` → sidebar aktif sayfa tespiti iyileştir
- [ ] `ares-layout.js` → `t()` kaldır, sadece `tv()` kullan

### FAZ 5 — Silme
- [ ] `personel.html` sil
- [ ] `personel_yeni.html` sil
- [ ] `senaryolar.html` sil
- [ ] `ares-layout.js` NAV listesinden personel kaldır

### FAZ 6 — İşlevsel geliştirme
- [ ] `ayarlar.html` → `tenants` Supabase bağlantısı (zaten var, kontrol et)
- [ ] `qr_tara.html` → rol bazlı yönlendirme
- [ ] `is_baslat.html` → yeni sayfa
- [ ] Sayfa erişim kontrolü → `sayfaYetkiKontrol()` tüm sayfalara
- [ ] Rol bazlı sidebar → operatör yetkisiz linkleri görmemeli
- [ ] `tersane_firma_iliskileri` → `admin/firma-detay.html` placeholder
- [ ] `hakedis.html` → yeni sayfa
- [ ] `raporlar.html` → Supabase'den sıfırdan
- [ ] `ares-layout.js` dil sistemi → `t()` kaldır, sadece `tv()` kullan

### FAZ 7 — AI Sistemi
- [ ] `ai_kuyruk` tablosunu kur
- [ ] `ayarlar.html`'e QR etiket fiziksel boyutu ekle
- [ ] Fotoğraf yüklenince → hızlı analiz → anlık uyarı
- [ ] Spool tamamlanınca → derin analiz → havuza ekle → onay/red
- [ ] `egitim_verisi` tablosuna yeni kolonlar ekle

### FAZ 8 — Eğitim Merkezi (yeni modül)
- [ ] `egitim/index.html`, `yukle.html`, `dogrula.html`, `admin.html`
- [ ] RAG veritabanı kurulumu
- [ ] `tersaneler` tablosuna `format_profili` kolonu

### API Düzeltmeleri ✅ TAMAMLANDI
- [x] `api/izometri-oku.js` → edge → Node.js, max_tokens 8192
- [x] `api/sorgula.js` → edge → Node.js
- Not: Anthropic bakiye bitmişti, yükleme gerekiyor

---

## 8. KARAR VERİLMİŞ KONULAR

### Auth Sistemi
Supabase native token (`sb-*-auth-token`) localStorage'da tutulur. `ares_oturum` key'i kullanılmaz.

### Davet Sistemi
`auth.admin.*` metodları service role key gerektirir, frontend'de kullanılmaz. Sadece `signInWithOtp()` (magic link). Kullanıcı kaydı auth ID olmadan oluşturulur, ilk girişte bağlanır.

### QR → Rol bazlı yönlendirme
```js
if (rol === 'operator') {
  location.href = 'is_baslat.html?id=' + spoolId;
} else {
  location.href = 'spool_detay.html?id=' + spoolId;
}
```

### is_baslat.html — Operatör Saha Ekranı
- Spool özet (büyük font, sahada okunabilir)
- Aktif basamak göstergesi
- "İşi Başlat" / "İşi Tamamla" butonu
- Hızlı fotoğraf çek
- Spool durdurulmuşsa büyük kırmızı uyarı

### Yetkilendirme Sistemi
Altyapı hazır. Sadece UI eksik.

### tarama_sonuclari
3D lazer tarama cihazı için beklemede. `spool_detay.html`'deki sorgudan kaldırılacak.

### Arapça RTL
Test amaçlı. RTL CSS implementasyonu yapılmayacak. Tasarım bittikten sonra kaldırılacak.

### AI Fotoğraf Analizi — 2 Katman
| Katman | Tetikleyici | Amaç |
|---|---|---|
| Hızlı | Fotoğraf yüklenince | Anlık hata uyarısı |
| Derin | Spool tamamlanınca | Bütünsel doğrulama + eğitim |

### Dil Dosyası Durumu (Nisan 2026)
| Dosya | Anahtar Sayısı |
|---|---|
| tr.json | ~1045 |
| en.json | ~1658 |
| ar.json | ~1658 |

### ITHINKSO
Önceki yazılım firmasının adı. Kodda geçen her yerde kaldırılacak.

### CI/CD — GitHub Actions
Her push'ta otomatik kural kontrolü. Kural dosyası: `.github/kurallar.json`

---

## 9. DOSYA YAPISI

```
/
├── index.html
├── giris.html
├── devreler.html
├── devre_detay.html
├── devre_yeni.html
├── devre_duzenle.html
├── spool_detay.html
├── kesim.html
├── bukum.html
├── markalama.html
├── kalite_kontrol.html
├── testler.html
├── sevkiyatlar.html
├── log.html
├── tanimlar.html
├── tezgahlar.html
├── kullanicilar.html
├── kullanici_detay.html
├── tersaneler.html
├── proje_liste.html
├── proje_detay.html
├── qr_tara.html
├── sorgula.html
├── izometri-batch.html
├── uyarilar.html
├── ayarlar.html
├── raporlar.html          ← sıfırdan yazılacak
├── is_baslat.html         ← yapılacak (yeni)
├── ares-store.js
├── ares-lang.js
├── ares-layout.js
├── vercel.json
├── CLAUDE.md              ← bu dosya
├── lang/
│   ├── tr.json
│   ├── en.json
│   └── ar.json
├── admin/
│   ├── panel.html
│   ├── firma.html
│   └── firma-detay.html
├── portal/
│   └── index.html
├── api/
│   ├── izometri-oku.js    ← Node.js runtime, max_tokens 8192
│   └── sorgula.js         ← Node.js runtime
├── egitim/                ← yapılacak (yeni modül)
│   ├── index.html
│   ├── yukle.html
│   ├── dogrula.html
│   └── admin.html
└── .github/
    ├── kurallar.json
    ├── kontrol.js
    └── workflows/
        └── kontrol.yml
```

---

## 10. SOHBET SONU GÜNCELLEME PROTOKOLÜ

Her sohbet bitiminde şu soruları sor:

1. Bu sohbette yeni karar alındı mı? → Bölüm 8'e ekle
2. Yapılacaklar listesinde tamamlanan var mı? → Bölüm 7'de `[x]` yap
3. Yeni sayfa eklendi mi? → Bölüm 5 ve 9'u güncelle
4. Veritabanı değişikliği var mı? → Bölüm 4'ü güncelle
5. Yeni kural belirlendi mi? → Bölüm 2'ye ekle

**Bu dosya güncel değilse bir sonraki sohbet bağlamsız başlar.**
