-- 110_kk_davet_alanlari.sql
-- Oturum 200 — Kalite Kontrol implementasyonu, faz 1 şema.
-- KK davet/junction'a eksik alanlar + KK sayaç satırı (tenant başına).
-- KARAR (Cihat onaylı, 200): sonuc constraint DEĞİŞMEZ {gecti,hatali,tamir,bekliyor}
--   (UI ikili: onay=gecti, ret=tamir; hatali yazılmaz ama gösterilir). not_ reuse → hata_notu EKLENMEZ.
-- Tüm eklemeler additive + nullable → 0 satır yeniden yazılır. Yeni endpoint/enum YOK.
-- Önkoşul doğrulandı (200 pre-flight): 6 kolon yok, kk sayaç satırı yok, sonuc hep 'bekliyor', not_ boş.
-- MK-98.2: panelde BEGIN/ROLLBACK dry-run → sayım teyit → COMMIT. MK-184.5: APPLY canlı → repo sync.

-- ── kk_davetler: paket alanları ──
ALTER TABLE kk_davetler ADD COLUMN IF NOT EXISTS kapanis_ts   timestamptz;  -- "Daveti Kapat" damgası
ALTER TABLE kk_davetler ADD COLUMN IF NOT EXISTS pdf_yolu     text;         -- Storage davet PDF yolu
ALTER TABLE kk_davetler ADD COLUMN IF NOT EXISTS olusturan_id uuid;         -- daveti açan kullanıcı

-- ── kk_davet_spooller: spool sonuç alanları (not_ ZATEN VAR → hata notu oraya) ──
ALTER TABLE kk_davet_spooller ADD COLUMN IF NOT EXISTS sonuc_ts    timestamptz;  -- onay/ret damgası
ALTER TABLE kk_davet_spooller ADD COLUMN IF NOT EXISTS personel_id uuid;          -- hatadan sorumlu (Faz 1)
ALTER TABLE kk_davet_spooller ADD COLUMN IF NOT EXISTS foto_yolu   text;          -- ret fotoğrafı (Faz 1); fotograflar tablosuna da bağlanır

-- ── KK takip no sayacı (tenant başına; sonraki_no auto-insert'i prefix='' digits=6 ile bozuk yapardı → önceden doğru kur) ──
INSERT INTO sayac_tanimlari (tenant_id, tip, prefix, yil_ekle, digits, son_no, aciklama)
SELECT DISTINCT tenant_id, 'kk', 'KK', true, 3, 0, 'Kalite Kontrol Davet No'
FROM sayac_tanimlari
WHERE tip <> 'kk'
ON CONFLICT (tenant_id, tip) DO NOTHING;
