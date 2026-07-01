-- 112_kullanicilar_customer_id.sql
-- Oturum 212 — Mobil §8 Sıra 7 önkoşulu: customers↔kullanicilar DB bağı (208 teşhisi kapatılıyor).
-- KARAR (Cihat onaylı, 212 — A): musteri kullanıcı = kullanicilar satırı (rol='musteri'), MK-208.1
--   tek-kimlik ilkesiyle uyumlu. Bağ rol-temelli değil, doğrudan FK: kullanicilar.customer_id.
--   customer_kullanicilar tablosuna dokunulmadı (auth'a bağsız ayrı kişi rehberi, amacı farklı).
-- tenant_id DEĞİŞMİYOR: musteri satırının tenant_id'si yine imalatçı firmanın tenant'ı
--   (mevcut tenant-scope RLS kalıpları bozulmaz). customer_id ek filtre katmanı;
--   görünürlük customer_project_access (customer_id + proje_id + tenant_id) üzerinden kurulacak.
-- Additive + nullable → 0 satır yeniden yazılır, hiçbir mevcut satır etkilenmez. Yeni endpoint YOK.
-- İdempotent: ADD COLUMN IF NOT EXISTS.

BEGIN;

ALTER TABLE kullanicilar
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);

CREATE INDEX IF NOT EXISTS kullanicilar_customer_id_idx
  ON kullanicilar(customer_id)
  WHERE customer_id IS NOT NULL;

COMMIT;
