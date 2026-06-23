# AresPipe Dökümantasyon Sistemi — Yapı, Politika, Plan

> Bu dosya dökümanın kendisini değil, **döküman sistemini** tanımlar: ne nereye yazılır, sır nasıl ele alınır, nasıl hayata geçirilir. "Nereye koyayım?" sorusunun tek cevap noktası.

---

## 1. Tasarım ilkesi — üç eksen

Döküman tek eksende (sayfa/dosya) bölünmez. Profesyonel yapı üç ekseni ayırır:

**Eksen A — Okuyucu ihtiyacı (Diátaxis):**
- *How-to / Akış* — bir görevi nasıl yaparım (KK daveti açma)
- *Reference* — bakıp bulurum (şema, API, sayfa listesi)
- *Explanation* — neden böyle (iki-katman gerekçesi)
- *(Tutorial — solo dev için şimdilik atlanıyor)*

**Eksen B — Kapsam:**
- *Özellik/Akış* — tek yeteneğe ait (KK, kesim, wizard)
- *Sistem-geneli (cross-cutting)* — sayfaya sığmaz, her yere yayılır (güvenlik, RLS, dağıtım). **KK gibi tarif edilmez; ilke yazılır.**

**Eksen C — Hassasiyet (en kritik):**
- *Açık* — repoda, paylaşılabilir, hiç sır yok
- *Yapı-hassas* — repoda ama dikkatli: sırrın *yeri/rotasyonu* (değeri DEĞİL), admin aracının *varlığı/kullanımı*
- *Sır* — repoda ASLA: gerçek değerler → secret manager; hassas runbook → özel repo/kasa

---

## 2. Klasör yapısı

```
docs/
  README.md                ← BU DOSYA (yapı + katkı kuralı)

  akislar/                 ← How-to · özellik/akış (Eksen B: özellik)
    INDEX.md
    kalite-kontrol.md      (🟢 dolu)
    devre-olusturma-wizard.md
    kesim.md · bukum.md · markalama.md · sevkiyat.md · test.md · imalat-qr.md ...

  konular/                 ← Cross-cutting · sistem-geneli (Eksen B: yatay)
    guvenlik.md            (RLS, yetki blokları, threat model özeti)
    cok-kiracililik.md     (tenant_id izolasyonu — asıl güvenlik sınırı)
    kimlik-oturum.md       (Supabase auth, session)
    dagitim.md             (Vercel, CI/CD, 12-endpoint tavanı)
    ortam-degiskenleri.md  (env ENVANTERİ — DEĞER YOK, yer+rotasyon+kim erişir)
    yedekleme.md           (backup + geri yükleme prosedürü)
    migration-akisi.md     (dry-run, panel DDL, numaralama)

  referans/                ← Reference · bakıp-bul (mümkünce OTOMATİK)
    veritabani.md          (şema — information_schema'dan üretilebilir)
    api.md                 (endpoint'ler — 12 tavanı)
    sayfalar.md            (sayfa kataloğu, akışlara link)

  kararlar/                ← ADR · mimari kararlar = MK-xxx (her biri ayrı dosya)
    0001-12-endpoint-tavani.md  (eski MK-129.3)
    0002-iki-katman-kk.md       (eski MK-199.3)
    ...

  mimari.md                ← Explanation + C4 (Context→Container→Component)

────────────────────────────────────────────────────────────
REPO DIŞI (sır katmanı — buraya hiç commit yok):
  • Secret manager (Vercel env / Supabase / 1Password|Bitwarden)
      → gerçek değerler: SUPABASE_SERVICE_KEY, DB şifresi, API anahtarları
  • Özel repo veya kasa (arespipe-ops):
      → hassas runbook: süper admin erişim prosedürü, kurtarma/restore adımları
```

### Mevcut dosyaların yeni adresi
- `BRIEFING.md`, `CLAUDE-*-OTURUM.md`, `son-durum.md` → oturum devri, ayrı kalır (döküman değil, işletim).
- Dağınık `MK-` kuralları → `kararlar/` (ADR formatına ayrıştırılacak).
- Mevcut `DATABASE.md`/`API.md` → `referans/` altına.

---

## 3. Sır & güvenlik politikası (net kurallar)

1. **Sır değeri hiçbir markdown'da geçmez.** Şifre, anahtar, token, connection string — yasak.
2. **Env envanteri** (`konular/ortam-degiskenleri.md`) şunu yazar, değeri yazmaz:
   | Değişken | Nerede yaşar | Kim erişir | Rotasyon | Not |
   |---|---|---|---|---|
   | `SUPABASE_SERVICE_KEY` | Vercel env (server-only) | — | — | client'a ASLA gitmez (MK-101.4) |
3. **Admin/yönetim araçları:** *varlığı ve kullanımı* açık dökümanda olabilir (kısıtlı-erişim özellik gibi); *erişim kimlik bilgisi* secret manager'da, *hassas prosedür* özel repoda.
4. **Koruma:** `.gitignore` + pre-commit secret-scan (gitleaks/git-secrets). Yanlış commit'i daha push'tan önce yakalar.
5. **Güvenlik dökümanı** (`konular/guvenlik.md`) saldırgana yol gösterecek detay vermez; mimari sınırı (RLS tenant izolasyonu, service-key server-only, yetki blokları) anlatır. Derin/istismar-edilebilir detay → özel.

---

## 4. Hayata geçirme planı (fazlı)

**Faz 0 — Altyapı (1 oturum):**
- `docs/` klasör iskeleti + bu README.
- `.gitignore` gözden geçir + secret-scan ekle (gitleaks pre-commit).
- Mevcut DATABASE/API → `referans/`'a taşı. MK→ADR taşıma planı (henüz taşıma değil, sadece eşleme tablosu).

**Faz 1 — Otomatik referans (1 oturum):**
- Script: `referans/sayfalar.md` satırlarını + `referans/veritabani.md` şemasını üret (grep sekme/fonksiyon/`from('tablo')` + `information_schema`). El emeği minimum.

**Faz 2 — Kritik yatay konular (1-2 oturum):**
- `konular/guvenlik.md`, `ortam-degiskenleri.md`, `dagitim.md` — **en yüksek değer**, çünkü şu an HİÇ yazılı değil ve sayfa-merkezli yaklaşımda hep unutulurlar.

**Faz 3 — Akışlar (süregelen):**
- Her oturum dokunulan akışı doldur. KK zaten var. Wizard/kesim/sevkiyat sırayla.

**Faz 4 — ADR ayrıştırma (kademeli):**
- `MK-` kurallarını `kararlar/000X-*.md` formatına böl. Aktif olanlar önce.

**Süreklilik (ölmeme garantisi):**
- Kapanış ritüeline madde: *"dokunulan akışın `akislar/*.md`'sini güncelle; yeni karar → `kararlar/`'a ADR; yeni sayfa → `sayfalar.md`'ye satır."*
- Kural: kod PR'ı ilgili dökümanı aynı commit'te günceller (docs-as-code).

---

## 5. Doldurma sırası (değer önceliği)
1. **Faz 2 yatay konular** (güvenlik/env/dağıtım) — hiç yok, en kritik, en kolay unutulan.
2. **referans/** (otomatik üretilen) — düşük emek, yüksek fayda.
3. **akislar/** — oturum başına bir tane, doğal birikir.
4. **kararlar/** (ADR) — arka planda kademeli.
5. **mimari.md / C4** — en son, sistem oturduğunda.

> Solo dev gerçeği: hepsini birden kurma. Faz 0 + Faz 2 (güvenlik/env) ilk oturumda en çok korumayı verir; gerisi birikerek dolar.
