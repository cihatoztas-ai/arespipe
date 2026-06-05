# Format Tanıtma / Çapa — Üretim Spec (oturum 148 devir)

> Prototip (capa-prototip-v4.html) ile doğrulandı. Bu doküman koda geçiş için tek kaynak.

## Amaç
Tanınmayan izometri PDF formatı (L3'e düşen) geldiğinde: operatör alanları **kabaca** işaretler → deterministik `cozumle()` değer + regex üretir → `izometri_format_tanimlari`'na kayıt → aynı formatın sonraki tüm PDF'leri L2'den okunur ($0). Hedef: AI payı %100 → %5-10.

## Mimari (KİLİTLİ — prototiple doğrulandı)
- **Çıktı = `izometri_format_tanimlari` satırı** (fingerprint + parser_kural + prompt_template). Doğrudan Supabase insert/update. **YENİ ENDPOINT YOK** (MK-129.3, 12/12 fonksiyon korunur).
- **izometri-oku.js DEĞİŞMEZ** (MK-49.1). Üç okuma noktası zaten var:
  - `parser_kural` → L2 (satır ~215)
  - `prompt_template` → L3 sistem promptu (satır 589 okur, 721 kullanır)
  - `fingerprint` → tanıma (dosya_adi_regex +5, pdf_uretici_anahtar +1, baslik_regex)
- **Metin motoru = pdf-parse'ın kendi pdfjs'i v1.10.100.** Tarayıcıda da sunucuyla BİREBİR temiz metin verdiği prob ile kanıtlandı (yeni PDF.js v3 garbliyordu — atıldı).
  - Üretimde **vendor'lanmalı**: `node_modules` Vercel'de servis edilmez → `pdf.js` + `pdf.worker.js`'i servis edilen `/vendor/pdfjs-1.10.100/`'e kopyala.
- **glyph-onar** çıkarılan metne uygulanır (temizse no-op, kaymışsa onarır) → tarayıcı = sunucu. Bu PDF ailesi temiz; band-B borcu ayrı PDF'lerle (NB1137) ilgili.
- **`cozumle()`** = bölge → değer + **boşluk-dayanıklı** regex (`\n`'e bağlı değil → tarayıcı↔sunucu taşınabilir). 9/9 gerçek M100 metnine karşı node ile doğrulandı. **AI değil, deterministik, runtime'da da $0.**
  - **AI yalnız**: malzeme tablosu satır desenleri + cozumle'nin tanıyamadığı alanlar. Sonda, toplu, operatör onayıyla (MK-148.1). → 150: AI'nın rolü DEĞİŞTİ, aşağıya bak.

## UX (v4'te oturdu)
- Panel **sol**, PDF **sağ**. Pinch / ctrl+tekerlek = imlece zoom; iki parmak / sürükle = pan.
- Alan başına **tek adım**: "alanı kutuyla çevrele" → otomatik tanı → tanıdıysa **Sonraki** (2. tık yok). Tanıyamazsa "Elle ayarla" otomatik açılır (tip / çapa / regex fallback).
- Malzeme: bölge işaretle → satır desenleri sonda toplu AI (üretimde gerçek L3 çağrısı). → 150: deterministik sentez (TABLO-TASARIM.md)
- Tamamla: kapsam (sadece bu PDF / **formatın tümü = G3 yayılım**) + JSON önizleme.

## Üretim yapılacaklar (SIRA)
1. **pdfjs v1.10.100 vendor** → `/vendor/pdfjs-1.10.100/`. (servis edildiğini kontrol et) ✅ 148
2. **`format_tanit.html`** — v4'ten türet; uygulamanın auth / nav / supabase init'iyle entegre. **Feature flag** (devre_wizard_v3 deseni). ✅ 148
3. **Supabase yazma** — `izometri_format_tanimlari` upsert (fingerprint / parser_kural / prompt_template / tenant_id). RLS: `get_tenant_id()` deseni. Şemayı doğrula (MK-85.3, BEGIN/ROLLBACK gerekirse MK-98.2). ✅ 148 (insert) + 149 (INSERT→UPDATE dedup)
4. **Tetik** — izometri-oku formatı tanımadığında (format_id null → L3) `uyarilar.html` / wizard inceleme'de "Bu formatı tanıt" butonu → bu sayfa. ⏳ (giriş noktaları hazır: ?format_id=&alan= + picker)
5. **Kaydet sonrası propagasyon** — `eslestirme-backfill.js` (zaten var) ile eski L3 PDF'leri yeni L2 kuralıyla yeniden parse → format ailesi $0'a geçer. ⏳
6. **Paylaşılan çekirdek** (sonra) — `cozumle()` + mini-çapa bileşeni → wizard inceleme tek-alan düzeltme + spool_detay "çizimden düzelt". ⏳ (B1 düzeltme kipi çekirdeği 149'da kuruldu)

## Küçük iyileştirmeler (koda alırken)
- **bbox'ı PDF-point'e normalize et** (şu an render-px, scale'e bağlı). konum_ipucu opsiyonel/l2 yoksayıyor ama düzelt. ⏳ açık
- `format_kodu` zorunlu olsun (şu an "(adsız)") — operatörden iste.
- Malzeme toplu AI: gerçek L3 çağrısı + 7 `satir_tipleri` deseni sentezi. → 150: deterministik sentezle DEĞİŞTİ
- cozumle desen havuzunu yeni format aileleri geldikçe genişlet (paor_aveva vb.). ⏳

## Read-before-write (koda BAŞLAMADAN — bu oturumda toplanacak)
1. `izometri_format_tanimlari` tam şema: kolonlar, NOT NULL, `prompt_template` kolonu var mı, `format_kodu` mu `format_adi` mı, fingerprint kolon mu JSONB mi. ✅ 149 (şema dökümü alındı: id/ad NOT NULL, parser_kural+fingerprint jsonb NOT NULL default '{}', prompt_template text null, egitim_kaynagi default 'vision_only', requires_ai default true, format_kodu text null, guncelleme_at NOT NULL default now())
2. Bir sayfanın supabase init + insert/upsert deseni (ör. devre_wizard_v3.html başı). ✅
3. Feature flag kontrol mekanizması (devre_wizard_v3 flag'i nasıl okunuyor). ✅ (tenant_features.feature_kod='format_tanit')

## Doğrulanmış gerçekler (kanıt)
- pdf-parse + glyph-onar → M100 metni `durum: temiz`, tertemiz (node).
- pdfjs v1.10.100 tarayıcıda → aynı temiz metin (prob, ekran görüntüsü yeşil).
- cozumle 9/9: spool S01, pipeline -M100-303-013-ALS (etiket sıyrıldı), dn 32, cap 42.4, et 3.6, ağırlık 3.6, yüzey Galvaniz, tarih 09-01-25, not metni.
- Gerçek referans kural: `tersan_cadmatic_spool` (id e1fb879d) — cozumle çıktısı bununla uyumlu.

---

## OTURUM 149 GÜNCELLEME — B1 + A + B + prompt_template tamamlandı

### B1 — Düzeltme kipi (hedefli tek-alan çapa) ✅
- Tanınan format yüklenir (URL `?format_id=` veya picker) → kayıtlı regex'ler hidratlanır → operatör sorunlu alanı yeniden işaretler → **yalnız o alan** `parser_kural.alanlar` içinde PATCH'lenir.
- **Patch, rebuild DEĞİL (MK-111.2):** `_mevcutKural` derin kopyalanır, yalnız `_dirty` alanlar üzerine yazılır. malzeme_tablosu / kabul_kriterleri / AI satır desenleri korunur. UPDATE `.eq('id')` + `guncelleme_at`.
- Dirty takibi: setRegex / reSynth / captureBox-cozumle → `a._dirty=true`. _initAlan `_dirty=false` sıfırlar.

### INSERT→UPDATE borcu kapandı ✅
- Yeni kipte kaydetmeden önce `fingerprint.dosya_adi_regex + tenant` ile mevcut satır aranır (JS-tarafı, küçük küme). Varsa onay → UPDATE (alanlar merge, malzeme_tablosu/kabul_kriterleri korunur), yoksa INSERT. Çift satır sorunu bitti.

### A — İçerik-bazlı oto-tespit ✅ (spec'te yoktu, eklendi)
- PDF açılınca `otoTespit()`: tenant'ın tüm L2 formatlarının (`requires_ai=false`) `parser_kural.alanlar` regex'leri `CANON_ALL`'a koşulur, **en çok alan okuyan** kazanır. Eşik: `skor>=3 || (skor>=2 && skor>=top*0.5)`.
- İyi skorsa otomatik düzeltme kipine girer; banner "🎯 Otomatik eşleşti: X · N/M alan okundu". Düşükse yeni format kipi. Picker manuel override + boş seçim → yeni kip.
- **Karar (Cihat):** İçerik-eşleşmesi seçildi (fingerprint değil) — kimlik (dosya adı/üretici) farklı sürüm olsa bile kural tutuyorsa yakalar. Production routing fingerprint'le devam eder (ayrı mesele).
- **Canlı:** M110-306-SP13.S02 picker'a dokunmadan → tersan test 8/8 alan okundu.

### B — Alan yeşil/kırmızı ✅
- `_alanlariKos()`: her alanın regex'i CANON_ALL'a koşulur → `a._okudu` (true/false/null). renderDots: yeşil (okudu/regexli) · kırmızı (okuyamadı) · nötr (formatta tanımsız). İlk kırmızı alana otomatik atlar → operatör PDF avlamadan görür.

### prompt_template (AI sözlü tarif) ✅
- **Karar (Cihat sorusu):** AI'a sözlü tarif yazılabilsin mi → evet, `prompt_template` (zaten kolon, L3'te okunuyor). Tamamla ekranına textarea eklendi. Insert/dedup-update/düzeltme — üç yola da bağlı. Yalnız L3 fallback'te kullanılır, deterministik kuralın yerine geçmez.
- Alan-bazlı `ai_ipucu` ileriye bırakıldı (gerçek ihtiyaç doğunca; ölü alan açma).

### CI düzeltmesi
- format_tanit.html'e `ares-layout.js` eklendi + atlama listesine `format_tanit` (tam-ekran araç, sidebar enjekte edilmez). Eski _arsiv md'leri untrack edildi.

### 150'ye taşınan
- **Soru ağacı** (ana tema): "Elle ayarla" → yönlendirmeli akış. Tek motor, AI öncesi + sonrası iki yerde.
- **AI merdiveni** (operatör tetikli 2. çağrı + mühür mantığı).
- Tetik butonu, kaydet sonrası propagasyon, malzeme toplu AI, bbox normalize.

---

## OTURUM 150 GÜNCELLEME — AI-öncelikli mimari + schedule zinciri

### Mimari revizyon (Cihat kararı — spec'in "AI yalnız sonda" maddesi DEĞİŞTİ)
- **AI merdiveni finali:** 1) AI okur (mevcut /api/izometri-oku L3 — YENİ endpoint yok, izometri-oku değişmedi) →
  2) değerlerden kural sentezi (cozumle) + doğrulama (**kural çıktısı == AI değeri** = ground-truth) →
  3) kırmızıları elle tamir (B1) → 4) açıklama (prompt_template) → 5) operatör-tetikli 2. AI (pekiştirme) → mühür.
