-- migrations/36-oturum-izometri-batch-tablolari.sql
-- AresPipe — Izometri Batch Sistemi DB Altyapisi
--
-- 3 tablo: izometri_format_tanimlari, izometri_batch_kayitlari, ai_api_log
-- Mimari: docs/IZOMETRI-BATCH-KARAR.md (Karar 1-10)
--
-- Idempotent: CREATE TABLE IF NOT EXISTS kullanir, tekrar calistirilabilir.
-- Transaction yok (Supabase SQL Editor BEGIN/COMMIT bazi durumlarda reddediyor).

-- =============================================================================
-- 1. izometri_format_tanimlari
-- =============================================================================

CREATE TABLE IF NOT EXISTS izometri_format_tanimlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ad TEXT NOT NULL,
  cad_program TEXT,
  cad_surum TEXT,
  firma_kodu TEXT,

  parser_kural JSONB NOT NULL DEFAULT '{}'::JSONB,
  prompt_template TEXT,
  fingerprint JSONB NOT NULL DEFAULT '{}'::JSONB,
  egitim_kaynagi TEXT NOT NULL DEFAULT 'vision_only',

  tenant_id UUID,

  aktif BOOLEAN NOT NULL DEFAULT true,
  basari_orani DECIMAL(5,2),
  kullanim_sayisi INT NOT NULL DEFAULT 0,
  son_kullanim_at TIMESTAMPTZ,

  olusturan_id UUID,
  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (egitim_kaynagi IN ('vision_only', 'pdf_excel'))
);

CREATE INDEX IF NOT EXISTS idx_format_tenant   ON izometri_format_tanimlari(tenant_id) WHERE aktif = true;
CREATE INDEX IF NOT EXISTS idx_format_cad      ON izometri_format_tanimlari(cad_program);
CREATE INDEX IF NOT EXISTS idx_format_aktif    ON izometri_format_tanimlari(aktif) WHERE aktif = true;
CREATE INDEX IF NOT EXISTS idx_format_kullanim ON izometri_format_tanimlari(kullanim_sayisi DESC) WHERE aktif = true;

-- =============================================================================
-- 2. izometri_batch_kayitlari
-- =============================================================================

CREATE TABLE IF NOT EXISTS izometri_batch_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tenant_id UUID NOT NULL,
  kullanici_id UUID NOT NULL,

  dosya_sayisi INT NOT NULL,
  dosyalar JSONB NOT NULL,

  format_id UUID REFERENCES izometri_format_tanimlari(id) ON DELETE SET NULL,
  format_durumu TEXT NOT NULL DEFAULT 'taraniyor',

  durum TEXT NOT NULL DEFAULT 'yukleniyor',

  sonuc_spool_sayisi INT NOT NULL DEFAULT 0,
  manuel_onay_sayisi INT NOT NULL DEFAULT 0,
  onaylanan_sayisi INT NOT NULL DEFAULT 0,
  reddedilen_sayisi INT NOT NULL DEFAULT 0,

  sonuc_json JSONB,
  dogrulama_uyarilari JSONB,
  hata_detay TEXT,

  ai_cagri_sayisi INT NOT NULL DEFAULT 0,
  toplam_token_input INT NOT NULL DEFAULT 0,
  toplam_token_output INT NOT NULL DEFAULT 0,
  toplam_maliyet_usd DECIMAL(10,4) NOT NULL DEFAULT 0,

  baslangic_at TIMESTAMPTZ,
  bitis_at TIMESTAMPTZ,

  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (durum IN ('yukleniyor','parse_ediliyor','manuel_onay_bekliyor','tamamlandi','iptal','hata')),
  CHECK (format_durumu IN ('taraniyor','taninan','bilinmeyen'))
);

