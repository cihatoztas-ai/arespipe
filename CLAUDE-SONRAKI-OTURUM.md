# CLAUDE-SONRAKI-OTURUM — Oturum 106 gündemi

## Açılış ritüeli (CLAUDE.md = 2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -4`
2. Bugünkü hedef onayı.
> 105 commit'leri: f45ceae (iso_view saklama) + tersan L2 (087+test) + kapanış docs. CI yeşil mi bak.

## 106 İLK İŞ — Tersan İmalat L2 canlı teyidi (105'te yapılmadıysa)
Yeni (cache'siz) bir Tersan İmalat detay PDF'i yükle → `ai_api_log`'da `parser_seviye='l2'`,
`cagri_tipi='L2_deterministic'`, `maliyet=0`; incele'de spool + malzeme listesi çıkmalı.
Çıkmazsa: parser_kural DB'de mi (2 satır, satir_tipi=7), dispatch L2 dalına giriyor mu, cache HIT mi.

## 106 HEDEF — B-geometri Faz 2/3 (Faz 1 BİTTİ)
Detay: **docs/MK-B-GEOMETRI.md**. Faz 1 (malzeme listesi L2) canlı. Kalan:
- **Faz 2 — yon_dizilim (detay sayfası):** segment boyları, açılar (90°/30°/45°), R, rotasyon →
  MK-49.A 3D render verisi. **lib/l2-parser.js KOD genişletme gerekir** (config yetmez — geometri
  satırları tablo değil). Türkçe karakter ve SQL Unicode kuralı yine geçerli.
- **Faz 3 — yerleşim/AR (montaj sayfası):** frame (FR80/FR81), güverte+kot (MAIN DECK-11300+1849),
  CL, yönelim (Up/FW/PS/SB), Continue-zinciri (komşu spool) → AR sabitleme.
Başlamadan iste: birkaç Tersan detay + montaj PDF (varyasyon), lib/l2-parser.js, ilgili parser_kural satırı.

## 106 — orta öncelik
- **pipeline_no dosya adından:** pdf-parse metni kesiyor (`-Suc`). l2-parser dosya adı almıyor →
  ya downstream `_dosya`'dan doldur, ya da parser'a dosya adı geçir (izometri-oku dokunur, MK-49.1 dikkat).
- **Tersan fingerprint düzgün ayrım (MK-105.4):** şu an kural her iki formatta. Ayırt edici sinyal:
  dosya adında S-segmenti var/yok; ya da içerikte Malzeme Listesi satırı var/yok. Detay→İmalat, montaj→Montaj.
- **Çift-parse teyidi:** aynı spool montaj+detay'dan iki kez mi parse ediliyor (mükerrer/maliyet).
- **B-öğrenme (MK-48.5):** düzeltme → parser_kural otomatik. (DB'ye yazar, migration değil — veri.)

## 106 sonrası / açık borçlar
- Test'i CI'a (kontrol.yml) bağla (opsiyonel): `node test/l2-tersan-test.mjs`.
- i18n toplama (105 + 104 anahtarları TR fallback'le çalışıyor).
- Wizard'ı hazır backend'e bağla (MK-49.B) — en son.
- Normal Excel "Standart" boş; `excelIndir`/`manuelOnayAc` ölü kod (zararsız).

## Önemli hatırlatmalar
- **izometri-oku.js'e DOKUNMA** (MK-49.1).
- **PAOR ana çizim L2 imkânsız** (MK-105.6) — metin katmanı yok, L3 zorunlu. Tekrar L2 deneme = boşa emek.
- **PAOR iso_view = saklama** (MK-105.1). **İzometri batch = SADECE Excel** (MK-104.1).
- **parser_kural değişirse DB + test/l2-tersan-kural.json İKİSİ** güncellenir.
- Disiplin: >45KB MD5'li transfer; str_replace→node --check→grep→outputs→md5→present_files.
  Şema-dokunur → MK-98.2 dry-run + MK-101.5 pg_get_constraintdef. SQL Editor düz ASCII + çoklu statement'ta
  son SELECT görünür. Sadece terminal git. `arespipe_kopyala` sonrası `git status` (MK-101.1).
