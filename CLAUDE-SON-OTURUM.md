# CLAUDE — 27. Oturum Raporu (24 Nisan 2026)

> **Oturum konusu:** Yedekleme Sistemi (DB + Storage) + Migrations Altyapısı
> **Süre:** ~4.5 saat
> **Sonuç:** Büyük başarı — 2 ana altyapı taşı yerine oturdu

---

## Başlangıç Bağlamı

27. oturum, 26. oturumun kapanışından devir alındı. Başlangıçta 5 opsiyon (A-E) masadaydı: Tablo Render Standardı, G-05 CI lint, Operasyon sayfaları, Rol etiketi bug, Faz B tenant izolasyon.

**Cihat yeni bir liste getirdi** — 24.5 notu (25. oturum öncesi yan sohbetten gelen, uygulanmamış bir plan). Not 5 ana konu içeriyordu:
1. Görev sistemi sayfa görünümü
2. Sistem sağlığı 3 katman (sapma + runtime + audit)
3. **Yedekleme** (kritik, ransomware hikayesine dayalı)
4. Olması gerekenler durum değerlendirmesi
5. 26+ oturum gündem adayları

Claude'un önerisi: **3. madde — yedekleme — en kritik ve veri kaybı riski en yüksek.** Kabul edildi, oturum buraya odaklandı.

---

## Saat 1: DB Yedekleme Sistemi

### Kurulum adımları
1. `cihatoztas-ai/arespipe-backups` private repo açıldı
2. Supabase Settings → Connection String → **Session Pooler** seçildi (IPv4 uyumluluğu için, GitHub Actions IPv4 kullanır)
3. DB şifresi Cihat tarafından bulundu (kişisel not yerinden)
4. GitHub Secrets → `SUPABASE_DB_URL` eklendi (tam connection string)

### PAT drama
- İlk plan: Workflow ana `arespipe` repo'sunda, yedek yazar `arespipe-backups`'a (cross-repo için PAT gerekli)
- Alternatif fark edildi: Workflow zaten `arespipe-backups`'ta olursa PAT gerekmez (kendi repo'suna yazar)
- PAT oluşturuldu ama kullanılmadı — plan değişikliği sonrası durumu Cihat'a açıkça söylendi. Şu an boşta duruyor, 28. oturumda iptal edilecek.

### Workflow iterasyonları

**Deneme 1 — Fail (version mismatch):**
```
pg_dump: error: aborting because of server version mismatch
pg_dump: detail: server version: 17.6; pg_dump version: 16.13
```
Supabase server 17.6, Ubuntu default pg_dump 16.13. apt-get install -y postgresql-client-17 yazdık ama pin olmadığı için 16 kuruldu.

**Deneme 2 — Fail (aşırı savunmacı):**
`apt-get remove -y postgresql-client` satırı ekledik, Ubuntu "PostgreSQL version 16 is not installed" mesajı verdi, benim `if grep "17"` kontrolüm bunu fail sandı. Aslında postgresql-client-17 düzgün kuruldu ama benim script false positive verdi.

Cihat bu noktada "sıkıldım artık neden olmuyor" dedi. Kritik moment. Log'a daha dikkatli bakılınca gerçek durum netleşti: kurulum başarılı, sadece benim script aşırı katı.

**Deneme 3 — Başarılı:**
```yaml
sudo apt-get install -y postgresql-client-17
echo "/usr/lib/postgresql/17/bin" >> $GITHUB_PATH
```
Pin kaldırıldı, PATH'e explicit ekleme, basit doğrulama. Çalıştı.

### Sonuç
- **Supabase Full Backup #4** ✅ — 1m 18s
- Her gece 03:00 TR otomatik
- 30 gün rolling retention
- Manuel tetikleme (`workflow_dispatch`)

---

## Saat 2: Storage Yedeklemesi

### Durum tespiti
Cihat "ransomware hikayesi" anlatmıştı — sadece DB değil, kullanıcı yüklenmiş dosyalar da kritik.

- **1 bucket:** `arespipe-dosyalar` (**PUBLIC**, 50 MB file limit)
- **Toplam:** 23 MB (test verisi seviyesi)
- **İçerik:** tenant UUID klasörleri, spooller altında operasyon fotoğrafları (tamamla_*.png)
- **Alt klasörler:** feedback, fotograflar, notlar, spooller

### API key sistemi değişmiş
Supabase 2025-2026 arasında key sistemini yenilemiş:
- Eski: `anon` (public) + `service_role` (secret)
- Yeni: `publishable` (public) + `secret` (secret, `sb_secret_*` formatı)

