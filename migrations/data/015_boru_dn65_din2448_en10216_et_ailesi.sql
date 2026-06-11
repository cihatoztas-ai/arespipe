-- migrations/015_boru_dn65_din2448_en10216_et_ailesi.sql
-- AresPipe — DN65 DIN 2448 + EN 10216-1 et ailesi tamamlanması
-- Tetik: 43. oturum, Cihat IFS pilot kaydı yapıştırdı:
--   "Pipe Seamless Steel Tube - 3.1 Certificate, Karbon Çelik St 37,
--    76.1 mm × 4.5 mm × 2823.2 mm × 22.43 kg"
-- Sistem 4.5 mm'i tanımıyordu. Hesap: 22.43/2.8232 = 7.946 kg/m → DIN 2448 doğrulandı.
-- Aynı oturumda DN65 yaygın et ailesi (4.0, 4.5, 5.0, 5.6, 7.1) tamamlanır.
--
-- DIN 2448 ve EN 10216-1 paralel — geometri aynı (OD 76.1, et değerleri),
-- sadece malzeme spec adı farklı. Türk tersanesi ikisini de görüyor.
--
-- Ağırlık formülü teyit: π × (OD - et) × et × ρ_çelik / 1000  (ρ = 7.85 g/cm³)
--   ET 4.0: π × 72.1 × 4.0 × 7.85 / 1000 = 7.110 kg/m
--   ET 4.5: π × 71.6 × 4.5 × 7.85 / 1000 = 7.946 kg/m  ← Cihat IFS kaydı
--   ET 5.0: π × 71.1 × 5.0 × 7.85 / 1000 = 8.764 kg/m
--   ET 5.6: π × 70.5 × 5.6 × 7.85 / 1000 = 9.732 kg/m
--   ET 7.1: π × 69.0 × 7.1 × 7.85 / 1000 = 12.078 kg/m
--
-- Idempotent: tekrar çalıştırılırsa ikilemez.
-- ic_cap_mm, hacim_l_m, yuzey_alan_dis_m2_m kolonları GENERATED — INSERT'te yazılmaz.

BEGIN;

INSERT INTO boru_olculer (
  standart, malzeme_grubu, dn,
  schedule_tipi, schedule_deger, schedule_kod,
  dis_cap_mm, et_mm, agirlik_kg_m,
  urun_formu, kaynak, notlar
)
SELECT v.* FROM (VALUES
  -- ============================================================
  -- DIN 2448 — 5 yeni et değeri
  -- ============================================================
  ('DIN-2448', 'karbon', 65, 'ET', '4.0', 'ET4.0',
   76.100::numeric, 4.000::numeric, 7.110::numeric,
   'boru', 'DIN 2448 yaygın et serisi',
   'DN65 et ailesi tamamlanması (43. oturum)'),
  ('DIN-2448', 'karbon', 65, 'ET', '4.5', 'ET4.5',
   76.100::numeric, 4.500::numeric, 7.946::numeric,
   'boru', 'DIN 2448 yaygın et serisi',
   'IFS pilot kaydı eşleşmesi: Pipe Seamless 76.1×4.5 St37 (43. oturum)'),
  ('DIN-2448', 'karbon', 65, 'ET', '5.0', 'ET5.0',
   76.100::numeric, 5.000::numeric, 8.764::numeric,
   'boru', 'DIN 2448 yaygın et serisi',
   'DN65 et ailesi tamamlanması (43. oturum)'),
  ('DIN-2448', 'karbon', 65, 'ET', '5.6', 'ET5.6',
   76.100::numeric, 5.600::numeric, 9.732::numeric,
   'boru', 'DIN 2448 yaygın et serisi',
   'DN65 et ailesi tamamlanması (43. oturum)'),
  ('DIN-2448', 'karbon', 65, 'ET', '7.1', 'ET7.1',
   76.100::numeric, 7.100::numeric, 12.078::numeric,
   'boru', 'DIN 2448 yaygın et serisi',
   'DN65 et ailesi tamamlanması (43. oturum)'),
  -- ============================================================
  -- EN 10216-1 — paralel (eşdeğer geometri)
  -- ============================================================
  ('EN-10216-1', 'karbon', 65, 'ET', '4.0', 'ET4.0',
   76.100::numeric, 4.000::numeric, 7.110::numeric,
   'boru', 'EN 10216-1 yaygın et serisi',
   'DN65 et ailesi tamamlanması (43. oturum)'),
  ('EN-10216-1', 'karbon', 65, 'ET', '4.5', 'ET4.5',
   76.100::numeric, 4.500::numeric, 7.946::numeric,
   'boru', 'EN 10216-1 yaygın et serisi',
   'DIN 2448 paralelinde, IFS pilot kaydı (43. oturum)'),
  ('EN-10216-1', 'karbon', 65, 'ET', '5.0', 'ET5.0',
   76.100::numeric, 5.000::numeric, 8.764::numeric,
   'boru', 'EN 10216-1 yaygın et serisi',
   'DN65 et ailesi tamamlanması (43. oturum)'),
  ('EN-10216-1', 'karbon', 65, 'ET', '5.6', 'ET5.6',
   76.100::numeric, 5.600::numeric, 9.732::numeric,
   'boru', 'EN 10216-1 yaygın et serisi',
   'DN65 et ailesi tamamlanması (43. oturum)'),
  ('EN-10216-1', 'karbon', 65, 'ET', '7.1', 'ET7.1',
   76.100::numeric, 7.100::numeric, 12.078::numeric,
   'boru', 'EN 10216-1 yaygın et serisi',
   'DN65 et ailesi tamamlanması (43. oturum)')
) AS v(
  standart, malzeme_grubu, dn,
  schedule_tipi, schedule_deger, schedule_kod,
  dis_cap_mm, et_mm, agirlik_kg_m,
  urun_formu, kaynak, notlar
)
WHERE NOT EXISTS (
  SELECT 1 FROM boru_olculer b
  WHERE b.standart = v.standart
    AND b.dn       = v.dn
    AND b.et_mm    = v.et_mm
);

COMMIT;

-- ============================================================
-- Doğrulama 1: DN65 DIN/EN tam liste — beklenen 14 satır (DIN 7 + EN 7)
-- ============================================================
SELECT standart, schedule_kod, dis_cap_mm, et_mm, agirlik_kg_m,
       ROUND(agirlik_kg_m * 2.8232, 2) AS hesap_2823_2mm_kg
FROM boru_olculer
WHERE dn = 65 AND standart IN ('DIN-2448', 'EN-10216-1')
ORDER BY standart, et_mm;

-- ============================================================
-- Doğrulama 2: Cihat IFS kaydı eşleşme testi — 76.1 × 4.5 satırı
-- ============================================================
SELECT standart, dn, schedule_kod, dis_cap_mm, et_mm, agirlik_kg_m, ic_cap_mm,
       ROUND(agirlik_kg_m * 2.8232, 2) AS pilot_2823_2mm_kg,
       CASE WHEN ROUND(agirlik_kg_m * 2.8232, 2) BETWEEN 22.40 AND 22.46
            THEN '✓ EŞLEŞTI (Cihat 22.43 kg)'
            ELSE '⚠ FARK VAR' END AS pilot_test
FROM boru_olculer
WHERE dn = 65 AND dis_cap_mm = 76.100 AND et_mm = 4.500
ORDER BY standart;
