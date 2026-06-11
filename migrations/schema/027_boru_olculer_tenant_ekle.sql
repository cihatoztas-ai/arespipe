-- ============================================================
-- 027 — boru_olculer multi-tenant desteği
-- ============================================================
-- Amaç: Standart kütüphaneye (sistem_preset=TRUE) dokunmadan,
--       tenant'a özel ölçü kayıtlarını (sistem_preset=FALSE) saklayabilmek.
--
-- Senaryo: Tersane 60.3 × 6.3 mm boru kullanıyor. Bu hiçbir
--          uluslararası standartta yok. Ya özel sipariş ya BS/TS kaynaklı.
--          Kütüphaneye girmemeli ama kayıt edilmeli (ağırlık, 3D, kesim için).
--
-- Idempotent: Tekrar çalıştırılabilir, hata vermez.
-- Kaynak: AresPipe kütüphane oturumu (50+ kütüphane mini-proje)
-- Tarih: 1 Mayıs 2026
-- ============================================================

-- 1) tenant_id kolonu ekle (NULL = sistem-preset, dolu = tenant özel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boru_olculer'
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE boru_olculer ADD COLUMN tenant_id UUID;
  END IF;
END $$;

-- 2) sistem_preset kolonu ekle (mevcut 238 satır TRUE olur)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boru_olculer'
      AND column_name = 'sistem_preset'
  ) THEN
    ALTER TABLE boru_olculer 
      ADD COLUMN sistem_preset BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- 3) Tutarlılık constraint: sistem_preset kayıtların tenant_id NULL olmalı
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'boru_olculer'
      AND constraint_name = 'boru_olculer_tenant_consistency'
  ) THEN
    ALTER TABLE boru_olculer
      ADD CONSTRAINT boru_olculer_tenant_consistency CHECK (
        (sistem_preset = TRUE AND tenant_id IS NULL)
        OR
        (sistem_preset = FALSE AND tenant_id IS NOT NULL)
      );
  END IF;
END $$;

-- 4) Tenant aramaları için indeks
CREATE INDEX IF NOT EXISTS idx_boru_olculer_tenant
  ON boru_olculer (tenant_id)
  WHERE tenant_id IS NOT NULL;

-- 5) Sistem preset filtresi için indeks (kütüphane sorgularında kullanılır)
CREATE INDEX IF NOT EXISTS idx_boru_olculer_sistem
  ON boru_olculer (sistem_preset, dis_cap_mm, et_mm);

-- 6) Kolon yorumları
COMMENT ON COLUMN boru_olculer.tenant_id IS
  'NULL = sistem preset (ortak kütüphane). Dolu = sadece o tenant görür.';

COMMENT ON COLUMN boru_olculer.sistem_preset IS
  'TRUE = standart kütüphane kaydı (ASME, DIN, EN ...). '
  'FALSE = tenant''a özel ölçüm/sipariş. Üretim takibinde gerçek boru.';
