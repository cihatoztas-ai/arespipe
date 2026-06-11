-- ============================================================
-- 038 — flansh_olculer'a EN 1092-1 PN 16 Type 11 (WN) INSERT'leri
-- ============================================================
-- 15 satır WN flanş (Welding Neck, Vorschweiss-Flansche)
-- DN 10 – DN 300 (Orta MVP'nin alt aralığı)
--
-- Kaynak (birincil): Wermac dim_wn_flg_pn16.html (scrape 2026-05-11)
-- Cross-check: RoyMech BSEN1092_16_Dimensions.html
-- Üretim: AresPipe kütüphane mini-projesi, 75. oturum (11 May 2026)
--
-- KARARLAR (75. oturum):
--   flansh_tipi: 'EN-T11' (B16.5'in 'WN' kodundan ayrı — parça kimliği)
--   basinc_sinifi: 'PN16'
--   geometri_std: 'EN-1092-1' (flansh_olculer'da bu standart için ilk kayıt)
--
-- IDEMPOTENT:
--   Doğal anahtar: (geometri_std, flansh_tipi, basinc_sinifi, cap_dn, sistem_preset)
--   Tekrar çalıştırma duplicate yapmaz.
-- ============================================================

-- ÖN-KONTROL: flansh_olculer şemasını teyit et (MK-51.4)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name='flansh_olculer' ORDER BY ordinal_position;

-- ÖN-KONTROL: çakışma var mı
-- SELECT COUNT(*) FROM flansh_olculer
-- WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11' AND basinc_sinifi='PN16';
-- Beklenen: 0 (ilk yükleme), idempotent olduğu için >0 olsa da güvenli

INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 10, 17.2, 90.0, 16.0, 60.0, 4, 'M12', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 40.0, "raised_face_height_mm": 2.0, "neck_dia_mm": 28.0, "neck_uzunluk_mm": 6.0, "flansh_uzunluk_mm": 35.0, "wall_thk_mm": 2.0, "corner_radius_mm": 4.0, "bolt_hole_dia_mm": 14.0, "bolt_length_hex_mm": 50.0, "bolt_dia_stud_inch": "1/2\"", "bolt_length_stud_mm": 65.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 17.2, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=10 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 15, 21.3, 95.0, 16.0, 65.0, 4, 'M12', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 45.0, "raised_face_height_mm": 2.0, "neck_dia_mm": 32.0, "neck_uzunluk_mm": 6.0, "flansh_uzunluk_mm": 38.0, "wall_thk_mm": 2.0, "corner_radius_mm": 4.0, "bolt_hole_dia_mm": 14.0, "bolt_length_hex_mm": 50.0, "bolt_dia_stud_inch": "1/2\"", "bolt_length_stud_mm": 65.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 21.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=15 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 20, 26.9, 105.0, 18.0, 75.0, 4, 'M12', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 58.0, "raised_face_height_mm": 2.0, "neck_dia_mm": 40.0, "neck_uzunluk_mm": 6.0, "flansh_uzunluk_mm": 40.0, "wall_thk_mm": 2.3, "corner_radius_mm": 4.0, "bolt_hole_dia_mm": 14.0, "bolt_length_hex_mm": 55.0, "bolt_dia_stud_inch": "1/2\"", "bolt_length_stud_mm": 70.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 26.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=20 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 25, 33.7, 115.0, 18.0, 85.0, 4, 'M12', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 68.0, "raised_face_height_mm": 2.0, "neck_dia_mm": 46.0, "neck_uzunluk_mm": 6.0, "flansh_uzunluk_mm": 40.0, "wall_thk_mm": 2.6, "corner_radius_mm": 4.0, "bolt_hole_dia_mm": 14.0, "bolt_length_hex_mm": 55.0, "bolt_dia_stud_inch": "1/2\"", "bolt_length_stud_mm": 70.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 33.7, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=25 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 32, 42.4, 140.0, 18.0, 100.0, 4, 'M16', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 78.0, "raised_face_height_mm": 2.0, "neck_dia_mm": 56.0, "neck_uzunluk_mm": 6.0, "flansh_uzunluk_mm": 42.0, "wall_thk_mm": 2.6, "corner_radius_mm": 6.0, "bolt_hole_dia_mm": 18.0, "bolt_length_hex_mm": 60.0, "bolt_dia_stud_inch": "5/8\"", "bolt_length_stud_mm": 80.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 42.4, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=32 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 40, 48.3, 150.0, 18.0, 110.0, 4, 'M16', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 88.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 64.0, "neck_uzunluk_mm": 7.0, "flansh_uzunluk_mm": 45.0, "wall_thk_mm": 2.6, "corner_radius_mm": 6.0, "bolt_hole_dia_mm": 18.0, "bolt_length_hex_mm": 60.0, "bolt_dia_stud_inch": "5/8\"", "bolt_length_stud_mm": 80.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 48.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=40 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 50, 60.3, 165.0, 18.0, 125.0, 4, 'M16', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 102.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 74.0, "neck_uzunluk_mm": 8.0, "flansh_uzunluk_mm": 45.0, "wall_thk_mm": 2.9, "corner_radius_mm": 6.0, "bolt_hole_dia_mm": 18.0, "bolt_length_hex_mm": 60.0, "bolt_dia_stud_inch": "5/8\"", "bolt_length_stud_mm": 80.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 60.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=50 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 65, 76.1, 185.0, 18.0, 145.0, 8, 'M16', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 122.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 92.0, "neck_uzunluk_mm": 10.0, "flansh_uzunluk_mm": 45.0, "wall_thk_mm": 2.9, "corner_radius_mm": 6.0, "bolt_hole_dia_mm": 18.0, "bolt_length_hex_mm": 60.0, "bolt_dia_stud_inch": "5/8\"", "bolt_length_stud_mm": 80.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 76.1, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=65 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 80, 88.9, 200.0, 20.0, 160.0, 8, 'M16', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 138.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 105.0, "neck_uzunluk_mm": 10.0, "flansh_uzunluk_mm": 50.0, "wall_thk_mm": 3.2, "corner_radius_mm": 6.0, "bolt_hole_dia_mm": 18.0, "bolt_length_hex_mm": 65.0, "bolt_dia_stud_inch": "5/8\"", "bolt_length_stud_mm": 80.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 88.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=80 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 100, 114.3, 220.0, 20.0, 180.0, 8, 'M16', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 158.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 131.0, "neck_uzunluk_mm": 12.0, "flansh_uzunluk_mm": 52.0, "wall_thk_mm": 3.6, "corner_radius_mm": 8.0, "bolt_hole_dia_mm": 18.0, "bolt_length_hex_mm": 65.0, "bolt_dia_stud_inch": "5/8\"", "bolt_length_stud_mm": 80.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 114.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=100 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 125, 139.7, 250.0, 22.0, 210.0, 8, 'M16', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 188.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 156.0, "neck_uzunluk_mm": 12.0, "flansh_uzunluk_mm": 55.0, "wall_thk_mm": 4.0, "corner_radius_mm": 8.0, "bolt_hole_dia_mm": 18.0, "bolt_length_hex_mm": 65.0, "bolt_dia_stud_inch": "5/8\"", "bolt_length_stud_mm": 85.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 139.7, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=125 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 150, 168.3, 285.0, 22.0, 240.0, 8, 'M20', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 212.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 184.0, "neck_uzunluk_mm": 12.0, "flansh_uzunluk_mm": 55.0, "wall_thk_mm": 4.5, "corner_radius_mm": 10.0, "bolt_hole_dia_mm": 22.0, "bolt_length_hex_mm": 70.0, "bolt_dia_stud_inch": "3/4\"", "bolt_length_stud_mm": 95.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 168.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=150 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 200, 219.1, 340.0, 24.0, 295.0, 12, 'M20', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 268.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 235.0, "neck_uzunluk_mm": 16.0, "flansh_uzunluk_mm": 62.0, "wall_thk_mm": 6.3, "corner_radius_mm": 10.0, "bolt_hole_dia_mm": 22.0, "bolt_length_hex_mm": 75.0, "bolt_dia_stud_inch": "3/4\"", "bolt_length_stud_mm": 95.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 219.1, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=200 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 250, 273.0, 405.0, 26.0, 355.0, 12, 'M24', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 320.0, "raised_face_height_mm": 3.0, "neck_dia_mm": 292.0, "neck_uzunluk_mm": 16.0, "flansh_uzunluk_mm": 70.0, "wall_thk_mm": 6.3, "corner_radius_mm": 12.0, "bolt_hole_dia_mm": 26.0, "bolt_length_hex_mm": 85.0, "bolt_dia_stud_inch": "7/8\"", "bolt_length_stud_mm": 110.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 273.0, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=250 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, notlar, aktif)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T11', 'PN16', 'RF', NULL, 300, 323.9, 460.0, 28.0, 410.0, 12, 'M24', '{"kaynak_birincil": "Wermac dim_wn_flg_pn16.html", "kaynak_cross_check": "RoyMech BSEN1092_16_Dimensions.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 11 — Welding Neck (Vorschweiss-Flansche)", "olculer_detay": {"raised_face_dia_mm": 378.0, "raised_face_height_mm": 4.0, "neck_dia_mm": 344.0, "neck_uzunluk_mm": 16.0, "flansh_uzunluk_mm": 78.0, "wall_thk_mm": 7.1, "corner_radius_mm": 12.0, "bolt_hole_dia_mm": 26.0, "bolt_length_hex_mm": 90.0, "bolt_dia_stud_inch": "7/8\"", "bolt_length_stud_mm": 110.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 323.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216"}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
      AND basinc_sinifi='PN16' AND cap_dn=300 AND sistem_preset=TRUE
  );

-- ============================================================
-- Toplam: 15 idempotent INSERT
-- ============================================================

-- DOĞRULAMALAR:

-- 1) Sayı kontrolü:
--    SELECT COUNT(*) FROM flansh_olculer
--    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11' AND basinc_sinifi='PN16';
--    Beklenen: 15

-- 2) DN 100 spot check (bilinen referans):
--    SELECT cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm,
--           bolt_count, bolt_holes_inch
--    FROM flansh_olculer
--    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T11'
--      AND basinc_sinifi='PN16' AND cap_dn=100;
--    Beklenen: cap_dn=100, cap_mm=114.3, OD=220, K=20, BC=180, 8 cıvata, 'M16'

-- 3) Pilot uyumu (60.3 mm boru karşılığı DN 50):
--    SELECT cap_dn, cap_mm FROM flansh_olculer
--    WHERE geometri_std='EN-1092-1' AND cap_dn=50;
--    Beklenen: cap_dn=50, cap_mm=60.3 (B36.10M ile uyumlu)

-- 4) Detay (notlar JSONB) örnek:
--    SELECT cap_dn, notlar->>'tip_adi_uzun' AS tip,
--           notlar->'olculer_detay'->>'neck_dia_mm' AS hub_OD
--    FROM flansh_olculer
--    WHERE geometri_std='EN-1092-1' AND cap_dn=100;