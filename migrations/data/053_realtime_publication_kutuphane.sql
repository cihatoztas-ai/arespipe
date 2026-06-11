-- =============================================================================
-- 053 / 82. Oturum — Kütüphane tablolarını supabase_realtime publication'a ekle
-- =============================================================================
-- AMAÇ:
--   admin/kutuphane.html ve admin/kutuphane-detay.html sayfaları, kayıtlar
--   eklendiğinde / güncellendiğinde / silindiğinde otomatik tazelensin.
--   Bunun için Supabase Realtime'ın WAL replication'ını dinleyebilmesi
--   için ilgili tabloların 'supabase_realtime' publication'a eklenmesi gerek.
--
-- KAPSAM:
--   - boru_olculer
--   - fitting_olculer
--   - flansh_olculer
--   - malzeme_kataloglari
--   - fitting_malzeme_uyum
--
-- YAPILMIYOR:
--   ozel_parcalar / tenant_spec_seti / spec_kural — tablolar henüz yok
--   (bu tabloları CREATE eden migration'da publication'a eklenmeleri gerekecek)
--
-- İdempotent: zaten ekli ise atlar.
-- =============================================================================

DO $$
DECLARE
  t TEXT;
  tablolar TEXT[] := ARRAY[
    'boru_olculer',
    'fitting_olculer',
    'flansh_olculer',
    'malzeme_kataloglari',
    'fitting_malzeme_uyum'
  ];
BEGIN
  FOREACH t IN ARRAY tablolar LOOP
    -- Tablo var mı?
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE '⚠ Tablo yok: % — atlandı', t;
      CONTINUE;
    END IF;

    -- Publication'da zaten var mı?
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      RAISE NOTICE '✓ Zaten ekli: %', t;
      CONTINUE;
    END IF;

    -- Ekle
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    RAISE NOTICE '✓ Eklendi: %', t;
  END LOOP;
END $$;

-- =============================================================================
-- Doğrulama — ayrı çalıştır:
-- =============================================================================
-- SELECT tablename FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime'
--   AND tablename IN ('boru_olculer','fitting_olculer','flansh_olculer',
--                     'malzeme_kataloglari','fitting_malzeme_uyum')
-- ORDER BY tablename;
-- 
-- Beklenen: 5 satır.
