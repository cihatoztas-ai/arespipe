# son-durum.md — 170. Oturum (2026-06-08)

## TEMA
AKIS SADELESTIRME — devre yukleme uctan uca, Cihat modeline gore. Iki sayfa tek yuzey; karar ekrani
sadelesti; Islenenler'e per-devre Isle + isleniyorken Izle; cetelede dosya seviyesi hata bandi.

## DURUM
- Commit'ler (170): tek-yuzey birlestirme (devre_detay ?taslak=1 -> wizard + iki Onizle kaldir) ·
  faa5079 (karar ekrani) · b55157b (per-devre Isle + Izle) · 05ca11e (hata bandi). Onceki HEAD 8ef315c.
  Final HEAD 05ca11e.
- 12/12 fonksiyon (yeni endpoint YOK). Migration YOK. izometri-oku DOKUNULMADI (MK-49.1).

## YAPILANLAR (hepsi canli)
1. Tek-yuzey (MK-170.1): taslak yalniz wizard; devre_detay ?taslak=1 -> wizard yonlenir; iki Onizle
   kaldirildi. 166 koprusu (MK-165.7/2) bilincli geri alindi; dormant kod silinmedi.
2. Karar ekrani (MK-170.2): Incele & Onayla cikti -> Islenenler'e Git / Cik / Yeni Devre. Izometri
   karar ekraninda islenmez.
3. Per-devre Isle (MK-170.3): Islenenler satirinda s.acik>0 iken "Isle" (oncelik); global Bekleyenleri
   isle sirayla; WIZ._islDrenaj paylasilir.
4. Isleniyorken Izle (MK-170.4, regresyon): Incele disabled kaldirildi; isleniyorken "Izle" + canli dolum.
5. Dosya seviyesi hata bandi (MK-170.5): durum=hata belgeler ad+sebep ile gorunur; "eksik" vs "hata"
   ayrisir; istemci tarafi cekim, server degismedi.

## OPERASYONEL DERSLER (170)
- Read-before-write (MK-126.8): wizard cetele tablosu ZATEN tam kolonlu cikti (canliya yakin + Durum +
  Izometri) -> tabloya gereksiz dokunmaktan kacinildi; "yok onizle" kafa karisikligi 2 cerrahi edit
  (redirect + buton kaldirma) ile cozuldu.
- Onizle kaldirma bir REGRESYON dogurdu (isleniyorken liste gorme) -> ayni turda Izle ile geri kazanildi.
- Drenaj motoru zaten filtre:{devreId} destekliyordu (Step 2 kullaniyordu) -> per-devre Isle ucuz oldu.
- "Bos Incele" patlama degil, s.acik>0 disabled idi (mevcut tasarim) -> teshis kod ile, suclamadan once.

## DEGISEN DOSYALAR
devre_detay.html (taslak=1 -> wizard redirect; onizleme dormant) ·
devre_wizard_v3.html (iki Onizle kaldir · karar buton+metin · per-devre Isle · Izle · hata bandi).

## ACIK (170 sonu)
B spool-seviyesi hata rozeti · tekrar-dene · W-2.9 paralel · W-2.5 iki cubuk · dosya_isleme_kuyrugu takili
· gece cron gercek testi · Y200/format ogretimi (pakette degismedi) · KARARLAR.md MK-170.1..5 islenecek.

## TEST DEVRELERI — SILME
Hepsi test. 170: NB1099C ailesi (vmh cvv=841b117f-ef40-4b9c-b600-488444e734b8, hvbjhovojh, ovvmhc,
gsdhh, b nn, hvbn o, gcmhgcm).
