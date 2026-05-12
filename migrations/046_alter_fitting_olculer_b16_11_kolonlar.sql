-- ============================================================================
-- Migration 046 - B16.11 socket fittings icin fitting_olculer sema genisleme
-- ============================================================================
-- Amac: ASME B16.11 socket weld fittings, B16.9 fittings ile ayni tabloda
-- saklanabilsin. 3 yeni kolon ve 1 CHECK constraint eklenir.
--
-- Etkilenen: fitting_olculer (mevcut 424 satir korunur, hepsi class_no=NULL)
-- Yeni kolonlar: class_no, soket_derinlik_mm, soket_ic_cap_mm
-- Yeni constraint: class_no_check (2000/3000/6000/9000/NULL)
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + DROP CONSTRAINT IF EXISTS pattern
-- Disiplin: MK-76.1 (implicit transaction), MK-76.3 (ASCII-only yorumlar)
--
-- Devami: 047_inserts_b16_11_socket_beta.sql (yaklasik 153 satir veri)
-- ============================================================================

-- 1) Yeni kolonlar (idempotent)
ALTER TABLE fitting_olculer
  ADD COLUMN IF NOT EXISTS class_no INTEGER;

ALTER TABLE fitting_olculer
  ADD COLUMN IF NOT EXISTS soket_derinlik_mm NUMERIC;

ALTER TABLE fitting_olculer
  ADD COLUMN IF NOT EXISTS soket_ic_cap_mm NUMERIC;

-- 2) class_no izinli degerler (ASME B16.11 standart pressure classes)
-- Class 2000/3000/6000 = threaded fittings, Class 3000/6000/9000 = socket weld
-- B16.9 BW fittings icin NULL (mevcut 424 satir).
ALTER TABLE fitting_olculer
  DROP CONSTRAINT IF EXISTS fitting_olculer_class_no_check;

ALTER TABLE fitting_olculer
  ADD CONSTRAINT fitting_olculer_class_no_check
  CHECK (class_no IS NULL OR class_no IN (2000, 3000, 6000, 9000));

-- 3) Aciklayici yorumlar
COMMENT ON COLUMN fitting_olculer.class_no IS
  'ASME B16.11 basinc sinifi (2000/3000/6000/9000). B16.9 BW fittings icin NULL.';

COMMENT ON COLUMN fitting_olculer.soket_derinlik_mm IS
  'ASME B16.11 soket derinlik min (J degeri, mm). Borunun socket icindeki gomulme uzunlugu.';

COMMENT ON COLUMN fitting_olculer.soket_ic_cap_mm IS
  'ASME B16.11 soket ic capi (B max degeri, boru OD + tolerans, mm).';

-- ============================================================================
-- Dogrulama sorgulari (calistirdiktan sonra elle kontrol icin):
--
-- 1) Yeni kolonlar var mi:
--    SELECT column_name, data_type
--    FROM information_schema.columns
--    WHERE table_name = 'fitting_olculer'
--      AND column_name IN ('class_no', 'soket_derinlik_mm', 'soket_ic_cap_mm');
--    Beklenen: 3 satir
--
-- 2) Mevcut 424 satir bozulmadi mi:
--    SELECT count(*), count(class_no) FROM fitting_olculer;
--    Beklenen: count=424, count(class_no)=0 (hepsi NULL)
--
-- 3) class_no CHECK constraint aktif mi:
--    INSERT INTO fitting_olculer (geometri_std, parca_tipi, cap_buyuk_dn,
--      cap_buyuk_mm, class_no) VALUES ('test', 'test', 50, 60.3, 5000);
--    Beklenen: ERROR (5000 izinli liste disinda)
--    -- Bu testten sonra ROLLBACK gerek; veya hic calistirma.
-- ============================================================================
