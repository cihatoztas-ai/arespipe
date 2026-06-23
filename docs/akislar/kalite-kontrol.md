# Akış: Kalite Kontrol
**Durum:** 🟢 dolu · **Sayfalar:** kalite_kontrol.html (ana) · devre_detay.html (giriş) · spool_detay.html (tarihçe) · sevkiyat (çıkış) · **Yazma yetkisi:** yalnız web (mobil salt-izleme)

## Amaç
İmalatı uygun görülen spool'ları kontrole hazır havuzda toplar, tersaneyi davet eder (KK26 numaralı paket), kontrol sonuçlarını kaydeder (onay/ret), onaylananları sevkiyata uygun işaretler, ret'lileri tamir için havuza döndürür, paketi arşivler.

## Yaşam döngüsü
```
[imalat ...] --devre_detay "KK gönder"--> aktif_basamak=on_kontrol  (DAVET BEKLEYENLER havuzu)
   --kalite_kontrol "Davetiye Oluştur" (KK26, tersane-tek)--> aktif_basamak=kk · davet durum=bekliyor (AÇIK DAVET)
   --"Sonuç Gir" (gecti | tamir)--> junction.sonuc yazılır
   --"Daveti Kapat" (MK-126)--> gecti→aktif_basamak=sevkiyat · tamir→on_kontrol(geri) · davet durum=tamamlandi (ARŞİV)
```
Tamir döngüsü: ret→havuza→tamir→tekrar davet (YENİ KK26 no). Junction geçmişi korur.

## Adım adım kullanım
1. İmalatçı spool'u devre_detay'dan "KK gönder" → ön kontrol havuzuna iter (davet AÇMAZ, MK-201.1).
2. Yetkili `kalite_kontrol > Davet Bekleyenler`'de grubu seçer → "Davetiye Oluştur" → `KK26-006` (tek tersane guard).
3. Paket `Açık Davetiyeler`'e düşer; tersaneye PDF/belge iletilir.
4. Kontrol sonrası "Sonuç Gir": sorunlu spool tikini kaldır (ret=`tamir` + personel/foto/not), gerisi onay (`gecti`).
5. "Daveti Kapat": onaylı→sevkiyat uygun, ret→havuza geri.
6. Paket `Arşiv`'e; belgeler korunur.

## Bu akışın sayfaları
- **kalite_kontrol.html** (ana) — 3 sekme: Davet Bekleyenler (`on_kontrol`) / Açık Davetiyeler (`bekliyor`) / Arşiv (`tamamlandi`). Davetiye oluştur, sonuç gir, daveti kapat, belgeler popup (tasarım), müşteri PDF (tasarım). 581 satır, 199 rewrite, canlı.
- **devre_detay.html** (giriş) — "KK gönder" yalnız `aktif_basamak='on_kontrol'` set eder (MK-201.1). Spool'un KK durumu burada da görünür (uyarlanacak).
- **spool_detay.html** (tarihçe) — "KK26-xxx ile davette" + tam KK tarihçesi (ret notları dahil). Spool-kapsamlı KK foto'su galeride. *(kodlanacak)*
- **sevkiyat** (çıkış) — onaylı spool sevk havuzuna düşer. *(akış doğrulanacak)*

## Bağlı tablolar
- `spooller` — okur: havuz `aktif_basamak='on_kontrol'`. Yazar: `on_kontrol→kk`, kapanışta `→sevkiyat`/`→on_kontrol`. ET = `et_kalinligi_mm`. (basamakta CHECK yok)
- `kk_davetler` — durum∈{bekliyor,tamamlandi}, davet_no=KK26-xxx, tersane_id, kapanis_ts, pdf_yolu, olusturan_id.
- `kk_davet_spooller` (junction) — sonuc∈{gecti,hatali,tamir,bekliyor}, not_, personel_id, foto_yolu, sonuc_ts. (migration 110). FK `davet_id` CASCADE.
- `sayac_tanimlari` tip='kk' → KK26, RPC `sonraki_no(p_tenant_id,p_tip)`. Prod: KK/true/3/son_no=5.
- Zincir: `spooller→devreler→projeler→tersaneler` (tersane-tek guard + başlık).

## Diğer akışlarla bağ
- **Gelir:** İmalat & QR akışından (spool ön kontrole geçince).
- **Devreder:** Sevkiyat akışına (onaylı spool sevk havuzuna).
- **Geri besler:** Tamir döngüsü → spool havuza döner → tekrar imalat/kontrol.

## İş kuralları
- MK-199.3 iki-katman: havuz (`on_kontrol`) ≠ davet (`kk`). Davet TEK kapı: kalite_kontrol + KK26.
- MK-201.1: devre_detay "KK gönder" davet yazmaz, yalnız havuza iter.
- MK-200.1: junction sonuc {gecti,hatali,tamir,bekliyor}; UI onay→gecti, ret→tamir.
- MK-200.2: hata notu `not_` kolonunda.
- MK-126: otomatik ilerleme yok; daveti kapat butonla.
- Tersane-tek guard zorunlu.

## Açık borç / bilinen sorun
- 🔴 spool_detay'da `aktif_basamak='kk'` spool sevkte görünüyor (yanlış basamak).
- 🔴 Sevk havuzu akışı doğrula + sevkiyat sayfası "KK onaylı" listesi.
- 🟡 Belgeler popup · ret foto Storage · QR personel (`is_kayitlari`) · müşteri PDF (pdfmake) — tasarlandı, kodlanacak.
- 🟡 spool_detay/devre_detay KK entegrasyonu.

## Görsel
`docs/kalite-kontrol-mockup.html` (v3 — üç sekme gruplu satır, iki-kademe accordion, belgeler popup, müşteri PDF A4).
