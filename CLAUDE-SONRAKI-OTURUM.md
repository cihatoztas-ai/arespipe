# AresPipe — 23. Oturum Gündemi

## 🗺️ Oturum Öncesi Not — Faz B Başlangıcı

**23. oturum Faz B'nin kalbi:** "kurallı geliştirme"den "zorla uyumlu geliştirme"ye geçiş. CLAUDE.md'de yazılı kuralları lint/CI'de kodlanmış kurallar haline çevirme oturumu.

**Bağlam:** 22 oturumdur CLAUDE.md her oturumda büyüdü ve karmaşıklaştı (2592 satır, 29 kural ailesi — G-01 i18n, G-02 tema+pill, G-03 render, B-01 sol kenar, B-02 local key, E-01 enum canonical, E-02 uyum matrisi, E-03 tenant prefix, E-04 marka, E-05 QR etiket, E-06 master tablo, F-01 font size, A-01 auth, S-01 supabase, SC-01 script sırası, R-10 mockup-first, D-01/D-02 i18n child, vb.). Bu sayıda kurala akılda tutarak uyum sağlamak insani sınırları zorluyor. 23. oturum bu yükü insan hafızasından çıkarıp **otomatik kontrollere** devredecek.

**Hedef:** 23. oturum sonunda her commit öncesi `bash scripts/health-check.sh` çalışıyor, 7 ayrı lint script kural ailelerini kontrol ediyor, CI'de deploy öncesi blok koyuluyor.

**Risk:** Mevcut 2500+ satırlık HTML/JS kodunda lint ilk çalıştığında muhtemelen 30-80 kural ihlali çıkacak (çoğu eski, birikmiş). 23. oturumda lint'i kurup çalıştıracağız ama ihlalleri temizlemeyeceğiz — o **24. oturum işi** (font-size refactor dahil).

---

## Oturum Başı Ritüeli

1. **CLAUDE.md oku** — özellikle:
   - Üst bilgi → son güncelleme (22. oturum özeti)
   - Bölüm 2 tamamı → tüm kural aileleri (lint yazılırken referans)
   - Bölüm 7 → dosya yapısı (yeni `scripts/` ve `docs/` ekleneceği için)
   - Bölüm 10 → bekleyen Faz B görevleri
