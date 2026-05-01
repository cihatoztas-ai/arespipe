# AresPipe — Son Durum

> **Son guncelleme:** 1 Mayis 2026 — 49. oturum kapandi
> **CI:** YESIL
> **Aktif oturum sayisi:** 49

---

## 49. Oturum Özeti

**Tema:** Async kuyruk altyapısı + frontend refactor. **48'in stratejik içgörüsü ("L2 öğrenme 50'ye, async altyapı 49'a") doğrulandı, hayata geçti.** Tarayıcı kapatılabilir + parse arka planda devam eder + tek dosyalı/çoklu PDF batch'leri sorunsuz işliyor.

49'un asıl gücü: **mimari kayma yapmadan büyük UX kazanımı.** Mevcut `izometri-oku.js` (1206 satır, hassas parse mantığı + halüsinasyon filtresi + cache + format dispatcher) **dokunulmadı.** Yeni 5 endpoint + 1 frontend refactor + 1 migration + 1 storage bucket = "client-driven loop"tan "server-driven kuyruk"a geçiş.

49 sekiz alt-iş hattıyla bitti:

1. **Migration 023 — `is_kuyrugu` tablosu** (3 FK, 5 index, 4 RLS policy, guncelleme_at trigger). Async parse kuyruğunun kalbi. Durum makinesi: bekliyor → isleniyor → tamam | hata | iptal. Stale lock cleanup için `parse_baslangic_at` esik kontrolü.

2. **Storage bucket `izometri-pdfs`** + 4 storage RLS policy (tenant izolasyonu `(storage.foldername(name))[1] = tenant_id`). Mevcut `arespipe-dosyalar` bucket'ından ayrı tutuldu — Knowledge Pack mimarisi (KARAR-48.1) için temiz lifecycle yönetimi. 10 MB limit, sadece application/pdf MIME type.

3. **`api/batch-baslat.js`** (109 satır) — yeni batch açar, batch_id döndürür. Frontend Storage upload'a hazırlanır.

4. **`api/batch-kuyruga-al.js`** (183 satır) — Storage upload sonrası tek çağrıda batched INSERT (Postgrest array body, 1000 kayıt tek SQL ile). Tenant izolasyon güvencesi: her `storage_path` `{tenant_id}/{batch_id}/` ile başlamalı.

5. **`api/kuyruk-isle.js`** (348 satır) — **49'un kalbi.** Self-trigger chain worker, hibrit pattern (function başına 2 PDF, sonra fire-and-forget ile zincir). Storage'dan PDF indir → izometri-oku'ya HTTP POST → kayıt güncelle → kalan iş varsa kendini tetikle. 5 dk stale lock cleanup, 3 deneme retry, 4xx kalıcı hata + 5xx geçici hata ayrımı.

6. **`api/kuyruk-durum.js`** (204 satır) — polling endpoint. Detaylı (her kayıt durumu) + özet sayılar + ilerleme yüzdesi + `tamamlandi` flag. UUID format kontrolü, paginasyon (limit 200 default, 1000 max).

7. **`api/batch-spoollari.js`** (249 satır) — async batch sonrası spool listesi + dosya eşleştirme. **5 katmanlı dosya_adi fallback** (en sağlamdan en zayıfa): _dosya field → pipeline_no eşleştirme (regex `\d{5}-\d{6}`) → tek dosyalı batch → dosya_sirasi map → "?". Çıktı dosya_sirasi'na göre sıralı (kullanıcı 100 PDF batch'inde kolay arar).

8. **Frontend refactor `izometri-batch.html`** (692 → 1015 satır) — `basla()` async akışı, paralel Storage upload (8 concurrency), polling (adaptif 3→8 sn), localStorage resume (sayfa kapanır-açılır), Excel yeni 3 kolon (Durum + Uyarılar + AI Notları) + autofilter + Malzeme Listesi 2. sekme (15 sütun, gerçek JSON yapısına göre).

**Cron safety net (`vercel.json`)** — Hobby plan günlük cron `0 3 * * *` (UTC). Chain mekanizması zaten çalışıyor, bu sadece "chain çökerse sabah otomatik kurtar" sigortası. Pro'ya geçilince dakikalık olabilir.

**`basari_orani` cache HIT fix** — Trigger `tg_basari_orani_guncelle` kuruldu. Her `ai_api_log` INSERT sonrası ilgili formatın `basari_orani` otomatik hesaplanır (`100 * basarili_log / toplam_log`). PAOR Ana Çizim: 26 kullanım, %100 başarı.

**Stratejik içgörüler ortaya çıkanlar (49 sırasında):**

- **Vercel Authentication "Standard Protection" function-to-function call'ları kırar.** Worker `process.env.VERCEL_URL` (deployment URL) ile self-call yapınca 401 alıyor → response HTML → "JSON degil" hatası. Çözüm: `VERCEL_PROJECT_PRODUCTION_URL` (sabit production URL `arespipe.vercel.app`) öncelikli kullan + Standard Protection'ı kapat. **Hobby planda preview deployment'lar yoksa Authentication faydasızdır.**

