-- ============================================================
-- 037 — fitting_olculer'a B16.9 Cap INSERT'leri (IDEMPOTENT)
-- ============================================================
-- 33 satır Cap (boru kapağı)
-- NPS 1/2 – 48 (DN 15 – 1219)
--
-- Kaynak: Wermac dim_caps.html (scrape 2026-05-07)
-- Üretim: AresPipe kütüphane mini-projesi, 75. oturum (11 May 2026)
-- Önceki ad: 032_inserts_cap.sql — ana sayaç 032'yi rls_fix_5_tablo'ya verdi
--
-- IDEMPOTENT:
--   Her INSERT, kendi (parca_tipi, geometri_std, cap_buyuk_dn, sistem_preset)
--   kombinasyonu DB'de yoksa kayıt yazar. Tekrar çalıştırma duplicate yapmaz.
--   Hiçbir satır mevcut değilse 33 INSERT, hepsi varsa 0 INSERT.
-- ============================================================

INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '1/2', 15, 21.3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn15.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 25.0, "uzunluk_h1_heavy_wall_mm": 25.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=15 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '3/4', 20, 26.7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn20.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 25.0, "uzunluk_h1_heavy_wall_mm": 25.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=20 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '1', 25, 33.4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 38.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn25.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 38.0, "uzunluk_h1_heavy_wall_mm": 38.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=25 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '1.1/4', 32, 42.2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 38.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn32.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 38.0, "uzunluk_h1_heavy_wall_mm": 38.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=32 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '1.1/2', 40, 48.3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 38.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn40.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 38.0, "uzunluk_h1_heavy_wall_mm": 38.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=40 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '2', 50, 60.3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 38.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn50.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 38.0, "uzunluk_h1_heavy_wall_mm": 44.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=50 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '2.1/2', 65, 73.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 38.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn65.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 38.0, "uzunluk_h1_heavy_wall_mm": 51.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=65 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '3', 80, 88.9, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 51.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn80.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 51.0, "uzunluk_h1_heavy_wall_mm": 64.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=80 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '3.1/2', 90, 101.6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 64.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn90.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 64.0, "uzunluk_h1_heavy_wall_mm": 76.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=90 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '4', 100, 114.3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 64.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn100.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 64.0, "uzunluk_h1_heavy_wall_mm": 76.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=100 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '5', 125, 141.3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 76.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn125.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 76.0, "uzunluk_h1_heavy_wall_mm": 89.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=125 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '6', 150, 168.3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 89.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn150.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 89.0, "uzunluk_h1_heavy_wall_mm": 102.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=150 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '8', 200, 219.1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 102.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn200.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 102.0, "uzunluk_h1_heavy_wall_mm": 127.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=200 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '10', 250, 273.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 127.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn250.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 127.0, "uzunluk_h1_heavy_wall_mm": 152.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=250 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '12', 300, 323.8, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 152.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn300.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 152.0, "uzunluk_h1_heavy_wall_mm": 178.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=300 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '14', 350, 355.6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 165.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn350.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 165.0, "uzunluk_h1_heavy_wall_mm": 191.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=350 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '16', 400, 406.4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 178.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn400.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 178.0, "uzunluk_h1_heavy_wall_mm": 203.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=400 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '18', 450, 457.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 203.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn450.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 203.0, "uzunluk_h1_heavy_wall_mm": 229.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=450 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '20', 500, 508.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 229.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn500.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 229.0, "uzunluk_h1_heavy_wall_mm": 254.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=500 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '22', 550, 559.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 254.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn550.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 254.0, "uzunluk_h1_heavy_wall_mm": 254.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=550 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '24', 600, 610.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 267.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn600.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 267.0, "uzunluk_h1_heavy_wall_mm": 305.0, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=600 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '26', 650, 660.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 267.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn650.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 267.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=650 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '28', 700, 711.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 267.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn700.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 267.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=700 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '30', 750, 762.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 267.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn750.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 267.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=750 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '32', 800, 813.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 267.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn800.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 267.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=800 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '34', 850, 864.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 237.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn850.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 237.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=850 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '36', 900, 914.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 267.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn900.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 267.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=900 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '38', 950, 965.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 305.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn950.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 305.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=950 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '40', 1000, 1016.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 305.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn1000.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 305.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=1000 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '42', 1050, 1067.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 305.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn1050.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 305.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=1050 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '44', 1100, 1118.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 343.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn1100.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 343.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=1100 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '46', 1150, 1168.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 343.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn1150.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 343.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=1150 AND sistem_preset=TRUE
  );
INSERT INTO fitting_olculer (tenant_id, sistem_preset, geometri_std, parca_tipi, cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, cap_kucuk_nps, cap_kucuk_dn, cap_kucuk_mm, schedule_tipi, schedule_deger, schedule_kod, et_mm, ucu_uca_a_mm, ucu_uca_b_mm, ucu_uca_c_mm, ucu_uca_f_mm, ucu_uca_m_mm, ucu_uca_h_mm, yaricap_mm, stub_lap_kalinlik_mm, stub_lap_od_mm, agirlik_kg, cizim_path, model_3d_path, notlar, aktif)
  SELECT NULL, TRUE, 'B16.9', 'cap', '48', 1200, 1219.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 343.0, NULL, NULL, NULL, NULL, 'cizimler/fitting/asme_b16_9_cap_dn1200.svg', NULL, '{"kaynak": "Wermac B16.9 Cap tablosu", "uretim_tarihi": "2026-05", "uzunluk_h_standart_wall_mm": 343.0, "uzunluk_h1_heavy_wall_mm": null, "wermac_not": "Wall thickness must be specified by customer. Shape ellipsoidal per ASME BPV Code."}', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM fitting_olculer
    WHERE parca_tipi='cap' AND geometri_std='B16.9'
      AND cap_buyuk_dn=1200 AND sistem_preset=TRUE
  );

-- ============================================================
-- Toplam: 33 idempotent INSERT
-- ============================================================

-- Doğrulama (script sonu çalıştır):
-- 1) Sayı kontrolü:
--    SELECT COUNT(*) FROM fitting_olculer WHERE parca_tipi='cap';
--    Beklenen: 33

-- 2) NPS 4 spot check:
--    SELECT cap_buyuk_nps, cap_buyuk_dn, cap_buyuk_mm, ucu_uca_h_mm,
--           notlar->>'uzunluk_h1_heavy_wall_mm' AS h1_mm
--    FROM fitting_olculer
--    WHERE parca_tipi='cap' AND cap_buyuk_dn=100;
--    Beklenen: NPS='4', DN=100, OD=114.3, H=64.0, H1=76.0

-- 3) Kapsam kontrolü (DN aralığı):
--    SELECT MIN(cap_buyuk_dn), MAX(cap_buyuk_dn) FROM fitting_olculer WHERE parca_tipi='cap';
--    Beklenen: 15, 1200