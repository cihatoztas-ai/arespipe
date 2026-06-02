# Son Durum — 142. Oturum (2 Haziran 2026)

> **Fitting bağlama bitti: 0 → 102 karbon fitting.** BUG-A (fitting kod uyumsuzluğu) ve
> reducer çift-çap çözüldü; backfill'in "her run farklı sonuç" kaosu deterministik tek-SQL
> ile bitirildi (Yol A). BUG-B (DN125) kök ares-olcu/flanş bağlam farkı → park. Yeni endpoint yok (12/12).

## Yapılanlar (sıra)

### 1. TEŞHİS — fitting HİÇ bağlanmamıştı (MK-142.1)
- Oturum başı çapraz sorgu: karbon fitting_fk **0/168**, flanş 142, boru 67.
- Cihat "eskiden tanınıyordu" dedi → git + DB kanıtı: gördüğü **flanş + boru** idi (runtime boruEslestir + 141 flanş backfill). Fitting bağı **hiç kurulmamış**, regresyon değil.
- `7e86e72` (141) flanşı düzeltmişti, fitting'i bozmamıştı. **Silinen dosya / kayıp veri YOK** (silinenler bilinçli temizlik: 024/006/36-oturum eski migration adları, duplicate doc'lar).

### 2. BUG-A — çekirdek dil uyumsuzluğu (fix 142, MK-142.2)
- `lib/malzeme-kutuphane-eslesme.js` her zaman semantik (`elbow_90lr`) + ölü `tee_reducing` üretiyordu.
- Kütüphane İKİ dil: cunife/DIN semantik (`elbow_90lr`), karbon/ASME native (`90LR`/`45LR`, `tee_eq`/`tee_red`).
- **Fix:** `_elbowParcaTipi(mg,aci,lrsr)` — karbon→`90LR`, cunife→`elbow_90lr`. Tee: tanımdan Eq/Red ayrımı. 1D→SR (karbon SR kütüphanede yok → temiz NULL). → commit `b6d423a`.

### 3. Ara-açı 3D guard (MK-142.3)
- Elbow tanımda açı 45/90 dışı (27°/22.5° cut-elbow) → NULL. 90LR'a bağlamak ölçüde zararsız ama 3D'de yanlış geometri (Cihat gerekçesi). Veride 0 ara-açı (76/76 'aci_yok'→90). Türetme → 3D oturumuna borç.

### 4. Reducer çift-çap (BUG değil, eksik eşleşme; MK-142.4)
- Reducer `boyut='219.1x6.3 / 114.3x4.5'` çift çaplı. Kütüphanede aynı büyük çapta çok meşru küçük-çap varyantı (**DUPLICATE DEĞİL** — Cihat sezgisi doğru, silmek felaket olurdu). Backfill tek-çapla arayıp `hit.length>1`→atlıyordu.
- **Fix:** çekirdek `cap_kucuk_mm` üretir; backfill lookup küçük çapla daraltır (cache anahtarı + ikinci tolerans). → commit `b26831e`.

### 5. Backfill "her run farklı" → tek SQL (Yol A, MK-142.5)
- `admin/kutuphane-backfill.html` PostgREST `.limit()` sıralama garantisi olmadığından her çalıştırışta farklı satır yakalıyordu (kullanıcıyı yordu).
- Karar: tarayıcı backfill **BIRAKILDI** (silinmedi, kullanılmıyor). Çekirdek mantığı tek deterministik SQL UPDATE'e portlandı → `migrations/097_fitting_fk_backfill_142.sql`. `BEGIN...ROLLBACK` ile 102 doğrulandı, sonra COMMIT.

## Canlı doğrulama
- spool_detay A-000932 (reducer 323.9/273.0) → STANDART ASME B16.9, modal açılıyor ✅
- Bağlanmayan satırlar "Kütüphanede yok — eklemek için tıkla" tooltip'i ile dürüst işaret ✅

