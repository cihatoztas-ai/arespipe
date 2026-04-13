# AresPipe — Claude Proje Bağlamı

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: Nisan 2026
> Yeni sohbette: `CLAUDE.md'yi oku: https://raw.githubusercontent.com/cihatoztas-ai/arespipe/refs/heads/main/CLAUDE.md`

---

## 1. PROJE TANIMI

**AresPipe** — Tersane boru imalat takip sistemi.
**Stack:** Vanilla HTML/CSS/JS + Supabase + Vercel
**GitHub:** cihatoztas-ai/arespipe | **URL:** arespipe.vercel.app
**Multi-tenant:** Supabase RLS ile korunur.

**Temel iş akışı:**
Proje → Devre → Spool → [Kesim → Büküm → Markalama → KK → Test → Sevkiyat]

---

## 2. MİMARİ KURALLAR

### Flash Prevention — HER HTML'DE ZORUNLU
```html
<script>(function(){var t=localStorage.getItem('ares_theme')||'dark';var l=localStorage.getItem('ares_lang')||'tr';document.documentElement.setAttribute('data-theme',t);document.documentElement.setAttribute('lang',l);document.documentElement.style.visibility='hidden';})()</script>
```

### Script Sırası
```html
<script src="ares-store.js"></script>
<script src="ares-lang.js"></script>
<script src="ares-layout.js"></script>
```

### Renk Sistemi
- `--ac:#2D8EFF` `--gr:#16a36e` `--re:#e53e3e` `--warn:#d97706` `--leg:#7c3aed`
- `[data-theme=dark]` → `--bg:#0d1117`
- `[data-theme=light-anthracite]` → `--bg:#d8dde4`
- **YASAK:** `#3b82f6` `#22c55e` `#0a0b0e` `#10b981` `history.back()` `syos_theme` `px14px`
- **CSS'te data-theme tırnak kullanılmaz:** `[data-theme=dark]` ✅ `[data-theme="dark"]` ❌

### CI/CD
- `.github/kurallar.json` — kural tanımları
- `.github/kontrol.js` — tarama scripti
- Her push'ta otomatik kontrol. Hata → Vercel'e gitmez.

### ÖNEMLİ KURALLAR
- `api/` klasörüne HTML koymak yasak (Vercel serverless function dizini görür)
- `history.back()` yasak → explicit URL kullan
- Admin sayfaları (`admin/`, `portal/`) `ares-layout.js` yüklemiyor — visibility'i kendisi açmalı

---

## 3. KULLANICI ROLLERİ

| Rol | Giriş Sonrası |
|---|---|
| `super_admin` | `admin/panel.html` |
| `firma_admin` | `index.html` |
| `yonetici` | `index.html` |
| `operator` | `index.html` (→ `is_baslat.html` yapılınca) |
| `musteri` | `portal/index.html` |

**Test hesapları:**
- `cihatoztas77@gmail.com` → super_admin
- `cihatoztas@gmail.com` → firma_admin (Demo Atölye, tenant: 00000000-0000-0000-0000-000000000001)

---

## 4. FEEDBACK SİSTEMİ

1. Kullanıcı topbar'daki 💬 butonuna basar → modal (Hata/Eksik/Fikir + not + fotoğraf)
2. `feedback_kayitlari` tablosuna kaydolur (durum: `bekliyor`)
3. Süper admin `admin/panel.html` → Geri Bildirimler sekmesinde görür, onaylar
4. Onaylananlar `public_feedback` view'ına düşer (anon erişimli)
5. Claude yeni sohbette view'ı okur, CLAUDE.md'ye ekler

**Public view:** `https://ochvbepfiatzvyknkvsn.supabase.co/rest/v1/public_feedback`

---

## 5. VERİTABANI

