# CLAUDE -- Sonraki Oturum (116) Gundemi

## Acilis ritueli (2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -8`
   (HEAD 115 fix `b65ad3c` + 091 arsiv commit'i + kapanis doc commit'i olmali).
2. Bugun ne yapmak istiyorsun?
Sonra Claude: git temiz mi, CI rengi, `docs/PROJE-HARITASI.md` + bu 3 dosya oku, gundem onayla.
**Mid-cycle scope ekleme yok.**

## Oturum basi dogrulama (Supabase SQL Editor -> duz ASCII)
```sql
-- montaj L2 hala calisiyor mu (115 sonrasi montaj islendiyse)
select coalesce(format_id::text,'(YOK)') fmt, parser_seviye, count(*),
       round(sum(coalesce(maliyet_usd,0))::numeric,4) usd
from ai_api_log where olusturma_at > '2026-05-23 12:00:00+00'
group by 1,2 order by 1,2;

-- spooller.alistirma enum gercek degerleri (MAPLEMEDEN ONCE -- MK-108.4)
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'spooller'::regclass and conname ilike '%alistirma%';
-- veya dagilim:
select alistirma, count(*) from spooller group by 1 order by 1;

-- montaj verisi parse_sonuc'ta hazir mi (M130/M270 demo)
select d.dosya_adi, k.durum,
       (k.parse_sonuc->'montaj') is not null montaj_var,
       jsonb_array_length(coalesce(k.parse_sonuc->'montaj'->'spool_listesi','[]'::jsonb)) spool_say
from dosya_isleme_kuyrugu k join devre_dokumanlari d on d.id=k.devre_dokuman_id
where k.parser='izometri' and (k.parse_sonuc->'montaj') is not null
order by k.olusturma desc limit 10;
```

---

## ⭐ ANA TEMA -- MONTAJ ESLESME + GOSTERIM + pipe_no (114-115'in B-ertelemesi)

115'te montaj TANIMA + L2 HASAT canlida dogrulandi (M130: l2, montaj:{}, $0). Montaj verisi
`dosya_isleme_kuyrugu.parse_sonuc.montaj`'a yaziliyor AMA spool'larla eslesmemis + ekranda
gorunmuyor. 116 bunu tamamlar. **Yarim is birakma.**

### Adim 1 -- pipe_no enjeksiyonu (KARAR: A/B/C ile Cihat'a sun)
Montaj `pipe_no` su an NULL (parser `[[PIPE:...]]`'i text'ten okuyor; izometri-oku enjekte etmiyor).
spool_listesi yine doluyor, eslesme pipeline_no+spool_no ile yapilabilir -- ama pipe_no montaj<->
imalat<->spool baglayan anahtar, enjekte etmek temiz olur.
- **A -- Enjeksiyon:** izometri-oku montaj parse'i cagirmadan ONCE text basina `[[PIPE:<pipe_no>]]\n`
  ekler (pipe_no = dosya_adi.split('_')[0] veya nokta-ayrac: ilk segment). Parser imzasi degismez.
  MK-49.1: cagri ETRAFINDA kucuk ekleme (skorlama DEGIL) -- guvenli.
- **B -- Parametre:** `parse(text, kural, {dosya_adi})` -- parser dosya adindan turetir. Daha temiz,
  imza + cagiranlar degisir.
- **DIKKAT:** Dosya adi formati ailesi degisken (M270/M130 noktali: `M130-000-001.1.pdf` ->
  pipe_no `M130-000-001`; eski M100 alt-cizgili). Enjeksiyon regex'i ikisini de kapsamali.

### Adim 2 -- Eslesme (montaj -> spooller)
- `montaj.spool_listesi` (S01,S02..) + pipeline_no -> `spooller` (`pipeline_no`+`spool_no`).
  spool_no NON-UNIQUE (devre basina tekrar) -> devre_id ile SINIRLA. spool_id (text) tekil.
