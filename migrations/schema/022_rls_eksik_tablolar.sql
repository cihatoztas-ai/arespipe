-- ============================================================================
-- 022: RLS policy'leri — 48. oturum güvenlik tamamlama
-- ============================================================================
-- 48 gündem maddesi B. RLS denetiminden çıkan 3 eksik tablo:
--   1. markalama_listeleri              (tenant_id var, RLS kapalı)
--   2. markalama_listesi_kalemleri      (tenant_id + parent FK liste_id)
--   3. test_spooller                    (tenant_id var, 0 satır, defansif RLS)
--
-- Diğer tüm production tabloları zaten RLS aktif (12 tablo).
--
-- Tasarım kararları:
-- - SELECT: Kendi tenant + super_admin görür (mevcut sistemin paterni)
-- - INSERT/UPDATE/DELETE: Kendi tenant'ında işlem yapabilir
-- - markalama_listesi_kalemleri için EK kural: Parent listenin tenant'ıyla
--   kalem'in tenant'ı UYUŞMALI (data integrity için).
-- - service_role anahtarı RLS bypass eder (backend bu key'i kullanır).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. markalama_listeleri
-- ----------------------------------------------------------------------------

ALTER TABLE markalama_listeleri ENABLE ROW LEVEL SECURITY;

CREATE POLICY markalama_listeleri_select ON markalama_listeleri
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM kullanicilar
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

CREATE POLICY markalama_listeleri_write ON markalama_listeleri
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 2. markalama_listesi_kalemleri (parent FK kuralıyla)
-- ----------------------------------------------------------------------------

ALTER TABLE markalama_listesi_kalemleri ENABLE ROW LEVEL SECURITY;

-- SELECT: tenant + super_admin
CREATE POLICY markalama_listesi_kalemleri_select ON markalama_listesi_kalemleri
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM kullanicilar
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- INSERT/UPDATE: tenant_id eşleşsin VE parent liste'nin tenant_id'si de eşleşsin
-- (Bir kullanıcı X listesine başka tenant'ın kalemini eklemesin)
CREATE POLICY markalama_listesi_kalemleri_insert ON markalama_listesi_kalemleri
  FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
    AND tenant_id = (
      SELECT tenant_id FROM markalama_listeleri WHERE id = liste_id
    )
  );

CREATE POLICY markalama_listesi_kalemleri_update ON markalama_listesi_kalemleri
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
    AND tenant_id = (
      SELECT tenant_id FROM markalama_listeleri WHERE id = liste_id
    )
  );

CREATE POLICY markalama_listesi_kalemleri_delete ON markalama_listesi_kalemleri
  FOR DELETE
  USING (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 3. test_spooller (defansif — 0 satır ama gelecekte kullanılırsa hazır)
-- ----------------------------------------------------------------------------

ALTER TABLE test_spooller ENABLE ROW LEVEL SECURITY;

CREATE POLICY test_spooller_select ON test_spooller
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM kullanicilar
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

CREATE POLICY test_spooller_write ON test_spooller
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- DOĞRULAMA SORGULARI (bu migration'dan sonra elle çalıştır)
-- ============================================================================
-- 1. Tüm policy'ler eklendi mi?
-- SELECT tablename, COUNT(*) AS policy_sayisi
-- FROM pg_policies
-- WHERE tablename IN ('markalama_listeleri', 'markalama_listesi_kalemleri', 'test_spooller')
-- GROUP BY tablename;
-- Beklenen:
--   markalama_listeleri              : 2
--   markalama_listesi_kalemleri      : 4
--   test_spooller                    : 2

-- 2. RLS aktif mi?
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('markalama_listeleri', 'markalama_listesi_kalemleri', 'test_spooller');
-- Beklenen: Hepsi t (true)
