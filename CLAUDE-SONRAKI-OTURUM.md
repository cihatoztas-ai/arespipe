# CLAUDE — Sonraki Oturum Gündemi (28. oturum)

> **Tarih:** Belirsiz (27. oturumdan sonra, 24 Nisan 2026 bu oturum)
> **Tema:** Temiz kafa gereken işler — entegrasyon + detay + karar

---

## ⚠️ Oturum Başı ZORUNLU

### 1. Oturum Ritüeli
```
cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
```
+ GitHub Actions yeşil mi
+ `arespipe-backups/backups/` klasöründe yeni yedekler var mı (**bu önemli** — 27'de kurulum yapıldı, ertesi gece otomatik yedek alınmış olmalı)

### 2. `docs/CIHAT-PROFIL.md` oku

### 3. 🚨 Self-Test KOŞTUR
- Son self-test: 23. oturum
- Şimdi 28. oturum → **5 oturum geçti**, kural disiplini zorunlu
- Komut: `node .github/kontrol.js --self-test`
- Beklenen: 3/3 başarılı (veya mevcut kural sayısına göre hepsi yeşil)
- **Başarısızsa önce onu düzelt, sonra diğer işler**

---

## Seçim: 28. Oturum Odağı (A-F arası)

### A. 27'den Devredilen Temizlik İşleri (1.5 saat)
Acil ve küçük — önce bunları bitirmek iyi bir başlangıç.

1. **Migrations README markdown fix** (15 dk)
   - `migrations/README.md` GitHub render'ında bozuk
   - Çözüm: Mevcut dosyayı sil, **Upload files** ile yeniden yükle (paste yapmadan)
   - Kaynak dosya Claude artifact'ında hâlâ var

2. **PAT token iptali** (2 dk)
   - `https://github.com/settings/personal-access-tokens`
   - `arespipe-backups-writer` → Delete
   - 27'de oluşturuldu, kullanılmadı

3. **Vercel env kontrolü** (15 dk)
   - Aç: `https://vercel.com/dashboard` → arespipe → Settings → Environment Variables
   - İsim listesi al (değerler değil, sadece isimler)
   - Supabase key'lerinin formatını belirle:
     - Eski: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (JWT, `eyJ...` formatı)
     - Yeni: `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (`sb_*` formatı)
   - Karar:
     - Legacy kullanıyorsa → yeni formata geçiş planla (ayrı oturum)
     - Yeni kullanıyorsa → işlem yok

4. **kontrol.js entegrasyonu** (45 dk)
   - `migrations-check.yml` ayrı workflow olarak duruyor
   - Proje tarzı: `kurallar.json` + `kontrol.js` + `bozuk-ornekler/` + self-test
   - Yapılacaklar:
     - `kontrol.js`'i oku, mevcut kural pattern'ini anla
     - `M-01: Migration Adlandırma` kuralı ekle (regex NNN_*.sql)
     - `M-02: Migration Sıra Çakışması` kuralı ekle (duplicate numara)
     - `bozuk-ornekler/` altına ihlal eden test dosyaları
     - `beklenen-hatalar.json` güncelle
     - Self-test koştur, hepsi yeşil bekleniyor

5. **Vercel Analytics eklemek** (15 dk, kolay)
   - 24.5 notunun küçük ama değerli maddesi
   - `arespipe` repo → Vercel dashboard → Analytics → Enable

### B. Tablo Render Standardı (G-06) — 26'dan Devredilen Ana İş (3-4 saat)
Cihat'ın orijinal 27. oturum hedefi, yedekleme öne geçti. Şimdi olgun bir denetim yapılabilir.

**Kapsam:**
- 7 sayfa × kolonlar haritası çıkar
- Spool no: mono font, bold, `--ac` mavi (4 sayfada farklı)
- Tarih: tek format standardı
- Tersane adı, proje no, durum pill — standardize
- İş planı: denetim raporu → `ares-render.js` helper → sayfa dönüşümü
- G-06 kural taslağı

### C. Sentry Entegrasyonu (2 saat)
Müşteri öncesi zorunlu. Runtime hata toplama.
- Sentry hesap aç (free tier, 5000 hata/ay)
- `<script>` tag HTML'lere
- Pano'ya yeni kart: "Son 7 Gün Hataları: N"
- 24.5 notundan

### D. Operasyon Sayfaları %100 (2-3 saat)
Kesim / Büküm / Markalama eksikleri bitirme. Orta öncelik, teknik borç.

### E. Migration Runner Workflow + Staging (2-3 saat)
Staging Supabase projesi aç + migration runner workflow. Gerçek kullanım: staging'e migration'ları sırayla uygula. Uzun vadeli değer ama şu an staging ihtiyacı düşük.

### F. Bucket PRIVATE Geçişi (1-1.5 saat)
`arespipe-dosyalar` bucket şu an PUBLIC. İçinde müşteri verisi olduğunda özel olmalı. Müşteri öncesi yapılacak ama teknik olarak şimdi de yapılabilir (izometri URL'lerini signed URL'e geçirmek kod değişikliği gerektirir).

---

## Önerim

**Opsiyon A** ile başla — küçük, acil, tamamlanması zevkli. 1.5 saat, oturum ısınır, sonra Cihat karar verebilir ikinci iş için.

Özellikle **kontrol.js entegrasyonu** teknik borcu azaltır — `migrations-check.yml` ayrı durmaz, ana sistem içine girer. Proje disiplinine tam uyum.

Opsiyon A biterse kalan zamanda:
- **Cihat seçer** — B (render), C (Sentry), D (operasyon), E (staging), F (bucket private)
- Hepsi değerli, biri diğerinden üstün değil

---

## 24.5 Notunun Durumu

27. oturum kapanışında:

✅ **Tamamlanan:**
- Yedekleme Katman 1 (DB + Storage, her gece)
- Migrations klasörü (baseline + CI)

⏳ **Kalan (28+ oturumlar):**
- Sentry (runtime hata) — Opsiyon C
- Uptime monitör (Better Stack) — 30 dk'lık kolay iş
- Environment ayrımı (dev/prod) — Opsiyon E ile birlikte
- Görev sistemi sayfa görünümü (panel_gorevler.ilgili_sayfalar)
- Audit Log pano sekmesi
- Vercel Analytics — Opsiyon A'ya dahil
- help.html son kullanıcı dokümantasyonu

---

## Bekleyen Büyük Konular (27. oturum öncesinden)

- **Tablo Render Standardı (G-06)** — Opsiyon B
- **Operasyon sayfaları %100** — Opsiyon D
- **Profil in-app edit** (Pano'dan CIHAT-PROFIL.md) — 24'ten borç
- **G-05 CI lint kuralı** — `.mb-*` hardcode yasağı
- **Rol etiketi küçük harf bug'ı** — hangi ekranda netleşince

---

## Yedek Sistem Doğrulama (Oturum başında 5 dk)

Bu oturum yedek kurulduğundan 1+ gün sonra olacak. Kontroller:

1. **Yedek klasörü büyüdü mü?**
   ```
   https://github.com/cihatoztas-ai/arespipe-backups/tree/main/backups
   ```
   - Olması gereken: En az 1 yeni TIMESTAMP klasörü (27'de manuel aldığımız + ertesi gün otomatik)

2. **Dosya boyutları anlamlı mı?**
   - `database.sql.gz` — birkaç yüz KB
   - `storage.tar.gz` — ~23 MB civarı (artıyor olabilir)

3. **Cron saatinde çalıştı mı?**
   - Actions → Supabase Full Backup → #6 veya sonrası
   - Başlama zamanı: UTC 00:00 civarı (03:00 TR)

**Sorun varsa** 28. oturumun ilk önceliği cron debug olur.

---

## Kritik Hatırlatmalar

- ⚠️ **Her DB değişikliği = migrations dosyası** (27'de eklenen disiplin)
- ⚠️ **Self-test her 5 oturumda bir** (23 → 28 → 33 → ...)
- ⚠️ **"Hatırlıyorum" deme, dosyaya bak**
- ⚠️ **Uzun markdown için Upload files kullan** (Create+paste bozar)
- ⚠️ **Plan değişikliği anında söyle**

---

_Bu dosya 28. oturumun başında Cihat tarafından okunacak veya referans alınacak._
_Son güncelleme: 27. oturum kapanışı (24 Nisan 2026)_
