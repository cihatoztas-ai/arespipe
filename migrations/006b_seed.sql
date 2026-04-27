-- =====================================================================
-- Migration 006b -- Endustri Malzeme Eslesme (Seed Data)
-- =====================================================================
-- Tarih: 27 Nisan 2026 -- 37. oturum
-- Konu: MILFIT BORU 2024 kartinin DB transferi (2/2 - veri)
-- Onkosul: 006a_yapi.sql calistirilmis olmali
-- Idempotent: tekrar calistirilabilir (WHERE NOT EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- B1. Urun Formlari (4 satir)
-- ---------------------------------------------------------------------

INSERT INTO endustri_urun_formlari (kod, ad_tr, ad_en, aciklama, hub_aciklama, sirala)
SELECT 'boru', 'Boru', 'Pipe',
       'Duz dikisli/dikissiz celik boru. ASTM A53/A106/A312/A335 vb.',
       'Sivi, gaz ve buhar tasima icin kullanilan silindirik celik boru.',
       1
WHERE NOT EXISTS (SELECT 1 FROM endustri_urun_formlari WHERE kod = 'boru');

INSERT INTO endustri_urun_formlari (kod, ad_tr, ad_en, aciklama, hub_aciklama, sirala)
SELECT 'flans', 'Flans', 'Flange',
       'Boru baglantai flanslari. ASTM A105/A182 Grade F serisi.',
       'Borulari birbirine veya ekipmana civatayla baglayan disk seklinde parca.',
       2
WHERE NOT EXISTS (SELECT 1 FROM endustri_urun_formlari WHERE kod = 'flans');

INSERT INTO endustri_urun_formlari (kod, ad_tr, ad_en, aciklama, hub_aciklama, sirala)
SELECT 'fitting', 'Kaynak Agizli Fitting', 'Welded Fitting',
       'Dirsek, T, reduksiyon vb. kaynak baglantili fitting. ASTM A234/A403/A420/A860 Grade WP.',
       'Boru hattinin yon degistirmesi, dallanmasi veya cap degistirmesi icin kullanilan parca.',
       3
WHERE NOT EXISTS (SELECT 1 FROM endustri_urun_formlari WHERE kod = 'fitting');

INSERT INTO endustri_urun_formlari (kod, ad_tr, ad_en, aciklama, hub_aciklama, sirala)
SELECT 'cubuk', 'Cubuk', 'Bar',
       'Yuvarlak/kare/altigen kesitli celik cubuk.',
       'Civata, mil vb. mekanik parca uretiminde kullanilan dolu kesitli celik.',
       4
WHERE NOT EXISTS (SELECT 1 FROM endustri_urun_formlari WHERE kod = 'cubuk');

-- ---------------------------------------------------------------------
-- B2. Ana Malzemeler -- ALASIMSIZ
-- ---------------------------------------------------------------------

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, sektor_notu, dogrulama_durumu)
SELECT 'P235TR1', '1.0254', 'St 37.0', 'alasimsiz', 'p235tr1-1-0254',
       'Genel amacli dikisli/dikissiz boru celigi', 'Endustride en yaygin karbon celigi boru.', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P235TR1' AND werkstoff_no = '1.0254');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'S355J2H', '1.0570', 'St 52-3', 'alasimsiz', 's355j2h-1-0570',
       'Yuksek mukavemetli yapisal karbon celigi boru', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'S355J2H' AND werkstoff_no = '1.0570');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'P235GH', '1.0345', 'St 35.8/III', 'alasimsiz', 'p235gh-1-0345',
       'Sicakliga dayanikli kazan boru celigi - endustride en yaygin', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P235GH' AND werkstoff_no = '1.0345');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'P265GH', '1.0425', 'St 45.8/III', 'alasimsiz', 'p265gh-1-0425',
       'P235GH ust sinifi, daha yuksek mukavemet', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P265GH' AND werkstoff_no = '1.0425');

