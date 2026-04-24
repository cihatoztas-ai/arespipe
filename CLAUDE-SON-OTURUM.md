# CLAUDE — 28. Oturum Raporu

**Tarih:** 24 Nisan 2026  
**Süre:** ~3 saat  
**Tema:** 27'den devredilen kuyruğu temizle + migrations kontrolünü ana sisteme entegre et  
**CI Durumu (Kapanış):** YEŞİL ✅ (10s, tek workflow)  
**Self-test (Kapanış):** 4/4 başarılı ✅

---

## Bu Oturumun Hikayesi

27. oturum yedeklemeyi kurmuş, migrations baseline'ını koymuştu — büyük işti. Ama bir kuyruk bırakmıştı: 4 küçük-orta iş "28'de yapılacak" diye not düşülmüştü. 28 bu kuyruğun temizlendiği oturum oldu. Ayrıca bir bonus çıktı: Cihat'ın müşteri öncesi altyapıyı tamamen bitirme kararı verdiğimiz oturum oldu.

İlk teknik engelle ritüel sırasında karşılaştık: Self-test Mac'te koşunca CommonJS/ESM çakışması yüzünden patladı. HOME klasöründeki `package.json` ESM dayatıyordu, `kontrol.js` ise `require` kullanıyordu. `.github/package.json` ile lokal scope override'la 2 dakikada çözdük. Basit bir tuzaktı ama sistemli çözüm gerektirdi.

Sonra 27'nin kuyruğunu işe koyulduk. **Birinci iş** bir PAT token'ın iptaliydi — 2 dakikalık "temizlik" işi. **İkinci iş** Vercel env variables'daydı: hem hangi formatın kullanıldığını denetlemek (eski vs yeni Supabase key) hem plaintext secret sorununu çözmekti. İki sürpriz çıktı:

1. Legacy/yeni format ikiliği yok — tek key var, yeni formatta zaten. 27'nin endişesi fantomdu.
2. Ama başka bir sorun vardı: Hem `SUPABASE_SERVICE_KEY` hem `ANTHROPIC_API_KEY` plaintext saklanıyordu ("Needs Attention" uyarısıyla). İkisini de Sensitive'e çevirdik — 3 adımlı process (Copy → Delete → Add+Sensitive), her biri için ~1-3 dk downtime.

Bu sırada üçüncü bir sürpriz: Vercel deploy logunda `api/izometri-oku.js` compile edildiğini gördük. Yani ANTHROPIC_API_KEY ölü variable değildi — Spool AI vizyonunun 1. katmanı (izometri okuma) canlıda aktif çalışıyordu. Belgede kaydedilmiş ama Claude'un konuşmaya girişinde farkında olmadığı bir şey ortaya çıktı.

**Üçüncü iş** aslında iş değildi: 27, "migrations/README.md markdown render'ı bozuk" raporu düşmüştü. Gidip baktık — dosya düzgündü. Fantom bir borç. Bu bize önemli bir ders verdi: devralınan borcu doğrulamadan planlama yapmak riskli.

**Dördüncü iş** oturumun asıl teknik dibiydi: 27'nin eklediği `migrations-check.yml` workflow'u ayrı bir silo olarak duruyordu. Onu ana `kontrol.js` sistemine entegre edecektik. Mimari karar kritikti — migrations kontrolü doğası gereği klasör-bazlı (duplicate numara için tüm dosyaları bir arada görmek gerek), mevcut sistem dosya-bazlı. İki yaklaşım tarttık:

- **A1 (üst-seviye klasör):** Ayrı fonksiyon, iterate sonrasında inject
- **A2 (dosya-bazlı):** Her dosyada iterate + duplicate cache

A1'i seçtik — temiz, risk düşük. Kodu yazdıktan sonra sandbox'ta 4 bozuk dosyalık test ortamı kurup self-test'i koşturduk. 4/4 başarılı. Regression testi için gerçek `migrations/` altına bozuk bir SQL attık — yakalandı, deploy engellendi. Gönderime hazır.

Cihat dosyaları GitHub'a yükledi. Bir an panik yaşadı — "sıralı yap" talimatını okumadan hepsini birden yüklemişti. Aslında bu daha iyiydi: tek commit'te atomik geçiş, CI hiç kırılmadı. İşte ders: atomik commit aşamalı commit'ten her zaman güvenli.

Sonra eski `migrations-check.yml` silindi. Artık tek motor var — `kontrol.yml` + `kontrol.js`. 15 aktif kural, 4/4 self-test.

**Bonus bölüm:** Oturumun sonunda Cihat "başka altyapı işim var mı yapmam gereken" diye sordu — sonrası yazılımcıya devir senaryosu, belgelerin dinamik mi statik mi olacağı, hibrit yapı kararı. Plan netleşti: 29-34. oturumlar boyunca **altyapı kapanış günleri**, 35'ten itibaren ürün dönemine geçiş. Bu karar oturumun en büyük çıktısı olabilir.

---

## Kronolojik Akış

