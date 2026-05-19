-- migrations/084_dosya_isleme_kuyrugu_durum_genislet.sql
-- 101. oturum (19 Mayıs 2026)
--
-- dosya_isleme_kuyrugu_durum_chk check constraint'i 2 yeni değer içerecek
-- şekilde genişletilir.
--
-- Eski set: bekliyor, isleniyor, tamamlandi, hata, iptal
-- Yeni set: + oneri_hazir, + manuel_onay
--
-- Eklenenler:
--   'oneri_hazir'  → Parser L1 başarılı + güven ≥ 70. Kullanıcı onayını
--                    bekliyor. Onay sonrası 'tamamlandi' olur.
--   'manuel_onay'  → Parser L2 veya güven < 70. Kullanıcı kolonları
--                    manuel eşlemeli. Eşleme sonrası 'tamamlandi' olur.
--
-- Idempotent: DROP IF EXISTS + ADD CONSTRAINT.
-- MK-99.1 deseni — re-runnable migration.

BEGIN;

ALTER TABLE dosya_isleme_kuyrugu
  DROP CONSTRAINT IF EXISTS dosya_isleme_kuyrugu_durum_chk;

ALTER TABLE dosya_isleme_kuyrugu
  ADD CONSTRAINT dosya_isleme_kuyrugu_durum_chk
  CHECK (durum = ANY (ARRAY[
    'bekliyor'::text,
    'isleniyor'::text,
    'tamamlandi'::text,
    'hata'::text,
    'iptal'::text,
    'oneri_hazir'::text,
    'manuel_onay'::text
  ]));

COMMENT ON CONSTRAINT dosya_isleme_kuyrugu_durum_chk ON dosya_isleme_kuyrugu IS
  '7 durum değeri: 5 mevcut (bekliyor/isleniyor/tamamlandi/hata/iptal) + 2 yeni (oneri_hazir/manuel_onay). 101. oturum (Migration 084).';

COMMIT;
