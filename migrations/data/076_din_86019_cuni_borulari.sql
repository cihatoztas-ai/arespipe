-- migrations/076_din_86019_cuni_borulari.sql
-- AresPipe 94. oturum — DIN 86019 / DIN EN 12449 CuNi gemi borularinin kutuphaneye yuklenmesi
--
-- Kaynak: KME Special Products GmbH "OSNA-10/30 Shipbuilding" katalogu
--         (Kasim 2018, dok. no. 1220.000.0508), sayfa 4
--         MD5: 0f7f1cac4c80da882c799a19c2d38cd8
--
-- Malzeme: OSNA-10 (CuNi 90/10, UNS C70600) ve OSNA-30 (CuNi 70/30, UNS C71500)
-- Kullanim: Gemi tersanesi, deniz suyu sistemleri (yangin, sogutma, balast)
--
-- Yapilan ekleme:
--   1) boru_standart_sozluk: 1 satir (DIN-86019)
--   2) boru_olculer: 44 satir
--      - Seamless Standard wall: 22 satir
--      - Seamless Special wall:  17 satir
--      - Seamwelded:              5 satir
--
-- Fiziksel dogrulama (PDF context vs disk extraction + implicit density):
--   pi x (OD - S) x S x rho / 1000 = kg/m
--   Ortalama yogunluk:  8.919 g/cm³  (DIN nominal ~8.9)
--   Std sapma:          0.038
--   Min - Max:          8.842 - 9.095
--   Tum 44 satir 8.7-9.1 toleransi icinde ✓
--
-- Cihat onayı: 5 ornek satir SQL ile yogunluk hesaplamasiyla teyit edildi (94. oturum).

BEGIN;

-- ===========================================================================
-- 1) SOZLUK GIRISI
-- ===========================================================================

INSERT INTO boru_standart_sozluk (
  standart, ad, ulke, olcu_sistemi, dn_sistemi, malzeme_grubu_default,
  materyal_kodu_listesi, pdf_anahtar_kelime,
  son_edisyon_yili, son_edisyon_tarihi,
  slug, aciklama_tr, aciklama_en,
  kullanim_sektor, aktif, veri_var
) VALUES (
  'DIN-86019',
  'DIN 86019 — Seamless Tubes Made of CuNi10Fe1,6Mn for Shipbuilding (Standard and Precision Tubes) + DIN EN 12449',
  'DE',
  'metric',
  'NPS',
  'cunife',
  '["CuNi10Fe1Mn", "CuNi10Fe1.6Mn", "C70600", "C71500", "WL 2.1972", "CW352H", "CW354H", "UNS C7060X", "UNS C71520"]'::jsonb,
  ARRAY['DIN 86019', '86019', 'DIN EN 12449', 'EN 12449', 'CuNi10Fe', 'CuNi 90/10', 'CuNi 70/30', 'OSNA-10', 'OSNA-30']::text[],
  2006,
  '2006-02-01',
  'din-86019',
  'Alman gemi insa standardi. CuNi10Fe1,6Mn (90/10) ve CuNi 70/30 malzemeli dikissiz ve dikisli boru olculeri. Deniz suyu sistemlerinde (yangin, sogutma, balast) yaygin. ASTM B466/B467, EEMUA 234/1-2, MIL-T-16420 K, DEF STAN 02-779 (NES 779) ile esdeger.',
  'German shipbuilding standard. Seamless and seamwelded tube dimensions for CuNi 90/10 and CuNi 70/30 alloys. Widely used in seawater piping systems (firewater, cooling, ballast). Equivalent to ASTM B466/B467, EEMUA 234/1-2, MIL-T-16420 K, DEF STAN 02-779 (NES 779).',
  ARRAY['tersane', 'denizcilik', 'offshore']::text[],
  true,
  true
);


