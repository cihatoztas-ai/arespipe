# Veritabanı

> AresPipe PostgreSQL üzerinde çalışıyor (Supabase host). Bu belge veritabanı mimarisinin **niye böyle** olduğunu ve yeni bir yazılımcının **neye dikkat etmesi** gerektiğini anlatır.

---

## 1. Platform ve Temel Kararlar

**Supabase** seçildi çünkü üç ihtiyacı tek platformda topluyordu:

- **PostgreSQL** — ciddi DB, ilişkisel, RLS (Row Level Security) native
- **Auth** — kullanıcı yönetimi hazır, JWT token'lar otomatik
- **Storage** — dosya yüklemeleri (izometri PDF'leri, spool foto'ları)

Alternatifler (Firebase, raw PostgreSQL + Auth0, AWS Aurora + Cognito) elendi: kurulum karmaşası, maliyet, veya tablo-seviyesi güvenlik eksikliği.

**Şu anki plan:** Free tier (Nano instance, `t4g.nano`). Müşteri sayısı arttığında Pro tier'a geçilecek — scale yolu açık.

**Region:** West Europe (London). AresPipe kullanıcıları Türkiye merkezli, London bölgesi latency olarak en yakın Supabase bölgesi.

### Kritik İşletim Notları

- **Connection string** Vercel env variable'ında `SUPABASE_SERVICE_KEY` (🔒 Sensitive) ve `SUPABASE_URL` olarak saklanır.
- **Frontend** sadece `anon key` ile bağlanır, `service_key` tarayıcıya asla gitmez.
- **Service key** yalnızca serverless function'larda (`api/*.js`) kullanılır — RLS'yi bypass edebilir, dikkatli.

---

## 2. Multi-Tenant Mimarisi

AresPipe **multi-tenant**: aynı veritabanında birden fazla firma (tersane) eşzamanlı çalışır, verileri birbirlerinden **RLS ile izole** edilir.

### Temel Kural

**Her iş tablosunda `tenant_id UUID` kolonu vardır.** İstisnasız. Bu kolon hangi firmanın verisi olduğunu söyler, ve her RLS policy bunu kontrol eder.

### Yeni Tablo Eklerken Zorunlu 3 İş

1. **`tenant_id UUID NOT NULL`** kolonu — firma bağlantısı
2. **4 RLS policy'si** — SELECT/INSERT/UPDATE/DELETE ayrı ayrı (Bölüm 3)
3. **`tenant_id` üzerinde index** — sorgu performansı

Unutulursa: (1) veri sızıntısı — B firması A firmasının verisini görür, (2) insert reddedilir veya herkese açık insert yapılır, (3) büyük tablolarda `WHERE tenant_id = ?` sorgusu full scan'e düşer.

### Tenant Atama

Kullanıcı login olduğunda JWT token içine `tenant_id` claim'i yerleştirilir (`kullanicilar.tenant_id`'dan okunur). Sonraki her sorgu Supabase client tarafından bu token'la yapılır, RLS policy `auth.jwt() ->> 'tenant_id'` ile karşılaştırır.

### İstisna Tablolar (Global)

Bazı tablolar tüm tenant'lar arasında paylaşılır — **bunlarda `tenant_id` yoktur:**

- `tenantlar` — firma tanımları (meta)
- `kullanicilar` — `tenant_id`'si var ama global bir `super_admin` rolü bu kolonu NULL yapabilir
- `kurallar_preset`, `kalite_preset` gibi sistem sabitleri (varsa)

Bu tablolar için ayrı RLS (genelde "kimse INSERT edemez, super_admin hariç") uygulanır.

---

## 3. RLS Politikaları

Her tabloda **4 ayrı policy** yazılır — SELECT, INSERT, UPDATE, DELETE. Tek bir "ALL" policy yazmak basit görünür ama debugging ve auditing zorlaşır, ayrı tutmak disiplini ağır basar.

### Şablon (Standart Tenant Tablosu)

```sql
-- tablo_adi üzerinde RLS aç
ALTER TABLE public.tablo_adi ENABLE ROW LEVEL SECURITY;

-- SELECT: Kendi tenant'ının verilerini görebilir
CREATE POLICY tablo_adi_select ON public.tablo_adi
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- INSERT: Sadece kendi tenant'ına kayıt ekleyebilir
CREATE POLICY tablo_adi_insert ON public.tablo_adi
  FOR INSERT WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- UPDATE: Kendi tenant'ının kayıtlarını güncelleyebilir
CREATE POLICY tablo_adi_update ON public.tablo_adi
  FOR UPDATE USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  ) WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- DELETE: Kendi tenant'ının kayıtlarını silebilir
CREATE POLICY tablo_adi_delete ON public.tablo_adi
  FOR DELETE USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );
```

### Rol-Bazlı Kısıtlama Örneği

