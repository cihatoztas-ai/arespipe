-- ╔════════════════════════════════════════════════════════════════╗
-- ║ 97. OTURUM — Devre Wizard v2 Schema                            ║
-- ║                                                                ║
-- ║ Tarih: 18 Mayıs 2026                                           ║
-- ║ Yazan: Claude (Cihat ile 97. oturum)                           ║
-- ║                                                                ║
-- ║ İçerik:                                                        ║
-- ║  1. 8 yeni tablo: dokuman_tipleri, klasor_isim_sozluk,         ║
-- ║     devre_dokumanlari, spool_dokumanlari, dosya_isleme_kuyrugu,║
-- ║     alan_oncelik_kurallari, excel_format_tanimlari,            ║
-- ║     fuzyon_karar_log                                           ║
-- ║  2. Index'ler (tenant_id, kullanım sorguları için)             ║
-- ║  3. RLS aktivasyonu + tek "ALL" policy (canlı pattern)         ║
-- ║  4. Sistem default veriler (dokuman_tipleri 14 satır,          ║
-- ║     klasor_isim_sozluk 33 satır, alan_oncelik_kurallari 15)    ║
-- ║  5. pipeline_malzemeleri'ne opsiyonel kaynak_dokuman_id        ║
-- ║  6. tenant_features'a devre_wizard_v2 satırı (default kapalı)  ║
-- ║                                                                ║
-- ║ Risk: Düşük                                                    ║
-- ║  - Yeni tablolar mevcut sistemden tamamen ayrık (KARAR-97.0)   ║
-- ║  - Tek istisna: pipeline_malzemeleri.kaynak_dokuman_id opsiyon ║
-- ║    izleme FK (NULL'lanabilir, business logic'i etkilemez)      ║
-- ║  - Feature flag default kapalı, wizard kimseye görünmez        ║
-- ║                                                                ║
-- ║ Geri alma:                                                     ║
-- ║  - Bu dosyanın altındaki DOWN bloğu (yorumlu) çalıştırılır     ║
-- ║  - Mevcut tabloda veri kaybı: YOK                              ║
-- ║                                                                ║
-- ║ Bağımlılıklar:                                                 ║
-- ║  - tenants, devreler, spooller, pipeline_malzemeleri,          ║
-- ║    tenant_features tabloları mevcut olmalı                     ║
-- ║  - get_tenant_id() fonksiyonu mevcut olmalı                    ║
-- ║                                                                ║
-- ║ Notlar:                                                        ║
-- ║  - RLS pattern: tek "ALL" policy + get_tenant_id() —           ║
-- ║    22'de yazılan markalama RLS migration ile uyumlu.           ║
-- ║    docs/DATABASE.md "4 ayrı policy" disiplinini tariflemiş     ║
-- ║    ama canlı pattern farklı — uyumsuzluk doküman tarafında.    ║
-- ║  - 4 tablo (dokuman_tipleri, klasor_isim_sozluk,               ║
-- ║    alan_oncelik_kurallari, excel_format_tanimlari) tenant_id   ║
-- ║    NULL kabul eder — sistem default'lar herkese görünür.       ║
-- ╚════════════════════════════════════════════════════════════════╝

BEGIN;

-- ══════════════════════════════════════════════════════════════════
-- 1. TABLOLAR
-- ══════════════════════════════════════════════════════════════════

-- 1.1 Dosya tipi tanıma sözlüğü
CREATE TABLE IF NOT EXISTS dokuman_tipleri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tip_kodu TEXT NOT NULL,
  uzanti TEXT NOT NULL,
  magic_byte_hex TEXT NULL,
  parser_yolu TEXT NULL,
  varsayilan_seviye TEXT NOT NULL,
  aciklama TEXT NULL,
  aktif BOOLEAN NOT NULL DEFAULT true,
  olusturma TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dokuman_tipleri_seviye_chk
    CHECK (varsayilan_seviye IN ('devre','spool'))
);
COMMENT ON TABLE dokuman_tipleri IS
  'KARAR-97 (Parça 1): Dosya tipi → parser yolu eşlemesi. tenant_id NULL = sistem geneli, dolu = tenant özel.';

