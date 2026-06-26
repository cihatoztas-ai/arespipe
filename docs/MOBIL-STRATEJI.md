# AresPipe Mobil — Kapsamlı Strateji Belgesi

> **YAŞAYAN BELGE.** Mobil iş bitene kadar her oturumda taşınır ve güncellenir.
> Tasarım turu (oturum 206) çıktısıdır; önceki mobil kararları (CLAUDE-MOBILE.md,
> ARCHITECTURE.md, oturum arşivleri) İPTAL ETMEZ, üstüne kurar ve onlarla hizalar.
> Açık kararlar `⏳ KARAR BEKLİYOR` etiketli (seçenek + öneri). Referans mockup: `anasayfa-mockup.html`.

---

## 0. Mimari karar — NATIVE REACT (kesin)

**Mobil uygulama React'tir. Taviz yok.** İşlem akışı (kesim/büküm/markalama, spool detay)
mobilde **native React ekran** olarak yaşar ve saha için yeniden düzenlenir.

- Geçmişte vanilla denenip başa dönüldü → tekrarlanmaz. Bu, `ARCHITECTURE.md` Bölüm 9
  ile uyumludur: *web = statik HTML; mobil = React (operatörün akıcı arayüzü)*.
- **"Web URL kısayolu" yalnız geçici köprüdür** — henüz native yazılmamış bir sayfaya kısa
  vadeli erişim için olabilir, ama kalıcı strateji değildir. Hedef: her işlem ekranı native React.
- **Native shell kapsamı:** giriş, ana sayfa/router, menü, uygulamalar, QR erişimi, işlem ekranları.

> Not: Bu karar, daha önce bu turda tartışılan "web-first" yaklaşımını KAPATIR. Tekrar açılıp
> zaman kaybı olmasın diye yazıldı. ARCHITECTURE.md Bölüm 9 zaten bu yönde; çelişki yok.

---

## A. Devralınan mobil temel (önceki oturumlardan — KAYBOLMADI)

Kaynak: `CLAUDE-MOBILE.md`, `docs/ARCHITECTURE.md`, oturum arşivleri. Bağlayıcıdır.

**Yapılmış & canlı** (`arespipe-mob.vercel.app`, Vercel proje `arespipe-mob`, root `mobile`, `npm run build`):
- Ekranlar: Giriş (MGiris), router (MAnasayfa), yönetici dashboard (MAnasayfaYonetici),
  operatör işlemler (MIslemler), drawer (MDrawer: profil+tema+dil+çıkış).
- i18n (61+ `m_*` anahtar, tr/en/ar), tema context (dark / light-anthracite).
- Olgun is-baslat akışı: IbQRTara (1028), IbSpoolDetay (2370), IbRolSec, IbSonrakiBasamakDrawer, IbUyariDrawer.
- Yetki: **Grup = Buton, Blok = teknik yetki varyantı.** Gruplar: İmalat, Kesim, Markalama, Argon Kaynağı, Gazaltı Kaynağı (+ QR).

**Devralınan kurallar (CLAUDE-MOBILE.md — bağlayıcı):**
- **R-08 i18n:** hardcode string YASAK → `tv('m_x','fallback')`; her anahtar tr/en/ar üçüne birden.
- **R-09 Tema:** sadece `useTema()`; direct DOM YASAK. `index.css`'te iki tema bloğu zorunlu (tırnaksız).
- **R-10 Mockup-first:** yeni ekran/component → önce mockup + onay → kod.
- Tasarım: Barlow Condensed başlık, pill badge, kart sistemi; **eldivenli el için buton min 72px.**
- "M" ön eki her yerde. iOS: file input label, font-size 16px, 100dvh, `useNavigate` (location.href değil).
- `kullanicilar.ad` YOK → `ad_soyad`; `tenants(ad)` JOIN RLS 400 → ayrı sorgu; JWT anon key (eyJ...).
- RLS: `kullanici_bloklar` INSERT'te `tenant_id` zorunlu.

