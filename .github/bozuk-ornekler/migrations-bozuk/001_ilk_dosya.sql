-- Self-test için üretilmiş 001 numaralı dosya (ilk kopya).
-- Bu dosya tek başına bakıldığında kurallara uyar.
-- Ama aynı klasördeki 001_ikinci_dosya.sql ile numara çakışması yaratır.
-- Beklenen: MIG_NUMARA_TEKRAR bu klasör taramasından çıkar.

BEGIN;
SELECT 1;
COMMIT;
