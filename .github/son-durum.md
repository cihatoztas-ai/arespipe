# son-durum.md — Oturum 185 sonu

## HEAD
185 push'u sonrası. Önceki kod commit: `f7936ff` (kapsam çip). 185 kapanış commit'i bu push'la gelir. Fonksiyon **12/12** (yeni api yok). Çalışma ağacı temiz olmalı.

## 185'te yapılanlar (3 iş)

### 1. Kapsam-etiketli malzeme görünümü (MK-185.1) — PUSH'LANDI (f7936ff)
spool_detay malzeme listesinde imalat/montaj/işlem çip filtresi + rozet. `ares-normalize.kapsamEtiket(tanim)` global helper (TEK kaynak). Default: imalat+işlem açık, montaj kapalı. Veri silinmez, filtrelenir (montaj-ekibi versiyonuna hazır). Tersan'a sıfır risk. 16/16 birim test geçti. Dosyalar: ares-normalize.js + spool_detay.html.
> NOT: Bu "B — BOM dağıtımı" diye açıldı ama gerçek ihtiyaç kapsam-etiketli görünüm çıktı (daha sağlam yer). devre_detay'a aynı çip HENÜZ YOK (carry — istenirse).

### 2. PAOR spool-sayma hatası → prompt fix (MK-185.2) — CANLI
**Kök neden zinciri (uzun teşhis):** PAOR 782 çizimi 3 spool (SPOOL [1][2][3]) ama sistem 1 saydı. (a) Önce cache sanıldı (22 May eski L3 cache). (b) Cache invalidate edilince taze L3 DE 1 okudu → cache değil. (c) Görsel inceleme: SPOOL kutusu NET, model görüyor. (d) Kök: varsayılan prompt madde 3 yalnız "[1][2]=2" örneği → model 2'ye şartlanmış (few-shot). 6 çizimden 5'i (2 spool) doğru, tek 3-spool yanlış.
**Fix:** paor_aveva_ana prompt_template'ine güçlendirilmiş madde 3 (2/3/4/5+ örnek). Migration 105 (E-string tek satır, canlı APPLY edildi, length=7025 doğrulandı). izometri-oku DOKUNULMADI. Canlı kanıt: 773+782 → 3 spool ✓.

### 3. Mimari spec (MK-185.3) → 186'ya devir
Prompt override + manuel cache temizliği ölçeklenmiyor (halı-altı). Kalıcı çözüm tasarımı: docs/186-PROMPT-CACHE-MIMARI-SPEC.md (247 satır). Prompt kompozisyon + cache prompt-sürümü. 186'da uygulanacak.

## Cache durumu (185 sonu)
- 782 sha (540dab50) + tüm PAOR Ana eski-prompt cache'leri invalidate edildi.
- **PAOR Ana (995b5514) aktif cache = 0** → her PAOR çizimi taze L3 + yeni prompt ile parse edilir (ilk yüklemeler L3 maliyeti, sonra yeni-promptlu cache). 186 mimarisine kadar temiz başlangıç.
- Tersan cache'leri (e1fb879d/39a2c81b/84c12f61 = 76) DOKUNULMADI.

## Migration
- **104** (184): spooller.cizim_no — canlı + repo senkron.
- **105** (185): paor_aveva_ana prompt_template — canlı APPLY (length=7025) + repo. MK-184.5 senkron.

## Açık işler (carry — taze SQL ile doğrula, MK-163.1)
- **MK-185.3** prompt+cache mimarisi → 186 (spec hazır).
- devre_detay'a kapsam çip (185.1 spool_detay'da; devre_detay carry).
- 184 carry: MK-184.1 şef konsolidasyon, 184.2 ölü kod, 184.4 montaj köprü, B-tam BOM per-spool (PAOR Excel'de spool ayrımı YOK — yalnız PDF geometrisinde, L3 prompt işi).
- PAOR veri-kalite: agirlik_kg null (K2), et boş, D-182.2 çelişkiler.
- format_id=null 251 cache envanteri (186 §6).

## Disiplin notu
Tersan kırmızı çizgisi korundu: kapsam çip global ama Tersan montaj=0; prompt fix yalnız paor_aveva_ana; cache temizlik format_id scoped (DRY kanıtlı, sadece 995b5514). malzeme-kiyas.js + ares-kabuk.js + izometri-oku.js DOKUNULMADI.
