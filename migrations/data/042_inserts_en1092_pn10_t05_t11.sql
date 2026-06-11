-- ============================================================
-- 042 — flansh_olculer'a EN 1092-1 PN 10 Type 11 + Type 05 INSERT'leri
-- ============================================================
-- 8 satır Type 11 (Weld Neck) + 8 satır Type 05 (Blind) = 16 toplam
-- DN 200 – DN 600 (gemi sektörü deniz suyu büyük çap = P0)
-- malzeme_id: ASTM A105 FK ile dolu doğdu (B0 omurgası ilk gerçek kullanım)
--
-- Kaynak (geometri T11):    Wermac dim_wn_flg_pn10.html
-- Kaynak (geometri T05):    ProjectMaterials EN 1092-1 Type 05 PN 10 sayfası
-- Cross-check:              Wermac PN 10 T11 + PM PN 10 T11 + PM PN 10 T05
-- Kaynak (bolt):            Wermac PN 10 (bolt detayı 3. tablo)
-- Edisyon:                  EN 1092-1:2007+A1:2013
-- Üretim:                   AresPipe kütüphane mini-projesi, 77. oturum (12 May 2026)
--
-- NEDEN DN 10-150 YOK:
--   RoyMech BSEN1092 PN 10 sayfası mevcut değil (PN 16/25/40 var, PN 10 yok).
--   76. oturumda RoyMech kaynak alındı, PN 16 paketi RoyMech ile birebir.
--   PN 10 küçük DN için çift kaynak doğrulaması yapılamıyor:
--     - Wermac PN 10 K kolonu Type 11 thickness verir
--     - RoyMech PN 16 küçük DN'lerde Wermac PN 16'dan FARKLI (DN 10 K=16 vs C2=14)
--     - Yani Wermac ile RoyMech küçük DN'lerde edisyon/yorum farkı var
--   Bu yüzden DN 10-150 PN 10 → 78. oturuma ertelendi (RoyMech BS4504 PN 10
--   alternatif kaynak araştırması).
--
-- NEDEN SADECE T11 + T05:
--   T01 (Plate SO) ve T12 (Hubbed SO) PN 10 büyük DN için ProjectMaterials/Wermac
--   detay vermiyor. T05/T11 yaygın (deniz suyu hatları, drenaj, soğuk su).
--   T01/T12 → 78. oturum.
--
-- KRİTİK GÖZLEM — DN 600 T05 vs T11:
--   T11 b = 30 mm (Weld Neck — pressure sadece bore alanında)
--   T05 b = 34 mm (Blind — full face pressure → daha kalın gerekir)
--   Bu standart bilgi, PM kaynağında doğrulu. DN 200-500'de T05=T11, DN 600 farklı.
--
-- DN 600 T05 TEK KAYNAK NOTU:
--   T05 DN 200-500 → Wermac PN 10 T11 K kolonu ile birebir cross-check ✓
--   T05 DN 600 → PM tek kaynak (b=34). Wermac PN 10 Blind sayfası yok.
--   Risk: 1-2 mm sapma olabilir, fakat PM authoritative; post-validation Cihat onayı.
--
-- IDEMPOTENT:
--   Doğal anahtar: (geometri_std, flansh_tipi, basinc_sinifi, cap_dn, sistem_preset)
-- ============================================================

BEGIN;

-- A105 malzeme_id'sini bir kez al, alt sorgularda tekrarsız kullan
-- (Migration sırasında değişmediği için CTE yerine inline subquery güvenli)

-- ---------- Type 11 (Weld Neck) — 8 satır ----------

-- DN 200
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', '10', 'RF', NULL, 200, 219.1, 340.0, 24.0, 234.0, 62.0, NULL, NULL, NULL, 268.0, 3.0, 295.0, 8, '22mm', 'M20', 95.0, 75.0, NULL, NULL, '{"kaynak_geometri": "Wermac dim_wn_flg_pn10.html", "kaynak_crosscheck": "ProjectMaterials EN 1092-1 Type 11 PN 10", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Weld Neck Flange (long tapered hub, butt-weld to pipe)", "olculer_detay": {"neck_root_dia_mm": 234.0, "neck_thickness_mm": 6.3, "corner_radius_mm": 10.0, "neck_length_mm": 16.0, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 219.1, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Weld neck flanşlar gemi tersanesinde deniz suyu büyük çap (DN 200+) için PN 10 standartıdır."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='10' AND cap_dn=200 AND sistem_preset=TRUE
  );

