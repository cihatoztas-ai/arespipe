# Sonraki Oturum İçin Gündem

**Hazırlanma tarihi:** 17 Nisan 2026 (3. oturum sonu)
**Son durum:** Enum anti-pattern temizlendi — ares-normalize.js canlıda, 6 HTML patch'li, 3 dil dosyası 1340 anahtar, markalama bug fix yapıldı

---

## Başlarken — Yeni Sohbete Yükle

Yeni sohbet açınca şu dosyaları yükle:
1. `CLAUDE.md` — ana proje bağlamı
2. `CLAUDE-MOBILE.md` — mobil kuralları
3. `CLAUDE-DURUM-RAPORU.md` — proje sağlık raporu
4. `CLAUDE-SONRAKI-OTURUM.md` — bu dosya (yol haritası)
5. `CLAUDE-DEGISIKLIK-LISTESI-v5.md` — en son oturumun özeti (opsiyonel)

---

## Öncelik 1 — Dropdown Filter Etiket Gösterimi (kısa iş)

**Sorun:** devreler.html, kesim.html, markalama.html sayfalarındaki malzeme/yüzey filter dropdown'larında option metni KOD olarak görünüyor ("karbon_celik") — ekrandaki tablo ise "Karbon Çelik" gösteriyor. Tutarsız ve çirkin.

**Yapılacak:**
- Her sayfada filter dropdown oluşturma fonksiyonunu bul (örn. `populateFilters`)
- `[...new Set(data.map(d => d.malzeme))]` ile kod'ları topla ama option text'ine `ARES_NORM.malzemeEtiket(kod)` koy
- Option value'da kod kalsın (filter mantığı kod ile karşılaştırır)
- devreler.html'in dil dosyasındaki `karbon_celik` gibi kendi kod'u var mı kontrol et — ARES_NORM'un `karbon` kod'una map edilmeli

**Süre tahmini:** 1 oturum — 3 sayfada benzer mantık

---

## Öncelik 2 — Şema Kolon Adları Düzeltmesi (EN KRITIK)

**Sorun:** CLAUDE.md "kritik kolon adları" bölümü var ama kodda hâlâ eski isimler → sessiz bug'lar.

### 2a) spool_detay.html (EN KRITIK — 78 yanlış referans!)
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
- Benzer düzeltmeler

**Süre tahmini:** 1-2 oturum (her sayfa kullanıcı tarafından test edilmeli)

---

## Öncelik 3 — Faz 2: SQL Migration (opsiyonel, kısa)

**Durum:** Enum anti-pattern temizliği yapıldı, **Faz 1 canlıda**. Yeni kayıtlar KOD yazılıyor ama eski satırlar hâlâ Türkçe etiketler içeriyor. Okuma tarafı her ikisini de tolere ediyor.

**Faz 2'yi yapmak istersen:**

```sql
-- ÖNCE SPOOLLER TABLOSU YEDEKLENMELİ
BEGIN;

-- Malzeme migration
UPDATE spooller SET malzeme = 'karbon'    WHERE malzeme ~* '(karbon|çelik|st37|carbon)' AND malzeme NOT IN ('karbon','paslanmaz','bakir','alum','plastik','diger');
UPDATE spooller SET malzeme = 'paslanmaz' WHERE malzeme ~* '(paslanmaz|stainless|inox|316|304|321|347)';
UPDATE spooller SET malzeme = 'bakir'     WHERE malzeme ~* '(bakır|cuni|copper|bronze|pirinç)';
UPDATE spooller SET malzeme = 'alum'      WHERE malzeme ~* '(alüm|alum|aluminum)';
UPDATE spooller SET malzeme = 'plastik'   WHERE malzeme ~* '(plastik|plastic|\bpe\b|pvc|ppr)';

-- Yüzey migration
UPDATE spooller SET yuzey = 'asit'     WHERE yuzey ~* 'asit';
UPDATE spooller SET yuzey = 'galvaniz' WHERE yuzey ~* 'galvan';
UPDATE spooller SET yuzey = 'siyah'    WHERE yuzey ~* 'siyah';
UPDATE spooller SET yuzey = 'boyali'   WHERE yuzey ~* 'boyal';
UPDATE spooller SET yuzey = 'epoksi'   WHERE yuzey ~* 'epoksi';

-- Kontrol: Hâlâ kod dışı değerler var mı?
SELECT DISTINCT malzeme FROM spooller WHERE malzeme NOT IN ('karbon','paslanmaz','bakir','alum','plastik','diger') AND malzeme IS NOT NULL;
SELECT DISTINCT yuzey FROM spooller WHERE yuzey NOT IN ('asit','galvaniz','siyah','boyali','epoksi','diger') AND yuzey IS NOT NULL;

-- Sorun yoksa COMMIT, varsa ROLLBACK
COMMIT; -- veya ROLLBACK
```

**Süre tahmini:** 20 dakika (yedek + SQL + test)

---

## Öncelik 4 — Mobil: MProfil.jsx

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

## Öncelik 5 — Mobil: MIsBaslat + Zaman Takibi

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

## Öncelik 6 — i18n Linter Script

**Neden:** 2. oturumdaki "sessizce anahtar silme" hatasını bir daha yaşamamak için.

