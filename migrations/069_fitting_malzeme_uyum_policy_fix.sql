-- =====================================================================
-- Migration 066b — fitting_malzeme_uyum RLS policy referans düzeltme
-- =====================================================================
-- Tarih: 16 Mayıs 2026
-- Oturum: 92
--
-- Amaç: 066 FK'ları düzeltti ama RLS policy'leri eski yanlış tabloyu 
-- (flansh_olculer) referanslamaya devam ediyor. Bu yüzden satır eklenemez 
-- — policy reddeder.
--
-- Tespit (92'de):
--   SELECT polname, pg_get_expr(polqual, polrelid) FROM pg_policy
--   WHERE polrelid = 'public.fitting_malzeme_uyum'::regclass;
--   
--   fitting_malzeme_uyum_select:
--     FROM flansh_olculer f WHERE f.id = fitting_malzeme_uyum.fitting_id ...
--   fitting_malzeme_uyum_modify:
--     FROM flansh_olculer f WHERE f.id = fitting_malzeme_uyum.fitting_id ...
--
-- Düzeltme: flansh_olculer → fitting_olculer.
-- 
-- Mantık (pattern aynı kalıyor):
--   - SELECT: fitting kayıtı görünür ise (sistem_preset=true VEYA tenant 
--     eşleşmesi varsa), o fitting için tüm malzeme çiftleri görünür
--   - MODIFY (INSERT/UPDATE/DELETE): fitting tenant'a aitse (sistem değilse), 
--     uyumu değiştirebilir
--
-- Veri kaybı riski: SIFIR (tablo zaten boş).
--
-- Önkoşul: Migration 066 çalıştırılmış olmalı (FK'lar fitting_olculer'a 
-- bağlı). Eğer 066 öncesi çalıştırılırsa policy yine kırık kalır 
-- (fitting_id artık var olmayan tabloya bağlı), ama PostgreSQL FK constraint
-- önce şikayet eder.
-- =====================================================================

BEGIN;

-- 1. Eski policy'leri sil (referans yanlış)
DROP POLICY IF EXISTS fitting_malzeme_uyum_select ON fitting_malzeme_uyum;
DROP POLICY IF EXISTS fitting_malzeme_uyum_modify ON fitting_malzeme_uyum;

-- 2. SELECT policy — fitting görülebilirse, uyum satırı da görülebilir
CREATE POLICY fitting_malzeme_uyum_select
  ON fitting_malzeme_uyum
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitting_olculer f
      WHERE f.id = fitting_malzeme_uyum.fitting_id
        AND (
          f.sistem_preset = true
          OR f.tenant_id = (
            SELECT kullanicilar.tenant_id
            FROM kullanicilar
            WHERE kullanicilar.id = auth.uid()
          )
        )
    )
  );

-- 3. MODIFY policy — tenant'a ait özel fitting kayıtları için değiştirilebilir
CREATE POLICY fitting_malzeme_uyum_modify
  ON fitting_malzeme_uyum
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fitting_olculer f
      WHERE f.id = fitting_malzeme_uyum.fitting_id
        AND f.sistem_preset = false
        AND f.tenant_id = (
          SELECT kullanicilar.tenant_id
          FROM kullanicilar
          WHERE kullanicilar.id = auth.uid()
        )
    )
  );

COMMIT;

-- =====================================================================
-- Doğrulama Sorgusu (manuel çalıştır):
--
-- SELECT
--   polname AS policy_adi,
--   polcmd AS komut,
--   pg_get_expr(polqual, polrelid) AS using_ifadesi
-- FROM pg_policy
-- WHERE polrelid = 'public.fitting_malzeme_uyum'::regclass
-- ORDER BY polname;
--
-- Beklenen 2 satır:
--   fitting_malzeme_uyum_modify  | *  | EXISTS (... FROM fitting_olculer f ...)
--   fitting_malzeme_uyum_select  | r  | EXISTS (... FROM fitting_olculer f ...)
--
-- KRİTİK: using_ifadesi içinde "fitting_olculer" geçmeli, "flansh_olculer" 
-- ASLA görünmemeli. Bu kontrolü gözle yap.
-- =====================================================================
