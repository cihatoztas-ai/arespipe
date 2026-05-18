# 98. Oturum — Migration Çalıştırma + Smoke Test

> **Önce:** 97 mimari planı yazdı, schema dosyasını hazırladı, hiçbir SQL çalıştırmadı.
> **Şimdi:** 98'in tek işi `migrations/080_devre_wizard_v2_schema.sql`'ı **canlı DB'ye çalıştırmak** ve doğrulamak.

---

## Açılış Ritüeli (CLAUDE.md disiplini)

2 kısa kontrol:

1. **`git pull` temiz mi?**
   ```bash
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
   ```

2. **Bugün ne yapmak istiyorsun?** → Cevap: **97'nin migration'ını çalıştıracağız + smoke test.**

---

## 98'in Ana İşi — 4 Adım, ~30 dakika

### Adım 1 — CI yeşil mi teyit (5 dk)

```bash
# Son commit'in CI durumu
gh run list -L 1
# veya GitHub Actions sayfası: https://github.com/cihatoztas-ai/arespipe/actions
```

97'de yüklenen 4 dosya CI'yı tetiklemiş olmalı:
- `migrations/080_devre_wizard_v2_schema.sql` (yeni)
- `docs/DEVRE-WIZARD-V2-MIMARISI.md` (yeni)
- `CLAUDE-SON-OTURUM.md` (güncelleme)
- `CLAUDE-SONRAKI-OTURUM.md` (güncelleme)

Beklenen: **CI YEŞİL**. `MIG_*` uyarısı çıkmamalı (dosya adı + başlık formatı şablona uydu).

Eğer kırmızı: önce uyarıyı çözeriz, sonra migration. Push edilmiş dosyayı düzeltir, `gp` ile yeniden push.

### Adım 2 — Kuru çalıştırma (10 dk)

Supabase SQL Editor'de:

1. `migrations/080_devre_wizard_v2_schema.sql` dosyasının **tüm içeriğini** kopyala
2. SQL Editor'e yapıştır
3. Dosyadaki `BEGIN;` ve `COMMIT;` satırlarını bul — `COMMIT;` satırını **`ROLLBACK;`** olarak değiştir
4. **Çalıştır**

Bu **gerçek yazmadan** sözdizimi + şema hatalarını gösterir. Transaction sonunda ROLLBACK olduğundan tablolar oluşmaz.

**Beklenen sonuç:** Hata mesajı olmamalı, alt kısımda "Success. No rows returned" veya benzer mesaj.

**Olası sorunlar:**
- `function get_tenant_id() does not exist` → canlı'da fonksiyon yok, kontrol et: `SELECT * FROM pg_proc WHERE proname='get_tenant_id'`
- `relation "tenants" does not exist` → schema search_path sorunu (olağan değil)
- `Unicode/encoding hatası` → kopyala-yapıştırda em-dash veya typografik karakter karışmış (MK-48.6 hatırlat: ASCII yapıştır)

### Adım 3 — Gerçek çalıştırma (5 dk)

Kuru çalıştırma temizse:

1. Aynı SQL'i tekrar yapıştır
2. `ROLLBACK;` satırını **`COMMIT;`** olarak geri al
3. **Çalıştır**

**Beklenen sonuç:** "Success. No rows returned" — 8 tablo, 16 index, 8 policy, 62 seed satır, 1 ALTER, N feature flag satırı (her tenant için 1) eklendi.

### Adım 4 — Smoke test (10 dk)

Migration dosyasının altındaki **5 test sorgusunu** sırayla çalıştır (yorumları açarak):

**Test 1: 8 tablo oluştu mu?**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name IN (
  'dokuman_tipleri','klasor_isim_sozluk','devre_dokumanlari','spool_dokumanlari',
  'dosya_isleme_kuyrugu','alan_oncelik_kurallari','excel_format_tanimlari','fuzyon_karar_log'
) ORDER BY table_name;
```
Beklenen: 8 satır.

**Test 2: Sistem default'lar yüklendi mi?**
```sql
SELECT 'dokuman_tipleri' AS tablo, count(*) FROM dokuman_tipleri WHERE tenant_id IS NULL
UNION ALL SELECT 'klasor_isim_sozluk', count(*) FROM klasor_isim_sozluk WHERE tenant_id IS NULL
UNION ALL SELECT 'alan_oncelik_kurallari', count(*) FROM alan_oncelik_kurallari WHERE tenant_id IS NULL;
```
Beklenen: 14, 33, 15.

**Test 3: RLS policy'leri eklendi mi?**
```sql
SELECT tablename, policyname FROM pg_policies
WHERE schemaname='public' AND tablename IN (
  'dokuman_tipleri','klasor_isim_sozluk','devre_dokumanlari','spool_dokumanlari',
  'dosya_isleme_kuyrugu','alan_oncelik_kurallari','excel_format_tanimlari','fuzyon_karar_log'
) ORDER BY tablename;
```
Beklenen: 8 satır (her tabloda 1 policy).

**Test 4: pipeline_malzemeleri'ne kolon eklendi mi?**
```sql
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='pipeline_malzemeleri'
  AND column_name='kaynak_dokuman_id';
