-- 099_bom_guvenilirlik.sql
-- Oturum 144 — BOM malzeme listesi güvenilirlik bayrağı + latent-bug fix.
--
-- 1) spooller.bom_durum: 3-durum (guvenilir/duzeltildi/guvensiz).
--      guvenilir  = varsayılan (Excel temiz / Tersan-Cadmatic)
--      duzeltildi = operatör en az bir kalem rötuşladı (kod otomatik geçirir)
--      guvensiz   = operatör "buna güvenmiyorum" → damgalı canlı, manuel takip
--      (MK-143.4: BOM güvenilirliği spool BAŞLIK düzeltmesinden AYRI iş.)
-- 2) spooller.bom_durum_not / _zaman: güvensiz işaretleme gerekçesi + zamanı (manuel takip).
-- 3) spool_malzemeleri.guncelleme: sertToggle/heatKaydet UPDATE'leri bu kolonu yazıyor ama
--      kolon YOKTU → _supaUpdate sessizce console.warn'a düşüp fail ediyordu. Kalem rötuşu da
--      aynı yolu kullanacak; kolonu ekleyip sessiz fail'i kapatıyoruz.
--
-- MK-98.2: ÖNCE bu dosya BEGIN...ROLLBACK ile çalıştırılır (dry-run). Verify SELECT çıktısı
--   doğruysa son satırdaki ROLLBACK → COMMIT yapılıp tekrar çalıştırılır.

BEGIN;

-- ── spooller.bom_durum (NOT NULL default → mevcut tüm spool'lar 'guvenilir' olur, sabit default = hızlı) ──
ALTER TABLE spooller
  ADD COLUMN IF NOT EXISTS bom_durum text NOT NULL DEFAULT 'guvenilir';

-- CHECK: yalnız 3 kanonik değer (idempotent: önce düşür, sonra ekle)
ALTER TABLE spooller DROP CONSTRAINT IF EXISTS spooller_bom_durum_check;
ALTER TABLE spooller
  ADD CONSTRAINT spooller_bom_durum_check
  CHECK (bom_durum IN ('guvenilir','duzeltildi','guvensiz'));

-- Güvensiz işaretleme bağlamı (opsiyonel alanlar)
ALTER TABLE spooller ADD COLUMN IF NOT EXISTS bom_durum_not   text;
ALTER TABLE spooller ADD COLUMN IF NOT EXISTS bom_durum_zaman timestamptz;

-- ── latent-bug fix: kalem UPDATE'lerinin yazdığı guncelleme kolonu ──
ALTER TABLE spool_malzemeleri ADD COLUMN IF NOT EXISTS guncelleme timestamptz;

-- ── DRY-RUN DOĞRULAMA — bu 4 satır dönmeli ──
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE (table_name = 'spooller'          AND column_name LIKE 'bom_%')
   OR (table_name = 'spool_malzemeleri' AND column_name = 'guncelleme')
ORDER BY table_name, column_name;

-- CHECK constraint yerinde mi?
SELECT conname FROM pg_constraint WHERE conname = 'spooller_bom_durum_check';

-- ✅ Çıktı doğruysa: aşağıdaki ROLLBACK'i COMMIT yapıp dosyayı tekrar çalıştır.
ROLLBACK;
