# 186 — Prompt & Cache Mimarisi: Tasarım Spec'i

> **Hazırlık:** Oturum 185 (15 Haziran 2026)
> **Hedef oturum:** 186
> **Statü:** Tasarım — uygulama 186'da. Bu doküman 186 açılışında okunur, oradan başlanır.
> **Tetikleyen:** PAOR 782 çiziminde L3 spool sayımı hatası (3 yerine 1). Kök neden zincirinde
> ortaya çıkan iki yapısal boşluk: (1) prompt override mimarisi ölçeklenmiyor, (2) cache
> invalidation prompt değişimine bağlı değil. Cihat'ın sorusu: *"İleride başka formatlar
> gelince bu daha karmaşık bir yapı olmaz mı? Problemi halı altına mı süpürüyoruz?"* — EVET,
> şu anki yaklaşım halı altı. Bu doküman kalıcı çözümü tasarlar.

---

## 1. Problem — neyi çözüyoruz

İki ayrı ama bağlı yapısal sorun:

### 1.1 Prompt override ölçeklenmiyor
Şu an `izometri-oku.js:721`:
```js
const sistem_prompt = formatBilgisi.prompt_template || YAKLASIM_Y_PROMPT;
```
Bu **override** — format'ın prompt_template'i varsa varsayılanı TAM EZER, eklemez.

**Sonuç:** Her format izole bir prompt taşır. Evrensel bir kural (örn. "spool sayısını TÜM
[n] marker'larından say, 2/3/5 fark etmez") bir formata yazılınca diğerlerine yayılmaz.

**185'te yaşandı:** Spool sayma düzeltmesi (`[1][2][3]`=3) yalnız PAOR prompt_template'ine
yazıldı (migration 105). Ama bu **evrensel bir kural** — Tersan'da da `[n]` marker'ı varsa
aynı düzeltme lazım, ama Tersan varsayılan prompt'u kullandığı için faydalanmıyor. Aynı
mantık iki yere yazılırsa = DRIFT riski (tam MK-184.1'in kaçındığı şey, prompt katmanında
tekrarlandı).

**Ölçek problemi:** N format → N izole prompt. Her yeni format = tam prompt bakımı +
evrensel düzeltmeleri N yere kopyalama. 2 formatta yönetilebilir, 5+ formatta migration acısı
ve tutarsızlık kaçınılmaz.

### 1.2 Cache invalidation prompt değişimine bağlı değil
Cache anahtarı (`cacheKontrol`, izometri-oku.js:516 + migration 021 partial index):
```
pdf_sha256 + format_id + tenant_id + basarili=true
```
**Prompt sürümü anahtarda YOK.**

**Sonuç:** Prompt değişince eski cache hâlâ "geçerli" sayılır → eski/yanlış sonuç döner.
Düzeltme yolu yalnız ELLE cache invalidation (`basarili=false` UPDATE).

**185'te yaşandı (köstebek oyunu):** PAOR prompt'unu düzelttik (09:36) ama 782 her test
edildiğinde eski cache HIT verdi. Her yükleme yeni cache yazıyordu ama eski prompt'la. ~3
saat "neden hâlâ 1 spool" diye uğraşıldı. Kök: cache, prompt sürümünden habersiz.

**Manuel temizliğin maliyeti:** 185'te tek format (PAOR) için 46 cache elle invalidate edildi.
Her prompt değişiminde, her format için bu tekrarlanır. Ölçeklenmez.

---

## 2. Mevcut durum — kesin teknik referans (185'te doğrulandı)

### 2.1 Prompt seçimi
- `izometri-oku.js:721`: `formatBilgisi.prompt_template || YAKLASIM_Y_PROMPT`
- `YAKLASIM_Y_PROMPT`: izometri-oku.js:957-1088 (132 satır, ~6160 karakter). Madde 1-9 +
  çıktı formatı. Evrensel kurallar burada gömülü.
- `prompt_template`: `izometri_format_tanimlari.prompt_template` (text, nullable). DB'de format
  başına. 185'te PAOR Ana'ya (`995b5514`) güçlendirilmiş tam-kopya yazıldı (migration 105).

### 2.2 Cache mekanizması
- `cacheKontrol` (izometri-oku.js:516): SELECT `pdf_sha256=X & format_id=Y & tenant_id=Z &
  basarili=true & cevap_full not null` → `order olusturma_at.desc limit 1`.
- Migration 021: `idx_ai_api_log_cache ON (pdf_sha256, format_id) WHERE basarili=true`.
- Cache yazımı: `visionAIParse` her başarılı L3 sonucunu `ai_api_log`'a yazar (cevap_full +
  pdf_sha256 + format_id). MISS olunca yeni satır.
