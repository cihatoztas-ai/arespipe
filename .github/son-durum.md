# AresPipe — Son Durum

> **Son guncelleme:** 29 Nisan 2026 — 47. oturum kapandı
> **CI:** YESIL
> **Aktif oturum sayisi:** 47

---

## 47. Oturum Özeti

**Tema:** DB temizliği + fingerprint patch'i. 46'nın 6 mimari kararı koda + DB'ye dökündü, canlıda doğrulandı.

47 üç paralel ana iş hattıyla bitti:

1. **020 migration uygulandı** — 4 doğru format kaydı (paor_aveva_ana, paor_aveva_iso_view, tersan_cadmatic_isometry, tersan_cadmatic_spool) + `requires_ai`/`requires_ocr` flag'leri + `format_kodu` unique index. Eski 2 test kaydı DELETE'lendi (FK SET NULL davranışlı, log/batch tabloları korundu).

2. **fingerprintEsler skorlama patch'i canlıda** — pdf-parse v1.1.1 ile PDF metadata + ilk sayfa metni çıkarımı, 4 sinyalli skorlama (`fingerprintSkor`), en-yüksek-skor tie-breaker mantığı (`formatTani` revize). Lokal 5/5 senaryo + canlı PAOR doğrulaması: `paor_aveva_ana.kullanim_sayisi=1` arttı, doğru kayıt seçildi.

