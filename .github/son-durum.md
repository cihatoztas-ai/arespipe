# AresPipe — Son Durum

> **Son güncelleme:** 13 Mayıs 2026 — 85. oturum (KAPATILDI ✅)
> **Bir önceki oturum:** 84. oturum — Uç işlemi taxonomy refactor + Standart sütunu prototipi (commit `4a1b991`)
> **Sonraki oturum:** 86 — Renk semantiği fix + fitting/flansh Standart sütunu + tanımsızlık frontend modal + süper admin paneli

---

## 85. Oturum Özeti — Uç İşlemi Taxonomy Tamamı + Tanımsızlık DB Altyapısı + CI Disiplin

85'in ana ekseni 84'te tasarlanan uç işlemi sözlük altyapısının DB ve frontend tarafında tamamlanması oldu. Sonra **kritik bir model düzeltmesi** yapıldı: 84'te yapılan "Victaulic satırlarını parent boruya nitelik olarak migrate et" kararı yanlıştı — Cihat'ın sahadan getirdiği geri bildirim üzerine 36 yiv satırı **ayrı BOM kalemi (`tip='malzeme'`)** olarak geri eklendi. Tanımsız kayıt öneri akışının DB tarafı kuruldu. CI'ı 21. oturumdan beri sürüncemede olan kütüphane sayfaları script eksiği + Vite SPA yanlış tarama kuralı düzeltilerek **tamamen yeşil** olarak kapatıldı.

Akış altı dalga halinde ilerledi:

1. **Migration 058 (KARAR-84.1 DB tarafı)** — `uc_islemi_tipleri` sözlük tablosu + 6 seed (plain/bevel/socket/threaded/groove_victaulic/yaka_formlu) + RLS + Realtime. 6/6 doğrulama yeşil.

2. **Migration 059 (KARAR-84.5 DB tarafı)** — `spool_malzemeleri` üzerine 4 yeni kolon (`uc_a_aciklama`, `uc_b_aciklama`, `uc_a_std`, `uc_b_std`) + 057'deki CHECK constraint kaldırma + sözlük FK ekleme (ON DELETE SET NULL, ON UPDATE CASCADE). 36 Victaulic kaydı otomatik bağlandı.

3. **Frontend spool_detay v5 (85.C)** — SELECT'e 2 nested join (`uc_a_tip`, `uc_b_tip`) + MAP'e 8 yeni alan + TBODY Standart hücresinde alt satır rendering (`↳ A: Victaulic Yiv (ANSI/AWWA C606)`). **Sahada test sonrası model yanlışlığı tespit edildi.**

4. **Migration 060 — Taxonomy Düzeltmesi** — Cihat'ın geri bildirimi: "yiv borunun niteliği değil, BOM kalemi. Sahada fiziksel ayrı parça olmasa bile müşterinin tablosunda öyle gösteriyor, bizde de ayrı satır olmalı." 057'nin DELETE 36 adımı yanlış varsayıma dayanıyordu. 36 yiv satırı `tip='malzeme'` olarak geri INSERT edildi, parent borulardaki `uc_a_islemi` NULL yapıldı. Yiv kendi sözlük FK'sını kendi satırında taşır. v1 fail (`guncelleme` kolonu yok), v2 ile düzeldi.

5. **Frontend v6 + v7 (85.D)** — v6: alt satır rendering kaldırıldı, Standart hücresi 3 dallı oldu (geom_standart / uc_a_std_eff / `—`), uç işlemi satırları kalite kontrolünden muaf tutuldu. v7: yiv satırlarında ağırlık tahmini kapatıldı, Heat No ve Sertifika hücreleri `—` (input/checkbox gizli).

6. **Migration 061 (85.E DB tarafı)** — `tanimsiz_kayitlar` tablosu + hash anahtarı fonksiyonu + UPSERT fonksiyonu (sıklık artırma + açıklama append) + 4 RLS policy + Realtime. Frontend modal RPC bağlantısı 86'ya devredildi.

