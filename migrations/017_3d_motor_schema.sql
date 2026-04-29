-- =============================================================================
-- Migration: 017_3d_motor_schema.sql
-- Konu:      3D motor entegrasyonu için spool_malzemeleri kolon eklemeleri
-- Oturum:    45 (29 Nisan 2026)
--
-- DEĞİŞİKLİK ÖZETİ
-- ----------------
-- + sira INTEGER           : 3D motor parça sırası (parser çıktısı yazar)
-- + rotation_angle INTEGER : dirsek/parça dönüş açısı, derece 0-359 (tersan formatı)
-- + yonelim_kod TEXT       : manuel düzeltme yönelim kodu (set'li)
-- + idx_spool_malzeme_sira : composite index (spool_id, sira) — sıralı okuma için
-- + 2 CHECK constraint     : rotation_angle aralığı + yonelim_kod set'i
--
-- DOKUNULMAYAN KOLONLAR (zaten var, doğrulandı 29 Nis 2026)
-- ---------------------------------------------------------
-- x1_mm/y1_mm/z1_mm/x2_mm/y2_mm/z2_mm — PAOR koordinatları için kullanılacak
-- malzeme_ref_id — E-06 master tablo FK, dokunulmaz
--
-- İDEMPOTENT: Tekrar çalıştırılabilir (IF NOT EXISTS + DROP CONSTRAINT IF EXISTS).
-- =============================================================================

BEGIN;

-- 1. Yeni kolonlar
ALTER TABLE spool_malzemeleri
  ADD COLUMN IF NOT EXISTS sira INTEGER;

ALTER TABLE spool_malzemeleri
  ADD COLUMN IF NOT EXISTS rotation_angle INTEGER;

ALTER TABLE spool_malzemeleri
  ADD COLUMN IF NOT EXISTS yonelim_kod TEXT;

-- 2. Kolon açıklamaları (DB introspection için, tablo şişirmesi yok)
COMMENT ON COLUMN spool_malzemeleri.sira IS
  '3D motor için parça sırası (parser çıktısı). Spool zincirinde 1, 2, 3,... şeklinde artar. NULL = sıralama bilinmiyor (3D motor default şekil çizer).';

COMMENT ON COLUMN spool_malzemeleri.rotation_angle IS
  'Dirsek/parça dönüş açısı (derece, 0-359). tersan formatından "Rotation Angle" sütunu deterministik okunur. NULL = bilinmiyor (default 0 = yukarı).';

COMMENT ON COLUMN spool_malzemeleri.yonelim_kod IS
  'Manuel düzeltme yönelim kodu. Set: yukari, asagi, sola, saga, on, arka. NULL = rotation_angle veya default kullanılır. Manuel düzeltme UI (Aşama 4.3) için.';

-- 3. CHECK: rotation_angle aralığı (0-359, NULL serbest)
ALTER TABLE spool_malzemeleri
  DROP CONSTRAINT IF EXISTS spool_malzemeleri_rotation_angle_range;

ALTER TABLE spool_malzemeleri
  ADD CONSTRAINT spool_malzemeleri_rotation_angle_range
  CHECK (rotation_angle IS NULL OR (rotation_angle >= 0 AND rotation_angle < 360));

-- 4. CHECK: yonelim_kod sabit set (Türkçe canonical kod, i18n etiket UI'da yapılır)
ALTER TABLE spool_malzemeleri
  DROP CONSTRAINT IF EXISTS spool_malzemeleri_yonelim_kod_set;

ALTER TABLE spool_malzemeleri
  ADD CONSTRAINT spool_malzemeleri_yonelim_kod_set
  CHECK (yonelim_kod IS NULL OR yonelim_kod IN ('yukari','asagi','sola','saga','on','arka'));

-- 5. Index: 3D motor sıralı okumayı hızlandırır (WHERE spool_id=? ORDER BY sira)
CREATE INDEX IF NOT EXISTS idx_spool_malzeme_sira
  ON spool_malzemeleri(spool_id, sira);

COMMIT;

-- =============================================================================
-- DOĞRULAMA (COMMIT sonrası manuel çalıştır)
-- =============================================================================
--
-- 1. Yeni kolonlar var mı (3 satır beklenir):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'spool_malzemeleri'
--   AND column_name IN ('sira','rotation_angle','yonelim_kod')
-- ORDER BY column_name;
--
-- 2. CHECK constraint'ler aktif mi (2 satır beklenir):
-- SELECT conname, pg_get_constraintdef(oid) AS tanim
-- FROM pg_constraint
-- WHERE conrelid = 'spool_malzemeleri'::regclass
--   AND conname IN (
--     'spool_malzemeleri_rotation_angle_range',
--     'spool_malzemeleri_yonelim_kod_set'
--   )
-- ORDER BY conname;
--
-- 3. Index var mı (1 satır beklenir):
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'spool_malzemeleri'
--   AND indexname = 'idx_spool_malzeme_sira';
--
-- =============================================================================
