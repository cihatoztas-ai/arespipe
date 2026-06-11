--
-- AresPipe — Migration 000: Initial Schema
-- =========================================
--
-- Tarih:     24 Nisan 2026
-- Oturum:    27
-- Üreten:    pg_dump --schema-only (PostgreSQL 17.9)
-- Kapsam:    public + storage schemas
--
-- Bu dosya AresPipe DB'nin sıfır noktasıdır. Yeni bir Supabase projesi
-- kurarken bu dosya Supabase SQL editor'de çalıştırılır, sonra diğer
-- migration dosyaları (001+) sırayla uygulanır.
--
-- İÇERİK ÖZETİ:
--   - 51 tablo (public)
--   - 85 index
--   - 17 trigger
--   - 18 benzersiz fonksiyon (malzeme normalize, audit, RLS helpers)
--   - 90 RLS policy
--   - Storage: arespipe-dosyalar bucket (public)
--
-- ÖNEMLİ NOT — Supabase Auto Schemas:
-- Bu dump'ta YOKTUR, Supabase proje oluşturulduğunda otomatik gelir:
--   - auth.*         (kullanıcı yönetimi, session'lar)
--   - realtime.*     (realtime subscription altyapısı)
--   - supabase_*.*   (dashboard iç tabloları)
--   - vault.*        (secret yönetimi)
--
-- BAĞIMLILIKLAR:
--   - Supabase PostgreSQL 17+ (pg_dump versiyonu 17.9 ile üretildi)
--   - Supabase auth.users tablosu (kullanicilar.id ile FK)
--
-- GERI ALMA:
--   Geri alınamaz — bu sıfır noktasıdır. Rollback için yedekten dönüş yapılır.
--
-- REFERANS:
--   docs/sessions/archive-01-22.md  — 1-22. oturum değişikliklerinin özeti
--   son-durum.md                     — En güncel durum
--
-- ============================================================================

--
-- PostgreSQL database dump
--

\restrict 9nRmEjHXZnV1eJ0leKnnn5f0lVlwbj5AhYrA5U224VRKsL0JIxvXgUNxd2m8cXe

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: audit_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.audit_log(tablo_adi, kayit_id, islem, eski_deger, yeni_deger, yapan_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: audit_trigger_func(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_trigger_func() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- tenant_id'yi kayıttan al
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := OLD.tenant_id;
  ELSE
    v_tenant_id := NEW.tenant_id;
  END IF;

  INSERT INTO audit_log (tenant_id, tablo_adi, kayit_id, islem, eski_deger, yeni_deger, yapan_id, tarih)
  VALUES (
    v_tenant_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: custom_access_token_hook(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.custom_access_token_hook(event jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  claims JSONB;
  kul RECORD;
BEGIN
  SELECT tenant_id, rol
  INTO kul
  FROM kullanicilar
  WHERE id = (event->>'userId')::uuid;

  claims := event->'claims';

  IF kul.tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(kul.tenant_id::text));
  END IF;

  IF kul.rol IS NOT NULL THEN
    claims := jsonb_set(claims, '{rol}', to_jsonb(kul.rol));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;


--
-- Name: devre_istatistik(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.devre_istatistik(devre_ids uuid[]) RETURNS json
    LANGUAGE sql STABLE
    AS $$
  SELECT json_build_object(
    'toplam_spool',     COUNT(*),
    'toplam_agirlik',   COALESCE(SUM(agirlik), 0),
    'ort_ilerleme',     COALESCE(ROUND(AVG(ilerleme)), 0),
    'cap_bos_spool',    COUNT(*) FILTER (WHERE dis_cap_mm IS NULL),
    'cap_bos_agirlik',  COALESCE(SUM(agirlik) FILTER (WHERE dis_cap_mm IS NULL), 0),
    'malzeme_bos_spool',COUNT(*) FILTER (WHERE malzeme IS NULL OR malzeme = ''),
    'cap_dagilim', (
      SELECT json_agg(row_to_json(r)) FROM (
        SELECT dis_cap_mm::text AS mm, COUNT(*) AS adet, SUM(agirlik) AS agirlik
        FROM spooller
        WHERE devre_id = ANY(devre_ids) AND dis_cap_mm IS NOT NULL
        GROUP BY dis_cap_mm ORDER BY dis_cap_mm
      ) r
    ),
    'malzeme_dagilim', (
      SELECT json_agg(row_to_json(r)) FROM (
        SELECT malzeme, COUNT(*) AS adet, SUM(agirlik) AS agirlik
        FROM spooller
        WHERE devre_id = ANY(devre_ids) AND malzeme IS NOT NULL AND malzeme != ''
        GROUP BY malzeme ORDER BY adet DESC
      ) r
    ),
    'yuzey_dagilim', (
      SELECT json_agg(row_to_json(r)) FROM (
        SELECT yuzey, COUNT(*) AS adet
        FROM spooller
        WHERE devre_id = ANY(devre_ids) AND yuzey IS NOT NULL AND yuzey != ''
        GROUP BY yuzey ORDER BY adet DESC
      ) r
    )
  )
  FROM spooller
  WHERE devre_id = ANY(devre_ids);
$$;


--
-- Name: exec_sql(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.exec_sql(query text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result jsonb;
BEGIN
  -- Güvenlik: sadece SELECT
  IF NOT (trim(upper(query)) LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Sadece SELECT sorgusu çalıştırılabilir';
  END IF;
 
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t'
  INTO result;
 
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;


--
-- Name: get_tenant_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tenant_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (auth.jwt()->'app_metadata'->>'tenant_id')::uuid,
    (auth.jwt()->>'tenant_id')::uuid,
    (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
  );
$$;


--
-- Name: get_toplam_spool_sayisi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_toplam_spool_sayisi() RETURNS bigint
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT COUNT(*) FROM spooller WHERE silindi = false OR silindi IS NULL;
$$;


--
-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kullanicilar
    WHERE id = auth.uid() AND rol = 'super_admin'
  );
$$;


--
-- Name: kalite_kod_normalize(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kalite_kod_normalize(raw text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
DECLARE h text;
BEGIN
  IF raw IS NULL OR TRIM(raw) = '' THEN RETURN NULL; END IF;
  h := UPPER(TRIM(raw));
  h := TRANSLATE(h, 'ÇĞİÖŞÜ', 'CGIOSU');
 
  -- Kategori isimleri KALİTE DEĞİLDİR — kesin reddet
  IF h IN ('KARBON','PASLANMAZ','BAKIR','ALUM','ALUMINYUM','DIGER','DIĞER',
           'KARBONCELIK','KARBON CELIK','CARBONSTEEL','CARBON STEEL',
           'STAINLESS','COPPER','BAKIRALASIM','BAKIR ALASIM',
           'ALUMINUM','ALUMINIUM','BRONZE','BRASS','PIRINC')
  THEN RETURN NULL; END IF;
 
  -- ── BAKIR ALAŞIMLAR ──
  IF h LIKE '%CUNI%' OR h LIKE '%CU-NI%' OR h LIKE '%CU NI%' THEN RETURN 'CUNI9010'; END IF;
 
  -- ── PASLANMAZ ÖZEL (yüksek sıc. + duplex) ──
  IF h ~ '^1[.\s]?4571$' OR h = '316TI' OR h = '316 TI' THEN RETURN '14571'; END IF;
  IF h ~ '^A\s?312[-\s]?TP?\s?316\s?L$' THEN RETURN 'A312TP316L'; END IF;
 
  -- YENİ: 321 / 321H (AISI prefix'li de)
  IF h ~ '^(AISI\s+)?321\s?H$' THEN RETURN '321H'; END IF;
  IF h ~ '^(AISI\s+)?321$' THEN RETURN '321'; END IF;
 
  -- YENİ: 304H / 316H (AISI prefix'li de)
  IF h ~ '^(AISI\s+)?304\s?H$' THEN RETURN '304H'; END IF;
  IF h ~ '^(AISI\s+)?316\s?H$' THEN RETURN '316H'; END IF;
 
  -- YENİ: Duplex paslanmaz (2205 = S31803/S32205 = F51, 2507 = S32750 = F53)
  IF h IN ('2205','S31803','S32205','UNS S31803','UNS S32205','F51') THEN RETURN '2205'; END IF;
  IF h IN ('2507','S32750','UNS S32750','F53') THEN RETURN '2507'; END IF;
 
  -- ── KARBON ÇELİK ──
  IF h ~ '^A\s?106[-\s]?GR?\s?B$' OR h ~ '^A\s?106[-\s]?B$' OR h = 'A106' THEN RETURN 'A106B'; END IF;
  IF h ~ '^A\s?53([-\s]?[A-Z])?$' THEN RETURN 'A53'; END IF;
  IF h ~ '^ST[-\s]?37$' THEN RETURN 'ST37'; END IF;
 
  -- YENİ: ST52 varyasyonları (DIN 17100: ST52, ST 52-3, ST52N, ST 52/3 vb.)
  IF h ~ '^ST[-\s]?52([-\s/]?[0-9])?[-\s]?N?$' THEN RETURN 'ST52'; END IF;
 
  IF h LIKE 'S235%' THEN RETURN 'S235JR'; END IF;
 
  -- YENİ: S355 varyasyonları (EN 10025: S355JR, S355J2, S355J2+N, S355K2 vb.)
  IF h LIKE 'S355%' THEN RETURN 'S355JR'; END IF;
 
  -- YENİ: P235GH / P265GH basınçlı boru (EN 10216)
  --        P235, P235GH, P235TR1, P235TR2, P235N, P235NH varyasyonları
  IF h ~ '^P[-\s]?235(\s?(GH|TR[12]|N|NH))?$' THEN RETURN 'P235GH'; END IF;
  IF h ~ '^P[-\s]?265(\s?(GH|TR[12]|N|NH))?$' THEN RETURN 'P265GH'; END IF;
 
  -- ── PASLANMAZ STANDART ──
  IF h ~ '^316\s?L$' THEN RETURN '316L'; END IF;
  IF h ~ '^304\s?L$' THEN RETURN '304L'; END IF;
  IF h = '316' THEN RETURN '316'; END IF;
  IF h = '304' THEN RETURN '304'; END IF;
 
  -- ── ALÜMİNYUM ──
  IF h ~ '^6061[-\s]?T6$' OR h = '6061' THEN RETURN '6061T6'; END IF;
 
  -- Tanımsız kalite → NULL
  -- (malzeme_ref_bul alias fallback'e bakar, o da NULL dönerse ref_id NULL kalır)
  RETURN NULL;
END;
$_$;


--
-- Name: kategori_kod_normalize(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kategori_kod_normalize(raw text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  h text;
BEGIN
  IF raw IS NULL OR TRIM(raw) = '' THEN
    RETURN NULL;
  END IF;

  h := LOWER(TRIM(raw));
  h := TRANSLATE(h, 'çğıöşü', 'cgiosu');

  -- Doğrudan kod eşleşmeleri
  IF h IN ('karbon','paslanmaz','bakir','alum','diger') THEN
    RETURN h;
  END IF;

  -- Malzeme isim varyantları
  IF h ~ 'karbon|carbon|celik|st37|s235|a106|a53|a333' THEN RETURN 'karbon';    END IF;
  IF h ~ '316|304|321|347|paslanmaz|stainless|inox|14571|316ti' THEN RETURN 'paslanmaz'; END IF;
  IF h ~ 'cuni|cu-ni|cu ni|bakir|copper|bronze|pirinc|brass' THEN RETURN 'bakir'; END IF;
  IF h ~ 'alum|aluminum|aluminium|6061' THEN RETURN 'alum'; END IF;

  RETURN 'diger';
END;
$$;


--
-- Name: malzeme_ref_bul(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.malzeme_ref_bul(p_tenant_id uuid, p_malzeme text, p_kalite text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_kategori_kod text;
  v_kalite_kod   text;
  v_ref_id       uuid;
  v_ham_key      text;
BEGIN
  -- Boş giriş kontrolü
  IF p_malzeme IS NULL OR trim(p_malzeme) = '' THEN RETURN NULL; END IF;
  IF p_kalite  IS NULL OR trim(p_kalite)  = '' THEN RETURN NULL; END IF;
 
  -- NOT: Guard 1 (kalite = malzeme → NULL) KALDIRILDI (22. oturum).
  -- Guard 2 yeterli (kalite_kod NULL ise zaten ref_id NULL).
 
  v_kategori_kod := kategori_kod_normalize(p_malzeme);
  v_kalite_kod   := kalite_kod_normalize(p_kalite);
 
  -- ── YENİ (26. oturum Faz A-4): ALIAS FALLBACK ──
  -- Regex kaliteyi tanımadıysa alias tablosuna bak
  IF v_kalite_kod IS NULL THEN
    v_ham_key := UPPER(TRIM(p_kalite));
 
    -- 1) Tenant alias (öncelikli — firma kendi sözlüğünü override edebilir)
    SELECT kalite_kod INTO v_kalite_kod
    FROM ifs_material_alias
    WHERE tenant_id = p_tenant_id
      AND UPPER(TRIM(ham_yazim)) = v_ham_key
    LIMIT 1;
 
    -- 2) Sistem alias (fallback)
    IF v_kalite_kod IS NULL THEN
      SELECT kalite_kod INTO v_kalite_kod
      FROM ifs_material_alias
      WHERE tenant_id IS NULL
        AND UPPER(TRIM(ham_yazim)) = v_ham_key
      LIMIT 1;
    END IF;
  END IF;
 
  -- Guard 2: kalite kodu hâlâ NULL ise tanınmıyor
  IF v_kalite_kod IS NULL THEN RETURN NULL; END IF;
  IF v_kategori_kod IS NULL THEN RETURN NULL; END IF;
 
  -- 1. Sistem preset (tenant_id IS NULL)
  SELECT id INTO v_ref_id
  FROM malzeme_tanimlari
  WHERE tenant_id IS NULL
    AND kategori_kod = v_kategori_kod
    AND kalite_kod   = v_kalite_kod
    AND aktif = true
  LIMIT 1;
  IF FOUND THEN RETURN v_ref_id; END IF;
 
  -- 2. Tenant kaydı
  SELECT id INTO v_ref_id
  FROM malzeme_tanimlari
  WHERE tenant_id = p_tenant_id
    AND kategori_kod = v_kategori_kod
    AND kalite_kod   = v_kalite_kod
    AND aktif = true
  LIMIT 1;
  IF FOUND THEN RETURN v_ref_id; END IF;
 
  -- 3. Tenant'a yeni ekle
  INSERT INTO malzeme_tanimlari
    (tenant_id, kategori_kod, kalite_kod, kalite_goster, aktif, sistem_preset, olusturma)
  VALUES
    (p_tenant_id, v_kategori_kod, v_kalite_kod, p_kalite, true, false, now())
  RETURNING id INTO v_ref_id;
 
  RETURN v_ref_id;
END;
$$;


--
-- Name: sistem_preset_silinemez(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sistem_preset_silinemez() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.sistem_preset = true then
    raise exception 'Sistem presetleri silinemez';
  end if;
  return old;
end;
$$;


--
-- Name: soft_delete(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.soft_delete(p_tablo text, p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
BEGIN
  EXECUTE format(
    'UPDATE %I SET silindi = true, silinme_tarihi = now() WHERE id = $1',
    p_tablo
  ) USING p_id;
END;
$_$;


--
-- Name: sonraki_no(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sonraki_no(p_tip text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_no int;
BEGIN
  UPDATE sayac_tanimlari
  SET son_no = COALESCE(son_no, 0) + 1
  WHERE tip = p_tip
  RETURNING son_no INTO v_no;

  IF v_no IS NULL THEN
    INSERT INTO sayac_tanimlari (tip, son_no, prefix, yil_ekle, digits)
    VALUES (p_tip, 1, '', true, 3)
    ON CONFLICT (tip) DO UPDATE SET son_no = sayac_tanimlari.son_no + 1
    RETURNING son_no INTO v_no;
  END IF;

  RETURN v_no;
END;
$$;


--
-- Name: sync_kullanici_rol(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_kullanici_rol() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object('rol', NEW.rol, 'tenant_id', NEW.tenant_id::text)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: tg_panel_gorevler_guncellenme(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_panel_gorevler_guncellenme() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.guncellenme := now();
  IF NEW.durum = 'yapildi' AND (OLD.durum IS DISTINCT FROM 'yapildi') THEN
    NEW.tamamlanma := now();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: tg_pipeline_malzemeleri_ref_sync(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_pipeline_malzemeleri_ref_sync() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_ref malzeme_tanimlari%ROWTYPE;
BEGIN
  IF NEW.malzeme_ref_id IS NULL THEN
    NEW.malzeme_ref_id := malzeme_ref_bul(NEW.tenant_id, NEW.malzeme, NEW.kalite);
  END IF;

  IF NEW.malzeme_ref_id IS NOT NULL THEN
    SELECT * INTO v_ref FROM malzeme_tanimlari WHERE id = NEW.malzeme_ref_id;
    IF FOUND THEN
      NEW.malzeme := v_ref.kategori_kod;
      NEW.kalite  := v_ref.kalite_goster;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: tg_spool_malzemeleri_ref_sync(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_spool_malzemeleri_ref_sync() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_ref malzeme_tanimlari%ROWTYPE;
BEGIN
  -- 1. malzeme_ref_id boşsa ham değerlerden bul
  IF NEW.malzeme_ref_id IS NULL THEN
    NEW.malzeme_ref_id := malzeme_ref_bul(NEW.tenant_id, NEW.malzeme, NEW.kalite);
  END IF;

  -- 2. malzeme_ref_id doluysa text kolonları master'dan senkronla
  IF NEW.malzeme_ref_id IS NOT NULL THEN
    SELECT * INTO v_ref FROM malzeme_tanimlari WHERE id = NEW.malzeme_ref_id;
    IF FOUND THEN
      NEW.malzeme := v_ref.kategori_kod;
      NEW.kalite  := v_ref.kalite_goster;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_analizler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_analizler (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    fotograf_id uuid,
    spool_id uuid,
    claude_tahmin text,
    claude_guven numeric(4,3),
    claude_sonuc_json jsonb,
    model_tahmin text,
    model_guven numeric(4,3),
    model_sonuc_json jsonb,
    insan_karar text,
    insan_karar_id uuid,
    dogru_olan text,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_analizler_dogru_olan_check CHECK ((dogru_olan = ANY (ARRAY['claude'::text, 'model'::text, 'ikisi_de'::text, 'ikisi_de_yanlis'::text])))
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id bigint NOT NULL,
    tablo_adi text NOT NULL,
    kayit_id uuid,
    islem text NOT NULL,
    eski_deger jsonb,
    yeni_deger jsonb,
    yapan_id uuid,
    tarih timestamp with time zone DEFAULT now(),
    tenant_id uuid
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: basamak_sablonlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.basamak_sablonlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    firma_tipi text NOT NULL,
    sistem_adi text NOT NULL,
    gorunen_ad text NOT NULL,
    sira integer NOT NULL
);


--
-- Name: basamak_tanimlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.basamak_tanimlari (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    sistem_adi text NOT NULL,
    gorunen_ad text NOT NULL,
    sira integer NOT NULL,
    aktif boolean DEFAULT true NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    firma_tipi text DEFAULT 'imalat'::text,
    ilerleme_puani integer DEFAULT 0 NOT NULL,
    gorunen_ad_en text,
    gorunen_ad_ar text
);


--
-- Name: belgeler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.belgeler (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid,
    devre_id uuid,
    ad text NOT NULL,
    tur text NOT NULL,
    dosya_url text NOT NULL,
    dosya_boyut integer,
    yukleyen_id uuid,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    silindi boolean DEFAULT false,
    silinme_tarihi timestamp with time zone,
    CONSTRAINT belgeler_tur_check CHECK ((tur = ANY (ARRAY['izometri'::text, 'sertifika'::text, 'prosedur'::text, 'rapor'::text, 'diger'::text])))
);


--
-- Name: blok_sayfa_yetkileri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blok_sayfa_yetkileri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blok_id uuid,
    sayfa_kodu text NOT NULL,
    gizli_bolumler text[] DEFAULT '{}'::text[]
);


--
-- Name: bukum_kalemleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bukum_kalemleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    malzeme_id uuid,
    kesim_id uuid,
    olcu_mm numeric(10,2) NOT NULL,
    bukuldu boolean DEFAULT false NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    guncelleme timestamp with time zone
);


--
-- Name: customer_kullanicilar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_kullanicilar (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    ad_soyad text NOT NULL,
    unvan text,
    aktif boolean DEFAULT true NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    ilerleme_yontemi text DEFAULT 'adet'::text NOT NULL
);


--
-- Name: customer_project_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_project_access (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    proje_id uuid,
    erisim_tipi text DEFAULT 'goruntule'::text NOT NULL,
    aktif boolean DEFAULT true NOT NULL,
    baslangic date,
    bitis date,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_project_access_erisim_tipi_check CHECK ((erisim_tipi = ANY (ARRAY['goruntule'::text, 'yorum'::text])))
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    kod text NOT NULL,
    ad text NOT NULL,
    ulke text,
    sehir text,
    iletisim_ad text,
    iletisim_tel text,
    iletisim_mail text,
    aktif boolean DEFAULT true NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: devreler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devreler (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    proje_id uuid NOT NULL,
    devre_no text NOT NULL,
    ad text,
    alistirma_devresi boolean DEFAULT false NOT NULL,
    durum text DEFAULT 'aktif'::text NOT NULL,
    durdurma_sebebi text,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    silindi boolean DEFAULT false,
    silinme_tarihi timestamp with time zone,
    basamak_snapshot jsonb,
    is_emri_no text NOT NULL,
    guncelleme timestamp with time zone,
    agirlik numeric DEFAULT 0,
    zone text,
    termin date,
    malzeme text,
    yuzey text,
    ilerleme integer DEFAULT 0,
    aktif_basamak text,
    yuzey_aciklama text,
    CONSTRAINT devreler_durum_check CHECK ((durum = ANY (ARRAY['aktif'::text, 'durduruldu'::text, 'tamamlandi'::text, 'iptal'::text]))),
    CONSTRAINT devreler_is_emri_no_not_empty CHECK ((TRIM(BOTH FROM is_emri_no) <> ''::text))
);


--
-- Name: egitim_verisi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egitim_verisi (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    pdf_dosya_adi text,
    pdf_icerik text,
    claude_ciktisi jsonb,
    kullanici_ciktisi jsonb,
    onaylandi boolean DEFAULT false,
    olusturma timestamp with time zone DEFAULT now(),
    kaynak_tipi text DEFAULT 'serbest_foto'::text,
    fotograf_url text,
    etiketler jsonb DEFAULT '[]'::jsonb,
    egitim_durumu text DEFAULT 'bekliyor'::text,
    dogrulayici_id uuid,
    onay_notu text,
    spool_id uuid,
    meta jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT egitim_verisi_egitim_durumu_check CHECK ((egitim_durumu = ANY (ARRAY['bekliyor'::text, 'onaylandi'::text, 'reddedildi'::text, 'kullanildi'::text]))),
    CONSTRAINT egitim_verisi_kaynak_tipi_check CHECK ((kaynak_tipi = ANY (ARRAY['spool_foto'::text, 'serbest_foto'::text, 'tersane_geri_bildirim'::text, 'arsiv'::text, 'standart'::text, 'dxf'::text, 'video'::text])))
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kod text NOT NULL,
    ad text NOT NULL,
    aciklama text,
    varsayilan boolean DEFAULT false
);


--
-- Name: feedback_kayitlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_kayitlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    kullanici_id uuid,
    sayfa_url text NOT NULL,
    kategori text,
    not_ text NOT NULL,
    fotograf_url text,
    durum text DEFAULT 'yeni'::text,
    olusturma timestamp with time zone DEFAULT now(),
    yanit text,
    yanit_tarihi timestamp with time zone,
    yanit_veren_id uuid,
    CONSTRAINT feedback_kayitlari_durum_check CHECK ((durum = ANY (ARRAY['yeni'::text, 'inceleniyor'::text, 'yapilacak'::text, 'yapildi'::text, 'reddedildi'::text]))),
    CONSTRAINT feedback_kayitlari_kategori_check CHECK ((kategori = ANY (ARRAY['hata'::text, 'eksik'::text, 'fikir'::text])))
);


--
-- Name: firma_moduller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firma_moduller (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    modul_kodu text NOT NULL,
    aktif boolean DEFAULT true,
    olusturma timestamp with time zone DEFAULT now()
);


--
-- Name: fotograflar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fotograflar (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    baslik text,
    islem_turu text,
    dosya_url text NOT NULL,
    yukleyen_id uuid,
    ai_kontrol boolean DEFAULT false NOT NULL,
    ai_sonuc jsonb,
    ai_etiketler jsonb,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    aciklama text,
    yapan_id text,
    ai_analiz jsonb,
    ai_skor numeric,
    ai_uyari text[],
    ai_durum text,
    annotasyonlar jsonb
);


--
-- Name: hakedis_kriterleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hakedis_kriterleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    tersane_id uuid NOT NULL,
    dn_min integer DEFAULT 0 NOT NULL,
    dn_max integer,
    malzeme text DEFAULT 'tumu'::text NOT NULL,
    adet_fiyat numeric(12,2),
    kg_fiyat numeric(12,2),
    aktif boolean DEFAULT true NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hakedis_paketleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hakedis_paketleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    tersane_id uuid NOT NULL,
    kod text,
    ad text NOT NULL,
    tarih date NOT NULL,
    durum text DEFAULT 'taslak'::text NOT NULL,
    onay_tarihi date,
    not_ text,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    silindi boolean DEFAULT false,
    silinme_tarihi timestamp with time zone,
    CONSTRAINT hakedis_paketleri_durum_check CHECK ((durum = ANY (ARRAY['taslak'::text, 'sunuldu'::text, 'onaylandi'::text, 'kismi'::text, 'reddedildi'::text])))
);


--
-- Name: hakedis_spooller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hakedis_spooller (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    paket_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    kriter_id uuid,
    adet_tutar numeric(12,2) DEFAULT 0 NOT NULL,
    kg_tutar numeric(12,2) DEFAULT 0 NOT NULL,
    toplam_tutar numeric(12,2) DEFAULT 0 NOT NULL,
    durum text DEFAULT 'bekliyor'::text NOT NULL,
    red_nedeni text,
    onceki_paket_id uuid,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT hakedis_spooller_durum_check CHECK ((durum = ANY (ARRAY['bekliyor'::text, 'onaylandi'::text, 'reddedildi'::text])))
);


--
-- Name: ifs_material_alias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ifs_material_alias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    ham_yazim text NOT NULL,
    kalite_kod text NOT NULL,
    aciklama text,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    guncelleme timestamp with time zone,
    CONSTRAINT ifs_alias_ham_nonempty CHECK ((length(TRIM(BOTH FROM ham_yazim)) > 0)),
    CONSTRAINT ifs_alias_kod_nonempty CHECK ((length(TRIM(BOTH FROM kalite_kod)) > 0))
);


--
-- Name: TABLE ifs_material_alias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ifs_material_alias IS 'IFS/Excel ham yazım --> canonical kalite_kod eşleme. Regex kapsayamadığı durumlar için son şans katmanı. malzeme_ref_bul() regex NULL dönünce buraya bakar.';


--
-- Name: COLUMN ifs_material_alias.tenant_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ifs_material_alias.tenant_id IS 'NULL = sistem geneli alias (tüm firmalar görür). Dolu = o firmaya özel alias.';


--
-- Name: COLUMN ifs_material_alias.ham_yazim; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ifs_material_alias.ham_yazim IS 'IFS/Excel import çıktısındaki ham yazım (örn. "ST 52-3 N").';


--
-- Name: COLUMN ifs_material_alias.kalite_kod; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ifs_material_alias.kalite_kod IS 'Bu ham yazımın karşılık geldiği canonical kalite kodu (örn. "ST52").';


--
-- Name: is_kayitlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.is_kayitlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    personel_id uuid NOT NULL,
    islem_tipi text NOT NULL,
    baslangic timestamp with time zone NOT NULL,
    bitis timestamp with time zone,
    sure_dakika integer GENERATED ALWAYS AS (
CASE
    WHEN (bitis IS NOT NULL) THEN ((EXTRACT(epoch FROM (bitis - baslangic)))::integer / 60)
    ELSE NULL::integer
END) STORED,
    dia_inch numeric,
    agirlik_kg numeric,
    kaynak_adedi integer,
    fotograf_id uuid,
    ai_analiz jsonb,
    notlar text,
    qr_baslangic boolean DEFAULT false,
    qr_bitis boolean DEFAULT false,
    olusturma timestamp with time zone DEFAULT now()
);


--
-- Name: islem_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.islem_log (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    katman text NOT NULL,
    katman_id uuid,
    islem text NOT NULL,
    yapan_id uuid,
    aciklama text,
    meta jsonb,
    spool_id uuid,
    devre_id uuid,
    proje_id uuid,
    olusturma timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kesim_kalemleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kesim_kalemleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    malzeme_id uuid,
    olcu_mm numeric(10,2) NOT NULL,
    uc_a text DEFAULT 'duz'::text NOT NULL,
    uc_b text DEFAULT 'duz'::text NOT NULL,
    bukum_borusu boolean DEFAULT false NOT NULL,
    kesildi boolean DEFAULT false NOT NULL,
    kesim_listesi_no text,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    guncelleme timestamp with time zone,
    kesim_listesi_id uuid,
    CONSTRAINT kesim_kalemleri_uc_a_check CHECK ((uc_a = ANY (ARRAY['duz'::text, 'kaynak'::text, 'yiv'::text, 'dis'::text, 'bukum'::text]))),
    CONSTRAINT kesim_kalemleri_uc_b_check CHECK ((uc_b = ANY (ARRAY['duz'::text, 'kaynak'::text, 'yiv'::text, 'dis'::text, 'bukum'::text])))
);


--
-- Name: kesim_listeleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kesim_listeleri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    no text NOT NULL,
    kriter jsonb,
    kapali boolean DEFAULT false,
    arsiv jsonb DEFAULT '[]'::jsonb,
    olusturma timestamp with time zone DEFAULT now(),
    boru_ids jsonb DEFAULT '[]'::jsonb,
    kesim_plani jsonb
);


--
-- Name: kk_davet_spooller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kk_davet_spooller (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    davet_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    sonuc text DEFAULT 'bekliyor'::text,
    not_ text,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kk_davet_spooller_sonuc_check CHECK ((sonuc = ANY (ARRAY['gecti'::text, 'hatali'::text, 'tamir'::text, 'bekliyor'::text])))
);


--
-- Name: kk_davetler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kk_davetler (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    tersane_id uuid NOT NULL,
    davet_no text NOT NULL,
    tarih date NOT NULL,
    durum text DEFAULT 'bekliyor'::text NOT NULL,
    not_ text,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kk_davetler_durum_check CHECK ((durum = ANY (ARRAY['bekliyor'::text, 'tamamlandi'::text])))
);


--
-- Name: kullanici_bloklar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kullanici_bloklar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    kullanici_id uuid,
    blok_id uuid,
    ekleyen_id uuid,
    olusturma timestamp with time zone DEFAULT now()
);


--
-- Name: kullanici_yetkileri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kullanici_yetkileri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    kullanici_id uuid NOT NULL,
    yetki_kodu text NOT NULL,
    aktif boolean DEFAULT true,
    aciklama text,
    ekleyen_id uuid,
    olusturma timestamp with time zone DEFAULT now()
);


--
-- Name: kullanicilar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kullanicilar (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    ad_soyad text NOT NULL,
    rol text DEFAULT 'yonetici'::text NOT NULL,
    aktif boolean DEFAULT true NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    son_giris timestamp with time zone,
    davet_eden uuid,
    firma text,
    brans text,
    foto_url text,
    tel text,
    guncelleme timestamp with time zone DEFAULT now(),
    kendi_personel boolean DEFAULT false,
    notlar text,
    ui_tercihleri jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT kullanicilar_rol_check CHECK ((rol = ANY (ARRAY['super_admin'::text, 'firma_admin'::text, 'yonetici'::text, 'kk_uzmani'::text, 'operatör'::text, 'musteri'::text])))
);


--
-- Name: malzeme_tanimlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.malzeme_tanimlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    kategori_kod text NOT NULL,
    kalite_kod text NOT NULL,
    aciklama_tr text,
    aciklama_en text,
    aciklama_ar text,
    notlar text,
    aktif boolean DEFAULT true,
    sistem_preset boolean DEFAULT false,
    olusturma timestamp with time zone DEFAULT now(),
    kalite_goster text,
    standart text,
    CONSTRAINT check_sistem_preset_tenant CHECK ((((sistem_preset = true) AND (tenant_id IS NULL)) OR (sistem_preset = false))),
    CONSTRAINT malzeme_tanimlari_kategori_kod_check CHECK ((kategori_kod = ANY (ARRAY['karbon'::text, 'paslanmaz'::text, 'bakir'::text, 'alum'::text, 'diger'::text])))
);


--
-- Name: markalama_kalemleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markalama_kalemleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    malzeme_id uuid,
    tip text DEFAULT 'otomatik'::text NOT NULL,
    markalama_listesi_no text,
    markalandi boolean DEFAULT false NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    guncelleme timestamp with time zone,
    malzeme_adi text,
    yuzey text,
    et_mm numeric,
    malzeme text,
    CONSTRAINT markalama_kalemleri_tip_check CHECK ((tip = ANY (ARRAY['otomatik'::text, 'plaka'::text, 'manuel'::text])))
);


--
-- Name: markalama_listeleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markalama_listeleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    ml_no text NOT NULL,
    durum text DEFAULT 'aktif'::text,
    olusturan_id uuid,
    olusturma timestamp with time zone DEFAULT now(),
    kapanma timestamp with time zone
);


--
-- Name: markalama_listesi_kalemleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markalama_listesi_kalemleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    liste_id uuid,
    kalem_id uuid,
    markalandi boolean DEFAULT false
);


--
-- Name: notlar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notlar (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid,
    metin text NOT NULL,
    qr_goster boolean DEFAULT true NOT NULL,
    ekleyen_id uuid,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    silindi boolean DEFAULT false,
    silinme_tarihi timestamp with time zone,
    devre_id uuid
);


--
-- Name: panel_gorevler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.panel_gorevler (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    baslik text NOT NULL,
    aciklama text,
    kategori text,
    oncelik text DEFAULT 'orta'::text NOT NULL,
    durum text DEFAULT 'yeni'::text NOT NULL,
    kaynak text DEFAULT 'manuel'::text NOT NULL,
    kaynak_id uuid,
    katman text,
    faz text,
    olusturan_id uuid,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    guncellenme timestamp with time zone DEFAULT now() NOT NULL,
    tamamlanma timestamp with time zone,
    notlar text,
    CONSTRAINT panel_gorevler_durum_check CHECK ((durum = ANY (ARRAY['yeni'::text, 'inceleniyor'::text, 'yapilacak'::text, 'yapildi'::text, 'reddedildi'::text]))),
    CONSTRAINT panel_gorevler_kategori_check CHECK (((kategori IS NULL) OR (kategori = ANY (ARRAY['altyapi'::text, 'ozellik'::text, 'hata'::text, 'bakim'::text])))),
    CONSTRAINT panel_gorevler_kaynak_check CHECK ((kaynak = ANY (ARRAY['manuel'::text, 'feedback_donusumu'::text, 'roadmap'::text, 'vizyon'::text]))),
    CONSTRAINT panel_gorevler_oncelik_check CHECK ((oncelik = ANY (ARRAY['acil'::text, 'yuksek'::text, 'orta'::text, 'dusuk'::text])))
);


--
-- Name: pipeline_malzemeleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipeline_malzemeleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    devre_id uuid,
    pipeline_no text NOT NULL,
    kod text,
    tanim text,
    malzeme text,
    kalite text,
    dis_cap_mm numeric,
    et_mm numeric,
    boy_mm numeric,
    adet numeric,
    agirlik_kg numeric,
    sertifikali boolean DEFAULT false,
    olusturma timestamp with time zone DEFAULT now(),
    hazir boolean DEFAULT false NOT NULL,
    malzeme_ref_id uuid
);


--
-- Name: projeler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projeler (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    tersane_id uuid NOT NULL,
    proje_no text NOT NULL,
    gemi_adi text,
    proje_tipi text DEFAULT 'ana_yuklenici'::text NOT NULL,
    ana_yuklenici text,
    teslim_tarihi date,
    aktif boolean DEFAULT true NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projeler_proje_tipi_check CHECK ((proje_tipi = ANY (ARRAY['ana_yuklenici'::text, 'taseron'::text])))
);


--
-- Name: public_feedback; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_feedback AS
 SELECT id,
    sayfa_url,
    kategori,
    not_,
    olusturma
   FROM public.feedback_kayitlari
  WHERE (durum = 'onaylandi'::text)
  ORDER BY olusturma DESC;


--
-- Name: rol_sablonlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol_sablonlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    rol text NOT NULL,
    yetki_kodu text NOT NULL,
    aktif boolean DEFAULT true
);


--
-- Name: sayac_tanimlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sayac_tanimlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    tip text NOT NULL,
    son_no integer DEFAULT 0,
    prefix text DEFAULT ''::text,
    yil_ekle boolean DEFAULT true,
    digits integer DEFAULT 3,
    aciklama text
);


--
-- Name: seq_hakedis_no; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seq_hakedis_no
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seq_is_emri; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seq_is_emri
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seq_spool_no; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seq_spool_no
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sevkiyat_spooller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sevkiyat_spooller (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    sevkiyat_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sevkiyatlar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sevkiyatlar (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    tersane_id uuid NOT NULL,
    sevk_no text NOT NULL,
    sevk_fis_no text,
    tip text DEFAULT 'giden_spool'::text NOT NULL,
    tarih date NOT NULL,
    arac_plaka text,
    irsaliye_no text,
    teslim_alan text,
    not_ text,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sevkiyatlar_tip_check CHECK ((tip = ANY (ARRAY['giden_spool'::text, 'gelen_malzeme'::text, 'serbest_giden'::text])))
);


--
-- Name: spool_malzemeleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spool_malzemeleri (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    kod text,
    aciklama text,
    malzeme text,
    kalite text,
    dis_cap_mm numeric(8,2),
    et_mm numeric(6,3),
    boy_mm numeric(10,2),
    adet integer DEFAULT 0,
    agirlik_kg numeric(10,3),
    heat_no text,
    sertifikali boolean DEFAULT false NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    tanim text,
    boyut text,
    miktar numeric,
    ifs_kod text,
    tip text DEFAULT 'boru'::text,
    x1_mm numeric,
    y1_mm numeric,
    z1_mm numeric,
    x2_mm numeric,
    y2_mm numeric,
    z2_mm numeric,
    malzeme_ref_id uuid
);


--
-- Name: spooller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spooller (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    devre_id uuid NOT NULL,
    spool_no text NOT NULL,
    pipeline_no text,
    dis_cap_mm numeric(8,2),
    et_kalinligi_mm numeric(6,3),
    agirlik_kg numeric(10,3),
    malzeme text,
    yuzey_islemi text,
    aktif_basamak text,
    durduruldu boolean DEFAULT false NOT NULL,
    durdurma_sebebi text,
    durdurma_tarihi timestamp with time zone,
    alistirma text,
    basamak_snapshot jsonb,
    imalat_kg numeric(10,3),
    imalat_di numeric(10,2),
    argon_di numeric(10,2),
    gazalti_di numeric(10,2),
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    guncelleme timestamp with time zone DEFAULT now() NOT NULL,
    silindi boolean DEFAULT false,
    silinme_tarihi timestamp with time zone,
    rev text DEFAULT ''::text NOT NULL,
    agirlik numeric DEFAULT 0,
    kalite text,
    yuzey text,
    durum text,
    spool_id text,
    segmentler_json jsonb,
    bbox_json jsonb,
    ilerleme integer DEFAULT 0 NOT NULL,
    is_durumu text DEFAULT 'bekliyor'::text NOT NULL,
    yuzey_aciklama text,
    CONSTRAINT malzeme_yuzey_uyumu CHECK (((malzeme IS NULL) OR (yuzey IS NULL) OR (malzeme = 'diger'::text) OR (yuzey = 'diger'::text) OR (NOT (((malzeme = 'paslanmaz'::text) AND (yuzey = ANY (ARRAY['galvaniz'::text, 'siyah'::text, 'boyali'::text]))) OR ((malzeme = 'bakir'::text) AND (yuzey = ANY (ARRAY['galvaniz'::text, 'siyah'::text, 'boyali'::text]))) OR ((malzeme = 'alum'::text) AND (yuzey = ANY (ARRAY['galvaniz'::text, 'siyah'::text]))))))),
    CONSTRAINT spooller_alistirma_check CHECK ((alistirma = ANY (ARRAY['VAR'::text, 'KISMI'::text, 'YOK'::text])))
);


--
-- Name: tarama_sonuclari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarama_sonuclari (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    spool_id uuid NOT NULL,
    rapor_url text,
    gorsel_url text,
    sapma_json jsonb,
    max_sapma_mm numeric(8,3),
    onaylandi boolean DEFAULT false NOT NULL,
    onaylayan_id uuid,
    tarih date NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_features (
    tenant_id uuid NOT NULL,
    feature_kod text NOT NULL,
    aktif boolean DEFAULT false
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    ad text NOT NULL,
    plan text DEFAULT 'demo'::text NOT NULL,
    aktif boolean DEFAULT true NOT NULL,
    demo_bitis timestamp with time zone,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    iletisim_email text,
    iletisim_tel text,
    ulke text DEFAULT 'TR'::text,
    notlar text,
    son_odeme timestamp with time zone,
    aylik_ucret numeric(10,2) DEFAULT 0,
    firma_tipi text DEFAULT 'imalat'::text,
    hesap_tipi text DEFAULT 'demo'::text,
    ilerleme_yontemi text DEFAULT 'adet'::text NOT NULL,
    kod character varying(4) NOT NULL,
    CONSTRAINT tenants_firma_tipi_check CHECK ((firma_tipi = ANY (ARRAY['imalat'::text, 'montaj'::text, 'imalat_montaj'::text, 'tersane_tam'::text, 'tersane_taseron'::text, 'tersane_karma'::text, 'diger'::text]))),
    CONSTRAINT tenants_hesap_tipi_check CHECK ((hesap_tipi = ANY (ARRAY['demo'::text, 'pilot'::text, 'production'::text, 'dev'::text]))),
    CONSTRAINT tenants_kod_format CHECK (((kod)::text ~ '^[A-Z]{1,4}$'::text)),
    CONSTRAINT tenants_plan_check CHECK ((plan = ANY (ARRAY['demo'::text, 'starter'::text, 'pro'::text, 'enterprise'::text])))
);


--
-- Name: tersane_firma_iliskileri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tersane_firma_iliskileri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tersane_id uuid NOT NULL,
    firma_id uuid NOT NULL,
    aktif boolean DEFAULT true,
    olusturma timestamp with time zone DEFAULT now()
);


--
-- Name: tersaneler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tersaneler (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    kod text NOT NULL,
    ad text NOT NULL,
    iletisim text,
    aktif boolean DEFAULT true NOT NULL,
    olusturma timestamp with time zone DEFAULT now() NOT NULL,
    customer_id uuid,
    sehir text,
    kisa_ad text
);


--
-- Name: test_spooller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_spooller (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    test_id uuid,
    spool_id uuid,
    sonuc text DEFAULT 'bekliyor'::text,
    hata_kaynagi text,
    not_ text,
    olusturma timestamp with time zone DEFAULT now()
);


--
-- Name: testler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testler (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    devre_id uuid,
    test_no text,
    tip text NOT NULL,
    tip_ad text,
    oran_yuzde integer,
    firma text,
    durum text DEFAULT 'bekliyor'::text,
    not_ text,
    tarih date,
    olusturma timestamp with time zone DEFAULT now(),
    guncelleme timestamp with time zone DEFAULT now(),
    sonuc_tarih date,
    sonuc_bas time without time zone,
    sonuc_bit time without time zone,
    sonuc_kisi text,
    sonuc_genel text,
    sonuc_not text
);


--
-- Name: yetki_bloklari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yetki_bloklari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    ad text NOT NULL,
    aciklama text,
    renk text DEFAULT '#2D8EFF'::text,
    sistem_preset boolean DEFAULT false,
    olusturma timestamp with time zone DEFAULT now(),
    grup text,
    sira integer DEFAULT 0
);


--
-- Name: yetki_tanimlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yetki_tanimlari (
    kod text NOT NULL,
    ad text NOT NULL,
    aciklama text,
    kategori text,
    sira integer DEFAULT 0
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: ai_analizler ai_analizler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analizler
    ADD CONSTRAINT ai_analizler_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: basamak_sablonlari basamak_sablonlari_firma_tipi_sistem_adi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basamak_sablonlari
    ADD CONSTRAINT basamak_sablonlari_firma_tipi_sistem_adi_key UNIQUE (firma_tipi, sistem_adi);


--
-- Name: basamak_sablonlari basamak_sablonlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basamak_sablonlari
    ADD CONSTRAINT basamak_sablonlari_pkey PRIMARY KEY (id);


--
-- Name: basamak_tanimlari basamak_tanimlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basamak_tanimlari
    ADD CONSTRAINT basamak_tanimlari_pkey PRIMARY KEY (id);


--
-- Name: basamak_tanimlari basamak_tanimlari_tenant_id_sistem_adi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basamak_tanimlari
    ADD CONSTRAINT basamak_tanimlari_tenant_id_sistem_adi_key UNIQUE (tenant_id, sistem_adi);


--
-- Name: belgeler belgeler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.belgeler
    ADD CONSTRAINT belgeler_pkey PRIMARY KEY (id);


--
-- Name: blok_sayfa_yetkileri blok_sayfa_yetkileri_blok_id_sayfa_kodu_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blok_sayfa_yetkileri
    ADD CONSTRAINT blok_sayfa_yetkileri_blok_id_sayfa_kodu_key UNIQUE (blok_id, sayfa_kodu);


--
-- Name: blok_sayfa_yetkileri blok_sayfa_yetkileri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blok_sayfa_yetkileri
    ADD CONSTRAINT blok_sayfa_yetkileri_pkey PRIMARY KEY (id);


--
-- Name: bukum_kalemleri bukum_kalemleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bukum_kalemleri
    ADD CONSTRAINT bukum_kalemleri_pkey PRIMARY KEY (id);


--
-- Name: customer_kullanicilar customer_kullanicilar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_kullanicilar
    ADD CONSTRAINT customer_kullanicilar_pkey PRIMARY KEY (id);


--
-- Name: customer_project_access customer_project_access_customer_id_tenant_id_proje_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_project_access
    ADD CONSTRAINT customer_project_access_customer_id_tenant_id_proje_id_key UNIQUE (customer_id, tenant_id, proje_id);


--
-- Name: customer_project_access customer_project_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_project_access
    ADD CONSTRAINT customer_project_access_pkey PRIMARY KEY (id);


--
-- Name: customers customers_kod_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_kod_key UNIQUE (kod);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: devreler devreler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devreler
    ADD CONSTRAINT devreler_pkey PRIMARY KEY (id);


--
-- Name: egitim_verisi egitim_verisi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_verisi
    ADD CONSTRAINT egitim_verisi_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_kod_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_kod_key UNIQUE (kod);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: feedback_kayitlari feedback_kayitlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_kayitlari
    ADD CONSTRAINT feedback_kayitlari_pkey PRIMARY KEY (id);


--
-- Name: firma_moduller firma_moduller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firma_moduller
    ADD CONSTRAINT firma_moduller_pkey PRIMARY KEY (id);


--
-- Name: firma_moduller firma_moduller_tenant_id_modul_kodu_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firma_moduller
    ADD CONSTRAINT firma_moduller_tenant_id_modul_kodu_key UNIQUE (tenant_id, modul_kodu);


--
-- Name: fotograflar fotograflar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotograflar
    ADD CONSTRAINT fotograflar_pkey PRIMARY KEY (id);


--
-- Name: hakedis_kriterleri hakedis_kriterleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_kriterleri
    ADD CONSTRAINT hakedis_kriterleri_pkey PRIMARY KEY (id);


--
-- Name: hakedis_paketleri hakedis_paketleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_paketleri
    ADD CONSTRAINT hakedis_paketleri_pkey PRIMARY KEY (id);


--
-- Name: hakedis_paketleri hakedis_paketleri_tenant_id_kod_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_paketleri
    ADD CONSTRAINT hakedis_paketleri_tenant_id_kod_key UNIQUE (tenant_id, kod);


--
-- Name: hakedis_spooller hakedis_spooller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_spooller
    ADD CONSTRAINT hakedis_spooller_pkey PRIMARY KEY (id);


--
-- Name: ifs_material_alias ifs_material_alias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ifs_material_alias
    ADD CONSTRAINT ifs_material_alias_pkey PRIMARY KEY (id);


--
-- Name: is_kayitlari is_kayitlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_kayitlari
    ADD CONSTRAINT is_kayitlari_pkey PRIMARY KEY (id);


--
-- Name: islem_log islem_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.islem_log
    ADD CONSTRAINT islem_log_pkey PRIMARY KEY (id);


--
-- Name: kesim_kalemleri kesim_kalemleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesim_kalemleri
    ADD CONSTRAINT kesim_kalemleri_pkey PRIMARY KEY (id);


--
-- Name: kesim_listeleri kesim_listeleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesim_listeleri
    ADD CONSTRAINT kesim_listeleri_pkey PRIMARY KEY (id);


--
-- Name: kk_davet_spooller kk_davet_spooller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_davet_spooller
    ADD CONSTRAINT kk_davet_spooller_pkey PRIMARY KEY (id);


--
-- Name: kk_davetler kk_davetler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_davetler
    ADD CONSTRAINT kk_davetler_pkey PRIMARY KEY (id);


--
-- Name: kk_davetler kk_davetler_tenant_id_davet_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_davetler
    ADD CONSTRAINT kk_davetler_tenant_id_davet_no_key UNIQUE (tenant_id, davet_no);


--
-- Name: kullanici_bloklar kullanici_bloklar_kullanici_id_blok_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_bloklar
    ADD CONSTRAINT kullanici_bloklar_kullanici_id_blok_id_key UNIQUE (kullanici_id, blok_id);


--
-- Name: kullanici_bloklar kullanici_bloklar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_bloklar
    ADD CONSTRAINT kullanici_bloklar_pkey PRIMARY KEY (id);


--
-- Name: kullanici_yetkileri kullanici_yetkileri_kullanici_id_yetki_kodu_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_yetkileri
    ADD CONSTRAINT kullanici_yetkileri_kullanici_id_yetki_kodu_key UNIQUE (kullanici_id, yetki_kodu);


--
-- Name: kullanici_yetkileri kullanici_yetkileri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_yetkileri
    ADD CONSTRAINT kullanici_yetkileri_pkey PRIMARY KEY (id);


--
-- Name: kullanicilar kullanicilar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanicilar
    ADD CONSTRAINT kullanicilar_pkey PRIMARY KEY (id);


--
-- Name: malzeme_tanimlari malzeme_tanimlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.malzeme_tanimlari
    ADD CONSTRAINT malzeme_tanimlari_pkey PRIMARY KEY (id);


--
-- Name: malzeme_tanimlari malzeme_tanimlari_tenant_id_kategori_kod_kalite_kod_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.malzeme_tanimlari
    ADD CONSTRAINT malzeme_tanimlari_tenant_id_kategori_kod_kalite_kod_key UNIQUE (tenant_id, kategori_kod, kalite_kod);


--
-- Name: markalama_kalemleri markalama_kalemleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markalama_kalemleri
    ADD CONSTRAINT markalama_kalemleri_pkey PRIMARY KEY (id);


--
-- Name: markalama_listeleri markalama_listeleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markalama_listeleri
    ADD CONSTRAINT markalama_listeleri_pkey PRIMARY KEY (id);


--
-- Name: markalama_listesi_kalemleri markalama_listesi_kalemleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markalama_listesi_kalemleri
    ADD CONSTRAINT markalama_listesi_kalemleri_pkey PRIMARY KEY (id);


--
-- Name: notlar notlar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notlar
    ADD CONSTRAINT notlar_pkey PRIMARY KEY (id);


--
-- Name: panel_gorevler panel_gorevler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.panel_gorevler
    ADD CONSTRAINT panel_gorevler_pkey PRIMARY KEY (id);


--
-- Name: pipeline_malzemeleri pipeline_malzemeleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_malzemeleri
    ADD CONSTRAINT pipeline_malzemeleri_pkey PRIMARY KEY (id);


--
-- Name: projeler projeler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projeler
    ADD CONSTRAINT projeler_pkey PRIMARY KEY (id);


--
-- Name: projeler projeler_tenant_id_proje_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projeler
    ADD CONSTRAINT projeler_tenant_id_proje_no_key UNIQUE (tenant_id, proje_no);


--
-- Name: rol_sablonlari rol_sablonlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_sablonlari
    ADD CONSTRAINT rol_sablonlari_pkey PRIMARY KEY (id);


--
-- Name: rol_sablonlari rol_sablonlari_tenant_id_rol_yetki_kodu_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_sablonlari
    ADD CONSTRAINT rol_sablonlari_tenant_id_rol_yetki_kodu_key UNIQUE (tenant_id, rol, yetki_kodu);


--
-- Name: sayac_tanimlari sayac_tanimlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sayac_tanimlari
    ADD CONSTRAINT sayac_tanimlari_pkey PRIMARY KEY (id);


--
-- Name: sayac_tanimlari sayac_tanimlari_tenant_id_tip_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sayac_tanimlari
    ADD CONSTRAINT sayac_tanimlari_tenant_id_tip_key UNIQUE (tenant_id, tip);


--
-- Name: sevkiyat_spooller sevkiyat_spooller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sevkiyat_spooller
    ADD CONSTRAINT sevkiyat_spooller_pkey PRIMARY KEY (id);


--
-- Name: sevkiyatlar sevkiyatlar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sevkiyatlar
    ADD CONSTRAINT sevkiyatlar_pkey PRIMARY KEY (id);


--
-- Name: sevkiyatlar sevkiyatlar_tenant_id_sevk_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sevkiyatlar
    ADD CONSTRAINT sevkiyatlar_tenant_id_sevk_no_key UNIQUE (tenant_id, sevk_no);


--
-- Name: spool_malzemeleri spool_malzemeleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spool_malzemeleri
    ADD CONSTRAINT spool_malzemeleri_pkey PRIMARY KEY (id);


--
-- Name: spooller spooller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spooller
    ADD CONSTRAINT spooller_pkey PRIMARY KEY (id);


--
-- Name: tarama_sonuclari tarama_sonuclari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarama_sonuclari
    ADD CONSTRAINT tarama_sonuclari_pkey PRIMARY KEY (id);


--
-- Name: tenant_features tenant_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT tenant_features_pkey PRIMARY KEY (tenant_id, feature_kod);


--
-- Name: tenants tenants_kod_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_kod_unique UNIQUE (kod);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tersane_firma_iliskileri tersane_firma_iliskileri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tersane_firma_iliskileri
    ADD CONSTRAINT tersane_firma_iliskileri_pkey PRIMARY KEY (id);


--
-- Name: tersane_firma_iliskileri tersane_firma_iliskileri_tersane_id_firma_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tersane_firma_iliskileri
    ADD CONSTRAINT tersane_firma_iliskileri_tersane_id_firma_id_key UNIQUE (tersane_id, firma_id);


--
-- Name: tersaneler tersaneler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tersaneler
    ADD CONSTRAINT tersaneler_pkey PRIMARY KEY (id);


--
-- Name: tersaneler tersaneler_tenant_id_kod_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tersaneler
    ADD CONSTRAINT tersaneler_tenant_id_kod_key UNIQUE (tenant_id, kod);


--
-- Name: test_spooller test_spooller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_spooller
    ADD CONSTRAINT test_spooller_pkey PRIMARY KEY (id);


--
-- Name: testler testler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testler
    ADD CONSTRAINT testler_pkey PRIMARY KEY (id);


--
-- Name: yetki_bloklari yetki_bloklari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yetki_bloklari
    ADD CONSTRAINT yetki_bloklari_pkey PRIMARY KEY (id);


--
-- Name: yetki_tanimlari yetki_tanimlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yetki_tanimlari
    ADD CONSTRAINT yetki_tanimlari_pkey PRIMARY KEY (kod);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: devreler_unique_aktif; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX devreler_unique_aktif ON public.devreler USING btree (tenant_id, proje_id, devre_no) WHERE (silindi = false);


--
-- Name: egitim_verisi_onaylandi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX egitim_verisi_onaylandi_idx ON public.egitim_verisi USING btree (onaylandi);


--
-- Name: egitim_verisi_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX egitim_verisi_tenant_id_idx ON public.egitim_verisi USING btree (tenant_id);


--
-- Name: idx_ai_analizler_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_analizler_tenant ON public.ai_analizler USING btree (tenant_id);


--
-- Name: idx_audit_log_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_tenant ON public.audit_log USING btree (tenant_id, tarih DESC);


--
-- Name: idx_basamak_tanimlari_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_basamak_tanimlari_tenant ON public.basamak_tanimlari USING btree (tenant_id);


--
-- Name: idx_belgeler_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_belgeler_spool ON public.belgeler USING btree (spool_id);


--
-- Name: idx_belgeler_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_belgeler_tenant ON public.belgeler USING btree (tenant_id);


--
-- Name: idx_bukum_kalemleri_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bukum_kalemleri_spool ON public.bukum_kalemleri USING btree (spool_id);


--
-- Name: idx_bukum_kalemleri_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bukum_kalemleri_tenant ON public.bukum_kalemleri USING btree (tenant_id);


--
-- Name: idx_customer_access_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_access_customer ON public.customer_project_access USING btree (customer_id);


--
-- Name: idx_customer_access_proje; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_access_proje ON public.customer_project_access USING btree (proje_id);


--
-- Name: idx_customer_access_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_access_tenant ON public.customer_project_access USING btree (tenant_id);


--
-- Name: idx_customer_kul_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_kul_customer ON public.customer_kullanicilar USING btree (customer_id);


--
-- Name: idx_devreler_is_emri; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devreler_is_emri ON public.devreler USING btree (is_emri_no);


--
-- Name: idx_devreler_proje; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devreler_proje ON public.devreler USING btree (proje_id);


--
-- Name: idx_devreler_proje_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devreler_proje_id ON public.devreler USING btree (proje_id);


--
-- Name: idx_devreler_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devreler_tenant ON public.devreler USING btree (tenant_id);


--
-- Name: idx_fotograflar_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotograflar_spool ON public.fotograflar USING btree (spool_id);


--
-- Name: idx_fotograflar_spool_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotograflar_spool_tenant ON public.fotograflar USING btree (spool_id, tenant_id);


--
-- Name: idx_fotograflar_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotograflar_tenant ON public.fotograflar USING btree (tenant_id);


--
-- Name: idx_hakedis_paketleri_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hakedis_paketleri_tenant ON public.hakedis_paketleri USING btree (tenant_id);


--
-- Name: idx_hakedis_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hakedis_spool ON public.hakedis_spooller USING btree (spool_id);


--
-- Name: idx_hakedis_spooller_paket; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hakedis_spooller_paket ON public.hakedis_spooller USING btree (paket_id);


--
-- Name: idx_is_kayitlari_baslangic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_is_kayitlari_baslangic ON public.is_kayitlari USING btree (baslangic);


--
-- Name: idx_is_kayitlari_personel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_is_kayitlari_personel ON public.is_kayitlari USING btree (personel_id);


--
-- Name: idx_is_kayitlari_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_is_kayitlari_spool ON public.is_kayitlari USING btree (spool_id);


--
-- Name: idx_is_kayitlari_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_is_kayitlari_tenant ON public.is_kayitlari USING btree (tenant_id);


--
-- Name: idx_islem_log_devre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_islem_log_devre ON public.islem_log USING btree (devre_id);


--
-- Name: idx_islem_log_katman; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_islem_log_katman ON public.islem_log USING btree (katman, katman_id);


--
-- Name: idx_islem_log_olusturma; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_islem_log_olusturma ON public.islem_log USING btree (olusturma DESC);


--
-- Name: idx_islem_log_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_islem_log_spool ON public.islem_log USING btree (spool_id);


--
-- Name: idx_islem_log_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_islem_log_tenant ON public.islem_log USING btree (tenant_id);


--
-- Name: idx_kesim_kalemleri_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kesim_kalemleri_spool ON public.kesim_kalemleri USING btree (spool_id);


--
-- Name: idx_kesim_kalemleri_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kesim_kalemleri_tenant ON public.kesim_kalemleri USING btree (tenant_id);


--
-- Name: idx_kesim_listeleri_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kesim_listeleri_tenant ON public.kesim_listeleri USING btree (tenant_id);


--
-- Name: idx_kk_davet_spooller_davet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kk_davet_spooller_davet ON public.kk_davet_spooller USING btree (davet_id);


--
-- Name: idx_kk_davetler_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kk_davetler_tenant ON public.kk_davetler USING btree (tenant_id);


--
-- Name: idx_kullanici_yetkileri_kullanici; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kullanici_yetkileri_kullanici ON public.kullanici_yetkileri USING btree (kullanici_id);


--
-- Name: idx_kullanicilar_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kullanicilar_email ON public.kullanicilar USING btree (email);


--
-- Name: idx_kullanicilar_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kullanicilar_tenant ON public.kullanicilar USING btree (tenant_id);


--
-- Name: idx_markalama_kalemleri_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markalama_kalemleri_spool ON public.markalama_kalemleri USING btree (spool_id);


--
-- Name: idx_markalama_kalemleri_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markalama_kalemleri_tenant ON public.markalama_kalemleri USING btree (tenant_id);


--
-- Name: idx_notlar_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notlar_spool ON public.notlar USING btree (spool_id);


--
-- Name: idx_notlar_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notlar_tenant ON public.notlar USING btree (tenant_id);


--
-- Name: idx_pipeline_malzemeleri_devre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pipeline_malzemeleri_devre ON public.pipeline_malzemeleri USING btree (devre_id);


--
-- Name: idx_pipeline_malzemeleri_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pipeline_malzemeleri_tenant ON public.pipeline_malzemeleri USING btree (tenant_id);


--
-- Name: idx_projeler_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projeler_tenant ON public.projeler USING btree (tenant_id);


--
-- Name: idx_projeler_tersane; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projeler_tersane ON public.projeler USING btree (tersane_id);


--
-- Name: idx_sayac_tanimlari_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sayac_tanimlari_tenant ON public.sayac_tanimlari USING btree (tenant_id);


--
-- Name: idx_sevkiyat_spooller_sevkiyat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sevkiyat_spooller_sevkiyat ON public.sevkiyat_spooller USING btree (sevkiyat_id);


--
-- Name: idx_sevkiyatlar_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sevkiyatlar_tenant ON public.sevkiyatlar USING btree (tenant_id);


--
-- Name: idx_spool_malzemeleri_spool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spool_malzemeleri_spool ON public.spool_malzemeleri USING btree (spool_id);


--
-- Name: idx_spooller_aktif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spooller_aktif ON public.spooller USING btree (tenant_id, silindi);


--
-- Name: idx_spooller_aktif_basamak; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spooller_aktif_basamak ON public.spooller USING btree (aktif_basamak);


--
-- Name: idx_spooller_devre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spooller_devre ON public.spooller USING btree (devre_id);


--
-- Name: idx_spooller_devre_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spooller_devre_id ON public.spooller USING btree (devre_id);


--
-- Name: idx_spooller_spool_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spooller_spool_id ON public.spooller USING btree (tenant_id, spool_id);


--
-- Name: idx_spooller_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spooller_tenant ON public.spooller USING btree (tenant_id);


--
-- Name: ifs_alias_kalite_kod_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ifs_alias_kalite_kod_idx ON public.ifs_material_alias USING btree (kalite_kod);


--
-- Name: ifs_alias_unique_sistem; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ifs_alias_unique_sistem ON public.ifs_material_alias USING btree (upper(TRIM(BOTH FROM ham_yazim))) WHERE (tenant_id IS NULL);


--
-- Name: ifs_alias_unique_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ifs_alias_unique_tenant ON public.ifs_material_alias USING btree (tenant_id, upper(TRIM(BOTH FROM ham_yazim))) WHERE (tenant_id IS NOT NULL);


--
-- Name: malzeme_tanimlari_kategori_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX malzeme_tanimlari_kategori_idx ON public.malzeme_tanimlari USING btree (kategori_kod);


--
-- Name: malzeme_tanimlari_preset_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX malzeme_tanimlari_preset_unique_idx ON public.malzeme_tanimlari USING btree (kategori_kod, kalite_kod) WHERE (tenant_id IS NULL);


--
-- Name: malzeme_tanimlari_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX malzeme_tanimlari_tenant_idx ON public.malzeme_tanimlari USING btree (tenant_id) WHERE (aktif = true);


--
-- Name: markalama_listeleri_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markalama_listeleri_tenant_id_idx ON public.markalama_listeleri USING btree (tenant_id);


--
-- Name: markalama_listesi_kalemleri_kalem_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markalama_listesi_kalemleri_kalem_id_idx ON public.markalama_listesi_kalemleri USING btree (kalem_id);


--
-- Name: markalama_listesi_kalemleri_liste_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markalama_listesi_kalemleri_liste_id_idx ON public.markalama_listesi_kalemleri USING btree (liste_id);


--
-- Name: panel_gorevler_durum_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX panel_gorevler_durum_idx ON public.panel_gorevler USING btree (durum);


--
-- Name: panel_gorevler_kaynak_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX panel_gorevler_kaynak_idx ON public.panel_gorevler USING btree (kaynak, kaynak_id);


--
-- Name: panel_gorevler_oncelik_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX panel_gorevler_oncelik_idx ON public.panel_gorevler USING btree (oncelik);


--
-- Name: spooller_unique_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX spooller_unique_key ON public.spooller USING btree (tenant_id, devre_id, COALESCE(pipeline_no, ''::text), spool_no, rev);


--
-- Name: test_spooller_spool_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX test_spooller_spool_id_idx ON public.test_spooller USING btree (spool_id);


--
-- Name: test_spooller_test_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX test_spooller_test_id_idx ON public.test_spooller USING btree (test_id);


--
-- Name: testler_devre_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testler_devre_id_idx ON public.testler USING btree (devre_id);


--
-- Name: testler_durum_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testler_durum_idx ON public.testler USING btree (durum);


--
-- Name: testler_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testler_tenant_id_idx ON public.testler USING btree (tenant_id);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: devreler audit_devreler; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_devreler AFTER INSERT OR DELETE OR UPDATE ON public.devreler FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();


--
-- Name: hakedis_paketleri audit_hakedis_paketleri; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_hakedis_paketleri AFTER INSERT OR DELETE OR UPDATE ON public.hakedis_paketleri FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();


--
-- Name: is_kayitlari audit_is_kayitlari; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_is_kayitlari AFTER INSERT OR DELETE OR UPDATE ON public.is_kayitlari FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: kk_davetler audit_kk_davetler; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_kk_davetler AFTER INSERT OR DELETE OR UPDATE ON public.kk_davetler FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: kullanicilar audit_kullanicilar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_kullanicilar AFTER INSERT OR DELETE OR UPDATE ON public.kullanicilar FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();


--
-- Name: sevkiyatlar audit_sevkiyatlar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_sevkiyatlar AFTER INSERT OR DELETE OR UPDATE ON public.sevkiyatlar FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: spooller audit_spooller; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_spooller AFTER INSERT OR DELETE OR UPDATE ON public.spooller FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: tenants audit_tenants; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_tenants AFTER INSERT OR DELETE OR UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();


--
-- Name: yetki_bloklari koruma_sistem_preset; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER koruma_sistem_preset BEFORE DELETE ON public.yetki_bloklari FOR EACH ROW EXECUTE FUNCTION public.sistem_preset_silinemez();


--
-- Name: kullanicilar kullanici_rol_sync; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kullanici_rol_sync AFTER UPDATE OF rol ON public.kullanicilar FOR EACH ROW EXECUTE FUNCTION public.sync_kullanici_rol();


--
-- Name: panel_gorevler tg_panel_gorevler_guncellenme; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_panel_gorevler_guncellenme BEFORE UPDATE ON public.panel_gorevler FOR EACH ROW EXECUTE FUNCTION public.tg_panel_gorevler_guncellenme();


--
-- Name: pipeline_malzemeleri tg_pipeline_malzemeleri_ref_sync; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_pipeline_malzemeleri_ref_sync BEFORE INSERT OR UPDATE OF malzeme, kalite, malzeme_ref_id ON public.pipeline_malzemeleri FOR EACH ROW EXECUTE FUNCTION public.tg_pipeline_malzemeleri_ref_sync();


--
-- Name: spool_malzemeleri tg_spool_malzemeleri_ref_sync; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_spool_malzemeleri_ref_sync BEFORE INSERT OR UPDATE OF malzeme, kalite, malzeme_ref_id ON public.spool_malzemeleri FOR EACH ROW EXECUTE FUNCTION public.tg_spool_malzemeleri_ref_sync();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: ai_analizler ai_analizler_fotograf_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analizler
    ADD CONSTRAINT ai_analizler_fotograf_id_fkey FOREIGN KEY (fotograf_id) REFERENCES public.fotograflar(id);


--
-- Name: ai_analizler ai_analizler_insan_karar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analizler
    ADD CONSTRAINT ai_analizler_insan_karar_id_fkey FOREIGN KEY (insan_karar_id) REFERENCES public.kullanicilar(id);


--
-- Name: ai_analizler ai_analizler_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analizler
    ADD CONSTRAINT ai_analizler_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: ai_analizler ai_analizler_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analizler
    ADD CONSTRAINT ai_analizler_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: audit_log audit_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: basamak_tanimlari basamak_tanimlari_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basamak_tanimlari
    ADD CONSTRAINT basamak_tanimlari_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: belgeler belgeler_devre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.belgeler
    ADD CONSTRAINT belgeler_devre_id_fkey FOREIGN KEY (devre_id) REFERENCES public.devreler(id);


--
-- Name: belgeler belgeler_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.belgeler
    ADD CONSTRAINT belgeler_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: belgeler belgeler_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.belgeler
    ADD CONSTRAINT belgeler_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: belgeler belgeler_yukleyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.belgeler
    ADD CONSTRAINT belgeler_yukleyen_id_fkey FOREIGN KEY (yukleyen_id) REFERENCES public.kullanicilar(id);


--
-- Name: blok_sayfa_yetkileri blok_sayfa_yetkileri_blok_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blok_sayfa_yetkileri
    ADD CONSTRAINT blok_sayfa_yetkileri_blok_id_fkey FOREIGN KEY (blok_id) REFERENCES public.yetki_bloklari(id) ON DELETE CASCADE;


--
-- Name: bukum_kalemleri bukum_kalemleri_kesim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bukum_kalemleri
    ADD CONSTRAINT bukum_kalemleri_kesim_id_fkey FOREIGN KEY (kesim_id) REFERENCES public.kesim_kalemleri(id);


--
-- Name: bukum_kalemleri bukum_kalemleri_malzeme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bukum_kalemleri
    ADD CONSTRAINT bukum_kalemleri_malzeme_id_fkey FOREIGN KEY (malzeme_id) REFERENCES public.spool_malzemeleri(id);


--
-- Name: bukum_kalemleri bukum_kalemleri_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bukum_kalemleri
    ADD CONSTRAINT bukum_kalemleri_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id) ON DELETE CASCADE;


--
-- Name: bukum_kalemleri bukum_kalemleri_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bukum_kalemleri
    ADD CONSTRAINT bukum_kalemleri_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: customer_kullanicilar customer_kullanicilar_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_kullanicilar
    ADD CONSTRAINT customer_kullanicilar_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_kullanicilar customer_kullanicilar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_kullanicilar
    ADD CONSTRAINT customer_kullanicilar_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: customer_project_access customer_project_access_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_project_access
    ADD CONSTRAINT customer_project_access_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_project_access customer_project_access_proje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_project_access
    ADD CONSTRAINT customer_project_access_proje_id_fkey FOREIGN KEY (proje_id) REFERENCES public.projeler(id) ON DELETE CASCADE;


--
-- Name: customer_project_access customer_project_access_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_project_access
    ADD CONSTRAINT customer_project_access_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: customers customers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: devreler devreler_proje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devreler
    ADD CONSTRAINT devreler_proje_id_fkey FOREIGN KEY (proje_id) REFERENCES public.projeler(id);


--
-- Name: devreler devreler_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devreler
    ADD CONSTRAINT devreler_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: egitim_verisi egitim_verisi_dogrulayici_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_verisi
    ADD CONSTRAINT egitim_verisi_dogrulayici_id_fkey FOREIGN KEY (dogrulayici_id) REFERENCES public.kullanicilar(id);


--
-- Name: egitim_verisi egitim_verisi_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_verisi
    ADD CONSTRAINT egitim_verisi_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: feedback_kayitlari feedback_kayitlari_kullanici_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_kayitlari
    ADD CONSTRAINT feedback_kayitlari_kullanici_id_fkey FOREIGN KEY (kullanici_id) REFERENCES public.kullanicilar(id);


--
-- Name: feedback_kayitlari feedback_kayitlari_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_kayitlari
    ADD CONSTRAINT feedback_kayitlari_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: feedback_kayitlari feedback_kayitlari_yanit_veren_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_kayitlari
    ADD CONSTRAINT feedback_kayitlari_yanit_veren_id_fkey FOREIGN KEY (yanit_veren_id) REFERENCES public.kullanicilar(id);


--
-- Name: firma_moduller firma_moduller_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firma_moduller
    ADD CONSTRAINT firma_moduller_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fotograflar fotograflar_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotograflar
    ADD CONSTRAINT fotograflar_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id) ON DELETE CASCADE;


--
-- Name: fotograflar fotograflar_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotograflar
    ADD CONSTRAINT fotograflar_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: fotograflar fotograflar_yukleyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotograflar
    ADD CONSTRAINT fotograflar_yukleyen_id_fkey FOREIGN KEY (yukleyen_id) REFERENCES public.kullanicilar(id);


--
-- Name: hakedis_kriterleri hakedis_kriterleri_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_kriterleri
    ADD CONSTRAINT hakedis_kriterleri_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: hakedis_kriterleri hakedis_kriterleri_tersane_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_kriterleri
    ADD CONSTRAINT hakedis_kriterleri_tersane_id_fkey FOREIGN KEY (tersane_id) REFERENCES public.tersaneler(id);


--
-- Name: hakedis_paketleri hakedis_paketleri_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_paketleri
    ADD CONSTRAINT hakedis_paketleri_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: hakedis_paketleri hakedis_paketleri_tersane_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_paketleri
    ADD CONSTRAINT hakedis_paketleri_tersane_id_fkey FOREIGN KEY (tersane_id) REFERENCES public.tersaneler(id);


--
-- Name: hakedis_spooller hakedis_spooller_kriter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_spooller
    ADD CONSTRAINT hakedis_spooller_kriter_id_fkey FOREIGN KEY (kriter_id) REFERENCES public.hakedis_kriterleri(id);


--
-- Name: hakedis_spooller hakedis_spooller_onceki_paket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_spooller
    ADD CONSTRAINT hakedis_spooller_onceki_paket_id_fkey FOREIGN KEY (onceki_paket_id) REFERENCES public.hakedis_paketleri(id);


--
-- Name: hakedis_spooller hakedis_spooller_paket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_spooller
    ADD CONSTRAINT hakedis_spooller_paket_id_fkey FOREIGN KEY (paket_id) REFERENCES public.hakedis_paketleri(id) ON DELETE CASCADE;


--
-- Name: hakedis_spooller hakedis_spooller_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_spooller
    ADD CONSTRAINT hakedis_spooller_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: hakedis_spooller hakedis_spooller_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hakedis_spooller
    ADD CONSTRAINT hakedis_spooller_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: ifs_material_alias ifs_material_alias_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ifs_material_alias
    ADD CONSTRAINT ifs_material_alias_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: is_kayitlari is_kayitlari_fotograf_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_kayitlari
    ADD CONSTRAINT is_kayitlari_fotograf_id_fkey FOREIGN KEY (fotograf_id) REFERENCES public.fotograflar(id);


--
-- Name: is_kayitlari is_kayitlari_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_kayitlari
    ADD CONSTRAINT is_kayitlari_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.kullanicilar(id);


--
-- Name: is_kayitlari is_kayitlari_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_kayitlari
    ADD CONSTRAINT is_kayitlari_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id) ON DELETE CASCADE;


--
-- Name: is_kayitlari is_kayitlari_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_kayitlari
    ADD CONSTRAINT is_kayitlari_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: islem_log islem_log_devre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.islem_log
    ADD CONSTRAINT islem_log_devre_id_fkey FOREIGN KEY (devre_id) REFERENCES public.devreler(id);


--
-- Name: islem_log islem_log_proje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.islem_log
    ADD CONSTRAINT islem_log_proje_id_fkey FOREIGN KEY (proje_id) REFERENCES public.projeler(id);


--
-- Name: islem_log islem_log_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.islem_log
    ADD CONSTRAINT islem_log_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: islem_log islem_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.islem_log
    ADD CONSTRAINT islem_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: islem_log islem_log_yapan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.islem_log
    ADD CONSTRAINT islem_log_yapan_id_fkey FOREIGN KEY (yapan_id) REFERENCES public.kullanicilar(id);


--
-- Name: kesim_kalemleri kesim_kalemleri_kesim_listesi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesim_kalemleri
    ADD CONSTRAINT kesim_kalemleri_kesim_listesi_id_fkey FOREIGN KEY (kesim_listesi_id) REFERENCES public.kesim_listeleri(id);


--
-- Name: kesim_kalemleri kesim_kalemleri_malzeme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesim_kalemleri
    ADD CONSTRAINT kesim_kalemleri_malzeme_id_fkey FOREIGN KEY (malzeme_id) REFERENCES public.spool_malzemeleri(id);


--
-- Name: kesim_kalemleri kesim_kalemleri_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesim_kalemleri
    ADD CONSTRAINT kesim_kalemleri_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id) ON DELETE CASCADE;


--
-- Name: kesim_kalemleri kesim_kalemleri_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesim_kalemleri
    ADD CONSTRAINT kesim_kalemleri_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: kk_davet_spooller kk_davet_spooller_davet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_davet_spooller
    ADD CONSTRAINT kk_davet_spooller_davet_id_fkey FOREIGN KEY (davet_id) REFERENCES public.kk_davetler(id) ON DELETE CASCADE;


--
-- Name: kk_davet_spooller kk_davet_spooller_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_davet_spooller
    ADD CONSTRAINT kk_davet_spooller_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: kk_davet_spooller kk_davet_spooller_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_davet_spooller
    ADD CONSTRAINT kk_davet_spooller_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: kk_davetler kk_davetler_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_davetler
    ADD CONSTRAINT kk_davetler_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: kk_davetler kk_davetler_tersane_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_davetler
    ADD CONSTRAINT kk_davetler_tersane_id_fkey FOREIGN KEY (tersane_id) REFERENCES public.tersaneler(id);


--
-- Name: kullanici_bloklar kullanici_bloklar_blok_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_bloklar
    ADD CONSTRAINT kullanici_bloklar_blok_id_fkey FOREIGN KEY (blok_id) REFERENCES public.yetki_bloklari(id) ON DELETE CASCADE;


--
-- Name: kullanici_bloklar kullanici_bloklar_ekleyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_bloklar
    ADD CONSTRAINT kullanici_bloklar_ekleyen_id_fkey FOREIGN KEY (ekleyen_id) REFERENCES public.kullanicilar(id);


--
-- Name: kullanici_bloklar kullanici_bloklar_kullanici_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_bloklar
    ADD CONSTRAINT kullanici_bloklar_kullanici_id_fkey FOREIGN KEY (kullanici_id) REFERENCES public.kullanicilar(id) ON DELETE CASCADE;


--
-- Name: kullanici_bloklar kullanici_bloklar_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_bloklar
    ADD CONSTRAINT kullanici_bloklar_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: kullanici_yetkileri kullanici_yetkileri_ekleyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_yetkileri
    ADD CONSTRAINT kullanici_yetkileri_ekleyen_id_fkey FOREIGN KEY (ekleyen_id) REFERENCES public.kullanicilar(id);


--
-- Name: kullanici_yetkileri kullanici_yetkileri_kullanici_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_yetkileri
    ADD CONSTRAINT kullanici_yetkileri_kullanici_id_fkey FOREIGN KEY (kullanici_id) REFERENCES public.kullanicilar(id) ON DELETE CASCADE;


--
-- Name: kullanici_yetkileri kullanici_yetkileri_yetki_kodu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanici_yetkileri
    ADD CONSTRAINT kullanici_yetkileri_yetki_kodu_fkey FOREIGN KEY (yetki_kodu) REFERENCES public.yetki_tanimlari(kod);


--
-- Name: kullanicilar kullanicilar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanicilar
    ADD CONSTRAINT kullanicilar_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: kullanicilar kullanicilar_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kullanicilar
    ADD CONSTRAINT kullanicilar_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: malzeme_tanimlari malzeme_tanimlari_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.malzeme_tanimlari
    ADD CONSTRAINT malzeme_tanimlari_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: markalama_kalemleri markalama_kalemleri_malzeme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markalama_kalemleri
    ADD CONSTRAINT markalama_kalemleri_malzeme_id_fkey FOREIGN KEY (malzeme_id) REFERENCES public.spool_malzemeleri(id);


--
-- Name: markalama_kalemleri markalama_kalemleri_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markalama_kalemleri
    ADD CONSTRAINT markalama_kalemleri_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id) ON DELETE CASCADE;


--
-- Name: markalama_kalemleri markalama_kalemleri_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markalama_kalemleri
    ADD CONSTRAINT markalama_kalemleri_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: markalama_listesi_kalemleri markalama_listesi_kalemleri_kalem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markalama_listesi_kalemleri
    ADD CONSTRAINT markalama_listesi_kalemleri_kalem_id_fkey FOREIGN KEY (kalem_id) REFERENCES public.markalama_kalemleri(id);


--
-- Name: markalama_listesi_kalemleri markalama_listesi_kalemleri_liste_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markalama_listesi_kalemleri
    ADD CONSTRAINT markalama_listesi_kalemleri_liste_id_fkey FOREIGN KEY (liste_id) REFERENCES public.markalama_listeleri(id) ON DELETE CASCADE;


--
-- Name: notlar notlar_devre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notlar
    ADD CONSTRAINT notlar_devre_id_fkey FOREIGN KEY (devre_id) REFERENCES public.devreler(id);


--
-- Name: notlar notlar_ekleyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notlar
    ADD CONSTRAINT notlar_ekleyen_id_fkey FOREIGN KEY (ekleyen_id) REFERENCES public.kullanicilar(id);


--
-- Name: notlar notlar_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notlar
    ADD CONSTRAINT notlar_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: notlar notlar_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notlar
    ADD CONSTRAINT notlar_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: panel_gorevler panel_gorevler_olusturan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.panel_gorevler
    ADD CONSTRAINT panel_gorevler_olusturan_id_fkey FOREIGN KEY (olusturan_id) REFERENCES public.kullanicilar(id);


--
-- Name: pipeline_malzemeleri pipeline_malzemeleri_devre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_malzemeleri
    ADD CONSTRAINT pipeline_malzemeleri_devre_id_fkey FOREIGN KEY (devre_id) REFERENCES public.devreler(id);


--
-- Name: pipeline_malzemeleri pipeline_malzemeleri_malzeme_ref_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_malzemeleri
    ADD CONSTRAINT pipeline_malzemeleri_malzeme_ref_id_fkey FOREIGN KEY (malzeme_ref_id) REFERENCES public.malzeme_tanimlari(id);


--
-- Name: projeler projeler_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projeler
    ADD CONSTRAINT projeler_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: projeler projeler_tersane_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projeler
    ADD CONSTRAINT projeler_tersane_id_fkey FOREIGN KEY (tersane_id) REFERENCES public.tersaneler(id);


--
-- Name: rol_sablonlari rol_sablonlari_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_sablonlari
    ADD CONSTRAINT rol_sablonlari_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sevkiyat_spooller sevkiyat_spooller_sevkiyat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sevkiyat_spooller
    ADD CONSTRAINT sevkiyat_spooller_sevkiyat_id_fkey FOREIGN KEY (sevkiyat_id) REFERENCES public.sevkiyatlar(id) ON DELETE CASCADE;


--
-- Name: sevkiyat_spooller sevkiyat_spooller_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sevkiyat_spooller
    ADD CONSTRAINT sevkiyat_spooller_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: sevkiyat_spooller sevkiyat_spooller_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sevkiyat_spooller
    ADD CONSTRAINT sevkiyat_spooller_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: sevkiyatlar sevkiyatlar_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sevkiyatlar
    ADD CONSTRAINT sevkiyatlar_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: sevkiyatlar sevkiyatlar_tersane_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sevkiyatlar
    ADD CONSTRAINT sevkiyatlar_tersane_id_fkey FOREIGN KEY (tersane_id) REFERENCES public.tersaneler(id);


--
-- Name: spool_malzemeleri spool_malzemeleri_malzeme_ref_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spool_malzemeleri
    ADD CONSTRAINT spool_malzemeleri_malzeme_ref_id_fkey FOREIGN KEY (malzeme_ref_id) REFERENCES public.malzeme_tanimlari(id);


--
-- Name: spool_malzemeleri spool_malzemeleri_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spool_malzemeleri
    ADD CONSTRAINT spool_malzemeleri_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id) ON DELETE CASCADE;


--
-- Name: spool_malzemeleri spool_malzemeleri_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spool_malzemeleri
    ADD CONSTRAINT spool_malzemeleri_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: spooller spooller_devre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spooller
    ADD CONSTRAINT spooller_devre_id_fkey FOREIGN KEY (devre_id) REFERENCES public.devreler(id);


--
-- Name: spooller spooller_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spooller
    ADD CONSTRAINT spooller_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tarama_sonuclari tarama_sonuclari_onaylayan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarama_sonuclari
    ADD CONSTRAINT tarama_sonuclari_onaylayan_id_fkey FOREIGN KEY (onaylayan_id) REFERENCES public.kullanicilar(id);


--
-- Name: tarama_sonuclari tarama_sonuclari_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarama_sonuclari
    ADD CONSTRAINT tarama_sonuclari_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id);


--
-- Name: tarama_sonuclari tarama_sonuclari_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarama_sonuclari
    ADD CONSTRAINT tarama_sonuclari_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_features tenant_features_feature_kod_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT tenant_features_feature_kod_fkey FOREIGN KEY (feature_kod) REFERENCES public.feature_flags(kod);


--
-- Name: tenant_features tenant_features_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT tenant_features_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tersane_firma_iliskileri tersane_firma_iliskileri_firma_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tersane_firma_iliskileri
    ADD CONSTRAINT tersane_firma_iliskileri_firma_id_fkey FOREIGN KEY (firma_id) REFERENCES public.tenants(id);


--
-- Name: tersane_firma_iliskileri tersane_firma_iliskileri_tersane_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tersane_firma_iliskileri
    ADD CONSTRAINT tersane_firma_iliskileri_tersane_id_fkey FOREIGN KEY (tersane_id) REFERENCES public.tenants(id);


--
-- Name: tersaneler tersaneler_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tersaneler
    ADD CONSTRAINT tersaneler_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: tersaneler tersaneler_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tersaneler
    ADD CONSTRAINT tersaneler_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: test_spooller test_spooller_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_spooller
    ADD CONSTRAINT test_spooller_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.spooller(id) ON DELETE CASCADE;


--
-- Name: test_spooller test_spooller_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_spooller
    ADD CONSTRAINT test_spooller_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.testler(id) ON DELETE CASCADE;


--
-- Name: testler testler_devre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testler
    ADD CONSTRAINT testler_devre_id_fkey FOREIGN KEY (devre_id) REFERENCES public.devreler(id) ON DELETE SET NULL;


--
-- Name: yetki_bloklari yetki_bloklari_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yetki_bloklari
    ADD CONSTRAINT yetki_bloklari_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: ai_analizler ai_analiz_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_analiz_tenant ON public.ai_analizler USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: ai_analizler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_analizler ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_insert ON public.audit_log FOR INSERT WITH CHECK (true);


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_super_admin ON public.audit_log FOR SELECT USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text) = 'super_admin'::text));


