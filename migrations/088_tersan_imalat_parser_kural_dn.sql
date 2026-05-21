-- Migration 088 -- Tersan Imalat parser_kural: spool DN + iki bug fix
-- Oturum: 105 (kapanis sonrasi canli teyit + gercek cizim ciktisi bulgulari)
-- NOT: 105'te gonderilen onceki "dn-only 088"i GECERSIZ kilar; bu tam surum (parser_kural'i
--   tam ustune yazar, idempotent). Onceki dn-only dosyayi COMMIT ETME, bunu kullan.
--
-- 087 ile L2 CANLI + $0 (teyit: ai_api_log L2_deterministic, maliyet=0). Bu surum 3 sorunu cozer:
--  1) SPOOL DN: halusinasyonFiltresi (izometri-oku.js, DOKUNULMAZ MK-49.1) Madde 1 "if(!sp.dn)->KRITIK".
--     L2 spool'larinda spool dn bostu (mm boru OD veriyor) -> her spool manuel_onay'a dusuyordu.
--     Fix: alanlar.dn = malzeme satiri DN (DN + bosluk + rakam/L=/OD:); NOT'taki "DN25 Drain" elenir.
--  2) IKI HANELI No (BUG1): fitting/op pattern leading'i lazy idi (^\d+?(\d)) -> No iki haneliyse
--     (10,11,12...) tanim basina fazladan rakam giriyor ("1Flans") + adet yanlis. Greedy yapildi
--     (^\d+(\d)): No=tum-onceki, adet=son hane. (G200 cok-spoollu cizimde tespit edildi.)
--  3) NOT satiri (BUG2): flans tetikleyicisi "Flan" idi -> NOT icindeki "flangler" yakalanip ham
--     satir olarak listeye giriyordu. Sikilastirildi: "Flan\\S*\\s+D" (gercek "Flans Duz" tutar).
--
-- 8 gercek ornek + sentetik (iki-haneli No + NOT) ile dogrulandi: 8/8, 0 ham, adet/dn/tanim dogru.
-- HER IKI Tersan formatina (MK-105.4).

UPDATE izometri_format_tanimlari
  SET parser_kural = $pk${"ekstraktor_tipi":"regex_text","min_metin_uzunlugu":100,"alanlar":{"spool_no":{"regex":"\\n-(S\\d+(?:_\\d+)?)\\n","grup":1,"tip":"string"},"agirlik_kg":{"regex":"\\n(\\d+(?:\\.\\d+)?)\\s*kg\\n","grup":1,"tip":"float"},"yuzey":{"regex":"\\n(Galvaniz|Paslanmaz|CUNIFE|Siyah|Asit|Boyal.)\\n","grup":1,"tip":"string"},"tarih":{"regex":"\\n(\\d{2}-\\d{2}-\\d{2})\\n","grup":1,"tip":"string"},"cap_mm":{"regex":"(\\d+\\.\\d+)x\\d+\\.\\d","grup":1,"tip":"float"},"et_mm":{"regex":"\\d+\\.\\d+x(\\d+\\.\\d)","grup":1,"tip":"float"},"dn":{"regex":"DN(\\d+)\\s+(?:\\d|L=|OD:)","grup":1,"tip":"int"}},"malzeme_tablosu":{"aktif":true,"satir_tipleri":[{"ad":"boru_sch","kategori":"boru","tetikleyici_regex":"Boru Dik.*\"\\s*Sch","pattern":"^\\d+(.+?)(\\d+)\"\\s*Sch\\s*(\\d+S?)(\\d+)\\s+(316L|AISI\\s*316L|ST\\d{2})(\\d+\\.\\d+)$","grup_haritasi":{"tanim":1,"boy_mm":4,"kalite":5,"agirlik_kg":6}},{"ad":"groove","kategori":"islem","tetikleyici_regex":"Groove","pattern":"^\\d+(\\d)(.+?)DN(\\d+)(?:\\s*OD:\\d+)?\\s*([\\d.]+)([A-Za-z.*]*)(\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dn":3,"agirlik_kg":4,"kalite":5}},{"ad":"kaynak","kategori":"islem","tetikleyici_regex":"Al.n Kayna","pattern":"^\\d+(\\d)(.+?)DN(\\d+)\\s*\\d*(ST\\d{2}|316L)(\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dn":3,"kalite":4,"agirlik_kg":5}},{"ad":"bilezik","kategori":"fitting","tetikleyici_regex":"Ic Bilezik","pattern":"^\\d+(\\d)(.+?)DN(\\d+)\\s+L=(\\d+)\\s*(\\d+)(ST\\d{2}|316L)(\\d+\\.\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dn":3,"boy_mm":4,"kalite":6,"agirlik_kg":7}},{"ad":"dirsek","kategori":"fitting","tetikleyici_regex":"Dirsek","pattern":"^\\d+(\\d)(.+?)(\\d+\\.\\d+)x(\\d+\\.\\d)\\s*(\\d+)(CuNi\\d+Fe\\d+\\.|ST\\d{2}|316L)(\\d+\\.\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dis_cap_mm":3,"et_mm":4,"boy_mm":5,"kalite":6,"agirlik_kg":7}},{"ad":"flans","kategori":"fitting","tetikleyici_regex":"Flan\\S*\\s+D","pattern":"^\\d+(\\d)(.+?)DN(\\d+)\\s*\\d+(ST\\d{2}|AISI\\s*316L|316L)(\\d+\\.\\d+)$","grup_haritasi":{"adet":1,"tanim":2,"dn":3,"kalite":4,"agirlik_kg":5}},{"ad":"boru_mm","kategori":"boru","tetikleyici_regex":"Boru Dik","pattern":"^\\d+(.+?)(\\d+\\.\\d+)x(\\d+\\.\\d)(\\d+)\\s+(ST\\d{2}|CuNi\\d+Fe\\d+\\.|316L|St\\.St)(\\d+\\.\\d+)$","grup_haritasi":{"tanim":1,"dis_cap_mm":2,"et_mm":3,"boy_mm":4,"kalite":5,"agirlik_kg":6}}]},"kabul_kriterleri":{"min_overall_match_orani":0.5,"min_malzeme_satir":1,"l3_fallback_yapilir":true}}$pk$::jsonb,
      guncelleme_at = now()
  WHERE format_kodu IN ('tersan_cadmatic_spool','tersan_cadmatic_isometry');

-- DOGRULAMA: SELECT format_kodu, (parser_kural->'alanlar') ? 'dn' AS dn_var,
--   jsonb_array_length(parser_kural->'malzeme_tablosu'->'satir_tipleri') AS satir_tipi
--   FROM izometri_format_tanimlari WHERE format_kodu IN ('tersan_cadmatic_spool','tersan_cadmatic_isometry');
--   Beklenen: 2 satir, dn_var=true, satir_tipi=7
