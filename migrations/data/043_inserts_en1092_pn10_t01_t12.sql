-- ============================================================================
-- Migration: 043_inserts_en1092_pn10_t01_t12.sql
-- Oturum: 78 (KARAR-78.1 beta kapsam)
-- Tarih: 2026-05-12
-- ----------------------------------------------------------------------------
-- Amac: EN 1092-1 PN 10 cephesinde 77'de eklenen T05 + T11 yaninda
--       eksik T01 (Plate) ve T12 (Hubbed Slip-On) tiplerini tamamlamak.
--       Kapsam DN 200-600 (8 DN), her tip 8 satir, toplam 16 satir.
-- ----------------------------------------------------------------------------
-- Kaynaklar (MK-75.3 cift kaynak):
--   T01 — ProjectMaterials EN 1092-1 Plate Flange PN10 (8 DN tablo)
--         pipefittingweb EN 1092-1 PDF Tablo PN10 (Type 01/02/04/05/11/12/13/21)
--         iki kaynak 8 alanda (D,K,L,No,Size,A,B1,C1) %100 ortusuyor
--   T12 — pipefittingweb EN 1092-1 PDF Tablo PN10 (N1 hub_od, H1 hub_length)
--         T11 cross-check: T11 PN10 DN200 (N1=234, H2=62, S=6.3) DB ile birebir
-- ----------------------------------------------------------------------------
-- Pattern (MK-76.2 LATERAL JOIN benzer satirdan kopyala):
--   T11 PN10 satirindan (D, K, b, RF_OD, RF_h, A, bolts) reuse
--   T01 icin override: hub yok, weight = ProjectMaterials
--   T12 icin override: hub eklenir (N1=hub_od, H1=hub_uzunluk), weight NULL
-- ----------------------------------------------------------------------------
-- MK-76.1: Explicit BEGIN/COMMIT YOK (Supabase SQL Editor implicit transaction)
-- MK-76.3: ASCII-only SQL comments (Turkce karakter JSON string icinde, TEXT)
-- MK-75.D: Idempotent NOT EXISTS bilesik anahtar
-- ============================================================================

DO $$
DECLARE
  v_inserted_t01 INTEGER := 0;
  v_inserted_t12 INTEGER := 0;
