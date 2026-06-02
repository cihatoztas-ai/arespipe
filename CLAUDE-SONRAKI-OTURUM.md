# CLAUDE — 143. Oturum Girişi

## İLK İŞ: migration 097 yükleme (mekanik, kısa)
`migrations/097_fitting_fk_backfill_142.sql` repoya commit edilecek. DB'de **zaten çalıştı** (142'de COMMIT),
bu sadece tekrarlanabilirlik kaydı. İdempotent (WHERE fitting_olculer_id IS NULL). Tekrar çalıştırmaya gerek yok.
- Migration dosya adı disiplini: `NNN_description.sql`, tire yok. Son numara 096 → bu 097. ✅

## İKİNCİ: backfill dosyası kararı
`admin/kutuphane-backfill.html` 142'de BIRAKILDI (tek-SQL kazandı, "her run farklı" kaosu yüzünden).
- Statik dosya (serverless fn değil) → 12/12 limitini etkilemez, silmek zorunlu değil.
- Karar: SİL (ölü kod, MK-126.8) mi, yoksa "acil toplu bağlama aracı" olarak DURSUN mu?
- Eğer durursa: PostgREST limit sıralaması sorunu not düşülmeli (yanıltıcı), ya da deterministik sıralama (`.order('id')` + sayfalama) eklenmeli.

## C PLANI — kütüphane kapsamı (organik, Cihat'ın felsefesi)
"Excel'i sömür → kütüphaneyi parça parça doldur." Bağlanmayanların hepsi kütüphane eksiği, bug değil:
- **karbon tee_red:** 21 tee bağsız (kütüphanede karbon reducing-tee YOK, sadece tee_eq var)
- **reducer eksik varyantlar:** 38 satır (en büyük: 114.3/76.1 ×20, 139.7/114.3 ×7, 168.3/139.7 ×4, 219.1/139.7 ×3)
- **paslanmaz fitting:** 32 (elbow 23 + reducer 6 + tee 3) — paslanmaz fitting kütüphanede hiç yok
- **SR elbow:** 4 (karbon SR kütüphanede yok)
- **flanş:** 86 organik varyant
→ Süper-admin ihtiyaç oldukça yükler. Yüklenince backfill (097 SQL re-run) otomatik bağlar — idempotent.

## ARA-AÇI DİRSEK TÜRETME (3D oturumuna bağlı, MK-49.A)
Cihat: "27° dirsek malzeme listesinde 27° yazsın ama 90'dan türetilsin." Teknik: aynı çap/et/standart, sadece
ucu-uca uzunluk + ağırlık + açı değişir. AMA 3D'de açı kritik → 90LR'a düz bağlamak yanlış geometri.
- 142'de guard kondu: açı 45/90 dışı → NULL (şimdilik). Veride 0 ara-açı var (acil değil).
- Tasarım (3D oturumu): 90LR'dan ölçü türet + `aci` alanını koru + 3D render açıyı okusun. Override mimarisi (yeni satır mı / spool override mı) o zaman kararlaştırılır.

## SONRA (devreden, düşük öncelik)
- **tip='fitting' ama flanş (141'den):** render FK-öncelikli maskeliyor, kalem tip alanı yanlış. Rapor/filtre/sayım etkilenebilir. Kök düzeltme ayrı.
- **BUG-B DN125 (park):** ares-olcu DN125→141.3 (ASME boru OD), flanş kütüphane EN→139.7. İkisi de kendi bağlamında doğru → bağlam uyumsuzluğu. Çözüm yeri tartışmalı (ares-olcu mu, flanş tolerans mı), riskli — dokunmadan önce tasarla.
- **MK-139.1 görsel teyit (taslak çap):** hâlâ açık.
- **Sunucu eslestirme-backfill tip=malzeme dalı:** ölü/çöküyor (serverless'ta ares-asme/ares-olcu patlıyor). Geri çekilsin mi (endpoint izometri'ye dönsün) karar.

## ARAÇ / DURUM
- Karbon fitting: **102 bağlı** (elbow 69/76, reducer 33/71). Flanş 204/290. Tee 0 (kütüphanede yok).
- Çekirdek `lib/malzeme-kutuphane-eslesme.js` (107 satır): malzeme grubuna göre dil + reducer çift-çap + ara-açı guard. window/module/globalThis üçlü export.
- Deterministik backfill = `migrations/097` SQL (tarayıcı backfill değil).

## Hatırlatma (142 dersi)
- Kullanıcı gözlemini ("eskiden tanınıyordu") "yanlış" diye geçme — çapraz sorgu ile uzlaştır (flanş gerçekti, fitting hiç bağlanmamıştı, ikisi de doğru).
- Silmeden önce TÜM ayırt edici kolonları karşılaştır — "duplicate" sandığım reducer'lar farklı küçük çaptı (MK-98.2).
- Test girdisi GERÇEK veriden olmalı — uydurma 'boyut:1.5D' beni yanılttı.
- Araç fazla karmaşıksa (Cihat "anlamadım" dedi) sadeleştir — tek SQL > tarayıcı döngü.