-- ---------------------------------------------------------------------
-- ALASIMLI - SICAGA DAYANAKLI (CrMo serisi, kazan/petrokimya)
-- ---------------------------------------------------------------------

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, sektor_notu, dogrulama_durumu)
SELECT '16Mo3', '1.5415', 'sicaga_dayanakli', '16mo3-1-5415',
       'Dusuk alasimli sicaga dayanakli celik (Mo katkili)',
       'Buhar kazanlari ve dusuk basincli sicaklik hatlarinda.', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = '16Mo3' AND werkstoff_no = '1.5415');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT '13CrMo4-5', '1.7335', 'sicaga_dayanakli', '13crmo4-5-1-7335',
       'Cr-Mo alasimli orta sicaklik kazan boru', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = '13CrMo4-5' AND werkstoff_no = '1.7335');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT '10CrMo9-10', '1.7380', 'sicaga_dayanakli', '10crmo9-10-1-7380',
       'Yuksek Cr-Mo, yuksek sicaklik petrokimya boru', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = '10CrMo9-10' AND werkstoff_no = '1.7380');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT '12CrMo19-5', '1.7362', 'sicaga_dayanakli', '12crmo19-5-1-7362',
       'Yuksek krom Cr-Mo celik, cok yuksek sicaklik', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = '12CrMo19-5' AND werkstoff_no = '1.7362');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X10CrMoVNb9-1', '1.4903', 'sicaga_dayanakli', 'x10crmovnb9-1-1-4903',
       'P91 sinifi, ultra yuksek sicaklik modern kazan celigi', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X10CrMoVNb9-1' AND werkstoff_no = '1.4903');

-- ---------------------------------------------------------------------
-- SOGUK CEKME - DUSUK SICAKLIK (LNG, kriyojenik)
-- ---------------------------------------------------------------------

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT '10 Ni 14', '1.5637', NULL, 'dusuk_sicaklik', '10-ni-14-1-5637',
       'Nikel katkili dusuk sicaklik celik (kriyojenik)', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = '10 Ni 14' AND werkstoff_no = '1.5637');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'P215NL', '1.0451', NULL, 'dusuk_sicaklik', 'p215nl-1-0451',
       'Dusuk sicaklik servis celigi', 'dogrulama_bekliyor'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P215NL' AND werkstoff_no = '1.0451');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'P255QL', '1.0452', NULL, 'dusuk_sicaklik', 'p255ql-1-0452',
       'Yuksek mukavemetli dusuk sicaklik celik', 'dogrulama_bekliyor'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P255QL' AND werkstoff_no = '1.0452');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'P265NL', '1.0453', NULL, 'dusuk_sicaklik', 'p265nl-1-0453',
       'Dusuk sicaklik kazan/basinc celik', 'dogrulama_bekliyor'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P265NL' AND werkstoff_no = '1.0453');

-- ---------------------------------------------------------------------
-- INCE TANELI YAPI CELIGI (offshore, hat borulari)
-- ---------------------------------------------------------------------

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'P355N', '1.0486', 'StE 285', 'ince_taneli_yapi', 'p355n-1-0486',
       'Ince taneli yapi celik (X42 sinifi)', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P355N' AND werkstoff_no = '1.0486');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'P420N', '1.8902', 'StE 420', 'ince_taneli_yapi', 'p420n-1-8902',
       'Yuksek mukavemet ince taneli (X60 sinifi)', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P420N' AND werkstoff_no = '1.8902');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, eski_din_kodu, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'P460N', '1.6905', 'StE 460', 'ince_taneli_yapi', 'p460n-1-6905',
       'Cok yuksek mukavemet ince taneli (X70 sinifi)', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'P460N' AND werkstoff_no = '1.6905');

-- ---------------------------------------------------------------------
-- CELIK HAT BORULARI (API 5L Grade -- petrol/gaz iletim)
-- ---------------------------------------------------------------------

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, sektor_notu, dogrulama_durumu)
SELECT 'L245NB', NULL, 'hat_borusu', 'l245nb',
       'API 5L Grade B karsiligi - orta basinc gaz/petrol hatti',
       'EN ISO 3183 standart kodu.', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'L245NB');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'L290NB', NULL, 'hat_borusu', 'l290nb',
       'API 5L Grade X42 karsiligi', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'L290NB');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'L360NB', NULL, 'hat_borusu', 'l360nb',
       'API 5L Grade X52 karsiligi', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'L360NB');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'L415NB', NULL, 'hat_borusu', 'l415nb',
       'API 5L Grade X60 karsiligi', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'L415NB');

