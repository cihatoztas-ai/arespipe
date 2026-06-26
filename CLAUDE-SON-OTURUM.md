# CLAUDE — Oturum 206 Log

## Özet
Mobil ana sayfa yeniden yapılandırma **TASARIM** oturumu — kod yazılmadı. Mobil envanteri çıkarıldı
(hafıza bayatmış: mobil çok daha olgun çıktı), ana sayfa akışı 4 kullanıcı tipi üzerine yeniden kurgulandı,
yaşayan strateji belgesi `docs/MOBIL-STRATEJI.md` üretildi. Mockup: `docs/anasayfa-mockup.html`.

## Kararlar (bu oturum)
- **MK-206.1** — Mimari **native React** kesin; web-first kapatıldı (vanilla'ya dönme tecrübesi var, tekrarlanmaz). ARCHITECTURE Bölüm 9 ile uyumlu; o bölüm de bu yönde, çelişki yok.
- **MK-206.2** — 4 kullanıcı tipi (yönetici/spool/uygulama/müşteri), 4 dallı router.
- **MK-206.3** — Uygulamalar herkese açık, yetki gerektirmez, sabit liste başlangıç → tetik gelince DB.
- **MK-206.4** — QR işlem değil, spool'a erişim aracı. İşlem listesinde kalem olmaz.
- **MK-206.5** — Spool detay çatalı: native toplamsal birleştirme (IbSpoolDetay temel + yöneticiye koşullu "Denetim" sekmesi), MSpoolDetay emekli. Eritme YOK → regresyon riski düşük.

## Envanter bulguları
- Mobil 9 ekran + olgun `isbaslat/` component seti (IbSpoolDetay 2370, IbQRTara 1028). Hafızadaki "oturum 2-3 iskeleti" notu çöptü.
- Çatal: `MSpoolDetay` (577 salt-okunur denetim) vs `IbSpoolDetay` (2370 operatör işlem). Yönetici işlemdeki spool'u devreler yolundan göremiyordu → çatal çözümüyle kapanıyor.
- Önceki mobil kararlar CLAUDE-MOBILE.md + ARCHITECTURE Bölüm 9 + `docs/sessions/archive` içinde; belgeye (§A) kurtarıldı.

## Teslim edilenler
- `docs/MOBIL-STRATEJI.md` (yaşayan belge, 203 satır, 11 bölüm)
- `docs/anasayfa-mockup.html` (3 yetki varyantı, dark tema)
- handoff üçlüsü (bu dosya + son-durum.md + CLAUDE-SONRAKI-OTURUM.md)

## Disiplin uygulananlar
- MK-158.1 (önce veri/envanter), MK-126.8 (önce oku — iki büyük dosyayı incelemeden mimari karar yok).
- Geçmiş tartışmaların kaybını fark edip conversation/project knowledge'dan kurtardık (Cihat uyarısı).
- Kod yok → node --check/md5 yok. Doc commit `[skip ci]` VAR.
