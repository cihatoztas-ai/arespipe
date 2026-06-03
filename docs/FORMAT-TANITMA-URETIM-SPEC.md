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
1. **pdfjs v1.10.100 vendor** → `/vendor/pdfjs-1.10.100/`. (servis edildiğini kontrol et) ✅ 148
2. **`format_tanit.html`** — v4'ten türet; uygulamanın auth / nav / supabase init'iyle entegre. **Feature flag** (devre_wizard_v3 deseni). ✅ 148
3. **Supabase yazma** — `izometri_format_tanimlari` upsert (fingerprint / parser_kural / prompt_template / tenant_id). RLS: `get_tenant_id()` deseni. Şemayı doğrula (MK-85.3, BEGIN/ROLLBACK gerekirse MK-98.2). ✅ 148 (insert) + 149 (INSERT→UPDATE dedup)
4. **Tetik** — izometri-oku formatı tanımadığında (format_id null → L3) `uyarilar.html` / wizard inceleme'de "Bu formatı tanıt" butonu → bu sayfa. ⏳ 150 (giriş noktaları hazır: ?format_id=&alan= + picker)
5. **Kaydet sonrası propagasyon** — `eslestirme-backfill.js` (zaten var) ile eski L3 PDF'leri yeni L2 kuralıyla yeniden parse → format ailesi $0'a geçer. ⏳ 150
6. **Paylaşılan çekirdek** (sonra) — `cozumle()` + mini-çapa bileşeni → wizard inceleme tek-alan düzeltme + spool_detay "çizimden düzelt". ⏳ 150 (B1 düzeltme kipi çekirdeği 149'da kuruldu)

## Küçük iyileştirmeler (koda alırken)
- **bbox'ı PDF-point'e normalize et** (şu an render-px, scale'e bağlı). konum_ipucu opsiyonel/l2 yoksayıyor ama düzelt. ⏳ açık
- `format_kodu` zorunlu olsun (şu an "(adsız)") — operatörden iste.
- Malzeme toplu AI: gerçek L3 çağrısı + 7 `satir_tipleri` deseni sentezi. ⏳ stub
- cozumle desen havuzunu yeni format aileleri geldikçe genişlet (paor_aveva vb.). ⏳ 150 (soru ağacı ile birlikte)

## Read-before-write (koda BAŞLAMADAN — bu oturumda toplanacak)
1. `izometri_format_tanimlari` tam şema: kolonlar, NOT NULL, `prompt_template` kolonu var mı, `format_kodu` mu `format_adi` mı, fingerprint kolon mu JSONB mi. ✅ 149 (şema dökümü alındı: id/ad NOT NULL, parser_kural+fingerprint jsonb NOT NULL default '{}', prompt_template text null, egitim_kaynagi default 'vision_only', requires_ai default true, format_kodu text null, guncelleme_at NOT NULL default now())
2. Bir sayfanın supabase init + insert/upsert deseni (ör. devre_wizard_v3.html başı). ✅
3. Feature flag kontrol mekanizması (devre_wizard_v3 flag'i nasıl okunuyor). ✅ (tenant_features.feature_kod='format_tanit')

## Doğrulanmış gerçekler (kanıt)
- pdf-parse + glyph-onar → M100 metni `durum: temiz`, tertemiz (node).
- pdfjs v1.10.100 tarayıcıda → aynı temiz metin (prob, ekran görüntüsü yeşil).
- cozumle 9/9: spool S01, pipeline -M100-303-013-ALS (etiket sıyrıldı), dn 32, cap 42.4, et 3.6, ağırlık 3.6, yüzey Galvaniz, tarih 09-01-25, not metni.
- Gerçek referans kural: `tersan_cadmatic_spool` (id e1fb879d) — cozumle çıktısı bununla uyumlu.

---

## OTURUM 149 GÜNCELLEME — B1 + A + B + prompt_template tamamlandı

### B1 — Düzeltme kipi (hedefli tek-alan çapa) ✅
- Tanınan format yüklenir (URL `?format_id=` veya picker) → kayıtlı regex'ler hidratlanır → operatör sorunlu alanı yeniden işaretler → **yalnız o alan** `parser_kural.alanlar` içinde PATCH'lenir.
- **Patch, rebuild DEĞİL (MK-111.2):** `_mevcutKural` derin kopyalanır, yalnız `_dirty` alanlar üzerine yazılır. malzeme_tablosu / kabul_kriterleri / AI satır desenleri korunur. UPDATE `.eq('id')` + `guncelleme_at`.
- Dirty takibi: setRegex / reSynth / captureBox-cozumle → `a._dirty=true`. _initAlan `_dirty=false` sıfırlar.

### INSERT→UPDATE borcu kapandı ✅
- Yeni kipte kaydetmeden önce `fingerprint.dosya_adi_regex + tenant` ile mevcut satır aranır (JS-tarafı, küçük küme). Varsa onay → UPDATE (alanlar merge, malzeme_tablosu/kabul_kriterleri korunur), yoksa INSERT. Çift satır sorunu bitti.

### A — İçerik-bazlı oto-tespit ✅ (spec'te yoktu, eklendi)
- PDF açılınca `otoTespit()`: tenant'ın tüm L2 formatlarının (`requires_ai=false`) `parser_kural.alanlar` regex'leri `CANON_ALL`'a koşulur, **en çok alan okuyan** kazanır. Eşik: `skor>=3 || (skor>=2 && skor>=top*0.5)`.
- İyi skorsa otomatik düzeltme kipine girer; banner "🎯 Otomatik eşleşti: X · N/M alan okundu". Düşükse yeni format kipi. Picker manuel override + boş seçim → yeni kip.
- **Karar (Cihat):** İçerik-eşleşmesi seçildi (fingerprint değil) — kimlik (dosya adı/üretici) farklı sürüm olsa bile kural tutuyorsa yakalar. Production routing fingerprint'le devam eder (ayrı mesele).
- **Canlı:** M110-306-SP13.S02 picker'a dokunmadan → tersan test 8/8 alan okundu.

### B — Alan yeşil/kırmızı ✅
- `_alanlariKos()`: her alanın regex'i CANON_ALL'a koşulur → `a._okudu` (true/false/null). renderDots: yeşil (okudu/regexli) · kırmızı (okuyamadı) · nötr (formatta tanımsız). İlk kırmızı alana otomatik atlar → operatör PDF avlamadan görür.

### prompt_template (AI sözlü tarif) ✅
- **Karar (Cihat sorusu):** AI'a sözlü tarif yazılabilsin mi → evet, `prompt_template` (zaten kolon, L3'te okunuyor). Tamamla ekranına textarea eklendi. Insert/dedup-update/düzeltme — üç yola da bağlı. Yalnız L3 fallback'te kullanılır, deterministik kuralın yerine geçmez.
- Alan-bazlı `ai_ipucu` ileriye bırakıldı (gerçek ihtiyaç doğunca; ölü alan açma).

### CI düzeltmesi
- format_tanit.html'e `ares-layout.js` eklendi + atlama listesine `format_tanit` (tam-ekran araç, sidebar enjekte edilmez). Eski _arsiv md'leri untrack edildi.

### 150'ye taşınan
- **Soru ağacı** (ana tema): "Elle ayarla" → yönlendirmeli akış. Tek motor, AI öncesi + sonrası iki yerde.
- **AI merdiveni** (operatör tetikli 2. çağrı + mühür mantığı).
- Tetik butonu, kaydet sonrası propagasyon, malzeme toplu AI, bbox normalize.
