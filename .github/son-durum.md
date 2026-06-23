# AresPipe — Son Durum (Oturum 202 kapanış)

> Hedef: `.github/son-durum.md` · commit `[skip ci]`

## Tek cümle
KK (Kalite Kontrol) modülü: accordion → master-detail sağ drawer dönüşümü **tamamlandı + canlıda**; Davetiye listesi **PDF**'i (yatay A4, firma logosu otomatik) **eklendi + canlıda doğrulandı**.

## Bu oturumda biten (canlı)
- **KK sayfası render katmanı drawer'a geçti** (devreler.html `data-table` sistemi; satıra tıkla → sağ drawer). İş mantığına dokunulmadı.
- **KK Liste PDF** (`_kkListePdf`): yatay A4, yazdır-tabanlı (yeni pencere + `window.print()`), devreler.html `_tabelaPdf` konvansiyonu.
  - Üst: sol `window.aresFirmaLogo()` (ayardan, localStorage `ares_logo_firma`), sağ `window.aresLogoPrint()` (AresPipe).
  - 4 stat-pill (Tersane / Gemi-Proje / Kapsam / Toplam Ağırlık), devre özeti tablosu + TOPLAM, devre-başına spool tabloları (#·Marka·Rev·SpoolID·Çap·Et·Ağırlık·Malzeme·Kalite·Yüzey).
  - Footer: "Bu belge AresPipe tarafından üretilmiştir."
  - Erişim: (1) Davetiye Oluştur modalı **📄 PDF Önizle**, (2) açık/arşiv satırı **📄** (`kkDavetPdf`), (3) Belgeler popup **📄 Liste PDF Aç** (`belgeListePdf`).
- Canlı doğrulama: logo geldi, içerik doğru. Düzeltilen: üstte kesilme (body padding-top 84→112), devre başlığı drawer-stili zenginleştirildi (tersane chip + gemi + devre + zone + x/y spool · kg).

## Canlı `kalite_kontrol.html`
- md5: `fc7f469eaf43689808761bb7ab5f9e88`
- 12/12 Vercel endpoint korunuyor; tamamı client-side; pdfmake VENDOR'LANMADI (yazdır-tabanlı).

## Kilitli teknik kararlar (değişmedi)
- `kk_davetler.durum` ∈ {bekliyor, tamamlandi}; `kk_davet_spooller.sonuc` ∈ {gecti, hatali, tamir, bekliyor} (MK-200.1). UI: onay→gecti, ret→tamir.
- KK26 sayaç: `sayac_tanimlari` tip=kk, prefix=KK, yil_ekle=true, digits=3. İlk `sonraki_no()` öncesi sayaç satırı var olmalı.
- `spooller.aktif_basamak`: …→on_kontrol (havuz) → kk (davette) → sevkiyat. ET = `spooller.et_kalinligi_mm`.
- Tersane-tek guard: bir davet paketinde tek tersane.
- Logo mekanizması: DB/Storage'da firma logosu YOK; `ares-layout.js` localStorage `ares_logo_firma` + `ares_logo_ares`. PDF helper'ları (`aresFirmaLogo`/`aresLogoPrint`) buradan okur.

## Açık (sıradaki oturum)
- i18n: yeni `kk_pdf_*`, `kk_th_kalite/yuzey`, `kk_no_atanir`, `kk_belge_liste_pdf*`, `cmn_yazdir_pdf` anahtarları `tvv()` Türkçe fallback'iyle çalışıyor → `lang/{tr,en,ar}.json`'a eklenmeli.
- PDF kalıcılığı kararı: yazdır-tabanlı PDF Storage'a otomatik yazılamaz. Mevcut çözüm **on-demand yeniden üretim** (pakete bağlı, hep güncel). Donmuş snapshot dosyası isteniyorsa ayrı Storage-upload işi.
- Belgeler popup gerçek Storage bağı (galeri/not hâlâ taslak).
- spool_detay / devre_detay KK çapraz-linkleri.
- BUG: spool_detay'da `aktif_basamak='kk'` spool sevkte görünüyor.
