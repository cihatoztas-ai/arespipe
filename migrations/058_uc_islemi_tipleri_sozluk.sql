-- ════════════════════════════════════════════════════════════════════
-- Migration 058 — uc_islemi_tipleri sözlük tablosu
-- ════════════════════════════════════════════════════════════════════
-- Oturum    : 85.A
-- Tarih     : 13 Mayıs 2026
-- Bağlam    : KARAR-84.1 (uç işlemi standart bilgisi DB tarafında saklanır,
--             JS mapping yerine sözlük tablosu + FK pattern'i)
--             KARAR-84.4 (yaka_formlu sözlüğün ilk seed'inde yer alır)
-- Sonraki   : 059_spool_malzemeleri_uc_alanlari_fk.sql (4 kolon + CHECK→FK)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────
-- 1. SÖZLÜK TABLOSU
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uc_islemi_tipleri (
  kod              TEXT PRIMARY KEY,
  ad_tr            TEXT NOT NULL,
  ad_en            TEXT,
  varsayilan_std   TEXT,                       -- Sözlükten gelen kanonik standart (NULL ise plain)
  alternatif_std   JSONB DEFAULT '[]'::jsonb,  -- ["ISO 7-1 BSPT", ...]
  kategori         TEXT,                       -- kaynakli | disli | mekanik | flansli | NULL
  aktif            BOOLEAN DEFAULT true,
  sira             INT,                        -- UI sıralaması
  aciklama         TEXT,
  olusturma_at     TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  uc_islemi_tipleri IS
  'Boru uç işlemleri sözlüğü. KARAR-84.1 + MK-84.4: yeni uç tipi = INSERT, sıfır kod değişikliği.';
COMMENT ON COLUMN uc_islemi_tipleri.kod IS
  'Kanonik kod (snake_case). spool_malzemeleri.uc_a_islemi / uc_b_islemi FK ile bağlanır.';
COMMENT ON COLUMN uc_islemi_tipleri.varsayilan_std IS
  'Sözlükten gelen standart. spool_malzemeleri.uc_a_std NULL ise UI bu değeri gösterir.';
COMMENT ON COLUMN uc_islemi_tipleri.alternatif_std IS
  'Alternatif standartlar (örn. threaded: NPT primary, BSPT alternative). JSON array.';

-- ────────────────────────────────────────────────────────────────────
-- 2. SEED — 6 satır (KARAR-84.1 + KARAR-84.4)
-- ────────────────────────────────────────────────────────────────────

INSERT INTO uc_islemi_tipleri (kod, ad_tr, ad_en, varsayilan_std, alternatif_std, kategori, sira, aciklama)
VALUES
  ('plain',            'Düz',                 'Plain',                       NULL,                 '[]'::jsonb,
   NULL,         1, 'Boru ucu kesimsiz/düz. Standart yok.'),

  ('bevel',            'Kaynak Ağzı',         'Beveled End',                 'ASME B16.25',        '[]'::jsonb,
   'kaynakli',   2, 'Buttwelding ağzı. Açı/yüz hazırlığı ASME B16.25 ile tanımlı.'),

  ('socket',           'Soket Kaynak',        'Socket Weld',                 'ASME B16.11',        '[]'::jsonb,
   'kaynakli',   3, 'Soket içine yerleştirilen uç. Fitting tarafı ASME B16.11.'),

  ('threaded',         'Vida Dişi',           'Threaded',                    'ASME B1.20.1',       '["ISO 7-1 BSPT"]'::jsonb,
   'disli',      4, 'NPT diş primary. BSPT (ISO 7-1) alternatif.'),

  ('groove_victaulic', 'Victaulic Yiv',       'Victaulic Groove',            'ANSI/AWWA C606',     '[]'::jsonb,
   'mekanik',    5, 'Yiv açılarak Victaulic kelepçe ile bağlanır.'),

  ('yaka_formlu',      'Yaka (Form Verilmiş)','Formed Lap End (Vanstone)',   'MSS SP-43',          '[]'::jsonb,
   'flansli',    6, 'Borunun ucuna makinayla form verilerek oluşturulan yaka; loose lap joint flange ile kullanılır. Fabrika yapımı stub end (Type A/B) ile karıştırılmamalı.');

-- ────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (MK-85.2 — RLS asla kapalı bırakılmaz)
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE uc_islemi_tipleri ENABLE ROW LEVEL SECURITY;

-- Tüm authenticated kullanıcılar okur (sözlük herkese açık)
DROP POLICY IF EXISTS "uc_islemi_select_all" ON uc_islemi_tipleri;
CREATE POLICY "uc_islemi_select_all"
  ON uc_islemi_tipleri FOR SELECT
  USING (auth.role() = 'authenticated');

-- Sadece super_admin INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "uc_islemi_super_admin_write" ON uc_islemi_tipleri;
CREATE POLICY "uc_islemi_super_admin_write"
  ON uc_islemi_tipleri FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM kullanicilar
      WHERE id = auth.uid()
        AND rol = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kullanicilar
      WHERE id = auth.uid()
        AND rol = 'super_admin'
    )
  );

-- ────────────────────────────────────────────────────────────────────
-- 4. REALTIME (sözlük değişikliği canlı yansısın — opsiyonel ama düşük maliyet)
-- ────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'uc_islemi_tipleri'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE uc_islemi_tipleri;
  END IF;
END $$;

COMMIT;


-- ════════════════════════════════════════════════════════════════════
-- DOĞRULAMA SORGULARI — Migration SONRASI manuel çalıştır
-- ════════════════════════════════════════════════════════════════════

-- D1: 6 seed satırı eklendi mi?
-- SELECT count(*) AS toplam FROM uc_islemi_tipleri;   -- beklenen: 6

-- D2: Sıralı liste — sira asc
-- SELECT sira, kod, ad_tr, varsayilan_std, kategori
-- FROM uc_islemi_tipleri ORDER BY sira;

-- D3: 84'te migrate edilen 36 Victaulic kaydı groove_victaulic koduna işaret ediyor mu?
-- (Bu sorgu sadece "kayıtlar uyumlu mu" kontrolü, FK 059'da kurulacak)
-- SELECT count(*) AS victaulic_kayit
-- FROM spool_malzemeleri
-- WHERE uc_a_islemi = 'groove_victaulic';            -- beklenen: 36

-- D4: RLS açık mı?
-- SELECT relname, relrowsecurity
-- FROM pg_class WHERE relname = 'uc_islemi_tipleri'; -- beklenen: relrowsecurity = t

-- D5: Policy'ler eklendi mi?
-- SELECT policyname, cmd, roles
-- FROM pg_policies WHERE tablename = 'uc_islemi_tipleri';
-- beklenen: 2 satır (select_all, super_admin_write)

-- D6: Realtime publication'a eklendi mi?
-- SELECT tablename FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime' AND tablename = 'uc_islemi_tipleri';
