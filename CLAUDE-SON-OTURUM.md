# Claude — 47. Oturum Arşivi

> **Tarih:** 29 Nisan 2026
> **Süre:** ~5 saat aktif çalışma (ritüel + vizyon → kararlar → 020 migration → fingerprint patch → pdf-parse uyumluluk hatası → fix → canlı doğrulama → kapanış)
> **CI:** YESIL
> **Migration sayısı:** 1 (020)
> **Yeni dosya:** package.json (varolan değişti), package-lock.json (yeni)
> **Değişen dosya:** api/izometri-oku.js (985→1113 satır), package.json
> **Kapanış:** DB temizliği + fingerprint skorlama canlıda. 5 mimari karar (MK-47.1→47.5). Önemli süreç dersi: Vercel paket uyumluluğu container testiyle yetmiyor.

---

## Bağlam

46 keşif oturumuydu, 6 mimari karar (MK-46.1→46.6) çıkarmıştı. 47'nin görevi bu kararları uygulamak: DB temizliği (4 kayıt + flag'ler) + fingerprint patch'i (skorlama, 4 sinyal). Plan netti, sadece körlemesine değil disiplinli yürütmek gerekiyordu.

47 plan büyük ölçüde tuttu **ama bir önemli sürpriz çıktı**: pdf-parse v2.4.5 (46 container testinde çalışan sürüm) Vercel serverless ortamında DOM API gerektirdiği için patladı. Bu uyumluluk problemi 1 saat ödetti, downgrade ile çözüldü, ama 47'nin ders olarak en değerli çıktısı oldu.

---

## Yapılanlar

### 1. Açılış Ritüeli (✅)

