# son-durum — 140 kapanış

HEAD: 6fd32f7 (createRequire fix) · CI: 57fb404 [skip ci]

## Çalışır
- §13.7 teşhis mühürlü (matcher yok + kapsam dar) — kanıtlı.
- lib/malzeme-kutuphane-eslesme.js: mm-kanonik çekirdek, 4 format test yeşil.
- flansh_olculer EN-1092-1 karbon (EN-T01/05/11/12, PN10+16) DOLU. DN300 mevcut.

## Çalışmıyor / açık
- api/eslestirme-backfill.js tip=malzeme dalı: deploy'da HTTP 500 FUNCTION_INVOCATION_FAILED. Stack ALINAMADI. 141 ilk iş.
- DB'ye yazma OLMADI (kuru/çöküş). spool_malzemeleri geometri FK hâlâ ~boş (flansh_fk=1, fitting_fk=0).
- MK-139.1 görsel teyit (taslak çap) açık.

## DEĞME
- ares-normalize.js (çalışıyor, gerekmiyor).
- Kütüphane kapsam doldurma = arka plan, organik (programı durdurmaz).

## Kararlar: MK-140.1 (teşhis), .2 (097 iptal), .3 (mm-kanonik), .4 (tip=malzeme dalı, yeni endpoint yok).
