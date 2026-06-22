# Oturum 200 — Kalite Kontrol implementasyonu

ÖN OKUMA (ZORUNLU): docs/KALITE-KONTROL-TASARIM.md Bölüm 0 (şema doğrulama, sayaç deseni,
filtre deseni, constraint, is_kayitlari, MK-71/72.11). Mockup: docs/kalite-kontrol-mockup.html.

İŞ SIRASI (ağırdan kolaya):
1. Şema doğrula + gereken migration'lar (kk_davetler/kk_davet_spooller yeni alanlar,
   MK-98.2 dry-run → APPLY → arşiv). Spec Bölüm 2.2.
2. Sayaç: KK+yıl+sıra üretimi + tanımlamalar "Kod/Seri/Sayaçlar" entegrasyonu. Spec Bölüm 3.
3. kalite_kontrol.html yeniden yaz (eski bekleyen/onaylandi modeli sil). Üç sekme tek format.
   R-10: mockup zaten onaylı, doğrudan implementasyona geçilebilir.
4. Client-side PDF (vendor kontrol → jsPDF/pdfmake) + Storage arşiv. Spec Bölüm 7.
5. spool_detay + devre_detay entegrasyonu (davet no + tam tarihçe + foto galeri). Spec Bölüm 8.
6. A-002210 çift davet temizliği (tek UPDATE, MK-98.2).

DOKUNMA: devre_detay 'bekliyor' yazımı DOĞRU (bozma). 12/12 endpoint tavanı (yeni endpoint yok).
FAZ 2 (bu oturumda değil): personel sayfasında hata raporu (spec Bölüm 9).
