# 93. Oturum İçin Devralınan Bug Raporu

> **Talimat:** Bu belgenin tamamını 93. oturum chat'ine ilk mesaj olarak yapıştır. Claude bağlamı bu belgeden alıp doğrudan çözüm yoluna geçebilir.
>
> **Yazılma tarihi:** 16 Mayıs 2026 (92. oturum sonu — kapanış öncesi)

---

## TL;DR — Tek Bakışta

**Ana bug (P0):** `fitting_olculer` (569 satır) ve `flansh_olculer` (308 satır) tablolarında `malzeme_grubu` kolonu **tamamen NULL**. UI sayfası (`kutuphane-malzemeler.html`) `malzeme_grubu` ile gruplama/filtreleme yaptığı için bu **877 satırlık geometri verisi UI'dan görünmüyor**, sadece sayım gösteriyor ("308 flanş var" ama içine girince boş).

**İyi haber:** Kütüphane sandığımızdan dolu. 1.327 satır geometri verisi (450 boru + 569 fitting + 308 flanş) sistemde duruyor, sadece %66'sı görünür değil.

**92'de neden çözülmedi:** Test push sonrası yapıldı, bug push'tan önce yakalandı ama 92 zaten çok uzadı (3+ saat), Cihat doğru kararla "bug detayı 93'e aktarılsın" dedi.

---

## Bug 1 — fitting + flansh malzeme_grubu NULL (P0)

### Veri tabanı durumu (92. oturumda doğrulanan)

```
tablo    | toplam | malzeme_grubu dolu | NULL
---------|-------:|-------------------:|------:
boru     |    450 |               450 |    0
fitting  |    569 |                 0 |  569
flansh   |    308 |                 0 |  308
```

### Standart dağılımı

```
fitting_olculer:
  ASME B16.9  → 464 satır (butt-weld fittings: 90LR, 45LR, Tee, Reducer, Cap)
  ASME B16.11 → 105 satır (forged socket/threaded: socket-weld)

flansh_olculer:
  B16.5       → 216 satır (ASME flanges)
  EN-1092-1   →  92 satır (Avrupa flansları)
```

### Zaman damgaları

- fitting kayıtları: 1 May - 12 May 2026 arası seed edildi
- flansh kayıtları: 28 Nis - 12 May 2026 arası seed edildi

Yani bu bug 91. oturum öncesinde oluşmuş — seed migration'ları `malzeme_grubu` kolonunu doldurmamış.

### UI etkisi

`admin/kutuphane.html` (ana sayfa):
- `BORULAR: 450` ✅ gösteriyor, detaya tıklayınca 7 grup dolu
- `FITTINGS: 569` ⚠️ gösteriyor, detaya tıklayınca "0 ölçü · 0/7 malzeme grubu" — **veri görünmüyor**
- `FLANŞLAR: 308` ⚠️ gösteriyor, detaya tıklayınca "0 ölçü · 0/7 malzeme grubu" — **veri görünmüyor**

`admin/kutuphane-malzemeler.html?tablo=fitting_olculer` ve `?tablo=flansh_olculer` sayfaları bu yüzden boş.

### Kök neden analizi — 3 hipotez

**Hipotez 1 (en olası): Seed migration'ı eksik**
Fitting/flansh seed'leri yazıldığında `malzeme_grubu` kolonu doldurulmamış. Boru için doldurulmuş (450/450), tutarsızlık.

**Hipotez 2: Bilinçli mimari karar (KARAR-43 ile uyumlu)**
"Geometri ≠ malzeme" prensibi (43. oturum dersi) der ki: fitting/flansh tablolarında malzeme bilgisi olmamalı, çapraz uyum tablosundan gelmeli. Yani `malzeme_grubu` kolonu **bilerek** NULL bırakılmış olabilir — yanlış olan UI'ın bu kolona dayanması olur.

**Hipotez 3: Şema yanlış tasarlanmış**
`malzeme_grubu` kolonu fitting/flansh'ta yer almamalıydı, boru'dan kopya-yapıştır ile gelmiş, kullanılmamış. Boru için anlamlı (Sch 40 vs Sch 40S paslanmaz ayrımı), fitting/flansh için anlamsız (aynı geometri her malzemeden yapılır).

92. oturum analizine göre **Hipotez 2 + 3** birlikte doğru ihtimali yüksek. KARAR-43 mimari prensip, fitting/flansh'ta `malzeme_grubu`'na ihtiyaç yok.

---

## Çözüm Seçenekleri

