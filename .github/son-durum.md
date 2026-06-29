# AresPipe — Son Durum (Oturum 208 kapanışı)

## Bu oturum: 4 DALLI ROUTER + MARKA ENTEGRASYONU
Sıra 3 (MAnasayfa 4 dallı router) canlıya çıktı. Ardından logo/marka mobile'a entegre edildi
(PWA ikonları, manifest, giriş + topbar logoları). İş modeli MK-208.1 olarak kilitlendi.

## Yapılanlar (canlı, 7 push)
- **Router (972d47c):** MAnasayfa 4 dallı — yoneticiMi → dashboard, musteriMi → MMusteri placeholder,
  gruplar.length>0 → MIslemler, else → MUygulamalar anaSayfaModu. `yetki.js`'e `musteriMi` (rol-temelli,
  yoneticiMi kalıbı). DATA teşhisi: customers↔kullanicilar bağı DB'de YOK → musteriMi rol-temelli,
  bugün hiç tetiklenmez (canlıda rol='musteri' yok), §7-3'e park. `m_musteri_yakinda` dil anahtarı (3 dil).
- **PWA ikon+manifest (9a62f40):** `mobile/public`'e icon-180/192/512/1024 + favicon. manifest.webmanifest
  oluşturuldu (standalone, AresPipe). index.html head: apple-touch-icon, manifest, theme-color, title=AresPipe, lang=tr.
- **Ekran içi logo (a60410d):** topbar "AP" text → mark SVG (4 ekran). MGiris büyük "AP" → yatay logo.
- **Giriş animasyonu (23da069):** MGiris inline SVG (tema-değişkenli var(--tx/--ac/--bg)) + tarama
  animasyonu (web kalıbı: useRef + beginElement, açılışta bir kez). ÇALIŞIYOR.
- **Topbar mark animasyonu (2263a7e → 1a129b8):** ortak MMarkLogo component (MK-109.1), mark-anim-bk.svg.
  ⚠️ iOS Safari'de tarama çizgisi GÖRÜNMÜYOR/takılıyor — SMIL beginElement + CSS keyframes denendi, ikisi de
  iOS'ta tutmadı. KOD DURUYOR (mark statik görünüyor, animasyon oynamıyor) — 209 debt.

## Kesinleşen karar
- **MK-208.1** — Üç erişim katmanı (ücretli kurumsal SaaS teklif-usulü off-app / ücretsiz müşteri izleme /
  halka açık uygulama mobil-kayıt). Platform-bağımsız kimlik. Market engelleri = Safari PWA dağıtımında PARK.
  KARARLAR.md + (MOBIL-STRATEJI'ye işlenecek — 209).

## Açık debt (209)
- **Topbar mark animasyonu:** web `beginElement()` ile tetikliyor; mobilde iOS Safari uyumlu hale getir.
  Web giris.html satır 230 (inline SVG) + 383 (tara() fonksiyonu) referans. Kod hazır (MMarkLogo + mark-anim-bk.svg),
  iOS tetikleme çözülmedi. Statiğe DÖNÜLMEDİ — web statik kullanmıyor, animasyon hedefi korunuyor.
- MK-208.1 MOBIL-STRATEJI'ye işlenmedi (sadece KARARLAR'da).

## CI / push
- HEAD: 1a129b8 (+ varsa bot ci commit'leri). api/*.js = 12 (tavan korundu, endpoint eklenmedi).
- Kod commit'leri [skip ci] YOK; bu kapanış doc commit'i [skip ci] VAR.
- Canlı: router + ikonlar + giriş logosu/animasyonu ✅. Topbar mark görünüyor, animasyon iOS'ta ⚠️.

## Sonraki oturum (209) — detay CLAUDE-SONRAKI-OTURUM.md
- Topbar mark animasyonu iOS fix (web kalıbı) VEYA kabul edilebilir bırak.
- Sıra 4: MIslemler "Uygulamalar" butonu + 🔒 kalkar.
- Sıra 7: MMusteri gerçek ekran (mockup-first, customers RLS).
- Sıra 8: Kayıt/davet akışı (EN BÜYÜK) — §7 kararları kilitli.
