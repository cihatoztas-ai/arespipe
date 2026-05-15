# AresPipe — Kütüphane Yükleme Takip

> **Amaç:** Kütüphane tablolarında neyi yaptık, neyi yapacağız — bir bakışta gör. Her oturum kapanışında güncellenir.
>
> **Kapsam:** Bu dosya `KUTUPHANE-KAPSAM.md` belgesinin **canlı durumudur**. Kapsam belgesi neyi yapacağımızı söyler, bu dosya neresini yaptığımızı gösterir.
>
> **Versiyon geçmişi:**
> - **v1** — 43. oturum (28 Nis 2026): İlk yazım, CuNi eksikti
> - **v2** — 43. oturum (28 Nis 2026): KUTUPHANE-KAPSAM.md ile hizalandı, CuNi P0'a çıkarıldı
> - **v3** — 91. oturum (15 May 2026): GOST/JIS/GB/T eklendi, ozel_parcalar modülü kaldırıldı, çapraz uyum 3 tabloya bölündü, hedef satır sayısı tahminleri kaldırıldı (iskelet + organik içerik), DSAF (Dublin flanş) 11. tip olarak eklendi

---

## Özet Tablo (15 May 2026 — 91 sonu)

| Modül | Tablo | Canlıda | İskelet | Not |
|---|---|---:|---|---|
| **Malzeme Master** | `malzeme_kataloglari` | 20 satır | 6 aile × 7 grup yapı hazır | İçerik dolacak |
| **Boru Geometrisi** | `boru_olculer` | 450 satır | ASME/EN/DIN dolu, GOST/JIS/GB/T 0 | İskelet eksik (GOST/JIS/GB/T) |
| **Fitting Geometrisi** | `fitting_olculer` | 569 satır | ASME B16.9/B16.11 dolu, diğerleri 0 | 23 tipten 3-4 tipi mevcut |
| **Flanş Geometrisi** | `flansh_olculer` | 308 satır | ASME B16.5 + EN 1092-1 dolu | 10 tipten 6 tipi mevcut |
| **Boru Çapraz Uyum** | `boru_malzeme_uyum` | YOK | Tablo yok | Migration 067'de oluşacak |
| **Fitting Çapraz Uyum** | `fitting_malzeme_uyum` | 0 satır | FK BUG var | Migration 066: malzeme_id → malzeme_kataloglari fix |
| **Flanş Çapraz Uyum** | `flansh_malzeme_uyum` | YOK | Tablo yok | Migration 067'de oluşacak |

**Toplam canlıda:** 1,347 satır (geometri) + 20 (malzeme master) = 1,367 kayıt.

**Hedef sayı yok.** İskelet hazır, içerik organik dolar. Her gemi PDF'i kütüphaneyi büyütür.

---

## Öncelik Mantığı (Gemi Tersanesi Profili)

| Öncelik | Açıklama | Örnek |
|---|---|---|
| **P0** 🔴 | Her gemi spool projesinde kritik | A105 WN/SO Class 150-300, **CuNi B466/B467 (deniz suyu)**, B16.9 90LR + Tee + Reducer DN50-200, B36.10 Sch 40 |
| **P1** 🟠 | Sık görülen | F316L Class 150-300, A234 WPB butt-weld, A335 P11/P22 (HT hatları) |
| **P2** 🟡 | Belirli proje tiplerinde | Class 600+ HT, Duplex (2205/2507), LJ flanş, Alüminyum (5083 deniz) |
| **P3** ⚪ | Özel proje gelirse | Nikel alaşım (Inconel/Hastelloy), Class 2500 |

**Standart aile bazında:**

| Aile | İskelet | Öncelik | Tetik |
|---|---|---|---|
| ASME | Geometri var (B36.10, B16.5, B16.9, B16.11) | P0 🔴 | Aktif kullanım |
| EN | Geometri var (10216, 1092-1) | P0 🔴 | Aktif kullanım |
| DIN | Geometri var (2448, 86019, 86087) | P0 🔴 | CuNi için kritik |
| **GOST** | İskelet boş | P1 🟠 | Rus armatör projesi geldiğinde |
| **JIS** | İskelet boş | P1 🟠 | Japon inşa gemi geldiğinde |
| **GB/T** | İskelet boş | P1 🟠 | Çin inşa gemi geldiğinde |

---

## 1. `malzeme_kataloglari` — Master Spec Tablosu

**Amaç:** Her malzeme spec + grade'i tek satır. Tüm geometri tabloları çapraz uyumla buraya bağlanır.

**Mevcut: 20 satır** (12 sistem preset + 8 ek).

**İçerik durumu (15 May 2026):**

