-- ============================================================================
-- Migration 048 - hijyen B16.9 -> ASME B16.9 + B16.9 stub_end insert
-- ============================================================================
-- Iki bolum, atomik (Supabase implicit transaction - MK-76.1):
--
--   A) UPDATE 424 satir: 'B16.9' -> 'ASME B16.9' (naming hijyeni)
--      Sistem genelinde standart: 'ASME B16.5', 'ASME B16.11', 'EN 1092-1' vs.
--      ile uyumlu prefix. M_K ve flansh_olculer pattern'i ile birebir hizalanir.
--
--   B) INSERT stub_end: 20 NPS x 2 schedule = 40 satir
--      Beta kapsam: NPS 1/2 -> NPS 24 (B16.9 long pattern, ASA standardi)
--      Schedule: STD + XS (Wermac iki tablo verdigi aralik)
--      NPS 22 standartta var ama Wermac T vermiyor, gamma'ya birakildi
--      Short pattern (MSS SP-43) gamma'ya birakildi (ayri parca_tipi gerek)
--
-- Yeni pattern: stub_end SCHEDULE-bagimli (et_mm boru duvarina esit). Mevcut
-- B16.9 fittings (90LR, 45LR, tee_eq, vs.) schedule-bagimsiz - schedule_kod
-- hep NULL. Stub_end SCHEDULE uclusu (tipi/deger/kod) dolu - bu yuzden
-- idempotent anahtar schedule_kod'u da iceriyor.
--
-- Onemli: agirlik_kg ILK DEFA dolduruluyor (Wermac kg/parca verdi). Mevcut
-- tablolarda agirlik_kg NULL idi - 80. oturumda "Agirlik Hijyeni" ayri is
-- olarak ele alinacak (boru formul-bazli, flansh kaynak-tamamlama, vb).
--
-- Kaynaklar (MK-75.3 cift dogrulama):
--   primary - Wermac (wermac.org/fittings/dimensions_stub-ends_carbon-steel.html)
--             - long pattern Schedule STD + XS, NPS 1/2 -> 24
--   cross-1 - Skyland (skylandmetal.in/dimensions/asme-b16-9-long-short-stub-end.html)
--             - ayni F/G/R degerleri (yuvarlanmis), T cross-check
--
-- Kolon mapping (stub_end):
--   geometri_std         = 'ASME B16.9'
--   parca_tipi           = 'stub_end'
--   cap_buyuk_nps/dn/mm  = NPS / DN / OD (B36.10M)
--   schedule_tipi        = 'SCHEDULE'
--   schedule_deger       = 'STD' veya 'XS'
--   schedule_kod         = 'STD' veya 'XS'
--   et_mm                = T (lap thickness = boru duvar kalinligi)
--   ucu_uca_a_mm         = F (overall length)
--   yaricap_mm           = R (fillet radius lap-boru transition)
--   stub_lap_kalinlik_mm = T (lap kalinligi - et_mm ile ayni deger)
--   stub_lap_od_mm       = G (lap face OD - flange yatak yuzeyi)
--   agirlik_kg           = Wermac kg/parca (per piece)
--
-- Disiplin: MK-76.1 (implicit transaction), MK-78.5 (VALUES dikey hizalama),
--           MK-76.3 (ASCII-only yorumlar), MK-75.D (idempotent NOT EXISTS)
--
-- Idempotent anahtar: (geometri_std, parca_tipi, cap_buyuk_dn, schedule_kod,
--                      tenant_id IS NULL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A) Hijyen UPDATE - geometri_std prefix uydurma
-- ----------------------------------------------------------------------------
-- Mevcut 424 satir: 'B16.9' -> 'ASME B16.9'
-- 047'de eklenen 105 B16.11 satiri zaten 'ASME B16.11', dokunulmaz
-- Idempotent: WHERE filtresi ikinci calistirmada 0 etkiler

UPDATE fitting_olculer
SET geometri_std = 'ASME B16.9'
WHERE geometri_std = 'B16.9';

-- ----------------------------------------------------------------------------
-- B) stub_end INSERT - 20 NPS x 2 schedule = 40 satir
-- ----------------------------------------------------------------------------

