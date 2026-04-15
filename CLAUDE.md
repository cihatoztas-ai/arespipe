# AresPipe — Claude Proje Bağlamı

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: 14 Nisan 2026

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

**YASAK tema seçiciler:**
- `[data-theme="dark"]` — doğrusu `[data-theme=dark]` (tırnak yok)
- `:root[data-theme="dark"]` sözdizimi

### 2.4 Sol Kenar Renk Sistemi (Kural B-01)

```css
.cl-ac  { border-left: 3px solid var(--ac)   !important; }
.cl-gr  { border-left: 3px solid var(--gr)   !important; }
.cl-re  { border-left: 3px solid var(--re)   !important; }
.cl-warn{ border-left: 3px solid var(--warn) !important; }
.cl-leg { border-left: 3px solid var(--leg)  !important; }
```

### 2.5 Font Size Kuralı

Minimum font-size: `14px`.

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

### 2.9 data-i18n Kuralı (Kural D-02)

Child elementi olan elementlere `data-i18n` konulmaz.

**YANLIŞ:**
```html
<button data-i18n="key">Metin <span id="badge">0</span></button>
```

**DOĞRU:**
```html
<button><span data-i18n="key">Metin</span> <span id="badge">0</span></button>
```

### 2.10 Feature Flag Sistemi ✅

`ARES.featureVar(kod)` — `tenant_features` tablosundan okur:
- `aktif: true` → özellik açık
- `aktif: false` veya kayıt yoksa → kapalı

Web'de doğrudan Supabase sorgusu, mobilde `mFeatureAktif(kod)` wrapper kullanılır.

**Aktif feature flag kodları:** `3d_model`, `ai_izometri`, `hakedis`, `musteri_portal`, `raporlar_gelismis`

### 2.11 Yetkilendirme Sistemi

**Altyapı hazır, UI eksik.**

