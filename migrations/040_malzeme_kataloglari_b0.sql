-- =============================================================================
-- 077_b0_malzeme_kataloglari.sql
-- 12 Mayıs 2026 — 77. Oturum (B0 — Parça Kimliği Prensibi Omurgası)
-- =============================================================================
--
-- AMAÇ: Vizyon belgesinin "parça kimliği prensibi" (Bölüm 2.A) için ana tablo.
--       Boru/fitting/flansh tabloları buraya FK ile bağlanır. Her geometri satırı
--       artık bir malzeme spec'ine referans verir (yazı olarak değil, nesne olarak).
--
-- ÇAKIŞMA YOK:
--   - malzeme_tanimlari (12 preset, 19. oturumdan): UI/IFS köprüsü
--     (kategori_kod + kalite_kod + dil açıklamaları). PARALEL kalır.
--   - malzeme_standart_ipucu (28 Nisan 2026): AI pattern→standart önerisi.
--     Bu tablonun "tipik_malzeme_standardi" alanı malzeme_kataloglari.spec_kodu
--     ile JOIN edilir. ÇAKIŞMAZ.
--
-- GERİ DÖNÜŞ: Migration BEGIN/COMMIT ile sarılı. Sorun olursa COMMIT yerine
--             ROLLBACK ile döndürülür. ROLLBACK senaryosu için kapanış kontrol
--             dosyası 077_b0_geri_donus.sql (ayrıca yazılacak).
--
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) ANA TABLO
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.malzeme_kataloglari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Spec kimliği
  spec_standart TEXT NOT NULL,           -- 'ASTM A106', 'ASME B466', 'EN 10216-1'
  spec_grade    TEXT,                    -- 'B', 'WPB', 'C70600', 'P235GH', NULL olabilir
  spec_kodu     TEXT GENERATED ALWAYS AS (
    spec_standart || COALESCE(' ' || spec_grade, '')
  ) STORED,                              -- 'ASTM A106 B' — ipucu tablosuyla JOIN için

  -- Sınıflandırma
  malzeme_grubu TEXT NOT NULL CHECK (malzeme_grubu IN (
    'karbon','paslanmaz','duplex','cuni','alum','nikel','titan','diger'
  )),
  aile TEXT NOT NULL CHECK (aile IN (
    'ASTM','ASME','EN','DIN','JIS','API','EEMUA','GOST','GB'
  )),

  -- Uygunluk (en az bir true olmak zorunda)
  uygun_boru             BOOLEAN NOT NULL DEFAULT false,
  uygun_fitting_buttweld BOOLEAN NOT NULL DEFAULT false,
  uygun_fitting_forged   BOOLEAN NOT NULL DEFAULT false,
  uygun_flansh           BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT en_az_bir_uygun CHECK (
    uygun_boru OR uygun_fitting_buttweld OR uygun_fitting_forged OR uygun_flansh
  ),

  -- Fiziksel özellikler
  yogunluk_kg_m3           NUMERIC NOT NULL,    -- ağırlık hesabı kritik
  cekme_mukavemeti_min_mpa NUMERIC,
  akma_mukavemeti_min_mpa  NUMERIC,
  sicaklik_min_c           NUMERIC,
  sicaklik_max_c           NUMERIC,
  korozyon_notlari         JSONB,

  -- Görüntüleme
  goster_etiket TEXT NOT NULL,           -- 'ASTM A106 Grade B' — UI dropdown için
  aciklama_tr   TEXT,
  aciklama_en   TEXT,
  notlar        TEXT,

  -- Sahiplik
  tenant_id      UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sistem_preset  BOOLEAN NOT NULL DEFAULT false,
  aktif          BOOLEAN NOT NULL DEFAULT true,

  -- Tarih
  olusturma_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ
);

COMMENT ON TABLE public.malzeme_kataloglari IS
  'B0 — Parça kimliği prensibi omurgası. Boru/fitting/flansh tabloları buraya FK ile bağlanır. malzeme_tanimlari (UI/IFS köprüsü, 19. oturum) ile paralel çalışır.';
COMMENT ON COLUMN public.malzeme_kataloglari.spec_kodu IS
  'GENERATED. malzeme_standart_ipucu.tipik_malzeme_standardi alanıyla JOIN için.';