- Invalidation: SADECE elle `basarili=false`. Otomatik mekanizma yok.

### 2.3 Format dağılımı (185 canlı sayım — ai_api_log L3 cache)
| format_id | cache | format |
|---|---|---|
| null | 251 | format_id'siz (eski/karışık) |
| e1fb879d | 46 | Tersan Cadmatic Spool (imalat) |
| **995b5514** | 45→46 | **PAOR Ana** (prompt fix hedefi) |
| 15243262 | 27 | PAOR Isometric View |
| 39a2c81b | 15 | Tersan Cadmatic Montaj |
| 84c12f61 | 15 | Tersan Isometry (emekli) |

> Önemli: Tersan'ın L3 cache'i de var (46+15+15=76). Cache mimarisi değişimi Tersan'ı da
> etkiler — kapsam kararı kritik (bkz. §6 risk).

### 2.4 Zaten var olan doğru desen — PARSER tarafı
`format-paketleri.js` parser kurallarını KATMAN kompozisyonuyla yönetir:
- Katman 0 EVRENSEL < 1 aile < 2 malzeme < 3 gemi (specificity = katman no)
- `AILE_KAYIT[format_kodu]` = katman listesi (örn. tersan_cadmatic_spool = [EVRENSEL,
  A1_TERSAN, MALZEME_KARBON, MALZEME_PASLANMAZ])
- `katman-birlestirici.js` bunları birleştirir.

**Tutarsızlık:** Parser kompozisyon kullanıyor, prompt override kullanıyor. **Doğru desen
kodda zaten var, sadece prompt'a uygulanmamış.** Bu, çözümün temel argümanı: prompt'u da
parser gibi katmanlı/kompozisyonel yap.

---

## 3. Hedef mimari

İki bağımsız ama tamamlayıcı değişiklik:

### 3.1 Prompt: override → KOMPOZİSYON

**İlke:** Prompt = `EVRENSEL_CEKIRDEK` + `format.ek_prompt`. Override değil, ekleme.

```
sistem_prompt = EVRENSEL_PROMPT
              + (format.prompt_ek ? "\n\n## FORMAT-OZEL EKLER\n" + format.prompt_ek : "")
```

**İki katman:**
- **Evrensel çekirdek** (tek kaynak): Uydurma yapma, spool sayısını TÜM [n] marker'larından
  say (2/3/5+ fark etmez), FABRICATION/ERECTION ayır, yüzey eşleme, güven skoru, çıktı
  formatı. = bugünkü YAKLASIM_Y_PROMPT'un güçlendirilmiş hali. **Spool sayma düzeltmesi
  BURAYA gider** → tüm formatlar (Tersan dahil, gelecekler dahil) otomatik faydalanır.
- **Format-özel ek** (sadece fark): "PAOR'da SPOOL kutusu ERECTION listesinin altındadır",
  "Cadmatic'te glyph -29 Sezar kaymıştır" gibi YALNIZ o formata özgü, kısa ipuçları.

**Kazanım:**
- Evrensel düzeltme tek yerden tüm formatlara yayılır (drift yok).
- Yeni format = kısa ek prompt (5-10 satır), tam prompt kopyalama yok.
- `format.prompt_ek` boşsa → saf evrensel (geriye uyumlu: bugünkü Tersan davranışı).

**Şema değişimi:** `izometri_format_tanimlari`'ya `prompt_ek` (text, nullable) kolonu.
`prompt_template` (mevcut) deprecated edilir veya migration ile prompt_ek'e taşınır.
(185'teki PAOR prompt_template'i = tam kopya; kompozisyona geçince yalnız PAOR-özel kısmı
prompt_ek olur, evrensel kısım çekirdeğe döner.)

### 3.2 Cache: prompt sürümü anahtara girer

**İlke:** Cache anahtarına prompt sürümü eklenir. Prompt değişince eski cache otomatik MISS.