-- DN 250
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', '10', 'RF', NULL, 250, 273.0, 395.0, 26.0, 292.0, 68.0, NULL, NULL, NULL, 320.0, 3.0, 350.0, 12, '22mm', 'M20', 100.0, 80.0, NULL, NULL, '{"kaynak_geometri": "Wermac dim_wn_flg_pn10.html", "kaynak_crosscheck": "ProjectMaterials EN 1092-1 Type 11 PN 10", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Weld Neck Flange (long tapered hub, butt-weld to pipe)", "olculer_detay": {"neck_root_dia_mm": 292.0, "neck_thickness_mm": 6.3, "corner_radius_mm": 12.0, "neck_length_mm": 16.0, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 273.0, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Weld neck flanşlar gemi tersanesinde deniz suyu büyük çap (DN 200+) için PN 10 standartıdır."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='10' AND cap_dn=250 AND sistem_preset=TRUE
  );

-- DN 300
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', '10', 'RF', NULL, 300, 323.9, 445.0, 26.0, 342.0, 68.0, NULL, NULL, NULL, 370.0, 4.0, 400.0, 12, '22mm', 'M20', 100.0, 80.0, NULL, NULL, '{"kaynak_geometri": "Wermac dim_wn_flg_pn10.html", "kaynak_crosscheck": "ProjectMaterials EN 1092-1 Type 11 PN 10", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Weld Neck Flange (long tapered hub, butt-weld to pipe)", "olculer_detay": {"neck_root_dia_mm": 342.0, "neck_thickness_mm": 7.1, "corner_radius_mm": 12.0, "neck_length_mm": 16.0, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 323.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Weld neck flanşlar gemi tersanesinde deniz suyu büyük çap (DN 200+) için PN 10 standartıdır."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='10' AND cap_dn=300 AND sistem_preset=TRUE
  );

-- DN 350
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', '10', 'RF', NULL, 350, 355.6, 505.0, 26.0, 385.0, 68.0, NULL, NULL, NULL, 430.0, 4.0, 460.0, 16, '22mm', 'M20', 100.0, 80.0, NULL, NULL, '{"kaynak_geometri": "Wermac dim_wn_flg_pn10.html", "kaynak_crosscheck": "ProjectMaterials EN 1092-1 Type 11 PN 10", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Weld Neck Flange (long tapered hub, butt-weld to pipe)", "olculer_detay": {"neck_root_dia_mm": 385.0, "neck_thickness_mm": 7.1, "corner_radius_mm": 12.0, "neck_length_mm": 16.0, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 355.6, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Weld neck flanşlar gemi tersanesinde deniz suyu büyük çap (DN 200+) için PN 10 standartıdır."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='10' AND cap_dn=350 AND sistem_preset=TRUE
  );

-- DN 400
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', '10', 'RF', NULL, 400, 406.4, 565.0, 26.0, 440.0, 72.0, NULL, NULL, NULL, 482.0, 4.0, 515.0, 16, '26mm', 'M24', 110.0, 85.0, NULL, NULL, '{"kaynak_geometri": "Wermac dim_wn_flg_pn10.html", "kaynak_crosscheck": "ProjectMaterials EN 1092-1 Type 11 PN 10", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Weld Neck Flange (long tapered hub, butt-weld to pipe)", "olculer_detay": {"neck_root_dia_mm": 440.0, "neck_thickness_mm": 7.1, "corner_radius_mm": 12.0, "neck_length_mm": 16.0, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 406.4, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Weld neck flanşlar gemi tersanesinde deniz suyu büyük çap (DN 200+) için PN 10 standartıdır."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='10' AND cap_dn=400 AND sistem_preset=TRUE
  );

