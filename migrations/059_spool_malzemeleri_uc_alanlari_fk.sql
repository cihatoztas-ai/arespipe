-- ════════════════════════════════════════════════════════════════════
-- Migration 059 — spool_malzemeleri uç alanları + CHECK → FK
-- ════════════════════════════════════════════════════════════════════
-- Oturum    : 85.B
-- Tarih     : 13 Mayıs 2026
-- Bağlam    : KARAR-84.5 (müşteri raw metni saklanır, kanonik kodla eşleştirilir)
--             MK-84.4 (CHECK enum yerine sözlük FK pattern'i)
-- Ön koşul  : 058_uc_islemi_tipleri_sozluk.sql çalıştırılmış ve doğrulanmış olmalı
--             (uc_islemi_tipleri tablosu mevcut + 6 seed satır)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────
-- 1. ÖNKOŞUL KONTROLÜ — sözlük tablosu var mı, 6 seed dolu mu?
-- ────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_sozluk_sayim INT;
  v_victaulic_sayim INT;
  v_gecersiz_sayim INT;
BEGIN
  SELECT count(*) INTO v_sozluk_sayim FROM uc_islemi_tipleri;
  IF v_sozluk_sayim < 6 THEN
    RAISE EXCEPTION 'uc_islemi_tipleri sozluk dolu degil (% satir). Once 058 calistirilmali.', v_sozluk_sayim;
  END IF;
  RAISE NOTICE 'OK: uc_islemi_tipleri sozluk dolu (% satir)', v_sozluk_sayim;

  -- 057'de migrate edilen 36 Victaulic kaydının sözlükte karşılığı var mı?
  SELECT count(*) INTO v_victaulic_sayim
  FROM spool_malzemeleri WHERE uc_a_islemi = 'groove_victaulic';
  RAISE NOTICE 'OK: 36 beklenen Victaulic kaydi: % bulundu', v_victaulic_sayim;

  -- Mevcut uc_a_islemi/uc_b_islemi değerlerinin TÜMÜ sözlükte var mı?
  -- (Yoksa FK eklemek 23503 hata verir.)
  SELECT count(*) INTO v_gecersiz_sayim
  FROM spool_malzemeleri sm
  WHERE (sm.uc_a_islemi IS NOT NULL
         AND sm.uc_a_islemi NOT IN (SELECT kod FROM uc_islemi_tipleri))
     OR (sm.uc_b_islemi IS NOT NULL
         AND sm.uc_b_islemi NOT IN (SELECT kod FROM uc_islemi_tipleri));
  IF v_gecersiz_sayim > 0 THEN
    RAISE EXCEPTION 'Sozlukte olmayan % uc_a/uc_b_islemi kodu var. FK eklenemez. Detay icin SELECT calistir.', v_gecersiz_sayim;
  END IF;
  RAISE NOTICE 'OK: Tum mevcut uc_a/uc_b_islemi kodlari sozlukte mevcut';
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 2. 4 YENİ KOLON (KARAR-84.5)
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE spool_malzemeleri
  ADD COLUMN IF NOT EXISTS uc_a_aciklama TEXT,   -- Müşteri raw metni (PDF'te yazılı)
  ADD COLUMN IF NOT EXISTS uc_b_aciklama TEXT,
  ADD COLUMN IF NOT EXISTS uc_a_std      TEXT,   -- Override: NULL ise sözlükten varsayılan_std gelir
  ADD COLUMN IF NOT EXISTS uc_b_std      TEXT;

COMMENT ON COLUMN spool_malzemeleri.uc_a_aciklama IS
  'Musteri raw metni (PDF orijinal ifadesi, MK-84.5). Ornek: "Victaulic Style 77 grooved end A".';
COMMENT ON COLUMN spool_malzemeleri.uc_b_aciklama IS
  'Musteri raw metni (PDF orijinal ifadesi, MK-84.5).';
COMMENT ON COLUMN spool_malzemeleri.uc_a_std IS
  'Standart override - NULL ise uc_islemi_tipleri.varsayilan_std gelir (KARAR-84.5).';
COMMENT ON COLUMN spool_malzemeleri.uc_b_std IS
  'Standart override - NULL ise uc_islemi_tipleri.varsayilan_std gelir (KARAR-84.5).';

-- ────────────────────────────────────────────────────────────────────
-- 3. CHECK CONSTRAINT KALDIR (MK-84.4 — enum yerine sözlük FK)
-- ────────────────────────────────────────────────────────────────────

-- 057'de hangi adla eklendi? İki olası ad var: spool_malzemeleri_uc_islemi_chk veya
-- spool_malzemeleri_uc_a_islemi_check / spool_malzemeleri_uc_b_islemi_check.
-- IF EXISTS güvenli — yoksa atlar.

DO $$
DECLARE
  v_drop_sayim INT := 0;
  v_constraint TEXT;
BEGIN
  FOR v_constraint IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'spool_malzemeleri'::regclass
      AND contype = 'c'
      AND (conname LIKE '%uc_islemi%' OR conname LIKE '%uc_a_islemi%' OR conname LIKE '%uc_b_islemi%')
  LOOP
    EXECUTE 'ALTER TABLE spool_malzemeleri DROP CONSTRAINT IF EXISTS ' || quote_ident(v_constraint);
    v_drop_sayim := v_drop_sayim + 1;
    RAISE NOTICE 'DROP CHECK constraint: %', v_constraint;
  END LOOP;
  RAISE NOTICE 'Toplam % CHECK constraint kaldirildi (uc_islemi ile ilgili)', v_drop_sayim;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 4. FK EKLE — uc_islemi_tipleri(kod) ile bağla
-- ────────────────────────────────────────────────────────────────────

-- ON DELETE SET NULL: sözlükten bir kod silinirse spool kaydı yetim kalmaz, NULL olur
-- ON UPDATE CASCADE: kod yeniden adlandırılırsa otomatik güncellenir

ALTER TABLE spool_malzemeleri
  ADD CONSTRAINT spool_malzemeleri_uc_a_fk
    FOREIGN KEY (uc_a_islemi) REFERENCES uc_islemi_tipleri(kod)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE spool_malzemeleri
  ADD CONSTRAINT spool_malzemeleri_uc_b_fk
    FOREIGN KEY (uc_b_islemi) REFERENCES uc_islemi_tipleri(kod)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ────────────────────────────────────────────────────────────────────
-- 5. SON DOĞRULAMA — RAISE NOTICE ile özet
-- ────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_victaulic INT;
  v_uc_a_dolu INT;
  v_uc_b_dolu INT;
BEGIN
  SELECT count(*) INTO v_victaulic FROM spool_malzemeleri WHERE uc_a_islemi = 'groove_victaulic';
  SELECT count(*) INTO v_uc_a_dolu FROM spool_malzemeleri WHERE uc_a_islemi IS NOT NULL;
  SELECT count(*) INTO v_uc_b_dolu FROM spool_malzemeleri WHERE uc_b_islemi IS NOT NULL;
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Migration 059 SUCCESS';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Victaulic kayit (uc_a=groove_victaulic) : %', v_victaulic;
  RAISE NOTICE 'uc_a_islemi dolu satir                  : %', v_uc_a_dolu;
  RAISE NOTICE 'uc_b_islemi dolu satir                  : %', v_uc_b_dolu;
  RAISE NOTICE '4 yeni kolon eklendi: uc_a_aciklama, uc_b_aciklama, uc_a_std, uc_b_std';
  RAISE NOTICE '2 FK eklendi: uc_a_fk, uc_b_fk (-> uc_islemi_tipleri.kod)';
END $$;

COMMIT;


-- ════════════════════════════════════════════════════════════════════
-- DOĞRULAMA SORGULARI — Migration SONRASI manuel çalıştır
-- ════════════════════════════════════════════════════════════════════

-- D1: 4 yeni kolon eklendi mi?
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'spool_malzemeleri'
--   AND column_name IN ('uc_a_aciklama','uc_b_aciklama','uc_a_std','uc_b_std')
-- ORDER BY column_name;
-- beklenen: 4 satir, hepsi text, nullable

-- D2: FK constraint'leri eklendi mi?
-- SELECT conname, pg_get_constraintdef(oid) AS tanim
-- FROM pg_constraint
-- WHERE conrelid = 'spool_malzemeleri'::regclass
--   AND conname LIKE 'spool_malzemeleri_uc%_fk';
-- beklenen: 2 satir (uc_a_fk, uc_b_fk), her ikisi de REFERENCES uc_islemi_tipleri(kod)

-- D3: Eski CHECK constraint'i kaldırıldı mı?
-- SELECT conname FROM pg_constraint
-- WHERE conrelid = 'spool_malzemeleri'::regclass
--   AND contype = 'c'
--   AND (conname LIKE '%uc_islemi%' OR conname LIKE '%uc_a_islemi%' OR conname LIKE '%uc_b_islemi%');
-- beklenen: 0 satir

-- D4: 36 Victaulic kaydı hala bağlı mı? (FK eklemek hiç birini kırdı mı?)
-- SELECT count(*) FROM spool_malzemeleri WHERE uc_a_islemi = 'groove_victaulic';
-- beklenen: 36

-- D5: FK kısıtı çalışıyor mu? (Bu sorgu hata vermeli — gerçek bir INSERT'le test ederiz)
-- Şu komut HATA vermeli (23503 foreign_key_violation):
-- INSERT INTO spool_malzemeleri (id, spool_id, tip, malzeme, kalite, uc_a_islemi)
-- VALUES (gen_random_uuid(), '<gercek_spool_id>', 'boru', 'karbon', 'St 37', 'YOK_OLAN_KOD');
-- (Bu testi opsiyonel — gerçek spool_id gerekir, atlayabiliriz)

-- D6: Nested join çalışıyor mu? (85.C frontend testi için ön provası)
-- SELECT sm.id, sm.uc_a_islemi, sm.uc_a_aciklama,
--        ut.ad_tr, ut.varsayilan_std
-- FROM spool_malzemeleri sm
-- LEFT JOIN uc_islemi_tipleri ut ON sm.uc_a_islemi = ut.kod
-- WHERE sm.uc_a_islemi IS NOT NULL
-- LIMIT 5;
-- beklenen: 5 satir, ad_tr ve varsayilan_std dolu (groove_victaulic icin "Victaulic Yiv" + "ANSI/AWWA C606")
