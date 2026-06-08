# AresPipe BRIEFING — 168. Oturum Kapanisi

> **Tek aktif baglam dosyasi (MK-56.2).** Sohbet acilisinda `cat BRIEFING.md` ciktisini yapistir.
> Ilerleme aynasi: docs/WIZARD-YOL-HARITASI.md. Tum kararlar: docs/KARARLAR.md (168'de MK-166/167/168 islendi).

## HEAD
- **Tema:** 167'nin uctan uca DOGRULANMASI + KARARLAR.md kapanis borcunun kapatilmasi. Yeni kod
  YAZILMADI; gun mekanizma kanitlama + karar arsivleme + teshis gunuydu.
- **Son commit'ler (bugun):**
  - `ee33cf9` — ci(168): izometri-cron.yml AGACA islendi (schedule tetikleyici icin sart; oncesi
    agacta degildi → schedule hic kosmamisti).
  - `bf87c6a` — docs(168): KARARLAR.md MK-166/167/168 islendi (2 oturumdur acik kapanis borcu KAPANDI) [skip ci].
- **DB:** migration YOK. Endpoint YOK (12/12 — MK-129.3). izometri-oku DOKUNULMADI (MK-49.1).
- **Onceki HEAD (167):** `0e7108d` (feat 167: cron izometri drenaj + claim guard + CRON_SECRET gate).

## 168 — KANITLANANLAR (kod yok, dogrulama)
1. **167 sayfa-kapali isleme UCTAN UCA KANITLANDI.** GitHub `workflow_dispatch` (Run workflow) →
   `/api/kuyruk-isle` global tetik → **HTTP 200** + JSON `{"izometri":{"calisti":true,"islenen":4,
   "kalan_var":true}}`. Iki ayri dispatch turunda da 4'er izometri isi sunucu tarafinda (tarayicisiz)
   islendi. Kuyruk eridi: 167 snapshot (oneri_hazir=465/manuel_onay=78) → 168 (oneri_hazir=480/
   manuel_onay=79). Mekanizma + sunucu drenaji SAGLAM.
2. **Git anomalisi cozuldu:** `izometri-cron.yml` HEAD agacinda DEGILDI (tree-exit=1) — `c2f97ab`'de
   eklenip `63cc716`'da agactan dusmus. GitHub `schedule`'i yalniz workflow varsayilan dalin HEAD
   AGACINDA commit'li ise tetikler → bu yuzden schedule hic kosmamisti. `ee33cf9` ile agaca islendi.
3. **Gece cron zinciri DOGRULANDI (kod degisikligi GEREKMEZ):** vercel.json cron `/api/kuyruk-isle`
   @ 03:00 + `CRON_SECRET` Vercel Production'da TANIMLI (ekranla teyit, "Production and Preview").
   Vercel cron, CRON_SECRET env varsa otomatik `Authorization: Bearer <CRON_SECRET>` gonderir (resmi
   davranis, web arastirmasiyla dogrulandi) → MK-167.2 kapisi bu pattern'i ZATEN kabul eder → gece
   cron 200 alir, izometri suruler. (Once "gece cron 500 alir" diye yanlis teshis konuldu — MK-168.5,
   arastirma ile cozuldu, geri cekildi, kod yazilmadi.)
4. **KARARLAR.md kapanis borcu KAPANDI:** MK-166.1..6 + MK-85.3 + MK-167.1/2/3 + MK-168.1..5 islendi
   (`bf87c6a`, +61 satir, docs/KARARLAR.md sonuna append). 2 oturumdur acik borc bitti.

## ⚠ 169 — SABAH ILK IS: GECE CRON GERCEK TESTI
> 168 sonunda kullanici buyuk bir devre yukleyip yatti. Beklenti: 03:00 Vercel cron izometriyi sursun.
```sql
SELECT durum, COUNT(*), MAX(bitis_at) AS son
FROM dosya_isleme_kuyrugu WHERE parser='izometri'
GROUP BY durum ORDER BY durum;
```
Beklenen: `bekliyor` dusmus, `oneri_hazir`/`manuel_onay` artmis, `son` ~03:00 zaman damgali. Agir/cok-
sayfali PDF'ler `hata`'da (508, MK-168.3) kalabilir; gerisi islenmis olmali. Cron 200 mi — Vercel →
Logs / Deployments → cron calismasi.

## ACIK BORCLAR (oncelik sirasi)
- **C-A-B sirasi:** C (eslestirme) yapildi → bug DEGIL cikti (asagi). **A ve B HENUZ YAPILMADI:**
  - **A (UI):** Devre yuklenince "islensin mi / siraya mi atayim" SORUSU KALDIRILSIN. Yuklenen her
    dokuman otomatik islenecekler kuyruguna dussun, kullanici "Islenenler"den takip etsin (167 felsefesi:
    yukle-kapat-git). Yer: devre_wizard_v3.html yukle akisi / MK-49.B upload bileseni. Once kaynagi bul
    (MK-126.8), sonra dokun.
  - **B (malzeme):** ST35.8 ve ST37 KARBON CELIK ama sistem "Diger" diyor. Once "Diger"i kim yaziyor
    bul (excel-parser sozlugu / ARES_NORM / kutuphane eslesme), sonra ekle. izometri-oku DOKUNMA.
- **C bulgusu (eslestirme — bug DEGIL):** "Fazla / kabukta yok" satirlari, devre TASLAK + kabukta spool
  YOK (terfi edilmemis) oldugu icindir. Matcher `spooller`'dan okur (127 mimarisi), spool terfide
  uretilir. eslesen=0/atanmamis=N TASLAK devrede BEKLENEN. Anahtar/_1-eki bug'i HIPOTEZI iki "no rows"
  ile CURUDU. **Gercek test 169:** taslak devreyi "Incele & Onayla" ile TERFI et → kabuk doluyor mu +
  eslestirme-backfill "Fazla"lari bagliyor mu (o zaman _1-eki anahtar sorunu varsa GORUNUR). Onay
  kusagi: oneri_hazir=480 + manuel_onay=79; aktif devrelerde 277 atanmamis (terfi-sonrasi re-esle/anahtar
  ayri borc).
- **W-2.UI (168 tespit):** Devre yukleme/acilis ekrani 78 belgede UZUN SURE "yukleniyor"da takiliyor
  (senkron tum-dokuman yukleme). Pilot riski (Windows operator). Cozum: acilista ozet/sayac + lazy-load.
- **MK-168.1:** GitHub `*/3` schedule tetiklenmiyor (45+ dk, workflow sayfasi yalniz workflow_dispatch
  gosterdi). Gun-ICI otomatik tetik YOK. Yedek: manuel dispatch + gece Vercel cron. 169'da Actions'tan
  schedule kosusu cikti mi izle; gelmezse frekansi seyret veya gece cron'a yaslan (Pro SART DEGIL).
- **MK-168.3:** izometri-oku HTTP 508 (Loop Detected). Cron/drenaj yolu `opts.oncedenParse` olmadan
  cagrilinca sunucu kendi icinden izometri-oku'yu HTTP cagirir → Vercel self-call 508. Agir/cok-sayfali
  PDF'lerde (M100-355-401/402-HC, 15-17 sayfa). izometri-oku DOKUNULMAZ (MK-49.1) → cozum CAGRI
  KATMANINDA (cron yolu icin client-parse esdegeri ya da farkli cagri mimarisi). BUYUK, AYRI IS. 508
  isleri 'hata'da kalir, drenaji BOGMAZ (MK-168.2), ama parse olamaz. Su an 4 is 'hata'da.
- **Y200 ogretimi** (diger bilgisayar; rece FORMAT-OGRETIM-ATOLYE-162.md'de) — ACIK.
- **W-2.5** (iki ayri cubuk: yukleme + arka isleme) · **W-2.9** (eszamanli paralel devre) — ACIK.

## MK kayitlari (168 — docs/KARARLAR.md'ye ISLENDI, `bf87c6a`)
- **MK-168.1:** GitHub schedule gecikmesi/guvenilmezligi; schedule tetigi icin workflow HEAD agacinda
  commit'li olmali (ee33cf9). Yedek: gece Vercel cron + manuel dispatch.
- **MK-168.2 (YANLIS ALARM, kapatildi):** "drenaj hata'yi sonsuz retry'lar" YANLIS. Cekme sorgusu
  `.eq('durum','bekliyor')` → hata HIC cekilmez. Claim'deki 'hata' yalniz wizard is_id manuel-retry icin.
  Tavan gereksiz. Kod okumadan (MK-126.8) tavan eklenmedi → bos commit'ten korundu.
- **MK-168.3:** izometri-oku HTTP 508 server self-call (yukarida).
- **MK-168.4:** Ayni tenant ici cok-kullanici yukleme GUVENLI. Koruma RLS degil (ayni tenant) —
  MK-167.1 atomik claim guard: coklu worker (her kullanicinin tarayici drenaji + cron) ayni isi kapamaz,
  cift izometri-oku/cift maliyet yok. Sinir: backlog hiz siniri (4'er/tur, ~50s) + agir PDF 508.
- **MK-168.5 (DUZELTILDI):** Vercel cron `Authorization: Bearer <CRON_SECRET>`'i otomatik gonderir
  (resmi davranis, env tanimliysa). MK-167.2 kapisi bunu zaten kabul eder → gece cron 200, kod DEGISMEZ.
  Onceki "gece cron 500 alir" teshisi YANLISTI.

## TEST DEVRELERI — SILME
"bn omn" (77bfbc98) · "b nn" (e0af361d, taslak). Ayrica 168 test yuklemeleri: devre ae39c5c2 (taslak,
78 belge) ve bcb3192a (M100-355-401/402-HC, 508 veren agir PDF'ler).

## NEREDEYIZ — OZET
167, izometri parse'i sayfa kapaliyken de ilerletme mimarisini kurmustu (MK-166.1 ana tasarim). 168 bunu
UCTAN UCA KANITLADI (dispatch → islenen:4), schedule'in hic kosmama nedenini (workflow agacta degildi)
bulup duzeltti (ee33cf9), gece cron zincirini dogruladi (CRON_SECRET Production'da → Bearer gecer → kod
yok), ve 2 oturumdur acik KARARLAR.md kapanis borcunu kapatti (bf87c6a). Bir yanlis teshis (MK-168.5)
web arastirmasiyla yakalanip gereksiz koddan kacinildi. Acik isler: A/B (UI sorusu kaldir + ST35.8/ST37
karbon), terfi-sonrasi eslestirme testi, W-2.UI yukleme takilmasi, MK-168.1 schedule, MK-168.3 508.
12/12, izometri-oku dokunulmadi, migration yok.