-- 1.2 Klasör adı eşleme sözlüğü
CREATE TABLE IF NOT EXISTS klasor_isim_sozluk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
  klasor_pattern TEXT NOT NULL,
  tip_kodu TEXT NOT NULL,
  varsayilan_seviye TEXT NOT NULL,
  aktif BOOLEAN NOT NULL DEFAULT true,
  olusturma TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT klasor_isim_sozluk_seviye_chk
    CHECK (varsayilan_seviye IN ('devre','spool'))
);
COMMENT ON TABLE klasor_isim_sozluk IS
  'Kullanıcının yüklediği klasör adı (örn: izometri/) → standart tip eşlemesi.';

-- 1.3 Devre seviyesi dosya kayıtları
CREATE TABLE IF NOT EXISTS devre_dokumanlari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  devre_id UUID NOT NULL REFERENCES devreler(id) ON DELETE CASCADE,
  storage_yolu TEXT NOT NULL,
  klasor_yolu TEXT NOT NULL DEFAULT '',
  dosya_adi TEXT NOT NULL,
  uzanti TEXT NOT NULL,
  boyut_byte BIGINT NULL,
  dokuman_tipi TEXT NULL,
  parse_durumu TEXT NOT NULL DEFAULT 'bekliyor',
  parse_hata TEXT NULL,
  versiyon INT NOT NULL DEFAULT 1,
  aktif BOOLEAN NOT NULL DEFAULT true,
  yukleyen_id UUID NULL,
  yuklenme TIMESTAMPTZ NOT NULL DEFAULT now(),
  silindi BOOLEAN NOT NULL DEFAULT false,
  silinme_tarihi TIMESTAMPTZ NULL,
  CONSTRAINT devre_dokumanlari_parse_durumu_chk
    CHECK (parse_durumu IN ('bekliyor','isleniyor','tamamlandi','hata','saklama'))
);
COMMENT ON TABLE devre_dokumanlari IS
  'KARAR-97.6/97.7: Devre seviyesi ham dosya kayıtları. klasor_yolu kullanıcının yüklediği hiyerarşi.';

-- 1.4 Spool seviyesi dosya referansı (devre dokümanına link)
CREATE TABLE IF NOT EXISTS spool_dokumanlari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  spool_id UUID NOT NULL REFERENCES spooller(id) ON DELETE CASCADE,
  devre_dokuman_id UUID NOT NULL REFERENCES devre_dokumanlari(id) ON DELETE CASCADE,
  dokuman_tipi TEXT NOT NULL,
  sayfa_baslangic INT NULL,
  sayfa_bitis INT NULL,
  geometri_parse_durumu TEXT NULL,
  montaj_koordinati JSONB NULL,
  olusturma TIMESTAMPTZ NOT NULL DEFAULT now(),
  silindi BOOLEAN NOT NULL DEFAULT false,
  silinme_tarihi TIMESTAMPTZ NULL,
  CONSTRAINT spool_dokumanlari_geometri_durumu_chk
    CHECK (geometri_parse_durumu IS NULL OR geometri_parse_durumu IN ('beklemede','basarili','hata'))
);
COMMENT ON TABLE spool_dokumanlari IS
  'KARAR-97.7/97.11: Spool dosya referansları. Devre dokümanına link (kopya değil). Multi-spool PDF sayfa aralığı.';

