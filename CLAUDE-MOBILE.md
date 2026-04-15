# AresPipe — Mobil Sistem Bağlamı

> Bu dosya CLAUDE.md ile birlikte okunur. Mobil geliştirmeye özgü kurallar burada.
> Son güncelleme: 15 Nisan 2026

---

## 1. MOBİL MİMARİ

### 1.1 Klasör Yapısı

```
mobile/
├── giris.html          ✅ Mobil giriş
├── index.html          ✅ Ana sayfa
├── devreler.html       ✅ Devre listesi (RPC geçişi bekliyor)
├── devre_detay.html    ✅ Devre detay + spool listesi (pulse animasyonu bekliyor)
├── spool_detay.html    ✅ Spool detay + fotoğraflar
├── qr.html             ✅ QR tarayıcı
├── is_baslat.html      ⏳ Operatör iş ekranı — mockup onaylandı, kodlanacak
├── kk.html             ⏳
├── sevkiyat.html       ⏳
├── gemiler.html        ⏳
├── gemi_detay.html     ⏳
├── tezgahlar.html      ⏳
├── ara.html            ⏳
├── bildirim.html       ⏳
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

Her sayfa bir üstüne döner. `spool_detay.html`'de `geriDon()`:
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

`mInit()` sonrası visibility açılır:
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

`mAuthKontrol()` başarısız olursa → `giris.html` (relative)
`../giris.html` KULLANILMAZ.

### M-06: CSS Tırnak Kuralı

```css
/* YANLIŞ */
[data-theme="dark"] { ... }

/* DOĞRU */
[data-theme=dark] { ... }
```

### M-07: Sayfa Teslim Kontrol Listesi (Kural G-01 — Mobil Eki)

Mobil sayfalar için CLAUDE.md Bölüm 2.12 kontrol listesi geçerlidir. **Ek olarak:**

```
□ history.back() yok (M-01)
□ Geri dönüş hiyerarşisi doğru (M-02)
□ Flash prevention var (M-03) — giris.html ve qr.html hariç
□ mPage yapısı kullanıldı (M-04)
□ Auth yönlendirmesi giris.html — ../giris.html değil (M-05)
□ CSS tırnak kuralı [data-theme=dark] — tırnak yok (M-06)
□ Script sırası body sonunda, HEAD'de değil (1.3)
□ D-01: Tüm statik metinlere data-i18n eklendi
□ D-01: Tüm dinamik JS metinlerde tv() kullanıldı
□ F-01: Font-size 14px altı yok — 9px, 10px, 11px, 12px, 13px YASAK
□ mSayfaKontrol() eklendi (yetki sistemi)
```

**Mobilde font kuralı özellikle kritik:** `ares-mobile.css` ve sayfa CSS'lerinde 14px altı çok sayıda ihlal mevcut. Yeni yazılan her satırda bu kural uygulanır.

---

## 3. ares-mobile.js FONKSİYONLARI

### Temel Fonksiyonlar

```js
mInit()                    // Tema+dil, auth, drawer+nav, visibility
mAuthKontrol()             // Session kontrol → giris.html
mSayfaKontrol(sayfaKodu)  // Blok yetki kontrolü → index.html (yeni)
mOturum()                  // → {id, rol, ad_soyad, tenant_id}
mSupabase()
mTenantId()
mCikis()                   // → giris.html
mUrlParam(key)
mToast(msg, tip, sure)     // 'info'|'success'|'error'
mDrawerAc()
mDrawerKapat()
```

### Mobil Sayfa Guard

```js
// mInit() SONRASINDA — blok tabanlı yetki kontrolü
if (!await mSayfaKontrol('mobile/kk')) return;
if (!await mSayfaKontrol('mobile/sevkiyat')) return;
```

`mSayfaKontrol()` → `ARES.sayfaYetkiKontrol(sayfaKodu)` wrapper'ı. Yetkisi yoksa `index.html`'e yönlendirir.

### Dil & Tema

```js
mDilUygula(dil)       // 'tr'|'en'|'ar'
mTemaDegistir(tema)   // 'dark'|'light-anthracite'
```

### Feature Flag

```js
mFeatureAktif(kod)  // async → boolean
```

### Yardımcılar

```js
esc(s)
mFormatTarih(iso)
mFormatSure(iso)
mDurumBadge(durum)
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

```js
window._onLangChange = function() {
  if (typeof window._applyI18n === 'function') window._applyI18n();
  render();
};
```

### 4.3 RTL (Arapça)

`mDilUygula('ar')` → `dir=rtl`. `ares-mobile.css`'de `[dir=rtl]` kuralları mevcut.

### 4.4 Mobil Anahtar Prefix'leri

