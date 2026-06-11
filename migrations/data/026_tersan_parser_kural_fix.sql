-- Migration 026 — Tersan parser_kural duzeltmeleri (50. oturum)
--
-- Migration 025 ile yazilan parser_kural'da 3 bug tespit edildi (lokal test):
-- 1. et_mm regex greedy okuyor (4.55 yerine 4.5 olmali)
-- 2. proje_kodu post_processing 'B1110'i 'NBB1110' yapiyor (cift NB)
-- 3. malzeme tablosu pattern'leri PDF text yapisina uymuyor (0 satir cikiyor)
--
-- Bu migration UPDATE ile sadece degisen kismilari yeniler.
-- Tek bir UPDATE statement, atomik.

UPDATE izometri_format_tanimlari
SET 
  parser_kural = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              parser_kural,
              -- 1. et_mm regex sinirli (et = X.X formati, boy = 3-5 hane integer)
              '{alanlar,et_mm}',
              jsonb_build_object(
                'kaynak', 'metin',
                'regex', '(\d+(?:\.\d+)?)x(\d\.\d)(\d{3,5})',
                'grup', 2,
                'tip', 'float',
                'aciklama', '60.3x4.55950 -> et = 4.5 (boy 5950 ayri)',
                'zorunlu', false
              )
            ),
            -- 2. cap_mm benzer (et yapismasin)
            '{alanlar,cap_mm}',
            jsonb_build_object(
              'kaynak', 'metin',
              'regex', '(\d+(?:\.\d+)?)x(\d\.\d)(\d{3,5})',
              'grup', 1,
              'tip', 'float',
              'aciklama', '60.3x4.55950 -> dis cap = 60.3',
              'zorunlu', false
            )
          ),
          -- 3. proje_kodu regex sadece sayiyi yakalar, format_template prefix ekler
          '{alanlar,proje_kodu}',
          jsonb_build_object(
            'kaynak', 'metin',
            'regex', '\b(?:NB|B)(\d{4})\b',
            'grup', 1,
            'format_template', 'NB{n}',
            'zorunlu', false,
            'aciklama', 'Tersan PDF B1110 yazar, dogrusu NB1110. Sayiyi cikar, NB ekle.'
          )
        ),
        -- 4. boy_mm yeni alan (et_mm regex'inin 3. grubu)
        '{alanlar,boy_mm}',
        jsonb_build_object(
          'kaynak', 'metin',
          'regex', '(\d+(?:\.\d+)?)x(\d\.\d)(\d{3,5})',
          'grup', 3,
          'tip', 'int',
          'aciklama', '60.3x4.55950 -> boy = 5950 (mm)',
          'zorunlu', false
        )
      ),
      -- 5. Malzeme tablosu satir tipleri (yeni pattern'ler)
      '{malzeme_tablosu,satir_tipleri}',
      jsonb_build_array(
        jsonb_build_object(
          'ad', 'boru',
          'tetikleyici_regex', 'Boru\s*Dikişsiz|Boru\s*Kayna|Pipe\s*Seamless',
          'kategori', 'PIPES',
          'malzeme_default', 'Karbon Celik',
          'beklenen_alanlar', ARRAY['kod', 'tanim', 'cap_mm', 'et_mm', 'boy_mm', 'kalite', 'agirlik_kg'],
          'pattern', '^(\d+)(Boru.+?)(\d+\.\d+)x(\d+\.\d)(\d{3,5})\s*(ST\s?37|S235JR)(\d+\.\d+)$',
          'grup_haritasi', jsonb_build_object(
            'kod', 1,
            'tanim', 2,
            'dis_cap_mm', 3,
            'et_mm', 4,
            'boy_mm', 5,
            'kalite', 6,
            'agirlik_kg', 7
          ),
          'aciklama', '1Boru Dikişsiz Çelik 60.3x4.55950 ST3736.848 -> 7 alan'
        ),
        jsonb_build_object(
          'ad', 'fitting',
          'tetikleyici_regex', 'Bilezik|Sleeve|Elbow|Tee|Reducer|Cap|Flange',
          'kategori', 'FITTINGS',
          'malzeme_default', 'Karbon Celik',
          'beklenen_alanlar', ARRAY['kod', 'adet', 'tanim', 'dn', 'boy_mm', 'kalite', 'agirlik_kg'],
          'pattern', '^(\d+)(\d)(.+?)DN(\d+)\s+(\d+)(ST\s?37|S235JR)(\d+\.\d+)$',
          'grup_haritasi', jsonb_build_object(
            'kod', 1,
            'adet', 2,
            'tanim', 3,
            'dn', 4,
            'boy_mm', 5,
            'kalite', 6,
            'agirlik_kg', 7
          ),
          'aciklama', '21Ic Bilezik Detay ADN50 30ST372.48 -> 7 alan'
        ),
        jsonb_build_object(
          'ad', 'islem',
          'tetikleyici_regex', 'Victaulic|Groove|Kaynak|Welding|Test|Marking',
          'kategori', 'PROCESSES',
          'malzeme_default', NULL,
          'beklenen_alanlar', ARRAY['kod', 'adet', 'tanim', 'agirlik_kg'],
          'pattern', '^(\d+)(\d)(.+?)\s*(\d+(?:\.\d+)?)St\*0$',
          'grup_haritasi', jsonb_build_object(
            'kod', 1,
            'adet', 2,
            'tanim', 3,
            'agirlik_kg', 4
          ),
          'aciklama', '41Boru Ucuna Victaulic Groove DN50 OD:60 0.2St*0 -> 4 alan'
        )
      )
    ),
    -- 6. baslik_tetikleyici kaldirildi (PDF'te malzeme satirlari basliktan ONCE geliyor)
    '{malzeme_tablosu,baslik_tetikleyici}',
    'null'::jsonb
  ),
  guncelleme_at = NOW()
WHERE format_kodu = 'tersan_cadmatic_spool';

-- DOGRULAMA
-- SELECT jsonb_pretty(parser_kural -> 'alanlar' -> 'et_mm') FROM izometri_format_tanimlari WHERE format_kodu = 'tersan_cadmatic_spool';
-- SELECT jsonb_pretty(parser_kural -> 'malzeme_tablosu' -> 'satir_tipleri' -> 0) FROM izometri_format_tanimlari WHERE format_kodu = 'tersan_cadmatic_spool';