2. **CLAUDE-SON-OTURUM.md oku** — 22. oturum özeti (Admin UI + yan bug'lar)
3. **docs/ROADMAP.md oku** — Faz B'nin ana hatları (2-3 dk)
4. **Deploy durumu teyit:**
   - 22. oturum 4 dosya canlıda mı? (`tanimlar.html`, `spool_detay.html`, `devre_detay.html`, SQL)
   - `SELECT COUNT(*) FROM malzeme_tanimlari WHERE tenant_id IS NOT NULL` sorgusu — canlıda admin eklemeler olduysa göstersin
5. **Repo durum kontrolü:**
   - `git status` — commitlenmemiş değişiklik var mı?
   - Mevcut `scripts/` dizini var mı?
   - Mevcut `.github/workflows/` var mı?
   - `.husky/` var mı?

---

## 🎯 ANA TEMA — Faz B: Altyapı Güvencesi

### Hedef
CLAUDE.md'deki kural aileleri → otomatik lint scripts + CI + şablonlar. "Kurallı geliştirme"den "zorla uyumlu geliştirme"ye.

### Beklenen Süre: 3-4 saat
- 1. saat: CLAUDE.md split + docs/ yapısı
- 1. saat: 7 lint script
- 1. saat: CI + hooks
- 30-60 dk: şablonlar + health-check

### Teslim Kriteri
- [ ] `bash scripts/health-check.sh` çalışıyor, 7 lint sonucunu konsola basıyor
- [ ] `.husky/pre-commit` hook'u kuruldu, commit öncesi health-check çalışıyor
- [ ] `.github/workflows/lint.yml` PR'larda CI kontrolü yapıyor
- [ ] `docs/templates/` altında yeni sayfa/modal/SQL şablonları
- [ ] CLAUDE.md'nin başında "ZORUNLU ilk tool call: `bash scripts/health-check.sh`" bloğu
- [ ] 22. oturumda yazılan kod 0 yeni ihlalle geçiyor (mevcut ihlaller var ama 24. oturumda temizlenecek)

---

## Öncelik 1 — CLAUDE.md Split (45 dk)

**Hedef:** 2592 satırlık tek dosyadan → 600 satır ana CLAUDE.md + tematik docs/ dosyaları.

### Hedef Yapı
```
/CLAUDE.md                    — 600 satır (proje tanımı + ritüel + aktif kural listesi + son 2 oturum)
/docs/
  /rules/
    G-01-i18n.md              — D-01, D-02, G-01 (sayfa teslim listesi)
    G-02-tema-pill.md         — 2.3, 2.4, 2.5, 2.12.1
    G-03-render.md            — 2.18 tamamı
    E-01-enum-master.md       — 2.13 tamamı (E-01 + E-02 + E-06)
    B-01-sol-kenar.md         — 2.4
    B-02-local-key.md         — 2.17
    E-03-tenant-prefix.md     — 2.14
    E-04-marka.md             — 2.15
    E-05-qr-etiket.md         — 2.16
    F-01-font-size.md         — 2.5
    A-01-auth.md              — 2.7
    S-01-supabase.md          — 2.8
    SC-01-script-sirasi.md    — 2.2
    R-10-mockup-first.md      — (yeni dosya, 22. oturumda tam kuralsallaştı)
  /architecture/
    db-schema.md              — Bölüm 4
    rpc-fonksiyonlari.md      — Bölüm 6
    yetki-sistemi.md          — 2.11
    hesaplamalar.md           — Bölüm 5
  /sessions/
    22-malzeme-havuzu.md      — 22. oturum (şu an Bölüm 11)
    21-render-standardizasyon.md — 21. oturum
    20-ifs-kok-neden.md       — 20. oturum
    ...                       — her oturum ayrı dosya
  /templates/
    yeni-sayfa-iskelet.html
    yeni-modal-iskelet.html
    migration-template.sql
  /ROADMAP.md                 — zaten var
```

### Adımlar
1. `docs/` dizin yapısı oluştur
2. Her kural dosyasını mevcut CLAUDE.md bölümünden kopyala, `rules/` altına yaz
3. Her oturum özetini `sessions/NN-ana-tema.md` olarak ayır
4. CLAUDE.md'de kalan: üst bilgi + roadmap özeti + aktif kural başlıkları (linkli) + son 2 oturum
5. CLAUDE.md'nin başına "ZORUNLU ilk tool call: `bash scripts/health-check.sh`" bloğu

### Risk
Mevcut çakışan başlıklar (11, 11A, 11B birden fazla) yine de arşiv niteliğinde. Split sırasında session dosyalarına ayrı ayrı koyarak bu karmaşa kapanacak.

---

## Öncelik 2 — Lint Script'leri (60-90 dk)

Her biri bağımsız Node.js (veya bash) script, sıfır dış bağımlılık (yalnızca built-in regex + fs).

### 1. `scripts/lint-g01-i18n.js`
Kontrol edilen: HTML'de tüm metin (innerHTML, textContent, template literal, alert/confirm/toast mesajları) `tv(key, tr)` çağrısıyla mı yoksa hard-coded TR mi?

Regex pattern: `/(\.innerHTML\s*=|\.textContent\s*=|toast\(|confirm\(|alert\()[^;]*['"][^'"]*(çe|ş|ğ|ü|ı|İ|Ç|Ş|Ğ|Ü|Ö|ö)/` (Türkçe karakter içeren string'ler direkt şüpheli)

Çıktı: `[DOSYA:SATIR] hard-coded Türkçe: '<içerik>'`

### 2. `scripts/lint-g02-tema-fontsize.js`
Kontrol edilen:
- CSS'de `font-size: Npx` hard-coded kullanımı (F-01 ihlali — değişken olmalı)
- CSS'de yasak renkler: `#3b82f6`, `#22c55e`, `#0a0b0e`, `#10b981`, `#0d0f1a`
- `[data-theme="dark"]` (tırnaklı) — doğrusu `[data-theme=dark]`

### 3. `scripts/lint-g03-enum.js` ⭐
Kontrol edilen: render noktalarında ham kategori/kalite/yüzey/durum kodu kullanımı.

Pattern:
- `esc(.*\.malzeme\s*\|\|)` → ham, `ARES_NORM.malzemeEtiket` olmalı
- `esc(.*\.yuzey\s*\|\|)` → ham
- `esc(.*\.durum\s*\|\|)` → ham
- Template literal: `` `${...\.malzeme}` `` → ham

İstisna: state map, arama filtresi, dropdown value, inlineEdit currentValue (2.18'deki 8 maddelik istisna listesi).

### 4. `scripts/lint-b02-local-key.js`
Kontrol edilen: Array manipülasyonunda `index` kullanımı. `s.pipeline` + `s.spoolNo` ile türetilen stable local key pattern olmalı.

### 5. `scripts/lint-e01-canonical.js`
Kontrol edilen: DB write noktalarında `<option value="...">` ham canonical kod olmalı (i18n çevirisi içerik'te).

### 6. `scripts/lint-a01-error-handling.js`
Kontrol edilen:
- `supa.from(...).select()` sonrası `res.error` kontrolü var mı?
- `async function` içinde `try/catch` var mı?
- `toast(err.message)` pattern'i kullanılıyor mu?

### 7. `scripts/lint-dead-code.js`
Kontrol edilen:
- Unary plus ölü kod (`return '...';\n  +'...'` gibi — 22. oturumda devre_detay.html'de yakalandı)
- `'use strict'` sonrası tanımlanmamış global değişken kullanımı
- Duplicate `<td>` / duplicate `id` attribute

### Birleştirici: `scripts/health-check.sh`
```bash
#!/bin/bash
set -e
echo "🔍 AresPipe Health Check"
node scripts/lint-g01-i18n.js
node scripts/lint-g02-tema-fontsize.js
node scripts/lint-g03-enum.js
node scripts/lint-b02-local-key.js
node scripts/lint-e01-canonical.js
node scripts/lint-a01-error-handling.js
node scripts/lint-dead-code.js
echo "✅ Health check geçti"
```

Exit code: herhangi bir lint fail ederse exit 1.

---

## Öncelik 3 — CI/CD Entegrasyonu (30 dk)

### `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
bash scripts/health-check.sh
```

Kurulum: `npx husky install`, `npx husky add .husky/pre-commit "bash scripts/health-check.sh"`.

### `.github/workflows/lint.yml`
```yaml
name: Lint
on:
  pull_request:
  push:
    branches: [main]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: bash scripts/health-check.sh
```

### Vercel Deploy Entegrasyonu (opsiyonel)
Vercel'de "Ignored Build Step" → `bash scripts/health-check.sh`. Exit 1 ise deploy iptal.

---

## Öncelik 4 — Şablonlar (30 dk)

### `docs/templates/yeni-sayfa-iskelet.html`
Yeni bir web HTML sayfa açarken kopyalanacak iskelet:
- Flash prevention script
- Script sırası (store → lang → normalize → layout)
- `<body data-sayfa="...">`
- Breadcrumb + page-title
- Başlangıçta `ARES.sayfaYetkiKontrol(['...'])`
- Tüm renkler var-sadece, tüm fontlar Barlow
- data-i18n placeholder'ları

### `docs/templates/yeni-modal-iskelet.html`
Modal pattern:
- `.mov` overlay
- `.mod` içerik
- ESC kapanma
- Click-outside kapanma
- Form validation pattern

### `docs/templates/migration-template.sql`
SQL migration dosyası şablonu:
- Başlık yorum (oturum numarası, tarih, bağlam)
- UP bölümü
- Teyit sorgusu
- DOWN (opsiyonel, rollback)

---

## Öncelik 5 — CLAUDE.md Başına "ZORUNLU İlk Tool Call" Bloğu (5 dk)

```markdown
# AresPipe — Claude Proje Bağlamı

> **⚠️ ZORUNLU İLK ADIM:** Her oturum açıldığında ilk tool call `bash scripts/health-check.sh` olmalıdır.
> Hiçbir değişiklik yapmadan önce sağlık kontrolünü çalıştır. İhlal varsa kullanıcıya bildir, istemeden temizlemeye kalkma.

> Bu dosya her sohbet başında okunur. Güncel tutulması şarttır.
> Son güncelleme: ...
```

---

## Risk Yönetimi

1. **Mevcut kod ihlal sayısı yüksek olacak.** 30-80 hit muhtemel, 100+ olabilir. **Çözüm:** 23. oturumda lint'i kur, ihlal sayısını raporla; 24. oturumda temizle. Bugün kapanışta "Lint kuruldu, baseline: X ihlal" yazılacak.

2. **CLAUDE.md split sırasında bilgi kaybı.** 2592 satır → 600 + ~15 dosya. **Çözüm:** Önce split şemasını yazılı yap, onay al, sonra uygula. Her satırın hedef dosyası netleşsin.

3. **Lint script'leri false-positive üretir.** Regex tabanlı kontroller karmaşık JS ifadelerini yanlış yakalar. **Çözüm:** Her lint'in ilk sürümü "şüpheli" flag'i üretsin, "hata" değil. Birkaç oturumda hassasiyet ayarlanır.

4. **Husky/CI kurulumunda Node sürüm uyumsuzluğu.** `.nvmrc` dosyası ekleyerek sabitle.

5. **Windows geliştirici ortamında bash script'leri çalışmayabilir.** Çare: Node.js ile birleştirici (`scripts/health-check.js`). Bugün bash versiyonu yeterli.

6. **CLAUDE.md Bölüm 11 zinciri.** Mevcut 11/11A/11A1/11A2/11B/11C... katmanlı arşiv. Split'te her oturum `docs/sessions/NN.md` olarak ayrılınca ana CLAUDE.md'de sadece **son 2 oturum özeti** kalacak.

---

## 24. Oturum — Mevcut Kod Temizliği + Font-Size Refactor (2-3 saat)

23'ün ilk lint çalıştırmasının çıktısını temizle:

1. **G-01 i18n ihlallleri:** Hard-coded TR'leri `tv(key, tr)` çağrısına çevir, lang dosyalarına yeni anahtar ekle.
2. **F-01 font-size refactor:**
   - `:root` içine `--fs-xs: 11px; --fs-sm: 12px; --fs-base: 14px; --fs-lg: 16px; --fs-xl: 20px;` tanımla
   - Hard-coded `font-size: Npx` kullanımları grep'le, hepsini değişkene çevir
   - "Karakter büyüklüğü sorununun köklü çözümü" olarak 11-14. oturumdan beri biriken borç
3. **G-02 yasak renk temizliği:** Varsa `#3b82f6` vs.'yi `var(--ac)` yap.
4. **A-01 error handling:** Supabase çağrılarında eksik `res.error` kontrolleri.
5. **Dead code:** Unused variable, ölü blok, yorum satırı çöpleri.

Lint hedefi: **0 ihlal** (baseline'dan temiz duruma).

---

## 25. Oturum — Faz A Faz 3: Form Refactor (1-2 saat)

- `devre_yeni.html` manuel kalite input → `<select>` (master + "Yeni ekle" opsiyonu)
- `spool_detay.html > kaliteleriDoldur()` master + geçmiş kayıt birleşik (22. oturumda sadece master yapıldı)
- Seçilen kategoriye göre kalite filtrelemesi (`ed_malz` onchange → datalist filter)
- Autocomplete Faz 3 içinde

Lint destekli çalışır — 23-24 altyapı tamam olduğu için çok hızlı.

---

## 26. Oturum — Faz A Faz 4: IFS Fuzzy Match (1-2 saat)

Malzeme sistemini sonlandır:
- IFS `Material` kolonundaki `St37`, `ST 37`, `st-37`, `StE355` varyantları fuzzy match
- `kalite_kod_normalize()` regex genişletmesi (`A335 Pxx`, `2205`, vb.)
- Eşleşmeyen kodlar → admin bildirim + "manuel eşleştir" akışı
- `ifs_material_alias` öğrenen tablo

---

## 27-29. Oturum — Faz C: SaaS Hazırlığı

Planlandığı gibi ilerler. Detaylar `docs/ROADMAP.md`'de.

---

## 🎯 23. Oturum Başlangıç Mesajı Önerisi

Kullanıcı "23. oturum başla" derse şöyle başlayabilirsin:

```
23. oturumdayız — Faz B altyapı kalbi. Ritüeli açıyorum, sonra split + lint + CI sırasıyla gideceğiz.

Birkaç soru başta:
1. Repo'da `scripts/` ve `.github/workflows/` dizinleri var mı, yoksa temizden mi?
2. Node.js sürümü? (lint script'leri Node 18+ gerektirir)
3. Husky kurulu mu? (package.json'da `husky` devDependency var mı?)
4. CLAUDE.md split'i yaparken mevcut duplicate başlıkları (11, 11A zincirinin 2-3 farklı noktada tekrar etmesi) tamamen docs/sessions/ altına taşıyalım mı, yoksa CLAUDE.md'de son 2 oturum kalsın ve gerisi arşive mi?

Bunlar gelince split şemasını yazıp onay alıp uygulamaya başlıyorum.
```

## Hazır DB Objeleri (Referans)

```sql
-- Tablolar
malzeme_tanimlari (12 sistem + N tenant özel)
spool_malzemeleri.malzeme_ref_id FK
pipeline_malzemeleri.malzeme_ref_id FK

-- Fonksiyonlar (22. oturum sonrası)
kategori_kod_normalize(text) → text
kalite_kod_normalize(text) → text     -- Faz 4'te genişletilecek
malzeme_ref_bul(uuid, text, text) → uuid   -- Guard 1 kaldırıldı

-- Trigger'lar
tg_spool_malzemeleri_ref_sync    ON spool_malzemeleri
tg_pipeline_malzemeleri_ref_sync ON pipeline_malzemeleri

-- RLS Policies (4 adet, 22. oturumda canlıda doğrulandı)
malzeme_tanimlari_select, _insert, _update, _delete
```

## JS API (Referans)

```js
// RENDER (G-03 zorunlu)
ARES_NORM.malzemeEtiket(kod)     // → "Karbon Çelik"
ARES_NORM.kaliteGoster(kodOrRaw) // → "St 37"
ARES_NORM.yuzeyEtiket(kod)       // → "Asit"
ARES_NORM.durumEtiket(kod)       // → "Bekliyor"

// KOD (DB yazımı)
ARES_NORM.malzemeKod(raw)        // → "karbon"
ARES_NORM.kaliteKod(raw)         // → "ST37"
ARES_NORM.yuzeyKod(raw)          // → "asit"

// UYUM (E-02)
ARES_NORM.uyumlu('paslanmaz','galvaniz')  // → false
ARES_NORM.uyumluYuzeyler('paslanmaz')     // → ['asit','diger']

// MARKA + REV (E-04)
ARES_NORM.marka(proje, pipeline, spool, ARES_NORM.revFmt(rev))
```

## Kapanış Beklentisi

23. oturum sonunda:
- CLAUDE.md 2592 → 600 satır
- docs/ yapısı kuruldu (15-20 dosya)
- 7 lint script + health-check çalışıyor
- Husky + CI devrede
- Şablonlar hazır
- Baseline lint raporu (X ihlal, 24. oturum işi)

24. oturum bunları temizlemekle başlayacak, Faz A Faz 3'ü (25. oturum) çok temiz bir zeminde yapacağız.
