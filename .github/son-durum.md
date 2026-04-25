# AresPipe — Son Durum (her oturum sonunda güncellenir)

> Bu dosya her oturum açıldığında Claude tarafından **zorunlu olarak okunur.**
> İçeriği hafıza değil kayıt. Unutma imkansız — dosya burada.

---

## Son Oturum: 30 (24 Nisan 2026) — Bucket PRIVATE Faz 1-2 + Rate Limit Duvarı ⏸

### CI Durumu
- **Son build:** YEŞİL ✅ (kontrol.yml + docs-uret.yml)
- **Aktif kural sayısı:** 15 (değişmedi)
- **Self-test:** Koşturulmadı — sonraki zorunlu 33. oturum
- **Vercel:** ⚠️ Rate limit yedi (24 saat bekleme) — Faz 2 testi 31'e kaldı

### Bu Oturumda Yapılanlar (~3.5 saat)

**Faz 1 — Envanter + DB/Bucket Temizliği** ✅ (~45 dk)
- DB taraması: 8 kolon bucket'a dokunuyor, 4'ü gerçek veri kaynağı (`fotograflar`, `belgeler`, `feedback_kayitlari.fotograf_url`, `kullanicilar.foto_url`)
- Kayıt sayısı: `fotograflar` 34 (tümü test), `feedback_kayitlari.fotograf_url` 1 (test), diğerleri 0 dolu
- Yol yapısı teyidi: `<tenant_id>/<kategori>/<parent_id>/<dosya>` — tenant-prefixed, doğru kurulmuş
- **Karar:** 35 kayıt = test verisi → TRUNCATE et, baştan temiz başla
- DB temizliği: `DELETE FROM fotograflar` + `UPDATE feedback_kayitlari SET fotograf_url=NULL` — transaction'lı, 0/0 teyit
- Bucket fiziksel temizlik: Supabase Dashboard'dan `00000000...01/` ve `feedback/` klasörleri silindi → bucket boş

**Faz 2 (Kod) — Signed URL API Endpoint** ✅ (~45 dk)
- `api/dosya-url-al.js` yazıldı (~100 satır):
  - POST + JWT-bazlı auth (Authorization: Bearer)
  - `tenant_id` DB'den (JWT'den user_id → kullanicilar tablosu sorgusu)
  - Yoldan tenant_id çıkar, JWT ile eşleştir, cross-tenant 403
  - Super admin bypass (feedback paneli için)
  - 1 saatlik signed URL (`createSignedUrl(yol, 3600)`)
  - Hata kodları: YETKI_GEREKLI, TOKEN_GECERSIZ, YOL_GECERSIZ, TENANT_UYUSMAZLIGI, DOSYA_YOK, SUPABASE_HATASI
- `package.json` repo köküne eklendi (`@supabase/supabase-js ^2.45.0`)
- İki atomik commit: `package.json` → `api/dosya-url-al.js`
- GitHub Actions CI yeşil ✅

**Faz 2 (Test)** ⏸ **Vercel rate limit** — 24 saat bekleme, 31'e kaldı

**Yan İş — Vercel Rate Limit Önleme** ✅
- `vercel.json`'a `ignoreCommand` eklendi (mevcut headers korundu)
- Komut: `git diff HEAD^ HEAD --quiet -- ':(exclude).github' ':(exclude)docs' ':(exclude)*.md' && exit 0 || exit 1`
- `.github/`, `docs/`, `*.md` değişiklikleri Vercel'i tetiklemez → kota yenmez
- Vercel UI'dan deneme başarısız (dropdown davranışı kafa karıştırıcı) → `vercel.json` yaklaşımı tercih edildi
- Yarın kota açılınca otomatik devreye girecek

**Yan İş — Ritüel 5. Soru** ✅
- `CLAUDE.md` başındaki zorunlu ritüele eklendi:
  > 5. admin/panel.html → Geri Bildirim sekmesinde açık (yeni + inceleniyor) kaç feedback var? Kritik olanları özetle.
- Neden: 30'un başında canlı feedback kuyruğu gündeme gelmedi, Cihat hatırlatmak zorunda kaldı → sistemik çözüm

**Yan İş — Feedback Kuyruğu Taraması** ✅
- Pano → 28 açık feedback incelendi, 5 gruba ayrıldı
- **Grup 1 (3 kayıt):** Zaten yapılmış (yedekleme x2, izometri 502) — pano'da durum güncellemesi yapılmadı (Cihat: "boşver, gerek yok")
- **Grup 5 (13 kayıt):** Ürün dönemi (35+) — bu dosyanın altında kayıt edildi, referans olarak durur

