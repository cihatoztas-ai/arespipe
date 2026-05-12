-- ============================================================
-- Migration 051 -- 80. oturum (12 May 2026)
-- B16.9 reducer (conc + ecc) agirlik dolum
-- Kaynak: Wermac weights_bw_reducers.html STD/XS/160/XXS (Hackney Ladish)
-- 88 DN kombinasyonu x 2 parca tipi = 176 satir UPDATE beklenir
-- Wermac kapsam disi (gamma kalir, 52 satir): DN 800-1000 buyuk NPS,
--   600-550 (Wermac "-"), 700-450 (Wermac yok)
-- MK-79.3 fitting agirlik = uretici tablo (Hackney Ladish primary)
-- KARAR-79.4 schedule-bagimsiz pattern (uclu NULL), JSON multi-schedule
-- agirlik_kg ana kolonda STD degeri (kanonik, 049 pattern)
-- Idempotent: WHERE agirlik_kg IS NULL
-- ============================================================

UPDATE fitting_olculer
SET agirlik_kg = v.std_kg,
    notlar = (
        '{"kaynak":"Wermac BW Reducers (Hackney Ladish source, weights_bw_reducers.html STD/XS/160/XXS)",'
        || '"uretim_tarihi":"2026-05",'
        || '"agirlik_schedule_bagimli_kg":{'
        || '"STD":' || v.std_kg::text
        || ',"XS":' || v.xs_kg::text
        || ',"160":' || COALESCE(v.sch160_kg::text, 'null')
        || ',"XXS":' || COALESCE(v.xxs_kg::text, 'null')
        || '}}'
    )
FROM (VALUES
    -- DN 20 (1 combo)
    (20::integer,  15::integer, 0.08::numeric, 0.10::numeric, 0.13::numeric, null::numeric),
    -- DN 25 (2)
    (25,  20, 0.18, 0.20, 0.23, 0.36),
    (25,  15, 0.18, 0.20, 0.23, 0.34),
    -- DN 32 (3)
    (32,  25, 0.23, 0.23, 0.29, 0.45),
    (32,  20, 0.18, 0.23, 0.29, 0.45),
    (32,  15, 0.18, 0.23, 0.27, 0.45),
    -- DN 40 (4)
    (40,  32, 0.32, 0.35, 0.43, 0.68),
    (40,  25, 0.28, 0.34, 0.36, 0.68),
    (40,  20, 0.24, 0.32, 0.34, 0.63),
    (40,  15, 0.23, 0.29, 0.33, 0.57),
    -- DN 50 (4)
    (50,  40, 0.41, 0.54, 0.73, 1.08),
    (50,  32, 0.38, 0.52, 0.68, 1.02),
    (50,  25, 0.34, 0.50, 0.68, 0.98),
    (50,  20, 0.32, 0.45, 0.66, 0.91),
    -- DN 65 (4)
    (65,  50, 0.68, 0.91, 1.13, 1.81),
    (65,  40, 0.63, 0.86, 1.02, 1.77),
    (65,  32, 0.57, 0.84, 1.02, 1.63),
    (65,  25, 0.57, 0.79, 1.00, 1.59),
    -- DN 80 (4)
    (80,  65, 0.91, 1.25, 1.68, 2.72),
    (80,  50, 0.82, 1.18, 1.54, 2.27),
    (80,  40, 0.77, 1.13, 1.45, 2.22),
    (80,  32, 0.73, 1.09, 1.41, 2.15),
    -- DN 90 (5) -- 160 schedule Wermac "-" tum 90 icin
    (90,  80, 1.43, 1.81, null, 3.63),
    (90,  65, 1.31, 1.59, null, 3.63),
    (90,  50, 1.25, 1.59, null, 3.18),
    (90,  40, 1.13, 1.47, null, 3.18),
    (90,  32, 1.09, 1.47, null, 3.18),
    -- DN 100 (5)
    (100, 90, 1.59, 2.15, null, 4.08),
    (100, 80, 1.53, 2.04, 2.90, 4.08),
    (100, 65, 1.47, 1.99, 2.49, 3.86),
    (100, 50, 1.36, 1.93, 2.45, 3.74),
    (100, 40, 1.31, 1.81, 2.38, 3.63),
    -- DN 125 (5)
    (125, 100, 2.72, 3.74, 5.67, 7.26),
    (125, 90,  2.61, 3.52, null, 6.80),
    (125, 80,  2.49, 3.40, 4.99, 6.58),
    (125, 65,  2.38, 3.18, 4.76, 6.24),
    (125, 50,  2.27, 2.95, 4.54, 6.35),
    -- DN 150 (5)
    (150, 125, 3.86, 5.44, 8.50, 10.43),
    (150, 100, 3.74, 5.22, 7.48, 9.98),
    (150, 90,  3.74, 4.99, null, 9.53),
    (150, 80,  3.63, 4.76, 7.03, 9.07),
    (150, 65,  3.29, 4.54, 6.80, 8.62),
    -- DN 200 (4)
    (200, 150, 5.99, 8.48, 14.06, 16.33),
    (200, 125, 5.44, 8.16, 12.34, 15.88),
    (200, 100, 4.99, 7.71, 10.66, 14.97),
    (200, 90,  4.99, 7.48, null,  14.51),
    -- DN 250 (4) -- XXS Wermac kapsam disi NPS 10+
    (250, 200, 9.98, 13.38, 26.08, null),
    (250, 150, 9.75, 13.38, 24.49, null),
    (250, 125, 9.53, 12.70, 23.59, null),
    (250, 100, 9.07, 11.57, 22.68, null),
    -- DN 300 (4)
    (300, 250, 15.42, 19.73, 43.54, null),
    (300, 200, 14.51, 19.05, 39.46, null),
    (300, 150, 14.06, 18.14, 37.65, null),
    (300, 125, 13.61, 17.69, 36.29, null),
    -- DN 350+ -- 160 schedule Wermac NPS 14+ kapsam disi
    (350, 300, 27.22, 36.29, null, null),
    (350, 250, 26.85, 35.92, null, null),
    (350, 200, 26.54, 35.61, null, null),
    (350, 150, 26.31, 35.38, null, null),
    -- DN 400 (4)
    (400, 350, 32.21, 41.28, null, null),
    (400, 300, 31.75, 40.82, null, null),
    (400, 250, 31.52, 40.37, null, null),
    (400, 200, 31.07, 40.14, null, null),
    -- DN 450 (4)
    (450, 400, 38.56, 52.16, null, null),
    (450, 350, 38.10, 51.71, null, null),
    (450, 300, 37.65, 51.26, null, null),
    (450, 250, 37.19, 50.80, null, null),
    -- DN 500 (4)
    (500, 450, 56.70, 77.11, null, null),
    (500, 400, 56.25, 76.66, null, null),
    (500, 350, 55.34, 76.20, null, null),
    (500, 300, 54.43, 75.75, null, null),
    -- DN 550 (4)
    (550, 500, 64.41, 84.37, null, null),
    (550, 450, 62.60, 82.55, null, null),
    (550, 400, 59.42, 78.47, null, null),
    (550, 350, 55.79, 73.94, null, null),
    -- DN 600 (3) -- 600-550 Wermac "-" gamma'ya
    (600, 500, 68.04, 90.72, null, null),
    (600, 450, 67.13, 88.45, null, null),
    (600, 400, 65.77, 86.18, null, null),
    -- DN 650 (4)
    (650, 600, 93.89, 125.19, null, null),
    (650, 550, 90.72, 123.38, null, null),
    (650, 500, 86.18, 114.76, null, null),
    (650, 450, 82.55, 109.77, null, null),
    -- DN 700 (3) -- 700-450 Wermac yok gamma'ya
    (700, 650, 101.60, 135.62, null, null),
    (700, 600, 97.98,  130.63, null, null),
    (700, 500, 90.26,  119.75, null, null),
    -- DN 750 (4)
    (750, 700, 109.32, 146.06, null, null),
    (750, 650, 105.23, 140.61, null, null),
    (750, 600, 101.60, 135.62, null, null),
    (750, 500, 99.79,  124.28, null, null)
    -- DN 800-1000 (24 satir conc + 24 ecc = 48): Wermac kapsam disi, gamma
) AS v(dn_b, dn_k, std_kg, xs_kg, sch160_kg, xxs_kg)
WHERE fitting_olculer.geometri_std = 'ASME B16.9'
  AND fitting_olculer.parca_tipi IN ('reducer_conc', 'reducer_ecc')
  AND fitting_olculer.cap_buyuk_dn = v.dn_b
  AND fitting_olculer.cap_kucuk_dn = v.dn_k
  AND fitting_olculer.agirlik_kg IS NULL;

