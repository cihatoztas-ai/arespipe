# CLAUDE-SONRAKI-OTURUM.md — Oturum 166 açılışı

## Açılış ritüeli
1. `git pull` + `./scripts/oturum-saglik.sh 166` (BRIEFING 165 — TEMİZ geçmeli)
2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. Bu dosya + .github/son-durum.md + CLAUDE-SON-OTURUM.md oku; gerekirse WIZARD-YOL-HARITASI
   (165 işaretleri) + FORMAT-OGRETIM-ATOLYE-162.md (165 ekiyle)
4. Kod okuma: repo raw/klon · 5. Teşhis: VERİ→UI→kod (MK-158.1) · 6. Ajanda onayı (Cihat sıralar)

## AÇILIŞ TEYİTLERİ (5 dk — MK-163.1: her devir borcuna 1 tazeleme SQL'i)
1. **CI:** 165'in 4 kod commit'i (5edbba1 · 1596481 · af90f85 · f86ff81) + kapanış doc
   commit'i yeşil mi (bot raporu HEAD'e gelmiş olmalı).
2. **Fix kalıcılık tazelemesi (1 sorgu):** `SELECT parse_sonuc->'spoollar'->0->>'et_mm' AS et,
   parse_sonuc->'spoollar'->0->>'dn' AS dn FROM dosya_isleme_kuyrugu WHERE id IN
   ('cfe8d399-f571-494d-a325-46f95db60950','64ab75ab-7f4c-427f-b1b3-3a2edb3e39ff');`
   → et=2.77 / dn=50 DURUYOR olmalı (yeni yükleme üstüne yazmadıysa o da kanıt).
3. **G2a izometri-dalı eşiği:** izometri-kaynaklı düzeltme 3+ olduysa uyarilar kartında
   "PDF formatı (Tersan Cadmatic İmalat — Katalog)" dalı doğmuş olmalı; <3 ise dal YOK,
   NORMAL (165 hükmü).
4. **M130-817-006 eski et uyarısı (2.77↔3.91):** duruyorsa NORMAL (drenaj kapsamı dışıydı);
   yeni parse olduysa kendiliğinden düşmüş olmalı.

## 166 ADAYLARI (Cihat sıralar)
1. **Y200 tablo öğretimi (Cihat tetikler, diğer bilgisayar):** reçete ATOLYE-162 (163
   yeşil-kutu şartı + 164 NORM bbox/🔍 canlanma eki) AYNEN. Sonra yayılım + drenaj JOIN.
2. **Onay kuşağı eritme (162 kayıt):** W-2.15 turu; P26-217 (76) ile başla; takılan yer =
   ürün bulgusu.
3. **OPR kalem dn→dis_cap düzeltmesi (MK-165.7/1, kabuk):** "dn" girişi fakir boyutParse'la
   dis_cap_mm'e OD sanılıyor (DN200→200.0; doğrusu 219.1). Çözüm adayı: kabukta
   ARES_OLCU.olcuParse + ARES_BORU.dnBul (165'te eklendi — simetrik). ares-kabuk.js ~276
   (boyutParse çağrısı). Etiket/alan semantiği kararı Cihat'a: alan "dn" mi "boyut" mu?
4. **devre_detay → wizard "düzenle" köprüsü (MK-165.7/2):** taslak görünümü kilitli ve çıkış
   yolu görünmez; MK-136 `?devre_id=` URL'i mevcut — 1 buton işi (taslak banner'ına
   "Wizard'da düzenle").
5. **Uyarı mükerrerliği teşhisi (MK-165.7/3):** aynı uyarı 2-3 dk arayla çift (örn. A-000954
   20:01:17 + 20:03:23, A-001178 çifti). VERİ→UI→kod: önce uyarı tablosunda mükerrer mi,
   görünümde mi; yazan nokta tekrar mı koşuyor (drenaj retry?).
6. **Yeni zip paketleri:** Cihat ~10 çeşitli paket hedefi — her paket
   `node scripts/atolye-kosum.mjs <klasör>` ile; ham satır dökümü = atölye girdisi.
7. **W-2.19 tam dilim TASARIMI (karar, kod değil):** alan-bazlı konum = motor konum eki —
   izometri-oku'ya DOKUNMADAN; konum tarayıcı uzayında, kural sunucu metninde (B1 komşusu).
8. **KÜÇÜKLER:** EN/AR operatör anahtarları · 6 B1124 orijinal ad (MK-52.1) · ✖ sessiz-kayıp ·
   W-2.20 canlı göz · IZO-KANIT v4/AD kararı (yapıştırma ihtiyacı DÜŞTÜ — atolye-kosum var) ·
   hhbjşlö excel önerisi · K-2 (W-3.3) AÇIK · M130-817-006 tazeleme (düşük öncelik).

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-85.3
şema-önce İSTİSNASIZ (JSONB anahtarları örnek dökümden) · MK-158.1 VERİ→UI→kod · MK-161.1
sert yenile (ares-asme TARAYICIDA da yüklü — deploy sonrası şart) · MK-162.3 kanıt makamı
sunucu metni/drenaj SQL'i · MK-163.1 devir borcu tazelenir · MK-164.1 rozet varsayılanı ≠
kaynak kuralı · MK-164.2 norm'suz bbox tüketilmez · MK-164.3 G2a kaynak sözlüğü ·
**MK-165.2 dn HEP dominant borudan; ODxet'te dnBul (tek-eşleşme, uydurma yok)** ·
**MK-165.3 asmeFallbackDoldur ÇİFT KÖR (malzeme+schedule) — ona yaslanan tasarım yapılmaz** ·
**MK-165.4 sha temizliği original_log_id üzerinden; UPDATE etkisi SELECT teyidiyle; drenaj
FİLTRELİ (satırın devresi açılmadan işlenmez)** · **MK-165.6 commit'ler AYRI bloklar** ·
ARES_ALAN_CIKAR tek kaynak · a093eaaa "— Öğretim" / e1fb879d "— Katalog" / 39a2c81b montaj ·
format_kodu YASAK kümesi = AILE_KAYIT anahtarları (MK-119.2) · `spool_malzemeleri.olusturma`
(at'sız) · `devreler.ad` NULL olabilir → COALESCE · test devresi "bn ömn" (77bfbc98; M130 +
OPR burada) · g2a görünümü security_invoker=true KORUNUR · komut blokları TEK TEK · test
yatakları (g200 + aw231 + NB1137 chvvnb + ykjfytjk + bn ömn) SİLME · parse_durumu BAYAT —
YENİ KOD OKUMAZ · tersan.zip PDF'leri Cihat arşivinde (repo yalnız scripts/atolye-kosum.mjs).

> 166 açılışı: ritüel → 4 teyit → Cihat sıralamasıyla adaylar (öneri: ağır iş öne — Y200 VEYA
> OPR-dn kabuk düzeltmesi → onay eritme → küçükler) → kapanış (BRIEFING dahil — MK-55.1).