### Seçenek A — Hızlı pragmatik fix (~30 dk)

`UPDATE` ile NULL'ları `'karbon'` doldur (çoğu fitting/flansh tipik olarak karbon çelik için listelenir).

**Migration 069 (örnek):**
```sql
UPDATE fitting_olculer SET malzeme_grubu = 'karbon' WHERE malzeme_grubu IS NULL;
UPDATE flansh_olculer  SET malzeme_grubu = 'karbon' WHERE malzeme_grubu IS NULL;
```

**Artılar:**
- UI hemen çalışır
- Detay sayfası 7 grup gösterir
- 30 dakikalık iş

**Eksiler:**
- KARAR-43'e mimari olarak ters (geometri ≠ malzeme)
- Yanlış varsayım: B16.9 paslanmaz tee de mevcut, hep karbon değil
- Sonra C seçeneği uygulanırsa bu UPDATE'i geri almak gerek

### Seçenek B — Mimari fix (~2 saat)

`malzeme_grubu` kolonunu fitting/flansh tablolarından **kaldır**. Detay sayfası `malzeme_grubu` ile gruplamayı bırakır, çapraz uyum tablosundan gelmeye başlar.

**Migration 069:**
```sql
ALTER TABLE fitting_olculer DROP COLUMN malzeme_grubu;
ALTER TABLE flansh_olculer  DROP COLUMN malzeme_grubu;
```

Plus:
- `admin/kutuphane-malzemeler.html` (generic detay sayfası) — fitting/flansh için ayrı render mantığı; "malzeme grubu" sekmesini kaldır
- Çapraz uyum tablolarından gelecek "Hangi malzemelerden üretilebilir" sekmesi/widget eklemek (93+ uzun vadeli iş)

**Artılar:**
- KARAR-43'e uygun, doğru mimari
- Geçici yamalama yok
- Çapraz uyum tablolarının (066/067) gerçek değer kazanmaya başladığı yer

**Eksiler:**
- UI işi daha uzun
- Detay sayfası fitting/flansh için ayrılır
- Migration geri alınamaz (kolonu silmek)

### Seçenek C — Erteleme (Hipotez 1 doğruysa: ~3 saat)

Hipotez 1'i kabul et, seed verisini yeniden çıkar. Her satırın gerçek `malzeme_grubu` değerini standart referansından çıkar:
- Boru için var olan örnekler kontrol et
- Fitting/flansh tipik üretici kataloğunda hangi malzeme için listelendi (genelde karbon ama paslanmaz da yaygın)
- Manuel inceleme + birden çok satır için aynı kayıt (örn. B16.9 90LR DN100 hem karbon hem paslanmaz)

**Bu en uzun, mimari olarak Yol B'den daha az temiz.**

---

## Önerim

**Seçenek B** (~2 saat).

Sebep:
1. KARAR-43 prensibine uygun
2. Çapraz uyum tabloları (066/067) zaten 92'de hazırlandı — kullanım yolu açılır
3. "Geometri ≠ malzeme" mimarisi netleşir, 93+ wizard ve UI'lar bu mantıkla yazılır
4. Geçici varsayım yok

**Ama:** Eğer pilot tersane bu hafta başlıyorsa ve sayfa görsel olarak boş görünmesin diyorsan, **Seçenek A** (~30 dk) ile pragmatik geç, sonra B'ye geri dön.

---

## Bug 2 — Kolon adı tutarsızlığı (P2, küçük)

92. oturumda Migration 067 yazılırken yeni tablolarda (`boru_malzeme_uyum`, `flansh_malzeme_uyum`) kolon adı **`olusturma_at`** kullanıldı. Ama mevcut tablolar (`boru_olculer`, `fitting_olculer`, `flansh_olculer`, `malzeme_kataloglari`) **`olusturma`** kullanıyor.

92'de oluşturulan yeni tablolar:
- `boru_malzeme_uyum.olusturma_at` ❌ tutarsız
- `flansh_malzeme_uyum.olusturma_at` ❌ tutarsız
- `arsiv.kayit_birlestirme_log.birlestirme_at` ❌ tutarsız (ama bu yeni audit tablosu, kabul edilebilir)
- `fitting_malzeme_uyum` — 91 öncesi tablo, kontrol et

**Karar:** `_at` suffix'ini Postgres dünyasında standart bir convention. Mevcut tabloları rename etmek riskli, ama yeni tablolarda `_at` kullanmaya devam edebiliriz. Tutarsızlık kalır ama yeni tablolar daha standart.

