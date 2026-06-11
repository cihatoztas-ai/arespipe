-- ============================================================================
-- Migration 074 — ozel_parca_boru_kaydet RPC: tenant_id INSERT'e eklendi
-- ============================================================================
--
-- 93. Oturum (16 May 2026) — Bug Bulgu 4 fix
--
-- BAĞLAM:
-- Migration 073 sonrası Sch zorunluluğu kalktı, modal'dan kayıt denenince
-- hata: 'new row for relation "boru_olculer" violates check constraint
-- "boru_olculer_tenant_consistency"'
--
-- TESPİT:
-- boru_olculer constraint:
--   CHECK ((sistem_preset = true AND tenant_id IS NULL)
--       OR (sistem_preset = false AND tenant_id IS NOT NULL))
--
-- Mevcut RPC (073 dahil) sistem_preset=false set ediyor ama tenant_id'yi
-- INSERT'e koymadığı için tenant_id NULL kalıyor → constraint patlıyor.
-- Bu hata 88. oturumdan beri (RPC ilk yazıldığında) gizli; modal hiç
-- başarılı kullanılmamış olmalı.
--
-- KARAR:
-- INSERT'e tenant_id eklensin. super_admin'in kendi tenant_id'si kullanılır
-- (auth.uid() → kullanicilar.tenant_id). Özel parça super_admin'in tenant'ına
-- bağlanır. RLS policy zaten 071'de tenant filtreliyor, tutarlı.
-- ============================================================================

CREATE OR REPLACE FUNCTION ozel_parca_boru_kaydet(
  p_malzeme_grubu  text,
  p_dn             integer,
  p_dis_cap_mm     numeric,
  p_et_mm          numeric,
  p_agirlik_kg_m   numeric,
  p_schedule_tipi  text DEFAULT NULL,
  p_schedule_deger text DEFAULT NULL,
  p_schedule_kod   text DEFAULT NULL,
  p_kalite_match   text DEFAULT NULL,
  p_notlar         text DEFAULT NULL
)
RETURNS TABLE (
  yeni_boru_id   uuid,
  baglanan_satir integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id   uuid;
  v_tenant_id  uuid;
  v_yeni_id    uuid;
  v_count      integer;
  v_sch_tipi   text;
  v_sch_deger  text;
  v_sch_kod    text;
BEGIN
  -- Auth: super_admin + tenant_id al
  v_admin_id := auth.uid();
  SELECT tenant_id INTO v_tenant_id
  FROM kullanicilar
  WHERE id = v_admin_id AND rol = 'super_admin';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz: super_admin gerekli veya tenant tanimi eksik'
      USING ERRCODE = '42501';
  END IF;

  -- Zorunlu alan kontrolu (Sch artik opsiyonel)
  IF p_malzeme_grubu IS NULL OR p_dn IS NULL OR
     p_dis_cap_mm IS NULL OR p_et_mm IS NULL OR p_agirlik_kg_m IS NULL THEN
    RAISE EXCEPTION 'Eksik zorunlu alan: malzeme_grubu, dn, dis_cap_mm, et_mm, agirlik_kg_m'
      USING ERRCODE = '23502';
  END IF;

  -- Sch sentetik degerler (73. mig'den miras)
  v_sch_tipi  := COALESCE(NULLIF(trim(p_schedule_tipi), ''),  'OZEL');
  v_sch_deger := COALESCE(NULLIF(trim(p_schedule_deger), ''), '-');
  v_sch_kod   := COALESCE(
    NULLIF(trim(p_schedule_kod), ''),
    'OZEL_DC' || to_char(p_dis_cap_mm, 'FM999990.99') || '_ET' || to_char(p_et_mm, 'FM999990.99')
  );

  -- 1) boru_olculer INSERT (tenant_id 074'te eklendi)
  INSERT INTO boru_olculer (
    standart, malzeme_grubu, dn,
    schedule_tipi, schedule_deger, schedule_kod,
    dis_cap_mm, et_mm, agirlik_kg_m,
    kaynak, notlar,
    urun_formu, sistem_preset,
    tenant_id
  ) VALUES (
    'Ozel', p_malzeme_grubu, p_dn,
    v_sch_tipi, v_sch_deger, v_sch_kod,
    p_dis_cap_mm, p_et_mm, p_agirlik_kg_m,
    'super_admin_ozel', p_notlar,
    'boru', false,
    v_tenant_id
  )
  RETURNING id INTO v_yeni_id;

  -- 2) Eslesn spool_malzemeleri UPDATE (mevcut mantik korundu)
  UPDATE spool_malzemeleri sm
  SET boru_olculer_id = v_yeni_id
  WHERE sm.boru_olculer_id IS NULL
    AND coalesce(sm.tip, 'boru') = 'boru'
    AND sm.dis_cap_mm IS NOT NULL
    AND sm.et_mm IS NOT NULL
    AND ABS(sm.dis_cap_mm - p_dis_cap_mm) < 0.5
    AND ABS(sm.et_mm - p_et_mm) < 0.3
    AND (
      p_kalite_match IS NULL
      OR lower(trim(coalesce(sm.kalite, ''))) = p_kalite_match
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_yeni_id, v_count;
END $$;

COMMENT ON FUNCTION ozel_parca_boru_kaydet IS
'93. oturum (074) - Super admin ozel parca kaydi. Sch opsiyonel + sentetik uretim (073). tenant_id artik INSERT-e dahil (074, constraint ihlalini cozmek icin: boru_olculer_tenant_consistency).';
