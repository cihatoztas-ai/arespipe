# AresPipe BRIEFING — 69. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 9 Mayıs 2026, 69 kapanışı (`oturum-saglik.sh 69 --kapanis` MK-65.8 disiplinine uygun çalıştırıldı, MK-56.2 + MK-56.4 canlı kalıyor)

---

## 🎯 70. Oturum Gündemi

**Birincil iş 1: IbSpoolDetay Adım 3d — Yetki + Footer CTA branchleri.** 3b ve 3c kapandı, foto + malzeme + heat çalışıyor; ama operatör **hâlâ herhangi bir işlem yapamıyor** çünkü Foot CTA handler'ları (`iseBasla`, `isiKapat`, `notEkle`) `alert()` placeholder. 3d'nin görevi:
1. `mobile/src/lib/yetki.js`'in `getKullaniciBloklari` çağrısı — current user'ın aktif blokları MIsBaslat hub'ından IbSpoolDetay'a prop olarak geçer (şu an geçmiyor, hub-prop güncellemesi).
2. `aktifBasamakYetkili(spool.aktif_basamak, bloklar)` yardımcı fonksiyonu.
3. Footer matrisi: durum × yetki:
   - bekliyor + yetkili → İşe Başla aktif + Başka Spool
   - bekliyor + yetkisiz → Sadece Başka Spool (İşe Başla görünmez)
   - devam_ediyor + kendi işi (drawer çıkmadığı için garantili) → İşi Kapat + Not Ekle + İptal Et

