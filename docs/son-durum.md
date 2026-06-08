# son-durum.md — 166. Oturum (2026-06-08)

## TEMA
DÜZEN TURU: wizard/devre_detay sayfa düzeni tutarlılaştırma + "okundu ama yüzeye çıkmadı"
hissini bitirme. Format öğretimi bu oturum ATLANDI (Cihat kararı).

## DURUM
- HEAD bookend: `d5b8c9e` (wizard düzen paketi) → `595c435` (okunan değer A/B/C).
- 12/12 fonksiyon (yeni endpoint yok). Migration YOK. izometri-oku DOKUNULMADI.
- TARAYICIDA yüklü (deploy sonrası sert yenile — MK-161.1): ares-kabuk.js, ares-normalize.js.

## YAPILANLAR (7 ana + A/B/C)
1. **W-2.1 KAPANDI** — tersane/proje çift yönlü senkron (karışık etiket bitti).
2. **MK-165.7/2 KAPANDI** — taslak (?taslak=1) = salt kontrol penceresi; kilitli aksiyon butonları
   gizli, tek aksiyon "✏️ Wizard'da düzenle & onayla"; Adım 2'ye "👁 Önizle" ters köprüsü. 3 dil anahtarı.
3. **K2-A** — terfide temiz izometri önerileri otomatik tamamlandi (atanmamış+manuel açık; backfill
   hatalıysa dokunma); Onay Kuyruğu sekmesi aktifte rozet=0 ise gizli.
4. **Adım 1 yedek alanları** (malzeme/yüzey/alıştırma — doküman öncelikli; aktar opsiyonel param;
   0 regresyon) + **← Geri** butonu.
5. **devreler +N rozeti** — spool adedi değil TÜR sayısı (adet tooltip'e).
6. **YÜKLE AKIŞI** — tek "⬆ Yükle" + paralel havuz (6) + karar ekranı (Yeni Devre/İncele&Onayla/
   İşlenenler). izometri SIRADA, burada işlenmez (MK-166.1). Küçük devrede uyarısız.
7. **W-2.19 kalem-zoom** (✏️ → değer pdf.js metin katmanında ara → zoom+vurgu; satır gruplama
   MK-166.2; çoklu eşleşme gezinme) + **Excel hücre-git** (sayfa-geçişli, simetrik).
- **A/B/C okunan-değer yüzeye:** A çap/et izometri ham'dan (MK-166.3) · B kalite kalemden
  (anaKalite→316L terfide) · C yüzey paslanmaz→asit (MK-166.4).

## DEĞİŞEN DOSYALAR
devre_wizard_v3.html · devreler.html · devre_detay.html · ares-kabuk.js · ares-normalize.js ·
lib/izo-eslesme.js · api/devre-inceleme.js · lang/{tr,en,ar}.json.

## AÇIK (167)
- **CRON / sayfa-kapalı izometri (167 ana tasarım — MK-166.1):** kuyruk-isle.js'e dosya_isleme_kuyrugu
  izometri dalı + atomik claim guard + frekans (Hobby gece / Pro dakika / dış zamanlayıcı). Yeni endpoint
  yok (12/12 koru). Pro şart değil (self-chain Hobby'de yürür). Araştırıldı/karar verildi → 167'de uygula.
- MK-165.7/1 OPR dn→dis_cap (DN200→200.0, doğrusu 219.1) · MK-165.7/3 uyarı mükerrerliği.
- Onay kuşağı eritme (162 kayıt; P26-217=76) · Y200 öğretimi (diğer bilgisayar).
- W-2.5 (iki çubuk değil) · W-2.9 (eşzamanlı paralel devre değil).
- KARARLAR.md'ye MK-166.1..6 işlenecek (bu pakette değil — kök dosya).
- Canlı teyit borcu: deploy+sert yenile → G200 inceleme (çap/et dolu, kalite 316L, yüzey Asit) +
  bir terfi → `SELECT spool_no, dis_cap_mm, et_kalinligi_mm, kalite, yuzey, alistirma FROM spooller`.

## MK (166 — KARARLAR.md'ye işlenecek)
MK-166.1 (izometri istemci drenajı) · MK-166.2 (satır gruplama) · MK-166.3 (fitting-only cap/et
izometriden) · MK-166.4 (yüzey stainless→asit) · MK-166.5 (taslak=salt kontrol) · MK-166.6 (yükle=
paralel havuz+karar ekranı). Öz-ihlal: MK-85.3 (spooller kolon adı tahmin — doğrusu dis_cap_mm/
et_kalinligi_mm).

## TEST DEVRELERİ — SİLME
"bn ömn" (77bfbc98) · "b nn" (e0af361d, taslak).
