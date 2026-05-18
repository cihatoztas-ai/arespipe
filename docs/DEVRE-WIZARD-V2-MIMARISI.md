# AresPipe — Devre Wizard v2 Mimarisi

> **Bu belge 97. oturumda Cihat ile yapılan uzun konuşmanın çıktısıdır.**
> Devre yükleme akışının çoklu doküman + füzyon + format öğrenme ile yeniden tasarımı.
> Schema: `migrations/080_devre_wizard_v2_schema.sql` (97'de hazırlandı, 98'de çalıştırıldı).
> Implementasyon yol haritası: 98–104 oturumları.

---

## 0. Niye bu belge var

Mevcut `devre_yeni.html` (~2286 satır) klasik form + IFS Excel + dedup popup'larıyla çalışıyor ve çalışmaya devam edecek. Yanına yeni bir **çoklu doküman wizard'ı** kuracağız. Cihat'ın yazılı vizyonu (97. oturum 7. mesajda):

> *"Sürükle-bırak yüklensin. Excel, spool imalat resmi, 3d görünüş PDF'i, STP, Rhino, akış şeması, montaj resmi — ne varsa kullanabilelim. İlk önce devrenin spool listesi oluşturulsun, sonra arka planda diğer dökümanlar okunarak boşluk bilgiler doldurulsun. Kullanıcı saatlerce beklemesin."*

Bu belge **bunu nasıl yapacağız** sorusunun cevabı.

---

## 1. Üç soru, üç ilke

97'de uzun konuşma şu üç soru etrafında döndü:

**1. Klasör hiyerarşisi kaybolur mu?** Cevap: hayır. Devre detay sayfası Windows Gezgini gibi olur, kullanıcının yüklediği klasör yapısı `devre_dokumanlari.klasor_yolu` kolonunda string olarak korunur. Storage tarafında düz UUID'li dosya isimleri (URL bozulmaz), DB tarafında hiyerarşi (UI render eder).

**2. Çoklu spool tek PDF'te olursa ne olur?** Cevap: tek `devre_dokumanlari` satırı + N adet `spool_dokumanlari` satırı (her birinde sayfa aralığı). PDF fiziksel olarak bir kopya, referansları çok yerden. Token limit aşan PDF'ler sayfa-başına AI çağrısı + kuyruk üzerinden işlenir.

**3. Aynı bilgi iki dosyada farklıysa hangisi doğru?** Cevap: alan başına iki boyutlu skor — `parse güveni × kaynak içerik önceliği`. Düşük riskli alanlar (ağırlık, yüzey) otomatik en yüksek skoru kazanır. Yüksek riskli alanlar (flanş tipi, malzeme kalitesi) manuel onaya düşer. Çelişki kararları loglanır, 5+ aynı yönde karar = sistem önerisi.

Üç ilke buradan çıktı:

- **Hiç kopya yok.** Bir dosya bir kez yüklenir, bir kez saklanır, birden fazla yerden referans verilir.
- **Hiç bekleme yok.** Faz 1 (spool listesi) 5 saniye, Faz 2 (parse) arka planda.
- **Hiç sihir yok.** Çelişki = manuel onay. Otomatik füzyon sadece düşük riskli alanlarda.

---

## 2. 13 KARAR — 97 mimari kararları

### KARAR-97.0 — FK izolasyonu

Yeni tablolar mevcut tablolara FK kurmaz, **tek istisna opsiyonel izleme FK** (NULL'lanabilir, business logic'i etkilemez): `pipeline_malzemeleri.kaynak_dokuman_id`. Geri alma `DROP COLUMN` + `DROP TABLE CASCADE` ile mevcut sistemde sıfır veri kaybı.

### KARAR-97.1 — Tek spool = bir dosya

Sen her spool için ayrı bir STP/Rhino dosyası verildiğini söyledin. Bu hayati: AVEVA'nın multi-gigabyte gemi-geneli STP'leriyle değil, **tek spool dosyaları** ile çalışıyoruz. Parse edilebilir.

### KARAR-97.2 — Füzyon: alan başına öncelik kuralı

