# 88. Oturum Vizyonu — Tanımsız Malzeme Akışı Yeniden Tasarımı

> **Tarih:** 14 Mayıs 2026 — 87. oturum sonunda yazıldı
> **Statü:** Tasarım belgesi. Implementasyon 88+ oturumlarda.
> **Bağlam:** 87. oturumda 86.D Phase 2 (87.C — onay/red butonları) implementasyonu sahaya çıktı (`d2b22e3`), ancak Cihat'ın geri bildirimiyle **temel kurgu yanlış** olduğu tespit edildi. 87.C commit'i revert edildi (`33c10b5` → `dad5307` push). 88 sıfırdan doğru vizyonla yazılacak.

---

## Sorun (Mevcut Tasarım Neden Yanlış)

### Mevcut akış (61. migration + 87.C UI)

```
[Kullanıcı spool_detay'da gri satırı görür]
     │
     ▼
[Tıklar → "tanımsız modal" açılır]
     │
     ▼
[Kullanıcı "Kaydet" butonuna basar]
     │
     ▼
[tanimsiz_kayit_onerisi RPC → tanimsiz_kayitlar satır oluşur veya siklik_sayisi += 1]
     │
     ▼
[Süper admin panelinde "öneri" olarak görünür]
```

### Sorunlar

1. **Kullanıcıya iş yüklüyor.** Her tanımsız malzemeyi görüp kaydetmek zorunda — operatör boru sayar, kayıt aramak için ekstra adım atmıyor.

2. **Sıklık yanıltıcı.** `siklik_sayisi` = "kaç kullanıcı tıkladı kaydetti", **DEĞİL** = "sistemde gerçekten kaç kez geçiyor". 36 spool'da `139.7×4.5 St 37` boru olsa ama hiç kimse tıklamamış olsa → süper admin paneli **0** gösterir, sanki ihtiyaç yokmuş gibi.

3. **Cihat'ın gerçek sorgusu** test edildi (`SELECT COUNT(...) FROM spool_malzemeleri WHERE boru_olculer_id IS NULL ...`) → **0 döndü** çünkü mevcut tablo niyetle uyumsuz çalışıyor.

4. **Kullanıcı verisine güven.** Modal'da kullanıcı "Standart: DIN 17175, DN: 125" yazar ama yanlış olabilir → süper admin yine sıfırdan internetten araştırması gerekir. Yani kullanıcının verdiği bilgi pratik değer üretmiyor, sadece gürültü.

---

## Yeni Vizyon

### Temel Prensip

> **Tanımsız malzeme havuzu, kullanıcı tıklamasına değil, sistemin gerçek durumuna bakar.**

Yani:
- Bir `spool_malzemeleri` satırının `boru_olculer_id` (veya `fitting_olculer_id` / `flansh_olculer_id`) **NULL** ise → o malzeme tanımsızdır
- Süper admin paneli bu durumu **gerçek-zamanlı** sayar, counter tutmaz
- Kullanıcının "Kaydet" akışı **TAMAMEN KALDIRILIR**

### Süper Admin İş Akışı

```
[Süper admin /admin/kutuphane-oneriler.html açar]
     │
     ▼
[Liste: v_tanimsiz_havuz view'inden, sıklığa göre desc sıralı]
     │  (139.7×4.5 St 37 → 36 spool'da geçiyor, 5 devre, 2 tenant)
     ▼
[Kayda tıklar → detay paneli]
     │
     ├─► [Kütüphane Bilinçli Yardım]
     │     ├─ A) ASME B36.10 sorgusu: "Bu ölçü kütüphanede yakın eşleşme var → [Bağla]"
     │     ├─ B) malzeme_kataloglari sorgusu: "St 37 kalite tanımlı değil → DIN 17100 seed öner"
     │     └─ C) STD_KILAVUZ lookup: "Yaygın standart eşleşmesi → modal pre-fill"
     │
     ├─► [Manuel düzenle/kaydet butonu]
     │     ├─ Modal açılır, A/B/C'den gelen veriler pre-fill
     │     ├─ Cihat internet ARAŞTIRMASI YAPMADAN sadece sistem bilgisiyle doğrular
     │     └─ INSERT INTO boru_olculer
     │
     └─► [Reddet butonu]
          └─ tanimsiz_kayitlar.durum='reddedildi' (sadece audit log için)
```

