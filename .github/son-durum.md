# Son Durum — 79. Oturum (12 Mayıs 2026)

> 78'in devamı. fitting_olculer'da iki yeni cephe açıldı (B16.11 SW + B16.9 stub_end), naming hijyeni tamam, ağırlık dolum başladı. +145 yeni satır + 424 UPDATE (hijyen) + 83 UPDATE (ağırlık).

---

## Bu Oturumun Sonucu

**79 başarıyla kapatıldı.** 4 migration, 3 büyük cephe ilerlemesi:

- **046:** `fitting_olculer` şema genişletme — class_no, soket_derinlik_mm, soket_ic_cap_mm (3 yeni kolon + CHECK)
- **047:** B16.11 SW fittings β kapsam — 105 satır (7 parça × 2 Class)
- **048:** naming hijyeni (`'B16.9'` → `'ASME B16.9'`, 424 satır) + B16.9 stub_end (40 satır, ağırlık dolu)
- **049:** B16.9 fitting ağırlık dolum Wermac'tan — 83 satır UPDATE (90_3D + 45_3D + tee_eq + cap)

### Yapılanlar (sırasıyla)

**1. Yol D başlangıç — B16.11 socket weld fittings (Migration 046 + 047)**

- 046 ALTER TABLE: 3 yeni kolon (class_no INTEGER, soket_derinlik_mm NUMERIC, soket_ic_cap_mm NUMERIC) + class_no CHECK constraint (2000/3000/6000/9000/NULL)
- 047 INSERT: 7 parça tipi × 2 Class kombinasyonları
  - Class 3000: NPS 1/2-4 (9 DN) × 7 parça = 63 satır
  - Class 6000: NPS 1/2-2 (6 DN) × 7 parça = 42 satır
  - **TOPLAM: 105 satır**
- Yeni parça tipleri: `90SW`, `45SW`, `tee_eq_sw`, `cross_sw`, `coupling_full`, `coupling_half`, `cap_sw`
- Kaynaklar: Wermac (primary) + Skyland + Ferrobend cross-check
- KARAR-79.1: Reducing coupling β'dan çıktı (kombinatif matris, γ'ya kalır)
- Spot doğrulama: 90SW DN 50 Class 3000 → et=5.55, A=38.0, J=16, B=61.35 (Wermac bire-bir)

**2. Yol B + naming hijyeni — B16.9 stub_end (Migration 048)**

- Bölüm A: UPDATE 424 satır geometri_std `'B16.9'` → `'ASME B16.9'`
  - Tetikleyici: 047 yazıldığında `'ASME B16.11'` prefix kullanılmıştı, kontrol sırasında eski 424 B16.9 satırının prefix'siz olduğu görüldü
  - Sistem genelinde standart: `'ASME B16.5'`, `'ASME B16.11'`, `'EN-1092-1'` — tutarlılık için B16.9 da hizalandı
