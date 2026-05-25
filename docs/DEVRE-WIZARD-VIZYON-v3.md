# Devre Wizard — Vizyon & Uygulama Belgesi (v3 — FINAL KARARLAR)

> **AresPipe · Tasarım Belgesi · 25 Mayıs 2026 (Oturum 124)**
>
> Bu belge, devre yükleme akışının (wizard) **son halini** tanımlar. Oturum 124'te
> Cihat ile yapılan uzun karar görüşmesinden + arşivdeki önceki kararlardan derlenmiştir.
>
> **Bu bir hayal listesi değil, uygulanabilir plandır.** Kararlar kilitli; ekran akışı
> mockup'ta sınanacak (bkz. Bölüm 9 — Koruma Bantları).

---

## 00 — Bu Belgenin Yeri ve Atıfları

Bu belge sıfırdan bir fikir değil; mevcut vizyon belgelerinin **çocuğudur** ve onlara dayanır:

- `docs/SPOOL-AI-VIZYON.md` (v2.1) — ürün vizyonu, A-B-C-D-E-F katman yapısı, felsefe testi
- `docs/VIZYON-VE-MODULER-MIMARI.md` — Vizyon 1 (klasör yükleme), Vizyon 2 (STEP koordinat),
  Vizyon 3 (çapraz validasyon), Vizyon 8 (pasif öğrenme/RAG), parse pipeline şekli
- Oturum 97 (KARAR-97.0–97.13) — Devre Wizard v2 mimarisi, füzyon motoru, migration 080
- Oturum 99 (MK-99.1–99.5) — Wizard iskeleti, Storage path, slugify, hidden filtre
- Oturum 106 (MK-WIZARD.4) — 5 adımlı akış, kabuk kilidi, mutabakat ekranı, "doğrulanmadı" damgası
- Oturum 113 (foundation A kararı) — client-loop drenaj, 508'in kökten çözümü
- Oturum 48 (MK-48.5, KARAR-48.1) — format öğrenme döngüsü, veri sahipliği politikası B
- Oturum 120 (MK-120.6) — L3 politikası (otomatik/onaylı/kapalı)

**v3'ün katkısı:** Yukarıdaki parçaları tek omurga etrafında birleştirir, çelişkileri çözer,
fazlandırmayı vizyon tetikleriyle hizalar.

---

## 01 — Omurga Fikir

**Wizard ayrı bir sayfa değildir. Devre detay sayfasının "TASLAK MODU"dur.**

Tek sayfa, iki durum:

- **TASLAK** — turuncu çerçeve/bant + "ÖNİZLEME" damgası. Doğrulanmamış alanlar sarı,
  eksik/fazla spool mutabakatı görünür. Gerçek devre detay sayfasının birebir simülasyonu:
  kullanıcı, devre canlıya geçince **nasıl görüneceğini** taslakken görür.
- **CANLI** — onay sonrası aynı sayfa; taslak bandı kalkar, gerçek listeye düşer.

**Onay = taslağın canlıya terfisi.** Bu tek hamle şunları birleştirir:
- "Mevcut/yeni devre" ayrımını kaldırır (taslak da bir devredir, sadece henüz canlı değil)
- Önizleme → onayla → canlı sıralı akışını kurar
- Onaylananların bir sekmede beklemesini sağlar (= taslak listesi)
- MK-49.B'nin "aynı bileşen iki yerde" ilkesini en uç noktaya taşır: artık iki yerde aynı
  bileşen değil, **tek sayfanın iki hali.**

---

## 02 — Taslak Nerede Yaşar (KARAR)

**Taslak gerçek bir devre DEĞİLDİR.** Onaya kadar:
- `devreler` tablosunda kayıt YOK
- spool ID (A-0504 prefix), iş emri no, QR — hiçbiri üretilmez
- Sadece bu sekmede yaşar

**Veri kaynağı:** Taslak, **mevcut katmandan türetilir** — yeni staging tablosu YOK:
- Yüklenen dosyalar → `devre_dokumanlari` (zaten var)
- Parse sonuçları → kuyruğun `parse_sonuc` JSONB'si (zaten var)
- Excel kabuğu → parse edilmiş halde (zaten var)

