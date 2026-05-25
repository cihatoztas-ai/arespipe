# CLAUDE-SONRAKI-OTURUM.md — Oturum 125 ajandasi

## Acilis ritueli (her zaman)
1. `git pull origin main && git status && git log --oneline -3` (temiz mi, HEAD `4aafe23` mi)
2. CI rengi (son kod commit'i `8f39de8` yesildi; sonrasi doc/skip)
3. son-durum.md + bu dosya okundu
4. Ajanda onayi
5. Acik geri-bildirim sayisi

## ONCELIK 1 — MOCKUP (Cihat ile karar verildi)
Wizard vizyon v3 FINAL kararlari `docs/DEVRE-WIZARD-VIZYON-v3.md`'de kilitli. Siradaki adim: KARARLARI GORSEL USTUNDE SINAMAK. Cihat "kafamda canlandiramiyorum" dedi -- mockup tam bunun icin.

**Cizilecek ekranlar (kod degil, mockup/onizleme):**
1. **Giris** — tersane + proje AYRI secim; mevcut/yeni ayrimi yok.
2. **Klasor agaci** — surukle-birak sonrasi Windows-gezgini gorunum; revizyon-oncesi/bilgi klasorlerini BASTA isaretleyip ayiklama.
3. **Taslak modu** — devre detay sayfasinin turuncu "ONIZLEME" hali (omurga karar). Gercek devre detayla AYNI gorunum, taslak banti + sari "dogrulanmadi" alanlar.
4. **Mutabakat** — kabuk = otorite; 4 durum (yesil/sari/kirmizi/turuncu); "fazla" sorar; alan-seviyesi fuzyon cakismasi gosterimi.
5. **Onay akisi** — onayla -> canliya terfi -> devre detaya don (siralı, paralel degil).

**Yontem:** Mockup'i Visualizer/HTML ile inline ciz, Cihat'a goster, "su ekranda su tutmuyor" geri bildirimiyle duzelt. KORUMA-3: mockup'ta tutmayan sey -> belge degil o ekran duzeltilir.

**DIKKAT (KORUMA-1/2/3):**
- Kod yazmaya GECME, once mockup. Cihat onaylamadan FAZ 1 koduna baslanmaz.
- Acik borclar YEDIRILMEZ (Cihat karari). Sadece pipeline eslestirme (MK-124.1) wizard eslestirme fazinin dogal parcasi.
- Mevcut calisani CAGIR, kopyalama (devre_yeni ID/QR, izometri-oku, drenaj, format registry).

## Acik borclar (wizard SONRASI / ayri sira)
- **MK-124.1:** pipeline_no eslesme hatasi (`E120-` onek kaybi). parse `pipeline_no`'yu dosya adindan/icerikten cikarirken onek dusuyor. Wizard eslestirme fazinda cozulur. (Detay: son-durum.md + MK-124.1.)
- **A-NOT:** bos NOT parse kaynagi (`","`). Wizard parse/mutabakat fazinda.
- **Web-side spool durum sync:** `aktif_basamak`/`ilerleme` DB-truth okuma. Taslak/canli gorunum elden gecerken.
- **boy_mm int yuvarlama** (`_tipCevir` 95.25->95): AYRI, parse motoru derininde, dikkatli, wizard sonrasi.
- **117** (`yukleyen_id` null ~11 dosya): eski dosya temizligi AYRI.
- **MK-120.6** L3 politikasi uygulama; fitting (DIN 86087, ASME B16.9); cok-dilli parse (KARAR-122.1).

## Onemli baglam
- 124 KARAR + TESHIS oturumuydu, kod yazilmadi. Tek commit doc (`4aafe23`, `[skip ci]`).
- Wizard belgesi vizyon belgelerinin cocugu: SPOOL-AI-VIZYON v2.1, VIZYON-VE-MODULER-MIMARI okunmali (mockup oncesi gozden gecir).
- migration 080 (devre_wizard_v2 semasi) 97'de hazir bekliyor -- mockup sonrasi FAZ 1 kodunda temel.
- Drenaj `ares-izometri-drenaj.js` (kok dizin, lib/ degil). 113/A client-loop, lock'suz atomik, batch+wizard+devre_detay paylasir. A-oto icin tur-sonu retry + otomatik tetik eklenecek (FAZ 1).