| Zaman | İş | Not |
|---|---|---|
| 0:00 | Oturum başlangıç ritüeli | Windows'tan Mac'e geçiş, git pull |
| 0:15 | Self-test lokal patladı | `ReferenceError: require is not defined` |
| 0:20 | `.github/package.json` fix | CommonJS override, 2 dk |
| 0:25 | Self-test 3/3 başarılı | Sistem sağlıklı, teknik iş başlayabilir |
| 0:30 | PAT token silindi | İş 1 ✅ |
| 0:35 | Vercel env teşhisi | 3 variable, 2'si "Needs Attention" |
| 0:45 | SUPABASE_SERVICE_KEY Sensitive | Copy → Delete → Add |
| 1:00 | Deploy ve teyit | Yeşil, 7s |
| 1:05 | ANTHROPIC_API_KEY sensitive | Aynı 3 adım |
| 1:20 | Deploy log → izometri-oku.js keşfi | Anthropic key kullanım yeri |
| 1:30 | Migrations README teyit | Fantom borç, dosya zaten düzgün |
| 1:40 | Migrations entegrasyonu planı | A1 onaylandı |
| 1:45 | 4 dosya okundu (kurallar, kontrol, beklenen, workflow) | Sistem taslağı netleşti |
| 2:00 | kontrol.js + kurallar.json + 4 SQL + beklenen-hatalar yazıldı | Sandbox'ta test edildi, 4/4 |
| 2:15 | Cihat GitHub'a yükledi | Tek commit, atomik |
| 2:20 | CI yeşil, migrations-check.yml silindi | İş 4 ✅ |
| 2:30 | "Altyapı işim var mı?" sohbeti | 35. oturuma kadar plan oturdu |
| 3:00 | Kapanış dosyaları yazıldı | Bu dosya dahil |

---

## Teknik Detaylar

### 1. `.github/package.json` (yeni, CommonJS override)

```json
{"type":"commonjs"}
```

**Niye gerek:** Cihat'ın HOME'daki `/Users/cihatoztas/package.json` dosyasında `"type":"module"` var, Node `.github/kontrol.js`'i ESM sanıyor. Bu yeni dosya lokal scope override yapıyor — `.github/` altındaki tüm `.js` dosyaları CommonJS. HOME'daki dosyaya dokunulmadı (başka işler için orada olabilir).

### 2. Vercel Env Variables (Sensitive Geçiş)

| Variable | Format | Eski | Yeni |
|---|---|---|---|
| `SUPABASE_URL` | URL | plaintext | plaintext (URL zaten public) |
| `SUPABASE_SERVICE_KEY` | `sb_secret_*` | plaintext ⚠️ | **Sensitive** 🔒 |
| `ANTHROPIC_API_KEY` | `sk-ant-*` | plaintext ⚠️ | **Sensitive** 🔒 |

**Downtime:** Her variable için ~1-3 dk (delete + add arası). Müşteri yok, etkisiz.

**Dev ortam:** Sensitive variable'lar Development ortamında kilitli. `vercel dev` CLI kullanılmadığı için sorun değil. Production + Preview aktif.

### 3. `kurallar.json` — Yeni `migrations` Bölümü

```json
"migrations": {
  "aktif": true,
  "klasor": "migrations",
  "kurallar": [
    { "kod": "MIG_ISIM_BOZUK", "siddet": "hata", "desen_regex": "^[0-9]{3}_[a-z0-9_]+\\.sql$", ... },
    { "kod": "MIG_NUMARA_TEKRAR", "siddet": "hata", ... },
    { "kod": "MIG_HEADER_EKSIK", "siddet": "uyari", ... }
  ]
}
```

Toplam kural sayısı: 14 → 15.

### 4. `kontrol.js` — Yeni Fonksiyon

- `migrationsKontrol(kokDizin)` — klasör-bazlı, 3 kuralı topluca tarar
- Dönen yapı: `[{ dosya, kod, tip, satir, mesaj }]`
- `normalTarama()`: iterate sonrasında çağrılır, `dosyaRaporlari`'na inject edilir
- `selfTest()`: `/` ile biten anahtar klasör-bazlı test olarak yorumlanır, `KURAL.migrations.klasor` geçici override
- Backward compat: Tüm önceki davranışlar korundu, eski 3 self-test dosyası hâlâ çalışır

### 5. Test Dosyaları (`bozuk-ornekler/migrations-bozuk/`)

| Dosya | Ne tetikler |
|---|---|
| `abc_yanlis_isim.sql` | MIG_ISIM_BOZUK (rakam yok) |
| `001_ilk_dosya.sql` | Numara 001 kaydeder (tek başına OK) |
| `001_ikinci_dosya.sql` | MIG_NUMARA_TEKRAR (001 çift) |
| `002_headersiz.sql` | MIG_HEADER_EKSIK (header yok) |

Yakalanan kodlar: MIG_ISIM_BOZUK + MIG_NUMARA_TEKRAR + MIG_HEADER_EKSIK = 3'ü de ✅

### 6. Silinen: `.github/workflows/migrations-check.yml`

27'de eklenen ayrı workflow. Artık `kontrol.yml` içinde `kontrol.js` aynı işi yapıyor. Paralel sistem bakım borcu demekti — kaldırıldı.

