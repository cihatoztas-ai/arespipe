# Claude — 48. Oturum Arşivi

> **Tarih:** 30 Nisan 2026
> **Süre:** ~6 saat aktif çalışma (ritüel + 021 cache patch + Vercel cache invalidation savaşı + 022 RLS migration + stratejik dönüşüm tartışması + kapanış)
> **CI:** YESIL
> **Migration sayısı:** 2 (021 + 022)
> **Yeni dosya:** `migrations/021_ai_api_log_cache.sql`, `migrations/022_rls_eksik_tablolar.sql`, `.gitignore`
> **Değişen dosya:** `api/izometri-oku.js` (1113 → 1205 satır, +92)
> **Kapanış:** Cache mekanizması ve RLS gündemi tamam. 5 mimari karar (MK-48.1→48.5). **Stratejik kazanım:** 49'un yönü "wizard" yerine "format öğrenme döngüsü"ne çevrildi.

---

## Bağlam

47 fingerprint skorlama patch'ini canlıya almıştı, format_id artık doğru kaydediliyordu. 47'nin sürpriz dersi: Vercel paket uyumluluğu container testiyle yetmiyor (pdf-parse v2.4.5 patladı, v1.1.1'e downgrade çözdü).

48 gündemi netti: **(A) Cache mekanizması** + **(B) RLS policy'leri**. İki uygulama oturumu, keşif değil. Ama 48'in gerçek değeri planlananın ötesinde — **stratejik bir dönüşüm** geçirdi.

---

## Yapılanlar

### 1. Açılış Ritüeli (✅)

5/5 cevap yeşil. CI yeşil, son commit `bf62bb8 chore(ci)` (47 kapanış raporu). Cihat: "github yeşil, son durum güncel, gündem uygun, geri bildirim yok". Ritüel temiz, hareket geçildi.

### 2. 4 Karar Onayı (~2 dk) (✅)

48 ana iş hattını başlatmadan önce 4 karar onaylandı:

| # | Konu | Karar |
|---|---|---|
| 1 | Cache geçerlilik kuralı | SHA256 bazlı, içerik değişirse hash değişir → cache miss otomatik |
| 2 | RLS migration yapısı | Tek `022_rls_production_tablolari.sql` (gündem planı, sonradan 3 tabloya küçüldü) |
| 3 | Eski `ai_api_log` (47 öncesi NULL hash) | Dokunma, yeni kayıtlardan başla |
| 4 | Eski PDF eğitim havuzu | 49+'a açık borç |

### 3. 021 Migration — Cache Infrastructure (✅)

**Dosya:** `migrations/021_ai_api_log_cache.sql`

Eklenenler:
- `ai_api_log.pdf_sha256 TEXT` kolonu (`IF NOT EXISTS` korumalı, idempotent)
- `idx_ai_api_log_cache` partial index: `(pdf_sha256, format_id) WHERE basarili = true AND pdf_sha256 IS NOT NULL`
- COMMENT'lar (gelecek bakım için)

Supabase'te çalıştı, doğrulama sorgusu yeşil (kolon var, index var). GitHub'a commit + push, CI yeşil.

### 4. Cache Patch (api/izometri-oku.js) (✅)

**Dosya değişikliği:** 1113 → 1205 satır (+92 net).

5 değişiklik:

1. **`import crypto from 'crypto'`** (Node.js native, yeni paket yok)
2. **`pdfHashHesapla(buffer)` helper** — SHA256 tek geçişle, ~50ms 4MB için marjinal yük
3. **`cacheKontrol({ pdf_sha256, format_id, tenant_id })` helper** — Multi-anahtarlı lookup, hata durumunda sessiz null (ana akış bozulmaz)
4. **Handler'da 2.3.b cache lookup** — `formatTani` sonrası hash + cacheKontrol, 3-yollu parser seçimi: HIT / parser_kural / Vision
5. **Response özetinde `_cache_meta`** — cache_hit, original_log_id, original_sure_ms, cached_at
6. **`visionAIParse` imzasına `pdf_sha256`** — 4 ai_api_log INSERT noktasına eklenmesi (1 başarılı + 3 hata yolu)
7. **Başarılı log'da `cevap_full = parsed`** — Cache'in çalışması için kritik (eski kayıtlarda NULL'du, kod yazmıyordu)

Lokal syntax check yeşil (`node --check`).

### 5. Vercel Build Cache İnvalidation Savaşı (1 saat 30 dk, sürpriz) (⚠️→✅)

**Tetikleyici:** Cache patch deploy edildi, canlıda PDF yükleme test edildi → **500 hatası**: `Cannot load "@napi-rs/canvas" package: "Error: Cannot..."`. 47'de pdf-parse v2.4.5'i v1.1.1'e indirmiştik ama bu **canlıya hiç inmemiş**. Cihat'ın testi 47 sonrası ilk gerçek pdf-parse çağrısıydı, o yüzden problem o ana kadar görünmemişti.

**Kanıtlama süreci:**
1. `package.json` ve `package-lock.json` Mac'te v1.1.1 görünüyordu ✅
2. `pdfjs-dist` ve `@napi-rs/canvas` lock'ta 0 referans ✅
3. Vercel build log'unda **kanıt bulundu:** `Restored build cache from previous deployment (95w3GvXea...)` — 47'nin "fix" deploy'undan önceki cache restore edilmiş, package.json değişikliği yansımamış.

**Çözüm:** Vercel UI → son deploy → "..." menüsü → Redeploy → "Use existing Build Cache" KAPALI checkbox → manual redeploy. Yeni build log'da `Skipping build cache, deployment was triggered without cache.` + `Installing dependencies...` + `added 17 packages in 2s` (v2.4.5 + pdfjs-dist + @napi-rs/canvas yok).

### 6. Patch Transfer Çilesi (~1 saat, beklenmeyen) (⚠️→✅)

48 boyunca **izometri-oku.js dosyası 7-8 kez indirilmeye çalışıldı**, her seferinde ~45KB olarak geldi (gerçek boyut 49KB, 4KB transfer kaybı). Browser cache, Downloads `(1).js, (10).js, (11).js` birikmesi, hep yanlış dosya kopyalandı. Cihat'ın `cp ~/Downloads/izometri-oku.js` komutu **2 gün önceki dosyayı** kopyalıyordu (sade isimli olan 27 Nisan tarihli, browser yeni indirmeyi `(N).js` olarak yapıyordu).

**Çözüm:** Patch (diff) formatı.
- `diff -u eski.js yeni.js > izometri-oku-48.patch` — 8KB, 183 satır
- Patch'in kendisini de transfer edemedik (yapıştırırken satır sonları bozuldu, "corrupt patch at line 186")
- **Nihai çözüm:** Base64 encode patch + heredoc + `base64 -d < /tmp/file.b64 > /tmp/file.patch` + `git apply`. macOS `base64 -d` Linux'tan farklı argüman alıyor (`< stdin` redirect şart).

Sonuç: Patch temiz uygulandı, MD5 kozmetik whitespace farklılığı olsa da git diff istatistiği `+97 -5 = +92 net satır` benimle birebir uyuştu, syntax OK, grep ile 30 cache pattern eşleşmesi doğrulandı.

### 7. Canlı Cache Doğrulama (✅)

**Backend deploy yeşil + cache bypass redeploy:**
- Build log: `Skipping build cache, deployment was triggered without cache. Installing dependencies... added 17 packages in 2s.`
- Lock'ta `pdf-parse@1.1.1` net, `pdfjs-dist` ve `@napi-rs/canvas` referansı 0.

**Frontend cache karışıklığı:** Cihat ilk testlerde "Tekrar Çalıştır" basıyordu, network'te POST görünmüyordu. Frontend kodu incelendi: `if (d.durum === 'tamam') continue;` satırı bulundu — yani başarılı parse edilmiş dosya tekrar parse edilmiyor. Çözüm: `localStorage.clear() + reload + "Başla" butonu`. Bu DB'den de doğrulandı: son 6 saatte `ai_api_log`'a 6 başarılı PAOR parse kaydı düşmüş, hepsi `pdf_sha256` ve `cevap_full` dolu — testler **gerçekten yapılmıştı**, frontend "ölü taklidi" değil.

**Cache HIT kanıtı:** Aynı PDF ikinci kez yüklendi (Cihat: "3-saniye falan sürdü"). Ardından SQL: son 5 dk'da 0 yeni `ai_api_log` kaydı. **Cache mekanizması çalıştı** — 23 sn'lik Vision AI çağrısı atlandı, eski kayıttan cevap döndü, yeni log yazılmadı (tasarım kararı).

### 8. 022 Migration — RLS Policy'leri (✅)

**Plan değişikliği:** Gündem "5 tablo + 16 policy" yazmıştı ama denetim yapılınca:
- 12 production tablosu zaten RLS aktifti (tablo isimlerinin çoğul olmasını gündem yazılırken yanlış varsaymıştık: `devre` değil `devreler`, `spool` değil `spooller`)
- Sadece 3 tablo eksikti: `markalama_listeleri`, `markalama_listesi_kalemleri`, `test_spooller`

Gündem fazla iddialıymış, gerçek ihtiyaç **3 tablo + 8 policy** çıktı.

**Dosya:** `migrations/022_rls_eksik_tablolar.sql` (143 satır)

Policy'ler:
- `markalama_listeleri`: 2 (select tenant+admin, write tenant)
- `markalama_listesi_kalemleri`: 4 (select, insert WITH CHECK parent FK, update WITH CHECK parent FK, delete) — **özel tasarım:** kalem'in tenant'ı parent listenin tenant'ıyla uyuşmalı
- `test_spooller`: 2 (defansif, 0 satır var ama gelecek-hazır)

Supabase'te çalıştı, doğrulama yeşil (8 policy + 3 RLS aktif). GitHub'a Cihat web UI'dan upload etti (terminal indirme sorunu nedeniyle dosya transfer formatına alternatif), CI yeşil.

### 9. Stratejik Dönüşüm — 49 Yönü (en değerli kısım) (🔥)

48'in gündemi sadece teknik uygulamaydı, ama **Cihat birkaç kritik soru sordu** ve mimari yön kökten değişti:

**Soru 1 — "Wizard yapsak mı?"** Devre yükleme sihirbazı tarif etti: devre bilgisi → izometri PDF'ler → arşiv dosyaları → kaydet kapat → arka planda parse. İlk önerim hibrit (Excel hızlı yol + PDF wizard yol) + 50+'da implementasyon.

**Soru 2 — "1000 spool senaryosu?"** Cihat: "bir seferde minimum 100 spool yüklenecek, bazen 1000". Bu ölçek mevcut frontend-sırayla modeli kıracak (5 saat tarayıcı açık beklemek imkansız). Async kuyruk + Vercel Cron + worker mimarisi gerektiriyor görünüyordu.

**Soru 3 — "Aynı format 50 PDF için gerçekten her birine AI lazım mı?"** Bu **tam isabetli soru**. Mimariyi netleştirdi: Vision AI 50× $0.02 = $1, oysa 1 kere format öğrenildikten sonra deterministik parse 100ms × 50 = 5 sn, $0. **60× ekonomi farkı.**

**Soru 4 — "NB1124+NB1125 paralel yapım, NB1124→NB1130 yıl sonra kopya?"** Tersane sektöründe sık görülen senaryolar. İkisinde de aynı 1000 PDF tekrar yüklenir → cache HIT %100. Cache patch'in stratejik gerekçesi netleşti (sadece test gimnastiği değil).

**Sentez:**

```
Yıl 1 ekonomi (öğrenme YOK senaryosu):
  100 spool/gün × 30 gün × $0.02 = $60/ay/tenant
  Sürdürülemez.

Yıl 1+ ekonomi (öğrenme aktif):
  Yeni format: AI ($0.02 × ~10 format/yıl = $0.20)
  Bilinen format: L2 deterministik ($0)
  Toplam: ~$1/ay/tenant
  60× kazanım.
```

**49'un Yönü Değişti:**
- ❌ Önceki plan: Wizard tasarımı + kuyruk altyapısı
- ✅ Yeni plan: **Format öğrenme döngüsü** (parser_kural üretimi, L2 deterministik parser)
- Wizard 50+'a ertelendi
- Kuyruk altyapısı **gerek olmayabilir** (L2 başarılı olursa 1000 spool 5 dk'da biter, frontend sırayla yeter)

### 10. Son Saat — 3 Stratejik Soru Daha (🔥🔥)

48'in **son saatinde** Cihat 3 daha kritik soru sordu, projeyi hafıza/strateji düzeyinde netleştirdi:

**Soru 5 — "Spool detay verisi ileride bize ne fayda sağlayacak?"** Bu soru fine tuning vs RAG ayrımını gün ışığına çıkardı. Anlatıldı: AresPipe Anthropic modelini eğitmiyor, modelin etrafına 3 katmanlı hafıza inşa ediyor:
- Tip 1: Format öğrenme (49'un konusu) — `parser_kural` JSONB
- Tip 2: Veri birikimli akıl yürütme (50+) — geçmiş özet AI prompt'una context olarak verilir
- Tip 3: Pasif öğrenme (Vizyon 8) — kullanıcı düzeltmelerinin biriktirilmesi

Anthropic AI sabit, AresPipe sistemi öğrenir. Anthropic model güncellediğinde otomatik faydalanırız (fine tune'da o avantaj sıfırlanır). Strateji tabiri: **Context Engineering + Retrieval Augmented Generation (RAG)**.

**Soru 6 — "Birkaç yıl sonra başka programa veri taşınabilir mi?"** Veri portability sorusu. Profesyonel cevap: **Knowledge Pack mimarisi**:
- PostgreSQL `pg_dump` ile tek dosya export'u zaten mümkün
- Eksiklik: PDF'ler şu an saklanmıyor (Vercel function memory geçici), parse JSON'u var ama **orijinal kanıt yok**
- Sistematik çözüm: Aylık otomatik snapshot zip — format kütüphanesi + spool detayları + tersane istatistikleri + PDF'ler + veri sözlüğü

**Soru 7 — "AI öğrenmesi mevcut veriden bağımsız mı çalışır?"** İki farklı varlık ayrımı yapıldı:
- **Format kuralı (parser_kural)**: Tersan A'nın 1000 PDF'inden öğrenildi ama artık VERİDEN BAĞIMSIZ çalışır. Tersan B yeni PAOR yüklerse kural ona da hizmet eder.
- **Akıl yürütme kontekst (geçmiş özet)**: Canlı veriden türetilir. Tersan A çıkarsa onun istatistikleri gider. Ama format kuralı kalır.

İki farklı taşıma stratejisi gerektirir:
- **Tenant Data Pack**: Müşterinin kendi malı (devreleri, PDF'leri, istatistikleri). Çıkışta teslim edilir + sistemden silinir.
- **System Knowledge Archive**: AresPipe'ın iç envanteri (anonim format kuralları, genel mühendislik desenleri). Müşteri çıkışında sistemde kalır.

**Sentez — KARAR-48.1 (Veri Sahipliği Politikası B):**

```
Müşteri verisi: Müşterinin malı → Çıkışta teslim + silme
Anonim öğrenilmiş kurallar: AresPipe'ın malı → Sistemde kalır
Bu kural sözleşmede yazılır.
Kabul etmeyene program verilmez.
```

Cihat'ın tepkisi: "B olur bu durumda zaten bu kuralı kabul etmeyene program vermek zorunda değiliz" — net duruş. Bu MK-48.6 olarak son-durum.md'ye yazıldı.

### 11. Kapanış Dosyaları (✅)

- `son-durum.md` — 48 sonu mevcut durum, 6 mimari karar (MK-48.1→48.6), açık borçlar (KIRMIZI listesi 7 yeni eksik dosya/altyapı ile genişledi)
- `CLAUDE-SON-OTURUM.md` — bu dosya
- `CLAUDE-SONRAKI-OTURUM.md` — 49 gündemi (format öğrenme döngüsü)

---

## Mimari Kararlar

| # | Karar | Etki |
|---|---|---|
| **MK-48.1** | Vercel build cache invalidation paket değişiminde tutarsız. Manual "cache'siz redeploy" zorunlu. | Kalıcı süreç kuralı, 47'nin gizli arızası 48'de keşfedildi |
| **MK-48.2** | Cache mekanizması: `pdf_sha256 + format_id + tenant_id + basarili + cevap_full`. Tenant izolasyonu. Devre/batch ilişkisi yok (NB1124→NB1125 için doğru) | Cache çalışma prensibi, 49+ format öğrenme ile birlikte yaşar |
| **MK-48.3** | RLS bekçisi 15 prod tablosu (12 + 3 eklenen). `markalama_listesi_kalemleri` özel parent FK kuralı. Backend service_role ile bypass | Multi-tenant güvenlik tabanı |
| **MK-48.4** | Cache HIT log YAZMAZ. Frontend `_cache_meta` ile bilir. Analytics gerekirse function logs'tan veya yeni kolon (49+) | Tasarım kararı, gereksiz log şişmesi engellendi |
| **MK-48.5** | Format öğrenme döngüsü (49) > Wizard (50+). 60× ekonomi. Kuyruk gerek olmayabilir. | Stratejik yön değişikliği, Vizyon Madde 4 çekirdeği |
| **MK-48.6** | **Veri Sahipliği Politikası (KARAR-48.1)**: Müşteri verisi müşterinin malı (çıkışta Tenant Data Pack ile teslim + silme). Anonim öğrenilmiş kurallar AresPipe'ın malı (sistemde kalır). Sözleşmede yazılır, kabul etmeyene program yok. | İş modeli temel taşı, 50+ sözleşme/teknik altyapı buradan kurulur |

---

## Süreç Dersleri

**1. Vercel build cache invalidation tutarsız.** Lock değişse bile eski cache restore edilebilir. Çözüm: Manuel redeploy + "cache'siz" + build log doğrulama.

**2. Anthropic transfer 30KB+ dosyalarda truncate riski.** Patch (diff) formatı tercih, base64 encode son çare. macOS `base64 -d < file` (stdin redirect) Linux'tan farklı.

**3. Downloads klasörü versiyonlama riski büyük.** Browser `(N).js` birikmesi, sade isimli dosya kopyalandığında 2-3 gün önceki dosya kullanılıyor. Çözüm: tarihli isim veya patch.

**4. Frontend "ölü taklidi" = state hatası, kod bozukluğu değil.** DB sorgusu kanıttır. `ai_api_log`'a baktık, testler gerçekten yapılmıştı, frontend butonu basılması gereken `Başla`'ydı (`Tekrar Çalıştır` değil — `if durum=='tamam' continue` mantığı).

**5. Gündem ile gerçeklik arasında denetim şart.** "5 tablo + 16 policy" planı denetimde "3 tablo + 8 policy"e küçüldü. Gündem yazımında **information_schema sorgusu yapılmadan tablo varsayımı yanlış**.

**6. Stratejik sorular planı değiştirir.** Cihat'ın "1000 spool", "aynı format her birine AI mı?", "NB1124+NB1125" soruları 49'un yönünü kökten değiştirdi. Wizard sandığımız büyük iş, format öğrenmenin yan ürünü olabilir.

**7. zsh `interactive_comments` off — `#` yorumları komut sayar.** Cross-shell komut yapıştırırken yorum kullanma.

---

## Süre Dağılımı (~6 saat)

- Açılış ritüeli + 4 karar: ~10 dk
- 021 migration + cache patch yazımı: ~45 dk
- Vercel cache invalidation savaşı: ~1 saat
- Patch transfer çilesi (7-8 deneme): ~1 saat
- Cache patch canlı doğrulama (3 sn HIT): ~30 dk
- 022 RLS denetim + migration: ~30 dk
- Stratejik dönüşüm tartışması: ~1 saat
- Kapanış dosyaları: ~30 dk

---

## 49'a Geçerken Net Aklımdaki Plan

49 gündemi: **Format öğrenme döngüsü.**

İlk hedef format: **PAOR Ana Çizim** (`paor_aveva_ana`). Şu an 8 başarılı kullanım var, kütüphanede en zengin sample.

49 başında çalışılacak SQL hazır:
```sql
SELECT * FROM izometri_format_tanimlari
WHERE format_kodu = 'paor_aveva_ana';
-- ad: PAOR Ana Çizim
-- fingerprint: { ulke: PT, tersane: STM, baslik_regex: "PORTUGUESE NAVY AOR", ...}
-- prompt_template: NULL ← buraya AI'nin kullandığı prompt
-- parser_kural: {} ← buraya AI taslağı doldurulacak
-- egitim_kaynagi: 'vision_only' ← 49 sonrası 'AI_taslak_onayli' olur
```

49'da AI'a şu ekstra prompt eklenecek (Vision AI parse sonrası):
> "Bu PDF'i parse ettin ve JSON döndürdün. Şimdi başka aynı formatta PDF'ler için bir extraction kuralı yaz: hangi alan PDF'in neresinde (regex, koordinat, satır işareti). JSON formatında döndür."

Çıktı `parser_kural` JSONB'sine yazılır, admin paneli "Format Öğretme" sayfasında kullanıcı onayına sunulur.

L2 parser engine: `parser_kural` varsa AI atla, regex/extract uygula. Şüpheliyse L3 (Vision AI) fallback.

**Beklenen 49 kazanımı:** İlk PAOR PDF → AI öğrendi → kalan 999 PAOR PDF → L2 deterministik. Cihat'ın "1000 spool" senaryosu 5 dakikada biter.
