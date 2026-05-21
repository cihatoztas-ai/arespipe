# Mimari

> AresPipe'ın **nasıl** çalıştığını değil, **niye** böyle çalıştığını anlatan belge. Teknik dokümantasyon (DATABASE/API/LOCAL-DEV) "ne yapılır"ı gösterir; bu belge "niye bu şekilde" sorusuna cevap verir. Yeni yazılımcı sistemi yargılamadan önce bu belgeyi okumalı.

---

## 1. AresPipe Nedir — Problem ve Çözüm

AresPipe bir **tersane boru imalat takip sistemi**. Gemilerde tonlarca farklı boru demeti (spool) üretilir; her biri kesim → büküm → markalama → kalite kontrol → sevkiyat aşamalarından geçer. Her gemi farklı projelerde farklı pipeline'lar içerir, her pipeline onlarca spool, her spool onlarca parça (boru, dirsek, flanş).

**Sektörün şu anki durumu:** bu süreç **kağıt ve Excel ile takip ediliyor**. Hangi spool'un hangi aşamada olduğu, operatörün ne yapması gerektiği, hata olduğunda kime sorulacağı belirsiz. Bilgi ustanın kafasında, ustanın vardiyasında. Hata oluyor — yanlış parça kesiliyor, dosyada olmayan ama sahada imal edilmiş parça oluyor, ya da tam tersi.

**AresPipe'ın çözümü:** zinciri dijitalleştirir.

- Operatör tablette QR kodu okutur, sistem ona ne yapacağını söyler.
- Her işlem atomik olarak kaydedilir (zaman, personel, sonuç, foto).
- Yönetici canlı rapor görür: hangi spool hangi aşamada, kaç tane gecikti, kim çalışıyor.
- Müşteri (armatör) kendi projesinin ilerlemesini izleyebilir (ileride).
- Kalite hataları kayıtlıdır, sonraki projede referans alınır.

**Uzun vade — SaaS:** aynı sistem birden fazla tersane için çalışır. Multi-tenant mimari (Bölüm 5). Her tersane kendi verisini görür, birbirleriyle karışmaz. İlk müşteri kullanıyor, altyapı olgunlaştıkça (30-34 oturum planı) diğer tersanelere satılacak.

---

## 2. Yüksek-Seviye Diyagram

