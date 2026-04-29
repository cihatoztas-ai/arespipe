# Claude — 45. Oturum Arşivi

> **Tarih:** 29 Nisan 2026
> **Süre:** ~2 saat aktif çalışma
> **CI:** YESIL
> **Migration sayısı:** 3 (017, 018, 019)
> **Yeni dosya:** 0 (sadece DB)
> **Değişen dosya:** 0
> **Kapanış:** Schema temeli + format dispatcher altyapısı oturdu, parser yazımı 46'ya disiplinli ertelendi

---

## Bağlam

44 sonu Cihat 3D vizyonu açtı + tersan + PAOR aktif iki referans pilot olarak belirlendi + parser yazımı 45'in iki ana teması olarak yazıldı. 45 başında plan: schema migration → tersan parser → PAOR parser → 3D motor entegrasyonu (Aşama 4.1-4.3).

45 plan büyük ölçüde tutuldu **ama disiplinli sapma** yapıldı: parser yazımına atlamak yerine önce DB temelini sağladık + 44 raporundaki yanlışlıkları tespit edip düzelttik. CIHAT-PROFIL "atlama, listele, dolu cevap ver" disiplini bu oturumda iki kez kazandırdı.

---

## Yapılanlar

### 1. Migration 017 — 3D Motor Schema (✅)

**Dosya:** `migrations/017_3d_motor_schema.sql`

