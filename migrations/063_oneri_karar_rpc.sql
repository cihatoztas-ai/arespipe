-- ════════════════════════════════════════════════════════════════════
-- Migration 063 — Öneri Karar RPC Fonksiyonları
-- ════════════════════════════════════════════════════════════════════
-- Oturum    : 87.C
-- Tarih     : 14 Mayıs 2026
-- Bağlam    : tanimsiz_kayitlar (061'de kurulu) üzerinde süper admin
--             karar akışı. 86.D Phase 2 implementasyonu — onay/red.
--
-- Fonksiyonlar:
--   1) oneri_reddet(p_oneri_id, p_karar_notu)
--      → Tüm tipler için. UPDATE durum='reddedildi'.
--   2) oneri_onayla_boru(p_oneri_id, p_form jsonb, p_mod text)
--      → Sadece BORU tipi öneriler için. INSERT INTO boru_olculer +
--        UPDATE tanimsiz_kayitlar SET hedef_tablo='boru_olculer',
--        hedef_kayit_id=<yeni>, durum='onaylandi'.
--      → p_mod = 'sistem' (sistem_preset=true, tenant_id=NULL)
--             VEYA 'tenant' (sistem_preset=false, tenant_id=oneri'nin ilk_oneren)
--
-- Diğer tipler (fitting, flansh, malzeme) ileride ayrı RPC olarak gelir
-- (her tablonun şeması farklı, tek-RPC genelleme zor — 88+ oturumlara).
--
-- Disiplinler:
--   MK-85.2  RLS asla kapalı bırakılmaz (fonksiyonlar SECURITY DEFINER
--            ama kendi içinde super_admin guard yapıyor)
--   MK-86.2  Şema + CHECK + UNIQUE üçü doğrulandı:
--            - tenant_consistency CHECK (sistem_preset XOR tenant_id)
--            - UNIQUE (standart, malzeme_grubu, dn, schedule_tipi, schedule_deger)
--            - 11 NOT NULL kolon (id, standart, malzeme_grubu, dn,
--              schedule_tipi, schedule_deger, schedule_kod, dis_cap_mm,
--              et_mm, agirlik_kg_m, urun_formu, sistem_preset)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────
-- 1. ONERI_REDDET — Tüm tipler için ortak red akışı
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION oneri_reddet(
  p_oneri_id   UUID,
  p_karar_notu TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id  UUID;
  v_admin_rol TEXT;
  v_durum     TEXT;
BEGIN
  -- Auth: super_admin zorunlu
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz: oturum yok' USING ERRCODE = '42501';
  END IF;

  SELECT rol INTO v_admin_rol FROM kullanicilar WHERE id = v_admin_id;
  IF v_admin_rol IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Yetkisiz: super_admin gerekli (rol=%)', coalesce(v_admin_rol,'<yok>')
      USING ERRCODE = '42501';
  END IF;

  -- Kayıt durumu kontrol — bekliyor veya incelemede olmalı
  SELECT durum INTO v_durum FROM tanimsiz_kayitlar WHERE id = p_oneri_id;
  IF v_durum IS NULL THEN
    RAISE EXCEPTION 'Öneri bulunamadı: %', p_oneri_id USING ERRCODE = 'P0002';
  END IF;
  IF v_durum NOT IN ('bekliyor','incelemede') THEN
    RAISE EXCEPTION 'Öneri zaten karar verilmiş (durum=%)', v_durum USING ERRCODE = 'P0001';
  END IF;

  -- Karar notu zorunlu (red için gerekçe önemli)
  IF p_karar_notu IS NULL OR length(trim(p_karar_notu)) = 0 THEN
    RAISE EXCEPTION 'Red için karar notu zorunlu' USING ERRCODE = 'P0001';
  END IF;

  UPDATE tanimsiz_kayitlar
  SET durum         = 'reddedildi',
      karar_notu    = p_karar_notu,
      karar_zamani  = now(),
      super_admin_id = v_admin_id,
      guncelleme_at = now()
  WHERE id = p_oneri_id;
END $$;

COMMENT ON FUNCTION oneri_reddet IS
  'Süper admin tanımsız kayıt önerisini reddeder. Karar notu zorunlu. KARAR-85.6.';

-- ────────────────────────────────────────────────────────────────────
-- 2. ONERI_ONAYLA_BORU — Boru için onay + INSERT INTO boru_olculer
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION oneri_onayla_boru(
  p_oneri_id UUID,
  p_form     JSONB,
  p_mod      TEXT  -- 'sistem' veya 'tenant'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id        UUID;
  v_admin_rol       TEXT;
  v_oneri           tanimsiz_kayitlar%ROWTYPE;
  v_target_tenant   UUID;
  v_sistem_preset   BOOLEAN;
  v_yeni_id         UUID;

  -- p_form'dan çekilen değerler
  v_standart        TEXT;
  v_malzeme_grubu   TEXT;
  v_dn              INT;
  v_schedule_tipi   TEXT;
  v_schedule_deger  TEXT;
  v_schedule_kod    TEXT;
  v_urun_formu      TEXT;
  v_dis_cap_mm      NUMERIC;
  v_et_mm           NUMERIC;
  v_agirlik_kg_m    NUMERIC;
  -- Opsiyonel
  v_tolerans_et_yuzde      NUMERIC;
  v_tolerans_agirlik_yuzde NUMERIC;
  v_et_min_mm       NUMERIC;
  v_et_max_mm       NUMERIC;
  v_ic_cap_mm       NUMERIC;
  v_hacim_l_m       NUMERIC;
  v_yuzey_alan_dis_m2_m NUMERIC;
  v_edisyon_yili    INT;
  v_kaynak          TEXT;
  v_notlar          TEXT;
  v_malzeme_id      UUID;
BEGIN
  -- Auth: super_admin zorunlu
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz: oturum yok' USING ERRCODE = '42501';
  END IF;

  SELECT rol INTO v_admin_rol FROM kullanicilar WHERE id = v_admin_id;
  IF v_admin_rol IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Yetkisiz: super_admin gerekli (rol=%)', coalesce(v_admin_rol,'<yok>')
      USING ERRCODE = '42501';
  END IF;

  -- Mod parametresi kontrol
  IF p_mod NOT IN ('sistem','tenant') THEN
    RAISE EXCEPTION 'Geçersiz mod: % (beklenen: sistem|tenant)', p_mod USING ERRCODE = 'P0001';
  END IF;

  -- Öneriyi getir
  SELECT * INTO v_oneri FROM tanimsiz_kayitlar WHERE id = p_oneri_id;
  IF v_oneri.id IS NULL THEN
    RAISE EXCEPTION 'Öneri bulunamadı: %', p_oneri_id USING ERRCODE = 'P0002';
  END IF;

  IF v_oneri.durum NOT IN ('bekliyor','incelemede') THEN
    RAISE EXCEPTION 'Öneri zaten karar verilmiş (durum=%)', v_oneri.durum USING ERRCODE = 'P0001';
  END IF;

  -- Sadece boru tipi öneriler bu RPC'de işlenir
  -- (ham_data.tip = 'boru' kontrolü — UI da bu filtreyi yapmalı ama backend de güvenli olsun)
  IF coalesce(v_oneri.ham_data ->> 'tip', '') <> 'boru' THEN
    RAISE EXCEPTION 'Bu RPC sadece boru tipi için (öneri tipi: %)',
      coalesce(v_oneri.ham_data ->> 'tip', '<bos>') USING ERRCODE = 'P0001';
  END IF;

  -- p_form parse + validate (NOT NULL alanlar)
  v_standart       := p_form ->> 'standart';
  v_malzeme_grubu  := p_form ->> 'malzeme_grubu';
  v_dn             := nullif(p_form ->> 'dn','')::int;
  v_schedule_tipi  := p_form ->> 'schedule_tipi';
  v_schedule_deger := p_form ->> 'schedule_deger';
  v_schedule_kod   := p_form ->> 'schedule_kod';
  v_urun_formu     := p_form ->> 'urun_formu';
  v_dis_cap_mm     := nullif(p_form ->> 'dis_cap_mm','')::numeric;
  v_et_mm          := nullif(p_form ->> 'et_mm','')::numeric;
  v_agirlik_kg_m   := nullif(p_form ->> 'agirlik_kg_m','')::numeric;

  IF v_standart IS NULL OR length(trim(v_standart)) = 0
     OR v_malzeme_grubu IS NULL OR length(trim(v_malzeme_grubu)) = 0
     OR v_dn IS NULL
     OR v_schedule_tipi IS NULL OR length(trim(v_schedule_tipi)) = 0
     OR v_schedule_deger IS NULL OR length(trim(v_schedule_deger)) = 0
     OR v_schedule_kod IS NULL OR length(trim(v_schedule_kod)) = 0
     OR v_urun_formu IS NULL OR length(trim(v_urun_formu)) = 0
     OR v_dis_cap_mm IS NULL
     OR v_et_mm IS NULL
     OR v_agirlik_kg_m IS NULL
  THEN
    RAISE EXCEPTION 'Zorunlu alan eksik (standart, malzeme_grubu, dn, schedule_*, urun_formu, dis_cap_mm, et_mm, agirlik_kg_m)'
      USING ERRCODE = 'P0001';
  END IF;

  -- Opsiyonel alanlar
  v_tolerans_et_yuzde      := nullif(p_form ->> 'tolerans_et_yuzde','')::numeric;
  v_tolerans_agirlik_yuzde := nullif(p_form ->> 'tolerans_agirlik_yuzde','')::numeric;
  v_et_min_mm              := nullif(p_form ->> 'et_min_mm','')::numeric;
  v_et_max_mm              := nullif(p_form ->> 'et_max_mm','')::numeric;
  v_ic_cap_mm              := nullif(p_form ->> 'ic_cap_mm','')::numeric;
  v_hacim_l_m              := nullif(p_form ->> 'hacim_l_m','')::numeric;
  v_yuzey_alan_dis_m2_m    := nullif(p_form ->> 'yuzey_alan_dis_m2_m','')::numeric;
  v_edisyon_yili           := nullif(p_form ->> 'edisyon_yili','')::int;
  v_kaynak                 := p_form ->> 'kaynak';
  v_notlar                 := p_form ->> 'notlar';
  v_malzeme_id             := nullif(p_form ->> 'malzeme_id','')::uuid;

  -- Mod → tenant_consistency hesabı
  IF p_mod = 'sistem' THEN
    v_sistem_preset := true;
    v_target_tenant := NULL;
  ELSE  -- 'tenant'
    v_sistem_preset := false;
    v_target_tenant := v_oneri.ilk_oneren_tenant_id;
    IF v_target_tenant IS NULL THEN
      RAISE EXCEPTION 'Tenant-özel onay için ilk_oneren_tenant_id boş olamaz' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- INSERT INTO boru_olculer
  -- UNIQUE constraint: (standart, malzeme_grubu, dn, schedule_tipi, schedule_deger)
  -- Çakışma olursa PostgreSQL 23505 fırlatır, kullanıcıya net mesaj döner
  BEGIN
    INSERT INTO boru_olculer (
      standart, malzeme_grubu, dn, schedule_tipi, schedule_deger, schedule_kod,
      urun_formu, dis_cap_mm, et_mm, agirlik_kg_m,
      tolerans_et_yuzde, tolerans_agirlik_yuzde,
      et_min_mm, et_max_mm, ic_cap_mm, hacim_l_m, yuzey_alan_dis_m2_m,
      edisyon_yili, kaynak, notlar, malzeme_id,
      sistem_preset, tenant_id
    ) VALUES (
      v_standart, v_malzeme_grubu, v_dn, v_schedule_tipi, v_schedule_deger, v_schedule_kod,
      v_urun_formu, v_dis_cap_mm, v_et_mm, v_agirlik_kg_m,
      v_tolerans_et_yuzde, v_tolerans_agirlik_yuzde,
      v_et_min_mm, v_et_max_mm, v_ic_cap_mm, v_hacim_l_m, v_yuzey_alan_dis_m2_m,
      v_edisyon_yili, v_kaynak, v_notlar, v_malzeme_id,
      v_sistem_preset, v_target_tenant
    ) RETURNING id INTO v_yeni_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'Bu kombinasyon zaten kütüphanede var (standart=%, malzeme_grubu=%, dn=%, schedule=%/%/%)',
        v_standart, v_malzeme_grubu, v_dn, v_schedule_tipi, v_schedule_deger, v_schedule_kod
        USING ERRCODE = '23505';
    WHEN check_violation THEN
      RAISE EXCEPTION 'CHECK ihlali (muhtemelen tenant_consistency): mod=%, sistem_preset=%, tenant_id=%',
        p_mod, v_sistem_preset, v_target_tenant
        USING ERRCODE = '23514';
  END;

  -- tanimsiz_kayitlar'da kararı işle
  UPDATE tanimsiz_kayitlar
  SET durum          = 'onaylandi',
      hedef_tablo    = 'boru_olculer',
      hedef_kayit_id = v_yeni_id,
      karar_zamani   = now(),
      super_admin_id = v_admin_id,
      karar_notu     = coalesce(p_form ->> 'karar_notu', NULL),
      guncelleme_at  = now()
  WHERE id = p_oneri_id;

  RETURN v_yeni_id;
END $$;

COMMENT ON FUNCTION oneri_onayla_boru IS
  'Süper admin boru tipi öneriyi onaylar: INSERT INTO boru_olculer (sistem veya tenant özel) + UPDATE tanimsiz_kayitlar. KARAR-85.6.';

-- ────────────────────────────────────────────────────────────────────
-- 3. SON ÖZET (RAISE NOTICE)
-- ────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Migration 063 SUCCESS';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Yeni fonksiyonlar:';
  RAISE NOTICE '  - oneri_reddet(p_oneri_id, p_karar_notu)';
  RAISE NOTICE '  - oneri_onayla_boru(p_oneri_id, p_form jsonb, p_mod text)';
  RAISE NOTICE 'Auth: SECURITY DEFINER + super_admin guard (iki kontrol)';
  RAISE NOTICE 'Mod: sistem (sistem_preset=true, tenant_id=NULL)';
  RAISE NOTICE '   |  tenant (sistem_preset=false, tenant_id=ilk_oneren)';
  RAISE NOTICE 'UNIQUE constraint cakismasi yakalanir, net hata mesaji doner';
END $$;

COMMIT;


-- ════════════════════════════════════════════════════════════════════
-- DOĞRULAMA SORGULARI — Migration SONRASI manuel çalıştır
-- ════════════════════════════════════════════════════════════════════

-- D1: Fonksiyonlar var mı?
-- SELECT proname, prosecdef FROM pg_proc
-- WHERE proname IN ('oneri_reddet','oneri_onayla_boru');
-- beklenen: 2 satır, prosecdef=true (SECURITY DEFINER)

-- D2: Yetki testi (super_admin değil — kırmızı bekleniyor)
-- SELECT oneri_reddet('00000000-0000-0000-0000-000000000000'::uuid, 'test');
-- beklenen: ERROR 42501 Yetkisiz

-- D3: Var olmayan öneri (super_admin context'inde, RPC üzerinden — UI test)
-- Bu sorgu psql'de değil RPC üzerinden test edilir (auth.uid() set olur)

-- D4: Sahada akış (UI üzerinden):
--   1) kutuphane-oneriler.html → bekleyen kayda tıkla
--   2) "Reddet" → modal, karar notu gir, gönder → durum 'reddedildi'
--   3) Yeni test kaydı ekle (önceki gibi)
--   4) "Sisteme Ekle" → modal, eksik alanları doldur, gönder
--      → boru_olculer'da yeni satır, sistem_preset=true, tenant_id=NULL
--      → tanimsiz_kayitlar durum='onaylandi', hedef_tablo='boru_olculer'
