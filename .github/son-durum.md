# Son Durum -- 114. Oturum (23 May 2026)

> 113 -> 114 gecisi. ANA TEMA: **Format ogrenme dongusu, D1 deligi (fingerprint zayif, $3.44).**
> Tani derinlestirilince delik netlesti: $3.44'un $2.99'u (137/156 cagri) ZATEN L2 kurali olan
> iki Tersan formatindan sizioyrdu -- ama bunlar **montaj/genel cizimler** (malzeme listesi YOK),
> fingerprint tutmadigi icin pahali L3'e gidip "malzeme yok" donuyordu. Cozum: montaji tanitan
> yeni format kaydi + L2 parser'a montaj-modu. Montaj cizimleri artik L3 yerine L2 deterministik
> topoloji hasati (spool listesi + continue + alistirma + toplam agirlik), SIFIR AI.

---

## Bu Oturumun Sonucu

**114 basariyla kapandi. Montaj formati canliya gecti (CI + Vercel yesil).**

- **D1 tanisi tersine dondu (veriyle):** Baslangic tanisi "imalat PDF'leri fingerprint'e takiliyor"
  saniyordu. Olcum (pdf-parse + fingerprintSkor birebir kopya, 12 gercek PDF) gosterdi ki: imalat
  PDF'leri ZATEN skor=3 alip L2'ye gidiyor. (YOK) cagrilarin %100'u **montaj/genel cizim** --
  malzeme listesi olmayan ust gorunus cizimleri, pahali L3'e gidip "malzeme yok" donuyordu.
- **Cozum (D1 = montaj tanima):** Yeni `tersan_cadmatic_montaj` format kaydi (migration 090) +
  `lib/l2-parser.js`'e geri-uyumlu `montaj_modu` + `liste_alanlar`. Montaj artik L2 deterministik
  topoloji hasati yapiyor -> ~$3.38/montaj L3 israfi durdu.
- **B karari (kapsam):** Bu oturum TANIMA + L2 HASAT'i indirdi. Montaj ciktisi `parse_sonuc`'a
  yaziliyor ama spool detayda **gosterim + eslesme + pipe_no enjeksiyonu** 115'e birakildi.
  Yani veri akmaya basladi, ekranda henuz gorunmuyor -- BEKLENEN.

---

## YAPILANLAR

### 1) D1 tanisi (veriyle, adim adim)

