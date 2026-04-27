-- migrations/36-oturum-standart-mimari.sql
-- AresPipe — Çok-Standartlı Boru Ölçü Mimarisi (TAM SÜRÜM, v2)
--
-- DÜZELTME (v2): Kolon adları 35'in convention'ına uyduruldu:
--   od_mm       → dis_cap_mm
--   olusturma   → olusturma_at
--
-- TASARIM PRENSİPLERİ (8 madde):
--   1. Tablo adı net: "boru_olculer" (fitting/flanş ileride ayrı tabloda)
--   2. Standart sözlüğü zenginleştirildi: ölçü sistemi + DN sistemi + materyal kodu
--   3. NPS↔DN eşleme ayrı tabloda (standart bazlı, hardcoded değil)
--   4. Schedule iki kolona ayrıldı: tipi (SCH/PN/BAR/GRADE/CLASS) + değeri
--   5. Tolerans alanları (et_min/et_max generated, tolerans %'si standart bazlı)
--   6. Edisyon yılı + geçerlilik tarihleri (eski/yeni edisyon takibi)
--   7. İç çap, hacim, yüzey alanı GENERATED kolonlar (hesap helper'da değil)
--   8. Hub için slug + açıklama + kullanım sektörü (SEO/lead gen hazır)
--
-- GÜVENLİK: Eski "asme_borular" ve "cuni_borular" tablolarına DOKUNULMAZ.
-- 35 helper'ı kırılmaz.

BEGIN;

-- =============================================================================
-- TEMİZLEME (rerunnable migration için — eski tabloya dokunmaz)
-- =============================================================================
DROP TABLE IF EXISTS boru_dn_isim_eslesme CASCADE;
DROP TABLE IF EXISTS boru_olculer CASCADE;
DROP TABLE IF EXISTS boru_standart_sozluk CASCADE;

-- =============================================================================
-- 1. STANDART SÖZLÜĞÜ
-- =============================================================================

CREATE TABLE boru_standart_sozluk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standart TEXT NOT NULL UNIQUE,
  ad TEXT NOT NULL,
  ulke TEXT,

  -- (Madde 2)
  olcu_sistemi TEXT NOT NULL DEFAULT 'metric',
  dn_sistemi TEXT NOT NULL DEFAULT 'DN',
  malzeme_grubu_default TEXT,
  materyal_kodu_listesi JSONB,
  pdf_anahtar_kelime TEXT[],

  -- (Madde 6)
  son_edisyon_yili INT,
  son_edisyon_tarihi DATE,

  -- (Madde 8)
  slug TEXT UNIQUE,
  aciklama_tr TEXT,
  aciklama_en TEXT,
  kullanim_sektor TEXT[],

  aktif BOOLEAN DEFAULT true,
  veri_var BOOLEAN DEFAULT false,
  olusturma_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO boru_standart_sozluk (
  standart, ad, ulke,
  olcu_sistemi, dn_sistemi, malzeme_grubu_default, materyal_kodu_listesi, pdf_anahtar_kelime,
  son_edisyon_yili, son_edisyon_tarihi,
  slug, aciklama_tr, aciklama_en, kullanim_sektor,
  veri_var
) VALUES
  ('ASME-B36.10M',
   'ASME B36.10M Welded and Seamless Wrought Steel Pipe', 'US',
   'metric', 'NPS', 'karbon',
   '["A106","A53","API 5L","ST37","S235","P235GH","P265GH"]'::JSONB,
   ARRAY['ASME B36.10','B36.10M','API 5L','A106','A53'],
   2018, '2018-10-15',
   'asme-b36-10m',
   'ABD karbon çelik kaynaklı ve dikişsiz boru standardı. Petrokimya, enerji ve tersane sektörlerinde dünyada en yaygın kullanılan standart.',
   'US standard for welded and seamless carbon steel pipes. Most widely used standard worldwide for petrochemical, power and shipbuilding industries.',
   ARRAY['tersane','petrokimya','enerji','genel_endustri'],
   true),

  ('ASME-B36.19M',
   'ASME B36.19M Stainless Steel Pipe', 'US',
   'metric', 'NPS', 'paslanmaz',
   '["A312","TP316","TP316L","TP304","TP304L","TP321"]'::JSONB,
   ARRAY['ASME B36.19','B36.19M','A312','TP316','TP304'],
   2018, '2018-10-15',
   'asme-b36-19m',
   'ABD paslanmaz çelik boru standardı. Gıda, kimya, farma ve denizcilik uygulamalarında.',
   'US standard for stainless steel pipes. Used in food, chemical, pharmaceutical and marine applications.',
   ARRAY['gida','kimya','farma','tersane'],
   true),

  ('ASTM-B241',
   'ASTM B241/B241M Aluminum-Alloy Seamless Pipe and Tube', 'US',
   'metric', 'NPS', 'aluminyum',
   '["6061","6063","6061-T6","5083","5086"]'::JSONB,
   ARRAY['ASTM B241','B241','6061','6063'],
   2016, '2016-04-01',
   'astm-b241',
   'ABD alüminyum alaşımlı dikişsiz boru standardı. Hafif yapı, denizcilik ve havacılık.',
   'US standard for seamless aluminum alloy pipes. Lightweight structures, marine and aerospace applications.',
   ARRAY['havacilik','tersane','kimya','hafif_yapi'],
   true),

  ('EEMUA-144',
   'EEMUA Pub. 144 90/10 Cu-Ni Pipe and Fittings', 'UK',
   'metric', 'DN', 'cunife',
   '["CuNi 90/10","CuNi 70/30","CW352H","CW354H"]'::JSONB,
   ARRAY['EEMUA 144','EEMUA-144','CuNi 90/10','CuNi 70/30','CuNife'],
   1987, '1987-01-01',
   'eemua-144',
   'İngiltere kaynaklı bakır-nikel alaşımlı boru standardı. Deniz suyu sistemleri için tersane ve açık deniz platformlarında.',
   'UK standard for 90/10 copper-nickel pipes. Used for seawater systems in shipbuilding and offshore platforms.',
   ARRAY['tersane','denizcilik','acik_deniz','enerji_santralleri'],
   true),

  ('DIN-2448', 'DIN 2448 Seamless Steel Tubes (1981, withdrawn — replaced by EN 10220)', 'DE',
   'metric', 'DN', 'karbon',
   '["St37","St52","P235GH","P265GH"]'::JSONB,
   ARRAY['DIN 2448','DIN2448'], 1981, '1981-09-01',
   'din-2448',
   'Eski Alman dikişsiz çelik boru standardı (1995''te geri çekildi, EN 10220 ile değiştirildi). Halen sektörde yaygın kullanımda.',
   'Old German seamless steel pipe standard (withdrawn in 1995, replaced by EN 10220). Still widely used in industry.',
   ARRAY['tersane','genel_endustri'], false),

  ('EN-10220', 'EN 10220 Seamless and Welded Steel Tubes — Dimensions and Masses', 'EU',
   'metric', 'DN', 'karbon',
   '["P235GH","P265GH","P355GH","S235JR"]'::JSONB,
   ARRAY['EN 10220','EN10220'], 2002, '2002-11-01',
   'en-10220',
   'Avrupa dikişsiz ve kaynaklı çelik boru ölçü standardı (DIN 2448''in halefi).',
   'European seamless and welded steel pipe dimensional standard (successor to DIN 2448).',
   ARRAY['tersane','petrokimya','genel_endustri'], false),

  ('JIS-G3452', 'JIS G3452 Carbon Steel Pipes for Ordinary Piping (SGP)', 'JP',
   'metric', 'DN', 'karbon',
   '["SGP"]'::JSONB,
   ARRAY['JIS G3452','JIS-G3452','SGP'], 2019, '2019-03-20',
   'jis-g3452',
   'Japon karbon çelik genel amaçlı boru standardı.',
   'Japanese carbon steel pipe standard for ordinary piping.',
   ARRAY['tersane','genel_endustri'], false),

  ('JIS-G3454', 'JIS G3454 Carbon Steel Pipes for Pressure Service (STPG)', 'JP',
   'metric', 'DN', 'karbon',
   '["STPG370","STPG410"]'::JSONB,
   ARRAY['JIS G3454','STPG'], 2019, '2019-03-20',
   'jis-g3454',
   'Japon basınç servisi için karbon çelik boru standardı.',
   'Japanese carbon steel pipe standard for pressure service.',
   ARRAY['tersane','enerji','petrokimya'], false),

  ('GOST-3262', 'GOST 3262-75 Steel Water-Gas Pipes', 'RU',
   'metric', 'NS', 'karbon',
   '["Ст3","Ст10","Ст20"]'::JSONB,
   ARRAY['GOST 3262','ГОСТ 3262'], 1975, '1975-01-01',
   'gost-3262',
   'Rus su ve gaz boruları standardı.',
   'Russian standard for water and gas steel pipes.',
   ARRAY['genel_endustri'], false),

  ('GOST-8732', 'GOST 8732-78 Seamless Hot-Deformed Steel Pipes', 'RU',
   'metric', 'NS', 'karbon',
   '["Ст10","Ст20","Ст35","Ст45"]'::JSONB,
   ARRAY['GOST 8732','ГОСТ 8732'], 1978, '1978-01-01',
   'gost-8732',
   'Rus dikişsiz sıcak şekillendirilmiş çelik boru standardı.',
   'Russian standard for seamless hot-deformed steel pipes.',
   ARRAY['petrokimya','enerji'], false),

  ('GB/T-3091', 'GB/T 3091 Welded Steel Pipes for Low Pressure Liquid Delivery', 'CN',
   'metric', 'DN', 'karbon',
   '["Q195","Q215","Q235"]'::JSONB,
   ARRAY['GB/T 3091','GB 3091'], 2015, '2015-09-11',
   'gb-t-3091',
   'Çin alçak basınç sıvı iletim için kaynaklı çelik boru standardı.',
   'Chinese standard for welded steel pipes used in low pressure liquid delivery.',
   ARRAY['genel_endustri','tersane'], false),

  ('GB/T-8163', 'GB/T 8163 Seamless Steel Tubes for Liquid Service', 'CN',
   'metric', 'DN', 'karbon',
   '["10","20","Q345B"]'::JSONB,
   ARRAY['GB/T 8163','GB 8163'], 2018, '2018-12-28',
   'gb-t-8163',
   'Çin sıvı servisi için dikişsiz çelik boru standardı.',
   'Chinese standard for seamless steel pipes for liquid service.',
   ARRAY['petrokimya','enerji','tersane'], false);

-- =============================================================================
-- 2. ANA TABLO: BORU ÖLÇÜLERİ
-- =============================================================================

CREATE TABLE boru_olculer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  standart TEXT NOT NULL,
  malzeme_grubu TEXT NOT NULL,
  dn INT NOT NULL,

  -- (Madde 4) Schedule iki bileşene ayrıldı
  schedule_tipi TEXT NOT NULL,                  -- 'SCH' | 'PN' | 'BAR' | 'GRADE' | 'CLASS'
  schedule_deger TEXT NOT NULL,                 -- '40' | 'STD' | '10S' | '20' | 'X52'
  schedule_kod TEXT NOT NULL,                   -- görüntüleme: 'SCH40' | 'STD' | '20bar'

  dis_cap_mm DECIMAL(10,3) NOT NULL,            -- dış çap (35 convention)
  et_mm DECIMAL(10,3) NOT NULL,
  agirlik_kg_m DECIMAL(10,3) NOT NULL,

  -- (Madde 5) Tolerans
  tolerans_et_yuzde DECIMAL(5,2) DEFAULT 12.5,
  tolerans_agirlik_yuzde DECIMAL(5,2) DEFAULT 10.0,
  et_min_mm DECIMAL(10,3) GENERATED ALWAYS AS
    (ROUND(et_mm * (1 - COALESCE(tolerans_et_yuzde, 12.5) / 100.0), 3)) STORED,
  et_max_mm DECIMAL(10,3) GENERATED ALWAYS AS
    (ROUND(et_mm * (1 + COALESCE(tolerans_et_yuzde, 12.5) / 100.0), 3)) STORED,

  -- (Madde 7) Hesaplı ölçüler
  ic_cap_mm DECIMAL(10,3) GENERATED ALWAYS AS
    (dis_cap_mm - 2 * et_mm) STORED,
  hacim_l_m DECIMAL(10,4) GENERATED ALWAYS AS
    (ROUND((PI() * POWER((dis_cap_mm - 2 * et_mm) / 2, 2) / 1000)::NUMERIC, 4)) STORED,
  yuzey_alan_dis_m2_m DECIMAL(10,4) GENERATED ALWAYS AS
    (ROUND((PI() * dis_cap_mm / 1000)::NUMERIC, 4)) STORED,

  -- (Madde 6) Edisyon
  edisyon_yili INT,
  gecerlilik_basla DATE,
  gecerlilik_bitis DATE,

  kaynak TEXT,
  notlar TEXT,
  olusturma_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(standart, malzeme_grubu, dn, schedule_tipi, schedule_deger)
);

CREATE INDEX idx_boru_olculer_lookup   ON boru_olculer(standart, malzeme_grubu, dn);
CREATE INDEX idx_boru_olculer_kod      ON boru_olculer(standart, malzeme_grubu, dn, schedule_kod);
CREATE INDEX idx_boru_olculer_dn       ON boru_olculer(dn);
CREATE INDEX idx_boru_olculer_standart ON boru_olculer(standart);

COMMENT ON TABLE boru_olculer IS
  'Çok standartlı boru dimensional veritabanı (boru için, fitting/flanş ayrı tablolar).';
COMMENT ON COLUMN boru_olculer.schedule_tipi IS
  'SCH (ASME), PN (DIN/EN), BAR (EEMUA), GRADE (API), CLASS (ASME flanş)';
COMMENT ON COLUMN boru_olculer.ic_cap_mm IS 'GENERATED: dis_cap - 2*et';
COMMENT ON COLUMN boru_olculer.hacim_l_m IS 'GENERATED: PI*(IC/2)^2 / 1000 (litre/metre)';
COMMENT ON COLUMN boru_olculer.yuzey_alan_dis_m2_m IS 'GENERATED: PI*dis_cap/1000 (dış yüzey)';

-- =============================================================================
-- 3. NPS ↔ DN İSİM EŞLEME
-- =============================================================================

CREATE TABLE boru_dn_isim_eslesme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standart TEXT NOT NULL,
  dn INT NOT NULL,
  yerel_isim TEXT NOT NULL,
  birincil BOOLEAN DEFAULT false,
  UNIQUE(standart, yerel_isim)
);