5/5 yeşil — 46 kapanışında not edilen disiplin tutuldu. Vizyon dosyaları (VIZYON-VE-MODULER-MIMARI.md + SPOOL-AI-VIZYON.md) bu sefer açılışta okundu (46'nın atladığı şey, 47 başında düzeltildi).

### 2. Stratejik Kararlar — DB Temizliği Tasarımı (✅)

Cihat *"tane tane gidelim step by step"* dedi → 4 ek karar:

**S1 — PAOR mevcut kaydının ad'ı değişsin mi?**
Cihat: (A) ad değişsin → "AVEVA E3D — PAOR Ana Çizim". Sonradan desen kararıyla "PAOR Ana Çizim" oldu (CAD program ayrı kolonda zaten).

**S2 — Tersan terminoloji + isim deseni:**
- Desen C: "PAOR Ana Çizim" / "Tersan M110 Montaj Resmi" (CAD program ayrı kolonda)
- Terminoloji γ: format_kodu İngilizce (sektör jargonu), ad Türkçe (UI tutarlı)
- Cadmatic mevcut kaydı **Spool olarak kalsın** (regex zaten Spool'a uyuyor), Isometry için yeni kayıt açıldı

**S3 — format_kodu JSONB içinde mi ayrı kolon mu?**
DB sorgusu sürpriz açıkladı: `format_kodu` kolonu zaten var (önceki bir migration eklemiş). JSONB'den çıkarıp kolona taşımak doğru. Cihat (b) seçti.

**S4 — Mevcut kayıtlar UPDATE mi DELETE+INSERT mi?**
FK kontrol sorgusu çalıştırıldı: `ai_api_log.format_id` ve `izometri_batch_kayitlari.format_id` ikisi de SET NULL davranışlı. Cihat *"hepsi test verisi, kaybedecek bir şey yok, teknik olarak en doğru neyse onu yapabiliriz"* dedi → DELETE + INSERT seçildi (en temiz).

### 3. Migration 020 — Format Tanımları Temizliği (✅)

**Dosya:** `migrations/020_format_tanimlari_temizlik.sql`

Eklenenler:
- `requires_ai BOOLEAN NOT NULL DEFAULT true`
- `requires_ocr BOOLEAN NOT NULL DEFAULT false`
- COMMENT'ler (MK-46.1 referansı dahil)
- Unique partial index `idx_format_tanimlari_format_kodu`

Silinenler:
- 2 eski test kaydı (id'leriyle DELETE — `2e7e8f0c-...` PAOR + `c8755d46-...` Tersan)
- FK SET NULL davranışlı, ai_api_log + izometri_batch_kayitlari log kayıtları korundu

Eklenen 4 yeni kayıt (gen_random_uuid):
| format_kodu | ad | cad_program | requires_ai | requires_ocr |
|---|---|---|---|---|
| paor_aveva_ana | PAOR Ana Çizim | AVEVA E3D | true | false |
| paor_aveva_iso_view | PAOR Isometric View | AVEVA E3D | true | false |
| tersan_cadmatic_isometry | Tersan M110 Montaj Resmi | Cadmatic | true | false |
| tersan_cadmatic_spool | Tersan M110 İmalat Resmi | Cadmatic | true | false |

Tümünde:
- `sistem_preset=true`, `tenant_id=NULL`, `aktif=true`, `kullanim_sayisi=0`
- Fingerprint dolu (4 sinyal: ulke, tersane, baslik_regex, dosya_adi_regex, pdf_uretici_anahtar; Cadmatic'lerde +tablo_baslik_regex)
- `parser_kural={}` (boş — gelecekte zenginleşir, MK-46.1)

**Önemli düzeltmeler 020'de:**
- PAOR Producer: eskiden `["AVEVA","STM"]` (kırık) → `["PDF-XChange"]` (gerçek metadata)
- PAOR Iso varyantı için ayrı dosya_adi_regex (`...-Isometric_View\.pdf$`)
- Tersan'ın 019'daki regex aslında Spool'a uyuyordu (`S\d+` içeriyor) — 020'de Spool olarak yeniden adlandırıldı, Isometry için yeni regex açıldı (`^M\d+-\d+-\d+\.\d+\.pdf$`)

Migration disiplini: Önce Supabase SQL Editor'da çalıştırıldı (4 satır doğrulandı), sonra GitHub'a upload edildi, CI yeşil dönene kadar beklendi. Disiplin tutuldu.

### 4. fingerprintEsler() Skorlama Patch'i — İlk Deneme (❌ patladı)

**Hedef:** MK-46.3'ün uygulanması — 4 sinyalli skorlama, eşik 2.

**Yazılanlar (izometri-oku.js, ilk hali):**
- `import { PDFParse } from 'pdf-parse';` (v2.4.5)
- `pdfIpucuCikar()` helper — PDF metadata + ilk 5K karakter ilk sayfa metni çıkarımı
- `fingerprintEsler()` skorlama — 4 sinyal, +1 puan, eşik 2 (boolean wrapper)
- `formatTani()` revize — pdfIpucuCikar tek seferde dışarıda çağırılıyor

**Lokal test 1 (5 senaryo):**
İlk denemede **3/5 hata** çıktı: aynı tersanenin iki kayıt (Ana/Iso, Iso/Spool) ortak sinyal paylaşıyor → ikisi de eşik geçiyor → "ilk tutan" mantığı yanlış kayıt seçebiliyor.

**Çözüm — Tasarım Refactor:**
- `fingerprintSkor()` ayrı fonksiyon (skor döner, max 4)
- `fingerprintEsler()` boolean wrapper (compat)
- `formatTani()` "en yüksek skor kazanır" mantığı (tie-breaker)

Skor dağılımı (lokal test 2):

| Senaryo | paor_ana | paor_iso | tersan_iso | tersan_spool | Kazanan |
|---|---|---|---|---|---|
| PAOR Ana | **3** | 2 | 0 | 0 | paor_ana ✓ |
| PAOR Iso | 2 | **3** | 0 | 0 | paor_iso ✓ |
| Cadmatic Isometry | 0 | 0 | **4** | 3 | tersan_iso ✓ |
| Cadmatic Spool (bozuk) | 0 | 0 | 1 | **2** | tersan_spool ✓ |
| Yabancı PDF | 0 | 0 | 0 | 0 | tanımsız ✓ |

Lokal test 5/5. Cadmatic Spool kritik kazanım: bozuk metinde başlık/tablo regex tutmasa da dosya adı + Producer = 2 puan, eşik geçiyor.

### 5. Vercel Deploy Hatası — pdf-parse v2.4.5 DOM API Sorunu (❌→✅)

**İlk push sonrası canlıda 500 FUNCTION_INVOCATION_FAILED.**

Vercel logs:
```
Warning: Cannot load "@napi-rs/canvas" package
ReferenceError: DOMMatrix is not defined
    at /var/task/node_modules/pdfjs-dist/legacy/build/pdf.mjs:15620:22
```

**Teşhis:** pdf-parse v2.4.5 → pdfjs-dist v4 → DOM API gerektirir (DOMMatrix, ImageData, Path2D). Vercel Node.js serverless'ta bu API'ler yok. 46'da container testinde çalışmıştı çünkü container Linux ortamı bu polyfill'leri sağlıyordu — Vercel'inkinden farklı runtime.

**Cihat sorusu:** *"teknik olarak doğrusu hangisi onu yapalım"* → forward fix (B) seçildi. Geri alma (A) önerimden vazgeçildi çünkü Cihat dürüst soru sordu, disiplin korkusunu değil gerçek doğruyu istedi.

**Container'da v1.1.1 testi:**
- v1.1.1 (2018, kendi pdfjs v1.10.100 bundle'lı, DOM-free)
- ESM'den `import 'pdf-parse'` doğrudan patladı: `ENOENT: ./test/data/05-versions-space.pdf` (debug mode tetikleyici, module.parent kontrolü ESM'de çalışmıyor)
- `import 'pdf-parse/lib/pdf-parse.js'` direkt path workaround → çalıştı
- Gerçek PDF testi: `info.Producer`, `info.Creator`, `text` hepsi mevcut

**izometri-oku.js güncellemesi:**
- Import: `import pdfParse from 'pdf-parse/lib/pdf-parse.js';` (default export)
- API: `await pdfParse(buffer)` (class instantiation kaldırıldı)
- Sentaks kontrol temiz, satır sayısı 1102→1113 (yorum genişledi)

**Downgrade:**
```bash
npm install pdf-parse@1.1.1 --save
# removed 3 packages, added 3 packages, changed 1 package
```

### 6. Atomik Commit + Push (✅, 1 fault tolerance gösterdi)

**Aksilik:** Cihat ilk denemede yanlış izometri-oku.js (`izometri-oku.js`, 962 satır — 27 Nisan tarihli eski sürüm) kopyaladı. Downloads klasöründe 13 farklı `izometri-oku*.js` dosyası vardı. Commit oluştu ama push reddedildi (CI bot'un yeni commit'i remote'taydı). 

**Düzeltme:** `git reset --soft HEAD~1` → doğru dosyayı bul (`izometri-oku (10).js`, 1113 satır) → kopyala → tekrar commit + pull --rebase + push.

Final commit hash: `99c2138`. CI yeşil, Vercel deploy 14s build, Ready.

### 7. Canlı Doğrulama (✅)

**Test:** PAOR ana PDF (`11D-PAOR-50600-101501-A.pdf`) izometri-batch.html üzerinden yüklendi.

**SQL kontrolü:**
```sql
SELECT format_kodu, kullanim_sayisi, son_kullanim_at FROM izometri_format_tanimlari ORDER BY format_kodu;
```

| format_kodu | kullanim_sayisi | son_kullanim_at |
|---|---|---|
| paor_aveva_ana | **1** | 2026-04-29 18:00:21+00 |
| paor_aveva_iso_view | 0 | NULL |
| tersan_cadmatic_isometry | 0 | NULL |
| tersan_cadmatic_spool | 0 | NULL |

✅ Doğru kayıt seçildi (paor_aveva_ana). Yanlış pozitif yok. Excel rapor temiz indi.

### 8. Maliyet/Süre Ölçümü — Sürpriz Bulgu (✅)

`ai_api_log` sorgusu son 3 çağrıyı gösterdi:

| Tarih | Süre | Maliyet | format_id |
|---|---|---|---|
| 27 Nis (47 öncesi) | 21.2 sn | $0.030 | **NULL** ❌ |
| 28 Nis (47 öncesi) | 18.9 sn | $0.026 | **NULL** ❌ |
| 29 Nis (47.B) | 19.7 sn | $0.034 | **dolu** ✅ |

**3 önemli bulgu:**

1. **Yavaşlık zaten vardı.** 18-21 sn → Anthropic Sonnet 4.5'in doğal yanıt süresi. 47.B pdf-parse marjinal yük (~1 sn) ekledi, ana yavaşlık 47 öncesi de mevcuttu.

2. **format_id NULL kanıtı.** 005 migration'dan beri canlı sistem fingerprint'i hiç tutmamış (47 öncesi log'da format_id boş). 47.B sonrası ilk kez dolu — patch'in en somut başarı kanıtı.

3. **Vercel Hobby timeout 10 sn değil.** 19.7 sn `http_status=200` döndü. Eski varsayım yanlış, muhtemelen 60 sn (2024+ pricing). Queue mimarisi (48 ana teması) acil değil.

---

## 5 Mimari Karar (MK-47)

| # | Konu | Karar |
|---|---|---|
| MK-47.1 | pdf-parse sürümü | v1.1.1 zorunlu (Vercel serverless DOM API uyumluluğu için). ESM'den `lib/pdf-parse.js` direkt path. Kalıcı kural. |
| MK-47.2 | Fingerprint tie-breaker | En-yüksek-skor kazanır (eşik ≥2 yetmez). Ortak sinyal paylaşan formatları dosya_adi_regex ayırt eder. |
| MK-47.3 | format_id loglanması | Her parse'da doğru kaydedilir (47 öncesi NULL'dı). Vizyon Madde 4 öğrenme döngüsünün veri zemini. |
| MK-47.4 | Vercel timeout | Hobby planı 19.7 sn'i karşılıyor — eski 10 sn varsayımı yanlış. Queue mimarisi acil değil, cache değerli ama yapısal zorunluluk değil. |
| MK-47.5 | Anthropic baseline | Sonnet 4.5 PDF parse 18-21 sn doğal süre. Cache (48) gerçek hız kazanımı için tek mekanizma (2. yüklemede 0 sn). |

---

## Önemli Bulgu Listesi

**1. pdf-parse v2.4.5 Vercel'de patlıyor.** pdfjs-dist v4 DOM API gerektirir. Container Linux'tan farklı runtime. Çözüm: v1.1.1 (kendi pdfjs v1.10.100 bundle'lı, DOM-free).

**2. v1.1.1 ESM'den `'pdf-parse'` direkt import patlar.** `module.parent` kontrolü ESM'de tutmuyor → debug mode tetiklenir → test data ENOENT. `'pdf-parse/lib/pdf-parse.js'` direkt path doğru kullanım.

**3. Mevcut Tersan kaydının regex'i aslında Spool'a uyuyordu.** 019 migration ad olarak "Tersan M110 Şablonu" demişti ama regex `S\d+` içeriyordu. 020'de Spool olarak yeniden adlandırıldı, Isometry için ayrı kayıt açıldı.

**4. format_kodu kolonu DB'de zaten varmış.** 020'de eklemeye gerek yoktu (önceki migration eklemiş, JSONB'de duplicate var). Test verisi olduğu için DELETE + INSERT'le sıfırdan dolduruldu.

**5. ai_api_log şeması zengin.** `cache_read_tokens`, `cache_write_tokens`, `sure_ms`, `format_id` zaten var. 48 cache mekanizması için yeni kolon (sadece pdf_sha256) yeter.

**6. Supabase Security Advisor 10 critical RLS uyarısı.** 5'i production tablosu (tenant_features, basamak_sablonlari, yetki_tanimlari, markalama_listeleri, markalama_listesi_kalemleri). Pratik etki şu an yok (tek tenant), 2. tenant gelmeden yapılması gerek. 48 ikinci teması.

---

## Önemli Öğrenmeler (Süreç Disiplini)

**1. Container test = Vercel test değil.** 46'da pdf-parse v2.4.5 container'da çalışmıştı, Vercel'de patladı. **Yeni paket ekleme protokolü (47'den itibaren):**
- Container'da test (sözdizimi + temel API)
- Vercel preview deploy testi (gerçek serverless runtime)
- Production push

Bu kalıp 1 saatlik kayıp ödetti, ders kalıcı. Migration disiplinine paralel "paket disiplini" oldu.

**2. Downloads klasörü versiyonlama riski.** 13 farklı `izometri-oku*.js` dosyası vardı (`(1)` ile `(10)` arası + uzantısız + PRE-A-38-fix). Doğru olan 1113 satır, yanlış kopyalandı 962 satır. **Çözüm:** Her `cp` sonrası `wc -l` doğrulaması zorunlu. Ya da daha iyisi outputs'tan repo'ya direkt script (47.B sonrası önerisi).

**3. git stash + pull --rebase + push 3'lüsü.** CI bot her oturum push atıyor (rapor güncellemeleri). Local push reddedilince standart kalıp. 47'de 2 kez yaşandı, kalıcı.

**4. npm cache permission sorunu.** 47 başında `EACCES` çıktı (eski `sudo npm install` kalıntısı). `sudo chown -R $(whoami) ~/.npm` kalıcı çözüm. Bir daha çıkmaz.

**5. Cihat'ın stratejik sorularına ciddi cevap.** *"teknik olarak doğrusu hangisi"* → disiplin korkusuyla "geri al" demek yerine forward fix doğru cevap. Vakit yorgunluğu sezgilerimi kısaltmamalı.

**6. Subjektif şikayetler ölçümle netleşir.** Cihat "yavaş geldi" dedi → ai_api_log → Anthropic API kaynaklı, 47 öncesi de aynıydı. Kulak yerine kanıt.

---

## Sayısal Özet

| Metrik | Değer |
|---|---|
| Migration uygulanan | 1 (020) |
| Yeni format kaydı | 4 |
| Silinen test kaydı | 2 |
| Yeni kolon | 2 (requires_ai, requires_ocr) |
| Yeni unique index | 1 (format_kodu) |
| izometri-oku.js satır artışı | 985 → 1113 (+128) |
| Yeni helper fonksiyon | 2 (pdfIpucuCikar, fingerprintSkor) |
| Yeniden yazılan fonksiyon | 2 (formatTani, fingerprintEsler) |
| Yeni npm dependency | 1 (pdf-parse v1.1.1, +3 alt) |
| Lokal test | 5/5 başarılı |
| Canlı test | 1/1 başarılı (PAOR ana) |
| Mimari karar (MK-47) | 5 |
| Açık borç (48 için) | 2 ana, 5 SARI |

---

## 47 Sonu Durum

✅ 020 migration uygulandı (DB temizliği)
✅ pdf-parse v1.1.1 yüklü
✅ izometri-oku.js fingerprint skorlama + en-yüksek-skor canlıda
✅ Lokal 5/5 + canlı 1/1 doğrulandı
✅ format_id artık ai_api_log'da doğru kaydediliyor
✅ Vercel + CI yeşil
✅ Süreç dersi: paket Vercel uyumluluğu test protokolü kuruldu

🔴 **48 ana teması:** Cache mekanizması (PDF SHA256 hash + ai_api_log lookup, 021 migration)
🔴 **48 ikinci teması:** RLS policy'leri (5 production tablosu için)
🟡 **48 SARI:** PAOR Iso parser_kural denemesi + CLAUDE.md halüsinasyon filtresi 7→8 + Karar 7 düzeltme + .gitignore + Security Definer View kontrolü

---

> 47 kapanışında yazıldı. Detaylı arşiv. 48 başında okunmaz, sadece geriye dönüp aranır.
> 47'nin gerçek değeri: 46 kararlarının operasyonel uygulaması + paket Vercel uyumluluğu süreç dersi.
