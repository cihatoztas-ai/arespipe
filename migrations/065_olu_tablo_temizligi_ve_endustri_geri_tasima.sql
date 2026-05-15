-- =====================================================================
-- Migration 065 — Ölü tablo temizliği + endustri_* geri taşıma
-- =====================================================================
-- Tarih: 15 Mayıs 2026
-- Oturum: 91
--
-- Amaç:
--   1. Ölü tabloyu sil: malzeme_standart_ipucu
--      - 18 satır pattern data
--      - 36. oturumda K12 kararıyla planlanmış, AI parser için
--      - grep -rn ile kod araması: 0 referans (hiçbir yerden çağrılmıyor)
--      - Cihat'ın "fazlalık dert olur" prensibinin doğru uygulaması
--
--   2. AI parser tablolarını arsiv'den public'e geri taşı:
--      - endustri_malzemeler (36 satır) — EN/DIN/W.Nr kodları sözlüğü
--      - endustri_form_astm (78 satır) — ASTM kodları sözlüğü
--
--      Bu tablolar bilinmeyen bir zamanda public'ten arsiv'e taşınmıştı.
--      Ama api/izometri-oku.js -> malzemeTaninir() fonksiyonu public.endustri_*'ya
--      sorgu atıyor. Sonuç: 35 izometri batch boyunca her spool sessizce
--      "malzeme bilinmeyen" işaretledi (catch block hatayı yutuyordu).
--
--      91'de sorun fark edildi, tablolar geri taşındı. Sessiz kırığı onarıldı.
--
-- Geri alma:
--   - DROP TABLE malzeme_standart_ipucu: tablo silindi, 18 satır eski içerik
--     kayboldu. Geri alınamaz (yedekten dönmeden).
--   - SET SCHEMA: geri almak için tersi: 
--     ALTER TABLE public.endustri_* SET SCHEMA arsiv;
--
-- ÖNEMLİ NOT:
--   Bu migration RETROAKTİF yazıldı. Değişiklikler 91. oturumda Supabase 
--   SQL Editor'da uygulanmıştı. Dosya, repo ile DB durumunu senkronlamak 
--   için sonradan eklendi. 
--
--   Idempotent: yeniden çalıştırılırsa hata vermez (zaten uygulanmış 
--   olduğunu fark edip atlar).
-- =====================================================================

BEGIN;

-- 1. Ölü tabloyu sil
DROP TABLE IF EXISTS malzeme_standart_ipucu;

-- 2. endustri_malzemeler: arsiv -> public (idempotent)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'arsiv' AND table_name = 'endustri_malzemeler'
    ) THEN
        ALTER TABLE arsiv.endustri_malzemeler SET SCHEMA public;
        RAISE NOTICE 'endustri_malzemeler arsiv -> public taşındı';
    ELSE
        RAISE NOTICE 'endustri_malzemeler zaten arsiv''de değil, atlandı';
    END IF;
END $$;

-- 3. endustri_form_astm: arsiv -> public (idempotent)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'arsiv' AND table_name = 'endustri_form_astm'
    ) THEN
        ALTER TABLE arsiv.endustri_form_astm SET SCHEMA public;
        RAISE NOTICE 'endustri_form_astm arsiv -> public taşındı';
    ELSE
        RAISE NOTICE 'endustri_form_astm zaten arsiv''de değil, atlandı';
    END IF;
END $$;

COMMIT;

-- =====================================================================
-- Doğrulama Sorguları (manuel çalıştır):
--
-- SELECT table_schema, table_name 
-- FROM information_schema.tables 
-- WHERE table_name IN (
--   'malzeme_standart_ipucu',  -- public'te OLMAMALI
--   'endustri_malzemeler',     -- public'te olmalı
--   'endustri_form_astm'       -- public'te olmalı
-- );
-- =====================================================================