```
mob_nav_*       Ana sayfa navigasyon
mob_filtre_*    Filtre paneli
mob_stat_*      Stat kartları
mob_durum_*     Durum etiketleri
mob_dv_*        devre_detay.html
mob_sp_*        spool_detay.html
mob_alistirma_* Alıştırma durumu
mob_is_*        is_baslat.html (yeni)
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
| `ilerleme` | integer | 0-100 kümülatif puan |
| `is_durumu` | text | `bekliyor` / `devam_ediyor` |

### fotograflar

| Kolon | Not |
|---|---|
| `dosya_url` | url değil |
| `yukleyen_id` | kullanici_id değil |
| `islem_turu` | asama değil |
| `spool_id` | UUID |

### devreler

| Kolon | Not |
|---|---|
| `ad` | devre_adi değil |
| `termin` | DATE — termin_tarihi silindi |
| `ilerleme` | Kullanılmıyor — spooller ortalaması |
| `agirlik` | Kullanılmıyor — spooller toplamı |

---

## 6. HESAPLAMA KURALLARI

### İlerleme

`devreler.ilerleme` hep 0 → `spooller.ilerleme` ortalaması:

```js
var avgIler = spools.length
  ? Math.round(spools.reduce(function(s,x){ return s+(x.ilerleme||0); },0) / spools.length)
  : 0;
```

**ASAMA_PCT tablosu kaldırıldı.** Aggregate için `devre_istatistik` RPC kullanılır.

### Alıştırma Agregasyonu

```js
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
    document.documentElement.style.visibility = '';
    if (!ok) return;
    document.getElementById('mPage').style.display = '';

    // Sayfa guard — blok yetki kontrolü
    if (!await mSayfaKontrol('mobile/kk')) return; // örnek

    // Feature flag
    var model3dAktif = await mFeatureAktif('3d_model');
    if (!model3dAktif) {
      var btn = document.querySelector('[data-tab="model3d"]');
      if (btn) btn.style.display = 'none';
    }

    // Dil değişim hook
    window._onLangChange = function() {
      if (typeof window._applyI18n === 'function') window._applyI18n();
      render();
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

### Spool Kartı

Sol çizgi = aktif basamak rengi, sağ çizgi = alıştırma durumu.

---

## 9. QR AKIŞI

```
QR tarama (qr.html veya is_baslat.html)
    ↓
spool_id ile spooller tablosunu sorgula
    ↓
    ├── is_baslat.html (operatör iş akışı)
    └── spool_detay.html?id=X (görüntüleme)
```

**QR yöntem sırası:** BarcodeDetector API → jsQR CDN fallback → Manuel giriş

---

## 10. YETKİLENDİRME — BLOK SİSTEMİ ✅

Web ile aynı blok sistemi. `ares-store.js`'deki `ARES.sayfaYetkiKontrol()` kullanılır.

### mSayfaKontrol()

`ares-mobile.js`'e eklenmiş wrapper:

```js
async function mSayfaKontrol(sayfaKodu) {
  var oturum = mOturum();
  if (!oturum) { location.href = 'giris.html'; return false; }
  return await ARES.sayfaYetkiKontrol(sayfaKodu);
}
```

### Mobil Sayfa Kodları

```
mobile/devreler
mobile/devre_detay
mobile/spool_detay
mobile/kk
mobile/sevkiyat
mobile/is_baslat
mobile/markalama
```

### Kullanım

```js
// mInit() başarılı olduktan sonra
if (!await mSayfaKontrol('mobile/kk')) return;
```

---

## 11. İŞ BAŞLAT AKIŞI (is_baslat.html)

Mockup onaylandı (15 Nisan 2026). Kodlanacak.

### Ekranlar
1. **QR Tara** — jsQR ile okuma
2. **Spool Bilgi** — mevcut basamak, butonlar
3. **Devam Ediyor** — is_durumu=devam_ediyor, pulse
4. **Basamak Seç** — sonraki işlemi seç, fotoğraf
5. **Tamamlandı** — 2 sn sonra QR'a dön

### is_durumu Kuralı
- Pulse sadece `imalat`/`kaynak` + `devam_ediyor` kombinasyonunda

### DB Güncellemeleri

```js
// İşe Başla
await supa.from('spooller').update({
  is_durumu: 'devam_ediyor',
  guncelleme: new Date().toISOString()
}).eq('id', spoolId);

// İş Bitir
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

```js
var { data } = await supa.rpc('devre_istatistik', { devre_ids: devreIdListesi });
```

Döndürür: `toplam_spool`, `toplam_agirlik`, `ort_ilerleme`, `cap_dagilim`, `malzeme_dagilim`, `yuzey_dagilim`

---

## 13. CI/CD KURALLARI (Mobil)

- `history.back()` → hata (M-01)
- `ares-layout.js` yüklemesi → hata
- `ares-mobile.js` eksik → hata

`mobile/` klasörü `ares-layout.js` kuralından muaftır.