| Malzeme Grubu | Mevcut | Tipik İçerik | Öncelik |
|---|---:|---|---|
| Karbon | ~8 | ASTM A106-B, A53-B, A234-WPB, A105 | P0 🔴 |
| Paslanmaz | ~5 | ASTM A312 TP304L/TP316L, A182 F316L | P0 🔴 |
| CuNi | ~3 | ASTM B466 C70600 (90/10), B466 C71500 (70/30) | P0 🔴 |
| Duplex | ~1 | ASTM A790 S31803 | P2 🟡 |
| Alüminyum | ~1 | 5083, 6061 | P2 🟡 |
| Alaşımlı | ~1 | ASTM A335 P11 | P1 🟠 |
| Nikel | 0 | — | P3 ⚪ |

**Eklenecek (P0 + P1):**
- Karbon: A312 TP321/TP347 (HT paslanmaz), A350 LF2 (düşük sıcaklık)
- CuNi: DIN 86019 (Alman gemi CuNi), EEMUA 144/146 (İngiliz CuNi)
- Alaşımlı: A335 P22, P91

**Veri kaynağı:** Üretici katalogları + Wermac + Ferrobend (Octal, Sandvik, Vallourec, Tubacex).

---

## 2. `boru_olculer` — Boru Geometrisi

**Mevcut: 450 satır.**

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

### DIN 2448 + DIN 86019
✅ Mevcut, 42'de eklendi. **DIN 86019 gemi CuNi için kritik.**

### GOST 8732 / 8734 (Rus boru)
❌ İskelet boş. Rus armatör projesi geldiğinde Migration ile satır eklenir.

### JIS G3454 (Japon boru)
❌ İskelet boş. Japon inşa gemi geldiğinde.

### GB/T 8163 (Çin boru)
❌ İskelet boş. Çin inşa gemi geldiğinde.

**Sonraki adım (94+):** P0/P1 iskeletini tamamla (Sch 160/XXS) + GOST/JIS/GB/T'nin DN50-200 P0 boyutlarını seed et.

---

## 3. `fitting_olculer` — Fitting Geometrisi

**Mevcut: 569 satır** (sadece ASME B16.9 ve B16.11).

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
- DIN 86089 (gemi CuNi) → ❌ 0 satır, **P0**
- GOST 17375 → ❌ İskelet boş
- JIS B2311/B2312 → ❌ İskelet boş
- GB/T 12459 → ❌ İskelet boş

**Sonraki adım (94+):** DIN 86089 (CuNi P0) + EN 10253 + B16.28 + eksik fitting tipleri.

---

## 4. `flansh_olculer` — Flanş Geometrisi

**Mevcut: 308 satır** (sadece ASME B16.5 ve EN 1092-1).

### 11 Flanş Tipinin Mevcut Durumu

| Tip | B16.5 Class 150 | Class 300 | Class 600+ | EN 1092-1 | Öncelik |
|---|:---:|:---:|:---:|:---:|---|
| WN | ✅ | ✅ | ⚠ Eksik | ✅ | P0 🔴 |
| SO | ⚠ | ⚠ | ❌ | ⚠ | P0 🔴 |
| BL | ⚠ | ⚠ | ❌ | ⚠ | P0 🔴 |
| SW | ❌ | ❌ | ❌ | ❌ | P2 🟡 |
| LJ | ❌ | ❌ | ❌ | ❌ | P2 🟡 |
| TH | ❌ | ❌ | — | — | P3 ⚪ |
| RTJ | ❌ | ❌ | ❌ | ❌ | P2 🟡 |
| Reducing | ❌ | ❌ | ❌ | ❌ | P3 ⚪ |
| Spectacle | ❌ | ❌ | ❌ | ❌ | P3 ⚪ |
| Orifice | ❌ | ❌ | ❌ | ❌ | P3 ⚪ |
| DSAF | ❌ | ❌ | ❌ | — | P2 🟡 |

**DSAF özel notu:** Şema uyarlaması gerekiyor (çift bolt pattern). İlk kayıt geldiğinde Migration ile çözülür — JSONB ile esnek alan eklenmesi düşünülüyor. Sahada **"Dublin flanş"** olarak geçer.

**Standart bazında:**
- ASME B16.5 → ✅ 216 satır (WN dolu, SO/BL kısmen)
- EN 1092-1 → ✅ 92 satır (PN10/16/25 kısmen)
- ASME B16.47 (büyük çap NPS 26-60) → ❌ 0 satır, P3
- DIN 86087/88 (gemi CuNi) → ❌ 0 satır, **P0**
- GOST 33259 → ❌ İskelet boş
- JIS B2220 → ❌ İskelet boş
- GB/T 9112 → ❌ İskelet boş

**Sonraki adım (94+):** DIN 86087/88 (CuNi P0) + B16.5 SO/BL tamamla + EN 1092-1 dolu sınıflar.

---

## 5. Çapraz Uyum Tabloları — KRİTİK BUG + EKSİK TABLOLAR

### 5.1. `fitting_malzeme_uyum` — FK BUG (Migration 066'da fix)

**Mevcut: 0 satır.**

**Bug:** `malzeme_id` kolonu yanlış tabloya FK'lanmış:
```
ŞU AN (yanlış):
  fitting_malzeme_uyum.malzeme_id → malzeme_tanimlari  ❌

DOĞRUSU:
  fitting_malzeme_uyum.malzeme_id → malzeme_kataloglari  ✅
```

