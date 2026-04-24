# CLAUDE — 30. Oturum Gündemi

**Tema:** Bucket PRIVATE Geçişi + Signed URL Altyapısı
**Tahmini süre:** 3-4 saat
**Öncelik:** 🔴 Yüksek (müşteri öncesi KRİTİK güvenlik)
**Durum:** 28. oturum sonunda onaylandı, plan net

---

## 🎯 Bu Oturumun Amacı

`arespipe-dosyalar` Supabase Storage bucket'ı şu an **PUBLIC** — URL'i bilen herkes (veya guess eden saldırgan) her tenant'ın her dosyasına (izometri PDF'leri, spool fotoğrafları, kalite kontrol resimleri) erişebilir. Multi-tenant izolasyonunun **en büyük açığı.**

Bu oturumda:
1. Bucket'ı PRIVATE'a çeviriyoruz
2. Dosyalara erişim için **signed URL (imzalı link)** sistemi kuruyoruz — yetkili kullanıcı kendi tenant'ının dosyasına süre-sınırlı link alır
3. Frontend'deki mevcut `dosya_url` doğrudan kullanımlarını signed URL akışına taşıyoruz

Sonuç: B firmasının kullanıcısı A firmasının dosyasına **hiçbir yoldan erişemez.**

---

## 📐 Mimari — Mevcut vs Hedef

### Mevcut (tehlikeli)

```
Kullanıcı → Sayfa → DB'den dosya_url oku → <img src="https://...supabase.co/storage/v1/object/public/..."> render
```

- `dosya_url` sütununda public URL saklanıyor
- URL'i ele geçiren herkes (ekran görüntüsü, log, network sniff) erişir
- Tenant izolasyonu SIFIR

### Hedef

```
Kullanıcı → Sayfa → DB'den dosya_url (veya yol) oku
         → /api/dosya-url-al endpoint'ini çağır
            → API: yetki kontrolü (kullanıcının tenant'ı mı?)
            → API: Supabase signed URL üret (1 saat geçerli)
            → API: signed URL geri döner
         → <img src="https://...?token=<imza>"> render
```

- Bucket PRIVATE, public URL çalışmaz
- Her dosya erişimi yetki kontrolünden geçer
- URL saatlik süre doluyor, paylaşım/sızıntı riski sınırlı

---

## 📋 Planlanan 5 Adımlı Akış

### Faz 1 — Envanter ve Risk Analizi (~30 dk)
- [ ] Git pull + ritüel + profil oku
- [ ] Supabase Dashboard → Storage → `arespipe-dosyalar` bucket'ına bak
  - Kaç dosya var (yaklaşık)
  - Toplam boyut
  - Yol yapısı (tenant_id/alt_kategori/... mı, karışık mı)
- [ ] `fotograflar` + başka tablolardaki `dosya_url` kullanımını çıkar
  - Kaç kayıt, hangi tablolar (muhtemelen `fotograflar`, belki başkası)
