-- Migration 024 — Parser Seviye Kolonu
-- Oturum: 50
-- Tarih: 1 Mayis 2026
-- Amac: ai_api_log tablosuna parser_seviye kolonu ekle.
-- 50'de format ogrenme dongusu kuruluyor. Her parse cagrisi 3 seviyeden
-- biriyle yapiliyor: cache_hit (PDF SHA eslesti, AI cagrisi yok),
-- l2 (parser_kural ile deterministik, AI cagrisi yok),
-- l3 (AI vision ile ogrenme).
-- 51'de format envanter UI'si bu kolonu okur, raporlama temizlenir.

-- 1) Kolon ekle (default 'l3' geri uyumlu — eski kayitlar AI ile parse edildi)
ALTER TABLE ai_api_log
  ADD COLUMN IF NOT EXISTS parser_seviye text DEFAULT 'l3';

-- 2) CHECK constraint (gecerli degerler) — DROP+ADD pattern'i ile tekrar calistirilabilir
ALTER TABLE ai_api_log
  DROP CONSTRAINT IF EXISTS ai_api_log_parser_seviye_check;

ALTER TABLE ai_api_log
  ADD CONSTRAINT ai_api_log_parser_seviye_check
  CHECK (parser_seviye IN ('cache_hit', 'l2', 'l3'));

-- 3) Index'ler (raporlama icin, parser_seviye + format_id sik birlikte sorgulanir)
CREATE INDEX IF NOT EXISTS idx_ai_api_log_parser_seviye
  ON ai_api_log(parser_seviye);

CREATE INDEX IF NOT EXISTS idx_ai_api_log_format_seviye
  ON ai_api_log(format_id, parser_seviye)
  WHERE format_id IS NOT NULL;

-- 4) Aciklama
COMMENT ON COLUMN ai_api_log.parser_seviye IS
  'Parse seviyesi: cache_hit (PDF SHA cache HIT), l2 (parser_kural deterministik regex), l3 (AI vision ogrenme). 50. oturum migration 024.';

-- DOGRULAMA SORGULARI (manual run sonrasi kontrol icin)
--
-- 1) Kolon eklendi mi:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'ai_api_log' AND column_name = 'parser_seviye';
--
-- 2) CHECK constraint var mi:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name LIKE 'ai_api_log_parser%';
--
-- 3) Index'ler eklendi mi:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'ai_api_log' AND indexname LIKE 'idx_ai_api_log_%seviye%';
--
-- 4) Mevcut kayitlar default 'l3' aldi mi:
-- SELECT parser_seviye, COUNT(*) FROM ai_api_log GROUP BY parser_seviye;
