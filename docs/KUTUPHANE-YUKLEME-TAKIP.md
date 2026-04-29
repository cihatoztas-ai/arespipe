# AresPipe — Kütüphane Yükleme Takip

> **Amaç:** Hangi tablolar/kombinasyonlar sisteme yüklenecek, hangileri tamam, hangileri öncelikli — bir bakışta gör.
>
> **Referans:** Bu dosya `docs/KUTUPHANE-KAPSAM.md` belgesinin **canlı durumudur**. Kapsam belgesi neyi yapacağımızı söyler, bu dosya neresini yaptığımızı gösterir.
>
> **İlk yazım:** 28 Nisan 2026 — 43. oturum (v1: eksik, kapsam belgesi referans alınmamıştı)
> **Düzeltme:** 28 Nisan 2026 — 43. oturum (v2: KUTUPHANE-KAPSAM.md ile tam hizalandı; CuNi P0'a çıkarıldı, 3 atlanmış malzeme grubu eklendi, çapraz uyum + özel parça + spec modülleri eklendi)

---

## Önemli Düzeltme — v1 → v2

v1'de şunlar atlandı (Cihat tarafından fark edildi, 43 kapanış):
- **CuNi yanlış P3 yapılmıştı** — gemi tersanesi için deniz suyu sistemi = CuNi. P0'a çıkarıldı.
- Duplex, Alüminyum, Nikel grupları yoktu — eklendi.
- `fitting_malzeme_uyum` (~8000 satır) atlanmıştı — eklendi.
- `ozel_parcalar`, `tenant_spec_seti`, `spec_kural` atlanmıştı — eklendi.
- Toplam kapsam tahmini 1810 yazılmıştı, gerçek **~12.000** (%660 daha büyük).

---

## Özet (28 Nis 2026)

| Modül | Beklenen | Canlıda | % |
|---|---:|---:|---:|
| **`malzeme_kataloglari`** (7 grup, ~120 spec) | 120 | 12 | 10% |
| **`flansh_olculer`** (B16.5 + B16.47 + EN + DIN 86087/88) | 800 | 20 | 2.5% |
| **`fitting_olculer`** (B16.9 + B16.11 + B16.28 + EN 10253 + DIN 86089) | 2,500 | 0 | 0% |
| **`boru_olculer`** (B36.10 + B36.19 + EN 10216 + DIN 86019) | 280 | 48 | 17% |
| **`fitting_malzeme_uyum`** (çapraz uyum tablosu) | 8,000 | 0 | 0% |
| **`ozel_parcalar`** (coupling sleeve, custom) | 200-500 | 0 | 0% |
| **`tenant_spec_seti`** (AVEVA-vari spec) | 10-20 | 0 | 0% |
| **`spec_kural`** (spec başına izinli parça) | 500-1,000 | 0 | 0% |
| **TOPLAM** | **~12,400** | **80** | **0.6%** |

**Hedef trajektori (gerçekçi):**
- 44 sonu: %5-10 (sık kullanılan A105 + F316L + CuNi B466 yaygın boyutlar)
- 50 sonu: %25-40 (P0 + P1 büyük ölçüde kapsanır)
- 60 sonu: %60-70 (P2 girer)
- 80+: %85+ (çapraz uyum + spec doluluk birikir)
- %100: hiçbir zaman — uzun kuyruk hep parking, ihtiyaca göre eklenir

---

## Öncelik Mantığı (gemi tersanesi profili — Cihat'ın işi)

| Öncelik | Açıklama | Örnek |
|---|---|---|
| **P0** 🔴 | Her gemi spool projesinde kritik | A105 WN/SO Class 150-300, **CuNi B466/B467 (deniz suyu)**, B16.9 90LR + Tee + Reducer DN50-200, B36.10 Sch 40 |
| **P1** 🟠 | Sık görülen | F316L Class 150-300, A234 WPB butt-weld, B16.11 socket, A335 P11/P22 (HT hatları) |
| **P2** 🟡 | Belirli proje tiplerinde | Class 600+ HT, alaşımlı (F11/F22), Duplex (2205/2507), LJ flanş, Alüminyum (5083 deniz) |
| **P3** ⚪ | Özel proje gelirse | Nikel alaşım (Inconel/Hastelloy), Class 2500, A860 yüksek dayanım |

---

## 1. Malzeme Kataloğu — `malzeme_kataloglari`

**Amaç:** Her malzeme spec + grade'i tek satır. Tüm geometri tabloları (boru/fitting/flanş) buraya FK ile bağlanır.

Mevcut `malzeme_tanimlari` tablosu (12 preset, 19. oturumdan) ile karıştırma — bu daha geniş bir tablo, vizyondan geliyor (`uygun_boru/fitting/flansh` + cekme/akma + sıcaklık aralığı + korozyon JSONB).

### 1.1 Karbon Çelik (~25 spec) — P0 + P1
| Spec | Grade | Açıklama | Uygun | Öncelik |
|---|---|---|---|---|
| ASTM A106 | A, B, C | Yüksek sıcaklık dikişsiz boru | boru | P0 🔴 |
| ASTM A53 | A, B (Type S/E/F) | Düşük basınç boru | boru | P1 🟠 |
| ASTM A333 | 6, 1 | Düşük sıcaklık boru | boru | P2 🟡 |
| API 5L | B, X42-X70 | Hat borusu | boru | P2 🟡 |
| ASTM A234 | WPB, WPC, WP12, WP22 | Buttweld fitting | fitting | P0 🔴 |
| ASTM A420 | WPL3, WPL6 | Düşük sıcaklık fitting | fitting | P2 🟡 |
| ASTM A860 | WPHY 42-70 | Yüksek dayanım hat borusu fitting | fitting | P3 ⚪ |
| ASTM A105 | — | Forged karbon (flanş + small fitting) | fitting+flansh | P0 🔴 |
| ASTM A350 | LF1, LF2 | Düşük sıcaklık forged | fitting+flansh | P2 🟡 |
| ASTM A182 | F1, F2, F11, F22 | Alaşımlı forged | fitting+flansh | P1 🟠 |
| ASTM A694 | F42-F70 | Yüksek dayanım flanş | flansh | P3 ⚪ |
| EN 10216-1 | P195/235/265TR | EN dikişsiz karbon | boru | P0 🔴 (42'de boru kayıt eklendi) |
| EN 10217 | P235TR1/TR2 | EN kaynaklı | boru | P1 🟠 |
| EN 10253-2 | TS235/265 | EN fitting | fitting | P1 🟠 |
| EN 10222 | P245GH | EN forged flanş | flansh | P1 🟠 |

### 1.2 Paslanmaz Çelik (Austenitik) (~15 spec) — P0 + P1
| Spec | Grade | Açıklama | Uygun | Öncelik |
|---|---|---|---|---|
| ASTM A312 | TP304, TP304L, TP316, TP316L, TP321, TP347 | Paslanmaz boru | boru | P0 🔴 |
| ASTM A358 | TP304, TP316 | Yüksek sıcaklık kaynaklı | boru | P2 🟡 |
| ASTM A778 | TP304L, TP316L | Genel korozif kaynaklı | boru | P1 🟠 |
| ASTM A403 | WP304/L, WP310S, WP316/L | Paslanmaz fitting | fitting | P0 🔴 |
| ASTM A182 | F304/L, F316/L, F321, F347 | Forged + flanş | fitting+flansh | P0 🔴 |
| EN 10216-5 | X2CrNiMo17-12-2 (1.4404), 1.4571 | EN paslanmaz boru | boru | P1 🟠 |
| EN 10253-3 | X2CrNi19-11 | EN paslanmaz fitting | fitting | P1 🟠 |

### 1.3 Duplex / Super Duplex (~6 spec) — P2
| Spec | Grade | Açıklama | Öncelik |
|---|---|---|---|
| ASTM A790 | UNS S31803/S32205 (2205), S32750/S32760 (2507) | Duplex boru | P2 🟡 |
| ASTM A928 | S31803, S32750 | Kaynaklı duplex | P2 🟡 |
| ASTM A815 | WP-S31803, WP-S32750 | Duplex fitting | P2 🟡 |
| ASTM A182 | F51, F53, F55 | Duplex forged + flanş | P2 🟡 |

### 1.4 Bakır-Nikel (CuNi) — **GEMİ İÇİN P0** 🔴
**Cihat dikkat çekti:** Tersane gemisi = deniz suyu sistemi = CuNi. Bu grup P0, tartışmasız.

| Spec | Grade | Açıklama | Uygun | Öncelik |
|---|---|---|---|---|
| ASTM B466 | C70600 (90/10), C71500 (70/30) | Dikişsiz CuNi boru | boru | **P0 🔴** |
| ASTM B467 | C70600, C71500 | Kaynaklı CuNi boru | boru | **P0 🔴** |
| DIN 86019 | CuNi 10Fe1Mn (2.0872), 30Mn1Fe (2.0882) | Alman gemicilik boru | boru | **P0 🔴** |
| EEMUA 144 | CuNi 90/10, 70/30 | İngiliz petrol-deniz boru | boru | P1 🟠 |
| ASTM B122/B171 | C70600, C71500 | CuNi plate (flanş hammaddesi) | flansh | **P0 🔴** |
| ASTM B151 | C70600, C71500 | CuNi rod/bar (forged) | flansh+fitting | **P0 🔴** |
| DIN 86087 | CuNi flanş | Alman gemi flanş | flansh | **P0 🔴** |
| DIN 86088 | CuNi flanş (büyük çap) | Alman gemi flanş | flansh | P1 🟠 |
| DIN 86089 | CuNi fitting | Alman gemi fitting | fitting | **P0 🔴** |
| DIN 86090 | CuNi fitting (özel) | Alman gemi fitting | fitting | P1 🟠 |
| EEMUA 145/146 | — | İngiliz CuNi flanş + fitting | fitting+flansh | P1 🟠 |

### 1.5 Alüminyum (~5 spec) — P2
| Spec | Grade | Açıklama | Uygun | Öncelik |
|---|---|---|---|---|
| ASTM B241 | 3003, 5083, 5086, 6061, 6063 | Al boru — **5083/5086 deniz** | boru | P2 🟡 |
| ASTM B210 | 6061-T6 | Al çekilmiş tüp | boru | P2 🟡 |
| ASTM B361 | 6061, 6063 | Al kaynak fitting | fitting | P2 🟡 |
| ASTM B247 | 6061, 6063 | Al forged (flanş hammaddesi) | flansh | P2 🟡 |
| EN 754/755 | AlMg4.5Mn (5083) | EN Al boru/profil | boru | P2 🟡 |

### 1.6 Alaşımlı Çelik (~10 spec) — P1
| Spec | Grade | Açıklama | Uygun | Öncelik |
|---|---|---|---|---|
| ASTM A335 | P5, P9, P11, P22, P91 | Yüksek sıcaklık alaşımlı boru | boru | P1 🟠 |
| ASTM A234 | WP5, WP9, WP11, WP22, WP91 | Alaşımlı fitting | fitting | P1 🟠 |
| ASTM A182 | F5, F9, F11, F22, F91 | Alaşımlı forged + flanş | fitting+flansh | P1 🟠 |

### 1.7 Nikel Alaşımları (~8 spec) — P3 ⚪ (özel proje)
| Spec | Grade | Açıklama | Öncelik |
|---|---|---|---|
| ASTM B161 | N02200, N02201 (Nickel 200/201) | Nikel boru | P3 ⚪ |
| ASTM B167 | N06600, N06601, N06690 (Inconel) | Inconel boru | P3 ⚪ |
| ASTM B423 | N08825 (Incoloy 825) | Incoloy boru | P3 ⚪ |
| ASTM B729 | N10276 (Hastelloy C-276), N06022 (C-22) | Hastelloy boru | P3 ⚪ |
| ASTM B366 | — | Nikel alaşım fitting | P3 ⚪ |
| ASTM B564 | N04400 (Monel), N06600 | Nikel forged + flanş | P3 ⚪ |

**Malzeme alt toplam:** ~120 spec/grade (mevcut 12 ≈ %10)

---

## 2. Flanş — `flansh_olculer`

### Tip × Sınıf Matrisi (KUTUPHANE-KAPSAM.md'den)

| Tip | Geçerli Sınıflar | NPS Aralığı |
|---|---|---|
| WN (Weld Neck) | 150, 300, 600, 900, 1500, 2500 | 1/2-24 |
| SO (Slip-On) | **150, 300, 600 SADECE** | 1/2-24 |
| SW (Socket Weld) | 150, 300, 600, 900, 1500, 2500 | 1/2-3 (küçük çap) |
| BL (Blind) | 150, 300, 600, 900, 1500, 2500 | 1/2-24 |
| LJ (Lap Joint) | 150, 300, 600, 900, **1500 (2500 yok)** | 1/2-24 |
| TH (Threaded) | **150, 300 SADECE** | 1/2-2 |

### ASME B16.5 — Class 150 (P0 🔴)
| Tip | Bekleniyor | Mevcut | Durum | Kaynak |
|---|---:|---:|---|---|
| WN | 20 | 20 | ✅ TAM | Wermac+Ferrobend (43) |
| SO | 20 | 0 | ⬜ | scrape (44) |
| BL | 20 | 0 | ⬜ | scrape (44) |
| LJ | 20 | 0 | ⬜ P2 | — |
| SW | 8 | 0 | ⬜ P2 | — |
| TH | 8 | 0 | ⬜ P3 | — |

### ASME B16.5 — Class 300 (P0 🔴)
WN/SO/BL × 20 boyut = 60 satır. SW/LJ/TH P2/P3.

### ASME B16.5 — Class 600 (P1 🟠)
WN/SO/BL × 20 boyut = 60 satır.

### ASME B16.5 — Class 900, 1500, 2500 (P2/P3 🟡⚪)
WN/BL Class 900-1500: ~80 satır. Class 2500 (NPS 1/2-12 sınırlı): ~36.

### ASME B16.47 (büyük çap NPS 26-60) — P3 ⚪
Series A + Series B. Tersane projesi gelirse. ~200 parking.

### EN 1092-1 — P1 🟠
DIN/EN flanş eşdeğeri. PN6/10/16/25/40/63/100/160/250/320/400. ~150 parking.

### DIN 86087/86088 (Gemi CuNi) — **P0 🔴**
~30-50 satır. CuNi boru standardının doğal eşi.

**Flanş alt toplam:** ~800 satır (B16.5 + B16.47 + EN + DIN gemi)

---

## 3. Fitting — `fitting_olculer`

### ASME B16.9 — Buttweld (P0+P1+P2)
KUTUPHANE-KAPSAM.md'deki **11 fitting tipi**:

| Tip | Açıklama | Bekleniyor | Mevcut | Öncelik |
|---|---|---:|---:|---|
| 90LR | Long Radius (1.5D) Elbow | ~120 | 0 | P0 🔴 |
| 90SR | Short Radius (1D) Elbow (B16.28) | ~80 | 0 | P1 🟠 |
| 45 | 45° LR Elbow | ~120 | 0 | P0 🔴 |
| 3D | 3D Radius Elbow | ~60 | 0 | P2 🟡 |
| LR_red | Long Radius Reducing Elbow | ~80 | 0 | P2 🟡 |
| return_180_LR | 180° LR Return | ~50 | 0 | P2 🟡 |
| return_180_SR | 180° SR Return (B16.28) | ~30 | 0 | P3 ⚪ |
| tee_eq | Equal Tee | ~120 | 0 | P0 🔴 |
| tee_red | Reducing Outlet Tee | ~200 (kombinasyon) | 0 | P1 🟠 |
| cross | Straight Cross | ~50 | 0 | P2 🟡 |
| cross_red | Reducing Outlet Cross | ~80 | 0 | P3 ⚪ |
| reducer_conc | Concentric Reducer | ~100 | 0 | P0 🔴 |
| reducer_ecc | Eccentric Reducer | ~100 | 0 | P1 🟠 |
| cap | Kör Kapak | ~20 | 0 | P1 🟠 |
| stub_long | Lap Joint Stub End — Long | ~20 | 0 | P2 🟡 |
| stub_short | Lap Joint Stub End — Short | ~20 | 0 | P2 🟡 |

### ASME B16.11 — Forged Socket Weld + Threaded (P1+P3)
| Tip | Bekleniyor | Mevcut | Öncelik |
|---|---:|---:|---|
| Socket Weld Tee/Elbow/Cap (NPS 1/8-4) | ~150 | 0 | P1 🟠 |
| Threaded fittings (NPS 1/8-4) | ~150 | 0 | P3 ⚪ |

### ASME B16.28 — Short Radius (P1) — KUTUPHANE-KAPSAM.md'de var, v1'de atlanmıştı
SR 90° elbow + SR 180° return özel — pratik yerleşimde sık. ~100 satır.

### MSS SP-43 (paslanmaz LJ stub end) + MSS SP-75 (yüksek dayanım butt-weld) — P2/P3
~150 satır kombine.

### EN 10253 — P1 🟠
EN/DIN buttweld eşdeğeri. ~300 satır.

### DIN 86089 (Gemi CuNi) — **P0 🔴**
~100-150 satır. CuNi boru ile birlikte zorunlu.

**Fitting alt toplam:** ~2,500 satır

---

## 4. Pipe — `boru_olculer`

### ASME B36.10M (Karbon/Alaşımlı) — P0
| Schedule | Bekleniyor | Mevcut | Öncelik |
|---|---:|---:|---|
| Sch 40 / STD | 20 | 0 | P0 🔴 |
| Sch 80 / XS | 20 | 0 | P0 🔴 |
| Sch 10 | 20 | 0 | P1 🟠 |
| Sch 160, XXS | 20 | 0 | P1 🟠 |
| Sch 5, 20, 30, 60, 100, 120, 140 | ~80 | 0 | P2 🟡 |

### ASME B36.19M (Paslanmaz) — P0
Sch 5S/10S/40S/80S × 20 boyut = ~80 satır.

### EN 10216-1 + EN 10216-5 — P0/P1
- EN 10216-1 (karbon dikişsiz): ~24 mevcut (42 ekledi), ~30 hedef. P0 🔴
- EN 10216-5 (paslanmaz dikişsiz): 0 mevcut, ~30 hedef. P1 🟠

### DIN 2448 — P0
~24 mevcut (42 ekledi), ~30 hedef. P0 🔴

### DIN 86019 (Gemi CuNi boru) — **P0 🔴**
~30-50 satır. **CuNi'nin temel boru standardı, gemi için kritik.**

### EN 10220 — P2
EN boru ölçü altyapısı. ~20 satır.

**Pipe alt toplam:** ~280 satır

---

## 5. Çapraz Uyum — `fitting_malzeme_uyum` (~8,000 satır)

**Bu modül en büyük olan ama v1'de atlanmıştı.** Geometri × malzeme çapraz uyum tablosu — hangi geometri (örn. B16.9 90LR DN100) hangi malzeme (örn. A234 WPB) ile üretilebilir, üretim yöntemi ne (seamless/welded/forged/cast).

| Karakter | Değer |
|---|---|
| Beklenen satır | ~8,000 |
| Doldurma yöntemi | Geometri tablosu × malzeme tablosu çarpımı + uretim_yontemi etiketi |
| Manuel girilebilir mi? | Hayır — script'le üretilir |
| Mevcut | 0 |
| Öncelik | 44+ pipeline kurulduktan sonra otomatik üretim |

Doğrudan AI ile üretilebilir: "Bu malzeme bu fitting'i seamless/welded yöntemiyle üretebilir mi" pattern'ı. Kaynak: ASTM ana standartlarının "kapsam" bölümleri.

---

## 6. Özel Parçalar — `ozel_parcalar` (200-500 satır)

Standart kütüphane dışı, zaman içinde proje girişiyle dolar:

| Tip | Açıklama | Öncelik |
|---|---|---|
| coupling_sleeve | Atölye üretim, üretici-spesifik | Pilot kullanımıyla |
| custom_fitting | AVEVA'da çizilen non-standard | Pilot kullanımıyla |
| reinforcement_sleeve | Tamir/takviye halkası | Pilot kullanımıyla |
| mekanik_coupling | Victaulic, Gruvlok, Straub patentli | Tersane talebi gelirse |
| uretici_spesifik | Özel üretim, proje bazlı | Pilot kullanımıyla |

**Strateji:** Manuel doldurulmaz. Pilot ilk spool girdiğinde, tanınmayan parçalar için "kütüphaneye ekle" akışı tetiklenir.

---

## 7. Spec Sistemi — `tenant_spec_seti` + `spec_kural`

AVEVA-vari spec mantığı (KUTUPHANE-KAPSAM.md Bölüm 6 — ileri vizyon):

| Tablo | Beklenen | Kullanım |
|---|---:|---|
| `tenant_spec_seti` | 10-20 | Her tersane kendi spec setini tanımlar (CS150, SS316_300, vb.) |
| `spec_kural` | 500-1,000 | Spec başına izinli parça/malzeme kombinasyonları |

**Tetik:** İkinci tersane geldiğinde — şu an pilot tek tersane, mantık zaten tek-spec. Sözleşme genişlerse açılır.

---

## Veri Kaynakları

### Halihazırda kullandığımız
- ✅ **Wermac** (wermac.org) — ASME B16.5 inç tablolar
- ✅ **Ferrobend** (ferrobend.com) — Çapraz teyit
- ✅ **OSE-piping-workbench** (github.com/rkrenzler) — fitting/pipe CSV (LGPL kod, sayısal veri telif dışı)

### Potansiyel — Cihat eklerse 📥
- 📥 **Üretici PDF kataloğu** (Octal Flange, Texas Flange, Sandvik, Vallourec, Tubacex, Haihao)
- 📥 **DIN 86019/86087-90 resmi dokümanları** — gemi CuNi için (Cihat'ın elinde olabilir)
- 📥 **EEMUA 144-146** — İngiliz CuNi standardı
- 📥 **Tersane Excel/PDF** — yıllarca biriktirilmiş tablolar (en kaliteli kaynak)

### Yedek (Plan C)
- 🔻 **FreeCAD-library** — STEP/.fcstd 3D modeller (CC-BY 3.0)
- 🔻 **NIST açık veriler**, GitHub `pipe-data` repo'lar

---

## Güncelleme Protokolü

**Her oturum kapanışında Claude:**
1. Yeni eklenen kayıt sayısı → ilgili satırın "Mevcut" kolonu
2. Tamamlanan satırlar ⬜ → ✅
3. Kısmi olanlar 🟡 KISMEN
4. Özet tablodaki yüzde güncellenir
5. Cihat'ın yeni getirdiği PDF'ler "Veri Kaynakları" altına 📥 olarak eklenir

**Her 5 oturumda:**
- Hedef trajektorisi gözden geçirilir
- Öncelik P kademeleri tersane talebine göre revize edilir
- Yeni tersane spec'i geldiyse `tenant_spec_seti` aktif edilir

---

## Açık Notlar

- **Geometri ≠ malzeme.** Flanş ölçüleri (228.6 mm, 8 cıvata vb.) malzeme bağımsız. A105 için yazılan satır F304 için tekrar yazılmaz — ders 43'te düşürüldü.
- **`fitting_malzeme_uyum` çapraz tablosu** — bu yapı geometri × malzeme ayrımının asıl çıktısı. Manuel girilemez (8000 satır), pipeline otomatik üretir.
- **Sistem preset (`tenant_id IS NULL`)** ile **tenant özeli** ayrımı her tabloda korunur. Bu dosya **sadece sistem preset** kapsamını izler. Tenant özeli kayıtları her tersane kendi yönetimine bırakır.
- **CuNi gemi için P0** — Cihat tersanecilik yapıyor, deniz suyu sistemi = CuNi. v1'de bu hata yapılmıştı, v2'de düzeltildi.

---

> Bu dosya canlı tutulur. Her oturum kapanışında Claude günceller, Cihat doğrular.
> v2 — 28 Nisan 2026 — KUTUPHANE-KAPSAM.md ile tam hizalandı.