CREATE INDEX idx_dn_eslesme_standart_dn ON boru_dn_isim_eslesme(standart, dn);
CREATE INDEX idx_dn_eslesme_isim        ON boru_dn_isim_eslesme(yerel_isim);

INSERT INTO boru_dn_isim_eslesme (standart, dn, yerel_isim, birincil) VALUES
  ('ASME-B36.10M', 15,  '1/2',     true),
  ('ASME-B36.10M', 15,  '1/2"',    false),
  ('ASME-B36.10M', 15,  'NPS 1/2', false),
  ('ASME-B36.10M', 20,  '3/4',     true),
  ('ASME-B36.10M', 20,  '3/4"',    false),
  ('ASME-B36.10M', 20,  'NPS 3/4', false),
  ('ASME-B36.10M', 25,  '1',       true),
  ('ASME-B36.10M', 25,  '1"',      false),
  ('ASME-B36.10M', 25,  'NPS 1',   false),
  ('ASME-B36.10M', 32,  '1 1/4',     true),
  ('ASME-B36.10M', 32,  '1 1/4"',    false),
  ('ASME-B36.10M', 32,  '1-1/4',     false),
  ('ASME-B36.10M', 32,  'NPS 1 1/4', false),
  ('ASME-B36.10M', 40,  '1 1/2',     true),
  ('ASME-B36.10M', 40,  '1 1/2"',    false),
  ('ASME-B36.10M', 40,  '1-1/2',     false),
  ('ASME-B36.10M', 40,  'NPS 1 1/2', false),
  ('ASME-B36.10M', 50,  '2',     true),
  ('ASME-B36.10M', 50,  '2"',    false),
  ('ASME-B36.10M', 50,  'NPS 2', false),
  ('ASME-B36.10M', 65,  '2 1/2',     true),
  ('ASME-B36.10M', 65,  '2 1/2"',    false),
  ('ASME-B36.10M', 65,  '2-1/2',     false),
  ('ASME-B36.10M', 65,  'NPS 2 1/2', false),
  ('ASME-B36.10M', 80,  '3',     true),
  ('ASME-B36.10M', 80,  '3"',    false),
  ('ASME-B36.10M', 80,  'NPS 3', false),
  ('ASME-B36.10M', 100, '4',     true),
  ('ASME-B36.10M', 100, '4"',    false),
  ('ASME-B36.10M', 100, 'NPS 4', false),
  ('ASME-B36.10M', 125, '5',     true),
  ('ASME-B36.10M', 125, '5"',    false),
  ('ASME-B36.10M', 125, 'NPS 5', false),
  ('ASME-B36.10M', 150, '6',     true),
  ('ASME-B36.10M', 150, '6"',    false),
  ('ASME-B36.10M', 150, 'NPS 6', false),
  ('ASME-B36.10M', 200, '8',     true),
  ('ASME-B36.10M', 200, '8"',    false),
  ('ASME-B36.10M', 200, 'NPS 8', false),
  ('ASME-B36.10M', 250, '10',     true),
  ('ASME-B36.10M', 250, '10"',    false),
  ('ASME-B36.10M', 250, 'NPS 10', false),
  ('ASME-B36.10M', 300, '12',     true),
  ('ASME-B36.10M', 300, '12"',    false),
  ('ASME-B36.10M', 300, 'NPS 12', false),
  ('ASME-B36.10M', 350, '14',     true),
  ('ASME-B36.10M', 350, '14"',    false),
  ('ASME-B36.10M', 350, 'NPS 14', false),
  ('ASME-B36.10M', 400, '16',     true),
  ('ASME-B36.10M', 400, '16"',    false),
  ('ASME-B36.10M', 400, 'NPS 16', false),
  ('ASME-B36.10M', 450, '18',     true),
  ('ASME-B36.10M', 450, '18"',    false),
  ('ASME-B36.10M', 450, 'NPS 18', false),
  ('ASME-B36.10M', 500, '20',     true),
  ('ASME-B36.10M', 500, '20"',    false),
  ('ASME-B36.10M', 500, 'NPS 20', false),
  ('ASME-B36.10M', 600, '24',     true),
  ('ASME-B36.10M', 600, '24"',    false),
  ('ASME-B36.10M', 600, 'NPS 24', false);

