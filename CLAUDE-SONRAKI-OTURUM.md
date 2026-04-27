# 37. Oturum Gündemi — İzometri Batch Backend (Sıfırdan)

> **Tarih:** 28 Nisan 2026 veya sonrası
> **Tema:** Yeni `api/izometri-oku.js` (sıfırdan) + Ekran 2 (manuel onay UI) + Ekran 1 demo kapatma
> **Önkoşul:** 36 mimarisi (3 tablo + RLS + pilot AVEVA-PAOR) — ✅ kuruldu
> **Önkoşul belge:** `docs/IZOMETRI-BATCH-KARAR.md` (Karar 1-10) + bu dosya

---

## 37. Oturum Açılışı (~10 dk)

**Standart 5 soruluk ritüel** (CLAUDE.md), sonra:

### 1. 36 mimarisinin canlı doğrulaması (~3 dk)

Bu sorguyu çalıştır, çıktıyı yapıştır:

```sql
SELECT 'boru_olculer' AS tablo, COUNT(*) FROM boru_olculer
UNION ALL SELECT 'boru_standart_sozluk', COUNT(*) FROM boru_standart_sozluk
UNION ALL SELECT 'boru_dn_isim_eslesme', COUNT(*) FROM boru_dn_isim_eslesme
UNION ALL SELECT 'izometri_format_tanimlari', COUNT(*) FROM izometri_format_tanimlari
UNION ALL SELECT 'izometri_batch_kayitlari', COUNT(*) FROM izometri_batch_kayitlari
UNION ALL SELECT 'ai_api_log', COUNT(*) FROM ai_api_log;
```

**Beklenen:**
- boru_olculer = 358
- boru_standart_sozluk = 12
- boru_dn_isim_eslesme = 171
- izometri_format_tanimlari = 1 (pilot)
- izometri_batch_kayitlari = 0
- ai_api_log = 0

Tamamsa devam.

### 2. Cihat'tan örnek PDF kontrolü (~2 dk)

> *"36'nın sonunda 2-3 örnek PAOR/AVEVA PDF yüklemeni istemiştim. Pilot satırının parser_kural'ını öğretmek için lazım. Yükleyebildin mi?"*

- **Var:** 37 sonunda B Adımı (otomatik AI önerisi) → Cihat onaylar → AVEVA-PAOR pilot satırı dolar
- **Yok:** 37 PDF'siz ilerler. PAOR PDF gelirse manuel onay akışı çalışır (Vision API + manuel onay), parser kuralı 38'e kalır

### 3. db-backup saat kontrolü (~1 dk)

> *"27-30 Nis sabahları izlemedeyiz. arespipe-backups repo Commits saati TR 03:00-03:30 (UTC 00:00-00:30) mı?"*

Doğru saatteyse defter temizlenir, gözlem süresi biter.

### 4. Bugün hangi dosyalarla çalışacağız netleştir (~3 dk)

- `api/izometri-oku.js` — sıfırdan (eski silinir, yenisi yazılır)
- `izometri-batch.html` — demo modu kapatma + Ekran 2 alt sekmesi VEYA `izometri-batch-incele.html` ayrı dosya
- `lang/{tr,en,ar}.json` — yeni i18n string'leri
- (Cihat onaylarsa) Ekran 3 başlangıç (Format Kaydet diyalogu — B Adımı)

---

## 37. Oturumun Ana İşi

### Hedef

36'nın DB altyapısı koda bağlanır. Cihat'ın yaşadığı AI uydurma sorunu (PAOR yerine "50600-101358") yeni mimaride **çözülmüş** olarak çalışır. Manuel onay UI'sı şüpheli satırları operatöre düşürür. Demo modu kapatılır.

### Çıktılar

#### **1. Yeni `api/izometri-oku.js`** (~1-1.5 saat)

**Mimari:**

