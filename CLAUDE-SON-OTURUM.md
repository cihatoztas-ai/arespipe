# AresPipe — 18. Oturum Özeti (22 Nisan 2026)

## Ana Başlıklar
1. **kesim.html komple refactor** (3-adım wizard → 2-tab modal + read-only destek)
2. **Normalize disiplin bug tanısı + kısmi çözüm** (devre_yeni + spool_detay)
3. **bukum.html + markalama.html** cascade filtering, log format, lokalizasyon
4. **Dil dosyaları** — 69 yeni anahtar (tr/en/ar)
5. **CLAUDE.md** — Kural E-06 (Malzeme/Kalite Ayrımı Altın Kuralı) eklendi

## Değişen Dosyalar

| Dosya | Öncesi | Sonrası | Ana Değişiklik |
|---|---:|---:|---|
| `kesim.html` | 3181 | 3648 | Wizard → 2-tab modal, read-only mod, kerf algoritma fix, PDF layout fix |
| `devre_yeni.html` | 2298 | 2306 | `ifsOku` ham saklama, PDF insert normalize |
| `spool_detay.html` | 3191 | 3218 | Malzeme lokalize, kalite data uyarısı, pipelineAktar defensive normalize |
| `bukum.html` | 893 | 963 | Cascade filter, BUKUM_EKLENDI log, dead code temizliği, malzeme lokalize |
| `markalama.html` | 1354 | 1400 | Cascade filter, MARKALAMA_EKLENDI log + zengin açıklama |
| `tr.json` / `en.json` / `ar.json` | 1442 | 1511 | +69 anahtar (`kld_*` + `cmn_vazgec` + `cmn_onayla` + `ks_boru`) |
| `CLAUDE.md` | — | — | Kural E-06 (Malzeme/Kalite Ayrımı Altın Kuralı) eklendi |

## kesim.html — Komple Refactor

### Mimari Değişiklik
3-adımlı wizard yapısı reddedildi (kullanıcı mockup-first istedi) → **2-tab modal** yapısına geçildi.

