# CLAUDE-SONRAKI-OTURUM — 87. Oturum Gündemi

> Bu dosya 87'nin açılışında okunacak. Birlikte: `.github/son-durum.md` + `docs/CLAUDE-SON-OTURUM.md`.

---

## 87. Oturum Ana Tema

**Kütüphane sayfası render fix + Öneriler kartı + 86.D Phase 2 (onay/red) + veri borç tanıları.**

86'da kullanıcı yüzeyi tamamlandı (renk semantiği, tanımsız modal, salt-okuma panel) ama saha testinde `admin/kutuphane.html` görselinde regresyon tespit edildi (86'da dosyaya dokunulmadı, başka sebep). 87 önce bunu çözer, sonra 86.D Phase 1'in doğal devamı olan kütüphane.html → Öneriler kartı bağlantısı eklenir. Sonra onay/red akışı (Phase 2) ile öneri döngüsü tamamlanır. Son olarak 80+ oturumlardan kalan veri borçları tanılanır.

---

## Açılış Ritüeli

```
Oturum başlangıç ritüeli. 2 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3

2. Bugün ne yapmak istiyorsun? (Önerilen: 87.A → 87.B → 87.C; D-F küçük temizlik)
```

`son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` okunur. Sonra 87.A tanı ile başlanır.

**Ek açılış kontrolü:** `SELECT count(*) FROM tanimsiz_kayitlar;` — 86 kapanışında 0 kayıt vardı. >0 ise sahada Kaydet testi yapılmış demektir, 86.C v2.1 hotfix doğrulandı.

---

## 87.A — `admin/kutuphane.html` Topbar/Layout Render Fix (~30 dk, öncelik 1)

86 kapanışında saha kullanıcısı bildirdi: sidebar ana içeriğin üstüne biniyor, topbar görünmüyor. **86'da bu dosyaya hiç dokunulmadı** (`git log admin/kutuphane.html` son commit `659069a` = 85 kapanışı, SC-01 script tag fix).

### Sorun

`arespipe.vercel.app/admin/kutuphane.html` açıldığında:
- Sidebar (220px) doğru render, "Kütüphane" active turuncu vurgulu
- Sidebar ana içeriğin **üstüne biniyor**, content sol taraftan kesiliyor
- Topbar (AresPipe logosu + Süper Admin badge + Çıkış butonu) **gözükmüyor**
- Başlık ("Kütüphane Envanteri") parçalanmış görünüyor

Diğer admin sayfaları (panel.html, firma.html, kullanicilar) **çalışıyor** — topbar + sidebar + main düzgün hizalı.

### Tanı Adımları

1. **Console kırmızı hata:**
   ```
   # Sayfa acik, Console sekmesi
   # Hata mesajlarini ekran goruntusu veya kopyala-yapistir
   ```

2. **DevTools Layout inspect:**
   - `<div class="layout">` element seç → Computed paneli → `display`, `flex-direction`, height kontrol
   - Sidebar `position:sticky` mu `position:absolute` mu? Override var mı?
   - Topbar `height:56px` görünüyor mu yoksa `height:0` mu?

3. **`ares-layout.js` davranış:**
   ```bash
   head -50 ares-layout.js
   # ares-layout.js global olarak topbar/sidebar inject ediyorsa, kutuphane.html'in
   # kendi topbar HTML'i ile cakisma olabilir
   ```

4. **panel.html ile diff:**
   ```bash
   diff <(sed -n '140,170p' admin/panel.html) <(sed -n '140,170p' admin/kutuphane.html)
   # Topbar HTML yapisini karsilastir
   ```

5. **Vercel build cache** (MK-48.1 reflexi):
   - Vercel dashboard → Deployments → en son deploy → "..." menü → "Redeploy" → **"Use existing Build Cache" UNCHECK**
   - Production sayfada hard refresh (Cmd+Shift+R)

### Çözüm Hipotezleri (sıralı)