-- DN 450
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', '10', 'RF', NULL, 450, 457.0, 615.0, 28.0, 488.0, 72.0, NULL, NULL, NULL, 532.0, 4.0, 565.0, 20, '26mm', 'M24', 110.0, 90.0, NULL, NULL, '{"kaynak_geometri": "Wermac dim_wn_flg_pn10.html", "kaynak_crosscheck": "ProjectMaterials EN 1092-1 Type 11 PN 10", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Weld Neck Flange (long tapered hub, butt-weld to pipe)", "olculer_detay": {"neck_root_dia_mm": 488.0, "neck_thickness_mm": 7.1, "corner_radius_mm": 12.0, "neck_length_mm": 16.0, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 457.0, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Weld neck flanşlar gemi tersanesinde deniz suyu büyük çap (DN 200+) için PN 10 standartıdır."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='10' AND cap_dn=450 AND sistem_preset=TRUE
  );

-- DN 500
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', '10', 'RF', NULL, 500, 508.0, 670.0, 28.0, 542.0, 75.0, NULL, NULL, NULL, 585.0, 4.0, 620.0, 20, '26mm', 'M24', 110.0, 90.0, NULL, NULL, '{"kaynak_geometri": "Wermac dim_wn_flg_pn10.html", "kaynak_crosscheck": "ProjectMaterials EN 1092-1 Type 11 PN 10", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Weld Neck Flange (long tapered hub, butt-weld to pipe)", "olculer_detay": {"neck_root_dia_mm": 542.0, "neck_thickness_mm": 7.1, "corner_radius_mm": 12.0, "neck_length_mm": 16.0, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 508.0, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Weld neck flanşlar gemi tersanesinde deniz suyu büyük çap (DN 200+) için PN 10 standartıdır."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='10' AND cap_dn=500 AND sistem_preset=TRUE
  );

-- DN 600
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', '10', 'RF', NULL, 600, 610.0, 780.0, 30.0, 642.0, 82.0, NULL, NULL, NULL, 685.0, 5.0, 725.0, 20, '30mm', 'M27', 125.0, 95.0, NULL, NULL, '{"kaynak_geometri": "Wermac dim_wn_flg_pn10.html", "kaynak_crosscheck": "ProjectMaterials EN 1092-1 Type 11 PN 10", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Weld Neck Flange (long tapered hub, butt-weld to pipe)", "olculer_detay": {"neck_root_dia_mm": 642.0, "neck_thickness_mm": 8.0, "corner_radius_mm": 12.0, "neck_length_mm": 18.0, "bolt_dia_stud_inch": "1\"", "bolt_hole_dia_mm_raw": 30.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 610.0, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Weld neck flanşlar gemi tersanesinde deniz suyu büyük çap (DN 200+) için PN 10 standartıdır."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='10' AND cap_dn=600 AND sistem_preset=TRUE
  );

-- ---------- Type 05 (Blind) — 8 satır ----------
-- Solid disc, boru bağlantısı yok: cap_mm/hub/bore alanları NULL.
-- DN 200-500: T05 b = T11 b (Wermac PN 10 ile cross-check ✓)
-- DN 600: T05 b = 34 ≠ T11 b = 30 (PM tek kaynak, standart bilgi: Blind daha kalın)

-- DN 200
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T05', '10', 'RF', NULL, 200, NULL, 340.0, 24.0, NULL, NULL, NULL, NULL, NULL, 268.0, 3.0, 295.0, 8, '22mm', 'M20', 95.0, 75.0, 16.5, NULL, '{"kaynak_geometri": "ProjectMaterials EN 1092-1 Type 05 PN 10", "kaynak_crosscheck": "Wermac PN 10 T11 K kolonu (DN 200-500 birebir)", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 05 — Blind Flange (solid disc, boru bağlantısı yok)", "olculer_detay": {"agirlik_kg_PM": 16.5, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": null, "uyumlu_boru_standart": "Blind = boru bağlantısı yok (solid disc)", "tip_aciklama": "Blind flanşlar boru sonunu kapatır veya hat izolasyonu için kullanılır. Full-face pressure → DN 600+ T11''den kalın."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
      AND basinc_sinifi='10' AND cap_dn=200 AND sistem_preset=TRUE
  );

