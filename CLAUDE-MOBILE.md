# AresPipe — Mobil Sistem Bağlamı

> Bu dosya CLAUDE.md ile birlikte okunur. Mobil geliştirmeye özgü kurallar burada.
> Son güncelleme: 14 Nisan 2026

---

## 1. MOBİL MİMARİ

### 1.1 Klasör Yapısı

```
mobile/
├── giris.html          ✅ Mobil giriş
├── index.html          ✅ Ana sayfa
├── devreler.html       ✅ Devre listesi
├── devre_detay.html    ✅ Devre detay + spool listesi
├── spool_detay.html    ✅ Spool detay + fotoğraflar
├── qr.html             ✅ QR tarayıcı
├── gemiler.html        ⏳
├── gemi_detay.html     ⏳
├── kk.html             ⏳
├── sevkiyat.html       ⏳
├── tezgahlar.html      ⏳
├── ara.html            ⏳
├── bildirim.html       ⏳
├── is_baslat.html      ⏳ Operatör iş ekranı
├── ares-mobile.js      ✅ Ortak JS
└── ares-mobile.css     ✅ Ortak CSS + RTL
```

### 1.2 Web'den Bağımsızlık

- `ares-layout.js` KULLANILMAZ — mobil kendi drawer/bottomnav'ını `ares-mobile.js` ile kurar
- `ares-store.js` ve `ares-lang.js` `../` prefix ile root'tan yüklenir
- Her sayfada `mInit()` çağrılır

### 1.3 Script Yükleme Sırası — ZORUNLU

```html
<!-- Body sonunda, HEAD'de ASLA -->
<script src="../ares-store.js"></script>
<script src="../ares-lang.js"></script>
<script src="ares-mobile.js"></script>
<script>
  /* sayfa kodu */
</script>
```

---

## 2. KESİN KURALLAR (İHLAL EDİLMEZ)

### M-01: history.back() YASAK

```js
// YANLIŞ
onclick="history.back()"

// DOĞRU — explicit URL
onclick="location.href='devreler.html'"
onclick="geriDon()"  // _SP.devre_id varsa devre_detay'a, yoksa devreler'e
```

### M-02: Geri Dönüş Hiyerarşisi

```
giris.html → index.html → devreler.html → devre_detay.html → spool_detay.html
```

Her sayfa bir üstüne döner. `spool_detay.html`'de `geriDon()` fonksiyonu:
```js
function geriDon() {
  if (_SP && _SP.devre_id) {
    location.href = 'devre_detay.html?id=' + _SP.devre_id;
  } else {
    location.href = 'devreler.html';
  }
}
```

### M-03: Flash Prevention ZORUNLU

`<head>` içinde `<link>`'lerden ÖNCE:
```html
<script>(function(){
  var t=localStorage.getItem('ares_theme')||'light-anthracite';
  var l=localStorage.getItem('ares_lang')||'tr';
  document.documentElement.setAttribute('data-theme',t);
  document.documentElement.setAttribute('lang',l);
  document.documentElement.style.visibility='hidden';
})()</script>
```

`mInit()` başarılı olunca visibility açılır. Ayrıca try/catch ile de açılmalı:
```js
try {
  var ok = await mInit();
  document.documentElement.style.visibility = '';
  if (!ok) return;
  ...
} catch(e) {
  document.documentElement.style.visibility = '';
}
```

### M-04: mPage Yapısı

```html
<div class="m-page" id="mPage" style="display:none;">
  <!-- sayfa içeriği -->
</div>
```

`mInit()` sonrası: `document.getElementById('mPage').style.display = '';`

### M-05: Auth Yönlendirmesi

`mAuthKontrol()` başarısız olursa → `giris.html` (relative, `mobile/giris.html`)
`../giris.html` KULLANILMAZ.

### M-06: CSS Tırnak Kuralı

```css
/* YANLIŞ */
[data-theme="dark"] { ... }

/* DOĞRU */
[data-theme=dark] { ... }
```

