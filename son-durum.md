# son-durum.md — Oturum 148 (2026-06-03)

## Bu oturumda ne yapıldı
Format Tanıtma / Çapa ekranı **prototipten üretime** geçti ve uçtan uca çalışır halde.

**Akış**: tanınmayan izometri PDF formatı → operatör alanları kabaca işaretler → deterministik `cozumle()` değer + boşluk-dayanıklı regex üretir → `izometri_format_tanimlari`'na insert → aynı formatın sonraki PDF'leri L2'den ($0, AI'sız) okunur.

## Üretimde olanlar
- **format_tanit.html** (repo kökü): ARES bootstrap (ares-store/lang/normalize/asme/olcu/kabuk.js) + `tenant_features` flag `format_tanit` (oturum-bekleme deseni devre_wizard_v3 ile birebir) + `/vendor/pdfjs-1.10.100/` + gerçek Supabase insert. Tema-duyarlı, kaydet sonrası "Kapat".
- **vendor/pdfjs-1.10.100/** {pdf.js, pdf.worker.js} — node_modules/pdf-parse'tan kopyalandı (Vercel node_modules servis etmez).
- Migration A: `egitim_kaynagi` CHECK → +`'cizim_capa'` (uygulandı).
- feature_flags katalog: `format_tanit` (kod/ad/aciklama/varsayilan). tenant_features: Demo Atölye (00000000-...-0001) aktif.

## Doğrulanan gerçekler (ölçüldü)
- pdfjs v1.10.100 tarayıcıda = sunucu (pdf-parse) ile birebir TEMİZ metin. Eski PDF.js v3 garbliyordu (atıldı). glyph onarımı bu ailede gereksiz (durum:temiz); band-B borcu ayrı PDF'lerle (NB1137).
- `cozumle()` 9 alan + pipeline iki formatta (M100/ALS, M110/SP13) node ile doğrulandı. pipeline deseni çok-segmentli koda genellendi: `(-?[A-Z]+\d+(?:-[A-Z0-9]+)+)`.
- **test-l2-format.mjs**: kaydedilen kural GERÇEK l2-parser'da → `parser_seviye: l2`, 7/8 (8.=pipeline, çapraz-format olduğu için beklenen), AI yok, $0. **Döngü kapandı.**

## Açık borçlar (format_tanit)
- INSERT→UPDATE (fingerprint'e göre; şu an tekrar tanıtınca çift satır, elle siliniyor).
- bbox → PDF-point normalize (render-px, scale-bağlı; konum_ipucu opsiyonel).
- Malzeme tablosu satır desenleri = toplu AI (stub).
- ares-layout nav entegrasyonu (kendi çerçevesi).
- Test sırasında oluşan çift/bozuk `egitim_kaynagi='cizim_capa'` satırlarını temizle.

## Değişmeyen kurallar (korundu)
- izometri-oku.js DOKUNULMADI (MK-49.1). parser_kural→L2, prompt_template→L3 (s.589/721), fingerprint→tanıma; üçü hazır okuma noktası. requires_ai=false → L2 (s.590 doğrulandı).
- Yeni endpoint YOK (MK-129.3, 12/12). Doğrudan Supabase.