**Silinen:** `wizardModal` + duplicate `klDetayModal` + `arcDetayModal` (~350 satır)
**Eklenen:** Tek `klDetayModal` (Boru Listesi + Kesim Planı tab'ı paylaşır) + generic `kldConfirmModal`

### State
```js
_kldKlId, _kldBorular, _kldKesilmisIds, _kldPlans, _kldParams,
_kldTab, _kldParcaSayac, _kldPlanStale, _kldReadOnly, _kldArcIdx,
_kldCfmCallback
```

### Read-Only Mod (Kesilen Listeler için)
- Aynı modalı paylaşır, `_kldReadOnly=true` ile açılır
- Parametre input'ları disabled + soluk
- Parça boru kartında + "Ekle" butonu ve ✕ silme gizli
- Parça boru yoksa kart tamamen gizli
- Footer metni özel: "✓ Kesim tamamlandı. Bu liste artık düzenlenemez, bilgi amaçlı görüntüleniyor."

### Çözülen Bug'lar
- **Bug #1 (kritik):** `kldKesimTamamlaOnayla`'da `closeKLDetay()` çağrısı `_kldKlId=null` yapıyordu. Fix: ID'yi lokal değişkene sakla.
- **Bug #2 (FK violation):** `klIptal` paralel UPDATE+DELETE. Fix: `.then()` içinde seri.
- **Bug #3:** `kldHesapla` tüm boruları hesaplıyordu. Fix: sadece `_kldKesilmisIds`'tekiler.
- **Bug #4 (İşlem log):** `islem: 'KESİM_TAMAMLA'` (Türkçe İ) spool detay tanımıyordu. Fix: `'KESIM_EKLENDI'` (ASCII).
- **Bug #5 (Kerf algoritma):** N parça için N kerf düşüyordu. Doğrusu (N-1) kerf. Fix: `var need = (pattern.length === 0) ? remaining[j] : (remaining[j] + kerf);`

### UX İyileştirmeleri
- Native `confirm()` kaldırıldı → Generic `kldShowConfirm` (success/danger varyant)
- "Planı Kaydet & Devam" vs "Yeniden Hesapla" ayrımı — deneme yanılma DB'ye yazmaz
- Stale plan göstergesi: tab başlığında ⚠, footer uyarısı, "Yeniden Hesapla" turuncu
- PDF: Fixed positioning kaldırıldı → sticky toolbar + akıcı layout
- Cascade filtering: `_havuzExcept(exclude)` helper
- Boru Listesi tabloya **TERSANE + İŞ EMRİ** sütunları
- Parça boru kartı belirgin tasarım (mor tema, empty state mesajı)
- "Kullanılmayan parça borular" uyarısı

## Normalize Disiplin Bug'ı — Tanı + Kısmi Çözüm

### Tanı
- **16 Nisan öncesi:** `normalizeMalzeme()` Türkçe etiket dönüyordu (`"ST37"` → `"Karbon Çelik"`). Kalite kolonuna da etiket yazılıyordu → "Karbon Çelik / Karbon Çelik" kamufle olmuş
- **17 Nisan (3. oturum):** `ares-normalize.js` eklendi, kategori kodu dönmeye başladı (`"ST37"` → `"karbon"`). **`ifsOku` normalize çağrısı güncellenmedi** → bilgi kaybı açığa çıktı, "karbon / karbon" çirkin görünümü.
- **22 Nisan (18. oturum):** Kullanıcı `spool_detay` tablosunda tespit etti ve düzeltildi.

### Yapılan Düzeltmeler
- **`devre_yeni.html` satır 644 (IFS okuma):** `normalizeMalzeme(row[idx.mat])` → `String(row[idx.mat]).trim()`. Ham saklanır.
- **`devre_yeni.html` satır 1900 (İzometri PDF):** `malzeme_cinsi` artık `ARES_NORM.malzemeKod()` ile normalize.
- **`spool_detay.html` `pipelineAktar`:** Defensive normalize. `kalite==malzeme` durumunda kalite NULL (bozuk kaynak verisi savunması).
- **`spool_detay.html` `renderMalzeme`:** Kalite==malzeme ise turuncu italik + uyarı tooltip (görsel data bütünlük sinyali).

### Kalan Teknik Borç (19. oturum)
- `pipeline_malzemeleri` tablosuna yazan kaynak dosya bulunmadı (muhtemelen `proje_detay.html` veya pipeline yönetim sayfası) → 19. oturumun ana konusu
- `spool_detay.html` `newRowKaydet` manuel giriş validation yok
- `kesim_kalemleri` yazım noktaları denetlenmedi
- Mevcut DB'deki bozuk kayıtlar (kalite==malzeme olanlar) migration ile temizlenmeli

### DB Migration SQL (kullanıcı çalıştıracak)
```sql
-- Önce bozuk kayıtları gör
SELECT id, kod, malzeme, kalite, tanim FROM spool_malzemeleri
WHERE LOWER(TRIM(kalite)) = LOWER(TRIM(malzeme));

-- Sonra temizle
UPDATE spool_malzemeleri SET kalite = NULL
WHERE LOWER(TRIM(kalite)) = LOWER(TRIM(malzeme));

-- KL26-023 teknik borç (FK violation'lı iptal denemesi)
UPDATE kesim_kalemleri SET kesim_listesi_id = NULL
WHERE kesim_listesi_id = (SELECT id FROM kesim_listeleri WHERE no = 'KL26-023');
DELETE FROM kesim_listeleri WHERE no = 'KL26-023';
```

## bukum.html + markalama.html — Cascade + Log

### Ortak İyileştirmeler (her iki sayfada uygulandı)
- **Cascade filtering helper:** `_havuzExcept(exclude)` — her filtre için diğer aktif filtreler uygulanmış havuzdan seçenekler
- **Sadece bekleyen havuz:** `uniq` artık `durum==='bekliyor'` üzerinde çalışır
- **Her filtre değişiminde `populateFilters()` tetiklenir:** `onFC`, `clearChip`, `rmMs`, `resetAll`, `toggleMsItem`, `msAll`, `msClearSel`
- **İşlem log standardı:**
  - `BUKUM_TAMAMLA` → `BUKUM_EKLENDI` (ekrandaki "Büküm Eklendi" label'ıyla uyum)
  - `MARKALAMA_TAMAMLA` → `MARKALAMA_EKLENDI`
  - Açıklama kesim pattern'inde: `"Karbon Çelik ST37 Ø168,3 mm - 1800mm"`

### bukum.html'e özel
- `renderRow` duplicate kod bloğu (satır 627-640) silindi (dead code)
- `matBadge(b.malzeme)` → `ARES_NORM.malzemeEtiket(b.malzeme)` lokalize (3 noktada: renderRow, renderKesilenler, showQR)
- Kesilenler için ayrı `_kesilenHavuzExcept` cascade helper

### markalama.html'e özel
- `matBadge` zaten doğru lokalize ediyordu, dokunulmadı
- İş emri multi-select'i de cascade mantığına dahil edildi
- Markalama açıklama formatı zenginleştirildi (yuzey+cap → yuzey+malzeme+kalite+cap)

## Dil Dosyaları — 69 Yeni Anahtar

### Kategori Dağılımı
- 64× `kld_*` — kesim liste detay modalı (tab başlıkları, parametre label'ları, parça boru kartı, butonlar, onay modalı, durum çipleri, footer mesajları, hesaplama/plan/iptal toast'ları)
- 2× `cmn_vazgec`, `cmn_onayla` — ortak
- 1× `ks_boru` — "boru" isim

### TR/EN/AR Hepsinde Tam Çeviri
Örnek:
```
kld_foot_ro_boru_hint:
  tr: "Bu liste artık düzenlenemez, bilgi amaçlı görüntüleniyor."
  en: "This list can no longer be edited, shown for reference only."
  ar: "لا يمكن تعديل هذه القائمة، تُعرض للاطلاع فقط."
```

## CLAUDE.md Güncellemesi

**Kural E-06 eklendi:** `2.13 Enum Normalize Sistemi` bölümü altında yeni alt bölüm — "Malzeme / Kalite Ayrımı — Altın Kural".

İçerik: DB şema ayrımı, doğru/yanlış pattern örnekleri, veri giriş noktaları listesi, historical timeline, DB CHECK constraint önerisi.

Amaç: Bu bug'ın **19. oturumda tekrar kaybolmaması** ve bir sonraki AI'nın aynı hatayı yapmaması.

## Deploy Kontrol Listesi

Sırayla:
1. **Önce SQL migration** çalıştır (yukarıdaki bölüm)
2. **Sonra dosyaları deploy et:**
   - `kesim.html`
   - `devre_yeni.html`
   - `spool_detay.html`
   - `bukum.html`
   - `markalama.html`
   - `tr.json`, `en.json`, `ar.json`
3. **Test noktaları:**
   - Kesim: KL26-016 gibi **kesilmiş** bir liste aç → read-only modda parça boru kartı + footer "bilgi amaçlı" gösteriyor mu?
   - Kesim: Yeni liste oluştur → 2-tab modal açılıyor mu? Plan hesapla → kaydet → kesim tamamla akışı çalışıyor mu?
   - Spool detay: Malzeme Listesi → "Karbon Çelik" görünüyor mu? Kalite==malzeme ise turuncu italik uyarı var mı?
   - Bukum: Filtre uygula → diğer filtre seçenekleri daralıyor mu? Büküm onayla → spool detayında "Büküm Eklendi" log'u görünüyor mu?
   - Markalama: Aynı cascade testi + "Markalama Eklendi" log

## Oturum Boyunca Öğrenilenler

1. **Mockup-first yaklaşım:** Deneme-yanılma yerine önceden tasarım onayı hız kazandırdı (kesim refactor'ünde)
2. **Tarihsel yedeklerle karşılaştırma paha biçilmez:** 16 Nisan / 19 Nisan yedekleri normalize bug'ının tarihini tespit etmeyi sağladı
3. **"Çözüldü sanılan" bug'lar çok tehlikeli:** 17 Nisan'da normalize eklendi ama `ifsOku` güncellenmedi — kullanıcı "çözdüğümüzü zannetmiştim" dedi, gerçekten de tam çözülmüş gibi görünmüştü
4. **Defensive coding > perfect coding:** `pipelineAktar`'da `kalite==malzeme` kontrolü, kaynak veri düzelmese bile yeni insert'leri korur
5. **Kısmi çözüm = yanlış güven:** Kullanıcının "bütün yerleri görmeden deploy etmeyelim" uyarısı doğruydu — bu yüzden `pipeline_malzemeleri` kaynağı bulunamadığı için tam sistemik çözüm 19. oturuma bırakıldı

---

**Oturum uzunluğu:** Çok uzun (30+ iterasyon), ama her deploy/ekran görüntüsü ile ilerlendi. Sonda kullanıcı "kesim işini kapat + malzeme işini yeni oturuma bırak" kararı aldı — doğru karar.