- **Sızıntı kuralı:** AI null + cozumle dolu → mühürleme. **Maliyet:** onboarding format başına 1-2 çağrı; üretim $0.
- AI-oku ✅ GEMİDE (`3393eb6`): 🟣 buton, _aiSentezle, "AI gördü: X" ipuçları, _aiSatirlar saklama. Canlı: Y100-817-013/018.

### Türetilmiş ölçü zinciri ✅ GEMİDE (uyuyor)
- Y100 ailesi: Boyut = "2\" Sch 10S" (60.3 metinde yok) → regex değil ÇEVİRME. Tek merkez: ARES_OLCU.olcuParse →
  ARES_BORU (Node-uyumlu). l2-parser spool.schedule (`6359555`) + **MK-49.1 kontrollü istisna** (`30e995c`):
  asmeFallbackDoldur→boruOlcuBul schedule paramı, undefined=no-op kanıtlı. İlk schedule'lı kuralda canlanır.
- Not: boruOlcuBul DB fallback dalı schedule-körü (bugün de öyleydi) — gerekirse boruEtTolerans filtre deseni (kuyruk).

### Tablo motoru (151 ANA İŞ) — "Malzeme toplu AI" maddesinin yerini aldı
- Cihat finali: teaching'in TEK sorusu "malzeme tablosu nerede" (çoğu zaman o da otomatik — AI satır değerleriyle
  değer-çapalı bulunur). cap_mm/et_mm/dn alanları tablodan TÜRETİLİR, ayrı sorulmaz/yazılmaz.
