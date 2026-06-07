# AresPipe BRIEFING — 165. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> İlerleme aynası: docs/WIZARD-YOL-HARITASI.md (165 işaretleri işlendi).

## HEAD
- Kod: 4 commit — `5edbba1` fix(165) emperyal boru NPS sentezi + dn dominant borudan ·
  `1596481` fix(165) asme et spool'a satır kalitesi+schedule ile (kör fallback bypass) ·
  `af90f85` feat(165) bilezik_detay satır tipi + atölye koşum aracı (scripts/atolye-kosum.mjs
  YENİ) · `f86ff81` feat(165) ARES_BORU.dnBul OD→DN ters eşleme + spool dn türetimi.
  Kapanış doc commit'i üstte.
- **DB:** migration YOK. ai_api_log'da M130 S01/S02'nin iki pdf_sha256'sı NULL (cache
  temizliği — veri silinmedi). Endpoint YOK (12/12). izometri-oku DOKUNULMADI (okundu).
- Değişen dosyalar: lib/l2-parser.js (3 dalga) · lib/format-paketleri.js · ares-asme.js ·
  scripts/atolye-kosum.mjs (YENİ). **ares-asme tarayıcıda da yüklü → deploy sonrası sert
  yenile (MK-161.1).**

## 165 — yapılanlar (tema: 42.2/3.56 ATÖLYESİ + parse zinciri onarımı; kararlar Cihat'ın)
1. **42.2/3.56 KAPANDI:** parse_sonuc dökümü → üç kök: emperyal satırda `boyut` alanı yok
   (NPS+sch ayrık → olcuZenginlestir atlıyor, dominant boru doğmuyor) · spool dn alan-regex'i
   KAYNAK satırına çapalı (DN32) · asmeFallbackDoldur cap/et'i DN32+varsayılan SCH 40'tan
   uydurdu (42.2/3.56). Fix: NPS'ten YEREL boyut sentezi (MK-165.1) + **dn HEP dominant
   borudan** (kenar §5 kodlandı, MK-165.2).
