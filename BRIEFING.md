# AresPipe BRIEFING — 164. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> İlerleme aynası: docs/WIZARD-YOL-HARITASI.md (164 işaretleri işlendi).

## HEAD
- Kod: 4 commit — `1ed95e9` feat(164) G2a v2 kaynak bağı (migration 103 + 3 yazım noktası +
  kart adresi) · `5a80fa7` chore(164) parse_durumu yumuşak emeklilik · `7e8469b` fix(164)
  kaynak alan-bazlı MK-164.1 + kalem kalite alanı + kabuk kalite tercihi · `a36f66b` feat(164)
  W-2.19 ucuz dilim + W-4.4 bbox normalize. Kapanış doc commit'i üstte.
- **DB:** migration 103 COMMIT (deger_kaynagi CHECK + format_id FK + görünüm v2,
  security_invoker korunur; dry-run: 7 sinyal birebir NULL kovası) · `devre_dokumanlari.
  parse_durumu` BAYAT COMMENT'i. Endpoint YOK (12/12). izometri-oku DOKUNULMADI.
- Değişen dosyalar: migrations/103 (YENİ) · devre_wizard_v3.html (3 dalga) · format_tanit.html
  · uyarilar.html · devre_detay.html · ares-kabuk.js · api/devre-inceleme.js.

## 164 — yapılanlar (tema: G2a KAYNAK BAĞI + ürün rötuşları; A/ucuz-dilim kararları Cihat'ın)
1. **Açılış teyitleri (MK-163.1 işledi):** d97e4a6 origin'de ✓ · onay kuşağı 147→**162**
   (P26-217=76) · G2a v1 CANLI (7 sinyal, kutu+konsol temiz) · OPR taslak kaydı doğdu ama
   TERFİ kanıtı hâlâ açık · 88543b1 = bot "docs AUTO" (doğal).
2. **164-B1 BULGUSU → G2a v2 (A):** v1 sinyallerinin değer kaynağı EXCEL KABUKTU — kart
   "PDF format kuralı" diye yanlış adres gösteriyordu. Migration 103 + yazım noktaları
   kaynak yazar + kart kaynak-dallı. Eski satırlar NULL='bilinmiyor', backfill YOK.
3. **MK-164.1 (öz-düzeltme, aynı oturum):** ilk yama sabit 'excel' — ekran kanıtı (L2 rozetli
   yuzey/alistirma/not) çürüttü. v2.1: kaynak ALAN-BAZLI (dsatir rozet kuralının birebir eşi;
   izometri ise format_id DOLU — devre-inceleme ps.format_id taşır). 10/10 test.
   **Ders: rozet varsayılanı ≠ kaynak kuralı.**
4. **MK-163.6 KAPANDI (A yumuşak emeklilik):** `_parseDurumu` tüketicisi YOKTU (grep);
   devre-inceleme/izo-eslesme'deki ad ÇIKTI alanı. Ölü okuma silindi + kolona BAYAT COMMENT
   (yazımlar sürer, yeni kod OKUMAZ, veri silinmez).
5. **Kalem KALİTE alanı (Cihat bulgusu):** editörde yoktu + kabuk kalite'ye HAM MALZEME
   yazıyordu (OPR'de 'paslanmaz'). Dinamik süzgeçli dropdown (spool yolu birebir) + kabukta
   dz.kalite tercihi (yoksa eski davranış — sıfır regresyon).
6. **W-2.19 ucuz dilim + W-4.4 KAPANDI:** bbox yakalama anında scale-1 normalize (norm:1);
   wizard **🔍 Tablo** → konum_ipucu (yalnız norm) → dpvZoomTo+vurgu; norm'suz kullanılmaz
   (dürüst toast). Bugün norm bölge yok → **Y200 tablo öğretimiyle canlanır.**
7. **Canlı kanıtlar:** kalite(spool)→excel ✓ · yeni kalem→operator ✓ · 📐 yeni metin ✓.

## ⚠ 165'e işaretler
- **İzometri-kaynak kanıtı:** 1 alistirma düzeltmesi → SELECT'te `izometri`+format_id DOLU.
- **OPR TERFİ kanıtı:** taslak OPR kalemi var; terfi → `SELECT * FROM spool_malzemeleri
  WHERE kod='OPR'` hâlâ 0.
- **42.2/3.56 vakası (YENİ BORÇ):** M130-817-008.S01 — kuyruk formatı **e1fb879d
  KATALOG-PAKET** → adres paket kuralı (MK-155.1: kod+deploy). Hipotez: redüksiyon küçük ucu
  (1-1/4"=42.16) çap seçimi + schedule et karışması. JSONB anahtarları örnekten teyit edilmeden
  hüküm yok (cap anahtarı SELECT'te null/teyitsizdi — MK-85.3).
- Y200 atölyesi (reçete + 163 yeşil-kutu şartı + 164 eki: 🔍 canlanması) · taze onay eritme
  (162 kayıt) · KARARLAR'a MK-164.1..3 işlendi (bu pakette).

## NEREDEYIZ — ÖZET
164 "yanlış adres" oturumuydu: G2a sinyalinin söylediği ile gerçeğin kaynağı ayrıştı, kayıt-
zamanı bağ kuruldu; aynı refleks oturum içinde Claude'un kendi sabit-'excel' hatasını da
yakaladı (MK-164.1). parse_durumu hükme bağlandı, kalite boşluğu kapandı, zoom altyapısı
Y200 öğretimine bağlanarak gemiye alındı. 12/12, izometri-oku dokunulmadı.