-- DN 250
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T05', '10', 'RF', NULL, 250, NULL, 395.0, 26.0, NULL, NULL, NULL, NULL, NULL, 320.0, 3.0, 350.0, 12, '22mm', 'M20', 100.0, 80.0, 24.1, NULL, '{"kaynak_geometri": "ProjectMaterials EN 1092-1 Type 05 PN 10", "kaynak_crosscheck": "Wermac PN 10 T11 K kolonu (DN 200-500 birebir)", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 05 — Blind Flange (solid disc, boru bağlantısı yok)", "olculer_detay": {"agirlik_kg_PM": 24.1, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": null, "uyumlu_boru_standart": "Blind = boru bağlantısı yok (solid disc)", "tip_aciklama": "Blind flanşlar boru sonunu kapatır veya hat izolasyonu için kullanılır. Full-face pressure → DN 600+ T11''den kalın."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
      AND basinc_sinifi='10' AND cap_dn=250 AND sistem_preset=TRUE
  );

-- DN 300
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T05', '10', 'RF', NULL, 300, NULL, 445.0, 26.0, NULL, NULL, NULL, NULL, NULL, 370.0, 4.0, 400.0, 12, '22mm', 'M20', 100.0, 80.0, 30.8, NULL, '{"kaynak_geometri": "ProjectMaterials EN 1092-1 Type 05 PN 10", "kaynak_crosscheck": "Wermac PN 10 T11 K kolonu (DN 200-500 birebir)", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 05 — Blind Flange (solid disc, boru bağlantısı yok)", "olculer_detay": {"agirlik_kg_PM": 30.8, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": null, "uyumlu_boru_standart": "Blind = boru bağlantısı yok (solid disc)", "tip_aciklama": "Blind flanşlar boru sonunu kapatır veya hat izolasyonu için kullanılır. Full-face pressure → DN 600+ T11''den kalın."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
      AND basinc_sinifi='10' AND cap_dn=300 AND sistem_preset=TRUE
  );

-- DN 350
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T05', '10', 'RF', NULL, 350, NULL, 505.0, 26.0, NULL, NULL, NULL, NULL, NULL, 430.0, 4.0, 460.0, 16, '22mm', 'M20', 100.0, 80.0, 39.6, NULL, '{"kaynak_geometri": "ProjectMaterials EN 1092-1 Type 05 PN 10", "kaynak_crosscheck": "Wermac PN 10 T11 K kolonu (DN 200-500 birebir)", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 05 — Blind Flange (solid disc, boru bağlantısı yok)", "olculer_detay": {"agirlik_kg_PM": 39.6, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": null, "uyumlu_boru_standart": "Blind = boru bağlantısı yok (solid disc)", "tip_aciklama": "Blind flanşlar boru sonunu kapatır veya hat izolasyonu için kullanılır. Full-face pressure → DN 600+ T11''den kalın."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
      AND basinc_sinifi='10' AND cap_dn=350 AND sistem_preset=TRUE
  );

-- DN 400
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T05', '10', 'RF', NULL, 400, NULL, 565.0, 26.0, NULL, NULL, NULL, NULL, NULL, 482.0, 4.0, 515.0, 16, '26mm', 'M24', 110.0, 85.0, 49.4, NULL, '{"kaynak_geometri": "ProjectMaterials EN 1092-1 Type 05 PN 10", "kaynak_crosscheck": "Wermac PN 10 T11 K kolonu (DN 200-500 birebir)", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 05 — Blind Flange (solid disc, boru bağlantısı yok)", "olculer_detay": {"agirlik_kg_PM": 49.4, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": null, "uyumlu_boru_standart": "Blind = boru bağlantısı yok (solid disc)", "tip_aciklama": "Blind flanşlar boru sonunu kapatır veya hat izolasyonu için kullanılır. Full-face pressure → DN 600+ T11''den kalın."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
      AND basinc_sinifi='10' AND cap_dn=400 AND sistem_preset=TRUE
  );

