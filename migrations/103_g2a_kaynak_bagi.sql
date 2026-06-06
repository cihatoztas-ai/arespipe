-- 103: G2a v2 — duzeltmeye kaynak bagi (164. oturum, MK-162.2 v2 / 164 karari)
--
-- BULGU (164-B1): v1 sinyallerinin isaret ettigi degerler Excel kabuktan geliyor,
--   PDF format kuralindan degil. v1 kart metni yanlis adres gosteriyordu.
-- COZUM: duzeltme KAYIT ANINDA kaynagini tasir (gorunum-zamani tahmin YOK):
--   deger_kaynagi = 'excel'    -> wizard spool basligi + BOM kalemi (Excel kabuk degeri)
--                   'izometri' -> format_tanit B2 (PDF parse degeri) + format_id dolu
--                   'operator' -> operatorun ekledigi yeni kalem (onceki deger yok)
--   Eski satirlar NULL kalir = 'bilinmiyor' (tahmin backfill YASAK - MK-163.6 ilkesi).
--
-- GUVENLIK: security_invoker=true KORUNUR (102 ile ayni gerekce - RLS bypass yok).
--   Not: izometri_format_tanimlari JOIN'i de invoker RLS'inden gecer; ad gorunmezse
--   UI format_id'nin ilk 8 hanesini basar.
--
-- MK-98.2: BEGIN...ROLLBACK dry-run ile test -> temizse ROLLBACK'i COMMIT yap.
--   (Supabase SQL Editor'de BEGIN/COMMIT/ROLLBACK satirlarini ATLA - editor reddeder.)

BEGIN;

ALTER TABLE taslak_duzeltmeleri
  ADD COLUMN deger_kaynagi text NULL
    CHECK (deger_kaynagi IS NULL OR deger_kaynagi IN ('excel','izometri','operator')),
  ADD COLUMN format_id uuid NULL
    REFERENCES izometri_format_tanimlari(id) ON DELETE SET NULL;

COMMENT ON COLUMN taslak_duzeltmeleri.deger_kaynagi IS
  '164: duzeltilen DEGERIN kaynagi (excel kabuk / izometri parse / operator-yeni). NULL = 103 oncesi kayit, bilinmiyor.';
COMMENT ON COLUMN taslak_duzeltmeleri.format_id IS
  '164: deger_kaynagi=izometri ise degeri ureten format. Sinyal gorunumu bununla formata baglanir.';

-- Gorunum v2: kaynak kirilimi + format bagi. Yeni kolonlar SONA eklendi
-- (CREATE OR REPLACE VIEW kolon ekini yalniz sonda kabul eder).
CREATE OR REPLACE VIEW g2a_duzeltme_sinyali
WITH (security_invoker = true) AS
SELECT
  t.tenant_id,
  t.alan,
  CASE WHEN t.kalem_idx = -1 THEN 'spool' ELSE 'kalem' END AS seviye,
  t.deger                                                  AS duzeltilen_deger,
  COUNT(*)                                                 AS duzeltme_sayisi,
  COUNT(DISTINCT t.devre_id)                               AS devre_sayisi,
  COUNT(DISTINCT t.pipeline_no || '/' || t.spool_no)       AS spool_sayisi,
  MIN(t.created_at)                                        AS ilk_duzeltme,
  MAX(t.updated_at)                                        AS son_duzeltme,
  t.deger_kaynagi,
  t.format_id,
  f.ad                                                     AS format_ad
FROM taslak_duzeltmeleri t
LEFT JOIN izometri_format_tanimlari f ON f.id = t.format_id
GROUP BY
  t.tenant_id,
  t.alan,
  CASE WHEN t.kalem_idx = -1 THEN 'spool' ELSE 'kalem' END,
  t.deger,
  t.deger_kaynagi,
  t.format_id,
  f.ad
HAVING COUNT(*) >= 3;

COMMENT ON VIEW g2a_duzeltme_sinyali IS
  'MK-162.2 v2 (164): format kurali suphesi sinyali, kaynak kirilimli. excel=Excel hatti suphesi, izometri=PDF format suphesi (format_id), NULL=bilinmiyor (103 oncesi). Duzeltme kurala donusmez.';

-- Dogrulama (dry-run'da gozle):
--   SELECT alan, duzeltilen_deger, duzeltme_sayisi, deger_kaynagi, format_id
--   FROM g2a_duzeltme_sinyali ORDER BY duzeltme_sayisi DESC;
--   (Mevcut 7 sinyal deger_kaynagi=NULL kovasinda AYNEN gorunmeli - sayilar degismez.)

ROLLBACK;  -- DRY-RUN. Cikti temizse bu satiri COMMIT yapip tekrar calistir.
