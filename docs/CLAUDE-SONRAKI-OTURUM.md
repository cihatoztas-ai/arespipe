# Sonraki Oturum İçin Gündem (78)

**Hazırlanma tarihi:** 12 Mayıs 2026 (77. oturum sonu)
**Son durum:** B0 omurga (`malzeme_kataloglari`) canlı, PN 10 paketi 16 satır eklendi, kütüphane 292/12.400 (%2.4 — yeni baseline)

> **MK-77.1:** Bu dosya her oturum kapanışında yenilenir. 76'da unutuldu, 77'de mecburen yenilendi.

---

## Başlarken — Standart Ritüel

Yeni sohbet açınca:
1. `oturum 78 başlasın` ile başla
2. Git kontrol: `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3`
3. `cat docs/CLAUDE-SON-OTURUM.md` ile 77 özeti
4. `cat docs/CLAUDE-SONRAKI-OTURUM.md` ile bu dosya
5. Aşağıdaki Öncelik 1'i onaylayarak başla

---

## Öncelik 1 — Toplu `malzeme_id` UPDATE'leri (BORÇ KAPATMA, EN YÜKSEK ROI)

**Neden öncelik:** B0 omurgası canlı ama 1.366 mevcut geometri satırının `malzeme_id`'si NULL. Bu satırlar "yapısal kimlik fazı"na geçmedi. Tek tek 1.366 satır yazmadan, **toplu UPDATE** ile saatler içinde hepsi kapanır.