-- ===========================================================================
-- 2) BORU OLCULERI (44 satir)
--    - Seamless Standard wall: 22 satir
--    - Seamless Special wall:  17 satir
--    - Seamwelded:              5 satir
-- ===========================================================================

INSERT INTO boru_olculer (
  standart, malzeme_grubu, dn,
  schedule_tipi, schedule_deger, schedule_kod,
  dis_cap_mm, et_mm, agirlik_kg_m,
  tolerans_et_yuzde, tolerans_agirlik_yuzde,
  edisyon_yili, gecerlilik_basla,
  kaynak, notlar,
  urun_formu, tenant_id, sistem_preset
) VALUES
-- ----- SEAMLESS STANDARD WALL (22 satir) -----
  ('DIN-86019', 'cunife', 4, 'ET', '1.0', 'ET1.0', 8, 1.0, 0.2, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'DN-only (NPS belirtilmemis), Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 6, 'ET', '1.0', 'ET1.0', 10, 1.0, 0.25, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1/8, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 8, 'ET', '1.0', 'ET1.0', 12, 1.0, 0.31, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1/4, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 12, 'ET', '1.0', 'ET1.0', 16, 1.0, 0.42, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 3/8, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 16, 'ET', '1.0', 'ET1.0', 20, 1.0, 0.53, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1/2, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 20, 'ET', '1.5', 'ET1.5', 25, 1.5, 0.99, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 3/4, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 25, 'ET', '1.5', 'ET1.5', 30, 1.5, 1.2, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 32, 'ET', '1.5', 'ET1.5', 38, 1.5, 1.53, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1 1/4, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 40, 'ET', '1.5', 'ET1.5', 44.5, 1.5, 1.8, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1 1/2, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 50, 'ET', '1.5', 'ET1.5', 57, 1.5, 2.33, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 2, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 65, 'ET', '2.0', 'ET2.0', 76, 2.0, 4.14, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 2 1/2, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 80, 'ET', '2.0', 'ET2.0', 88.9, 2.0, 4.87, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 3, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 100, 'ET', '2.5', 'ET2.5', 108, 2.5, 7.37, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 4, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 125, 'ET', '2.5', 'ET2.5', 133, 2.5, 9.12, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 5, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 150, 'ET', '2.5', 'ET2.5', 159, 2.5, 10.93, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 6, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 175, 'ET', '3.0', 'ET3.0', 194, 3.0, 16.01, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 7, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 200, 'ET', '3.0', 'ET3.0', 219.1, 3.0, 18.12, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 8, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 250, 'ET', '3.0', 'ET3.0', 267, 3.0, 22.13, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 10, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 300, 'ET', '4.0', 'ET4.0', 323.9, 4.0, 35.8, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 12, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 350, 'ET', '4.0', 'ET4.0', 368, 4.0, 40.7, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 14, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 400, 'ET', '4.0', 'ET4.0', 419, 4.0, 46.4, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 16, Seamless Standard wall', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 450, 'ET', '4.5', 'ET4.5', 457, 4.5, 57.48, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 18, Seamless Standard wall', 'boru', NULL, true),

-- ----- SEAMLESS SPECIAL WALL (17 satir) -----
  ('DIN-86019', 'cunife', 12, 'ET', '1.5', 'ET1.5', 16, 1.5, 0.61, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 3/8, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 16, 'ET', '1.5', 'ET1.5', 20, 1.5, 0.78, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1/2, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 20, 'ET', '2.0', 'ET2.0', 25, 2.0, 1.29, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 3/4, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 25, 'ET', '2.0', 'ET2.0', 30, 2.0, 1.57, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 32, 'ET', '2.0', 'ET2.0', 38, 2.0, 2.01, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1 1/4, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 40, 'ET', '2.0', 'ET2.0', 44.5, 2.0, 2.38, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 1 1/2, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 50, 'ET', '2.0', 'ET2.0', 57, 2.0, 3.08, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 2, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 65, 'ET', '2.5', 'ET2.5', 76, 2.5, 5.18, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 2 1/2, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 80, 'ET', '2.5', 'ET2.5', 88.9, 2.5, 6.09, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 3, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 100, 'ET', '3.0', 'ET3.0', 108, 3.0, 8.84, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 4, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 125, 'ET', '3.0', 'ET3.0', 133, 3.0, 10.94, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 5, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 150, 'ET', '3.0', 'ET3.0', 159, 3.0, 13.08, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 6, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 200, 'ET', '3.5', 'ET3.5', 219.1, 3.5, 21.12, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 8, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 250, 'ET', '4.0', 'ET4.0', 267, 4.0, 29.47, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 10, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 300, 'ET', '5.0', 'ET5.0', 323.9, 5.0, 44.75, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 12, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 350, 'ET', '5.5', 'ET5.5', 368, 5.5, 55.96, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 14, Seamless Special wall (artirilmis et)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 400, 'ET', '6.0', 'ET6.0', 419, 6.0, 69.6, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 16, Seamless Special wall (artirilmis et)', 'boru', NULL, true),

-- ----- SEAMWELDED (5 satir, OD ozel boyut) -----
  ('DIN-86019', 'cunife', 500, 'ET', '5.0', 'ET5.0', 508, 5.0, 70.32, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 20, Seamwelded (boyuna kaynakli, OD ozel boyut)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 600, 'ET', '5.0', 'ET5.0', 610, 5.0, 84.56, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 24, Seamwelded (boyuna kaynakli, OD ozel boyut)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 700, 'ET', '6.0', 'ET6.0', 711, 6.0, 118.28, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 28, Seamwelded (boyuna kaynakli, OD ozel boyut)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 800, 'ET', '6.0', 'ET6.0', 813, 6.0, 135.38, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 32, Seamwelded (boyuna kaynakli, OD ozel boyut)', 'boru', NULL, true),
  ('DIN-86019', 'cunife', 900, 'ET', '8.0', 'ET8.0', 914, 8.0, 202.66, 10, 1.5, 2006, '2006-02-01', 'KME OSNA-10/30 Shipbuilding (Nov 2018, 1220.000.0508), DIN 86019 / DIN EN 12449', 'NPS 36, Seamwelded (boyuna kaynakli, OD ozel boyut)', 'boru', NULL, true);


-- ===========================================================================
-- 3) DOGRULAMA SORGULARI (opsiyonel, log icin)
-- ===========================================================================

-- Sozluk girisi var mi?
-- SELECT standart, ad, son_edisyon_yili, veri_var FROM boru_standart_sozluk WHERE standart = 'DIN-86019';

-- Olcu sayisi 44 mu?
-- SELECT COUNT(*) AS toplam FROM boru_olculer WHERE standart = 'DIN-86019';
-- Beklenen: 44

-- Wall type dagilimi:
-- SELECT
--   CASE
--     WHEN dn IN (500,600,700,800,900) THEN 'Seamwelded'
--     WHEN notlar LIKE '%Special%' THEN 'Special'
--     ELSE 'Standard'
--   END AS tip,
--   COUNT(*)
-- FROM boru_olculer
-- WHERE standart = 'DIN-86019'
-- GROUP BY 1
-- ORDER BY 1;
-- Beklenen: Seamwelded 5, Special 17, Standard 22

-- Fizik dogrulamasi (yogunluk implicit):
-- SELECT
--   dn, dis_cap_mm AS od, et_mm AS s, agirlik_kg_m AS kg_m,
--   ROUND((agirlik_kg_m * 1000 / (PI() * (dis_cap_mm - et_mm) * et_mm))::numeric, 3) AS rho_g_cm3
-- FROM boru_olculer
-- WHERE standart = 'DIN-86019'
-- ORDER BY dn, et_mm;
-- Beklenen: tum satirlar 8.7-9.1 bandinda, ortalama ~8.92

COMMIT;