-- ---------------------------------------------------------------------
-- PASLANMAZ CELIK (ostenitik, A 312/A 182/A 403 serileri)
-- ---------------------------------------------------------------------

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, sektor_notu, dogrulama_durumu)
SELECT 'X 5 CrNi 18-10', '1.4301', 'paslanmaz', 'x-5-crni-18-10-1-4301',
       'Paslanmaz celiklerin krali: 304 sinifi',
       'Endustride en yaygin paslanmaz celik. Gida, kimya, mimari.', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 5 CrNi 18-10' AND werkstoff_no = '1.4301');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 2 CrNi 19-11', '1.4306', 'paslanmaz', 'x-2-crni-19-11-1-4306',
       'Dusuk karbonlu 304L sinifi - kaynak sonrasi korozyon direncli', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 2 CrNi 19-11' AND werkstoff_no = '1.4306');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 2 CrNi 18-9', '1.4307', 'paslanmaz', 'x-2-crni-18-9-1-4307',
       '304L modern Avrupa karsiligi', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 2 CrNi 18-9' AND werkstoff_no = '1.4307');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, sektor_notu, dogrulama_durumu)
SELECT 'X 5 CrNiMo 17-12-2', '1.4401', 'paslanmaz', 'x-5-crnimo-17-12-2-1-4401',
       '316 sinifi - molibden katkili asit direncli',
       'Deniz ortami, klorlu ortam, kimya endustrisi.', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 5 CrNiMo 17-12-2' AND werkstoff_no = '1.4401');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 2 CrNiMo 17-13-2', '1.4404', 'paslanmaz', 'x-2-crnimo-17-13-2-1-4404',
       '316L sinifi - dusuk karbonlu, kaynak islerinde tercih', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 2 CrNiMo 17-13-2' AND werkstoff_no = '1.4404');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 2 CrNiMo 18-14-3', '1.4435', 'paslanmaz', 'x-2-crnimo-18-14-3-1-4435',
       '316L ust sinifi, daha yuksek Mo (3 yuzde)', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 2 CrNiMo 18-14-3' AND werkstoff_no = '1.4435');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 5 CrNiMo 17-13-3', '1.4436', 'paslanmaz', 'x-5-crnimo-17-13-3-1-4436',
       '316 ust sinifi, 3 yuzde Mo', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 5 CrNiMo 17-13-3' AND werkstoff_no = '1.4436');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 6 CrNiTi 18-10', '1.4541', 'paslanmaz', 'x-6-crniti-18-10-1-4541',
       '321 sinifi - Ti stabilize, yuksek sicaklik (>500C)', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 6 CrNiTi 18-10' AND werkstoff_no = '1.4541');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 6 CrNiNb 18-10', '1.4550', 'paslanmaz', 'x-6-crninb-18-10-1-4550',
       '347 sinifi - Nb stabilize, yuksek sicaklik', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 6 CrNiNb 18-10' AND werkstoff_no = '1.4550');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 6 CrNiMoTi 17-12-2', '1.4571', 'paslanmaz', 'x-6-crnimoti-17-12-2-1-4571',
       '316Ti sinifi - Ti stabilize 316', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 6 CrNiMoTi 17-12-2' AND werkstoff_no = '1.4571');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 2 CrNiMoN 17-13-3', '1.4429', 'paslanmaz', 'x-2-crnimon-17-13-3-1-4429',
       '316LN - N katkili dusuk karbonlu', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 2 CrNiMoN 17-13-3' AND werkstoff_no = '1.4429');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 2 CrNiMoN 17-13-5', '1.4439', 'paslanmaz', 'x-2-crnimon-17-13-5-1-4439',
       '317L - yuksek Mo (4-5 yuzde), klor ortam', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 2 CrNiMoN 17-13-5' AND werkstoff_no = '1.4439');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 1 NiCrMoCu 25-20-5', '1.4539', 'paslanmaz', 'x-1-nicrmocu-25-20-5-1-4539',
       '904L - super-ostenitik, sulfurik asit direncli', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 1 NiCrMoCu 25-20-5' AND werkstoff_no = '1.4539');

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, dogrulama_durumu)
SELECT 'X 1 NiCrMoCuN 25-20-7', '1.4529', 'paslanmaz', 'x-1-nicrmocun-25-20-7-1-4529',
       '20Mo-6 / N08926 - 904L ust sinifi', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 1 NiCrMoCuN 25-20-7' AND werkstoff_no = '1.4529');

