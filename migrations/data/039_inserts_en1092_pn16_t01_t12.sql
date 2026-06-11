-- ============================================================
-- 039 — flansh_olculer'a EN 1092-1 PN 16 Type 01 + Type 12 INSERT'leri
-- ============================================================
-- 15 satır Type 01 (Plate SO, no hub) +
-- 15 satır Type 12 (Hubbed SO, with boss) = 30 toplam
-- DN 10 – DN 300
--
-- Kaynak (geometri): RoyMech BSEN1092_16_Dimensions.html
-- Kaynak (cıvata):   Wermac dim_wn_flg_pn16.html (PN+DN'de tüm tipler aynı bolt pattern)
-- Cross-check:       Wermac PN 16 WN (DN 100 birebir A=220, A=114.3, BC=180)
-- Üretim:            AresPipe kütüphane mini-projesi, 75. oturum (11 May 2026)
--
-- TIPLER ARASI KRİTİK FARKLAR (DN 100 örneği):
--   Type 01: K=22 (C1)  ← plate flanş, gövdesiz
--   Type 11: K=20 (C2), N1=131 (hub OD), H2=52 (toplam uzunluk)
--   Type 12: K=20 (C2), N2=140 (boss OD), H1=40 (boss uzunluk)
--   Her tip farklı parça → 3D modelde farklı geometri
--
-- 038'deki Type 11 ile 039'daki Type 01/12 arasındaki schema map farkı:
--   Type 01:  bore_std_mm=B1 dolu, hub_od_mm=NULL, hub_uzunluk_mm=NULL
--   Type 12:  bore_std_mm=B1 dolu, hub_od_mm=N2,    hub_uzunluk_mm=H1
--   Type 11:  bore_std_mm=NULL,     hub_od_mm=F,     hub_uzunluk_mm=M
--
-- IDEMPOTENT:
--   Doğal anahtar: (geometri_std, flansh_tipi, basinc_sinifi, cap_dn, sistem_preset)
-- ============================================================

-- ---------- Type 01 (Plate Slip-On, no hub) ----------

INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 10, 17.2, 90.0, 14.0, NULL, NULL, NULL, 18.0, NULL, 40.0, 2.0, NULL, 4, '14mm', 'M12', 65.0, 50.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 4.0, "bolt_dia_stud_inch": "1/2\"", "bolt_hole_dia_mm_raw": 14.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 17.2, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=10 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 15, 21.3, 95.0, 14.0, NULL, NULL, NULL, 22.0, NULL, 45.0, 2.0, NULL, 4, '14mm', 'M12', 65.0, 50.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 4.0, "bolt_dia_stud_inch": "1/2\"", "bolt_hole_dia_mm_raw": 14.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 21.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=15 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 20, 26.9, 105.0, 14.0, NULL, NULL, NULL, 27.5, NULL, 58.0, 2.0, NULL, 4, '14mm', 'M12', 70.0, 55.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 4.0, "bolt_dia_stud_inch": "1/2\"", "bolt_hole_dia_mm_raw": 14.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 26.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=20 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 25, 33.7, 115.0, 16.0, NULL, NULL, NULL, 34.5, NULL, 68.0, 2.0, NULL, 4, '14mm', 'M12', 70.0, 55.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 4.0, "bolt_dia_stud_inch": "1/2\"", "bolt_hole_dia_mm_raw": 14.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 33.7, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=25 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 32, 42.4, 140.0, 18.0, NULL, NULL, NULL, 43.5, NULL, 78.0, 2.0, NULL, 4, '18mm', 'M16', 80.0, 60.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 6.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 42.4, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=32 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 40, 48.3, 150.0, 18.0, NULL, NULL, NULL, 49.5, NULL, 88.0, 3.0, NULL, 4, '18mm', 'M16', 80.0, 60.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 6.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 48.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=40 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 50, 60.3, 165.0, 19.0, NULL, NULL, NULL, 61.5, NULL, 102.0, 3.0, NULL, 4, '18mm', 'M16', 80.0, 60.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 6.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 60.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=50 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 65, 76.1, 185.0, 20.0, NULL, NULL, NULL, 77.5, NULL, 122.0, 3.0, NULL, 8, '18mm', 'M16', 80.0, 60.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 6.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 76.1, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=65 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 80, 88.9, 200.0, 20.0, NULL, NULL, NULL, 90.5, NULL, 138.0, 3.0, NULL, 8, '18mm', 'M16', 80.0, 65.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 8.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 88.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=80 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 100, 114.3, 220.0, 22.0, NULL, NULL, NULL, 116.0, NULL, 158.0, 3.0, NULL, 8, '18mm', 'M16', 80.0, 65.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 8.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 114.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=100 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 125, 139.7, 250.0, 22.0, NULL, NULL, NULL, 141.5, NULL, 188.0, 3.0, NULL, 8, '18mm', 'M16', 85.0, 65.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 8.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 139.7, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=125 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 150, 168.3, 285.0, 24.0, NULL, NULL, NULL, 170.5, NULL, 212.0, 3.0, NULL, 8, '22mm', 'M20', 95.0, 70.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 10.0, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 168.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=150 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 200, 219.1, 340.0, 26.0, NULL, NULL, NULL, 221.5, NULL, 268.0, 3.0, NULL, 12, '22mm', 'M20', 95.0, 75.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 10.0, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 219.1, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=200 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 250, 273.0, 405.0, 29.0, NULL, NULL, NULL, 276.5, NULL, 320.0, 3.0, NULL, 12, '26mm', 'M24', 110.0, 85.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 12.0, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 273.0, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=250 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T01', '16', 'RF', NULL, 300, 323.9, 460.0, 32.0, NULL, NULL, NULL, 327.5, NULL, 378.0, 4.0, NULL, 12, '26mm', 'M24', 110.0, 90.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 01 — Plate Slip-On Flange (no hub, no neck)", "olculer_detay": {"corner_radius_mm": 12.0, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 323.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Plate slip-on: gövdesiz, plaka tipi, çevresinde cıvata delikleri. EN''in en sık üretilen SO tipi."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T01'
      AND basinc_sinifi='16' AND cap_dn=300 AND sistem_preset=TRUE
  );