**Yapılacak:**
- `scripts/i18n-check.js` — Node script
- Tüm pattern'leri tarar: `tv('x')`, `data-i18n`, `i18n:`, dinamik prefix'ler
- Kullanılmayan anahtar var mı, kullanılıp tanımsız var mı uyarır
- GitHub Actions workflow'a ekle — her PR'da çalışsın
- `npm run i18n-check` komutu

**Süre tahmini:** 1 oturum

---

## Öncelik 7 — Ortak Modüller Çıkarma

**Sorun:** spool_detay.html 132 fonksiyon, çoğu diğer sayfalarla kopya

**Yapılacak:**
- `ares-spool.js` — spool ile ilgili ortak fonksiyonlar (kesim, büküm, kaynak iş yönetimi)
- `ares-devre.js` — devre hesaplama, filtre, sıralama
- `ares-ui.js` — ortak UI helper'ları (badge render, alert, modal)
- `ares-normalize.js` ✅ bitti (3. oturumda)

**Süre tahmini:** 2-3 oturum

---

## Öncelik 8 — Excel Export i18n + islem_log i18n

**Sorun:** kesim.html'de Excel export hâlâ hardcode Türkçe:
- Başlıklar: 'KULLANILACAK MALZEME', 'STOK (mm)', 'KESIM (mm)' vb.
- Satır 1302: `malzAdi = 'O ' + cap + ' x ' + kalinlik + ' - ' + malzeme + ' ' + kalite`

**Yapılacak (opsiyonel):**
- Excel başlıklarını `tv()` ile sar
- malzAdi'da ARES_NORM.malzemeEtiket ile çeviri

**Not:** Excel export muhtemelen Türkçe kalacak — sorun değil. Ama islem_log aciklamaları da benzer şekilde kod görüyor (`karbon 48.3 2000mm`) — log format'ı insan okunabilir kalmalıysa bu da refactor edilmeli.

**Süre tahmini:** 1 oturum

---

## Kesinlikle BU OTURUMDA YAPILMAYACAKLAR

- [ ] `_status.json` i18n yönetimi — Freeze & Translate stratejisi benimsendi
- [ ] spool_detay.html yeniden yazma — büyük iş, revizyon geldiğinde yapılacak
- [ ] devre_detay.html yeniden yazma — aynı şekilde
- [ ] Admin paneli dil yönetim ekranı — gereksiz

---

## Kural Hatırlatmaları (Bir Sonraki Oturum için Claude'a)

- **Toplu silme yapmadan önce dry-run + kullanıcı onayı** (2. oturumda 2 kere yandık, 3. oturumda hassaslık korundu)
- **Tarama kapsamı:** HTML + JS + JSX hepsi birlikte. Pattern'ler: `tv()`, `data-i18n`, `i18n:`, dinamik `prefix_`
- **Mockup-first (R-10):** Yeni mobil ekran yazılmadan önce artifact mockup + onay
- **Tema için useTema (R-09):** Direct DOM manipulation yasak
- **Enum için ARES_NORM (E-01):** Malzeme/yüzey/durum değerleri her zaman ARES_NORM'dan geçer — hardcode Türkçe yazılmaz
- **Kolon adı uyumu:** Her Supabase query'sinden önce şema referansına bak
- **"Sadece X" istendiğinde sadece X verilir** — hepsini toplu verme (3. oturumda yanlış anlaşılma oldu)

---

## Strateji Özeti (Üzerinde Anlaşıldı)

**3 Katmanlı Hibrit Yaklaşım:**
- **Katman 1:** Altyapı düzeltmeleri (script ile toplu) — dil sistemi ✅, kolon adları ⏳, tırnaklı tema ✅, enum normalize ✅
- **Katman 2:** Revizyon geldikçe sayfa yeniden yaz (yama değil) — strangler fig pattern
- **Katman 3:** Küçük çalışan sayfalar dokunulmaz (ayarlar, tezgahlar, log vb.)

**Dil Stratejisi: Freeze & Translate**
- Proje stabil olunca `tr.json` freeze
- Profesyonel translator / CAT tool / Claude + terminoloji sözlüğü
- Direkt kullan, admin panel yok

**Enum Stratejisi: Kod bazlı DB + tv() wrapper**
- DB'de kod saklanır (karbon, paslanmaz, asit vb.)
- ARES_NORM modülü ham ↔ kod ↔ etiket dönüşümlerini tek yerden yönetir
- Her yeni malzeme/yüzey/durum türü eklenirken: (1) ARES_NORM'a pattern ekle (2) 3 dil dosyasına `cmn_*` anahtarı ekle

---

## Son Söz

3. oturumda en kritik arka plan borçlarından biri kapatıldı: enum anti-pattern artık tarihte. Her yeni özellik artık doğru fundament üzerine kurulabilir.

**Öncelikli iki hızlı iş:**
1. Dropdown filter fix (görsel tutarsızlığı gideriyor)
2. spool_detay kolon adları (sessiz bug'ları gideriyor)

Bu ikisi bir oturumda olabilir. Sonra mobil MProfil ile nefes al.

İyi çalışmalar, iyi dinlenmeler. 🚀
