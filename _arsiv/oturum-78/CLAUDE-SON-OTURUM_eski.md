# 75. Oturum — Kütüphane Geliştirme (11 Mayıs 2026)

> Ana proje akışından farklı oturum: paralel "kütüphane mini-projesi"ne odaklandı. Cap cephesi bitirildi, EN 1092-1 PN 16 cephesi açıldı ve 3 tip yüklendi.

---

## Bağlam

**Cihat'ın hedefi (oturum başı):** *"Bugün biraz kütüphanemizi geliştirelim istiyorum."*

Cihat KUTUPHANE-BRIEFING.md (v1, 7 May 2026) yükledi. Briefing'in son durumu: Cap cephesi yarıda, EN 1092-1 başlanmamış, ana sayaç 032'yi başka iş için tüketmişti (rls_fix_5_tablo). Briefing'in 3 giriş noktasından **EN 1092-1** seçildi, ek olarak Cap'in de tamamlanması gerektiği netleşti (Cihat: *"ekte birde cap dosyası var bu hazırlanmıştı ama henüz sisteme yüklenmemişti"*).

---

## Yapılanlar (sırasıyla)

### 1. Cap cephesi tamamlandı — 037 (33 satır)

- Briefing'in `032_inserts_cap.sql` dosyası alındı (cap_cephe.zip içinden)
- **Migration sayacı blocker:** Ana sayaç 036'ya geldi (`spool_id_a_prefix`), Cap için yeni numara **037** atandı
- Mevcut SQL idempotent değildi — `INSERT ... SELECT ... WHERE NOT EXISTS` pattern'ine çevrildi (MK-75.D)
- `transformer_cap_v2.py` ile yeniden üretildi → 033 satır, idempotent
- Supabase'de koşturuldu, doğrulama yeşil:
  - Sayım: 33 ✓
  - NPS 4 spot: `4, 100, 114.3, H=64.0, H1=76.0` ✓

### 2. EN 1092-1 PN 16 Type 11 (WN) — 038 (15 satır)

- **Kaynak araştırması:** Wermac EN 1092-1 sayfaları sadece Type 11 (WN) var. Diğer tipler için RoyMech/piping-world gerekli.
- Wermac PN 16 WN sayfası fetch + markdown'a kaydedildi (`ham_html/wermac_en1092_pn16_wn.md`)
- 3 ayrı tablo (geometri + boyun + cıvata) birleşik parser ile JSON'a çevrildi (DN 10-300, 15 satır)
- **Çift kaynak doğrulama** (MK-75.3): RoyMech DN 100 PN 16 ile 7 alan birebir uyum
- Test sonuçları: 6/6 geçti (satır sayısı, DN 100 spot, DN 50 boru OD, BC<OD, bolt monoton, K aralığı)
- **Schema sorgusu yapıldı** — `flansh_olculer` 31 kolon, B16.5 örnek satır incelendi (bolt_holes_inch=hole dia, bolt_cap_inch=bolt dia çıktı)
- **Karar (MK-75.A):** EN tipleri ayrı kod (`EN-T11`, `EN-T01`, ...) — B16.5'ten ayrı tutuldu (parça kimliği prensibi)
- **Karar (MK-75.B):** `basinc_sinifi = '16'` (sadece sayı, B16.5'in `'150'` convention'ına uyum)
- Idempotent SQL üretildi (`038_inserts_en1092_pn16_t11_wn.sql`)
- Supabase'de koşturuldu, doğrulama yeşil:
  - Sayım: 15 ✓
  - DN 100 spot: `cap_mm=114.3, OD=220, K=20, hub_od=131, BC=180, 8×M16` ✓
  - Notlar JSONB cast: `Type 11 — Welding Neck, neck cidar=3.6` ✓

### 3. EN 1092-1 PN 16 Type 01 (Plate SO) + Type 12 (Hubbed SO) — 039 (30 satır)

- **Cihat'ın prensibi** (oturum ortası): *"sistemimize giren spoollara ait malzeme listesinde ne varsa bunları bir yazı olarak değil parça olarak tanıyacaz. eksiğimizin olmaması lazım."* → Tek bir SO yetmez, Type 01 ve Type 12 ayrı parçalar olarak yüklenmeli.
- RoyMech PN 16 sayfası markdown'a kaydedildi (`ham_html/roymech_en1092_pn16.md`) — tek tabloda 3 tipi de içeriyor (C1=plate, C2=WN/Hub, N1=WN neck, N2=Hub boss)
- Cıvata bilgisi Wermac Type 11 JSON'undan reuse (PN+DN sabit → tüm tipler aynı bolt pattern)
- Parser iki tip ayrı çıkardı, test sonuçları:
  - Type 01: 4/4 geçti (DN 100 K=22, bore=116)
  - Type 12: 4/4 geçti (DN 100 K=20, hub_od=140, hub_uz=40)