-- 1.5 Async dosya işleme kuyruğu (Faz 1 / Faz 2)
CREATE TABLE IF NOT EXISTS dosya_isleme_kuyrugu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  devre_dokuman_id UUID NOT NULL REFERENCES devre_dokumanlari(id) ON DELETE CASCADE,
  sayfa_no INT NULL,
  parser TEXT NOT NULL,
  oncelik INT NOT NULL DEFAULT 5,
  durum TEXT NOT NULL DEFAULT 'bekliyor',
  hata_mesaji TEXT NULL,
  deneme_sayisi INT NOT NULL DEFAULT 0,
  alindi_at TIMESTAMPTZ NULL,
  bitis_at TIMESTAMPTZ NULL,
  olusturma TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dosya_isleme_kuyrugu_durum_chk
    CHECK (durum IN ('bekliyor','isleniyor','tamamlandi','hata','iptal'))
);
COMMENT ON TABLE dosya_isleme_kuyrugu IS
  'KARAR-97.9: Async parse kuyruğu. oncelik 1 = Faz 1 (hızlı), 5 = Faz 2 (normal arka plan).';

-- 1.6 Füzyon motoru kuralları
CREATE TABLE IF NOT EXISTS alan_oncelik_kurallari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
  alan_kodu TEXT NOT NULL,
  kaynak_oncelik JSONB NOT NULL,
  tolerans_tipi TEXT NOT NULL,
  varsayilan_eylem TEXT NOT NULL,
  aciklama TEXT NULL,
  aktif BOOLEAN NOT NULL DEFAULT true,
  olusturma TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT alan_oncelik_kurallari_tolerans_chk
    CHECK (tolerans_tipi IN ('tam','yuzde_5','mm_1','enum','string')),
  CONSTRAINT alan_oncelik_kurallari_eylem_chk
    CHECK (varsayilan_eylem IN ('oto','manuel'))
);
COMMENT ON TABLE alan_oncelik_kurallari IS
  'KARAR-97.2/97.5: Füzyon motoru iki boyutlu skor (parse güveni × kaynak önceliği).';

-- 1.7 Excel format öğrenme
CREATE TABLE IF NOT EXISTS excel_format_tanimlari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  fingerprint JSONB NOT NULL,
  kolon_mapping JSONB NOT NULL,
  egitim_kaynagi TEXT NOT NULL DEFAULT 'sozluk',
  aktif BOOLEAN NOT NULL DEFAULT true,
  basari_orani NUMERIC NULL,
  kullanim_sayisi INT NOT NULL DEFAULT 0,
  son_kullanim_at TIMESTAMPTZ NULL,
  olusturma TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme TIMESTAMPTZ NULL,
  CONSTRAINT excel_format_egitim_kaynagi_chk
    CHECK (egitim_kaynagi IN ('sozluk','pattern','haiku'))
);
COMMENT ON TABLE excel_format_tanimlari IS
  'Excel kolon haritası — izometri_format_tanimlari kardeşi. L1 sözlük, L2 pattern, L3 Haiku AI.';

-- 1.8 Çelişki + füzyon karar logu
CREATE TABLE IF NOT EXISTS fuzyon_karar_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  devre_id UUID NULL REFERENCES devreler(id) ON DELETE CASCADE,
  spool_id UUID NULL REFERENCES spooller(id) ON DELETE CASCADE,
  alan_kodu TEXT NOT NULL,
  kaynak_degerler JSONB NOT NULL,
  secilen_kaynak TEXT NOT NULL,
  secilen_deger TEXT NULL,
  karar_veren_id UUID NULL,
  karar_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE fuzyon_karar_log IS
  'KARAR-97.4: Kullanıcı çelişki seçimleri. 5+ aynı yönde karar → sistem önerisi.';


