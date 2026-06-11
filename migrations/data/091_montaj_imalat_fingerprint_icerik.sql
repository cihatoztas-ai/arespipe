-- ============================================================================
-- Migration 091 — Montaj/Imalat fingerprint icerik-bazli ayrim (B plani, 115)
-- ============================================================================
-- AMAC: Montaj PDF'lerinin imalat formatina dusup montaj_modu'nu tetiklememesi
--       sorununu cozer. Cozum dosya adindan BAGIMSIZ, icerik sinyalleriyle:
--         - Imalat   = "Malzeme Listesi" + "Cut & Bending Info" + Cadmatic
--         - Montaj   = "Continue:" + Cadmatic
--       Dosya adi regex'leri her iki formattan da KALDIRILIR (M270 noktali,
--       M100 alt-cizgili gibi adlandirma ailelerine kirilgan bagimliligi biter).
--
-- ARKAPLAN (115, veriyle dogrulandi):
--   - fingerprintSkor (izometri-oku.js): dosya_adi +5, uretici/baslik/tablo +1'er.
--     ESIK = 2. izometri-oku.js'e DOKUNULMADI (MK-49.1).
--   - M270-304-001.1.pdf (montaj): "Continue:" VAR, "Malzeme Listesi"/"Cut" YOK.
--   - M270-304-001.S01.1.pdf (imalat): "Malzeme Listesi"+"Cut & Bending" VAR, "Continue:" YOK.
--   - Olculen ham metin (pdftotext -layout) ile dogrulandi -- icerik imzasi temiz.
--
-- SKOR MATRISI (091 sonrasi beklenen):
--   Montaj PDF  -> imalat fmt: 1 (Cadmatic) | montaj fmt: 2 (Continue+Cadmatic) -> MONTAJ
--   Imalat PDF  -> imalat fmt: 3 (Malzeme+Cut+Cadmatic) | montaj fmt: 1 (Cadmatic) -> IMALAT
--
-- DIKKAT (MK-99.1): izometri_format_tanimlari icin format_kodu UNIQUE olmayabilir.
--   Bu migration INSERT yapmiyor; sadece iki MEVCUT kaydi UPDATE ediyor (id ile,
--   tekil). Idempotent: tekrar calistirilirsa ayni sonucu uretir.
--
-- AKIS (MK-99 / 114): Bu dosya repoda DRY-RUN halinde (son satir ROLLBACK).
--   Supabase'de elle: dry-run (asagidaki ROLLBACK ile) -> SELECT dogrula -> sonra
--   ROLLBACK'i COMMIT yapip tekrar calistir. Otomatik migrate YOK.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) MONTAJ formati (39a2c81b): dosya_adi_regex KALDIR + baslik_regex "Continue:" EKLE
-- ----------------------------------------------------------------------------
UPDATE izometri_format_tanimlari
SET fingerprint = (fingerprint - 'dosya_adi_regex')
                  || jsonb_build_object('baslik_regex', 'Continue:'),
    guncelleme_at = now()
WHERE id = '39a2c81b-4f4b-4203-a912-cfe0c07770ad';

-- ----------------------------------------------------------------------------
-- 2) IMALAT formati (84c12f61): sadece dosya_adi_regex KALDIR
--    (baslik/tablo_baslik/uretici dokunulmaz -- imalat icerik skoru 3'te kalir)
-- ----------------------------------------------------------------------------
UPDATE izometri_format_tanimlari
SET fingerprint = (fingerprint - 'dosya_adi_regex'),
    guncelleme_at = now()
WHERE id = '84c12f61-650a-480b-ab61-12277ba09014';

-- ----------------------------------------------------------------------------
-- DOGRULAMA (dry-run'da bu SELECT'in ciktisini incele)
-- ----------------------------------------------------------------------------
SELECT id, ad, format_kodu,
       fingerprint ? 'dosya_adi_regex'      AS dosya_adi_var,   -- ikisi de FALSE olmali
       fingerprint->>'baslik_regex'         AS baslik_regex,    -- montaj: Continue: / imalat: (varsa eski)
       fingerprint->>'tablo_baslik_regex'   AS tablo_baslik,
       fingerprint->'pdf_uretici_anahtar'   AS uretici
FROM izometri_format_tanimlari
WHERE id IN ('39a2c81b-4f4b-4203-a912-cfe0c07770ad',
             '84c12f61-650a-480b-ab61-12277ba09014')
ORDER BY id;

-- Repoda DRY-RUN arsivi olarak duruyor. Canliya uygulamak icin asagidaki
-- ROLLBACK'i COMMIT ile degistir. (114 notu: yanlislikla calistirilirsa
-- ROLLBACK ikinci kez veri bozmaz; UPDATE'ler idempotent.)
ROLLBACK;