```
┌────────────────────────────────────────────────────────────────┐
│                     KULLANICI                                  │
│  (Operatör tablet · Yönetici masaüstü · Süper admin panel)     │
└──────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                   FRONTEND KATMANI                             │
│                                                                │
│   ┌─────────────────────┐     ┌───────────────────────────┐    │
│   │ Statik HTML (40+)   │     │ Mobile React (mobile/)    │    │
│   │ index, panel,       │     │ MGiris, MAnasayfa,        │    │
│   │ tanimlar, kesim...  │     │ MIslemler (%5 başladı)    │    │
│   │                     │     │                           │    │
│   │ + assets/ares.js    │     │ + lib/supabase, yetki,    │    │
│   │   (ARES global ns)  │     │   tema, i18n              │    │
│   └─────────────────────┘     └───────────────────────────┘    │
│                                                                │
│   Vercel CDN · arespipe.vercel.app · Dark / Light tema · i18n  │
└──────────────┬────────────────────────────────────┬────────────┘
               │ Supabase JS Client                 │ fetch()
               │ (auth + RLS filtered queries)      │
               ▼                                    ▼
┌──────────────────────────────┐     ┌──────────────────────────┐
│     SUPABASE BACKEND         │     │   API KATMANI            │
│                              │     │  (Vercel Serverless)     │
│  ┌────────────────────────┐  │     │                          │
│  │ PostgreSQL (Nano)      │  │     │  api/sorgula.js          │
│  │ • 51 tablo             │  │     │  (doğal dil → SQL)       │
│  │ • RLS multi-tenant     │  │     │                          │
│  │ • tenant_id her satır  │  │     │  api/izometri-oku.js     │
│  └────────────────────────┘  │     │  (PDF → Claude API →     │
│                              │     │   spool JSON)            │
│  ┌────────────────────────┐  │     │                          │
│  │ Auth (JWT)             │  │◄────┤  SUPABASE_SERVICE_KEY    │
│  │ Storage (PDF, foto)    │  │     │  ANTHROPIC_API_KEY       │
│  └────────────────────────┘  │     │  (🔒 Sensitive env)      │
└──────────────────────────────┘     └──────────────────────────┘
               │
               │ pg_dump · her gece 03:00 TR
               ▼
┌────────────────────────────────────────────────────────────────┐
│          YEDEKLEME (cihatoztas-ai/arespipe-backups)            │
│   database.sql.gz + storage.tar.gz · 30 gün retention          │
└────────────────────────────────────────────────────────────────┘

                             │
                    ─── paralel ───
                             │
┌────────────────────────────┴───────────────────────────────────┐
│              CI / CD (GitHub Actions)                          │
│                                                                │
│  kontrol.yml  → kontrol.js  → 15 kural · self-test · rapor     │
│  docs-uret.yml → docs-uret.js → AUTO markdown güncelleme       │
│                                                                │
│         Her push · ~7-10 saniye · auto-commit [skip ci]        │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Katmanı

### Statik HTML Yaklaşımı (Web)

AresPipe'ın web'i **bir Single Page Application değil** — her sayfa bağımsız bir `.html` dosyası, ayrı yüklenir, ayrı render edilir. Bu bilinçli bir karar:

- **Debug kolay** — bir sayfa kırılırsa sadece o sayfa etkilenir, diğerleri çalışmaya devam.
- **Build yok** — değişiklik yap, push at, 30 saniyede canlı.
- **Hafif** — React bundle yok, ilk yükleme 100-200 KB seviyesinde.
- **Tarihsel sebep** — projeye başlarken SPA karmaşası göze alınmadı, organik büyüdü.

**Dezavantaj:** sayfalar arası navigasyonda tam refresh olur. Sonsuz scroll, canlı bildirim, karmaşık state yönetimi — bunlar için doğru araç değil. Şu anki kullanım senaryosu (tablet başında tek işlem) için uygun.

### `ARES` Global Namespace

`assets/ares.js` tüm sayfalarda ilk yüklenen script. İçinde:

```js
ARES.supabase()          // Supabase client (singleton)
ARES.kullanici()         // Mevcut login user (cached)
ARES.sayfaYetkiKontrol([roller])  // Sayfa yetki gate'i
ARES.bildirim(mesaj, tip) // Toast notification
ARES.tv(anahtar, fallback)        // i18n çeviri fonksiyonu
// ... ve ~20 başka helper
```

Her sayfa başında:
```html
<script src="/assets/ares.js"></script>
<script>
  ARES.sayfaYetkiKontrol(['yonetici', 'super_admin']);
