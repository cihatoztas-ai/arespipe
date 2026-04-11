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

**YASAK renkler** (eski admin/portal/AI sistemi kalıntısı):
- `#3b82f6`, `#22c55e`, `#0a0b0e`, `#10b981`, `#0d0f1a`

**YASAK tema seçiciler:**
- `[data-theme="light"]`, `[data-theme="slate"]`, `[data-theme="navy"]`
- `:root[data-theme="dark"]` sözdizimi — doğrusu `[data-theme=dark]`

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
  tr.json  — Türkçe (primary, implicit)
  en.json  — İngilizce
  ar.json  — Arapça (test amaçlı, RTL desteği yok, tasarım bittikten sonra kaldırılacak)
```

### 3.3 Anahtar Prefix Sistemi

```
nav_*   — Sidebar navigasyon
cmn_*   — Ortak (malzeme, durum, buton) — TÜM SAYFALARDA KULLANILIR
sp_*    — spool_detay.html
dv_*    — devre_detay.html
ks_*    — kesim.html
bk_*    — bukum.html
mk_*    — markalama.html
kk_*    — kalite_kontrol.html
ts_*    — testler.html
log_*   — log.html
```

### 3.4 Ortak Anahtarlar (cmn_) — YAPILACAK

Henüz eksik. `en.json`'a eklenecek:
- Malzeme adları: `cmn_mat_karbon`, `cmn_mat_paslanmaz` vb.
- Durum etiketleri: `cmn_durum_bekliyor`, `cmn_durum_tamamlandi` vb.
- Butonlar: `cmn_kaydet`, `cmn_iptal`, `cmn_sil` vb.

**Yeni dil eklemek:** `en.json`'ı kopyala → yeni JSON yap → `lang/` klasörüne at. Başka hiçbir şey değişmez.

### 3.5 vercel.json — Cache Kontrolü (YAPILACAK)

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
-- örnek: {"spool_no_konumu":"sol_ust","malzeme_tablo":"sag_alt","standart":"ASME"}
```

---

## 5. SAYFA ENVANTERİ

### 5.1 Aktif ve Temiz Sayfalar

| Sayfa | Flash | lang.js | Supabase | Durum |
|---|---|---|---|---|
| `giris.html` | ✅ | — | ✅ | Temiz |
| `index.html` | ✅ | ✅ | ✅ | Temiz |
| `devreler.html` | ✅ | ✅ | ✅ | Temiz |
| `devre_detay.html` | ✅ | ✅ | ✅ | Temiz |
| `devre_yeni.html` | ✅ | ✅ | ✅ | Temiz |
| `spool_detay.html` | ✅ | ✅ | ✅ | Temiz |
| `kesim.html` | ✅ | ✅ | ✅ | px14px fix gerekli |
| `bukum.html` | ✅ | ✅ | ✅ | Temiz |
| `markalama.html` | ✅ | ✅ | ✅ | Temiz |
| `kalite_kontrol.html` | ✅ | ✅ | ✅ | px14px fix gerekli |
| `sevkiyatlar.html` | ✅ | ✅ | ✅ | Ölü tema CSS var |
| `testler.html` | ✅ | ✅ | ✅ | px14px fix gerekli |
| `log.html` | ✅ | ✅ | ✅ | Ölü tema CSS var |
| `tanimlar.html` | ✅ | ✅ | ✅ | Temiz |
| `tezgahlar.html` | ✅ | ✅ | ✅ | Temiz |
| `kullanicilar.html` | ✅ | ✅ | ✅ | Davet fix gerekli |
| `kullanici_detay.html` | ✅ | ✅ | ✅ | Temiz |
| `qr_tara.html` | ✅ | ✅ | ✅ | Rol yönlendirmesi eklenecek |
| `proje_liste.html` | ✅ | ✅ | ✅ | Temiz |

### 5.2 Düzeltme Gereken Sayfalar

| Sayfa | Sorun |
|---|---|
| `proje_detay.html` | syos_theme, ares_lang yok |
| `uyarilar.html` | syos_theme, ares_lang yok |
| `ayarlar.html` | syos_theme, ares_lang yok, Supabase bağlantısı yok |
| `raporlar.html` | syos_theme, SYOS bazlı — sıfırdan yazılacak |
| `tersaneler.html` | yerel _I18N, email→iletisim kolon hatası |
| `sorgula.html` | ares_lang yok, AI renk sistemi |
| `izometri-batch.html` | ares_lang yok, AI renk sistemi |
| `devre_duzenle.html` | AI renk sistemi, history.back() sorunu |
| `admin/panel.html` | Flash yok, admin renk sistemi, CDN duplikasyon |
| `admin/firma.html` | Flash yok, admin renk sistemi, CDN duplikasyon |
| `admin/firma-detay.html` | Flash yok, admin renk sistemi, CDN duplikasyon |
| `portal/index.html` | Flash yok, admin renk sistemi, CDN duplikasyon |

