# AresPipe — 11. Oturum Gündemi

> 10. oturumda biriken işler ve sonraki oturum öncelikleri.
> Başlangıçta bu dosyayı + CLAUDE.md + CLAUDE-SON-OTURUM.md birlikte oku.

---

## Oturum Başı Ritüeli

1. **CLAUDE.md** oku — mimari, kurallar (E-01, E-02, E-03, E-04, E-05, B-01, F-01)
2. **CLAUDE-SON-OTURUM.md** oku — 10. oturum ne yapıldı, deploy durumu
3. Bu dosya (**CLAUDE-SONRAKI-OTURUM.md**) — ne yapılacak
4. `/mnt/user-data/outputs/` klasörünü tara — önceki AI'dan yarım iş var mı?
5. **Kullanıcıya sor:**
   - "8+9+10. oturum deploy'u test ettin mi?"
   - "Devre detay'da inline edit + toplu seçim akışlarını duplicate spool ile denedin mi?"
   - "Hangi iş? Öncelik 0 (test) mi, yeni kod mu?"

## 10. Oturum Sonu QA Keşifleri (11. oturumda devam)

Oturum sonu sprint'i sırasında 2 QA ekran görüntüsü gelmiş, iki sorun daha düzeltildi:

### QA bulgu 1: Devre detay Malzeme Listesi tablosu
- **Malzeme kolonu** E-01 ihlali: raw canonical kod (`bakir`, `diger`) görünüyordu
- **Fix:** `ARES_NORM.malzemeEtiket()` sarması eklendi (satır 1549 — `_malzemeGoster` bu dosyada tanımlı değildi, direkt ARES_NORM çağrıldı)
- **Kalite kolonu** ise **veri problemi**: DB'deki `spool_malzemeleri.kalite` alanında malzeme kodları (`bakir`, `diger`) yazılı — 6. oturumdan bilinen "kalite alanı malzeme gibi davranıyor" bug'ı. Devre_yeni formunda kalite alanı malzeme radio grubu gibi çalışıyor olabilir. **UI ile çözülemez**, DB temizliği + form validation gerekir (Öncelik 11 öneri)

### QA bulgu 2: Spool detay AR dilde TR kalıntıları
- STAGES progress tracker hardcode `['Ön İmalat', 'İmalat', ...]` kullanıyordu — STAGE_KEYS array'i tanımlıydı ama `renderTracker` i18n'e bağlamıyordu
- Chip metinleri ("Henüz başlanmadı", "Tamamlandı", "X aşamasında") hardcode Türkçe
- "X Tamamla" butonu Türkçe string concat
- ALIST_CFG'nin `tr` fallback'i gösteriliyordu, anahtarlar (sp_alist_*_note) dil dosyasında yoktu
- **Fix:** 7 yeni dil anahtarı (3 dil × 7 = 21), renderTracker i18n sarması, placeholder pattern `{stage}` ile replace

### Öncelik 11 öneri (yeni) — Kalite alanı UX + veri temizliği
6. oturumdaki "Kalite alanı malzeme radio gibi" bug'ı hâlâ duruyor:
- `spool_malzemeleri.kalite` ve `spooller.kalite` kolonlarında canonical malzeme kodu (`bakir`, `diger`) yazılı kayıtlar var
- Form validation eksik: kullanıcı "Bakır Alaşım" seçtikten sonra Kalite alanına aynı şeyi yazabiliyor
- **Fix stratejisi:**
  1. Form: Kalite alanına serbest text + autocomplete (ST37, A106-B, 304L, CuNi10Fe1.6Mn vb.)
  2. Validation: canonical malzeme kodu girerse uyar
  3. DB temizliği: `UPDATE ... SET kalite = NULL WHERE kalite IN ('karbon','paslanmaz','bakir','alum','diger')` — ama önce kullanıcıya danış, gerçek kalite değeri kaybolmasın
- **Süre:** 1-2 saat
- **Risk:** Orta (veri temizliği)

---

## 🔴 ÖNCELİK 0 — DEPLOY + TEST BORCU TEMİZLE (YENİ KOD YOK)

**Bu oturum yeni kod yazma zamanı değil. 3 oturumluk değişiklik birikti, test edilmedi.**

### Deploy sırası