Statik öncelik listesi değil, JSONB skor tablosu (`alan_oncelik_kurallari.kaynak_oncelik`). Her alan kendi kuralını taşır. Tenant override edebilir (NULL = sistem default, dolu = tenant özel).

### KARAR-97.3 — Risk bazlı eylem

Yüksek riskli alanlar (cap_dn, et_mm, malzeme, kalite, flansh_tipi, flansh_sinif, adet) `varsayilan_eylem='manuel'` — çelişki varsa kullanıcıya sorulur. Düşük riskli alanlar (boy_mm, agirlik_kg, yuzey_islem, pipeline_no, spool_no, rev, montaj_koordinati, sertifika_no) `varsayilan_eylem='oto'` — otomatik en yüksek skor kazanır.

### KARAR-97.4 — Çelişki kararları loglanır

`fuzyon_karar_log` tablosunda her çelişki seçimi kaydedilir: hangi kaynaklar ne değer önerdi, kullanıcı hangisini seçti. 5+ aynı yönde karar verildiğinde sistem **yeni öneri kuralı** çıkarır ("bu format için flansh_tipi'nde her zaman izometri seçildi, otomatik yapayım mı?").

### KARAR-97.5 — İki boyutlu skor

Mevcut izometri batch'in L1/L2/L3 mimarisi parse güveni veriyor — Excel direkt okuma 1.0, dijital PDF L2 0.95, Vision AI L3 0.6-0.8, raster PDF Vision AI 0.5. Bu **parse güveni** kaynak içerik önceliği ile çarpılır. Sonuç: izometri raster ise Excel öne geçer; izometri dijital ise izometri kazanır. Otomatik, mantıklı, statik liste değil.

### KARAR-97.6 — Windows Gezgini görünümü

Devre detay sayfasının "Belgeler" sekmesi **Windows Gezgini tarzı klasör hiyerarşisi** ile gösterilir. `devre_dokumanlari.klasor_yolu TEXT` kullanıcının yüklediği klasör adlarını saklar. UI '/' karakteriyle parçalar, ağaç render eder. Klasörler genişler/kapanır, breadcrumb üstte gösterilir. Spool detay sayfasında o spool'a bağlı dosyalar **breadcrumb'la** listelenir, her satırda "Devre belgelerinde aç →" linki vardır.

**Erişim ilişkisi:** Spool detayda görünen her dosya devre detayında da görünür (spool ⊆ devre). Tersi olmaz — devre seviyesi dosyalar (BOM Excel, akış şeması) spool detayda görünmez.

### KARAR-97.7 — Çok-spoollu PDF mimarisi

Tek izometri PDF'inde 8 spool varsa: **1 satır `devre_dokumanlari`** (PDF fiziksel kayıt) + **8 satır `spool_dokumanlari`** (her spool için referans, sayfa aralığı dolu). Aynı PDF açıldığında `?page=N` parametresi ile o spool'un sayfasına yönlendirilir.

Hiç kopya yok. 20 spool 24MB PDF = 24MB storage (×20 değil).

### KARAR-97.8 — Multi-spool ortak BOM

Çoklu spool'un ortak malzeme listesi `pipeline_malzemeleri` tablosuna yazılır (zaten kurulu tablo, 19. oturumda eklendi). Spool detay sayfası "Pipeline ortak listesi (12 satır, 300 kg) — 5 spool paylaşıyor" diye **read-only** gösterir. Devre toplam ağırlığı çift saymaz: `SUM(pipeline_malzemeleri.agirlik_kg) + SUM(spool_malzemeleri.agirlik_kg)`.

Yeni: `pipeline_malzemeleri.kaynak_dokuman_id` opsiyonel FK — bu BOM hangi izometriden geldi izlenebilir.

### KARAR-97.9 — Token limit + kuyruk

Vision AI tek seferde ~5-7 sayfa parse edebilir, daha fazlası output token'ı şişirip fail eder. Çözüm: **her sayfa ayrı AI çağrısı**. 20 sayfa = 20 paralel çağrı. `dosya_isleme_kuyrugu` tablosu bu çağrıları yönetir, Vercel function concurrency limitine girer, retry yapılabilir.