- `montaj.alistirma` (PARCA/BAGLI) -> `spooller.alistirma`. **DIKKAT:** spooller.alistirma 3-degerli
  enum (YOK/VAR/KISMI -- memory). **MAPLEMEDEN ONCE pg_constraint + dagilim SORGULA** (yukarida).
  KARAR (Cihat): PARCA->? BAGLI->? Ihtimal PARCA->VAR, BAGLI->KISMI ama Cihat onaylasin.
- `continue_baglanti` -> simdilik parse_sonuc'ta kalsin (graf sorgusu ihtiyaci dogunca ayri tablo).
- MK-111.2 bindirme: bos->doldur, celiski->flag, sessiz ezme yok. Montaj toplam_agirlik vs imalat
  spool-agirlik FARKLI anlamlar -- ezme yok.

### Adim 3 -- Spool detayda gosterim
- spool_detay.html: montaj katmani (ait oldugu boru/pipeline, continue baglanti, alistirma, guverte)
  bir kart/sekme. Personele acik (114 karari: imalat+montaj personele).
- montaj verisi nereden? -> devrenin montaj parse_sonuc'undan (spool_no eslesmesiyle) ya da eslesme
  Adim 2'de spooller'a yazilan alanlardan. Tasarim: eslesme spooller'a yazsin, gosterim oradan okusun.

---

## IKINCIL (116'da zaman kalirsa / sonraki)

- **Migration 091 repoya arsiv** (borc 3) -- bu oturumda Supabase COMMIT, repoya dry-run dosyasi
  eklenmemis olabilir. `migrations/091_montaj_imalat_fingerprint_icerik.sql` (son satir ROLLBACK).
