-- Migration 093 -- spooller.imalat_not (oturum 117)
-- Imalat izometrisi NOT alani ham metni. PDF "NOT: ..." -> spool detay Notlar (personele gorunur).
-- D2-genis (KARAR-117): alistirma 'VAR' (komple alistirma parcasi) ise imalat_not YAZILMAZ
--   (alistirma sutununda gorunur, tekrar gereksiz). KISMI / saf talimat -> imalat_not yazilir.
-- Canli: Supabase'de COMMIT edildi (dry-run ROLLBACK -> dogrula -> COMMIT). Bu dosya repo arsividir.

BEGIN;

ALTER TABLE spooller ADD COLUMN IF NOT EXISTS imalat_not text;
COMMENT ON COLUMN spooller.imalat_not IS 'Imalat izometrisi NOT alani ham metni (oturum 117). PDF NOT: ... -> personele gosterilir. D2-genis: alistirma VAR ise yazilmaz.';

COMMIT;
