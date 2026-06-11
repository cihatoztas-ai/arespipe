-- =====================================================================
-- 064_v_tanimsiz_havuz.sql
-- 88. Oturum — Tanımsız Malzeme Havuzu (Phase 1: boru)
-- Vizyon belgesi: 88-VIZYON-TANIMSIZLAR.md
--
-- Bu migration üç şey kurar:
--   1) v_tanimsiz_havuz VIEW          — debug ve tek-tenant okuma için
--   2) v_tanimsiz_havuz_listele() RPC — super_admin tüm tenant'ları listeler
--   3) ozel_parca_boru_kaydet()  RPC — özel parça INSERT + spool_malzemeleri UPDATE
--
-- Mimari kararlar:
--   - View RLS'i spool_malzemeleri'den miras alır (tek tenant görünür)
--   - Süper admin tüm sistemi görmek için RPC kullanır (SECURITY DEFINER)
--   - Standart tablolar (DIN, ASME, EN) bu migration kapsamında DEĞİL
--     → 89+ oturumlarda ayrı seed migration olarak gelecek
--   - "Özel parça" kaydı tolerans ±0.5mm dış çap / ±0.3mm et içinde
--     eşleşen tüm spool_malzemeleri satırlarını otomatik bağlar
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1) v_tanimsiz_havuz VIEW
-- =====================================================================
-- Tek tenant'lı sorgular için (debug, gelecekte tenant_admin paneli vb.)
-- Super admin için bu view'a doğrudan SELECT yapmayın -> RLS keser.

CREATE OR REPLACE VIEW v_tanimsiz_havuz AS
SELECT
  'boru'::text                                AS parca_tipi,
  ROUND(sm.dis_cap_mm, 3)                     AS dis_cap_mm,
  ROUND(sm.et_mm, 3)                          AS et_mm,
  lower(trim(coalesce(sm.kalite, '')))        AS kalite_normalize,
  MAX(sm.kalite)                              AS kalite_ham,
  md5(
    'boru|' ||
    ROUND(sm.dis_cap_mm, 3)::text || '|' ||
    ROUND(sm.et_mm, 3)::text || '|' ||
    lower(trim(coalesce(sm.kalite, '')))
  )                                           AS hash_anahtari,
  COUNT(DISTINCT sm.spool_id)                 AS siklik,
  COUNT(DISTINCT s.devre_id)                  AS devre_sayisi,
  COUNT(DISTINCT sm.tenant_id)                AS tenant_sayisi,
  array_agg(DISTINCT sm.tenant_id)            AS tenant_ler,
  MIN(sm.olusturma)                           AS ilk_gorulme,
  MAX(sm.olusturma)                           AS son_gorulme
FROM spool_malzemeleri sm
LEFT JOIN spooller s ON sm.spool_id = s.id
WHERE sm.boru_olculer_id IS NULL
  AND coalesce(sm.tip, 'boru') = 'boru'
  AND sm.dis_cap_mm IS NOT NULL
  AND sm.et_mm IS NOT NULL
GROUP BY
  ROUND(sm.dis_cap_mm, 3),
  ROUND(sm.et_mm, 3),
  lower(trim(coalesce(sm.kalite, '')));

COMMENT ON VIEW v_tanimsiz_havuz IS
'88. oturum - Tanimsiz boru havuzu (Phase 1). boru_olculer_id IS NULL olan spool_malzemeleri satirlari siklika gore gruplanir. RLS miras alindigi icin super_admin tek tenantin verisini gorur - tum sistem icin v_tanimsiz_havuz_listele() RPC kullan.';


-- =====================================================================
-- 2) v_tanimsiz_havuz_listele() RPC
-- =====================================================================
-- Super admin paneli icin. SECURITY DEFINER ile RLS bypass.
-- Iceride sadece super_admin auth kontrolu.

