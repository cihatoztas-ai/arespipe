# CLAUDE — Sonraki Oturum (186) Brifingi

## Açılış ritüeli
```bash
cd ~/Desktop/arespipe
git pull --rebase
git status
git log --oneline -3
ls api/*.js | wc -l    # 12 olmalı (MK-129.3)
```
Sonra oku: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md + **docs/186-PROMPT-CACHE-MIMARI-SPEC.md** (ANA İŞ). CI yeşil mi, Vercel "Ready" mi.

## DURUM: 185 üç iş kapattı, biri 186'ya tasarım devri
- **MK-185.1** kapsam çip (spool_detay) — PUSH'LANDI (f7936ff), CANLI.
- **MK-185.2** PAOR prompt fix (migration 105) — CANLI, 773/782→3 spool kanıtlı. GEÇİCİ override.
- **MK-185.3** prompt+cache mimarisi — SPEC HAZIR, 186'da uygulanacak.

## 186 ANA İŞ: Prompt & cache mimarisi (docs/186-PROMPT-CACHE-MIMARI-SPEC.md)
Spec'i baştan oku. Özet:
- **Problem:** prompt override ölçeklenmiyor + cache prompt-sürümüne kör (185'te ~3 saat köstebek oyunu). Halı-altı.
- **Hedef:** prompt KOMPOZİSYON (evrensel çekirdek + format ek) + cache anahtarına prompt sürümü.
- **İlk karar (§4):** MK-49.1 esnetme. Öneri: lib/prompt-birlestirici.js (mantık lib'de, izometri-oku ince) → kuralı bozmadan.
- **Sıra (§5):** (1) MK-49.1 kararı (2) prompt-birlestirici.js + EVRENSEL_PROMPT (185 spool-sayma çekirdeğe) + test (3) migration prompt_ek kolonu + PAOR'u indirge (4) izometri-oku:721 tek satır (5) cache sürümleme A(prompt_hash)/B(timestamp) (6) canlı test PAOR 782=3 + Tersan regresyon (7) migration 105 geri al.
- **Başarı (§7):** yeni format=kısa ek prompt, evrensel düzeltme tüm formatlara yayılır, prompt değişince cache otomatik MISS, Tersan birebir.

## ⚠️ KIRMIZI ÇİZGİLER (186'da kritik)
- **Tersan regresyon:** evrensel çekirdek + boş-ek = bugünkü Tersan prompt'u OLMALI (birebir). Sadece spool-sayma güçlendirme; başka davranış değişmez. Test: Tersan L3 çıktısı 185 öncesiyle aynı mı.
- **MK-49.1:** izometri-oku.js dokunma kararı açıkça verilmeli. prompt-birlestirici.js yaklaşımı emsali korur.
- **Cache geriye uyumluluk:** eski cache'lerde prompt_hash null → MISS sayılsın (temiz tazeleme).
- **Tersan cache (76 kayıt):** mimari değişimi onları da etkiler. prompt_hash gelince Tersan prompt değişmediği için cache'i korunur, ama dikkat.

## Diğer açık işler (carry — taze SQL, MK-163.1)
- **devre_detay kapsam çip:** 185.1 spool_detay'da yapıldı; devre_detay pipeline malzeme tablosuna aynı çip (plMalzRender ~2163). Hızlı, spool_detay kopyası.
- **B-tam BOM per-spool:** PAOR Excel'de spool ayrımı YOK (185'te doğrulandı) → S02..SN için pipeline-paylaşımlı malzeme yeterli mi yoksa PDF-pozisyon dağıtımı mı? Şu an her spool kendi pipeline_malzemeleri'ni görüyor (kesim/büküm çalışır). İleri iş.
- **format_id=null 251 cache:** envanter — ne bunlar (pre-020 mı, hangi format). Spec §6.
- **184 carry:** MK-184.1 şef konsolidasyon (spoolAnahtarlariUret), 184.2 ölü kod (eslesenIzoIdx), 184.4 montaj köprü drain-yolu (kio:840 cizim_no).
- **PAOR veri-kalite:** agirlik_kg null (K2 kütüphane), et boş, kalite "karbon" metin, D-182.2 imalat/montaj çelişkiler.
- **NPS→mm bug** (ares-olcu): Tersan Faz2 blocker, PAOR'u etkilemez.

## Notlar (185 canlı-doğrulanmış)
- PAOR Ana cache şu an SIFIR (185 sonu temizlik) → her çizim taze L3 + yeni prompt. İlk yüklemeler L3 maliyeti (~$0.036/çizim), sonra cache.
- kapsamEtiket: imalat=boru/dirsek/te/flanş/bilezik-stub/doubler/sleeve; montaj=vana/strainer/civata/somun/conta/rondela/u-bolt; islem=yiv/kaynak. Öncelik islem>montaj>imalat, bilinmeyen→imalat.
- Migration 105 prompt: paor_aveva_ana.prompt_template, E-string, 7025 char. 186 kompozisyonda geri alınacak.
- 782 SPOOL [1][2][3]=3, 7 kesim parçası (cut-lengths spool sayısına EŞİT DEĞİL). 773 de 3 spool. Bunlar prompt fix regresyon test vakası.
- Cache invalidate yöntemi: basarili=false (denetlenebilir, silme değil) + hata_mesaji'na not. format_id scoped şart (Tersan koru).
