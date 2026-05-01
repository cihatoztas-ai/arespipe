# 49. Oturum Detaylı Özeti

> **Tarih:** 30 Nisan 2026 → 1 Mayıs 2026 (gece bitirme)
> **Süre:** ~7 saat
> **Tema:** Async kuyruk altyapısı + frontend refactor + Excel iyileştirme
> **Sonuç:** Tüm hedefler ✓, sistem canlıda kanıtlandı, kapanış temiz

---

## Açılış — 5 Cevap Ritüeli

Cihat:
1. `git pull` temizdi (`b722446..` ile başlangıç). Untracked yalnız `node_modules/`. ✓
2. GitHub Actions yeşil ✓
3. son-durum.md güncel (48 sonu). ✓
4. Gündem: 49 (PAOR `parser_kural` JSONB + L2 parser engine + admin "Format Öğretme")
5. Geri bildirim yok ✓

5/5 yeşil, doğrudan teknik işe girildi.

---

## Aşama 1: 48 Mirası + Stratejik Sorgulama (~30 dk)

PAOR formatının durumu sorgulandı:

```sql
-- PAOR Ana Çizim: 10 kullanım (8 önce + 2 yeni)
-- basari_orani: NULL (handler güncellemiyor — borç)
-- prompt_template: NULL
-- parser_kural: {} (henüz öğrenilmedi)
-- egitim_kaynagi: 'vision_only'
```

**Cihat'ın kritik soruları:**
- "Format öğretme nerede olacak? Müşteri öğretsin mi, AresPipe öğretsin mi?"
- "Mecburiyet var mı? Öğretmezse ne olur?"
- "Sistem hangi formatları tanıyor önizleme görebilirmiyiz?"
- "Bir kullanıcı 1000 PDF yükledi gitti, ben başında bekleyemem ki."

**Sentez — 49'un kapsamı yeniden çerçevelendi:**

48'in MK-48.5 kararı doğruydu (format öğrenme > wizard) ama **Cihat'ın "kapat-git" perspektifi temel UX gereksinimi olarak ortaya çıktı.** Wizard değil, **async altyapı + format öğrenme** birlikte ele alınmalıydı.