**Devralınan kritik kararlar:**
- **Tenant prefix + QR (6. oturum):** `tenants.kod` (1-4 harf), spool ID `A-0504`, QR payload `A-0504:UUID`.
  QR okuma bu formatı parse etmeli + **cross-tenant uyarı** vermeli (başka firmanın spool'u yanlış açılmasın).
- **is_durumu akışı:** bekliyor → devam_ediyor → bekliyor. Spool `devam_ediyor` ise mükerrer iş uyarısı.
- **`kullanicilar.foto_url`** DB'de var (text); avatar upload UI yok → MProfil işi.

**Hâlâ bekleyen (önceki liste):** MProfil (avatar), rol etiketi i18n mapping, Storage avatar upload,
web/mobil dil senkron scripti.

---

## 1. Kullanıcı tipleri (4)

| # | Tip | Kayıt | Ana sayfası | Erişim |
|---|-----|-------|-------------|--------|
| 1 | **Program yöneticisi** | Firma kurulumu / firma_admin | Dashboard (istatistik) | Tüm sistem |
| 2 | **Spool kullanıcısı** (operatör) | ⏳ davet (§4) | İşlemlerim (yetki bloğu) + Uygulamalar | Yetki bloklarına göre |
| 3 | **Uygulama kullanıcısı** | Self-servis (dışarıdan) | Doğrudan uygulamalar | Yalnız uygulamalar |
| 4 | **Müşteri** | ⏳ (§4) | Kendi projeleri + imalat kayıt PDF | Yalnız kendi projesi (salt-okunur) |

**Router sırası (MAnasayfa):**
```
yönetici  → dashboard
müşteri   → müşteri ekranı (kendi projeleri)
bloğu var → işlemler ekranı (+ uygulamalar)
diğer     → uygulamalar ekranı (doğrudan)
```
> Eski "🔒 yetki tanımlanmamış" hata ekranı KALKAR — bloğu olmayan = uygulama kullanıcısı (hata değil).

---

## 2. Uygulamalar (herkese açık)

- Spool'dan bağımsız araçlar. **Yetki gerektirmez.** İleride ücretlendirilebilir (özellikle AI maliyetli).
- Başlangıçta **sabit liste (kodda)**; tetik gelince DB tablosu.
- **Uygulama kullanıcısı için ana sayfa = doğrudan bu liste** (ara buton yok — kopukluk olmasın).

| Uygulama | Açıklama | Durum |
|----------|----------|-------|
| 🔢 Birim Çevirici | DN↔inç, mm↔inç, ağırlık | Saf hesap — ilk aktif aday |
| 📚 Kütüphane | Boru/fitting/flanş ölçü sorgu | Veri web'de var (`*_olculer`); native React ekran |
| ✂️ Kesim Optimizasyonu | Boy fire en aza indirme | Yeni geliştirme |
| 📸 Parça Tanıma | Flanş/fitting fotoğrafı + birkaç soru → standart bilgi (DN/PN/standart/ölçü). Vision AI, maliyetli → ücretli aday | Ayrı tasarım turu |

---

## 3. QR'ın yeri

- **"QR Tara" bir işlem DEĞİL.** İşlem listesinde (kesim/büküm/markalama) kalem olarak yer almaz.
- QR = bir spool'a **hızlı erişim aracı**: okut → o spool'un işlem/detay ekranı açılır.
- **Payload formatı (devralındı):** `A-0504:UUID`. Okuma bunu parse eder, **cross-tenant uyarı** verir.
- **Mükerrer iş (devralındı):** spool `is_durumu='devam_ediyor'` ise başlatma, uyar.
- ⏳ KARAR: bottom nav orta kamera butonu QR erişimi için kalsın mı (etiketi "spool bul")? Saha için pratik, muhtemelen kalır.

---

## 4. Kayıt & yetkilendirme  ⏳ ANA AÇIK KONU

### Uygulama kullanıcısı (dışarıdan)
- Self-servis kayıt (e-posta + şifre) → otomatik "uygulama kullanıcısı" → yalnız uygulamalar.
- Spool sayfalarına erişim engelli (RLS + route guard).
- ⏳ DB modeli: yeni `rol` değeri mi, yoksa "tenant yok + blok yok" durumu mu?

### Spool kullanıcısı (firma personeli)
Aynı uygulamadan girer; spool erişimi için yetkilenmesi gerekir.
- **(A) Davet kodu/linki:** yönetici kod üretir → personele verir → personel kodu girer → tenant'a bağlanır → yönetici blok atar.
- **(B) Yönetici doğrudan ekler:** yönetici e-postayla oluşturur → davet maili → personel şifre belirler → tenant+yetki hazır.
> Öneri: saha için (A) davet kodu pratik; davet linki = (A)+(B) karışımı en modern.
> ⏳ KARAR: A / B / ikisi. Mevcut web'de kullanıcı ekleme nasıl yapılıyor → kontrol et (muhtemelen B'ye yakın).

### Müşteri
- ⏳ Firma yöneticisi müşteri hesabı açar + projeye bağlar. Müşteri yalnız kendi projesini görür (RLS),
  biten spoollar için imalat kayıt dosyası PDF indirir.

### ⏳ Üst-soru: tek hesap çoklu rol?
Dışarıdan kaydolan biri sonra firmaya katılabilir mi? Davet kodu modeli bunu doğal çözer
(uygulama kullanıcısı kod girince spool erişimi açılır) — "tek esnek ana sayfa" mantığıyla tutarlı.

---

## 5. Ana sayfa düzenleri (özet)

```
UYGULAMA KULLANICISI       SPOOL KULLANICISI          YÖNETİCİ                MÜŞTERİ
──────────────────         ──────────────────         ──────────────         ──────────────
Hero: ad / Uygulamalar     Hero: ad / rol             Hero: ad / Yönetici    Hero: ad / firma
🔢 Birim Çevirici          İŞLEMLERİM                 [stat][stat]           PROJELERİM
📚 Kütüphane               ✂️ Kesim                    [stat][stat]           • Proje A 12/40
✂️ Kesim Opt.              ↩️ Büküm                    ▶ İşlem Başlat*        • Proje B sevk
📸 Parça Tanıma            🏷️ Markalama                 UYGULAMALAR            [İmalat PDF indir]
(hepsi YAKINDA)            UYGULAMALAR                📚 Uygulamalar          (salt-okunur)
                           📚 Uygulamalar
```
\* İşlem Başlat yöneticide şart değil — şimdilik kalır, sonra kaldırılabilir.
İşlem butonları (Kesim/Büküm/Markalama) = native React işlem ekranlarını açar.

