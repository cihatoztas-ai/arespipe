-- 109_flansh_olculer_unique_index.sql
-- Oturum 197 (ön keşif 196) — flansh_olculer doğal UNIQUE index (paslanmaz flanş seed öncesi şart)
--
-- AMAÇ: flansh_olculer'da bir flanşı benzersiz yapan doğal anahtarı zorla. Bu olmadan
--   seed-from-json upsert idempotent olamaz (A10.6 #4 paslanmaz flanş seed bunu bekliyor).
--
-- NEDEN PARTIAL (WHERE dışlama):
--   Tabloda 5 çift (10 satır) DIN-86037-2 + LJ + cunife var. Bunlar KAZA DEĞİL —
--   aynı geometrik flanşın iki cidar varyantı (boru et S=1.5mm vs S=2.0mm): bore_std_mm
--   ve agirlik_kg farklı, notlar açıkça "S=1.5mm" / "S=2mm" diyor. Cunife DIN-86037-2 lap-joint
--   stub-end'in bore'u bağlı olduğu boru cidarına göre değişir. Cidar ayrımı anahtarda
--   tutulmadığından (flanşta schedule/et alanı doldurulmamış) bu aile çift görünür.
--   Silmek/birleştirmek gerçek veriyi yok eder (MK-190.4: çift-etiket ≠ duplicate).
--   ÇÖZÜM (MK kararı B1): bu aileyi partial index'in DIŞINDA bırak; gerisi korunur.
--   DOĞRULAMA (196 ön keşif): DIN-86037-2 = 29 satır, HEPSİ cunife LJ; LJ+cunife yalnız
--   bu geometri_std altında. Dar üçlü (geometri_std + flansh_tipi + malzeme_grubu) tam bu
--   aileyi kapsar, meşru veriyi açıkta bırakmaz.
--
-- NEDEN cap_dn (cap_nps DEĞİL):
--   cap_dn 356/356 dolu (integer, matcher DN kullanır). cap_nps 92 NULL + format tutarsızlığı
--   ('1 1/4' vs '1.1/4') → anahtara girerse sahte-çift/bölünme üretir.
--
-- NEDEN NULLS NOT DISTINCT:
--   yuzey_tipi / tenant_id nullable; PG15+ NULLS NOT DISTINCT ile null'lar tek sayılır
--   (fitting_olculer_dogal_uk ile aynı desen, Oturum 178).
--
-- NEDEN DÜZ CREATE (CONCURRENTLY değil):
--   flansh_olculer preset referans tablosu, canlı yazma trafiği yok (seed manuel). Düz index
--   BEGIN/ROLLBACK dry-run içinde çalışır (CONCURRENTLY transaction içinde çalışmaz). Kilit zararsız.
--
-- ÖN-UÇUŞ (oluşturmadan önce çift kalmadığını teyit — 0 satır beklenir):
--   SELECT geometri_std, flansh_tipi, basinc_sinifi, cap_dn, yuzey_tipi, malzeme_grubu, tenant_id, count(*)
--   FROM flansh_olculer
--   WHERE NOT (geometri_std='DIN-86037-2' AND flansh_tipi='LJ' AND malzeme_grubu='cunife')
--   GROUP BY 1,2,3,4,5,6,7 HAVING count(*) > 1;
--
-- KURULUM: Supabase SQL editör. Dry-run için BEGIN ... ROLLBACK; gerçekte BEGIN ... COMMIT.
-- İDEMPOTENT: IF NOT EXISTS → tekrar çalıştırılabilir.

CREATE UNIQUE INDEX IF NOT EXISTS flansh_olculer_dogal_uk
  ON flansh_olculer
     (geometri_std, flansh_tipi, basinc_sinifi, cap_dn, yuzey_tipi, malzeme_grubu, tenant_id)
  NULLS NOT DISTINCT
  WHERE NOT (geometri_std = 'DIN-86037-2'
             AND flansh_tipi = 'LJ'
             AND malzeme_grubu = 'cunife');

-- KURULUM SONRASI DOĞRULAMA (silme olmadığını + index'i teyit):
--   SELECT count(*) FROM flansh_olculer;                                   -- 356 (değişmedi)
--   SELECT count(*) FROM flansh_olculer
--     WHERE geometri_std='DIN-86037-2' AND flansh_tipi='LJ' AND malzeme_grubu='cunife';  -- 29 (silinmedi)
--   SELECT indexdef FROM pg_indexes WHERE indexname='flansh_olculer_dogal_uk';
