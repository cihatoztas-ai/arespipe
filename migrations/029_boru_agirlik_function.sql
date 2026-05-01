-- ============================================================
-- 029 — boru_agirlik_hesapla() function
-- ============================================================
-- Amaç: Tenant özel boru kayıtları için ağırlık otomatik hesabı.
--       Kullanıcı sadece OD ve ET girer, fonksiyon malzeme grubu
--       yoğunluğunu kullanarak kg/m hesaplar.
--
-- Formül: 
--   ic_cap_mm = OD - 2 × ET  (zaten generated column)
--   kesit_alani_mm² = π × (OD² - ic²) / 4
--   agirlik_kg_m = kesit_alani × yoğunluk × 10⁻⁶
--
-- Yoğunluk değerleri (kg/m³):
--   karbon çelik       : 7850
--   paslanmaz çelik    : 7900
--   alüminyum          : 2700
--   bakır              : 8960
--   pirinç             : 8500
--   cunife (90/10)     : 8900
--   cunife (70/30)     : 8950
--   nikel              : 8908
--   monel              : 8800
--   inconel            : 8470
--   titanyum           : 4506
--   plastik (default)  : 1400  (PE/PP arası)
--
-- Kullanımı:
--   INSERT INTO boru_olculer (..., agirlik_kg_m, ...)
--   VALUES (..., COALESCE(NULL, boru_agirlik_hesapla(60.3, 6.3, 'karbon')), ...);
--
-- Idempotent: CREATE OR REPLACE
-- ============================================================

CREATE OR REPLACE FUNCTION boru_agirlik_hesapla(
  od_mm NUMERIC,
  et_mm NUMERIC,
  malzeme_grubu_in TEXT DEFAULT 'karbon'
) RETURNS NUMERIC AS $$
DECLARE
  yogunluk_kg_m3 NUMERIC;
  ic_mm NUMERIC;
  kesit_alani_mm2 NUMERIC;
  agirlik NUMERIC;
BEGIN
  -- Geçersiz girdi kontrolü
  IF od_mm IS NULL OR et_mm IS NULL OR od_mm <= 0 OR et_mm <= 0 THEN
    RETURN NULL;
  END IF;

  -- Et kalınlığı yarıçaptan büyük olamaz
  IF (2 * et_mm) >= od_mm THEN
    RETURN NULL;
  END IF;

  -- Malzeme yoğunluğu (kg/m³)
  yogunluk_kg_m3 := CASE LOWER(COALESCE(malzeme_grubu_in, 'karbon'))
    WHEN 'karbon'         THEN 7850
    WHEN 'karbon_celik'   THEN 7850
    WHEN 'paslanmaz'      THEN 7900
    WHEN 'aluminyum'      THEN 2700
    WHEN 'bakir'          THEN 8960
    WHEN 'pirinc'         THEN 8500
    WHEN 'cunife'         THEN 8900   -- 90/10 default
    WHEN 'cunife_90_10'   THEN 8900
    WHEN 'cunife_70_30'   THEN 8950
    WHEN 'nikel'          THEN 8908
    WHEN 'monel'          THEN 8800
    WHEN 'inconel'        THEN 8470
    WHEN 'titanyum'       THEN 4506
    WHEN 'plastik'        THEN 1400
    WHEN 'pvc'            THEN 1400
    WHEN 'pe'             THEN 950
    WHEN 'pp'             THEN 905
    ELSE 7850   -- default karbon (en yaygın)
  END;

  -- Hesap
  ic_mm := od_mm - (2 * et_mm);
  kesit_alani_mm2 := PI() * (POWER(od_mm, 2) - POWER(ic_mm, 2)) / 4;
  agirlik := kesit_alani_mm2 * yogunluk_kg_m3 / 1000000;

  -- 3 ondalığa yuvarla (mevcut DB konvansiyonu)
  RETURN ROUND(agirlik::NUMERIC, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION boru_agirlik_hesapla(NUMERIC, NUMERIC, TEXT) IS
  'Boru ağırlık hesabı (kg/m). Tenant özel ölçü kayıtlarında ve '
  'standart kütüphane doğrulamada kullanılır. '
  'Default malzeme: karbon çelik (7850 kg/m³).';

-- ============================================================
-- Self-test: Bilinen değerlerle doğrulama
-- ============================================================
-- DN 100 SCH 40 karbon: OD=114.3, ET=6.02 → ~16.08 kg/m (Wermac)
-- DN 50 6.3mm karbon: OD=60.3, ET=6.3 → ~8.39 kg/m
-- DN 50 SCH 80 karbon: OD=60.3, ET=5.54 → ~7.48 kg/m
-- ============================================================

DO $$
DECLARE
  v1 NUMERIC; v2 NUMERIC; v3 NUMERIC;
BEGIN
  v1 := boru_agirlik_hesapla(114.3, 6.02, 'karbon');
  v2 := boru_agirlik_hesapla(60.3, 6.3, 'karbon');
  v3 := boru_agirlik_hesapla(60.3, 5.54, 'karbon');

  RAISE NOTICE 'Function test:';
  RAISE NOTICE '  DN 100 SCH 40 karbon (114.3 × 6.02): % kg/m (Wermac referansı 16.08)', v1;
  RAISE NOTICE '  DN 50 tenant özel (60.3 × 6.3): % kg/m (hesap referansı 8.39)', v2;
  RAISE NOTICE '  DN 50 SCH 80 karbon (60.3 × 5.54): % kg/m (Wermac referansı 7.48)', v3;
END $$;
