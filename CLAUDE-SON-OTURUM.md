# CLAUDE-SON-OTURUM.md — 173 (2026-06-09)

## NE YAPTIK
Dort is: A (claim-first izometri drenaj), B (buyuk .in() dilimleme), C (devreler olu kod temizligi),
IS1 (Islenenler tek isleme butonu). Hepsi canli + CI yesil. izometri-oku/cron/server-drenaj DOKUNULMADI,
DB migration YOK, 12/12 endpoint korundu. HEAD: 343af6c.

## A — CLAIM-FIRST (MK-173.1, commit f3b0765)
Belirti: in-page client drenaji (ares-izometri-drenaj.js _birIsIsle) sirasi (1) PDF indir (2) izometri-oku
cagir (L3, 11-25sn, PAHALI) (3) kuyruk-isle-izometri postla idi. Is bu arada cron/baska sekme tarafindan
kapilmissa server is_id dalinda 409/508 doner -> 2. adimda odenen L3 BOSA gider.
Onemli tespit: server claim'i (birIsIsle adim1, MK-167.1) ZATEN atomik (UPDATE bekliyor|hata->isleniyor +
select). Sorun claim'in PARSE'tan SONRA olmasi. Cozum = claim'i parse ONCESINE almak.

Server (api/kuyruk-isle-izometri.js):
- body: claimOnly = body.claim_only===true; zatenClaim = body.zaten_claim===true.
- is_id dalinda: claimOnly ise SADECE atomik claim'i calistir (indirme/izometri-oku YOK), {claimed:true/false}
  dondur. Normal sonuc-post'ta guard gevsetildi: bekliyor|hata VEYA (zatenClaim && durum=='isleniyor') -> izin
  (kendi claim'imiz; yoksa 409). birIsIsle'ye zatenClaim gecirildi.
- birIsIsle: `if (!opts.zatenClaim) { ... re-claim ... }` — zatenClaim ise re-claim ATLANIR (claim_only'de
  kilitlendi, tekrar denerse bos doner -> yanlislikla 'atlandi' olurdu).

Client (ares-izometri-drenaj.js):
- _birIsIsle basina 0) adim: POST {is_id, claim_only:true}. cj.claimed!==true (ya da claim cagri patlar) ->
  {sonuc:'atlandi'} don (indirme/izometri-oku YOK). claimed:true -> devam.
- sonuc-post'a zaten_claim:true eklendi.
- ozet.atlandi sayaci; dongude wj.sonuc==='atlandi' -> ozet.atlandi++ (islenen DEGIL, hata DEGIL).

Garantiler: deneme_sayisi claim'de 1x artar (sonuc-post'ta artmaz). Tarayici claim sonrasi cokerse is
'isleniyor'da kalir, staleLockTemizle 5dk sonra toparlar. Gece cron drenajTuru->birIsIsle opts'suz cagirir,
zatenClaim undefined -> normal re-claim, ETKILENMEZ. Eski (zaten_claim gondermeyen) client geriye uyumlu.

## B — BUYUK .in() DILIMLE (MK-173.2, commit b8c5819; MK-172.5 sinifi)
devre_wizard_v3.html:
- hataYenidenDene: UPDATE dosya_isleme_kuyrugu .in('devre_dokuman_id', ids) cok belgeli devrede yuzlerce id ->
  URL sismesi -> 400. 150'lik dilim dongusu (for _bi += 150) ile bolundu; mevcut hata yonetimi (console.error +
  spesifik toast + return) korundu.