-- DN 450
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T05', '10', 'RF', NULL, 450, NULL, 615.0, 28.0, NULL, NULL, NULL, NULL, NULL, 532.0, 4.0, 565.0, 20, '26mm', 'M24', 110.0, 90.0, 63.0, NULL, '{"kaynak_geometri": "ProjectMaterials EN 1092-1 Type 05 PN 10", "kaynak_crosscheck": "Wermac PN 10 T11 K kolonu (DN 200-500 birebir)", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 05 — Blind Flange (solid disc, boru bağlantısı yok)", "olculer_detay": {"agirlik_kg_PM": 63.0, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": null, "uyumlu_boru_standart": "Blind = boru bağlantısı yok (solid disc)", "tip_aciklama": "Blind flanşlar boru sonunu kapatır veya hat izolasyonu için kullanılır. Full-face pressure → DN 600+ T11''den kalın."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
      AND basinc_sinifi='10' AND cap_dn=450 AND sistem_preset=TRUE
  );

-- DN 500
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T05', '10', 'RF', NULL, 500, NULL, 670.0, 28.0, NULL, NULL, NULL, NULL, NULL, 585.0, 4.0, 620.0, 20, '26mm', 'M24', 110.0, 90.0, 75.2, NULL, '{"kaynak_geometri": "ProjectMaterials EN 1092-1 Type 05 PN 10", "kaynak_crosscheck": "Wermac PN 10 T11 K kolonu (DN 200-500 birebir)", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 05 — Blind Flange (solid disc, boru bağlantısı yok)", "olculer_detay": {"agirlik_kg_PM": 75.2, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": null, "uyumlu_boru_standart": "Blind = boru bağlantısı yok (solid disc)", "tip_aciklama": "Blind flanşlar boru sonunu kapatır veya hat izolasyonu için kullanılır. Full-face pressure → DN 600+ T11''den kalın."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
      AND basinc_sinifi='10' AND cap_dn=500 AND sistem_preset=TRUE
  );

-- DN 600 — TEK KAYNAK NOTU: T05 b=34 ≠ T11 b=30, sadece PM kaynağı
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path, malzeme_id)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T05', '10', 'RF', NULL, 600, NULL, 780.0, 34.0, NULL, NULL, NULL, NULL, NULL, 685.0, 5.0, 725.0, 20, '30mm', 'M27', 125.0, 95.0, 124.0, NULL, '{"kaynak_geometri": "ProjectMaterials EN 1092-1 Type 05 PN 10 (tek kaynak)", "kaynak_crosscheck": "YOK — Wermac PN 10 Blind sayfası yok", "kaynak_bolt": "Wermac PN 10 bolt detayı tablosu", "scrape_tarihi": "2026-05-12", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 05 — Blind Flange (solid disc)", "olculer_detay": {"agirlik_kg_PM": 124.0, "bolt_dia_stud_inch": "1\"", "bolt_hole_dia_mm_raw": 30.0, "thickness_not": "T05 b=34mm > T11 b=30mm — Blind full-face pressure"}, "yuzey_aciklama": "RF = Raised Face", "uyumlu_boru_OD_mm": null, "uyumlu_boru_standart": "Blind = boru bağlantısı yok (solid disc)", "tip_aciklama": "DN 600 PN 10 Blind: T05 b=34 mm (T11=30 mm''den 4 mm kalın). Standart bilgi: Blind full-face pressure aldığı için Weld Neck''ten kalın. ProjectMaterials tek kaynak — post-validation Cihat onayı (MK-77.X disiplini)."}', TRUE, NULL,
    (SELECT id FROM malzeme_kataloglari WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL)
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
      AND basinc_sinifi='10' AND cap_dn=600 AND sistem_preset=TRUE
  );

