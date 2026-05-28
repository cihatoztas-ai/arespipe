# Oturum 132 — 131'in glyph tezi çürütüldü; parse yolağı sağlam, "baş iş" konusuz

131, montaj/spool sorununu "recognition glyph band-B boşluğu"na bağlamış ve 132'nin baş
işini "glyph band-B decode tablosunu tamamla" olarak kurmuştu. 132'de gerçek PDF'ler canlı
kodla uçtan uca çalıştırıldı: **131'in tüm zinciri yanlış.** Band-B tablosu zaten var ve
çalışıyor, tanıma onarılmış metni skorluyor, dispatch L2'ye giriyor, kaymış montaj PDF'i
`montaj{}` üretiyor. Glyph tarafında yapılacak iş YOK. Kod 133'e değil — **kod zaten doğru.**

## Bağlam

- Açılış: git temiz, HEAD `2acef13` (131 doc, `[skip ci]`), CI yeşil. Function 12/12.
- Cihat 4 gerçek PDF gönderdi: E100-817-005 (montaj `_1.pdf` + imalat `_S01_1.pdf`),
  M100-317-18-ALS (montaj + imalat). Ayrıca güncel `glyph-onar.js`, `izometri-oku.js`,
  `format-paketleri.js`, `katman-birlestirici.js`, `l2-parser.js` + DB fingerprint/parser_kural.

## Yapılanlar (sırayla — her adım canlı kanıt)

1. **Çöp doğrulandı:** pdf-parse v1.1.1 E100'de gerçekten çöp üretiyor (`bNMMJUNTJMMR`,
   `m~ëä~åã~ò`, `pmlli=k^jb`). pdftotext doğru okuyor. Gömülü-değil ArialMT Identity-H teyidi.

2. **metinNormalle uygulandı (kritik dönüm):** Mevcut `glyph-onar.js` (HEAD'deki haliyle)
   ham çöpe uygulandı. Kaymış E100 montaj+imalat: `SPOOL NAME`/`Malzeme Listesi`/`Cut &
   Bending Info`/`Continue:` + malzeme satırları **tam kurtarıldı, 0 eşlenmeyen.** Yani
   band-B tablosu zaten yeterli. **131'in "band-B yok" tezi yanlış.** M100 = temiz (ham'da
   çapa var, dokunulmuyor). → Tersan = temiz (M100) + kaymış (E100) iki alt-sınıf.

3. **Bayat yorum bulundu (kök):** `izometri-oku.js:887-890` "Band B onarmaz" diyor; ama
   altındaki `metinNormalle(hamText)` band-A VE band-B yapıyor (fonksiyon zincirliyor).
   Yorum 121'den kalma, band-B 122'de eklenince güncellenmemiş. **131 bu satırı (889)
   okuyup "kod band-B yapmıyor" diye teşhisi yanlış zemine kurmuş.**

4. **Tanıma yolağı doğrulandı:** `pdfIpucuCikar` (642) `metinNormalle` çağırıp `normMetin`'i
   skorlamaya veriyor. Yani onarılmış metin skorlanıyor — benim "tanıma çağırmıyor"
   hipotezim de yanlış.

