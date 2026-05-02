# AresPipe Proje Haritası

> **Bu dosya canlı tutulur.** Her oturumda en az 1 madde güncellenir veya
> en az 1 maddenin doğruluğu kontrol edilir.
>
> **Oluşturma:** 52. oturum (2 May 2026) — Cihat'ın "genel duruma hakim ol"
> talebi üzerine.
>
> **Amaç:** Sonraki Claude versiyonu bu dosyayı 5 dakikada okuyup projeye
> hakim olabilsin. CLAUDE.md kuralları, bu dosya **gerçek durumu** tutar.

---

## 30 saniyede AresPipe

Gemi tersanesi spool üretim takip sistemi. **Tek geliştirici (Cihat) + AI**.
52 oturumdur geliştiriliyor, pilot kullanıcı henüz yok. Production'da
(`arespipe.vercel.app`) ama gerçek kullanıcı ile test edilmedi.

**Stack:** Vanilla HTML/CSS/JS frontend (build step yok), Vercel serverless API,
Supabase (Postgres + Auth + Storage). Mobil: 13 satır iskelet (yok denecek).

**Multi-tenant:** Birden fazla tersane bağlanabilir (`tenant_id` her tabloda).

---

## Sayfa-Modül Haritası

### Çekirdek (sağlam, pilot-yeterli)

| Sayfa | Satır | Boyut | Modül | Durum |
|---|---:|---:|---|---|
| `giris.html` | 372 | 147KB | Auth (giriş) | ✅ Sağlam |
| `index.html` | 527 | 46KB | Ana sayfa | ✅ Sağlam |
| `devreler.html` | 2600 | 145KB | Devre listesi | ⚠️ Çok büyük, performans riski |
| `devre_yeni.html` | 2330 | 119KB | Yeni devre | ⚠️ Çok büyük |
| `devre_detay.html` | 2437 | **159KB** | Devre detay | 🔴 **En ağır sayfa, satır başına en yüklü** |
| `spool_detay.html` | 3750 | 218KB | Spool detay | 🔴 **En büyük sayfa, performans sorunu olası** |
| `kesim.html` | 3678 | 220KB | Kesim listesi | 🔴 **Boyutta ikinci ağır** |

### Üretim akışı (web masa-üstü)

| Sayfa | Satır | Modül | Durum |
|---|---:|---|---|
| `bukum.html` | 1013 | Büküm akışı | ⚠️ Aktif gelişme (28 Nis) |
| `markalama.html` | 1569 | Markalama | ⚠️ Aktif gelişme (28 Nis) |
| `kalite_kontrol.html` | 822 | KK | ⚠️ Tamamlanmamış |
| `sevkiyatlar.html` | 1225 | Sevkiyat | ⚠️ Tamamlanmamış |
| `testler.html` | 1014 | Test/RT/PT/UT | ⚠️ Tamamlanmamış |
| `tezgahlar.html` | 538 | Tezgah envanteri | ⚠️ Tamamlanmamış |
| `etiketleme.html` | 570 | Etiket basımı | ⚠️ Tamamlanmamış |

### İzometri batch (52'de yoğun gelişme)

