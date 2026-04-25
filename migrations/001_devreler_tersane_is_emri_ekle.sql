-- ───────────────────────────────────────────────────────────────
-- Migration: 001 — devreler tablosuna tersane_is_emri kolonu ekle
-- Tarih:     25 Nisan 2026 — 32. oturum
-- Amaç:      D3 fix — tersane iş emri DB'ye yazılabilsin (önceki:
--            yorum "tersane_is_emri kolonu DB'de yok" diyordu, kullanıcı
--            girdileri sayfa yenilemede kayboluyordu).
-- Etki:      devre_detay.html → tersaneIsEmriKaydet artık DB'ye yazıyor
--            (optimistic UI + rollback patterni). devreYukle DB'den okur.
-- Test:      Tersane iş emri gir → kaydet → F5 → değer durmalı.
-- Geri al:   ALTER TABLE devreler DROP COLUMN tersane_is_emri;
-- ───────────────────────────────────────────────────────────────
BEGIN;

ALTER TABLE devreler ADD COLUMN tersane_is_emri TEXT;

-- Mevcut kayıtlar NULL olur (opsiyonel alan, sorun değil).
-- Default değer eklenmiyor; kullanıcı isterse girer.

COMMIT;