- **TAM SPEC: docs/FORMAT-TANITMA-TABLO-TASARIM.md** (algoritma, l2-parser değişiklikleri, satir_tipleri sözleşmesi,
  3-PDF mekanik test düzeni, kenar vakaları, sonrası kuyruğu). 151 bu dokümanla açılır.

---

## OTURUM 151 GÜNCELLEME — Tablo motoru GEMİDE + bulaşma vakası + ERTELEME

### Tablo motoru (Increment 2) ✅ GEMİDE — `593c51b` (spec'in "Malzeme toplu AI" maddesi KAPANDI)
- **`ares-tablo-sentez.js` (YENİ, root, UMD — ares-olcu deseni):** AI satır değerlerinden deterministik
  `satir_tipleri` sentezi. Tek kaynak: aynı modül format_tanit'te (script src) ve Node mekanik testinde koşar
  (MK-126.8 — tasarımdaki "~40 satır client port" yerine kopya-kod sıfırlandı; tek bilinçli implementasyon sapması).
- **Algoritma:** değer-çapalı satır bulma (agirlik+3/boy+2/tanim kelime+1, eşik≥2) → kategoriCevir
  (PIPES→boru · FITTINGS/FLANGES→fitting · KAYNA|GROOVE|SAHA/ağırlıksız→islem) → span-ikame desen sentezi
  (boyut HAM tek grupta: NPS+Sch / ODxet / DN; KALITE_CORE alternation havuzu; segmentler genSeg ile
  literalleştirilir, `^...$` anchor) → **satır-bazlı doğrulama**: runtime tetik sırası (ilk eşleşen kazanır)
  + desen + olcuParse normalize + AI kıyas (±0.05). Kanıt = kural çıktısı == AI değeri.
