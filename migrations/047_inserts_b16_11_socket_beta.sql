-- ============================================================================
-- Migration 047 - B16.11 socket weld fittings insert (beta kapsam, 105 satir)
-- ============================================================================
-- Amac: ASME B16.11 SW fittings, 046 ile genisletilen fitting_olculer
-- tablosuna yuklenir. Gemi tersane profilinde NPS 1/2-4 ana kapsam.
--
-- Kapsam (beta):
--   Class 3000: 7 parca x 9 NPS (1/2 -> 4)   = 63 satir
--   Class 6000: 7 parca x 6 NPS (1/2 -> 2)   = 42 satir
--   Toplam:                                    105 satir
--
-- Parca tipleri (7):
--   90SW          - 90 derece socket weld elbow
--   45SW          - 45 derece socket weld elbow
--   tee_eq_sw     - equal tee socket weld
--   cross_sw      - equal cross socket weld
--   coupling_full - full coupling socket weld
--   coupling_half - half coupling socket weld
--   cap_sw        - socket weld cap
--
-- Kapsam disi (gama veya sonraki migration):
--   - NPS 1/8, 1/4, 3/8 (kucuk NPS, instrumentation)
--   - reducing coupling (cap_kucuk_* kombinatif matris)
--   - threaded fittings (Class 2000/3000/6000)
--   - Class 9000 (gelecekte X-ray, ultra yuksek basinc gerekirse)
--
-- Kaynaklar (MK-75.3 cift dogrulama):
--   primary  - Wermac (wermac.org/fittings/dim_sw_*) - tek sayfada Class 3000+6000
--   cross-1  - Skyland Metal (skylandmetal.in/dimensions/asme-b16-11-*)
--   cross-2  - Ferrobend (ferrobend.com/dimensions/ansi-asme/pipe-fitting/b16.11-*)
--   B/J/D degerleri Wermac+Skyland+Ferrobend bire-bir
--
-- Olcu birimi: mm (Wermac general note: "Dimensions are in millimeters")
--
-- Kolon mapping:
--   geometri_std        = 'ASME B16.11'
--   parca_tipi          = parca kodu
--   cap_buyuk_nps       = NPS (string, ornek '1.1/4')
--   cap_buyuk_dn        = DN integer (15, 20, 25, ...)
--   cap_buyuk_mm        = boru dis cap (ASME B36.10M)
--   class_no            = 3000 veya 6000
--   et_mm               = G (body wall thickness min)
--   ucu_uca_a_mm        = A (elbow/tee/cross: center-to-bottom of socket)
--   ucu_uca_h_mm        = E (coupling) veya F (half-coupling) veya Q (cap)
--   soket_derinlik_mm   = J (min depth of socket)
--   soket_ic_cap_mm     = B (socket bore max)
--   notlar              = cap_sw icin {"cap_dia_mm": R} JSON
--
-- Disiplin: MK-75.D (idempotent NOT EXISTS), MK-78.5 (dikey hizalama),
--           MK-76.3 (ASCII-only yorumlar)
--
-- Idempotent anahtar: (geometri_std, parca_tipi, cap_buyuk_dn, class_no, tenant_id IS NULL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) 90SW - 90 derece socket weld elbow (15 satir: C3000=9, C6000=6)
-- ----------------------------------------------------------------------------

INSERT INTO fitting_olculer (
  sistem_preset,    geometri_std,    parca_tipi,
  cap_buyuk_nps,    cap_buyuk_dn,    cap_buyuk_mm,
  class_no,         et_mm,
  ucu_uca_a_mm,
  soket_derinlik_mm, soket_ic_cap_mm
)
SELECT
  true,             'ASME B16.11',   v.parca_tipi,
  v.nps,            v.dn,            v.dis_cap_mm,
  v.class_no,       v.et_mm,
  v.a_mm,
  v.j_mm,           v.b_mm
