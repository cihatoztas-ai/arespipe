# AresPipe BRIEFING — 158. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> İlerleme aynası: docs/WIZARD-YOL-HARITASI.md (158 işaretleri işlendi).

## HEAD
- Kod: 4 commit — `feat(158)` Onay Kuyruğu sekmesi · `feat(158)` devreler.html rozetleri ·
  `feat(158)` W-2.14/A taslak veri katmanı · `fix(158)` rötuşlar (bant/kalite/duzeltme-overlay).
  Kapanış doc commit'i üstte. **DB:** migration YOK, veri UPDATE YOK (yalnız UI'dan kuyruk durum
  geçişleri). Endpoint YOK (12/12). izometri-oku DOKUNULMADI.

## 158 — yapılanlar
1. **W-2.15 Onay Kuyruğu sekmesi KAPANDI (canlı kanıtlı):** devre_detay 6. sekme, 4 grup —
   manuel_onay amber/TEKİL (uyarı listesi `parse_sonuc.spoollar[].uyarilar` lazy + ✓Kapat) ·
   excel öneri → mevcut onayModalAc köprüsü · atanmamışlı izometri (B-6: görünür, "Detay" →
   `_eslesme.detay[]` spool+sebep; toplu kapatmaya GİRMEZ) · temiz öneri TOPLU kapatma
   (→tamamlandi, veri işlemi YOK; `_eslesme` özetsiz eskiler girer — MK-158.2). Sekme rozeti +
   `?sekme=onay` deep-link + `_tkKilit` guard. Kanıt: g200 tekil 55→54 ✓ · hhbjşlö toplu 24→0,
   excel 1 yerinde ✓ · 265/aw231 atanmamışlı grup 8 + `kabukta_yok` detayı görünür ✓.
2. **devreler.html rozetleri:** satırda `✅ N` = devrenin bekleyen onay sayısı (KUYRUK gerçeği,
   tek toplu sorgu, tıkla→`?sekme=onay`) + İşlenenler butonuna turuncu bekleyen-iş rozeti
   (bekliyor+isleniyor; 157 "rozet 0 ama 22 iş" bulgusu kapandı).
3. **W-2.14/A GEMİDE (canlı kanıtlı) — MK-156.1 boş gövde KAPANDI:** `?taslak=1` kipinde
   spoolYukle tek `if` ile dallanır: excel kuyruk önerileri (N iş birleşir) → `ARES_KABUK.grupla`
   (terfiyle aynı çekirdek, MK-139.1 cap/et başlıkta) → sentetik satır → `_spoolMap`. Render'a
   sıfır dokunuş. Rötuşlar: kalite=anaMalzeme + malzeme=malKod (terfi hizası, MK-158.3) ·
   `taslak_duzeltmeleri` (kalem_idx=-1) overlay'i önizlemede aktar semantiğiyle okunur · amber
   bant main-content'e taşındı (topbar z-150 örtülüyordu; bant top:52/z:140) · goSpool taslakta
   kilitli. Kanıt: bchmgbcmbn 4 spool dolu önizleme, cap/et/ağırlık wizard'la birebir.
4. **Üç teşhis kanıtla devrildi (MK-158.1):** (a) "265 sekmesi boş" → benzer adlı İKİ devre
   varmış (d222/NB1137 dokümansız; 141 öneri aw231/NB1124'te ve doğru görünüyordu); (b) "backfill
   montaj dalı yok" → `eslestir()` montajı İÇİNDE dallıyor (kuyruk-isle:506), montajda
   spoollar=[] Array olduğundan ön filtreden geçer; (c) "montaj spool detaya gelmedi" → 28/36
   spool'da montaj_json DOLUYDU, bakılan spool ALS çiftsiz 8'dendi — sistem tasarlandığı gibi.
5. **Canlı doğrulamalar:** terfi sonrası `alistirma` doldu (NOT→alıştırma zinciri sağlam:
   l2-parser `alistirma_ipucu_kurali` + eslestir `deg.alistirma`/`imalat_not`) · montaj_json
   backfill yoluyla da yazılıyor · spool_detay "Montaj Resmi" UI'ı çalışıyor (116/Is3).

## ⚠ MK-158.1 / 158.2 / 158.3
**MK-158.1 (süreç):** Teşhis sırası VERİ (SQL) → UI → ancak ondan sonra kod. Benzer adlı devre ≠
aynı devre (157.4'ün UI ikizi). 158'de üç "kırık" kanıtla sağlam çıktı — patch yazılmadı.
**MK-158.2:** Toplu kapatma kapsamı: yalnız temiz izometri önerileri. Atanmamışlı (B-6) ve excel
(veri 109/A aktarımıyla kapanır) GİRMEZ; `_eslesme` özetsiz eski kayıtlar GİRER.
**MK-158.3:** Taslak önizleme = terfi: kalite=anaMalzeme, malzeme=malKod, duzeltme overlay aynı
ezme kuralı. Alıştırma/izometri verisi taslakta YAPISAL yok (MK-157.1) — terfiden sonra dolar.

## 159 ANA İŞ ADAYLARI
1) **İş emri numarası taslakta üretiliyor** (karar terfide üretilmesiydi — iptal taslaklar numara
   yakıyor, P26-2xx sıçramalı): wizard taslak INSERT + terfi akışı read-before-write → numara
   üretimini terfiye taşı. 2) **PDF NOT okuma kanıt turu:** mekanizma var ve bu vakada çalıştı;
   Cihat'ın "koptu" gözlemi için format-bazlı tarama (hangi formatta `not_metni` üretilmiyor) +
   `imalat_not`'un spool detayda görünürlük teyidi. 3) Format hattı: Sefine şablonu (en ucuz,
   IFS köprüsü hazır) / Y200 ST37 + W-3.9 / W-2.4 sınıflandırma+yönlendirme tasarımı.
Küçükler: KARARLAR.md'ye MK-157.x+158.x · EN/AR anahtarları (dv_onayk_*, dv_tab_onay,
dv_taslak_spool_yok) · 6 B1124 PDF orijinal ad (MK-52.1) · IZO-KANIT-SETI v4 · ✖ sessiz-kayıp ·
hhbjşlö 1 excel önerisi hâlâ açık (onay modalından aktarılmadı).

## NEREDEYIZ — ÖZET
Onay havuzunun yüzü artık var: W-2.15 + W-2.14 aynı oturumda gemide ve canlı kanıtlı; taslak→
önizleme→terfi→onay zinciri uçtan uca çalışıyor. Sıfır migration, sıfır endpoint, 12/12. 158'in
mirası süreç dersi: kanıt üç hipotezi öldürdü, kod tabanı sanıldığından sağlam.
