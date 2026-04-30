# AresPipe — Son Durum

> **Son guncelleme:** 30 Nisan 2026 — 48. oturum kapandi
> **CI:** YESIL
> **Aktif oturum sayisi:** 48

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

**MK-48.5 — Format öğrenme döngüsü 49'un asıl temasıdır, wizard değil.** 1000 spool × $0.02 = $20/batch maliyet sürdürülemez. Format öğrenme kurulduktan sonra: ilk PDF AI ($0.02), kalan 999 L2 deterministik ($0). 60× ekonomi. Wizard ve async kuyruk altyapısı (Cron + is_kuyrugu) **format öğrenme başarılı olursa gerek kalmayabilir** — L2 parse 1000 spool'u 5 dk'da bitirir, frontend sırayla await mekanizması yeter. Wizard 50+'a ertelendi.

**MK-48.6 — Veri Sahipliği Politikası (KARAR-48.1).** İş modeli temel taşı:
- **Müşteri verisi müşterinin malıdır** (devreler, spool kayıtları, yüklenen PDF'ler, manuel girdiler, sevkiyat/KK kayıtları). Çıkışta Tenant Data Pack ile teslim edilir + sistemden silinir.
- **Anonim öğrenilmiş kurallar AresPipe'ın malıdır** (parser_kural, format fingerprint'leri, genel mühendislik desenleri, anonim istatistikler). Müşteri çıkışında sistemde kalır.
- Bu ayrım sözleşmede yazılır, kabul etmeyen müşteriye program verilmez.
- Endüstri standardı yaklaşım (B): Müşteriye saygılı + AresPipe değer önerisini koruyor + hukuken temiz. A (her şey müşterinin) sürdürülemez iş modeli; C (her şey AresPipe'ın) etik tartışmalı.
- 50+ oturumda `VERI-TASINABILIRLIK.md` ile sözleşme/teknik temel yazılır, Knowledge Pack üretici script kurulur.

**Strateji notu — Fine Tuning YOK, RAG VAR.** AresPipe Anthropic'in modelini eğitmiyor. Modelin etrafına 3 katmanlı hafıza inşa ediyor: (1) Format öğrenme — `parser_kural` JSONB'sine AI'nın çıkardığı kuralları biriktirme, (2) Veri birikimli akıl yürütme — geçmiş özet/dağılım AI prompt'una context olarak verilir, (3) Pasif öğrenme — kullanıcı düzeltmeleri biriktirilir. Anthropic AI sabit kalır, AresPipe sistemi öğrenir. Bu yaklaşım fine tuning'den **kat kat güçlü** çünkü Anthropic model güncellemeleriyle otomatik faydalanır, veri kontrolü tamamen bizde, maliyet düşük (sadece DB).

---

## Açık Borçlar

### Tamamlandı (48'de)
- ✅ 021 migration — `ai_api_log.pdf_sha256 TEXT` + partial cache index
- ✅ Cache patch (api/izometri-oku.js) — pdfHashHesapla + cacheKontrol + handler 3-yollu parser seçimi (HIT / parser_kural / Vision)
- ✅ visionAIParse başarılı log'da `cevap_full = parsed` yazımı (cache'in çalışması için kritik)
- ✅ 4 ai_api_log INSERT noktasına `pdf_sha256` eklendi (başarılı + 3 hata yolu)
- ✅ Response'a `_cache_meta` (cache_hit, original_log_id, original_sure_ms, cached_at)
- ✅ Vercel cache bypass redeploy (47'nin pdf-parse downgrade'i sonunda canlıya indi)
- ✅ Canlıda cache HIT kanıtı: aynı PDF 23 sn → 3 sn (PostgreSQL son 5 dk'da yeni kayıt yok)
- ✅ 022 migration — markalama_listeleri (2 policy), markalama_listesi_kalemleri (4 policy parent FK kuralı), test_spooller (2 policy)
- ✅ `.gitignore` eklendi — node_modules, .DS_Store, *.log, .vercel, editor klasörleri
- ✅ Süreç dersi: Vercel build cache invalidation (paket değişiminde elle bypass)

### KIRMIZI 49 ana teması — Format öğrenme döngüsü (~3-4 saat)
**Vizyon Madde 4'ün operasyonel çekirdeği.** Şu an `izometri_format_tanimlari` tablosunda 4 format var, hepsi `egitim_kaynagi='vision_only'` + `parser_kural={}`. Yani format **tanıma** çalışıyor (fingerprint match) ama **kural tabanlı parse** yok, hep L3 (Vision AI) fallback'ine düşülüyor.

49'da kurulacak akış:
1. AI parse başarılı → çıktıdan parser_kural taslağı üret (Vision AI'a ekstra prompt: "Bu PDF'i parse ettin, başka aynı formatta PDF'ler için extraction kuralı yaz")
2. Admin panelde "Format Öğretme" sayfası → kullanıcı taslakları gözden geçirir, onaylar/düzeltir
3. L2 parser engine — `parser_kural` JSONB'sini okur, regex/koordinat extract uygular, AI'a gitmeden sonuç üretir
4. Hibrit fallback — L2 sonucu şüpheliyse otomatik L3'e düş
5. Metrik dashboard — "Bu hafta %X parse L2'de bitti, %Y AI'a düştü" — öğrenme eğrisi görünsün

İlk hedef format: **PAOR Ana Çizim (paor_aveva_ana)** — şu an 8 başarılı kullanım var, kütüphanede en zengin sample.

### KIRMIZI 49 ikinci teması — Cache effectiveness ölçümü (~30 dk)
48'de cache patch canlıda kanıtlandı (1 HIT) ama **gerçek kullanım istatistiği** lazım. PAOR yüklemeleri arttıkça:
- Aylık cache hit oranı?
- Tasarruf edilen $ (Vision AI çağrısı atlanma)?
- En çok hit alan PDF'ler hangileri?

49 başında basit SQL dashboard sorgusu yazılır (`son-durum.md`'ye eklenebilecek).

### SARI 49 hedefler (kalan zamana göre)
- Vercel `vercel.json` `maxDuration` belirteci ekleme (48'de unutuldu, 60 sn kanıtlanmıştı 47'de)
- `package-lock.json` düzenli yenileme alışkanlığı (Vercel cache karışıklığını önler)
- `.github/son-durum.md` ile `son-durum.md` arasındaki ikilik (48'de keşfedildi, biri kopya mı orijinal mi?)
- 016 numaralı flanş cizim_path migration disk'te yok — düşük öncelikli

### YESIL Daha uzak vade
- Wizard (devre yükleme sihirbazı) — 49 sonrası, format öğrenme L2 başarılı olursa
- Async kuyruk altyapısı (Vercel Cron + is_kuyrugu tablosu) — L2 başarısız olursa, 1000 spool'u Cron ile parça parça parse etme
- Pasif öğrenme: kullanıcı düzeltmeleri RAG context (Vizyon 8)
- Çapraz validasyon: 3 katmanlı kontrol (Vizyon 3)
- 3 görünüş okuma (Vizyon 6)
- Tier'li servis modeli — vizyonda kalır
- Lazer tarama pipeline — vizyonda kalır
- 3D motor Aşama 4.1/4.2/4.3 (parser olgunlaştıktan sonra)

### KIRMIZI Veri/Strateji Belge Eksiklikleri (50+ kritik)
48 son saatinde keşfedildi — proje kendi hafızası dağınık:

- **PDF Storage altyapısı** (Supabase Storage) — Şu an PDF'ler hiç saklanmıyor (Vercel function memory'sinde geçici, sonra atılıyor). Sadece parse JSON'u kalıyor. **Orijinal kanıt yok.** 50 oturum başında acil. Path örneği: `tenant_id/devre_id/dosya.pdf`. spool kaydında `pdf_storage_path` kolonu eklenecek.
- **`kullanici_duzeltmeleri` tablosu** — Tip 3 pasif öğrenme için. Manuel onay sırasında değişen alanlar burada birikecek. 50 oturum.
- **`OGRENME-STRATEJISI.md`** — Fine tuning YOK / RAG VAR ilkesinin belgesi. 3 tip öğrenme (format öğrenme + context injection + pasif öğrenme) açıklamaları. 49 sonu/50 başı. **49 başında format öğrenme yazılırken referans dosya olarak yararlı.**
- **`VERI-TASINABILIRLIK.md`** — Tenant Data Pack + System Knowledge Archive ayrımı. KARAR-48.1 (B yaklaşımı) operasyonel hali. Müşteri sözleşmesinin temeli. 50+ oturum.
- **Knowledge Pack üretici script** — Aylık otomatik snapshot. İki paket: (1) Tenant Data Pack — müşteriye verilebilir, çıkışta teslim, (2) System Knowledge Archive — AresPipe iç envanteri. 51-52 oturum.
- **`PROJE-DURUM.md`** — Genel sağlık özeti tek dosyada. Şu an dağınık (son-durum + ROADMAP + vizyon). 50+ oturum.
- **`EKONOMI-MODELI.md`** — Maliyet hesabı, fiyatlama, sürdürülebilirlik. 49 format öğrenme sonuçlarına göre 50+ yazılır.

### Hâlâ açık (47'den devralan, dokunulmadı)
- KK + Sevkiyat sayfa revizyonu (5+ oturumdur açık)
- Büküm modal açıklama alanı eksik
- boru_olculer şema güncellenmeli (tenant_id + sistem_preset)
- CuNi P0 grupları
- devre_yeni.html PDF upload akışı parser'a bağlanması (49 wizard ile birlikte ele alınır)
- Cadmatic glyph reverse araştırması (49+)
- `public_feedback` Security Definer View tasarım kontrolü
- CLAUDE.md halüsinasyon filtresi 7→8 düzeltme

---

## Vizyon Disiplini

48'de yeni istisna **yapılmadı** ✓. Cache patch (Vizyon Madde 4'ün öğrenme döngüsünün ilk operasyonel adımı), RLS güçlendirme (zaten zorunlu güvenlik). Hiçbir vizyon kapsamı erkene alınmadı.

**Stratejik kazanım:** Cihat'ın "1000 spool" sorusu 49'un yönünü Vizyon Madde 4'ün **çekirdek tarafına** çevirdi. Önceden "wizard yapacağız" düşünülüyordu, şimdi "format öğrenme kurulacak" oldu — wizard'sız bile değer üretir. Vizyon 8 (pasif öğrenme) için yine zemin atılıyor.

❌ Pasif öğrenme — vizyonda kalır
❌ Tier'li servis modeli — vizyonda kalır
❌ Lazer tarama pipeline — vizyonda kalır
❌ STEP koordinat çıkarımı — vizyonda kalır
❌ Klasör yükleme + format tanıma — vizyonda kalır
❌ Çapraz validasyon (3 katman) — vizyonda kalır
❌ AI yön çıkarımı — vizyonda kalır

---

## Pilot Durumu

**PAOR pilot:** Canlıda hem fingerprint hem cache mekanizması doğru çalışıyor. Son 6 saatte 6 başarılı kullanım, hepsi `paor_aveva_ana` format_id'si ile. `kullanim_sayisi=8`. Cache HIT denemesi (aynı PDF) 23 sn → 3 sn yaptı (~7× hızlanma). 49'da format öğrenme kurulduğunda PAOR ilk öğrenilecek format (en zengin sample).

**Tersan pilot:** Henüz canlı kullanım yok (kullanim_sayisi=0). Cadmatic glyph problemi nedeniyle parser_kural'ın AI taslağı zayıf olabilir, 49'da PAOR ile başlayıp Tersan'a sonra geçilir.

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

> Dosya transfer disiplini (48'den):
> 1. 30KB+ dosya değişikliği için patch formatı tercih (`diff -u → git apply`)
> 2. base64 encode (76-char wrapped, heredoc) son çare
> 3. Downloads klasöründe `(N).js` birikmesi → tarihli dosya adı (`-48-cache.js`) veya direkt patch