Üç yol seçeneği:
- A: Format öğrenme dar, async yok (eski plan)
- B: Sadece async, L2 yok
- **C: Hibrit, 49 + 50 ikiye böl** (Cihat'ın seçtiği)

Karar: **C — 49 async kurulum, 50 format öğrenme.** Bu seçim sayesinde Cihat ve kullanıcılar tarayıcıyı kapatıp gidebiliyor, ekonomi optimizasyonu 50'de geliyor.

---

## Aşama 2: Mimari Detay Konuşması (~45 dk)

Çoklu derin konu açıldı:

**1. Format öğrenme tetikleme:** (a) otomatik / (b) ilk N sonra / (c) manuel buton
- Önce (c) seçildi, sonra Cihat'ın "kullanıcı başında bekleyemem" sezgisiyle **etkileşimli akışa** dönüştü
- Karar: B seviyesi — PDF görüntü + yan panel + "evet/hayır/açıklama" (50'de)

**2. Eski formatta yeni alan / değer farkı vs konum farkı:**
- Cihat'ın asıl kastı: "yüzey alanı bir izometride sağ alt, başkasında sağ üst"
- **MK-49.4 kararı:** `parser_kural` metin pattern tabanlı, koordinat değil. Konum değişimine dayanıklı.

**3. 3D model maliyeti:**
- Cihat endişesi: "her seferinde token mu öderiz?"
- Cevap: 3D = kod tarafında deterministik, AI'a gitmiyor. **MK-49.7** olarak sabitlendi.

**4. Devre wizard vs devre detay:**
- Cihat sezgisi: "wizard sıkıştırır, detay sayfasından ekleyelim"
- Cevap: Wizard kalır ama "atla" butonlu, **aynı bileşen wizard ve detay sayfasında embed**. **MK-49.8** olarak sabitlendi.

**5. Format öğretme mecburiyeti:**
- Cevap: Mecburiyet yok, ekonomik gereklilik. **MK-49.9** olarak sabitlendi.

İki MK karar memory'ye yazıldı (49.A 3D, 49.B PDF yükleme bileşeni embed).

---

## Aşama 3: 49 Plan Bölünmesi (~15 dk)

Sekiz alt-iş hattı tanımlandı:
- 49.1 — `is_kuyrugu` migration
- 49.2 — Storage bucket + RLS
- 49.3 — `batch-baslat` + `batch-kuyruga-al`
- 49.4 — `kuyruk-isle` worker
- 49.5 — `kuyruk-durum` polling
- 49.6 — `batch-spoollari` (49.7'nin parçası olarak yapıldı)
- 49.7 — Frontend refactor
- 49.6b — `vercel.json` cron
- 49.9 — `basari_orani` fix
- 49 kapanış

3 önemli karar:
- Worker stratejisi: **γ hibrit (cron + chain)**
- Vercel planı: **Hobby** (Pro'ya sonra)
- Polling stratejisi: **basit polling** (SSE değil)

---

## Aşama 4: Teyit Sorguları + Migration 023 (~30 dk)

CIHAT-PROFIL.md dersi: "Kolon adlarını tahmin etme — information_schema sorgusu yap."

3 teyit sorgusu çalıştırıldı:
- A: Tablo adları (`tenants`, `kullanicilar`, `izometri_batch_kayitlari`, `ai_api_log` — hepsi UUID)
- B: FK tipleri uyumlu
- C: `izometri_batch_kayitlari` 18 kolon (sonuc_json JSONB var)
- Storage: tek bucket `arespipe-dosyalar`, yeni `izometri-pdfs` ekleniyor

**Migration 023 — `is_kuyrugu`:**
- 18 kolon (id, tenant_id, kullanici_id, batch_id, storage_bucket, storage_path, dosya_adi, dosya_boyut, dosya_sirasi, dosya_toplami, durum, hata_mesaji, deneme_sayisi, parse_baslangic_at, parse_bitis_at, olusturma_at, guncelleme_at, ai_api_log_id)
- 5 index (3 manuel + 2 unique)
- 4 RLS policy (SELECT/INSERT/UPDATE/DELETE)
- 2 CHECK constraint (durum enum, deneme_sayisi range)
- 1 trigger (guncelleme_at otomatik)
- 4 FK (tenants CASCADE, kullanicilar RESTRICT, izometri_batch_kayitlari CASCADE, ai_api_log SET NULL)

D1-D6 doğrulamaları hepsi yeşil.

---

## Aşama 5: Storage Bucket + RLS (~15 dk)

Cihat Supabase Studio'dan bucket oluşturdu:
- Name: `izometri-pdfs`
- Public: false
- File size limit: 10 MB (önce 25 MB önerildi, 10 yeterli)
- MIME types: `application/pdf`

4 storage RLS policy SQL ile:
- SELECT (tenant + super_admin)
- INSERT (tenant kendi klasörü)
- UPDATE (tenant kendi klasörü)
- DELETE (tenant + super_admin, KARAR-48.1 müşteri çıkışı)

Path mantığı: `(storage.foldername(name))[1] = tenant_id::text`

---

## Aşama 6: 4 Backend Endpoint (~1.5 saat)

**`api/batch-baslat.js`** (109 satır) — Yeni batch açar, batch_id döndürür. supaFetch helper kopya (50/51'de lib/supabase.js'e taşınır).

**`api/batch-kuyruga-al.js`** (183 satır) — Storage upload sonrası batched INSERT. Tenant izolasyon güvencesi: her storage_path `{tenant_id}/{batch_id}/` ile başlamalı, .pdf uzantı zorunlu.

**Smoke test 1 (curl):** İki endpoint çalıştı. İlk hata: BATCH_ID_BURAYA placeholder validation tarafından yakalandı (fail-loud doğru çalışıyor).

**`api/kuyruk-isle.js`** (348 satır) — **49'un kalbi.**
- Self-trigger chain hibrit: function başına 2 PDF
- Storage'dan PDF indir → izometri-oku'ya HTTP POST → kayıt güncelle
- 5 dk stale lock cleanup
- 3 deneme retry, 4xx kalıcı / 5xx geçici ayrımı

**`api/kuyruk-durum.js`** (204 satır) — polling endpoint, 3 paralel sorgu (Promise.all).

3 smoke test yeşil:
- Boş batch polling ✓
- Var olmayan batch (404) ✓
- Geçersiz UUID (400) ✓

---

## Aşama 7: Frontend Refactor — `izometri-batch.html` (~2 saat)

Strateji: **minimum invaziv refactor.** HTML+CSS dokunulmadı (1-287 satır), sadece JavaScript yeniden yazıldı.

Eski 692 satırlık dosya → 1015 satıra çıktı. Yeni fonksiyonlar:
- `basla()` — async akış (Storage upload → kuyruk → worker → polling)
- `dosyalariStorageYukle()` — 8 paralel concurrency
- `slugYap()` — Türkçe karakter + timestamp
- `pollingBaslat/Dur/Tetikle/Zamanla/Uygula` — adaptif 3→8 sn
- `batchTamamlandi()` — spool listesi çek + UI render
- `aktifBatchKontrol()` — localStorage resume

**`api/batch-spoollari.js`** (197 → 249 satır, 5. endpoint) — Async batch sonrası spool listesi. 5 katmanlı dosya eşleştirme (pipeline_no öncelikli).

---

## Aşama 8: Test + Bug Fix Maratonu (~1.5 saat)

**İlk test:** 1 PDF yükle, "parse cevabi JSON degil" hatası — Vercel Authentication Standard Protection 401 dönüyor. **Çözüm:** Cihat Authentication kapattı + `SELF_BASE_URL` öncelik sırası değişti (`VERCEL_PROJECT_PRODUCTION_URL` öne).

**İkinci test (1 PDF):** Parse başarılı ama spool tablosu boş, "Excel İndir" pasif. **Çözüm:** `batch-spoollari.js`'in `duzlestir()` fonksiyonu yanlış format varsayıyordu. `sonuc_json` array değil obje (`{spoollar:[], dosya_sonuclari:[]}`).

**Üçüncü test (1 PDF):** Excel geldi ama 1 sekme. **Çözüm:** Eski `excelIndir()` 2 sekme yapıyordu (Spool + Malzeme), refactor sırasında kayboldu. Geri eklendi, kolonlar gerçek JSON yapısına göre düzeltildi.

**Dördüncü test (4 PDF):** Excel 2 sekme, 4 spool, 22 malzeme. AMA `Dosya` kolonu "?" çıkıyor, sıralama yok. **Çözüm:** Pipeline_no eşleştirme + dosya_sirasi sıralama eklendi.

**Beşinci test (3 PDF — 101501, 101409, 101408):** Mükemmel sonuç:
- Sırasıyla sıralı
- Dosya kolonu doğru
- 5 spool (101409 ve 101408 için 2'şer, AI doğru tespit etti)
- 20 malzeme satırı
- Yeni "AI Notları" kolonu dolduruldu

**Cihat'ın spool sayısı endişesi:** PAOR-50600-101513'te AI tek spool çıkardı (gerçek: 2). Bu prompt sorunu, 50'ye ertelendi. Çözüm yolu: Excel'e AI Notları + Uyarılar kolonları → kullanıcı 100 PDF batch'inde filtre ile yakalar.

---

## Aşama 9: Tam Kapanış (~45 dk)

3 kalan iş yapıldı:
- **49.6b vercel.json cron:** Mevcut header'lar bozulmadan crons alanı eklendi (`0 3 * * *` UTC)
- **49.9 basari_orani fix:** Trigger `tg_basari_orani_guncelle` kuruldu. PAOR: 26 kullanım, %100 doğru hesaplandı.
- **49 kapanış:** 3 dosya güncellendi (son-durum.md, CLAUDE-SON-OTURUM.md, CLAUDE-SONRAKI-OTURUM.md)

Token analizi (24 saat):
- 6 çağrı, $0.218 toplam
- Ortalama $0.036/PDF
- 50 sonrası beklenti: $0.001/PDF (60× tasarruf)

---

## Mimari Kararlar Özet

| # | Karar | Etki |
|---|---|---|
| **MK-49.1** | izometri-oku.js HTTP üzerinden çağrılır | 1206 satır dokunulmaz, 47 self-test felaketi tekrarlanmadı |
| **MK-49.2** | SELF_BASE_URL: VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL | Standard Protection 401 sorunu çözüldü |
| **MK-49.3** | Self-trigger chain hibrit, 2 PDF/function + cron safety net | Vercel 60s timeout altı + chain dayanıklı |
| **MK-49.4** | parser_kural metin pattern tabanlı, koordinat değil | Konum değişimine dayanıklı (50+) |
| **MK-49.5** | Cache HIT log yazmamak korunuyor, basari_orani formülü dikkatli | Cache HIT'ler "başarısız" görünmez |
| **MK-49.6** | Dosya-spool eşleştirme pipeline_no öncelikli, 5 katmanlı fallback | 100 PDF batch'inde doğru eşleştirme |
| **MK-49.7** | 3D model render = kod tarafında, AI çağrısı yok | $0 maliyet, 52+'ya planlandı |
| **MK-49.8** | İzometri PDF yükleme bileşeni hem wizard hem devre detay'da embed | Aynı backend endpoint, kod tek yerde |
| **MK-49.9** | Format öğretme mecburiyeti yok, ekonomik gereklilik | Müşteri kapatabilir, sistem L3 ile devam eder |

---

## Süreç Dersleri

**1. Vercel Authentication Standard Protection function-to-function call'ları kırar.** Worker `process.env.VERCEL_URL` ile self-call yapınca 401 → HTML response → "JSON degil". Hobby planda Authentication faydasız (preview yok). Çözüm: production URL öncelikli + Authentication kapat.

**2. zsh quote sorunu commit mesajlarında.** Parantez `()` zsh'i `quote>` prompt'una sokar. Çözüm: parantezsiz commit mesajları.

**3. Mac dosya indirme bozuk olabilir.** Aynı isimli dosyalar Downloads'ta birikiyor, lokal repo'ya yanlış sürüm gidiyor. **GitHub web UI'dan direkt edit + commit** pragmatik kurtarıcı.

**4. JSONB obje vs array varsayım kontrolü.** `jsonb_array_length()` obje üzerinde patlar. Çözüm: önce `jsonb_typeof()`.

**5. Function-to-function HTTP overhead küçük (~200ms).** 24 sn parse'ın %1'i. izometri-oku.js dokunulmadı (refactor 51+'a).

**6. Pipeline_no eşleştirme PDF format'a özel.** PAOR `\d{5}-\d{6}` çalışıyor, başka format'ta çalışmaz. Generic eşleştirme 50+'da.

**7. AI parse'da spool sayısı düşük çıkabilir.** `[1] [2]` köşeli parantez vs `<1> <2>` cut-length etiketleri AI tarafından karıştırılabilir. Excel'e AI Notları kolonu eklendi → kullanıcı yakalar. Prompt iyileştirmesi 50'de.

**8. Cache HIT formül problemi.** `kullanim_sayisi` her PDF girişinde artıyor (cache HIT dahil), ama `ai_api_log` cache HIT'te yazılmıyor. Doğru formül: `basari_orani = basarili_log / toplam_log` (kullanim_sayisi yerine).

---

## 49'da Üretilen Dosyalar

| # | Dosya | Satır | Durum |
|---|---|---|---|
| 1 | `migrations/023_is_kuyrugu.sql` | ~220 | ✓ Supabase'te uygulandı |
| 2 | `api/batch-baslat.js` | 109 | ✓ Canlıda |
| 3 | `api/batch-kuyruga-al.js` | 183 | ✓ Canlıda |
| 4 | `api/kuyruk-isle.js` | 348 | ✓ Canlıda |
| 5 | `api/kuyruk-durum.js` | 204 | ✓ Canlıda |
| 6 | `api/batch-spoollari.js` | 249 | ✓ Canlıda |
| 7 | `izometri-batch.html` | 692 → 1015 | ✓ Canlıda |
| 8 | `vercel.json` | +6 satır cron | ✓ Canlıda |

DB değişikliği:
- 1 yeni tablo: `is_kuyrugu`
- 1 yeni storage bucket: `izometri-pdfs`
- 1 yeni trigger: `tg_basari_orani_guncelle`
- 8 yeni RLS policy (4 tablo + 4 storage)

---

## 50'ye Geçerken

**50 gündemi: Format öğrenme döngüsü L2.** 49'un mantıklı devamı.

İlk hedef format: **PAOR Ana Çizim** (`paor_aveva_ana`) — 26 başarılı kullanım, çok zengin sample.

50'de yapılacaklar:
1. Etkileşimli format öğretme akışı (PDF görüntü + yan panel onay)
2. L2 parser engine (`lib/l2-parser.js`)
3. `parser_kural` JSONB şeması v1
4. Handler entegrasyonu (mevcut `parserKuralIle` STUB → gerçek)
5. Prompt iyileştirme: spool sayısı tespiti
6. Format öğretme tetikleme (modal otomatik)

**Beklenen kazanım:** Aynı format → ilk PDF $0.036, sonraki 999 PDF $0. **60× ekonomi mimarisi tamamlanır.**

---

## Kapanış Notu

49 büyük oturumdu (~7 saat). Mimari kayma yapmadan büyük UX kazanımı: tarayıcı kapatılabilir, parse arka planda devam eder. `izometri-oku.js` 1206 satırına dokunulmadı (47 dersi). 9 mimari karar dokümante edildi.

Token harcama bilinçli kabul edildi — 50'de L2 parser kurulduğunda asıl ekonomi gelecek. Şu an "ilk PDF $0.036" beklenen davranış (yeni içerik, yeni hash, AI çağrısı doğal).

Sistem **canlıda kanıtlandı:** 3 PDF batch, 5 spool, 20 malzeme, dosya eşleştirme + sıralama doğru, Excel 2 sekme + AI Notları + Uyarılar + autofilter çalışıyor.

50'ye temiz başlangıç hazır.