Bir tabloya sadece `yonetici` veya `super_admin` role'ü yazabilsin istiyorsan INSERT/UPDATE/DELETE policy'lerine `auth.jwt() ->> 'rol'` kontrolü ekle:

```sql
CREATE POLICY tablo_adi_insert ON public.tablo_adi
  FOR INSERT WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'rol') IN ('yonetici', 'super_admin')
  );
```

### CHECK Değişimi Disiplini

Var olan bir policy'nin CHECK ifadesini değiştirmek **tek komutla yapılmaz.** Sıra:

1. **DROP** — eski policy silinir (`DROP POLICY ... ON ...`)
2. **UPDATE** (veri varsa) — gerekiyorsa kayıt verisi temizlenir
3. **ADD** — yeni policy `CREATE POLICY` ile eklenir

Bu sıra bozulursa "var olan kayıt yeni CHECK'e uymuyor" hatası alınır veya eski policy aktifken yeni veri yanlış izinle girer.

### FK Ekleme Disiplini

Bir tabloya yeni foreign key eklediğinde, o tabloya `supabase.js` üzerinden embed sorgu atanıyorsa (`select('*, iliskili_tablo(*)')`) sorguyu **disambiguate** etmek gerekir:

```js
// FK eklendikten sonra Supabase hangi FK'yi kullanacağını bilemez, belirtmelisin:
.select('*, iliskili_tablo!fk_kolonu(*)')
```

Bunu atlarsan mevcut sorgular "Could not embed because more than one relationship was found" hatası verir.

---

## 4. Migration Sistemi

### Klasör ve Kural

Tüm DB şema değişiklikleri `migrations/` klasörü altında SQL dosyaları olarak saklanır. Dosya adlandırma:

```
NNN_aciklama.sql
```

- **NNN** — 3 haneli numara, duplicate yasak (`001`, `002`, ..., `042`)
- **aciklama** — snake_case, açıklayıcı (`audit_log_ekle`, `devreler_status_kolonu`)
- Regex: `^[0-9]{3}_[a-z0-9_]+\.sql$`

### Dosya İçeriği Şablonu

```sql
-- 042_ornek_degisiklik.sql
-- 24 Nisan 2026 — Açıklama (niye yapıldı, hangi oturum)

BEGIN;

-- DDL komutları burada
CREATE TABLE ...
ALTER TABLE ...

COMMIT;
```

- **İlk 10 satırda `--` yorumu zorunlu** (CI kontrolü: `MIG_HEADER_EKSIK`)
- **BEGIN/COMMIT sarması önerilir** — kısmen başarılı migration'ı önler

### CI Kuralları

Migration dosyaları CI'da kontrol edilir — `.github/kontrol.js` içinde `migrationsKontrol()` fonksiyonu:

| Kural Kodu | Seviye | Ne Yakalar |
|---|---|---|
| `MIG_ISIM_BOZUK` | hata | Dosya adı regex'e uymuyor |
| `MIG_NUMARA_TEKRAR` | hata | Aynı 3 haneli numara iki dosyada |
| `MIG_HEADER_EKSIK` | uyari | İlk 10 satırda yorum yok |

### Migration Nasıl Eklenir

1. **Supabase SQL Editor'de çalıştır** — önce test et (BEGIN/ROLLBACK ile deneme, sonra BEGIN/COMMIT ile gerçek).
2. **Aynı SQL'i `migrations/NNN_ad.sql` dosyasına yaz** — şablona uy.
3. **GitHub'a commit at** — CI `MIG_*` kurallarını kontrol eder.
4. **Şablon dosyası:** `docs/templates/yeni-migration-sablonu.sql`

### Baseline

`000_initial_schema.sql` ilk hareket noktası — 6029 satır, 51 tablo dump'ı. Yeni bir Supabase projesine baştan kurulum için bu dosya koşturulur, sonra `001`'den itibaren tüm migration'lar sırasıyla uygulanır.

**Önemli:** Baseline değiştirilmez, sadece yeni migration'lar eklenir. Mevcut tabloyu değiştirme → yeni migration'da `ALTER TABLE`.

---

## 5. Tablo Listesi

<!-- AUTO-START:tablolar -->
> Toplam 53 tablo. Son güncelleme: 2026-05-25.

