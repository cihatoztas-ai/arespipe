# AresPipe Son Durum

> Bu dosya her oturum başı Claude tarafından okunur. Her oturum sonu güncellenir. Burası anlık gerçek — diğer dosyalardan farklı olarak burada **şu anki canlı durum** yazılıdır.

---

## 31. Oturum (25 Nisan 2026) — Bucket PRIVATE Migration + Disiplin Kuruluşu

### Yapılanlar

**Bucket PRIVATE Faz 3-6 (30'dan devir, tamamlandı) ✅**
- `api/dosya-url-al.js` canlı testi: 5/5 başarılı (CORS, JWT, super_admin bypass, yol doğrulama, tokensız reddet)
- Bucket PRIVATE durumu doğrulandı — zaten kapalıymış (son-durum.md'deki "PUBLIC + boş" varsayımı yanlıştı, bu kayıt düzeltildi)
- `ares-store.js` v2.4 — `ARES.dosyaUrlAl(yol)` helper eklendi (private cache, 5dk buffer, signed URL TTL 1sa)
- `spool_detay.html` migration — foto/belge yükleme + render signed URL akışına geçti, eager Promise.all pattern
- `ares-layout.js` — feedback foto upload `<tenant_id>/feedback/<ts>.jpg` formatında, base64 fallback korundu
- `admin/panel.html` — feedback render 3-yollu format ayrımı (path/base64/eski-public-URL)
- Canlı test — gerçek foto yükleme + render başarılı

**Sayfa Eksikleri Taraması (SED-01 ön çalışması)**
- `spool_detay.html` ve `devre_detay.html` geniş tarandı, 9 backend eksik tespit edildi
- 3 fix yapıldı (S2, D1, D2):
  - **S2** — `egitim_verisi` insert kolon adı: `foto_url` → `fotograf_url` (Spool AI eğitim verisi artık kayıt ediliyor)
  - **D1** — `spoolEkleKaydet` Supabase'e yazıyor (optimistic UI + rollback). Sayfa yenilendiğinde spool kaybolma bug'ı düzeldi.
  - **D2** — `durdurKaydet` ve `durdurmaKaldir` `devreler.durum` UPDATE yapıyor. Yenilenince banner kalkma bug'ı düzeldi.
- 6 eksik defter'e açık olarak yazıldı (`docs/SAYFA-EKSIKLERI.md`)

**G-08 Sayfa Açılış Ritüeli — kural tanımlandı + envanter çıkarıldı**
- Mevcut `devreler.html`'deki shimmer + cascade pattern'i kural olarak yazıldı (CSS spec, JS spec, HTML spec)
- Envanter: 4 sayfa tam (devreler, kesim, bukum, markalama), 22 sayfa eksik (15'i yüksek öncelik liste sayfası)
- Yaygınlaştırma 32+ oturumlara borç olarak yazıldı

**Yeni Defter: `docs/SAYFA-EKSIKLERI.md`**
- Bucket migration kapsamı dışındaki sayfa-bazlı eksikler kayıt altında
- SED-01 kuralı (backend eksiklerini tarama disiplini) ön çalışma
- G-08, G-09, G-10 kural numaralarıyla genişleyebilir yapı

### 31'in Önemli Öğrenmeleri

1. **`grep "getPublicUrl|.upload("` taraması büyük zaman tasarrufu** — Plan dosyası 7 sayfa migration diyordu. Gerçek koddan tarayınca **sadece spool_detay.html ve ares-layout.js** gerçek upload yapıyordu. 90 dk boşa migration kurtarıldı. **Ders:** plan dosyalarına ezbere uyma, gerçek kod kontrol et.

2. **Deploy zamanlaması yanıltıcı olabilir** — Feedback foto testi başlangıçta "yeni kod canlıda değil" gibi göründü. Gerçek: kullanıcı deploy'dan ÖNCE test yapmıştı. **Ders:** Test öncesi hard refresh + deploy zamanı doğrula.

3. **Schema gerçeği — varsayım değil sorgu** — `egitim_verisi.foto_url` sandığım kolon, schema'da `fotograf_url` olarak vardı. information_schema sorgusu olmadan görülmezdi. **Ders:** DB değişikliği planlarken her zaman önce schema tara.

4. **`arespipe-dev` proje ismi yanıltıcı** — "dev" diyor ama canlı üretim. Vercel env URL eşleştirmesi ile kanıtlandı. 28'den beri açık olan borç (`arespipe-dev incelemesi`) **çözüldü**: kanıt ile canlı üretim olduğu doğrulandı. Rename düşünülebilir, ama görece düşük öncelik.

5. **Cihat'ın "her sayfa için bir eksik kapatılmış olsa" gözlemi** — 22 oturumdur birikmenin sebebini netleştirdi. Yarım akışlar görülüyor ama "bu işin gündemi değil" diye atlanıyor. SED-01 / SBD-01 kuralı bu boşluğu doldurmak için tasarlanıyor. Karar 32'ye ertelendi (GitHub Issues vs markdown defter tercihi).

6. **Eager vs lazy migration** — Plan dosyası `<img data-yol>` + lazy lookup öneriyordu. Eager Promise.all + field ayrımı (`dosya_url` path, `url` signed) seçildi. 4x daha az satır değişti, race condition yok, mevcut tüm `<img src=f.url>` kodu aynı kaldı. **Ders:** kapsamı düşük tutan tasarım her zaman iyi.

### Cross-Tenant Testi (Bekliyor)

31'de süper admin testi yapıldı (bypass çalıştı). Cross-tenant blok kontrolü (normal user + başka tenant'ın yolunu çağırma) **henüz yapılmadı** — 2. test kullanıcısı gerekir. 32+ oturuma "bekleyen test" olarak not edildi, kritik değil çünkü endpoint kodu zaten `superAdmin` flag'ini explicit kontrol ediyor.

### Bugünkü Borçlar (defter + son-durum)

**Acil temizlik (kapanış sonrası, 5 dakika):**
- 🔴 **Orphan bucket dosyaları (2 adet):** `feedback/1777099713115.jpg` ve `feedback/1777100014537.jpg` — Cihat migration testleri sırasında bucket'a düştü, DB'deki kayıtları silinebilir + bucket dosyaları manuel silinmeli (Supabase Dashboard)

**31'den devreden orta vade:**
- 🟡 **`db-backup.yml` cron** — `0 3 * * *` → `0 0 * * *` (UTC 00:00 = TR 03:00, plana hizala). Şu an saat kayması yapıyor (TR 05:55).
- 🟡 **SBD-01 vs GitHub Issues kararı** — 32. oturum başında Cihat seçecek. Birikme önleme sistemi.
- 🟡 **G-08 yaygınlaştırma** — 22 sayfa eksik (15 yüksek öncelik). 32-34 oturumlarına dağıtılabilir.
- 🟢 **G-09 (filtre çubuğu) ve G-10 (üst aksiyon çubuğu)** — kural numaraları rezerve edildi, teknik spec sonra yazılacak.

**Önceki dönemlerden devreden (durum güncel):**
- 🟡 `actions/checkout@v4` + `setup-node@v4` deprecation — v5 geçişi (29'dan)
- 🟡 ✅ `arespipe-dev` proje incelemesi (28'den) — **çözüldü** (canlı üretim olduğu doğrulandı, rename gerekirse)
- 🟢 `sorgula.js` JWT-bazlı auth refactor — body'den tenant_id alıyor (güvenlik açığı)
- 🟢 Audit Log pano sekmesi
- 🟢 Tablo Render Standardı (G-06) — 26'dan devir
- 🟢 Operasyon sayfaları %100 — Kesim/Büküm/Markalama bitirme
- 🟢 Mobil sayfalar — MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- 🟢 G-05 CI lint kuralı — `.mb-*` hardcode rgba/hex yasağı
- 🟢 help.html son kullanıcı dokümantasyonu

**Defter'deki açık SED maddeleri (`docs/SAYFA-EKSIKLERI.md`):**
- spool_detay: S1 (belgeKaydet DB'ye yazmıyor), S3 (AI toolbar gizli), S4 (QR indirme)
- devre_detay: D3 (tersane iş emri DB kolonu yok), D4 (KK/Sevk listeleri dolmuyor), D5 (belge upload), D6 (sessiz console.warn'lar), D7 (durdurma_tarihi kolonu yok)

### Plan / Roadmap

| Oturum | Tema | Durum |
|---|---|---|
| 30 | Bucket PRIVATE Faz 1-2 | ✅ |
| **31** | **Bucket PRIVATE Faz 3-6 + SED başlangıç + G-08 envanter** | **✅ TAMAMLANDI** |
| 32 | **KARAR:** SBD-01/Issues + Sentry sıralaması (Cihat seçecek) | Beklemede |
| 33 | Sentry ya da G-08 yaygınlaştırma (32 kararına bağlı) | Beklemede |
| 34 | Email sistemi | 1 kayma |
| 35 | Staging Supabase + migration runner | 1 kayma |
| 36 | Tenant izolasyon testleri + feature flag | 1 kayma |

**37'den itibaren ÜRÜN DÖNEMİ.**

### Kural Sağlık Kontrolü
- **Son self-test:** 24 Nisan 2026, 28. oturum — **4/4 başarılı** ✅
- **⚠️ Sonraki zorunlu self-test:** 33. oturum (28→33, 5 oturum)
- **Komut:** `node .github/kontrol.js --self-test`

---

## 📖 Aktif Belgeler (Yaşayan)

### **Yeni: `docs/SAYFA-EKSIKLERI.md`** (31. oturum)
Sayfa-bazlı eksiklerin defterli takibi. SED-01 (backend) + G-08 (görsel ritüel) kurallarının kayıt yeri. 9 madde + envanter.

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu. **31'de küçük kazanç:** S2 fix ile `egitim_verisi` insert artık çalışıyor → eğitim verisi gerçekten toplanıyor.

### Pano Tasarımı: `docs/PANO-TASARIM.md`
Süper Admin Yönetim Panosu. 24-25. oturumda implement edildi.

### Kullanıcı Profili: `docs/CIHAT-PROFIL.md` ⚠ ZORUNLU
Her oturum başı Claude bu dosyayı okur.

### Pano (canlı): `admin/panel.html`
Süper admin çalışma merkezi. **31'de:** Feedback foto render 3-yollu format ayrımıyla güncellendi.

### CI Rapor: `.github/ci-son-rapor.json`
CI her main push'ta JSON rapor üretir.

### Oturum Arşivi: `docs/sessions/archive-01-22.md`
1-22. oturumların CLAUDE.md'den ayıklanmış özetleri.

### **Yedekleme Sistemi** (27. oturum)
- **Repo:** `cihatoztas-ai/arespipe-backups` (private)
- **Workflow:** `.github/workflows/db-backup.yml` — her gece UTC 02:55 (TR 05:55) — **plana göre 3 saat geç** (cron `0 3` UTC = TR 06:00 hedefli ama gerçekleşen ~02:56 UTC)
- **Düzeltme:** `0 0 * * *` UTC = TR 03:00 (orta vade borç)
- **Yedek yapısı:** `backups/TIMESTAMP/database.sql.gz` + `storage.tar.gz`
- **Retention:** 30 gün rolling

### **Migrations** (27-28. oturum)
- **Klasör:** `migrations/`
- **Baseline:** `000_initial_schema.sql` (6029 satır, 51 tablo)
- **Kural:** `NNN_aciklama.sql` adlandırma, BEGIN/COMMIT, header yorumu
- **CI:** `kontrol.yml` (28. oturumda entegre)

### **Vercel Env Variables**
- `SUPABASE_URL` (public)
- `SUPABASE_SERVICE_KEY` (🔒 Sensitive)
- `ANTHROPIC_API_KEY` (🔒 Sensitive)

### **Vercel Ignored Build Step** (30. oturum)
- **Yöntem:** `vercel.json` `ignoreCommand` alanı
- **Kural:** `.github/`, `docs/`, `*.md` değişiklikleri Vercel build'ini skip eder
- **31'de teyit:** Çalışıyor — son-durum.md push'unda Vercel tetiklenmedi

### **Storage Bucket** (✅ 31. oturumda PRIVATE doğrulandı)
- **Bucket:** `arespipe-dosyalar`
- **Durum:** PRIVATE (toggle KAPALI), 6 RLS politikası aktif
- **API endpoint:** `api/dosya-url-al.js` — canlıda, 5/5 test geçti
- **Helper:** `ARES.dosyaUrlAl(yol)` — `ares-store.js` v2.4'te
- **Cache:** 1 saatlik signed URL + 5 dakika güvenlik payı

---

## Oturum İçinde Uyulacak Disiplin

- **Kural çakışması varsa dur, sor** (A/B/C seçeneği)
- **"Hatırlıyorum" deme** — dosyaya bak
- **Yeni kural söylendiğinde 3 iş:** `kurallar.json` + kanıt + self-test
- **Komutları üst üste verme** — birer birer, açıklamalı
- **Büyük değişikliklerde tam dosya** — patch değil
- **CHECK değişiminde:** DROP → UPDATE → ADD sırası
- **FK eklerken:** Mevcut embed sorgularını `table!fk_kolonu` ile disambiguate et
- **Workflow dosyaları `.github/workflows/` altına** — kök seviyeye değil (25)
- **Toplu sed öncesi tek dosyada test** — idempotent değil (25)
- **Bug sorulduğunda "aslında ne arıyorsun" sor** (26)
- **Bir bug gördüğünde "kaç yerde tekrarlanabilir?" sor** (26)
- **Plan değişikliği anında söyle** — uygulamadan önce onaylat (27)
- **Failure anında log'u oku, iyi haberi bul** (27)
- **Uzun markdown için Upload files kullan** (27)
- **Yeni DB değişikliği = migrations dosyası** (27)
- **Devralınan borcu doğrulamadan iş planlama** (28)
- **Atomik commit aşamalı commit'ten güvenli** (28)
- **Karmaşık refactor öncesi sandbox testi zorunlu** (28)
- **CI auto-commit pattern'i: commit → pull --rebase → push (3x retry)** (29)
- **Vercel ayarları UI yerine `vercel.json`'da** (30)
- **UI debugging 10 dk'yı aşıyorsa kodla çözmeye geç** (30)
- **Her iş bloğu sonunda "tamam/yarım" cümlesi** (30)
- **Plan dosyalarına ezbere uyma, gerçek kod tara** — 31'de 90 dk tasarruf
- **Schema değişikliği planlarken information_schema sorgusu zorunlu** — 31'de S2 bug'ını yakaladı
- **Deploy zamanlamasını test öncesi doğrula** — 31'de feedback foto kafa karışıklığı
- **Eager > lazy mümkünse** — kapsamı küçült, race azalt (31)
- **Görülen yarım akışı sessizce atlama** — defter'e yaz (31)

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
