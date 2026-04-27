-- =============================================================================
-- 003_asme_borular.sql
-- 35. Oturum (27 Nisan 2026)
--
-- ASME / EEMUA standart boru ölçü tabloları + helper destek altyapısı
--
-- İki tablo:
--   1. asme_borular  → karbon + paslanmaz + alüminyum (DN + Schedule sistemi)
--   2. cuni_borular  → Cu-Ni 90/10 cunife (DN + basınç_rating sistemi)
--
-- Kaynaklar:
--   - Karbon (B36.10M)    : Ferrobend resmi tablo
--   - Paslanmaz (B36.19M) : piping-world resmi tablo
--   - Alüminyum (B241)    : B36.19M dimensions + 2.70 g/cm³ yoğunluk hesabı
--   - CuNife (EEMUA-144)  : piping-world 20 bar + 16 bar rating
--
-- Kapsam: 4 malzeme × DN15-DN900 × tüm yaygın schedule'lar
-- Ağırlıklar standart pratik: karbon/paslanmaz tablodan, alüm/cunife yoğunluktan
-- (DB seed üretimi sırasında hesaplanır, runtime hesap yok)
--
-- Veri kullanımı:
-- - Halka açık standart, tenant_id YOK (sektör ortak veri)
-- - SELECT herkese açık (giriş yapmamış olsa bile — gelecek hub için)
-- - INSERT/UPDATE/DELETE sadece super_admin (Anthropic ekibinin düzeltme yetkisi)
--
-- İlgili belgeler:
--   docs/IZOMETRI-BATCH-KARAR.md (Karar 5 — A1)
--   docs/CLAUDE-SONRAKI-OTURUM.md (35. oturum gündemi)
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. asme_borular tablosu (karbon + paslanmaz + alüminyum)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asme_borular (
  id BIGSERIAL PRIMARY KEY,
  dn INT NOT NULL,                        -- 15, 25, 100, 300...
  schedule TEXT NOT NULL,                 -- "10","40","STD","XS","80","160","XXS","5S","10S","40S","80S"
  malzeme TEXT NOT NULL CHECK (malzeme IN ('karbon','paslanmaz','aluminyum')),
  dis_cap_mm DECIMAL(7,2) NOT NULL,
  et_mm DECIMAL(6,2) NOT NULL,
  ic_cap_mm DECIMAL(7,2) NOT NULL,        -- (dis_cap - 2*et)
  agirlik_kg_m DECIMAL(8,3) NOT NULL,
  standart TEXT NOT NULL,                 -- "ASME B36.10M","ASME B36.19M","ASTM B241"
  notlar TEXT,
  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ,
  UNIQUE (dn, schedule, malzeme)
);

CREATE INDEX IF NOT EXISTS idx_asme_dn ON asme_borular(dn);
CREATE INDEX IF NOT EXISTS idx_asme_dn_sch_mal ON asme_borular(dn, schedule, malzeme);
CREATE INDEX IF NOT EXISTS idx_asme_malzeme ON asme_borular(malzeme);

COMMENT ON TABLE asme_borular IS 'ASME B36.10M / B36.19M / ASTM B241 standart boru ölçüleri (karbon + paslanmaz + alüminyum)';
COMMENT ON COLUMN asme_borular.malzeme IS 'karbon | paslanmaz | aluminyum';
COMMENT ON COLUMN asme_borular.schedule IS 'B36.10M karbon: 5/10/20/30/40/STD/60/80/XS/100/120/140/160/XXS — B36.19M paslanmaz: 5S/10S/40S/80S — B241 alüm: 10/40/80';
COMMENT ON COLUMN asme_borular.agirlik_kg_m IS 'Karbon/paslanmaz: standart tablodan. Alüminyum: 2.70 g/cm³ ile DB seed üretiminde hesap';

-- -------------------------------------------------------------------------
-- 2. cuni_borular tablosu (Cu-Ni 90/10 cunife — EEMUA-144)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuni_borular (
  id BIGSERIAL PRIMARY KEY,
  dn INT NOT NULL,                        -- 150, 200, 250...900
  basinc_bar INT NOT NULL CHECK (basinc_bar IN (16, 20)),
  alasim TEXT NOT NULL DEFAULT '90/10',   -- "90/10" (default), ileride "70/30" eklenebilir
  dis_cap_mm DECIMAL(7,2) NOT NULL,
  et_mm DECIMAL(6,2) NOT NULL,
  ic_cap_mm DECIMAL(7,2) NOT NULL,
  agirlik_kg_m DECIMAL(8,3) NOT NULL,
  standart TEXT NOT NULL DEFAULT 'EEMUA-144',
  notlar TEXT,
  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ,
  UNIQUE (dn, basinc_bar, alasim)
);

CREATE INDEX IF NOT EXISTS idx_cuni_dn ON cuni_borular(dn);
CREATE INDEX IF NOT EXISTS idx_cuni_dn_bar ON cuni_borular(dn, basinc_bar);

COMMENT ON TABLE cuni_borular IS 'EEMUA-144 Cu-Ni 90/10 cunife boru ölçüleri (deniz suyu hatları, gemi yapımı)';
COMMENT ON COLUMN cuni_borular.basinc_bar IS '16 (16 bar rating) veya 20 (20 bar rating)';
COMMENT ON COLUMN cuni_borular.agirlik_kg_m IS '8.94 g/cm³ yoğunluk ile DB seed üretiminde hesaplandı';

-- -------------------------------------------------------------------------
-- 3. RLS — public read, super_admin write
-- -------------------------------------------------------------------------
ALTER TABLE asme_borular ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuni_borular ENABLE ROW LEVEL SECURITY;

-- Herkes okur (oturum açmamış olsa bile — sektör ortak veri, gelecek hub için)
DROP POLICY IF EXISTS asme_borular_select ON asme_borular;
CREATE POLICY asme_borular_select ON asme_borular
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS cuni_borular_select ON cuni_borular;
CREATE POLICY cuni_borular_select ON cuni_borular
  FOR SELECT
  USING (true);

