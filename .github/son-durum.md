# AresPipe — Son Durum (65. oturum sonu)

> 6 Mayıs 2026 — 65. oturum kapanışı

---

## CI Son Durum

- **Build:** ✅ YEŞİL (push sonrası beklenen)
- **Vercel mob:** beklenir (push sonrası deploy)
- **Vercel web:** etkilenmedi (sadece mobile değişiklikler)
- **Lint:** Faz B baseline'ı korundu

## Son Commit Zinciri (65. oturum)

```
feat(65): m_ib_qr_* — 18 anahtar 3 dil (1816 → 1834)
feat(65): MIsBaslat hub'a IbQRTara entegre + kart→QR shortcut + Ekran 3/4 placeholder
feat(65): IbQRTara — Ekran 2 (QR Tara) — MQRTara'dan adapte
feat(65): IbRolSec — v3.2 palette + uppercase 16px başlık (MK-65)
feat(65): isbaslat.js — v3.2 palette + blokRenkHex + aktifBasamakRolaUyumlu helper
01d273f docs(64): son-durum.md - 64. oturum kapanis brifingi
```

Net: 65. oturumda 5 ana feat commit + lokal test sonrası push.

## Bu Oturumda Yapılanlar

### Ekran 2 — QR Tarama (MK-65, R-10 mockup-first, 6 iterasyon onaylı)

