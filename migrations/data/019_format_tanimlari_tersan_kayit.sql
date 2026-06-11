-- =============================================================================
-- Migration: 019_format_tanimlari_tersan_kayit.sql
-- Konu:      izometri_format_tanimlari'na "Cadmatic — Tersan Shipyard M110"
--            kaydını ekle (fingerprint + meta, parser_kural BOŞ)
-- Oturum:    45 (29 Nisan 2026)
--
-- BAĞLAM
-- ------
-- 45'in iki referans pilot formatından biri tersan. PAOR zaten var
-- (kullanim_sayisi=6, sistem_preset=true). Bu migration tersan'ı ekler.
--
-- parser_kural BOŞ ('{}') — kod tarafı henüz parser branch'ini yazmadı.
-- 020 migration'ında (parser kodu yazıldıktan sonra) parser_kural
-- doldurulacak, hem tersan hem PAOR için.
--
-- FİNGERPRİNT TASARIMI
-- ---------------------
-- Cihat'ın notu (45/29-Nis): "tersan başka CAD da kullanıyor olabilir,
-- diğer tersaneler farklı dosyalar verebilir." Bu yüzden bu kayıt
-- M110 ÖRNEĞİNE özel — başka tersan formatları geldiğinde ayrı kayıt
-- açılır (Karar 9: aynı program, farklı şablon → ayrı kayıt).
--
-- Eşleşme kriterleri:
-- - dosya_adi_regex: M110-XXX-XXX-PX X(X).SXX.X.pdf paterni
-- - baslik_regex: "Malzeme Listesi" (Türkçe başlık)
-- - tablo_baslik_regex: "Cut & Bending Info" (Cadmatic'a özgü kombo)
-- - pdf_uretici_anahtar: "Cadmatic" (M110 örneklerinde Producer)
-- - tersane: "Tersan Shipyard" (logo alanı, opsiyonel görsel teyit)
-- - ulke: "TR"
--
-- KAYIT SAFI: tenant_id=NULL + sistem_preset=true → her tenant okur
--
-- İDEMPOTENT: NOT EXISTS kontrolü ile.
-- =============================================================================

BEGIN;

INSERT INTO izometri_format_tanimlari (
  ad,
  cad_program,
  fingerprint,
  parser_kural,
  egitim_kaynagi,
  tenant_id,
  aktif,
  sistem_preset
)
SELECT
  'Cadmatic — Tersan Shipyard M110 Şablonu',
  'Cadmatic',
  '{
    "ulke": "TR",
    "tersane": "Tersan Shipyard",
    "format_kodu": "tersan_cadmatic_m110",
    "baslik_regex": "Malzeme Listesi",
    "tablo_baslik_regex": "Cut & Bending Info",
    "dosya_adi_regex": "^[A-Z]\\d+-\\d+-\\d+-P\\d+\\s+\\d+\\(\\d+\\)\\.S\\d+\\.\\d+\\.pdf$",
    "pdf_uretici_anahtar": ["Cadmatic", "Piping Isometrics & Spools"]
  }'::jsonb,
  '{}'::jsonb,         -- parser_kural BOŞ — 020 migration'da kod yazıldıktan sonra doldurulacak
  'pdf_excel',         -- tersan zip'inde IFS Excel mevcut (cross-validation için)
  NULL,                -- sistem geneli
  true,
  true                 -- sistem_preset=true
WHERE NOT EXISTS (
  SELECT 1 FROM izometri_format_tanimlari
  WHERE ad = 'Cadmatic — Tersan Shipyard M110 Şablonu'
    AND sistem_preset = true
);

COMMIT;

-- =============================================================================
-- DOĞRULAMA (COMMIT sonrası manuel çalıştır)
-- =============================================================================
--
-- 1. Yeni kayıt eklendi mi (2 satır beklenir: PAOR + tersan):
-- SELECT id, ad, cad_program, sistem_preset, tenant_id,
--        (parser_kural::text = '{}') AS parser_kural_bos,
--        kullanim_sayisi
-- FROM izometri_format_tanimlari
-- ORDER BY ad;
--
-- Beklenen:
--   AVEVA E3D - Portuguese Navy AOR (PAOR)         | sistem_preset=t | parser_kural_bos=t | kullanim=6
--   Cadmatic — Tersan Shipyard M110 Şablonu        | sistem_preset=t | parser_kural_bos=t | kullanim=0
--
-- 2. Fingerprint detayı:
-- SELECT ad, fingerprint
-- FROM izometri_format_tanimlari
-- WHERE ad = 'Cadmatic — Tersan Shipyard M110 Şablonu';
--
-- Beklenen: format_kodu="tersan_cadmatic_m110", dosya_adi_regex set...
--
-- =============================================================================
