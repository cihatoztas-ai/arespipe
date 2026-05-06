# AresPipe — Son Durum (64. oturum sonu)

> 6 Mayıs 2026 — 64. oturum kapanışı

---

## CI Son Durum

- **Build:** ✅ YEŞİL (en son `b077cff` fix(64) yetki_bloklari tip kolonu kaldirildi)
- **Vercel mob:** ✅ Production = `b077cff` (Ready)
- **Vercel web:** ✅ Production
- **Lint:** Faz B baseline'ı korundu

## Son Commit Zinciri (64. oturum)

```
b077cff fix(64): yetki_bloklari sorgusunda olmayan 'tip' kolonu kaldirildi
00817de fix(64): MIsBaslat kullanici sorgusu - auth_id yerine id kolonu
3754916 docs: AUTO bölümleri güncellendi [skip ci]
d0d134d chore(ci): ci-son-rapor.json güncelle [skip ci]
8078600 feat(64): MIsBaslat Ekran 1 + MTopBar/MBottomNav ortak komponentler
1b2c1f4 (63 son commit — b139a60'dan sonra otomatik [skip ci])
```

Net: 64. oturumda 1 ana feat + 2 canlı fix commit + GitHub Actions otomatik CI raporları.

## Bu Oturumda Yapılanlar

### Ekran 1 — Rol Seç (MK-64, R-10 mockup-first, 6 iterasyon onaylı)

1. **mobile/src/screens/MIsBaslat.jsx** — Hub komponent (state + ekran router, ~200 satır). Sadece Ekran 1 (rolSec) implement, diğer 9 ekran placeholder bırakıldı.
2. **mobile/src/components/isbaslat/IbRolSec.jsx** — Ekran 1: atanmış işlem bloklarını liste olarak gösterir (sol renk şeridi + ikon + ad, tek satır, ok yok), seçili kart highlighted, "yetki yok" durumu için 🔒 ekranı.
3. **mobile/src/components/MTopBar.jsx** — Paylaşılan üst bar (AP logo + dinamik başlık + avatar). 64'ten itibaren iş_baslat ekranlarında ortak.
4. **mobile/src/components/MBottomNav.jsx** — Paylaşılan alt nav (Ana Sayfa · Ara · QR FAB · Bildirim · Menü). FAB pasif/aktif geçişi, bildirim badge desteği.
5. **mobile/src/lib/isbaslat.js** — DB helper (`islemBloklariniGetir`) + localStorage rol hatırlama (`ares_is_aktif_rol`) + blok ikon/renk haritalama.
6. **mobile/src/App.jsx** — `/is-baslat` route eklendi (operatör/yönetici farkı yok, doğrudan girilebiliyor).
7. **mobile/public/ares-mobile.css** — Vanilla CSS class'ları React tarafa bağlandı. Önceden React tamamen inline style kullanıyordu, m-card-item/m-bottomnav class'ları tanımsızdı; 64'te çözüldü, sonraki React komponentleri bu class'ları kullanabilir.
8. **mobile/index.html** — `<link rel="stylesheet" href="/ares-mobile.css" />` eklendi.
9. **lang/{tr,en,ar}.json** — 1800 → 1816 anahtar (+16: m_app_baslik, m_profil, m_yukleniyor, mob_geri, mob_nav_anasayfa/ara/bildirim/menu, m_ib_baslik, m_ib_ne_yapacaksiniz, m_ib_yetki_yok, m_ib_yetki_yok_aciklama, m_ib_qr_tara, m_ib_rol_sec_uyari, m_ib_qr_yapim_asamasinda_baslik, m_ib_qr_yapim_asamasinda).

### R-10 Mockup-first süreci (6 iterasyon)

