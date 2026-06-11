-- ============================================================================
-- 081_devre_belgeleri_storage_bucket.sql
-- Wizard v2 dosya yükleme için Storage bucket + tenant-izole RLS policy'leri
-- ----------------------------------------------------------------------------
-- KAPSAM:
--   1. devre-belgeleri bucket'ı (private, 50MB limit, geniş MIME whitelist)
--   2. SELECT/INSERT/DELETE policy'leri: tenant-izole + super_admin override
--   3. UPDATE policy YOK — wizard upsert=false ile yazıyor; izometri-pdfs ile aynı
--
-- PATH PATTERN (izometri-pdfs ile tutarlı):
--   {tenant_id}/projeler/{proje_id}/devreler/{devre_id}/[{klasor_yolu}/]dosya
--   ── path[1] = tenant_id::text ── kontrolü
--
-- ÖNKOŞUL: Migration 080 canlıda çalıştı
-- ÖRNEK RLS KAYNAĞI: izometri-pdfs bucket'ı için 'Tenant izometri-pdfs okuma'
-- KARAR-97.0: Mevcut sistemi etkilemez
-- MK-98.2: BEGIN...ROLLBACK kuru çalıştırma zorunlu
-- ============================================================================

BEGIN;

-- ─── Bölüm 1: Bucket yaratımı ────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at)
VALUES (
  'devre-belgeleri',
  'devre-belgeleri',
  false,                           -- private; sadece authenticated + RLS uyan erişim
  52428800,                        -- 50 MB
  ARRAY[
    'application/pdf',                                                              -- izometri, sertifika, sartname, 3d_pdf
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',            -- xlsx (BOM)
    'application/vnd.ms-excel',                                                     -- xls (eski BOM)
    'application/octet-stream',                                                     -- step/stp/3dm/dwg (binary)
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',      -- docx
    'text/plain',
    'text/csv'
  ],
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ─── Bölüm 2: RLS Policy'leri ───────────────────────────────────────────────
-- Mevcut izometri-pdfs pattern'i ile tutarlı:
--   path = '{tenant_id}/...'
--   kontrol = (storage.foldername(name))[1] = tenant_id::text

-- 2.1 — SELECT: aynı tenant'ın dosyalarını okuyabilir + super_admin tümünü
CREATE POLICY "081_devre_belgeleri_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'devre-belgeleri'
  AND (
    -- Tenant izolasyonu
    (storage.foldername(name))[1] = (
      SELECT kullanicilar.tenant_id::text
      FROM kullanicilar
      WHERE kullanicilar.id = auth.uid()
    )
    OR
    -- Super admin override (tüm tenant'lara erişim)
    EXISTS (
      SELECT 1 FROM kullanicilar
      WHERE kullanicilar.id = auth.uid()
        AND kullanicilar.rol = 'super_admin'
    )
  )
);

-- 2.2 — INSERT: aynı tenant path'ine yazabilir + super_admin tümüne
CREATE POLICY "081_devre_belgeleri_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'devre-belgeleri'
  AND (
    (storage.foldername(name))[1] = (
      SELECT kullanicilar.tenant_id::text
      FROM kullanicilar
      WHERE kullanicilar.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM kullanicilar
      WHERE kullanicilar.id = auth.uid()
        AND kullanicilar.rol = 'super_admin'
    )
  )
);

-- 2.3 — DELETE: aynı tenant'ın dosyalarını silebilir + super_admin tümünü
-- (izometri-pdfs DELETE policy'sinin birebir adaptasyonu)
CREATE POLICY "081_devre_belgeleri_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'devre-belgeleri'
  AND (
    (storage.foldername(name))[1] = (
      SELECT kullanicilar.tenant_id::text
      FROM kullanicilar
      WHERE kullanicilar.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM kullanicilar
      WHERE kullanicilar.id = auth.uid()
        AND kullanicilar.rol = 'super_admin'
    )
  )
);

-- NOT: UPDATE policy yazılmadı — wizard upsert=false ile insert ediyor.
--      izometri-pdfs bucket'ı da UPDATE policy'siz çalışıyor, aynı pattern.
--      Sonradan upsert lazım olursa yeni migration ile eklenir.

-- ─── Bölüm 3: Smoke test sorguları (yorum halinde) ───────────────────────────
-- a) Bucket var mı?
--    SELECT id, name, public, file_size_limit
--    FROM storage.buckets WHERE id = 'devre-belgeleri';
--    Beklenen: 1 satır, public=false, file_size_limit=52428800
--
-- b) 3 policy yazıldı mı?
--    SELECT polname FROM pg_policy
--    WHERE polrelid = 'storage.objects'::regclass
--      AND polname LIKE '081_devre_belgeleri%'
--    ORDER BY polname;
--    Beklenen: 3 satır (delete, insert, select)
--
-- c) MIME whitelist tam mı?
--    SELECT array_length(allowed_mime_types, 1)
--    FROM storage.buckets WHERE id = 'devre-belgeleri';
--    Beklenen: 11

COMMIT;

-- ============================================================================
-- DOWN — Geri alma (acil durum)
-- ============================================================================
-- BEGIN;
--   DROP POLICY IF EXISTS "081_devre_belgeleri_select" ON storage.objects;
--   DROP POLICY IF EXISTS "081_devre_belgeleri_insert" ON storage.objects;
--   DROP POLICY IF EXISTS "081_devre_belgeleri_delete" ON storage.objects;
--   -- UYARI: Bucket silinmeden önce içindeki tüm objeler boş olmalı
--   -- DELETE FROM storage.buckets WHERE id = 'devre-belgeleri';
-- COMMIT;
