-- ============================================================
-- 028 — TENANT-SPEC standardı sözlüğe ekle
-- ============================================================
-- Amaç: Sistem standartlarından (ASME, DIN, EN ...) ayrılan, 
--       tenant'a özel ölçüm/sipariş kayıtlarını sözlük tarafında 
--       da tanımlamak.
--
-- "TENANT-SPEC" yeni bir standart değer. boru_olculer.standart 
-- kolonu için kullanılır. Sözlük tarafı dolu olunca raporlamada
-- "tenant özel" ile filtreleme yapılabilir.
--
-- Idempotent: Tekrar çalıştırılabilir, ON CONFLICT DO NOTHING.
-- ============================================================

INSERT INTO boru_standart_sozluk (
  standart, ad, slug, ulke, olcu_sistemi, dn_sistemi,
  malzeme_grubu_default, son_edisyon_yili,
  veri_var, aktif,
  aciklama_tr, aciklama_en
) VALUES (
  'TENANT-SPEC',
  'Tenant Özel Ölçüm / Üretim',
  'tenant-spec',
  NULL,            -- ülke yok, tenant'a özel
  'mm',
  'DN',
  NULL,            -- malzeme her tip olabilir
  NULL,            -- edisyon yok
  TRUE,            -- veri var (çünkü tenant ekledikçe büyür)
  TRUE,
  'Tersane veya kullanıcı tarafından sahada ölçülmüş ya da '
  'özel sipariş ile temin edilmiş, hiçbir uluslararası standartta '
  '(ASME, DIN, EN, JIS, ASTM) tam karşılığı olmayan boru kayıtları. '
  'Sadece kayıt eden tenant görür. Üretim takibi, ağırlık hesabı ve '
  '3D model için kullanılır. Pilot kullandıkça hangi yeni standardın '
  'sisteme yüklenmesi gerektiğini gösteren önemli bir veri kaynağı.',
  'Tenant-specific pipe records measured in field or special-ordered, '
  'with no exact match in international standards (ASME, DIN, EN, JIS, ASTM). '
  'Visible only to the recording tenant. Used for production tracking, '
  'weight calculation, and 3D modeling. As pilot accumulates data, '
  'frequently-seen ad-hoc dimensions indicate which new standards '
  'should be loaded into the system catalog.'
)
ON CONFLICT (standart) DO NOTHING;
