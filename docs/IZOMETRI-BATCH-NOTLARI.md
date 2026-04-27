# İzometri Batch Parser — Çalışma Notları

> **AresPipe · İzometri Batch Sayfası Geliştirme Brief'i**
> 26 Nisan 2026 — Yeni sohbet için hazırlandı
> Önceki bağlam: AI vizyon belgesi v2.1 yazıldı, bu özellik B1 olarak listede.
>
> **34. Oturum Güncellemesi (26 Nis 2026):** Madde 19 eklendi. Madde 12 iptal edildi (Cihat kararı). Tüm mimari kararlar `docs/IZOMETRI-BATCH-KARAR.md`'de detaylı yer alıyor.

---

## 01 — Bu Özellik Nedir, Kısaca

Farklı firmaların farklı program çıktıları olan izometri PDF'lerini sisteme yükleyip, içlerindeki devre/spool/malzeme bilgilerini otomatik çıkararak AresPipe sistemine kayıt etme özelliği.

**Mevcut durum:** Tek formatta deneme yapılmış, `api/izometri-oku.js` Vercel function'ı yarım kalmış (502 Bad Gateway hatası veriyor). Daha önce Claude API ile birkaç işlem yapılmış, sonra API limitinde takılmış.

**Bu sefer hedef:** Sıfırdan doğru mimari ile yapmak. Vercel limit problemi nedeniyle bu sohbette sadece konuşma yapılacak, kod sonra yazılacak.

---

## 02 — Çekirdek Tasarım Felsefesi

Bu özelliğin tasarımı **iki temel ilkeye** dayanır:

### İlke 1 — AI minimum bağımlılık

Hedef: tanıdık formatlarda **sıfır API maliyeti**. Vision API sadece istisnalar için fallback olarak çalışır.

Sebep: aynı formatta her seferinde Vision API'ye ödeme yapmak yanlış mimaridir. Format öğrenildiyse bir daha öğrenilmemeli, kural olarak yazılmalı.

### İlke 2 — Öğrenme döngüsü

Vision API çıktıları + manuel onay → yeni format kuralı için veri olur. Yani her ödenen API ücreti, gelecek ücretleri azaltır.

**Hedef trajektori:** İlk 6 ay %80 Vision (öğrenme dönemi), sonraki yıl %5-10 Vision (sadece istisnalar), yıl 2+ neredeyse sıfır Vision.

Sürdürülemez senaryo: 3 yıl sonra hâlâ %80 Vision'a gidiyorsa mimari yanlıştır.

---

## 03 — Üç Katmanlı Parser Mimarisi

Yeni izometri PDF gelince sistem şu sırayla işliyor:

### Katman 1 — Yapılandırılmış metin çıkarma (sıfır API)

PDF'in **gerçek metni** varsa (taranmış değil, dijital), `pdfjs-dist` veya `pdf-parse` kütüphanesiyle metni çıkar. Format şablonu biliniyorsa satır pozisyonlarına göre tablo okunur.

CAESAR II, AVEVA, Smart 3D, Bentley AutoPLANT gibi modern CAD programlarının çıktıları büyük ölçüde bu kategoriye girer. Bedava, hızlı, deterministik.

### Katman 2 — Kural motoru (sıfır API)

Metin çıkarıldıktan sonra "**Material Code: A106-GRB**" gibi desenleri regex ile yakala. Şablon başına bir kural seti yazılır.

50 satırlık kod, sonra bedava çalışır. Bir kerelik geliştirme, sonsuz çalıştırma.

### Katman 3 — Vision AI fallback (API maliyeti var)

Önceki iki katman başarısız olursa Vision API çağrısı yapılır:
- Taranmış PDF (resim olarak)
- Elle çizilmiş not, anormal sayfa
- Tanınmayan format

Vision asıl iş yapan değil, **güvenlik ağı.** Çıktı manuel onay için kullanıcıya sunulur, onay sonrası DB'ye yazılır.

---

## 04 — Format Tanıma ve Şablon Sistemi

Her gelen PDF için sistem önce format tespit eder:

```
1. PDF metadata kontrolü (üretici program, dosya adı paterni)
2. İlk sayfa header'ı OCR/metin kontrolü
3. Tanıdık format mı? Eşleştir.
```

