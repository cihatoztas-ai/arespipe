# Son Durum — 94. Oturum (17 Mayıs 2026)

> 93 → 94 geçişi. KME OSNA-10/30 Shipbuilding PDF'inden CuNi gemicilik kütüphanesi yüklendi: DIN 86019 boru + DIN 86037-2 LJ + EN 1092-3 Composite Blind. Schema tasarım kararı (lap-joint için bolt NULL). Vocabulary disiplini netleşti (cunife + LJ).

---

## Bu Oturumun Sonucu

**94 başarıyla kapatıldı.** İki migration (92 satır CuNi veri) + bir UI fix + bir schema ALTER + bir teknik mimari karar. Boru ve flanş tarafı tamamlandı, fitting (Migration 078, ~320 satır) 95+ oturumlara ertelendi. Kütüphane geliştirme için **ayrı bir Claude projesi** açılması kararı alındı.

### Yapılanlar (sırasıyla)

1. **Migration 076 — DIN 86019 CuNi boru (44 satır)** (MD5 `e7272e50812714d40af53065d91b0439`)
   - boru_standart_sozluk: 1 sözlük girişi (`malzeme_grubu_default='cunife'`)
   - boru_olculer: 44 ölçü (22 Standard wall + 17 Special wall + 5 Seamwelded)
   - Fizik doğrulama: 44/44 satır 8.7-9.1 yoğunluk bandında, ortalama 8.919 g/cm³

2. **UI fix — kutuphane-malzemeler.html vocabulary uyumu** (MD5 `c876b75f76c7ab27ac6d1f80b91a7ef6`)
   - 3 yerde (boru/fitting/flansh KONFIG): `kod:'cuni'` → `kod:'cunife'`
   - DB tarihsel olarak `cunife` kullanıyordu (EEMUA-144 24 + DIN-86019 44 = 68), UI ise `cuni` arıyordu — CuNi grubu görünmüyordu

3. **Migration 077 — DIN 86037-2 LJ + EN 1092-3 Type 05-C (48 satır)** (MD5 `fe1aeed872d08b17ed818f2776983535`)
   - Schema ALTER: `bolt_circle_mm` ve `bolt_count` NOT NULL → NULL'a açıldı
   - 29 LJ satır (DN20-DN1200, PN10/16 compatible)
   - 19 Composite Blind satır (DN10-DN500, PN16 0-175 + PN10 200-500)
   - Geometrik sanity: 48/48 satır içe genişleme mantığı geçti

