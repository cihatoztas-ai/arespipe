# AresPipe — Kütüphane Yükleme Takip

> **Amaç:** Kütüphane tablolarında neyi yaptık, neyi yapacağız — bir bakışta gör. Her oturum kapanışında güncellenir.
>
> **Kapsam:** Bu dosya `KUTUPHANE-KAPSAM.md` belgesinin **canlı durumudur**. Kapsam belgesi neyi yapacağımızı söyler, bu dosya neresini yaptığımızı gösterir.
>
> **Versiyon geçmişi:**
> - **v1** — 43. oturum (28 Nis 2026): İlk yazım, CuNi eksikti
> - **v2** — 43. oturum (28 Nis 2026): KUTUPHANE-KAPSAM.md ile hizalandı, CuNi P0'a çıkarıldı
> - **v3** — 91. oturum (15 May 2026): GOST/JIS/GB/T eklendi, ozel_parcalar modülü kaldırıldı, çapraz uyum 3 tabloya bölündü, hedef satır sayısı tahminleri kaldırıldı (iskelet + organik içerik), DSAF (Dublin flanş) 11. tip olarak eklendi
> - **v4** — 95. oturum (17 May 2026): 92-94 yüklemeleri yansıtıldı (CuNi marine = 92 satır), Migration 066+067 ✅ kapatıldı, LJ vocabulary kararı (KARAR-94.3) ve bolt NULL schema ALTER (MK-94.3) eklendi, malzeme_kataloglari gerçek dağılımı yansıtıldı

---

## Özet Tablo (17 May 2026 — 94 sonu)

| Modül | Tablo | Canlıda | İskelet | Not |
|---|---|---:|---|---|
| **Malzeme Master** | `malzeme_kataloglari` | 20 satır | 6 aile × 7 grup yapı hazır | CuNi 6, paslanmaz 9, karbon 5 — Duplex/Al/Alaşımlı/Nikel 0 |
| **Boru Geometrisi** | `boru_olculer` | **495 satır** | ASME/EN/DIN dolu, GOST/JIS/GB/T 0 | 94: DIN-86019 CuNi +44 (Migration 076) |
| **Fitting Geometrisi** | `fitting_olculer` | 569 satır | ASME B16.9/B16.11 dolu, diğerleri 0 | 23 tipten 3-4 tipi mevcut |
| **Flanş Geometrisi** | `flansh_olculer` | **356 satır** | ASME B16.5 + EN 1092-1 dolu, **CuNi LJ + Composite BL ✅** | 94: DIN-86037-2 LJ +29 + EN-1092-3 Composite BL +19 (Migration 077) |
| **Boru Çapraz Uyum** | `boru_malzeme_uyum` | ✅ Tablo + 0 satır | Migration 067'de kuruldu | Organik dolacak |
| **Fitting Çapraz Uyum** | `fitting_malzeme_uyum` | ✅ Tablo + 0 satır | Migration 066 ile FK fix tamamlandı | Organik dolacak |
| **Flanş Çapraz Uyum** | `flansh_malzeme_uyum` | ✅ Tablo + 0 satır | Migration 067'de kuruldu | Organik dolacak |

**Toplam canlıda:** 1,420 satır (geometri) + 20 (malzeme master) = **1,440 kayıt.**

**Hedef sayı yok.** İskelet hazır, içerik organik dolar. Her gemi PDF'i kütüphaneyi büyütür.

---

## Öncelik Mantığı (Gemi Tersanesi Profili)

| Öncelik | Açıklama | Örnek |
|---|---|---|
| **P0** 🔴 | Her gemi spool projesinde kritik | A105 WN/SO Class 150-300, **CuNi B466/B467 + DIN 86019/86037-2 ✅**, B16.9 90LR + Tee + Reducer DN50-200, B36.10 Sch 40 |
| **P1** 🟠 | Sık görülen | F316L Class 150-300, A234 WPB butt-weld, A335 P11/P22 (HT hatları), **EEMUA-144 CuNi (24/~30)** |
| **P2** 🟡 | Belirli proje tiplerinde | Class 600+ HT, Duplex (2205/2507), LJ flanş (karbon), Alüminyum (5083 deniz) |
| **P3** ⚪ | Özel proje gelirse | Nikel alaşım (Inconel/Hastelloy), Class 2500 |

