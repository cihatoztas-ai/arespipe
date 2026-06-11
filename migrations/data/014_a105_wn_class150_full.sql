-- migrations/014_a105_wn_class150_full.sql
-- AresPipe — A105 forged carbon, Weld Neck, Class 150
-- ASME B16.5 tam tablo: 20 boyut sistem preseti (DN15 → DN600)
--
-- Kaynak: ASME B16.5 (Class 150 WN)
-- Çapraz teyit: Wermac (wermac.org) + Ferrobend (ferrobend.com) — 28 Nis 2026, 43. oturum
-- Çevirim: inch × 25.4 = mm; lbs / 2.2046 = kg
-- flansh_kalinlik_mm = 1.6 mm RF dahil değer (B16.5 Class 150 standardı)
-- bore_std_mm = ASME B36.10 Sch 40 referans (pipe schedule değişirse override)
-- bolt_holes_inch = delik çapı (hole diameter); bolt_cap_inch = civata çapı
--
-- Idempotent: tekrar çalıştırılabilir, ikileme yapmaz.
--   - 41 pilot DN100 ve 43 pilot DN50/80/150: UPDATE ile tamamlanır
--   - 16 yeni boyut: INSERT NOT EXISTS

BEGIN;

-- ============================================================
-- 1) Pilot 4 satırı temizle/tamamla (DN50/80/100/150)
-- ============================================================
UPDATE flansh_olculer SET
  cap_mm                  = 60.3,
  yuzey_tipi              = 'RF',
  flansh_od_mm            = 152.4,
  flansh_kalinlik_mm      = 19.05,
  hub_od_mm               = 77.72,
  hub_uzunluk_mm          = 63.5,
  bore_std_mm             = 52.48,
  raised_face_od_mm       = 92.20,
  raised_face_kalinlik_mm = 1.6,
  bolt_circle_mm          = 120.65,
  bolt_count              = 4,
  bolt_holes_inch         = '3/4',
  bolt_cap_inch           = '5/8',
  bolt_uzunluk_stud_mm    = 82.55,
  agirlik_kg              = 2.72,
  sistem_preset           = true,
  tenant_id               = NULL,
  aktif                   = true,
  notlar                  = 'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'
WHERE flansh_tipi = 'WN' AND basinc_sinifi = '150' AND cap_dn = 50;

UPDATE flansh_olculer SET
  cap_mm = 88.9, yuzey_tipi = 'RF',
  flansh_od_mm = 190.5, flansh_kalinlik_mm = 23.88,
  hub_od_mm = 107.95, hub_uzunluk_mm = 69.85, bore_std_mm = 77.93,
  raised_face_od_mm = 127.0, raised_face_kalinlik_mm = 1.6,
  bolt_circle_mm = 152.4, bolt_count = 4, bolt_holes_inch = '3/4', bolt_cap_inch = '5/8',
  bolt_uzunluk_stud_mm = 88.9, agirlik_kg = 4.54,
  sistem_preset = true, tenant_id = NULL, aktif = true,
  notlar = 'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'
WHERE flansh_tipi = 'WN' AND basinc_sinifi = '150' AND cap_dn = 80;

UPDATE flansh_olculer SET
  cap_mm = 114.3, yuzey_tipi = 'RF',
  flansh_od_mm = 228.6, flansh_kalinlik_mm = 23.88,
  hub_od_mm = 134.87, hub_uzunluk_mm = 76.20, bore_std_mm = 102.26,
  raised_face_od_mm = 157.23, raised_face_kalinlik_mm = 1.6,
  bolt_circle_mm = 190.5, bolt_count = 8, bolt_holes_inch = '3/4', bolt_cap_inch = '5/8',
  bolt_uzunluk_stud_mm = 88.9, agirlik_kg = 6.80,
  sistem_preset = true, tenant_id = NULL, aktif = true,
  notlar = 'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'
WHERE flansh_tipi = 'WN' AND basinc_sinifi = '150' AND cap_dn = 100;

