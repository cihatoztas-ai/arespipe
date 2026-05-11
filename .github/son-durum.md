# Son Durum — 75. Oturum (11 Mayıs 2026)

> 74 → 75 geçişi. 75 ana proje akışından ayrı, **kütüphane mini-projesi** oturumu oldu. Cap cephesi bitirildi, EN 1092-1 PN 16 cephesi açıldı ve 3 tip yüklendi. Toplam **78 yeni kütüphane kaydı** Supabase + GitHub'da.

---

## Bu Oturumun Sonucu

**75 başarıyla kapatıldı (kütüphane mini-projesi):**
- 037 Cap (33 satır) — `fitting_olculer` toplamı 391 → 424
- 038 EN-T11 PN 16 WN (15 satır)
- 039 EN-T01 + EN-T12 PN 16 (30 satır) — `flansh_olculer` toplamı 216 → 261
- Sistem kütüphanesi toplamı: 1,047 → 1,125 satır

### Yapılanlar (sırasıyla)

1. **Cap cephesi tamamlandı** — briefing v1'in yarıda kalan işi
   - 032 → 037 yeniden numaralandı (ana sayaç 032'yi başka iş için tüketmişti)
   - Idempotent yeniden yazıldı (`INSERT ... SELECT ... WHERE NOT EXISTS`)
   - Doğrulama: NPS 4 spot `4, 100, 114.3, H=64.0, H1=76.0` ✓
2. **EN 1092-1 PN 16 Type 11 (WN)** — 038, 15 satır
   - Wermac kaynak, RoyMech cross-check (DN 100 birebir uyum)
   - Schema kararları: `flansh_tipi='EN-T11'`, `basinc_sinifi='16'`
   - 6/6 test geçti
3. **EN 1092-1 PN 16 Type 01 + Type 12** — 039, 30 satır
   - RoyMech tek tablodan iki tip türetildi (C1 plate, C2 boss/WN, N2 boss OD, H1 boss length)
   - Cıvata reuse (Wermac WN'den, PN+DN sabit)
   - Standart edisyon farkı yakalandı: RoyMech `f1=2mm` (BS 2002) vs Wermac `f1=3mm` DN 32-250 (en güncel DIN). Wermac override edildi.
   - İlk INSERT NOT NULL constraint patladı (`bolt_circle_mm`), transformer düzeltildi (UPDATE → INSERT içinde)
   - Doğrulama: DN 100 üç tip karşılaştırma:
     - EN-T01: K=22, hub=NULL, bore=116, BC=180 (plate, gövdesiz)
     - EN-T11: K=20, hub=131, hub_uz=52, BC=180 (welding neck)
     - EN-T12: K=20, hub=140, hub_uz=40, bore=116, BC=180 (hubbed)
   - Üçü de farklı parça → 3D modelde net ayrı geometri ✓

### Cihat'ın yönlendirdiği kritik prensip (75 ortası)

> *"Sistemimize giren spoollara ait malzeme listesinde ne varsa bunları bir yazı olarak değil parça olarak tanıyacaz. O yüzden burada eksiğimizin olmaması lazım. Bu parça tanıma işi bizim daha sonra 3D modellemelerimizde lazım olacak."*

Bu prensip schema kararını şekillendirdi (MK-75.A): tek "SO" kodu kabul edilemez, Type 01 ve Type 12 ayrı kayıt olmalı.

---

## Commit'ler (75. Oturumda)

| Hash | Mesaj |
|------|-------|
| `048d90f` | data(75): 039 EN1092-1 PN16 Type 01+12 (ilk push, içerik bozuk — INSERT fail) |
| `18fc4d8` | data(75): 037 Cap (33) + 038 EN-T11 WN (15) + 039 EN-T01+T12 (30) — toplam 78 satır |

İlk 039 commit'i Supabase'de NOT NULL hatası verdi (`bolt_circle_mm`), ikinci commit aynı dosya adına düzeltilmiş halini yazıp 037+38 ile birlikte push'ladı. `gp` (rebase + push) sorunsuz çalıştı.

CI: ✅ YEŞİL (tüm push'lar sonrası ci-son-rapor.json otomatik güncellendi)

---

## DB Değişiklikleri

```
fitting_olculer:
  +33 satır  B16.9 Cap, DN 15-1200, sistem_preset=TRUE
  Toplam: 391 → 424

flansh_olculer:
  +15 satır  EN-1092-1 / EN-T11 (WN) PN 16, DN 10-300
  +15 satır  EN-1092-1 / EN-T01 (Plate SO) PN 16, DN 10-300
  +15 satır  EN-1092-1 / EN-T12 (Hubbed SO) PN 16, DN 10-300
  Toplam: 216 → 261
```

Migration dosyaları:
- `migrations/037_inserts_cap.sql` (Supabase + GitHub ✓)
- `migrations/038_inserts_en1092_pn16_t11_wn.sql` (Supabase + GitHub ✓)
- `migrations/039_inserts_en1092_pn16_t01_t12.sql` (Supabase + GitHub ✓)

---

## 76'ya Açık Borç (önceliğe göre)

### Kütüphane (sıralı)
1. **EN-T05 (Blind) PN 16** — kaynak araştırması (piping-world, pipingpipeline, valvias), ~15 satır → PN 16 tamamlanır
2. **B16.9 Stub End** — Wermac dim_stub_ends, ~33 satır → Cap'in çifti
3. **B36.19M paslanmaz boru içerik teyidi** — DB'de 70 satır var, bizim üretim değil
4. **EN 1092-1 PN 10, 25, 40** × T01/T05/T11/T12 → ~180 satır toplu, PN 16 pattern'inden hızlı

### Hijyen
5. **Migrations 027-031 push** — DB'de aktif ama GitHub'da yok, eski kütüphane oturumlarından

### Düşük öncelik
6. `notlar` TEXT → JSONB migration (mevcut veri geçerli JSON, CAST mümkün)
7. `bolt_holes_inch` / `bolt_cap_inch` → `bolt_size_text` yeniden adlandırma (UI naming)

### Ana proje (75'te dokunulmadı, 74'ten devren)
- briefing-74-sonuc + MK-74.3 (is_durumu vs s.durum eksenleri) — detay 74 kayıtlarında

---

## Kritik Hatırlatmalar (75 yeni + öncesi)

### 75'ten yeni
- **MK-75.A:** EN flanş tip kodu `EN-T01/T05/T11/T12` (B16.5'ten ayrı, parça kimliği)
- **MK-75.B:** `basinc_sinifi` sadece sayı (`'16'`, `'150'`)
- **MK-75.C:** `bolt_holes_inch`=delik / `bolt_cap_inch`=bolt çapı (B16.5 inch / EN metric)
- **MK-75.D:** Idempotent INSERT — `WHERE NOT EXISTS` her satırda
- **MK-75.1:** `notlar` kolonu TEXT (JSONB değil) — SELECT'te `::jsonb` cast şart
- **MK-75.2:** NOT NULL constraint kontrolü zorunlu — `is_nullable` sorgula
- **MK-75.3:** Çift kaynak doğrulama — DN 100 + 7 alan ±0.5mm
- **MK-75.4:** Standart edisyon farkları (BS 2002 vs EN 2013) — en güncel referans

### Önceki oturumlardan
- **`izometri-oku.js`'e DOKUNMA** (MK-49.1) — sadece ilgili fonksiyon
- **Hassas anahtar Claude'a verme** (MK-50.1)
- **Dosya kopyalama protokolü** (MK-51.1, `arespipe_kopyala` zsh)
- **`gp` push kullan** — otomatik rebase, `git push origin main` yazma (MK-52.2)
- **Tek tırnak commit mesajı** (Türkçe + parantez shell'i karıştırır)
- **DB schema değişikliği grep tarama** (MK-51.4)
- **`isometri-batch.html`'e dokunma sınırı** vs minimum değişiklik prensibi

---

## Performans (75 ölçümleri)

- **Wermac PN 16 WN fetch:** ~3 sn, markdown ~3 KB
- **RoyMech PN 16 fetch:** ~3 sn, markdown ~4 KB
- **Parser çalışma süresi:** <1 sn (15 satır × 3 tablo)
- **Transformer çalışma süresi:** <1 sn (30 INSERT üretim)
- **Cross-check (manuel):** DN 100, 7 alan, ~2 dk
- **Supabase INSERT (idempotent):** 33 + 15 + 30 satır, her biri <2 sn
- **Tüm cephe (Cap + 3 EN tipi) end-to-end:** ~3 saat (Wermac + RoyMech araştırma + parser + transformer + push + doğrulama)

---

## Süreç Disiplinleri (75'ten)

- **Migration numarası ön-kontrolü:** `ls migrations/ | tail -10` (ana sayaç paralel mini-projeyle çakışabilir)
- **Idempotent SQL standardı:** Briefing kuralı, `INSERT ... SELECT ... WHERE NOT EXISTS`
- **Schema sorgusu standartı:** `column_name, is_nullable, data_type` — sadece kolon adı yetmez
- **Cıvata reuse:** Aynı PN+DN'de tüm tipler aynı bolt pattern → tek kaynak (Wermac WN) yeterli
- **Standart edisyon belirtimi:** Üretimde "kaynak: X, edisyon: Y" notlar JSONB içinde
- **Çift kaynak doğrulama:** DN 100 spot + 7 alan ±0.5mm

---

## CI Son Durum

- **Build:** ✅ YEŞİL (en son `18fc4d8` data(75): 78 satır)
- **Lint:** 0 hata, 22 uyarı (Faz B baseline'ı korundu)
- **Vercel:** ✅ Production = `18fc4d8`

---

## Kütüphane Mini-Projesi Durumu (75 sonu)

| Modül | Beklenen | Canlıda | % |
|---|---:|---:|---:|
| `boru_olculer` | 280 | 440 | 157% (kapsam aşıldı) |
| `flansh_olculer` | 800 | **261** | 33% |
| `fitting_olculer` | 2,500 | **424** | 17% |
| `malzeme_kataloglari` | 120 | 12 | 10% |
| `fitting_malzeme_uyum` | 8,000 | 0 | 0% |
| `ozel_parcalar` | 200-500 | 0 | 0% |
| `tenant_spec_seti` | 10-20 | 0 | 0% |
| `spec_kural` | 500-1,000 | 0 | 0% |
| **TOPLAM** | **~12,400** | **1,137** | **9.2%** |

75 boyunca: 1,059 → 1,137 (+78 satır, %0.6 artış). Stratejik olarak pilot ihtiyacı PN flanşları için doğru cephe.

---

> 76. oturum açılışında bu dosya, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` ve `KUTUPHANE-BRIEFING.md` v2 okunacak.
