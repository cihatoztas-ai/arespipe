# AresPipe — Son Durum (Oturum 181)

**Tarih:** 12 Haziran 2026
**Ana iş:** PAOR/AVEVA izometri formatının Devre Yükle wizard'ına **format adaptörü** olarak entegrasyonu.
**HEAD (181 sonu):** `9ee8460` — oturum 181 paor kabuk kalici parse_sonuc yazimi terfi reopen uyumlu
**Fonksiyon sayısı:** 12/12 (MK-129.3 korundu)

## Bu oturumda biten
PAOR devresi artık Devre Yükle wizard'ından, Tersan IFS ile **aynı sistem hattından** spool kabuğu kuruyor:
- PAOR klasörleri (xlsx + Isometric_View.pdf + -A.pdf) wizard'a drop edilir → **içerikten** tanınır (dosya adı değil).
- xlsx → `dokuman_tipi='bom_excel'`; kabuk satırları **istemcide** üretilir (`paor.js` partNameParse/kimlikCoz) ve `dosya_isleme_kuyrugu.parse_sonuc.satirlar`'a yazılır.
- Standart `ARES_KABUK.grupla` → spool kabuğu → terfi → aktif devre + spool listesi + iş emri.
- **1 çizim = 1 spool** (`spool_no='S01'`); `dn`→`"DN"+sayı` metni (olcuParse DN dalı).
- PDF'ler `'diger'/'sakla'` → L3'e gitmez, ama `devre_dokumanlari`'na saklanır (belge olarak ulaşılır).

**Canlı kanıt:** `NB138 — jöcvjögvmö`, 27 spool kuruldu, çaplar doğru (141.3 DN125 / 60.3 DN50 / 73), malzeme Karbon Çelik/St37 + Paslanmaz/316. Re-open'da (İncele & Onayla) kabuk dolu geldi — kalıcılık doğrulandı.

## Bu oturumun KRİTİK keşfi (sonraki oturumun ana konusu)
**PAOR L3 hattı MEVCUT ve AKTİF — spool-bölme + Vision malzeme okuma kanıtlandı.**
`izometri_format_tanimlari`'nda `paor_aveva_ana` (id `995b5514`, aktif, requires_ai, vision_only, kullanım 68, son 4 Haz) ve `paor_aveva_iso_view` (parse_disi) duruyor. Silinmemiş.

`parse_sonuc` örneği (`11D-PAOR-52600-102773-A.pdf`, durum=**iptal**):
- L3 **3 spool ayırdı** ([1][2][3]) — spool-bölme L3'te ZATEN var (OCR'a gerek yok, Vision yapıyor).
- Spool [1]: 11 kalemlik tam malzeme listesi (et_mm, kalite, kategori PIPES/FITTINGS/FLANGES, DIN 2448/2605), cap 60.3, güven 0.82.
- **Eşleştirme koptu:** `_eslesme.detay` → `"sebep": "dosya_adi_pipeline_yok"`, 3/3 atanmamış. pipeline_no parse_sonuc'ta var (`52600-102773`) ama `devre-inceleme.js:134` dosya adından pipeline istiyor, fallback yok → bağlanamıyor.

**Düzeltme (180/181 mimari hatası):** "PAOR = sadece Excel BOM, L3 değil" kararı **maliyet temelliydi, teknik tavan DEĞİL.** L3 fab çizimini (vektör/0-metin) Vision ile okur — metin parser'ı (L2) okuyamaz ama L3 okur. İki hat birbirini tamamlıyor: Excel ($0, malzeme+identity) + L3 (spool-bölme, paralı ~37sn/çizim).

## Açık durum
- Bugünkü PAOR akışı: 1 çizim = 1 spool, Excel'den malzeme, $0. Çizim-okuma/spool-bölme yok.
- "Eksik" durumu PAOR spool'larında **doğru** (malzeme okundu=Excel, çizim okunmadı). Terfi "Eksik"le mümkün.
