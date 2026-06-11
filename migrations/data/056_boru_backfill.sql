-- ============================================================================
-- Migration 056 — Boru otomatik back-fill (83. oturum)
-- ============================================================================
-- Amaç:
--   spool_malzemeleri.tip='boru' satırlarını boru_olculer kütüphanesindeki
--   tam ölçü eşleşmesi (dis_cap_mm + et_mm) ile FK üzerinden bağla.
--
-- Bağlam:
--   055 ile boru_olculer_id FK kolonu eklenmişti, ama tüm boru satırları
--   NULL'du. 44. oturumdan beri runtime'da eşleştirme yapılıyor ama FK
--   kaydedilmiyordu — silent state.
--   056 bu durumu tek seferlik back-fill ile çözer.
--   Gelecekteki spool'lar için boruModalAc fonksiyonunun FK kaydetmesi
--   84.D gündeminde (frontend patch).
--
-- Eşleşme stratejisi:
--   Tam ölçü eşleşmesi (exact match). Tolerans yok — yanlış pozitif riski olur.
--   Eşleşmeyen satırlar (41 adet) 84.B'de analiz edilecek:
--     - Kütüphanede o ölçü var mı? Yoksa kütüphane doldurma önceliği.
--     - Yazım/scale farkı mı? Migration 058 ile tolerans bazlı eşleşme.
--
-- Çalıştırıldı: 13 Mayıs 2026, Supabase Studio (production)
-- İdempotent: ✓ (WHERE boru_olculer_id IS NULL — yeniden çalıştırınca 0 etkiler)
-- Geri alma:
--   UPDATE spool_malzemeleri SET boru_olculer_id = NULL WHERE tip = 'boru';
-- ============================================================================

BEGIN;

UPDATE spool_malzemeleri sm
SET boru_olculer_id = bo.id
FROM boru_olculer bo
WHERE sm.tip = 'boru'
  AND sm.boru_olculer_id IS NULL
  AND sm.dis_cap_mm IS NOT NULL
  AND sm.et_mm      IS NOT NULL
  AND bo.dis_cap_mm = sm.dis_cap_mm
  AND bo.et_mm      = sm.et_mm;
-- Beklenen: 29 satır etkilenir (83. oturumda doğrulandı)
-- "Success. No rows returned" Supabase'in standart UPDATE çıktısı —
-- gerçek satır sayısı için aşağıdaki doğrulama sorgusu çalıştırılmalı.

-- Doğrulama (83. oturum kontrolü için referans):
-- SELECT
--   count(*) FILTER (WHERE boru_olculer_id IS NOT NULL) AS bagli,
--   count(*) FILTER (WHERE boru_olculer_id IS NULL)     AS bagli_degil,
--   count(*)                                            AS toplam_boru
-- FROM spool_malzemeleri
-- WHERE tip = 'boru';
-- Beklenen: bagli=29, bagli_degil=41, toplam_boru=70

COMMIT;