Taslak = bu üçünün okunup ekranda birleştirilmesi. Yeni tablo, yeni RLS, ayrı "terfi" şeması
gerekmez.

**Tek ekleme:** Kullanıcının ağaçta yaptığı işaretlemeler (revizyon-öncesi/bilgi klasörü) +
mutabakat düzeltmeleri kaybolmamalı. Bunlar `devre_dokumanlari`'na **küçük alan** olarak eklenir
(`taslak_haric BOOLEAN`, `taslak_not JSONB`) — yeni tablo değil, mevcut tabloya minik ekleme.

**Onay anı = terfi:** "Devreyi Onayla" → gerçek `devreler` INSERT + spool ID atama + QR üretimi
+ canlı listeye düşme + D-katmanı veri damarına akış (Bölüm 7).

> **KRİTİK KURAL:** Terfi, mevcut `devre_yeni.html`'in spool ID / QR / tenant prefix üretim
> mantığını **ÇAĞIRIR, KOPYALAMAZ.** İki ayrı "devre oluşturma" yolu doğmamalı. (Bkz. Bölüm 8.)

---

## 03 — Giriş Akışı (KARAR)

1. **Tersane ve proje AYRI seçilir** (aynı kontrolde birlikte gelmez).
2. **"Mevcut/yeni devre" ayrımı YOK** — tek akış.
3. Mevcut devreye ekleme: devre detaydaki **"Spool Ekle"** butonu bu akışa köprü olur;
   onaydan sonra devre detaya geri döner.
4. Yeni devrede: önce Excel'den kabuk (beklenen spool kümesi), sonra dökümanlar.

---

## 04 — Klasör Yükleme & Revizyon Ayıklama (KARAR)

- Sürükle-bırak sonrası **Windows-gezgini benzeri ağaç** görünür (devre detaydaki gibi).
- Kullanıcı, **eşleştirmeye girmeden önce** klasörleri işaretler:
  - "Bu klasör bilgi amaçlı" → eşleştirmeye sokma
  - "Bu klasör revizyon-öncesi" → eşleştirmeye sokma
- **Neden kritik:** Revizyon-öncesi PDF'ler Excel kabuğuna **yanlış eşleşebilir** (eski çizim,
  yeni listeye monte olur). Gözle ayıklamak zor, kaçırılır. Ağaçta başta ayıklamak, yanlış
  eşleşmeyi **kaynakta** keser. Bu, "fazla spool" vakalarının çoğunu daha mutabakata gelmeden eler.
- Auto-detect mantığı (97/99): klasör adı → uzantı → `diger`. Hidden/sistem dosya filtresi
  (MK-99.4) korunur.

---

## 05 — Mutabakat (KARAR — kalp)

**Kabuk = otorite.** Excel "20 spool: S01…S20" dediyse, referans budur. Dökümanlardan çıkanlar
kabuğa **eşleştirilir**, kabuğun yerine geçmez.

Dört durum (106 / MK-WIZARD.4):

| Durum | Renk | Anlamı | Davranış |
|---|---|---|---|
| Eşleşen + okundu | 🟢 yeşil | Kabukta var, parse güçlü | Tamam |
| Eşleşen, parse zayıf | 🟡 sarı | Kabukta var, okuma güveni düşük | "Doğrulanmadı" damgası → kontrol |
| Eksik | 🔴 kırmızı | Kabukta var (S07), PDF yok | "S07 için döküman yok" uyarısı |
| Fazla | 🟠 turuncu | PDF'te var (S21), kabukta yok | **Sessizce eklenmez — SORAR** |

- **18 çıkarsa:** eksik 2 kırmızı kalır, mutabakat geçilmeden devre onaylanmaz.
- **21 çıkarsa:** fazla 1 turuncu → "Listede olmayan spool buldum: S21 — gerçek mi, revizyon-öncesi/
  yanlış eşleşme mi?" Kullanıcı reddederse atılır, kabul ederse kabuğa eklenir.
- **"23/25 asla sessiz geçmez"** — bu ekran geçilmeden devre "tamamlandı" olmaz.