BEGIN

  -- ----------------------------------------------------------------
  -- T01 PLATE FLANGE — 8 satir (DN 200-600)
  -- ----------------------------------------------------------------
  INSERT INTO flansh_olculer (
    sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi,
    cap_dn, cap_mm,
    flansh_od_mm, flansh_kalinlik_mm,
    hub_od_mm, hub_uzunluk_mm,
    raised_face_od_mm, raised_face_kalinlik_mm,
    bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch,
    agirlik_kg, aktif, notlar
  )
  SELECT
    true, 'EN-1092-1', 'EN-T01', '10', 'RF',
    t11.cap_dn, t11.cap_mm,
    t11.flansh_od_mm, t11.flansh_kalinlik_mm,
    NULL, NULL,
    t11.raised_face_od_mm, t11.raised_face_kalinlik_mm,
    t11.bolt_circle_mm, t11.bolt_count, t11.bolt_holes_inch, t11.bolt_cap_inch,
    p.weight_kg, true,
    jsonb_build_object(
      'edisyon', 'EN 1092-1:2007+A1:2013',
      'tip_aciklama', 'Plate flansh boru sonuna gecirilir, ic+dis fillet kaynak ile bağlanır. Düşük basınç su/gaz hatlarinda PN 10 DN 200+ aralığında yaygın.',
      'tip_adi_uzun', 'Type 01 - Plate Flange (flat disc, no hub, fillet weld)',
      'kaynak_geometri', 'ProjectMaterials EN 1092-1 Plate Flange PN10',
      'kaynak_crosscheck', 'pipefittingweb EN 1092-1 PDF PN10 Tablo (Type 01 kolonu)',
      'kaynak_bolt', 'Wermac PN 10 bolt detayi tablosu (77 oturumunda T11 ile dogrulanmis)',
      'scrape_tarihi', '2026-05-12',
      'yuzey_aciklama', 'RF = Raised Face (EN 1092-1 type B1 facing). T01 spec icin Type A (FF) da varsayilir; gemi tersanesi standardi RF.',
      'olculer_detay', jsonb_build_object(
        'agirlik_kg_PM', p.weight_kg,
        'bolt_dia_stud_inch', p.bolt_dia_inch,
        'bolt_hole_dia_mm_raw', p.bolt_hole_mm,
        'flansh_kalinlik_C1_mm', t11.flansh_kalinlik_mm,
        'note', 'T01 ve T11 ayni PN+DN icin flansh OD/K/b/n hep ozdes; T11 referansindan kopya'
      ),
      'uyumlu_boru_OD_mm', t11.cap_mm,
      'uyumlu_boru_standart', 'B36.10M / EN 10220 / EN 10216'
    )::text
  FROM flansh_olculer t11
  CROSS JOIN LATERAL (VALUES
    (200, 9.244,  '3/4"',   22),
    (250, 11.788, '3/4"',   22),
    (300, 13.578, '3/4"',   22),
    (350, 21.766, '3/4"',   22),
    (400, 27.436, '7/8"',   26),
    (450, 33.470, '7/8"',   26),
    (500, 40.103, '7/8"',   26),
    (600, 54.297, '1"',     30)
  ) AS p(dn, weight_kg, bolt_dia_inch, bolt_hole_mm)
  WHERE t11.geometri_std = 'EN-1092-1'
    AND t11.flansh_tipi  = 'EN-T11'
    AND t11.basinc_sinifi = '10'
    AND t11.cap_dn = p.dn
    AND NOT EXISTS (
      SELECT 1 FROM flansh_olculer x
      WHERE x.geometri_std = 'EN-1092-1'
        AND x.flansh_tipi  = 'EN-T01'
        AND x.basinc_sinifi = '10'
        AND x.cap_dn = p.dn
    );

  GET DIAGNOSTICS v_inserted_t01 = ROW_COUNT;
  RAISE NOTICE 'T01 PN10 eklenen: % satir (beklenen 8)', v_inserted_t01;

  -- ----------------------------------------------------------------
  -- T12 HUBBED SLIP-ON FLANGE — 8 satir (DN 200-600)
  -- ----------------------------------------------------------------
  INSERT INTO flansh_olculer (
    sistem_preset, geometri_std, flansh_tipi, basinc_sinifi, yuzey_tipi,
    cap_dn, cap_mm,
    flansh_od_mm, flansh_kalinlik_mm,
    hub_od_mm, hub_uzunluk_mm,
    raised_face_od_mm, raised_face_kalinlik_mm,
    bolt_circle_mm, bolt_count, bolt_holes_inch, bolt_cap_inch,
    agirlik_kg, aktif, notlar
  )
  SELECT
    true, 'EN-1092-1', 'EN-T12', '10', 'RF',
    t11.cap_dn, t11.cap_mm,
    t11.flansh_od_mm, t11.flansh_kalinlik_mm,
    p.hub_od_mm, p.hub_uzunluk_mm,
    t11.raised_face_od_mm, t11.raised_face_kalinlik_mm,
    t11.bolt_circle_mm, t11.bolt_count, t11.bolt_holes_inch, t11.bolt_cap_inch,
    NULL, true,
    jsonb_build_object(
      'edisyon', 'EN 1092-1:2007+A1:2013',
      'tip_aciklama', 'Hubbed slip-on flansh: boruya gecirilir, fillet kaynakla baglanir. Hub eksenel rijitlik saglar. T01 plate ile karistirma — T12 hub-li.',
      'tip_adi_uzun', 'Type 12 - Hubbed Slip-On Flange for Welding',
      'kaynak_geometri', 'pipefittingweb EN 1092-1 PDF PN10 Tablo (Type 12: N1=hub_od kolonu, H1=hub_length kolonu, R1=corner_radius)',
      'kaynak_crosscheck', 'T11 referansindan ortak geometri (D/K/b/RF/bolts) reuse. T11 PN10 DN200 PDF degerleri (N=234, H2=62, S=6.3) DB ile birebir eslesti.',
      'kaynak_bolt', 'Wermac PN 10 bolt detayi tablosu',
      'scrape_tarihi', '2026-05-12',
      'yuzey_aciklama', 'RF = Raised Face (EN 1092-1 type B1 facing)',
      'olculer_detay', jsonb_build_object(
        'hub_od_N1_mm', p.hub_od_mm,
        'hub_length_H1_mm', p.hub_uzunluk_mm,
        'corner_radius_R1_mm', p.corner_r,
        'flansh_kalinlik_C1_mm', t11.flansh_kalinlik_mm,
        'agirlik_note', 'Kaynak bulunamadi (PDF tablosunda yok, ProjectMaterials T12 sayfasi yok). Sonraki oturum: Hyupshin veya weight formulu ile hesap.'
      ),
      'uyumlu_boru_OD_mm', t11.cap_mm,
      'uyumlu_boru_standart', 'B36.10M / EN 10220 / EN 10216'
    )::text
  FROM flansh_olculer t11
  CROSS JOIN LATERAL (VALUES
    (200, 246, 44, 10),
    (250, 298, 46, 12),
    (300, 350, 46, 12),
    (350, 400, 53, 12),
    (400, 456, 57, 12),
    (450, 502, 63, 12),
    (500, 559, 67, 12),
    (600, 658, 75, 12)
  ) AS p(dn, hub_od_mm, hub_uzunluk_mm, corner_r)
  WHERE t11.geometri_std = 'EN-1092-1'
    AND t11.flansh_tipi  = 'EN-T11'
    AND t11.basinc_sinifi = '10'
    AND t11.cap_dn = p.dn
    AND NOT EXISTS (
      SELECT 1 FROM flansh_olculer x
      WHERE x.geometri_std = 'EN-1092-1'
        AND x.flansh_tipi  = 'EN-T12'
        AND x.basinc_sinifi = '10'
        AND x.cap_dn = p.dn
    );

  GET DIAGNOSTICS v_inserted_t12 = ROW_COUNT;
  RAISE NOTICE 'T12 PN10 eklenen: % satir (beklenen 8)', v_inserted_t12;

  -- ----------------------------------------------------------------
  -- DOGRULAMA: Toplam 16 satir eklenmis olmali (NOT EXISTS engellemediyse)
  -- ----------------------------------------------------------------
  IF v_inserted_t01 + v_inserted_t12 = 0 THEN
    RAISE NOTICE 'Migration zaten uygulanmis (idempotent). 0 yeni satir.';
  ELSIF v_inserted_t01 + v_inserted_t12 < 16 THEN
    RAISE EXCEPTION 'Kismi uygulama: T01=%, T12=%. Beklenen 16 yeni satir. Mevcut PN10 T11 satirlarini kontrol et.', v_inserted_t01, v_inserted_t12;
  ELSE
    RAISE NOTICE 'Migration basarili: T01=% + T12=% = % toplam yeni satir', v_inserted_t01, v_inserted_t12, (v_inserted_t01 + v_inserted_t12);
  END IF;

END $$;

-- ============================================================================
-- COUNT TEYIDI: PN10 cephesinde tum tipler 8 satir olmali (T01+T05+T11+T12)
-- Beklenen: 4 satir cikti, her tip 8 satir, toplam 32
-- ============================================================================
SELECT
  flansh_tipi,
  COUNT(*) AS satir
FROM flansh_olculer
WHERE geometri_std = 'EN-1092-1'
  AND basinc_sinifi = '10'
GROUP BY flansh_tipi
ORDER BY flansh_tipi;

-- ============================================================================
-- ORNEK DETAY DN 200: 4 tip ayni bolt pattern + ayni flansh OD + ayni RF
-- ============================================================================
SELECT
  flansh_tipi,
  flansh_od_mm  AS D,
  flansh_kalinlik_mm AS b,
  bolt_circle_mm AS K,
  bolt_count AS n,
  bolt_cap_inch AS M,
  hub_od_mm AS hub_OD,
  hub_uzunluk_mm AS hub_L,
  agirlik_kg AS kg
FROM flansh_olculer
WHERE geometri_std = 'EN-1092-1'
  AND basinc_sinifi = '10'
  AND cap_dn = 200
ORDER BY flansh_tipi;
