-- ============================================================
-- 41. Oturum — Kütüphane Altyapısı (Aşama 1) — REVIZE
-- A105 Karbon Flanş Pilot Şeması
-- ============================================================
-- AMAÇ:
--   Vizyon belgesi "Parça Kimliği Prensibi"nin temel altyapısı.
--   Mevcut tablolar (spool_malzemeleri, pipeline_malzemeleri,
--   malzeme_tanimlari) AYNEN KALIR. UI değişmez. Yeni: malzeme
--   yanına "info butonu", tıklayınca kütüphane modal'ı açılır.
--
-- MİMARİ KARAR (Cihat sezgisi — 41. oturum):
--   ❌ Mevcut malzeme_tanimlari'ya kolon EKLENMİYOR (şişme yok).
--   ✅ Yeni tablolar AYRI duruyor, cross-reference ile bağlanıyor.
--   ✅ Eski kayıtlar etkilenmez, eşleşme zamanla organik dolar.
--   ✅ Buton var/yok'un kendisi sinyal: tanınıyor → buton, özel → yok.
--
-- DEĞİŞİKLİKLER:
--   1. malzeme_tanimlari   → A105 sistem preset eklendi (13. preset)
--   2. flansh_olculer      → YENİ (geometri kataloğu + cizim_path)
--   3. fitting_malzeme_uyum → YENİ (flanş ↔ malzeme çapraz)
--   4. spool_flansh_eslesme → YENİ (cross-reference, ana akış)
--   5. RLS politikaları     → 3 yeni tablo
--
-- STRATEJİ (KUTUPHANE-KAPSAM.md):
--   "Boş tablolarla başla, organik dolar."
--   Migration sadece şema kurar. Veri girişi sonraki oturumlar.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) A105 sistem preset
-- ------------------------------------------------------------
-- Mevcut karbon presetleri: ST37, S235JR, A106B, A53.
-- A105 (en yaygın karbon flanş hammaddesi) eksik — pilot için ekleniyor.
-- ------------------------------------------------------------
INSERT INTO malzeme_tanimlari (
  tenant_id,    sistem_preset,  kategori_kod,
  kalite_kod,   kalite_goster,  standart,
  aktif
) VALUES (
  NULL,         true,           'karbon',
  'A105',       'A105',         'ASTM A105/A105M',
  true
)
ON CONFLICT (kategori_kod, kalite_kod) WHERE tenant_id IS NULL
DO UPDATE SET
  standart = EXCLUDED.standart,
  aktif    = EXCLUDED.aktif;


