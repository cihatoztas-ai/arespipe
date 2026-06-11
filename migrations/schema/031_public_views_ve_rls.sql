-- ============================================================
-- 031 — Public view'lar + sistem koruma RLS
-- ============================================================
-- Amaç:
--   1) Site/mobil saha uygulaması için PUBLIC VIEW'lar oluştur.
--      Bu view'lar SADECE sistem_preset=TRUE kayıtları gösterir.
--      Tenant özel kayıtlar bu view'lardan GÖRÜNMEZ.
--
--   2) Sistem kayıtlarını yanlışlıkla değiştirmekten koru.
--      RLS policy: sistem_preset=TRUE kayıtlar sadece super_admin
--      tarafından UPDATE/DELETE edilebilir.
--
-- Kullanım senaryoları:
--   - Web sitesi: SELECT * FROM boru_olculer_public
--   - Mobil saha: SELECT * FROM flansh_olculer_public
--   - API endpoint /api/v1/standartlar/* bu view'lara bağlanır
--
-- Idempotent: CREATE OR REPLACE VIEW, DROP POLICY IF EXISTS + CREATE
-- ============================================================


-- ============================================================
-- 1. PUBLIC VIEW'LAR
-- ============================================================

-- ─── boru_olculer_public ───
-- Sadece standart kütüphane kayıtları, tenant_id görünmez
DROP VIEW IF EXISTS boru_olculer_public;
CREATE VIEW boru_olculer_public AS
SELECT
  id,
  standart,
  malzeme_grubu,
  dn,
  schedule_tipi,
  schedule_deger,
  schedule_kod,
  dis_cap_mm,
  et_mm,
  ic_cap_mm,
  agirlik_kg_m,
  hacim_l_m,
  yuzey_alan_dis_m2_m,
  et_min_mm,
  et_max_mm,
  tolerans_et_yuzde,
  edisyon_yili,
  kaynak,
  notlar,
  urun_formu,
  olusturma_at
FROM boru_olculer
WHERE sistem_preset = TRUE;

COMMENT ON VIEW boru_olculer_public IS
  'Boru ölçü tablosunun PUBLIC görünümü. Sadece sistem_preset=TRUE '
  'kayıtları içerir. Web sitesi, mobil saha referans uygulaması ve '
  'public API endpoint''lerinde kullanılır. Tenant özel kayıtlar '
  'bu view''dan görünmez (gizlilik koruması).';


-- ─── flansh_olculer_public ───
DROP VIEW IF EXISTS flansh_olculer_public;
CREATE VIEW flansh_olculer_public AS
SELECT
  id,
  geometri_std,
  flansh_tipi,
  basinc_sinifi,
  yuzey_tipi,
  cap_nps,
  cap_dn,
  cap_mm,
  flansh_od_mm,
  flansh_kalinlik_mm,
  hub_od_mm,
  hub_uzunluk_mm,
  bore_min_mm,
  bore_std_mm,
  socket_depth_mm,
  raised_face_od_mm,
  raised_face_kalinlik_mm,
  bolt_circle_mm,
  bolt_count,
  bolt_holes_inch,
  bolt_cap_inch,
  bolt_uzunluk_stud_mm,
  bolt_uzunluk_machine_mm,
  agirlik_kg,
  cizim_path,
  model_3d_path,
  notlar,
  olusturma
FROM flansh_olculer
WHERE sistem_preset = TRUE
  AND aktif = TRUE;

COMMENT ON VIEW flansh_olculer_public IS
  'Flanş ölçü tablosunun PUBLIC görünümü. Sadece aktif sistem kayıtları.';


-- ─── fitting_olculer_public ───
DROP VIEW IF EXISTS fitting_olculer_public;
CREATE VIEW fitting_olculer_public AS
SELECT
  id,
  geometri_std,
  parca_tipi,
  cap_buyuk_nps,
  cap_buyuk_dn,
  cap_buyuk_mm,
  cap_kucuk_nps,
  cap_kucuk_dn,
  cap_kucuk_mm,
  schedule_tipi,
  schedule_deger,
  schedule_kod,
  et_mm,
  ucu_uca_a_mm,
  ucu_uca_b_mm,
  ucu_uca_c_mm,
  ucu_uca_f_mm,
  ucu_uca_m_mm,
  ucu_uca_h_mm,
  yaricap_mm,
  stub_lap_kalinlik_mm,
  stub_lap_od_mm,
  agirlik_kg,
  cizim_path,
  model_3d_path,
  notlar,
  olusturma
FROM fitting_olculer
WHERE sistem_preset = TRUE
  AND aktif = TRUE;

COMMENT ON VIEW fitting_olculer_public IS
  'Fitting ölçü tablosunun PUBLIC görünümü. Sadece aktif sistem kayıtları.';


-- ============================================================
-- 2. SİSTEM KORUMA RLS POLICY'LERİ
-- ============================================================
-- Sistem kütüphane kayıtlarını yanlışlıkla değiştirmekten korur.
-- sistem_preset=TRUE kayıtlar sadece super_admin tarafından
-- UPDATE/DELETE edilebilir.
--
-- NOT: SELECT için kısıt yok — herkes okuyabilir (RLS başka 
-- yerden geliyorsa o devreye girer).
-- ============================================================

-- RLS aktif mi kontrol (boru_olculer için)
ALTER TABLE boru_olculer ENABLE ROW LEVEL SECURITY;

-- ─── boru_olculer sistem koruması ───
DROP POLICY IF EXISTS boru_olculer_sistem_update_korumasi ON boru_olculer;
CREATE POLICY boru_olculer_sistem_update_korumasi ON boru_olculer
FOR UPDATE 
USING (
  -- Tenant özel ise serbest (kendi tenant'ı kontrol policy'si başka olabilir)
  sistem_preset = FALSE
  OR
  -- Sistem ise sadece super_admin değiştirebilir
  EXISTS (
    SELECT 1 FROM kullanicilar 
    WHERE id = auth.uid() 
      AND rol = 'super_admin'
  )
);

DROP POLICY IF EXISTS boru_olculer_sistem_delete_korumasi ON boru_olculer;
CREATE POLICY boru_olculer_sistem_delete_korumasi ON boru_olculer
FOR DELETE
USING (
  sistem_preset = FALSE
  OR
  EXISTS (
    SELECT 1 FROM kullanicilar 
    WHERE id = auth.uid() 
      AND rol = 'super_admin'
  )
);


-- ─── flansh_olculer sistem koruması ───
ALTER TABLE flansh_olculer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flansh_olculer_sistem_update_korumasi ON flansh_olculer;
CREATE POLICY flansh_olculer_sistem_update_korumasi ON flansh_olculer
FOR UPDATE
USING (
  sistem_preset = FALSE
  OR
  EXISTS (
    SELECT 1 FROM kullanicilar 
    WHERE id = auth.uid() 
      AND rol = 'super_admin'
  )
);

DROP POLICY IF EXISTS flansh_olculer_sistem_delete_korumasi ON flansh_olculer;
CREATE POLICY flansh_olculer_sistem_delete_korumasi ON flansh_olculer
FOR DELETE
USING (
  sistem_preset = FALSE
  OR
  EXISTS (
    SELECT 1 FROM kullanicilar 
    WHERE id = auth.uid() 
      AND rol = 'super_admin'
  )
);


-- ─── fitting_olculer sistem koruması ───
-- (fitting_olculer'da henüz sistem_preset kolonu var, 03 SQL'de geldi)
ALTER TABLE fitting_olculer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fitting_olculer_sistem_update_korumasi ON fitting_olculer;
CREATE POLICY fitting_olculer_sistem_update_korumasi ON fitting_olculer
FOR UPDATE
USING (
  sistem_preset = FALSE
  OR
  EXISTS (
    SELECT 1 FROM kullanicilar 
    WHERE id = auth.uid() 
      AND rol = 'super_admin'
  )
);

DROP POLICY IF EXISTS fitting_olculer_sistem_delete_korumasi ON fitting_olculer;
CREATE POLICY fitting_olculer_sistem_delete_korumasi ON fitting_olculer
FOR DELETE
USING (
  sistem_preset = FALSE
  OR
  EXISTS (
    SELECT 1 FROM kullanicilar 
    WHERE id = auth.uid() 
      AND rol = 'super_admin'
  )
);


-- ============================================================
-- 3. View'lara public okuma izni (Supabase için)
-- ============================================================
-- Supabase'de anon ve authenticated rolleri default olarak
-- view'a erişebilir, ama açıkça GRANT vermek best practice.
-- ============================================================

GRANT SELECT ON boru_olculer_public TO anon, authenticated;
GRANT SELECT ON flansh_olculer_public TO anon, authenticated;
GRANT SELECT ON fitting_olculer_public TO anon, authenticated;


-- ============================================================
-- 4. Doğrulama (script sonu)
-- ============================================================
-- Bu sorguları çalıştır, beklenen sayıları gör:

-- View'lar oluşturuldu mu?
SELECT viewname, schemaname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE '%_olculer_public'
ORDER BY viewname;

-- Beklenen 3 view: 
--   boru_olculer_public, flansh_olculer_public, fitting_olculer_public

-- View'lardan sayıları kontrol
SELECT 
  'boru_olculer_public' AS view_adi, COUNT(*) AS satir 
FROM boru_olculer_public
UNION ALL
SELECT 'flansh_olculer_public', COUNT(*) FROM flansh_olculer_public
UNION ALL
SELECT 'fitting_olculer_public', COUNT(*) FROM fitting_olculer_public;

-- Beklenen değerler:
--   boru_olculer_public:    416 satır (tüm sistem standartları)
--   flansh_olculer_public:  216 satır
--   fitting_olculer_public: 391 satır

-- RLS policy'leri kontrol
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('boru_olculer', 'flansh_olculer', 'fitting_olculer')
  AND policyname LIKE '%sistem%korumasi%'
ORDER BY tablename, cmd;

-- Beklenen 6 policy (3 tablo × UPDATE+DELETE).