CREATE OR REPLACE FUNCTION v_tanimsiz_havuz_listele()
RETURNS TABLE (
  parca_tipi       text,
  dis_cap_mm       numeric,
  et_mm            numeric,
  kalite_normalize text,
  kalite_ham       text,
  hash_anahtari    text,
  siklik           bigint,
  devre_sayisi     bigint,
  tenant_sayisi    bigint,
  tenant_ler       uuid[],
  ilk_gorulme      timestamptz,
  son_gorulme      timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auth: super_admin zorunlu
  IF NOT EXISTS (
    SELECT 1 FROM kullanicilar
    WHERE id = auth.uid() AND rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Yetkisiz: super_admin gerekli'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    'boru'::text,
    ROUND(sm.dis_cap_mm, 3),
    ROUND(sm.et_mm, 3),
    lower(trim(coalesce(sm.kalite, ''))),
    MAX(sm.kalite),
    md5(
      'boru|' ||
      ROUND(sm.dis_cap_mm, 3)::text || '|' ||
      ROUND(sm.et_mm, 3)::text || '|' ||
      lower(trim(coalesce(sm.kalite, '')))
    ),
    COUNT(DISTINCT sm.spool_id),
    COUNT(DISTINCT s.devre_id),
    COUNT(DISTINCT sm.tenant_id),
    array_agg(DISTINCT sm.tenant_id),
    MIN(sm.olusturma),
    MAX(sm.olusturma)
  FROM spool_malzemeleri sm
  LEFT JOIN spooller s ON sm.spool_id = s.id
  WHERE sm.boru_olculer_id IS NULL
    AND coalesce(sm.tip, 'boru') = 'boru'
    AND sm.dis_cap_mm IS NOT NULL
    AND sm.et_mm IS NOT NULL
  GROUP BY
    ROUND(sm.dis_cap_mm, 3),
    ROUND(sm.et_mm, 3),
    lower(trim(coalesce(sm.kalite, '')))
  ORDER BY COUNT(DISTINCT sm.spool_id) DESC,
           MAX(sm.olusturma) DESC;
END $$;

COMMENT ON FUNCTION v_tanimsiz_havuz_listele() IS
'88. oturum - Super admin icin tanimsiz boru havuzu. Tum tenantlari kapsar. SECURITY DEFINER + iceride super_admin kontrolu -> guvenli RLS bypass.';


-- =====================================================================
-- 3) ozel_parca_boru_kaydet() RPC
-- =====================================================================
-- Super admin "ozel parca" formundan kaydeder.
-- 1) boru_olculer'a yeni satir INSERT (sistem_preset=false, standart='Ozel')
-- 2) Tolerans dahilindeki spool_malzemeleri.boru_olculer_id UPDATE
--    (tum tenant'lar - kutuphane paylasilan altyapi)
-- 3) (id, kac satir baglandi) doner

CREATE OR REPLACE FUNCTION ozel_parca_boru_kaydet(
  p_malzeme_grubu  text,
  p_dn             integer,
  p_schedule_tipi  text,
  p_schedule_deger text,
  p_schedule_kod   text,
  p_dis_cap_mm     numeric,
  p_et_mm          numeric,
  p_agirlik_kg_m   numeric,
  p_kalite_match   text DEFAULT NULL,  -- lower+trim'lenmis kalite; NULL = kalite filtresiz
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

  -- Zorunlu alan kontrolu (boru_olculer NOT NULL kolonlari)
  IF p_malzeme_grubu IS NULL OR p_dn IS NULL OR
     p_schedule_tipi IS NULL OR p_schedule_deger IS NULL OR p_schedule_kod IS NULL OR
     p_dis_cap_mm IS NULL OR p_et_mm IS NULL OR p_agirlik_kg_m IS NULL THEN
    RAISE EXCEPTION 'Eksik zorunlu alan'
      USING ERRCODE = '23502';
  END IF;

  -- 1) boru_olculer INSERT
  INSERT INTO boru_olculer (
    standart, malzeme_grubu, dn,
    schedule_tipi, schedule_deger, schedule_kod,
    dis_cap_mm, et_mm, agirlik_kg_m,
    kaynak, notlar,
    urun_formu, sistem_preset
  ) VALUES (
    'Ozel', p_malzeme_grubu, p_dn,
    p_schedule_tipi, p_schedule_deger, p_schedule_kod,
    p_dis_cap_mm, p_et_mm, p_agirlik_kg_m,
    'super_admin_ozel', p_notlar,
    'boru', false
  )
  RETURNING id INTO v_yeni_id;

  -- 2) Eslesn spool_malzemeleri UPDATE
  --    Tolerans: dis cap +/-0.5mm / et +/-0.3mm
  --    Sebep: yanlis schedule capraz eslemesi olmasin (orn. SCH40 ile SCH80)
  --    Kalite filtresi: p_kalite_match NULL ise atlanir
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
'88. oturum - Super admin ozel parca kaydi. boru_olculere INSERT + tum tenantlardaki esleyen spool_malzemeleri satirlarini otomatik baglar. Tolerans: dis_cap +/-0.5mm, et +/-0.3mm.';


-- =====================================================================
-- Yetkiler
-- =====================================================================
-- RPC'leri authenticated rolune ac (iceride super_admin kontrolu var)
GRANT EXECUTE ON FUNCTION v_tanimsiz_havuz_listele() TO authenticated;
GRANT EXECUTE ON FUNCTION ozel_parca_boru_kaydet(text, integer, text, text, text, numeric, numeric, numeric, text, text) TO authenticated;


COMMIT;

-- =====================================================================
-- Smoke test (manuel calistirilir, migrationn parcasi degil)
-- =====================================================================
-- 1) RPC cagrisi (super_admin oturumunda):
--    SELECT * FROM v_tanimsiz_havuz_listele();
--    -> 2 satir donmeli (40 tanimsiz / 2 benzersiz kombinasyon)
--
-- 2) Ozel parca testi (DIKKAT: gercek INSERT yapar, test sonrasi temizle):
--    BEGIN;
--    SELECT * FROM ozel_parca_boru_kaydet(
--      'karbon', 125, 'mm', '4.5', '4.5mm',
--      139.7, 4.5, 15.0,
--      'st 37', 'Test kaydi - silinecek'
--    );
--    -> (yeni_boru_id, baglanan_satir=N) donmeli
--    ROLLBACK;
