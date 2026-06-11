-- ============================================================
-- 033 — tenant_features eski policy temizligi
-- ============================================================
-- Tarih:  6 Mayis 2026
-- Oturum: 66
-- 
-- Amac:
--   032 migration sonrasi tenant_features'da 4 policy oldugu
--   tespit edildi. Iki tanesi eski policy:
-- 
--   1. tenant_features_all
--      USING (true), roles {public}, cmd ALL
--      => GUVENLIK ACIGI: anon dahil herkese tam erisim verir.
--      => 032'nin yeni policy'lerini fiilen iptal eder.
--      => HEMEN SILINMELI.
-- 
--   2. super_admin_feature_yonet
--      USING (auth.jwt() -> 'app_metadata' ->> 'rol' = 'super_admin')
--      roles {public}, cmd ALL
--      => Eski JWT path formati (app_metadata altinda).
--      => 032'nin tenant_features_super_admin policy'si yeni format
--         (auth.jwt() ->> 'rol') kullaniyor.
--      => Iki policy ayni isi yapiyor, eski format kafa karistiriyor.
--      => SILINMELI, yeni policy yeterli.
--
-- Risk:
--   tenant_features_all silinince super_admin disindaki kullanicilar
--   sadece kendi tenant_id'sine ait kayitlari gorebilecek.
--   Bu DOGRU davranis (zaten 032'nin amaciydi).
--   Eger uygulama bir yerde "tum tenant_features oku" yapiyorsa
--   o yer KIRILABILIR — smoke test sirasinda kontrol et.
--
-- Geri alma:
--   CREATE POLICY tenant_features_all ON public.tenant_features
--     FOR ALL TO public USING (true);
--   AMA: bu adim guvenlik acigini geri getirir, sadece debug icin.
--
-- Idempotent: DROP POLICY IF EXISTS (tekrar calistirilabilir)
-- ============================================================

BEGIN;

-- 1. Acil: USING true policy'sini sil (anon erisimi keser)
DROP POLICY IF EXISTS tenant_features_all ON public.tenant_features;

-- 2. Eski JWT format'i kullanan duplikat policy'yi sil
DROP POLICY IF EXISTS super_admin_feature_yonet ON public.tenant_features;

COMMIT;


-- ============================================================
-- DOGRULAMA (commit sonrasi calistir)
-- ============================================================
-- 
-- SELECT policyname, cmd, qual, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'tenant_features'
-- ORDER BY policyname;
-- 
-- Beklenen 2 satir:
--   tenant_features_select        | SELECT | tenant_id=get_tenant_id() | {authenticated}
--   tenant_features_super_admin   | ALL    | super_admin kontrolu       | {authenticated}
-- ============================================================