--
-- Name: audit_log audit_tenant_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_tenant_select ON public.audit_log FOR SELECT USING ((tenant_id = public.get_tenant_id()));


--
-- Name: basamak_tanimlari basamak_herkese_okuma; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY basamak_herkese_okuma ON public.basamak_tanimlari FOR SELECT USING (true);


--
-- Name: basamak_tanimlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.basamak_tanimlari ENABLE ROW LEVEL SECURITY;

--
-- Name: basamak_tanimlari basamak_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY basamak_tenant ON public.basamak_tanimlari USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: belgeler belge_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY belge_tenant ON public.belgeler USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: belgeler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.belgeler ENABLE ROW LEVEL SECURITY;

--
-- Name: belgeler belgeler_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY belgeler_tenant ON public.belgeler USING ((tenant_id = public.get_tenant_id()));


--
-- Name: blok_sayfa_yetkileri blok_sayfa_erisim; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blok_sayfa_erisim ON public.blok_sayfa_yetkileri USING ((EXISTS ( SELECT 1
   FROM public.yetki_bloklari yb
  WHERE ((yb.id = blok_sayfa_yetkileri.blok_id) AND ((yb.tenant_id = ( SELECT kullanicilar.tenant_id
           FROM public.kullanicilar
          WHERE (kullanicilar.id = auth.uid()))) OR (yb.sistem_preset = true))))));


