# CLAUDE — 145. Oturum Girişi

## Açılış ritüeli
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3` → çıktı.
2. `cat BRIEFING.md` → 144 kapanış bağlamı.
3. Function sayımı (MK-129.3): `ls api/*.js | wc -l` → **12** olmalı. 145'te de yeni endpoint YOK hedefi.
4. `son-durum.md` (144) + `CLAUDE-SON-OTURUM.md` (144) + bu dosya oku.
5. KARARLAR.md'ye MK-144.1/.2/.3/.4 işlenmediyse işle.
6. Gündem teyidi.

## 144 nerede bıraktı
- spool_detay BOM güvenilirliği TERFİ-SONRASI çalışıyor: kalem rötuşu (tip-uyarlamalı, basit tanım) + güvensiz/güvenilir/doğrula + türetilen "Düzeltildi". Canlı doğrulandı (C1, C2).
- C3 (sistem-türevli "Doğrulanmadı") kodu doğru AMA inert: `bomK2SinyalYukle` `SP.devre_id` ile K2 arıyor, ama spool'un devresi ≠ izometrisinin devresi. Fail-safe yeşil (zararsız).
- HEAD ~`de09c7e`. Migration 099 canlı. 12/12.

## 145 — ANA İŞ: C3 devre-bağı (= D borcu, spool↔izometri devre kopukluğu)
**Kanıt (144'te bulundu):** Spool `5d149e43` (AT110-816-027/S01) → `SP.devre_id=fb80d315` (devre "AT110-Drencher-Galv"). Ama o spool'un izometri parse'ı + K2 `malzeme_flag` → devre `7ed93033` ("g230"). pipeline+spool tenant'ta 13 farklı devrede tekrar → devre-bağımsız eşleşme YASAK (yanlış gemi).

**KOD ÖNCESİ OKU (MK-126.8 — tahmin yok):**
1. Spool bir devrede, izometrisi başka devrede NASIL oluyor? Terfi akışı: devre wizard'da izometri `g230` devresine yüklenmiş, spool terfide `AT110-Drencher-Galv`'a mı gitmiş? `devre_dokumanlari` / spool oluşturma akışını oku.
2. Spool → kaynak izometri devresi ilişkisi VAR MI? (spooller'da kaynak_devre/izo_devre kolonu? montaj_json? başka FK?) `information_schema` + spooller örnek satır.
3. `eslestirme-backfill.js` (session 110) bu bağı kuruyor mu — terfi sonrası izometri eşleştirme neden bağlamıyor (DEVIR D borcu).
4. Karar: C3 sinyalini (a) doğru devreyi türetip oradan mı çekeceğiz, (b) yoksa spool'un kendi parse referansından mı (spooller'da bir izometri/parse FK varsa).

**Uyarı:** C3'ün yakaladığı flag'lerin BİR KISMI yanlış-pozitif olabilir — dirsek ağırlık çelişkisi (PDF agregat 6.72 vs Excel birim 3.57) = bilinen "dirsek normalizasyon" borcu. C3 doğru çalışsa bile bu flag'ler "gerçek çelişki mi normalizasyon mu" sorusunu açar. C3'ü canlandırırken bunu akılda tut (operatör "Doğrula" ile geçebilir, ama gürültü olabilir).

## SONRAKİ: B — terfi öncesi BOM kalem rötuşu + güvensiz (wizard)
- Wizard'da kalemler ZATEN görünür: "🔧 Malzeme Listesi" sekmesi (`#malzBody`, kaynak `WIZ._kabukSatirlar` = BOM parse satırları), SALT-OKUNUR.
- İnceleme spool tablosunda `malzeme_flag` (K2) zaten yüzeyde (`izoCell`).
- B = (1) wizard'da kalem düzenleme UI (G2a "Düzelt" popup'ı kalem-seviyeye genişletilebilir ya da yeni), (2) parse'tan gelen kalem sayfa yenilenince kaybolur → KALEM-SEVİYESİ TASLAK katmanı (G2a `taslak_duzeltmeleri` deseni; anahtar devre+pipeline+spool+kalem), (3) güvensiz bayrağı pre-terfi: spooller satırı yok → `(devre,pipeline,spool)` anahtarlı taslak, terfide `spooller.bom_durum`'a yaz, (4) terfide `ARES_KABUK.aktar` taslak kalem düzeltmelerini `spool_malzemeleri`'ye uygula.
- A (144, terfi sonrası) B'nin VARIŞ NOKTASI — spooller.bom_durum + spool_malzemeleri düzenleme zaten hazır.

## SONRAKİ: C4 — downstream damga
- Güvensiz BOM → kesim/büküm/markalama'da GÖRÜNÜR uyarı (ENGEL DEĞİL, taşınan bayrak — "çizimle teyit et"). spool_malzemeleri zaten besliyor (dis_cap/et/boy/kalite). İstasyonların BOM tüketimini + nereye damga gireceğini oku.

## DİĞER AÇIK BORÇLAR
- Kalite alanı datalist (MK-143.2 katı dropdown diyordu) — çalışıyor, basit-tanım'a uyuyor; ileride katı dropdown (düşük öncelik).
- Dirsek ağırlık normalizasyonu (PDF agregat vs Excel birim) — l2-parser.
- Band-B (NB1137 L3) · pipeline_no E120- prefix · yukleyen_id null · devre wizard folder tree · tip='fitting' ama flanş · BUG-B DN125 (park) · ara-açı dirsek (3D).

## KORUMA bantları
- MK-49.1: izometri-oku.js'e DOKUNMA. · MK-129.3: api/*.js = 12, yeni endpoint yok.
- MK-126.8: yeni modül/SQL/sinyal-çekme öncesi mevcut kod+DB+VERİ-AKIŞI oku (144 dersi: C3 devre-bağını öngörmedim).
- MK-98.2: şema migration BEGIN...ROLLBACK dry-run → COMMIT.
- MK-101.1: arespipe_kopyala = üç argüman + git status. Komutları TEK TEK (gp alias yapışıyor).
- MK-134.1: `[skip ci]` HEAD'de push'un tüm CI'ını bastırır → kod ayrı, doc/migration ayrı push.
- Kod commit `[skip ci]` YOK; doc/migration `[skip ci]`.

## Kanonik dosyalar (144)
- `spool_detay.html`: `renderBomDurum`/`bomGuvensizToggle`/`bomDogrula`/`bomK2SinyalYukle` (BOM güvenilirlik), `malzDuzenleAc`/`malzDuzenleTipVis`/`malzDuzenleKaydet` + `#malzDuzenleModal` (kalem rötuşu).
- `migrations/099_bom_guvenilirlik.sql`.
- C3 fix muhtemelen `bomK2SinyalYukle`'de (devre türetme) + olası `eslestirme-backfill.js` okuması.