`oncelik=1` Faz 1 (spool listesi — hızlı), `oncelik=5` Faz 2 (malzeme parse — arka plan). Kullanıcı progress bar ile takip eder.

### KARAR-97.10 — Storage hiyerarşisi

Supabase Storage yolu:

```
arespipe-dosyalar/
  tenants/{tenant_id}/
    projeler/{proje_id}/                ← gemi seviyesi
      genel-belgeler/                    ← gemi geneli (multi-devre)
      devreler/{devre_id}/               ← devre seviyesi
        {kullanıcı-klasörleri}/          ← izometri/, spool_imalat/, vs.
          {dosya_adi}
```

Gemi arşivlendiğinde `projeler/{proje_id}/` altındaki **tüm devreler topluca** küçültülür. İzometri için `izometri-pdfs` bucket'ı paralel yaşar (eski kayıtlar dokunulmaz), yeni dosyalar `arespipe-dosyalar`'a.

### KARAR-97.11 — STP AVEVA HarmonyWare

97'de Cihat'ın gönderdiği örnek STP analiz edildi: `1030-3531-103-PS07.stp` (322 KB, AVEVA HarmonyWare v2.1.6 AP203, mm cinsinden, gemi global koordinat).

**Bulgu:** Silindir/torus yok, sadece **B-spline yüzeyleri**. Parse için ekstra geometric fitting katmanı gerekir. Önceki "2-3 oturum" tahmini fazla iyimser, **3-5 oturum** daha gerçekçi.

**Bonus:** Spool koordinatları gemi global olduğundan **otomatik montaj noktası etiketleme** elde edilir — `spool_dokumanlari.montaj_koordinati JSONB`.

Detaylı parser 103+'e. Schema bugünden hazır: `geometri_parse_durumu` + `montaj_koordinati` kolonları.

### KARAR-97.12 — Soft delete 30 gün

Yanlış silmeye karşı çöp sepeti pattern'i: `silindi BOOLEAN` + `silinme_tarihi TIMESTAMPTZ`. Hem `devre_dokumanlari` hem `spool_dokumanlari`'nda var. **30 gün sonra** otomatik kalıcı silinir (cron işi henüz yok, 100+ oturuma).

### KARAR-97.13 — RLS canlı pattern