--
-- Name: blok_sayfa_yetkileri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blok_sayfa_yetkileri ENABLE ROW LEVEL SECURITY;

--
-- Name: bukum_kalemleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bukum_kalemleri ENABLE ROW LEVEL SECURITY;

--
-- Name: bukum_kalemleri bukum_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bukum_tenant ON public.bukum_kalemleri USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: customer_project_access customer_access_kendi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_access_kendi ON public.customer_project_access FOR SELECT USING ((customer_id IN ( SELECT customer_kullanicilar.customer_id
   FROM public.customer_kullanicilar
  WHERE (customer_kullanicilar.id = auth.uid()))));


--
-- Name: customer_project_access customer_access_tenant_yonet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_access_tenant_yonet ON public.customer_project_access USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: customers customer_kendi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_kendi ON public.customers FOR SELECT USING ((id IN ( SELECT customer_kullanicilar.customer_id
   FROM public.customer_kullanicilar
  WHERE (customer_kullanicilar.id = auth.uid()))));


--
-- Name: customer_kullanicilar customer_kul_kendi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_kul_kendi ON public.customer_kullanicilar FOR SELECT USING ((id = auth.uid()));


--
-- Name: customer_kullanicilar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_kullanicilar ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_project_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_project_access ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: devreler devre_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY devre_tenant ON public.devreler USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: devreler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.devreler ENABLE ROW LEVEL SECURITY;

