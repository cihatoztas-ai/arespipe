# AresPipe BRIEFING — 166. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> İlerleme aynası: docs/WIZARD-YOL-HARITASI.md (166 İŞARETLERİ eklendi).

## HEAD
- **Tema:** DÜZEN TURU — wizard/devre_detay sayfa düzeni tutarlılaştırma + "okundu ama yüzeye
  çıkmadı" hissini bitirme. Format öğretimi bu oturum ATLANDI (Cihat kararı).
- **Bookend commit'ler:** `d5b8c9e` (ilk — wizard düzen paketi) → `595c435` (son — okunan değer
  A/B/C). Aradakiler topic bazlı: +N rozet · kalem-zoom v1/v2 · taslak rol+köprü · excel hücre-git ·
  yükle/paralel/karar ekranı. Açılışta `git log --oneline` ile sırala.
- **DB:** migration YOK. Endpoint YOK (12/12 — MK-129.3). izometri-oku DOKUNULMADI (okundu).
- **Değişen dosyalar:** devre_wizard_v3.html (çok dalga) · devreler.html · devre_detay.html ·
  ares-kabuk.js · ares-normalize.js · lib/izo-eslesme.js · api/devre-inceleme.js · lang/{tr,en,ar}.json.
  **TARAYICIDA yüklü → deploy sonrası sert yenile (MK-161.1): ares-kabuk.js, ares-normalize.js.**

## 166 — yapılanlar (kararlar Cihat'ın)
1. **W-2.1 KAPANDI:** tersane/proje çift yönlü senkron (proje seçilince tersane oturur; tersane
   değişince uyumlu proje korunur). "Tersan — NB1124" karışık etiketi bitti.
2. **MK-165.7/2 KAPANDI — taslak→wizard köprüsü:** devre_detay ?taslak=1 = SALT kontrol penceresi.
   Aktif-devre aksiyon butonları + spool listesi yazma butonları GİZLENDİ; tek aksiyon "✏️ Wizard'da
   düzenle & onayla" (?devre_id=). Ters köprü: Adım 2'ye "👁 Önizle". İki kapı bağlandı (3 dil anahtarı).
3. **K2-A:** terfide backfill başarılıysa TEMİZ izometri önerileri otomatik `tamamlandi`; atanmamışlı +
   manuel_onay AÇIK (B-6); backfill hatalıysa dokunma. Onay Kuyruğu sekmesi aktif devrede rozet=0 ise
   gizli (taslakta hep görünür). Onay kuşağı birikiminin büyüme kaynağı kurudu.
4. **Adım 1 yedek alanları:** malzeme/yüzey/alıştırma — DOKÜMAN ÖNCELİKLİ (BOM/PDF ezer); aktar'a
   opsiyonel `malzemeVarsayilan`/`alistirmaVarsayilan` (devre_detay göndermez → 0 regresyon). Eski
   "opsiyonel" yardım-metni yalanı düzeldi. **← Geri** butonu (taslağı silmeden devrelere döner).
5. **devreler +N rozeti DÜZELDİ:** çoğunluk dışı SPOOL ADEDİ değil farklı TÜR SAYISI (galvaniz+11
   siyah → +1; üç tür → +2). Adet tooltip'e taşındı.
6. **YÜKLE AKIŞI YENİDEN:** Adım 1'de tek "⬆ Yükle" (İncele/Beklemeye Al kalktı). PARALEL HAVUZ
   (6 eşzamanlı — 356 dosya dakikalar). Bitince KARAR EKRANI: ➕ Yeni Devre (sıfırdan) · 🔍 İncele &
   Onayla · 📋 İşlenenler'e Git. izometri SIRAYA alınır, BURADA İŞLENMEZ (istemci drenajı — MK-166.1).
   Küçük devrede uyarısız; her ekranda çıkış görünür.
7. **W-2.19 TAM DİLİM — kalem-zoom (Cihat fikri):** ✏️ alan değerini pdf.js metin katmanında arar →
   zoom+vurgu. SATIR GRUPLAMA (MK-166.2) Cadmatic parçalı metnini yakalar. Görünürlük toast'ı + çoklu
   eşleşme gezinme. 🔍 Tablo norm bbox yoksa "Malzeme Listesi" başlık-arama fallback.
8. **Excel hücre-git:** Excel sekmesi açıkken ✏️ → değer hücrede aranır (sayfa-geçişli), hücre
   seçilir+ortalanır. PDF tarafıyla simetrik.
