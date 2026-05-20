# AresPipe — Son Durum

> **101. oturum kapanışı — 19 Mayıs 2026** ⚙️
> Bu dosya her oturum başında ilk okunan kayıttır.

---

## CI Son Durum

- **Build:** ✅ YEŞİL
- **Vercel:** ✅ Production aktif, son commit Excel parser entegrasyonu
- **Migration sayısı:** 84 (83 parse_sonuc + 84 durum genişletme — 101'de eklendi)
- **Canlı endpoint:** `POST /api/kuyruk-isle-excel` — IFS xlsm → L1, %95, satır yapısal ✅

---

## 101. Oturum Özeti

**Ana tema:** Excel BOM parser pipeline'ı baştan sona kurma — wizard'a yüklenen `bom_excel` dosyalarını otomatik parse edip `parse_sonuc` JSONB'ye saklama. **INSERT yok**, 102 UI'da onay sonrası.

**Süre:** ~6 saat (plan 1.5-3 saat). Hedefler doğru ama 4 sürpriz yenildi (aşağıda).

### Yapılanlar (sırayla)

1. **`lib/excel-parser.js`** (ESM, 485 satır, SheetJS dışında bağımlılığı yok)
   - Sözlük: 14 alan, ~80 eş anlamlı terim TR+EN (devre_yeni.html `ifsOku` mantığından beslenip genelleştirildi)
   - Word-boundary substring match (en uzun eşleşme kazanır, çakışma çözümü)
   - L1 / L2 / fail seviyeleri
   - Özet satır filtresi: total/cog/sum/formül başlayan satırları atla (CADMATIC TOTAL sayfası vs)
   - Sayfa önceliği: 'All' → 'import' → en yüksek skor
   - CLI test harness (node lib/excel-parser.js <dosya>)
   - Otomatik insert sert kuralı: L1 + güven ≥ 70

2. **`api/kuyruk-isle-excel.js`** (229 satır)
   - POST endpoint, kuyruktan en eski `parser='excel-generic' AND durum='bekliyor'` işi al
   - Lock: durumu `'isleniyor'`'a çek, deneme_sayisi++
   - Supabase Storage'dan dosyayı indir (bucket: `devre-belgeleri`)
   - `parseExcel(buffer)` çalıştır
   - Sonuca göre durum: oneri_hazir / manuel_onay / hata
   - `parse_sonuc` JSONB doldur, bitis_at güncelle
   - DB INSERT YAPMAZ — 102 manuel onay UI'sında

3. **Migration 083** — `dosya_isleme_kuyrugu.parse_sonuc JSONB` kolonu (idempotent), partial index

4. **Migration 084** — `dosya_isleme_kuyrugu_durum_chk` 5→7 değer (+ `oneri_hazir`, `manuel_onay`)

5. **`vercel.json` güncellemesi** — `functions.includeFiles: 'lib/**'` (mevcut headers/crons/schema korundu)

### Canlı Test Sonuçları

**Test 1 (Donatım Kontrol Formu.xlsx, yanlış etiketli):**
- Sonuç: `durum=hata, seviye=fail, guven=0, satir=0`
- Yorum: Doğru davranış. Dosya kontrol checklist'i, BOM değil. Wizard auto-detect hatası (`bom_excel` etiketlenmiş, olmamalıydı).

**Test 2 (IFS Malzeme Listesi xlsm — gerçek IFS):**
- Sonuç: `durum=oneri_hazir, seviye=L1, guven=95, secilen_sayfa=All, satir=4`
- Yakalanan alanlar: `pipeline_no, spool_no, malzeme, parca_tipi, agirlik_kg, uzunluk_mm, dn, birim, system, ifs_kod, tanim, standart`
- ✅ Tüm temel alanlar yakalandı, hem boru (uzunluk_mm dolu) hem fitting (adet dolu) doğru ayırt edildi

### DB Değişiklikleri Canlıda

- `dosya_isleme_kuyrugu.parse_sonuc JSONB` eklendi (083)
- `dosya_isleme_kuyrugu_durum_chk` 7 değere genişletildi (084)
- Index `idx_dosya_isleme_kuyrugu_parser_durum` eklendi (partial, durum='bekliyor')

### 101'de Yenilen 4 Sürpriz (kalıcı dersler)

1. **`arespipe_kopyala` sonrası `git status` yokmuş.** Lokal'de dosya var, git'te yok. Vercel `ERR_MODULE_NOT_FOUND` ile patladı, sebep `lib/excel-parser.js`'in hiç commit'lenmemiş olmasıydı. **MK-101.1**
2. **`npm install xlsx` package.json'ı değiştirdi ama commit'lenmedi.** Hidden bağımlılık, Vercel build'inde xlsx çözülmezdi. **MK-101.2**
3. **`vercel.json` üzerine yazıldı, 30 satır kayboldu** (HTML cache headers, gece 3 cron). Önceki içeriği `git show HEAD:vercel.json` ile kontrol etmedim. **MK-101.3**
4. **Env değişkeni isim uyumsuzluğu**: kod `SUPABASE_SERVICE_ROLE_KEY` arıyordu, sistem standardı `SUPABASE_SERVICE_KEY`. Diğer endpoint'lerle uyumsuz. **MK-101.4**
5. **DB check constraint**: `oneri_hazir`/`manuel_onay` değerleri reject edildi. Migration 084 ile genişletildi. **MK-101.5**

---

## Açık Borçlar (102 gündemi)

### Acil (102 başlangıç)
- ⚪ **Manuel onay UI** — devre detayında "Bu dosyadan X satır parse edildi (güven %95). Görüntüle/Onayla" — onay sonrası `spooller` + `spool_malzemeleri` INSERT (mevcut `ifsOnayla` mantığını kullan)
- ⚪ **Wizard auto-detect düzeltmesi** — "IFS Malzeme Listesi" kelimesini gören dosyalar `bom_excel` etiketlensin (şu an `diger` etiketleniyor)
- ⚪ **Wizard kuyruk yazımı** — `bom_excel` tipli dosyalar için `parser='excel-generic'` (şu an hepsi `'sakla'`)

### Önemli (102+)
- ⚪ **İzometri wrapper** (`api/kuyruk-isle-izometri.js`) — 101'de ertelendi, 102'de Excel UI hazır olunca aynı patternle yapılır
- ⚪ **`devre_dokumanlari.parse_durumu` ile sync** — kuyruk durumu değiştiğinde doküman tablosundaki durumla da senkronize olmalı (`oneri_hazir`, `tamamlandi` vb.)
- ⚪ **Parse hata UI** — `durum=hata` durumunda kullanıcıya neden tanınmadığı söylenmeli (sayfa adları, sözlük eşleşmesi yok mesajları parse_sonuc.sayfalar'da var, sadece sunulmalı)
- ⚪ **Auth** — endpoint şu an public, pilot için OK ama production öncesi `CRON_SECRET` veya Bearer token eklenmeli

### Mimari Borçlar
- ⚪ **`parser='sakla'` mantığı** — şu an wizard her şeyi `sakla` yazıyor. `bom_excel` → `excel-generic`, `izometri` → `izometri-oku`, diğer → `sakla` mapping wizard kodunda yapılmalı
- ⚪ **`api/kuyruk-isle-excel.js` auth eklenmesi** — `CRON_SECRET` veya Vercel cron auth
- ⚪ **Cron tetik** — şu an manuel curl. 102'de UI'da "şimdi parse et" butonu, sonra cron schedule (örn 5 dk'da bir bekleyenleri tara)

### Roadmap (Mimari Sırası)
- **102**: Manuel onay UI + wizard auto-detect + INSERT akışı (Excel)
- **103**: İzometri wrapper + parsers/aveva-paor.js refactor
- **104**: Füzyon motoru — Excel BOM × İzometri PDF × STP çelişki tespiti
- **105**: STP tek-spool parser

---

## Aktif Süreç Disiplinleri

- **MK-48.6:** Supabase SQL Editor Unicode hassasiyeti
- **MK-49.1:** `izometri-oku.js`'e dokunma — minimum değişiklik
- **MK-50.1:** Hassas anahtar Claude'a verme
- **MK-50.3:** Yeni parser için 3+ başarılı örnek önce
- **MK-50.4:** Dotfile sonrası `ls -la` kontrol
- **MK-51.1:** Dosya kopyalamadan önce MD5 + satır sayısı doğrula
- **MK-52.1:** `arespipe_kopyala` MD5 doğrulamalı
- **MK-52.2:** `gp` otomatik rebase + push
- **MK-98.1:** Yeni feature flag/tablo eklerken DB keşif sorgusu zorunlu
- **MK-98.2:** Migration'larda `BEGIN...ROLLBACK` kuru çalıştırma
- **MK-99.1:** Migration policy'lerinde `DROP IF EXISTS + ADD` idempotent
- **MK-100.1:** İki kaynaklı UI deseni (eski + yeni paralel)
- **MK-100.2:** Python heredoc ile büyük JS patch yazma anti-pattern
- **MK-100.3:** Tree render state oturum-içi sakla
- **KARAR-100.A:** Wizard + İzometri Batch ortak kuyruk mimarisi
- **KARAR-101.A (yeni):** Parser endpoint INSERT YAPMAZ — sadece parse_sonuc'a yazar, UI onayında DB INSERT (B yaklaşımı)
- **MK-101.1 (yeni):** `arespipe_kopyala` sonrası **`git status` zorunlu** — sessiz kayıp önle
- **MK-101.2 (yeni):** `npm install` sonrası package.json+package-lock.json aynı commit'te
- **MK-101.3 (yeni):** `vercel.json` üzerine yazmadan önce `git show HEAD:vercel.json` ile mevcut içeriği gör
- **MK-101.4 (yeni):** Env değişken adı için `grep "SUPABASE_SERVICE" api/*.js` ile sistem standardını kontrol et
- **MK-101.5 (yeni):** Yeni durum/enum değerleri eklerken `pg_get_constraintdef` ile mevcut check constraint kontrolü

---

## Performans

- **Excel parse (lokal):** ~50-200 ms / dosya (sayfa sayısına bağlı)
- **Endpoint toplam (kuyruk → storage → parse → DB):** ~1-3 sn
- **Sözlük eşleşme:** O(satır × kolon × sözlük_uzunluk) — küçük dosyalarda ihmal edilebilir

---

## 101 Hazırlık Notu (102 için)

**102 ~3-4 saat öngörü.** Üç ana iş:

1. **Manuel onay UI** (~2 saat) — devre detayında parse_sonuc JSONB'sini okuyan modal, kullanıcı satırları seçer/düzeltir, "Aktar" butonu spooller + spool_malzemeleri INSERT (mevcut `ifsOnayla` mantığı bire bir)
2. **Wizard auto-detect düzeltmesi** (~30 dk) — "IFS Malzeme Listesi", "BOM", "Malzeme" kelimelerini içeren xlsm/xlsx → `bom_excel`. Wizard kodu `devre_wizard.html`.
3. **Wizard kuyruk parser mapping** (~30 dk) — `bom_excel` → `parser='excel-generic'` (şu an `'sakla'`)

Detay: `CLAUDE-SONRAKI-OTURUM.md`.

---

## 101'in Anlam Yükü

101 oturum **mimari değil disiplin oturumu**ydu. Kod kısmı temizdi, ama 4 sürpriz (git sessiz kayıpları, package.json drift, vercel.json overwrite, env name mismatch) çıktı. Hepsi kalıcı kayda geçti.

Asıl başarı: **endpoint canlıda parse ediyor, gerçek IFS dosyası %95 güvenle L1 başarısı verdi.** 102'de "manuel onay UI" yapınca pilot kullanıcılar gerçek Excel'leri wizard'a yükleyip otomatik spool oluşturmayı görecekler. Spool AI vizyonunun B1 maddesinin son temel taşı.

---

> 102. oturum açılışında bu dosya + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` okunur.
