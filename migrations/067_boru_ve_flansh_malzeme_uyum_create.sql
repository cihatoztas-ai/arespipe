-- =====================================================================
-- Migration 067 -- boru_malzeme_uyum + flansh_malzeme_uyum CREATE
-- =====================================================================
-- Tarih: 16 Mayis 2026
-- Oturum: 92
--
-- Amac: KUTUPHANE-KAPSAM.md Bolum 2'de tanimli 3 capraz uyum tablosunun
-- eksik 2'sini olustur. Su an sadece fitting_malzeme_uyum var (066+066b
-- ile duzeltildi). Boru ve flans icin ayni pattern uygulanir.
--
-- Niye 3 capraz tablo:
--   - boru_olculer.malzeme_grubu sadece "karbon/paslanmaz/cuni" kategori
--   - spec-grade seviyesi icin master tabloya (malzeme_kataloglari)
--     capraz uyum gerekli
--   - 43. oturum dersi: "Geometri degil malzeme"
--
-- Doldurma stratejisi:
--   Manuel doldurulmaz. Spool PDF parse > AI parca cikarir > geometri
--   eslesmesi varsa > uyum satiri kontrol edilir > yoksa oneri akisina
--   duser > onaydan sonra eklenir. KUTUPHANE-YUKLEME-TAKIP.md Bolum 5.
--
-- Policy mantigi (fitting_malzeme_uyum_select/_modify pattern'inin aynisi):
--   - SELECT: ana kayit gorulebilirse uyum satiri da gorulur
--   - MODIFY: tenant'a ait ozel kayitlar icin degistirilebilir
--
-- Veri kaybi riski: SIFIR (yeni tablo).
--
-- Onkosul: Migration 066 ve 066b calistirilmis olmali.
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1. boru_malzeme_uyum
-- =====================================================================

CREATE TABLE IF NOT EXISTS boru_malzeme_uyum (
  boru_id        uuid        NOT NULL REFERENCES boru_olculer(id) ON DELETE CASCADE,
  malzeme_id     uuid        NOT NULL REFERENCES malzeme_kataloglari(id) ON DELETE CASCADE,
  uretim_yontemi text,                          -- seamless / welded
  yaygin_mi      boolean     NOT NULL DEFAULT true,
  notlar         text,
  olusturma_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (boru_id, malzeme_id)
);

ALTER TABLE boru_malzeme_uyum ENABLE ROW LEVEL SECURITY;

-- SELECT: boru gorulebilirse uyum gorulebilir
CREATE POLICY boru_malzeme_uyum_select
  ON boru_malzeme_uyum
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boru_olculer b
      WHERE b.id = boru_malzeme_uyum.boru_id
        AND (
          b.sistem_preset = true
          OR b.tenant_id = (
            SELECT kullanicilar.tenant_id
            FROM kullanicilar
            WHERE kullanicilar.id = auth.uid()
          )
        )
    )
  );

-- MODIFY: tenant'a ait ozel boru kayitlari icin
CREATE POLICY boru_malzeme_uyum_modify
  ON boru_malzeme_uyum
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boru_olculer b
      WHERE b.id = boru_malzeme_uyum.boru_id
        AND b.sistem_preset = false
        AND b.tenant_id = (
          SELECT kullanicilar.tenant_id
          FROM kullanicilar
          WHERE kullanicilar.id = auth.uid()
        )
    )
  );

-- =====================================================================
-- 2. flansh_malzeme_uyum
-- =====================================================================

CREATE TABLE IF NOT EXISTS flansh_malzeme_uyum (
  flansh_id      uuid        NOT NULL REFERENCES flansh_olculer(id) ON DELETE CASCADE,
  malzeme_id     uuid        NOT NULL REFERENCES malzeme_kataloglari(id) ON DELETE CASCADE,
  uretim_yontemi text,                          -- forged / cast
  yaygin_mi      boolean     NOT NULL DEFAULT true,
  notlar         text,
  olusturma_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (flansh_id, malzeme_id)
);

ALTER TABLE flansh_malzeme_uyum ENABLE ROW LEVEL SECURITY;

-- SELECT: flans gorulebilirse uyum gorulebilir
CREATE POLICY flansh_malzeme_uyum_select
  ON flansh_malzeme_uyum
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flansh_olculer f
      WHERE f.id = flansh_malzeme_uyum.flansh_id
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

-- MODIFY: tenant'a ait ozel flans kayitlari icin
CREATE POLICY flansh_malzeme_uyum_modify
  ON flansh_malzeme_uyum
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM flansh_olculer f
      WHERE f.id = flansh_malzeme_uyum.flansh_id
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
-- Dogrulama Sorgulari (manuel calistir):
--
-- 1. Tablolar olustu mu?
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('boru_malzeme_uyum', 'flansh_malzeme_uyum')
-- ORDER BY table_name;
-- Beklenen: 2 satir
--
-- 2. RLS acik mi?
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('boru_malzeme_uyum', 'flansh_malzeme_uyum');
-- Beklenen: 2 satir, rowsecurity = true her ikisi icin
--
-- 3. FK + PK constraint'leri dogru mu?
-- SELECT
--   tc.table_name,
--   tc.constraint_type,
--   kcu.column_name,
--   ccu.table_name AS referans_tablo
-- FROM information_schema.table_constraints tc
-- LEFT JOIN information_schema.key_column_usage kcu
--   ON tc.constraint_name = kcu.constraint_name
-- LEFT JOIN information_schema.constraint_column_usage ccu
--   ON tc.constraint_name = ccu.constraint_name
-- WHERE tc.table_schema = 'public'
--   AND tc.table_name IN ('boru_malzeme_uyum', 'flansh_malzeme_uyum')
-- ORDER BY tc.table_name, tc.constraint_type, kcu.column_name;
-- Beklenen:
--   boru_malzeme_uyum    | FOREIGN KEY | boru_id     | boru_olculer
--   boru_malzeme_uyum    | FOREIGN KEY | malzeme_id  | malzeme_kataloglari
--   boru_malzeme_uyum    | PRIMARY KEY | boru_id     | boru_malzeme_uyum
--   boru_malzeme_uyum    | PRIMARY KEY | malzeme_id  | boru_malzeme_uyum
--   flansh_malzeme_uyum  | FOREIGN KEY | flansh_id   | flansh_olculer
--   flansh_malzeme_uyum  | FOREIGN KEY | malzeme_id  | malzeme_kataloglari
--   flansh_malzeme_uyum  | PRIMARY KEY | flansh_id   | flansh_malzeme_uyum
--   flansh_malzeme_uyum  | PRIMARY KEY | malzeme_id  | flansh_malzeme_uyum
--
-- 4. Policy'ler dogru mu?
-- SELECT
--   c.relname AS tablo,
--   p.polname AS policy_adi,
--   p.polcmd AS komut,
--   pg_get_expr(p.polqual, p.polrelid) AS using_ifadesi
-- FROM pg_policy p
-- JOIN pg_class c ON p.polrelid = c.oid
-- WHERE c.relname IN ('boru_malzeme_uyum', 'flansh_malzeme_uyum')
-- ORDER BY c.relname, p.polname;
-- Beklenen: 4 satir (her tablo icin _select ve _modify)
-- =====================================================================
