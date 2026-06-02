-- 097_fitting_fk_backfill_142.sql
-- 142. oturum — Karbon fitting (elbow + reducer) → fitting_olculer FK backfill.
--
-- NEDEN: spool_malzemeleri.fitting_olculer_id karbon fitting'lerde HİÇ dolu değildi (0/168).
--   Tarayıcı backfill (admin/kutuphane-backfill.html) PostgREST .limit() sıralama garantisi
--   olmadığından "her run farklı sonuç" üretiyordu → deterministik tek-SQL UPDATE'e geçildi (Yol A).
--
-- ÇEKİRDEK MANTIĞI (lib/malzeme-kutuphane-eslesme.js 142) SQL'e port edildi:
--   - parca_tipi: reducer_conc/ecc (semantik), elbow karbon→90LR/90SR (ASME-native)
--   - reducer ÇİFT ÇAP: boyut '219.1x6.3 / 114.3x4.5' → büyük + küçük çap ayrı eşleşir
--     (aynı büyük çapta birden çok meşru varyant var; küçük çap zorunlu ayraç)
--   - tolerans ±0.6 mm
--   - tek-kayıt şartı: HAVING COUNT>1 boş döndü (142 doğrulandı) → her satır tek kütüphane kaydına eşleşir
--
-- KAPSAM: SADECE karbon fitting (elbow+reducer). Boyut sayısal ('114.3x4.5') olduğundan DN→mm
--   tablosu gerekmez. Flanş (boyut='DN300') ares-olcu/tarayıcı ile bağlandı, buraya dahil DEĞİL.
--   Bağlanmayan satırlar (114.3/76.1 vb. + SR elbow + paslanmaz + tee_red) kütüphanede YOK → C planı.
--
-- SONUÇ (142 canlı, COMMIT sonrası): karbon fitting 0 → 102 bağlı (elbow 69/76, reducer 33/71).
--
-- İDEMPOTENT: WHERE fitting_olculer_id IS NULL → tekrar çalıştırılabilir, bağlı satıra dokunmaz.

BEGIN;

WITH parsed AS (
  SELECT sm.id,
    ROUND(NULLIF(regexp_replace(split_part(split_part(sm.boyut,'/',1),'x',1),'[^0-9.]','','g'),'')::numeric,1) AS buyuk_mm,
    CASE WHEN sm.boyut ~ '/'
      THEN ROUND(NULLIF(regexp_replace(split_part(trim(split_part(sm.boyut,'/',2)),'x',1),'[^0-9.]','','g'),'')::numeric,1)
      ELSE NULL END AS kucuk_mm,
    CASE
      WHEN LOWER(sm.tanim) ~ 'reducer' AND LOWER(sm.tanim) ~ 'eccentric' THEN 'reducer_ecc'
      WHEN LOWER(sm.tanim) ~ 'reducer' THEN 'reducer_conc'
      WHEN LOWER(sm.tanim) ~ 'elbow|dirsek' THEN
        CASE WHEN LOWER(sm.tanim) ~ '\m1 ?d\m|short|\msr\m' THEN '90SR' ELSE '90LR' END
      ELSE NULL END AS parca_tipi
  FROM spool_malzemeleri sm
  WHERE sm.malzeme = 'karbon'
    AND sm.fitting_olculer_id IS NULL
    AND LOWER(sm.tanim) ~ 'reducer|elbow|dirsek'
),
eslesme AS (
  SELECT p.id AS spool_id, f.id AS lib_id
  FROM parsed p
  JOIN fitting_olculer f
    ON f.malzeme_grubu = 'karbon'
    AND f.parca_tipi = p.parca_tipi
    AND f.aktif = true
    AND f.cap_buyuk_mm BETWEEN p.buyuk_mm - 0.6 AND p.buyuk_mm + 0.6
    AND (p.kucuk_mm IS NULL OR (f.cap_kucuk_mm BETWEEN p.kucuk_mm - 0.6 AND p.kucuk_mm + 0.6))
)
UPDATE spool_malzemeleri sm
SET fitting_olculer_id = e.lib_id
FROM eslesme e
WHERE sm.id = e.spool_id AND sm.fitting_olculer_id IS NULL;

-- Doğrulama (commit öncesi göz at; beklenen ~102 karbon fitting dolu)
SELECT 'karbon_fitting_dolu' AS metrik,
       COUNT(fitting_olculer_id) AS deger
FROM spool_malzemeleri
WHERE malzeme = 'karbon' AND LOWER(tanim) ~ 'reducer|elbow|dirsek';

COMMIT;
