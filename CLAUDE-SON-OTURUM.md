# CLAUDE-SON-OTURUM.md

**Oturum: 80**
**Tarih: 12 May 2026 (Salı)**
**Başlangıç: git temiz, son commit `4425e51 docs(79): kapanis uclusu`**
**Bitiş: 80 push hash `b5f9226` (Migration 051), 80'in iki kendi commit'i `ad57157` (050) + `c3f6f84` (051, rebase sonrası `b5f9226`)**

---

## Özet

80. oturum **çift-cephe stratejisi**: A yolu (B16.11 SW fitting ağırlık) + E yolu (boru türetilmiş kolonlar) önerisi vardı; A bitince E'nin **hayalet borç** olduğu keşfedildi, B yolu (B16.9 reducer ağırlık) açıldı. Net sonuç: **fitting_olculer ağırlık doluluğu 171 → 452** (%30 → ~%78, **+281 satır**).

İki ayrı kaynak kullanıldı: A için **Bonney Forge Catalog F9-2012** (primary, ISO 9001, B16 komitesi üyesi), B için **Wermac BW Reducers / Hackney Ladish data**.

---

## A Yolu — B16.11 SW Fitting Ağırlık Dolum

### Kaynak stratejisi (Seçenek 2 → Seçenek 1)

İlk plan ASME B16.11-2011 PDF kanonik tablosunu kullanmaktı. **Kritik keşif**: PDF'in mass tablosu YOK (ASME standardı ağırlık vermez, sadece boyut). Revize: 15-20dk üretici tarama → **Bonney Forge** bulundu.

Cross-check: pipingpipeline.com (aggregator). NPS 4 90SW C3000'de:
- Bonney Forge: 10.25 kg
- pipingpipeline: 14.50 kg
- **%41 sapma** → PP yazım hatası şüphesi (BF tutarlı pattern)

**KARAR-80.1**: ASME standartlarında mass tablosu yoksa üretici tablosu primary; aggregator secondary cross-check. PDF kanonik kontrolünden önce tablo varlığı teyit edilmeli.

### Migration 050 detayları

- **Dosya**: `migrations/050_b16_11_sw_agirlik_dolum.sql`
- **MD5**: `de215945abebc82e53b6e1d45ff790bc`
- **Satır**: 243, **Byte**: 26833
- **UPDATE bloğu**: 7 (90SW, 45SW, tee_eq_sw, cross_sw, coupling_full, coupling_half, cap_sw)
- **Kapsam**: C3000 NPS 1/2-4 (9 satır) + C6000 NPS 1/2-2 (6 satır) per parça = **105 satır**

### DN 20 C6000 coupling_half istisnası

Bonney Forge tablosunda **NPS 3/4 (DN 20) C6000 half coupling üretmiyor** (production constraint, sadece 9 değer var 11 yerine). Pipingpipeline secondary kullanıldı:
- DN 20 C6000 coupling_half = 0.45 kg (PP secondary)
- notlar JSON `"kaynak_tipi":"secondary_fallback"` flag ile işaretli
- Diğer 5 C6000 coupling_half satırı Bonney Forge primary

**KARAR-80.2**: BF'de eksik NPS için PP secondary fallback kullanılır, JSON'da flag ile ayrılır.

### Doğrulama (105/105 dolu)

```
14 satır (7 parça × 2 class), hepsinde sayim = agirlik_dolu
- 45SW C3000: 9/9, min 0.27, max 12.97 kg
- 45SW C6000: 6/6, min 0.36, max 3.42 kg
- 90SW C3000: 9/9, min 0.20, max 10.25 kg
- 90SW C6000: 6/6, min 0.27, max 2.59 kg
- cap_sw C3000: 9/9, min 0.10, max 5.48 kg
- cap_sw C6000: 6/6, min 0.19, max 1.66 kg
- coupling_full C3000: 9/9, min 0.11, max 2.60 kg
- coupling_full C6000: 6/6, min 0.20, max 1.75 kg
- coupling_half C3000: 9/9, min 0.15, max 3.76 kg
- coupling_half C6000: 6/6, min 0.36, max 2.26 kg
- cross_sw C3000: 9/9, min 0.33, max 18.14 kg
- cross_sw C6000: 6/6, min 0.70, max 4.38 kg
- tee_eq_sw C3000: 9/9, min 0.19, max 10.91 kg
- tee_eq_sw C6000: 6/6, min 0.22, max 2.04 kg
```

**Commit**: `ad57157 data(80): 050 B16.11 SW fitting agirlik dolum Bonney Forge - 105 satir UPDATE (7 parca x 15)`

---

## E Yolu — Boru Türetilmiş Kolonlar (HAYALET BORÇ)

