# CLAUDE — 142. Oturum Özeti

**Tek cümle:** Fitting hiç bağlanmamış çıktı (0/168); BUG-A (çekirdek dil uyumsuzluğu) + reducer çift-çap düzeltildi, backfill'in "her run farklı" kaosu deterministik tek-SQL UPDATE ile bitirildi → karbon fitting 0 → 102 bağlandı.

## Akış
- Açılış: BRIEFING 141, ilk iş BUG-A fitting kod kazısı (tahmin yok).
- Kazı: kütüphane `parca_tipi` iki dil — cunife/DIN semantik (`elbow_90lr`), karbon/ASME native (`90LR`, `tee_eq/tee_red`). Çekirdek hep semantik + ölü `tee_reducing` üretiyordu.
- Cihat "eskiden fitting tanınıyordu, wizard bozdu" → git+DB kanıtı: fitting_fk **hiç dolmamış**; gördüğü flanş+boru. `7e86e72` flanşı düzeltmişti, fitting'i bozmamış. Silinen dosya yok.
- Çekirdek fix: malzeme grubuna göre elbow dili + tee Eq/Red + ara-açı 3D guard. Gerçek-veri node testi 11/11.
- Canlı backfill: 89 bağlandı ama reducer 0. Reducer çekirdekten doğru anahtar üretiyordu → kütüphanede aynı büyük çapta çok varyant (çift çap eksiği).
- Cihat "başka standart olmasın, silelim mi" → ölçüm: 219.1 reducer'ın 4 kaydı farklı KÜÇÜK çap (duplicate değil). Silme iptal, çekirdek+backfill çift-çap düzeltildi.
- Backfill her run farklı sonuç (PostgREST limit sıralaması) → Cihat "mantığını anlamadım" → Yol A: tek deterministik SQL UPDATE. BEGIN...ROLLBACK → 102 → COMMIT.

## Kararlar
- MK-142.1: Fitting hiç bağlanmamış (teşhis). Kullanıcının gördüğü flanş+boru; çapraz sorgu uzlaştırdı.
- MK-142.2: Çekirdek fitting kodu malzeme grubuna göre çevirir (cunife semantik / karbon ASME native). Kütüphane veri olarak korunur (silinmez).
- MK-142.3: Ara-açı elbow (45/90 dışı) → NULL (3D geometri koruması). Türetme 3D oturumuna.
- MK-142.4: Reducer çift çap — büyük+küçük birlikte aranır. Aynı büyük çapta çok meşru varyant = duplicate değil.
- MK-142.5: Toplu backfill deterministik olmalı; tarayıcı-döngü yerine tek SQL UPDATE (097).

## Hatalarım (kayıt)
- "Fitting hiç çalışmadı" fazla kesindi — Cihat'ın gözlemi (flanş+boru) gerçekti. Çapraz sorgu ikisini uzlaştırdı. Ders: kullanıcı gözlemini "yanlış" diye geçme, ölç.
- Reducer'ı "86 duplicate" sandım, silmeye gidecektim. Cihat "başka standart olmasın" itirazı doğruydu — farklı küçük çaplardı. Ders: silmeden önce TÜM ayırt edici kolonları (cap_kucuk dahil) karşılaştır (MK-98.2 ruhu).
- "Elbow 1.5D → cap 1.5mm bug var" dedim — kendi test girdimle (boyut:'1.5D') kendimi yanılttım; gerçek veride boyut='168.3x4.5', bug yoktu. Ders: test girdisi gerçek veriden olmalı.
- Backfill'i çoğaltıp koşturma (B) yerine tek-SQL (A) — Cihat'ın "anlamadım" tepkisi doğru sinyaldi, araç fazla karmaşıktı.
