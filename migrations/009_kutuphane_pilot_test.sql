-- ============================================================
-- 41. Oturum — Pilot Test Verisi
-- Tek kayıt: A105 · WN · 150# · 4" / DN100 · RF
-- ============================================================
-- AMAÇ:
--   spool_detay.html entegrasyonunu test edebilmek için kütüphanede
--   en az 1 flanş kaydı olmalı. Bu SQL pilot kapsamına 1 kayıt ekler.
--   Değerler ASME B16.5 spec — Cihat'ın paylaştığı PDF tablosundan.
--
-- NOT:
--   spool_flansh_eslesme'yi bu SQL EKLEMEZ — çünkü hangi spool'daki
--   hangi malzemeyi eşleştireceğin sana bağlı. Aşağıdaki notlarda
--   manuel eşleşme nasıl yapılır anlatılıyor.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) flansh_olculer — A105 4" 150# WN RF
-- ------------------------------------------------------------
INSERT INTO flansh_olculer (
  tenant_id,             sistem_preset,
  geometri_std,          flansh_tipi,         basinc_sinifi,    yuzey_tipi,
  cap_nps,               cap_dn,              cap_mm,
  flansh_od_mm,          flansh_kalinlik_mm,
  hub_od_mm,             hub_uzunluk_mm,
  bore_min_mm,           bore_std_mm,
  bolt_circle_mm,        bolt_count,          bolt_holes_inch,  bolt_cap_inch,
  bolt_uzunluk_stud_mm,  bolt_uzunluk_machine_mm,
  agirlik_kg,
  cizim_path,            notlar,
  aktif
) VALUES (
  NULL,                  true,
  'B16.5',               'WN',                '150',            'RF',
  '4',                   100,                 NULL,
  229,                   22.4,
  135,                   32,
  NULL,                  102.4,
  190.5,                 8,                   '3/4',            '5/8',
  90,                    NULL,
  5.99,
  NULL,                  'Pilot test kaydı — ASME B16.5 spec',
  true
);


-- ------------------------------------------------------------
-- 2) fitting_malzeme_uyum — A105 ↔ yeni flanş kaydı
-- ------------------------------------------------------------
-- A105 preset'iyle uyum oluştur (bu kayıt ileride forged flanş
-- ürünlerinde A105 hammaddesinin uygun olduğunu söyler).
-- ------------------------------------------------------------
INSERT INTO fitting_malzeme_uyum (
  flansh_id,
  malzeme_id,
  uretim_yontemi,
  yaygin_mi,
  notlar
)
SELECT
  f.id,
  m.id,
  'forged',
  true,
  'A105 dövme karbon — B16.5 flanşların standart hammaddesi'
FROM flansh_olculer f, malzeme_tanimlari m
WHERE f.geometri_std = 'B16.5'
  AND f.flansh_tipi  = 'WN'
  AND f.basinc_sinifi = '150'
  AND f.cap_nps      = '4'
  AND m.kalite_kod   = 'A105'
  AND m.sistem_preset = true;

COMMIT;


-- ============================================================
-- DOĞRULAMA
-- ============================================================
-- 1 kayıt görünmeli:
--   SELECT cap_nps, basinc_sinifi, flansh_tipi, flansh_od_mm, agirlik_kg
--   FROM flansh_olculer;
--
-- 1 uyum kaydı görünmeli:
--   SELECT m.kalite_kod, f.cap_nps, f.flansh_tipi, fmu.uretim_yontemi
--   FROM fitting_malzeme_uyum fmu
--   JOIN flansh_olculer f       ON f.id = fmu.flansh_id
--   JOIN malzeme_tanimlari m    ON m.id = fmu.malzeme_id;


-- ============================================================
-- MANUEL EŞLEŞTİRME (test için — Supabase SQL editor'de çalıştır)
-- ============================================================
-- Sayfada "satır tıklanabilir mi" testini yapmak için, gerçek bir
-- spool'daki bir A105 4" malzemesini bu flanş kaydına eşleştir.
--
-- ADIM 1 — Test malzemesi bul:
--   SELECT sm.id, sm.tanim, sm.malzeme, sm.kalite, sm.dis_cap_mm,
--          s.spool_no
--   FROM spool_malzemeleri sm
--   JOIN spooller s ON s.id = sm.spool_id
--   WHERE sm.kalite ILIKE 'A105%'
--      OR sm.malzeme ILIKE '%A105%'
--      OR (sm.dis_cap_mm BETWEEN 100 AND 120 AND sm.kalite ILIKE '%karbon%')
--   LIMIT 5;
--
-- ADIM 2 — Eşleştirme oluştur (ADIM 1'den bir id'yi kopyala):
--   INSERT INTO spool_flansh_eslesme (
--     spool_malzeme_id,
--     flansh_id,
--     eslesme_tipi,
--     notlar
--   )
--   SELECT
--     '<ADIM 1''DEN GELEN UUID>'::uuid,
--     f.id,
--     'manuel',
--     '41. oturum pilot test eşleşmesi'
--   FROM flansh_olculer f
--   WHERE f.geometri_std = 'B16.5'
--     AND f.flansh_tipi  = 'WN'
--     AND f.basinc_sinifi = '150'
--     AND f.cap_nps      = '4';
--
-- ADIM 3 — Kontrol:
--   SELECT sfe.spool_malzeme_id, f.cap_nps, f.flansh_tipi, f.basinc_sinifi
--   FROM spool_flansh_eslesme sfe
--   JOIN flansh_olculer f ON f.id = sfe.flansh_id;
-- ============================================================
