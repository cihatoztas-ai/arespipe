# Son Durum — 147. Oturum (3 Haziran 2026)

> **C4 UÇTAN UCA KAPANDI** — güvensiz/doğrulanmadı BOM istasyon girişinde (kesim/büküm/markalama) görünür; kalem çizimden düzeltilmeden doğru ölçü havuza gitmez. + flanş et gizleme + kalite kategori süzme.
> Sıfır yeni endpoint (12/12). Sıfır yeni migration. Sadece frontend + i18n.

## HEAD
- `95c356d` feat(147): kalite datalist malzeme kategorisine gore suzulur (spool_detay 2 modal)
- `4c743dc` fix(147): duzelt modali tipi siniflandiricidan — flansta et gizli (FK yoksa)
- `49c5015` fix(147): cizimden duzelt modali z-index (istasyon modalinin ustunde)
- `4a9207c` feat(147): istasyon modallari — tip filtresi + guvensiz BOM gorunur + cizimden duzelt (C4)
- Üstüne kapanışta: i18n commit (3 json) + handoff doc commit ([skip ci]).

## Yapılanlar (hepsi spool_detay.html)
### 1. _kalemSinif + güven yardımcıları
- `_kalemSinif(m)`: boru/flans/bilezik/fitting. Önce FK (boru/flansh olculer_id), sonra tanım kelimesi, en son tip_raw.
- `_spoolGuven()`: guvensiz / dogrulanmadi (k2Flag & karar yok) / null. `_kalemUyarili(m)` = güven var & `guncelleme` boş.
- `_guvenSeritHTML`, `_kalemOnek/_kalemOnekSon` (⚑/⚠ + metin), `_duzeltBtnHTML`, `_acikModalTazele`.
### 2. malzemeOpts(secili, izinli)
- Tip filtresi + güvensiz öneki (kalem-bazlı, guncelleme ile). İzinli yoksa eski davranış (geriye uyumlu).
### 3. Üç modal
- kesimModalAc/bukumModalAc → `['boru']`; markModalAc → `['flans','bilezik']`. Her birine uyarı şeridi divi + açılışta `_guvenSeritHTML`. kmMalzInfo/bmMalzInfo'ya düzelt düğmesi + kırmızı kenar; mmMalzInfo (yeni).
### 4. malzDuzenleAc
- FK yoksa tip sınıflandırıcıdan (flanş → et gizli). z-index 2500 (istasyon modalinin üstünde).
### 5. malzDuzenleKaydet
- Sonuna `_acikModalTazele()` (düzeltme sonrası açık istasyon modalı tazelenir, ⚑ kalkar).
### 6. Kalite datalist (yeni özellik)
- `kaliteleriDoldur`: `kategori_kod` çek + `KALITE_HAVUZ`. `kaliteDatalistCiz(kat)`: kategori master + geçmiş. me_malz/ed_malz onchange + açılışta süzme.

## i18n
6 anahtar tr/en/ar (1911→1917, sıra korundu). sp_bom_uyari_guvensiz/dogrulanmadi, sp_bom_rozet_guvensiz/dogrulanmadi, sp_bu_tip_yok, sp_cizimden_duzelt.

## MÜHÜR
- MK-147.1: tip filtresi + güven spool-seviyesi; sınıf FK→tanım→tip_raw; guncelleme dolu kalem uyarısız.
- MK-147.2: <option> rengi Safari'de çalışmaz → metin öneki + şerit + kutu kenarı.
- MK-147.3: kalite datalist kategoriye göre; geçmiş hep kalır; diğer sayfalar ileride ortak helper.

## CANLI DOĞRULAMA (kapanışta — MK-132.1)
NB1137 güvensiz spool → kesim (boru+⚑) → çizimden düzelt (modal üstte) → flanş (et yok) → malzeme paslanmaz (kalite süzülür) → kaydet (⚑ kalkar).

## İki UI kusuru (oturum içinde, ekran görüntüsünden yakalandı, düzeltildi)
- Düzelt modali istasyon modalinin arkasında açılıyordu → z-index 2500.
- Flanşta et alanı çıkıyordu (tip yanlış 'fitting') → FK yoksa tip sınıflandırıcıdan.

## NEREDEYIZ
C4 kapandı. 148: spool_detay kütüphane-tıklama bug (A, 147'de atlandı) + kalite datalist diğer sayfalar + wizard kritik yol (yukleyen_id / pipeline_no E120- / folder tree).

## Hatalarım (kayıt)
- i18n'i ilk denemede `sort_keys=True` ile yazacaktım → dosya alfabetik değildi, tüm dosyayı yeniden sıralayıp dev diff üretecekti. Yakalayıp orijinalden başlayıp sırayı koruyarak 6 anahtarı sona ekledim. Ders: JSON yazmadan önce mevcut sıra/biçim teyit edilir.
