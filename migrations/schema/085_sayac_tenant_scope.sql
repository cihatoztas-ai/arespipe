-- 085_sayac_tenant_scope.sql
-- Oturum 103 (20 May 2026)
--
-- AMAC: sonraki_no RPC'si tenant-scope DEGILDI (sadece WHERE tip=...).
--   Tablo (sayac_tanimlari) zaten dogruydu: tenant_id kolonu + UNIQUE(tenant_id,tip).
--   Bug yalnizca RPC'deydi: tum tenant'lar tip='spool' satirindan tek numarayi cekiyordu.
--   Tek tenant (A) aktifken gorunmez; E pilotu gercek spool uretince A ile karisirdi.
--
-- HEDEF DAVRANIS (Cihat karari, oturum 103):
--   Her firma kendi serisinden sirali numara alir. Harf (tenants.kod: A-, E-) app-side,
--   numara tenant'a ozel. spool_id anlamsiz-ama-benzersiz surrogate; gemi/proje/devre
--   bilgisi devre_id->proje_id zincirinde durur, numaraya yansimasi GEREKMEZ.
--   A'nin mevcut serisi korunur (594'ten devam); B-G sifirdan baslar.
--
-- DOGRULAMA (dry-run, BEGIN...ROLLBACK ile canlida denendi — MK-98.2):
--   A spool: 594 -> 595, 596   |   E spool: 0 -> 1, 2   (gecti)
--
-- SIRA NOTU: RPC imzasi degisti sonraki_no(text) -> sonraki_no(uuid,text).
--   Eski ares-store.js helper'i (tek param) bu migration sonrasi uyumsuz olur.
--   Bu migration ile ares-store.js (commit bc097dd) AYNI ANDA canliya gitti.

-- 1) B-G tenant'larina A'nin (Demo Atolye) config'ini kopyala, son_no=0.
--    A dokunulmaz. Idempotent: ON CONFLICT DO NOTHING.
INSERT INTO sayac_tanimlari (tenant_id, tip, son_no, prefix, yil_ekle, digits, aciklama)
SELECT t.id, s.tip, 0, s.prefix, s.yil_ekle, s.digits, s.aciklama
FROM sayac_tanimlari s
CROSS JOIN tenants t
WHERE s.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND t.id <> '00000000-0000-0000-0000-000000000001'
ON CONFLICT (tenant_id, tip) DO NOTHING;

-- 2) Eski tek-parametreli RPC'yi kaldir (imza degisiyor).
DROP FUNCTION IF EXISTS public.sonraki_no(text);

-- 3) Tenant-farkinda yeni RPC.
--    Fallback INSERT'i normalde tetiklenmez (1. adim pre-seed yapti) ama guvenlik agi.
--    ON CONFLICT artik dogru constraint'i (tenant_id, tip) kullaniyor.
CREATE OR REPLACE FUNCTION public.sonraki_no(p_tenant_id uuid, p_tip text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE v_no int;
BEGIN
  UPDATE sayac_tanimlari
  SET son_no = COALESCE(son_no,0) + 1
  WHERE tenant_id = p_tenant_id AND tip = p_tip
  RETURNING son_no INTO v_no;

  IF v_no IS NULL THEN
    INSERT INTO sayac_tanimlari (tenant_id, tip, son_no, prefix, yil_ekle, digits)
    VALUES (p_tenant_id, p_tip, 1, '', false, 6)
    ON CONFLICT (tenant_id, tip) DO UPDATE SET son_no = sayac_tanimlari.son_no + 1
    RETURNING son_no INTO v_no;
  END IF;

  RETURN v_no;
END; $$;
