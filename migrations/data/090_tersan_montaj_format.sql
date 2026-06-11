-- =====================================================================
-- 090_tersan_montaj_format.sql  (114. oturum)
-- Tersan Cadmatic MONTAJ formati kaydi
--
-- Amac: Montaj/genel cizimleri (malzeme listesi YOK) L3'ten cikarip L2'ye
--       sokmak. D1 deligi: 146 montaj PDF'i pahali L3'e gidip "malzeme yok"
--       donuyordu (~$3.38 bos harcama). Bu kayit onlari montaj formatina
--       baglar -> deterministik topoloji hasati (spool listesi + continue +
--       alistirma + toplam agirlik), sifir AI.
--
-- Karar ozeti (114):
--   - Fingerprint: A-siki (dosya adi agirlikli, _S##_ icermez + Cadmatic)
--   - parser_kural: montaj_modu + liste_alanlar (lib/l2-parser.js'e eklendi)
--   - Guvenlik agi (C): requires_ai=true + l3_fallback_yapilir=true
--     -> montaj parse fail olursa L3'e duser, veri kaybolmaz
--   - parse_disi=false (parse edilecek)
--   - egitim_kaynagi='vision_only' (CHECK kisiti; aslinda 12 ornekten elle yazildi)
--
-- ESLESME/GOSTERIM: Bu migration sadece TANIMA + L2 HASAT saglar. Montaj
--   ciktisi parse_sonuc'a yazilir ama spool detayda gosterim + alistirma
--   yansimasi 115'e birakildi (B karari). Yani veri akmaya baslar, ekranda
--   henuz gorunmez -- BEKLENEN.
--
-- ID baglantisi: parser_kural montaj_modu pipe_no'yu izometri-oku'nun
--   enjekte etmesini bekler (115 isi). Su an parser pipe_no'yu 'pipe_no'
--   alaninin regex'inden okur; izometri-oku 115'te dosya adindan enjekte
--   edecek. O ana kadar pipe_no null gelebilir (spool_listesi yine dolar).
--
-- Geri alma: UPDATE izometri_format_tanimlari SET aktif=false
--            WHERE format_kodu='tersan_cadmatic_montaj';
-- =====================================================================

BEGIN;

-- --- Idempotency: format_kodu UNIQUE DEGIL, elle cakisma kontrolu ---
DO $$
DECLARE
  v_var int;
BEGIN
  SELECT count(*) INTO v_var FROM izometri_format_tanimlari
   WHERE format_kodu = 'tersan_cadmatic_montaj';
  IF v_var > 0 THEN
    RAISE EXCEPTION 'IPTAL: tersan_cadmatic_montaj zaten var (% kayit). Once kontrol et.', v_var;
  END IF;
END $$;

INSERT INTO izometri_format_tanimlari (
  ad,
  cad_program,
  format_kodu,
  fingerprint,
  parser_kural,
  egitim_kaynagi,
  tenant_id,
  aktif,
  sistem_preset,
  requires_ai,
  requires_ocr,
  parse_disi
) VALUES (
  'Tersan M110 Montaj Cizimi (genel)',
  'Cadmatic',
  'tersan_cadmatic_montaj',
  -- A-siki fingerprint: dosya adi (Tersan boru deseni, _S##_ ICERMEZ) +5,
  -- Cadmatic uretici +1. Imalat PDF'i bu regex'e tutmaz (_S##_ var) -> cakisma yok.
  '{
    "ulke": "TR",
    "tersane": "Tersan Shipyard",
    "dosya_adi_regex": "^[A-Z]+\\d+-[\\dA-Za-z]+-[\\dA-Za-z-]+_(?!S\\d)[\\d_]*\\d\\.pdf$",
    "pdf_uretici_anahtar": ["Cadmatic", "Piping Isometrics & Spools"]
  }'::jsonb,
  -- Montaj parser_kural: montaj_modu + tek-deger alanlar + liste_alanlar
  '{
    "ekstraktor_tipi": "regex_text",
    "montaj_modu": true,
    "min_metin_uzunlugu": 100,
    "spool_listesi_alan": "spool_listesi",
    "alanlar": {
      "pipe_no":    { "tip": "string", "grup": 1, "regex": "\\[\\[PIPE:([^\\]]+)\\]\\]" },
      "tarih":      { "tip": "string", "grup": 1, "regex": "\\n(\\d{2}-\\d{2}-\\d{2})\\n" },
      "agirlik_kg": { "tip": "float",  "grup": 1, "regex": "\\n(\\d+(?:\\.\\d+)?)\\s*kg\\n" },
      "blok":       { "tip": "string", "grup": 1, "regex": "\\n(B\\d{3,})\\n" },
      "yuzey":      { "tip": "string", "grup": 1, "regex": "\\n(Galvaniz|Paslanmaz|CUNIFE|Siyah|Asit|Boyal\\w*)\\n" },
      "sistem":     { "tip": "string", "grup": 1, "regex": "\\n(\\d+-[^\\n]*System[^\\n]*?)\\s*-?\\n" }
    },
    "liste_alanlar": {
      "spool_listesi":     { "regex": "(?<=\\n)(S\\d{2,})(?=\\n)", "grup": 1 },
      "continue_baglanti": { "regex": "Continue:\\s*([^\\n]+)", "grup": 1 },
      "guverte":           { "regex": "\\n([A-Z][A-Z .]*DECK[^\\n]*)", "grup": 1 }
    },
    "montaj_alistirma_kurali": {
      "continue_alan": "continue_baglanti",
      "parca_kelimeler": ["-ALS\\b"],
      "not_regex": "Alistirma Parcasidir",
      "parca_deger": "PARCA",
      "bagli_deger": "BAGLI"
    },
    "kabul_kriterleri": {
      "min_spool": 1,
      "l3_fallback_yapilir": true
    }
  }'::jsonb,
  'vision_only',
  NULL,
  true,
  true,
  true,
  false,
  false
);
-- NOT: egitim_kaynagi CHECK sadece 'vision_only'/'pdf_excel' kabul ediyor.
-- Bu kayit aslinda ELLE yazildi (12 ornekten, AI harcanmadi) ama uygun deger
-- yok; mevcut Tersan formatlariyla tutarli olsun diye 'vision_only' konuldu.

-- --- DOGRULAMA (dry-run ciktisinda gor) ---
SELECT id, ad, format_kodu, parse_disi, requires_ai, aktif,
       fingerprint->>'dosya_adi_regex' AS dosya_regex,
       (parser_kural->>'montaj_modu') AS montaj_modu
  FROM izometri_format_tanimlari
 WHERE format_kodu = 'tersan_cadmatic_montaj';

-- ONCE DRY-RUN: asagidaki ROLLBACK ile calistir, ciktiyi gor.
-- Her sey dogruysa ROLLBACK -> COMMIT yapip tekrar calistir.
ROLLBACK;