- **H1:** `ares-layout.js` runtime hata atıyor, sidebar inject olduktan sonra topbar atılıyor → script düzeltme veya `kutuphane.html`'den `ares-layout.js` kaldır
- **H2:** Topbar HTML var ama CSS height ezilmiş → CSS specificity sorunu, `.topbar{height:56px !important}` veya order düzeltme
- **H3:** `<div class="layout">` yapısı paneldan farklı → panel.html pattern'ına hizala (rebuild HTML iskeleti)
- **H4:** Vercel build cache eski JS taşıyor → manuel cache cleared redeploy

### İş Tanımı

- Tanı: 30 dk
- Fix: 15-30 dk (hipotez doğrulanırsa)
- Commit: `fix(87.A): admin/kutuphane.html topbar/layout render duzelt`

---

## 87.B — `admin/kutuphane.html`'e Öneriler Kartı (~15 dk, 87.A bağımlı)

87.A çalışır hale getirildikten sonra, 86.D Phase 1'in doğal devamı: süper admin "Öneriler" sayfasına kütüphane sayfasından doğal giriş.

### Mevcut Yapı (84'te kuruldu)

`admin/kutuphane.html` satır 232'de `GRUPLAR` array, 7 kart: borular, fittings, flanslar, malzemeler, uyum, ozel, spec. Her kart `tablolar:['boru_olculer']` gibi tablo listesine bağlı, render fonksiyonu (satır 374) `kutuphane-detay.html?tablo=...` linkine yönlendiriyor.

### Yapılacak

**Yeni kart `GRUPLAR` array'ine eklenir:**
```js
{ kod:'oneriler', ad:'Bekleyen Öneriler', ikon:'💡', renk:'warn',
  aciklama:'Kullanıcı kayıt önerileri — kütüphaneye alınmak için onay bekliyor',
  link:'kutuphane-oneriler.html' }
```

**Render fonksiyonu (satır 374) dallandırılır:**
```js
// Mevcut: tablolar:[] -> kutuphane-detay.html?tablo=...
// Yeni: link varsa direkt link, yoksa eski akis
var hedef = g.link ? g.link : 'kutuphane-detay.html?grup=' + g.kod;
```