3. **Önemli süreç keşfi: pdf-parse v2.4.5 Vercel serverless'ta patlıyor.** İlk deploy `FUNCTION_INVOCATION_FAILED` aldı — pdfjs-dist v4 DOM API gerektiriyor (DOMMatrix, ImageData, Path2D), Vercel Node.js ortamında yok. v1.1.1'e downgrade edildi (kendi pdfjs v1.10.100'ü bundle eder, DOM-free). v1.1.1 ESM'den `import 'pdf-parse'` doğrudan da patlıyor (test data ENOENT) — `import 'pdf-parse/lib/pdf-parse.js'` direkt path workaround. **Bu kütüphane sürüm uyumsuzluğu 1 saatlik bedel ödetti, ama gelecekteki paket eklemelerde kalıcı ders.**

**Maliyet ölçümü ile elde edilen sürpriz kazanım:** `ai_api_log` tablosunda 47 öncesi tüm Vision AI çağrılarının `format_id=NULL` olarak loglandığı doğrulandı. 005 migration'dan beri canlı sistem fingerprint'i hiç tutmamış. 47 sonrası ilk kez `format_id` dolu kaydedildi. Yani 47.B'nin gerçek başarı kanıtı log'da net duruyor.

**Yavaşlık endişesi ölçüldü:** Vision AI çağrıları 18-21 sn sürüyor (Anthropic Sonnet 4.5'in doğal yanıt süresi). 47.B pdf-parse marjinal yük (~1 sn) ekledi, ana yavaşlık 47 öncesi de vardı. Vercel Hobby aslında 19.7 sn 200 döndürdü — timeout sınırı 10 sn değil daha geniş (60 sn olmalı), 48'in queue mimarisi araştırması düşük öncelikli oldu.

---

## Mimari Kararlar (47)

**MK-47.1 — pdf-parse v1.1.1 zorunlu.** v2.4.5 Vercel serverless ortamında DOM API gerektiriyor, çalışmaz. v1.1.1 (2018, kendi pdfjs v1.10.100 ile bundle'lı) DOM-free, Node.js'te stabil. ESM'den `import pdfParse from 'pdf-parse/lib/pdf-parse.js'` doğru kullanım — direkt `'pdf-parse'` import'u ESM'de "debug mode" tetikler, ENOENT atar. Bu kalıcı bir kuraldır, sürüm yükseltme 50+'da pdfjs serverless uyumlu olunca düşünülür.

**MK-47.2 — Fingerprint en-yüksek-skor tie-breaker.** Aynı tersanenin iki PDF tipi (PAOR Ana/Iso, Cadmatic Isometry/Spool) ortak sinyaller paylaşır (Producer + baslik regex). Skor eşiği (≥2) yetmez, en yüksek skor kazanır. `dosya_adi_regex` doğal tie-breaker olur. Lokal 5/5 + canlı 1/1 doğrulanmış davranış.

**MK-47.3 — format_id artık her parse'da doğru kaydedilir.** Vizyon Madde 4'ün öğrenme döngüsü için zemin: gelecekte her formatın kullanım istatistiği (kullanim_sayisi + ai_api_log analytics) doğru. `son_kullanim_at` timestamp da artıyor → 50+ pasif öğrenmenin ilk kanıtlanmış kayıtları.

**MK-47.4 — Vercel Hobby timeout endişesi giderildi.** 19.7 sn `http_status=200` döndü, eski "10 sn sınırı" varsayımı yanlış (muhtemelen 2024+ pricing'inde 60 sn). Queue mimarisi acil değil. Cache mekanizması (48) yine değerli (maliyet düşürür) ama yapısal zorunluluk değil.

**MK-47.5 — Anthropic Sonnet 4.5 yanıt süresi 18-21 sn baseline.** 47 öncesi de aynı süre (27-28 Nisan log kayıtları). 47 patch'i 1 sn ekledi (pdf-parse), ana yavaşlık API kaynaklı. Cache (48) 2. yükleme için 0 sn yapar — gerçek hız kazanımı orada.

---

## Açık Borçlar

### Tamamlandı (47'de)
- ✅ 020 migration — 4 doğru format kaydı + flag'ler + unique index
- ✅ npm install pdf-parse@1.1.1 (downgrade) — package.json + package-lock.json güncel
- ✅ izometri-oku.js fingerprintEsler skorlama + en-yüksek-skor + pdfIpucuCikar
- ✅ Lokal test (5/5 senaryo) + canlı PAOR doğrulaması
- ✅ format_id artık ai_api_log'da doğru kaydediliyor (canlı kanıt)
- ✅ Süreç dersi: pdf-parse v2.4.5 Vercel'de patlıyor (kütüphane uyumluluğu testi gerek)

### KIRMIZI 48 ana teması — Cache mekanizması (~1.5 saat)
- PDF SHA256 hash hesapla → `ai_api_log`'da aynı hash + format_id ile başarılı kayıt var mı bak
- Varsa Vision AI çağrısı atla, eski sonucu döndür ($0 maliyet)
- 021 migration: `ai_api_log.pdf_sha256 TEXT` kolonu (varsa atla, indexleme dahil)
- izometri-oku.js'e cache kontrolü ekleme (visionAIParse'tan önce)
- Beklenen kazanım: aylık ~%15 maliyet düşüşü, 2. yüklemede 0 sn

### KIRMIZI 48 ikinci teması — RLS policy'leri (~2-3 saat)
46-47'de Supabase Security Advisor 10 critical uyarı verdi. **5 production tablosu** RLS açık değil (multi-tenant için kritik):
- `tenant_features` (en sinsi: policy var ama RLS off)
- `basamak_sablonlari`
- `yetki_tanimlari`
- `markalama_listeleri`
- `markalama_listesi_kalemleri`

Şu an pratik etki yok (pilot aşaması, tek tenant), 2. tenant gelmeden önce yapılması yeter. 48'de sıfırdan kalıp ile her 5 tablo için tenant_id-based policy. Test tabloları (testler, test_spooller, egitim_verisi) ayrı sınıf, düşük öncelik.

### SARI 48 hedefler (kalan zamana göre, atlama hakkı)
- PAOR Isometric_View için ilk parser_kural denemesi (sadece pipeline_no + drawing_no, deneysel)
- CLAUDE.md halüsinasyon filtresi 7→8 düzeltme (atomik, ~5 dk)
- Karar 7 (36) güncelleme: "Excel = subset truth, ground truth değil" (atomik)
- `.gitignore` ekleme: `.DS_Store`, `node_modules/`, `*.log` (her oturumda stash gerek olmaz)
- `public_feedback` Security Definer View tasarım kontrolü

### SARI Diger acik isler (48+)
- Vercel actual max duration teyit (10 vs 60 sn — pricing dokümantasyonuna bak)
- 016 numaralı flanş cizim_path migration disk'te yok
- KK + Sevkiyat sayfa revizyonu (5+ oturumdur açık)
- Büküm modal açıklama alanı eksik
- boru_olculer şema güncellenmeli (tenant_id + sistem_preset)
- CuNi P0 grupları
- 3D motor Aşama 4.1/4.2/4.3 (parser olgunlaştıktan sonra)
- devre_yeni.html PDF upload akışı parser'a bağlanması
- Cadmatic glyph reverse araştırması (49+)

### YESIL Vizyon ile uyumlu uzun vade
- Yapısal öğrenme: N Vision AI çıktısından parser_kural otomatik üret (50+, Vizyon Madde 4)
- Pasif öğrenme: kullanıcı düzeltmeleri RAG context (Vizyon 8)
- Çapraz validasyon: 3 katmanlı kontrol (Vizyon 3)
- 3 görünüş okuma: tek izometri yön çıkarımı %85 altına düşerse (Vizyon 6)

---

## Vizyon Disiplini

47'de yeni istisna **yapılmadı** ✓. Sadece 46 kararlarının uygulanması + 020 migration + kod patch'i. Hiçbir vizyon kapsamı erkene alınmadı.

**MK-47.3 önemli kazanım:** Vizyon Madde 4'ün öğrenme döngüsü için zemin atıldı. Her parse artık format_id ile loglanıyor. 50+'daki yapısal öğrenme bu veri üzerine kurulur.

❌ Pasif öğrenme — vizyonda kalır
❌ Tier'li servis modeli — vizyonda kalır
❌ Lazer tarama pipeline — vizyonda kalır
❌ STEP koordinat çıkarımı — vizyonda kalır
❌ Klasör yükleme + format tanıma — vizyonda kalır
❌ Çapraz validasyon (3 katman) — vizyonda kalır
❌ AI yön çıkarımı — vizyonda kalır

---

## Pilot Durumu

**PAOR pilot:** Canlıda fingerprint **doğru tutuyor** (47.B sonrası ilk kez). 1 başarılı kayıt (`paor_aveva_ana.kullanim_sayisi=1`, 18:00:21 UTC). Vision AI parse 19.7 sn, $0.0339, Excel rapor temiz. Yavaşlık zaten Anthropic API kaynaklı, 47 öncesi de aynıydı.

**Tersan pilot:** Henüz canlı kullanım yok (kullanim_sayisi=0). DB hazır (Isometry + Spool için 2 ayrı kayıt). Cadmatic glyph problemi yüzünden parser_kural doldurulmayacak, Vision AI fallback ile çalışır. Tersan'dan ilk gerçek PDF gelirse yine fingerprint doğru tutmalı (lokal test 5/5 davranışı kanıtladı).

---

## Süreç Dersleri (47'den)

**1. Kütüphane sürüm uyumluluğu kütüphane-spesifik test.** Container'da çalışan v2.4.5 Vercel'de patladı (DOM API farkı). 48+: yeni paket eklenirken **önce Vercel preview deploy testi**, sonra production. 1 saat kayıp.

**2. Downloads klasörü versiyonlama riski.** Aynı isimli `izometri-oku.js` dosyalarının `(1)`, `(2)`... numaralı kopyaları karışıyor. 47'de yanlış sürüm (962 satır, eski) commit'lendi → reset --soft → doğru sürüm (1113) bulundu. Çözüm: `wc -l` doğrulaması her kopyalama sonrası.

**3. git stash + pull --rebase + push 3'lüsü.** CI bot her oturum push atıyor (rapor güncellemeleri). Local push reddedilince standart kalıp: `git stash` (varsa) → `git pull --rebase` → `git push`. 47'de 2 kez yaşandı, kalıcı kalıp.

**4. ai_api_log şeması zaten zengin.** `cache_read_tokens`, `cache_write_tokens`, `sure_ms`, `format_id` hepsi var. Yeni kolon eklemeden önce şemayı kontrol et (information_schema sorgusu).

**5. Cihat'ın "yavaş geldi" sezgileri ölçülmeli.** Subjektif yavaşlık hissi → log'a bak → Anthropic API kaynaklı, 47 patch'i değil. Cache (48) bunu ikinci yüklemelerde sıfırlar.

---

> Migration disiplini hatırlatması (her DB değişikliği iki adımdır):
> 1. Önce Supabase SQL Editor → DB'ye uygula + doğrula
> 2. Sonra GitHub'a upload → CI yeşil → versiyonlama
> İkisi de yapılmadan migration "tamamlandı" sayılmaz.

> Paket disiplini (47'den):
> 1. npm install öncesi Vercel runtime uyumluluğunu doğrula (DOM API, ESM/CJS, native bindings)
> 2. Container testi yetmez — Vercel preview deploy zorunlu
> 3. ESM'den eski paketleri import ederken `lib/` direkt path olabilir
