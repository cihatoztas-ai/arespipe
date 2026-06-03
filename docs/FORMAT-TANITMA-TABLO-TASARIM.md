# Format Tanıtma — Tablo Motoru Tasarımı (150 devir → 151 ANA İŞ)

> 150'de beyaz tahtada kilitlenen tasarımın TAM kaydı. 151 bu dokümanı okur, tartışma TEKRARLANMAZ.
> Tamamlayıcı: FORMAT-TANITMA-URETIM-SPEC.md (genel spec) + CLAUDE-SON-OTURUM.md (150 kararları).

## 0. Tek cümle
Teaching'in operatöre tek sorusu kalır: **"malzeme tablosu nerede?"** — o da AI satır değerleriyle çoğu zaman
otomatik bulunur. Çap/et/dn/sch sorulmaz; hepsi tablonun Boyut sütunundan `olcuParse` ile türer (Cihat kararı, 150).

## 1. Beyaz tahta — soru ağacı çatalı (FİNAL HALİ)
150 başında çizilen ağaç: "Bölge işaretlendi → tek değer mi, tablo mı?" iki yol:
- **Tek değer (spool kabuğu):** spool_no, pipeline_no, yuzey, agirlik_kg, tarih, not_metni → tip+çapa → regex (mevcut akış).
  AI-oku (Increment 1, GEMİDE) bunları zaten değer-çapalı sentezliyor → operatör payı yalnız kırmızılar.
- **Tablo (malzeme):** bölgeyi bir kez yakala → satırlar → Boyut sütunu → olcuParse → çap+et+dn+sch+ağırlık+adet.
- İkisi de aynı yere varır: **deterministik kural → $0 L2.**
150 sonunda çatal sadeleşti: dn/cap_mm/et_mm tek-değer yolundan ÇIKTI (header'da yoklar; M230'da bile tablodan
geliyorlardı). Bu üçü artık tablo yolunun TÜRETİLMİŞ çıktısı. Soru ağacının "Elle ayarla→yönlendirmeli akış"
hedefi de küçüldü: tek-değer alanları AI+B1 ile çözülüyor, geriye kalan tek motor = TABLO MOTORU (bu doküman).

## 2. Kilitli ilkeler (150 — değişmez)
1. **AI değer BULUR, kural yazmaz.** Kuralı biz sentezleriz (cozumle/genKod ruhu). Kanıt: kural çıktısı == AI değeri
   (ground-truth, MK-51.2 çözümü). M230 node kanıtı: 8/9 yeşil.
2. **Sızıntı kuralı:** AI null + cozumle/desen dolu → MÜHÜRLEME. (dn=null vs DN50 İç Bilezik satırı vakası.)
3. **Normalize TEK merkezde:** boyut metni ham yakalanır; çevirme ARES_OLCU.olcuParse → ARES_BORU (format kuralına
   lookup KOPYALANMAZ). ares-normalize felsefesiyle aynı (malzemeKod örüntüsü).
