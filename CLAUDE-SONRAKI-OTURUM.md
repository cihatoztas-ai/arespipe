# Claude — 48. Oturum Gündemi

> **Bu dosya 47 kapanışında oluşturuldu. 48 başında ilk okunacak.**

---

## 48 Açılış Mottosu

47, 46 kararlarını koda + DB'ye döktü. Fingerprint skorlama canlıda çalışıyor, format_id artık doğru loglanıyor. 47'nin sürpriz dersi: **paket Vercel uyumluluğu container testiyle yetmiyor** — pdf-parse v2.4.5 patlaması bunu kanıtladı, v1.1.1'e downgrade ile çözüldü.

48'in iki kelimelik özeti: **cache + güvenlik**.

İki paralel ana iş hattı:
1. **Cache mekanizması** — Vizyon Madde 4'ün ilk operasyonel adımı. PDF hash bazlı, Vision AI tekrar çağrısı atlanır. ~%15 maliyet düşüşü, 2. yüklemede sıfır gecikme.
2. **RLS policy'leri** — 5 production tablosunda multi-tenant koruması. Pilot 2. tenant'a hazırlık.

İkisi de uygulama oturumu, keşif değil. 48 sonu canlıda iki teknik kazanım.

---

## 1. Açılış Ritüeli (~5 dk)

5 cevap zorunlu (CLAUDE.md):

```
Oturum başlangıç ritüeli — 5 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
2. GitHub Actions sekmesinde son build rengi nedir?
3. .github/son-durum.md dosyasını yükle veya içeriğini yapıştır
4. Bugün hangi dosyayla çalışılacak? (cevap: 021 migration + api/izometri-oku.js cache patch + RLS migration'ları)
5. admin/panel.html → Geri Bildirim sekmesinde açık feedback?
```