CLAUDE-SONRAKI-OTURUM (79'da yazılan) Yol E'yi **boru_olculer için ic_cap_mm, hacim_l_m, yuzey_alan_dis_m2_m UPDATE** olarak öneriyordu. MK-78.1 disiplini (DB live state verify) gereği önce kontrol edildi:

```sql
SELECT column_name, is_generated, generation_expression FROM information_schema.columns
WHERE table_name = 'boru_olculer' AND column_name IN ('ic_cap_mm', 'hacim_l_m', 'yuzey_alan_dis_m2_m');
```

Sonuç: **Üç kolon da GENERATED ALWAYS** (36. oturum K11/8 maddeli mimari kararı). 450/450 satır dolu, hiç NULL yok. Formüller doğru:
- `ic_cap_mm = dis_cap_mm - 2 * et_mm`
- `hacim_l_m = π × ((dis-2et)/2)² / 1000`
- `yuzey_alan_dis_m2_m = π × dis_cap / 1000`

**Yol E zaten halledilmiş** — hiç yapılacak iş yok. CLAUDE-SONRAKI-OTURUM yanlış varsayım üzerine kurulmuştu (79'da DB live state kontrol edilmemiş).

**MK-80.2 (yeni)**: CLAUDE-SONRAKI-OTURUM yazılırken her açık borç DB live state ile teyit edilmeli (MK-78.1'in genişletilmiş hali). Hayalet borç önleme — zaten halledilmiş işler bir sonraki oturum gündemine taşınmamalı.

---

## B Yolu — B16.9 Reducer Ağırlık Dolum

### Yapı analizi

DB live state (MK-80.2 disiplini):
- `fitting_olculer` reducer_conc: 114 satır, reducer_ecc: 114 satır = **228 toplam**
- `cap_buyuk_dn` (NOT NULL) + `cap_kucuk_dn` (NULLABLE, reducer için dolu)
- Schedule üçlüsü NULL (KARAR-79.4: schedule-bağımsız pattern)
- 28 unique DN_buyuk × değişken DN_kucuk → üçgensel matris
- DN dağılımı: 20-1000 mm (NPS 3/4 - 40)

### Kaynak: Wermac BW Reducers (Hackney Ladish)

4 schedule sayfası çekildi:
- `weights_bw_reducers.html` STD — NPS 3/4 → 30 (DN 20-750), ~89 combo
- `weights_bw_reducers_xs.html` XS — Aynı kapsam, bazı "-" 
- `weights_bw_reducers_160.html` 160 — **NPS 12 sınırı** (DN 300)
- `weights_bw_reducers_xxs.html` XXS — **NPS 8 sınırı** (DN 200)

Wermac kaynak güvenilirliği: Hackney Ladish (Dallas, TX, 380,000 sqft, B16 fitting üreticisi). MK-79.3: üretici tablosu primary, varyans bilinmiyor (tek-ama-tutarlı kaynak).

### DB-Wermac eşleştirme

DB DN combo özeti (114 conc kombinasyonu):
- DN 20-150: 42 (DN_buyuk × değişken DN_kucuk)
- DN 200-300: 12
- DN 350-550: 20
- DN 600-750: 16
- DN 800-1000: 24

Wermac kapsam dışı kombinasyonlar:
- **DN 800-1000 büyük NPS**: Wermac NPS 30 sınırı (DN 750) → 24 satır γ
- **DN 600-550**: Wermac "-" (24-22) → 1 combo γ
- **DN 700-450**: Wermac'ta 28-18 yok → 1 combo γ

Toplam **88 unique combo eşleşti** (114-26), **52 satır γ** (26 conc + 26 ecc).

### Migration 051 detayları

- **Dosya**: `migrations/051_b16_9_reducer_agirlik_wermac.sql`
- **MD5**: `5c5b1ad7cea51159a69584892a4a9b74`
- **Satır**: 176, **Byte**: 7113
- **Pattern**: Tek UPDATE bloğu, parca_tipi IN ('reducer_conc', 'reducer_ecc') filtre
- **88 VALUES satırı × 2 parça tipi = 176 satır UPDATE**

**MK-80.3 (yeni)**: Reducer ağırlık **β-mini-extended pattern** — STD ana kolon (kanonik), JSON multi-schedule (`agirlik_schedule_bagimli_kg: {"STD":x, "XS":y, "160":z, "XXS":w}`, null'lar kabul). 049 pattern'la uyumlu.

JSON kaynak alanı:
```json
{
  "kaynak": "Wermac BW Reducers (Hackney Ladish source, weights_bw_reducers.html STD/XS/160/XXS)",
  "uretim_tarihi": "2026-05",
  "agirlik_schedule_bagimli_kg": {"STD":..., "XS":..., "160":..., "XXS":...}
}
```

### Doğrulama

```
reducer_conc: 114 sayim, 88 dolu, min 0.08 kg, max 109.32 kg
reducer_ecc:  114 sayim, 88 dolu, min 0.08 kg, max 109.32 kg
gamma listesi: 52 satir (26 conc + 26 ecc, tam beklenen NPS kombinasyonları)
```

**Commit**: `c3f6f84 data(80): 051 B16.9 reducer agirlik dolum Wermac/Hackney Ladish - 176 satir UPDATE (88 combo x 2)`. Push sırasında remote'ta `cf8e462` (beklenmedik commit, paralel chat batch olabilir) → rebase → final hash `b5f9226`.

---

## Mimari Kararlar (80)

### Yeni MK'lar

- **MK-80.1**: B16.11 SW ağırlık için Bonney Forge primary (ISO 9001, B16 komitesi); pipingpipeline secondary cross-check. Üretici-aggregator varyans %30-50, NPS sınırlarında yazım hatası kontrolü zorunlu (örnek: NPS 4 90SW C3000'de PP=14.50 vs BF=10.25, %41 sapma → PP yazım hatası şüphesi).

- **MK-80.2**: CLAUDE-SONRAKI-OTURUM yazılırken her açık borç DB live state ile teyit edilmeli (MK-78.1'in genişletilmiş hali). Hayalet borç önleme. 79'da Yol E (boru türetilmiş kolonlar) bu hatanın ürünüydü — 36. oturum K11 ile GENERATED yapılmıştı, kontrol edilmediği için listeye taşındı.

- **MK-80.3**: Reducer ağırlık β-mini-extended pattern — STD ana kolon (kanonik), JSON multi-schedule (STD/XS/160/XXS, null'lar kabul). Wermac kapsam dışı kombinasyonlar (büyük NPS, üretici-spesifik atlamalar) γ'da kalır, ek üretici (Sandvik/Vallourec gibi) ile tamamlanabilir.

### Yeni KARAR'lar

- **KARAR-80.1**: ASME standardının mass tablosu içermediği durumlarda (B16.11 örneği), üretici tablosu (Bonney Forge F9-2012) primary kaynak; PDF kanonik kontrolünden önce tablo varlığı teyit edilmeli.

- **KARAR-80.2**: BF'de eksik NPS için PP secondary fallback kullanılır (DN 20 C6000 coupling_half NPS 3/4 production constraint örneği). notlar JSON'da `kaynak_tipi: "secondary_fallback"` flag ile işaretli.

- **KARAR-80.3**: 80'in çift-cephe stratejisi (A: B16.11 SW + B: B16.9 reducer) iki ayrı kaynak (Bonney Forge + Wermac/Hackney Ladish) kullandı; fitting ağırlık doluluğu 171 → 452 (%30 → ~%78). Multi-source fitting ağırlık dolum **tek migration'da** yerine **iki ayrı parça-tipi-spesifik migration**'da daha temiz.

---

## Önceki Disiplinlerin Uygulanması

- ✅ **MK-75.3** çift kaynak: Bonney Forge primary + pipingpipeline cross-check (A); B16.9 reducer için Wermac/Hackney Ladish tek-ama-tutarlı (B)
- ✅ **MK-78.1** DB live state verify: hem reducer schema (yapı, NULL durumu) hem boru türetilmiş kolonlar (GENERATED tespiti) için
- ✅ **MK-79.1** pbcopy ile clipboard yapıştırma (`cat sql | pbcopy`)
- ✅ **MK-79.2** ağırlık notlar JSON pattern: `kaynak`, `uretim_tarihi`, `agirlik_schedule_bagimli_kg`
- ✅ **MK-79.3** fitting ağırlık = üretici tablosu, ±%5-15 normal varyans (B16.11 C6000'de %30-50'ye kadar)
- ✅ **MK-79.4** schedule üçlüsü NULL pattern (reducer + B16.11 SW schedule-bağımsız)
- ✅ **MK-79.5** migration numarası `ls migrations/ | tail -5` (049 sonrası → 050, 051)
- ✅ **MK-51.1** dosya transferi MD5 + satır + byte
- ✅ **MK-52.1** arespipe_kopyala MD5 doğrulamayla
- ✅ **MK-52.2** gp (auto-rebase push)
- ✅ ASCII-only SQL yorumlar (Türkçe karakter yok yorum içinde)
- ✅ present_files ile temiz transfer

---

## Süre dağılımı

- A yolu (kaynak + SQL + doğrulama + commit): ~1 saat
- E yolu (DB kontrol + hayalet borç tespiti): ~10 dk
- B yolu (Wermac 4 sayfa + DN combo eşleştirme + SQL + doğrulama + commit): ~1 saat
- Kapanış üçlüsü: ~15 dk (devam ediyor)

Toplam: ~2.5 saat oturum
