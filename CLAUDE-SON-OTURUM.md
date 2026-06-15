# CLAUDE — Son Oturum Özeti (186)

## 185.3 prompt+cache mimari borcu KAPANDI — 4 iş, hepsi canlı + veriyle kanıtlı

### MK-186.1 — Prompt override → KOMPOZİSYON (+ Step 7 temizlik)
185'in GEÇİCİ override'ı (paor prompt_template) kalıcı kompozisyona taşındı. `lib/prompt-birlestirici.js`: `EVRENSEL_PROMPT` (eski YAKLASIM_Y + güçlendirilmiş madde 3 = 7025 char) + `promptBirlestir(formatBilgisi)` = EVRENSEL + (prompt_ek varsa). **Kilit kanıt:** mig105 prompt'u = YAKLASIM_Y + YALNIZ güçlendirilmiş madde 3 (prefix/suffix birebir) → PAOR'a özgü kural YOK → PAOR prompt_ek BOŞ (saf evrensel). 25/25 birim test (Tersan regresyon mekanik kanıtlı). MK-49.1 esnetme (prompt lib'de, izometri-oku ince). Mig106 prompt_ek kolonu.
**Step 7 (temizlik):** ölü YAKLASIM_Y_PROMPT (140 satır) izometri-oku'dan SİLİNDİ; mig108 ile mig105 prompt_template geri alındı (NULL, id-scoped 995b5514). Regresyonsuz (güçlü madde-3 EVRENSEL'de baki) + cache-nötr (istek_surum prompt_template kullanmaz). MK-155.1 tuzağı kapandı.

### MK-186.2 — temperature: 0
visionAIParse'ta temp set edilmemişti (1.0). 782 kanıtı: AYNI 4821-token prompt, 12:51=3 / 14:30=1 → saf varyans (kod değil). temp=0 → deterministik. Bu olmadan "fix tuttu mu" testleri gürültülüydü.

### MK-186.3 — SPOOL kutusu zoom kırpımı (eksik-sayım KÖK çözümü)
**En önemli iş.** 780/782 tam-sayfada 1 sayılıyordu (gerçek 3). Teşhis: prompt zaten max güçlüydü + temp=0 yine 1 → prompt tavanı. AMA Claude SPOOL kutusunu ZOOM'layınca [1][2][3]'ü anında okudu → kök = ÇÖZÜNÜRLÜK. Çözüm: drain (mevcut pdf.js) PDF sağ malzeme kolonunu yüksek-DPI render→crop→`spool_kirpim_b64` POST'a ekler; izometri-oku varsa 2. görsel (image) + KIRPIM_TALIMATI olarak L3'e verir. **Tek L3 çağrısı** (ikinci çağrı/timeout YOK), **yeni endpoint YOK** (12/12), client-render (MK-113/A). Hata→null (graceful).
**Kanıt:** 780 14:30 spool=1/input_tokens=4821 (crop yok) → 17:21 spool=3/6582 (crop). Yeni 769-778 (KABUK 20): 10/10 TAM doğru. NOT: Claude'un DÜŞÜK-RES montaj ilk okumaları 769/775'te yanlıştı (3 sandı), yüksek-zoom'da 2 çıktı → MODEL HAKLIYDI. Ders: yer-hakikati de yeterli çözünürlükte okunmalı (MK-162.3).

### MK-186.4 — Cache sürümleme (istek_surum) — köstebek oyunu KALICI bitti
185-186'nın asıl acısı çözüldü. `istek_surum` = sha256(PARSE_SURUM|model|promptBirlestir|crop-modu+KIRPIM_TALIMATI)[:16] → cache anahtarına girer. cacheKontrol `&istek_surum=eq.X`; eski NULL → MISS → bir kerelik temiz tazeleme. KIRPIM_TALIMATI + crop talimatı TEK KAYNAK (istek=hash birebir). Mig107 kolon.
**Kanıt:** 769-778 İKİ kez yüklendi → 13/13 çizim `l3_odeme=1` (ikinci yükleme yeni L3 YAZMADI = HIT, $0). Manuel `UPDATE basarili=false` invalidate dansı bitti.

## En önemli dersler
- **Prompt tavanı gerçek:** madde-3 zaten max güçlüyken + temp=0 yine eksik sayıyorsa, DAHA fazla prompt çözmez. Çözüm modalite değişimi (görsel zoom), prompt değil. "Crop demo'su işe yarıyor mu" → ÖNCE ucuz prompt fix dene, yetmezse zoom (kanıt-temelli tırmanış).
- **Çözünürlük > prompt:** model küçük glyph'leri (parantez) tam-sayfada kaçırır; aynı içeriği zoom'da rahat okur. Kırpılmış görsel hem modeli besler HEM insana onay aracı olur (tek artefakt, çift fayda).
- **Cache sürümlemesi mimarinin asıl gerekçesiydi:** prompt/crop her değiştiğinde elle invalidate = saatlerce köstebek. istek_surum bunu kökten bitirdi. Bundan sonra parse mantığı değişimi otomatik tazeleniyor.
- **Yer-hakikati de çözünürlük ister:** düşük-res montajdan saymak HATALI sonuç verdi (769/775), model haklı çıktı. Kıyasta her iki taraf da yeterli zoom'da okunmalı.
- **Drift tuzağı:** /tmp klon depth-1'di (185 baseline); Step 5'i orada yazınca deploy edilmiş HEAD'den koptu. Çözüm: `git fetch --depth 1 && git reset --hard origin/main` ile GERÇEK HEAD'e senkron, ONDAN düzenle. (Bir kez bu yüzden dosya bozuldu, recover edildi.)

## Disiplin
prompt-birlestirici 25/25 test. node --check her dosyada. Migration 106/107/108 APPLY + repo (107/108 bu oturumda repoya eklendi — APPLY edilmişti, dosya eksikti, MK-184.5). Cache/prompt değişiklikleri istek_surum sayesinde otomatik tazeleniyor. Tersan: EVRENSEL+boş-ek birebir, mig108 id-scoped, crop fab-PDF → DOKUNULMADI. Fonksiyon 12/12. Commit'ler [skip ci]'siz (kod), handoff [skip ci].