FROM (VALUES
  -- Class 3000 (NPS 1/2 -> 4)
  ('90SW', '1/2',    15,  21.34::NUMERIC, 3000, 3.75::NUMERIC, 15.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('90SW', '3/4',    20,  26.67::NUMERIC, 3000, 3.90::NUMERIC, 19.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('90SW', '1',      25,  33.40::NUMERIC, 3000, 4.55::NUMERIC, 22.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('90SW', '1.1/4',  32,  42.16::NUMERIC, 3000, 4.85::NUMERIC, 27.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('90SW', '1.1/2',  40,  48.26::NUMERIC, 3000, 5.10::NUMERIC, 32.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('90SW', '2',      50,  60.33::NUMERIC, 3000, 5.55::NUMERIC, 38.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC),
  ('90SW', '2.1/2',  65,  73.03::NUMERIC, 3000, 7.00::NUMERIC, 41.5::NUMERIC, 16::NUMERIC, 74.20::NUMERIC),
  ('90SW', '3',      80,  88.90::NUMERIC, 3000, 7.60::NUMERIC, 57.5::NUMERIC, 16::NUMERIC, 90.15::NUMERIC),
  ('90SW', '4',     100, 114.30::NUMERIC, 3000, 8.55::NUMERIC, 66.5::NUMERIC, 19::NUMERIC,115.80::NUMERIC),
  -- Class 6000 (NPS 1/2 -> 2)
  ('90SW', '1/2',    15,  21.34::NUMERIC, 6000, 4.80::NUMERIC, 19.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('90SW', '3/4',    20,  26.67::NUMERIC, 6000, 5.55::NUMERIC, 22.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('90SW', '1',      25,  33.40::NUMERIC, 6000, 6.35::NUMERIC, 27.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('90SW', '1.1/4',  32,  42.16::NUMERIC, 6000, 6.35::NUMERIC, 32.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('90SW', '1.1/2',  40,  48.26::NUMERIC, 6000, 7.15::NUMERIC, 38.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('90SW', '2',      50,  60.33::NUMERIC, 6000, 8.75::NUMERIC, 41.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC)
) AS v(parca_tipi, nps, dn, dis_cap_mm, class_no, et_mm, a_mm, j_mm, b_mm)
WHERE NOT EXISTS (
  SELECT 1 FROM fitting_olculer ex
  WHERE ex.geometri_std = 'ASME B16.11'
    AND ex.parca_tipi   = v.parca_tipi
    AND ex.cap_buyuk_dn = v.dn
    AND ex.class_no     = v.class_no
    AND ex.tenant_id IS NULL
);

-- ----------------------------------------------------------------------------
-- 2) 45SW - 45 derece socket weld elbow (15 satir)
-- Tek farklilik: A degeri (center-to-bottom) 90SW'den kisa
-- ----------------------------------------------------------------------------

INSERT INTO fitting_olculer (
  sistem_preset,    geometri_std,    parca_tipi,
  cap_buyuk_nps,    cap_buyuk_dn,    cap_buyuk_mm,
  class_no,         et_mm,
  ucu_uca_a_mm,
  soket_derinlik_mm, soket_ic_cap_mm
)
SELECT
  true,             'ASME B16.11',   v.parca_tipi,
  v.nps,            v.dn,            v.dis_cap_mm,
  v.class_no,       v.et_mm,
  v.a_mm,
  v.j_mm,           v.b_mm
FROM (VALUES
  -- Class 3000 (NPS 1/2 -> 4)
  ('45SW', '1/2',    15,  21.34::NUMERIC, 3000, 3.75::NUMERIC, 11.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('45SW', '3/4',    20,  26.67::NUMERIC, 3000, 3.90::NUMERIC, 12.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('45SW', '1',      25,  33.40::NUMERIC, 3000, 4.55::NUMERIC, 14.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('45SW', '1.1/4',  32,  42.16::NUMERIC, 3000, 4.85::NUMERIC, 17.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('45SW', '1.1/2',  40,  48.26::NUMERIC, 3000, 5.10::NUMERIC, 21.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('45SW', '2',      50,  60.33::NUMERIC, 3000, 5.55::NUMERIC, 25.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC),
  ('45SW', '2.1/2',  65,  73.03::NUMERIC, 3000, 7.00::NUMERIC, 29.0::NUMERIC, 16::NUMERIC, 74.20::NUMERIC),
  ('45SW', '3',      80,  88.90::NUMERIC, 3000, 7.60::NUMERIC, 31.5::NUMERIC, 16::NUMERIC, 90.15::NUMERIC),
  ('45SW', '4',     100, 114.30::NUMERIC, 3000, 8.55::NUMERIC, 41.5::NUMERIC, 19::NUMERIC,115.80::NUMERIC),
  -- Class 6000 (NPS 1/2 -> 2)
  ('45SW', '1/2',    15,  21.34::NUMERIC, 6000, 4.80::NUMERIC, 12.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('45SW', '3/4',    20,  26.67::NUMERIC, 6000, 5.55::NUMERIC, 14.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('45SW', '1',      25,  33.40::NUMERIC, 6000, 6.35::NUMERIC, 17.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('45SW', '1.1/4',  32,  42.16::NUMERIC, 6000, 6.35::NUMERIC, 21.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('45SW', '1.1/2',  40,  48.26::NUMERIC, 6000, 7.15::NUMERIC, 25.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('45SW', '2',      50,  60.33::NUMERIC, 6000, 8.75::NUMERIC, 29.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC)
) AS v(parca_tipi, nps, dn, dis_cap_mm, class_no, et_mm, a_mm, j_mm, b_mm)
WHERE NOT EXISTS (
  SELECT 1 FROM fitting_olculer ex
  WHERE ex.geometri_std = 'ASME B16.11'
    AND ex.parca_tipi   = v.parca_tipi
    AND ex.cap_buyuk_dn = v.dn
    AND ex.class_no     = v.class_no
    AND ex.tenant_id IS NULL
);

-- ----------------------------------------------------------------------------
-- 3) tee_eq_sw - equal tee socket weld (15 satir)
-- A = center-to-end (run ve branch, B16.11'de C boyutu) - 90SW ile aynı
-- ----------------------------------------------------------------------------

INSERT INTO fitting_olculer (
  sistem_preset,    geometri_std,    parca_tipi,
  cap_buyuk_nps,    cap_buyuk_dn,    cap_buyuk_mm,
  class_no,         et_mm,
  ucu_uca_a_mm,
  soket_derinlik_mm, soket_ic_cap_mm
)
SELECT
  true,             'ASME B16.11',   v.parca_tipi,
  v.nps,            v.dn,            v.dis_cap_mm,
  v.class_no,       v.et_mm,
  v.a_mm,
  v.j_mm,           v.b_mm
FROM (VALUES
  -- Class 3000 (NPS 1/2 -> 4)
  ('tee_eq_sw', '1/2',    15,  21.34::NUMERIC, 3000, 3.75::NUMERIC, 15.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('tee_eq_sw', '3/4',    20,  26.67::NUMERIC, 3000, 3.90::NUMERIC, 19.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('tee_eq_sw', '1',      25,  33.40::NUMERIC, 3000, 4.55::NUMERIC, 22.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('tee_eq_sw', '1.1/4',  32,  42.16::NUMERIC, 3000, 4.85::NUMERIC, 27.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('tee_eq_sw', '1.1/2',  40,  48.26::NUMERIC, 3000, 5.10::NUMERIC, 32.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('tee_eq_sw', '2',      50,  60.33::NUMERIC, 3000, 5.55::NUMERIC, 38.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC),
  ('tee_eq_sw', '2.1/2',  65,  73.03::NUMERIC, 3000, 7.00::NUMERIC, 41.5::NUMERIC, 16::NUMERIC, 74.20::NUMERIC),
  ('tee_eq_sw', '3',      80,  88.90::NUMERIC, 3000, 7.60::NUMERIC, 57.5::NUMERIC, 16::NUMERIC, 90.15::NUMERIC),
  ('tee_eq_sw', '4',     100, 114.30::NUMERIC, 3000, 8.55::NUMERIC, 66.5::NUMERIC, 19::NUMERIC,115.80::NUMERIC),
  -- Class 6000 (NPS 1/2 -> 2)
  ('tee_eq_sw', '1/2',    15,  21.34::NUMERIC, 6000, 4.80::NUMERIC, 19.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('tee_eq_sw', '3/4',    20,  26.67::NUMERIC, 6000, 5.55::NUMERIC, 22.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('tee_eq_sw', '1',      25,  33.40::NUMERIC, 6000, 6.35::NUMERIC, 27.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('tee_eq_sw', '1.1/4',  32,  42.16::NUMERIC, 6000, 6.35::NUMERIC, 32.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('tee_eq_sw', '1.1/2',  40,  48.26::NUMERIC, 6000, 7.15::NUMERIC, 38.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('tee_eq_sw', '2',      50,  60.33::NUMERIC, 6000, 8.75::NUMERIC, 41.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC)
) AS v(parca_tipi, nps, dn, dis_cap_mm, class_no, et_mm, a_mm, j_mm, b_mm)
WHERE NOT EXISTS (
  SELECT 1 FROM fitting_olculer ex
  WHERE ex.geometri_std = 'ASME B16.11'
    AND ex.parca_tipi   = v.parca_tipi
    AND ex.cap_buyuk_dn = v.dn
    AND ex.class_no     = v.class_no
    AND ex.tenant_id IS NULL
);

-- ----------------------------------------------------------------------------
-- 4) cross_sw - equal cross socket weld (15 satir)
-- Tee_eq_sw ile bire-bir ayni dimensions tablosu (Wermac sw_tee_cross sayfasi)
-- ----------------------------------------------------------------------------

INSERT INTO fitting_olculer (
  sistem_preset,    geometri_std,    parca_tipi,
  cap_buyuk_nps,    cap_buyuk_dn,    cap_buyuk_mm,
  class_no,         et_mm,
  ucu_uca_a_mm,
  soket_derinlik_mm, soket_ic_cap_mm
)
SELECT
  true,             'ASME B16.11',   v.parca_tipi,
  v.nps,            v.dn,            v.dis_cap_mm,
  v.class_no,       v.et_mm,
  v.a_mm,
  v.j_mm,           v.b_mm
FROM (VALUES
  -- Class 3000 (NPS 1/2 -> 4)
  ('cross_sw', '1/2',    15,  21.34::NUMERIC, 3000, 3.75::NUMERIC, 15.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('cross_sw', '3/4',    20,  26.67::NUMERIC, 3000, 3.90::NUMERIC, 19.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('cross_sw', '1',      25,  33.40::NUMERIC, 3000, 4.55::NUMERIC, 22.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('cross_sw', '1.1/4',  32,  42.16::NUMERIC, 3000, 4.85::NUMERIC, 27.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('cross_sw', '1.1/2',  40,  48.26::NUMERIC, 3000, 5.10::NUMERIC, 32.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('cross_sw', '2',      50,  60.33::NUMERIC, 3000, 5.55::NUMERIC, 38.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC),
  ('cross_sw', '2.1/2',  65,  73.03::NUMERIC, 3000, 7.00::NUMERIC, 41.5::NUMERIC, 16::NUMERIC, 74.20::NUMERIC),
  ('cross_sw', '3',      80,  88.90::NUMERIC, 3000, 7.60::NUMERIC, 57.5::NUMERIC, 16::NUMERIC, 90.15::NUMERIC),
  ('cross_sw', '4',     100, 114.30::NUMERIC, 3000, 8.55::NUMERIC, 66.5::NUMERIC, 19::NUMERIC,115.80::NUMERIC),
  -- Class 6000 (NPS 1/2 -> 2)
  ('cross_sw', '1/2',    15,  21.34::NUMERIC, 6000, 4.80::NUMERIC, 19.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('cross_sw', '3/4',    20,  26.67::NUMERIC, 6000, 5.55::NUMERIC, 22.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('cross_sw', '1',      25,  33.40::NUMERIC, 6000, 6.35::NUMERIC, 27.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('cross_sw', '1.1/4',  32,  42.16::NUMERIC, 6000, 6.35::NUMERIC, 32.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('cross_sw', '1.1/2',  40,  48.26::NUMERIC, 6000, 7.15::NUMERIC, 38.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('cross_sw', '2',      50,  60.33::NUMERIC, 6000, 8.75::NUMERIC, 41.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC)
) AS v(parca_tipi, nps, dn, dis_cap_mm, class_no, et_mm, a_mm, j_mm, b_mm)
WHERE NOT EXISTS (
  SELECT 1 FROM fitting_olculer ex
  WHERE ex.geometri_std = 'ASME B16.11'
    AND ex.parca_tipi   = v.parca_tipi
    AND ex.cap_buyuk_dn = v.dn
    AND ex.class_no     = v.class_no
    AND ex.tenant_id IS NULL
);

-- ----------------------------------------------------------------------------
-- 5) coupling_full - full coupling SW (15 satir)
-- H = E (laying length); E Class 3000 ve 6000 icin ayni, G class-bagimli
-- ----------------------------------------------------------------------------

INSERT INTO fitting_olculer (
  sistem_preset,    geometri_std,    parca_tipi,
  cap_buyuk_nps,    cap_buyuk_dn,    cap_buyuk_mm,
  class_no,         et_mm,
  ucu_uca_h_mm,
  soket_derinlik_mm, soket_ic_cap_mm
)
SELECT
  true,             'ASME B16.11',   v.parca_tipi,
  v.nps,            v.dn,            v.dis_cap_mm,
  v.class_no,       v.et_mm,
  v.h_mm,
  v.j_mm,           v.b_mm
FROM (VALUES
  -- Class 3000 (NPS 1/2 -> 4)
  ('coupling_full', '1/2',    15,  21.34::NUMERIC, 3000, 3.75::NUMERIC,  9.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('coupling_full', '3/4',    20,  26.67::NUMERIC, 3000, 3.90::NUMERIC,  9.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('coupling_full', '1',      25,  33.40::NUMERIC, 3000, 4.55::NUMERIC, 13.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('coupling_full', '1.1/4',  32,  42.16::NUMERIC, 3000, 4.85::NUMERIC, 13.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('coupling_full', '1.1/2',  40,  48.26::NUMERIC, 3000, 5.10::NUMERIC, 13.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('coupling_full', '2',      50,  60.33::NUMERIC, 3000, 5.55::NUMERIC, 19.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC),
  ('coupling_full', '2.1/2',  65,  73.03::NUMERIC, 3000, 7.00::NUMERIC, 19.0::NUMERIC, 16::NUMERIC, 74.20::NUMERIC),
  ('coupling_full', '3',      80,  88.90::NUMERIC, 3000, 7.60::NUMERIC, 19.0::NUMERIC, 16::NUMERIC, 90.15::NUMERIC),
  ('coupling_full', '4',     100, 114.30::NUMERIC, 3000, 8.55::NUMERIC, 19.0::NUMERIC, 19::NUMERIC,115.80::NUMERIC),
  -- Class 6000 (NPS 1/2 -> 2)
  ('coupling_full', '1/2',    15,  21.34::NUMERIC, 6000, 4.80::NUMERIC,  9.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('coupling_full', '3/4',    20,  26.67::NUMERIC, 6000, 5.55::NUMERIC,  9.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('coupling_full', '1',      25,  33.40::NUMERIC, 6000, 6.35::NUMERIC, 13.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('coupling_full', '1.1/4',  32,  42.16::NUMERIC, 6000, 6.35::NUMERIC, 13.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('coupling_full', '1.1/2',  40,  48.26::NUMERIC, 6000, 7.15::NUMERIC, 13.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('coupling_full', '2',      50,  60.33::NUMERIC, 6000, 8.75::NUMERIC, 19.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC)
) AS v(parca_tipi, nps, dn, dis_cap_mm, class_no, et_mm, h_mm, j_mm, b_mm)
WHERE NOT EXISTS (
  SELECT 1 FROM fitting_olculer ex
  WHERE ex.geometri_std = 'ASME B16.11'
    AND ex.parca_tipi   = v.parca_tipi
    AND ex.cap_buyuk_dn = v.dn
    AND ex.class_no     = v.class_no
    AND ex.tenant_id IS NULL
);

-- ----------------------------------------------------------------------------
-- 6) coupling_half - half coupling SW (15 satir)
-- H = F (laying length); F Class 3000 ve 6000 icin ayni
-- ----------------------------------------------------------------------------

INSERT INTO fitting_olculer (
  sistem_preset,    geometri_std,    parca_tipi,
  cap_buyuk_nps,    cap_buyuk_dn,    cap_buyuk_mm,
  class_no,         et_mm,
  ucu_uca_h_mm,
  soket_derinlik_mm, soket_ic_cap_mm
)
SELECT
  true,             'ASME B16.11',   v.parca_tipi,
  v.nps,            v.dn,            v.dis_cap_mm,
  v.class_no,       v.et_mm,
  v.h_mm,
  v.j_mm,           v.b_mm
FROM (VALUES
  -- Class 3000 (NPS 1/2 -> 4)
  ('coupling_half', '1/2',    15,  21.34::NUMERIC, 3000, 3.75::NUMERIC, 22.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('coupling_half', '3/4',    20,  26.67::NUMERIC, 3000, 3.90::NUMERIC, 23.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('coupling_half', '1',      25,  33.40::NUMERIC, 3000, 4.55::NUMERIC, 29.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('coupling_half', '1.1/4',  32,  42.16::NUMERIC, 3000, 4.85::NUMERIC, 30.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('coupling_half', '1.1/2',  40,  48.26::NUMERIC, 3000, 5.10::NUMERIC, 32.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('coupling_half', '2',      50,  60.33::NUMERIC, 3000, 5.55::NUMERIC, 41.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC),
  ('coupling_half', '2.1/2',  65,  73.03::NUMERIC, 3000, 7.00::NUMERIC, 42.5::NUMERIC, 16::NUMERIC, 74.20::NUMERIC),
  ('coupling_half', '3',      80,  88.90::NUMERIC, 3000, 7.60::NUMERIC, 44.5::NUMERIC, 16::NUMERIC, 90.15::NUMERIC),
  ('coupling_half', '4',     100, 114.30::NUMERIC, 3000, 8.55::NUMERIC, 47.5::NUMERIC, 19::NUMERIC,115.80::NUMERIC),
  -- Class 6000 (NPS 1/2 -> 2)
  ('coupling_half', '1/2',    15,  21.34::NUMERIC, 6000, 4.80::NUMERIC, 22.5::NUMERIC, 10::NUMERIC, 21.95::NUMERIC),
  ('coupling_half', '3/4',    20,  26.67::NUMERIC, 6000, 5.55::NUMERIC, 23.5::NUMERIC, 13::NUMERIC, 27.30::NUMERIC),
  ('coupling_half', '1',      25,  33.40::NUMERIC, 6000, 6.35::NUMERIC, 29.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC),
  ('coupling_half', '1.1/4',  32,  42.16::NUMERIC, 6000, 6.35::NUMERIC, 30.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC),
  ('coupling_half', '1.1/2',  40,  48.26::NUMERIC, 6000, 7.15::NUMERIC, 32.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC),
  ('coupling_half', '2',      50,  60.33::NUMERIC, 6000, 8.75::NUMERIC, 41.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC)
) AS v(parca_tipi, nps, dn, dis_cap_mm, class_no, et_mm, h_mm, j_mm, b_mm)
WHERE NOT EXISTS (
  SELECT 1 FROM fitting_olculer ex
  WHERE ex.geometri_std = 'ASME B16.11'
    AND ex.parca_tipi   = v.parca_tipi
    AND ex.cap_buyuk_dn = v.dn
    AND ex.class_no     = v.class_no
    AND ex.tenant_id IS NULL
);

-- ----------------------------------------------------------------------------
-- 7) cap_sw - socket weld cap (15 satir)
-- H = Q (length cap), notlar JSON = {"cap_dia_mm": R}
-- et_mm Wermac cap sayfasinda yok, NULL birakilir; B16.11-2011 PDF ile sonra
-- ----------------------------------------------------------------------------

INSERT INTO fitting_olculer (
  sistem_preset,    geometri_std,    parca_tipi,
  cap_buyuk_nps,    cap_buyuk_dn,    cap_buyuk_mm,
  class_no,
  ucu_uca_h_mm,
  soket_derinlik_mm, soket_ic_cap_mm,
  notlar
)
SELECT
  true,             'ASME B16.11',   v.parca_tipi,
  v.nps,            v.dn,            v.dis_cap_mm,
  v.class_no,
  v.q_mm,
  v.j_mm,           v.b_mm,
  v.notlar
FROM (VALUES
  -- Class 3000 (NPS 1/2 -> 4)
  ('cap_sw', '1/2',    15,  21.34::NUMERIC, 3000, 19.0::NUMERIC, 10::NUMERIC, 21.95::NUMERIC, '{"cap_dia_mm": 32}'),
  ('cap_sw', '3/4',    20,  26.67::NUMERIC, 3000, 23.0::NUMERIC, 13::NUMERIC, 27.30::NUMERIC, '{"cap_dia_mm": 38}'),
  ('cap_sw', '1',      25,  33.40::NUMERIC, 3000, 26.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC, '{"cap_dia_mm": 45}'),
  ('cap_sw', '1.1/4',  32,  42.16::NUMERIC, 3000, 28.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC, '{"cap_dia_mm": 55}'),
  ('cap_sw', '1.1/2',  40,  48.26::NUMERIC, 3000, 30.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC, '{"cap_dia_mm": 65}'),
  ('cap_sw', '2',      50,  60.33::NUMERIC, 3000, 36.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC, '{"cap_dia_mm": 75}'),
  ('cap_sw', '2.1/2',  65,  73.03::NUMERIC, 3000, 38.0::NUMERIC, 16::NUMERIC, 74.20::NUMERIC, '{"cap_dia_mm": 92}'),
  ('cap_sw', '3',      80,  88.90::NUMERIC, 3000, 42.0::NUMERIC, 16::NUMERIC, 90.15::NUMERIC, '{"cap_dia_mm": 110}'),
  ('cap_sw', '4',     100, 114.30::NUMERIC, 3000, 48.0::NUMERIC, 19::NUMERIC,115.80::NUMERIC, '{"cap_dia_mm": 140}'),
  -- Class 6000 (NPS 1/2 -> 2)
  ('cap_sw', '1/2',    15,  21.34::NUMERIC, 6000, 22.0::NUMERIC, 10::NUMERIC, 21.95::NUMERIC, '{"cap_dia_mm": 34}'),
  ('cap_sw', '3/4',    20,  26.67::NUMERIC, 6000, 26.0::NUMERIC, 13::NUMERIC, 27.30::NUMERIC, '{"cap_dia_mm": 41}'),
  ('cap_sw', '1',      25,  33.40::NUMERIC, 6000, 28.0::NUMERIC, 13::NUMERIC, 34.05::NUMERIC, '{"cap_dia_mm": 50}'),
  ('cap_sw', '1.1/4',  32,  42.16::NUMERIC, 6000, 30.0::NUMERIC, 13::NUMERIC, 42.80::NUMERIC, '{"cap_dia_mm": 58}'),
  ('cap_sw', '1.1/2',  40,  48.26::NUMERIC, 6000, 32.0::NUMERIC, 13::NUMERIC, 48.90::NUMERIC, '{"cap_dia_mm": 66.5}'),
  ('cap_sw', '2',      50,  60.33::NUMERIC, 6000, 38.0::NUMERIC, 16::NUMERIC, 61.35::NUMERIC, '{"cap_dia_mm": 85}')
) AS v(parca_tipi, nps, dn, dis_cap_mm, class_no, q_mm, j_mm, b_mm, notlar)
WHERE NOT EXISTS (
  SELECT 1 FROM fitting_olculer ex
  WHERE ex.geometri_std = 'ASME B16.11'
    AND ex.parca_tipi   = v.parca_tipi
    AND ex.cap_buyuk_dn = v.dn
    AND ex.class_no     = v.class_no
    AND ex.tenant_id IS NULL
);

-- ============================================================================
-- Dogrulama sorgulari (calistirdiktan sonra elle):
--
-- 1) Toplam B16.11 satir sayisi:
--    SELECT count(*) FROM fitting_olculer WHERE geometri_std = 'ASME B16.11';
--    Beklenen: 105
--
-- 2) Parca tipi dagilimi:
--    SELECT parca_tipi, class_no, count(*)
--    FROM fitting_olculer
--    WHERE geometri_std = 'ASME B16.11'
--    GROUP BY parca_tipi, class_no ORDER BY parca_tipi, class_no;
--    Beklenen: her parca tipi icin Class 3000=9, Class 6000=6 (cap_sw dahil)
--
-- 3) Spot check (DN 50 90SW Class 3000):
--    SELECT parca_tipi, cap_buyuk_dn, class_no, et_mm, ucu_uca_a_mm,
--           soket_derinlik_mm, soket_ic_cap_mm
--    FROM fitting_olculer
--    WHERE geometri_std = 'ASME B16.11' AND parca_tipi = '90SW'
--      AND cap_buyuk_dn = 50 AND class_no = 3000;
--    Beklenen: et_mm=5.55, A=38.0, J=16, B=61.35
--
-- 4) cap_sw notlar JSON kontrolu:
--    SELECT cap_buyuk_dn, class_no, notlar::jsonb -> 'cap_dia_mm' AS r
--    FROM fitting_olculer
--    WHERE geometri_std = 'ASME B16.11' AND parca_tipi = 'cap_sw'
--    ORDER BY class_no, cap_buyuk_dn;
--    Beklenen: 15 satir, R degerleri tabloya gore
-- ============================================================================
