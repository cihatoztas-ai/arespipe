# CLAUDE — Oturum 213 Log

## Özet
Sıra 11 (mobil layout standardizasyonu) ana gövdesi tamamlandı. Dağınık, her ekranın
kendi kopyaladığı iskelet tek `MLayout`'a toplandı; yüzen WhatsApp-dili 4-slot alt bar
baştan yazılıp kök ekranlara yayıldı; spool detaydaki ölü gri alan giderildi; detay
ekranlarına "gidecek yer varsa göster" kuralıyla standart geri tuşu getirildi. Oturum
uzun ve çok push'lu ilerledi; her adım ayrı deploy + canlı test ile doğrulandı. Cihat
tasarım kararlarını yönlendirdi (bar'dan QR/İş Başlat çıkarma, evrensel bar, avatar
Menü, spool detayda bar yok). Kapanışta estetik cila sonraki oturuma bırakıldı.

## Akış (özet)
1. **Ritüel** — HEAD 097d8a8 (212 kapanış), tree temiz, api=12. 3 görselle 212'de
   tespit edilen tutarsızlık teyit edildi: İş Başlat bar VAR, dashboard YOK, spool
   detay bar YOK + ölü alan.
2. **MLayout kuruldu** + en basit ekran MUygulamalar ile kanıtlandı (topbar slot +
   flex:1 scroll + minHeight:0). Kanıt canlıda temiz.
3. **MAnasayfaYonetici** MLayout'a (görünmez iskelet değişimi; Cihat "ne değişti?"
   diye sordu → doğru cevap: dashboard zaten sorunsuzdu, iskelet birleşti = regresyon
   yok). Bu noktada plan görünür işe çevrildi.
4. **Spool detay ölü alan fix** (denetim modu): `s.kapsayici` yüksekliği moda bağlandı
   → denetim 100dvh. Python anchor patch (container'da test, idempotency, esbuild).
   İLK GÖRÜNÜR KAZANÇ — Cihat "oldu galiba" dedi.
5. **Yüzen bar tasarımı** — mockup (dark+light, operatör/yönetici). Cihat kararları:
   QR FAB kalksın (İş Başlat akışında zaten var), İş Başlat da bardan çıksın (role
   özel), evrensel bar olsun, avatar=Menü. Sonuç: 4 slot (Ana Sayfa·Devreler·
   Uygulamalar·Menü).
6. **MBottomNav baştan yazıldı** (yüzen, blur, color-mix) + MLayout altBar + kök
   ekranlara yayıldı (dashboard, işlemler, uygulamalar, devreler).
7. **Geri tuşu kuralı** netleşti (Cihat): "her yerde aynı yerde, gidecek yer yoksa
   gösterme." MLayout'a `geri` slotu eklendi (tek kaynak).
8. **Detay ekranlar:** MDevreDetay (nötr bar + geri), MProfil (geri, bar yok).
9. **Son koordineli parça:** IbSpoolDetay (her iki mod tam ekran + ustBant geri, bar
   yok) + MIsBaslat (MLayout, eski MTopBar/MBottomNav/drawer temizlendi). Push f314465.
10. **Kapanış** — Cihat estetiği beğenmedi ama fonksiyonel yeterli buldu; push edip
    kapatma kararı. Handoff dörtlüsü hazırlandı.

## Kararlar / öğrenmeler
- **MLayout = tek kaynak.** Ekranı MLayout'a bağlamak ekran-başına tek seferlik
  "kablolama" işi (eski ekranlar MLayout yokken yazıldığı için her biri kendi iskeletini
  kopyalamış). Kablolama bitince bar/topbar/geri tek dosyadan yönetiliyor — Cihat'ın
  "tek yerden değiştir, hepsi güncellensin" beklentisi tam bu.
- **İyi ürün gidip gelerek çıkıyor.** Cihat "her yerde bar/geri olsun" diye itti, Claude
  "şurada çakışır / ölü sekme olur" diye frenledi; ortada doğru şey kaldı (bar kök
  ekranlarda, geri detaylarda, spool detayda ikisi de yok çünkü footer dolu).
- **Ölü alan = yükseklik matematiği**, footer eksikliği değil. `calc(100dvh-56-80)`
  operatör chrome'una göre sabitlenmişti; denetimde/tam-ekranda yanlıştı. Flex/100dvh
  çözdü.
- **QR bara girmez** — akış içinde zaten var (kart→QR + MIslemler QR butonu). Bardan
  çıkarmak QR erişimini bozmadı (kod teyitli).
- **color-mix şeffaflık** iOS 16.2+; modern cihazda çalışır, degrade riski kabul edildi.
- **MDevreler/MDevreDetay `icerikKaydir=false`** — sabit çubuk + kayan liste modeli
  MLayout'un tek-scroll modeline sığmaz; MLayout'a bu seçenek eklendi.
- **IbSpoolDetay zengin header istisnası** — geri MLayout slot'u yerine ustBant içinde
  (iki header üst üste binmesin). Aynı görünüm, farklı yer. Estetik cilada gözden
  geçirilecek.

## Teslim edilenler (deploy'lu)
- MLayout (yeni), MBottomNav (yeniden), + MUygulamalar, MAnasayfaYonetici, MIslemler,
  MDevreler, MDevreDetay, MProfil, IbSpoolDetay, MIsBaslat (MLayout geçişleri).
- Spool detay ölü alan fix (anchor patch, ayrı commit f33ab35).
- MQRTara: dokunulmadı (bilinçli).
- Yeni endpoint yok; api/*.js=12.

## Disiplin uygulananlar
- MK-126.8 (yazmadan önce dosya okundu — MDevreler/MDevreDetay/IbSpoolDetay/MIsBaslat
  tam kod alınıp container'da düzenlendi, tahminle dokunulmadı).
- Her dosya container'da esbuild `transformSync` (JSX) ile doğrulandı; MD5 ile teslim.
- Python anchor patch (spool ölü alan): .bak + ABORT-on-mismatch + MARKER idempotency +
  esbuild doğrulama, container'da test edildi.
- Kod commit [skip ci] YOK; kapanış doc [skip ci] VAR. Push öncesi pull --rebase.
- R-10 (mockup-first) yüzen bar için uygulandı; iskelet geçişleri için "navigasyon
  sözleşmesi" mockup yerine geçti (yeni ekran değil, iskelet birleştirme).
