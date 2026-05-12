# CLAUDE-SON-OTURUM — 76. Oturum Detaylı Özet (12 Mayıs 2026)

> 75 kütüphane oturumunun devamı. EN PN16 cephesini kapama + B36.19M doğrulama & eksik tamamlama.

---

## Bağlam & Açılış

Cihat "kütüphaneye devam" dedi. Briefing'in 4 alt seçeneği vardı: A1 (T05 Blind), A2 (Stub End), A4 (B36.19M teyit), C (027-031 push).

**Sıra:** A1 → A4 (mevcut + bonus).

Açılış ritüeli sadeleşmiş haliyle koştu (52'de yapılan basitleştirme): git pull + 2 soru. Net.

---

## A1 — EN 1092-1 PN 16 Type 05 Blind (15 satır)

### Yaklaşım

Briefing önerisi: piping-world.com + pipingpipeline + Wermac çift kaynak. Mevcut T01/T11/T12 PN16 ile tutarlılık kontrolü (yüzey tipi RF mi A mı kararı için).

### Schema teyidi

`flansh_olculer` 30 kolon, **bileşik unique constraint yok** (sadece PK). Idempotent için manuel `NOT EXISTS` gerekti.

Zorunlu kolonlar: `geometri_std`, `flansh_tipi`, `basinc_sinifi`, `flansh_od_mm`, `flansh_kalinlik_mm`, `bolt_circle_mm`, `bolt_count`.

### Yüzey tipi kararı

Çakışma:
- EN spec (pipefittingweb PDF): Type 05 PN ≤ 40 default **Type A (FF)**
- Piyasa pratiği (piping-world, pipingpipeline, valvias, rfitalia): **B1 (RF)** yaygın
- DB tutarlılığı: mevcut T01/T11/T12 PN16 hepsi RF

**Karar:** T05 de RF — DB tutarlılığı öncelikli. Gerekçe `notlar.yuzey_karari` alanında saklı.

### Çift kaynak doğrulama

piping-world ve pipingpipeline 6 alanda (D, C, K, n, M-bolt, W) DN 10/50/100/250/600/1000 spot — %100 eşleşme. T11 ile PN+DN bazlı geometri de %100 eşleşme (D, b değerleri DN 10..300).

### SQL Stratejisi

**Akıllı kanonik kaynak:** T11 PN16 RF satırlarından SELECT, 3 alanı override:
1. `flansh_tipi = 'EN-T05'`
2. `agirlik_kg` = piping-world Blind tablosu
3. `notlar` = T05'e özgü JSON

13 alan birebir kopyalanır. Avantaj: T11 ileride güncellenirse aynı pattern T05 için tekrar koşar — kanonik kaynak DB.

### Çalıştırma

İlk denemede hata: `BEGIN;` syntax error. **MK-76.1 öğrenildi** (Supabase Editor explicit transaction yasak). `BEGIN/COMMIT` çıkarıldı, yeniden koşuldu — başarılı: 15 satır insert + NOTICE doğrulama.

Push: commit `18fc4d8`.

---

## A4 — B36.19M Paslanmaz Boru Doğrulama (mevcut 70 satır)

### Hata 1: Kolon adı varsayımı

Cihat'tan B36.19M satırlarını çekmek için sorgu yazdım, kolon adı olarak `cap_dn` kullandım — `flansh_olculer`'da gördüğüm pattern. Ama `boru_olculer`'da kolon adı `dn`. SQL hata verdi: `column "cap_dn" does not exist`.

**MK-76.2 doğdu:** Her tablonun kolon adlarını ayrı sorgula. Aynı projedeki tablolar farklı sözlük kullanabilir.

### Schema teyidi sonrası

`boru_olculer` 26 kolon. Önemli farklılıklar:
- `dn` (cap_dn değil)
- `malzeme_grubu` NOT NULL (paslanmaz/karbon/cuni ayrımı)
- `schedule_tipi` + `schedule_deger` + `schedule_kod` — 3 ayrı schedule kolonu
- `agirlik_kg_m` (per meter, kg değil)
- `et_min_mm` / `et_max_mm` — is_nullable YES ama dolu (sonradan GENERATED olduğu anlaşıldı)
- `sistem_preset` default `true` (flansh'in tersi)

### Çapraz kontrol

Wermac dim_b36.19_pipes.html çekildi. 70 mevcut satır satır-satır kıyaslandı:

**OD değerleri:** %100 doğru. DN 450'de DB daha hassas (457.2 vs Wermac 457).

**Et değerleri:** %100 doğru. B36.19M özel et değerleri (NPS 14-22 SCH 10S, NPS 12 SCH 40S, NPS 10/12 SCH 80S) hepsi B36.10M'den FARKLI değerlerle yüklü — halüsinasyon yok.

**Ağırlık:** DB sistematik olarak Wermac'tan ~%2 yüksek. Wermac General Notes 4: *"austenitic stainless steels about 2% greater than carbon values"*. **DB pattern doğru** — austenitik için Wermac × 1.02 uygulanmış. DN 200/250/300 80S spot kontrolünde ratio 1.0203-1.0204 tespit.

**et_min/et_max:** ASTM A530 ±%12.5 tam uyumlu (9.52 × 0.875 = 8.330 ✓, GENERATED kolon).

**Edisyon:** ASME B36.19M-2018 (Wermac 2004 R2015'ten daha güncel).

### Tek mikro-not

DN 300 40S et = 9.52 (DB) vs 9.53 (Wermac). ASME orijinal 0.375" = 9.525 mm. İki yuvarlama da spec'e uygun. Bağlayıcı değil.

### Eksik satırlar tespit

- DN 6/8/10 (NPS 1/8, 1/4, 3/8): ~12 satır, P2 (sanayide nadir)
- **DN 350-600 için 40S+80S: 10 satır, P0** (gemi KK ana hatları)
- DN 550, 750: 4 satır, P1-P2

A4 bonus olarak P0'lar eklendi.

---

## A4 Bonus — DN 350-600 40S+80S (10 satır)

### Veri hazırlama

Wermac'tan 10 satırın geometrisi ve carbon kg/m çekildi. DN 450 için Wermac kg/m boş (`...`), formülle hesaplandı:

```
carbon kg/m = π × (D - t) × t × ρ × 10⁻⁶,  ρ = 7850 kg/m³
DN 450 40S: π × (457.2 - 9.53) × 9.53 × 7850 / 1e6 = 105.22 kg/m
DN 450 80S: π × (457.2 - 12.70) × 12.70 × 7850 / 1e6 = 139.21 kg/m
```

Formula doğrulandı: DN 500 40S formula → 117.14, Wermac → 117.15 (fark 0.01) ✓

Austenitik dönüşüm: hepsine × 1.02.

### SQL Stratejisi

**LATERAL JOIN ile meta kopya (MK-76.2):**

```sql
JOIN LATERAL (
  SELECT schedule_tipi, schedule_deger
  FROM boru_olculer
  WHERE standart = 'ASME-B36.19M' AND schedule_kod = v.schedule_kod
  LIMIT 1
) m ON true
```

Yani: schedule_tipi/deger varsayma — mevcut B36.19M satırından kopya. Tutarlılık garanti.

### Çalıştırma — 3 hata, 3 ders

**Hata 1:** `BEGIN;` (zaten 040'tan biliyorduk ama 041 dosyasında baştan yazdım — kopyala-yapıştır bir okul ödevi, MK-76.1 dosyaya gömüldü)

**Hata 2:** Türkçe karakterler + multi-byte unicode (`×`, `ρ`, `⁻⁶`, `—`, `•`, `±`) yorum bloğunda → "syntax error at or near INSERT" satır 44. Parser dengesini bozdu.

**MK-76.3:** SQL yorumlarında saf ASCII. Detayları JSON notlar alanına taşı (JSON parser unicode'u doğru yorumlar).

ASCII-temiz versiyon hazırlandı, `file` komutu doğruladı.

**Hata 3:** `cannot insert a non-DEFAULT value into column "et_min_mm". Column "et_min_mm" is a generated column.`

**MK-76.4:** `information_schema.columns` GENERATED kolonları yanıltıcı gösteriyor (is_nullable YES). INSERT'ten kaldırıldı — DB otomatik dolduracak.

Üçüncü denemede başarılı: 10 satır insert + NOTICE doğrulama.

Push: commit `11816b0`.

---

## Büyük Resim — KUTUPHANE-YUKLEME-TAKIP.md Sapması

Snapshot sorgusu çalıştırıldı:

| Modül | Belgedeki (43) | Gerçek (canlı) |
|---|---:|---:|
| `boru_olculer` | 48 | **450** (+402) |
| `flansh_olculer` | 20 | **276** (+256) |
| `fitting_olculer` | 0 | **424** (+424) |

5+ ay önceki belge ile gerçek arasında 1000+ satır fark. **MK-76.5:** Bu belge her oturum sonu canlı DB count ile senkronize edilmeli. 77'nin ilk işi.

---

## Yapılmayan / Sıradaki

- 041 push **yapıldı** (11816b0)
- KUTUPHANE-YUKLEME-TAKIP.md senkronizasyonu **yapılmadı** (77 öncelik 1)
- fitting_olculer kırılım analizi **yapılmadı** (zaman, 77'de)
- A2 (B16.9 Stub End) **yapılmadı** (77+)

---

## Öğrenilenler Özeti

**Teknik:**
1. Supabase SQL Editor BEGIN/COMMIT yasak (MK-76.1)
2. Tablo bazlı kolon sözlüğü, varsayma — LATERAL JOIN ile kopyala (MK-76.2)
3. SQL yorumları saf ASCII, detay JSON (MK-76.3)
4. GENERATED kolonlar information_schema.columns'tan teşhis edilemez (MK-76.4)
5. Belgeler ve canlı DB arasında uzun süreli sapma riski (MK-76.5)

**Süreç:**
6. **3 hata pahalı oldu ama 041'i hızlandırdı.** Aynı dosyada 3 farklı sebepten 3 retry. Her retry öğrenme — ama bir sonraki migration'da sıfırdan ASCII + GENERATED-aware + BEGIN'siz başlanır.
7. **Kanonik kaynak DB stratejisi güçlü:** T11'den T05 üretmek, mevcut B36.19M'den schedule meta çekmek — DB pattern güncellenirse türetilen satırlar otomatik güncel kalır.
8. **Çift kaynak doğrulamada %2 sistematik fark yakalandı:** austenitik kg/m DB'de Wermac × 1.02. Bu pattern olmadan yeni satırlar (DN 350-600) hata yapardı. Eski veriyi okumak değerli.

**Kütüphane stratejisi:**
9. Belgelerden çok DB durumu güvenilir. 77'de KUTUPHANE-YUKLEME-TAKIP.md baştan canlı sayılarla yazılmalı.
10. EN 1092-1 PN 16 örneği — 4 tip × 15 DN = 60 satır — gelecekteki PN 10, PN 25, PN 40 cephelerinin **şablonu**. Pattern oturdu.

---

## Performans

- Oturum süresi: ~2 saat (briefing 1 sa A1 + 1 sa A4 tahminiydi, gerçekleşti)
- Net çıktı: +25 satır kütüphane, 2 commit, 5 yeni MK dersi
- Hata oranı: 3 hata (BEGIN, ASCII, GENERATED) — her biri yeni ders, dosya 4. denemede çalıştı

---

## Commit'ler

| Hash | Mesaj | Etki |
|------|-------|------|
| 18fc4d8 | 76: EN-1092-1 PN16 T05 Blind 15 satir - migration 040 | flansh_olculer +15 |
| 11816b0 | 76: B36.19M DN 350-600 40S+80S 10 satir bonus - migration 041 | boru_olculer +10 |

CI: ✅ YEŞİL

---

> 77. oturum açılışında bu dosya, `.github/son-durum.md`, `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
