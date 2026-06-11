-- ============================================================
-- 032 — RLS aktivasyonu: 5 public tablo
-- ============================================================
-- Tarih:  6 Mayis 2026
-- Oturum: 66
-- 
-- Amac:
--   Supabase Security Advisor (03 Mayis 2026 raporu) 5 tabloda
--   RLS'in kapali oldugunu bildirdi. Bu tablolar publicly accessible
--   durumda — proje URL'sini bilen herkes okuyup yazip silebilir.
--   Bu migration RLS'i aktif edip her tabloya uygun policy yazar.
--
-- Etkilenen tablolar:
--   1. testler            — multi-tenant (tenant_id NOT NULL, devre testleri)
--   2. tenant_features    — multi-tenant (feature flag, super_admin yonetir)
--   3. egitim_verisi      — multi-tenant (AI egitim verisi, HASSAS)
--   4. yetki_tanimlari    — sistem sozluk (tenant_id YOK)
--   5. basamak_sablonlari — sistem sozluk (firma tipi bazli sablon)
--
-- Kullanilan kanonik pattern (mevcut policy'lerden):
--   - Multi-tenant:  spool_tenant ON spooller (tenant_id = get_tenant_id())
--   - Super admin:   auth.jwt() ->> 'rol' = 'super_admin'
--   - Anon erisim:   TO authenticated filtresi (anon kapali)
--
-- Geri alma:
--   Tum policy'ler DROP POLICY IF EXISTS ile silinebilir, sonra
--   ALTER TABLE ... DISABLE ROW LEVEL SECURITY ile RLS kapatilir.
--   Ancak kapatma GUVENLIK ACIGI yaratir — sadece debug icin.
--
-- Idempotent: DROP POLICY IF EXISTS + CREATE POLICY (tekrar calistirilabilir)
-- ============================================================

BEGIN;


-- ============================================================
-- 1. testler — multi-tenant
-- ============================================================
ALTER TABLE public.testler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS testler_tenant ON public.testler;
CREATE POLICY testler_tenant
  ON public.testler
  FOR ALL
  TO authenticated
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());


-- ============================================================
-- 2. tenant_features — multi-tenant + super_admin yonetimi
-- ============================================================
-- Tenant kendi feature'larini OKUYABILIR ama degistiremez.
-- INSERT/UPDATE/DELETE sadece super_admin tarafindan.
-- ============================================================
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_features_select ON public.tenant_features;
CREATE POLICY tenant_features_select
  ON public.tenant_features
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_features_super_admin ON public.tenant_features;
CREATE POLICY tenant_features_super_admin
  ON public.tenant_features
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'rol') = 'super_admin')
  WITH CHECK ((auth.jwt() ->> 'rol') = 'super_admin');


-- ============================================================
-- 3. egitim_verisi — multi-tenant (HASSAS)
-- ============================================================
-- AI egitim verisi: pdf_icerik, claude_ciktisi, fotograf_url.
-- Tenant'lar arasi sizinti olmamali — tenant_id zorunlu filtre.
-- ============================================================
ALTER TABLE public.egitim_verisi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS egitim_verisi_tenant ON public.egitim_verisi;
CREATE POLICY egitim_verisi_tenant
  ON public.egitim_verisi
  FOR ALL
  TO authenticated
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());


-- ============================================================
-- 4. yetki_tanimlari — sistem sozluk
-- ============================================================
-- tenant_id yok. Sistem-genel yetki sozlugu.
-- Tum authenticated kullanicilar OKUYABILIR.
-- Sadece super_admin degistirebilir.
-- ============================================================
ALTER TABLE public.yetki_tanimlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS yetki_tanimlari_read ON public.yetki_tanimlari;
CREATE POLICY yetki_tanimlari_read
  ON public.yetki_tanimlari
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS yetki_tanimlari_super_admin_write ON public.yetki_tanimlari;
CREATE POLICY yetki_tanimlari_super_admin_write
  ON public.yetki_tanimlari
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'rol') = 'super_admin')
  WITH CHECK ((auth.jwt() ->> 'rol') = 'super_admin');


-- ============================================================
-- 5. basamak_sablonlari — sistem sozluk
-- ============================================================
-- tenant_id yok. firma_tipi bazli sablon sozlugu.
-- Tum authenticated kullanicilar OKUYABILIR.
-- Sadece super_admin degistirebilir.
-- ============================================================
ALTER TABLE public.basamak_sablonlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS basamak_sablonlari_read ON public.basamak_sablonlari;
CREATE POLICY basamak_sablonlari_read
  ON public.basamak_sablonlari
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS basamak_sablonlari_super_admin_write ON public.basamak_sablonlari;
CREATE POLICY basamak_sablonlari_super_admin_write
  ON public.basamak_sablonlari
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'rol') = 'super_admin')
  WITH CHECK ((auth.jwt() ->> 'rol') = 'super_admin');


COMMIT;


-- ============================================================
-- DOGRULAMA (commit sonrasi ayri sorgu olarak calistir)
-- ============================================================
-- 1) RLS aktif mi:
-- 
-- SELECT tablename, rowsecurity AS rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'testler', 'tenant_features', 'egitim_verisi',
--     'yetki_tanimlari', 'basamak_sablonlari'
--   )
-- ORDER BY tablename;
-- 
-- Beklenen: 5 satir, hepsi rls_enabled = true
-- 
-- 
-- 2) Policy'ler yerinde mi (toplam 8 policy beklenir):
-- 
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'testler', 'tenant_features', 'egitim_verisi',
--     'yetki_tanimlari', 'basamak_sablonlari'
--   )
-- ORDER BY tablename, policyname;
-- 
-- Beklenen 8 satir:
--   basamak_sablonlari | basamak_sablonlari_read              | SELECT
--   basamak_sablonlari | basamak_sablonlari_super_admin_write | ALL
--   egitim_verisi      | egitim_verisi_tenant                 | ALL
--   tenant_features    | tenant_features_select               | SELECT
--   tenant_features    | tenant_features_super_admin          | ALL
--   testler            | testler_tenant                       | ALL
--   yetki_tanimlari    | yetki_tanimlari_read                 | SELECT
--   yetki_tanimlari    | yetki_tanimlari_super_admin_write    | ALL
-- ============================================================
