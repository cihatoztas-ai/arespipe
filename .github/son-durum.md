# AresPipe — Son Durum

> **Son güncelleme:** 13 Mayıs 2026 — 82. oturum (KAPATILDI ✅)
> **Bir önceki oturum:** 81. oturum — Kütüphane Ekler/Etiketleme tasarım belgesi (commit `33a0f87`, detay: `docs/KUTUPHANE-EKLER-TASARIM.md`)
> **Sonraki oturum:** 83 — Spool ⇄ Kütüphane bağlama bütünleştirmesi (D) + Tenant özel CRUD UI (E). 82 kapanışında Cihat fitting/malzeme bağlama kopukluğunu tespit etti. Önceki 82 aday gündemleri (A/B/C) 84+'a ötelendi.

---

## 82. Oturum Özeti — Kütüphane Envanteri Sayfaları + RLS Düzeltme + Real-time

Ana tema: **Kütüphane mini-projesi**. Tek oturumda hem yeni iki sayfa, hem bir RLS bug fix, hem Realtime altyapısı, hem mimari yeniden düzenleme. 81'de tasarım, 82'de implementasyon hedefi tutturuldu.

Akış üç dalga halinde ilerledi:

1. **İlk implementasyon (KARAR-81.1 paterni)** — `admin/kutuphane.html` + `admin/kutuphane-detay.html` + `admin/panel.html` sidebar linki. 5 metric kart + tek envanter tablosu + dinamik kolon listesi (pagination dahil).
2. **Hedef parse regex fix** — `KUTUPHANE-YUKLEME-TAKIP.md` v3'e güncellenmişti (78. oturum), eski v2 paterni (`**\`tablo\`**`) artık çalışmıyordu. Yeni regex + duplicate satır toplama (`fitting_olculer` iki satır: B16.9 + B16.11/EN).
3. **404 vs hata ayrımı** — `ozel_parcalar`, `tenant_spec_seti`, `spec_kural` tabloları henüz CREATE edilmemiş, UI bunu "hata" olarak gösteriyordu. "TABLO YOK" gri rozetine ayrıştırıldı.
4. **fitting_olculer SELECT RLS** — 78'de 569 satır eklenmiş ama SELECT politikası eklenmemişti, deny-by-default → API 0 dönüyordu. flansh_olculer paterni kopyalanarak migration 052.
5. **Mimari yeniden düzenleme** — Cihat'ın geri bildirimi sonrası: 5 grup (Geometri/Malzeme/Uyum/Özel/Spec) → **7 grup parça tipi mantığıyla** (Borular/Fittings/Flanşlar/Malzemeler/Çapraz Uyum/Özel/Spec). Tek envanter tablosu yerine kart grid (3 sütun), her kartta SVG yer tutucu + alt tablolar listesi + AI olgunluk footer'ı.
6. **Detay sayfası yeniden** — SVG yer tutucu (380×280) + ölçü lejantı (kolon→harf eşleştirmesi, tablo bazında 12-20 harf) + ek dosya özeti + AI olgunluk yer tutucusu + harf rozetli kolon başlığı + satır bazında olgunluk sütunu.
7. **Filtreler** — Detay sayfasına server-side filtre çubuğu (TYPE/STD/CLASS/Sch/DN/Face dropdown'ları, tablo bazında konfig). Her dropdown'da distinct değer + sayım. URL'de saklanır (`?f.<kolon>=<deger>`). 1. sayfaya dönüş + temizle butonu.
8. **Realtime** — Her iki sayfa için Supabase Realtime subscribe. INSERT/UPDATE/DELETE → debounce 1.5sn → sayım/distinct/tablo yenile → toast bildirim. Topbar'da 🟢 canlı badge. Migration 053 publication'a 5 tabloyu ekledi.

---

## Yapılanlar (82)

### Yeni sayfalar

- **`admin/kutuphane.html`** (~514 satır) — Süper admin envanter takip sayfası
  - 4'lü özet şerit (Toplam Mevcut · Toplam Hedef · Genel İlerleme · Sistem Durumu)
  - 7 grup kartı (Borular/Fittings/Flanşlar/Malzemeler/Çapraz Uyum/Özel/Spec) renk kodlu sol şeritle
  - Her kartta: ikon · ad · %dolu · SVG yer tutucu (108px, dashed çerçeve) · alt tablolar listesi · "AI olgunluk: henüz veri yok" footer'ı
  - Tablo satırlarına tıklanınca detay sayfasına yönlendirme
  - 🟢 CANLI badge + 5 tabloya Realtime subscribe + toast

- **`admin/kutuphane-detay.html`** (~859 satır) — Tek tablo detay sayfası
  - Üst kart 2 kolonlu:
    - SOL: SVG yer tutucu (380×280, dashed) — arşivden çizim eklenecek
    - SAĞ: 3 panel
      - **Ölçü Lejantı** — kolon → harf rozeti eşleştirmesi (2 sütun grid). boru için DN/Sch/OD/t/ID/W/V/SA/t-min/t-max/t-tol%/STD. fitting için A/B/C/F/M/H/R + DN1/DN2 + SOK-D/SOK-ID + CLS dahil 20 harf. flanş için TYPE/CLASS/FACE/DN/D/t/X/Y/B/G/f/C/n/BH/BC/BL/W
      - **Ek Dosyalar** — 4 kart placeholder (DXF/STEP/Foto/Video tümü 0), 🚧 `kutuphane_ekler` 83+ notu
      - **AI Olgunluk** — bar + 4 eşik göstergesi (0 yok / 1 kural / 5 embed / 50 finetune), 🚧 `parca_etiketleri` 84+ notu
  - **Filtre çubuğu** — tablo bazında dropdown'lar, distinct + sayım, URL'de saklanır, "Temizle" butonu
  - **Veri tablosu** — kolon başlığında mavi harf rozeti, lejant sırası önce + meta kolonlar sona, sticky header, 50 satır/sayfa pagination, en sağ "Olgunluk" sütunu (📐0 🧊0 📷0 0% placeholder)
  - 🟢 CANLI badge + tabloya Realtime subscribe + toast
  - URL'de sayfa + filtre paramları korunur (bookmark/share çalışır)

- **`admin/panel.html`** — Sidebar'a Mobil Önizleme altına 📚 Kütüphane linki (ayrı sayfaya yönlenir)

### Migration'lar

- **`052_fitting_olculer_select_rls.sql`** — fitting_olculer için SELECT politikası
  - 78'de 569 satır eklenmiş ama SELECT policy yoktu, deny-by-default → 0 satır
  - flansh_olculer_select paterni: `sistem_preset=true OR tenant_id=auth-user-tenant`
  - İdempotent (DROP POLICY IF EXISTS + CREATE), kolon doğrulama DO bloğu

- **`053_realtime_publication_kutuphane.sql`** — Realtime publication
  - 5 kütüphane tablosunu `supabase_realtime` publication'a ekler
  - Idempotent (ekli ise atlar), tablo yoksa NOTICE verip devam eder
  - boru_olculer, fitting_olculer, flansh_olculer, malzeme_kataloglari, fitting_malzeme_uyum

### Kararlar Alındı

- **KARAR-82.1** — Mimari yeniden gruplama: 5 fonksiyonel grup (Geometri/Malzeme/Uyum/Özel/Spec) **→ 7 parça tipi grubu** (Borular/Fittings/Flanşlar/Malzemeler/Çapraz Uyum/Özel/Spec). Mantık: kullanıcı zihninde "boru × dirsek × flanş" ayrı kategoriler, geometrik benzerlikten önce gelir.
- **KARAR-82.2** — Detay sayfasında "tek satırın detayı" yerine **"parça tipinin tüm kayıtları + üstte tip görselleştirmesi"** mantığı. ProjectMaterials.com / McMaster paterni: üstte SVG + ölçü lejantı, altta boyut tablosu.
- **KARAR-82.3** — SVG'ler için iki seçenek arasında tercih: **manuel arşiv** (Cihat'ın elinde mevcut çizimler) ön planda. Three.js snapshot ve AI üretimi ileri opsiyonel.
- **KARAR-82.4** — Yeni tablo ekleme şu an manuel 4 yer (admin envanter config + admin detay config + KUTUPHANE-YUKLEME-TAKIP.md + DB CREATE/RLS). 83+ DB-driven refactor sonrası tek INSERT'e iner.
- **KARAR-82.5** — Public kütüphane sayfası (`arespipe.com/kutuphane`) yeni bir vizyon maddesi olarak eklendi. Henüz tetik yok, site iskeleti hazır olunca.
- **KARAR-82.6** — Filtreler URL'de tutulur (`?f.<kolon>=<deger>`). Bookmark/share çalışır. Filtre değişince 1. sayfaya dönülür.

