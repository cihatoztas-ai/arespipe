# FORMAT ÖĞRETİMİ — ATÖLYE KARARI VE TEKNİK İNCELEME (Oturum 162, 2026-06-06)

> Bu doküman 162'de yapılan "format tanıma mantığını elden geçirme" incelemesinin çıktısıdır.
> İki bölümden oluşur: (1) kanıtlanmış teknik bulgular, (2) ürün kararı + yeni çalışma modeli.
> Tetikleyici: Y200 pipeline_no öğretiminde kural/AI/UI üçlüsünün üç farklı değer vermesi
> (G200 / Y110 / Y200) + Cihat'ın "normal kullanıcı bunu yapamaz" gözlemi.

---

## BÖLÜM 1 — KANITLANMIŞ TEKNİK BULGULAR

### B1. Tarayıcı metni ≠ sunucu metni (KÖK BULGU)
- **Sunucu hattı** (kuyruk → pdf-parse → glyph-onar): content-stream sırası.
  Y200 PDF'inde değer satırı (17: `Y200-804-414`) Continue satırlarından (65/70) ÖNCE gelir.
- **Tarayıcı hattı** (format_tanit `extractAll`): pdf.js getTextContent + Y-koordinat
  gruplama = GÖRSEL sıra. Continue anotasyonları sayfa ortasında, başlık bloğu altta →
  Continue değerleri başlık değerinden ÖNCE gelir.
- **Sonuç:** Aynı regex iki metinde farklı "ilk eşleşme" verir. UI'daki yeşil/kırmızı bu tip
  alanlar için KANIT DEĞİLDİR. Gerçek kanıt makamı: drenaj sonrası kuyruk/log SQL'i.
- **Kanıt:** /tmp/y200-test.mjs + y200-test2.mjs — sunucu metninde hem `^([A-Z]\d+-\d+-\d+)$`(m)
  hem synth-deseni `\n([A-Z]\d+-\d+-\d+)\n` → Y200-804-414. UI aynı PDF'te G200 dedi.