`ai_api_log` format_id dagilimi + `cevap_full` JSONB analizi:
- 156 (YOK) cagri / 146 ayri PDF, $3.44. Mukerrer ~yok (cache calisiyor).
- `pipeline_no` on-ekine gore kumeleme: Tersan-G 77 ($1.70) + Tersan-M 60 ($1.29) = %87 Tersan.
- 154/156 cagri 21 May (icerik regex'i eklendikten) SONRA -> "zaten duzeldi" hipotezi de curudu.
- `malzeme_listesi` bos/dolu ayrimi: 154/154'u **MONTAJ (malzeme bos)**. Sifir imalat -> skorlama
  bug'i YOK, kod dogru. Delik = montaj cizimlerinin var olmayan malzeme icin L3'e gitmesi.

### 2) Olcumler (teori yerine, "veriyi gor, varsayma")

- pdf-parse Cadmatic PDF'lerinin metnini SORUNSUZ cikariyor (glyph hipotezi curudu).
- Imalat (`_S01_`): skor=3 -> L2'ye gidiyor (zaten dogru).
- Montaj (`_1.pdf`): skor=1 (sadece uretici) -> esik 2'yi gecemiyor -> L3.
- 12 gercek PDF (6 proje: M100, D130, G200, M110, M100-ALS, M225) uzerinde dogrulandi.

### 3) Montaj alan haritasi (12 PDF'te dogrulandi)

- **Cekirdek (montaj-ozel):** spool_listesi (S01-S05 tam), continue_baglanti (devre grafi),
  alistirma (3 sinyal: dosya-ALS=PARCA / continue-ALS=BAGLI / NOT=PARCA), toplam_agirlik, pipe_no.
- **Paylasilan:** yuzey (Galvaniz/Siyah/Paslanmaz), blok, tarih, sistem.
- **Ham yakala (savruk):** guverte (MAIN/POOP/MEZZ. DECK, DECK 8100, TT_1800).
- **Cikmiyor:** 3D sekil/montaj yeri/oryantasyon (geometri katmani, metinde yok).
- **pipe_no DOSYA ADINDAN** (`split('_')[0]`) -- 12/12. Bu, montaj<->imalat<->spool'u baglayan anahtar.

### 4) Fingerprint (A-siki, izometri-oku'ya DOKUNULMADI -- MK-49.1)

- Montaj fingerprint: dosya_adi_regex `^[A-Z]+\d+-[\dA-Za-z]+-[\dA-Za-z-]+_(?!S\d)[\d_]*\d\.pdf$`
  (Tersan boru deseni + `_S##_` ICERMEZ negatif-lookahead) + Cadmatic uretici.
- 12 PDF testi: 6 montaj -> MontajA (skor 6), 6 imalat -> Imalat (skor 3). CAKISMA YOK, sinirda degil.

### 5) l2-parser.js -- montaj-modu (geri uyumlu)

- Yeni `listeAlanCikar()` helper (matchAll ile coklu toplama: spool_listesi, continue).
- `parse()` icinde `montaj_modu` erken-dali: `liste_alanlar` + `montaj_alistirma_kurali` -> `montaj:{}` doner.
- **Sifir regresyon:** `montaj_modu` yoksa eski akis AYNEN (`spoollar:[spool]`). 3 imalat PDF'inde test edildi.
- 6 montaj PDF'inde dogrulandi (spool listeleri tam, alistirma BAGLI/PARCA dogru).

### 6) Migration 090 + parser deploy

- `migrations/090_tersan_montaj_format.sql`: dry-run guard + idempotency (format_kodu UNIQUE DEGIL,
  elle cakisma kontrolu) + A-siki fingerprint + montaj parser_kural + guvenlik agi.
- Supabase'de dry-run (ROLLBACK) -> dogrulama -> COMMIT. `count=1` teyit (cift kayit yok).
- `egitim_kaynagi`: CHECK sadece 'vision_only'/'pdf_excel' kabul ediyor -> 'vision_only' kondu
  (aslinda elle yazildi, comment'te not).
- **NOT (karisiklik onleme):** Repodaki 090 dosyasi son satirinda `ROLLBACK;` tasiyor = guvenli
  DRY-RUN ARSIVI. Canliya COMMIT ile uygulandi (DB'de count=1). Repodaki dosya yanlislikla
  calistirilirsa idempotency guard + ROLLBACK ikinci kayit eklemez. Bilincli.

---

## Commit'ler (114)

| Hash | Mesaj |
|------|-------|
| `0cd0f89` | feat(114): montaj formati L2 hasat -- tersan_cadmatic_montaj (D1 fix). l2-parser montaj_modu + liste_alanlar, migration 090 |

CI: YESIL (GitHub Actions + Vercel). Kod commit'i ([skip ci] YOK), lint gecti.
DB: migration 090 COMMIT edildi (Supabase Editor, elle akis).

---

## Mimari Kararlar (114)

- **MK-114.1:** Fingerprint deligi (format_id YOK -> L3) cogunlukla **montaj/genel cizimler**di
  (malzeme listesi olmayan ust gorunus). Cozum: montaji tanitan yeni format kaydi + L2 parser
  montaj-modu. Imalat PDF'leri zaten icerik sinyalleriyle (Malzeme Listesi + Cut & Bending) L2'ye
  gidiyordu; sorun onlar degildi.
- **MK-114.2:** Montaj/imalat ayrimi = **format_id ayrimi** (ayri kayitlar). Belge tipine
  (`dokuman_tipi`) yeni deger eklemeye gerek yok; ayrim fingerprint'te. Belge gorunurluk ekseni
  (personel/yonetici) ayri konu, ileride.
- **MK-114.3:** Montaj fingerprint A-siki (dosya-adi agirlikli, `_S##_` negatif-lookahead) +
  guvenlik agi C (`requires_ai=true` + `l3_fallback_yapilir=true`): montaj parse fail olursa L3'e
  duser, veri kaybolmaz.
- **MK-114.4:** `pipe_no` izometri PDF'lerinde DOSYA ADINDAN turetilir (`split('_')[0]`) -- icerik
  regex'i naming varyasyonlarinda (kucuk harf, ` N(N)` eki, `-ALS`) kirilgan. Dosya adi montaj+imalat+spool
  baglayan anahtar.
- **MK-114.5:** L2 parser `montaj_modu` + `liste_alanlar` -- coklu eslesme (matchAll) + boru-seviyesi
  `montaj:{}` ciktisi. Geri uyumlu: montaj_modu yoksa eski `spoollar:[]` akisi aynen (sifir regresyon).

---

## Dersler (bu oturum)

1. **Veriyi gor, varsayma -- iki kez kurtardi.** (a) Glyph hipotezim curudu (pdf-parse metni
   cikariyor). (b) "Imalat takiliyor" tanisi curudu -- olcum gosterdi imalat zaten L2'ye gidiyor,
   delik montajdaymis. Teori uretmek yerine 12 PDF'i fingerprintSkor'un birebir kopyasindan gecirdik.
2. **Iki ornek test bug yakalar, az.** Ilk 2 montajda regex'ler calisti sanildi; spool overlap
   (ardisik S01\nS02 ayrac tuketme) + guverte trailing-\n bug'lari ancak 4-6 ornekte cikti. 12 ornek
   sagladi.
3. **Kural DB'de olabilir ama kod islemeyebilir (113 tuzagi tekrar).** Montaj parser_kural'i mevcut
   parser islemiyordu (coklu spool -> tek-deger, ciktiyi tek-spool olarak paketler). Kodu OKUYUP
   `montaj_modu` eklemeden migration yazsaydik "kural var ama atesilemez" hatasina duserdik.
4. **CHECK degerlerini varsayma.** `egitim_kaynagi='manuel_desen'` reddedildi (CHECK sadece
   vision_only/pdf_excel). Dry-run yakaladi.
5. **3D/walk umut var ama dar.** Cihat'in "0 noktasindan walk + kutuphane geometrileri" fikri
   gecerli (MK-49.A) -- ama metinde sirali baglanti + donus duzlemi YOK; aci tek basina 3B yon
   degil. FR/CL/BL ciapalariyla kisit-cozumu yapilabilir (oz-denetim). Tam 3B degil, uzamsal iskelet.

---

## 115'e Acik Borc (oncelige gore)

1. **MONTAJ ESLESME + GOSTERIM (114'un B-ertelemesi, 115 ANA TEMA).** Montaj ciktisini
   `pipeline_no`+`spool_no` ile mevcut spool'lara bagla, `alistirma` -> `spooller.alistirma` yansit,
   spool detayda goster. **pipe_no enjeksiyonu:** parser `[[PIPE:...]]` isaretini text'ten okuyor;
   izometri-oku bunu dosya adindan ENJEKTE etmeli (enjeksiyon vs parametre karari 115'te). Bu
   yapilmadan montaj `pipe_no` null gelir (spool_listesi yine dolar). Detay CLAUDE-SONRAKI-OTURUM.md.
2. **Montaj L2 canli dogrulama.** Yeni bir montaj PDF'i isle (cache MISS), L3 yerine L2'ye dustugunu
   + parse_sonuc'a montaj:{} yazildigini DB'den teyit et. (Bu oturumda canli montaj islenmedi.)
3. **D1 kalan ($0.39 DIGER) + D3 ($1.60, PAOR Ana 995b5514 + 15243262).** Tersan oturunca ayni
   yontemle. 15243262 PAOR Iso View parse_disi=true ama L3'e gitmis ($0.33) -- canli mi legacy mi
   1 sorguyla kapat.
4. **Asama 4b -- backend olu kod temizligi.** drenajTuru + DRENAJ dispatch + kuyruk-isle.js self-chain.
5. **Batch sayfalari client-loop'a gecir** (izometri-batch + incele, 508 riski).
6. **i18n borcu (G-01):** 113 wizard + 112 izo drenaj anahtarlari lang/*.json'da yok.
7. **Mobil yonetici izometri PDF teshisi** (112'den devir).
8. **`_N` alt-spool fallback (MK-110.2).**
9. **Ikiz kolon temizligi** (agirlik/agirlik_kg, durum/is_durumu) + web spool durum senkronu.
10. **3D/walk deneyi (MK-49.A).** Tek cok-bukumlu spoolda Cut&Bending + FR/CL/BL ile walk solve testi.
    Montaj continue-grafi + cipalar bunun zeminini atti.

---

## Kritik Hatirlatmalar (114 dersleri)

- **Veriyi gor, varsayma -- yine ise yaradi.** fingerprintSkor birebir kopya + 12 PDF olcumu iki
  hatali taniyi curuttu. pdf-parse metni cikariyor; imalat zaten L2'de; delik montajda.
- **Cok ornekle test et.** 2 ornek "calisiyor" yanilgisi verir; 6+ ornek bug cikarir.
- **CHECK/enum degerlerini information_schema/pg_constraint ile dogrula** (egitim_kaynagi yakalandi).
- **format_kodu UNIQUE DEGIL** -- INSERT'ten once elle cakisma kontrolu (idempotency guard).
- **Migration arsivi dry-run modunda push edilir** (son satir ROLLBACK), canliya elle COMMIT.
  README: "Supabase'de calistir + klasore yaz". Otomatik migrate YOK.
- **Push sirasi: add -> commit -> pull --rebase -> push.** Kod commit'i [skip ci] YOK.
- **MK-49.1 korundu:** izometri-oku.js'e DOKUNULMADI. Montaj parser ayri dosya (l2-parser.js).
- **Env:** `SUPABASE_SERVICE_KEY`; `SELF_BASE_URL=https://arespipe.vercel.app`.
- **Proje bilgisi ~52'de donmus** -- guncel durum yalniz bu dosyalar + git'ten.

---

> 115 acilisinda bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
> 115 ANA TEMA: **Montaj eslesme + gosterim + pipe_no enjeksiyonu** (114'un B-ertelemesini tamamla --
> yarim is birakma). Sonra D1 kalan + D3, sonra Tersan dikey devam.
