# CLAUDE-SON-OTURUM.md — 170 (2026-06-08)

## NE YAPTIK
Devre yukleme akisini Cihat'in zihinsel modeline oturttuk. Onun cumlesiyle: yeni devre ekle -> bilgi gir,
klasor birak -> dosyalar alinir -> "kuyruga alindi" karar ekrani (ne yapmak istersin) -> Islenenler'de
bekle -> istersek bir devreyi onden isle, yoksa hepsini sirayla -> tek sayfada ilerleme + hangisinde sorun
var -> duzenle/incele -> canliya al. "Yok onizle, oradan wizard'a git" kafa karisikligini kokten kaldirdik.

## ANA KAZANIMLAR (hepsi canli)
1. TEK-YUZEY (MK-170.1). devre_detay ?taslak=1 ARTIK onizleme cizmiyor; location.replace ile wizard'a
   yonleniyor (catch-all). Wizard'dan iki "Onizle" butonu (onay-bar + Islenenler satiri) kaldirildi.
   Bulgu: wizard Adim 2 zaten "devre_detay tabanli" (MK-126.7) — yani onizleme bir TEKRARDI; ustelik ayni
   devrede yuzeyi farkli hesapliyordu (Diger vs Siyah) + uretim kolonlari (Ilerleme/Bukum/Kesim) taslakta
   anlamsizdi. 166 koprusu (MK-165.7/2) bilincli geri alindi; dormant kod silinmedi.
2. KARAR EKRANI SADELESTI (MK-170.2). Popup'tan "Incele & Onayla" cikti -> Islenenler'e Git / Cik /
   Yeni Devre. Izometri karar ekraninda islenmez (yukleme yalniz kuyruga atar).
3. PER-DEVRE ISLE (MK-170.3). Islenenler satirina "Isle" (yalniz o devre, oncelik). Drenaj motoru zaten
   filtre:{devreId} destekliyordu -> ucuz. Global "Bekleyenleri isle" sirayla; WIZ._islDrenaj paylasilir.
4. ISLENIRKEN IZLE (MK-170.4, regresyon duzeltmesi). Onizle'yi kaldirinca isleniyorken liste gorme
   kaybolmustu (Incele s.acik>0 disabled). Disabled kaldirildi; isleniyorken "Izle" + canli dolum.
5. DOSYA SEVIYESI HATA BANDI (MK-170.5). devre-inceleme API hata dondurmuyor -> istemci tarafi
   dosya_isleme_kuyrugu durum='hata' cekip cetele ustunde kirmizi bant (dosya adi + hata_mesaji).
   "eksik" ile "hata" ayrisir. Server/12-12 degismedi. Salt-gorunur.

## OZ-IHLAL / TUZAKLAR (170)
- "Bos Incele" patlama saniliyordu; aslinda s.acik>0 disabled (mevcut tasarim). Suclamadan once kod
  okundu (MK-126.8/132.1). Ama disabled gorunmuyordu -> Izle ile cozuldu.
- Onizle'yi kaldirmak isleniyorken-liste-gorme regresyonu dogurdu; ayni turda yakalanip Izle ile kapatildi.
- Wizard cetele tablosu zaten tam kolonluymus (mockup'ta az kolon dar onizleme yuzundendi) -> tabloya
  gereksiz dokunmaktan donuldu.
- Merge patch'i ilk denemede repoya inmemisti (script bulunamadi); MD5/git ile durum dogrulanip duzeltildi.

## COMMIT'LER
tek-yuzey birlestirme (devre_detay + wizard) · faa5079 (karar ekrani) · b55157b (per-devre Isle + Izle) ·
05ca11e (hata bandi). Final HEAD 05ca11e. 12/12, izometri-oku dokunulmadi, migration yok.

## KAPANIS BORCU (171'de HATIRLA)
- B: spool seviyesi hata rozeti (dosya-adi->spool esleme; kirilgan, dikkatli).
- Tekrar dene: hata bandina yeniden-isle (kuyruga yazma).
- KARARLAR.md (kok dosya, pakette degil): MK-170.1..5 + devreden gecikmis MK-166/167 islenecek.
- W-2.9 paralel · W-2.5 iki cubuk · dosya_isleme_kuyrugu takili · gece cron gercek testi · Y200.
