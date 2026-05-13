# AresPipe — Son Durum

> **Son güncelleme:** 13 Mayıs 2026 — 84. oturum (KAPATILDI ✅)
> **Bir önceki oturum:** 83. oturum — Spool ⇄ Kütüphane bağlama bütünleştirmesi (commit `b19ba26`)
> **Sonraki oturum:** 85 — Uç işlemi sözlük tablosu (058) + spool 4 kolon (059) + UI alt-satır gösterimi + tanımsızlık tam akış DB tarafı

---

## 84. Oturum Özeti — Uç İşlemi Taxonomy Refactor + Standart Sütunu + Tanımsızlık Prototipi

84'ün ana ekseni KARAR-83.2'nin DB tarafı uygulamasıydı (Migration 057). Sonra zincir reaksiyonu: spool_detay'a Standart sütunu eklerken keşfedilen veri sürprizleri, 4 fail-fix döngüsü, tanımsızlık akışının prototipi, ve uç işlemi katmanı için tasarım netleştirildi.

Akış altı dalga halinde ilerledi:

1. **Migration 057 (KARAR-83.2 DB tarafı)** — `spool_malzemeleri` tablosuna `uc_a_islemi` + `uc_b_islemi` TEXT kolonları + CHECK constraint (5 değer). 36 Victaulic Groove-Steel kaydı parent boruya `uc_a_islemi='groove_victaulic'` olarak migrate edildi. Veri keşfi sonuçları: 19 net (tek boru), 12 çoklu boru-çap uyumlu, 5 belirsiz (deterministik en eski çap-uyumlu seçim). Çakışma yok: 29+6+1 = 36 boru. DELETE 36 Victaulic satırı. Sonuç tip dağılımı: boru=70, fitting=43, flansh=11.

2. **Kayıp migration'lar (054, 055, 056) repo'ya kazandırıldı** — 83 kapanışında "repo'da arşivde" yazılı ama gerçekte commit edilmemiş 3 dosya. Cihat Supabase Studio history'sinden alıp önceki oturuma push etti. MK-84.1 (yeni) bu vakadan doğdu.

