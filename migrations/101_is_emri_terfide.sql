-- Migration 101 — is_emri_no uretimi terfiye tasiniyor (oturum 159)
-- Karar: iptal edilen taslaklara numara ATANMAZ; numara TERFIDE uretilir.
-- Eski davranis taslak INSERT'inde sonraki_no cagiriyordu -> iptal taslaklar
-- numara yakti (aktif listede 199->201->204->207->215->217 sicramalari).
-- Mevcut taslaklarin yakilmis numaralari geri ALINMAZ (sadece ileriye donuk).
--
-- On-kontrol kaniti (2026-06-05): aktif 131 / taslak 24 / durduruldu 1,
-- hicbirinde numarasiz kayit yok -> siki CHECK guvenli.
-- devreler_is_emri_no_not_empty CHECK'i (TRIM <> '') NULL'da gecer -> cakisma yok.
--
-- MK-98.2: once bu blogu BEGIN...ROLLBACK ile dry-run calistir.
-- "ihlal = 0" gorduysen ROLLBACK satirini COMMIT yapip tekrar calistir.

BEGIN;

ALTER TABLE devreler ALTER COLUMN is_emri_no DROP NOT NULL;

-- Yalniz taslak numarasiz kalabilir; aktif/durduruldu/tamamlandi/iptal numarasiz olamaz.
ALTER TABLE devreler ADD CONSTRAINT devreler_is_emri_terfi_check
  CHECK (durum = 'taslak' OR is_emri_no IS NOT NULL);

-- Kontrol: 0 beklenir
SELECT count(*) AS ihlal FROM devreler WHERE durum <> 'taslak' AND is_emri_no IS NULL;

ROLLBACK;  -- dry-run temizse COMMIT ile calistir