Yeni `sb_secret_*` key'i `SUPABASE_SERVICE_KEY` olarak Secrets'a eklendi.

**⚠️ Açık soru:** AresPipe Vercel'de hangisini kullanıyor? Legacy (`SUPABASE_SERVICE_ROLE_KEY`) mi yeni (`sb_secret_*`) mi? 28. oturumda kontrol edilecek.

### Workflow tasarımı
Çift katmanlı yaklaşım:
1. **S3 API** (birincil) — Supabase S3-uyumlu endpoint, rclone ile bulk download
2. **Python fallback** — urllib ile HTTP API, recursive list + download

Fallback ile güvence: Supabase API değişikliklerine karşı dayanıklılık.

### İlk tam yedek (Supabase Full Backup #5)
- Süre: **2m 56s**
- Çıktı: `backups/2026-04-24_XX-XX-XX/database.sql.gz` + `storage.tar.gz`
- **İlk denemede başarılı** — karmaşık workflow için beklenmeyen başarı

---

## Saat 3: Migrations Altyapısı

### Durum tespiti
Cihat'a "SQL değişikliklerini bir yerde saklıyor musun?" sorusu: **Hayır, SQL editor'de yazıp run.**

Yani DB'nin geçmişi yok. Felaket anında yedekten dönüş çalışır, ama yeni staging ortamı kurmak veya değişiklik geçmişi takip etmek imkansız.

### Önerilen strateji
3 yaklaşım tartışıldı:
- **Sıfırdan yaz** — son 1 ay taranır, hatırlananlar yazılır (eksik kalır)
- **Schema dump** — mevcut DB'den otomatik çıkarım (baseline)
- **Karışım** — baseline + sonraki her değişiklik disiplinli migration

Seçilen: **Tam kurulum, baseline schema dump ile.**

### Schema Extraction
- Yeni tek seferlik workflow: `arespipe-backups/.github/workflows/extract-schema.yml`
- `pg_dump --schema-only` + artifact upload
- Başarılı çıktı:
  - **6029 satır, 23.6 KB**
  - **51 tablo, 85 index, 17 trigger, 18 fonksiyon, 90 RLS policy**
  - public + storage schemas
  - auth/realtime/supabase_* şemaları dahil değil (Supabase auto-create)

### Migrations Klasör Yapısı
`arespipe/` ana repo'da:
```
migrations/
├── README.md                ← Disiplin + adlandırma + kurulum sırası
└── 000_initial_schema.sql   ← Sıfır noktası (header + pg_dump)
```

README **Create file** ile yapıştırıldı — markdown format bozuldu (GitHub paste'i newline'ları siliyor). Dosya içeriği doğru, sadece render bozuk. 28. oturumda **Upload files** ile yeniden yüklenecek.

---

## Saat 4: CI Kontrolü

### Scope revize edildi
Başlangıçta "CI kuralı + migration runner" planlandı. Ama incelenince:
- **Migration runner:** Şu an staging yok, production'a risk. 28. oturuma ertelendi.
- **kontrol.js entegrasyonu:** İçerik incelenmeden dokunmak riskli, proje tarzına tam entegrasyon 45 dk ek iş. 28. oturuma ertelendi.

### Basit CI workflow
`arespipe/.github/workflows/migrations-check.yml`:
- Tetikleme: `migrations/**` path değişikliği
- 4 kontrol:
  1. `migrations/` klasörü var mı (zorunlu)
  2. Dosya adı regex `^[0-9]{3}_[a-z0-9_]+\.sql$` (fail)
  3. Sıra numarası çakışması (fail)
  4. Header yorumu ilk 10 satırda `--` (uyarı, build kırmaz)
- Özet çıktı: toplam dosya + son dosya

Yumuşak başlangıç — header kontrolü fail yerine warning. İleride güçlendirilir.

---

## Değişen/Yeni Dosyalar

### arespipe-backups repo (yeni, private)
- `.github/workflows/db-backup.yml` — DB + Storage yedek, günlük cron
- `.github/workflows/extract-schema.yml` — tek seferlik schema dump (oturum sonrası silinebilir)
- GitHub Secrets: `SUPABASE_DB_URL`, `SUPABASE_SERVICE_KEY`
- `backups/2026-04-24_*/` — ilk yedekler

