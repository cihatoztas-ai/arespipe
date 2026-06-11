-- ============================================================================
-- Migration: 044_malzeme_kataloglari_cuni_fitting_flansh.sql
-- Oturum: 78
-- Tarih: 2026-05-12
-- ----------------------------------------------------------------------------
-- Amac: malzeme_kataloglari tablosunda CuNi cephesini fitting + flansh
--       cephelerinde tamamlamak. Gemi tersane profili (Yalova) icin P0:
--       deniz suyu sistemi = CuNi, paslanmaz/karbon yetmez.
-- ----------------------------------------------------------------------------
-- Mevcut durum (78 oncesi, 77 dolumu):
--   - ASTM B466 C70600 (seamless boru, sadece uygun_boru=true)
--   - ASTM B466 C71500 (seamless boru, sadece uygun_boru=true)
-- ----------------------------------------------------------------------------
-- Bu migration sonrasi (10 -> 14 satir):
--   1) UPDATE: B466 C70600 + C71500 -> uygun_fitting_buttweld=true
--      (Seamless boru ve seamless BW fitting ayni spec'ten uretilir.
--       77 bu flag'i ayri biraktigi icin tamamliyoruz.)
--   2) INSERT: B467 C70600 + C71500 (welded pipe + welded BW fitting)
--   3) INSERT: B151 C70600 + C71500 (forged: flansh + kucuk forged fitting)
-- ----------------------------------------------------------------------------
-- Kaynaklar (MK-75.3 cift kaynak):
--   - copper.org/applications/marine/cuni/standards (ana referans, ASTM + EEMUA + DIN)
--   - cnkpipefitting.com / Solitaire Overseas (uretici spec sheet'leri)
--   - PM International CuNi datasheet (mukavemet, density)
-- ----------------------------------------------------------------------------
-- Mukavemet degerleri (annealed kondisyon, soft temper):
--   - C70600 (CuNi 90/10): TS min 275 MPa, YS min 105 MPa
--   - C71500 (CuNi 70/30): TS min 345 MPa, YS min 138 MPa
--   - Yogunluk her ikisi: 8940 kg/m3
--   - Sicaklik araligi: -100 C ila 200 C (mevcut B466 satirlarinin ayni)
-- ----------------------------------------------------------------------------
-- Pattern: 76 + 78 kutuphane mini-projesi disiplinleri:
--   - MK-76.1: Explicit BEGIN/COMMIT YOK (Supabase implicit transaction)
--   - MK-76.3: ASCII-only SQL comments (Turkce sadece TEXT string'lerde)
--   - MK-75.D: Idempotent NOT EXISTS bilesik anahtar
--   - Partial unique index: spec_standart + COALESCE(spec_grade,'') WHERE tenant_id IS NULL
-- ============================================================================

DO $$
DECLARE
  v_upd_70600 INTEGER := 0;
  v_upd_71500 INTEGER := 0;
  v_inserted INTEGER := 0;
BEGIN

  -- ----------------------------------------------------------------
  -- 1) UPDATE: B466 C70600 -> seamless boru + seamless BW fitting
  -- ----------------------------------------------------------------
  UPDATE malzeme_kataloglari
  SET uygun_fitting_buttweld = true,
      aciklama_tr = 'CuNi 90/10 seamless boru + seamless BW fitting (deniz suyu sistemi)',
      aciklama_en = 'CuNi 90/10 seamless pipe + seamless BW fitting (seawater)',
      guncelleme_at = now()
  WHERE spec_standart = 'ASTM B466'
    AND spec_grade = 'C70600'
    AND tenant_id IS NULL
    AND uygun_fitting_buttweld = false;  -- idempotent: ikinci kez calistirinca 0

  GET DIAGNOSTICS v_upd_70600 = ROW_COUNT;
  RAISE NOTICE 'B466 C70600 guncellendi: % satir', v_upd_70600;

  -- ----------------------------------------------------------------
  -- 2) UPDATE: B466 C71500 -> seamless boru + seamless BW fitting
  -- ----------------------------------------------------------------
  UPDATE malzeme_kataloglari
  SET uygun_fitting_buttweld = true,
      aciklama_tr = 'CuNi 70/30 seamless boru + seamless BW fitting (yuksek hiz/korozyon)',
      aciklama_en = 'CuNi 70/30 seamless pipe + seamless BW fitting (high velocity/corrosion)',
      guncelleme_at = now()
  WHERE spec_standart = 'ASTM B466'
    AND spec_grade = 'C71500'
    AND tenant_id IS NULL
    AND uygun_fitting_buttweld = false;

  GET DIAGNOSTICS v_upd_71500 = ROW_COUNT;
  RAISE NOTICE 'B466 C71500 guncellendi: % satir', v_upd_71500;

  -- ----------------------------------------------------------------
  -- 3) INSERT: 4 yeni CuNi spec (B467 welded x2, B151 forged x2)
  --    Pattern: SELECT FROM VALUES + NOT EXISTS (idempotent)
  -- ----------------------------------------------------------------
  INSERT INTO malzeme_kataloglari (
    spec_standart, spec_grade, malzeme_grubu, aile,
    uygun_boru, uygun_fitting_buttweld, uygun_fitting_forged, uygun_flansh,
    yogunluk_kg_m3, cekme_mukavemeti_min_mpa, akma_mukavemeti_min_mpa,
    sicaklik_min_c, sicaklik_max_c,
    goster_etiket, aciklama_tr, aciklama_en,
    tenant_id, sistem_preset, aktif
  )
  SELECT
    v.spec_standart, v.spec_grade, v.malzeme_grubu, v.aile,
    v.boru, v.bw, v.forged, v.flansh,
    v.rho, v.ts, v.ys,
    v.tmin, v.tmax,
    v.etiket, v.aciklama_tr, v.aciklama_en,
    NULL::uuid, true, true
  FROM (VALUES
    -- B467 C70600 — welded pipe + welded BW fitting
    ('ASTM B467', 'C70600', 'cuni', 'ASTM',
     true, true, false, false,
     8940::numeric, 275::numeric, 105::numeric, -100::numeric, 200::numeric,
     'ASTM B467 C70600 (CuNi 90/10 welded)',
     'CuNi 90/10 welded boru + welded BW fitting (buyuk cap deniz suyu hatti)',
     'CuNi 90/10 welded pipe + welded BW fitting (large dia seawater line)'),
    -- B467 C71500 — welded pipe + welded BW fitting
    ('ASTM B467', 'C71500', 'cuni', 'ASTM',
     true, true, false, false,
     8940, 345, 138, -100, 200,
     'ASTM B467 C71500 (CuNi 70/30 welded)',
     'CuNi 70/30 welded boru + welded BW fitting (yuksek hiz servisi)',
     'CuNi 70/30 welded pipe + welded BW fitting (high velocity service)'),
    -- B151 C70600 — forged: flansh + kucuk forged fitting
    ('ASTM B151', 'C70600', 'cuni', 'ASTM',
     false, false, true, true,
     8940, 275, 105, -100, 200,
     'ASTM B151 C70600 (CuNi 90/10 forged)',
     'CuNi 90/10 forged: flansh (EEMUA 145 / ASME B16.5) + kucuk capli forged fitting',
     'CuNi 90/10 forged: flange (EEMUA 145 / ASME B16.5) + small forged fitting'),
    -- B151 C71500 — forged: flansh + kucuk forged fitting
    ('ASTM B151', 'C71500', 'cuni', 'ASTM',
     false, false, true, true,
     8940, 345, 138, -100, 200,
     'ASTM B151 C71500 (CuNi 70/30 forged)',
     'CuNi 70/30 forged: flansh + kucuk capli forged fitting (yuksek mukavemet)',
     'CuNi 70/30 forged: flange + small forged fitting (high strength)')
  ) AS v(spec_standart, spec_grade, malzeme_grubu, aile,
         boru, bw, forged, flansh,
         rho, ts, ys, tmin, tmax,
         etiket, aciklama_tr, aciklama_en)
  WHERE NOT EXISTS (
    SELECT 1 FROM malzeme_kataloglari x
    WHERE x.spec_standart = v.spec_standart
      AND COALESCE(x.spec_grade, '') = COALESCE(v.spec_grade, '')
      AND x.tenant_id IS NULL
  );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE 'Yeni CuNi spec eklenen: % satir (beklenen 4)', v_inserted;

  -- ----------------------------------------------------------------
  -- DOGRULAMA
  -- ----------------------------------------------------------------
  IF v_upd_70600 + v_upd_71500 + v_inserted = 0 THEN
    RAISE NOTICE 'Migration zaten uygulanmis (idempotent, 0 degisiklik).';
  ELSIF v_inserted < 4 THEN
    RAISE NOTICE 'Kismi uygulama: UPDATE=%/%, INSERT=%. Mevcut satirlari kontrol et.',
                  v_upd_70600 + v_upd_71500, 2, v_inserted;
  ELSE
    RAISE NOTICE 'Migration basarili: UPDATE=%/%, INSERT=%/4',
                  v_upd_70600 + v_upd_71500, 2, v_inserted;
  END IF;

END $$;

-- ============================================================================
-- COUNT TEYIDI: CuNi cephesi tam dokum
-- Beklenen: 6 satir (B466 C70600+C71500 + B467 C70600+C71500 + B151 C70600+C71500)
-- ============================================================================
SELECT
  spec_kodu,
  uygun_boru AS bo,
  uygun_fitting_buttweld AS bw,
  uygun_fitting_forged AS fo,
  uygun_flansh AS fl,
  cekme_mukavemeti_min_mpa AS ts,
  akma_mukavemeti_min_mpa AS ys
FROM malzeme_kataloglari
WHERE malzeme_grubu = 'cuni'
ORDER BY spec_standart, spec_grade;

-- ============================================================================
-- TOPLAM M_K SAYIM
-- Beklenen: 14 (onceki 10 + 4 yeni; UPDATE'ler sayiyi degistirmez)
-- ============================================================================
SELECT COUNT(*) AS toplam FROM malzeme_kataloglari;