**Birincil iş 2: 3e/3f/3g/3h/3i/3j — yazma akışları.** 3d temeli üstüne kurulur:
- 3e — İşe Başla (`spooller`: is_durumu→devam_ediyor, aktif_isci_id, başlama tarihi; `is_kayitlari` INSERT)
- 3f — İşi Kapat (basamak ilerletme + is_durumu→bekliyor + log)
- 3g — Devral (foto çekme zorunlu + aktif_isci_id swap + `fotograflar` INSERT + log)
- 3h — Alternatif basamağa başla (drawer mavi/gri'den → aktif_basamak swap + log)
- 3i — Not Ekle (`notlar` INSERT, qr_goster=true)
- 3j — İptal Et (devam_ediyor → bekliyor + sebep + log)

**Birincil iş 3: SED-69-04 — QR okutunca sertifikalı malzeme uyarısı.** Cihat'ın saha senaryosu (69 oturum sonu eklendi): gemi gövdesine kaynak yapılan boru gibi MTC sertifikası gereken malzemelerde (`spool_malzemeleri.sertifikali=true`) operatör yanlış malzeme kullanmasın diye QR okutunca IbUyariDrawer'a yumuşak uyarı tipi (peek tab sarı kart). Akış-kesici değil — bilgilendirici.

**Bilinçli ertelenen birincil işler (kapsam yorgun, 70 sonrasına):**
- **MK-67.4 — Supabase API key migration** (4. kez ertelendi). 67-68-69 boyunca açık. Mobil + web hâlâ legacy JWT key'leriyle çalışıyor (Supabase grace period). Tek başına bir oturum hak ediyor. Mobile `supabase.js` hardcoded zaten — MK-69.1 (env var disiplini) ile birlikte ele alınabilir.
- **IbRolSec.jsx hardcoded TR sarma** (68b borcu, 69'da yapılmadı). 5 anahtar × 3 dil. Isınma maddesi.
- **i18n borç temizliği SED-68-02** — ~75 uyarı. Toplu JSON ekleme.

**Diğer açık borçlar (gündem değil, çözülecek):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase)
- MK-58.5 — Panel.html mobile preview UUID input alanı
- SED-68-01 — `devre_yeni.html` form validation (proje_no/gemi_adi temizlik kuralı)
- SED-68-03 — CI bot push rebase çakışması (`.github/ci-son-rapor.json` workflow'u)
- SED-69-01..05 (5 yeni borç, 69'dan, "Açık borçlar" bölümünde detay)
- `arespipe-backups` Storage backup fail (MK-67.4 kapsamı)

**Etkilenen dosyalar (70 boyunca):** `mobile/src/components/isbaslat/IbSpoolDetay.jsx`, `mobile/src/screens/MIsBaslat.jsx` (bloklar prop'u eklenecek), `mobile/src/lib/yetki.js` (mevcut, kullanılacak), `lang/{tr,en,ar}.json`.

---

## ✅ 69'da Yapılanlar

> 69, **IbSpoolDetay Adım 3b (foto carousel) + Adım 3c (Malzeme paneli BOM + heat inline edit) + iOS viewport zoom fix + 3 MK adayı + 5 SED-69 keşfi** üretti. 3b çekirdek implementasyonu hızlı geçti, ardından 4 fix turu (path/createSignedUrl/endpoint/env var) yapıldı — bu turun en derin öğrenmesi. 3c kapsamı genişledi (read-only → read+heat edit), eski 58. oturum MSpoolDetay'den fetch pattern referans alındı.

### 1. IbSpoolDetay Adım 3b — Foto carousel + 4 fix turu

`mobile/src/components/isbaslat/IbSpoolDetay.jsx` Adım 3b'de foto carousel implementasyonu yapıldı. Mockup tasarımı (200px height + sol-alt sayaç + sağ-alt meta chip + yarı şeffaf nav okları) tek atışta uyguldu.

**3b kapsamı:**
- `fotograflar` tablosu fetch (spool_id eq + olusturma DESC)
- `yukleyen_id → ad_soyad` ayrı sorgu (embed RLS 400 riski yok — MDrawer'daki tenants(ad) deneyiminin dersi)
- 0 foto → mevcut placeholder; 1 foto → resim + meta chip; ≥2 foto → +nav + sayaç
- Meta chip: `islem_turu` i18n (`m_ib_foto_islem_*`) · ad_soyad · GG Ay (locale-aware)

**Fix turları (private bucket policy keşfi):**
1. **3b-fix1 — `getPublicUrl`:** Path-only `dosya_url` için public URL üretildi → 4xx döndü çünkü bucket private.
2. **3b-fix2 — Client `createSignedUrl`:** supabase-js client'tan signed URL → "Object not found" döndü çünkü `storage.objects` SELECT RLS'i normal kullanıcılara kapalı.
3. **3b-fix3 — `/api/dosya-url-al` endpoint geçişi:** Web'in `ARES.dosyaUrlAl` pattern'i mobile'a port edildi (yeni `mobile/src/lib/dosya.js`). Endpoint server-side service_key ile RLS bypass yapar + JWT'den tenant_id check. **Doğru kanal bu.**
4. **3b env var fix:** Production'da fetch URL relative oluyordu (`undefined/api/...`). Vercel `arespipe-mob` projesinde `VITE_API_BASE=https://arespipe.vercel.app` eklendi + redeploy. iPhone Safari'de de canlıya geçti.

**Net öğrenme (oturumun en değerlisi):** **Yeni component private resource'a erişiyorsa, ÖNCE web pattern'ine bakılır.** R-06'ya ek disiplin: "DB pattern'i değil, sistem kanalı kopyalanır."

**MK-69.1 doğdu (aday, 70'te formal):** Mobile env var disiplini = yerel `mobile/.env` + repo `mobile/.env.example` + Vercel project Environment Variables. Bu üçü zorunlu, bypass'sız. Bu oturumda 30 dk env var eksikliğine harcandı, disiplin yazılı olmadığı için.

**MK-69.2 doğdu (aday):** Mobile için `lib/*` altında web ARES'in muadili sistematik kurulur. `lib/dosya.js` başlangıç. Ad denkliği korunur (`ARES.dosyaUrlAl` ↔ `dosyaUrlAl`).

**3b commitleri:**
- `1d489b8` — feat(mobile): IbSpoolDetay 3b foto carousel
- `872133c` — fix(mobile): path-only URL desteği (3b-fix1)
- `61938d0` — fix(mobile): client createSignedUrl (3b-fix2)
- `c33ec66` — fix(mobile): signed URL endpoint geçişi (3b-fix3)

### 2. IbSpoolDetay Adım 3c — Malzeme paneli BOM + heat inline edit

68'in başında Adım 3c **read-only** olarak planlandı. Cihat'ın oturum içinde "personel heat numaralarını da girebiliyordu" yorumu üzerine eski 58. oturum `MSpoolDetay.jsx`'i (mevcut hâlâ duruyor) tarandı — heat input web'de varmış ama mobile'a hiç port edilmemişti. Cihat saha senaryosunu açıkladı (operatör malzemenin üstündeki heat'i okuyup girer, kalite dosyasında lazım), kapsam 3c+3k birleştirilerek genişletildi.

**Final 3c kapsamı:**
- `spool_malzemeleri` tablosu fetch (11 kolon, DB sırası — web pattern)
- MalzemePanel **kart-tabanlı liste** (mobile 380px için; web'in 13-kolon tablosu mobil-uyumlu değil)
- Her kart: #sıra · kod (mono) · tip chip · sertifikalı (varsa ✓ chip) · tanım · malzeme/kalite · ölçü satırı · heat input
- Heat inline edit: input onBlur → `heatKaydet(id, val)` → DB UPDATE + state local güncelle + flash feedback
- Sertifika READ-ONLY (mühendislik kararı, operatör değiştiremez — Cihat netleştirdi: gemi gövdesi kaynağı gibi MTC sertifikası gereken malzemeler için BOM'da baştan tanımlı)
- Tip chip 4 renk grubu: boru=teal, flans/reduktor=mor, dirsek/fitting/te=amber, bilinmeyen=gri

**3c-fix (aynı oturum):** İlk canlı testte heat kaydet 400 (`PGRST204: Could not find 'guncelleme' column`). Kolon DB'de yokmuş — UPDATE'ten kaldırıldı. UX iterasyonu: yazı boyutları +1px, soluk metinler `var(--txd)` → `var(--txm)` okunabilirlik, başarı feedback "✓ Kaydedildi" yazısı 2.5sn (eski sadece border 1.2sn yetersizdi).

**Sertifika konusu — saha bağlamı (Cihat'ın açıklaması):**
> Sertifikalı malzeme = MTC/3.1 sertifikası gerektiren özel boru/fitting (örn. gemi gövdesine kaynak yapılacak ST37). Operatör değiştiremez (BOM'da baştan tanımlı). QR okutunca uyarı çıkmalı (yanlış malzeme kullanımı önlemek için). Sertifika evrakı spool'a yüklenmeli (devre imalatı bittiğinde devre kalite dosyasına eklenecek).

Bu bağlamdan iki yeni borç doğdu: **SED-69-04** (QR uyarı), **SED-69-05** (sertifika evrak yükleme).

**3c commitleri:**
- `ff82fb7` — feat(mobile): 3c Malzeme paneli BOM + heat inline edit
- `ded7e63` — fix(mobile): 3c heat kayit + UX iyilestirme (3c-fix)

### 3. iOS viewport zoom fix — saha app'i için kritik

3c-fix push edildikten sonra Cihat iPhone'da test ederken: heat input'a tıklayınca sayfa yakınlaştı, kayıt sonrası küçültmek elle gerekti. iOS Safari'nin klasik davranışı: input `font-size < 16px` ise otomatik zoom. `mobile/index.html` viewport meta tag'i güncellendi:

```diff
- <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+ <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
```

`maximum-scale=1` + `user-scalable=no` → input zoom kapalı. `viewport-fit=cover` → iPhone notch/dynamic island tam kullanım (bonus). **Trade-off:** Pinch-to-zoom kapalı (görme zorluğu olan kullanıcılar manuel zoom yapamaz). Endüstriyel saha app'i için kabul edilen — operatör tek elinde telefonla iş yapıyor, zoom istemez.

**MK-69.3 doğdu (aday):** Mobile saha app'i viewport — `maximum-scale=1, user-scalable=no` standart. Native app hissi.

**Commit:** `54b1130` — fix(mobile): viewport meta - iOS input zoom kapatıldı.

### 4. mobile/src/lib/dosya.js — yeni helper kütüphanesi

3b-fix3'te doğdu. Web'in `ARES.dosyaUrlAl(yol)` fonksiyonunun mobile React muadili. 5 dakika buffer'lı cache, JWT Bearer auth, `/api/dosya-url-al` endpoint'i. Kullanım yerleri: 3b foto carousel + ileride 3g (Devral foto), 3i (Not foto'lu), MProfil avatar upload, vb.

**MK-69.2 (yukarıda) bu dosyanın sistematik gelişiminin başlangıcı.** Web ARES'in muadili olarak `lib/oturum.js`, `lib/format.js`, `lib/normalize.js` benzeri parçalar ileride doğacak.

### 5. Yeni env var: VITE_API_BASE

3b env var fix'ten doğdu. `mobile/.env` (yerel, gitignore'da, manuel oluşturuldu) + Vercel `arespipe-mob` project Environment Variables (Production+Preview, manuel eklendi). `mobile/.gitignore`'a `.env` satırı eklendi. **`.env.example` henüz commit'lenmedi** — MK-69.1 (env var disiplini) belgelendiğinde eklenir.

### 6. Net dosya kanıtı (69 sonu)

```
mobile/src/components/isbaslat/IbSpoolDetay.jsx  MD5 70bcb10bcfb6d1bbe8615edaa0dcb47a  1593 satır (947 → +646)
mobile/src/lib/dosya.js                          MD5 58368583dbb72e723d95bab2bbda0ace  124 satır (yeni)
mobile/index.html                                MD5 c75f6ae00f8bee2d863e5589825e7d40  (viewport meta)
lang/tr.json                                     MD5 5c10b9010918fec1bd071c24e1286705  1854 satır
lang/en.json                                     MD5 7c70323100773a0b4aab983cbbdc124b  1854 satır
lang/ar.json                                     MD5 29b3511abf3dafb5373d19c9ad7099c6  1854 satır
```

### 69'da yapılmayanlar (bilinçli + zaman/kapsam kaynaklı)

- **3d (Yetki + Footer CTA)** → 70'in Birincil iş 1
- **3e/3f/3g/3h/3i/3j (yazma akışları)** → 70'in Birincil iş 2
- **3l (Genel paneli ilerleme badge'leri)** — agregat sorgular, sonraki oturumlar
- **Foto fullscreen tap-to-zoom** — IbFotoViewer ayrı component, 70+
- **Supabase API key migration** — kapsamı büyük, tek başına oturum (4. kez ertelendi)
- **IbRolSec hardcoded TR sarma** — 5 anahtar × 3 dil, ısınma maddesi
- **i18n borç temizliği SED-68-02** — ~75 uyarı, toplu patch
- **SED-69-04, SED-69-05** — sertifika uyarısı + evrak yükleme (saha kritik ama 3d/3e öncelikli)
- **`oturum-saglik.sh 69 --kapanis` çağrısı** — yapıldı ✅ (MK-65.8 + MK-56.4 disiplinine uyuldu)

---

## 📚 Bilgi Haritası

> Hangi soruda hangi dosyaya bakacağını söyler. Kategori belgeleri (sahip + tazelik penceresi) yıldızla işaretli.

**Vizyon ve mimari:**
- `docs/SPOOL-AI-VIZYON.md` — AI özelinde vizyon v2.1
- `docs/AI-VE-3D-VIZYON-v3.md` — Operasyonel veri merkezli vizyon v3
- `docs/VIZYON-VE-MODULER-MIMARI.md` — Modüler altyapı taahhütleri (40)
- `docs/KUTUPHANE-KAPSAM.md` — Standart kütüphane kapsam haritası (40)
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` — P0 kütüphane yükleme trajektorisi
- ⭐ `docs/VIZYON-OTURUMLARI.md` — Vizyon/strateji sohbetleri (kategori belgesi, 61'de doğdu)

**Karar ve süreç:**
- `docs/KARARLAR.md` — Tüm MK kararları (69 sonu: MK-69.3'e kadar — 69.1/69.2/69.3 bu oturumda eklendi)
- ⭐ `docs/CIHAT-PROFIL.md` — Cihat'ın çalışma stili + Claude'un farkındalıkları
- `docs/CLAUDE-CALISMA-MODU.md` — Claude'a canlı talimatlar
- `CLAUDE.md` — Geliştirme kuralları (web + global)
- `CLAUDE-MOBILE.md` — Geliştirme kuralları (mobil) — 68'de Ib-prefix konvansiyonu + lang tek kaynak güncellendi

**Operasyonel:**
- `docs/SAYFA-EKSIKLERI.md` — Sayfa bazlı eksik tespit metodu (69 sonu: SED-69-05'e kadar)
- `docs/IZOMETRI-BATCH-KARAR.md` + `docs/IZOMETRI-BATCH-NOTLARI.md` — İzometri batch parser
- `docs/L2-PARSER-NOTLARI.md` — L2 deterministik parser kararları
- `docs/KAPANIS-ORKESTRA-TASARIM.md` — Kapanış orkestra protokolü tasarımı (MK-56.4)
- `scripts/oturum-saglik.sh` — Oturum açılış/kapanış sağlık scripti (MK-55.1, MK-60.3, MK-65.8, MK-56.4)
- `migrations/` — DB şema değişiklikleri (000_initial → 033 tenant_features temizlik); README disiplini
- `docs/ROADMAP.md` — Faz B/C planı

**Onboarding:**
- `docs/ONBOARDING.md` — Yeni geliştirici giriş yolu (32)

**Arşiv (referans, aktif değil):**
- `docs/arsiv/CLAUDE-SON-OTURUM-65-yanlis-yazim.md`
- `docs/arsiv/CLAUDE-SONRAKI-OTURUM-65-yanlis-yazim.md`
- `docs/arsiv/son-durum-65-yanlis-yazim.md`
  → 63-64-65'te yanlış mimaride yazılan üç dosya, MK-56.2 sapmasının delili olarak korundu (193e49f).

---

## 📊 69 Sonu Sayılar

- **i18n anahtarları (kök `lang/`):** 1854 (68'de 1841, 69'da +13 — 7 `m_ib_foto_*` 3b'de + 6 `m_ib_sd_malzeme_*` 3c'de + 1 `m_ib_sd_malzeme_kaydedildi` 3c-fix'te). Trend: 62→1752, 63→1800, 64→1816, 65→1834, 66→1834, 67→1834, 68→1841, 69→1854
- **Mobil ekran sayısı:** 9 tam ekran + MIsBaslat hub'ında 3 alt ekran (IbRolSec, IbQRTara, IbSpoolDetay) + 1 ortak component (IbUyariDrawer) + 1 ortak (MDrawer). Yeni: `mobile/src/lib/dosya.js` helper. ⏳ Bekleyen: MProfil + IbSpoolDetay 3d/3e/3f/...
- **Toplam MK kararı:** MK-69.3'e kadar (69'da +3: MK-69.1 env var disiplini, MK-69.2 mobile lib helper kütüphanesi, MK-69.3 viewport zoom kapama).
- **Sayfa eksikleri:** SED-69-05'e kadar (69'da +5: SED-69-01..05)
- **Migration dosyası:** 33 (değişmedi — schema değişikliği yok, sadece veri okuma)
- **CI:** ✅ son commit yeşil
- **HEAD:** `54b1130` (briefing commit'i sonrası güncellenecek)
- **Lint:** Faz B baseline'ı korundu, ~75 i18n uyarı borcu açık (SED-68-02 — 69'da çözülmedi)
- **Vercel env var:** `VITE_API_BASE=https://arespipe.vercel.app` (`arespipe-mob` Production+Preview)
- **Yeni dosyalar (69):** `mobile/src/lib/dosya.js`, `mobile/.env` (gitignored)

---

## 🔄 69'dan 70'e Geçiş Notları

- **MK-65.8 + MK-56.4 disiplinine uyuldu**: `oturum-saglik.sh 69 --kapanis` çalıştırıldı, BRIEFING.md "69. Oturum Kapanışı" başlığıyla güncellendi, üç katmanlı kapanış protokolü (Script + Claude + Cihat) işletildi.
- **3d 70'in birincil işi (Yetki + Footer CTA).** 3b ve 3c bittiği için artık IbSpoolDetay görsel olarak %95 tamam, ama operatör hâlâ yazma yapamıyor. Önce yetki temeli (3d), sonra yazma akışları (3e..3j).
- **MK-69.1/69.2/69.3 KARARLAR.md'ye eklendi** — 70 başında bu briefing içeriğiyle tutarlı.
- **SED-69-04/05 saha kritik** ama 3d/3e öncelikli. Kalan zamanda ele alınır.
- **Web pattern referans alma disiplini canlı** (3b deneyimi): yeni component private resource'a erişiyorsa, önce web'de nasıl yapılıyor bakılır, ondan sonra mobil port'u yazılır.
- **`mobile/src/lib/dosya.js` artık var** (MK-69.2 başlangıç) — sonraki dosya/foto/upload component'leri bu helper'ı bedava kullanacak.
- **`VITE_API_BASE` Vercel'de canlı** — yeni mobile endpoint çağrısı eklerken aynı pattern hazır.
- **Üst bant kuralı (MK-68.3) canlı:** `proje_no` only, `gemi_adi` UI'a sızmaz.
- **Ib-prefix konvansiyonu (MK-68.4) canlı:** İş Başlat alt-akış component'leri `mobile/src/components/isbaslat/Ib*.jsx`.
- **Lang tek kaynak (MK-68.5) canlı:** Yazılır kök `lang/`, üretilir `mobile/src/lang/` (predev kopyası, gitignored).
- **Supabase API key migration (MK-67.4) 4. kez ertelendi.** 70 sonrası bir oturuma alınmalı. Mobile `supabase.js` hardcoded JWT — env var'a alınması MK-69.1 ile birlikte ele alınabilir.
- **CI bot push rebase çakışması (SED-68-03):** Bu oturumda her push'ta `git pull --rebase` ile manuel atlatıldı. Workflow tarafında force-with-lease veya farklı strateji çözümü hâlâ açık.
- **`firma_admin` dashboard erişimi geçici** (MK-67.3'ten devam): İleride yetki haritası ile netleşir.

---

## 🎯 Açılış Ritüeli (70 için)

```bash
cd ~/Desktop/arespipe
git pull origin main
./scripts/oturum-saglik.sh 70
cat BRIEFING.md
```

Sağlık scripti yeşilse Claude'a `cat BRIEFING.md` çıktısı yapıştırılır. **Birincil iş 1 (3d — Yetki + Footer CTA)** ile başlanır. Önce `mobile/src/lib/yetki.js`'in mevcut fonksiyonları taranır (`getKullaniciBloklari` vs.), MIsBaslat'tan `bloklar` prop'unun IbSpoolDetay'a geçirilmesi planlanır, sonra Footer durum × yetki matrisi implemente edilir.

**Açılışta özgür tasarım sunulmaz** (MK-66.3). Footer CTA branchleri zaten 3a'da yapısal olarak hazır (sadece yetki gate'i eklenecek), 3e/3f handler'ları placeholder yerine gerçek akışlara kavuşacak.

**3b'nin dersi (R-06 ek disiplini):** Yeni component private resource'a erişiyor mu? Önce web pattern'ine bak. Yeni env var eklenecek mi? Üç yer (yerel `.env` + `.env.example` + Vercel) zorunlu, bypass'sız.