### B2. Çapa mekanizması: motorda kavram yok, synth'te regex'e gömülü, cozumle bypass ediyor
- `lib/l2-parser.js alanCikar`: düz `text.match(regex)` — "etiket/satır" kavramı yok (doğru
  tasarım: kural tek regex'te taşınır).
- `format_tanit synth()` (461): çapayı regex'e doğru işliyor (`\n(core)\n`, `ETIKET\s*(core)`).
- **Kusur:** `cozumle()` (469, oto-çözüm yolu) pipeline_no için çapasız çıplak regex üretiyor —
  synth disiplinini bypass. DB'deki eski `(Y\d+-\d+-\d+)` kuralı bu yoldan doğmuştu.
- **Ek:** Cadmatic şablonunda "Etiketin ardından" YAPISAL ÖLÜ — değerler etiket bloğundan
  önce basılıyor (satır 16-23 değerler, 46-53 etiketler). Doğru model: "kendi satırında".

### B3. Bölge kodu ≠ format (Cihat, 162)
Y200/G200/E120 vb. geminin bölge/sistem kodlarıdır. Aynı desen başka bölgelerde, aynı bölgede
başka desenler olabilir (farklı dizayn ofisleri). Sonuçlar:
- pipeline_no kuralı `[A-Z]` ile genel yazıldı (Y'ye kilitlenmez).
- Format ADLARI yapısal kimliği anlatmalı ("tersan deneme" → düzeltilecek; "Y-ailesi" gibi
  kısaltmalar da terk edilir). a093eaaa format_kodu=`cadmatic_spool_nps_v1` — kod/aile
  haritası ayrıca gözden geçirilmeli (Y200 satırı ODxet notasyonu, kod "nps" diyor).
- otoTespit'in dosya/bölge sinyaline güveni daha da tehlikeli (B5).

### B4. Sessiz fallback
`alanCikar`: `if(!match) return alanTanim.fallback || null` — eşleşmeme ile fallback-uydurma
ayrımı çağırana gitmiyor. "No silent failures" merceğinde işaretli. (Bugün kural yok; mevcut
kurallarda fallback kullanımı taranmalı.)

### B5. otoTespit açığı — üçüncü kez tetiklendi
161: E120 → "tersan deneme". 162: E100-817-005 → yine "tersan deneme" (5/6 skor), modal
satır-deseni kaydına bir tık kaldı. Yalnız skor yarışı + ⚠ banner atlama. Atölye modelinde
risk iki uzmana iner ama tasarım borcu KALIR: üretim formatı teyidi (kuyruk gerçeği) olmadan
"eşleşti" güveni verilmemeli.

### B6. "Güncelle → değişiklik yok" ŞÜPHESİ (Y200'de doğrulanacak)
162'de E100 açıkken malzeme tablosu öğretildi, modal satir_tipleri JSON'unu gösterdi, Güncelle
"değişiklik yok" dedi, DB'de satir_tipi_sayisi=0 kaldı. Bu kez ŞANS (yanlış PDF'ti) ama:
`_patchedKural` `a.tip!=='tablo'` filtreliyor — tablo öğretiminin düzeltme-kipi yazım yolu
ayrı ve o yol çalışmamış olabilir. Y200 kaydında İLK kontrol maddesi.

### B7. Motor kopyası drifti
`format_tanit._alanCikar` (211) = l2-parser kopyası, ŞİMDİDEN sapmış (whitelist dalı yok).
Tek kaynak ilkesi ihlali (ares-tablo-sentez bunu doğru yapıyor: aynı modül iki tarafta).

### B8. Kayıt altına alınan kazanımlar (162)
- pipeline_no kuralı KANITLI ve GEMİDE: a093eaaa `parser_kural.alanlar.pipeline_no` =
  `\n([A-Z]\d+-\d+-\d+)\n` (jsonb_set ile, 162). Sunucu metninde Y200-804-414 verdiği
  mekanik kanıtlı.
- Hibrit kayıt sırası dersi: SQL-önce yazıldıysa UI'da o alana DOKUNULMAZ (dirty olursa
  Güncelle ezer). `_patchedKural` derin-kopya + yalnız-dirty (MK-111.2) — SQL kayıtları
  dokunulmadıkça güvende.
- Şema gerçeği: `format_id`/`parser_seviye`/`maliyet_usd`/`pdf_sha256` → **ai_api_log**
  doğrudan kolonları; `is_kuyrugu` log'a `ai_api_log_id` ile bağlanır. Kanıt JOIN şablonu:
  `is_kuyrugu k LEFT JOIN ai_api_log l ON l.id=k.ai_api_log_id`.
- E100-817-005 is_kuyrugu'da YOK (hiç işlenmemiş) — E-ailesi kanıtları başka kuyruk/batch
  yolundan aranacak.

---

## BÖLÜM 2 — ÜRÜN KARARI VE ÇALIŞMA MODELİ

### MK-162.1 [URUN] — format_tanit operatör ürünü değil, UZMAN ARACIDIR
Gerekçe: 161+162'de iki uzman, kaynak kod + SQL erişimiyle, tek alanın kuralını ancak motor
içlerini söküp kanıtlayarak yazabildi; UI testi iki kez yanılttı (B1), adres iki oturumda iki
kez yanlış formata gitmek üzereydi (B5). Normal kullanıcı bu akıştan sağ çıkamaz.
- Menü girişi kaldırıldı (`6a27723`). Sayfa feature-flag korumalı yaşamaya devam eder
  (tenant_features.format_tanit, MK-159.2); batch "Tanıt" köprüsü uzman çalışma aracı olarak
  kalır.
- Kullanıcıya açılma şartı: C yolu (aşağıda) olgunlaşması.

### Atölye çalışma modeli (yeni standart)
Format öğretimi Cihat + Claude tarafından yapılır:
1. Cihat çeşitli gemi/devre PDF'lerini zip olarak verir (Claude ortamına yüklenebilir).
2. Claude sunucu metni dökümünü çıkarır (pdf-parse + glyph-onar — B1 gereği TEK doğru metin).
3. Kural adayları bu metin üzerinde mekanik test edilir (kanıt: kural çıktısı == beklenen).
4. Kayıt SQL ile (jsonb_set, şema-önce MK-85.3). UI yalnız bölge işaretleme gerektiğinde
   (malzeme tablosu bbox) kullanılır — hibrit sırası: önce UI işi, SQL son söz.
