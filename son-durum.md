# Son Durum — 195. Oturum (20 Haziran 2026)

> 194 → 195. **Kütüphane seed** oturumu: A10.6 #1 (tee_red ASME) kapandı — 4 library satırı + 31 BOM bağı, canlı teyit geçti.

## Sonuç
**195 başarıyla kapatıldı. A10.6 #1 (tee_red) tamamlandı.** ASME B16.9 reducing tee 4 satır seed (paslanmaz DN150×100 + karbon DN200×150/DN100×65/DN80×50), `fitting_olculer` 956 → **960**. Backfill iki-çap kontrollü +31 BOM bağı. Sıfır regresyon, sıfır yanlış-bağ.

## Yapılanlar
1. **Talep sayımı (salt-okunur)** — BOM'da 99 gerçek tee (`\btee\b`, steel substring elendi). Yapısal reducing (boyut sol≠sağ, `" / "` split + 1-1/2 kesir-tuzağı fix): paslanmaz 10, karbon 21, cunife 1. tee_eq çapraz kontrolü 193 backfill'iyle (65) birebir tuttu.
2. **Seed** — `scripts/seed-data/195-tee-red-asme.json` (4 satır, ASME B16.9, `C=run / M=outlet` merkez-uç, `agirlik_kg=null` MK-96). Lint 4/4 geçti, idempotent upsert. `fitting_olculer` 956 → **960**. Commit `dd3541b`.
3. **Backfill** — `spool_malzemeleri.fitting_olculer_id`, `WHERE IS NULL` + iki-çap + grup eşleşmesi. **31 satır** bağlandı (10/10/10/1). DB'de canlı (repoda iz yok).
4. **Canlı teyit** — paslanmaz DN150×100 örnek (proje NB1124, spool A-001301/S01, `Tee Reducing 316L 6"/4"`) FK doğru library satırına işaret ediyor. ✅

## Değerlerin kaynağı
ASME B16.9 reducing outlet tee, iki bağımsız kaynak özdeş (piping-world + ferrobend). C = run merkez-uç, M = outlet merkez-uç (MK-195.1).

## Commit (195)
- `dd3541b` — veri: tee_red ASME seed JSON (4 satır) `[skip ci]`
- (bu kapanış) — doküman: handoff + BRIEFING + KARARLAR MK-195.1 `[skip ci]`
- (DB) — seed upsert (4) + backfill UPDATE (31) — repoya gitmez

## Açık borçlar (öncelik)
1. 🟡 **Cunife reducing tee matcher'da `tee_eq` görünüyor** — tanımda "reducing" yok (`lib/malzeme-kutuphane-eslesme.js:97` tanim-bazlı), 1 satır (DN300×200) runtime yanlış sınıflama.
2. 🟡 **Matcher tee lookup `cap_kucuk` süzmüyor** (`lib/malzeme-kutuphane-eslesme.js:98`) — latent; mevcut talepte her (grup,büyük-çap) tek küçük-çaplı olduğu için bağ doğru ama tasarım eksik.
3. 🔴 **Kalan A10.6:** paslanmaz reducer seed (#3); paslanmaz flanş seed (#4) + **`flansh_olculer` UNIQUE constraint DDL** (Supabase SQL editör işi — REST yetmez, `pg_constraint`/DDL erişimi yok).
4. ⚙️ `oturum-saglik.sh`'e ayna md5-eşitlik kontrolü (MK-194.1 backlog).
5. 📝 Kök `BRIEFING.md` hâlâ 187-dönemi spool-sayım içeriği taşıyor (A2-dilim2 vb.) — tam tazeleme borcu.
6. Olet değerlendirmesi · 2FA+pg_dump · MK-176.7 wizard review.

## Sonraki oturum notu
İlk iş: A10.6 #3 paslanmaz reducer seed (Sch 10S+80S, ASME B16.9 reducer_conc, çift-çap). Sonra #4 flanş seti — ama önce `flansh_olculer` UNIQUE constraint DDL'ini Supabase SQL editörden uygula (REST'ten yapılamaz).
