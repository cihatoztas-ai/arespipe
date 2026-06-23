# Kalite Kontrol (KK) Modülü — Tasarım Dosyası

> Hedef: `docs/kk-tasarim.md` · Güncel: Oturum 202
> Canlı `kalite_kontrol.html` md5: `fc7f469eaf43689808761bb7ab5f9e88`

## 1. Amaç ve akış
Ön kontrolü geçmiş spool'lar (`aktif_basamak='on_kontrol'`) bir **davet paketi**ne toplanır, tersaneye kalite kontrol daveti çıkılır, sonuç girilir, paket kapatılır.

Spool yaşam döngüsü: `… → on_kontrol (havuz) → kk (davette) → sevkiyat`.

## 2. Sayfa mimarisi — master-detail drawer
devreler.html `data-table` sistemiyle düz liste; satıra tıkla → **sağdan drawer**. (Accordion terk edildi — uzun listede ölçeklenmiyordu.)

Üç sekme:
- **Havuz**: `aktif_basamak='on_kontrol'` spool'lar. Satır/grup seç → alt sticky aksiyon bar → **Davetiye Oluştur**.
- **Açık Davetiyeler**: `kk_davetler.durum='bekliyor'`. Satır → drawer (devre alt-tabları + Sonuç Gir).
- **Arşiv**: `durum='tamamlandi'`.

Drawer: genişlik `min(860px,95vw)`; z-index global header üstünde (`.drawerbg`60 / `.drawer`61 / `.modbg`70 — modallar drawer üstünde).

Render fonksiyonları: `havuzRender`/`havuzDrawerAc`/`paketSatirlari`/`acikRender`/`arsivRender`/`paketDrawerAc`/`_altTablo`/`_drawerCiz`/`drawerKapat`/`_drawerYenile`.

## 3. Veri modeli
**`veriYukle` select zinciri** (`_spNorm`/`_davNorm` normalize eder):
```
kk_davetler(id,davet_no,durum,tarih,olusturma,kapanis_ts,pdf_yolu,tersane_id,
  tersaneler(ad,kisa_ad),
  kk_davet_spooller(id,spool_id,sonuc,not_,sonuc_ts,personel_id,foto_yolu,
    spooller(id,spool_id,spool_no,pipeline_no,rev,dis_cap_mm,et_kalinligi_mm,
      agirlik,malzeme,kalite,yuzey,devre_id,
      devreler(devre_no,ad,zone,projeler(proje_no,tersaneler(id,ad,kisa_ad))))))
```

Normalize spool objesi: `{id, spool_id, spool_no, pipeline_no, rev, dis_cap_mm, et_mm, agirlik, malzeme, kalite, yuzey, devre_id, _devre_no, _devre_ad, _zone, _proje_no, _tersane_id, _tersane}`. (ET = `et_kalinligi_mm`.)

`_devreToplam[devre_id]` = devrenin toplam spool sayısı (X/Y paydası).

## 4. Davetiye oluşturma
- `seciliSpoollar()` → `devreGrupla()` (devre bazlı gruplar).
- **Tersane-tek guard**: bir pakette tek tersane (`_tersaneSet`). Çoklu tersane → oluşturma engellenir.
- **KK26 sayaç**: `ARES.sonrakiNo('kk')` → `sayac_tanimlari` tip=kk, prefix=KK, yil_ekle=true, digits=3. Sayaç satırı ilk çağrı öncesi var olmalı.
- `davetiyeOnayla`: `kk_davetler` insert (durum='bekliyor') → `kk_davet_spooller` insert (sonuc='bekliyor') → `spooller.aktif_basamak='kk'` (yalnız `='on_kontrol'` olanları).

## 5. Sonuç girme
- Tüm spool'lar **varsayılan onay**; sorunlu spool'un tikini kaldır → RET (personel + foto + açıklama).
- DB CHECK (MK-200.1): `kk_davet_spooller.sonuc` ∈ {gecti, hatali, tamir, bekliyor}. **UI çevirisi**: onay→`gecti`, ret→`tamir`. Hata notu `not_` kolonu (MK-200.2).
- Paket kapanışı yalnız açık kullanıcı butonuyla (MK-126, auto-advance yok).

