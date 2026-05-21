-- Migration 087 -- Tersan Imalat L2 parser_kural (deterministik tablo + alanlar)
-- Oturum: 105
-- Tarih: 21 Mayis 2026
-- Amac: Tersan Cadmatic Imalat detay sayfalarini L3'suz, sifir AI maliyetiyle parse etmek.
--   lib/l2-parser.js jenerik parser'i parser_kural JSON config ile suruluyor (kod degisikligi yok).
--   8 gercek ornege karsi dogrulandi (MK-51.2): 7 detay tam parse (spool alanlari + malzeme
--   listesi, 0 ham satir), 1 montaj sayfasi dogru reddedildi (malzeme yok -> L3 fallback).
--   Kapsam: 7 satir tipi (boru-mm, boru-SCH, groove, kaynak, Ic Bilezik, Dirsek, Flans)
--   x malzeme aileleri (ST37, 316L, AISI 316L, CuNi10Fe1., St.St, St*).
--
-- MK-105.4 (tie-break): Iki Tersan formati G200 dosyalari icin fingerprint olarak ayrismadigi
--   icin parser_kural HER IKI formata da konuyor (A karari, 105). Detay sayfasi tie-break'te
--   hangisine duserse dussun L2 (sifir maliyet); montaj sayfasi L2'de fail -> L3 fallback (geometri 106).
-- MK-98.2: Once BEGIN...ROLLBACK dry-run ile test edildi.
-- Deger dollar-quote ile yaziliyor (backslash/tirnak escape derdi yok, SQL Editor Unicode-guvenli, ASCII icerik).

UPDATE izometri_format_tanimlari
  SET parser_kural = $pk${"ekstraktor_tipi":"regex_text","min_metin_uzunlugu":100,"alanlar":{"spool_no":{"regex":"\\n-(S\\d+(?:_\\d+)?)\\n","grup":1,"tip":"string"},"agirlik_kg":{"regex":"\\n(\\d+(?:\\.\\d+)?)\\s*kg\\n","grup":1,"tip":"float"},"yuzey":{"regex":"\\n(Galvaniz|Paslanmaz|CUNIFE|Siyah|Asit|Boyal.)\\n","grup":1,"tip":"string"},"tarih":{"regex":"\\n(\\d{2}-\\d{2}-\\d{2})\\n","grup":1,"tip":"string"},"cap_mm":{"regex":"(\\d+\\.\\d+)x\\d+\\.\\d","grup":1,"tip":"float"},"et_mm":{"regex":"\\d+\\.\\d+x(\\d+\\.\\d)","grup":1,"tip":"float"}},"malzeme_tablosu":{"aktif":true,"satir_tipleri":[{"ad":"boru_sch","kategori":"boru","tetikleyici_regex":"Boru Dik.*\"\\s*Sch","pattern":"^\\d+(.+?)(\\d+)\"\\s*Sch\\s*(\\d+S?)(\\d+)\\s+(316L|AISI\\s*316L|ST\\d{2})(\\d+\\.\\d+)$","grup_haritasi":{"tanim":1,"boy_mm":4,"kalite":5,"agirlik_kg":6}},{"ad":"groove","kategori":"islem","tetikleyici_regex":"Groove","pattern":"^\\d+?(\\d)(.+?)DN(\\d+)(?:\\s*OD:\\d+)?\\s*([\\d.]+)([A-Za-z.*]*)(\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dn":3,"agirlik_kg":4,"kalite":5}},{"ad":"kaynak","kategori":"islem","tetikleyici_regex":"Al.n Kayna","pattern":"^\\d+?(\\d)(.+?)DN(\\d+)\\s*\\d*(ST\\d{2}|316L)(\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dn":3,"kalite":4,"agirlik_kg":5}},{"ad":"bilezik","kategori":"fitting","tetikleyici_regex":"Ic Bilezik","pattern":"^\\d+?(\\d)(.+?)DN(\\d+)\\s+L=(\\d+)\\s*(\\d+)(ST\\d{2}|316L)(\\d+\\.\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dn":3,"boy_mm":4,"kalite":6,"agirlik_kg":7}},{"ad":"dirsek","kategori":"fitting","tetikleyici_regex":"Dirsek","pattern":"^\\d+?(\\d)(.+?)(\\d+\\.\\d+)x(\\d+\\.\\d)\\s*(\\d+)(CuNi\\d+Fe\\d+\\.|ST\\d{2}|316L)(\\d+\\.\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dis_cap_mm":3,"et_mm":4,"boy_mm":5,"kalite":6,"agirlik_kg":7}},{"ad":"flans","kategori":"fitting","tetikleyici_regex":"Flan","pattern":"^\\d+?(\\d)(.+?)DN(\\d+)\\s*\\d+(ST\\d{2}|AISI\\s*316L|316L)(\\d+\\.\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dn":3,"kalite":4,"agirlik_kg":5}},{"ad":"boru_mm","kategori":"boru","tetikleyici_regex":"Boru Dik","pattern":"^\\d+(.+?)(\\d+\\.\\d+)x(\\d+\\.\\d)(\\d+)\\s+(ST\\d{2}|CuNi\\d+Fe\\d+\\.|316L|St\\.St)(\\d+\\.\\d+)$","grup_haritasi":{"tanim":1,"dis_cap_mm":2,"et_mm":3,"boy_mm":4,"kalite":5,"agirlik_kg":6}}]},"kabul_kriterleri":{"min_overall_match_orani":0.5,"min_malzeme_satir":1,"l3_fallback_yapilir":true}}$pk$::jsonb,
      guncelleme_at = now()
  WHERE format_kodu IN ('tersan_cadmatic_spool','tersan_cadmatic_isometry');


-- =====================================================================
-- DOGRULAMA SORGULARI (manuel run sonrasi)
-- =====================================================================
-- 1) Iki format da guncellendi mi (2 satir, satir_tipi_sayisi=7 beklenir):
-- SELECT format_kodu, jsonb_typeof(parser_kural) AS tip,
--        jsonb_array_length(parser_kural->'malzeme_tablosu'->'satir_tipleri') AS satir_tipi_sayisi
-- FROM izometri_format_tanimlari
-- WHERE format_kodu IN ('tersan_cadmatic_spool','tersan_cadmatic_isometry');