--
-- Name: devreler devreler_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY devreler_select ON public.devreler FOR SELECT USING (((tenant_id = public.get_tenant_id()) AND ((silindi = false) OR (silindi IS NULL))));


--
-- Name: feature_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: feedback_kayitlari feedback_admin_gorme; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedback_admin_gorme ON public.feedback_kayitlari FOR SELECT USING (true);


--
-- Name: feedback_kayitlari feedback_admin_guncelle; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedback_admin_guncelle ON public.feedback_kayitlari FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: feedback_kayitlari feedback_ekle; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedback_ekle ON public.feedback_kayitlari FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: feedback_kayitlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feedback_kayitlari ENABLE ROW LEVEL SECURITY;

--
-- Name: kullanici_yetkileri firma_admin_yetki_yonet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY firma_admin_yetki_yonet ON public.kullanici_yetkileri USING (((tenant_id = public.get_tenant_id()) AND ((auth.jwt() ->> 'rol'::text) = ANY (ARRAY['firma_admin'::text, 'yonetici'::text, 'super_admin'::text]))));


--
-- Name: firma_moduller firma_modul_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY firma_modul_super_admin ON public.firma_moduller USING (((auth.jwt() ->> 'rol'::text) = 'super_admin'::text));


--
-- Name: firma_moduller firma_modul_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY firma_modul_tenant ON public.firma_moduller FOR SELECT USING ((tenant_id = public.get_tenant_id()));