9. **OKUNAN-DEĞER YÜZEYE (A/B/C):**
   - **A:** kabuk çap/et boşsa (fitting-only spool, düz boru yok — MK-166.3) izometri ham'ından göster;
     terfide backfill yazar.
   - **B:** grupla baskın kalem KALİTESİNİ türetir (`anaKalite` 316L) → izo-eslesme passthrough → aktar
     dz.kalite > kalem kalitesi > anaMalzeme; **terfide spool kalite'sine 316L yazılır.**
   - **C (MK-166.4):** yüzey stainless okuyorsa → `asit` (yuzeyKod + yuzeyBadge normalize, tabloda "Asit").

## ⚠ 167'ye işaretler
- **CRON / sayfa-kapalı izometri (167 ANA TASARIM — MK-166.1):** izometri parse İSTEMCİ drenajı
  (`ARES_IZO_DRENAJ`, sunucu worker'ı yok). vercel.json'da cron VAR (`/api/kuyruk-isle`, 03:00 günlük)
  ama yanlış kuyruğu (`is_kuyrugu`) süpürüyor; wizard kuyruğu `dosya_isleme_kuyrugu` tarayıcıyla
  boşalıyor. ÇÖZÜM: `kuyruk-isle.js`'e izometri dalı ekle (YENİ ENDPOINT YOK — 12/12 koru) + atomik
  claim guard (cron↔tarayıcı çift-işleme) + frekans (Hobby gece-1 / Pro dakika / dış zamanlayıcı).
  self-chain deseni hazır; **Pro ŞART DEĞİL** (frekans+timeout'u açar). Bu oturumda araştırıldı/karar
  verildi → 167'de uygula.
- **MK-165.7/1 OPR dn→dis_cap** (DN200→200.0, doğrusu 219.1; olcuParse+dnBul) — AÇIK.
- **MK-165.7/3 uyarı mükerrerliği** (aynı uyarı 2-3 dk arayla çift) — AÇIK.
- **Onay kuşağı eritme** (162 kayıt; P26-217=76) · **Y200 öğretimi** (diğer bilgisayar) — AÇIK.
- **W-2.5** tam değil (iki ayrı çubuk değil) · **W-2.9** eşzamanlı paralel devre değil.
- **KARARLAR.md'ye MK-166.1..6 işlenmeli** (kök dosya — bu pakette DEĞİL).
- **Küçükler:** kalem-zoom aday-listesi inceltme · karar ekranı küçük-devre canlı doğrulama ·
  okunan-değer A/B/C canlı teyit (deploy+sert yenile sonrası G200 inceleme + bir terfi → spooller SELECT).
- Test devresi: **"bn ömn"** (77bfbc98) + **"b nn"** (e0af361d, taslak) — SİLME.

## MK kayıtları (166 — KARARLAR.md'ye İŞLENECEK, bu pakette değil)
- **MK-166.1:** izometri parse İSTEMCİ drenajı; sayfa-kapalı işleme cron+sunucu-worker gerektirir.
- **MK-166.2:** değer→koordinat aramasında SATIR GRUPLAMA şart (Cadmatic parçalı metin); tek-item yetmez.
- **MK-166.3:** kabuk fitting-only spool'da cap/et türetemez (düz boru yok) → izometri ham'dan yüzeye + backfill terfide.
- **MK-166.4:** yüzey alanı stainless okuyorsa → asit (paslanmaz yüzey işlemi asitlemedir).
- **MK-166.5:** taslak önizleme = salt kontrol penceresi (kilitli butonlar gizli, tek aksiyon Wizard köprüsü).
- **MK-166.6:** Yükle = paralel havuz + karar ekranı; izometri SIRADA (işlemez), işleme İncele&Onayla / İşlenenler'de.
- **MK-85.3 öz-ihlal:** spooller kolon adı tahmin edildi (cap_mm yanlış; doğrusu **dis_cap_mm / et_kalinligi_mm**). Şema-önce istisnasız.

## NEREDEYIZ — ÖZET
166 "düzen turu"ydu: wizard ve devre_detay'ın aynı işin farklı kapıları olduğu tutarsızlık giderildi
(taslak = salt kontrol + Wizard köprüsü), yükleme akışı seri-yükleme dostu hâle geldi (paralel havuz +
karar ekranı), büyük devreler için izometri sıraya alınıp beklemeden geçildi, ve "okundu ama yüzeye
çıkmadı" sınıfı üç kusur kapandı (çap/et izometriden, kalite kalemden→316L terfide, yüzey paslanmaz→asit).
Asıl mimari soru — sayfa-kapalı işleme — araştırıldı ve 167'nin ana tasarımı olarak netleşti (cron
worker'a izometri dalı; Pro şart değil). 12/12, izometri-oku dokunulmadı, migration yok.