---

## Mimari Bölümler

### Bölüm A — `v_tanimsiz_havuz` VIEW (yeni)

`tanimsiz_kayitlar` tablosu artık ANA veri kaynağı değil. Ana kaynak gerçek-zamanlı view:

```sql
CREATE OR REPLACE VIEW v_tanimsiz_havuz AS
SELECT
  'boru'                       AS parca_tipi,
  ROUND(sm.dis_cap_mm::numeric, 3)  AS dis_cap_mm,
  ROUND(sm.et_mm::numeric, 3)       AS et_mm,
  sm.kalite_kod_normalize           AS kalite,
  md5('boru|' || ROUND(sm.dis_cap_mm::numeric, 3)::text || '|' ||
      ROUND(sm.et_mm::numeric, 3)::text || '|' || coalesce(sm.kalite_kod_normalize, ''))
    AS hash_anahtari,
  COUNT(DISTINCT sm.spool_id)       AS siklik,
  COUNT(DISTINCT s.devre_id)        AS devre_sayisi,
  COUNT(DISTINCT s.tenant_id)       AS tenant_sayisi,
  array_agg(DISTINCT s.tenant_id)   AS tenant_ler,
  MIN(sm.olusturma_at)              AS ilk_gorulme,
  MAX(sm.olusturma_at)              AS son_gorulme,
  -- Süper admin önceki kararı (audit log'dan)
  (SELECT durum     FROM tanimsiz_kayitlar t WHERE t.hash_anahtari = md5(...) LIMIT 1) AS son_karar,
  (SELECT karar_notu FROM tanimsiz_kayitlar t WHERE t.hash_anahtari = md5(...) LIMIT 1) AS karar_notu
FROM spool_malzemeleri sm
LEFT JOIN spooller s ON sm.spool_id = s.id
WHERE sm.boru_olculer_id IS NULL
  AND coalesce(sm.tip, 'bilinmiyor') = 'boru'
  AND sm.dis_cap_mm IS NOT NULL
  AND sm.et_mm IS NOT NULL
GROUP BY parca_tipi, dis_cap_mm, et_mm, kalite, hash_anahtari
HAVING COUNT(DISTINCT sm.spool_id) > 0
ORDER BY siklik DESC, son_gorulme DESC;
```