**Sayım rozeti (opsiyonel):**
Kart üzerinde `tanimsiz_kayitlar` durum='bekliyor' count gösterilebilir (mevcut tablo count'ları gibi). Eğer mevcut count pattern array tabanlıysa "tablolar:['tanimsiz_kayitlar']" + filter eklemek daha temiz; yoksa link kart için ayrı bir count helper.

### İş Tanımı

- Patch: 10 dk
- Commit: `feat(87.B): admin/kutuphane.html — Oneriler karti (kutuphane-oneriler.html link)`

---

## 87.C — 86.D Phase 2: Onay/Red Butonları + Hedef Tabloya Yazma (~2 saat, ayrı oturum olabilir)

86.D Phase 1 salt okuma. Phase 2 öneri döngüsünü kapatır: süper admin kararını verir, kayıt ya kütüphaneye geçer ya reddedilir.

### DB Tarafı — Yeni Migration `062_oneri_karar_rpc.sql`

`tanimsiz_kayitlar` zaten 5 alana sahip karar takibi için: `super_admin_id`, `karar_zamani`, `karar_notu`, `hedef_tablo`, `hedef_kayit_id`. Eksik olan: kararı uygulayan RPC fonksiyonları.

**3 RPC fonksiyonu:**

1. **`oneri_sisteme_ekle(p_oneri_id, p_hedef_tablo, p_hedef_kayit_data JSONB, p_karar_notu)`**
   - `tanimsiz_kayitlar` `durum='onaylandi'`, `super_admin_id=auth.uid()`, `karar_zamani=now()`
   - `p_hedef_tablo` (boru_olculer/fitting_olculer/flansh_olculer/malzeme_kataloglari) → INSERT (tenant_id NULL = sistem-preset)
   - `hedef_kayit_id` = yeni satırın UUID'si
   - RLS: süper admin yazıyor, RLS kontrol gerek yok (auth check fonksiyon içinde)

2. **`oneri_tenant_ozel_onayla(p_oneri_id, p_hedef_tablo, p_hedef_kayit_data JSONB, p_tenant_id, p_karar_notu)`**
   - Aynı pattern, sadece `tenant_id=p_tenant_id` ile INSERT
   - Tenant ID parametresinden alınır (öneren tenant ID otomatik geçilebilir veya farklı tenant atanabilir)

3. **`oneri_reddet(p_oneri_id, p_karar_notu)`**
   - `tanimsiz_kayitlar` `durum='reddedildi'`, `super_admin_id`, `karar_zamani`, `karar_notu`
   - Hedef tablo değişmez

### Frontend Tarafı — `admin/kutuphane-oneriler.html` detay paneli

**3 buton ekle:**
- 🟢 **Sisteme Ekle** (yeşil) — modal: "Hangi tabloya?", form: dış çap/et/kalite/standart/DN düzenlenebilir → RPC
- 🟡 **Tenant Özel Onayla** (sarı) — modal: hangi tenant + tablo + alanlar → RPC
- 🔴 **Reddet** (kırmızı) — basit confirm + karar notu textarea → RPC

Karar verildikten sonra liste yenilenir, kayıt listeden düşer (filtre `durum='bekliyor'` aktif olduğu sürece).

### İş Tanımı

- Migration: 30 dk
- Frontend (3 buton + 3 modal akışı): 1 saat
- Saha test: 30 dk
- Toplam: 2 saat — ayrı oturum (87 ana eksenle birleştirilebilir veya 88'e kayabilir)

---

## 87.D — Veri Borç Tanıları (~30 dk)

80+ oturumlardan kalan üç bilinen veri borcu. Tanı + ileriye taşıma kararı.

### 60.30×6.3 — Neden bağlanmadı?

`boru_olculer` tablosunda 60.30×6.3 kaydı **var** ama 056 migration sonrası bazı spool'larda `boru_olculer_id=NULL` kaldı. Sebep:

```sql
SELECT s.spool_no, sm.id, sm.dis_cap_mm, sm.et_mm, sm.kalite, sm.boru_olculer_id
FROM spool_malzemeleri sm
JOIN spooller s ON s.id = sm.spool_id
WHERE sm.tip = 'boru' AND sm.dis_cap_mm = 60.30 AND sm.et_mm = 6.3
  AND sm.boru_olculer_id IS NULL
LIMIT 10;
```

Hipotezler:
- 056 sadece spesifik standart/schedule kombinasyonlarını bağladı, 60.30×6.3 farklı
- Kalite eşleşmesi başarısız (master.kalite kodu uyumsuz)
- Boy/agirlik NULL olan satırlar bağlanmadı

Tanı sonrası ileriye taşıma migration (`063_60_30_6_3_baglanti.sql` gibi).

### 114.30×null — Eksik et değeri

PDF parse'de mi atlandı, kullanıcı boş mu bıraktı? Tanı:

```sql
SELECT s.spool_no, sm.id, sm.dis_cap_mm, sm.et_mm, sm.tanim, ai.kaynak
FROM spool_malzemeleri sm
JOIN spooller s ON s.id = sm.spool_id
LEFT JOIN ai_api_log ai ON ai.spool_id = s.id
WHERE sm.tip = 'boru' AND sm.dis_cap_mm = 114.30 AND sm.et_mm IS NULL
LIMIT 10;
```

`ai_api_log` üzerinden hangi PDF'ten geldiği belirlenebilir, ham parse çıktısına bakılır.

### 139.70×4.5 — 36 spool kalemi, standartta yok

Bu artık 87.C Phase 2'nin ilk büyük vakası olur: tenant-özel onay → boru_olculer'a `tenant_id` set ile INSERT.

### İş Tanımı

- 3 sorgu çalıştır + analiz: 30 dk
- Karar: ileriye taşıma migration yazılır mı yoksa Phase 2 ile mi çözülür?

---

## 87.E — `.gitignore` (tamamlandı, sadece teyit)

86 kapanışında eklendi:
```
*.bak.*
*.bak
spool_detay.html.bak*
```

`git status`'ta `.bak` dosyaları artık görünmez. Test: `cp spool_detay.html spool_detay.html.bak.test && git status` → temiz olmalı.

---

## 87.F — `CLAUDE.md` Ritüel Düzeltmesi (~5 dk)

Şu an CLAUDE.md (kök dizinde) ritüel adımında `CLAUDE-SON-OTURUM.md` ve `CLAUDE-SONRAKI-OTURUM.md` dosyalarını okuma talimatı var. **Gerçek konum:** `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md`.

86 açılışında bu hatayı yaşadık: ilk `cat CLAUDE-SONRAKI-OTURUM.md` çalıştırdığımda "no such file" hatası verdi, `docs/` ile düzelttim.

Düzeltme:
```bash
sed -i '' 's|CLAUDE-SON-OTURUM.md|docs/CLAUDE-SON-OTURUM.md|g' CLAUDE.md
sed -i '' 's|CLAUDE-SONRAKI-OTURUM.md|docs/CLAUDE-SONRAKI-OTURUM.md|g' CLAUDE.md
```

(macOS `sed -i ''` syntax)

---

## Önemli Test Spool'ları

| Spool ID | Senaryo |
|---|---|
| `465a641e-e466-422c-972b-a5a7a7d7b571` | 86.C v2.1 saha doğrulama — M1 boru tıkla, Standart+DN doldur, Kaydet → `tanimsiz_kayitlar` count > 0 |
| `46622aea-d732-4b66-9fba-bcadc1d354d2` | 86.A renk semantiği test (M2/M3/M4/M5 bağsız → gri) |
| `01485adf-aead-49b2-9734-00113053223d` | 86.B fitting içeren spool — Standart hücresi `geometri_std` test |
| `00d4926d-...` | 85 yiv satırı (uç işlemi muaf, ağırlık/heat/sert `—`) |

---

## Devreden Mimari Kararlar (KARAR-86.x)

- **KARAR-86.1** Kart + tablo + modal kenar rengi semantik simetri (3 renk)
- **KARAR-86.2** Tanımsız modal'da sebep formu yok; `tip='std_disi'` varsayılan
- **KARAR-86.3** Öneriler kütüphane akışının parçası; ayrı admin işi değil
- **KARAR-86.4** Ağırlık hesabı yoğunluk tablosu hard-code; bilinmeyen = "—"
- **KARAR-86.5** `tanimsiz_kayitlar.tip` = eksiklik kategorisi (parça tipi `ham_data.tip`)

---

## Devreden Mimari Kurallar (MK-86.x)

- **MK-86.1** zsh tek tırnak / base64 / heredoc `<<'DELIM'`
- **MK-86.2** Şema + CHECK + RLS doğrulanmadan RPC yok
- **MK-86.3** Model-UI simetrisi modal'a uzanır
- **MK-86.4** Mac terminale ~45KB+ base64 yapıştırma güvenilmez → `present_files`
- **MK-86.5** Eski admin sayfaları runtime uyumsuzluğu yaşatabilir

---

## 88+ ve Sonrası

- **88** — Public kütüphane sayfası (`arespipe.com/kutuphane`)
- **89+** — `parca_etiketleri` + üç-pencere etiketleme UI
- **90+** — `kutuphane_ogrenme_durumu` materialized view
- **91+** — İzometri parser KARAR-83.2 ileri uygulama
- **92+** — `spool_flansh_eslesme` junction DROP
- **93+** — Diğer uç işlemleri sözlüğe ekleme

---

> **87. oturum açılışında bu dosya, `.github/son-durum.md` ve `docs/CLAUDE-SON-OTURUM.md` okunacak.**
>
> **Son güncelleme:** 14 Mayıs 2026 — 86. oturum kapatma (87 gündemi kilitlendi)