INSERT INTO boru_dn_isim_eslesme (standart, dn, yerel_isim, birincil)
SELECT 'ASME-B36.19M', dn, yerel_isim, birincil FROM boru_dn_isim_eslesme WHERE standart='ASME-B36.10M';

INSERT INTO boru_dn_isim_eslesme (standart, dn, yerel_isim, birincil)
SELECT 'ASTM-B241', dn, yerel_isim, birincil FROM boru_dn_isim_eslesme WHERE standart='ASME-B36.10M';

-- =============================================================================
-- 4. RLS — public read, super_admin write
-- =============================================================================
ALTER TABLE boru_standart_sozluk   ENABLE ROW LEVEL SECURITY;
ALTER TABLE boru_olculer           ENABLE ROW LEVEL SECURITY;
ALTER TABLE boru_dn_isim_eslesme   ENABLE ROW LEVEL SECURITY;

CREATE POLICY boru_standart_sozluk_read   ON boru_standart_sozluk   FOR SELECT USING (true);
CREATE POLICY boru_standart_sozluk_write  ON boru_standart_sozluk   FOR ALL    USING (
  EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);
CREATE POLICY boru_olculer_read           ON boru_olculer           FOR SELECT USING (true);
CREATE POLICY boru_olculer_write          ON boru_olculer           FOR ALL    USING (
  EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);