-- ---------------------------------------------------------------------
-- DUPLEX (ostenitik-ferritik, deniz/offshore)
-- ---------------------------------------------------------------------

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, sektor_notu, dogrulama_durumu)
SELECT 'X 2 CrNiMoN 22-5-3', '1.4462', 'duplex', 'x-2-crnimon-22-5-3-1-4462',
       '2205 / S31803 - Duplex paslanmaz, deniz ortami',
       'Tuzlu su, klorit, sulfurik asit gibi agresif ortamlar.', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 2 CrNiMoN 22-5-3' AND werkstoff_no = '1.4462');

-- ---------------------------------------------------------------------
-- SUPERDUPLEX (deniz alti, kritik offshore)
-- ---------------------------------------------------------------------

INSERT INTO endustri_malzemeler (en_kodu, werkstoff_no, malzeme_grubu, slug, hub_aciklama, sektor_notu, dogrulama_durumu)
SELECT 'X 2 CrNiMoN 25-7-4', '1.4410', 'superduplex', 'x-2-crnimon-25-7-4-1-4410',
       '2507 / S32750 - Superduplex, en zorlu deniz uygulamalari',
       'Deniz alti boru hatlari, kimyasal tanker, kagit-kimya.', 'dogrulandi'
WHERE NOT EXISTS (SELECT 1 FROM endustri_malzemeler WHERE en_kodu = 'X 2 CrNiMoN 25-7-4' AND werkstoff_no = '1.4410');

-- =====================================================================
-- B3. Form-ASTM Eslemeleri (~78 satir)
-- =====================================================================
-- Pattern: malzeme_id, urun_formu, astm_kodu (ve opsiyonel astm_grade, uns_kodu)
-- MILFIT kartinda '-' olan satirlar EKLENMEZ.
-- ---------------------------------------------------------------------

-- BORULAR -- Alasimsiz (A 53/A 106)
INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 53 Grade A', 'A'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P235TR1'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 53 Grade A');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 106 Grade A', 'A'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P235GH'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 106 Grade A');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 106 Grade B', 'B'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P265GH'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 106 Grade B');

-- BORULAR -- Sicaga Dayanakli (A 335 Grade Pxx)
INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 335 Grade P1', 'P1'
FROM endustri_malzemeler m WHERE m.en_kodu = '16Mo3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 335 Grade P1');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 335 Grade P11', 'P11'
FROM endustri_malzemeler m WHERE m.en_kodu = '13CrMo4-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 335 Grade P11');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 335 Grade P12', 'P12'
FROM endustri_malzemeler m WHERE m.en_kodu = '13CrMo4-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 335 Grade P12');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 335 Grade P22', 'P22'
FROM endustri_malzemeler m WHERE m.en_kodu = '10CrMo9-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 335 Grade P22');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 335 Grade P5', 'P5'
FROM endustri_malzemeler m WHERE m.en_kodu = '12CrMo19-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 335 Grade P5');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 335 Grade P91', 'P91'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X10CrMoVNb9-1'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 335 Grade P91');

-- BORULAR -- Dusuk Sicaklik (A 333 Grade)
INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 333 Grade 6', '6'
FROM endustri_malzemeler m WHERE m.en_kodu = '10 Ni 14'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 333 Grade 6');

-- BORULAR -- Hat (API 5L Grade)
INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'API 5L Grade B', 'B'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L245NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'API 5L Grade B');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'API 5L Grade X42', 'X42'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L290NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'API 5L Grade X42');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'API 5L Grade X52', 'X52'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L360NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'API 5L Grade X52');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'API 5L Grade X60', 'X60'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L415NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'API 5L Grade X60');