- **lib/l2-parser.js:** başa yan-etki importlar (`../ares-asme.js` ÖNCE, `../ares-olcu.js`) →
  `olcuZenginlestir(malzemeler)`: satırda `boyut` (ham) varsa olcuParse ile BOŞ alanları doldur (MK-111.2;
  `_et_kaynak`='metin'|'asme') → `spoolOlcuTuret`: dominant Boru satırından spool cap/dn/schedule (boşsa);
  **et yalnız metin-kaynaklıysa** `et_kaynagi='tablo'`; asme-türetilmiş et spool'a YAZILMAZ → pdf_yok +
  schedule kalır, asmeFallbackDoldur schedule-bilinçli doldurur (150 zinciri burada CANLANIR).
- **format_tanit:** AI-oku sonunda `_tabloSentezle()` otomatik · cap_mm/et_mm/dn çipleri 🧮 "türetilmiş"
  (mavi; bu üçe kural YAZILMAZ — `TURETILEN_ALANLAR`) · malzeme_tablosu adımında sentez raporu (tip listesi,
  yeşil/kırmızı satırlar, ↻ yeniden sentez) · `buildParserKural` satir_tipleri doluysa gerçek
  `malzeme_tablosu{aktif,baslik_tetikleyici?,satir_tipleri}` yazar, **`_toplu_ai_bekliyor` KALKTI**;
  bbox yolu fallback olarak duruyor (geri uyum).
- **test-tablo-motoru.mjs (YENİ, repo):** `--dump` keşif kipi + `<pdf> <ai.json>` sentez→parse→kıyas kipi;
  pdf-parse path import (MK-119.4) + glyph-onar esnek import; M230/817-013/817-015/817-018 beklenenleri gömülü.

### Kanıt (3-PDF mekanik test + 4 container vakası — TÜMÜ YEŞİL)
- **Y100-817-012** (NPS+Sch): boyut ham `2" Sch 10S` → dn50/cap60.3/sch10S; spool et NULL+pdf_yok (zincir
  dürüst); **sondaki-sıfır vakası**: PDF `4.3820`, AI `4.382` → degerSpan değer-eşit genişleme ile çözüldü.
- **M230-306-SP20** (ODxet yapışık): `60.3x4.53200` → et-kırpma (AI değerine eşit EN KISA önek, ondalık sayısı
  desene `\d{1}` olarak işlenir — canlı el-yazımı `boru_mm` ile yapısal birebir) + boy 3200 ayrıştı;
  **İç Bilezik DN50 satırı okundu ama spool.dn NULL kaldı — dn sızıntısı (150 vakası) YAPISAL ÖLDÜ**
  (dn yalnız dominant borudan, kategori filtresi).
- **G400-817-015**: SA/A105 kalite (KALITE_CORE'a eklendi), Manşon, kaynak satırı; AI'ın yapışık tanımı
  (`ManşonDN40 x...`) tetik bug'ını gösterdi → **tetik aday-doğrulama** (adaylar örnek satıra koşulur, ilk
  tutan yazılır) + kelimeSade (DN/rakam kuyruğu sıyırma).
- Diğer kenar düzeltmeleri: kalite `lastIndexOf` (kolon kalitesi sona yakın; tanım-içi tekrar tuzağı) ·
  genSeg ondalık (rakam koşusu noktayı yutmaz) · degerSpan bitişik-span kuralı (`ST37|12.3`, `4.5|979`).
- **MK-151.4 dersi:** container kanıtları GERÇEK AI/saha çıktısıyla beslenir — fabrike tanımlar tetik_karisti
  sınıfı hataları gizledi.

