# AresPipe Mobil — Claude Proje Bağlamı

> Bu dosya mobil sayfalar geliştirilirken okunur.
> Ana sistem kuralları için CLAUDE.md'ye bak.
> Son güncelleme: Nisan 2026

---

## 1. MOBİL SİSTEM TANIMI

**Amaç:** Salt görüntüleme + QR tarama + geri bildirim. Veri girişi YOK.

**Hedef kullanıcı:** Yöneticiler ve KK uzmanları — sahada inceleme.

**Klasör:** `mobile/` (root altında)

**URL:** `arespipe.vercel.app/mobile/`

**CI/CD istisnası:** `mobile/` klasörü `ares-layout.js` ve `flash-prevention` kurallarından muaf. `kurallar.json`'da kayıtlı.

---

## 2. MİMARİ

### 2.1 Script Yükleme Sırası — ZORUNLU

```html
<script src="../ares-store.js"></script>
<script src="../ares-lang.js"></script>
<script src="ares-mobile.js"></script>
<script>
  // Inline script — DOMContentLoaded içinde
  document.addEventListener('DOMContentLoaded', async function() {
    _spoolId = mUrlParam('id'); // URL param'ları burada al
    var ok = await mInit();
    if (!ok) return;
    await yukle();
  });
</script>
```

**UYARI:** `mUrlParam()` gibi `ares-mobile.js` fonksiyonları DOMContentLoaded dışında çağrılamaz — script henüz yüklenmemiş olur.

**UYARI:** `ares-store.js` HEAD'de ayrıca yüklenmemeli — body sonunda bir kez yüklenir.

### 2.2 Sayfa Başlatma

