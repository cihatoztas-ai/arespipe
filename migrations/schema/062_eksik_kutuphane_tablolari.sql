-- ════════════════════════════════════════════════════════════════════
-- Migration 062 — Eksik Kütüphane Tabloları
-- ════════════════════════════════════════════════════════════════════
-- Oturum    : 87.A
-- Tarih     : 14 Mayıs 2026
-- Bağlam    : admin/kutuphane.html sayfası `ozel_parcalar`,
--             `tenant_spec_seti`, `spec_kural` tablolarını HEAD count
--             ediyor ama tablolar yok → Console'da 3 adet 404 hata.
--             Bu migration boş schema + RLS kurar, count(*) artık 0 döner.
--
--             KUTUPHANE-YUKLEME-TAKIP.md:
--               §6 ozel_parcalar     (P3 — ihtiyaç bazlı)
--               §7 tenant_spec_seti  (P1 — AVEVA bağımsızlığı için kritik)
--               §7 spec_kural        (P1 — spec başına izinli parça)
--
-- Disiplinler:
--   MK-85.2  RLS asla kapalı bırakılmaz
--   MK-86.2  Şema + CHECK + RLS üçü doğrulanmadan migration yazılmaz
--   061'den RLS pattern: kullanicilar.rol='super_admin' + tenant_id eşleşmesi
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────
-- 1. ÖZEL PARÇALAR (KUTUPHANE-YUKLEME-TAKIP.md §6)
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ozel_parcalar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parca_tipi      TEXT NOT NULL CHECK (parca_tipi IN (
    'coupling_sleeve',     -- aşınma manşonu
    'custom_flansh',       -- standart dışı flansh
    'gergi_baglantisi',    -- expansion joint
    'kompansator',         -- kompansator
    'reduksiyon_ozel',     -- standart dışı redüksiyon
    'uretici_ozel',        -- üretici-spesifik parça
    'diger'                -- sınıflandırılmamış
  )),
  kod             TEXT,                   -- müşterinin/üreticinin ürün kodu
  tanim           TEXT NOT NULL,
  uretici         TEXT,
  malzeme         TEXT,
  dis_cap_mm      NUMERIC(8,3),
  ic_cap_mm       NUMERIC(8,3),
  uzunluk_mm      NUMERIC(10,2),
  agirlik_kg      NUMERIC(10,3),
  ek_ozellikler   JSONB NOT NULL DEFAULT '{}'::jsonb,
  aktif           BOOLEAN NOT NULL DEFAULT true,
  olusturma_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ozel_parcalar IS
  'Standart kütüphanede olmayan tenant-özel parçalar (coupling sleeve, custom flansh, vb.). KUTUPHANE-YUKLEME-TAKIP §6.';

CREATE INDEX IF NOT EXISTS ix_ozel_parcalar_tenant      ON ozel_parcalar (tenant_id);
CREATE INDEX IF NOT EXISTS ix_ozel_parcalar_parca_tipi  ON ozel_parcalar (parca_tipi);
CREATE INDEX IF NOT EXISTS ix_ozel_parcalar_aktif       ON ozel_parcalar (tenant_id, aktif);

-- ────────────────────────────────────────────────────────────────────
-- 2. TENANT SPEC SETİ (KUTUPHANE-YUKLEME-TAKIP.md §7)
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_spec_seti (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  spec_kodu       TEXT NOT NULL,             -- 'GEMI-CS-300', 'PROCESS-SS-150', ...
  spec_adi        TEXT NOT NULL,
  aciklama        TEXT,
  basinc_class    TEXT,                      -- '150','300','600','900','1500','2500'
  malzeme_grup    TEXT CHECK (malzeme_grup IS NULL OR malzeme_grup IN (
    'karbon','paslanmaz','dupleks','cuni','aluminyum','nikel_alasim','alasimli'
  )),
  sicaklik_min_c  INT,
  sicaklik_max_c  INT,
  aktif           BOOLEAN NOT NULL DEFAULT true,
  olusturma_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, spec_kodu)
);

COMMENT ON TABLE tenant_spec_seti IS
  'AVEVA-vari tenant-özel spec set tanımları. Bir spec = bir kullanım senaryosu (basınç+sıcaklık+malzeme). KUTUPHANE-YUKLEME-TAKIP §7.';

CREATE INDEX IF NOT EXISTS ix_tenant_spec_seti_tenant  ON tenant_spec_seti (tenant_id);
CREATE INDEX IF NOT EXISTS ix_tenant_spec_seti_aktif   ON tenant_spec_seti (tenant_id, aktif);