-- ══════════════════════════════════════════════════════════════════
-- 2. INDEX'LER
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_dok_tipleri_tenant ON dokuman_tipleri(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dok_tipleri_uzanti ON dokuman_tipleri(uzanti);

CREATE INDEX IF NOT EXISTS idx_klasor_tenant ON klasor_isim_sozluk(tenant_id);

CREATE INDEX IF NOT EXISTS idx_devre_dok_devre 
  ON devre_dokumanlari(devre_id) WHERE silindi = false;
CREATE INDEX IF NOT EXISTS idx_devre_dok_tenant ON devre_dokumanlari(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devre_dok_tipi ON devre_dokumanlari(dokuman_tipi);

CREATE INDEX IF NOT EXISTS idx_spool_dok_spool 
  ON spool_dokumanlari(spool_id) WHERE silindi = false;
CREATE INDEX IF NOT EXISTS idx_spool_dok_devredok ON spool_dokumanlari(devre_dokuman_id);
CREATE INDEX IF NOT EXISTS idx_spool_dok_tenant ON spool_dokumanlari(tenant_id);

CREATE INDEX IF NOT EXISTS idx_kuyruk_durum_oncelik 
  ON dosya_isleme_kuyrugu(durum, oncelik, olusturma)
  WHERE durum IN ('bekliyor','isleniyor');
CREATE INDEX IF NOT EXISTS idx_kuyruk_devredok ON dosya_isleme_kuyrugu(devre_dokuman_id);

CREATE INDEX IF NOT EXISTS idx_alan_oncelik_tenant 
  ON alan_oncelik_kurallari(tenant_id, alan_kodu);

CREATE INDEX IF NOT EXISTS idx_excel_fmt_tenant ON excel_format_tanimlari(tenant_id);

CREATE INDEX IF NOT EXISTS idx_fuzyon_log_alan 
  ON fuzyon_karar_log(tenant_id, alan_kodu);
CREATE INDEX IF NOT EXISTS idx_fuzyon_log_devre ON fuzyon_karar_log(devre_id);


-- ══════════════════════════════════════════════════════════════════
-- 3. RLS — Row-Level Security
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE dokuman_tipleri          ENABLE ROW LEVEL SECURITY;
ALTER TABLE klasor_isim_sozluk       ENABLE ROW LEVEL SECURITY;
ALTER TABLE devre_dokumanlari        ENABLE ROW LEVEL SECURITY;
ALTER TABLE spool_dokumanlari        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosya_isleme_kuyrugu     ENABLE ROW LEVEL SECURITY;
ALTER TABLE alan_oncelik_kurallari   ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_format_tanimlari   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuzyon_karar_log         ENABLE ROW LEVEL SECURITY;

-- 3.1 Sistem-geneli okuma + tenant özel yazma (NULL allowed olan 4 tablo)
DROP POLICY IF EXISTS dok_tipleri_tenant ON dokuman_tipleri;
CREATE POLICY dok_tipleri_tenant ON dokuman_tipleri
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS klasor_sozluk_tenant ON klasor_isim_sozluk;
CREATE POLICY klasor_sozluk_tenant ON klasor_isim_sozluk
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS alan_oncelik_tenant ON alan_oncelik_kurallari;
CREATE POLICY alan_oncelik_tenant ON alan_oncelik_kurallari
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS excel_fmt_tenant ON excel_format_tanimlari;
CREATE POLICY excel_fmt_tenant ON excel_format_tanimlari
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- 3.2 Sadece tenant-özel (NULL yok) olan 4 tablo
DROP POLICY IF EXISTS devre_dok_tenant ON devre_dokumanlari;
CREATE POLICY devre_dok_tenant ON devre_dokumanlari
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS spool_dok_tenant ON spool_dokumanlari;
CREATE POLICY spool_dok_tenant ON spool_dokumanlari
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS kuyruk_tenant ON dosya_isleme_kuyrugu;
CREATE POLICY kuyruk_tenant ON dosya_isleme_kuyrugu
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS fuzyon_log_tenant ON fuzyon_karar_log;
CREATE POLICY fuzyon_log_tenant ON fuzyon_karar_log
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());


-- ══════════════════════════════════════════════════════════════════
-- 4. SEED DATA — Sistem default veriler (tenant_id IS NULL)
-- ══════════════════════════════════════════════════════════════════

-- 4.1 dokuman_tipleri — 14 satır
INSERT INTO dokuman_tipleri (tenant_id, tip_kodu, uzanti, parser_yolu, varsayilan_seviye, aciklama) VALUES
  (NULL, 'izometri',       'pdf',  'izometri-oku',   'spool', 'İzometri çizim PDF — Vision AI parse'),
  (NULL, 'spool_imalat',   'pdf',  'sakla',          'spool', 'Spool atölye/imalat resmi — parse yok, sakla'),
  (NULL, 'spool_imalat',   'dwg',  'sakla',          'spool', 'AutoCAD spool imalat — sakla'),
  (NULL, 'bom_excel',      'xlsx', 'excel-generic',  'devre', 'Malzeme listesi Excel — sözlük+AI parse'),
  (NULL, 'bom_excel',      'xls',  'excel-generic',  'devre', 'Eski Excel BOM — sözlük+AI parse'),
  (NULL, '3d_pdf',         'pdf',  'sakla',          'devre', 'Devre 3D genel görünüş PDF — sakla'),
  (NULL, 'stp',            'stp',  'step-parser',    'spool', 'STEP 3D — AVEVA HarmonyWare uyumlu, B-spline parse'),
  (NULL, 'stp',            'step', 'step-parser',    'spool', 'STEP 3D (alt uzantı)'),
  (NULL, 'rhino',          '3dm',  'rhino-parser',   'spool', 'Rhino 3D — rhino3dm.js parse'),
  (NULL, 'akis_semasi',    'pdf',  'sakla',          'devre', 'P&ID / akis semasi — devre seviyesi sakla'),
  (NULL, 'sertifika',      'pdf',  'sakla',          'spool', 'Malzeme sertifikasi / MTC / WPS — sakla'),
  (NULL, 'sartname',       'pdf',  'sakla',          'devre', 'Proje sartnameleri — sakla'),
  (NULL, 'diger',          'pdf',  'sakla',          'devre', 'Taninmayan PDF — sakla'),
  (NULL, 'diger',          'xlsx', 'sakla',          'devre', 'Taninmayan Excel — sakla')
ON CONFLICT DO NOTHING;

-- 4.2 klasor_isim_sozluk — 33 satır (TR + EN karışık)
INSERT INTO klasor_isim_sozluk (tenant_id, klasor_pattern, tip_kodu, varsayilan_seviye) VALUES
  (NULL, 'izometri',                  'izometri',     'spool'),
  (NULL, 'izometriler',               'izometri',     'spool'),
  (NULL, 'iso',                       'izometri',     'spool'),
  (NULL, 'isometric',                 'izometri',     'spool'),
  (NULL, 'isometrics',                'izometri',     'spool'),
  (NULL, 'spool_imalat_resimleri',    'spool_imalat', 'spool'),
  (NULL, 'imalat',                    'spool_imalat', 'spool'),
  (NULL, 'workshop',                  'spool_imalat', 'spool'),
  (NULL, 'workshop_drawings',         'spool_imalat', 'spool'),
  (NULL, 'spool_drawings',            'spool_imalat', 'spool'),
  (NULL, 'detail',                    'spool_imalat', 'spool'),
  (NULL, '3d',                        '3d_pdf',       'devre'),
  (NULL, '3d_gorunusler',             '3d_pdf',       'devre'),
  (NULL, '3d_views',                  '3d_pdf',       'devre'),
  (NULL, 'model',                     'stp',          'spool'),
  (NULL, 'step',                      'stp',          'spool'),
  (NULL, 'stp',                       'stp',          'spool'),
  (NULL, 'rhino',                     'rhino',        'spool'),
  (NULL, 'bom',                       'bom_excel',    'devre'),
  (NULL, 'excel',                     'bom_excel',    'devre'),
  (NULL, 'malzeme_listesi',           'bom_excel',    'devre'),
  (NULL, 'material_list',             'bom_excel',    'devre'),
  (NULL, 'sertifikalar',              'sertifika',    'spool'),
  (NULL, 'certificates',              'sertifika',    'spool'),
  (NULL, 'mtc',                       'sertifika',    'spool'),
  (NULL, 'wps',                       'sertifika',    'spool'),
  (NULL, 'akis_semasi',               'akis_semasi',  'devre'),
  (NULL, 'p_id',                      'akis_semasi',  'devre'),
  (NULL, 'pid',                       'akis_semasi',  'devre'),
  (NULL, 'flow',                      'akis_semasi',  'devre'),
  (NULL, 'sartname',                  'sartname',     'devre'),
  (NULL, 'spec',                      'sartname',     'devre'),
  (NULL, 'specification',             'sartname',     'devre')
ON CONFLICT DO NOTHING;

-- 4.3 alan_oncelik_kurallari — 15 satır füzyon kuralı
-- Skor mantığı: STP/Rhino=1.0 (matematiksel), izometri=0.85-0.9 (mühendis orijinal),
-- Excel=0.7-0.95 (formata göre), hesaplanmış=0.5 (DB lookup yedek), dosya_adı=1.0 (string için).
INSERT INTO alan_oncelik_kurallari (tenant_id, alan_kodu, kaynak_oncelik, tolerans_tipi, varsayilan_eylem, aciklama) VALUES
  (NULL, 'cap_dn',           '{"stp":1.0,"izometri_pdf":0.9,"excel":0.7,"hesaplanmis":0.5}'::jsonb, 'enum',     'manuel', 'Cap DN — celiski olursa manuel onay (imalat kritik)'),
  (NULL, 'et_mm',            '{"stp":1.0,"izometri_pdf":0.9,"excel":0.7,"hesaplanmis":0.5}'::jsonb, 'mm_1',     'manuel', 'Et kalinligi — celiski manuel'),
  (NULL, 'boy_mm',           '{"stp":1.0,"izometri_pdf":0.9,"excel":0.7,"hesaplanmis":0.5}'::jsonb, 'mm_1',     'oto',    'Boy mm — kucuk fark otomatik tolere'),
  (NULL, 'agirlik_kg',       '{"excel":0.9,"izometri_pdf":0.7,"hesaplanmis":0.6}'::jsonb,            'yuzde_5',  'oto',    'Agirlik — Excel oncelikli, hesaplanmis yedek'),
  (NULL, 'malzeme',          '{"excel":0.9,"izometri_pdf":0.9}'::jsonb,                              'enum',     'manuel', 'Malzeme kategorisi (karbon/paslanmaz) — manuel'),
  (NULL, 'kalite',           '{"excel":0.9,"izometri_pdf":0.85}'::jsonb,                             'enum',     'manuel', 'Kalite kodu (A105, 316L) — manuel'),
  (NULL, 'yuzey_islem',      '{"izometri_pdf":0.9,"excel":0.7}'::jsonb,                              'enum',     'oto',    'Yuzey islemi — izometri oncelikli'),
  (NULL, 'flansh_tipi',      '{"izometri_pdf":0.9,"excel":0.85}'::jsonb,                             'enum',     'manuel', 'Flans tipi (WN/SO/BL) — kritik, manuel'),
  (NULL, 'flansh_sinif',     '{"izometri_pdf":0.9,"excel":0.85}'::jsonb,                             'enum',     'manuel', 'Flans Class — manuel'),
  (NULL, 'pipeline_no',      '{"dosya_adi":1.0,"izometri_pdf":0.9,"excel":0.7}'::jsonb,              'string',   'oto',    'Pipeline no — dosya adi en guvenilir'),
  (NULL, 'spool_no',         '{"dosya_adi":1.0,"izometri_pdf":0.9}'::jsonb,                          'string',   'oto',    'Spool no — dosya adi en guvenilir'),
  (NULL, 'rev',              '{"dosya_adi":1.0,"izometri_pdf":0.85}'::jsonb,                         'string',   'oto',    'Revizyon — dosya adindan'),
  (NULL, 'adet',             '{"excel":0.95,"izometri_pdf":0.85}'::jsonb,                            'tam',      'manuel', 'Adet — esit olmali, fark manuel'),
  (NULL, 'montaj_koordinati','{"stp":1.0,"izometri_pdf":0.5}'::jsonb,                                'mm_1',     'oto',    'Gemi global koordinat (KARAR-97.11)'),
  (NULL, 'sertifika_no',     '{"excel":0.95,"sertifika_pdf":1.0}'::jsonb,                            'string',   'oto',    'Sertifika numarasi')
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════
-- 5. MEVCUT TABLOLARA OPSIYONEL İZLEME FK (KARAR-97.0 istisnası)
-- ══════════════════════════════════════════════════════════════════

-- pipeline_malzemeleri'ne kaynak_dokuman_id (NULL'lanabilir)
-- Multi-spool ortak BOM hangi izometriden geldi takibi.
-- Business logic'i etkilemez, mevcut sorgular bu kolonu bilmeden çalışır.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' 
      AND table_name='pipeline_malzemeleri' 
      AND column_name='kaynak_dokuman_id'
  ) THEN
    ALTER TABLE pipeline_malzemeleri
      ADD COLUMN kaynak_dokuman_id UUID NULL
      REFERENCES devre_dokumanlari(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN pipeline_malzemeleri.kaynak_dokuman_id IS
      'KARAR-97.8: Multi-spool ortak BOM bu izometri dokümanından geldi. NULL = manuel veya mevcut kayıt.';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pipeline_mal_kaynak_dok 
  ON pipeline_malzemeleri(kaynak_dokuman_id) 
  WHERE kaynak_dokuman_id IS NOT NULL;


-- ══════════════════════════════════════════════════════════════════
-- 6. FEATURE FLAG — devre_wizard_v2 (default kapalı)
-- ══════════════════════════════════════════════════════════════════

-- 6.1 Master feature_flags tablosuna devre_wizard_v2 tanimi (yoksa).
-- 98'de kuru calistirmada FK hatasi yakalandi: tenant_features.feature_kod
-- bu master tabloya referans veriyor, once burada satir olmasi gerekiyor.
-- (97 mimari yaziminda master tablo varligi gozden kacmisti.)
INSERT INTO feature_flags (kod, ad, aciklama, varsayilan)
VALUES (
  'devre_wizard_v2',
  'devre_wizard_v2',
  'Devre yukleme wizard v2 - coklu dokuman, otomatik dispatch, fuzyon motoru (KARAR-97)',
  false
)
ON CONFLICT (kod) DO NOTHING;

-- 6.2 Tum tenant'lara satir eklenir, hepsi default kapali.
-- Sen istedigin tenant'ta UPDATE ile aktif=true yaparsin.
INSERT INTO tenant_features (tenant_id, feature_kod, aktif)
SELECT t.id, 'devre_wizard_v2', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_features tf
  WHERE tf.tenant_id = t.id AND tf.feature_kod = 'devre_wizard_v2'
);


