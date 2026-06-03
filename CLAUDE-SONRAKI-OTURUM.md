# CLAUDE — 147. Oturum Girişi

## Açılış ritüeli
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3` → çıktı.
2. `cat BRIEFING.md` → 146 kapanış bağlamı.
3. Function sayımı (MK-129.3): `ls api/*.js | wc -l` → **12** olmalı. 147'de de yeni endpoint YOK hedefi.
4. son-durum.md (146) + CLAUDE-SON-OTURUM.md (146) + bu dosya oku.
5. Gündem teyidi.

## 146 nerede bıraktı
- B'nin kalanı (kalem-seviyesi BOM rötuşu) UÇTAN UCA kapandı: wizard ✏️ popup → taslak_duzeltmeleri (kalem_idx≥0) → terfide aktar `kalemDuzeltmeler` overlay → spool_malzemeleri. NB1137'de canlı kanıt (3 kalem, idx hizalı).
- MK-146.1: kalem_idx = gruplu bom sırası (145.1 revizyonu).
- HEAD `1d9345b`. 12/12. Yeni migration yok.

## 147 — ÖNERİLEN ANA İŞ: spool_detay kütüphane-tıklama bug
- Kütüphane FK'sı DOLU kalem satırı (Elbow S70349, `fitting_olculer_id=bc420c9d`) tıklanınca kütüphane detayı AÇILMIYOR. FK NULL olanlar beklenen (açacak kayıt yok).
- Sebep spool_detay satır-tıklama handler'ında. Test spool: A-001090 (`9ce6869a`), kalem `bed61203`.
- **KOD ÖNCESİ OKU (MK-126.8):** spool_detay satır-tıklama handler'ı; FK DOLU satırda neden patlıyor (lookup hatası / event bağı). Önce konsol + handler kodu, tahmin yok (145/146 dersi: borç/teşhis maddesini de kanıtla doğrula).

## SONRAKİ: C4 — downstream damga
- Güvensiz BOM → kesim/büküm/markalama'da GÖRÜNÜR uyarı (ENGEL DEĞİL, taşınan bayrak). spool_malzemeleri besliyor. İstasyonların BOM tüketimini + nereye damga gireceğini oku.

## OPSİYONEL (146 türevi)
- Kalite ayrı düzenlenebilir alan: şu an malzeme düzeltmesi kaliteyi de günceller (aktar kalite=ham malzeme). İstenirse kalemde kalite ayrı alan eklenebilir.
- açı persist: spool_malzemeleri'ye açı kolonu (şema + migration) → wizard'da açı düzenlenebilir olur.

## DİĞER AÇIK BORÇLAR
- Band-B (NB1137 L3) · pipeline_no E120- prefix · yukleyen_id null · devre wizard folder tree (mockup v5) · tip='fitting' ama flanş · BUG-B DN125 (park) · kalite datalist · Malzeme Backfill UI sayfası silme kararı.

## KORUMA bantları
- MK-49.1: izometri-oku.js'e DOKUNMA. · MK-129.3: api/*.js = 12, yeni endpoint yok.
- MK-126.8: yeni kod/SQL/sinyal-çekme öncesi mevcut kod+DB+VERİ-AKIŞI oku. Borç/teşhis maddesini de kanıtla doğrula (145/146 dersi).
- MK-98.2: şema migration BEGIN...ROLLBACK dry-run → COMMIT.
- MK-101.1: arespipe_kopyala = üç argüman (kaynak hedef md5) + git status. Komutlar TEK TEK.
- MK-134.1: `[skip ci]` HEAD push'un tüm CI'ını bastırır → kod ayrı, migration/doc ayrı push.
- Kod commit `[skip ci]` YOK; migration/doc `[skip ci]`.

## Kanonik dosyalar (146)
- `ares-kabuk.js`: `aktar` opsiyonel `kalemDuzeltmeler` param + malRows idx overlay; `duzeltmeler` (spool başlık) ayrı.
- `devre_wizard_v3.html`: `KALEM_ALANLAR`/`kalemDuzeltAc`/`kalemKaydet`/`_kalemDuzeltmeleriYukle` (kalem yolu, kalem_idx≥0); `DUZELT_ALANLAR`/`duzeltAc` (spool yolu, kalem_idx=-1, DOKUNMA); `malzSekmesiRender` (9 kolon, hücre-bazlı rozet); `onayEt` (terfide kalemDuzeltmeler geçer).
- `migrations/100_taslak_duzelt_kalem.sql` (kalem_idx, 145).