INSERT INTO fitting_olculer (
  sistem_preset,        geometri_std,         parca_tipi,
  cap_buyuk_nps,        cap_buyuk_dn,         cap_buyuk_mm,
  schedule_tipi,        schedule_deger,       schedule_kod,
  et_mm,
  ucu_uca_a_mm,
  yaricap_mm,
  stub_lap_kalinlik_mm, stub_lap_od_mm,
  agirlik_kg
)
SELECT
  true,                 'ASME B16.9',         v.parca_tipi,
  v.nps,                v.dn,                 v.dis_cap_mm,
  'SCHEDULE',           v.sch_kod,            v.sch_kod,
  v.et_mm,
  v.f_mm,
  v.r_mm,
  v.et_mm,              v.g_mm,
  v.agirlik_kg
FROM (VALUES
  -- Schedule STD (NPS 1/2 -> 24, 20 satir)
  ('stub_end', '1/2',    15,  21.34::NUMERIC, 'STD', 2.77::NUMERIC,  76.2::NUMERIC,  3.18::NUMERIC,  34.9::NUMERIC,  0.16::NUMERIC),
  ('stub_end', '3/4',    20,  26.67::NUMERIC, 'STD', 2.87::NUMERIC,  76.2::NUMERIC,  3.18::NUMERIC,  42.9::NUMERIC,  0.23::NUMERIC),
  ('stub_end', '1',      25,  33.40::NUMERIC, 'STD', 3.38::NUMERIC, 101.6::NUMERIC,  3.18::NUMERIC,  50.8::NUMERIC,  0.29::NUMERIC),
  ('stub_end', '1.1/4',  32,  42.16::NUMERIC, 'STD', 3.56::NUMERIC, 101.6::NUMERIC,  4.76::NUMERIC,  63.5::NUMERIC,  0.45::NUMERIC),
  ('stub_end', '1.1/2',  40,  48.26::NUMERIC, 'STD', 3.68::NUMERIC, 101.6::NUMERIC,  6.35::NUMERIC,  73.0::NUMERIC,  0.54::NUMERIC),
  ('stub_end', '2',      50,  60.33::NUMERIC, 'STD', 3.91::NUMERIC, 152.4::NUMERIC,  7.94::NUMERIC,  92.1::NUMERIC,  1.00::NUMERIC),
  ('stub_end', '2.1/2',  65,  73.03::NUMERIC, 'STD', 5.16::NUMERIC, 152.4::NUMERIC,  7.94::NUMERIC, 104.8::NUMERIC,  1.50::NUMERIC),
  ('stub_end', '3',      80,  88.90::NUMERIC, 'STD', 5.49::NUMERIC, 152.4::NUMERIC,  9.53::NUMERIC, 127.0::NUMERIC,  2.10::NUMERIC),
  ('stub_end', '3.1/2',  90, 101.60::NUMERIC, 'STD', 5.74::NUMERIC, 152.4::NUMERIC,  9.53::NUMERIC, 139.7::NUMERIC,  2.50::NUMERIC),
  ('stub_end', '4',     100, 114.30::NUMERIC, 'STD', 6.02::NUMERIC, 152.4::NUMERIC, 11.11::NUMERIC, 157.2::NUMERIC,  3.00::NUMERIC),
  ('stub_end', '5',     125, 141.30::NUMERIC, 'STD', 6.55::NUMERIC, 203.2::NUMERIC, 11.11::NUMERIC, 185.7::NUMERIC,  5.40::NUMERIC),
  ('stub_end', '6',     150, 168.30::NUMERIC, 'STD', 7.11::NUMERIC, 203.2::NUMERIC, 12.70::NUMERIC, 215.9::NUMERIC,  7.30::NUMERIC),
  ('stub_end', '8',     200, 219.10::NUMERIC, 'STD', 8.18::NUMERIC, 203.2::NUMERIC, 12.70::NUMERIC, 269.9::NUMERIC, 11.60::NUMERIC),
  ('stub_end', '10',    250, 273.10::NUMERIC, 'STD', 9.27::NUMERIC, 254.0::NUMERIC, 12.70::NUMERIC, 323.9::NUMERIC, 18.00::NUMERIC),
  ('stub_end', '12',    300, 323.90::NUMERIC, 'STD', 9.53::NUMERIC, 254.0::NUMERIC, 12.70::NUMERIC, 381.0::NUMERIC, 21.00::NUMERIC),
  ('stub_end', '14',    350, 355.60::NUMERIC, 'STD', 9.53::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 412.8::NUMERIC, 28.00::NUMERIC),
  ('stub_end', '16',    400, 406.40::NUMERIC, 'STD', 9.53::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 469.9::NUMERIC, 34.00::NUMERIC),
  ('stub_end', '18',    450, 457.20::NUMERIC, 'STD', 9.53::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 533.4::NUMERIC, 39.00::NUMERIC),
  ('stub_end', '20',    500, 508.00::NUMERIC, 'STD', 9.53::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 584.2::NUMERIC, 44.00::NUMERIC),
  ('stub_end', '24',    600, 609.60::NUMERIC, 'STD', 9.53::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 692.2::NUMERIC, 57.00::NUMERIC),
  -- Schedule XS (NPS 1/2 -> 24, 20 satir; T ve agirlik degisir, G/F/R sabit)
  ('stub_end', '1/2',    15,  21.34::NUMERIC, 'XS',  3.73::NUMERIC,  76.2::NUMERIC,  3.18::NUMERIC,  34.9::NUMERIC,  0.20::NUMERIC),
  ('stub_end', '3/4',    20,  26.67::NUMERIC, 'XS',  3.91::NUMERIC,  76.2::NUMERIC,  3.18::NUMERIC,  42.9::NUMERIC,  0.30::NUMERIC),
  ('stub_end', '1',      25,  33.40::NUMERIC, 'XS',  4.55::NUMERIC, 101.6::NUMERIC,  3.18::NUMERIC,  50.8::NUMERIC,  0.40::NUMERIC),
  ('stub_end', '1.1/4',  32,  42.16::NUMERIC, 'XS',  4.85::NUMERIC, 101.6::NUMERIC,  4.76::NUMERIC,  63.5::NUMERIC,  0.60::NUMERIC),
  ('stub_end', '1.1/2',  40,  48.26::NUMERIC, 'XS',  5.08::NUMERIC, 101.6::NUMERIC,  6.35::NUMERIC,  73.0::NUMERIC,  0.70::NUMERIC),
  ('stub_end', '2',      50,  60.33::NUMERIC, 'XS',  5.54::NUMERIC, 152.4::NUMERIC,  7.94::NUMERIC,  92.1::NUMERIC,  1.40::NUMERIC),
  ('stub_end', '2.1/2',  65,  73.03::NUMERIC, 'XS',  7.01::NUMERIC, 152.4::NUMERIC,  7.94::NUMERIC, 104.8::NUMERIC,  2.00::NUMERIC),
  ('stub_end', '3',      80,  88.90::NUMERIC, 'XS',  7.62::NUMERIC, 152.4::NUMERIC,  9.53::NUMERIC, 127.0::NUMERIC,  2.90::NUMERIC),
  ('stub_end', '3.1/2',  90, 101.60::NUMERIC, 'XS',  8.08::NUMERIC, 152.4::NUMERIC,  9.53::NUMERIC, 139.7::NUMERIC,  3.40::NUMERIC),
  ('stub_end', '4',     100, 114.30::NUMERIC, 'XS',  8.56::NUMERIC, 152.4::NUMERIC, 11.11::NUMERIC, 157.2::NUMERIC,  4.10::NUMERIC),
  ('stub_end', '5',     125, 141.30::NUMERIC, 'XS',  9.53::NUMERIC, 203.2::NUMERIC, 11.11::NUMERIC, 185.7::NUMERIC,  7.50::NUMERIC),
  ('stub_end', '6',     150, 168.30::NUMERIC, 'XS', 10.97::NUMERIC, 203.2::NUMERIC, 12.70::NUMERIC, 215.9::NUMERIC, 10.00::NUMERIC),
  ('stub_end', '8',     200, 219.10::NUMERIC, 'XS', 12.70::NUMERIC, 203.2::NUMERIC, 12.70::NUMERIC, 269.9::NUMERIC, 16.00::NUMERIC),
  ('stub_end', '10',    250, 273.10::NUMERIC, 'XS', 12.70::NUMERIC, 254.0::NUMERIC, 12.70::NUMERIC, 323.9::NUMERIC, 24.00::NUMERIC),
  ('stub_end', '12',    300, 323.90::NUMERIC, 'XS', 12.70::NUMERIC, 254.0::NUMERIC, 12.70::NUMERIC, 381.0::NUMERIC, 29.00::NUMERIC),
  ('stub_end', '14',    350, 355.60::NUMERIC, 'XS', 12.70::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 412.8::NUMERIC, 38.00::NUMERIC),
  ('stub_end', '16',    400, 406.40::NUMERIC, 'XS', 12.70::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 469.9::NUMERIC, 43.00::NUMERIC),
  ('stub_end', '18',    450, 457.20::NUMERIC, 'XS', 12.70::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 533.4::NUMERIC, 49.00::NUMERIC),
  ('stub_end', '20',    500, 508.00::NUMERIC, 'XS', 12.70::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 584.2::NUMERIC, 63.00::NUMERIC),
  ('stub_end', '24',    600, 609.60::NUMERIC, 'XS', 12.70::NUMERIC, 304.8::NUMERIC, 12.70::NUMERIC, 692.2::NUMERIC, 76.00::NUMERIC)
) AS v(parca_tipi, nps, dn, dis_cap_mm, sch_kod, et_mm, f_mm, r_mm, g_mm, agirlik_kg)
WHERE NOT EXISTS (
  SELECT 1 FROM fitting_olculer ex
  WHERE ex.geometri_std = 'ASME B16.9'
    AND ex.parca_tipi   = v.parca_tipi
    AND ex.cap_buyuk_dn = v.dn
    AND ex.schedule_kod = v.sch_kod
    AND ex.tenant_id IS NULL
);

