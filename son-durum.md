# AresPipe — Son Durum (Oturum 213 kapanışı)

## Bu oturum: Sıra 11 — Mobil layout standardizasyonu (ana gövde tamamlandı)
Tüm kök ekranlar tek ortak `MLayout` iskeletine geçirildi; yüzen (floating) 4-slot
alt bar baştan yazılıp kök ekranlara yayıldı; spool detay ölü alan giderildi; detay
ekranlarına standart geri tuşu kuralı getirildi. **Ana ilke (Cihat, devam):** "Baştan
doğru düzgün, yarım kalmasın." Estetik cila sonraki oturuma bırakıldı (Cihat: "çok
beğenmedim ama fonksiyonel yeterli").

## Yapılanlar

### 1. MLayout — ortak iskelet (YENİ, `mobile/src/components/MLayout.jsx`)
Tek kaynak 100dvh flex kolon iskelet. Prop'lar:
- `topbar` (slot) — ekran kendi topbar'ını verir; MLayout sahiplenmez.
- `geri` (fn) + `baslik` — verilirse standart sol-üst geri-başlık topbar'ı kurar.
  Verilmezse geri tuşu HİÇ gösterilmez (kural: gidecek yer yoksa yok). topbar slot
  verilirse o öncelikli.
- `icerikKaydir` (bool, default true) — true: çocuklar flex:1 scroll alanına sarılır.
  false: ekran kendi iç scroll'unu yönetir (sabit çubuk + kayan liste ekranları).
- `altBar` + `altBarAktif` + `kullanici` + `onMenuClick` — yüzen alt bar overlay.
- `onDrawerKapat` verilirse MDrawer mount edilir.
- Eski `.m-topbar` (position:fixed) + `.m-page` padding hilesi KULLANILMAZ (ölü alanın
  kaynağıydı) — flex iskelet.

