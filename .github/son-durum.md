# AresPipe — Son Durum (her oturum sonunda güncellenir)

> Bu dosya her oturum açıldığında Claude tarafından **zorunlu olarak okunur.**
> İçeriği hafıza değil kayıt. Unutma imkansız — dosya burada.

---

## Son Oturum: 27 (24 Nisan 2026) — Yedekleme Sistemi + Migrations Altyapısı ✅

### CI Durumu
- **Son build:** YEŞİL ✅
- **Yeni workflow'lar:** `migrations-check.yml` (arespipe), `db-backup.yml` + `extract-schema.yml` (arespipe-backups)
- **Yeni repo:** `arespipe-backups` (private) — DB ve Storage yedeklerini barındırır

### Bu Oturumda Yapılanlar (~4.5 saat)

**Saat 1 — DB Yedekleme Sistemi** ✅
- Yeni private repo: `cihatoztas-ai/arespipe-backups`
- GitHub Secrets: `SUPABASE_DB_URL` (Session pooler IPv4 uyumlu)
- Workflow: `.github/workflows/db-backup.yml`
- 3 iterasyon gerekti:
  1. İlk çalışma: PostgreSQL 16 vs 17 version mismatch (server 17.6, apt default 16.13)
  2. İkinci çalışma: Aşırı savunmacı script false positive verdi (`remove` komutu 16 yok diye fail)
  3. Üçüncü çalışma: PATH'e `/usr/lib/postgresql/17/bin` eklemek + pin kaldırmak ile başarılı
- **Sonuç:** Her gece 03:00 TR (UTC 00:00) otomatik DB dump, 30 gün rolling retention
- Manuel tetikleme: `workflow_dispatch` ile istenince çalıştırılabilir

**Saat 2 — Storage Yedeklemesi** ✅
- Supabase Storage durumu tespit edildi:
  - 1 bucket: `arespipe-dosyalar` (PUBLIC, 50 MB file limit, 23 MB toplam)
  - İçerik: tenant_id/spooller/spool_uuid/operasyon_fotograf.png yapısı + feedback, fotograflar, notlar alt klasörleri
- Supabase API key sistem değişikliği fark edildi: eski `anon`/`service_role` → yeni `publishable`/`secret`
- GitHub Secrets: `SUPABASE_SERVICE_KEY` (yeni `sb_secret_...` formatı)
- Workflow güncellendi — DB + Storage birlikte:
  - S3 API dene (Supabase S3-compat endpoint'i)
  - Fallback: Python + urllib ile HTTP API (list + download recursive)
  - Çıktı: `backups/TIMESTAMP/database.sql.gz` + `backups/TIMESTAMP/storage.tar.gz`
- İlk tam yedek başarılı (#5): 2m 56s, tüm 23 MB yedeklendi

**Saat 3 — Migrations Altyapısı: Schema Dump + Klasör** ✅
- Yeni workflow: `arespipe-backups/.github/workflows/extract-schema.yml`
- Tek seferlik schema dump artifact'ı üretildi (23.6 KB, 6029 satır)
- İçerik: **51 tablo, 85 index, 17 trigger, 18 fonksiyon, 90 RLS policy** (public + storage schemas)
- `arespipe` ana repo'ya `migrations/` klasörü kuruldu:
  - `migrations/README.md` — adlandırma, disiplin, kurulum sırası, yedekleme ile ilişkisi
  - `migrations/000_initial_schema.sql` — sıfır noktası (header + pg_dump çıktısı)
- `docs/templates/yeni-migration-sablonu.sql` zaten 26. oturumda hazırdı, referans olarak kullanılıyor
- **⚠️ Bilinen küçük sorun:** `migrations/README.md` markdown formatlaması GitHub render'ında bozuk (newline'lar paragraf olarak birleşmiş). Dosya içeriği doğru, sadece görsel. 28. oturumda düzeltilecek.

**Saat 4 — CI Kontrolü: migrations-check.yml** ✅
- Yeni workflow: `arespipe/.github/workflows/migrations-check.yml`
- Tetikleme: `migrations/**` path'inde değişiklik
- Kontrolleri:
  1. Dosya adı `NNN_aciklama.sql` regex: `^[0-9]{3}_[a-z0-9_]+\.sql$` — ihlal fail
  2. Sıra numarası çakışması — ihlal fail
  3. Header yorumu ilk 10 satırda `--` var mı — uyarı (build kırmaz)
  4. Özet: toplam dosya sayısı + son dosya
- Mevcut `kontrol.js` ana lint sistemine entegrasyon **28. oturuma ertelendi** (iki sebeple: riski azaltmak, taze kafa gerektirmek)

### Bugün Planlanan Ama Yapılmayan

**Migration Runner Workflow** — 28. oturuma ertelendi. Sebep: Şu an **staging ortamı yok**, sadece production var. Production'a "sırayla migration fırlatan" bir buton risk taşır. Staging geldiğinde anlamlı olacak.

**kontrol.js Entegrasyonu** — 28. oturuma ertelendi. Sebep: Mevcut `kontrol.js` içeriği incelenmeden kural eklemek risk taşır. Proje tarzına uygun (kurallar.json + bozuk-ornekler + self-test) tam entegrasyon 45 dk ek iş. Basit workflow şu an yeterli.

### 24.5 Notundan Yapılanlar / Kalanlar

26. oturum öncesi Cihat'ın yan sohbetten getirdiği 24.5 notu vardı. 27. oturumda önemli bir kısmı kapandı:

**✅ Yapılanlar:**
- 🔴 Yedekleme Katman 1 (GitHub Actions + pg_dump) — tamamı + Storage bonusu
- 🔴 Migrations klasörü kurulumu — baseline + README + CI kontrolü

**⏳ Kalanlar (28+ oturum için):**
- 🟡 Sentry entegrasyonu (runtime hata toplama) — müşteri öncesi zorunlu
- 🟡 Uptime monitör (Better Stack / UptimeRobot ücretsiz)
- 🟡 Environment ayrımı (dev/prod) — staging Supabase projesi
- 🟡 Görev sistemi sayfa görünümü (panel_gorevler.ilgili_sayfalar)
- 🟡 Audit Log pano sekmesi
- 🟡 Vercel Analytics
- 🟢 help.html son kullanıcı dokümantasyonu

### Bugünkü Önemli Öğrenmeler (27. Oturum)

1. **Plan değişikliği erken kabul edilmeli.** PAT token'ı (Personal Access Token) workflow planı için oluşturuldu, sonra daha temiz yaklaşım bulunca kullanılmadı. 2 yaklaşım karşılaştırması yapıp seçmek, uygulamadan önce olmalı. Boşa 5 dk harcandı ama daha kötüsü kullanıcıyı "ne yaptık da kullanmadık" endişesiyle baş başa bıraktı. Ders: Plan değişikliği anında ve açık iletişim.

2. **Supabase ürün değişiklikleri fark edilmeli.** Dashboard'da "Legacy anon, service_role API keys" sekmesi var — yeni `sb_secret_*` ve `sb_publishable_*` formatı 2025-2026 arasında devreye alınmış. AresPipe henüz legacy key kullanıyor olabilir (Vercel env variables'ta kontrol edilmeli). 28. oturumda Vercel env ismi listesi alınıp hangi format kullanıldığı netleşmeli.