- **D1 kalan ($0.39 DIGER) + D3 ($1.60):** PAOR Ana (995b5514, %100 L3) + 15243262 (parse_disi=true
  ama L3'e gitmis $0.33 -- canli mi legacy mi 1 sorguyla kapat).
- **Asama 4b backend olu kod** (drenajTuru + DRENAJ dispatch + kuyruk-isle.js self-chain).

## Acik borclar (oncelik sonrasi)
1. **Batch client-loop kirilganligi (508 / "Failed to fetch").** M130'da 6/8 dosya takildi, tekrar
   basinca drene oldu. Cihat: "burasi stabil olmali, kullaniciyi tedirgin ediyor." 115'te (A) secildi:
   sayfa duzenlemeleri sirasinda ele al. Sunucu-tarafi drenaj (cron/worker) ideal cozum.
2. i18n borcu (G-01): 113 wizard + 112 izo drenaj anahtarlari.
3. Mobil yonetici izometri PDF teshisi (112'den devir).
4. `_N` alt-spool fallback (MK-110.2).
5. Ikiz kolon temizligi (agirlik/agirlik_kg, durum/is_durumu) + web spool durum senkronu.
6. Test verisi temizligi (M270 devre c1c688cc+84e8d56e + M130 demo -- bilerek cift yuklendi).
7. **Wizard yeni-devre UI redesign** (fonksiyon calisiyor, mockup sonra).
8. **3D/walk deneyi (MK-49.A)** -- kapanis sonrasi deneme. Cok-bukumlu spoolda Cut&Bending + FR/CL/BL
   ile walk solve. Montaj continue-grafi + cipalar zemini atti.

## Vizyon Notu (115'te dogdu)
- **Ikiz gemi eslestirme + tarihsel benchmark (hull kavrami) -- MK-115.3.** Ayni proje 2-3 gemiye
  yapilabiliyor (NB64/NB65 ikiz). Ayni devre 2. gemiye yuklenince ilk gemi verisiyle KARSILASTIRMA
  (sure, hata orani, tekrar eden sorunlar). Veri modeline "gemi/hull" katmani gerek. Montaj continue-
  grafi + spool topolojisi zeminini sagliyor. -> docs/SPOOL-AI-VIZYON.md'ye eklenecek. Bugunun isi DEGIL.

## Destekleyen kararlar (akilda tut)
- **MK-115.1:** Montaj L2 sekli {ok,montaj:{}}; parserKuralIle + dispatcher ayrı ele alir, spooller'a
  dokunmaz. Eslesme AYRI adim.
- **MK-115.2:** Format ayrimi icerik-bazli (Continue: vs Malzeme/Cut), dosya adindan bagimsiz.
- **MK-114.x:** montaj=format_id ayrimi; A-siki fingerprint + guvenlik agi; l2-parser montaj_modu geri uyumlu.
- **MK-49.1:** izometri-oku.js fingerprint OKUMA/SKORLAMA tarafina DOKUNMA. Parser sonuc paketleme +
  dispatcher dal serbest (115'te buralar degisti, skorlama degil). pipe_no enjeksiyonu cagri ETRAFINDA.
- **MK-108.4:** kolon/CHECK/enum adi yazmadan information_schema/pg_constraint ile dogrula
  (spooller.alistirma maplemeden ONCE SART).
- **MK-111.2:** bindirme survivorship -- bos->doldur, celiski->flag, sessiz ezme yok.
- **MK-99.1:** format_kodu UNIQUE degil -> idempotency guard. Migration dry-run arsivi.
- **MK-101.1:** arespipe_kopyala -> git status. MK-51.1: cp + md5 gozle teyit.

## Onemli hatirlatmalar (disiplinler)
- **Veriyi gor, varsayma.** 115'te yanlis JSON anahtari (malzemeler vs malzeme_listesi) yanli
  yonlendirdi; lokal repro + SELECT kurtardi.
- **Lokal repro yap** (parser + pdf-parse) -- kod yolu emin olunmadan duzeltme yazma.
- **Cok ornekle test** (M130 coklu-spool gosterdi). 2 yetmez.
- **SQL Editor kuyrugu UPDATE edemiyor (RLS UPDATE politikasi)** -- yeniden isleme SAYFADAN/servis anahtari.
- **Cache key = hash+format_id+tenant** -- test icin YENI dosya en temiz (cache MISS).
- **CHECK/enum -> pg_constraint** ile dogrula.
- **Migration: dry-run ROLLBACK -> dogrula -> COMMIT.** Repoya dry-run halinde yaz.
- **Push: add -> commit -> pull --rebase -> push.** Kod commit'i [skip ci] YOK.
- **HTML/JS:** cerrahi str_replace + izole node --check. zsh tek satir komut.
- Env: SUPABASE_SERVICE_KEY; SELF_BASE_URL=https://arespipe.vercel.app; mobil VITE_API_BASE.
- **Proje bilgisi ~52'de donmus** -- guncel durum yalniz bu dosyalar + git'ten.

---

## 116'ya tek cumle ozet
"115'te montaj L2 hasati CANLIDA dogrulandi (ilk kez): once fingerprint dosya-adi capazi cozuldu
(migration 091, icerik-bazli Continue: vs Malzeme/Cut ayrimi, dosya adindan bagimsiz, B karari, CANLI
COMMIT), sonra montaj L3'e dusuren kok neden bulundu (parserKuralIle JSON.stringify(sonuc.parsed).
substring -> montaj_modu'nda parsed YOK -> l2_exception), izometri-oku.js'e montaj sekil ayrimi +
dispatcher montaj dali eklendi (MK-115.1, MK-49.1 korundu, commit b65ad3c, CI+Vercel yesil), M130
yeni projesiyle canli kanit (l2, montaj:{} spool+continue dolu, $0, coklu-spool dogrulandi). 116 ANA
TEMA: montaj ESLESME (spool_listesi+pipeline_no -> spooller, alistirma->spooller.alistirma -- enum
gercek degerini ONCE sorgula) + GOSTERIM (spool_detay montaj karti) + pipe_no enjeksiyonu (A/B karari).
Yarim is birakma. Sonra 091 arsiv + D1 kalan + D3."