### arespipe repo (ana)
- `migrations/README.md` (⚠️ render bozuk, 28'de fix)
- `migrations/000_initial_schema.sql` (baseline)
- `.github/workflows/migrations-check.yml` (CI kontrol)

### Beklemede
- PAT token `arespipe-backups-writer` — oluşturuldu, kullanılmadı, 28'de iptal

---

## Önemli Kararlar

1. **Storage & DB tek workflow'da** — Ayrı workflow yerine tek workflow, tek TIMESTAMP klasörü, tutarlı yedek.
2. **Session Pooler seçimi** — Direct Connection IPv6 only, GitHub Actions IPv4. Pooler ücretsiz IPv4 proxy.
3. **Shared Pooler kabul edildi** — Supabase paylaşımlı sistem, performans ihmal edilebilir (yedek gece çalışır, kimse canlı değil)
4. **Yedeklerde retention 30 gün** — Müşteri büyüdüğünde 14'e düşürülür
5. **Migration runner ertelendi** — Staging olmadan anlamsız, risk yüksek
6. **kontrol.js entegrasyonu ertelendi** — Basit workflow yeter, detaylı entegrasyon taze kafayla

---

## Çıkarılan Dersler

### D-27.1: Plan değişikliği erken kabul edilmeli
PAT token oluşturulup kullanılmayınca Cihat "bu ne için" diye sordu. Plan değişikliğini anında duyurmak daha iyi olurdu.

### D-27.2: Failure anında log'u oku, iyi haberi bul
Cihat "sıkıldım" dediği anda gerçek durum: kurulum başarılı, sadece script fail verdi. Paniğe katılmak yerine "iyi haber var" demek oturumu kurtardı.

### D-27.3: Uzun markdown için Upload files kullan
GitHub Create file + paste markdown'u bozuyor. Dosyayı direkt yüklemek (Upload files) formatı korur.

### D-27.4: Supabase ürün güncellemeleri takip edilmeli
API key sistem değişikliği (`publishable/secret`), IPv6-only direct connection — dashboard değişiklikleri projeyi etkileyebilir. Her oturumun ritüeline "Supabase dashboard'ta değişiklik var mı" eklenebilir mi?

### D-27.5: Yeni kritik kuralı (D-27.5): Her DB değişikliği artık migrations dosyası demek
Supabase SQL editor'de yazıp run yapmak yeterli değil. Değişiklik + migration dosyası = çift kayıt. İkisi olmadan "yapılmış" sayılmaz.

### D-27.6: Over-engineering ile future-proof arası denge
Cihat "Supabase büyürse ne olur" diye sordu. Cevap: şu an 23 MB, Pro plan $25/ay 100 GB, GitHub repo 5 GB pratik. Aşamalı strateji. **Bugün için en basit, değişim kolay olsun diye.**

### D-27.7: Kullanıcı yorgunluğunu takip et
4. saatin sonunda Cihat "teknik olarak sıkıntı yoksa devam, yorulursam kendim mola veririm" dedi. Bu tür açık iletişim değerli. Ama Claude da proaktif olmalı — scope küçültme önerisi (Aşama 4'te migration runner'ı ertelemek) bu prensibe uyuyordu.

---

## Bu Oturumda Sürülmeyen Kanallar

- **24.5 notunun diğer maddeleri** (Sentry, Uptime, Environment ayrımı, Görev sayfa görünümü, Audit Log pano, Vercel Analytics, help.html) — 28+ oturumlar
- **Migration runner workflow** — Staging Supabase projesi ile birlikte 28+
- **kontrol.js entegrasyonu** — 28
- **Legacy Supabase key temizliği** — 28
- **Bucket PRIVATE geçişi** — Müşteri öncesi
- **Tablo Render Standardı (G-06)** — 26'dan devir, müşteriden bağımsız öncelik

---

## Kapanış Notu

27. oturum, AresPipe'ın **felaket senaryolarına karşı savunması olan ilk oturumu** oldu. Bu oturumdan önce:
- DB ransomware/hesap çökmesi ile silinirse → projeyi sıfırdan kurmak zorunda
- Storage silinirse → yüklenen tüm izometri fotoğrafları kaybedilir
- Schema değişikliği geri alınamazsa → dokümantasyon yok

Bu oturumdan sonra:
- Her gece otomatik DB + Storage yedek (30 gün)
- Schema sıfır noktası kayıtlı (6029 satır)
- Migration disiplini CI ile korunuyor
- Yeni ortam kurulumu (staging) teorik olarak mümkün

Cihat'ın sabrı ve net iletişimi bu oturumun sonucuna doğrudan katkı sağladı. "Sıkıldım" anında vazgeçmemesi, "yorulursam kendim mola veririm" güveni oluşturması kritik.

Sonraki oturumda kısa bir doğrulama (yedekler alınmış mı, CI yeşil mi) ve 28. oturumun gündem seçimi gerekiyor. Detay: `CLAUDE-SONRAKI-OTURUM.md`.
