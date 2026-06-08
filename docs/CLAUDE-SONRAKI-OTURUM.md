# CLAUDE-SONRAKI-OTURUM.md — 170 Acilisi

## ACILIS RITUELI
1. `git pull --rebase && git status && git log --oneline -6` — `09ae6ca` (A2), `5f19c6e` (A1),
   `1960fca` (cikis kapilari) gorunmeli + CI botu ci-son-rapor.json. Git temiz olmali.
2. Fonksiyon sayimi: `ls api/*.js | wc -l` -> **12** (MK-129.3 tavani).
3. `cat BRIEFING.md` (tek aktif baglam) + bu dosya.
4. Agir is one (context taze).

## 170 — ILK IS ADAYLARI (kucukten buyuge)

### A) MODAL YANLIS SAYI (kucuk, hizli) — onayAc duzeltmesi
> 169 tespit: "Devreyi Onayla" modali eslestirme overlay'ini OKUMUYOR. Operator 12 fazlayi
> eslestirdi ama modal hala "12 izometri eslesemedi" + "12 spool eksik" gosteriyor. Terfi mantigi
> DOGRU (terfi sonrasi SQL kanitladi — A2 calisti), sadece modal sayisi yanlis -> gereksiz tedirginlik.
- **Yer:** devre_wizard_v3.html, `onayAc()` fonksiyonu. `oz.fazla` / `oz.eksik`'i ham okuyor.
- **Cozum:** onayAc'ta WIZ._pdfMap'teki eslestirme sayisini fazladan dus:
  `fazla_efektif = oz.fazla - eslestirilenSayisi`. Eslestirilen eksik hedefler de "elle baglandi"
  sayilmali (eksik sayisindan dusmeli ya da ayri "X elle baglandi" satiri). Once renderInceleme'nin
  fazla/eksik'i nasil say(may)digina bak (MK-126.8) — bant zaten WIZ._pdfMap'i kullaniyor, modal kullanmiyor.
- Saf UI, kucuk. Python patch + abort-on-mismatch.

### B) spool_detay PDF GORUNMUYOR (TESHIS EDILMEDI — once kaynak bul)
> 169 tespit (Cihat): terfi sonrasi spool_detay sayfasinda PDF'ler gorunmuyor. HENUZ BAKILMADI.
- **Once teshis (MK-126.8), tahminle dokunma.** Kontrol sirasi:
  1. `grep -n "storage_yolu\|dosya_url\|spool_id\|devre_dokumanlari\|pdf" spool_detay.html` — PDF cekme yolu.
  2. SQL: terfi edilen devrede `devre_dokumanlari.spool_id` DOLU mu? (eslestirme-backfill terfide
     bunu yazar; yazilmadiysa spool_detay PDF'i bulamaz). Ornek: devre 2f88d92e.
     `SELECT spool_id, dosya_adi FROM devre_dokumanlari WHERE devre_id='2f88d92e-...' AND spool_id IS NOT NULL LIMIT 10;`
  3. spool_id NULL ise -> bag yazilmamis (backfill/eslestir spool_detay'in bekledigi kolonu doldurmuyor).
     spool_id DOLU ama PDF yoksa -> spool_detay'in cekme sorgusu/bucket yolu sorunu.
- A1/A2 ile iliskili olabilir (elle eslestirilen PDF'ler spool_detay'da gorunur mu) — ama tum PDF'ler
  icin mi yoksa sadece eslestirilenler icin mi gorunmuyor, ONCE bunu ayir.

### C) kismi/bekliyor KARISIK (dogrulama)
> Terfi SQL'inde (2f88d92e) elle eslestirilen 12 hedeften bazi 'kismi' bazi 'bekliyor' cikti.
- Beklenen mi (montaj cizimleri imalattan ayri, bindirme yok -> cizim_durumu degismez) yoksa A2
  bazilarini atladi mi? Vercel log'unda `[izo-eslestir] A2 overlay map: ...` satirlarini say (12 olmali).
  12 log varsa hepsi map'lendi -> 'bekliyor' kalanlar baska sebep (PDF montaj/icerik okunamadi).

## ACIK BORCLAR (devir)
- **W-2.UI** (168): yukleme/acilis ekrani uzun "yukleniyor"da takiliyor (senkron tum-dokuman). Pilot riski.
- **MK-168.1** GitHub schedule gun-ici otomatik yok. **MK-168.3** izometri-oku 508 (agir/cok-sayfali PDF,
  cagri katmaninda cozum — buyuk is).
- **Gece cron GERCEK testi:** 03:00 Vercel cron otomatik izometri surmesi — 168'de de 169'da da
  kanitlanmadi (gunduz drenaji eritti, gece penceresi bos). Mekanizma manuel dispatch + gunduz drenajiyla
  CALISIYOR; gozetimsiz gece yolu hala ispatsiz. Buyuk devre yukle-yat-sabah-SQL ile bak.
- **Y200 ogretimi** (diger bilgisayar; rece FORMAT-OGRETIM-ATOLYE-162.md) · **W-2.5** · **W-2.9**.

## ILKE HATIRLATMALARI
izometri-oku DOKUNULMAZ (MK-49.1) · 12/12 tavan (MK-129.3) · sema-once: information_schema/CHECK ile
dogrula, TAHMIN ETME (MK-85.3 — 169'da hic isirmadik, devam) · once-oku-sonra-dokun (MK-126.8 — 169'da
yanlis "kabuk bos" teshisini SQL ile duzeltti, 166'yi suclamadan once git show) · patch + abort-on-mismatch
+ MD5 + .bak yedek + node --check (JS) · Excel = dayanak, Excel'i delme (Cihat 169 kurali) · `_1`-eki cozumu
DAR (devre-bazli overlay, global normSpoolNo'ya dokunma) · commit'ler ayri blok (kod vs doc) ·
docs/ klasorune kapanis [skip ci] · zsh `()`/`*`/`!` tuzagi · tek satir commit mesaji.

## TEST DEVRELERI — SILME
Sistemde GERCEK devre YOK, hepsi test (Cihat). 169: `2f88d92e` (vhjgvnbv/NB1137, 165 spool, 12 elle
eslestirme + terfi — A1/A2 kaniti, SILME). `bcb3192a` silindi=true (iptal kalinti).