| Sayfa | Satır | Modül | Durum |
|---|---:|---|---|
| `izometri-batch.html` | 1015 | Yeni batch yükleme | ⚠️ **Duplicate bug var (52'de keşfedildi)** |
| `izometri-batch-incele.html` | 925 | Batch detay/onay | ⚠️ "Önceki batch devam ediyor" UI bug'ı |

### Yönetim

| Sayfa | Satır | Modül | Durum |
|---|---:|---|---|
| `admin/panel.html` | 2363 | Süper admin pano | ✅ Geri bildirim sistemi var |
| `admin/firma.html` | 451 | Firma listesi | ✅ |
| `admin/yeni-firma.html` | 677 | Yeni firma | ✅ |
| `admin/firma-detay.html` | 1045 | Firma detay | ✅ |
| `kullanicilar.html` | 513 | Kullanıcı listesi | ✅ |
| `kullanici_detay.html` | 792 | Kullanıcı detay | ✅ |
| `kurallar.html` | 1938 | Kural editörü | ✅ Faz B kurucu |
| `tersaneler.html` | 773 | Tersane listesi | ⚠️ |
| `proje_liste.html` | 1838 | Proje listesi | ⚠️ Çok büyük |
| `proje_detay.html` | 854 | Proje detay | ✅ |
| `tanimlar.html` | 1144 | Malzeme havuzu | ⚠️ Faz A2 yarım kaldı (22. oturumda) |

### Yardımcı / Boş

| Sayfa | Satır | Durum |
|---|---:|---|
| `mobile/index.html` | **13** | 🔴 **Boş, mobil yok denecek** |
| `qr_tara.html` | 336 | ⚠️ Temel, geliştirilmeli |
| `is_baslat.html` | 1772 | ⚠️ Çok büyük |
| `sorgula.html` | 451 | ✅ |
| `uyarilar.html` | 503 | ✅ |
| `log.html` | 701 | ✅ İşlem log görüntüleme |
| `raporlar.html` | 582 | ⚠️ |
| `ayarlar.html` | 640 | ✅ |

---

## API Endpoints (`api/`)

| Dosya | Boyut | İşlev |
|---|---:|---|
| `izometri-oku.js` | 56KB | **Ana izometri parser** — L1 cache + L2 deterministic + L3 vision AI + halusinasyon filtresi (52'de yoğun gelişme) |
| `kuyruk-isle.js` | 13KB | Batch kuyruk işleme |
| `batch-spoollari.js` | 10KB | Batch sonuçlarından spool çıkarma |
| `sorgula.js` | 12KB | Genel sorgu endpoint |
| `kuyruk-durum.js` | 7KB | Kuyruk durum sorgu |
| `batch-kuyruga-al.js` | 7KB | Yeni dosyaları kuyruğa alma |
| `batch-baslat.js` | 4KB | Batch başlatma |
| `dosya-url-al.js` | 4KB | Storage signed URL |

---

## Lib / Helper Dosyaları

**`lib/` klasörü:**
- `l2-parser.js` (8KB) — Format-spesifik regex parser (51'de eklendi)

**Root'ta dağılmış helper'lar (modülerlik sorunu):**

| Dosya | Boyut | İçerik |
|---|---:|---|
| `ares-layout.js` | **58KB** | Sol menü, tema, dil değişimi (her sayfa import eder) |
| `ares-store.js` | 37KB | Supabase istemci, state yönetimi |
| `ares-asme.js` | **48KB** | ASME/EEMUA boru helper (35. oturumdan, sadece ASME — 52'de keşfedildi) |
| `ares-normalize.js` | 11KB | Veri normalize (kalite kodları vb.) |
| `ares-lang.js` | 7KB | Dil sözlüğü |
| `ares-kalite-normalize.js` | 4KB | Kalite kodu normalize |

**Sorun:** `lib/` klasörü neredeyse boş, gerçek helper'lar root'ta. Bu **modülerlik
borcu**, sonraki Claude bu konuda Cihat'ı uyarmalı.

---

## Veritabanı

**70+ tablo var, ama gerçekte aktif kullanılan az.**

### Aktif kullanılanlar (1 May 2026 itibarıyla)

| Tablo | Satır | Notu |
|---|---:|---|
| `audit_log` | 16,867 | 🔴 **Çok büyük, partitioning gerek bir gün** |
| `spooller` | 567 | Ana spool tablosu (NOT: `batch_id` yok, `devre_id` var) |
| `boru_olculer` | 440 | Kütüphane %17 dolu (52'de tenant_id eklendi) |
| `fitting_olculer` | 391 | Kütüphane |
| `flansh_olculer` | 216 | Kütüphane |
| `asme_borular` | 334 | Eski tablo (ares-asme.js besliyor) |
| `boru_dn_isim_eslesme` | 180 | DN ↔ NPS dönüşüm |
| `spool_malzemeleri` | 160 | Spool malzeme listesi |
| `devreler` | 85 | Aktif devreler |
| `endustri_form_astm` | 78 | ⚠️ **Niye var, kim kullanıyor belirsiz** |
| `feature_flags` | 66 | Feature flag sistemi |
| `rol_sablonlari` | 69 | Yetki şablonları |
| `kullanici_bloklar` | 41 | Yetki blokları |
| `is_kuyrugu` | 35 | Batch kuyruğu |
| `izometri_batch_kayitlari` | 32 | Batch kayıtları |
| `feedback_kayitlari` | 26 | Geri bildirim |
| `kesim_listeleri` | 25 | Kesim listeleri |
| `ai_api_log` | 15 | **52'de görünürlük kazandı (L2/L3 ayrımı)** |

### Boş ama altyapı var (kullanım bekliyor)

| Tablo | İşlev | Durum |
|---|---|---|
| `fotograflar` | Fotoğraf altyapısı | 🟢 **Vizyon için hazır, AI eğitim verisi başlangıcı** |
| `egitim_verisi` | AI eğitim verisi | 🟢 **Hazır, kullanılmıyor** |
| `ai_analizler` | AI sonuçları | 🟢 Hazır |
| `tarama_sonuclari` | QR tarama | 🟢 Hazır |
| `kesim_kalemleri`, `bukum_kalemleri`, `markalama_kalemleri` | Üretim akışı | ⚠️ Boş, yarım |
| `belgeler`, `notlar` | Doküman ekleri | 🟢 Hazır |

### Anlamı belirsiz / unutulmuş tablolar

- `endustri_form_astm` (78 satır) — kim kullanıyor?
- `endustri_malzemeler`, `endustri_urun_formlari` — boş, niye var?
- `ifs_material_alias` — IFS sistem entegrasyonu için mi?
- `cuni_borular` (ASME helper'a benzer ama ayrı tablo)

**Not:** Sonraki oturumlarda Cihat'a sorulmalı: "Bu tablolar hâlâ gerekli mi
yoksa silelim mi?" Geri kalanlardan ayrılması temizlik açısından iyi.

---

## Sayfalar Arası Koordinasyon

### Bağlı modüller (bir sayfada değişiklik diğerini etkiler)

- **Devre → Spool**: `devre_detay.html` spool listesi gösterir, `spool_detay.html`
  oradan açılır. Şema değişikliği iki sayfayı da etkiler.
- **İzometri Batch → Spool**: Batch sonuçları `manuel_onay_bekliyor` durumundan
  spooller tablosuna geçer. Akış: `izometri-batch.html` → `izometri-batch-incele.html`
  → onay → `spooller`.
- **Spool → Kesim/Büküm/Markalama**: Üretim akışı sayfaları spool detayından
  data çeker.
- **ares-layout.js (58KB)**: HER sayfada import edilir. Burada bir bug
  bütün sistemi etkiler.

### Bağımsız ama ortak veri kullanan

- **Kütüphane sayfaları** (yok henüz, ama `boru_olculer` her yerde sorgu
  yapılıyor)
- **Feature flags**: `kurallar.html` editlerse, tüm sayfalar etkilenir.

---

## Performans Notları (gözlem + tahmin)

### Bilinen yavaşlıklar

| Sayfa | Sebep (tahmini) | Çözüm önerisi |
|---|---|---|
| `spool_detay.html` (218KB) | Çok büyük dosya, hep beraber yükleniyor | Lazy load — sekmeleri ayrı dosyaya böl |
| `devre_detay.html` (159KB) | Aynı durum | Lazy load |
| `kesim.html` (220KB) | Aynı durum | Lazy load veya modül ayrımı |

**Cihat birden fazla kez sordu**: "Bu sayfa neden yavaş açılıyor?" Cevap:
**dosyalar çok büyük, JS hepsi parse ediliyor**. 52'de de tartışıldı, çözüm
sonraki oturumlara bırakıldı.

### Olası gelecek sorunları

- `audit_log` 16K satır, ileride 1M olunca yavaşlar. Index var mı kontrol edilmeli.
- `ai_api_log` cevap_full JSONB kolonu büyüyor. Eski kayıtlar arşivlenmeli (~6 ay).

---

## Teknik Borç Listesi (52'de açılan)

Önceliği yüksekten düşüğe:

### 🔴 Kritik (pilot başlamadan önce çözülmeli)

1. **Mobil yok** — `mobile/index.html` 13 satır. Vizyona göre mobil zorunlu.
   53+ oturumda iskelet açılmalı.
2. **`spool_detay.html` ve `devre_detay.html` performans** — yüklenme yavaş,
   kullanıcı şikayeti olabilir.
3. **İzometri batch duplicate bug** — bir batch'te dosyalar 2 kez kuyruğa
   atılabiliyor (52'de keşfedildi, root cause belirsiz).
4. **"Önceki batch devam ediyor" UI bug** — frontend localStorage'da takılı
   state kalıyor, kullanıcı manuel temizliyor.

### 🟠 Önemli (pilot kullanıcı geri bildirim verirse anlaşılır)

5. **Modülerlik zayıf** — `lib/` boş, helper'lar root'ta. Yeni özellik eklerken
   tekrarlanan kodu temizle.
6. **Halusinasyon filtresi Madde 3 (et tolerans)** — Madde 2 patch'inin aynı
   mantığı uygulanmalı (paralel kütüphane oturumu tenant özel ölçü ekleyince
   gerek olur).
7. **Eski yanlış uyarı kayıtlarının temizliği** — bugüne kadar `cap_dn_tutarsiz`
   ve `et_tolerans_disi` yanlış pozitifleri spool'lara yazılmış.
8. **Kütüphane %17 dolu** — kalan %83 sahadan gelen veriyle paralel doldurulacak
   (52'de Cihat kararı: tenant özel kayıt sistemi).

### 🟡 İleride (zorlamadığında)

9. **Tablo isimleri Türkçe** — uluslararası ürün için zorlaştırır. Pilot tek
   tersane Türkçeyse şimdilik sorun değil.
10. **`audit_log` partitioning** — büyüklük artınca.
11. **Belirsiz tabloların temizliği** — `endustri_form_astm` vb. kim kullanıyor?
12. **Migration dev test prosedürü** — şu an Supabase'de direkt çalıştırılıyor,
    rollback yok.
13. **Test yazımı** — kritik akışlar için (1-2 test) yazılmalı.
14. **Format envanter UI'ye `parser_seviye` filtresi** — L2 başarı oranı
    görünürlüğü için.

---

## Bugünkü (52) Oturum Kazanımları

- **L2 deterministic parser canlıda log yazıyor** (`ai_api_log` görünürlük)
- **Pipeline_no regex genişletildi** (G200-303S, G300-350-FR yakalanıyor)
- **`L2_deterministic` cagri_tipi DB'de kabul ediliyor**
- **Halusinasyon Madde 2 (cap_dn_tutarsiz) standart-agnostik**
- **Tenant özel boru ölçüleri halusinasyon adaylarına dahil**
- **MK-52.1**: `arespipe_kopyala` (MD5 doğrulamalı kopyala)
- **MK-52.2**: `gp` (otomatik rebase + push)
- **CLAUDE-CALISMA-MODU.md**: Sonraki Claude için talimat dosyası
- **PROJE-HARITASI.md**: Bu dosya

---

## Bu Dosyanın Bakımı

**Her oturum sonu** sorulması gereken sorular:

1. Bu oturumda yeni teknik borç açıldı mı? → Liste'ye ekle
2. Bu oturumda çözülen teknik borç var mı? → Liste'den çıkar
3. Yeni sayfa veya modül eklendi mi? → Tabloya ekle
4. Boş tablolardan biri kullanılmaya başlandı mı? → "Aktif"e taşı
5. Performans gözlemi var mı? → Ekle

**Her ay** geri çekilip okuma:

- 30 saniye özeti hâlâ doğru mu?
- Teknik borç listesi anlamlı sırada mı?
- Belirsiz tablolar hâlâ belirsiz mi, sorulmalı mı?