### a093eaaa bulaşma vakası — onarıldı + panzehir `f38749a`
- **Vaka:** otoTespit eşleşince eski formatın `dosya_adi_regex`'ini fingerprint inputuna yazıyor (s.294),
  yeni kipe dönüş geri almıyordu → dedup M-desenli "tersan test"i bulup Y100 verisiyle EZDİ (et_mm bozuldu,
  Y100 satir_tipleri + min_malzeme_satir=1 yazıldı → M-ailesi L3'e geri düşecekti).
- **Onarım:** SQL UPDATE (BEGIN→SELECT doğrulama→COMMIT): et_mm ODxet'e geri, malzeme_tablosu kaldırıldı,
  min_malzeme_satir=0. **Veri onarımı — migration DEĞİL.**
- **Kod panzehiri:** `_fpAuto` (PDF açılışında dosya-adı deseni + üretici saklanır) → `_fpYenidenUret()`
  yeni kipe HER dönüşte (`_yeniKipeDon` + AI-oku kip dönüşü) fingerprint inputlarını açık PDF'ten geri yükler.
  - Dedup onayı güçlendi: hedef formatın **adı + deseni** gösterilir; açık PDF desene uymuyorsa
    "⚠️ FARKLI bir formatın üzerine yazıyor olabilirsin" uyarısı.
- **Canlı kanıt (konsol):** `_fpAuto={fn:'^Y\\d+-...', prod:'Cadmatic'}` ✓; `_yeniKipeDon()` sonrası fnRegex
  `^Y...` ✓. Picker boş seçimi `formatSecDegis('') → _yeniKipeDon()` zinciriyle bağlı (s.313).

### ai_api_log teyidi
Toplam gerçek L3: 1 çağrı (claude-sonnet-4-5, $0.0204, 06-02). Gerisi `L2_deterministic` $0 + cache.
**BULGU:** teaching turunda router mevcut aileye L2 düşürüyor → "AI gördü" değerleri L2 çıktısı olabilir;
taze-L3 garantisi yok. Tablo desenleri PDF metnine karşı kanıtlandığından zarar yok; **zorla-L3 teaching**
kuyruğa (izometri-oku DEĞİŞMEDEN tasarlanacak).

### Spec maddelerinin durum güncellemesi
- "Malzeme toplu AI" → ✅ deterministik sentezle KAPANDI (151).
- "format_kodu zorunlu olsun" → ad doğrulaması zaten vardı (canlıda çalıştı); kod konvansiyonu MK-151.5:
  ad=kullanıcı etiketi, format_kodu=sistematik (cad+tip+notasyon+sürüm). Otomatik öneri üretimi kuyrukta.
- **YENİ İLKE (Cihat, 151):** Y100/M230/G400 = SİSTEM KODU, format kimliği DEĞİL. Fingerprint
  **içerik-öncelikli** olacak (kural tutması = kimlik); dosya-adı deseni yalnız hızlandırıcı sinyal.
  Spec'in "dosya_adi_regex +5" maddesi bağlama paketinde revize edilecek — tetik/propagasyon ÖNKOŞULU.
- Madde 4 (tetik) + 5 (propagasyon): hâlâ ⏳ — erteleme paketinin gövdesi.
- Windows render bulgusu: `glyph: onarıldı ✓` (kurallar/sunucu etkilenmez) ama pdf.js görüntüsü bozuk;
  pilot operatörleri Windows'ta → ayrı oturum.
- Kaydet modal UX: başarıda otomatik kapan + toast (küçük borç).

### KARAR (Cihat): format TANITMA SEFERBERLİĞİ ERTELENDİ
Yapısal kısım tamam ve kanıtlı; kural kaydı veri girişidir, kod değil. İçerik-öncelikli fingerprint + batch
(izometri batch sayfası) + wizard tetikleri bağlanınca çok kişiyle/çok örnekle yapılacak — tanıtma akışın
içine gömülür, ayrı seans olmaktan çıkar. Y100 kuralı bilinçli KAYDEDİLMEDİ; ilk schedule'lı kayıtta zincir
canlı doğrulanacak (et_kaynagi 'SCH 10S'). **152 ana iş: yukleyen_id null (MK-117).**

---

## OTURUM 152 GÜNCELLEME — içerik-öncelikli fingerprint (önkoşul KAPANDI) + ilk kural kaydı

### 151'in önkoşulu ✅ KAPANDI — `0246eb0`
- "Fingerprint içerik-öncelikli olacak" maddesi gemide: format_tanit fn'i otomatik BASMAZ (placeholder
  öneri), kayıt gate'i içerik kimliği ister (baslik_regex zorunlu + ≥2 içerik sinyali + açık PDF metninde
  tutma kontrolü), dedup birincil anahtarı baslik_regex (fn fallback; uyum testi PDF METNİNE karşı).