-- BORULAR -- Ince Taneli (API 5L Grade)
INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'API 5L Grade X42', 'X42'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P355N'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'API 5L Grade X42');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'API 5L Grade X60', 'X60'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P420N'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'API 5L Grade X60');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'API 5L Grade X70', 'X70'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P460N'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'API 5L Grade X70');

-- BORULAR -- Paslanmaz (A 312 Grade TPxxx)
INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP304', 'TP304'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 5 CrNi 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP304');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP304L', 'TP304L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNi 18-9'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP304L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP304L', 'TP304L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNi 19-11'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP304L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP316', 'TP316'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 5 CrNiMo 17-12-2'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP316');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP316L', 'TP316L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMo 17-13-2'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP316L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP316L', 'TP316L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMo 18-14-3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP316L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP316', 'TP316'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 5 CrNiMo 17-13-3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP316');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP316LN', 'TP316LN'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 17-13-3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP316LN');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP317L', 'TP317L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 17-13-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP317L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP321', 'TP321'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 6 CrNiTi 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP321');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP347', 'TP347'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 6 CrNiNb 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP347');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'boru', 'A 312 Grade TP316Ti', 'TP316Ti'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 6 CrNiMoTi 17-12-2'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade TP316Ti');

-- BORULAR -- Super-ostenitik / Duplex / Superduplex (UNS no)
INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'boru', 'A 312 Grade F904L', 'F904L', 'UNS N08904'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 1 NiCrMoCu 25-20-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'A 312 Grade F904L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'boru', 'UNS N08926', NULL, 'UNS N08926'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 1 NiCrMoCuN 25-20-7'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'UNS N08926');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'boru', 'UNS S31803', NULL, 'UNS S31803'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 22-5-3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'UNS S31803');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'boru', 'UNS S32750', NULL, 'UNS S32750'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 25-7-4'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'boru' AND astm_kodu = 'UNS S32750');

-- ---------------------------------------------------------------------
-- FLANSLAR (A 105/A 182 Grade Fxxx, A 350, A 694)
-- ---------------------------------------------------------------------

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 105', '105'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P265GH'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 105');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F1', 'F1'
FROM endustri_malzemeler m WHERE m.en_kodu = '16Mo3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F1');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F11', 'F11'
FROM endustri_malzemeler m WHERE m.en_kodu = '13CrMo4-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F11');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F12', 'F12'
FROM endustri_malzemeler m WHERE m.en_kodu = '13CrMo4-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F12');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F22', 'F22'
FROM endustri_malzemeler m WHERE m.en_kodu = '10CrMo9-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F22');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F5', 'F5'
FROM endustri_malzemeler m WHERE m.en_kodu = '12CrMo19-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F5');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F91', 'F91'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X10CrMoVNb9-1'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F91');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 350 Grade LF3', 'LF3'
FROM endustri_malzemeler m WHERE m.en_kodu = '10 Ni 14'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 350 Grade LF3');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 694 Grade F42', 'F42'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L290NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 694 Grade F42');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 694 Grade F52', 'F52'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L360NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 694 Grade F52');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 694 Grade F60', 'F60'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L415NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 694 Grade F60');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F304', 'F304'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 5 CrNi 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F304');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F304L', 'F304L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNi 18-9'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F304L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F316', 'F316'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 5 CrNiMo 17-12-2'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F316');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F316L', 'F316L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMo 17-13-2'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F316L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F316LN', 'F316LN'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 17-13-3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F316LN');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F321', 'F321'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 6 CrNiTi 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F321');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F347', 'F347'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 6 CrNiNb 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F347');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'flans', 'A 182 Grade F316Ti', 'F316Ti'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 6 CrNiMoTi 17-12-2'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F316Ti');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'flans', 'A 182 Grade F904L', 'F904L', 'UNS N08904'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 1 NiCrMoCu 25-20-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F904L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'flans', 'A 182 Grade F51', 'F51', 'UNS S31803'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 22-5-3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F51');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'flans', 'A 182 Grade F53', 'F53', 'UNS S32750'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 25-7-4'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'flans' AND astm_kodu = 'A 182 Grade F53');

