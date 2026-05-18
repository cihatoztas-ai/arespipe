# 97. Oturum — Devre Wizard v2 Mimarisi (KAPATILDI ✅)

> **Tarih:** 18 Mayıs 2026
> **Ana tema:** Çoklu doküman wizard mimari planı, schema migration'ı, 13 KARAR
> **Çıktı:** `migrations/080_devre_wizard_v2_schema.sql` (yazıldı, 98'de çalıştırılacak), `docs/DEVRE-WIZARD-V2-MIMARISI.md` (yeni mimari belgesi)
> **Kod yazıldı mı?** Hayır. 97 sadece **konuştu + yazdı**, hiçbir SQL çalıştırılmadı, hiçbir HTML değişmedi.

---

## Konuşmanın akışı

97 alışılmadık bir oturum oldu — kod yazımı yerine **uzun bir mimari sohbeti**. Cihat 7. mesajda **devre yükleme wizard'ı vizyonunu** baştan sona yazdı: kullanıcılar, tersaneler, gemi projeleri, aktif devreler, devre detay, spool detay, kesim, markalama, büküm, test, etiketleme akışlarının nasıl olduğunu açıkladı. Ana isteği: **devre yükleme wizard'ı** — sürükle-bırak çoklu dosya, otomatik dispatch, Faz 1/Faz 2 ayrımı, çapraz veri tamamlama.

Tartışma 4 ana evreye ayrıldı:

### Evre 1 — "Hayalci mi olduk?"

Cihat dürüst bir soru sordu: "Çokta hayalci olmayalım, yapılabilir mi gerçekten?" Ben de açıkça konuştum:

- **Yapılır:** Drag-drop UI, dosya tipi tanıma, Excel parser generic'leştirme, Faz 1/Faz 2 ayrımı, dosya saklama
- **Şüpheli:** Otomatik füzyon (çapraz veri tamamlama), AI maliyetli alanlar
- **Hayal:** Gemi-geneli STP parse, akış şeması parse, sihirli füzyon

Cihat sonra düzeltti: **"STP dosyaları gemi geneli değil, tek spool"**. Bu **kritik bilgi** — multi-gigabyte gemi STP değil, 100-500 KB tek-spool STP dosyaları. Parse edilebilir hedef.

### Evre 2 — Asıl problemler

Cihat 3 önemli edge case açtı:
1. **Multi-spool tek-sayfa PDF + ortak BOM** — 5 spool için 300 kg ortak malzeme listesi, devre toplamında 1500 kg yazmasın
2. **Çoklu izometri PDF + token limiti** — 20 spoollu birleşik PDF parse edilemez
3. **Sihirli füzyon** — Excel'de WN, izometride SO — hangisi doğru?

Ben de yanıtladım:
1. **`pipeline_malzemeleri` zaten var** — 19'da kurulmuştu, multi-spool ortak BOM tam buraya. Spool detayda read-only görünür, devre toplamı çift saymaz
2. **Sayfa-başına AI çağrısı + kuyruk** — `dosya_isleme_kuyrugu` tablosu
3. **İki boyutlu skor** — parse güveni × kaynak içerik önceliği, yüksek riskli alanlar manuel, düşük riskli otomatik

### Evre 3 — Klasör hiyerarşisi + Windows Gezgini

Cihat: "Devre detay sayfasında Windows Gezgini gibi olsun, klasörler ve dosyalar görelim." Önceki "düz tutulur" yaklaşımım yanlıştı — kullanıcı klasör yapısını anlamak istiyor.

Çözüm: Storage tarafında düz UUID dosyaları, **DB tarafında `klasor_yolu TEXT`** kullanıcının yüklediği hiyerarşiyi string olarak saklar. UI '/' ile parçalar, ağaç render eder. Spool detayda breadcrumb gösterilir.

### Evre 4 — STP analiz + schema yazımı

Cihat örnek STP dosyası yükledi: `1030-3531-103-PS07.stp` (322 KB, AVEVA HarmonyWare). İncelediğimde:

- ✅ ASCII text, mm cinsinden, parse edilebilir
- ⚠️ Silindir/torus YOK, sadece **B-spline yüzeyleri** — parser daha karmaşık (B-spline → silindir fitting)
- ✅ **Gemi global koordinat** — otomatik montaj noktası etiketleme bonus
- 📌 Önceki "2-3 oturum" tahmini → gerçekçi **3-5 oturum**

Sonra schema yazımına geçildi. Cihat 5 DB keşif sorgusu çalıştırdı (`devreler`, `spooller`, `tenants`, `storage.buckets`, `pipeline_malzemeleri`), gerçek schema'lara dayalı migration yazıldı.

---

## 13 KARAR (97.0 – 97.13)

Detaylar için `docs/DEVRE-WIZARD-V2-MIMARISI.md`. Burada özet:

| # | Karar |
|---|---|
| 97.0 | Yeni tablolar mevcut tablolara FK kurmaz, tek istisna opsiyonel izleme FK |
| 97.1 | Tek spool = bir dosya (STP/Rhino parse edilebilir) |
| 97.2 | Füzyon: alan başına öncelik kuralı (JSONB skor tablosu) |
| 97.3 | Yüksek riskli alanlar manuel onay, düşük riskli otomatik |
| 97.4 | Çelişki kararları `fuzyon_karar_log`'a, 5+ aynı = sistem önerisi |
| 97.5 | İki boyutlu skor (parse güveni × kaynak içerik önceliği) |
| 97.6 | Devre detay Windows Gezgini tarzı klasör hiyerarşisi |
| 97.7 | Çok-spoollu PDF tek dosya + N spool satırı + sayfa aralık (kopya yok) |
| 97.8 | Multi-spool ortak BOM `pipeline_malzemeleri`'ne yazılır (devre toplamı çift saymaz) |
| 97.9 | Token limiti aşan PDF sayfa-başına AI çağrısı + kuyruk |
| 97.10 | Storage hiyerarşisi `tenants/projeler/devreler/{klasör}/dosya` |
| 97.11 | STP AVEVA HarmonyWare B-spline parse + montaj koordinatı bonus |
| 97.12 | Soft delete 30 gün, sonra otomatik kalıcı silme |
| 97.13 | RLS canlı pattern (tek ALL policy + `get_tenant_id()`) — DATABASE.md uyumsuzluğu not edildi |

---

## Yazılan dosyalar (3)

| Dosya | Satır | Açıklama |
|---|---|---|
| `migrations/080_devre_wizard_v2_schema.sql` | 527 | 8 tablo + 16 index + 8 RLS policy + 62 seed + ALTER + feature flag + DOWN |
| `docs/DEVRE-WIZARD-V2-MIMARISI.md` | ~300 | 97'nin asıl mimari belgesi, gelecek 6 oturumun yol haritası |
| `CLAUDE-SON-OTURUM.md` | bu dosya | 97 özeti |
| `CLAUDE-SONRAKI-OTURUM.md` | ayrı | 98 gündemi |
| `.github/son-durum.md` | güncelleme | CI son durum + açık borçlar |

---

## DB değişikliği yapıldı mı?

**Hayır — 97 sadece migration dosyasını yazdı, çalıştırmadı.** Bu bilinçli karar:

1. Büyük migration (8 tablo, 16 index, 8 policy, 62 seed) önce CI'da görülmeli — `MIG_HEADER_EKSIK` veya `MIG_ISIM_BOZUK` uyarısı çıkmadığını teyit etmek lazım
2. Cihat'ın aradan mola alıp **uyku ile bir kontrol katmanı daha** eklemesi yararlı
3. 98 oturumunun ilk işi tam olarak bu — gerçek çalıştırma + smoke test

Yani **97 sonu = git push edilebilir dosyalar**, **98 başı = migration çalıştırma**.

---

## Yan keşifler

**STP AVEVA çıkışı format detayı.** AVEVA HarmonyWare boru/dirsek silindirlerini B-spline'a tessellate ediyor — `CYLINDRICAL_SURFACE` / `TOROIDAL_SURFACE` entity'leri yok, sadece `B_SPLINE_SURFACE`. Parse için ekstra matematik (B-spline'dan silindir fit) gerekir. Alternatif: AVEVA'dan AP214 + tessellated cylinder çıkışı isteme — tek ayar değişikliği, 5 dakikalık iş olurdu. Cihat şimdilik ertelemeyi seçti.

**`pipeline_malzemeleri` tablosu zaten kurulu.** 19'da `malzeme_ref_id` FK'sıyla `spool_malzemeleri`'nin kardeşi olarak yapılmış. 97'de hatırlanmadı, bulundu, multi-spool BOM çözümünün tam yeri. Sadece `kaynak_dokuman_id UUID NULL` kolonu eklendi.

**docs/DATABASE.md RLS uyumsuzluğu.** Doküman "4 ayrı policy" disiplinini tarifliyor, canlı sistem tek `ALL` policy ile çalışıyor. 22'deki markalama RLS migration de aynı (canlı) pattern'i kullanmış. Doküman güncellenmemiş veya niyet beyanı. 97 canlı pattern'i izledi, migration başlığında açıkça not edildi.

---

## Felsefe — bu wizard'ı niye yazıyoruz

Cihat'ın 97'deki sözlerinden derlemek:

> *"Hedef burada doğal yollardan en az efor harcayarak toplanan verileri kendi işimize uygun kanalize ederek max verim alabilmek."*

Wizard tam buna hizmet ediyor. Kullanıcı klasörü sürükle-bırak yapar (zaten yapacağı şey), sistem geri kalanı çıkarır. Manuel onay sadece kritik alanlarda. Format öğrenildiğinde sıfır AI maliyeti.

İlk gemi $5-10, ikinci gemi $0.50, üçüncü gemi sıfır. Vizyon belgesindeki "%80 Vision → neredeyse sıfır" trajektorisi tam burada.

---

## 98'e devreden borçlar

1. **Migration'ı çalıştırma** — Supabase SQL Editor'de kuru çalıştırma (`BEGIN...ROLLBACK`) → temizse gerçek (`BEGIN...COMMIT`) → 5 test sorgusu
2. **CI yeşil mi teyit** — `MIG_*` uyarısı çıkmadığı
3. **`devre-belgeler` bucket'ı?** — Şimdilik gerek yok, `arespipe-dosyalar` içinde klasörle organize edilecek. 99'da wizard storage tarafı yazılırken karar verilir
4. **Yan iş (opsiyonel):** AVEVA AP214 çıkış denemesi — tersanenizle konuşup AP214 + tessellated cylinder formatı çıkış ayarı isteyebilir misin? Eğer alabilirsen 103+ STP parser 5 dakikalık iş olur

---

## Felsefe + öğrenme notları

**1. Kod yazımı yapmayan oturumlar değerli.** 97'de hiçbir HTML değişmedi, hiçbir SQL çalıştırılmadı, ama 6 oturumluk yol haritası net oldu. Bu pratikte 30+ saatlik mimari belirsizliği temizliyor. Mockup-first prensibine (R-10) çok benzer ama mimari için.

**2. Cihat'ın yazılı vizyonu kritik.** Cihat 97. mesajda devre yükleme vizyonunu detaylı yazdı (paragraflar süren bir metin). Bu metni tartışmaya başlamadan önce var olmasaydı schema yarım kalırdı. Belge → tartışma → schema sırası doğru.

**3. "Hayalci mi?" sorusu disiplini koruyor.** Cihat sık sık "yapılabilir mi?" diye sordu, ben de bazen geri çekildim ("STP hayal" → "tek spool olunca yapılır"). Açık dürüst tartışma 13 KARAR'ı sağlam çıkardı.

**4. Mevcut altyapı ödünü ödüyor.** `pipeline_malzemeleri` zaten kurulu, `izometri_format_tanimlari` zaten kurulu, `tenant_features` zaten kurulu. 97'nin yeni 8 tablosu **mevcut sistemin doğal uzantısı**, yeniden icat değil. 30+ oturumdur biriken altyapı meyvesini veriyor.

---

> **97. oturum kapanışı:** Migration dosyası hazır, mimari belge yazıldı, yol haritası çıkıldı. 98'de çalıştırma + smoke test, 99'da wizard UI iskeleti.
