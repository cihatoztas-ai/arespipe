# AresPipe Kütüphane Mini-Projesi — Devam Briefingi (v2)

> **Hedef:** Yeni sohbette buradan devam etmek
> **Son güncelleme:** 11 Mayıs 2026 — 75. oturum sonu
> **Önceki sürüm:** 7 Mayıs 2026 (v1 — Cap yarıda kaldı, EN 1092-1 başlanmamıştı)

---

## 1. Kütüphane mini-projesinin amacı

AresPipe'ta spool malzeme listelerindeki standart parçaları (ASME B16.5 flanş, B16.9 fitting, B36.10M boru, EN 1092-1 flanş vs.) DB'de **parça olarak** hazır tutmak. Spool detay sayfasında "PN 16 SO" yazısı kayıt değil, **eşsiz parça referansıdır** — 3D modelleme + ağırlık hesabı + sızıntı önleme bu kimliğin üstüne kurulur.

**Cihat'ın 75'te netleştirdiği prensip:**
> *"Sistemimize giren spoollara ait malzeme listesinde ne varsa bunları bir yazı olarak değil parça olarak tanıyacaz. O yüzden burada eksiğimizin olmaması lazım. Bu parça tanıma işi bizim daha sonra 3D modellemelerimizde lazım olacak."*

**Kapsam tavanı:** ~12,000 satır (tüm standartlar, malzeme, uyum, spec).
**75. oturum sonu durum:** 1,125 satır geometri (önceki 1,047 + 78 yeni). %~9.

---

## 2. KESİN KURAL — AI veri üretmez

✓ Tüm boyutlar **Wermac, Ferrobend, RoyMech** scrape ile gelir
✓ Inch tablo otorite, mm dönüşümü ×25.4 + half-up yuvarlama
✓ Çapraz kontroller (her runner ≥3 test) otomatik çalışır
✓ Çapraz kaynak doğrulama (Wermac ↔ Ferrobend / RoyMech ±0.5mm)

Bu kuralı her cephede uygulamak ZORUNLU.

---

## 3. Mevcut durum — Yüklenmiş veriler (Supabase'de, 75 sonu)

### KUŞ BAKIŞI

| DB Tablosu | Satır | Tenant desteği | RLS koruma |
|---|---:|:---:|:---:|
| `boru_olculer` | 440 | ✅ | ✅ |
| `flansh_olculer` | **261** (+45 EN 1092-1) | ✅ | ✅ |
| `fitting_olculer` | **424** (+33 Cap) | ⚠ tenant_id YOK | ✅ |
| `boru_standart_sozluk` | 13 | — | — |
| `ozel_parcalar` | ❌ Yok | — | — |
| `malzeme_kataloglari` | ❌ Yok | — | — |
| `fitting_malzeme_uyum` | ✅ Boş | — | — |

### A) `flansh_olculer` — 261 satır

| Standart | Tip | Sınıflar | Satır | Durum |
|---|---|---|---:|---|
| **B16.5** | WN | 150, 300, 400, 600, 900, 1500, 2500 | 132 | Eski |
| **B16.5** | SO | 150, 300 | 42 | Eski |
| **B16.5** | BL | 150, 300 | 42 | Eski |
| **EN-1092-1** | **EN-T11** (WN) | PN 16 | **15** | **75 ✓** |
| **EN-1092-1** | **EN-T01** (Plate SO) | PN 16 | **15** | **75 ✓** |
| **EN-1092-1** | **EN-T12** (Hubbed SO) | PN 16 | **15** | **75 ✓** |

**Eksik (P0/P1):** EN-T05 (Blind) PN 16, B16.5 SW/LJ, Class 600+ SO/BL

### B) `fitting_olculer` — 424 satır

| Parça | NPS aralığı | Satır | Durum |
|---|---|---:|---|
| 90° LR Elbow | 1/2 – 48 | 33 | Eski |
| 45° LR Elbow | 1/2 – 48 | 33 | Eski |
| 90° 3D LR / 45° 3D LR Elbow | 3/4 – 48 | 64 | Eski |
| Equal Tee | 1/2 – 48 | 33 | Eski |
| Reducer (Conc + Ecc) | NPS combo | 228 | Eski |
| **Cap** | 1/2 – 48 | **33** | **75 ✓** |

**Eksik (P0/P1):** Stub End, 90SR, 180° Elbow, Reducing Tee, Tee/Reducer/3D Elbow ağırlıkları

