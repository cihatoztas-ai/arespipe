# Format Tanıtma — İlerleme Günlüğü (oturum 148'den itibaren)

> Kronolojik ilerleme kaydı: 148 → 149 → 150 → … Her oturum sonuna kendi bölümünü ekler.
> Eski adı FORMAT-TANITMA-148-ILERLEME.md idi; 150 kapanışında oturum-bağımsız ada çevrildi.

## ✅ TAMAMLANAN (oturum 148) — döngü uçtan uca çalışıyor
- **format_tanit.html** üretimde: ARES bootstrap + `tenant_features` flag (`format_tanit`) + `/vendor/pdfjs-1.10.100/` + gerçek Supabase insert.
- **pdfjs v1.10.100 vendor'landı** (`vendor/pdfjs-1.10.100/{pdf.js,pdf.worker.js}`). Tarayıcıda sunucu ile birebir temiz metin.
- **Migration A uygulandı**: `egitim_kaynagi` CHECK'e `'cizim_capa'` eklendi.
- **feature_flags**'a `format_tanit` katalog satırı + Demo Atölye `tenant_features` aktif.
- **cozumle()** bölge→değer+boşluk-dayanıklı regex; pipeline deseni çok-segmentli koda genellendi (ALS + SP## + …). 9 alan + pipeline iki formatta doğrulandı.
- **KANIT**: kaydedilen kural `test-l2-format.mjs` ile GERÇEK l2-parser'da çalıştırıldı → `parser_seviye: l2`, 7/8 (8. = pipeline, çapraz-format olduğu için beklenen), **AI yok, $0**.
- Kaydet sonrası buton "Kapat"a döner. Tema-duyarlı (light/dark).
- İlk gerçek $0 L2 format kaydı: `egitim_kaynagi='cizim_capa'`, `requires_ai=false`.

## Açık küçük borçlar (format_tanit)
- **INSERT→UPDATE**: aynı format tekrar tanıtılınca yeni satır yerine fingerprint'e göre güncelle (şu an elle siliyoruz). Test sırasında çift satır oluşabilir. ✅ 149'da kapandı
- **bbox → PDF-point** normalize (şu an render-px, scale'e bağlı; konum_ipucu opsiyonel/l2 yoksayıyor). ⏳ açık
- **Malzeme tablosu**: bölge işaretle → satır desenleri toplu AI (henüz stub). ⏳ açık → 150: tasarım DEĞİŞTİ, deterministik sentez (TABLO-TASARIM.md)
- ares-layout nav entegrasyonu (şu an kendi çerçevesi). ⏳ 149'da atlama listesine alındı (bilinçli tam-ekran çerçeve)

## ADIM B — iki AYRI şey (oturum 149 başlangıcı)
Cihat'ın isteği iki farklı kategori:

### B1 — Hedefli tek-alan ÇAPA (kural düzeltme)
Tanınan formatta (parser_kural var) tüm akış değil, **sadece sorunlu alan**: "yüzey nerede?" / "bunu yanlış okudu, burası". 
- Aynı ekranın **hedefli kipi**: mevcut formatı yükle → alan listesini göster → operatör bir alanı seçip yeniden işaretle → o alanın regex'ini güncelle.
- Gerektirir: **format UPDATE** (parser_kural.alanlar[alan] güncelle). = paylaşılan çekirdek (cozumle + mini-çapa).
- Reuse: wizard inceleme tek-alan + spool_detay "çizimden düzelt".

### B2 — Tekil DEĞER düzeltme (anlam/eşleme — Paslanmaz→Asit)
**Okuma hatası DEĞİL** — parser doğru okuyor ("Paslanmaz"), ama tersane o alanda Paslanmaz yazınca "Asit"i kastediyor.
- **İLKE**: kaynağı sessizce EZME (bindir MK-111.2). Düzeltme **işaretli/izlenebilir** olmalı ("düzeltildi: PDF 'Paslanmaz' diyordu").
- **Varsayılan = tekil, güvenli**: o spool'un değerini düzelt → mevcut **`taslak_duzeltmeleri`** tablosuna yaz (wizard inceleme zaten kullanıyor; onConflict: tenant_id,devre_id,pipeline_no,spool_no,alan,kalem_idx). YENİ DEPO KURMA.
- **Format-geneli eşleme = riskli**: `deger_haritasi {Paslanmaz:Asit}` parser_kural'a; runtime l2-parser post-processing'de uygular. SADECE "bu formatta hep böyle" kesinse + işaretli. Aksi halde gerçekten paslanmaz olan spool'u da yanlış çevirir → kullanma.

## Read-before-write (Adım B'ye başlamadan)
- `taslak_duzeltmeleri` tam şema (kolonlar, NOT NULL) — B2 için.
- Wizard inceleme'nin düzeltmeyi nasıl OKUDUĞU/uyguladığı (B2 entegrasyon).
- format UPDATE deseni (parser_kural jsonb güncelle) — B1 için. ✅ 149

## Sıra önerisi
Önce **B1** (kural tek-alan düzeltme — temiz uzantı), sonra **B2** (değer düzeltme, taslak_duzeltmeleri'ne işaretli). l2-parser deger_haritasi en sona, yalnız gerekirse.

---

## OTURUM 149 — TAMAMLANAN (B1 + A + B + prompt_template + CI)

### B1 ✅ — düzeltme kipi
- format_tanit.html'in **düzeltme kipi** (`_mode='duzelt'`) kuruldu. Format yükle (URL `?format_id=&alan=` veya picker dropdown) → kayıtlı regex'ler hidratlanır → sorunlu alanı yeniden işaretle → **yalnız o alan** PATCH'lenir.
- **Patch, rebuild DEĞİL:** `_mevcutKural` derin kopyalanır, sadece `_dirty` alanlar üzerine yazılır → malzeme_tablosu / kabul_kriterleri / AI satır desenleri korunur. UPDATE `.eq('id')` + `guncelleme_at`.
- INSERT→UPDATE borcu kapandı (fingerprint.dosya_adi_regex + tenant dedup, onaylı UPDATE/INSERT).

### A ✅ — içerik-bazlı oto-tespit (spec'te yoktu, Cihat itirazıyla eklendi)
- Cihat'ın gözlemi: "bu format" demeden sistem en uygun formatı kendi bulmalı; Tersan diyoruz ama Cadmatic'in farklı sürümü olabilir, kural tutuyorsa büyük çoğunluğu tanınır.
- `otoTespit()`: PDF açılınca tenant L2 formatlarının (`requires_ai=false`) kuralları CANON_ALL'a koşulur, en çok alan okuyan kazanır (eşik skor>=3 || skor>=2 & >=%50). Otomatik düzeltme kipine girer.
- **Canlı kanıt:** M110-306-SP13.S02 picker'a dokunmadan açıldı → "tersan test" otomatik eşleşti, **8/8 alan okundu**.

### B ✅ — alan yeşil/kırmızı
- `_alanlariKos()`: her kayıtlı regex bu PDF'e karşı koşulur → yeşil (okudu) / kırmızı (okuyamadı) / nötr (formatta tanımsız). İlk kırmızı alana otomatik atlar. "PDF avlamadan sorunu gör" derdinin çözümü.

### prompt_template ✅
- Cihat sorusu: AI'a sözlü tarif yazılabilsin mi → evet. Tamamla ekranına "AI'a sözlü tarif" textarea. Insert/dedup-update/düzeltme üç yola da bağlı. Yalnız L3 fallback, deterministik kuralın yerine geçmez.

### CI
- format_tanit.html → ares-layout.js + atlama listesi (`format_tanit`). Eski _arsiv md'leri untrack. CI yeşil.

## ADIM B2 — HÂLÂ AÇIK (sonraki)
B1 bitti; B2 (Paslanmaz→Asit, taslak_duzeltmeleri'ne işaretli değer düzeltme) henüz yapılmadı. Read-before-write: taslak_duzeltmeleri şeması + wizard'ın düzeltmeyi okuması.

## 150 ANA TEMA — SORU AĞACI
"Elle ayarla" panelini yönlendirmeli akışa çevir. Tek deterministik motor, iki yerde: AI öncesi (ufak düzeltme) + AI sonrası (stragglar). Sonra AI merdiveni (operatör tetikli 2. çağrı + mühür). Detay: CLAUDE-SONRAKI-OTURUM.md.

---

## OTURUM 150 — TAMAMLANAN (AI-oku + schedule zinciri + tablo tasarımı)

### Mimari dönüş (Cihat kararı) ✅
Soru ağacı beyaz tahtası → "her format tanıtımında bir AI mantıklı, orayı anlat burayı anlat pratik olmaz."
**AI önce okur**, elle işaretleme AI'ın kırmızı bıraktığının TAMİRİ (B1) oldu. İlke: AI değer BULUR, kural yazmaz —
kuralı cozumle sentezler, **kural çıktısı == AI değeri** ground-truth (MK-51.2 çözümü). Sızıntı kuralı: AI null +
cozumle dolu → mühürleme (M230 dn vakası node kanıtıyla yakalandı, 8/9 yeşil).

### AI-oku (Increment 1) ✅ GEMİDE — `3393eb6`
🟣 buton → mevcut /api/izometri-oku (MK-129.3 12/12 ✓, MK-49.1 dokunulmadı; yan etki analizi: batch+ai_api_log+cache,
spooller/izometri YAZILMAZ, MK-117 güvenli) → spoollar[0] → _aiSentezle: yeşil mühür / kırmızı + "🟣 AI gördü: X"
ipucu / sızıntı atla. malzeme_listesi `_aiSatirlar`'da saklanır (Increment 2 girdisi). Canlı: Y100-817-013 + 018.

### Schedule türetme zinciri ✅ GEMİDE (uyuyor) — `6359555` + `30e995c`
Y100 ailesi boyutu "2\" Sch 10S" yazar (60.3 metinde YOK) → çıkarma değil ÇEVİRME. Zincir: l2-parser spool.schedule
geçişi + izometri-oku asmeFallbackDoldur→boruOlcuBul schedule paramı (**MK-49.1 kontrollü istisna**, undefined=no-op
kanıtlı, ayrı commit). İlk schedule'lı kural kaydında canlanır. Çevirme TEK merkez: ARES_OLCU.olcuParse→ARES_BORU
(Node-uyumlu; npsToDn('1-1/2')→40 doğrulandı).

### Tablo motoru tasarımı kilitlendi (Cihat finali) → 151 ANA İŞ
"Teaching'in tek sorusu: malzeme tablosu nerede" — çap/et/dn soruları öldü, Boyut sütunundan türerler.
**TAM SPEC: docs/FORMAT-TANITMA-TABLO-TASARIM.md** — _tabloSentezle + l2-parser olcuParse/dominant-Boru +
3-PDF mekanik test + kenar vakaları + sonrası kuyruğu. 151'de tartışma tekrarlanmaz.

---

## OTURUM 151 — TAMAMLANAN (Increment 2: TABLO MOTORU gemide + bulaşma fix + ERTELEME kararı)

### Tablo motoru ✅ GEMİDE — `593c51b`
- **ares-tablo-sentez.js (YENİ, UMD, tek kaynak):** AI satır değerlerinden deterministik satir_tipleri —
  değer-çapalı satır bulma → span-ikame desen sentezi → satır-bazlı doğrulama (runtime tetik sırası + desen +
  olcuParse; kanıt = kural çıktısı == AI değeri). Aynı kod client (format_tanit) + Node (test) — MK-126.8.
- **l2-parser:** ares-asme/ares-olcu yan-etki import (sıra: asme önce) + olcuZenginlestir (boyut ham →
  olcuParse, dolu EZİLMEZ) + spoolOlcuTuret (dominant boru → cap/dn/schedule; et yalnız metin-kaynaklı
  'tablo'; asme-türetilen et spool'a YAZILMAZ → asmeFallback zinciri dürüst kaynakla doldurur).
- **format_tanit:** AI-oku sonrası otomatik sentez · 🧮 türetilmiş çipler (cap/et/dn kural YAZILMAZ) ·
  sentez raporu UI + ↻ · buildParserKural gerçek satir_tipleri yazar, `_toplu_ai_bekliyor` KALKTI.
- **3-PDF mekanik test YEŞİL:** Y100-817-012 (sondaki-sıfır 4.3820) · M230-306-SP20 (yapışık 60.3x4.53200
  doğru kırpıldı; İç Bilezik DN50 → spool.dn NULL — **dn sızıntısı yapısal öldü**) · G400-817-015 (SA/A105,
  ManşonDN40 tetik dersi). test-tablo-motoru.mjs repo'da (--dump + kıyas).

### a093eaaa bulaşma vakası ✅ onarıldı + panzehir `f38749a`
Oto-tespit eski formatın dosya desenini fingerprint inputuna yazıyor, kip dönüşü geri almıyordu → dedup
"tersan test"i bulup Y100 verisiyle EZDİ. SQL onarımı (veri UPDATE, migration değil) + kod: _fpAuto (yeni kipe
her dönüşte fingerprint açık PDF'ten) + dedup onayına hedef ad/desen + uyumsuzluk uyarısı. Konsol kanıtlı.

### Bulgular (kuyruğa işlendi)
- Teaching'de taze-L3 garantisi yok (router mevcut aileye L2 düşürür; ai_api_log kanıtı — tek gerçek L3
  $0.0204, gerisi $0). Zorla-L3 tasarımı kuyrukta, izometri-oku DEĞİŞMEDEN.
- Windows'ta render bozuk ama `glyph: onarıldı ✓` (kurallar çalışır) — pilot operatörleri Windows'ta, ayrı oturum.
- Format adlandırma: ad=kullanıcı, format_kodu=sistematik; **sistem kodu (Y100/M230) format kimliği DEĞİL** →
  fingerprint içerik-öncelikli olmalı (dosya-adı yalnız sinyal). Bağlama paketinin önkoşulu.

### KARAR (Cihat): format TANITMA ERTELENDİ
Yapısal kısım tamam ve kanıtlı; kural kaydı veri girişidir. Batch + wizard'a tetik bağlanınca (içerik-öncelikli
fingerprint sonrası) çok kişiyle/örnekle yapılacak. Y100 kuralı bilinçli KAYDEDİLMEDİ — ilk kayıtta schedule
zinciri canlı doğrulanacak (et_kaynagi 'SCH 10S').

### 152 ana iş
**yukleyen_id null (MK-117)** — kuyruk-isle-izometri.js:305 gate'i; dosyalar parse'a hiç girmiyor.

---

## OTURUM 152 — TAMAMLANAN (içerik-fingerprint gemide + İLK kural kaydı + saha bulguları)

### İçerik-öncelikli fingerprint ✅ GEMİDE — `0246eb0`
fn kimlikten çıktı (otomatik basılmaz, placeholder öneri, kip dönüşünde boş — a093eaaa kanalı kökten kapalı) ·
tablo_baslik_regex 4. sinyal (UI + sentezden otomatik) · içerik gate (baslik zorunlu + ≥2 sinyal + PDF'te
tutma) · dedup içerik-öncelikli (baslik birincil, fn fallback, uyum testi PDF METNİNE). Mekanik kanıt:
test-fingerprint-icerik.mjs 5/5 — fingerprintSkor SALT-OKUNUR ayıklanır (MK-49.1 ✓); ders: ipucu alanları
producer/creator.

### AI-oku düzeltme-kipi onarımı ✅ — `60d2897` + `0bac952`
150 kalıntısı koşulsuz kip dönüşü kaldırıldı (düzelt kipinde formata bağlı kalınır) · çalışan kayıtlı kural
AI doğrulamasında EZİLMEZ (MK-111.2) · düzeltme kipine TABLO KÖPRÜSÜ: taze sentez patch'e girer,
kabul_kriterleri DOKUNULMAZ (min_satir=0 → kardeş aile L3'e gerilemez).

### İLK KURAL KAYDI ✅ (erteleme istisnası, Cihat onayı)
a093eaaa "tersan deneme" → format_kodu=cadmatic_spool_nps_v1, satir_tipleri=2, fingerprint 4 sinyal
(baslik "Cut & Bending Info" + tablo "No Adet Açıklama" + Cadmatic + fn tie-breaker ^Y\d+-\d+-\d+\.S\d+).
Tümü SQL veri UPDATE (migration yok), her biri konsol/SELECT kanıtlı.

### Saha bulguları (153 girdisi)
- **3-3 kardeş-format beraberliği CANLI:** taze S03/S04 turu e1fb879d'ye düştü (içerik sinyalleri özdeş) →
  fn tie-breaker rolü saha-gerekçeli (MK-152.1).
- **Sch40-körü yanlış-et belgelendi:** batch et=3.68/3.91, doğrusu 2.77 (PDF SCH10S + Excel) — schedule
  zincirinin düzelteceği bug iki ayrı exportta. **Final kanıt taze dosya bekliyor** (cache sha256 engeli,
  MK-152.4; elde girilmemiş Y100 kalmadı).
- **İKİ KUYRUK:** dosya_isleme_kuyrugu TETİKSİZ (100+ bekleyen, deneme=0, 22 May'dan beri); MK-49.B bileşeni
  devre detay'da YOK (plan, yapılmış sanılmıştı). MK-117 Faz 2 tetik paketiyle birleşti (MK-152.3).
- JSONB denetim tuzağı: `?` anahtar-varlığı ≠ doluluk; `->>'k' IS NOT NULL` (MK-152.2) — a093eaaa baslik
  null'u dolu sanılmış, routing fiilen körmüş; onarıldı.

### 153 ana iş
Taze Y100 final kanıtı (et 2.77 + format a093eaaa; dosya yoksa cache-bypass A/B/C) → Faz 2 tetikler
(dosya_isleme_kuyrugu çağıranı + MK-117 + tahliye + wizard "Formatı düzelt" butonu) → Faz 3 propagasyon.

---

## OTURUM 153 — TAMAMLANAN (tahliye + MK-117 kapanışı + çöp regex onarımı; satır öğretimi 154'e)

### Tetik kararı + tahliye ✅ (spec Madde 4'ün gövdesi kapandı)
- **Tetik = client-loop, cron YOK:** cron→drenaj zinciri önerisi 508 saha kanıtıyla (18× eski kayıt)
  geri çekildi; MK-113/A blanket. ares-izometri-drenaj.js **çok-tur koşuya** alındı (`b919512`, MK-153.1):
  liste bitince yeniden çekilir, görülen-set ile iş başına TEK deneme korunur.
- **TAHLİYE:** 269 iş canlıda (konsol global drenaj, tur1→tur2 kanıtlı). **L2=206 / L3=41 → %83, $1.15.**
  bekliyor 233→3 (IFS xlsm = excel hattı). 52'nin "%70+ pilot eşiği" ilk kez sahada aşıldı.
- **MK-117 KAPANDI:** "kullanici_id zorunlu" kökü = devre_dokumanlari.yukleyen_id NULL, tek küme
  (M110-722-21xx, 11 dosya). Veri onarımı → ikinci tur 12/12 hatasız. (MK-153.3)

### a093eaaa çöp regex vakası ✅ onarıldı (kod kapısı W-3.9'a)
- cap_mm/et_mm'de jenerik `\n(\d+)\n` (eski tanıtma kalıntısı) → format_tanit'te kırmızı tutarsızlık +
  üretimde et/cap=2358 çöpü. `#-` ile düşürüldü; ilk deneme Supabase editör BEGIN/COMMIT ayrımıyla
  ROLLBACK yedi (**MK-153.2: veri onarımı TEK çalıştırma**). Canlı kanıt: yeniden parse →
  `celiski_et_cap_farkli` flag'leri yok, bindirme_flag=false. **MK-111.2 sahada kendini kanıtladı**
  (çöp PDF değeri kabuğu EZEMEDİ, flag+manuel_onay'a düştü).
- Kalıcı panzehir AÇIK → **W-3.9:** TURETILEN_ALANLAR'a kayıtlı regex koşulmaz/yazılmaz/çip türetilmiş.

### Y200 kanıt turu (kısmi) — schedule et kanıtı 154'e
- Y200-804-414.S01 → **a093eaaa + L2 + $0** (fn tie-breaker `^Y\d+-\d+-\d+\.S\d+` Y200'de canlı ✓);
  S'siz dosya → 39a2c81b montaj (kardeş ayrımı canlı ✓).
- **AÇIK:** satir_tipleri (Y100 316L sentezi) Y200'ün ST37/"Welded Steel Tube" satırlarını TUTMUYOR →
  PDF malzeme listesi boş → et üretilmedi → schedule zinciri tetiklenmedi. Bug değil kapsama boşluğu.
- **154:** format_tanit düzeltme kipi + tablo köprüsüyle Y200 satır öğretimi (cache sha düşürme
  gerekebilir, MK-152.4) → et kanıtı kapanır.

### Yol haritası
İlerleme aynası artık **docs/WIZARD-YOL-HARITASI.md** (153'te doğdu): format tanıtma çift-taraflı
tetikler = Faz 3 (W-3.1 wizard / W-3.2 izometri batch / W-3.3 L3 devre anahtarı / W-3.9 panzehir).

---

## OTURUM 154 — FORMAT İŞİ YOK (bilinçli erteleme, kayıt için)

### Karar (Cihat, 154 açılışı)
"Format tanıtımından çok sistemin yapısal eksiklerini tamamlamamız lazım" — W-3.9 panzehiri +
Y200 satır öğretimi (→ W-1.6 schedule et kanıtı) ERTELENDİ. Kimseyi bloklamıyor; W-1.6 [~] kalır.

### 154'ün format hattına dolaylı katkıları
- **Yetim temizliği format isabetini netleştirdi:** oneri_hazir 1011→690 — eski birikimin %32'si
  silinmiş/taslak devre yetimiymiş. Format başarı oranları artık temiz havuz üstünden okunur.
- **bekliyor=0:** 3 IFS xlsm "excel hattı tetiksiz mi" sorusu kapandı — yetimlerdi (W-4.7).
- **İşlenenler sekmesi (W-2.7) gemide:** W-3.1'in ("tanınmadı → Formatı tanıt" satır butonu) doğal
  evi hazır oldu — format tanıtma akışın içine bu sekme/inceleme üzerinden bağlanacak.

### 155+ format kuyruğu (değişmedi)
W-3.9 panzehiri (İLK — Y200 öğretiminden önce kod kapısı kapanmalı, 153 bulaşma dersi) →
Y200 ST37 satır öğretimi (kabul_kriterleri DOKUNULMAZ, cache sha düşürme MK-152.4) → W-1.6 kanıt.

---

## OTURUM 155 — PLANSIZ SAHA TURU: NB1124 redüksiyon öğretimi + KRİTİK MİMARİ DERS

### Tetik
W-2.11 canlı testi sırasında NB1124 devresi (22 spool, e1fb879d ailesi) inceleme ekranında
"facia" görünümü: tüm satırlar L3 %100, çap/et/kalite boş. Teşhis üç bilinen borcun bileşkesi
çıktı: (1) redüksiyon satır tipi öğretilmemiş (Y200 dersinin tekrarı), (2) tablosuz çizim
sayfaları işlemeye girmiş (W-2.4 sınıfı), (3) kabuk eşleşmesi 0 (kabukta_yok).

### KRİTİK DERS — MK-155.1 (bugünün ana kazanımı)
**e1fb879d satır öğretimi DB parser_kural'a yapılmaz.** İlk tur DB'ye yapıldı (tip 7→8,
RETURNING kanıtlı) ve HİÇ OKUNMADI: izometri-oku:902 `aileBirlestir(format_kodu) || DB_kural` —
AILE_KAYIT'ta kayıtlı formatlar (tersan_cadmatic_spool, tersan_cadmatic_montaj) için etkin kural
**lib/format-paketleri.js katmanlarından** derlenir, DB kural yalnız fallback. Paket-katmanlı
ailelerde satır öğretimi = KOD DEĞİŞİKLİĞİ + DEPLOY. (W-3.x format_tanit ürünleşmesi bu gerçeği
hesaba katmalı: kayıt hedefi format'a göre DB veya paket olabilir — tasarım sorusu, 156+.)

### Yapılan (kanıt zinciri)
1. **'reduksiyon' tipi → MALZEME_PASLANMAZ facet'i** (format-paketleri.js, commit 50ef94b):
   20 gerçek ham_satir / 8 benzersiz örnek; pattern lokalde gerçek aileBirlestir ile 9/9
   (8 redüksiyon + boru_sch regresyonu). Sayısal kuyruk = boy(B16.9 H, tek ondalık) + kalite + kg.
2. **123.C 'reduksiyon_sch' DEVROLUNDU (A kararı, Cihat):** nps_inc/nps_kucuk tüketicisiz (grep
   kanıtlı); motor "ilk tetikleyen tipte kalır, pattern tutmazsa ham düşer" kısıtında örtüşen
   tetikleyicili iki tip tuzaktı → tek genel tip. Sökemezse ham_satir görünür düşer (B-6). MK-155.3.
3. **Cache düşürme MK-152.4 yöntemi İKİNCİ KEZ kanıtlandı:** format+tarih hedefli pdf_sha256 NULL
   + kuyruk reset (.SXX filtreli — tablosuz çizimler bilerek dışarıda, gereksiz L3 maliyeti yok).
   Tuzak notu: L2 sonuçları da sha'lı loglanıyor → kural deploy'undan SONRA o günün sha'ları da
   düşürülmeli (ilk reset turu bu yüzden eski sonucu yeniden üretti).
4. **Saha mührü:** 10Ax6A → ham=false, boy=177, kalite=316L, kg=14.8, sure_ms 2217, güven 1,
   notlar "L2 deterministik parse". Eski tur: 22.3 sn L3 + boş tablo. $0.

### Bilinen sınır — MK-155.2
Motor sözleşmesi boy_mm'i int'e çevirir (177.8→177). MK-118.3 (motor yeniden yazılmaz) gereği
istisna açılmadı; 0.8 mm imalat toleransında ihmal edilebilir, kayıt için not.

### 156+ format kuyruğu (güncel)
W-3.9 panzehiri (hâlâ İLK) → Y200 ST37 satır öğretimi — ARTIK ADRESİ BELLİ: a093eaaa AILE_KAYIT'ta
DEĞİL → onun öğretimi DB parser_kural'a (152 köprüsüyle); e1fb879d ailesininki pakete (MK-155.1)
→ W-1.6 tam kanıt. Yeni aday: NB1124 tablosuz çizim sayfaları W-2.4 dışlamasının somut test vakası.

## OTURUM 156 — TEŞHİS OTURUMU: NB1124 kabuk vakası + ÜÇ-KATMAN modeli + v4 kanıt eki

### Ana ders — MK-156.3 (kapsama üç katman)
**Format kapsaması = KİMLİK + SATIR + BELGE SINIFI (dışlama).** 31-PDF kanıt belgesi yalnız SATIR
katmanına bakıyordu; 156'nın saha vakası üç katmanın AYRI AYRI kırılabildiğini gösterdi:
- NB1124 (hhbjşlö): kabuk SAĞLAM (IFS Excel 66 satır → 22 temiz spool anahtarı), satır motoru
  SAĞLAM (155 redüksiyon mührü aynı ailede) — kırık olan KİMLİK: 44 PDF'in 37'si pipeline_no NULL.
- 22 dosya format NULL = TABLOSUZ ÇİZİM (.SXX'siz) — BELGE SINIFI sorunu: bunlar öğretilecek
  format değil DIŞLANACAK sınıf (W-2.4); L3'e gidip manuel_onay'ı şişirdi, para yaktı.
- e1fb879d ailesinde 20/22 dosya `10Ax6A 1(2).S01.1.pdf` kalıbı kimlik çıkarımı dışı (yalnız
  `12Ax12D.S01.1.pdf` çözüldü). 4 dosyada pipeline'a SYSTEM adı yazılmış (yanlış alan kapma).
**kabukta_yok teşhis sırası (tekrarlanabilir):** kabuk anahtarları → PDF anahtarları → format/
kimlik kırılımı. Üç sorgu, kök neden; parser suçlaması yok.

### Yapılan
1. Teşhis zinciri (yukarıda) — kod yazılmadı, Tur 1 157'ye tanımlandı.
2. **v4 kanıt eki (B1124 = 5. GEMİ, 6 PDF / 2 tam çift):** docs/IZO-KANIT-SETI'ye bölüm 8.
   Yeni sınıflar: Flanş Dablin ⚠? · **Tee metrik ?** (matriste HİÇ yoktu — tip teyidi 157'nin
   ilk grep'i) · Çelik Alın Kaynağı "- Saha" varyantı ⚠. Güçlenen kanıtlar: Lama 2. örnek (DN200),
   Detay A 3., çift-hane et 2. (219.1x12.5; cut bloğu metin katmanında KESİK — extractor teyidi),
   4-segment 2. (M110-262-803-537). Yapısal: Continue+sayfa eki ("M110-722-509 1(2)") · 722
   ailesi B1124'te de · NOT'ta yüzey çelişkisi ("İçi Galvaniz Dışı Siyah") · "GEMİ BAŞINA TEK
   ADLANDIRMA" VARSAYIMI ÖLDÜ (B1124'te zone'lu AT100/M110 + zone'suz 10Ax6A yan yana).
3. **31-PDF yol haritası eleştirisi işlendi:** Madde 0 (kimlik) iş paketinin BAŞINA (W-3.10);
   tetik örtüşme denetimi her yeni tip checklist'ine (MK-155.3 riski: 'Red.ser'↔'reduksiyon',
   'Dış Bilezik'↔'Ic Bilezik'); ST/SA kalite genişletmeleri KESİŞEN değişiklik → önce kalıcı
   lokal regresyon fikstürü (gerçek ham_satir'lardan, 155'in 9/9'unun büyütülmüşü).

### Açık doğrulamalar (157)
- ✖ "sessiz kayıp" iddiası belge analizinden: motor tetiksiz satırı ham_satir'a düşürüyor mu?
  Tek canlı örnekle teyit — düşüyorsa ✖→⚠, 158 öncelik sırası değişir.
- Tee tipi var mı (grep satir_tipleri + format-paketleri.js).
- 6 B1124 PDF'i ORİJİNAL adlarla yüklenecek (Downloads "(1)" eki var — MK-52.1); Tur 1 ham_satir
  kaynağı bunlar.

### Tur planı (155 yöntemi her turda: öğret → deploy → sha düşür [SONRASI dahil] → reset → kanıt)
- **Tur 1 (157):** kimlik adresi read-before-write → Madde 0 + flange_en + W-2.4 dışlama + Tee
  teyidi → KANIT: hhbjşlö kabukta_yok 22→0 (+ redüksiyon regresyonu bedava, 10Ax6A sette).
- **Tur 2 (158):** regresyon fikstürü KUR → sessiz kayıplar (Dış Bilezik · Redüser · Lama ·
  Manşon · Flange EN artığı · Tee?).
- **Tur 3 (159):** ⚠ ham düşenler toplu (kesirli NPS · Detay A/C dalları · ağırlıksız kaynak
  +"- Saha" · ST\d{2}(?:\.\d)? · Flanş Dablin dalı) — fikstür üstünde.

## OTURUM 157 — FORMAT TUR 1: NB1124 TAM KAPANIŞ (44/44, regex patch'i YAZILMADAN)

### Teşhis iki kez devrildi (kanıtla)
- dosyaAdiParse (kuyruk-isle-izometri) zone'suz `<NPS>x<NPS>` + segment dahil 9/9 kalıbı ZATEN
  tutuyordu — 156'nın Madde 0 regex genişletmesi gereksizdi.
- kabukta_yok ×22 yapısaldı: taslak devrede spooller boş (MK-157.1).
- `.SXX`'siz 22 dosya montaj kanadıydı, tablosuz çizim değil (MK-157.3).

### Asıl kırık: eslestirme-backfill 140'tan beri ÖLÜ
ERR_REQUIRE_ESM — Vercel runtime require(ESM) desteklemiyor, modül-seviyesi createRequire zinciri
tüm endpoint'i çökertiyordu (izometri dalı dahil). Lokal Node 20.19+/22 maskeler; repro standardı
node@20.11 (MK-157.2). fix(157): CJS zinciri lazy import(), yalnız tip=malzeme dalında.
129-130 "terfi sonrası izometri bağlanmıyor" borcu KAPANDI.

### Montaj öğretimi (39a2c81b — DB fingerprint)
Anatomi: montaj formatında dosya_adi_regex YOK; "Continue:" tek-segmentlide ateşlenmez; malzeme
tablosu yapısal yok → producer 1 < eşik 2 → NULL → genel L3 (1 halüsinasyon spool + manuel_onay).
Öğretim: dosya_adi_regex eklendi —
`^(?:[A-Z]{1,2}\d{2,3}[A-Z]?(?:-[\dA-Z]+)+|\d+[A-Z]x\d+[A-Z])(?:\s+\d+\(\d+\))?[._]\d+\.pdf$`
36/36 ad testi (montaj ✓ / imalat ✗ — `.S01` doğal guard / diğer ✗). Skor iki yönde güvenli.
Cache düşürme GEREKMEDİ: anahtar (sha, format_id); format NULL'ken cache sorgulanmıyor.

### Kanıt (canlı)
Terfi 22 spool → backfill kabukta_yok 22→0, eslesti 22, kismi 22 · montaj reset+drenaj →
22/22 format=montaj, montaj_var=true, eşleşme 22/22, **_l2_meta 22/22 ($0)**, sahte manuel_onay
temizlendi.

### 158'e
Onay Kuyruğu read-before-write cevaplandı (excel tüketici VAR; izometri oneri_hazir bilinçli yok;
izometri manuel_onay DELİK) → saf implementasyon. Format hattı sıradaki: Y200 ST37 + W-3.9.

## OTURUM 158 — FORMAT KODUNA DOKUNULMADI; hattı besleyen kazanımlar

158'in ana işi Onay Kuyruğu (W-2.15) + taslak önizleme (W-2.14) idi; format_tanit / l2-parser /
fingerprint tarafında sıfır değişiklik. Format hattını doğrudan ilgilendiren üç kazanım:

1. **Format uyarılarının tüketim yüzü doğdu:** parse uyarıları (dn_bulunamadi,
   pipeline_no_uyusmuyor, guven_skoru_dusuk, malzeme_bos...) artık devre_detay Onay Kuyruğu
   sekmesinde kod+mesaj+ağırlık renkli listeleniyor ve tekil kapatılabiliyor — 157'de tespit
   edilen "manuel_onay tüketicisi YOK" deliği kapandı. Format öğretim oturumları artık canlı
   uyarı havuzundan beslenebilir (hangi format hangi uyarıyı üretiyor, tek ekranda).
2. **kabukta_yok artık operatöre görünür:** atanmamışlı dosyalar ayrı grupta, "Detay" →
   spool_no + sebep (kabukta_yok / pipeline_kok_cikarilamadi). 157 kapsam-sınırı notundaki
   "kimlik/eşleşme sorunu format öğretimiyle çözülmez" yönlendirmesinin UI zemini hazır;
   buradan format_tanit/eşleştirme köprüsü ileride (uyarı dili tasarımı).
3. **NOT→alıştırma zinciri CANLI doğrulandı:** bcmghbnv mbn terfisinde alistirma sütunu doldu
   (l2-parser alistirma_ipucu_kurali + eslestir deg.alistirma). Montaj ailesi parantezli adlarda
   da tuttu: `M100-317-xx-ALS N(2).1.pdf` → 157 regex'inin `(?:\s+\d+\(\d+\))?` parçası sahada
   çalıştı, 28/36 spool montaj_json aldı. Cihat'ın "not okuma koptu" gözlemi bu vakada
   doğrulanmadı; 159'a format-bazlı not_metni taraması + imalat_not UI teyidi.

159 format sırası (değişmedi): Sefine şablonu (IFS köprüsü, en ucuz) / Y200 ST37 + W-3.9 /
W-2.4 sınıflandırma+yönlendirme tasarımı (YENI-VERI-KAYNAKLARI-ANALIZ.md girdileriyle).

---

## OTURUM 159 — FORMAT KODUNA DOKUNULMADI; YÖNETİM MİMARİSİ 160 ANA İŞİ OLARAK DOĞDU

159'un ana işleri iş emri terfisi + NOT kanıt turu + spool modal zenginleştirmesiydi; format_tanit /
l2-parser / fingerprint tarafında sıfır kod değişikliği. Hattı doğrudan şekillendiren üç çıktı:

1. **NOT/alıştırma format dağılımı (kanıt SQL, LATERAL spoollar[]):** Tersan M110 İmalat Resmi
   555 dosyada 515 not_var + 73 alistirma_var + 1 KISMI — zincir SAĞLIKLI. Tersan M110 Montaj
   (genel+resmi) 559 dosyada 0, PAOR (Ana Çizim + Isometric View) 54 dosyada 0, format-yok 218'de
   0 — YAPISAL: bu kuralların not_metni alanı tanımsız ("koptu" değil "hiç bağlanmadı"). İhtiyaç
   doğarsa formata alan eklenir (montaj belgelerinde NOT bloğu var mı önce saha teyidi). Ekran
   kanıtı: KISMI rozeti + imalat_not QR personel uyarısı canlıda (bcmbvö S01) — 150'lerden beri
   kurulan NOT→alıştırma/imalat_not zinciri uçtan uca üretimde.
2. **MK-159.2 — format_tanit'in ürün kimliği KİLİTLENDİ (Cihat kararı):** AYRI MODÜL (izometri
   batch gibi), tüm taraflar aynı altyapıyı kullanır, çift taraflı gelişir. Wizard spool modalına
   gömme/çapa fikri İPTAL (159'da çapa stub'ı koddan kaldırıldı). Operatör akışı: zayıf/tanınmadı
   satırı → `format_tanit?is_id=` (dosya+format+spool bağlamı İŞTEN okunur, PDF storage'dan
   otomatik açılır — "dosyayı bulup açmak uzun iş" şikâyetinin kalıcı çözümü). format_tanit'e
   **DEĞER KİPİ** eklenecek: B2'nin ürünleşmesi — operatör sağdaki PDF'ten okuyup değer yazarsa
   `taslak_duzeltmeleri`'ne (işaretli, MK-111.2); "bu alan hep burada" derse B1 kural patch.
   İki kip tek ekranda ayrışır.
3. **160 ANA İŞ — FORMAT YÖNETİM MİMARİSİ:** karar soruları sabitlendi: (a) tek otorite — DB
   parser_kural vs format-paketleri.js ikiliği (MK-155.1) nasıl çözülür; (b) öğretim adresi
   tablosu (format türü → yazma hedefi); (c) değer/kural kipi ayrımı; (d) W-3.1/3.2 köprüleri;
   (e) W-3.4 kardeş yayılımı (155 reçetesi: deploy → sha düşür → reset → kanıt). Çıktı:
   docs/FORMAT-YONETIM-MIMARI.md + ilk köprü canlı.

Format hattı klasik kuyruğu değişmedi (Y200 ST37 + W-3.9 panzehiri / Sefine şablonu / W-2.4),
ancak sırası yönetim mimarisinin ARKASINA alındı — öğretim turlarına girmeden "neyi nereye
yazdığımız" netleşmeli (155 adres dersinin mantıksal sonucu).

---

## Oturum 160 (2026-06-06) — köprü altyapısı + mimari doküman; öğretim turu YOK
1. **`?is=&kaynak=` yükleyici** format_tanit'e eklendi (845 satır): iki kuyruk/iki bucket çözümü,
   signed-URL→storage-download yedekli indirme, `_isPdf` + `_bytesBase64` ile AI-oku köprü uyumu,
   `_fnOnerUygula` ortak helper (MK-151.5 davranışı birebir korunarak fileInput'tan ayrıştırıldı).
2. **MK-155.1 ⚠ uyarısı:** `_PAKET_AILELER=[tersan_cadmatic_spool, tersan_cadmatic_montaj]` —
   oto-tespit/format yükleme paket ailesine düşerse banner. Sessiz başarısızlık bitti.
3. **Batch W-3.2 köprüsü:** kuyruk-durum `id` → `_dosyalar[].is_id` (canlı polling + 2 resume yolu);
   "⚠ Bilinmeyen" rozetinin yanında **Tanıt** butonu. Nav'a "Format Tanıt" girişi (ares-layout).
4. **B2 kartı** (amber, "DEĞERİ DÜZELT — yalnız bu spool") format_tanit'e kondu ama AYNI OTURUMDA
   UYKUYA alındı — Cihat değer işini wizard spool modalında istedi (yan PDF panel). Kod durur,
   `&pl=&sn=` gelirse uyanır. Kip ayrımı sözlüğü: MK-160.2.
5. **docs/FORMAT-YONETIM-MIMARI.md:** dört katman (K1 belge sınıfı / K2 kimlik / K3 satır-alan /
   K4 değer) × yazma hedefi × etkinleşme tablosu; tek otorite kararı (MK-160.1) ve W-3.4 yayılım
   sözleşmesi tek sayfada.
6. **KARARLAR.md gerçeği:** 139–159 hiç işlenmemişti (MK-159.3 ikinci vaka) — 154–160 seti
   kaynak-kanıtlı işlendi, 139–153 boşluk notu dosyada. MK-160.3 (salt görüntüleyici inceltmesi),
   MK-160.4 (OPR kalem ekleme), MK-160.5 (önizleme parse enjeksiyonu) 161'de işlenecek.
Format hattı klasik kuyruğu (Y200 ST37 + W-3.9 panzehiri / Sefine / W-2.4) değişmedi; ilk gerçek
öğretim turu artık köprüden girilerek yapılabilir (batch Tanıt → canlı test 161 açılışında).

---

## Oturum 161 (2026-06-06) — köprü canlı kanıt + W-3.9 gemide + glyph canvas çözümü + ADRES SAHA TEYİDİ
1. **Köprü (W-3.2) canlı:** batch "Tanıt" → `format_tanit?is=&kaynak=batch` PDF'i işten açtı; RLS
   sorunu çıkmadı. Y200'de otoTespit 6/6 yeşil (a093eaaa), `spool_no → S01` l2.alanCikar canlı.
2. **ADRES TABLOSU SAHADA DOĞRULANDI (E120 frenli vaka):** E120 PDF'inde otoTespit "tersan
   deneme"ye eşleşti; MK-158.1 freniyle yazmadan önce DB teyidi yapıldı → E120/M ailesi üretimde
   **e1fb879d (paket)**, montaj 39a2c81b; **a093eaaa = Y-ailesinin DB formatı** (`(Y\d+-\d+-\d+)`
   regex'i dar değil DOĞRU — aile sınırı). Yanlış kayda öğretim son anda önlendi ("tanıttım ama
   düzelmedi" tuzağı). AÇIK: otoTespit requires_ai=false dışını taramadığından paket-aile PDF'inde
   ⚠ banner tetiklenmiyor — çapraz doğrulama gerekiyor (yol haritası 161 maddesi).
3. **W-3.9 panzehiri GEMİDE:** `_turetZorunlu()` altı kapı (hydrate/koş/markDirty/iki patch
   yolu/çip metni) — DB'de satir_tipleri aktifken cap/et/dn'ye çöp regex koşulmaz/yazılmaz, elle
   dönüş kapalı. Y200 öğretim turunun ön şartı (FORMAT-YONETIM-MIMARI §6) kapandı.
4. **Glyph CANVAS çözümü (W-3.7):** kök neden Cadmatic'in geçersiz `/ToUnicode /Identity-H` ismi
   (pdffonts uni=no) — pdf.js atar, poppler/Acrobat hoşgörür. `ares-pdf-tounicode.js`: bellekte
   artımlı identity-ToUnicode; klasik xref (E120) + XRef stream (Y200) tabanları; pdf.js 1.10
   mekanik 5/5+5/5 + idempotent + kapılı; canlı ekran "glyph: temiz ✓". format_tanit loadPdf +
   wizard dpvSec entegre. Metin katmanı onarımı (glyph-onar, L1) ayrı ve yerinde durur.
5. **Öğretim KAYDI yapılmadı (bilinçli):** oturum doldu; Y200 ST37 satır öğretimi + W-3.4 yayılım
   reçetesi (kural sonrası sha düşür → kardeş reset → L2/$0 kanıt) 162'nin ilk işi. Alanlar 6/6
   hazır, tek eksik malzeme_tablosu satır öğretimi + kaydet.
