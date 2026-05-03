# CLAUDE.md — Eski Oturum Özetleri (Arşiv)

> ⚠️ ARŞİV — DONDURULDU
>
> Bu dosya 56. oturumda `CLAUDE.md`'den taşındı (MK-53.3 disiplini gereği).
> 17. oturum (1 Nisan 2026) ila 22. oturum (23 Nisan 2026) arası eski oturum özetleri.
> Tarihsel referans için tutuluyor — Claude güncel bilgi kaynağı olarak okumaz.
>
> Karar günlüğü için: `docs/KARARLAR.md`
> Güncel oturum özeti için: `BRIEFING.md`

---

## 11. SON OTURUM — 23 NİSAN 2026 (22. OTURUM — KAPATILDI ✅)

### Bu oturumda tamamlananlar

**Ana tema:** Faz A Faz 2 tamamlanması — `tanimlar.html`'e **Malzeme Havuzu sekmesi** eklendi. Firma bazında kalite ekleme/düzenleme/silme UI'ı canlıya alındı. E-06 master tablo altyapısı artık yazma (20. oturum), okuma (20-21. oturum), UI yönetimi (22. oturum) olarak tam tur çalışıyor.

**Akış:**
1. **Ritüel + teyit + karar:** `tanimlar.html` incelendi, sayfa-seviyesinde auth zaten `['yonetici','firma_admin','super_admin']` ile korunuyor. Sekmeye ek rol-check gereksiz. `ares-normalize.js` eksikliği tespit edildi (21. oturumda atlanmış 3. sayfa).
2. **Mockup (R-10):** İki seçenek görsel olarak karşılaştırıldı (alt-tab vs stacked). Seçenek A (alt-tab) onaylandı.
3. **Faz 1 — Mockup HTML/CSS:** 5 patch yerine doğrudan dosya güncellemesiyle uygulandı (patches pasted approach'tan direct-file approach'a geçildi). 772 → 976 satır.
4. **Tasarım tercihleri:** Açıklama sütunu tabloda ellipsis ile kalır; ekleme UI'ı inline expanding form (blok-yeni-form patterni).
5. **Faz 2 — Gerçek Supabase CRUD:** `_mockSistemData` kaldırıldı, `sistemKaliteYukle()` + `firmaKaliteYukle()` master tablodan okuyor; `kaliteKaydet()` insert/update (UNIQUE `23505` özel toast, sistem preset çakışma onay popup'ı, çift tıklama kilidi); `kaliteDuzenleAc(id)` form'u pre-filled açıyor; `kaliteSil(id)` FK violation ön-kontrolü (`spool_malzemeleri` + `pipeline_malzemeleri` count:'exact', head:true) sonrası onay + delete. 976 → 1145 satır.
6. **Sistem preset genişletme sohbeti:** "Gereksiz yük mü?" sorusuna "tahmin riski > yük" cevabıyla metodoloji açıklandı (SQL migration yolu, Dashboard Insert, gelecek süper-admin UI). Karar: 12 preset yeterli, veri biriktikçe terfi.
7. **SQL — Trigger Guard 1 gevşetmesi:** `malzeme_ref_bul()` fonksiyonundan Guard 1 kaldırıldı, Guard 2 tek koruma hattı olarak kaldı. Migration dosyası yazıldı, canlıda çalıştırıldı, dönen fonksiyon tanımı teyitlendi.
8. **Yan bug 1 — M3_RENK:** spool_detay.html'de 3D model renk haritasının key'leri eski TR label'dan canonical kategori koduna çevrildi (`'karbon'`, `'paslanmaz'`, `'bakir'`, `'alum'`, `'diger'`). `m3Mat()` ve selectedMesh sıfırlama noktalarında `ARES_NORM.malzemeKod()` normalize çağrısı eklendi.
9. **Yan bug 2 — devre_detay.html duplicate `<td>`:** Satır 1609 `</tr>';` ile kapandığı için 1610-1611'deki `+'<td>...'` blokları JS tarafından zaten atılıyordu (ölü kod). Temizlendi.
10. **Bonus — `kaliteleriDoldur()` master tablodan oku:** spool_detay.html'deki autocomplete datalist fonksiyonu `spool_malzemeleri.kalite` geçmişini BOZUK filtreleyerek işliyordu. `malzeme_tanimlari` (sistem preset + tenant özeli) canonical `kalite_goster` okuyacak şekilde refactor edildi. 3225 → 3217 satır.

### Değişen Dosyalar

| Dosya | Değişiklik | Satır değişimi |
|---|---|---|
| `tanimlar.html` | 5 patch: script sırası + sub-tab CSS + sekme butonu + panel HTML + CRUD JS | 772 → 1145 |
| `spool_detay.html` | M3_RENK 4 nokta (map + m3Mat + selectedMesh + default) + kaliteleriDoldur master | 3225 → 3217 |
| `devre_detay.html` | Duplicate `<td>` ölü kod temizliği | 2052 → 2051 |
| `22-oturum-trigger-guard-gevsetme.sql` | Yeni migration dosyası | +95 satır |
| `CLAUDE.md` | Üst bilgi + Bölüm 10 (7 madde güncelleme) + Bölüm 11/11A restrukture | — |

### Yeni `tanimlar.html > Malzeme Havuzu` Yapısı

**Sekme kapsamı:** Tanımlar sayfası içinde 3. sekme (Yetki Blokları / Kod Serileri / **🧪 Malzeme Havuzu**).

**Alt-tab yapısı:**
- **Sistem Kaliteleri (12):** Read-only, `tenant_id IS NULL`, mor `cl-leg` şerit. 4 kolon: Kategori · Kod · Gösterim · Standart.
- **Firma Kaliteleri (N):** CRUD, `tenant_id = ARES.tenantId()`, mavi `cl-ac` şerit. 6 kolon: Kategori · Kod · Gösterim · Standart · Açıklama · [✎ ✕].

**Inline ekleme formu (`kaliteYeniForm`):**
- Kategori select (5 canonical: karbon/paslanmaz/bakir/alum/diger)
- Kalite Kodu input (JS tarafı `_kaliteKodNormalize()` ile upcase + alphanumeric)
- Gösterim input (canonical display, örn. "St 37", "316L", "CuNi 90/10")
- Standart input (opsiyonel, DIN/ASTM/EN vs.)
- Açıklama TR input (opsiyonel)
- Kaydet (tek buton — insert veya update, `_kaliteDuzenleId` state'ine göre) + İptal

**Silme akışı:**
1. FK violation ön-kontrol: `spool_malzemeleri` + `pipeline_malzemeleri` count sorgusu
2. Kullanılıyorsa toast: "X · Y kayıtta kullanılıyor, silinemez"
3. Kullanılmıyorsa native `confirm()` → DELETE

**Çift tıklama kilidi:** `_kaliteKaydetKilit` boolean, save fonksiyonu başında true, sonunda false.

**Sistem preset çakışma uyarısı:** Kullanıcı kategori+kod kombinasyonu sistem preset'te varsa (ve yeni ekleme modundaysa) onay popup'ı: "Bu kod sistem kalitelerinde de var. Yine de firmaya özel eklemek istiyor musunuz?"

### RLS Policy'leri canlı doğrulandı

19. oturumda yazılan 4 policy (SELECT/INSERT/UPDATE/DELETE) 22. oturumun INSERT/UPDATE/DELETE operasyonlarıyla test edildi. Sorun tespit edilmedi (detaylı regresyon testi Faz C 27. oturumda yapılacak).

### 23. oturuma aktarılanlar

- **🟢 Faz B ana tema:** CLAUDE.md'yi böl, 7 lint script, CI/CD entegrasyonu, şablonlar. Detay: `CLAUDE-SONRAKI-OTURUM.md` + `docs/ROADMAP.md`.
- **🟡 Faz A Faz 3 (25. oturum):** `devre_yeni.html` ve `spool_detay.html` form refactor — autocomplete dropdown (master + geçmiş birleşik). 22. oturumda `kaliteleriDoldur()` sadece master'dan okuyor, 25. oturumda geçmiş kayıt önerisi eklenecek.
- **🟡 Faz A Faz 4 (26. oturum):** IFS fuzzy match — `kalite_kod_normalize()` regex genişletmesi + `ifs_material_alias` tablosu.
- **🟢 Yeni sistem preset eklenmesi:** Yöntem dokümante edildi (SQL migration dosyası + Supabase SQL editor), gerektiğinde yapılır. Örnek template: `22-oturum-trigger-guard-gevsetme.sql` patterniyle yazılır.

### Deploy Sırası (Tavsiye Edilen)

1. `tanimlar.html` → Vercel push → Malzeme Havuzu sekme testi (7 senaryo: ilk yükleme, boş firma, ekleme, UNIQUE çakışma, sistem preset uyarısı, düzenleme, silme kullanılan+kullanılmayan)
2. `spool_detay.html` → push → 3D model renk testi (parçalar doğru renkte, tıklama/bırakma renk döngüsü çalışıyor)
3. `devre_detay.html` → push → pipeline BOM tablosu (kozmetik fark yok, sadece ölü kod temizliği)
4. `22-oturum-trigger-guard-gevsetme.sql` → Supabase SQL editor'de çalıştır (yukarıdaki testler başarılı olduktan sonra)
5. CLAUDE.md + oturum kapanış dosyaları commit

### Öğrenilenler

1. **Mockup-first (R-10) + görsel karşılaştırma** değerli. Kullanıcı "sen bunları görsel olarak verir misin" dediğinde, inline SVG/HTML preview (visualizer widget) karar hızını dramatik artırdı — metin tarifinden yapılacak kararı görsel karşılaştırmaya çevirmek R-10'un doğal tamamlayıcısı.
2. **Patches vs direct-file update.** 5-patch yaklaşımı teoride elegant, pratikte kullanıcı için yavaş ("sen dosyayı iste vereyim sen güncelle bu şekilde uzun sürer"). 100+ satırlık değişikliklerde direct-file update + present_files her zaman daha verimli.
3. **Preset listesi genişletmede tahmin riski > yük riski.** Sistem preset'e 20+ kalite eklemek performans sorunu yaratmaz ama benim sektörel tahminlerim firmanın günlük iş karışımına uymayabilir. Veri biriktikçe karar vermek daha sağlam (23. oturum sonrası metrik toplama önerisi).
4. **Sayfa-seviyesi auth vs sekme-seviyesi auth.** Kullanıcı "yönetici girsin" dediğinde, `tanimlar.html` zaten sayfa-seviyesinde `['yonetici','firma_admin','super_admin']` koruyordu. Sekme-seviyesi ek kontrol gereksiz karmaşa olurdu. **Yeni sayfa kontrol listesine ekle:** auth zaten sayfa seviyesinde var mı diye kontrol et.
5. **`ares-normalize.js` yüklenme ihmali — 3. sayfa.** 21. oturumda `admin/` ve `portal/` alt-dizinlerinde ihmal yakalanmıştı; 22. oturumda `tanimlar.html` ana dizinde olmasına rağmen yüklenmediği farkedildi. Script yükleme eksikliği sessiz bir bug — fallback devrede çalışıyor, ama canonical için şart. CLAUDE.md Bölüm 2.18 yeni sayfa kontrol listesinde zaten vardı; tüm mevcut sayfaların da bir kez grep'lenmesi mantıklı.
6. **Guard 1 vs Guard 2 — gevşetme riski.** Guard 1 çıkarılınca "admin yanlışlıkla kategori yazar" gibi edge case'ler Guard 2'ye düşüyor. Guard 2 tanımıyorsa NULL dönüyor, malzeme_ref_id NULL kalıyor — veri yok olmuyor, sadece ilişki kopuk. Kabul edilebilir davranış. SQL'de açıklayıcı yorum bırakıldı (neden kaldırıldığını sonraki okuyucu anlasın).

---

## 11A. ÖNCEKİ OTURUM — 22 NİSAN 2026 (21. OTURUM — KAPATILDI ✅)

### Bu oturumda tamamlananlar

**Ana tema:** Sistem çapında render standardizasyonu. Kural G-03 formalleştirildi. 20. oturumda keşfedilen "UI'da ham `karbon` gözüküyor" teknik borcu tamamen kapatıldı.

**Akış:**
1. **Ritüel + grep** — `ares-normalize.js` helper imzaları teyit edildi, 3 grep komutu (malzeme/kalite/yüzey) + Excel/PDF export taraması çalıştırıldı, master harita çıkarıldı.
2. **"Dokunma" listesi netleşti** — matBadge, `_malzemeGoster`, state map'leri, AI prompt'ları, arama filtre string'leri, dropdown value'ları, inlineEdit arg'ları.
3. **11 HTML dosyasında ~30 render noktası fix'lendi** (güvenli fallback pattern ile — `ARES_NORM.malzemeEtiket()` / `kaliteGoster()` / `yuzeyEtiket()`).
4. **`admin/index.html` ve `portal/index.html`'de `ares-normalize.js` yüklemesi eklendi** (eksikti — fallback devreye girdiği için eski görünüm çalışıyordu, ama canonical için script şart).
5. **G-03 kuralı Bölüm 2.18'e bağımsız bölüm olarak yazıldı** — temel kural + güvenli fallback pattern + kapsam tablosu + istisna listesi + mevcut helper'lar + yeni sayfa kontrol listesi + 21. oturum fix referansı + anti-pattern'ler.

### Değişen Dosyalar

| Dosya | Noktalar | Açıklama |
|---|---|---|
| `spool_detay.html` | 2253, 2309, 3065-3066 | `kmMalzInfo` (Kesim Ekle popup), `bmMalzInfo` (Büküm Ekle popup), 3D M3 popup |
| `devre_detay.html` | 1576, 1601, 1948, 1954 | Excel BOM satırı, pipeline BOM `<td>`, Excel SPOOLS (3 alan), PDF önizleme (2 alan) |
| `devre_yeni.html` | 1272 | IFS önizleme tablosu kalite sütunu |
| `bukum.html` | 799, 899 | QR etiket header, tablo `<td>` kalite |
| `kesim.html` | 1852, 2033, 2383, 2536, 2950, 2995, 3234, 3457, 3559 | Tekil liste, özet, kld meta, kld row, iki confirm dialog, PDF head, PDF detay tablosu, onay modal |
| `markalama.html` | 621, 800, 806, 839, 1028, 1207, 1286 | malzInfoHtml, plaka/otomatik parts, manuel modal, ml inline, arc inline, Excel satır |
| `izometri-batch.html` | 435, 436, 440, 452 (Excel block) | HTML tablo 3 alan + Excel satır 3 alan |
| `is_baslat.html` | 1077, 1078 | Mobil chip malzeme + kalite |
| `admin/index.html` | 364 + script | Özet tablo malzeme + `ares-normalize.js` yükleme |
| `portal/index.html` | 367 + script | Özet tablo malzeme + `ares-normalize.js` yükleme |
| `devreler.html` | 2079, 2110 | Pipeline BOM state=2 ve state=kırmızı satırları |
| `CLAUDE.md` | — | Bölüm 2.18 G-03 kuralı + Bölüm 10 güncelleme + Bölüm 11/11A |

### Güvenli Fallback Pattern (21. oturumun imzası)

```js
esc(
  (typeof ARES_NORM!=='undefined' && ARES_NORM.malzemeEtiket)
    ? (ARES_NORM.malzemeEtiket(x.malzeme) || x.malzeme || '—')
    : (x.malzeme || '—')
)
```

Bu pattern her render noktasında **inline** uygulandı. Neden wrapper fonksiyon yerine inline seçildi:
1. `typeof ARES_NORM` kontrolü ARES_NORM yüklenmemiş sayfalarda (admin/portal eskisi gibi) güvenli düşüş
2. `|| x.malzeme || '—'` bilinmeyen kategori kodlarında ham değeri gösterir (`malzemeEtiket('xyz')` → `'xyz'` zaten döner, belt-and-suspenders)
3. Wrapper yerine inline → her dosyanın bağımsız kalması (CLAUDE.md 2.18'deki standarda uyum)

### Dokunulmayan yerler (teyit edildi — standarda uygun)

- `matBadge(m)` — `bukum.html:464`, `kesim.html:994`, `markalama.html:595` → zaten `ARES_NORM.tvMalzeme` kullanıyor
- `_malzemeGoster` / `_yuzeyGoster` — `spool_detay.html:1206/1210`, `devre_detay.html:877/887` → `ARES_NORM.malzemeEtiket/yuzeyEtiket` wrap
- `devreler.html:1768-1797` inline matBadge + yuzeyBadge + sapma tooltip → `ARES_NORM.tvMalzeme/tvYuzey` ile zaten lokalize
- **State map'leri** (`{malzeme: x.malzeme || '—'}`) → DB-facing ham değer, trigger canonicalize edecek
- **Arama filtre string'leri** (`[a,b,c].join(' ').toLowerCase()`) → kullanıcıya gösterilmez
- **AI chatbot prompt'ları** (`spool_detay.html:1590-1592`) → LLM'e gönderilir, kullanıcıya değil
- **De-dup hash** (`devre_detay.html:1546`) → kullanıcıya gösterilmez
- **Dropdown value'ları** (`<option value="karbon">Karbon Çelik</option>`) → value ham (DB yazımı), text lokalize (zaten lokalize)
- **inlineEdit arg'ları** (`devre_detay.html:1196`) → `currentValue` ham kalmalı (düzenleme için)

### 22. oturuma aktarılan yan bug'lar (21. oturumda keşfedildi)

1. **`spool_detay.html` M3_RENK haritası eski TR key'ler** (satır 2657-2665). 3D model renk haritasında `'Karbon Çelik'`, `'Paslanmaz Çelik'` gibi Türkçe label key'ler kullanılıyor. Gerçek data canonical kod (`'karbon'`, `'paslanmaz'`) olduğu için `M3_RENK['karbon']` lookup başarısız, `_default` rengine düşüyor. Fix: key'leri kategori koduna çevir (`'karbon': 0x7a7d82, 'paslanmaz': 0xb0b8c1, ...`). Tek yer, ~5 dk.

2. **`devre_detay.html:1609-1611` duplicate `<td>` satırı.** Pipeline BOM tablosunda `<td>sertifikali</td>` ve `<td>silme butonu</td>` iki kez yazılmış. Bir render bug değil, fazladan kolon üretiyor. ~2 dk.

### Deploy Durumu

21. oturum sonu: 11 HTML + CLAUDE.md düzenlenip canlıya deploy edilecek.

Deploy sonrası canlı test matrisi (CLAUDE-SONRAKI-OTURUM.md'den devralındı):

| # | Sayfa | Test | Beklenen |
|---|---|---|---|
| 1 | spool_detay | Büküm Ekle popup'ta malzeme seç | `Karbon Çelik — St 37 — 219,1 mm` |
| 2 | spool_detay | Kesim Ekle popup'ta malzeme seç | Aynı |
| 3 | spool_detay | 3D model parça tıkla → popup | `Karbon Çelik` (ham değil) |
| 4 | kesim.html | Liste kalite sütunu | `St 37` |
| 5 | kesim.html | Kesim Planı PDF head | `Karbon Çelik St 37 Ø...` |
| 6 | bukum.html | QR etiket + tablo | `Karbon Çelik St 37` |
| 7 | markalama.html | Alt satır chip | `St 37` (ham `ST37` değil) |
| 8 | izometri-batch | Tablo + Excel | 3 kolon lokalize |
| 9 | is_baslat | Mobil chip | `Karbon Çelik`, `St 37` |
| 10 | admin özet + portal özet | Tablo | `Karbon Çelik` (ham `karbon` değil) |
| 11 | devreler | Pipeline BOM | Malzeme kolonu lokalize |
| 12 | devre_detay Excel export | İndir + aç | Tüm kolonlar canonical |

### Öğrenilenler

1. **Sistematik grep master tablo kuralı:** Yeni bir helper çıkınca tüm render noktalarını grep'le süpür. 19. oturumda `kaliteGoster()` eklendi ama `devre_detay.html` 4 noktası gözden kaçtı (20. oturumda fix). 20. oturumda da keşfedilen ham `karbon` sorunu 11 farklı dosyaya yayılmıştı. G-03 kuralının formal kontrol listesi bu sürüklemeyi engelleyecek.

2. **Güvenli fallback > wrapper.** Her dosyaya `kgLoc()` gibi helper eklemek yerine inline `typeof ARES_NORM!=='undefined'` check'i — ARES_NORM yüklenmemiş sayfa gibi edge case'leri otomatik karşılar (admin/portal bunu kanıtladı). Wrapper helper sadece tek dosyada 3+ kez tekrar ediyorsa değer katar.

3. **`ARES_NORM.malzemeEtiket(bilinmeyen)` zaten ham döner** — belt-and-suspenders için ek `|| x.malzeme` koymak zararsız ama çoğu durumda çift koruma. Ancak `kaliteGoster('')` boş string dönerken `malzemeEtiket('')` `'—'` döner — bu asimetri fallback zinciri için kritik (kalite'de `|| '—'` olmadan boş satır çıkar).

4. **Alt-dizin sayfaları script ihmali.** `admin/` ve `portal/` altındaki HTML'ler relative path (`../ares-normalize.js`) ile yüklemeli. 21. oturumda keşfedildi — sessizce fallback'te çalışıyorlardı.

5. **Dokunulmaz listesi fix listesi kadar önemli.** Arama filtre string'leri, AI prompt'ları, state map'leri, dropdown value'ları lokalize ETMEMEK gerekir — aksi halde DB yazım / arama / model davranışı bozulur. G-03 bu istisnaları açıkça sayıyor.

6. **Deploy-test-kapanış protokolü.** Her oturum `CLAUDE.md son güncelleme` + `Bölüm 10 bekleyenler` + `Bölüm 11 son oturum` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` beşlisi. Bu disiplin 21 oturumdur hayatta tutuyor bu projeyi.

---

## 11A1. ÖNCEKİ OTURUM — 22 NİSAN 2026 (20. OTURUM — KAPATILDI ✅)

### Bu oturumda tamamlananlar

**Ana tema:** 19. oturum canlı test + IFS import kök neden fix + `devre_detay.html` render E-06 tamamlaması + DB temizlik + canlı re-import başarısı

**Akış:**
1. **Deploy teyidi** — `ARES_NORM.kaliteGoster('CUNI9010') → 'CuNi 90/10'` ✅, DB 12 preset ✅
2. **Canlı test** — kullanıcı `devre_detay.html` IFS Excel yükledi, `Kalite = karbon` bozuk gösterim
3. **DB teşhis** — `spool_malzemeleri`: 42 kayıt, 0 bağlı, hepsi `malzeme=karbon, kalite=karbon` (trigger Guard 1 doğru çalışmış, master'a sahte kayıt yok ✅)
4. **IFS Excel analizi** — `Material` kolonu = ST37 (kalite kodu, kategori değil); HAM değer kayboluyordu
5. **Kök neden tespiti** — `devre_yeni.html:644` `normalizeMalzeme()` prematüre normalize
6. **Fix paketi**:
   - `devre_yeni.html`: satır 644 → `String(row[idx.mat]||'').trim()` (ham sakla)
   - `devre_detay.html`: 4 render noktası → `ARES_NORM.kaliteGoster()` (1195, 1563, 1576, 1602)
7. **DB temizlik** — 42 malzeme + 8 spool + log + 1 devre kademeli silindi (FK CASCADE eksikliği nedeniyle transaction + islem_log eklemesi)
8. **Canlı re-import testi** — Aynı IFS yüklendi, SELECT teyidi: `malzeme='karbon', kalite='St 37', bagli=true, kalite_goster='St 37', standart='DIN 17100', kayit=42` ✅

### Değişen Dosyalar

| Dosya | Öncesi | Sonrası | Değişiklik |
|---|---:|---:|---|
| `devre_yeni.html` | 2298 | 2301 | Satır 644 `normalizeMalzeme()` kaldırıldı, ham sakla (+3 yorum satırı) |
| `devre_detay.html` | 2041 | 2041 | E-06 render fix — 4 inline değişiklik |
| `CLAUDE.md` | — | — | E-06 Historical Timeline + IFS import altın kuralı + anti-pattern + G-03 render kuralı adayı |

### Hazır SQL Paketleri (Arşiv)
- `20-oturum-db-temizlik.sql` — 42 bozuk kayıt temizliği (kademeli + islem_log dahil)
- `20-oturum-trigger-guard-gevsetme.sql` — Guard 1 opsiyonel kaldırılması (ertelendi)

### Yeni Teknik Borç (21. oturuma aktarıldı)

**UI'da ham kategori kodu gösteriliyor.** Kullanıcı `spool_detay.html > Büküm Ekle` popup'ında fark etti:
```
Pipe Seamless Steel Tube - 3.1 Certificate — St 37 — 219,1 mm   ← doğru
karbon — St 37 — 219,1 mm                                        ← ham kod!
```

`ARES_NORM.malzemeEtiket('karbon') → 'Karbon Çelik'` çağrısı eksik. Muhtemelen sistem çapında yayılmış (spool_detay, kesim, bukum, markalama, portal, admin, izometri-batch, raporlar...).

**Kullanıcı talebi:** *"Başka bir yerde hatalı gösterim görmek istemiyorum — tam olarak standartlaştıralım."* → 21. oturum ANA TEMA: sistem çapında render süpürmesi + G-03 kural formalleşmesi.

### Deploy Durumu ✅

| Dosya | Durum |
|---|---|
| `devre_yeni.html` | ✅ Canlıda |
| `devre_detay.html` | ✅ Canlıda |
| DB temizlik + re-import | ✅ Doğrulandı |

### Öğrenilenler

1. **Idempotent değil sessiz veri kayıpçı.** `normalizeMalzeme('ST37')→'karbon'` ilk çağrı sağlıksızdır. Saklayan fonksiyon HAM tutmalı, normalize **kullanım anında**.

2. **Yeni ARES_NORM helper → grep tüm render'ı.** `kaliteGoster()` 19. oturumda eklendi, 4 render noktası unutulmuştu. `malzemeEtiket()` için aynı grep 21. oturum işi. Ders: yeni helper ekle → `grep` → tüm gösterim noktalarını dolaş.

3. **FK CASCADE olmayan DB = kademeli silme.** `devreler → spooller → spool_malzemeleri + islem_log` zincirinde CASCADE yok. `islem_log.devre_id` ve `islem_log.spool_id` FK'ları kolayca unutulur. Transaction (`BEGIN...COMMIT`) atomik güvence sağlar.

4. **Trigger Guard'ı UX'e zarar verebilir.** Guard 1 (`kalite = malzeme`) meşru `ST37=ST37` senaryosunu reddeder. Guard 2 (`kalite_kod_normalize NULL`) zaten yeterli. 20. oturum kod fix'i ile Guard 1 tetiklenmiyor, SQL gevşetme opsiyonel.

5. **Deploy-test-Faz2 sırası bozulamaz.** Gündem Faz 2 olarak geldi, ama canlı test bozuk çıktı → fix öne alındı. Faz 2 artık 22. oturuma (21. oturum render süpürmesi).

6. **Bug izinde tersten oku.** Kök sıklıkla prematüre normalize'dadır.

7. **_malzemeTipi() doğru tasarlanmış, sadece girdisi bozuk geliyordu.** Mevcut kodun niyetini oku, doğru tasarlanmış olabilir.

---

## 11A2. ÖNCEKİ OTURUM — 22 NİSAN 2026 (19. OTURUM)

### Bu oturumda tamamlananlar

**Ana tema:** Faz 1 Malzeme Master Tablo altyapısı — `malzeme_tanimlari` + FK + DB trigger + guard'lar + 12 sistem preset seed

**1. `malzeme_tanimlari` master tablo — DB şema tamamlama ✅**
- Tablo zaten vardı (önceki yarım çalışmadan, koda bağlı değildi), %90 şema uyumluydu
- Eklenen kolonlar: `kalite_goster text` (UI gösterimi: "St 37", "CuNi 90/10"), `standart text` (DIN 17100, ASME SA-106)
- FK kolonları zaten vardı: `spool_malzemeleri.malzeme_ref_id`, `pipeline_malzemeleri.malzeme_ref_id`
- `spooller` tablosuna FK **eklenmedi** — spool'un birden fazla malzemesi olabilir, text kolonlar denormalize özet kalır
- `spooller.kalite_standart` DROP edildi (567 kayıttan 0 kullanım, ölü kolon)

**2. RLS (4 policy) + CHECK + Partial Unique Index ✅**
- SELECT: sistem preset + kendi tenant
- INSERT/UPDATE/DELETE: sadece kendi tenant (sistem preset dokunulamaz)
- CHECK `check_sistem_preset_tenant`: `sistem_preset=true ⟹ tenant_id IS NULL`
- Partial unique `malzeme_tanimlari_preset_unique_idx ON (kategori_kod, kalite_kod) WHERE tenant_id IS NULL`

**3. 12 Sistem Preset ✅**
- karbon: `ST37`, `S235JR`, `A106B`, `A53`
- paslanmaz: `316L`, `304L`, `316`, `304`, `14571`, `A312TP316L`
- bakir: `CUNI9010` · alum: `6061T6`

**4. DB Fonksiyonları + Trigger'lar ✅**
- `kategori_kod_normalize(text)`, `kalite_kod_normalize(text)`, `malzeme_ref_bul(uuid, text, text)`
- Guard 1: `kalite = malzeme` → NULL (bozuk kayıt şüphesi) — 20. oturumda false-positive ürettiği keşfedildi, gevşetme SQL'i hazır
- Guard 2: `kalite_kod_normalize NULL` → NULL (kategori adı veya bilinmeyen)
- Trigger'lar: `tg_spool_malzemeleri_ref_sync`, `tg_pipeline_malzemeleri_ref_sync` (BEFORE INSERT OR UPDATE)

**5. Trigger Test (4/4 temiz) ✅**
- Test verisi kaybı: tüm `spool_malzemeleri` + `pipeline_malzemeleri` boşaldı (test verisiydi, migration gereksiz kaldı)

**6. JS Tarafı (`ares-normalize.js`) ✅**
- `kaliteKod(raw)` — DB `kalite_kod_normalize()` eşi
- `kaliteGoster(kodOrRaw)` — master `kalite_goster` eşi

**7. 18. Oturum Gerçeklik Kontrolü ✅**
- CLAUDE-SON-OTURUM.md 18. oturum raporu 3 fix'i "yapıldı" diyordu, zip'te yoktular (commit eksik kalmış). Bu aslında 19. oturuma temiz başlangıç verdi — yarım çözüm kalıntısı yok.

### Deploy Durumu (19. oturumdan 20. oturuma)

| Dosya | Durum |
|---|---|
| `ares-normalize.js` | ✅ Deploy edildi (20. oturum `kaliteGoster('CUNI9010')` console test teyit etti) |
| `api/sorgula.js` | ✅ Deploy |
| `devre_detay.html` | ✅ Deploy |
| `spool_detay.html` | ✅ Deploy |
| `CLAUDE.md` | ✅ E-06 yenilenmiş |
| DB altyapı (tablo + trigger + preset) | ✅ Canlıda |

### 19. Oturumdan Devralınan Teknik Borç (20. oturumda çözüldü)
- **IFS import canlı testi başarısız** → `devre_yeni.html:644` prematüre normalize → 20. oturumda tek satır fix
- **`devre_detay.html` render'da E-06 eksik** → 4 nokta `ARES_NORM.kaliteGoster()` çağırmıyordu → 20. oturumda tamamlandı

---

## 11B. ÖNCEKİ OTURUM — 20 NİSAN 2026 (12. OTURUM)

### Bu oturumda tamamlananlar

**Ana tema:** DEVRE.gemi rename, notlar persistence, basamak_tanimlari multilang, Öncelik 4 araştırma

**1. Öncelik 5+11 — DEVRE.gemi → DEVRE.projeNo ✅**
- `devre_detay.html`: 14 patch (init, migration bloğu, document.title, breadcrumb, marka ×2, goSpool, etiket ×3, PDF ×2)
- `devreler.html`: 14 patch (obje tanımı, sort header, 11× d.gemi)
- `devre_detay.html` migration bloğu kaldırıldı (artık gereksiz)
- `ares-store.js`: değişiklik yok (sadece DB kolon adları içeriyor)

**2. Öncelik 13 — notlar persistence ✅**
- DB: `notlar.devre_id UUID` eklendi; `devreler.notlar TEXT` DROP edildi (0 kayıt)
- Kod: `notYukle()` + async `notEkle()` + async `notSil()` — Supabase'e yazıyor

**3. Öncelik 14 — basamak_tanimlari multilang ✅**
- DB: `gorunen_ad_en/ar` kolonları + 12 sistem_adi için çeviriler
- Kod: `STAGES_DATA`, `_rebuildStages()`, güncellenen `_basamaklariYukle()`, `_onLangChange`

**4. Öncelik 4 — Denormalizasyon araştırması → KAPATILDI ✅**
- `spooller.malzeme` = spool kategori özeti; `spool_malzemeleri.malzeme` = BOM kalemi
- "Çelişki" aslında teknik gerçeklik (alüm spool'da karbon flanş)
- Yapılacak iş yok

**5. devreler.html temizlik ✅**
- `Plastik/PE` → MALZEME_PATTERNS'ten kaldırıldı
- `Ham` → YUZEY_PATTERNS'ten kaldırıldı
- Duplicate Siyah option silindi

### Deploy Durumu

| Dosya | Durum |
|---|---|
| `devre_detay.html` | **Deploy bekliyor** |
| `devreler.html` | **Deploy bekliyor** |
| `spool_detay.html` | **Deploy bekliyor** |
| DB değişiklikleri | ✅ Canlıda |

---

## 11. ÖNCEKİ OTURUM — 22 NİSAN 2026 (16-17. OTURUM)

**Ana tema:** kesim.html tam refactor + wizard UX + spool_detay/devre_detay bug fix

**Yapılanlar:**
- `kesim_plani JSONB`, `boru_ids JSONB`, `kriter JSONB`, `kesim_listesi_id UUID` kolonları eklendi
- **Wizard Modal** (tek popup, 3 adım): klDetayModal + formModal + sonucModal → `wizardModal`
  - Adım 1: Boru listesi + seçim + kesildi kaydet
  - Adım 2: Kesim parametreleri + parça borular
  - Adım 3: V3 kart planı + Excel/PDF
- **V3 kart tasarımı**: `_renderV3()` — istatistik grid + stok başına kart (çizgi şema + iç tablo)
- **PDF**: v3 formatında, SVG çizgi şema, firma logo + footer
- **Liste kaybolma bugı**: `kesim_plani` kolonu eksikti → fallback SELECT eklendi
- **Sıralama**: `unshift` ile yeni liste başa, ISO date sort kesilen listeler
- **Kapalı liste borularının havuzda görünmesi**: `kesimListesiId` → `kapaliListeIds` kontrolü
- **Toast async fix**: DB save başarısından sonra çıkıyor
- **Paketi İptal Et**: borular havuza, liste DB'den silinir
- **`spool_detay.html`**: `kesimKaydet/bukumKaydet/markalama` insert'lerine `spool_id: SP.supaId` eklendi
- **`devre_detay.html`**: `spoolYukle` nested select ile rewrite (kesim/büküm/markalama dahil)
- **`devre_yeni.html`**: `devreler.notlar` insert'ten kaldırıldı → `notlar` tablosuna yazılıyor
- **Dil dosyaları**: 11 yeni anahtar eklendi (cmn_disa_aktar, ks_bos_kesilen vb.)

**DB Migrasyonlar:**
```sql
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS boru_ids JSONB DEFAULT '[]';
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kriter JSONB DEFAULT '{}';
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kesim_plani JSONB;
ALTER TABLE kesim_kalemleri ADD COLUMN IF NOT EXISTS kesim_listesi_id UUID;
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kapali BOOLEAN DEFAULT false;
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS arsiv JSONB DEFAULT '[]';
```

**Değişen dosyalar:** `kesim.html`, `spool_detay.html`, `devre_detay.html`, `devre_yeni.html`, `tr/en/ar.json`

---

## 11A. ÖNCEKİ OTURUM — 20 NİSAN 2026 (11. OTURUM)

### Bu oturumda tamamlananlar (Test + 3 Fix + 1 Kural)

**Ana tema:** 10. oturum deploy borcu testi + QA bulunan eksik fix'ler

**1. Küme A — Dil dosyaları testi ✅**
- TR/EN/AR dil geçişi test edildi, placeholder bug'ları (7 adet) düzelmiş ✅
- AR RTL düzeni doğru ✅

**2. spool_detay Tracker i18n Fix ✅**
- `renderTracker` fonksiyonu `STAGE_KEYS` array'ini biliyordu ama kullanmıyordu
- `esc(s)` → `tv(STAGE_KEYS[i], s)` (tracker label'ları)
- Chip metinleri hardcode TR → `tv('sp_chip_not_started')`, `tv('sp_chip_done')`, `tv('sp_chip_active', '{stage} aşamasında').replace()`
- Buton: `STAGES[cur]+' Tamamla'` → `tv('sp_btn_complete', '{stage} Tamamla').replace()`
- **Yeni bulgu:** `sp_chip_not_started` ve `sp_chip_done` zaten lang dosyasındaydı — sadece render'a bağlanmamıştı
- 2 yeni lang anahtarı eklendi: `sp_chip_active`, `sp_btn_complete` (3 dil × 2 = 6 değişiklik)

**3. spool_detay Migration localStorage Fix ✅**
- `_gemi → _projeNo` migration bloğu vardı ama Supabase callback'i beklemeden hemen `localStorage.setItem` yapmıyordu
- Supabase query başarısız olursa `_gemi` kalıcı kalıyordu
- Fix: migration bloğunun hemen ardına `try { localStorage.setItem(...) } catch(e) {}` eklendi

**4. Öncelik 12 — devre_detay Duplicate Validation ✅**
- Manuel ekleme (satır 1352) + Excel import (satır 1886): sadece `spoolNo` kontrolü → `pipeline+spoolNo+rev` üçlü kontrole çevrildi
- Excel import'ta `Rev`/`REV` kolonunu da okuma eklendi

**5. Kural B-02 — CLAUDE.md Bölüm 2.17 ✅**
- Stabil Local Key (`_lk`) pattern'i resmi kural olarak belgelendi

### Değişen Dosyalar (3 HTML + 3 JSON)

| Dosya | Değişiklik | Deploy |
|---|---|---|
| `spool_detay.html` | Tracker i18n (6 patch) + migration localStorage fix | **Bekliyor** |
| `devre_detay.html` | Öncelik 12 — duplicate validation (2 patch) | **Bekliyor** |
| `lang/tr.json` | 1377 → 1379 (sp_chip_active, sp_btn_complete) | **Bekliyor** |
| `lang/en.json` | 1377 → 1379 | **Bekliyor** |
| `lang/ar.json` | 1377 → 1379 | **Bekliyor** |

### Test Durumu

| Küme | Durum | Not |
|---|---|---|
| A — Dil dosyaları | ✅ Geçti | TR/EN/AR temiz |
| B.1-B.3 — 3-buton dedup | ⏭ Atlandı | 12. oturuma |
| C.1 — _projeNo başlık | ⏭ Kısmen | localStorage teyit edilemedi tam |
| C.2 — Migration | ✅ Fix uygulandı | Deploy sonrası re-test |
| C.3 — Dropdown | ✅ Geçti | Seçili geliyor |
| C.4 — AR tracker | ⚠️ Kısmi | Fix doğru, basamak_tanimlari TR (Öncelik 14) |
| D — _lk duplicate | ⏭ Atlandı | 12. oturuma |

### Yeni Bulgular

- **Öncelik 14 (yeni):** `basamak_tanimlari.gorunen_ad` sadece TR — tracker tam çok dil için `gorunen_ad_en`, `gorunen_ad_ar` kolonları gerekiyor. 2-3 saat, orta-yüksek risk
- **Lang anahtar sayısı:** 1379 (önceki CLAUDE.md'de 1377 yazıyordu — düzeltildi)

### Bu Oturumdan Dersler

1. **"Oturum özetinde tamamlandı = gerçekten bitti" değil.** 10. oturum QA bulgu 2 "7 dil anahtarı + renderTracker i18n sarması" diyordu. Anahtarlar eklenmişti ama renderTracker'a bağlanmamıştı. Özet yazılırken "niyeti değil sonucu" yaz.

2. **Migration fix eksikti.** `_gemi → _projeNo` bloğu localStorage'a hemen yazmıyordu. Supabase callback başarısız olursa eski veri kalırdı. Migration bloklarında hemen persist etmek kural olmalı.

3. **`basamak_tanimlari` DB'den gelince i18n kırılıyor.** Dinamik tenant verisi statik lang dosyasıyla çevrilemez. DB'de çok dil desteği (gorunen_ad_en/ar) olmadan bu sorun çözümsüz. Öncelik 14 olarak eklendi.

---

## 11A. ÖNCEKİ OTURUM — 21 NİSAN 2026 (13. OTURUM)

### Bu oturumda tamamlananlar

**Ana tema:** Tablo tasarımı standardizasyonu, tersane kısa adı, görsel iyileştirmeler, büküm fason kaldırma, DB temizlik.

**1. Tersane kısa adı (`kisa_ad`) — DB + Kod:**
- `tersaneler` tablosuna `kisa_ad TEXT` kolonu eklendi (zaten mevcuttu)
- `UPDATE tersaneler SET kisa_ad = split_part(ad, ' ', 1) WHERE kisa_ad IS NULL OR kisa_ad = ''`
- Tüm sayfalarda `tersaneler(ad,kisa_ad)` + `trs.kisa_ad || trs.ad` — 9 dosya güncellendi
- `tersaneler.html` yönetim formuna "Kısa Ad" zorunlu alanı eklendi

**2. Tersane badge tasarımı:**
- `tersaneBadge(ad)` fonksiyonu — hash-based 5 renkli palet, uppercase pill, tüm sayfalara eklendi
- Eski: düz metin mor renk → Yeni: TERSAN(amber)/ADA(mor)/SEDEF(pembe) renkli pill

**3. Tablo tipografi standardizasyonu (kesim, büküm, markalama + diğerleri):**
- Spool ID: 20px/800 → 15px/700
- Kesim/Büküm uzunluk: 18-20px/800 → 15px/700
- Kalite: mavi → muted gri (`var(--txd)`)
- Çap: 13px/600 Condensed → 14px/500 normal
- İş emri: büküm'de `ref-badge` → `cell-emir` (kesim/markalama ile aynı)

**4. Cascade animasyon — kesim, büküm, markalama:**
- `@keyframes _cascadeIn` + `data-ci="0..19"` + 45ms delay
- `_dataLoaded` ve `_animDone` flag'leriyle çift render önlendi

**5. Scrollbar stillemesi:**
- `ares-layout.js` `injectGlobalCSS()`'e eklendi — 6px, `var(--bor)` rengi, transparent track
- Sol menü (`sidebar-nav`) scrollbar gizlendi
- Tüm HTML'lerden duplicate scrollbar CSS temizlendi

**6. Stat pill genişlemesi — kesim, büküm, markalama:**
- `hero-left` flex:1 kaldırıldı (sabit), `hero-stats` flex:1 aldı
- `stat-pill` min-width:88→120px, flex:1 (eşit dağılım)

**7. Fason büküm kaldırıldı — bukum.html:**
- 573 satır silindi (1385→812 satır)
- Silinen: panel-fason, tab-fason, firmalar/fasonlar değişkenleri, renderFasonListe, openFasonDetay ve tüm fason fonksiyonları
- Bükülenler: tersane badge + tersane filtresi eklendi, başlık kaldırıldı, isFason dalları temizlendi
- DOMContentLoaded başlatma kodu restore edildi (fasonla birlikte silinmişti)

**8. DB temizlik:**
- `spool_malzemeleri.kalite`'deki malzeme kodları NULL'a çekildi (`UPDATE ... WHERE kalite IN ('bakir','karbon',...)`)
- Plaka malzeme: `markalama_kalemleri.malzeme` → `spooller.malzeme` esas alınıyor (kod düzeltmesi)

**9. Lang dosyaları:** 1414 anahtar, 3 dil senkron (`bk_stat_tamamlanan` vb. yeni anahtarlar)

### Değişen Dosyalar (9 HTML + 1 JS + 3 JSON)

| Dosya | Değişiklik |
|---|---|
| `kesim.html` | tersane badge, tablo font, animasyon, _dataLoaded |
| `bukum.html` | **fason kaldırıldı**, tersane badge, tablo font, animasyon, bükülenler düzeltmeleri |
| `markalama.html` | tersane badge, tablo font, animasyon, _dataLoaded/_animDone, plaka malzeme fix |
| `devreler.html` | tersane badge, kisa_ad, filtre eşleşme fix |
| `kalite_kontrol.html` | tersane badge, kisa_ad |
| `sevkiyatlar.html` | tersane badge, kisa_ad |
| `spool_detay.html` | tersane badge, kisa_ad |
| `tersaneler.html` | kisa_ad form alanı |
| `devre_duzenle.html` | kisa_ad |
| `ares-layout.js` | scrollbar CSS, sidebar-nav scrollbar gizlendi |
| `tr/en/ar.json` | 1414 anahtar |

### DB Değişiklikleri (Canlıda)
- `spool_malzemeleri.kalite` temizlendi (bakir/karbon vb. kodlar NULL'a çekildi)
- `tersaneler.kisa_ad` dolduruldu (zaten mevcuttu, boş kayıtlar split_part ile dolduruldu)

---

## 11B. ÖNCEKİ OTURUM — 20 NİSAN 2026 (12. OTURUM)

### Bu oturumda tamamlananlar (6 Öncelik: 1+2+3+5+6+7)

10. oturumda sırasıyla Öncelik 1, 2, 3, 5, 6, 7 kapatıldı. Toplam ~2.5 saat, 4 HTML + 3 JSON + 1 DB migration.

**1. Öncelik 1 — Spool Çakışma 3-Buton Fix (devre_yeni.html):**
- 9. oturumdaki "Yine de devam et" butonu sessiz duplicate oluşturuyordu
- Yeni yapı: `[İptal] [Zorla ekle (sarı warn)] [Çakışanları atla (mavi, default)]`
- `spoolCakismaBul` — `{..., idx: i}` array tracking
- `kaydet()` — `'atla'` dalı: `new Set(cakismalar.map(c=>c.idx))` filter, boş kaldıysa `dny_dedup_s_bos` toast
- 4 yeni anahtar: `dny_dedup_s_atla`, `dny_dedup_s_bos`, `dny_spool_insert_hata`, `cmn_opt_sec` + 1 güncelleme: `dny_dedup_s_devam`

**2. Öncelik 2 — Spool Insert Toast:**
- `spoolRes.error` dalında sadece `console.error` vardı → `toast(...'er')` eklendi
- `.t-wa` CSS sınıfı (amber toast için) eklendi

**3. Öncelik 3 — `devreler.zone_no` Ölü Kolon DROP:**
- Grep: kodda 0 referans (node_modules hariç)
- 4 SQL + kolon listesi doğrulaması → ölü
- `ALTER TABLE devreler DROP COLUMN zone_no;` canlıda çalıştırıldı
- Bölüm 4.2 `devreler` kolon listesi güncellendi (zone canonical, zone_no kaldırıldı)

**4. Öncelik 5 — `SP._gemi` → `SP._projeNo` (spool_detay.html, 9 patch):**
- **Kritik keşif:** Önceki AI 3 yerde `SP._projeNo||SP._gemi` fallback bırakmış ama **`SP._projeNo`'ya hiç atama yapmamış** — fallback kozmetikti
- Demo data (897) + ASIL ATAMA (1005) + 6 okuma noktası düzeltildi
- **Legacy localStorage migration bloğu** (1296-1299): `_gemi` varsa `_projeNo`'ya taşı ve sil
- `devre_detay.html` goSpool bonus: localStorage'a `_projeNo:DEVRE.gemi` yaz (kaynak `DEVRE.gemi` hâlâ, 11. Öncelik)

**5. Öncelik 6 — spool_detay Dropdown E-01 (Silent Bug Fix):**
- **Silent DB corruption kaynağı:** Düzenle modal'ı `<option>` value'ları olmadan gelmişti, `.value` text döndürüyordu → DB'ye Türkçe yazılıyordu → 9. oturum Bug #3 migration'ı her düzenle'de geri alınıyordu
- Yüzey + malzeme dropdown'lar → 5+5 canonical value + data-i18n
- **"Epoksi" çıkarıldı** (CLAUDE.md 2.13 uyumu), **"Diğer" eklendi**, **"Boyalı" → `boyali` + etiket "Boya"**
- `duzenleAc()` — legacy Türkçe SP.yuzey/malzeme → `ARES_NORM.yuzeyKod/malzemeKod` ile canonical'e çevir
- `cmn_opt_sec` yeni anahtar (3 dil)

**6. Öncelik 7 — devre_detay Duplicate spoolNo Bug (`_lk` Stable Key):**
- Başta "tek fonksiyon" sandım, 11 fonksiyon + 2 state nesnesi + DOM ID'ler zincirine dönüştü
- **Strateji:** Her SPOOLS kalemine `_lk` (stable local key): DB kayıtları için `s.id` (UUID), Excel/manuel import için `'new_'+Date.now()+'_'+random(7)`
- Değişen: `_spoolMap`, Excel import, manuel ekleme, `renderTable` (6 onclick), `inlineEdit`, `goSpool`, `ctxAc` + zincir, `spoolDurdurAc/IptalAc/SilAc`, `spoolKaldir`, DELETE filter, `_gonderSecili`, `_etiketSecili`, DOM ID'ler
- **Kritik bug fix:** Aynı devrede `pipeline1+S01` + `pipeline2+S01` olduğunda — eskiden inline edit ilkinden, sil ikisini de silerdi. Şimdi doğru

### Değişen Dosyalar (4 HTML + 3 JSON + 1 SQL)

| Dosya | Önce → Sonra | Risk |
|---|---|---|
| `devre_yeni.html` | 2271 → 2286 (Öncelik 1+2) | Orta |
| `spool_detay.html` | 3139 → 3151 (Öncelik 5+6) | **Yüksek — 2 silent bug** |
| `devre_detay.html` | 1994 satır (Öncelik 7) | **Yüksek — kapsamlı refactor** |
| `lang/{tr,en,ar}.json` | 1366 → 1370 | Düşük |
| SQL | `ALTER TABLE devreler DROP COLUMN zone_no;` | Geri alınamaz ama güvenli |

### Verilen Anahtar Kararlar

- **3-buton tercihi:** İptal / Zorla ekle / Çakışanları atla. Default "Atla" (güvenli), "Zorla" sarı warn (duplicate oluşturduğunu kullanıcıya hatırlatır)
- **`zone_no` DROP:** Backup/rollback planı hazır (ADD COLUMN) ama gerekmedi, veri yoktu
- **`SP._gemi` → `SP._projeNo` migration bloğu:** localStorage'da eski kaynak var ise yakalanır, sonsuza kadar geriye uyumlu
- **Dropdown'da "Epoksi" kaldırıldı:** CLAUDE.md 2.13'e uygun (4. oturumda operasyonda kullanılmıyor kararı alınmıştı, kod henüz temizlenmemişti)
- **`_lk` pattern tercihi:** `supaId` yoksa fallback `'new_'+random()` — Excel import ve manuel eklemeli kayıtları DB'ye gitmeden önce unique tutar

### Keşfedilen Yeni Teknik Borçlar (11. oturuma)

**🔴 YENİ Öncelik 11 — `DEVRE.gemi` → `DEVRE.projeNo` (Öncelik 5 devamı):**
- `devre_detay.html` içinde `DEVRE.gemi` hâlâ proje_no anlamında (10+ satır)
- Öncelik 5 sadece spool tarafına dokundu, devre tarafı kaldı
- 45-60 dk, orta risk

**🔴 YENİ Öncelik 12 — UNIQUE check pipeline dahil:**
- `devre_detay.html` satır 1352 (manuel) + 1886 (Excel) sadece `spoolNo`'ya bakıyor
- `pipeline1+S01` varken `pipeline2+S01` eklenmiyor (false positive)
- Fix: `pipeline+spoolNo+rev` kombinasyonu
- 15-20 dk

**🟡 YENİ Öncelik 13 — `devreler.notlar` vs `notlar` tablosu:**
- `devreler.notlar TEXT` kolonu + ayrı `notlar` tablosu
- Legacy mi çift yazım mı belirsiz
- SQL + grep ile araştır, 30-45 dk

### Önemli Öğrenmeler

1. **Önceki AI "proaktif gibi görünen yarım iş" bırakabilir.** spool_detay.html'de `_projeNo||_gemi` fallback vardı ama atama yoktu — fallback kozmetikti. **Ders:** Rename işlerinde yazma ↔ okuma simetrisi grep ile kontrol edilmeli.

2. **Form save path'leri silent DB corruption üretebilir.** Düzenle modal her kullanıldığında DB'yi Türkçe ile kirletiyordu, 9. oturum migration'ı sürekli geri alınıyordu. **Ders:** E-01'de her form için round-trip test (açılış → seçim → kaydet → DB'de canonical?).

3. **Refactor kapsamını baştan tam çıkar.** Öncelik 7 başta "tek fonksiyon" sandığımdı, 11 fonksiyon zincirine dönüştü. **Ders:** İlk grep ile tüm key-based find'lar, selection state'ler, DOM ID'leri listele, patch sırası planla.

4. **Stable local key (`_lk`) pattern scalable.** `supaId || 'new_'+random()` — DB + client state aynı uzayda. Duplicate bug tek seferde çözüldü. Pattern akılda tut, başka liste sayfalarında (devreler.html, proje_detay.html) lazım olursa hazır.

5. **"Ölü kolon" araştırması çok ucuz.** Öncelik 3: 4 SQL + 1 grep = 10 dk. `zone_no` 0 referans, DROP güvenli. **Ders:** Migration-in-progress ikilik şüphesinde DB + kod çift doğrulama, belgeye güvenme.

6. **Uzun sohbet + büyük str_replace blokları = kapsam sarkması.** Bazı patch'lerim beklenenden fazla alanı etkilemiş gözüktü. **Ders:** Uzun dosyalarda dar patch serisi + sık grep doğrulaması.

---

## 11B. ÖNCEKİ OTURUM — 20 NİSAN 2026 (9. OTURUM)

### Bu oturumda tamamlananlar (Devre Dedup Popup + Bug #3 Migration + Fark Popup İyileştirmesi)

Ana tema: Öncelik 1 (devre dedup sessiz birleşme bug'ı) + biriken Bug #3 (devreler.malzeme legacy) + fark popup UX iyileştirmeleri. Kullanıcı test etmeden önce iki oturumluk deploy borcu birikmişti (8. + 9. oturum).

**Kritik keşif — Önceki AI oturumunda JS+HTML zaten yazılmış:** Kullanıcı dosyayı yükleyince `devre_yeni.html`'de 2058→2247 satır (+189) olduğu, dedup popup altyapısının zaten kurulmuş olduğu görüldü. Önceki AI dil anahtarlarını eklemeden yarım bırakmış — bu oturumda tamamlandı. Ayrıca kullanıcının geri bildirimi doğrultusunda **iş emri numarası + spool sayısı onay mesajı** eklendi.

**1. Devre Dedup Popup (Öncelik 1 — Ana İş):**
- `devre_yeni.html` satır 1561'de SELECT güncellendi: `zone` + `is_emri_no` dahil, dedup key artık `(tenant + proje + devre_no + zone)` (önceden sadece `proje + devre_no` idi)
- Dedup hit → popup çıkar: *"Bu devre zaten var — Mevcut devreye ekle / Yeni devre oluştur / İptal"*
- Popup info kartı: proje adı + **iş emri numarası (P26-135) badge** + devre_no + zone
- Onay mesajı: *"5 spool bu mevcut devreye eklenecek. Onaylıyor musunuz?"* (spool sayısı dinamik)
- Önceki sessiz birleşme kaldırıldı — kullanıcı her durumda bilinçli karar verir
- Fark popup CSS'i (`.fp-*`) reuse edildi, yeni CSS yazılmadı

**2. Spool Dedup Popup (Öncelik 1 — Ek İş):**
- "Mevcut devreye ekle" seçiminden sonra, mevcut devredeki spool'larla (pipeline_no + spool_no + rev) çakışma kontrolü
- Çakışma varsa 2. popup: listeli, "Rev numarası güncellendi mi?" uyarısı
- 2 seçenek: İptal / Yine de devam et
- Kural: "proje + devre + zone + pipeline + spool_no hepsi aynı olamaz — ancak rev farklı olabilir" (kullanıcı iş modeli)

**3. Log Flag (Bug #4 — Bonus):**
- `mevcutDevreyeEklendi` flag'i eklendi
- Dedup hit + "mevcuta ekle" → `islem_log.islem = 'SPOOL_EKLE_MEVCUT_DEVRE'`
- Yeni devre veya "yeni oluştur" → eski `DEVRE_EKLE`
- Toast da ayrıldı: `dny_saved_mevcut` ("✅ Mevcut devreye eklendi") vs `dny_saved`

**4. Fark Popup Pill Sayaç (UX İyileştirmesi):**
- `farkTespit`'te `yuklenenDagilim` eklendi — `[[kod, sayı], ...]` formatında
- Pill rendering: `Bakır Alaşım ×3` gibi
- Malzeme + yüzey için aynı mantık
- Eski `yuklenenKodlar` fallback olarak korundu (geriye uyumluluk)

**5. Bug #3 — `devreler.malzeme` Legacy Migration:**
- 4. oturumdaki Faz 2 migration'da `devreler` tablosu **atlanmıştı** (sadece `spooller` + `spool_malzemeleri` yapılmış)
- DB sorgusuyla 82 büyük harfli kayıt bulundu: 59 "Karbon Çelik", 12 "Paslanmaz/Paslanmaz Çelik", 8 "Bakır Alaşım", 4 "Alüminyum"
- CASE WHEN mapping ile tek UPDATE: hepsi canonical'e çevrildi (`karbon`, `paslanmaz`, `bakir`, `alum`)
- **Yeni bilgi:** "Paslanmaz Çelik" varyasyonu (3 kayıt, 9 Nisan) — ARES_NORM regex'inde `paslanmaz` altında `çelik` opsiyonel kelime olduğu için yakalar, ama DB canonical yazılımı için mapping'e eklendi

**6. Dil Dosyaları (3 × 14 anahtar = 42 yeni):**
- `dny_dedup_d_title`, `dny_dedup_d_alt`, `dny_dedup_d_soru`, `dny_dedup_d_onay` (devre popup)
- `dny_dedup_s_title`, `dny_dedup_s_alt`, `dny_dedup_s_devam`, `dny_dedup_s_ipucu` (spool popup)
- `dny_dedup_mevcut`, `dny_dedup_yeni`, `dny_dedup_iptal`, `dny_dedup_devre`, `dny_dedup_zone`
- `dny_saved_mevcut` (toast)
- **tr/en/ar: 1352 → 1366 anahtar, 3 dil simetrik**
- Arapça'da "spool" = `السبول` (mevcut `dv_*` pattern'ine uygun, önceki AI'nın `الملف` önerisi düzeltildi)

### Bug #5 — Aslında Bug Değilmiş

Kullanıcı "form'da Karbon Çelik → popup Bakır → DB'ye Paslanmaz" senaryosu rapor etmişti. Kod analizinde:
- `farkTespit` ve `farkDevam` fonksiyonları spool'ların malzemesini DEĞİŞTİRMİYOR — sadece uyumsuzluğu gösterip onay alıyor
- `kaydet()` akışı: dedup hit → **devre INSERT atlanır**, yalnızca mevcut devrenin id'si kullanılır
- Yani "Karbon" form beyanı, dedup hit olduğunda DB'ye **hiç yazılmaz**
- Kullanıcı devreler.html'de eski "Paslanmaz" devresini görüp "yeni kayıt bu" sanmış

**Sonuç:** Bug #5 aslında Bug #1'in türevi — Öncelik 1 popup'ı (kullanıcıya açık onay) bu karışıklığı kökten çözer. Kullanıcı bu senaryoyu oturumda onayladı.

### Keşfedilen Yeni Teknik Borçlar (10. oturuma kalan)

**🔴 YENİ ÖNCELİK 10 — EN/AR Dil Dosyası Eksik Çeviri (3-4 saat):**
Dil dosyalarını güncellerken sistemik bir bug keşfedildi:
- **`en.json`: 348 anahtar hâlâ Türkçe** (`dny_cancel`="İptal", `dny_active_circuits`="Aktif Devreler", vb.)
- **`ar.json`: 319 anahtar hâlâ Türkçe** — aynı sorun
- EN/AR kullanıcıları yarım çevrilmiş UI görüyor
- Kaynak: önceki oturumlarda anahtar eklerken çeviri atlama
- Toplu export + çeviri + import gerekli, ayrı oturum işi

**🟡 Spooller tablosunda UNIQUE constraint YOK:**
- Primary key sadece `id` (UUID) — duplicate spool'u DB reddetmiyor
- Kodda `// 23505 = unique constraint` yorumu yanlış (hiç oluşmuyor)
- Spool insert hatası `console.error` ile sessiz kalıyor (toast yok, satır 1668-1671)
- Bug #5'in yan meselesi, Öncelik 2'ye taşındı

**🟡 `devreler` tablosunda UNIQUE constraint YOK:**
- Dedup tamamen JS tarafında. İki sekme aynı anda aynı devreyi oluşturabilir (çakışmaz ama duplicate olur)
- Büyük değil çünkü popup zaten kullanıcıyı uyarıyor

**🟡 `devreler` tablosunda `zone` + `zone_no` ikiliği:**
- Tüm son kayıtlarda `zone` dolu, `zone_no` NULL
- `zone_no` migration-in-progress mi yoksa ölü kolon mu belirsiz
- Dedup kodu `zone` kullandı (doğrusu büyük olasılıkla bu)
- 10. oturum keşfi: SELECT ile tam dağılım, ölü ise DROP, dolu ise merge kuralı

### Değişen Dosyalar (4)

| Dosya | Değişim | Satır/Anahtar |
|---|---|---|
| `devre_yeni.html` | Dedup popup + pill sayacı + is_emri_no | 2058 → 2271 |
| `lang/tr.json` | 14 yeni dedup anahtarı | 1352 → 1366 |
| `lang/en.json` | 14 yeni dedup anahtarı (İngilizce) | 1352 → 1366 |
| `lang/ar.json` | 14 yeni dedup anahtarı (Arapça) | 1352 → 1366 |

### DB Migration (1 blok)

```sql
-- Bug #3 — devreler.malzeme legacy Türkçe → canonical
UPDATE devreler SET malzeme = CASE malzeme
  WHEN 'Karbon Çelik'    THEN 'karbon'
  WHEN 'Paslanmaz'       THEN 'paslanmaz'
  WHEN 'Paslanmaz Çelik' THEN 'paslanmaz'
  WHEN 'Bakır Alaşım'    THEN 'bakir'
  WHEN 'Alüminyum'       THEN 'alum'
  ELSE malzeme
END
WHERE malzeme IN ('Karbon Çelik','Paslanmaz','Paslanmaz Çelik','Bakır Alaşım','Alüminyum');
-- 82 satır etkilendi (canlıda çalıştırıldı)
```

### Verilen Anahtar Kararlar

- **Seçenek A+ (popup) tercih edildi:** `gemi_no` kolonu eklenmedi — çünkü `proje_no` zaten gemi numarasını tutuyor (NB1124, NB1137 newbuild prefix'leri). Veri modelinde değişiklik yerine UX popup'ı ile çözüldü.
- **Zone dedup'a dahil edildi:** Farklı zone = farklı devre. Aynı ada ama M100 ve M200 zone'larında iki ayrı devre olabilir (iş modeline uygun).
- **"Paslanmaz Çelik" → `paslanmaz`:** Mapping'e açık ekleme, gelecekte bu varyasyon tekrar görülürse yakalar.
- **ARES_NORM doğru çalışıyor:** `malzemeKod("Paslanmaz Çelik")` regex ile `paslanmaz` döndürür — runtime tarafı zaten hazır, sadece DB canonical değildi.
- **EN/AR 667 anahtar çevrilmemiş konusu 10. oturuma taşındı** — kapsam büyük, ayrı iş.

### Önemli Öğrenmeler

1. **"Silent corruption" sandığın şey tasarım gereği olabilir.** Bug #5 "form'da X → DB'de Y" klasik veri bozulması senaryosuydu. Kod analizinde aslında dedup hit'te form beyanı hiç yazılmadığı, kullanıcının eski kaydı yeni sandığı ortaya çıktı. **Ders:** Kullanıcı rapor ettiği bug'ı önce DB sorgusu + kod akış analizi ile doğrula, varsayıma hemen koda dalma.

2. **Önceki AI oturumu bıraktığı iş: dikkat!** Yeni oturumda dosyayı gördüğümde JS+HTML zaten yazılmıştı ama dil anahtarları eksikti. `outputs/` klasörüne bakmak, `dil-anahtarlari-ekle.md` gibi dosyalar bulmak yarım işleri ortaya çıkarır. **Ders:** Her oturumun başında outputs'u tara.

3. **Arapça çeviri kontrolü:** Önceki AI "spool" için `الملف` (dosya) önermişti — ama `dv_*` ve `sp_*` anahtarlarında pattern `السبول`. **Ders:** Çeviri eklerken pattern tutarlılığını grep ile kontrol et, körü körüne kopyalama.

4. **Migration "tamamlandı" iddiası şüpheyle karşıla.** 4. oturum notu "Faz 2 migration bitti" diyordu, 5. oturum `aluminyum → alum` kaçağı bulmuştu, 9. oturum `devreler` tablosunun tamamen atlandığını buldu. **Ders:** "Tamamlandı" sonrası 3 sorgu (her tablo için dağılım) 10 saniye alır, kör bir köşeyi gösterir.

5. **UX mesajları somut olmalı.** "Bu devre zaten var" genel → yanlış devre karıştırma riski. "5 spool P26-135 iş emirli devreye eklenecek" spesifik → kullanıcı tam olarak ne olduğunu bilir. **Ders:** Popup metinlerinde dinamik değerler (sayı, ID, kritik alanlar) göster.

6. **Kullanıcının yanılma ihtimalini kabul et.** Bug #5 raporunda kullanıcı kendi kendine "acaba yanılmış mıyım" dedi ve senaryoyu yeniden düşündü. **Ders:** Kullanıcıyı küçük düşürmeden gerçek akışı açıkla — "siz haklısınız, sistem yanlış" demek her zaman doğru değil.

---

## 11C. ÖNCEKİ OTURUM — 20 NİSAN 2026 (6. OTURUM)

### Bu oturumda tamamlananlar (spool_detay.html sessiz bug avı + tenant prefix temelleri)

Ana tema: DB ile UI arasındaki senkron kopukluklarını kapatma. 12 fix, 2 dosya, 3 DB migration.

**1. spool_detay.html — 11 fix, hepsi sessiz bug:**
- **Notlar (2 fix):** `yapan_id` → `ekleyen_id`. DB'de `notlar.yapan_id` kolonu YOK (sadece `ekleyen_id` var), insert silent fail ediyordu. Kullanıcı not ekleyip sayfa yeniledi → not kayboluyordu. Map tarafında da yanlış kolon okunduğu için kişi bilgisi UI'da hep "Admin" görünüyordu.
- **Fotograflar migration (5 değişiklik):** `fotograflar.yapan_id` (TEXT, legacy) → `yukleyen_id` (UUID, canonical). Tip uyumsuzluğunu çözmek için `yapan` değişkeni ikiye bölündü: `yapanId` (UUID, DB için), `yapanAd` (ad_soyad, UI için). DB'de de 11 legacy kayıt email lookup ile migrate edildi.
- **Spool ağırlık UPDATE (1 fix):** `spooller.agirlik` UPDATE bloğunda yoktu — ağırlık değiştiriliyor, "güncellendi" toast'ı çıkıyor, DB'ye yazılmıyordu. Klasik "UI gösteriyor ama DB'ye düşmüyor" pattern'i.
- **Spool ID okuma (1 fix):** `spoolYukle` fonksiyonu `s.spool_id`'yi hiç okumuyordu — başlıkta "ID: 9D07969B" (UUID[0-8]) görünüyordu. Satır 922'ye `SP.spoolId = s.spool_id` atandı.
- **Spool ID gösterim sırası (2 fix):** 1241 ve 2365'te öncelik UUID'deydi, kısa kod asla görünmüyordu. Düzeltildi — şimdi `A-0512` gibi insan okunabilir kod önce gösteriliyor.
- **QR kodu içeriği:** SP.spoolId atanınca QR payload artık doğru kısa kodu içeriyor. Önceden yanlış/eski değer içeriyordu → tersanedeki operatör yanlış spool açma riski vardı.
- **Et kalınlığı header fallback:** `spooller.et_kalinligi_mm` NULL ise malzemelerden en yaygın `et_mm` değerini alıp header'a yansıt. Önceden "ET KALINLIĞI —" dash görünüyordu.

**2. devre_yeni.html — Tenant Prefix (1 fix):**
- Spooller INSERT bloğunda tenant kodu bir kez çekilip her `spool_id`'ye prefix eklendi
- Yeni spool'lar artık `A-0504`, `A-0512` gibi formatta üretiliyor (test edildi)
- Graceful fallback: tenant kod NULL ise eski davranış (prefix yok)

**3. DB Migration — 3 blok:**

Blok A — Fotograflar UUID migration:
```sql
UPDATE fotograflar f SET yukleyen_id = k.id
FROM kullanicilar k
WHERE f.yukleyen_id IS NULL AND f.yapan_id = k.email;
-- 11 satır etkilendi (hepsi cihatoztas@gmail.com → UUID)
```

Blok B — Tenants.kod kolonu + 7 tenant'a atama:
```sql
ALTER TABLE tenants ADD COLUMN kod VARCHAR(4) NOT NULL UNIQUE;
ALTER TABLE tenants ADD CHECK (kod ~ '^[A-Z]{1,4}$');
-- Demo tenant'lara A-G atandı
```

Blok C — DB keşifleri (kod değişmedi, sadece belgelendi):
- `spool_malzemeleri` tam şeması (daha önce CLAUDE.md'de yoktu)
- `markalama_kalemleri.et_mm` varlığı
- `spooller.agirlik_kg` legacy NULL
- `fotograflar.yapan_id` legacy TEXT

### Değişen Dosyalar (2)

| Dosya | Değişim | Satır (önce → sonra) |
|---|---|---|
| `spool_detay.html` | 11 fix | 2996 → 3007 |
| `devre_yeni.html` | Tenant prefix | 2009 → 2013 |

### Verilen Anahtar Kararlar

**Tenant prefix sistemi (E-03):**
- Format: 1-4 harf, A-Z (Excel kolon mantığıyla genişler)
- Admin manuel seçer, sistem otomatik vermez
- Çakışma durumunda iki aşamalı onay (önce eski sahipten al, sonra yenisine ver)
- I/L/O/Q kısıtı yok — admin karar versin
- Kalıcı: atanan kod değişmez

**QR payload formatı (planlandı, 7. oturumda implemente edilecek):**
- Yeni: `A-0504:UUID`
- Eski: `0504` (geriye uyumlu, qr_tara iki formatı da parse eder)
- Cross-tenant okuma: uyarı mesajı gösterir ("Bu spool X firmasına aittir")

**Kalite alanı sorunu (6. oturumda tespit edildi):**
- Form'da kalite alanı ikinci bir malzeme radio grubu gibi davranıyor (canonical malzeme kodlarını alıyor)
- DB'de `spool_kalite = "karbon"` gibi bozuk veriler var (olması gereken ST37, A106-B, 304L...)
- Çözüm 7. oturuma bırakıldı — serbest text + autocomplete tasarımı

### Önemli Öğrenmeler

**1. "78 yanlış referans" tahmini büyük ölçüde yanlıştı.** Dosyada önceki oturumlardan kalan `✅ FIX` yorumları vardı — çoğu zaten düzeltilmişti. Gerçek bug sayısı kolon adı değişimi değil, **DB ile UI arasındaki senkron kopuklukları**: INSERT'te eksik alan, UPDATE'te yazılmayan kolon, okuma tarafında yanlış field adı. "78 referans düzelt" odağı yerine **"her INSERT/UPDATE'in form state ile simetrik mi"** bakışı daha verimli.

**2. DB şemasını varsayma, sorgu at.** CLAUDE.md Bölüm 4.2 eksikti — `spool_malzemeleri` şeması hiç yazılmamıştı. `et_mm` mi `et_kalinligi_mm` mi belirsizdi. 10 saniyelik DB sorgusu saatlerce belirsizliği kapattı. 6. oturumun en kritik dersi.

**3. Sessiz fail en sinsi düşman.** `_supaInsert` helper'ı `console.warn` atıyor ama toast yok. Kullanıcıya "başarılı" gibi gösteriliyor, DB'ye yazılmıyor. Notlar, ağırlık, fotoğraflar hep bu pattern'in kurbanıydı. Helper'ların error handling'i ciddi ele alınmalı.

**4. Migration-in-progress pattern'i yaygın.** `fotograflar.yapan_id/yukleyen_id`, `spooller.agirlik/agirlik_kg` — ikili kolon durumları. Yeni bir tane bulunduğunda aynı pattern'le çözülmeli: canonical'e yaz, fallback'i UI'da tut, legacy migration'ı ayrı SQL ile yap.

**5. Tip uyumsuzluğu sessiz bug yaratır.** `yapan_id` TEXT, `yukleyen_id` UUID — tip değişimini göz ardı ettim, INSERT patlayacaktı. Kullanıcı doğru soru ile yakaladı, düzelttim. 5. patch'im başlangıçta HATALIYDI. Şema detayları kritik.

**6. Oturum özetlerini skeptik oku.** Önceki özet "78 yanlış referans" diyordu, gerçek çok farklıydı. "Tamamlandı" iddialarını DB'den doğrulamak lazım — 4. ve 5. oturumda da benzer durumlar yaşanmıştı.

**7. Kullanıcı yorgunluğu + oturum uzunluğu.** Bu oturumda kullanıcı "sürekli oturum değişmek yorucu" dedi, haklıydı. CLAUDE-SON-OTURUM.md ve CLAUDE-SONRAKI-OTURUM.md'nin özenli yazılması sonraki oturumun "hatırlamak" yerine "direkt koda gir" olmasını sağlıyor — ihmal edilmemeli.

---

## 11D. ÖNCEKİ OTURUM — 20 NİSAN 2026 (5. OTURUM)

### Bu oturumda tamamlananlar (Malzeme-Yüzey Uyum + Fark Tespit + devreler.html refactor)

Bu oturumda üç büyük iş bitti:

**1. Malzeme-Yüzey Uyum Kontrolü (Kural E-02)**
- Matris kilitlendi: paslanmaz/bakır → sadece asit, alüminyum → asit+boya, karbon/diger → hepsi (`yuzey=diger` her zaman serbest)
- `ares-normalize.js` + `uyumlu()` ve `uyumluYuzeyler()` API'si
- `devre_yeni.html` + `devre_duzenle.html`: Malzeme değişince uyumsuz yüzey radio'ları disable + strikethrough + tooltip (`dny_uyum_uyari`)
- `devre_duzenle.html`'de grace period — sayfa açılınca mevcut uyumsuz seçimi zorla değiştirmez, kullanıcı manuel değiştirirse kural işler
- DB CHECK constraint `malzeme_yuzey_uyumu` eklendi

**2. "Diğer" Yüzey + yuzey_aciklama**
- `cmn_yuzey_diger` radio 4. oturumda eklenmişti, bu oturumda forma da eklendi
- `ALTER TABLE spooller ADD COLUMN yuzey_aciklama TEXT` (sadece INSERT yolu için)
- `ALTER TABLE devreler ADD COLUMN yuzey_aciklama TEXT` (devre_duzenle için)
- Frontend: radio "Diğer" seçilince text input görünür (`fYuzeyAciklama` / `yuzeyDigerAciklama`)
- "Boyalı" → "Boya" etiket düzeltmesi devre_yeni ve devre_duzenle formlarında da uygulandı

**3. Fark Tespit Popup (Generic Diff Framework)**
- Kaydet öncesi form beyanı ↔ spool'larda gerçek değerler karşılaştırılır
- Malzeme + yüzey için ayrı kartlar, her biri: beyan pill (mavi) → yüklenen pill'ler (kırmızı) + uyumsuz spool listesi
- 3 buton: **İptal et** (confirm + devreler.html'e dönüş), **Düzelt** (popup kapan + formda kal), **Yüklemeye devam et** (farkı kabul et, kayıt devam)
- Generic yapı: ileride yeni alanlar (kalite, çap toleransı vb.) kolayca eklenebilir
- `devre_yeni.html`: in-memory `spooller[]` array'i ile karşılaştırır
- `devre_duzenle.html`: DB'deki `_devreSpools` ile karşılaştırır

**4. DB Migration — 8 uyumsuz kayıt + aluminyum → alum**
- 4. oturumda gözden kaçan `aluminyum` → `alum` dönüşümü yapıldı (83 kayıt)
- 8 uyumsuz kayıt (paslanmaz+galvaniz, bakir+siyah, alum+galvaniz) → `asit`'e çevrildi (hepsi 7 Nisan toplu test verisiydi, ilerleme=0, bekliyor)

**5. devreler.html — Durum sütunu + sapma mantığı**
- `devreler.durum` tüm 75 kayıtta `'aktif'` idi → `DURUM_MAP` ölü kod → **UI sütunu + filtresi kaldırıldı**
- İptal akışı için DB kolonu korundu (`durum='iptal'`)
- **Sapma mantığı çoğunluk-baz'a çevrildi:** Eski kod "ilk insert" baz alıyordu (kırılgan: 60 karbon + 1 paslanmaz ama paslanmaz ilk girdiyse "Paslanmaz ⚠ +60" yazabiliyordu). Yeni: `malzemeSayim[mk]++` → en çok olan baz, badge sırası çoğunluktan aza.

### Dil Dosyaları (3) — 1338 → 1348 anahtar
10 yeni anahtar (TR/EN/AR):
- `dny_fark_title`, `dny_fark_alt`, `dny_fark_beyan`, `dny_fark_yuklenen`
- `dny_fark_duzelt`, `dny_fark_devam`, `dny_fark_iptal_tam`, `dny_fark_iptal_confirm`
- `dny_uyum_uyari` (placeholder: `{mal}`)
- `dny_ph_yuzey_diger`

### Değişen Dosyalar (7)
- `ares-normalize.js` (+uyumlu, +uyumluYuzeyler, 116 → 164 satır)
- `lang/{tr,en,ar}.json` (1338 → 1348)
- `devre_yeni.html` (1751 → 2009, +258 satır)
- `devre_duzenle.html` (358 → 628, +270 satır)
- `devreler.html` (2357 → 2340, −17 satır net; ölü kod temizlendi)

### Verilen Anahtar Kararlar
- **Bakır için boya kapalı (dar)** — operasyonda hiç kullanılmamış
- **Alüminyum için boya açık** — %65 oranında operasyonda kullanılıyor (54/83)
- **Fark popup sadece kaydet()'te** — her spool ekleme anında değil (tek güvenlik ağı, tüm import yolları oradan geçer)
- **`devreler.durum` DB'de kalıyor** — iptal akışı için gerekli, sadece UI sütunu kaldırıldı
- **devre_yeni hâlâ `devreler.yuzey_aciklama` yazmıyor** — sadece devre_duzenle yazıyor; sonraki oturumda tutarlılık için devre_yeni'ye de eklenebilir

### Önemli Öğrenmeler
1. **"4. oturumda tamamlandı" tamamlandı mı?** 4. oturumun son özeti "Faz 2 bitti" diyordu ama `aluminyum → alum` dönüşümü yapılmamış, gözden kaçmış. **Ders:** Oturum özetinde "tamamlandı" ifadesi her zaman sorgulayarak kabul et, DB doğrulaması tekrar yap.

2. **"İlk insert" sıralaması insertion-order bağımlı, kırılgan.** `Object.keys(malzemeSet)[0]` pattern'i browser'da insertion-order döner ama bu garanti değil. Çoğunluk-baz matematiksel olarak belirsizlik içermez.

3. **Generic diff framework scope'u büyütür.** İlk mockup sadece malzeme üzerineydi. Kullanıcı "devre adı, zone vb. de dahil" deyince yaklaşım "her alan için kart" generic hâle geldi. Pratikte şimdi sadece 2 alan karşılaştırılıyor ama structure 10'dan fazla alanı destekler.

4. **UX vs schema ayrımı (4. oturumun devamı).** `yuzey_aciklama` için: UI'da "Diğer" seçilince input açılması ayrı, DB'de kolonun olması ayrı. Mantıksal olarak eşlenmesi kolay ama implementation'da bile dikkat ettim — spool INSERT'te fallback pattern (`s.yuzeyAciklama || yuzeyAciklama`) devre geneli açıklamasını her spool'a miras yaptırıyor.

5. **Grace period**: `devre_duzenle.html`'de mevcut uyumsuz kombinasyon varsa form açılırken zorla değiştirmez (_formHazir flag'i). Bu UX dostu — kullanıcı "mevcut kayıt neden değişti?" diye şaşırmaz. Ama kullanıcı manuel değişiklik yaparsa kural işler.

---

## 11E. ÖNCEKİ OTURUM — 19 NİSAN 2026 (4. OTURUM)

### Bu oturumda tamamlananlar (Enum Refactor Tamamlama + DB Migration)

3. oturumda enum anti-pattern temizliği başlatılmıştı ama iki büyük boşluk kalmıştı: (1) `devreler.html` ARES_NORM'a bağlanmamıştı — kendi normalize fonksiyonu farklı kodlar üretiyordu (`karbon_celik` vs.), (2) DB'de üç farklı yazım yan yana yaşıyordu. Bu oturumda ikisi de kapatıldı.

**DB Migration ✅ (Faz 2 tamamlandı):**
- `spooller.malzeme`: `karbon_celik`, `Karbon Çelik` → `karbon` (1005 kayıt)
- `spooller.malzeme`: `bakir_alasim` → `bakir` (83 kayıt)
- `spooller.yuzey`: `Asit` → `asit` (24 kayıt)
- `spool_malzemeleri.malzeme`: aynı temizlik
- 1 epoksi test kaydı silindi
- **Sonuç:** DB'de canonical format tek başına

**Kanonik enum listesi kesinleşti (Bölüm 2.13):**
- 5 malzeme: `karbon`, `paslanmaz`, `bakir`, `alum`, `diger`
- 5 yüzey: `asit`, `galvaniz`, `siyah`, `boyali`, `diger`
- **`plastik`, `epoksi`, `ham` çıkarıldı** — operasyonda kullanılmıyor

**Kod değişiklikleri:**
- **`ares-normalize.js`** — yüzey regex temizliği, `tvYuzey` default "Boyalı" → **"Boya"**
- **`devreler.html`** (6 nokta refactor):
  - `ares-normalize.js` script tag eklendi
  - `_normalizeMalzeme`/`_normalizeYuzey` → ARES_NORM delegasyonu
  - `rebuildSelect` — alan parametresi ile lokalize option text
  - Pie chart + malzeme modal label lokalize
  - 🔴 **Kritik bug fix:** `matBadge`/`yuzeyBadge` eski kodları (`karbon_celik`, `bakir_alasim`, `aluminyum`, `plastik_pe`) karşılaştırıyordu — delegasyon sonrası `else` dalına düşecek, renk sınıfları kaybolacaktı. Yeni kodlara (`karbon`, `bakir`, `alum`, `diger`) güncellendi.
- **`kesim.html`** (7 nokta):
  - `borular` map'ine `malzemeKod` alanı
  - `populateFilters.fill` — `labelFn` parametresi
  - `applyFilters` — kod bazlı karşılaştırma
  - Arama haystack — ham değer + lokalize etiket
  - Sorting — lokalize etiket bazlı
  - `openListeModal` — homojenlik kod bazlı, önizleme lokalize
  - Excel `malzAdi` + `islem_log` aciklama — lokalize etiket

**Dil dosyaları (3) — 1340 → 1338 anahtar:**
- `cmn_malzeme_plastik` SİLİNDİ (3 dil)
- `cmn_yuzey_epoksi` SİLİNDİ (3 dil)
- TR `cmn_yuzey_boyali`: "Boyalı" → **"Boya"**

### Verilen Anahtar Kararlar

- **Çoklu dil hedefi korundu:** Yabancı çalışanlar olduğu için kod bazlı DB + dil bağımsız UI yaklaşımı sürer
- **"Paslanmaz" (yalın), "Bakır Alaşım", "Boya"** — kesin TR etiketleri
- **Admin UI ertelendi** — ihtiyaç açıkça doğana kadar overengineering (5 malzeme + 5 yüzey stabil)
- **Bakır ve alüminyum için yüzey kuralları netleşmedi** — sonraki oturuma kaldı

### Yan Bulgular (CLAUDE-SONRAKI-OTURUM'a not edildi)

- **Malzeme-yüzey uyum kuralı (YENİ — Öncelik 1):** paslanmaz + galvaniz/boya yasak olmalı, DB constraint + frontend validation
- `spool_malzemeleri.kalite='diger'` 2 kayıt — form UX sorunu
- `devre_yeni.html` yüzey radio'da "Diğer" seçeneği yok
- Excel export başlıkları hâlâ Türkçe hardcode
- Diğer HTML sayfalarında (bukum/sevkiyat/KK/raporlar) enum kullanımı taranmadı

### devre_yeni.html Canlı Test ✅

19 Nisan 17:03 testinde: Paslanmaz+Asit seçimi → DB'ye `malzeme='paslanmaz'`, `yuzey='asit'` yazıldı. 3. oturum patch'i doğru çalışıyor.

### Önemli Öğrenmeler

1. **Belge ≠ gerçeklik:** CLAUDE.md "plastik/epoksi canonical" diyordu, operasyonda yoktu. Varsayım değil **DB sorgusu** ile doğrula.

2. **DB sorgusu karar almanın en ucuz yolu:** 3 SQL (malzeme dist + yüzey dist + son kayıt tarihi) tüm varsayımları 30 dakikada çürüttü/doğruladı.

3. **"Kör nokta" testi değerli:** devre_yeni test edilmemişti — 2 dakikalık test 3 oturumluk belirsizliği kapattı.

4. **Delegasyon sırasında "switch-case bombası":** `_normalizeMalzeme`'yi ARES_NORM'a delege edince dönen değer formatı değişti, eski `matBadge` if koşulları eşleşmeyecekti. **Kural:** Delegasyon öncesi eski fonksiyonun tüm kullanım noktalarını grep'le tara.

5. **Canonical sözlük: 5+5 yeter.** "İleride olabilir" gerekçesiyle geniş tutmak tuzak — gerçek ihtiyaç doğunca ekleme ucuz.

---

## 11F. ÖNCEKİ OTURUM — 17 NİSAN 2026 (3. OTURUM)

### Bu oturumda tamamlananlar (Enum Anti-Pattern Temizliği)

- **`ares-normalize.js`** — yeni ortak modül (kök dizin). Malzeme/yüzey/durum için kod ↔ etiket dönüşümü, 3 dil bağımsız `cmn_*` anahtarlarıyla entegre
- **6 HTML sayfasında enum anti-pattern temizliği:**
  - `spool_detay.html` — `_normKey` silindi, `_malzemeGoster/_yuzeyGoster` ARES_NORM'a bağlandı
  - `kesim.html` — `matBadge` refactor + raw display wrap (1178, 1373)
  - `markalama.html` — 🔴 **BUG FIX:** `m.indexOf(tv('cmn_malzeme_alum'))` pattern'i dil değişince fail oluyordu, kod bazlı karşılaştırmaya çevrildi
  - `devre_yeni.html` — `normalizeMalzeme` artık KOD döndürüyor (DB'ye 'karbon' yazılır), radio value'lar kod'a, `_malzemeTipi` inline kopyası ARES_NORM'a bağlandı
  - `is_baslat.html` — malzeme/yüzey display wrap
  - `devre_duzenle.html` — radio value'lar kod'a + data-i18n eklendi + formDoldur ARES_NORM.malzemeKod ile legacy Türkçe veriyi doğru radio'ya map eder
- **Dil sistemi:** 1335 → 1340 anahtar. 5 yeni `cmn_*` eklendi (durum_bekliyor / devam_ediyor / tamamlandi + malzeme_diger + yuzey_diger). 3 dilde tam çeviri (TR/EN/AR)
- **ARES_NORM'a `plastik` ve `epoksi` kategorileri eklendi** — dil dosyalarında zaten vardı, senkron hale getirildi

### Yeni Kurallar

- **E-01: Enum Normalize** — malzeme/yüzey/durum değerleri ARES_NORM üzerinden gösterilir (Bölüm 2.13)
- **Script yükleme sırası güncellendi:** `store → lang → normalize → layout`

### Strateji: Hybrid Faz 1 (tamamlandı) + Faz 2 (opsiyonel)

- **Faz 1 ✅ tamamlandı:** Yazma tarafı KOD yazar, okuma tarafı hem kod hem legacy Türkçe'yi kabul eder. DB geçiş sürecini sorunsuz yaşayabilir.
- **Faz 2 (opsiyonel, sonraki oturum):** Tek seferlik SQL migration ile eski Türkçe veriler kod'a dönüşür. Detay CLAUDE-SONRAKI-OTURUM.md'de.

### Bilinen bekleyen UI sorunları

- **Dropdown filter'lar kod gösteriyor:** devreler/kesim/markalama sayfalarında malzeme/yüzey filter dropdown'larında option metinleri kod olarak görünüyor ("karbon_celik") — sonraki oturum Öncelik 1
- **Excel export i18n eksik:** kesim.html 1302 satırı + Excel başlıkları ('KULLANILACAK MALZEME' vb.) hâlâ hardcode Türkçe
- **islem_log aciklama:** Log metinlerinde kod görünür (`karbon 48.3 2000mm`) — log format'ı insan okunabilir kalmalıysa refactor

### Önemli Öğrenmeler

- **Dil dosyası tarama yöntemi:** Yeni anahtar eklenirken grep ile mevcut anahtarları kontrol et — `cmn_malzeme_plastik` ve `cmn_yuzey_epoksi` gibi kategorileri atlama riski yüksek
- **str_replace ile patch ederken** karmaşık fonksiyon bloklarını TAMAMEN kopyala — yanlışlıkla bir `+colors[cls]+` gibi parçayı atlayarak bozmak kolay (bu oturumda bir kez yaşandı, hemen düzeltildi)
- **Deploy sıralaması önemli:** Önce lang+js (risksiz), sonra HTML (yeni davranış devreye girer) — ara aşama sorunsuz

---

## 11G. ÖNCEKİ OTURUM — 17 NİSAN 2026 (2. OTURUM)

### Bu oturumda tamamlananlar (MDrawer + Tema Context)

- **`mobile/src/lib/tema.jsx`** — TemaProvider + `useTema()` hook. localStorage entegreli, `data-theme` attribute'unu otomatik set eder
- **`mobile/src/components/MDrawer.jsx`** — sağdan açılan drawer:
  - Avatar (kamera ikonu ile fotoğraf yükleme hazırlığı, `foto_url` kullanımı)
  - Kullanıcı adı (Barlow Condensed) + email + rol/tenant badge
  - Profili Düzenle satırı
  - Tema toggle switch (☀/🌙)
  - Dil dropdown (🇹🇷 TR ▼) — 3 dil seçimi, ✓ ile aktif gösterimi
  - Çıkış butonu (kırmızı ghost)
- **`mobile/src/main.jsx`** — TemaProvider root'a eklendi
- **`mobile/src/index.css`** — `[data-theme=dark]` + `[data-theme=light-anthracite]` blokları
- **Dil sistemi tamamlandı:** 61 `m_*` anahtarı üç dilde senkron (tr/en/ar)
- **MAnasayfaYonetici + MIslemler** — hamburger butonu yerine profil butonu, `<MDrawer />` entegrasyonu
- **Mockup-first iş akışı kurumsallaştı** — MDrawer için 4 iterasyon, kullanıcı onayıyla ilerlendi
- **Supabase sorgusu düzeltildi** — `ad` yerine `ad_soyad`, tenant ayrı sorgu (RLS 400 sorunu)
- **RTL uyumu** — dil dropdown `insetInlineEnd` ile Arapça modunda doğru tarafa açılıyor
- **Git push + Vercel deploy** — canlıda (arespipe-mob.vercel.app)

### Yeni Kurallar (CLAUDE-MOBILE.md)

- **R-09: Tema Yönetimi** — sadece `useTema()` ile, direct DOM manipulation YASAK
- **R-10: Mockup-First Kuralı** — yeni ekran/component yazılmadan ÖNCE artifact mockup + onay

### Önemli Öğrenmeler

- **`kullanicilar.ad` diye kolon yok** — `ad_soyad` kullanılır
- **`kullanicilar.foto_url`** DB'de mevcut (text), upload UI henüz yok
- **`tenants(ad)` JOIN RLS ile 400 verebiliyor** — tenant adını ayrı sorguyla çek
- **CSS `[data-theme=dark]` tırnak kuralı mobilde de geçerli** — tırnaksız şart
- **Mobilde dark tema tanımlı değilse toggle sadece attribute'u değiştirir, UI değişmez** — `index.css`'te her iki tema bloğunu da eklemek gerekiyor

### Bekleyen (öncelik sırası)

1. **MProfil.jsx** — avatar yükleme + kişisel bilgi düzenleme (mockup-first)
2. **MIsBaslat.jsx** — operatör iş akışı (mockup-first, eski is_baslat.html'den)
3. **MDevreler, MDevreDetay, MSpoolDetay, MQRTara** (mockup-first)
4. Rol etiketi i18n mapping düzeltmeleri
5. Supabase Storage avatar upload implementasyonu
6. Dil dosyaları (web/mobil) senkronizasyon scripti

---

## 11H. ÖNCEKİ OTURUM — 17 NİSAN 2026 (1. OTURUM)

### Tamamlananlar
- **i18n altyapısı kuruldu:** `mobile/src/lib/i18n.jsx` (I18nProvider + useT), `mobile/src/lang/` (tr/en/ar)
- **MGiris.jsx** güncellendi — tüm metinler tv() üzerinden
- **Yetki DB düzenlemesi:**
  - Markalama, Malzeme, Sevkiyat, Raporlar, Kullanıcı Yönetimi, Tanımlar kendi gruplarına çıkarıldı
  - "Kaynak" bloğu "Argon Kaynağı" olarak yeniden adlandırıldı
  - Yeni "Gazaltı Kaynağı" bloğu eklendi
  - Her iki yeni bloğun `blok_sayfa_yetkileri` kayıtları mevcut Kaynak'ınkiyle aynı
- **Yetki mimarisi rafine edildi:** Grup = Buton, Blok = Teknik yetki varyantı
- **mobile/src/lib/yetki.js:** getKullaniciBloklari, getKullaniciGruplari, getGizliBolumler, sayfaErisimiVar, yoneticiMi
- **mobile/src/lib/gruplar.js:** Grup → ikon/renk/hedef/i18n haritası
- **MAnasayfa.jsx** router'a dönüştürüldü (role göre yönlendirir)
- **MAnasayfaYonetici.jsx** oluşturuldu (eski dashboard + İşlem Başlat butonu)
- **MIslemler.jsx** oluşturuldu (grup bazlı büyük butonlar, blokları dinamik çeker)
- **Supabase auth sorunu çözüldü:** `auth.users` tablosundaki NULL token kolonları boş string'e güncellendi
- **Supabase anon key değiştirildi:** JWT formatı (eyJ...) kullanılıyor
- **App.jsx güncellendi:** /islemler route'u + I18nProvider
- **Git push + Vercel deploy:** Hem web (arespipe.vercel.app) hem mobil (arespipe-mob.vercel.app) canlıda
- **End-to-end test edildi:**
  - Yönetici girişi → Dashboard + İşlem Başlat butonu ✅
  - Operatör girişi → Direkt İşlemler ekranı ✅
  - 6 buton (İmalat, Kesim, Markalama, Argon, Gazaltı, QR) ✅

### Önemli Öğrenmeler
- **RLS ve tenant_id:** `kullanici_bloklar`'a INSERT yaparken tenant_id belirtmek zorunlu, NULL bırakılırsa RLS filtreler ve blok görünmez
- **Sistem preset koruması:** `yetki_bloklari`'nda silme trigger'ı var — sistem presetleri silmek için bypass gerekir (veya yeniden adlandırma kullanılır)
- **Supabase publishable key ≠ anon key:** Publishable key auth için yeterli değil, tam erişim için JWT anon key gerekir
- **auth.users NULL kolonları:** Eski kullanıcıların confirmation_token vs. NULL kalabilir, güncel GoTrue bunu kabul etmez
