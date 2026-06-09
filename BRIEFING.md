# AresPipe BRIEFING — 173. Oturum Kapanisi

> Tek aktif baglam dosyasi (MK-56.2). Sohbet acilisinda `cat BRIEFING.md` ciktisini yapistir.
> Ilerleme aynasi: docs/WIZARD-YOL-HARITASI.md. Tum kararlar: docs/KARARLAR.md. UI borc: docs/UI-BORC.md.

## HEAD
- Tema: A/B/C teknik borc temizligi + IS1 (Islenenler tek isleme butonu). Hepsi canli + CI yesil.
- HEAD: 343af6c. Onceki kapanis (172): f7104b5.
- 173 kod commit zinciri:
  - f3b0765 — A: claim-first izometri drenaj (MK-173.1)
  - b8c5819 — B: hataYenidenDene + hataBandi buyuk .in() dilimle (MK-173.2, MK-172.5 sinifi)
  - 826a2b5 — C: devreler olu kod temizligi (MK-173.3)
  - f1c39ca — IS1 cekirdek: tek isleme butonu + nav pili sadelesti (MK-173.4)
  - 343af6c — IS1 per-satir atlandi toast (MK-173.4 tutarlilik)
- Degisen dosyalar (173): api/kuyruk-isle-izometri.js · ares-izometri-drenaj.js · devreler.html · devre_wizard_v3.html
- DB: migration YOK. Endpoint YOK (12/12 — MK-129.3). izometri-oku DOKUNULMADI (MK-49.1). Gece cron AYRI/etkilenmedi.

## 173 — KANITLANANLAR / YAPILANLAR
1. CLAIM-FIRST (MK-173.1, A). Belirti: in-page drenajda tarayici PARSE'tan ONCE PDF indirip izometri-oku (L3,
   pahali) cagiriyordu; is bu arada cron/baska sekme tarafindan kapilmissa kuyruk-isle-izometri 409/508 doner
   -> L3 BOSA ODENIR. Server claim'i (MK-167.1) zaten atomik ama PARSE'tan SONRA calisiyordu.
   Cozum (yeni endpoint YOK, mevcut endpoint'e parametre):
   - Server (kuyruk-isle-izometri.js): is_id dalina `claim_only:true` modu (SADECE atomik claim, indirme/izometri-oku
     YOK). `zaten_claim:true` -> sonuc-post'ta is 'isleniyor'da (kendi claim'imiz) oldugundan guard'a izin verilir.
     birIsIsle'de `zatenClaim` ise re-claim guard ATLANIR (claim_only'de kilitlendi).
   - Client (ares-izometri-drenaj.js): _birIsIsle parse'tan ONCE `{is_id, claim_only:true}` postlar. claimed!==true
     -> parse'a GIRMEZ, `{sonuc:'atlandi'}` doner (L3 odenmez). claimed:true -> indir+izometri-oku -> sonuc-post'a
     `zaten_claim:true` eklenir. ozet.atlandi sayaci eklendi (hata DEGIL, islenen DEGIL).
   - deneme_sayisi claim'de 1 kez artar, sonuc-post'ta artmaz (cift sayim yok; stale-lock "3 deneme" korunur).
   - Geriye uyum: zaten_claim gondermeyen eski client hala calisir (is bekliyor'sa guard gecer, birIsIsle re-claim eder).
   - Gece cron: drenajTuru -> birIsIsle opts'suz -> zatenClaim undefined -> normal re-claim. ETKILENMEZ.
2. BUYUK .in() DILIMLE (MK-173.2, B; MK-172.5 sinifi). devre_wizard_v3.html:
   - hataYenidenDene UPDATE `.in('devre_dokuman_id', ids)` cok belgeli devrede yuzlerce id -> URL sismesi -> 400.
     150'lik dilim dongusu ile UPDATE bolundu (mevcut hata yonetimi korundu).
   - hataBandiYukle SELECT (ayni buyuk ids) de `_inDilimli(ids,150,...)` ile bolundu — yoksa bant 400 yer,
     retry butonu hic gorunmezdi (kapsam 1 satir genisletildi, sessiz degil).
3. DEVRELER OLU KOD TEMIZLIGI (MK-173.3, C). devreler.html: getSiraMap/siraGuncelle (JS) + _siraCache atamasi +
   .sira-input CSS + eski .takvim-popup CSS silindi (172/SIRA + 172/TERMIN emeklileri). Native termin picker ve
   .termin-* AKTIF kod dokunulmadi. Hepsi 173/C tombstone yorumla isaretli. 2760 -> 2739 satir.
4. ISLENENLER TEK ISLEME BUTONU (MK-173.4, IS1). devre_wizard_v3.html:
   - #btnIslDrenaj = TEK buton. Bosta mavi `.btn.pri` "Bekleyenleri isle"; islerken beyaz + yanip sonen mavi nokta
     "Isleniyor N/M..." (yeni `.isl-run` class; specificity #id.class beyaz disabled greyini ezer).
   - Nav pili #btnIslenenler: SUREKLI yanip sonen nokta (.isl-btn-dot) KALDIRILDI -> sade "Islenenler (sayi)"
     navigasyonu (Adim 1/2 giris kapisi oldugu icin silinmedi, sakinlesti).
   - ozet.atlandi toast'a eklendi (global + per-satir): "... hata X, atlandi Y" + "N is zaten isleniyordu (atlandi)"
     dali (hepsi baska isleyicide alindi durumu).

## ACIK BORCLAR (173 sonu)
- IS2 (terfi "Aktariliyor..." donmus hissi -> iskelet/cascade animasyon): Cihat karari ile AYRI OTURUMA. Buyuk.
- W-2.5 (Step-1'de iki ilerleme cubugu: progressFill hazirlik + islenStrip "N PDF isleniyor"): hangisi fazla =
  gorsel/UX karar, ekranda gosterilmeden tahminle birlestirilmez (MK-132.1). Ayri hizli pasaj.
- Spool-seviyesi hata rozeti (dosya-adi->spool esleme; kirilgan): devre_wizard_v3'te izi YOK, muhtemelen
  devre_detay/spool_detay tarafi ya da hic baslanmamis. Kendi oturumu.
- Opsiyonel: islerken nav piline capraz-gorunum noktasi (baska sekme/cron ilerlemesi) — KASTEN konmadi (tek buton istegi).
- Eski devir: kuyruk takili kayitlar · W-2.9 paralel devre · Y200/format ogretimi (diger bilgisayar, zip workflow).
- KARARLAR (kok): MK-173.1..4 docs/KARARLAR.md koke islendi (172 zaten kokteydi). NOT: kokte MK-169/170/171 EKSIK
  (MK-168'den MK-172'ye atliyor) — eski borc; icerik bulununca islenmeli (ben uydurmadim).

## OPERASYONEL NOT
- PUSH = gpc (add+commit+rebase+push). Kod commit'leri [skip ci] YOK; bu doc kapanisi [skip ci] ILE.
- Patch disiplini: str_replace + abort-on-mismatch (anchor tekil) + .bak + node --check (JS) /
  inline-script syntax check + brace dengesi (HTML). Tum 173 yamalari boyle indi. MD5'li arespipe_kopyala.

## TEST DEVRELERI — SILME
Sistemde gercek devre YOK, hepsi test. 173 yeni: cgghmcmhgvm120 (M120 ailesi), cghfdkv, hthth, thjjy, kfyukfyl,
kgcdkgc, uogyol. 172: NB1099C, NB1124, M120-Galv. 170: NB1099C. 171: M110-St.St, E120-St.St. SILME.
