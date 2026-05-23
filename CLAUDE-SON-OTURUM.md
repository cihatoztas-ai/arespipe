# CLAUDE -- Son Oturum Ozeti (Oturum 115, 23 May 2026)

## Ozet
ANA TEMA hedefi montaj eslesme + gosterimdi (114'un B-ertelemesi). Adim 1'e (montaj L2 canli
dogrulama) baslayinca **iki gizli bug** ortaya cikti ve cozuldu; Adim 1 tamamlandi (montaj L2
ilk kez canlida calisti), eslesme + gosterim (Adim 3-4) 116'ya kaldi. **Yarim is birakma**
ilkesi geregi Adim 1 saglam kapatildi (montaj verisi `parse_sonuc.montaj`'a deterministik akiyor,
$0); ekranda gosterim + spool eslesmesi bilincli olarak sonraki oturuma.

## Tani yolculugu (veriyle, "varsayma")
1. M270 test devresi yuklendi. Montaj PDF'leri (`*.1.pdf`) eski IMALAT formatina (84c12f61)
   dusuyordu, `montaj:{}` uretmiyordu (montaj_var=false).
2. fingerprintSkor (izometri-oku.js, DOKUNULMADI): dosya_adi +5, uretici/baslik/tablo +1, ESIK=2.
   Eski imalat regex'i (`^M\d+-\d+-\d+\.\d+\.pdf$`) montaj dosyasini +5 yakaliyordu; yeni montaj
   regex'i (`_` ayrac) M270 noktali adi kaciriyordu. Eski 6, yeni montaj 2 -> eski kazaniyordu.
3. pdftotext -layout ile icerik imzasi olculdu: montaj=`Continue:` VAR/`Malzeme Listesi` YOK;
   imalat tersi. Tam ayrim.
4. Migration 091 (B plani): dosya_adi_regex iki formattan kaldirildi, montaja `baslik_regex=Continue:`
   eklendi. Skor: montaj PDF -> montaj 2/imalat 1; imalat PDF -> imalat 3/montaj 1. Canliya COMMIT.
5. Fingerprint duzeldi AMA montaj `parser_seviye=l3`'e gidiyordu. `ai_api_log._l2_fallback.l2_sebep`
   = `l2_exception:Cannot read properties of undefined (reading 'substring')`. KOK NEDEN: parserKuralIle
   `JSON.stringify(sonuc.parsed).substring` -> montaj_modu'nda `parsed` YOK -> patliyor -> L3 fallback.
6. l2-parser.js LOKAL test (pdf-parse + parse, M270 metni): montaj:{} kusursuz uretiliyor. Parser
   saglam, sorun cagirmadaydi (sekil uyumsuzlugu).

## izometri-oku.js 115 fix (MK-115.1, MK-49.1 korundu)
- `parserKuralIle`: montaj/imalat sekil ayrimi. `montajMi = !!sonuc.montaj`. Montajda `cevapGovde =
  {montaj}`, donus `montaj: sonuc.montaj` + `spoollar:[]`; imalat eski `sonuc.parsed.spoollar`.
  substring artik `cevapGovde` uzerinde (guvenli).
- Dispatcher: `if (parseSonuc.montaj)` dali -- asme/halusinasyon/batchSonucBirlestir ATLA,
  `ozet.montaj` dondur, spooller'a dokunma. Imalat eski akis aynen.
- Fingerprint okuma/skorlama tarafina DOKUNULMADI (MK-49.1). Parser sonuc paketleme + dispatcher dal.
- Lokal regresyon: imalat PDF -> montaj null + spoollar (eski sekil korundu).

## Migration 091 (CANLI COMMIT)
- Montaj 39a2c81b: `(fingerprint - 'dosya_adi_regex') || {baslik_regex:'Continue:'}`.
- Imalat 84c12f61: `(fingerprint - 'dosya_adi_regex')` (digerleri dokunulmadi).
- Supabase: dry-run ROLLBACK -> SELECT dogrula -> COMMIT. Repoya dry-run arsivi eklenecek (borc 3).

## Canli dogrulama (M130, yeni proje, cache MISS)
- M130-000-001.1.pdf: montaj, l2, spool=1, continue=1, agirlik=98, cache yok.
- M130-000-002 1(2).1.pdf: montaj, l2, spool=3, continue=1, agirlik=404 (coklu spool).
- M130-000-002 2(2).1.pdf: montaj, l2, spool=2, continue=2, agirlik=258.
- alistirma=null (bu PDF'lerde sinyal yok -- beklenen). Imalat: 84c12f61, montaj_var=false (dogru).

## Mimari kararlar
- MK-115.1: Montaj L2 sekli {ok,montaj:{}} -- parserKuralIle + dispatcher ayrı ele alir, spooller'a dokunmaz.
- MK-115.2: Format ayrimi icerik-bazli (dosya adindan bagimsiz). Montaj=Continue:, imalat=Malzeme/Cut.
- MK-115.3: Ayni proje cok gemiye yuklenebilir (ikiz gemi) -- farkli devre_id, hata degil.

## Dersler
1. Veriyi gor, varsayma -- yanlis JSON anahtari (`malzemeler` vs `malzeme_listesi`) yanli yonlendirdi.
2. Lokal repro kok nedeni kesinlestirdi (substring, parser degil cagirma).
3. Coklu ornek (M130 3+2 spool) parser liste toplamasini dogruladi.
4. fingerprintSkor negatif sinyal desteklemez -> pozitif imza (Continue/Malzeme) ile ayir.
5. SQL Editor kuyrugu UPDATE edemiyor (RLS) -> yeniden isleme sayfadan.
6. Cache key hash+format_id+tenant -> yeni dosya (M130) en temiz test.

## Commit'ler
| Hash | Icerik |
|------|--------|
| b65ad3c | fix(115): montaj L2 sekil ayrimi -- parserKuralIle substring + dispatcher montaj dali (MK-115.1) |
| (091)  | migration 091 dry-run arsivi -- repoya eklenecek (borc 3) |
| (doc)  | kapanis dokumanlari [skip ci] |

CI: YESIL (b65ad3c kod commit'i, [skip ci] YOK). Vercel deploy basarili (M130 montaj L2 canli kaniti).

## Degisen/yeni dosyalar
- api/izometri-oku.js (parserKuralIle sekil ayrimi + dispatcher montaj dali -- MK-115.1)
- izometri_format_tanimlari (DB, 091: iki format fingerprint guncellendi -- CANLI)
- migrations/091_montaj_imalat_fingerprint_icerik.sql (YENI, dry-run arsiv -- repoya eklenecek)
- lib/l2-parser.js: DOKUNULMADI (114'te eklenen montaj_modu zaten dogru calisiyor)

## Sonraki oturum
Detay CLAUDE-SONRAKI-OTURUM.md. **116 ANA TEMA: Montaj ESLESME + GOSTERIM + pipe_no enjeksiyonu**
(114-115 B-ertelemesini tamamla). Montaj L2 verisi `parse_sonuc.montaj`'a akiyor; simdi:
(a) ESLESME montaj.spool_listesi+pipeline_no -> spooller (devre_id sinirli); (b) alistirma->
spooller.alistirma (enum gercek degerini SORGULA once); (c) GOSTERIM spool_detay montaj karti.
pipe_no enjeksiyonu karari (A/B). Sonra D1 kalan + D3.