- **Frontend duplicate dosya kontrolü = doğru davranış.** Aynı PDF zaten cache HIT verir, yeniden Storage'a yüklemenin gereği yok. Storage'daki path benzersizliği `slugYap` timestamp ile sağlanır.

- **`sonuc_json` formatı `{spoollar:[...], dosya_sonuclari:[...]}` obje** — array değil. Spool seviyesinde `dosya_adi` yok, `pipeline_no` var. Eşleştirme dosya_adi'ndaki `\d{5}-\d{6}` pattern üzerinden yapılıyor (PAOR formatına özel ama 50'de generic'leştirilebilir).

- **AI çağrısı maliyeti gerçek ölçüm:** $0.036/PDF (vision token ağır, 22-32 sn parse). 50'de L2 sonrası bu **$0/PDF cache HIT veya öğrenilmiş format**, sadece bilinmeyen format ilk PDF'inde $0.036.

- **AI parse'da spool sayısı bazen yanılıyor.** PAOR-50600-101513 testinde AI tek spool çıkardı ama PDF'te `[1]` ve `[2]` köşeli parantezleri var (2 spool). AI `notlar`'da kendi şüphesini yazıyor ("kesim parçası mı spool mı emin değilim"). Excel'e **AI Notları** kolonu eklendi → kullanıcı 100 PDF batch'inde filtre ile şüpheli parse'ları yakalar. Prompt iyileştirmesi 50'de.

---

## Mimari Kararlar (49)

**MK-49.1 — `izometri-oku.js` HTTP üzerinden çağrılır, module import yok.** Worker (`kuyruk-isle.js`) parse için `izometri-oku`'ya `fetch POST` yapar. Refactor 51+'a ertelendi. Gerekçe: 1206 satırlık handler dokunulmaz tutulmalı (47 self-test felaketinin dersi). HTTP overhead 200ms — 24 sn parse'ın %1'i, marjinal.

**MK-49.2 — SELF_BASE_URL öncelik sırası: VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL.** `VERCEL_URL` deployment-spesifik korumalı URL, `VERCEL_PROJECT_PRODUCTION_URL` resmi sabit production URL. Fonksiyon-fonksiyon çağrıları için ikincisi gerekli. Manuel override için `ARES_PUBLIC_URL` env destekleniyor (custom domain alındığında).

**MK-49.3 — Self-trigger chain hibrit pattern: 2 PDF/function + fire-and-forget zincir.** In-process loop'ta max 2 PDF (Vercel 60s timeout altı güvenli, 24×2=48s), sonra response dönmeden `fetch(...).catch(...)` ile yeni invocation tetiklenir. Cron safety net opsiyonel — chain hatası nadir, ama Hobby planda günlük 03:00 UTC sigorta var.

