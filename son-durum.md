# son-durum.md — Oturum 186 sonu

## HEAD
186 kapanışı. Son kod commit'leri: crop `543711d` (MK-186.3) → cache sürümleme `ad45644` (MK-186.4) → Step 7 temizlik `332827e` (MK-186.1). CI HEAD `6a545c2`. Fonksiyon **12/12** (yeni api yok). Çalışma ağacı temiz olmalı.

## 186'da yapılanlar (185.3 borcu KAPANDI — 4 iş, hepsi canlı + veriyle kanıtlı)

### MK-186.1 — Prompt override → KOMPOZİSYON + Step 7 temizlik
`lib/prompt-birlestirici.js`: EVRENSEL_PROMPT + promptBirlestir(EVRENSEL + format.prompt_ek). PAOR prompt_ek BOŞ (kanıt: mig105 = YAKLASIM_Y + yalnız güçlendirilmiş madde 3, PAOR'a özgü kural yok). 25/25 test. izometri-oku ince (MK-49.1). Migration 106 (prompt_ek kolonu). **Step 7:** ölü YAKLASIM_Y_PROMPT silindi (-140 satır), mig108 ile prompt_template NULL'landı (mig105 geri al, id-scoped). Regresyonsuz + cache-nötr.

### MK-186.2 — temperature: 0
Vision çağrısında temp set edilmemişti (1.0) → aynı çizim 3↔1 zıplıyordu. temp=0 → deterministik.

### MK-186.3 — SPOOL kutusu zoom kırpımı (eksik-sayım KÖK çözümü)
Model tam-sayfada küçük [n]'leri kaçırıyordu (çözünürlük, prompt değil). drain (pdf.js) sağ malzeme kolonunu kırpıp `spool_kirpim_b64` gönderir → izometri-oku 2. görsel + KIRPIM_TALIMATI olarak L3'e verir. Tek çağrı, yeni endpoint yok. **Kanıt:** 780 1→3 (input_tokens 4821→6582); yeni 769-778 seti 10/10 doğru (yüksek-zoom yer-hakikati).

### MK-186.4 — Cache sürümleme (istek_surum) — köstebek KALICI bitti
istek_surum = sha256(PARSE_SURUM|model|prompt|crop)[:16] cache anahtarına girer. Prompt/crop değişince otomatik MISS. Migration 107 (istek_surum kolonu). **Kanıt:** 769-778 iki kez yüklendi → 13/13 `l3_odeme=1` (ikinci yükleme $0 HIT). Manuel invalidate dansı bitti.

## Migration
- **104** (184): spooller.cizim_no.
- **105** (185): paor prompt_template — **186'da mig108 ile NULL'landı** (kompozisyona geçti, dosya tarihsel kalır).
- **106** (186): prompt_ek kolonu — APPLY + repo.
- **107** (186): ai_api_log.istek_surum — APPLY + repo (bu oturumda repoya eklendi).
- **108** (186): prompt_template NULL (mig105 geri al, id-scoped) — APPLY + repo.

## Spool sayımı — GÜVENDE Mİ? (Cihat'ın sorusu — dürüst cevap)
Eskisinden çok daha güvende + PAOR pilotu için uçtan-uca doğrulandı. AMA kurşun-geçirmez değil; kalan riskler (→ Sonraki Oturum):
1. Kırpma bölgesi (_SPOOL_KIRP) bir heuristik (PAOR SPOOL kutusu sağ kolonda varsayımı; ~13 çizimde doğru).
2. Crop render patlarsa SESSİZ fallback (crop'suz tam-sayfa → eksik-sayım riski). Belirti: input_tokens ~4821.
3. Sayımı hâlâ model yapıyor (temp=0 deterministik ama doğru garantisi değil).
4. Çok-spool ucu (5-6 [n]) test edilmedi.
→ Gerçek emniyet ağı = göz-onayı (Dökümanlar'da kırpılmış kutu + sayı; crop zaten o görseli üretiyor). Şu an opsiyonel.

## Açık işler (carry — taze SQL ile doğrula, MK-163.1)
- **Emniyet ağı (opsiyonel):** Dökümanlar'da çizim-başı SPOOL göz-onayı (kırpılmış kutu + sayı stepper). Yukarı-düzeltme (1→3) = kabuk genişletme = #2b'ye bağlı.
- **Crop sertleştirme:** sessiz-fallback alarmı (input_tokens eşik altı → "crop yok, gözle say" bayrağı); _SPOOL_KIRP bölge ayarı; çok-spool ucu testi.
- **184 carry:** MK-184.1 şef konsolidasyon, 184.2 ölü kod (eslesenIzoIdx), 184.4 montaj köprü drain-yolu.
- **B-tam BOM per-spool:** PAOR Excel'de spool ayrımı YOK; per-spool yalnız PDF geometrisi.
- **PAOR veri-kalite:** agirlik_kg null, et boş, D-182.2 imalat/montaj çelişki (= "Zayıf/doğrulanmadı" rozetleri; SAYIM hatası DEĞİL).
- **format_id=null 251 cache envanteri.** NPS→mm bug (Tersan Faz2).

## Disiplin notu
Tersan kırmızı çizgisi korundu: tüm 186 müdahaleleri PAOR scoped (crop fab-PDF, mig108 id-scoped 995b5514, EVRENSEL+boş-ek = Tersan birebir). 25/25 + 10/10 + 13/13 kanıt. malzeme-kiyas.js / ares-kabuk.js / paor.js DOKUNULMADI. izometri-oku yalnız cache/istek plumbing (prompt mantığı lib'de). Fonksiyon 12/12.