3. **Aşırı savunmacı script iyi değil.** 2. deneme, `apt-get remove` çıktısında "PostgreSQL version 16 is not installed" gördü ve fail etti — aslında bu Ubuntu'nun "yok, yapılacak bir şey yok" mesajıydı. Ders: Exit code'u doğru okumak yerine stderr/stdout pattern'i beklemek yanlıştır. Basit script, daha doğru script.

4. **İş sırasında kullanıcıyı kaybetme riski var.** "Sıkıldım artık neden olmuyor" dediği an, 3. deneme fail olduğunda geldi. O noktada ben "iyi haber var, kurulum başarılı, sadece benim aşırı savunmacı script fail etti" demek yerine paniğe katılsaydım (tekrar karmaşık bir şey önersem) Cihat muhtemelen oturumu bırakacaktı. **Ders:** Failure anlarında **log'u oku, iyi haberi bul, sonra fix öner.** Yapılan 3 denemenin hepsi ilerleme idi — bunu kullanıcıya göster.

5. **Kritik kapasiteleri erken konuş.** Cihat "Supabase büyürse ne olur" diye sordu, yedek yaparken. Cevap: Free plan 1 GB, Pro $25/ay 100 GB; GitHub repo pratik ~5 GB, sert 100 GB; tek dosya 100 MB. Aşamalı strateji: **şimdi GitHub, 1 GB+'da retention azalt, 10 GB+'da R2/S3'e geç.** Over-engineering yapmamak ile future-proof olmamak arasında ince çizgi — önemli olan "değişim kolay mı" sorusuna evet demek. Mevcut workflow'da geçiş 1 saatlik iş olacak şekilde yazıldı.

6. **Dosya formatı kaybı (markdown).** README.md'yi büyük metin bloğu olarak yapıştırınca GitHub render'ında newline'lar paragraf oldu. GitHub web editor bazı paste işlemlerinde markdown formatting'i korumuyor — işe yarayan yol "Upload files" ile dosyayı direkt atmak. **Ders:** Uzun markdown için Create file yerine Upload files tercih et.

### Bekleyen Borçlar

**Acil (28. oturum için):**
- 🔴 **Migrations README markdown formatı** — GitHub render'ında bozuk, dosyayı Upload files ile yeniden yükle
- 🔴 **kontrol.js entegrasyonu** — `migrations-check.yml` basit workflow, mevcut proje tarzına (kurallar.json + bozuk-ornekler + self-test) entegre edilmeli
- 🟡 **Vercel env variable isim kontrolü** — AresPipe legacy (`SUPABASE_SERVICE_ROLE_KEY`) mı yeni (`sb_secret_*`) mi? Kullanılmayan format 28. oturumda iptal edilecek
- 🟡 **PAT token iptali** — 27. oturumda oluşturuldu, kullanılmadı. `https://github.com/settings/personal-access-tokens` → `arespipe-backups-writer` → Delete