5. Kanıt: kuyruk reset → drenaj → JOIN sorgusu (format_id + parser_seviye=l2 + maliyet 0).

### Vizyon merdiveni
- **A (bugün):** atölye modeli — yukarıdaki akış.
- **C (ufuk):** otomatik kural önerisi — yeni ailenin ilk L3 çıktılarından sentez motoru kural
  ÖNERİR, uzman onaylar. Öğretim ekranı onay ekranına dönüşür. OCR hattı (Pro sonrası,
  vektör-kilitli aile) aynı döngüye besleme olur: render→OCR→L2; desen GERÇEK OCR çıktısından
  öğretilir (MK-132.1).
- B (bölge-only sadeleşme UI'sı) ara durağı ATLANDI — atölye varken UI yatırımı erken.

### MK-162.2 [URUN] — G2a → öğrenme köprüsü (MK-160.2 inceltmesi)
Düzelt=değer, Tanıt=kural ayrımı KORUNUR: operatör düzeltmesi hiçbir zaman doğrudan kurala
dönüşmez. Ancak `taslak_duzeltmeleri` etiketli veridir ("sistem X dedi, insan Y dedi"):
- Yakın iş: format_id+alan bazlı birikim raporu — aynı yönde sistematik düzeltme (örn. 3+)
  → uzmanlara "format kuralı şüphesi" sinyali (SQL görünümü + panel kutusu kadar iş).
- Ufuk (C ile birleşir): düzeltme birikimi sentez motoruna girdi olur → kural ÖNERİSİ üretir,
  öneri uzmandan geçer. İlke: düzeltme kurala dönüşmez; BİRİKİM öneriye dönüşür, öneri
  ONAYDAN geçer.

### Wizard soru sadeleşmesi (Cihat önerisi, kabul)
cap/et/dn ayrı alan olarak ÖĞRETİLMEZ — malzeme tablosu sentezinden türer (W-3.9 zaten
zorunlu kılıyor; modal metni de söylüyor: "Çap/et/DN ayrı sorulmaz — Boyut sütunundan türer").
Atölye akışında öğretim çekirdeği: KİMLİK (spool_no, pipeline_no) + MALZEME BÖLGESİ
(+ opsiyoneller: yuzey/tarih/not). Normalize + kütüphane eşleşmesi güvenlik ağı.

### Borç listesi revizyonu (A kararının temettüsü)
DÜŞTÜ: format_tanit EN/AR dil paketi · B2 kartı · wizard soru-akışı UI sadeleşmesi (yöntem oldu).
İNDİ: W-2.19 dilim 1 (uzman konforu) · öğretim-testi/sunucu-metni UI hizalaması (C yoluna
devredildi — atölyede zaten sunucu metniyle çalışılıyor) · otoTespit çapraz doğrulama
(aciliyet düştü, tasarım borcu kaldı — B5).
KALDI (çekirdek): Y200 öğretim kaydı (reçete hazır — aşağıda) · W-3.4 yayılım kanıtı ·
B6 doğrulaması · dosya_isleme_kuyrugu 100+ stuck drenajı · Sefine/PAOR excel hatları ·
Pro sonrası mimari tur (MK-129.3 + cron + OCR fizibilite) · MK-117 (yukleyen_id) ·
motor kopyası tekleştirme (B7) · sessiz fallback taraması (B4) · format ad/kod düzeltmeleri (B3).

---

## Y200 KAYIT REÇETESİ (dosyaya erişilince — 5 dk)
1. Sert yenile → format seç (a093eaaa) → pipeline_no'ya DOKUNMA (UI kırmızı/G200 gösterebilir
   — B1 gereği yanlış alarm).
2. malzeme_tablosu bölgesi → AI oku → sentez → 🧮 zorunlu çip + elle işaretleme reddi (W-3.9
   canlı kanıtı) → Güncelle.
