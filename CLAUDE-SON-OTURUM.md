# 50. Oturum — Tersan L2 Parser Pilot

> **Tarih:** 1 Mayıs 2026  
> **Süre:** Yaklaşık 7 saat  
> **Sonuç:** L2 prototip 3/3 başarılı, GitHub'a push, oturum kapandı

---

## Hedef

L2 parser prototipini gerçek text üzerinde test et, çalışırlığını kanıtla. Vizyon: 60× ekonomi mimarisi (1 AI çağrısı $0.036, 999 deterministic $0).

---

## Ana Keşif

**PAOR formatı image-PDF** (text yok, AVEVA E3D vektörel/raster çiziyor) — L2 imkansız.  
**Tersan text-PDF** (850-1500 char dolu metin) — L2 yapılabilir.

**MK-50.2** doğdu: format bazında L2 uygunluğu kontrol edilir. PAOR cache+L3'te kalır, Tersan L2'ye geçer.

---

## Çalışma Akışı

### Bölüm 1 — Veri Turu
- PAOR ai_api_log incelendi: `istek_full` ve `istek_kisaltma` 13/13 NULL
- 2 PAOR PDF Storage'tan indirildi, pdf-parse 2 karakter (image-PDF)
- 3 Tersan PDF (S08, S09, S10) ayni şekilde indirildi, 850-833 karakter dolu metin
- Pattern analizi: Tersan formatı çok düzenli, sayılar yapışık ama tahmin edilebilir

### Bölüm 2 — Güvenlik Krizi
- Kullanıcı `sb_secret_*` anahtarını chat'e yapıştırdı
- Claude uyarı verdi, anahtar Supabase Dashboard'tan silindi
- JWT rotation Vercel Legacy JWT'sini bozdu, yeni Legacy JWT alındı
- Vercel cache'siz redeploy ile site geri geldi
- **MK-50.1** doğdu: hassas anahtar Claude'a verilmez

### Bölüm 3 — Migration 025 Tasarım
- `parser_kural` JSONB şema v1 yazıldı
- Tersan'a özgü `post_processing: prefix_garanti` (B1110 → NB1110)
- Yüzey whitelist: Galvaniz/Boya/Asit + fallback Diğer
- Sertifika grupları: kurum + sınıf (BV/DNV/LR + I/II/III)
- Malzeme tablosu satır tipleri: boru, fitting, işlem
- Kabul kriterleri: zorunlu alanlar + min match oranı + l3_fallback

### Bölüm 4 — Engine + Test
- `lib/l2-parser.js` v1 yazıldı (regex apply + post-processing + fallback)
- `scripts/l2-test-tersan.mjs` yazıldı (3 PDF E2E test)
- 1. tur test: 12/12 alan match (%100), AMA 3 bug:
  - `et_mm`: 4.5595 (yanlış, yapışık)
  - `proje_kodu`: NBB1110 (çift NB)
  - `malzeme_satir`: 0 (pattern uymadı)

### Bölüm 5 — Bug Fix
- Migration 026 yazıldı (UPDATE jsonb_set)
- `et_mm` regex: `(\d+(?:\.\d+)?)x(\d\.\d)(\d{3,5})` — et tek decimal hane, sonrası boy
- `proje_kodu`: regex sadece sayıyı yakalar, `format_template: NB{n}` prefix ekler
- `boy_mm` yeni alan eklendi
- `malzeme_tablosu` `satir_tipleri` yeni pattern'ler + `grup_haritasi` desteği
- `baslik_tetikleyici` null'a set
- `lib/l2-parser.js` v2 yazıldı (grup_haritasi desteği)

### Bölüm 6 — Final Test
- 3/3 BASARILI
- 13/13 alan (%100)
- 5/4/4 malzeme satır
- 1-2 ms parse hızı
- proje_kodu: NB1110 (doğru)
- et_mm: 4.5 (doğru)
- boy_mm: 5950/4701/4050 (doğru)

### Bölüm 7 — GitHub Push
- `gitignore` → `.gitignore` rename krizi (49'dan kalmış, MK-50.4)
- Migration 026 GitHub'da bir versiyon vardı (49 sonu push edilmiş), rebase conflict
- HEAD versiyonu tutuldu (`--ours`), rebase devam etti
- vim'de takıldık, abort + tekrar push (otomatik tamamlandı)
- 2 commit push edildi: `fc84f41` (kod) + `9d7f539` (docs)

---

## Teknik Notlar

- **pdf-parse v1.1.1 bug:** `'pdf-parse'` import yerine `'pdf-parse/lib/pdf-parse.js'` kullanıldı
- **zsh quote sorunu:** parantez yerine düz tırnak veya heredoc
- **Mac indirme bozuk:** dosya transferi `cat > ... <<'EOF'` heredoc ile yapıldı
- **Supabase SQL Editor terminal komut almaz:** `cd ~/Desktop/...` yapılan hata, düzeltildi

---

## Performans

- **L2 parse:** 1-2 ms/PDF
- **AI vision parse:** ~24 sn/PDF
- **Hız farkı:** 12,000×
- **Maliyet farkı:** $0 vs $0.036 = 60× ekonomi tüm format için (Tersan canlıya bağlanınca)

---

## Mimari Kararlar Yapılı Liste

- **MK-50.1** — Hassas anahtar paylaşım disiplini
- **MK-50.2** — Image-PDF formatları için L2 imkansız
- **MK-50.3** — Yeterli örnek olmadan format-spesifik kural yazılmaz (min 3)
- **MK-50.4** — Dotfile dosya adı kontrolü (`ls -la` ile)
- **MK-49.1 (devam)** — `izometri-oku.js`'e dokunulmaz, L2 ayrı dosyada

---

## 51'e Devralan

1. Tersan canlı entegrasyonu (3 satır iş)
2. L2 metrikleri kolonu doldurma (`ai_api_log.parser_seviye`)
3. Format envanter UI
4. Malzeme pattern temizliği (false positive'ler)
5. Etkileşimli format öğretme modal
6. AI taslak üret endpoint
7. tv() i18n eksiklikleri (28 uyarı)
8. Hatalı kayıt aksiyonları (kuyruk endpoint'leri)

---

## Final Commit'ler

- `fc84f41` — feat 50 tersan L2 parser prototip 3 of 3 PDF basarili
- `9d7f539` — docs 50 oturum kapanis belgeleri

---

> 50. oturum **çok büyük bir oturum** oldu. Vizyonun temelini somutlaştırdık. 60× ekonomi mimarisi artık hayal değil, **çalışan kod.** Tersan canlıya bağlanınca etki kullanıcı tarafında görülecek.
