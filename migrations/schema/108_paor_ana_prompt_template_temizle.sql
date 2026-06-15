-- 108_paor_ana_prompt_template_temizle.sql
-- 186 / MK-186.1 (Step 7): migration 105'i geri al.
-- prompt_template artik RUNTIME'DA OKUNMUYOR -- promptBirlestir() yalniz EVRENSEL_PROMPT + prompt_ek
-- okur (lib/prompt-birlestirici.js:171-173). DB'de durmasi MK-155.1 TUZAGI: biri prompt_template'i
-- duzenler, runtime sessizce yok sayar -> kafa karisikligi. NULL'la.
-- REGRESYON YOK: guclendirilmis madde-3 (SPOOL sayma kurali) EVRENSEL_PROMPT'ta baki.
-- istek_surum hash'i prompt_template'i KULLANMAZ -> cache GECERLI kalir, yeniden-parse GEREKMEZ.
-- id-scoped: YALNIZ PAOR Ana. Tersan ve diger formatlara DOKUNMAZ (kirmizi cizgi).
-- Dry-run (MK-98.2):
--   BEGIN;
--   UPDATE ... (asagidaki);
--   SELECT id, format_kodu, prompt_template FROM izometri_format_tanimlari
--     WHERE id='995b5514-a937-4581-872c-e620bc09a31f';   -- prompt_template NULL gormeli
--   ROLLBACK;
-- sonra duz calistir.

UPDATE izometri_format_tanimlari
SET prompt_template = NULL,
    guncelleme_at = now()
WHERE id = '995b5514-a937-4581-872c-e620bc09a31f'
  AND format_kodu = 'paor_aveva_ana';