**MK-49.4 — `parser_kural` metin pattern tabanlı, koordinat değil.** PDF içinde "yüzey alanı" sağ alt köşede iken bir başkasında sağ üst köşede çıksa bile regex (`GALVANIZATION:\s*(YES|NO|...)`) konum bağımsız çalışır. **Konum değişimine dayanıklı, sadece terim/yapı değişimine zayıf** (terim değişirse L3 fallback + 51+'da format evolution uyarısı).

**MK-49.5 — Cache HIT log yazmamak korunuyor (MK-48.4 sürdürüldü), `basari_orani` formülü dikkatli.** Cache HIT → `ai_api_log`'a yeni kayıt yok ama `kullanim_sayisi` artıyor. `basari_orani = basarili_log / toplam_log` formülü kullanılır (kullanim_sayisi yerine), aksi halde cache HIT'ler "başarısız" görünür. Trigger `tg_basari_orani_guncelle` bu formülü uygular.

**MK-49.6 — Dosya-spool eşleştirme pipeline_no öncelikli, fallback 5 katmanlı.** Sıralama: spool._dosya field → pipeline_no eşleştirme (regex `\d{5}-\d{6}` dosya_adi'nde geçer mi) → tek dosyalı batch (tüm spool'lar o dosyaya) → dosya_sirasi map → "?". Bu 100 PDF batch'inde de doğru eşleştirme sağlar. PAOR formatına özel regex 50'de generic'leştirilir.

**MK-49.7 — 3D model render = kod tarafında deterministik (Three.js benzeri), AI çağrısı içermez, $0 maliyet.** PDF parse'tan gelen `yon_dizilim` JSON'undan üretilir. AI'dan **şema verisi** alıyoruz (yön dizilimi, uzunluklar), 3D'yi **kod** üretiyor. 3D özelliği 52+'a, ana hat 49+50+51 (parse + öğrenme + envanter UI).

**MK-49.8 — İzometri PDF yükleme bileşeni hem devre wizard'ında hem devre detay sayfasında embed edilir, aynı backend endpoint'leri kullanır.** İzometri-batch münferit çalışmaya devam eder. Wizard 51+'da, devre detay tab'ı 51+'da. İkisi de `batch-baslat` + `batch-kuyruga-al` çağırır. Kullanıcı yeni devre açarken "atla" butonu var, sonradan devre detayından da yükleyebilir.

**MK-49.9 — Format öğretme mecburiyeti yok, ekonomik gereklilik.** Format öğretilmemiş PDF L3'e gider (sistem her zaman doğru sonuç verir, sadece pahalı). Müşteri 1000 PDF yükleyip kapatabilir, ilk PDF'in parse'ı bitince modal açılır "30 sn ver, sonraki 999 PDF 5 dk'da bitsin". Müşteri kapatırsa 1 saat sonra otomatik L3 fallback → 6 saat parse, ama yine biter. **Mecburiyet değil, UX teklifi.**

---

## Açık Borçlar

### Tamamlandı (49'da)
- ✅ Migration 023 — `is_kuyrugu` tablosu (8 kolon + 3 FK + 4 policy + trigger + 5 index)
- ✅ Storage bucket `izometri-pdfs` (10 MB, application/pdf, private) + 4 RLS policy
- ✅ `api/batch-baslat.js` — yeni batch
- ✅ `api/batch-kuyruga-al.js` — batched INSERT
- ✅ `api/kuyruk-isle.js` — self-trigger chain worker (hibrit pattern, 2 PDF/function)
- ✅ `api/kuyruk-durum.js` — polling endpoint (detaylı + paginasyon)
- ✅ `api/batch-spoollari.js` — spool listesi + 5 katmanlı dosya eşleştirme
- ✅ `izometri-batch.html` refactor — async akış + paralel upload + polling + resume + Excel 3 yeni kolon + Malzeme Listesi 2. sekme
- ✅ `vercel.json` cron safety net — günlük 03:00 UTC
- ✅ `basari_orani` trigger — otomatik güncelleme (cache HIT formülü)
- ✅ Vercel Authentication "Standard Protection" devre dışı (function-to-function call için)
- ✅ E2E test — 3 PDF batch, dosya eşleştirme doğru, Excel 2 sekme + AI Notları kolonu çalışıyor
- ✅ Süreç dersleri: zsh quote (parantez), GitHub UI fallback, Mac indirme bozuk

### KIRMIZI 50 ana teması — Format öğrenme döngüsü L2 (~5-6 saat)
**Vizyon Madde 4'ün operasyonel çekirdeği, 49'un mantıklı devamı.** Async altyapı kuruldu, şimdi öğrenme katmanı:

1. **Format öğretme akışı** (etkileşimli) — İlk PDF parse'ından sonra modal: PDF görüntülenir + AI'ın bulduğu alanlar yan panel + her alan için "evet / hayır / açıklama". Onay → AI 2. prompt ile `parser_kural` JSONB taslağı üretir.

2. **L2 parser engine** (`lib/l2-parser.js`) — `parser_kural` JSONB'sini okur, regex/text extract uygular, AI'a gitmeden sonuç üretir. Kabul kriterleri (zorunlu alanlar, min spool sayısı) → tutmuyorsa otomatik L3 fallback.

3. **`parser_kural` JSONB şeması v1** — schema_version, ekstraktor_tipi (regex_text), spool_blok (isaret_regex), alanlar map (kaynak/regex/grup), malzeme_tablosu (basliği/satir_regex/alan_haritasi), kabul_kriterleri, metadata (kaynak_log_idleri, ornek_pdf_sayisi).

4. **Handler entegrasyonu** — mevcut `izometri-oku.js` `parserKuralIle` STUB'ında L2 engine çağrılır (501 → gerçek implementasyon).

5. **Prompt iyileştirme: spool sayısı tespiti** — 49 testinde keşfedildi: AI bazen `[1] [2]` köşeli parantezleri "kesim listesi" diye yorumladı, gerçekte spool sayısıydı. Prompt'ta "SPOOL bölümü içindeki köşeli parantez = spool, PIPE CUT-LENGTHS içindeki <1> <2> = kesim parçası" netleştirilir.

6. **Format öğretme tetikleme:** İlk başarılı parse'tan sonra otomatik modal (Karar 49: c manuel buton DEĞİL, etkileşimli akış). Müşteri kapatıp giderse L3 fallback ile devam.

İlk hedef format: **PAOR Ana Çizim (paor_aveva_ana)** — 26 başarılı kullanım, çok zengin sample.

### KIRMIZI 51 — Format envanter UI + manuel onay UI iyileştirmesi (~3 saat)
- **Super_admin format envanter sayfası** — sistem hangi formatları tanıyor, kullanım, başarı, parser seviyesi, fingerprint, son N kullanım — read-only tablo. Detay panelinde "AI Taslak Üret" + "Aktif Et" butonları (49'a girmedi, 51'e ertelendi).
- **Manuel onay sayfasında "PDF'i yeni sekmede aç" butonu** — Storage signed URL + window.open. 15 dk iş.
- **Hatalı kayıt aksiyonları** — `kuyruk-yeniden-dene`, `kuyruk-sil`, `kuyruk-pdf-indir` endpoint'leri. UI butonları zaten görünür (Excel'de Durum kolonu var) ama backend implement edilmedi.
- **Polling sıklığı azaltma** — adaptif 3→8 sn şu an, batch tamamlandıktan sonra polling tamamen durur (zaten yapılıyor). Server-Sent Events (SSE) gerek olursa Pro plan'a geçince düşünülür.