- [ ] Frontend'de `dosya_url` kullanımını tara
  - `grep -r "dosya_url" --include="*.html" --include="*.js"` (Mac'te)
  - Muhtemelen sayfalar: spool_detay, devre_detay, kesim, büküm, markalama, kalite_kontrol, sevkiyat
- [ ] Cihat'a rapor: kaç dosya, kaç sayfa dokunulacak, risk seviyesi

### Faz 2 — Signed URL API Endpoint (~45 dk)
- [ ] `api/dosya-url-al.js` yaz:
  - Input: `{ yol: string, tenant_id: string }` (POST)
  - Yetki: yoldaki tenant_id, body'deki tenant_id ile eşleşmeli
  - Çağrı: `supabase.storage.from('arespipe-dosyalar').createSignedUrl(yol, 3600)` (1 saat)
  - Çıktı: `{ signedUrl: string, expiresAt: timestamp }`
- [ ] Dosya yorumu şablona uygun (3-satır header)
- [ ] Hata durumları:
  - `tenant_id` yok → 400
  - Cross-tenant istek → 403
  - Dosya yok → 404
  - Supabase hata → 500 + log
- [ ] Sandbox'ta test — curl ile başarı + 3 başarısız case

### Faz 3 — Bucket PRIVATE Geçişi (~15 dk, önce staging gibi bir deneme)
- [ ] **⚠️ RİSKLİ ADIM** — Bucket'ı PRIVATE yapınca tüm mevcut dosya URL'leri anında kırılır. Öneri sıra:
  1. Önce API endpoint canlıda test
  2. Bir-iki sayfada frontend entegrasyonunu tamamla, kontrol et
  3. Sonra bucket PRIVATE'a çevir
  4. Kalan sayfalarda kırık URL'leri sırayla onar
- [ ] Alternatif güvenli yol: feature flag ile geçici bypass — A testi sırasında diğer sayfalar hâlâ public URL kullanır
- [ ] Karar 30'un başında verilecek (Cihat ile)

### Faz 4 — Frontend Migration (~90 dk)
- [ ] Bir "dosyaUrlAl(yol)" helper fonksiyonu yaz (muhtemelen `assets/ares.js` altına)
  - Dahili cache (1 saat TTL, aynı dosyayı tekrar tekrar isteme)
  - Hata durumunda placeholder dön
- [ ] Sayfa sayfa migration:
  - **İlk:** `spool_detay.html` (en çok foto kullanılan) — test sonrası yaygınlaştır
  - Sonra: `devre_detay.html`, `kesim.html`, `bukum.html`, `markalama.html`, `kalite_kontrol.html`, `sevkiyatlar.html`
  - Mobil: `mobile/src/screens/*` — fotoğraf gösteren component'ler
- [ ] Her sayfa migration sonrası tarayıcıda gözle doğrula

### Faz 5 — Test (~30 dk)
- [ ] **Pozitif test:** Kendi tenant'ının dosyasına eriş — yeşil
- [ ] **Negatif test:** İki tarayıcı aç, biri A firması biri B firması, A'nın dosyasının yolunu B'nin API çağrısında dene → 403 beklenen
- [ ] **Expiration test:** Signed URL al, 1 saat sonra dene → artık çalışmamalı
- [ ] **Cache test:** Aynı dosyayı 2 kez iste, 2. sefer API çağrısı gitmemeli (cache)

### Faz 6 — Kapanış (~15 dk)
- [ ] `son-durum.md` güncelle, 31. oturum → Sentry
- [ ] `CLAUDE-SON-OTURUM.md` raporla
- [ ] `CLAUDE-SONRAKI-OTURUM.md` (31. için — Sentry)

---

## ❓ Cihat'tan Faz 1 Başında Alınacak Cevaplar

### Soru 1 — Bucket Yol Yapısı Bilinen mi?

Şu anki dosyaların yolu nasıl:
- (a) `tenant_id/spooller/spool_id/...` gibi tenant-prefixed
- (b) `spool_id/...` gibi tenant-yoksun (eski kayıtlar)
- (c) Karışık — bazıları (a), bazıları (b)

**Neye etki ediyor:** Cross-tenant check'i yol analizinden yapacaksak, (a) gerekli. (b) veya (c) varsa önce veri migration.

**Tahmin:** 6. oturumda tenant prefix sistemi eklendi ama Storage yol yapısı ayrı bir karar. Muhtemelen (c) — yeni yüklemeler (a), eski kayıtlar (b).

### Soru 2 — Geçiş Stili: Big Bang mı Aşamalı mı?

- (a) Big bang — bucket bir anda PRIVATE, tüm sayfalar aynı anda yeni API kullanmalı (1 güçlü push)
- (b) Aşamalı — feature flag ile sayfa sayfa geçiş, eski sayfalar bir süre hâlâ public URL kullanır

**Trade-off:** (a) hızlı ama kırılma riski yüksek; (b) güvenli ama 2 hafta boyunca yarı-güvenli

**Tahmin:** (b) daha sağlıklı — 28'in "sandbox + aşamalı" dersi burada da geçerli.

### Soru 3 — Mobil Uygulama?

Mobil `mobile/` altında bazı ekranlar foto kullanıyor mu şu an? Eğer kullanıyorsa web ile aynı API çağrısını yapabilmeliler.

**Neye etki ediyor:** API endpoint'inin CORS ayarı (mobil domain farklı), ve mobil React ekranlarında da `dosyaUrlAl(yol)` helper'ı çağrılmalı.

---

## ⚠️ Potansiyel Riskler ve Kaçınma

### Risk 1 — Mevcut Dosya URL'leri Bozulur
Bucket PRIVATE olduğu anda DB'deki tüm `dosya_url`'ler 403 verir. Tüm sayfalarda foto kırık görünür.

**Çözüm:** Aşamalı geçiş (Soru 2 (b)) + frontend migration önce, bucket değişikliği sonra.

### Risk 2 — Signed URL API Endpoint Sızıntısı
API çağrı endpoint'ine kimlik doğrulama yoksa, kullanıcı diğer tenant'ların dosya yollarını tarayarak bypass edebilir.

**Çözüm:** `tenant_id` mutlaka JWT'den okunmalı (body'den değil). Şu an body'den alıyoruz — 30. oturumda JWT-bazlı auth'a geçiş.

