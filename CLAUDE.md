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

### 🔴 ACİL
- [ ] Admin panel yol haritası sekmesi
- [ ] `admin/panel.html` visibility sorunu — html visibility:hidden kalıyor (panel.html ares-layout.js yüklemiyor, kendi init'inde `document.documentElement.style.visibility=''` açılmalı)

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
- [ ] `ks_*` `bk_*` `mk_*` `kk_*` `ts_*` `log_*` → `en.json` + `ar.json`
- [ ] Sayfa içi metinlere `data-i18n` attribute ekle

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