### KIRMIZI 52+ — Wizard + format evolution + 3D ön çalışma
- **Devre yükleme wizard'ı** — 4 adım (üst bilgi + İzometri PDF opsiyonel + IFS opsiyonel + Onay). MK-49.8: PDF yükleme bileşeni embed.
- **Devre detay sayfası "İzometri Çizimleri" sekmesi** — sonradan PDF ekleme. MK-49.8 aynı bileşen.
- **Format evolution** — Sistem L3 fallback oranı izler ("Bu format için son 100 PDF'in 15'i L3'e düştü, kural eskiyor olabilir") → kullanıcıya format yeniden öğretme önerisi.
- **3D wireframe başlangıç** — `yon_dizilim` JSON'undan kod tarafında render (MK-49.7). AI çağrısı yok.

### SARI Kalan küçük 49 borçları (50 başına atılabilir, kritik değil)
- **`tv()` dil etiketleri eksik** — `izb_durum_yukleniyor`, `izb_durum_kuyrukta`, `izb_resume`, `izb_arkada_basladi` vb. yeni anahtarlar `ares-lang.js`'de yok. Fallback metin görünür ama Türkçe/İngilizce uyumsuz olabilir. 50/51'de `lang/tr.json` + `lang/en.json`'a eklenir.
- **OCR hataları AI parse'ında** — örn. "PLATE A GRADE 8000x2000x7" → "5000/20007Y" gibi okuma hataları. PDF kalitesine bağlı, prompt iyileştirmesi 50+ konusu.
- **Vercel cron yetkisi** — `0 3 * * *` ayarlandı, yarın sabah çalıştığını doğrulama (Vercel Dashboard → Cron Jobs sekmesi).
- **`pdf_format_kutuphane` ↔ `izometri_format_tanimlari` terminoloji ikiliği** — 48'de keşfedilmiş, hâlâ açık. 50/51'de tek isim seçilir.
- **`.github/son-durum.md` ↔ `son-durum.md` ikiliği** — 48'de keşfedildi, hâlâ açık.
- **Süreç dersi: zsh quote sorunu** — `()` parantez içeren commit mesajları zsh'i `quote>` prompt'una sokuyor. Çözüm: parantez kullanma (`fix 49 X` yeterli, `fix(49): X` değil).
- **Süreç dersi: GitHub web UI'dan dosya yüklemek pragmatik kurtarıcı** — indirme bozuk olduğunda doğrudan kopyala-yapıştır en güvenli. Lokal repo `git pull` ile senkron tutulur.

### KIRMIZI Veri/Strateji Belge Eksiklikleri (50+ kritik) — 48'den devralan
- **PDF Storage altyapısı** ✅ **49'da çözüldü** (Supabase Storage `izometri-pdfs` bucket). Path: `tenant_id/batch_id/dosya.pdf`. spool kaydı `is_kuyrugu.storage_path` ile bağlı.
- **`kullanici_duzeltmeleri` tablosu** — Tip 3 pasif öğrenme için. Manuel onay sırasında değişen alanlar burada birikecek. 51 oturum.
- **`OGRENME-STRATEJISI.md`** — Fine tuning YOK / RAG VAR ilkesinin belgesi. 3 tip öğrenme açıklamaları. **50 başında format öğrenme yazılırken referans dosya olarak yararlı.**
- **`VERI-TASINABILIRLIK.md`** — Tenant Data Pack + System Knowledge Archive ayrımı. KARAR-48.1 (B yaklaşımı) operasyonel hali. Müşteri sözleşmesinin temeli. 51+ oturum.
- **Knowledge Pack üretici script** — Aylık otomatik snapshot. İki paket: (1) Tenant Data Pack, (2) System Knowledge Archive. 52+ oturum.
- **`PROJE-DURUM.md`** — Genel sağlık özeti tek dosyada. 51+ oturum.
- **`EKONOMI-MODELI.md`** — Maliyet hesabı, fiyatlama, sürdürülebilirlik. 50 format öğrenme sonuçlarına göre 51+ yazılır.

