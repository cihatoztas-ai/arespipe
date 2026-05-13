# CLAUDE-SON-OTURUM — 84. Oturum Detaylı Raporu

> **Tarih:** 13 Mayıs 2026
> **Süre:** ~5-6 saat
> **Önceki:** 83 (commit `b19ba26`)
> **Sonraki:** 85 — Uç işlemi sözlük katmanı + tanımsızlık tam akış (gündem: `docs/CLAUDE-SONRAKI-OTURUM.md`)

---

## Ana Çıktılar

| # | İş | Durum | Commit |
|---|---|---|---|
| 057 | Uç işlemi taxonomy refactor migration (36 Victaulic) | ✅ DB + repo | `3fb7167` |
| 054/055/056 | Önceki oturumdan kayıp migration'lar | ✅ Repo'ya kazandırıldı (önceki commit) | `b19ba26..3fb7167` arası |
| 84.E v1 | spool_detay Standart sütunu — nested join naive syntax | ❌ Revert | `7bc75a1` → `77b806d` |
| 84.E v3 | Standart sütunu sadece boru için (alias `boru_lib`) | ✅ Canlı | `d3d35d5` |
| 84.E v4 | Tanımsızlık placeholder + uydurma std kaldırıldı | ✅ Canlı | `3385582` |

---

## 84.A — Migration 057 (KARAR-83.2 DB tarafı)

**Hedef**: 36 Victaulic Groove-Steel kaydını parent boruya `uc_a_islemi='groove_victaulic'` olarak migrate et, sonra Victaulic satırlarını sil.

### Adım 1 — Veri keşfi

