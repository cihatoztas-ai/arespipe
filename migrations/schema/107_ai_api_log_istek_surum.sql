-- 107_ai_api_log_istek_surum.sql
-- 186 / MK-186.4 (Step 5): cache surumleme.
-- ai_api_log'a istek_surum (parse mantigi surum parmak izi) kolonu.
-- cacheKontrol artik pdf_sha256+format_id+tenant_id+basarili + ISTEK_SURUM ile eslesir.
-- Prompt/crop/model degisince surum degisir -> eski cache otomatik MISS (manuel invalidate biter).
-- Eski kayitlarda istek_surum=NULL -> yeni surum filtresine eslesmez -> bir kerelik temiz tazeleme.
-- Additive + idempotent. Dry-run: BEGIN; <asagi>; ROLLBACK; sonra duz calistir (MK-98.2).

ALTER TABLE ai_api_log
  ADD COLUMN IF NOT EXISTS istek_surum text;

COMMENT ON COLUMN ai_api_log.istek_surum IS
  '186: parse istegi surum parmak izi (sha256[:16] of PARSE_SURUM|model|sistem_prompt|crop). Cache anahtari parcasi -- prompt/crop degisince otomatik MISS.';
