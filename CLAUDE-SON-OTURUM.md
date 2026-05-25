# CLAUDE-SON-OTURUM.md — Oturum 122

**Konu:** Cadmatic glyph BAND-B ters tablosu türetimi + canlıya alma
**Tarih bağlamı:** Oturum 121 (band-A) sonrası, açılış HEAD `bc8278b`
**Kapanış HEAD:** `cb3f432` (T9 test) — CI **yeşil**

---

## Yapılanlar (özet)

### 1. Band-B ters tablosu (29 karakter, MK-96 çapraz doğrulandı)
8 glyph spool PDF (M130-803-006R/009R, E100-722-2015/2016-ALS, M110-817-005/007 S01/S02, Y200-804-414 — hepsi aynı Cadmatic-Tersan fontu) üzerinden **sıkı satır hizalama** (uzunluk ≥10, birebir band-A eşleşme) + **bootstrap** (mevcut tabloyla kalan karakterleri öğren) ile türetildi. Her kod ≥2 bağımsız PDF'te tutarlı.

Tam tablo (glyph → gerçek):
```
Ä→b  Å→c  Ç→d*  É→e  Ñ→f  Ö→g  Ü→h
á→i  â→k  ã→m  ä→l  å→n  ç→o*  é→p
ê→r  ë→s  ì→u  í→t  ï→w  ò→z  ó→y
î→v  ñ→x  ć→ü        (* = çakışmalı, aşağıda)
ğ→ğ  ş→ş  ı→ı  σ→ı  °→°   (identity + sigma)
```
- `ñ→x`: boyut ayıracı ("139.7x4.5"). 19 ñ'nin 16'sı rakam-çevreli.
- `ć→ü`: "Düz", "Redüksiyon".
- `°→°`: "45°" açı, identity.
- Şifre yapısı: gerçek harf +29 → font cmap → Latin-1/Türkçe glyph.

### 2. İki çakışma (MK-122.2) — bir glyph kodun gerçek Türkçe identity'siyle aynı kodpointe düşmesi
- **Ç (U+00C7):** çoğunluk `d` (Adet/Düz/Detay), gerçek `Ç` (Çelik). KARAR B: kelime-başı + ardı küçük harf ise `Ç` (Türkçe imla: büyük harf yalnız kelime başında; "delik" diye terim yok), aksi `d`. → "Çelik" kurtarıldı.
- **ç (U+00E7):** çoğunluk `o` (Boru/Boyut/No), gerçek `ç` yalnız "Açıklama" başlığında. DAİMA `o` (kelime-içi ayırt edilemez; başlık kozmetik, veri değil).
- İkisi de `band_b_meta.cakisma=true` ile işaretli (MK-96 — sessiz bozma yok).

### 3. Kod: lib/glyph-onar.js band-B katmanı
- `BANT_B_TABLO` (29 kod) + `CAKISMA` (Ç/ç) + `bandBOnar(text)` (kelime-başı Ç kurtarma, ç→o, eşlenmeyen flag).
- `metinNormalle` band-A kapısının ARKASINDA band-B uygular (sadece `glyph_band_a=true`). Dönüş: `{metin, glyph_band_a, glyph_band_b, durum, band_b_meta}`.
- **Temiz PDF byte-byte korunuyor** (kapı: ham'da çapa varsa band-B çalışmaz → gerçek Türkçe ç/ş bozulmaz). 5 temiz PDF'te doğrulandı.
- Commit: `a0ef2f3` (feat) + `7d1faa1` (durum fix).

### 4. Test: test/asama1-pilot.mjs T9 (16 assertion)
Gerçek NB1137 ham fixture'lar (`\u`-escape, pure-ASCII paste-güvenli). T9.1 onarım, T9.2 Çelik kurtarma, T9.3 Adet bozulmadı + ç→o başlık, T9.4 çakışma izi, T9.5 drift guard (temiz değişmez). Commit `cb3f432`. Pilot 47→63 test.

### 5. Yakalanan regresyon (MK-122.3)
`durum` string'i `glyph_band_a_onarildi` → `glyph_onarildi` yanlış yeniden adlandırılmıştı; T8.3 + durum'a bağlı kodu kırardı. Geri alındı. **Ders:** modül dönüş sözleşmesini değiştirme; yeni sinyal additive alan olarak eklenir.

---

## MK kararları (122)
- **MK-122.1 — Glyph ≠ dil:** Glyph onarımı font/encoding düzeltmesi, çeviri değil. Encoding katmanı (glyph-onar.js) dil-agnostik. Dil ayrımı L2 PARSE katmanında (çok-dilli kavram sözlüğü + başlıktan dil tespiti).
- **MK-122.2 — Band-B çakışma çözümü:** Çoğunluk/Latin + kelime-başı büyük-Türkçe kurtarma (B) + `band_b_meta` flag. Yapısal alanlar (tetikleyici, ST37, boyut, kg) her durumda sağlam.
- **MK-122.3 — Dönüş sözleşmesi değişmez:** Modülün dönüş alan adları/değerleri (örn. `durum`) geriye-uyum sözleşmesi; yeni bilgi additive alanla eklenir, mevcut korunur.
- **MK-122.4 — Spekülatif onarım yok:** Gözlemlenmeyen karakter için (Ö/Ü/İ/Ğ/Ş büyük Türkçe, ö) kurtarma kuralı EKLENMEZ (measure-first / MK-121.2). Format öğrenme döngüsü yakalar.
- **KARAR-122.1 — Çok-dilli parse yol haritası:** (1) dil-bağımsız demir (boyut/DN/PN/SCH/malzeme kodu/standart/kg + Cadmatic tablo yapısı), (2) kapalı çok-dilli kavram sözlüğü (PIPE←boru/rohr/pipe...), sıfır-AI determinist lookup, (3) başlık boilerplate'inden dil tespiti, (4) bilinmeyen terim → satır düşme YOK, `_l2_meta` flag + öğrenme havuzu, AI sadece batch fallback.
