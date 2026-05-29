# Son Durum — 134. Oturum (29 Mayıs 2026)

> 133'ün K2 v1'i **canlı üretim ortamında doğrulandı** (S02 re-parse: dirsek 🟡 + montaj-info, 3/1/1
> birebir). K1+K3 v1 yarısı bitti: `uyarilar.html`'e K2 malzeme uyarıları eklendi (çelişki=uyarı,
> montaj-info=bilgi). v3 İnceleme rozeti 135'e bırakıldı (devre-inceleme.js `_eslesme` taşımıyor,
> kendi eşleştirmesini yapıyor — büyük dokunuş). Bir CI tuzağı mühürlendi: **MK-134.1**. Yeni endpoint
> yok (12/12), MK-49.1 korundu.

---

## Açılış (kısa) — ve bir sürpriz

- Cihat'ın yüklediği 133 ritüel dosyaları "push henüz yok, HEAD f71342d" diyordu; **git ise paketin
  çoktan origin'de olduğunu** gösterdi (`1a7b17c feat(133)` + `382bfaf docs(133)`). Belgeler push
  öncesi snapshot'tı. Task 0 (toplu push) zaten yapılmış — re-do yok, verify ve geç (MK-132.1 ruhu).
- **CI tuzağı yakalandı:** `1a7b17c` (K2 kodu) CI'den **hiç geçmemiş**. Sebep: 133 paketi tek push'ta
  gitti, push HEAD'i `382bfaf docs(133) [skip ci]`. GitHub Actions push'un HEAD commit mesajına bakar
  → `[skip ci]` → **push'un tüm CI'si atlandı, altındaki kod commit'i dahil**. Vercel kanıtı: `1a7b17c`
  deployment'ı yok, sadece `382bfaf` deploy edildi. Kod canlıda (Vercel HEAD ağacını aldı) ama
  lint'ten geçmemişti. → **MK-134.1**.
- Düzeltme: bir .md'ye boş satır eklenip push → `76c983e` CI yeşil (#959), tüm ağaç (K2 dahil)
  lint'ten geçti. Sonra `git pull` ile senkron.

## Yapılanlar (sıra)

### 1. Açılış doğrulama + CI tuzağı (MK-134.1)

- function 12/12, `lib/malzeme-kiyas.js` 225 satır, KARARLAR MK-133×3, PARSER 7.5×6, son-durum 133 → hepsi teyit.
- CI tuzağı teşhis + düzeltme (yukarıda). MK-134.1 mühürlendi.

### 2. Vercel altyapı kurulumu (tek seferlik, gelecek oturumlara kazanım)

