# AresPipe BRIEFING — 68. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 7 Mayıs 2026, 68 kapanışı (`oturum-saglik.sh 68 --kapanis` MK-65.8 disiplinine uygun çalıştırıldı, MK-56.2 + MK-56.4 canlı kalıyor)

---

## 🎯 69. Oturum Gündemi

**Birincil iş 1: Supabase API key migration (MK-67.4 borç).** 67-68 boyunca ertelenen migration. Mobil + web hâlâ legacy JWT key'leriyle çalışıyor (Supabase grace period). Yapılacaklar:
1. Supabase Dashboard'da yeni `sb_secret_*` oluştur, GitHub Secrets güncelle (`SUPABASE_SERVICE_KEY`)
2. Mobil `mobile/src/lib/supabase.js` + web `ares-store.js` + `admin/index.html` + `sw.js` eski JWT → yeni `sb_publishable_*` migration
3. Vercel env vars (web + mob projeleri) update — kontrollü migration için önce yeni key'i ekle (eski JWT yanına), test et, sonra eski JWT'yi sil
4. `arespipe-backups` workflow temizle: S3 mantığı sil (zaten yanlış), sadece HTTP API kullan
5. Smoke test: mobil giriş, web giriş, RLS kontrolleri (66'da fix'lenen 5 tablo + tenant_features), backup workflow re-run

**Birincil iş 2: IbRolSec.jsx hardcoded TR sarma (68b borcu).** BÜKÜM/İMALAT/ARGON KAYNAĞI/KESIM/MARKALAMA hardcoded TR string'leri `tv()` ile sarılacak — Arapça'da TR kalıyor şu an. 5 anahtar × 3 dil. Tek dosya, hızlı win, ısınma.