CREATE POLICY boru_dn_isim_eslesme_read   ON boru_dn_isim_eslesme   FOR SELECT USING (true);
CREATE POLICY boru_dn_isim_eslesme_write  ON boru_dn_isim_eslesme   FOR ALL    USING (
  EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);

-- =============================================================================
-- 5. VERİ GÖÇÜ — 35'in tablolarından
-- =============================================================================

-- asme_borular (334 satır) → boru_olculer
-- 35'teki kolonlar: id, dn, schedule, malzeme, dis_cap_mm, et_mm, ic_cap_mm, agirlik_kg_m, standart, notlar, olusturma_at, guncelleme_at
INSERT INTO boru_olculer (
  standart, malzeme_grubu, dn,
  schedule_tipi, schedule_deger, schedule_kod,
  dis_cap_mm, et_mm, agirlik_kg_m,
  tolerans_et_yuzde,
  edisyon_yili, gecerlilik_basla,
  kaynak
)
SELECT
  CASE
    WHEN malzeme = 'karbon'    THEN 'ASME-B36.10M'
    WHEN malzeme = 'paslanmaz' THEN 'ASME-B36.19M'
    WHEN malzeme = 'aluminyum' THEN 'ASTM-B241'
  END,
  malzeme,
  dn,
  'SCH',
  schedule,
  CASE
    WHEN schedule IN ('STD','XS','XXS') THEN schedule
    WHEN schedule LIKE '%S' THEN schedule
    ELSE 'SCH' || schedule
  END,
  dis_cap_mm, et_mm, agirlik_kg_m,
  12.5,
  CASE
    WHEN malzeme IN ('karbon','paslanmaz') THEN 2018
    WHEN malzeme = 'aluminyum' THEN 2016
  END,
  CASE
    WHEN malzeme IN ('karbon','paslanmaz') THEN '2018-10-15'::DATE
    WHEN malzeme = 'aluminyum' THEN '2016-04-01'::DATE
  END,
  CASE
    WHEN malzeme = 'karbon'    THEN 'ASME B36.10M-2018'
    WHEN malzeme = 'paslanmaz' THEN 'ASME B36.19M-2018'
    WHEN malzeme = 'aluminyum' THEN 'ASTM B241/B241M-2016 (yoğunluk 2.70 g/cm³)'
  END