5. **Gerçek fingerprintSkor (DB fingerprint'leriyle):** birebir kopya container'da koşuldu.
   - E100 montaj → tersan_cadmatic_montaj **2** (üretici+1, Continue:+1)
   - E100 imalat → tersan_cadmatic_spool **3** (üretici+1, Malzeme+1, Cut&Bending+1)
   - M100 montaj/imalat → aynı. **Dördü de ≥2 → TANINIYOR.** 131'in "E100 tanınmıyor" yanlış.

6. **Dispatch incelendi:** L2'ye giriş tek koşula bağlı (215: DB `parser_kural` boş değil).
   `requires_ai` kullanılmıyor. SQL: `pk_bos=false` ikisinde de → kapı geçiyor. Benim
   "dispatch L2 atlıyor" hipotezim de yanlış.

7. **Uçtan uca pipeline (definitif):** pdf-parse → metinNormalle → aileBirlestir → parse,
   4 PDF. Hepsi `parser_seviye=l2`, parse.ok=true. Montaj PDF'leri `montaj{}` üretti
   (kaymış E100 dahil: pipe E100-817-005, spool[S01-S06], continue, B1137, Paslanmaz).
   İmalat PDF'leri spool + malzeme listesi üretti. Tersan AILE_KAYIT'te → etkin kural
   format-paketleri.js'ten (MK-119.2), DB parser_kural parse için ölü.

8. **ai_api_log + DB yer-gerçeği:** SHA aramasıyla bu PDF'lerin gerçekte ne ürettiği
   doğrulandı; format dağılımı bugün L2 olduğunu, L3'lerin eski olduğunu gösterdi; "Montaj
   Resmi" (`tersan_cadmatic_isometry`) `aktif=false` + spool imzalı → suçsuz; 817-005
   spool'ları DB'de yok (taze test örnekleri).

## Verdict

Dört turluk doğrulama tek sonuca çıktı: **parse yolağı sağlam.** 132'nin planlı glyph baş
işi konusuz. 130'un montaj_json-null symptom'u parse bug'ı değil; muhtemelen bayat veri
(122 öncesi L3 parse). Çözüm gerekirse re-parse, yeni kod değil.

## Hijyen (133 push'unda uygulanacak)

1. **izometri-oku.js:887-890 yorum düzeltmesi (comment-only):**
   ```
   // 121/122: glyph kapili onarim (MK-120.3 band-A + 122 band-B). Gomulu-degil ArialMT
   // Identity-H kaymasi varsa band-A (-29) VE band-B (a-z/Turkce tablo) onarir; temiz
   // metinde no-op (kapi: ham'da capa varsa dokunmaz -> sifir regresyon).
   // 132 DUZELTME: eski yorum "Band B onarmaz" diyordu -> YANLIS. metinNormalle band-B'yi
   // de yapar; kaymis E100/M100 montaj+imalat L2'de tam parse oldu, montaj{} uretti.
   ```
   (İsteğe bağlı: 637'deki "band-A kapili onarim" yorumu da "band-A+B" yapılabilir; yanıltıcı
   değil ama eksik.)

2. **KARARLAR.md — 131.1-131.4 YAZILMAYACAK.** Yerine:
   - **MK-132.1:** Teşhis, canlı yolağı uçtan uca çalıştırmadan kapatılmaz. Kod yorumu (bayat
     olabilir), onarım-öncesi ham metin, "öğretilmiş" durumu tek başına kanıt değil. Zincir:
     pdf-parse → metinNormalle → fingerprintSkor (gerçek DB fingerprint) → aileBirlestir →
     parse, hepsi koşulmalı.
   - **MK-132.2:** metinNormalle band-A VE band-B yapar (122'den) ve hem tanıma (642) hem L2
     (891) yolağına bağlıdır. Gömülü-değil ArialMT Identity-H kaymış Cadmatic PDF'leri L2'de
     tam parse edilir (montaj{} + malzeme listesi). Glyph band-B boşluk değildir.

3. **PARSER-VE-YUKLEME-AKISI.md Bölüm 7.4 (132 düzeltmesi):** 7.3/8'in glyph band-B tezini
   iptal eder. Metin:
   > ### 7.4 Recognition glyph — 132 düzeltmesi (7.3 İPTAL)
   > 7.3'ün "AT110/E100 L3'e düşüyor çünkü glyph band-B boşluğu" tezi 132'de gerçek PDF'lerle
   > uçtan uca çürütüldü. metinNormalle band-A+B onarır (122'den), tanıma (642) onarılmış
   > metni skorlar, dispatch L2'ye girer (pk_bos=false), kaymış montaj `montaj{}` üretir.
   > Dördü de L2. 131'in dört tezi de yanlış; kök: bayat 889 yorumu + canlı yolak koşulmadı.
   > 130'un montaj_json-null'ı parse bug'ı değil, muhtemel bayat veri. (Bkz. son-durum 132.)

## Süreç notu

131 "her adımda canlı kanıt" diyordu ama tanıma/dispatch/parse'ı hiç koşmadı — yalnız ham
metni ve bir kod yorumunu okudu. 132 bunu düzeltti: dört hipotez (biri 131'in, üçü Claude'un
ara hipotezi) sırayla canlı veriyle elendi. Ders MK-132.1'e mühürlendi. Glyph defteri kapandı.

---

> 133 açılışında: bu dosya + son-durum + CLAUDE-SONRAKI-OTURUM + PARSER Bölüm 7.4.
> Glyph/tanıma KAPALI. İlk iş: K2 (Excel BOM × PDF malzeme_listesi diff).