**Aktif tablolar:** tenants, kullanicilar, tersaneler, projeler, devreler, spooller, spool_malzemeleri, pipeline_malzemeleri, kesim_kalemleri, kesim_listeleri, bukum_kalemleri, markalama_kalemleri, markalama_listeleri, fotograflar, belgeler, notlar, islem_log, audit_log, kk_davetler, kk_davet_spooller, sevkiyatlar, sevkiyat_spooller, testler, test_spooller, egitim_verisi, basamak_tanimlari, basamak_sablonlari, sayac_tanimlari, feature_flags, tenant_features, firma_moduller, is_kayitlari, kullanici_yetkileri, yetki_tanimlari, customer_kullanicilar, customer_project_access, feedback_kayitlari

**Public view:** `public_feedback` — anon erişimli, sadece onaylı feedbackler

---

## 6. YAPILACAKLAR

> Panel `admin/panel.html` → Yol Haritası sekmesi bu bölümü GitHub'dan okur.
> `[x]` = tamamlandı (panel'de kilitli ✓), `[ ]` = bekliyor (panel'de toggle edilebilir).
> Her sohbet sonunda tamamlananları `[x]` yap, yenileri `[ ]` olarak ekle.

### 🔴 ACİL
- [x] Admin panel yol haritası sekmesi — CLAUDE.md ile senkronize
- [ ] `admin/panel.html` visibility sorunu — html visibility:hidden kalıyor

### 🏭 Üretim & Saha
- [ ] `is_baslat.html` — operatör QR sonrası saha ekranı (önce tasarım)
- [ ] `qr_tara.html` → operator → `is_baslat.html` yönlendirmesini aktif et
- [ ] Rol bazlı sidebar → operatör yetkisiz linkleri görmesin

### ⚙️ Sistem & Altyapı
- [ ] Sayfa erişim kontrolü → `sayfaYetkiKontrol()` tüm sayfalara
- [ ] `admin/firma-detay.html` → tersane bağlantıları UI
- [ ] Supabase Storage path kontrolü
- [ ] Kullanıcı davet → service role key ile gerçek magic link
- [ ] `ares-layout.js` sidebar personel referansı kaldır

### 📊 Raporlar & Finans
- [ ] `hakedis.html` → tablolar hazır, UI yok
- [ ] `raporlar.html` → Supabase'den sıfırdan

### 🌍 Dil Coverage
- [x] `devre_detay.html` — tam i18n
- [x] `spool_detay.html` — tam i18n
- [x] `kesim.html` — tam i18n
- [x] `ar.json` + `en.json` + `tr.json` — 1428 anahtar, senkronize
- [x] `ares-lang.js` — `tr` dili atlaması kaldırıldı
- [ ] `bukum.html` `markalama.html` `kk.html` `sevkiyat.html` → i18n kontrol
- [ ] Diğer sayfalar → güncelleme geldiğinde Bölüm 9 kurallarına göre düzelt

### 🤖 AI & Analiz
- [ ] `ai_kuyruk` tablosu
- [ ] Fotoğraf analizi pipeline
- [ ] RAG veritabanı
- [ ] `egitim/` modülü — 4 sayfa
- [ ] `etiketleme.html`
- [ ] `tersaneler` tablosuna `format_profili` kolonu
- [ ] `egitim_verisi` tablosuna yeni kolonlar
- [ ] `ayarlar.html` → QR etiket fiziksel boyutu

### 🌐 Web Sitesi
- [ ] Landing page
- [ ] Demo/teklif talep formu
- [ ] Ücretsiz araçlar (1D Kesim, İzometri Batch, teknik tablolar, PDF kütüphane)
- [ ] Web kullanıcıları → tenant_type ile ayrıştır

### 📱 Mobil
- [ ] Expo Go test + eksik ekranlar

### 🤖 AI & Analiz
- [ ] `ai_kuyruk` tablosu
- [ ] Fotoğraf analizi pipeline
- [ ] RAG veritabanı
- [ ] `egitim/` modülü (4 sayfa)
- [ ] `etiketleme.html`
- [ ] `tersaneler` tablosuna `format_profili` kolonu
- [ ] `egitim_verisi` tablosuna yeni kolonlar
- [ ] `ayarlar.html` → QR etiket fiziksel boyutu