```
Beklenen: 1 satır, `uuid`, `YES`.

**Test 5: Feature flag tüm tenant'lara eklendi mi?**
```sql
SELECT count(DISTINCT tenant_id) AS tenant_sayisi
FROM tenant_features
WHERE feature_kod='devre_wizard_v2';

SELECT count(*) AS toplam_tenant FROM tenants;
```
Beklenen: İki sayı eşit olmalı (her tenant'a 1 satır).

---

## Beş Test de Yeşilse Ne Yapıyoruz?

**HİÇBİR ŞEY.** 98 kapanır. 99'da `devre_wizard.html` iskeletine başlanır. 98 sadece **DB altyapısını canlıya almak**, başka iş yok.

Tek ek: `KARAR-97.13` kapsamında DATABASE.md'yi güncellemek istersen, bu 98'in **opsiyonel** ek işi olabilir. Ama gerekli değil — uyumsuzluk migration başlığında not edildi.

---

## Beklenmedik Senaryo — Bir Test Kırmızı Çıkarsa

### `get_tenant_id()` yoksa

Kontrol:
```sql
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname='get_tenant_id';
```

Yoksa migration başarısız olur. Bu durumda **mevcut sistemde** `spool_malzemeleri` çalışıyor demek imkansız — fonksiyon olmadan RLS çalışmaz. Yani büyük ihtimal var ama farklı isimle (`current_tenant_id`?, `jwt_tenant_id`?). Aramamız gerek:

```sql
SELECT proname FROM pg_proc 
WHERE proname ILIKE '%tenant%' AND prokind='f';
```

### Bir CHECK constraint reddederse

Olası neden: seed verisinde tip kodu listesi ile CHECK kuralı çakışır. Migration'da CHECK koymadım constraint'lerde — sadece `varsayilan_seviye IN ('devre','spool')` ve birkaç tane. Bunlar seed verilerimle uyumlu, sorun olmamalı.

### CASCADE deadlock olursa

CREATE TABLE sırası önemli — FK bağımlılıkları düzgün olmalı. Migration'da `devre_dokumanlari` `spool_dokumanlari`'ndan önce yaratıldı (FK doğru yön). Sorun olmamalı.

---

## 99'a Bakış (Şimdilik Spoiler)

99'da:
- `devre_wizard.html` yeni dosya yaratılır (0 satır → ~300 satır iskelet)
- Sidebar'a "Yeni Devre (Wizard)" eklentisi (sadece feature flag açık tenant'larda görünür)
- Drag-drop area + dosya tipi auto-detect (`dokuman_tipleri` sözlüğünden okuyarak)
- Yüklenen dosyaların tablosu (henüz parse yok, sadece liste)
- "İlerle" butonu disabled

Parser entegrasyonu 100+'a. 99'un asıl işi **UI iskeleti + dosya kabul akışı**.

---

## Açık Borçlar (97 sonu)

- ⚪ Migration çalıştırma (98'in işi — bu dosya)
- ⚪ Feature flag'in tek tenant için açılması (98 veya 99'da, pilot tenant kararı)
- ⚪ AVEVA AP214 çıkış denemesi (opsiyonel, Cihat zaman bulduğunda tersanedeki adımı sorabilir)
- ⚪ `DATABASE.md` RLS uyumsuzluğu (97.13'te not edildi, gelecek belge sweep oturumunda)
- ⚪ 99-104 implementasyon serisi (bu plan `docs/DEVRE-WIZARD-V2-MIMARISI.md` bölüm 4'te)

---

## Hatırlatmalar

- **MK-48.6:** Supabase SQL Editor Unicode hassasiyeti — em-dash, typografik apostrofe paste'ten kaçın. Migration dosyasını GitHub'dan ham olarak (Raw view) kopyala, plain text yapıştır
- **MK-52.2:** `gp` kullan, `git push` değil — son-durum.md otomatik commit'ini yakalar
- **Risk düşük** — KARAR-97.0 garantisi mevcut tablolarda veri kaybı yok. Her şey olsa olsa **kuru çalıştırmada** hata verir, ROLLBACK ile çıkarsın
- **Acele yok** — 98 sadece 30 dakikalık iş. İşten önce yapabilirsin, akşam yapabilirsin, hafta sonu yapabilirsin. Schema bekler

---

> **98. oturum açılışında bu dosya + `son-durum.md` + `CLAUDE-SON-OTURUM.md` okunacak.**
