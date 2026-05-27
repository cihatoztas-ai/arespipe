-- 094_devreler_durum_taslak.sql
-- Oturum 128 -- Devre Wizard v3 (Inceleme & Onay) icin taslak devre statusu.
--
-- devreler.durum CHECK kumesine 'taslak' eklenir. devre_wizard_v3.html "Incele" adiminda
-- devre durum='taslak' olarak olusturulur (belge yuklemek icin devre_id sart; devre_dokumanlari.devre_id
-- NOT NULL + FK). "Onayla" (terfi) ile spool/QR uretilir ve durum 'aktif'e doner (MK-127.4).
-- Onay bekleyen devreler = durum='taslak' filtresi (MK-126.4).
--
-- Idempotent (MK-99.1): DROP IF EXISTS + ADD. Mevcut satirlar zaten eski kumede oldugundan
-- yeni deger eklemek ihlal uretmez. Dry-run dogrulandi (MK-98.2). Canli ALTER oturum 128'de
-- uygulandi; bu dosya migrations gecmisine kayit kopyasidir.

ALTER TABLE devreler DROP CONSTRAINT IF EXISTS devreler_durum_check;
ALTER TABLE devreler ADD CONSTRAINT devreler_durum_check
  CHECK (durum = ANY (ARRAY['aktif', 'durduruldu', 'tamamlandi', 'iptal', 'taslak']));