### 🌐 Web Sitesi
- [ ] Landing page
- [ ] Demo/teklif talep formu
- [ ] Ücretsiz araçlar (1D Kesim, İzometri Batch, teknik tablolar, PDF kütüphane)
- [ ] Web kullanıcıları → tenant_type ile ayrıştır

### 📱 Mobil
- [ ] Expo Go test + eksik ekranlar

---

## 7. AI SİSTEMİ PLANI

**2 katmanlı:** Hızlı (anlık QR sonrası) + Derin (gece batch)
**Veri kaynakları:** spool_foto, serbest_foto, tersane_geri_bildirim, arsiv, standart, dxf, video
**Onay:** 1 yetkili → süper admin final kontrol
**QR referans ölçü:** QR fiziksel boyutu AI kalibrasyonunda referans

---

## 8. WEB SİTESİ VİZYONU

Kullanıcılar web'de email ile kayıt → ücretsiz araçlara erişim → AresPipe demo/teklif talebi.
Altyapı: Supabase multi-tenant hazır, `tenant_type` ile web/AresPipe kullanıcıları ayrışır.

---

## 9. i18n KURALLARI — SAYFA GÜNCELLEME REHBERİ

> Bir sayfa güncellendiğinde bu kurallara göre kontrol yap.
> Güncelleme büyükse **parçalara böl:** CSS+Init → Statik HTML → Dinamik HTML → Toast+Log

### 9.1 CSS
```css
[data-theme=dark]{ }          /* ✅ tırnaksız */
[data-theme="dark"]{ }        /* ❌ tırnaklı — yasak */
```

### 9.2 tv() Güvenlik — Her sayfanın ana script bloğu başına
```javascript
if (typeof tv === 'undefined') { window.tv = function(k,fb){ return fb!==undefined?fb:k; }; }
if (typeof tvMalzeme === 'undefined') { window.tvMalzeme = function(k){ return k; }; }
if (typeof tvYuzey === 'undefined') { window.tvYuzey = function(k){ return k; }; }
```

**Global scope'ta tv() çağrısı yasak:**
```javascript
// ❌ Script parse anında tv() yok → ReferenceError
const ucMap = { duz: tv('ks_uc_duz','Düz') };
var STAGES = getSTAGES();

// ✅ Statik başlat, render fonksiyonunda güncelle
const ucMap = { duz: 'Düz' };
function getUcMap(){ return { duz: tv('ks_uc_duz','Düz') }; }
function render(){ if(typeof tv==='function') Object.assign(ucMap, getUcMap()); }

// ✅ Nesne literal içinde de wrapper şart
[{id:'fCap', l: function(){ return tv('cmn_th_cap','Çap'); }}]
```

**Global scope kontrol scripti:**
```python
python3 - << 'EOF'
import re
with open('sayfa.html') as f: content = f.read()
for si,s in enumerate(re.findall(r'<script[^>]*>(.*?)</script>',content,re.DOTALL)):
    d=0
    for i,l in enumerate(s.split('\n'),1):
        c=re.sub(r"'[^'\\]*(?:\\.[^'\\]*)*'|\"[^\"\\]*(?:\\.[^\"\\]*)*\"","''",l)
        d+=c.count('{')-c.count('}')
        if 'tv(' in l and d<=0: print(f"Blok {si+1}, satır {i}: {l.strip()[:100]}")
EOF
```

### 9.3 Init Döngüsü — Promise tabanlı (while kullanma)
```javascript
var _supaHazir = await new Promise(function(resolve) {
  var _el = 0;
  function _chk() {
    if (typeof ARES !== 'undefined') {
      var _s = typeof ARES.supabase === 'function' ? ARES.supabase() : null;
      if (_s && typeof _s.from === 'function') { resolve(true); return; }
    }
    _el += 200; if (_el >= 12000) { resolve(false); return; }
    setTimeout(_chk, 200);
  }
  _chk();
});
```