`docs/DATABASE.md` "4 ayrı policy" disiplini tariflemiş ama canlı sistemde tek `ALL` policy + `get_tenant_id()` kullanılıyor (22'de yazılan markalama RLS migration ile uyumlu). 97 bu canlı pattern'i izledi. İleride DATABASE.md güncellenebilir veya 4-policy'e genişletilebilir.

---

## 3. 8 yeni tablo

Detaylı schema `migrations/080_devre_wizard_v2_schema.sql`'da. Burada özet:

| Tablo | Ne tutar | Tenant_id NULL? |
|---|---|---|
| `dokuman_tipleri` | Uzantı → parser yolu eşlemesi | Evet (sistem default) |
| `klasor_isim_sozluk` | "izometri/" → tip eşlemesi | Evet (sistem default) |
| `devre_dokumanlari` | Devre seviyesi ham dosya kayıtları | Hayır (tenant özel) |
| `spool_dokumanlari` | Spool dosya referansı (sayfa aralık) | Hayır (tenant özel) |
| `dosya_isleme_kuyrugu` | Async parse kuyruğu | Hayır (tenant özel) |
| `alan_oncelik_kurallari` | Füzyon motoru kuralları | Evet (sistem default) |
| `excel_format_tanimlari` | Excel kolon öğrenme | Evet (sistem default) |
| `fuzyon_karar_log` | Çelişki seçim logu | Hayır (tenant özel) |

Sistem default veri: 14 doküman tipi + 33 klasör adı + 15 füzyon kuralı.

---

## 4. Yol haritası — 98+

| Oturum | İçerik | Görünür çıktı |
|---|---|---|
| **98** | Migration çalıştır + smoke test + uygulama tarafı sıfır iş | DB hazır, test sorguları yeşil |
| **99** | `devre_wizard.html` iskelet + drag-drop + dosya tipi auto-detect | Sayfa açılır, dosya yükleyebilirsin (parse yok) |
| **100** | Excel generic parser (L1 sözlük + L2 pattern, L3 Haiku ileride) | Excel yükle, kolon haritası önizleme |
| **101** | İzometri batch entegrasyonu + Faz 1/Faz 2 kuyruğu | PDF yükle, sayfa sayfa parse'ı izle |
| **102** | Füzyon motoru + çelişki ekranı + manuel onay | Birden fazla kaynak yüklediğinde dağıtım/füzyon görünür |
| **103** | STP tek-spool parser (B-spline → silindir fitting) | STP yükle, geometri çıkar, 3D model |
| **104** | Rhino parser + Windows Gezgini UI + spool detay "Belgeler" sekmesi | Vizyon tam tamamlanır |

Her oturum **tek başına bir şey çalıştırır**. Birikmeli değil — 98'de durup 6 ay sonra dönsen schema hazır, bekler. 100'de durup 99'da bıraksan wizard çalışır, parser yok.

---

## 5. Geri alma planı (4 seviye)

Wizard hayal kırıklığı çıkarırsa:

**Seviye 1 — Feature flag kapat.** `UPDATE tenant_features SET aktif=false WHERE feature_kod='devre_wizard_v2'`. Wizard görünmez. 2 saniye. Eski `devre_yeni.html` her zaman çalışıyor.

**Seviye 2 — Wizard linkini sidebar'dan kaldır.** Sayfa kalır, link gider. 5 dakika.

**Seviye 3 — DROP migration.** `migrations/080_devre_wizard_v2_schema.sql` dosyasının DOWN bloğunu çalıştır. 8 tablo + 1 kolon silinir. Mevcut tablolarda veri kaybı yok. 1 dakika.

**Seviye 4 — git revert.** Her commit ayrı revert edilebilir. Schema, wizard UI, parser, füzyon — her biri ayrı commit. 30 dakika.

Plan bütüncül bir taahhüt değil — her noktada durulabilir.

---

## 6. Açık konular (gelecek oturumlarda netleşecek)

- **Çoklu PDF revizyonu mantığı** — `devre_dokumanlari.versiyon` ve `aktif` kolonları schema'da var, mantık 99+'a
- **`docs/DATABASE.md` RLS doküman uyumsuzluğu** — 4 policy disiplinine geçiş yapılır mı, ne zaman
- **AVEVA AP214 çıkışı isteği** — Cihat'ın tersaneden AP214 + tessellated cylinder formatı isteyip istemeyeceği. İstenirse STP parser 5 dakikalık iş olur, istenmezse 103+'ta B-spline fitting yazılır
- **3D model multi-spool görünümü** — Bir devrede 20 spool var, gemi içinde nereye monte edilecekler? Montaj koordinatları geldikçe devre detay sayfasına gemi-içi 3D harita eklemek mantıklı (KARAR-97.11 bonus). Tetik: pilot 5+ STP yükledikten sonra

---

## 7. Felsefe — bunu niye yapıyoruz

Cihat'ın 97'de yazdığı:

> *"Hedef burada doğal yollardan en az efor harcayarak toplanan verileri kendi işimize uygun kanalize ederek max verim alabilmek."*

Bu wizard tam buna hizmet ediyor: kullanıcı klasörü sürükle-bırak yapar (her zaman zaten yapacağı şey), sistem geri kalanı çıkarır. Manuel onay sadece **gerçekten kritik** alanlarda. Yüksek riskli olmayan her şey otomatik. Format öğrenildiğinde sıfır AI maliyeti.

İlk gemi $5-10, ikinci gemi $0.50, üçüncü gemi sıfır. Vizyon belgesindeki "%80 Vision → %5-10 Vision → neredeyse sıfır" trajektorisi tam burada.

---

> **İlk yazım:** 18 Mayıs 2026 — 97. oturum.
> **Bağlı belgeler:** `docs/VIZYON-VE-MODULER-MIMARI.md` (Vizyon 1 detaylandı), `docs/IZOMETRI-BATCH-NOTLARI.md` (parser mimarisinin temel kardeşi), `migrations/080_devre_wizard_v2_schema.sql` (DB).
