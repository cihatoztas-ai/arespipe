-- =============================================================================
-- Migration: 018_format_tanimlari_sistem_preset.sql
-- Konu:      izometri_format_tanimlari tablosuna sistem_preset kolonu ekle
-- Oturum:    45 (29 Nisan 2026)
--
-- BAĞLAM
-- ------
-- IZOMETRI-BATCH-KARAR.md / Karar 2 (36): "sistem geneli format için
--   tenant_id NULL + sistem_preset=true". Bu kolon 005 migration'da eklenmemişti.
-- 45'te tersan + PAOR pilot seed (019) öncesi gereklidir.
-- E-06 (malzeme_tanimlari) pattern'inin aynısı uygulanır.
--
-- DEĞİŞİKLİK ÖZETİ
-- ----------------
-- + sistem_preset BOOLEAN NOT NULL DEFAULT false
-- + CHECK check_format_sistem_preset_tenant : sistem_preset=true => tenant_id IS NULL
-- + Partial unique index (ad) WHERE sistem_preset=true
-- + Mevcut PAOR kaydını sistem_preset=true olarak güncelle (tenant_id zaten NULL)
--
-- DOKUNULMAYAN
-- ------------
-- RLS policy'leri (mevcut kullanım canlı, kırma riski). Policy değişikliği
-- gerekirse 020+ migration'da ele alınır.
--
-- İDEMPOTENT: Tekrar çalıştırılabilir.
-- =============================================================================

BEGIN;

-- 1. Yeni kolon
ALTER TABLE izometri_format_tanimlari
  ADD COLUMN IF NOT EXISTS sistem_preset BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN izometri_format_tanimlari.sistem_preset IS
  'Sistem geneli format tanımı (her tenant okur, kimse silemez). true ise tenant_id NULL olmalı (CHECK ile zorlanır). E-06 (malzeme_tanimlari) pattern''i.';

-- 2. CHECK: sistem_preset=true ⟹ tenant_id IS NULL
ALTER TABLE izometri_format_tanimlari
  DROP CONSTRAINT IF EXISTS check_format_sistem_preset_tenant;

ALTER TABLE izometri_format_tanimlari
  ADD CONSTRAINT check_format_sistem_preset_tenant
  CHECK (sistem_preset = false OR tenant_id IS NULL);

-- 3. Partial unique: sistem preset'lerde "ad" benzersiz
DROP INDEX IF EXISTS izometri_format_tanimlari_preset_ad_unique_idx;

CREATE UNIQUE INDEX izometri_format_tanimlari_preset_ad_unique_idx
  ON izometri_format_tanimlari(ad)
  WHERE sistem_preset = true;

-- 4. Mevcut PAOR kaydını sistem_preset=true yap (tenant_id zaten NULL)
-- WHERE koşulu: idempotent — ikinci çalıştırmada UPDATE yapmaz
UPDATE izometri_format_tanimlari
SET sistem_preset = true
WHERE id = '2e7e8f0c-40f9-4d06-a78a-b759876121da'  -- PAOR kayıt UUID (B sorgusundan)
  AND tenant_id IS NULL
  AND sistem_preset = false;

COMMIT;

-- =============================================================================
-- DOĞRULAMA (COMMIT sonrası manuel çalıştır)
-- =============================================================================
--
-- 1. Kolon var mı:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name='izometri_format_tanimlari' AND column_name='sistem_preset';
--
-- 2. CHECK constraint:
-- SELECT conname, pg_get_constraintdef(oid) AS tanim
-- FROM pg_constraint
-- WHERE conrelid='izometri_format_tanimlari'::regclass
--   AND conname='check_format_sistem_preset_tenant';
--
-- 3. Partial unique index:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename='izometri_format_tanimlari'
--   AND indexname='izometri_format_tanimlari_preset_ad_unique_idx';
--
-- 4. PAOR kaydı güncellendi mi:
-- SELECT id, ad, tenant_id, sistem_preset, kullanim_sayisi
-- FROM izometri_format_tanimlari
-- ORDER BY ad;
-- Beklenen: PAOR kaydında sistem_preset=true
--
-- =============================================================================