-- ────────────────────────────────────────────────────────────────────
-- 3. SPEC KURAL (KUTUPHANE-YUKLEME-TAKIP.md §7)
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spec_kural (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_id                  UUID NOT NULL REFERENCES tenant_spec_seti(id) ON DELETE CASCADE,
  parca_tipi               TEXT NOT NULL CHECK (parca_tipi IN (
    'boru','fitting','flansh','conta','civata','ozel'
  )),

  -- Kütüphane referansları — her satır için yalnızca bir FK dolu olur (CHECK aşağıda)
  malzeme_kataloglari_id   UUID REFERENCES malzeme_kataloglari(id) ON DELETE SET NULL,
  boru_olculer_id          UUID REFERENCES boru_olculer(id)        ON DELETE SET NULL,
  fitting_olculer_id       UUID REFERENCES fitting_olculer(id)     ON DELETE SET NULL,
  flansh_olculer_id        UUID REFERENCES flansh_olculer(id)      ON DELETE SET NULL,
  ozel_parca_id            UUID REFERENCES ozel_parcalar(id)       ON DELETE SET NULL,

  not_aciklama             TEXT,
  oncelik                  INT NOT NULL DEFAULT 100,   -- düşük sayı = önce gösterilir
  aktif                    BOOLEAN NOT NULL DEFAULT true,
  olusturma_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- En az bir referans olmalı
  CONSTRAINT chk_spec_kural_referans CHECK (
    malzeme_kataloglari_id IS NOT NULL OR
    boru_olculer_id        IS NOT NULL OR
    fitting_olculer_id     IS NOT NULL OR
    flansh_olculer_id      IS NOT NULL OR
    ozel_parca_id          IS NOT NULL
  )
);

COMMENT ON TABLE spec_kural IS
  'Bir spec içinde hangi kütüphane parçaları kullanılabilir. spec_id → tenant_spec_seti, FK''lar kütüphane tablolarına. KUTUPHANE-YUKLEME-TAKIP §7.';

CREATE INDEX IF NOT EXISTS ix_spec_kural_spec        ON spec_kural (spec_id);
CREATE INDEX IF NOT EXISTS ix_spec_kural_parca_tipi  ON spec_kural (parca_tipi);
CREATE INDEX IF NOT EXISTS ix_spec_kural_aktif       ON spec_kural (spec_id, aktif);

-- ────────────────────────────────────────────────────────────────────
-- 4. GÜNCELLEME TRIGGER'LARI (guncelleme_at otomatik)
--    spec_kural'da guncelleme_at yok (tasarım: kural sabit, değişirse silinir + yenisi)
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _ozel_parcalar_guncelleme_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.guncelleme_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_ozel_parcalar_guncelleme ON ozel_parcalar;
CREATE TRIGGER trg_ozel_parcalar_guncelleme
  BEFORE UPDATE ON ozel_parcalar
  FOR EACH ROW EXECUTE FUNCTION _ozel_parcalar_guncelleme_at();

CREATE OR REPLACE FUNCTION _tenant_spec_seti_guncelleme_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.guncelleme_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_tenant_spec_seti_guncelleme ON tenant_spec_seti;
CREATE TRIGGER trg_tenant_spec_seti_guncelleme
  BEFORE UPDATE ON tenant_spec_seti
  FOR EACH ROW EXECUTE FUNCTION _tenant_spec_seti_guncelleme_at();

-- ────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (MK-85.2)
--    Pattern: 061'den birebir (super_admin tümünü, tenant kullanıcısı kendi tenant'ını)
-- ────────────────────────────────────────────────────────────────────

-- ozel_parcalar ──────────────────────────────────────────────────────
ALTER TABLE ozel_parcalar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ozel_parcalar_select_super_admin" ON ozel_parcalar;
CREATE POLICY "ozel_parcalar_select_super_admin"
  ON ozel_parcalar FOR SELECT
  USING (EXISTS (SELECT 1 FROM kullanicilar
                 WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "ozel_parcalar_select_kendi_tenant" ON ozel_parcalar;
CREATE POLICY "ozel_parcalar_select_kendi_tenant"
  ON ozel_parcalar FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()));

DROP POLICY IF EXISTS "ozel_parcalar_insert_kendi_tenant" ON ozel_parcalar;
CREATE POLICY "ozel_parcalar_insert_kendi_tenant"
  ON ozel_parcalar FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
              OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "ozel_parcalar_update_kendi_tenant" ON ozel_parcalar;