## 6. Liste PDF (yatay A4)
**Mekanizma:** yazdır-tabanlı (yeni pencere + `window.print()`), devreler.html `_tabelaPdf` konvansiyonu. pdfmake KULLANILMAZ. Print penceresi parent CSS'ine erişemez → renkli pill'ler inline-style (`_pdfMatChip`/`_pdfYuzChip`).

**Logo (ayardan otomatik):** sol `window.aresFirmaLogo(40)` (ares-layout.js, localStorage `ares_logo_firma`; fallback: tersane adı), sağ `window.aresLogoPrint(34)` (AresPipe; fallback: "AresPipe"). DB/Storage'da firma logosu YOK.

**Yapı:**
- `@page A4 landscape`, toolbar (`🖨 Yazdır/PDF` · `✕ Kapat`), sabit `.ph` başlık + `.pf` footer (her sayfada tekrar).
- Başlık: "KALİTE KONTROL LİSTESİ" · No (oluşturulunca atanır / gerçek davet_no) · tarih · (durum rozeti).
- 4 stat-pill: Tersane / Gemi-Proje / Kapsam (devre·spool) / Toplam Ağırlık. (border-left renkli, bg `#e9edf2`, border `#bcc5d0`.)
- Devre özeti tablosu: Gemi/Devre/Zone · Malzeme(pill) · Spool(x/y) · Ağırlık + TOPLAM.
- Devre-başına spool tabloları; her devre başlığı **drawer-stili kimlik**: `[tersane chip] gemi · devre · zone CF400 … x/y spool · kg`. Tablo kolonları: # · Marka(mavi) · Rev · Spool ID(mor #6b3fd4) · Çap · Et · Ağırlık · Malzeme(pill) · Kalite(mavi) · Yüzey(badge / —).
- Footer: "Bu belge AresPipe tarafından üretilmiştir."
- Ekran modunda body padding-top 112px (sabit başlık altında kesilmeyi önler); print modunda 60px.

**Renkler:** malzeme chip — karbon `#1760a8`/rgba(45,142,255,.10), paslanmaz `#6b21a8`/rgba(124,58,237,.10), bakır `#b45309`, alüm `#0f7a52`. Yüzey — galvaniz yeşil, asit mor, boyalı amber, siyah gri. Tersane chip — mor (`#6b21a8`).

**Fonksiyonlar:** `_kkListePdf(spoollar, opts)` motor; `opts={davetNo,tarih,durum}`. Wrapper'lar:
- `kkPdfOnizle()` — Davetiye Oluştur modalı **📄 PDF Önizle** (seçili spool, No placeholder).
- `kkDavetPdf(davetId)` — açık/arşiv liste satırı **📄** (gerçek davet_no/tarih/durum).
- `belgeListePdf()` — Belgeler popup **📄 Liste PDF Aç** (`_aktifBelgeDavet`).

**Kalıcılık:** yazdır-tabanlı olduğundan PDF Storage'a otomatik yazılmaz. Erişim **on-demand yeniden üretim**'le sağlanır (pakete bağlı, hep güncel) — arşivde de açılır. Donmuş snapshot isteniyorsa ayrı iş (bkz. SONRAKI-OTURUM).

## 7. i18n
Yeni anahtarlar `tvv()` TR fallback'iyle çalışıyor (kırılmaz). `lang/{tr,en,ar}.json`'a eklenecekler için bkz. CLAUDE-SONRAKI-OTURUM.md §2.

## 8. Kısıtlar
- 12/12 Vercel endpoint korunur — yeni `api/*.js` yok, client-side.
- pdfmake vendor'lanmadı.
- Tema yalnız programın CSS değişkenlerinden; print penceresinde sabit değerler (yeni pencere parent CSS göremez).
