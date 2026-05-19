-- migrations/083_dosya_isleme_kuyrugu_parse_sonuc.sql
-- 101. oturum (19 Mayıs 2026)
--
-- Wizard'a yüklenen Excel/PDF dokümanlarını parse eden endpoint'ler
-- (api/kuyruk-isle-excel.js, api/kuyruk-isle-izometri.js) sonuçlarını
-- kuyrukta JSONB olarak saklar. UI bu alanı okuyup kullanıcıya
-- öneri olarak gösterir, onay sonrası DB tablolarına (spooller,
-- spool_malzemeleri) INSERT yapar.
--
-- İçerik şeması (parser çıktısı):
-- {
--   sayfa_sayisi: int,
--   secilen: 'All',
--   seviye: 'L1' | 'L2' | 'fail',
--   guven: 0-95,
--   otomatik_insert_uygun: bool,    -- L1 + guven >= 70
--   manuel_onay_gerekli: bool,      -- diğer durumlar
--   kolon_haritasi: { alan: idx, ... },
--   satirlar: [{ pipeline_no, spool_no, malzeme, ... }],
--   sayfalar: [...]                  -- tüm sayfaların özeti
-- }
--
-- Yeni durum değerleri (text alan, enum değil):
--  'bekliyor'      → kuyrukta, henüz işlenmedi
--  'isleniyor'     → endpoint çalışıyor (lock için)
--  'oneri_hazir'   → L1 başarılı, kullanıcı onayını bekliyor
--  'manuel_onay'   → L2/düşük güven, kullanıcı kolonları eşlemeli
--  'tamamlandi'    → kullanıcı onayladı, DB'ye yazıldı
--  'hata'          → parse veya storage hatası
--
-- Idempotent: ADD COLUMN IF NOT EXISTS — birden çok çalıştırma güvenli.

BEGIN;

ALTER TABLE dosya_isleme_kuyrugu
  ADD COLUMN IF NOT EXISTS parse_sonuc JSONB;

COMMENT ON COLUMN dosya_isleme_kuyrugu.parse_sonuc IS
  'Parser çıktısı JSONB. Endpoint doldurur, UI okur. 101. oturum (Migration 083).';

-- Bekleyen excel-generic işlerini hızlı çekmek için index
CREATE INDEX IF NOT EXISTS idx_dosya_isleme_kuyrugu_parser_durum
  ON dosya_isleme_kuyrugu (parser, durum, oncelik DESC, olusturma ASC)
  WHERE durum = 'bekliyor';

COMMIT;