- `ai_analizler`
- `audit_log`
- `basamak_sablonlari`
- `basamak_tanimlari`
- `belgeler`
- `blok_sayfa_yetkileri`
- `bukum_kalemleri`
- `customer_kullanicilar`
- `customer_project_access`
- `customers`
- `devreler`
- `egitim_verisi`
- `feature_flags`
- `feedback_kayitlari`
- `firma_moduller`
- `fotograflar`
- `hakedis_kriterleri`
- `hakedis_paketleri`
- `hakedis_spooller`
- `ifs_material_alias`
- `is_kayitlari`
- `islem_log`
- `kesim_kalemleri`
- `kesim_listeleri`
- `kk_davet_spooller`
- `kk_davetler`
- `kullanici_bloklar`
- `kullanici_yetkileri`
- `kullanicilar`
- `malzeme_kataloglari`
- `malzeme_tanimlari`
- `markalama_kalemleri`
- `markalama_listeleri`
- `markalama_listesi_kalemleri`
- `notlar`
- `panel_gorevler`
- `pipeline_malzemeleri`
- `projeler`
- `rol_sablonlari`
- `sayac_tanimlari`
- `sevkiyat_spooller`
- `sevkiyatlar`
- `spool_malzemeleri`
- `spooller`
- `tarama_sonuclari`
- `tenant_features`
- `tenants`
- `tersane_firma_iliskileri`
- `tersaneler`
- `test_spooller`
- `testler`
- `yetki_bloklari`
- `yetki_tanimlari`
<!-- AUTO-END:tablolar -->

---

## 6. Kritik Tablolar

Yazılımcının iş akışını anlaması için en önemli 5 tablo:

### `tenantlar`
Firma tanımları. Her kayıt bir tersane. `id` tüm diğer tablolara `tenant_id` olarak FK edilir.

### `kullanicilar`
Tersane personeli. `tenant_id` bağlantısı + `yetki_bloklari` ilişkisiyle **rol ve yetki** belirlenir. Özel rol: `super_admin` (tenant_id NULL, global).

### `projeler`
Bir tersanenin üstlendiği iş — genelde bir gemiye ait boru imalat paketi. Altında birden fazla `devreler` olur.

### `devreler`
Pipeline (boru devresi). Bir projenin içinde birden fazla devre. Her devrede bir dizi **spool** (boru demeti) vardır.

### `spooller`
Atomik imalat birimi — bir tek boru demeti. AresPipe'ın **asıl iş parçası**: kesim, büküm, markalama, KK, sevkiyat hep spool seviyesinde takip edilir.

### İş Akışı İlişkisi

```
tenantlar
  ↓ tenant_id
projeler
  ↓ proje_id
devreler
  ↓ devre_id
spooller
  ↓ spool_id
kesim_kalemleri / bukum_kalemleri / markalama_kalemleri / test_spooller / sevkiyat_spooller
```

Bir spool hayatı boyunca bu operasyon tablolarının çoğunda bir kayıt üretir. `islem_log` tablosu bu geçişlerin tarihçesini tutar.

---

## 7. Yedekleme

### Otomatik

- **Her gece 03:00 TR** — GitHub Actions workflow (`.github/workflows/db-backup.yml`) tetiklenir.
- **Yedek hedefi:** `cihatoztas-ai/arespipe-backups` (private repo)
- **Yedek yapısı:**
  ```
  backups/
    YYYY-MM-DDTHH-MM-SS/
      database.sql.gz      (pg_dump)
      storage.tar.gz       (Supabase Storage bucket'ları)
  ```
- **Retention:** 30 gün rolling — daha eski yedekler otomatik silinir.
- **Gereken secrets:** `SUPABASE_DB_URL`, `SUPABASE_SERVICE_KEY` (backup repo'sunda).

### Manuel

Anlık yedek almak gerektiğinde:
1. `cihatoztas-ai/arespipe` → Actions → "Supabase Full Backup"
2. "Run workflow" → main → Run
3. ~2-5 dakika içinde backup repo'sunda yeni klasör.

### Geri Yükleme

Acil durumda:
1. Backup repo'sundan istenen tarih klasörünü indir
2. `database.sql.gz` → `gunzip` → `psql` ile yeni bir Supabase projesine yükle
3. `storage.tar.gz` → Supabase Dashboard → Storage → ilgili bucket'a import

**Yeterli test edilmemiş** — ilk gerçek restore denemesi henüz yapılmadı. 30+ oturumlarda altyapı konusu olarak gelecek.

---

## Ekler

### Yararlı Supabase Dashboard Linkleri

- **SQL Editor:** Dashboard → SQL Editor. Migration'ı test etmenin en hızlı yolu.
- **Table Editor:** Dashboard → Table Editor. Schema'yı görsel olarak gezmek için.
- **Logs → Postgres Logs:** DB hatası debug'lamak için (RLS reject, constraint violation).
- **Authentication → Users:** Kullanıcı hesaplarını görmek ve (gerekirse) şifre resetlemek.

### Referanslar

- CI kural tanımları: `.github/kurallar.json` (`migrations` bölümü)
- Migration şablonu: `docs/templates/yeni-migration-sablonu.sql`
- Yedek workflow: `.github/workflows/db-backup.yml`
- İlgili oturumlar: 19 (RLS policy'ler), 22 (trigger guard), 27 (yedekleme + migrations), 28 (migration CI entegrasyonu)

---

_Bölüm 5 (Tablo Listesi) otomatik güncellenir. Diğer bölümler manuel — şema değiştiğinde yazılımcı günceller._