**Orta vade (28-30. oturum):**
- 🟡 **Migration runner workflow** — Staging ortamı oluşturulunca anlamlı olur (Supabase 2. proje)
- 🟡 **Sentry entegrasyonu** — Runtime hata toplama, müşteri öncesi zorunlu
- 🟡 **Tablo Render Standardı (G-06)** — 26. oturumdan devir, Cihat'ın asıl sorusu
- 🟡 **Operasyon sayfaları %100** — Kesim/Büküm/Markalama bitirme
- 🟡 **G-05 CI lint kuralı** — `.mb-*` hardcode rgba/hex yasağı

**Uzun vade (ROADMAP Faz B-C):**
- 🟢 **Bucket PRIVATE geçiş** — `arespipe-dosyalar` şu an PUBLIC. Müşteri verisi içerdiğinde özel olmalı
- 🟢 **Audit Log pano sekmesi**
- 🟢 **Görev sistemi sayfa görünümü**
- 🟢 **docs/rules/** kural ayrıştırması
- 🟢 **Tenant izolasyon testleri** (`tests/rls-isolation.sql`)
- 🟢 **Mobil sayfalar**: MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara

### 27. Oturumda Bitenler (borçtan düşenler)
- ✅ Yedekleme Katman 1 (DB + Storage) — 24.5 notundan
- ✅ Migrations klasörü baseline + CI kontrolü — 24.5 notundan
- ✅ Schema dump sıfır noktası

### Kural Sağlık Kontrolü
- **Son self-test:** 23 Nisan 2026, 08:47 (23. oturum) — 3/3 başarılı ✅
- **⚠️ Sonraki self-test:** 28. oturum **ZORUNLU** — 5 oturum geçti (23→28)
- **Komut:** `node .github/kontrol.js --self-test`
- **Not:** 27. oturumda `migrations-check.yml` eklendi, `kontrol.js`'e entegre değil — self-test sadece mevcut 14 kuralı kontrol eder, migrations kontrolü ayrı workflow

---

## 📖 Aktif Belgeler (Yaşayan — Her Oturumda Gündemde)

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu: 7 katman, 5 faz, prototipler, AI döngüsü.

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

### **Yedekleme Sistemi** (YENİ — 27. oturum)
- **Repo:** `cihatoztas-ai/arespipe-backups` (private)
- **Workflow:** `.github/workflows/db-backup.yml` — her gece 03:00 TR, DB + Storage
- **Secrets:** `SUPABASE_DB_URL`, `SUPABASE_SERVICE_KEY`
- **Yedek yapısı:** `backups/TIMESTAMP/database.sql.gz` + `storage.tar.gz`
- **Retention:** 30 gün rolling
- **Manuel tetikleme:** Actions → Supabase Full Backup → Run workflow

### **Migrations** (YENİ — 27. oturum)
- **Klasör:** `migrations/` (arespipe ana repo)
- **Baseline:** `000_initial_schema.sql` (6029 satır, 51 tablo)
- **Kural:** `NNN_aciklama.sql` adlandırma, BEGIN/COMMIT, header yorumu
- **CI:** `.github/workflows/migrations-check.yml`
- **Şablon:** `docs/templates/yeni-migration-sablonu.sql`

---

## Bir Sonraki Oturumda Claude Bunları Yapacak

**1. Oturum açılır açılmaz, ilk tool call'dan ÖNCE ritüel:**

> "Oturum başlangıç ritüeli. Şunu çalıştır ve çıktıyı yapıştır:
> ```
> cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
> ```
> Ayrıca GitHub Actions sekmesinde son build yeşil mi kontrol et.
> `backups/` klasöründe yeni yedekler görünüyor mu kontrol et (her gece yedek alınmalı)."

**2. Ritüel tamamlanmadan hiçbir teknik iş başlama.**

**3. Ritüel biter bitmez `docs/CIHAT-PROFIL.md`'yi oku.**

**4. 28. OTURUMDA ZORUNLU: Self-test koştur.**
- 23'ten 28'e 5 oturum geçti
- Komut: `node .github/kontrol.js --self-test`
- Beklenen: "3/3 başarılı" veya mevcut duruma göre yeşil
- Bozuksa önce onu tamir et, sonra diğer işler

**5. 28. oturumun gündemi — Cihat'a seçenek sun:**
- **Opsiyon A:** 27'den devredilen acil işler (README markdown fix, kontrol.js entegrasyonu, PAT iptal, Vercel env kontrolü) — 1.5 saat
- **Opsiyon B:** Tablo Render Standardı denetimi (26'dan devir) — 7 sayfa × kolonlar haritası, G-06 kuralı taslak
- **Opsiyon C:** Sentry entegrasyonu (runtime hata toplama)
- **Opsiyon D:** Operasyon sayfaları bitirme (Kesim/Büküm/Markalama)
- **Opsiyon E:** Migration runner workflow + staging Supabase projesi
- **Opsiyon F:** Bucket PRIVATE geçişi (müşteri öncesi)

Detay: `CLAUDE-SONRAKI-OTURUM.md`

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

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
