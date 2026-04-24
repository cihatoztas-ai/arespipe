-- ╔════════════════════════════════════════════════════════════════╗
-- ║ <N>-OTURUM — <KONU>                                            ║
-- ║                                                                ║
-- ║ Tarih: <GG AY YYYY>                                            ║
-- ║ Yazan: <İsim veya Claude>                                      ║
-- ║                                                                ║
-- ║ İçerik:                                                        ║
-- ║  1. <adım açıklaması>                                          ║
-- ║  2. <adım açıklaması>                                          ║
-- ║  3. ...                                                        ║
-- ║                                                                ║
-- ║ Risk: <Düşük / Orta / Yüksek — açıklama>                       ║
-- ║  - <neden>                                                     ║
-- ║  - <neden>                                                     ║
-- ║                                                                ║
-- ║ Geri alma:                                                     ║
-- ║  - <rollback SQL veya adım>                                    ║
-- ║  - Önceki fonksiyon tanımlarını sakladıysan git history'den    ║
-- ║                                                                ║
-- ║ Bağımlılıklar:                                                 ║
-- ║  - <önceki migration> tamamlanmış olmalı                       ║
-- ║  - <tablo adı> mevcut olmalı                                   ║
-- ╚════════════════════════════════════════════════════════════════╝

BEGIN;

-- ══════════════════════════════════════════════════════════════════
-- 1. <ADIM BAŞLIĞI>
-- ══════════════════════════════════════════════════════════════════

-- Örnek: Yeni tablo
-- CREATE TABLE IF NOT EXISTS yeni_tablo (
--   id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
--   ad          text NOT NULL,
--   aktif       boolean NOT NULL DEFAULT true,
--   olusturma   timestamptz NOT NULL DEFAULT now(),
--   guncelleme  timestamptz,
--   CONSTRAINT yeni_tablo_ad_nonempty CHECK (length(trim(ad)) > 0)
-- );
--
-- COMMENT ON TABLE yeni_tablo IS '...';


-- ══════════════════════════════════════════════════════════════════
-- 2. INDEX'LER
-- ══════════════════════════════════════════════════════════════════

-- Tenant-scoped query performansı için:
-- CREATE INDEX IF NOT EXISTS yeni_tablo_tenant_idx
--   ON yeni_tablo (tenant_id);

-- Unique constraint (partial index pattern'i):
-- CREATE UNIQUE INDEX IF NOT EXISTS yeni_tablo_unique_sistem
--   ON yeni_tablo (UPPER(TRIM(ad)))
--   WHERE tenant_id IS NULL;


-- ══════════════════════════════════════════════════════════════════
-- 3. RLS POLICY (malzeme_tanimlari pattern'i)
-- ══════════════════════════════════════════════════════════════════

-- ALTER TABLE yeni_tablo ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS yeni_tablo_select ON yeni_tablo;
-- CREATE POLICY yeni_tablo_select ON yeni_tablo
--   FOR SELECT
--   USING (
--     (tenant_id IS NULL)
--     OR (tenant_id IN (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()))
--   );
--
-- DROP POLICY IF EXISTS yeni_tablo_insert ON yeni_tablo;
-- CREATE POLICY yeni_tablo_insert ON yeni_tablo
--   FOR INSERT
--   WITH CHECK (
--     (tenant_id IS NOT NULL)
--     AND (tenant_id IN (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()))
--   );
--
-- DROP POLICY IF EXISTS yeni_tablo_update ON yeni_tablo;
-- CREATE POLICY yeni_tablo_update ON yeni_tablo
--   FOR UPDATE
--   USING (
--     (tenant_id IS NOT NULL)
--     AND (tenant_id IN (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()))
--   )
--   WITH CHECK (
--     (tenant_id IS NOT NULL)
--     AND (tenant_id IN (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()))
--   );
--
-- DROP POLICY IF EXISTS yeni_tablo_delete ON yeni_tablo;
-- CREATE POLICY yeni_tablo_delete ON yeni_tablo
--   FOR DELETE
--   USING (
--     (tenant_id IS NOT NULL)
--     AND (tenant_id IN (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()))
--   );


-- ══════════════════════════════════════════════════════════════════
-- 4. FONKSİYON / TRIGGER (gerekirse)
-- ══════════════════════════════════════════════════════════════════

-- CREATE OR REPLACE FUNCTION public.ornek_fonksiyon(...)
--  RETURNS ...
--  LANGUAGE plpgsql
--  SECURITY DEFINER  -- RLS bypass ederken (dikkatli kullan)
-- AS $function$
-- BEGIN
--   ...
-- END;
-- $function$;


-- ══════════════════════════════════════════════════════════════════
-- 5. SEED DATA (gerekirse)
-- ══════════════════════════════════════════════════════════════════

-- INSERT INTO yeni_tablo (tenant_id, ad, ...) VALUES
--   (NULL, 'sistem-kaydi-1', ...),
--   (NULL, 'sistem-kaydi-2', ...);


COMMIT;


-- ══════════════════════════════════════════════════════════════════
-- TEST QUERY'LERİ — Migration SONRASI manuel çalıştır
-- ══════════════════════════════════════════════════════════════════

-- ┌── Test 1: Tablo/kolon mevcut mu ──┐
-- /*
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'yeni_tablo'
-- ORDER BY ordinal_position;
-- */

-- ┌── Test 2: RLS policy'leri eklendi mi ──┐
-- /*
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'yeni_tablo';
-- */

-- ┌── Test 3: Fonksiyon çalışıyor mu ──┐
-- /*
-- SELECT ornek_fonksiyon('test-input') AS cikti;
-- */


-- ══════════════════════════════════════════════════════════════════
-- NOTLAR
-- ══════════════════════════════════════════════════════════════════
--
-- * `CREATE OR REPLACE FUNCTION` idempotent — tekrar çalıştırılabilir.
-- * `CREATE TABLE IF NOT EXISTS` ilk çalıştırmada yaratır, sonrakiler geçer.
-- * `DROP POLICY IF EXISTS` + `CREATE POLICY` pattern'i re-run safe.
-- * Tablo için `DROP TABLE` CASCADE kullanırken FK bağımlı veriler de silinir — dikkat.
-- * Postgres DDL transaction-safe: BEGIN/COMMIT içinde hata olursa tümü rollback.
-- * `SECURITY DEFINER` fonksiyonlar RLS bypass eder — sadece gerektiğinde.
--
-- CHECK değişiklikleri sırası (CLAUDE.md Bölüm 2'de detay):
--   1. DROP eski CHECK
--   2. UPDATE uyumsuz kayıtları
--   3. ADD yeni CHECK
--
-- FK ekleme — embed sorgularda disambiguate:
--   SELECT ..., table_name!fk_kolonu (...) FROM ...
