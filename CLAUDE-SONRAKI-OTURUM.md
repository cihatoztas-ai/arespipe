# Sıradaki Oturum (214) — Ajanda

## 0. Açılış ritüeli
`git pull origin main` · `git status` · `git log --oneline -5` · `ls api/*.js | wc -l`
(≤12) · handoff oku. **Ek:** `docs/MOBIL-STRATEJI.md` + `docs/CLAUDE-MOBILE.md` §9.
Beklenen HEAD: 213 kapanış doc commit'i [skip ci] (+ bot ci). Öncesi **f314465**
(Sıra 11 son parça).

## 1. Durum (213 kapanışı — Sıra 11 ana gövde TAMAM)
Kök ekranlar (dashboard·işlemler·devreler·uygulamalar) tek `MLayout` + yüzen 4-slot
alt bar. Detay ekranlar (spool detay, profil, İş Başlat) → sol-üst geri, bar yok.
Devre detay → nötr bar + geri. Spool detay ölü alan giderildi (her iki mod 100dvh).
MQRTara bilinçli MLayout dışında. api/*.js=12. **Cihat notu:** estetik beğenilmedi,
fonksiyonel yeterli — cila öncelikli.

## 2. EN ÖNCELİKLİ — Estetik cila (Cihat: "çok beğenmedim ama fonksiyonel yeterli")
Yeni bir şey KIRMADAN görünümü zarifleştir. Adaylar:
- **Geri tuşu:** MLayout `geri` slotunun görünümü (şu an sade 40x40 şeffaf chevron,
  sol-üst). WhatsApp zarafetine yaklaştır — dokunma alanı, hizalama, opsiyonel hafif
  daire zemin.
- **Geri-başlık topbar** (İş Başlat): sol geri + orta başlık + sağ boş → sağ boşluk
  dengesiz duruyor olabilir. Denge/başlık tipografisi gözden geçir.
- **IbSpoolDetay ustBant:** geri tuşu spool adıyla aynı satıra sıkışmış (cramped).
  Hiza + boşluk (geri | spool adı) düzelt. Zengin header (geri + ad + pill'ler +
  sekmeler) bir bütün olarak WhatsApp-vari sadeleştirilebilir.
- **R-10:** Görsel değişiklik → önce mockup, Cihat onayı, sonra kod.

## 3. Topbar birleştirme (tek kaynak) + ÇİFT AVATAR temizliği
- Kök ekranların topbar'ı hâlâ EKRAN-BAŞINA inline (logo+başlık+avatar). Ortak bir
  `MTopBar` (yeni/iyileştirilmiş) ile MLayout'a alınabilir → tek dosyadan yönetim.
- **ÇİFT AVATAR:** kök ekranlarda hem topbar sağ-üst avatarı hem alt bar Menü avatarı
  drawer açıyor (redundant). Biri kaldırılmalı. Muhtemel karar: topbar avatarını
  kaldır (Menü bar'da), topbar'da sadece logo+başlık kalsın. Cihat'a A/B sor.
- **Eski `MTopBar.jsx`** (fixed, artık kullanılmıyor) → `_arsiv/`'e taşı.

## 4. Sonra
- **Açık-iş rozeti** (Cihat parkinglot): operatör İş Başlat kartlarında WhatsApp'vari
  "+1" (açık işi olan işlem türünde). Altyapı HAZIR: `aktifIsleriDBdenSenkronize`
  (login sonrası `is_kayitlari` bitis IS NULL → localStorage `ares_is_aktif`), 70b.B
  planı. Eksik = UI: IbRolSec kart render'ına bağla. Önce `IbRolSec.jsx` + `lib/isbaslat`
  oku (ares_is_aktif işlem-türü bazında ne tutuyor).
- **Sıra 8 — Kayıt/davet akışı (EN BÜYÜK):** §7 kilitli (OTP+upsert davet,
  rol='uygulama'+ortak tenant, çoklu rol serbest). Kod+DB birlikte.
- **Sıra 7 — MMusteri (web-first):** DB önkoşulu 2. yarısı `customer_project_access`
  (113 migration) + web olgunlaşınca mobile'a adapte.

## 5. Devreden (küçük)
- Ölü keyframe `mDvrFadeIn` (MDevreler) temizliği.
- Üyelik paketi abonelik bağı (MProfil statik "Kurumsal").
- `color-mix` alt bar şeffaflığı cihazda görsel teyit (iOS 16.2+).
- İş Başlat rolSec `geri`=navigate(-1): operatör doğrudan girişte nereye döneceği
  kontrol edilsin (dashboard/işlemler).

## Mimari notlar (MLayout kullanımı — 214'te lazım)
- **Kök ekran:** `<MLayout topbar={...} altBar altBarAktif="..." kullanici
  onMenuClick drawerAcik onDrawerKapat>` — geri YOK.
- **Basit detay ekran:** `<MLayout geri={fn} baslik="...">` — bar YOK, geri VAR.
- **Sabit çubuk + kayan liste ekran (MDevreler/MDevreDetay):** `icerikKaydir={false}`
  + ekran kendi iç scroll'u; liste paddingBottom bar boşluğu.
- **Zengin header ekran (IbSpoolDetay):** MLayout dışı, kendi 100dvh scroller'ı +
  ustBant içinde geri. Bar yok.
- **Tam ekran (MQRTara):** MLayout YOK, kendi absolute layout'u.

## Disiplin (özet)
Native React. R-10 mockup-first (özellikle estetik cila) · R-08 i18n · DATA→UI→kod
(MK-158.1) · önce mevcut kalıbı oku (MK-126.8) · kolon/tablo information_schema
teyidi (MK-85.3) · migration BEGIN/ROLLBACK dry-run → information_schema → COMMIT
(MK-200.5). ≤12 api (MK-129.3). **Kod commit [skip ci] YOK; canlı test = PUSH; push
öncesi pull --rebase.** Patch akışı: Python anchor + .bak + ABORT-on-mismatch +
MARKER-idempotency + esbuild (mobile/node_modules içi transformSync) + container test →
kanıtlanmış script/dosya + MD5. Büyük/karmaşık dosyayı düzenlerken tam kodu al
(paste/upload) — tahminle dokunma.
