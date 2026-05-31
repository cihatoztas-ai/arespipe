-- 095 malzeme hazirlik: yildiz kuyrugu DB'ye (cok-cihaz/mobil gorunurluk) + miktar bazli teslim
-- A(a): devreler.malzeme_kuyrukta (renk buradan + teslim/ihtiyac toplamindan turetilir)
-- B: pipeline_malzemeleri.teslim_adet (adet=ihtiyac, teslim_adet=sahaya gelen)

BEGIN;

ALTER TABLE devreler
  ADD COLUMN IF NOT EXISTS malzeme_kuyrukta BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE pipeline_malzemeleri
  ADD COLUMN IF NOT EXISTS teslim_adet NUMERIC NOT NULL DEFAULT 0;

UPDATE pipeline_malzemeleri
   SET teslim_adet = COALESCE(adet, 0)
 WHERE hazir = true;

COMMIT;
