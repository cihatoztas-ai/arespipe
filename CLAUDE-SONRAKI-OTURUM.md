# 92. Oturum Gündemi — Sonraki Çalışma

> 91'in açık borçları + Migration 066'nın canlıda çalıştırılması.

---

## 92 Açılış Ritüeli (CLAUDE.md)

Standart 2 kısa kontrol:

```
1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
2. Bugün ne yapmak istiyorsun?
```

**Beklenen 1. çıktı:** 91 commit'leri görünmeli (4 yeni dosya + 3 belge güncellemesi). Branch temiz, son 3 commit 91 işi olmalı.

**Beklenen 2. cevap:** "91'in açık borçları" veya benzer.

---

## 92'nin Ana İşi

### 1. Migration 066'yı Canlıda Çalıştır (~15 dk)

**Önce kontrol:**

```sql
-- Tablo şu an hâlâ bozuk mu doğrula
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referans_tablo
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'fitting_malzeme_uyum'
  AND tc.constraint_type = 'FOREIGN KEY';
```

**Beklenen:** Hâlâ 91'deki bozuk durum (fitting_id → flansh_olculer, malzeme_id → malzeme_tanimlari). Eğer durum değişmiş ise dur, yeniden değerlendir.

**Sonra çalıştır:**

`migrations/066_fitting_malzeme_uyum_onarim.sql` dosyasının içeriğini Supabase SQL editor'a yapıştır, Run.

**Beklenen sonuç:** "Success. No rows returned" + NOTICE'lar (PK eklendi vs.)

**Doğrulama:**

```sql
-- 1. FK'lar doğru mu?
SELECT 
  tc.constraint_name, kcu.column_name, ccu.table_name AS referans, tc.constraint_type
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'fitting_malzeme_uyum'
ORDER BY tc.constraint_type, kcu.column_name;
```

Beklenen 4 satır:
- `fitting_id` → `fitting_olculer` (FOREIGN KEY)
- `malzeme_id` → `malzeme_kataloglari` (FOREIGN KEY)
- `(fitting_id, malzeme_id)` PRIMARY KEY

```sql
-- 2. Tablo boş mu?
SELECT count(*) FROM fitting_malzeme_uyum;
-- Beklenen: 0
```

Başarılıysa MIGRATION-YOL-HARITASI.md'de Migration 066 durumunu 📝 → ✅ olarak güncelle.

---

### 2. Migration 067 Yaz + Çalıştır (~45 dk)

**Önkoşul:** 066 başarılı.

**Niye:** `boru_malzeme_uyum` + `flansh_malzeme_uyum` tabloları eksik. 3 çapraz uyum tablosu olmalı (boru/fitting/flansh).

**Adımlar:**

1. **Mevcut `fitting_malzeme_uyum`'un RLS policy'lerini incele:**

```sql
SELECT polname, polcmd, polqual, polwithcheck
FROM pg_policy
WHERE polrelid = 'fitting_malzeme_uyum'::regclass;
```

Bu pattern'i taklit edeceksin. Cihat'a göster, onaylat.

2. **Migration dosyasını yaz:**

`migrations/067_boru_malzeme_uyum_ve_flansh_malzeme_uyum_create.sql`

İçerik (taslak — pattern doğrulandıktan sonra finalize):

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS boru_malzeme_uyum (
  boru_id        uuid        NOT NULL REFERENCES boru_olculer(id) ON DELETE CASCADE,
  malzeme_id     uuid        NOT NULL REFERENCES malzeme_kataloglari(id) ON DELETE CASCADE,
  uretim_yontemi text,
  yaygin_mi      boolean     NOT NULL DEFAULT true,
  notlar         text,
  olusturma_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (boru_id, malzeme_id)
);

CREATE TABLE IF NOT EXISTS flansh_malzeme_uyum (
  flansh_id      uuid        NOT NULL REFERENCES flansh_olculer(id) ON DELETE CASCADE,
  malzeme_id     uuid        NOT NULL REFERENCES malzeme_kataloglari(id) ON DELETE CASCADE,
  uretim_yontemi text,
  yaygin_mi      boolean     NOT NULL DEFAULT true,
  notlar         text,
  olusturma_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (flansh_id, malzeme_id)
);

ALTER TABLE boru_malzeme_uyum    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flansh_malzeme_uyum  ENABLE ROW LEVEL SECURITY;

-- RLS policy'ler buraya — fitting_malzeme_uyum'un pattern'iyle aynı

COMMIT;
```

3. **Önce repo'ya commit, sonra Supabase'de çalıştır** (91 dersine sadık kal).

4. **Doğrulama:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('boru_malzeme_uyum', 'flansh_malzeme_uyum');
-- Beklenen: 2 satır

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('boru_malzeme_uyum', 'flansh_malzeme_uyum');
-- Beklenen: rowsecurity = true (her ikisi için)
```

---

### 3. Plan A'dan Kalan Küçük Borçlar (~45 dk)

#### 3.1. `kutuphane-oneriler` 2 vs ana sayfa "1 bekliyor" tutarsızlığı (15 dk)

90 son-durum.md'den:
> "Yeni sayfa: `v_tanimsiz_havuz_listele` (benzersiz ölçü×kalite gruplaması)"
> "Ana sayfa: `tanimsiz_kayitlar` durum='bekliyor' COUNT (onay süreci)"
> "İki ayrı şey sayıyorlar — birini diğerine eşitle ya da metin değiştir"

**Karar (önerilen):** Metin değiştir. Ana sayfada "X benzersiz öneri bekliyor" gibi netleştir, count metodları farklı sayılsın ama metin yanıltıcı olmasın.

