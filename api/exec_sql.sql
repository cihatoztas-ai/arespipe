-- Supabase SQL Editor'da çalıştır
-- Doğal dil sorgu sistemi için raw SQL çalıştırma fonksiyonu

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Fonksiyona erişim ver
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon, authenticated;
