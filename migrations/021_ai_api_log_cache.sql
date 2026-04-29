-- ============================================================================
-- 021: ai_api_log cache infrastructure
-- ============================================================================
-- 48. oturum: Vision AI cevap cache mekanizmasi icin pdf_sha256 + partial index.
-- Vizyon Madde 4 (ogrenme dongusu) operasyonel basliyor.
--
-- Akis:
--   PDF gelir -> SHA256 hesaplanir -> formatTani -> ai_api_log lookup
--     HIT  : cevap_full JSONB parse, eski sonuc dondurulur (~0.5 sn, $0)
--     MISS : visionAIParse normal, sonuc ai_api_log'a hash ile yazilir
--
-- Onkosul: 020 uygulanmis (format_id artik dogru loglaniyor - MK-47.3).
-- ============================================================================

ALTER TABLE ai_api_log
  ADD COLUMN IF NOT EXISTS pdf_sha256 TEXT;

-- Partial index: sadece basarili + hash dolu kayitlar.
-- Sebep: Basarisiz parse'lar cache'lenmemeli. Eski log'lar (47 oncesi) NULL
-- kalir, dogal cache miss; geriye donuk hash hesabi yapilmaz (Cihat onayli).
CREATE INDEX IF NOT EXISTS idx_ai_api_log_cache
  ON ai_api_log(pdf_sha256, format_id)
  WHERE basarili = true AND pdf_sha256 IS NOT NULL;

COMMENT ON COLUMN ai_api_log.pdf_sha256 IS
  '48: PDF SHA256 hash. Vision AI cache lookup icin. Hash + format_id + basarili filtresiyle ayni PDF tekrar yuklenirse Vision AI cagrisi atlanir.';

COMMENT ON INDEX idx_ai_api_log_cache IS
  '48: Cache lookup partial index. Sadece basarili + hash dolu kayitlar uzerinde, cache miss/hit kontrolu O(log n).';