**Önemli kararlar (88'de teyit edilecek):**
- Phase 1 sadece `boru` — `fitting`/`flansh` benzer view ile sonra
- `kalite_kod_normalize` mevcut kolon mu, yoksa view içinde mi normalize? (Şema kontrolü 88 başında)
- RLS: View, `spool_malzemeleri`'nin RLS'ini kalıtır → tenant filter otomatik. Süper admin için ayrı RPC mi yoksa view'a SECURITY DEFINER mı? Karar 88'de.

### Bölüm B — Kullanıcı "Kaydet" akışı KALDIRILIR

Silinecek/değiştirilecek:
- `spool_detay.html` → `tanimsizModalAc()`, `tanimsizModalKaydet()` fonksiyonları
- Tablo satırlarındaki gri renk tıklanır kalmaya devam eder ama tıklayınca **sadece info toast** çıkar: *"Bu malzeme süper admin envanterine düştü, kütüphaneye eklenince otomatik bağlanacak"*
- `tanimsiz_kayit_onerisi` RPC: çağrılmaz hâle gelir → 90+ oturumda DROP
- `tanimsiz_hash_anahtari` fonksiyonu: kalır (view kullanır)
- `tanimsiz_kayitlar` tablosu: kalır ama sadece **audit log** — süper admin red/onay kararları izlenir, INSERT'i artık RPC değil view detay paneli yapar

### Bölüm C — Süper admin sayfası "Kütüphane Bilinçli Yardım"

Kayıt detayı açıldığında 3 paralel sorgu çalışır:

#### C.1 — ASME/DIN/EN yakın eşleşme

```sql
-- 139.7×4.5 için yakın eşleşme ara
SELECT id, standart, dn, schedule_kod, dis_cap_mm, et_mm, malzeme_grubu
FROM boru_olculer
WHERE ABS(dis_cap_mm - $1) < 0.5
  AND ABS(et_mm - $2) < 0.3
  AND sistem_preset = true
ORDER BY ABS(dis_cap_mm - $1) + ABS(et_mm - $2) ASC
LIMIT 5;
```

Eşleşme varsa UI:
> **"Bu ölçü zaten kütüphanede!**
> DIN 17175 · DN125 · 139.7×4.5 · karbon (`boru_olculer.id=abc-123`)
> → [Otomatik bağla] (`spool_malzemeleri.boru_olculer_id` UPDATE, 36 spool tek tıkla düzelir)"

#### C.2 — Kalite katalog kontrolü

```sql
SELECT id, ad, standart, grade
FROM malzeme_kataloglari
WHERE lower(regexp_replace(grade, '[^a-z0-9]', '', 'g')) = $1;
```

Boş dönerse UI:
> **"`St 37` kalite kataloğa eklenmemiş.**
> DIN 17100 standardı altında tanımlanır. Önerilen migration: `0XX_din_17100_seed.sql` (~5 kalite: St 33, St 37-2, St 44-2, St 52-3, vs.)"

#### C.3 — STD_KILAVUZ JS lookup

```js
const STD_KILAVUZ = {
  'boru:114.30:6.02': { std:'ASME B36.10M', dn:100, sch:'SCH40', malzeme_grubu:'karbon' },
  'boru:139.7:4.5':   { std:'DIN 17175',     dn:125, sch:'4.5mm', malzeme_grubu:'karbon' },
  'boru:48.3:3.68':   { std:'ASME B36.10M', dn:40,  sch:'SCH40', malzeme_grubu:'karbon' },
  // ... 50-100 yaygın kombinasyon (Cihat'ın listesi + Project Materials'tan)
};
```

Eşleşme varsa modal'ı **otomatik pre-fill** eder, Cihat sadece onaylar.

### Bölüm D — Süper Admin RPC

```sql
-- C.1 sonucu "bağla" butonuna basıldığında çalışır
CREATE OR REPLACE FUNCTION oneri_kutuphaneye_bagla(
  p_hash TEXT,
  p_boru_olculer_id UUID
) RETURNS INT  -- kaç spool_malzemesi UPDATE edildi
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_id UUID;
  v_count INT;
  v_dc NUMERIC; v_et NUMERIC; v_kalite TEXT;
BEGIN
  -- Auth: super_admin
  v_admin_id := auth.uid();
  IF NOT EXISTS (SELECT 1 FROM kullanicilar WHERE id = v_admin_id AND rol = 'super_admin') THEN
    RAISE EXCEPTION 'Yetkisiz' USING ERRCODE = '42501';
  END IF;

  -- Hash'ten boyut/kalite parse (md5'le birebir oluşturulduğu için yeniden hesap mümkün değil
  -- alternatif: hash yerine doğrudan boyut/kalite parametre olarak gelsin)
  -- Daha temiz: p_dis_cap, p_et, p_kalite parametre olarak gelsin (88 detayında karar)

  -- UPDATE spool_malzemeleri SET boru_olculer_id = ... WHERE matching
  -- (88'de tam yazılır)
END $$;
```

### Bölüm E — UI Akış Diyagramı

```
[v_tanimsiz_havuz view sorgu]
   │ kayıtlar sıklığa göre desc
   │
   ▼
[Liste — sıklık rozeti, devre/tenant sayısı görünür]
   │
   ▼ (tıkla)
   │
[Detay paneli açılır]
   │
   ├─► [Kütüphane Bilinçli Yardım] (3 paralel sorgu)
   │     │
   │     ├─► A) Yakın eşleşme bulundu
   │     │      → [Otomatik bağla] butonu
   │     │      → spool_malzemeleri.boru_olculer_id UPDATE
   │     │      → 36 spool tek tıkla düzelir
   │     │      → liste yenilenir, bu kayıt kaybolur (artık tanımsız değil)
   │     │
   │     ├─► B) Kalite katalogda yok
   │     │      → "Seed önerisi" uyarısı (link, henüz aksiyonu yok)
   │     │
   │     └─► C) STD_KILAVUZ eşleşmesi
   │            → "Otomatik öneri: DIN 17175, DN125, 4.5mm" gösterir
   │            → [Manuel kaydet] butonuna bastığında modal pre-fill eder
   │
   ├─► [Manuel kaydet butonu]
   │     │ (Bu işlem mevcut 87.C ile aynı — sadece kütüphane-bilinçli yardımla pre-fill ekleniyor)
   │     │
   │     ▼
   │     [Modal — boru zorunlu alanlar]
   │     ├─ Pre-fill: A/B/C sonuçları + ham_data (dis_cap_mm, et_mm)
   │     ├─ Cihat onaylar/düzenler, agirlik_kg_m hesapla butonu
   │     └─ Kaydet → INSERT INTO boru_olculer + UPDATE spool_malzemeleri.boru_olculer_id
   │
   └─► [Reddet butonu]
        └─ tanimsiz_kayitlar.durum='reddedildi' (audit, kayıt listede kaybolur — view filter)
```

---

## 88'in Sıralı Görev Listesi

| Görev | Süre |
|---|---|
| **88.A** `v_tanimsiz_havuz` VIEW migration (`065_v_tanimsiz_havuz.sql`) + RLS karar | ~30 dk |
| **88.B** `spool_detay.html` — `tanimsizModalAc` + `tanimsizModalKaydet` sök, yerine info toast | ~15 dk |
| **88.C** `kutuphane-oneriler.html` — `listeYukle()` `v_tanimsiz_havuz`'a çevir, kolonlar güncelle (sıklık + devre + tenant) | ~30 dk |
| **88.D** Detay paneline "Kütüphane Bilinçli Yardım" bölümü (3 sorgu paralel) | ~45 dk |
| **88.E** `oneri_kutuphaneye_bagla` RPC + UI butonu | ~30 dk |
| **88.F** STD_KILAVUZ JS lookup tablosu (50-100 satır seed) | ~30 dk |
| **88.G** Manuel kaydet modal'ı geri ekle (87.C kodu refactor, vizyona uyumlu) | ~45 dk |
| **88.H** Saha test + commit + push | ~30 dk |

Toplam tahmin: **~4 saat** — büyük bir oturum, parçalanabilir (88-A-C-G zorunlu, D-E-F bonus).

---

## Devreden Borç / Notlar

- **Migration 063** (`oneri_reddet` + `oneri_onayla_boru`) DB'de var, çağrılmıyor. 88'de **`oneri_kutuphaneye_bagla`** eklenirken bu ikisi de gözden geçirilir. Vizyona uyumluysa kalır, değilse 90+ oturumda DROP.
- **`tanimsiz_kayitlar` tablosu** ana veri kaynağı olmaktan çıkacak → audit log rolüne düşer. Şema sadeleşebilir (88+).
- **`tanimsiz_kayit_onerisi` ve `tanimsiz_hash_anahtari` RPC fonksiyonları** kullanıcı tarafından artık çağrılmaz → kalır, ileride DROP. UI'dan çağrı temizlendiği gün test'lenir.

---

## Karar Geçmişi

| Karar | Bağlam |
|---|---|
| **KARAR-87.4** | "Sıklık counter modeli yanlış" — gerçek-zamanlı view doğrusu. (87 kapanışında alındı, 88'de uygulanır.) |
| **KARAR-87.5** | Kullanıcı "Kaydet" akışı tamamen kaldırılır — kullanıcı iş yükü yok. |
| **KARAR-87.6** | Süper admin paneli "Kütüphane Bilinçli Yardım" ile internet aramasına gerek bırakmaz (Phase 1: ASME B36.10 + DIN + EN; Phase 2: malzeme katalog; Phase 3: STD_KILAVUZ JS). |
| **KARAR-87.7** | Manuel kaydet/düzenle akışı korunur — Cihat sahada gerekli değişiklikleri yapabilmeli. |

---

> **Bu belge 88. oturum açılışında okunacaktır.** Vizyon değişimi büyük olduğu için CLAUDE.md'nin "Kural Çakışması Durumu" prosedürü tetiklenmemelidir — bu zaten yeni bir paradigma, eski kural değil.
