# AresPipe BRIEFING — 65. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 6 Mayıs 2026, 65 kapanışı (66 açılışında geç restorasyon — 193e49f sapma düzeltmesi sonrası, MK-56.2 yeniden canlı)

---

## ⚠ 63-64-65 Sapma Notu (66 açılışında okunur)

63, 64 ve 65 oturumları **MK-56.2'yi unuttu** ve eski 3-dosya kapanış mimarisini (`.github/son-durum.md` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md`) yeniden canlandırdı. Bu sapma 65 kapanışının son anlarında MK-65.8 olarak fark edildi — ama düzeltme **eski mimari içinde** yapıldı (3 dosyayı tamamlama, commit `bd24774`). Gerçek düzeltme 66 açılışında yapıldı: `193e49f` commit'i üç dosyayı `docs/arsiv/*-65-yanlis-yazim.md` adıyla taşıdı, BRIEFING.md (bu dosya) ve KARARLAR.md (MK-63.A/B/C, MK-64.1-5, MK-65.1-8) restorasyonu 66 açılışıyla tamamlandı.

**Ders:** MK-56.2 ihlali, oturum 7. saatine girmiş fast-forward kapanışta en olası bypass. **Çözüm (MK-65.8 kararı):** 66+ kapanışlar `oturum-saglik.sh N --kapanis` (MK-60.3) ile başlar — script BRIEFING.md başlık + mtime kontrolünü ilk satırda yapar, sapma anında yakalanır. 65 bu çağrıyı atladı; çağırsaydı yanlış mimari yakalanırdı.

---

## 🎯 66. Oturum Gündemi

**Birincil iş 1: MIsBaslat Ekran 3 (IbSpoolDetay) — R-10 mockup-first.** Operatör QR okuttuktan sonra spool detayını görür, "İşlemi Başlat" / "Vazgeç" seçer. Vanilla `is_baslat.html`'in ana ekranı: foto carousel + pipeline_no + tam marka (E-04 formatı) + malzeme + kalite + ölçüler + basamak ilerleme görselleştirme + dinamik foot CTA (`is_durumu`'na göre).

**Birincil iş 2 (Ekran 3'ün önkoşulu): `mobile/src/lib/normalize.js` portu.** `ares-normalize.js`'in (web kök) mobile karşılığı: `markaId()` (6→4 hane kırpma display), `marka()` (E-04 helper), `revFmt()` (defensive sürüm — MK-60.2'de format.js'e eklendi, normalize.js bunu kullanır), `malzemeEtiket()` (i18n + map). 65'te IbQRTara'da `padStart(6, '0')` direkt yazıldı (MK-65.2 geçici fix), kalıcı çözüm bu port. **format.js ile çakışmaz** — format.js veri biçimleme (revFmt, formatTarih, formatSure), normalize.js domain dönüşümü (markaId, marka, malzemeEtiket).

**İkincil iş: MIsBaslat Ekran 4 (IbUyari) — R-10 mockup turu.** Üç senaryo tek mockup'ta: cross-tenant kırmızı + `is_durumu === 'devam_ediyor'` sarı (devral/iptal) + rol uyumsuzluğu kırmızı/sarı. **Karar noktası 66 başında:** `aktif_basamak` × rol matriksi netleştirilmeli (MK-65.3 ile askıya alınmıştı, 66'da gerçek DB değerleriyle yazılır), kontroller ondan sonra Ekran 2'ye geri döner.