Tanıdık formatlar `izometri_format_tanimlari` tablosunda saklanır. **Şema 34. oturumda netleşti — `docs/IZOMETRI-BATCH-KARAR.md` Karar 1 ve DB Şeması bölümüne bak.**

**Önemli not:** CAD programları sürüm güncellediğinde format değişebilir. Bu yüzden:
- Her şablon `surum` bilgisi taşır
- Sürekli %5 örnek **rastgele Vision'a gönderilir**, parser çıktısıyla karşılaştırılır
- Sapma varsa şablon güncellenmesi gerektiği uyarısı çıkar

---

## 05 — Batch Kayıtları Tablosu

Her batch işlemi takip edilir:

```sql
izometri_batch_kayitlari (
  id,
  dosya_url TEXT,           -- yüklenen PDF
  format_id UUID NULL,      -- tespit edilen format (varsa)
  durum TEXT,               -- 'kuyrukta', 'isleniyor', 'tamamlandi', 'hata', 'manuel_onay_bekliyor'
  ham_cikti JSONB,          -- parser ne çıkardı (her aşama)
  parser_versiyon TEXT,     -- hangi parser sürümü ile işlendi
  parser_kullanilan TEXT,   -- 'metin', 'kural', 'vision' (üçünden hangisi başarılı oldu)
  manuel_onay_durumu TEXT,  -- 'beklemiyor', 'bekliyor', 'onaylandi', 'reddedildi'
  manuel_onaylayan UUID,
  manuel_onay_at TIMESTAMPTZ,
  hatalar JSONB,            -- parse sırasında oluşan uyarılar
  devre_id UUID NULL,       -- başarılı işlem sonrası oluşan devre
  sonuc_excel_url TEXT,     -- IFS Excel formatına dönüştürülmüş çıktı (opsiyonel)
  yukleyen_id UUID,
  tenant_id UUID,
  olusturma TIMESTAMPTZ,
  guncelleme TIMESTAMPTZ
)
```

Her kayıt **denetlenebilir** — hangi PDF, hangi parser, hangi çıktı, kim onayladı, ne zaman.

---

## 06 — Maliyet Takibi

Vision API çağrıları için ayrı log tablosu (eğer henüz yoksa):

```sql
ai_api_log (
  id,
  ozellik_kodu TEXT,        -- 'izometri_batch', 'izometri_sohbet' vb
  model_adi TEXT,           -- 'claude-opus-4-7', 'claude-sonnet-4-6' vb
  token_in INTEGER,
  token_out INTEGER,
  maliyet_usd DECIMAL,
  baglam JSONB,             -- hangi kayıt için, hangi kullanıcı vb
  basarili_mi BOOLEAN,
  hata_mesaji TEXT NULL,
  kullanici_id UUID,
  tenant_id UUID,
  olusturma TIMESTAMPTZ
)
```

**Aylık eşik kontrolü:** **34. oturumda netleşti — tenant başına 50 PDF/ay default eşik. Aşılırsa otomatik blok DEĞİL, sadece firma yöneticisi + Cihat'a uyarı bildirimi.** (`KARAR.md` Karar 4)

**Format başına maliyet raporu:** "AVEVA E3D formatından gelen PDF'ler için aylık maliyet $40, CAESAR II için $5" gibi metrikler — hangi formata daha çok kural yazılması gerektiğini gösterir.

---

## 07 — Sağlık Kontrolü (B1'in İç Katmanı)

Vizyon belgesi v2.1'de A6 maddesi B1'in içine alındı. Yani parser her batch için **mantık kontrolü** çalıştırır:

- "DN100 boruya DN80 flanş bağlanmış" → fiziksel imkânsız, uyarı
- "Spoolda 0 kaynak görünüyor" → parser hatası muhtemel
- "Toplam ağırlık 0 kg" → veri eksik, uyarı
- "Malzeme listesinde aynı parça 2 kez var" → muhtemel duplicate
- "İzometride DN150 yazıyor ama malzeme listesinde sadece DN100 parçalar" → tutarsızlık

