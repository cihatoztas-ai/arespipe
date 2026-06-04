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
