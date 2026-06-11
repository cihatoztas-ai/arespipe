-- =====================================================================
-- Migration 066 — fitting_malzeme_uyum tam onarım
-- =====================================================================
-- Tarih: 15 Mayıs 2026 (yazıldı)
-- Oturum: 91 (yazıldı), 92 (canlıda çalıştırılacak)
--
-- Amaç: fitting_malzeme_uyum tablosundaki 3 sorunu düzelt:
--
--   1. Test satırı sil: 1 satır var, içeriği iki yanlış UUID:
--      - fitting_id  = flansh_olculer'de (Class 150 WN DN100)
--      - malzeme_id  = malzeme_tanimlari'nda
--      Mantıksız bağlantı — test verisi, gerçek bilgi değil.
--
--   2. fitting_id FK'sini düzelt:
--      Mevcut: fitting_id -> flansh_olculer (YANLIŞ, eski tablo tarihçesinden)
--      Doğru:  fitting_id -> fitting_olculer
--      
--      Constraint adı bile yanıltıcı: "fitting_malzeme_uyum_flansh_id_fkey"
--      Tablo geçmişiyle ilgili: muhtemelen önceki bir oturumda 
--      flansh_malzeme_uyum -> fitting_malzeme_uyum rename'i yapılmış,
--      FK constraint'leri eski tabloya bağlı kalmış.
--
--   3. malzeme_id FK'sini düzelt:
--      Mevcut: malzeme_id -> malzeme_tanimlari (YANLIŞ, runtime tablo)
--      Doğru:  malzeme_id -> malzeme_kataloglari (kütüphane master)
--      
--      KUTUPHANE-KAPSAM.md Bölüm 2: kütüphane çapraz uyum tabloları 
--      malzeme_kataloglari'ya bağlanır. fitting_olculer.malzeme_id zaten 
--      malzeme_kataloglari'ya bağlı, çapraz tablonun farklı master'a 
--      bağlanması mantıksız.
--
--   4. PRIMARY KEY ekle:
--      (fitting_id, malzeme_id) çifti unique olmalı. Şu an PK yok.
--
-- Tablo durumu (15 May 2026): 1 test satırı, gerçek veri yok.
-- Veri kaybı riski: SIFIR (test satırı silinir).
--
-- Önkoşul: Migration 065 çalıştırılmış olmalı (retroaktif kayıt).
--
-- Geri alma (gerekirse):
--   ALTER TABLE fitting_malzeme_uyum 
--     DROP CONSTRAINT fitting_malzeme_uyum_pkey,
--     DROP CONSTRAINT fitting_malzeme_uyum_fitting_id_fkey,
--     DROP CONSTRAINT fitting_malzeme_uyum_malzeme_id_fkey;
--   -- Eski yanlış FK'lar geri eklenemez (test satırı silindiği için 
--   -- referans bozulmaz, ama mantıksal restore mümkün değil)
-- =====================================================================

BEGIN;

-- 1. Test satırını sil (referans bütünlüğünü ihlal etmesin diye önce)
DELETE FROM fitting_malzeme_uyum;

-- 2. Yanlış fitting_id FK'sini sil (flansh_olculer'a bağlı)
ALTER TABLE fitting_malzeme_uyum 
  DROP CONSTRAINT IF EXISTS fitting_malzeme_uyum_flansh_id_fkey;

-- 3. Yanlış malzeme_id FK'sini sil (malzeme_tanimlari'na bağlı)
ALTER TABLE fitting_malzeme_uyum 
  DROP CONSTRAINT IF EXISTS fitting_malzeme_uyum_malzeme_id_fkey;

-- 4. Doğru fitting_id FK ekle (fitting_olculer'a)
ALTER TABLE fitting_malzeme_uyum 
  ADD CONSTRAINT fitting_malzeme_uyum_fitting_id_fkey 
    FOREIGN KEY (fitting_id) 
    REFERENCES fitting_olculer(id) ON DELETE CASCADE;

-- 5. Doğru malzeme_id FK ekle (malzeme_kataloglari'na)
ALTER TABLE fitting_malzeme_uyum 
  ADD CONSTRAINT fitting_malzeme_uyum_malzeme_id_fkey 
    FOREIGN KEY (malzeme_id) 
    REFERENCES malzeme_kataloglari(id) ON DELETE CASCADE;

-- 6. PRIMARY KEY ekle (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public'
          AND table_name = 'fitting_malzeme_uyum' 
          AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE fitting_malzeme_uyum 
          ADD CONSTRAINT fitting_malzeme_uyum_pkey 
            PRIMARY KEY (fitting_id, malzeme_id);
        RAISE NOTICE 'PK eklendi: (fitting_id, malzeme_id)';
    ELSE
        RAISE NOTICE 'PK zaten var, atlandı';
    END IF;
END $$;

COMMIT;

-- =====================================================================
-- Doğrulama Sorguları (manuel çalıştır):
--
-- 1. FK'ların doğru olduğunu doğrula
-- SELECT 
--   tc.constraint_name,
--   kcu.column_name,
--   ccu.table_name AS referans_tablo,
--   tc.constraint_type
-- FROM information_schema.table_constraints tc
-- LEFT JOIN information_schema.key_column_usage kcu 
--   ON tc.constraint_name = kcu.constraint_name
-- LEFT JOIN information_schema.constraint_column_usage ccu 
--   ON tc.constraint_name = ccu.constraint_name
-- WHERE tc.table_schema = 'public'
--   AND tc.table_name = 'fitting_malzeme_uyum'
-- ORDER BY tc.constraint_type, kcu.column_name;
--
-- Beklenen sonuç (4 satır):
--   fitting_malzeme_uyum_fitting_id_fkey  | fitting_id  | fitting_olculer       | FOREIGN KEY
--   fitting_malzeme_uyum_malzeme_id_fkey  | malzeme_id  | malzeme_kataloglari   | FOREIGN KEY
--   fitting_malzeme_uyum_pkey             | fitting_id  | fitting_malzeme_uyum  | PRIMARY KEY
--   fitting_malzeme_uyum_pkey             | malzeme_id  | fitting_malzeme_uyum  | PRIMARY KEY
--
-- 2. Tablonun boş olduğunu doğrula
-- SELECT count(*) FROM fitting_malzeme_uyum;
-- Beklenen: 0
-- =====================================================================
