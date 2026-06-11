-- Migration 025 — Tersan Cadmatic Spool parser_kural taslagi
-- Oturum: 50, Tarih: 1 Mayis 2026
-- Tersan M110 Imalat Resmi formatina parser_kural JSONB'sini yaz.
-- 3 ornek PDF'in (S08, S09, S10) ortak pattern'lerinden cikarildi.
-- Not: Bu migration'in 026 ile UPDATE edilmis hali Supabase'de.

UPDATE izometri_format_tanimlari
SET 
  parser_kural = jsonb_build_object(
    'schema_version', 1,
    'ekstraktor_tipi', 'regex_text',
    'min_metin_uzunlugu', 300,
    'spool_blok', jsonb_build_object(
      'yontem', 'tek_spool_per_pdf',
      'aciklama', 'Tersan formatinda her PDF tek bir spool.'
    ),
    'alanlar', jsonb_build_object(
      'spool_no', jsonb_build_object('kaynak', 'metin', 'regex', '-S(\d+)', 'grup', 1, 'format_template', 'S{n}', 'zorunlu', true),
      'pipeline_no', jsonb_build_object('kaynak', 'metin', 'regex', '-(G\d{3}-\d{3}-[A-Z0-9]+)', 'grup', 1, 'zorunlu', true),
      'tarih', jsonb_build_object('kaynak', 'metin', 'regex', '(\d{2}-\d{2}-\d{2})', 'grup', 1, 'format', 'DD-MM-YY', 'zorunlu', false),
      'agirlik_kg', jsonb_build_object('kaynak', 'metin', 'regex', '(\d+(?:\.\d+)?)\s*kg', 'grup', 1, 'tip', 'float', 'zorunlu', false),
      'yuzey', jsonb_build_object('kaynak', 'metin', 'regex', '\b(Galvaniz|Boya|Asit)\b', 'grup', 1, 'whitelist', ARRAY['Galvaniz','Boya','Asit'], 'fallback', 'Diger', 'zorunlu', false),
      'proje_kodu', jsonb_build_object('kaynak', 'metin', 'regex', '\b(NB\d{4}|B\d{4})\b', 'grup', 1, 'post_processing', jsonb_build_object('tip', 'prefix_garanti', 'prefix', 'NB'), 'zorunlu', false),
      'cizen', jsonb_build_object('kaynak', 'metin', 'regex', 'Galvaniz\s*\n([a-zA-Z]+)\s*\n\d+\(\d+\)', 'grup', 1, 'zorunlu', false),
      'sertifika', jsonb_build_object('kaynak', 'metin', 'regex', '(BV|DNV|LR|RINA|ABS)\s+Pipe\s+Class\s+([IVX]+)', 'gruplar', jsonb_build_object('kurum', 1, 'sinif', 2), 'zorunlu', false),
      'kalite', jsonb_build_object('kaynak', 'metin', 'regex', '(ST\s?37|S235JR|A106B|316L|304L|316|304)', 'grup', 1, 'whitelist', ARRAY['ST37','S235JR','A106B','316L','304L','316','304'], 'normalizasyon', 'kalite_kod_normalize', 'zorunlu', true),
      'dn', jsonb_build_object('kaynak', 'metin', 'regex', 'DN(\d+)', 'grup', 1, 'tip', 'int', 'zorunlu', true),
      'cap_mm', jsonb_build_object('kaynak', 'metin', 'regex', '(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)', 'grup', 1, 'tip', 'float', 'zorunlu', false),
      'et_mm', jsonb_build_object('kaynak', 'metin', 'regex', '(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)', 'grup', 2, 'tip', 'float', 'zorunlu', false)
    ),
    'malzeme_tablosu', jsonb_build_object(
      'aktif', true,
      'baslik_tetikleyici', 'Malzeme Listesi',
      'satir_tipleri', jsonb_build_array(
        jsonb_build_object('ad', 'boru', 'tetikleyici_regex', 'Boru\s+Dikişsiz|Boru\s+Kaynakli|Pipe\s+Seamless', 'kategori', 'PIPES', 'malzeme_default', 'Karbon Celik', 'pattern', '^(\d+)Boru\s+(.+?)(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(\d+)\s*(ST\s?37|S235JR)(\d+(?:\.\d+)?)$'),
        jsonb_build_object('ad', 'fitting', 'tetikleyici_regex', 'Bilezik|Sleeve|Elbow|Tee|Reducer|Cap|Flange', 'kategori', 'FITTINGS', 'malzeme_default', 'Karbon Celik', 'pattern', '^(\d+)(\d)(.+?)DN(\d+)\s+(\d+)(ST\s?37|S235JR)(\d+(?:\.\d+)?)$'),
        jsonb_build_object('ad', 'islem', 'tetikleyici_regex', 'Victaulic|Groove|Kaynak|Welding|Test|Marking', 'kategori', 'PROCESSES', 'malzeme_default', NULL, 'pattern', '^(\d+)(\d)(.+?)(\d+(?:\.\d+)?)St\*0$')
      )
    ),
    'kabul_kriterleri', jsonb_build_object(
      'zorunlu_alanlar', ARRAY['spool_no','pipeline_no','kalite','dn'],
      'min_overall_match_orani', 0.7,
      'min_malzeme_satir', 1,
      'l3_fallback_yapilir', true
    ),
    'metadata', jsonb_build_object(
      'olusturulma_kaynagi', 'manuel_pilot',
      'olusturulma_at', '2026-05-01',
      'olusturan_oturum', 50,
      'ornek_pdf_sayisi', 3,
      'ornek_dosyalar', ARRAY['G200-303-BS15 4(5).S08.1.pdf','G200-303-BS15 4(5).S09.1.pdf','G200-303-BS15 5(5).S10.1.pdf']
    )
  ),
  guncelleme_at = NOW()
WHERE format_kodu = 'tersan_cadmatic_spool';