-- ---------------------------------------------------------------------
-- FITTINGLER (A 234/A 403/A 420/A 860 Grade WPxx)
-- ---------------------------------------------------------------------

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 234 Grade WPA', 'WPA'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P235GH'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 234 Grade WPA');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 234 Grade WPB', 'WPB'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P265GH'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 234 Grade WPB');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 234 Grade WP1', 'WP1'
FROM endustri_malzemeler m WHERE m.en_kodu = '16Mo3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 234 Grade WP1');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 234 Grade WP11', 'WP11'
FROM endustri_malzemeler m WHERE m.en_kodu = '13CrMo4-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 234 Grade WP11');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 234 Grade WP12', 'WP12'
FROM endustri_malzemeler m WHERE m.en_kodu = '13CrMo4-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 234 Grade WP12');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 234 Grade WP22', 'WP22'
FROM endustri_malzemeler m WHERE m.en_kodu = '10CrMo9-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 234 Grade WP22');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 234 Grade WP5', 'WP5'
FROM endustri_malzemeler m WHERE m.en_kodu = '12CrMo19-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 234 Grade WP5');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 234 Grade WP91', 'WP91'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X10CrMoVNb9-1'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 234 Grade WP91');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 420 Grade WPL3', 'WPL3'
FROM endustri_malzemeler m WHERE m.en_kodu = '10 Ni 14'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 420 Grade WPL3');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 420 Grade WPL6', 'WPL6'
FROM endustri_malzemeler m WHERE m.en_kodu = 'P265NL'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 420 Grade WPL6');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 860 Grade WPHY42', 'WPHY42'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L290NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 860 Grade WPHY42');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 860 Grade WPHY52', 'WPHY52'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L360NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 860 Grade WPHY52');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 860 Grade WPHY60', 'WPHY60'
FROM endustri_malzemeler m WHERE m.en_kodu = 'L415NB'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 860 Grade WPHY60');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 403 Grade WP304', 'WP304'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 5 CrNi 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 403 Grade WP304');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 403 Grade WP304L', 'WP304L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNi 18-9'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 403 Grade WP304L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 403 Grade WP316', 'WP316'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 5 CrNiMo 17-12-2'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 403 Grade WP316');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 403 Grade WP316L', 'WP316L'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMo 17-13-2'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 403 Grade WP316L');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 403 Grade WP316LN', 'WP316LN'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 17-13-3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 403 Grade WP316LN');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 403 Grade WP321', 'WP321'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 6 CrNiTi 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 403 Grade WP321');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade)
SELECT m.id, 'fitting', 'A 403 Grade WP347', 'WP347'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 6 CrNiNb 18-10'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'A 403 Grade WP347');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'fitting', 'UNS N08904', NULL, 'UNS N08904'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 1 NiCrMoCu 25-20-5'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'UNS N08904');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'fitting', 'UNS S31803', NULL, 'UNS S31803'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 22-5-3'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'UNS S31803');

INSERT INTO endustri_form_astm (malzeme_id, urun_formu, astm_kodu, astm_grade, uns_kodu)
SELECT m.id, 'fitting', 'UNS S32750', NULL, 'UNS S32750'
FROM endustri_malzemeler m WHERE m.en_kodu = 'X 2 CrNiMoN 25-7-4'
AND NOT EXISTS (SELECT 1 FROM endustri_form_astm WHERE malzeme_id = m.id AND urun_formu = 'fitting' AND astm_kodu = 'UNS S32750');

-- =====================================================================
-- DOGRULAMA SORGULARI (sonunda calisir, ciktiyi yapistir)
-- =====================================================================

SELECT 'endustri_urun_formlari' AS tablo, COUNT(*) AS satir FROM endustri_urun_formlari
UNION ALL SELECT 'endustri_malzemeler', COUNT(*) FROM endustri_malzemeler
UNION ALL SELECT 'endustri_form_astm', COUNT(*) FROM endustri_form_astm;
-- Beklenen: 4 / 36 / 78