### Yeni Mimari Kurallar

- **MK-82.1** — Kütüphane geometri tabloları **malzeme-bağımsızdır**. boru_olculer'da bir DN100 Sch40 satırı tüm malzemeler için aynı geometriyi temsil eder. Malzeme × geometri kombinasyonu `fitting_malzeme_uyum` çapraz tablosunda.
- **MK-82.2** — Postgres RLS deny-by-default. Yeni bir kütüphane tablosu eklenirken UPDATE/DELETE/INSERT policy yetmez, **SELECT policy de açıkça eklenmeli**. flansh_olculer paterni referans.
- **MK-82.3** — Yeni bir Realtime ihtiyacı: tabloyu **`supabase_realtime` publication'a ekleme** migration'da yer almalı. CREATE TABLE + RLS + publication ekleme aynı migration'da hizalı.
- **MK-82.4** — Detay sayfalarında "tek kayıt" değil "parça tipinin tüm kayıtları + tip görselleştirmesi" doğru tasarım. Tek kayıt detayı modal/yan-panel olarak gelecek (84+).

---

## Açık Borçlar (83+ Oturumlara Devreden)

### 83. Oturum gündemi (kilitlenmiş) — Spool ⇄ Kütüphane bütünleştirmesi + Standart-dışı malzeme akışı