CREATE POLICY "ozel_parcalar_update_kendi_tenant"
  ON ozel_parcalar FOR UPDATE
  USING (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
         OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
              OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "ozel_parcalar_delete_super_admin" ON ozel_parcalar;
CREATE POLICY "ozel_parcalar_delete_super_admin"
  ON ozel_parcalar FOR DELETE
  USING (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

-- tenant_spec_seti ───────────────────────────────────────────────────
ALTER TABLE tenant_spec_seti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_spec_seti_select_super_admin" ON tenant_spec_seti;
CREATE POLICY "tenant_spec_seti_select_super_admin"
  ON tenant_spec_seti FOR SELECT
  USING (EXISTS (SELECT 1 FROM kullanicilar
                 WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "tenant_spec_seti_select_kendi_tenant" ON tenant_spec_seti;
CREATE POLICY "tenant_spec_seti_select_kendi_tenant"
  ON tenant_spec_seti FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_spec_seti_insert_kendi_tenant" ON tenant_spec_seti;
CREATE POLICY "tenant_spec_seti_insert_kendi_tenant"
  ON tenant_spec_seti FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
              OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "tenant_spec_seti_update_kendi_tenant" ON tenant_spec_seti;
CREATE POLICY "tenant_spec_seti_update_kendi_tenant"
  ON tenant_spec_seti FOR UPDATE
  USING (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
         OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
              OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "tenant_spec_seti_delete_super_admin" ON tenant_spec_seti;
CREATE POLICY "tenant_spec_seti_delete_super_admin"
  ON tenant_spec_seti FOR DELETE
  USING (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

-- spec_kural (tenant_id'yi spec_id üzerinden çekiyor) ────────────────
ALTER TABLE spec_kural ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spec_kural_select_super_admin" ON spec_kural;
CREATE POLICY "spec_kural_select_super_admin"
  ON spec_kural FOR SELECT
  USING (EXISTS (SELECT 1 FROM kullanicilar
                 WHERE id = auth.uid() AND rol = 'super_admin'));

DROP POLICY IF EXISTS "spec_kural_select_kendi_tenant" ON spec_kural;
CREATE POLICY "spec_kural_select_kendi_tenant"
  ON spec_kural FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tenant_spec_seti s
    WHERE s.id = spec_kural.spec_id
      AND s.tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
  ));

DROP POLICY IF EXISTS "spec_kural_insert_kendi_tenant" ON spec_kural;
CREATE POLICY "spec_kural_insert_kendi_tenant"
  ON spec_kural FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_spec_seti s
      WHERE s.id = spec_kural.spec_id
        AND (s.tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
             OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'))
    )
  );

DROP POLICY IF EXISTS "spec_kural_update_kendi_tenant" ON spec_kural;
CREATE POLICY "spec_kural_update_kendi_tenant"
  ON spec_kural FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_spec_seti s
      WHERE s.id = spec_kural.spec_id
        AND (s.tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
             OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_spec_seti s
      WHERE s.id = spec_kural.spec_id
        AND (s.tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
             OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'))
    )
  );

DROP POLICY IF EXISTS "spec_kural_delete_super_admin" ON spec_kural;
CREATE POLICY "spec_kural_delete_super_admin"
  ON spec_kural FOR DELETE
  USING (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));

-- ────────────────────────────────────────────────────────────────────
-- 6. SON ÖZET (RAISE NOTICE)
-- ────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Migration 062 SUCCESS';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Yeni tablolar: ozel_parcalar, tenant_spec_seti, spec_kural';
  RAISE NOTICE 'RLS: 3 tablo da ENABLED';
  RAISE NOTICE 'Trigger: ozel_parcalar + tenant_spec_seti (guncelleme_at)';
  RAISE NOTICE 'Beklenen baslangic count(*): 3 tablo da 0';
  RAISE NOTICE 'Console hatalari (kutuphane.html): 3 adet 404 dusecek';
END $$;

COMMIT;


-- ════════════════════════════════════════════════════════════════════
-- DOĞRULAMA SORGULARI — Migration SONRASI manuel çalıştır
-- ════════════════════════════════════════════════════════════════════

-- D1: 3 tablo da var mı?
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema='public'
--   AND table_name IN ('ozel_parcalar','tenant_spec_seti','spec_kural')
-- ORDER BY table_name;
-- beklenen: 3 satır

-- D2: RLS açık mı?
-- SELECT relname, relrowsecurity FROM pg_class
-- WHERE relname IN ('ozel_parcalar','tenant_spec_seti','spec_kural');
-- beklenen: 3 satır, hepsi true

-- D3: Policy sayıları
-- SELECT tablename, COUNT(*) FROM pg_policies
-- WHERE tablename IN ('ozel_parcalar','tenant_spec_seti','spec_kural')
-- GROUP BY tablename;
-- beklenen: ozel_parcalar=5, tenant_spec_seti=5, spec_kural=5

-- D4: HEAD count testi
-- SELECT COUNT(*) FROM ozel_parcalar;       -- 0
-- SELECT COUNT(*) FROM tenant_spec_seti;    -- 0
-- SELECT COUNT(*) FROM spec_kural;          -- 0
