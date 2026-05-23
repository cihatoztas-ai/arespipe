-- migrations/092_spooller_montaj_json.sql
-- Oturum 116 -- Montaj eslesme + gosterim (Karar 2-A).
--
-- Amac: Montaj izometrisinden gelen ust-veriyi (ait oldugu boru/pipeline, continue
--   baglanti, guverte, blok, sistem, toplam_agirlik, alistirma) eslesen spool kaydina
--   tasimak. eslestir() (api/kuyruk-isle-izometri.js) montaj dalinda bu kolona YAZAR;
--   spool_detay.html buradan OKUR.
--
-- Karar C (oturum 116): spooller.alistirma'ya YAZILMAZ (montaj 'alistirma' sinyali
--   sahadaki VAR/KISMI/YOK ile ayni eksen degil). Montaj alistirma degeri montaj_json
--   icinde salt-gosterim olarak durur.
--
-- MK-99.1: ADD COLUMN IF NOT EXISTS -> idempotent (ALTER zaten idempotent).
--   Nullable; mevcut satirlar NULL kalir (beklenen).
-- MK-99.x: dry-run ROLLBACK -> dogrula -> COMMIT. Bu dosya REPOda ROLLBACK halinde durur.

BEGIN;

ALTER TABLE spooller
  ADD COLUMN IF NOT EXISTS montaj_json jsonb;

COMMENT ON COLUMN spooller.montaj_json IS
  'Montaj izometrisi ust-verisi (oturum 116). eslestir() yazar, spool_detay okur. alistirma salt-gosterim (Karar C).';

-- dogrulama
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'spooller' AND column_name = 'montaj_json';

ROLLBACK;   -- dry-run arsiv. Supabase'de COMMIT'le calistirildi (23 May 2026 / oturum 116, kolon CANLI).