---

## 3. ares-mobile.js FONKSİYONLARI

### Temel Fonksiyonlar

```js
mInit()           // Tema+dil ayarla, auth kontrol, drawer+nav kur, visibility aç
mAuthKontrol()    // Supabase session kontrol → giris.html yönlendir
mOturum()         // ARES.oturumAl() wrapper → {id, rol, ad_soyad, tenant_id}
mSupabase()       // ARES.supabase() wrapper
mTenantId()       // ARES.tenantId() wrapper
mCikis()          // ARES.cikisYap() → giris.html
mUrlParam(key)    // URLSearchParams ile URL parametresi al
mToast(msg, tip, sure) // 'info'|'success'|'error'
mDrawerAc()       // Hamburger menüyü aç
mDrawerKapat()    // Hamburger menüyü kapat
```

### Dil & Tema

```js
mDilUygula(dil)   // 'tr'|'en'|'ar' — dir=rtl/ltr, _onLangChange tetikler
mTemaDegistir(tema) // 'dark'|'light-anthracite'
```

### Feature Flag

```js
mFeatureAktif(kod)  // async, ARES.featureVar() wrapper → boolean
```

Kullanım:
```js
var model3dAktif = await mFeatureAktif('3d_model');
if (!model3dAktif) {
  document.querySelector('[data-tab="model3d"]').style.display = 'none';
}
```

### Yardımcılar

```js
esc(s)            // XSS koruması
mFormatTarih(iso) // Locale'e göre tarih formatla
mFormatSure(iso)  // Locale'e göre tarih+saat formatla
mDurumBadge(durum) // HTML badge döner
```

---

## 4. DİL SİSTEMİ (MOBİL)

### 4.1 Standart Kullanım

HTML'de:
```html
<div data-i18n="mob_nav_anasayfa">Ana Sayfa</div>
```

JS'de (dinamik içerik):
```js
'<div>' + tv('mob_stat_spool', 'Spool') + '</div>'
```

### 4.2 Dil Değişimi Hook'u

Her sayfada `mInit()` sonrası:
```js
window._onLangChange = function() {
  if (typeof window._applyI18n === 'function') window._applyI18n();
  // Gerekirse dinamik içeriği yeniden render et
  render();
};
```

### 4.3 RTL (Arapça)

`mDilUygula('ar')` → `dir=rtl` set eder. `ares-mobile.css`'de `[dir=rtl]` kuralları:
- Drawer soldan açılır
- Kart kenar çizgileri sağa taşır
- Toast kenar çizgisi sağa
- Filtre paneli soldan açılır

### 4.4 Mobil Anahtar Prefix'leri

```
mob_nav_*      Ana sayfa navigasyon
mob_filtre_*   Filtre paneli
mob_stat_*     Stat kartları (Devre, Spool, Ağırlık, İlerleme)
mob_durum_*    Durum etiketleri
mob_dv_*       devre_detay.html'e özgü
mob_sp_*       spool_detay.html'e özgü
mob_alistirma_* Alıştırma durumu
```

---

## 5. SUPABASE KOLONLARI (KESİNLEŞMİŞ)

### spooller

| Kolon | Tip | Not |
|---|---|---|
| `dis_cap_mm` | float | cap_mm değil |
| `et_kalinligi_mm` | float | et_mm değil |
| `agirlik` | float | agirlik_kg boş, bunu kullan |
| `rev` | text | revizyon değil |
| `durdurma_sebebi` | text | durdurma_aciklama değil |
| `alistirma` | text | `VAR`/`KISMI`/`YOK` (UPPERCASE) |
| `aktif_basamak` | text | `on_imalat`, `on_kontrol`, `kaynak`, `imalat`, `kk`, `sevkiyat` |
| `ilerleme` | integer | 0-100 arası kümülatif puan — basamak geçişinde artar |
| `is_durumu` | text | `bekliyor` (default) veya `devam_ediyor` — sadece imalat/kaynak'ta pulse gösterilir |