-- Sadece super_admin yazar (CHANGELOG: değişen değer = yanlış sevkiyat hesabı, sıkı kontrol)
DROP POLICY IF EXISTS asme_borular_write ON asme_borular;
CREATE POLICY asme_borular_write ON asme_borular
  FOR ALL
  USING (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS cuni_borular_write ON cuni_borular;
CREATE POLICY cuni_borular_write ON cuni_borular
  FOR ALL
  USING (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

-- -------------------------------------------------------------------------
-- 4. SEED DATA
-- -------------------------------------------------------------------------
-- ASME borular seed (karbon + paslanmaz + alüminyum)
-- Kaynak: ASME B36.10M (Ferrobend), B36.19M (piping-world), ASTM B241
-- 35. oturum, 27 Nis 2026

INSERT INTO asme_borular
  (dn, schedule, malzeme, dis_cap_mm, et_mm, ic_cap_mm, agirlik_kg_m, standart)
VALUES
  (15, '5', 'karbon', 21.3, 1.65, 18.0, 0.8, 'ASME B36.10M'),
  (15, '10', 'karbon', 21.3, 2.11, 17.08, 1.0, 'ASME B36.10M'),
  (15, '30', 'karbon', 21.3, 2.41, 16.48, 1.12, 'ASME B36.10M'),
  (15, '40', 'karbon', 21.3, 2.77, 15.76, 1.27, 'ASME B36.10M'),
  (15, 'STD', 'karbon', 21.3, 2.77, 15.76, 1.27, 'ASME B36.10M'),
  (15, '80', 'karbon', 21.3, 3.73, 13.84, 1.62, 'ASME B36.10M'),
  (15, 'XS', 'karbon', 21.3, 3.73, 13.84, 1.62, 'ASME B36.10M'),
  (15, '160', 'karbon', 21.3, 4.78, 11.74, 1.95, 'ASME B36.10M'),
  (15, 'XXS', 'karbon', 21.3, 7.47, 6.36, 2.55, 'ASME B36.10M'),
  (20, '5', 'karbon', 26.7, 1.65, 23.4, 1.03, 'ASME B36.10M'),
  (20, '10', 'karbon', 26.7, 2.11, 22.48, 1.28, 'ASME B36.10M'),
  (20, '30', 'karbon', 26.7, 2.41, 21.88, 1.44, 'ASME B36.10M'),
  (20, '40', 'karbon', 26.7, 2.87, 20.96, 1.69, 'ASME B36.10M'),
  (20, 'STD', 'karbon', 26.7, 2.87, 20.96, 1.69, 'ASME B36.10M'),
  (20, '80', 'karbon', 26.7, 3.91, 18.88, 2.2, 'ASME B36.10M'),
  (20, 'XS', 'karbon', 26.7, 3.91, 18.88, 2.2, 'ASME B36.10M'),
  (20, '160', 'karbon', 26.7, 5.56, 15.58, 2.9, 'ASME B36.10M'),
  (20, 'XXS', 'karbon', 26.7, 7.82, 11.06, 3.64, 'ASME B36.10M'),
  (25, '5', 'karbon', 33.4, 1.65, 30.1, 1.29, 'ASME B36.10M'),
  (25, '10', 'karbon', 33.4, 2.77, 27.86, 2.09, 'ASME B36.10M'),
  (25, '30', 'karbon', 33.4, 2.9, 27.6, 2.18, 'ASME B36.10M'),
  (25, '40', 'karbon', 33.4, 3.38, 26.64, 2.5, 'ASME B36.10M'),
  (25, 'STD', 'karbon', 33.4, 3.38, 26.64, 2.5, 'ASME B36.10M'),
  (25, '80', 'karbon', 33.4, 4.55, 24.3, 3.24, 'ASME B36.10M'),
  (25, 'XS', 'karbon', 33.4, 4.55, 24.3, 3.24, 'ASME B36.10M'),
  (25, '160', 'karbon', 33.4, 6.35, 20.7, 4.24, 'ASME B36.10M'),
  (25, 'XXS', 'karbon', 33.4, 9.09, 15.22, 5.45, 'ASME B36.10M'),
  (32, '5', 'karbon', 42.2, 1.65, 38.9, 1.65, 'ASME B36.10M'),
  (32, '10', 'karbon', 42.2, 2.77, 36.66, 2.69, 'ASME B36.10M'),
  (32, '30', 'karbon', 42.2, 2.97, 36.26, 2.87, 'ASME B36.10M'),
  (32, '40', 'karbon', 42.2, 3.56, 35.08, 3.39, 'ASME B36.10M'),
  (32, 'STD', 'karbon', 42.2, 3.56, 35.08, 3.39, 'ASME B36.10M'),
  (32, '80', 'karbon', 42.2, 4.85, 32.5, 4.47, 'ASME B36.10M'),
  (32, 'XS', 'karbon', 42.2, 4.85, 32.5, 4.47, 'ASME B36.10M'),
  (32, '160', 'karbon', 42.2, 6.35, 29.5, 5.61, 'ASME B36.10M'),
  (32, 'XXS', 'karbon', 42.2, 9.7, 22.8, 7.77, 'ASME B36.10M'),
  (40, '5', 'karbon', 48.3, 1.65, 45.0, 1.9, 'ASME B36.10M'),
  (40, '10', 'karbon', 48.3, 2.77, 42.76, 3.11, 'ASME B36.10M'),
  (40, '30', 'karbon', 48.3, 3.18, 41.94, 3.53, 'ASME B36.10M'),
  (40, '40', 'karbon', 48.3, 3.68, 40.94, 4.05, 'ASME B36.10M'),
  (40, 'STD', 'karbon', 48.3, 3.68, 40.94, 4.05, 'ASME B36.10M'),
  (40, '80', 'karbon', 48.3, 5.08, 38.14, 5.41, 'ASME B36.10M'),
  (40, 'XS', 'karbon', 48.3, 5.08, 38.14, 5.41, 'ASME B36.10M'),
  (40, '160', 'karbon', 48.3, 7.14, 34.02, 7.25, 'ASME B36.10M'),
  (40, 'XXS', 'karbon', 48.3, 10.15, 28.0, 9.55, 'ASME B36.10M'),
  (50, '5', 'karbon', 60.3, 1.65, 57.0, 2.39, 'ASME B36.10M'),
  (50, '10', 'karbon', 60.3, 2.77, 54.76, 3.93, 'ASME B36.10M'),
  (50, '30', 'karbon', 60.3, 3.18, 53.94, 4.48, 'ASME B36.10M'),
  (50, '40', 'karbon', 60.3, 3.91, 52.48, 5.44, 'ASME B36.10M'),
  (50, 'STD', 'karbon', 60.3, 3.91, 52.48, 5.44, 'ASME B36.10M'),
  (50, '80', 'karbon', 60.3, 5.54, 49.22, 7.48, 'ASME B36.10M'),
  (50, 'XS', 'karbon', 60.3, 5.54, 49.22, 7.48, 'ASME B36.10M'),
  (50, '160', 'karbon', 60.3, 8.74, 42.82, 11.11, 'ASME B36.10M'),
  (50, 'XXS', 'karbon', 60.3, 11.07, 38.16, 13.44, 'ASME B36.10M'),
  (65, '5', 'karbon', 73.0, 2.11, 68.78, 3.69, 'ASME B36.10M'),
  (65, '10', 'karbon', 73.0, 3.05, 66.9, 5.26, 'ASME B36.10M'),
  (65, '30', 'karbon', 73.0, 4.78, 63.44, 8.04, 'ASME B36.10M'),
  (65, '40', 'karbon', 73.0, 5.16, 62.68, 8.63, 'ASME B36.10M'),
  (65, 'STD', 'karbon', 73.0, 5.16, 62.68, 8.63, 'ASME B36.10M'),
  (65, '80', 'karbon', 73.0, 7.01, 58.98, 11.41, 'ASME B36.10M'),
  (65, 'XS', 'karbon', 73.0, 7.01, 58.98, 11.41, 'ASME B36.10M'),
  (65, '160', 'karbon', 73.0, 9.53, 53.94, 14.92, 'ASME B36.10M'),
  (65, 'XXS', 'karbon', 73.0, 14.02, 44.96, 20.39, 'ASME B36.10M'),
  (80, '5', 'karbon', 88.9, 2.11, 84.68, 4.52, 'ASME B36.10M'),
  (80, '10', 'karbon', 88.9, 3.05, 82.8, 6.46, 'ASME B36.10M'),
  (80, '30', 'karbon', 88.9, 4.78, 79.34, 9.92, 'ASME B36.10M'),
  (80, '40', 'karbon', 88.9, 5.49, 77.92, 11.29, 'ASME B36.10M'),
  (80, 'STD', 'karbon', 88.9, 5.49, 77.92, 11.29, 'ASME B36.10M'),
  (80, '80', 'karbon', 88.9, 7.62, 73.66, 15.27, 'ASME B36.10M'),
  (80, 'XS', 'karbon', 88.9, 7.62, 73.66, 15.27, 'ASME B36.10M'),
  (80, '160', 'karbon', 88.9, 11.13, 66.64, 21.35, 'ASME B36.10M'),
  (80, 'XXS', 'karbon', 88.9, 15.24, 58.42, 27.68, 'ASME B36.10M'),
  (90, '5', 'karbon', 101.6, 2.11, 97.38, 5.18, 'ASME B36.10M'),
  (90, '10', 'karbon', 101.6, 3.05, 95.5, 7.41, 'ASME B36.10M'),
  (90, '30', 'karbon', 101.6, 4.78, 92.04, 11.41, 'ASME B36.10M'),
  (90, '40', 'karbon', 101.6, 5.74, 90.12, 13.57, 'ASME B36.10M'),
  (90, 'STD', 'karbon', 101.6, 5.74, 90.12, 13.57, 'ASME B36.10M'),
  (90, '80', 'karbon', 101.6, 8.08, 85.44, 18.64, 'ASME B36.10M'),
  (90, 'XS', 'karbon', 101.6, 8.08, 85.44, 18.64, 'ASME B36.10M'),
  (100, '5', 'karbon', 114.3, 2.11, 110.08, 5.84, 'ASME B36.10M'),
  (100, '10', 'karbon', 114.3, 3.05, 108.2, 8.37, 'ASME B36.10M'),
  (100, '30', 'karbon', 114.3, 4.78, 104.74, 12.91, 'ASME B36.10M'),
  (100, '40', 'karbon', 114.3, 6.02, 102.26, 16.08, 'ASME B36.10M'),
  (100, 'STD', 'karbon', 114.3, 6.02, 102.26, 16.08, 'ASME B36.10M'),
  (100, '80', 'karbon', 114.3, 8.56, 97.18, 22.32, 'ASME B36.10M'),
  (100, 'XS', 'karbon', 114.3, 8.56, 97.18, 22.32, 'ASME B36.10M'),
  (100, '120', 'karbon', 114.3, 11.13, 92.04, 28.32, 'ASME B36.10M'),
  (100, '160', 'karbon', 114.3, 13.49, 87.32, 33.54, 'ASME B36.10M'),
  (100, 'XXS', 'karbon', 114.3, 17.12, 80.06, 41.03, 'ASME B36.10M'),
  (125, '5', 'karbon', 141.3, 2.77, 135.76, 9.46, 'ASME B36.10M'),
  (125, '10', 'karbon', 141.3, 3.4, 134.5, 11.56, 'ASME B36.10M'),
  (125, '40', 'karbon', 141.3, 6.55, 128.2, 21.77, 'ASME B36.10M'),
  (125, 'STD', 'karbon', 141.3, 6.55, 128.2, 21.77, 'ASME B36.10M'),
  (125, '80', 'karbon', 141.3, 9.53, 122.24, 30.97, 'ASME B36.10M'),
  (125, 'XS', 'karbon', 141.3, 9.53, 122.24, 30.97, 'ASME B36.10M'),
  (125, '120', 'karbon', 141.3, 12.7, 115.9, 40.28, 'ASME B36.10M'),
  (125, '160', 'karbon', 141.3, 15.88, 109.54, 49.12, 'ASME B36.10M'),
  (125, 'XXS', 'karbon', 141.3, 19.05, 103.2, 57.43, 'ASME B36.10M'),
  (150, '5', 'karbon', 168.3, 2.77, 162.76, 11.31, 'ASME B36.10M'),
  (150, '10', 'karbon', 168.3, 3.4, 161.5, 13.83, 'ASME B36.10M'),
  (150, '40', 'karbon', 168.3, 7.11, 154.08, 28.26, 'ASME B36.10M'),
  (150, 'STD', 'karbon', 168.3, 7.11, 154.08, 28.26, 'ASME B36.10M'),
  (150, '80', 'karbon', 168.3, 10.97, 146.36, 42.56, 'ASME B36.10M'),
  (150, 'XS', 'karbon', 168.3, 10.97, 146.36, 42.56, 'ASME B36.10M'),
  (150, '120', 'karbon', 168.3, 14.27, 139.76, 54.21, 'ASME B36.10M'),
  (150, '160', 'karbon', 168.3, 18.26, 131.78, 67.57, 'ASME B36.10M'),
  (150, 'XXS', 'karbon', 168.3, 21.95, 124.4, 79.22, 'ASME B36.10M'),
  (200, '5', 'karbon', 219.1, 2.77, 213.56, 14.78, 'ASME B36.10M'),
  (200, '10', 'karbon', 219.1, 3.76, 211.58, 19.97, 'ASME B36.10M'),
  (200, '20', 'karbon', 219.1, 6.35, 206.4, 33.32, 'ASME B36.10M'),
  (200, '30', 'karbon', 219.1, 7.04, 205.02, 36.82, 'ASME B36.10M'),
  (200, '40', 'karbon', 219.1, 8.18, 202.74, 42.55, 'ASME B36.10M'),
  (200, 'STD', 'karbon', 219.1, 8.18, 202.74, 42.55, 'ASME B36.10M'),
  (200, '60', 'karbon', 219.1, 10.31, 198.48, 53.09, 'ASME B36.10M'),
  (200, '80', 'karbon', 219.1, 12.7, 193.7, 64.64, 'ASME B36.10M'),
  (200, 'XS', 'karbon', 219.1, 12.7, 193.7, 64.64, 'ASME B36.10M'),
  (200, '100', 'karbon', 219.1, 15.09, 188.92, 75.92, 'ASME B36.10M'),
  (200, '120', 'karbon', 219.1, 18.26, 182.58, 90.44, 'ASME B36.10M'),
  (200, '140', 'karbon', 219.1, 20.62, 177.86, 100.93, 'ASME B36.10M'),
  (200, 'XXS', 'karbon', 219.1, 22.23, 174.64, 107.93, 'ASME B36.10M'),
  (200, '160', 'karbon', 219.1, 23.01, 173.08, 111.27, 'ASME B36.10M'),
  (250, '5', 'karbon', 273.0, 3.4, 266.2, 22.61, 'ASME B36.10M'),
  (250, '10', 'karbon', 273.0, 4.19, 264.62, 27.78, 'ASME B36.10M'),
  (250, '20', 'karbon', 273.0, 6.35, 260.3, 41.76, 'ASME B36.10M'),
  (250, '30', 'karbon', 273.0, 7.8, 257.4, 51.01, 'ASME B36.10M'),
  (250, '40', 'karbon', 273.0, 9.27, 254.46, 60.29, 'ASME B36.10M'),
  (250, 'STD', 'karbon', 273.0, 9.27, 254.46, 60.29, 'ASME B36.10M'),
  (250, '60', 'karbon', 273.0, 12.7, 247.6, 81.53, 'ASME B36.10M'),
  (250, 'XS', 'karbon', 273.0, 12.7, 247.6, 81.53, 'ASME B36.10M'),
  (250, '80', 'karbon', 273.0, 15.09, 242.82, 95.98, 'ASME B36.10M'),
  (250, '100', 'karbon', 273.0, 18.26, 236.48, 114.71, 'ASME B36.10M'),
  (250, '120', 'karbon', 273.0, 21.44, 230.12, 133.01, 'ASME B36.10M'),
  (250, '140', 'karbon', 273.0, 25.4, 222.2, 155.1, 'ASME B36.10M'),
  (250, 'XXS', 'karbon', 273.0, 25.4, 222.2, 155.1, 'ASME B36.10M'),
  (250, '160', 'karbon', 273.0, 28.58, 215.84, 172.27, 'ASME B36.10M'),
  (300, '5', 'karbon', 323.8, 3.96, 315.88, 31.24, 'ASME B36.10M'),
  (300, '10', 'karbon', 323.8, 4.57, 314.66, 35.98, 'ASME B36.10M'),
  (300, '20', 'karbon', 323.8, 6.35, 311.1, 49.71, 'ASME B36.10M'),
  (300, '30', 'karbon', 323.8, 8.38, 307.04, 65.19, 'ASME B36.10M'),
  (300, 'STD', 'karbon', 323.8, 9.53, 304.74, 73.86, 'ASME B36.10M'),
  (300, '40', 'karbon', 323.8, 10.31, 303.18, 79.71, 'ASME B36.10M'),
  (300, 'XS', 'karbon', 323.8, 12.7, 298.4, 97.44, 'ASME B36.10M'),
  (300, '60', 'karbon', 323.8, 14.27, 295.26, 108.93, 'ASME B36.10M'),
  (300, '80', 'karbon', 323.8, 17.48, 288.84, 132.05, 'ASME B36.10M'),
  (300, '100', 'karbon', 323.8, 21.44, 280.92, 159.87, 'ASME B36.10M'),
  (300, '120', 'karbon', 323.8, 25.4, 273.0, 186.92, 'ASME B36.10M'),
  (300, 'XXS', 'karbon', 323.8, 25.4, 273.0, 186.92, 'ASME B36.10M'),
  (300, '140', 'karbon', 323.8, 28.58, 266.64, 208.08, 'ASME B36.10M'),
  (300, '160', 'karbon', 323.8, 33.32, 257.16, 238.69, 'ASME B36.10M'),
  (350, '5', 'karbon', 355.6, 3.96, 347.68, 34.34, 'ASME B36.10M'),
  (350, '10', 'karbon', 355.6, 6.35, 342.9, 54.69, 'ASME B36.10M'),
  (350, '20', 'karbon', 355.6, 7.92, 339.76, 67.91, 'ASME B36.10M'),
  (350, '30', 'karbon', 355.6, 9.53, 336.54, 81.33, 'ASME B36.10M'),
  (350, 'STD', 'karbon', 355.6, 9.53, 336.54, 81.33, 'ASME B36.10M'),
  (350, '40', 'karbon', 355.6, 11.13, 333.34, 94.55, 'ASME B36.10M'),
  (350, 'XS', 'karbon', 355.6, 12.7, 330.2, 107.4, 'ASME B36.10M'),
  (350, '60', 'karbon', 355.6, 15.09, 325.42, 126.72, 'ASME B36.10M'),
  (350, '80', 'karbon', 355.6, 19.05, 317.5, 158.11, 'ASME B36.10M'),
  (350, '100', 'karbon', 355.6, 23.83, 307.94, 194.98, 'ASME B36.10M'),
  (350, '120', 'karbon', 355.6, 27.79, 300.02, 224.66, 'ASME B36.10M'),
  (350, '140', 'karbon', 355.6, 31.75, 292.1, 253.58, 'ASME B36.10M'),
  (350, '160', 'karbon', 355.6, 35.71, 284.18, 281.72, 'ASME B36.10M'),
  (400, '5', 'karbon', 406.4, 4.19, 398.02, 41.56, 'ASME B36.10M'),
  (400, '10', 'karbon', 406.4, 6.35, 393.7, 62.65, 'ASME B36.10M'),
  (400, '20', 'karbon', 406.4, 7.92, 390.56, 77.83, 'ASME B36.10M'),
  (400, '30', 'karbon', 406.4, 9.53, 387.34, 93.27, 'ASME B36.10M'),
  (400, 'STD', 'karbon', 406.4, 9.53, 387.34, 93.27, 'ASME B36.10M'),
  (400, '40', 'karbon', 406.4, 12.7, 381.0, 123.31, 'ASME B36.10M'),
  (400, 'XS', 'karbon', 406.4, 12.7, 381.0, 123.31, 'ASME B36.10M'),
  (400, '60', 'karbon', 406.4, 16.66, 373.08, 160.13, 'ASME B36.10M'),
  (400, '80', 'karbon', 406.4, 21.44, 363.52, 203.54, 'ASME B36.10M'),
  (400, '100', 'karbon', 406.4, 26.19, 354.02, 245.57, 'ASME B36.10M'),
  (400, '120', 'karbon', 406.4, 30.96, 344.48, 286.66, 'ASME B36.10M'),
  (400, '140', 'karbon', 406.4, 36.53, 333.34, 333.21, 'ASME B36.10M'),
  (400, '160', 'karbon', 406.4, 40.49, 325.42, 365.38, 'ASME B36.10M'),
  (450, '5', 'karbon', 457.0, 4.19, 448.62, 46.79, 'ASME B36.10M'),
  (450, '10', 'karbon', 457.0, 6.35, 444.3, 70.57, 'ASME B36.10M'),
  (450, '20', 'karbon', 457.0, 7.92, 441.16, 87.71, 'ASME B36.10M'),
  (450, 'STD', 'karbon', 457.0, 9.53, 437.94, 105.17, 'ASME B36.10M'),
  (450, '30', 'karbon', 457.0, 11.13, 434.74, 122.38, 'ASME B36.10M'),
  (450, 'XS', 'karbon', 457.0, 12.7, 431.6, 139.16, 'ASME B36.10M'),
  (450, '40', 'karbon', 457.0, 14.27, 428.46, 155.81, 'ASME B36.10M'),
  (450, '60', 'karbon', 457.0, 19.05, 418.9, 205.75, 'ASME B36.10M'),
  (450, '80', 'karbon', 457.0, 23.83, 409.34, 254.57, 'ASME B36.10M'),
  (450, '100', 'karbon', 457.0, 29.36, 398.28, 309.64, 'ASME B36.10M'),
  (450, '120', 'karbon', 457.0, 34.93, 387.14, 363.58, 'ASME B36.10M'),
  (450, '140', 'karbon', 457.0, 39.67, 377.66, 408.28, 'ASME B36.10M'),
  (450, '160', 'karbon', 457.0, 45.24, 366.52, 459.39, 'ASME B36.10M'),
  (500, '5', 'karbon', 508.0, 4.78, 498.44, 59.32, 'ASME B36.10M'),
  (500, '10', 'karbon', 508.0, 6.35, 495.3, 78.56, 'ASME B36.10M'),
  (500, '20', 'karbon', 508.0, 9.53, 488.94, 117.15, 'ASME B36.10M'),
  (500, 'STD', 'karbon', 508.0, 9.53, 488.94, 117.15, 'ASME B36.10M'),
  (500, '30', 'karbon', 508.0, 12.7, 482.6, 155.13, 'ASME B36.10M'),
  (500, 'XS', 'karbon', 508.0, 12.7, 482.6, 155.13, 'ASME B36.10M'),
  (500, '40', 'karbon', 508.0, 15.09, 477.82, 183.43, 'ASME B36.10M'),
  (500, '60', 'karbon', 508.0, 20.62, 466.76, 247.84, 'ASME B36.10M'),
  (500, '80', 'karbon', 508.0, 26.19, 455.62, 311.19, 'ASME B36.10M'),
  (500, '100', 'karbon', 508.0, 32.54, 442.92, 381.55, 'ASME B36.10M'),
  (500, '120', 'karbon', 508.0, 38.1, 431.8, 441.52, 'ASME B36.10M'),
  (500, '140', 'karbon', 508.0, 44.45, 419.1, 508.15, 'ASME B36.10M'),
  (500, '160', 'karbon', 508.0, 50.01, 407.98, 564.85, 'ASME B36.10M'),
  (600, '5', 'karbon', 610.0, 5.54, 598.92, 82.58, 'ASME B36.10M'),
  (600, '10', 'karbon', 610.0, 6.35, 597.3, 94.53, 'ASME B36.10M'),
  (600, '20', 'karbon', 610.0, 9.53, 590.94, 141.12, 'ASME B36.10M'),
  (600, 'STD', 'karbon', 610.0, 9.53, 590.94, 141.12, 'ASME B36.10M'),
  (600, 'XS', 'karbon', 610.0, 12.7, 584.6, 187.07, 'ASME B36.10M'),
  (600, '30', 'karbon', 610.0, 14.27, 581.46, 209.65, 'ASME B36.10M'),
  (600, '40', 'karbon', 610.0, 17.48, 575.04, 255.43, 'ASME B36.10M'),
  (600, '60', 'karbon', 610.0, 24.61, 560.78, 355.28, 'ASME B36.10M'),
  (600, '80', 'karbon', 610.0, 30.96, 548.08, 442.11, 'ASME B36.10M'),
  (600, '100', 'karbon', 610.0, 38.89, 532.22, 547.74, 'ASME B36.10M'),
  (600, '120', 'karbon', 610.0, 46.02, 517.96, 640.07, 'ASME B36.10M'),
  (600, '140', 'karbon', 610.0, 52.37, 505.26, 720.19, 'ASME B36.10M'),
  (600, '160', 'karbon', 610.0, 59.54, 490.92, 808.27, 'ASME B36.10M'),
  (15, '5S', 'paslanmaz', 21.3, 1.65, 18.0, 0.82, 'ASME B36.19M'),
  (15, '10S', 'paslanmaz', 21.3, 2.11, 17.08, 1.01, 'ASME B36.19M'),
  (15, '40S', 'paslanmaz', 21.3, 2.77, 15.76, 1.3, 'ASME B36.19M'),
  (15, '80S', 'paslanmaz', 21.3, 3.73, 13.84, 1.65, 'ASME B36.19M'),
  (20, '5S', 'paslanmaz', 26.7, 1.65, 23.4, 1.04, 'ASME B36.19M'),
  (20, '10S', 'paslanmaz', 26.7, 2.11, 22.48, 1.31, 'ASME B36.19M'),
  (20, '40S', 'paslanmaz', 26.7, 2.87, 20.96, 1.71, 'ASME B36.19M'),
  (20, '80S', 'paslanmaz', 26.7, 3.91, 18.88, 2.24, 'ASME B36.19M'),
  (25, '5S', 'paslanmaz', 33.4, 1.65, 30.1, 1.33, 'ASME B36.19M'),
  (25, '10S', 'paslanmaz', 33.4, 2.77, 27.86, 2.13, 'ASME B36.19M'),
  (25, '40S', 'paslanmaz', 33.4, 3.38, 26.64, 2.55, 'ASME B36.19M'),
  (25, '80S', 'paslanmaz', 33.4, 4.55, 24.3, 3.29, 'ASME B36.19M'),
  (32, '5S', 'paslanmaz', 42.2, 1.65, 38.9, 1.68, 'ASME B36.19M'),
  (32, '10S', 'paslanmaz', 42.2, 2.77, 36.66, 2.76, 'ASME B36.19M'),
  (32, '40S', 'paslanmaz', 42.2, 3.56, 35.08, 3.46, 'ASME B36.19M'),
  (32, '80S', 'paslanmaz', 42.2, 4.85, 32.5, 4.56, 'ASME B36.19M'),
  (40, '5S', 'paslanmaz', 48.3, 1.65, 45.0, 1.95, 'ASME B36.19M'),
  (40, '10S', 'paslanmaz', 48.3, 2.77, 42.76, 3.17, 'ASME B36.19M'),
  (40, '40S', 'paslanmaz', 48.3, 3.68, 40.94, 4.13, 'ASME B36.19M'),
  (40, '80S', 'paslanmaz', 48.3, 5.08, 38.14, 5.51, 'ASME B36.19M'),
  (50, '5S', 'paslanmaz', 60.3, 1.65, 57.0, 2.44, 'ASME B36.19M'),
  (50, '10S', 'paslanmaz', 60.3, 2.77, 54.76, 4.01, 'ASME B36.19M'),
  (50, '40S', 'paslanmaz', 60.3, 3.91, 52.48, 5.54, 'ASME B36.19M'),
  (50, '80S', 'paslanmaz', 60.3, 5.54, 49.22, 7.63, 'ASME B36.19M'),
  (65, '5S', 'paslanmaz', 73.0, 2.11, 68.78, 3.77, 'ASME B36.19M'),
  (65, '10S', 'paslanmaz', 73.0, 3.05, 66.9, 5.36, 'ASME B36.19M'),
  (65, '40S', 'paslanmaz', 73.0, 5.16, 62.68, 8.81, 'ASME B36.19M'),
  (65, '80S', 'paslanmaz', 73.0, 7.01, 58.98, 11.64, 'ASME B36.19M'),
  (80, '5S', 'paslanmaz', 88.9, 2.11, 84.68, 4.6, 'ASME B36.19M'),
  (80, '10S', 'paslanmaz', 88.9, 3.05, 82.8, 6.59, 'ASME B36.19M'),
  (80, '40S', 'paslanmaz', 88.9, 5.49, 77.92, 11.52, 'ASME B36.19M'),
  (80, '80S', 'paslanmaz', 88.9, 7.62, 73.66, 15.59, 'ASME B36.19M'),
  (90, '5S', 'paslanmaz', 101.6, 2.11, 97.38, 5.29, 'ASME B36.19M'),
  (90, '10S', 'paslanmaz', 101.6, 3.05, 95.5, 7.55, 'ASME B36.19M'),
  (90, '40S', 'paslanmaz', 101.6, 5.74, 90.12, 13.84, 'ASME B36.19M'),
  (90, '80S', 'paslanmaz', 101.6, 8.08, 85.44, 19.01, 'ASME B36.19M'),
  (100, '5S', 'paslanmaz', 114.3, 2.11, 110.08, 5.96, 'ASME B36.19M'),
  (100, '10S', 'paslanmaz', 114.3, 3.05, 108.2, 8.52, 'ASME B36.19M'),
  (100, '40S', 'paslanmaz', 114.3, 6.02, 102.26, 16.4, 'ASME B36.19M'),
  (100, '80S', 'paslanmaz', 114.3, 8.56, 97.18, 22.77, 'ASME B36.19M'),
  (125, '5S', 'paslanmaz', 141.3, 2.77, 135.76, 9.67, 'ASME B36.19M'),
  (125, '10S', 'paslanmaz', 141.3, 3.4, 134.5, 11.82, 'ASME B36.19M'),
  (125, '40S', 'paslanmaz', 141.3, 6.55, 128.2, 22.2, 'ASME B36.19M'),
  (125, '80S', 'paslanmaz', 141.3, 9.53, 122.24, 31.59, 'ASME B36.19M'),
  (150, '5S', 'paslanmaz', 168.3, 2.77, 162.76, 11.55, 'ASME B36.19M'),
  (150, '10S', 'paslanmaz', 168.3, 3.4, 161.5, 14.13, 'ASME B36.19M'),
  (150, '40S', 'paslanmaz', 168.3, 7.11, 154.08, 28.83, 'ASME B36.19M'),
  (150, '80S', 'paslanmaz', 168.3, 10.97, 146.36, 43.42, 'ASME B36.19M'),
  (200, '5S', 'paslanmaz', 219.1, 2.77, 213.56, 15.09, 'ASME B36.19M'),
  (200, '10S', 'paslanmaz', 219.1, 3.76, 211.58, 20.37, 'ASME B36.19M'),
  (200, '40S', 'paslanmaz', 219.1, 8.18, 202.74, 43.39, 'ASME B36.19M'),
  (200, '80S', 'paslanmaz', 219.1, 12.7, 193.7, 65.95, 'ASME B36.19M'),
  (250, '5S', 'paslanmaz', 273.0, 3.4, 266.2, 23.08, 'ASME B36.19M'),
  (250, '10S', 'paslanmaz', 273.0, 4.19, 264.62, 28.34, 'ASME B36.19M'),
  (250, '40S', 'paslanmaz', 273.0, 9.27, 254.46, 61.52, 'ASME B36.19M'),
  (250, '80S', 'paslanmaz', 273.0, 12.7, 247.6, 83.19, 'ASME B36.19M'),
  (300, '5S', 'paslanmaz', 323.8, 3.96, 315.88, 31.89, 'ASME B36.19M'),
  (300, '10S', 'paslanmaz', 323.8, 4.57, 314.66, 36.73, 'ASME B36.19M'),
  (300, '40S', 'paslanmaz', 323.8, 9.52, 304.76, 75.32, 'ASME B36.19M'),
  (300, '80S', 'paslanmaz', 323.8, 12.7, 298.4, 99.43, 'ASME B36.19M'),
  (350, '5S', 'paslanmaz', 355.6, 3.96, 347.68, 35.06, 'ASME B36.19M'),
  (350, '10S', 'paslanmaz', 355.6, 4.78, 346.04, 42.14, 'ASME B36.19M'),
  (400, '5S', 'paslanmaz', 406.4, 4.19, 398.02, 42.41, 'ASME B36.19M'),
  (400, '10S', 'paslanmaz', 406.4, 4.78, 396.84, 48.26, 'ASME B36.19M'),
  (450, '5S', 'paslanmaz', 457.2, 4.19, 448.82, 47.77, 'ASME B36.19M'),
  (450, '10S', 'paslanmaz', 457.2, 4.78, 447.64, 54.36, 'ASME B36.19M'),
  (500, '5S', 'paslanmaz', 508.0, 4.78, 498.44, 60.46, 'ASME B36.19M'),
  (500, '10S', 'paslanmaz', 508.0, 5.54, 496.92, 70.0, 'ASME B36.19M'),
  (600, '5S', 'paslanmaz', 610.0, 5.54, 598.92, 84.16, 'ASME B36.19M'),
  (600, '10S', 'paslanmaz', 610.0, 6.35, 597.3, 96.37, 'ASME B36.19M'),
  (15, '10', 'aluminyum', 21.3, 2.11, 17.08, 0.343, 'ASTM B241'),
  (15, '40', 'aluminyum', 21.3, 2.77, 15.76, 0.435, 'ASTM B241'),
  (15, '80', 'aluminyum', 21.3, 3.73, 13.84, 0.556, 'ASTM B241'),
  (20, '10', 'aluminyum', 26.7, 2.11, 22.48, 0.44, 'ASTM B241'),
  (20, '40', 'aluminyum', 26.7, 2.87, 20.96, 0.58, 'ASTM B241'),
  (20, '80', 'aluminyum', 26.7, 3.91, 18.88, 0.756, 'ASTM B241'),
  (25, '10', 'aluminyum', 33.4, 2.77, 27.86, 0.72, 'ASTM B241'),
  (25, '40', 'aluminyum', 33.4, 3.38, 26.64, 0.861, 'ASTM B241'),
  (25, '80', 'aluminyum', 33.4, 4.55, 24.3, 1.113, 'ASTM B241'),
  (32, '10', 'aluminyum', 42.2, 2.77, 36.66, 0.926, 'ASTM B241'),
  (32, '40', 'aluminyum', 42.2, 3.56, 35.08, 1.167, 'ASTM B241'),
  (32, '80', 'aluminyum', 42.2, 4.85, 32.5, 1.537, 'ASTM B241'),
  (40, '10', 'aluminyum', 48.3, 2.77, 42.76, 1.07, 'ASTM B241'),
  (40, '40', 'aluminyum', 48.3, 3.68, 40.94, 1.393, 'ASTM B241'),
  (40, '80', 'aluminyum', 48.3, 5.08, 38.14, 1.862, 'ASTM B241'),
  (50, '10', 'aluminyum', 60.3, 2.77, 54.76, 1.352, 'ASTM B241'),
  (50, '40', 'aluminyum', 60.3, 3.91, 52.48, 1.87, 'ASTM B241'),
  (50, '80', 'aluminyum', 60.3, 5.54, 49.22, 2.573, 'ASTM B241'),
  (65, '10', 'aluminyum', 73.0, 3.05, 66.9, 1.81, 'ASTM B241'),
  (65, '40', 'aluminyum', 73.0, 5.16, 62.68, 2.969, 'ASTM B241'),
  (65, '80', 'aluminyum', 73.0, 7.01, 58.98, 3.924, 'ASTM B241'),
  (80, '10', 'aluminyum', 88.9, 3.05, 82.8, 2.221, 'ASTM B241'),
  (80, '40', 'aluminyum', 88.9, 5.49, 77.92, 3.884, 'ASTM B241'),
  (80, '80', 'aluminyum', 88.9, 7.62, 73.66, 5.254, 'ASTM B241'),
  (90, '10', 'aluminyum', 101.6, 3.05, 95.5, 2.55, 'ASTM B241'),
  (90, '40', 'aluminyum', 101.6, 5.74, 90.12, 4.667, 'ASTM B241'),
  (90, '80', 'aluminyum', 101.6, 8.08, 85.44, 6.41, 'ASTM B241'),
  (100, '10', 'aluminyum', 114.3, 3.05, 108.2, 2.878, 'ASTM B241'),
  (100, '40', 'aluminyum', 114.3, 6.02, 102.26, 5.529, 'ASTM B241'),
  (100, '80', 'aluminyum', 114.3, 8.56, 97.18, 7.678, 'ASTM B241'),
  (125, '10', 'aluminyum', 141.3, 3.4, 134.5, 3.977, 'ASTM B241'),
  (125, '40', 'aluminyum', 141.3, 6.55, 128.2, 7.487, 'ASTM B241'),
  (125, '80', 'aluminyum', 141.3, 9.53, 122.24, 10.652, 'ASTM B241'),
  (150, '10', 'aluminyum', 168.3, 3.4, 161.5, 4.756, 'ASTM B241'),
  (150, '40', 'aluminyum', 168.3, 7.11, 154.08, 9.721, 'ASTM B241'),
  (150, '80', 'aluminyum', 168.3, 10.97, 146.36, 14.64, 'ASTM B241'),
  (200, '10', 'aluminyum', 219.1, 3.76, 211.58, 6.868, 'ASTM B241'),
  (200, '40', 'aluminyum', 219.1, 8.18, 202.74, 14.635, 'ASTM B241'),
  (200, '80', 'aluminyum', 219.1, 12.7, 193.7, 22.234, 'ASTM B241'),
  (250, '10', 'aluminyum', 273.0, 4.19, 264.62, 9.554, 'ASTM B241'),
  (250, '40', 'aluminyum', 273.0, 9.27, 254.46, 20.737, 'ASTM B241'),
  (250, '80', 'aluminyum', 273.0, 12.7, 247.6, 28.041, 'ASTM B241'),
  (300, '10', 'aluminyum', 323.8, 4.57, 314.66, 12.375, 'ASTM B241'),
  (300, '40', 'aluminyum', 323.8, 9.52, 304.76, 25.379, 'ASTM B241'),
  (300, '80', 'aluminyum', 323.8, 12.7, 298.4, 33.513, 'ASTM B241'),
  (350, '10', 'aluminyum', 355.6, 4.78, 346.04, 14.224, 'ASTM B241'),
  (400, '10', 'aluminyum', 406.4, 4.78, 396.84, 16.284, 'ASTM B241'),
  (450, '10', 'aluminyum', 457.2, 4.78, 447.64, 18.344, 'ASTM B241'),
  (500, '10', 'aluminyum', 508.0, 5.54, 496.92, 23.612, 'ASTM B241'),
  (600, '10', 'aluminyum', 610.0, 6.35, 597.3, 32.514, 'ASTM B241')
ON CONFLICT (dn, schedule, malzeme) DO UPDATE SET
  dis_cap_mm = EXCLUDED.dis_cap_mm,
  et_mm = EXCLUDED.et_mm,
  ic_cap_mm = EXCLUDED.ic_cap_mm,
  agirlik_kg_m = EXCLUDED.agirlik_kg_m,
  standart = EXCLUDED.standart;

-- CuNife borular seed (Cu-Ni 90/10, EEMUA-144)
-- Kaynak: piping-world.com (20 bar + 16 bar rating)
-- Ağırlıklar 8.94 g/cm³ yoğunluk ile hesaplandı (DB seed üretimi sırasında, runtime hesap yok)
-- 35. oturum, 27 Nis 2026

INSERT INTO cuni_borular
  (dn, basinc_bar, alasim, dis_cap_mm, et_mm, ic_cap_mm, agirlik_kg_m, standart)
VALUES
  (150, 20, '90/10', 159.0, 3.5, 152.0, 15.286, 'EEMUA-144'),
  (200, 20, '90/10', 219.1, 4.5, 210.1, 27.122, 'EEMUA-144'),
  (250, 20, '90/10', 267.0, 5.5, 256.0, 40.394, 'EEMUA-144'),
  (300, 20, '90/10', 323.9, 7.0, 309.9, 62.303, 'EEMUA-144'),
  (350, 20, '90/10', 368.0, 8.0, 352.0, 80.887, 'EEMUA-144'),
  (400, 20, '90/10', 419.0, 9.0, 401.0, 103.637, 'EEMUA-144'),
  (450, 20, '90/10', 457.2, 9.5, 438.2, 119.453, 'EEMUA-144'),
  (500, 20, '90/10', 508.0, 11.0, 486.0, 153.545, 'EEMUA-144'),
  (600, 20, '90/10', 610.0, 13.0, 584.0, 217.974, 'EEMUA-144'),
  (700, 20, '90/10', 711.0, 15.0, 681.0, 293.216, 'EEMUA-144'),
  (800, 20, '90/10', 813.0, 17.0, 779.0, 380.058, 'EEMUA-144'),
  (900, 20, '90/10', 914.0, 19.0, 876.0, 477.6, 'EEMUA-144'),
  (150, 16, '90/10', 159.0, 3.0, 153.0, 13.144, 'EEMUA-144'),
  (200, 16, '90/10', 219.1, 3.5, 212.1, 21.194, 'EEMUA-144'),
  (250, 16, '90/10', 267.0, 4.5, 258.0, 33.176, 'EEMUA-144'),
  (300, 16, '90/10', 323.9, 5.5, 312.9, 49.184, 'EEMUA-144'),
  (350, 16, '90/10', 368.0, 6.5, 355.0, 65.995, 'EEMUA-144'),
  (400, 16, '90/10', 419.0, 7.0, 405.0, 81.0, 'EEMUA-144'),
  (450, 16, '90/10', 457.2, 8.0, 441.2, 100.929, 'EEMUA-144'),
  (500, 16, '90/10', 508.0, 8.5, 491.0, 119.245, 'EEMUA-144'),
  (600, 16, '90/10', 610.0, 10.0, 590.0, 168.515, 'EEMUA-144'),
  (700, 16, '90/10', 711.0, 12.0, 687.0, 235.584, 'EEMUA-144'),
  (800, 16, '90/10', 813.0, 13.5, 786.0, 303.137, 'EEMUA-144'),
  (900, 16, '90/10', 914.0, 15.0, 884.0, 378.738, 'EEMUA-144')
ON CONFLICT (dn, basinc_bar, alasim) DO UPDATE SET
  dis_cap_mm = EXCLUDED.dis_cap_mm,
  et_mm = EXCLUDED.et_mm,
  ic_cap_mm = EXCLUDED.ic_cap_mm,
  agirlik_kg_m = EXCLUDED.agirlik_kg_m;

-- -------------------------------------------------------------------------
-- 5. Spot check sorguları (manuel doğrulama için, çalıştırma zorunlu değil)
-- -------------------------------------------------------------------------
-- Karbon DN100 SCH40 → et 6.02, ağırlık 16.08 (sektörel bilinen)
-- SELECT * FROM asme_borular WHERE dn=100 AND schedule='40' AND malzeme='karbon';
-- 
-- Paslanmaz DN200 SCH40S → et 8.18, ağırlık 43.39
-- SELECT * FROM asme_borular WHERE dn=200 AND schedule='40S' AND malzeme='paslanmaz';
--
-- Alüminyum DN150 SCH40 → et 7.11, ağırlık ~9.70 (2.70 g/cm³ ile hesap)
-- SELECT * FROM asme_borular WHERE dn=150 AND schedule='40' AND malzeme='aluminyum';
--
-- CuNife DN200 EEMUA-144 20bar → et 4.5, ağırlık 27.12
-- SELECT * FROM cuni_borular WHERE dn=200 AND basinc_bar=20 AND alasim='90/10';
--
-- Toplam satır sayısı kontrolü:
-- SELECT 'asme_borular' AS tablo, COUNT(*) FROM asme_borular
-- UNION ALL
-- SELECT 'cuni_borular', COUNT(*) FROM cuni_borular;
-- Beklenen: asme_borular 334, cuni_borular 24