- `tablo_baslik_regex` (spec'teki 4. sinyal) İLK KEZ ürün tarafından yazılıyor: UI alanı + tablo
  sentez tetikleyicisinden otomatik dolum (escape'li).
- **"dosya_adi_regex +5" maddesinin revizyonu SONUÇLANDI:** ağırlık DEĞİŞMEDİ — fn'in rolü yeniden
  tanımlandı (MK-152.1): kimlik değil, hızlandırıcı + KARDEŞ-format tie-breaker'ı. Gerekçe saha vakası:
  taze S03/S04 turunda içerik sinyalleri 3-3 berabere kaldı (aynı çizim şablonu), e1fb879d kazandı;
  a093eaaa'ya `^Y\d+-\d+-\d+\.S\d+` fn'i eklenerek çözüldü. İçerik tek başına kardeşleri ayıramaz —
  izometri-oku'daki 47.B yorumu ("dosya_adi_regex tie-breaker olur") doğrulandı.
- Mekanik kanıt: `test-fingerprint-icerik.mjs` (fingerprintSkor SALT-OKUNUR ayıklama, MK-49.1 ✓) 5/5.
  Ders: ipucu alan adları `producer/creator`.

### AI-oku × düzeltme kipi onarımı ✅ — `60d2897` + `0bac952`
- 150'nin "AI önce okur" mimarisi düzeltme kipiyle barıştı: koşulsuz kip dönüşü kaldırıldı (otoTespit
  eşleşmesindeyken formata bağlı kalınır); ÇALIŞAN kayıtlı kural AI doğrulamasında EZİLMEZ (MK-111.2).
- Düzeltme kipine TABLO KÖPRÜSÜ: taze satir_tipleri sentezi patch'e girer; `kabul_kriterleri` BİLEREK
  korunur (min_malzeme_satir aynen) — aynı format birden çok notasyon ailesine hizmet edebilir (M=ODxet,
  Y=NPS+Sch), min'i yükseltmek öğretilmemiş aileyi L3'e geriletirdi.

### İLK kural kaydı ✅ (erteleme istisnası, Cihat onayı)
- a093eaaa → `format_kodu=cadmatic_spool_nps_v1` (MK-151.5 konvansiyonu), `satir_tipleri=2`,
  fingerprint 4 sinyal. Tümü SQL veri UPDATE, SELECT/konsol kanıtlı.
- **Schedule zinciri final kanıtı AÇIK:** pdf_sha256 cache'i eski sonuçları döndürüyor (MK-152.4) +
  elde girilmemiş Y100 kalmadı. Saha bulgusu zinciri haklı çıkardı: schedule-körü fallback et=3.68/3.91
  üretiyor, doğrusu 2.77 (PDF SCH10S + Excel) — iki ayrı batch exportta belgelendi. 153: taze dosya
  (veya cache-bypass tasarımı, izometri-oku DEĞİŞMEDEN).

### Spec maddelerinin durumu
- Madde 4 (tetik): hâlâ ⏳ — YENİ bulgu: `dosya_isleme_kuyrugu` hattı TETİKSİZ (100+ bekleyen, deneme=0;
  hiçbir sayfa kuyruk-isle-izometri'yi çağırmıyor, cron yalnız is_kuyrugu/kuyruk-isle'de). MK-49.B
  bileşeni devre detay'da YOK (plan, yapılmış sanılmıştı). MK-117 bu paketin içinde (MK-152.3).
- Madde 5 (propagasyon): ⏳ — önkoşulu (içerik kimliği + fn tie-breaker) artık hazır.
- bbox normalize / kaydet modal UX / format_kodu otomatik öneri: ⏳ değişmedi.

---

## OTURUM 153 GÜNCELLEME — Madde 4 (tetik) gövdesi kapandı, kanıt yöntemi değişti

- **Madde 4 (tetik):** dosya_isleme_kuyrugu artık fiilen sürülebiliyor — ares-izometri-drenaj.js çok-tur
  (MK-153.1), tahliye 269 iş canlı (L2 %83, $1.15), MK-117 kapandı. Cron BİLİNÇLİ eklenmedi (508 kanıtı,
  MK-113/A). Kalan UI parçası: wizard "Formatı düzelt" butonu + İşlenenler sekmesi (W-2.7/W-3.1, yol haritasında).
- **Kanıt yöntemi:** "taze dosya" şartına alternatif kanıtlandı — ai_api_log.pdf_sha256 hedefli NULL'lama +
  kuyruk reset = aynı dosyayla temiz tur (MK-152.4 uyumlu, izometri-oku DEĞİŞMEDEN).
- **Yeni kapı bulgusu:** TURETILEN_ALANLAR'da kayıtlı eski/çöp regex varsa _alanlariKos koşturuyor (kırmızı
  tutarsızlık) ve runtime çöp üretiyor (et/cap=2358 vakası, onarıldı). Kod panzehiri = W-3.9 (154 ana iş).
- **satir_tipleri kapsama dersi:** tek PDF'ten sentez o ailenin TÜM kalite/tanım varyantlarını kapsamaz
  (Y100 316L ↔ Y200 ST37). Düzeltme kipi + tablo köprüsü (152) tam bu iş için — 154'te ilk canlı kullanımı.
