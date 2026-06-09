# AresPipe BRIEFING — 172. Oturum Kapanisi

> Tek aktif baglam dosyasi (MK-56.2). Sohbet acilisinda `cat BRIEFING.md` ciktisini yapistir.
> Ilerleme aynasi: docs/WIZARD-YOL-HARITASI.md. Tum kararlar: docs/KARARLAR.md. UI borc: docs/UI-BORC.md.

## HEAD
- Tema: DEVRELER SADELESTIRME + ISLENENLER (kuyruk) ekraninin uctan uca elden gecirilmesi.
  v1+v2 emekli edildi, tek giris yesil "Devre Ekle" -> wizard v3. Islenenler "Bad Request"i cozuldu,
  redesign edildi, drenaj durdurulabilir/onceliklenebilir oldu, yukleme animasyonu (iskelet+cascade) eklendi.
- Degisen dosyalar (172): devreler.html · proje_detay.html · devre_wizard_v3.html · ares-izometri-drenaj.js
- Silinen (git rm, gecmis korur): devre_yeni.html (v1) · devre_wizard.html (v2)
- DB: migration YOK. Endpoint YOK (12/12 — MK-129.3). izometri-oku DOKUNULMADI (MK-49.1). Server kodu degismedi.
- Onceki HEAD (171): b23192a / 0efebfd(docs). Ilk 172 kod commit'i: 4146bc9 (devreler+proje_detay+v1/v2 rm).

## 172 — KANITLANANLAR / YAPILANLAR
1. DEVRELER TEK GIRIS (MK-172.1). v1 "Yeni Devre" (devre_yeni.html) + v3-outline + Islenenler butonu
   KALDIRILDI; yerine tek YESIL "Devre Ekle" -> devre_wizard_v3.html (kosulsuz, flag gating kalkti).
   proje_detay.html "Yeni Devre" butonu da v3'e cevrildi. devre_yeni.html + devre_wizard.html git rm'lendi.
2. SON GUNCELLEME DAMGASI (MK-172.2). devreler tablo basliginda devre sayisi kaldirildi; saga
   "Son guncelleme: GG/AA/YYYY SS:DD" geldi. Acilista 1 kez (veriYukle), filtreden bagimsiz,
   max(olusturma, non-null guncelleme). NOT: PostgREST order desc NULL'lari basa alir -> olusturma yedegi sart.
3. IMALAT SIRA NO KALDIRILDI (MK-172.3). Satirdaki sira-input gitti, yildiz (malzeme durumu) kaldi.
4. NATIVE TERMIN TAKVIMI (MK-172.4). Ozel popup emekli; butona tikla -> tarayicinin kendi takvimi
   (showPicker), secince ANINDA kaydet. Temizleme native picker'in kendi temizlemesiyle.
5. ISLENENLER "BAD REQUEST" FIX (MK-172.5). Cok belgeli taslaklarda buyuk .in() listesi URL'i sisirip
   400 veriyordu. _inDilimli (150'lik dilim) ile devre_dokumanlari + dosya_isleme_kuyrugu sorgulari bolundu.
6. ISLENENLER REDESIGN (MK-172.6). Kutu-per-satir mockup: kart hover, durum-renkli kenar, isleniyor
   satirinda animasyonlu progress, oneri/manuel cikti, baslikta "N hazir . M isleniyor" ozeti.
7. DRENAJ DURDUR/ONCELIK (MK-172.7). ares-izometri-drenaj.js'e durdur() + isbirlikci iptal. Wizard'da
   tek-drenaj: bir devre islenirken baska "Isle"ye basinca mevcut durur, beklenir, oncelikli baslar.
   Ayni mantik global "Bekleyenleri isle" + Inceleme oto-drenajinda da -> 409 yarisi (iki eszamanli
   client-loop) cozuldu. GECE CRON AYRI (server-side izoDrenajCalistir), ETKILENMEZ.
8. YUKLEME ANIMASYONU (MK-172.8). "Yukleniyor" duvari kalkti: acilista ANINDA shimmer iskelet
   (devreler 14. oturum deseni) + satirlar yukaridan asagi kademeli acilir (_cascadeIn deseni,
   --ci 45ms gecikme). Yenilemede (drenaj sirasinda) animasyon YOK -> flicker yok.
9. ISLENIYOR BUTONU (MK-172.9). per-device "Isle" -> beyaz "Isleniyor" + yanip sonen mavi nokta
   (kum saati emekli). Render _islDrenajDevreId ile durumu korur (3'luk yenilemede sifirlanmaz).
   Islenenler nav butonundaki kum saati de yanip sonen noktaya cevrildi.
10. STEP 1 GERI -> LISTE (MK-172.10). Adim 1 "<- Geri" artik devreler.html yerine Islenenler listesine
    (islenenlerAc) doner. devreler'e cikis: breadcrumb "Devreler" veya "Iptal".

## GECE CRON — DOGRULANDI (171'den devreden borc KAPANDI)
- Cihat gece cron'u (kuyruk-isle.js izoDrenajCalistir, GitHub Actions) bu oturumda CANLI test etti:
  sabah acinca kirmizilar (hata satirlari) hizlica gitmis. Server-side, client drenajdan ayri, kilitle
  cakismaz. "Gece cron GERCEK testi" acik borcu artik KAPALI.

## ACIK BORCLAR (172 sonu)
- 508 (izometri-oku server-to-server loop): bazi PDF'ler in-page drenajda 508/409 veriyor; gece cron
  temizliyor. izometri-oku DOKUNULMAZ (MK-49.1). DERIN FIX adayi: client parse'tan ONCE isi "claim"
  (lock) et -> zaten islenmis ise bos yere L3 odeme/parse yapma. (Su an client parse edip 409 yiyor.)
- hataYenidenDene (171/RETRY): .in('devre_dokuman_id', ids) UPDATE'i hala dilimli DEGIL — buyuk devrede
  ayni buyuk-.in() bug sinifi (MK-172.5) potansiyeli. Henuz patlamadi; sirasi gelince _inDilimli uygula.
- devreler.html olu kod: siraGuncelle/getSiraMap/_siraCache + eski takvim-* CSS (zararsiz, otomatik
  calismaz). Temizlik patch'i ile silinebilir.
- kurallar.html doc sayfasi devre_yeni.html'e tarihsel atif yapiyor (zararsiz/bayat) — istenirse guncelle.
- Parallel drenaj: KASTEN yapilmadi (Cihat: "tek tek daha iyi"; paralel 409/508/maliyet riskini artirir).
- Islenenler salt-izleme dashboard poll'u (cron/baska tarayici ilerlemesini gormek): onerildi, yapilmadi.
- Eski devir (170/171): spool-seviyesi hata rozeti · dosya_isleme_kuyrugu takili kayitlar · W-2.9 paralel
  devre · W-2.5 iki ilerleme cubugu · Y200/format ogretimi (diger bilgisayar).

## OPERASYONEL NOT
- PUSH = gpc (add+commit+rebase+push). Kod commit'leri [skip ci] YOK; bu doc kapanisi [skip ci] ILE.
- Patch disiplini: Python/str_replace + abort-on-mismatch (anchor tekil) + .bak + node --check (JS) /
  inline-script syntax check (HTML). Tum 172 yamalari boyle indi.

## TEST DEVRELERI — SILME
Sistemde gercek devre YOK, hepsi test. 172 testleri: NB1099C (kgcdkgc/cghmcmvo aileleri), NB1124 (uogyol),
M120-Galv. 170: NB1099C. 171: M110-St.St, E120-St.St. SILME.
