-- 089_tersan_parser_kural_not_alistirma.sql  (Oturum 106)
-- Amac: parser_kural'a not_metni alani + alistirma_ipucu_kurali ekle.
--   - not_metni: PDF'teki "NOT: ,..." satirini yakalar (bos notu reddeder)
--   - alistirma_ipucu_kurali: not metninde alistirma/ayarlanarak gecerse KISMI ipucu uretir
-- ASCII-guvenli (SQL Editor Unicode bozma riski yok). jsonb_set ile sadece 2 anahtar dokunulur.
-- Kapsam: tersan_cadmatic_spool (Imalat, aktif/kanitli). Montaj icin asagidaki IN listesine
--         'tersan_cadmatic_isometry' eklenebilir (su an ikisi ayni kural - MK-105.4).

-- === DRY-RUN (once bunu calistir, etkilenecek satiri gor, sonra ROLLBACK) ===
BEGIN;
UPDATE izometri_format_tanimlari
SET parser_kural = jsonb_set(
      jsonb_set(parser_kural, '{alanlar,not_metni}', '{"regex": "NOT:[ \\t]*,?[ \\t]*([^\\s,][^\\n]*)", "grup": 1, "tip": "string"}'::jsonb),
      '{alistirma_ipucu_kurali}', '{"kaynak_alan": "not_metni", "anahtar_kelimeler": ["al.{2}t.rma", "ayarlanarak"], "deger": "KISMI"}'::jsonb),
    guncelleme_at = now()
WHERE format_kodu IN ('tersan_cadmatic_spool');

-- Dogrulama: yeni alanlar yerinde mi?
SELECT format_kodu,
       parser_kural->'alanlar'->'not_metni' AS not_metni_def,
       parser_kural->'alistirma_ipucu_kurali' AS alistirma_kurali
FROM izometri_format_tanimlari
WHERE format_kodu IN ('tersan_cadmatic_spool');
ROLLBACK;

-- === CANLI (dry-run dogru gorununce BEGIN/ROLLBACK'i COMMIT'e cevirip tekrar calistir) ===
-- BEGIN;
-- UPDATE izometri_format_tanimlari
-- SET parser_kural = jsonb_set(
--       jsonb_set(parser_kural, '{alanlar,not_metni}', '{"regex": "NOT:[ \\t]*,?[ \\t]*([^\\s,][^\\n]*)", "grup": 1, "tip": "string"}'::jsonb),
--       '{alistirma_ipucu_kurali}', '{"kaynak_alan": "not_metni", "anahtar_kelimeler": ["al.{2}t.rma", "ayarlanarak"], "deger": "KISMI"}'::jsonb),
--     guncelleme_at = now()
-- WHERE format_kodu IN ('tersan_cadmatic_spool');
-- COMMIT;