--
-- Name: firma_moduller; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.firma_moduller ENABLE ROW LEVEL SECURITY;

--
-- Name: firma_moduller firma_moduller_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY firma_moduller_all ON public.firma_moduller USING (true);


--
-- Name: fotograflar fotograf_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fotograf_tenant ON public.fotograflar USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: fotograflar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fotograflar ENABLE ROW LEVEL SECURITY;

--
-- Name: fotograflar fotograflar_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fotograflar_tenant ON public.fotograflar USING ((tenant_id = public.get_tenant_id()));


--
-- Name: hakedis_kriterleri hakedis_kriter_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hakedis_kriter_tenant ON public.hakedis_kriterleri USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: hakedis_kriterleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hakedis_kriterleri ENABLE ROW LEVEL SECURITY;

--
-- Name: hakedis_paketleri hakedis_paket_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hakedis_paket_tenant ON public.hakedis_paketleri USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: hakedis_paketleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hakedis_paketleri ENABLE ROW LEVEL SECURITY;

--
-- Name: hakedis_paketleri hakedis_paketleri_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hakedis_paketleri_select ON public.hakedis_paketleri FOR SELECT USING (((tenant_id = public.get_tenant_id()) AND ((silindi = false) OR (silindi IS NULL))));


--
-- Name: hakedis_spooller hakedis_spool_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hakedis_spool_tenant ON public.hakedis_spooller USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: hakedis_spooller; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hakedis_spooller ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags herkese_okuma; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY herkese_okuma ON public.feature_flags FOR SELECT USING (true);