### Risk 3 — Performance Darboğazı
Her dosya isteği için API'ye çağrı → yavaşlık.

**Çözüm:** Frontend'de cache (1 saat TTL), batch API (birden fazla yol tek çağrıda).

### Risk 4 — Veri Kaybı
Yeni sistem kırılırsa eski sistem de PRIVATE → tamamen erişim yok.

**Çözüm:** Bucket'ı PRIVATE yapmadan önce **veri yedeği** (bucket'ın tam kopyası) yerel veya ayrı bir güvenli bucket'ta saklanmalı. Rollback senaryosu hazır olmalı.

---

## 📊 Başarı Kriterleri (30 Sonu)

- [ ] `arespipe-dosyalar` bucket'ı PRIVATE
- [ ] `api/dosya-url-al.js` canlıda, pozitif + negatif test geçti
- [ ] Web tüm sayfalarda foto gösterimi çalışıyor (signed URL ile)
- [ ] Mobil (varsa foto kullanan ekran) çalışıyor
- [ ] Cross-tenant erişim denemesi 403 dönüyor
- [ ] CI hâlâ yeşil, self-test (33'te zaten koşacak) bozulmadı
- [ ] son-durum.md güncel, 31. oturum planı hazır

---

## 🔗 31-34 Oturum Bağlantısı (Hatırlatma)

| Oturum | Tema |
|---|---|
| **30** | **Bucket PRIVATE (bu oturum)** |
| 31 | Sentry entegrasyonu (observability) |
| 32 | Email sistemi (iletişim) |
| 33 | Staging Supabase + migration runner |
| 34 | Tenant izolasyon testleri + feature flag |

35'ten itibaren: Tablo Render Standardı, operasyon sayfaları, mobil, Spool AI döngüsü.

---

## 🎯 Oturum İçi Disiplin (Cihat'ın Profiline Göre)

- **Mockup-first** (R-10 uygulanır, sandbox'ta test sonra yaygınlaştır)
- **Komutları birer birer**, açıklamalı
- **Sandbox testi olmadan paylaşma** (28. + 29. oturumun dersi tekrar tekrar)
- **Plan değişikliğinde dur, sor, onaylat** (27. oturumun dersi)
- **Failure anında log oku, iyi haberi bul** (27. oturumun dersi)
- **CI auto-commit kullanırsa rebase retry pattern'i uygula** (29. oturumun dersi)
- **Belgelemeyi ihmal etme** — 29'da kurduğumuz hibrit dokümantasyon, 30'un değişiklikleri için `docs/DATABASE.md` + `docs/API.md`'ye otomatik yansır

---

## 📌 Ek Borçlar Hatırlatması (30'un gündemi değil ama unutulmasın)

- 🟢 **Fotoğraf/belge yaşam döngüsü** — Cihat 29'un sonunda sordu. Aktif devre → gerçek boyut, arşivlenen proje → sıkıştırılmış. Mekanizma henüz yok. 30-34 aralığının birinde ele alınacak (muhtemelen 30 ile birlikte çünkü Storage dokunulacak, ya da 33 ile çünkü lifecycle).
- 🟡 Vercel `ci-son-rapor.json` auto-commit Vercel'i tetiklemesin (ignored build step)
- 🟡 `actions/checkout@v4` + `setup-node@v4` v5 geçişi
- 🟡 Supabase `arespipe-dev` projesi incelemesi (canlı kullanımı var mı?)

---

**29. oturum sonu, 24 Nisan 2026.** 30 için her şey hazır. Cihat ertesi gün geldiğinde ritüelden sonra direkt Faz 1 (envanter) ile başlayacak.