COMMENT ON COLUMN public.malzeme_kataloglari.yogunluk_kg_m3 IS
  'Ağırlık hesabı için. Karbon 7850, paslanmaz 7980, CuNi 8940, alüminyum 2700.';
COMMENT ON COLUMN public.malzeme_kataloglari.tenant_id IS
  'NULL = sistem preset (tüm tenantlar okur). Dolu = firma özel.';

-- -----------------------------------------------------------------------------
-- 2) INDEX'LER (UNIQUE NULL-aware partial, lookup index'leri)
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS malzeme_kataloglari_sistem_uq
  ON public.malzeme_kataloglari (spec_standart, COALESCE(spec_grade, ''))
  WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS malzeme_kataloglari_tenant_uq
  ON public.malzeme_kataloglari (tenant_id, spec_standart, COALESCE(spec_grade, ''))
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS malzeme_kataloglari_grup_aktif_idx
  ON public.malzeme_kataloglari (malzeme_grubu) WHERE aktif = true;

CREATE INDEX IF NOT EXISTS malzeme_kataloglari_spec_kodu_idx
  ON public.malzeme_kataloglari (spec_kodu);

-- -----------------------------------------------------------------------------
-- 3) RLS — Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.malzeme_kataloglari ENABLE ROW LEVEL SECURITY;

-- Okuma: sistem preset herkese (tenant_id IS NULL)
CREATE POLICY malzeme_kataloglari_okuma_sistem ON public.malzeme_kataloglari
  FOR SELECT
  USING (tenant_id IS NULL AND aktif = true);

-- Okuma: kendi tenant'ı
CREATE POLICY malzeme_kataloglari_okuma_tenant ON public.malzeme_kataloglari
  FOR SELECT
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = (SELECT tenant_id FROM public.kullanicilar WHERE id = auth.uid())
    AND aktif = true
  );

-- Yazma: super_admin her şey
CREATE POLICY malzeme_kataloglari_yazma_super_admin ON public.malzeme_kataloglari
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kullanicilar
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- Yazma: firma_admin / yonetici kendi tenant'ı
CREATE POLICY malzeme_kataloglari_yazma_firma_admin ON public.malzeme_kataloglari
  FOR ALL
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = (SELECT tenant_id FROM public.kullanicilar WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.kullanicilar
      WHERE id = auth.uid() AND rol IN ('firma_admin','yonetici')
    )
  );

-- -----------------------------------------------------------------------------
-- 4) GEOMETRİ TABLOLARINA FK KOLONU EKLE
-- -----------------------------------------------------------------------------

ALTER TABLE public.boru_olculer
  ADD COLUMN IF NOT EXISTS malzeme_id UUID
  REFERENCES public.malzeme_kataloglari(id) ON DELETE SET NULL;

ALTER TABLE public.fitting_olculer
  ADD COLUMN IF NOT EXISTS malzeme_id UUID
  REFERENCES public.malzeme_kataloglari(id) ON DELETE SET NULL;

ALTER TABLE public.flansh_olculer
  ADD COLUMN IF NOT EXISTS malzeme_id UUID
  REFERENCES public.malzeme_kataloglari(id) ON DELETE SET NULL;

-- ozel_parcalar varsa ekle, yoksa atla
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ozel_parcalar'
  ) THEN
    EXECUTE 'ALTER TABLE public.ozel_parcalar
             ADD COLUMN IF NOT EXISTS malzeme_id UUID
             REFERENCES public.malzeme_kataloglari(id) ON DELETE SET NULL';
    RAISE NOTICE 'ozel_parcalar.malzeme_id eklendi';
  ELSE
    RAISE NOTICE 'ozel_parcalar tablosu yok, atlandı';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS boru_olculer_malzeme_idx
  ON public.boru_olculer (malzeme_id);
CREATE INDEX IF NOT EXISTS fitting_olculer_malzeme_idx
  ON public.fitting_olculer (malzeme_id);
CREATE INDEX IF NOT EXISTS flansh_olculer_malzeme_idx
  ON public.flansh_olculer (malzeme_id);

-- -----------------------------------------------------------------------------
-- 5) P0 SEED — 10 spec
-- -----------------------------------------------------------------------------
--
-- Referanslar:
--   - Yoğunluk: ASM Handbook + üretici teknik dataları (karbon 7850, ss 7980,
--     CuNi 8940/8950 — annealed)
--   - Mukavemet: ASTM/ASME standardı min değerler
--   - Sıcaklık aralığı: ASME B31.3 + ASTM material spec birleşik
--
-- Doğrulama: ProjectMaterials.com cross-check sonrası UPDATE ile düzeltilebilir
-- (12. öğrenme — hallüsinasyon koruma için cross-validation şart).

