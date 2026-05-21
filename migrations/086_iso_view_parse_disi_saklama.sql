-- Migration 086 -- iso_view parse-disi bayragi + is_kuyrugu 'saklama' durumu
-- Oturum: 105
-- Tarih: 21 Mayis 2026
-- Amac: PAOR isometric_view gibi metni-bos image-PDF formatlarini parse
--   etmeden saklamak (bosa L3 / AI maliyeti onlenir). Iki parca:
--
--   1) izometri_format_tanimlari.parse_disi BOOLEAN
--      Format-bazli "parse etme, sakla" bayragi. paor_aveva_iso_view icin true.
--      Worker (kuyruk-isle) bu bayrakli formatlarin fingerprint.dosya_adi_regex
--      ile eslesen dosyalari L3'e gondermez. Genel: ileride herhangi bir image-PDF
--      formati tek SQL ile parse-disi yapilabilir (MK-104.5 kalici kategori), kod degismez.
--
--   2) is_kuyrugu.durum CHECK'ine 'saklama' degeri
--      Atlanan dosya 'tamam' sayilmasin -> metrik kirliligi onlenir (kuyruk-durum
--      ozetinde basari/parse sayisini sismez). Ayri terminal durum.
--      080'deki devre_dokumanlari.parse_durumu ile tutarli ('saklama').
--
-- MK-98.2: Bu dosya canliya alinmadan once BEGIN...ROLLBACK dry-run ile test edildi.
-- MK-99.1: DROP+ADD idempotent constraint pattern.
-- MK-101.5: Mevcut def kontrol edildi (105):
--   is_kuyrugu_durum_check = CHECK (durum IN ('bekliyor','isleniyor','tamam','hata','iptal'))

-- 1) Format-bazli parse-disi bayragi
ALTER TABLE izometri_format_tanimlari
  ADD COLUMN IF NOT EXISTS parse_disi BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN izometri_format_tanimlari.parse_disi IS
  '105 (086): true ise bu formatla eslesen dosyalar parse edilmez, sadece saklanir (image-PDF / 3d-view). Worker kuyruk-isle, bayrakli formatlarin fingerprint.dosya_adi_regex ile eslesen dosyalari L3 e gondermez, kaydi durum=saklama yapar.';

-- 2) iso_view formatini parse-disi isaretle
UPDATE izometri_format_tanimlari
  SET parse_disi = true, guncelleme_at = now()
  WHERE format_kodu = 'paor_aveva_iso_view';

-- 3) is_kuyrugu.durum CHECK'ine 'saklama' ekle (DROP+ADD idempotent)
ALTER TABLE is_kuyrugu
  DROP CONSTRAINT IF EXISTS is_kuyrugu_durum_check;

ALTER TABLE is_kuyrugu
  ADD CONSTRAINT is_kuyrugu_durum_check
  CHECK (durum IN ('bekliyor','isleniyor','tamam','hata','iptal','saklama'));


-- =====================================================================
-- DOGRULAMA SORGULARI (manuel run sonrasi kontrol)
-- =====================================================================
-- 1) iso_view isaretlendi mi (1 satir, parse_disi=true beklenir):
-- SELECT format_kodu, ad, parse_disi
-- FROM izometri_format_tanimlari WHERE format_kodu = 'paor_aveva_iso_view';
--
-- 2) Sadece iso_view isaretli mi (count=1 beklenir):
-- SELECT count(*) FROM izometri_format_tanimlari WHERE parse_disi = true;
--
-- 3) Yeni constraint def ('saklama' gorunmeli):
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conname = 'is_kuyrugu_durum_check';