- `vercel login` (device auth) + `vercel link` → `cihatoztas-ais-projects/arespipe`.
- `vercel env pull .env.local --environment=production` → prod env yerelde (gitignore'da, güvenli).
- **Bulgu:** `SUPABASE_SERVICE_KEY` Vercel'de **Sensitive** → `env pull` çok-satırlı/tırnaklı yazıyor,
  Node `--env-file` ve script kendi parser'ı okuyamadı (`URL true KEY false`). Çözüm: key Supabase
  Dashboard → Legacy service_role'den alınıp tek seferlik env olarak verildi. Prod proje-ref
  `ochvbepfiatzvyknkvsn` (arespipe-dev = prod DB; doğrulandı, yanlış DB riski yok).

### 3. K2 canlı re-parse doğrulama (BAŞ İŞ — ✅)

- `scripts/re-parse-s02.mjs` (geçici, gitignore): durum→bekliyor → parse_sonuc çek (`_eslesme` çıkar)
  → skipParse POST (`onceden_parse`) → DB'den taze çekip doğrula.
- **skipParse yolağı (kuyruk-isle-izometri 270/301):** `onceden_parse` verilince server indir+izometri-oku
  (Vision client-loop) atlar, ama satır 385'te **eslestir'i koşar** → K2 oradan tetiklenir. PDF'e
  dokunmadan gerçek üretim eşleştirme yolağı çalıştırıldı.
- **Sonuç — fixture birebir tekrar:** POST 200, `lib_versiyon: k2-v3`.
  ```
  eslesen:3 celiski:1 (dirsek) excel_fazla_montaj:1 (flans) malzeme_flag_sayisi:1
  dirsek 323.9: PDF 212.41 kg vs Excel 35.01 kg (~6x) — gercek 🟡
  ```
  MK-132.1 tatmin: bulgu sadece lokal değil, canlı yolakta üretiliyor.
- **Açık (135 borcu):** dirsek sapmasının KÖKÜ ayırt edilmedi (PDF parser / Excel basis / gerçek BOM).
  Tek fixture; 2-3 örnek daha gerek.

### 4. K1+K3 UI v1 — yarısı (uyarilar.html ✅, v3 İnceleme 135'e)

- **İki ayrı yüzey, iki veri yolu doğrulandı:**
  - `uyarilar.html` (492) → `_eslesme`'yi DOĞRUDAN okur → `malzeme_flag` + `malzeme_kiyas` elinde.
  - `devre_wizard_v3` İnceleme (746) → `/api/devre-inceleme` dönüşü; endpoint `_eslesme`'yi KULLANMIYOR,
    `izometrileriDerle` kendi eşleştirmesini sıfırdan yapıyor (satır 12: "eslestir ile birebir aynı
    anahtar"). `malzeme_kiyas` çıktıya hiç girmiyor.
- **Karar:** kolay yarı (uyarilar.html, API'siz) bu oturum; zor yarı (devre-inceleme.js'e malzeme_kiyas
  taşıma + popup) 135'e.
- **Patch (uyarilar.html, +56/-2):** `bindirme` bloğunun paraleli — `malzeme_flag_sayisi > 0` →
  `celiski[]` = uyari (🟡, 🔧), `excel_fazla_montaj[]` = bilgi (ℹ, 🔩). Soft sapma GÖSTERİLMEZ
  (134 karar 1). Yardımcılar: `MLZ_ALAN_AD`, `MLZ_PT_AD`, `_mlzFmt`. Idempotent (BND_+MLZ_ filtresi).
  excel_guven='otorite' → "PDF Excel'den sapıyor" dili.
- Atomik Python patch ile uygulandı; JS parse OK; commit `5e9b0ec` (CI tetikler, `[skip ci]` YOK — MK-134.1).

## CI Son Durum

- HEAD push'tan sonra `5e9b0ec feat(134)` (uyarilar.html). CI: kod commit'i → **yeşil beklenir**.
- Doc'lar (bu üçlü + PARSER + KARARLAR) AYRI push, `[skip ci]` — MK-134.1 gereği koddan SONRA.
- function 12/12 (sabit).

## Commit'ler

| Hash | Mesaj | Tür |
|---|---|---|
| `53815bb` | chore(134): .gitignore — vercel env + geçici script `[skip ci]` | doc |
| `5e9b0ec` | feat(134): uyarilar.html K2 malzeme uyarıları (MK-133.1/2/3) | **kod (CI)** |
| (sonra) | docs(134): PARSER 7.5/7.6 + üçlü + MK-134.1 `[skip ci]` | doc |

## 135'e Açık Borç (önceliğe göre)

1. **v3 İnceleme rozeti (K1+K3 zor yarı):** `api/devre-inceleme.js` `izometrileriDerle`'ye malzeme_kiyas
   taşıma (ya lib'i orada koş — spool_malzemeleri fetch gerekir — ya `_eslesme`'den oku) + v3 izoCell
   🟡 rozet + düzelt popup (celiski + montaj-info dökümü). Yeni endpoint YOK (12/12).
2. **Dirsek bulgusu kök tespiti:** PDF parser dirsek ağırlık çıkarımı vs Excel BOM basis. 2-3 devre örneği.
3. **`excel_guven` otomatik türetme (MK-133.1 backlog):** format paketinden/parser_kural'dan; şimdilik sabit 'otorite'.
4. **Pipeline doğrulama (Bölüm 4.4-1):** POAR header pipeline × dosyaAdiParse (L2/text-PDF server-side).
5. **Taşınanlar:** "Montaj Resmi" emekli format temizliği, K5 function konsolidasyon, 117 (`yukleyen_id`),
   web-spool sync, fitting (DIN 86087/ASME B16.9), `spool_dokumanlari` bağ tablosu, dirsek bin-packing v2.

---

> 135 açılışında: bu dosya + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` + PARSER Bölüm 7.5/7.6
> + KARARLAR MK-134.1 okunur. **İlk iş: doc-push CI yeşil teyidi (kod zaten geçti), sonra v3 İnceleme rozeti.**
