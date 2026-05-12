# AresPipe — Kütüphane Yükleme Takip

> **Amaç:** Hangi tablolar/kombinasyonlar sisteme yüklenecek, hangileri tamam, hangileri öncelikli — bir bakışta gör.
>
> **Referans:** Bu dosya `docs/KUTUPHANE-KAPSAM.md` belgesinin **canlı durumudur**. Kapsam belgesi neyi yapacağımızı söyler, bu dosya neresini yaptığımızı gösterir.
>
> **İlk yazım:** 28 Nisan 2026 — 43. oturum (v1)
> **Düzeltme:** 28 Nisan 2026 — 43. oturum (v2)
> **Senkron:** 12 Mayıs 2026 — 78. oturum (v3 — gerçek DB sorgularıyla tam yenileme, 5+ aylık birikim kapatıldı)

---

## v2 → v3 Senkron Notu (78. oturum)

v2 yazıldıktan sonra 44-77 oturumları boyunca DB doldu ama belge güncellenmedi (76, 77'de P0 listesinde olduğu halde atlandı). 78'de canlı DB sorgularıyla tam yenileme yapıldı.

**Büyük düzeltmeler:**
- `malzeme_kataloglari` 77'de B0 omurga ile yeniden kuruldu (önceki `malzeme_tanimlari` ile karıştırılmıştı, ayrı tablo olarak ayrıştı)
- `boru_olculer` 48 → **450** (44-65 oturumları arasında çoklu standart eklemeleri)
- `flansh_olculer` 20 → **308** (75-78 oturumları kütüphane mini-projesi)
- `fitting_olculer` 0 → **424** (75'te Cap, 77 hipotezi öncesi B16.9 tamamı)
- v2'deki "beklenen toplam ~12.400" tahmini gerçekçi değildi (özellikle B16.9 için 2500 yazıyordu, gerçek standart kapsamı 424). Yeni gerçekçi tahmin: ~8.000-9.000 (uzun kuyruk hep parking)

---

## Özet (12 Mayıs 2026, 78 sonu)

| Modül | Canlı (78 sonu) | Hedef (gerçekçi) | % |
|---|---:|---:|---:|
| `malzeme_kataloglari` (parça kimliği omurgası) | **10** | 60-80 | ~13% |
| `malzeme_tanimlari` (UI/IFS köprüsü, paralel tablo) | 12 | 12-20 | ~80% |
| `boru_olculer` | **450** | 280-450 | %100 (hedef aşıldı) |
| `flansh_olculer` | **308** | 800 | %38 |
| `fitting_olculer` (B16.9) | **424** | 500 | %85 |
| `fitting_olculer` (B16.11/B16.28/EN) | 0 | 500-1000 | %0 |
| `fitting_malzeme_uyum` (çapraz uyum) | 1 (test) | 5000-8000 | %0 |
| `ozel_parcalar` | 0 | 200-500 | %0 |
| `tenant_spec_seti` | 0 | 10-20 | %0 |
| `spec_kural` | 0 | 500-1000 | %0 |
| **TOPLAM (geometri tabloları)** | **1.205** | **~8.000** | **~15%** |

**Hedef trajektori (78 sonundan itibaren gerçekçi):**
- 80 sonu: %25 (malzeme_kataloglari B0-B5 + B16.11 socket başlangıcı)
- 90 sonu: %50 (fitting_olculer ikinci standartlar + flansh_olculer PN25/PN40)
- 100 sonu: %75 (çapraz uyum başlangıcı + spec set tanımları)
- 120+: %90+ — uzun kuyruk hep parking, ihtiyaca göre eklenir

---

## Öncelik Mantığı (gemi tersanesi profili — Cihat'ın işi, Yalova)

| Öncelik | Açıklama | Örnek |
|---|---|---|
| **P0** 🔴 | Her gemi spool projesinde kritik | A105 WN/SO Class 150-300, **CuNi B466/B467 deniz suyu**, B16.9 90LR + Tee + Reducer DN50-200, B36.10 Sch 40 |
| **P1** 🟠 | Sık görülen | F316L Class 150-300, A234 WPB butt-weld, B16.11 socket, A335 P11/P22 (HT hatları) |
| **P2** 🟡 | Belirli proje tiplerinde | Class 600+ HT, alaşımlı (F11/F22), Duplex (2205/2507), LJ flanş, Alüminyum (5083 deniz) |
| **P3** ⚪ | Özel proje gelirse | Nikel alaşım (Inconel/Hastelloy), Class 2500, A860 yüksek dayanım |

---

## 1. Malzeme Kataloğu — `malzeme_kataloglari`

**Amaç:** Her malzeme spec + grade'i tek satır. Boru/fitting/flansh tabloları FK ile bağlanır.

**Mevcut tablo:** 77'de B0 omurga CREATE TABLE (migration 040). Şema temiz: spec_standart + spec_grade + GENERATED spec_kodu, malzeme_grubu enum (karbon/paslanmaz/duplex/cuni/alum/nikel/titan/diger), aile enum (ASTM/ASME/EN/DIN/JIS/API/EEMUA/GOST/GB), uygunluk dört flag (boru/bw/forged/flansh), yoğunluk + mukavemet + sıcaklık aralığı, JSONB korozyon_notlari, partial unique (sistem + tenant), CHECK en_az_bir_uygun.

**Canlı (10 satır, 77'de eklendi):**

| Grup | Spec | Uygunluk | Öncelik |
|---|---|---|---|
| Karbon | ASTM A53 B | boru | P0 |
| Karbon | ASTM A106 B | boru | P0 |
| Karbon | EN 10216-1 P235GH | boru | P0 |
| Karbon | ASTM A234 WPB | bw fitting | P0 |
| Karbon | ASTM A105 | forged + flansh | P0 |
| Paslanmaz | ASTM A312 TP316L | boru | P0 |
| Paslanmaz | ASTM A403 WP316L | bw fitting | P0 |
| Paslanmaz | ASTM A182 F316L | forged + flansh | P0 |
| CuNi | ASTM B466 C70600 | boru | P0 (gemi) |
| CuNi | ASTM B466 C71500 | boru | P0 (gemi) |

**Eksik P0 (öncelikli dolum):**

- **CuNi fitting** — ASTM B467 (welding ftng), Wermac CuNi tablosu (P0, ~3 spec)
- **CuNi flansh / forged** — ASTM B151 / B564 (P0, ~2 spec)
- **Karbon A333 Grade 6** — düşük sıcaklık boru (P2 → P1, gemi ambar hatları için)
- **Karbon A420 WPL6** — düşük sıcaklık BW fitting (P2)
- **Paslanmaz A312 TP304L + TP316 + TP304** — yaygın grade'ler (P1, ~3 spec)
- **Paslanmaz A403 WP304L + WP316 + WP304** (P1, ~3 spec)
- **Paslanmaz A182 F304L + F316 + F304** (P1, ~3 spec)
- **EN paslanmaz** — EN 10216-5 X2CrNiMo17-12-2 (1.4404) — boru (P1)
- **API 5L X42-X70** — hat borusu (P2)

Hedef 80 sonu: 30-35 spec, P0 + P1 büyük ölçüde kapsanır.

---

## 2. Boru Ölçüleri — `boru_olculer` (450 satır, %100 hedef aşıldı)

| Standart | Satır | Kapsam |
|---|---:|---|
| ASME B36.10M (karbon) | 238 | Tam (NPS 1/8 — NPS 48, tüm schedule'lar) |
| ASME B36.19M (paslanmaz) | 80 | DN 6/8/10 küçük boyutlar eksik (P2) |
| ASTM B241 (alüminyum) | 50 | Yeterli (P2, gemi nadir) |
| DIN 2448 (eski Alman karbon) | 29 | Sınırlı, geriye uyum için |
| EN 10216-1 (EN karbon dikişsiz) | 29 | DN 10-200 dolu, büyük DN eksik (P2) |
| EEMUA-144 (CuNi gemi) | 24 | Yeterli (P0 ana gemi kapsamı) |

**Hedef:** Bu modül kapatıldı. Sonraki iş B36.19M küçük boyutlar (76'dan açık, ~30 dk, P2).

---

## 3. Flansh Ölçüleri — `flansh_olculer` (308 satır, %38)

| Standart | Alt-grup | Satır | Statü |
|---|---|---:|---|
| ASME B16.5 | Class 150-2500 × WN/SO/BL/LJ/PL/TH | 216 | 75 öncesi dolduruldu (büyük resim) |
| EN 1092-1 | PN 16 × T01+T05+T11+T12 × 15 DN | 60 | ✅ 76 sonu |
| EN 1092-1 | PN 10 × T01+T05+T11+T12 × 8 DN | 32 | ✅ 78 sonu (77 T05+T11, 78 T01+T12) |
| **TOPLAM** | | **308** | |

**Açık iş (öncelikli):**

- **EN 1092-1 PN 25 × 4 tip × 15 DN = 60 satır** (P1, hat çapı küçük, yüksek basınç sistemleri)
- **EN 1092-1 PN 40 × 4 tip × 13 DN = 52 satır** (P2, daha az yaygın)
- **EN 1092-1 PN 10 küçük cephe (DN 10-150, 7 DN × 4 tip = 28 satır)** (P2, KARAR-78.1'de β ile dışlandı, ihtiyaç gelirse α)
- **B16.47 Series A/B large diameter (NPS 26-60)** (P2, ~120 satır)
- **DIN 86087/88 (gemi flansh)** (P3, özel)

**Hedef 80 sonu:** EN 1092-1 PN 25 + PN 40 tamamlanır → 308 + 112 = 420 satır (%53).

---

## 4. Fitting Ölçüleri — `fitting_olculer` (424 satır)

| Geometri Std | Satır | Kırılım |
|---|---:|---|
| ASME B16.9 | 424 | reducer_ecc 114 + reducer_conc 114 + cap 33 + 90LR 33 + 45LR 33 + tee_eq 33 + 90_3D 32 + 45_3D 32 |

**B16.9 kapsam:** 33 DN (DN15-1200), 8 parça tipi. Standart kapsamının %85'i (eksik: 90SR, 180LR return, tee_red eşitsiz, lateral, stub_end). Bu büyük ölçüde **tamam**.

**Açık iş (büyük kapsamlar):**

- **B16.9 — stub_end (Lap Joint pair)** — ~33 DN, P1, A2 görevi (76'dan açık)
- **B16.9 — tee_red (eşitsiz T)** — ~80 kombinasyon, P1
- **B16.9 — 90SR (Short Radius)** — ~33 DN, P2
- **B16.9 — 180LR return bend** — ~33 DN, P3
- **B16.11 — socket weld fittings** (P1, küçük çap karbon/paslanmaz, ~150-200 satır)
- **B16.28 — short radius elbows** (P2)
- **EN 10253-2 / 10253-3 (EN BW fitting)** (P1, ~200 satır)
- **DIN 86089 (gemi BW)** (P3)

**Hedef 80 sonu:** B16.9 stub_end + tee_red eklenir → 424 + 115 ≈ 540 satır.

---

## 5. Çapraz Uyum — `fitting_malzeme_uyum`

**Canlı:** 1 satır (test).

**Plan:** Spec × geometri kombinasyonu (örn. ASTM A234 WPB → B16.9 elbow/tee/reducer/cap). Otomatik script üretim stratejisi (her malzeme_kataloglari satırının `uygun_*` flag'lerinden FK kombinasyonu üret).

**Beklenen:** ~5000-8000 satır (78'de bu rakam v2'den indirildi, gerçek hesap m_kataloglari × fitting_olculer × yaygın spec kombinasyonu).

**Öncelik:** P1, ama script tasarımı (~3-4 sa) ön gerekli. 85+ oturuma uygun.

---

## 6. Özel Parçalar — `ozel_parcalar`

**Canlı:** 0. Coupling sleeve, custom flansh, vb. Tenant başına özel.

**Plan:** İhtiyaç bazlı. Şimdilik P3.

---

## 7. Spec Set — `tenant_spec_seti` + `spec_kural`

**Canlı:** 0 (her ikisi).

**Plan:** AVEVA-vari spec yönetimi. Her tenant kendi spec set'ini tanımlar (örn. "GEMI-CS-300# karbon class 300 boru spec'i"), spec_kural'da o spec'e izinli parça kombinasyonları (A106 boru + A234 WPB elbow + A105 flansh, vb.).

**Öncelik:** P1, ürünün AVEVA bağımsızlığı için kritik. Tasarım belgesi gerekli, 90+ oturuma.

---

## Önemli İzler (78 sonu)

1. **`malzeme_kataloglari` (yeni, B0)** ≠ **`malzeme_tanimlari` (eski, UI köprüsü)** — paralel tablolar, karıştırma yok. v3'te ayrıştırıldı.
2. **`fitting_olculer.geometri_std = 'B16.9'`** tek standart — kolon tasarımı çoklu standardı destekliyor (`schedule_kod` NULL olabilir), gelecek B16.11/EN eklemeleri sorunsuz.
3. **B16.9 schedule bağımsız** — `et_mm` ve `schedule_kod` çoğu B16.9 satırında NULL (standart davranış, ölçüler et kalınlığına bağlı değil).
4. **EN 1092-1 PN 10 küçük cephe (DN 10-150)** β kapsamı dışı bırakıldı (KARAR-78.1, gemi profilinde nadir). Eğer pilot tersanesinden talep gelirse α paketi 28 satır.
5. **CuNi fitting + flansh eksiği P0** — gemi tersanesi için en kritik açık. 79-80 oturumlarında dolacak.

---

## Pratik İş Sırası (79+ önerilen)

| Sıra | İş | Süre | Etki |
|---|---|---|---|
| 1 | M_K CuNi fitting + flansh (B467, B151, B564) | ~1 sa | Gemi profili P0 cephesi kapanır |
| 2 | M_K paslanmaz grade'leri (TP304L, TP316, F304L vb.) | ~1 sa | P1 cephesi gerinir |
| 3 | EN 1092-1 PN 25 paketi (4 tip × 15 DN = 60 satır) | ~2 sa | flansh_olculer %53'e çıkar |
| 4 | B16.9 stub_end (A2, ~33 satır) | ~1.5 sa | fitting cephesinde 6. parça tipi |
| 5 | B16.11 socket fittings başlangıcı | ~3-4 sa | İkinci standart, büyük kapsam |
| 6 | M_K A333 + A420 (düşük sıcaklık karbon) | ~30 dk | Gemi ambar hatları |

---

_v3 yazıldı: 12 Mayıs 2026, 78. oturum. Canlı DB sorguları: `malzeme_kataloglari` (10), `flansh_olculer` (308), `fitting_olculer` (424), `boru_olculer` (450)._