Bu kontroller **kural motoru**, AI değil. Parser çıktısının %30-40'ında hata yakalar, imalata yanlış veri gitmesini önler.

---

## 08 — Manuel Onay Akışı

**%100 doğruluk olmaz, manuel onay zorunlu.**

Akış:
```
1. PDF yüklenir → batch kaydı oluşur (durum: 'isleniyor')
2. Parser çalışır → ham_cikti JSONB doldurulur
3. Sağlık kontrolü çalışır → hatalar varsa flag'lenir
4. Sonuç ekranı açılır → kullanıcı görür:
   - Parser ne anladı (DN, malzeme, kaynak sayısı vs)
   - Şüpheli alanlar kırmızı işaretli
   - Eksik alanlar boş gösterilir
5. Kullanıcı düzeltir/onaylar
6. Onay sonrası → devre oluşur, spoollar oluşur, malzemeler eklenir
7. Eğer Vision API kullanıldıysa → çıktı ileri sürüm format kuralı için saklanır
   **34. oturum güncellemesi:** Aynı sayfada "Bu formatı kaydet" butonu çıkar, kullanıcı isterse tenant-scope kayıt oluşur.
```

**Hiçbir batch çıktısı manuel onay olmadan canlı veriye dönüşmez.**

---

## 09 — Mevcut Sistemle Entegrasyon

İzometri batch çıktısının iki kullanım yolu var:

### Yol A — Doğrudan devre/spool oluşturma

Parser çıktısı sistemde devre + spoollar + spool_malzemeleri tablolarını doldurur. Manuel onay sonrası sistemde "yeni devre" olarak görünür.

### Yol B — IFS Excel formatına dönüştürme

Bazen tersane mevcut süreçleri için IFS Excel formatına ihtiyaç duyar. Parser çıktısı bu formata dönüştürülüp Excel olarak indirilebilir.

**Karar:** Önce Yol A (doğrudan devre oluşturma), sonra istenirse Yol B eklenir. **34. oturum güncellemesi:** Yol B 39+ ürün dönemine bırakıldı.

---

## 10 — ASME Lookup Modülü Bağımlılığı

Vizyon belgesindeki **A18-19 maddesi (ASME standart ölçüler modülü)** B1'in çalışması için kritik altyapı.

İzometride "DN100 SCH40" yazıyorsa, parser bunun **mm karşılığını** (et kalınlığı 6.02 mm, dış çap 114.3 mm) bilmek zorunda. Aynı şekilde ağırlık hesabı için.

**34. oturum kararı (A1):** ASME Lookup tam sistemi izometri batch'ten ÖNCE yapılır. 35. oturum bu işe ayrılır. Helper interface: `ARES_BORU.etKalinligi(dn, sch, malzeme)`, `ARES_AGIRLIK.hesapla(parca)`.

---

## 11 — Kabuller Mantığı (Cihat'ın Sezgisi)

Cihat'ın sektörel sezgisi: izometride bazı bilgiler yazılı olmasa bile **standart kabuller** ile çıkarılabilir:

- **DN50 altı sadece argon kaynak** (sektör pratiği)
- **İzometride bilezik var ve içi görünmüyorsa kaynatılmıştır** (görsel akıl yürütme)
- **Belirli çaplar için et kalınlığı default** (Schedule yazılı değilse SCH40 varsayılır)
- **Slip-on flanş = 2 kaynak** (iç ve dış)
- **Branşman 90° T = 1 kaynak** (boru-T birleşim)

Bunlar AI'dan değil, **kural motoru** ile çıkarılır. Parser şablonu bu kuralları içerir.

**Kullanıcı override edebilir:** Kabuller doğru çıkmıyorsa manuel düzeltme her zaman mümkün.

---

## 12 — ~~Süper Admin Test Laboratuvarı~~ İPTAL (34. oturum kararı)