4 tanı sorgusu çalıştırıldı:
- **Sorgu 1**: `toplam_victaulic` = **36** ✅
- **Sorgu 2**: Aynı spool'da boru sayısı dağılımı
  - "1 — net" (spool'da tek boru): 19 Victaulic
  - "2+ — çoklu boru": 17 Victaulic
  - "0 — yetim": **0** ✅ (silinmesi gereken yetim kayıt yok)
- **Sorgu 3**: Çoklu boru senaryolarında `dis_cap_mm` filtresi sonrası kalan aday boru
  - 12 satır: filtreden sonra tek aday (kesin atama)
  - 5 satır: filtreden sonra 2-3 aday (deterministik en eski çap-uyumlu seçim)
- **Sorgu 4**: Aynı spool'da birden fazla Victaulic
  - 5 spool'da 2'şer Victaulic (139.70 + 60.30) — farklı çaplar → farklı borulara

**Karar**: B senaryosu (5 belirsiz kayıt) için "deterministik en eski çap-uyumlu boru" seçimi onaylandı (kullanıcı A seçeneği).

### Adım 2 — Migration v1 → v2 → v3 iterasyonu

- **v1 (MD5 `0b856d10...`)**: BEGIN/COMMIT bloklu, Supabase Studio "syntax error at BEGIN" hatası verdi
- **v2 (MD5 `dce7ba1f...`)**: PL/pgSQL DO bloğu ile atomik UPDATE+DELETE + defansif ROW_COUNT kontrolü. `guncelleme = now()` kolonu yok → 42703 hatası
- **v3 (MD5 `4043fc77...`)**: `guncelleme = now()` kaldırıldı, başarıyla çalıştı

### Adım 3 — Sonuçlar

Migration 057 v3 RAISE NOTICE çıktısı (Messages sekmesi):
```
NOTICE: UPDATE -> 36 boru satirina uc_a_islemi=groove_victaulic atandi
NOTICE: DELETE -> 36 Victaulic satiri silindi
```

Doğrulama:
- **D1**: kalan_victaulic = 0 ✅
- **D2**: groove_victaulic alan boru = 36 (mükemmel, çakışma yok)
- **D3**: tip dağılımı boru=70, fitting=43 (önce 79 idi, -36 Victaulic ✅), flansh=11
- **D4**: çap × et dağılımı: DN139.70×4.5 → 29 / DN60.30×4.5 → 6 / DN60.30×6.3 → 1 = **36/36** ✅

### Ders: MK-84.2 (DB-aware patch için şema doğrulama)

`guncelleme = now()` denemem AresPipe'da bazı tablolarda `guncelleme_at` kolonu olduğu için varsayımsal yazıldı. Aslında `spool_malzemeleri`'nde böyle bir kolon yok. v2 → v3 iterasyonu öğrenme maliyeti ile çözüldü. **Pattern**: yeni patch öncesi `information_schema.columns` ile target tabloyu doğrula.

---

## 84.B — Boru kütüphane doluluk analizi

Önceki oturumun 41 boş `boru_olculer_id` borularının tanısı.

### Sorgular ve sonuçlar

**B1**: Doluluk istatistik
- toplam_boru = 70, bağlı = 29, boş = 41, bağlı_yüzde = %41

**B2**: Boş kalan çap × et dağılımı
| dis_cap_mm | et_mm | spool_kalemi | farkli_spool |
|---|---|---:|---:|
| 139.70 | 4.500 | **38** | 30 |
| 60.30 | 6.300 | 2 | 1 |
| 114.30 | null | 1 | 1 |

**38/41 satır tek bir ölçüde toplandı**: 139.70 × 4.500 (DN125, ASME B36.10M tablosunda yer almayan tedarikçi-özel ölçü).

### Yanlış teşhis ve düzeltme (önemli ders — MK-84.3)

İlk inceleme: T2 sorgusu "29 bağlı boru" 4 farklı boru_olculer ID'sine dağılmış, hepsinin schedule_kod'u "ET4.5", ben kafamdan "139.70×4.5 sınırda olduğu için 056 et_min/et_max range'ine yapıştırdı" varsaymıştım → "halüsinasyon FK" tezi.

T4 detay sorgusu (4 ID için gerçek dis_cap_mm):
- 5323f223 DIN-2448 ET4.5 × **76.300** (DN65)
- 3c6560f1 EN-10216-1 ET4.5 × **60.300** (DN50)
- e90525eb DIN-2448 ET4.5 × **114.300** (DN100)
- 020b2157 DIN-2448 ET4.5 × **168.300** (DN150)

→ 29 boru **farklı çaplara** dağılmış, hepsi kendi çapına uygun. Migration 056 doğru iş yapmış (`dis_cap_mm + et_mm` AND eşleşmesi). T5 = 0 ile kesinleştirildi (yanlış FK yok).

**Ders**: Aggregate sorgu sonuçlarından inference yapmak risklidir. ID listesi geldiğinde detay sorgusu çalıştırılmalı.

### Sonuç: 139.70×4.5 standartta yok ama saha kullanıyor

ASME B36.10M NPS 5 et değerleri: 3.40 (Sch20) / 4.78 (Sch30) / 6.55 (STD). DIN-2448/EN-10216-1 et tablosu: 3.2/4.0/5.0/6.3/7.1. **4.5 hiçbir resmi tabloda yok.** Tersane tedarikçisinin özel ölçüsü. 30 farklı spool × 38 kalem = büyük etki.

Bu durum **KARAR-84.2 (öneri akışı)** için tam pilot vaka.

---

## 84.C — Fitting/Flansh FK bağlama (84'e dahil edilmedi)

Planlanmıştı ama oturum kapasitesi nedeniyle 85+'a ötelendi. Sebep: 84.E iterasyonu uzun sürdü, ayrıca fitting/flansh tanım parsing riski (hayalî eşleşme) için R-10 mockup gerekiyor.

---

## 84.D — Boru modal FK kalıcı kaydetme (84'e dahil edilmedi)

Aynı sebep, 85+'a.

---

## 84.E — spool_detay Standart sütunu (4 fail-fix döngüsü)

### v1 (commit `7bc75a1`, REVERT)

**Patch**: SELECT'e nested join `boru_olculer(standart,schedule_kod)` + `fitting_olculer(standart)` + `flansh_olculer(standart)` + 5 ek patch (THEAD/MAP/render/colspan).

**Hata**: Sayfa açıldı, **malzeme listesi 0 kalem** göründü. Console: `Failed to load resource: 400 Bad Request`.

**Sebep**: PostgREST nested join syntax'ı tablo adı ile FK adı eşleşmediğinde fail oluyor. `spool_malzemeleri.boru_olculer_id` FK var ama PostgREST `boru_olculer(...)` syntax'ını otomatik çözemedi.

**Çözüm**: `git revert HEAD && gp` → 1-2 dakikada üretim geri geldi.

### v2 (yazıldı ama push edilmedi)

**Patch**: Explicit FK alias `boru_olculer:boru_olculer_id(...)` + `fitting_olculer:fitting_olculer_id(...)` + `flansh_olculer:flansh_olculer_id(...)`.

**Hata**: Sayfa açıldı, **yine 400**. Console: `code: 42703 — column fitting_olculer_2.standart does not exist`.

**Sebep**: PostgREST alias'ları çözebildi (suffix `_2` ile disambig yaptı), ama `fitting_olculer` tablosunda `standart` adında bir kolon yok. Önceden sadece `boru_olculer.standart`'ı T1 sorgusu ile doğrulamıştım, fitting/flansh şemasını hiç sorgulamadım.

**Çözüm**: v3'e geçiş — fitting/flansh nested join'ler çıkarıldı, şema doğrulama sorgusu paralel çalıştırıldı.

### Şema keşfi (paralel olarak)

```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE table_name IN ('boru_olculer','fitting_olculer','flansh_olculer')
ORDER BY table_name, ordinal_position;
```

Sonuç:
- `boru_olculer`: `standart` (TEXT, örn. "DIN-2448")
- `fitting_olculer`: **`geometri_std`** (kolon adı farklı!)
- `flansh_olculer`: **`geometri_std`** + `flansh_tipi` + `basinc_sinifi`

**Yapısal tutarsızlık** keşfedildi. `boru_olculer` 36. oturumda 8-maddeli mimari ile yazıldı, fitting/flansh sonradan farklı konvensiyonla. 85.D'de fitting/flansh için ayrı patch yazılacak.

### v3 (commit `d3d35d5`, CANLI)

**Patch**: SELECT'te sadece `boru_lib:boru_olculer_id(standart, schedule_kod)` (custom alias `boru_lib` PostgREST suffix sorununu da önler). Fitting/flansh tamamen çıkarıldı.

**Sonuç**: Sayfa **çalıştı**, malzeme listesi göründü. Boru satırlarında Standart sütunu doldu. Fitting/flansh için `boru_lib` null → "—" veya kalite_std fallback gösterildi.

### v4 (commit `3385582`, CANLI — şu anki sürüm)

**Cihat'ın geri bildirimi**: 
- "DIN 17100" italik fallback **uydurma standart yanılgısı** yaratıyor — kaldırılmalı
- Boş "—" gösterilen satırlar **tıklanır olsun**, kullanıcı oradan tanımsız malzeme öneri akışını başlatabilsin
- "Standart malzemeler gibi tanımlayalım ama standart dışı olduğunu da bilelim"

**Patch 6 yeniden**: 
- Hücre içeriği sadece `geom_standart` veya `—` (kalite_std fallback hücreden kaldırıldı, sadece tooltip'te)
- KARAR-83.1 iki boyutlu standartlık tutarlılığı sağlandı

**Patch 7 yeni**: 
- `malz-standartdisi` sınıflı satırlar **tıklanır** olur (eğer boru/flansh modal yoksa)
- `tanimsizModalAc(m.id)` placeholder fonksiyonu eklendi
- confirm() dialog malzeme bilgilerini gösterir, "Tamam" derse toast: "Süper admin onayı 85+ oturumda devreye girer"

Sayfa çalıştı (test push sonrası doğrulandı). 85.E'de gerçek modal + DB INSERT akışı eklenecek.

---

## Tasarım Kararları — Uç İşlemi Katmanı (85'e devren)

Cihat 84'ün sonunda "yivin de standartı var" diye sordu. Bu, KARAR-83.2'nin doğal uzantısı.

### Web search ile doğrulama

**ANSI/AWWA C606-15** Victaulic için ana standart: "AWWA C-606 – Grooved and Shouldered Joints". Kapsam: "Metallic IPS pipe, ¾–24 in. (steel, aluminum, brass)".

Diğer uç işlemleri (kafa + web bilgisi):
- `bevel` → ASME B16.25 (Buttwelding Ends)
- `threaded` → ASME B1.20.1 (NPT) veya ISO 7-1 (BSPT)
- `socket` → ASME B16.11 (Socket-Welding and Threaded Fittings)

### Cihat'ın "yaka" tarifi

Hazır Lap Joint Stub End (ASME B16.9 fitting, ayrı parça) DEĞİL, **borunun ucuna makinayla form verilerek oluşturulan yaka** istedi.

Web search: "The type C stub end can be used for standard lap joint flange and slip on flange. It is flared leaving a rounded edge at the inside diameter of the lap."

Terminoloji: **Type C Stub End** / **Vanstone Flared Lap**. Standart: "Dimensions and manufacturing tolerances are covered in ASME B16.9 - Butt Weld Fittings and MSS-SP-43".

→ `yaka_formlu` kodu, varsayılan_std `MSS SP-43`, kategori `flansli`.

### Tasarım: Sözlük tablosu + FK pattern (KARAR-84.1, KARAR-84.4)

3 seçenek arasında karar:
- **(A) JS hardcoded mapping** — basit, ama "kütüphane felsefesine" aykırı
- **(B) DB kolonu** — kullanıcı override edebilir ama sözlük yok
- **(C) Sözlük tablo + FK** — temiz, esnek, yeni tip için sıfır kod değişikliği ✅

(C) seçildi. Yapı:

```
uc_islemi_tipleri (kod PK, ad_tr, ad_en, varsayilan_std, alternatif_std jsonb, kategori, ...)
  ├─ INSERT seed: 6 satır (plain, bevel, socket, threaded, groove_victaulic, yaka_formlu)
  ├─ RLS: tüm okur, super_admin yazar
  └─ Realtime publication'a eklenir

spool_malzemeleri
  ├─ uc_a_aciklama TEXT      (müşteri raw metni - KARAR-84.5)
  ├─ uc_b_aciklama TEXT
  ├─ uc_a_std      TEXT      (override - NULL ise sözlükten gelir)
  ├─ uc_b_std      TEXT
  └─ uc_a_islemi/uc_b_islemi CHECK → FK to uc_islemi_tipleri(kod)
```

UI'da Standart sütunu çoklu satırlı:
```
DIN-2448 ET4.5            ← ana satır (boru/fitting/flansh std)
↳ A: Victaulic Style 77 (AWWA C606)   ← raw + parantezde std
↳ B: Düz                              ← plain ise gösterilmez aslında
```

`uc_a_aciklama` öncelikli (müşteri raw), yoksa sözlük `ad_tr` kullanılır. Standart parantezde her zaman.

### İleri genişleme

Yeni uç işlemi geldiğinde sıfır kod değişikliği:
```sql
INSERT INTO uc_islemi_tipleri (kod, ad_tr, varsayilan_std, kategori)
VALUES ('expanded_taper', 'Konik Genişletilmiş', 'TEMA Std', 'flansli');
```

Sözlüğe gelecek aday tipler: lazer kesim varyantları, ANSI flange-end, diş varyantları (NPT vs BSPT vs metric), expanded taper (eşanjör uçları), pres bağlantı, vb.

---

## Yeni Mimari Kurallar (84)

### MK-84.1 — Migration commit eksiksizliği

Migration dosyaları Supabase Studio'da çalıştırıldıktan sonra **aynı oturum içinde** repo'ya commit edilmeli. "Repo'da arşivde" iddiası `git log` çıktısı ile doğrulanır. Kapanış checklist'ine eklendi: `git status` clean olmalı.

**Vaka**: 83'te 054/055/056 unutuldu. 84'te 056'nın gerçek SQL'ini görmeden teşhis koymaya çalıştık → "yanlış FK" hipotezine girdik. Cihat history'den alıp önceki oturuma push ettiği için audit tamamlandı.

### MK-84.2 — DB-aware patch için şema doğrulama

Yeni nested join veya SET cümlesi eklerken target tablodaki kolon adı `information_schema.columns` ile doğrulanır. Bu, 84.E v1 → v2 → v3 zincirini yaratan ana sebep.

**Vaka**: `fitting_olculer.standart` kolonu olduğunu varsaydım (boru'dan extrapolation), aslında `geometri_std`'di. v1 ve v2 fail oldu.

### MK-84.3 — Aggregate vs detay sorgu disiplini

ID listesi içeren aggregate sorgu sonuçlarından inference yapmadan önce detay sorgusu çalıştırılır. Aksi halde çapraz yanılgı riski yüksek.

**Vaka**: T2'deki 4 boru_olculer ID'sini çap bilgisi olmadan "yanlış-bağlı" sanmıştım. T4 detay sorgusu farklı çapları gösterdi → 056 aslında doğru iş yapmıştı.

### MK-84.4 — Sözlük tablosu + FK pattern

Genişleyebilir tip listeleri için CHECK enum yerine sözlük tablosu + FK kullanılır. Yeni değer = INSERT bir satır + sıfır kod değişikliği. KARAR-84.1'in genelleştirilmiş hâli.

### MK-84.5 — Müşteri raw metni saklanır

İzometriden gelen orijinal metin `*_aciklama` kolonunda saklanır, kanonik kod (`uc_a_islemi`) ile eşleştirilir. UI raw metni gösterir (müşterinin dokümandaki orijinal terimini "kaybetmez"), arka planda biz kategorize ederiz.

**Felsefe**: Müşteri "Vic Style 77" yazmışsa o görünür; "yiv" demişse o görünür; ama her ikisi de `groove_victaulic` kanonik koduna bağlı, AWWA C606 standartı arka planda.

---

## Veri / Performans Sinyalleri

- **Migration 057**: -36 spool_malzemeleri satırı. Tablo daha temiz.
- **84.E v4**: 41 boş `boru_olculer_id` satırı sahada test edilebilir (turuncu + tıklanır). 38'i 139.70×4.5 ortak vaka.
- **Şema tutarsızlığı**: `boru_olculer.standart` vs `fitting_olculer.geometri_std` vs `flansh_olculer.geometri_std`. 86+ refactor adayı.

---

## CI / Commit Listesi

84 boyunca:
1. `3fb7167` migration(84.A): 057 uc islemi taxonomy refactor — 36 Victaulic parent boruya nitelik (KARAR-83.2)
2. `7bc75a1` feat(84.E): spool_detay Standart sutunu — REVERT EDILDI (PostgREST 400)
3. `77b806d` Revert "feat(84.E)..."
4. `d3d35d5` feat(84.E v3): Standart sutunu sadece boru icin (fitting/flansh standart kolonu yok) — PostgREST 42703 fix
5. `3385582` feat(84.E v4): standart disi satirlar tiklanir + tanimsiz modal placeholder — uydurma std kaldirildi
6. (kapanış) docs(84): oturum kapanis — 057 + 84.E v4 + uc islemi sozluk tasarimi + 85'e devir

Önceki oturumdan eklenen (Cihat ayrı push):
- `054_taxonomy_temizligi.sql`
- `055_fk_kolonlari_junction_migrate.sql`
- `056_boru_backfill.sql`

---

## Açık Test / Doğrulama Notları

- ✅ Migration 057 v3 çalıştı, sonuçlar doğrulandı (D1-D4 hepsi yeşil)
- ✅ T5 sorgusu = 0 (yanlış FK yok)
- ✅ Şema sorgusu çalıştırıldı, 3 tablonun kolon listesi alındı
- ✅ 84.E v4 push edildi, sayfa açılışı test edildi
- ⏳ Sahada `tanimsizModalAc` confirm() prototipi test edilecek (kullanıcı geri bildirimi → 85.E modal tasarımına girdi)
- ⏳ 60.30×6.3 boş 2 kalemin nedeni hâlâ açık (85+ tanı bonus)

---

## Süreç Disiplinleri

- **Heredoc / str_replace tabanlı patch'leme**
- **`arespipe_kopyala`** MD5 doğrulamalı (MK-52.1)
- **`gp`** otomatik rebase + push (MK-52.2)
- **PL/pgSQL DO bloğu** Supabase Studio'da BEGIN/COMMIT yerine — `GET DIAGNOSTICS ROW_COUNT` + `RAISE NOTICE` ile defansif kontrol
- **Yeni FK / SET cümlesi** öncesi `information_schema.columns` ile şema doğrulama (MK-84.2)
- **Aggregate sonuçtan inference** öncesi detay sorgusu (MK-84.3)
- **Migration commit eksiksizliği**: kapanışta `git status` clean (MK-84.1)

---

> **84. oturum kapatma:** 6 saatlik yoğun bir oturum, 4 fail-fix döngüsü, 2 önemli tasarım kararı (sözlük tablo + müşteri raw metin), 5 yeni MK kuralı.
>
> **85. oturum açılışında** bu dosya, `son-durum.md` ve `CLAUDE-SONRAKI-OTURUM.md` okunur. 85.A migration 058 ile başlanır.
