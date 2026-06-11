-- ============================================================================
-- Migration: 045_malzeme_kataloglari_paslanmaz_genisleme.sql
-- Oturum: 78
-- Tarih: 2026-05-12
-- ----------------------------------------------------------------------------
-- Amac: malzeme_kataloglari tablosunda paslanmaz cephesini TP304L + TP316
--       grade'leri ile genislet. Her grade icin 3 spec turu (A312 boru,
--       A403 BW fitting, A182 forged+flansh) = toplam 6 yeni satir.
-- ----------------------------------------------------------------------------
-- Mevcut durum (78 oncesi):
--   - ASTM A312 TP316L (boru)
--   - ASTM A403 WP316L (BW fitting)
--   - ASTM A182 F316L (forged + flansh)
-- ----------------------------------------------------------------------------
-- Bu migration sonrasi (M_K 14 -> 20 satir):
--   - TP304L: A312 + A403 WP304L + A182 F304L (P0 yaygin, dusuk karbon kaynak ideal)
--   - TP316: A312 + A403 WP316 + A182 F316 (P1, 316L'nin yuksek karbonlu hali)
-- ----------------------------------------------------------------------------
-- Kaynaklar (MK-75.3 cift kaynak):
--   - octalsteel.com ASTM A312 spec sheet
--   - dsstainlesssteel.com ASTM A312 specification + 316L density 7980
--   - pipingpipeline.com ASTM A312 TP304/TP304L
--   - prosaicsteel.com TP316/316L spec
-- ----------------------------------------------------------------------------
-- Mukavemet (annealed, A312/A403/A182 ayni grade icin ayni min degerler):
--   - 304L / WP304L / F304L: TS min 485 MPa, YS min 170 MPa (dusuk C)
--   - 316  / WP316  / F316 : TS min 515 MPa, YS min 205 MPa (yuksek C, Mo)
--
-- Yogunluk:
--   - 304 ailesi (Mo'suz): 7900 kg/m3
--   - 316 ailesi (Mo'lu) : 7980 kg/m3
--
-- Sicaklik (ASME B31.3 standart pratik):
--   - 304L: -196 to 425 (impact test'siz)
--           Not: A312 spec 304L icin -250 C extended kullanim destekli, ama
--           genel design araligi -196 olarak tutuldu (mevcut 316L ile uyumlu).
--   - 316 : -196 to 425
-- ----------------------------------------------------------------------------
-- Pattern: MK-76.1 (BEGIN/COMMIT yok), MK-76.3 (ASCII comments),
--          MK-75.D (NOT EXISTS bilesik anahtar idempotent)
-- ============================================================================

DO $$
DECLARE
  v_inserted INTEGER := 0;
BEGIN

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
    -- TP304L cephesi (3 spec) — dusuk karbon austenitik, kaynak icin ideal
    ('ASTM A312', 'TP304L', 'paslanmaz', 'ASTM',
     true, false, false, false,
     7900::numeric, 485::numeric, 170::numeric, -196::numeric, 425::numeric,
     'ASTM A312 TP304L',
     'Paslanmaz dikissiz/kaynakli boru (dusuk karbon, IGC dirençli, yaygin endustri)',
     'SS seamless/welded pipe (low carbon, IGC resistant, general industry)'),
    ('ASTM A403', 'WP304L', 'paslanmaz', 'ASTM',
     false, true, false, false,
     7900, 485, 170, -196, 425,
     'ASTM A403 WP304L',
     'Paslanmaz BW fitting (dusuk karbon, kaynak sonrasi tavlama gerekmez)',
     'SS BW fitting (low carbon, no post-weld anneal needed)'),
    ('ASTM A182', 'F304L', 'paslanmaz', 'ASTM',
     false, false, true, true,
     7900, 485, 170, -196, 425,
     'ASTM A182 F304L',
     'Paslanmaz forged: flansh + kucuk capli forged fitting (dusuk karbon)',
     'SS forged: flange + small forged fitting (low carbon)'),

    -- TP316 cephesi (3 spec) — Mo'lu austenitik, yuksek karbon, mukavemet daha yuksek
    ('ASTM A312', 'TP316', 'paslanmaz', 'ASTM',
     true, false, false, false,
     7980, 515, 205, -196, 425,
     'ASTM A312 TP316',
     'Paslanmaz boru (Mo, klor/asit dirençli, kaynak edilmemis veya kontrollu)',
     'SS pipe (Mo, chloride/acid resistant, non-welded or controlled)'),
    ('ASTM A403', 'WP316', 'paslanmaz', 'ASTM',
     false, true, false, false,
     7980, 515, 205, -196, 425,
     'ASTM A403 WP316',
     'Paslanmaz BW fitting (Mo, yuksek mukavemet, kaynak sonrasi solusyon tavlama)',
     'SS BW fitting (Mo, high strength, post-weld solution anneal)'),
    ('ASTM A182', 'F316', 'paslanmaz', 'ASTM',
     false, false, true, true,
     7980, 515, 205, -196, 425,
     'ASTM A182 F316',
     'Paslanmaz forged: flansh + kucuk capli forged fitting (Mo, yuksek mukavemet)',
     'SS forged: flange + small forged fitting (Mo, high strength)')
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
  RAISE NOTICE 'Yeni paslanmaz spec eklenen: % satir (beklenen 6)', v_inserted;

  IF v_inserted = 0 THEN
    RAISE NOTICE 'Migration zaten uygulanmis (idempotent, 0 satir).';
  ELSIF v_inserted < 6 THEN
    RAISE NOTICE 'Kismi uygulama: %/6. Bazi satirlar onceden vardi.', v_inserted;
  ELSE
    RAISE NOTICE 'Migration basarili: 6/6 satir eklendi.';
  END IF;

END $$;

-- ============================================================================
-- COUNT TEYIDI: Paslanmaz cephesi tam dokum (beklenen 9 satir)
-- TP316L (mevcut) + TP304L (yeni) + TP316 (yeni) = 3 grade x 3 spec = 9
-- ============================================================================
SELECT
  spec_kodu,
  uygun_boru AS bo,
  uygun_fitting_buttweld AS bw,
  uygun_fitting_forged AS fo,
  uygun_flansh AS fl,
  cekme_mukavemeti_min_mpa AS ts,
  akma_mukavemeti_min_mpa AS ys,
  yogunluk_kg_m3 AS rho
FROM malzeme_kataloglari
WHERE malzeme_grubu = 'paslanmaz'
ORDER BY spec_grade, spec_standart;

-- ============================================================================
-- TOPLAM M_K SAYIM (beklenen 20: onceki 14 + 6 yeni)
-- ============================================================================
SELECT COUNT(*) AS toplam FROM malzeme_kataloglari;