82 kapanışında Cihat spool detay sayfasında "kopukluk" tespit etti: malzeme sekmesinde flanş ve boru için kütüphane modal'ı açılıyor ama **fitting ve malzeme spec için açılmıyor**. Ayrıca flanş = explicit junction (DB'de FK), boru = runtime matching — iki farklı zihinsel model. Bu 83'ün tamamı.

**83.D — Spool ⇄ Kütüphane bağlama bütünleştirmesi** (büyük iş)

Mevcut durum:

| Parça tipi | Bağlama | Modal | Durum |
|---|---|---|---|
| Flanş | `spool_flansh_eslesme` junction tablosu | flanshModal | ✅ Çalışıyor (41. oturum) |
| Boru | Runtime tier matching (`dis_cap_mm + et_mm`) | boruModal | ✅ Çalışıyor ama junction yok (44. oturum) |
| Fitting (dirsek/tee/cap/redüksiyon) | YOK | YOK | ❌ Kopuk |
| Malzeme spec/grade | YOK (serbest string) | YOK | ❌ Kopuk |

Yapılacak:
- Tutarlı **junction paterni**: `spool_fitting_eslesme` + `spool_malzeme_eslesme` (veya `spool_malzemeleri.fitting_id / malzeme_spec_id` doğrudan FK)
- Eşleşme algoritması: fitting için `parca_tipi + cap_buyuk_dn + (varsa) cap_kucuk_dn + schedule` matching; spec için `malzeme + kalite` → `malzeme_kataloglari` lookup
- Boru/Flanş paternlerini birleştirme — tek `parcaModalAc(spool_malzeme_id)` fonksiyonu, içerik parça tipine göre değişir
- Yazım hatası / varyasyon / hayalî grade tespiti (örn. "A106 grB" vs "A106 GrB" normalize edilir, lookup düşmezse uyarı)

**83.E — Tenant özel (standart-dışı) malzeme CRUD UI** (orta iş)

DB tarafı zaten hazır: `boru_olculer.sistem_preset BOOLEAN` + `tenant_id UUID` kolonları mevcut, RLS politikaları doğru (`sistem_preset=true` herkes okur, `sistem_preset=false AND tenant_id=X` X tenant okur).

Yapılacak:
- "Yeni boru ekle" / "Yeni fitting ekle" / "Yeni flanş ekle" form modal'ları — sadece `sistem_preset=false, tenant_id=ARES.tenantId()` yazabilir
- Standart-dışı ölçü uyarı dialog'u (örn. DN 32 yazılınca: "ASME B36.10M'de standart değil, devam etmek istediğine emin misin?" — yine kayıt yapılır, sadece bilgilendirme)
- Kütüphane sayfasında "Standart" vs "Tersane Özel" filtre seçeneği (`sistem_preset` filtresi)
- Tenant özel kayıtların listede ayrı görsel rozeti

Süre tahmini: 83.D = 2-3 oturum, 83.E = 1-2 oturum. İkisi aynı tematik kapsamda olduğu için art arda gelecek.

### 84+ Oturumlar (83'ten ötelenen 82 aday gündem maddeleri)

**A — DB-driven metadata refactor** (1 oturum) — `kutuphane_tablo_metadata` tablosu (KARAR-82.4 / K-82.C). Mevcut config'ler (TABLO_BILGI, GRUPLAR, FILTRELER, OLCU_LEJANT) DB'ye taşınır. Yeni tablo ekleme için tek INSERT yeter, JS dokunulmaz. Public sayfa altyapısı kurulur.

**B — `kutuphane_ekler` migration + Ek Dosyalar entegrasyonu** (1 oturum) — KUTUPHANE-EKLER-TASARIM.md Bölüm 3.1 DDL. Detay sayfasındaki "Ek Dosyalar" placeholder'ı gerçek veriye bağlanır. DXF/STEP/Foto/Video upload UI ileri 85+'a.

