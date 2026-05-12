# Sonraki Oturum İçin Gündem

**Hazırlanma tarihi:** 17 Nisan 2026 (2. oturum sonu)
**Son durum:** MDrawer canlıda, dil sistemi senkronize (1335 anahtar), sidebar + devreler düzeltildi

---

## Başlarken — Yeni Sohbete Yükle

Yeni sohbet açınca şu dosyaları yükle:
1. `CLAUDE.md` — ana proje bağlamı
2. `CLAUDE-MOBILE.md` — mobil kuralları
3. `CLAUDE-DURUM-RAPORU.md` — proje sağlık raporu
4. `CLAUDE-SONRAKI-OTURUM.md` — bu dosya (yol haritası)

Claude ilk baştan hızlı başlar.

---

## Öncelik 1 — Enum Anti-Pattern Taraması ve Temizliği

**Sorun:** Her sayfa kendi `_normalizeMalzeme` / `_normalizeYuzey` fonksiyonunu yazmış, hardcode Türkçe döndürüyor. devreler.html'de çözüldü ama başka sayfalarda da aynı durum olabilir.

**Yapılacak:**
- `kesim.html`, `markalama.html`, `proje_detay.html`, `devre_yeni.html`, `devre_duzenle.html`, `is_baslat.html`, `spool_detay.html` sayfalarını tara
- Her sayfada malzeme/yüzey/durum DB'den gelip ekrana yazılan yerleri bul
- `_normalizeX` varsa çıktısını koda çevir, ekrana yazarken `tvMalzeme/tvYuzey/tvDurum` ile sar
- Ortak `ares-normalize.js` modülü düşün — her sayfa aynı fonksiyonu kopyalamasın

**Süre tahmini:** 1 oturum (tek büyük tarama script + toplu patch)

---

## Öncelik 2 — Şema Kolon Adları Düzeltmesi

**Sorun:** CLAUDE.md "kritik kolon adları" bölümü var ama kodda hâlâ eski isimler.

**Yapılacak (sayfa bazında, sırasıyla):**

### 2a) spool_detay.html (EN KRITIK — sessiz bug'lar burada)
- `cap_mm` → `dis_cap_mm` (18 kez)
- `et_mm` → `et_kalinligi_mm` (25 kez)
- `agirlik_kg` → `agirlik` (8 kez)
- `yapan_id` → `ekleyen_id` (6 kez — notlar tablosu için)
- `url` → `dosya_url` (21 kez — fotograflar için, dikkatli replace!)

### 2b) devre_detay.html
- `et_mm` → `et_kalinligi_mm` (10 kez)
- `agirlik_kg` → `agirlik` (5 kez)
- `revizyon` → `rev` (3 kez)

### 2c) devre_yeni.html, is_baslat.html, kullanici_detay.html
- Benzer düzeltmeler, rapor detayında

**Süre tahmini:** 1-2 oturum (her sayfa kullanıcı tarafından test edilmeli)

---

## Öncelik 3 — Mobil: MProfil.jsx

**Neden önce MProfil:**
- MDrawer'daki "Profili Düzenle" döngüsü tamamlanmamış (`/profil` route var, sayfa yok)
- Avatar upload feature `kullanicilar.foto_url` kolonu hazır bekliyor
- Küçük, odaklanmış iş (mockup-first kuralıyla)

