-- 102: G2a duzeltme-birikimi sinyal gorunumu (163. oturum, MK-162.2 yakin isi)
--
-- AMAC: taslak_duzeltmeleri etiketli veridir ("sistem X dedi, insan Y dedi").
--   Ayni alanda ayni degere dogru 3+ sistematik duzeltme = "format kurali suphesi"
--   sinyali. Duzeltme KURALA DONUSMEZ (MK-160.2 + MK-162.2 ilkesi korunur) —
--   birikim yalniz UZMANA gosterilir; oneri uzman onayindan gecer.
--
-- v1 SINIRI (bilincli): format_id bagi YOK. taslak_duzeltmeleri format bilgisi
--   tasimiyor; devre -> format cikarimi uzmana birakildi (pratikte devre ~ tek format).
--   Ileride duzeltme kaydina format_id kolonu eklenirse gorunum zenginlesir.
--
-- GUVENLIK: security_invoker=true ZORUNLU — yoksa view sahibinin (postgres)
--   yetkisiyle calisir ve taslak_duzeltmeleri RLS'i (098) BYPASS edilirdi
--   (cok-tenant sizinti). invoker=true ile sorgulayan kullanicinin RLS'i gecerli.
--
-- ESIK: HAVING >= 3 (MK-162.2 "orn. 3+"). Esik degisikligi = CREATE OR REPLACE.
--
-- MK-98.2: BEGIN...ROLLBACK dry-run ile test -> temizse ROLLBACK'i COMMIT yap.
--   (Supabase SQL Editor'de BEGIN/COMMIT/ROLLBACK satirlarini ATLA - editor reddeder.)

BEGIN;

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
  MAX(t.updated_at)                                        AS son_duzeltme
FROM taslak_duzeltmeleri t
GROUP BY
  t.tenant_id,
  t.alan,
  CASE WHEN t.kalem_idx = -1 THEN 'spool' ELSE 'kalem' END,
  t.deger
HAVING COUNT(*) >= 3;

COMMENT ON VIEW g2a_duzeltme_sinyali IS
  'MK-162.2: format kurali suphesi sinyali. Ayni alan+deger yonunde 3+ duzeltme birikimi. Duzeltme kurala donusmez; birikim uzmana oneri sinyalidir.';

-- Dogrulama (dry-run'da gozle):
--   SELECT * FROM g2a_duzeltme_sinyali ORDER BY duzeltme_sayisi DESC LIMIT 10;
--   (Bos donmesi normal - henuz 3+ birikim olmayabilir. Hata vermemesi yeterli.)

ROLLBACK;  -- DRY-RUN. Cikti temizse bu satiri COMMIT yapip tekrar calistir.
