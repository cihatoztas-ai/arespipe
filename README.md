# AresPipe

**Tersane boru imalat takip sistemi.** Spool üretim zincirini (kesim → büküm → markalama → kalite kontrol → sevkiyat) tablette dijital olarak takip eder. Multi-tenant mimari — şu an bir tersanede kullanılıyor, ileride SaaS olarak birden fazla tersaneye hizmet edecek.

**Canlı sistem:** [arespipe.vercel.app](https://arespipe.vercel.app)

---

## Nedir?

Tersanelerde yüzlerce farklı spool (boru demeti) üretilir; her biri birden fazla aşamadan geçer, kağıt ve Excel ile takip edilir. AresPipe bu süreci dijitalleştirir:

- Operatör tablette QR kodu okutur, sistem ne yapacağını söyler.
- Her işlem atomik olarak kaydedilir (zaman, personel, sonuç, foto).
- Yönetici canlı ilerleme raporu görür.
- Kalite hataları kayıtlıdır, sonraki projede referans olarak kullanılır.

**Uzun vadeli vizyon:** Spool AI — alan-özgün bir yapay zeka modeli ile izometri okuma, parça tanıma ve kalite kontrol otomasyonu. Detay: [`docs/SPOOL-AI-VIZYON.md`](docs/SPOOL-AI-VIZYON.md).

---

## Dokümantasyon

Projeyi anlamanın kapısı. Önerilen okuma sırası:

| Belge | Ne İçin |
|---|---|
| [`docs/ONBOARDING.md`](docs/ONBOARDING.md) | **Yeni yazılımcı için başlangıç noktası** — ilk gün/ilk hafta rehberi |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Sistem mimarisi, katmanlar, tasarım kararları |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Multi-tenant şema, RLS, migration sistemi |
| [`docs/API.md`](docs/API.md) | Endpoint'ler, güvenlik, yeni endpoint ekleme |
| [`docs/LOCAL-DEV.md`](docs/LOCAL-DEV.md) | Lokal geliştirme, debug, push-to-deploy akışı |
| [`docs/SPOOL-AI-VIZYON.md`](docs/SPOOL-AI-VIZYON.md) | Uzun vade ürün yönü (7 katman, 5 faz) |

---

## Teknoloji

- **Veritabanı:** PostgreSQL (Supabase, West Europe bölge)
- **Hosting:** Vercel (statik HTML + serverless functions)
- **Backend:** Node.js serverless (Vercel Functions)
- **Frontend (web):** Vanilla JavaScript + HTML, Barlow Condensed + CSS değişkenleri
- **Frontend (mobil):** React + Vite (`mobile/` klasörü, %5 başladı)
- **AI:** Anthropic Claude API (izometri PDF okuma, doğal dil → SQL)
- **CI/CD:** GitHub Actions (kontrol + docs auto-update)
- **Yedekleme:** Otomatik nightly (ayrı private repo)

---

## CI ve Sapmama Sistemi

Her push'ta iki workflow paralel çalışır:

- **`kontrol.yml`** — 15 kural üzerinde lint (yapısal, i18n, G-03 renk, migrations). İhlal → kırmızı.
- **`docs-uret.yml`** — `docs/` altındaki AUTO bölümleri (tablo listesi, endpoint listesi, istatistikler) günceller.

Kural kataloğu: [`.github/kurallar.json`](.github/kurallar.json). Self-test: `node .github/kontrol.js --self-test`.

CI'ın "sapmama sistemi" olarak tasarlanma öyküsü `docs/ARCHITECTURE.md` Bölüm 6'da.

---

## Katkı

Yeni yazılımcı mısın? [`docs/ONBOARDING.md`](docs/ONBOARDING.md) ile başla. İlk hafta read-only mod önerilir; sistemi anladıktan sonra küçük PR'larla başla.

Değişiklik akışı:

1. Branch aç, değişikliği yap.
2. PR aç — Vercel preview URL otomatik üretilir.
3. GitHub Actions + Vercel yeşil olduğunu gör.
4. Code review → merge.

Ayrıntı: [`docs/LOCAL-DEV.md`](docs/LOCAL-DEV.md).

---

## Proje Durumu

Nisan 2026 itibariyle **aktif geliştirme** aşamasında. 29 oturum boyunca kurulan altyapı tamamlandı; 30-34 oturumlarında müşteri öncesi altyapı kapanışı (güvenlik, observability, email, staging), 35'ten itibaren ürün dönemi planlı. Detay: [`.github/son-durum.md`](.github/son-durum.md).

---

## İletişim

- **Sahip:** Cihat Öztaş ([@cihatoztas-ai](https://github.com/cihatoztas-ai))
- **Repo:** [github.com/cihatoztas-ai/arespipe](https://github.com/cihatoztas-ai/arespipe)
- **Geri bildirim:** Süper Admin Panosu → "Geri Bildirim" sekmesi (canlı sistem içinde)

---

_Özel proje — public lisans verilmemiştir. Kullanım için iletişime geçiniz._
