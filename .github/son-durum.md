# son-durum.md — 172. Oturum (2026-06-09)

## TEMA
DEVRELER SADELESTIRME + ISLENENLER (kuyruk) EKRANI UCTAN UCA. v1/v2 emekli, tek giris yesil "Devre Ekle".
Islenenler Bad Request cozumu + redesign + drenaj durdur/oncelik + iskelet/cascade animasyon.

## DURUM
- Degisen dosyalar: devreler.html · proje_detay.html · devre_wizard_v3.html · ares-izometri-drenaj.js
- Silinen: devre_yeni.html (v1) · devre_wizard.html (v2) — git rm (gecmis korur).
- 12/12 fonksiyon (yeni endpoint YOK). Migration YOK. izometri-oku DOKUNULMADI. Server kodu degismedi.
- Ilk 172 kod commit'i: 4146bc9. Wizard fix/redesign/durdur/iskelet/cascade commit'leri ardindan geldi.
- CI: kod commit'leri [skip ci] YOK ile gitti (CI kosar). Kapanis doc'lari [skip ci] ILE.

## YAPILANLAR (hepsi canli)
1. Devreler tek giris (MK-172.1) — yesil "Devre Ekle" -> wizard v3; v1+v2 emekli+rm; proje_detay -> v3.
2. Son guncelleme damgasi (MK-172.2) — tablo basligi sagi; max(olusturma, non-null guncelleme), acilista 1 kez.
3. Imalat sira no kaldirildi (MK-172.3) — yildiz kalir.
4. Native termin takvimi (MK-172.4) — showPicker, aninda kayit; ozel popup emekli.
5. Islenenler Bad Request fix (MK-172.5) — buyuk .in() -> _inDilimli (150) ile bolundu.
6. Islenenler redesign (MK-172.6) — kutu-per-satir mockup + ozet.
7. Drenaj durdur/oncelik (MK-172.7) — tek-drenaj + interrupt; 409 yarisi cozuldu. Gece cron AYRI/etkilenmez.
8. Yukleme animasyonu (MK-172.8) — aninda shimmer iskelet + cascade reveal; yenilemede animasyon yok.
9. Isleniyor butonu (MK-172.9) — beyaz + yanip sonen nokta; nav butonu kum saati de noktaya.
10. Step 1 Geri -> Islenenler listesi (MK-172.10).

## GECE CRON
- Cihat canli test etti, calisiyor (sabah kirmizilar gitmis). "Gece cron gercek testi" ACIK BORCU KAPANDI.

## OPERASYONEL DERSLER (172)
- "Bad Request" cogu zaman buyuk .in() URL sismesidir; kolon hatasi olsa aciklayici mesaj gelirdi.
  Rozet sayisinin gelmesi = ilk sorgu OK, sonraki .in() patliyor ipucu verdi. _inDilimli kalici cozum.
- 409 (Conflict) seli = iki client-loop ayni isi cekiyor (lock calisiyor ama bos efor + L3 maliyeti).
  Tek-drenaj + durdur() yarisini bitirdi.
- "Yukleniyor" hissi: iki-fazli render YETMEDI (ilk 2 sorgu sirasinda hala statik yazi). Cozum devreler'in
  kendi deseni: ANINDA shimmer iskelet + cascade. Onceki yarim fix dersi: bekleme hissini iskelet kapatir.
- Iki yanlis animasyon turu var: (a) Step 1 cizgi-tarama (ai-scan), (b) devreler satir cascade (_cascadeIn).
  Cihat'in "tema" dedigi (b) cascade. Once sehven (a) eklendi, geri alinip (b) konuldu.

## ACIK (172 sonu)
- 508/claim-first: in-page drenaj zaten islenmis ise client parse edip 409/508 yiyor (bos L3). Claim-first
  (parse ONCESI lock) adayi. izometri-oku dokunulmaz.
- hataYenidenDene UPDATE .in() dilimli degil (latent buyuk-.in()).
- devreler olu kod (sira* + eski takvim CSS) temizligi.
- Parallel drenaj (kasten yapilmadi). Islenenler salt-izleme poll'u (onerildi).
- Eski: spool-seviyesi hata rozeti · kuyruk takili kayitlar · W-2.9 · W-2.5 · Y200/format ogretimi.

## TEST DEVRELERI — SILME
Hepsi test. 172: NB1099C, NB1124, M120-Galv. 170: NB1099C. 171: M110-St.St, E120-St.St. SILME.
