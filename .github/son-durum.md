# son-durum.md — Oturum 164 (2026-06-06, akşam)

## Bu oturumda ne yapıldı (tema: G2a KAYNAK BAĞI + ürün rötuşları)
1. **Açılış teyitleri (MK-163.1 ilk uygulama):** d97e4a6 origin'de ✓ · onay kuşağı 147→162
   (P26-217=76; eritme 165'e) · G2a v1 canlı 7 sinyal (kutu + konsol temiz) · parse_sonuc
   anahtar keşfi: **format_id VAR** → v2 tasarımı açıldı · OPR: 0 satır (borç sürdü).
2. **164-B1 BULGUSU:** G2a v1 sinyallerinin değer kaynağı EXCEL KABUK (rozet kodu + BOM
   zinciri kanıtı); v1 kart metni PDF format kuralına YANLIŞ adres veriyordu.
3. **G2a v2 — Cihat kararı A (kayıt-zamanı bağ):** migration 103 `deger_kaynagi`
   (excel/izometri/operator CHECK) + `format_id` FK + görünüm v2 kaynak kırılımlı
   (security_invoker korunur; dry-run 7 sinyal birebir NULL kovasında) · wizard/format_tanit
   yazım noktaları + uyarilar kart adresi kaynak-dallı. Eski satır NULL='bilinmiyor',
   tahmin backfill YOK. (`1ed95e9`)
4. **MK-164.1 — aynı-oturum öz-düzeltme:** sabit 'excel' YANLIŞTI; NB1137 modal ekranı
   (yuzey/alistirma/not L2 rozetli) yakaladı. v2.1: kaynak alan-bazlı (dsatir kuralının
   birebir eşi), izometri ise format_id dolu; devre-inceleme `ps.format_id`'yi önizleme
   izometrisine taşır. 10/10 mantık testi. (`7e8469b` içinde)
5. **MK-163.6 HÜKMÜ — A yumuşak emeklilik:** grep kanıtı: `_parseDurumu` tüketicisiz
   (2707/2793 yalnız `_kuyrukDurum`); devre-inceleme/izo-eslesme'deki `parse_durumu` ÇIKTI
   alanı (kolon değil). SELECT'ten çıkarıldı + ölü alan silindi (`5a80fa7`) + kolona BAYAT
   COMMENT (canlı SQL). Yazımlar sürer; yeni kod OKUMAZ.
6. **Kalem KALİTE alanı (Cihat bulgusu):** kalem editöründe kalite YOKTU; kabuk iki dalda da
   `kalite`'ye ham malzeme yazıyordu (OPR: 'paslanmaz'). KALEM_ALANLAR+yeni-kalem listesi+
   dinamik süzgeçli dropdown (spool yolu birebir; `_kaliteSecenekYukle` ortak) + kabukta
   `dz.kalite` tercihi, yoksa eski davranış (sıfır regresyon). 6/6 test. (`7e8469b` içinde)
7. **W-2.19 ucuz dilim + W-4.4 KAPANDI (`a36f66b`):** captureBox bbox'ı yakalama anında
   scale-1'e normalize (`norm:1`); drawMarks norm-duyarlı; wizard Malzemeler **🔍 Tablo** →
   konum_ipucu (YALNIZ norm) → izometri sekmesi → dpvZoomTo+vurgu. Norm'suz eski kayıt
   kullanılmaz (dürüst toast). Bugün norm bölge yok → Y200 öğretimiyle canlanır.
8. **Canlı kanıtlar:** kalite(spool)→`excel` ✓ · yeni kalem(idx5)→`operator` ✓ · 📐 kart
   "kaynak kayıtlı değil (103 öncesi)" metni canlı ✓.

## Bulgular (164)
- **42.2/3.56 vakası (YENİ 165 BORCU):** M130-817-008.S01 bindirme çap 60.3↔42.2, et
  2.77↔3.56. Kuyruk: format **e1fb879d KATALOG-PAKET**, et_mm=3.56, satirlar=0 — adres
  PAKET kuralı (MK-155.1: kod+deploy). Hipotez: redüksiyon küçük ucu (1-1/4"=42.16) çap
  seçimi; et schedule karışması. Teşhis SELECT'inde cap anahtarı teyitsizdi — JSONB anahtarı
  örnekten doğrulanmadan hüküm yok (MK-85.3 izdüşümü).
- **88543b1 bot "docs AUTO" commit'i** (ARCHITECTURE/ONBOARDING) doğal CI davranışı.
- W-2.19 tam dilim (alan-bazlı konum) tasarım borcu: motor konum eki B1 metin-ayrışmasına
  komşu — izometri-oku'ya dokunmadan tasarlanmalı.

## Commit'ler (164)
| Hash | İçerik |
|---|---|
| 1ed95e9 | feat(164): g2a v2 kaynak bağı — migration 103 + 3 yazım noktası + kart adresi |
| 5a80fa7 | chore(164): parse_durumu yumuşak emeklilik — ölü okuma kaldırıldı MK-163.6 |
| 7e8469b | fix(164): kaynak alan-bazlı MK-164.1 + kalem kalite + kabuk kalite tercihi |
| a36f66b | feat(164): W-2.19 ucuz dilim — tablo bölgesine zoom + W-4.4 bbox normalize |
DB: migration 103 COMMIT ✓ · parse_durumu BAYAT COMMENT ✓. 12/12 ✓. izometri-oku ✓.

## MK kayıtları (164 — KARARLAR.md'ye işlendi, bu pakette)
MK-164.1 (rozet varsayılanı ≠ kaynak kuralı) · MK-164.2 (konum_ipucu norm standardı) ·
MK-164.3 (G2a kaynak sözlüğü + backfill yasağı).

## 165 ADAYLARI
İzometri-kaynak canlı kanıt (1 alistirma düzeltmesi + SELECT) · OPR terfi kanıtı · 42.2/3.56
katalog-paket cap/et incelemesi (sunucu parse_sonuc dökümü + paket kuralı, atölye) · Y200
tablo öğretimi (reçete; 🔍 Tablo canlanır) · taze onay eritme (162 kayıt) · KÜÇÜKLER (önceki
liste: EN/AR anahtarları · 6 B1124 orijinal ad · ✖ sessiz-kayıp · W-2.20 canlı göz · vb.).