3. **B6 kontrolü:** Güncelle sonrası SELECT — satir_tipi_sayisi 2→N olmalı. "Değişiklik yok"
   derse tablo yazım yolu kırık → tamir öne alınır.
4. Doğrulama SELECT'inde pipeline_no kuralının DEĞİŞMEDİĞİ teyidi (`\n([A-Z]...`).
5. Yayılım: hedefli pdf_sha256 NULL (kural sonrası aynı-gün L2 sha'ları DAHİL — 155 tuzağı) →
   kardeş kuyruk reset (.SXX filtresi) → drenaj → kanıt JOIN: format_id=a093eaaa +
   parser_seviye=l2 + maliyet_usd=0 + pipeline=Y200-804-414 + ham_satir düşmesi yok.
6. Ad düzeltmesi: UPDATE ad ("tersan deneme" → yapısal ad, B3 ilkesi).

---

## 163 SONUÇ EKİ (2026-06-06) — bulguların akıbeti
- **B6 → HÜKME BAĞLANDI:** yazım yolu SAĞLAMDI; kapı = sentez `yesil>0` şartı (ve sentezin
  CANON_ALL/tarayıcı metninde koşması — B1'in tablo izdüşümü). Bonus kusur: `tamamlaAc`
  önizlemesi tablo patch'ini içermiyordu (önizleme≠yazım). Üçü de yamalandı (D1/D2/D3,
  13/13 test). **REÇETE 2. ADIMINA EK ŞART:** Güncelle'den önce "🧮 N satır tipi sentezlendi ·
  X yeşil" kutusu görülmeli; "Sentez başarısız" varken Güncelle'ye basılmaz (yeni toast zaten
  "tablo YAZILMAZ" der).
- **B7 → KAPANDI:** çekirdek `ares-alan-cikar.js`; kopyalar silindi (whitelist'e ek
  format_template dalının da eksik olduğu görüldü). l2-parser/format_tanit delege.
- **B4 → ÖLÇÜLDÜ, TEORİK:** F1 taraması — 27 kayıtlı alan kuralında fallback/whitelist/
  format_template kullanımı SIFIR. Davranış bilinçli korundu; görünürlük ihtiyacı doğarsa
  artık TEK yerden eklenir (çekirdek başlık yorumunda işli).
- **B3 → UYGULANDI:** a093eaaa ad+kod (`tersan_cadmatic_spool_ogretim_v1`) + iki katalog
  ailesinin adı yapısala döndü. format_kodu YASAK kümesi = AILE_KAYIT anahtarları (MK-119.2).
- **B5 → KÖKÜ GÖRÜNÜR:** a093eaaa ↔ e1fb879d aynı yapısal aile; iki format aynı spool
  PDF'inin iki ayrı başlığına parmak basıyor. Çapraz-doğrulama tasarım borcu DURUYOR
  (aciliyet atölye modeliyle düşük).
- **B8 güncel kalemler:** "100+ stuck dosya_isleme_kuyrugu" ve MK-117 HAYALET çıktı —
  153-155'te çözülmüş, 163 SQL denetimi teyitli (MK-163.1 dersi). Onay birikiminin 281'i
  (22 May test kuşağı) iptal edildi.
- **MK-162.2 yakın işi GEMİDE:** migration 102 `g2a_duzeltme_sinyali` + uyarilar kutusu;
  v2 (format bağı) 164 keşfine bağlı.


---

## 164 EKİ (2026-06-06) — MK-162.2 v2 gemide + atölyeye yeni girdiler
- **MK-162.2 v2 TAMAM (A kararı):** düzeltme kaydı kaynağını taşır (`deger_kaynagi` +
  `format_id`, migration 103). 164-B1: v1 sinyallerinin kaynağı Excel kabuktu — kart metni
  PDF format kuralına yanlış adres veriyordu; artık kaynak-dallı. format_tanit B2 düzeltmesi
  `izometri`+öğretilen format_id yazar → birikim doğrudan formata adreslenir. Düzelt=değer /
  Tanıt=kural ayrımı AYNEN (öneri uzman onayından geçer).