-- ---------- Type 12 (Hubbed Slip-On, with boss) ----------

INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 10, 17.2, 90.0, 14.0, 30.0, 20.0, NULL, 18.0, NULL, 40.0, 2.0, NULL, 4, '14mm', 'M12', 65.0, 50.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 4.0, "bolt_dia_stud_inch": "1/2\"", "bolt_hole_dia_mm_raw": 14.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 17.2, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=10 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 15, 21.3, 95.0, 14.0, 35.0, 20.0, NULL, 22.0, NULL, 45.0, 2.0, NULL, 4, '14mm', 'M12', 65.0, 50.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 4.0, "bolt_dia_stud_inch": "1/2\"", "bolt_hole_dia_mm_raw": 14.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 21.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=15 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 20, 26.9, 105.0, 14.0, 45.0, 24.0, NULL, 27.5, NULL, 58.0, 2.0, NULL, 4, '14mm', 'M12', 70.0, 55.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 4.0, "bolt_dia_stud_inch": "1/2\"", "bolt_hole_dia_mm_raw": 14.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 26.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=20 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 25, 33.7, 115.0, 16.0, 52.0, 24.0, NULL, 34.5, NULL, 68.0, 2.0, NULL, 4, '14mm', 'M12', 70.0, 55.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 4.0, "bolt_dia_stud_inch": "1/2\"", "bolt_hole_dia_mm_raw": 14.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 33.7, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=25 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 32, 42.4, 140.0, 16.0, 60.0, 26.0, NULL, 43.5, NULL, 78.0, 2.0, NULL, 4, '18mm', 'M16', 80.0, 60.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 6.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 42.4, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=32 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 40, 48.3, 150.0, 16.0, 70.0, 26.0, NULL, 49.5, NULL, 88.0, 3.0, NULL, 4, '18mm', 'M16', 80.0, 60.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 6.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 48.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=40 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 50, 60.3, 165.0, 18.0, 84.0, 28.0, NULL, 61.5, NULL, 102.0, 3.0, NULL, 4, '18mm', 'M16', 80.0, 60.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 6.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 60.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=50 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 65, 76.1, 185.0, 18.0, 104.0, 32.0, NULL, 77.5, NULL, 122.0, 3.0, NULL, 8, '18mm', 'M16', 80.0, 60.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 6.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 76.1, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=65 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 80, 88.9, 200.0, 20.0, 118.0, 34.0, NULL, 90.5, NULL, 138.0, 3.0, NULL, 8, '18mm', 'M16', 80.0, 65.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 8.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 88.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=80 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 100, 114.3, 220.0, 20.0, 140.0, 40.0, NULL, 116.0, NULL, 158.0, 3.0, NULL, 8, '18mm', 'M16', 80.0, 65.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 8.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 114.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=100 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 125, 139.7, 250.0, 22.0, 168.0, 44.0, NULL, 141.5, NULL, 188.0, 3.0, NULL, 8, '18mm', 'M16', 85.0, 65.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 8.0, "bolt_dia_stud_inch": "5/8\"", "bolt_hole_dia_mm_raw": 18.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 139.7, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=125 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 150, 168.3, 285.0, 22.0, 195.0, 44.0, NULL, 170.5, NULL, 212.0, 3.0, NULL, 8, '22mm', 'M20', 95.0, 70.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 10.0, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 168.3, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=150 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 200, 219.1, 340.0, 24.0, 246.0, 44.0, NULL, 221.5, NULL, 268.0, 3.0, NULL, 12, '22mm', 'M20', 95.0, 75.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 10.0, "bolt_dia_stud_inch": "3/4\"", "bolt_hole_dia_mm_raw": 22.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 219.1, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=200 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 250, 273.0, 405.0, 26.0, 298.0, 46.0, NULL, 276.5, NULL, 320.0, 3.0, NULL, 12, '26mm', 'M24', 110.0, 85.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 12.0, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 273.0, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=250 AND sistem_preset=TRUE
  );
