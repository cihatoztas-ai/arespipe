# son-durum — 141 kapanış

HEAD: 9bef168 (flansh modal/MAP FK'dan) · CI: 35d94b1 [skip ci]

## Çalışır
- B plani: admin/kutuphane-backfill.html (tarayici backfill), suʼper-admin oturumuyla RLS cozuldu.
- 142 karbon flansh FK yazildi (DB sayim 143). M5 DN300 → EN-1092-1 + modal canli.
- spool_detay STANDART/modal/FLANSH_MAP tip yerine DOLU FK'ya bakar. spool_flansh_eslesme terk.
- Cekirdek browser-guard (window.MALZEME_ESLESME), CJS export korundu.

## Çalışmıyor / açık (142 ilk is)
- BUG-A: fitting kod uyumsuzlugu. Cekirdek 'elbow_90lr' vs kutuphane '45SW'/'90_3D' (karbon). 897 satir, 0 baglandi.
- BUG-B: DN125 karbon cap_mm=141.3, kutuphane 139.7, fark 1.6 > tol 0.6 → eslesmedi.
- Paslanmaz flansh kutuphanede yok (C plani).
- Sunucu eslestirme-backfill tip=malzeme dali olu/cokuyor (geri cekme karari 142).
- tip='fitting' ama flansh = ayri veri borcu (render maskeledi).

## DEĞME
- ares-normalize.js · ares-olcu.js (DN125 disinda calisiyor) · BORU_MAP (runtime boruEslestir).

## Kararlar: MK-141.1 (B plani/tarayici), .2 (admin sayfasi+browser-guard), .3 (spool_detay FK-oncelikli), .4 (iki bug teshisi).