**Füzyon motoru (KARAR-97.x) — alan-seviyesi çakışma:**
Aynı alan iki kaynaktan farklı gelirse (Excel "WN flanş", izometri "SO flanş"):
- İki boyutlu skor: parse güveni × kaynak içerik önceliği (JSONB)
- **Yüksek riskli alanlar** (flanş tipi, malzeme grade, DN) → manuel onay
- **Düşük riskli alanlar** (ağırlık, yüzey) → otomatik çözülür

**Wizard çıktısı spool detayın TÜM sekmelerini besler** (sadece spool listesi değil):
- Excel/BOM → malzeme listesi (parçalar tanınıp `spool_malzemeleri`'ne)
- Spool imalat resmi PDF → spool detay çizimi
- İzometri → dirsek dönüş yönleri, uzunluklar (`yon_dizilim`, ileride 3D)
- Montaj resmi → montaj sekmesi (`montaj_json`)

---

## 06 — Öğrenme Döngüsü (KARAR)

**Onaylı öğrenme (b) — anlık (a) DEĞİL.** AI kuralı kontrolsüz canlıya girmez ("uydurmadan
tam doğru" ilkesi).

**Akış:**
1. İlk kez görülen / kuralı olmayan format → ilk izometri L3 (vision) → okunur **+ kural taslağı çıkar**.
2. Mutabakatta kullanıcıya gösterilir: "Bu formatı tanıdım, kuralı kaydedeyim mi?"
3. Onaylanırsa kütüphaneye yazılır → **kalan spool'lar + sonraki devreler L2** (bedava, deterministik).

**L3 ne zaman çalışır (netleştirme):**
- Format tanınıyor + kuralı VAR → ilk dahil hepsi L2, L3 yok.
- Format tanınıyor, kural eksik/yok → L3'e gider, öğrenir, kalan L2.
- Format hiç görülmemiş → ilk PDF L3 (mecbur), öğrenir, kalan L2.
- **Kural eksikse (S01'de redüksiyon yoktu, S40'ta çıktı):** o tek spool L3'e düşer, kuralı
  zenginleştirir, S41+ yine L2. Yani "1 L3" bazen "3-5 L3" olur, asla "150 L3" değil.

**İki düzeltme türü ayrılır (KRİTİK):**
- **Spool-özel düzeltme:** "Bu devrede S05'in DN'i baskı hatası" → sadece o spool'a yazılır,
  kurala DOKUNMAZ (yoksa doğru kuralı bozar).
- **Format-kuralı düzeltme:** "Bu formatta DN hep şu sütunda" → `parser_kural`'a yazılır,
  kalan 9'u + sonraki devreleri kurtarır.
- Mutabakatta düzeltme yaparken seçim sunulur: "sadece bu spool" / "bu formatın kuralı".

**Onay hiyerarşisi (KARAR-48.1 / Veri Sahipliği B):**
- Tek tenant onayladı → kural o tenant'a özel (tenant-özel).
- Bağımsız ikinci tenant VEYA süper admin doğruladı → genel kütüphaneye terfi (`genel_kullanim=true`).
- Anonimleştirilmiş kural AresPipe'ın; ham müşteri verisi müşterinin (KARAR-48.1).
- DB karşılığı: `parser_kural` + `egitim_kaynagi` + `dogrulayan_tenant_sayisi` + `genel_kullanim`.

---

## 07 — Arka Plan İşleme (KARAR — Hibrit)

**Mevcut durum (113/A):** Drenaj tarayıcıda döner (client-loop), server→server çağrı yok →
Vercel 508 kökten çözülmüş. Helper lock'suz/atomik: bir PDF işlenirken kuyruğa dokunmaz,
parse+kaydet tek atomik adımda biter. Bu yüzden **sekme kapanırsa yarım iş `bekliyor`'da kalır,
hata'ya DÜŞMEZ** — bir sonraki tetiklemede temiz işlenir. (Oturum 124'te kodla doğrulandı.)

**Sekme davranışı (kodla doğrulandı):**
- Henüz sıra gelmemiş PDF'ler (`bekliyor`) → dokunulmamış, güvende.
- O an işlenen tek PDF → kaydet adımına ulaşmadan sekme kapanırsa `bekliyor` kalır, tekrar işlenir.
- En kötü ihtimal: bir PDF iki kez parse edilir (birkaç kuruş veya bedava L2). Asla veri bozulması
  veya "kullanım kilitlenmesi" değil.

**FAZ ŞİMDİ — A-oto (Yol 1):**
- Otomatik tetik: yükleme bitince drenaj kendi başlar, kullanıcı butona BASMAZ.
- Retry: tur bitince `kalan > 0` ise döngü kendini sürdürür ("bazen duruyor, yeniden bas"
  derdinin çözümü — helper satır ~188'de tur sonu retry'ı eksik).
- Takas: tam işlenirken sekme açık kalmalı. Ama L2 öğrenildikten sonra işlem anlık → takas görünmez.

**FAZ SONRA — B (final hedef, EŞİĞE BAĞLI):**
- `izometri-oku` modüle çıkar, server worker doğrudan import eder (HTTP atlaması yok → 508 yok),
  Cron sürer. Sekme kapatılabilir, gerçek arka plan, gece boyu işler.
- **Neden şimdi değil:** B, 508'i server tarafında YENİDEN çözmeyi gerektirir (bug açma yüzeyi).
  113'te bilinçli ertelendi. Asıl kaldıraç B değil, **L2 öğrenme** — format öğrenilince büyük
  devre saniyeler sürer, sekme derdi buharlaşır.
- **B'ye geçiş eşiği (veriyle, tahminle değil):** Pilotta "ilk-görülen-format + 100+ spool devresi"
  düzenli oluyor VE kullanıcı sekme-bekleme şikayeti geliyorsa.

**150-spool gerçeği:** L3 ağırlıklı 150 spool ≈ 30-60 dk sekme bağımlılığı (dayanılmaz).
L2 ağırlıklı 150 spool ≈ birkaç saniye. Bu yüzden öğrenme (Bölüm 6) "yağ gibi akma"nın asıl
kaldıracıdır; B ikincil.

---

## 08 — L3 Maliyet Kontrolü (KARAR — MK-120.6)

- L3 üç durumlu: **otomatik / onaylı / kapalı.**
- **Devre (ve belge-tipi) bazında** ayarlanabilir.
- Varsayılan "otomatik" ama kullanıcı kapatabilir.
- **Somut kullanım (PAOR):** İzometri resim formatında (taranmış), L2 metin çıkaramaz, mecburen
  L3 = pahalı. AMA o devrenin Excel'i (IFS/BOM) spool + malzemeyi zaten veriyor → izometriden
  veri çıkarmaya gerek yok, sadece görsel olarak `'sakla'`. Bu devrede L3 kapalı → sıfır maliyet.
  İhtiyaç olursa açılır, işi görünce kapatılır.

---

## 09 — Koruma Bantları (UYARI — belgeyi uygulanabilir tutan kurallar)

Bu belge büyük bir vizyon; tehlikesi koddan değil, **kapsam şişmesinden** gelir. Üç koruma:

**KORUMA-1 — Yeniden yazma YOK, üstüne bin.**
Mevcut çalışan parçalar **yeniden yazılmaz**, wizard onların üstüne biner:
- `izometri-oku` parse motoru (Yaklaşım Y) — sadece çağrılır
- Drenaj client-loop (113/A) — sadece A-oto için genişletilir (retry + otomatik tetik)
- Montaj eşleşme, format registry — sadece kullanılır
- `devre_yeni.html` spool ID/QR/prefix üretimi — terfide ÇAĞRILIR, kopyalanmaz

**KORUMA-2 — Açık borçlar wizard'a YEDİRİLMEZ.**
Bu vizyon, mevcut açık borçların yerine geçmez. Borçlar belgede kayıtlı kalır (Bölüm 11),
wizard bittikten sonra ayrı ayrı kapatılır. İstisna: doğal olarak aynı koda değen pipeline
eşleştirme borcu (MK-124.1) "yedirme" değil, wizard eşleştirme fazının parçasıdır.

**KORUMA-3 — Kararlar kilitli, ekran akışı mockup'ta sınanacak.**
Bu belge kararları dondurur ama UI detayını mockup'a bırakır. Mockup'ta bir şey tutmazsa
belge değil, sadece o ekran düzeltilir. ("Kafamda canlandıramıyorum" → mockup bu yüzden var.)

---

## 10 — Bozulma Riski Haritası (hiçbiri çıkmaz değil — "süreç uzar ama yaparız")

| Risk | Seviye | Neden çıkmaz değil | Yönetim |
|---|---|---|---|
| Taslak→canlı terfi mantığı | Dikkat | Geri alınabilir (taslak gerçek tabloya yazmıyor); en kötü "iki yolu birleştir" refactoru | Terfi `devre_yeni` mantığını ÇAĞIRIR (KORUMA-1) |
| `devre_dokumanlari`'na alan ekleme | Düşük | `ADD COLUMN` mevcut veriyi bozmaz, en güvenli migration | Dry-run (BEGIN...ROLLBACK) + okuyan kodu grep'le (MK-99/MK-51.4) |
| Drenaj helper değişikliği | Orta | Lock'suz atomik desen çift-parse'ı zararsız kılar; `git revert` 5 dk | 3 çağıranı (batch/wizard/devre_detay) test et |

**Çıkmaz NEYE denir:** "Mimariyi yeniden yazmadan ilerleyemezsin" türü. Örnek: B'ye körlemesine
atlamak (508'i yeniden açma riski). Wizard'ın bu üç riski o cinsten DEĞİL — "çağır, kopyalama"
kuralına uyulduğu sürece düz yol. **Tek gerçek tehlike teknik değil, disiplin (kapsam şişmesi)** —
KORUMA-1/2/3 bunun panzehiri.

---

## 11 — Açık Borçlar × Wizard Fazı (kaybolmasınlar diye)

| Borç | Wizard'la ilişki | Ne zaman |
|---|---|---|
| Pipeline eşleşme hatası (MK-124.1, eski MK-123.D) | Aynı koda değer (eşleştirme/mutabakat) | Wizard eşleştirme fazında çözülür |
| Boş NOT parse kaynağı (A-NOT) | Aynı koda değer (veri kalitesi) | Wizard parse/mutabakat fazında değerlendirilir |
| Web-side spool durum sync (`aktif_basamak`/`ilerleme`) | Aynı koda değer (devre detay görünümü) | Taslak/canlı görünüm elden geçerken |
| `boy_mm` int yuvarlama (`_tipCevir`) | İLGİSİZ (parse motoru derininde) | AYRI, dikkatli iş — wizard sonrası |
| 117 (`yukleyen_id` null, ~11 dosya) | Kısmen (wizard yeni vaka üretmez) | Eski dosya temizliği AYRI |

### MK-124.1 — Montaj eşleşme borcunun GERÇEK kök nedeni (123 teşhisi düzeltildi)

Oturum 124'te tek-montaj kanıt testi yapıldı (`E120-722-1021-ALS.1.pdf`, kuyruk `4d6a3607-…`,
devre `e07ba2db-…`). Sonuç **123'teki "bayat parse" teşhisini çürüttü:**

- Kuyruk `bekliyor`'a + `deneme_sayisi=0`'a çekildi, drenaj konsoldan elle tetiklendi
  (`ARES_IZO_DRENAJ.izometriDreneEt`, devre-özgü filtre). Parse **çalıştı** (`islenen:1, manuel:1,
  hata:0`, 19.5 sn → L3).
- Ama `montaj_json` **yine dolmadı.** `parse_sonuc` incelendi: dosya montaj değil **2 spool'lu**
  okundu (`spoollar:[S01,S02]`), `montaj_var` alanı zaten yok.
- **ASIL SEBEP:** `_eslesme` bloğu → `sebep:"dosya_adi_pipeline_yok"`, `eslesen:0, atanmamis:2`.
  Parse `pipeline_no`'yu **`"722-1021-ALS"`** çıkardı; devredeki gerçek pipeline
  **`"E120-722-1021-ALS"`** — baştaki **`E120-` öneki düşüyor** → hiçbir spool'a bağlanamıyor →
  ne spool ne montaj_json yazılabiliyor.
- **Yani borç "montaj re-parse" DEĞİL, "pipeline_no eşleşme hatası" (önek kaybı).** 123'te
  planlanan "289 bayat montajı toplu re-parse" **geçersiz** — re-parse aynı eşleşme hatasını
  289 kez verir, hiçbir şey düzelmez. İyi ki tek dosyayla ölçtük (verification-first kazandı).
- **Çözüm yeri:** wizard'ın eşleştirme/mutabakat fazı (pipeline_no'nun dosya adından + içerikten
  doğru çıkarılması; önek normalizasyonu). KORUMA-2 gereği şimdi yedirilmez, o fazda çözülür.