4. **MK-49.1:** izometri-oku frozen (150'de tek kontrollü istisna işlendi: asmeFallback schedule, no-op kanıtlı).
   **MK-129.3:** 12/12, yeni endpoint yok — AI çağrısı mevcut /api/izometri-oku. **MK-111.1/111.2** geçerli.
5. **AI merdiveni** (149+150 finali): 1 AI okur → 2 kural sentezi+doğrula → 3 kırmızıyı elle (B1) → 4 açıklama yaz →
   5 operatör-tetikli 2. AI (pekiştirme; taslak satır prompt_template ile kaydet → izometri-oku tekrar) → mühür.
   Maliyet: format başına 1-2 çağrı (onboarding); üretim $0/L3-tek. %5-10 tezi üretim hacmiyle ölçülür.

## 3. Gemide olan (150 sonu — Increment 2'nin zemini)
- **format_tanit AI-oku (3393eb6):** 🟣 buton → izometri-oku POST (tenant_id, kullanici_id=ARES.oturumAl().id,
  pdf_base64=_fileBase64(fileInput.files[0]), dosya_sirasi/toplami=1) → spoollar[0] → _aiSentezle: cozumle×AI kıyas,
  yeşil mühür / kırmızı + "AI gördü: X" ipucu / sızıntı atla. malzeme_listesi sayılıp a._aiSatirlar'da SAKLANIYOR.
- **schedule zinciri (UYUYOR, kural bekliyor):** l2-parser spool.schedule (6359555) + izometri-oku
  asmeFallbackDoldur→boruOlcuBul schedule paramı (30e995c, MK-49.1 istisna). undefined→varsayılan yol birebir.
  İlk schedule üreten kural kaydedilince canlanır. NOT: boruOlcuBul DB fallback dalı schedule-körü (bugün de
  öyleydi; gerekirse boruEtTolerans'taki schedule_kod=eq. filtresi deseni eklenir — ayrı iş).
- **izometri-oku yan etki analizi:** standalone çağrı = batch satırı + ai_api_log + cache. spooller/izometri
  YAZILMAZ, yukleyen_id (MK-117) tetiklenmez. Güvenli.

## 4. INCREMENT 2 SPEC — iki dosya

### 4.1 format_tanit.html → `_tabloSentezle(aiSatirlar)` (client, additif)
Girdi: AI'ın malzeme_listesi'i (kod, kategori PIPES/FITTINGS/FLANGES, tanim, kalite, dis_cap_mm, et_mm, boy_mm,
adet, agirlik_kg — L3 şeması s.957+). Algoritma:
1. **Satır bulma (değer-çapalı):** CANON_ALL satırları içinde her AI satırını eşle. Çapa öncelik: agirlik_kg
   (en ayırt edici float) → boy_mm → tanim ilk 2-3 kelime. Eşleşmeyen AI satırı → kırmızı satır (operatör bölge
   işaretler = fallback; mevcut bbox akışı duruyor).
2. **Tip sınıflandırma:** AI kategori → boru/fitting/islem eşlemesi (PIPES→boru; FITTINGS/FLANGES→fitting;
   ağırlıksız/`Saha`/kaynak satırları→islem). Aynı tipteki satırlardan ORTAK desen sentezlenir.
3. **Pattern sentezi (genKod ruhu):** satır metninden sütun yakalama grupları: tanim(.+?) + boyut(HAM string!) +
   boy(\d+) + kalite + agirlik(\d+(?:\.\d+)?). `grup_haritasi` ile adlandır. Boyut HAM yakalanır — `boyut` alanı
   olarak (60.3x4.5 / 2" Sch 10S / DN50 hepsi tek grupta). tetikleyici_regex: tip ayırt edici (örn. ^\d+\s+\d+\s+Boru).
4. **Doğrulama (kanıt):** sentezlenen satir_tipleri ile client-side satır çıkarımı koş (malzemeTablosuCikar
   eşleniği — ~40 satır port; l2-parser.js zaten okundu, sözleşme §4.3) → her satır olcuParse(boyut) normalize →
   AI satır değerleriyle alan alan kıyas → tablo yeşili. cap_mm/et_mm/dn çipleri: **"türetilmiş ✓"** durumu
   (yeni dot rengi/mavi): dominant Boru satırının olcuParse çıktısı == AI spool değeri.
5. **Kural yazımı:** parser_kural.malzeme_tablosu = { aktif:true, baslik_tetikleyici:'Malzeme Listesi',
   satir_tipleri:[...] } — `_toplu_ai_bekliyor` KALKAR. alanlar.cap_mm/et_mm/dn YAZILMAZ (türetilmiş).
   kabul_kriterleri.min_malzeme_satir>=1.

### 4.2 lib/l2-parser.js (serbest lib) — satır normalize + spool türetimi
1. **olcuParse bağla:** ares-olcu Node-uyumlu (module.exports; ares-asme require globalThis'e ARES_BORU yazar).
   `await import('../ares-olcu.js')` + ares-asme önce (import sırası!). malzemeTablosuCikar sonrası post-process:
   satırda `boyut` (ham) varsa → olcuParse(boyut, malzeme) → dis_cap_mm/et_mm/dn/sch alanlarını DOLDUR
   (mevcut doluysa EZME — MK-111.2).
2. **Dominant Boru satırı → spool baş ölçüleri:** kategori 'boru' satırlarından en büyük dis_cap'li olan.
   spool.cap_mm/dn/schedule boşsa oradan türet; spool.et_mm: satır et'i varsa o (et_kaynagi='tablo'), yoksa
   null+'pdf_yok' bırak → asmeFallbackDoldur schedule-bilinçli doldurur (zincir canlanır). Boru satırı yoksa türetme.
3. **Mekanik test (mjs, commit öncesi):** üç gerçek metin: M230 (60.3x4.5→direkt 60.3/4.5),
   Y100-817-013 (2" Sch 10S→dn50/sch10S/cap60.3, et asme'den ~2.77), Y100-817-018 (boru 1-1/2" Sch 10S→dn40/cap48.3;
   redüksiyon 3-1/2"x2-1/8" fitting → 2-1/8 NPS tabloda yok→null, ZARARSIZ). Üçü yeşilse gemiye.

### 4.3 satir_tipleri sözleşmesi (l2-parser.malzemeTablosuCikar — birebir, DEĞİŞMEZ)
`{ ad, kategori, tetikleyici_regex, pattern, grup_haritasi:{alanAdi:grupIdx}, malzeme_default? }` +
üst seviye `baslik_tetikleyici` (string includes). _tipCevir: agirlik_kg/cap_mm/et_mm/dis_cap_mm→float;
dn/adet/boy_mm→int; kalite→\s sil; diğer→trim. grup_haritasi varsa adet default 1. Yeni `boyut` alanı string geçer.

## 5. Kenar vakaları (150'de görüldü, çözümleri kilitli)
- **dn sızıntısı:** DN50/DN40 İç Bilezik satırından gelirse YANLIŞ KAYNAK (tesadüfen tutar). dn HEP dominant boru
  satırından. İç Bilezik/kaynak satırları islem/fitting kategorisinde kalır.
- **Redüksiyon ikinci boyutu (2-1/8"):** NPS_DN tablosunda yok → olcuParse null → fitting satırında sorun değil.
- **Ağırlık tabanı:** PDF satır ağırlığı toplam-mu-birim-mi (dirsek 323.9 borcu, ayrı oturum) — Increment 2'de
  ağırlık yalnız satır eşleme çapası olarak kullanılır, normalize edilmez.
- **AI prompt sapması:** L3 "yazılı değilse null dön" der ama 60.3/48.3 gibi çevrilmiş değer dönebiliyor —
  sorun değil, tam tersi: kıyas hedefimiz o.

## 6. Increment 2 SONRASI kuyruk (sıralı, 151+)
1. **Pekiştirme bağlama** (merdiven 5): açıklama → taslak format satırı (fingerprint.dosya_adi_regex set) +
   prompt_template → izometri-oku tekrar → kıyas. izometri-oku DEĞİŞMEDEN.
2. **requires_ai dürüstlüğü:** kırmızı kalan alan(lar) varken kaydet → alan bazlı işaret/prompt_template
   ("$0'a indi" yalanı yok).
3. **Tetik butonu:** uyarilar.html / wizard inceleme zayıf-satır → format_tanit?format_id=&alan= (URL hazır).
4. **Propagasyon:** kayıttan sonra eslestirme-backfill ile eski L3 PDF'ler yeni kuralla.
5. bbox→PDF-point normalize · boruOlcuBul DB fallback schedule filtresi · ai_api_log L3 pay ölçümü.

## 7. 151 read-before-write (koda BAŞLAMADAN)
1. format_tanit.html GÜNCEL hali (701 satır, 3393eb6) — tamamlaAc/buildParserKural/kaydet üç yolu (tablo yazımı
   buralara bağlanacak). 2. Kayıtlı tersan kuralının parser_kural.malzeme_tablosu SQL dökümü (satir_tipleri dolu mu?
   HÂLÂ GÖRÜLMEDİ — Cihat'tan 1 SELECT). 3. ares-asme'nin Node require davranışı (globalThis yazımı) — l2-parser
   import sırası. 4. CI yeşil + M230 regresyon teyidi (izometri-oku istisnası sonrası davranış aynı mı).
