# CLAUDE — 142. Oturum Girişi

## İLK İŞ: BUG-A fitting kod uyumsuzlugu (kazi ONCE, tahmin YOK)
897 fitting_olculer satiri var, 0 baglandi. Cekirdek (lib/malzeme-kutuphane-eslesme.js) fitting icin:
  elbow → 'elbow_'+aci+lr  (orn elbow_90lr, elbow_45sr)
  reducer → 'reducer_'+ecc (reducer_conc/reducer_ecc)
  tee → 'tee_reducing'
Kutuphane fitting_olculer.parca_tipi GERCEK profili (141 kanit):
  reducer_conc|cunife:79, reducer_ecc|cunife:79, elbow_90lr|cunife:23, elbow_45lr|cunife:23,
  elbow_90sr|cunife:21, elbow_45sr|cunife:20, tee_eq|cunife:19, tee_red|cunife:30,
  45SW|karbon:5, 90_3D|karbon:1
→ cunife kodlari cekirdekle UYUMLU (elbow_90lr vb). Ama KARBON/PASLANMAZ fitting farkli kod (45SW, 90_3D).
→ tee: cekirdek 'tee_reducing' uretiyor, kutuphane 'tee_eq'/'tee_red' → UYUSMUYOR.

### Kazi adimlari (142)
1. Kutuphane parca_tipi TUM distinct degerleri + malzeme_grubu dagilimi (SELECT distinct).
2. Spool fitting tanimlari → cekirdek ne uretiyor, hangi parca_tipi bekleniyor.
3. Karar: kanonik kod hangisi? Cekirdek mi kutuphaneye uyacak, kutuphane mi normalize edilecek?
   - cunife zaten elbow_90lr → cekirdek dogru. Karbon 45SW/90_3D → kutuphane tutarsiz olabilir.
   - tee: cekirdek 'tee_reducing' yanlis olabilir (kutuphane tee_eq/tee_red ayirimi yapiyor — equal vs reducing).
4. Hizala, backfill tekrar kostur (idempotent).

## İKİNCİ: BUG-B DN125 tolerans
Cekirdek DN125 karbon → cap_mm=141.3. Kutuphane EN-T01 PN16'da 139.7 (DN125 gercek OD).
Fark 1.6 > tolerans ±0.6 → eslesmedi.
- ares-olcu.olcuParse('DN125') ciktisini kontrol et: 141.3 mu donuyor? EN OD=139.7. ares-olcu'da DN125 mapping hatasi olabilir.
- Cozum: ares-olcu DN→OD tablosunda DN125 duzelt (139.7), VEYA flansh tolerans gozden gecir (riskli).

## SONRA
- Backfill re-run (iki bug sonrasi) → kalan karbon flansh + fitting baglanir.
- Sunucu eslestirme-backfill tip=malzeme dali: geri cek (endpoint izometri'ye donsun) mi karar.
- tip='fitting' ama flansh: ayri veri borcu (render maskeledi, kok duzeltilmedi).
- C plani: paslanmaz EN-1092-1 flansh, DN400+ slip-on, fitting karbon/paslanmaz veri. Organik.
- MK-139.1 gorsel teyit (taslak cap).

## ARAÇ
- admin/kutuphane-backfill.html canli, suʼper-admin oturumuyla acilir. Kuru→canli toggle. Idempotent.
- Cekirdek window.MALZEME_ESLESME (browser) + module.exports (server CJS), tek kaynak.

## Hatırlatma (141 dersi)
- Kullanici sezgisini ("taninan cok malzeme vardi") OLCMEDEN "kapsam eksigi" deyip gecme. Olcunce iki bug cikti.
- spool_detay modal/MAP FK'dan (spool_flansh_eslesme terk). BORU_MAP'e dokunma (runtime boruEslestir).