-- ============================================================
-- MIGRATION-İÇİ DOĞRULAMA
-- ============================================================
DO $$
DECLARE
  v_t11        INT;
  v_t05        INT;
  v_toplam     INT;
  v_fk_dolu    INT;
  v_fk_null    INT;
  v_a105_id    UUID;
BEGIN
  SELECT id INTO v_a105_id FROM malzeme_kataloglari
   WHERE spec_kodu = 'ASTM A105' AND tenant_id IS NULL;
  IF v_a105_id IS NULL THEN
    RAISE EXCEPTION 'ASTM A105 malzeme_kataloglari''da bulunamadı — B0 migration eksik';
  END IF;

  SELECT COUNT(*) INTO v_t11 FROM flansh_olculer
   WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
     AND basinc_sinifi='10' AND sistem_preset=TRUE;
  SELECT COUNT(*) INTO v_t05 FROM flansh_olculer
   WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T05'
     AND basinc_sinifi='10' AND sistem_preset=TRUE;
  v_toplam := v_t11 + v_t05;

  IF v_t11 <> 8 THEN
    RAISE EXCEPTION 'T11 PN 10 bekleniyordu 8 satır, % var', v_t11;
  END IF;
  IF v_t05 <> 8 THEN
    RAISE EXCEPTION 'T05 PN 10 bekleniyordu 8 satır, % var', v_t05;
  END IF;

  -- FK kontrol: bu paketin tüm 16 satırının malzeme_id'si A105 olmalı
  SELECT COUNT(*) INTO v_fk_dolu FROM flansh_olculer
   WHERE geometri_std='EN-1092-1' AND basinc_sinifi='10'
     AND sistem_preset=TRUE AND malzeme_id = v_a105_id;
  SELECT COUNT(*) INTO v_fk_null FROM flansh_olculer
   WHERE geometri_std='EN-1092-1' AND basinc_sinifi='10'
     AND sistem_preset=TRUE AND malzeme_id IS NULL;

  IF v_fk_null > 0 THEN
    RAISE EXCEPTION 'PN 10 paketinde malzeme_id NULL satır var: %', v_fk_null;
  END IF;

  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '✅ EN 1092-1 PN 10 paketi BAŞARILI';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE 'T11 (Weld Neck):  % satır (DN 200-600)', v_t11;
  RAISE NOTICE 'T05 (Blind):      % satır (DN 200-600)', v_t05;
  RAISE NOTICE 'Toplam:           % satır', v_toplam;
  RAISE NOTICE 'malzeme_id A105:  % satır (tümü FK ile dolu)', v_fk_dolu;
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE 'B0 omurgası ilk gerçek kullanım: ✅';
  RAISE NOTICE 'DN 10-150 PN 10 + T01/T12 → 78. oturum (RoyMech BS4504 araştırma)';
END $$;

COMMIT;

-- ============================================================
-- POST-APPLY DOĞRULAMA SORGULARI (COMMIT sonrası ayrıca çalıştır)
-- ============================================================

-- 1) PN 10 paketi özet
-- SELECT flansh_tipi, COUNT(*) AS satir, MIN(cap_dn) AS dn_min, MAX(cap_dn) AS dn_max
-- FROM flansh_olculer WHERE geometri_std='EN-1092-1' AND basinc_sinifi='10'
-- GROUP BY flansh_tipi;

-- 2) FK doğrulama: PN 10 satırlarının malzeme_id'si A105 mi
-- SELECT f.cap_dn, f.flansh_tipi, m.spec_kodu, m.goster_etiket
-- FROM flansh_olculer f
-- LEFT JOIN malzeme_kataloglari m ON m.id = f.malzeme_id
-- WHERE f.geometri_std='EN-1092-1' AND f.basinc_sinifi='10'
-- ORDER BY f.flansh_tipi, f.cap_dn;

-- 3) Toplam flansh_olculer durumu
-- SELECT geometri_std, basinc_sinifi, flansh_tipi, COUNT(*)
-- FROM flansh_olculer GROUP BY geometri_std, basinc_sinifi, flansh_tipi
-- ORDER BY geometri_std, basinc_sinifi, flansh_tipi;
