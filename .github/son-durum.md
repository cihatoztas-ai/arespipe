# Son Durum -- 115. Oturum (23 May 2026)

> 114 -> 115 gecisi. ANA TEMA hedefi: **montaj eslesme + gosterim** (114'un B-ertelemesi).
> Sonuc: ADIM 1 (montaj L2 canli dogrulama) tamamlandi -- montaj artik canlida L2
> deterministik calisiyor. Yol boyunca iki gizli bug tanilanip cozuldu (fingerprint
> dosya-adi capazi + parserKuralIle montaj sekil patlamasi). Eslesme + gosterim
> (Adim 3-4) 116'ya birakildi -- veri akiyor, ekranda henuz gorunmuyor (BEKLENEN).

---

## Bu Oturumun Sonucu

**115'te montaj L2 hasati CANLIDA dogrulandi (ilk kez).** 114 montaj formatini + parser'i
indirmisti ama hic canli montaj islenmemisti. 115 once iki tikanikligi acti, sonra yeni bir
proje (M130) ile montaj L2'yi canli kanitladi.

- **Migration 091 (fingerprint icerik-bazli ayrim) -- CANLI (COMMIT):** Montaj/imalat ayrimi
  artik DOSYA ADINDAN BAGIMSIZ, icerik sinyalleriyle. Montaj formati `Continue:` baslik
  imzasiyla taninir; imalat `Malzeme Listesi` + `Cut & Bending Info` ile. Iki formattan da
  `dosya_adi_regex` KALDIRILDI. (B karari -- Cihat sectu.)
- **izometri-oku.js 115 fix -- CANLI (commit b65ad3c, CI yesil):** `parserKuralIle` montaj
  sekil patlamasi (`JSON.stringify(sonuc.parsed).substring` -> montaj_modu'nda parsed YOK ->
  `l2_exception` -> L3 fallback) cozuldu + dispatcher'a montaj dali eklendi.
- **Canli dogrulama (M130, yeni proje, cache MISS):** 3 montaj PDF'i -> format=montaj,
  `parser_seviye=l2`, `montaj_var=true`, spool_listesi + continue dolu, $0. Imalat
  PDF'leri eski dogru akiSta (montaj_var=false), regresyon yok.

---

## YAPILANLAR (sirasiyla, veriyle)

### 1) Tani: montaj neden imalat formatina dusuyor (D-yeni)

M270 test devresi yuklendi (304 tank ventilation). Montaj PDF'leri (`*.1.pdf`) montaj
formatina (39a2c81b) DEGIL eski imalat formatina (84c12f61) dusuyordu, `montaj:{}` uretmiyordu.
- fingerprintSkor (izometri-oku.js): dosya_adi +5, uretici/baslik/tablo +1'er, ESIK=2.
- Eski imalat formatinin `dosya_adi_regex`'i (`^M\d+-\d+-\d+\.\d+\.pdf$`) montaj dosyasini
  (`M270-304-001.1.pdf`) +5 ile yakaliyordu; yeni montaj formatinin regex'i (`_` ayrac bekliyor)
  M270 noktali adlandirmayi kacirip 0 puan aliyordu. Eski format 6, yeni montaj 2 -> eski kazaniyordu.

### 2) Olcum: icerik imzasi (pdftotext -layout, varsayma)

- Montaj PDF: `Continue:` VAR, `Malzeme Listesi`/`Cut & Bending` YOK.
- Imalat PDF: `Malzeme Listesi` + `Cut & Bending Info` VAR, `Continue:` YOK.
- Tam ayrim, cakisma yok. Icerik-bazli ayrim guvenli.

### 3) Migration 091 -- fingerprint icerik-bazli ayrim (B plani)

- Montaj (39a2c81b): `dosya_adi_regex` KALDIR + `baslik_regex='Continue:'` EKLE.
- Imalat (84c12f61): sadece `dosya_adi_regex` KALDIR (Malzeme/Cut/uretici dokunulmadi).
- Skor matrisi sonrasi: montaj PDF -> montaj 2 / imalat 1; imalat PDF -> imalat 3 / montaj 1.
- Supabase: dry-run (ROLLBACK) -> SELECT dogrula -> COMMIT. Kalici teyit edildi.

### 4) Tani: format dogru ama montaj_modu cikti uretmiyor (kok neden)

Fingerprint duzeldikten sonra montaj formatina dustu AMA `parser_seviye=l3`'e gidiyordu.
- `ai_api_log._l2_fallback.l2_sebep` = `l2_exception:Cannot read properties of undefined
  (reading 'substring')`.
- KOK NEDEN: `parserKuralIle` (izometri-oku.js) `JSON.stringify(sonuc.parsed).substring(0,500)`
  yapiyordu. l2-parser montaj_modu'nda `{ok, montaj:{}}` doner -- `parsed` YOK. `undefined.substring`
  patliyor, try/catch yutuyor, L3 fallback tetikleniyor. (114 dersi tekrar: kural/parser var,
  cagiran eski sekli bekliyor.)
- l2-parser.js M270 metniyle LOKAL test edildi (pdf-parse + parse birebir): montaj:{} kusursuz
  uretiliyor (spool_listesi, continue, agirlik, yuzey). Parser saglam, sorun cagirmadaydi.

### 5) izometri-oku.js 115 fix (MK-115.1) -- MK-49.1 KORUNDU

- `parserKuralIle`: montaj/imalat sekil ayrimi. `sonuc.montaj` varsa montaj-guvenli paketle
  (substring patlamasi onlendi, `montaj` disari tasinir, `cevap_full` montaj govdesiyle yazilir).
- Dispatcher: `parseSonuc.montaj` varsa spool-hattini (asmeFallbackDoldur + halusinasyonFiltresi +
  batchSonucBirlestir) ATLA, `ozet.montaj` dondur, spooller'a DOKUNMA (114 B karari).
- Fingerprint okuma/skorlama tarafina DOKUNULMADI (MK-49.1). Sadece parser sonuc paketleme +
  dispatcher dal ayrimi.
- Lokal: montaj -> l2 + montaj:{} (exception yok); imalat -> spoollar + montaj null (regresyon yok).

### 6) Canli dogrulama (M130, cache MISS)

Yeni proje M130 yuklendi (8 dosya, client-loop'ta 6 takildi -> butona tekrar basildi, drene oldu):
- M130-000-001.1.pdf -> montaj, l2, spool_say=1, continue=1, agirlik=98, cache yok.
- M130-000-002 1(2).1.pdf -> montaj, l2, spool_say=3, continue=1, agirlik=404 (COKLU SPOOL dogrulandi).
- M130-000-002 2(2).1.pdf -> montaj, l2, spool_say=2, continue=2, agirlik=258.
- alistirma=null (bu PDF'lerde -ALS/NOT sinyali yok -- BEKLENEN, eksiklik degil).
- Imalat (`*.S0X.1.pdf`) -> 84c12f61, montaj_var=false, cache_hit=true (eski dogru sonuc).

---

## Commit'ler (115)

| Hash | Mesaj |
|------|-------|
| `b65ad3c` | fix(115): montaj L2 sekil ayrimi -- parserKuralIle substring patlamasi + dispatcher montaj dali (MK-115.1) |

CI: YESIL (kod commit'i, [skip ci] YOK). Vercel deploy basarili (M130 montaj L2 canli kaniti).
Migration 091: Supabase'de COMMIT edildi. **NOT: repoya 091 dry-run arsivi eklenecek (asagida).**

---

## DB Degisiklikleri (091, CANLI)

```sql
-- Montaj formati: dosya adi bagimliligini kaldir, Continue: imzasi ekle
UPDATE izometri_format_tanimlari
SET fingerprint = (fingerprint - 'dosya_adi_regex')
                  || jsonb_build_object('baslik_regex','Continue:')
WHERE id = '39a2c81b-4f4b-4203-a912-cfe0c07770ad';

-- Imalat formati: sadece dosya adi bagimliligini kaldir
UPDATE izometri_format_tanimlari
SET fingerprint = (fingerprint - 'dosya_adi_regex')
WHERE id = '84c12f61-650a-480b-ab61-12277ba09014';
```

---

## Mimari Kararlar (115)

- **MK-115.1:** Montaj L2 ciktisi sekli `{ok, montaj:{}}` (imalat `{ok, parsed:{spoollar}}`).
  `parserKuralIle` + dispatcher bu iki sekli ayrı ele alir. Montaj spool-hattini (asme/halusinasyon/
  batchSonucBirlestir) atlar, ciktisi `parse_sonuc.montaj`'a yazilir, spooller'a DOKUNMAZ.
- **MK-115.2 (B karari):** Format ayrimi DOSYA ADINDAN BAGIMSIZ, ICERIK sinyalleriyle. Montaj=
  `Continue:`, imalat=`Malzeme Listesi`+`Cut & Bending`. Dosya_adi_regex iki formattan da kaldirildi.
  Sebep: dosya adlandirma aileleri (M100 alt-cizgili, M270/M130 noktali) kirilgan; icerik saglam.
- **MK-115.3:** Ayni proje birden cok gemiye yuklenebilir (ikiz gemi senaryosu) -- farkli devre_id
  ile ayri kayit, HATA DEGIL. Eslesme/karsilastirma ayri katman (vizyon notu, asagida).

---

## Dersler (bu oturum)

1. **Veriyi gor, varsayma -- yine kurtardi.** "Imalat malzeme cikarmiyor" sandim (yanlis JSON
   anahtari `malzemeler` vs `malzeme_listesi` baktim); imalat HEP dogruydu. Sekil sorunu montajdaydi.
2. **Cok ornek test bug cikarir.** M270 tek-spooldu; M130 coklu-spool (3+2) parser'in liste
   toplamasini dogruladi. Tek ornek "calisiyor" yanilgisi verebilirdi.
3. **Lokal repro altin degerinde.** l2-parser.js + pdf-parse'i lokal calistirip M270 metnine karsi
   test ettik -> parser'in saglam, sorunun cagirmada (substring) oldugunu KESIN gorduk. Teori yerine.
4. **fingerprintSkor negatif sinyal desteklemiyor** (sadece pozitif +puan). "X yoksa ceza" yok;
   ayrimi pozitif imzayla kurmak gerekti (montaj=Continue var, imalat=Malzeme var).
5. **Cache key = hash+format_id+tenant.** Format_id degisince ayni PDF cache MISS olur (montaj
   yeni format aldigi icin taze parse). Ama ayni format+hash ile L3 cache'lenirse sonra HIT verir
   -> test icin YENI dosya (M130) en temizi.
6. **SQL Editor kuyrugu UPDATE edemiyor (RLS).** `dosya_isleme_kuyrugu` SELECT okunur ama UPDATE 0
   satir (tenant RLS UPDATE politikasi). Yeniden isleme SAYFADAN ("Bekleyenleri isle", servis anahtari).

---

## 116'ya Acik Borc (oncelige gore)

1. **MONTAJ ESLESME + GOSTERIM (114-115 B-ertelemesi, 116 ANA TEMA).** Montaj L2 verisi akiyor
   (`parse_sonuc.montaj`), simdi: (a) ESLESME -- montaj.spool_listesi (S01..) + pipeline_no ->
   `spooller` (devre_id ile sinirla, spool_no non-unique). (b) `montaj.alistirma` (PARCA/BAGLI) ->
   `spooller.alistirma` (3-degerli enum YOK/VAR/KISMI). **KARAR gerekli:** PARCA->? BAGLI->?
   Maplemeden ONCE spooller.alistirma gercek degerlerini SORGULA (pg_constraint). (c) GOSTERIM --
   spool_detay.html montaj katmani karti (boru, continue, alistirma, guverte).
2. **pipe_no enjeksiyonu (KARAR: A/B).** Parser `[[PIPE:...]]`'i text'ten okuyor; izometri-oku
   dosya adindan enjekte etmeli (A=text basina enjekte / B=parametre). MK-49.1: A daha guvenli.
   pipe_no su an null geliyor (spool_listesi yine dolu). Eslesmede pipeline_no+spool_no kullan.
3. **Migration 091 repoya arsiv** -- dry-run ROLLBACK halinde `migrations/091_*.sql` commit et
   ([skip ci] olabilir, doc/arsiv). (Bu oturumda Supabase'de COMMIT edildi, repoya konmamis olabilir.)
4. **D1 kalan ($0.39 DIGER) + D3 ($1.60, PAOR 995b5514 + 15243262).**
5. **Batch client-loop kirilganligi (508 / Failed to fetch).** M130'da 6/8 dosya takildi, tekrar
   basinca drene oldu. Kullaniciyi tedirgin ediyor (Cihat: "burasi stabil olmali"). Sunucu-tarafi
   drenaj (cron/worker) ideal. Cihat karari: "sayfa duzenlemeleri sirasinda yapariz" (115'te A secildi).
6. **i18n borcu (G-01):** 113 wizard + 112 izo drenaj anahtarlari.
7. **Mobil yonetici izometri PDF teshisi (112'den devir).**
8. **`_N` alt-spool fallback (MK-110.2).**
9. **Ikiz kolon temizligi (agirlik/agirlik_kg, durum/is_durumu) + web spool durum senkronu.**
10. **Test verisi temizligi.** M270 (devre c1c688cc + 84e8d56e) + M130 demo kayitlari -- bilerek
    iki kez yuklendi (rastgele test). Demo tenant'ta, silinebilir.

---

## Vizyon Notu (115'te dogan, ileri)

- **Ikiz gemi eslestirme + tarihsel benchmark (hull kavrami).** Cihat: ayni proje 2-3 gemiye
  yapilabiliyor (NB64/NB65 ikiz). Ayni devre 2. gemiye yuklenince ilk gemi verisiyle KARSILASTIRMA
  (sure, hata orani, tekrar eden sorunlar) yapilabilir. Veri modelinde "gemi/hull" katmani gerek.
  Montaj continue-grafi + spool topolojisi bunun zeminini sagliyor. SPOOL-AI-VIZYON'a eklenecek.

---

## Kritik Hatirlatmalar (115 dersleri)

- **Veriyi gor, varsayma.** Yanlis JSON anahtari (`malzemeler` vs `malzeme_listesi`) beni yanli
  yonlendirdi; SELECT/sema her zaman teyit.
- **Lokal repro yap.** Parser + pdf-parse lokal -> kok neden kesin (cagirmadaki substring).
- **Cok ornekle test (M130 coklu-spool).** 2 yetmez.
- **CHECK/enum -> pg_constraint ile dogrula** (116'da spooller.alistirma maplemeden once SART).
- **Migration: dry-run ROLLBACK -> dogrula -> COMMIT.** Repoda dry-run halinde arsivle.
- **SQL Editor kuyrugu UPDATE edemiyor (RLS)** -- yeniden isleme sayfadan.
- **Push: add -> commit -> pull --rebase -> push.** Kod commit'i [skip ci] YOK.
- **MK-49.1 korundu:** izometri-oku.js fingerprint skorlama tarafina DOKUNULMADI.
- **Env:** `SUPABASE_SERVICE_KEY`; `SELF_BASE_URL=https://arespipe.vercel.app`.
- **Proje bilgisi ~52'de donmus** -- guncel durum yalniz bu dosyalar + git'ten.

---

> 116 acilisinda bu dosya, `CLAUDE-SON-OTURUM.md` ve `CLAUDE-SONRAKI-OTURUM.md` okunacak.
> 116 ANA TEMA: **Montaj ESLESME + GOSTERIM + pipe_no enjeksiyonu** (114-115 B-ertelemesini
> tamamla -- montaj L2 verisi akiyor, simdi spool'lara bagla ve ekranda goster). Yarim is birakma.