### Hâlâ açık (47'den devralan, dokunulmadı)
- KK + Sevkiyat sayfa revizyonu (5+ oturumdur açık)
- Büküm modal açıklama alanı eksik
- boru_olculer şema güncellenmeli (tenant_id + sistem_preset)
- CuNi P0 grupları
- devre_yeni.html PDF upload akışı parser'a bağlanması (51+ wizard ile birlikte ele alınır)
- Cadmatic glyph reverse araştırması (49+)
- `public_feedback` Security Definer View tasarım kontrolü
- CLAUDE.md halüsinasyon filtresi 7→8 düzeltme

---

## Vizyon Disiplini

49'da yeni istisna **yapılmadı** ✓. Async kuyruk altyapısı (Vizyon Madde 4'ün operasyonel altyapısı), Excel raporlama güçlendirme (zaten zorunlu UX). Format öğrenme (Vizyon Madde 4 çekirdeği) 50'ye ertelendi.

**Stratejik kazanım:** 49 async kuyruk kurdu, 50'de L2 parser kuruluyor. İkisi birlikte = "ilk PDF $0.036, sonraki 999 PDF $0" senaryosu. **60× ekonomi mimarisi tamamlanıyor.**

❌ Pasif öğrenme — vizyonda kalır
❌ Tier'li servis modeli — vizyonda kalır
❌ Lazer tarama pipeline — vizyonda kalır
❌ STEP koordinat çıkarımı — vizyonda kalır
❌ Klasör yükleme + format tanıma — vizyonda kalır
❌ Çapraz validasyon (3 katman) — vizyonda kalır
❌ AI yön çıkarımı — vizyonda kalır

---

## Pilot Durumu

**PAOR pilot:** 49'da 12 saatte 6 yeni başarılı kullanım, toplam `kullanim_sayisi=26`, `basari_orani=100%`. Async kuyruk + cache + dosya eşleştirme + Excel raporlama tüm akış canlıda kanıtlandı. Tek bilinen küçük sorun: AI bazen spool sayısını düşük çıkarıyor (PAOR-50600-101513 testinde [1] [2] gerçekti, AI tek spool çıkardı). 50'de prompt iyileştirme + L2 parser ile çözülecek.

**Tersan pilot:** Henüz canlı kullanım yok (`kullanim_sayisi=0`). 50/51'de L2 parser PAOR'da kanıtlandıktan sonra Tersan formatına geçilecek.

---

## 49 Üretim Metrikleri

**Süre:** ~7 saat (büyük oturum)
**Yeni dosyalar:** 5 endpoint + 1 migration + 1 vercel.json güncelleme = 7
**Değişen dosyalar:** 1 (`izometri-batch.html`)
**Toplam yeni satır:** ~1300 (backend ~1100 + frontend +323)
**DB değişikliği:** 1 yeni tablo (`is_kuyrugu`) + 1 yeni storage bucket (`izometri-pdfs`) + 1 trigger (`tg_basari_orani_guncelle`) + 8 yeni RLS policy
**E2E test:** 3 farklı PDF, 5 spool, 20 malzeme satırı, dosya eşleştirme doğru, Excel 2 sekme

**Bozulan/regresyon:** Yok. `izometri-oku.js` dokunulmadı, münferit kullanıcı akışı (eski izometri-batch + tek PDF) hâlâ desteklenir (cache HIT bile çalışır).

**Token harcama analizi (24 saat, 49 testleri):** $0.218 toplam, 6 çağrı, ortalama $0.036/PDF. **50 sonrası beklenti:** L2 öğrenildikten sonra ortalama $0.001/PDF (60× tasarruf).

---

## Süreç Dersleri (49'dan)

**1. Vercel Authentication "Standard Protection" function-to-function call'ları kırar.** Worker `process.env.VERCEL_URL` (deployment URL) ile self-call yapınca 401 → HTML response → "JSON degil" hatası. **Çözüm:** `VERCEL_PROJECT_PRODUCTION_URL` öncelikli + Authentication kapat. Hobby planda Authentication faydasız.

**2. zsh quote sorunu commit mesajlarında.** `git commit -m "fix(49): X"` parantez yüzünden zsh'i `quote>` prompt'una sokar. Çözüm: parantezsiz `fix 49 X`, iki nokta yerine boşluk.

**3. Mac dosya indirme bozuk olabilir.** Aynı isimli dosyalar Downloads'ta birikiyor (`(1).js`, `(2).js`). Lokal repo'ya `mv` ile kopyalanırken yanlış sürüm geliyor. **Çözüm:** GitHub web UI'dan direkt edit + commit. Lokal `git pull` ile senkron.

**4. JSONB obje vs array varsayım kontrolü.** `sonuc_json` array sandık, obje çıktı (`{spoollar:[], dosya_sonuclari:[]}`). `jsonb_array_length()` patlar. **Çözüm:** önce `jsonb_typeof()` ile tip kontrolü, sonra format-bazlı işle.

**5. Function-to-function call HTTP overhead küçük (~200ms).** İzometri-oku module import yerine HTTP fetch ile çağrılınca 1206 satır dokunulmadı (47 self-test felaketi tekrarlanmadı). 24 sn parse'ın %1'i, marjinal.

