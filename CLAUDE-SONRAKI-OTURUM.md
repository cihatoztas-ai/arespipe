# CLAUDE-SONRAKI-OTURUM.md — Oturum 203 gündemi

> commit `[skip ci]`

## Açılış ritüeli
`git pull --rebase` → status/log → `ls api/*.js | wc -l` (12/12) → `BRIEFING.md` oku → bu dosya → ajanda onayı.

## Önce karar gerektirenler
1. **PDF kalıcılık modeli** (Cihat kararı): KK Liste PDF yazdır-tabanlı → Storage'a otomatik dosya yazılamaz.
   - **A (mevcut):** on-demand yeniden üretim. Pakete bağlı, hep güncel, sıfır depolama. 📄 ve Belgeler'den, arşivde de açılır. → Şu an bu çalışıyor; "pakette taşınıyor" gereksinimini karşılıyor.
   - **B:** davet oluşturulurken seçili spool **snapshot**'ını `kk_davetler`'e JSON kaydet → 📄 snapshot'tan üretir (oluşturma anındaki hali dondurur). Migration gerektirir (+1 kolon).
   - **C:** gerçek dosya: kullanıcı PDF'i kaydedip Belgeler'e yükler (Storage upload alanı). Daha büyük iş.
   - Öneri: A yeterli; donmuş kayıt isteniyorsa B (küçük migration).

## Doğrudan yapılabilecekler
2. **KK i18n** → `lang/{tr,en,ar}.json`'a ekle (şu an `tvv()` TR fallback'iyle çalışıyor):
   `kk_pdf_baslik`, `kk_pdf_footer`, `kk_no_atanir`, `kk_gemi`, `kk_gemi_proje`, `kk_kapsam`, `kk_top_agirlik`, `kk_th_gemi_devre`, `kk_th_kalite`, `kk_th_yuzey`, `kk_th_marka`, `kk_th_spool`, `kk_durum_tamam`, `kk_durum_bekliyor`, `kk_davet_yok`, `kk_pdf_uret`, `kk_belge_liste_pdf`, `kk_belge_liste_pdf_alt`, `kk_btn_liste_pdf`, `cmn_yazdir_pdf`.
   (`lang/` root canonical; `mobile/src/lang/` prebuild ile auto-gen — elle düzenleme.)
3. **Belgeler popup gerçek Storage bağı**: galeri/not hâlâ taslak. `kk_belgeler` tablosu mu, `kk_davetler` alanı mı? (kapsam: paket/spool) — karar açık.
4. **spool_detay / devre_detay KK çapraz-linkleri**: davet no, sonuç, tarih gösterimi.
5. **BUG**: spool_detay'da `aktif_basamak='kk'` spool sevkte görünüyor; sevk havuzu/sevkiyat "KK onaylı" listesi olmalı.

## Kütüphane (paralel iş)
6. A11 audit: `yaricap_mm` (LR elbow, `izometri-oku.js` okunmadan UPDATE yok — MK-158.1), 45° LR elbow ET/A boşlukları, light-tema "Benzer parçalar" kontrast.
7. Stainless flange FK backfill: B16.5 WN Class150 kaynak bulma.
8. Matcher: cunife reducing tee `tee_eq` yanlış sınıf (`malzeme-kutuphane-eslesme.js:97`); tee lookup `cap_kucuk` filtresiz (latent collision).

## Notlar
- `kalite_kontrol.html` canlı md5: `fc7f469eaf43689808761bb7ab5f9e88`.
- PDF logo gelmiyor şikayeti olursa: Ayarlar'da firma logosu yüklü mü → localStorage `ares_logo_firma` dolu mu bak. Mekanizma diğer tüm PDF'lerle aynı.
- Mac: artifact `~/Downloads` → `mv -f` → `md5 -q`. zsh'de inline `#` yorum yapıştırma.
