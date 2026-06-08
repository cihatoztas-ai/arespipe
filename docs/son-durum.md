# son-durum.md — 168. Oturum (2026-06-08)

## TEMA
167'nin UCTAN UCA DOGRULANMASI + KARARLAR.md kapanis borcunun KAPATILMASI. Yeni kod YAZILMADI —
gun mekanizma kanitlama + karar arsivleme + teshis gunuydu. Format ogretimi yine atlandi.

## DURUM
- Commit'ler (bugun): `ee33cf9` (ci: izometri-cron.yml agaca) + `bf87c6a` (docs: KARARLAR.md
  MK-166/167/168, [skip ci]). Onceki HEAD `0e7108d` (167 kod).
- 12/12 fonksiyon (yeni endpoint YOK). Migration YOK. izometri-oku DOKUNULMADI (MK-49.1).
- Git temiz: lokal = origin/main. izometri-cron.yml artik HEAD agacinda (oncesi degildi).
- CRON_SECRET Vercel Production'da TANIMLI (ekranla teyit).

## YAPILANLAR (dogrulama + arsivleme, kod yok)
1. **167 UCTAN UCA KANITLANDI:** GitHub workflow_dispatch → /api/kuyruk-isle → HTTP 200 +
   `izometri:{calisti:true, islenen:4, kalan_var:true}`. Iki turda 4'er izometri isi SUNUCU tarafinda
   (tarayicisiz) islendi. Kuyruk eridi (oneri_hazir 465→480, manuel_onay 78→79).
2. **Git anomalisi cozuldu:** izometri-cron.yml HEAD agacinda DEGILDI (tree-exit=1; c2f97ab'de eklenip
   63cc716'da dusmus). GitHub schedule yalniz HEAD agacinda commit'li workflow'u tetikler → schedule hic
   kosmamisti. `ee33cf9` ile agaca islendi (PAT'ta workflow scope VARMIS, push gecti).
3. **Gece cron zinciri DOGRULANDI:** vercel.json cron /api/kuyruk-isle @ 03:00 + CRON_SECRET Production'da.
   Vercel cron env varsa otomatik Bearer <CRON_SECRET> gonderir (resmi davranis, web arastirma) →
   MK-167.2 kapisi zaten kabul → gece cron 200, KOD DEGISMEZ.
4. **KARARLAR.md kapanis borcu KAPANDI:** docs/KARARLAR.md'ye MK-166.1..6 + MK-85.3 + MK-167.1/2/3 +
   MK-168.1..5 append (+61 satir, bf87c6a). 2 oturumdur acikti.

## TESHIS BULGULARI (169'a tasinan)
- **Eslestirme eslesen=0 → BUG DEGIL:** "Fazla / kabukta yok" satirlari devre TASLAK + kabukta spool
  YOK oldugu icin. Matcher spooller'dan okur (127), spool terfide uretilir. _1-eki anahtar bug'i hipotezi
  iki "no rows" ile CURUDU. Gercek test: terfi et → kabuk dolar mi + backfill baglar mi.
- **4 is HATA (izometri-oku HTTP 508):** M100-355-401/402-HC, 15-17 sayfali agir PDF'ler. Server
  self-call loop (MK-168.3). Drenaji bogmaz (cekme bekliyor-only). Ayri/buyuk is.
- **Aktif devrelerde 277 atanmamis:** terfi-sonrasi re-esle / anahtar ayri borc.

## ACIK (169)
- **GECE CRON GERCEK TESTI (sabah ilk is):** buyuk devre yuklendi-yatildi. SQL ile bekliyor dustu mu /
  oneri_hazir artti mi / son ~03:00 mi bak.
- **A (UI):** "islensin mi/siraya mi" sorusunu kaldir → otomatik kuyruk + Islenenler takip.
- **B (malzeme):** ST35.8/ST37 KARBON tanit (once "Diger" kaynagini bul).
- **Terfi-sonrasi eslestirme testi** (C bulgusunun gercek dogrulamasi).
- **W-2.UI:** yukleme ekrani 78 belgede takiliyor (pilot riski).
- MK-168.1 schedule gun-ici otomatik yok · MK-168.3 508 · Y200 ogretimi · W-2.5 · W-2.9.

## MK (168 — KARARLAR.md'ye ISLENDI bf87c6a)
MK-168.1 (schedule gecikmesi + agac sarti) · MK-168.2 (YANLIS ALARM kapatildi: drenaj bekliyor-only) ·
MK-168.3 (izometri-oku 508 server self-call) · MK-168.4 (ayni tenant cok-kullanici guvenli, claim guard) ·
MK-168.5 (DUZELTILDI: Vercel cron Bearer otomatik gonderir, kod degismez).

## OPERASYONEL DERSLER (168 — MK degil)
- Sema-once (MK-85.3): bu oturumda 2 kez kolon adi tahmin edip "does not exist" yedik (dosya_adi,
  batch_id) → information_schema ile dogrulandi. Tahminle SQL yazma.
- Teshisten once dokunma (MK-126.8): _1-eki "bug fix" yazmadan once veri sordum, bug olmadigi cikti.
  Drenaj retry tavanini eklemeden once kodu okudum, gereksiz oldugu cikti. Iki bos commit'ten korundu.
- Yanlis teshis duzeltme: MK-168.5 (gece cron 500) web arastirmasiyla curutuldu, kod yazilmadi.

## TEST DEVRELERI — SILME
"bn omn" (77bfbc98) · "b nn" (e0af361d, taslak) · 168 yuklemeleri: ae39c5c2 (taslak, 78 belge),
bcb3192a (508 veren agir PDF'ler).