### C) `boru_olculer` — 440 satır (75'te değişmedi)

| Standart | Malzeme | Satır |
|---|---|---:|
| ASME-B36.10M | karbon | 238 |
| ASME-B36.19M | paslanmaz | 70 |
| ASTM-B241 | alüminyum | 50 |
| DIN-2448 | karbon | 29 |
| EEMUA-144 | cunife | 24 |
| EN-10216-1 | karbon | 29 |

---

## 4. KRİTİK MİMARİ — Multi-tenant + sistem koruma

5 Mayıs migration setiyle kurulu (DB'de aktif, 75 sonu GitHub'da):

```
027_boru_olculer_tenant_ekle.sql           (kütüphane mini, 75 sonu hala push edilmeli)
028_tenant_spec_sozluk.sql                  (kütüphane mini, push bekliyor)
029_boru_agirlik_function.sql              (push bekliyor)
030_dogrulama.sql                           (push bekliyor)
031_public_views_ve_rls.sql                 (push bekliyor)
                                            ← ana sayaç 032-036'yı tüketti
037_inserts_cap.sql                         (75'te push ✓ — fitting_olculer +33)
038_inserts_en1092_pn16_t11_wn.sql         (75'te push ✓ — flansh_olculer +15)
039_inserts_en1092_pn16_t01_t12.sql         (75'te push ✓ — flansh_olculer +30)
```

### 2 katman mimari

```
KATMAN 1: Sistem Kütüphanesi (sistem_preset=TRUE, tenant_id=NULL)
  → 1,125 satır toplam (440 boru + 261 flanş + 424 fitting)
  → super_admin dışında UPDATE/DELETE YASAK (RLS)
  → Tüm tenant'lar için ortak

KATMAN 2: Tenant Özel (sistem_preset=FALSE, tenant_id dolu)
  → standart='TENANT-SPEC', schedule_tipi='olcum'
  → Şu an: 0 satır
  → Pilot başlayınca tersanenin standart-dışı stoğu buraya
```

### `boru_agirlik_hesapla()` function (DB'de aktif, GitHub'da push bekliyor)

```sql
boru_agirlik_hesapla(60.3, 6.3, 'karbon')  → 8.39 kg/m
boru_agirlik_hesapla(114.3, 6.02, 'karbon') → 16.08 kg/m
```

---

## 5. 75. OTURUM KARARLARI (mimari, kalıcı)

### MK-75.A — EN flanş tip kodu naming convention

`flansh_olculer.flansh_tipi` text alanında EN ve B16.5 ayrı kod ailesi:
- **B16.5 (mevcut):** `WN`, `SO`, `BL`, `SW`, `LJ`, `TH` (dokunulmaz)
- **EN 1092-1 (yeni):** `EN-T01`, `EN-T05`, `EN-T11`, `EN-T12`, ...
- UI filtre: `flansh_tipi LIKE 'EN-%'` veya `geometri_std='EN-1092-1'`

**Sebep:** Parça kimliği prensibi. Type 01 (plate) ve Type 12 (hubbed) farklı geometri — "SO" altında birleştirmek 3D modelde yanlış parça gösterir.

### MK-75.B — `basinc_sinifi` sadece sayı

B16.5 convention: `'150'`, `'300'` (Class değil). EN için aynı: `'16'`, `'25'` (PN değil).
Filtreleme: `geometri_std + basinc_sinifi` ikilisi ayrımı sağlar.

### MK-75.C — `bolt_holes_inch` ve `bolt_cap_inch` çift anlamı

Alan isimleri tarihsel (B16.5 imperial), içerik standarda göre değişir:
- **`bolt_holes_inch`** = bolt **delik** çapı
  - B16.5: `'3/4'`
  - EN: `'18mm'` (Wermac G değeri)
- **`bolt_cap_inch`** = bolt **gövde** çapı
  - B16.5: `'5/8'`
  - EN: `'M16'` (Wermac hex bolt size)

UI filtresinde naming kafa karıştırıcı — sonraki migration'da `bolt_size_text` gibi yeniden adlandırma değerlendirilebilir.

### MK-75.D — Idempotent INSERT pattern (kütüphane standardı)

