# CLAUDE-SONRAKI-OTURUM.md — Oturum 151 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz mi · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. **docs/FORMAT-TANITMA-TABLO-TASARIM.md OKU — 151'in tek kaynağı, tasarım tartışması TEKRARLANMAZ**
4. Bu dosya + son-durum.md oku · 5. CI yeşil mi (`73f3f38` sonrası — 150 kodları: AI-oku + schedule zinciri)
6. Ajanda onayı

## Durum (150 kapanışında)
AI-oku (Increment 1) canlıda: 🟣 buton → izometri-oku L3 → değer-çapalı kural sentezi → yeşil/kırmızı + "AI gördü"
ipucu. Schedule zinciri gemide ama UYUYOR (schedule çıkaran kural yok — Increment 2 ile canlanır). MK-49.1'e tek
kontrollü istisna işlendi (kayıt: son-durum.md). 12/12, izometri-oku başkaca değişmedi, CI bekleniyor.

## ANA İŞ: INCREMENT 2 — TABLO MOTORU
Spec satır satır hazır: **docs/FORMAT-TANITMA-TABLO-TASARIM.md** (§4). Özet hatırlatma (detay oraya):
- format_tanit `_tabloSentezle(aiSatirlar)`: AI satır değerlerinden satir_tipleri sentezi (değer-çapalı satır bulma →
  tip sınıflandırma → pattern+grup_haritasi; Boyut HAM yakalanır) + client doğrulama (desen→olcuParse→AI kıyas) +
  "türetilmiş ✓" çipleri + kural yazımı (alanlar.cap_mm/et_mm/dn YAZILMAZ; _toplu_ai_bekliyor kalkar).
- lib/l2-parser: satır boyut → ARES_OLCU.olcuParse (Node; ares-asme import SIRASI önce) + dominant Boru satırından
  spool dn/cap/et/schedule türetimi → asmeFallback zinciri canlanır.
- Mekanik test ZORUNLU (commit öncesi): M230 + Y100-817-013 + Y100-817-018 (redüksiyon) — beklenenler tasarım §4.2.3.

## Koda BAŞLAMADAN (read-before-write, tasarım §7)
1. format_tanit.html güncel 701 satırlık hali (tamamlaAc/buildParserKural/kaydet üç yolu — tablo yazımı bağlanacak).
2. **Cihat'tan 1 SELECT:** tersan kuralının `parser_kural->'malzeme_tablosu'` dökümü (satir_tipleri dolu mu? Hiç görülmedi).
3. ares-asme Node require davranışı (globalThis'e ARES_BORU) — l2-parser import sırası kanıtı.
4. CI yeşil + canlıda M230 bir kez daha okutulup regresyon-sıfır teyidi (izometri-oku istisnası sonrası).

## Increment 2 SONRASI kuyruk (tasarım §6 — sıralı)
Pekiştirme bağlama (taslak satır+prompt_template) → requires_ai dürüstlüğü → tetik butonu (uyarilar/wizard) →
propagasyon (eslestirme-backfill) → bbox normalize · boruOlcuBul DB fallback schedule filtresi · ai_api_log pay ölçümü.

## Hatırlatmalar
- MK-49.1: izometri-oku DOKUNMA (150 istisnası kapandı, yenisi A/B/C kapısından geçer). MK-129.3: 12/12.
- MK-111.2: patch-not-rebuild; tablo post-process mevcut dolu alanı EZMEZ. MK-134.1: kod commit `[skip ci]`SİZ.
- MK-51.1: arespipe_kopyala + MD5. zsh: komutlar yorumsuz. Canlı test: uygulama içinden, flag aktif.
- İlk schedule'lı kural kaydında canlı kanıt: Y100 spool et'i 10S'ten dolmalı (et_kaynagi 'SCH 10S' etiketi).

> 151 açılışında: ritüel → tasarım dokümanı → "tablo motoruna başlıyoruz, SELECT'i atar mısın?" — başka soru yok.
