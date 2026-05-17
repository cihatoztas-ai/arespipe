-- migrations/077_din_86037_2_en_1092_3_cuni_flanslari.sql
-- AresPipe 94. oturum — DIN 86037-2 WN + EN 1092-3 Type 05-C Composite Blind CuNi flanslari
--
-- Kaynak: KME Special Products GmbH "OSNA-10/30 Shipbuilding" katalogu
--         (Kasim 2018, dok. no. 1220.000.0508), sayfa 17 + sayfa 19
--         MD5: 0f7f1cac4c80da882c799a19c2d38cd8 (Migration 076 ile ayni PDF)
--
-- Malzeme: OSNA-10 (CuNi 90/10, UNS C70600). Composite Blind ek halka: A105 / P245GH (EN 10222-2)
-- Kullanim: Gemi tersanesi, deniz suyu sistemleri (yangin, sogutma, balast)
--
-- Yapilan ekleme: flansh_olculer 48 satir
--   - WN (Welding Neck, DIN 86037-2):           29 satir  (DN20-DN1200, PN10/16 compatible)
--   - Composite Blind (EN 1092-3 Type 05-C):    19 satir  (DN10-DN500, PN16 0-175 + PN10 200-500)
--
-- Vocabulary kararlari (94. oturumda kontrol edildi):
--   - standart, geometri_std: 'DIN-86037-2' ve 'EN-1092-3'
--   - flansh_tipi: 'WN' (KME terminolojisi) ve 'EN-T05' (EN Type 05 = Blind, mevcut desen)
--   - basinc_sinifi WN: 'PN10/16' (composite design, outer flansh ile birlikte)
--   - basinc_sinifi BL: '10' veya '16' (DN'ye gore tek deger)
--   - yuzey_tipi: 'RF' (mevcut desen)
--   - malzeme_grubu: 'cunife' (UI fix sonrasi tutarli)
--   - bolt_holes_inch: mm formatinda ('14mm', '18mm', '22mm', '26mm', '30mm', '33mm') — kolon adi yaniltici ama veri orijinal
--
-- Fiziksel dogrulama (Python sanity check, programatik):
--   - WN: d3 (bore) < cap_mm (OD) < d2 (hub OD) < d4 (flansh OD) — ice genisleme: 29/29 ✓
--   - BL: d1 (welded zone) < k (bolt circle) < D (flansh OD) — bolt_count >= 4: 19/19 ✓
--   - Tum agirliklar pozitif, tum boyutlar tutarli

BEGIN;

INSERT INTO flansh_olculer (
  standart, malzeme_grubu, sistem_preset, tenant_id,
  geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi,
  cap_nps, cap_dn, cap_mm,
  flansh_od_mm, flansh_kalinlik_mm,
  hub_od_mm, hub_uzunluk_mm,
  bore_min_mm, bore_std_mm,
  socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm,
  bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch,
  bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm,
  agirlik_kg,
  notlar, aktif
) VALUES
-- ----- WN FLANSH (DIN 86037-2, 29 satir) -----
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '3/4', 20, 25, 58, 5, 27, 40, NULL, 22, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.15, 'KME OSNA-10/30 Welding Neck (boru et S=1.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '3/4', 20, 25, 58, 5, 27, 40, NULL, 21, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.16, 'KME OSNA-10/30 Welding Neck (boru et S=2mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '1', 25, 30, 68, 5, 32, 40, NULL, 27, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.2, 'KME OSNA-10/30 Welding Neck (boru et S=1.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '1', 25, 30, 68, 5, 32, 40, NULL, 26, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.21, 'KME OSNA-10/30 Welding Neck (boru et S=2mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '1 1/4', 32, 38, 78, 5, 40, 40, NULL, 35, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.25, 'KME OSNA-10/30 Welding Neck (boru et S=1.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '1 1/4', 32, 38, 78, 5, 40, 40, NULL, 34, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.27, 'KME OSNA-10/30 Welding Neck (boru et S=2mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '1 1/2', 40, 44.5, 88, 6, 46.5, 45, NULL, 41.5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.36, 'KME OSNA-10/30 Welding Neck (boru et S=1.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '1 1/2', 40, 44.5, 88, 6, 46.5, 45, NULL, 40.5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.38, 'KME OSNA-10/30 Welding Neck (boru et S=2mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '2', 50, 57, 102, 6, 59, 45, NULL, 54, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.45, 'KME OSNA-10/30 Welding Neck (boru et S=1.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '2', 50, 57, 102, 6, 59, 45, NULL, 53, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.48, 'KME OSNA-10/30 Welding Neck (boru et S=2mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '2 1/2', 65, 76, 122, 6, 78, 45, NULL, 72, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.62, 'KME OSNA-10/30 Welding Neck (boru et S=2mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '3', 80, 89, 138, 7, 91, 50, NULL, 85, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.86, 'KME OSNA-10/30 Welding Neck (boru et S=2mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '4', 100, 108, 158, 7, 110, 50, NULL, 103, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1.1, 'KME OSNA-10/30 Welding Neck (boru et S=2.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '5', 125, 133, 188, 7, 135.5, 50, NULL, 128, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1.5, 'KME OSNA-10/30 Welding Neck (boru et S=2.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '6', 150, 159, 212, 9, 161.5, 50, NULL, 154, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2.0, 'KME OSNA-10/30 Welding Neck (boru et S=2.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '7', 175, 194, 242, 9, 197, 50, NULL, 188, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2.4, 'KME OSNA-10/30 Welding Neck (boru et S=3mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '8', 200, 219, 268, 9, 222, 50, NULL, 213, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2.7, 'KME OSNA-10/30 Welding Neck (boru et S=3mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '10', 250, 267, 320, 9, 270, 50, NULL, 261, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3.4, 'KME OSNA-10/30 Welding Neck (boru et S=3mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '12', 300, 324, 370, 11, 327, 50, NULL, 316, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.6, 'KME OSNA-10/30 Welding Neck (boru et S=4mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '14', 350, 368, 430, 11, 371, 50, NULL, 360, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6.3, 'KME OSNA-10/30 Welding Neck (boru et S=4mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '16', 400, 419, 482, 12, 422, 50, NULL, 411, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 7.5, 'KME OSNA-10/30 Welding Neck (boru et S=4mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '18', 450, 457, 530, 12, 460, 50, NULL, 449, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 9.0, 'KME OSNA-10/30 Welding Neck (boru et S=4mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '20', 500, 508, 585, 12, 511, 50, NULL, 499, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 11.0, 'KME OSNA-10/30 Welding Neck (boru et S=4.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '24', 600, 610, 685, 14, 613, 60, NULL, 601, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 15.0, 'KME OSNA-10/30 Welding Neck (boru et S=4.5mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '28', 700, 711, 800, 14, 714, 60, NULL, 699, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 21.0, 'KME OSNA-10/30 Welding Neck (boru et S=6mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '32', 800, 813, 905, 14, 816, 60, NULL, 801, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 24.0, 'KME OSNA-10/30 Welding Neck (boru et S=6mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '36', 900, 914, 1000, 14, 918, 60, NULL, 898, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 29.0, 'KME OSNA-10/30 Welding Neck (boru et S=8mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '40', 1000, 1016, 1110, 14, 1018, 60, NULL, 1000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 34.0, 'KME OSNA-10/30 Welding Neck (boru et S=8mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('DIN-86037-2', 'cunife', true, NULL, 'DIN-86037-2', 'WN', 'PN10/16', 'RF', '48', 1200, 1220, 1335, 14, 1223.5, 60, NULL, 1204, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 46.0, 'KME OSNA-10/30 Welding Neck (boru et S=8mm), DIN 86037-2 lap-joint style, PN10/16 outer flansh ile uyumlu | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),

-- ----- COMPOSITE BLIND FLANSH (EN 1092-3 Type 05-C, 19 satir) -----
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '3/8', 10, 15, 90, 14, NULL, NULL, NULL, NULL, NULL, 41, NULL, 60, 4, '14mm', NULL, NULL, NULL, 0.69, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '1/2', 15, 18, 95, 14, NULL, NULL, NULL, NULL, NULL, 46, NULL, 65, 4, '14mm', NULL, NULL, NULL, 0.78, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '3/4', 20, 25, 105, 14, NULL, NULL, NULL, NULL, NULL, 56, NULL, 75, 4, '14mm', NULL, NULL, NULL, 0.99, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '1', 25, 30, 115, 16, NULL, NULL, NULL, NULL, NULL, 65, NULL, 85, 4, '14mm', NULL, NULL, NULL, 1.38, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '1 1/4', 32, 38, 140, 16, NULL, NULL, NULL, NULL, NULL, 76, NULL, 100, 4, '18mm', NULL, NULL, NULL, 1.99, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '1 1/2', 40, 44.5, 150, 16, NULL, NULL, NULL, NULL, NULL, 84, NULL, 115, 4, '18mm', NULL, NULL, NULL, 2.32, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '2', 50, 57, 165, 16, NULL, NULL, NULL, NULL, NULL, 99, NULL, 125, 4, '18mm', NULL, NULL, NULL, 2.89, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '2 1/2', 65, 76, 185, 16, NULL, NULL, NULL, NULL, NULL, 118, NULL, 145, 4, '18mm', NULL, NULL, NULL, 3.72, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '3', 80, 89, 200, 18, NULL, NULL, NULL, NULL, NULL, 132, NULL, 160, 8, '18mm', NULL, NULL, NULL, 4.76, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '4', 100, 108, 220, 18, NULL, NULL, NULL, NULL, NULL, 156, NULL, 180, 8, '18mm', NULL, NULL, NULL, 5.94, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '5', 125, 133, 250, 18, NULL, NULL, NULL, NULL, NULL, 184, NULL, 210, 8, '18mm', NULL, NULL, NULL, 7.83, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '6', 150, 159, 285, 18, NULL, NULL, NULL, NULL, NULL, 211, NULL, 240, 8, '22mm', NULL, NULL, NULL, 10.15, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '16', 'RF', '7', 175, 194, 315, 22, NULL, NULL, NULL, NULL, NULL, 242, NULL, 270, 8, '22mm', NULL, NULL, NULL, 14.97, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN16, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '10', 'RF', '8', 200, 219, 340, 22, NULL, NULL, NULL, NULL, NULL, 266, NULL, 295, 12, '22mm', NULL, NULL, NULL, 17.37, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN10, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '10', 'RF', '10', 250, 267, 405, 24, NULL, NULL, NULL, NULL, NULL, 319, NULL, 350, 12, '26mm', NULL, NULL, NULL, 26.64, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN10, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '10', 'RF', '12', 300, 324, 460, 28, NULL, NULL, NULL, NULL, NULL, 370, NULL, 400, 12, '26mm', NULL, NULL, NULL, 39.93, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN10, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '10', 'RF', '14', 350, 368, 520, 30, NULL, NULL, NULL, NULL, NULL, 429, NULL, 460, 16, '26mm', NULL, NULL, NULL, 54.47, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN10, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '10', 'RF', '16', 400, 419, 580, 36, NULL, NULL, NULL, NULL, NULL, 480, NULL, 515, 16, '30mm', NULL, NULL, NULL, 79.52, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN10, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true),
  ('EN-1092-3', 'cunife', true, NULL, 'EN-1092-3', 'EN-T05', '10', 'RF', '20', 500, 508, 715, 36, NULL, NULL, NULL, NULL, NULL, 606, NULL, 650, 20, '33mm', NULL, NULL, NULL, 121.51, 'KME OSNA-10/30 Composite Blind, CuNi disc + A105/P245GH celik halka kompozit, PN10, EN 1092-3 Type 05-C | Kaynak: KME Shipbuilding catalog (Nov 2018, 1220.000.0508)', true);

-- ===========================================================================
-- DOGRULAMA SORGULARI (opsiyonel)
-- ===========================================================================

-- Toplam 48 satir mi?
-- SELECT standart, flansh_tipi, COUNT(*) FROM flansh_olculer
-- WHERE standart IN ('DIN-86037-2','EN-1092-3') GROUP BY 1,2 ORDER BY 1,2;
-- Beklenen: DIN-86037-2 WN 29 + EN-1092-3 EN-T05 19

-- Geometrik sanity (DB-side check):
-- SELECT COUNT(*) FROM flansh_olculer
-- WHERE standart = 'DIN-86037-2' AND NOT (bore_std_mm < cap_mm AND cap_mm < hub_od_mm AND hub_od_mm < flansh_od_mm);
-- Beklenen: 0

-- Composite BL bolt count >= 4
-- SELECT MIN(bolt_count), MAX(bolt_count) FROM flansh_olculer WHERE standart = 'EN-1092-3';
-- Beklenen: min 4, max 20

COMMIT;