**Etkilenen dosyalar:** `mobile/src/components/isbaslat/IbSpoolDetay.jsx` (yeni), `mobile/src/components/isbaslat/IbUyari.jsx` (yeni), `mobile/src/lib/normalize.js` (yeni), `mobile/src/screens/MIsBaslat.jsx` (Ekran 3+4 placeholder'ları gerçek bileşene çevrilir), `lang/{tr,en,ar}.json` (`m_ib_sd_*`, `m_ib_uy_*` anahtarları).

**Diğer açık borçlar (gündem değil, çözülecek):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase'e standardize, kod hâlâ uppercase 'VAR'/'KISMI'/'YOK' okuyor; tüm mobile dönüşümünden sonra tek seferde geçiş)
- MK-62.3 — `mobile/src/lang/README.md` predev silme problemi (predev script'ine README üretme satırı eklenmeli)
- MK-58.5 — Panel.html mobile preview UUID input alanı

---

## ✅ 65'te Yapılanlar

> 65, **R-10 mockup-first 6 iterasyon + IbQRTara port + 4 küçük fix + 8 MK kararı + 1 sapma** üretti. Birincil iş: MIsBaslat hub'ında Ekran 2 (QR Tarama) prod'a çıktı.

**Ekran 2 (IbQRTara) — yeni dosya, ~934 satır:**
- MQRTara.jsx (63'te yazılan stand-alone) referans alınarak adapte edildi: kamera (BarcodeDetector + jsQR fallback), tam ekran video, beyaz çerçeve + mavi #2D8EFF scan, manuel modal (tenant prefix + sadece numara), 4 durum (tarama/arama/bulundu/hata), kameraYok fallback, body scroll lock, ESC, autofocus, vibrate, taramayiTekrarBaslat döngüsü.
- MQRTara'dan farklar: `navigate()` yerine props callback (`onGeri`/`onSpoolBulundu`/`onCrossTenant`), üst ortada **rol chip** (aktifRol.ad uppercase + dinamik border + dot glow), cross-tenant erken algılama (DB sorgusu öncesi prefix kontrolü), manuel CTA "Spool'u Bul →" yerine "İşlem Başlat →", i18n prefix `m_qr_*` → `m_ib_qr_*`, manuel girişte `padStart(6, '0')`.

**isbaslat.js güncellemesi (+106 satır):**
- `BLOK_RENK_HEX` haritası (v3.2 palette: Büküm #14b8a6 turkuaz, İmalat #6366f1 indigo, Argon/Gazaltı #f97316 turuncu, Kesim #ec4899 pembe, Markalama #a855f7 mor — 5 blok × 4 durum çakışması çözüldü)
- `blokRenkHex(blokAd)` + `hexToRgba(hex, alpha)` + `aktifBasamakRolaUyumlu(blokAd, aktifBasamak)` helper'ları
- `ROL_BASAMAK` artık dizi (her rol birden fazla DB aşaması ile uyumlu olabilir)
- `islemBloklariniGetir` sonucuna `renkHex` field'ı eklendi
- `rolKaydet` / `rolHatirla` artık sadece `id + ad` saklıyor (renk runtime'da)
- Eski cl-X CSS preset API geriye uyum için korundu

**IbRolSec güncellemesi (+41 satır):** cl-X CSS preset class kaldırıldı, `borderLeft: 4px solid renkHex` inline + ikon arka planı `hexToRgba(renkHex, 0.14)` inline. Kart başlığı uppercase + 16px + letter-spacing 0.8 + weight 700 (Ekran 2 chip ile tutarlı, 64'teki küçük borç kapatıldı).

**MIsBaslat hub güncellemesi:** `aktifEkran === 'qr'` artık IbQRTara render eder (MTopBar/MBottomNav gizlenir, fullscreen). **Kart tıklama → direkt QR shortcut** (rolSec callback'inde `setAktifEkran('qr')`, MK-65.6). Ekran 3 (spoolDetay) ve Ekran 4 (uyari) **placeholder** — JSON dump akış kanıtı için.

**Lang +18 anahtar (1816 → 1834):** m_ib_qr_baslik, m_ib_qr_alt_yazi, m_ib_qr_manuel, m_ib_qr_modal_baslik, m_ib_qr_btn_islem_baslat, m_ib_qr_iptal, m_ib_qr_durum_baslangic, m_ib_qr_araniyor, m_ib_qr_bulundu, m_ib_qr_bulunamadi, m_ib_qr_baglanti_hatasi, m_ib_qr_cross_tenant, m_ib_qr_kamera_yok_baslik, m_ib_qr_kamera_yok_yazi, m_ib_qr_hint_sadece_numara, m_ib_qr_hint_tam_id, m_ib_qr_geri, m_ib_qr_kapat — TR/EN/AR senkron.

**14 MK kararı yazıldı (`docs/KARARLAR.md`):** 63-64-65 boyunca yanlış mimaride biriken kararlar 66 açılışında restore edildi:
- **MK-63.A/B/C** — DB sütun varsayımı yasak, "planlandı" notu ≠ yapılmadı, knowledge base bayat
- **MK-64.1-5** — claude.ai URL auto-link, ares-mobile.css bağlama, lang master root, kullanicilar.id, yetki_bloklari kolonları
- **MK-65.1-7** — ~/Downloads path, 6-haneli spool format, hub kontrolleri Ekran 4 öncesi yasak, chip görsel tutarlılık, hub'a gömülü → callback, kart tıklama UX, URL auto-link devam
- **MK-65.8 (KRİTİK)** — Sapmama protokolü ihlalleri + kapanış mimarisi yeniden BRIEFING.md tek otoritesinde

**4 küçük canlı fix (test sırasında):** lang merge `~/Downloads` path, manuel girişte 6-hane padStart, hub kontrolü yumuşatma (Ekran 4 mockup'ı yokken false-positive), rol chip görünürlüğü (kameralı arka plan).

**6 ana commit (eb79efd HEAD'e kadar):**
```
ebf0b80 feat(65): isbaslat.js v3.2 palette + blokRenkHex + aktifBasamakRolaUyumlu helper
ae116fb feat(65): IbRolSec v3.2 palette + uppercase 16px baslik (MK-65)
6ed3f51 feat(65): IbQRTara - Ekran 2 (QR Tara) - MQRTara'dan adapte
24d2f77 feat(65): MIsBaslat hub'a IbQRTara entegre + kart-QR shortcut + Ekran 3/4 placeholder
4ac3bcd feat(65): m_ib_qr 18 anahtar 3 dil (1816 -> 1834)
eb79efd docs(65): son-durum.md - 65. oturum kapanis brifingi    ← yanlis mimaride yazildi
bd24774 docs(65): kapanis 3-dosya tamamlanmasi (MK-65.8 sapma duzeltmesi)  ← hala yanlis mimaride
```

**+ 66 açılışında onarım commit'i:**
```
193e49f fix(mimari): 63-64-65 sapma - terk edilen dosyalar arsive geri tasindi (MK-56.2)
c685e30 chore(ci): ci-son-rapor.json güncelle [skip ci]
```

**65'te yapılmayanlar (bilinçli + sapma kaynaklı):**
- **Ekran 3 + Ekran 4** — 66'ya planlı (gündem öyle planlandı)
- **`mobile/src/lib/normalize.js` portu** — IbQRTara'da `padStart(6,'0')` geçici çözüm yeterli oldu, asıl port 66'da Ekran 3 için zorunlu
- **Hub uyumsuzluk kontrolleri** — `aktif_basamak` × rol matriksi tahminliydi, MK-65.3 ile askıya alındı, 66'da gerçek DB değerleriyle yazılır
- **`oturum-saglik.sh --kapanis` çağrısı** — MK-60.3'te canlıya alınmıştı, 65 sonunda fast-forward kapanışta atlandı; eğer çağrılsaydı MK-56.2 sapması yakalanırdı (MK-65.8'in ana dersi)
- **3-dosya kapanış mimarisi** — yanlışlıkla yazıldı (eb79efd, bd24774), 66'da 193e49f ile arşive taşındı

---

## 📚 Bilgi Haritası

> Hangi soruda hangi dosyaya bakacağını söyler. Kategori belgeleri (sahip + tazelik penceresi) yıldızla işaretli.

**Vizyon ve mimari:**
- `docs/SPOOL-AI-VIZYON.md` — AI özelinde vizyon v2.1
- `docs/AI-VE-3D-VIZYON-v3.md` — Operasyonel veri merkezli vizyon v3 (60 sonrası)
- `docs/VIZYON-VE-MODULER-MIMARI.md` — Modüler altyapı taahhütleri (40)
- `docs/KUTUPHANE-KAPSAM.md` — Standart kütüphane kapsam haritası (40)
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` — P0 kütüphane yükleme trajektorisi (43, takipte)
- ⭐ `docs/VIZYON-OTURUMLARI.md` — Vizyon/strateji sohbetleri (kategori belgesi, 61'de doğdu)

**Karar ve süreç:**
- `docs/KARARLAR.md` — Tüm MK kararları (65 sonu: MK-65.8'e kadar)
- ⭐ `docs/CIHAT-PROFIL.md` — Cihat'ın çalışma stili + Claude'un farkındalıkları
- `docs/CLAUDE-CALISMA-MODU.md` — Claude'a canlı talimatlar
- `CLAUDE.md` — Geliştirme kuralları (web)
- `CLAUDE-MOBILE.md` — Geliştirme kuralları (mobil)

**Operasyonel:**
- `docs/SAYFA-EKSIKLERI.md` — Sayfa bazlı eksik tespit metodu
- `docs/IZOMETRI-BATCH-KARAR.md` + `docs/IZOMETRI-BATCH-NOTLARI.md` — İzometri batch parser mimari kararları
- `docs/L2-PARSER-NOTLARI.md` — L2 deterministik parser kararları
- `docs/KAPANIS-ORKESTRA-TASARIM.md` — Kapanış orkestra protokolü tasarımı (MK-56.4, MK-60.3)
- `scripts/oturum-saglik.sh` — Oturum açılış/kapanış sağlık scripti (MK-55.1, MK-60.3)
- `docs/ROADMAP.md` — Faz B/C planı

**Onboarding:**
- `docs/ONBOARDING.md` — Yeni geliştirici giriş yolu (32)

**Arşiv (referans, aktif değil):**
- `docs/arsiv/CLAUDE-SON-OTURUM-65-yanlis-yazim.md`
- `docs/arsiv/CLAUDE-SONRAKI-OTURUM-65-yanlis-yazim.md`
- `docs/arsiv/son-durum-65-yanlis-yazim.md`
  → 63-64-65'te yanlış mimaride yazılan üç dosya, MK-56.2 sapmasının delili olarak korundu (193e49f).

---

## 📊 65 Sonu Sayılar

- **i18n anahtarları (kök `lang/`):** 1834 (her dilde, +18 / 65'te). Trend: 62→1752, 63→1800 (+48), 64→1816 (+16), 65→1834 (+18)
- **Mobil ekran sayısı:** 9 tam ekran (MGiris, MAnasayfa, MAnasayfaYonetici, MIslemler, MDrawer, MSpoolDetay, MDevreDetay, MDevreler, MQRTara) + MIsBaslat hub'ında 2 alt ekran (IbRolSec, IbQRTara) + 2 ortak komponent (MTopBar, MBottomNav). ⏳ Bekleyen: MIsBaslat Ekran 3-10 (IbSpoolDetay, IbUyari, IbNotEkle, IbFotoKapat, IbBasamakSec, IbTamam, IbSonFoto, IbSfTamam) + MProfil
- **Toplam MK kararı:** MK-65.8'e kadar (62→65 arası +14: MK-63.A/B/C, MK-64.1-5, MK-65.1-8)
- **CI:** ✅ son commit yeşil (`c685e30`, 193e49f sapma düzeltmesi sonrası)
- **HEAD:** `c685e30`
- **Lint:** Faz B baseline'ı korundu

---

## 🔄 65'ten 66'ya Geçiş Notları

- **MK-56.2 sapması 193e49f ile kapatıldı.** 63-64-65'te yeniden canlanan 3-dosya mimarisi `docs/arsiv/`'a taşındı, BRIEFING.md ve KARARLAR.md restorasyonu 66 açılışında yapıldı. 66'dan itibaren kapanış protokolü kesin: `oturum-saglik.sh N --kapanis` çağrılır, BRIEFING.md güncellenir, KARARLAR.md'ye yeni MK'lar eklenir, push tek commit zinciriyle gider. **`.github/son-durum.md` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` üçü de YASAK** (MK-65.8 hatırlatması).
- **66 kapanışında `oturum-saglik.sh 66 --kapanis` ZORUNLU.** MK-60.3 + MK-65.8 birlikte canlıdır. Çağrılmazsa MK-65.8 sapması tekrar olur. Cihat *"66'yı kapatıyoruz"* dediği anda Claude bu komutu hatırlatır, çıktısı yeşil değilse kapanış commit'i atılmaz.
- **`mobile/src/lib/normalize.js` portu Ekran 3 için zorunlu önkoşul.** `markaId()`, `marka()`, `malzemeEtiket()` 3 helper bu portta gelir, IbSpoolDetay bunları çağırır. 60'ta `format.js`'e taşınan helper'larla **çakışmaz** (format.js veri biçimleme, normalize.js domain dönüşümü). 65'te IbQRTara'da yazılan `padStart(6, '0')` geçici fix port tamamlanınca temizlenir.
- **`aktif_basamak` × rol matriksi 66 başında netleşir.** 65'te tahminliydi (MK-65.3 askıya aldı). Sıra: gerçek DB sorgusuyla matrix tablosu çıkar → Ekran 4 mockup'ı yazılır → kontrol kodu hub'a döner. Bu sırayı atlamak MK-65.3 ihlali sayılır.
- **Mockup-first protokol (R-10) Ekran 3+4 için aynen.** 64-65'te 6 iterasyon ortalaması; Ekran 4'te cross-tenant + devam_ediyor + rol uyumsuzluğu üç senaryo aynı turda tasarlanır. Her senaryo için ayrı renkler ve CTA'lar belirlenir.
- **Geçici borç:** `mobile/src/lang/README.md` (MK-62.3) hâlâ `.gitignore` satır 27 (`src/lang/`) tarafından ignore ediliyor. predev script'ine README üretme satırı eklenmeli; 66'da Ekran 3 ile dokunulan doğal nokta — i18n anahtar eklerken yapılır.

---

## 🎯 Açılış Ritüeli (66 için)

```bash
cd ~/Desktop/arespipe
git pull origin main
./scripts/oturum-saglik.sh 66
cat BRIEFING.md
```

Sağlık scripti yeşilse Claude'a `cat BRIEFING.md` çıktısı yapıştırılır, **Ekran 3 (IbSpoolDetay) ile başlanır**. İlk soru: *"Önce normalize.js port'unu mu yazalım, yoksa Ekran 3 için R-10 mockup turuna mı geçelim?"* — sıra Cihat'ın tercihine göre belirlenir, ama ikisi de 66'nın birincil işidir.