UPDATE flansh_olculer SET
  cap_mm = 168.3, yuzey_tipi = 'RF',
  flansh_od_mm = 279.4, flansh_kalinlik_mm = 25.40,
  hub_od_mm = 192.02, hub_uzunluk_mm = 88.9, bore_std_mm = 154.08,
  raised_face_od_mm = 215.9, raised_face_kalinlik_mm = 1.6,
  bolt_circle_mm = 241.3, bolt_count = 8, bolt_holes_inch = '7/8', bolt_cap_inch = '3/4',
  bolt_uzunluk_stud_mm = 101.6, agirlik_kg = 10.89,
  sistem_preset = true, tenant_id = NULL, aktif = true,
  notlar = 'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'
WHERE flansh_tipi = 'WN' AND basinc_sinifi = '150' AND cap_dn = 150;

-- ============================================================
-- 2) 16 yeni boyut — INSERT NOT EXISTS (idempotent)
-- ============================================================
INSERT INTO flansh_olculer (
  geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi,
  cap_nps, cap_dn, cap_mm,
  flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm,
  bore_std_mm, raised_face_od_mm, raised_face_kalinlik_mm,
  bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm,
  agirlik_kg, sistem_preset, tenant_id, aktif, notlar
)
SELECT v.* FROM (VALUES
  -- Küçük çap (DN15-DN40) — 4 bolt, 1/2" cıvata
  ('B16.5','WN','150','RF', '1/2',     15,  21.3::numeric,
    88.9::numeric,  11.18::numeric, 30.23::numeric,  47.75::numeric,
    15.80::numeric, 35.05::numeric, 1.6::numeric,
    60.45::numeric,  4, '5/8', '1/2', 57.15::numeric,
    0.91::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '3/4',     20,  26.7::numeric,
    98.55::numeric, 12.70::numeric, 38.10::numeric,  52.32::numeric,
    20.93::numeric, 42.93::numeric, 1.6::numeric,
    69.85::numeric,  4, '5/8', '1/2', 63.50::numeric,
    0.91::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '1',       25,  33.4::numeric,
    107.95::numeric, 14.22::numeric, 49.28::numeric, 55.63::numeric,
    26.64::numeric, 50.80::numeric, 1.6::numeric,
    79.38::numeric,  4, '5/8', '1/2', 63.50::numeric,
    1.36::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '1 1/4',   32,  42.2::numeric,
    117.60::numeric, 16.00::numeric, 58.67::numeric, 57.15::numeric,
    35.05::numeric, 63.50::numeric, 1.6::numeric,
    88.90::numeric,  4, '5/8', '1/2', 69.85::numeric,
    1.36::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '1 1/2',   40,  48.3::numeric,
    127.00::numeric, 17.53::numeric, 65.02::numeric, 61.98::numeric,
    40.89::numeric, 73.15::numeric, 1.6::numeric,
    98.55::numeric,  4, '5/8', '1/2', 69.85::numeric,
    1.81::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  -- Orta çap (DN65, DN90, DN125) — pilot arası eksikler
  ('B16.5','WN','150','RF', '2 1/2',   65,  73.0::numeric,
    177.80::numeric, 22.35::numeric, 90.42::numeric, 69.85::numeric,
    62.72::numeric, 104.90::numeric, 1.6::numeric,
    139.70::numeric, 4, '3/4', '5/8', 88.90::numeric,
    3.63::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '3 1/2',   90,  101.6::numeric,
    215.90::numeric, 23.88::numeric, 122.17::numeric, 71.37::numeric,
    90.12::numeric, 139.70::numeric, 1.6::numeric,
    177.80::numeric, 8, '3/4', '5/8', 88.90::numeric,
    5.44::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '5',      125,  141.3::numeric,
    254.00::numeric, 23.88::numeric, 163.58::numeric, 87.63::numeric,
    128.19::numeric, 185.67::numeric, 1.6::numeric,
    215.90::numeric, 8, '7/8', '3/4', 95.25::numeric,
    8.62::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  -- Büyük çap (DN200-DN300) — 8/12 bolt
  ('B16.5','WN','150','RF', '8',      200,  219.1::numeric,
    342.90::numeric, 28.70::numeric, 246.13::numeric, 101.60::numeric,
    202.72::numeric, 270.00::numeric, 1.6::numeric,
    298.45::numeric, 8, '7/8', '3/4', 107.95::numeric,
    17.69::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '10',     250,  273.0::numeric,
    406.40::numeric, 30.23::numeric, 304.80::numeric, 101.60::numeric,
    254.51::numeric, 323.85::numeric, 1.6::numeric,
    361.95::numeric, 12, '1', '7/8', 114.30::numeric,
    23.59::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '12',     300,  323.85::numeric,
    482.60::numeric, 31.75::numeric, 365.13::numeric, 114.30::numeric,
    303.23::numeric, 381.00::numeric, 1.6::numeric,
    431.80::numeric, 12, '1', '7/8', 120.65::numeric,
    36.29::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  -- Çok büyük çap (DN350-DN600) — 12/16/20 bolt
  ('B16.5','WN','150','RF', '14',     350,  355.6::numeric,
    533.40::numeric, 35.05::numeric, 400.05::numeric, 127.00::numeric,
    333.40::numeric, 412.75::numeric, 1.6::numeric,
    476.25::numeric, 12, '1 1/8', '1', 133.35::numeric,
    49.90::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '16',     400,  406.4::numeric,
    596.90::numeric, 36.58::numeric, 457.20::numeric, 127.00::numeric,
    381.00::numeric, 469.90::numeric, 1.6::numeric,
    539.75::numeric, 16, '1 1/8', '1', 133.35::numeric,
    63.50::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '18',     450,  457.2::numeric,
    635.00::numeric, 39.63::numeric, 504.95::numeric, 139.70::numeric,
    428.66::numeric, 533.40::numeric, 1.6::numeric,
    577.85::numeric, 16, '1 1/4', '1 1/8', 146.05::numeric,
    68.04::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '20',     500,  508.0::numeric,
    698.50::numeric, 42.93::numeric, 558.80::numeric, 144.53::numeric,
    477.82::numeric, 584.20::numeric, 1.6::numeric,
    635.00::numeric, 20, '1 1/4', '1 1/8', 158.75::numeric,
    81.65::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)'),
  ('B16.5','WN','150','RF', '24',     600,  609.6::numeric,
    812.80::numeric, 47.75::numeric, 663.70::numeric, 152.40::numeric,
    574.70::numeric, 692.15::numeric, 1.6::numeric,
    749.30::numeric, 20, '1 3/8', '1 1/4', 171.45::numeric,
    117.93::numeric, true, NULL::uuid, true,
    'A105 sistem preseti — ASME B16.5 Class 150 WN. RF 1.6mm thickness''e dahil. Çapraz teyit: Wermac + Ferrobend (28 Nis 2026)')
) AS v(
  geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi,
  cap_nps, cap_dn, cap_mm,
  flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm,
  bore_std_mm, raised_face_od_mm, raised_face_kalinlik_mm,
  bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm,
  agirlik_kg, sistem_preset, tenant_id, aktif, notlar
)
WHERE NOT EXISTS (
  SELECT 1 FROM flansh_olculer f
  WHERE f.flansh_tipi   = 'WN'
    AND f.basinc_sinifi = '150'
    AND f.cap_dn        = v.cap_dn
    AND f.sistem_preset = true
);

COMMIT;

-- ============================================================
-- 3) Doğrulama — beklenen 20 satır, hepsi preset_ok
-- ============================================================
SELECT cap_dn, cap_nps, cap_mm,
       flansh_od_mm, flansh_kalinlik_mm,
       hub_od_mm, hub_uzunluk_mm,
       bolt_count, bolt_holes_inch, bolt_cap_inch,
       agirlik_kg,
       sistem_preset, (tenant_id IS NULL) AS preset_ok
FROM flansh_olculer
WHERE flansh_tipi = 'WN' AND basinc_sinifi = '150'
ORDER BY cap_dn;

-- Toplam sayı kontrol — beklenen 20
SELECT count(*) AS class150_wn_toplam
FROM flansh_olculer
WHERE flansh_tipi = 'WN' AND basinc_sinifi = '150' AND sistem_preset = true;
