# AresPipe — Son Durum (her oturum sonunda güncellenir)

> Bu dosya her oturum açıldığında Claude tarafından **zorunlu olarak okunur.**
> İçeriği hafıza değil kayıt. Unutma imkansız — dosya burada.

---

## Son Oturum: 28 (24 Nisan 2026) — 27'nin Kuyruğunu Temizleme + Migrations Entegrasyonu ✅

### CI Durumu
- **Son build:** YEŞİL ✅ (10s, tek workflow — `kontrol.yml`)
- **Aktif kural sayısı:** 15 (14'ten arttı, migrations 3 yeni kural eklendi)
- **Self-test:** 4/4 başarılı ✅ (28. oturumda zorunluluk yerine getirildi)
- **Silinen workflow:** `migrations-check.yml` (kontrol.js'e entegre edildi, paralel sistem kalmadı)

### Bu Oturumda Yapılanlar (~3 saat)

**Saat 0.5 — Oturum Başlangıç Ritüeli + Local Fix** ✅
- Cihat Mac'ten çalışıyor (Windows'ta git yok). `cd ~/Desktop/arespipe && git pull && git status && git log`
- Self-test yerel koşunca `ReferenceError: require is not defined in ES module scope` hatası
- Kök sebep: Cihat'ın HOME'daki `package.json`'ında `"type":"module"` var, Node `.github/kontrol.js`'i ESM sanıyor
- Çözüm: `.github/package.json` oluşturuldu, içinde `{"type":"commonjs"}` — lokal scope override
- Dosya push edildi, CI yeşil, self-test 3/3 başarılı (o an)

**İş 1 — PAT Token İptal** ✅
- 27'de oluşturulan `arespipe-backups-writer` fine-grained PAT silindi (kullanılmamıştı)
- github.com/settings/personal-access-tokens → Delete

**İş 2 — Vercel Env Variables Sensitive Geçişi** ✅
- Mevcut 3 variable teşhisi: `SUPABASE_SERVICE_KEY`, `SUPABASE_URL`, `ANTHROPIC_API_KEY`
- **Sürpriz bulgu 1:** Legacy vs yeni format ikiliği yok — tek `SUPABASE_SERVICE_KEY` var (yeni `sb_secret_*` formatında). 27'nin "ikiliği tespit et" endişesi fantomdu.
- **Sürpriz bulgu 2:** Hem `SUPABASE_SERVICE_KEY` hem `ANTHROPIC_API_KEY` "Needs Attention" uyarılı — Vercel diyor ki "bu secret görünür, rotate et veya Sensitive yap"
- Uygulanan çözüm: İkisi de 3 adımda Sensitive'e çevrildi (Copy → Delete → Add with Sensitive toggle)
- Development ortamında Sensitive variable kilitli — `vercel dev` CLI kullanılmadığı için sorun değil
- Her geçişte ~1-3 dk kısa downtime, sonra yeni deploy otomatik
- **Sürpriz bulgu 3:** Deploy loglarında `api/izometri-oku.js` compile edildiğini gördük — `ANTHROPIC_API_KEY` bu endpoint'te kullanılıyor, yani **Spool AI vizyonunun 1. katmanı (izometri okuma) canlıda aktif.** Ölü variable değildi.

**İş 3 — Migrations README Markdown** ✅ (fantom borç)
- 27'nin "GitHub render bozuk" raporu kontrol edildi
- Aslında dosya gayet düzgün render oluyordu — raporlama hatası
- Borç listesinden düşürüldü, yeni dosya yüklenmedi

**İş 4 — migrations-check.yml → kontrol.js Entegrasyonu** ✅ (asıl iş, ~1.5 saat)
- Mimari karar: A1 yaklaşımı (üst-seviye klasör kontrolü, dosya-bazlı iterate yerine)
- `kurallar.json`'a yeni `migrations` bölümü (3 kural):
  - `MIG_ISIM_BOZUK` (hata) — regex `^[0-9]{3}_[a-z0-9_]+\.sql$`
  - `MIG_NUMARA_TEKRAR` (hata) — duplicate 3-haneli numara
  - `MIG_HEADER_EKSIK` (uyari) — ilk 10 satırda `--` yok
- `kontrol.js`'e `migrationsKontrol()` fonksiyonu eklendi — `normalTarama()` ve `selfTest()`'e entegre
- `selfTest()` yeni özellik: anahtar `/` ile biterse klasör-bazlı test
- `.github/bozuk-ornekler/migrations-bozuk/` altına 4 SQL test dosyası:
  - `abc_yanlis_isim.sql` → MIG_ISIM_BOZUK tetikler
  - `001_ilk_dosya.sql` + `001_ikinci_dosya.sql` → MIG_NUMARA_TEKRAR
  - `002_headersiz.sql` → MIG_HEADER_EKSIK
- `beklenen-hatalar.json`'a `"migrations-bozuk/": [3 kod]` eklendi
- Eski `.github/workflows/migrations-check.yml` **silindi** — artık tek sistem (kontrol.yml)
- Final self-test: **4/4 başarılı** (g03-ham + ares-normalize + i18n + migrations)
- Regression testi: `migrations/` altına bozuk SQL eklendiğinde gerçekten yakalıyor, Deploy engelleniyor

### Bugün Planlanan Ama Yapılmayan
Yok — 4/4 iş tamamlandı. 27'nin tüm kuyruğu temizlendi.

### 28. Oturumda Bitenler (borçtan düşenler)
- ✅ PAT token iptali (27'den devir)
- ✅ Vercel env denetimi + Sensitive geçiş (27'den devir) — Hem güvenlik hem legacy/yeni ikilik fantom olduğu ortaya çıktı
- ✅ kontrol.js'e migrations kontrolü entegrasyonu (27'den devir) — 15 kural, 4/4 self-test
- ✅ Migrations README markdown fantom borç kapatıldı
- ✅ `migrations-check.yml` silindi — paralel sistem çakışması önlendi

### Bugünkü Önemli Öğrenmeler (28. Oturum)

1. **Devralınan borcu doğrulamadan üstüne iş planlama.** 27'nin son-durum.md'si "README markdown bozuk" diyordu — gerçekte dosya düzgündü, rapor hatalıydı. Bir borcu planladan önce "hâlâ gerçekten borç mu?" kontrolü yapmak gerekiyor. Aksi halde fantom işler birikir. **Ders:** Kuyruk maddelerini teyit etmeden plana almayın.

2. **Vercel "Needs Attention" = plaintext secret uyarısı.** İki tip env variable var: plaintext (dashboard'da görünür) ve Sensitive (görünmez). Secret key'lerin plaintext saklanması güvenlik açığı. Sensitive'e çevirme tek tık değil — delete + add döngüsü ile. Ama kısa downtime tolere edilebilir (1-3 dk, müşteri yokken sıfır etki).

3. **Deploy logları değerli.** ANTHROPIC_API_KEY'in nerede kullanıldığını belge arayarak bulamazdık — Vercel build log'unda `Compiling api/izometri-oku.js` satırını görünce anladık. **Ders:** "Bu değişken nerede kullanılıyor?" sorusunda ilk bakılacak yer deploy log'u.

4. **A1 yaklaşımı (üst-seviye klasör kontrolü) dosya-bazlı iterate'ten daha temiz.** Migrations duplicate numara kontrolü için tüm dosyaları bir arada değerlendirmek gerek — dosya-dosya iterate'e zorlamak cache + flag + karmaşa üretirdi. Ayrı fonksiyon olarak ekleyip dosyaRaporlari'na sonradan inject etmek temiz çözüm. **Ders:** Mimariyi veriye uydur, veriyi mimariye değil.

5. **Kullanıcının "sıralı yap" talimatını okumaması daha iyi sonuç verdi.** Claude "önce test dosyalarını, sonra kuralları" demişti. Cihat hepsini tek seferde yükleyince tek commit'te tüm parçalar bir arada gitti, CI hiç kırılmadı. **Ders:** Atomik commit her zaman aşamalı commit'ten güvenli — "bir değişiklik seti bir commit" kuralını daha ciddiye al.

6. **Test edilmemiş kod gönderme = yanılma riski.** Bu sefer farklıydı — `/home/claude/28oturum/test-env/` altında tam self-test koştuk, 4/4 başarılı gördükten sonra paylaştık. Sonuç: CI'a gidince ilk push'ta yeşil. **Ders:** Karmaşık refactor öncesi her zaman sandbox testi yap.

### Bekleyen Borçlar

**Acil (29. oturum için):**
- 🔴 **Devredilebilirlik Günü — Hibrit Dokümanlar** (A2 onaylandı) — ONBOARDING.md + ARCHITECTURE.md + DATABASE.md + API.md + LOCAL-DEV.md + README.md + auto-update script + workflow
- 🟡 **CommonJS uyarısı temizleme** — Vercel deploy log'unda her seferinde uyarı (15 dk)

**Orta vade (30-34. oturum — ALTYAPI KAPANIŞ PLANI ✅ ONAYLANDI):**
- 🔴 **30. oturum — Bucket PRIVATE geçişi** — `arespipe-dosyalar` şu an PUBLIC, müşteri öncesi ŞART
- 🔴 **31. oturum — Sentry entegrasyonu** — Runtime hata toplama, olmadan müşteriyle iletişim kopar
- 🔴 **32. oturum — Email sistemi** — Şifre sıfırlama, Resend/SendGrid, zorunlu
- 🟡 **33. oturum — Staging Supabase projesi + migration runner** — İkinci proje, otomatik migration
- 🟡 **34. oturum — Tenant izolasyon testleri + feature flag** — `tests/rls-isolation.sql` + rollback

**35'ten sonra ÜRÜN DÖNEMİ:**
- 🟡 Tablo Render Standardı (G-06) — 26'dan devir, Cihat'ın asıl sorusu
- 🟡 Operasyon sayfaları %100 — Kesim/Büküm/Markalama bitirme
- 🟡 Mobil sayfalar — MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- 🟡 G-05 CI lint kuralı — `.mb-*` hardcode rgba/hex yasağı
- 🟢 Audit Log pano sekmesi
- 🟢 help.html son kullanıcı dokümantasyonu
- 🟢 docs/rules/ kural ayrıştırması

### Kural Sağlık Kontrolü
- **Son self-test:** 24 Nisan 2026, 28. oturum — **4/4 başarılı** ✅
- **⚠️ Sonraki zorunlu self-test:** 33. oturum (28→33, 5 oturum)
- **Komut:** `node .github/kontrol.js --self-test`
- **Not:** Migrations kontrolü artık self-test kapsamında. Bir sonraki sağlık kontrolünde 15 kuralın hepsi test edilecek.

---

## 📖 Aktif Belgeler (Yaşayan — Her Oturumda Gündemde)

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu: 7 katman, 5 faz, prototipler, AI döngüsü.
**28. oturum teyidi:** 1. katman (izometri okuma) API endpoint'i (`api/izometri-oku.js`) canlıda, Anthropic key ile çalışıyor.

### Pano Tasarımı: `docs/PANO-TASARIM.md`
Süper Admin Yönetim Panosu. 24-25. oturumda implement edildi.

### Kullanıcı Profili: `docs/CIHAT-PROFIL.md` ⚠ ZORUNLU
Her oturum başı Claude bu dosyayı okur. Cihat'a "kimsin" diye sormaz.

### Pano (canlı): `admin/panel.html`
Süper admin çalışma merkezi. Tek yerden: görev, geri bildirim, CI durumu, Sistem Sağlığı, profil, oturum geçmişi.

### CI Rapor: `.github/ci-son-rapor.json`
CI her main push'ta JSON rapor üretir. Pano Sistem Sağlığı kartı bu dosyayı okur.

### Oturum Arşivi: `docs/sessions/archive-01-22.md`
1-22. oturumların CLAUDE.md'den ayıklanmış özetleri.

### Şablonlar: `docs/templates/`
Yeni HTML sayfası ve SQL migration için başlangıç iskeletleri.

### **Yedekleme Sistemi** (27. oturum)
- **Repo:** `cihatoztas-ai/arespipe-backups` (private)
- **Workflow:** `.github/workflows/db-backup.yml` — her gece 03:00 TR, DB + Storage
- **Secrets:** `SUPABASE_DB_URL`, `SUPABASE_SERVICE_KEY`
- **Yedek yapısı:** `backups/TIMESTAMP/database.sql.gz` + `storage.tar.gz`
- **Retention:** 30 gün rolling
- **Manuel tetikleme:** Actions → Supabase Full Backup → Run workflow

### **Migrations** (27-28. oturum)
- **Klasör:** `migrations/` (arespipe ana repo)
- **Baseline:** `000_initial_schema.sql` (6029 satır, 51 tablo)
- **Kural:** `NNN_aciklama.sql` adlandırma, BEGIN/COMMIT, header yorumu
- **CI:** `kontrol.yml` (28. oturumda entegre — ayrı workflow yok)
- **Şablon:** `docs/templates/yeni-migration-sablonu.sql`
- **Kural kodları:** `MIG_ISIM_BOZUK`, `MIG_NUMARA_TEKRAR`, `MIG_HEADER_EKSIK`

### **Vercel Env Variables** (28. oturum teyit)
- `SUPABASE_URL` (public, plaintext — URL zaten public bilgi)
- `SUPABASE_SERVICE_KEY` (🔒 Sensitive — `sb_secret_*` yeni format)
- `ANTHROPIC_API_KEY` (🔒 Sensitive — `sk-ant-*`, `api/izometri-oku.js`'de kullanılıyor)
- Development ortamı Sensitive variable'larda kilitli — lokal CLI kullanılmadığı için sorun değil

---

## Bir Sonraki Oturumda Claude Bunları Yapacak

**1. Oturum açılır açılmaz, ilk tool call'dan ÖNCE ritüel:**

> "Oturum başlangıç ritüeli. Şunu çalıştır ve çıktıyı yapıştır:
> ```
> cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
> ```
> Ayrıca GitHub Actions sekmesinde son build yeşil mi kontrol et.
> `arespipe-backups` repo'sunda son 24 saat içinde yeni yedek düşmüş mü — bugün ilk gerçek otomatik yedek (03:00 TR) denenmiş olmalı."

**2. Ritüel tamamlanmadan hiçbir teknik iş başlama.**

**3. Ritüel biter bitmez `docs/CIHAT-PROFIL.md`'yi oku.**

**4. 29. OTURUMUN TEK GÜNDEMİ — ONAYLANDI:** Devredilebilirlik Günü (Hibrit Dokümanlar)
- Alternatif öneri sunma — 28. oturum sonunda plan netleştirildi
- 6 belge + 1 auto-update script + 1 workflow dosyası
- Detaylı içerik: `CLAUDE-SONRAKI-OTURUM.md`
- 30-34. oturumlar için altyapı kapanış planı oturdu — 35'ten itibaren ürün

**5. Self-test bu oturumda koşturulmayacak.** Son 28. oturumda yapıldı (4/4). Sonraki zorunlu kontrol 33. oturumda.

---

## Oturum İçinde Uyulacak Disiplin

- **Kural çakışması varsa dur, sor** (A/B/C seçeneği)
- **"Hatırlıyorum" deme** — dosyaya bak
- **Yeni kural söylendiğinde 3 iş:** `kurallar.json` + kanıt + self-test
- **Komutları üst üste verme** — birer birer, açıklamalı
- **Büyük değişikliklerde tam dosya** — patch değil
- **CHECK değişiminde:** DROP → UPDATE → ADD sırası
- **FK eklerken:** Mevcut embed sorgularını `table!fk_kolonu` ile disambiguate et
- **Workflow dosyaları `.github/workflows/` altına** — kök seviyeye değil (25. oturum dersi)
- **Toplu sed öncesi tek dosyada test** — idempotent değil (25. oturum dersi)
- **Bug sorulduğunda "aslında ne arıyorsun" sor** — özellikle önceki oturumdan not varsa (26. oturum dersi)
- **Bir bug gördüğünde "kaç yerde tekrarlanabilir?" sor** — tek-düzeltme yerine denetim + sistemik çözüm (26. oturum dersi)
- **Plan değişikliği anında söyle** — seçenekleri baştan karşılaştır, uygulamadan önce onaylat (27. oturum dersi)
- **Failure anında log'u oku, iyi haberi bul** — paniğe katılma, başarıyı göster (27. oturum dersi)
- **Uzun markdown için Upload files kullan** — Create file/paste formatı bozabilir (27. oturum dersi)
- **Yeni DB değişikliği = migrations dosyası** — Supabase SQL editor'de yazıp run yeterli değil, artık dosya da oluşur (27. oturum disiplini)
- **Devralınan borcu doğrulamadan iş planlama** — 27'nin fantom README borcu gibi (28. oturum dersi)
- **Atomik commit aşamalı commit'ten güvenli** — ilişkili dosyaları tek seferde yolla (28. oturum dersi)
- **Karmaşık refactor öncesi sandbox testi zorunlu** — production push öncesi lokal simülasyon (28. oturum dersi)

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
