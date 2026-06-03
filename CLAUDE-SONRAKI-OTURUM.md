# CLAUDE-SONRAKI-OTURUM.md — Oturum 150 açılışı

## Açılış ritüeli
1. `git pull`, `git status` temiz mi
2. Fonksiyon sayısı 12/12 mi (`ls api/*.js | wc -l`) — MK-129.3
3. Bu dosya + son-durum.md + docs/FORMAT-TANITMA-148-ILERLEME.md (149 bölümü) oku
4. CI son durum yeşil mi (ba96fa6 sonrası)
5. Ajanda onayı

## Durum (149 kapanışında)
format_tanit.html artık: tanıt (yeni) + düzelt (B1) + oto-tespit (A) + yeşil/kırmızı (B) + AI sözlü tarif (prompt_template). Hepsi $0/deterministik. izometri-oku dokunulmadı, 12/12, şema değişmedi. CI yeşil.

## ANA İŞ: SORU AĞACI (beyaz tahta → tasarım → kod)

**Amaç:** "Elle ayarla" panelini (ne tür değer? / neye çapalı? / etiket? / önek?) — bugünkü ham formu — **yönlendirmeli akışa** çevir. İşaretlenen bölgeden cevapları otomatik öneren, operatörü adım adım götüren bir motor.

**Kritik içgörü:** Soru ağacı tek bir deterministik motordur, AI merdiveninin 4. basamağı DEĞİL. İki yerde çağrılır:
- (i) AI'dan ÖNCE — "ufak düzeltme" basamağında (kırmızı alanı çapala).
- (ii) AI'dan SONRA — AI'ın çözemediği stragglar'ı temizlemede.
Bir kez kur, iki yerde kullan. Sıfırdan değil: `cozumle()` + "Elle ayarla" zaten ilkel hali.

**Sıra önerisi:**
1. Beyaz tahta: soru ağacının düğümleri (tip → çapa → etiket/önek → doğrula → öneri). Mockup-first (R-10).
2. `cozumle()` desen havuzunu genişlet (yeni format aileleri: paor_aveva vb.).
3. İşaretlenen bölgeden otomatik öneri (tip tahmini, etiket tespiti) — operatör onaylar.
4. Paylaşılan çekirdek olarak wizard inceleme + spool_detay "çizimden düzelt"e taşı.

## AI MERDİVENİ (soru ağacından SONRA)
Cihat'ın onayladığı senaryo:
1. Oto-eşleştir (A — var) → 2. Ufak düzeltme (B1 — var) → 3. AI doldursun → 4. Soru ağacı + yer işaretle → 5. Açıklama ekle + **operatör tetikli** 2. AI → mühürle.

İlkeler (149'da kilitlendi):
- Merdiven yalnız ÖĞRETME kipinde, format başına bir kez. Üretimde koşmaz (L2 mühürlü → $0, yoksa tek L3).
- 2. AI ASLA otomatik değil — operatör "açıklama ekle → tekrar dene".
- Mühür: (a) kurala indirgenebilir → $0; (b) indirgenemez → `requires_ai` o alan + prompt_template (meşru %5-10 artık, dürüst işaretle).
- Ölçüm: `ai_api_log` ile L3 payı düşüyor mu — sayıyla.

## Sonraki (soru ağacı + merdiven sonrası)
- **Tetik butonu:** uyarilar.html / wizard inceleme zayıf-satır → "Bu formatı tanıt/düzelt" → format_tanit?format_id=&alan= (giriş noktaları zaten kodda hazır: URL param + picker).
- **Kaydet sonrası propagasyon:** eslestirme-backfill.js (zaten var) ile eski L3 PDF'ler → yeni L2 kuralı ($0'a geç).
- **Malzeme tablosu toplu AI** (stub): bölge işaretle → satır desenleri gerçek L3 + 7 satir_tipleri sentezi.
- **bbox → PDF-point normalize** (render-px, scale-bağlı; konum_ipucu opsiyonel/l2 yoksayıyor ama düzelt).
- **ares-layout nav entegrasyonu** (şu an format_tanit atlama listesinde, kendi tam-ekran çerçevesi — bilinçli; nav istenirse ileride .app-shell refactor).

## Read-before-write (soru ağacı koduna BAŞLAMADAN)
1. `cozumle()` mevcut desen havuzu (format_tanit.html ~satır 219) — hangi alanlar deterministik çözülüyor.
2. "Elle ayarla" akışı (setTip/setAnchor/setAnc/setDonusum/reSynth) — soru ağacı bunları sarmalı.
3. `_alanlariKos` + renderDots durum mantığı — kırmızı alan tetiği buradan.
4. wizard inceleme'nin zayıf-satır gösterimi (tetik entegrasyonu için).

## Hatırlatmalar (149'dan)
- MK-49.1: izometri-oku.js DOKUNMA. MK-129.3: 12/12 fonksiyon, yeni endpoint yok, doğrudan Supabase.
- MK-111.2: kaynağı sessizce ezme; patch-not-rebuild.
- MK-134.1: kod commit'i `[skip ci]`SİZ. Doc commit `[skip ci]` ile.
- MK-51.1: `arespipe_kopyala <kaynak> <hedef> <md5>` — 3. arg MD5 zorunlu.
- zsh: komutları yorumsuz çalıştır (`#` + `'` → `quote>` tuzağı).
- format_tanit canlı test: uygulama içinden aç (giriş yapılı + flag aktif). Önizleme sandbox'ı ARES yükleyemez (beklenen).

> 150 açılışında bu dosya + son-durum.md okunur, CI yeşili teyit edilir, sonra Cihat'a "soru ağacı beyaz tahtasıyla mı başlayalım?" sorulur.
