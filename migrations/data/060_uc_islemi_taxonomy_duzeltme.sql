-- ════════════════════════════════════════════════════════════════════
-- Migration 060 v2 — Uç işlemi taxonomy düzeltmesi
--                  (v1 fail: 'guncelleme' kolonu yok; v2'de düzeltildi)
-- ════════════════════════════════════════════════════════════════════
-- Oturum    : 85.D (taxonomy fix)
-- Tarih     : 13 Mayıs 2026
-- Bağlam    : 84'te 057 ile 36 Victaulic Groove-Steel satırı SİLİNDİ ve
--             parent boruya uc_a_islemi='groove_victaulic' olarak nitelik atandı.
--             Cihat (85): "Müşteri tablosunda yiv ayrı satır olarak görünüyor,
--             bizde de ayrı satır olmalı. Sahada fiziksel parça olmasa bile."
--             057 model olarak yanlıştı — yiv borunun niteliği değil, BOM kalemi.
--
-- v1 → v2  : 'guncelleme' kolonu DB'de yok (sadece 'olusturma' var).
--             Ayrıca tenant_id parent borudan kopyalanmalı (multi-tenant).
--             MK-84.2 (sema doğrulanmadan SQL yazıldı) tekrar.
--
-- Düzeltme  : 36 yiv satırını tip='malzeme' olarak geri INSERT et.
--             Parent borudaki uc_a_islemi'yi NULL yap.
--             Sözlük (058) + 4 ek kolon (059) yiv satırının üstüne taşınır.
--
-- Sonuç     : tip dağılımı boru=70, fitting=43, flansh=11, malzeme=36, toplam=160
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────
-- 1. ÖNKOŞUL — sözlük + kolonlar + parent boru sayımı
-- ────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_sozluk INT;
  v_fk     INT;
  v_parent INT;
BEGIN
  SELECT count(*) INTO v_sozluk FROM uc_islemi_tipleri WHERE kod = 'groove_victaulic';
  IF v_sozluk < 1 THEN
    RAISE EXCEPTION 'Sozluk eksik: groove_victaulic kodu yok. 058 calistirilmali.';
  END IF;

  SELECT count(*) INTO v_fk
  FROM pg_constraint
  WHERE conrelid = 'spool_malzemeleri'::regclass
    AND conname = 'spool_malzemeleri_uc_a_fk';
  IF v_fk < 1 THEN
    RAISE EXCEPTION 'FK eksik: uc_a_fk yok. 059 calistirilmali.';
  END IF;

  SELECT count(*) INTO v_parent
  FROM spool_malzemeleri
  WHERE uc_a_islemi = 'groove_victaulic' AND tip = 'boru';
  IF v_parent <> 36 THEN
    RAISE EXCEPTION 'Beklenen 36 parent boru bulunamadi (% bulundu).', v_parent;
  END IF;
  RAISE NOTICE 'OK: 36 parent boru, sozluk + FK hazir';
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 2. ATAMA PLANI — INSERT öncesi inceleme
-- ────────────────────────────────────────────────────────────────────

SELECT '=== 2) INSERT EDILECEK 36 YIV SATIRI ===' AS rapor;

SELECT
  spool_id,
  id AS parent_boru_id,
  tenant_id,
  malzeme,
  kalite,
  dis_cap_mm,
  et_mm,
  tanim AS parent_tanim
FROM spool_malzemeleri
WHERE uc_a_islemi = 'groove_victaulic' AND tip = 'boru'
ORDER BY spool_id;

-- ────────────────────────────────────────────────────────────────────
-- 3. INSERT — 36 yeni "malzeme" tipli yiv satırı
--    Parent borudan kopyalanan alanlar: tenant_id, spool_id, malzeme,
--      kalite, dis_cap_mm, et_mm
--    Yiv'e özel set edilen alanlar: tip='malzeme', tanim, uc_a_islemi,
--      uc_a_aciklama, boy_mm=NULL, agirlik_kg=NULL
--    Diğer kolonlar: default'a bırak veya NULL (test verisi, risksiz)
-- ────────────────────────────────────────────────────────────────────

SELECT '=== 3) INSERT SONUCU (36 satir beklenir) ===' AS rapor;

INSERT INTO spool_malzemeleri (
  id,
  tenant_id,
  spool_id,
  tip,
  tanim,
  malzeme,
  kalite,
  dis_cap_mm,
  et_mm,
  boy_mm,
  agirlik_kg,
  uc_a_islemi,
  uc_a_aciklama,
  olusturma
)
SELECT
  gen_random_uuid(),
  tenant_id,                              -- parent borudan (multi-tenant koruma)
  spool_id,
  'malzeme',                              -- yiv = BOM kalemi, fiziksel ayrı parça değil
  'Victaulic Groove-Steel',               -- generic tanım (orijinal raw 057'de silindi)
  malzeme,                                -- parent borudan (karbon)
  kalite,                                 -- parent borudan (St 37)
  dis_cap_mm,                             -- parent borudan (yiv aynı çapta)
  et_mm,                                  -- parent borudan (referans bilgi)
  NULL,                                   -- boy bilinmiyor, UI'da "—" görünür
  NULL,                                   -- ağırlık yok (fiziksel parça yok)
  'groove_victaulic',                     -- kendi sözlük FK'sı
  'Victaulic Groove-Steel (057 sonrasi reconstruct)',
  now()
FROM spool_malzemeleri
WHERE uc_a_islemi = 'groove_victaulic' AND tip = 'boru'
RETURNING
  id, spool_id, tip, tanim, malzeme, kalite, dis_cap_mm, uc_a_islemi;

-- ────────────────────────────────────────────────────────────────────
-- 4. UPDATE — Parent borulardaki uc_a_islemi'yi NULL yap
-- ────────────────────────────────────────────────────────────────────

SELECT '=== 4) UPDATE: parent boru uc_a_islemi = NULL (36 satir) ===' AS rapor;

UPDATE spool_malzemeleri
SET uc_a_islemi = NULL
WHERE uc_a_islemi = 'groove_victaulic' AND tip = 'boru'
RETURNING id, spool_id, tanim, dis_cap_mm;

-- ────────────────────────────────────────────────────────────────────
-- 5. DOĞRULAMA — son durum kontrolleri
-- ────────────────────────────────────────────────────────────────────

SELECT '=== 5.1) Tip dagilimi (beklenen: boru=70, fitting=43, flansh=11, malzeme=36) ===' AS rapor;
SELECT tip, count(*) AS sayim
FROM spool_malzemeleri
GROUP BY tip
ORDER BY tip;

SELECT '=== 5.2) groove_victaulic sahipligi (beklenen: 36 malzeme, 0 boru) ===' AS rapor;
SELECT tip, count(*) AS sayim
FROM spool_malzemeleri
WHERE uc_a_islemi = 'groove_victaulic'
GROUP BY tip
ORDER BY tip;

SELECT '=== 5.3) Yiv satirlarinin sozluk join provasi (5 ornek) ===' AS rapor;
SELECT
  sm.id,
  sm.tip,
  sm.tanim,
  sm.dis_cap_mm,
  sm.kalite,
  sm.uc_a_islemi,
  ut.ad_tr,
  ut.varsayilan_std
FROM spool_malzemeleri sm
LEFT JOIN uc_islemi_tipleri ut ON sm.uc_a_islemi = ut.kod
WHERE sm.tip = 'malzeme' AND sm.uc_a_islemi = 'groove_victaulic'
ORDER BY sm.olusturma DESC
LIMIT 5;

SELECT '=== 5.4) Toplam kayit sayisi (beklenen: 160) ===' AS rapor;
SELECT count(*) AS toplam FROM spool_malzemeleri;

COMMIT;


-- ════════════════════════════════════════════════════════════════════
-- DOĞRULAMA SORGULARI — Migration SONRASI manuel çalıştır
-- ════════════════════════════════════════════════════════════════════

-- D1: Tip dağılımı son hali
-- SELECT tip, count(*) FROM spool_malzemeleri GROUP BY tip ORDER BY tip;
-- beklenen: boru=70, fitting=43, flansh=11, malzeme=36

-- D2: Yiv satırlarının tüm sözlük bilgisiyle birleşmesi
-- SELECT sm.tip, sm.tanim, sm.dis_cap_mm, sm.uc_a_islemi, ut.ad_tr, ut.varsayilan_std
-- FROM spool_malzemeleri sm
-- LEFT JOIN uc_islemi_tipleri ut ON sm.uc_a_islemi = ut.kod
-- WHERE sm.tip = 'malzeme'
-- ORDER BY sm.dis_cap_mm
-- LIMIT 10;
-- beklenen: tüm satırlarda ad_tr='Victaulic Yiv', varsayilan_std='ANSI/AWWA C606'

-- D3: Parent borularda uc_a_islemi NULL mi?
-- SELECT count(*) AS hala_boru_uzerinde_uc_a
-- FROM spool_malzemeleri
-- WHERE tip = 'boru' AND uc_a_islemi IS NOT NULL;
-- beklenen: 0

-- D4: Test spool ID'sinde dağılım
-- SELECT tip, tanim, dis_cap_mm, uc_a_islemi
-- FROM spool_malzemeleri
-- WHERE spool_id = '00d4926d-5bcf-472c-96af-0447d9feb045'
-- ORDER BY tip, tanim;
-- beklenen: en az 1 boru + 1 malzeme (yiv) satırı
