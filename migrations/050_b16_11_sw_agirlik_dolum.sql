-- ============================================================
-- Migration 050 -- 80. oturum (12 May 2026)
-- B16.11 SW fitting agirlik dolum
-- Kaynak: Bonney Forge Catalog F9-2012 (primary, ISO 9001, B16 komitesi)
-- Cross-check: pipingpipeline.com (secondary)
-- ASME B16.11-2011 standartinda mass tablosu YOK -- bu yuzden uretici tablosu kullanildi
-- MK-79.3: fitting agirlik tablo-uretici (uretici varyans %5-15, B16.11 SW'de
--          C6000 ve NPS 4 anomaly icin %30-50'ye kadar normal)
-- MK-80.1: Bonney Forge primary, pipingpipeline secondary
-- KARAR-80.2: BF'de eksik NPS icin PP secondary kullanilir (DN 20 C6000 coupling_half)
-- Pattern (049 ile birebir): UPDATE FROM (VALUES) AS v(...), JSON notlar, idempotent
-- Kapsam: 7 parca tipi x (9 C3000 + 6 C6000) = 105 satir
-- Schedule: B16.11 SW schedule-bagimsiz (uclu NULL, KARAR-79.4)
-- ============================================================

-- 1. 90SW (90-deg Elbow Socket Weld) -- 15 satir
UPDATE fitting_olculer
SET agirlik_kg = v.agirlik_kg,
    notlar = v.notlar
FROM (VALUES
    -- Class 3000 (NPS 1/2-4, 9 satir)
    (15::integer,  3000::integer, 0.20::numeric, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans ortalama %8","agirlik_schedule_bagimli_kg":null}'::text),
    (20,  3000, 0.34, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com tam ortusen","agirlik_schedule_bagimli_kg":null}'),
    (25,  3000, 0.48, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %7","agirlik_schedule_bagimli_kg":null}'),
    (32,  3000, 0.69, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %12","agirlik_schedule_bagimli_kg":null}'),
    (40,  3000, 0.94, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %9","agirlik_schedule_bagimli_kg":null}'),
    (50,  3000, 1.53, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %4","agirlik_schedule_bagimli_kg":null}'),
    (65,  3000, 3.03, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %8","agirlik_schedule_bagimli_kg":null}'),
    (80,  3000, 5.03, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %5","agirlik_schedule_bagimli_kg":null}'),
    (100, 3000, 10.25,'{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com NPS 4 anomaly 14.50 kg supheli, BF tutarli pattern (MK-80.1)","agirlik_schedule_bagimli_kg":null}'),
    -- Class 6000 (NPS 1/2-2, 6 satir)
    (15,  6000, 0.27, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %42 (PP=0.46), BF tutarli pattern","agirlik_schedule_bagimli_kg":null}'),
    (20,  6000, 0.44, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %40","agirlik_schedule_bagimli_kg":null}'),
    (25,  6000, 0.64, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %43","agirlik_schedule_bagimli_kg":null}'),
    (32,  6000, 1.06, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %29","agirlik_schedule_bagimli_kg":null}'),
    (40,  6000, 1.34, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %48","agirlik_schedule_bagimli_kg":null}'),
    (50,  6000, 2.59, '{"kaynak":"Bonney Forge Catalog F9-2012 (90-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %25","agirlik_schedule_bagimli_kg":null}')
) AS v(dn, class_no, agirlik_kg, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.11'
  AND fitting_olculer.parca_tipi = '90SW'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.class_no = v.class_no
  AND fitting_olculer.agirlik_kg IS NULL;

-- 2. 45SW (45-deg Elbow Socket Weld) -- 15 satir
UPDATE fitting_olculer
SET agirlik_kg = v.agirlik_kg,
    notlar = v.notlar
FROM (VALUES
    -- Class 3000 (NPS 1/2-4, 9 satir)
    (15::integer,  3000::integer, 0.27::numeric, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %22","agirlik_schedule_bagimli_kg":null}'::text),
    (20,  3000, 0.43, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com varyans %0","agirlik_schedule_bagimli_kg":null}'),
    (25,  3000, 0.59, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil ayrik tablo","agirlik_schedule_bagimli_kg":null}'),
    (32,  3000, 0.93, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (40,  3000, 1.26, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (50,  3000, 1.86, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (65,  3000, 3.94, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (80,  3000, 6.26, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (100, 3000, 12.97,'{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    -- Class 6000 (NPS 1/2-2, 6 satir)
    (15,  6000, 0.36, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (20,  6000, 0.58, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (25,  6000, 0.87, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (32,  6000, 1.44, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (40,  6000, 1.83, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (50,  6000, 3.42, '{"kaynak":"Bonney Forge Catalog F9-2012 (45-deg Elbow SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}')
) AS v(dn, class_no, agirlik_kg, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.11'
  AND fitting_olculer.parca_tipi = '45SW'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.class_no = v.class_no
  AND fitting_olculer.agirlik_kg IS NULL;

-- 3. tee_eq_sw (Equal Tee Socket Weld) -- 15 satir
UPDATE fitting_olculer
SET agirlik_kg = v.agirlik_kg,
    notlar = v.notlar
FROM (VALUES
    -- Class 3000 (NPS 1/2-4, 9 satir)
    (15::integer,  3000::integer, 0.19::numeric, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'::text),
    (20,  3000, 0.32, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (25,  3000, 0.43, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (32,  3000, 0.63, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (40,  3000, 0.76, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (50,  3000, 1.34, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (65,  3000, 3.52, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (80,  3000, 3.88, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (100, 3000, 10.91,'{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    -- Class 6000 (NPS 1/2-2, 6 satir)
    (15,  6000, 0.22, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (20,  6000, 0.40, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (25,  6000, 0.57, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (32,  6000, 0.91, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (40,  6000, 1.04, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (50,  6000, 2.04, '{"kaynak":"Bonney Forge Catalog F9-2012 (Tee SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}')
) AS v(dn, class_no, agirlik_kg, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.11'
  AND fitting_olculer.parca_tipi = 'tee_eq_sw'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.class_no = v.class_no
  AND fitting_olculer.agirlik_kg IS NULL;

-- 4. cross_sw (Equal Cross Socket Weld) -- 15 satir
UPDATE fitting_olculer
SET agirlik_kg = v.agirlik_kg,
    notlar = v.notlar
FROM (VALUES
    -- Class 3000 (NPS 1/2-4, 9 satir)
    (15::integer,  3000::integer, 0.33::numeric, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'::text),
    (20,  3000, 0.53, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (25,  3000, 0.68, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (32,  3000, 1.08, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (40,  3000, 1.47, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (50,  3000, 2.30, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (65,  3000, 7.16, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (80,  3000, 11.22,'{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (100, 3000, 18.14,'{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    -- Class 6000 (NPS 1/2-2, 6 satir)
    (15,  6000, 0.70, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (20,  6000, 1.05, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (25,  6000, 1.70, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (32,  6000, 2.38, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (40,  6000, 3.99, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (50,  6000, 4.38, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cross SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}')
) AS v(dn, class_no, agirlik_kg, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.11'
  AND fitting_olculer.parca_tipi = 'cross_sw'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.class_no = v.class_no
  AND fitting_olculer.agirlik_kg IS NULL;

-- 5. coupling_full (Full Coupling Socket Weld) -- 15 satir
UPDATE fitting_olculer
SET agirlik_kg = v.agirlik_kg,
    notlar = v.notlar
FROM (VALUES
    -- Class 3000 (NPS 1/2-4, 9 satir)
    (15::integer,  3000::integer, 0.11::numeric, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'::text),
    (20,  3000, 0.18, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (25,  3000, 0.26, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (32,  3000, 0.41, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (40,  3000, 0.47, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (50,  3000, 0.81, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (65,  3000, 1.10, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (80,  3000, 1.84, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (100, 3000, 2.60, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    -- Class 6000 (NPS 1/2-2, 6 satir)
    (15,  6000, 0.20, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (20,  6000, 0.30, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (25,  6000, 0.58, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (32,  6000, 0.62, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (40,  6000, 0.95, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}'),
    (50,  6000, 1.75, '{"kaynak":"Bonney Forge Catalog F9-2012 (Full Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com Coupling masses tablosu","agirlik_schedule_bagimli_kg":null}')
) AS v(dn, class_no, agirlik_kg, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.11'
  AND fitting_olculer.parca_tipi = 'coupling_full'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.class_no = v.class_no
  AND fitting_olculer.agirlik_kg IS NULL;

-- 6. coupling_half (Half Coupling Socket Weld) -- 15 satir
-- KARAR-80.2: BF eksik (DN 20 C6000), pipingpipeline secondary kullanildi
UPDATE fitting_olculer
SET agirlik_kg = v.agirlik_kg,
    notlar = v.notlar
FROM (VALUES
    -- Class 3000 (NPS 1/2-4, 9 satir) -- BF primary
    (15::integer,  3000::integer, 0.15::numeric, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 0.16 kg (varyans %7)","agirlik_schedule_bagimli_kg":null}'::text),
    (20,  3000, 0.21, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 0.23 kg (varyans %9)","agirlik_schedule_bagimli_kg":null}'),
    (25,  3000, 0.34, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 0.38 kg (varyans %11)","agirlik_schedule_bagimli_kg":null}'),
    (32,  3000, 0.56, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 0.63 kg (varyans %12)","agirlik_schedule_bagimli_kg":null}'),
    (40,  3000, 0.60, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 0.80 kg (varyans %33)","agirlik_schedule_bagimli_kg":null}'),
    (50,  3000, 1.08, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 1.24 kg (varyans %15)","agirlik_schedule_bagimli_kg":null}'),
    (65,  3000, 1.61, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 1.90 kg (varyans %18)","agirlik_schedule_bagimli_kg":null}'),
    (80,  3000, 2.83, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 2.45 kg (varyans %13)","agirlik_schedule_bagimli_kg":null}'),
    (100, 3000, 3.76, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 4.16 kg (varyans %11)","agirlik_schedule_bagimli_kg":null}'),
    -- Class 6000 (NPS 1/2-2, 6 satir) -- BF primary, DN 20 PP secondary
    (15,  6000, 0.36, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 0.35 kg (varyans %3)","agirlik_schedule_bagimli_kg":null}'),
    (20,  6000, 0.45, '{"kaynak":"pipingpipeline.com (Half Coupling SW C6000) -- BF eksik bu boyutta (NPS 3/4 production constraint), PP secondary kullanildi","uretim_tarihi":"2026-05","kaynak_tipi":"secondary_fallback","agirlik_schedule_bagimli_kg":null}'),
    (25,  6000, 0.72, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 0.80 kg (varyans %11)","agirlik_schedule_bagimli_kg":null}'),
    (32,  6000, 0.78, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 1.08 kg (varyans %28)","agirlik_schedule_bagimli_kg":null}'),
    (40,  6000, 1.36, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 1.52 kg (varyans %11)","agirlik_schedule_bagimli_kg":null}'),
    (50,  6000, 2.26, '{"kaynak":"Bonney Forge Catalog F9-2012 (Half Coupling SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com 2.55 kg (varyans %11)","agirlik_schedule_bagimli_kg":null}')
) AS v(dn, class_no, agirlik_kg, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.11'
  AND fitting_olculer.parca_tipi = 'coupling_half'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.class_no = v.class_no
  AND fitting_olculer.agirlik_kg IS NULL;

-- 7. cap_sw (Socket Weld Cap) -- 15 satir
UPDATE fitting_olculer
SET agirlik_kg = v.agirlik_kg,
    notlar = v.notlar
FROM (VALUES
    -- Class 3000 (NPS 1/2-4, 9 satir)
    (15::integer,  3000::integer, 0.10::numeric, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'::text),
    (20,  3000, 0.16, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (25,  3000, 0.25, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (32,  3000, 0.46, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (40,  3000, 0.58, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (50,  3000, 0.90, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (65,  3000, 1.53, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (80,  3000, 2.86, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (100, 3000, 5.48, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C3000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    -- Class 6000 (NPS 1/2-2, 6 satir)
    (15,  6000, 0.19, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (20,  6000, 0.26, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (25,  6000, 0.54, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (32,  6000, 0.64, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (40,  6000, 0.99, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}'),
    (50,  6000, 1.66, '{"kaynak":"Bonney Forge Catalog F9-2012 (Cap SW C6000)","uretim_tarihi":"2026-05","cross_check":"pipingpipeline.com mevcut degil","agirlik_schedule_bagimli_kg":null}')
) AS v(dn, class_no, agirlik_kg, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.11'
  AND fitting_olculer.parca_tipi = 'cap_sw'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.class_no = v.class_no
  AND fitting_olculer.agirlik_kg IS NULL;

-- ============================================================
-- DOGRULAMA SORGULARI (calistirmadan once gozle bak,
-- migration sonrasi tek tek SELECT ile sayim teyit edilir)
-- ============================================================
-- Toplam beklenen UPDATE: 105 satir (7 parca x 15)
-- ozet sorgu:
--
-- SELECT parca_tipi, class_no, COUNT(*) AS sayim,
--        COUNT(agirlik_kg) AS agirlik_dolu, 
--        ROUND(MIN(agirlik_kg)::numeric, 2) AS min_kg,
--        ROUND(MAX(agirlik_kg)::numeric, 2) AS max_kg
-- FROM fitting_olculer
-- WHERE geometri_std = 'ASME B16.11'
-- GROUP BY parca_tipi, class_no
-- ORDER BY parca_tipi, class_no;
--
-- Spot ornek:
-- SELECT parca_tipi, cap_buyuk_dn, class_no, agirlik_kg, 
--        notlar::jsonb->>'kaynak' AS kaynak
-- FROM fitting_olculer
-- WHERE geometri_std = 'ASME B16.11' 
--   AND parca_tipi IN ('90SW','coupling_half','cap_sw') 
--   AND cap_buyuk_dn IN (20, 50, 100)
-- ORDER BY parca_tipi, cap_buyuk_dn, class_no;