---

## 28. Oturumda Öğrenilen 6 Ders

### 1. Devralınan borcu doğrulamadan planlama yapma
27'nin son-durum.md'si "README markdown bozuk" diyordu. Gidip bakmadan "bugün düzeltelim" diye listeye aldım. Gerçekten bakınca dosya düzgündü. Fantom bir borç. **Kuralı güncel:** Bir borcu planladan önce "hâlâ gerçekten borç mu?" teyidi yapılmalı.

### 2. Vercel "Needs Attention" = plaintext secret uyarısı
Plaintext env variable'lar Vercel dashboard'da görünür — ekibin her üyesi, "View History" yapan herkes okur. Sensitive flag ile variable dashboard'da bile gizli, sadece build/runtime'da kullanılır. Secret key'ler için Sensitive ŞART. Geçiş yolu: Copy → Delete → Add with toggle.

### 3. Deploy logları değerli
"Bu env variable nerede kullanılıyor?" sorusunun cevabı kod tabanında aramakla kolay bulunmuyor. Vercel build log'u her deploy'da `api/*.js` dosyalarını compile ederken isimlerini yazıyor — hangi endpoint'in var olduğunu, hangi kütüphaneyi kullandığını görüyorsun. `ANTHROPIC_API_KEY`'in `api/izometri-oku.js`'de kullanıldığını bu şekilde bulduk.

### 4. A1 yaklaşımı — mimariyi veriye uydur
Migrations kontrolü doğası gereği klasör-bazlı (duplicate numara tüm dosyaları ister). Mevcut sistem dosya-bazlı iterate yapıyor. İki seçenek vardı: A1 (ayrı üst-seviye fonksiyon) veya A2 (dosya-bazlı iterate içine cache + flag). A2 zorlamaydı, kodu karmaşıklaştırırdı. A1 temiz — ayrı fonksiyon, iterate sonrasında inject. **Ders:** Mimari veriye uyum sağlar, veriyi mimariye zorlama.

### 5. Atomik commit aşamalıdan güvenli
"Önce test dosyalarını yükle, sonra kuralları" şeklinde aşamalı plan vermiştim. Cihat okumadan hepsini tek seferde yükledi. Sonuç: CI hiç kırılmadı, tek commit'te tüm parçalar bir arada gitti. **Ders:** İlişkili değişiklikleri atomik olarak tek commit'te yollamak her zaman daha güvenli. "Şunu yükle, diğerini sonra" demek geçici bozulma riski yaratır.

### 6. Karmaşık refactor öncesi sandbox testi
Bu sefer yanılmadık çünkü `/home/claude/28oturum/test-env/` altında minimal bir repo kurdum, self-test'i orada koşturdum, 4/4 gördükten sonra paylaştım. CI'a gidince ilk push'ta yeşil. Bu disiplin özellikle migration tarzı yapısal kod değişikliklerinde kritik. **Ders:** "Bu çalışmalı" değil, "çalıştığını gördüm" ile gönder.

---

## Önemli Kararlar (Oturum İçinde Alındı)

### Karar 1 — Altyapı Kapanış Planı (35. oturuma kadar)
Cihat "altyapı işi kalmasın ki programa devam ederken geri dönmeyelim" dedi. 29-34 altyapı, 35+ ürün.

| # | Oturum | İş |
|---|---|---|
| 29 | Devredilebilirlik Günü | Hibrit dokümanlar + auto-update |
| 30 | Güvenlik | Bucket PRIVATE |
| 31 | Observability | Sentry |
| 32 | İletişim | Email (Resend/SendGrid) |
| 33 | Staging | 2. Supabase + migration runner |
| 34 | Güvenlik 2 | Tenant izolasyon testi + feature flag |

### Karar 2 — Dokümanlar Hibrit (A2)
- Manuel bölümler: anlatım, tasarım kararları, "niye böyle"
- Otomatik bölümler (`AUTO-START`/`AUTO-END` arası): sayaçlar, listeler, istatistikler
- `.github/docs-uret.js` her push'ta AUTO kısımları günceller
- Hibrit yapı 29'da kurulacak

### Karar 3 — `migrations-check.yml` Silindi
Paralel sistem bakım borcu demekti. Artık tek motor: `kontrol.yml` + `kontrol.js`.

---

## Sayısal Özet

- **Yapılan iş:** 4/4 (+1 bonus plan)
- **Yeni kural:** 3 (toplam 14 → 15)
- **Yeni test dosyası:** 4 (migrations-bozuk/)
- **Self-test durumu:** 3/3 → 4/4
- **Silinen dosya:** 1 (`migrations-check.yml`)
- **Güvenlik iyileştirmesi:** 2 env variable Sensitive'e geçti
- **Keşif:** `api/izometri-oku.js` Spool AI 1. katman — canlıda
- **Fantom borç kapatıldı:** 1 (Migrations README)
- **CI build süresi:** 10s (önceki gibi, etkilenmedi)

---

**Sonraki oturum:** 29 — Devredilebilirlik Günü. Detay: `CLAUDE-SONRAKI-OTURUM.md`
