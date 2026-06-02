-- 100: taslak_duzeltmeleri kalem-seviyesi genişletme (B — terfi öncesi BOM kalem rötuşu)
-- KARAR (145, Yol A): kalem-seviyesi düzeltme için kalem_idx (integer).
--   Anahtar artık (tenant_id, devre_id, pipeline_no, spool_no, alan, kalem_idx).
--   kalem_idx = -1  -> SPOOL-seviyesi düzeltme (098 davranışı; dis_cap/et/agirlik/yuzey ...).
--   kalem_idx >= 0  -> KALEM-seviyesi düzeltme (malzeme_listesi[] dizi sırası, parse tek-sefer → sıra sabit).
--
-- Neden -1 sanal değer (NULL değil): PostgREST upsert onConflict TAM (partial olmayan)
--   unique index ister. Nullable kalem_idx + NULL!=NULL → kalem satırları eski 5-kolon
--   unique'i ihlal eder VE kısmi index'in onConflict hedefi olarak desteği belirsiz.
--   NOT NULL DEFAULT -1 → tek tam unique → tek onConflict deseni → mekanik garantili.
--
-- Mevcut satırlar: ADD COLUMN ... DEFAULT -1 ile otomatik -1 alır (spool-seviyesi korunur).
-- Client (devre_wizard_v3.html): spool-seviyesi upsert'e kalem_idx:-1 + onConflict'e ',kalem_idx' eklenecek.
-- Yeni endpoint YOK (12/12). RLS değişmez (get_tenant_id, 098'den).
--
-- MK-98.2: BEGIN...ROLLBACK dry-run ile test → temizse ROLLBACK'i COMMIT'e çevir.

BEGIN;

-- 1) Kalem boyutu kolonu (mevcut satırlar -1 = spool-seviyesi alır)
ALTER TABLE taslak_duzeltmeleri
  ADD COLUMN IF NOT EXISTS kalem_idx integer NOT NULL DEFAULT -1;

-- 2) Eski 5-kolon unique constraint'i kaldır (098: UNIQUE(tenant,devre,pipeline,spool,alan))
--    constraint adı = index adı (inline UNIQUE → system-generated):
ALTER TABLE taslak_duzeltmeleri
  DROP CONSTRAINT IF EXISTS taslak_duzeltmeleri_tenant_id_devre_id_pipeline_no_spool_no_key;

-- 3) Yeni tam unique (kalem_idx dahil) — PostgREST onConflict hedefi
ALTER TABLE taslak_duzeltmeleri
  ADD CONSTRAINT taslak_duzeltmeleri_anahtar_uq
  UNIQUE (tenant_id, devre_id, pipeline_no, spool_no, alan, kalem_idx);

-- 4) Doğrulama (dry-run'da gözle kontrol): satır sayısı korunmalı, hepsi kalem_idx=-1
--    SELECT count(*) AS toplam, count(*) FILTER (WHERE kalem_idx = -1) AS spool_seviyesi
--    FROM taslak_duzeltmeleri;

ROLLBACK;  -- DRY-RUN. Çıktı temizse bu satırı COMMIT yapıp tekrar çalıştır.
