# 80. Oturum Gündemi

> 79'un devamı. fitting_olculer iki yeni cephe (+145 satır), ağırlık 3.5× doluluk, naming hijyeni. 80 ağırlık hijyeni cephesinin devamı — Cihat'ın "ağırlık atlanamaz" prensibi yönünde sistematik plan.

---

## Açılış Ritüeli (CLAUDE.md disiplini — 2 soru)

1. **`git pull` + `git log -5` çıktısı.** 79 commit'leri (`bb9caf1`, `89fd4ad`, `bd62242`, `da8f904`) main'de olmalı.
2. **Bugün ne yapmak istiyorsun?**

Beş ana yol var (ağırlık hijyeni cephesi öncelikli, 78'den taşınan borçlar ikincil).

---

## Yol A — B16.11 SW ağırlık dolum (P0, ~45 dk-1 sa) ⭐ ÖNERİLEN

105 boş satır, 79'da en büyük ağırlık eksiği. pipingpipeline.com SW fitting weight chart'ları + ProjectMaterials yedek.

**İş:**
1. Kaynak araştırması — pipingpipeline.com'da B16.11 SW Class 3000+6000 weight tabloları (`wt-asme-b16-11-*.html` pattern olabilir)
2. 7 parça tipi × 2 Class kombinasyonları:
   - 90SW, 45SW, tee_eq_sw, cross_sw: Class 3000 (NPS 1/2-4) + Class 6000 (NPS 1/2-2)
   - coupling_full, coupling_half, cap_sw: aynı kapsam, kg değerleri
3. UPDATE pattern 049 ile aynı (notlar JSON, agirlik_kg STD veya tek Class değeri)
4. Migration `050_b16_11_agirlik_dolum.sql`

**Sonuç:** fitting_olculer ağırlık dolu satır 171 → **276** (+105). B16.11 cephesi tam doluluk.

⚠ pipingpipeline.com'da SW weight var mı kontrol gerek; yoksa ProjectMaterials veya başka site.

---

## Yol B — B16.9 reducer ağırlık (P0, ~1.5 sa, kombinatif)

228 satır (114 reducer_conc + 114 reducer_ecc). En büyük tek-cephe ağırlık eksiği. Kombinatif DN1 × DN2 matrisi.

**İş:**
1. Wermac `weights_bw_reducers.html` (STD), `weights_bw_reducers_xs.html`, `weights_bw_reducers_xxs.html`, `weights_bw_reducers_160.html` (4 sayfa)
2. Reducer pattern: NPS_büyük × NPS_küçük (örn. 4×3, 4×2, 4×1.1/2 vb.)
3. DB'deki 114 satır reducer için DN_büyük + DN_küçük kombinasyonlarını tara
4. Wermac kombinasyonları ile mevcut DB kombinasyonlarını eşleştir (büyük olasılıkla %90 örtüşme)
5. UPDATE 4 schedule için (STD ana kolon, JSON multi-schedule)
6. Migration `050_b16_9_reducer_agirlik.sql` veya 051 (A'dan sonra ise)

**Sonuç:** fitting_olculer ağırlık dolu 171 → **399** (+228). %70 doluluk.

⚠ Eccentric reducer için ayrı ağırlık tablosu olabilir veya concentric ile aynı (geometri farklı, ağırlık ~aynı).

---

## Yol C — Flansh ağırlık tamamlama (P1, ~1.5 sa)

173 satır eksik (B16.5: 112, EN-1092-1: 61). 78'de PN 16 T01 ProjectMaterials weight verdi, hub'lı tipler ve büyük Class'lar boş.

**İş:**
1. B16.5 eksik 112 satır — Class 600+ Class 2500 ağır tipler muhtemelen, ProjectMaterials/octalsteel weight chart'ları
2. EN-1092-1 eksik 61 satır — T05/T11/T12 hub'lı tipler (T01 dolu)
3. ProjectMaterials PN 16 ve PN 10 weight zaten kontrol edildi (78'de T01 girişi sırasında), T05/T11/T12 için aynı kaynak çoğunlukla yeterli
4. Migration `050_flansh_agirlik_tamamlama.sql`

**Sonuç:** flansh_olculer ağırlık dolu 135/308 → **308/308** (%100 doluluk).

---

## Yol D — B16.9 γ ağırlık (P1, ~1 sa)

65 satır (büyük NPS 28+ ve 3D küçük NPS), Wermac kapsamı dışı.

**İş:**
1. ProjectMaterials, Octalsteel, Skyland büyük NPS weight chart'larını ara
2. 90LR/45LR/90_3D/45_3D NPS 28, 32, 34, 38, 40, 42, 44, 46, 48 (DN 700-1200) → ~36 satır
3. tee_eq, cap aynı büyük NPS aralığı → ~21 satır
4. 90_3D, 45_3D NPS 1/2-1.1/2 küçük DN (3D için Wermac NPS 2'den başlar) → ~8 satır
5. Migration `050_b16_9_gamma_agirlik.sql`

**Sonuç:** B16.9 fitting cephesi ağırlık tam doluluk.

⚠ Büyük NPS standardı zayıflıyor, üretici tablolarında veri tutarsızlığı olabilir. Çift kaynak (MK-75.3) önemli.

---

## Yol E — boru_olculer türetilmiş kolonlar (P2, ~30 dk)

`ic_cap_mm`, `hacim_l_m`, `yuzey_alan_dis_m2_m` kolonları muhtemelen NULL veya kısmen dolu. Basit aritmetik UPDATE:

- `ic_cap_mm = dis_cap_mm - 2 * et_mm`
- `hacim_l_m = π × (ic_cap_mm/2)² × 1000 / 1000000` (litre/metre)
- `yuzey_alan_dis_m2_m = π × dis_cap_mm / 1000` (m²/m)

**İş:**
1. Doluluk taraması: hangi kolon kaç satır NULL?
2. Tek SQL UPDATE 450 satır için (NULL'leri doldur)
3. Spot check (5 örnek satır)
4. Migration `050_boru_turetilmis_kolonlar.sql`

**Sonuç:** boru_olculer 100% türetilmiş kolon doluluğu, hızlı kazanç.

---

## 78'den Taşınan (P1-P2)

### Yol F — EN 1092-1 PN 25 paketi (P1, ~2 sa)

4 tip × 15 DN = 60 satır. Flansh_olculer 308 → 368. ProjectMaterials + pipefittingweb pattern oturmuş.

### Yol G — M_K düşük sıcaklık karbon (P1, ~30-45 dk)

A333 Grade 6 boru + A420 WPL6 BW fitting + A350 LF2 forged/flansh. Gemi ambar/cryogenic cephesi. M_K 20 → 23.

### Yol H — B16.11 reducing coupling (P2, kombinatif)

79'da β'dan çıkarıldı. Kombinatif NPS_büyük × NPS_küçük matris.

### Yol I — B16.11 threaded fittings (P2, ~3 sa)

Yeni cephe. Class 2000/3000/6000 threaded. 7 parça tipi × benzer NPS aralığı.

### Yol J — B16.9 stub_end MSS SP-43 short pattern (P2)

79'da β'dan çıkarıldı. NPS 1/2-24 short pattern (B16.9 long ile yan yana).

---

## Önerilen Sıra (79 sonu mantığı)

Cihat'ın "ağırlık atlanamaz" prensibi → ağırlık cephesi öncelikli:

1. **A (B16.11 SW ağırlık)** — en kısa, somut, fitting_olculer'da en büyük tek eksik (%18 doluluk → %37'ye çıkar)
2. **B (B16.9 reducer ağırlık)** — büyük sıçrama (228 satır), Wermac pattern, %70 doluluk
3. **C (flansh ağırlık)** — pratik kullanım için kritik, sınırlı satır
4. **D (B16.9 γ ağırlık)** — büyük NPS, MK-75.3 disiplini önemli
5. **E (boru türetilmiş kolonlar)** — hızlı kazanç, ara dolgu
6. **F-J** — 78'den taşınan, ağırlık hijyeni bittikten sonra

**Önerim 80 için:** A + E + C (toplam ~3 sa, üç farklı cephe). Veya tek odaklı: sadece A + E (~1.5-2 sa, fitting_olculer ağırlık 105 dolar, ağırlık-büyük-resim ilerler).

---

## Hazır Pattern (79'dan taşınanlar)

### SQL pattern'ler

- **VALUES inline UPDATE** (049 pattern): `UPDATE ... SET ... FROM (VALUES (...)) AS v(...) WHERE ...`
- **notlar JSON string** TEXT alanında: `{"kaynak": "...", "uretim_tarihi": "YYYY-MM", "agirlik_schedule_bagimli_kg": {"STD": x, "XS": y, ...}}`
- **agirlik_kg ana kolonda STD değeri**, multi-schedule detay JSON'da
- **Idempotent WHERE agirlik_kg IS NULL** — ikinci çalıştırmada 0 etki

### Süreç pattern'ler

- **`gp` push** otomatik rebase
- **MD5 + satır + byte transfer doğrulaması**
- **`cat | pbcopy` → editör temizle → Cmd+V** (Supabase SQL Editor için temiz transfer)
- **`ls migrations/ | tail -5`** ile migration numarası kontrol

---

## Kritik Hatırlatmalar (79 + öncesinden)

### 79 yeni dersleri

- **MK-79.1:** Çok-satır komut bloğunda **`#` yorumu kullanma** — zsh parantezde parse hatası verir
- **MK-79.2:** Ağırlık notlar JSON pattern'i — kaynak izi, schedule başına detay
- **MK-79.3:** Boru ağırlık formül-kanonik (%0.3 sapma), fitting ağırlık tablo-üretici (±%5-15)
- **MK-79.4:** geometri_std prefix tutarlılığı — yeni veri öncesi mevcut kontrol
- **MK-79.5:** Migration numarası için `ls migrations/ | tail -5` yeterli

### 78 + öncesi (taşınan)

- **MK-78.3:** Kapanış üçlüsü hiçbir koşulda atlanmaz
- **MK-78.5:** SQL VALUES dikey hizalama
- **MK-76.1:** Supabase implicit transaction
- **MK-76.3:** ASCII-only SQL yorumlar
- **MK-75.3:** Çift kaynak doğrulama
- **MK-75.D:** NOT EXISTS idempotent bileşik anahtar
- **MK-51.1:** MD5 + satır + byte transfer

---

## 79'in Özeti (80 başlangıcında 30 saniyede)

| İş | Sonuç |
|---|---|
| Migration 046 — fitting_olculer şema | +3 kolon B16.11 için |
| Migration 047 — B16.11 SW β | +105 satır, ikinci ana standart |
| Migration 048 — naming hijyeni + stub_end | UPDATE 424 + INSERT 40 (ağırlık dolu) |
| Migration 049 — B16.9 fitting ağırlık | UPDATE 83 satır (3D + tee_eq + cap) |
| Ağırlık tasarımı (KARAR-79.5) | Boru formül-kanonik, fitting tablo-üretici, notlar JSON |
| Boru ağırlık doğrulama | 450 satır kanonik onaylandı (%0.3 sapma) |

DB delta: fitting_olculer 424→569, fitting_olculer ağırlık dolu 48→171 (3.5×).

---

> 80 açılışında bu dosya + `son-durum.md` + `CLAUDE-SON-OTURUM.md` okunur, sonra Cihat'a *"Hangi yolu seçelim — A (B16.11 SW ağırlık), B (reducer ağırlık), C (flansh ağırlık), D (B16.9 γ ağırlık), E (boru türetilmiş), F-J (78'den taşınan)?"* sorulur.