### fotograflar

| Kolon | Not |
|---|---|
| `dosya_url` | url değil |
| `yukleyen_id` | kullanici_id değil |
| `islem_turu` | asama değil |
| `spool_id` | UUID, eq ile filtrele |

### islem_log

| Kolon | Not |
|---|---|
| `katlan` | tablo_adi değil |

### devreler

| Kolon | Not |
|---|---|
| `ad` | devre_adi değil |
| `durdurma_sebebi` | |
| `termin` | Termin tarihi (DATE). `termin_tarihi` kolonu silindi. |
| `ilerleme` | Kullanılmıyor — spooller.ilerleme ortalamasından hesapla |
| `agirlik` | Kullanılmıyor — spooller.agirlik toplamı kullan |

---

## 6. HESAPLAMA KURALLARI

### 6.1 Ağırlık

`devreler.agirlik` KULLANILMAZ. `spooller.agirlik` toplamı kullanılır.

### 6.2 İlerleme

`devreler.ilerleme` hep 0. **`spooller.ilerleme` kolonunu kullan** (puan bazlı 0-100):

```js
// Devre ilerlemesi — adet bazlı
var avgIler = spools.length
  ? Math.round(spools.reduce(function(s,x){ return s+(x.ilerleme||0); },0) / spools.length)
  : 0;
```

**Eski ASAMA_PCT tablosu artık kullanılmıyor.** Aggregate hesaplama için `devre_istatistik` RPC kullanılır (bkz. Bölüm 12).

### 6.3 Alıştırma Agregasyonu (Devre bazında)

```js
// spooller aggregate
if (agg.count > 0 && agg.varCount === agg.count) agg.alistirma = 'VAR';
else if (agg.varCount > 0 || agg.kismiCount > 0) agg.alistirma = 'KISMI';
else agg.alistirma = 'YOK';
```

---

## 7. SAYFA BAŞLATMA ŞABLONU

```js
document.addEventListener('DOMContentLoaded', async function() {
  try {
    var ok = await mInit();
    document.documentElement.style.visibility = ''; // HER DURUMDA
    if (!ok) return;
    document.getElementById('mPage').style.display = '';

    // Feature flag kontrolleri
    var model3dAktif = await mFeatureAktif('3d_model');
    if (!model3dAktif) {
      var btn = document.querySelector('[data-tab="model3d"]');
      if (btn) btn.style.display = 'none';
    }

    // Dil değişim hook'u
    window._onLangChange = function() {
      if (typeof window._applyI18n === 'function') window._applyI18n();
      render(); // gerekirse
    };

    await yukle();
  } catch(e) {
    document.documentElement.style.visibility = '';
    console.error('[Sayfa init]', e);
  }
});
```

---

## 8. KART TASARIM SİSTEMİ

### Devre Kartı

```
[Sol çizgi 4px] [İş Emri / Devre Adı + meta] [İlerleme %] [Sağ çizgi 4px]
[Alt şerit: Durum badge | durduruldu notu | termin tarihi]
```

- **Sol çizgi** → durum rengi: `baslamadi=#B4B2A9`, `imalatta=--ac`, `kalite_davette=--leg`, `sevke_hazir=--gr`, `durduruldu=--re`
- **Sağ çizgi** → ilerleme rengi: `0%=--bor`, `>0%=--warn`, `>=50%=--ac`, `100%=--gr`

### Spool Kartı (devre_detay içinde)

Aynı çizgi mantığı: sol çizgi=aktif basamak rengi, sağ çizgi=alıştırma durumu.

---

## 9. QR AKIŞI

```
QR tarama (qr.html veya is_baslat.html)
    ↓
spool_id ile spooller tablosunu sorgula
    ↓
UUID bul
    ↓
    ├── is_baslat.html (operatör iş akışı — bkz. Bölüm 11)
    └── spool_detay.html?id=X (görüntüleme)
```