FROM asme_borular
ON CONFLICT (standart, malzeme_grubu, dn, schedule_tipi, schedule_deger) DO NOTHING;

-- cuni_borular (24 satır) → boru_olculer
-- 35'teki kolonlar: id, dn, basinc_bar, alasim, dis_cap_mm, et_mm, ic_cap_mm, agirlik_kg_m, standart, notlar, olusturma_at, guncelleme_at
INSERT INTO boru_olculer (
  standart, malzeme_grubu, dn,
  schedule_tipi, schedule_deger, schedule_kod,
  dis_cap_mm, et_mm, agirlik_kg_m,
  tolerans_et_yuzde,
  edisyon_yili, gecerlilik_basla,
  kaynak,
  notlar
)
SELECT
  'EEMUA-144', 'cunife', dn,
  'BAR', basinc_bar::TEXT, basinc_bar || 'bar',
  dis_cap_mm, et_mm, agirlik_kg_m,
  12.5,
  1987, '1987-01-01'::DATE,
  'EEMUA Pub. 144 (CuNi 90/10, yoğunluk 8.94 g/cm³)',
  'Alaşım: ' || COALESCE(alasim, 'CuNi 90/10')
FROM cuni_borular
ON CONFLICT (standart, malzeme_grubu, dn, schedule_tipi, schedule_deger) DO NOTHING;