**Migration 069 ya da 070'te:**
- ya hepsi `_at` (eski tabloları rename — riskli)
- ya hepsi suffix'siz (yeni tabloları rename — kolay, az iş)

Önerim: Yeni tabloları suffix'siz rename et (`olusturma_at → olusturma`).

---

## Bug 3 — 92'de düzeltilen ama push bekleyen UI işleri

Aşağıdakiler 92'de yapıldı ama henüz push edilmedi. **93 başında push olduktan sonra Vercel'de görünecek:**

- **Bekleyen Öneriler kartı:** 92'den önce "1 bekliyor" diyordu ama içeride 2 görünüyordu. 92'de düzeltildi — kart artık iki sayımı birlikte gösterir ("2 havuz adayı · 1 inceleniyor" formatında)
- **Çakışmalar kartı:** Ana sayfada yeni kart eklendi, `kutuphane-cakismalar.html` sayfasına link verir
- **"Geçersiz tablo" mesajı:** `malzeme_kataloglari`, `fitting_malzeme_uyum`, `boru_malzeme_uyum`, `flansh_malzeme_uyum` satırları artık tıklanmaz; hover'da "Detay görünümü 93. oturumda eklenecek" tooltip gösterir
- **`ozel` kartı:** KARAR-91.B ile iptal edildiği için ana sayfadan silindi
- **Kütüphaneye Ekle butonu:** `kutuphane-oneriler.html` tablosunda her satırın yanında "+ Ekle" butonu, modal ile `ozel_parca_boru_kaydet` RPC'yi çağırır

93 başında **push sonrası canlıda test et**, hepsi çalışıyor mu doğrula. Bug bulursan listele.

---

## Ek Gözlem — Kütüphane Aslında Dolu

92. oturumda ortaya çıkan veri tablosu kütüphanenin sandığımızdan dolu olduğunu gösterdi:

```
Kayıt            | Sayı  | UI'da görünüyor mu
-----------------|------:|---------------------
boru_olculer     |   450 | ✅ evet
fitting_olculer  |   569 | ❌ malzeme_grubu NULL
flansh_olculer   |   308 | ❌ malzeme_grubu NULL
malzeme_katalog. |    20 | ✅ evet (ama detay yok, 93'te generic UI)
-----------------|------:|
TOPLAM           | 1.347 | %34 görünür
```

Bu bug çözüldüğünde kütüphane "boş gibi" görünmekten "zengin geometri tablosu" haline gelir. **Operasyonel olarak büyük artı** — pilot tersane başladığında PDF parse aşamasında geometri tanıma anında çalışmaya başlar (eğer çapraz uyum + malzeme grupları doğru bağlanırsa).

---

## 92'de Yapılanların Özeti (Hatırlatma)

Bu bilgi 92. oturum kapanış belgelerinde tam olarak var, burada sadece bağlam:

- **Migration 066** — `fitting_malzeme_uyum` FK fix (yanlış tablolar yerine `fitting_olculer` + `malzeme_kataloglari`)
- **Migration 066b** — Policy referansı fix (91'in eksiği, FK düzeltilmişti ama policy hâlâ eski tabloyu referanslıyordu)
- **Migration 067** — `boru_malzeme_uyum` + `flansh_malzeme_uyum` tabloları CREATE + RLS policy'ler
- **Migration 068** — Çakışma yönetimi: `arsiv.kayit_birlestirme_log` audit tablo + `v_kutuphane_cakismalari_listele()` RPC + `boru_kaydi_birlestir()` RPC
- **Yeni sayfa** — `admin/kutuphane-cakismalar.html`
- **Modal** — `admin/kutuphane-oneriler.html`'e "Kütüphaneye Ekle" form modalı
- **Küçük UI düzeltmeleri** — sayım tutarsızlığı, broken link tooltip, GRUPLAR güncellemesi, RPC dokümantasyonu

92'nin tüm değişiklikleri **mimari olarak sağlam** — bu raporda anlatılan Bug 1 92 öncesi, 92'de gözlemlendi.

---

## 93 Açılış Adımları (Önerilen)

1. **Push sonrası canlı test** (~10 dk) — yukarıdaki "92'de düzeltilen" maddelerin Vercel'de doğru göründüğünü doğrula
2. **Bug 1 için karar** — Seçenek A (hızlı, 30 dk) ya da B (doğru, 2 saat)
3. Karar verildikten sonra migration yaz, çalıştır, push

Bu raporu okuduktan sonra Claude direkt çözüm yoluna geçebilir, baştan anlatmana gerek yok.