```
PDF gelir
  ↓
[Format Dispatcher] — fingerprint eşleştir, izometri_format_tanimlari'ndan format_id bul
  ↓
  ├─ Eşleşme + parser_kural dolu → L1 regex parser (sıfır token)
  ├─ Eşleşme + parser_kural boş    → L3 Vision API + manuel onay
  └─ Eşleşme YOK                   → L3 Vision API + tüm batch manuel onay
  ↓
[AI çağrısı varsa] — ai_api_log'a tam log (Yaklaşım Y prompt'u)
  ↓
[Sonuç doğrulayıcı] — 7 maddeli şüpheli satır kriterleri
  ↓
[ASME entegrasyonu] — boru_olculer'dan et/cap/iç çap/ağırlık doldur
  ↓
[Halüsinasyon kontrolü] — pipeline_no PDF dosya adı ile çapraz kontrol
  ↓
izometri_batch_kayitlari'na kaydet
  ↓
{ok, batch_id, sonuc_json, dogrulama_uyarilari, manuel_onay_sayisi}
```

**Yaklaşım Y prompt şablonu (genel/fallback):**

```
Sen bir tersane boru imalat sistemine PDF izometri parse asistanısın.

ÇOK ÖNEMLİ KURAL: PDF'te yazılı olmayan değer için NULL döndür. Tahmin yapma. Uydurma.

Sadece bu alanları çıkar:
- pipeline_no (çizim no veya başlıktan, raw)
- spool_no
- spool_count (toplam kaç spool var)
- dn (sadece sayı, DN yazısız: 150 değil "DN150")
- malzeme (Karbon Çelik | Paslanmaz Çelik | Alüminyum | Bakır Alaşım | Bilinmeyen)
- kalite_kodu (raw: ST37, A106-B, TP316L, 6061, CuNi 90/10 vb. — PDF'te ne yazılıysa)
- standart (raw: DIN 2448, ASME B36.10, JIS G3452 vb. — PDF'te ne yazılıysa, yoksa null)
- schedule_kod (PDF'te ne yazılıysa: 40, SCH40, STD, 10S, PN16, 20bar — null geçerli)
- et_mm (PDF'te T:X.X yazılıysa al, yazılı değilse NULL)
- boy_mm_listesi (CUT LENGTH değerleri — null geçerli)
- yuzey (Galvaniz | Boyalı | Asit | Siyah, GALVANIZATION YES kutusundan veya yazıdan)
- rev (revizyon harfi/kodu)

DİKKAT:
- "DN150 T:4.5" gibi yazıyorsa: dn=150, et_mm=4.5
- "DN150" yazıyor ama et yazılı değilse: dn=150, et_mm=null
- Pipeline_no kuralı: dosya adı 11D-PAOR-52900-101540-A.pdf ise pipeline 52900-101540'tır
- Spool numarası [1] [2] gibi köşeli parantez içindeyse: spool_count=2

Çıktı sadece JSON, başka hiçbir şey yazma.

ÖRNEK YOK — örnekleri verirsem AI onları kopyalıyor (few-shot leakage). Sadece şema.
```

**Format-spesifik prompt:** Eğer `izometri_format_tanimlari.prompt_template` doluysa onu kullan. Boşsa yukarıdaki genel kullan.

**Hesaplama tarafı (kod):**
- `dn` + `kalite_kodu` (ST37→karbon, 316L→paslanmaz, vs) + `standart` (varsa) → `boru_olculer` sorgu
- PDF'te `et_mm` varsa onu kullan, yoksa boru_olculer'dan al
- `boru_olculer` toleransa uyuyor mu kontrol (et_min ≤ pdf_et ≤ et_max)
- `dis_cap_mm`, `agirlik_kg_m`, `ic_cap_mm`, `hacim_l_m` boru_olculer'dan
- Tutarsızlık varsa şüpheli işaretle

**ai_api_log doldurma:**
- Her L3 çağrısında tam istek+yanıt JSONB olarak
- input/output tokens, maliyet (claude-haiku ≈ $0.25/1M input, $1.25/1M output)
- batch_id, format_id, kaynak='izometri_oku', cagri_tipi='L3_vision'

#### **2. Ekran 2 (Manuel Onay UI)** (~1 saat)

**Dosya:** `izometri-batch-incele.html` (ayrı sayfa, yeni)

