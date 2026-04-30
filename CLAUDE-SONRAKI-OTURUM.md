# Claude — 49. Oturum Gündemi

> **Bu dosya 48 kapanışında oluşturuldu. 49 başında ilk okunacak.**

---

## 49 Açılış Mottosu

48, cache mekanizmasını ve RLS'yi canlıya aldı. Ama 48'in **gerçek mirası** kod değil **stratejik bir yön değişikliği**: Cihat'ın "1000 spool — her PDF için gerçekten AI gerekli mi?" sorusu Vizyon Madde 4'ün operasyonel çekirdeğini gün ışığına çıkardı.

**49 iki kelimelik özeti: format öğrenme.**

İlk PDF AI'a gider (parse + parser_kural taslağı üretimi). Kalan 999 PDF aynı formatsa **L2 deterministik parse** ile çıkar — AI yok, regex/koordinat extract, ~100ms × 999 = ~100 sn, $0 maliyet. 60× ekonomi farkı.

49 keşif + uygulama oturumu (47 keşifti, 48 uygulamaydı, 49 ikisi birden). 49 sonu: PAOR formatının `parser_kural` JSONB'si dolu, L2 parser engine canlı, Cihat'ın 1000 spool senaryosu 5 dakikada biten somut bir gerçeklik.

---

## 1. Açılış Ritüeli (~5 dk)

5 cevap zorunlu (CLAUDE.md):

```
Oturum başlangıç ritüeli — 5 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
2. GitHub Actions sekmesinde son build rengi nedir?
3. .github/son-durum.md dosyasını yükle veya içeriğini yapıştır
4. Bugün hangi dosyayla çalışılacak? (cevap: PAOR parser_kural taslağı + L2 parser engine + admin panel "Format Öğretme")
5. admin/panel.html → Geri Bildirim sekmesinde açık feedback?
```

5 cevap geldikten sonra:
- son-durum.md'den 48 sonu detayını oku (5 mimari karar listesi MK-48.1→48.5)
- VIZYON-VE-MODULER-MIMARI.md ve SPOOL-AI-VIZYON.md hatırla (özellikle Madde 4 — öğrenme döngüsü)
- docs/CIHAT-PROFIL.md hatırla
- CLAUDE-SON-OTURUM.md (48 detayı) — gerekirse aranır
- **Migration disiplini hatırlat:** her DB değişikliği iki adımdır
- **Paket disiplini hatırlat:** Vercel cache invalidation manuel kontrol (48 dersi MK-48.1)
- **Dosya transfer disiplini:** 30KB+ değişiklik için patch formatı tercih (48 dersi)

---

## 2. Bağlam Tazeleme — 48'den Devralan Karar Listesi

49'a başlamadan önce 48'in 6 mimari kararı zihinde olmalı:

| # | Karar | Etkisi |
|---|---|---|
| **MK-48.1** | Vercel build cache invalidation paket değişiminde manuel redeploy şart | Kalıcı süreç kuralı |
| **MK-48.2** | Cache lookup: hash + format_id + tenant_id + cevap_full | 49 format öğrenme ile birlikte yaşar |
| **MK-48.3** | RLS 15 prod tablosu, `markalama_listesi_kalemleri` parent FK kuralı | Multi-tenant güvenlik kapatıldı |
| **MK-48.4** | Cache HIT log yazmaz, response `_cache_meta` ile bilir | Tasarım kararı, gereksiz şişme yok |
| **MK-48.5** | **Format öğrenme döngüsü (49) > Wizard (50+).** 60× ekonomi. | **49'un asıl kapsamı bu.** |
| **MK-48.6** | **Veri Sahipliği Politikası (KARAR-48.1)**: Müşteri verisi müşterinin, anonim kurallar AresPipe'ın. Sözleşmede yazılır. | İş modeli temel taşı, 50+ sözleşme tasarımı |