**Dosya:** `admin/kutuphane.html` — Bekleyen Öneriler kartının metin/sayım mantığı.

#### 3.2. `ozel_parca_boru_kaydet` RPC dokümantasyon kararı (15 dk)

90'dan:
> "Şu an kullanılmıyor, frontend yok. Senaryo C (projeye özgü parça takibi) için referans olabilir. Karar: dokümantasyona ekle, kullanım kuralı netleşene kadar dokunma."

**Eylem:** `docs/RPC-KATALOG.md` (varsa) veya `docs/KUTUPHANE-KAPSAM.md` Bölüm 6'da bir not olarak. RPC'nin niye var olduğu + niye kullanılmadığı + ne zaman kullanılacağı (KARAR-90.D + KARAR-91.B uyumlu).

#### 3.3. `kutuphane.html` 3 broken link minimum fix (15 dk)

3 tablo Katman 2'de "Geçersiz tablo" diyor (`malzeme_kataloglari`, `fitting_malzeme_uyum`, `ozel_parcalar`).

**Geçici çözüm (Generic UI'a kadar):** 
- Dashboard'da bu 3 satırı tıklanmaz yap (`href="#"` + `cursor:default` + opacity 0.5)
- Tooltip: "Katman 2 görünümü 93'te eklenecek"

Generic UI hazır olunca düzgün bağlanır.

**Dosya:** `admin/kutuphane.html` — `link` hesabı satır 407 civarı.

---

## 92'nin Tahmini Süresi

- Migration 066 çalıştırma + doğrulama: 15 dk
- Migration 067 yazma + RLS kontrol + çalıştırma: 45 dk
- 3 küçük borç: 45 dk
- Kapanış (3 belge + commit + push): 15 dk

**Toplam:** ~2 saat. Rahat oturum.

---

## 93+ Planı (92'den sonra)

### 93 — Generic UI Altyapısı (3-4 saat)

4 mimari karar 91'de onaylandı (A-C-C-B):
- A: Tek sayfa `kutuphane-tablo.html` + URL parametresi
- C: Şema DB'den + UI metadata kodda (hibrit)
- C: Otomatik filtre + manuel override (hibrit)
- B: Generic core + opsiyonel zenginleştirme katmanı

**Çıktılar:**
- `admin/kutuphane-tablo.html` (yeni generic core)
- `admin/_kutuphane-konfig.js` (tüm tablo metadataları tek yerde)
- `admin/kutuphane-detay.html` (boru için zenginleştirme katmanı — mevcut görünüm korunur, generic core'u import eder)
- `admin/kutuphane.html` link mantığı güncellenir (TABLO_KONFIG'de yoksa generic'e gider)

### 94 — Veri Doldurma Başlangıcı

- Migration 068 — GOST/JIS/GB/T iskelet seed (boru için P0 boyutlar)
- Migration 069 — DIN 86087/88/89 P0 doldurma (CuNi gemi, P0)
- malzeme_kataloglari büyütme (eksik P0 + P1 spec'ler)

### 95+ — Sistem Olgunlaşması

- Migration 070 — Fitting filtre modeli (KARAR-90.C, UI tarafı)
- DSAF (Dublin) ilk kayıt geldiğinde Migration 071
- Spec sistemi (`tenant_spec_seti`) — ikinci tersane geldiğinde
- 3 katman birleştirme (`malzeme_tanimlari` migration düşünülürse)

---

## 91'den Devralınan Disiplin Kuralları

1. **Migration dosyası önce, çalıştırma sonra.** SQL Editor'da direkt komut çalıştırma yasak.
2. **Tablo silmek/arşivlemek için:** grep + log kontrolü zorunlu, aktif kullanım kanıtlanmadan dokunma.
3. **"Felsefe" kelimesinden kaçın.** "Tasarım yaklaşımı", "kural" gibi nötr terim kullan.
4. **Veri-tabanlı karar:** her tahmin için sample query çalıştır, ezbere konuşma.
5. **Cihat'tan onay almadan büyük yön değiştirme.** Plan değişikliği A/B/C alternatif olarak sun, Cihat seçsin.

---

## Açık Sorular

**Soru 1:** RLS pattern - `fitting_malzeme_uyum`'un mevcut policy'leri nasıl yazılmış? Migration 067'de aynı pattern kullanılacak.

**Soru 2:** `docs/templates/yeni-migration-sablonu.sql` repo'da var mı, içeriği ne? Migration 067'de bu şablondan başlatılmalı.

---

## 91'in Açık Notları (Hatırlatma)

- KARAR-91.G: Migration disiplini — **önce dosya, sonra çalıştırma**
- KARAR-91.A: 3 katman ayrı kalsın (Kütüphane vs Parser Sözlüğü vs Runtime)
- KARAR-91.B: Özel parça için ayrı tablo yok, `sistem_preset=false` bayrak
- KARAR-91.C: 6 standart aile iskelet (GOST/JIS/GB/T dahil)
- KARAR-91.D: 23 fitting tipi evreni
- KARAR-91.E: DSAF (Dublin flanş) 11. tip, kütüphane standart adıyla
- KARAR-91.F: Generic UI mimari onaylandı (A-C-C-B), yazım 93'te
- KARAR-91.H: KUTUPHANE-FELSEFE.md ayrı belgesi iptal

---

> 92. oturum açılışında bu dosya + `son-durum.md` + `docs/PROJE-HARITASI.md` + `docs/CLAUDE-CALISMA-MODU.md` + `docs/SPOOL-AI-VIZYON.md` okunacak. Sonra Cihat'a "Hangi işle başlayalım?" sorusu sorulur. Önerilen sıra: Migration 066 çalıştır → Migration 067 yaz/çalıştır → küçük borçlar.