CREATE INDEX IF NOT EXISTS idx_batch_tenant    ON izometri_batch_kayitlari(tenant_id, olusturma_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_kullanici ON izometri_batch_kayitlari(kullanici_id, olusturma_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_durum     ON izometri_batch_kayitlari(durum) WHERE durum IN ('parse_ediliyor','manuel_onay_bekliyor');
CREATE INDEX IF NOT EXISTS idx_batch_format    ON izometri_batch_kayitlari(format_id);
CREATE INDEX IF NOT EXISTS idx_batch_olusturma ON izometri_batch_kayitlari(olusturma_at DESC);

-- =============================================================================
-- 3. ai_api_log
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_api_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tenant_id UUID,
  kullanici_id UUID,
  batch_id UUID REFERENCES izometri_batch_kayitlari(id) ON DELETE SET NULL,
  format_id UUID REFERENCES izometri_format_tanimlari(id) ON DELETE SET NULL,

  kaynak TEXT NOT NULL,
  cagri_tipi TEXT NOT NULL,
  model TEXT NOT NULL,

  input_tokens INT,
  output_tokens INT,
  cache_read_tokens INT,
  cache_write_tokens INT,
  maliyet_usd DECIMAL(10,4),
  sure_ms INT,

  basarili BOOLEAN NOT NULL,
  http_status INT,
  hata_mesaji TEXT,

  istek_kisaltma TEXT,
  cevap_kisaltma TEXT,
  istek_full JSONB,
  cevap_full JSONB,

  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (kaynak IN ('izometri_oku','format_taniyici','b_adim_oneri','genel')),
  CHECK (cagri_tipi IN ('L1_regex','L2_haiku','L3_vision'))
);

CREATE INDEX IF NOT EXISTS idx_ailog_tenant    ON ai_api_log(tenant_id, olusturma_at DESC);
CREATE INDEX IF NOT EXISTS idx_ailog_kullanici ON ai_api_log(kullanici_id, olusturma_at DESC);
CREATE INDEX IF NOT EXISTS idx_ailog_batch     ON ai_api_log(batch_id);
CREATE INDEX IF NOT EXISTS idx_ailog_basarisiz ON ai_api_log(olusturma_at DESC) WHERE basarili = false;
CREATE INDEX IF NOT EXISTS idx_ailog_aylik     ON ai_api_log(tenant_id, olusturma_at) WHERE basarili = true;

-- =============================================================================
-- 4. RLS — Tenant izolasyonu
-- =============================================================================

ALTER TABLE izometri_format_tanimlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE izometri_batch_kayitlari  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_log                ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS format_tanimlari_read  ON izometri_format_tanimlari;
DROP POLICY IF EXISTS format_tanimlari_write ON izometri_format_tanimlari;
DROP POLICY IF EXISTS batch_kayitlari_select ON izometri_batch_kayitlari;
DROP POLICY IF EXISTS batch_kayitlari_write  ON izometri_batch_kayitlari;
DROP POLICY IF EXISTS ai_api_log_select      ON ai_api_log;
DROP POLICY IF EXISTS ai_api_log_insert      ON ai_api_log;

CREATE POLICY format_tanimlari_read ON izometri_format_tanimlari
  FOR SELECT USING (
    tenant_id IS NULL
    OR tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
  );

CREATE POLICY format_tanimlari_write ON izometri_format_tanimlari
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
  );

CREATE POLICY batch_kayitlari_select ON izometri_batch_kayitlari
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
  );

CREATE POLICY batch_kayitlari_write ON izometri_batch_kayitlari
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
  );

CREATE POLICY ai_api_log_select ON ai_api_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
  );

CREATE POLICY ai_api_log_insert ON ai_api_log
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 5. Pilot format — AVEVA E3D PAOR
-- =============================================================================
-- parser_kural ve prompt_template BOS — 37 oturumunda Format Kaydet ile dolacak.
-- Sadece fingerprint dolu, PAOR PDF yuklenince taninir, parse Vision'a duser.

INSERT INTO izometri_format_tanimlari (
  ad, cad_program, cad_surum, firma_kodu,
  parser_kural, prompt_template, fingerprint,
  egitim_kaynagi, tenant_id, aktif
)
SELECT
  'AVEVA E3D - Portuguese Navy AOR (PAOR)',
  'AVEVA E3D',
  '2.x',
  'PAOR',
  '{}'::JSONB,
  NULL,
  '{
    "pdf_uretici_anahtar": ["AVEVA","STM"],
    "baslik_regex": "PORTUGUESE NAVY AOR",
    "dosya_adi_regex": "^11D-PAOR-\\d{5}-\\d{6}-[A-Z0-9]+\\.pdf$",
    "ulke": "PT",
    "tersane": "STM"
  }'::JSONB,
  'vision_only',
  NULL,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM izometri_format_tanimlari WHERE firma_kodu = 'PAOR'
);