INSERT INTO flansh_olculer (tenant_id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi, cap_nps, cap_dn, cap_mm, flansh_od_mm, flansh_kalinlik_mm, hub_od_mm, hub_uzunluk_mm, bore_min_mm, bore_std_mm, socket_depth_mm, raised_face_od_mm, raised_face_kalinlik_mm, bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch, bolt_uzunluk_stud_mm, bolt_uzunluk_machine_mm, agirlik_kg, cizim_path, notlar, aktif, model_3d_path)
  SELECT NULL, TRUE, 'EN-1092-1', 'EN-T12', '16', 'RF', NULL, 300, 323.9, 460.0, 28.0, 350.0, 46.0, NULL, 327.5, NULL, 378.0, 4.0, NULL, 12, '26mm', 'M24', 110.0, 90.0, NULL, NULL, '{"kaynak_geometri": "RoyMech BSEN1092_16_Dimensions.html", "kaynak_bolt": "Wermac dim_wn_flg_pn16.html", "scrape_tarihi": "2026-05-11", "edisyon": "EN 1092-1:2007+A1:2013", "tip_adi_uzun": "Type 12 — Hubbed Slip-On Flange (with boss)", "olculer_detay": {"corner_radius_mm": 12.0, "bolt_dia_stud_inch": "7/8\"", "bolt_hole_dia_mm_raw": 26.0}, "yuzey_aciklama": "RF = Raised Face (EN 1092-1 type B1 facing)", "uyumlu_boru_OD_mm": 323.9, "uyumlu_boru_standart": "B36.10M / EN 10220 / EN 10216", "tip_aciklama": "Hubbed slip-on: kısa boss/gövdeli, plaka değil. B16.5''in ''SO''suna yapı olarak benzer."}', TRUE, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM flansh_olculer
    WHERE geometri_std='EN-1092-1' AND flansh_tipi='EN-T12'
      AND basinc_sinifi='16' AND cap_dn=300 AND sistem_preset=TRUE
  );

-- ---------- Bolt circle tamamlama (RoyMech'te yoktu, Wermac WN'den) ----------

UPDATE flansh_olculer SET bolt_circle_mm=60.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=10 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=65.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=15 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=75.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=20 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=85.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=25 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=100.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=32 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=110.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=40 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=125.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=50 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=145.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=65 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=160.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=80 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=180.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=100 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=210.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=125 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=240.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=150 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=295.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=200 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=355.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=250 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;
UPDATE flansh_olculer SET bolt_circle_mm=410.0
  WHERE geometri_std='EN-1092-1' AND flansh_tipi IN ('EN-T01','EN-T12')
    AND basinc_sinifi='16' AND cap_dn=300 AND sistem_preset=TRUE
    AND bolt_circle_mm IS NULL;

-- ============================================================
-- Toplam: 15 Type 01 + 15 Type 12 = 30 idempotent INSERT + 15 bolt_circle UPDATE
-- ============================================================

-- DOĞRULAMALAR:

-- 1) Sayı kontrolü:
--    SELECT flansh_tipi, COUNT(*) FROM flansh_olculer
--    WHERE geometri_std='EN-1092-1' AND basinc_sinifi='16'
--    GROUP BY flansh_tipi ORDER BY flansh_tipi;
--    Beklenen: EN-T01=15, EN-T11=15, EN-T12=15

-- 2) Tip farkları DN 100 (parça kimliği doğrulaması):
--    SELECT flansh_tipi, flansh_kalinlik_mm AS K, hub_od_mm, hub_uzunluk_mm,
--           bore_std_mm, bolt_circle_mm
--    FROM flansh_olculer
--    WHERE geometri_std='EN-1092-1' AND basinc_sinifi='16' AND cap_dn=100
--    ORDER BY flansh_tipi;
--    Beklenen:
--      EN-T01: K=22, hub_od=NULL, hub_uz=NULL, bore=116, BC=180
--      EN-T11: K=20, hub_od=131, hub_uz=52,   bore=NULL, BC=180
--      EN-T12: K=20, hub_od=140, hub_uz=40,   bore=116, BC=180

-- 3) Pilot uyumu — DN 50 (60.3 mm boru) tüm tipler:
--    SELECT flansh_tipi, cap_mm, flansh_od_mm
--    FROM flansh_olculer
--    WHERE geometri_std='EN-1092-1' AND basinc_sinifi='16' AND cap_dn=50
--    ORDER BY flansh_tipi;
--    Beklenen: 3 satır, hepsi cap_mm=60.3, flansh_od=165

-- 4) Bolt circle UPDATE sonucu (NULL kalan var mı):
--    SELECT flansh_tipi, COUNT(*) FROM flansh_olculer
--    WHERE geometri_std='EN-1092-1' AND basinc_sinifi='16' AND bolt_circle_mm IS NULL
--    GROUP BY flansh_tipi;
--    Beklenen: 0 satır (hepsi UPDATE'le doldu)