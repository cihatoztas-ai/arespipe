# son-durum.md — Oturum 184 sonu

## HEAD
`7df320b` civarı (184 #2b migration 104 push'u sonrası; CI-bot `[skip ci]` rapor commit'leri araya girer → `git pull --rebase`). Fonksiyon **12/12** (yeni api yok). Çalışma ağacı TEMİZ.

Commit zinciri (184):
- `38060f2` — A fix: izo-eslesme FAZLA anahtar-seviyesi (B-6 + MK-182.6) + self-test
- `77c64f1` — #2b kod: ares-kabuk aktar cizim_no yazar + kuyruk-isle kabukYukle harita anahtarı
- `886412b` — #2b migration: 104_spooller_cizim_no.sql

## Canlıya (184 — hepsi EKLEMELİ, Tersan'a sıfır dokunuş)
- **A** (`38060f2`): `lib/izo-eslesme.js` FAZLA izometri-seviyesi → anahtar-seviyesi. `kabukAnahtarSet` öne taşındı (tek tanım). Çok-spool kısmi eşleşmede S02..SN fazla'ya düşer (eskiden sessizce yutuluyordu = B-6). Wizard `_paorBolShell` (önceden canlı) bu fazla'dan shell enjekte eder.
- **#2b kod** (`77c64f1`): `ares-kabuk.js aktar` spoolRows'a `cizim_no:s.cizim_no||null`. `api/kuyruk-isle-izometri.js kabukYukle` SELECT'e cizim_no + harita anahtarı `cizim_no || pipeline_no`. `eslestir` + `montajEslestir` dokunulmadı.
- **#2b migration** (`886412b`): `migrations/schema/104_spooller_cizim_no.sql` → `spooller.cizim_no text`. **Canlı DB'ye APPLY edildi** (information_schema count=1 doğrulandı). Repo + canlı senkron.

## CANLI TEST — İKİSİ DE GEÇTİ ✅
**A (çok-spool):** Taze devre, 773/774/775 (L3=3/2/2) → İŞLENEN 7/7, KABUK 7, EKSİK 0. Üç çizim S01..SN bölündü. Terfi → 7 `spooller` (A-002155..2161), benzersiz. S02/S03 boş shell (0 kg).

**#2b (köprü):** Taze devre gbdgfnd, 779/780/781 (tek-spool) →
- Yazma yarısı: terfi → 3 satır, hepsinde `cizim_no` dolu (52600-102779/780/781), pipeline_no `Z10-...` (marka korundu).
- Okuma yarısı: backfill → `parse_sonuc._eslesme.eslesen:1, atanmamis:0`, `detay[0].durum:"eslesti"`, spool_uuid bağlı, yüzey kabuk_bos_dolduruldu→Galvaniz.

## Köprü mimarisi özeti (MK-184.3 — KARARLAR.md'ye EKLENECEK)
PAOR'da iki kimlik ayrı namespace: kabuk pipeline `Z10-SCUPPER_SYSTEM_001` (Excel içeriği, ekranda görünür) vs PDF drawing-no `52600-102779`. Köprü: `spooller.cizim_no`'ya drawing-no yaz (`aktar`), eşleştirmeyi `cizim_no || pipeline_no`'dan kur (`kabukYukle` harita; inceleme tarafı `izo-eslesme _kabukAnahtarKaynak` zaten 183'te). Ekranda pipeline `Z10-...` KALIR. Tersan: cizim_no NULL → fallback → BİREBİR.

## Açık işler (carry — taze SQL ile doğrula, MK-163.1)
- **Çok-spool köprü tam-kapsam:** #2b yalnız tek-spool (S01) köprüsüyle test edildi. S02/S03 bağlama (769/771 seti) canlı görülmedi — mantık aynı, hızlı doğrulanmalı.
- **B — BOM dağıtımı (MK-182.5):** S02..SN boş shell; kayıt-bazlı dağıtım (malzeme_listesi boş→pipeline-paylaşımlı, dolu→per-spool). Tersan'ı bozma.
- **MK-184.1** şef konsolidasyonu (spoolAnahtarlariUret tek-kaynak; pozisyon dalı duplike kio:663+devre-inceleme:147; spoolNormalize inceleme'de yok).
- **MK-184.2** eslesenIzoIdx ölü kod. **MK-184.4** montajEslestir kio:840 cizim_no'suz (drain-yolu PAOR montaj). **MK-184.5** migration-önce/kod-sonra sırası.
- **MK-184.3** KARARLAR.md'ye eklenmedi (commit'te yalnız .sql) — 185 açılışında backfill.
- PAOR veri-kalite paketi: agirlik_kg null (K2), kalem-kalite "karbon" (ares-kabuk dikkat), et boş, D-182.2 malzeme çelişkileri.
- L3 routing d===imalat kırılganlığı (wizard 793). NPS→mm bug (Tersan Faz2). Mükerrer test devresi temizliği.

## Disiplin notu
PAOR ayrışması Tersan'ı bozmuyor: izo-eslesme tek-anahtarda birebir; aktar cizim_no Tersan'da null; kabukYukle harita `|| pipeline_no` fallback. Üçü de self-test/canlı kanıtlı. Migration idempotent (ADD COLUMN IF NOT EXISTS).