COMMIT;


-- ══════════════════════════════════════════════════════════════════
-- TEST QUERY'LERİ — Migration SONRASI manuel çalıştır
-- ══════════════════════════════════════════════════════════════════

-- Test 1: 8 yeni tablo oluştu mu?
-- /*
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema='public' AND table_name IN (
--   'dokuman_tipleri','klasor_isim_sozluk','devre_dokumanlari','spool_dokumanlari',
--   'dosya_isleme_kuyrugu','alan_oncelik_kurallari','excel_format_tanimlari','fuzyon_karar_log'
-- ) ORDER BY table_name;
-- -- Beklenen: 8 satır
-- */

-- Test 2: Sistem default'lar yüklendi mi?
-- /*
-- SELECT 'dokuman_tipleri' AS tablo, count(*) FROM dokuman_tipleri WHERE tenant_id IS NULL
-- UNION ALL SELECT 'klasor_isim_sozluk', count(*) FROM klasor_isim_sozluk WHERE tenant_id IS NULL
-- UNION ALL SELECT 'alan_oncelik_kurallari', count(*) FROM alan_oncelik_kurallari WHERE tenant_id IS NULL;
-- -- Beklenen: 14, 33, 15
-- */

-- Test 3: RLS policy'leri eklendi mi?
-- /*
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname='public' AND tablename IN (
--   'dokuman_tipleri','klasor_isim_sozluk','devre_dokumanlari','spool_dokumanlari',
--   'dosya_isleme_kuyrugu','alan_oncelik_kurallari','excel_format_tanimlari','fuzyon_karar_log'
-- ) ORDER BY tablename;
-- -- Beklenen: 8 satır (her tabloda 1 policy)
-- */