### 9.4 _onLangChange
- DOMContentLoaded **dışında** tanımlanmalı
- `_applyI18n()` ilk çağrı, ardından tüm dinamik render fonksiyonları
```javascript
window._onLangChange = function() {
  if (typeof _applyI18n === 'function') _applyI18n();
  if (typeof renderTable === 'function') renderTable();
  // sayfaya özgü diğer render fonksiyonları...
};
```

### 9.5 ARES Metodları — Doğru İmzalar
```javascript
ARES.spoollariGetir(devreId)              // silindi filtrelemez → client'ta .filter(s=>!s.silindi)
ARES.spoolDurdur(id, sebep, aciklama)     // 3 param
ARES.loguGetir({devreId: id}, 50)         // limit ayrı param (object içinde değil)
ARES.logEkle(islem, aciklama, katman, katmanId, meta)  // 5 param
ARES.softSil('tablo', id)
// ARES.devreGetir — BUG VAR (projeler.is_emri_no yok) → raw Supabase kullan
.not('silindi','eq',true)                 // silindi filtresi — .eq(false) NULL'ları kaçırır
```

### 9.6 DB Değer Normalizasyonu
```javascript
// Her sayfada bu 3 fonksiyon tanımlı olmalı:
function _normKey(raw){ /* Türkçe → ASCII lowercase */ }
function _malzemeGoster(raw){ return tvMalzeme(_normKey(raw)) || raw; }
function _yuzeyGoster(raw){ return tvYuzey(_normKey(raw)) || raw; }

// matBadge'de normalize et:
var ml = (m||'').toLowerCase().replace(/ı/g,'i').replace(/ç/g,'c')...
if (ml.indexOf('bakir') !== -1)  // 'bakır' değil 'bakir' ara

// Malzeme göster — her zaman matBadge veya _malzemeGoster
esc(k.malzeme)       // ❌
matBadge(k.malzeme)  // ✅
```

### 9.7 Dinamik HTML + Toast
```javascript
// innerHTML içinde tv():
'<th>' + tv('cmn_th_tersane','Tersane') + '</th>'  // ✅
'<th>Tersane</th>'                                  // ❌

// Toast:
toast(tv('ks_kesim_tamamlandi','Kesim tamamlandı'), 'success')  // ✅

// logEkle — büyük harf kod:
logEkle('KESIM_TAMAMLANDI', k.ad)  // ✅
logEkle('Kesim Tamamlandı', k.ad)  // ❌

// Adım metni — lblMap öncelikli (DB gorunen_ad Türkçe olabilir):
aktGor = lblMap[aktStr] || snap[akt].gorunen_ad || aktStr;
```

### 9.8 Güvenli Erişim
```javascript
(kl.kriter.tersaneler || []).map(...)  // ✅
kl.kriter.tersaneler.map(...)          // ❌ kriter null olabilir
```

### 9.9 Dil Dosyaları
- Yeni anahtar eklenince `ar.json` + `en.json` + `tr.json` hepsinde olmalı
- `ares-lang.js` satır 1: `if (_LANG[lang]) return;` (tr atlaması kaldırıldı)

---

## 10. SOHBET SONU GÜNCELLEME PROTOKOLÜ

Her sohbet bitiminde:

1. Tamamlanan iş var mı? → Bölüm 6'da `[ ]` → `[x]` yap
2. Yeni yapılacak çıktı mı? → Bölüm 6'ya `[ ]` ekle
3. Onaylanan feedback → Bölüm 6'ya uygun gruba ekle
4. Yeni karar → İlgili bölüme ekle

**Panel senkronizasyonu otomatik** — Bölüm 6 GitHub'a push edilince
`admin/panel.html` Yol Haritası sekmesi → "↻ Yenile" ile anında güncellenir.

**Bu dosya güncel değilse bir sonraki sohbet bağlamsız başlar.**
