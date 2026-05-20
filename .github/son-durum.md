# AresPipe — Güncel Durum (son güncelleme: Oturum 102, 20 May 2026)

## Excel BOM → Spool akışı (NEREDE KALDIK)

**Tamamlandı (102):** Onay modalı tam zincir çalışıyor ve canlı doğrulandı.
- Wizard'dan yüklenen `bom_excel` parse edilip `oneri_hazir` olunca → devre_detay **Dökümanlar** sekmesinde "Önizle/Onayla" → modal (gruplama+konsolidasyon, tam marka, tek ondalık) → **Aktar** → `spooller`+`spool_malzemeleri` INSERT.
- spool_id = `tenants.kod + '-' + ARES.sonrakiNo('spool')` (6-hane, prefix doğal). Tenant A son_no ≈ 594.

**KRİTİK EKSİK (103 öncelik 1):** Wizard'dan yüklenen dosyalar kuyruğa **`parser='sakla'`** ile giriyor → parse otomatik çalışmıyor. 102 testinde kuyruk durumu elle `UPDATE` ile `oneri_hazir` yapıldı. Gerçek akışta wizard Excel'i `excel-generic`'e yönlendirip parse'ı tetiklemeli. Ayrıca BOM oto-tespiti **yanlış dosyayı** seçiyor (Donatım Kontrol Formu → bom_excel; asıl IFS Malzeme Listesi → diger).

## Mimari kararlar (102)
- **MK-102.1** — spool_id = `tenants.kod`+`sonrakiNo('spool')`; bug'lı `spoolIdFormatla` (sabit "A-", non-A tenant'ta NULL) KULLANILMAZ.
- **MK-102.2** — Yeni spool, `devre_yeni`'nin ürettiğiyle birebir aynı + çift drift kolonlarının HEPSİ doldurulur (savunmacı): `agirlik`+`agirlik_kg`, `durum:'Bekliyor'`+`is_durumu:'bekliyor'`+`ilerleme:0`+`durduruldu:false`, `yuzey`; `aktif_basamak`/`basamak_snapshot`/`alistirma`(null) devreden. malzeme=kategori (`ARES_NORM.malzemeKod`), kalite=ham.
- **MK-102.3** — Onay (Aktar) devre_detay Dökümanlar listesinde yaşar; tüm spool ekleme tek zincire girer: parse → grupla/topla → kimlik üret → onay → INSERT. (Eski manuel inline "+ Spool Ekle" emekliye ayrılacak — altyapıyla çelişiyor.)
- **MK-102.4** — Dökümanlar kendi sekmesinde; `belgelerYukle` lazy (sekme açılınca), signed URL lazy (`dokAc`).
- **KARAR-102.1** — Tek Excel'deki "All" (konsolide) → malzeme listesi; "import" (kesim detayı) → ileride kesim bölümü. 102'de sadece malzeme listesi.
- **KARAR-102.2** — spool_no boş satır: pipeline'da tek spool varsa ona bağla, çoksa "Atanmamış".

## AÇIK BORÇLAR (sıra önemli)
1. **Sayaç tenant-scope DEĞİL** — `sonraki_no` RPC tenant filtresiz (`WHERE tip=...`), benzersizlik sadece `UNIQUE(tip)`. Tüm tenant'lar tek global numaradan çekiyor; harf (tenants.kod) kozmetik. A-000594 buna canlı örnek. **Düzeltme:** `UNIQUE(tenant_id,tip)` + RPC tenant-filtreli + her tenant'a seed (A son_no korunur, diğerleri 1'den) + fallback config (`digits=6,yil_ekle=false`). Şema-dokunur → MK-98.2 dry-run. **E pilotu gerçek spool üretmeden ÖNCE kapatılmalı.** is_emri/sevkiyat/hakedis de aynı.
2. **spooller çift-kolon drift** — `agirlik`+`agirlik_kg`, `durum`+`is_durumu`, `yuzey`+`yuzey_islemi` birlikte var. Şimdilik ikisi de doldruluyor (MK-102.2). İleride tek kanonik kolona indir + okuma noktalarını sadeleştir.
3. **`devre_dokumanlari.parse_durumu` constraint** `oneri_hazir`/`manuel_onay` içermiyor (chk reddetti). Buton kuyruk durumunu okuduğu için sorun değil; istenirse küçük migration ile senkronla.
4. **Wizard oto-etiketleme yanlış Excel'i seçiyor** (yukarıda) — 103-A kapsamı.
5. **Wizard Excel parser oto-tetiklenmiyor** (`sakla` ile giriyor) — 103-A kapsamı.
6. **i18n eksik anahtarlar** (fallback'le TR çalışıyor): `dv_onay_preview, dv_onay_review, dv_onay_soon, dv_db_yok, dv_onay_yok, dv_onay_bos, dv_onay_yuzey, dv_onay_bos_birak, dv_close, dv_onay_aktar, dv_onay_ctx_yok, dv_onay_ortam, dv_onay_sec, dv_onay_aktariliyor, dv_onay_hata, dv_onay_ok, dv_onay_insert_soon, dv_dok_acilamadi, dv_tab_docs` → TR/EN/AR'ye eklenecek.
7. **Dosya içi önizleme** (PDF/resim viewer — indirmeden içini görmek) — on the horizon. Şu an "↗" yeni sekmede açıyor (signed URL).

## Şema notları (102'de doğrulandı)
- `dosya_isleme_kuyrugu`: ... `devre_dokuman_id`(FK→devre_dokumanlari.id), `parser`, `durum`, `parse_sonuc`(jsonb). 084 ile durum 7 değer.
- `devre_dokumanlari`: `devre_id`, `tenant_id`, `dokuman_tipi`, `parse_durumu`, `storage_yolu`, `klasor_yolu`. (proje_id yok.)
- `devreler`: `aktif_basamak`, `basamak_snapshot`(jsonb), `alistirma_devresi`(boolean — `alistirma` text YOK), `zone`, `is_emri_no`.
- `spooller`: çift kolonlar (üstte). Okuma: ağırlık `agirlik_kg||agirlik`, yüzey `yuzey||yuzey_islemi`, durum state `s.durum`'a güvenir.
- `spool_malzemeleri`: `spool_id`(uuid FK→spooller.id), kod, tanim, boyut, malzeme(kategori), kalite(ham), dis_cap_mm, et_mm, boy_mm, adet, miktar, agirlik_kg, tip, ifs_kod. **`standart` kolonu YOK** (parse'ın standart'ı düşer).

## Wizard kalan işler (103+ roadmap)
- **A** (öncelik 1) — Excel oto-yönlendirme `excel-generic` + BOM oto-tespit düzelt + parse oto-tetikle.
- **B** — İzometri PDF yönlendirme (`batch-baslat`/`batch-kuyruga-al`) + paylaşılan PDF upload komponenti (wizard Step 2 atla butonlu + devre_detay İzometri sekmesi) — MK-49.B.
- **C** — Wizard'ın sıfırdan yeni devre+iş emri oluşturması (şu an sadece mevcut devreye yüklüyor).
- **D** — Faz 2 arka plan zenginleştirme (Kaydet sonrası async PDF/3D parse, manuel_onay işaretleme).
