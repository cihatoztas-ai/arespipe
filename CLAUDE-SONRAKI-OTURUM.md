# Oturum 129 — Terfi-yeniden-eşle (tam okuma) + Adım 1 klasör ağacı

## Açılış ritüeli
Git pull/status/log → CI rengi (128 push'unda KOD vardı: `devre_wizard_v3.html` + migration 094 — yeşil mi?)
→ `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) + `son-durum.md` + bu dosya oku → gündem → açık feedback.
Çakışma kapısı **MK-127.1** aktif. Referans tasarım: `devre_wizard_mockup.html` (v5).

## Önce: 128 push'u yeşil mi? (CI)
`devre_wizard_v3.html` (UI emoji içerir — v2 de içeriyor, CI tolere etti) + `migrations/094...`.
Yeni dosyalar, mevcuda dokunmadı → yeşil beklenir. Kırmızıysa ilk iş düzeltme.

## Bağlam — 128 nerede bıraktı
v3 iskelesi CANLI (Demo Atölye, flag arkasında). **İnceleme + B canlı dolum + terfi kanıtlandı**
(İnceleme tablosu doldu, drenaj 🔴→🟢 döndü, iki devre terfi etti). Mevcut `devre_wizard.html` (v2)
dokunulmadı. Bir mimari boşluk açık: terfi sonrası izometri spool'a bağlanmıyor ("tam okuma").

## Yapılacaklar (sıra)

1. **Terfi-yeniden-eşle (MK-127.4) — "tam okuma"nın kökü. KARAR A (Cihat açılışta teyit/çevir):**
   - **A (önerilen):** terfiden sonra devrenin izometri kuyruk kayıtlarındaki MEVCUT `parse_sonuc`'tan
     kanonik eşleştiriciyi (`api/kuyruk-isle-izometri.js` `eslestir`) **re-eşle modunda** çağır —
     PDF yeniden parse YOK, AI YOK, $0. Artık `spooller` var → `spool_id`/`montaj_json`/`cizim_durumu`
     bağı yazılır.
   - Uygulama seçeneği: yeni `/api/devre-eslesme-yenile {devre_id}` (parse_sonuc'tan toplu re-eşle) VEYA
     mevcut matcher'a "spool var, sadece eşle" girişi. **MK-126.8:** önce mevcut kod + DB kontrol;
     `izometri-oku.js`'e DOKUNMA (MK-49.1).
   - v3'te `onayEt` terfiden sonra bu endpoint'i çağırır; sonra devre_detay'a yönlenir → spool'lar
     izometriyi okur.
   - **Doğrulama:** terfi sonrası devre_detay'da DURUM/ALIŞTIRMA/`cizim_durumu` izometriden dolmalı.

2. **Adım 1 klasör ağacı + işaretleme** (mockup + omurga Bölüm 5 / MK-97.6): Adım 1'de düz tablo yerine
   aç-kapa klasör ağacı; klasör işaretleme (bilgi amaçlı / revizyon-öncesi → eşleştirmeye sokma).
   `dokKlasorToggle` deseni (devre_detay) zaten v3'te Dökümanlar sekmesinde — Adım 1'e taşı + işaretleme.

3. **Onayla-drenaj guard + tooltip:** drenaj sürerken (`ozet.isleniyor>0`) "Onayla" uyarsın/beklesin
   (eksik izometriyle terfi engellensin). İzometri dosya adı truncation'a tooltip (tam ad).

4. **Devreler girişi (MK-126.4):** Devreler sayfası/sidebar'a "Devre Yükle" (yeni, v3 flag arkasında)
   + "Onay Bekleyen Devreler" listesi (`durum='taslak'` filtresi, yöneticiye açık). + `devreler.html`/
   `proje_detay.html` canlı listelerine `durum<>'taslak'` filtresi (taslak canlı listede görünmesin).
   **KORUMA-2:** canlı sayfalara dokunulur → dikkatli, smoke test.

## KORUMA bantları (her adımda)
- **KORUMA-1:** `ARES_KABUK.grupla/aktar`, `ARES_NORM`, `ARES_IZO_DRENAJ`, `izometri-oku`, eşleşme
  primitifleri → ÇAĞIR, kopyalama. `kabukTuret` v3'te yok (kanonik `grupla`).
- **KORUMA-2:** açık borçları wizard'a yedirme; canlı sayfa (devreler/proje_detay) dokunuşu = dikkat.
- **KORUMA-3:** mockup'ta tutmayan UI → ekranı düzelt, belgeyi değil.

## Sonraki fazlar (omurga 18.d — bu oturumda DEĞİL)
- Çapa görsel arayüzü + değer düzeltme **yazma** (düzelt popup şu an salt-görüntü).
- Taslak modu tam: `taslak_haric`/`taslak_not` + nullable kolonlar (terfiye kadar devreler yok ideali).
- A2 et/çap çelişkisi: client `grupla` çıktısına çap (`capCikar`/`boyutParse`) → endpoint `bindir` et/çap.

## Wizard dışı açık borçlar
117 (`yukleyen_id` — v3 yeni vakada dolu yazıyor, eski dosyalar AYRI), web-spool sync
(`aktif_basamak`/`ilerleme`), fitting (DIN 86087 / ASME B16.9), `spool_dokumanlari` bağ tablosu.

## Hatırlatmalar
- MK-49.1: `izometri-oku.js`'e DOKUNMA. MK-126.8: yeni endpoint/parser önce mevcut kod + DB kontrol.
- Env: `SUPABASE_SERVICE_KEY` (ROLE değil). Storage path `{tenant_id}/...`. Dry-run schema (MK-98.2).
- MK-128.1: taslak devre `durum='taslak'`; terfide `'aktif'`. MK-128.2: flag master-önce.
  MK-128.3: `grupla().spoollar` ↔ endpoint `kabuk_spoollar` birebir.
- v3 canlıya ALINMAZ; pilot Demo Atölye, Cihat test eder. v2 dokunulmaz.