-- ============================================================================
-- Dogrulama sorgulari (calistirdiktan sonra elle kontrol icin):
--
-- 1) Hijyen UPDATE basarili mi:
--    SELECT geometri_std, count(*) FROM fitting_olculer
--    WHERE geometri_std LIKE '%B16.9' OR geometri_std LIKE '%B16.11'
--    GROUP BY geometri_std ORDER BY geometri_std;
--    Beklenen: 'ASME B16.11' = 105, 'ASME B16.9' = 464 (424 eski + 40 stub_end)
--    'B16.9' satiri olmamali (UPDATE tam temizlemis olmali).
--
-- 2) stub_end satir sayisi:
--    SELECT schedule_kod, count(*) FROM fitting_olculer
--    WHERE parca_tipi = 'stub_end'
--    GROUP BY schedule_kod ORDER BY schedule_kod;
--    Beklenen: STD=20, XS=20.
--
-- 3) Spot check (DN 100 STD - en yaygin):
--    SELECT parca_tipi, cap_buyuk_dn, schedule_kod, et_mm, ucu_uca_a_mm,
--           yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg
--    FROM fitting_olculer
--    WHERE parca_tipi = 'stub_end' AND cap_buyuk_dn = 100 AND schedule_kod = 'STD';
--    Beklenen: et=6.02, F=152.4, R=11.11, stub_lap_t=6.02, G=157.2, kg=3.0
--
-- 4) Agirlik dolu mu kontrol:
--    SELECT count(*) AS toplam, count(agirlik_kg) AS agirlik_dolu
--    FROM fitting_olculer WHERE parca_tipi = 'stub_end';
--    Beklenen: 40 / 40 (hepsi dolu, ilk weight-dolu fitting satirlari).
--
-- 5) CHECK constraint test (schedule uclusu tutarli mi):
--    SELECT count(*) FROM fitting_olculer
--    WHERE parca_tipi = 'stub_end'
--      AND (schedule_tipi IS NULL OR schedule_deger IS NULL OR schedule_kod IS NULL);
--    Beklenen: 0 (uclusu hepsi dolu, fitting_olculer_schedule_consistency tetiklemez).
-- ============================================================================
