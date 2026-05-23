# CLAUDE -- Son Oturum Ozeti (Oturum 114, 23 May 2026)

## Ozet
ANA TEMA D1 (format ogrenme, fingerprint zayif $3.44) ile basladi, **tani veriyle tersine dondu**:
delik imalat PDF'lerinin kacmasi DEGIL, **montaj/genel cizimlerin** (malzeme listesi YOK) pahali
L3'e gidip "malzeme yok" donmesiydi. Cozum: montaji tanitan yeni format kaydi (migration 090) +
`lib/l2-parser.js`'e geri-uyumlu `montaj_modu` + `liste_alanlar`. Montaj artik L2 deterministik
topoloji hasati yapiyor (spool listesi + continue + alistirma + toplam agirlik), sifir AI ->
~$3.38 L3 israfi durdu. **B karari:** bu oturum TANIMA + L2 HASAT'i indirdi; eslesme + spool-detay
gosterimi + pipe_no enjeksiyonu 115'e. Canli: CI + Vercel yesil, migration COMMIT (count=1).

## Tani yolculugu (veriyle, "varsayma")
1. format_id dagilimi: 156 (YOK) cagri / 146 PDF / $3.44. Cache calisiyor (mukerrer ~yok).
2. pipeline_no on-ek kumeleme: %87 Tersan (G 77 + M 60). DIGER ~$0.39.
3. 154/156 cagri 21 May icerik-regex'inden SONRA -> "zaten duzeldi" hipotezi curudu.
4. malzeme_listesi bos/dolu: 154/154 MONTAJ (bos). Skorlama bug'i YOK, delik montajda.
5. pdf-parse + fingerprintSkor birebir kopya, 12 PDF: imalat skor=3 (L2'de, dogru), montaj skor=1
   (esik 2 alti -> L3). Glyph hipotezim curudu (metin cikiyor).

## Montaj alan haritasi (12 PDF / 6 proje dogrulandi)
- **Cekirdek:** spool_listesi (S01-S05 tam), continue_baglanti (graf), alistirma (3 sinyal:
  dosya-ALS=PARCA / continue-ALS=BAGLI / NOT=PARCA), toplam_agirlik, pipe_no (DOSYA ADINDAN).
- **Paylasilan:** yuzey/blok/tarih/sistem. **Ham:** guverte (savruk). **Cikmiyor:** 3D/geometri.
- Iki test bug'i yakalandi: spool overlap (ardisik ayrac tuketme -> lookbehind/lookahead fix),
  guverte trailing-\n. pipe_no rigid icerik-regex'i 4/6 NULL -> dosya adindan cozuldu (12/12).

## Fingerprint (A-siki, izometri-oku'ya DOKUNULMADI)
- dosya_adi_regex `^[A-Z]+\d+-[\dA-Za-z]+-[\dA-Za-z-]+_(?!S\d)[\d_]*\d\.pdf$` + Cadmatic.
- 12 PDF: 6 montaj->MontajA(6), 6 imalat->Imalat(3). Cakisma yok, sinirda degil.

## l2-parser.js degisikligi (geri uyumlu, sifir regresyon)
- `listeAlanCikar()` helper (matchAll coklu toplama).
- `parse()` montaj_modu erken-dali: liste_alanlar + montaj_alistirma_kurali -> montaj:{} doner.
- montaj_modu yoksa eski spoollar:[spool] AYNEN. 3 imalat PDF'inde regresyon-yok dogrulandi.

## Migration 090
- dry-run guard + idempotency (format_kodu UNIQUE DEGIL, elle kontrol) + fingerprint + parser_kural
  + guvenlik agi (requires_ai=true, l3_fallback_yapilir=true).
- egitim_kaynagi='vision_only' (CHECK kisiti; aslinda elle yazildi).
- Supabase elle akis: dry-run ROLLBACK -> dogrulama -> COMMIT. count=1.
- Repodaki dosya son satir ROLLBACK = guvenli dry-run arsivi (karisiklik onleme notu son-durum'da).

## Mimari kararlar
- MK-114.1: (YOK) deligi cogunlukla montaj cizimleri (malzeme yok), imalat zaten L2'deydi.
- MK-114.2: montaj/imalat ayrimi = format_id ayrimi (dokuman_tipi'ne deger eklemeye gerek yok).
- MK-114.3: A-siki fingerprint + guvenlik agi C (fail->L3, veri kaybi yok).
- MK-114.4: izometri pipe_no DOSYA ADINDAN (split('_')[0]); icerik regex'i kirilgan.
- MK-114.5: l2-parser montaj_modu + liste_alanlar (matchAll), geri uyumlu.

## Dersler
1. Veriyi gor, varsayma -- iki hatali taniyi curuttu (glyph + "imalat takiliyor").
2. Cok ornekle test (2 yetmez, 6+ bug cikarir).
3. Kural DB'de olabilir ama kod islemeyebilir (113 tuzagi) -> kodu okuyup montaj_modu eklendi.
4. CHECK degerlerini varsayma (egitim_kaynagi dry-run'da yakalandi).
5. Cihat'in 3D/walk fikri (MK-49.A) gecerli ama dar: aci tek basina 3B yon degil, sirali baglanti
   metinde yok; FR/CL/BL ile kisit-cozumu/oz-denetim mumkun, tam 3B degil.

## Commit'ler
| Hash | Icerik |
|------|--------|
| 0cd0f89 | feat(114): montaj formati L2 hasat -- tersan_cadmatic_montaj. l2-parser montaj_modu + migration 090 |
| (doc) | kapanis dokumanlari [skip ci] |

## Degisen/yeni dosyalar
- lib/l2-parser.js (montaj_modu + liste_alanlar + listeAlanCikar -- geri uyumlu)
- migrations/090_tersan_montaj_format.sql (YENI, dry-run arsiv; canliya COMMIT edildi)
- izometri-oku.js: DOKUNULMADI (MK-49.1)

## Sonraki oturum
Detay CLAUDE-SONRAKI-OTURUM.md. **115 ANA TEMA: Montaj eslesme + gosterim + pipe_no enjeksiyonu**
(114'un B-ertelemesini tamamla). Once canli montaj L2 dogrulama, sonra eslesme (pipeline_no+spool_no
-> spooller, alistirma yansit), sonra spool detayda goster. pipe_no enjeksiyonu (izometri-oku dosya
adindan) karari verilecek. Sonra D1 kalan + D3.
