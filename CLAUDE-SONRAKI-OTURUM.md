# CLAUDE-SONRAKI-OTURUM.md — Oturum 165 açılışı

## Açılış ritüeli
1. `git pull` + `./scripts/oturum-saglik.sh 165` (BRIEFING 164 — TEMİZ geçmeli)
2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. Bu dosya + .github/son-durum.md + CLAUDE-SON-OTURUM.md oku; gerekirse WIZARD-YOL-HARITASI
   (164 işaretleri) + FORMAT-OGRETIM-ATOLYE-162.md (164 ekiyle)
4. Kod okuma: repo raw/klon · 5. Teşhis: VERİ→UI→kod (MK-158.1) · 6. Ajanda onayı (Cihat sıralar)

## AÇILIŞ TEYİTLERİ (5 dk — MK-163.1: her devir borcuna 1 tazeleme SQL'i)
1. **CI:** 164'ün 4 kod commit'i + kapanış doc commit'i yeşil mi (`a36f66b` sonrası bot raporu).
2. **İzometri-kaynak kanıtı (2 dk):** wizard'da L2 rozetli bir alana (Alıştırma ideal) 1
   düzeltme → `SELECT alan, deger, deger_kaynagi, format_id FROM taslak_duzeltmeleri ORDER BY
   updated_at DESC LIMIT 3;` → `izometri` + format_id DOLU görülmeli (excel/operator zaten ✓).
3. **OPR terfi kanıtı:** taslakta OPR kalemi duruyor; devre terfi edilince
   `SELECT * FROM spool_malzemeleri WHERE kod='OPR' ORDER BY olusturma DESC LIMIT 5;`
   (kolon adı `olusturma` — `olusturma_at` DEĞİL). Satır + kalite kolonunda operatör değeri
   görülürse f borcu TAM kapanır.
4. **G2a kart tazeliği:** uyarilar sert yenile — yeni kaynaklı düzeltmeler 3+ birikince kart
   "Excel hattı" / "PDF formatı (AD)" dallarını göstermeye başlar (NULL kova "bilinmiyor"
   kalır, NORMAL).

## 165 ADAYLARI (Cihat sıralar)
1. **42.2/3.56 KATALOG-PAKET incelemesi (atölye, ağır):** M130-817-008.S01 — kuyruk format
   **e1fb879d** (paket; MK-155.1: düzeltme=KOD+DEPLOY, DB patch koşmaz). Adımlar: (a) örnek
   parse_sonuc TAM dökümü (`SELECT jsonb_pretty(parse_sonuc) ... LIMIT 1` — anahtar adlarını
   ÖRNEKTEN teyit, MK-85.3; 164'te cap anahtarı tahminle null dönmüştü) · (b) paketteki cap/et
   seçim kuralını oku (lib/format-paketleri.js, e1fb879d ailesi) · (c) hipotez testi:
   redüksiyon küçük ucu (1-1/4"=42.16) çap seçimi + schedule et (3.56) karışması ·
   (d) düzeltme paket kodunda + node testi + deploy + drenaj kanıtı.
2. **Y200 tablo öğretimi (Cihat tetikler, diğer bilgisayar):** reçete ATOLYE-162 + 163
   yeşil-kutu şartı + **164 eki: kayıt artık NORM bbox üretir → wizard 🔍 Tablo butonu
   otomatik canlanır** (öğretimin ilk operatör-görünür temettüsü; kanıtı modalda zoom'un
   tabloya oturması). Sonra yayılım + drenaj JOIN kanıtı (değişmedi).
3. **Taze onay kuşağı eritme (162 kayıt):** W-2.15 Onay Kuyruğu'ndan ürün-akışı turu;
   P26-217 (76) ile başla; takılan yer = ürün bulgusu.
4. **W-2.19 tam dilim TASARIMI (karar, kod değil):** alan-bazlı konum = motor konum eki —
   B1 metin-ayrışmasına komşu (konum tarayıcı uzayında, kural sunucu metninde) ve
   izometri-oku'ya DOKUNMADAN olmalı. Tasarım tartışması 165'te, kod sonra.
5. **KÜÇÜKLER:** EN/AR operatör anahtarları (wizard/devre_detay) · 6 B1124 orijinal ad
   (MK-52.1) · ✖ sessiz-kayıp doğrulaması · W-2.20 canlı göz · IZO-KANIT v4 yapıştırma + AD
   kararı · hhbjşlö 1 excel önerisi · K-2 (W-3.3) AÇIK.

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-85.3
şema-önce İSTİSNASIZ — **164 eki: JSONB anahtarları da örnek dökümden teyit edilir, tahmin
SELECT'i hüküm üretmez** · MK-158.1 VERİ→UI→kod · MK-161.1 sert yenile · MK-162.3 kanıt makamı
sunucu metni/drenaj SQL'i · MK-163.1 devir borcu tazelenir · **MK-164.1 rozet varsayılanı ≠
kaynak kuralı — yazan kod, gösteren kuralın birebir eşini kullanır** · **MK-164.2 konum_ipucu
bbox = scale-1 + norm:1; norm'suz bbox TÜKETİLMEZ** · **MK-164.3 G2a kaynak sözlüğü:
excel/izometri/operator, NULL=bilinmiyor, tahmin backfill YASAK** · ARES_ALAN_CIKAR tek
kaynak · a093eaaa = "Tersan Cadmatic Spool — Öğretim" / e1fb879d = "— Katalog" (42.2 vakası
BUNUN paketi) · format_kodu YASAK kümesi = AILE_KAYIT anahtarları (MK-119.2) ·
`spool_malzemeleri.olusturma` (at'sız) · `devreler.ad` NULL olabilir → COALESCE ·
g2a görünümü security_invoker=true KORUNUR · komut blokları TEK TEK · test yatakları
(g200 + aw231 + NB1137 chvvnb + ykjfytjk) SİLME · parse_durumu kolonu BAYAT — YENİ KOD OKUMAZ.

> 165 açılışı: ritüel → 4 teyit → Cihat sıralamasıyla adaylar (öneri: kanıt ikilisi →
> 42.2 atölyesi VEYA Y200 → onay eritme → küçükler) → kapanış (BRIEFING dahil — MK-55.1).
