# AresPipe BRIEFING — 62. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 5 Mayıs 2026, 62 kapanışı

---

## 🎯 63. Oturum Gündemi

**Birincil iş:** **MQRTara.jsx** — mobilin asıl varlık sebebi olan operatör akış zincirinin başlangıcı (QR Tara → Spool Detay → İş Başlat/Bitir). Mockup-first protokol (R-10) uygulanır.

Tek iş: kameraya erişim + QR çözme + URL'ye yönlendirme. Spool'u açma `MSpoolDetay`'in işi (sonraki oturum). Önkoşul: kamera permission flow tasarımı, QR kütüphanesi seçimi, hata durumları (kamera reddi, geçersiz QR, kapalı spool).

**Etkilenen dosyalar:** `mobile/src/screens/MQRTara.jsx` (yeni), `mobile/src/App.jsx` (route eklenir), `lang/{tr,en,ar}.json` (yeni `m_qr_*` anahtarları).

**İkincil iş — bekleyen MK adayları (62'den taşıyor):** İki MK adayı 62'de yazılmadı, 63 veya master vizyon konsolidasyonuna (65-70) bekliyor:
- Format tanıtımı görsel template editor (prompt yazımı değil, görsel işaretleme)
- Etiketleme dörtlü bağ `parca` + chr(95) + `id`'den (foto/izometri/2D/STP ortak omurga)

Ayrıca 62'de açıkta kalan mimari karar adayı: **Local component state ile context state çakışırsa context kazanır** (MGiris i18n bağlanması sırasında ortaya çıktı, tek vakaya dayalı kural yazılmadı, 63+'ta ikinci örnek görülürse MK olarak yazılır).

**Diğer açık borçlar (gündem değil, çözülecek):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase'e standardize)
- MK-58.5 — Panel.html mobile preview dinamik UUID input alanı

---

## ✅ 62'de Yapılanlar

