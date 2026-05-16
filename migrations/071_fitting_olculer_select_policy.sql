-- ============================================================================
-- Migration 071 — fitting_olculer SELECT policy ekle
-- ============================================================================
--
-- 93. Oturum (16 May 2026) — Bug 1 üçüncü katman fix
--
-- BAĞLAM:
-- 92'de boru/flansh için RLS policy'leri eklendi ama fitting unutuldu.
-- fitting_olculer tablosunda RLS açık fakat SELECT policy yok → her sorgu
-- 0 satır dönüyor. Service role 464 satır görür, kullanıcı 0 satır.
--
-- TESPİT (93):
--   pg_policies'de fitting_olculer için SELECT policy YOK
--   boru_olculer: qual = true (herkese açık)
--   flansh_olculer: sistem_preset OR tenant eşleşmesi
--
-- KARAR:
-- flansh_olculer'ın policy'sini birebir uyarla. fitting de aynı semantik:
-- sistem preset herkese görünür, tenant kayıtları sadece sahibine.
-- ============================================================================

BEGIN;

-- Önce RLS açık mı doğrula (zaten açık ama emin olalım)
ALTER TABLE public.fitting_olculer ENABLE ROW LEVEL SECURITY;

-- SELECT policy ekle
DROP POLICY IF EXISTS fitting_olculer_select ON public.fitting_olculer;

CREATE POLICY fitting_olculer_select
ON public.fitting_olculer
FOR SELECT
USING (
  sistem_preset = true
  OR tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
);

-- ============================================================================
-- DOĞRULAMA
-- ============================================================================
-- Beklenen: fitting_olculer için cmd=SELECT bir policy görünmeli

SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'fitting_olculer'
  AND cmd = 'SELECT';

-- Sonra tarayıcı F12 console'unda tekrar şu sorgu çalıştırılır:
--   ARES.supabase().from('fitting_olculer').select('id').eq('malzeme_grubu','karbon').limit(5)
-- 0 satır yerine 5 satır dönmeli.

COMMIT;