**Strateji notu (kritik):** Fine tuning YOK, RAG VAR. Anthropic AI sabit, AresPipe sistemi öğrenir. 3 katmanlı hafıza: (1) Format öğrenme — `parser_kural` JSONB (49'un konusu), (2) Veri birikimli akıl yürütme — geçmiş özet AI prompt context (50+), (3) Pasif öğrenme — kullanıcı düzeltmeleri (Vizyon 8). 49 başında bu kavramlar zihinde olmalı.

---

## 3. Mevcut Durum — Format Kütüphanesi

49 başında DB'ye **mutlaka** sorulması gereken iki sorgu:

```sql
-- 1. Mevcut format kütüphanesi durumu
SELECT 
  ad,
  format_kodu,
  cad_program,
  egitim_kaynagi,
  kullanim_sayisi,
  basari_orani,
  son_kullanim_at,
  CASE 
    WHEN parser_kural IS NULL OR parser_kural::text = '{}' THEN 'L3 (AI)'
    ELSE 'L2 (kural)'
  END AS parser_seviye
FROM izometri_format_tanimlari
WHERE aktif = true
ORDER BY kullanim_sayisi DESC NULLS LAST;
```

48 sonu durumu (49 başında değişmiş olabilir, tekrar bak):
- `paor_aveva_ana` (PAOR Ana Çizim, AVEVA E3D): kullanim=8, **49 hedefi**
- `paor_aveva_iso_view`: kullanim=0
- `tersan_cadmatic_isometry`: kullanim=0
- `tersan_cadmatic_spool`: kullanim=0

**Hepsi `egitim_kaynagi='vision_only'` ve `parser_kural={}`. Yani format tanıma çalışıyor (fingerprint match), ama hep L3 fallback.**

```sql
-- 2. PAOR'un mevcut yapısı (49'da işlenecek)
SELECT 
  ad,
  fingerprint,
  prompt_template,
  parser_kural
FROM izometri_format_tanimlari
WHERE format_kodu = 'paor_aveva_ana';
```

Beklenen:
- `prompt_template`: NULL (49'da AI prompt yazılacak)
- `parser_kural`: `{}` (49'da AI taslağı doldurulacak)

---

## 4. 49 Ana Hattı — Format Öğrenme Döngüsü (~3-4 saat)

### 4.1 — AI Taslak Üretici (~1 saat)

Vision AI parse başarılı olduğunda **ek bir prompt** çalışır:
> "Bu PDF'i parse ettin ve JSON döndürdün. Şimdi başka aynı formatta PDF'ler için bir extraction kuralı yaz. Şunları belirt: spool_no hangi koordinatlarda/regex'te, DN tablosu hangi satırlarda, malzeme listesi hangi sütunlarda. JSON formatında döndür."

Çıktı `parser_kural` JSONB'sine yazılır.

**Tasarım kararı (49 başında verilecek):**
- (a) Her başarılı parse'da otomatik taslak üret (her seferinde overwrite veya ortalama)?
- (b) İlk N başarılı parse'da üret, N+1'den sonra dondur?
- (c) Manuel "Bu format için kural üret" butonu (admin panelde)?

**Önerim:** (c) — kontrollü başlangıç. İlk PAOR için manuel tetikle, kural test et, sonra otomatikleştir.

### 4.2 — L2 Parser Engine (~1 saat)

Yeni dosya: `lib/l2-parser.js` veya `api/izometri-oku.js` içine fonksiyon.

```javascript
async function parserKuralIle({ pdf_base64, dosya_adi, formatBilgisi }) {
  const kural = formatBilgisi.parser_kural;
  if (!kural || Object.keys(kural).length === 0) return null;
  
  const buffer = Buffer.from(pdf_base64, 'base64');
  const data = await pdfParse(buffer);
  const text = data.text;
  
  // Kural'a göre extract et
  const spoollar = [];
  for (const sablon of kural.spool_sablon || []) {
    const match = text.match(new RegExp(sablon.regex));
    // ...
  }
  
  // Şüphelilik kontrolü (eksik alan, regex match yok)
  if (eksikAlanVar(spoollar)) return null; // L3'e fallback
  
  return { ok: true, spoollar, _parser_seviye: 'L2' };
}
```

Handler'da entegrasyon:
```javascript
if (cacheKayit) { /* cache HIT */ }
else if (formatBilgisi.parser_kural && Object.keys(formatBilgisi.parser_kural).length > 0) {
  parseSonuc = await parserKuralIle({ pdf_base64, dosya_adi, formatBilgisi });
  if (!parseSonuc) {
    // L2 başarısız, L3 fallback
    parseSonuc = await visionAIParse({ ... });
  }
} else {
  // L3 (Vision AI)
  parseSonuc = await visionAIParse({ ... });
}
```

### 4.3 — Admin Panel "Format Öğretme" Sayfası (~1 saat)

Yeni sayfa: `admin/format-ogretme.html`

Özellikler:
- Format listesi (kullanım, başarı oranı, son kullanım)
- Bir formata tıklayınca:
  - Mevcut `parser_kural` JSONB'si göster
  - "AI Taslak Üret" butonu → son başarılı parse'tan kural taslağı oluştur, kullanıcıya göster
  - JSONB editör (manuel düzenleme)
  - "Test Et" butonu → bir PDF yükle, L2 parser ile sonucu göster
  - "Aktif Et" butonu → `parser_kural` kaydet, `egitim_kaynagi='AI_taslak_onayli'`
- Test loop: AI taslak → kullanıcı düzeltme → tekrar test → onay

### 4.4 — Metrik Dashboard Sorguları (~30 dk)

Bu hafta hangi parse seviyesi dağılımı:
```sql
SELECT 
  COUNT(*) FILTER (WHERE basarili = true) AS toplam_basarili,
  COUNT(*) FILTER (WHERE basarili = true AND http_status = 200) AS L3_AI_cagrisi,
  -- L2 ve cache hit log yazmıyor, response'tan ölçülür (ek sorgu/dashboard)
FROM ai_api_log
WHERE olusturma_at > NOW() - INTERVAL '7 days';
```

Format öğrenme effectiveness:
```sql
SELECT 
  ad,
  format_kodu,
  kullanim_sayisi,
  CASE 
    WHEN parser_kural::text = '{}' THEN 'L3 sadece'
    WHEN basari_orani > 0.8 THEN 'L2 başarılı'
    ELSE 'L2 zayıf, L3 fallback sık'
  END AS durum
FROM izometri_format_tanimlari;
```

---

## 5. 49 İkincil Hedefler (kalan zamana göre)

### Cache effectiveness ölçümü (~30 dk)

Cache HIT log yazmıyor (MK-48.4). Ama `_cache_meta`'lı response'lar Vercel function logs'ta görülebilir. Basit bir Vercel log query yazılabilir:

```
"izometri-oku" AND "(CACHE HIT)"
```

veya yeni bir kolon eklenebilir (`cache_hit BOOLEAN`) — ama bu **49'da gerek değil**, 50+'da metrik dashboard için düşünülür.

### Vercel `vercel.json` `maxDuration` (~10 dk)

48'de unutuldu. `maxDuration: 60` belirteci eklemek gelecekte timeout sürprizleri önler. Atomik işlem.

### `package-lock.json` düzenli yenileme alışkanlığı (~10 dk)

48'de keşfedildi: lock değişikliği Vercel cache invalidation tetiklemiyor olabilir. Periyodik `rm -rf node_modules package-lock.json && npm install` (örneğin oturum başlarında) cache karışıklığını önler.

---

## 6. 49 Sonrası — 50+ Yol Haritası

49'un sonucuna göre:

**L2 başarılı (basari_orani > 0.8):**
- 50+: Wizard tasarımı (devre yükleme sihirbazı), Excel + PDF + arşiv döküman entegrasyonu
- Async kuyruk **gerek değil** (L2 5 dk'da 1000 spool biter)
- Format öğrenme her yeni format için tekrar (Tersan Cadmatic, sonradan eklenecek tersaneler)

**L2 zayıf (basari_orani < 0.5):**
- 50+: L3 fallback ana akış kalır, async kuyruk altyapısı (Vercel Cron + is_kuyrugu) kurulur
- 1000 spool senaryosu kuyruktan saatlerce parse edilir

**Karma (basari_orani 0.5-0.8):**
- 50+: Hibrit — L2 dene, başarısızsa L3, L3 sonucu kuyruğa atılmadan önce paralel parse (Promise.all 3-4 PDF)

### 50+ Bağımsız Strateji Konuları (L2 sonucundan ayrı)

48 son saat içgörüleriyle ortaya çıkan **iş modeli/strateji temel borçları**:

**50 oturum (acil):**
- **PDF Storage altyapısı** — Şu an PDF'ler kaydedilmiyor (Vercel function memory'de geçici). Supabase Storage entegrasyonu: `tenant_id/devre_id/dosya.pdf` path. spool kaydında `pdf_storage_path` kolonu. Knowledge Pack için kritik temel.
- **`kullanici_duzeltmeleri` tablosu** — Tip 3 pasif öğrenme (Vizyon 8) için. Manuel onay sırasında değişen alanlar burada birikecek.

**51-52 oturumlar:**
- **`OGRENME-STRATEJISI.md`** — Fine tuning YOK / RAG VAR ilkesinin belgesi. 3 tip öğrenme açıklaması. AresPipe stratejik temel belgesi.
- **`VERI-TASINABILIRLIK.md`** — KARAR-48.1 (B yaklaşımı) operasyonel hali. İki paket türü:
  1. **Tenant Data Pack** — Müşterinin kendi malı (devreleri, PDF'leri). Çıkışta teslim + silme.
  2. **System Knowledge Archive** — AresPipe iç envanteri (anonim format kuralları, genel istatistikler). Müşteri çıkışında sistemde kalır.
  Sözleşme metni temeli buradan çıkar.
- **Knowledge Pack üretici script** — Aylık otomatik snapshot (her iki paket türü için).

**Daha uzak:**
- `PROJE-DURUM.md` — Genel sağlık özeti tek dosyada (50+ oturum)
- `EKONOMI-MODELI.md` — 49 format öğrenme sonuçlarına göre maliyet/fiyatlama modeli
- Pasif öğrenme RAG context implementasyonu (Vizyon 8)
- Çapraz validasyon 3 katmanlı kontrol (Vizyon 3)
- 3 görünüş okuma (Vizyon 6)

---

## 7. Açık Borçlar (47-48'den devralanlar, 49'da dokunulmaz)

Bu liste **49'a engel değil**, ama genel hatırlatma:

- KK + Sevkiyat sayfa revizyonu (5+ oturumdur açık)
- Büküm modal açıklama alanı eksik
- boru_olculer şema güncellenmeli
- CuNi P0 grupları
- devre_yeni.html PDF upload akışı parser'a bağlanması (50+ wizard ile)
- Cadmatic glyph reverse araştırması (49+, ama 49'da PAOR'a odaklan)
- `public_feedback` Security Definer View tasarım kontrolü
- CLAUDE.md halüsinasyon filtresi 7→8 düzeltme
- 016 numaralı flanş cizim_path migration disk'te yok
- 3D motor Aşama 4.1/4.2/4.3 (parser olgunlaştıktan sonra)

---

## 8. 49 Süre Tahmini

- Açılış ritüeli + bağlam tazeleme: 15 dk
- Mevcut durum SQL'leri + analizi: 15 dk
- 4.1 AI Taslak Üretici: 60 dk
- 4.2 L2 Parser Engine: 60 dk
- Lokal test (5+ PAOR PDF ile): 30 dk
- 4.3 Admin Panel Format Öğretme: 60 dk
- 4.4 Metrik dashboard sorguları: 30 dk
- Canlı doğrulama + commit + push: 30 dk
- Kapanış dosyaları: 30 dk

**Toplam: ~5 saat.** Yoğun oturum. Eğer 4.3 admin paneli zaman almazsa 5 saatte biter, alırsa 50'ye taşar (4.3'ün uzaması normal).

---

## 9. 49 Başarı Kriterleri

Aşağıdaki kanıtlar gelirse 49 **başarılı kapanır**:

1. ✅ `paor_aveva_ana.parser_kural` dolu (boş değil)
2. ✅ `paor_aveva_ana.egitim_kaynagi = 'AI_taslak_onayli'`
3. ✅ Lokal test: bir PAOR PDF L2 ile parse edildi, AI çağrısı yok, sonuç doğru
4. ✅ Canlı test: bir PAOR PDF yüklendi, response'ta `_parser_seviye: 'L2'` veya benzer işaret
5. ✅ `ai_api_log`'da L2 başarılı parse sonrası **YENİ AI çağrısı log'lanmadı** (Vision AI gerçekten atlandı)

Bu 5 kanıt gelirse 49 sonu **Vizyon Madde 4'ün öğrenme döngüsü canlıda çalışıyor** denebilir. Bu küçük bir adım gibi görünür ama AresPipe'in iş modelinin ekonomik temeli.

---

## 10. 49'a Özel Notlar

**Cihat'ın stratejik içgörüsü:** Aynı tersane, aynı gemi, aynı CAD program → format **çoğunlukla aynı**. Yıl 1: 10-15 format öğrenilir, sonra çok az yenisi gelir. Bu **scaling avantajı** — sistemin ekonomik fizibilitesi yıllar geçtikçe artar.

**NB1124+NB1125 senaryosu:** Aynı 1000 PDF iki gemiye yüklenir. Format öğrenildiyse: NB1124 (ilk yükleme) → AI 0-1 kez (zaten öğrenildi), L2 1000×. NB1125 (paralel veya sonra) → cache HIT 1000× ($0 + 50 dk). Bu 49 sonrası senaryo gerçek olur.

**Pasif öğrenme (Vizyon 8) için zemin:** 49 sonrası kullanıcı düzeltmeleri (manuel onay verirken yaptığı değişiklikler) `parser_kural`'a feedback olarak yazılabilir. 50+'da düşünülür.

**Tersan Cadmatic:** PAOR başarılı olursa şablon hazır. Tersan glyph problemi nedeniyle parser_kural çıkarmak zor olabilir, ama **fingerprint zaten doğru tutuyor** (47'de doğrulandı), L3 fallback varsayılan kalır. PAOR'a odaklan, Tersan ileride.

---

## 11. Tetikçi Eylem (49 başında ilk 30 dk)

Ritüel sonrası dorudan şu sırayla:

1. Yukarıdaki SQL sorgularını çalıştır → format kütüphanesi gerçek durumu
2. Cihat'tan 4.1 tasarım kararı al: AI taslak üretimi (a/b/c seçeneği)
3. Karar (c) ise → admin panel sayfası önce mi sonra mı? Hızlı kazanım için: backend taslak üretici + manuel SQL ile parser_kural doldurma → L2 test → sonra admin panel UI
4. PAOR ile lokal test başlat (Cihat'ta zaten test PDF'leri var)

49 hızlı başlasın, ortada yavaşlamasın. 4.3 admin panel **bonus**, ana iş 4.1 + 4.2 + lokal test.
