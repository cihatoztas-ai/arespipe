# CLAUDE — 79. Oturum (12 Mayıs 2026)

> 78 → 79 fitting cephesi sıçraması. fitting_olculer +145 satır, iki yeni cephe (B16.11 SW + B16.9 stub_end), naming hijyeni, ağırlık doluluğu 3.5 kat. Aynı zamanda **ağırlık tasarımı** sistematik konuya dönüştü.

---

## Ana Tema

Dört çizgide ilerleme:

1. **B16.11 SW fitting cephesi açıldı** — ikinci ana standart, 7 parça tipi, 105 satır β (046 ALTER + 047 INSERT)
2. **B16.9 stub_end** — 76'dan açık borç kapatıldı, 6. parça tipi B16.9 cephesinde (048)
3. **Naming hijyeni** — geometri_std prefix tutarlılığı sağlandı (48'de UPDATE 424)
4. **Ağırlık tasarımı sistemleşti** — boru kanonik formül, fitting tablo + kaynak işareti (049'da 83 UPDATE)

---

## Açılış — 78 Envanteri

`git pull` çıktısı `b87ef05 docs(78): kapanis uclusu` mesajıyla geldi. Üç dosya: son-durum, CLAUDE-SON-OTURUM, CLAUDE-SONRAKI-OTURUM hepsi 78 sonu pattern'ında doğru. MK-78.3 disiplini ilk meyvesini verdi — 79 doğru belge ile başladı, 77'deki gibi eski belgeden bilgi okumadık.

CLAUDE-SONRAKI-OTURUM.md 5 yol veriyordu (A: PN 25 paketi, B: Stub End, C: düşük sıcaklık karbon, D: B16.11 socket, E: hijyen). Cihat "büyük D'yi yapalım" dedi — **Yol D: B16.11 socket fittings**.

---

## Migration 046 — fitting_olculer şema genişletme

### Şema kararı

İlk soru: B16.11 SW fittings B16.9 BW fittings ile aynı tabloda mı, ayrı tabloda mı? Mevcut `fitting_olculer` şema kontrolü yapıldı (Cihat'tan information_schema sorgusu). Sonuç: aynı tabloda. Çoğu kolon (et_mm, ucu_uca_a_mm, ucu_uca_h_mm, vs.) aynı geometri için kullanılabiliyor. Sadece B16.11'e özgü 3 kolon eksikti.

3 yeni kolon eklendi:

- `class_no INTEGER` — B16.11 pressure class (2000/3000/6000/9000), B16.9 BW için NULL
- `soket_derinlik_mm NUMERIC` — J değeri (min depth of socket)
- `soket_ic_cap_mm NUMERIC` — B değeri (socket bore max = boru OD + tolerans)

class_no için CHECK constraint: `IS NULL OR IN (2000, 3000, 6000, 9000)`.

### CHECK constraint analizi

Önemli ön kontrol (MK-78.1 ruhu): mevcut CHECK constraint'leri sorguladık. Tek constraint var: `schedule_consistency` (schedule_tipi/deger/kod üçlüsü hep birlikte dolu veya hep birlikte NULL). parca_tipi üzerinde CHECK YOK — yeni SW parça tiplerini eklemek serbest. Bu plan hafifletti.

### Uygulama notu

İlk yapıştırmada SQL Editor satır 21'de "syntax error at TABLE" verdi. Önce dosyada syntax hatası sandık, `view` ile kontrol — dosya temiz. İkinci yapıştırma `cat | pbcopy` ile clipboard'a alıp editor'ı tamamen temizleyince çalıştı. **Ders: kısmi seçim veya editor'da kalan eski içerik silent şekilde hata verebilir; tam clipboard transferi güvenli.**

---

## Migration 047 — B16.11 SW fittings β

### β kapsam kararı

Wermac (primary), Skyland (cross-1), Ferrobend (cross-2) üç bağımsız kaynak. β kapsam evrimleşti:

Başlangıç önerisi (kapsamı geniş): NPS 1/8-4, Class 3000+6000, 8 parça tipi.

Önemli kısıt 1 (B16.11-2011 standart notu): **Class 6000 elbow/tee/cross sadece NPS 1/8-2**, NPS 2½+ standartta yok. Pipingpipeline'ın açıkladığı durum.

Önemli kısıt 2 (Wermac kapsamı): **Wermac NPS 1/2'den başlıyor**, NPS 1/8-3/8 Wermac'ta yok. Sadece bazı parça için Ferrobend NPS 1/8-3/8 verir. Veri tutarsızlığı riski.

Pragmatik β-v2 (final): **NPS 1/2 → 4 (Class 3000) + NPS 1/2 → 2 (Class 6000), 7 parça tipi**, reducing coupling γ'ya. NPS 1/8-3/8 γ'ya (instrument lines, gemi tersane ana hatları NPS 1/2+).

### 7 parça tipi

- `90SW` — 90° socket weld elbow
- `45SW` — 45° socket weld elbow
- `tee_eq_sw` — equal tee SW
- `cross_sw` — equal cross SW (yeni cephe — B16.9'da `cross` yok)
- `coupling_full` — full coupling (yeni cephe)
- `coupling_half` — half coupling (yeni cephe)
- `cap_sw` — socket weld cap

İsimlendirme kararı (KARAR-79.2): mevcut B16.9 stilini izle (`90LR`, `45LR` pattern'ı → `90SW`, `45SW`). geometri_std='ASME B16.11' filtresi ile ayrım. `tee_eq` (B16.9 BW) vs `tee_eq_sw` (B16.11 SW), `cap` vs `cap_sw` — isim çakışması yok.

### Pattern özellikleri

- Socket bore (B) ve depth (J) Class-bağımsız (sadece NPS'ye bağlı sabit)
- Body wall G Class-bağlı (Class 6000 daha kalın)
- A (center-to-bottom) parça-tipi-bağlı (90° vs 45°, ama 90° ile tee/cross aynı)
- Cap için cap_dia_mm (R) ayrı kolon olmadığı için notlar JSON'a koyuldu: `{"cap_dia_mm": R}`

### Sonuç

105 satır INSERT (Class 3000=63 + Class 6000=42). Spot check DN 50 90SW Class 3000 → et=5.55, A=38.0, J=16, B=61.35 (Wermac bire-bir).

İkinci yeni standart cephesi açıldı (B16.5 ve B16.9 yanına B16.11).

---

## Migration 048 — Naming Hijyeni + B16.9 stub_end

### Tetikleyici

Cihat'a "hangi cephe boş, hangi cephe dolu?" diye ağırlık dağılımı sordum. SELECT FROM fitting_olculer GROUP BY geometri_std → çıktı:

```
ASME B16.11 → 105
B16.9       → 424
```

**Naming inconsistency.** 047'de doğru prefix kullanmıştım (`'ASME B16.11'`), ama eski 424 satır prefix'siz (`'B16.9'`). 33-50 oturumlar arasında eklenmiş, kontrol edilmemiş. Sistem genelinde standart `'ASME B16.5'`, `'EN-1092-1'` prefix'li — B16.9 da hizalanmalı.

### Plan: tek dosya, iki bölüm

48 migration'ı iki iş atomik yapacak:
1. UPDATE 424 → 'ASME B16.9' (hijyen)
2. INSERT stub_end (40 satır)

Hijyen UPDATE WHERE filtresiyle (geometri_std='B16.9') idempotent, ikinci kez 0 etkiler.

### stub_end kapsam (β)

Wermac + Skyland karşılaştırma:
- B16.9 long pattern (ASA): NPS 1/2-24, 20 NPS
- MSS SP-43 short pattern: aynı aralık, daha kısa F değeri
- NPS 22 Wermac'ta yok (Skyland var, T değeri eksik)

KARAR-79.3: β = long pattern, NPS 1/2-24, Schedule STD + XS. Short pattern γ'ya, NPS 22 γ'ya.

20 NPS × 2 schedule = 40 satır.

### Yeni pattern — schedule-bağımlı

stub_end mevcut B16.9 fittings'den farklı: **boru duvar kalınlığından üretilir, T (lap thickness) = pipe wall thickness**. Yani Schedule STD ile Schedule XS aynı NPS'de farklı T verir, farklı ağırlık.

Mevcut 90LR/tee_eq/cap **schedule-bağımsız** (ortalama bir tek değer, schedule_kod=NULL). Stub_end **schedule-bağımlı**: schedule_tipi='SCHEDULE', schedule_deger='STD' veya 'XS', schedule_kod aynı.

Idempotent NOT EXISTS bileşik anahtar **schedule_kod dahil** (`geometri_std + parca_tipi + cap_buyuk_dn + schedule_kod + tenant_id`).

### Ağırlık ilk defa dolu

Wermac stub_end tablosu **kg/parça veriyor** (47'deki SW sayfaları weight vermemişti). 40 stub_end satırı **agirlik_kg dolu** — bu sistemde **ilk weight-dolu fitting satırları**.

Sıralı sürpriz: önceki ağırlık taraması (sorgu fitting_olculer + flansh_olculer) gösterdi:
- B16.11: 105 dolu 0 (Wermac SW weight vermiyor)
- B16.9: 424 dolu 48 (33-50 arası eski 24'er 90LR/45LR satırından)
- Flansh B16.5: 216 dolu 104
- Flansh EN-1092-1: 92 dolu 31

**Toplam 654 satır ağırlık eksik.** Bu Cihat'tan kritik soru getirdi.

### Yan ders: pbcopy + zsh

Cihat 048 push komutunu yapıştırırken `pbcopy` bloğunda yorum (`# 1) MD5`) varmış. zsh `# 1)` satırını parantez yüzünden parse hatası verdi, sonraki komutları reddetti. Bu MK-79.1 oldu: çok-satır komut bloğunda shell yorumu kullanma.

### Sonuç

464 ASME B16.9 satır (424 eski + 40 stub_end), 105 ASME B16.11 satır. fitting_olculer 424 → 569. Stub_end DN 100 STD spot check: et=6.02, F=152.4, R=11.11, lap_t=6.02, G=157.2, kg=3.0 (Wermac bire-bir).

---

## Ağırlık Tasarımı (KARAR-79.5)

48 push edildikten sonra Cihat doğru bir soru sordu: **"Ağırlıkları hesap ile mi tablodan mı bulup yazmamız lazım?"**

Cevap kategori bazlı oluştu:

### Boru için: formül = tablo

ASME B36.10M boru tablosu **formülün kanonik üretimidir**. Boru saf silindir:
$$m/L = \rho \times \pi \times (D-t) \times t \quad \text{[kg/m]}$$

Spot check 10 örnek satır (DN 15/50/100/200/300 × STD/XS, karbon):

| DN | Schedule | DB | Formül | Sapma |
|---:|---|---:|---:|---:|
| 15 | STD | 1.270 | 1.2658 | +0.328% |
| 50 | STD | 5.440 | 5.4375 | +0.046% |
| 100 | STD | 16.080 | 16.0755 | +0.028% |
| 200 | STD | 42.550 | 42.5491 | +0.002% |
| 300 | XS | 97.440 | 97.4369 | +0.003% |

Tüm sapmalar **|%0.33|'ün altında**, çoğu **|%0.03|** — yuvarlama hatası seviyesi. Büyük çaplarda neredeyse 0.

**Sonuç: Boru ağırlıkları kanonik. Formül = tablo, doğrulandı.** `boru_olculer.agirlik_kg_m` NOT NULL kolon, 450 satırın hepsi zaten dolu, formülden üretilmiş. Yeni iş gerek yok.

### Fitting için: tablo + üretici-bağımlı

Fitting geometrisi karmaşık (kavis, lap, hub, transition radius). Formül ±%5-15 sapar. Wermac kendisi yazıyor:

> "ASME buttweld fitting specifications **do not specify weights** for fittings. Weights quoted ... are based on **manufacturers information** and should be considered as **approximate** ... **can vary considerably between manufacturers**."

Wermac → **Hackney Ladish** üretici tablolarını kullanıyor. Notlar JSON'a kaynak işareti zorunlu: ilerleyen oturumlarda farklı üretici tabloları (Octalsteel, ProjectMaterials, Tube Bend) gelirse karşılaştırma mümkün, hatta değişim yapılabilir.

### KARAR-79.5: Ağırlık iki kategoride

- **Boru için**: formül-bazlı (kanonik, %0.3 sapma), UPDATE m = ρ × π × (D-t) × t / 1000 kg/m
- **Fitting için**: tablo-bazlı (Wermac/Hackney Ladish primary, ±%5-15 üretici sapması)
- **notlar JSON pattern**: `{"kaynak": "...", "uretim_tarihi": "YYYY-MM", "agirlik_schedule_bagimli_kg": {"STD": x, "XS": y, "160": z, "XXS": w}}`. agirlik_kg ana kolonda STD değeri (mevcut 90LR/45LR pattern'iyle birebir uyumlu).

### MK-79.3: Boru ağırlık formül kanonik, fitting ağırlık üretici tablo

İkisini karıştırma. Boru için formül UPDATE, fitting için kaynak-bazlı UPDATE. İlerleyen iş için 80+ oturumlarda fitting ağırlık taraması — kategori-bazlı plan.

---

## Migration 049 — B16.9 Fitting Ağırlık Dolum

### Hedef

Wermac BW weight tablolarından 4 B16.9 parça tipi için ağırlık doldur. Eksik DN tarama sorgusu (MK-79.4 disiplini — string_agg ile eksik DN listesi) Wermac kapsamı dışı satırları gösterdi:

| Parça | DB eksik | Wermac doldurabilir | Wermac dışı (γ) |
|---|---:|---:|---:|
| 90LR | 9 | 0 | 9 (NPS 28+) |
| 45LR | 9 | 0 | 9 |
| 90_3D | 32 | 19 | 13 (küçük + büyük NPS) |
| 45_3D | 32 | 19 | 13 |
| tee_eq | 33 | 24 | 9 |
| cap | 33 | 21 | 12 |
| **TOPLAM** | **148** | **83** | **65** |

**90LR ve 45LR'in 9 eksik DN'i tamamen Wermac kapsamı dışı** (NPS 28, 32, 34, 38, 40+ DB'de DN 700, 800, 850, 950, 1000, 1050, 1100, 1150, 1200). Bunlara dokunulmadı, γ'ya kaldı.

### 4 UPDATE bloğu

Her parça tipi için ayrı UPDATE, VALUES inline + JSON notlar string olarak:

- **90_3D**: 19 satır (NPS 2-36)
- **45_3D**: 19 satır (NPS 2-36)
- **tee_eq**: 24 satır (NPS 1/2-36)
- **cap**: 21 satır (NPS 1-30)

İdempotent `WHERE agirlik_kg IS NULL` filtresi — ikinci çalıştırmada 0 etki.

### JSON pattern

Mevcut 90LR/45LR satırları (24'er, eski oturumlardan) `{"kaynak": "Wermac B16.9 elbow tablosu", "uretim_tarihi": "2026-05", "agirlik_schedule_bagimli_kg": {"STD": x, "XS": y, ...}}` formatında. 049 bu pattern'ı 4 parça tipine yaydı, sadece "elbow" yerine "3D elbow", "tee straight", "cap" yazıldı.

### Doğrulama

- Toplam: 83 ✓
- Dağılım: 45_3D 19/13, 45LR 24/9, 90_3D 19/13, 90LR 24/9, cap 21/12, tee_eq 24/9 ✓
- Spot cap DN 200 STD = 5.44 ✓ (Wermac bire-bir)

---

## Süreç Notları

### Disiplin Uygulamaları

- **4 push tamamı sorunsuz** (gp ile otomatik rebase, 79 yepyeni commit zinciri)
- **MD5 + satır + byte transfer doğrulaması** — her dosya için (4 SQL)
- **present_files** ile temiz transfer; Mac üstünde arespipe_kopyala protokolü
- **pbcopy ile temiz clipboard** — 046'da öğrenildi (editor'ı temizle, cat | pbcopy, yapıştır)
- **MK-78.3 disiplini** — kapanış üçlüsü (bu dosya o disiplinin parçası)

### Karar Yorgunluğu Yönetimi

79 büyük bir oturumdu (4 büyük migration + ağırlık tasarım kararı + spot doğrulamalar). β kapsamları sürekli revize edildi (B16.11 kapsamı Wermac kısıtları sebebiyle, stub_end NPS 22 cephesi, fitting ağırlık γ ayrımı). Her seferinde tablo formatında özet sunup karar Cihat'a bırakıldı.

Bir noktada Cihat haklı olarak sordu: "ağırlık tamamlama işi çok uzun mu sürecek, 7-8 oturum tutuyor, tablolar o kadar sürmedi". Tahmini revize ettim (5-6 → 3 oturum, çünkü Wermac tek site, pattern oturmuş). β+'ya çıkıldı, 148 satır hedefi.

### Cihat'ın doğru sorduğu sorular

- "Ağırlıkları hesap ile değil tablolardan bulup yazmamız lazım değil mi?" → kategori ayrımına götürdü (KARAR-79.5)
- "Bu ağırlık tamamlama işi çok uzun mu sürecek?" → realistik plan revizesine yol açtı (5-6 oturum → 3 oturum)
- "Boru ağırlıklarına güveniyorum. Birkaç tane kontrol edelim" → 10 örnek spot check yapıldı, %0.33 sapma görüldü, kanonik formül onaylandı

---

## Mimari Karar Kayıtları (MK) — 79'da doğan

- **MK-79.1:** `pbcopy` veya çok-satır komut bloğunda **shell yorumu (`#`) kullanma**. zsh parantezde parse hatası verir, sonraki komutları atlatır. 78'in "tek tırnak commit" dersinin yeni varyantı.

- **MK-79.2:** **Ağırlık notlar JSON pattern'i** standart: `{"kaynak": "...", "uretim_tarihi": "YYYY-MM", "agirlik_schedule_bagimli_kg": {"STD": x, "XS": y, "160": z, "XXS": w}}`. agirlik_kg ana kolonda STD değeri.

- **MK-79.3:** **Ağırlık ikiye bölünür** — boru için formül-kanonik (ASME B36.10M, %0.3 sapma), fitting için tablo-üretici (Wermac/Hackney Ladish, ±%5-15 sapma). İki kategori karıştırma.

- **MK-79.4:** **geometri_std prefix tutarlılığı** — sistem genelinde `'ASME B16.x'`, `'EN-1092-1'` formatı. Yeni veri öncesi mevcut prefix'leri kontrol et.

- **MK-79.5:** **Migration numarası için `ls migrations/ | tail -5` yeterli** (MK-78.1 güncelleme). Push edilmiş dosyalar dizinde olur, GitHub web UI'ye gerek yok.

- **KARAR-79.1:** B16.11 β kapsam → NPS 1/2-4 (Class 3000) + NPS 1/2-2 (Class 6000). Reducing coupling, threaded, Class 9000, NPS 1/8-3/8 → γ.

- **KARAR-79.2:** B16.11 parça tipi isimlendirme → mevcut B16.9 stili (90SW, 45SW, tee_eq_sw vb.). geometri_std ile ayrım.

- **KARAR-79.3:** B16.9 stub_end β → long pattern (B16.9), NPS 1/2-24, STD + XS. MSS SP-43 short pattern + NPS 22 → γ.

- **KARAR-79.4:** Schedule-bağımlı vs schedule-bağımsız — stub_end üçlüsü dolu, mevcut B16.9 elbow/tee/cap üçlüsü NULL. Ağırlık schedule farkı notlar JSON'a.

- **KARAR-79.5:** Ağırlık tasarımı — notlar JSON ile kaynak izi (uretici, tarih, schedule başına detay), agirlik_kg ana değer (boru formül, fitting Wermac STD).

---

## 80'a Hazırlık

Açık borç listesi (önceliğe göre):

**Ağırlık hijyeni cephesi (P0-P1):**

1. B16.11 SW ağırlık (105 satır) — pipingpipeline/ProjectMaterials
2. B16.9 reducer ağırlık (228 satır, kombinatif) — Wermac weights_bw_reducers
3. B16.9 γ ağırlık (65 satır, büyük NPS + 3D küçük) — ProjectMaterials/Octalsteel
4. Flansh ağırlık (173 satır, B16.5 112 + EN-1092-1 61) — ProjectMaterials/octalsteel
5. boru_olculer türetilmiş kolonlar (ic_cap_mm, hacim_l_m, yuzey_alan_dis_m2_m) — basit aritmetik UPDATE

**78'den taşınan:**

6. EN 1092-1 PN 25 paketi (60 satır)
7. M_K düşük sıcaklık karbon (A333+A420+A350 LF2)
8. B16.11 reducing coupling (kombinatif)
9. B16.11 threaded fittings (yeni cephe)
10. B16.9 stub_end MSS SP-43 short pattern
11. fitting_malzeme_uyum ilk script tasarımı

80 önerisi: **B16.11 SW ağırlık** ile başla (P0, ~45 dk-1 sa), pattern 049'la aynı yapı.

---

> 80. oturum açılışında bu dosya + `son-durum.md` + `CLAUDE-SONRAKI-OTURUM.md` okunacak.
