-- ════════════════════════════════════════════════════════════════
-- AresPipe 8. Oturum Migration — Spool ID 4 → 6 hane
-- Tarih: 20 Nisan 2026
-- Etki: Tüm tenant'larda sayac_tanimlari.spool.digits = 6
-- ════════════════════════════════════════════════════════════════

-- 1. Mevcut tenant'ların spool sayacı varsa digits=6 yap
UPDATE sayac_tanimlari
SET digits = 6
WHERE tip = 'spool';

-- 2. Doğrulama (isteğe bağlı — Supabase SQL Editor'de çalıştır)
SELECT tenant_id, tip, digits, son_no
FROM sayac_tanimlari
WHERE tip = 'spool'
ORDER BY tenant_id;

-- NOT: sayac_tanimlari'nda spool kaydı olmayan tenant'lar için
-- ares-store.js'deki _SAYAC_VARSAYILAN fallback'i zaten digits=6
-- verir. Yani INSERT şart değil, ama temizlik için şu da atılabilir:
--
-- INSERT INTO sayac_tanimlari (tenant_id, tip, prefix, yil_ekle, digits, son_no, aciklama)
-- SELECT t.id, 'spool', '', false, 6, 0, 'Spool Kisa Kod'
-- FROM tenants t
-- WHERE NOT EXISTS (
--   SELECT 1 FROM sayac_tanimlari s
--   WHERE s.tenant_id = t.id AND s.tip = 'spool'
-- );