-- ------------------------------------------------------------
-- 2) flansh_olculer — geometri kataloğu
-- ------------------------------------------------------------
-- ASME B16.5 (NPS 1/2"–24"), B16.47 (NPS 26"+),
-- EN 1092-1 (DN), DIN 86087 (gemi CuNi flanş).
--
-- Malzeme'den BAĞIMSIZ — bir kez girilen geometri çoklu malzemede
-- kullanılır (A105 + A350 LF2 + EN P250GH aynı flanş ölçüsünü paylaşır).
-- Çapraz bağlantı: fitting_malzeme_uyum.
--
-- cizim_path: SVG/PNG referans çizim. Aynı (geometri_std + flansh_tipi
-- + yuzey_tipi) için tüm satırlar aynı path'i taşır (denormalize, ~15
-- unique çizim toplam — hız > saflık, sonradan refactor).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flansh_olculer (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid REFERENCES tenants(id) ON DELETE CASCADE,
  sistem_preset   boolean NOT NULL DEFAULT false,

  -- ── Standart referansı ──────────────────────────────────
  geometri_std    text NOT NULL,   -- 'B16.5', 'B16.47', 'EN 1092-1', 'DIN 86087'
  flansh_tipi     text NOT NULL,   -- 'WN', 'SO', 'SW', 'BL', 'LJ', 'TH'
  basinc_sinifi   text NOT NULL,   -- ASME: '150'..'2500' / EN: 'PN6'..'PN40'
  yuzey_tipi      text,            -- 'RF', 'FF', 'RTJ'

  -- ── Boyut ──────────────────────────────────────────────
  cap_nps         text,            -- '1/2', '4', '24'
  cap_dn          integer,         -- 15, 100, 600
  cap_mm          numeric,

  -- ── Flanş geometrisi (PDF kolonlarına eşlenir) ─────────
  flansh_od_mm           numeric NOT NULL,  -- O: Outside Diameter
  flansh_kalinlik_mm     numeric NOT NULL,  -- tf: Min Thickness
  hub_od_mm              numeric,           -- X: Diameter of Hub
  hub_uzunluk_mm         numeric,           -- Y: Length Through Hub

  -- ── Bore ───────────────────────────────────────────────
  bore_min_mm            numeric,           -- B Note 1: NPS 1/2-3 min
  bore_std_mm            numeric,           -- B Note 2: B36.10M std wall ID
  socket_depth_mm        numeric,           -- D: SW only

  -- ── Raised face ────────────────────────────────────────
  raised_face_od_mm      numeric,
  raised_face_kalinlik_mm numeric,

  -- ── Bolt ───────────────────────────────────────────────
  bolt_circle_mm         numeric NOT NULL,  -- W: BCD
  bolt_count             integer NOT NULL,
  bolt_holes_inch        text,
  bolt_cap_inch          text,
  bolt_uzunluk_stud_mm   numeric,
  bolt_uzunluk_machine_mm numeric,

  -- ── Genel ──────────────────────────────────────────────
  agirlik_kg      numeric,
  cizim_path      text,             -- SVG/PNG path. NULL → buton gösterilmez
  notlar          text,
  aktif           boolean NOT NULL DEFAULT true,
  olusturma       timestamptz NOT NULL DEFAULT now(),

  -- ── Constraint'ler ─────────────────────────────────────
  CONSTRAINT flansh_olculer_preset_tenant_check
    CHECK (sistem_preset = false OR tenant_id IS NULL),
  CONSTRAINT flansh_olculer_cap_check
    CHECK (cap_nps IS NOT NULL OR cap_dn IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS flansh_olculer_lookup_idx
  ON flansh_olculer (geometri_std, flansh_tipi, basinc_sinifi, cap_nps, cap_dn);

CREATE INDEX IF NOT EXISTS flansh_olculer_tenant_idx
  ON flansh_olculer (tenant_id) WHERE tenant_id IS NOT NULL;

COMMENT ON TABLE flansh_olculer IS
  'Flanş geometri kataloğu (ASME B16.5/B16.47, EN 1092-1, DIN 86087).
   Malzemeden bağımsız — fitting_malzeme_uyum ile çapraz bağlanır.';


-- ------------------------------------------------------------
-- 3) fitting_malzeme_uyum — çapraz tablo
-- ------------------------------------------------------------
-- Hangi flanş geometrisi hangi malzeme spec'inde üretilebilir?
-- Pilot için BOŞ başlatılır — kullanıldıkça dolar.
-- Örnek: A105 + B16.5 WN 150# 4" → uyumlu (forged)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fitting_malzeme_uyum (
  flansh_id        uuid REFERENCES flansh_olculer(id)   ON DELETE CASCADE,
  malzeme_id       uuid REFERENCES malzeme_tanimlari(id) ON DELETE CASCADE,
  uretim_yontemi   text,                  -- 'forged', 'cast', 'welded'
  yaygin_mi        boolean DEFAULT true,
  notlar           text,
  PRIMARY KEY (flansh_id, malzeme_id)
);

COMMENT ON TABLE fitting_malzeme_uyum IS
  'Flanş ↔ malzeme uyum çapraz tablosu. Pilot: A105 ↔ B16.5 flanşlar.';


-- ------------------------------------------------------------
-- 4) spool_flansh_eslesme — cross-reference (ANA AKIŞ)
-- ------------------------------------------------------------
-- Cihat'ın ana sezgisi: spool_malzemeleri'ne FK eklemek YERİNE
-- ayrı eşleşme tablosu. Avantajlar:
--   • spool_malzemeleri AYNEN kalır (eski kayıtlar etkilenmez)
--   • Eşleşme zamanı + kim eşledi audit trail var
--   • Boru/fitting eklenince paralel tablolar (spool_boru_eslesme vs.)
--   • Eşleşme yoksa info butonu görünmez (zarif sinyal)
--
-- eslesme_tipi:
--   'manuel'      → kullanıcı seçti (pilot için bu)
--   'auto_exact'  → ileride: tam eşleşme (DN+tip+sınıf birebir)
--   'auto_fuzzy'  → ileride: AI fuzzy match (40 vizyon Faz 4)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spool_flansh_eslesme (
  spool_malzeme_id   uuid PRIMARY KEY
                     REFERENCES spool_malzemeleri(id) ON DELETE CASCADE,
  flansh_id          uuid NOT NULL REFERENCES flansh_olculer(id),
  eslesme_tipi       text NOT NULL DEFAULT 'manuel',
  guven_yuzde        integer,                 -- 0-100, fuzzy için
  esleyen_kullanici  uuid,                    -- auth.users.id
  eslesme_zamani     timestamptz NOT NULL DEFAULT now(),
  notlar             text,

  CONSTRAINT spool_flansh_eslesme_tipi_check
    CHECK (eslesme_tipi IN ('manuel', 'auto_exact', 'auto_fuzzy')),
  CONSTRAINT spool_flansh_eslesme_guven_check
    CHECK (guven_yuzde IS NULL OR (guven_yuzde BETWEEN 0 AND 100))
);

