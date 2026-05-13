-- =============================================================================
-- 052 / 82. Oturum — fitting_olculer için SELECT politikası
-- =============================================================================
-- SORUN:
--   78. oturumda fitting_olculer'a 424 satır eklendi (B16.9 tamamı).
--   Tabloda RLS açık ama SADECE şu iki politika var:
--     - fitting_olculer_sistem_delete_korumasi  (DELETE)
--     - fitting_olculer_sistem_update_korumasi  (UPDATE)
--   SELECT için politika YOK → Postgres RLS deny-by-default → API
--   /rest/v1/fitting_olculer 0 satır döndürüyor.
--
-- ÇÖZÜM:
--   flansh_olculer_select paterni birebir kopyalandı:
--     - sistem_preset = true  → tüm tenant'lar okur (sistem kütüphanesi)
--     - tenant kayıtları       → sadece sahibi okur (kendi tenant_id'si)
--
-- İdempotent: politikayı önce drop, sonra create.
-- =============================================================================

BEGIN;

-- Ön kontrol — gerekli kolonlar var mı?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fitting_olculer' AND column_name = 'sistem_preset'
  ) THEN
    RAISE EXCEPTION 'fitting_olculer.sistem_preset kolonu yok — migration iptal';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fitting_olculer' AND column_name = 'tenant_id'
  ) THEN
    RAISE EXCEPTION 'fitting_olculer.tenant_id kolonu yok — migration iptal';
  END IF;
END $$;

-- Mevcut politika varsa kaldır (yeniden çalıştırmaya izin ver)
DROP POLICY IF EXISTS fitting_olculer_select ON fitting_olculer;

-- SELECT politikası — flansh_olculer_select ile aynı patern
CREATE POLICY fitting_olculer_select
  ON fitting_olculer
  FOR SELECT
  USING (
    sistem_preset = true
    OR tenant_id = (
      SELECT kullanicilar.tenant_id
      FROM kullanicilar
      WHERE kullanicilar.id = auth.uid()
    )
  );

COMMIT;

-- =============================================================================
-- Doğrulama — bunu transaction sonrası AYRI çalıştır:
-- =============================================================================
-- SELECT
--   COUNT(*) AS toplam_satir,
--   COUNT(*) FILTER (WHERE sistem_preset = true)  AS preset_sayisi,
--   COUNT(*) FILTER (WHERE sistem_preset = false) AS tenant_sayisi
-- FROM fitting_olculer;
--
-- Politikaları listele:
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy WHERE polrelid = 'fitting_olculer'::regclass
-- ORDER BY polname;
