# 50. Oturum — Tersan L2 Parser Pilot

> 1 Mayis 2026

## Hedef
L2 parser prototipini gercek text uzerinde test et, calisirligini kanitla.

## Ana Kesif
PAOR formati image-PDF (text yok, AVEVA E3D vektorel ciziyor) — L2 imkansiz. Tersan text-PDF (850-1500 char dolu metin) — L2 yapilabilir. **MK-50.2** dogdu: format bazinda L2 uygunlugu kontrol edilir.

## Calisma Akisi

### Bolum 1 — Veri Turu
- PAOR ai_api_log incelendi: istek_full ve istek_kisaltma 13/13 NULL
- 2 PAOR PDF Storage'tan indirildi, pdf-parse 2 karakter
- 3 Tersan PDF (S08, S09, S10) ayni sekilde indirildi, 850-833 karakter dolu metin
- Pattern analizi: Tersan formati cok duzenli, sayilar yapisik ama tahmin edilebilir

### Bolum 2 — Guvenlik Krizi
- Kullanici sb_secret_* anahtarini chat'e yapistirdi
- Claude uyari verdi, anahtar Supabase Dashboard'tan silindi
- JWT rotation Vercel Legacy JWT'sini bozdu, yeni Legacy JWT alindi
- Vercel cache'siz redeploy ile site geri geldi
- **MK-50.1** dogdu: hassas anahtar Claude'a verilmez

### Bolum 3 — Migration 025 Tasarim
- parser_kural JSONB sema v1 yazildi
- Tersan'a ozgu post_processing: prefix_garanti (B1110 -> NB1110)
- Yuzey whitelist: Galvaniz/Boya/Asit + fallback Diger
- Sertifika gruplari: kurum + sinif (BV/DNV/LR + I/II/III)
- Malzeme tablosu satir tipleri: boru, fitting, islem
- Kabul kriterleri: zorunlu alanlar + min match orani + l3_fallback

### Bolum 4 — Engine + Test
- lib/l2-parser.js v1 yazildi (regex apply + post-processing + fallback)
- scripts/l2-test-tersan.mjs yazildi (3 PDF E2E test)
- 1. tur test: 12/12 alan match (%100), AMA 3 bug:
  - et_mm: 4.5595 (yanlis, yapisik)
  - proje_kodu: NBB1110 (cift NB)
  - malzeme_satir: 0 (pattern uymadi)

### Bolum 5 — Bug Fix
- Migration 026 yazildi (UPDATE jsonb_set)
- et_mm regex: (\d+(?:\.\d+)?)x(\d\.\d)(\d{3,5}) — et tek decimal hane, sonrasi boy
- proje_kodu: regex sadece sayiyi yakalar, format_template "NB{n}" prefix ekler
- boy_mm yeni alan eklendi
- malzeme_tablosu satir_tipleri yeni pattern'ler + grup_haritasi destegi
- baslik_tetikleyici null'a set
- lib/l2-parser.js v2 yazildi (grup_haritasi destegi)

### Bolum 6 — Final Test
- 3/3 BASARILI
- 13/13 alan (%100)
- 5/4/4 malzeme satir
- 1-2 ms parse hizi
- proje_kodu: NB1110 (dogru)
- et_mm: 4.5 (dogru)
- boy_mm: 5950/4701/4050 (dogru)

### Bolum 7 — GitHub Push
- gitignore -> .gitignore rename krizi (49'dan kalmis)
- Migration 026 GitHub'da bir versiyon vardi (49 sonu push edilmis), rebase conflict
- HEAD versiyonu tutuldu (--ours), rebase devam etti
- vim'de takildi, abort + tekrar push (otomatik tamamlandi)
- Commit fc84f41 push edildi

## Teknik Notlar
- pdf-parse v1.1.1 bug: 'pdf-parse' import yerine 'pdf-parse/lib/pdf-parse.js' kullanildi
- zsh quote sorunu: parantez yerine duz tirnak veya heredoc
- Mac indirme bozuk: dosya transferi heredoc ile yapildi
- Supabase SQL Editor terminal komut almaz: cd komutu yapilan hata duzeltildi

## Performans
- L2 parse: 1-2 ms/PDF
- AI vision parse: ~24 sn/PDF
- Hiz farki: 12,000x
- Maliyet farki: $0 vs $0.036 = 60x ekonomi tum format icin

## 51'e Devralan
Tersan canli entegrasyonu (3 satir is), L2 metrikleri kolonu doldurma, format envanter UI, malzeme pattern temizligi.
