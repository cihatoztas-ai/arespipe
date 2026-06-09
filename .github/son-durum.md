# son-durum.md — 173. Oturum (2026-06-09)

## TEMA
A/B/C teknik borc temizligi + IS1 (Islenenler tek isleme butonu). Hepsi canli + CI yesil.

## DURUM
- HEAD: 343af6c (origin/main ile senkron). Onceki kapanis: f7104b5.
- Degisen dosyalar: api/kuyruk-isle-izometri.js · ares-izometri-drenaj.js · devreler.html · devre_wizard_v3.html
- 12/12 fonksiyon (yeni endpoint YOK). Migration YOK. izometri-oku DOKUNULMADI. Gece cron AYRI/etkilenmedi.
- CI: kod commit'leri [skip ci] YOK ile gitti (kostu, yesil). Kapanis doc'lari [skip ci] ILE.

## YAPILANLAR (hepsi canli)
1. A — claim-first (MK-173.1, f3b0765): parse ONCESI atomik claim; baskasi kapmissa parse atlanir -> bos L3 odemesi
   biter (409/508 israfi). Server: claim_only modu + zaten_claim guard gevsetme + birIsIsle re-claim atlama.
   Client: claim postu -> claimed:false ise parse YOK; ozet.atlandi sayaci. Gece cron normal yolda, etkilenmez.
2. B — buyuk .in() dilimle (MK-173.2, b8c5819, MK-172.5 sinifi): hataYenidenDene UPDATE + hataBandiYukle SELECT
   150'lik dilimlere bolundu (cok belgeli devrede 400 biter).
3. C — devreler olu kod (MK-173.3, 826a2b5): sira* JS + .sira-input/.takvim-popup CSS silindi (172 emeklileri).
   Native termin picker dokunulmadi. 2760->2739 satir.
4. IS1 — tek isleme butonu (MK-173.4, f1c39ca + 343af6c): #btnIslDrenaj bosta mavi / islerken beyaz+yanip sonen
   nokta; nav pili sureki blink kaldirildi (sade nav); atlandi toast (global + per-satir).

## OPERASYONEL DERSLER (173)
- "Server claim'i var ama PARSE'tan sonra" = bos L3'un kok nedeni. Atomik lock dogru yerde degilse ise yaramiyor;
  sira (claim-once-parse) onemli. izometri-oku'ya dokunmadan, mevcut endpoint'e parametre ile cozuldu.
- Buyuk .in() bir fonksiyonda duzeltilince KOMSU ayni-ids SELECT'i de patlar — akisin tamamina bak (retry butonu
  bandi 400 yerse buton hic gorunmez). Tek satir genisletme akisi kurtardi.
- Olu kod silmeden ONCE her sembolu grep'le "tanim var, cagri yok" kanitla; _siraCache atanip okunmuyordu, silinen
  getSiraMap'i cagiran satir AYNI patch'te kaldirildi (yoksa ReferenceError).
- Tek-buton: blink sinyali TEK yerde olmali (aksiyon butonu). Nav pilinin sureki blink'i gurultuydu, kaldirildi.

## ACIK (173 sonu)
- IS2 terfi animasyonu (AYRI OTURUM, buyuk). W-2.5 iki cubuk (gorsel karar, ekranda goster). Spool-seviyesi hata
  rozeti (kendi oturumu). Opsiyonel nav capraz-sinyal (konmadi). Eski: kuyruk takili · W-2.9 · Y200.
- KARARLAR: MK-173.1..4 docs/KARARLAR.md koke islendi (172 zaten kokteydi). Kokte MK-169/170/171 eksik (eski borc).

## TEST DEVRELERI — SILME
Hepsi test. 173: cgghmcmhgvm120, cghfdkv, hthth, thjjy, kfyukfyl, kgcdkgc, uogyol. 172: NB1099C, NB1124, M120-Galv.
170: NB1099C. 171: M110-St.St, E120-St.St. SILME.