**İki alternatif (186'da seçilecek):**

**(A) prompt_hash anahtarda**
- Her cache kaydına `prompt_hash` yaz (kullanılan sistem_prompt'un SHA256'sı, ilk 12 hane).
- `cacheKontrol` lookup'a `&prompt_hash=eq.${guncel_hash}` ekle.
- Prompt değişti → hash değişti → eski cache MISS → taze parse → yeni hash'le cache.
- **Artı:** Tam otomatik, hiç elle temizlik gerekmez, hassas (en küçük değişikliği yakalar).
- **Eksi:** Her küçük prompt düzenlemesi tüm cache'i sıfırlar (maliyet — ama doğru davranış).
  Şema: `ai_api_log`'a `prompt_hash` kolonu + index güncelleme.

**(B) cache_gecersiz_oncesi timestamp**
- `izometri_format_tanimlari`'ya `cache_gecersiz_oncesi` (timestamptz) kolonu.
- `cacheKontrol` lookup'a `&olusturma_at=gte.${format.cache_gecersiz_oncesi}` ekle.
- Prompt değiştirince bu timestamp'i now() yap → o tarihten eski cache MISS.
- **Artı:** Manuel kontrol (sadece istediğinde sıfırlar), format-bazlı, basit.
- **Eksi:** Elle güncelleme gerekir (prompt değişince timestamp'i set etmeyi unutma riski).
  Yarı-otomatik.

**Öneri:** (A) prompt_hash — tam otomatik, "unutma" riski yok, köstebek oyununu kökten bitirir.
Maliyet endişesi PAOR/düşük-hacim pilotta önemsiz. (B) daha az kod ama disiplin gerektirir.
186'da karar.

---

## 4. ENGEL — MK-49.1 (izometri-oku.js DOKUNULMAZ)

**Her iki değişiklik de `izometri-oku.js`'e dokunmayı gerektirir:**
- Prompt kompozisyonu: satır 721 (`sistem_prompt` kurulumu) + EVRENSEL_PROMPT tanımı
- Cache sürümleme: `cacheKontrol` (516) lookup + cache yazımına hash/timestamp ekleme

MK-49.1 (47. oturum, "1206 satır handler felaketi" dersi): izometri-oku.js minimum değişiklik,
format mantığı lib/'e.

**Değerlendirme:** Bu değişiklikler CERRAHİ — birkaç satır, izole, test edilebilir. 47'deki
felaket top-yekûn refactor'dü; bu farklı. Yine de **MK-49.1 esnetme kararı 186 açılışında
açıkça verilmeli.** Alternatif: EVRENSEL_PROMPT + kompozisyon mantığını yeni bir lib dosyasına
(`lib/prompt-birlestirici.js`, katman-birlestirici.js modeli) koy, izometri-oku yalnız onu
çağırsın (tek satır değişim). Bu MK-49.1 ruhuna uygun — mantık lib'de, izometri-oku ince.

**Önerilen yapı (MK-49.1 dostu):**
```
lib/prompt-birlestirici.js   (YENİ — EVRENSEL_PROMPT + ek birleştirme, saf fonksiyon)
izometri-oku.js:721          → const sistem_prompt = promptBirlestir(formatBilgisi);  (tek satır)
izometri-oku.js:516          → cacheKontrol'e prompt_hash parametresi (birkaç satır)
```

---

## 5. Geçiş planı (186 — önerilen sıra)

1. **MK-49.1 esnetme kararı** (A/B/C framing, Cihat onayı). prompt-birlestirici.js yaklaşımı
   ile minimum dokunuş.
2. **lib/prompt-birlestirici.js** yaz: `EVRENSEL_PROMPT` (YAKLASIM_Y'nin güçlendirilmiş hali,
   185 spool-sayma düzeltmesi dahil) + `promptBirlestir(formatBilgisi)`. Saf, node --check,
   birim test (PAOR ek + Tersan boş-ek + gelecek format senaryoları).
3. **Migration NNN**: `prompt_ek` kolonu + PAOR'un 185 prompt_template'ini prompt_ek'e indirge
   (yalnız PAOR-özel kısım; spool-sayma çekirdeğe taşındığı için ek'ten çıkar).
4. **izometri-oku.js:721** → promptBirlestir çağrısı (tek satır, MK-49.1 esnetme onayıyla).
5. **Cache sürümleme** (A veya B): migration (prompt_hash kolonu VEYA cache_gecersiz_oncesi) +
   cacheKontrol güncelleme + cache yazımına hash ekleme.
6. **Canlı test:** PAOR 782 (3 spool) + Tersan regresyon (imalat/montaj bozulmadı) + cache
   otomatik tazeleme (prompt değiştir → eski cache MISS doğrula).
7. **185 geçici çözümünü geri al:** PAOR prompt_template (migration 105) artık gereksiz —
   kompozisyona taşındı. Temizle.

---

## 6. Riskler

- **Tersan regresyon (KIRMIZI ÇİZGİ):** Prompt kompozisyonu Tersan'ı da etkiler (evrensel
  çekirdek + boş ek = bugünkü Tersan prompt'u OLMALI). Test: Tersan L3 fallback çıktısı 185
  öncesiyle birebir mi. Evrensel çekirdek = bugünkü YAKLASIM_Y + sadece spool-sayma güçlendirme;
  başka davranış değişikliği OLMAMALI.
- **Cache sıfırlama maliyeti:** prompt_hash (A) prompt değişince TÜM formatların ilgili
  cache'ini sıfırlar → bir sonraki yüklemelerde L3 maliyeti. Tersan L2 ağırlıklı olduğu için
  Tersan etkisi az; PAOR tam L3, etkisi var ama pilot hacmi düşük. Kabul edilebilir.
- **Geriye uyumluluk:** Eski cache'lerde prompt_hash YOK (null). Karar: null-hash cache MISS mi
  sayılsın (güvenli, hepsi tazelenir) yoksa "eski=geçerli" mi (riskli). Öneri: null → MISS
  (temiz başlangıç, bir kerelik tazeleme).
- **format_id=null 251 kayıt:** Bunların ne olduğu 186'da netleşmeli (eski/pre-020 mı, hangi
  format). Cache sürümlemeden bağımsız ama envanter temizliği gerekebilir.
- **MK-49.1 esnetme emsali:** Bu karar bir emsal oluşturur. prompt-birlestirici.js yaklaşımı
  (mantık lib'de) emsali "izometri-oku ince kalır" şeklinde tutar — kuralı bozmaz, ruhunu korur.

---

## 7. Başarı kriteri (186 sonu)

- Yeni format eklemek = kısa `prompt_ek` (5-10 satır) + format kaydı. Tam prompt kopyalama YOK.
- Evrensel düzeltme (örn. spool sayma) tek yerde → tüm formatlar (Tersan + PAOR + gelecek)
  otomatik faydalanır.
- Prompt değişince eski cache otomatik MISS → elle temizlik GEREKMEZ. Köstebek oyunu biter.
- Tersan davranışı 185 öncesiyle birebir (regresyon yok).
- PAOR 782 → 3 spool (kalıcı, cache yeniden yazılınca da doğru).

---

## 8. 185'ten devralınan ilgili durum

- **PAOR prompt fix (geçici):** migration 105, `paor_aveva_ana.prompt_template` güçlendirilmiş.
  ÇALIŞIYOR (773/782 → 3 spool canlı kanıtlı). 186'da kompozisyona taşınınca geri alınır.
- **PAOR cache temizliği:** 185'te 46 PAOR Ana cache'i (eski-prompt) `basarili=false` ile
  invalidate edildi (format_id=995b5514 scoped, Tersan'a sıfır dokunuş, DRY kanıtlı). Bu,
  cache sürümleme (A/B) gelene kadar gereken son MANUEL temizlikti.
- **MK-185.1:** kapsam-etiketli malzeme görünümü (imalat/montaj/işlem çip) — spool_detay,
  ares-normalize.kapsamEtiket. Bu işten BAĞIMSIZ, push'landı (f7936ff).
- **MK-185.2:** PAOR prompt spool-sayma güçlendirme (migration 105) — bu spec'in geçici hali.
- **MK-185.3 (BU DOKÜMAN):** Prompt kompozisyon + cache sürümleme mimarisi. 186'ya devredildi.

---

> 186 açılışında: bu doküman + son-durum.md + CLAUDE-SONRAKI-OTURUM.md okunur. §5 sıra ile
> başlanır. İlk karar: §4 MK-49.1 esnetme (prompt-birlestirici.js yaklaşımı önerili).
