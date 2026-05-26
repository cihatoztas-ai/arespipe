# Oturum 128 — `devre_wizard_v3.html` İnceleme & Onay ekranı (frontend)

## Açılış ritüeli
Git pull/status/log → CI rengi (127 push'unda KOD vardı, CI çalıştı — yeşil mi?) →
**`docs/DEVRE-WIZARD-OMURGA.md` (v3.1)** + `son-durum.md` + bu dosya oku → gündem → açık feedback.
Referans tasarım: **`devre_wizard_mockup.html` (v5)**. Çakışma kapısı **MK-127.1** aktif:
v3.html'e dokunmadan önce omurga MK tablosu + son-durum borç + bu özet taranır.

## Önce: 127 push'u yeşil mi? (CI)
İki yeni kod dosyası (`lib/izo-eslesme.js`, `api/devre-inceleme.js`) emoji (🟢🟡🔴🟠) içeriyor
(yorum + self-test `console.log`). CI kırmızıysa kozmetik — durum mantığı saf ASCII. Düzeltme:
emojileri yorum/string'den çıkar veya CI istisna listesi. **128'in ilk işi bu olabilir** (yeşil değilse).

## Hedef
`devre_wizard_v3.html` — mockup v5'e göre **2 adım İnceleme & Onay**. Backend (eşleştirme + 4-durum)
127'de yazıldı + test edildi; bu oturum **frontend** + endpoint bağlama. **Flag arkasında, canlıya ALINMAZ.**

## Yapılacaklar (sıra)

1. **`devre_wizard_v3.html` iskelesi** (frontend-design, mockup v5):
   - **Adım 1 — Devre & Belgeler:** panel 1+2 birleşik. Tersane SEÇİLEBİLİR dropdown (MK-126.1),
     proje, devre adı + zone. Sürükle-bırak + aç-kapa klasör ağacı (`dokKlasorToggle`). Excel-zorunlu
     kapısı (MK-125.3). "⏸ Beklemeye Al" + L3 aç/kapa (MK-126.5/126.7).
   - **Adım 2 — İnceleme & Onay (devre_detay tabanlı, MK-126.7):** `.stat-grid` hero + sekmeler
     (Spool Listesi / Dökümanlar / Malzeme Listesi / Genel Bilgiler — İşlem Kayıtları YOK) + `.dt` tablo
     + `ARES_NORM` rozetleri. Sütunlar: Durum (🟢🟡🔴🟠) / İzometri (dosya adı + seviye) / Alıştırma / İşlem.
     Üretim sütunları (Büküm/Kesim/...) ÇIKAR. Spool ID gri "terfide üretilecek". Düzeltme popup'ı
     (spool-özel, MK-126.6). Onay-modalı (eksik/fazla uyarısı, MK-126.2).
   - **DOM sözleşmesi:** v2'nin ID'lerini koru (yeni dosya ama aynı modüller çağrılır).

2. **Endpoint bağlama:** client `ARES_KABUK.grupla()` → `POST /api/devre-inceleme {devre_id, kabuk_spoollar}`
   → dönen `{spoollar, fazla, ozet}`'i tabloya render. **marka** client'ta `ARES_NORM.marka` ile.

3. **B canlı dolum:** `ARES_IZO_DRENAJ.izometriDreneEt({filtre:{devreId}, onIlerleme})` —
   `onIlerleme` faz 'bitti'/'tamam'da `/api/devre-inceleme` yeniden çağrılır → satır 🔴→🟢.
   `ozet.isleniyor` "N PDF işleniyor" göster, 0'a inince dur.

4. **Flag + giriş (MK-127.2 / 126.4):** `devre_features`'a `devre_wizard_v3` (Demo Atölye). Devreler
   sayfasına "Devre Yükle" (yeni) + "Onay Bekleyen Devreler" listesi (yöneticiye açık).

5. **Onay → terfi (KORUMA-1):** `kabukOnayla` deseni — `ARES_KABUK.aktar` ÇAĞIR (kopyalama).
   Terfi sonrası kanonik eşleştirme mevcut matcher ile (MK-127.4).

## KORUMA bantları (her adımda)
- **KORUMA-1:** `ARES_KABUK.aktar/grupla`, `ARES_NORM`, `ARES_IZO_DRENAJ`, `izometri-oku` → ÇAĞIR.
  `kabukTuret` v3'te KULLANMA → kanonik `grupla` (sapma kaynağı kapanır).
- **KORUMA-2:** açık borçları (aşağıda) wizard'a yedirme.
- **KORUMA-3:** mockup'ta tutmayan UI → ekranı düzelt, belgeyi değil.

## Açık borçlar (AYRI / sıradaki turlar)
- **A2 (et/çap çelişki):** client `grupla` çıktısına çap ekler (`capCikar`/`ARES_KABUK.boyutParse`),
  endpoint `kabukBindirHedef`'e `dis_cap_mm` geçer → `bindir` et/çap dahil. (A1'de et/çap kabuk-null → flag yok.)
- **Terfide yeniden-eşle:** PDF yeniden parse (basit/israf) vs `parse_sonuc`'tan ucuz yeniden-eşle (ek backend). KARAR YOK.
- **MK-124.1:** `dosya_adi_regex` M200 deseni (`.S01.` segmentsiz) + `E120-` öneki — ≥5 örnekle (MK-51.2).
- **K2 boş şablon:** `spool_no_sablonu` tablo yeri (kolonlar onaylı: Spool No·Pipeline·Rev·Çap·Et·
  Ağırlık·Malzeme·Kalite·Yüzey·Alıştırma; üretim SheetJS).
- **Wizard dışı:** 117 (`yukleyen_id` null), web-spool sync, fitting (DIN 86087 / ASME B16.9),
  `spool_dokumanlari` bağ tablosu.

## Hatırlatmalar
- MK-49.1: `izometri-oku.js`'e DOKUNMA. MK-126.8: yeni modül/parser önce mevcut kod + DB kontrol.
- Env: `SUPABASE_SERVICE_KEY` (ROLE değil). Storage path `{tenant_id}/...`. Dry-run schema migration (MK-98.2).
- `api/devre-inceleme.js` SAF OKUMA — yazma terfide (mevcut matcher). Endpoint `kuyruk-isle-izometri.js`'ten
  primitif + `lib/bindir.js`'ten `bindir` import eder (kanonik tek kaynak, drift yok).
- v3.html canlıya ALINMAZ; pilot Demo Atölye, Cihat test edecek.
