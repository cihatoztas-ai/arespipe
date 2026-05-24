# AresPipe — Son Durum (Oturum 118 kapanis, 24 May 2026)

## Bu oturum ne tipti
DUSUNCE + VERI + KILAVUZ oturumu. Kod YAZILMADI (bilincli). Cikti: kapsamli mimari kilavuz.

## Genel durum
- Git: temiz, working tree clean. 117 kapanis commit'i (`6e238ca`) uzerine bu oturum doc-only ekler.
- CI: yesil (117 sonu).
- Mimari: cok-kiracili, RLS, 093 migration'a kadar uygulanmis. Excel parser (101), Devre Wizard (100) canli.

## Bu oturumun urunu
**docs/format-tanitma-kilavuzu.md** — 116 vizyon notunun kapsamli halefi. Faceted/seselici tabanli
katmanli format modeli, gercek capraz-dogrulanmis veriyle (15 Tersan PDF + 4 capraz PDF + 4 ekran goruntusu).

## Onaylanan mimari (ozet)
- Format kurallari monolit degil, SESELICI tabanli katmanli paketler (evrensel<-aile<-malzeme<-gemi).
- Format ailesinin birincil yordayicisi TASARIM OFISI; kimligi yapisal parmak izinde (MK-118.4).
- Gecis ek bir katman birlestiricidir; mevcut Tersan satiri + l2-parser motoru korunur (MK-118.3, tembel refactor).
- Yeni format: gorsel isaretleme akisi (onayla / a-b-c / kutu ciz); capa-tabanli saklama; uc statu
  (firma-taslak -> firma-onayli -> evrensel); promote = 2 bagimsiz firma VEYA super admin + anonimlestirme.
- Eksik alan: sessiz hata yok; "bu PDF mi / format mi" sorusu (varsayilan: format); ayni ailede kuyruk
  otomatik yeniden degerlendirme + ozet.

## Acik borclar (117'den devreden, hala acik)
- **117 acik borc — yukleyen_id null:** `api/kuyuk-isle-izometri.js:305` yukleyen_id null ise isi
  "yukleyen_id bos" ile kapatir (izometri-oku kullanici_id zorunlu, satir 334). Sistem yuklemeleri parse
  edilemiyor. Cozum: dosyalara kullanici id ata VEYA kontrolu gevset (veri sahipligine dikkat). HALA ACIK.

## Yeni acik kalemler (118'den)
- Aile katalogu 5 metinli (A1,A2,B,C,D) + image (E); her aile icin daha cok ornek gerek.
- Ayni ofisin iki surumune ait ornek lazim (MK-118.5'i veriyle gormek).
- "Cok buyuk / yaninda olmayan" formatlar Cihat'ta; toplaninca katalog genisler.

## Kaydedilen MK kararlari
MK-118.1 ... MK-118.9 (kilavuz Bolum 15'te). Onemliler: 118.4 (ofis=yordayici, kimlik degil),
118.6 (profesyonel desenleri secici al), 118.7 (capa-tabanli isaretleme), 118.8 (uc statu+anonim promote),
118.9 (sessiz hata yok + kuyruk otomatik).
