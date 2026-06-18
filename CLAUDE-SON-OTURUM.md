# CLAUDE — Son Oturum (191)

> **Tarih:** 18 Haziran 2026 · **Oturum:** 191
> Ana tema: spool_detay boru matcher'ı **grup-kör**dü → 316L'ler karbon B36.10M'e bağlanıyordu. Kök neden bulundu, matcher + FK backfill + seed-gate lint ile uçtan uca kapatıldı.

---

## Ne yapıldı (hepsi commit + yeşil)

### 1. ✅ Boru matcher Tier-0 grup ekseni (`99c2fb9`)
`spool_detay.html::boruEslestir` — OD/et ile aday buluyordu ama **malzeme grubunu sormuyordu**. Canlı veride karbon `ASME-B36.10M` ile paslanmaz `ASME-B36.19M` neredeyse her OD+et'te çakışıyor (P2 ile doğrulandı; B36.10M aynı ölçüde HEM karbon HEM paslanmaz içeriyor → standart adı grubu ayırmaz). Sonuç: 316L boru karbon B36.10M'e bağlanıyordu (modal yanlış standart).
- **Fix:** `_boruGrupBelirle(kalite, malzeme)` helper + Tier-0 grup-narrow. Kalite/malzeme → grup (316L/1.4571/paslanmaz→paslanmaz, St 37→karbon…), aday `malzeme_grubu`'na daraltılır. Paslanmazda dimensyonel `B36.19M` tercih edilir.
- Veri doğrulaması: P1 (316L→597 satır "316L" yazımı, hiçbiri eski tier-1 prefix'ine uymuyordu), P2 (çakışma yaygın), P3 (mevcut 67 FK = St37 karbon, doğru).

### 2. ✅ 191b — grup-narrow `length===1` ÖNCESİNE alındı (`d1fd876`)
İlk fix'te bir kayma kaldı: o ölçüde **tek aday yanlış grupsa**, fonksiyon başındaki `if(adaylar.length===1) return` grup kontrolünden önce çalışıp onu körlemesine veriyordu (DOĞRULAMA 1'de `paslanmaz→karbon DIN-2448 · 1` satırı yakaladı). Grup-narrow erken-dönüşten öne alındı; **grup belli + o ölçüde aynı-grup yok → null** (yanlış-grup bağlamaz, seed bekler). Deploy MD5: `6fcc5cd425faa671ed51fa421072196e`.

### 3. ✅ Boru FK backfill — COMMIT
Matcher'ın birebir SQL aynası (grup-narrow + B36.19 tercihi + tier-1 kalite-prefix + tier-2 öncelik + `bl.malzeme_grubu=grup` guard). Sadece boş FK'ları doldurdu, mevcut bağlara dokunmadı. **Sonuç: 1674 bağlı / 556 boş.** Verify: tüm satırlar grup-tutarlı (316L→B36.19M, St37→DIN-2448/B36.10M/Ozel/EN, CuNi→DIN-86019), sıfır grup çelişkisi. → tablo STANDART kolonu artık dolu, satır mavi.
- **556 boş = kütüphanede gerçekten karşılığı olmayan ölçüler** (matcher hatası DEĞİL): ST35.8 48.3×4.5 (496), St37 DIN-OD'ler 139.7/48.3/60.3 @ 4.5/6.3 cidar, EN ince-cidar paslanmaz 1.4571 65×2/125×2.5/200×3. **Tolerans gevşetme YANLIŞ çözüm** (190'da düzelen schedule kimliğini bozar) → seed işi.

### 4. ✅ Seed-gate lint MK-191.1 (`76a528c`)
`scripts/seed-from-json.mjs` — yeni JSON satırı DB'ye girmeden 2 guard:
- **Guard A:** `malzeme_grubu` zorunlu + enum {karbon, paslanmaz, cunife, aluminyum}. Boş/geçersiz ("cuni" gibi) → reddedilir.
- **Guard B:** `STD_GRUP` haritasıyla standart↔grup tutarlılığı (boru/fitting `standart`, flanş `geometri_std`). Bilinen std + uymayan grup → reddedilir; bilinmeyen/kanonik-olmayan kod → yazılır+uyarır.
- Reddedilen `--yaz`'da bile yazılmaz. 7 senaryo testi geçti. Eski upsert/generated-kolon/idempotent akışı korundu.

### 5. ✅ KUTUPHANE-DURUM.md — A9 + B14 (yüklenecek)
A9 (yeni bölüm): grup↔standart tutarlılığı, 191 keşfi, seed-gate lint kuralı. B14: boru backfill "YAPILDI", flanş/fitting kalan. **MD5: `754cf657a0060a60221616fedd55d99d` — Cihat'ın elinde, kapanışta yüklenecek.**

---

## Yan tespitler (doğrulanan, ileriye not)
- **Flanş ağırlık (carbon vs cunife) KOPYA DEĞİL** — fiziksel doğru (yoğunluk 7.85 vs 8.9). DN200/250/300'de çoğul karbon satırı = farklı PN → flanş backfill anahtarı `basinc_sinifi` içermeli.
- **Kütüphane malzeme filtresi DOĞRU çalışıyor** (Karbon EN-1092-1 23 kayıt / CuNi EN-1092-3 19 kayıt; DN/Ø/PN aynı çünkü EN delme şablonu paylaşımlı, sadece kalınlık+ağırlık değişir — bug değil).
- **Flanş/fitting `tip` alanı güvenilmez:** flanşlar `tip='fitting'` altında (817 ipuçlu satır), `tip='flansh'` sadece 12. DN/PN/tip yapısal kolonda YOK, `tanim` metnine gömülü → backfill text-parse gerektirir.

---

## Commit'ler (191)
| Hash | İş |
|---|---|
| `99c2fb9` | boru matcher Tier-0 malzeme grubu ekseni |
| `d1fd876` | 191b: grup-narrow length===1 öncesine |
| `76a528c` | seed-gate lint MK-191.1 |
| (DB) | boru FK backfill COMMIT — 1674 bağlı |

## KARARLAR.md'ye eklenecek
**MK-191.1 — Seed-gate lint:** Kütüphaneye yeni satır eklenirken `malzeme_grubu` zorunlu+enum ve standart↔grup tutarlı olmalı; matcher grup eksenine bağlı, yanlış etiket DB'ye girmeden reddedilir. Çakışma (aynı OD/et'te karbon+paslanmaz) fiziksel gerçektir, silinmez — matcher grup ekseniyle çözer, seed grup doğruluğunu garanti eder.
