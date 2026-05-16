-- =====================================================================
-- Migration 068 -- Kutuphane cakisma yonetimi (boru icin)
-- =====================================================================
-- Tarih: 16 Mayis 2026
-- Oturum: 92
--
-- v1 hatasi (16 May 2026): "SET search_path TO 'public, arsiv'" tek string
-- olarak ele alindi, %ROWTYPE compile-time'da bulamadi. v2'de iki duzeltme:
--   1. search_path identifier list olarak (tirnaksiz)
--   2. %ROWTYPE'larda explicit public.boru_olculer (search_path bagimsiz)
--
-- Senaryo (Cihat, 92):
--   Sahadan tanimsiz malzeme gelir. Standardi bulup eklemek vakit alabilir,
--   yogunlukta mumkun olmayabilir. Pratik akis: gecici "ozel kayit" olarak
--   ekle (sistem_preset=false), spool akisi yurusun. Kutuphane olgunlasinca
--   ayni geometriye sahip sistem standardi eklenirse cakisma cikar.
--   Bu cakismayi tespit et ve birlestir.
--
-- Bu migration:
--   1. arsiv.kayit_birlestirme_log tablosu (audit trail, generic)
--   2. v_kutuphane_cakismalari_listele() RPC -- liste
--   3. boru_kaydi_birlestir(p_ozel_id, p_sistem_id) RPC -- birlestirme
--
-- Mimari:
--   - Cakisma = ayni (dis_cap_mm, et_mm) kombinasyonu + biri sistem_preset=true
--     biri sistem_preset=false (boru_olculer'da)
--   - Yon: HER ZAMAN ozel -> sistem (standart authoritative)
--   - Veri kaybi: SIFIR. Ozel kayit silinmeden once tam JSONB snapshot
--     arsiv.kayit_birlestirme_log'a yazilir.
--
-- Yetki: Iki RPC de SECURITY DEFINER, sadece super_admin cagirabilir.
--
-- Onkosul: Migration 067 calistirilmis olmali.
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1. Arsiv sema + audit tablosu
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS arsiv;

CREATE TABLE IF NOT EXISTS arsiv.kayit_birlestirme_log (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parca_tipi             text        NOT NULL CHECK (parca_tipi IN ('boru', 'fitting', 'flansh')),
  ozel_kayit_id          uuid        NOT NULL,
  sistem_kayit_id        uuid        NOT NULL,
  ozel_snapshot          jsonb       NOT NULL,
  birlestiren            uuid        REFERENCES public.kullanicilar(id),
  birlestirme_at         timestamptz NOT NULL DEFAULT now(),
  etkilenen_spool_sayisi integer     NOT NULL DEFAULT 0,
  notlar                 text
);

COMMENT ON TABLE arsiv.kayit_birlestirme_log IS
  'Kutuphane cakisma birlestirme audit log -- silinen ozel kayit JSONB snapshot olarak korunur';

CREATE INDEX IF NOT EXISTS idx_birlestirme_log_parca
  ON arsiv.kayit_birlestirme_log (parca_tipi, birlestirme_at DESC);

-- =====================================================================
-- 2. Listeleme RPC
-- =====================================================================

CREATE OR REPLACE FUNCTION public.v_kutuphane_cakismalari_listele()
RETURNS TABLE(
  parca_tipi          text,
  sistem_id           uuid,
  ozel_id             uuid,
  dn                  integer,
  dis_cap_mm          numeric,
  et_mm               numeric,
  sistem_standart     text,
  sistem_sch_kod      text,
  ozel_sch_kod        text,
  ozel_tenant_id      uuid,
  ozel_notlar         text,
  ozel_olusturma_at   timestamptz,
  etkilenen_spool     bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, arsiv
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE id = auth.uid() AND rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Yetkisiz: super_admin gerekli'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    'boru'::text                                  AS parca_tipi,
    s.id                                          AS sistem_id,
    o.id                                          AS ozel_id,
    s.dn                                          AS dn,
    ROUND(s.dis_cap_mm, 3)                        AS dis_cap_mm,
    ROUND(s.et_mm, 3)                             AS et_mm,
    s.standart                                    AS sistem_standart,
    s.schedule_kod                                AS sistem_sch_kod,
    o.schedule_kod                                AS ozel_sch_kod,
    o.tenant_id                                   AS ozel_tenant_id,
    o.notlar                                      AS ozel_notlar,
    o.olusturma_at                                AS ozel_olusturma_at,
    (SELECT COUNT(*) FROM public.spool_malzemeleri sm
     WHERE sm.boru_olculer_id = o.id)             AS etkilenen_spool
  FROM public.boru_olculer s
  JOIN public.boru_olculer o
    ON ROUND(s.dis_cap_mm, 3) = ROUND(o.dis_cap_mm, 3)
   AND ROUND(s.et_mm, 3)      = ROUND(o.et_mm, 3)
  WHERE s.sistem_preset = true
    AND o.sistem_preset = false
  ORDER BY o.olusturma_at DESC;
END
$function$;

COMMENT ON FUNCTION public.v_kutuphane_cakismalari_listele() IS
  'Sistem standardi vs ozel kayit cakismalarini listeler. Sadece super_admin cagirabilir.';

-- =====================================================================
-- 3. Birlestirme RPC
-- =====================================================================

CREATE OR REPLACE FUNCTION public.boru_kaydi_birlestir(
  p_ozel_id   uuid,
  p_sistem_id uuid
)
RETURNS TABLE(
  etkilenen_spool integer,
  arsiv_log_id    uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, arsiv
AS $function$
DECLARE
  v_ozel       public.boru_olculer%ROWTYPE;
  v_sistem     public.boru_olculer%ROWTYPE;
  v_etkilenen  integer;
  v_log_id     uuid;
BEGIN
  -- 1. Yetki
  IF NOT EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE id = auth.uid() AND rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Yetkisiz: super_admin gerekli'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Kayitlari bul
  SELECT * INTO v_ozel FROM public.boru_olculer WHERE id = p_ozel_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ozel kayit bulunamadi: %', p_ozel_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_sistem FROM public.boru_olculer WHERE id = p_sistem_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sistem kayit bulunamadi: %', p_sistem_id
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Mantik dogrulama -- yon hatasi onleme
  IF v_ozel.sistem_preset = true THEN
    RAISE EXCEPTION 'p_ozel_id sistem kaydi (sistem_preset=true). Parametre sirasi yanlis olabilir.';
  END IF;
  IF v_sistem.sistem_preset = false THEN
    RAISE EXCEPTION 'p_sistem_id sistem kaydi degil (sistem_preset=false). Parametre sirasi yanlis olabilir.';
  END IF;

  -- 4. Geometri eslesmesi -- sanity check
  IF ROUND(v_ozel.dis_cap_mm, 3) != ROUND(v_sistem.dis_cap_mm, 3) THEN
    RAISE EXCEPTION 'dis_cap_mm eslesmiyor: ozel=%, sistem=%',
      v_ozel.dis_cap_mm, v_sistem.dis_cap_mm;
  END IF;
  IF ROUND(v_ozel.et_mm, 3) != ROUND(v_sistem.et_mm, 3) THEN
    RAISE EXCEPTION 'et_mm eslesmiyor: ozel=%, sistem=%',
      v_ozel.et_mm, v_sistem.et_mm;
  END IF;

  -- 5. spool_malzemeleri referanslarini sistem kaydina gec
  UPDATE public.spool_malzemeleri
     SET boru_olculer_id = p_sistem_id
   WHERE boru_olculer_id = p_ozel_id;

  GET DIAGNOSTICS v_etkilenen = ROW_COUNT;

  -- 6. Arsive snapshot yaz (silmeden once)
  INSERT INTO arsiv.kayit_birlestirme_log (
    parca_tipi, ozel_kayit_id, sistem_kayit_id,
    ozel_snapshot, birlestiren, etkilenen_spool_sayisi
  ) VALUES (
    'boru', p_ozel_id, p_sistem_id,
    to_jsonb(v_ozel), auth.uid(), v_etkilenen
  ) RETURNING id INTO v_log_id;

  -- 7. Ozel kaydi sil
  DELETE FROM public.boru_olculer WHERE id = p_ozel_id;

  RETURN QUERY SELECT v_etkilenen, v_log_id;
END
$function$;

COMMENT ON FUNCTION public.boru_kaydi_birlestir(uuid, uuid) IS
  'Ozel boru kaydini sistem kaydina birlestirir. spool_malzemeleri referanslari guncellenir, ozel kayit arsive snapshot olarak yazilip silinir. Sadece super_admin.';

COMMIT;

-- =====================================================================
-- Dogrulama Sorgulari (manuel calistir):
--
-- 1. Audit tablo olustu mu?
-- SELECT table_schema, table_name FROM information_schema.tables
-- WHERE table_schema = 'arsiv' AND table_name = 'kayit_birlestirme_log';
-- Beklenen: 1 satir
--
-- 2. RPC'ler tanimli mi?
-- SELECT proname FROM pg_proc
-- WHERE proname IN ('v_kutuphane_cakismalari_listele', 'boru_kaydi_birlestir')
-- ORDER BY proname;
-- Beklenen: 2 satir
--
-- 3. Su an cakisma var mi? (super_admin yetkisi gerekli)
-- SELECT * FROM v_kutuphane_cakismalari_listele();
-- Beklenen: 0 satir
-- =====================================================================
