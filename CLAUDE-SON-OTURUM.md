# CLAUDE — Oturum 208 Log

## Özet
Sıra 3 (MAnasayfa 4 dallı router) canlıya alındı + kapsamlı marka/logo entegrasyonu (PWA ikon, manifest,
giriş + topbar logoları, animasyon). İş modeli MK-208.1 ile kilitlendi. 7 kod push, hepsi CI yeşil.

## Akış
1. Açılış ritüeli — git temiz, api/*.js=12 (tavan), handoff + MOBIL-STRATEJI okundu.
2. **Sıra 2 (yetki.js):** DATA teşhisi (MK-158.1) — customers şeması: kullanıcı bağı YOK (kullanici_id yok,
   sadece iletisim_mail). kullanicilar'da customer kolonu YOK. 2 customer / 8 kullanıcı, ilişki kurulmamış.
   → `musteriMi(k) = k?.rol==='musteri'` (rol-temelli, yoneticiMi kalıbı, MK-126.8). Bugün hiç tetiklenmez.
3. **Sıra 3 (MAnasayfa):** 4 dallı router. App.jsx MIslemlerSayfasi deseni okundu (kullanicilar select aynı).
   useEffect kullanıcı + (yönetici/müşteri değilse) gruplar çeker. MMusteriPlaceholder iç component.
4. **İş modeli turu (uzun):** Cihat 3 katmanı netleştirdi — ücretli kurumsal (teklif-usulü off-app) /
   ücretsiz müşteri izleme (web+mobil) / halka açık uygulama (mobil-kayıt). Platform-bağımsız kimlik.
   Market engelleri araştırıldı (web_search) → Safari PWA dağıtımında PARK. → MK-208.1.
5. **Marka entegrasyonu:** assets/marka zaten web'de dolu. mobile/public'e ikonlar+manifest. Giriş ekranı
   inline SVG (tema-değişkenli) + tarama animasyonu (web kalıbı). Topbar mark (4 ekran, ortak MMarkLogo).

## Kararlar
- **MK-208.1** — 3 erişim katmanı + platform-bağımsız kimlik + market engelleri (Safari PWA park).

## Önemli yakalamalar
- customers↔kullanicilar bağı YOK → musteriMi rol-temelli, iletisim_mail eşleştirmesi YAPILMADI (kırılgan).
- Topbar çift yapı: ortak MTopBar + her ekranın kendi inline topbar'ı. Gerçekte render olan ekranların kendisi.
- Giriş logosu var(--tx/--ac/--bg) → tek SVG her temada çalışır (web zaten böyle, iki dosya yerine inline).
- `<img src=svg>` içindeki animasyon JS'ten tetiklenemez → inline + dangerouslySetInnerHTML zorunlu.
- **Topbar mark animasyonu iOS Safari'de ÇÖZÜLEMEDİ:** SMIL beginElement + CSS keyframes ikisi de iOS'ta
  görünmedi/takıldı. Giriş ekranı animasyonu ÇALIŞIYOR (aynı yöntem) — fark muhtemelen mount timing / cache.
  209'a debt. Statiğe DÖNÜLMEDİ (web statik kullanmıyor).

## Teslim edilenler
- 7 push: 972d47c (router), 9a62f40 (ikon+manifest), a60410d (ekran logo), 23da069 (giriş anim),
  2263a7e (topbar anim), 1a129b8 (çizgi opacity fix denemesi), + CSS keyframes denemesi.
- MK-208.1 KARARLAR.md. Kapanış üçlüsü.

## Disiplin uygulananlar
- MK-158.1 (DATA→UI→kod: customers teşhisi karar öncesi). MK-126.8 (yetki.js/App.jsx/MUygulamalar okundu).
- MK-129.3 (api=12 korundu). MK-109.1 (MMarkLogo tek çekirdek). MK-51.1 (tüm kopyalar MD5).
- Python patch + .bak + anchor-validation (heredoc kazaları Ctrl+C ile kurtarıldı, dosyalar temiz çıktı).
- Kod commit [skip ci] YOK; kapanış doc commit [skip ci] VAR.