- `kullanici_yetkileri` tablosu — bireysel override (UI yok)
- `ARES.yetkiVar(kod)` — async, DB override'ları dahil
- `ARES.sayfaYetkiKontrol(roller)` — rol bazlı sayfa erişimi
- Mobil için `mSayfaKontrol(roller, featureKod)` ileride eklenecek

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
```

### 3.4 vercel.json — Cache Kontrolü ✅

Tüm `.html`, `ares-*.js`, `ares-mobile.*`, `lang/*.json` — no-cache.

---

## 4. VERİTABANI

### 4.1 Aktif Tablolar

`tenants`, `kullanicilar`, `tersaneler`, `projeler`, `devreler`, `spooller`, `spool_malzemeleri`, `pipeline_malzemeleri`, `kesim_kalemleri`, `bukum_kalemleri`, `markalama_kalemleri`, `fotograflar`, `belgeler`, `notlar`, `islem_log`, `audit_log`, `kk_davetler`, `kk_davet_spooller`, `sevkiyatlar`, `sevkiyat_spooller`, `testler`, `test_spooller`, `basamak_tanimlari`, `basamak_sablonlari`, `sayac_tanimlari`, `feature_flags`, `tenant_features`, `firma_moduller`, `is_kayitlari`, `kullanici_yetkileri`, `yetki_tanimlari`, `feedback_kayitlari`, `customer_kullanicilar`, `customer_project_access`

### 4.2 Kritik Kolon Adları (Supabase'de doğrulandı)

**spooller:**
- `dis_cap_mm` (cap_mm değil), `et_kalinligi_mm` (et_mm değil)
- `agirlik` (agirlik_kg boş), `rev` (revizyon değil)
- `durdurma_sebebi` (durdurma_aciklama değil)
- `alistirma` değerleri: `VAR` / `KISMI` / `YOK` (uppercase)
- `aktif_basamak` değerleri: `on_imalat` (400), `on_kontrol` (68), `kaynak` (14), `imalat` (9), `kk` (5), `sevkiyat` (4)
- `ilerleme INTEGER DEFAULT 0` — kümülatif puan (0-100), basamak geçişinde `+= basamak.ilerleme_puani`

**tenants:**
- `ilerleme_yontemi TEXT DEFAULT 'adet'` — `'adet'` veya `'agirlik'` (firma iç ekranları için)
- `firma_tipi` genişletildi: `imalat`, `montaj`, `imalat_montaj`, `tersane_tam`, `tersane_taseron`, `tersane_karma`, `diger`

**basamak_tanimlari:**
- `ilerleme_puani INTEGER DEFAULT 0` — basamak tamamlanınca spool'a eklenecek puan (toplam 100 önerilir)

**customer_kullanicilar:**
- `ilerleme_yontemi TEXT DEFAULT 'adet'` — müşteri portalı için `'adet'` veya `'agirlik'`

**devreler:**
- `ad` (devre_adi değil), `durum`, `durdurma_sebebi`
- `ilerleme` kolonu — artık `spooller.ilerleme` ortalamasından (adet) veya ağırlık bazlı hesaplanacak
- `agirlik` kolonu var ama yerine `spooller.agirlik` toplamı kullanılmalı

**fotograflar:**
- `dosya_url` (url değil), `yukleyen_id` (kullanici_id değil), `islem_turu` (asama değil)

**islem_log:**
- `katlan` (tablo_adi değil)

### 4.3 Beklemedeki Tablolar

| Tablo | Durum |
|---|---|
| `hakedis_paketleri/spooller/kriterleri` | hakedis.html yazılınca |
| `tarama_sonuclari` | 3D lazer cihaz gelince |
| `rol_sablonlari` | Yetki UI yazılınca |

---

## 5. SAYFA ENVANTERİ

### 5.1 Web Sayfaları

| Sayfa | Durum |
|---|---|
| `giris.html` | ✅ Temiz |
| `index.html` | ✅ Widget sistemi mevcut |
| `devreler.html` | ✅ Kum saati kaldırıldı |
| `devre_detay.html` | ✅ |
| `spool_detay.html` | ✅ Feature flag 3D kontrolü var |
| `kesim.html`, `bukum.html`, `markalama.html` | ✅ |
| `kalite_kontrol.html`, `sevkiyatlar.html` | ✅ |
| `testler.html`, `log.html` | ✅ |
| `kullanicilar.html` | ✅ Magic link davet |
| `proje_liste.html`, `proje_detay.html` | ⚠️ Supabase entegrasyonu yok |
| `qr_tara.html` | ✅ Rol bazlı yönlendirme |
| `ayarlar.html` | ⚠️ tenants Supabase bağlantısı eksik |
| `raporlar.html` | ❌ Sıfırdan yazılacak |
| `is_baslat.html` | ❌ Yeni yazılacak (operatör saha ekranı) |

### 5.2 Mobil Sayfalar (`mobile/`)

| Sayfa | Durum |
|---|---|
| `giris.html` | ✅ Yeni — tema+dil toggle, RTL |
| `index.html` | ✅ |
| `devreler.html` | ✅ Filtre, stat, kart tasarımı |
| `devre_detay.html` | ✅ i18n, kolon düzeltmeleri |
| `spool_detay.html` | ✅ i18n, fotoğraf, feature flag 3D |
| `qr.html` | ✅ BarcodeDetector + jsQR CDN fallback |
| `gemiler.html` | ⏳ |
| `gemi_detay.html` | ⏳ |
| `kk.html` | ⏳ |
| `sevkiyat.html` | ⏳ |
| `tezgahlar.html` | ⏳ |
| `ara.html` | ⏳ |
| `bildirim.html` | ⏳ |
| `is_baslat.html` | ⏳ Operatör iş ekranı |

---

## 6. GÜVENLİK ✅

- Auth: `sb-*-auth-token` localStorage
- Logout: `ARES.cikisYap()`
- Davet: sadece `signInWithOtp()` (magic link)
- Debug badge: kaldırıldı

---

## 7. YAPILACAKLAR

### FAZ 0-5 ✅ TAMAMLANDI
Güvenlik, renk sistemi, flash prevention, CSS/dil sistemi, silme işlemleri.

### FAZ 6 — İşlevsel geliştirme

- [x] `qr_tara.html` → rol bazlı yönlendirme ✅
- [x] `ares-layout.js` → tv() geçişi, default tema, topbar saat ✅
- [x] `index.html` → widget sistemi ✅
- [x] `ares-store.js` → `featureVar()` + `featureCacheSifirla()` eklendi ✅
- [x] `devreler.html` (web) → kum saati metni kaldırıldı ✅
- [x] `devreler.html` → RPC ile doğru aggregate, filtreler, termin/iptal Supabase'e bağlandı ✅
- [x] `ares-store.js` → spoollariGetir limit 5000, devreleriGetir limit 2000 ✅
- [x] `devre_detay.html` → is_durumu pulse animasyonu ✅
- [x] `admin/firma-detay.html` → ilerleme_puani, siraDegistir fix ✅
- [x] `admin/firma.html` → basamaklar paneli kaldırıldı ✅
- [x] `admin/panel.html` → yeni firma butonu yeni-firma.html'e yönlendirildi ✅
- [ ] `ayarlar.html` → tenants Supabase bağlantısı
- [ ] `is_baslat.html` → operatör saha ekranı (mockup hazır, personel rolleri netleşince)
- [ ] Personel rolleri ve yetkilendirme — sahada kim hangi basamağı geçebilir?
- [ ] `proje_liste.html`, `proje_detay.html` → Supabase entegrasyonu
- [ ] Sayfa erişim kontrolü → `sayfaYetkiKontrol()` tüm sayfalara
- [ ] Rol bazlı sidebar → operatör yetkisiz linkleri görmemeli
- [ ] `kullanici_detay.html` → bireysel yetki yönetim UI'ı (kullanici_yetkileri tablosu)
- [ ] `hakedis.html` → yeni sayfa
- [ ] `raporlar.html` → Supabase'den sıfırdan
- [ ] Mevcut spoolların `ilerleme=0` sorunu → SQL update (puan sistemi öncesi ilerleyenler)

### Geri Bildirimlerden — Onaylananlar

- [ ] 🐛 Proje ilerleme sistemi doğru çalışmıyor — düzeltilecek
- [ ] 🐛 Kesim listesine geçişte hata veriyor
- [ ] 🐛 Geri bildirim fotoğrafları süper admin'e iletilmiyor
- [ ] 🐛 Sayfa üst bilgi kutularında yazı boyutu/tipi standardize edilecek
- [ ] 🐛 `api/izometri-oku` → 502 Bad Gateway hatası araştırılacak
- [ ] 📋 Devre detay sayfası başlık formatı: Tersane / Gemi No / Devre Adı / Zone (spool detay gibi tek format)
- [ ] 📋 PDF çıktıları → firma ve program logoları, sayfa düzeni
- [ ] 📋 Günlük/haftalık veri yedekleme sistemi (internet bağımsız depolama)
- [ ] 📋 Tersane KK talebi oluştururken inspection formu da hazırlanacak
- [ ] 📋 QR kod etiket boyutları netleştirilecek + etiket tasarımı
- [ ] 💡 Kurulumda aktif dil seçimi — kullanıcılar sadece seçilen dilleri görür
- [ ] 💡 GitHub yedek reposu stratejisi — veri koruması için plan

### FAZ 7 — Mobil sayfalar (DEVAM EDİYOR)

- [x] `mobile/giris.html` ✅
- [x] `mobile/index.html` ✅
- [x] `mobile/devreler.html` ✅
- [x] `mobile/devre_detay.html` ✅
- [x] `mobile/spool_detay.html` ✅
- [x] `mobile/qr.html` ✅
- [ ] `mobile/is_baslat.html` → mockup hazır, personel rolleri netleşince
- [ ] `mobile/gemiler.html`
- [ ] `mobile/gemi_detay.html`
- [ ] `mobile/kk.html`
- [ ] `mobile/sevkiyat.html`
- [ ] `mobile/tezgahlar.html`
- [ ] `mobile/ara.html`
- [ ] Mobil sayfalarda ilerleme hesabı → ASAMA_PCT kaldırıldı, spooller.ilerleme kullanılacak
- [ ] Mobil sayfalara `mSayfaKontrol()` ekle (sayfalar bittikten sonra)
- [ ] Mobil sayfalara feature flag kontrolleri yay

### FAZ 8 — AI Sistemi

- [ ] `ai_kuyruk` tablosunu kur
- [ ] Fotoğraf yüklenince → hızlı analiz → anlık uyarı
- [ ] Spool tamamlanınca → derin analiz → havuza ekle → onay/red

### FAZ 9 — Eğitim Merkezi

- [ ] `egitim/index.html`, `yukle.html`, `dogrula.html`, `admin.html`
- [ ] RAG veritabanı kurulumu
- [ ] `tersaneler` tablosuna `format_profili` kolonu

### API Düzeltmeleri ✅

- [x] `api/izometri-oku.js` → Node.js, max_tokens 8192
- [x] `api/sorgula.js` → Node.js

---

## 8. KARAR VERİLMİŞ KONULAR

### Mobil Auth
`mAuthKontrol()` → `giris.html` (relative, `mobile/giris.html`'e gider). `../giris.html` değil.

### Mobil Giriş
`mobile/giris.html` — web giris.html'den bağımsız. `ARES.girisYap()` kullanır, başarıda `index.html`'e yönlendirir.

### QR → Rol bazlı yönlendirme (Mobil)
```js
if (rol === 'operator') {
  location.href = 'spool_detay.html?id=' + data.id; // ileride is_baslat.html
} else {
  location.href = 'spool_detay.html?id=' + data.id;
}
```

### is_baslat.html — Operatör Saha Ekranı
- Spool özet (büyük font, sahada okunabilir)
- Aktif basamak göstergesi
- "İşi Başlat" / "İşi Tamamla" butonu
- Hızlı fotoğraf çek
- Spool durdurulmuşsa büyük kırmızı uyarı

### Feature Flag Sistemi
- Karar mekanizması: `tenant_features` tablosu (sadece)
- Web: `featureFlagKontrol()` local fonksiyon (spool_detay.html)
- Global: `ARES.featureVar(kod)` → tenant_features tablosundan
- Mobil: `mFeatureAktif(kod)` → ARES.featureVar() wrapper

### Ağırlık Hesabı
`devreler.agirlik` kolonu değil → `spooller.agirlik` toplamı kullanılmalı

### İlerleme Hesabı
`devreler.ilerleme` artık dinamik hesaplanıyor — hardcoded `ASAMA_PCT` kaldırıldı.

**Adet bazlı (varsayılan):**
`ORTALAMA(spooller.ilerleme)` — her spool eşit ağırlıklı

**Ağırlık bazlı:**
`Σ(spool.agirlik × spool.ilerleme) / Σ(spool.agirlik)`

Hangi yöntemin kullanılacağı:
- Firma iç ekranları → `tenants.ilerleme_yontemi`
- Müşteri portali → `customer_kullanicilar.ilerleme_yontemi`

### Arapça RTL
Mobilde aktif — `dir=rtl` HTML attribute + CSS `[dir=rtl]` kuralları `ares-mobile.css`'de.

### Yetkilendirme Sıralaması
Sayfaları bitir → yetki matrisini belirle → `mSayfaKontrol()` ekle → firma/kullanıcı oluştur.

### Dil Dosyası Durumu (14 Nisan 2026)
| Dosya | Anahtar Sayısı |
|---|---|
| tr.json | ~1129 |
| en.json | ~1782 |
| ar.json | ~1782 |

### CI/CD — GitHub Actions
Her push'ta otomatik kural kontrolü. Kural dosyası: `.github/kurallar.json`

### İlerleme Hesaplama Sistemi (14 Nisan 2026)

**Spool ilerleme puanı:**
- `basamak_tanimlari` tablosuna `ilerleme_puani INTEGER DEFAULT 0` kolonu eklendi
- Toplam 100 puan üzerinden firma kendi basamaklarına ağırlık atar
- Spool bir basamaktan çıktığında → `spooller.ilerleme += basamak.ilerleme_puani`
- Atlanılan basamakların puanı hesaba katılmaz (personel sonraki basamağı seçer)
- Örnek: Ön İmalat=10, İmalat=20, Kaynak=25, Ön Kontrol=15, KK=15, Sevkiyat=15 → toplam 100

**Devre ilerlemesi — iki yöntem:**
- `tenants.ilerleme_yontemi TEXT DEFAULT 'adet'` → `'adet'` veya `'agirlik'`
- Adet bazlı: `ORTALAMA(tüm spoolların ilerleme puanı)`
- Ağırlık bazlı: `Σ(spool.agirlik × spool.ilerleme) / Σ(spool.agirlik)`
- Firma iç ekranları daima `tenants.ilerleme_yontemi` kullanır

**Müşteri portali için ayrı yöntem:**
- `customer_kullanicilar.ilerleme_yontemi TEXT DEFAULT 'adet'`
- Müşteri A adetten, Müşteri B ağırlıktan görebilir — aynı proje verisi üzerinden
- Müşteri ağırlık üzerinden görse bile firma iç ekranı `tenants.ilerleme_yontemi` ile çalışır
- Müşteri ekranı açılırken süper admin bu tercihi seçer, seçilmezse varsayılan `adet`

**Kaynak basamağı:**
Kaynak çeşidi (argon/gazaltı/orbital vb.) basamak sisteminde ayrıştırılmaz.
Tüm kaynak türleri tek `kaynak` basamağı olarak gösterilir. Gelecekte yeni kaynak türleri gelse de bu yapı değişmez.

**Personel iş akışı (is_baslat.html):**
- QR okutunca spool mevcut basamağı görür
- "İşi Tamamla" → sistem aktif basamakları listeler → personel seçer → puan eklenir
- Basamak atlanabilir (örnek: imalat yok → ön imalattan ön kontrole direkt)

### Firma Tipi Genişletme (14 Nisan 2026)
`tenants.firma_tipi` değerleri genişletildi (text kolon, geriye dönük uyumlu):
- `imalat` — Spool İmalat Firması
- `montaj` — Spool Montaj Firması
- `imalat_montaj` — İmalat + Montaj Firması
- `tersane_tam` — Tersane (Tam Entegre)
- `tersane_taseron` — Tersane (İmalat Taşerona Verilmiş)
- `tersane_karma` — Tersane (Kısmi Taşeron)
- `diger` — Diğer

### Basamak Yönetimi Süper Admin'e Taşındı (14 Nisan 2026)
- `tanimlar.html`'den İşlem Basamakları sekmesi kaldırıldı
- `admin/firma.html`'den Basamaklar paneli kaldırılacak
- Basamak CRUD artık sadece `admin/firma-detay.html`'de (süper admin)
- Basamak silme: hard delete (soft delete değil) — aktif spoolların limbo'ya düşmemesi için silmeden önce kontrol gerekmez, sistem `ilerleme` kolonunu kümülatif tutuğundan etkilenmez
- Şablon yükleme: 3 hazır şablon (İmalat / Montaj / Tersane Tam)

### Firma Yönetimi — Yeni Dosyalar (14 Nisan 2026)
- `admin/yeni-firma.html` — 4 adımlı wizard (yeni dosya)
- `admin/firma-detay.html` — magic link davet + basamak yönetimi + genişletilmiş firma tipi
- `tanimlar.html` — sadece Kod Serileri kaldı

### Kullanıcı Daveti
`firma-detay.html` ve `yeni-firma.html`'de kullanıcı ekleme artık `auth.admin.inviteUserByEmail()` ile yapılır (magic link). Şifre belirlenmez. Davet bekleyen kullanıcılar `aktif: false` + `son_giris: null` ile işaretlenir.

---

## 9. DOSYA YAPISI

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
├── [diğer web sayfaları]
├── ares-store.js           ← featureVar() eklendi
├── ares-lang.js
├── ares-layout.js
├── vercel.json
├── CLAUDE.md               ← bu dosya
├── CLAUDE-MOBILE.md        ← mobil sistem kuralları
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

## 11. 15 NİSAN 2026 OTURUMU — KARARLAR VE DURUM

### Bu Oturumda Tamamlananlar
- `devreler.html` — RPC ile doğru aggregate hesaplama, filtreler, termin/iptal Supabase'e bağlandı
- `ares-store.js` — spoollariGetir limit 5000, devreleriGetir limit 2000 eklendi
- `devre_detay.html` — is_durumu pulse animasyonu eklendi (imalat/kaynak basamaklarında)
- `devre_istatistik` RPC fonksiyonu Supabase'e eklendi
- `spooller.is_durumu` kolonu eklendi (bekliyor/devam_ediyor)
- `devreler.termin_tarihi` kolonu silindi — `termin` kullanılıyor
- `pipeline_malzemeleri.hazir` kolonu eklendi
- `admin/yeni-firma.html` CI/CD istisna listesine eklendi
- Test firmaları (6 adet) Supabase'e eklendi

### Kritik Mimari Kararlar
**RPC Kullanımı:** Aggregate hesaplama gereken yerlerde (liste sayfaları) RPC kullanılır. Detay sayfaları için gerekli değil.
**Supabase limiti:** PostgREST default 1000 satır — nested join'den kaçın, direkt sorgu + limit kullan.
**`devre_istatistik` RPC:** devreler.html'de tüm stat hesapları buradan gelir. Filtre parametresi: `devre_ids uuid[]`.

### Bekleyen — Sıradaki Oturum
1. **Personel rolleri ve yetkilendirme** — sahada kim hangi basamağı geçebilir? Roller netleşmeli.
2. **`is_baslat.html`** — mockup onaylandı, personel yetkilendirme kararına bağlı. Akış: QR tara → spool bilgi → işe başla (is_durumu=devam_ediyor) → iş bitir → basamak seç → ilerlet.
3. **Mobil sayfalar** — devreler, gemi_detay, kk, sevkiyat vb. web ile uyumlu değil.
4. **Veri kalitesi uyarı sistemi** — eksik çap/malzeme bilgisi olan spooller için uyarı. CLAUDE.md'ye karar olarak eklendi, gelecek özellik.
5. **`kurallar.html` satır 938 ve `lang/tr.json` satır 718** — CI/CD uyarıları, "Yükleniyor" metni kaldırılacak.
6. **Mevcut spoolların `ilerleme=0` sorunu** — puan sistemi kurulmadan ilerlemiş spooller için SQL update gerekiyor.
7. **CLAUDE-MOBILE.md** — mobil sistem kuralları güncellenmeli.

### is_durumu Akışı (Onaylanan)
```
on_imalat (bekliyor) → imalat/kaynak başlatınca → imalat (devam_ediyor) [PULSE]
                     → iş bitince → sonraki basamak (bekliyor)
```
Sadece `imalat` ve `kaynak` basamaklarında pulse animasyonu gösterilir.

## 10. SOHBET SONU GÜNCELLEME PROTOKOLÜ

Her sohbet bitiminde:

1. Yeni karar alındı mı? → Bölüm 8'e ekle
2. Tamamlanan var mı? → Bölüm 7'de `[x]` yap
3. Yeni sayfa eklendi mi? → Bölüm 5 ve 9'u güncelle
4. Veritabanı değişikliği? → Bölüm 4'ü güncelle
5. Yeni kural? → Bölüm 2'ye ekle

**Bu dosya güncel değilse bir sonraki sohbet bağlamsız başlar.**