--
-- Name: ifs_material_alias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ifs_material_alias ENABLE ROW LEVEL SECURITY;

--
-- Name: ifs_material_alias ifs_material_alias_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ifs_material_alias_delete ON public.ifs_material_alias FOR DELETE USING (((tenant_id IS NOT NULL) AND (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid())))));


--
-- Name: ifs_material_alias ifs_material_alias_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ifs_material_alias_insert ON public.ifs_material_alias FOR INSERT WITH CHECK (((tenant_id IS NOT NULL) AND (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid())))));


--
-- Name: ifs_material_alias ifs_material_alias_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ifs_material_alias_select ON public.ifs_material_alias FOR SELECT USING (((tenant_id IS NULL) OR (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid())))));


--
-- Name: ifs_material_alias ifs_material_alias_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ifs_material_alias_update ON public.ifs_material_alias FOR UPDATE USING (((tenant_id IS NOT NULL) AND (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid()))))) WITH CHECK (((tenant_id IS NOT NULL) AND (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid())))));


--
-- Name: tersane_firma_iliskileri iliski_goruntule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY iliski_goruntule ON public.tersane_firma_iliskileri FOR SELECT USING (((tersane_id = public.get_tenant_id()) OR (firma_id = public.get_tenant_id()) OR ((auth.jwt() ->> 'rol'::text) = 'super_admin'::text)));


