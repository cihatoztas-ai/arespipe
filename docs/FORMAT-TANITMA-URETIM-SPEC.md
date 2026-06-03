# Format Tanıtma / Çapa — Üretim Spec (oturum 148 devir)

> Prototip (capa-prototip-v4.html) ile doğrulandı. Bu doküman koda geçiş için tek kaynak.

## Amaç
Tanınmayan izometri PDF formatı (L3'e düşen) geldiğinde: operatör alanları **kabaca** işaretler → deterministik `cozumle()` değer + regex üretir → `izometri_format_tanimlari`'na kayıt → aynı formatın sonraki tüm PDF'leri L2'den okunur ($0). Hedef: AI payı %100 → %5-10.

## Mimari (KİLİTLİ — prototiple doğrulandı)
- **Çıktı = `izometri_format_tanimlari` satırı** (fingerprint + parser_kural + prompt_template). Doğrudan Supabase insert/update. **YENİ ENDPOINT YOK** (MK-129.3, 12/12 fonksiyon korunur).
- **izometri-oku.js DEĞİŞMEZ** (MK-49.1). Üç okuma noktası zaten var:
  - `parser_kural` → L2 (satır ~215)
  - `prompt_template` → L3 sistem promptu (satır 589 okur, 721 kullanır)
  - `fingerprint` → tanıma (dosya_adi_regex +5, pdf_uretici_anahtar +1, baslik_regex)
- **Metin motoru = pdf-parse'ın kendi pdfjs'i v1.10.100.** Tarayıcıda da sunucuyla BİREBİR temiz metin verdiği prob ile kanıtlandı (yeni PDF.js v3 garbliyordu — atıldı).
  - Üretimde **vendor'lanmalı**: `node_modules` Vercel'de servis edilmez → `pdf.js` + `pdf.worker.js`'i servis edilen `/vendor/pdfjs-1.10.100/`'e kopyala.
- **glyph-onar** çıkarılan metne uygulanır (temizse no-op, kaymışsa onarır) → tarayıcı = sunucu. Bu PDF ailesi temiz; band-B borcu ayrı PDF'lerle (NB1137) ilgili.
- **`cozumle()`** = bölge → değer + **boşluk-dayanıklı** regex (`\n`'e bağlı değil → tarayıcı↔sunucu taşınabilir). 9/9 gerçek M100 metnine karşı node ile doğrulandı. **AI değil, deterministik, runtime'da da $0.**
  - **AI yalnız**: malzeme tablosu satır desenleri + cozumle'nin tanıyamadığı alanlar. Sonda, toplu, operatör onayıyla (MK-148.1).

## UX (v4'te oturdu)
- Panel **sol**, PDF **sağ**. Pinch / ctrl+tekerlek = imlece zoom; iki parmak / sürükle = pan.
- Alan başına **tek adım**: "alanı kutuyla çevrele" → otomatik tanı → tanıdıysa **Sonraki** (2. tık yok). Tanıyamazsa "Elle ayarla" otomatik açılır (tip / çapa / regex fallback).
- Malzeme: bölge işaretle → satır desenleri sonda toplu AI (üretimde gerçek L3 çağrısı).
- Tamamla: kapsam (sadece bu PDF / **formatın tümü = G3 yayılım**) + JSON önizleme.

## Üretim yapılacaklar (SIRA)
1. **pdfjs v1.10.100 vendor** → `/vendor/pdfjs-1.10.100/`. (servis edildiğini kontrol et)
2. **`format_tanit.html`** — v4'ten türet; uygulamanın auth / nav / supabase init'iyle entegre. **Feature flag** (devre_wizard_v3 deseni).
3. **Supabase yazma** — `izometri_format_tanimlari` upsert (fingerprint / parser_kural / prompt_template / tenant_id). RLS: `get_tenant_id()` deseni. Şemayı doğrula (MK-85.3, BEGIN/ROLLBACK gerekirse MK-98.2).
4. **Tetik** — izometri-oku formatı tanımadığında (format_id null → L3) `uyarilar.html` / wizard inceleme'de "Bu formatı tanıt" butonu → bu sayfa.
5. **Kaydet sonrası propagasyon** — `eslestirme-backfill.js` (zaten var) ile eski L3 PDF'leri yeni L2 kuralıyla yeniden parse → format ailesi $0'a geçer.
6. **Paylaşılan çekirdek** (sonra) — `cozumle()` + mini-çapa bileşeni → wizard inceleme tek-alan düzeltme + spool_detay "çizimden düzelt".

## Küçük iyileştirmeler (koda alırken)
- **bbox'ı PDF-point'e normalize et** (şu an render-px, scale'e bağlı). konum_ipucu opsiyonel/l2 yoksayıyor ama düzelt.
- `format_kodu` zorunlu olsun (şu an "(adsız)") — operatörden iste.
- Malzeme toplu AI: gerçek L3 çağrısı + 7 `satir_tipleri` deseni sentezi.
- cozumle desen havuzunu yeni format aileleri geldikçe genişlet (paor_aveva vb.).

## Read-before-write (koda BAŞLAMADAN — bu oturumda toplanacak)
1. `izometri_format_tanimlari` tam şema: kolonlar, NOT NULL, `prompt_template` kolonu var mı, `format_kodu` mu `format_adi` mı, fingerprint kolon mu JSONB mi.
2. Bir sayfanın supabase init + insert/upsert deseni (ör. devre_wizard_v3.html başı).
3. Feature flag kontrol mekanizması (devre_wizard_v3 flag'i nasıl okunuyor).

## Doğrulanmış gerçekler (kanıt)
- pdf-parse + glyph-onar → M100 metni `durum: temiz`, tertemiz (node).
- pdfjs v1.10.100 tarayıcıda → aynı temiz metin (prob, ekran görüntüsü yeşil).
- cozumle 9/9: spool S01, pipeline -M100-303-013-ALS (etiket sıyrıldı), dn 32, cap 42.4, et 3.6, ağırlık 3.6, yüzey Galvaniz, tarih 09-01-25, not metni.
- Gerçek referans kural: `tersan_cadmatic_spool` (id e1fb879d) — cozumle çıktısı bununla uyumlu.
