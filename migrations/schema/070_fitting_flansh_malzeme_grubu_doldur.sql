-- ============================================================================
-- Migration 070 — fitting_olculer + flansh_olculer malzeme_grubu doldur
-- ============================================================================
--
-- 93. Oturum (16 May 2026) — Bug 1 pragmatik fix (Seçenek A)
--
-- BAĞLAM:
-- fitting_olculer (569 satır) ve flansh_olculer (308 satır) tablolarında
-- malzeme_grubu kolonu tamamen NULL'du. UI sayfası (kutuphane-malzemeler.html)
-- malzeme_grubu ile gruplama yaptığı için 877 satırlık geometri verisi UI'dan
-- görünmüyordu, sadece sayım gösteriyordu.
--
-- KARAR (93):
-- Seçenek A — pragmatik fix. NULL'ları 'karbon' ile doldur. UI hemen çalışır.
-- KARAR-43 (geometri ≠ malzeme) mimari prensibi gereği uzun vadede Seçenek B
-- yapılacak: malzeme_grubu kolonu fitting/flansh'tan kaldırılacak, çapraz
-- uyum tabloları (fitting_malzeme_uyum, flansh_malzeme_uyum) üzerinden
-- "hangi malzemelerden üretilebilir" gösterimi gelecek.
--
-- AÇIK BORÇ (93 → ileri oturum):
-- B seçeneği iş listesinde. Bu UPDATE sonra DROP COLUMN ile geri alınacak.
-- ============================================================================

BEGIN;

-- Fitting tablosu
UPDATE fitting_olculer
SET malzeme_grubu = 'karbon'
WHERE malzeme_grubu IS NULL;

-- Flansh tablosu
UPDATE flansh_olculer
SET malzeme_grubu = 'karbon'
WHERE malzeme_grubu IS NULL;

-- ============================================================================
-- DOĞRULAMA (commit öncesi gözle)
-- ============================================================================
-- Beklenen çıktı:
--   fitting | 569 | 569
--   flansh  | 308 | 308

SELECT 'fitting' AS tablo,
       COUNT(*) AS toplam,
       COUNT(malzeme_grubu) AS dolu_sayisi,
       COUNT(*) FILTER (WHERE malzeme_grubu IS NULL) AS bos_sayisi
FROM fitting_olculer
UNION ALL
SELECT 'flansh',
       COUNT(*),
       COUNT(malzeme_grubu),
       COUNT(*) FILTER (WHERE malzeme_grubu IS NULL)
FROM flansh_olculer;

-- Dolu sayıları toplam = dolu_sayisi, bos_sayisi = 0 olmalı.
-- Eğer beklenen değil ise: ROLLBACK; ile geri al, durumu rapor et.

COMMIT;
