# CLAUDE-SON-OTURUM — Oturum 121 (25 May 2026)

## Tip
KOD oturumu. SONRAKI-OTURUM onerisi (A) glyph onarimi. Cihat "a olsun" -> band A icra edildi.
Plan veriyle yonlendi: glyph IKI BANTLI cikti; band A tamamlandi, band B olculup ayri oturuma birakildi.

## Akis (ne yaptik, ne kanitladik)
1. Acilis: git temiz (ea18390, 120 kapanisi), CI yesil. Dosyalar + kilavuz son hali geldi.
2. Kilavuz okundu (Bolum 5.1/6/13): glyph -29 bulgusu, Asama 1/2 baglami. -29 matematigi DOGRULANDI
   (kilavuzdaki "+29" gosterimi ters yaziliydi; gercek: glyph - 29 = gercek; "pmlli"->"SPOOL").
3. Dosyalar geldi (l2-parser, katman-birlestirici, format-paketleri, izometri-oku, pilot, tersan.zip).
   izometri-oku.js incelendi: explicit "Latin-oran" dedektoru YOK. Glyph PDF -> kaymali metin ->
   fingerprint sinyal 3/4 (baslik/tablo_baslik) KACIRIR, ama dosya_adi_regex (+5) tanimayi kurtarir ->
   L2 kaymali metinde fail -> L3. Iki metin-cikarim noktasi: pdfIpucuCikar (629), parserKuralIle (871).
4. OLCUM (kod yazmadan, SONRAKI'deki "once olc" disiplini):
   - 4 NB1137 PDF: ham capalar=[] ; -29 sonrasi ["SPOOL NAME","PART NUMBER","WELDING NUMBER","CUT NUMBER"].
   - BANT AYRIMI bulundu: band A (buyuk/rakam) -29 ile temiz; band B (kucuk harf) Latin-1'e (0xC0+)
     cevrilmis, aritmetik degil ters tablo gerektirir. Band B kayma kod uzayinda uniform degil (gosterilen
     uzayda -98..-122) -> font cmap.
   - PARSE olcumu (15 PDF): KAPISIZ -29 TUM temiz PDF'leri BOZDU (L3'e dustu). NB1137 montaj L3->L2
     kazandi. NB1137 spool -29 sonrasi HALA L3 (malzeme tablosu band-B). -> Kapi ZORUNLU.
   - Band B tam haritasi denendi: 28 karakterin 18'i cikti, 10 Turkce/sembol artik (Ñ Å Ü Ç ş ğ ñ ć °
     + sigma->'i'). Band A+B ile E100 spool metni neredeyse temiz ("5 kg","Paslanmaz","Malzeme Listesi")
     ama eksik harita malzeme basligini bozuyor ("Ağσrlσk").
5. KARAR (Cihat'a A/B/C): (A) band A bu oturum, (B) band A+B, (C) Asama 2. Cihat: (A).
6. lib/glyph-onar.js yazildi (KAPILI, capa = tumu-buyuk band-A token). 15 PDF'te dogrulandi:
   kazanc=2, regresyon=0, ayni=13. Kapi: temiz metin byte-byte degismez.
7. izometri-oku.js'e 4 minimal dokunus (import + pdfIpucuCikar normalize + parserKuralIle normalize +
   _l2_meta bayragi). Motor/lib DEGISMEDI. node --check temiz.
8. Pilot'a T8 eklendi (17 assertion): deterministik -29, kapi (temiz/glyph/capasiz), onarim->parse,
   ve KAPININ ZORUNLULUGU drift guard (kapisiz -29 montaji bozar). 47/47 yesil.
9. Final dosyalar MD5'li outputs'a kopyalandi. Kapanis ucusu + kilavuz guncellemesi.

## Dosyalar
- lib/glyph-onar.js (YENI, 85 satir) — Katman 0 glyph on-isleme.
- api/izometri-oku.js (4 dokunus) — import + 2 normalize noktasi + meta bayragi.
- test/asama1-pilot.mjs (T8 + 17 assertion, 47/47) — glyph band-A self-test + drift guard.
- DEGISMEDI: lib/l2-parser.js, lib/katman-birlestirici.js, lib/format-paketleri.js.

## MD5 (arespipe_kopyala icin)
- lib/glyph-onar.js     837bcbc48a32b19d294cf15238b06cf7
- api/izometri-oku.js   0b9f3c120a9b8c4152e45620083788e8
- test/asama1-pilot.mjs c640a46873c81832e7a5a8b667ef755e

## Commit (onerilen)
feat(121): Cadmatic glyph band-A (-29) kapili onarim + capa-token tespiti (NB1137 montaj L2; sifir regresyon)

## Dersler (MK-121.1..4 — son-durum.md'de tam)
- Glyph onarimi KAPILI olmali; kapisiz -29 temiz metni bozar (11/11 olcum). (MK-121.1)
- Glyph IKI BANTLI: band A aritmetik (-29, evrensel), band B font cmap ters tablosu (font-ailesine ozel).
  "Tam onarildi" diye varsayma; alan alan olc. SONRAKI uyarisi dogrulandi. (MK-121.2)
- Kapi capalari band-A kurtarilabilir TUMU-BUYUK token olmali (kucuk-harfli "Drawing symbols" capa degil). (MK-121.3)
- Onarim fingerprint ONCESI olmali (Katman 0): yalniz parse degil, icerik-tabanli tanima da duzelir ->
  sessiz yanlis-yonlendirme kapanir. (MK-121.4)
- Metodoloji teyidi: "once olc, sonra kod" (SONRAKI disiplini) bant ayrimini erken yakaladi; yarim
  band-B haritasiyla spool'a girmekten kacindik (MK-96 ruhu: yarim kaynakla iddia etme).