**6. Pipeline_no eşleştirme PDF format'a özel.** PAOR `\d{5}-\d{6}` regex'i çalışıyor ama Cadmatic veya başka format'ta çalışmaz. Generic eşleştirme 50+'da format kütüphanesi olgunlaşınca yapılır.

**7. AI parse'da spool sayısı düşük çıkabilir.** PDF'te `[1] [2]` köşeli parantezleri ile `<1> <2>` cut-length etiketleri AI tarafından karıştırılabilir. Excel'e **AI Notları** kolonu eklendi → kullanıcı 100 PDF batch'inde filtre ile şüpheli parse'ları yakalar. Prompt iyileştirmesi 50'de.

**8. Cache HIT formül problemi.** `kullanim_sayisi` her PDF girişinde artıyor (cache HIT dahil), ama `ai_api_log` cache HIT'te yazılmıyor. `basari_orani = basarili_log / kullanim_sayisi` formülü cache HIT'leri "başarısız" sayar. Doğru formül: `basari_orani = basarili_log / toplam_log`. 49'da trigger ile çözüldü.

---

## 48. Oturum Özeti

**Tema:** Cache + Güvenlik. Gündem iki ana iş hattıyla netti, ikisi de bitti — ama oturumun gerçek değeri planlananın ötesinde, **49 stratejik yönünü kökten değiştiren içgörüler** ortaya çıktı.

48 üç paralel iş hattıyla bitti:

1. **021 migration + cache patch (api/izometri-oku.js)** — `pdf_sha256` kolonu + partial index, pdfHashHesapla + cacheKontrol helper'lar, handler'da formatTani sonrası cache lookup, visionAIParse'ın başarılı log'unda `cevap_full = parsed` yazılması. Canlıda kanıtlandı: **Aynı PDF 23 sn → 3 sn HIT (~7× hızlanma)**, `ai_api_log`'a yeni kayıt yazılmıyor (cache hit log'lanmaz, response'ta `_cache_meta` ile görünür).

2. **022 migration — RLS policy'leri** — Gündemdeki "5 tablo + 16 policy" planı doğrulamada **3 tablo + 8 policy** olarak küçüldü. Çünkü 12 production tablosu zaten RLS aktifti (gündem fazla iddialıydı). Yeni eklenenler: `markalama_listeleri`, `markalama_listesi_kalemleri` (parent FK kuralı: kalem'in tenant'ı parent listenin tenant'ıyla uyuşmalı, INSERT/UPDATE WITH CHECK), `test_spooller` (defansif, 0 satır).

3. **Önemli süreç keşfi: Vercel build cache invalidation tutarsız.** 47'de pdf-parse v1.1.1'e downgrade yapılmıştı ama Vercel sonraki deploy'da hâlâ eski cache'lenmiş `node_modules`'ı (v2.4.5 + pdfjs-dist + @napi-rs/canvas içeren) kullanıyordu. 48'de cache patch deploy'unda da `Restored build cache from previous deployment` görüldü → canlıda `@napi-rs/canvas` patladı (47'nin "fix"i aslında deploy'a hiç inmemişti). **Çözüm: "Use existing Build Cache" kapalı redeploy.** Yeni build temiz: 17 paket, pdf-parse v1.1.1, DOM-free.

**Stratejik içgörü ile sürpriz kazanım:** Cihat'ın "1000 spool / aynı format / aynı tersane" sorusu mimari netleştirdi. Cache mekanizması (48) **küçük versiyon**, gerçek mimari ihtiyaç **format öğrenme döngüsü** (49+). 1000 PDF aynı formatsa AI'a 1000 kez gitmesi mantıksız — bir kere AI öğrenir (parser_kural taslağı üretir), kalan 999 deterministik L2 parse ile çıkar (~100ms × 999 = ~100 sn). **49 wizard yapmaya değil, format öğrenmeye odaklanır.** Wizard (eğer gerekirse) 50+'a ertelendi, async kuyruk altyapısı (Vercel Cron + is_kuyrugu) ihtiyaç olmayabilir.

**NB1124+NB1125 senaryosu** (paralel ikiz gemi) ve **NB1124→NB1130 senaryosu** (yıl sonra kopya proje) konuşuldu. İkisinde de aynı 1000 PDF tekrar yükleniyor — cache HIT %100 vurur. Cache patch'in stratejik gerekçesi bu senaryolar (sadece "test gimnastiği" değil).

**`pdf_format_kutuphane` ≠ `izometri_format_tanimlari` keşfi:** Vizyon dokümanlarında "PDF Format Kütüphanesi" diye geçen kavram DB'de `izometri_format_tanimlari` adıyla yaşıyor. Terminoloji tutarsızlığı not edildi, 49'da gündeme gelir.

---

## Mimari Kararlar (48)

