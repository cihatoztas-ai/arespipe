# CLAUDE — Son Oturum Özeti (185)

## Üç iş + bir teşhis maratonu

### 1. Kapsam-etiketli malzeme görünümü (MK-185.1) — PUSH'LANDI f7936ff
"Spool malzeme listesinde montaj kalemlerini (civata/conta/vana) imalat kalemlerinden ayır" isteği. Başta "B — BOM dağıtımı" sanıldı; araştırınca gerçek ihtiyaç netleşti:
- **PAOR Excel'de spool ayrımı YOK** (doğrulandı: 3 Excel, hepsi çizim-toplamı BOM, S01/S02 kolonu yok). Per-spool dağıtım yalnız PDF geometrisinde → L3 işi, şimdilik yapılamaz.
- **pipeline_malzemeleri altyapısı ZATEN var** (spool_detay pipeline_no ile okuyor) → mükerrer yazma yok.
- **Gerçek iş:** kapsam-etiketli görünüm. `ares-normalize.kapsamEtiket(tanim)` → imalat|montaj|islem. spool_detay'da 3 çip (default imalat+işlem açık, montaj kapalı) + rozet. Veri silinmez.
- Flanş kritik: malzeme-kiyas'ta montaj (kıyas beklentisi) ama iş-akışında imalat (kaynaklı). kapsamEtiket AYRI helper, sözlüğe dokunulmadı → Tersan kıyası korundu.
- 16/16 birim test (boru/dirsek/te/flanş/doubler/sleeve=imalat; vana/strainer/civata/somun/conta/rondela=montaj; yiv/kaynak=işlem).

### 2. PAOR spool-sayma hatası → prompt fix (MK-185.2)
**En uzun teşhis.** 782 çizimi 3 spool olmalı (SPOOL [1][2][3]), sistem 1 saydı. "19 olmalıydı, 17 saydı, 2 kayıp" (780'in eksik S02+S03).
**Yanlış izler ve eleme:**
- İlk hipotez cache (22 May L3 cache, 1 spool). Invalidate ettik → taze L3 DE 1 okudu.
- "Köstebek oyunu": her test yeni cache yazıyor, prompt fix'i maskeliyor. 782 için 3 ayrı cache invalidate edildi.
- Görsel inceleme (PDF render + SPOOL kutusu kırpma): kutu NET, [1][2][3] okunabilir → model görüyor ama saymıyor.
- **Kök neden:** varsayılan YAKLASIM_Y_PROMPT madde 3 yalnız "[1][2]=2 spool" örneği. Model 2'ye şartlanmış (few-shot). 6 çizimden 5'i (2 spool) doğru, tek 3-spool (782) yanlış = imza. Cihat'ın "ikiden fazla olunca şaşırıyor" sezgisi DOĞRU.
**Fix:** paor_aveva_ana (995b5514) prompt_template'i = varsayılanın TAMAMI + güçlendirilmiş madde 3 (2/3/4/5+ örnek, SPOOL kutusu vurgusu, <> kesim vs [] spool ayrımı). Migration 105 (E-string tek satır — multi-line yapıştırma SQL Editor'de bölünüyordu, E'...\n...' ile çözüldü). Canlı APPLY (length=7025). izometri-oku DOKUNULMADI (prompt_template:721 override).
**Kanıt:** 119-spool seti (12 çizim) yüklendi → 773 + 782 artık **3 spool** (S03 üretildi). Prompt fix ÇALIŞIYOR.

### 3. Mimari spec (MK-185.3) → 186
Cihat: "İleride başka formatlar gelince karmaşıklaşmaz mı? Halı altına mı süpürüyoruz?" → EVET. İki yapısal boşluk yazıya döküldü (docs/186-PROMPT-CACHE-MIMARI-SPEC.md):
- Prompt override → ölçeklenmiyor (evrensel kural yayılmaz). Çözüm: KOMPOZİSYON (evrensel çekirdek + format ek).
- Cache anahtarında prompt sürümü yok → değişince donar. Çözüm: prompt_hash/timestamp anahtara.
- Kilit içgörü: parser'da katman kompozisyonu ZATEN var (format-paketleri 0-3), prompt'ta yok.
- Engel: MK-49.1 → lib/prompt-birlestirici.js ile aş (izometri-oku ince kalır).

## Cache temizlik (185 sonu)
46 PAOR Ana eski-prompt cache + tümü invalidate (format_id=995b5514 scoped, Tersan'a SIFIR dokunuş, DRY ile kanıtlandı). PAOR Ana aktif cache=0 → temiz başlangıç. Tersan cache'leri (76) korundu.

## En önemli dersler
- **Cache köstebek oyunu:** prompt sürümü cache anahtarında olmayınca, her test eski/yeni karışık cache yazıp teşhisi saatlerce sabote eder. 186 mimarisinin asıl gerekçesi.
- **Few-shot şartlanması gerçek:** prompt'ta tek örnek (2 spool) modeli oraya kilitliyor. Çözüm: değer aralığı örneklemek (2/3/4/5+).
- **DATA→UI→kod (MK-158.1) işledi:** cache_hit, original_log_id, istek_full, sonuc_json — her adım DB'den doğrulandı, varsayım yok. ai_cagri_sayisi=0 → "L3 çalışmadı, cache" ayrımı kritikti.
- **Tersan izolasyonu:** her müdahalede format_id/scope ile Tersan'a değmediği DRY'la kanıtlandı (Cihat'ın "tersana etkisi?" sorusu format_id=null 251 + Tersan L3 76 cache'ini ortaya çıkardı — global temizlik felaket olurdu).

## Disiplin
ares-normalize/spool_detay: node --check (inline JS OK), 16/16 test. Migration 105: E-string, canlı APPLY + repo. Cache UPDATE'leri BEGIN/ROLLBACK dry-run (MK-98.2) sonra COMMIT. izometri-oku.js/paor.js/malzeme-kiyas.js/ares-kabuk.js DOKUNULMADI. Fonksiyon 12/12.
