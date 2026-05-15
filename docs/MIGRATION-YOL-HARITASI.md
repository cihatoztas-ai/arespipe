# AresPipe — Migration Yol Haritası

> **Amaç:** DB migration'larının durumu, sıralı listesi, planlı işleri tek belgede topla.
>
> **Niye gerekli:**
> - Hangi migration **planlandı ama yazılmadı**, **dosyalanmadı**, **canlıda** belirsiz olmasın
> - Migration SQL'leri tek yerde (kopyala-yapıştır çalışabilir)
> - Bağımlılıklar belgelensin (065 önce, 066 sonra)
> - 91 dersi: arşive taşınan tabloların sessiz kırığı tekrar yaşanmasın
> - 91 dersi 2: **migration dosyası önce, çalıştırma sonra** disiplini
>
> **İlk yazım:** 91. oturum (15 Mayıs 2026)
> **Versiyon:** v2 (gün içinde düzeltildi — gerçek repo numaralarına uyumlu)

---

## 1. Migration Tablosu

Repo'daki `migrations/` klasörü ile **birebir hizalı** tablo. Son durum 15 Mayıs 2026.

| # | Dosya | Durum | Bağımlılık | Oturum |
|---:|---|---|---|---|
| 000 | `000_initial_schema.sql` | ✅ canlıda | — | 27 |
| 001-064 | (60+ dosya, repo'da) | ✅ canlıda | — | 27-90 |
| **065** | `065_olu_tablo_temizligi_ve_endustri_geri_tasima.sql` | ✅ canlıda | — | **91** |
| **066** | `066_fitting_malzeme_uyum_onarim.sql` | 📝 yazıldı | 065 | **91 yazıldı, 92'de çalışacak** |
| 067 | `067_boru_malzeme_uyum_ve_flansh_malzeme_uyum_create.sql` | 📋 planlı | 066 | 92'de yazılacak |
| 068 | GOST/JIS/GB/T iskelet seed (boru) | 📋 planlı | 067 | 93+ |
| 069 | DIN 86087/88/89 P0 doldurma (CuNi gemi) | 📋 planlı | 067 | 93+ |
| 070 | Fitting filtre modeli (KARAR-90.C) | 📋 planlı | 067 | 93+ |
| 071 | DSAF (Dublin flanş) JSONB şema uyarlaması | 📋 ihtiyaç olunca | 067 | İlk DSAF kaydı geldiğinde |

### Durum Açıklamaları

- ✅ **canlıda** — Migration çalıştı, DB'de uygulandı, dosyası repo'da
- 📝 **yazıldı** — Dosya hazır, repo'da var, henüz canlıda çalıştırılmadı
- 📋 **planlı** — İş tanımı net, dosya yazılmadı (bekleyen iş)
- 🚫 **iptal** — Karar değişti, gerek kalmadı

---

## 2. 91'de Yapılan Migration İşleri

### 065 — Ölü tablo temizliği + endustri_* geri taşıma

**Dosya:** `migrations/065_olu_tablo_temizligi_ve_endustri_geri_tasima.sql`

**Niye:**
1. **`malzeme_standart_ipucu` DROP** — 18 satır pattern data, AI parser için 36. oturumda planlanmış. `grep -rn` ile kod araması 0 referans — hiçbir yerden çağrılmıyordu. Sistemde fazlalık.
2. **`endustri_malzemeler` + `endustri_form_astm` `arsiv` → `public` geri taşıma** — Bilinmeyen bir zamanda arşivlenmişlerdi. `api/izometri-oku.js` → `malzemeTaninir()` `public.endustri_*`'ya sorgu atıyor. 35 izometri batch boyunca sessizce "malzeme bilinmeyen" işaretledi. 91'de fark edildi, onarıldı.

**Önemli not:** Bu migration **RETROAKTİF** yazıldı. Değişiklikler 91'de Supabase SQL Editor'da uygulandı (migration disiplini ihlal edildi — README'nin koyduğu kural önce dosya, sonra çalıştırma). Dosya, repo ile DB durumunu senkronlamak için sonradan eklendi. Idempotent yazıldı, yeniden çalıştırılırsa hata vermez.

---

### 066 — fitting_malzeme_uyum tam onarım

**Dosya:** `migrations/066_fitting_malzeme_uyum_onarim.sql`

**Durum:** 📝 yazıldı, 92'de canlıda çalıştırılacak.

**Niye:** 3 sorun var:
1. **Test satırı:** 1 satır var, içeriği iki yanlış UUID (`fitting_id` aslında `flansh_olculer`'de, `malzeme_id` aslında `malzeme_tanimlari`'nda). Mantıksız, test verisi.
2. **`fitting_id` FK yanlış:** `flansh_olculer`'a bağlı. Doğrusu `fitting_olculer`. Constraint adı bile yanıltıcı: `fitting_malzeme_uyum_flansh_id_fkey`. Tablo tarihinden gelen artık.
3. **`malzeme_id` FK yanlış:** `malzeme_tanimlari`'na (runtime tablo) bağlı. Doğrusu `malzeme_kataloglari` (kütüphane master).
4. **PRIMARY KEY eksik:** `(fitting_id, malzeme_id)` çifti unique olmalı.

**Tablo durumu:** 1 test satırı, gerçek veri yok. Veri kaybı riski sıfır.

**SQL'in tamamı için:** `migrations/066_fitting_malzeme_uyum_onarim.sql` dosyasına bak.

---

## 3. Sıradaki Planlı İşler (092+)

### 067 — boru_malzeme_uyum + flansh_malzeme_uyum CREATE

**Önkoşul:** Migration 066 canlıda olmalı.

**Niye:** Çapraz uyum tabloları **3 olmalı** (boru × malzeme, fitting × malzeme, flansh × malzeme). Şu an sadece `fitting_malzeme_uyum` var.

**Dosya:** 92'de yazılacak (`migrations/067_boru_malzeme_uyum_ve_flansh_malzeme_uyum_create.sql`).

**İçerik özeti:**
```sql
CREATE TABLE boru_malzeme_uyum (
  boru_id        uuid → boru_olculer
  malzeme_id     uuid → malzeme_kataloglari
  uretim_yontemi text
  yaygin_mi      boolean
  notlar         text
  PRIMARY KEY (boru_id, malzeme_id)
);

CREATE TABLE flansh_malzeme_uyum (
  flansh_id      uuid → flansh_olculer
  malzeme_id     uuid → malzeme_kataloglari
  uretim_yontemi text
  yaygin_mi      boolean
  notlar         text
  PRIMARY KEY (flansh_id, malzeme_id)
);
```

**RLS politikaları:** mevcut `fitting_malzeme_uyum`'un policy'lerini örnek al. Cihat ile doğrulanmalı.

---

### 068 — GOST/JIS/GB/T iskelet seed (boru)

**Önkoşul:** Migration 067.

**Niye:** KUTUPHANE-KAPSAM.md v3'te 6 standart aile var ama 3'ünün (GOST/JIS/GB/T) `boru_olculer`'da hiç satırı yok. P0 boyutlar için iskelet seed:
- GOST 8732 (Rus sıcak haddelenmiş): DN50-200 × Sch 40/STD
- JIS G3454 (Japon basınç): DN50-200 × STPG370
- GB/T 8163 (Çin basınç): DN50-200 × Sch 40

Tahminen ~30-50 satır. AI parser bu standart adlarını tanıyabilsin diye.

---

### 069 — DIN 86087/88/89 P0 doldurma (CuNi gemi)

**Önkoşul:** Migration 067.

**Niye:** KUTUPHANE-YUKLEME-TAKIP.md'de "DIN 86087/88 (Gemi CuNi flanş)" ve "DIN 86089 (Gemi CuNi fitting)" P0 öncelikli, ama içerik yok. Gemi sektörü için kritik (deniz suyu sistemi).

---

### 070 — Fitting filtre modeli (KARAR-90.C)

**Önkoşul:** Migration 067.

**Niye:** 90'da Cihat'ın kararı: fitting/flansh için `malzeme_grubu` üst kategori değil, filtre olmalı. UI tarafında 3 sayfa (kütüphane-malzemeler, kütüphane-detay, kütüphane-standartlar) buna göre güncellenmeli.

Bu **DB değil UI işi**, ama yol haritasında saklanır.

---

### 071 — DSAF (Dublin flanş) JSONB şema uyarlaması

**Önkoşul:** İlk DSAF kaydı geldiğinde.

**Niye:** Double Studded Adapter Flange (sahada "Dublin") iki farklı bolt pattern içerir (taraf A + taraf B). Mevcut `flansh_olculer` şeması tek bolt pattern destekliyor.

```sql
ALTER TABLE flansh_olculer ADD COLUMN taraflar_jsonb JSONB;
```

İlk DSAF kaydı eklenmesi gerektiğinde aktive olur.

---

## 4. Migration Disiplin Kuralları (91 — Cihat onayıyla)

Bu kurallar `migrations/README.md`'de zaten yazılı, burada özetlenir. Çakışma olursa **README.md doğrudur**.

### A. Önce Dosya, Sonra Çalıştırma (91 dersi)

Repo'daki README.md açıkça söylüyor:

> ⚠️ **Supabase dashboard'ta SQL editor'de yazıp run** artık tek başına yeterli değil. Her değişiklik bu klasöre yazılır.
>
> ⚠️ **Kritik:** Canlıda çalıştırmadan commit yapma. Dosya = yapılmış değişikliğin kaydı, plan değil.

**91'in en büyük hatası:** 065 migration'ı SQL Editor'da çalıştırıldı, dosyası sonradan retroaktif yazıldı. Bu kural ihlali. **Bir daha tekrarlanmayacak.**

**Doğru akış:**
1. Sıradaki numarayı bul (`ls migrations/` → son numara + 1)
2. Şablondan kopyala (`docs/templates/yeni-migration-sablonu.sql`)
3. SQL'i yaz, header'ı doldur (tarih, oturum, niye, geri alma)
4. **Önce repo'ya commit et**
5. Sonra Supabase SQL editor'da çalıştır
6. Doğrulama sorgusunu çalıştır

### B. Idempotent Yaz

Her migration **birden fazla çalıştırılabilir** olmalı:
- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `DROP TABLE IF EXISTS`
- Constraint için `DO $$ ... $$` ile varlık kontrolü

### C. BEGIN / COMMIT Kullan

Her migration `BEGIN; ... COMMIT;` içinde olmalı. Adımlar arasında hata olursa atomik rollback.

### D. Doğrulama Sorgusu Hazırla

Her migration'ın **doğrulama sorgusu** SQL dosyasının altında (yorum olarak) olmalı.

### E. Rollback Planı Yaz

Migration dosyasının header yorumunda "Geri alma" bölümü olmalı.

### F. "Önce Kullanım Haritası, Sonra Silme" (91 dersi)

Tablo silmek veya arşivlemek için:

1. `grep -rn "tablo_adi" --include="*.js" --include="*.html" .` ile tüm kod tabanında ara
2. Vercel function logs / `ai_api_log` kayıtlarında izi kontrol et
3. **Aktif kullanım olmadığı kanıtlanmadan dokunma**

Bu kural 91'de `endustri_*` tablolarının sessizce arşivlenmesinden çıkarıldı.

### G. RLS Pattern Tutarlılığı

Yeni tabloya RLS eklerken **benzer tablonun** policy'lerini örnek al. Kendin uydurma.

---

## 5. Açık Sorular (92 Başında Cevaplanmalı)

**Soru 1:** Migration 067'deki RLS policy'leri için mevcut sistemde hangi pattern kullanılıyor? `fitting_malzeme_uyum`'un mevcut policy'lerine bakılmalı, taklit edilmeli.

**Soru 2:** Migration 066'yı çalıştırmadan önce `migrations/` klasöründeki güncel duruma bak — 91 kapanışından sonra hâlâ uyumlu mu?

---

## 6. Geçmiş Migration Arşivi

`migrations/` klasöründe `000_initial_schema.sql` → `064_v_tanimsiz_havuz.sql` arası **60+ migration** var. Detayları her dosyanın header yorumunda. Bazı önemli noktalar:

| # | Tarih | Ne Yapar |
|---:|---|---|
| 000 | 24 Nis 2026 (27. oturum) | İlk schema dump, sıfır noktası |
| 022 | 30 Nis 2026 | RLS eksik tablolara politikalar |
| 062 | 13 May 2026 (87) | Eksik kütüphane tabloları |
| 063 | 14 May 2026 (87) | Bekleyen öneriler RPC fonksiyonları |
| 064 | 14 May 2026 (88) | `v_tanimsiz_havuz` view + öneri listesi sayfası |

**NOT:** Migration tarihçesi `migrations/_arsiv/` klasöründe daha eski referans dosyaları da var. `migrations/README.md` detay verir.

---

## 7. Sonraki Adımlar Özet

### 91 Kapanışı
- Migration 065 dosyası repo'ya commit (bu oturumda)
- Migration 066 dosyası repo'ya commit (canlıda çalıştırılmadan, 92'ye bırakıldı)
- Belge güncellemeleri commit (KAPSAM v3 + YUKLEME-TAKIP v3 + MIGRATION-YOL-HARITASI v2)

### 92'de Yapılacak
- Migration 066'yı Supabase SQL editor'da çalıştır
- Doğrulama sorgusu
- Migration 067'yi yaz + çalıştır

### 93+
- Migration 068, 069, 070 sırayla
- Generic UI altyapısı (`kutuphane-tablo.html`)

---

> Bu belge canlı tutulur. Yeni migration eklendiğinde Bölüm 1'e satır eklenir, içeriği uygun bölüme yazılır. Migration çalıştırıldığında durum 📝 → ✅'e geçer.
>
> v2 — 91. oturum — 15 Mayıs 2026
