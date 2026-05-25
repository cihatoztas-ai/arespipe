# son-durum.md — AresPipe güncel durum (oturum 124 kapanışı)

**HEAD:** `4aafe23` | **CI:** yeşil (son kod commit'i `8f39de8` yeşildi; 124 doc-only `[skip ci]`) | **Tür:** Karar + teşhis oturumu (kod yazılmadı)

## ÖNCELİK 1 — Devre Wizard vizyon v3 FINAL kararları MÜHÜRLENDİ
Uzun bir karar görüşmesi yapıldı (kod yok). Wizard'ın son hali `docs/DEVRE-WIZARD-VIZYON-v3.md` (337 satır, commit `4aafe23`) belgesine döküldü. Mevcut vizyon belgelerinin (SPOOL-AI-VIZYON v2.1, VIZYON-VE-MODULER-MIMARI, 97/99/106/113/48/120 kararları) çocuğu olarak, onlara atıf vererek.

**Kilitli kararlar:**
- **Omurga:** Wizard = devre detayın "TASLAK MODU" (turuncu önizleme → onay = canlıya terfi). Ayrı sayfa değil, tek sayfanın iki hali.
- **Taslak yeri:** Gerçek devre DEĞİL. Onaya kadar `devreler`'de kayıt yok, spool ID/QR/iş emri YOK. Mevcut `devre_dokumanlari` + kuyruk `parse_sonuc`'tan TÜRETİLİR (yeni staging tablosu yok). Tek ekleme: `devre_dokumanlari`'na `taslak_haric BOOLEAN` + `taslak_not JSONB`. Onay anı = terfi: `devre_yeni` insert/ID/QR mantığını ÇAĞIRIR, kopyalamaz.
- **Giriş:** Tersane + proje AYRI seç; mevcut/yeni ayrımı YOK; devre detay "Spool Ekle" buraya köprü.
- **Klasör:** Windows-ağacı + revizyon-öncesi/bilgi klasörlerini BAŞTA ayıkla (yanlış eşleşmeyi kaynakta kes).
- **Mutabakat:** Kabuk = otorite; 4 durum (eşleşen/zayıf/eksik/fazla); "fazla" SORAR, sessiz eklemez; füzyon motoru (KARAR-97.x) alan-seviyesi çakışma; çıktı spool detayın TÜM sekmelerini besler.
- **Öğrenme:** Onaylı (b); spool-özel vs format-kuralı düzeltme ayrımı; tenant-özel → çift doğrulama → genel terfi (KARAR-48.1).
- **Arka plan:** A-oto (otomatik tetik + retry; lock'suz atomik desen → sekme güvenli, kodla doğrulandı). Hibrit: Yol 3 (server worker + Cron) FINAL hedef, EŞİĞE bağlı (ilk-görülen-format + 100+ spool düzenli + sekme şikayeti). Asıl kaldıraç B değil, L2 öğrenme.
- **L3 kontrolü:** Üç durumlu (otomatik/onaylı/kapalı), devre/belge-tipi bazında. PAOR (resim izometri + Excel yeterli) → kapalı, sıfır maliyet.
- **Koruma bantları:** (1) Yeniden yazma YOK, üstüne bin. (2) Açık borçlar YEDİRİLMEZ. (3) Kararlar kilitli, ekran akışı mockup'ta sınanacak.

## MK-124.1 — Montaj eşleşme borcunun GERÇEK kök nedeni (MK-123.D teşhisi DÜZELTİLDİ)
Yarım kalan montaj kanıtı tek dosyayla test edildi (`E120-722-1021-ALS.1.pdf`, kuyruk `4d6a3607-...`, devre `e07ba2db-...`).
- Kuyruk `bekliyor`+`deneme_sayisi=0`'a çekildi, drenaj konsoldan elle tetiklendi (`ARES_IZO_DRENAJ.izometriDreneEt`, devre-özgü filtre). Parse CALISTI (`islenen:1, manuel:1, hata:0`, 19.5sn -> L3).
- Ama `montaj_json` YINE dolmadi. `parse_sonuc`: dosya montaj degil 2 spool okundu (`spoollar:[S01,S02]`), `montaj_var` alani yok.
- **ASIL SEBEP:** `_eslesme` -> `sebep:"dosya_adi_pipeline_yok"`, `eslesen:0`. Parse `pipeline_no`'yu `"722-1021-ALS"` cikardi; gercek `"E120-722-1021-ALS"` -- **`E120-` oneki dusuyor** -> hicbir spool'a baglanamiyor -> ne spool ne montaj_json yazilabiliyor.
- **Borc "montaj re-parse" DEGIL, "pipeline_no eslesme hatasi" (onek kaybi).** 123'teki "289 bayat montaji toplu re-parse" plani GECERSIZ (re-parse ayni hatayi 289 kez verir). Iyi ki tek dosyayla olctuk.
- Ayrica parse kalitesi zayif (et 6.35mm tolerans disi, malzeme bos, guven 0.75 -> manuel_onay; Yaklasim Y dogru calisiyor, "emin degilim" diyor).
- **Cozum yeri:** wizard eslestirme/mutabakat fazi (pipeline_no onek normalizasyonu). KORUMA-2 geregi simdi yedirilmez.

## Acik borclar (guncel)
- **MK-124.1 (eski MK-123.D):** pipeline_no eslesme hatasi (`E120-` onek kaybi) -> wizard eslestirme fazinda.
- **A-NOT:** bos NOT parse kaynagi (`","`) -> wizard parse/mutabakat fazinda.
- **Web-side spool durum sync** (`aktif_basamak`/`ilerleme` DB-truth) -> taslak/canli gorunum elden gecerken.
- **boy_mm int yuvarlama** (`_tipCevir` 95.25->95) -> AYRI, parse motoru derininde, wizard sonrasi.
- **117** (`yukleyen_id` null ~11 dosya) -> eski dosya temizligi AYRI; wizard yeni vaka uretmez.
- **MK-120.6** L3 politikasi uygulama; fitting library (DIN 86087, ASME B16.9); cok-dilli parse (KARAR-122.1).

## Stack
Supabase/PostgreSQL (RLS, migration), Vercel serverless, Vanilla JS/HTML, GitHub Actions CI (kontrol.js/kontrol.yml). pdf-parse v1.1.1 ZORUNLU (MK-119.4). Mobil PWA: arespipe-mob (React). Drenaj: `ares-izometri-drenaj.js` (113/A client-loop, lock'suz atomik, batch+wizard+devre_detay paylasir).
