# Son Durum -- 117. Oturum (24 May 2026)

> 116 -> 117 gecisi. ANA TEMA: **IMALAT NOT -> spooller.imalat_not (temel) + ALISTIRMA
> cikarimi (bonus).** Sonuc: KOD TARAFI TAM TAMAMLANDI ve canli (deploy edildi). Alistirma
> cikarimi CANLI KANITLANDI (E120 -> VAR, ekranda gorundu). imalat_not yazimi kod canli AMA
> eslesen bir devrede henuz dogrulanmadi (test devreleri yukleyen_id null sorununa takildi --
> ACIK BORC, asagida). Parser mantigi 4 PDF lokal repro ile kanitlandi (VAR/KISMI/talimat/bos).

---

## Bu Oturumun Sonucu

**117 imalat NOT + alistirma cikarimi kod tarafi bitti, deploy edildi (commit 450b74c).**
Bulgu: parser motoru ZATEN not_metni slot'u + alistirma_ipucu mantigi tasiyordu ama (a) NOT
cekme regex'i agirlik kolonunu yutuyordu + agirliksiz NOT satirina tutmuyordu, (b) eski
alistirma kurali TERS calisiyordu (komple alistirma->KISMI diyor, gercek kismiyi kaciriyor),
(c) spooller'a yazma + gosterim yoktu. 117 bunlari duzeltti.