**Standart aile bazında:**

| Aile | İskelet | Öncelik | Tetik |
|---|---|---|---|
| ASME | Geometri var (B36.10, B16.5, B16.9, B16.11) | P0 🔴 | Aktif kullanım |
| EN | Geometri var (10216, 1092-1, **1092-3 ✅**) | P0 🔴 | Aktif kullanım |
| DIN | Geometri var (2448, 86019 **✅**, 86037-2 **✅**, 86087/88/89 ❌) | P0 🔴 | CuNi için kritik |
| EEMUA | Geometri var (144 24 satır), sözlük eksik | P1 🟠 | "Tanımsız Standart" rozetinden kurtarmak için |
| **GOST** | İskelet boş | P1 🟠 | Rus armatör projesi geldiğinde |
| **JIS** | İskelet boş | P1 🟠 | Japon inşa gemi geldiğinde |
| **GB/T** | İskelet boş | P1 🟠 | Çin inşa gemi geldiğinde |

---

## 1. `malzeme_kataloglari` — Master Spec Tablosu

**Amaç:** Her malzeme spec + grade'i tek satır. Tüm geometri tabloları çapraz uyumla buraya bağlanır.

**Mevcut: 20 satır.**

**İçerik durumu (17 May 2026 — gerçek DB sayım):**

| Malzeme Grubu | Mevcut | Tipik İçerik | Öncelik |
|---|---:|---|---|
| Paslanmaz | **9** | ASTM A312 TP304L/TP316L, A182 F316L, A790 (kısmi) | P0 🔴 |
| CuNi | **6** | ASTM B466 C70600 (90/10), B466 C71500 (70/30), DIN 86019 grade'leri | P0 🔴 |
| Karbon | **5** | ASTM A106-B, A53-B, A234-WPB, A105 | P0 🔴 |
| Duplex | 0 | ASTM A790 S31803 (eklenecek) | P2 🟡 |
| Alüminyum | 0 | 5083, 6061 (eklenecek) | P2 🟡 |
| Alaşımlı | 0 | ASTM A335 P11/P22 (eklenecek) | P1 🟠 |
| Nikel | 0 | Inconel/Hastelloy | P3 ⚪ |

**Not:** v3'te tahmin edilen Duplex/Alüminyum/Alaşımlı 1'er satır, gerçekte 0. v3 tahminleri optimistikti.

**Eklenecek (P0 + P1):**
- Karbon: A350 LF2 (düşük sıcaklık) — gemi soğuk hatları için
- Paslanmaz: A312 TP321/TP347 (HT paslanmaz)
- CuNi: EEMUA 144/146 grade'leri (İngiliz CuNi)
- Alaşımlı: A335 P11, P22, P91 — HT buhar/yağ hatları
- Duplex: A790 S32750 (Super Duplex)

**Veri kaynağı:** Üretici katalogları + Wermac + Ferrobend (Octal, Sandvik, Vallourec, Tubacex). 94'te kütüphane geliştirme **ayrı Claude projesine** taşındı (`AresPipe — Kütüphane Veri Kaynakları`).

---

## 2. `boru_olculer` — Boru Geometrisi