`fitting_olculer.malzeme_id` zaten `malzeme_kataloglari`'ya bağlı. Çapraz tablonun farklı bir master'a bağlanması mantıksız. 0 satır olduğu için hiç fark edilmemiş.

**Migration 066 yapacak:**
- Mevcut `malzeme_id` FK constraint'i sil
- Yeni FK constraint ekle: `malzeme_kataloglari`'ya
- Aynı zamanda PK ekle: `PRIMARY KEY (fitting_id, malzeme_id)`

### 5.2. `boru_malzeme_uyum` — TABLO YOK (Migration 067)

Şu an boru × malzeme çapraz uyumu için tablo yok. Boru kayıtları sadece `boru_olculer.malzeme_grubu` text kolonuyla "karbon/paslanmaz/cuni" sınıflandırılıyor. Bu **kategori** seviyesi, **spec-grade** değil.

**Migration 067 yapacak:**
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

### 5.3. `flansh_malzeme_uyum` — TABLO YOK (Migration 067)

Aynı şekilde flanş için.

**Migration 067 aynı tablo şablonu ile:**
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

### Potansiyel — Cihat eklerse 📥
- 📥 Üretici PDF kataloğu (Octal Flange, Texas Flange, Sandvik, Vallourec, Tubacex, Haihao)
- 📥 DIN 86019/86087-90 resmi dokümanları — gemi CuNi için
- 📥 EEMUA 144-146 — İngiliz CuNi standardı
- 📥 GOST/JIS/GB/T üretici kataloğu — armatör projesi geldiğinde
- 📥 Tersane Excel/PDF — yıllarca biriktirilmiş tablolar (en kaliteli kaynak)

### Sahadan organik 🌱
- Pilot ilk spool girdiğinde → tanınmayan parçalar `tanimsiz_kayitlar`'a düşer
- Süper Admin onayıyla `sistem_preset=false` kütüphaneye eklenir
- Çok yaygınlaşırsa `sistem_preset=true`'ya promote

---

## 10. Sonraki Oturumlar İçin Sıra

| Oturum | İş | Önkoşul |
|---|---|---|
| **91** (mevcut) | Belge revize (KAPSAM + TAKIP + MIGRATION-YOL-HARITASI) + küçük borçlar | — |
| **92** | Migration 066 (fitting_malzeme_uyum FK fix) + Migration 067 (boru/flansh_malzeme_uyum CREATE) | 91 ✓ |
| **93** | Generic UI altyapısı (`kutuphane-tablo.html`) — KAPSAM Bölüm 11.5 | 92 ✓ |
| **94** | GOST/JIS/GB/T iskelet seed + DIN 86087/88/89 P0 doldurma | 93 ✓ |
| **95** | Fitting/Flansh filtre modeli (KARAR-90.C) + ilk uyum tablosu satırları | 94 ✓ |
| **96+** | Spec sistemi (`tenant_spec_seti`) — ikinci tersane geldiğinde | 95 ✓ + İkinci tersane sözleşmesi |

---

## Güncelleme Protokolü

**Her oturum kapanışında Claude:**
1. Eklenen kayıt sayısı → ilgili tablonun "Mevcut" kolonu
2. Tamamlanan satırlar ❌ → ✅
3. Kısmi olanlar ⚠ KISMEN
4. Yeni veri kaynağı eklendi mi → Bölüm 9'a 📥 olarak
5. Önemli karar alındı mı → ilgili bölüme not

**Her 5 oturumda:**
- Öncelik P kademeleri tersane talebine göre revize edilir
- Yeni tersane spec'i geldiyse `tenant_spec_seti` aktif edilir
- KUTUPHANE-KAPSAM.md ile tutarlılık kontrol edilir

---

## Açık Notlar

- **Geometri ≠ malzeme.** Çapraz uyum tablosu zorunlu, geometri tablosunda malzeme tutmak yetersiz (43 dersi).
- **`fitting_malzeme_uyum` FK bug.** Migration 066'da fix. Mevcut 0 satır olduğu için veri kaybı yok.
- **GOST/JIS/GB/T iskelet bekliyor.** Karşılaşıldığında değil, ön taraftan seed edilebilir (94'te). İskelet hazır olunca PDF parse "GOST 8732 tanındı" diyebilir.
- **`endustri_*` arşivlemesi olayı (91).** Tablo silinmeden / arşivlenmeden önce kod araması zorunlu. KUTUPHANE-KAPSAM.md Bölüm 1'de yazılı kural.
- **Hedef yüzdesi yok.** v2'de "44 sonu %5-10, 50 sonu %25-40" yazıyordu, v3'te kaldırıldı. Organik büyüme prensibine ters.

---

> Bu dosya canlı tutulur. Her oturum kapanışında Claude günceller, Cihat doğrular.
> v3 — 91. oturum — 15 Mayıs 2026 — KUTUPHANE-KAPSAM.md v3 ile tam hizalandı.
