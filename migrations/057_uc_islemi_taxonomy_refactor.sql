-- migrations/057_uc_islemi_taxonomy_refactor.sql
-- =====================================================================
-- Oturum 84.A — KARAR-83.2 DB tarafı uygulaması (v3)
-- =====================================================================
--
-- Amaç:
--   1) spool_malzemeleri tablosuna uc_a_islemi + uc_b_islemi kolonları ekle
--   2) 36 Victaulic Groove-Steel kaydını parent boruya nitelik olarak migrate et
--   3) Migration sonrası Victaulic kayıtlarını sil (taxonomy temizliği)
--
-- KARAR-83.2: "Uç işlemleri parça değil, niteliktir."
-- MK-83.2:    tip enum'una 'islem' EKLENMEZ; uç işlemleri KOLON olarak durur.
--
-- Atama algoritması (her Victaulic için aynı spool'da):
--   Öncelik 1: dis_cap_mm UYUMLU boru
--   Tie-breaker: en eski olusturma
--
-- v2 -> v3 değişiklik: UPDATE'ten `guncelleme = now()` set'i kaldırıldı.
--   Sebep: spool_malzemeleri'nde böyle bir kolon yok (v2 ERROR 42703).
--   Etki: Migration audit trail'i git history + RAISE NOTICE çıktısı ile sağlanır.
--
-- Veri keşfi: Toplam 36 Victaulic, yetim 0, net 19, çoklu boru-uyumlu 12, belirsiz 5.
-- =====================================================================

-- =====================================================================
-- 1) Şema değişikliği: uc_a_islemi + uc_b_islemi kolonları + CHECK
-- =====================================================================

ALTER TABLE spool_malzemeleri
  ADD COLUMN IF NOT EXISTS uc_a_islemi TEXT,
  ADD COLUMN IF NOT EXISTS uc_b_islemi TEXT;

ALTER TABLE spool_malzemeleri
  DROP CONSTRAINT IF EXISTS spool_malzemeleri_uc_islemi_chk;

ALTER TABLE spool_malzemeleri
  ADD CONSTRAINT spool_malzemeleri_uc_islemi_chk
  CHECK (
    (uc_a_islemi IS NULL OR uc_a_islemi IN
      ('plain','bevel','groove_victaulic','threaded','socket'))
    AND
    (uc_b_islemi IS NULL OR uc_b_islemi IN
      ('plain','bevel','groove_victaulic','threaded','socket'))
  );

COMMENT ON COLUMN spool_malzemeleri.uc_a_islemi IS
  'Boru A ucu islemi (KARAR-83.2). plain | bevel | groove_victaulic | threaded | socket';
COMMENT ON COLUMN spool_malzemeleri.uc_b_islemi IS
  'Boru B ucu islemi (KARAR-83.2). plain | bevel | groove_victaulic | threaded | socket';

-- =====================================================================
-- 2) ATAMA PLANI — UPDATE öncesi inceleme raporu (36 satır beklenir)
-- =====================================================================

WITH parent_secimi AS (
  SELECT DISTINCT ON (v.id)
    v.id           AS victaulic_id,
    v.spool_id,
    v.tanim        AS victaulic_tanim,
    v.dis_cap_mm   AS vic_dn,
    b.id           AS parent_boru_id,
    b.tanim        AS parent_boru_tanim,
    b.dis_cap_mm   AS parent_dn,
    b.et_mm        AS parent_et,
    CASE WHEN b.dis_cap_mm = v.dis_cap_mm THEN 'CAP_UYUMLU' ELSE 'CAP_FARKLI' END AS uyum
  FROM spool_malzemeleri v
  JOIN spool_malzemeleri b
    ON b.spool_id = v.spool_id
   AND b.tip = 'boru'
  WHERE v.tanim ILIKE '%victaulic%'
  ORDER BY
    v.id,
    CASE WHEN b.dis_cap_mm = v.dis_cap_mm THEN 0 ELSE 1 END,
    b.olusturma
)
SELECT
  victaulic_tanim,
  vic_dn,
  parent_boru_tanim,
  parent_dn,
  parent_et,
  uyum,
  spool_id
