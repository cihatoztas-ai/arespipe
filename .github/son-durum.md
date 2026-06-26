# AresPipe — Son Durum (Oturum 206 kapanışı)

## Bu oturum: TASARIM (kod yazılmadı)
Mobil ana sayfa yeniden yapılandırma tasarım turu. Yaşayan strateji belgesi oluşturuldu:
**`docs/MOBIL-STRATEJI.md`** — mobil iş bitene kadar taşınacak tek doküman. Mockup: `docs/anasayfa-mockup.html`.

## Kesinleşen kararlar
- **Mimari = native React.** Web-first kapatıldı (vanilla'ya gidip dönme tekrarı yok). ARCHITECTURE Bölüm 9 ile uyumlu.
- **4 kullanıcı tipi:** yönetici / spool kullanıcısı / uygulama kullanıcısı / müşteri. Router 4 dallı.
- **Uygulamalar** herkese açık (yetki gerektirmez), sabit liste başlangıç. Öğeler: Birim Çevirici, Kütüphane,
  Kesim Optimizasyonu, Parça Tanıma (flanş foto + soru → standart bilgi; Vision AI, ücretli aday).
  Uygulama kullanıcısının ana sayfası = doğrudan uygulamalar (ara buton yok).
- **QR = erişim aracı**, işlem değil. Payload `A-0504:UUID`, cross-tenant uyarı (devralındı).
- **Spool detay çatalı çözümü:** tek sayfa (IbSpoolDetay temel) + yöneticiye koşullu "Denetim" sekmesi
  (KK/sevkiyat/belge/log); MSpoolDetay emekli. Mevcut işlem akışına dokunmadan, toplamsal.
- Eski "yetki tanımlanmamış 🔒" hata ekranı kalkar.

## Açık (sonraki oturum — detay `docs/MOBIL-STRATEJI.md` §7)
- **Kayıt/davet akışı (EN BÜYÜK):** spool kullanıcısı A (davet kodu) / B (yönetici ekler) / ikisi;
  uygulama kullanıcısı DB modeli; müşteri akışı; tek hesap çoklu rol.
- Yönetici dashboard içeriği (Cihat: netleşmedi).

## Geçmiş kurtarma notu
Önceki mobil kararlar (CLAUDE-MOBILE.md R-08/09/10, tenant prefix/QR, is_durumu, foto_url) strateji belgesinin
§A'sında toplandı — kaybolmadı. CLAUDE-MOBILE.md tam tasarım sistemi/checklist için hâlâ ana kaynak.

## 205 devir (teyit edildi)
- 205 CI yeşil (`ci-son-rapor.json` bot commit'i HEAD-1'de).
- Sevkiyat Listesi push edilmiş (`d43e451`). Liste rötuşu hâlâ açık (parked).

## CI / push
- 206 commit'i doc, `[skip ci]` VAR. Kod değişmedi → CI çalışmaz.