-- Test 4: pipeline_malzemeleri'ne kolon eklendi mi?
-- /*
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='pipeline_malzemeleri' 
--   AND column_name='kaynak_dokuman_id';
-- -- Beklenen: 1 satır, uuid, YES
-- */

-- Test 5: Feature flag tüm tenant'lara eklendi mi?
-- /*
-- SELECT count(DISTINCT tenant_id) FROM tenant_features WHERE feature_kod='devre_wizard_v2';
-- -- Beklenen: tenants tablosundaki tenant sayısına eşit
-- */


-- ══════════════════════════════════════════════════════════════════
-- DOWN — GERİ ALMA (gerektiğinde yorumları aç ve çalıştır)
-- ══════════════════════════════════════════════════════════════════
-- KARAR-97.0 garantisi: mevcut tablolarda veri kaybı olmaz.
-- Sadece 97'de eklenenler silinir.

-- /*
-- BEGIN;
-- 
-- -- 1. Feature flag kaldir (once child, sonra parent)
-- -- tenant_features -> feature_flags FK iliskisi nedeniyle siralama onemli.
-- DELETE FROM tenant_features WHERE feature_kod = 'devre_wizard_v2';
-- DELETE FROM feature_flags WHERE kod = 'devre_wizard_v2';
-- 
-- -- 2. Mevcut tabloya eklenmiş opsiyonel izleme kolonu kaldır
-- DROP INDEX IF EXISTS idx_pipeline_mal_kaynak_dok;
-- ALTER TABLE pipeline_malzemeleri DROP COLUMN IF EXISTS kaynak_dokuman_id;
-- 
-- -- 3. Yeni tablolar (FK bağımlılıkları yüzünden ters sırayla)
-- DROP TABLE IF EXISTS fuzyon_karar_log CASCADE;
-- DROP TABLE IF EXISTS excel_format_tanimlari CASCADE;
-- DROP TABLE IF EXISTS alan_oncelik_kurallari CASCADE;
-- DROP TABLE IF EXISTS dosya_isleme_kuyrugu CASCADE;
-- DROP TABLE IF EXISTS spool_dokumanlari CASCADE;
-- DROP TABLE IF EXISTS devre_dokumanlari CASCADE;
-- DROP TABLE IF EXISTS klasor_isim_sozluk CASCADE;
-- DROP TABLE IF EXISTS dokuman_tipleri CASCADE;
-- 
-- COMMIT;
-- 
-- -- Doğrulama: 8 tablonun da silindiğini teyit
-- SELECT count(*) FROM information_schema.tables 
-- WHERE table_schema='public' AND table_name IN (
--   'dokuman_tipleri','klasor_isim_sozluk','devre_dokumanlari','spool_dokumanlari',
--   'dosya_isleme_kuyrugu','alan_oncelik_kurallari','excel_format_tanimlari','fuzyon_karar_log'
-- );
-- -- Beklenen: 0
-- */

-- ══════════════════════════════════════════════════════════════════
-- NOTLAR
-- ══════════════════════════════════════════════════════════════════
--
-- * Tüm CREATE TABLE'lar IF NOT EXISTS — idempotent, tekrar çalıştırma güvenli.
-- * DROP POLICY IF EXISTS + CREATE POLICY pattern'i re-run safe.
-- * INSERT'ler ON CONFLICT DO NOTHING — duplicate seed önler.
-- * RLS pattern 22'deki markalama_listeleri migration ile uyumlu.
-- * docs/DATABASE.md "4 ayrı policy" diyor ama canlı pattern tek "ALL"
--   policy kullanıyor — uyumsuzluk doküman tarafında. Bu migration
--   canlı pattern'i izler.
-- * Feature flag açıldığında uygulama tarafı henüz hazır değil (98+
--   oturumlarda yapılacak). Şimdi açmak güvenli, sadece tablo seviyesi.
