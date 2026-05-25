# CLAUDE-SON-OTURUM — Oturum 120 (25 May 2026)

## Tip
KOD oturumu. Format-tanitma kilavuzunun "A isi" (registry genisleme) gercek-veri ile icraati.
Plan veriyle yeniden yonlendi: 84c12f61 degil 39a2c81b baglandi.

## Akis (ne yaptik, ne kanitladik)
1. Acilis: git temiz (a5349e4), CI yesil. "Siradan devam" = SONRAKI-OTURUM onerisi (A) 84c12f61 baglama.
2. 84c12f61 DB icerigi cekildi. Bulgu: parser_kural'i e1fb879d spool kuralinin KOPYASI (ayni 7 satir_tipi,
   tek fark not_metni yok). fingerprint'i SPOOL imzasi (Malzeme Listesi + Cut & Bending). 3 montaj formati
   oldugu gorudu: e1fb879d(spool), 84c12f61(isometry), 39a2c81b(montaj).
3. 7 gercek montaj/izometri PDF (6 gemi) canli cikariciyla (pdf-parse v1.1.1) cikarildi. 7/7'de Malzeme
   Listesi + Cut&Bending YOK; Continue: + spool listesi VAR. -> Senaryo 2: 84c12f61 kurali YANLIS (spool
   kopyasi montaja uymaz, hep L3'e duser = "hep ya hic" gerilimi).
4. BONUS: 2 PDF (NB1137 E100/AT110-803) "format vermedi". Inceleme: Cadmatic glyph, ama Latin-oran kontrolu
   KACIRDI. Kayma olculdu = SABIT -29 Sezar. Cozulunce metin temiz (pipe_no/tarih/sablon dogru). -> MK-120.3.
5. 39a2c81b DB cekildi: montaj_modu:true, liste_alanlar (guverte/spool/continue), montaj_alistirma_kurali
   (-ALS), min_spool:1, malzeme tablosu YOK. = GERCEK montaj parser'i. pipe_no regex'i [[PIPE:]] markerini
   ariyor ama markeri ureten kod grep'te YOK -> pipe_no hep null (NB1137 pipeline_no kirilmasi = bu).
6. PIVOT (Cihat onayi): 39a2c81b'yi bagla, 84c12f61'i emekliye ayir. izometri-oku.js'e dokunma.
7. l2-parser.js + katman-birlestirici.js tam okundu: montaj yolu (satir 246-290) calisiyor, kabul kriteri
   spoolListesi>=min_spool (malzemeden bagimsiz), birlestirici montaj gecislerini tasiyor. Motor degismez.
8. Container'da 119 metodolojisi (3 lib dosyasi birebir + pdf-parse v1.1.1):
   - ONCESI (39a2c81b DB kurali, kirik [[PIPE:]]): pipe_no 7/7 null, alistirma hep null.
   - MONTAJ_TERSAN paketi yazildi (pipe_no fix: gercek SPOOL NAME regex), AILE_KAYIT'a 1 satir.
   - SONRASI (registry): 5/5 temiz montajda pipe_no DOLDU, M100 -> alistirma=PARCA. 2 glyph PDF L3.
   - REGRESYON: 8/8 spool PDF byte-byte ayni.
9. Pilot test guncellendi: T6 montaj assertion (artik BAGLI) + T7 montaj drift guard. Composability
   testleri TUM_PAKETLER yerine SPOOL ailesine baglandi (T1/T3 montaj sizintisi yakaladi -> MK-120.4).
   Pilot 30/30 yesil.
10. Nihai dosyalar (yorumlu) uretildi, MD5 dogrulamali kopyalandi, lokal pilot yesil, commit+push.
    CI yesil (token-suz). 84c12f61 aktif=false (egitim_kaynagi CHECK enum cikti, not oraya yazilmadi -> MK-120.5).

## Dosyalar
- lib/format-paketleri.js (MONTAJ_TERSAN + AILE_KAYIT montaj satiri + pipe_no fix + TUM_PAKETLER)
- test/asama1-pilot.mjs (T6 fix + T7 drift guard + SPOOL ailesi)
- DB: izometri_format_tanimlari 84c12f61 aktif=false
- DEGISMEDI: api/izometri-oku.js, lib/l2-parser.js, lib/katman-birlestirici.js

## Commit'ler
- 3c142f9 feat(120): montaj ailesi registry baglandi + NB1137 pipe_no fix (CI gecti)

## Dersler (MK-120.1..5 — son-durum.md'de tam)
- Baglanacak satiri VERIYLE teyit et, isimle degil (84c12f61 olu satir cikti).
- Ureten-kod-yok marker'a guvenme; cikarimi gercek metinde test et (NB1137 pipe_no kirilmasi).
- Glyph = -29 Sezar (onarilabilir); Latin-oran glyph dedektoru DEGIL (yanlis-negatif).
- TUM_PAKETLER cok-aile; tek-aile is icin AILE_KAYIT[format_kodu].
- DB kolonu serbest sanma; CHECK constraint'i yazmadan kontrol et (MK-101.5 tekrari).
- Registry genisleme iddiasinin GUCLU kaniti: yapisal olarak FARKLI aile (montaj_modu, tablosuz) tek
  satirla, motora dokunmadan baglandi. "Yeni aile = bir satir" A1 kopyasiyla degil, gercek farkliyla dogrulandi.