1. **mobile/src/components/isbaslat/IbQRTara.jsx** — Yeni dosya (~930 satır). MQRTara.jsx (63. oturum)'dan adapte: kamera (BarcodeDetector + jsQR fallback), tam ekran video, beyaz çerçeve + mavi scan, manuel modal (tenant prefix + sadece numara), 4 durum (tarama/arama/bulundu/hata), kameraYok fallback, body scroll lock, ESC, autofocus, vibrate, taramayiTekrarBaslat döngüsü.
2. **MQRTara'dan farklar (kod yorumlarında):**
   - `navigate()` yok — props callback (`onGeri`, `onSpoolBulundu`, `onCrossTenant`)
   - Üst ortada **rol chip** (aktifRol.ad uppercase + aktifRol.renk dot + glow + dinamik border)
   - Cross-tenant erken algılama (DB sorgusu öncesi payload prefix kontrolü)
   - Manuel modal CTA: "Spool'u Bul →" → "İşlem Başlat →"
   - i18n prefix: m_qr_* → m_ib_qr_*
   - Manuel girişte **6-haneli padStart** (`'575' → '000575'`, DB'deki `A-000575` formatıyla eşleş)
3. **mobile/src/screens/MIsBaslat.jsx** — Hub güncellendi: `aktifEkran === 'qr'` artık IbQRTara render eder (MTopBar/MBottomNav gizlenir, fullscreen kameralı). **Kart tıklama → direkt QR shortcut** (rolSec içinde setAktifEkran('qr')). Ekran 3 (spoolDetay) ve Ekran 4 (uyari) **placeholder** — JSON dump akış kanıtı için.
4. **mobile/src/lib/isbaslat.js** — Eklenenler:
   - `BLOK_RENK_HEX` haritası (v3.2 palette: turkuaz/indigo/turuncu/pembe/mor)
   - `blokRenkHex(blokAd)` helper
   - `hexToRgba(hex, alpha)` export edildi (IbRolSec ve IbQRTara kullanıyor)
   - `aktifBasamakRolaUyumlu(blokAd, aktifBasamak)` — yumuşak rol kontrolü helper'ı (bilinmeyen aşama → true)
   - `islemBloklariniGetir` döndüğü object'e `renkHex` field'ı eklendi
   - `rolKaydet/rolHatirla` artık sadece `id + ad` saklıyor (renk runtime'da)
5. **mobile/src/components/isbaslat/IbRolSec.jsx** — Güncellendi:
   - `cl-X` CSS preset class kaldırıldı, `borderLeft: 4px solid renkHex` inline + ikon arka planı `hexToRgba(renkHex, 0.14)` inline
   - Kart başlığı: uppercase + 16px + letter-spacing 0.8 + weight 700 (Ekran 2 chip ile tutarlı, 64'teki küçük borç kapatıldı)
6. **lang/{tr,en,ar}.json** — 1816 → 1834 (+18: m_ib_qr_baslik, m_ib_qr_alt_yazi, m_ib_qr_manuel, m_ib_qr_modal_baslik, m_ib_qr_btn_islem_baslat, m_ib_qr_iptal, m_ib_qr_durum_baslangic, m_ib_qr_araniyor, m_ib_qr_bulundu, m_ib_qr_bulunamadi, m_ib_qr_baglanti_hatasi, m_ib_qr_cross_tenant, m_ib_qr_kamera_yok_baslik, m_ib_qr_kamera_yok_yazi, m_ib_qr_hint_sadece_numara, m_ib_qr_hint_tam_id, m_ib_qr_geri, m_ib_qr_kapat).

### R-10 Mockup-first süreci (6 iterasyon)

- v1: kart-içi viewfinder + AresPipe dark theme — yanlış yön (FAB+nav görünüyordu)
- v2: MQRTara stiline geçiş — fullscreen kamera, beyaz çerçeve, mavi scan, gradient topbar/altinfo
- v3: 7 karar uygulandı — geri navigate(-1), MQRTara mini-bar, **(b) rol chip eklendi**, "İşlem Başlat" CTA, "Spool ID Gir" başlık, prefix gösterim, çerçeve rengi beyaz korundu
- v3.1: Chip yazısı `Büküm` → `BÜKÜM` (uppercase + 14px + letter-spacing 1.2 + dot glow)
- v3.2: Renk paletesi yeniden düzenlendi (5 blok × 4 durum çakışması çözüldü) — Büküm turkuaz / İmalat indigo / Argon turuncu / Kesim pembe / Markalama mor
- v3.3: Gerçek prod görüntüsüyle hizalama — çerçeve 230→220, chip bottom 160→110, gradient topbar/altinfo geri eklendi

### Test sırasında çıkan 4 küçük fix

- **MK-65.1: Lang merge yolu.** İlk önerdiğim `python3 -c` komutu `/mnt/user-data/outputs/` path'i kullanıcının Mac'inde çalışmıyor. **Düzeltme:** `os.path.expanduser('~/Downloads')` kullanılmalı. Kullanıcının Claude'dan aldığı dosyalar Mac'te `~/Downloads/` altına iner; lang merge script'i bu path'ten okumalı.
- **MK-65.2: Manuel giriş 6-hane padding.** İlk versiyonda `tenantKod + '-' + manuelDeger.trim()` kullanıldı, ama 8. oturum kararı (sayaç digits=6) sonrası DB'deki spool_id'ler `A-000575` formatında. Kullanıcı `575` yazınca `A-575` arıyor, bulamıyor. **Düzeltme:** `padStart(6, '0')` eklendi. QR ile gelen payload zaten dolu olduğu için etkilenmedi.
- **MK-65.3: Hub kontrolü 65 için yumuşatıldı.** `is_durumu === 'devam_ediyor'` ve `aktif_basamak` rol uyumsuzluğu kontrolleri MIsBaslat'ta vardı, ama gerçek aşama değerleri (`on_imalat`, `alim_kontrol`, vs.) brifing'te yoktu, kontrolüm tahminliydi. Operatörün her DB sorgusunda Ekran 4'e düşmesi yanlış. **Karar:** Tüm kontroller 66. oturuma (Ekran 4 mockup turu) ertelendi. Şu an spool varsa direkt Ekran 3 placeholder. `aktifBasamakRolaUyumlu` helper'ı hâlâ isbaslat.js'te export ediliyor — 66'da kullanılır.
- **MK-65.4: Rol chip görünürlüğü.** İlk versiyon `rgba(255,255,255,0.13)` arka plan + `1px rgba(255,255,255,0.3)` border ile transparan görünüyordu, kameralı arka planda zorla okunuyordu. **Düzeltme:** Durum chip ile aynı koyu opak arka plan (`rgba(13,18,28,0.9)`) + `2px solid {rolRenk}` dinamik border + box shadow. Rol chip ile durum chip artık aynı görsel dilde.

### Test sonuçları (lokalhost:5174/is-baslat — kullanıcı doğruladı)

- ✅ Ekran 1 — kartlar uppercase + 16px + v3.2 palette (turkuaz/indigo/turuncu/pembe/mor)
- ✅ Kart tıklama → kameralı QR ekran (kısa yol, FAB beklemeden)
- ✅ Rol chip net görünüyor (KESİM pembe border + dot glow)
- ✅ Beyaz çerçeve + mavi scan animasyonu
- ✅ Manuel giriş bottom-sheet — `A-` prefix + 6-haneli padding (575 → A-000575)
- ✅ Spool DB'den geldi (örnek: A-000575)
- ✅ Hub kontrolü yumuşatılmış: spool varsa direkt Ekran 3 placeholder
- ✅ Ekran 3 placeholder JSON dump (📦 Spool Detay + Geri butonu)
- ✅ Geri butonu → Ekran 1'e dönüş (hub state geçişi, navigate(-1) değil)
- 🟡 Canlı prod test (arespipe-mob.vercel.app/is-baslat) — push sonrası kullanıcı yapacak

## Lang Anahtar Sayıları

- TR/EN/AR: **1834** (önceki: 1816, +18)
- 3 dilde set eşitliği ✓

## Açık Borçlar (öncelik sırası)

### 66. oturum birincil işi

- **Ekran 3 — IbSpoolDetay** (R-10 mockup-first protokolü):
  - Spool detay sayfa — pipeline_no, spool_no, marka (tam E-04 formatı), malzeme, kalite, ölçüler
  - Basamak ilerleme görselleştirme (basamak_snapshot dizisi)
  - 3D model (eğer spool_detay_html'deki Three.js port edilirse)
  - **mobile normalize.js portu** — `markaId()` (6→4 hane kırpma display), `marka()` (E-04 helper), `revFmt()`, `malzemeEtiket()` vb.
  - "İşlemi Başlat" CTA → basamak_snapshot'a göre sonraki ekrana yönlendir
  - "Vazgeç" → hub state 'rolSec' (Ekran 1)

### 66. oturum ikincil işi

- **Ekran 4 — IbUyari** (mockup turu — Ekran 3 ile birlikte tasarlanır):
  - Cross-tenant kırmızı ekranı (DB sorgusu öncesi erken yakalama, IbQRTara'da hazır)
  - `is_durumu === 'devam_ediyor'` sarı ekranı (devral/iptal seçimi)
  - Rol uyumsuzluğu kırmızı ekranı (`aktif_basamak` ile rol haritası eşleşmiyorsa)
  - **Önemli karar noktası:** Rol uyumsuzluğu hangi durumlarda kırmızı (sert blok) hangilerinde sarı (uyarı + devam ediyor) olacak? İş akışı haritası 66 başında netleştirilecek.

### MIsBaslat — küçük borçlar (mockup'sız direkt yapılabilir)

- **mToast eşdeğeri React komponenti** — şu an MIsBaslat.jsx'te `alert()` kullanılıyor (geçici). Sonraki turların birinde MToast.jsx yazılır.
- **Operatör router'ı** — MAnasayfa.jsx hâlâ operatörü `/islemler`'e yönlendiriyor. Ekran 2+ tamamlandığında MAnasayfa.jsx'i `/is-baslat`'a yönlendirmek veya MIslemler'e "İş Başlat" butonu eklemek gerek.

### MIsBaslat — Ekran 5-10 (sırayla, R-10 ile, 67+ oturumlar)

- IbNotEkle (Ekran 5)
- IbFotoKapat (Ekran 6)
- IbBasamakSec (Ekran 7)
- IbTamam (Ekran 8)
- IbSonFoto (Ekran 9 — on_kontrol akışı)
- IbSfTamam (Ekran 10 — son foto onay)

### Mobile genel (önceki oturumlardan devir)

- **MK-58.1** alıştırma enum lowercase migration — kod uppercase 'VAR'/'KISMI'/'YOK' okuyor.
- **MK-62.3** README.md mobile/src/lang/ predev silme problemi.
- **MK-58.5** Panel.html mobile preview UUID input.

### Web genel

- 5 MK adayı vizyon konsolidasyonu (66-70 oturumlar arası)
- EN/AR dil dosyalarında legacy çeviri eksiklikleri

## 65. Oturumda Çıkan Yeni Disiplin Notları

- **MK-65.1: Lang merge ~/Downloads/ path.** Claude'dan indirilen dosyalar Mac'te `~/Downloads/`'a düşer. Lang merge script'i `/mnt/user-data/outputs/` değil `os.path.expanduser('~/Downloads')` kullanmalı. **Sonraki oturumlarda dosya entegrasyon komutları** bu path konvansiyonunu kullanır.

- **MK-65.2: 6-haneli spool_id format mobile React tarafında.** DB'de `A-000575` saklanıyor (8. oturum kararı). Mobile React tarafında `markaId()` helper'ı henüz **yok**, IbQRTara'da manuel girişte `padStart(6, '0')` ile direkt format'a uyumlu hale getirildi. **Asıl çözüm:** 66. oturumda `mobile/src/lib/normalize.js` yazılacak — `ares-normalize.js`'in mobile portu. Bu yapılana kadar görüntülerde 6-haneli ham değer görünür (placeholder JSON dump'larda görüldüğü gibi).

- **MK-65.3: Hub kontrolleri Ekran 4 mockup'ından önce yazılmamalı.** İlk versiyonda `aktif_basamak` rol uyumsuzluk kontrolü yazıldı, ama gerçek DB değerleri (`on_imalat`, `alim_kontrol`) brifing'te yoktu, tahmin temelliydi. Test sırasında her spool'da Ekran 4 placeholder'a düştü, akış UX'i bozuldu. **Çözüm:** Tüm hub kontrolleri 65'te yumuşatıldı (spool varsa direkt Ekran 3), 66'da Ekran 4 mockup turuyla birlikte iş akışı haritası net çıkartılıp yazılır. **Disiplin:** Mockup tasarlanmadan kontrol mantığı yazma — false-positive uyarılar kullanıcıyı yorar.

- **MK-65.4: Rol chip / durum chip görsel tutarlılık.** İlk roleChip stili transparan beyaz arka plan + ince border ile kameralı arka planda zorla okunuyordu. Durum chip pattern'i ile (koyu opak arka plan + 2px renkli border + box shadow) aynı dile getirildi. **Disiplin:** Kameralı/dinamik arka planlı ekranlarda chip stilleri her zaman koyu opak arka plan + belirgin border + box shadow olmalı.

- **MK-65.5: aktifEkran state geçişi vs navigate.** MIsBaslat hub içinde geri butonu IbQRTara'dan **navigate(-1)** değil **setAktifEkran('rolSec')** çağırmalı. MQRTara (standalone) ile IbQRTara (hub'a gömülü) arasındaki en önemli farklardan biri. **Disiplin:** Hub'a gömülü component'lerde her navigate çağrısı yerine ilgili hub callback (onGeri, onSpoolBulundu, vb.) tanımlanmalı.

- **MK-65.6: Kart tıklama → QR shortcut UX kararı.** 64. oturum v4'teki "tek yetki otomatik geçişi kaldırıldı" kararı, kart tıklama davranışını değil **otomatik atlama**'yı kapsıyordu. Kullanıcı niyeti: kart tıklama = rol seç + direkt QR aç (kısa yol). **Yeni davranış:** rolSec callback'inde setAktifEkran('qr'). FAB ise rol değiştirmeden tekrar QR açmak için (kart tıklamadan, hatırlanan rolle).

- **MK-65.7: claude.ai chat URL auto-link sorunu sürdü (MK-64.1 devam).** Bu oturumda da terminal yapıştırmasında `os.path.expanduser('~/Downloads')` ifadesi linke dönüşmedi (✓), ama `e.target.value` gibi nokta-ayrımlı identifier'lar yine risk. **Disiplin:** Kod düzenleme **her zaman** doğrudan editör (VS Code/TextEdit, Smart Quotes/Dashes kapalı) ile yapılır, terminal yapıştırması sadece komut için.

## Önemli Sayılar

- **Toplam MK:** 65 oturum
- **Mobile ekran sayısı:** 9 tam ekran + 1 hub içinde 2 ekran tamamlandı (MGiris, MAnasayfa/Yonetici, MIslemler, MDrawer, MSpoolDetay, MDevreDetay, MDevreler, MQRTara, **MIsBaslat-Ekran1+Ekran2** + MTopBar/MBottomNav ortak komponentler)
- **Lang anahtar:** 1834 (TR/EN/AR senkron)
- **HEAD:** push sonrası güncellenecek

---

> 66. oturum açılışında bu dosya okunacak. İlk gündem: **Ekran 3 (IbSpoolDetay) + Ekran 4 (IbUyari) mockup turu** — Ekran 4 ayrı bir mockup olacak çünkü cross-tenant / devam_ediyor / rol uyumsuzluğu üç ayrı senaryosu var. Ayrıca **`mobile/src/lib/normalize.js` portu** — `markaId()` (6→4 hane kırpma) + `marka()` (E-04 helper) + `revFmt()` Ekran 3'te zorunlu. İş akışı haritası (`aktif_basamak` değerleri × rol matriksi) 66 başında netleştirilecek.