1. **3 dil dosyası** (lang/tr.json, en.json, ar.json — 1366 → 1370 anahtar)
2. **`devre_yeni.html`** (2271 → 2286, 3-buton popup)
3. **`spool_detay.html`** (3139 → 3151, _projeNo rename + dropdown E-01)
4. **`devre_detay.html`** (1994 satır, 14 patch — en riskli, sonuncuya bırak)

### Test senaryoları — manuel QA

**8. oturum işleri:**
- [ ] Admin → Yeni Firma → Firma Kodu alanı 2. kutu olarak görünüyor mu?
- [ ] Firma Detay sayfasında kod turuncu mono badge olarak üstte mi?
- [ ] Yeni spool oluştur → DB'de `A-000001` (6 hane padded), UI'da `A-0001` (4 hane kırpık) mı?
- [ ] 10000+ spool → UI'da `A-10000` doğal uzunluk mu?

**9. oturum işleri:**
- [ ] Aynı `proje + devre_no + zone` kombinasyonu gir → devre dedup popup çıkıyor mu?
- [ ] Popup info kartında proje adı + iş emri (turuncu badge) + devre_no + zone görünüyor mu?
- [ ] "Mevcut devreye ekle" seç → "5 spool bu devreye eklenecek" onay mesajı var mı?
- [ ] Aynı `pipeline+spool_no+rev` girince spool dedup popup çıkıyor mu?
- [ ] Fark popup'ta pill'lerde `Bakır Alaşım ×3` sayım var mı?

**10. oturum işleri (kritik):**
- [ ] **Öncelik 1 — 3 buton:** Spool çakışmada 3 buton görünüyor mu? "Çakışanları atla" mavi vurgulu default mı?
- [ ] "Çakışanları atla" bas → sadece yeni spool'lar INSERT edildi mi? (hepsi çakışıyorsa amber toast çıkıyor mu?)
- [ ] "Zorla ekle" bas → eski davranış (duplicate oluşur) çalışıyor mu?
- [ ] **Öncelik 2 — Toast:** Spool insert hatası durumunda amber toast gözüküyor mu? (DB manuel bozup test edebilirsin: örn. tenant_id NULL yap, RLS reddeder, toast çıkmalı)
- [ ] **Öncelik 5 — Rename:** spool_detay aç → başlıkta marka formatı doğru mu? (`NB1137-M100-...`)
- [ ] QR modalı aç, yazdır butonu, etiket marka → proje_no + pipeline + spool_no + RevN?
- [ ] KK modal ve Sevk modal başlıkları "NB1137 — Y100-817-007 — S02" gibi görünüyor mu?
- [ ] **localStorage migration:** Browser console'da `localStorage.getItem('ares_aktif_spool')` yaz — içinde `_projeNo` var, `_gemi` yok mu?
- [ ] Eski kullanıcı senaryosu: Console'da manuel `localStorage.setItem('ares_aktif_spool', JSON.stringify({_gemi:'ESKI'}))` yaz, sayfayı yenile → console'da yine `_projeNo:'ESKI'` olmalı (migration çalıştı)
- [ ] **Öncelik 6 — Dropdown:** Bir spool'u Düzenle → yüzey ve malzeme selectleri **seçili geliyor mu**? (eskiden boş görünürdü)
- [ ] Malzemeyi değiştir, kaydet → DB'de `malzeme='paslanmaz'` canonical mı? ("Paslanmaz" DEĞİL)
- [ ] Dil değiştir (TR→EN) → select option'ları "Carbon Steel" vb. oluyor mu?
- [ ] Epoksi seçeneği yok mu? Diğer seçeneği var mı?
- [ ] **Öncelik 7 — Duplicate spool_no:** Aynı devrede pipeline1+S01 ve pipeline2+S01 oluştur (manuel DB insert veya import). Devre detay aç:
  - [ ] Inline edit: ikinci spool'un rev'ini güncelle → sadece o güncelleniyor mu?
  - [ ] Sağ tık menü → Durdur → sadece doğru spool mu durdurulyor?
  - [ ] Toplu KK/Sevkiyat modal → iki spool ayrı ayrı checkbox'layabiliyor mu?
  - [ ] Etiket modal → iki spool ayrı ayrı seçilebiliyor mu? DOM'da `etc_UUID1`, `etc_UUID2` ayrı mı?
  - [ ] Sil → sadece bir tanesi mi siliniyor?
