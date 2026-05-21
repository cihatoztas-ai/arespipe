# CLAUDE-SONRAKI-OTURUM — Oturum 106 gündemi

## Açılış ritüeli (CLAUDE.md = 2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -6`
2. Bugünkü hedef onayı.
> 105 son commit'ler: f45ceae (iso_view) · f33bbf7 (087 L2) · 6e49fa2 (088 fix) · kapanış docs. CI yeşil mi.

## 106 İLK İŞ — Tersan İmalat görsel re-test (105'te yapılmadıysa)
088 DB'de canlı (dn_var=true) ve ai_api_log L2/$0 teyitli. Eksik olan tek şey: düzeltilmiş çıktının
görsel onayı. Cache'li 3 PDF eski parse'ı döndürür → önce temizle:
```sql
DELETE FROM ai_api_log WHERE parser_seviye='l2' AND cagri_tipi='L2_deterministic'
  AND olusturma_at >= '2026-05-21 07:46:00+00';
```
Sonra 3 PDF'i tekrar yükle → İmalat Excel'inde: No≥10 satırda baştaki "1" YOK, NOT satırı YOK,
her spool **hazir** (sadece zararsız malzeme_bos orta). Görürsen Faz 1 tertemiz.

## 106 HEDEF — B-geometri Faz 2/3 (Faz 1 BİTTİ)
Detay: **docs/MK-B-GEOMETRI.md**. Faz 1 (malzeme listesi L2) canlı + bug-fixli. Kalan:
- **Faz 2 — yon_dizilim (detay):** Cut & Bending segment boyları, açılar, R, rotasyon → MK-49.A 3D render.
  **lib/l2-parser.js KOD genişletme gerekir** (geometri satırları tablo değil).
- **Faz 3 — yerleşim/AR (montaj):** frame, güverte+kot, CL, yönelim, Continue-zinciri → AR sabitleme.
Başlamadan iste: birkaç Tersan detay + montaj PDF, lib/l2-parser.js, ilgili parser_kural satırı.

## 106 — orta öncelik
- **pipeline_no dosya adından:** pdf-parse metni kesiyor; l2-parser dosya adı almıyor → downstream `_dosya`
  ya da mimari karar (izometri-oku dokunur → MK-49.1 dikkat).
- **Tersan fingerprint düzgün ayrım (MK-105.4):** şu an kural her iki formatta. Ayırt edici: dosya adında
  S-segmenti var/yok; ya da Malzeme Listesi satırı var/yok. Detay→İmalat, montaj→Montaj.
- **Çift-parse teyidi** (montaj+detay aynı spool'u iki kez mi).
- **B-öğrenme (MK-48.5):** düzeltme → parser_kural otomatik (DB'ye yazar, migration değil).

## 106 sonrası / açık borçlar
- (Ops.) S01/S02/S03 çiziminin PDF'ini gerçek fixture olarak ekle (BUG1/BUG2 gerçek-veri regresyonu).
- (Ops.) malzeme_bos orta'sını spool malzeme koduyla sustur (zararsız, gerek yok).
- Test'i CI'a (kontrol.yml) bağla: `node test/l2-tersan-test.mjs`. i18n toplama. Wizard→backend (MK-49.B).

## Önemli hatırlatmalar
- **izometri-oku.js'e DOKUNMA** (MK-49.1). Maliyet/öğrenme/geometri = dispatch/worker/parser_kural tarafı.
- **PAOR ana çizim L2 imkânsız** (MK-105.6) — metin katmanı yok, L3 zorunlu. Tekrar L2 deneme = boşa emek.
- **L2 spool, halusinasyonFiltresi şemasını sağlamalı** (MK-105.7): dn zorunlu; eksik alan kritik/orta uyarı
  → manuel_onay. Yeni alan/format eklerken filtreyi (izometri-oku Madde 1-8) gözden geçir.
- **Üretim çıktısı kenar durum açar** (MK-105.8): yeni format/kural sonrası gerçek çok-satırlı/çok-spoollu
  dosyayla canlı test + regresyon guard ekle.
- parser_kural değişirse **DB + test/l2-tersan-kural.json İKİSİ**; cache'li PDF eski parse → temizle/yeni dosya.
- Disiplin: >45KB MD5'li transfer; str_replace→node --check→grep→outputs→md5→present_files. Şema-dokunur →
  MK-98.2 dry-run + MK-101.5. SQL Editor düz ASCII + çoklu statement'ta son SELECT. Sadece terminal git.
  `arespipe_kopyala` sonrası `git status` (MK-101.1).
