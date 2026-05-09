-- migrations/035_aktif_basamak_gazalti_kaynagi.sql
-- 71 / 3f.3 — Kaynak alt-tip tutarlilik
--
-- Sorun: aktif_basamak enum'unda 'argon_kaynagi' var ama 'gazalti_kaynagi' yok.
-- Saha gazaltiyi 'kaynak' enum'una yaziyor (asimetrik miras tutarsizligi).
-- 3f.3 ile imalatci kaynak alt-tipini sectigi icin enum'un da simetrik olmasi gerek.
--
-- Cozum: gazalti_kaynagi enum degerini ekle.
-- Eski 'kaynak' kayitlari oldugu gibi kalir (data migration yok).
-- Yeni kayitlar argon_kaynagi VEYA gazalti_kaynagi yazar.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'gazalti_kaynagi'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'aktif_basamak_enum')
  ) THEN
    ALTER TYPE aktif_basamak_enum ADD VALUE 'gazalti_kaynagi';
  END IF;
END $$;

-- Dogrulama (manuel calistir):
--   select unnest(enum_range(NULL::aktif_basamak_enum)) order by 1;
--
-- Beklenen sonuca (en az):
--   alim_kontrol, argon_kaynagi, gazalti_kaynagi, imalat, kaynak, kk,
--   on_imalat, on_kontrol, sevkiyat, tasarim
