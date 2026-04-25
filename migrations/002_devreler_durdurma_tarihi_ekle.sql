-- 002_devreler_durdurma_tarihi_ekle.sql
-- Tarih: 25 Nisan 2026 — 33. oturum
-- Amaç: devreler tablosuna durdurma_tarihi kolonu ekle (D7 fix).
-- Spooller'da timestamptz olarak vardı; devreler'de eksikti.
-- Manuel SQL ile canlıya 25 Nis 2026'da uygulandı, bu dosya tarihsel kayıt.

BEGIN;

ALTER TABLE devreler
  ADD COLUMN IF NOT EXISTS durdurma_tarihi timestamptz;

COMMENT ON COLUMN devreler.durdurma_tarihi IS
  'Devrenin durdurulduğu an (UTC). NULL: hiç durdurulmadı veya tarih bilinmiyor.';

COMMIT;