## NEREDEYIZ (karbon, 142 canlı)
| Sınıf | Toplam | Bağlı | Bağlanmayan sebebi |
|---|---|---|---|
| Elbow | 76 | 69 | 4 SR + 3 çap kütüphanede yok |
| Reducer | 71 | 33 | 38 varyant yok (114.3/76.1 ×20) |
| Flanş | 290 | 204 | 86 organik |
| Tee | 21 | 0 | karbon tee_red yok |
| Paslanmaz fitting | 32 | 0 | paslanmaz fitting yok |

## CI / commit (bugün)
- `b6d423a` çekirdek fitting kod hizalama (CI yeşil, Vercel Ready)
- `b26831e` reducer çift-çap (CI yeşil, Vercel Ready)
- **Bu kapanışta gidecek (doc/migration [skip ci]):** `migrations/097` + `BRIEFING.md` + bu üç kapanış dosyası.
- DB: migration 097 **zaten çalıştırıldı** (COMMIT); dosya tekrarlanabilirlik için.

## Mühürlenecek MK (KARARLAR.md)
- **MK-142.2:** Fitting kod, malzeme grubuna göre dil — cunife/DIN semantik, karbon/ASME native. Çekirdek çevirir, kütüphane veri olarak kalır (silinmez).
- **MK-142.4:** Reducer çift çap — büyük + küçük çap birlikte aranır (aynı büyük çapta çok meşru varyant). Tek çap eşleşme = belirsizlik.
- **MK-142.5:** Toplu veri backfill'i deterministik olmalı. PostgREST `.limit()` sıralama garantisi yok → tarayıcı-döngü yerine tek SQL UPDATE (BEGIN...ROLLBACK doğrula → COMMIT).

## 143'e Açık Borç (öncelik)
1. **Migration 097 yükleme (ilk iş):** `migrations/097_fitting_fk_backfill_142.sql` repoya commit (DB'de çalıştı, dosya kaydı).
2. **Backfill dosyası kaderi:** `admin/kutuphane-backfill.html` kullanılmıyor — sil mi (ölü kod) yoksa "acil toplu bağlama aracı" olarak dursun mu? KARAR.
3. **C planı (kütüphane kapsamı, organik):** karbon tee_red, reducer eksik varyantlar (114.3/76.1 ×20), paslanmaz fitting, SR elbow, DN400+ flanş. Süper-admin ihtiyaç oldukça yükler.
4. **Ara-açı dirsek türetme:** 27°/22.5° → 90LR'dan ölçü türet + açı koru + 3D'ye `aci`. MK-49.A (3D) oturumunda.
5. **tip='fitting' ama flanş (141'den):** render FK-öncelikli maskeliyor, tip alanı yanlış (rapor/filtre). Kök düzeltme ayrı.
6. **BUG-B DN125 (park):** ares-olcu DN125→141.3 (boru OD), flanş EN→139.7. İkisi de kendi bağlamında doğru → bağlam uyumsuzluğu, çözüm yeri tartışmalı.
7. **MK-139.1 görsel teyit (taslak çap):** hâlâ açık.

## Hatalarım (kayıt)
- "Fitting hiç çalışmadı" dedim fazla kesin; Cihat'ın gördüğü flanş+boru gerçekti. Çapraz sorgu ile uzlaştı (flanş çalışıyor, fitting hiç bağlanmamış — ikisi de doğru, farklı sınıf).
- Reducer "duplicate" sandım → silmeye gidecektim. Cihat "başka standart olmasın" dedi, ölçünce farklı küçük çaplar çıktı (silmek felaket olurdu). Ders: silmeden önce ayırt edici tüm kolonları karşılaştır.
- Backfill'i 5-6 kez koşturma yolu (B) yerine Cihat "mantığını anlamadım" deyince tek-SQL (A)'ya geçtik — doğru karar, deterministik.
