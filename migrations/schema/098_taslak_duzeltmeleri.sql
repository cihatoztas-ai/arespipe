-- 098: Operatör düzeltme döngüsü (G2a) — taslak değer düzeltmeleri tablosu
-- Q5 KARARI (139): düzeltme parse_sonuc'a DEĞİL, ayrı sorgulanabilir tabloya.
-- Anahtar (tenant_id, devre_id, pipeline_no, spool_no, alan) UNIQUE → upsert (üzerine yaz).
-- Client-side supabase+RLS ile yazılır (inceleBaslat/wizardIptal deseni). Yeni endpoint YOK (12/12).
-- DB'de 143'te çalıştırıldı (COMMIT). Bu dosya tekrarlanabilirlik kaydı.

BEGIN;

CREATE TABLE taslak_duzeltmeleri (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  devre_id      uuid NOT NULL REFERENCES devreler(id) ON DELETE CASCADE,
  pipeline_no   text NOT NULL,
  spool_no      text NOT NULL,
  alan          text NOT NULL,
  deger         text,
  kaynak        text NOT NULL DEFAULT 'operator',
  duzelten      uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, devre_id, pipeline_no, spool_no, alan)
);

ALTER TABLE taslak_duzeltmeleri ENABLE ROW LEVEL SECURITY;

CREATE POLICY taslak_duzelt_tenant ON taslak_duzeltmeleri
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

CREATE INDEX idx_taslak_duzelt_devre ON taslak_duzeltmeleri (tenant_id, devre_id);

COMMIT;