**Mevcut: 495 satır.** (450 → 495, +44 DIN-86019 CuNi 94'te + 1 historic kayıt)

### ASME B36.10M (Karbon/Alaşımlı)
| Schedule | Mevcut | Öncelik |
|---|---:|---|
| Sch 40 / STD | ✅ | P0 🔴 |
| Sch 80 / XS | ✅ | P0 🔴 |
| Sch 10 | ✅ | P1 🟠 |
| Sch 160, XXS | ⚠ Eksik | P1 🟠 |
| Sch 5, 20, 30, 60, 100, 120, 140 | ⚠ Kısmi | P2 🟡 |

### ASME B36.19M (Paslanmaz)
Sch 5S/10S/40S/80S × DN aralığı → ✅ Mevcut.

### EN 10216 (Karbon + Paslanmaz dikişsiz)
✅ Mevcut, 42'de eklendi.

### DIN 2448
✅ Mevcut, 42'de eklendi.

### DIN 86019 (Gemi CuNi — KRİTİK P0)
✅ **94'te eklendi (Migration 076).** 44 satır = 22 Standard wall + 17 Special wall + 5 Seamwelded.
- Kaynak: KME OSNA-10/30 Shipbuilding PDF
- Fizik doğrulama: 44/44 satır 8.7-9.1 g/cm³ yoğunluk bandında (ortalama 8.919)
- Üretim Python script ile (`gen_migration_076.py` + `validate_kme.py`)

### EEMUA-144 (İngiliz CuNi)
⚠ **24 satır mevcut, sözlük girişi yok.** UI'da "Tanımsız Standart" rozeti görünüyor. P1 — sözlük girişi eklenmeli (ayrı Migration).
- Hedef: ~30 satır (DN15-DN350 ana boyutlar)
- TODO: `boru_standart_sozluk`'a EEMUA-144 girişi (`malzeme_grubu_default='cunife'`)

### GOST 8732 / 8734 (Rus boru)
❌ İskelet boş. Rus armatör projesi geldiğinde Migration ile satır eklenir.

### JIS G3454 (Japon boru)
❌ İskelet boş. Japon inşa gemi geldiğinde.

### GB/T 8163 (Çin boru)
❌ İskelet boş. Çin inşa gemi geldiğinde.

**Sonraki adım (95+):** EEMUA-144 sözlük girişi (kısa iş, ayrı Migration) + GOST/JIS/GB/T iskelet seed (DN50-200 P0 boyutları). Karbon Sch 160/XXS eksiği.

---

## 3. `fitting_olculer` — Fitting Geometrisi

**Mevcut: 569 satır** (sadece ASME B16.9 ve B16.11). 94'te değişmedi.

### 23 Fitting Tipinin Mevcut Durumu

| Tip | Mevcut | Öncelik | Not |
|---|:---:|---|---|
| 90° LR (`90_LR`) | ✅ | P0 🔴 | En yaygın |
| 90° SR (`90_SR`) | ⚠ | P1 🟠 | B16.28, az |
| 45° LR (`45_LR`) | ✅ | P0 🔴 | |
| 90° 3D (`90_3D`) | ✅ | P2 🟡 | 3D radius, akış kritik |
| 180° LR (`180_LR`) | ❌ | P2 🟡 | |
| 180° SR (`180_SR`) | ❌ | P3 ⚪ | |
| Tee eşit (`tee_eq`) | ✅ | P0 🔴 | |
| Tee redüksiyon (`tee_red`) | ⚠ | P1 🟠 | Kombinasyon çok |
| Cross eşit (`cross_eq`) | ❌ | P2 🟡 | |
| Cross redüksiyon (`cross_red`) | ❌ | P3 ⚪ | |
| Redüksiyon konsantrik (`red_conc`) | ✅ | P0 🔴 | |
| Redüksiyon eksantrik (`red_ecc`) | ✅ | P1 🟠 | |
| Cap (`cap`) | ✅ | P1 🟠 | |
| Bilezik uzun (`stub_long`) | ⚠ | P2 🟡 | LJ flanş ile |
| Bilezik kısa (`stub_short`) | ⚠ | P2 🟡 | LJ flanş ile |
| Manşon kaynaklı (`manson_butt`) | ❌ | P1 🟠 | |
| Manşon soketli (`manson_sw`) | ✅ | P1 🟠 | B16.11 |
| Manşon dişli (`manson_th`) | ⚠ | P3 ⚪ | |
| Nipel (`nipel`) | ❌ | P1 🟠 | |
| Half Coupling (`half_coupling`) | ❌ | P2 🟡 | |
| Weldolet (`weldolet`) | ❌ | P2 🟡 | |
| Sockolet (`sockolet`) | ❌ | P2 🟡 | |
| Thredolet (`thredolet`) | ❌ | P3 ⚪ | |

**Standart bazında:**
- ASME B16.9 (buttweld) → ✅ 464 satır
- ASME B16.11 (forged socket/threaded) → ✅ 105 satır
- ASME B16.28 (short radius) → ❌ 0 satır, P1
- EN 10253 → ❌ 0 satır, P1
- DIN 86089 (gemi CuNi) → ❌ 0 satır, **P0** — kütüphane projesinden Migration 078 ile gelecek
- GOST 17375 → ❌ İskelet boş
- JIS B2311/B2312 → ❌ İskelet boş
- GB/T 12459 → ❌ İskelet boş

**Sonraki adım (95+):** DIN 86089 CuNi fitting (~320 satır, P0) — **yeni kütüphane projesinden JSON gelecek**. + EN 10253 + B16.28 + eksik fitting tipleri.

---

## 4. `flansh_olculer` — Flanş Geometrisi

**Mevcut: 356 satır.** (308 → 356, +48 CuNi 94'te = 29 LJ + 19 Composite BL)

### 11 Flanş Tipinin Mevcut Durumu

| Tip | B16.5 Class 150 | Class 300 | Class 600+ | EN 1092-1 | CuNi (DIN/EN-1092-3) | Öncelik |
|---|:---:|:---:|:---:|:---:|:---:|---|
| WN | ✅ | ✅ | ⚠ Eksik | ✅ | — | P0 🔴 |
| SO | ⚠ | ⚠ | ❌ | ⚠ | — | P0 🔴 |
| BL | ⚠ | ⚠ | ❌ | ⚠ | ✅ **94: 19 satır** | P0 🔴 |
| SW | ❌ | ❌ | ❌ | ❌ | — | P2 🟡 |
| **LJ** | ❌ | ❌ | ❌ | ❌ | ✅ **94: 29 satır** | P0 🔴 (CuNi) / P2 🟡 (karbon) |
| TH | ❌ | ❌ | — | — | — | P3 ⚪ |
| RTJ | ❌ | ❌ | ❌ | ❌ | — | P2 🟡 |
| Reducing | ❌ | ❌ | ❌ | ❌ | — | P3 ⚪ |
| Spectacle | ❌ | ❌ | ❌ | ❌ | — | P3 ⚪ |
| Orifice | ❌ | ❌ | ❌ | ❌ | — | P3 ⚪ |
| DSAF | ❌ | ❌ | ❌ | — | — | P2 🟡 |

**DSAF özel notu:** Şema uyarlaması gerekiyor (çift bolt pattern). İlk kayıt geldiğinde Migration ile çözülür — JSONB ile esnek alan eklenmesi düşünülüyor. Sahada **"Dublin flanş"** olarak geçer.

**Standart bazında:**
- ASME B16.5 → ✅ 216 satır (WN dolu, SO/BL kısmen)
- EN 1092-1 → ✅ 92 satır (PN10/16 dolu, PN25+ eksik)
- **DIN 86037-2 (CuNi LJ)** → ✅ **94: 29 satır** (DN20-DN1200, PN10/16 compatible)
- **EN 1092-3 Type 05-C (CuNi Composite Blind)** → ✅ **94: 19 satır** (DN10-500, PN10/16)
- ASME B16.47 (büyük çap NPS 26-60) → ❌ 0 satır, P3
- DIN 86087/88 (gemi CuNi WN + SO) → ❌ 0 satır, **P0** — kütüphane projesinden gelecek
- GOST 33259 → ❌ İskelet boş
- JIS B2220 → ❌ İskelet boş
- GB/T 9112 → ❌ İskelet boş

### KARAR-94.3 — Vocabulary: DIN 86037-2 = LJ (Lap-Joint), WN değil

**Bağlam:** KME OSNA-10/30 PDF DIN 86037-2 flanşı "Welding Neck" olarak adlandırıyor. Ancak fiziksel tasarım B16.5 WN'den farklı:

| Özellik | B16.5 WN (integral) | DIN 86037-2 (composite) |
|---|---|---|
| Bolt | Kendi flanş gövdesinde | Yok — outer halkasında (S235JR) |
| Disc | Kalın (≥15mm) | İnce (5-14mm) |
| Hub | Kısa, integral | Uzun (40-60mm), stub end |
| Eşleşme | Standalone | **"Compatible with Outer Flanges PN 10, 16"** — composite design |

**Sonuç:** Fiziksel tasarım = lap-joint stub end. ASME B16.5 vocabulary'sinde tam karşılığı **LJ**. PDF üreticinin terminolojisi (WN) yanıltıcı — vocabulary tutarlılığı için 'LJ' kullanıldı.

**MK-94.4 disiplini:** Vocabulary kararı PDF üreticinin terminolojisinden değil, **teknik fiziksel tasarımdan** alınır.

### MK-94.3 — Schema Esnetme: bolt_circle_mm + bolt_count NULL

Migration 077'de eklenen schema ALTER:
```sql
ALTER TABLE flansh_olculer ALTER COLUMN bolt_circle_mm DROP NOT NULL;
ALTER TABLE flansh_olculer ALTER COLUMN bolt_count DROP NOT NULL;
```

**Sebep:** Schema ilk yazılırken ASME B16.5 integral varsayımıyla (her flanş kendi bolt'lu) NOT NULL yazılmıştı. Lap-joint ve composite tasarımlar için bu yanlış — bolt geometrisi outer halkasında. Constraint açıldı, mevcut B16.5 + EN-1092-1 kayıtları zaten dolu.

**Sonraki adım (95+):** DIN 86087/88 (CuNi WN + SO) — **yeni kütüphane projesinden gelecek**. + B16.5 SO/BL tamamla (Class 150/300) + EN 1092-1 PN25/40 doldur.

---

## 5. Çapraz Uyum Tabloları — ✅ Hazır, organik dolacak

### 5.1. `fitting_malzeme_uyum` ✅ (Migration 066, 93. oturum)

**Mevcut: 0 satır, FK constraint doğru.**

**93'te FK BUG fix yapıldı:**
- Eski: `malzeme_id → malzeme_tanimlari` (yanlış)
- Yeni: `malzeme_id → malzeme_kataloglari` (doğru, geometri tabloları gibi)
- `PRIMARY KEY (fitting_id, malzeme_id)` eklendi

### 5.2. `boru_malzeme_uyum` ✅ (Migration 067)

```sql
CREATE TABLE boru_malzeme_uyum (
  boru_id        uuid NOT NULL REFERENCES boru_olculer(id) ON DELETE CASCADE,
  malzeme_id     uuid NOT NULL REFERENCES malzeme_kataloglari(id) ON DELETE CASCADE,
  uretim_yontemi text,                    -- seamless / welded
  yaygin_mi      boolean DEFAULT true,
  notlar         text,
  PRIMARY KEY (boru_id, malzeme_id)
);
```

**Mevcut: 0 satır.**

### 5.3. `flansh_malzeme_uyum` ✅ (Migration 067)

```sql
CREATE TABLE flansh_malzeme_uyum (
  flansh_id      uuid NOT NULL REFERENCES flansh_olculer(id) ON DELETE CASCADE,
  malzeme_id     uuid NOT NULL REFERENCES malzeme_kataloglari(id) ON DELETE CASCADE,
  uretim_yontemi text,                    -- forged / cast
  yaygin_mi      boolean DEFAULT true,
  notlar         text,
  PRIMARY KEY (flansh_id, malzeme_id)
);
```

**Mevcut: 0 satır.**

### Doldurma Stratejisi

3 çapraz uyum tablosu **manuel doldurulmaz**. Akış:

1. Spool PDF parse → AI bir parça çıkarır (geometri + malzeme)
2. Sistem geometri tablosunda (`fitting_olculer`) eşleşme arar
3. Aynı geometriye ait `fitting_malzeme_uyum` satırı varsa → tanındı
4. Yoksa "öneri" akışına düşer (`tanimsiz_kayitlar`)
5. Süper Admin onayıyla yeni satır eklenir

**Hedef satır sayısı yok.** Kullanım organik. 50 spool sonra ~500 satır beklenir, ama hedef değil.

---

## 6. Özel Üretim Ölçüler (v2'den Değişti — 91)

**v2'de:** `ozel_parcalar` ayrı tablosu vardı, ~200-500 satır beklenir deniyordu.

**v3'te:** Ayrı tablo yok. Özel üretim ölçüler `boru/fitting/flansh_olculer` içinde `sistem_preset = false` + `tenant_id` ile yaşar.

**Aktif durumu:** Şu an 0 tenant özel kayıt. Pilot tersane geldiğinde sahadan eklenecek.

**Detay:** `KUTUPHANE-KAPSAM.md` Bölüm 6'da tam açıklama.

---

## 7. Spec Sistemi (`tenant_spec_seti` + `spec_kural`)

AVEVA-vari spec mantığı — KUTUPHANE-KAPSAM.md Bölüm 11.6'da detay.

**Mevcut:**
- `tenant_spec_seti`: ✅ tablo mevcut, 0 satır
- `spec_kural`: ✅ tablo mevcut, 0 satır (FK → `malzeme_kataloglari` zaten doğru kurulu)

**Tetik:** İkinci tersane geldiğinde — şu an pilot tek tersane.

**Sonraki adım (96+):** İkinci tersane sözleşmesi imzalanınca açılır. Şu an tablolar boş duruyor, hazır beklemede.

---

## 8. Kütüphane Dışı Tablolar (91'de Netleşti)

Aşağıdaki tablolar **kütüphane değil**, kendi amaçları var. Bu belge yönetmez. (KUTUPHANE-KAPSAM.md Bölüm 8'de detay.)

| Tablo | Satır | Amaç | Önemli Not |
|---|---:|---|---|
| `endustri_malzemeler` | 36 | AI parser EN/DIN sözlüğü | 91'de `arsiv`'den `public`'e geri taşındı |
| `endustri_form_astm` | 78 | AI parser ASTM sözlüğü | 91'de `arsiv`'den `public`'e geri taşındı |
| `malzeme_tanimlari` | 13 | Runtime spool/pipeline bağlantısı | Aktif sistem buna bağımlı, dokunma |
| `malzeme_standart_ipucu` | — | AI parser çoklu standart tanıma | **91'de DROP edildi** (18 satır, hiç kullanılmıyordu) |

**Kural:** Bu tabloların yönetimi ayrı, "lazımsa kalsın" prensibi (Cihat, 91).

---

## 9. Veri Kaynakları

### Aktif kullanılan ✅
- **Wermac** (wermac.org) — ASME B16.5 inç tablolar
- **Ferrobend** (ferrobend.com) — Çapraz teyit
- **OSE-piping-workbench** (github.com/rkrenzler) — Fitting/pipe CSV (LGPL kod, sayısal veri telif dışı)
- **KME OSNA-10/30 Shipbuilding PDF** ✅ — 94'te kullanıldı (DIN 86019 boru + DIN 86037-2 LJ + EN 1092-3 Composite Blind). CuNi marine üretici otoritesi.

### Potansiyel — Cihat eklerse / kütüphane projesi indirir 📥
- 📥 KME OSNA katalogları (devam) — DIN 86089 fitting için yeni revizyon araması
- 📥 Alaskan Copper / CDA — CuNi tubing (B466/B467)
- 📥 Tenaris Dalmine — Seamless karbon boru (A53/A106/API 5L)
- 📥 Sandvik — SAF 2205/2507 Duplex
- 📥 Vallourec / Tubacex / Bonney Forge — henüz araştırılmadı
- 📥 DIN 86087/88/89 resmi dokümanları — gemi CuNi flanş + fitting için
- 📥 EEMUA 144-146 — İngiliz CuNi standardı, sözlük girişi için gerekli
- 📥 GOST/JIS/GB/T üretici kataloğu — armatör projesi geldiğinde
- 📥 Tersane Excel/PDF — yıllarca biriktirilmiş tablolar (en kaliteli kaynak)

### Sahadan organik 🌱
- Pilot ilk spool girdiğinde → tanınmayan parçalar `tanimsiz_kayitlar`'a düşer
- Süper Admin onayıyla `sistem_preset=false` kütüphaneye eklenir
- Çok yaygınlaşırsa `sistem_preset=true`'ya promote

### İki Proje Koordinasyonu (94'te başladı)

**Ana proje (bu repo):** Migration SQL yazımı + DB uygulama + UI.

**Kütüphane projesi (`AresPipe — Kütüphane Veri Kaynakları`):** PDF'ten JSON üretimi. DB'ye dokunmaz. JSON ana projeye getirilir, Migration'a çevrilir.

**Migration numara çakışma önleme:** Her yeni migration öncesi `ls migrations/ | sort | tail -3` ile en son numarayı kontrol et, +1 al.

---

## 10. Sonraki Oturumlar İçin Sıra

| Oturum | İş | Durum |
|---|---|---|
| **91** | Belge revize (KAPSAM + TAKIP + MIGRATION-YOL-HARITASI) + küçük borçlar | ✅ Tamamlandı |
| **92** | Cakisma yonetimi + oneri aksiyon akisi + kutuphane fix'leri | ✅ Tamamlandı |
| **93** | Migration 066 (fitting_malzeme_uyum FK fix) + 067 (boru/flansh_malzeme_uyum CREATE) + UI fitting/flansh KONFIG + bug fix'ler | ✅ Tamamlandı |
| **94** | **CuNi marine yüklemesi** — DIN 86019 boru (Migration 076, 44) + DIN 86037-2 LJ + EN 1092-3 Composite BL (Migration 077, 48) + cuni→cunife UI fix + bolt NULL schema ALTER | ✅ Tamamlandı |
| **95** (mevcut) | KUTUPHANE-YUKLEME-TAKIP güncelle + `olusturma_at` rename (93'ten devralındı) + kütüphane projesinden gelen JSON varsa işle | Açık |
| **96+** | DIN 86089 CuNi fitting (Migration 078, ~320 satır — yeni projeden) + EEMUA-144 sözlük girişi + DIN 86087/88 (CuNi WN + SO) | Sırada |
| **97+** | ASTM A312 paslanmaz boru + A106/A53 karbon boru (üretici PDF üzerinden) | Beklemede |
| **98+** | Spec sistemi (`tenant_spec_seti`) — ikinci tersane geldiğinde | Beklemede |

---

## 11. Güncelleme Protokolü

**Her oturum kapanışında Claude:**
1. Eklenen kayıt sayısı → ilgili tablonun "Mevcut" kolonu
2. Tamamlanan satırlar ❌ → ✅
3. Kısmi olanlar ⚠ KISMEN
4. Yeni veri kaynağı eklendi mi → Bölüm 9'a 📥 olarak (kullanılırsa ✅'e taşı)
5. Önemli karar alındı mı → ilgili bölüme not (KARAR-XX.Y formatında)
6. Yeni MK disiplini → Bölüm 13'e

**Her 5 oturumda:**
- Öncelik P kademeleri tersane talebine göre revize edilir
- Yeni tersane spec'i geldiyse `tenant_spec_seti` aktif edilir
- KUTUPHANE-KAPSAM.md ile tutarlılık kontrol edilir

---

## 12. Açık Notlar

- **Geometri ≠ malzeme.** Çapraz uyum tablosu zorunlu, geometri tablosunda malzeme tutmak yetersiz (43 dersi).
- ✅ **`fitting_malzeme_uyum` FK bug — 93'te çözüldü** (Migration 066). Mevcut 0 satır olduğu için veri kaybı olmadı.
- ✅ **`boru_malzeme_uyum` + `flansh_malzeme_uyum` tabloları — 93'te oluşturuldu** (Migration 067).
- **GOST/JIS/GB/T iskelet bekliyor.** Karşılaşıldığında değil, ön taraftan seed edilebilir. İskelet hazır olunca PDF parse "GOST 8732 tanındı" diyebilir.
- **`endustri_*` arşivlemesi olayı (91).** Tablo silinmeden / arşivlenmeden önce kod araması zorunlu. KUTUPHANE-KAPSAM.md Bölüm 1'de yazılı kural.
- **Hedef yüzdesi yok.** v2'de "44 sonu %5-10, 50 sonu %25-40" yazıyordu, v3'te kaldırıldı. Organik büyüme prensibine ters.
- **EEMUA-144 "Tanımsız Standart" rozeti.** UI `boru_standart_sozluk` tablosunu kontrol ediyor, EEMUA-144 sözlükte yok. 24 satır yetim duruyor. Ayrı Migration ile sözlük girişi eklenmeli (`malzeme_grubu_default='cunife'`, `aktif=true`, `veri_var=true`).
- **DIN 86037-2 vocabulary = LJ, WN değil.** PDF üreticinin terminolojisi yanıltıcı, fiziksel tasarım lap-joint (KARAR-94.3 + MK-94.4).
- **`malzeme_kataloglari` Duplex/Al/Alaşımlı 0 satır.** v3 tahmini 1'er satır yazıyordu, gerçekte boş. P1/P2 önceliğine göre eklenecek.

---

## 13. Mimari Kararlar (MK) — Disiplin Defteri

**94'te eklenenler:**

- **MK-94.1:** Yeni standart eklerken **sözlük tablosunun kolon tiplerini önceden çek** (`information_schema.columns`). JSONB vs TEXT[] tuzağı. Migration 076 ilk run hatası bu yüzden çıktı (`pdf_anahtar_kelime` TEXT[] sandı JSONB değildi).

- **MK-94.2:** Yeni veri yüklemeden önce **target tablonun NOT NULL ve kolon listesini doğrula**. `boru_olculer` ile `flansh_olculer` şeması farklı (`kaynak` kolonu boru'da var, flansh'ta yok). Migration 077 ilk run bu yüzden patladı.

- **MK-94.3:** Composite/lap-joint design flanşlar için DB schema bolt kolonları NULL kabul eder. ASME B16.5 integral varsayımı evrensel değil.

- **MK-94.4:** Vocabulary kararı PDF üreticinin terminolojisinden değil, **teknik fiziksel tasarımdan** alınır.

- **MK-94.5:** Programatik sanity check yeterli, manuel 5 örnek karşılaştırma gerekmedi. Geometric kurallar (bore < OD < hub < flansh, fizik yoğunluğu) tek seferde tüm satırlara uygulanır.

**Önceki oturumlardan (kütüphane ile ilgili kritik olanlar):**

- **MK-43:** PDF context stream halüsinasyona yol açar → `pdftotext -layout` disk extraction zorunlu.
- **MK-43:** Fizik validasyon (π × (OD-et) × et × 7.85/1000 = kg/m ±2%) DB insert'ten önce.
- **MK-51.1:** `arespipe_kopyala` MD5 doğrulama ile, tahmin yok.
- **MK-50.3:** Yeni format/standart için 5 örnek doğrulama → 94'te programatik sanity check ile değiştirildi.

---

## 14. Süreç Disiplinleri

- **Supabase SQL Editor BEGIN/COMMIT desteklemez** → panoya alırken filtrele:
  ```bash
  grep -v -E "^(BEGIN|COMMIT);$" file.sql | pbcopy
  ```
  Dosyada kalır (psql/CI uyumu).
- **Doğrulama her zaman ayrı SELECT** ile, Editor "Success" göstermese bile commit olmuş olabilir.
- **Aynı PDF'ten çoklu standart yüklerken** tek migration'da BEGIN/COMMIT kullan, hata olunca tüm satırlar rollback.
- **GitHub web UI upload yok**, sadece terminal git akışı (51. oturumda "Add files via upload" karışıklığı yaşandı).
- **Migration numara çakışma önleme:** `ls migrations/ | sort | tail -3` ile en son numara, +1.

---

> Bu dosya canlı tutulur. Her oturum kapanışında Claude günceller, Cihat doğrular.
> v4 — 95. oturum — 17 Mayıs 2026 — 92-94 yüklemeleri yansıtıldı, çapraz uyum tabloları kapatıldı, LJ vocabulary kararı eklendi.