---

## 6. Spool detay çatalı — çözüm

**Çatal:** `MSpoolDetay` (577, salt-okunur denetim) vs `IbSpoolDetay` (2370, operatör işlem).
**Boşluk:** Yönetici işlemdeki spool'u devreler yolundan göremiyor; operatör akışına girmek zorunda.

**Karar (native, toplamsal — eritme YOK):**
- Tek sayfa, temel = **IbSpoolDetay** (zengin). Herkes buraya girer.
- MSpoolDetay'ın yönetici-özel bilgileri (KK durumu, sevkiyat, belgeler, işlem log) tek bir
  **"Denetim" sekmesinde** toplanır; `yoneticiMi(k)` ise görünür, personel görmez.
- `MSpoolDetay` emekli; `/spool/:id` → IbSpoolDetay'a yönlenir.
- Mevcut işlem sekmeleri/akışı (mockup-kilitli, MK-68.3 vb.) DEĞİŞMEZ → regresyon riski düşük.
- ⏳ Yönetici "Denetim" dışında işlem aksiyonu (başlat/ilerlet) yapabilir mi, yoksa salt-izleyici mi?

---

## 7. Açık kararlar — sonraki oturum ajandası

1. **§4 Kayıt akışı (EN BÜYÜK):** spool kullanıcısı kaydı A / B / ikisi. Mevcut web ekleme akışını kontrol et.
2. **§4** Uygulama kullanıcısı DB modeli: yeni `rol` mü, "tenant+blok yok" mu?
3. **§4** Müşteri davet akışı + RLS kapsamı.
4. **§4** Tek hesap çoklu rol (uygulama→spool geçişi) destekleniyor mu?
5. **§8 Yönetici ana sayfa içeriği** — Cihat: "tam kafamda canlanmadı". Dashboard'da ne olmalı?
6. **§3** Bottom nav QR butonu: kalsın mı, etiketi "spool bul" mu?
7. **§2** Hangi uygulama önce aktif (öneri: Birim Çevirici — saf hesap).
8. **§6** Yönetici spool işlem aksiyonu yapabilir mi?

> ÇÖZÜLDÜ: Mimari = native React (§0). Çatal yaklaşımı = native toplamsal birleştirme (§6).

---

## 8. Kod planı (native React)

| Sıra | İş | Bağımlılık |
|------|-----|-----------|
| 1 | `lib/uygulamalar.js` sabit liste + `MUygulamalar.jsx` + `/uygulamalar` route + dil | yok → ilk güvenli push |
| 2 | `yetki.js`: `musteriMi`, "uygulama kullanıcısı" tespiti | §7-2 |
| 3 | `MAnasayfa.jsx` 4 dallı router | §4 |
| 4 | `MIslemler.jsx`: işlem butonları + Uygulamalar butonu; 🔒 kalkar | §3 |
| 5 | `MAnasayfaYonetici.jsx`: Uygulamalar (+ İşlem Başlat opsiyonel) | §7-5 |
| 6 | `MProfil.jsx` (avatar — `foto_url` + Storage) | mockup-first |
| 7 | `MMusteri.jsx` (yeni) | §7-3, mockup-first |
| 8 | Kayıt/davet akışı (kod + DB) | §7-1 — en büyük iş |
| 9 | Spool detay çatalı: IbSpoolDetay'a "Denetim" sekmesi + MSpoolDetay emekli | §6 |
| 10 | Kesim/Büküm/Markalama native React işlem ekranları (saha düzeni) | büyük, ayrı turlar |

**İlk güvenli push:** Sıra 1 — hiçbir karara bağlı değil, mevcut akışı bozmaz.

---

## 9. Disiplin / mobil kuralları

- Mockup-first (R-10): yeni ekran kodlanmadan mockup + onay.
- i18n (R-08): hardcode YASAK, `tv()`, tr/en/ar üçü birden. Tema (R-09): `useTema()`, direct DOM yok.
- `kullanicilar.ad` → `ad_soyad`; tenant ayrı sorgu; JWT anon key; `kullanici_bloklar` INSERT'te tenant_id.
- "M" ön eki; eldivenli el için buton min 72px; iOS checklist (CLAUDE-MOBILE.md).
- Storage bucket `arespipe-dosyalar` (avatar / parça tanıma foto).
- Dil: root `lang/{tr,en,ar}.json` canonical; `mobile/src/lang/` prebuild ile üretilir — elle düzenleme yok.
- Kod commit `[skip ci]` YOK; doküman commit `[skip ci]` VAR.
- ≤12 api fonksiyonu (MK-129.3) — kayıt/davet endpoint'i gerekirse consolidasyon şart.
- Tam tasarım sistemi/checklist için her zaman `CLAUDE-MOBILE.md`'yi de aç (bu belge ona referans verir).
