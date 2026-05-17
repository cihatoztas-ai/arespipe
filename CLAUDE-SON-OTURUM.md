# CLAUDE-SON-OTURUM.md — 94. Oturum Detaylı Özet

**Tarih:** 17 Mayıs 2026
**Süre:** ~4 saat
**Ana tema:** KME OSNA-10/30 Shipbuilding PDF'inden CuNi marine kütüphanesi yüklemesi (boru + flanş)
**Sonuç:** ✅ Başarıyla kapatıldı, 92 satır CuNi veri DB'de, UI'da görünür

---

## Akış (Adım Adım)

### 1. Açılış Ritüeli
- `git pull` temiz, son commit `8f3fce9` (93 kapanışı)
- CI yeşil, branch güncel
- Cihat'ın yönü: "kütüphane hedef listemizde olan malzemeler için bana PDF indirme linklerini bul" → PDF kaynak haritası çıkarma kararı

### 2. PDF Kaynak Listesi
6 ana kaynak teyit edildi (üretici/otorite, distribütör derlemesi değil):
- KME OSNA-10/30 Shipbuilding (CuNi P0 tümü, elimizde)
- Alaskan Copper CuNi Tubing (B466/B467)
- CDA Copper-Nickel Piping (offshore otorite)
- Tenaris Dalmine Seamless Pipes (A53/A106/API 5L)
- Sandvik SAF 2205 (Duplex 2205/2507)
- + Vallourec/Tubacex/Bonney Forge (henüz aranmadı, 95+)

**Önemli mimari gözlem:** ASME A106/A53/A312/A335 boyutları zaten B36.10M/B36.19M'de var. Yeni geometri PDF'i değil, **malzeme grade'leri** (malzeme_kataloglari) eksik.

### 3. Migration 076 — DIN 86019 CuNi Boru (44 satır)

**Yapı:** 22 Standard wall + 17 Special wall + 5 Seamwelded = 44 satır

**Python sanity check (gen_migration_076.py):**
```
π × (OD - S) × S × ρ / 1000 = kg/m
Ortalama yoğunluk: 8.919 g/cm³ (DIN nominal ~8.9)
Std sapma: 0.038
Min - Max: 8.842 - 9.095
Tüm 44 satır 8.7-9.1 toleransı içinde ✓
```

**Hata 1 — JSONB vs TEXT[]:**
```
ERROR: 42804: column "pdf_anahtar_kelime" is of type text[] but expression is of type jsonb
```
Çözüm: `pdf_anahtar_kelime` ve `kullanim_sektor` ARRAY[...]::text[] syntax'a çevrildi. `materyal_kodu_listesi` JSONB kaldı.

**Hata 2 — Supabase BEGIN/COMMIT:**
```
ERROR: 42601: syntax error at or near ";"
LINE 30: BEGIN;
```
Çözüm: `grep -v -E "^(BEGIN|COMMIT);$" file | pbcopy` filtreleme. Dosyada kalır (psql/CI uyumu).

**Hata 3 — 23505 duplicate key:**
Aslında transaction başarılıydı, Supabase UI "Success" göstermedi → Cihat tekrar Run'a bastı → ikinci insert duplicate hatası. DB temizdi, COUNT(*) = 44 ile doğrulandı.

**Sonuç:** ✅ 44 satır DB'de, fizik 8.842/9.095/8.919 birebir kayıt.

### 4. Vocabulary Sorunu Tespiti — `cuni` vs `cunife`

Kütüphane envanteri sayfası (`admin/kutuphane.html`) açıldığında DIN-86019 görünmüyordu. Sebep: 3 katmanlı UI:
- Katman 1: Envanter (tablolar toplamı, görünüyordu — 495 boru)
- Katman 2: Malzeme grubu (CuNi 0 ölçü — uyumsuz vocabulary!)
- Katman 3: Standart (görünmedi çünkü Katman 2 boş)

SQL doğrulama:
```sql
SELECT malzeme_grubu, COUNT(*) FROM boru_olculer GROUP BY 1;
-- karbon: 297, paslanmaz: 80, cunife: 68, aluminyum: 50
```

DB'de `cunife` (CuNiFe = bakır-nikel-demir, bilimsel doğru — 90/10 alaşımı 1-2% Fe içerir), UI'da `cuni` arıyordu.

