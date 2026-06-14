# BRIEFING — AresPipe Aktif Bağlam (184 sonu)

## Proje
Çok-tenant tersane pipe spool yönetimi SaaS. Stack: Supabase/Postgres (RLS), Vercel serverless (Hobby, 12 fn tavanı), vanilla JS/HTML web + React Native PWA. Tüm iş Türkçe, MK-kararları + numaralı oturum disiplini.

## PAOR/AVEVA durumu — uçtan uca CANLI
PAOR formatı (yeni tersane) artık tam akış: **yükle → incele → terfi → izometri bağla.**
- **Format:** Excel BOM (`lib/paor.js`) + fab PDF (`-A.pdf`, text'siz vektör, L3) + Isometric_View PDF. Drawing-no `52600-NNNNNN` PDF dosya adından; Excel pipeline `Z##-SCUPPER_...` ekran/marka.
- **183 (Faz1):** İnceleme köprüsü — drawing-no ile eşleştirme (`izo-eslesme _kabukAnahtarKaynak = cizim_no || pipeline`).
- **184/A:** Çok-spool bölme. L3 N spool → kabuk S01..SN. Fix = FAZLA anahtar-seviyesi (`izo-eslesme`) + wizard `_paorBolShell` shell enjeksiyon. 7-spool testi geçti.
- **184/#2b:** Terfi köprüsü. `spooller.cizim_no` (migration 104) → aktar yazar, kabukYukle harita anahtarı, eslestir bağlar. Tek-spool testi geçti.

## Mimari ilkeler (PAOR'a özgü)
- **Üç tüketici, tek anahtar mantığı:** inceleme / terfi-bağlama / (montaj) → hepsi `cizim_no || pipeline_no | S0n`. Tersan cizim_no boş → pipeline_no fallback → birebir.
- **Spool kimliği POZİSYON:** parse spool_no GÜVENİLMEZ ("[1]"); endpoint idx→S0n üretir (`devre-inceleme.js:147`, `dosyaAdiParse spool_kaynak:'pozisyon'`).
- **M1 (A):** S02..SN boş shell (BOM S01'de); B sonra dağıtır.
- **izometri-oku.js / paor.js DOKUNULMAZ** (MK-49.1). Format mantığı `format-paketleri` / matcher tablosunda.

## Sonraki iş (185) — öneri
1. **Çok-spool köprü doğrulaması (769/771):** S02/S03'ün cizim_no'yla bağlandığını canlı gör (tek-spool S01 doğrulandı, mantık aynı).
2. **B — BOM dağıtımı (MK-182.5):** kayıt-bazlı (boş→pipeline-paylaşımlı, dolu→per-spool). Tersan'ı bozma.
3. **MK-184.1 şef konsolidasyonu:** spoolAnahtarlariUret tek-kaynak helper.

## Kritik test kuralları
- L3 AÇIK + TAZE devre + hard-refresh (MK-183.2).
- Devre-scoped SQL (MK-163.1) — global LIKE yanıltır.
- Şema değişen işte: migration APPLY → SONRA kod deploy (MK-184.5). Supabase auto-apply DEĞİL.

## Anahtar dosyalar
- `lib/izo-eslesme.js` (saf eşleştirme çekirdeği; 184/A FAZLA anahtar-seviyesi + self-test)
- `api/kuyruk-isle-izometri.js` (dosyaAdiParse, DOSYA_DESENLERI, kabukYukle [184/2b cizim_no], eslestir, montajEslestir)
- `ares-kabuk.js` (grupla, aktar [184/2b cizim_no yazar])
- `api/devre-inceleme.js` (inceleme endpoint, pozisyon→S0n)
- `devre_wizard_v3.html` (_paorKabukSatirlar, _paorBolShell, inceleGetir, terfi onayEt)
- `migrations/schema/104_spooller_cizim_no.sql`

## Açık borçlar (özet — detay CLAUDE-SONRAKI-OTURUM.md)
MK-184.1 şef konsolidasyon · MK-184.2 eslesenIzoIdx ölü kod · MK-184.3 KARARLAR.md backfill · MK-184.4 montaj köprü (kio:840) · MK-184.5 migration sırası · PAOR veri-kalite (agirlik/kalite/et/D-182.2) · çok-spool köprü tam test · L3 routing kırılganlık · mükerrer devre temizliği.

## Repo / DB
- Repo `github.com/cihatoztas-ai/arespipe` @ `~/Desktop/arespipe`. Prod `arespipe.vercel.app`.
- Supabase `ochvbepfiatzvyknkvsn` (arespipe-dev = prod). SQL Editor wrapper'sız.
- `arespipe_kopyala <src> <dst> <md5>` (3-arg). `gpc` = add+commit+rebase+push. `gp` = commit içermez (184'te tuzak — yalnız push).
- Migration: `migrations/schema/NNN_*.sql` (son 104). APPLY canlıya elle (SQL Editor) + dosya commit, İKİSİ ayrı.
