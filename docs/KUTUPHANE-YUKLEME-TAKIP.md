# Kütüphane Yükleme Takip — v3 (12 Mayıs 2026, 76. Oturum Sonu)

> Önceki sürüm (v2, 43. oturum sonu) gerçek DB'den 1100+ satır geri kalmıştı.
> v3 canlı DB count ile senkronize. MK-76.5 disiplini: her oturum sonu yenilenir.

---

## Üst Düzey — Canlı Durum

| Modül | Canlı satır | Hedef | İlerleme |
|---|---:|---:|---:|
| `boru_olculer` | **450** | ~600 | %75 |
| `flansh_olculer` | **276** | ~800 | %35 |
| `fitting_olculer` | **424** | ~2,500 | %17 |
| `fitting_malzeme_uyum` | 1 | ~8,000 | %0 (script üretimi bekliyor) |
| `malzeme_kataloglari` | ? (77'de teyit) | ~120 | ? |
| `tenant_spec_seti` | 0 | 10-20 | %0 |
| `spec_kural` | 0 | 500-1,000 | %0 |
| `ozel_parcalar` | 0 | 200-500 | %0 |
| **TOPLAM** | **~1,151** | **~12,400** | **~%9.3** |

> v2 (43): 80 / 12,400 = %0.6 → v3 (76): 1,151 / 12,400 = ~%9.3
> Belge ile gerçeklik arasında **5 ay sapma** vardı. v3 ile senkron.

---

## Modül 1 — `boru_olculer` (450 / ~600 satır, %75) 🟢

Boru ölçü standartları. Karbon + paslanmaz + alüminyum + CuNi.

### Standart kırılımı (canlı)

| Standart | Satır | Durum | Edisyon |
|---|---:|---|---|
| ASME-B36.10M (karbon dikişsiz) | 238 | 🟢 dolu | (kontrol et) |
| **ASME-B36.19M (paslanmaz)** | **80** | 🟢 76 sonu tam | 2018 |
| ASTM-B241 (alüminyum) | 50 | 🟢 dolu | (kontrol et) |
| DIN-2448 (eski Alman karbon) | 29 | 🟢 yüklü | eski standart |
| EN-10216-1 (EN karbon dikişsiz) | 29 | 🟢 yüklü | (kontrol et) |
| EEMUA-144 (CuNi gemi) | 24 | 🟢 yüklü | (kontrol et) |
| **TOPLAM** | **450** | | |

### B36.19M Detay (76'da doğrulandı)

- DN 15–600 arası 5S/10S/40S/80S kapsamı
- 70 mevcut satır + 76'da +10 satır (DN 350-600 40S+80S) = 80
- Eksik (P2): DN 6/8/10 (NPS 1/8, 1/4, 3/8), DN 550/750 büyük çap 40S/80S

### Sonraki adımlar

- **77 P1:** `B36.10M` karbon doğrulama (Wermac ile audit, 238 satır)
- **77 P2:** B36.19M DN 6/8/10 küçük boyut ekleme (~12 satır)
- **77 P2:** DN 550/750 5S/10S ekleme (4 satır)

---

## Modül 2 — `flansh_olculer` (276 / ~800 satır, %35) 🟡

Flanş ölçü standartları. ASME B16.5 + EN 1092-1.

### Standart kırılımı (canlı)

| Standart | Satır | Durum | Edisyon |
|---|---:|---|---|
| B16.5 (ASME) | 216 | 🟢 dolu | (kontrol et) |
| **EN-1092-1** | **60** | 🟢 76 sonu PN 16 tam | 2007+A1:2013 |
| **TOPLAM** | **276** | | |

### EN-1092-1 Detay (76'da T05 eklendi)

| PN | T01 (Plate) | T05 (Blind) | T11 (WN) | T12 (Hub SO) | Toplam |
|---|:---:|:---:|:---:|:---:|---:|
| **PN 16** | 15 ✅ | **15 ✅ (76)** | 15 ✅ | 15 ✅ | **60** |
| PN 10 | – | – | – | – | 0 |
| PN 25 | – | – | – | – | 0 |
| PN 40 | – | – | – | – | 0 |

DN aralığı: PN 16'da 10–300, 15 boyut. Yüzey tipi: hepsinde RF (DB tutarlılığı).

### B16.5 Detay (kontrol edilmedi)

216 satır — class × tip × DN matrisi. 77'de detay kırılım:
```sql
SELECT basinc_sinifi, flansh_tipi, COUNT(*) FROM flansh_olculer
WHERE geometri_std = 'B16.5' GROUP BY basinc_sinifi, flansh_tipi
ORDER BY basinc_sinifi, flansh_tipi;
```

### Sonraki adımlar

- **77 P1:** B16.5 detay kırılımı (class × tip × DN matrisi netleşsin)
- **77 P1:** EN 1092-1 PN 10 paketi (~60 satır, PN 16 pattern'i birebir tekrar)
- **78 P1:** EN 1092-1 PN 25 + PN 40 paketleri (~120 satır)
- **78 P2:** EN 1092-1 Type 02/04/13/21/35 (özel tipler)

---

## Modül 3 — `fitting_olculer` (424 / ~2,500 satır, %17) 🟡

Fitting ölçü standartları. ASME B16.9 + B16.11 + EN 10253 vb.

### Standart kırılımı (TBD 77 — sorgu sonucu bekliyor)

```sql
-- 77 açılışında çalıştır, çıktıyı bu tabloya yapıştır:
SELECT geometri_std, parca_tipi, COUNT(*) AS satir
FROM fitting_olculer
GROUP BY geometri_std, parca_tipi
ORDER BY geometri_std, parca_tipi;
```

### Beklenen Parça Tipi Matrisi (ASME B16.9)

| Parça | NPS aralığı | Beklenen satır |
|---|---|---:|
| 90LR Elbow (Long Radius) | 1/2–24 | ~25 |
| 45LR Elbow | 1/2–24 | ~25 |
| 90SR Elbow (Short Radius) | 1–24 | ~22 |
| 180LR Return | 1/2–24 | ~25 |
| 180SR Return | 1–24 | ~22 |
| Equal Tee | 1/2–24 | ~25 |
| Reducing Tee | matrix | ~100 |
| Cap | 1/2–24 | ~25 |
| Concentric Reducer | matrix | ~200 |
| Eccentric Reducer | matrix | ~200 |
| **Stub End (Type A/B)** | 1/2–24 | ~50 |
| **B16.9 TOPLAM** | | ~720 |

### Sonraki adımlar

- **77 P0:** Kırılım sorgusunu çalıştır, gerçek durumu bu belgeye yaz
- **77+:** Eksik tespitine göre B16.9 Stub End / Reducer / Tee ekleme
- **78+:** B16.11 (forged) + EN 10253 (EN fittings)

---

## Modül 4 — `fitting_malzeme_uyum` (1 / ~8,000 satır, %0) 🔴

Fitting × malzeme çapraz uyum tablosu. Hangi B16.9 90LR hangi malzemede üretilir?

**Strateji:** Script üretimi (manuel imkânsız). Geometri tabloları (`fitting_olculer`, `malzeme_kataloglari`) belli kapsamda dolduktan sonra otomatik uyum matrisi yazılır.

### Tetikleyici koşul

- `fitting_olculer` ≥ 1,500 satır
- `malzeme_kataloglari` ≥ 50 satır

Şu an: 424 / 1,500 (%28) — henüz tetik değil.

### Sonraki adımlar

- **78+ P1:** Geometri + malzeme tabloları belli kapsamda dolunca script taslağı
- **79+ P0:** Tam çapraz tablo (otomatik upsert)

---

## Modül 5 — `malzeme_kataloglari` (? / ~120 satır, ?) 🟡

Malzeme kataloğu. A105, F316L, A106-B, A312-TP316L, CuNi vb.

### Kırılım (TBD 77)

```sql
SELECT malzeme_grubu, COUNT(*) AS satir
FROM malzeme_kataloglari
GROUP BY malzeme_grubu
ORDER BY satir DESC;
```

### Beklenen Gruplar

| Grup | Beklenen | Örnek |
|---|---:|---|
| Karbon çelik forge | ~10 | A105, A350-LF2 |
| Karbon çelik plate | ~5 | A516-70 |
| Karbon dikişsiz boru | ~6 | A53-B, A106-B/C, API 5L |
| Karbon kaynak boru | ~4 | A53-A/B ERW |
| Paslanmaz forge | ~12 | F304, F304L, F316, F316L, F321, F347 |
| Paslanmaz boru | ~10 | A312-TP304/304L/316/316L/321/347 |
| Düşük sıcaklık | ~5 | A350-LF2, A333-Gr6 |
| Bakır-Nikel (gemi) | ~8 | B466-CuNi 90/10, 70/30 |
| Alüminyum | ~6 | B221, B210, B241 |
| Düktil dökme | ~4 | A536 |
| **TOPLAM** | **~70** | |

Hedef ~120 satır = 70 standart + 50 özel/eski.

### Sonraki adımlar

- **77 P1:** Canlı kırılımı al, gerçek durumu yaz
- **77+ P1:** Eksik gruplar tespit edip ekleme
- **78+ P0:** Her gruba detay (ASTM/EN/ISO standart eşleştirmeleri, kimyasal kompozisyon)

---

## Modül 6 — `ozel_parcalar` (0 / 200-500 satır, %0) 🔴

Standart dışı özel parçalar. Tersane bazlı, pilot proje sırasında dolacak.

### Tetikleyici koşul

İlk gerçek müşteri spool projesi başlayınca. O zamana kadar şema kurulumu yeterli.

### Sonraki adımlar

- **77+ P2:** Şema kontrolü (tablo var mı, kolonlar tamam mı)
- **78+ P0:** Pilot tersane geldiğinde içerik kurulumu

---

## Modül 7 — `tenant_spec_seti` (0 / 10-20 satır, %0) 🔴

Tersane-özel spec setleri. İkinci tersane geldiğinde dolacak. Şu an sistem preset'leri yeterli.

---

## Modül 8 — `spec_kural` (0 / 500-1,000 satır, %0) 🔴

Spec kuralları (allowed fitting × material kombinasyonları, max DN, basınç sınıfı kısıtları). Üst seviye — fitting × malzeme uyum tablosu doluktan sonra kural motoru.

### Sonraki adımlar

- **79+ P1:** İlk basit kural seti (ASME B31.3 process piping default)
- **80+ P0:** Tersane-özel kural setleri

---

## 76. Oturumda Eklenen (+25 satır)

| Migration | Tablo | Satır | Açıklama |
|---|---|---:|---|
| 040 | flansh_olculer | +15 | EN 1092-1 PN 16 Type 05 Blind |
| 041 | boru_olculer | +10 | B36.19M DN 350-600 SCH 40S+80S |
| **TOPLAM** | | **+25** | |

---

## 77'de İlk İki Sorgu — Bu Belgeyi Tamamla

Bu belgenin **TBD** noktalarını doldurmak için:

```sql
-- 1. fitting_olculer kırılımı (Modül 3)
SELECT geometri_std, parca_tipi, COUNT(*) AS satir
FROM fitting_olculer
GROUP BY geometri_std, parca_tipi
ORDER BY geometri_std, parca_tipi;

-- 2. malzeme_kataloglari kırılımı (Modül 5)
SELECT malzeme_grubu, COUNT(*) AS satir
FROM malzeme_kataloglari
GROUP BY malzeme_grubu
ORDER BY satir DESC;

-- 3. B16.5 detay kırılımı (Modül 2)
SELECT basinc_sinifi, flansh_tipi, COUNT(*) AS satir
FROM flansh_olculer
WHERE geometri_std = 'B16.5'
GROUP BY basinc_sinifi, flansh_tipi
ORDER BY basinc_sinifi, flansh_tipi;
```

Çıktıları bu belgeye yapıştır → tam senkron.

---

## Senkron Bakım Disiplini (MK-76.5)

- **Her oturum sonu** bu belge canlı DB sayılarıyla güncellenir
- v2 → v3 arasında 5 ay geçti, sapma 1100+ satır. v3 → v4 arasında **max 1 oturum** olsun.
- Her migration'ın etki satırı tablonun "Bu Oturumda Eklenen" bölümüne yazılır.
- Hedef sayıları gerçeğe göre revize edilir (örn. B16.5 216 satır → hedef ~250 olabilir, ~800 değil).

---

## Toplam İlerleme Görseli

```
Modül                       Satır   Hedef   İlerleme
─────────────────────────────────────────────────────
boru_olculer                450     600     ████████████░░░  %75
fitting_olculer             424     2500    ███░░░░░░░░░░░░  %17
flansh_olculer              276     800     ██████░░░░░░░░░  %35
malzeme_kataloglari         ?       120     ?
ozel_parcalar               0       300     ░░░░░░░░░░░░░░░  %0
tenant_spec_seti            0       15      ░░░░░░░░░░░░░░░  %0
spec_kural                  0       750     ░░░░░░░░░░░░░░░  %0
fitting_malzeme_uyum        1       8000    ░░░░░░░░░░░░░░░  %0
─────────────────────────────────────────────────────
TOPLAM                      ~1,151  12,400  ██░░░░░░░░░░░░░  ~%9.3
```

---

> v3.1 güncellemesi: 77. oturum açılışındaki 3 sorgu sonuçlarıyla TBD bölümleri doldurulacak.
> v4: 77 sonunda yeni eklemeler + güncel kapsam.