- hataBandiYukle: AYNI buyuk ids ile SELECT de patlardi -> retry butonunu barindiran bant 400 yer, buton hic
  gorunmezdi. _inDilimli(ids,150,...) ile bolundu. Kapsam 1 satir genisletildi (sessiz degil, Cihat'a soylendi).

## C — DEVRELER OLU KOD (MK-173.3, commit 826a2b5)
devreler.html (172/SIRA + 172/TERMIN emeklileri):
- getSiraMap + siraGuncelle (JS) silindi (tek referans kendi tanimlariydi; cagri yok).
- _doRender'daki _siraCache atamasi silindi (atanip okunmuyordu + getSiraMap artik yok).
- .sira-input CSS (5 kural) silindi (HTML'de eslesen element yok).
- eski .takvim-popup/.takvim-* CSS silindi (172 native picker'a gecmisti; popup markup zaten yoktu).
- AKTIF kalan: .termin-* + native .termin-dt gizli date input + native picker mantigi. DOKUNULMADI.
- Hepsi 173/C tombstone yorumla isaretli. brace dengeli, inline syntax OK. 2760->2739.

## IS1 — TEK ISLEME BUTONU (MK-173.4, commit f1c39ca + 343af6c)
Belirti (Cihat): Islenenler ekraninda hem yanip sonen "Islenenler N" nav pili HEM "Bekleyenleri isle" butonu var,
kafa karistirici. Istek: TEK buton; bosta mavi, tetikte beyaz + yanip sonen mavi nokta.
devre_wizard_v3.html:
- #btnIslDrenaj = tek buton. CSS `.isl-run` (id+class specificity .btn.pri:disabled greyini ezer): beyaz bg, koyu
  metin, .nokta yanip soner. islenenlerDrenaj: basta classList.add('isl-run') + innerHTML nokta+Isleniyor; basliyor
  fazinda innerHTML nokta + "Isleniyor N/M..."; bitince classList.remove + mavi metne don.
- Nav pili #btnIslenenler: <span class="isl-btn-dot"> (sureki blink) markup'tan cikarildi; .isl-btn-dot CSS kurali
  silindi. Pil artik sade "Islenenler (sayi)" navigasyonu (Adim 1/2 giris kapisi, silinmedi).
- ozet.atlandi toast: global (islenenlerDrenaj) + per-satir (islenenlerDrenajDevre) — "... hata X, atlandi Y" +
  "N is zaten isleniyordu (atlandi)" dali (islenen=0 ama atlandi>0 durumu).

## OZ-IHLAL / TUZAKLAR (173)
- A'da: ilk dururken "server claim eksik mi" diye dusunulebilirdi; kod okununca claim'in VAR ama YANLIS SIRADA
  oldugu gorulduгu. Once server akisi (kuyruk-isle-izometri.js) + client loop (ares-izometri-drenaj.js) tam
  okundu, sonra tasarim (MK-126.8/132.1). Tahmin edilmedi.
- B'de: sadece UPDATE'i dilimleyip komsu SELECT'i unutmak fix'i etkisiz kilardi (bant once patlar). Akisin
  tamami tarandi.
- C'de: _siraCache atanip okunmuyordu; getSiraMap silinince onu cagiran satir AYNI patch'te gitti (ReferenceError
  onlendi). Silmeden once grep ile "olu mu" kanitlandi.
- IS1: blink TEK yerde (aksiyon butonu). Cross-view nav noktasi KASTEN konmadi (tek buton istegine sadik).

## COMMIT'LER (173)
f3b0765 (A) · b8c5819 (B) · 826a2b5 (C) · f1c39ca (IS1 cekirdek) · 343af6c (IS1 per-satir, HEAD).
Aralarda chore(ci) ci-son-rapor.json [skip ci] commit'leri (CI botu). 12/12, migration yok, izometri-oku
dokunulmadi.

## KAPANIS BORCU (174'te HATIRLA)
- IS2: terfi "Aktariliyor..." donmus hissi -> iskelet/cascade animasyon (Cihat: AYRI OTURUM, buyuk).
- W-2.5: Step-1 iki ilerleme cubugu (progressFill + islenStrip) -> tek cubuk; gorsel karar, ekranda goster.
- Spool-seviyesi hata rozeti (dosya-adi->spool esleme, kirilgan): devre_detay/spool_detay tarafi olabilir.
- KARARLAR (kok): MK-173.1..4 docs/KARARLAR.md koke ISLENDI (172 zaten kokteydi). Kokte MK-169/170/171 EKSIK
  (168'den 172'ye atliyor) — eski borc, icerik bulununca isle.
- Eski: kuyruk takili kayitlar · W-2.9 paralel devre · Y200/format ogretimi.
