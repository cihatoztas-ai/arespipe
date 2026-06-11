-- 096 malzeme hazirlik duzeltme: teslim_adet dogru tabloda (spool_malzemeleri)
-- 095'te yanlislikla pipeline_malzemeleri'ne eklenmisti; gercek veri spool_malzemeleri'nde (1750 kalem).
-- devre bazli toplam: spool_malzemeleri.spool_id -> spooller.devre_id zinciri.

BEGIN;

ALTER TABLE spool_malzemeleri
  ADD COLUMN IF NOT EXISTS teslim_adet INTEGER NOT NULL DEFAULT 0;

COMMIT;