### 2. MBottomNav — yüzen alt bar (BAŞTAN YAZILDI)
WhatsApp dili: yüzen pill, blur + `color-mix` yarı-şeffaf zemin (arka içerik seçilir),
aktif sekmede accent kabartma. **4 sabit slot:** Ana Sayfa · Devreler · Uygulamalar ·
Menü(avatar). Eski 5-slot + ortadaki QR FAB KALDIRILDI (QR artık İş Başlat akışı
içinde; operatör kartına dokununca QR açılıyor + MIslemler'de ayrı QR butonu var).
Overlay (absolute) → yer kaplamaz, içerik altından akar.

### 3. Kök ekranlar → MLayout + yüzen alt bar
- **MAnasayfaYonetici** (dashboard) — altBar aktif="anasayfa".
- **MIslemler** (operatör ana ekranı) — altBar aktif="anasayfa".
- **MUygulamalar** — altBar aktif="uygulamalar".
- **MDevreler** — altBar aktif="devreler", `icerikKaydir=false` (sabit arama/filtre/
  stat çubuğu korunur, sadece liste kayar). Eski geri+hamburger topbar → standart
  logo+başlık+avatar; geri butonu KALKTI (destination). Kendi MDrawer'ı MLayout'a
  devredildi. Bar avatarı için hafif kullanıcı fetch'i eklendi. Liste paddingBottom
  bar boşluğu için ayarlandı.

### 4. Detay ekranlar → standart geri, bar YOK
- **MDevreDetay** — MLayout `icerikKaydir=false`, **nötr alt bar** (altBarAktif=null —
  hiçbir sekme parlamaz; devre detay bir alt-sayfa) + geri sol üstte (mdv-topbar
  içinde sticky). 3 return (yükleniyor/bulunamadı/ana) yerel `Kabuk` bileşeniyle
  MLayout'a sarıldı. `.mdv-root` height:100dvh → flex:1/min-height:0. Liste alt boşluk.
  Not: Kararla nötr bar VAR (kök değil ama geçiş kolaylığı için Cihat bar istedi).
- **MProfil** — MLayout + geri sol üst, bar YOK (drawer'dan açılan alt-sayfa).
- **IbSpoolDetay (spool detay)** — HER İKİ MOD (operatör + denetim) tam ekran (100dvh);
  sabit `calc(100dvh - 56px - 80px)` KALKTI → ölü alan riski sıfır. ustBant'a standart
  sol-üst geri tuşu (operatör: onGeri→rolSec; denetim: navigate(-1)). Bar YOK — altta
  aksiyon footer'ı var (İşe Başla/İşi Kapat/Devreye Dön), çakışırdı. (WhatsApp da
  sohbet içinde bar gizler.)

### 5. MIsBaslat → MLayout'a alındı
Eski `MTopBar` + `.m-page` padding + doğrudan `MBottomNav` (stale QR prop'larıyla) +
drawer TEMİZLENDİ. `qraGec` kaldırıldı. rolSec (işlem kartları) → MLayout `geri`
(navigate(-1)) + başlık "İş Başlat", **bar YOK** (detay/aksiyon ekranı). QR ve
spoolDetay → tam-ekran early-return (self-contained).

### 6. MQRTara — bilinçli DOKUNULMADI
Tam ekran siyah kamera görünümü, kendi absolute video/overlay + sol-üst geri. MLayout'a
zorlamak layout'unu bozardı. Olduğu gibi bırakıldı (geri zaten standart konumda).

## Kararlar (bu oturum)
- **Alt bar sadece kök ekranlarda** (hedefe atlama). Detay ekranlar → sol-üst geri.
- **Geri tuşu kuralı:** gidecek yer varsa göster, yoksa gösterme. Tek kaynak (MLayout
  `geri` slotu). İstisna: IbSpoolDetay kendi zengin header'ında (ustBant) geri taşıyor
  (aynı görünüm) — çünkü standart geri-başlık topbar'ı üstüne binerdi.
- **Alt bar 4 sabit slot şimdilik**; ortaya büyük AI butonu SONRA (kullanıma göre).
- **QR bara girmez** — İş Başlat akışı içinden erişiliyor.
- **color-mix şeffaflık** (iOS Safari 16.2+); cihazda görsel teyit bekliyor.

## Açık debt (214+)
- **[ÖNCELİK — Cihat notu] Estetik cila:** geri tuşu + geri-başlık topbar + IbSpoolDetay
  ustBant hizası zarifleştirilecek. "Fonksiyonel yeterli ama beğenmedim."
- **Topbar birleştirme:** kök ekranların logo+başlık+avatar topbar'ı hâlâ ekran-başına
  inline. Tek kaynağa (ortak topbar) alınabilir. Ayrıca kök ekranlarda ÇİFT avatar var
  (topbar avatarı + bar Menü avatarı) — biri kaldırılmalı.
- **Eski `MTopBar.jsx`** artık kullanılmıyor → `_arsiv/`'e taşınabilir (temizlik).
- **MQRTara** bilinçli MLayout dışında — tam ekran kalır (dokunma).
- **Açık-iş rozeti** (operatör İş Başlat kartlarında +1): altyapı hazır
  (`aktifIsleriDBdenSenkronize` + `ares_is_aktif`, 70b.B planı), IbRolSec kart
  render'ına bağlanacak. Cihat bu oturumda parkinglot'a aldı.
- **Sıra 7 (MMusteri):** web-first, ertelendi. DB önkoşulunun 2. yarısı
  `customer_project_access` (113 migration) HENÜZ YOK.
- **Sıra 8 (kayıt/davet):** EN BÜYÜK kalan iş. §7 kilitli.
- Ölü keyframe `mDvrFadeIn` (MDevreler) temizliği — küçük.
- Üyelik paketi abonelik bağı (MProfil statik "Kurumsal").

## CI / push
- HEAD: **f314465** (Sıra 11 son koordineli parça: MLayout geri slotu + IbSpoolDetay
  tam ekran/geri + MIsBaslat MLayout). api/*.js=12 (yeni endpoint YOK — tavan korundu).
- Bu oturum push zinciri (özet): MLayout+MUygulamalar → MAnasayfaYonetici → yüzen bar
  (MBottomNav yeniden + kök ekranlar) → MIslemler → spool ölü alan fix (f33ab35) →
  MDevreler → MDevreDetay → MProfil → son parça (f314465).
- Kod commit'leri [skip ci] YOK; bu kapanış doc'ları [skip ci] VAR. Push öncesi
  pull --rebase (bot ci çakışmasız).

## Sonraki oturum (214) — detay CLAUDE-SONRAKI-OTURUM.md
- **Öncelik: Estetik cila** (geri/topbar/spool header) + **topbar birleştirme** (çift
  avatar + tek kaynak). Sonra: açık-iş rozeti, MTopBar arşiv, Sıra 8.