### 30. Oturumda Bitenler (borçtan düşenler)
- ✅ Bucket Faz 1 (envanter + temizlik)
- ✅ Bucket Faz 2 kodlaması (canlıda test 31'e)
- ✅ Vercel ignored build step (kalıcı çözüm, `vercel.json` yaklaşımı)
- ✅ Ritüel 5. feedback sorusu

### 30. Oturumda Devrilen Borçlar
- 🔴 **Bucket PRIVATE Faz 3-6** — Vercel rate limit yüzünden 31'e ertelendi (normalde 30'da bitecekti)
- 🟡 Plan 1 oturum kaydı: Sentry 31 → 32, Email 32 → 33, Staging 33 → 34, Tenant test 34 → 35

### Bugünkü Önemli Öğrenmeler (30. Oturum)

1. **Vercel rate limit 29'un uyarısını canlı doğruladı.** 29'da "yoğun push günü öncesi Vercel Pro'yu düşün" notu vardı, 30'da yedik. **Ders:** Rate limit önleme her çok-push gününden önce standart adım olmalı, sadece problem çıkınca değil.

2. **Vercel UI "Ignored Build Step" dropdown'u kafa karıştırıcı.** "Only build if there are changes in a folder" seçiliyken bash komut textbox'ı çalışmıyor. **Ders:** UI-öncelikli ayarlar yerine repo'da `vercel.json` ile kod olarak yönetmek daha deterministik. UI değil, dosya kaynak doğru.

3. **`sorgula.js` tenant_id'yi body'den alıyor** — mevcut güvenlik açığı. Yeni endpoint JWT-bazlı yazıldı ama sorgula.js aynı açığı taşıyor. **Ders:** Eski endpoint'lerin auth pattern'ını oturum başında denetle, sessiz teknik borç birikmesin. (Not: `sorgula.js` refactor'u 31-32 aralığında ele alınacak)

4. **"Tamam mı bitti mi?" sorusu kritik.** 30'un yarım kaldığı an (rate limit) Cihat sordu — yarım bilgiyle yatmamak. **Ders:** Her iş bloğunun sonunda "X tamamlandı/kaldı, yarına ne kalacak" cümlesi zorunlu.

5. **Cihat yorgunluğu işaret.** Vercel UI dropdown turu 20+ dk döndü, Cihat "uykum var, yarım kalırsa uyuyamam" dedi. **Ders:** Uzun dropdown/debugging döngüleri 10 dk'dan sonra alternatif yola geç (kodla çöz, UI'da uğraşma).

### Bekleyen Borçlar