> **Bu oturum üçlü kategoride çalıştı:** karar yazma (61'in adaylarından 3 MK karara bağlandı), kod (MGiris.jsx i18n bağlandı), disiplin (4 yeni paste/hook/bash kuralı yazıldı). Birincil iş MGiris i18n + 5 MK aday değerlendirmesi olarak başladı, kapanışta 3 MK + 4 disiplin notu + 1 kapsam-dışı aday biriktirdi.

**MGiris.jsx i18n entegrasyonu:**
- 9 hardcoded TR string `tv()` çağrısına çevrildi (`m_gr_*` prefix, 10 anahtar)
- Local `dil` state'i kaldırıldı, `useT()` context'i kullanılır oldu (MDrawer pattern uyumu)
- Tema state'i mevcut hâlinde kaldı (TemaProvider'a göç 63+'a, kapsam dışı)
- `lang/{tr,en,ar}.json` her birine 10 yeni anahtar eklendi (1742 → 1752)

**3 MK kararı yazıldı (`docs/KARARLAR.md`):**
- **MK-62.1** — Mimari pattern adlandırması: spool agregat root + havuz batching. 61'de Cihat'ın anlattığı sistem anatomisinde isim verilmemiş iki pattern (DDD aggregate + 3-tekrar batching kalıbı) artık adlandırılmış sayılır, gelecek özellik kararlarında "bu spool agregatına mı enjekte olur?" zorunlu sorgusu.
- **MK-62.2** — Foto tipi ayrımı: `asama_fotosu` vs `gozlem_fotosu`. MK-61.2'nin tamamlayıcısı — yönetici sahada foto çekerken QR session olmadığı için `imalat_asamasi` NULL olur, `fotograf_tipi` kolonu bu ayrımı netleştirir, opsiyonel `uyari_olustur` checkbox'ı uyarılar sayfasına bağlanır.
- **MK-62.3** — `lang/` tek-otorite, `mobile/src/lang/` otomatik üretilir. 62'de gerçek tuzakla yaşandı: MGiris anahtarları `mobile/src/lang/`'a yazıldı, `npm run dev`'in `predev` script'i kök `lang/`'dan kopyaladı, 10 anahtar uçtu. Mobil dizin artık `README.md` ile işaretli, CLAUDE-MOBILE'da satır 184'te uyarı.

**Doküman güncellemeleri:**
- `CLAUDE-MOBILE.md` satır 184 — i18n hedef dosya uyarısı eklendi (MK-62.3 referansı)
- `mobile/src/lang/README.md` doğdu (1 dosya, 2 satır, kaynak işareti)
- `docs/CLAUDE-CALISMA-MODU.md` 4 disiplin notu eklendi (Terminal/Paste Disiplinleri + Mevcut Kod Pattern'lerini Önce Oku başlıkları, satır 131 ve 140)

**62'de yapılmayanlar (bilinçli):**
- **MProfil.jsx, MIsBaslat.jsx, MDevreler.jsx** — Cihat 62 ortasında dedi: "mobilde daha önemli sayfalar öncelik, avatar sonra da yapılabilir." MProfil'i tamamlamak `cilalama` itkisi olur, asıl operatör akışı (QR/IsBaslat zinciri) değil.
- **5 MK adayından 2'si** (görsel template editor + parca_id omurgası) — tetik koşulları henüz yok, master vizyon konsolidasyonuna kadar bekliyor.
- **CIHAT-PROFIL.md güncellemesi** — 61'de "zaman kalırsa" diye yazılmış 2 farkındalık satırı 61'de zaten dosyaya işlenmiş (62 başında kontrol edildi), 62'de yeniden bir şey eklenmedi.
- **Local state vs context state mimari MK'sı** — tek vakaya dayalı kural yazılmadı, ikinci örnek görülünce yazılır.

---

## 📚 Bilgi Haritası

> Hangi soruda hangi dosyaya bakacağını söyler. Kategori belgeleri (sahip + tazelik penceresi) yıldızla işaretli.

**Vizyon ve mimari:**
- `docs/SPOOL-AI-VIZYON.md` — AI özelinde vizyon v2.1 (28 civarı)
- `docs/AI-VE-3D-VIZYON-v3.md` — Operasyonel veri merkezli vizyon v3 (60 sonrası, 61'de repo'ya alındı). v2.1'in 4 maddesini revize etti: ürün karakteri, hacim varsayımı, foto akışı, tier modeli.
- `docs/VIZYON-VE-MODULER-MIMARI.md` — Modüler altyapı taahhütleri (40)
- `docs/KUTUPHANE-KAPSAM.md` — Standart kütüphane kapsam haritası (40)
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` — P0 kütüphane yükleme trajektorisi (43, takipte)
- ⭐ `docs/VIZYON-OTURUMLARI.md` — Vizyon/strateji sohbetleri (kategori belgesi, 61'de doğdu)

**Karar ve süreç:**
- `docs/KARARLAR.md` — Tüm MK kararları (62 sonu: MK-62.3'e kadar)
- ⭐ `docs/CIHAT-PROFIL.md` — Cihat'ın çalışma stili + Claude'un farkındalıkları
- `docs/CLAUDE-CALISMA-MODU.md` — Claude'a canlı talimatlar (62'de 4 yeni disiplin)
- `CLAUDE.md` — Geliştirme kuralları (web)
- `CLAUDE-MOBILE.md` — Geliştirme kuralları (mobil, 62'de satır 184 i18n hedef uyarısı)

**Operasyonel:**
- `docs/SAYFA-EKSIKLERI.md` — Sayfa bazlı eksik tespit metodu
- `docs/IZOMETRI-BATCH-KARAR.md` + `docs/IZOMETRI-BATCH-NOTLARI.md` — İzometri batch parser mimari kararları
- `docs/L2-PARSER-NOTLARI.md` — L2 deterministik parser kararları (50)
- `.github/son-durum.md` — Aktif borçlar listesi (52'den beri parser_kural takibi)
- `docs/ROADMAP.md` — Faz B/C planı (22-29 oturum civarı)

**Onboarding:**
- `docs/ONBOARDING.md` — Yeni geliştirici giriş yolu (32)

---

## 📊 62 Sonu Sayılar

- **i18n anahtarları (kök `lang/`):** 1752 (her dilde, +10 / 62'de)
- **Mobil ekran sayısı:** 5 yazılı (MGiris, MAnasayfa, MAnasayfaYonetici, MIslemler, MDrawer); ⏳ MProfil, MIsBaslat, MQRTara, MSpoolDetay, MDevreler, MDevreDetay
- **Toplam MK kararı:** MK-62.3'e kadar
- **CI:** ✅ son commit yeşil (61'in son durumu, 62'de kod build'i lokal HMR'da test edildi)
- **Lint:** 0 hata, 22 uyarı (Faz B baseline'ı korundu)

---

## 🔄 62'den 63'e Geçiş Notları

- **62 birden fazla doküman güncelledi.** Push'tan sonra CI tekrar çalışır, Vercel iki proje (arespipe + arespipe-mob) deploy eder. Hobby plan limit'i: 50 push/gün civarı.
- **MK-62.3 README açığı.** mobile/src/lang/README.md disk'te var ama mobile/.gitignore satır 27 (src/lang/) tarafından ignore ediliyor. predev script'ine README üretme satırı eklenmeli, yoksa Vercel build'inde + yeni klonlamalarda uyarı kayboluyor. 63'te düzeltilir (MQRTara dokunduğu sırada doğal nokta).
- **MQRTara için kütüphane seçimi açık.** `qr-scanner`, `html5-qrcode`, `react-qr-reader` gibi alternatifler var. Mockup-first protokolde önce UI tasarımı yapılır, kütüphane sonra seçilir (kütüphane API'sı UI'yı şekillendirmesin).
- **Tema state göçü 63'te de yapılmadı.** MGiris hâlâ kendi local `tema` state'i tutuyor. Aday MK: "Tema da context'e taşınmalı, MGiris dahil." Tetik: ikinci ekranda da aynı sorun → karar.

---

## 🎯 Açılış Ritüeli (63 için)

```bash
cd ~/Desktop/arespipe
git pull origin main
./scripts/oturum-saglik.sh 63
cat BRIEFING.md
```

Sağlık scripti yeşilse Claude'a `cat BRIEFING.md` çıktısı yapıştırılır, MQRTara ile başlanır.
