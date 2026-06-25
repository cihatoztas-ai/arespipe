-- 111_belgeler_sevkiyat.sql
-- 25 Haziran 2026 — Oturum 205: Sevkiyat belge/foto Storage (C)
-- belgeler tablosu REUSE edildi (ayrı sevkiyat_belgeler tablosu yerine — RLS zaten kurulu,
--   devre_id/spool_id nullable FK deseni mevcut, devre_detay.html upload kodu aynalandı).
-- Eklenenler: sevkiyat_id FK kolonu + index + tur CHECK genişletme (irsaliye/teslim_fisi/foto).
-- NOT: Bu migration CANLIDA ZATEN UYGULANDI (Supabase SQL Editor). Repo bütünlüğü/repro amaçlı.
-- İdempotent: tekrar çalıştırılabilir (ADD COLUMN IF NOT EXISTS / DROP+ADD CONSTRAINT).

BEGIN;

ALTER TABLE belgeler
  ADD COLUMN IF NOT EXISTS sevkiyat_id uuid REFERENCES sevkiyatlar(id);

CREATE INDEX IF NOT EXISTS belgeler_sevkiyat_id_idx
  ON belgeler(sevkiyat_id);

ALTER TABLE belgeler DROP CONSTRAINT IF EXISTS belgeler_tur_check;
ALTER TABLE belgeler ADD CONSTRAINT belgeler_tur_check
  CHECK (tur IN ('izometri','sertifika','prosedur','rapor','diger','irsaliye','teslim_fisi','foto'));

COMMIT;