INSERT INTO public.malzeme_kataloglari (
  spec_standart, spec_grade, malzeme_grubu, aile,
  uygun_boru, uygun_fitting_buttweld, uygun_fitting_forged, uygun_flansh,
  yogunluk_kg_m3, cekme_mukavemeti_min_mpa, akma_mukavemeti_min_mpa,
  sicaklik_min_c, sicaklik_max_c,
  goster_etiket, aciklama_tr, aciklama_en,
  tenant_id, sistem_preset, aktif
) VALUES
-- Karbon — boru
('ASTM A106', 'B',    'karbon', 'ASTM', true,  false, false, false,
 7850, 415, 240, -29, 425,
 'ASTM A106 Grade B',
 'Yüksek sıcaklık dikişsiz karbon boru', 'High-temp seamless carbon pipe',
 NULL, true, true),

('ASTM A53',  'B',    'karbon', 'ASTM', true,  false, false, false,
 7850, 415, 240, -29, 400,
 'ASTM A53 Grade B',
 'Genel servis karbon boru (dikişsiz/kaynaklı)', 'General service carbon pipe',
 NULL, true, true),

-- Karbon — buttweld fitting
('ASTM A234', 'WPB',  'karbon', 'ASTM', false, true,  false, false,
 7850, 415, 240, -29, 425,
 'ASTM A234 WPB',
 'Karbon çelik buttweld fitting (NPS ≥ 2")', 'Carbon steel buttweld fitting',
 NULL, true, true),

-- Karbon — forged (flanş + küçük fitting)
('ASTM A105', NULL,   'karbon', 'ASTM', false, false, true,  true,
 7850, 485, 250, -29, 425,
 'ASTM A105',
 'Karbon çelik forged (flanş + küçük fitting NPS ≤ 2")',
 'Carbon forged (flange + small fitting)',
 NULL, true, true),

-- Paslanmaz — boru
('ASTM A312', 'TP316L', 'paslanmaz', 'ASTM', true,  false, false, false,
 7980, 485, 170, -196, 425,
 'ASTM A312 TP316L',
 'Paslanmaz çelik dikişsiz boru (düşük karbon)', 'SS seamless pipe (low carbon)',
 NULL, true, true),

-- Paslanmaz — buttweld fitting
('ASTM A403', 'WP316L', 'paslanmaz', 'ASTM', false, true,  false, false,
 7980, 485, 170, -196, 425,
 'ASTM A403 WP316L',
 'Paslanmaz çelik buttweld fitting', 'SS buttweld fitting',
 NULL, true, true),

-- Paslanmaz — forged
('ASTM A182', 'F316L', 'paslanmaz', 'ASTM', false, false, true,  true,
 7980, 485, 170, -196, 425,
 'ASTM A182 F316L',
 'Paslanmaz çelik forged (flanş + küçük fitting)', 'SS forged (flange + small fitting)',
 NULL, true, true),

-- CuNi — GEMİ KRİTİK 🔴
('ASTM B466', 'C70600', 'cuni', 'ASTM', true,  false, false, false,
 8940, 275, 105, -100, 200,
 'ASTM B466 C70600 (CuNi 90/10)',
 'CuNi 90/10 dikişsiz boru — deniz suyu sistemi (gemi tersanesi)',
 'CuNi 90/10 seamless pipe — sea water service',
 NULL, true, true),

('ASTM B466', 'C71500', 'cuni', 'ASTM', true,  false, false, false,
 8940, 380, 125, -100, 200,
 'ASTM B466 C71500 (CuNi 70/30)',
 'CuNi 70/30 dikişsiz boru — yüksek dayanım deniz suyu',
 'CuNi 70/30 seamless pipe — high-strength sea water',
 NULL, true, true),

-- EN karbon
('EN 10216-1', 'P235GH', 'karbon', 'EN', true,  false, false, false,
 7850, 360, 235, -10, 400,
 'EN 10216-1 P235GH',
 'EN dikişsiz karbon boru (yüksek sıcaklık)', 'EN seamless carbon pipe (high-temp)',
 NULL, true, true);

