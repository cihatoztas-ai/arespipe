# CLAUDE-SON-OTURUM.md — Oturum 157 özeti

## Tek cümle
NB1124 vakası 44/44 kapandı — ama planlanan regex patch'iyle değil: kanıt zinciri 156 teşhisini
iki kez devirdi (kimlik çıkarımı zaten çalışıyordu; kabukta_yok taslak-yapısaldı; "tablosuz" 22
dosya montaj kanadıydı), asıl kırık 140'tan beri production'da ölü olan eslestirme-backfill çıktı
(ERR_REQUIRE_ESM — 129-130 borcunun kökü, fix(157) ile dirildi) ve montaj formatına tek
dosya_adi_regex öğretimiyle 22 montaj L2/$0 + 22/22 eşleşme alındı.

## Kanıt zinciri (oturumun omurgası — her adım canlı veriyle)
1. Read-before-write: kimlik çıkarımı adresi = kuyruk-isle-izometri.dosyaAdiParse (fingerprint
   değil). Node testi: mevcut regex 9/9 kalıbı TUTUYOR → "kalıp kapsam dışı" hipotezi öldü.
2. SQL anatomi (hhbjşlö 44 PDF): spool PDF'lerinde pipeline 22/22 DOĞRU çıkmış, sebep=kabukta_yok;
   `.SXX`'sizlerde dosya_adi_pipeline_yok (zorlamamış, doğru davranış).
3. Kök neden 1: taslak devrede spooller=0 → eslestir haritası boş → kabukta_yok yapısal (MK-157.1).
4. Terfi turu: 22 spool üretildi, otomatik backfill HTML 500 ile düştü → Vercel log:
   ERR_REQUIRE_ESM (modül-seviyesi createRequire zinciri). Lokal Node 22/20.19 yüklüyor,
   node@20.11 birebir repro → Vercel runtime require(ESM) desteklemiyor (MK-157.2).
5. fix(157): CJS zinciri lazy import()'a (yalnız tip=malzeme dalı; üç dosya UMD-guard'lı,
   globalThis dolar). 3 lokal test yeşil. Deploy → kuru dry-run 22 → gerçek koşu →
   kabukta_yok 22→0, eslesti 22, kismi 22.
6. Kök neden 2: `.SXX`'siz 22 dosya M+İ çiftinin MONTAJ kanadı (montaj_var=false + 1 halüsinasyon
   spool + manuel_onay üretmişlerdi). Fingerprint anatomisi: montaj formatında dosya_adi_regex YOK,
   "Continue:" tek-segmentlide ateşlenmiyor, malzeme tablosu yapısal yok → producer tek başına
   1 < eşik 2 → NULL → genel L3 çöpü (MK-157.3).
7. Montaj öğretimi: 39a2c81b'ye dosya_adi_regex (36/36 ad testi; `.S01` doğal guard, imalat asla
   tutmaz; skor matrisi iki yönde güvenli). Cache analizi: anahtar (sha, format_id), NULL'ken
   sorgulanmaz → düşürme gereksiz. 22 reset → drenaj → 22/22 montaj L2 $0 + eşleşme 22/22.
8. Onay Kuyruğu read-before-write: excel tüketici VAR (onayAktar→aktar), izometri oneri_hazir
   bilinçli YOK (109/A), izometri manuel_onay YOK=DELİK. parse_durumu: ölü/yedek, dokunma.

## Süreç dersleri (157)
- **"Teşhis taze" ≠ teşhis doğru:** 156'nın iki çıkarımı (kalıp kapsam dışı; 2 dosya çözülmüş)
  157'nin ilk iki sorgusunda çürüdü. Patch yazmadan önce hipotezi çürütmeye çalışmak (node regex
  testi, sebep dağılımı SQL'i) bu oturumda iki gereksiz patch'i önledi.
- **Lokal repro ortam-doğru olmalı:** lokal "modül yükleniyor" Vercel'de hiçbir şey kanıtlamaz;
  node@20.11 repro standardı doğdu (MK-157.2).
- **Kuyruk durumu ≠ eşleşme durumu (MK-157.4):** oneri_hazir görmek "bağlandı" demek değil.
- **Dry-run COMMIT'siz kalabiliyor:** fingerprint UPDATE ilk turda ROLLBACK'te kaldı;
  `fingerprint ? 'dosya_adi_regex'` teyit sorgusu yakaladı. Kalıcılık teyidi DML sonrası standart.
- **Rozet ≠ kuyruk gerçeği:** İşlenenler "0" gösterirken kuyruğun 22 bekleyeni vardı; "Bekleyenleri
  işle" global (filtre:{}) olduğu için iş yine de aktı — ama UI metni yanılttı (158 küçük işi).
- **best-effort tasarımı işledi:** backfill çökmesi terfiyi geri almadı, toast hatayı yüzeye çıkardı.

## Canlı kanıt envanteri (157)
- Regex testleri: dosyaAdiParse 9/9 · montaj regex 36/36 (montaj ✓ / imalat ✗ / diğer ✗).
- ERR_REQUIRE_ESM: Vercel log (fra1) + node@20.11 birebir repro + fix sonrası 20.11/22 yükleme ✓.
- Backfill: kuru {22 eşleşebilir} → gerçek {eslesen 22} → SQL {kabukta_yok 0, kismi 22}.
- Montaj: 22/22 format="Tersan M110 Montaj Cizimi", montaj_var=true, eslesen=1/atanmamis=0,
  _l2_meta=object (22/22, $0), durum oneri_hazir (sahte manuel_onay temizlendi).
- NOT: Bu kanıtlar veri katmanını kanıtlar; montaj_json'un devre/spool UI'da görünümü ayrıca
  gözle doğrulanmadı (158 açılışında 1 spool'a bakılabilir).

## Dosyalar (157)
api/eslestirme-backfill.js (194→206: lazy cjsZinciriYukle + malzemeBackfill başı; MD5
d233cd20e3f05acf4136877340acfb54). Commit: fix(157). DB: 39a2c81b fingerprint UPDATE + 22 iş
reset (veri, migration YOK). izometri-oku DOKUNULMADI.

## Kapanış durumu
NB1124 44/44 çözüldü (22 imalat kismi + 22 montaj bağlı). Backfill canlı (129-130 kapandı).
12/12 ✓. Onay Kuyruğu 158'e saf implementasyon olarak hazır (tasarım+veri+tüketici haritası tamam).
W-2.4 örneksiz kaldı, tasarım maddesi olarak açık. Test yatağı: g200 + 265-overboard.
