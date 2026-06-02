# Son Durum — 145. Oturum (2 Haziran 2026)

> **B'nin DB temeli + spool-seviyesi uyumu kuruldu (taslak_duzeltmeleri.kalem_idx).**
> İki "borç" (C3 devre-bağı, dirsek normalizasyon) kanıtla ÇÜRÜTÜLDÜ — kod yazılmadı, yazsak sistemi bozardık.
> Yeni endpoint YOK (12/12). Migration 100 canlı.

## HEAD (son push ~`561bcdf`)
- `41c4afd` migration(145): 100 taslak_duzeltmeleri kalem_idx [skip ci]
- `561bcdf` fix(145): wizard spool-seviyesi duzeltme kalem_idx:-1 (migration 100 constraint uyumu)

## Yapılanlar (sıra)

### 1. Tanı — ağırdan kolaya (C3 → dirsek → B)
- Cihat "ağırdan kolaya, bağlam kopmadan" dedi. Sıra: A (C3 devre-bağı) → dirsek normalizasyon → B.
- **C3 devre-bağı (A):** MK-126.8 okuma. `spooller`'da kaynak-izometri FK YOK (sadece devre_id). `eslestirme-backfill.js` (NOT iptal değil — iptal edilen `devre-eslesme-yenile.js` mükerrer dosyaydı, 129'da silindi) izometri↔spool eşleşmesini HER ZAMAN devre-kapsamlı yapar (MK-110.2, spool_no tekil değil). Kanıt: AT110-816-027/S01 13 farklı taslak devrede (TEST KİRLİLİĞİ); malzeme_flag izi SADECE g230/7ed93033'te. Oradaki spool A-001090 (9ce6869a) açıldı → C3 DOĞRU sarı "⚠ Doğrulanmadı" yaktı. **144 "inert" = yanlış spool test yanılgısı.** SIFIR KOD.
- **Dirsek normalizasyon:** l2-parser ham ağırlık okur (parseFloat, adet-çarpımı yok, satır 149-172) = doğru. `malzeme-kiyas.js` zaten per-adet normalize (MK-133.2) + dirsek toplam-ağırlık invarianti (MK-133.3, TOL_DIRSEK_AG=0.15). Dirsek 6.72 vs 3.57 = %47 = gerçek-pozitif. **Normalizasyon "düzeltmesi" K2'yi bozardı.** Yapacak iş YOK.

### 2. B — kalem-seviyesi DB temeli (Migration 100)
- Parse çıktısında kalem `kod` YOK (`malzeme_listesi[]`: adet/et/tanim/boy/kalite/malzeme/kategori/agirlik/dis_cap; bazı kalemler ham_satir bozuk). Tanım güvenilmez, aynı tip+çap tekrar eder → tek stabil kimlik = **dizi sırası (`kalem_idx`)**. Parse tek-sefer → sıra sabit (Cihat teyit).
- **Karar Yol A:** `kalem_idx integer NOT NULL DEFAULT -1` (-1=spool, >=0=kalem). Tek TAM unique (kısmi index DEĞİL → PostgREST onConflict garantili; nullable+NULL!=NULL kalemleri çakıştırırdı).
- Eski 5-kolon unique (`..._spool_no_key`) DROP → yeni 6-kolon `taslak_duzeltmeleri_anahtar_uq`. BEGIN...ROLLBACK dry-run → COMMIT. Eski satırlar otomatik -1.

### 3. Wizard uyum fix (devre_wizard_v3.html)
- `duzeltKaydet` delete'e `.eq('kalem_idx',-1)`; upsert row'a `kalem_idx:-1` + onConflict `,kalem_idx`; `_duzeltmeleriYukle` okumaya `.eq('kalem_idx',-1)`. 3 nokta.
- Terfi (`onayEt`) DEĞİŞMEDİ — `s._duzelt` overlay'inden topluyor (DB'den ayrı okumuyor), güvenli.
- 10 script blok / 0 sözdizimi hatası (new Function denetimi).

## CANLI DOĞRULAMA
- Migration 100: dry-run temiz → COMMIT → 6-kolon constraint teyit.
- Wizard: M130-722-1104/S01 (kalite/yuzey/alistirma) → DB'de kalem_idx=-1, toast "düzeltildi ✓", hata yok. Eski G310-306 kayıtları -1 aldı (regresyon yok). SQL ile DB kanıtı alındı.
- C3: A-001090 spool_detay'da sarı "⚠ Doğrulanmadı" + Doğrula (ekran). Wizard İnceleme'de NB1099C spool'larında "doğrulanmadı" rozeti.

## NEREDEYIZ
B'nin DB+spool-seviyesi uyumu hazır. Kalem-seviyesi DÜZENLEME UI'si yok (146). C3 doğru. İki borç çürütüldü.

## Mühürlenecek MK (KARARLAR.md)
- **MK-145.1:** Kalem-seviyesi taslak düzeltme anahtarı = `kalem_idx` (dizi sırası). Terfi öncesi kod YOK, tanım güvenilmez, tip+çap tekrar → idx tek stabil kimlik. Parse tek-sefer → sabit.
- **MK-145.2:** `taslak_duzeltmeleri` Yol A: `kalem_idx NOT NULL DEFAULT -1`, tek TAM 6-kolon unique. PostgREST onConflict garantili (kısmi index belirsiz, nullable çakışır).
- **MK-145.3:** C3 DOĞRU çalışıyor. 144 "inert" = yanlış spool (izometrisi başka test devresinde) testi. Gerçek üretimde izometri kendi devresinde → backfill devre-kapsamlı eşleştirir → C3 doğru. D borcu = test kirliliği artefaktı, kod borcu DEĞİL.
- **MK-145.4:** Dirsek/ağırlık çelişkisi NORMALİZASYON BORCU DEĞİL. K2 zaten per-adet (MK-133.2) + dirsek invarianti (MK-133.3). %47 sapma = gerçek-pozitif. l2-parser ham okur = doğru (MK-111.2). "Düzeltmek" K2'yi bozardı.

## Yeni borçlar
- **spool_detay kütüphane-tıklama bug:** FK DOLU kalem (Elbow S70349, fitting_olculer_id=bc420c9d) satırı tıklanınca kütüphane detayı açılmıyor. FK NULL olanlar beklenen. spool_detay satır-tıklama handler'ı. 145 dışı. Test: A-001090 (9ce6869a), kalem bed61203.
- **B kalanı:** kalem-seviyesi düzenleme UI + kalem upsert (kalem_idx>=0) + terfide aktar'a kalem düzeltme taşıma.

## Hatalarım (kayıt)
- İlk iki teşhisim ("C3 kod gerekiyor", "dirsek normalizasyon borcu") körlemesine olsaydı yanlış olacaktı; okuma (MK-126.8) ikisini de çürüttü. Ders: "borç" listesindeki maddeleri de kanıtla doğrula, miras alıp körlemesine kovalama.
- Kalem anahtarı için önce `kalem_kod` önerdim (Cihat onayladı), ama parse çıktısında kod OLMADIĞINI sonra gördüm → `kalem_idx`'e revize. Ders: anahtar kararından önce hedef verinin alanlarını gör.
- spool_detay 4-numara tıklama teşhisinde "FK NULL" dedim, SQL tersini gösterdi (FK DOLU). Tahminden önce SQL.