| Boş NOT parse kaynağı (A-NOT) | Aynı koda değer (veri kalitesi) | Wizard parse/mutabakat fazında değerlendirilir |
| Web-side spool durum sync (`aktif_basamak`/`ilerleme`) | Aynı koda değer (devre detay görünümü) | Taslak/canlı görünüm elden geçerken |
| `boy_mm` int yuvarlama (`_tipCevir`) | İLGİSİZ (parse motoru derininde) | AYRI, dikkatli iş — wizard sonrası |
| 117 (`yukleyen_id` null, ~11 dosya) | Kısmen (wizard yeni vaka üretmez) | Eski dosya temizliği AYRI |

> Cihat kararı (124): "Açık borçların yedirilmesi riskliyse geçeriz; bitirdikten sonra
> Claude'un uygun gördüklerini yaparız. Döküman sağlamsa yavaş yavaş beraber yaparız."

---

## 12 — Fazlandırma (vizyon tetikleriyle hizalı)

**FAZ 1 — Çekirdek wizard (şimdi):**
- Giriş (tersane+proje ayrı, mevcut/yeni ayrımı yok)
- Klasör ağacı + revizyon ayıklama
- Excel kabuk oluşturma (mevcut excel-parser üstüne)
- İzometri/montaj/imalat PDF parse (mevcut izometri-oku çağrısı)
- Mutabakat ekranı (4 durum + füzyon)
- Onaylı format öğrenme (parser_kural taslağı + onay)
- A-oto (otomatik tetik + retry)
- L3 devre-bazlı kapatma
- Taslak modu → onay → canlı terfi

