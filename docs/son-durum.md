# son-durum.md — 169. Oturum (2026-06-08)

## TEMA
Devre yukleme CIKIS KAPILARI + elle eslestirme. Operator "eslesmedi/eksik" duvarinda tikaniyor,
cikis yoktu (Cihat). Cozuldu ve UCTAN UCA CANLI KANITLANDI.

## DURUM
- Commit'ler (bugun): `1960fca` (cikis kapilari) · `5f19c6e` (A1 K2 eslestirme) · `09ae6ca` (A2 terfi map).
  Onceki HEAD `25ec5db` (168 kapanis).
- 12/12 fonksiyon (yeni endpoint YOK). Migration YOK. izometri-oku DOKUNULMADI (MK-49.1).
- DB: taslak_duzeltmeleri'ne yeni alan tipi '_pdf_spool_map' (sema degismedi, alan serbest text).

## YAPILANLAR
1. **A acigi (operator tikanmasi) — KAPANDI, canli.** Teshis bandi (kabuk=0/fazla>0/eksik>0 dogru
   yonlendirir) + sert onay kapisi (eslesmemis varken onay kutusu sarti, kabuk=0'da engel) +
   fazla satir "Excel'i kontrol et"/"🔗 Eslestir" + K3 "Excel'i kontrol et / Iptal" temiz cikis.
2. **A1 (K2 elle eslestirme UI) — KAPANDI, canli.** Fazla PDF "🔗 Eslestir" -> popup (sol: ayni
   pipeline eksik Excel spool'lari) -> "Bagla". Overlay taslak_duzeltmeleri (alan='_pdf_spool_map').
   Excel sayisi sabit, yeni spool yok. Tablo aninda guncellenir (fazla duser, eksik "elle" rozeti).
   12 eslestirme tek devrede sorunsuz.
3. **A2 (terfide gercek bag) — KAPANDI, canli.** eslestir() _pdf_spool_map okur, S46_1->S46 map'ler,
   PDF verisini hedef spool'a bindirir, cizim_durumu eksik->kismi. Terfi sonrasi SQL kaniti (2f88d92e):
   elle eslestirilen hedefler cizim_durumu='kismi' + cap/et dolu.

## KURAL (Cihat 169)
Excel = dayanak. Excel'de N spool varsa PDF'ten N!= yuklenmez; sistem Excel'i delmez. Eslesmeyen PDF
ya yanlis yazim (elle eslestir) ya Excel eksik (insana yonlendir). Sayi farkinda otomatik ekleme YOK.
`_1` eki: PDF 'S46_1' / Excel 'S46', normSpoolNo esitlemiyor; kabukta rakip yok -> elle eslestirme
guvenli. Global normSpoolNo soyma YAPILMADI (regresyon riski).

## ACIK (169 sonu)
- **Modal yanlis sayi (KUCUK):** onayAc modali eslestirme overlay'ini okumuyor; 12 eslestirilse de
  "12 eslesemedi" gosteriyor. Terfi mantigi dogru (SQL kanitladi). Cozum: onayAc'ta WIZ._pdfMap'i dus.
- **spool_detay PDF gorunmuyor (TESHIS EDILMEDI):** terfi sonrasi spool_detay'da PDF yok. Sonraki tur:
  kaynak bul (spool_detay.html PDF cekme + devre_dokumanlari.spool_id bagi terfide yazildi mi).
- **kismi/bekliyor karisik:** 12 elle eslestirmeden bazi hedefler 'kismi', bazi 'bekliyor'. Beklenen mi
  (montaj/imalat) yoksa A2 atladi mi — dogrula.
- W-2.UI yukleme takilmasi · MK-168.1 schedule · MK-168.3 508 · gece cron gercek testi (yine bos cikti)
  · Y200 ogretimi · W-2.5 · W-2.9.

## OPERASYONEL DERSLER (169)
- Sema-once (MK-85.3): bu oturumda kolon TAHMIN ETMEDIM — her SQL oncesi information_schema/CHECK
  dogrulamasi yaptim (proje_no->proje_id, devreler.ad NULL, taslak_duzeltmeleri.alan serbest text).
  168'deki "2 kez tahmin isirdik" tekrarlanmadi.
- Once-oku-sonra-dokun (MK-126.8): "kabuk bos" ilk teshisim YANLISTI (spooller terfi-sonrasi dolar,
  taslakta _kabukSpoollar'da); SQL ile duzeltildi. 595c435 (166) suclanmadan once git show ile
  masum oldugu dogrulandi (sadece kalite alani eklemis, anahtara dokunmamis).
- Patch disiplini: tum HTML/JS degisiklikleri Python patch + abort-on-mismatch + MD5 + .bak yedek.
  A2 anchor 1 ilk denemede 2 kez bulundu (montajEslestir'de ayni kalip) -> abort etti, dosya bozulmadi
  -> eslestir'e ozgu yorumla benzersiz kilindi. node --check her JS degisikliginde gecti.
- Drenaj zamanlamasi: inceleme acilinca drenaj yeniden kosar; "isleniyor" penceresinde sayaclar gecici
  dusebilir (panik degil). bekliyor=0 olunca eslestir/terfi.

## DEGISEN DOSYALAR
devre_wizard_v3.html (cikis kapilari + K2 eslestirme) · api/kuyruk-isle-izometri.js (eslestir A2 map).
DB: taslak_duzeltmeleri yeni alan '_pdf_spool_map'.

## TEST DEVRELERI — SILME
Hepsi test (gercek devre yok). 169: `2f88d92e` (vhjgvnbv, A1/A2 kaniti, terfi edildi). `bcb3192a` silindi.