Eklenenler:
- `spool_malzemeleri.sira INTEGER` — 3D motor parça sırası (parser çıktısı)
- `spool_malzemeleri.rotation_angle INTEGER` — dirsek/parça dönüş açısı (0-359 derece, NULL serbest)
- `spool_malzemeleri.yonelim_kod TEXT` — manuel düzeltme yönelim kodu (yukari/asagi/sola/saga/on/arka)
- 2 CHECK constraint (rotation_angle aralığı, yonelim_kod set'i)
- 1 composite index `idx_spool_malzeme_sira` ON `(spool_id, sira)` — 3D motor sıralı okuma için

Doğrulama: 3 kolon eklendi, 2 constraint aktif, 1 index oluştu. Hepsi temiz.

**Önemli teyit:** `x1_mm/y1_mm/z1_mm/x2_mm/y2_mm/z2_mm` kolonları zaten vardı (PAOR koordinatları için). Dokunulmadı. 44 raporu *"mevcut: x1/y1/z1 zaten var"* doğru bilgiydi (kolon adı `_mm` suffix'iyle teyit edildi).

### 2. Migration 018 — sistem_preset Kolonu (✅)

**Dosya:** `migrations/018_format_tanimlari_sistem_preset.sql`

Bağlam: IZOMETRI-BATCH-KARAR.md / Karar 2 (36) *"sistem geneli format için tenant_id NULL + sistem_preset=true"* diyor ama 005 migration'da kolon eklenmemişti. 45'te tersan kaydı eklemeden önce gerekli.

Eklenenler:
- `sistem_preset BOOLEAN NOT NULL DEFAULT false` kolonu
- CHECK `check_format_sistem_preset_tenant`: `sistem_preset=true ⟹ tenant_id IS NULL`
- Partial unique index: `(ad) WHERE sistem_preset=true` (sistem geneli kayıtlarda ad çakışmaz)
- Mevcut PAOR kaydı `sistem_preset=true` UPDATE (tenant_id zaten NULL'dı, kullanim_sayisi=6 korundu)

RLS policy'leri **dokunulmadı.** Mevcut policy'lerin yapısını görmeden yeniden yazmak risky. PAOR canlı kullanılıyor (kullanim_sayisi=6), policy kırılırsa Vision AI akışı patlar. 020+ açık borç olarak bırakıldı.

### 3. Migration 019 — tersan Format Kaydı (✅)

**Dosya:** `migrations/019_format_tanimlari_tersan_kayit.sql`

Eklenen kayıt:
- **ad:** "Cadmatic — Tersan Shipyard M110 Şablonu"
- **id:** `c8755d46-5bcc-4a61-88ca-f1d48399e054` (yeni)
- **cad_program:** "Cadmatic" (44 raporundaki "AVEVA E3D" YANLIŞTI — düzeltildi)
- **fingerprint:**
  ```json
  {
    "ulke": "TR",
    "tersane": "Tersan Shipyard",
    "format_kodu": "tersan_cadmatic_m110",
    "baslik_regex": "Malzeme Listesi",
    "tablo_baslik_regex": "Cut & Bending Info",
    "dosya_adi_regex": "^[A-Z]\\d+-\\d+-\\d+-P\\d+\\s+\\d+\\(\\d+\\)\\.S\\d+\\.\\d+\\.pdf$",
    "pdf_uretici_anahtar": ["Cadmatic", "Piping Isometrics & Spools"]
  }
  ```
- **parser_kural:** `{}` (boş — 020'de doldurulacak)
- **sistem_preset:** true, **tenant_id:** NULL

Doğrulama: 2 kayıt aktif (PAOR + tersan), her ikisinde parser_kural boş, ikisi de sistem geneli.

### 4. PDF Örnek Analizi (✅)

Cihat 3 dosya yükledi:
- `M110-Part2.zip` — tersan örneği (1 Spool PDF + 1 Isometry PDF + 2 Excel)
- `11D-PAOR-54102-101626-A.pdf` — PAOR ana çizim
- `11D-PAOR-54102-101626-A-Isometric_View.pdf` — PAOR 3D görünüm (referans)

**tersan analizi (M110-317-022-P2 1(2).S01.1.pdf):**

| Element | Bulgu |
|---|---|
| **PDF Producer** | Cadmatic (Piping Isometrics & Spools) |
| **Sayfa boyutu** | A2 (1684 x 1191 pts) |
| **Cut & Bending Info tablosu** | Kolonlar: Spool-Cut, Cut Length, Set Length/Transport, **Rotation Angle**, Cut Away. Bu spool'da Rotation Angle BOŞ. |
| **Malzeme Listesi tablosu** | Kolonlar: No, Adet, Açıklama, Boyut, Boy, Malzeme, Ağırlık. 5 satır (2 boru + 1 dirsek + 2 imalat işi - Victaulic Groove). |
| **Çap notation** | `219.0x3.0` (DıştanxEt) → DN200 lookup gerektirir |
| **Standart** | DIN 86018 (CuNi marine pipe) |
| **Footer** | PIPE NO: M110-317-022-P2, SPOOL NO: -S01, PRJ NO: B1110, Total Weight: 30.6 kg |
| **Dil** | Türkçe |

**Kritik bulgu:** Item 4 ve 5 ("Boru Ucuna Victaulic için Groove acılacak") parça **değil**, **işlem talimatı**. Parser bunları `spool_malzemeleri`'ne yazmamalı, ayrı bir alana (notlar veya işlem listesi) yazmalı. Bu 46'da netleşecek.

**PAOR analizi (11D-PAOR-54102-101626-A.pdf):**

| Element | Bulgu |
|---|---|
| **Üretici** | STM (Türk firma, Portugal Navy için BV) |
| **CAD program** | AVEVA E3D |
| **Title block** | "PORTUGUESE NAVY AOR+", Project Drawing No: 11D-PAOR-54102-101626-A |
| **Pipe ref** | MODEL REFERENCE PIPE NO: Z10-F76_CARGO_SYSTEM_001 |
| **Coordinates** | "FORE 1279, PS 1294, HEI +2" / "FORE 448, PS 1294, HEI +510" |
| **3 ana tablo** | FABRICATION MATERIAL LIST + ERECTION MATERIAL LIST + PIPE CUT-LENGTHS |
| **Spool dilimi** | "SPOOL [1] [2]" (bu çizimde 2 spool) |
| **Continuation** | "«CONTINUATION OF PIPE» Z11-F76_CARGO_SYSTEM_006" |
| **Standart** | DIN 2448 (boru), DIN 2616 (redüktör), DIN 2605 (dirsek), DIN 2633 (flanş) |
| **Dil** | İngilizce |

**Kritik bulgu:** PAOR'da Rotation Angle yok ama **3D koordinat doğrudan var** — daha bile iyi. PAOR parser FORE/PS/HEI değerlerini `x1_mm/y1_mm/z1_mm`/`x2_mm/y2_mm/z2_mm`'e direkt yazabilir. 3D motor Aşama 4.1'de buradan okuyacak.

### 5. Parser Tasarım Haritası (Hazır, kod 46'da)

İki format için regex iskeletleri kafamda hazır:

**tersan (`format_kodu: tersan_cadmatic_m110`):**
- Tablo çıkarımı: `pdfplumber.extract_tables()` — tablo 2 (Cut & Bending) + tablo 3 (Malzeme Listesi)
- Footer regex: `PIPE NO:\s*-?(?<pipe>...)`, `SPOOL NO:\s*-?(?<spool>S\d+)`
- Boyut parse: `^(\d+\.?\d*)x(\d+\.?\d*)$` (219.0x3.0 → dış çap, et) + DN lookup `boru_olculer`
- Tip eşleşme: "Boru Dikişsiz" → boru, "Dirsek" → dirsek, "Flans" → flans, "Groove" → işlem (atlanır)

**PAOR (`format_kodu: paor_aveva_stm`):**
- Title block: `MODEL REFERENCE PIPE NO:\s*(?<pipe>Z\d+-...)`, `DESIGN DRAWING NO:\s*(?<dwg>11D-PAOR-...)`
- Material Description regex (her tip için ayrı):
  - Boru: `^PIPE\s+SEAMLESS\s+(?<kalite>\w+)\s+DIN\s+(?<std>\d+)\s+DN(?<dn>\d+)\s+T:(?<et>[\d.]+)\s*MM`
  - Dirsek: `^ELBOW\s+SEAMLESS\s+(?<kalite>\w+)\s+DIN\s+(?<std>\d+)\s+(?<radius>[\d.]+D)\s+(?<aci>\d+)°?\s+DN(?<dn>\d+)`
  - Flanş: `^FLANGE\s+(?<tip>\w+)\s+(?<kalite>\w+)\s+DIN\s+(?<std>\d+)\s+DN(?<dn>\d+)\s+PN(?<pn>\d+)`
  - Redüktör: `^REDUCER\s+\w+\s+SEAMLESS\s+(?<kalite>\w+)\s+DIN\s+(?<std>\d+)\s+DN(?<dn1>\d+)X+DN(?<dn2>\d+)\s+T:(?<et1>[\d.]+)X(?<et2>[\d.]+)\s*MM`
- Erection Material List **atlanır** (cıvata/somun/conta — `spool_malzemeleri`'ne yazılmaz, BOM detayı)
- Coordinate çıkarımı → `x1_mm/y1_mm/z1_mm` direkt yazılır

---

## 44 Raporundaki Tespit Edilen Yanlışlar

CLAUDE-SONRAKI-OTURUM.md (44 sonu) iki kritik yanlış içeriyordu, 45'te düzeltildi:

**Yanlış 1:** *"AVEVA E3D" — tersan formatı*
- Gerçek: tersan PDF Producer alanı **Cadmatic**. AVEVA E3D PAOR'a ait.
- Etki: Eğer 45'te körlemesine "AVEVA E3D" varsayılarak kayıt açılsa, fingerprint asla eşleşmezdi.

**Yanlış 2:** *"`api/izometri-oku.js` sıfırdan, K5/36'da kararlaştırıldı"*
- Gerçek: Dosya zaten var, 985 satır, 28 Nisan 2026 tarihli (38'de K5 uygulanmış). 41-44 arası dokunulmadığı için 44 raporu bu notu stale taşımış.
- Etki: Eğer dosya yedeklenip silinerek sıfırdan yazılsaydı, 38-42'nin (Pre-A.1/A.2/A.4/A.5 + K12 standart) yatırımı kaybolurdu.

**Ders:** Oturum başında plan dokümanlarına güvenmeden DB ve dosya sistemi gerçeği teyit edilmelidir. CIHAT-PROFIL "stratejik soruları ciddiye al" disiplininin uzantısı: **eski rapor güvenilir kaynak değil, gerçek kaynak DB + disk.**

---

## Önemli Öğrenmeler

**1. Migration disiplini iki adımdır.** 018'de Cihat dosyayı GitHub'a upload etti ama Supabase'de çalıştırmayı atladı. Sonraki sorgu hata verdi. Düzeltildi ama 30 dakika kaybedildi. **Kalıcı kural:** önce Supabase, sonra GitHub. Bu kural CLAUDE-SONRAKI-OTURUM.md'ye eklendi.

**2. PDF analizi parser tasarımının kalbidir.** İki PDF örneğini gerçek analizden geçirmeden regex tasarlamak körlemesine olurdu. pdfplumber tablo çıkarımı + pdftotext layout + görsel rasterize üçlüsü temiz veri verdi.

**3. Cihat'ın pragmatik cevapları mimariyi sadeleştirir.** *"tersan başka CAD da kullanıyor olabilir"* + *"diğer tersaneler farklı dosyalar verebilir"* → fingerprint dar olmalı, çoklu kayıt mimarisi (Karar 9). Bu pragmatik anlayış 020 migration tasarımını da yönlendirdi.

**4. Atlamak için disipline ihtiyaç var.** 45'in ilk hedefi parser yazımıydı. Ama 985 satırlık dosyaya körlemesine yama yapmak yerine "yarına bırakalım, izometri-oku.js'i tam okumadan dokunmam" demek doğru karardı. Sonuç: 3 sağlam migration + parser tasarım haritası + 44 hatalarının düzeltilmesi.

**5. `1(2)` gibi belirsiz alanlar opsiyonel kabul edilmeli.** Cihat anlamını bilmiyor → parser zorunlu yapamaz, opsiyonel alır. Eğer ileride anlamı netleşirse parser_kural JSONB'sinde aktif edilir.

**6. Rotation Angle Cadmatic'ta görsel iletim olabilir.** Tablo'da boş, izometri çiziminde yön okları + yeşil çizgiler. Bu yüzden 017 migration'da `rotation_angle` NULL serbest tasarlandı (önceden öngörü vardı, gerçek PDF teyit etti).

---

## Açık Karar/Sorular (46 başında konuşulacak)

1. **`api/izometri-oku.js` 985 satırlık tam içerik.** Cihat sürükle bırak yükleyecek, ben okuyacağım. Hangi fonksiyona, hangi noktaya parser branch'i ekleneceği o zaman kesinleşir.
2. **Imalat işleri (Victaulic Groove vb.) nereye yazılır?** Spool malzemesi değil, talimat. Mevcut `spooller.notlar` mı, yeni `spool_islemleri` tablosu mu? 46'da netleşir.
3. **PAOR'da Erection Material List (cıvata/somun/conta) atlanır mı?** Önerim: evet — bunlar BOM detayı, saha montajı için. Spool imalatına dahil değil. Cihat onaylasın.
4. **PAOR fingerprint'inin "+" karakteri.** Sayfada "PORTUGUESE NAVY AOR+" yazıyor (+ var). DB'deki regex `PORTUGUESE NAVY AOR` (+ yok). Match çalışıyor (kısmi eşleşme) ama açık iyileştirme.

---

## 45 Sonu Durum

✅ 017 — 3D motor schema (sira, rotation_angle, yonelim_kod)
✅ 018 — sistem_preset kolonu + PAOR güncellemesi
✅ 019 — Cadmatic Tersan M110 format kaydı
✅ tersan + PAOR PDF örnek analizi
✅ Parser regex haritası (kafa hazırlığı)
✅ 44 raporu yanlışları tespiti ve düzeltmesi
✅ Migration disiplini formal kural haline geldi
✅ CI yeşil

🔴 **46 ana teması:** Parser branch'i (`api/izometri-oku.js` patch + 020 migration)
🔴 **46 ikinci ana teması:** Pilot test (1 tersan + 1 PAOR PDF parse)
🟡 RLS policy (020+ açık borç)
🟡 016 numaralı flanş cizim_path migration disk'te yok (ileride dökme)

---

> 45 kapanışında yazıldı. Detaylı arşiv. 46 başında okunmaz, sadece geriye dönüp aranır.
