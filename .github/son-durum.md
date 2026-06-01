# Son Durum — 138. Oturum (1 Haziran 2026)

> Wizard inceleme akışında üç görünürlük/hijyen sorunu kapatıldı: (1) montaj/genel çizimler artık
> spool çetelesinde "🟠 Fazla" değil, ayrı "Montaj çizimleri" bölümünde; (2) aynı dosyanın mükerrer/
> bayat-cache kopyaları elenir (en bilgilendirici kayıt kazanır); (3) terfi edilmemiş taslak devreler
> Aktif Devreler listesinde gizli + wizard iptalinde soft-delete. 15 boş test-devresi temizlendi.
> Hepsi canlıda doğrulandı. Yeni endpoint yok (12/12), MK-49.1 korundu.

## Yapılanlar (sıra)

### 1. Montaj-dedup — api/devre-inceleme.js (fix 138/A)
- `izometrileriDerle`: aynı `dosya_adi` için birden çok kuyruk kaydı (tekrar yükleme/yeniden-parse)
  olabilir. En bilgilendirici kayıt seçilir (skor: montaj{} 3 > spoollar dolu 2 > işlendi 1 > boş 0).
  Boş kopyalar 🟠 Fazla üretmez.
- **Kök sebep:** bayat **cache** — aynı montaj PDF'i bir devrede `montaj{}` üretmiş, başka devrede
  `cache_hit` ile montajsız (`spoollar:[]`) gelmiş. Boş kopya spool dalına düşüp `dosya_adi_pipeline_yok`
  → Fazla yapıyordu. Dedup + 138/B birlikte çözdü.

### 2. Montaj çizimleri ayrı bölüm — lib/izo-eslesme.js + api/devre-inceleme.js + devre_wizard_v3.html (feat 138/B)
- **Tespit (deterministik, AI yok, MK-49.1):** `montajDosyaKok(dosya)!=null && dosyaAdiParse(dosya)==null`
  → S-segmentsiz `*.1.pdf` = montaj/genel çizim. `montaj{}` parse'ta olsa da olmasa da montaj sayılır
  (bayat-cache montajsız bile dosya adından tanınır).
- `izo-eslesme.js`: `montaj_belge=true` kayıtlar spool çetelesine ve Fazla'ya GİRMEZ; ayrı `montajlar[]`
  döner (`ozet.montaj`). Kabuğa eşleşen montaj spool'ları `bagli_spoollar`'da görünür.
- `devre_wizard_v3.html`: ayrı "Montaj / genel çizimler (N)" bölümü — nötr renkli, bağlı spool'lar veya
  "dosya adından tanındı (içerik okunamadı)" notu.
- **Doğrulama:** G400-817-015 devresinde "0 fazla", montaj satırları çeteleden çıktı. Birim test +
  orijinal self-test GEÇTİ (node --check + node lib/izo-eslesme.js).

### 3. Taslak gizle + iptal soft-delete — devreler.html + devre_wizard_v3.html (fix 138/A+B1)
- **A:** `applyFilters`'a `.neq('durum','taslak')` → terfi edilmemiş taslaklar Aktif Devreler'de görünmez
  (tek nokta: count/liste/id sorguları tutarlı).
- **B1:** `wizardIptal()` — İptal'de `WIZ.devre_id` varsa `devreler.silindi=true` (yalnız `durum='taslak'`;
  aktife dokunmaz). Mevcut `applyFilters` (neq silindi true) anında gizler. Hard-delete + storage temizliği
  YOK (yeni endpoint gerektirir, MK-129.3; toplu cleanup ileride).
- **Kök sebep:** `inceleBaslat()` "İncele →" anında taslak devre + dökümanları INSERT ediyor (devre_id
  storage/kuyruk için lazım). Onaylanmadan çıkılırsa yetim taslak kalıyordu.

### 4. Boş devre temizliği (DB)
- 15 boş devre (9 taslak + 6 aktif, hepsi çöp-isimli/yarım test) `silindi=true` (soft, geri alınabilir).
- 6 aktif-boş = Nisan-Mayıs eski v2 artıkları; yeni kodda `aktar()` boş kabukta `{ok:false,'sec'}` döner,
  devreyi aktif yapmaz → sistemik değil, tarihsel çöp. `bos_kalan=0` teyit edildi.

### 5. BRIEFING tazelendi (oturum açılışı)
- BRIEFING.md 70 döneminde kalmıştı (71-137 güncellenmemiş); 137 kapanışı için yeniden yazıldı,
  70 dönemi ajanda tasfiye edildi. oturum-saglik.sh açılış kapısı geçti.

## CI / commit (bugün)
- BRIEFING 137 kapanış [skip ci] · 138/A dedup · 138/B montaj (3 dosya) · 138/A+B1 taslak (2 dosya).
- Hepsi function 12/12, MK-49.1 korundu. Kod commit'leri CI tetikledi, Vercel Ready, canlı doğrulandı.

## Mühürlenecek MK (KARARLAR.md)
- MK-138.1: İnceleme `dosya_adi` bazında dedup eder — aynı dosyanın mükerrer/bayat-cache kopyalarından
  en bilgilendirici kayıt kazanır (montaj{}>spoollar dolu>işlendi>boş).
- MK-138.2: Montaj/genel çizim = `montajDosyaKok!=null && dosyaAdiParse==null` (deterministik, dosya adından,
  AI yok). Spool çetelesine girmez, ayrı `montajlar[]` bölümünde gösterilir; `montaj{}` parse'ta olmasa da
  dosya adından montaj sayılır.
- MK-138.3: Terfi edilmemiş taslak devreler Aktif Devreler'de gizli (`durum!='taslak'`); wizard iptalinde
  taslak soft-delete (`silindi=true`). Hard-delete/storage temizliği yeni endpoint gerektirdiğinden (MK-129.3)
  ertelendi — toplu cleanup ileride.

## 139'a Açık Borç (öncelik)
1. **B-çap sürprizi:** `ares-kabuk.js grupla()` spool BAŞLIĞINA `cap`/`et` yazmıyor (sadece bom kalemlerine).
   Modal `s.cap` okuyunca "—"; çap terfide `aktar()` → `boyutParse/olcuParse` ile doluyor → "canlıya geçince
   çap çıkıyor" sürprizi. Fix: `grupla()`'ya aynı `anaBoru→boyutParse` türetmesini koy → taslak=terfi.
2. **Problem 1 (bayat-cache):** aynı montaj PDF'i bazen montajsız cache'ten geliyor. 138/B dosya-adı tespiti
   maskeledi (montaj her hâlde doğru görünür); cache invalidation acil değil, ileri iş.
3. **6 aktif-boşun kökeni** kapatıldı (tarihsel v2 çöpü) — B2 guard'a gerek yok.
4. Taslak hard-delete + storage yetim temizliği (toplu cleanup) — düşük öncelik.
5. (Devam) 117 yukleyen_id · pipeline doğrulama (4.4-1) · fitting kütüphane · mobil React + eksik→Uyarılar.