- **Standart edisyon farkı yakalandı (MK-75.4):** RoyMech `f1=2mm` her DN için (BS EN 1092-1:2002). Wermac DN 32-250 için `f1=3mm` (EN 1092-1:2007+A1:2013). Tutarlılık için Wermac değerleri Type 01/12'ye override edildi.
- 039 SQL üretildi (30 INSERT)
- **İlk çalıştırma fail:** `bolt_circle_mm NOT NULL constraint` (MK-75.2 öğrenmesi) — UPDATE bloğu yerine INSERT'e dahil edildi
- 039 v2 ile yeniden çalıştırıldı, doğrulama yeşil:
  - Sayım: T01=15, T12=15 ✓
  - DN 100 3 tip karşılaştırma:
    - EN-T01: K=22, hub=NULL, bore=116, BC=180 ✓
    - EN-T11: K=20, hub=131, hub_uz=52, BC=180 ✓
    - EN-T12: K=20, hub=140, hub_uz=40, bore=116, BC=180 ✓
  - Bolt circle NULL: 0 satır ✓

### 4. Git push (üç dosya da GitHub'da)

- 037 + 038 önce push'da pathspec hatası (dosyalar Downloads'ta unutuldu, migrations/'a kopyalanmamıştı)
- Yeniden kopyala → tek commit'le üçü birden push'landı
- Commit: `18fc4d8 data(75): 037 Cap (33) + 038 EN-T11 WN (15) + 039 EN-T01+T12 (30) — toplam 78 satır`

---

## Mimari Kararlar (75)

