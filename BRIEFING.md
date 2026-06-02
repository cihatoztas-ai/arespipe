# AresPipe BRIEFING — 145. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.

## HEAD (son push ~`561bcdf`)
- `561bcdf` fix(145): wizard spool-seviyesi duzeltme kalem_idx:-1 (migration 100 constraint uyumu)
- `41c4afd` migration(145): 100 taslak_duzeltmeleri kalem_idx -- kalem-seviyesi BOM rotusu (B) [skip ci]
- `edaef05` docs(144): kapanis
- **DB:** migration `100_taslak_duzelt_kalem.sql` canlı (COMMIT). Yeni endpoint YOK (12/12).

## 145 — yapılanlar (ANA İŞ: B'nin DB temeli + spool-seviyesi uyumu)
1. **Migration 100.** `taslak_duzeltmeleri.kalem_idx integer NOT NULL DEFAULT -1` + eski 5-kolon unique DROP → yeni 6-kolon `taslak_duzeltmeleri_anahtar_uq`. -1=spool-seviyesi, >=0=kalem. Yol A (tek TAM unique, kısmi index DEĞİL → PostgREST onConflict garantili). BEGIN...ROLLBACK dry-run → COMMIT. Eski satırlar otomatik -1 (regresyon yok).
2. **Wizard uyum fix** (`devre_wizard_v3.html`, 3 nokta). `duzeltKaydet` delete+upsert ve `_duzeltmeleriYukle` okuma → `kalem_idx:-1`. Terfi (`onayEt`) zaten güvenli (s._duzelt overlay'inden, DB'den ayrı okumuyor). **Canlı doğrulandı:** M130-722-1104/S01 düzeltmeleri DB'de kalem_idx=-1 ile yazıldı, toast ✓, hata yok.

## 145 — KANITLA ÇÜRÜTÜLEN İKİ "BORÇ" (tekrar açma)
- **C3 devre-bağı / D borcu KOD HATASI DEĞİL.** 144 "inert" = yanlış spool (A-000559, izometrisi başka test devresinde) test edilmiş. Doğru spool A-001090 (devre g230/7ed93033, flag'in tek devresi) → C3 doğru sarı "⚠ Doğrulanmadı" yaktı. pipeline+spool 13 devrede tekrar = TEST KİRLİLİĞİ. Gerçek üretimde izometri kendi devresinde → backfill eşleştirir → C3 doğru. SIFIR KOD.
- **Dirsek normalizasyon borcu BORÇ DEĞİL.** `malzeme-kiyas.js` zaten per-adet normalize ediyor (MK-133.2) + dirsek toplam-ağırlık invarianti %15 (MK-133.3). 6.72 vs 3.57 = %47 = gerçek-pozitif veri farkı. l2-parser ham ağırlık okur = doğru. "Düzeltmek" K2'yi bozardı.

## §13 DURUM
B'nin terfi-öncesi (wizard) **DB temeli ve spool-seviyesi uyumu** kuruldu. Kalem-seviyesi DÜZENLEME UI'si (satır ✏️, kalem upsert, terfide aktar'a taşıma) HENÜZ yok. C3 doğrulandı (terfi-sonrası spool_detay'da sarı yakıyor + wizard İnceleme'de "doğrulanmadı" rozeti çıkıyor).

## CANLI DOĞRULAMA ✅
- Migration 100: dry-run temiz, COMMIT, 6-kolon constraint teyit edildi.
- Wizard spool-seviyesi düzeltme: M130-722-1104/S01 (kalite ST37, yuzey galvaniz, alistirma YOK) → DB'de kalem_idx=-1, toast ✓, hata yok. Eski G310-306 kayıtları da -1 aldı (regresyon yok).
- C3: A-001090 spool_detay'da sarı "⚠ Doğrulanmadı" + Doğrula butonu (ekran kanıtı).

## AÇIK BORÇ (146 için, öncelik)
1. **A — B'nin kalanı: kalem-seviyesi rötuş UI.** DB+spool uyumu hazır. Kalan: wizard `malzBody` (~1063) satır ✏️ + kalem upsert/overlay (`kalem_idx>=0`, idx=dizi sırası) + terfide `ARES_KABUK.aktar`'a kalem düzeltme taşıma. KOD ÖNCESİ: malzBody render + _kabukSatirlar + aktar imzası oku.
2. **spool_detay kütüphane-tıklama bug.** FK DOLU kalem (Elbow S70349, fitting_olculer_id=bc420c9d) tıklanınca kütüphane detayı açılmıyor. FK NULL olanlar beklenen. spool_detay satır-tıklama handler'ı. Test: A-001090 (9ce6869a), kalem bed61203.
3. **C4 — downstream damga.** Güvensiz BOM → kesim/büküm/markalama görünür uyarı (engel değil).
4. Önceki borçlar: Band-B (NB1137 L3) · pipeline_no E120- prefix · yukleyen_id null · devre wizard folder tree · tip='fitting' ama flanş · BUG-B DN125 (park) · kalite datalist · Malzeme Backfill UI sayfası silme kararı (endpoint canlı, sayfa ayrı).

## PLAN
| Adım | Durum |
|---|---|
| Migration 100 (kalem_idx) | ✅ canlı |
| Wizard spool-seviyesi uyum (kalem_idx:-1) | ✅ 561bcdf canlı, doğrulandı |
| C3 doğrulama (yanlış spool yanılgısıydı) | ✅ kanıtlandı (sıfır kod) |
| Dirsek normalizasyon (borç değilmiş) | ✅ kanıtla kapatıldı |
| B kalem-seviyesi UI | 146 öncelikli |
| spool_detay kütüphane-tıklama bug | 146 |
| C4 downstream damga | sonra |

## NEREDEYIZ — ÖZET
145 ağır işi (C3 devre-bağı + dirsek normalizasyon) okuma disipliniyle "borç değil" diye çürüttü — kod yazsaydık çalışan sistemi bozacaktık. B'ye geçildi: kalem-seviyesi düzeltme için DB anahtarı (kalem_idx) + spool-seviyesi uyumu kuruldu, canlı doğrulandı. Kalan B (kalem düzenleme UI + terfi taşıma) ve spool_detay kütüphane-tıklama bug 146'ya devrediyor.