- Bölüm B: INSERT 40 stub_end satırı (NPS 1/2-24, Schedule STD + XS)
  - **agirlik_kg dolu** (Wermac kg/parça veriyor) — sistemde **ilk weight-dolu fitting satırları**
  - Schedule üçlüsü (tipi+deger+kod) dolu (CHECK constraint tetiklenmiyor)
  - Yeni pattern: stub_end schedule-bağımlı (et=boru duvarı, T schedule'a göre değişir); mevcut B16.9 fittings schedule-bağımsız

**3. Ağırlık tasarım kararı + boru doğrulama (oturum ortası)**

Cihat'tan kritik soru: "Ağırlıkları hesap mı tabloya mı dayalı dolduralım?" → KARAR-79.5:

- **Boru için formül = tablo (kanonik):** `m/L = ρ × π × (D-t) × t` formülü ASME B36.10M tablo değerlerini birebir üretiyor. Spot check'te 10 örnek satırda **|sapma| < %0.33** (büyük çaplarda %0.005), yuvarlama hatası seviyesinde. **Boru ağırlıkları %100 güvenilir, formül kanonik.**
- **Fitting için tablo öncelik:** Geometri karmaşık (kavis, lap, hub), formül ±%5-15 sapar. Üretici-bağımlı (Wermac kendisi yazıyor: *"approximate, can vary considerably between manufacturers"*; Wermac → Hackney Ladish üretici tablolarını kullanıyor).
- **Pattern:** notlar TEXT alanında JSON `{"kaynak": ..., "uretim_tarihi": ..., "agirlik_schedule_bagimli_kg": {"STD": x, "XS": y, ...}}`. agirlik_kg = STD değeri (mevcut 90LR/45LR pattern'i ile bire-bir uyumlu).

Önceki ağırlık-eksikliği taraması:

| Tablo / Cephe | Toplam | Dolu | Eksik |
|---|---:|---:|---:|
| fitting_olculer B16.11 | 105 | 0 | 105 |
| fitting_olculer B16.9 | 424 → 464 | 48 → 88 (stub_end +40) | 376 |
| flansh_olculer B16.5 | 216 | 104 | 112 |
| flansh_olculer EN-1092-1 | 92 | 31 | 61 |

**4. B16.9 fitting ağırlık dolum (Migration 049) — 83 satır UPDATE**

Wermac BW weight tablolarından (Hackney Ladish):

| Parça | UPDATE | Kapsam |
|---|---:|---|
| 90_3D | 19 | NPS 2-36 (DN 50-900), Wermac 3D elbow tablosu |
| 45_3D | 19 | NPS 2-36, 3D elbow tablosu |
| tee_eq | 24 | NPS 1/2-36 (DN 15-900), straight tees tablosu |
| cap | 21 | NPS 1-30 (DN 25-750), dim_caps weight |

**γ'ya kalan (Wermac kapsam dışı, 80 için):**
- 90LR + 45LR: 9'ar satır (NPS 28+ → DN 700, 800, 850, 950, 1000-1200) — Wermac büyük NPS vermiyor
- 90_3D + 45_3D: 13'er satır (NPS küçük DN 20-40 + NPS büyük DN 700+)
- tee_eq: 9 satır (büyük NPS)
- cap: 12 satır (DN 15, 20 küçük + büyük NPS)
- **TOPLAM γ: 65 satır** — ProjectMaterials, Octalsteel, MSS-SP-43 ek kaynaklar

### Canlı Doğrulamalar

- ✅ 046: fitting_olculer 3 yeni kolon mevcut, 424 eski satır class_no=NULL korundu
- ✅ 047: 7 parça × 2 Class = 14 grup × beklenen sayım (3000=9, 6000=6) tam
- ✅ 048: geometri_std 'B16.9' yok → 'ASME B16.9'=464, 'ASME B16.11'=105; stub_end STD=20, XS=20; DN 100 STD spot bire-bir Wermac
- ✅ 049: 83 satır UPDATE, dağılım tam (3D 19/13, tee 24/9, cap 21/12), cap DN 200 STD = 5.44
- ✅ Boru ağırlık doğrulama: 10 örnek satır × |sapma| < %0.33 (büyük çaplarda neredeyse 0)

---

## Commit'ler (79. Oturumda)

| Hash | Mesaj |
|------|-------|
| `bb9caf1` | data(79): 046 alter fitting_olculer - B16.11 kolonlari (class_no, soket_derinlik, soket_ic_cap) |
| `89fd4ad` | data(79): 047 B16.11 SW fittings beta - 105 satir (7 parca x 2 class) |
| `bd62242` | data(79): 048 hijyen B16.9 naming + stub_end 40 satir (STD+XS, agirlik dolu) |
| `da8f904` | data(79): 049 B16.9 fitting agirlik dolum Wermac - 83 satir UPDATE (3D + tee_eq + cap) |

CI: ✅ YEŞİL (4 commit, rebase ile push'lar otomatik)

---

## DB Değişiklikleri

```sql
-- 046: 3 yeni kolon (class_no, soket_derinlik_mm, soket_ic_cap_mm) + CHECK
-- 047: +105 B16.11 SW satır
-- 048: 424 UPDATE (hijyen) + 40 INSERT stub_end (ağırlık dolu)
-- 049: 83 UPDATE (3D + tee_eq + cap agirlik_kg + notlar JSON)
```

---

## Kütüphane Snapshot (79 sonu)

| Modül | 78 sonu | 79 sonu | Delta |
|---|---:|---:|---:|
| `malzeme_kataloglari` | 20 | 20 | 0 |
| `flansh_olculer` | 308 | 308 | 0 |
| `boru_olculer` | 450 | 450 | 0 |
| `fitting_olculer` | 424 | **569** | **+145** |
| **TOPLAM (geometri)** | 1.202 | **1.347** | **+145** |

### `fitting_olculer` kırılımı (569 satır)

| Standart | Parça tipleri | Satır |
|---|---|---:|
| ASME B16.9 | 90LR, 45LR, 90_3D, 45_3D, tee_eq, cap, reducer_conc, reducer_ecc + **stub_end (yeni)** | 464 |
| ASME B16.11 (yeni) | 90SW, 45SW, tee_eq_sw, cross_sw, coupling_full, coupling_half, cap_sw | 105 |

### Ağırlık dolu fitting satırları

| Önce (79 başı) | Sonra (79 sonu) | Delta |
|---:|---:|---:|
| 48 | **171** | **+123 (3.5×)** |

Detay (79 sonu):
- 90LR: 24 dolu (78 öncesi mevcut)
- 45LR: 24 dolu (78 öncesi mevcut)
- 90_3D: 19 dolu (049'da)
- 45_3D: 19 dolu (049'da)
- tee_eq: 24 dolu (049'da)
- cap: 21 dolu (049'da)
- stub_end: 40 dolu (048'de)
- B16.11 SW (105): hâlâ 0 dolu (Wermac SW weight vermiyor)

---

## 80'e Açık Borç (önceliğe göre)

### Ağırlık hijyeni cephesi (en yüksek öncelik)

1. **B16.11 SW ağırlık** (P0, ~45 dk-1 sa) — 105 satır boş, pipingpipeline.com/ProjectMaterials weight chart'ları
2. **B16.9 reducer ağırlık** (P0, ~1.5 sa, kombinatif) — 228 satır (114 conc + 114 ecc), Wermac `weights_bw_reducers_*.html` (STD + XS + 160 + XXS)
3. **B16.9 γ ağırlık** (P1, ~1 sa) — 65 satır (90LR/45LR/90_3D/45_3D/tee_eq/cap büyük NPS 28+ ve 3D küçük NPS) — ProjectMaterials/Octalsteel
4. **Flansh ağırlık** (P1, ~1.5 sa) — 173 satır eksik (B16.5: 112, EN-1092-1: 61), ProjectMaterials/octalsteel weight chart'ları
5. **boru_olculer türetilmiş kolonlar** (P2, ~30 dk) — `ic_cap_mm`, `hacim_l_m`, `yuzey_alan_dis_m2_m` muhtemelen NULL, basit aritmetik UPDATE

### 78'den taşınan açık borçlar

6. **EN 1092-1 PN 25 paketi** (P1, ~2 sa) — 4 tip × 15 DN = 60 satır
7. **M_K düşük sıcaklık karbon** (P1, ~30-45 dk) — A333 Grade 6 + A420 WPL6 + A350 LF2, gemi ambar cephesi
8. **B16.11 reducing coupling β++** (P2, kombinatif) — γ'ya kalmıştı
9. **B16.11 threaded fittings** (P2, ~3 sa) — Class 2000/3000/6000 threaded, yeni cephe
10. **B16.9 stub_end MSS SP-43 short pattern** (P2) — NPS 1/2-24, 47'de β'dan çıkarıldı
11. **B16.9 stub_end NPS 22** (P3) — Wermac vermiyor, ProjectMaterials/Skyland'dan eklenir

### Library hijyeni

12. **fitting_malzeme_uyum** ilk script tasarımı (~3-4 sa)
13. **PN 10 küçük DN cephesi α** (P3) — 78'de β seçildi, ihtiyaç gelirse

---

## Kritik Hatırlatmalar (79 yeni dersleri dahil)

### 79'da öğrenilen (yeni)

- **MK-79.1:** `pbcopy` veya çok-satır komut bloğunda **shell yorumu (`# ...`) kullanma** — özellikle parantez/özel karakter içerenler. zsh `# 1) MD5` satırını parse hatasıyla reddediyor, sonraki komutları da atlatıyor. 78'in "tek tırnak commit mesajı" dersinin yeni varyantı. Komutlar yorum olmadan tek tek verilmeli, veya açıklama markdown'da/prose'da olmalı.

- **MK-79.2:** **Ağırlık notlar JSON pattern'i** standart oldu: `notlar TEXT` alanına string olarak `{"kaynak": "...", "uretim_tarihi": "YYYY-MM", "agirlik_schedule_bagimli_kg": {"STD": x, "XS": y, "160": z, "XXS": w}}`. agirlik_kg ana kolonda STD değeri tutulur, JSON schedule başına detay. Mevcut 90LR/45LR pattern'i 049'da diğer 4 parça tipine yayıldı.

- **MK-79.3:** **Ağırlık ikiye bölünür**: boru ağırlık formül-kanonik (ASME B36.10M = ρ × π × (D-t) × t, %0.3 sapma), fitting ağırlık tablo-üretici (Hackney Ladish/Wermac ±%5-15 sapma, "approximate"). İki kategoriyi karıştırma — boru için UPDATE formül-bazlı, fitting için kaynak-bazlı UPDATE.

- **MK-79.4:** **geometri_std prefix tutarlılığı**: sistem genelinde `'ASME B16.x'`, `'EN-1092-1'` formatı. Yeni veri eklerken mevcut prefix'leri kontrol et (47'de B16.11 doğru, ama eski 424 satır B16.9 prefix'siz çıktı, 48'de hijyen UPDATE ile düzeltildi). M_K, boru_olculer, diğer kataloglarda da kontrol değerli.

- **MK-79.5:** **Migration numarası verirken `ls migrations/ | tail -5` yeterli** — GitHub web UI'ye gerek yok (MK-78.1 güncelleme). Sadece push edilmiş dosyalar dizinde olur, yerel + push aynı bilgiyi verir.

- **KARAR-79.1:** B16.11 β kapsam → NPS 1/2-4 (Class 3000) + NPS 1/2-2 (Class 6000). Reducing coupling, threaded, Class 9000, NPS 1/8-3/8 → γ/sonraki.

- **KARAR-79.2:** B16.11 parça tipi isimlendirme → mevcut B16.9 stilini takip et (`90SW`, `45SW` gibi). Geometri_std ile ayrım (`'ASME B16.11'`), parça tipi isimde de "_sw" veya "SW" suffix.

- **KARAR-79.3:** B16.9 stub_end β kapsam → long pattern (B16.9), NPS 1/2-24, Schedule STD + XS. MSS SP-43 short pattern + NPS 22 → γ.

- **KARAR-79.4:** Schedule-bağımlı vs schedule-bağımsız ayrımı — stub_end için schedule üçlüsü dolu (Schedule farkı T'yi etkiliyor). 90LR/45LR/3D/tee_eq/cap için schedule üçlüsü NULL (mevcut pattern, ağırlık JSON'da multi-schedule notu).

- **KARAR-79.5:** Ağırlık tasarımı → notlar JSON ile kaynak izi, agirlik_kg = ana değer (boru için formül, fitting için Wermac/Hackney Ladish STD). 80'de ek kolon (`agirlik_kaynak`) gerekirse migration'a ekle.

### 78 + öncesi (taşınan)

- MK-78.1: Migration numarası atamadan önce GitHub/yerel migrations/ dizinine bak
- MK-78.2: Cihat ekran görüntüsü gönderirse hemen yansıt
- MK-78.3: Kapanış üçlüsü hiçbir koşulda atlanmaz (77'de atlandı, 78 + 79'da uygulandı)
- MK-78.4: `&&` zincirinde prerequisite önce
- MK-78.5: SQL VALUES dikey hizalama (flag/numeric/text blokları)
- MK-78.6: Supabase implicit transaction (BEGIN/COMMIT yok)
- MK-76.1: Supabase explicit transaction yok
- MK-76.2: LATERAL JOIN ile satır reuse
- MK-76.3: ASCII-only SQL yorumlar
- MK-76.4: GENERATED kolonu INSERT'e koyma
- MK-75.2: NOT NULL ve CHECK constraint kontrolü
- MK-75.3: Çift kaynak doğrulama (her veri için iki bağımsız kaynak)
- MK-75.D: NOT EXISTS bileşik anahtar idempotent
- MK-51.1: MD5 + satır + byte doğrulama dosya transferinde

---

## Süreç Disiplinleri (79'da uygulanan)

- **`gp` push** (otomatik rebase) — 4 push'un dördü de sorunsuz (bb9caf1 → 89fd4ad → bd62242 → da8f904)
- **present_files + MD5 doğrulama** her dosya için (4 SQL)
- **`pbcopy` ile temiz clipboard transferi** — 046'da editor'a yapıştırma sorunu, sonra `cat | pbcopy` ile çözüldü
- **MK-78.3 kapanış üçlüsü disiplini** — bu dosya o disiplinin parçası

---

## CI Son Durum

- **Build:** ✅ YEŞİL (son commit `da8f904`)
- **Lint:** baseline korundu
- **Vercel:** ✅ Production senkron

---

> 80. oturum açılışında bu dosya, `CLAUDE-SON-OTURUM.md` ve `CLAUDE-SONRAKI-OTURUM.md` okunacak.