**C — Public kütüphane sayfası iskelet** (1-2 oturum) — `arespipe.com/kutuphane` route + sayfa şablonu (admin'in salt-okunur klonu). Auth kalkar, super_admin filtresi kalkar. Sadece `sistem_preset=true` kayıtlar görünür. SEO meta tags + Open Graph.

**Ayrıca:**
- **`parca_etiketleri` migration + üç-pencere etiketleme UI** (KUTUPHANE-EKLER-TASARIM Bölüm 3.2 + 6.1)
- **`kutuphane_ogrenme_durumu` materialized view** (Bölüm 3.3) — parça başına olgunluk, detay sayfasındaki AI Olgunluk placeholder'ını gerçek veriye bağlar
- **Manuel SVG arşivi** — Cihat parça tipi başına SVG yükler, `kutuphane_parca_tipi` tablosu (gelecekte)
- **Detay sayfasında "tek kayıt" modal'ı** — bir flanşa tıklayınca o satırın detayı + ek dosyaları popup'ta

### Veri/Vizyon Borçları (sinyal bazlı)

- 81'deki borçlar (Kanal 1/2/3, STEP entegrasyonu, lazer pointcloud) korundu, tetik değişmedi

### Önceki Oturumlardan Açık (81 ve öncesi)

- 81 tasarım oturumu, 82 implementasyon — 81'in açık borçları 83+ takvimine entegre edildi
- 80'in açık borçları kendi `son-durum.md` yedek satırlarında (git history)

### Belge Güncellemesi Gereken

- **`docs/KUTUPHANE-YUKLEME-TAKIP.md` v3 → v4** — `fitting_olculer 424 → 569` güncellemesi (78'den 82'ye kadar 145 satır daha eklenmiş, kayıt dışı ilerleme tespit edildi). Bu güncelleme 83 başında ilk iş.

---

## CI Son Durum

- **Build:** ✅ YEŞİL (son commit `e197b51` real-time + filtre)
- **Lint:** Bilinen lint kuralları için yeni dosyalar uyumlu (hard-coded TR string'ler panel.html paternine uygun, super admin sayfaları G-01 i18n istisnası)
- **Vercel:** ✅ Production aktif
- **Bu oturumda commitler:**
  - `00e2d13` feat(82): kutuphane envanter sayfasi v1
  - `22710c6` fix(82): v3 markdown regex + 404 ayrımı + fitting_olculer toplama
  - `8da8274` migration(82): 052 fitting_olculer SELECT RLS
  - `32008a5` feat(82): 7 parça tipi grubu + SVG yer tutucu + ölçü lejantı
  - `e197b51` feat(82): filtre çubuğu + realtime auto-refresh + migration 053

---

## Süreç Disiplinleri (değişiklik yok)

- **Heredoc / Python in-place patch** dosya yazma için (Mac indirme bozuk dosyalar için)
- **`arespipe_kopyala`** MD5 doğrulamalı (MK-52.1)
- **`gp`** otomatik rebase + push (MK-52.2)
- **5 haneli migration numarası**, son numara takipli (053 yazılırken Cihat doğruladı)
- **Migration BEGIN/COMMIT'li** ama Supabase Studio'da DO bloğu direkt çalışabiliyor
- **Realtime test pattern**: `UPDATE ... SET notlar = ...` (NOT NULL constraint'lerle uğraşmaz, sayım değişmediği için temiz tanı)

---

## Performans / Bütçe Bilgisi

- **Realtime cost**: subscribe ücretsiz (Supabase Pro plan dahilinde), WebSocket bağlantısı tek per page
- **Debounce 1.5sn**: 10 satırlık peş peşe INSERT tek refresh'e toplanır, gereksiz round-trip yok
- **Distinct sorgusu**: tek SELECT ile 5 kolonun değerleri çekilir (LIMIT 5000), filtre çubuğunda kullanılır

---

## Açık Test / Doğrulama Notları

- ✅ Realtime UPDATE event'i sayfa handler'ına ulaştı (`[realtime] boru_olculer · UPDATE` log'u görüldü)
- ✅ Manuel kanal `STATUS: SUBSCRIBED` döndü, event payload'ı tam geldi
- ✅ Filtre çubuğu render ediliyor (görsel doğrulama bekliyor)
- ✅ 404 olan 3 tablo "TABLO YOK" rozetiyle gösteriliyor (console'daki 404'ler beklenen davranış)
- ⏳ Toast görsel doğrulama henüz yapılmadı (3 saniye görünüm penceresi)
- ⏳ Filtre seçimi sonrası tablonun daralması henüz fiilen test edilmedi (Cihat 83 öncesi denesin)

---

> **83. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.** 83 gündemi (D + E) kapanışta kilitlendi, açılış sorusu sadece git status + onay.
>
> **Son güncelleme:** 13 Mayıs 2026 — 82. oturum (kapatma)
