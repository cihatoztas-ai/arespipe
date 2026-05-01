# L2 Parser — Mimari Karar Belgesi

> **Oturum:** 50  
> **Tarih:** 1 Mayis 2026  
> **Durum:** Prototip lokalde test edildi (3/3 basarili). Canlida kullanilmiyor (51'de baglanir).

---

## Vizyon

Izometri PDF'lerinin parse maliyetini AI vision'a bagimliliktan cikarmak. Ilk PDF AI'ya gider, format ogrenilir, sonraki tum ayni format PDF'leri **deterministik regex ile $0 maliyet** parse edilir.

**60x ekonomi** (1 AI cagrisi $0.036, 999 deterministik $0).

---

## Uc Seviye Parser Sistemi

| Seviye | Ne yapar | Maliyet | Hiz | Sart |
|--------|----------|---------|-----|------|
| Cache HIT | pdf_sha256 lookup | $0 | ~3 sn | Daha once parse edilmis |
| L2 | parser_kural regex'leri | $0 | ~1-2 ms | PDF text-li + format ogrenilmis |
| L3 | AI vision (Anthropic Claude) | $0.036 | ~24 sn | Her zaman calisir (fallback) |

ai_api_log.parser_seviye kolonu (Migration 024) hangi seviyenin kullanildigini izler.

---

## Mimari Kararlar (50. Oturum)

### MK-50.1 — Hassas anahtar paylasim disiplini

Service_role JWT, API anahtarlari, secret tokenlar Claude'a paylasilmaz. Script terminale env degiskeni elle aktarir, Claude'a sadece cikti gonderilir. Anahtar tek hat: Vercel/Supabase Dashboard -> Mac terminal -> script process. Sizinti olursa aninda reset + cache'siz redeploy.

### MK-50.2 — Image-PDF formatlari icin L2 imkansiz

PAOR Ana Cizim (paor_aveva_ana, AVEVA E3D ciktisi) PDF text layer'i bos. pdf-parse 2 karakter cikariyor. AI vision OCR yaparak parse ediyor — bu format icin L2 yapilamaz.

L2 sadece **text-PDF formatlari** icin yazilir. PAOR pilot icin cache + L3 mimarisi yeterli.

### MK-50.3 — Yeterli ornek olmadan format-spesifik kural yazilmaz

50'de Tersan format'i icin 3 ornek PDF (S08, S09, S10) ile parser_kural yazildi. Yeni bir format icin parser_kural yazmadan once minimum 3 basarili AI parse ornegi gerekir.

### MK-50.4 — Dotfile dosya adi kontrolu

.gitignore, .env gibi dotfile'lar olusturulurken ls -la ile gizli dosya kontrolu yapilir. 49'da yazilan .gitignore aslinda gitignore (nokta yok) olarak kayitlanmis, 1 oturum boyunca ise yaramamis.

### MK-49.1 (devam) — izometri-oku.js'e dokunulmaz

L2 engine lib/l2-parser.js olarak ayri dosyada yazildi. izometri-oku.js'in parserKuralIle STUB'i 51'e kadar dokunulmadi. Sebep: 1206 satir handler'in 47 self-test felaketinin dersi.

---

## Test Sonucu (3 PDF lokal)

3/3 BASARILI — tum alanlar 13/13 (%100), her PDF icin 4-5 malzeme satir, 1-2 ms parse hizi.

| Alan | S08 | S09 | S10 |
|------|-----|-----|-----|
| spool_no | S08 | S09 | S10 |
| et_mm | 4.5 | 4.5 | 4.5 |
| boy_mm | 5950 | 4701 | 4050 |
| proje_kodu | NB1110 | NB1110 | NB1110 |
| malzeme_satir | 5 | 4 | 4 |

---

## 51'de Yapilacaklar

1. Tersan canli entegrasyon — izometri-oku.js parserKuralIle STUB'ina L2 baglanir (3 satir)
2. L2 metrikleri — ai_api_log.parser_seviye kolonu doldurulur
3. Format envanter UI — super_admin icin
4. Malzeme satir pattern temizligi — "WELDING NUMBERCUT NUMBER" gibi false positive'ler
5. Etkilesimli format ogretme modal
6. AI taslak uret endpoint — L3 sonucu + 2. AI prompt -> parser_kural taslagi

---

## Sinirlar

L2 engine su anda yapamadiklari: Image-PDF, SCH parsing, multi-page PDF, encoding sorunlari. 51'de canli kullanimla hangi sinirlarin sorun cikardigi netlesir.