Her sayfada `mInit()` çağrılır:
- Tema + dil uygular
- Auth kontrolü yapar (oturum yoksa `../giris.html`'e yönlendirir)
- Drawer ve bottomnav render eder
- `document.documentElement.style.visibility = ''` ile sayfayı görünür yapar

### 2.3 Flash Prevention

Mobil sayfalar kendi flash prevention bloğunu taşır (layout.js'den bağımsız):

```html
<script>(function(){
  var t=localStorage.getItem('ares_theme')||'light-anthracite';
  var l=localStorage.getItem('ares_lang')||'tr';
  document.documentElement.setAttribute('data-theme',t);
  document.documentElement.setAttribute('lang',l);
  document.documentElement.style.visibility='hidden';
})()</script>
```

### 2.4 Geri Dönüş — history.back() YASAK

CI/CD kuralı: `history.back()` hata verir. Explicit URL kullan:

```js
// ✗ YANLIŞ
onclick="history.back()"

// ✓ DOĞRU
onclick="location.href='devreler.html'"

// Referrer'a göre akıllı geri dönüş (spool_detay gibi)
function geriDon() {
  var ref = document.referrer;
  if (ref && ref.includes('devre_detay')) {
    history.back();
  } else {
    location.href = 'devreler.html';
  }
}
```

---

## 3. TASARIM SİSTEMİ

### 3.1 CSS Dosyası

`mobile/ares-mobile.css` — tüm sayfaların ortak CSS'i. Sayfa özel CSS'i `<style>` tag'i ile aynı dosyada.

Renk değişkenleri web ile aynı: `--ac`, `--gr`, `--re`, `--warn`, `--leg`, `--bg`, `--sur`, `--sur2`, `--bor`, `--tx`, `--txm`, `--txd`

### 3.2 Tipografi

- Başlıklar: `'Barlow Condensed', sans-serif`
- Gövde: `'Barlow', sans-serif`
- Google Fonts link her sayfada

### 3.3 Layout

```
[Topbar 52px — fixed]
[Sayfa içeriği — padding-top:52px, padding-bottom:80px]
[Bottomnav 64px — fixed]
```

### 3.4 Spool Kart Tasarımı (Devre Detay)

```
[Sol çizgi 4px] [İçerik] [Sağ çizgi 4px]
```

**Sol çizgi = aktif aşama rengi:**
- Bekliyor → `#B4B2A9` (gri)
- İmalat → `var(--ac)` (mavi)
- Kaynak → `#1D9E75` (teal)
- Ön Kontrol → `var(--warn)` (amber)
- KK → `var(--leg)` (mor)
- Sevkiyat → `var(--gr)` (yeşil)
- Durduruldu → `var(--re)` (kırmızı)

**Sağ çizgi = alıştırma durumu:**
- Yok → `var(--re)` (kırmızı)
- Kısmi → `var(--warn)` (sarı)
- Tam → `var(--gr)` (yeşil)

**Spool ID altında 3 ikon (Kesim✂ / Büküm↩ / Markalama🏷):**
- Başlamadı → kırmızı arka plan
- Devam ediyor → sarı arka plan
- Tamamlandı → yeşil arka plan

### 3.5 Devre Kart Tasarımı (Devreler)

```
[Sol çizgi] [İş Emri | Devre Adı + meta] [İlerleme %] [Sağ çizgi]
[Alt şerit: Durum badge | durduruldu uyarısı]
```

Sol çizgi: ilerleme/durum rengi
Sağ çizgi: ilerleme yüzdesi rengi (0%=gri, <50%=sarı, <100%=mavi, 100%=yeşil)

### 3.6 Aşama Tracker (Devre Detay üstü)

6 oval filtre butonu: Bekliyor · İmalat · Kaynak · Ön Kontrol · KK · Sevkiyat

- Her oval içinde o aşamadaki spool sayısı
- Tıklayınca liste filtrelenir, tekrar tıklayınca tüm liste
- Birden fazla seçilebilir
- Durduruldu ayrı oval değil — arama yanında sayaç olarak

### 3.7 Devre Detay Header Formatı

```
NB1124 / Overboard System-M120
[Arama kutusu]          [14 spool]
                        [⬤ 3 durduruldu]
[Bekliyor][İmalat][Kaynak][Ön Kont.][KK][Sevkiyat]
```

### 3.8 Spool Detay Yapısı

```
[Topbar: ← Geri | Spool ID | Durum badge]
[Durduruldu banner — varsa]
[Fotoğraf carousel — tam genişlik]
[Foto meta: tarih | kişi | aşama]
[Spool No — ortalanmış]
[Sekmeler: Genel | Malzeme | İşlem Kayıtları | 3D Model]
[Sekme içeriği]
[FAB: Geri bildirim butonu]
```

**Genel sekmesi bölümleri:**
1. Spool Bilgileri (pipeline no, rev, çap, et, ağırlık, malzeme, yüzey, kesim mm, A/B ucu)
2. İşlem Durumu (alıştırma badge + kesim/büküm/markalama/test durumları)
3. KK & Sevkiyat
4. Devre Bilgisi
5. Belgeler

**3D Model sekmesi:** "Yakında" placeholder — henüz hazır değil.

---

## 4. NAVİGASYON

### 4.1 Bottomnav (5 öğe)

| İkon | Label | Sayfa |
|------|-------|-------|
| 🏠 | Ana Sayfa | index.html |
| 🔍 | Ara | ara.html |
| QR butonu (ortada, mavi) | — | qr.html |
| 🔔 | Bildirim | bildirim.html |
| ☰ | Menü | drawer açar |

### 4.2 Hamburger Drawer (Sağdan açılır)

İçerik:
- Kullanıcı adı + rol
- **Navigasyon:** Ana Sayfa, Gemiler, Devreler, KK, Sevkiyatlar, Tezgahlar
- **Ayarlar:** Tema toggle (☀️/🌙), Dil toggle (TR/EN)
- Çıkış butonu

### 4.3 Sayfa Hiyerarşisi ve Geri Dönüş

```
index.html
├── gemiler.html → gemi_detay.html → devreler.html
├── devreler.html → devre_detay.html?id=X → spool_detay.html?id=Y
├── kk.html
├── sevkiyat.html
├── tezgahlar.html
├── qr.html → spool_detay.html?id=Y
└── ara.html → spool_detay.html?id=Y
```

Geri dönüşler explicit URL ile, `history.back()` KULLANMA.

---

## 5. VERİ KATMANI

### 5.1 Ortak Fonksiyonlar (ares-mobile.js)

```js
mInit()          // Sayfa başlatma (auth + drawer + nav)
mAuthKontrol()   // Oturum kontrolü
mOturum()        // Mevcut oturumu döner
mSupabase()      // Supabase client
mTenantId()      // Aktif tenant ID
mUrlParam(key)   // URL query param — DOMContentLoaded içinde çağır
mToast(msg, tip) // Toast mesajı (info/success/error)
mFormatTarih()   // Türkçe tarih formatı
mFormatSure()    // Tarih + saat
mDrawerAc/Kapat()
mCikis()         // Oturumu kapat
esc(str)         // XSS koruması
```

### 5.2 Supabase Sorgu Şablonu

```js
document.addEventListener('DOMContentLoaded', async function() {
  _spoolId = mUrlParam('id'); // Önce URL param'ı al
  var ok = await mInit();     // Sonra init
  if (!ok) return;

  var supa = mSupabase();
  var tid = mTenantId();
  if (!supa || !tid) return;

  try {
    var { data } = await supa
      .from('tablo')
      .select('...')
      .eq('tenant_id', tid)
      .eq('id', _spoolId)
      .single();

    // render...
  } catch(e) {
    mToast('Veri yüklenemedi', 'error');
  }
});
```

---

## 6. MEVCUT SAYFALAR

| Dosya | Durum | Notlar |
|-------|-------|--------|
| `mobile/ares-mobile.css` | ✅ | Ortak stil sistemi |
| `mobile/ares-mobile.js` | ✅ | Ortak JS |
| `mobile/index.html` | ✅ | Ana sayfa, stat kartları, son aktiviteler |
| `mobile/devre_detay.html` | ✅ | Spool listesi, aşama filtresi |
| `mobile/spool_detay.html` | ✅ | Fotoğraf carousel, 4 sekme, geri bildirim |
| `mobile/devreler.html` | ⏳ | Mockup onaylandı, yazılmadı |
| `mobile/qr.html` | ⏳ | Planlandı |
| `mobile/ara.html` | ⏳ | Planlandı |
| `mobile/gemiler.html` | ⏳ | Planlandı |
| `mobile/gemi_detay.html` | ⏳ | Planlandı |
| `mobile/kk.html` | ⏳ | Planlandı |
| `mobile/sevkiyat.html` | ⏳ | Planlandı |
| `mobile/tezgahlar.html` | ⏳ | Planlandı |

---

## 7. BEKLEYENLER / NOTLAR

- **Devre detay tablosu:** Kesim/büküm/markalama gösterim kuralları — web'deki tablo düzelince geri dönülecek
- **3D Model sekmesi:** Hazır olunca entegre edilecek
- **ares-store.js guard:** Admin panel iframe önizlemesinde `ARES already declared` hatası oluşuyor. `ares-store.js` başına `if (typeof ARES !== 'undefined') {}` guard eklenmeli
- **Dil sistemi:** Mobil sayfalar `tv()` kullanır, web ile aynı `lang/tr.json`, `lang/en.json` dosyaları
- **Admin panel mobil önizleme:** `admin/panel.html`'de 📱 Mobil Önizleme sekmesi var — iframe + telefon/tablet çerçevesi