CREATE INDEX IF NOT EXISTS spool_flansh_eslesme_flansh_idx
  ON spool_flansh_eslesme (flansh_id);

COMMENT ON TABLE spool_flansh_eslesme IS
  'spool_malzemeleri ↔ flansh_olculer cross-reference.
   Mevcut tabloyu değiştirmeden parça kimliği bağlantısı.
   Eşleşme yoksa info butonu UI''da gizlenir.';


-- ------------------------------------------------------------
-- 5) RLS politikaları
-- ------------------------------------------------------------
-- Pattern: malzeme_tanimlari ile aynı.
--   SELECT  → sistem_preset OR kendi tenant
--   I/U/D   → sadece kendi tenant (sistem preset dokunulamaz)
--
-- ⚠ TAHMİN UYARISI: "kullanicilar" tablo adı + "kullanicilar.tenant_id"
--    kolon adı, mevcut malzeme_tanimlari RLS pattern'inden tahmin edildi.
--    Çalıştırmadan önce doğrula veya BEGIN/ROLLBACK ile dry-run yap.
-- ------------------------------------------------------------
ALTER TABLE flansh_olculer        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitting_malzeme_uyum  ENABLE ROW LEVEL SECURITY;
ALTER TABLE spool_flansh_eslesme  ENABLE ROW LEVEL SECURITY;

-- ── flansh_olculer ────────────────────────────────────────
CREATE POLICY flansh_olculer_select ON flansh_olculer
  FOR SELECT USING (
    sistem_preset = true OR
    tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
  );

CREATE POLICY flansh_olculer_insert ON flansh_olculer
  FOR INSERT WITH CHECK (
    sistem_preset = false AND
    tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
  );

CREATE POLICY flansh_olculer_update ON flansh_olculer
  FOR UPDATE USING (
    sistem_preset = false AND
    tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
  );

CREATE POLICY flansh_olculer_delete ON flansh_olculer
  FOR DELETE USING (
    sistem_preset = false AND
    tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
  );

-- ── fitting_malzeme_uyum ──────────────────────────────────
CREATE POLICY fitting_malzeme_uyum_select ON fitting_malzeme_uyum
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM flansh_olculer f
      WHERE f.id = flansh_id AND (
        f.sistem_preset = true OR
        f.tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY fitting_malzeme_uyum_modify ON fitting_malzeme_uyum
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM flansh_olculer f
      WHERE f.id = flansh_id AND
        f.sistem_preset = false AND
        f.tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
    )
  );

-- ── spool_flansh_eslesme ──────────────────────────────────
-- Erişim spool_malzemeleri'ne göre türetilir (zaten RLS'li tablo).
CREATE POLICY spool_flansh_eslesme_select ON spool_flansh_eslesme
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM spool_malzemeleri sm WHERE sm.id = spool_malzeme_id)
  );

CREATE POLICY spool_flansh_eslesme_modify ON spool_flansh_eslesme
  FOR ALL USING (
    EXISTS (SELECT 1 FROM spool_malzemeleri sm WHERE sm.id = spool_malzeme_id)
  );

COMMIT;

-- ============================================================
-- DOĞRULAMA (manuel — Supabase SQL editor'de çalıştır)
-- ============================================================
-- A105 preset eklendi mi (13 sistem preset görünmeli):
--   SELECT kategori_kod, kalite_kod, standart
--   FROM malzeme_tanimlari
--   WHERE sistem_preset = true
--   ORDER BY kategori_kod, kalite_kod;
--
-- Yeni tablolar:
--   \d flansh_olculer
--   \d fitting_malzeme_uyum
--   \d spool_flansh_eslesme
--
-- Hepsi boş başladı:
--   SELECT count(*) FROM flansh_olculer;        -- 0
--   SELECT count(*) FROM fitting_malzeme_uyum;  -- 0
--   SELECT count(*) FROM spool_flansh_eslesme;  -- 0
--
-- RLS aktif:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename IN ('flansh_olculer','fitting_malzeme_uyum','spool_flansh_eslesme');
-- ============================================================