**KARAR-94.2:** UI fix yönü seçildi (DB tarihsel kod korunsun). 3 yerde değişiklik:
- `admin/kutuphane-malzemeler.html` line 177, 192, 207
- `kod:'cuni'` → `kod:'cunife'` (boru/fitting/flansh KONFIG)

**Dosya:** MD5 `c876b75f76c7ab27ac6d1f80b91a7ef6`, commit, push.

UI test: `kutuphane-standartlar.html?tablo=boru_olculer&mg=cunife` → DIN 86019 "Aktif" rozeti, 44/18 ölçü (102%, hedef parse rakamı yanlış — 95'te düzeltilecek).

### 5. Migration 077 — DIN 86037-2 LJ + EN 1092-3 Type 05-C (48 satır)

**Şema keşfi (önce sorgu):**
- `flansh_standart_sozluk` tablosu YOK → sözlük girişi gerekmiyor
- `flansh_olculer` 32 kolon: temel boyut + hub + raised face + bolt geometri ayrı
- Mevcut vocabulary:
  - ASME-B16.5: WN/SO/BL, basinc_sinifi '150'
  - EN-1092-1: EN-T01/05/11/12, basinc_sinifi '10'/'16'
- `yuzey_tipi`: 'RF' standart
- `malzeme_grubu`: 'karbon' (297), 'paslanmaz' (80), 'cunife' (68), 'aluminyum' (50)

**KARAR-94.3 — Teknik karar: WN → LJ**

DIN 86037-2 fiziksel olarak lap-joint stub end:
- Disc ince (5-14mm) + uzun hub (40-60mm)
- KME PDF "compatible with Outer Flanges PN 10, 16" diyor (composite design işareti)
- WN parça kendi bolt geometrisine sahip değil — outer halka (S235JR, sayfa 18) bolt'lar
- ASME B16.5'te aynı tip 'LJ' (Lap Joint) olarak adlandırılıyor

**Vocabulary:**
- `flansh_tipi='LJ'` (KME terminolojisi 'WN' yanıltıcı)
- `basinc_sinifi='PN10/16'` (composite design, outer flansh ile birlikte)
- Composite Blind için `basinc_sinifi` DN'ye göre '10' veya '16'

**Satır sayım:**
- WN flansh (LJ): 29 satır (DN20-DN1200, bazı DN'de 2 et)
- Composite Blind: 19 satır (DN10-175 PN16 = 13 + DN200-500 PN10 = 6)
- Toplam: 48 satır

**Sanity check (gen_migration_077.py):**
- LJ (eski WN): d3 < cap_mm < d2 < d4 (içe genişleme): 29/29 ✓
- BL: d1 < k < D, bolt_count >= 4: 19/19 ✓

**Hata 4 — INSERT has more expressions than target columns:**
`kaynak` kolonu boru_olculer'da var, flansh_olculer'da yok. VALUES 30, hedef 29.
Çözüm: kaynak bilgisi `notlar`'ın sonuna `| Kaynak: KME...` formatında birleştirildi.

**Hata 5 — bolt_circle_mm NOT NULL violation:**
LJ flanşlarda bolt geometrisi yok (outer halkasında). Ama schema NOT NULL diyor.

Sorgu:
```sql
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'flansh_olculer' AND is_nullable = 'NO';
-- NOT NULL: id, sistem_preset, geometri_std, flansh_tipi, basinc_sinifi,
-- flansh_od_mm, flansh_kalinlik_mm, bolt_circle_mm, bolt_count, aktif, olusturma
```

**KARAR-94.4 — Schema fix:**
Schema ASME B16.5 integral varsayımıyla yazılmış (her flansh bolt'lu). Lap-joint için yanlış. Migration 077 başına 2 ALTER eklendi:
```sql
ALTER TABLE flansh_olculer ALTER COLUMN bolt_circle_mm DROP NOT NULL;
ALTER TABLE flansh_olculer ALTER COLUMN bolt_count DROP NOT NULL;
```

**Sonuç:** ✅ 48 satır, doğrulama:
```
DIN-86037-2 | LJ     | PN10/16 | 29
EN-1092-3   | EN-T05 | 10      | 6
EN-1092-3   | EN-T05 | 16      | 13
```

### 6. Kütüphane Geliştirme Stratejisi (Süreç Kararı)

Cihat öneri: kütüphane geliştirme için **ayrı Claude projesi** açılsın. PDF'ler oraya yüklenir, **sohbette JSON üretilir**, ana projeye JSON aktarılır, oradan Migration SQL üretilir.

**Faydaları:**
- PDF'ler kalıcı project knowledge'da (her sohbette upload yok)
- Token verimli (PDF context'e değil)
- JSON ara katman = manuel kontrol noktası
- Risk izolasyonu (kütüphane sohbeti DB'ye dokunmaz)
- İki sohbet paralel ritm (kütüphane parça parça, normal geliştirme yoğun)

**Karar:** Yeni proje açılacak: `AresPipe — Kütüphane Veri Kaynakları`. Talimat dosyası ayrıca hazırlanıyor (`KUTUPHANE-PROJE-PROMPTU.md`).

---

## Değişen / Eklenen Dosyalar

| Dosya | Tür | Boyut | MD5 |
|---|---|---:|---|
| `migrations/076_din_86019_cuni_borulari.sql` | Yeni | 15291 B | `e7272e50812714d40af53065d91b0439` |
| `admin/kutuphane-malzemeler.html` | Düzenleme | — | `c876b75f76c7ab27ac6d1f80b91a7ef6` |
| `migrations/077_din_86037_2_en_1092_3_cuni_flanslari.sql` | Yeni | 24281 B | `fe1aeed872d08b17ed818f2776983535` |

---

## Hazır SQL/Python Dosyaları (Arşiv)

- `validate_kme.py` — Migration 076 fizik doğrulama (Python)
- `gen_migration_076.py` — boru SQL üreteç (Python)
- `gen_migration_077.py` — flansh SQL üreteç (Python)

Gelecekte benzer migration'larda referans olarak kullanılabilir. Yeni kütüphane projesinde de bu pattern kullanılacak (PDF → Python parser → JSON → Migration).

---

## Bu Oturumdan Dersler

1. **Şema önce sorgu, sonra INSERT.** Migration 076 ve 077 her ikisinde de target table kolon tipi/NOT NULL durumu önceden çekilmeli. `information_schema.columns` 30 saniyelik kontrol, saatlerce zaman kazandırır.

2. **Vocabulary disiplinini DB tarihçesinden değil teknik gerçeklikten al.** 'WN' KME terminolojisi, 'LJ' fiziksel tasarım. Doğru olan 'LJ'. UI ve sözlük yapay tutarlılık değil, teknik doğruluk önceliği.

3. **Supabase SQL Editor disiplini:** BEGIN/COMMIT desteklemez, "Success" mesajı bazen göstermez (transaction commit oldu sansa). Doğrulama her zaman ayrı SELECT ile.

4. **Schema constraint'ler tasarım varsayımları taşır.** flansh_olculer NOT NULL'ları ASME B16.5 integral'e göre yazılmış, DIN composite/lap-joint için yanlış. Schema değişikliği data migration'la birlikte tek transaction'da uygulanabilir.

5. **Programatik sanity check manuel doğrulamadan daha güvenli.** Geometric kuralar (bore < OD < hub < flansh) tek seferde 48 satıra uygulanır, gözle 5 örnek karşılaştırmaktan daha kapsamlı.

6. **Aynı PDF'ten çoklu standart yüklemek mantıklı** (KME 4 standart birden), aynı oturumda momentum korunur. Tek dezavantaj: hata olunca rollback kapsamı geniş — BEGIN/COMMIT içinde tutarak çözüldü.

7. **UI 3 katmanlı kütüphane envanteri Cihat'ın görmediği güzel bir sistem.** "data drift detection" — DB'de planlanmamış kayıt (EEMUA-144) "tanımsız standart" rozetiyle uyarıyor. KUTUPHANE-YUKLEME-TAKIP.md eksikliğini gösterdi.

---

## Performans

- **Migration 076 yazım + üretim:** ~30 dakika
- **Migration 076 hata + düzeltme + transfer:** ~20 dakika
- **UI vocabulary fix:** ~5 dakika
- **Migration 077 yazım + üretim:** ~40 dakika
- **Migration 077 iki hata + düzeltme + transfer:** ~30 dakika
- **Doğrulama + canlı UI test:** ~10 dakika
- **Toplam:** ~2 saat 15 dakika aktif iş + dosya transferleri

---

> 95. oturum açılışında bu dosya, `.github/son-durum.md` ve `CLAUDE-SONRAKI-OTURUM.md` okunur.