5 cevap geldikten sonra:
- son-durum.md'den 47 sonu detayını oku (5 mimari karar listesi)
- VIZYON-VE-MODULER-MIMARI.md ve SPOOL-AI-VIZYON.md hatırla (47'de yapıldı, disiplin)
- docs/CIHAT-PROFIL.md hatırla
- CLAUDE-SON-OTURUM.md (47 detayı) — sadece geriye dönüp aranır
- **Migration disiplini hatırlat:** her DB değişikliği iki adımdır (önce Supabase, sonra GitHub)
- **Paket disiplini hatırlat:** yeni paket ekleme = container test + Vercel preview test + production. Container yetmez (47'nin dersi).

---

## 2. Bağlam Tazeleme — 47'den Devralan Karar Listesi

48'e başlamadan önce 47'nin 5 mimari kararı zihinde olmalı:

| # | Karar | Etkisi |
|---|---|---|
| MK-47.1 | pdf-parse v1.1.1 zorunlu, ESM `lib/pdf-parse.js` direkt | Mevcut akış korundu, 50+'ya kadar değişmez |
| MK-47.2 | Fingerprint en-yüksek-skor tie-breaker | formatTani'da uygulandı, lokal 5/5 + canlı 1/1 |
| MK-47.3 | format_id her parse'da loglanır | 48 cache mekanizması bu sayede mümkün — hash + format_id ile lookup |
| MK-47.4 | Vercel timeout 19.7 sn'i karşıladı | Queue mimarisi acil değil, cache yeter |
| MK-47.5 | Anthropic baseline 18-21 sn | Cache 2. yüklemede 0 sn yapar — ana hız kazanımı |

---

## 3. Ana Tema A — Cache Mekanizması (~1.5 saat)

### 3.1 Hedef

Aynı PDF'in tekrar yüklenmesi durumunda Vision AI çağrısı yapılmaz, eski sonuç döndürülür. ~%15 maliyet düşüşü, 2. yükleme 0 sn (Vision AI 18-21 sn → cache hit ~0.5 sn).

### 3.2 Kavramsal Akış

```
PDF gelir
  ↓
SHA256 hash hesapla
  ↓
formatTani çalışır → format_id belirlenir
  ↓
ai_api_log'da WHERE pdf_sha256 = ? AND format_id = ? AND basarili = true LIMIT 1
  ├─ HIT → cevap_full JSONB'sini parse et, eski sonucu döndür ($0, ~0.5 sn)
  └─ MISS → visionAIParse normal akış, sonuç ai_api_log'a yazılır (cache için)
```

### 3.3 021 Migration

**`migrations/021_ai_api_log_cache.sql`** — Cache için yeni kolon + index:

```sql
ALTER TABLE ai_api_log
  ADD COLUMN IF NOT EXISTS pdf_sha256 TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_api_log_cache
  ON ai_api_log(pdf_sha256, format_id)
  WHERE basarili = true AND pdf_sha256 IS NOT NULL;

COMMENT ON COLUMN ai_api_log.pdf_sha256 IS
  '48: PDF SHA256 hash. Vision AI cache lookup icin (vizyon Madde 4 ogrenme dongusunun ilk adimi).';
```

**Önemli karar:** Index partial (sadece başarılı + hash dolu kayıtlar). Çünkü:
- Başarısız parse'ları cache'lemek istemiyoruz
- Eski log'ların hash'i NULL olacak (cache miss, yeni hash hesaplanır, sonra dolar — geriye dönük doldurma gerekmez)

### 3.4 izometri-oku.js Cache Patch

**Yeni helper fonksiyon `pdfHashHesapla(buffer)`:**
```js
import crypto from 'crypto';

function pdfHashHesapla(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
```

**Yeni helper `cacheKontrol(pdf_sha256, format_id, tenant_id)`:**
- ai_api_log'da WHERE clause ile lookup
- HIT: cevap_full JSONB → parse → returns
- MISS: null returns (akış visionAIParse'a devam eder)

**Handler revize (satır ~159):**
- formatTani sonrası: pdfHashHesapla + cacheKontrol
- HIT: cache'den dönen sonucu kullan, ai_api_log'a yeni kayıt yazma (cache hit'leri loglamak istersek ayrı `cache_hit BOOLEAN` kolonu ekleriz, ama 48'de değil — 49 SARI'da değerlendirilir)
- MISS: visionAIParse + ai_api_log INSERT'inde pdf_sha256 dolu yaz

### 3.5 Lokal Test

3 senaryo:
1. **İlk yükleme** → MISS → Vision AI çağrılır, ai_api_log'a hash'li kayıt
2. **Aynı PDF tekrar** → HIT → 0 ms cevap, Vision AI hiç çağrılmaz
3. **Aynı PDF farklı format** (teorik) → MISS → format_id farklı, hash uyuşsa da cache uymaz

### 3.6 Canlı Doğrulama

48 sonu PAOR PDF iki kez yüklenecek:
- 1. yükleme: ai_api_log'a yeni kayıt, sure_ms ~19.7 sn, hash dolu
- 2. yükleme: ai_api_log'a kayıt yazılmaz (cache hit), Excel rapor 1 sn altında dönmeli

`SELECT COUNT(*), MAX(sure_ms) FROM ai_api_log WHERE pdf_sha256 IS NOT NULL` → 1 kayıt, 19.7 sn (2. yükleme cache hit, log atılmadı).

---

## 4. Ana Tema B — RLS Policy'leri (~2-3 saat)

### 4.1 Hedef

Supabase Security Advisor 47'de 10 critical uyarı verdi. 5'i production tablosu için. Multi-tenant koruması: Tenant A, Tenant B'nin verisini okuyamamalı. Pilot 2. tenant gelmeden yapılması gerek.

### 4.2 5 Production Tablosu

| Tablo | Sorun | Karmaşıklık |
|---|---|---|
| `tenant_features` | Policy var ama RLS off (en sinsi) | Düşük (RLS ENABLE yeter) |
| `basamak_sablonlari` | RLS off, policy yok | Orta (kalıp policy gerek) |
| `yetki_tanimlari` | RLS off, policy yok | Orta (rol bazlı erişim) |
| `markalama_listeleri` | RLS off, policy yok | Düşük (tenant_id bazlı) |
| `markalama_listesi_kalemleri` | RLS off, policy yok | Orta (parent FK üzerinden tenant) |

### 4.3 Standart Kalıp

```sql
-- Standart tenant-bazli erisim policy'si
ALTER TABLE <tablo> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<tablo>_select_kendi_tenant"
  ON <tablo>
  FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()));

CREATE POLICY "<tablo>_insert_kendi_tenant"
  ON <tablo>
  FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()));

-- UPDATE + DELETE benzer
```

**Servis rolü için bypass:** Anthropic Vercel Serverless Functions servis anahtarıyla bağlanır → RLS bypass eder. Bu doğru davranış (admin işlemler için), client-side RLS'in dışında.

### 4.4 022, 023, 024, 025, 026 Migration Dosyaları

5 ayrı migration ya da tek 022 dosyasında 5 ALTER + birden fazla CREATE POLICY. **Önerim: tek 022 dosyası**, çünkü:
- Tüm 5 tablo aynı kategoride (production multi-tenant)
- Atomik uygulama, geri alma kolay
- Tek seferde gözden geçirme

`022_rls_production_tablolari.sql`:
- 5 ALTER TABLE ENABLE ROW LEVEL SECURITY
- 4 tablo için 4'er policy (SELECT/INSERT/UPDATE/DELETE) → 16 policy
- tenant_features için sadece ENABLE (policy zaten var)
- Markalama_listesi_kalemleri için parent FK üzerinden tenant erişimi (özel policy)

### 4.5 Test Tabloları (Düşük Öncelik)

`testler`, `test_spooller`, `egitim_verisi` — RLS uyarısı var ama production değil. **48'de yapılmaz**, açık borç olarak kalır. 49+'da ayrı bir mini-oturumda halledilir.

### 4.6 public_feedback Security Definer View

10 uyarıdan biri farklı sınıf — view, tablo değil. Tasarım kontrolü gerek (genelde anonymous feedback için view creator yetkisi mantıklı). 48 sonunda 5-10 dk ayır, gerek yoksa görmezden gel + son-durum'da not.

---

## 5. SARI Hedefler (Kalan zamana göre, atlama hakkı)

### 5.1 PAOR Isometric_View parser_kural Denemesi (~30 dk)

47'de yapılmadı, 48'e devraldı. Minimal deneme:
```json
{
  "alanlar": {
    "pipeline_no": { "regex": "MODEL\\s+REFERENCE\\s+PIPE\\s+NO[.:]?\\s*(\\S+)", "grup": 1 }
  }
}
```

Bu, **48'in parser_kural ile ilk gerçek deneme**si. Vizyon Madde 4 öğrenme döngüsünün operasyonel başlangıcı. Ama dikkat: parser_kural dolunca `parserKuralIle()` stub'ı tetiklenir → şu an `{ ok: false, error: 'henuz aktif degil' }` döndürür → handler hata atar (satır 161). Yani **önce parserKuralIle() stub'ını da güncellemek gerekir** (en az pipeline_no çıkartmalı, sonra Vision AI ile birleştirmeli — hibrid yapı).

**Bu küçük SARI değil aslında**, 1+ saat iş. 49'a ertelenmesi daha doğru olabilir.

### 5.2 CLAUDE.md Halüsinasyon Filtresi 7→8 Düzeltme (~5 dk)

Atomik. MK-46.6'da işaretlendi.

### 5.3 Karar 7 (36) Güncellemesi (~10 dk)

Atomik. Excel = subset truth, ground truth değil. IZOMETRI-BATCH-KARAR.md veya CLAUDE.md'de.

### 5.4 .gitignore Ekleme (~5 dk)

Atomik:
```gitignore
.DS_Store
node_modules/
*.log
.vercel
```

Her oturumda `git stash` gerek olmaz. Küçük kalıcı kazanım.

### 5.5 Vercel Plan Doğrulaması (~10 dk)

Vercel pricing dokümanı veya account ayarlarından maximum function duration teyit. MK-47.4'ün varsayımını kanıtla. 19.7 sn geçtiğine göre 60 sn olmalı.

---

## 6. 48 Sonu Hedef Çıktıları

✅ 021 migration uygulanmış (cache infrastructure)
✅ izometri-oku.js cache mekanizması canlıda
✅ Lokal cache testi (3 senaryo geçti)
✅ Canlı PAOR cache hit doğrulaması (2. yükleme <1 sn)
✅ 022 migration uygulanmış (5 production tablosu RLS)
✅ Supabase Security Advisor 5 critical → 5 azaldı (test tabloları + view kalır)
✅ CI yeşil
✅ Kapanış üçlüsü yazılı

🟡 PAOR Iso parser_kural denemesi (zaman varsa, muhtemelen 49'a ertelenir)
🟡 CLAUDE.md halüsinasyon filtresi düzeltme
🟡 Karar 7 güncelleme
🟡 .gitignore ekleme
🟡 Vercel plan doğrulaması

🔴 **49 ana teması:** parserKuralIle() ilk operasyonel hali (PAOR Iso pipeline_no + hibrid Vision AI)
🔴 **49+ ana teması:** Cadmatic glyph reverse araştırması (pdfjs-dist font dictionary), eğer Tersan canlı kullanım başlarsa öncelik artar

---

## 7. Cihat'a Sorulacak (48 başında)

**Cache stratejisi onayı.** PDF içeriği değişmez sayılırsa cache geçerli. Aynı PDF güncellenirse (örn. revizyon) hash değişir → otomatik cache miss. Edge case: PDF metadata değişmiş, içerik aynı → cache hit. Cihat: bu istenen davranış mı?

**RLS uygulama yöntemi.** 22-25-26 ayrı migration mı tek 022 mi? Önerim tek dosya.

**Eski log'lar.** ai_api_log'da pdf_sha256 NULL olan eski kayıtlar (47 öncesi). Geriye dönük hash hesabı yapmaya değer mi? Çoğu zaten 47 öncesi, format_id'siz, cache'lenmesi düşük değer. Önerim: dokunma, yeni kayıtlardan başla.

**Eski PDF eğitim havuzu.** Hâlâ açık borç. Cihat ilerleme yapıyor mu?

---

## 8. Risk Notları

**Risk 1 — Cache hit'in yan etkileri.**
Aynı PDF iki kez yüklenirse 2. seferde Vision AI çağrılmaz → ai_api_log kaydı oluşmaz → kullanim_sayisi de artmaz (bu kullanim_sayisi format_tanimlari'nda formatTani'da artıyor, cache değil). Yani:
- format_tanimlari.kullanim_sayisi her PDF için artar (cache hit dahil) — DOĞRU
- ai_api_log sadece Vision AI çağrısı olunca kayıt — DOĞRU
- Maliyet düşüşü ai_api_log'dan analytics ile görülür (toplam_usd düşer)

Bu doğru davranış ama Cihat onayı alınmalı: "Cache hit'lerini loglamak istiyor musun?" → istiyorsa 49'da ayrı kolon (`cache_hit BOOLEAN`) eklenir.

**Risk 2 — RLS policy yanlış yazımı production akışını kırabilir.**
Vercel Serverless Functions servis anahtarıyla bağlanır → RLS bypass eder, yani parse akışı etkilenmez. Ama browser'dan Supabase'e direkt bağlanan bazı operasyonlar (markalama, kalite) anon/authenticated rolüyle gider → RLS aktif olduğunda kırılabilir. **Test gerekli:** her RLS aktivasyonu sonrası tarayıcıdan o tablo işlemlerinin çalıştığı doğrulanmalı.

**Risk 3 — pdf_sha256 hash hesabı performans.**
SHA256 4 MB PDF için ~50 ms. Marjinal yük, sorun değil. Buffer'dan tek geçişle hesaplanır.

**Risk 4 — Migration disiplini hâlâ kritik.**
021 ve 022 ayrı uygulanmalı. Önce 021 (Supabase + GitHub + CI yeşil + canlı test), sonra 022.

---

## 9. Disiplin Hatırlatmaları

**47'den kalıcı kurallar:**
- Migration iki adımdır (Supabase önce, GitHub sonra)
- Paket eklerken Vercel uyumluluğu test edilir (container yetmez)
- Eski rapor güvenilir kaynak değil, gerçek kaynak DB + disk
- ESM'den eski paketleri import ederken `lib/` direkt path olabilir
- git stash + pull --rebase + push 3'lüsü her oturumda gerekir

**46'dan kalıcı:**
- Vizyon dosyalarını oku (47'de yapıldı, 48 de yapacak)
- Container'da ham çıktıları context'e değil dosyaya yaz, sohbete sadece özet
- Cihat'ın stratejik sorularını ciddiye al

**Cihat profili:**
- "Atlama, listele, dolu cevap ver"
- İlerleme olmadan geçen zaman tahammülsüzlük → 48'de cache uygulaması ilk 2 saatte bitsin
- "Tane tane gidelim" disiplini kararsızlıkta açıkça istenir, hazır ol

---

## 10. Açılış Tek Sayfa Hatırlatması

```
🎯 48 Mottosu: Cache + RLS. Vizyon Madde 4 öğrenme döngüsünün ilk operasyonel adımı + multi-tenant koruma.

📋 5 Kontrol → Vizyon dosyaları HATIRLA → 021 migration (cache) → izometri-oku.js cache patch → 022 migration (RLS) → lokal + canlı test → kapanış üçlüsü.

⚠️ 47 dersi: Vercel paket uyumluluğu container testiyle yetmiyor. Yeni paket ekleme = preview deploy zorunlu.

🔧 Migration disiplini: Supabase önce, GitHub sonra. Atlamak yok.
```

---

## 11. Hazır Olunca Kontrol Listesi

48 başlamadan önce zihninde olmalı:
- [ ] 47'nin 5 mimari kararı (MK-47.1 → MK-47.5)
- [ ] 47 sonu durum: PAOR fingerprint canlıda doğru tutuyor (kullanim_sayisi=1)
- [ ] format_id artık ai_api_log'da doğru (cache mekanizmasının ön koşulu hazır)
- [ ] Vercel timeout endişesi giderildi (19.7 sn geçti)
- [ ] Anthropic baseline 18-21 sn (cache 2. yüklemede 0 sn → ana hız kazanımı)
- [ ] 5 production tablosu RLS açık değil (multi-tenant kritik borç)
- [ ] Cache mantığı: SHA256 + format_id + basarili filter

---

> 47 kapanışında yazıldı. 48 başında ilk okunacak.
> 47 uygulama oturumuydu, 48 de uygulama oturumu olacak — temiz zemin var, hedef net ve uygulanabilir.
