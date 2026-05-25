# CLAUDE-SONRAKI-OTURUM — Oturum 122 gundemi

## Acilis rituali (CLAUDE.md)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3`
2. Bugun ne? (Band B mi, Asama 2 mi, 117 mi, MK-120.6 mi)

## Once oku
- `.github/son-durum.md` — 121 kapanisi, MK-121.1-4, acik borclar.
- `docs/format-tanitma-kilavuzu.md` — Asama 1.6 (glyph band-A) TAMAM; Asama 2 SIRADAKI (Bolum 6).
- `lib/glyph-onar.js` — band-A onarici + capa-token kapisi (121'de yazildi).

## Karar verilecek (oturum basinda) — uc aday, hangisi once
- **(A) Glyph BAND B — lookup tablosu (glyph isini bitir).** ORTA-YUKSEK KALDIRAC. NB1137 spool'u da
  L2'ye kazandirir (su an band-A onarildi ama malzeme tablosu band-B kucuk harf -> hala L3). Is:
  (1) TAM band-B ters tablosu (gosterilen 0xC0+ -> gercek kucuk harf + Turkce ı/ş/ç/ğ/ö/ü + ° sembol).
      121'de 18/28 cikti; EKSIK: Ñ Å Ü Ç ş ğ ñ ć ° + sigma(963)->'i'. Bunlar tam da malzeme basliginda
      ("Aciklama/Boyut/Boy/Malzeme/Agirlik") ve satirlarda.
  (2) MK-96 CAPRAZ DOGRULAMA: harita 2 bagimsiz NB1137 PDF'inde ayni gercek metni uretmeli; tek-kaynak
      tahmin -> orijinali koru + isaretle.
  (3) glyph-onar.js'e band-B katmani (band-A'dan SONRA, SADECE glyph_band_a=true ise uygula -> diger
      formatlara dokunmaz, kapi guvenli).
  (4) bozuk-ornek testi (T9): band-A+B fixture -> NB1137 spool malzeme satirlari dolu.
  DIKKAT: Font-kapsamli (Cadmatic-Tersan). Eksik harita malzeme satirini SESSIZCE bozar -> her karakter
  dogrulanmadan "tam" deme (MK-121.2). Veri: 121'deki tersan.zip yeterli (E100/AT110 spool'lari).
- **(B) Asama 2 — eslestirme skoru + esik + tanima bosulugu.** fingerprintSkor'u paket duzeyine cikar.
  Motivasyon (120/121): 2/7 montaj "Continue:" tasimadigi icin 39a2c81b olarak TANINMAYABILIR (parse
  dogru, route yok). NOT: band-A onarimi (121) baslik capalarini actigi icin icerik-tanima KISMEN
  duzeldi; ama montaj fingerprint hala "Continue:" (band B). Skor+esik+ikincil aday tam cozer.
- **(C) 117 — yukleyen_id null.** Kucuk, canli sistemi etkiliyor. Veri sahipligi (KARAR-48.1) dikkat.

Oneri sira: **(A) band B** — glyph isini tamamlar (band A + band B = NB1137 tam L2, sifir-AI), 121'in
dogal devami, olcum verisi hazir. Sonra (B) tanima, sonra (C)/MK-120.6.

## Veri ihtiyaci (Cihat getirecek)
- (A) icin: 121'deki tersan.zip YETERLI (NB1137 E100/AT110 spool + izometri). MK-96 icin iki ayri
  NB1137 PDF capraz dogrulama. Yeni indirmeye gerek YOK.
- (B) icin: ek PDF gerekmez; mevcut 7 montaj + 8 spool yeterli.

## Teknik notlar (121'den tasinan)
- Parite/test HEP pdf-parse v1.1.1 (`pdf-parse/lib/pdf-parse.js`). v2 yaniltir/patlar. (MK-119.4)
- Glyph IKI BANTLI (MK-121.2): band A aritmetik (-29, glyph-onar.js'te CANLI); band B font cmap ters
  tablo (henuz yok). Band-B onarimi SADECE glyph_band_a=true icin uygulanmali (kapi guvenli kalsin).
- Glyph onarimi metin-cikarim sinirinda, fingerprint ONCESI (MK-121.4) — band B de ayni noktada.
- Band-B haritasi 121'de turetildi (band-harita.mjs mantigi): gosterilen char -> gercek char tek-eslemeli
  (font sabit). Ama EKSIK + Turkce/sembol riskli. Her karakteri 2 PDF'te dogrula (MK-96).
- glyph-onar.js capalari TUMU-BUYUK (band A). Band-B onarimi capalari ETKILEMEZ (capa zaten band-A'da acildi).
- 39a2c81b DB parser_kural hala eski [[PIPE:]] (ZARARSIZ, registry-bagli, MK-119.2). Asama 3'te temizlenir.

## Aciklik
- Asama 1 paketleri kod tarafinda (gecici, MK-119.2 ikiligi). Asama 3'te DB'ye tasininca tek kaynak DB olur.
- 84c12f61 emekli (aktif=false, MK-120.1). Tam silme YOK (append-only/gecmis, KARAR-48 ruhu).
- Band-A glyph onarimi (121) izometri-oku.js'in metin-cikarim noktalarinda; motor/lib (l2-parser,
  katman-birlestirici, format-paketleri) DEGISMEDI.
