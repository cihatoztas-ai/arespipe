-- Migration 041 (Session 76)
-- ASME B36.19M stainless pipe: DN 350-600 SCH 40S + 80S
-- 10 rows missing-completion (P0 priority for ship spool KK lines)
--
-- Source: Wermac dim_b36.19_pipes.html (primary) + pipingpipeline + Ferrobend (cross-check)
-- Weight pattern: austenitic kg/m = Wermac carbon kg/m * 1.02 (Wermac Note 4)
-- DN 450 carbon kg/m: formula pi*(D-t)*t*7850/1e6 (Wermac value missing)
-- Tolerance: et_min_mm / et_max_mm are GENERATED columns (auto-populated from et_mm)
--            ASTM A530 +/-12.5% default applied by DB
-- B36.10M hallucination check: NPS 14+ 80S et = 12.70 mm (B36.19M-specific constant)
--
-- MK-76.1: No BEGIN/COMMIT (Supabase SQL Editor incompat)
-- MK-76.2: schedule_tipi/deger via LATERAL JOIN from existing B36.19M rows (no assumption)
-- MK-76.3: ASCII-only SQL comments (non-ASCII chars cause parser issues)
-- MK-76.4: et_min_mm/et_max_mm are GENERATED columns - do NOT include in INSERT
--          (information_schema.columns is_nullable=YES misleading; check is_generated)
--
-- Idempotent: NOT EXISTS on (standart, dn, schedule_kod)
-- Expected: 10 inserts, final B36.19M total = 80

INSERT INTO boru_olculer (
  standart, malzeme_grubu, dn,
  schedule_tipi, schedule_deger, schedule_kod,
  dis_cap_mm, et_mm, agirlik_kg_m,
  edisyon_yili, kaynak, notlar
)
SELECT
  'ASME-B36.19M',
  'paslanmaz',
  v.dn,
  m.schedule_tipi,
  m.schedule_deger,
  v.schedule_kod,
  v.dis_cap_mm,
  v.et_mm,
  v.agirlik_kg_m,
  2018,
  'ASME B36.19M-2018',
  jsonb_build_object(
    'kaynak_geometri',     'Wermac dim_b36.19_pipes.html',
    'kaynak_cross_check',  'pipingpipeline asme-b36-19m.html + Ferrobend B36.19M',
    'scrape_tarihi',       '2026-05-11',
    'edisyon',             'ASME B36.19M-2018',
    'agirlik_pattern',     'austenitik = Wermac carbon * 1.02 (General Notes 4)',
    'carbon_kg_m_kaynak',  v.carbon_kg_m,
    'agirlik_not',         v.agirlik_not,
    'b36_10m_fark_kontrol','NPS 14+ 80S et=12.70 sabit (B36.19M ozel, B36.10M Sch80 ile farkli)',
    'eksiklik_tespit',     '76 A4 dogrulamasinda P0 olarak isaretlendi (gemi KK ana hatlari)',
    'tolerans_kaynak',     'ASTM A530 +/-12.5%'
  )::text AS notlar
FROM (VALUES
  (350::int, '40S'::text, 355.6::numeric,  9.53::numeric,  82.96::numeric,  81.33::numeric,  'Wermac carbon * 1.02 austenitik'::text),
  (350,      '80S',       355.6,          12.70,          109.55,          107.40,          'Wermac carbon * 1.02 austenitik'),
  (400,      '40S',       406.4,           9.53,           95.14,           93.27,          'Wermac carbon * 1.02 austenitik'),
  (400,      '80S',       406.4,          12.70,          125.78,          123.31,          'Wermac carbon * 1.02 austenitik'),
  (450,      '40S',       457.2,           9.53,          107.32,          105.22,          'Carbon kg/m formula (Wermac empty): pi*(D-t)*t*7850/1e6'),
  (450,      '80S',       457.2,          12.70,          141.99,          139.21,          'Carbon kg/m formula (Wermac empty): pi*(D-t)*t*7850/1e6'),
  (500,      '40S',       508.0,           9.53,          119.49,          117.15,          'Wermac carbon * 1.02 austenitik'),
  (500,      '80S',       508.0,          12.70,          158.23,          155.13,          'Wermac carbon * 1.02 austenitik'),
  (600,      '40S',       610.0,           9.53,          143.94,          141.12,          'Wermac carbon * 1.02 austenitik'),
  (600,      '80S',       610.0,          12.70,          190.81,          187.07,          'Wermac carbon * 1.02 austenitik')
) AS v(dn, schedule_kod, dis_cap_mm, et_mm, agirlik_kg_m, carbon_kg_m, agirlik_not)
JOIN LATERAL (
  SELECT schedule_tipi, schedule_deger
  FROM boru_olculer
  WHERE standart = 'ASME-B36.19M'
    AND schedule_kod = v.schedule_kod
  LIMIT 1
) m ON true
WHERE NOT EXISTS (
  SELECT 1 FROM boru_olculer b
  WHERE b.standart     = 'ASME-B36.19M'
    AND b.dn           = v.dn
    AND b.schedule_kod = v.schedule_kod
);

-- Verification: B36.19M total should be 80 (70 existing + 10 new)
DO $$
DECLARE
  v_count int;
  v_new   int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM boru_olculer
  WHERE standart = 'ASME-B36.19M';

  SELECT COUNT(*) INTO v_new
  FROM boru_olculer
  WHERE standart = 'ASME-B36.19M'
    AND dn IN (350, 400, 450, 500, 600)
    AND schedule_kod IN ('40S', '80S');

  IF v_count <> 80 THEN
    RAISE EXCEPTION 'B36.19M expected 80 rows, got %', v_count;
  END IF;

  IF v_new <> 10 THEN
    RAISE EXCEPTION 'DN 350-600 40S+80S expected 10 rows, got %', v_new;
  END IF;

  RAISE NOTICE 'B36.19M total: % rows (expected 80) OK', v_count;
  RAISE NOTICE 'DN 350-600 40S+80S: % rows (expected 10) OK', v_new;
END $$;