- **Y200 reçetesine 164 eki:** tablo bölgesi işaretleme artık NORM bbox üretir (W-4.4) ve
  kayıt sonrası wizard'daki **🔍 Tablo** zoom'u otomatik canlanır — öğretimin operatör-görünür
  ilk temettüsü. Reçete sırası değişmedi (163 yeşil-kutu şartı dahil).
- **Atölyeye yeni vaka:** M130-817-008.S01 cap 42.2/et 3.56 (kuyruk: e1fb879d KATALOG-PAKET,
  L2). Adres paket kuralı (MK-155.1 — DB patch değil, kod+deploy). Hipotez: redüksiyon küçük
  ucu çap seçimi + schedule et karışması. İnceleme yöntemi: sunucu parse_sonuc dökümü +
  paket kuralı okuması; JSONB anahtarları örnekten teyit (MK-85.3).
- B5 çapraz-doğrulama tasarım borcu DURUYOR (değişmedi).

---

## 165 EKİ (2026-06-07) — atölye modelinin ilk TAM uygulaması (Bölüm 2 akışı uçtan uca koştu)
- **Akış birebir işledi:** (1) Cihat zip verdi (tersan.zip — 6 gemi/15 PDF: nb1110/1124/1130/
  1135/1136/1137); (2) Claude sunucu metni döktü (pdfParse+glyph-onar); (3) kural adayları
  mekanik test edildi (bilezik_detay: 10/10 gerçek satır); (4) kayıt PAKET KODUYLA (katalog
  ailesi — MK-155.1, SQL değil); (5) kanıt: koşum 15/15 L2 · ham 0 + canlı drenaj JOIN
  (M130 S01/S02 → 60.3/2.77/SCH 10S).
- **Araç kalıcılaştı:** `scripts/atolye-kosum.mjs <pdf_klasoru>` (MK-165.5) — adım 2-3-5'in
  otomasyonu; ~30 sn/15 PDF. "Çeşitli gemilerden ~10 paket" hedefi (Cihat) bu araçla işlenir.
- **Atölyenin ilk iki tür hasadı:** (a) SESSİZ düşüş yakalama — 'Dış Bilezik Detay' satırları
  ham bile değildi (tetik uymuyor, B4/MK-123.C sınıfı), yalnız gerçek-set taramasıyla görünür;
  (b) motor-katmanı kökü — 42.2/3.56 vakasında suçlu paket regex'i değil, zincirdi (boyut
  sentezi eksikliği + dn çapası + fallback çift körlüğü). Atölye yalnız "format öğretimi"
  değil, PARSE ZİNCİRİ teşhis aracı olarak da çalışıyor.
- **B1 teyidi pekişti (MK-162.3):** UI yine yanılttı (kuyruk "satirlar=0" okuması ↔ gerçek 3
  temiz satır); hüküm parse_sonuc jsonb_pretty dökümü + drenaj SQL'inden verildi.
- 164 ekindeki M130 vakası kapandı; reçeteler (Y200 dahil) değişmedi.

---

## 166 EKİ (2026-06-08) — format öğretimi ATLANDI (düzen turu)
- Cihat kararı: bu oturum format tanıtma maddelerine girilmedi; sayfa düzeni + okunan-değer
  fidelity'sine odaklanıldı (bkz. WIZARD-YOL-HARITASI 166 İŞARETLERİ). Y200 öğretim reçetesi
  (yukarıdaki) AYNEN bekliyor — diğer bilgisayar gerektiğinde.
- **W-2.19 komşusu — kalem-zoom GEMİDE:** "değer→koordinat envanteri" tasarım borcuna girmeden,
  ✏️'ye basınca alan değeri pdf.js metin katmanında aranıp zoom yapılıyor (satır gruplama ile
  parçalı Cadmatic metni dahil). 🔍 Tablo butonu norm bbox yoksa "Malzeme Listesi" başlığını arıyor;
  Y200 tablo öğretimi yapıldığı an `konum_ipucu` norm bbox'ına otomatik terfi eder (reçete değişmedi).
- B5 çapraz-doğrulama tasarım borcu DURUYOR (değişmedi). otoTespit güveni (B5) hâlâ açık.