### 5.3 Silinecek Sayfalar

- `personel.html` — iptal edildi
- `personel_yeni.html` — iptal edildi
- `senaryolar.html` — gerek kalmadı

---

## 6. GÜVENLİK SORUNLARI (KRİTİK — YAPILMADI)

### 6.1 Logout — Supabase session kapatılmıyor

```js
// ares-layout.js — YANLIŞ (mevcut):
localStorage.removeItem('ares_oturum');
window.location.href = 'giris.html';

// DOĞRU (olması gereken):
await ARES.cikisYap();
window.location.href = 'giris.html';
```

### 6.2 authKontrol() — Sahte güvenlik

Şu an session yoksa demo kullanıcı oluşturup sayfaya geçiriyor. Gerçek auth kontrolü yapılmalı.

### 6.3 Debug Badge — Production'da açık

Her kullanıcı sağ altta "🟢 Supabase · yonetici" görüyor. Kaldırılacak.

---

## 7. YAPILACAKLAR LİSTESİ

### FAZ 0 — Güvenlik (1 dosya, KRİTİK)
- [ ] `ares-layout.js` logout → `ARES.cikisYap()`
- [ ] `ares-layout.js` authKontrol() → gerçek kontrol
- [ ] `ares-layout.js` debug badge → kaldır

### FAZ 1 — Renk sistemi (7 dosya)
- [ ] `admin/panel.html`, `admin/firma.html`, `admin/firma-detay.html`
- [ ] `portal/index.html`
- [ ] `sorgula.html`, `izometri-batch.html`, `devre_duzenle.html`
→ Hepsi ana uygulama renk sistemine çekilir

### FAZ 2 — Flash prevention + ares-lang.js (10 dosya)
- [ ] syos→ares: `proje_detay`, `uyarilar`, `ayarlar`, `raporlar`
- [ ] ares_lang ekle: `sorgula`, `izometri-batch`
- [ ] yerel _I18N→ares-lang.js: `tersaneler`
- [ ] flash prevention ekle: `admin/panel`, `admin/firma`, `portal/index`

### FAZ 3 — CSS hata düzeltme
- [ ] `px14px`→`14px`: `testler`, `kesim`, `kalite_kontrol`
- [ ] Ölü tema CSS temizle: `sevkiyatlar`, `log`, `index`
- [ ] Çakışan `:root` sil: `personel_yeni`
- [ ] light-anthracite renk fix: `kesim`

### FAZ 4 — Tekil düzeltmeler
- [ ] `tersaneler.html` → `email` → `iletisim`
- [ ] `kullanicilar.html` → davet → magic link
- [ ] `vercel.json` → `ares-lang.js` + `lang/*.json` no-cache ekle
- [ ] `en.json` + `ar.json` → `nav_personel` sil
- [ ] `ares-layout.js` → sidebar aktif sayfa tespiti iyileştir
- [ ] `spool_detay.html` → `tarama_sonuclari` sorgusunu kaldır
- [ ] `devre_duzenle.html` → `history.back()` → `devre_detay.html?id=X`
- [ ] Admin/portal → CDN Supabase script kaldır
- [ ] `spool_detay.html` → URL param her zaman localStorage'dan önce gelsin

### FAZ 5 — Silme
- [ ] `personel.html` sil
- [ ] `personel_yeni.html` sil
- [ ] `senaryolar.html` sil
- [ ] `ares-layout.js` NAV listesinden personel kaldır

### FAZ 6 — İşlevsel geliştirme
- [ ] `ayarlar.html` → `tenants` Supabase bağlantısı
- [ ] `qr_tara.html` → rol bazlı yönlendirme (operatör→`is_baslat.html`, diğerleri→`spool_detay.html`)
- [ ] `is_baslat.html` → yeni sayfa (tasarım hazır olunca)
- [ ] Sayfa erişim kontrolü → `sayfaYetkiKontrol()` tüm sayfalara
- [ ] Rol bazlı sidebar → operatör yetkisiz linkleri görmemeli
- [ ] Rol şablonu UI → firma admin şablon oluşturma ekranı
- [ ] `tersane_firma_iliskileri` → `admin/firma-detay.html` placeholder
- [ ] `admin/firma-detay.html` → "Tersane Bağlantıları" sekmesi placeholder
- [ ] Supabase Storage path kontrolü → `arsiv_plani.md` ile uyumlu mu?
- [ ] `hakedis.html` → yeni sayfa (tablolar hazır)
- [ ] `raporlar.html` → Supabase'den sıfırdan
- [ ] Dil coverage → `cmn_` anahtarlar + eksik sayfalar
- [ ] `ares-layout.js` dil sistemi → `t()` kaldır, sadece `tv()` kullan

