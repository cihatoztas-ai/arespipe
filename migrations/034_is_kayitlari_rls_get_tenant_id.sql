-- migrations/034_is_kayitlari_rls_get_tenant_id.sql
-- 70 sonu manuel uygulanan RLS fix'in repo'ya kayitli hali.
-- 71 / SED-71-02 — MK-70.3 RLS policy review pattern.
--
-- Problem: is_kayitlari'nin eski "tenant_isolation" policy'si subquery
-- pattern kullaniyordu (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()).
-- kullanicilar tablosunun kendi RLS'i bu subquery'i engelliyor -> NULL ->
-- with_check NULL -> silent INSERT/UPDATE reddi.
--
-- Cozum: spooller tablosunda kullanilan get_tenant_id() SECURITY DEFINER
-- fonksiyonuna gec. Bu fonksiyon JWT app_metadata + root claim + DB fallback
-- ile COALESCE pattern'i kullaniyor, RLS'ten bagimsiz tenant cozumu yapiyor.
--
-- Idempotent: Hem eski tenant_isolation'i hem yeni is_kayitlari_tenant'i
-- temizleyip yeniden olusturur. Manuel uygulanmis ortamlar guvenle calistirir.

DROP POLICY IF EXISTS tenant_isolation ON public.is_kayitlari;
DROP POLICY IF EXISTS is_kayitlari_tenant ON public.is_kayitlari;

CREATE POLICY is_kayitlari_tenant ON public.is_kayitlari
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- Dogrulama (manuel calistir, bu migration'a dahil degil):
--   select tablename, policyname, cmd, qual, with_check
--   from pg_policies where tablename = 'is_kayitlari';
--
-- Beklenen:
--   policyname = is_kayitlari_tenant
--   cmd        = ALL
--   qual       = (tenant_id = get_tenant_id())
--   with_check = (tenant_id = get_tenant_id())  -- NULL DEGIL
