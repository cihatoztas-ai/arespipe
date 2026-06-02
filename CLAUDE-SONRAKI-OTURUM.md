# CLAUDE — 146. Oturum Girişi

## Açılış ritüeli
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3` → çıktı.
2. `cat BRIEFING.md` → 145 kapanış bağlamı.
3. Function sayımı (MK-129.3): `ls api/*.js | wc -l` → **12** olmalı. 146'da da yeni endpoint YOK hedefi.
4. `son-durum.md` (145) + `CLAUDE-SON-OTURUM.md` (145) + bu dosya oku.
5. KARARLAR.md'ye MK-145.1/.2/.3/.4 işlenmediyse işle.
6. Gündem teyidi.

## 145 nerede bıraktı
- B'nin (terfi öncesi BOM kalem rötuşu) **DB temeli + spool-seviyesi uyumu** kuruldu: `taslak_duzeltmeleri.kalem_idx` (migration 100) + wizard 3-nokta uyum fix. Canlı doğrulandı (DB'de kalem_idx=-1, toast ✓).
- İki miras "borç" kanıtla ÇÜRÜTÜLDÜ: C3 doğru çalışıyor (144 "inert" = yanlış spool testi), dirsek normalizasyon borç değil (K2 zaten per-adet + dirsek invarianti, %47 sapma gerçek-pozitif).
- HEAD ~`561bcdf`. Migration 100 canlı. 12/12.

## 146 — ÖNERİLEN ANA İŞ: A — B'nin kalanı (kalem-seviyesi rötuş UI)
DB+spool uyumu hazır (kalem_idx). Kalan 3 parça:
1. **Wizard kalem render + ✏️:** `devre_wizard_v3.html` ~1063 (`malzBody`) — kalemler (`WIZ._kabukSatirlar` → grupla) salt-okunur. Her satıra düzenleme UI (G2a "Düzelt" desenini kalem-seviyeye genişlet ya da yeni).
2. **Kalem upsert/delete/overlay:** `duzeltKaydet` + `_duzeltmeleriYukle` desenini `kalem_idx>=0` ile çoğalt. Anahtar: (tenant,devre,pipeline,spool,alan,kalem_idx), kalem_idx=dizi sırası. Spool-seviyesi yolu (kalem_idx=-1) zaten çalışıyor, dokunma — kalem yolu ayrı.
3. **Terfide taşıma:** `ARES_KABUK.aktar`'a kalem-seviyesi düzeltmeleri ver → `spool_malzemeleri` UPDATE (terfide kalem satırı oluşunca). aktar imzasında kalem-düzeltme parametresi var mı önce oku.

**KOD ÖNCESİ OKU (MK-126.8):**
- `malzBody` render fonksiyonu (~1063) — kalem satırı nasıl çiziliyor, idx erişilebilir mi.
- `WIZ._kabukSatirlar` yapısı + `ARES_KABUK.grupla` çıktısı (kalem dizisi sırası stabil mi).
- `ARES_KABUK.aktar` imzası — `duzeltmeler` parametresi (143/G2a overlay-B) kalem-seviyesini kabul ediyor mu, yoksa genişletilmeli mi.
- Parse çıktısı kalem alanları (kod YOK; adet/et/tanim/boy/kalite/malzeme/kategori/agirlik/dis_cap) — hangileri düzenlenebilir.

## SONRAKİ: spool_detay kütüphane-tıklama bug
- Kütüphane FK'sı DOLU olan kalem satırı (Elbow S70349, fitting_olculer_id=bc420c9d) tıklanınca kütüphane detayı açılmıyor. FK NULL olanlar beklenen (açacak kayıt yok).
- spool_detay satır-tıklama handler'ında. Test spool: A-001090 (9ce6869a), kalem bed61203.
- Düzeltme yönü: FK DOLU satırda handler neden patlıyor (lookup hatası / event bağı). Önce konsol.

## SONRAKİ: C4 — downstream damga
- Güvensiz BOM → kesim/büküm/markalama'da GÖRÜNÜR uyarı (ENGEL DEĞİL, taşınan bayrak). spool_malzemeleri zaten besliyor. İstasyonların BOM tüketimini + nereye damga gireceğini oku.

## DİĞER AÇIK BORÇLAR
- Band-B (NB1137 L3) · pipeline_no E120- prefix · yukleyen_id null · devre wizard folder tree (mockup v5) · tip='fitting' ama flanş · BUG-B DN125 (park) · ara-açı dirsek (3D) · kalite datalist (MK-143.2, düşük öncelik).
- Malzeme Backfill UI sayfası (`admin/kutuphane-backfill.html`) silme kararı — endpoint (`eslestirme-backfill.js`) CANLI, 12/12'ye dahil; SAYFA ayrı, silinebilir. Karar netleşmedi.

## KORUMA bantları
- MK-49.1: izometri-oku.js'e DOKUNMA. · MK-129.3: api/*.js = 12, yeni endpoint yok.
- MK-126.8: yeni kod/SQL/sinyal-çekme öncesi mevcut kod+DB+VERİ-AKIŞI oku. (145 dersi: iki "borç" teşhisi okumadan yanlış çıkardı; okuyunca çürüdü. Borç listesini de kanıtla doğrula.)
- MK-98.2: şema migration BEGIN...ROLLBACK dry-run → COMMIT.
- MK-101.1: arespipe_kopyala = üç argüman (kaynak hedef md5) + git status. Komutları TEK TEK.
- MK-134.1: `[skip ci]` HEAD'de push'un tüm CI'ını bastırır → kod ayrı, migration/doc ayrı push.
- Kod commit `[skip ci]` YOK; migration/doc `[skip ci]`.
- MK-145.1/.2/.3/.4 (yukarıda + son-durum.md).

## Kanonik dosyalar (145)
- `migrations/100_taslak_duzelt_kalem.sql` (kalem_idx).
- `devre_wizard_v3.html`: `duzeltKaydet`/`_duzeltmeleriYukle` (kalem_idx:-1 spool-seviyesi); kalem yolu BURAYA eklenecek. `malzBody` render (~1063) kalem ✏️ noktası. `onayEt` (~1363) terfide aktar + duzeltHarita.
- `lib/malzeme-kiyas.js` (K2 çekirdeği — DOKUNMA, doğru çalışıyor, MK-145.4).
- `api/eslestirme-backfill.js` (izometri↔spool devre-kapsamlı eşleşme — canlı, iptal DEĞİL).