Her INSERT şu şablonda:
```sql
INSERT INTO <tablo> (...)
  SELECT <değerler>
  WHERE NOT EXISTS (
    SELECT 1 FROM <tablo>
    WHERE <doğal_anahtar> AND sistem_preset=TRUE
  );
```
Doğal anahtar tablo bazında:
- `fitting_olculer`: `(parca_tipi, geometri_std, cap_buyuk_dn, sistem_preset)`
- `flansh_olculer`: `(geometri_std, flansh_tipi, basinc_sinifi, cap_dn, sistem_preset)`
- `boru_olculer`: `(standart, malzeme_grubu, dn, schedule_tipi, schedule_deger, sistem_preset)` (önceki cepheden)

### MK-75.1 — `notlar` kolonu TEXT (JSONB değil)

Her üç kütüphane tablosunda `notlar text`. Detay JSONB string olarak yazılıyor (geçerli JSON ama tipi text). SELECT'te `::jsonb` cast şart:
```sql
SELECT (notlar::jsonb)->>'tip_adi_uzun' FROM ...
```
**Sonraki migration adayı:** `notlar` TEXT → JSONB (mevcut veri geçerli JSON olduğu için CAST migration mümkün). Düşük öncelik.

### MK-75.2 — NOT NULL constraint kontrolü zorunlu

INSERT yazmadan önce sadece kolon listesi değil **constraint'leri de sorgula**:
```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name='<tablo>'
ORDER BY ordinal_position;
```
75'te `flansh_olculer.bolt_circle_mm NOT NULL` constraint atlandı → 039 ilk satırda patladı, tüm INSERT geri alındı, transformer yeniden yazıldı. Sonraki cephelerde standart sorgu artık `is_nullable` içerir.

### MK-75.3 — Çift kaynak doğrulama (yöntemi netleşti)

- Tek tip + tek PN için iki bağımsız kaynak fetch et
- DN 100 spot check kritik referans değerlerle eşleşmeli
- 7+ alan birebir uyum (±0.5mm tolerans) ✓ ise kaynak güvenilir
- 75'te Wermac vs RoyMech DN 100 PN 16: A=220, A=114.3, BC=180, K=20, N1=131, H2=52, H3=12, S=3.6 → tüm alanlar birebir.

### MK-75.4 — Standart edisyon farklılıkları

Aynı standardın farklı sürümleri farklı değerler verir. Örnek:
- BS EN 1092-1:2002 → `f1 = 2mm` her DN için
- EN 1092-1:2007+A1:2013 → `f1 = 2/3/4/5mm` DN aralığına göre

**Karar:** En güncel sürüm referans alınır. Eski sürüm kaynak (örn. RoyMech BS 2002) kullanılıyorsa override edilir, override kaynağı not edilir.

---

## 6. ŞU AN BURADAYIZ — 75. oturum sonu

### Tamamlandı (75)
- ✅ 037 Cap (33 satır, idempotent rewrite)
- ✅ 038 EN-T11 PN 16 WN (15 satır, full schema)
- ✅ 039 EN-T01 + EN-T12 PN 16 (30 satır)
- ✅ Üçü de Supabase + GitHub'da
- ✅ Spot check'ler birebir: NPS 4 Cap H=64.0, H1=76.0 | DN 100 EN-T11 K=20 | DN 100 EN-T01 K=22, T12 N2=140

### Yarıda kalan yok — temiz kapanış

---

## 7. P0/P1 SIRA (sonraki kütüphane oturumları)

### P0 — Hemen sıradakiler

1. **EN-T05 (Blind) PN 16** — Kaynak araştırması: piping-world yaprakları, pipingpipeline.com, valvias.com. Facing tipi nüansı (Type A flat / B1 RF) dikkat. ~15 satır.
2. **B16.9 Stub End** — Lap Joint pair (NPS 1/2 – 24, ~33 satır). Wermac dim'lerde var.
3. **B36.19M Paslanmaz Boru içerik teyidi** — DB'de 70 satır var ama bizim üretimimiz değil, cross-check.

### P1 — Pilot ihtiyacı