**MK-75.A — EN flanş tip kodu naming:**
`flansh_olculer.flansh_tipi` text alanında EN için ayrı kod ailesi: `EN-T01`, `EN-T05`, `EN-T11`, `EN-T12`. B16.5'in `WN/SO/BL`'sinden net ayrılır. UI filtre `LIKE 'EN-%'` veya `geometri_std='EN-1092-1'` ile. Sebep: Parça kimliği prensibi — Type 01 (plate gövdesiz) ve Type 12 (hubbed boss'lu) farklı geometrik nesneler.

**MK-75.B — `basinc_sinifi` sadece sayı:**
B16.5 convention `'150'` (Class değil). EN için aynı: `'16'`, `'25'`. Geometri_std ayrımı yapar.

**MK-75.C — `bolt_holes_inch` / `bolt_cap_inch` çift anlamı:**
Alan adları B16.5 tarihsel (inch). İçerik standarda göre değişir:
- `bolt_holes_inch` = bolt **delik** çapı (B16.5 `'3/4'` / EN `'18mm'`)
- `bolt_cap_inch` = bolt **gövde** çapı (B16.5 `'5/8'` / EN `'M16'`)
İleride `bolt_size_text` yeniden adlandırma değerlendirilebilir.

**MK-75.D — Idempotent INSERT pattern (kütüphane standardı):**
`INSERT ... SELECT ... WHERE NOT EXISTS` her satırda. Doğal anahtar tablo bazında belirlendi.

---

## Öğrenmeler

**MK-75.1 — `notlar` kolonu schema'da TEXT (JSONB değil):**
Hem `fitting_olculer.notlar` hem `flansh_olculer.notlar` text. INSERT JSON string olarak yazılıyor (geçerli JSON ama tipi text). SELECT'te `::jsonb` cast şart. İlk doğrulama bu yüzden 42883 hatası verdi.
**Sonraki adaylık:** `notlar` TEXT → JSONB CAST migration (mevcut veri geçerli JSON).

**MK-75.2 — NOT NULL constraint kontrolü zorunlu:**
INSERT yazmadan önce schema sorgusunda `is_nullable` kolonunu da çek. 75'te `flansh_olculer.bolt_circle_mm NOT NULL` atlandı → 039 ilk satırda 23502 hatası, tüm INSERT geri alındı, transformer yeniden yazıldı (UPDATE bloğu → INSERT içine). Sonraki cephelerde standart sorgu:
```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name='<tablo>' ORDER BY ordinal_position;
```

**MK-75.3 — Çift kaynak doğrulama (yöntem netleşti):**
Tek tip + tek PN için iki bağımsız kaynak. DN 100 spot check bilinen referans değerlerle eşleşmeli. 7+ alan ±0.5mm ✓ ise kaynak güvenilir. 75'te Wermac vs RoyMech DN 100 PN 16: A=220, A=114.3, BC=180, K=20, N1=131, H2=52, H3=12, S=3.6 → tüm alanlar birebir.

**MK-75.4 — Standart edisyon farkı (kritik):**
Aynı standardın farklı sürümleri farklı değerler. BS EN 1092-1:2002 vs EN 1092-1:2007+A1:2013 → `f1` değeri 2mm'den DN-aralığına göre 2/3/4/5mm'ye geçti. Önce kaynak edisyonu sor, en güncel referans alınır, eski override edilir.

**Genel ders:** Cihat'ın "parça olarak tanı, eksiğimiz olmasın" prensibi schema kararını net yönlendirdi. Tek bir "SO" kodu kabul edilse Type 01 ve Type 12 ayırt edilemez, 3D model yanlış geometri çizer. Schema tasarımında **kullanım amacını sorgulamak** (bu veriyle ne yapılacak?) doğru kararı veriyor.

---

## DB Değişiklikleri (75 sonu Supabase durumu)

```sql
-- fitting_olculer (önceki 391 → 424)
+33 satır: B16.9 Cap, DN 15-1200, sistem_preset=TRUE

-- flansh_olculer (önceki 216 → 261)
+45 satır: EN 1092-1 PN 16
  - EN-T11 (WN)         × 15 (DN 10-300)
  - EN-T01 (Plate SO)   × 15
  - EN-T12 (Hubbed SO)  × 15
```

---

## Commit'ler (75)

| Hash | Mesaj |
|------|-------|
| `048d90f` | data(75): 039 EN1092-1 PN16 Type 01+12 — ilk push (içerik bozuk, INSERT failed) |
| `18fc4d8` | data(75): 037 Cap (33) + 038 EN-T11 WN (15) + 039 EN-T01+T12 (30) — toplam 78 satır |

İlk 039 commit'i SQL'i pushladı ama Supabase'de NOT NULL hatası verdi. İkinci commit aynı 039'u düzeltilmiş haliyle (bolt_circle INSERT'te dolu) + 037 + 038 ekledi.

---

## Açık Borç (76'ya devreden)

### Kütüphane
1. **EN-T05 (Blind) PN 16** — kaynak araştırması, ~15 satır
2. **B16.9 Stub End** — Wermac dim_stub_ends, ~33 satır
3. **B36.19M Paslanmaz Boru içerik teyidi** — DB'de 70 satır var, üretim cross-check
4. **EN 1092-1 PN 10, 25, 40** × T01/T05/T11/T12 → ~180 satır

### Önceki (75'te dokunulmadı)
- B16.5 SW Flanş Class 150/300 (~42 satır)
- B16.5 LJ Flanş + B16.9 Stub End paket
- Migrations 027-031 GitHub'a push (DB'de aktif ama repo'da yok)
- `notlar` TEXT → JSONB migration (düşük öncelik)
- `bolt_holes_inch` / `bolt_cap_inch` → `bolt_size_text` yeniden adlandırma (düşük öncelik)

### Ana proje (kütüphane dışı, son durum 74'ten)
- briefing-74-sonuc + MK-74.3 (is_durumu vs s.durum eksenleri) — detay 74'te
- Bu bilgi mevcut son-durum.md'de değil (kütüphane mini'sine paralel)

---

## Performans (75 doğrulamaları)

- Wermac PN 16 WN fetch: ~3 sn (markdown ~3KB)
- Parser çalışma süresi: <1 sn (15 satır × 3 tablo)
- Idempotent INSERT (33-30): tahmini 1-2 sn Supabase'de
- Cross-check (Wermac ↔ RoyMech): DN 100, 7 alan, manuel — 2 dk

---

## Süreç Olayları

### Migration sayacı netleşmesi
Briefing'in `032_inserts_cap.sql` adı yanlış çıktı — ana sayaç 032'yi `rls_fix_5_tablo`'ya verdi (5+ ay önce kütüphane mini paralel ilerlerken). Sayaç teyidi `ls migrations/` ile yapıldı, son numara 036 görüldü, sıradaki 037 oldu. **Disiplin:** Kütüphane SQL'leri ana sayaca dahil — paralel mini-proje olsa da numaralandırma tek havuzdan.

### NOT NULL constraint patlaması
038 başarıyla geçti, 039 ilk INSERT'te 23502 patladı. Sebep: `bolt_circle_mm` NOT NULL imiş, ben başta NULL yazıp sonra UPDATE ile dolduruyordum. Düzeltme: INSERT'e dahil et, UPDATE bloğunu kaldır. MK-75.2 öğrenmesi olarak kaydedildi. Sonraki cephelerde **standart schema sorgusu artık `is_nullable` kolonunu da içerir**.

### Cihat'ın "parça olarak tanı" yönlendirmesi
Cihat oturumun ortasında *"sistemimize giren spoollara ait malzeme listesinde ne varsa bunları bir yazı olarak değil parça olarak tanıyacaz"* dedi. Bu, scope'u Type 01 + Type 12 + Type 11 olarak genişletti — sadece Type 11 değil. 3D model + spool eşleştirme bu ayrımı gerektiriyor.

### Briefing güncel tutmak
v1 briefing (7 May) Cap'i "yarıda kalan" gösteriyordu. 75 sonu v2 yazıldı (bu oturum kapanışında). Sonraki kütüphane oturumu v2'yi okuyacak.

---

> 76. oturum açılışında bu dosya + `son-durum.md` + `KUTUPHANE-BRIEFING.md` v2 okunacak.
> Eğer 76 kütüphane oturumu olursa: P0-1 (EN-T05 Blind) ile başla.
> Eğer 76 ana proje oturumu olursa: 74'te kalan iş (`briefing-74-sonuc` + MK-74.3) — bu dosyada o detay yok, ana oturum kayıtlarına bak.