**FAZ 2 — Olgunlaşma (vizyon tetikleri: pilot 50+ spool, 3 ay):**
- Çapraz validasyon derinleşir (Vizyon 3 — AI vs IFS token-free karşılaştırma)
- Pasif öğrenme / RAG (Vizyon 8 — tersane profili, feedback log)
- Genel kütüphane terfisi (çift doğrulama akışı)

**FAZ 3 — İleri (vizyon tetiği: müşteri STEP veriyorsa / ihtiyaç kanıtlanınca):**
- STEP/IGES koordinat çıkarımı (Vizyon 2 — matematiksel parse, sıfır AI, `buildChain`'e)
- B'ye terfi (server worker + Cron, sekme serbest) — EŞİK: Bölüm 7

**WIZARD'IN DIŞINDA (karışmasın — wizard'ın beslediği ayrı işler):**
- Yetki blokları (kullanıcılar, role-bazlı erişim)
- Arşivleme + foto boyut küçültme (5MB→500KB, biten gemi → arşiv)
- Yarım bırakma / eksik malzeme (imalat tarafı, mobil PWA)
- Ölçekli QR foto analizi + lazer 3D tarama (kalite/imalat, foto-AI altyapısı)

---

## 13 — Sonraki Adım

1. Bu belge onaylanır (oku, düzelt).
2. **Mockup** — taslak modu / mutabakat / ağaç ekranları çizilir, kararlar görsel üstünde sınanır.
3. **Kod** — FAZ 1, küçük cerrahi, KORUMA-1/2/3 altında.
4. **Final** — pilot tenant'ta test → ölçüm → FAZ 2/3 kararları veriyle.

---

## Sürüm Geçmişi

| Sürüm | Tarih | Değişiklik |
|---|---|---|
| v1/v2 | 2026-05 (97/106) | İlk wizard tasarımı, 5 adım, kabuk kilidi, mutabakat — parça parça |
| v3 | 2026-05-25 (124) | FINAL kararlar: omurga (taslak modu), taslak yeri (türet, staging yok), A-oto+Hibrit arka plan, onaylı öğrenme + KARAR-48.1 hiyerarşi, L3 devre-bazlı, koruma bantları, risk haritası, borç×faz tablosu, vizyon-hizalı fazlandırma |

> 125+ oturumlarında: bu belge mockup'a ve koda referanstır. Karar değişikliği olursa
> sürüm geçmişine işlenir; KORUMA-1/2/3 her fazda korunur.
