-- ============================================================================
-- Migration 054 — Taxonomy temizliği (83. oturum)
-- ============================================================================
-- Amaç:
--   1) tip='fitting' altında gizli kalmış flanşları tip='flansh''a taşı
--   2) spool_malzemeleri.tip için CHECK constraint ekle (kalıcı koruma)
--
-- Bağlam:
--   83. oturumda tespit edildi: 11 satır "Flange Slip-On..." veya
--   "International Shore Connection Flange..." tanım ile tip='fitting'
--   olarak girilmişti. Doğru taxonomy değildi.
--
-- Çalıştırıldı: 13 Mayıs 2026, Supabase Studio (production)
-- İdempotent: ✓ (UPDATE'in WHERE filtresi yeniden çalıştırılınca 0 satır etkiler)
-- Geri alma:
--   UPDATE spool_malzemeleri SET tip='fitting'
--   WHERE tip='flansh' AND (tanim ILIKE '%flange%' OR tanim ILIKE '%flansh%');
--   ALTER TABLE spool_malzemeleri DROP CONSTRAINT spool_malzemeleri_tip_chk;
-- ============================================================================

BEGIN;

-- 1) "fitting" altında gizli 11 flanşı doğru tip'e taşı
UPDATE spool_malzemeleri
SET tip = 'flansh'
WHERE tip = 'fitting'
  AND (tanim ILIKE '%flange%' OR tanim ILIKE '%flansh%');
-- Beklenen: 11 satır etkilenir (83. oturumda doğrulandı)

-- 2) tip CHECK constraint — kalıcı koruma
ALTER TABLE spool_malzemeleri
DROP CONSTRAINT IF EXISTS spool_malzemeleri_tip_chk;

ALTER TABLE spool_malzemeleri
ADD CONSTRAINT spool_malzemeleri_tip_chk
CHECK (tip IN ('boru', 'fitting', 'flansh', 'malzeme'));

-- 3) Doğrulama (83. oturum kontrolü için referans)
-- SELECT tip, count(*) FROM spool_malzemeleri GROUP BY tip ORDER BY count DESC;
-- Beklenen: boru=70, fitting=79, flansh=11 (toplam 160)

COMMIT;