- v1: yönetici + operatör 2 phone karşılaştırması
- v2: tek phone, sayfa formatı diğer mobil ekranlarla hizalı (top bar + bottom nav)
- v3: kart formatı sadeleştirildi — sol şerit + ikon + ad, alt yazı YOK, ok YOK (MIslemler.jsx pattern'iyle aynı)
- v4: tek yetki otomatik geçişi KALDIRILDI — herkes karta tıklayacak (UX tutarlılığı)
- v5: localStorage rol hatırlama, FAB pasif başlangıç, rol seçilince aktif
- v6: drawer trigger düzeni A — avatar (üst sağ) + Menü (bottom nav 5. sekme), top bar hamburger YOK

### 3 canlı bug fix (test sırasında çıkan)

- `kullanicilar.auth_id` yok → `id` kullan (MK-64.4)
- `yetki_bloklari.tip` yok → SELECT'ten çıkar (MK-64.5)
- MDrawer prop API: `{ acik, kapat }` (conditional render değil, her zaman mount)

### Test sonuçları (lokalhost:5173/is-baslat — kullanıcı doğruladı)

- ✅ Top bar (AP + İş Başlat + AD avatarı)
- ✅ Kartlar (Büküm/İmalat/Argon Kaynağı/Kesim/Markalama) sol renk şeritleri + ikonlar + tek satır
- ✅ Bottom nav 5 sekme + QR FAB ortada
- ✅ Kart seç → highlighted + FAB pasif→aktif
- ✅ QR butonu → "QR ekranı sonraki turda" placeholder
- ✅ Avatar/Menü → MDrawer (sağdan)
- ✅ localStorage rol hatırlama (sayfa yenileyince seçili kalır)
- ✅ Operatör bloğu yoksa "İşlem yetkiniz bulunmuyor" + 🔒
- 🟡 Canlı prod test (arespipe-mob.vercel.app/is-baslat) — kullanıcı kapanışta yapacak

## Lang Anahtar Sayıları

- TR/EN/AR: **1816** (önceki: 1800, +16)
- 3 dilde set eşitliği ✓

## Açık Borçlar (öncelik sırası)

### 65. oturum birincil işi

- **Ekran 2 — QR Tarama** (R-10 mockup-first protokolü):
  - Kamera erişimi (BarcodeDetector API + jsQR fallback)
  - Manuel ID girişi (kamera reddedilirse veya QR yoksa)
  - "Spool bulunamadı" akışı
  - "Geçersiz QR formatı" akışı (vanilla qr.html'deki `KOD-NUMARA:UUID` formatı esas)
  - "Kullanıcı vazgeçti / Geri" akışı
  - Cross-tenant uyarısı (63'ten devir, payload tenant kodu farklıysa)
  - `is_durumu === 'devam_ediyor'` mükerrer iş uyarısı (63'ten devir)

### MIsBaslat — küçük borçlar (mockup'sız direkt yapılabilir)

- **Kart başlıkları büyük harf + biraz daha büyük** (kullanıcı son test sonrası istedi) — IbRolSec.jsx içinde `.m-card-title` override: `text-transform: uppercase` + `fontSize: 18-20px`. 5 dakikalık iş.
- **mToast eşdeğeri React komponenti** — şu an MIsBaslat.jsx'te `alert()` kullanılıyor (geçici). Sonraki turların birinde MToast.jsx yazılır.
- **Operatör router'ı** — MAnasayfa.jsx hâlâ operatörü `/islemler`'e yönlendiriyor. Ekran 2+ tamamlandığında MAnasayfa.jsx'i `/is-baslat`'a yönlendirmek veya MIslemler'e "İş Başlat" butonu eklemek gerek.

### MIsBaslat — Ekran 3-10 (sırayla, R-10 ile)

- IbSpoolDetay (Ekran 3)
- IbUyari (Ekran 4)
- IbNotEkle (Ekran 5)
- IbFotoKapat (Ekran 6)
- IbBasamakSec (Ekran 7)
- IbTamam (Ekran 8)
- IbSonFoto (Ekran 9 — on_kontrol akışı)
- IbSfTamam (Ekran 10 — son foto onay)

### Mobile genel (önceki oturumlardan devir)

- **MK-58.1** alıştırma enum lowercase migration — kod uppercase 'VAR'/'KISMI'/'YOK' okuyor. MDevreler + MIsBaslat dönüşümünden sonra tek seferde geçiş.
- **MK-62.3** README.md mobile/src/lang/ predev silme problemi — predev script (`rm -rf src/lang && ...`) README'yi siliyor; predev'e README üretme satırı eklenmeli.
- **MK-58.5** Panel.html mobile preview UUID input.

### Web genel

- 5 MK adayı vizyon konsolidasyonu (65-70 oturumlar arası)
- EN/AR dil dosyalarında 348/319 anahtar hâlâ Türkçe (legacy çeviri eksikliği)

## 64. Oturumda Çıkan Yeni Disiplin Notları

- **MK-64.1: claude.ai chat arayüzü URL auto-link sorunu.** Kullanıcı yapıştırdığı terminal çıktısındaki nokta-ayrımlı identifier'ları (örn. `sd.session.user.id`) otomatik markdown linke çeviriyor: `[sd.session.user.id](http://sd.session.user.id)`. Sed/Python heredoc komutları içinde böyle identifier varsa terminal yapıştırmasında bozulma olabiliyor. **ÇÖZÜM:** kod düzenleme için terminal yapıştırması yerine doğrudan editör (VS Code/TextEdit, Smart Quotes/Dashes kapalı) kullanılmalı. Bu oturumda 3 kez yaşandı (MIsBaslat.jsx 64. satır, isbaslat.js 101. satır), her seferinde ek tur attırdı.

- **MK-64.2: Mobile React + ares-mobile.css bağlama.** Mobile React projesi vanilla CSS class'larını otomatik almıyor. Önceki React komponentleri (MIslemler, MAnasayfa, MAnasayfaYonetici) tamamen inline-style kullandığı için ihtiyaç oluşmamıştı. 64'te m-card-item/m-bottomnav/m-topbar class'ları gerektiğinde `mobile/public/ares-mobile.css` + `mobile/index.html` `<link>` ile bağlandı. **Sonraki oturumlarda yeni komponent yazarken** bu class'lar kullanılabilir, ek import gerekmez.

- **MK-64.3: Lang master = root `lang/`.** Mobile React build-time'da `prebuild` script (`rm -rf src/lang && mkdir -p src/lang && cp ../lang/*.json src/lang/`) ile senkronize ediyor. **Doğrudan `mobile/src/lang/`'a yapılan değişiklikler bir sonraki build'te override olur** — git status'ta da görünmez. Lang anahtarı eklerken her zaman ROOT `lang/` düzenlenir.

- **MK-64.4: kullanicilar tablosunda `auth_id` kolonu YOK.** `id` zaten `auth.users.id` ile aynı UUID. Doğru pattern: `.eq('id', session.user.id)` (MAnasayfa.jsx ve App.jsx ile aynı). 64'te `auth_id` kullanıldı, canlı testte 400 hatasıyla yakalandı.

- **MK-64.5: yetki_bloklari tablosunda `tip` kolonu YOK.** SELECT'te `yetki_bloklari(id, ad, renk)` doğru, `tip` ekleme 400 dönüyor. Vanilla'daki `is_islem_blogu_mu()` fonksiyonu blok adına göre çalışıyor (DB'de tip kolonu değil, kod tarafında ISLEM_BLOK_ADLARI listesi).

## Önemli Sayılar

- **Toplam MK:** 64 oturum
- **Mobile ekran sayısı:** 8 tam ekran + 1 hub kısmen tamamlandı (MGiris, MAnasayfa/Yonetici, MIslemler, MDrawer, MSpoolDetay, MDevreDetay, MDevreler, MQRTara, **MIsBaslat-Ekran1** + MTopBar/MBottomNav ortak komponentler)
- **Lang anahtar:** 1816 (TR/EN/AR senkron)
- **HEAD:** `b077cff`

---

> 65. oturum açılışında bu dosya okunacak. İlk gündem: Ekran 2 (QR Tarama) için R-10 mockup turu — vanilla qr.html ve mevcut MQRTara.jsx 63'te yazıldı; MIsBaslat içindeki Ekran 2 ondan farklı olarak iş başlatma akışına özgü olacak (operatör için spool detay yerine doğrudan uyarı/işlem akışına yönlendirme).
