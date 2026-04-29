-- ============================================================================
-- 020_format_tanimlari_temizlik.sql
-- 47. oturum — DB temizliği
-- 29 Nisan 2026
--
-- 46. oturum bulguları DB'ye yansıyor:
--   • Cadmatic glyph mapping problemi (PDF metinleri pdf-parse'a uymuyor)
--   • PAOR ana PDF'leri tamamen raster (sadece görsel, metin yok)
--   • PAOR Isometric_View varyantı kısmi temiz metin içeriyor
--   • Eski PAOR fingerprint'i Producer "AVEVA","STM" diyordu — gerçek "PDF-XChange"
--   • 005'ten beri canlı sistem fingerprint hep kırık çalışmış (her PDF Vision AI fallback)
--
-- Migration mantığı:
--   1. requires_ai + requires_ocr flag'leri (MK-46.1: Vision AI ana motor, kademeli azaltma)
--   2. Eski 2 test kaydı silinir (FK SET NULL davranışlı, log/batch tabloları korunur)
--   3. format_kodu için unique index
--   4. 4 doğru kayıt: paor_ana, paor_iso_view, tersan_isometry, tersan_spool
--
-- Mimari kararlar: docs/CLAUDE-SON-OTURUM.md (46. oturum, MK-46.1 → MK-46.6)
-- ============================================================================

-- 1) requires_ai + requires_ocr kolonları (varsa atlar)
ALTER TABLE izometri_format_tanimlari
  ADD COLUMN IF NOT EXISTS requires_ai BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS requires_ocr BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN izometri_format_tanimlari.requires_ai IS
  '46.1: Vision AI olmadan parse edilemez (raster, glyph problemi vb.).';
COMMENT ON COLUMN izometri_format_tanimlari.requires_ocr IS
  '46.1: OCR ön-işlem ile AI yedek senaryosu (48+ için yer rezervi).';

-- 2) Mevcut iki test kaydını sil
DELETE FROM izometri_format_tanimlari
WHERE id IN (
  '2e7e8f0c-40f9-4d06-a78a-b759876121da',  -- AVEVA E3D - Portuguese Navy AOR (PAOR)
  'c8755d46-5bcc-4a61-88ca-f1d48399e054'   -- Cadmatic — Tersan Shipyard M110 Şablonu
);

-- 3) format_kodu için unique index (varsa atlar)
CREATE UNIQUE INDEX IF NOT EXISTS idx_format_tanimlari_format_kodu
  ON izometri_format_tanimlari(format_kodu)
  WHERE format_kodu IS NOT NULL;

-- 4) 4 yeni format kaydı

-- 4.1 PAOR Ana Çizim (38/38 raster, sadece Vision AI)
INSERT INTO izometri_format_tanimlari (
  ad, format_kodu, cad_program,
  sistem_preset, tenant_id, aktif, kullanim_sayisi,
  requires_ai, requires_ocr,
  fingerprint, parser_kural
) VALUES (
  'PAOR Ana Çizim',
  'paor_aveva_ana',
  'AVEVA E3D',
  true, NULL, true, 0,
  true, false,
  jsonb_build_object(
    'ulke', 'PT',
    'tersane', 'STM',
    'baslik_regex', 'PORTUGUESE NAVY AOR',
    'dosya_adi_regex', '^11D-PAOR-\d{5}-\d{6}-[A-Z0-9]+\.pdf$',
    'pdf_uretici_anahtar', jsonb_build_array('PDF-XChange')
  ),
  '{}'::jsonb
);

-- 4.2 PAOR Isometric View (kısmi metin, ileride pipeline_no çıkarılabilir)
INSERT INTO izometri_format_tanimlari (
  ad, format_kodu, cad_program,
  sistem_preset, tenant_id, aktif, kullanim_sayisi,
  requires_ai, requires_ocr,
  fingerprint, parser_kural
) VALUES (
  'PAOR Isometric View',
  'paor_aveva_iso_view',
  'AVEVA E3D',
  true, NULL, true, 0,
  true, false,
  jsonb_build_object(
    'ulke', 'PT',
    'tersane', 'STM',
    'baslik_regex', 'PORTUGUESE NAVY AOR',
    'dosya_adi_regex', '^11D-PAOR-\d{5}-\d{6}-[A-Z0-9]+-Isometric_View\.pdf$',
    'pdf_uretici_anahtar', jsonb_build_array('PDF-XChange')
  ),
  '{}'::jsonb
);

-- 4.3 Tersan M110 Montaj Resmi (Cadmatic Isometry, başlık kısmen temiz)
INSERT INTO izometri_format_tanimlari (
  ad, format_kodu, cad_program,
  sistem_preset, tenant_id, aktif, kullanim_sayisi,
  requires_ai, requires_ocr,
  fingerprint, parser_kural
) VALUES (
  'Tersan M110 Montaj Resmi',
  'tersan_cadmatic_isometry',
  'Cadmatic',
  true, NULL, true, 0,
  true, false,
  jsonb_build_object(
    'ulke', 'TR',
    'tersane', 'Tersan Shipyard',
    'baslik_regex', 'Malzeme Listesi',
    'tablo_baslik_regex', 'Cut & Bending Info',
    'dosya_adi_regex', '^M\d+-\d+-\d+\.\d+\.pdf$',
    'pdf_uretici_anahtar', jsonb_build_array('Cadmatic', 'Piping Isometrics & Spools')
  ),
  '{}'::jsonb
);

-- 4.4 Tersan M110 İmalat Resmi (Cadmatic Spool, tamamen bozuk text)
INSERT INTO izometri_format_tanimlari (
  ad, format_kodu, cad_program,
  sistem_preset, tenant_id, aktif, kullanim_sayisi,
  requires_ai, requires_ocr,
  fingerprint, parser_kural
) VALUES (
  'Tersan M110 İmalat Resmi',
  'tersan_cadmatic_spool',
  'Cadmatic',
  true, NULL, true, 0,
  true, false,
  jsonb_build_object(
    'ulke', 'TR',
    'tersane', 'Tersan Shipyard',
    'baslik_regex', 'Malzeme Listesi',
    'tablo_baslik_regex', 'Cut & Bending Info',
    'dosya_adi_regex', '^[A-Z]\d+-\d+-\d+-P\d+\s+\d+\(\d+\)\.S\d+\.\d+\.pdf$',
    'pdf_uretici_anahtar', jsonb_build_array('Cadmatic', 'Piping Isometrics & Spools')
  ),
  '{}'::jsonb
);