**Acil (31. oturum için — 30'dan devir):**
- 🔴 **Bucket PRIVATE Faz 2 test** — canlıda endpoint çalışıyor mu (Vercel açılınca)
- 🔴 **Bucket PRIVATE Faz 3** — Bucket'ı Supabase Dashboard'dan PRIVATE yap
- 🔴 **Bucket PRIVATE Faz 4** — Frontend migration: `dosyaUrlAl(yol)` helper + sayfa sayfa refactor (`spool_detay` ilk, sonra devre/kesim/bukum/markalama/KK/sevkiyat + mobil)
- 🔴 **Bucket PRIVATE Faz 5** — Pozitif/negatif/expiration/cache test
- 🔴 **Bucket PRIVATE Faz 6** — Kapanış

**Orta vade (1 oturum kaydı — ALTYAPI KAPANIŞ PLANI):**
- 🔴 **31. oturum — Bucket PRIVATE Faz 3-6 (devir)**
- 🔴 **32. oturum — Sentry entegrasyonu** — Runtime hata toplama
- 🔴 **33. oturum — Email sistemi** — Şifre sıfırlama, Resend/SendGrid
- 🟡 **34. oturum — Staging Supabase projesi + migration runner**
- 🟡 **35. oturum — Tenant izolasyon testleri + feature flag**

**29'dan devreden küçük borçlar:**
- 🟡 `actions/checkout@v4` + `setup-node@v4` deprecation — v5 geçişi
- 🟡 Supabase `arespipe-dev` projesi incelemesi (canlı mı, sil/belgele?)
- 🟢 Fotoğraf/belge yaşam döngüsü (aktif-arşiv sıkıştırma) — 33-34

**36'dan sonra ÜRÜN DÖNEMİ:**
- 🟡 Tablo Render Standardı (G-06) — 26'dan devir
- 🟡 Operasyon sayfaları %100 — Kesim/Büküm/Markalama bitirme
- 🟡 Mobil sayfalar — MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- 🟡 G-05 CI lint kuralı — `.mb-*` hardcode rgba/hex yasağı
- 🟢 `sorgula.js` JWT-bazlı auth refactor (şu an body'den tenant_id alıyor — güvenlik açığı)
- 🟢 Audit Log pano sekmesi
- 🟢 help.html son kullanıcı dokümantasyonu
- 🟢 docs/rules/ kural ayrıştırması

**Ürün Dönemi Feedback Birikimi (35+) — 30. oturumda feedback kuyruğundan ayıklanan:**
- Google takvim senkron (2 kayıt aynı istek)
- Kesimci/bükümcü/markalama/malzeme için ayrı personel sayfaları
- Parmak izi okuyucudan işe giriş-çıkış entegrasyonu
- PDF çıktılarda firma/program logosu + sayfa düzeni
- Kalite kontrol inspection formu
- QR kod etiket boyut + tasarım
- Index sayfası widget-layout (kullanıcı özelleştirebilsin)
- İlk kurulumda dil seçimi (gereksiz dilleri gizle)
- Devre detay başlık formatı (tersane/gemi/devre/zone) + barkod
- Logout onay uyarısı (tarayıcı native yerine programdan)
- Devreler listesi kum saati yerine animasyonlu açılım
- Giriş sayfası yanlış yönlendirmeler (kalıcı çözüm)
- İmalat/argon/gazaltı aşamalarında bekleyen spool+yoğunluk göstergesi

### Kural Sağlık Kontrolü
- **Son self-test:** 24 Nisan 2026, 28. oturum — **4/4 başarılı** ✅
- **⚠️ Sonraki zorunlu self-test:** 33. oturum (28→33, 5 oturum)
- **Komut:** `node .github/kontrol.js --self-test`

---

## 📖 Aktif Belgeler (Yaşayan — Her Oturumda Gündemde)

### **Dokümantasyon Sistemi** (29. oturum)
Repo kökünde `README.md` + `docs/` altında 6 belge (ONBOARDING, ARCHITECTURE, DATABASE, API, LOCAL-DEV + mevcut SPOOL-AI-VIZYON, PANO-TASARIM, CIHAT-PROFIL, ROADMAP). Hibrit: manuel + AUTO sınırları.

- **Motor:** `.github/docs-uret.js`
- **Workflow:** `.github/workflows/docs-uret.yml`
- **AUTO bölümler:** `istatistikler`, `tablolar`, `endpointler`, `kurallar`
- **Kullanım:** Yeni yazılımcı `docs/ONBOARDING.md` ile başlar

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu: 7 katman, 5 faz, prototipler, AI döngüsü.
**28. oturum teyidi:** 1. katman (izometri okuma) API endpoint'i (`api/izometri-oku.js`) canlıda.

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
- **CI:** `kontrol.yml` (28. oturumda entegre)

### **Vercel Env Variables** (28. oturum teyit)
- `SUPABASE_URL` (public)
- `SUPABASE_SERVICE_KEY` (🔒 Sensitive — `sb_secret_*`)
- `ANTHROPIC_API_KEY` (🔒 Sensitive — `sk-ant-*`)

### **Vercel Ignored Build Step** (30. oturum — YENİ)
- **Yöntem:** `vercel.json` `ignoreCommand` alanı (UI yerine repo'da kod)
- **Kural:** `.github/`, `docs/`, `*.md` değişiklikleri Vercel build'ini skip eder
- **Amaç:** Free tier rate limit'inin yenmesini önler

### **Storage Bucket** (🔴 31. oturumda PRIVATE olacak)
- **Bucket:** `arespipe-dosyalar`
- **Şu anki durum:** PUBLIC + boş (30. oturumda test verisi temizlendi)
- **API endpoint:** `api/dosya-url-al.js` (yazıldı, canlıda test 31'de)
- **Müşteri öncesi şart:** Bucket PRIVATE + signed URL frontend migration (31. oturumun gündemi)

---

## Bir Sonraki Oturumda Claude Bunları Yapacak

**1. Oturum açılır açılmaz, ilk tool call'dan ÖNCE ritüel:** (5 soru — CLAUDE.md'de güncel)

**2. Ritüel tamamlanmadan hiçbir teknik iş başlama.**

**3. Ritüel biter bitmez `docs/CIHAT-PROFIL.md`'yi oku.**

**4. 31. OTURUMUN GÜNDEMİ — Bucket PRIVATE Faz 3-6 (30'dan devir):**
- Detaylı içerik: `CLAUDE-SONRAKI-OTURUM.md`
- Beklenen süre: 2-3 saat
- Canlıda `api/dosya-url-al.js` testi → Bucket PRIVATE → frontend migration → test → kapanış

**5. Vercel kontrol:** Rate limit açıldı mı? `vercel.json ignoreCommand` devreye girdi mi?

**6. Self-test bu oturumda koşturulmayacak.** Sonraki zorunlu kontrol 33. oturum.

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
- **CI auto-commit pattern'i: commit → pull --rebase → push (3x retry)** — paralel workflow race condition için (29. oturum dersi)
- **Vercel ayarları UI yerine `vercel.json`'da** — deterministik, repo-kontrollü (30. oturum dersi)
- **UI debugging 10 dk'yı aşıyorsa kodla çözmeye geç** — dropdown tekrar döngüsü çözüm değil (30. oturum dersi)
- **Her iş bloğu sonunda "tamam/yarım" cümlesi** — kullanıcı yarım bilgiyle yatmasın (30. oturum dersi)

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