**Birincil iş 3: IbSpoolDetay implementasyonu Adım 3b ve sonrası.** 68'de Adım 3a kapandı (foto bloğu, ID + sekmeler, Genel paneli, foot CTA, IbUyariDrawer entegrasyonu, notlar wiring). Yarım kalanlar:
- Foto carousel detayı (`fotograflar` tablosu sorgusu, prev/next, sayaç, meta)
- Malzeme paneli BOM listesi (`spool_malzemeleri` tablosu) + heat inline edit
- Devral akışı (foto çekme + DB `aktif_isci_id` UPDATE)
- Alternatif basamağa başla (DB `aktif_basamak` UPDATE + `is_durumu` bekliyor → devam_ediyor)
- İşe Başla / İşi Kapat / Not Ekle / İptal Et gerçek akışlar
- Genel paneli'nde Büküm/Markalama/Kesim ilerleme badge'leri (agregat sorgular)
- Yetki kontrolü (alternatifBasamakYetkili / yetkisiz ayrımı, gerçek `yetki_bloklari`'na göre)

**Birincil iş 4: i18n borç temizliği (SED-68-02).** 68b CI raporu ~75 uyarı listeledi (m_*/web `izb_*` `flansh_*` eksik anahtarlar). Hepsi `tv()` fallback ile çalışıyor ama disiplin kırık (R-08), Arapça/İngilizce'ye geçince TR kalıyor. Tek seferde toplu patch (sadece JSON ekleme, JSX/HTML değişikliği yok).

**Etkilenen dosyalar (69 boyunca):** `mobile/src/lib/supabase.js`, `ares-store.js`, `admin/index.html`, `sw.js`, `mobile/src/components/isbaslat/IbRolSec.jsx`, `mobile/src/components/isbaslat/IbSpoolDetay.jsx`, `lang/{tr,en,ar}.json` (toplu i18n batch), Vercel env, GitHub Secrets, `arespipe-backups` workflow.

**Diğer açık borçlar (gündem değil, çözülecek):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase'e standardize)
- MK-58.5 — Panel.html mobile preview UUID input alanı
- SED-68-01 — `devre_yeni.html` form validation (proje_no/gemi_adi temizlik kuralı)
- SED-68-03 — CI bot push rebase çakışması (`.github/ci-son-rapor.json` workflow'u)
- `arespipe-backups` Storage backup fail (MK-67.4 ile aynı kapsam, 69'da çözülür)

---

## ✅ 68'de Yapılanlar

> 68, **MIsBaslat Ekran 3 (IbSpoolDetay) implementasyonu Adım 3a + Ekran 4 mimari kararı (B seçimi) + 5 MK kararı + 3 sayfa eksiği keşfi** üretti. Token sebepli "68b" alt-bölmesinde notlar drawer wiring + CI temizliği + lang tek kaynak tutarsızlığı düzeltmesi tamamlandı.

### 1. Ekran 4 mimari kararı: B seçimi (Ekran 4 silindi, drawer pattern)

67 sonunda Cihat "akış-kesici uyarılar (cross-tenant, devamEdiyor başka operatör, rolUyumsuz) için ayrı bir ekrana gerçekten ihtiyacımız var mı?" sorusunu açmıştı. 68 başında karar verildi: **B seçildi.** Tek pattern hem mimari olarak temiz hem de UX olarak tutarlı.

**MK-68.1 doğdu:** Tüm uyarılar `IbUyariDrawer` içinde gösterilir. Ekran 4 silindi, hub mantığı sadeleşti. 4 akış-kesici drawer tipi (crossTenant mor / devamEdiyor kırmızı / alternatifBasamakYetkili mavi / alternatifBasamakYetkisiz gri) + 3 yumuşak kart tipi (alıştırma kırmızı / test mavi / not sarı). Akış-kesici varsa yumuşak drawer atlanır (öncelik kuralı). Alternatif basamak SADECE kaynak ailesi içinde tetiklenir (argon ↔ gazaltı), imalat ↔ ön imalat geçişleri RLS'de halleder.

### 2. IbSpoolDetay Adım 3a tamamlandı

`mobile/src/components/isbaslat/IbSpoolDetay.jsx` (947 satır) Ekran 3'ün ana komponenti. 67 mockup turundaki tasarım kararları (v9 → v16) birebir uygulandı. **Adım 3a kapsamı:**
- Üst bant: `proje_no` + `pipeline_no` + `spool_no` + `rev` (devam ediyorsa sarı + yanıp sönen yeşil nokta)
- Foto bloğu (placeholder, carousel detayı 69'a)
- Aktif basamak + Spool ID mor pill + Peek tab tek satırda
- Sekmeler: Genel | Malzeme
- Genel paneli: 10 satır (İş Emri, Devre, Çap, Ağırlık, Malzeme/Kalite, Yüzey/İşlem, Alıştırma, Durum, Aktif Basamak, İlerleme)
- Foot CTA (durum bazlı: bekliyor / devam_ediyor branch'leri)
- IbUyariDrawer entegrasyonu (peek tab + sağdan slide overlay)
- Format normalize (tr-TR capitalize, virgül, max 2 basamak)
- Aktif basamak label çevirimi `basamak_snapshot`'tan ("Başlamadı" placeholder filtresi)

**68 commitleri:**
- `767580e` — feat(mobile): devre fetch + Is Emri/Devre satirlari + malzeme fetch
- `68c2fdc` — feat(mobile): proje fetch + testler kart + format normalize + R-06 (oturum 68 - Adim 3a kapanis)

**MK-68.2 doğdu:** Adım 3a + 68b'nin notlar wiring'i + CI hex renk düzeltmesi tek karar altında belgelendi.

### 3. 68b alt-bölmesi: notlar drawer wiring + üst bant cleanup + CI temizliği

68 oturumu token limiti nedeniyle alt-bölündü ("68b" — aynı bağlamın devamı, sayı disiplini bozulmadan). 68b'de yapılanlar:

**3.1 Notlar drawer wiring (`c1faccc`):**
- `notlar` tablosundan fetch: `OR(spool_id, devre_id) + tenant_id + silindi=false + qr_goster=true + olusturma DESC`
- Yumuşak drawer'a sarı **not kart tipi** bağlandı (her not için ayrı kart, stable React key `not_${n.id}`)
- Üst bant `gemi_adi` cleanup: SELECT'ten ve render'dan tamamen kaldırıldı (sadece `proje_no`)
- Stable key disiplini (B-02): alis/test kartlarına da sabit `_key` eklendi

**3.2 CI red fix (`1085344`):**
- `pulseNokta.background: '#22c55e'` → `'var(--gr)'` — R-07 hardcode renk yasağı
- 6 yeni i18n anahtarı (`m_ib_uy_yu_alis_baslik`, `_alis_mesaj`, `_test_baslik`, `_test_mesaj`, `_not_baslik`, `_anladim`) tr/en/ar üçüne eklendi (R-08 disiplini)
- CI: 1 hata + 80 uyarı → 0 hata + ~75 uyarı (Deploy artık geçer)

**Final dosya kanıtı:**
```
mobile/src/components/isbaslat/IbSpoolDetay.jsx  MD5 95f329c81fa8ff508467cdcc316bce6d  947 satır
lang/tr.json                                      MD5 a20e6c19da2045972bdc3b48ec807fbc  1841 satır
lang/en.json                                      MD5 9c87fa88b595ce11a4c0e0e45a4cbb4b  1841 satır
lang/ar.json                                      MD5 aa9ac024c677305b86302fe281f2cfc5  1841 satır
```

### 4. Üst bant kuralı kilitlendi: gemi_adi UI'a sızmaz

68b canlı testinde spool A-0575 üst bantta "**NB1124 — Kargo Gemisi**-G200-350-FR38-Galv-S01" göründü. İki katmanlı tespit:
- Veri tarafı: `projeler.gemi_adi` alanına biri "NB1124 — Kargo Gemisi" yazmış (em-dash + proje_no prefix kirli)
- Kod tarafı: IbSpoolDetay üst bant render'ı `proje?.gemi_adi || proje?.proje_no` mantığıyla gemi_adi'yi öne alıyordu

**MK-68.3 doğdu:** Üst bant SADECE `proje_no` kullanır. `gemi_adi` UI'a sızmaz. 67 BRIEFING'indeki "Gemi adı: NB1137 üst bantta görünmeli" notu yanıltıcıydı (NB1137 aslında `proje_no`, gerçek `gemi_adi` "MV Poseidon"), MK-68.3 ile geçersiz.

**Veri temizliği (DB UPDATE):** İki projede `gemi_adi` em-dash + proje_no prefix temizlendi:
```sql
UPDATE projeler SET gemi_adi = 'Kargo Gemisi' WHERE id = '3d309111-1d9c-46ff-9266-4937f24c8a99';  -- NB1124
UPDATE projeler SET gemi_adi = 'Yük Gemisi'   WHERE id = 'f3f5e5f7-369f-4923-9054-bde91b95a908';  -- NB138
```

Tarama sorgusu (`gemi_adi LIKE '%—%' OR LIKE '% - %' OR ~ '^NB\d+'`) artık boş dönüyor.

**SED-68-01 doğdu:** `devre_yeni.html` form validation borcu — proje_no `^[A-Z0-9]+$`, gemi_adi em-dash + proje_no prefix yasağı. Validation eklenmezse veri kirliliği tekrarlar.

### 5. Ib-prefix konvansiyonu kilitlendi

67-68'de İş Başlat akışı için MIsBaslat host'unun yanı sıra alt-akış component'leri yazıldı (`IbRolSec`, `IbQRTara`, `IbSpoolDetay`, `IbUyariDrawer`). M-prefix sadece tam-ekran screens için tutuluyor; alt-akış component'leri Ib-prefix ile `mobile/src/components/isbaslat/` altında.

**MK-68.4 doğdu:** İki prefix konvansiyonu birlikte yaşar — M (screens), Ib (İş Başlat alt-akışları). Genel kural: Hub-tabanlı bir host akışı varsa, alt-akışlar `mobile/src/components/<akış-adı>/<Akış>*.jsx` altında, kendi prefix'leriyle yaşar.

### 6. Lang tek kaynak prensibi pekişti, CLAUDE.md tutarsızlığı düzeltildi

68b push akışında `mobile/.gitignore` satır 27 (`src/lang/`) sebebiyle lang dosyalarının gitignore'da olduğu fark edildi. Kaynak araştırılınca: MK-62.3 (`mobile/src/lang/README.md` predev silme problemi) prensibi kararlaştırmıştı — `mobile/src/lang/` predev/prebuild script'i tarafından kök `lang/`'dan otomatik kopyalanıyor (gitignored). CLAUDE-MOBILE.md satır 184 doğru kuralı yazmış, ama CLAUDE.md (satır 1203, 1217-1223, 1393) çelişkili yazımlar içeriyordu ("Web ve mobil ayrı JSON'ları var", "61 m_* anahtarı" eski sayım vb.).

**MK-68.5 doğdu:** Tek kaynak kuralı (kök `lang/`) CLAUDE.md'de net belgelendi, CLAUDE-MOBILE.md klasör yapısı sadeleşti. Senkron tutma cümlesi ("ileride npm script eklenebilir") silindi — zaten predev script var.

### 7. CI bot push rebase çakışması gözlendi

68b push'unda iki paralel commit (kullanıcı push'u + bot rapor commit'i `[skip ci]`) çakıştı, bot tarafında rebase fail oldu. Workflow `Error: Rebase başarısız — manuel müdahale gerek` ile sonlandı. Deploy'u kesmiyor (Vercel paralel çalışıyor) ama log'da kirlilik bırakıyor.

**SED-68-03 doğdu:** Workflow'da fetch + rebase loop'u veya farklı strateji (force-with-lease, ayrı branch) ile çözülür. Detay araştırma 69'a.

**Commitler (68'in tamamı):**
```
1085344 MK-68b.1b: CI red fix + m_ib_uy_yu_* lang keys (6 anahtar × 3 dil)
c1faccc MK-68b.1: IbSpoolDetay notlar drawer wiring + üst bant gemi_adi cleanup
3b5efdd chore(ci): ci-son-rapor.json güncelle [skip ci]
68c2fdc feat(mobile): proje fetch + testler kart + format normalize + R-06 (oturum 68 - Adim 3a kapanis)
3a46666 chore(ci): ci-son-rapor.json güncelle [skip ci]
767580e feat(mobile): devre fetch + Is Emri/Devre satirlari + malzeme fetch
c917b03 chore(ci): ci-son-rapor.json güncelle [skip ci]
```

### 68'de yapılmayanlar (bilinçli + zaman/kapsam kaynaklı)

- **IbSpoolDetay Adım 3b ve sonrası** — Foto carousel, Malzeme paneli BOM, Devral/alternatife başla, gerçek yazma akışları (İşe Başla / Kapat / İptal) → 69'a
- **Yetki kontrolü** (alternatifBasamakYetkili / yetkisiz) — gerçek `yetki_bloklari` üzerinden 69'a
- **i18n borç temizliği** — ~75 uyarı 69'a (SED-68-02)
- **Supabase API key migration** — kapsamı büyük, 69'un birincil işi (MK-67.4)
- **`devre_yeni.html` form validation** — proje_no/gemi_adi temizlik kuralı 69 sonrasına (SED-68-01)
- **CI bot push rebase çözümü** — workflow araştırması 69'a (SED-68-03)
- **`oturum-saglik.sh 68 --kapanis` çağrısı** — yapıldı ✅ (MK-65.8 + MK-56.4 disiplinine uyuldu)

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
- `docs/KARARLAR.md` — Tüm MK kararları (68 sonu: MK-68.5'e kadar, ~1500 satır)
- ⭐ `docs/CIHAT-PROFIL.md` — Cihat'ın çalışma stili + Claude'un farkındalıkları
- `docs/CLAUDE-CALISMA-MODU.md` — Claude'a canlı talimatlar
- `CLAUDE.md` — Geliştirme kuralları (web + global)
- `CLAUDE-MOBILE.md` — Geliştirme kuralları (mobil) — 68'de Ib-prefix konvansiyonu + lang tek kaynak güncellendi

**Operasyonel:**
- `docs/SAYFA-EKSIKLERI.md` — Sayfa bazlı eksik tespit metodu (68 sonu: SED-68-03'e kadar)
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

## 📊 68 Sonu Sayılar

- **i18n anahtarları (kök `lang/`):** 1841 (67'de 1834, 68'de +7 — `m_ib_uy_yu_*` 6 anahtar + 1 küçük artış). Trend: 62→1752, 63→1800, 64→1816, 65→1834, 66→1834, 67→1834, 68→1841
- **Mobil ekran sayısı:** 9 tam ekran + MIsBaslat hub'ında 3 alt ekran (IbRolSec, IbQRTara, IbSpoolDetay) + 1 ortak component (IbUyariDrawer) + 1 ortak (MDrawer). ⏳ Bekleyen: MProfil + IbSpoolDetay Adım 3b ve sonrası
- **Toplam MK kararı:** MK-68.5'e kadar (67→68 arası +5: MK-68.1, 68.2, 68.3, 68.4, 68.5).
- **Sayfa eksikleri:** SED-68-03'e kadar (68'de +3: SED-68-01, 68-02, 68-03)
- **Migration dosyası:** 33 (031 → 033, 68'de değişmedi — DB UPDATE'ler veri temizliği için, schema değişikliği yok)
- **CI:** ✅ son commit yeşil (`1085344`)
- **HEAD:** `1085344`
- **Lint:** Faz B baseline'ı korundu, ~75 i18n uyarı borcu açık (SED-68-02)

---

## 🔄 68'den 69'a Geçiş Notları

- **MK-65.8 + MK-56.4 disiplinine uyuldu**: `oturum-saglik.sh 68 --kapanis` çalıştırıldı, BRIEFING.md "68. Oturum Kapanışı" başlığıyla güncellendi, üç katmanlı kapanış protokolü (Script + Claude + Cihat) işletildi.
- **Supabase API key migration 69'un birincil işi.** 67'den 68'e ertelenmişti, 68 dolu olduğu için 68'den 69'a tekrar ertelendi. Mobil + web hâlâ legacy JWT key'leriyle çalışıyor (Supabase grace period). Migration kontrollü yapılır: yeni key'i mevcut JWT yanına ekle, test et, sonra eski JWT'yi sil.
- **IbSpoolDetay Adım 3b 69'da.** Adım 3a kapandı (947 satır), foto carousel + Malzeme paneli BOM + Devral/alternatife başla + gerçek yazma akışları (İşe Başla / Kapat / Not Ekle / İptal Et) bekliyor.
- **i18n borç temizliği 69'da (SED-68-02).** ~75 uyarı, hepsi `tv()` fallback ile çalışıyor ama Arapça/İngilizce'de TR kalıyor. Toplu JSON ekleme.
- **IbRolSec.jsx hardcoded TR sarma 69'da.** BÜKÜM/İMALAT/ARGON KAYNAĞI/KESIM/MARKALAMA — 5 anahtar × 3 dil. 69'un ısınma maddesi.
- **Üst bant kuralı (MK-68.3) canlı:** `proje_no` only, `gemi_adi` UI'a sızmaz. 67 BRIEFING'indeki yanıltıcı not (`gemi_adi: NB1137 üst bantta görünmeli`) MK-68.3 ile geçersiz, 68 BRIEFING'inde silindi.
- **Ib-prefix konvansiyonu (MK-68.4) canlı:** İş Başlat alt-akış component'leri `mobile/src/components/isbaslat/Ib*.jsx`. CLAUDE-MOBILE.md Bölüm 1.3.1'de belgelendi.
- **Lang tek kaynak (MK-68.5) canlı:** Yazılır kök `lang/`, üretilir `mobile/src/lang/` (predev kopyası, gitignored). Yeni `m_*` anahtarı sadece kök `lang/`'a yazılır.
- **`firma_admin` dashboard erişimi geçici** (MK-67.3'ten devam): İleride yetki haritası ile netleşir.
- **CI bot push rebase çakışması (SED-68-03):** Disipline alındı, 69 araştırma listesinde.
- **`arespipe-backups` Storage backup fail** (MK-67.4 ile aynı kapsam, 69'da çözülür).

---

## 🎯 Açılış Ritüeli (69 için)

```bash
cd ~/Desktop/arespipe
git pull origin main
./scripts/oturum-saglik.sh 69
cat BRIEFING.md
```

Sağlık scripti yeşilse Claude'a `cat BRIEFING.md` çıktısı yapıştırılır. **Birincil iş 1 (Supabase API key migration)** ile başlanır. İlerleme süresine göre Birincil iş 2 (IbRolSec hardcoded TR sarma) ve 3 (IbSpoolDetay Adım 3b) sıraya alınır.

**Açılışta özgür tasarım sunulmaz** (MK-66.3). Adım 3a'dan kalan implementasyon parçaları zaten mockup'tan çıktı (67 v9-v16), doğrudan implementasyona geçilir.