**Yapılacak:**
- MProfil.jsx ekranı mockup-first
- Avatar upload (Supabase Storage `arespipe-dosyalar` bucket'ı)
- ad_soyad, tel, brans, firma editing
- ui_tercihleri JSONB alanı kullanımı (gelecekte kullanıcı ayarları için)

**Süre tahmini:** 1 oturum

---

## Öncelik 4 — Mobil: MIsBaslat + Zaman Takibi

**Araştırma gereken:** Bilgisayardan Supabase SQL Editor'de bu sorguları çalıştır ve çıktıları paylaş:

```sql
-- 1. is_kayitlari kolonları
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'is_kayitlari'
ORDER BY ordinal_position;

-- 2. Kesim/büküm/markalama kalemlerinde zaman alanları var mı?
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('kesim_kalemleri','bukum_kalemleri','markalama_kalemleri')
  AND (column_name LIKE '%zaman%' 
       OR column_name LIKE '%baslangic%' 
       OR column_name LIKE '%bitis%'
       OR column_name LIKE '%sure%'
       OR column_name LIKE '%tarih%')
ORDER BY table_name;

-- 3. islem_log kullanımı — zaman tutuluyor mu?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'islem_log'
ORDER BY ordinal_position;
```

**Yapılacak (araştırma sonrası):**
- Web'deki zaman takibi yapısı anlaşılsın
- Düzensizlik varsa web tarafında düzeltilsin
- Mobilin bu yapıya nasıl bağlanacağı mockup-first planlansın
- MIsBaslat.jsx (QR'lı akış: imalat/kaynak/ön kontrol)
- MIsListesi.jsx (Liste akışı: kesim/büküm/markalama, `?islem=kesim` param ile)

**Süre tahmini:** 2-3 oturum

---

## Öncelik 5 — i18n Linter Script

**Neden:** Bu oturumda yaşadığımız "sessizce anahtar silme" hatasını bir daha yaşamamak için.

**Yapılacak:**
- `scripts/i18n-check.js` — Node script
- Tüm pattern'leri tarar: `tv('x')`, `data-i18n`, `i18n:`, dinamik prefix'ler
- Kullanılmayan anahtar var mı, kullanılıp tanımsız var mı uyarır
- GitHub Actions workflow'a ekle — her PR'da çalışsın
- `npm run i18n-check` komutu

**Süre tahmini:** 1 oturum

---

## Öncelik 6 — Ortak Modüller Çıkarma

**Sorun:** spool_detay.html 132 fonksiyon, çoğu diğer sayfalarla kopya

**Yapılacak:**
- `ares-spool.js` — spool ile ilgili ortak fonksiyonlar (kesim, büküm, kaynak iş yönetimi)
- `ares-devre.js` — devre hesaplama, filtre, sıralama
- `ares-ui.js` — ortak UI helper'ları (badge render, alert, modal)
- `ares-normalize.js` — _normalizeMalzeme/_normalizeYuzey ortak merkez

**Süre tahmini:** 2-3 oturum

---

## Kesinlikle BU ORTURUMDA YAPILMAYACAKLAR

- [ ] `_status.json` i18n yönetimi — Freeze & Translate stratejisi benimsendi
- [ ] spool_detay.html yeniden yazma — büyük iş, revizyon geldiğinde yapılacak
- [ ] devre_detay.html yeniden yazma — aynı şekilde
- [ ] Admin paneli dil yönetim ekranı — gereksiz

---

## Kural Hatırlatmaları (Bir Sonraki Oturum için Claude'a)

- **Toplu silme yapmadan önce dry-run + kullanıcı onayı** (bu oturumda 2 kere yandık)
- **Tarama kapsamı:** HTML + JS + JSX hepsi birlikte. Pattern'ler: `tv()`, `data-i18n`, `i18n:`, dinamik `prefix_`
- **Mockup-first (R-10):** Yeni mobil ekran yazılmadan önce artifact mockup + onay
- **Tema için useTema (R-09):** Direct DOM manipulation yasak
- **Kolon adı uyumu:** Her Supabase query'sinden önce şema referansına bak

---

## Strateji Özeti (Üzerinde Anlaşıldı)

**3 Katmanlı Hibrit Yaklaşım:**
- **Katman 1:** Altyapı düzeltmeleri (script ile toplu) — dil sistemi ✅, kolon adları, tırnaklı tema ✅
- **Katman 2:** Revizyon geldikçe sayfa yeniden yaz (yama değil) — strangler fig pattern
- **Katman 3:** Küçük çalışan sayfalar dokunulmaz (ayarlar, tezgahlar, log vb.)

**Dil Stratejisi: Freeze & Translate**
- Proje stabil olunca `tr.json` freeze
- Profesyonel translator / CAT tool / Claude + terminoloji sözlüğü
- Direkt kullan, admin panel yok

---

## Son Söz

Bu oturumda çok şey yaptık ve çok şey öğrendik:
- MDrawer canlıda ✅
- Dil sistemi 1335 anahtar, 3 dilde senkron ✅
- Mimari anti-pattern tespit edildi ve devreler.html'de çözüldü ✅
- Proje sağlık raporu çıkarıldı ✅
- Kapsamlı strateji kararları alındı ✅

Ama en önemlisi: **Proje düzeliyor.** Yeniden yazmaya gerek yok. Adım adım, doğru sıra ile, hedefli düzeltmelerle. Motivasyonun yerinde kalsın.

İyi deploy'lar, iyi dinlenmeler. 🚀
