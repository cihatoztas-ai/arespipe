-- ============================================================================
-- Migration 049 - B16.9 fitting agirlik dolumu Wermac'tan (83 satir UPDATE)
-- ============================================================================
-- Amac: fitting_olculer'da NULL kalan agirlik_kg degerlerini Wermac (Hackney
-- Ladish) BW weight tablolarindan doldurmak.
--
-- 4 UPDATE blogu:
--   1) 90_3D : 19 satir (NPS 2 -> 36, DN 50-900, Wermac STD)
--   2) 45_3D : 19 satir (NPS 2 -> 36, DN 50-900, Wermac STD)
--   3) tee_eq: 24 satir (NPS 1/2 -> 36, DN 15-900 hepsi, Wermac STD)
--   4) cap   : 21 satir (NPS 1 -> 30, DN 25-750, Wermac STD)
--   TOPLAM:  83 satir
--
-- gamma'ya kalan (Wermac kapsam disi, 80. oturum icin acik bor):
--   - 90LR : 9 satir (DN 700, 800, 850, 950, 1000, 1050, 1100, 1150, 1200)
--   - 45LR : 9 satir (ayni DN'ler)
--   - 90_3D: 13 satir (DN 20, 25, 32, 40 kucuk + DN 700+ buyuk)
--   - 45_3D: 13 satir (ayni)
--   - tee_eq: 9 satir (DN 700+)
--   - cap   : 12 satir (DN 15, 20 kucuk + DN 700+ buyuk)
--   TOPLAM: 65 satir - ProjectMaterials/Octalsteel/MSS-SP-43 ile gama
--
-- Kaynak: Wermac (wermac.org/fittings/weights_bw_*.html + dim_caps.html)
--   - Veriler Hackney Ladish, Inc. (TX) uretici tablolarindan
--   - "approximate and provided as a guide only" - uretici-bagimli, +/-5-15 sapma
--   - JSON notlar pattern'i mevcut 90LR/45LR (24 dolu satir) ile bire-bir uyumlu
--
-- agirlik_kg = Schedule STD degeri (mevcut 90LR/45LR pattern'i)
-- notlar     = JSON: {"kaynak": ..., "uretim_tarihi": "2026-05",
--                     "agirlik_schedule_bagimli_kg": {"STD": x, "XS": y, ...}}
--
-- Disiplin:
--   - MK-76.1 (implicit transaction)
--   - MK-78.5 (VALUES dikey hizalama)
--   - MK-76.3 (ASCII-only SQL yorumlar; JSON icindekiler ASCII)
--   - Idempotent: WHERE agirlik_kg IS NULL (ikinci calistirmada 0 etkiler)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) 90_3D - 19 satir (NPS 2 -> 36, Wermac 3D elbow tablosu)
-- ----------------------------------------------------------------------------

UPDATE fitting_olculer
SET agirlik_kg = v.std,
    notlar = v.notlar
FROM (VALUES
  ( 50,   1.36::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":1.36,"XS":1.81}}'::TEXT),
  ( 65,   2.72::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":2.72,"XS":3.63}}'),
  ( 80,   4.54::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":4.54,"XS":5.9}}'),
  ( 90,   5.90::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":5.9,"XS":8.16}}'),
  (100,   8.16::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":8.16,"XS":11.34}}'),
  (125,  13.15::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":13.15,"XS":19.5}}'),
  (150,  20.41::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":20.41,"XS":31.75}}'),
  (200,  40.82::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":40.82,"XS":63.5}}'),
  (250,  72.12::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":72.12,"XS":98.88}}'),
  (300, 105.69::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":105.69,"XS":140.61}}'),
  (350, 135.17::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":135.17,"XS":181.44}}'),
  (400, 176.90::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":176.9,"XS":235.87}}'),
  (450, 224.53::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":224.53,"XS":299.37}}'),
  (500, 276.69::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":276.69,"XS":367.41}}'),
  (550, 333.39::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":333.39,"XS":444.52}}'),
  (600, 396.89::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":396.89,"XS":530.7}}'),
  (650, 467.20::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":467.2,"XS":621.42}}'),
  (750, 621.42::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":621.42,"XS":830.07}}'),
  (900, 893.58::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":893.58,"XS":1192.95}}')
) AS v(dn, std, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.9'
  AND fitting_olculer.parca_tipi   = '90_3D'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.agirlik_kg IS NULL;

-- ----------------------------------------------------------------------------
-- 2) 45_3D - 19 satir (NPS 2 -> 36, Wermac 3D elbow tablosu)
-- ----------------------------------------------------------------------------

UPDATE fitting_olculer
SET agirlik_kg = v.std,
    notlar = v.notlar
FROM (VALUES
  ( 50,   0.68::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.68,"XS":0.95}}'::TEXT),
  ( 65,   1.36::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":1.36,"XS":1.81}}'),
  ( 80,   2.27::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":2.27,"XS":3.18}}'),
  ( 90,   3.18::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":3.18,"XS":4.08}}'),
  (100,   4.08::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":4.08,"XS":5.9}}'),
  (125,   6.80::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":6.8,"XS":9.98}}'),
  (150,  10.43::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":10.43,"XS":15.88}}'),
  (200,  20.41::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":20.41,"XS":31.75}}'),
  (250,  36.29::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":36.29,"XS":49.44}}'),
  (300,  53.07::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":53.07,"XS":70.31}}'),
  (350,  67.59::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":67.59,"XS":90.72}}'),
  (400,  88.45::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":88.45,"XS":117.93}}'),
  (450, 112.49::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":112.49,"XS":149.69}}'),
  (500, 138.35::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":138.35,"XS":183.7}}'),
  (550, 166.92::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":166.92,"XS":222.26}}'),
  (600, 198.67::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":198.67,"XS":265.35}}'),
  (650, 233.60::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":233.6,"XS":310.71}}'),
  (750, 310.71::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":310.71,"XS":415.04}}'),
  (900, 446.79::NUMERIC, '{"kaynak":"Wermac B16.9 3D elbow tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":446.79,"XS":596.47}}')
) AS v(dn, std, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.9'
  AND fitting_olculer.parca_tipi   = '45_3D'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.agirlik_kg IS NULL;

-- ----------------------------------------------------------------------------
-- 3) tee_eq - 24 satir (NPS 1/2 -> 36, Wermac straight tees tablosu)
-- ----------------------------------------------------------------------------

UPDATE fitting_olculer
SET agirlik_kg = v.std,
    notlar = v.notlar
FROM (VALUES
  ( 15,   0.16::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.16,"XS":0.2,"160":0.16}}'::TEXT),
  ( 20,   0.20::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.2,"XS":0.27,"160":0.26}}'),
  ( 25,   0.34::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.34,"XS":0.4,"160":0.45,"XXS":0.57}}'),
  ( 32,   0.59::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.59,"XS":0.73,"160":0.91,"XXS":1.13}}'),
  ( 40,   0.91::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.91,"XS":1.02,"160":1.36,"XXS":1.53}}'),
  ( 50,   1.59::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":1.59,"XS":1.81,"160":2.27,"XXS":2.83}}'),
  ( 65,   2.72::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":2.72,"XS":3.18,"160":3.63,"XXS":4.76}}'),
  ( 80,   3.18::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":3.18,"XS":3.86,"160":4.54,"XXS":6.12}}'),
  ( 90,   4.08::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":4.08,"XS":5.44,"XXS":8.16}}'),
  (100,   5.44::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":5.44,"XS":7.17,"160":11.34,"XXS":11.34}}'),
  (125,   9.53::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":9.53,"XS":11.79,"160":24.95,"XXS":18.14}}'),
  (150,  15.42::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":15.42,"XS":18.14,"160":28.12,"XXS":30.84}}'),
  (200,  24.95::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":24.95,"XS":34.02,"160":49.9,"XXS":54.43}}'),
  (250,  38.56::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":38.56,"XS":47.63,"160":117.93}}'),
  (300,  54.43::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":54.43,"XS":72.57,"160":217.72}}'),
  (350,  74.84::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":74.84,"XS":108.86}}'),
  (400,  88.45::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":88.45,"XS":127.01}}'),
  (450, 112.94::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":112.94,"XS":150.59}}'),
  (500, 155.13::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":155.13,"XS":217.72}}'),
  (550, 187.79::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":187.79,"XS":249.48}}'),
  (600, 239.50::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":239.5,"XS":276.69}}'),
  (650, 349.27::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":349.27,"XS":396.89}}'),
  (750, 480.81::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":480.81,"XS":544.31}}'),
  (900, 675.85::NUMERIC, '{"kaynak":"Wermac B16.9 tee straight tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":675.85,"XS":771.11}}')
) AS v(dn, std, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.9'
  AND fitting_olculer.parca_tipi   = 'tee_eq'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.agirlik_kg IS NULL;

-- ----------------------------------------------------------------------------
-- 4) cap - 21 satir (NPS 1 -> 30, Wermac dim_caps weight tablosu)
-- ----------------------------------------------------------------------------

UPDATE fitting_olculer
SET agirlik_kg = v.std,
    notlar = v.notlar
FROM (VALUES
  ( 25,   0.09::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.09,"XS":0.14,"160":0.18,"XXS":0.23}}'::TEXT),
  ( 32,   0.14::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.14,"XS":0.18,"160":0.23,"XXS":0.34}}'),
  ( 40,   0.18::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.18,"XS":0.23,"160":0.27,"XXS":0.41}}'),
  ( 50,   0.27::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.27,"XS":0.34,"160":0.57,"XXS":0.68}}'),
  ( 65,   0.41::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.41,"XS":0.45,"160":0.79,"XXS":1.13}}'),
  ( 80,   0.68::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.68,"XS":0.79,"160":1.32,"XXS":1.81}}'),
  ( 90,   0.91::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":0.91,"XS":1.13,"XXS":2.72}}'),
  (100,   1.13::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":1.13,"XS":1.36,"160":2.68,"XXS":3.4}}'),
  (125,   2.04::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":2.04,"XS":2.49,"160":4.54,"XXS":5.44}}'),
  (150,   2.95::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":2.95,"XS":4.08,"160":6.8,"XXS":8.16}}'),
  (200,   5.44::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":5.44,"XS":7.26,"160":14.06,"XXS":13.61}}'),
  (250,   9.07::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":9.07,"XS":11.34,"160":25.85}}'),
  (300,  13.61::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":13.61,"XS":16.33,"160":43.09}}'),
  (350,  16.33::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":16.33,"XS":20.41}}'),
  (400,  18.14::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":18.14,"XS":24.49}}'),
  (450,  24.49::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":24.49,"XS":32.66}}'),
  (500,  34.02::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":34.02,"XS":39.01}}'),
  (550,  42.64::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":42.64,"XS":56.7}}'),
  (600,  43.54::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":43.54,"XS":58.97}}'),
  (650,  53.98::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":53.98,"XS":72.12}}'),
  (750,  78.02::NUMERIC, '{"kaynak":"Wermac B16.9 cap tablosu","uretim_tarihi":"2026-05","agirlik_schedule_bagimli_kg":{"STD":78.02,"XS":103.87}}')
) AS v(dn, std, notlar)
WHERE fitting_olculer.geometri_std = 'ASME B16.9'
  AND fitting_olculer.parca_tipi   = 'cap'
  AND fitting_olculer.cap_buyuk_dn = v.dn
  AND fitting_olculer.agirlik_kg IS NULL;

-- ============================================================================
-- Dogrulama sorgulari:
--
-- 1) Toplam dolum (83 beklenir):
--    SELECT count(*) FROM fitting_olculer
--    WHERE geometri_std = 'ASME B16.9'
--      AND parca_tipi IN ('90_3D', '45_3D', 'tee_eq', 'cap')
--      AND agirlik_kg IS NOT NULL;
--    Beklenen: 83
--
-- 2) Parca-bazi dolum:
--    SELECT parca_tipi,
--      count(*) FILTER (WHERE agirlik_kg IS NOT NULL) AS dolu,
--      count(*) FILTER (WHERE agirlik_kg IS NULL) AS eksik
--    FROM fitting_olculer
--    WHERE geometri_std = 'ASME B16.9'
--      AND parca_tipi IN ('90LR', '45LR', '90_3D', '45_3D', 'tee_eq', 'cap')
--    GROUP BY parca_tipi ORDER BY parca_tipi;
--    Beklenen:
--      45LR  dolu=24, eksik=9   (49 dokunmadi)
--      45_3D dolu=19, eksik=13  (NPS 2-36 dolu, kucuk + buyuk eksik)
--      90LR  dolu=24, eksik=9   (49 dokunmadi)
--      90_3D dolu=19, eksik=13
--      cap   dolu=21, eksik=12  (DN 15,20 ve 700+ eksik)
--      tee_eq dolu=24, eksik=9  (DN 700+ eksik)
--
-- 3) Spot check (tee_eq DN 100 STD = 5.44 kg):
--    SELECT parca_tipi, cap_buyuk_dn, agirlik_kg, notlar
--    FROM fitting_olculer
--    WHERE geometri_std = 'ASME B16.9' AND parca_tipi = 'tee_eq'
--      AND cap_buyuk_dn = 100;
--    Beklenen: agirlik_kg=5.44, notlar JSON STD=5.44, XS=7.17, 160=11.34, XXS=11.34
--
-- 4) Spot check (cap DN 200 STD = 5.44 kg):
--    SELECT parca_tipi, cap_buyuk_dn, agirlik_kg
--    FROM fitting_olculer
--    WHERE geometri_std = 'ASME B16.9' AND parca_tipi = 'cap'
--      AND cap_buyuk_dn = 200;
--    Beklenen: 5.44
-- ============================================================================