**QR yöntem sırası:** BarcodeDetector API (Chrome/yeni Safari) → jsQR CDN fallback → Manuel giriş

---

## 10. YETKİLENDİRME PLANI (HAZIR DEĞİL)

**İleride eklenecek — sayfalar bittikten sonra:**

```js
// ares-mobile.js'e eklenecek
async function mSayfaKontrol(roller, featureKod) {
  var oturum = mOturum();
  if (roller && !roller.includes(oturum.rol)) {
    location.href = 'index.html';
    return false;
  }
  if (featureKod && !await mFeatureAktif(featureKod)) {
    location.href = 'index.html';
    return false;
  }
  return true;
}
```

Kullanım (sayfalar bittikten sonra eklenecek):
```js
// mInit() SONRASINDA
await mSayfaKontrol(['yonetici', 'kk_uzmani']); // kk.html için
await mSayfaKontrol(['yonetici'], 'hakedis');    // hakedis sayfası için
```

**Sıralama:** Sayfaları bitir → yetki matrisini belirle → tek satır ekle → test.

---

## 11. CI/CD KURALLARI (Mobil)

CI/CD `mobile/` klasöründe şunları kontrol eder:
- `history.back()` → hata (M-01 ihlali)
- `ares-layout.js` yüklemesi → hata (mobil klasörü muaf değilse)
- `ares-mobile.js` eksik → hata

**Not:** `mobile/` klasörü `ares-layout.js` kuralından muaftır.

---

## 11. İŞ BAŞLAT AKIŞI (is_baslat.html)

Mockup onaylandı (15 Nisan 2026). Personel yetkilendirme netleşince kodlanacak.

### Ekranlar
1. **QR Tara** — kamera açık, jsQR ile okuma
2. **Spool Bilgi** — spool yüklendi, mevcut basamak, butonlar
3. **Devam Ediyor** — is_durumu=devam_ediyor, pulse animasyonu
4. **Basamak Seç** — sonraki işlemi seç, opsiyonel fotoğraf
5. **Tamamlandı** — başarı, 2 sn sonra QR'a dön

### is_durumu Kuralı
- `bekliyor` → default, hiç işlem yok
- `devam_ediyor` → sadece `imalat` ve `kaynak` basamaklarında geçerli
- Pulse animasyonu: sadece `imalat`/`kaynak` + `devam_ediyor` kombinasyonunda

### Veritabanı Güncellemesi (İşe Başla)
```js
await supa.from('spooller').update({
  is_durumu: 'devam_ediyor',
  guncelleme: new Date().toISOString()
}).eq('id', spoolId);
```

### Veritabanı Güncellemesi (İş Bitir)
```js
await supa.from('spooller').update({
  aktif_basamak: secilenSistemAdi,
  is_durumu: 'bekliyor',
  ilerleme: Math.min(100, mevcutIlerleme + basamakPuani),
  guncelleme: new Date().toISOString()
}).eq('id', spoolId);
```

---

## 12. RPC FONKSİYONLARI

### devre_istatistik(devre_ids uuid[])
Aggregate hesaplama — list sayfalarında kullanılır, nested join limiti yok.

**Döndürür:**
```json
{
  "toplam_spool": 524,
  "toplam_agirlik": 12248.31,
  "ort_ilerleme": 35,
  "cap_bos_spool": 9,
  "cap_bos_agirlik": 186.77,
  "malzeme_bos_spool": 0,
  "cap_dagilim": [{"mm":"114.3","adet":45,"agirlik":1200},...],
  "malzeme_dagilim": [{"malzeme":"Karbon Çelik","adet":500,"agirlik":11000},...],
  "yuzey_dagilim": [{"yuzey":"Galvaniz","adet":300},...]
}
```

**Kullanım:**
```js
var { data } = await supa.rpc('devre_istatistik', { devre_ids: devreIdListesi });
```