**Yapılacak (sırayla, her biri kendi commit'i):**

### 1.a) B16.5 → A105 (216 satır, 5 dk)
ASTM B16.5 flanşları geleneksel olarak A105 forged karbon çelik. Tek UPDATE:
```sql
UPDATE flansh_olculer
SET malzeme_id = (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL),
    olusturma = olusturma  -- timestamp'i bozma
WHERE geometri_std = 'B16.5'
  AND malzeme_id IS NULL
  AND sistem_preset = TRUE;
```
**Doğrulama:** 216 satır UPDATE etmeli.

### 1.b) EN 1092-1 PN 16 → A105 (60 satır, 5 dk)
PN 16 paketi de A105 (forged karbon flansh).

### 1.c) `boru_olculer` → kategori bazlı (450 satır, 30-45 dk)
Boru tablosu çeşitli — A106, A53, A312, EN 10216-1 vs. `malzeme_grubu` text kolonu var, ondan eşleştirilir:
```sql
-- Karbon dikişsiz boru → A106 Grade B (ya da A53 B; ikisi de geçerli, A106 daha yaygın)
UPDATE boru_olculer SET malzeme_id = (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A106 B' AND tenant_id IS NULL)
WHERE malzeme_grubu IN ('karbon','steel') AND malzeme_id IS NULL;

-- Paslanmaz → A312 TP316L
UPDATE boru_olculer SET malzeme_id = (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A312 TP316L' AND tenant_id IS NULL)
WHERE malzeme_grubu IN ('paslanmaz','stainless') AND malzeme_id IS NULL;

-- EN karbon → EN 10216-1 P235GH
UPDATE boru_olculer SET malzeme_id = (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'EN 10216-1 P235GH' AND tenant_id IS NULL)
WHERE geometri_std LIKE 'EN-%' AND malzeme_grubu = 'karbon' AND malzeme_id IS NULL;
```
**Sorun:** `boru_olculer.malzeme_grubu` text içeriği bilinmiyor. **78 başında DISTINCT sorgu çekilir, sonra UPDATE yazılır.**
```sql
SELECT malzeme_grubu, COUNT(*) FROM boru_olculer GROUP BY malzeme_grubu;
```

### 1.d) `fitting_olculer` → kategori bazlı (424 satır, 30 dk)
Fitting `parca_tipi` kolonu var: `90LR`, `45LR`, `cap`, `tee_eq`, `reducer_*`. Tüm B16.9 buttweld fitting → A234 WPB (karbon) ya da A403 WP316L (paslanmaz). `fitting_olculer` tablosunda malzeme_grubu kolonu var mı? **Pre-flight kontrol:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='fitting_olculer' AND column_name LIKE '%malzeme%';
```

**Süre tahmini (1.a-1.d):** 1.5-2 saat — 78'in büyük kısmı.

**Beklenen sonuç:** 1.366 NULL satır → 0 NULL satır. Tüm kütüphane parça kimliği prensibine geçmiş olur. Kritik mimari milestone.

---

## Öncelik 2 — EN 1092-1 PN 10 Eksik Tipler (T01 + T12)

**Önkoşul:** Kaynak araştırması. RoyMech PN 10 sayfası yok (77'de tespit edildi). Alternatif kaynaklar:
- **DIN 2632** (eski Alman standardı) — Wermac ana referans, RoyMech BS4504_10 sayfası mevcut
- **EN 1092-1:2018 PDF** — resmi standart, ücretsiz versiyon arama gerek
- **ProjectMaterials Plate Flange (Type 01) PN 10** — direkt sayfa var: `/en-1092-plate-flange-sizes/`
- **piping-world.com** — ek cross-check

**Yapılacak:**
1. `web_fetch` ile PM Plate Flange sayfası → PN 10 T01 verisi
2. RoyMech BS4504_10 sayfası → Wermac PN 10 ile cross-check
3. T01 + T12 için DN 10-600 paketi yaz (~40 satır)
4. Migration 043 ya da numara disiplini sonrası neresi olursa

**Süre tahmini:** 1.5 saat (kaynak araştırma + 40 satır paket)

---

## Öncelik 3 — `CLAUDE-SON-OTURUM.md` ve `CLAUDE-SONRAKI-OTURUM.md` Otomasyonu

**Neden:** MK-77.1 disiplini insan-hafıza riskli. 76'da unutuldu. Otomatik kontrol scripti yazılırsa risk sıfırlanır.

**Yapılacak:**
- `scripts/oturum-kapanis-kontrol.sh` — son git commit tarihiyle bu iki dosyanın `mtime`'ı karşılaştırılır, yaşlı dosya varsa uyarı
- `pre-commit` hook veya GitHub Actions workflow — kapanış commit'inde bu iki dosya değişmemişse PR uyarı

**Süre tahmini:** 30 dk

---

## Öncelik 4 — B36.10M Karbon Audit (76'da Atlandı)

**Neden:** 76 takip belgesinde "76 P1: B36.10M karbon doğrulama (Wermac ile audit, 238 satır)" işi vardı, ama atlanmış. Yeni satır eklemez, mevcut verinin doğrulanmasıdır.

**Yapılacak:**
- Wermac B36.10M tablosunu çek
- Canlı 238 satır karbon boru ile karşılaştır (DN/OD/wall thickness)
- Tutarsızlık varsa UPDATE migration yaz

**Süre tahmini:** 2 saat (orta öncelikte, 79+ olabilir)

---

## Kesinlikle 78'DE YAPILMAYACAKLAR

- ❌ EN 1092-1 PN 25 + PN 40 paketleri (79+'a)
- ❌ B16.9 eksik parça tipleri (80+'a)
- ❌ Wizard UI (43. oturumdan beri erteleme, format learning loop önce)
- ❌ Mobil ekranlar (MProfil vb. — 2. oturumdan kalan eski gündem)

---

## Kural Hatırlatmaları (78 Claude'una)

**Kapanış protokolü (MK-77.1):**
Oturum sonunda zorunlu 3 dosya:
1. `CLAUDE-SON-OTURUM.md` (bu oturum özeti)
2. `CLAUDE-SONRAKI-OTURUM.md` (gelecek oturum gündemi)
3. `.github/son-durum.md` (yaşayan durum dosyası)

**Migration numara disiplini (MK-77.3):**
Yeni migration önermeden:
```bash
ls ~/Desktop/arespipe/migrations/ | sort | tail -10
```
Çıktıyı görmeden numara önerme. 77'de 041 çakışması son anda yakalandı, bundan ders alındı.

**Migration dosya adı pattern (MK-77.8):**
`^\d{3}_[a-z0-9_]+\.sql$` — 3 rakam + underscore + lowercase. **Tire (`-`) YASAK**, sadece underscore. CI `[MIG_ISIM_BOZUK]` ile yakalar, deploy'u engeller. 76'da `dn350-600` tire içeriyordu, 77'de rename ile düzeltildi.

**Şema kontrol disiplini (MK-77.4):**
Bilinmeyen tabloya sorgu öncesi:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='X';
```

**Yeni geometri satırı disiplini (MK-77.5):**
Yeni `boru_olculer`/`fitting_olculer`/`flansh_olculer` satırı eklenirken `malzeme_id` **dolu doğmalı**. NULL FK kabul edilmez. INSERT'te subquery ile:
```sql
malzeme_id = (SELECT id FROM malzeme_kataloglari WHERE spec_kodu='ASTM A105' AND tenant_id IS NULL)
```

**Tek-kaynak satır disiplini (MK-77.6):**
JSONB notlar içinde `kaynak_crosscheck` alanı her yeni satırda var. Çift kaynak doğrulanmadıysa `"YOK — sebep"` yazılır, audit trail bırakılır.

**Direct-COMMIT kabul (MK-77.7):**
Dry-run ROLLBACK zorunlu değil, ama her migration BEGIN/COMMIT tek-atomik sarılı olmalı. DDL + DML aynı transaction'da.

**İpucu↔katalog uyumu (MK-77.2):**
Yeni katalog spec'i eklerken:
```sql
SELECT i.kalite_kodu_pattern, i.tipik_malzeme_standardi, k.spec_kodu
FROM malzeme_standart_ipucu i
LEFT JOIN malzeme_kataloglari k ON k.spec_kodu = i.tipik_malzeme_standardi;
```
NULL kalan eşleşmeler kontrol edilir.

---

## Strateji Özeti

**78 ana iş bandı: BORÇ KAPATMA.** Yeni satır eklemek yerine mevcut 1.366 NULL FK'yı kapatmak en yüksek ROI iş. Tek UPDATE komutu 200+ satırı düzeltir. Bu, 77'de açtığımız omurganın **gerçek değerini kanıtlar**.

**3 katmanlı strateji (76'dan devam):**
- Katman 1: Altyapı düzeltmeleri (B0 ✅, FK UPDATE'leri 78)
- Katman 2: Yeni paket ekleme (PN 10 T01/T12 78'de, PN 25/40 79+)
- Katman 3: Audit/cross-check (B36.10M karbon 79+)

**Önceliklendirme prensibi:** Her oturum sonunda kütüphane "%ilerleme" değil, **"satır yapısal kimliğe sahip mi"** ile ölçülür. 78 sonu hedef: tüm 1.366 NULL FK kapatılmış, kütüphane tutarlı.

---

## Son Söz (77'den 78'e)

77'de mimari devrim oldu — kütüphane "çiğ data" fazından "yapısal kimlik" fazına geçti. 78'de **bu devrimi mevcut 1.366 satıra yayıyoruz**. 16 yeni satır eklemek 1.5 saat aldı, 1.366 satırı kapatmak 1.5-2 saat alacak — bu ölçek farkı omurganın değerinin somut kanıtı.

İyi başlangıçlar. 🚀
