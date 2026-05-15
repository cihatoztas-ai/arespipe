# AresPipe — Standart Kütüphane Kapsamı

> **Bu belge referanstır.** Ne zaman kütüphane tabloları kurulacak ve doldurulacak diye sorulduğunda buraya bakılır.
>
> **Versiyon geçmişi:**
> - **v1** — 40. oturum (Eylül 2025): İlk yazım, ASME odaklı, sınırlı kapsam
> - **v2** — 43. oturum (28 Nis 2026): CuNi P0'a çıkarıldı, geometri ≠ malzeme prensibi eklendi, 7 malzeme grubu
> - **v3** — 91. oturum (15 May 2026): Çoklu standart aileleri (GOST/JIS/GB/T eklendi), fitting tip listesi 11 → 23, flanş tip listesi 6 → 11 (DSAF dahil), özel parça için ayrı tablo kaldırıldı, 3-katman mimarisi netleştirildi, iskelet + organik içerik yaklaşımı yazıldı

---

## 1. Amaç ve Tasarım Yaklaşımı

### Bu Belgenin Amacı

Vizyon belgesinin (`VIZYON-VE-MODULER-MIMARI.md` Bölüm 2.A — Parça Kimliği Prensibi) diyor ki:

> *"Sisteme giren bir malzeme yazı değil, fiziksel nesne olarak tanımlansın."*

Bu prensibin çalışması için **kütüphane** lazım. Bu belge o kütüphanenin **kapsam haritasıdır**. Yapılacaklar listesi değil, **referans listesidir**.

### Tasarım Yaklaşımı: İskelet + Organik İçerik

Bu kütüphane "11.000 satıra ulaşmak" hedefiyle baştan doldurulmaz. Sebebi pratik: tersaneye gelen gemiler her köşeden geliyor — Çin yapımı, Avrupa standardı, Rus armatör, Japon inşa. Hangi malzemenin/ölçünün geleceğini önceden bilmek mümkün değil. Tam liste çıkarmaya çalışmak boşa emek.

Bunun yerine **iskelet hazır tutulur**: standart aileleri (ASME/EN/DIN/GOST/JIS/GB/T), parça tipleri, malzeme grupları tablo yapısında var. **İçerik karşılaşınca dolar**: pilot gemi PDF'i geldiğinde, içindeki parçalar `tanimsiz_kayitlar` akışına düşer, Süper Admin onayıyla kütüphaneye eklenir.

**Pratik karşılığı:** Pilot tersane gemi başına 12 parça kullanır. Sonraki gemi 8 parça zaten var, 4 yenisi eklenir. 50 spool sonra %80 organik dolmuş olur. Hiç karşılaşılmayacak parçalar boşa girilmez.

### Geometri ≠ Malzeme Prensibi (43'ten ders)

Flanş ölçüleri (228.6 mm OD, 8 cıvata, vb.) **malzeme bağımsızdır**. A105 için yazılan satır F304 için tekrar yazılmaz. Geometri tek satır, malzeme uyumu çapraz tablodan gelir.

Bu prensip kütüphanenin DB tasarımının temeli:

```
boru_olculer (geometri)        ── boru_malzeme_uyum ──┐
fitting_olculer (geometri)     ── fitting_malzeme_uyum ──┼── malzeme_kataloglari
flansh_olculer (geometri)      ── flansh_malzeme_uyum ──┘
```

Her geometri kaydı M:N ile malzemelere bağlanır. Aynı 90LR Dirsek hem A234-WPB hem F316L hem CuNi'den yapılabilir.

### "Önce Kullanım Haritası, Sonra Silme" Kuralı (91'den ders)

91. oturumda fark edildi: `endustri_malzemeler` ve `endustri_form_astm` tabloları **arşivlenmişti**, ama izometri parse akışı (`api/izometri-oku.js`) bunları çağırıyordu. 35 batch boyunca her spool sessizce "malzeme bilinmeyen" uyarısı aldı. Hata catch block'ta yutulduğu için **görünmedi**.

Çıkarım: **Süper Admin'de görünmüyor diye tablo silinmez/arşivlenmez.**

Silmeden / arşivlemeden önce zorunlu kontroller:
1. `grep -rn` ile tüm kod tabanında tablo adı aratılır
2. `ai_api_log` + Vercel function loglarında çağrı izi kontrol edilir
3. Aktif kullanım olmadığı kanıtlanmadan dokunulmaz