--
-- Name: tersane_firma_iliskileri iliski_yonet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY iliski_yonet ON public.tersane_firma_iliskileri USING ((((auth.jwt() ->> 'rol'::text) = 'super_admin'::text) OR ((tersane_id = public.get_tenant_id()) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text) = ANY (ARRAY['firma_admin'::text, 'yonetici'::text])))));


--
-- Name: is_kayitlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.is_kayitlari ENABLE ROW LEVEL SECURITY;

--
-- Name: islem_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.islem_log ENABLE ROW LEVEL SECURITY;

--
-- Name: kullanici_yetkileri kendi_yetkilerini_gor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kendi_yetkilerini_gor ON public.kullanici_yetkileri FOR SELECT USING ((kullanici_id = auth.uid()));


--
-- Name: kesim_kalemleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kesim_kalemleri ENABLE ROW LEVEL SECURITY;

--
-- Name: kesim_listeleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kesim_listeleri ENABLE ROW LEVEL SECURITY;

--
-- Name: kesim_listeleri kesim_listesi_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kesim_listesi_tenant ON public.kesim_listeleri USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: kesim_kalemleri kesim_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kesim_tenant ON public.kesim_kalemleri USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: kk_davet_spooller; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kk_davet_spooller ENABLE ROW LEVEL SECURITY;