4. **EN 1092-1 PN 10, 25, 40** × T01/T05/T11/T12 → ~180 satır (PN 16 pattern'ini uygulamak, hızlı)
5. **B16.5 SW Flanş** Class 150/300 (~42 satır)
6. **B16.5 LJ Flanş** + Stub End ile birlikte paket

### P2 — İleride

- B16.11 Forged Fittings
- DIN 86019/86087 gemi CuNi
- B36.10M NPS 22-80

---

## 8. ÇALIŞMA ALANI VE DOSYALAR

### Üretim pipeline (Claude tarafı)

```
/home/claude/kutuphane/                ← AI çalışma alanı
├── ham_html/
│   ├── wermac_en1092_pn16_wn.md       ← 75'te kaydedildi (Type 11 kaynak)
│   └── roymech_en1092_pn16.md         ← 75'te kaydedildi (T01/T12 kaynak)
└── parsed_json/
    ├── EN_1092_1_PN16_T11_WN.json     ← 15 satır, 6/6 test geçti
    ├── EN_1092_1_PN16_T01_PlateSO.json ← 15 satır, 4/4 test geçti
    └── EN_1092_1_PN16_T12_HubbedSO.json ← 15 satır, 4/4 test geçti

/home/claude/db_import/
├── 037_inserts_cap.sql                 ← Supabase + GitHub ✓
├── 038_inserts_en1092_pn16_t11_wn.sql  ← Supabase + GitHub ✓
└── 039_inserts_en1092_pn16_t01_t12.sql ← Supabase + GitHub ✓
```

### Migrations sıra durumu (ana sayaç)

Son numara: **039**. Sonraki kütüphane SQL'i: **040** (örn. `040_inserts_en1092_pn16_t05_blind.sql`).

---

## 9. ÇALIŞMA YÖNTEMİ (yeni sohbette devam ederken)

### Cephe başına standart akış

1. Hedef tablo seç (önerilen: P0 sıralı)
2. Schema kontrolü: kolon listesi + **`is_nullable`** (MK-75.2)
3. Wermac/RoyMech/Ferrobend URL'sini fetch et → `ham_html/`
4. `runner_<tip>.py` yaz → JSON üret
5. Çapraz kontroller (≥3 test, ≥1 spot check bilinen referans)
6. Çift kaynak doğrulama (DN 100 + 7 alan ≥ ±0.5mm)
7. `transformer_<tip>.py` yaz → idempotent SQL (WHERE NOT EXISTS)
8. SQL'i Cihat'a ver (Supabase'de çalıştırır)
9. Doğrulama (sayım + spot + NULL kolon kontrolü)
10. Bu briefing'i güncelle

### Önemli pratik notlar

- **BEGIN/COMMIT kullanma** SQL script'lerinde
- **Idempotent yaz** (WHERE NOT EXISTS pattern)
- **NOT NULL constraint'leri ön-sorgula** (MK-75.2)
- **Generated column'lara INSERT yapma**
- **`sistem_preset=TRUE`, tenant_id=NULL** sistem kayıtlar için
- **`notlar` TEXT** — INSERT JSON string olarak, SELECT `::jsonb` cast (MK-75.1)
- **Standart edisyonları belirt** — eski/yeni sürüm farkları (MK-75.4)

---

## 10. YENİ SOHBETE BAŞLAMA TALİMATI

Bu briefing'i yeni sohbete yapıştır + birinden başla:

> **"P0-1: EN-T05 (Blind) PN 16'yı yapalım. Önce kaynak bul (piping-world, pipingpipeline, valvias) ve coverage'i ölç. Schema sorusu için: facing tipi Type A (FF) mi yoksa B1 (RF) mı default?"**

> **"P0-2: B16.9 Stub End başlatalım. Wermac dim_caps'i kullandık, dim_stub_ends'e bak."**

> **"P1-4: EN 1092-1 PN 10 yapalım — PN 16 pattern'ini birebir uygula (T11 + T01 + T12), 45 satır."**

> **"Kütüphane dışı çalışmaya geçelim. Ana proje 76. oturum gündemi ne?"** (ana oturum akışı için ayrı talimat)

---

## 11. PİLOTTAN GELEN GERÇEK SİNYAL (5 May 2026 — devam ediyor)

- 60.3 × 6.3 mm boru görüldü → DB'de en yakın B36.10M SCH 80 (5.54 mm), %12 sapma
- Aynı spool: PN 16 SO flanş + Victaulic Groove fitting
- **75 sonu durumu:** PN 16 için 3 tip yüklü, "PN 16 SO" eşleştirmesi artık **Type 01 (plate, EN default) veya Type 12 (hubbed)** olarak yapılabilir. Default önerisi: Type 01 (EN dünyasında en yaygın, plate).
- Eksik: PN 16 Blind (T05) ve Victaulic (özel parça tablosu yok)

---

> **Briefing güncellemesi disiplini:** Her kütüphane oturumu sonu bu dosya güncellenir. Yeni yüklenen sayılar, yeni öğrenmeler, yeni sıra. Eski sürümler `_arsiv/` altında tutulabilir veya sadece son sürüm canlıdır.
