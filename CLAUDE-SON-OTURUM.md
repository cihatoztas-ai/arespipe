# 91. Oturum Detay Özeti — 15 Mayıs 2026

> **Plan A** (UI temizliği) ile başladı, **kapsam revizyonu + DB mimari teşhis** ile sonlandı. Beklenmedik yönde gitti ama değerli bir oturum oldu.

---

## Oturum Akışı (Zaman Sırasıyla)

### Faz 1 — Plan A başlangıcı

- Git durumu temiz, `.bak90*` 6 yedek dosya silindi (90'dan kalan)
- 90'ın açık borçları gözden geçirildi (6 borç)
- Plan A onaylandı: 3 saatte fitting/flansh filtre modeli + küçük borçlar

### Faz 2 — UI mimarisi kararı

- `kutuphane.html` Katman 1 + `kutuphane-malzemeler.html` Katman 2 incelendi
- 3 tablonun (malzeme_kataloglari, fitting_malzeme_uyum, ozel_parcalar) Katman 2'de "Geçersiz tablo" hatası verdiği fark edildi
- Tablo başına özel UI yazma (α) vs Generic kayıt tarayıcısı (β) karşılaştırıldı
- **Cihat seçimi:** Generic altyapı kuralım (β) — sürdürülebilir
- 4 mimari karar onaylandı: A (tek sayfa) + C (DB+UI metadata) + C (otomatik+manuel) + B (generic + zenginleştirme)

### Faz 3 — DB şemaları incelendi

- 4 tablonun information_schema sorgusu yapıldı (boru, fitting, flansh, malzeme_kataloglari)
- 3 mimari bulgu keşfedildi:
  - **Bulgu 1:** flansh_olculer'da Migration 065 (90'ın işi) yarım kalmış sanıldı — sonra düzgün çalıştığı doğrulandı
  - **Bulgu 2:** fitting_malzeme_uyum'da `flansh_id` kolon adı varsayıldı — sonra çıktının kesilme hatası anlaşıldı, gerçek kolon `fitting_id`
  - **Bulgu 3:** `malzeme_id` üç tabloda 1:1 FK var ama KUTUPHANE-KAPSAM.md M:N diyor — çelişki

### Faz 4 — 4 malzeme tablosu sorunu

- Cihat sordu: "bu listeyi tam olarak birkaç oturum öncesine kadar ben de göremiyordum"
- 4 tablo keşfedildi:
  - `malzeme_kataloglari` (20) — kütüphane master ✓
  - `malzeme_tanimlari` (13) — runtime spool/pipeline FK ✓
  - `endustri_malzemeler` (36) — ??? kütüphane dışı?
  - `endustri_form_astm` (78) — ??? kütüphane dışı?
  - `malzeme_standart_ipucu` (18) — ??? hiç FK yok
- FK haritası çıkarıldı, bağımlılıklar tespit edildi

### Faz 5 — Sessiz kırık keşfi (KRİTİK)

- `grep -rn "malzeme_standart_ipucu"` boş → ölü tablo
- `grep -rn "endustri_malzemeler"` → `api/izometri-oku.js:1325` çağırıyor
- `grep -rn "endustri_form_astm"` → `api/izometri-oku.js:1280, 1329` çağırıyor
- **Şok:** İlk count sorgusu `endustri_malzemeler` 36 satır demişti, ama `SELECT *` çalışmadı
- Tablolar `arsiv` schema'sında bulundu
- **İzometri parse akışı 35 batch boyunca sessizce kırık çalışmış**
- Çözüm: `ALTER TABLE arsiv.endustri_* SET SCHEMA public;` (Migration 065 — retroaktif)

### Faz 6 — Kütüphane vizyonu sorgulandı

- Cihat: "bu kütüphane işini baştan bir gözden geçirmemiz gerek sanki"
- Yeni gereksinimler:
  - GOST/JIS/GB/T standart aileleri (Rus/Japon/Çin gemi)
  - Fitting malzeme çeşitliliği genişletilmeli
  - Özel üretim ölçüler (4.5mm ara kalınlık gibi) sahaya özel olarak desteklenmeli
- Plan A → Kapsam Revizyonu olarak yeniden konumlandı

### Faz 7 — KUTUPHANE-KAPSAM.md v3 yazımı

- 5 onay alındı (6 standart aile / 23 fitting / 10 flanş / non-preset bayrak / 3 katman)
- v3 yazıldı, ~600 satır
- "Atlas okyanusu felsefesi" başlığı sonradan iptal edildi (Cihat: "ben onu laf olsun diye söyledim")
- Düzeltme yapıldı: "Tasarım Yaklaşımı: İskelet + Organik İçerik"

### Faz 8 — Dublin flanş sorusu

- Cihat: "Dublin flanş diye bir şey var, listemizde var mı?"
- Web araması: standart sektörel terim değil
- Cihat ortaya çıkardı: Double Stud Adapter Flange (DSAF) — sahada "Dublin"
- 11. flanş tipi olarak eklendi (kütüphane standart adı, saha jargonu parser sözlüğüne)