--
-- Name: kk_davetler kk_davet_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kk_davet_tenant ON public.kk_davetler USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: kk_davetler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kk_davetler ENABLE ROW LEVEL SECURITY;

--
-- Name: kk_davet_spooller kk_spool_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kk_spool_tenant ON public.kk_davet_spooller USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: kullanici_bloklar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kullanici_bloklar ENABLE ROW LEVEL SECURITY;

--
-- Name: kullanicilar kullanici_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kullanici_tenant ON public.kullanicilar USING (((tenant_id = public.get_tenant_id()) OR ((auth.jwt() ->> 'rol'::text) = 'super_admin'::text))) WITH CHECK (((tenant_id = public.get_tenant_id()) OR ((auth.jwt() ->> 'rol'::text) = 'super_admin'::text)));


--
-- Name: kullanici_yetkileri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kullanici_yetkileri ENABLE ROW LEVEL SECURITY;

--
-- Name: kullanicilar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kullanicilar ENABLE ROW LEVEL SECURITY;

--
-- Name: islem_log log_tenant_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY log_tenant_insert ON public.islem_log FOR INSERT WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: islem_log log_tenant_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY log_tenant_select ON public.islem_log FOR SELECT USING ((tenant_id = public.get_tenant_id()));


--
-- Name: islem_log log_tenant_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY log_tenant_update ON public.islem_log FOR UPDATE USING ((tenant_id = public.get_tenant_id()));


--
-- Name: malzeme_tanimlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.malzeme_tanimlari ENABLE ROW LEVEL SECURITY;

--
-- Name: malzeme_tanimlari malzeme_tanimlari_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY malzeme_tanimlari_delete ON public.malzeme_tanimlari FOR DELETE USING (((tenant_id IS NOT NULL) AND (sistem_preset = false) AND (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid())))));


--
-- Name: malzeme_tanimlari malzeme_tanimlari_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY malzeme_tanimlari_insert ON public.malzeme_tanimlari FOR INSERT WITH CHECK (((tenant_id IS NOT NULL) AND (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid())))));


--
-- Name: malzeme_tanimlari malzeme_tanimlari_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY malzeme_tanimlari_select ON public.malzeme_tanimlari FOR SELECT USING (((tenant_id IS NULL) OR (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid())))));


--
-- Name: malzeme_tanimlari malzeme_tanimlari_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY malzeme_tanimlari_update ON public.malzeme_tanimlari FOR UPDATE USING (((tenant_id IS NOT NULL) AND (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid()))))) WITH CHECK (((tenant_id IS NOT NULL) AND (tenant_id IN ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid())))));


--
-- Name: spool_malzemeleri malzeme_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY malzeme_tenant ON public.spool_malzemeleri USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: markalama_kalemleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.markalama_kalemleri ENABLE ROW LEVEL SECURITY;

--
-- Name: markalama_kalemleri markalama_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY markalama_tenant ON public.markalama_kalemleri USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: devreler musteri_devre_gor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musteri_devre_gor ON public.devreler FOR SELECT USING (((tenant_id IN ( SELECT customer_project_access.tenant_id
   FROM public.customer_project_access
  WHERE (customer_project_access.customer_id IN ( SELECT customer_kullanicilar.customer_id
           FROM public.customer_kullanicilar
          WHERE (customer_kullanicilar.id = auth.uid()))))) AND ((silindi = false) OR (silindi IS NULL))));


--
-- Name: projeler musteri_proje_gor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musteri_proje_gor ON public.projeler FOR SELECT USING ((id IN ( SELECT customer_project_access.proje_id
   FROM public.customer_project_access
  WHERE (customer_project_access.customer_id IN ( SELECT customer_kullanicilar.customer_id
           FROM public.customer_kullanicilar
          WHERE (customer_kullanicilar.id = auth.uid()))))));


--
-- Name: spooller musteri_spool_gor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musteri_spool_gor ON public.spooller FOR SELECT USING (((tenant_id IN ( SELECT customer_project_access.tenant_id
   FROM public.customer_project_access
  WHERE (customer_project_access.customer_id IN ( SELECT customer_kullanicilar.customer_id
           FROM public.customer_kullanicilar
          WHERE (customer_kullanicilar.id = auth.uid()))))) AND ((silindi = false) OR (silindi IS NULL))));


--
-- Name: tenants musteri_tenant_gor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY musteri_tenant_gor ON public.tenants FOR SELECT USING ((id IN ( SELECT customer_project_access.tenant_id
   FROM public.customer_project_access
  WHERE (customer_project_access.customer_id IN ( SELECT customer_kullanicilar.customer_id
           FROM public.customer_kullanicilar
          WHERE (customer_kullanicilar.id = auth.uid()))))));


--
-- Name: notlar not_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY not_tenant ON public.notlar USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: notlar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notlar ENABLE ROW LEVEL SECURITY;

--
-- Name: notlar notlar_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notlar_tenant ON public.notlar USING ((tenant_id = public.get_tenant_id()));


--
-- Name: panel_gorevler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.panel_gorevler ENABLE ROW LEVEL SECURITY;

--
-- Name: panel_gorevler panel_gorevler_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY panel_gorevler_delete ON public.panel_gorevler FOR DELETE USING (public.is_super_admin());


--
-- Name: panel_gorevler panel_gorevler_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY panel_gorevler_insert ON public.panel_gorevler FOR INSERT WITH CHECK (public.is_super_admin());


--
-- Name: panel_gorevler panel_gorevler_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY panel_gorevler_select ON public.panel_gorevler FOR SELECT USING (public.is_super_admin());


--
-- Name: panel_gorevler panel_gorevler_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY panel_gorevler_update ON public.panel_gorevler FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());


--
-- Name: pipeline_malzemeleri pipeline_mal_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pipeline_mal_tenant ON public.pipeline_malzemeleri USING ((tenant_id = public.get_tenant_id()));


--
-- Name: pipeline_malzemeleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pipeline_malzemeleri ENABLE ROW LEVEL SECURITY;

--
-- Name: projeler proje_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY proje_tenant ON public.projeler USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: projeler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projeler ENABLE ROW LEVEL SECURITY;

--
-- Name: rol_sablonlari rol_sablon_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rol_sablon_tenant ON public.rol_sablonlari USING ((tenant_id = public.get_tenant_id()));


--
-- Name: rol_sablonlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rol_sablonlari ENABLE ROW LEVEL SECURITY;

--
-- Name: sayac_tanimlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sayac_tanimlari ENABLE ROW LEVEL SECURITY;

--
-- Name: sayac_tanimlari sayac_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sayac_tenant ON public.sayac_tanimlari USING ((tenant_id = public.get_tenant_id()));


--
-- Name: sevkiyat_spooller sevkiyat_spool_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sevkiyat_spool_tenant ON public.sevkiyat_spooller USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: sevkiyat_spooller; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sevkiyat_spooller ENABLE ROW LEVEL SECURITY;

--
-- Name: sevkiyatlar sevkiyat_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sevkiyat_tenant ON public.sevkiyatlar USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: sevkiyatlar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sevkiyatlar ENABLE ROW LEVEL SECURITY;

--
-- Name: spool_malzemeleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spool_malzemeleri ENABLE ROW LEVEL SECURITY;

--
-- Name: spooller spool_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY spool_tenant ON public.spooller USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: spooller; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spooller ENABLE ROW LEVEL SECURITY;

--
-- Name: spooller spooller_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY spooller_select ON public.spooller FOR SELECT USING (((tenant_id = public.get_tenant_id()) AND ((silindi = false) OR (silindi IS NULL))));


--
-- Name: tenant_features super_admin_feature_yonet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY super_admin_feature_yonet ON public.tenant_features USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text) = 'super_admin'::text)) WITH CHECK ((((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text) = 'super_admin'::text));


--
-- Name: feature_flags super_admin_flag_yonet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY super_admin_flag_yonet ON public.feature_flags USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text) = 'super_admin'::text)) WITH CHECK ((((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text) = 'super_admin'::text));


--
-- Name: kullanici_yetkileri super_admin_rol_yonet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY super_admin_rol_yonet ON public.kullanici_yetkileri USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text) = 'super_admin'::text));


--
-- Name: tenants super_admin_tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY super_admin_tenants ON public.tenants USING (true);


--
-- Name: tarama_sonuclari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tarama_sonuclari ENABLE ROW LEVEL SECURITY;

--
-- Name: tarama_sonuclari tarama_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tarama_tenant ON public.tarama_sonuclari USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: tenant_features tenant_features_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_features_all ON public.tenant_features USING (true);


--
-- Name: is_kayitlari tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation ON public.is_kayitlari USING ((tenant_id = ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid()))));


--
-- Name: kullanici_yetkileri tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation ON public.kullanici_yetkileri USING ((tenant_id = ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid()))));


--
-- Name: tenants tenant_kendi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_kendi ON public.tenants USING (((id = public.get_tenant_id()) OR ((auth.jwt() ->> 'rol'::text) = 'super_admin'::text))) WITH CHECK (((id = public.get_tenant_id()) OR ((auth.jwt() ->> 'rol'::text) = 'super_admin'::text)));


--
-- Name: yetki_bloklari tenant_kendi_bloklari; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_kendi_bloklari ON public.yetki_bloklari USING (((tenant_id = ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid()))) OR (sistem_preset = true)));


--
-- Name: kullanici_bloklar tenant_kullanici_bloklar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_kullanici_bloklar ON public.kullanici_bloklar USING ((tenant_id = ( SELECT kullanicilar.tenant_id
   FROM public.kullanicilar
  WHERE (kullanicilar.id = auth.uid()))));


--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants tenants_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenants_insert ON public.tenants FOR INSERT WITH CHECK (true);


--
-- Name: tenants tenants_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenants_read_all ON public.tenants FOR SELECT USING (true);


--
-- Name: tenants tenants_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenants_update ON public.tenants FOR UPDATE USING (true);


--
-- Name: tersane_firma_iliskileri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tersane_firma_iliskileri ENABLE ROW LEVEL SECURITY;

--
-- Name: tersaneler tersane_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tersane_tenant ON public.tersaneler USING ((tenant_id = public.get_tenant_id())) WITH CHECK ((tenant_id = public.get_tenant_id()));


--
-- Name: tersaneler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tersaneler ENABLE ROW LEVEL SECURITY;

--
-- Name: yetki_bloklari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.yetki_bloklari ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Authenticated upload; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'arespipe-dosyalar'::text));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: objects feedback_yazma; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY feedback_yazma ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'arespipe-dosyalar'::text) AND ((storage.foldername(name))[1] = 'feedback'::text)));


--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: objects tenant_okuma mxcklp_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "tenant_okuma mxcklp_0" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'arespipe-dosyalar'::text) AND ((storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id'::text))));


--
-- Name: objects tenant_silme mxcklp_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "tenant_silme mxcklp_0" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'arespipe-dosyalar'::text) AND ((storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id'::text))));


--
-- Name: objects tenant_silme mxcklp_1; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "tenant_silme mxcklp_1" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'arespipe-dosyalar'::text) AND ((storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id'::text))));


--
-- Name: objects tenant_yazma mxcklp_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "tenant_yazma mxcklp_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'arespipe-dosyalar'::text) AND ((storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id'::text))));


--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 9nRmEjHXZnV1eJ0leKnnn5f0lVlwbj5AhYrA5U224VRKsL0JIxvXgUNxd2m8cXe

