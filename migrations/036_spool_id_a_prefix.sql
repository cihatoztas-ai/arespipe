-- migrations/036_spool_id_a_prefix.sql
-- ============================================================================
-- A- prefix backfill + format enforcement (CHECK constraint).
--
-- Bağlam:
--   73. oturum sonunda canlı DB'de manuel UPDATE atıldı (492 satır):
--     update spooller set spool_id = 'A-' || spool_id where spool_id ~ '^[0-9]+$';
--   Migration dosyası o anda yazılmadı → repo/DB drift oluştu.
--   Bu dosya drift'i kapatır + ileride yanlış format insert'i fiziksel olarak
--   engellemek için CHECK constraint ekler (Yol B, MK-74.2).
--
-- Disiplin (MK-74.1):
--   Bu drift "bundan sonra DB değişiklikleri migration dosyası yazılmadan
--   uygulanmayacak" kuralının doğmasına sebep oldu. Bkz. KARARLAR.md.
--
-- Format kuralı (MK-74.2):
--   - spool_id NULL olabilir (atanmamış spool) — şu an 40 satır var, SED-74-02
--   - spool_id NULL DEĞİLSE: '^A-[0-9]{4,}$' pattern'ine uymalı
--   - UI'da 4 hane gösterilir (A-0580), DB'de sıfır-dolgulu daha geniş hane
--     olabilir (A-000580). 4 hane dolunca 5'e, dolunca 6'ya kademeli geçiş.
--   - spool_id UNIQUE değildir — her devrede tekrarlanabilir. Gerçek tekil
--     referans `spooller.id` (uuid).
--
-- Idempotent:
--   - Backfill regex `^[0-9]+$` yalnızca düz sayısal değerleri yakalar
--   - CHECK constraint drop+create pattern
--   - Tekrar çalıştırılabilir
--
-- Mevcut data durumu (73 sonu ölçümü):
--   566 satır A-XXXX uyumlu, 40 satır NULL, 0 anomali.
-- ============================================================================

begin;

-- 1) Backfill: yalnızca düz sayısal spool_id'lere 'A-' prefix ekle
update spooller
   set spool_id = 'A-' || spool_id
 where spool_id ~ '^[0-9]+$';

-- 2) Backfill doğrulama: artık düz sayısal spool_id kalmamalı
do $$
declare
  kalan int;
begin
  select count(*) into kalan
    from spooller
   where spool_id ~ '^[0-9]+$';

  if kalan > 0 then
    raise exception 'Migration 036 backfill hatasi: % satir hala duz sayisal', kalan;
  end if;
end $$;

-- 3) CHECK constraint: spool_id NULL VEYA 'A-' prefix + en az 4 hane
alter table spooller
  drop constraint if exists spool_id_format_chk;

alter table spooller
  add constraint spool_id_format_chk
  check (spool_id is null or spool_id ~ '^A-[0-9]{4,}$');

-- 4) CHECK constraint doğrulama: explicit kontrol
do $$
declare
  kalan int;
begin
  select count(*) into kalan
    from spooller
   where spool_id is not null
     and spool_id !~ '^A-[0-9]{4,}$';

  if kalan > 0 then
    raise exception 'Migration 036 format dogrulama hatasi: % satir uyumsuz', kalan;
  end if;
end $$;

commit;
