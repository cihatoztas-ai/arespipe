-- ============================================================================
-- 082_devre_belgeleri_mime_genisletme.sql
-- Macro-enabled Office dosyalarını whitelist'e ekle
-- ----------------------------------------------------------------------------
-- ARKAPLAN: 99 oturum smoke test'inde .xlsm uzantılı 2 dosya reddedildi
-- (Resim Teslim Tutanağı.xlsm, IFS Malzeme List.xlsm).
-- Tersanelerde BOM/form dosyaları sıkça macro-enabled Excel formatında tutuluyor.
--
-- EKLENENLER:
--   .xlsm  application/vnd.ms-excel.sheet.macroenabled.12     (macro Excel)
--   .xltm  application/vnd.ms-excel.template.macroenabled.12  (macro Excel template)
--   .docm  application/vnd.ms-word.document.macroenabled.12   (macro Word)
--   .pptm  application/vnd.ms-powerpoint.presentation.macroenabled.12 (macro PPT)
--
-- ÖNKOŞUL: Migration 081 canlıda (bucket var)
-- KARAR-97.0: Mevcut MIME whitelist'i genişletir, hiçbir veri kaybı yok
-- MK-98.2: BEGIN...ROLLBACK kuru çalıştırma zorunlu
-- ============================================================================

BEGIN;

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- Mevcut 11 MIME (migration 081)
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',          -- .xlsx
  'application/vnd.ms-excel',                                                    -- .xls
  'application/octet-stream',                                                    -- step/stp/3dm/dwg
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',    -- .docx
  'text/plain',
  'text/csv',

  -- ★ Yeni eklenenler (082)
  'application/vnd.ms-excel.sheet.macroenabled.12',                              -- .xlsm
  'application/vnd.ms-excel.template.macroenabled.12',                           -- .xltm
  'application/vnd.ms-word.document.macroenabled.12',                            -- .docm
  'application/vnd.ms-powerpoint.presentation.macroenabled.12'                   -- .pptm
]
WHERE id = 'devre-belgeleri';

-- ─── Smoke test sorgusu (yorum halinde) ──────────────────────────────────────
-- SELECT array_length(allowed_mime_types, 1) AS mime_count
-- FROM storage.buckets WHERE id = 'devre-belgeleri';
-- Beklenen: 15 (11 + 4 yeni)

COMMIT;

-- ============================================================================
-- DOWN — Geri alma
-- ============================================================================
-- BEGIN;
--   UPDATE storage.buckets
--   SET allowed_mime_types = ARRAY[
--     'application/pdf',
--     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
--     'application/vnd.ms-excel',
--     'application/octet-stream',
--     'image/png',
--     'image/jpeg',
--     'image/jpg',
--     'application/zip',
--     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
--     'text/plain',
--     'text/csv'
--   ]
--   WHERE id = 'devre-belgeleri';
-- COMMIT;
