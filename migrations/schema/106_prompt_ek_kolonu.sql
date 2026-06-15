-- 106_prompt_ek_kolonu.sql
-- 186 / MK-186.1 — Prompt KOMPOZISYON altyapisi.
-- izometri_format_tanimlari'ya prompt_ek (format-ozel kisa ipucu) kolonu.
-- Yeni mimari: sistem_prompt = EVRENSEL_PROMPT (lib/prompt-birlestirici.js) + prompt_ek.
--   EVRENSEL_PROMPT = eski YAKLASIM_Y + guclendirilmis madde 3 (185 spool-sayma, evrenseldi).
-- prompt_template (mevcut) DOKUNULMAZ -- step 7'de (mig 105 geri alma) ayrica temizlenir.
-- PAOR'a OZGU kural YOK (185 fix cekirdege tasindi) -> PAOR prompt_ek = NULL kalir.
-- Additive + idempotent: IF NOT EXISTS. ADD COLUMN -> mevcut satirlarda NULL (= saf evrensel).
-- Dry-run istenirse: BEGIN; <asagidaki>; (kontrol) ROLLBACK; sonra duz calistir (MK-98.2).

ALTER TABLE izometri_format_tanimlari
  ADD COLUMN IF NOT EXISTS prompt_ek text;

COMMENT ON COLUMN izometri_format_tanimlari.prompt_ek IS
  '186: Formata OZGU L3 prompt eki (kisa, 5-10 satir). Evrensel cekirdek=lib/prompt-birlestirici.js EVRENSEL_PROMPT. NULL/bos = saf evrensel.';