- İzleme: docs/WIZARD-YOL-HARITASI.md (Faz 3 = bu spec'in tetik/yayılım maddelerinin ürün hali).

---

## OTURUM 154 GÜNCELLEME — format işi yok; zemin değişiklikleri

Format maddelerine dokunulmadı (yapısal öncelik kararı — ayrıntı FORMAT-TANITMA-ILERLEME.md 154
bölümünde). Spec'i etkileyen zemin değişiklikleri:
1. **Madde 4 (tetik) yüzü tamamlandı:** global drenaj artık İşlenenler sekmesinden ("Bekleyenleri
   işle", W-2.7) — konsol devri bitti. Spec'in "operatör butona basar, sistem gerisini halleder"
   hedefi tetik tarafında sağlandı.
2. **Kuyruk hijyeni:** 356 yetim 'iptal' (W-2.13) — format isabet/maliyet ölçümleri (L2 oranı,
   ai_api_log) bundan sonra temiz havuzdan okunur; eski oranlar yetim gürültüsü içeriyordu.
3. **W-3.9 hâlâ AÇIK KOD KAPISI:** TURETILEN_ALANLAR panzehiri yazılmadı — Y200 öğretim turundan
   ÖNCE kapanmak zorunda (153 bulaşma vakasının tekrarını önler). 155+ format paketinin ilk maddesi.

## OTURUM 155 GÜNCELLEME — kural kayıt hedefi İKİLİ çıktı (mimari düzeltme)

NB1124 saha turunda kanıtlandı (ayrıntı FORMAT-TANITMA-ILERLEME.md 155): AILE_KAYIT'lı formatlarda
etkin kural lib/format-paketleri.js'ten derlenir, DB parser_kural okunmaz (izometri-oku:902).
Spec'in "öğretilen kural kalıcı kaydedilir" maddesi iki hedefli hale gelir:
- **Paket-katmanlı aile** (tersan_cadmatic_spool/montaj): kayıt = format-paketleri.js + deploy.
  format_tanit UI'ı bu aileler için doğrudan DB'ye yazamaz — ya paket-taslağı üretir (PR akışı)
  ya da AILE_KAYIT dışına alınana dek operatör öğretimi bu ailelerde devre dışı kalır. KARAR 156+.
- **DB-kurallı format** (a093eaaa vb.): mevcut akış geçerli, değişiklik yok.
Cache düşürme + kuyruk reset reçetesi (153 yöntemi) ikinci kez canlı doğrulandı; tek ek:
deploy SONRASI aynı günün L2 sha kayıtları da düşürülür (155'te öğrenilen tuzak).

## OTURUM 156 GÜNCELLEME — kapsam sınırı netleşti (kod yok, teşhis dersi)

**MK-156.3 (NB1124 vakası):** format kapsaması ÜÇ katman — KİMLİK çıkarımı + SATIR tipleri +
BELGE SINIFI (dışlama). **format_tanit bu üçünden yalnız SATIR/ALAN katmanını öğretir.** NB1124'te
kabuk ve satır motoru sağlamken 20/22 PDF kimlik çıkarımı yüzünden kabukta_yok düştü; 22 tablosuz
çizim de (öğretilecek format değil, DIŞLANACAK belge sınıfı — W-2.4) L3'e gidip havuzu şişirdi.

**Ürünleşme sonucu:** operatör "formatı tanıttım" dediğinde sorun bitmeyebilir — UI bu sınırı
bilmeli:
- "Tanıt" akışı yalnız alan/satır sorunlarını çözer; kimlik (pipeline çıkarımı, W-3.10) ve dışlama
  (W-2.4) ayrı mekanizma. Tanıtma sonrası hâlâ kabukta_yok varsa kullanıcıya "kimlik/eşleşme
  sorunu — format öğretimiyle çözülmez" tipi yönlendirme gerekir (uyarı dili 157+ tasarım).
- MK-155.1 ikili kayıt hedefi (155 bölümü) geçerli: AILE_KAYIT'lı format → paket (kod+deploy),
  kayıtsız → DB. Üç-katman modeliyle birlikte format_tanit'in "neyi nereye yazdığı" tablosu
  ürünleşme tasarımının ilk sayfası olmalı.

156'da format_tanit koduna dokunulmadı; teşhis günlüğü FORMAT-TANITMA-ILERLEME.md 156 bölümünde,
kanıt envanteri docs/IZO-KANIT-SETI-31PDF.md v4 ekinde (B1124, 5. gemi).

## OTURUM 157 NOTU — Kimlik mekanizmasının adresi NETLEŞTİ (156 kapsam sınırı notunun devamı)

156 notu doğruydu: format_tanit yalnız satır/alan öğretir. 157 kimlik tarafının iki ayrı adresini
kanıtla sabitledi:
- **Tanıma (format seçimi):** `izometri_format_tanimlari.fingerprint` (4 sinyal: dosya_adı=5,
  producer=1, başlık=1, tablo=1; eşik 2, en yüksek skor kazanır). Montaj gibi içerik-fakir
  belge sınıflarında dosya_adi_regex ŞARTTIR (MK-157.3).
- **Eşleştirme (pipeline+spool anahtarı):** `kuyruk-isle-izometri.dosyaAdiParse` /
  `montajDosyaKok` (worker, parse SONRASI). format_tanit'in ve fingerprint'in kapsamı dışında.
Teşhis kuralı: kabukta_yok görünce sıra = devre durumu (taslak? MK-157.1) → kabuk anahtarları →
PDF anahtarları → format kıyası. Kuyruk durumu ≠ eşleşme durumu (MK-157.4).

## OTURUM 158 NOTU — Uyarıların ve eşleşme sebeplerinin tüketim yüzü (kapsam sınırı notlarının devamı)

156/157 notlarının pratiği 158'de doğdu: format_tanit'in kapsamı DIŞINDA kalan iki sınıf artık
operatöre görünür — (a) parse uyarıları (manuel_onay) Onay Kuyruğu sekmesinde kod+mesaj+ağırlık
ile listelenir ve tekil kapatılır; (b) eşleşme başarısızlıkları (kabukta_yok,
pipeline_kok_cikarilamadi) atanmamışlı grupta "Detay" ile sebep-bazlı okunur. 157'deki
"tanıtma sonrası hâlâ kabukta_yok varsa kullanıcıya yönlendirme gerekir" maddesinin UI zemini bu
sekmedir; format_tanit köprüsü (uyarı satırından tek tıkla öğretime) ileriki tasarım. format_tanit
koduna 158'de dokunulmadı. Teşhis kuralı genişledi (MK-158.1): VERİ (SQL) → UI → kod; benzer adlı
devre ≠ aynı devre.

## OTURUM 159 NOTU — ÜRÜN KİMLİĞİ + DEĞER KİPİ KARARI (ürünleşme tasarımının çatısı)

156-158 notlarının vardığı yer 159'da Cihat kararıyla kilitlendi (MK-159.2):

- **format_tanit AYRI MODÜLDÜR** (izometri batch gibi) — wizard/spool modalına PDF görüntüleyici
  GÖMÜLMEZ (159'da modal-içi "çapa" stub'ı kaldırıldı; spec'in v4 çapa mirası bu bağlamda yalnız
  format_tanit ekranında yaşar). Tüm taraflar aynı çekirdeği kullanır, çift taraflı gelişir.
- **Köprü sözleşmesi (W-3.1/3.2):** giriş `format_tanit?is_id=<kuyruk_is_id>` — sayfa dosyayı
  (storage_yolu), formatı (parse_sonuc.format / oto-tespit) ve spool bağlamını İŞTEN okur;
  operatör dosya aramaz. Spec Madde 4'ün (tetik) nihai biçimi budur; mevcut `?format_id=&alan=`
  girişleri korunur.
- **İKİ KİP tek ekranda (sol bilgi + sağ PDF):**
  - **B1 KURAL kipi (mevcut):** "okuma yerini düzelt" → parser_kural/paket patch (adres MK-155.1
    ikiliğine tabi — 160 mimari kararı).
  - **B2 DEĞER kipi (YENİ, ürünleşme):** "değer yanlış/boş, doğrusu şu" → `taslak_duzeltmeleri`
    upsert (işaretli, kaynak ezilmez — MK-111.2; wizard'ın kullandığı onConflict altılısı aynen).
    149'daki B2 tasarımı değişmeden ürünleşir; format-geneli deger_haritasi hâlâ son çare.
- **W-3.4 yayılım sözleşmesi:** kural kaydı sonrası kardeş işler kuyruğa geri (155 reçetesi:
  deploy [paket ailesiyse] → sha düşür SONRASI dahil → reset → kanıt).
- **NOT alanı kapsama gerçeği (159 taraması):** not_metni yalnız İmalat Resmi kuralında tanımlı
  (515/555 üretiyor); Montaj/PAOR ailelerinde alan yok → 0. Yeni format tanıtımlarında NOT
  bloğu varsa alan tanımı checklist'e (alistirma_ipucu_kurali varsayılanı format override
  edebilir — l2-parser:62-67).

160 ana işi bu notun uygulanmasıdır: FORMAT-YONETIM-MIMARI.md (tek otorite + öğretim adresi
tablosu + kip ayrımı) + ilk köprü canlı. format_tanit koduna 159'da dokunulmadı.
