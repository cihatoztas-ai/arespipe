-- ============================================================
-- 030 — Doğrulama (027-028-029 migration'larından sonra çalıştır)
-- ============================================================
-- Bu sorguları sırayla çalıştır, beklenen sonuçlarla karşılaştır.
-- ============================================================


-- ─── 1. boru_olculer kolon yapısı kontrol ───
-- Beklenen: tenant_id (uuid) + sistem_preset (boolean) eklenmiş olmalı
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'boru_olculer'
  AND column_name IN ('tenant_id', 'sistem_preset')
ORDER BY column_name;


-- ─── 2. Mevcut 238 satır sistem_preset olarak işaretli mi? ───
-- Beklenen: tüm B36.10M karbon kayıtları sistem_preset=TRUE, tenant_id=NULL
SELECT 
  sistem_preset,
  COUNT(*) AS kayit_sayisi,
  COUNT(tenant_id) AS tenant_dolu_sayisi
FROM boru_olculer
GROUP BY sistem_preset;


-- ─── 3. TENANT-SPEC sözlükte var mı? ───
-- Beklenen: 1 satır
SELECT standart, ad, slug, veri_var, aktif
FROM boru_standart_sozluk
WHERE standart = 'TENANT-SPEC';


-- ─── 4. Function self-test ───
-- Beklenen değerler:
--   v1 (DN 100 SCH 40 karbon): ≈16.08 kg/m
--   v2 (DN 50 60.3×6.3 karbon): ≈8.39 kg/m
--   v3 (DN 50 SCH 80 karbon): ≈7.48 kg/m
SELECT 
  boru_agirlik_hesapla(114.3, 6.02, 'karbon') AS dn100_sch40,
  boru_agirlik_hesapla(60.3, 6.3, 'karbon')   AS dn50_tenant_ozel,
  boru_agirlik_hesapla(60.3, 5.54, 'karbon')  AS dn50_sch80,
  boru_agirlik_hesapla(60.3, 6.3, 'paslanmaz') AS dn50_paslanmaz_ornegi,
  boru_agirlik_hesapla(60.3, 6.3, 'cunife')    AS dn50_cunife_ornegi,
  boru_agirlik_hesapla(60.3, 6.3, 'aluminyum') AS dn50_aluminyum_ornegi;


-- ─── 5. Constraint testi: sistem_preset=TRUE iken tenant_id NULL olmalı ───
-- Beklenen: ERROR, çünkü constraint reddedecek
-- (Bu sorguyu çalıştırma! Sadece denenirse ne olacağını gösteriyoruz)
/*
INSERT INTO boru_olculer (
  standart, malzeme_grubu, dn,
  schedule_tipi, schedule_deger, schedule_kod,
  dis_cap_mm, et_mm, agirlik_kg_m,
  sistem_preset, tenant_id  -- ← kasıtlı tutarsızlık
) VALUES (
  'AD-HOC', 'karbon', 50,
  'olcum', '6.3', 'TEST',
  60.3, 6.3, 8.39,
  TRUE, '00000000-0000-0000-0000-000000000001'  -- TRUE + tenant dolu = HATA
);
-- Hata bekleniyor: 23514 (check_violation)
*/


-- ─── 6. Tenant-özel kayıt örneği EKLEME ───
-- 60.3 × 6.3 mm boru için örnek INSERT (test amaçlı, gerçek tenant_id kullan)
-- BU SORGU GERÇEK BİR TENANT_ID İSTER. Önce kontrol et:
-- SELECT id, ad FROM tenants LIMIT 5;
--
-- Sonra şu pattern ile çalıştır:
/*
INSERT INTO boru_olculer (
  tenant_id, sistem_preset,
  standart, malzeme_grubu, dn,
  schedule_tipi, schedule_deger, schedule_kod,
  dis_cap_mm, et_mm, agirlik_kg_m,
  kaynak, notlar
) VALUES (
  '<gerçek-tenant-uuid>', FALSE,
  'TENANT-SPEC', 'karbon', 50,
  'olcum', '6.3', 'TS-60.3x6.3',
  60.3, 6.3, 
  boru_agirlik_hesapla(60.3, 6.3, 'karbon'),
  'tenant_olcum',
  'İlk kullanım: spool 3a5764c6, 1 May 2026. ' ||
  'Standart-dışı et kalınlığı. En yakın B36.10M SCH 80 (5.54 mm).'
);
*/


-- ─── 7. Tenant özel kayıtları listele (yükleme sonrası) ───
-- Boru tarafında hangi tenant'ın kaç özel kaydı var, görmek için
SELECT 
  tenant_id,
  standart,
  COUNT(*) AS kayit_sayisi,
  MIN(olusturma_at) AS ilk_kayit,
  MAX(olusturma_at) AS son_kayit
FROM boru_olculer
WHERE sistem_preset = FALSE
GROUP BY tenant_id, standart
ORDER BY kayit_sayisi DESC;
