# AresPipe Mobil — Kapsamlı Strateji Belgesi

> **YAŞAYAN BELGE.** Mobil iş bitene kadar her oturumda taşınır ve güncellenir.
> Tasarım turu (oturum 206) çıktısıdır; önceki mobil kararları (CLAUDE-MOBILE.md,
> ARCHITECTURE.md, oturum arşivleri) İPTAL ETMEZ, üstüne kurar ve onlarla hizalar.
> Açık kararlar `⏳ KARAR BEKLİYOR` etiketli (seçenek + öneri). Referans mockup: `anasayfa-mockup.html`.
>
> **GÜNCELLEME (oturum 207):** §7 kayıt kararları DATA-first kilitlendi (aşağıda). Sıra-1 (uygulamalar
> ekranı) canlıda — `/uygulamalar` route modu doğrulandı. İki yeni kural: **MK-207.1** (12-fonksiyon tavanı
> kısıttır, mimari pusula değil — doğru tasarım endpoint isterse Pro'ya geçilir) · **MK-207.2** (offboarding
> kod tarafında zorlanamaz; atıl kullanıcı yöneticiye görünür kılınır: son_giris dormancy + dashboard sayaç).
>
> **GÜNCELLEME (oturum 208):** Sıra 2 (`yetki.js`: `musteriMi`) + Sıra 3 (MAnasayfa 4 dallı router) CANLIDA.
> Router 4 dal doğrulandı: yönetici → dashboard, müşteri → placeholder, blok var → MIslemler,
> diğer → MUygulamalar anaSayfaModu. İş modeli **MK-208.1** ile kilitlendi (3 erişim katmanı + platform-bağımsız
> kimlik + market engelleri Safari PWA dağıtımında PARK — §7 ve §11'e bakınız). Marka mobile'a entegre edildi:
> PWA ikon+manifest, giriş logosu (inline SVG, tema-değişkenli) + tarama animasyonu ÇALIŞIYOR. Topbar mark
> entegre ama animasyonu iOS Safari'de tutmadı → 209 debt (§11). DEBT: MK-208.1 bu belgeye işlendi (bu güncelleme).
>
> **GÜNCELLEME (oturum 209):** Sıra 4 (MIslemler Uygulamalar butonu + 🔒 kalktı), Sıra 5a (MAnasayfaYonetici
> Uygulamalar linki), Sıra 5b (yönetici dashboard **atıl kullanıcı bandı**, MK-207.2) ve Sıra 6 (**MProfil**
> ekranı — avatar/bilgiler/şifre/hesap-sil) CANLIDA. `son_giris` artık başarılı girişte damgalanıyor (MGiris
> patch) → atıl sayacı gerçek çalışır (5b debt kapandı). Üyelik paketi şimdilik **statik "Kurumsal" + uyarı notu**
> (abonelik altyapısına bağlanacak — yeni debt). Avatar upload **client-side** (`arespipe-dosyalar`, path
> `{tenant_id}/avatar/{id}.jpg`) RLS'ten geçer → **yeni endpoint yok**, 12-tavan korundu. Topbar mark iOS
> animasyonu bu oturumda dokunulmadı → debt 210'a taşındı (§11).

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
>
> **208 dağıtım notu:** Mevcut dağıtım = mobil Safari → `arespipe-mob.vercel.app` → "ana ekrana ekle"
> kısayolu (PWA). Market gönderimi YOK. Native React hedefi korunur; market engelleri PARK (§11).

---

## A. Devralınan mobil temel (önceki oturumlardan — KAYBOLMADI)

Kaynak: `CLAUDE-MOBILE.md`, `docs/ARCHITECTURE.md`, oturum arşivleri. Bağlayıcıdır.

**Yapılmış & canlı** (`arespipe-mob.vercel.app`, Vercel proje `arespipe-mob`, root `mobile`, `npm run build`):
- Ekranlar: Giriş (MGiris), router (MAnasayfa), yönetici dashboard (MAnasayfaYonetici),
  operatör işlemler (MIslemler), drawer (MDrawer: profil+tema+dil+çıkış).
- i18n (61+ `m_*` anahtar, tr/en/ar), tema context (dark / light-anthracite).
- Olgun is-baslat akışı: IbQRTara (1028), IbSpoolDetay (2370), IbRolSec, IbSonrakiBasamakDrawer, IbUyariDrawer.
- Yetki: **Grup = Buton, Blok = teknik yetki varyantı.** Gruplar: İmalat, Kesim, Markalama, Argon Kaynağı, Gazaltı Kaynağı (+ QR).
- **(208 eklenenler):** MUygulamalar (route + anaSayfaModu, canlı), MAnasayfa 4 dallı router (canlı),
  MMarkLogo ortak component (topbar mark), PWA ikon seti + manifest.webmanifest, marka logoları (mark/yatay).

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
- **`kullanicilar.foto_url`** DB'de var (text); avatar upload UI ✅ **TAMAMLANDI (209, MProfil)**.

**Hâlâ bekleyen (önceki liste):** ~~MProfil (avatar)~~ ✅ 209, rol etiketi i18n mapping (m_rol_* mevcut),
~~Storage avatar upload~~ ✅ 209, web/mobil dil senkron scripti.

---

## 1. Kullanıcı tipleri (4)

| # | Tip | Kayıt | Ana sayfası | Erişim |
|---|-----|-------|-------------|--------|
| 1 | **Program yöneticisi** | Firma kurulumu / firma_admin | Dashboard (istatistik) | Tüm sistem |
| 2 | **Spool kullanıcısı** (operatör) | ⏳ davet (§4) | İşlemlerim (yetki bloğu) + Uygulamalar | Yetki bloklarına göre |
| 3 | **Uygulama kullanıcısı** | Self-servis (dışarıdan, **yalnız mobil** — 208) | Doğrudan uygulamalar | Yalnız uygulamalar |
| 4 | **Müşteri** | ⏳ (§4) | Kendi projeleri + imalat kayıt PDF | Yalnız kendi projesi (salt-okunur) — web+mobil (208) |

**Router sırası (MAnasayfa) — ✅ CANLI (208):**
```
yönetici  → MAnasayfaYonetici (dashboard)          [yoneticiMi(k)]
müşteri   → MMusteri (şimdilik placeholder)         [musteriMi(k) = rol==='musteri']
bloğu var → MIslemler (+ uygulamalar)               [gruplar.length > 0]
diğer     → MUygulamalar anaSayfaModu (doğrudan)    [else]
```
> Eski "🔒 yetki tanımlanmamış" hata ekranı KALKTI — bloğu olmayan = uygulama kullanıcısı (hata değil).
> **208 NOT:** `musteriMi` rol-temelli (`yoneticiMi` kalıbı). customers↔kullanicilar bağı DB'de YOK
> (teşhis 208) → bugün hiç tetiklenmez; §7-3 müşteri turunda bağ kurulup gerçek ekran (MMusteri) gelince dolar.

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

> **208 NOT:** 4 uygulama da şu an **YAKINDA** (kullanıma kapalı). MUygulamalar ekranı canlı (route + anaSayfaModu),
> kartlar YAKINDA-rozetli. İlk aktif uygulama (Birim Çevirici) açılınca ücretlendirme/paket katmanı ayrı tur (§11, MK-208.1).

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
- **208 NOT:** uygulama kullanıcısı kaydı **yalnız mobilden** (web'den genel müşteriye kullanıcı oluşturtulmaz).
- Spool sayfalarına erişim engelli (RLS + route guard).
- ✅ DB modeli (207 kilit): yeni `rol='uygulama'` + ortak "uygulama" tenant'ı (tenant_id NOT NULL → null model riskli).

### Spool kullanıcısı (firma personeli)
Aynı uygulamadan girer; spool erişimi için yetkilenmesi gerekir.
- **(A) Davet kodu/linki:** yönetici kod üretir → personele verir → personel kodu girer → tenant'a bağlanır → yönetici blok atar.
- **(B) Yönetici doğrudan ekler:** yönetici e-postayla oluşturur → davet maili → personel şifre belirler → tenant+yetki hazır.
> Öneri: saha için (A) davet kodu pratik; davet linki = (A)+(B) karışımı en modern.
> ✅ KARAR (207): **B** (yönetici davet, web OTP+upsert akışı). A (davet kodu) = park.

### Müşteri
- ⏳ Firma yöneticisi müşteri hesabı açar + projeye bağlar. Müşteri yalnız kendi projesini görür (RLS),
  biten spoollar için imalat kayıt dosyası PDF indirir.
- **208 NOT:** Müşteri hem web hem mobilden girer (sorun değil — kimlik platform-bağımsız, MK-208.1).
  customers↔kullanıcı bağı DB'de YOK (teşhis 208) → §7-3 turunda kurulmalı.

### ⏳ Üst-soru: tek hesap çoklu rol?
Dışarıdan kaydolan biri sonra firmaya katılabilir mi? Davet kodu modeli bunu doğal çözer
(uygulama kullanıcısı kod girince spool erişimi açılır) — "tek esnek ana sayfa" mantığıyla tutarlı.
> ✅ KARAR (207): Çoklu rol = bedava. `upsert(onConflict:email)` davet gelince rol+tenant'ı günceller.

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

**KİLİTLENDİ (oturum 207, DATA-first):**
1. ✅ **§4 Spool kullanıcısı kaydı = B** (yönetici davet). Web `kullanicilar.html` akışı: `auth.signInWithOtp`
   + `kullanicilar.upsert(onConflict:email)`, endpoint'siz → mobile'a birebir. A (davet kodu) = 53+ park.
2. ✅ **§4 Uygulama kullanıcısı = yeni `rol='uygulama'` + ortak "uygulama" tenant'ı.** Gerekçe: `tenant_id
   NOT NULL` → nullable yapmak tüm RLS'i riske atar; yeni rol = sıfır migration. signUp ile self-servis.
4. ✅ **§4 Tek hesap çoklu rol = bedava:** `upsert(onConflict:email)` davet gelince mevcut satırın rol+tenant'ını
   günceller (uygulama→spool doğal geçiş).
3. ⏳ **§4 Müşteri:** `customers` tablosu hazır → ayrı tur (RLS kapsamı).

**KİLİTLENDİ (oturum 208):**
- ✅ **MK-208.1 İş modeli** — 3 erişim katmanı + platform-bağımsız kimlik + market engelleri PARK (§11 tam metin).
  Özet: (1) ücretli kurumsal SaaS = teklif usulü, off-app ödeme, "hesap istemcisi"; (2) müşteri izleme = ücretsiz,
  web+mobil, salt-okunur; (3) halka açık uygulama = mobil-kayıt, şimdilik ücretsiz → ileride abonelik.
- ✅ **Sıra 2 (`musteriMi`) + Sıra 3 (4 dallı router)** canlı. customers↔kullanıcı bağı DB'de YOK → musteriMi rol-temelli.

**HÂLÂ AÇIK (sonraki turlar):**
5. ✅ **§8 Yönetici dashboard — atıl kullanıcı sayacı TAMAMLANDI (209, 5b).** "durdurulmuş spool" bandının
   ikizi olarak `son_giris < now()-30g` (NULL hariç) bandı kuruldu (MK-207.2). `son_giris` MGiris'te damgalanıyor.
   Dashboard içeriğinin geri kalanı (ek widget vb.) hâlâ açık.
6. **§3** Bottom nav QR butonu etiketi ("spool bul" mu?).
7. **§2** İlk aktif uygulama (öneri: Birim Çevirici — saf hesap, AI maliyeti yok).
8. **§6** Yönetici spool işlem aksiyonu yapabilir mi (Denetim dışında)?
9. **§11 (208 yeni)** Topbar mark animasyonu iOS Safari fix — web kalıbı (beginElement) mobilde tutmadı.

> ÇÖZÜLDÜ: Mimari = native React (§0) · Çatal = native toplamsal (§6) · Kayıt §7-1/2/4 (207) ·
> Router + musteriMi (208) · İş modeli MK-208.1 (208, §11) ·
> Sıra 4/5a/5b/6 + atıl sayacı + MProfil + son_giris damgası (209).

---

## 8. Kod planı (native React)

| Sıra | İş | Bağımlılık |
|------|-----|-----------|
| 1 | ✅ **TAMAMLANDI (207)** `lib/uygulamalar.js` + `MUygulamalar.jsx` + `/uygulamalar` route + 48 dil anahtarı. Canlı doğrulandı (route modu). | — |
| 2 | ✅ **TAMAMLANDI (208)** `yetki.js`: `musteriMi` (rol-temelli). "Uygulama kullanıcısı tespiti" ayrı fonksiyon DEĞİL → router else dalı. | §7-2 |
| 3 | ✅ **TAMAMLANDI (208)** `MAnasayfa.jsx` 4 dallı router (canlı). MMusteriPlaceholder iç component. | §4 |
| 4 | ✅ **TAMAMLANDI (209)** `MIslemler.jsx`: işlem butonları + Uygulamalar butonu (📚 `/uygulamalar`); 🔒 boş durum kalktı. | §3 |
| 5 | ✅ **TAMAMLANDI (209)** `MAnasayfaYonetici.jsx`: Uygulamalar linki (5a) + atıl kullanıcı bandı (5b, MK-207.2). | §7-5 |
| 6 | ✅ **TAMAMLANDI (209)** `MProfil.jsx` (avatar `foto_url`+Storage client upload / bilgiler salt-okunur / şifre reset / hesap-sil soft-delete) + `/profil` route + MProfilSayfasi wrapper + 20×3 i18n. | mockup-first |
| 7 | `MMusteri.jsx` (yeni — placeholder yerine) | §7-3, mockup-first |
| 8 | Kayıt/davet akışı (kod + DB) | §7-1 — en büyük iş |
| 9 | Spool detay çatalı: IbSpoolDetay'a "Denetim" sekmesi + MSpoolDetay emekli | §6 — **önce IbSpoolDetay.jsx yerini bul (screens/'da YOK)** |
| 10 | Kesim/Büküm/Markalama native React işlem ekranları (saha düzeni) | büyük, ayrı turlar |

**Sıra 1–6 tamamlandı (207–209).** Sonraki: Sıra 7 (MMusteri — önce `customers`↔kullanıcı DB bağı kurulmalı,
208 teşhisi: bağ YOK) → Sıra 8 (kayıt akışı, en büyük) → Sıra 9 (çatal — önce IbSpoolDetay.jsx yeri bulunmalı).
Devreden debt: topbar animasyon iOS fix (§11) + üyelik paketi abonelik bağı (§11).

---

## 9. Disiplin / mobil kuralları

- Mockup-first (R-10): yeni ekran kodlanmadan mockup + onay.
- i18n (R-08): hardcode YASAK, `tv()`, tr/en/ar üçü birden. Tema (R-09): `useTema()`, direct DOM yok.
- `kullanicilar.ad` → `ad_soyad`; tenant ayrı sorgu; JWT anon key; `kullanici_bloklar` INSERT'te tenant_id.
- "M" ön eki; eldivenli el için buton min 72px; iOS checklist (CLAUDE-MOBILE.md).
- Storage bucket `arespipe-dosyalar` (avatar / parça tanıma foto).
- Dil: root `lang/{tr,en,ar}.json` canonical; `mobile/src/lang/` prebuild ile üretilir — elle düzenleme yok.
- Kod commit `[skip ci]` YOK; doküman commit `[skip ci]` VAR.
- ≤12 api fonksiyonu (MK-129.3) — kayıt/davet endpoint'i gerekirse consolidasyon şart (veya MK-207.1: Pro).
- **(208) Python patch'lerde heredoc yerine `python3 << EOF` + `repr()` güvenli** — heredoc kopyala-yapıştırda
  tırnağa takılıyor (208'de birkaç kez `quote>` / açık-heredoc kazası, Ctrl+C ile kurtarıldı).
- **(208) `<img src=*.svg>` içindeki animasyon JS'ten tetiklenemez** → inline SVG + `dangerouslySetInnerHTML` zorunlu.
- **(209) Avatar/dosya upload client-side çalışır:** `arespipe-dosyalar` private ama INSERT politikası
  ("Authenticated upload" + tenant_yazma) izin veriyor; path **`{tenant_id}/avatar/{id}.jpg`** ile SELECT
  (tenant) politikası da uyumlu → `supabase.storage.from(...).upload()` yeter, **yeni endpoint GEREKMEZ**.
  Görüntüleme: `dosyaUrlAl(yol)` (private bucket signed-url endpoint'i). Cache-bust: `<img key={ts}>`.
- **(209) `kullanicilar.firma` text kolonu DOĞRUDAN var** → firma adı için `tenants` JOIN gerekmez.
- **(209) `gpc` davranışı:** commit'i kendi yapıp ikinci kez "nothing to commit"te zinciri kesiyor (non-zero
  exit → `&& gp` atlanır). Workaround: ayrı `git commit` + tek başına `gp`. Çift-uygulanan Python patch
  anchor'ı 0 bulup ABORT eder (zararsız, `.bak` almadan durur — MK-111.2 koruması).
- Tam tasarım sistemi/checklist için her zaman `CLAUDE-MOBILE.md`'yi de aç (bu belge ona referans verir).

---

## 10. Marka / logo entegrasyonu (208 — YENİ)

Marka kaynak klasörü: `assets/marka/` (web'de zaten dolu). Mobile'a kopyalanan dosyalar `mobile/public/`.

**Entegre edilenler (canlı):**
- **PWA ikonları:** `icon-180/192/512/1024.png`, `favicon-16/32.png`, `arespipe-favicon.svg`.
  `manifest.webmanifest` (name: AresPipe, display: standalone, theme #0f1115, icons 192/512 maskable).
  `index.html` head: apple-touch-icon, manifest linki, theme-color, `<title>AresPipe</title>`, `lang="tr"`.
  → Safari "ana ekrana ekle" kısayolu artık gerçek AresPipe ikonu (eski kısayol cache'li → silip yeniden ekle).
- **Giriş ekranı (MGiris):** "AP" text → **inline SVG yatay logo** (web giris.html satır 230 birebir).
  Tema-değişkenli (`var(--tx/--ac/--bg)`) → tek SVG her temada çalışır. Açılışta bir kez **tarama animasyonu**
  (`useRef` + `.ares-tara-anim` `beginElement()`, 250ms gecikme). **ÇALIŞIYOR.**
- **Topbar mark (4 ekran):** "AP" text → mark SVG. Ortak `MMarkLogo.jsx` component (MK-109.1 — tek çekirdek,
  4 yer çağırır). Topbar stil sadeleşti (mavi kutu kalktı, mark kendi renkleriyle).

**Marka logo varyantları (mobile/public'te):**
- `arespipe-mark.svg` (statik kare, 84×84), `arespipe-mark-anim-bk.svg` (bir-kez animasyonlu).
- `arespipe-logo-yatay.svg` + `-koyu.svg` (statik yatay, 381×100). Giriş ekranı inline SVG kullandığı için
  bu iki dosya şu an import edilmiyor ama mobile/public'te duruyor (zararsız, ileride lazım olabilir).

**Tema mekanizması (web ile aynı):** `document.documentElement.setAttribute('data-theme', tema)`.
İki tema: `light-anthracite` (varsayılan, açık #d8dde4) + `dark` (#0d1117). Web logo deseni `[data-theme=dark]`
selektörüyle çalışır → mobile'a birebir taşınır.

---

## 11. İş modeli + market (MK-208.1 — YENİ)

> Tam karar metni `docs/KARARLAR.md` MK-208.1'de. Burada strateji özeti.

**Üç erişim katmanı, tek kod tabanı, tek kimlik:**

| Katman | Kim | Ödeme | Erişim |
|--------|-----|-------|--------|
| **Asıl ürün (SaaS)** | İmalat firmaları (önce biz → başka atölyeler → imalat+montaj) | **Ücretli** — teklif usulü, **off-app** | Tam program (spool yaşam döngüsü). `tenant_id` izolasyonu |
| **Müşteri izleme** | Firmanın müşterisi | **Ücretsiz** ("kendi işini takip için para ödemez") | Salt-okunur, yalnız kendi projesi. `customers` + RLS. Web+mobil |
| **Halka açık uygulama** | Dışarıdan herkes | Şimdilik ücretsiz → ileride abonelik | Yalnız Uygulamalar. `rol='uygulama'` + ortak tenant. Mobil-kayıt |

**Platform-bağımsız kimlik:** Aynı e-posta+şifre = aynı `auth.users` = aynı `kullanicilar` satırı.
iOS/Android/web yalnız istemci. Çoklu cihaz/platform = sıfır kimlik riski. Abonelik **kişiye** bağlanır
(store'a değil); `tenant_features`/`feature_flags` + `kullanicilar` satırı üstünde. Store makbuzu →
kullanıcı entitlement uzlaştırması (receipt validation) ödeme turunda.

**Sıralama:** kimlik (hazır) → router (208 ✅) → kayıt akışı (Sıra 8) → ≥1 aktif uygulama → abonelik/paket (ayrı tur).
Para katmanı, satılacak çalışan ürün + kaydolacak kullanıcı olmadan kurulmaz.

**Market engelleri = ŞU AN PARK (aktif risk değil):** Dağıtım Safari PWA kısayolu, market gönderimi YOK →
App Store/Play inceleme süreci devrede değil. Engeller yalnız ileride markete native binary gönderilince aktifleşir:
- **G-4.2 (PWA/WebView reddi):** Native React (§0) doğru zemin; iOS'ta native özellik kanıtı gerekir.
  Android (TWA) kolay, iOS aynı PWA'yı reddedebilir.
- **G-3.1.1 (ödeme) — B2B lehine:** Kurumsal SaaS off-app teklif usulü → "hesap erişim istemcisi" istisnası,
  IAP zorunlu DEĞİL. **KRİTİK:** mobilde web satın alma linki/butonu/"sitemizden abone ol" metni OLMAZ.
  Risk sadece gelecekteki halka açık tüketici aboneliğinde (mobilde IAP).
- **G-2.1 (eksik uygulama):** YAKINDA kartlar ret riski → gönderimde ≥1 uygulama çalışır olmalı.
- **Gizlilik (2026 sıkı):** App Privacy etiketi + AI bildirimi (Parça Tanıma Vision AI) + Gizlilik Politikası + KVKK/ToS.

**Açık debt (210'a taşındı):** Topbar mark animasyonu iOS Safari'de tutmadı. SMIL `beginElement()` (web kalıbı) +
CSS keyframes denendi, ikisi de iOS'ta görünmedi/takıldı. Giriş animasyonu ÇALIŞIYOR (aynı yöntem) → fark
muhtemelen mount timing / Safari cache. Kod hazır (`MMarkLogo.jsx` + `arespipe-mark-anim-bk.svg`).
Seçenek: (A) web yöntemini birebir taşı + iOS teşhis, (B) kabul edilebilir bırak (mark statik görünüyor).
Statiğe DÖNÜLMEDİ — web statik kullanmıyor, animasyon hedefi korunuyor. **209'da dokunulmadı.**

**Üyelik paketi debt (209 — YENİ):** MProfil'de üyelik paketi **statik "Kurumsal"** gösteriliyor + ekranda
uyarı notu ("henüz aboneliğe bağlı değil — yakında"). Gerçek abonelik altyapısı (tenant_features / paket alanı)
gelince bu alana bağlanmalı. Sıraya alındı — kayıt akışı (Sıra 8) + ≥1 aktif uygulama sonrası para katmanıyla birlikte.
