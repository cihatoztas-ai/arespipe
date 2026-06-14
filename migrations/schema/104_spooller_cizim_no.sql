-- 184/#2b — PAOR terfi köprüsü: spooller.cizim_no (drawing-no eşleştirme anahtarı)
-- Faz1 (183) yalnız İNCELEME köprüsünü kurdu; terfi-sonrası izometri→spool bağlama
-- spooller'da cizim_no olmadan koptu. aktar yazar, kabukYukle harita anahtarını
-- cizim_no'dan kurar → eslestir (drawing-no pipeline) tutar.
-- Tersan: cizim_no NULL → '|| pipeline_no' fallback → davranış BİREBİR.
ALTER TABLE spooller ADD COLUMN IF NOT EXISTS cizim_no text;
COMMENT ON COLUMN spooller.cizim_no IS 'PAOR drawing-no eslestirme anahtari (Tersan NULL -> pipeline_no fallback). 184/#2b';