### Faz 9 — KUTUPHANE-YUKLEME-TAKIP.md v3 yazımı

- Mevcut sayılarla güncellendi
- 11 flanş tipi tablosu (DSAF dahil)
- ozel_parcalar modülü silindi

### Faz 10 — Migration 068 denemesi → KRİTİK HATA

- "B yolu — Migration 066 (sonradan adı 068 olacaktı) bu oturumda çalıştır" onaylandı
- SQL Editor'da çalıştırıldı
- **FK violation hatası:** fitting_id UUID'si flansh_olculer'de bulundu
- BEGIN/COMMIT içinde rollback edildi
- Sample veri detaylı incelendi:
  - 1 test satırı var (count sorgu sıfır demişti — sonradan ortaya çıktı)
  - fitting_id → flansh_olculer (yanlış FK)
  - malzeme_id → malzeme_tanimlari (yanlış FK)
- Cihat söyledi: "bizim migration klasörümüz var"
- `migrations/README.md` okundu: **"önce dosya, sonra çalıştırma" kuralı**
- 91'de bu kural ihlal edilmiş: 065 SQL Editor'da çalıştırıldı, dosyalanmadı

### Faz 11 — Toparlama

- Repo gerçeği görüldü: `migrations/` 064'e kadar dosyalı
- Migration 065 retroaktif dosyası yazıldı (91'in 2 SQL değişikliğinin kaydı)
- Migration 066 yazıldı (fitting_malzeme_uyum onarım — 92'de çalışacak)
- MIGRATION-YOL-HARITASI v2'ye düzeltildi (gerçek numaralar)
- Plan A revize: ne bu oturumda çalıştır ne 92'ye taşı (Cihat: A onayı)

---

## 91'in Anatomisi — Plan Değişiklikleri

```
Başlangıç: Plan A (UI temizliği, fitting filtre, küçük borçlar) — 6-9 saat
   ↓
Faz 2: Generic UI altyapısı (mimari) — 11-12 saat
   ↓
Faz 6: Kapsam revizyonu (sadece belge işi) — 4-5 saat
   ↓
Faz 10: Migration disiplin ihlali → toparlama gerekti
   ↓
Sonuç: Belge revizyonu + Migration 065/066 dosyalama + Kapanış — ~8 saat
```

**Yön değişimi 3 kez:**
- Plan A → Generic altyapı (Cihat: "sıkıştırmaktan vazgeçiyorum")
- Generic → Kapsam revizyonu (Cihat: "kütüphane işini baştan gözden geçirmemiz gerek sanki")
- Kapsam → Toparlama (FK violation + migration disiplin ihlali keşfi)

Her seferinde **Cihat geri çekilme kararını verdi**, ben uydum. Bu kararlar sağlıklıydı, çünkü yanlış yola devam etmek daha pahalıya mâl olurdu.

---

## Üretilen Dosyalar

1. **`migrations/065_olu_tablo_temizligi_ve_endustri_geri_tasima.sql`** (yeni — retroaktif)
2. **`migrations/066_fitting_malzeme_uyum_onarim.sql`** (yeni — 92'de çalışacak)
3. **`docs/KUTUPHANE-KAPSAM.md`** (v2 → v3)
4. **`docs/KUTUPHANE-YUKLEME-TAKIP.md`** (v2 → v3)
5. **`docs/MIGRATION-YOL-HARITASI.md`** (yeni belge — v2)
6. **`.github/son-durum.md`** (91 sonu güncelleme)
7. **`CLAUDE-SON-OTURUM.md`** (bu dosya)
8. **`CLAUDE-SONRAKI-OTURUM.md`** (92 gündemi)

---

## Önemli Değişikenler

### DB

- 1 tablo silindi: `malzeme_standart_ipucu` (18 satır, ölü)
- 2 tablo schema değişti: `endustri_malzemeler`, `endustri_form_astm` (arsiv → public)
- 1 migration yazıldı, 92'de çalışacak: 066 (fitting_malzeme_uyum onarım)
- 1 üretim bug onarıldı: izometri parse akışı 35 batch'lik kırılma temizlendi

### Belgeler

- KUTUPHANE-KAPSAM.md v2 → v3:
  - 3 standart aile → 6 (GOST/JIS/GB/T eklendi)
  - 11 fitting tipi → 23
  - 6 flanş tipi → 11 (DSAF dahil)
  - ozel_parcalar modülü kaldırıldı, non-preset bayrak yaklaşımı
  - 3 katman mimarisi netleşti
  - 12.000 satır hedef kaldırıldı (organik büyüme yaklaşımı)
- KUTUPHANE-YUKLEME-TAKIP.md v2 → v3 (canlı durum)
- MIGRATION-YOL-HARITASI.md v2 (yeni)

### Mimari Kararlar

- KARAR-91.A → KARAR-91.H (8 karar)
- Generic UI altyapısı için 4 alt-karar (A-C-C-B)

---

## 91'in Dersleri (Detay)

### 1. Süper Admin'de görünmüyor diye tablo silmek tehlikeli

**Veri:**
- `endustri_*` tabloları `arsiv` schema'sında bulundu
- Önceki bir oturumda biri bilinçli arşivlemiş (Süper Admin'de görünmüyordu)
- `api/izometri-oku.js` çağırıyordu (`grep -rn` ile kanıtlandı)
- 35 batch boyunca sessiz kırık

**Ders:** Tablo silmek/arşivlemek için 3 zorunlu kontrol:
1. `grep -rn` ile kod tabanında ara
2. Vercel function logs / `ai_api_log` kontrolü
3. Aktif kullanım kanıtlanmadan dokunma

### 2. Migration dosyası önce, çalıştırma sonra

**Veri:**
- `migrations/README.md` açıkça yazıyordu: "önce dosya, sonra çalıştırma"
- 91'de bu kural ihlal edildi: `malzeme_standart_ipucu` DROP + `endustri_*` taşıma SQL Editor'da yapıldı, dosyalanmadı
- Geriye dönük 065 dosyası yazıldı (retroaktif kayıt)
- Bir daha olmayacak

**Ders:** Yeni DB değişikliği akışı:
1. Migration numarasını bul (`ls migrations/`)
2. Şablondan kopyala (`docs/templates/yeni-migration-sablonu.sql`)
3. SQL yaz, header doldur, **önce repo'ya commit et**
4. Sonra Supabase'de çalıştır
5. Doğrulama

### 3. "Felsefe" abartı

**Veri:**
- Cihat "atlas okyanusu" benzetmesi yaptı
- Ben "Atlas Okyanusu Felsefesi" diye doctrine adı verdim
- Cihat: "ben onu laf olsun diye söyledim"
- 5 yerde "atlas/okyanus/felsefe" referansı temizlendi

**Ders:** Cihat'ın günlük dilini doctrine'leştirme. Kararları "tasarım yaklaşımı" diye yaz, "felsefe" diye değil.

### 4. Aynı oturuma çok iş sığdırma vs. doğru yol

**Veri:**
- 4 kez "B yapalım, kapsamı genişletmeyelim" vs "doğru olanı yapalım" gerilimi
- Cihat 3 kez sıkıştırmaktan vazgeçti
- Her seferinde kazanım: daha sağlam altyapı kararı

**Ders:** "Oturum içine sığdırmak" pratik bir hedef değil. "Doğru olanı yapmak" hedef. Sığmazsa kapanış doğru karar.

### 5. Veri-tabanlı karar > sezgi

**Veri:**
- Sezgi: "fazla tablo var, silelim"
- Veri: 4 tablodan 3'ü canlı kullanılıyordu
- Sezgi: "fitting_malzeme_uyum 0 satır"
- Veri: 1 test satırı vardı (count yanlış sayılmıştı)

**Ders:** Her tabloya, her FK'ya, her tahmine veri ile doğrula. Sample query ucuz, hata pahalı.

---

## 92'ye Geçiş

### 92 açılış ritüeli (CLAUDE.md)

```
1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
2. Bugün ne yapmak istiyorsun?
```

Cevap muhtemelen: "91'in açık borçları" → migration 066 çalıştır + 067 yaz

### 92'nin öncelikli işi

**Migration 066'yı canlıda çalıştırmak.**

- Önce git pull (yeni 065 + 066 dosyalarını al)
- Supabase SQL editor'da `migrations/066_*.sql` çalıştır
- Doğrulama sorgusu
- Başarılıysa MIGRATION-YOL-HARITASI'da 📝 → ✅

Sonra Migration 067 yazılır (boru_malzeme_uyum + flansh_malzeme_uyum CREATE). RLS pattern doğrulanmalı.

### 92'nin tahmini süresi

- Migration 066 çalıştırma + doğrulama: ~15 dk
- Migration 067 yazma + çalıştırma + doğrulama: ~45 dk
- Plan A'dan kalan küçük borçlar: ~45 dk
- Toplam: ~2 saat (kısa, rahat oturum)

Sonra 93+'da Generic UI altyapısı, GOST/JIS/GB/T seed, DIN 86087/88/89 P0 doldurma, vb.

---

## Son Söz

91 mimari oturum olarak başladı, üretim onarımı + kapsam revizyonu + disiplin dersi olarak bitti. Plan değişiklikleri yorgun gibi görünse de, **doğru karar her seferinde alındı**. Sıkıştırmaya çalışmasak daha iyi olurdu, ama yön değişimleri zaten sağlam değişimlerdi.

**92'ye temiz girdik:**
- Repo + DB senkronize (065 retroaktif dosya ile)
- 066 hazır bekliyor (önce dosya, sonra çalıştır)
- 3 kütüphane belgesi güncel
- Migration disiplini netleşti
- Kapsam yeniden tasarlandı

İyi geceler Cihat, dinlen.

— Claude, 91. oturum kapanışı
