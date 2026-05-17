-- ============================================================================
-- Migration 075 — Standart adı normalizasyonu (ASME ailesi)
-- ============================================================================
--
-- 93. Oturum (16 May 2026)
--
-- BAĞLAM:
-- Boru/fitting/flansh tablolarında ASME standartları üç farklı yazımla durur:
--   boru:    'ASME-B36.10M', 'ASME-B36.19M'  (tire ile, doğru)
--   fitting: 'ASME B16.11', 'ASME B16.9'      (boşluk ile, tutarsız)
--   flansh:  'B16.5'                          (öneksiz, tutarsız)
--
-- EN ve diğer aileler zaten tutarlı (EN-1092-1, DIN-2448, ASTM-B241, vs.).
-- Sadece 3 satır eski yazımdan etkileniyor:
--   fitting.standart='ASME B16.11'  → 'ASME-B16.11'  (105 kayıt)
--   fitting.standart='ASME B16.9'   → 'ASME-B16.9'   (464 kayıt)
--   flansh.standart='B16.5'         → 'ASME-B16.5'   (216 kayıt)
--
-- KARAR (standart format kuralı):
--   <KURUM>-<KOD>  — tek tire, boşluk yok, nokta korunur, hepsi büyük harf
--   örnek: ASME-B16.9, EN-1092-1, ASTM-B241, ASME-B36.10M
--
-- UI etkisi: kutuphane-detay.html '?std=' parametresini olduğu gibi kullanıyor;
-- mevcut detay linkleri (örn. 'ASME B16.9' bookmarklı) artık çalışmayacak.
-- _nrm() normalizasyonu URL'de boşluk/tire farkı toleranslı zaten — eski URL'ler
-- yeni std değerine bağlanır. Risk düşük.
-- ============================================================================

UPDATE fitting_olculer
SET standart = 'ASME-B16.11'
WHERE standart = 'ASME B16.11';

UPDATE fitting_olculer
SET standart = 'ASME-B16.9'
WHERE standart = 'ASME B16.9';

UPDATE flansh_olculer
SET standart = 'ASME-B16.5'
WHERE standart = 'B16.5';

-- ============================================================================
-- DOĞRULAMA
-- ============================================================================
-- Beklenen: eski yazımlar 0, yeni yazımlar dolu.

SELECT 'boru' AS tablo, standart, COUNT(*) AS adet
FROM boru_olculer
GROUP BY standart
UNION ALL
SELECT 'fitting', standart, COUNT(*)
FROM fitting_olculer
GROUP BY standart
UNION ALL
SELECT 'flansh', standart, COUNT(*)
FROM flansh_olculer
GROUP BY standart
ORDER BY tablo, standart;

-- ASME B16.x veya B16.5 yazımı kalmamış olmalı.