FROM parent_secimi
ORDER BY uyum DESC, vic_dn DESC, parent_boru_tanim;

-- =====================================================================
-- 3) ATOMIK UYGULAMA — UPDATE + DELETE tek DO bloğunda
--    Defansif kontrol: UPDATE 0 satır etkilerse RAISE EXCEPTION -> DELETE iptal
-- =====================================================================

DO $$
DECLARE
  v_guncellenen_boru   INT;
  v_silinen_victaulic  INT;
BEGIN
  -- UPDATE: parent boruya uc_a_islemi='groove_victaulic' ata
  WITH parent_secimi AS (
    SELECT DISTINCT ON (v.id)
      v.id  AS victaulic_id,
      b.id  AS parent_boru_id
    FROM spool_malzemeleri v
    JOIN spool_malzemeleri b
      ON b.spool_id = v.spool_id
     AND b.tip = 'boru'
    WHERE v.tanim ILIKE '%victaulic%'
    ORDER BY
      v.id,
      CASE WHEN b.dis_cap_mm = v.dis_cap_mm THEN 0 ELSE 1 END,
      b.olusturma
  )
  UPDATE spool_malzemeleri sm
  SET uc_a_islemi = 'groove_victaulic'
  FROM parent_secimi ps
  WHERE sm.id = ps.parent_boru_id;

  GET DIAGNOSTICS v_guncellenen_boru = ROW_COUNT;
  RAISE NOTICE 'UPDATE -> % boru satirina uc_a_islemi=groove_victaulic atandi', v_guncellenen_boru;

  -- Defansif kontrol: 0 satır etkilenirse DELETE iptal
  IF v_guncellenen_boru = 0 THEN
    IF NOT EXISTS (SELECT 1 FROM spool_malzemeleri WHERE tanim ILIKE '%victaulic%') THEN
      RAISE NOTICE 'Hic Victaulic kaydi kalmamis - migration daha once calistirilmis olabilir, atlaniyor';
      RETURN;
    ELSE
      RAISE EXCEPTION 'KRITIK: UPDATE 0 satir etkiledi ama Victaulic kayitlari hala var. DELETE iptal edildi.';
    END IF;
  END IF;

  -- DELETE: Victaulic satırlarını sil
  DELETE FROM spool_malzemeleri
  WHERE tanim ILIKE '%victaulic%';

  GET DIAGNOSTICS v_silinen_victaulic = ROW_COUNT;
  RAISE NOTICE 'DELETE -> % Victaulic satiri silindi', v_silinen_victaulic;

  IF v_silinen_victaulic > v_guncellenen_boru * 2 THEN
    RAISE WARNING 'Anomali: silinen Victaulic (%) update edilen boru (%) sayisinin iki katindan fazla',
      v_silinen_victaulic, v_guncellenen_boru;
  END IF;
END $$;

-- =====================================================================
-- 4) DOĞRULAMA SELECT'leri
-- =====================================================================

-- 4.1) Victaulic kalmadı mı? (beklenen: 0)
SELECT 'D1 - Kalan Victaulic' AS test, count(*)::text AS sonuc
FROM spool_malzemeleri WHERE tanim ILIKE '%victaulic%';

-- 4.2) Kaç boru groove_victaulic aldı? (beklenen: ~31-36)
SELECT 'D2 - groove_victaulic alan boru' AS test, count(*)::text AS sonuc
FROM spool_malzemeleri WHERE uc_a_islemi = 'groove_victaulic';

-- 4.3) tip dağılımı (beklenen: fitting=43, boru=70, flansh=11)
SELECT 'D3 - tip: ' || tip AS test, count(*)::text AS sonuc
FROM spool_malzemeleri
GROUP BY tip
ORDER BY tip;

-- 4.4) groove_victaulic alan boruların çap dağılımı
SELECT
  'D4 - DN ' || dis_cap_mm::text || ' x t ' || et_mm::text AS test,
  count(*)::text AS sonuc
FROM spool_malzemeleri
WHERE uc_a_islemi = 'groove_victaulic'
GROUP BY dis_cap_mm, et_mm
ORDER BY count(*) DESC;