**URL:** `/izometri-batch-incele.html?batch=<batch_id>`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ ← Geri (Batch Listesi)                                       │
│ Manuel Onay — Batch #abc123                                  │
│ Şüpheli Spool 3/9 [◀] [▶]                                    │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────┬─────────────────────────────────────┐ │
│ │ PDF Görüntüsü      │ AI Çıkardığı Veriler                │ │
│ │ (canvas, sayfa N)  │ Pipeline: [52900-101540-Z10-2     ] │ │
│ │                    │ Spool: [S01]                         │ │
│ │                    │ DN: [150]                            │ │
│ │                    │ Çap: 168.3 (boru_olculer'dan)        │ │
│ │                    │ Et: [4.5] ⚠ ASME 6.02 — DIN olabilir │ │
│ │                    │ Boy: [149+141+379]                   │ │
│ │                    │ Malzeme: [Karbon ▼] Kalite: [ST37]   │ │
│ │                    │ Yüzey: [Galvaniz ▼] Rev: [A]         │ │
│ │                    │                                       │ │
│ │                    │ Uyarılar:                             │ │
│ │                    │ • Et tolerans dışı (DIN şüphesi)     │ │
│ ├────────────────────┴─────────────────────────────────────┤ │
│ │  [Onayla ✓]  [Reddet ✗]  [Düzelt ↺]                      │ │
│ │                                                           │ │
│ │  [Bu formatı kaydet — sonraki PDF'ler ücretsiz parse]    │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**API endpoint'leri:**
- `GET /api/batch-detay?id=<batch_id>` — sonuc_json + uyarılar
- `POST /api/spool-onayla` — manuel onay/red/düzeltme
- `POST /api/format-kaydet` — Format Kaydet (B Adımı — 38'de tam, 37'de basit)

#### **3. Ekran 1 demo modu kapanışı** (~30 dk)

**Dosya:** `izometri-batch.html`

- `_DEMO_MOD = true` → `false`
- `_mockBatch()` fonksiyonu silinir
- Gerçek `/api/izometri-oku` çağrıları aktif
- "İncele →" butonu → `izometri-batch-incele.html?batch=<id>` navigasyon
- "Manuel Onay (X)" butonu → aynı navigasyon
- Yeni format banner gerçek tetikleyici ile çalışır

#### **4. i18n güncellemeleri**

`lang/tr.json`, `lang/en.json`, `lang/ar.json`:
- "Manuel onay bekliyor"
- "Format kaydet"
- "Bu spool şüpheli, kontrol edin"
- "Et kalınlığı tolerans dışı"
- "Pipeline numarası dosya adı ile uyuşmuyor"
- vs.

### Yapılış Sırası (önerilen)

| Saat | İş |
|---|---|
| 1 | 36 mimarisi doğrulama (3 dk) + yeni `izometri-oku.js` iskeleti (format dispatcher + ai_api_log) |
| 2 | `izometri-oku.js` Yaklaşım Y prompt + ASME entegrasyonu (boru_olculer sorgu) |
| 3 | `izometri-oku.js` halüsinasyon kontrolü + 7 maddeli şüpheli satır kriterleri + batch_kayitlari yazma |
| 4 | Ekran 2 (`izometri-batch-incele.html`) iskelet + listeleme |
| 5 | Ekran 1 demo modu kapatma + canlı test (Cihat PDF yüklemiştir) |

**Eğer 5 saatten uzun olur:** 38'e bölünür. 37'de izometri-oku + Ekran 2 listeleme, 38'de Ekran 2 düzeltme + Format Kaydet (B Adımı).

### Kapsam Dışı (37'de yapılmaz)

- **Format Kaydet diyalogu (Ekran 3) tam hali** — 38'de
- **B Adımı (AI harita önerisi)** — 38'de
- **C Adımı (görsel işaretleme/canvas)** — 39'da
- **Excel upload (IFS eğitim modu)** — 38'de
- **Genelleştirme onay UI** — 39'da
- **super_admin "AI API Kullanım" sekmesi** — 40'ta
- **Fitting/flanş tabloları** — 38-39

---

## Açılış Notları (Claude için)

### Sapmama Disiplini

- **36 mimarisini doğrulamadan ana işe başlama.** SQL sorgusu ile 6 tablo da kontrolden geçmeli.
- **PDF olmadan da dispatcher kurabiliriz.** Cihat 37'ye PDF yüklememişse, pilot AVEVA-PAOR satırı sayesinde generic test yapılabilir.
- **Halüsinasyon koruması zorunlu.** Pipeline_no dosya adıyla çapraz kontrol, et tolerans kontrolü, malzeme sözlük kontrolü — bunlar dispatcher'ın **çıkış filtresi**.
- **ASME entegrasyonu kritik.** Yaklaşım Y'nin kalbi: AI sadece okur, kod hesaplar. boru_olculer sorgusu her batch'te çalışır.

### Veri Kaynakları (37'de hazır)

- ✅ `boru_olculer` — 358 satır, 4 standart aktif
- ✅ `boru_standart_sozluk` — 12 standart, PDF tanıma için
- ✅ `boru_dn_isim_eslesme` — 171 NPS yazımı
- ✅ `izometri_format_tanimlari` — 1 pilot (parser boş, fingerprint dolu)
- ✅ `izometri_batch_kayitlari`, `ai_api_log` — boş tablolar, kullanıma hazır
- 🟡 PAOR PDF örneği — Cihat yüklerse 37'de format öğrenilir
- 🟡 IFS Excel — Cihat yüklerse cross-check yapılır (Karar 7)

### Sayfa Teslim Kontrol Listesi

- Lint geçer mi? `node .github/kontrol.js`
- G-08 yaygınlaştırma — yeni `izometri-batch-incele.html` standart uygula
- i18n — yeni metinler `tv()` ile, lang/{tr,en,ar}.json güncel
- RLS — izometri_batch_kayitlari ve ai_api_log policy'leri test edildi mi
- Halüsinasyon korumasının canlı testi — gerçek PDF ile

---

## Açık Sorular (37'de kararlaştırılır)

1. **Format fingerprint algoritması:** Şu an pilot AVEVA-PAOR'ın fingerprint'i `dosya_adi_regex` + `baslik_regex`. Yeterli mi? Yoksa PDF metadata + ilk sayfa metni de mi? (37 başında karar)

2. **Maliyet eşiği aşıldığında:** 50 PDF/ay default. Aşılırsa sert blok mu, sadece uyarı mı? (Brief Madde 04 → 38'de karar)

3. **Format-spesifik prompt VS genel prompt:** Pilot AVEVA-PAOR'da prompt_template şu an boş. Cihat PDF örneği yükleyince B Adımı ile dolar. O zamana kadar **genel prompt** yeter. Karar: 37'de tek genel prompt, format-spesifik 38'de.

4. **Ekran 2 navigasyonu — tek sayfa scroll mu, sayfa-sayfa mı?** Karar 8 (aynı batch tek format) → "Şüpheli Spool 3/9" pattern'i öneriliyor. 37'de bu uygulanır.

---

## Olası Risk

- **Prompt'ta few-shot leakage tekrarlanabilir.** AI'a "uydurma" demek yetmeyebilir. Test: gerçek PAOR PDF ile sonuç doğrulanmalı. Eğer hâlâ uyduruyor: prompt'a "GERÇEKTEN PDF'TEN OKU, EZBERDEN UYDURMA" gibi sertleştirme + sıcaklık 0.0.

- **boru_olculer sorgusu yanlış sonuç verebilir.** ASME B36.10M ile DIN 2448 farklı. PDF'te "DIN 2448" yazılıysa **kod B36.10M kullanmamalı**. Çözüm: standart sözlüğünden eşleme yap, yoksa null + manuel onay.

- **Vercel timeout 60s yetmeyebilir.** Büyük PDF + Vision API çağrısı uzayabilir. `maxDuration: 60` zaten var. Aşılırsa chunking veya 90s upgrade.

- **PDF base64 boyutu 4.5MB üstü olabilir.** Vercel body limit. Çözüm: PDF'i istemci tarafında küçült veya direct upload + URL.

---

## 38. Oturum Hatırlatıcı (37 bitince Cihat'a hatırlat)

> **38. oturum:** Ekran 3 (Format Kaydet) tam hali — B Adımı (AI harita önerisi) + Excel upload (IFS eğitim modu, Karar 7) + fittings tablo şeması. ZORUNLU SELF-TEST günü (33→38, 5 oturum).

---

> **Bu doküman 37. oturum açıldığında okunur. Önce 36 mimarisi doğrulama (5 dk), sonra İzometri Batch backend kodu.**
