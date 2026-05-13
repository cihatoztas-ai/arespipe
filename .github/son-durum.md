# AresPipe — Son Durum

> **Son güncelleme:** 13 Mayıs 2026 — 83. oturum (KAPATILDI ✅)
> **Bir önceki oturum:** 82. oturum — Kütüphane envanteri sayfaları + RLS 052 + Realtime 053 (commit `bc267f0`)
> **Sonraki oturum:** 84 — Uç işlemleri taxonomy refactor (KARAR-83.2, 36 Victaulic kaydı) + Fitting/Flansh FK bağlama + 41 boş boru ölçüsü kütüphane analizi

---

## 83. Oturum Özeti — Spool ⇄ Kütüphane Bağlama Bütünleştirmesi (D) + Görsel Standart Politikası (E)

82'nin kapanışında Cihat tespit etti: spool detay sayfasında malzemelerin kütüphane tablolarıyla bağlantısı kopuk — flanş için 1 junction kaydı var, boru runtime'da eşleşiyor ama FK kaydetmiyor, fitting ve malzeme spec bağlanmıyor. Ayrıca standart olmayan malzemelerin görsel ayrımı yok. 83'te:

1. **A patch** — `spool_detay.html` select cümlesine `malzeme_tanimlari` master tablo nested join eklendi. 26'da kurulu autocomplete altyapısının silent state problemini ortaya çıkardı: 160 spool malzemesinden 121'i (`%76`) `malzeme_ref_id` ile master'a bağlıydı ama render'da kullanılmıyordu. Patch sonrası `kal_kaynak` (sistem/firma/serbest) alanı her satır için doğru hesaplanıyor.
2. **Migration 054** — Taxonomy temizliği. `tip='fitting'` altında gizli 11 flanş (Flange Slip-On, International Shore Connection) `tip='flansh'`'a taşındı. CHECK constraint: `tip IN ('boru','fitting','flansh','malzeme')`. Sonuç tipler: boru=70, fitting=79, flansh=11.
3. **Migration 055** — FK kolonları + junction migrate. 3 FK eklendi: `boru_olculer_id`, `fitting_olculer_id`, `flansh_olculer_id`. `spool_flansh_eslesme` junction'ındaki 1 kayıt FK'ya migrate edildi, tablo DEPRECATED yorumla işaretlendi (85'te DROP). FK indeksleri eklendi.
4. **Migration 056** — Boru otomatik back-fill. 70 borudan 29'u (`dis_cap_mm + et_mm` tam eşleşmesi ile) `boru_olculer_id`'ye bağlandı (%41). 41 boş satır = kütüphanenin henüz içermediği veya yazım farkı olan ölçüler. Bu liste 84'te kütüphane doldurma önceliği için altın değerinde sinyal.
5. **Patch B v1 (turuncu rozet)** — Render mantığında `kal_kaynak !== 'sistem'` ise sol kenar turuncu şerit. Test sonrası eksik kaldığı görüldü.
6. **Patch B v2 (KARAR-83.1 genişletmesi)** — İki boyutlu standartlık. Sadece kalite master'a bağlı olmak yetmiyor: tipine göre geometri kütüphanesine de bağlı olmalı. M1 satırı (St 37 sistem kalite ama 139.7×4.5 kütüphanede yok) bu boşluğa düştü ve turuncu olmadı v1'de. v2 patch'i mantığı `kalite sistem preset VE tip-bazlı geometri FK NOT NULL` olarak güncelledi. Şimdi standart-dışı her iki boyutta da görünür.

---

## Yapılanlar (83)

### Frontend (`spool_detay.html` — 3760 → 3806 satır, +46)

- **Select cümlesi genişletme** (line 978): `malzeme_ref_id, malzeme_tanimlari(kategori_kod,kalite_kod,kalite_goster,standart,tenant_id), boru_olculer_id, fitting_olculer_id, flansh_olculer_id` nested + flat FK kolonları
- **MALZEME map** (line ~1100-1125): `master` değişkeni, `kal` master fallback, yeni alanlar (`kal_standart`, `kal_kaynak`, `master_id`, `boru_olculer_id`, `fitting_olculer_id`, `flansh_olculer_id`, `tip_raw`)
- **CSS** (line 240-241): `tr.malz-standartdisi { border-left: 3px solid var(--warn); }`
- **renderMalzeme** (line 2178-2225): İki boyutlu standartlık kontrolü — `kaliteStandart && geomBagli` mavi tıklanabilir, biri eksikse turuncu rozet + tooltip ("kalite kütüphaneye bağlı değil" / "ölçü kütüphaneye bağlı değil")

### Migration'lar (`migrations/`)

- **`054_taxonomy_temizligi.sql`** — 11 flanş `fitting`'den `flansh`'a UPDATE + CHECK constraint
- **`055_fk_kolonlari_junction_migrate.sql`** — 3 FK kolonu + 1 junction kaydı migrate + DEPRECATED COMMENT + indeksler
- **`056_boru_backfill.sql`** — 29 boru satırı otomatik bağlandı (`dis_cap_mm + et_mm` exact match)

### Kararlar Alındı

- **KARAR-83.1** — **İki boyutlu standartlık + Yayın politikası.**
  - Görsel: bir spool malzeme satırı "standart" sayılır ancak ve ancak `kalite sistem preset` VE `tipine göre geometri FK NOT NULL`. Biri eksikse turuncu sol şerit + tooltip ile "standart dışı" işaretlenir.
  - Yayın: Public kütüphane sayfasında (`arespipe.com/kutuphane`, gelecek) **sadece `sistem_preset=true` kayıtlar** görünür. Standart-dışı kayıtlar (firma özel + serbest yazım) **program içi kalır**, dış dünyaya çıkmaz.

- **KARAR-83.2** — **Uç işlemleri parça değil, niteliktir.** Boru uç işlemleri (groove/bevel/threaded/socket/plain) ayrı malzeme satırı olarak değil, ait olduğu borunun bir niteliği olarak modellenmelidir. Mevcut 36 Victaulic Groove-Steel kaydı 84'te parent boruya `uc_a_islemi`/`uc_b_islemi` olarak migrate edilecek, sonra ayrı satır olarak silinecek. İzometri parser'ı bu ayrımı 85+'da otomatik yapacak. Bonus: KK cephesi "groove ucuna kaynak yapılmamalı" tarzında anomali tespitini otomatikleştirir.

### Yeni Mimari Kurallar

- **MK-83.1** — **İki boyutlu standartlık kuralı.** Bir parçanın "standart" sayılması için iki bağımsız kanıt gerekir: (1) kalite master tablosuna (`malzeme_tanimlari`) FK ile bağlı + tenant_id NULL (sistem preset), (2) tipine göre geometri kütüphanesine (`boru_olculer` / `fitting_olculer` / `flansh_olculer`) FK ile bağlı. UI bunu görsel olarak yansıtmalı; public yayın sadece bu iki kanıtı sağlayan kayıtları içermeli. Tek boyutlu standartlık (sadece kalite veya sadece geometri) yetersizdir — silent state bug'ı doğurur.

- **MK-83.2** — **Uç işlemleri ayrı satır olamaz.** Yiv açma (Victaulic groove), kaynak ağzı (bevel), diş açma (threaded), soket cep (socket) — bunlar bir parçaya uygulanan işlemlerdir, ayrı parçalar değildir. DB tasarımında borunun (`spooller` veya `spool_malzemeleri`) niteliği olarak tutulmalı. İzometri parse aşamasında "parça" listesine eklenmemelidir.

- **MK-83.3** — **Silent state tehlikesi.** DB'de bir kolon doluyor ama UI'da kullanılmıyorsa, kod kütüphanesi yarım kurulmuş demektir. Yeni FK eklendiğinde grep ile tüm SELECT cümlelerini tarayıp join atılmamış noktaları bulmak gerekir. 121 satırlık `malzeme_ref_id` doluluğu spool_detay render'ında 0 satır kullanılıyordu — A patch öncesi tipik bir silent state.

- **MK-83.4** — **Supabase UPDATE "No rows returned" yanıltıcıdır.** RETURNING'siz UPDATE'ler bu mesajı verir ama satır sayısı bilgisi gizlidir. Migration sonrası mutlaka `count(*) FILTER (WHERE fk IS NOT NULL)` ile gerçek etki doğrulanmalı. 056'da bu testle 29/70 bağlama görüldü.

---

## Açık Borçlar (84+ Oturumlara Devreden)

### 84. Oturum gündemi — Uç işlemi taxonomy refactor + Kütüphane FK bağlama tamamlama

**84.A — Migration 057: Uç işlemleri parent boruya nitelik olarak taşı (KARAR-83.2)**

36 Victaulic Groove-Steel kaydının `spool_malzemeleri`'de ayrı satır olarak tutulması yanlış. 84'te:
- `spool_malzemeleri`'ne `uc_a_islemi` + `uc_b_islemi` kolonları eklenecek (TEXT veya enum)
- Mevcut Victaulic satırlarının her biri için: aynı spool'daki parent boru bulunup, uç işlemine `'groove_victaulic'` set edilecek
- Sonra Victaulic satırları silinecek (toplam -36)
- CHECK constraint: tip='fitting' satırlar gerçekten fitting olmalı, Victaulic-türü kayıtlar reddedilmeli

İzometri parser'ı tarafının düzeltilmesi 85'e, şimdilik manuel temizlik 84'te.

**84.B — Boru kütüphanesi doluluk analizi (41 boş satır)**

29/70 bağlanma var, 41 boş satır kaldı. 84'te bunların hangi DN/Sch kombinasyonları olduğu çıkarılır:

```sql
SELECT sm.dis_cap_mm, sm.et_mm, count(*) AS spool_adet
FROM spool_malzemeleri sm
WHERE sm.tip = 'boru' AND sm.boru_olculer_id IS NULL
GROUP BY sm.dis_cap_mm, sm.et_mm
ORDER BY spool_adet DESC;
```

Çıkan ölçüler: (a) Kütüphanede gerçekten yok → ekleme önceliği. (b) Yazım/scale farkı → 056'nın `ROUND(...,2)` veya tolerans-bazlı versiyonu yazılır.

**84.C — Fitting & Flansh FK bağlama mekanizması**

Boru için 056 back-fill yeterli (tam ölçü eşleşmesi). Fitting/flansh için tanım parsing gerekiyor:
- Flansh: "Flange Slip-On PN 16" → TYPE='SO' + CLASS=PN16 → flansh_olculer eşleşme
- Fitting: "Reducer 100×50 Sch40" → parca_tipi='reducer_conc' + cap_buyuk=DN100 + cap_kucuk=DN50 + sch=40

Bu parser_kural mantığı — riskli, hayalî eşleşme yapabilir. Önerilen yaklaşım: AI öneri + kullanıcı onaylar UI. 84-85 işi.

**84.D — Boru modal'ı FK kalıcı kaydetme (frontend)**

`boruModalAc` runtime'da eşleşmeyi buluyor ama FK kaydetmiyor (her açışta sorgu tekrarlanıyor). UPSERT eklemek ufak iş — 84'te 5 dk.

### 85+ Oturumlar

- **85.A** — İzometri parser'ı uç işlemi tanıma kuralı (KARAR-83.2 ileri uygulama)
- **85.B** — Junction tablosu `spool_flansh_eslesme` DROP (1-2 oturum izleme bittikten sonra)
- **85.C** — Tek `parcaModalAc(spool_malzeme_id)` refactor (boru + fitting + flansh tek fonksiyon, mockup ile R-10)
- **86+** — Public kütüphane sayfası (`arespipe.com/kutuphane`, KARAR-82.5 + KARAR-83.1 yayın filtresi)

### 82'den taşınan açık borçlar

- **DB-driven kutuphane metadata refactor** (82.A)
- **`kutuphane_ekler` migration** (82.B)
- **`parca_etiketleri` + üç-pencere etiketleme UI** (81 + 82.C)
- **`kutuphane_ogrenme_durumu` materialized view** (81 + 82.D)

---

## CI Son Durum

- **Build:** ✅ YEŞİL (son commit Patch 3 öncesi `05551d2` Patch B v1, kapanışta tek push paketi)
- **Lint:** Patch'ler mevcut kurallarla uyumlu, yeni uyarı yok
- **Vercel:** ✅ Production aktif
- **Bu oturumdaki commit'ler (kapanışta push edilecek):**
  - `bdbb966` feat(83.A): spool_detay malzeme master tablo join — kalite_goster + standart + kaynak
  - `05551d2` feat(83.B): standart-disi kalite turuncu rozet (KARAR-83.1) — sistem mavi, firma/serbest turuncu
  - `[YENİ]` feat(83.B+): KARAR-83.1 iki boyutlu standartlik — kalite VEYA olcu kutuphanede yoksa turuncu (Patch 3)
  - `[YENİ]` docs(83): oturum kapanis - A + 3 migration + iki boyutlu standartlik + KARAR-83.2 ile 84'e devir
- **Migration'lar (Supabase Studio'da çalıştırıldı, repo'da arşivde):**
  - 054_taxonomy_temizligi.sql
  - 055_fk_kolonlari_junction_migrate.sql
  - 056_boru_backfill.sql

---

## Performans / Veri Sinyalleri

- **A patch etkisi**: 160 spool malzemesinden 121 satırda master tablo bilgisi (kategori, kalite_goster, standart) artık render'a ulaşıyor
- **Migration 056 etkisi**: 29/70 boru kalemleri kütüphaneye FK ile bağlandı (%41 — kütüphane kapsamı sinyali)
- **Taxonomy temizliği**: 11 flanş + 36 Victaulic + 39 hatalı kalite = ~%50 spool malzemesi 84'te dokunulacak (sistemik veri temizliği oturumu olarak yansıyor)

---

## Süreç Disiplinleri (83 + öncesi, değişiklik yok)

- **Heredoc / str_replace tabanlı patch'leme** dosya yazma için
- **`arespipe_kopyala`** MD5 doğrulamalı (MK-52.1)
- **`gp`** otomatik rebase + push (MK-52.2)
- **Downloads'ta indirme öncesi `_arsiv/`'e taşıma** (MK-51.1 + 83'te tekrar netleşti — Chrome (1),(2) sonek ekliyor)
- **5 haneli migration numarası**, son numara 056
- **Supabase Studio UPDATE doğrulaması**: `count(*) FILTER (WHERE fk IS NOT NULL)` zorunlu (MK-83.4)

---

> **84. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.** 84 gündemi (A + B + C + D) kapanışta kilitlendi, açılış sorusu standart (git status + onay).
>
> **Son güncelleme:** 13 Mayıs 2026 — 83. oturum (kapatma)
