# CLAUDE — Sonraki Oturum (187) Brifingi

## Açılış ritüeli
```bash
cd ~/Desktop/arespipe
git pull --rebase
git status
git log --oneline -5
ls api/*.js | wc -l    # 12 olmali (MK-129.3)
```
Sonra oku: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md + BRIEFING.md. CI yeşil mi, Vercel "Ready" mi.

## DURUM: 186 prompt+cache mimari borcunu (185.3) KAPATTI — spool-sayma artık sağlam
4 iş canlı + veriyle kanıtlı:
- **MK-186.1** prompt KOMPOZİSYON (lib/prompt-birlestirici.js) + Step 7 temizlik (YAKLASIM_Y silindi, mig108 prompt_template geri al). 332827e.
- **MK-186.2** temperature 0.
- **MK-186.3** SPOOL kutusu zoom kırpımı → eksik-sayım KÖK çözüldü (780→3, yeni set 10/10). 543711d.
- **MK-186.4** cache sürümleme (istek_surum) → köstebek KALICI bitti (13/13 l3_odeme=1). ad45644.
Migration 106/107/108 APPLY + repo.

## ⚠️ SPOOL SAYIMI — GÜVENDE AMA KURŞUN-GEÇİRMEZ DEĞİL (ilk gündem değerlendir)
Crop fix PAOR pilotu için uçtan-uca çalışıyor, ama kalan riskler var. Cihat "güvende miyiz" diye sordu; dürüst cevap = "büyük ölçüde, ama şu 4 boşluk":
1. **Kırpma bölgesi heuristik** (`_SPOOL_KIRP` drain:75, x:0.44-1.0) — PAOR SPOOL kutusu sağ kolonda varsayımı. ~13 çizimde doğru; varyant/revizyon kutuyu kaydırırsa ıskalar.
2. **Sessiz fallback** — crop render patlarsa crop'suz tam-sayfa gider (eksik-sayım riski), alarm YOK. Belirti: input_tokens ~4821 (crop'lu ~6582).
3. **Sayımı hâlâ model yapıyor** (temp=0 deterministik ≠ doğru). Bağımsız kontrol yok.
4. **Çok-spool ucu (5-6 [n]) test edilmedi.**

### Önerilen sertleştirme (Cihat kararı bekliyor)
- **A) Emniyet ağı (asıl defense-in-depth, Cihat'ın fikri):** Dökümanlar sekmesinde çizim-başı SPOOL göz-onayı — kırpılmış kutu thumbnail + sayı stepper (ön-dolu). Operatör tek bakışta onay. Crop ZATEN o görseli üretiyor → neredeyse bedava. SADECE PAOR görsel-PDF'de. UYARI: yukarı-düzeltme (1→3) = S02/S03 yaratmak = kabuk genişletme = #2b mekanizması (aşağı/eşit kolay, yukarı wiring ister). Yer: devre_wizard_v3 "📁 Dökümanlar" sekmesi (zaten var).
- **B) Ucuz sessiz-fallback alarmı:** crop gelmediğinde (input_tokens eşik altı / spool_kirpim_b64 null) çizimi "crop yok — gözle say" diye işaretle. Küçük iş, sessiz riski görünür yapar.
- **C) Çok-spool ucu testi** + _SPOOL_KIRP bölge ince ayarı (gerekirse daha çok zoom).
- **(D) Deterministik çapraz-kontrol** araştır: PAOR Excel BOM çizim-başı spool sayısı taşıyor mu? Taşıyorsa model-sayı ≠ Excel-sayı → $0 bayrak. (Önce SELECT ile doğrula — şu an spool ayrımı YOK biliniyordu, ama çizim-toplamı spool ADEDİ olabilir.)

## Diğer açık işler (carry — taze SQL, MK-163.1)
- **184 carry:** MK-184.1 şef konsolidasyon (spoolAnahtarlariUret helper), 184.2 ölü kod (eslesenIzoIdx), 184.4 montaj köprü drain-yolu (kuyruk-isle-izometri:840 cizim_no).
- **B-tam BOM per-spool:** PAOR Excel'de spool ayrımı YOK → S02..SN pipeline-paylaşımlı malzeme yeterli mi yoksa PDF-pozisyon dağıtımı mı (#2b'ye bağlı).
- **#2b kabuk genişletme:** 1→N spool (sonuc_spool_sayisi), malzeme KAYIT-BAZLI (MK-182.5), 0/1/N (MK-182.6). aktar zaten N yaratıyor, PAOR adaptörü 1 üretiyor. cap/et zenginleştirme (devre-inceleme ~287) pozisyon-duyarlı yapılmalı.
- **PAOR veri-kalite:** agirlik_kg null, et boş, kalite metin, D-182.2 imalat/montaj çelişki. NOT: bunlar "Zayıf/doğrulanmadı" rozetlerinin sebebi — SAYIM hatası DEĞİL, ayrı iş.
- **format_id=null 251 cache envanteri.** devre_detay kapsam çip (185 carry). NPS→mm bug (ares-olcu, Tersan Faz2).

## Notlar (186 canlı-doğrulanmış)
- PARSE_SURUM='186.5-temp0-crop' (izometri-oku:~92). Parse mantığı (temp/model/structural) değişirse ELLE artır → cache otomatik tazelenir. Prompt/crop değişimi sistem_prompt+KIRPIM_TALIMATI hash'te → OTOMATIK yakalanır.
- KIRPIM_TALIMATI = TEK KAYNAK (izometri-oku sabit); hem L3 2. görsel talimatı hem istek_surum hash girdisi. Değiştirirsen cache otomatik MISS.
- _SPOOL_KIRP (ares-izometri-drenaj:75): {x0:0.44,y0:0,x1:1.0,y1:0.62,hedefGen:1500}. Crop ayarı buradan.
- istek_surum doğrulama: SELECT cevap_full->'spoollar'->0->>'pipeline_no', jsonb_array_length(...), istek_surum, input_tokens FROM ai_api_log WHERE format_id='995b5514-...' ORDER BY... — input_tokens ~6582 = crop gitti, ~4821 = gitmedi.
- 769-778 (zip4) yer-hakikati: 769=2,770=1,771=2,772=1,773=3,774=2,775=2,776=3,777=2,778=2 = 20. (Bunlar regresyon test vakaları; YÜKSEK-ZOOM ile sayılmalı, düşük-res yanıltır.)
- 780/782 (önceki zip): SPOOL [1][2][3]=3 (eksik-sayım fix'in imza vakaları).
- prompt_template ARTIK NULL (mig108) ve runtime'da kullanılmaz — düzenleme lib/prompt-birlestirici.js EVRENSEL_PROMPT'ta yapılır (MK-155.1).