### Mimari (oturum kararlari)
- **MK-117.1 (M1 -- merkezi alistirma motoru):** Alistirma TURETME kelimeleri format-bagimsiz
  (Turkce imalat fizigi). l2-parser.js'de MERKEZI VARSAYILAN (ALISTIRMA_IPUCU_VARSAYILAN);
  bir format kendi alistirma_ipucu_kurali'yla OVERRIDE edebilir. NOT *cekme* format-ozel kalir
  (her formatin kendi not_metni regex'i). Kademeli (VAR baskin) + eski tek-deger formatina
  geriye uyumlu. Sebep: ayni "Alistirma Parcasi"/"kaynamayacak" ifadesi PAOR'da da Tersan'da
  da ayni anlam; her formata kopyalamak kopya kaymasi riski (Cihat tespiti).
- **KARAR-117 (PDF baz):** PDF bir alistirma degeri URETTIYSE (VAR/KISMI) -> spooller.alistirma'ya
  yaz (mevcut null/YOK/VAR/KISMI EZILIR, PDF otorite -- Cihat karari). PDF SESSIZSE (null) ->
  DOKUNMA (KARAR-116.1: belirsiz->dokunma; PDF'in sessizligi "alistirma degil" demek degil).
- **D2-genis (KARAR-117.2 -- NOT yazma):** imalat_not'u yaz AMA final alistirma 'VAR' (komple
  alistirma parcasi) ise YAZMA (alistirma sutununda zaten gorunur, tekrar gereksiz -- Cihat).
  KISMI / alistirma yok ama talimat var (orn "BSP adaptor kaynaklanacak") -> NOT'u yaz
  (personele somut bilgi). Cihat: "notta alistirma bilgisi varsa tekrar gerekmez."

---

## YAPILANLAR (sirasiyla, veriyle)

### 1) DB: migration 093 (spooller.imalat_not) -- CANLI
ALTER TABLE spooller ADD COLUMN imalat_not text (nullable). dry-run ROLLBACK -> dogrula ->
COMMIT. Repo arsivi 093_spooller_imalat_not.sql ([skip ci]).

### 2) parser_kural (Tersan imalat e1fb879d) -- CANLI (3 SQL)
- NOT regex DUZELTILDI: eski `NOT:[ \t]*,?[ \t]*([^\s,][^\n]*)` (agirligi yutuyor) ->
  `NOT: *,? *(.+?)(?: {3,}| +[0-9]+[.,][0-9]+ *kg|$)` (3+ bosluk veya agirlik kolonuna kadar kes).
- Eski YANLIS alistirma_ipucu_kurali KALDIRILDI (jsonb - operator). Motor merkezi varsayilani kullanir.
- flag 'im' EKLENDI: multiline -> $ her satir sonunu eslesir. KRITIK BULGU: agirliksiz NOT
  satirlari (orn E120 "NOT: Alistirma Parcasidir," satir sonu, kg yok) flag'siz yakalanmiyordu.

### 3) lib/l2-parser.js -- CANLI (commit 44814fc)
Dosya basina ALISTIRMA_IPUCU_VARSAYILAN sabiti (kademeler: VAR=["al.{2}t.rma +par[cc]as"];
KISMI=["kaynat.lmayacak","kaynamayacak","sahada","gemide +montaj","a[cc].k +kalacak",
"ba[gg]lanmayacak"]). Alistirma blogu (satir ~302) kademeli motorla degistirildi: format
override > merkezi varsayilan; kademeli (ilk eslesen kazanir = VAR once); eski tek-deger geriye
uyumlu. Gercek motor node ile 3 senaryo + geriye uyum test edildi (HEPSI OK).

### 4) api/kuyruk-isle-izometri.js -- CANLI (commit 44814fc + 450b74c)
eslestir() imalat dali deg objesine: alistirma (dosya adi ALS -> VAR / parse ipucu -> VAR/KISMI;
PDF baz, null ise dokunma) + imalat_not (D2-genis: alistirma 'VAR' degilse yaz). dosyaAdi ALS
regex: `/(?:^|[-_ ])ALS(?:[-_. ]|$)/i` (FALSE yanlis pozitif onlendi). 4 senaryo izole test (OK).

### 5) spool_detay.html -- CANLI (commit 44814fc)
SP.imalatNot map (s.imalat_not). renderNotlar(): imalat NOT'u kullanici notlarinin USTUNDE
amber blok (📄, salt-okunur "Cizimden"). Kullanici notu bos olsa da imalat NOT gosterilir
(eski early-return duzeltildi). QR onizlemeye de imalat NOT eklendi (personele gorunur).
ANA SCRIPT node --check OK.

### 6) CANLI TEST (kismi)
- **Alistirma KANITLANDI:** test devresi bcd05c0e, E120-722-1015/1016-ALS -> ALISTIRMA sutununda
  VAR (dosya adi ALS'den). Ekran goruntusu ile dogrulandi.
- **imalat_not KANITLANMADI:** "select ... where imalat_not is not null" -> 0 satir. Cunku
  flag duzeltmesinden SONRA eslesen bir devrede NOT'u dolu PDF islenmedi. Eski kayitlar bayat
  (flag oncesi parse). Sonraki oturum: eslesen devre + NOT'lu PDF ile dogrula.
- **Parser mantigi 4 PDF lokal repro:** FM03-ALS->VAR, 317-19-ALS->VAR, G310->KISMI,
  E120-1015->VAR, M110-2113 (BSP talimat)->NOT yazilir alistirma yok, M110-2104 (bos NOT)->hicbiri.

---

## Commit'ler (117)

| Hash | Mesaj |
|------|-------|
| (093) | migration 093 spooller.imalat_not -- Supabase COMMIT (repo arsiv kapanista) |
| 44814fc | feat(117): imalat NOT + alistirma (merkezi varsayilan motor + PDF baz) -- l2-parser + kuyruk-isle + spool_detay |
| 450b74c | feat(117): D2-genis -- alistirma VAR ise imalat_not yazma; KISMI/talimat NOT'u yaz |

CI: kod commit'leri [skip ci] YOK. Vercel deploy basarili.
**117 ACILIS TEYIDI (gelecek): migration 093 repoda mi (ls migrations/ | grep 093).**

---

## DB Degisiklikleri (CANLI)

```sql
-- 093: spooller.imalat_not
ALTER TABLE spooller ADD COLUMN IF NOT EXISTS imalat_not text;

-- parser_kural (e1fb879d Tersan imalat): NOT regex + flag im, alistirma kurali kaldirildi
-- not_metni.regex = 'NOT: *,? *(.+?)(?: {3,}| +[0-9]+[.,][0-9]+ *kg|$)'
-- not_metni.flag  = 'im'
-- alistirma_ipucu_kurali  -> SILINDI (motor merkezi varsayilani kullanir)
```

---

## Dersler (bu oturum)

1. **Sonraki-oturum notu (varsayim) DOGRULANDI ama ters yonde:** Not "parser NOT okumuyor olabilir"
   demis; KOD okuyordu (motor hazirdi). 116'nin "koda bak" dersi yine gecerli.
2. **Kural VAR ama YANLIS senaryosu:** Sifirdan yazmak yanlis olurdu (motoru bozardik). Mevcut
   kurali okuyup "neden bos geliyor" kazindi -> eski alistirma TERS, NOT regex agirligi yutuyordu.
3. **Canli test gercek bug yakalar:** Lokal 3 PDF'te calisan regex, agirliksiz NOT satirinda
   (E120) tutmadi. $ multiline degildi. flag 'im' duzeltti. Lokal test yetmez, canli sart.
4. **"hicbiri yok" -> kok neden zincir kazma:** dosya adi formati DEGIL, spool yok DEGIL, devre
   yanlis DEGIL -> dosya_isleme_kuyrugu.durum='hata', 'kullanici_id zorunlu', yukleyen_id null.
   Veriyi katman katman ele -- varsayma.
5. **Mukerrer endisesi yersizdi:** alistirma (kolon) ve imalat_not (kolon) ve notlar (tablo) UC
   AYRI yer. Idempotent kolon yazimi mukerrer not uretmez.
6. **Unicode-paste tuzagi onlendi:** Turkce karakterli regex'i json.dumps(ensure_ascii) ile
   \uXXXX'e cevirip backslash'siz yazdik -> SQL paste-guvenli.

---

## 117'ye Acik Borc (oncelige gore)

1. **imalat_not CANLI DOGRULAMA (117 yarim kalan):** Eslesen bir devrede (yukleyen_id DOLU,
   orn yeni temiz devre) NOT'u dolu bir PDF isle -> "select ... where imalat_not is not null"
   dolu gelmeli. KISMI/talimat NOT -> imalat_not dolu; VAR (komple) -> imalat_not bos (D2). Spool
   detayda amber 📄 blok + QR'da personele gorunum. KOD CANLI, sadece eslesen test eksik.
2. **YUKLEYEN_ID NULL -> PARSE EDILEMIYOR (yeni kritik borc):** api/kuyruk-isle-izometri.js:305
   dok.yukleyen_id null ise is 'yukleyen_id bos' hatasiyla kapanir (izometri-oku kullanici_id
   zorunlu, satir 334). yukleyen_id'siz yuklenen dosyalar (test/import) HIC parse edilmiyor ->
   eslesmiyor -> izometri/NOT/alistirma yazilamiyor. test devresi 3174e29f boyle takildi. Cozum:
   dosyalara kullanici id ata VEYA sistem yuklemeleri icin kontrolu gevset (VERI SAHIPLIGI etkisi
   dusunulmeli -- KARAR-48.1).
3. **DESEN-DISI YONETIMI / FORMAT OGRENME (yeni stratejik tema):** Cihat tespiti -- ~10 PDF'le
   desen kuruldu, desen-disi PDF'ler kiriliyor (agirliksiz NOT, bos NOT, yeni kelime, underscore
   dosya adi). Profesyonel cozum: desen-disini SESSIZCE YUTMA, YUZEYE CIKAR. (a) parse sonucuna
   "eksik/supheli alanlar" raporu ekle (NOT cikmadi, yuzey cikmadi, match_orani dusuk). (b) Izometri
   Batch'te "tam parse N / eksik M" listesi -> insan gorur. (c) confidence + human-in-the-loop
   (oneri_hazir/manuel_onay durumlari zaten var). (d) fingerprint ile desen-disilari grupla,
   birikince yeni format kurali turet (format ogrenme dongusu -- eski acik borc). ILK ADIM:
   eksik-alan raporu (en ucuz, en yuksek getiri). Sektor ilkesi: once OLC sonra en cok kirani duzelt.
4. **NOT bos yakalama incelik:** Bos NOT ("NOT: ,") regex'i "," yakaliyor. eslestir if(ps.not_metni)
   "," truthy -> ama bu PDF eslesmediginden yazilmadi. Eslesince "," imalat_not'a gidebilir. Regex'i
   bos-NOT yakalamayacak sekilde sikilastir (dusuk oncelik).
5. **Yuzey survivorship netlik (Cihat sordu):** test devresi 1015 yuzey "Boyali" (import/devre olusturma),
   PDF "Siyah". bindir() cakismada sessiz ezmedi (Boyali kaldi). 117 yuzeye DOKUNMADI. Beklenen davranis.
6. **i18n borcu (G-01):** sp_imalat_not_kaynak (117) + 113 wizard + 112 izo drenaj + 116 montaj kart.
   tv() fallback ile calisiyor, ceviri (TR/EN/AR) eklenecek.
7. **Batch client-loop kirilganligi (508).** Sunucu-tarafi drenaj ideal.
8. **D1/D3 maliyet temizligi** (115'ten devir).
9. **Mobil imalat NOT gosterimi (KARAR):** Web'de imalat NOT gorunuyor; mobil (IbSpoolDetay.jsx)
   imalat_not okumuyor. Personel mobilde de gormeli mi? -> ayri is, mobil koda imalat_not render.
10. **Web spool durum senkronu** (aktif_basamak/ilerleme DB-truth) + ikiz kolon temizligi.
11. **Test verisi temizligi** (M270/M130/M235/M240/D130/E120/M110 demo).

---

## Vizyon Notu (ileri, bugunun isi DEGIL)
- 3D/walk (MK-49.A). Ikiz gemi + hull benchmark (MK-115.3). montaj_json.continue_baglanti topoloji grafi.

---

## Kritik Hatirlatmalar (disiplinler)
- **Veriyi gor, varsayma** -- kok neden zincir kazma (kullanici_id zorunlu dersi).
- **Lokal repro + CANLI test** -- lokal yetmez (agirliksiz NOT flag bug'i canlida cikti).
- **Cok ornekle test** (4 PDF: VAR/KISMI/talimat/bos).
- **Unicode-paste:** json.dumps(ensure_ascii) ile \uXXXX, backslash'siz SQL.
- **CHECK/enum/kolon adi -> information_schema/pg_constraint** ile dogrula (MK-108.4 -- bu oturum
  format_adi, parser_seviye, olusturma, format_id kolon hatalari yasandi).
- **Migration: dry-run ROLLBACK -> dogrula -> COMMIT.** Repoya arsivle.
- **Push: add -> commit -> pull --rebase -> push.** Kod commit'i [skip ci] YOK.
- **Env:** SUPABASE_SERVICE_KEY. **Proje bilgisi ~52'de donmus** -- guncel durum yalniz bu dosyalar + git'ten.
- **Untracked uygula_116_*.py betikleri HALA repoda duruyor** -- kapanista sil (rm uygula_116_*.py).

---

> 117 acilisinda bu dosya, CLAUDE-SON-OTURUM.md ve CLAUDE-SONRAKI-OTURUM.md okunacak.
> 117 ANA TEMA kod tarafi BITTI (alistirma canli kanitli, imalat_not kod canli eslesen-test bekliyor).
> ONCELIK: (1) imalat_not canli dogrulama, (2) yukleyen_id null parse borcu, (3) desen-disi yonetimi.