</script>
```

### Mobile React (mobile/)

`mobile/` klasörü ayrı bir Vite projesi — React + React Router + Supabase JS. Tablet/telefon için optimize edilmiş, operatörün sahada kullanacağı ekranlar.

**Şu anki durum:** %5. İki ekran yazıldı (`MGiris`, `MAnasayfa`), altyapı hazır:
- i18n (`lib/i18n.jsx` + `tv()` — R-08 kuralı, `m_*` anahtarlar)
- Tema yönetimi (`lib/tema.jsx` — R-09 kuralı, dark/light-anthracite)
- Yetki sistemi (`lib/yetki.js` — grup/blok, role-bazlı yönlendirme)
- Supabase client (`lib/supabase.js`)

**Kalan ekranlar:** MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara — 35+ oturumlarda ürün dönemi başlayınca.

### Tasarım Sistemi

- **Font:** Barlow Condensed (başlıklar) + Inter (gövde).
- **Renk:** CSS değişkenleri `--ac` (accent), `--bg`, `--fg`, `--muted` vb. Hardcode hex/rgba yasak — CI kuralı **G03_HAM_HEX** uyarı verir.
- **Componentler:** Hero+Pill kartlar (G-02), modal pattern (`spool_detay.html`), tab yapısı (`tanimlar.html`). Standartlar oturumlar boyunca birikmiş.

### i18n ve Tema

- Üç dil: `tr` (varsayılan), `en`, `ar`. Dosyalar `locales/*.json` (web) ve `mobile/src/locales/*.json` (mobile).
- Her string `tv('anahtar', 'Türkçe fallback')` üzerinden — hardcode string yasak (R-08).
- Tema: CSS değişkenleri `[data-theme="dark"]` ve `[data-theme="light-anthracite"]` bloklarında tanımlı. Direct DOM attribute manipulation yasak — sadece `useTema()` / `ARES.setTema()` üzerinden.

---

## 4. API Katmanı

`api/*.js` altında Vercel Serverless Function'lar. Tam detay `docs/API.md`'de.

**Özet:**
- Şu an 2 endpoint: `api/izometri-oku.js` (Claude API ile PDF okuma), `api/sorgula.js` (doğal dil → SQL).
- Her endpoint stateless, JSON I/O, CORS açık.
- Güvenlik açısından **service key bypass riski** en kritik konu — her sorguda `tenant_id` elle filtrelenmeli.

**Niye serverless:**
- Sunucu yönetmek istemiyoruz — Vercel otomatik scale.
- Endpoint başına izole runtime → bir endpoint patlarsa diğerleri etkilenmez.
- Pay-per-request → boş çalışma maliyeti yok.

**Niye uç noktalar az:**
- Çoğu iş Supabase'den direkt frontend'e — RLS sayesinde backend gerekmez.
- API sadece "frontend'den yapılamaz" işler için: LLM çağrısı, karmaşık SQL, dış servis entegrasyonu.

---

## 5. Veritabanı Katmanı

Supabase PostgreSQL. Tam detay `docs/DATABASE.md`'de.

**Özet:**
- 51 tablo, tamamı `tenant_id` kolonu ile multi-tenant.
- Her tabloda 4 RLS policy (SELECT/INSERT/UPDATE/DELETE).
- Migration'lar `migrations/NNN_ad.sql` dosyaları, CI kontrolü var (`MIG_*` kuralları).
- Baseline: `000_initial_schema.sql` (6029 satır, 51 tablo).
- Yedek her gece 03:00 TR, 30 gün retention, `arespipe-backups` repo'suna.

**Niye Supabase:**
- PostgreSQL ciddi bir DB — SQL, ilişkisel, RLS native.
- Auth + Storage + DB tek platformda — kurulum karmaşası yok.
- Free tier (Nano) geliştirme için yeterli, Pro tier'a scale yolu açık.

**Niye multi-tenant tek DB:**
- Ayrı DB başına yeni müşteri = yeni kurulum + yeni migration runner + yeni monitoring. Operasyonel yük çok fazla.
- RLS ile satır-seviye izolasyon güvenli (Postgres'in çekirdek özelliği).
- Scale ihtiyacı gelince shard ederiz — ama 100+ müşteriye kadar gerek yok.

---

## 6. CI/CD ve Sapmama Sistemi

AresPipe'ın en benzersiz mimari kararı bu. GitHub Actions'ta iki workflow:

### `kontrol.yml` → `kontrol.js`

Her push'ta çalışan lint sistemi. 4 kategoride **15 kural** kontrol eder:

- **Yapısal** — HTML sayfalarının standart iskelete uyup uymadığı (ARES init, yetki kontrol vb.)
- **i18n** — hardcode string olup olmadığı (R-08)
- **G-03** — hardcode hex/rgba renk olup olmadığı (CSS variable kullanımı zorunlu)
- **Migrations** — SQL dosya adlandırma ve header kontrolü (28. oturumda eklendi)

Kural tanımları `.github/kurallar.json`'da (machine-readable). Her kural:
- Kod (örn. `YAP_03`, `I18N_02`, `MIG_ISIM_BOZUK`)
- Seviye (hata / uyari)
- Açıklama
- Regex veya kontrol fonksiyonu referansı

### Self-Test Disiplini

`.github/bozuk-ornekler/` klasörü altında **bile bile bozulmuş** örnek dosyalar var. `beklenen-hatalar.json` her dosya için hangi kural kodlarının yakalanması gerektiğini söyler. CI self-test koşulunca her kural gerçekten çalışıyor mu sınanır:

```
node .github/kontrol.js --self-test
```

Geçmişte sorun: kural yazıyorduk ama regex bazen tutmuyordu, kimse fark etmiyordu. Self-test bu kör noktayı kapatıyor (23. oturum, Faz B).

### `docs-uret.yml` → `docs-uret.js`

Bu belge sistemi otomasyonu — 29. oturumda (bu belgelerin yazıldığı oturum) eklendi. Manuel/AUTO hibrit belgelerin AUTO bölümlerini her push'ta günceller.

**Mimari özelliği:** motor dosyaları kod tabanının içinde yaşıyor — harici bir doc-builder service'e bağımlı değiliz. Yazılımcı repo'yu klonlayıp lokal çalıştırabilir.

### Auto-Commit + Skip CI

Her iki workflow da değişiklik ürettiğinde `[skip ci]` commit tag'i ile auto-commit atar. Bu tag GitHub Actions'ın o commit için hiçbir workflow'u tetiklememesini sağlar — sonsuz döngü imkansız.

---

## 7. Dokümantasyon ve Devredilebilirlik

Bu belgelerin kendisi bir mimari kararın ürünü: **hibrit dokümantasyon**.

### Problem

- Saf manuel belgeler eskir. Bir hafta sonra "kaç tablo var?" sorusu yanlış cevap verir.
- Saf otomatik belgeler bağlamsız. Jenerik `CREATE TABLE devreler` listesi yazılımcıya "niye böyle" söylemez.

### Çözüm — AUTO Sınırları

Her belge iki katmanlı:

```markdown
Manuel metin (niye, nasıl, tasarım kararları)

<!-- AUTO-START:BÖLÜM_ADI -->
... script tarafından her push'ta yeniden yazılır ...
<!-- AUTO-END:BÖLÜM_ADI -->

Manuel metin devam (hikâye, örnekler)
```

`docs-uret.js` AUTO sınırları **arasındaki** içeriği yeniden yazar, dışındaki tüm metne dokunmaz.

### Belgeler

| Belge | Manuel | AUTO |
|---|---|---|
| `README.md` | %100 | 0 (kısa istatistik) |
| `docs/ONBOARDING.md` | %90 | 10 (istatistikler) |
| `docs/ARCHITECTURE.md` | %80 | 20 (istatistikler) |
| `docs/DATABASE.md` | %30 | 70 (tablo listesi) |
| `docs/API.md` | %20 | 80 (endpoint listesi) |
| `docs/LOCAL-DEV.md` | %100 | 0 |

### Felsefe

Belge yazımı maliyetli. Hiçbir insan "51 tablomuz var" kısmını sürekli güncellemek istemez — o kısım otomatiğe. Ama "niye multi-tenant tek DB'deyiz" cevabı otomatik yazılmaz — o kısım manuel, **insan tarafından yazılır ve yılda bir gözden geçirilir.**

---

## 8. Hızlı İstatistikler

<!-- AUTO-START:istatistikler -->
> Son güncelleme: 2026-05-21 (otomatik)

- **Web sayfa:** 47
- **Mobil ekran (React):** 17
- **Tablo:** 53
- **API endpoint:** 9
- **CI kural:** 170 (7 kategori)
- **Migration dosyası:** 83
<!-- AUTO-END:istatistikler -->

---

## 9. Önemli Tasarım Kararları

Karar geçmişi — yeni yazılımcı "niye bu değil de o?" diye sorduğunda cevabı:

### Niye Supabase, PostgreSQL değil?

Raw PostgreSQL daha esnek ama auth + storage + hosting ayrı ayrı kurulmalı. Supabase bu üçünü tek yerde veriyor, ekip küçükken operasyonel yük kritik. Scale gelince yine bir karar daha var (self-host Supabase veya direkt Postgres'e geç) — köprü o zaman geçilir.

### Niye Vercel, başka hosting değil?

Netlify, Cloudflare Pages, AWS Amplify denenebilir. Vercel seçildi çünkü:
- Serverless function built-in (ayrı kurulum yok).
- GitHub entegrasyonu sıfır-ayar (her push preview).
- Free tier cömert (küçük proje için sıfır maliyet).

**Dezavantaj:** free tier'da günlük deploy limiti var (29. oturumda bu limite takıldık, 24 saat beklendi). Aktif müşteri gelince Pro'ya geçilecek.

### Niye statik HTML, SPA değil?

Bkz. Bölüm 3. Şu an tersane operatörünün tek-işlem akışı SPA'yı hak etmiyor. **Tutarlılık kararı:** mobile React ise operatörün sürekli kullanacağı akıcı arayüz, SPA orada anlamlı.

### Niye kendi kural motoru, ESLint değil?

ESLint JavaScript için harika, ama AresPipe'ın kuralları Türkçe iş mantığı içeriyor:
- "Her sayfada `ARES.sayfaYetkiKontrol()` çağrısı olmalı"
- "Migration dosyası isim formatı `NNN_ad.sql`"
- "Hardcode string yasak, `tv()` kullan"

Bunlar ESLint custom plugin olarak yazılabilir ama YAML/JSON kuralı Türkçe açıklamasıyla daha net. `kurallar.json` hem CI tarafından okunuyor hem insan tarafından okunuyor — **tek doğruluk kaynağı.**

### Niye dil olarak Türkçe?

Kod dışında her şey Türkçe: değişken adları, dosya adları, kullanıcı mesajları, belgeler. Sebep: ekip Türk, müşteri (ilk) Türk, sektör jargonu Türkçe. İngilizce çeviri bir gün gerekirse `tv()` altyapısı hazır — dizgelere dokunmadan dil değişebilir.

### Niye bu kadar disiplin (kurallar, self-test, auto-docs)?

23. oturum öncesi Cihat 10 gün yerinde saydı — Claude "hatırlıyorum, kontrol etmeme gerek yok" dedi, aslında sapmıştı. Faz B **Sapmama Sistemi**'ni kurdu: artık makineye güveniyoruz, hafızaya değil. Bu disiplin pahalı görünebilir ama kaybedilen 10 günün tekrarı çok daha pahalıya mâl olurdu.

---

## 10. Gelecek Vizyonu — Spool AI

AresPipe uzun vadede bir **takip sistemi** değil, bir **AI destekli üretim platformu**. Tam belge: `docs/SPOOL-AI-VIZYON.md`.

### Kısaca

Kütüphane + Oyun + 3D + AI döngüsü:

```
Standart Parça Kütüphanesi → 3D Montaj Oyunu → Sentetik Eğitim Verisi
    ↑                                                      ↓
Kalite Kontrol           ← Gerçek Foto Tespiti   ←   AI Model Eğitimi
```

Her tersane aynı 20-30 temel parça ile çalışır. Bu parçaları 3D kütüphaneye koyuyoruz. Operatörler bir eğitim oyununda (`spool_usta.html`) bu parçaları tanımayı öğreniyor. Aynı zamanda her oyun turu bir etiketlenmiş eğitim verisi üretiyor. Yeterli veri birikince **kendi alan-özgün AI modelimiz** saha fotoğrafında parça tanıyabiliyor.

### 7 Katman Durumu

| Katman | Durum |
|---|---|
| 1. Eğitim oyunu (izometri okuma) | ✅ Prototip (`spool_usta.html`) |
| 2. 3D montaj aracı | ✅ Prototip (`spool_3d_montaj.html`) |
| 3. Parça kütüphanesi | 🔵 Yapılıyor |
| 4. Etiketleme aracı | 🟠 Sonraki |
| 5. QR ölçek sistemi | 🟠 Sonraki |
| 6. Crowdsourced web | ⚪ İleride |
| 7. AI model eğitimi | ⚪ 500+ veri sonrası |

### Şu Anki Aktif Adım

`api/izometri-oku.js` canlıda — Claude Vision API ile izometri PDF'inden spool listesi çıkarma. Bu **Katman 1'in API sürümü** (eğitim oyunu + AI desteği).

### Niye Bu Vizyon Mimariyi Etkiler

Bir sürü karar ilerideki AI döngüsüne hizmet ediyor:
- **Parça kütüphanesi tablosu** multi-tenant + public/private — Katman 6 için.
- **YOLO uyumlu JSON export** 3D montaj çıktısı — Katman 7 için.
- **tenant_id her satırda** — crowdsource olduğunda onay mekanizması için.
- **Anthropic API key Sensitive** — izometri-oku endpoint'i için.

Yeni bir özellik değerlendirilirken "bu Spool AI döngüsüne katkı sağlıyor mu?" sorusu sorulmalı — anlamsız iş yapmamanın yolu bu.

---

## Ekler

### İlgili Belgeler

- **`docs/ONBOARDING.md`** — "İlk gün" yazılımcı rehberi, bu belgenin uygulama özeti
- **`docs/DATABASE.md`** — veritabanı ayrıntısı
- **`docs/API.md`** — endpoint ayrıntısı
- **`docs/LOCAL-DEV.md`** — lokal akış
- **`docs/SPOOL-AI-VIZYON.md`** — ürün vizyonu (bu belgenin 10. bölümünün detayı)
- **`docs/PANO-TASARIM.md`** — Süper Admin panosunun tasarım belgesi
- **`docs/CIHAT-PROFIL.md`** — proje sahibi ile çalışma notları (Claude'un kendi notu)

### İlgili Oturumlar

- **23. oturum** — Faz B (Sapmama Sistemi) kuruldu
- **27. oturum** — Yedekleme + migrations dosya sistemi
- **28. oturum** — Vercel Sensitive env geçişi + migrations CI entegrasyonu
- **29. oturum** — Hibrit dokümantasyon + bu belge

---

_Bölüm 8 (İstatistikler) otomatik. Diğer bölümler manuel — mimari kararlar değiştiğinde yazılımcı günceller, yılda en az bir kere gözden geçirilmeli._