> **34. oturum kararı (Karar 3):** Bu madde **iptal**. Süper admin test laboratuvarı sayfası YAPILMAZ. Format öğrenme süreci `izometri-batch.html` sayfası içinde, doğal akışın içinde çözülür. Cihat'ın kararı: *"süper admin kısmını devreden çıkarabiliriz, bunu sayfa içinde çözmemiz lazım."*
>
> **Boşluğu nasıl doldurduk:** Tenant-scope (Karar 2) — yeni format önce sadece o tenant'a kaydedilir, kötü kural diğer firmalara yayılmaz. Süper admin "yayına alma" yetkisi yerine, Cihat'a "5+ kullanım sonrası genelleştirelim mi?" bildirimi geçer.

---

## 13 — Vercel /api Altyapısı

Mevcut sistemde Vanilla HTML/CSS/JS + Supabase + Vercel mimarisi var. AI çağrıları için **server-side** gerekli (frontend'den doğrudan API key kullanılmaz, güvenlik).

**Mevcut iş borcu:** `api/izometri-oku.js` 502 Bad Gateway veriyor. Bu çözülecek.

Olası sebepler:
- Function timeout (Vercel free 10 sn, hobby 60 sn, pro 300 sn)
- Vision API'dan büyük PDF için yavaş cevap
- API key environment variable eksik
- Memory limit aşılmış
- Deploy ayarı bozuk

**Yeni yazımda dikkat edilecek:**
- Maksimum dosya boyutu kontrolü (PDF büyükse hata ver, böl/işle)
- Streaming response kullan (long-running işler için)
- Timeout planı (uzun süren işlemler async kuyruğa alınsın)
- Hata loglama (`ai_api_log` tablosuna)
- Retry mantığı (geçici hatalar için)

---

## 14 — Felsefe Hatırlatmaları (Vizyon v2.1'den)

Bu özelliği geliştirirken vizyon belgesinin felsefe maddelerini hatırla:

- **AresPipe ek iş çıkarmaz** — Batch parser kullanıcıya ekstra iş eklememeli, mevcut "Excel ile devre yükleme" işini kolaylaştırmalı
- **Test laboratuvarı → kullanıma açma** — ~~Hiçbir format direkt kullanıma açılmaz~~ **34. oturumda revize edildi:** Tenant-scope ile aynı koruma sağlanıyor, ek sayfa gerekmez
- **AI minimum bağımlılık** — Tekrarlayan görevler kural motoruna aktarılır
- **API maliyet gerçek** — Her özellik için maliyet izlenir
- **İnsan faktörü çıkmıyor** — Manuel onay zorunlu, AI karar vermez
- **Zaman baskısı yok** — Yavaş yavaş, doğru yapılır

---

## 15 — Yapılacaklar Sırası (34. oturumda netleşti)

1. **35. oturum:** A18-19 ASME lookup tam sistemi (Karar 5 — A1) ✓ önkoşul
2. **36. oturum:** Vercel /api altyapısı düzeltilmesi (502 fix, env vars, timeout, Sentry)
3. **36. oturum:** `izometri_format_tanimlari` ve `izometri_batch_kayitlari` tabloları oluşturulması
4. **36. oturum:** `ai_api_log` tablosu (eğer yoksa)
5. **37. oturum:** UI: PDF yükleme, manuel onay ekranı, "format kaydet" akışı
6. **38. oturum:** Genelleştirme bildirimleri + Cihat onay UI'ı (zorunlu self-test günü)
7. **39+:** Pilot AVEVA-PAOR canlıya alınır, 2-3 örnek PDF ile test
8. ~~Sonra: ai_test_sonuclari ve test laboratuvarı sayfası~~ **İPTAL (Karar 3)**

---

## 16 — Kullanıcının Elindeki Format Bilgisi (34. oturumda cevaplandı)

**Cihat'ın 26 Nis 2026 cevapları:**

1. **Hangi CAD format?** → "*Tüm formatlar kullanılıyor, müşterinin formatını bilemeyiz. Her batch yeni format olabilir.*" → Bu cevap **DB-driven mimariyi (Karar 1) zorunlu kıldı.**

2. **Aylık hacim?** → "*Henüz bilmiyorum, sistem hayata geçince göreceğiz.*" → Default eşik tenant başına 50 PDF/ay (Karar 4).

3. **Mevcut izometri-oku.js hangi format?** → AVEVA E3D / PAOR varyantı. Refactor edilecek (Karar 6).

4. **Örnek PDF?** → "*Sonraki oturuma 2-3 örnek PDF yükleyebilirim.*" → 35-37 oturumlarında lazım olur.

---

## 17 — Bağlantılı Dosyalar

- `docs/IZOMETRI-BATCH-KARAR.md` — **34. oturumun çıktısı, mimari kararlar dokümanı (yeni)**
- `docs/SPOOL-AI-VIZYON.md` (v2.1) — Bu özelliğin yer aldığı vizyon belgesi, Madde B1
- `api/izometri-oku.js` — Yarım kalmış mevcut Vercel function (502 hatası), Karar 6 ile refactor edilecek
- `etiketleme.html` — Yarım kalmış mevcut etiketleme sayfası
- `CLAUDE.md` — Geliştirme kuralları, sapmama protokolü
- `son-durum.md` — En son oturum durumu

---

## 18 — Önemli Hatırlatmalar

- **Cihat'ın felsefesi:** Sistem ek iş çıkarmaz, mevcut işi azaltır
- **Cihat'ın yaklaşımı:** ~~Test laboratuvarı → kullanıma açma akışı~~ **Tenant-scope + opsiyonel genelleştirme** (34. oturum)
- **Cihat'ın disiplini:** Sektörel kabuller önce, AI son çare
- **Cihat'ın ufku:** Aylık 1000 spool sistemden geçiyor — batch parser bu hacmi karşılayacak şekilde tasarlanmalı
- **Vercel limit problemi:** Bu sohbette sadece konuşma yapılır, kod yazılmaz. Kod sonra yazılır. **34. oturum bu kurala sadık kaldı — 0 satır kod yazıldı, sadece kararlar alındı.**

---

## 19 — Mimari Prensip: Tek Dosya, Şişmeden, Tüm Formatlar (34. oturum eklemesi)

> **Cihat'ın 34. oturumda netleştirdiği temel prensip — brief'in eksik kalan kalbi:**
>
> *"İzometri batch sayfasına her seferinde farklı bir format olabilir, çünkü müşterinin formatını bilemeyiz. Elimize geçen her formatı tanıtmamız lazım. Tüm formatları tek dosyada toplayıp dosyayı şişirmeden farklı formatlar için kullanmak istiyoruz."*

### Anlamı

- `izometri-batch.html` **tek UI dosyası**, format başına ayrı sayfa açılmaz
- `api/izometri-oku.js` **tek dispatcher dosyası**, format başına ayrı fonksiyon yazılmaz
- Format kuralları **kod değil, veri** — `izometri_format_tanimlari` tablosunda satır olarak yaşar
- Yeni format eklemek **kod commit'i değil, SQL insert** (kullanıcı yapabilir, geliştirici beklenmez)

### Bu prensibin reddetiği yaklaşımlar (34. oturumda netleştirildi)

| Yaklaşım | Neden reddedildi |
|---|---|
| Tek dosyada hardcoded prompt'lar | Her format için 200+ satır prompt → dosya hızla şişer |
| Format başına ayrı `.js` modülü | "Tek dosya" prensibine aykırı, deploy hâlâ gerekir |
| Süper admin sayfasında kural yönetimi | Ek sayfa, ek iş, kullanıcı doğal akıştan çıkar |

### Bu prensibe sadık kalanlar

- DB-driven mimari (Karar 1)
- Tenant-scope kayıt (Karar 2)
- Sayfa-içi format öğrenme (Karar 3)
- Mevcut kodun refactor'la korunması (Karar 6)

**Sonuç:** Brief Madde 04 (Format Tanıma) ve Madde 05 (Batch Kayıtları) zaten DB-driven yöne işaret ediyordu, ama "tek dosya, şişmeden" prensibi açıkça yazılmamıştı. Madde 19 bu eksiği kapatır.

---

> **Bu brief'in amacı:** Yeni sohbete geçildiğinde Claude'un izometri batch sayfası konusunu sıfırdan başlatmaması, mevcut tasarım kararlarının üzerine inşa etmesi. **34. oturumdan sonra:** Bu brief + `KARAR.md` birlikte okunur. Brief geniş bağlamı verir, KARAR.md somut mimari kararları kilitler.
