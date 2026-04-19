# Sonraki Oturum İçin Gündem

**Hazırlanma tarihi:** 19 Nisan 2026 (4. oturum sonu)
**Son durum:** Enum anti-pattern tamamen temizlendi — DB migration bitti, ARES_NORM canonical liste kilitli (4+4+diger), devreler.html+kesim.html refactor bitti, dil dosyaları 1338 anahtar.

---

## Başlarken — Yeni Sohbete Yükle

Yeni sohbet açınca şu 4 dosyayı yükle:
1. `CLAUDE.md` — ana proje bağlamı (mimari kurallar, DB şema, oturum arşivi Bölüm 11'de)
2. `CLAUDE-MOBILE.md` — mobil React uygulamasının kuralları
3. `CLAUDE-SONRAKI-OTURUM.md` — bu dosya (öncelikli iş listesi)
4. `CLAUDE-SON-OTURUM.md` — en son oturumun deploy/test özeti (deploy bittiyse atlayabilir, ama referans için faydalı)

**Not:** Bu 4 dosya repo'da kök dizinde duruyor. Versiyon numarası yok — her oturumda üzerine yazılırlar. Uzun vadeli oturum tarihçesi `CLAUDE.md` Bölüm 11/11A/11B/11C'de birikir.

---

## Öncelik 1 — Malzeme-Yüzey Uyum Kontrolü (YENİ — kullanıcı talebi)

**Sorun:** Bazı malzeme-yüzey kombinasyonları anlamsız:
- Paslanmaz + galvaniz ❌ (paslanmaz galvanize edilmez)
- Paslanmaz + boya ❌ (paslanmaz boyanmaz, zaten yüzeyi parlak)
- Diğer kombinasyonlar için kullanıcı netleştirecek (bakır alaşımı / alüminyum için hangi yüzeyler uygun?)

**Kural Matrisi (kullanıcı ile doldurulacak):**

| Malzeme | Galvaniz | Asit | Siyah | Boya |
|---|:-:|:-:|:-:|:-:|
| Karbon Çelik | ✅ | ? | ✅ | ✅ |
| Paslanmaz | ❌ | ✅ | ? | ❌ |
| Bakır Alaşım | ? | ? | ? | ? |
| Alüminyum | ? | ? | ? | ? |
| Diğer | ✅ | ✅ | ✅ | ✅ (serbest) |

**Yapılacak:**
1. Kural matrisini kullanıcıyla birlikte tam doldur (4 malzeme × 4 yüzey = 16 hücre)
2. `devre_yeni.html` — malzeme radio `change` event'inde uygun olmayan yüzey radio'ları disable et (gri göster), tooltip: "Paslanmaz malzemeye galvaniz uygulanmaz"
3. `devre_duzenle.html` — aynı kural (spool düzenleme)
4. DB CHECK constraint:
   ```sql
   ALTER TABLE spooller ADD CONSTRAINT malzeme_yuzey_uyumu
   CHECK (
     malzeme IS NULL OR yuzey IS NULL OR
     NOT (malzeme = 'paslanmaz' AND yuzey IN ('galvaniz','boyali'))
   );
   ```
5. Mevcut veri kontrolü (constraint'ten önce):
   ```sql
   SELECT COUNT(*) FROM spooller 
   WHERE malzeme='paslanmaz' AND yuzey IN ('galvaniz','boyali');
   ```

**Süre tahmini:** 1 oturum (mockup-first kuralı R-10 uygulanacak)

---

## Öncelik 2 — Şema Kolon Adları Düzeltmesi (EN KRITIK — 3. oturumdan aktarılan)

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

**Neden:** 2. oturumdaki "sessizce anahtar silme" hatasını bir daha yaşamamak için.

**Yapılacak:**
- `scripts/i18n-check.js` — Node script
- Tüm pattern'leri tarar: `tv('x')`, `data-i18n`, `i18n:`, dinamik prefix'ler
- Kullanılmayan anahtar var mı, kullanılıp tanımsız var mı uyarır
- GitHub Actions workflow'a ekle — her PR'da çalışsın
- `npm run i18n-check` komutu

**Süre tahmini:** 1 oturum

---

## Öncelik 6 — Diğer Sayfaların Enum Refactor'ü (YENİ)

**Sorun:** 3. ve 4. oturumlarda `spool_detay`, `devre_yeni`, `devre_duzenle`, `kesim`, `markalama`, `is_baslat`, `devreler` sayfaları ARES_NORM'a entegre edildi. Ama sistemin başka sayfaları da var ve taranmadı:

**Taranacak sayfalar:**
- `bukum.html` — malzeme/yüzey badge var mı?
- `sevkiyat.html` — listeleme/filtreleme yapıyor mu?
- `kalite_kontrol.html` — enum display var mı?
- `raporlar.html` — agregasyon yapıyorsa çok önemli
- `proje_detay.html`, `devre_detay.html` — Supabase entegrasyonu henüz yok ama geldiğinde ARES_NORM kullanılsın

**Yapılacak:**
1. Her sayfada `grep -E "malzeme|yuzey|_normalize"` ile tara
2. Enum display yerleri ARES_NORM'a bağla
3. Hard-coded Türkçe etiket var mı kontrol et

**Süre tahmini:** 1-2 oturum (sayfa sayısına ve karmaşıklığa göre)

---

## Öncelik 7 — Ortak Modüller Çıkarma

**Sorun:** spool_detay.html 132 fonksiyon, çoğu diğer sayfalarla kopya

**Yapılacak:**
- `ares-spool.js` — spool ile ilgili ortak fonksiyonlar (kesim, büküm, kaynak iş yönetimi)
- `ares-devre.js` — devre hesaplama, filtre, sıralama
- `ares-ui.js` — ortak UI helper'ları (badge render, alert, modal)
- `ares-normalize.js` ✅ bitti (3. + 4. oturum)

**Süre tahmini:** 2-3 oturum

---

## Öncelik 8 — Excel Export i18n + islem_log i18n

**Sorun:** kesim.html'de Excel export hâlâ hardcode Türkçe:
- Başlıklar: 'KULLANILACAK MALZEME', 'STOK (mm)', 'KESIM (mm)' vb.
- Satır 1302: `malzAdi = 'O ' + cap + ' x ' + kalinlik + ' - ' + malzeme + ' ' + kalite` *(4. oturumda malzeme lokalize edildi, başlıklar hâlâ hardcode)*

**Yapılacak (opsiyonel):**
- Excel başlıklarını `tv()` ile sar
- Diğer islem_log noktalarını da tara (4. oturumda sadece kesim.html düzeltildi)

**Not:** Excel export muhtemelen Türkçe kalacak — sorun değil. Ama i18n hedefi varsa düzeltilmeli.

**Süre tahmini:** 1 oturum

---

## Öncelik 9 — Form Davranışı Araştırması (YENİ)

**Sorun:** 4. oturumda `spool_malzemeleri.kalite='diger'` olan 2 orphaned kayıt bulundu (silindi). Ama bu kayıtların nasıl oluştuğu tam anlaşılmadı:
- Operatör malzeme olarak "Diğer" seçmiş
- Kalite alanına "diger" yazmış (serbest metin)
- İki aynı kayıt oluşmuş (mükerrer submit?)

**Yapılacak:**
1. devre_yeni.html form submit mantığını incele
2. Kalite alanı serbest metin yerine önerilen seçenekler (304, 316, S235, A106 Gr.B, vb.) veya dropdown olmalı mı?
3. Mükerrer submit engellemesi var mı?
4. "Diğer" malzeme seçildiğinde ek açıklama alanı gerekli mi?

**Süre tahmini:** 1 oturum (araştırma + UX iyileştirme)

---

## Öncelik 10 — devre_yeni.html Yüzey "Diğer" Eklenmesi (YENİ — küçük iş)

**Sorun:** Yüzey radio'larında 4 seçenek var (asit/galvaniz/siyah/boyali), "Diğer" yok. Nadir yüzey işlemleri için gerekiyor.

**Yapılacak:**
- `devre_yeni.html` yüzey radio group'una "Diğer" seçeneği ekle (value=`diger`)
- `devre_duzenle.html` aynı şekilde
- Belki "Diğer" seçilince ek açıklama input'u göster

**Süre tahmini:** 1 saat (Öncelik 1 ile birlikte yapılabilir)

---

## Kesinlikle BU OTURUMDA YAPILMAYACAKLAR

- [ ] `_status.json` i18n yönetimi — Freeze & Translate stratejisi benimsendi
- [ ] spool_detay.html yeniden yazma — büyük iş, revizyon geldiğinde yapılacak
- [ ] devre_detay.html yeniden yazma — aynı şekilde
- [ ] Admin paneli enum yönetim ekranı — gereksiz (4. oturumda karar verildi)

---

## Kural Hatırlatmaları (Bir Sonraki Oturum için Claude'a)

- **Toplu silme/değişiklik yapmadan önce dry-run + kullanıcı onayı** (2. oturumda 2 kere yandık, 3-4. oturumlarda hassaslık korundu)
- **Tarama kapsamı:** HTML + JS + JSX hepsi birlikte. Pattern'ler: `tv()`, `data-i18n`, `i18n:`, dinamik `prefix_`
- **Mockup-first (R-10):** Yeni mobil ekran yazılmadan önce artifact mockup + onay
- **Tema için useTema (R-09):** Direct DOM manipulation yasak
- **Enum için ARES_NORM (E-01):** Malzeme/yüzey/durum değerleri her zaman ARES_NORM'dan geçer — hardcode Türkçe yazılmaz
- **Kolon adı uyumu:** Her Supabase query'sinden önce şema referansına bak
- **"Sadece X" istendiğinde sadece X verilir** — hepsini toplu verme

### 4. Oturum Dersi: "UX vs Schema ayrımı"
Kullanıcı "Paslanmaz her yerde aynı yazılsın" derken **UX**'ten bahsediyordu (ekrandaki tutarlılık). Claude ise başlangıçta bunu **DB schema**'sıyla karıştırdı ("DB'de nasıl saklayalım?"). Bu iki konu ayrı — DB'de kod, ekranda etiket, ikisi de ayrı değişken. Gelecekte benzer bir soru gelirse hemen ayrımı netleştir.

### 4. Oturum Dersi: "DB gerçeğini konuşmadan karar verme"
Başlangıçta "dropdown fix yeterli" zannedildi. DB'ye baktığımızda aslında **3 farklı kod sistemi** yan yana olduğu görüldü (`karbon` / `karbon_celik` / `Karbon Çelik`). Migration o oturumun asıl başarısı oldu, dropdown fix onun yan etkisi. **Ders:** Belge + kod okuması yeterli değil, DB'deki gerçek veri her zaman sürpriz içerebilir.

---

## Strateji Özeti (Üzerinde Anlaşıldı)

**3 Katmanlı Hibrit Yaklaşım:**
- **Katman 1:** Altyapı düzeltmeleri (script ile toplu) — dil sistemi ✅, kolon adları ⏳, tırnaklı tema ✅, enum normalize ✅ (Faz 2 bitti)
- **Katman 2:** Revizyon geldikçe sayfa yeniden yaz (yama değil) — strangler fig pattern
- **Katman 3:** Küçük çalışan sayfalar dokunulmaz (ayarlar, tezgahlar, log vb.)

**Dil Stratejisi: Freeze & Translate**
- Proje stabil olunca `tr.json` freeze
- Profesyonel translator / CAT tool / Claude + terminoloji sözlüğü
- Direkt kullan, admin panel yok

**Enum Stratejisi: Kod bazlı DB + tv() wrapper** ✅ TAMAMLANDI
- DB'de kod saklanır (karbon, paslanmaz, asit vb.) ✅ Faz 2 migration bitti
- ARES_NORM modülü ham ↔ kod ↔ etiket dönüşümlerini tek yerden yönetir ✅
- Kanonik liste: 4 malzeme + 4 yüzey + `diger` ✅ (4. oturumda kilitlendi)
- Yeni tür eklerken: (1) ARES_NORM regex'e sinonim (2) 3 dil dosyasına `cmn_*` anahtarı (3) Radio seçeneği
- Admin UI yapılmadı — gerekirse ~10 dk iş

---

## Son Söz

4. oturumda enum sistemi tam olarak kapandı. DB temiz, ARES_NORM canonical, dropdown'lar düzgün, badge'ler doğru renkte. Yeni kayıtlar doğru format yazıyor.

**Öncelikli iki hızlı iş (1 oturumda biter):**
1. **Malzeme-Yüzey uyum kontrolü** (kullanıcı talebi) — görsel + DB constraint
2. **devre_yeni.html yüzey "Diğer" seçeneği** — küçük ama eksik parça

Sonra Öncelik 2 (spool_detay kolon adları) — sessiz bug temizliği.

Sonra mobil MProfil ile nefes al.

İyi çalışmalar, iyi dinlenmeler. 🚀
