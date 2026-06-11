-- ════════════════════════════════════════════════════════════════════
-- Migration 061 — tanimsiz_kayitlar tablosu (öneri akışı)
-- ════════════════════════════════════════════════════════════════════
-- Oturum    : 85.E
-- Tarih     : 13 Mayıs 2026
-- Bağlam    : KARAR-85.5 (turuncu = kütüphanede ara ölçü, gri = tanımsız)
--             KARAR-85.6 (süper admin tek otorite, çakışma engellenir)
--             KARAR-85.7 (aynı hash tek satır, siklik_sayisi artar)
--             MK-85.2 (RLS asla kapalı bırakılmaz)
--
-- Akış:
--   1) Kullanıcı gri satıra tıklar → modal açılır → "süper admin onayına gönder"
--   2) Sistem hash_anahtari hesaplar (boyut + kalite + tip normalize)
--   3) Aynı hash varsa: siklik_sayisi += 1 (UPSERT)
--   4) Yoksa: yeni satır INSERT
--   5) Süper admin panelinde sıklığa göre sıralı liste
--   6) Süper admin "Onayla / Reddet" — onaylanırsa kütüphaneye gider, satır 'tamamlandi' olur
--   7) UI'da turuncu/gri durumu kütüphane bağlantısı kurulunca otomatik düzelir
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────
-- 1. ANA TABLO
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tanimsiz_kayitlar (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tip: hangi kütüphaneye eklenecek (KARAR-85.1 dört tip)
  tip                  TEXT NOT NULL CHECK (tip IN (
    'std_disi',          -- ara ölçü, sahada kullanılıyor ama standartta yok
    'std_eksik',         -- standartta var, biz kütüphaneye eklemedik
    'kalite_std_eksik',  -- malzeme standardı (DIN 17100 vb.) kataloğa eklenmemiş
    'uc_islemi_eksik'    -- yeni uç işlemi tipi (sözlüğe eklenecek)
  )),

  -- Sözlük benzersizliği (KARAR-85.7: aynı kombinasyonu tek satıra topla)
  -- Örnek: 'boru|139.70|4.500|st37'  veya  'kalite|st37'  vb.
  hash_anahtari        TEXT NOT NULL UNIQUE,

  -- Ham veri — modal'da ne girilmişse JSONB olarak saklı
  -- {tip, dis_cap_mm, et_mm, kalite, malzeme, tanim, tahmini_dn, ...}
  ham_data             JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Sıklık (KARAR-85.7)
  siklik_sayisi        INT NOT NULL DEFAULT 1,

  -- Öneri kaynak izleri
  ilk_oneren_tenant_id UUID REFERENCES tenants(id),
  ilk_oneren_user_id   UUID REFERENCES kullanicilar(id),
  son_oneren_tenant_id UUID REFERENCES tenants(id),
  son_oneren_user_id   UUID REFERENCES kullanicilar(id),

  -- İzometri/spool bağlantısı (opsiyonel — silinirse SET NULL, kayıt durur)
  ilk_spool_malzeme_id UUID REFERENCES spool_malzemeleri(id) ON DELETE SET NULL,

  -- Kullanıcı sebebi (modal'da seçilir)
  kullanici_sebep      TEXT CHECK (kullanici_sebep IN (
    'std_var_eklenmemis',   -- "Standartta var ama eklenmemiş"
    'std_disi_ozel_olcu',   -- "Standartta yok, özel ölçü"
    'veri_hatali_eksik',    -- "Veri hatalı/eksik"
    NULL                    -- (eski kayıtlar için)
  )),
  kullanici_aciklama   TEXT,

  -- Süper admin akışı
  durum                TEXT NOT NULL DEFAULT 'bekliyor' CHECK (durum IN (
    'bekliyor',      -- yeni öneri, admin incelemedi
    'incelemede',    -- admin almış, web'de standart arıyor
    'onaylandi',     -- kütüphaneye eklendi (UI listeden düşer)
    'reddedildi'     -- admin reddetti (gerekçe karar_notu'nda)
  )),
  super_admin_id       UUID REFERENCES kullanicilar(id),
  karar_zamani         TIMESTAMPTZ,
  karar_notu           TEXT,

  -- Onaylandı kayıt için: hangi kütüphane satırına bağlandı (audit)
  hedef_tablo          TEXT,   -- 'boru_olculer' | 'fitting_olculer' | 'flansh_olculer' | 'malzeme_kataloglari' | 'uc_islemi_tipleri'
  hedef_kayit_id       UUID,

  olusturma_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  tanimsiz_kayitlar IS
  'Kütüphanede olmayan veya standardı bilinmeyen kayıtların süper admin onayına gönderilmesi (KARAR-85.6).';
COMMENT ON COLUMN tanimsiz_kayitlar.hash_anahtari IS
  'Normalize benzersiz key. Aynı boyut+kalite kombinasyonu tek satıra toplanır, siklik_sayisi artar (KARAR-85.7).';
COMMENT ON COLUMN tanimsiz_kayitlar.siklik_sayisi IS
  'Aynı tanımsız kayıt kaç kez tetiklendi. Süper admin paneli sıklığa göre sıralar.';
COMMENT ON COLUMN tanimsiz_kayitlar.durum IS
  'bekliyor | incelemede | onaylandi | reddedildi. onaylandi olunca UI listesinden düşer.';

-- ────────────────────────────────────────────────────────────────────
-- 2. INDEX'LER — Sıklığa göre sıralama, durum filtresi, tenant arama
-- ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS ix_tanimsiz_durum_siklik
  ON tanimsiz_kayitlar (durum, siklik_sayisi DESC);

CREATE INDEX IF NOT EXISTS ix_tanimsiz_olusturma
  ON tanimsiz_kayitlar (olusturma_at DESC);

CREATE INDEX IF NOT EXISTS ix_tanimsiz_son_oneren_tenant
  ON tanimsiz_kayitlar (son_oneren_tenant_id);

-- ────────────────────────────────────────────────────────────────────
-- 3. HASH ANAHTARI YARDIMCI FONKSİYON
--    UI'dan UPSERT gönderirken bu fonksiyonla hash hesaplanır.
--    Format: 'tip|dis_cap|et|kalite_normalize'
--    Numerik değerler 3 ondalık hassasiyetle (139.700, 4.500)
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION tanimsiz_hash_anahtari(
  p_tip          TEXT,
  p_dis_cap_mm   NUMERIC,
  p_et_mm        NUMERIC,
  p_kalite       TEXT
) RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT lower(coalesce(p_tip,'?')) || '|'
      || coalesce(to_char(p_dis_cap_mm,'FM999990.000'),'?') || '|'
      || coalesce(to_char(p_et_mm,'FM999990.000'),'?') || '|'
      || regexp_replace(lower(coalesce(p_kalite,'?')), '[^a-z0-9]', '', 'g')
$$;

COMMENT ON FUNCTION tanimsiz_hash_anahtari IS
  'Tanımsız kayıt benzersizlik anahtarı. UI tarafı UPSERT öncesi bu fonksiyonu çağırır.';

-- ────────────────────────────────────────────────────────────────────
-- 4. UPSERT YARDIMCI FONKSİYON — UI tarafından çağrılır
--    Aynı hash varsa: siklik_sayisi += 1, son_oneren güncellenir
--    Yoksa: yeni satır INSERT, sıklık = 1
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION tanimsiz_kayit_onerisi(
  p_tip                TEXT,
  p_dis_cap_mm         NUMERIC,
  p_et_mm              NUMERIC,
  p_kalite             TEXT,
  p_ham_data           JSONB,
  p_tenant_id          UUID,
  p_user_id            UUID,
  p_spool_malzeme_id   UUID,
  p_kullanici_sebep    TEXT,
  p_kullanici_aciklama TEXT
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_hash TEXT;
  v_id   UUID;
BEGIN
  v_hash := tanimsiz_hash_anahtari(p_tip, p_dis_cap_mm, p_et_mm, p_kalite);

  INSERT INTO tanimsiz_kayitlar (
    tip, hash_anahtari, ham_data,
    ilk_oneren_tenant_id, ilk_oneren_user_id,
    son_oneren_tenant_id, son_oneren_user_id,
    ilk_spool_malzeme_id,
    kullanici_sebep, kullanici_aciklama
  ) VALUES (
    p_tip, v_hash, p_ham_data,
    p_tenant_id, p_user_id,
    p_tenant_id, p_user_id,
    p_spool_malzeme_id,
    p_kullanici_sebep, p_kullanici_aciklama
  )
  ON CONFLICT (hash_anahtari) DO UPDATE
    SET siklik_sayisi        = tanimsiz_kayitlar.siklik_sayisi + 1,
        son_oneren_tenant_id = EXCLUDED.son_oneren_tenant_id,
        son_oneren_user_id   = EXCLUDED.son_oneren_user_id,
        guncelleme_at        = now(),
        -- Yeni açıklama varsa append (eski kaybolmasın)
        kullanici_aciklama   = CASE
          WHEN EXCLUDED.kullanici_aciklama IS NULL OR EXCLUDED.kullanici_aciklama = ''
            THEN tanimsiz_kayitlar.kullanici_aciklama
          WHEN tanimsiz_kayitlar.kullanici_aciklama IS NULL
            THEN EXCLUDED.kullanici_aciklama
          ELSE tanimsiz_kayitlar.kullanici_aciklama || E'\n---\n' || EXCLUDED.kullanici_aciklama
        END
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

COMMENT ON FUNCTION tanimsiz_kayit_onerisi IS
  'UI ana endpoint: yeni öneri ekler veya mevcudun sıklığını artırır. Tek atomic call.';

-- ────────────────────────────────────────────────────────────────────
-- 5. GÜNCELLEME TRIGGER — guncelleme_at otomatik
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION tanimsiz_kayitlar_guncelleme_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.guncelleme_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_tanimsiz_kayitlar_guncelleme ON tanimsiz_kayitlar;
CREATE TRIGGER trg_tanimsiz_kayitlar_guncelleme
  BEFORE UPDATE ON tanimsiz_kayitlar
  FOR EACH ROW EXECUTE FUNCTION tanimsiz_kayitlar_guncelleme_at();

-- ────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (MK-85.2)
--    Politika:
--      - authenticated kullanıcılar (her tenant) hash'i unique olduğu için
--        UPSERT yapar (kendi siklik artırabilir) — okuma izni var
--      - sadece super_admin UPDATE (durum karar) ve DELETE yapabilir
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE tanimsiz_kayitlar ENABLE ROW LEVEL SECURITY;

-- SELECT: super_admin tümünü görür, normal kullanıcı yalnızca kendi tenant'ının
-- bekleyen önerilerini görür (KARAR-85.7 felsefesi gereği sıklık tek tabloda tutulduğu
-- için diğer tenant'ların ham_data'sı normal kullanıcıya gösterilmez; süper admin görür)
DROP POLICY IF EXISTS "tanimsiz_select_super_admin" ON tanimsiz_kayitlar;
CREATE POLICY "tanimsiz_select_super_admin"
  ON tanimsiz_kayitlar FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM kullanicilar
            WHERE id = auth.uid() AND rol = 'super_admin')
  );

DROP POLICY IF EXISTS "tanimsiz_select_kendi_tenant" ON tanimsiz_kayitlar;
CREATE POLICY "tanimsiz_select_kendi_tenant"
  ON tanimsiz_kayitlar FOR SELECT
  USING (
    son_oneren_tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
    OR ilk_oneren_tenant_id = (
      SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()
    )
  );

-- INSERT: tüm authenticated kullanıcılar yeni öneri açabilir
-- (UPSERT fonksiyonu üzerinden, hash unique olduğu için duplicate olmaz)
DROP POLICY IF EXISTS "tanimsiz_insert_authenticated" ON tanimsiz_kayitlar;
CREATE POLICY "tanimsiz_insert_authenticated"
  ON tanimsiz_kayitlar FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: super_admin karar verir; sıklık artırma da UPSERT içinde update yapar
-- (RLS UPSERT konflikt UPDATE için CHECK çalışır; auth.role()='authenticated' yeterli)
DROP POLICY IF EXISTS "tanimsiz_update_super_admin_veya_authenticated" ON tanimsiz_kayitlar;
CREATE POLICY "tanimsiz_update_super_admin_veya_authenticated"
  ON tanimsiz_kayitlar FOR UPDATE
  USING (
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- DELETE: yalnızca super_admin (yanlış öneri varsa temizleme için)
DROP POLICY IF EXISTS "tanimsiz_delete_super_admin" ON tanimsiz_kayitlar;
CREATE POLICY "tanimsiz_delete_super_admin"
  ON tanimsiz_kayitlar FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM kullanicilar
            WHERE id = auth.uid() AND rol = 'super_admin')
  );

-- ────────────────────────────────────────────────────────────────────
-- 7. REALTIME — süper admin paneli canlı güncellensin
-- ────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'tanimsiz_kayitlar'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tanimsiz_kayitlar;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 8. SON ÖZET (RAISE NOTICE)
-- ────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Migration 061 SUCCESS';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Tablo: tanimsiz_kayitlar (CREATE TABLE IF NOT EXISTS)';
  RAISE NOTICE 'Fonksiyonlar: tanimsiz_hash_anahtari, tanimsiz_kayit_onerisi';
  RAISE NOTICE 'Trigger: trg_tanimsiz_kayitlar_guncelleme (BEFORE UPDATE)';
  RAISE NOTICE 'RLS: ENABLED, 4 policy (select_super_admin, select_kendi_tenant, insert_authenticated, update + delete)';
  RAISE NOTICE 'Realtime: publication eklendi';
END $$;

COMMIT;


-- ════════════════════════════════════════════════════════════════════
-- DOĞRULAMA SORGULARI — Migration SONRASI manuel çalıştır
-- ════════════════════════════════════════════════════════════════════

-- D1: Tablo var mı, kolonlar doğru mu?
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'tanimsiz_kayitlar'
-- ORDER BY ordinal_position;
-- beklenen: ~18 satır

-- D2: Index'ler eklendi mi?
-- SELECT indexname FROM pg_indexes WHERE tablename = 'tanimsiz_kayitlar';
-- beklenen: 4 (pkey, durum_siklik, olusturma, son_oneren_tenant)

-- D3: Fonksiyonlar çalışıyor mu?
-- SELECT tanimsiz_hash_anahtari('boru', 139.70, 4.500, 'St 37');
-- beklenen: 'boru|139.700|4.500|st37'

-- D4: RLS açık mı, 4 policy var mı?
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'tanimsiz_kayitlar';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tanimsiz_kayitlar' ORDER BY policyname;

-- D5: UPSERT testi (test bir öneri ekle, sonra aynı hash'le tekrar ekle, sıklık 2 olmalı)
-- Önce bir spool malzeme + tenant + user ID'si lazım. Studio'da bir test spool seç:
-- SELECT id, tenant_id FROM spool_malzemeleri LIMIT 1;
-- Sonra:
-- SELECT tanimsiz_kayit_onerisi(
--   'std_disi',
--   139.70,
--   4.500,
--   'St 37',
--   '{"tanim":"Test","tahmini_dn":"DN125"}'::jsonb,
--   '<tenant_uuid>',
--   '<user_uuid>',
--   '<spool_malzeme_uuid>',
--   'std_disi_ozel_olcu',
--   'Test 1'
-- );
-- Tekrar aynı boyut+kalite ile çağır:
-- SELECT tanimsiz_kayit_onerisi(
--   'std_disi', 139.70, 4.500, 'St 37',
--   '{"tanim":"Test"}'::jsonb,
--   '<tenant_uuid>', '<user_uuid>', '<spool_malzeme_uuid>',
--   'std_disi_ozel_olcu', 'Test 2'
-- );
-- Sıklık kontrolü:
-- SELECT hash_anahtari, siklik_sayisi, kullanici_aciklama FROM tanimsiz_kayitlar;
-- beklenen: 1 satır, siklik_sayisi=2, kullanici_aciklama'da 'Test 1\n---\nTest 2'

-- D6: Realtime
-- SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='tanimsiz_kayitlar';
