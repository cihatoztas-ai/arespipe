-- ============================================================================
-- Migration 072 — olusturma_at → olusturma rename (tutarlılık)
-- ============================================================================
--
-- 93. Oturum (16 May 2026) — Bug 2 fix
--
-- BAĞLAM:
-- 92. oturumda yeni oluşturulan tablolarda kolon adı 'olusturma_at' kullanıldı.
-- Mevcut tablolar (boru_olculer, fitting_olculer, flansh_olculer,
-- malzeme_kataloglari, vb.) 'olusturma' kullanıyor.
--
-- KARAR (93):
-- Yeni tabloları suffix'siz yap (eski tablo sayısı çok, rename riskli).
-- Postgres standardı '_at' suffix önerir ama mevcut tablolarda olmadığı için
-- tutarlılık daha öncelikli.
--
-- ETKİLENEN TABLOLAR:
--   - public.boru_malzeme_uyum.olusturma_at → olusturma
--   - public.flansh_malzeme_uyum.olusturma_at → olusturma
--   - arsiv.kayit_birlestirme_log.birlestirme_at (audit tablosu, kalsın)
--
-- NOT: fitting_malzeme_uyum — 92 öncesi tablo, kontrol etmek lazım. Bu
-- migration çalıştırılmadan önce information_schema sorgusuyla doğrula.
-- ============================================================================

BEGIN;

-- Önce mevcut durumu doğrula
DO $$
DECLARE
  v_boru_at INT;
  v_boru INT;
  v_flansh_at INT;
  v_flansh INT;
BEGIN
  SELECT COUNT(*) INTO v_boru_at FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boru_malzeme_uyum' AND column_name = 'olusturma_at';
  SELECT COUNT(*) INTO v_boru FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boru_malzeme_uyum' AND column_name = 'olusturma';
  SELECT COUNT(*) INTO v_flansh_at FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flansh_malzeme_uyum' AND column_name = 'olusturma_at';
  SELECT COUNT(*) INTO v_flansh FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flansh_malzeme_uyum' AND column_name = 'olusturma';

  RAISE NOTICE 'boru_malzeme_uyum: olusturma_at=%, olusturma=%', v_boru_at, v_boru;
  RAISE NOTICE 'flansh_malzeme_uyum: olusturma_at=%, olusturma=%', v_flansh_at, v_flansh;
END $$;

-- Rename'ler (IF EXISTS güvenliği için)
ALTER TABLE IF EXISTS public.boru_malzeme_uyum
  RENAME COLUMN olusturma_at TO olusturma;

ALTER TABLE IF EXISTS public.flansh_malzeme_uyum
  RENAME COLUMN olusturma_at TO olusturma;

-- ============================================================================
-- DOĞRULAMA
-- ============================================================================
-- Beklenen: her iki tabloda olusturma_at=0, olusturma=1 olmalı.

SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('boru_malzeme_uyum', 'flansh_malzeme_uyum')
  AND column_name IN ('olusturma', 'olusturma_at')
ORDER BY table_name, column_name;

-- Eğer sonuçlar beklenen değil ise: ROLLBACK;
-- Eğer fitting_malzeme_uyum'da da olusturma_at varsa (sonradan keşfedilirse),
-- bu migration'a ek bir ALTER TABLE eklenir ve yeniden çalıştırılır.

COMMIT;