### FAZ 7 — AI Sistemi
- [ ] `ai_kuyruk` tablosunu kur
- [ ] `ayarlar.html`'e QR etiket fiziksel boyutu ekle
- [ ] Fotoğraf yüklenince → hızlı analiz → anlık uyarı (FAZ 2 AI)
- [ ] Spool tamamlanınca → derin analiz → havuza ekle → onay/red
- [ ] `egitim_verisi` tablosuna yeni kolonlar ekle

### FAZ 8 — Eğitim Merkezi (yeni modül)
- [ ] `egitim/index.html` — genel bakış
- [ ] `egitim/yukle.html` — web'den veri yükleme
- [ ] `egitim/dogrula.html` — yetkili kişi onay ekranı
- [ ] `egitim/admin.html` — süper admin yönetimi
- [ ] Mobil fotoğraf ekleme ekranı
- [ ] RAG veritabanı kurulumu (standartlar, DXF tablolar, video transkriptleri)
- [ ] `tersaneler` tablosuna `format_profili` kolonu
- [ ] Arşiv verisi toplu yükleme

---

## 8. KARAR VERİLMİŞ KONULAR

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
Altyapı hazır (`rol_sablonlari`, `yetki_tanimlari`, `kullanici_yetkileri`, `yetkiVar()`, `sayfaYetkiKontrol()`). Sadece UI eksik.

**Katmanlar:**
1. Süper Admin → firma bazlı modül açma/kapama (`tenant_features`)
2. Firma Admin → rol şablonu oluştur (Kaynakçı, Kesimci, KK Uzmanı...)
3. Kullanıcı → rol şablonu ata + üstüne ek yetki

### tarama_sonuclari
3D lazer tarama cihazı entegrasyonu için beklemede. `spool_detay.html`'deki sorgudan kaldırıldı (gereksiz yük).

### tersane_firma_iliskileri
Multi-tenant taşeron takibi için kuruldu. Şu an UI yok. `admin/firma-detay.html`'e placeholder gelecek.

### Arapça RTL
Test amaçlı kullanılıyor — çeviri coverage kontrolü için. Tasarım bittikten sonra dil menüsünden kaldırılacak. RTL CSS implementasyonu yapılmayacak.

### Veri Saklama Politikası
- Yasal zorunluluk yok
- Eğitim verisi onaylanınca orijinal Storage dosyası silinebilir
- Süper admin karar verir
- Spool detayda "Eğitim verisi olarak kullanıldı" ifadesi yeterli

### Eğitim Verisi Onay Akışı
```
Veri girildi → 1 yetkili onayladı → Süper admin son kontrol → Eğitime girer
```
Süper admin şüpheli veriyi düzeltip tekrar kaydedebilir.

### AI Fotoğraf Analizi — 2 Katman
| Katman | Tetikleyici | Amaç |
|---|---|---|
| Hızlı | Fotoğraf yüklenince | Anlık hata uyarısı |
| Derin | Spool tamamlanınca | Bütünsel doğrulama + eğitim |

### QR Referans Ölçü
QR kodun fiziksel boyutu `ayarlar.html`'e eklenecek. Claude fotoğraftaki QR piksel boyutundan gerçek ölçek hesaplayacak.

### AI Veri Kaynakları
| Kaynak | Nereden | Nasıl |
|---|---|---|
| `spool_foto` | Spool detay | Otomatik |
| `serbest_foto` | Saha gezisi | `etiketleme.html` |
| `tersane_geri_bildirim` | Tersane grubu | `etiketleme.html` |
| `arsiv` | Geçmiş projeler | Toplu yükleme |
| `standart` | PDF standartlar | RAG |
| `dxf` | Malzeme çizimleri | Boyut tablosuna dönüştür |
| `video` | YouTube eğitim | Whisper transkript → RAG |

### CI/CD — GitHub Actions
Her push'ta otomatik kural kontrolü. Hata varsa Vercel deploy durur.
Kural dosyası: `.github/kurallar.json`

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
│   ├── en.json
│   └── ar.json            ← tasarım bittikten sonra kaldırılacak
├── admin/
│   ├── panel.html
│   ├── firma.html
│   └── firma-detay.html
├── portal/
│   └── index.html
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
5. Yeni kural belirlendi mi? → Bölüm 2'ye ekle, `.github/kurallar.json`'a da ekle

**Bu dosya güncel değilse bir sonraki sohbet bağlamsız başlar.**
