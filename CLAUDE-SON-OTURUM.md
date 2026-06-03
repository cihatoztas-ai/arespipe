# CLAUDE-SON-OTURUM.md — Oturum 148 özeti

## Tek cümle
Format Tanıtma / Çapa ekranı üretime alındı; çapayla yazılan kural gerçek l2-parser'da $0/AI'sız okuyor — uçtan uca kanıtlandı.

## Kararlar (kilitli)
- Çıktı = `izometri_format_tanimlari` satırı (fingerprint + parser_kural + prompt_template). Doğrudan Supabase, yeni endpoint yok, izometri-oku dokunulmadı.
- Metin motoru = pdf-parse'ın pdfjs v1.10.100'ü; tarayıcıda da sunucuyla birebir temiz → ekran tamamen istemci-tarafı kalabiliyor. Üretimde /vendor/'a kopyalandı.
- İlk-pas AI değil **deterministik cozumle()**; AI yalnız malzeme tablosu + tanıyamadıkları (sona, toplu, onayla). %5-10 AI vizyonuna uygun.
- Değer düzeltme (Paslanmaz→Asit): kaynağı sessizce ezme; tekil+işaretli (taslak_duzeltmeleri). Format-geneli eşleme yalnız "hep böyle" kesinse.

## Önemli teknik notlar
- pdfjs v1.10.100 eski API: getViewport pozisyonel, getDocument thenable, PDFJS global, Util.transform var. format_tanit'te _vp/_lib/_util yardımcıları iki imzaya karşı korumalı.
- renderPage serileştirildi (aynı-canvas çakışması fix).
- CSS paleti :root + [data-theme^="light"] (tema-duyarlı).
- cozumle pipeline deseni: `(-?[A-Z]+\d+(?:-[A-Z0-9]+)+)` — ALS/SP##/BS## hepsini tutar.

## Dosyalar (hepsi repo kökünde / docs'ta)
- format_tanit.html (üretim ekranı)
- vendor/pdfjs-1.10.100/{pdf.js,pdf.worker.js}
- test-l2-format.mjs (l2 doğrulama koşumu), kural.json (örnek)
- docs/FORMAT-TANITMA-URETIM-SPEC.md, docs/FORMAT-TANITMA-148-ILERLEME.md
- (prototipler: capa-prototip-v1..v4.html, pdfjs-prob.html — referans, silinebilir)
