# AresPipe BRIEFING — 142. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.

## HEAD
`b26831e` fix(142): reducer cift-cap eslesme - kucuk capla daralt (cap_kucuk_mm)
- `b6d423a` fix(142): fitting kod hizalama - karbon ASME dili (90LR), tee Eq/Red ayrimi, ara-aci guard (3D)
- (rebase: uzaktaki `327c65d` CI commit'i üstüne alındı, çakışma yok)
- **DB:** migration `097_fitting_fk_backfill_142.sql` çalıştırıldı (COMMIT) — yüklenecek dosya

## 142 — yapılanlar (ANA İŞ: fitting bağlama, 0 → 102)
1. **MK-142.1 — TEŞHIS: fitting HİÇ bağlanmamıştı.** Oturum başında çapraz sorgu: karbon fitting_fk=0/168, flanş 142, boru 67. Cihat "eskiden tanınıyordu" dedi → git+DB kanıtı: gördüğü **flanş+boru** idi; fitting bağı hiç kurulmamıştı. Regresyon değil, eksik. `7e86e72` (141) flanşı düzeltmişti, fitting'i bozmamıştı. Silinen dosya/kayıp veri YOK.
2. **MK-142.2 — Çekirdek BUG-A: dil uyumsuzluğu.** `lib/malzeme-kutuphane-eslesme.js` her zaman semantik (`elbow_90lr`) + ölü `tee_reducing` üretiyordu. Kütüphane iki dil: cunife/DIN semantik, karbon/ASME native (`90LR`, `tee_eq`/`tee_red`). Düzeltme: malzeme grubuna göre elbow dili (`_elbowParcaTipi`), tee Eq/Red ayrımı, 1D→SR. → commit `b6d423a`.
3. **MK-142.3 — Ara-açı 3D guard.** Elbow tanımda açı 45/90 dışındaysa (27°/22.5° "cut elbow") → NULL (standart fitting değil). 90LR'a bağlamak ölçüde zararsız ama 3D'de yanlış geometri (Cihat'ın gerekçesi). Veride şu an 0 ara-açı (76/76 'aci_yok'→90 varsayım). Türetme (90LR'dan + açı koru) → 3D oturumuna borç.
4. **MK-142.4 — Reducer çift-çap (BUG değil, eksik eşleşme).** Reducer `boyut='219.1x6.3 / 114.3x4.5'` çift çaplı. Kütüphanede aynı büyük çapta birden çok meşru küçük-çap varyantı (DUPLICATE DEĞİL — silmek felaket olurdu, Cihat sezgisi doğru). Backfill tek-çapla arayıp `hit.length>1`→atlıyordu. Düzeltme: çekirdek `cap_kucuk_mm` üretir, lookup küçük çapla daraltır. → commit `b26831e`.
5. **MK-142.5 — Backfill "her run farklı" → tek SQL (Yol A).** `admin/kutuphane-backfill.html` PostgREST `.limit()` sıralama garantisi olmadığından her çalıştırışta farklı satır yakalıyordu (kafa karıştırıcı). Karar: tarayıcı backfill BIRAKILDI (silinmedi, kullanılmıyor), çekirdek mantığı tek deterministik SQL UPDATE'e portlandı → `migrations/097`. `BEGIN...ROLLBACK` ile önce 102 doğrulandı, sonra COMMIT.

## §13.7 DURUM
Bağlama katmanı **fitting tarafında da KAPANDI.** Karbon fitting 0 → 102 (elbow 69/76, reducer 33/71, flanş 204/290). Tek-kayıt + çift-çap + tolerans → sıfır yanlış eşleşme. Kalan bağlanmayanlar **kütüphane kapsamı** (C planı), bug değil.

## NEREDEYIZ (sınıf bazında, 142 canlı)
| Sınıf | Toplam (karbon) | Bağlı | Bağlanmayan sebebi |
|---|---|---|---|
| Elbow | 76 | 69 | 4 SR + 3 çap kütüphanede yok |
| Reducer | 71 | 33 | 38 varyant kütüphanede yok (114.3/76.1 ×20 dahil) |
| Flanş | 290 | 204 | 86 organik flanş varyantı |
| Tee | 21 | 0 | karbon tee_red kütüphanede YOK |
| Paslanmaz fitting | 32 | 0 | paslanmaz fitting kütüphanede YOK |

## AÇIK BORÇ (143 için, öncelik sırası)
- **Migration 097 yükleme:** `migrations/097_fitting_fk_backfill_142.sql` repoya eklenip commit edilecek (zaten DB'de çalıştı; dosya tekrarlanabilirlik için).
- **Backfill dosyası kaderi:** `admin/kutuphane-backfill.html` artık kullanılmıyor (tek-SQL kazandı). Sil mi (12-fn limiti değil, statik dosya — risk yok ama ölü kod) yoksa "acil toplu bağlama" aracı olarak dursun mu — KARAR 143.
- **C planı (kütüphane kapsamı, organik):** karbon `tee_red`, reducer eksik varyantlar (özellikle 114.3/76.1 ×20), paslanmaz fitting, SR elbow, DN400+ flanş. Süper-admin ihtiyaç oldukça yükler ("Excel'i sömür → kütüphaneyi parça parça doldur").
- **Ara-açı dirsek türetme (3D bağlantılı):** 27°/22.5° elbow → 90LR'dan ölçü türet + açıyı koru + 3D'ye `aci` ver. Şu an veride 0, MK-49.A (3D motoru) oturumunda tasarlanacak.
- **tip='fitting' ama flanş = AYRI VERI BORCU (141'den devam):** render FK-öncelikli maskeliyor ama tip alanı yanlış (rapor/filtre/sayım). Kök düzeltme ayrı.
- **MK-139.1 görsel teyit (taslak çap):** hâlâ açık.

## PLAN
| Adım | Durum |
|---|---|
| Çekirdek fitting kod hizalama (90LR, tee, guard) | ✅ commit b6d423a |
| Reducer çift-çap eşleşme | ✅ commit b26831e |
| Backfill → tek deterministik SQL (097) | ✅ 102 bağlandı, canlı |
| Migration 097 dosyalama | ⚠ 143 ilk iş (repoya commit) |
| C planı kütüphane doldurma | arka plan, organik |
| Ara-açı türetme | 3D oturumuna borç |

## NEREDEYIZ — ÖZET
Fitting bağlama bitti, 0→102 karbon fitting canlıda bağlı, doğrulandı (spool_detay A-000932 reducer STANDART=ASME B16.9). "Her run farklı" backfill kaosu deterministik SQL ile çözüldü. Sıra: 097 dosyalama + kütüphane kapsamını organik genişletme. Sistem "çalışır" — tanınan her fitting bağlanıyor, tanınmayan "kütüphanede yok" diye dürüstçe işaretleniyor.
