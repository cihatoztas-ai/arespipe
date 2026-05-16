-- ============================================================================
-- Migration 073 — ozel_parca_boru_kaydet RPC: Sch opsiyonel + sentetik üretim
-- ============================================================================
--
-- 93. Oturum (16 May 2026) — Bug Bulgu 2 fix (Sch zorunluluğu)
--
-- BAĞLAM:
-- Kütüphane Öneriler modal'ında özel parça (139.7 x 4.5 mm gibi standart dışı
-- ölçü) eklenirken Sch tipi/değer/kod zorunlu istiyordu. Kullanıcı standart Sch
-- olmayan bir ölçü için Sch uydurmak zorunda kalıyordu (örn. 'OZEL_SCH40' —
-- mantıksız, 4.5 mm hiçbir Sch'e tam denk gelmiyor).
--
-- KARAR:
-- Sch parametrelerini opsiyonel yap. NULL ise sentetik değer üret:
--   schedule_tipi  → 'OZEL'
--   schedule_deger → '-'
--   schedule_kod   → 'OZEL_DC{dis_cap}_ET{et_mm}'
--
-- Bu sayede boru_olculer NOT NULL constraint'leri korunur ama kullanıcı
-- uydurmak zorunda kalmaz; özel parçalar tutarlı bir sentetik şemayla işaretlenir.
--
-- NOT: Parametre sırası 064'ten farklı (DEFAULT'lu parametreler en sonda olmak
-- zorunda, Postgres kuralı). Frontend named arguments kullandığı için etkilenmez.
-- ============================================================================

-- Eski imzayi temizle (parametre sirasi degisecek)
DROP FUNCTION IF EXISTS ozel_parca_boru_kaydet(text, integer, text, text, text, numeric, numeric, numeric, text, text);

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
  v_admin_id uuid;
  v_yeni_id  uuid;
  v_count    integer;
  v_sch_tipi  text;
  v_sch_deger text;
  v_sch_kod   text;
BEGIN
  -- Auth
  v_admin_id := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM kullanicilar
    WHERE id = v_admin_id AND rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Yetkisiz: super_admin gerekli'
      USING ERRCODE = '42501';
  END IF;

  -- Zorunlu alan kontrolu (Sch artik opsiyonel, 93. oturum)
  IF p_malzeme_grubu IS NULL OR p_dn IS NULL OR
     p_dis_cap_mm IS NULL OR p_et_mm IS NULL OR p_agirlik_kg_m IS NULL THEN
    RAISE EXCEPTION 'Eksik zorunlu alan: malzeme_grubu, dn, dis_cap_mm, et_mm, agirlik_kg_m'
      USING ERRCODE = '23502';
  END IF;

  -- Sch sentetik degerler (93. oturum)
  -- Kullanici Sch verirse oldugu gibi kullan, vermezse sentetik uret.
  v_sch_tipi  := COALESCE(NULLIF(trim(p_schedule_tipi), ''),  'OZEL');
  v_sch_deger := COALESCE(NULLIF(trim(p_schedule_deger), ''), '-');
  v_sch_kod   := COALESCE(
    NULLIF(trim(p_schedule_kod), ''),
    'OZEL_DC' || to_char(p_dis_cap_mm, 'FM999990.99') || '_ET' || to_char(p_et_mm, 'FM999990.99')
  );

  -- 1) boru_olculer INSERT
  INSERT INTO boru_olculer (
    standart, malzeme_grubu, dn,
    schedule_tipi, schedule_deger, schedule_kod,
    dis_cap_mm, et_mm, agirlik_kg_m,
    kaynak, notlar,
    urun_formu, sistem_preset
  ) VALUES (
    'Ozel', p_malzeme_grubu, p_dn,
    v_sch_tipi, v_sch_deger, v_sch_kod,
    p_dis_cap_mm, p_et_mm, p_agirlik_kg_m,
    'super_admin_ozel', p_notlar,
    'boru', false
  )
  RETURNING id INTO v_yeni_id;

  -- 2) Eslesn spool_malzemeleri UPDATE (mevcut mantik aynen korundu)
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
'93. oturum revize - Super admin ozel parca kaydi. Sch alanlari opsiyonel; NULL ise OZEL/-/{OZEL_DC<cap>_ET<et>} sentetik degerler. boru_olculere INSERT + esleyen spool_malzemeleri satirlarini otomatik baglar. Tolerans: dis_cap +/-0.5mm, et +/-0.3mm.';

-- GRANT (yeni imza icin)
GRANT EXECUTE ON FUNCTION ozel_parca_boru_kaydet(text, integer, numeric, numeric, numeric, text, text, text, text, text) TO authenticated;