3. **spool_detay Standart sütunu — 4 fail-fix döngüsü** — Cihat'ın ihtiyacı: malzeme listesinde her satırın hangi standarda bağlı olduğu görünsün. v1→v2→v3→v4 iterasyonu:
   - **v1 fail**: PostgREST `boru_olculer(standart)` nested join'i reddetti (400, FK alias gerekiyor)
   - **v2 fail**: Explicit FK alias `boru_olculer:boru_olculer_id` denendi ama yine 400 — `fitting_olculer_2.standart` kolonu yok (42703); fitting/flansh şemasını önceden kontrol etmemiştim
   - **v3 (canlı)**: Sadece boru için (`boru_lib:boru_olculer_id`), fitting/flansh çıkarıldı, custom alias çakışma riskini de ortadan kaldırdı. Sayfa çalıştı.
   - **v4 (canlı)**: Cihat'ın geri bildirimi sonrası: "DIN 17100" kalite_standart fallback'i hücreden kaldırıldı (sadece tooltip'te kalır), turuncu satırlar tıklanır oldu, `tanimsizModalAc` placeholder confirm() prototipi eklendi.

4. **139.70 × 4.5 keşfi — bu ölçü kütüphanede gerçekten yok** — T4 sorgusu ile 29 bağlı borunun farklı çaplara (76.1/60.3/114.3/168.3) dağıldığı görüldü. Migration 056 doğru iş yapmış (yanlış teşhis koymuştum, T5=0 ile düzeltildi). 38 boş satır (139.70×4.5) → bu ölçü hiçbir resmi DIN/EN tablosunda yok, tersane tedarikçisinin özel ölçüsü. Senaryo: 84.F (tanımsızlık öneri akışı) için tam pilot vaka.

5. **Uç işlemi standart katmanı tasarımı** — Cihat'ın "yivin de standartı var" tespiti. Web search ile ANSI/AWWA C606 doğrulandı (Victaulic). Diğer uç işlemleri için standartlar listelendi. **MK-83.2 felsefesinin uzantısı**: uç işlemleri tip enum'una eklenmez, sözlük tablosu + FK pattern ile genişletilebilir altyapı tasarlandı.

6. **Yaka_formlu eklendi** — Cihat'ın "hazır yaka değil, makina ile boru ucuna açılan yaka" tarifi. Web search: Type C Stub End / Vanstone Flared Lap, MSS SP-43 standartlı. Sözlüğe 6. satır olarak girer (85'in seed migration'ında).

---

## Yapılanlar (84)

### Migration'lar

- **`057_uc_islemi_taxonomy_refactor.sql`** (168 satır, MD5 `4043fc77...`)
  - Şema: `uc_a_islemi` + `uc_b_islemi` TEXT + CHECK constraint (5 değer)
  - PL/pgSQL DO bloğu: atomik UPDATE+DELETE + defansif `ROW_COUNT` kontrolü
  - Atama planı SELECT (UPDATE öncesi inceleme) + 4 doğrulama SELECT (UPDATE sonrası)
  - RAISE NOTICE log'lar Supabase Studio "Messages" sekmesinde görünür
  - Sonuç: 36/36 mükemmel atama, çakışma yok

- **054, 055, 056 (önceki oturumdan kayıp)** — Cihat Supabase Studio history'sinden alıp 84'ün başında push etti (audit trail tamamlandı)

### Frontend (`spool_detay.html` — 3806 → 3885 satır, +79)

- **SELECT cümlesi**: `boru_lib:boru_olculer_id(standart,schedule_kod)` nested join (custom alias)
- **MALZEME map**: `geom_standart` ve `geom_schedule` alanları (sadece boru için)
- **THEAD**: 14. sütun "Standart" (Kalite ile Çap arasında)
- **TBODY render**:
  - Hücre içeriği: `DIN-2448 ET4.5` (mavi, geom var) veya `—` (geom yok)
  - Kalite std (DIN 17100 vb.) sadece tooltip'te kalır — UI'da "uydurma standart" izlenimi yok
  - Standart-dışı satırlar tıklanır → `tanimsizModalAc(m.id)` 
- **`tanimsizModalAc` placeholder fonksiyonu**: confirm() dialog malzeme bilgilerini gösterir, "Tamam" derse toast bildirim ("Süper admin onayı 85+'da")
- **colspan 13 → 14** (newRow, addTrigger, boş tablo)

### Kararlar Alındı (84)

- **KARAR-84.1** — Uç işlemi standart bilgisi DB tarafında saklanır (JS mapping yerine sözlük tablosu pattern'i). Önerilen tasarım: `uc_islemi_tipleri(kod, ad_tr, varsayilan_std, alternatif_std jsonb, kategori, ...)`. `spool_malzemeleri.uc_a_islemi` CHECK constraint kaldırılıp bu sözlüğe FK ile bağlanır. Yeni uç işlemi eklemek için sadece INSERT.

- **KARAR-84.2** — Tanımsız malzemeler için "öneri" akışı. UI'da turuncu satıra tıklanınca modal açılır → kullanıcı önerir → süper admin paneline gider → "Sisteme ekle / Tenant-özel / Reddet" karar verilir. 84'te confirm() placeholder, 85+'da gerçek DB tablosu (`tanimsiz_malzeme_onerileri`) + admin sayfası.

- **KARAR-84.3** — DIN 17100 gibi kalite standartı, ölçü kütüphanesine bağlı olmayan satırda **gösterilmez** (uydurma standart yanılgısı yaratır). Hücrede `—`, tooltip'te detay korunur. KARAR-83.1 iki boyutlu standartlığın doğal sonucu.

- **KARAR-84.4** — `yaka_formlu` (makina ile borunun ucuna açılan yaka, Type C Stub / Vanstone Flared Lap, MSS SP-43) sözlüğün ilk seed'inde yer alır. Hazır stub end (fabrika yapımı) ayrı parça olarak fitting kapsamında kalır.

### Yeni Mimari Kurallar

- **MK-84.1** — **"Oturum kapanışındaki push paketi eksiksiz olmalı."** Migration dosyaları Supabase Studio'da çalıştırıldıktan sonra mutlaka aynı oturum içinde repo'ya commit edilmeli. "Repo'da arşivde" iddiası `git log` ile doğrulanır. 83'te 054/055/056 unutuldu → 84'te 056'nın gerçek SQL'ini bilmeden teşhis koymaya çalıştık (yanlış yola gittik). Bundan sonra son `git status` kontrolü zorunlu.

- **MK-84.2** — **"DB-aware patch yazmadan önce şema doğrulanır."** v1 ve v2 fail'lerinin ortak sebebi: `boru_olculer.standart` kolonunu T1 sorgusuyla doğruladım ama `fitting_olculer.standart` ve `flansh_olculer.standart` kolonlarını hiç sorgulamadım. Üç tabloda farklı kolon adları çıktı: `standart` (boru) vs `geometri_std` (fitting/flansh). MK-83.3 silent state'in kuzeni. Pattern: yeni nested join eklerken `information_schema.columns` ile target tablodaki ilgili kolon adlarını doğrula.

- **MK-84.3** — **"Aggregate sorgu sonuçlarını detay sorgusuyla doğrula."** T2'de "29 bağlı boru" 4 farklı boru_olculer ID'ye dağılmıştı, ben çap bilgisi olmadan "halüsinasyon FK" sandım. T4 detay sorgusu farklı çapları gösterdi → tahminim yanlıştı, 056 doğru iş yapmıştı. Aggregate ID listelerinden inference yapmadan önce detay sorgusu zorunlu.

- **MK-84.4** — **"Uç işlemleri sözlük tablosu + FK ile genişletilebilir."** CHECK constraint enum'ları yeni uç tipi (yaka, dişli flanş, expanded taper, vb.) ekleneceği zaman migration ve kod değişikliği zorlar. Sözlük tablo pattern'i: INSERT bir satır, sıfır kod değişikliği.

- **MK-84.5** — **"Müşteri raw metni saklanır, kanonik kodla eşleştirilir."** İzometride "Victaulic Style 77 grooved end A" yazıyorsa: `uc_a_aciklama="Victaulic Style 77 grooved end A"` (raw) + `uc_a_islemi='groove_victaulic'` (kanonik) + `uc_a_std=null` (sözlükten gelir). UI raw'ı veya kanonik ad_tr'yi gösterir, standart parantezde. Müşteri dokümandaki orijinal terimini "kaybetmez", arka planda biz kategorize ederiz.

---

## Açık Borçlar (85+ Oturumlara Devreden)

### 85. Oturum gündemi — Uç işlemi sözlük katmanı + tanımsızlık tam akış

**85.A — Migration 058: `uc_islemi_tipleri` sözlük tablosu** (15 dk)

```sql
CREATE TABLE uc_islemi_tipleri (
  kod              TEXT PRIMARY KEY,
  ad_tr            TEXT NOT NULL,
  ad_en            TEXT,
  varsayilan_std   TEXT,
  alternatif_std   JSONB,
  kategori         TEXT,
  aktif            BOOLEAN DEFAULT true,
  sira             INT,
  aciklama         TEXT,
  olusturma_at     TIMESTAMPTZ DEFAULT now()
);
```

Seed 6 satır: plain (—) / bevel (ASME B16.25) / groove_victaulic (ANSI/AWWA C606) / threaded (ASME B1.20.1) / socket (ASME B16.11) / yaka_formlu (MSS SP-43).

RLS: tüm tenant'lar okur, sadece super_admin yazar.

**85.B — Migration 059: spool_malzemeleri 4 yeni kolon + CHECK → FK** (10 dk)

```sql
ALTER TABLE spool_malzemeleri
  ADD COLUMN uc_a_aciklama TEXT,    -- Müşteri raw metni
  ADD COLUMN uc_b_aciklama TEXT,
  ADD COLUMN uc_a_std      TEXT,    -- Override (NULL ise sözlükten gelir)
  ADD COLUMN uc_b_std      TEXT;

ALTER TABLE spool_malzemeleri DROP CONSTRAINT spool_malzemeleri_uc_islemi_chk;

ALTER TABLE spool_malzemeleri
  ADD CONSTRAINT spool_malzemeleri_uc_a_fk
    FOREIGN KEY (uc_a_islemi) REFERENCES uc_islemi_tipleri(kod),
  ADD CONSTRAINT spool_malzemeleri_uc_b_fk
    FOREIGN KEY (uc_b_islemi) REFERENCES uc_islemi_tipleri(kod);
```

**85.C — Frontend spool_detay v5** (~30 dk)
- SELECT'e nested join: `uc_a_tip:uc_a_islemi(ad_tr,varsayilan_std)` + uc_b
- TBODY Standart hücresi: ana satır (boru std) + alt satırlar (uç işlemleri varsa)
  ```
  DIN-2448 ET4.5
  ↳ A: Victaulic Style 77 (AWWA C606)
  ↳ B: Düz
  ```
- Plain ve null durumda alt satır gösterilmez

**85.D — fitting/flansh için standart sütunu (v6)** (~20 dk)
- fitting_olculer'da `geometri_std` (84.E'de keşfedildi, kolon adı farklı)
- flansh_olculer'da `geometri_std` + `flansh_tipi` + `basinc_sinifi`
- SELECT'e nested join, MAP'e geom alanları, hücre içeriği boru'ya benzer pattern

**85.E — Tanımsız malzeme öneri akışı DB tarafı** (~1 saat)
- `tanimsiz_malzeme_onerileri` tablosu: id, spool_malzeme_id (FK), tip, ham_data (jsonb), kullanici_sebep, kullanici_aciklama, kullanici_id, durum, sıklık_sayisi, tenant_id, super_admin_id, karar_zamani, karar_notu
- UNIQUE constraint: aynı ölçü+tenant kombinasyonu için tek satır (sayım artırılır)
- RLS: tenant kendi önerilerini görür/yazar, super_admin tümünü görür/karar verir
- `tanimsizModalAc` placeholder'ı gerçek modal'a yükselt (DB INSERT + toast)

**85.F — Süper admin paneli `admin/oneriler.html`** (~2 saat, ayrı oturum olabilir)
- Bekleyen öneriler listesi (sıklığa göre sıralı)
- Detay: ham veri, kullanıcı sebebi, kaç tenant'tan geldi, hangi spool'larda kullanıldı
- 3 buton: "Sisteme ekle" (sistem_preset=true) / "Tenant-özel onayla" / "Reddet"
- Onay sonrası ilgili kütüphane tablosuna INSERT + spool_malzemeleri FK güncelleme

### 86+ ve sonrası (önceki oturumlardan taşınan)

- **86** — Public kütüphane sayfası (`arespipe.com/kutuphane`, KARAR-82.5 + KARAR-83.1 yayın filtresi). 85'te tanımsızlık akışı kapanınca tetiklenir.
- **87+** — `parca_etiketleri` + üç-pencere etiketleme UI (81 + 82.C)
- **88+** — `kutuphane_ogrenme_durumu` materialized view (81 + 82.D)
- **89+** — İzometri parser KARAR-83.2 ileri uygulama (Victaulic-türü kayıtlar parça listesine eklenmez, uç işlemi olarak çıkar)
- **90+** — `spool_flansh_eslesme` junction DROP (85'te FK migrate edilmişti)

### Veri / Vizyon Borçları (sinyal bazlı)

- 139.70×4.5 → 38 spool kalemi → 30 farklı spool. Bu ölçü standartta yok ama sahada yaygın. 85.E süper admin onayı geldiğinde ilk büyük "tenant-özel ekleme" vakası olarak işlenir.
- Diğer 3 boş satır: 60.30×6.3 (2 kalem, kütüphanede var aslında — 056 neden bağlamadı? 85'te tanı), 114.30×null (1 kalem, eksik veri).

---

## CI Son Durum

- **Build:** ✅ YEŞİL (son commit `545a49b` 84.E v4 push)
- **Lint:** Yeni eklenen `tanimsizModalAc` fonksiyonu mevcut style'a uyumlu, hard-coded TR string'ler i18n kapsamında değil (modal placeholder geçici)
- **Vercel:** ✅ Production aktif
- **Bu oturumda commit'ler:**
  - `3fb7167` migration(84.A): 057 uc islemi taxonomy refactor — 36 Victaulic parent boruya nitelik (KARAR-83.2)
  - `7bc75a1` feat(84.E): spool_detay malzeme tablosu Standart sutunu — geom_standart oncelikli + kalite fallback + tooltip (REVERT EDİLDİ — PostgREST 400)
  - `77b806d` Revert "feat(84.E)..."
  - `d3d35d5` feat(84.E v3): Standart sutunu sadece boru icin — PostgREST 42703 fix
  - `3385582` feat(84.E v4): standart disi satirlar tiklanir + tanimsiz modal placeholder — uydurma std kaldirildi
- **Önceki oturumdan eklenen migration'lar** (Cihat ayrı push):
  - 054_taxonomy_temizligi.sql
  - 055_fk_kolonlari_junction_migrate.sql
  - 056_boru_backfill.sql

---

## Performans / Veri Sinyalleri

- **Migration 057 etkisi**: 36 Victaulic satırı kaldırıldı → spool_malzemeleri tablosu daha temiz; tip dağılımı boru=70, fitting=43, flansh=11 (Victaulic öncesi: fitting=79)
- **84.E v4 etkisi**: 41 boş `boru_olculer_id` satırı turuncu rozet + tıklanır (38'i 139.70×4.5)
- **MD5 dosyaları**: Migration 057 `4043fc77...`, spool_detay v4 `e42102b1...`

---

## Süreç Disiplinleri (84 ekledikleri + öncesi)

- **Heredoc / str_replace tabanlı patch'leme** dosya yazma için
- **`arespipe_kopyala`** MD5 doğrulamalı (MK-52.1)
- **`gp`** otomatik rebase + push (MK-52.2)
- **5 haneli migration numarası**, son numara 057
- **PL/pgSQL DO bloğu** Supabase Studio'da BEGIN/COMMIT yerine — `GET DIAGNOSTICS ROW_COUNT` + `RAISE NOTICE/EXCEPTION` ile defansif kontrol (MK-84 ailesi)
- **Yeni FK eklendiğinde** önce `information_schema.columns` ile target tablodaki ilgili kolon adı doğrulanır (MK-84.2)

---

## Açık Test / Doğrulama Notları

- ✅ Migration 057 RAISE NOTICE çıktıları doğrulandı: UPDATE 36/36, DELETE 36/36
- ✅ T5 sorgusu = 0 (yanlış FK yok, migration 056 doğru iş yaptı)
- ✅ 84.E v4 push edildi, Vercel deploy sonrası test bekleniyor
- ⏳ Cihat'ın 84.E v4 sayfa açılışı sonrası geri bildirimi (test sonuçları kapanış mesajına eklenir)
- ⏳ `tanimsizModalAc` confirm() prototipi sahada test edilecek (geri bildirim → 85.E modal tasarımına girdi)

---

> **85. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.** 85 gündemi (A-D arasında 4 alt iş, E-F daha geniş kapsamlı) kapanışta kilitlendi, açılış sorusu standart (git status + onay).
>
> **Son güncelleme:** 13 Mayıs 2026 — 84. oturum (kapatma)
