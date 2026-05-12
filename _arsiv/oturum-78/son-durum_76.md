# Son Durum — 76. Oturum (12 Mayıs 2026)

> 75'in devamı. Kütüphane mini-projesi: EN 1092-1 PN 16 T05 Blind + B36.19M paslanmaz boru doğrulama & eksik tamamlama. +25 satır.

---

## Bu Oturumun Sonucu

**76 başarıyla kapatıldı.**

- A1 tamamlandı: EN 1092-1 PN 16 Type 05 Blind, 15 satır (`flansh_olculer`)
- A4 doğrulandı: B36.19M mevcut 70 satır %100 doğru (sıfır sapma)
- A4 bonus tamamlandı: B36.19M DN 350-600 40S+80S, 10 satır (`boru_olculer`)
- **EN 1092-1 PN 16 cephesi tamamen kapalı:** T01 + T05 + T11 + T12 × 15 DN = 60 satır
- **KUTUPHANE-YUKLEME-TAKIP.md ile gerçek DB arasında büyük sapma tespit edildi** (43'ten kalma, 5+ ay güncellenmemiş)

### Yapılanlar (sırasıyla)

1. **Migration 040** — EN 1092-1 PN 16 Type 05 (Blind), 15 satır
   - Strateji: T11 PN16 RF satırlarından SELECT (kanonik DB kaynak), flansh_tipi + agirlik_kg + notlar override
   - Sebep: PN+DN tek belirleyici, T05 ve T11 geometri (D, b, K, n, bolt, RF, cap_mm) aynı
   - Çift kaynak doğrulama: piping-world Blind tablosu + pipingpipeline Type 05 BL — 6 alanda %100 eşleşme
   - Yüzey tipi RF kararı: EN spec varsayılan A/FF olsa da, mevcut T01/T11/T12 PN16 tutarlılığı için RF
2. **Migration 041** — B36.19M doğrulama + DN 350-600 SCH 40S+80S, 10 satır
   - Mevcut 70 satır satır-satır kontrol: OD, et, kg/m, tolerans alanları tamamen doğru
   - Halüsinasyon kontrolü: NPS 14+ 80S et=12.70 sabit pattern doğru (B36.10M karışıklığı yok)
   - Eksik P0 satırlar: DN 350-600 için 40S+80S (gemi KK ana hatları için kritik)
   - DN 450 carbon kg/m: Wermac eksik, formülle hesaplandı (π·(D-t)·t·ρ/1e6)
3. **Kütüphane gerçek durum tespiti** — KUTUPHANE-YUKLEME-TAKIP.md çok eski

### Canlı Doğrulamalar

- ✅ `flansh_olculer` EN-1092-1 EN-T05 PN16 RF: 15 satır
- ✅ `boru_olculer` ASME-B36.19M toplam: 80 satır (70 → 80)
- ✅ DN 350-600 40S+80S: 10 yeni satır, tolerans alanları GENERATED ile otomatik dolduruldu
- ✅ Idempotent test: NOT EXISTS ile çift girişi engelleme çalışıyor

---

## Commit'ler (76. Oturumda)

| Hash | Mesaj |
|------|-------|
| 18fc4d8 | 76: EN-1092-1 PN16 T05 Blind 15 satir - migration 040 |
| 11816b0 | 76: B36.19M DN 350-600 40S+80S 10 satir bonus - migration 041 |

CI: ✅ YEŞİL (her commit sonrası otomatik ci-son-rapor.json güncellemesi)

---

## DB Değişiklikleri

```sql
-- 040: 15 satır EN-T05 PN16 RF (T11'den kopya pattern)
-- 041: 10 satır B36.19M DN 350-600 40S+80S (Wermac + formula)
```

---

## Kütüphane Snapshot — Gerçek Durum (12 Mayıs 2026)

Bu oturumun en büyük keşfi: `KUTUPHANE-YUKLEME-TAKIP.md` 43'ten kalma, gerçek DB çok daha dolu.

| Modül | Satır (canlı) | Belgedeki (43) | Fark |
|---|---:|---:|---:|
| `boru_olculer` | **450** | 48 | +402 |
| `flansh_olculer` | **276** | 20 | +256 |
| `fitting_olculer` | **424** | 0 | +424 |
| `fitting_malzeme_uyum` | 1 | 0 | +1 (test) |
| `malzeme_kataloglari` | ? (kontrol et) | 12 | ? |
| `tenant_spec_seti` | 0 | 0 | 0 |
| `spec_kural` | 0 | 0 | 0 |
| `ozel_parcalar` | 0 | 0 | 0 |

### `boru_olculer` kırılımı

| Standart | Satır |
|---|---:|
| ASME-B36.10M (karbon) | 238 |
| ASME-B36.19M (paslanmaz) | 80 ✅ 76 sonu |
| ASTM-B241 (alüminyum) | 50 |
| DIN-2448 (eski Alman karbon) | 29 |
| EN-10216-1 (EN karbon dikişsiz) | 29 |
| EEMUA-144 (CuNi gemi) | 24 |
| **TOPLAM** | **450** |

### `flansh_olculer` kırılımı

| Standart | Satır |
|---|---:|
| B16.5 (ASME) | 216 |
| EN-1092-1 | 60 ✅ 76 sonu (T01/T05/T11/T12 × 15 DN PN16) |
| **TOPLAM** | **276** |

### `fitting_olculer`: 424 satır

Kırılım yapılmadı (zaman). 77'de detay analizi önerilir.

---

## 77'ye Açık Borç (önceliğe göre)

1. **KUTUPHANE-YUKLEME-TAKIP.md tam senkronizasyon** — gerçek DB count ile baştan yaz (P0, ~30 dk)
2. **fitting_olculer kırılım analizi** — 424 satır hangi standart × parça tipinde dolu? (P0, ~15 dk)
3. **`malzeme_kataloglari` durum kontrolü** — kaç satır? hangi gruplar dolu? (P1, ~10 dk)
4. **A2 — B16.9 Stub End** (P1, ~1.5 sa) — fitting cephesinde devam
5. **A3 — EN 1092-1 PN 10 paketi** (P1, ~2 sa) — PN 16 pattern'i tekrar
6. **C — Migrations 027-031 push** (hijyen, ~15 dk) — repo'da olmayan canlı DB değişiklikleri
7. **`fitting_malzeme_uyum` planlama** — 8000 satır beklenen ama 1 satır var. Script-üretim stratejisi (P2)
8. **Eksik B36.19M satırları** — DN 6/8/10 (NPS 1/8, 1/4, 3/8) küçük boyutlar (P2, ~30 dk)

---

## Kritik Hatırlatmalar (76 yeni dersleri dahil)

### 76'da öğrenilen (yeni)

- **MK-76.1:** Supabase SQL Editor `BEGIN;`/`COMMIT;` syntax error verir. Multi-statement zaten implicit transaction içinde, explicit kullanma. DO bloğundaki RAISE EXCEPTION rollback'i tetikler.
- **MK-76.2:** Bir tablonun kolon adları/değerleri varsayma — mevcut benzer satırdan LATERAL JOIN ile kopyala. `flansh_olculer` `cap_dn` kullanıyor ama `boru_olculer` `dn` kullanıyor — her tablo farklı sözlük.
- **MK-76.3:** SQL yorumlarında sadece **saf ASCII** kullan. Em-dash, bullet, multiply sign, Yunan harfleri, üst-indis, Türkçe karakterler parser'ı bozar. Detayları JSON `notlar` alanına koy (JSON parser onları görür, SQL parser değil).
- **MK-76.4:** `information_schema.columns` `is_generated` kolonunu (PG 12+) **göstermez**, GENERATED kolonlar yanıltıcı şekilde `is_nullable: YES` görünebilir. Şüphede sade SELECT ile dolu gelen ama default'u olmayan kolonu GENERATED varsay. INSERT'te bunları belirtme — otomatik dolar.
- **MK-76.5:** `KUTUPHANE-YUKLEME-TAKIP.md` belgeleri canlı DB count ile senkronize tutulmalı. 43'ten kalma yapısı 5+ ay geri kaldı. Her oturum sonu canlı DB sorgu ile güncelle.

### 75 + öncesi (taşınan)

- MK-75.1: `notlar` TEXT, SELECT'te `::jsonb` cast şart
- MK-75.2: INSERT öncesi `is_nullable` sorgula (76'da bu yetersiz çıktı, MK-76.4 ile genişletildi)
- MK-75.3: Çift kaynak doğrulama disiplini
- MK-75.4: Standart edisyon farkları, en güncel referans
- MK-75.A: EN flanş tip kodu `EN-T01`, `EN-T05`, `EN-T11`, `EN-T12`
- MK-75.B: `basinc_sinifi` sadece sayı ('16', '150')
- MK-75.C: `bolt_holes_inch`/`bolt_cap_inch` 'NNmm' / 'MNN' format
- MK-75.D: Idempotent INSERT pattern (NOT EXISTS bileşik anahtar)
- MK-51.4: DB schema değişikliği yapılırken kod tarafında SELECT/INSERT cümlelerini grep'le tara
- MK-49.1: `izometri-oku.js`'e dokunma — minimum değişiklik

---

## Süreç Disiplinleri (76'da uygulanan)

- **`gp` push kullan** (otomatik rebase) — terminal git akışı, GitHub web UI upload yok
- **Heredoc yöntemi** Mac dosya transferi için (MK-51.1)
- **Önce DB schema sorgula, sonra INSERT yaz** — MK-76.2 ile genişletildi (LATERAL JOIN pattern)
- **Idempotent SQL** her satır için `NOT EXISTS` kontrolü
- **DO blok ile doğrulama** — INSERT sonrası RAISE NOTICE / RAISE EXCEPTION ile final satır sayısı kontrolü
- **ASCII-only SQL comments** (MK-76.3) — Türkçe açıklamaları JSON notlar alanına taşı

---

## CI Son Durum

- **Build:** ✅ YEŞİL (son commit `11816b0`)
- **Lint:** baseline korundu (Faz B sonrası 0 hata / 22 uyarı)
- **Vercel:** ✅ Production = `11816b0`

---

> 77. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
