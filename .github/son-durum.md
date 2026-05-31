# Son Durum — 137. Oturum (31 Mayıs 2026)

> Malzeme hazırlık sistemi web tarafı uçtan uca oturdu: yıldız motoru localStorage'dan DB'ye taşındı
> (çok-cihaz + mobil görünür), malzeme kaynağı düzeltildi (`pipeline_malzemeleri` terk → `spool_malzemeleri`),
> modal miktar bazlı + devre bazlı toplama, toplu çekim export'u gerçek veriye bağlandı.
> GAP 1 (devre_wizard_v3 Adım 1 klasör ağacı) tamamlandı. Mobil 2-sekme görsel mockup hazır (referans).
> Migration 095 + 096. Yeni endpoint yok (12/12), MK-49.1 korundu.

## Yapılanlar (sıra)

### 1. GAP 1 — devre_wizard_v3 Adım 1 klasör ağacı (PUSH dahil)
- Düz tablo (`dosyaTablo`/`dosyaTbody`) → aç-kapa klasör ağacı (`tree1`, mevcut `fol`/`fToggle` altyapısı yeniden kullanıldı).
- KARAR-137.GAP1-B: kontroller fitem içinde — tip-select + hover sil korundu (işlev kaybı yok).
- KARAR-137.GAP1-2a: eski/hariç klasörler (`eskiRevMi`: old/eski/eski-rev/üretime verilen/kaplini/revN)
  soluk + "hariç" rozetiyle gösterilir — KOZMETİK, işleme akışı değişmez.
- Ölü `.dosya-tablo`/`.btn-sil` CSS temizlendi. node --check OK.

### 2. Migration 095 — malzeme hazırlık kolonları (DB + repo)
- `devreler.malzeme_kuyrukta BOOLEAN DEFAULT false` (yıldız kuyruk üyeliği)
- `pipeline_malzemeleri.teslim_adet NUMERIC DEFAULT 0` — **SONRADAN yanlış tablo çıktı, bkz. 096**

### 3. devreler.html — yıldız motoru localStorage → DB (PUSH)
- localStorage helper'ları (`getStarMap/setStarMap/...ares_devre_star`) silindi → `_kuyrukDurum` (DB tabanlı).
- Kuyruk üyeliği `devreler.malzeme_kuyrukta`'da; renk teslim/ihtiyaç toplamından TÜRETİLİR (`_kuyrukState`).
- yildizToggle/mlKaydet/mlSifirla → DB update. Render öncesi `await kuyrukDurumYukle()`.
- Sonuç: yıldız artık **her cihazda + mobilde** görünür (Cihat'ın "başka bilgisayarda görünmez mi" endişesi çözüldü).

### 4. KÖK BULGU — malzeme yanlış katmandan okunuyordu
- Modal `pipeline_malzemeleri`'nden okuyordu; o tablo **terk edilmiş/pratikte boş** (tüm tenant'ta 1 satır/1 devre).
- Gerçek malzeme `spool_malzemeleri`'nde: 1750 kalem. Bağ: `spool_malzemeleri.spool_id → spooller.devre_id`.

### 5. Migration 096 — teslim_adet doğru tabloda (DB + repo)
- `spool_malzemeleri.teslim_adet INTEGER DEFAULT 0`. (095'teki pipeline kolonu ölü kaldı, zararsız.)

### 6. devreler.html — malzeme kaynağı spool_malzemeleri + devre bazlı toplama (PUSH)
- mlKontrolAc/kuyrukDurumYukle/_kuyrukTekDevre → spool→devre zinciri, `spool_malzemeleri`.
- KARAR-137.MALZ-(a): toplama anahtarı `tip|dis_cap_mm|et_mm|malzeme|kalite` ("DN50 flanş ×5").
- Teslim **satır bazında** tutulur (35 satır), ekranda birleşik gösterilir; kısmi teslim (3/5) görünür.
- mlKaydet sadece **dirty** kalemleri yazar → mobilde girilen kısmi teslimleri EZMEZ. `hazir` yazmaz (spool_malzemeleri'nde o kolon yok).

### 7. devreler.html — toplu çekim export gerçek veriye bağlandı (PUSH)
- `_mlPdf`/`_mlExcel`'deki `var kalemler = []` stub'ı → `_malzemeAggregateBatch` (yıldızlı devrelerin malzemesi, batch).
- Popup gesture fix: PDF penceresi tıklama anında (await öncesi) açılır, veri gelince yazılır.

### 8. Mobil 2-sekme görsel mockup (referans, commit edilmedi)
- `malzeme_hazirlik_mockup.html` — Devreler + Toplu Çekim sekmeleri, −/+ teslim sayaçları, eksik işareti,
  üretim oran çubukları. AresPipe token'larıyla. React'e taşınırken referans.

## Borç temizliği
- `mobile/dist/` zaten temiz çıktı: `git ls-files` boş + `.gitignore:27` `mobile/dist/` var. Borç düşürüldü.

## CI / commit
- f.. wizard GAP1 · 095 sql · yıldız motoru DB · 096 sql · malzeme kaynağı spool · export gerçek veri.
- Hepsi function 12/12, migration 095/096, MK-49.1 korundu. Doc commit'leri [skip ci].

## "Malzeme hazırlık" durumu
[x] Yıldız DB kuyruk (çok-cihaz/mobil)  [x] Kaynak spool_malzemeleri + devre toplama  [x] Miktar bazlı, satır bazlı
[x] Modal listeliyor + kısmi görünür  [x] Toplu çekim export gerçek veri
[ ] Mobil React inşa (mockup hazır)  [ ] Eksik → Uyarılar entegrasyonu

## 138'e Açık Borç (öncelik)
1. **Eksik → Uyarılar entegrasyonu:** Personel/yönetici "eksik" işaretleyince Uyarılar sayfasına düşsün. Şu an UI'da var, akış yok.
2. **Mobil malzeme hazırlık React inşası:** mockup'a göre 2 sekme. `spool_malzemeleri.teslim_adet` + 095/096 ile bağlanır.
3. **Wizard tamam blokajı (GAP 2):** düzelt-yazma + çapa — test dosyasına bağlı (bkz. eski sonraki-oturum notu).
4. Test dosyaları bekleniyor (çoklu-gemi K2, M130).
5. 129/130 terfi-sonrası imalat-izo görünmeme · 117 yukleyen_id · pipeline doğrulama · fitting kütüphane.
