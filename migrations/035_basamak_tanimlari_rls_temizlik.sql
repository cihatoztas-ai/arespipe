-- migrations/035_basamak_tanimlari_rls_temizlik.sql
-- 71 / 3f.3 hotfix — basamak_tanimlari multi-tenant satir sizmasi
--
-- Sorun:
--   3 policy mevcut:
--     basamak_herkese_okuma   SELECT  qual=true, public roller   <- TENANT BARRIER YOK
--     basamak_tanimlari_tenant ALL    qual=get_tenant_id() ...   <- duplicate
--     basamak_tenant           ALL    qual=get_tenant_id() ...   <- esas policy
--
--   PostgreSQL RLS'inde permissive policy'ler OR mantigiyla birleser. Yani
--   basamak_herkese_okuma true donduruyor ve diger policy'ler ne soylerse
--   soylesin SELECT herkese acik. 3f.3 drawer'inda 45 satir (tum tenant'lar)
--   gozukmesinin sebebi.
--
-- Cozum:
--   1. basamak_herkese_okuma policy'sini sil (tenant barrier'i kaldiriyor)
--   2. duplicate basamak_tanimlari_tenant policy'sini sil
--   3. basamak_tenant policy'sini koru (ALL + get_tenant_id() pattern)
--
-- Etki: SELECT'ler artik sadece kullanicinin tenant_id'i ile eslesen satirlari
-- doner. Mobile 3f.3 drawer'i 6 satir gosterir (firmaya ozgu basamak listesi).
-- Web spool_detay.html'de de tutarlilik saglanir.
--
-- Idempotent: DROP IF EXISTS hem mevcut hem eksik policy'leri guvenle handle eder.

DROP POLICY IF EXISTS basamak_herkese_okuma ON public.basamak_tanimlari;
DROP POLICY IF EXISTS basamak_tanimlari_tenant ON public.basamak_tanimlari;

-- basamak_tenant policy'si zaten dogru pattern'de, dokunmuyoruz.
-- (Eger silinmis olsaydi, asagidaki yedek CREATE'i acabilirsiniz)
--
-- CREATE POLICY basamak_tenant ON public.basamak_tanimlari
--   FOR ALL
--   USING (tenant_id = get_tenant_id())
--   WITH CHECK (tenant_id = get_tenant_id());

-- Dogrulama (manuel calistir):
--   select policyname, cmd, qual from pg_policies
--   where tablename = 'basamak_tanimlari';
--
-- Beklenen: TEK SATIR — basamak_tenant, ALL, (tenant_id = get_tenant_id())