**MK-48.1 — Vercel build cache invalidation hassas paket değişimlerinde.** Önemli paket downgrade/upgrade sonrası ilk deploy'da **"Use existing Build Cache" kapalı redeploy zorunlu**. Aksi takdirde Vercel eski deploy'un node_modules cache'ini restore eder, package.json/lock değişikliği canlıya inmez. 47'de yaşandı (pdf-parse v1.1.1 downgrade'i deploy'a hiç inmemişti), 48'de keşfedildi. Kalıcı kural: paket değiştiren commit'ten sonra Vercel UI'da elle "cache'siz redeploy" + build log'da `Skipping build cache` doğrulaması.

**MK-48.2 — Cache mekanizması çok-anahtarlı: hash + format_id + tenant_id.** Cache lookup `pdf_sha256` + `format_id` + `tenant_id` + `basarili=true` + `cevap_full IS NOT NULL` üzerinden eşleşir. Tenant izolasyonu kritik (Tenant A'nın PDF'i Tenant B'ye sızmaz). Tenant içinde devre/batch ilişkisi yok — aynı tenant'ın farklı devresinden cache HIT alınabilir (NB1124→NB1125 senaryosu için doğal davranış). Cache hit `ai_api_log`'a yeni kayıt YAZMAZ (frontend `_cache_meta` ile bilir, analytics yine ölçülebilir).

**MK-48.3 — RLS bekçisi: 15 prod tablosu korumalı.** 48 öncesi 12 tablo aktifti, 48'de 3 tablo daha eklendi. Toplam 15 tabloda multi-tenant izolasyonu. Bir tablo özel: `markalama_listesi_kalemleri` parent FK kuralıyla — kalem'in tenant'ı sadece kullanıcı tenant'ıyla değil **parent listesinin tenant'ıyla da** uyuşmalı (data integrity, çapraz tenant referansı imkansız). Backend `SUPABASE_SERVICE_KEY` kullanıyor, RLS bypass eder — frontend Supabase client'ları RLS altında çalışır.

**MK-48.4 — Cache HIT log yazmama tasarım kararı.** Cache hit durumunda `ai_api_log`'a yeni kayıt yazılmaz (cevap eski kayıttan döndürülür). Sebep: `kullanim_sayisi` formatTani'da zaten arttırıldı (her PDF girişinde), AI çağrısı yapılmadığı için yeni log "false positive" olurdu. Analytics gerekirse Vercel function logs'tan response shape'i okuyup sayılabilir (`_cache_meta.cache_hit=true` filtresi). 49+ dashboard ihtiyaç olursa yeni `cache_hit BOOLEAN` kolonu eklenebilir, **ama 48'de eklenmedi (gereksiz şişme önlendi)**.

**MK-48.5 — Format öğrenme döngüsü 49'un asıl temasıdır, wizard değil.** 1000 spool × $0.02 = $20/batch maliyet sürdürülemez. Format öğrenme kurulduktan sonra: ilk PDF AI ($0.02), kalan 999 L2 deterministik ($0). 60× ekonomi. Wizard ve async kuyruk altyapısı (Cron + is_kuyrugu) **format öğrenme başarılı olursa gerek kalmayabilir** — L2 parse 1000 spool'u 5 dk'da bitirir, frontend sırayla await mekanizması yeter. Wizard 50+'a ertelendi. **49'da revize:** Async altyapı 49'da kuruldu (is_kuyrugu + Storage), L2 öğrenme 50'ye ertelendi. MK-48.5 ruhu korundu.

**MK-48.6 — Veri Sahipliği Politikası (KARAR-48.1).** İş modeli temel taşı:
- **Müşteri verisi müşterinin malıdır** (devreler, spool kayıtları, yüklenen PDF'ler, manuel girdiler, sevkiyat/KK kayıtları). Çıkışta Tenant Data Pack ile teslim edilir + sistemden silinir.
- **Anonim öğrenilmiş kurallar AresPipe'ın malıdır** (parser_kural, format fingerprint'leri, genel mühendislik desenleri, anonim istatistikler). Müşteri çıkışında sistemde kalır.
- Bu ayrım sözleşmede yazılır, kabul etmeyen müşteriye program verilmez.
- Endüstri standardı yaklaşım (B): Müşteriye saygılı + AresPipe değer önerisini koruyor + hukuken temiz. A (her şey müşterinin) sürdürülemez iş modeli; C (her şey AresPipe'ın) etik tartışmalı.
- 50+ oturumda `VERI-TASINABILIRLIK.md` ile sözleşme/teknik temel yazılır, Knowledge Pack üretici script kurulur.

**Strateji notu — Fine Tuning YOK, RAG VAR.** AresPipe Anthropic'in modelini eğitmiyor. Modelin etrafına 3 katmanlı hafıza inşa ediyor: (1) Format öğrenme — `parser_kural` JSONB'sine AI'nın çıkardığı kuralları biriktirme, (2) Veri birikimli akıl yürütme — geçmiş özet/dağılım AI prompt'una context olarak verilir, (3) Pasif öğrenme — kullanıcı düzeltmeleri biriktirilir. Anthropic AI sabit kalır, AresPipe sistemi öğrenir. Bu yaklaşım fine tuning'den **kat kat güçlü** çünkü Anthropic model güncellemeleriyle otomatik faydalanır, veri kontrolü tamamen bizde, maliyet düşük (sadece DB).

---

## Süreç Dersleri (48'den)

**1. Vercel build cache invalidation tutarsız.** Paket downgrade/upgrade'lerinde lock değişse bile Vercel eski cache'lenmiş node_modules'ı restore edebilir. 47'de yaşandı (deploy'a inmedi), 48'de keşfedildi (canlıda @napi-rs/canvas patladı). Kalıcı kural: önemli paket değişiminden sonra "Use existing Build Cache" kapalı manuel redeploy + build log'da `Skipping build cache` doğrulaması.

**2. Anthropic transfer katmanı 50KB+ dosyalarda truncate ediyor olabilir.** 48'de izometri-oku.js (49KB, 1205 satır) indirme denendi 7-8 kez, hepsi 45KB civarına kesildi. Çözüm: **patch (diff) formatı** + `git apply` ile uygulama. 8KB diff transfer'i temiz geçti, sonra MD5 ile kanıtlandı (içerik 100% doğru, sadece kozmetik whitespace farkı). Gelecekte 30KB+ dosya değişikliği için: patch formatı tercih, base64 encode son çare.

**3. Downloads klasörü versiyonlama riski büyüdü.** Aynı isimli `izometri-oku.js` dosyalarının `(1)`, `(2)`... `(11)` numaralı kopyaları birikiyor. Browser sade isimli dosyaya üzerine yazmıyor, "(N+1).js" oluşturuyor. Cihat `cp ~/Downloads/izometri-oku.js` yaparken **2 gün önceki dosyayı** kopyalıyordu. Çözüm: dosya isimlendirme tarihli yapma (`izometri-oku-48.js`) veya patch formatı.

**4. macOS base64 -d Linux'tan farklı argüman alıyor.** `base64 -d /tmp/file.b64` macOS'ta hata verir, doğrusu `base64 -d < /tmp/file.b64` veya `base64 -d -i /tmp/file.b64`. Cross-platform uyumluluk için stdin redirect (`<`) standardı.

**5. zsh interactive_comments off — `#` yorumları komut sayar.** "git checkout -- file.js  # yorum" yapısı zsh'da `error: pathspec '#' did not match` verir. Çözüm: `setopt interactive_comments` veya yorumsuz tek satırlık komutlar.

**6. Frontend'in "ölü taklidi" yapması = state hatası, kod hatası değil.** İzometri Batch sayfasında "Tekrar Çalıştır" basıldığında network'te POST görünmedi → ilk hipotez "kod kırılmış". Ama kod incelemesinde `if (d.durum === 'tamam') continue;` satırı bulundu — yani önceden başarılı parse edilmiş dosya tekrar parse edilmiyordu. Çözüm: `localStorage.clear() + reload + "Başla" butonu` (Tekrar Çalıştır değil). Frontend state karışıklıkları için **DB sorgusu kanıttır** — `ai_api_log`'a baktığımızda son 6 saatte 6 başarılı kayıt görmek "test gerçekten yapıldı" kanıtıydı.

**7. Cache mekanizması küçük versiyon, format öğrenme büyük versiyon.** Cache (48) aynı PDF tekrar yüklenirse $0 maliyet. Format öğrenme (49) farklı PDF'ler aynı formatsa $0 maliyet. İkincisi 60× daha değerli, ama birincisi 49 sonrası bile yararını korur (NB1124→NB1130 ve NB1124+NB1125 senaryoları).

---

> Migration disiplini hatırlatması (her DB değişikliği iki adımdır):
> 1. Önce Supabase SQL Editor → DB'ye uygula + doğrula
> 2. Sonra GitHub'a upload → CI yeşil → versiyonlama
> İkisi de yapılmadan migration "tamamlandı" sayılmaz.

> Paket disiplini (47'den, 48'de pekişti):
> 1. npm install öncesi Vercel runtime uyumluluğunu doğrula (DOM API, ESM/CJS, native bindings)
> 2. Container testi yetmez — Vercel preview deploy zorunlu
> 3. ESM'den eski paketleri import ederken `lib/` direkt path olabilir
> 4. **Paket downgrade/upgrade sonrası Vercel UI'dan "cache'siz manual redeploy"** (48 dersi)

> Dosya transfer disiplini (48-49'dan):
> 1. 30KB+ dosya değişikliği için patch formatı tercih (`diff -u → git apply`)
> 2. base64 encode (76-char wrapped, heredoc) son çare
> 3. Downloads klasöründe `(N).js` birikmesi → tarihli dosya adı (`-48-cache.js`) veya direkt patch
> 4. Mac indirme bozuk gelirse: GitHub web UI'dan direkt edit + commit (49 dersi)
