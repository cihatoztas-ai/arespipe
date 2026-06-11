-- =====================================================================
-- Migration 006a -- Endustri Malzeme Eslesme (Yapi)
-- =====================================================================
-- Tarih: 27 Nisan 2026 -- 37. oturum
-- Konu: MILFIT BORU 2024 baslucu kartinin DB transferi (1/2 - yapi)
-- Idempotent: tekrar calistirilabilir.
-- =====================================================================

-- A1. Urun Formlari Sozlugu
CREATE TABLE IF NOT EXISTS endustri_urun_formlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kod TEXT NOT NULL UNIQUE,
  ad_tr TEXT NOT NULL,
  ad_en TEXT NOT NULL,
  aciklama TEXT,
  hub_aciklama TEXT,
  sirala INT NOT NULL DEFAULT 0,
  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A2. Ana Malzeme Tablosu
CREATE TABLE IF NOT EXISTS endustri_malzemeler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  en_kodu TEXT NOT NULL,
  werkstoff_no TEXT,
  eski_din_kodu TEXT,
  malzeme_grubu TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  hub_aciklama TEXT,
  sektor_notu TEXT,
  kaynak TEXT NOT NULL DEFAULT 'milfit-2024',
  dogrulama_durumu TEXT NOT NULL DEFAULT 'dogrulanmadi'
    CHECK (dogrulama_durumu IN ('dogrulanmadi','dogrulandi','dogrulama_bekliyor','revize_gerekli')),
  notlar TEXT,
  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (en_kodu, werkstoff_no)
);

-- A3. Form-ASTM Eslesme
CREATE TABLE IF NOT EXISTS endustri_form_astm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  malzeme_id UUID NOT NULL REFERENCES endustri_malzemeler(id) ON DELETE CASCADE,
  urun_formu TEXT NOT NULL REFERENCES endustri_urun_formlari(kod) ON UPDATE CASCADE,
  astm_kodu TEXT NOT NULL,
  astm_grade TEXT,
  uns_kodu TEXT,
  notlar TEXT,
  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (malzeme_id, urun_formu, astm_kodu)
);

-- A4. boru_olculer kolonu
ALTER TABLE boru_olculer ADD COLUMN IF NOT EXISTS urun_formu TEXT NOT NULL DEFAULT 'boru';

-- Indexler
CREATE INDEX IF NOT EXISTS idx_malzemeler_grubu ON endustri_malzemeler(malzeme_grubu);
CREATE INDEX IF NOT EXISTS idx_malzemeler_en_kodu ON endustri_malzemeler(en_kodu);
CREATE INDEX IF NOT EXISTS idx_malzemeler_werkstoff ON endustri_malzemeler(werkstoff_no);
CREATE INDEX IF NOT EXISTS idx_malzemeler_slug ON endustri_malzemeler(slug);
CREATE INDEX IF NOT EXISTS idx_form_astm_malzeme ON endustri_form_astm(malzeme_id);
CREATE INDEX IF NOT EXISTS idx_form_astm_form ON endustri_form_astm(urun_formu);
CREATE INDEX IF NOT EXISTS idx_form_astm_astm ON endustri_form_astm(astm_kodu);
CREATE INDEX IF NOT EXISTS idx_form_astm_grade ON endustri_form_astm(astm_grade);

-- RLS
ALTER TABLE endustri_urun_formlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE endustri_malzemeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE endustri_form_astm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS urun_formlari_select ON endustri_urun_formlari;
CREATE POLICY urun_formlari_select ON endustri_urun_formlari FOR SELECT USING (true);

DROP POLICY IF EXISTS urun_formlari_admin ON endustri_urun_formlari;
CREATE POLICY urun_formlari_admin ON endustri_urun_formlari FOR ALL USING (
  EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);

DROP POLICY IF EXISTS malzemeler_select ON endustri_malzemeler;
CREATE POLICY malzemeler_select ON endustri_malzemeler FOR SELECT USING (true);

DROP POLICY IF EXISTS malzemeler_admin ON endustri_malzemeler;
CREATE POLICY malzemeler_admin ON endustri_malzemeler FOR ALL USING (
  EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);

DROP POLICY IF EXISTS form_astm_select ON endustri_form_astm;
CREATE POLICY form_astm_select ON endustri_form_astm FOR SELECT USING (true);

DROP POLICY IF EXISTS form_astm_admin ON endustri_form_astm;
CREATE POLICY form_astm_admin ON endustri_form_astm FOR ALL USING (
  EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);

-- Dogrulama: 3 yeni tablo + boru_olculer kolonu
SELECT 'endustri_urun_formlari' AS tablo, COUNT(*) AS satir FROM endustri_urun_formlari
UNION ALL SELECT 'endustri_malzemeler', COUNT(*) FROM endustri_malzemeler
UNION ALL SELECT 'endustri_form_astm', COUNT(*) FROM endustri_form_astm
UNION ALL SELECT 'boru_olculer (boru)', COUNT(*) FROM boru_olculer WHERE urun_formu = 'boru';
-- Beklenen: 0 / 0 / 0 / 358