2. **Fallback ÇİFT KÖRLÜĞÜ (MK-165.3):** drenaj-1 et=1.65 (SCH5!) verdi → izometri-oku içi
   fallback'in helper yolu MALZEME-KÖR + DB yolu SCHEDULE-KÖR kanıtlandı (153'ün 3.68/3.91
   kökü). 151 revizyonu: satır kalitesi+basılı schedule'la hesaplanan asme et SPOOL'A YAZILIR
   (etiket fallback'in birebir eşi). **Drenaj kanıtı: dn=50 · 60.3 · 2.77 · SCH 10S**; UI
   bindirme uyarısında et/çap kalemi yok (A-001211/12 yalnız ağırlık yuvarlaması).
3. **tersan.zip atölyesi (MK-162.1 ilk TAM uygulama):** 6 gemi/15 PDF → 15/15 L2 · ham 0.
   **bilezik_detay** eklendi (7 ham İç + 3 SESSİZ Dış — MK-123.C sınıfı); **E100-817-005
   ilk kez söküldü**; bağımsız fix kanıtı G400-817-015 → 2.77. Araç: `node
   scripts/atolye-kosum.mjs <klasör>` (MK-165.5). Hedef: ~10 çeşitli paket daha (Cihat).
4. **dnBul (MK-165.2):** DN basmayan ODxet çizimi (AT110-804) → dominant borunun OD'sinden
   ters eşleme (tek-eşleşme, ±0.15; cunife dahil; 76.1 → null, uydurma yok) → dn=50.
5. **Teyit üçlüsü MÜHÜRLENDİ:** izometri-kaynak ✓ (alistirma/yuzey → `izometri` +
   format_id=e1fb879d DOLU) · **OPR TERFİ ✓ f borcu KAPANDI** (satır indi; kalite='paslanmaz'
   regresyon DEĞİL — operatör kalite girmedi, fallback; adet=null boru için tasarım) ·
   G2a kart ✓ (eşik 3+ doğru; 1'er sinyal dal doğurmaz, NORMAL).
6. **Süreç (MK-165.4/6):** sha temizliği original_log_id üzerinden (cevap_full kuyruk alanı
   taşımaz; "No rows returned" maskeler → SELECT teyidi) · drenaj FİLTRELİ (satırın devresi
   açılmadan işlenmez; M130 için MK-136 `?devre_id=` URL'i kullanıldı) · commit'ler AYRI
   bloklar (&&  zinciri "nothing to commit"te kırılır).

## ⚠ 166'ya işaretler
- **MK-165.7 borçları:** OPR kalem "dn" girişi kabukta dis_cap_mm'e OD sanılıyor
  (DN200→200.0; doğrusu 219.1 — fakir boyutParse; çözüm adayı olcuParse+dnBul) ·
  devre_detay taslak → wizard "düzenle" köprüsü YOK (MK-136 URL'i görünmez) · uyarı
  MÜKERRERLİĞİ (aynı uyarı 2-3 dk arayla çift).
- M130-817-006 eski et uyarısı (2.77↔3.91) duruyor — drenaj dışıydı, düşük öncelik.
- Y200 öğretimi (reçete aynen) · onay kuşağı eritme (162; P26-217=76) · W-2.19 tam dilim
  tasarımı · IZO-KANIT v4 yapıştırma ihtiyacı DÜŞTÜ (atolye-kosum var; AD kararı Cihat'ta).
- Test devresi: **"bn ömn"** (77bfbc98) — M130 dosyaları + OPR kalemi burada; SİLME.
- KARARLAR'a MK-165.1..7 işlendi (bu pakette).

## NEREDEYIZ — ÖZET
165 atölye modelinin rüştünü ispatladığı oturumdu: 164'ün tek vakası üç ayrı zincir kusurunu
(boyut sentezi yokluğu, dn çapası, fallback çift körlüğü) açığa çıkardı ve hepsi gerçek-PDF
kanıtıyla kapandı; tersan.zip koşumu modeli uçtan uca doğruladı ve kalıcı araç bıraktı;
açılış teyit üçlüsü mühürlendi. 12/12, izometri-oku dokunulmadı, migration yok.

---

## 165-EK (aynı gün, kapanış sonrası) — FWC + Sounding paketleri: 3 fix, 180 PDF ham=0
Kapanıştan sonra Cihat 2 paket daha verdi; atölye aracı farkı dakikalar içinde çıkardı:
- **FWC (24 PDF):** 14 ham → 2 desen: Victaulic Groove işlem satırı (12×, glyph yaralı ama
  yapısı sağlam) + 'Bilezik Detay B' **L='Lİ** (165 tetikinin itirafı: 'Bilezik Detay' L='li
  satırı da yutup ham düşürüyordu). Ayrıca dn=25↔cap76.1 tutarsızlığı: 76.1 DIN DN65,
  dnBul ASME-only → null → dn işlem satırından geliyordu.
- **Sounding (141 PDF!):** 52 ham → HEPSİ tek desen (Detay C, L='li, ±L150/L200 etiketi).
- **Fix'ler (commit: tek 165-ek commit'i):** (1) bilezik_detay BİRLEŞİK pattern — opsiyonel
  `L=`; semantik düzeltme: boy_mm = L UZUNLUĞU (klasik konvansiyon; Detay-A'da boy null,
  genişlik haritalanmaz). (2) YENİ `victaulic_groove` işlem tipi (tetik 'Victaulic'; OD ve
  glyph-yaralı kalite kuyruğu HARİTALANMAZ — uydurma yok). (3) dnBul DIN/EN ek haritası
  (33.7→25, 42.4→32, 76.1→65, 139.7→125) — yalnız ASME taraması boş kalınca; tek-eşleşme
  dürüstlüğü aynen. 12/12 mekanik test + **3 paket 180 PDF: fail 0 · ham 0** (tersan
  regresyonu dahil).
- **Katman dökümü (165 sohbet kararına veri):** iki paketin tüm farkı = 2×K2 deseni + 1×K0
  rötuşu; K0+K1 bedava taşındı. 166 adayına ek: FORMAT-KATMAN-HARITASI.md (kural envanterinin
  K0/K1/K2/K3 haritası) + "v1 üretimde" tanımı tartışması. FWC zip'inde IFS excel'leri de var
  → ileride uçtan uca devre testi malzemesi.