-- -----------------------------------------------------------------------------
-- 6) MIGRATION-İÇİ DOĞRULAMA
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_satir         INT;
  v_karbon        INT;
  v_paslanmaz     INT;
  v_cuni          INT;
  v_en            INT;
  v_fk_boru       INT;
  v_fk_fitting    INT;
  v_fk_flansh     INT;
  v_policy_sayisi INT;
BEGIN
  -- Seed sayım
  SELECT COUNT(*) INTO v_satir
    FROM public.malzeme_kataloglari WHERE sistem_preset = true;
  IF v_satir <> 10 THEN
    RAISE EXCEPTION 'Seed bekleniyordu 10 satır, % satır var', v_satir;
  END IF;

  SELECT COUNT(*) INTO v_karbon FROM public.malzeme_kataloglari
    WHERE sistem_preset = true AND malzeme_grubu = 'karbon';
  SELECT COUNT(*) INTO v_paslanmaz FROM public.malzeme_kataloglari
    WHERE sistem_preset = true AND malzeme_grubu = 'paslanmaz';
  SELECT COUNT(*) INTO v_cuni FROM public.malzeme_kataloglari
    WHERE sistem_preset = true AND malzeme_grubu = 'cuni';
  SELECT COUNT(*) INTO v_en FROM public.malzeme_kataloglari
    WHERE sistem_preset = true AND aile = 'EN';

  -- FK kolonları
  SELECT COUNT(*) INTO v_fk_boru FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boru_olculer'
      AND column_name = 'malzeme_id';
  SELECT COUNT(*) INTO v_fk_fitting FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fitting_olculer'
      AND column_name = 'malzeme_id';
  SELECT COUNT(*) INTO v_fk_flansh FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flansh_olculer'
      AND column_name = 'malzeme_id';

  IF v_fk_boru = 0 OR v_fk_fitting = 0 OR v_fk_flansh = 0 THEN
    RAISE EXCEPTION 'FK kolonu eklenememiş: boru=%, fitting=%, flansh=%',
      v_fk_boru, v_fk_fitting, v_fk_flansh;
  END IF;

  -- RLS policy sayısı (4 bekleniyor)
  SELECT COUNT(*) INTO v_policy_sayisi FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'malzeme_kataloglari';
  IF v_policy_sayisi <> 4 THEN
    RAISE EXCEPTION 'RLS policy beklenen 4, oluşan %', v_policy_sayisi;
  END IF;

  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '✅ malzeme_kataloglari B0 migration BAŞARILI';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE 'Seed: % (karbon=%, paslanmaz=%, cuni=%, EN=%)',
    v_satir, v_karbon, v_paslanmaz, v_cuni, v_en;
  RAISE NOTICE 'FK: boru_olculer ✓ fitting_olculer ✓ flansh_olculer ✓';
  RAISE NOTICE 'RLS: % policy aktif', v_policy_sayisi;
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE 'SONRAKİ ADIM: Mevcut 1150 geometri satırının malzeme_id''si NULL.';
  RAISE NOTICE 'B1+ (toplu UPDATE) ile bağlama, ya da yeni satırlarda doldurma.';
END $$;

COMMIT;

-- =============================================================================
-- POST-APPLY DOĞRULAMA SORGULARI (COMMIT sonrası ayrıca çalıştır)
-- =============================================================================

-- 1) Tablo özet
-- SELECT spec_kodu, malzeme_grubu, aile, yogunluk_kg_m3, goster_etiket
-- FROM public.malzeme_kataloglari ORDER BY malzeme_grubu, spec_standart, spec_grade;

-- 2) FK kolonları teyit
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND column_name = 'malzeme_id'
-- ORDER BY table_name;

-- 3) RLS policy listesi
-- SELECT policyname, cmd, qual FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'malzeme_kataloglari'
-- ORDER BY policyname;

-- 4) ipucu→katalog JOIN testi (P235GH örneği)
-- SELECT i.kalite_kodu_pattern, i.tipik_malzeme_standardi, k.spec_kodu, k.goster_etiket
-- FROM public.malzeme_standart_ipucu i
-- LEFT JOIN public.malzeme_kataloglari k ON k.spec_kodu = i.tipik_malzeme_standardi
-- WHERE i.urun_kategorisi = 'boru';