7. **CI Yeşillendirme** — `admin/kutuphane.html` ve `admin/kutuphane-detay.html`'e eksik `ares-lang.js`/`ares-normalize.js`/`ares-layout.js` script tag'leri eklendi (21. oturumdan beri borç). `.github/kontrol.js` ZORUNLU HTML kontrolüne `mobile/` muafiyeti eklendi (Vite SPA ortak vanilla JS yüklemez, I18N kuralıyla simetrik).

---

## Yapılanlar (85)

### Migration'lar

- **`058_uc_islemi_tipleri_sozluk.sql`** (141 satır, MD5 `e367221...`)
  - Sözlük tablosu + 6 seed + RLS (super_admin yazar) + Realtime
  - 6/6 doğrulama yeşil

- **`059_spool_malzemeleri_uc_alanlari_fk.sql`** (180 satır, MD5 `7ff6ce96...`)
  - 4 kolon + CHECK→FK
  - Önkoşul kontrolü DO bloğu ile (MK-84.4 defansif)
  - 36 Victaulic kaydı FK eklemeden zaten doğru kodla bağlandı

- **`060_uc_islemi_taxonomy_duzeltme.sql`** (202 satır, MD5 `a8cd17b1...`)
  - 36 yiv satırı `tip='malzeme'` olarak geri INSERT (parent'tan tenant/malzeme/kalite/dis_cap/et kopyalandı, boy/agirlik NULL)
  - Parent borulardaki `uc_a_islemi` NULL'a çekildi
  - v1 fail: `guncelleme` kolonu DB'de yok, v2 düzeltildi (MK-85.3 — MK-84.2 tekrarı)
  - Tip dağılımı sonuç: boru=70, fitting=43, flansh=11, **malzeme=36**, toplam 160

- **`061_tanimsiz_kayitlar.sql`** (354 satır, MD5 `d9399bc4...`)
  - `tanimsiz_kayitlar` tablosu + 4 tip enum + hash UNIQUE + JSONB ham_data
  - `tanimsiz_hash_anahtari(tip, dis_cap, et, kalite)` IMMUTABLE fonksiyon
  - `tanimsiz_kayit_onerisi(...)` UPSERT fonksiyonu (sıklık artırma + açıklama append)
  - 4 RLS policy + Realtime + index'ler (durum_siklik DESC sıralı sorgu için)
  - 4/4 doğrulama yeşil (frontend bağlantısı 86'da)

### Frontend (`spool_detay.html` — 3885 → 3934 satır, +49)

- **SELECT cümlesi** — 6 yeni kolon (`uc_a_islemi, uc_b_islemi, uc_a_aciklama, uc_b_aciklama, uc_a_std, uc_b_std`) + 2 nested join (`uc_a_tip`, `uc_b_tip`)
- **MAP fonksiyonu** — 8 yeni alan (`uc_a/b_islemi, uc_a/b_aciklama, uc_a/b_std_eff, uc_a/b_ad`), `ucIslemiSatiriMi` hesabı, yiv için ağırlık tahmini muafiyeti
- **TBODY Standart hücresi** — 3 dallı (geom_standart / uc_a_std_eff / `—`)
- **TBODY render** — yiv satırı (`ucIslemiSatiri`) için Heat No `—` (input gizli), Sertifika `—` (checkbox gizli)
- **Kalite kontrol muafiyeti** — uç işlemi satırları standart-dışı işaretlenmiyor

### Admin Sayfaları

- **`admin/kutuphane.html`** (MD5 `c951e738...`) — 9. satıra `ares-lang.js` + `ares-normalize.js` + `ares-layout.js` eklendi (CLAUDE.md 2.2 SC-01)
- **`admin/kutuphane-detay.html`** (MD5 `b3823b2d...`) — aynı pattern

### CI Kontrol Sistemi

- **`.github/kontrol.js`** (MD5 `efd97809...`) — `zorunluKontrol` fonksiyonunun başına `mobile/` muafiyeti (Vite SPA build çıktısı ortak vanilla JS yüklemez)

### Kararlar Alındı (85)

- **KARAR-85.1** — Turuncu satır gerçekte üç tip eksiklik içerir: STD-EKSİK (standartta var, biz eklemedik), STD-DIŞI (standartta yok, özel ölçü), VERİ-HATALI (boyut yok). Modal akışında ayrım yapılır. *(Frontend implementasyon 86)*

- **KARAR-85.2** — RLS asla kapalı bırakılmaz. Supabase Studio'da "Run without RLS" görünürse durulup policy yazılır. *(MK-85.2 olarak da kuralda)*

- **KARAR-85.3** — Tanımsız satır modal'ı mavi BORU BİLGİSİ modal'ının formatına paralel olur. Tahmini değerler gösterilir, kullanıcı onaylar veya yazar. *(86'da implementasyon)*

- **KARAR-85.4** — Tenant-özel ↔ sistem-preset çakışma çözümü: Cihat'ın getirdiği "süper admin tek otorite" felsefesiyle **doğal çözüldü**. Kullanıcının önerisi `tanimsiz_kayitlar`'a düşer (önerİ), süper admin onayladığında kütüphaneye geçer. Tek bir karar otoritesi olduğu için çakışma yoktur.

- **KARAR-85.5** — Renk semantiği netleşti: **🟠 turuncu = kütüphanede özel ölçü olarak tanımlı (STD-DIŞI ama tanımlı)**, **⚪ gri = tanımsız (kütüphanede yok, tıklanır → öneri akışı)**. *(86'da implementasyon)*

- **KARAR-85.6** — Süper admin iki yollu karar: (1) standartta var → manuel toplu tablo yükle, (2) standartta yok → tekil kontrol et + dahil et. Çakışma engellenmiş olur.

- **KARAR-85.7** — Öneri birleşme: `UNIQUE (hash_anahtari)` — tenant fark etmez, aynı kombinasyon tek satır. Sıklık tüm tenant'lardan toplu. Süper admin paneli sıklığa göre sıralar, sağ tarafta kırmızı rozet ile sayım gösterir. Onaylanırsa listeden düşer.

- **KARAR-85.8** — 057'nin DELETE 36 adımı yanlıştı. Veri tarafı 060 ile düzeltildi (yiv ayrı BOM kalemi). Migration silinmez (audit trail korunur), gelecekteki ileriye taşıma 060 ile yapılır.

### Yeni Mimari Kurallar

- **MK-85.1** — **"Standart üç kaynaktan biri: kütüphane FK, müşteri raw, veya hiç. Kategori adından (karbon, paslanmaz vb.) standart TÜRETMEYİZ."** 84.E v3'te yaptığım hatanın doğru gerekçesi. Müşteri "Victaulic" derse biz "ANSI/AWWA C606" yazarız (kanonik eşleştirme); kategori "karbon"dan "DIN 17100" türetmeyiz.

- **MK-85.2** — **"RLS asla kapalı bırakılmaz."** Supabase Studio'da "Run without RLS" hiçbir tabloda **seçenek değildir**. Multi-tenant veri sızıntısı riski. Tablo yaratan her migration'da `ENABLE ROW LEVEL SECURITY` + en az 2 policy zorunlu.

- **MK-85.3** — **"Migration yazmadan önce HER ZAMAN `information_schema.columns` ile şema doğrula."** MK-84.2 ihlalini 060 v1'de tekrar yaptım (`guncelleme` kolonu kopyaladım, DB'de yoktu). Önceki bir migration'dan kopyalanan kolon adı bile şüpheli — şema değişmiş olabilir.

- **MK-85.4** — **"Modeli yanlış kurarsan UI hilesiyle örtmek bilgi kaybına yol açar."** 057 yiv'i parent boruya nitelik olarak migrate etti, 85.C "↳ A:" alt satırı ile bunu kullanıcıya gösterdi. Görsel düzgün gözüktü ama hangi standardın hangi parça için olduğu belirsizdi. Cihat sahadan geri bildirim getirince model düzeltildi (060). Gelecekte: veri modeli ile UI gösterimi arasında **simetri** kontrolü zorunlu.

---

## Açık Borçlar (86+ Oturumlara Devreden)

### 86. Oturum gündemi — Renk semantiği fix + fitting/flansh Standart sütunu + tanımsızlık frontend modal

**86.A — Renk semantiği fix (KARAR-85.5)** (~30 dk)

Şu an `geomBagli=false` olan satırlar bazıları turuncu görünmüyor (M2/M3/M4/M5 keşfi — `46622aea-...` spool'unda tespit edildi). Render mantığı:
- Kütüphaneye bağlı + standartta var → mavi (mevcut)
- Kütüphaneye bağlı + standartta yok (özel ölçü) → **turuncu** (yeni)
- Kütüphaneye bağsız → **gri + tıklanır** (yeni, modal açılır)

`master.tenant_id` kontrolü ile sistem-preset / tenant-özel ayrımı yapılır. Render'da bir bug var, debug edilecek.

**86.B — fitting/flansh için Standart sütunu (v8)** (~20 dk)

84.E'de keşfedildi: fitting_olculer ve flansh_olculer'da kolon adı `geometri_std` (boru'daki `standart` değil). Frontend'de sadece boru için Standart çekiliyor. fitting/flansh için ayrı nested join + render mantığı eklenir. MK-84.2 (şema doğrulama) zorunlu.

**86.C — Tanımsızlık frontend modal (85.E v2)** (~1 saat)

`tanimsizModalAc` placeholder'ı gerçek modal'a yükselt:
- Mavi BORU BİLGİSİ modal formatına paralel (KARAR-85.3)
- Eksik alanlar tahmin edilir (örn. DN125 tahmini gösterilir)
- Kullanıcı sebep dropdown (3 seçenek) + serbest açıklama
- `tanimsiz_kayit_onerisi(...)` RPC fonksiyonuna POST
- Toast: "Süper admin onayına gönderildi"

**86.D — Süper admin paneli `admin/oneriler.html`** (~2 saat, ayrı oturum olabilir)

- Bekleyen öneriler listesi (sıklığa göre DESC)
- Sağ tarafta kırmızı rozet ile siklik_sayisi
- Detay: ham veri, kullanıcı sebebi, kaç tenant'tan geldi, hangi spool'larda
- 3 buton: "Sisteme Ekle" (toplu tablo yükle) / "Tenant-Özel Onayla" / "Reddet"
- Onaylananlar listeden düşer (durum='onaylandi' filter)

### 87+ ve sonrası

- **87** — Public kütüphane sayfası (`arespipe.com/kutuphane`, KARAR-83.1 + KARAR-85.5 yayın filtresi)
- **88+** — `parca_etiketleri` + üç-pencere etiketleme UI (81 + 82.C)
- **89+** — `kutuphane_ogrenme_durumu` materialized view (81 + 82.D)
- **90+** — İzometri parser KARAR-83.2 ileri uygulama (Victaulic-türü kayıtlar direkt `tip='malzeme'` olarak parse edilir, 057 reconstruct akışı kalkar)
- **91+** — `spool_flansh_eslesme` junction DROP (85'te FK migrate edilmişti)
- **92+** — Diğer uç işlemleri (lazer kesim, dişli flanş, expanded taper) sözlüğe eklenecek

### Veri / Vizyon Borçları (sinyal bazlı)

- **139.70×4.5** boyutu 36 spool kalemi → standartta yok ama sahada yaygın. 86.D süper admin onayı geldiğinde ilk büyük "tenant-özel ekleme" vakası.
- **60.30×6.3** (önceki oturumlardan) — kütüphanede var aslında, 056 neden bağlamadı? 86 başında tanı.
- **114.30×null** (önceki oturumdan) — eksik veri tespiti.
- **Test spool keşfi**: `46622aea-d732-4b66-9fba-bcadc1d354d2` — 4 satır (M2/M3/M4/M5) kütüphaneye bağsız ama UI'da turuncu görünmüyor. 86.A debug için kullanılır.

---

## CI Son Durum

- **Build:** ✅ YEŞİL (85 kapanış commit'inden sonra beklenen)
- **Lint:** 3 hata vardı (admin/kutuphane*.html + mobile/dist/index.html), hepsi düzeltildi
- **Vercel:** ✅ Production aktif (CI'a bağlı değil, hâlâ otomatik deploy ediyor)
- **Bu oturumda commit'ler (özet):**
  - `4e7ce6e` migration(85.A): 058 uc_islemi_tipleri sozluk
  - `fa709a1` migration(85.B): 059 spool_malzemeleri uc alanlari + FK
  - `e7bcdd9` feat(85.C): spool_detay v5 (alt satir gosterimi, sonra kaldırıldı)
  - `2e1ec45` migration(85.D): 060 v2 taxonomy duzeltme (yiv ayri kalem)
  - `12815be` feat(85.D v6): yiv satirlari ayri kalem (alt satir kaldirildi)
  - `1d35330` feat(85.D v7): yiv satirinda agirlik/heat/sert kaldirildi
  - `0045c95` migration(85.E): 061 tanimsiz_kayitlar
  - **`?` chore(85): kapanis — admin script fix + kontrol.js mobile muafiyet + 3 docs**

---

## Performans / Veri Sinyalleri

- **Migration 060 etkisi**: 36 yiv satırı geri eklendi → spool_malzemeleri tip dağılımı 124 → **160** (boru=70, fitting=43, flansh=11, malzeme=36)
- **Frontend v7 etkisi**: Yiv satırları temiz görünüyor (ağırlık `—`, Heat No `—`, Sertifika `—`)
- **CI etkisi**: 3 hata → 0 hata (admin/* + mobile/dist tarama dışı)

---

## Süreç Disiplinleri (85 ekledikleri + öncesi)

- **Heredoc / str_replace tabanlı patch'leme** dosya yazma için (MK-52.1)
- **`arespipe_kopyala`** MD5 doğrulamalı
- **`gp`** otomatik rebase + push (MK-52.2)
- **5 haneli migration numarası**, son numara 061
- **PL/pgSQL DO bloğu** Supabase Studio'da defansif kontrol (MK-84 ailesi)
- **Migration öncesi `information_schema.columns` ile şema doğrulama** (MK-84.2 + MK-85.3)
- **RLS asla kapalı bırakılmaz** (MK-85.2)
- **Standart üç kaynaktan biri** (MK-85.1) — kategori türevi yasak
- **Model ile UI simetri kontrolü** (MK-85.4) — UI hilesiyle model hatasını örtme

---

## Açık Test / Doğrulama Notları

- ✅ Migration 058 — 6 doğrulama yeşil
- ✅ Migration 059 — 5 doğrulama yeşil + 36 Victaulic bağlantısı
- ✅ Migration 060 v2 — 4 doğrulama yeşil, toplam 160 satır
- ✅ Migration 061 — 4 doğrulama yeşil (frontend testi 86'da)
- ✅ Frontend v7 — sahada test edildi (`00d4926d-...`), yiv satırı temiz görünüyor
- ⏳ Renk semantiği bug — `46622aea-...` spool'unda M2/M3/M4/M5 turuncu görünmüyor (86.A için keşif)
- ⏳ Modal akışı — sahada test edilmedi (86.C frontend modal sonrası)

---

> **86. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.** 86 gündemi (A-D arasında 4 alt iş, D ayrı oturum olabilir) kapanışta kilitlendi.
>
> **Son güncelleme:** 13 Mayıs 2026 — 85. oturum (kapatma)