-- =============================================================================
-- 6. DOĞRULAMA
-- =============================================================================
DO $$
DECLARE
  toplam INT;
  asme_b3610 INT; asme_b3619 INT; astm_b241 INT; eemua_144 INT;
  sozluk INT; eslesme INT;
  test_dn100 RECORD;
  test_cunife RECORD;
BEGIN
  SELECT COUNT(*) INTO toplam     FROM boru_olculer;
  SELECT COUNT(*) INTO asme_b3610 FROM boru_olculer WHERE standart='ASME-B36.10M';
  SELECT COUNT(*) INTO asme_b3619 FROM boru_olculer WHERE standart='ASME-B36.19M';
  SELECT COUNT(*) INTO astm_b241  FROM boru_olculer WHERE standart='ASTM-B241';
  SELECT COUNT(*) INTO eemua_144  FROM boru_olculer WHERE standart='EEMUA-144';
  SELECT COUNT(*) INTO sozluk     FROM boru_standart_sozluk;
  SELECT COUNT(*) INTO eslesme    FROM boru_dn_isim_eslesme;

  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '  GOC DOGRULAMA RAPORU';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE 'boru_olculer toplam:        % satir (beklenen 358)', toplam;
  RAISE NOTICE '  ASME-B36.10M (karbon):    % (beklenen 214)', asme_b3610;
  RAISE NOTICE '  ASME-B36.19M (paslanmaz): % (beklenen 70)',  asme_b3619;
  RAISE NOTICE '  ASTM-B241 (aluminyum):    % (beklenen 50)',  astm_b241;
  RAISE NOTICE '  EEMUA-144 (cunife):       % (beklenen 24)',  eemua_144;
  RAISE NOTICE 'boru_standart_sozluk:       % satir (beklenen 12)', sozluk;
  RAISE NOTICE 'boru_dn_isim_eslesme:       % satir (beklenen 171)', eslesme;
  RAISE NOTICE '───────────────────────────────────────────────';

  IF toplam < 350 THEN
    RAISE EXCEPTION 'Goc eksik! boru_olculer = % (en az 350)', toplam;
  END IF;

  SELECT * INTO test_dn100
  FROM boru_olculer
  WHERE standart='ASME-B36.10M' AND dn=100 AND schedule_kod='SCH40';

  RAISE NOTICE 'SPOT CHECK 1: ASME B36.10M DN100 SCH40 karbon';
  RAISE NOTICE '  dis_cap=%  et=%  kg/m=%', test_dn100.dis_cap_mm, test_dn100.et_mm, test_dn100.agirlik_kg_m;
  RAISE NOTICE '  ic_cap=% (beklenen 102.260)', test_dn100.ic_cap_mm;
  RAISE NOTICE '  hacim=% L/m,  yuzey=% m2/m', test_dn100.hacim_l_m, test_dn100.yuzey_alan_dis_m2_m;
  RAISE NOTICE '  et_min=% / et_max=% (+-%%12.5)', test_dn100.et_min_mm, test_dn100.et_max_mm;

  IF test_dn100.dis_cap_mm != 114.300 OR test_dn100.et_mm != 6.020 OR test_dn100.agirlik_kg_m != 16.080 THEN
    RAISE EXCEPTION 'DN100 SCH40 karbon degerleri yanlis!';
  END IF;
  IF test_dn100.ic_cap_mm != 102.260 THEN
    RAISE EXCEPTION 'DN100 SCH40 karbon ic_cap yanlis: %', test_dn100.ic_cap_mm;
  END IF;

  SELECT * INTO test_cunife
  FROM boru_olculer
  WHERE standart='EEMUA-144' AND dn=150 AND schedule_kod='20bar';

  RAISE NOTICE 'SPOT CHECK 2: EEMUA-144 DN150 20bar cunife';
  RAISE NOTICE '  dis_cap=% (beklenen 159 — ASME 168.3 ten farkli)', test_cunife.dis_cap_mm;
  RAISE NOTICE '  et=%  kg/m=%', test_cunife.et_mm, test_cunife.agirlik_kg_m;

  IF test_cunife.dis_cap_mm != 159.000 THEN
    RAISE EXCEPTION 'CuNife DN150 dis_cap yanlis: % (beklenen 159)', test_cunife.dis_cap_mm;
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '  TUM KONTROLLER BASARILI';
  RAISE NOTICE '═══════════════════════════════════════════════';
END $$;

COMMIT;

-- =============================================================================
-- COMMIT SONRASI ELLE ÇALIŞTIRILACAK DOĞRULAMA SORGULARI
-- =============================================================================
-- 1. SELECT standart, COUNT(*) FROM boru_olculer GROUP BY standart ORDER BY standart;
-- 2. SELECT dn, schedule_kod, dis_cap_mm, et_mm, ic_cap_mm, hacim_l_m, yuzey_alan_dis_m2_m, et_min_mm, et_max_mm
--      FROM boru_olculer WHERE standart='ASME-B36.10M' AND dn=100 AND schedule_kod='SCH40';
-- 3. SELECT yerel_isim, birincil FROM boru_dn_isim_eslesme WHERE standart='ASME-B36.10M' AND dn=100 ORDER BY birincil DESC;
-- 4. SELECT standart, ad, veri_var FROM boru_standart_sozluk WHERE 'DIN 2448' = ANY(pdf_anahtar_kelime);
-- 5. SELECT standart, slug, aciklama_tr, kullanim_sektor, materyal_kodu_listesi FROM boru_standart_sozluk WHERE slug='asme-b36-10m';