---

## 2. Üç Katmanlı Veri Mimarisi (91'de netleştirildi)

Sistemde **3 ayrı veri katmanı** çalışır. Bu belge **sadece 1. katmanı (KÜTÜPHANE)** yönetir. Diğer 2 katman farklı amaçlara hizmet eder, kendi yaşamları vardır.

### Katman 1 — KÜTÜPHANE (Bu belgenin kapsamı)

**Amaç:** "Hangi malzeme + ölçü kombinasyonları var olabilir?" sorusunun referans katalogu.

**Tablolar:**
- `malzeme_kataloglari` — Spec katalogu (ASTM A106-B, EN P235GH, vb.)
- `boru_olculer` — Boru geometrisi (çap, et, schedule)
- `fitting_olculer` — Fitting geometrisi (dirsek yaricap, tee mesafe, vb.)
- `flansh_olculer` — Flanş geometrisi (OD, bolt circle, vb.)
- `boru_malzeme_uyum` — Boru × Malzeme çapraz (Migration 067'de gelecek)
- `fitting_malzeme_uyum` — Fitting × Malzeme çapraz (FK fix lazım, Migration 066)
- `flansh_malzeme_uyum` — Flanş × Malzeme çapraz (Migration 067'de gelecek)

**Kullanım:** Spool kaydederken geçerli malzeme/ölçü kombinasyonları listesi gelir, kullanıcı seçer.

### Katman 2 — AI PARSER SÖZLÜĞÜ (Bu belge dışında)

**Amaç:** "AI'ın çıkardığı kod anlamlı bir malzeme adı mı?" sorusunun tanıma sözlüğü.

**Tablolar:**
- `endustri_malzemeler` (36 satır) — EN/DIN/W.Nr kodları (P235GH, S235JR, 1.0345, vb.)
- `endustri_form_astm` (78 satır) — ASTM kodları (A106-B, A312-TP304L, vb.)

**Kullanım:** `api/izometri-oku.js` → `malzemeTaninir()` fonksiyonu PDF'ten çıkan kodu burada arar. Yoksa "malzeme_bilinmeyen" uyarısı düşer, spool manuel onaya gider.

**Bu belge bu tabloları yönetmez.** Ayrı amaç, ayrı yaşam.

### Katman 3 — RUNTIME (Bu belge dışında)

**Amaç:** Aktif spool/pipeline kayıtlarının malzeme bağlantısı.

**Tablolar:**
- `malzeme_tanimlari` (13 satır) — `spool_malzemeleri.malzeme_ref_id` + `pipeline_malzemeleri.malzeme_ref_id` FK hedefi

**Kullanım:** Spool detay sayfasında "bu spool'un malzemesi" bağlantısını çözer.

**Bu belge bu tabloyu yönetmez.** Ayrı amaç, ayrı yaşam.

### Üç Katman Aynı Şeyi Saklıyor mu?

Kısmen. Örneğin "ASTM A106 Grade B" kavramı üç farklı tabloda **farklı formatta** geçer:
- `malzeme_kataloglari.spec_kodu = 'ASTM A106 B'`
- `endustri_form_astm.astm_kodu = 'A106-B'`
- `malzeme_tanimlari.kalite_kod = 'A106B'`

Senkronize değiller. Birleştirme önerildi (91'de), ama karar **şimdilik ayrı kalsın, lazımsa duruyor**. Birleştirme 95+ oturum projesi olabilir.

---

## 3. Standart Aileleri (6 Aile — 91'de Genişletildi)

Tersaneye gelen gemiler her köşeden geliyor. Bu 6 aile **iskelet olarak hazır olmalı**, içerik karşılaşıldıkça doldurulur.

| Aile | Köken | Hangi Tip Geminin Borularında | Anahtar Standartlar (boru/fitting/flanş) |
|---|---|---|---|
| **ASME** | ABD | Amerikan inşa, dünya genelinde yaygın | Boru: B36.10M/B36.19M · Fitting: B16.9/B16.11/B16.28 · Flanş: B16.5/B16.47 |
| **EN** | Avrupa Birliği | AB tersaneleri, modern gemilerin çoğu | Boru: EN 10216/10217 · Fitting: EN 10253 · Flanş: EN 1092-1 |
| **DIN** | Almanya | Gemi sektöründe çok yaygın, özellikle CuNi | Boru: DIN 2448, 86019 · Flanş: DIN 86087/88 · Fitting: DIN 86089 |
| **GOST** | Rusya | Rus armatörler, Sovyet/Rus inşa gemiler | Boru: GOST 8732 (sıcak haddelenmiş), 8734 (soğuk çekme) · Fitting: GOST 17375 · Flanş: GOST 33259 |
| **JIS** | Japonya | Japon armatörler, Japon inşa gemiler | Boru: JIS G3454 (basınç servisi) · Fitting: JIS B2311/B2312 · Flanş: JIS B2220 |
| **GB/T** | Çin | Çin inşa gemiler (yaygınlaşıyor), Çin tersanelerinden bakıma gelenler | Boru: GB/T 8163 · Fitting: GB/T 12459 · Flanş: GB/T 9112 |

**Not:** İskelet hazır = `boru_olculer.standart = 'GOST 8732'` satır eklenebilir, ama içeriği (çap-et matrisi) **karşılaşıldığında** dolar. Süper Admin'de görünür ama "0 / iskelet hazır" gösterir.

---

## 4. Malzeme Grupları (7 Grup)

AresPipe gemi sektörü odaklı olduğu için boru, fitting, flanş kapsamında çalışır. Vana, armatür, montaj malzemeleri kapsam dışıdır (Bölüm 9'da detay).

### 1. Karbon Çelik

**Tipik kullanım:** Genel basınç hatları, yapısal borulama, ısıtma sistemleri.

**Borular:**
- ASTM A106 (Grade A, B, C) — Yüksek sıcaklık dikişsiz
- ASTM A53 — Düşük basınç, dikişsiz veya kaynaklı
- ASTM A333 — Düşük sıcaklık servisi
- API 5L — Hat borusu
- EN 10216 (dikişsiz), EN 10217 (kaynaklı)

**Fittings:**
- Buttweld: ASTM A234 (WPB, WPC, WP12, WP22), A420, A860
- Forged: ASTM A105, A350 (LF1, LF2), A182 (F1, F2, F11, F22)
- EN/DIN eşdeğerleri: EN 10253, EN 10222

**Flanşlar:**
- ASTM A105, A350, A694
- EN 1092-1, DIN eşdeğerleri

**Öncelik: P0 🔴**

### 2. Paslanmaz Çelik (Austenitik)

**Tipik kullanım:** Gıda sınıfı, kimyasal hatlar, sıhhi tesisat.

**Borular:**
- ASTM A312 (TP304/L, TP316/L, TP321, TP347)
- ASTM A358 — Elektrik füzyon kaynaklı yüksek sıcaklık
- EN 10216-5

**Fittings:**
- ASTM A403 (WP304/L, WP310S, WP316/L)
- ASTM A182 (F304/L, F316/L, F321, F347)

**Flanşlar:**
- ASTM A182 (F304/L, F316/L)
- EN 1092-1

**Öncelik: P0 🔴**

### 3. Bakır-Nikel (CuNi) — Gemi İçin Kritik

**Tipik kullanım:** Deniz suyu sistemleri (soğutma, ballast, bilge, yangın hattı), izabe direnci yüksek.

**Borular:**
- ASTM B466 — Dikişsiz CuNi (C70600 = 90/10, C71500 = 70/30)
- ASTM B467 — Kaynaklı CuNi
- DIN 86019 — Alman gemicilik standardı
- EEMUA 144/146 — İngiliz petrol-deniz endüstrisi

**Fittings:**
- ASTM B122, B171, B151, B466, B467
- DIN 86087, 86088, 86089, 86090
- EEMUA 145, 146

**Flanşlar:**
- ASTM B151, DIN 86087/86088, EEMUA 145

**Öncelik: P0 🔴** — Tersane sektörü için kritik. Her gemide deniz suyu sistemi var.

### 4. Duplex ve Super Duplex

**Tipik kullanım:** Korozif servis, ofshore, kimyasal.

**Borular:**
- ASTM A790 — Duplex (S31803/S32205), super duplex (S32750/S32760)
- ASTM A928 — Elektrik füzyon kaynaklı

**Fittings:**
- ASTM A815 (WP-S31803, WP-S32750), A182 (F51, F53, F55)

**Öncelik: P2 🟡**

### 5. Alüminyum

**Tipik kullanım:** Hafif yapı, yat, lüks gemi, üst yapı.

**Borular ve fittings:**
- 5083, 6061, 6063 alaşımları
- ASTM B210, B241, B361

**Öncelik: P2 🟡**

### 6. Alaşımlı Çelik

**Tipik kullanım:** Yüksek sıcaklık (HT) hatları, buhar boruları.

**Borular:**
- ASTM A335 (P11, P22, P91) — Yüksek sıcaklık dikişsiz alaşımlı

**Fittings:**
- ASTM A234 WP11/WP22, A182 F11/F22

**Öncelik: P1 🟠**

### 7. Nikel Alaşım

**Tipik kullanım:** Özel kimyasal, korozif aşırı şartlar, nadir.

**Borular ve fittings:**
- Inconel (600, 625, 718)
- Hastelloy (C-276, C-22)
- Monel (400, K-500)

**Öncelik: P3 ⚪** — Karşılaşıldığında eklenecek.

---

## 5. Parça Tipleri

### 5.1. Boru — `boru_olculer`

Tek tip: **Pipe** (çıplak boru kesidi).

Karakterize edilen kolonlar:
- Geometri: `dn`, `dis_cap_mm`, `et_mm`, `schedule_kod`
- Hesaplı: `ic_cap_mm`, `agirlik_kg_m`, `hacim_l_m`, `yuzey_alan_dis_m2_m`
- Standart: `standart`, `malzeme_grubu`
- Toleranslar: `tolerans_et_yuzde`, `et_min_mm`, `et_max_mm`
- Edisyon: `edisyon_yili`, `gecerlilik_basla`, `gecerlilik_bitis`

### 5.2. Fitting — `fitting_olculer` (23 Tip — 91'de Genişletildi)

| # | Türkçe Adı | Kod | İngilizce | Not |
|---:|---|---|---|---|
| 1 | Dirsek (90° LR) | `90_LR` | 90° Long Radius Elbow | Yarıçap 1.5×D, en yaygın |
| 2 | Dirsek (90° SR) | `90_SR` | 90° Short Radius Elbow | Yarıçap 1×D |
| 3 | Dirsek (45°) | `45_LR` | 45° Long Radius Elbow | |
| 4 | Dirsek (3D) | `90_3D` | 3D Radius Elbow | Yarıçap 3×D, akış kritik |
| 5 | Dönüş (180° LR) | `180_LR` | 180° Long Radius Return | U-dönüşü |
| 6 | Dönüş (180° SR) | `180_SR` | 180° Short Radius Return | U-dönüşü, dar |
| 7 | Tee (eşit) | `tee_eq` | Equal Tee | Üç ucu aynı çap |
| 8 | Tee (redüksiyonlu) | `tee_red` | Reducing Tee | Branch küçük |
| 9 | Cross (eşit) | `cross_eq` | Equal Cross | Dört ucu aynı çap |
| 10 | Cross (redüksiyonlu) | `cross_red` | Reducing Cross | Branch küçük |
| 11 | Redüksiyon (konsantrik) | `red_conc` | Concentric Reducer | Merkezleri aynı |
| 12 | Redüksiyon (eksantrik) | `red_ecc` | Eccentric Reducer | Merkezler kaçık (boşaltma için) |
| 13 | Cap (kör kapak) | `cap` | Cap | Boru ucu kapatma |
| 14 | Bilezik (uzun) | `stub_long` | Lap Joint Stub End — Long | LJ flanş ile birlikte |
| 15 | Bilezik (kısa) | `stub_short` | Lap Joint Stub End — Short | LJ flanş ile birlikte |
| 16 | Manşon (kaynaklı) | `manson_butt` | Buttweld Coupling | Boru-boru birleştirme |
| 17 | Manşon (soketli) | `manson_sw` | Socket Weld Coupling | Küçük çap birleştirme |
| 18 | Manşon (dişli) | `manson_th` | Threaded Coupling | Dişli birleştirme |
| 19 | Nipel | `nipel` | Pipe Nipple | Kısa boru parçası |
| 20 | Half Coupling | `half_coupling` | Half Coupling | Branch outlet |
| 21 | Olet (kaynaklı) | `weldolet` | Weldolet | Pipe-on-pipe branch |
| 22 | Olet (soketli) | `sockolet` | Sockolet | Socket weld branch |
| 23 | Olet (dişli) | `thredolet` | Thredolet | Threaded branch |

**Not:** Bu liste **iskelet evreni**. Her tipin altına ASME/EN/DIN/GOST/JIS/GB/T varyantları (6 aile × ölçü matrisi) tablo yapısında durabilir. İçerik karşılaşıldıkça dolar.

### 5.3. Flanş — `flansh_olculer` (11 Tip — 91'de Genişletildi)

| # | Türkçe Adı | Kod | İngilizce | Not |
|---:|---|---|---|---|
| 1 | Weld Neck | `WN` | Weld Neck | Kaynak boyunlu, yüksek basınç |
| 2 | Slip-On | `SO` | Slip-On | Boru üzerine kayan |
| 3 | Blind | `BL` | Blind | Kör (kapalı) |
| 4 | Socket Weld | `SW` | Socket Weld | Soket kaynaklı (küçük çap) |
| 5 | Lap Joint | `LJ` | Lap Joint | Bilezikli (gevşek flanş) |
| 6 | Threaded | `TH` | Threaded | Dişli |
| 7 | Ring Type Joint | `RTJ` | Ring Type Joint | Sızdırmazlık halkası ile (yüksek basınç) |
| 8 | Reducing | `RED` | Reducing Flange | Redüksiyonlu flanş |
| 9 | Spectacle | `SPEC` | Spectacle Blind | Gözlük şekli (açma/kapama) |
| 10 | Orifice | `ORF` | Orifice Flange | Akış ölçüm |
| 11 | Double Stud Adapter | `DSAF` | Double Studded Adapter Flange | İki farklı bolt pattern'ı tek parçada birleştirir (örn. ASME B16.5 ↔ API 6A). Offshore/yüksek basınç adaptasyonu. Sahada "Dublin flanş" olarak geçer (Türkçe sektörel jargon). |

**Sınıflar (ASME B16.5):** 150, 300, 600, 900, 1500, 2500
**Sınıflar (EN 1092-1):** PN6, 10, 16, 25, 40, 63, 100, 160, 250, 320, 400

---

## 6. Özel Üretim Ölçüler (91'de Reset)

### v2'nin `ozel_parcalar` Yaklaşımı Kaldırıldı

v2'de "coupling sleeve, custom fitting, reinforcement sleeve" için **`ozel_parcalar` ayrı tablosu** öneriliyordu. v3'te bu yaklaşım **iptal edildi**.

### v3 Yaklaşımı: Aynı Tablo + Bayrak

Cihat'ın saha gözlemi (91): *"Standart 3mm var, 7mm var, ama 4.5mm ara ölçü kullanılıyor — ağırlıktan kaçmak için."*

Bu **standart dışı bir parça türü değil**, **standart ölçü tablosunun dışına çıkmış ölçüdür**. Yani aynı `boru_olculer` tablosunda yer alabilir, sadece bayrak farkıyla:

```sql
boru_olculer satırı (özel üretim örneği):
  standart      = 'ASME B36.10M'     -- en yakın standart sınıflandırma
  dn            = 100
  dis_cap_mm    = 114.3
  schedule_kod  = 'OZEL_4_5MM'        -- özel etiket
  et_mm         = 4.5
  sistem_preset = false               -- !!! anahtar bayrak
  tenant_id     = <hangi tersane>     -- !!! kim ekledi
  kaynak        = 'sahada_olculdu'    -- !!! veri kaynağı
  notlar        = '4" CS, NB1234 projesinde karşılaşıldı, ağırlık optimizasyonu'
```

### Pratik Akış

1. Spool parse edildiğinde, AI ölçüyü çıkarır
2. Sistem önce `sistem_preset = true` (kütüphane standardı) içinde arar
3. Bulamazsa `sistem_preset = false AND tenant_id = X` (sahaya özel) içinde arar
4. Yine bulamazsa "bekleyen öneri" akışına düşer (`tanimsiz_kayitlar`)
5. Süper Admin "Kütüphaneye ekle" derse → `sistem_preset = false` kayıt oluşur
6. Çok yaygın hale gelirse (>5 tersane kullanıyorsa) → `sistem_preset = true`'ya promote edilebilir (manuel karar)

### KARAR-90.D ile Uyum

90'da Cihat'ın söylediği: *"Standartta varsa zaten tabloda. Eksikse migration ile yüklenir, manuel riskli."*

v3 yaklaşımı bu karara **uygundur**:
- **Manuel ekleme yapılmaz** → form yok
- **Sahadan dahil edilir** → spool parse → tanınmıyor → öneri → onay → eklenir
- Süper Admin'in **onaylama** rolü var, **manuel girme** rolü yok

### Aynı Mantık Fitting ve Flanş İçin

`fitting_olculer` ve `flansh_olculer` aynı bayrak şemasını kullanır:
- `sistem_preset = true` → kütüphane standardı (6 aile)
- `sistem_preset = false` → tenant'a özel (sahadan eklenmiş)

---

## 7. DB Tabloları (Kütüphane'nin Kendi Tabloları)

### 7.1. `malzeme_kataloglari` — Master Spec

Her malzeme spec + grade'i tek satır. Tüm geometri tabloları çapraz uyum üzerinden buraya bağlanır.

Anahtar kolonlar:
- `spec_kodu` — "ASTM A106 B", "EN P235GH", vb.
- `spec_standart`, `spec_grade`, `aile`
- `malzeme_grubu` — karbon/paslanmaz/cuni/duplex/aluminyum/alasimli/nikel
- `uygun_boru`, `uygun_fitting_buttweld`, `uygun_fitting_forged`, `uygun_flansh` (boolean)
- Fiziksel: `yogunluk_kg_m3`, `cekme_mukavemeti_min_mpa`, `akma_mukavemeti_min_mpa`
- Servis: `sicaklik_min_c`, `sicaklik_max_c`, `korozyon_notlari`
- UI: `goster_etiket`, `aciklama_tr`, `aciklama_en`

Hedef satır sayısı: ~120 (6 aile × ortalama 20 spec). Mevcut: 20.

### 7.2. `boru_olculer` — Boru Geometrisi

Geometri tablosu. 28 kolon (geometri + tolerans + hesaplı + edisyon + meta).

Mevcut: 450 satır.

### 7.3. `fitting_olculer` — Fitting Geometrisi

Geometri tablosu. 39 kolon (parça tipine göre değişen geometri kolonları + meta).

Mevcut: 569 satır (sadece ASME B16.9 ve B16.11).

### 7.4. `flansh_olculer` — Flanş Geometrisi

Geometri tablosu. 31 kolon (boyut, bolt, hub, raised face, meta).

Mevcut: 308 satır (sadece ASME B16.5 ve EN 1092-1).

### 7.5. Çapraz Uyum Tabloları (Migration 066-067'de Gelecek)

**`boru_malzeme_uyum`** (yeni — Migration 067):
```
boru_id        uuid → boru_olculer
malzeme_id     uuid → malzeme_kataloglari
uretim_yontemi text (seamless / welded)
yaygin_mi      boolean
notlar         text
PRIMARY KEY (boru_id, malzeme_id)
```

**`fitting_malzeme_uyum`** (mevcut, FK bug fix lazım — Migration 066):
```
fitting_id     uuid → fitting_olculer
malzeme_id     uuid → malzeme_kataloglari   ← şu an malzeme_tanimlari'ya yanlış bağlı!
uretim_yontemi text (buttweld / forged / seamless)
yaygin_mi      boolean
notlar         text
PRIMARY KEY (fitting_id, malzeme_id)
```

**`flansh_malzeme_uyum`** (yeni — Migration 067):
```
flansh_id      uuid → flansh_olculer
malzeme_id     uuid → malzeme_kataloglari
uretim_yontemi text (forged / cast)
yaygin_mi      boolean
notlar         text
PRIMARY KEY (flansh_id, malzeme_id)
```

Hedef satır sayısı: organik (50 spool sonra ~500 satır, karşılaşıldıkça dolar).

---

## 8. Kütüphane Dışı Tablolar (Sadece Referans, Bu Belge Yönetmez)

Kütüphanenin **3-katman mimarisi** gereği aşağıdaki tablolar **kütüphane dışı** kabul edilir. Yönetimleri ayrı, amaçları ayrı, bu belge dokunmaz. Sadece varlıklarını dokümante eder:

### 8.1. AI Parser Sözlüğü (Katman 2)

| Tablo | Satır | Amaç | FK Çağıran |
|---|---:|---|---|
| `endustri_malzemeler` | 36 | EN/DIN/W.Nr kodları tanıma | `api/izometri-oku.js:1325` |
| `endustri_form_astm` | 78 | ASTM kodları tanıma | `api/izometri-oku.js:1280, 1329` |

**Önemli (91 dersi):** Bu tablolar 91. oturum öncesinde `arsiv` schema'sına taşınmıştı. İzometri parse akışı sessiz şekilde "her malzeme bilinmeyen" işaretledi (35 batch boyunca). 91'de `public` schema'ya geri taşındı. **Bir daha dokunulmamalı.**

### 8.2. Runtime İlişki (Katman 3)

| Tablo | Satır | Amaç | FK Çağıran |
|---|---:|---|---|
| `malzeme_tanimlari` | 13 | Spool/pipeline malzeme bağlantıları | `spool_malzemeleri.malzeme_ref_id`, `pipeline_malzemeleri.malzeme_ref_id` |

**Önemli:** Aktif sistem buna canlı bağımlı. Silinmez. 95+ oturumda `malzeme_kataloglari`'ya migration düşünülebilir, ama 91-92'nin işi değil.

### 8.3. Lazımsa Kalsın Prensibi (91 — Cihat'ın kararı)

> *"Lazımsa kalsın, niye kaldıralım."* — Cihat, 91. oturum

Yukarıdaki 3 tablo (endustri_malzemeler + endustri_form_astm + malzeme_tanimlari) **dokunulmaz**, sessizce çalışır. Birleştirme planı yok.

---

## 9. Kapsam Dışı (Önemli Sınırlama)

Aşağıdakiler **bilinçli olarak** dışarıdadır:

- **Vana** (ASME B16.34, EN 13709, GOST 21345...)
- **Armatür** (ölçer, gösterge, regülatör)
- **Montaj malzemeleri** (cıvata, somun, conta, balata)
- **İzolasyon malzemeleri**
- **Boya ve kaplama**
- **Borulama dışı** (HVAC kanalları, kablo trayleri, structural çelik)
- **Mekanik couplings** (Victaulic, Gruvlok, Straub gibi patentli sistemler)

**Tetik koşulu:** İhtiyaç olunca eklenir. Pilot tersane vana takibi isterse Vana modülü açılır, bu belge genişletilir.

---

## 10. Veri Kaynak Yolları (Yasal)

İçerik doldurma için kabul edilen kaynaklar:

### a. Üretici Katalogları (en pratik)
- Octal Pipe Fittings, Haihao, Sandvik, Vallourec, Tubacex (P0)
- Üretici PDF, ASME/EN ölçüleri birebir
- Birden fazla kataloğu çapraz kontrol = doğruluk garantisi

### b. Açık Kaynak Datasetler
- GitHub: pipe-fitting-data, pipe-data
- FreeCAD pipe library, NIST açık verileri
- Lisans: MIT/CC, yasal

### c. Sektörel Kaynaklar (en kaliteli)
- Wermac.org — ASME B16.5 inç tablolar (43'te kullanıldı)
- Ferrobend.com — Çapraz teyit
- OSE-piping-workbench (rkrenzler) — Fitting/pipe CSV (LGPL kod, sayısal veri telif dışı)

### d. Tersane Excel/PDF (en kaliteli)
- Tersanenin yıllar içinde topladığı tablolar
- Zaten doğrulanmış, kullanılan değerler

### e. ASME Standardı (opsiyonel, lisanslı)
- $1500-2000 yatırım, gerek yok
- Üreticiler ASME ölçüsünü zaten basıyor

### f. Sahadan Organik Toplama
- Pilot ilk spool girdiğinde, tanınmayan parçalar `tanimsiz_kayitlar` akışına düşer
- Süper Admin onayıyla `sistem_preset=false` kütüphaneye eklenir
- Çok yaygınlaşırsa `sistem_preset=true`'ya promote

---

## 11. Doldurma Stratejisi

### Aşama 1: DB Schema Migration

Tabloların iskeleti kurulur, 6 aile × parça tipleri × malzeme grupları için tablo yapısı hazırlanır. **İçerik boş** veya çok az test verisi.

**Durum:** Tamam (boru/fitting/flansh için yapılar mevcut). Çapraz uyum tabloları Migration 066-067'de tamamlanacak.

### Aşama 2: P0 İskelet Seed

6 aile için "boş ama tanınır" satırlar eklenir:
- `boru_olculer.standart = 'GOST 8732'` × birkaç DN örneği
- `fitting_olculer.standart = 'JIS B2311'` × birkaç boyut örneği
- vb.

Süper Admin'de "GOST 8732 — 0/iskelet hazır" görünür, dolduğunda otomatik aktif.

**Tahmini iş:** 93-94 oturumlarında.

### Aşama 3: AI-Asistanlı Çıkarım (Karşılaşma Bazlı)

Pilot tersane bir gemi PDF'i yüklediğinde:
1. AI okur, malzeme + ölçü çıkarır
2. Sistem kütüphanede arar
3. Bulamazsa `tanimsiz_kayitlar`'a düşer
4. Süper Admin onay verir
5. Otomatik INSERT yapılır

**Bir spool:** ~30 sn AI parse + ~5 dk Süper Admin onay
**Bir gemi:** 100 spool × 5 dk = ~8 saat kütüphane büyütme emeği (gemi başına bir kez)

### Aşama 4: Spool Akışına Entegrasyon

Lambda v4 prompt'u parametrik çıktı verecek şekilde:
- AI çıktısı → `malzeme_kataloglari.spec_kodu` ile fuzzy match
- Eşleşmezse "kütüphaneye ekle" akışı
- Eşleşirse otomatik FK bağlanır

### Aşama 5: Yönetim UI (Generic Tablo Tarayıcısı)

`kutuphane-tablo.html` (93+ oturumda):
- Tek sayfa, URL parametresi ile her tablo
- DB şemasından otomatik kolonlar
- Filtre + arama + sıralama otomatik
- Tablo başına UI metadata konfigi

### Aşama 6: Spec Sistemi (96+ Vizyon)

`tenant_spec_seti` + `spec_kural` (AVEVA-vari):
- Tersane bazlı parça alt kümeleri
- Yeni proje girişi otomatik filtrelenir

**Tetik:** İkinci tersane geldiğinde — şu an pilot tek tersane, mantık zaten tek-spec.

---

## 12. Açık Notlar ve Dersler

### İskelet + Organik İçerik (91)

Tam sayıyla bilmek yerine kapsayıcı yapı kur. Standart aileler iskelet olarak hazır, içerik karşılaştıkça dolar. "11.000 satıra ulaş" hedef değildir.

### Geometri × Malzeme Ayrımı (43 dersi)

Tek geometri × birden fazla malzeme = M:N çapraz uyum tablosu. A105 için yazılan flanş ölçüsü F304 için tekrar yazılmaz.

### "Önce Kullanım Haritası, Sonra Silme" Kuralı (91 dersi)

`endustri_*` tabloları olmasaydı 35 batch sessizce kırık çalışıyordu. Tablo silmek için **kanıt zorunlu**, sezgi yetersiz.

### Sistem Preset vs Tenant Özel (90-91)

- `sistem_preset = true` → kütüphane standardı (6 aile)
- `sistem_preset = false` → tenant'a özel (sahadan eklenmiş, geçici)
- Promote: tenant özel çok yaygınlaşırsa sistem preset'e taşı

### Tetik Koşullu Büyüme (40 prensibi, 91'de doğrulandı)

Hiçbir tablo "tam kapsam" hedefiyle doldurulmaz. Karşılaşıldıkça, ihtiyaç çıktıkça büyür. "12.000 satıra ulaş" hedef değildir.

### "Lazımsa Kalsın" (91 — Cihat)

Kullanımı belirsiz tabloları silme. `grep -rn` ile aktif kullanım kanıtlanmazsa dokunma. Süper Admin'den gizlenmek mümkün, silmek değil.

---

> **Bu belge canlı tutulur.** Her büyük revize yeni versiyon (v4, v5...) olur. Önceki versiyonlar değiştirilmez, üzerine yazılır. 91'de v3'e çıkarken v2 silindi (tek dosya, git history yedek).
>
> v3 — 91. oturum — 15 Mayıs 2026