-- ============================================================
-- DOGRULAMA SORGULARI
-- ============================================================
-- Beklenen UPDATE: 176 (88 combo x 2 parca tipi)
--
-- Toplam ozet:
-- SELECT parca_tipi, COUNT(*) AS sayim, COUNT(agirlik_kg) AS dolu,
--        ROUND(MIN(agirlik_kg)::numeric, 2) AS min_kg,
--        ROUND(MAX(agirlik_kg)::numeric, 2) AS max_kg
-- FROM fitting_olculer
-- WHERE geometri_std = 'ASME B16.9' AND parca_tipi LIKE 'reducer%'
-- GROUP BY parca_tipi;
-- (conc: 114 sayim, 88 dolu / ecc: 114 sayim, 88 dolu)
--
-- Spot ornek (3 buyuk DN icin schedule pattern):
-- SELECT parca_tipi, cap_buyuk_dn, cap_kucuk_dn, agirlik_kg,
--        notlar::jsonb->'agirlik_schedule_bagimli_kg' AS schedule_detay
-- FROM fitting_olculer
-- WHERE geometri_std = 'ASME B16.9'
--   AND parca_tipi = 'reducer_conc'
--   AND cap_buyuk_dn IN (50, 250, 750)
-- ORDER BY cap_buyuk_dn, cap_kucuk_dn DESC;
--
-- Gamma (Wermac kapsam disi) listesi:
-- SELECT parca_tipi, cap_buyuk_dn, cap_kucuk_dn
-- FROM fitting_olculer
-- WHERE geometri_std = 'ASME B16.9'
--   AND parca_tipi LIKE 'reducer%'
--   AND agirlik_kg IS NULL
-- ORDER BY parca_tipi, cap_buyuk_dn, cap_kucuk_dn DESC;
-- (52 satir beklenir: DN 800-1000 buyuk NPS + 600-550 + 700-450, conc+ecc)
