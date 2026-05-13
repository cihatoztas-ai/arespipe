-- ============================================================================
-- Migration 055 — FK kolonları + junction migrate (83. oturum)
-- ============================================================================
-- Amaç:
--   1) spool_malzemeleri'ne 3 FK kolonu ekle (boru, fitting, flansh için)
--   2) spool_flansh_eslesme junction'daki kayıtları FK kolonuna migrate et
--   3) Junction tablosunu DEPRECATED işaretle (silmiyoruz, 85'te DROP)
--   4) FK lookup performansı için partial indexler ekle
--
-- Bağlam:
--   41. oturumda flanş eşleşmesi için spool_flansh_eslesme junction tablosu
--   açılmıştı. Pratikte sadece 1 kayıt var, yani ölü mimari.
--   Boru runtime eşleştirmesi (44. oturum) FK kaydetmiyordu.
--   Fitting için hiçbir bağlama yoktu.
--   83. oturumda tüm bağlamalar tek paterne çekildi: FK on spool_malzemeleri.
--
-- Çalıştırıldı: 13 Mayıs 2026, Supabase Studio (production)
-- İdempotent: ✓ (ADD COLUMN IF NOT EXISTS, junction UPDATE flansh_olculer_id
--               zaten doluysa atlar)
-- Geri alma:
--   ALTER TABLE spool_malzemeleri
--     DROP COLUMN boru_olculer_id,
--     DROP COLUMN fitting_olculer_id,
--     DROP COLUMN flansh_olculer_id;
--   COMMENT ON TABLE spool_flansh_eslesme IS NULL;
-- ============================================================================

BEGIN;

-- 1) Üç FK kolonu ekle (malzeme_ref_id zaten 19. oturumda eklenmişti)
ALTER TABLE spool_malzemeleri
ADD COLUMN IF NOT EXISTS boru_olculer_id    UUID REFERENCES boru_olculer(id),
ADD COLUMN IF NOT EXISTS fitting_olculer_id UUID REFERENCES fitting_olculer(id),
ADD COLUMN IF NOT EXISTS flansh_olculer_id  UUID REFERENCES flansh_olculer(id);

-- 2) Junction'daki kayıtları FK'ya migrate et (yalnızca FK boşsa)
UPDATE spool_malzemeleri sm
SET flansh_olculer_id = e.flansh_id
FROM spool_flansh_eslesme e
WHERE sm.id = e.spool_malzeme_id
  AND sm.flansh_olculer_id IS NULL;
-- Beklenen: 1 satır etkilenir (83. oturumda doğrulandı)

-- 3) Junction tablosunu DEPRECATED işaretle
-- 85. oturumda izleme bittikten sonra DROP TABLE edilecek
COMMENT ON TABLE spool_flansh_eslesme IS
  'DEPRECATED (83.D / migration 055) — replaced by spool_malzemeleri.flansh_olculer_id. Safe to DROP after 85. oturum if no new inserts seen.';

-- 4) Partial indexler — FK lookup performansı için
-- Yalnızca dolu satırlar için index, indeks boyutu minimum
CREATE INDEX IF NOT EXISTS idx_spool_malzemeleri_boru_fk
  ON spool_malzemeleri(boru_olculer_id)
  WHERE boru_olculer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spool_malzemeleri_fitting_fk
  ON spool_malzemeleri(fitting_olculer_id)
  WHERE fitting_olculer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spool_malzemeleri_flansh_fk
  ON spool_malzemeleri(flansh_olculer_id)
  WHERE flansh_olculer_id IS NOT NULL;

-- 5) Doğrulama (83. oturum kontrolü için referans)
-- SELECT
--   count(*) FILTER (WHERE boru_olculer_id    IS NOT NULL) AS boru_fk_dolu,
--   count(*) FILTER (WHERE fitting_olculer_id IS NOT NULL) AS fitting_fk_dolu,
--   count(*) FILTER (WHERE flansh_olculer_id  IS NOT NULL) AS flansh_fk_dolu,
--   count(*) FILTER (WHERE malzeme_ref_id     IS NOT NULL) AS malzeme_ref_dolu
-- FROM spool_malzemeleri;
-- Beklenen: boru=0 (056 öncesi), fitting=0, flansh=1, malzeme=121

COMMIT;
