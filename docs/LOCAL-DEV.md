# Lokal Geliştirme

> AresPipe şu an klasik "klonla → `npm install` → `localhost:3000`" akışıyla geliştirilmiyor. Bu belge **mevcut gerçek akışı** ve gelecekte lokal dev server kurmak isteyen yazılımcıya **referans adımları** anlatır.

---

## 1. Mevcut Akış — Push-to-Deploy

AresPipe'ın kullanıcı deneyimi **production ve preview deploy** üzerinden test ediliyor. Bu dürüst bir tasarım kararı değil, organik bir sonuç: projenin ilk sahibi yazılımcı değil, lokal web sunucu kurmaya ihtiyaç duymadı. Akış basit ve çalışıyor.

**Bir değişiklik yapma akışı:**

1. **Düzenle** — VS Code (veya başka editör) açılır, ilgili dosya değiştirilir.
2. **GitHub'a yükle** — iki seçenek:
   - **Tek dosya:** GitHub web arayüzünde dosyaya git → kalem ikonu → yapıştır/düzenle → "Commit changes"
   - **Çoklu dosya:** ilgili klasöre git → "Add file" → "Upload files" → sürükle-bırak → "Commit changes"
3. **Otomatik deploy tetiklenir:**
   - `main` branch'e push edilmişse → **Vercel production deploy** (`arespipe.vercel.app`)
   - Pull request açılmışsa → **Vercel preview deploy** (benzersiz URL, prod'u etkilemez)
4. **Paralel olarak CI (GitHub Actions) çalışır:**
   - `kontrol.yml` — kural kontrolü (lint)
   - `docs-uret.yml` — dokümantasyon AUTO bölümü güncellemesi
5. **Commit'in altında 3 yeşil tik** bekle:
   - GitHub Actions → Kural Kontrolü ✅
   - GitHub Actions → Dokümantasyon Auto-Update ✅
   - Vercel deploy ✅
6. **Canlıda test** — ilgili sayfaya git, değişikliği gör.

### Bu Akışın Sınırları

- Hızlı döngü yok — her değişiklik bir commit + ~30-90 sn deploy.
- Debug için browser console + Vercel log'ları kullanılır (Bölüm 5).
- Veri yanlışlığı riski yüksek — production DB'de test ediliyor. 33. oturumda **staging Supabase projesi** kurulacak, o zamana kadar ölümcül UPDATE/DELETE sorgularından kaçınılmalıdır.

---

## 2. Asgari Ortam Kurulumu (Mac)

Lokal dev server kurulmasa da bir sürü iş Mac'te yapılıyor:

| Araç | Neden Gerekli | Kurulum |
|---|---|---|
| **Git** | Repo ile çalışmak | `xcode-select --install` (Xcode Command Line Tools yeterli) |
| **Node.js 20+** | CI self-test, docs-uret scripti | https://nodejs.org (LTS) veya `brew install node` |
| **Editör** | Dosya düzenlemek | VS Code önerilen (GitHub Copilot + yerleşik git) |
| **GitHub hesabı** | Repo push/pull yetkisi | cihatoztas-ai/arespipe repo'suna collaborator olmalı |
| **Vercel hesabı** | Deploy log, env var | Project owner olarak bağlı |
| **Supabase hesabı** | DB, Auth, Storage | Production projesinin sahibi/admin |
| **Anthropic API key** | İzometri-oku endpoint'i (opsiyonel) | Sadece AI okuma testi gerekiyorsa |

### İlk Kurulum Komutları

```
cd ~/Desktop
git clone https://github.com/cihatoztas-ai/arespipe.git
cd arespipe
```

Not: `npm install` kökte **çalışmaz** çünkü kökte bir `package.json` yok (kök bir web projesi değil, statik HTML + serverless). `mobile/` klasöründe React projesi var, o ayrı (Bölüm 6).

---

## 3. Lokal Mac'te Çalışan Şeyler

### Git Operasyonları
Standart: `git pull`, `git status`, `git log`, `git diff`. Branch çalışması için `git checkout -b yeni-dal`, yine de genelde `main` üzerinden çalışılıyor.

### CI Self-Test
Lokal Mac'te kural kontrolünü çalıştır:
```
node .github/kontrol.js --self-test
```
Bu, `beklenen-hatalar.json` ile `bozuk-ornekler/` klasöründeki dosyaları eşleştirir. Self-test kırılırsa yeni eklenen bir kural ya da regex bozuk demektir — push etmeden önce düzelt.

### Dokümantasyon Üretici
AUTO bölümlerin lokal'de güncellendiğini görmek için:
```
node .github/docs-uret.js
```
Rapor çıktısı verir, hangi dosyada ne güncellendi. Aynı script workflow'da her push'ta çalışıyor.

### Migration Çalıştırma
`migrations/NNN_aciklama.sql` dosyası önce Supabase SQL Editor'de koşturulur, **sonra** aynı içerik migration dosyası olarak repo'ya eklenir. Kural: DB'de değişiklik = migrations dosyası (27. oturum disiplini).

### Markdown Düzenleme
Tüm `.md` dosyaları editörde normal metin. GitHub tarafında render edilir.

---

## 4. Lokal Mac'te **Çalışmayan** Şeyler

### Web Sunucu (HTML Sayfaları)
`index.html`, `panel.html` vs. statik HTML ama **Supabase URL + anon key environment variable'dan okunuyor**. Lokal'de env yok → bağlantı kurulamaz. `python -m http.server` veya VS Code Live Server sayfayı açar ama boş ekran veya "undefined" hatası verir.

### API Endpoint'leri
`api/izometri-oku.js` ve `api/sorgula.js` **Vercel Serverless Function** — Node runtime, Vercel'in sunucusunda çalışır. Lokal'de test için `vercel dev` CLI gerekir, denenmedi.

### Mobil React Uygulaması
`mobile/` klasörü ayrı bir Vite projesi. Teorik olarak `cd mobile && npm install && npm run dev` çalışması gerekir ama **şu an %5'te** (iki ekran var: MGiris, MAnasayfa), tam kurulum 35+ oturumlarda.

### Full Stack Test
Web + API + DB birlikte — sadece Vercel deploy'dan sonra.

---

## 5. Debug Nereden Bakılır

Bir şey kırıldığında nereye bakmak gerektiğini bilmek, lokal dev olmamasının büyük bedelini hafifletir.

| Belirti | Nereye Bak |
|---|---|
| Sayfa yüklenmiyor, boş ekran | **Browser Console** (F12 → Console). JS hatası burada. |
| API 500 dönüyor | **Vercel Dashboard** → proje → Deployments → ilgili deploy → "Logs" sekmesi. Endpoint çağrısı hata stack trace ile burada. |
| DB sorgusu başarısız | **Supabase Dashboard** → Logs → "API Logs" veya "Postgres Logs". RLS hatası, syntax hatası, constraint violation — hepsi burada. |
| Bir CI kuralı kırılmış | **GitHub Actions** → ilgili run → Summary. Kural kodu (örn. `YAP_03`, `I18N_02`), dosya yolu, satır numarası. |
| CI son genel durum | Repo kökünde **`.github/ci-son-rapor.json`** — her push'ta güncellenen makine-okunabilir rapor. |
| Vercel deploy kırılmış | **Vercel Dashboard** → Deployments → kırmızı deploy → "Build Logs". Build hatası (TypeScript, import) burada. |
| Auth kırılmış | **Supabase Dashboard** → Authentication → Users. Kullanıcı var mı, session aktif mi. |

### Browser Console Tipik Çıktılar
- **"Failed to fetch"** → CORS veya network. Vercel URL'i env'de doğru mu kontrol.
- **"RLS policy violation"** → Supabase'de tenant_id doğru ayarlanmamış. Auth context'e bak.
- **"Uncaught ReferenceError: ARES is not defined"** → `assets/ares.js` ilk yüklenmemiş, script sırası bozuk.

---

## 6. İleride — Gerçek Lokal Dev Server Kurmak İsteyene

Yeni yazılımcı geldiğinde bu bölüm başlangıç noktası olacak. Şu an test edilmemiş, **gerektiğinde canlı doğrulanacak referans adımlar.**

### 6.1 Frontend (HTML)
HTML sayfalar statik. Supabase bağlantısı runtime'da `window.SUPABASE_URL` + `window.SUPABASE_ANON_KEY` üzerinden kuruluyor — bu değerler şu an hardcoded mu yoksa Vercel inject mi ediyor, **doğrulanması gerek.** İlk iş `assets/supabase-init.js` dosyasına bakmak.

Eğer env'den okunuyorsa lokal dev için:
```
cd ~/Desktop/arespipe
python -m http.server 8000
```
Ve `localhost:8000/index.html` — ama bağlantı gelmezse env enjeksiyonu lokalde yeniden kurulmalı (küçük bir Node server + env okuma scripti).

### 6.2 API Endpoint'leri
Vercel CLI kullanılır:
```
npm install -g vercel
cd ~/Desktop/arespipe
vercel login
vercel link        # proje bağlantısı
vercel env pull    # production env'i .env.local'e çek
vercel dev         # localhost:3000'de API + static serve
```
`.env.local` dosyası **asla commit edilmemeli** (`.gitignore`'a ekli olduğundan emin ol).

### 6.3 Mobil React
```
cd ~/Desktop/arespipe/mobile
npm install
npm run dev        # Vite server 5173'te açılır
```
`.env.local` Supabase URL + anon key gerekli, `mobile/.env.example` varsa şablon olarak kullan.

### 6.4 Veritabanı
**Şu an production DB'ye bağlanır.** Bu tehlikeli — lokalde yanlış DELETE gerçek müşteri verisini siler. **33. oturumda staging Supabase projesi** kurulacak; o zamana kadar:
- Sadece SELECT sorguları lokalde güvenli.
- UPDATE/DELETE/INSERT test ederken tenant_id'yi kendi test tenant'ına sabitle.
- Büyük değişiklik testleri Supabase SQL Editor'de BEGIN/ROLLBACK ile yapılsın.

### 6.5 Yedek Alma
Repo ayrı: `cihatoztas-ai/arespipe-backups` (private). Otomatik her gece 03:00 TR. Manuel tetikleme: Actions → "Supabase Full Backup" → Run workflow. 30 günlük retention.

---

## Ekler

### Environment Variables Referansı

Production'da (Vercel Dashboard → Settings → Environment Variables):

| Variable | Durum | Kullanım |
|---|---|---|
| `SUPABASE_URL` | Plaintext | URL zaten public bilgi |
| `SUPABASE_SERVICE_KEY` | 🔒 Sensitive | Server-side DB erişimi (api/sorgula.js) |
| `ANTHROPIC_API_KEY` | 🔒 Sensitive | AI izometri okuma (api/izometri-oku.js) |

⚠️ Sensitive variable'lar Vercel Development ortamında **kilitli** — `vercel dev` kullanırsa `.env.local` dosyasına elle girilmeli.

### Yararlı Linkler

- Repo: https://github.com/cihatoztas-ai/arespipe
- Vercel Dashboard: https://vercel.com/cihatoztas-ais-projects/arespipe
- Supabase Dashboard: https://supabase.com/dashboard/project/[proje-id]
- GitHub Actions: https://github.com/cihatoztas-ai/arespipe/actions
- Backup repo: https://github.com/cihatoztas-ai/arespipe-backups (private)

---

_Son güncelleme: 24 Nisan 2026 (29. oturum). Bu belge manuel — auto-update yok. Staging DB (33. oturum) ve full local dev denemesi yapıldığında güncellenecek._