- [ ] Excel import: aynı spoolNo zaten varsa atla uyarısı hâlâ çalışıyor mu? (client-side validation — Öncelik 7 scope'u dışı, ama regresyon kontrol)

### Eğer bug bulunursa

- **Küçük bug:** 11. oturumda hemen düzelt, sonraki test turu öncesi
- **Büyük bug:** 11. oturumun tamamı bu bug'a ayrılabilir — yeni öncelik ekleme
- **Hangi oturum kırdı belirsizse:** git diff ile son 3 oturumun değişiklik noktaları taranacak (6. oturum dersi #6)

---

## ÖNCELİK 4 — Denormalizasyon Borcu (spooller ↔ spool_malzemeleri)

**Büyük iş, 3-4 saat, yüksek risk. Önerilen Option A:**
- `spooller.malzeme/kalite` kolonlarını kaldır
- UI her zaman `spool_malzemeleri`'nden aggregate etsin
- Yeni `ARES_AGG.spoolMalzemeleri(spoolId)` helper'ı (en yaygın malzeme+kalite döner)

**Etki analizi gerekli — kullanım noktaları:**
- `spooller.malzeme` SELECT eden dosyalar: `devre_detay.html`, `spool_detay.html`, `kesim.html`, `markalama.html`, `devreler.html`
- `spool_malzemeleri.malzeme` SELECT eden dosyalar: `spool_detay.html` (zaten aggregate yapıyor)

**Önce grep**, sonra mimari karar.

---

## ÖNCELİK 5 DEVAMI — DEVRE.gemi → DEVRE.projeNo (Öncelik 5'in devamı)

**`devre_detay.html` içinde:**
- `DEVRE.gemi` 10+ satırda referans (başlık, breadcrumb, Excel export, yazdır window, etiket kart)
- `devreler.html` → `devre_detay.html` arası localStorage persist var
- `ares-store.js` satır 352: SELECT `projeler(proje_no, gemi_adi)` — `gemi_adi` AYRI alan

**Önemli ayrım:**
- `DEVRE.gemi` = `projeler.proje_no` (NB1137 gibi newbuild kodu)
- `projeler.gemi_adi` = **gerçek gemi adı** ("MV Ocean Star" vs)
- İkisi de "gemi" ama anlamları farklı — rename gerektiriyor

**Tahmini süre:** 1.5-2 saat. Orta risk.

---

## ÖNCELİK YENİ — Client-Side Duplicate Validation

**10. oturumda keşfedildi:** `devre_detay.html` satır 1352 + 1886 — spool ekleme/import kontrolleri sadece `spoolNo` bakıyor:

```js
if(SPOOLS.find(function(s){return s.spoolNo===sn;})){showToast('Bu Spool No zaten var','e');return;}
```

Pipeline farklıysa aynı spoolNo meşru olabilir (pipeline1+S01, pipeline2+S01). Bu validation aşırı kısıtlayıcı.

**Fix:** `pipeline+spoolNo+rev` birlikte bak:
```js
if(SPOOLS.find(function(s){return s.spoolNo===sn && s.pipeline===pl && (s.rev||'')===(rev||'');})){...}
```

**Süre:** 30 dk. Düşük risk.

---

## ÖNCELİK YENİ — Kural B-02: Stabil Local Key Pattern'i

**Öneri:** Öncelik 7'de `_lk` pattern'i çözüm oldu — CLAUDE.md'ye kural olarak ekle.

**Kural B-02 (taslak):**
> Client-side array'lerde duplicate olabilecek domain alanlarını (`spool_no`, `kod`, `id`) **key olarak kullanma**. Bunun yerine her kalem için `_lk` (local key) alanı tanımla:
> ```js
> item._lk = item.id || ('new_' + Date.now() + '_' + Math.random().toString(36).slice(2,9));
> ```
> - find/filter/DELETE: `item._lk === lk`
> - Selection state: `_secili[item._lk]`
> - DOM ID: `prefix_${item._lk.replace(/[^a-z0-9]/gi,'_')}`

**Süre:** 15 dk (CLAUDE.md'ye ekle). Risk sıfır.

---

## ÖNCELİK 10 ✅ — EN/AR Dil Dosyası Toplu Çeviri (10. oturum sonunda tamamlandı)

**10. oturum sonu güncellemesi:**
- EN: 355 çeviri uygulandı (348 → 42 kalan, hepsi evrensel terim)
- AR: 322 çeviri uygulandı (319 → 8 kalan, hepsi evrensel terim)
- Bonus: 7 TR placeholder bug'ı düzeltildi (TR'de yanlışlıkla İngilizce kalan metinler)
- 3 dil simetri: 1370 anahtar

**11. oturumda bu iş için bakılacak:**
- [ ] Test: Dil değiştir (TR → EN → AR), rastgele 10 ekran tara. Yarım çeviri var mı?
- [ ] Test: Arapça RTL doğru çalışıyor mu? (`السبول`, `خط الأنابيب` vb. doğru sağdan sola dizim)
- [ ] Eğer rahatsız eden bir çeviri varsa, direkt JSON dosyasında düzelt (ufak manüel fix, yeni toplu iş gerektirmez)
- [ ] Yeni anahtar eklerken **her üç dilde ekle** — 9. oturum dersi #3 hâlâ geçerli

**Çeviri script'i referans:** `/home/claude/translate_batch.py` — terim tutarlılığı sağlamak için yeni çeviriler eklenirken bakılabilir.

---

## ÖNCELİK 8-9 — Önceki Oturumlardan (değişmedi)

### Öncelik 8: Mobil Ekranlar (React)
- MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- Mockup-first (R-10)
- **Risk:** Düşük her biri, toplam 6-12 saat

### Öncelik 9: Düşük Öncelik / Teknik Borç
- QR indir butonu PNG/SVG export
- Search haystack markaId ekleme
- `spooller` ve `devreler` UNIQUE constraint (DB-level koruma, JS'e güvenmeden)
- **Toplam:** 1-2 saat

---

## 10. Oturumdan Yan Bulgular (11. oturuma not)

### Doğrulanan gözlemler
- ✅ **`devreler.zone_no` DROP edildi** — migration-in-progress ikiliği temiz
- ✅ **spool_detay legacy localStorage migration** çalışıyor — test senaryosuyla kontrol et
- ✅ **14 patch devre_detay JS syntax temiz** — ama entegre test zorunlu

### Yeni bulgular
- **`SP._projeNo||SP._gemi` fallback kozmetikti** — atama yoksa OR pattern'i işlevsiz (öğrenme 9. oturum dersi #2'nin teyidi)
- **`devreler.notlar` kolonu + `notlar` tablosu ikiliği** — ayrı araştırma: hangi canonical, neden ikisi var?
- **`DEVRE.gemi` = `projeler.proje_no`** (devre_detay'da), **`projeler.gemi_adi` = gerçek gemi adı** — isim çakışması, rename gerek
- **Client-side duplicate validation aşırı kısıtlı** (sadece spoolNo bakıyor)
- **`_lk` pattern'i mükemmel çalıştı** — kural olarak yazılabilir (B-02 taslağı yukarıda)

### Hâlâ Geçerli Eski Bulgular
- **Migration-in-progress pattern yaygın:** `fotograflar.yapan_id/yukleyen_id`, `spooller.agirlik/agirlik_kg`
- **RLS policy'leri hazır** — yeni işlere tenant_id eklemek şart
- **Supabase key JWT format** — 2. oturumdan karar

---

## Özet — 11. Oturum Ne Beklenebilir

**Kısa:** 10. oturumda 6 öncelik bitti ama 3 oturumluk test borcu var. 11. oturum **önce deploy + test**. Yeni kod sadece bug çıkarsa. Test temizse, sonraki büyük iş **Öncelik 5 devamı (DEVRE.gemi rename)** veya **Öncelik 10 (EN/AR toplu çeviri)**.

**Risk uyarısı:** 
- `devre_detay.html` 14 patch, tam test edilmedi
- `spool_detay.html` rename + dropdown iç içe, iki ayrı fix birlikte deploy
- `devre_yeni.html` artık 2286 satır, karmaşık

**Öneri oturum yapısı:**
1. İlk 30 dk — deploy + smoke test (her dosya tek tek)
2. Sonra 1-2 saat — tam test (yukarıdaki checklist)
3. Bug varsa — düzelt
4. Zaman kalırsa — Kural B-02'yi CLAUDE.md'ye ekle (hızlı kazanım)
5. Gerisi sonraki oturuma