4. **Teknik karar (KARAR-94.3) — flansh_tipi: WN → LJ**
   - DIN 86037-2 KME PDF "Welding Neck" adlandırıyor ama tasarım fiziksel olarak lap-joint stub end
   - B16.5 WN integral (kendi bolt'lu) ≠ DIN 86037-2 (outer flansh halkasıyla)
   - Vocabulary doğruluğu için 'LJ' kullanıldı

5. **Kütüphane envanteri canlı UI test**
   - boru_olculer 451 → 495 (+44 DIN-86019)
   - kutuphane-standartlar.html?tablo=boru_olculer&mg=cunife sayfası DIN 86019 satırını "Aktif" olarak gösteriyor
   - EEMUA-144 "Hedef Dışı (Tanımsız Standart)" rozeti — KUTUPHANE-YUKLEME-TAKIP.md eksikliği

### Hata ve Düzeltmeler

- **Migration 076 ilk run:** `pdf_anahtar_kelime` JSONB sandım, gerçekte TEXT[]. `kullanim_sektor` da TEXT[]. ARRAY syntax'a çevrildi, transfer tekrar yapıldı.
- **Supabase SQL Editor BEGIN/COMMIT desteklemez:** `grep -v -E "^(BEGIN|COMMIT);$" | pbcopy` ile panoya alındı. Dosyada kalır (psql/CI için).
- **Migration 077 ilk run:** `kaynak` kolonu boru_olculer'da var, flansh_olculer'da yok. VALUES 30, hedef 29. Notlar'a birleştirildi.
- **Migration 077 ikinci run:** `bolt_circle_mm` ve `bolt_count` NOT NULL constraint hatası. Lap-joint için anlamsız — schema ALTER ile NULL'a açıldı.

---

## Yeni MK (Mimari Karar) Disiplinleri

- **MK-94.1:** Yeni standart eklerken **sözlük tablosunun kolon tiplerini önceden çek** (`information_schema.columns`). JSONB vs TEXT[] tuzağı.
- **MK-94.2:** Yeni veri yüklemeden önce **target tablonun NOT NULL ve kolon listesini doğrula**. boru_olculer ile flansh_olculer şeması farklı.
- **MK-94.3:** Composite/lap-joint design flanşlar için DB schema bolt kolonları NULL kabul eder. ASME B16.5 integral'e özel constraint değildi.
- **MK-94.4:** Vocabulary kararı PDF üreticinin terminolojisinden değil, **teknik fiziksel tasarımdan** alınır.
- **MK-94.5:** Programatik sanity check yeterli, manuel 5 örnek karşılaştırma gerekmedi. Geometrik mantık tek seferde tüm satırlara uygulanır.

---

## Commit'ler (94'te)

| Hash | Mesaj |
|------|-------|
| `d534ba6` | feat(94): DIN 86019 CuNi boru ilk versiyon (JSONB hatalı) |
| `533d6c3` | feat(94): DIN 86019 CuNi gemi boru kutuphanesi (KME kaynak, 44 satir) — TEXT[] fix |
| (UI fix) | fix(94): kutuphane-malzemeler.html CuNi grup kodu cuni→cunife |
| `abf1e3f` | fix(94): 077 migration kaynak kolonu kaldirildi, notlar'a birlestirildi |
| `a0a2a89` | fix(94): 077 schema ALTER (bolt NULL) + WN→LJ teknik düzeltme (lap-joint) |
| `ff6d97c` | (push tamam) |

CI: ✅ YEŞİL

---

## DB Değişiklikleri

```sql
-- Migration 076: Sözlük + 44 boru
-- Migration 077: Schema ALTER + 48 flansh
ALTER TABLE flansh_olculer ALTER COLUMN bolt_circle_mm DROP NOT NULL;
ALTER TABLE flansh_olculer ALTER COLUMN bolt_count DROP NOT NULL;
```

---

## 95'e Açık Borç (önceliğe göre)

1. **`KUTUPHANE-YUKLEME-TAKIP.md` güncellemesi (10 dk)** — EEMUA-144 satırını ekle (24 mevcut, hedef ~30 P1), DIN-86019 hedef rakam düzelt (yanlış 18 yazılı, gerçek 30-50), DIN-86037-2 LJ + EN-1092-3 EN-T05 ekle, LJ vocabulary kararını not düş.
2. **93'ten devralınan `olusturma_at` rename** (KARAR-93.6) — hâlâ açık.
3. **Migration 078 — CuNi fitting (~320 satır)** — **Yeni kütüphane projesine taşınıyor.**

---

## CuNi Kütüphane (94 sonrası birikim)

| Kategori | Mevcut | Hedef | Kaynak |
|---|---:|---:|---|
| Boru (boru_olculer) | 68 satır | ~100 | EEMUA-144 24 + DIN-86019 44, B466 + EEMUA 234 eksik |
| Flansh (flansh_olculer) | 48 satır | ~100 | DIN-86037-2 LJ 29 + EN-1092-3 EN-T05 19, DIN 86087/88 eksik |
| Fitting (fitting_olculer) | 0 satır | ~320 | DIN 86089 + 86088 + 86090 + 28011 + 86087 → Migration 078 |

---

> 95. oturum açılışında bu dosya, `CLAUDE-SON-OTURUM.md` ve `CLAUDE-SONRAKI-OTURUM.md` okunacak.
> **YENİ:** Kütüphane geliştirme için ayrı Claude projesi açıldı (`AresPipe — Kütüphane Veri Kaynakları`). Detay: `CLAUDE-SONRAKI-OTURUM.md` "İki Proje Koordinasyonu" bölümü.
