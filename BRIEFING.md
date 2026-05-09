# AresPipe BRIEFING — 70. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 9 Mayıs 2026, 70 kapanışı (4 commit canlıda + 1 manuel RLS migration uygulandı, 70b.A + 3f.1 saha doğrulaması RLS fix sonrası 71'e devredildi)

---

## 🎯 71. Oturum Gündemi

**Birincil iş 1 — SED-71-01: 70b.A saha doğrulaması (RLS fix sonrası).** 70'in son saatinde keşfedildi: `is_kayitlari` tablosunda eski `tenant_isolation` policy'si `with_check NULL` ile silent INSERT fail üretiyordu. Manuel SQL ile `is_kayitlari_tenant` policy'si `get_tenant_id()` pattern'ine geçirildi (Supabase Studio'da, repo'da migration YOK). Bu fix'ten sonra Cihat henüz yeni İşe Başla testini yapmadı. 71'in ilk işi: iPhone Safari cache temizle → demo.imalatci ile yeni Bekliyor spool seç → İşe Başla → `is_kayitlari` SELECT ile kayıt oluştu mu doğrula. Eğer tamamsa 70b.A canlıya tam geçmiş olur. Hâlâ "no rows" dönerse derinlemesine debug.

**Birincil iş 2 — SED-71-02: RLS migration repo'ya.** Manuel uygulanan policy değişikliği (DROP `tenant_isolation` + CREATE `is_kayitlari_tenant`) `migrations/034_is_kayitlari_rls_get_tenant_id.sql` olarak repo'ya eklenir (033'ten sonra, MK-66.1 sıralı disiplini). Yoksa staging/prod ortamlarında bu RLS bug tekrarlar.

**Birincil iş 3 — 70b.C: Aynı rolde aktif iş engeli.** Cihat'ın net isteği: *"devam eden işim varken yeni iş açamamam lazım, bu da yapılmadı galiba"*. IbQRTara'da kontrol gerekli: spool fetch sonrası `aktifIsHatirla(seciliRol.ad)` çağrılır, aktif iş varsa VE farklı spool ise akış-kesici drawer "Zaten aktif <rol> işin var: <spool_no>. Önce kapat." Veya yumuşak yönlendirme: "Direkt o spool'a git" butonu.

**Birincil iş 4 — 70b.B: IbRolSec göstergeleri (mockup-first R-10).** Cihat'ın net isteği: *"imalatın kutusunun sağ tarafında yanıp sönen bir devam ediyor yazısı çıksın, buraya basınca direk iş başlat ekranına gelsin"*. IbRolSec'te her rol kartında `aktifIsHatirla(rol.ad)` check, aktif iş varsa yanıp sönen "DEVAM EDİYOR" badge sağ tarafta. Tıklama: aktifIs varsa onSpool callback → MIsBaslat IbQRTara'yı atlar, direkt IbSpoolDetay'a yönlendirir.

**Birincil iş 5 — SED-71-03: 3f.1 saha doğrulaması.** 70b.A test edildikten sonra: spool aç → İşi Kapat → Tamam, kapat → `is_kayitlari` SELECT, `bitis IS NOT NULL`, `sure_dakika > 0` (gerçek hesap). Eski 3f.1'de `sure_dakika=0` yazılıyordu, 70b.A UPDATE pattern'iyle gerçek süre hesaplanmaya başlamalı.

**Bilinçli ertelenen birincil işler:**
- 3f.2 (Foto çekme akışı, Storage upload + fotograf_id link, web `isTamamla` pattern'i 1480 satırı) — 71+ ortada bir noktada
- 3f.3 (Sonraki basamak seçim UI, `spooller.aktif_basamak` UPDATE) — 3f.2 sonrası
- 3g (Devral akışı, Cihat'ın saha senaryosu: *"yarım bıraktığı işi başka personel devralıp tamamlayabiliyordu"*)
- 3h, 3i, 3j (Alternatif başla, Not Ekle, İptal Et — şu an placeholder alert)

**Saha kritik web bug'ları (SED-71-04, SED-71-05):**
- SED-71-04: Web `is_baslat.html` `is_kayitlari` INSERT yanlış kolon adlarıyla yazıyor (`kullanici_id, basamak, tarih` — DB schema: `personel_id, islem_tipi, baslangic`). Mobile DB schema'ya doğru yazıyor, web değil. NOT NULL ihlaliyle silent fail. Web tarafı muhtemelen `is_kayitlari` hiç dolduramamıştır.
- SED-71-05: Web `devre_detay.html` tablo `durum` kolonunu okuyor (eski sistem), `is_durumu` kolonunu görmüyor. Mobile `is_durumu='devam_ediyor'` yazıyor ama web'de hâlâ "Bekliyor" görünüyor (DB sorgu kanıtı 70'te alındı: 6 spool `is_durumu='devam_ediyor'` ama hepsinin `durum='Bekliyor'`).

**Diğer açık borçlar (gündem değil, kuyruğa alınmış):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase)
- MK-58.5 — Panel.html mobile preview UUID input alanı
- SED-68-01 — `devre_yeni.html` form validation (proje_no/gemi_adi temizlik kuralı)
- SED-68-02 — i18n borç temizliği (~75 uyarı, ölü anahtarlar dahil: `m_ib_sd_yetki_yok`, `m_ib_uy_yu_alis_baslik/mesaj`)
- SED-68-03 — CI bot push rebase çakışması
- SED-69-01..03, 05 (4 borç, 69'dan)
- SED-69-04 ✅ KAPATILDI — 70 3d-fix2'de IbUyariDrawer'a sertifika sarı kart eklendi
- MK-67.4 — Supabase API key migration (5. kez ertelendi)
- IbRolSec.jsx hardcoded TR sarma (68b borcu)
- DB temizlik — 6 yetim `is_durumu='devam_ediyor'` spool (70'te oluşan test artığı, RLS bug yüzünden `is_kayitlari` kayıtsız kaldı)
- `arespipe-backups` Storage backup fail (MK-67.4 kapsamı)

**Etkilenen dosyalar (71 boyunca):** `mobile/src/components/isbaslat/IbQRTara.jsx` (70b.C kontrolü), `mobile/src/components/isbaslat/IbRolSec.jsx` (70b.B göstergeleri), `mobile/src/screens/MIsBaslat.jsx` (70b.B onRolSec callback), `migrations/034_is_kayitlari_rls_get_tenant_id.sql` (RLS policy migration), `lang/{tr,en,ar}.json`.

---

## ✅ 70'te Yapılanlar

> 70, **3d Yetki + Footer matrisi tam akış (3d temel + 3d-fix2 + 3d-fix3) + 3e İşe Başla DB writes + 3f.1 İşi Kapat onay drawer + DB writes + 70b.A Çoklu aktif iş + DB-truth persistence + 1 manuel RLS migration** üretti. 4 commit canlıda, ~890 satır net değişiklik. Son saatte kritik bir RLS bug keşfedildi ve manuel SQL ile düzeltildi (repo'ya migration 71'de eklenecek). Saha test 3 commit için tam ✅, 70b.A + 3f.1 için RLS fix sonrası bekleyen.

### 1. 3d — Yetki gate + Footer matrisi (commit `da93bf1`, +287/-74)

**3d temel:** Durum × yetki Footer branch matrisi (bekliyor + yetkili → İşe Başla, bekliyor + yetkisiz → sadece Başka Spool, devam_ediyor + benimMi → 3'lü buton). `aktifBasamakYetkili(spool.aktif_basamak, bloklar)` helper'ı `mobile/src/lib/yetki.js`'den import edildi, MIsBaslat'tan IbSpoolDetay'a `bloklar` prop geçirildi.

**3d-fix2:** Yetkisizlik akış-kesici drawer (kırmızı + kilit ikonu, "Bu basamak için yetkili değilsiniz."). Drawer kapatılınca yumuşak uyarılar zincirleme açılır. **Sertifikalı malzeme yumuşak kart eklendi (mavi)** — SED-69-04 saha kritik borcu burada kapandı. Yumuşak kart paleti pastel'den doygun renge çevrildi (Anthropic 100/200 + 4px sol accent + ikon her karta). 4 ayrı renk: alıştırma kırmızı, sertifika mavi, test mor, not amber.

**3d-fix3:** alıştırma=VAR ve KISMI **farklı mesaj** (eskiden aynıydı). KISMI yeni kategori 'alistirma_kismi' coral palet (kırmızıdan ayrı). VAR + kaynakçı rolü → yeni 'tamAlistirmaKaynak' akış-kesici drawer.

**Saha test:** ✅ Tamamlandı — yetki gate çalışıyor, palet doygun, 4 renk net, alıştırma semantik düzgün.

### 2. 3e — İşe Başla DB writes (commit `824d6ec`, +99/-5)

`iseBasla()` async hâle getirildi (alert placeholder kaldırıldı):
- `spooller` UPDATE: `is_durumu='devam_ediyor'`, `guncelleme=now`
- `aktifIsKaydet` localStorage `ares_is_aktif` yaz
- `setYerelSpool` → Footer otomatik 3'lü butona geçer
- useEffect priority 3 düzeltildi: `yerelSpool.aktif_isci_id` (DB'de yok) → `aktifIsHatirla` (localStorage)

Yeni helper'lar `lib/isbaslat.js`: `aktifIsKaydet`, `aktifIsHatirla`, `aktifIsUnut`. **Web pattern: `is_kayitlari` INSERT yapılmaz** (web `is_baslat.html:1131` `isBaslatDB`'da da yok). INSERT 3f'de yapılacak — bu mobil seçimi 70b.A'da değişti (3e'de aktif kayıt olarak yazılır oldu).

**Saha test:** ✅ Tamamlandı — İşe Başla → Footer 3'lü buton, telefon kapat → tekrar aç → drawer çıkmıyor.

### 3. 3f.1 — İşi Kapat onay drawer + DB writes (commit `8d8a4b6`, +226/-10)

"İşi Kapat" butonu çalışıyor:
- Yumuşak uyarı VAR (alıştırma/test/not/sertifika) → yumuşak drawer 'kapat' modu (full-screen modal, "Son kontrol" başlığı, kart listesi, Vazgeç/Tamam,kapat)
- Yumuşak uyarı YOK → sade onay drawer (`IbUyariDrawer` 'kapatOnay' tipi, kırmızı + soru ikonu)

DB writes (3f.1 dönemi, 70b.A'da değişti):
- `is_kayitlari` INSERT (DB schema'ya UYGUN): `personel_id, islem_tipi, baslangic, bitis, sure_dakika=0, qr_baslangic=true`
- `spooller` UPDATE: `is_durumu='bekliyor'`, `guncelleme=now` (`aktif_basamak` DEĞİŞMEZ — 3f.3'te ilerletilecek)

`aktifIsUnut()` + `navigate('/')` Hub'a. `yumusDrawerAcik` (boolean) → `yumusDrawerMod` (null|'peek'|'kapat') refactor.

**Saha test:** 🟡 RLS fix sonrası bekleyen — `is_kayitlari` INSERT'i RLS bug'ı yüzünden silent fail ediyordu.

### 4. 70b.A — Çoklu aktif iş + DB-truth persistence (commit `49e3c4d`, +280/-74)

**Saha senaryosu (Cihat):** İmalatçı imalata başlar, kapanmadan kesim'de de iş başlatabilir (farklı roller). Mesai sonu/ertesi gün/telefon kapatma sonrası açık işler localStorage'dan kaybolsa bile DB'den geri okunur.

`mobile/src/lib/isbaslat.js` (+121 satır):
- localStorage çoklu format: `{ '<rolAd>': { spoolId, basamak, baslangic } }`
- `aktifIsKaydet/Hatirla/Unut`: rol parametreli (geri uyumlu)
- `aktifIslerTumu`: 70b.B IbRolSec göstergeleri için
- `aktifIsleriDBdenSenkronize(supabase, kullaniciId)`: `is_kayitlari WHERE bitis IS NULL` → localStorage
- `_basamakToRolAd`: heuristik (imalat→İmalat, kaynak→Argon Kaynağı varsayılan)
- Eski `{id, rol}` formatı otomatik dönüştürülür

`mobile/src/components/isbaslat/IbSpoolDetay.jsx` (+69 satır):
- 3e `iseBasla`: `is_kayitlari` INSERT eklendi (`bitis=null` aktif kayıt). Rollback: spooller UPDATE fail ederse INSERT silinir
- 3f.1 `handleKapatOnayli`: INSERT yerine UPDATE pattern (SELECT bitis null + UPDATE bitis=now + sure_dakika hesaplanmış GERÇEK SÜRE; aktif kayıt yoksa fallback INSERT)
- `aktifIsUnut(rolAd)` sadece o roldeki kayıt silinir, diğer rollerdeki aktif işler korunur

`mobile/src/screens/MIsBaslat.jsx` (+16 satır):
- Yeni useEffect: `kullanici?.id` değişimi → `aktifIsleriDBdenSenkronize(supabase, kullanici.id)`
- Operatör login sonrası DB-truth ile localStorage tazelenir

**Saha test:** 🟡 RLS fix sonrası bekleyen.

### 5. RLS Bug Keşfi ve Manuel Fix (KRİTİK, repo'da migration YOK)

70'in son saatinde DB sorgularıyla bulundu: `is_kayitlari` policy'si silent fail üretiyordu.

**Eski (problem):**
```sql
qual:       tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
with_check: NULL
```

PostgreSQL RLS chaining: `kullanicilar` tablosunun kendi RLS'i subquery'yi engelliyor → NULL → false → silent INSERT reddi.

`spooller` policy'si daha sağlam: `tenant_id = get_tenant_id()` (SECURITY DEFINER function, JWT app_metadata/root claim/DB fallback ile COALESCE).

**Manuel fix Supabase Studio'da uygulandı:**
```sql
DROP POLICY IF EXISTS tenant_isolation ON is_kayitlari;
CREATE POLICY is_kayitlari_tenant ON is_kayitlari
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());
```

✅ Policy uygulandı, `pg_policies` SELECT doğruladı.
❌ **Repo'da migration dosyası YOK** — SED-71-02 ile 71'de eklenecek.

### 6. MK-70 Kararları (3 yeni)

- **MK-70.1 [DISIPLIN]** — Mobile-DB schema-first, web pattern ikincil. R-06 mutlak değil; web INSERT yanlış kolon adları kullanıyorsa mobile DB schema'yı izler.
- **MK-70.2 [DISIPLIN]** — Silent fail yakalama. Supabase mutation'larında `.select().single()` chain'i veya count kontrolü tercih edilir.
- **MK-70.3 [MIMARI]** — RLS policy review. Yeni tablolarda subquery yerine `get_tenant_id()` SECURITY DEFINER pattern'i.

Detay: `docs/KARARLAR.md`.

### 7. Net dosya kanıtı (70 sonu)

```
mobile/src/components/isbaslat/IbSpoolDetay.jsx  MD5 1edf4f08b31dd2c6c5e8e132b4079c0d  ~2080 satır
mobile/src/components/isbaslat/IbUyariDrawer.jsx                                     ~329 satır (3 yeni case)
mobile/src/lib/isbaslat.js                       MD5 69f787fed6947901194756b779110bfa  467 satır
mobile/src/screens/MIsBaslat.jsx                 MD5 6d9bc80d40bd58403791255b874250bb  263 satır
lang/tr.json                                                                          1872 satır
lang/en.json                                                                          1872 satır
lang/ar.json                                                                          1872 satır
```

### 70'te yapılmayanlar (bilinçli)

- **70b.B (IbRolSec göstergeleri)** → 71. oturum birincil iş 4
- **70b.C (Aynı rolde aktif iş engeli)** → 71. oturum birincil iş 3
- **3f.2/3 (Foto çekme + sonraki basamak seçim)** → 71+
- **3g/3h/3i/3j (Devral, Alternatif, Not Ekle, İptal Et)** → 71+
- **RLS migration repo'ya** → SED-71-02
- **DB temizlik (6 yetim spool)** → 71+ küçük
- **i18n borç temizliği SED-68-02** → ~75 uyarı, daha biriktirildi
- **Web bug'ları SED-71-04, 05** → web tarafına müdahale, 71+
- **Supabase API key migration (MK-67.4)** → 5. kez ertelendi
- **`oturum-saglik.sh 70 --kapanis`** → 71 açılışında BAYAT/TEMİZ kontrol edilir

---

## 📚 Bilgi Haritası

> Hangi soruda hangi dosyaya bakacağını söyler. Kategori belgeleri (sahip + tazelik penceresi) yıldızla işaretli.

**Vizyon ve mimari:**
- `docs/SPOOL-AI-VIZYON.md` — AI özelinde vizyon v2.1
- `docs/AI-VE-3D-VIZYON-v3.md` — Operasyonel veri merkezli vizyon v3
- `docs/VIZYON-VE-MODULER-MIMARI.md` — Modüler altyapı taahhütleri
- `docs/KUTUPHANE-KAPSAM.md` — Standart kütüphane kapsam haritası
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` — P0 kütüphane yükleme trajektorisi
- ⭐ `docs/VIZYON-OTURUMLARI.md` — Vizyon/strateji sohbetleri (61'de doğdu)

**Karar ve süreç:**
- `docs/KARARLAR.md` — Tüm MK kararları (70 sonu: MK-70.3'e kadar — 70.1/70.2/70.3 bu oturumda eklendi)
- ⭐ `docs/CIHAT-PROFIL.md` — Cihat'ın çalışma stili + Claude'un farkındalıkları
- `docs/CLAUDE-CALISMA-MODU.md` — Claude'a canlı talimatlar
- `CLAUDE.md` — Geliştirme kuralları (web + global)
- `CLAUDE-MOBILE.md` — Geliştirme kuralları (mobil)

**Operasyonel:**
- `docs/SAYFA-EKSIKLERI.md` — Sayfa bazlı eksik tespit metodu (70 sonu: SED-71-05'e kadar — 71-01..05 70'te eklendi, SED-69-04 ✅ kapatıldı)
- `docs/IZOMETRI-BATCH-KARAR.md` + `docs/IZOMETRI-BATCH-NOTLARI.md` — İzometri batch parser
- `docs/L2-PARSER-NOTLARI.md` — L2 deterministik parser kararları
- `docs/KAPANIS-ORKESTRA-TASARIM.md` — Kapanış orkestra protokolü tasarımı
- `scripts/oturum-saglik.sh` — Oturum açılış/kapanış sağlık scripti
- `migrations/` — DB şema değişiklikleri (000_initial → 033 + manuel uygulanan RLS fix 034 olarak repo'ya 71'de eklenecek)
- `docs/ROADMAP.md` — Faz B/C planı

**Onboarding:**
- `docs/ONBOARDING.md` — Yeni geliştirici giriş yolu

**Arşiv (referans, aktif değil):**
- `docs/arsiv/CLAUDE-SON-OTURUM-65-yanlis-yazim.md`
- `docs/arsiv/CLAUDE-SONRAKI-OTURUM-65-yanlis-yazim.md`
- `docs/arsiv/son-durum-65-yanlis-yazim.md`

---

## 📊 70 Sonu Sayılar

- **i18n anahtarları (kök `lang/`):** 1872 (69'da 1854, 70'te +17 — 3d/3e/3f.1 için yumuşak kart başlık+mesaj, kapatOnay drawer, sertifika kart, alıştırma KISMI, tamAlistirmaKaynak akış-kesici). Trend: 62→1752, 63→1800, 64→1816, 65→1834, 66→1834, 67→1834, 68→1841, 69→1854, **70→1872**
- **Mobil ekran sayısı:** 9 tam ekran + MIsBaslat hub'ında 3 alt ekran (IbRolSec, IbQRTara, IbSpoolDetay) + 1 ortak component (IbUyariDrawer ~329 satır) + 1 ortak (MDrawer). ⏳ Bekleyen: 3f.2 foto akışı, IbRolSec göstergeleri (70b.B)
- **Toplam MK kararı:** MK-70.3'e kadar (70'te +3)
- **Sayfa eksikleri:** SED-71-05'e kadar (70'te +5: SED-71-01..05; SED-69-04 ✅ kapatıldı)
- **Migration dosyası:** 33 (RLS fix manuel uygulandı, 71'de 034 olarak repo'ya eklenecek)
- **CI:** ✅ 4 commit yeşil (`da93bf1`, `824d6ec`, `8d8a4b6`, `49e3c4d`)
- **HEAD:** `49e3c4d` (briefing commit'i sonrası güncellenecek)
- **Lint:** Faz B baseline'ı korundu, ~75 i18n uyarı borcu açık (SED-68-02)
- **Vercel env var:** `VITE_API_BASE=https://arespipe.vercel.app` (`arespipe-mob` Production+Preview)

---

## 🔄 70'ten 71'e Geçiş Notları

- **MK-65.8 + MK-56.4 disiplini henüz çağrılmadı bu kapanışta** — Cihat 71 açılışında `oturum-saglik.sh 70 --kapanis` çalıştırarak BAYAT/TEMİZ kontrol etmeli.
- **71'in ilk işi RLS fix sonrası saha doğrulaması.** 70'in 4 commit'i canlıda ama 70b.A + 3f.1 RLS bug yüzünden silent fail ediyordu. Manuel SQL fix sonrası test edilmedi. **Bu test olmadan 70b.B veya 70b.C'ye geçilmemeli** — kritik bağımlılık.
- **MK-70.1/70.2/70.3 KARARLAR.md'ye eklendi** — 71 başında bu briefing içeriğiyle tutarlı.
- **SED-71-01..05 SAYFA-EKSIKLERI.md'ye eklendi.** SED-69-04 ✅ kapatma notu eklendi (3d-fix2'de IbUyariDrawer'a sertifika sarı kart eklendi).
- **70b.B + 70b.C Cihat'ın net saha senaryosundan doğdu.** İkisi birlikte 71'de ana kapsamı oluşturur.
- **MK-70.1 yetkisi canlı:** Web pattern referans alma disiplini (R-06) mutlak değil.
- **Üst bant kuralı (MK-68.3) canlı:** `proje_no` only, `gemi_adi` UI'a sızmaz.
- **Ib-prefix konvansiyonu (MK-68.4) canlı.**
- **Lang tek kaynak (MK-68.5) canlı:** Yazılır kök `lang/`, üretilir `mobile/src/lang/`.
- **Supabase API key migration (MK-67.4) 5. kez ertelendi.**
- **CI bot push rebase çakışması (SED-68-03):** Hâlâ açık.

---

## 🎯 Açılış Ritüeli (71 için)

```bash
cd /Users/cihatoztas/Desktop/arespipe
git pull origin main
./scripts/oturum-saglik.sh 70
cat BRIEFING.md
```

Sağlık scripti yeşilse Claude'a `cat BRIEFING.md` çıktısı yapıştırılır.

**71. oturum ilk pratik adımlar (SED-71-01):**

1. iPhone Safari → Settings → Safari → Clear History and Website Data
2. demo.imalatci@arespipe.dev / Demo1234! ile giriş
3. Bekleyen yeni spool seç (mevcut 6 yetim devam_ediyor olanları DEĞİL) → İşe Başla
4. Supabase Studio:
   ```sql
   select spool_id, personel_id, islem_tipi, baslangic, bitis, qr_baslangic
   from is_kayitlari
   order by olusturma desc
   limit 3;
   ```
   Beklenen: yeni satır, `bitis=NULL`, `personel_id='9aecf3aa-2e99-448b-9a06-7611bf5940dc'`, `qr_baslangic=true`.

Test başarılıysa 70b.A canlıya tam geçmiş olur. Sonra **SED-71-02 (RLS migration repo'ya)**, ardından **70b.C + 70b.B**.

**Açılışta özgür tasarım sunulmaz** (MK-66.3). 70b.B mockup'ı IbRolSec'in mevcut yapısı + Cihat'ın net isteği referansıyla hazırlanır.

**70'in dersi (MK-70.2 + MK-70.3):** RLS bug silent fail üretti ve 4 commit boyunca tespit edilmedi. Yeni Supabase mutation'larında `.select().single()` tercih edilir; yeni RLS policy'si yazılırken `get_tenant_id()` SECURITY DEFINER pattern kullanılır.
