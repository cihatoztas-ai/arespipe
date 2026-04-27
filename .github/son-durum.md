# AresPipe — Son Durum

> **Son güncelleme:** 27 Nisan 2026 — 38. oturum kapandı
> **CI:** YEŞİL
> **Aktif oturum sayısı:** 38

---

## 38. Oturum Özeti

**Tema:** Güvenlik sertleştirmesi (Pre-A) + PAOR canlı testi (Aşama A) + Manuel onay UI (Aşama B / Ekran 2)

**Toplam süre:** ~6 saat (Vercel sürpriz problemleri ile uzadı)

**Çıktılar:**
- `api/izometri-oku.js` — 962 satır (827 → 962, +135). Pre-A.1, Pre-A.2, Pre-A.4, Pre-A.5
- `izometri-batch-incele.html` — 854 satır (yeni dosya, manuel onay UI)
- `lang/tr.json` — 1592 anahtar (1512 → 1592, +80) **(henüz commit'lenmemiş, teknik borç)**
- `lang/en.json` — 1592 anahtar
- `lang/ar.json` — 1592 anahtar
- `vercel.json` — `ignoreCommand` geçici devre dışı
- `migrations/006_endustri_yapi.sql` (rename: 006a) ve `migrations/007_endustri_seed.sql` (rename: 006b)

**Önemli karar:** Manuel onay UI dikey akordeon + 5 stat kartı + 12 sütunluk profesyonel BOM tablosu. Sertifika alanı ayrı (3.1/3.2/PMI rozetleri), sil butonu satır bazında, ağırlık altyapısı turuncu işaretleme için hazır.

---

## Yapılan İşler — 38 Detayı

### Faz 1 — Açılış Ritüeli (~10 dk)
- 7 soruluk ritüel (38'e özel kredi + backend sağlık ek soruları)
- CI yeşil, kredi var, magic byte testi geçti
- Migration isim çakışması farkedildi: `006a_yapi.sql` ve `006b_seed.sql` regex'e (`^\d{3}_.+\.sql$`) takılıyordu — kırmızıydı

### Faz 2 — CI Düzeltmesi (~5 dk)
- Karar: dosyaları yeniden adlandır (B seçeneği) — 006'yı 006/007 yap
- Sebep: ASCII sınırı (G-12 dersi) gelecekte yine bölme zorunluluğu yaratabilir, ama o zaman kalıcı regex genişletmesi yapılır
- 39'a teknik borç: regex genişletme (`^\d{3}[a-z]?_.+\.sql$`)

### Faz 3 — Pre-A.1 + Pre-A.2 (~25 dk)
**Pre-A.1 — PDF yapısal güvenlik:**
- Uzantı (.pdf), boyut (≤7MB base64 ~ 5MB PDF), magic byte (`%PDF`) kontrolü
- Anthropic kredisi yanmadan erken döner
- Canlı test: `{"error":"PDF formatinda degil (magic byte uyusmadi)"}` ✓

**Pre-A.2 — Prompt injection koruması:**
- Schema validation (yabancı kök alan log)
- Suspicious keyword scan: `auth.users`, `DROP TABLE`, `system_prompt`, `ignore previous`, vb.
- Spool sayısı sanity (>200 reddet)
- Halüsinasyon filtresine **madde 8** eklendi: `uyari_prompt_injection: true` → kritik uyarı

### Faz 4 — PAOR Canlı Testi (Aşama A) (~5 dk)
İlk gerçek PDF→JSON çıktısı 37'den beri bekliyordu. **Sonuç temiz:**
- `ok: true`, `spool_sayisi: 2`, `pipeline_no: "52900-101540"` (halüsinasyon yok)
- `et_mm: 7.11, et_kaynagi: "ares_boru (SCH 40)"` — **Yaklaşım Y kanıtlandı**
- AI notu: *"PIPE CUT-LENGTHS tablosunda 4 kesim parcasi (TUBE-150, TUBE-200) goruldu ancak bunlar spool sayisi degil"* — prompt'a uydu, kesim parçalarını spool sanmadı
- Maliyet: $0.0296

### Faz 5 — Pre-A.4 (~30 dk)
**Asıl mesele:** `ai_api_log` tablosuna 37'de hiç kayıt yazılmamıştı. Sebep tahmini RLS'ti, ama:
- RLS açık ama INSERT policy `with_check = true` (herkese açık)
- Gerçek sebep: **CHECK constraint uyumsuzluğu**
  - `cagri_tipi` kolonu CHECK: `('L1_regex' | 'L2_haiku' | 'L3_vision')` izinli
  - Kod yazıyor: `'vision_pdf_parse'` — REDDEDİLİYOR
  - Aynı şekilde `kaynak`: `'izometri_oku' | 'format_taniyici' | 'b_adim_oneri' | 'genel'` izinli, kod `'izometri-batch'` yazıyor

**Çözüm:** Kodu CHECK'e uydur. 4 çağrı noktasında `kaynak: 'izometri-batch'` → `'izometri_oku'`, `cagri_tipi: 'vision_pdf_parse'` → `'L3_vision'`.

**Sonuç:** İlk gerçek `ai_api_log` kaydı yazıldı → `kaynak: izometri_oku, cagri_tipi: L3_vision, basarili: true, http_status: 200, $0.0296`. Süper admin AI Kullanım sekmesi için veri akmaya başladı.

### Faz 6 — Aşama B / Ekran 2 (~1.5 saat — yazım + 1.5 saat Vercel uğraşı)
**`izometri-batch-incele.html` sıfırdan yazıldı** (devre_detay paterninden uyarlandı):
- 5 stat kartı (Toplam, Hazır, Manuel, Hata, AI Güven)
- Filtre tabları (Hepsi/Manuel/Hazır/Hata, sayaçlı)
- **Dikey akordeon** spool kartları (Cihat'ın seçimi: A + 5 kart)
- 8 form alanı (DN/Çap/Et/Boy/Malzeme EN+ASTM/Yüzey/Rev) düzenlenebilir
- Aksiyon: Onayla / Reddet (modal) / Geri Al
- Toplu Onay (kritik uyarısı olmayanlar)
- Sabit alt bar (Tümünü Onayla + Devre/Spool Oluştur — placeholder 39)

**Vercel sürprizi (~1.5 saat zaman kaybı):**
- Ekran 2 commit'lendi ama Vercel build atladı
- Sebep: `vercel.json`'daki `ignoreCommand` mantığı — eski deploy'larda `40a93f2` (üzerinde, "Current") olarak kaldı
- Önce empty commit denendi → işe yaramadı
- GitHub-Vercel webhook listesi boş (App entegrasyonu kullanıyor — webhook görünmez)
- Çözüm: `vercel.json` içindeki `ignoreCommand` satırını **geçici devre dışı** bırakıldı (yer tutucu satır)
- Sonra Settings/Git'te Disconnect/Reconnect yapıldı (bağlantı yenilendi)
- Sonunda: `802 / 854 / 962` satır canlıda

**Kalıcı düzeltme:** `vercel.json`'daki ignoreCommand mantığının doğru regex ile yeniden yazılması — 39 oturumuna borç.

### Faz 7 — Cihat Geri Bildirimi + Pre-A.5 (~50 dk)
Mola sonrası Cihat `spool_detay.html`'i referans gösterdi: 12 sütunlu profesyonel BOM tablosu istedi.

**Karar matrisi (1a 2b):**
- **1a — Sertifika alanı ayrı sütun:** AI prompt'una `sertifika_tipi` (3.1/3.2/PMI/null) + `malzeme_notu` (serbest metin)
- **2b — Sil butonu (b şıkkı):** Her satırda ✕, AI yanlış satır eklerse silebilir, Excel import yok
- **Heat No tablodan çıkarıldı:** Operatör manuel onayda Heat No bilmez
- **Spool numarası NB138... formatı:** Eski parser'da yok, teknik borç
- **Ağırlık:** Bugün PDF'ten yazılı olanları siyah göster, hesap altyapısı (`agirlik_kaynagi` field'ı) hazır — boru/fitting ağırlık tabloları geldiğinde turuncu otomatik devreye girecek

**Pre-A.5:**
- AI prompt'unda `malzeme_listesi` yapısı 4 alandan **12 alana** çıktı: kod, kategori, tanim, malzeme, kalite, dis_cap_mm, et_mm, boy_mm, adet, agirlik_kg, agirlik_kaynagi, sertifika_tipi, malzeme_notu
- Spool seviyesinde `kalite` alanı eklendi
- Prompt sonuna 7 maddeli özel talimat (uydurma yasakları)
- Frontend BOM tablosu yeniden yazıldı, ARES_NORM her yerde, 14 yeni i18n anahtar

### Faz 8 — i18n Genişletme (~15 dk)
- `tr.json`: 80 yeni anahtar (66 izbi_* + cmn_tamam + 14 izbi_bom_*) → 1592 toplam
- `en.json`: 80 yeni anahtar İngilizce çeviri → 1592 toplam
- `ar.json`: 80 yeni anahtar Arapça çeviri → 1592 toplam

**Not:** `tr.json` web yüklemesi henüz yapılmadı — 38 borcu (lint uyarı, hata değil, sayfa fallback ile çalışıyor).

---

## Pilot Hattı Durumu (38 Sonu)

| Aşama | Tanım | Durum |
|---|---|---|
| **Pre-A.1** | PDF yapısal güvenlik | ✅ Canlı, test edildi |
| **Pre-A.2** | Prompt injection koruması | ✅ Kodda, gerçek injection geldiğinde devreye girer |
| **Pre-A.3** | Çoklu sayfa dispatcher | ❌ 39'a |
| **Pre-A.4** | ai_api_log CHECK uyumu | ✅ İlk kayıt yazıldı |
| **Pre-A.5** | BOM yapısı genişletme + sertifika | ✅ Backend + frontend canlı |
| **A** | PAOR canlı testi | ✅ 2 spool, halüsinasyon yok, $0.0296 |
| **B** | Ekran 2 manuel onay UI | ✅ Canlı, 12 sütunlu BOM, sil butonu |
| **C** | Ekran 1 demo modu kapatma + İncele linki | ❌ 39'a |
| **D** | i18n eksiklerini topluca toplama | 🟡 Kısmen (yeni anahtarlar eklendi, eski I18N_EKSIK uyarıları hâlâ var) |

---

## Açık Borçlar (39 ve Sonrasına)

### Yüksek Öncelik (39 Başında)
1. **`tr.json` web yükleme** — 80 yeni anahtar `lang/tr.json`'a eklenmiş ama commit'lenmemiş. Web upload ile çözülür (5 dk). Şimdilik sayfa fallback metinlerle çalışıyor.
2. **Aşama C — Ekran 1 demo modu kapatma + İncele linki** — Kullanıcı yeni batch oluşturduğunda Ekran 2'ye gitmesi için "İncele →" butonu gerekli (~40 dk).
3. **Aşama D — i18n eksiklerini topla** — CI'da hâlâ ~30 I18N_EKSIK uyarısı var (devre_detay, izometri-batch, spool_detay). Toplu temizlik gerekli.

### Orta Öncelik (39'da Yapılabilir)
4. **`vercel.json` ignoreCommand kalıcı düzeltme** — Şu an devre dışı, build her commit'te tetikleniyor (gereksiz çalışıyor ama zarar yok). Doğru regex: `git diff HEAD^ HEAD --quiet -- ':(exclude).github' ':(exclude)docs' ':(exclude)*.md'` (mevcut hali aslında doğru, ama logic karışık olabilir — yeniden test edilmeli).
5. **Pre-A.3 çoklu sayfa dispatcher** — 16+ sayfa kenar durumu için pdf-lib ile bölme. Şu an PAOR (3 sayfa) zaten çalışıyor. Üretimde 50 sayfa izometri yok.
6. **Migration regex genişletmesi** — `^\d{3}[a-z]?_.+\.sql$` (006a, 007b vb. sıralı bölmelere izin ver).
7. **Devre/Spool Oluştur endpoint'i** — Ekran 2'deki buton şu an placeholder modal. `/api/izometri-onayla` endpoint'i yazılacak: onaylanan spool'lar `devre_kayitlari` + `spool_kayitlari` tablolarına dönüştürülecek.

### Düşük Öncelik (40+ Oturuma)
8. **Spool numarası NB138... formatı** — Tersane içi kodlama formatı. Cihat'tan tam format alınacak. Düzeltme yeri: AI prompt + `spool-head-baslik` render.
9. **Boru ağırlık tablosu** — DN×SCH→kg/m. Tedarik edilecek.
10. **Fitting ağırlık tablosu** — DN×tip×malzeme→kg. Tedarik edilecek.
11. **Ağırlık otomatik hesap + turuncu işaretleme** — Tablolar gelince hızlı (1 saat). Frontend altyapısı hazır.
12. **Eski izometri-oku.js'in bazı zenginlikleri** — FABRICATION/ERECTION ayrımı, DPN kodu, çap dönüşüm tablosu. 37'de sıfırdan yazılırken kayboldu. Prompt zenginleştirme borcu.
13. **Tekrar Parse butonu** — Manuel onayda AI'ya tekrar sor. Kredi yakacağı için dikkatli düşünülmesi gereken bir özellik.

### Hub Vizyonu (Site Kurulduktan Sonra)
14. **ASME hub sayfası** — `tools/asme-lookup.html` + `tools/malzeme-eslesme.html` halka açık (37'den geliyor)

---

## 40+ Ürün Yol Haritası (37'den Devam)

| Oturum | İş | Durum |
|---|---|---|
| 38 | Pre-A güvenlik + Aşama A canlı + Aşama B Ekran 2 + Pre-A.5 BOM | ✅ TAMAM |
| 39 | Aşama C demo kapatma + Aşama D i18n + Pre-A.3 çoklu sayfa + Format Kaydet B | — |
| 40 | Pilot AVEVA-PAOR canlıya alınır + super_admin "AI API Kullanım" sekmesi | — |
| **Yeni site** | **ASME hub sayfası** (`tools/asme-lookup.html` + `tools/malzeme-eslesme.html` halka açık) | Site kurulduktan sonra |

---

## Bu Oturumun Dersleri

1. **Yanlış dosya yüklemesi felaket potansiyeli** — `mv ~/Downloads/izometri-oku.js` komutu Downloads'ta eski bir versiyonu kapıp `api/izometri-oku.js` üzerine yazdı (827 satır → 232 satır). Lokal'de fark edildi (`wc -l`), commit edilmeden geri alındı (`git reset --soft HEAD~1` + `git checkout origin/main`). **Pattern:** Yeni isimle dosya teslim et (`EKRAN2-incele-v1.html` gibi tarihli isim), `mv` öncesi `wc -l` ile boyut kontrolü, `git diff --stat` ile insertion/deletion sayılarını **commit etmeden önce** doğrula. Felaket sayıları (`792 deletions`) görünce commit'leme, geri al.

2. **CHECK constraint kontrolü zorunlu (G-13 yaygınlaştırması)** — `ai_api_log.cagri_tipi` ve `kaynak` kolonlarında CHECK constraint vardı, ben kod yazarken kontrol etmedim. RLS sandım, gerçekte CHECK uyumsuzluğu olduğu çıktı. **Pattern:** Yeni tabloya yazan fonksiyon yazmadan önce sadece şema değil, CHECK ve enum sınırlarını da kontrol et. 39'da `docs/SCHEMA-CHECKS.md` özet dosyası açılabilir.

3. **Vercel ignoreCommand mantık tuzağı** — `git diff HEAD^ HEAD --quiet -- :(exclude)... && exit 0 || exit 1` mantığı kafayı karıştırıyor. Empty commit ile bypass yapılamadı. Sonunda komutu devre dışı bıraktık. **Pattern:** Vercel build mantığı için `--prod` flag, manuel redeploy butonu, `ignoreCommand` regex'i — üçü de farklı kuralla çalışıyor. 39'da kalıcı çözüm.

4. **GitHub-Vercel webhook ≠ webhook listesi** — Vercel App entegrasyonu kullanıyor, GitHub Settings/Webhooks'ta görünmüyor. Settings/Installations'ta "Vercel" altında. Disconnect/Reconnect Settings/Git üzerinden yapılır. Env vars proje seviyesinde, git bağlantısından bağımsız.

5. **Yaklaşım Y kanıtlandı** — PAOR canlı testinde AI et kalınlığını PDF'te bulamadı, `null` bıraktı, kod ARES_BORU'dan SCH 40 = 7.11mm doldurdu. AI uydurmadı, sistem hesap yaptı. AI notunda *"kesim parçaları spool sayısı değil"* yazdı — prompt'a uydu. K4/36 kararı yaşıyor.

6. **Cihat'ın stratejik geri bildirimi** — Mola sonrası `spool_detay.html` ile karşılaştırarak BOM tablosunu profesyonelleştirme talebi. "Heat No çıkar, sertifika ekle, ağırlık altyapısını şimdi hazırla" — 1a 2b tek satır karar. Ağırlık altyapısının **şimdi hazırlanması** önemli: tablolar geldiğinde kod değişikliği gerektirmeyecek, sadece veri eklenecek. Cihat'ın "kod değişmeden iş büyüsün" felsefesinin doğal uygulaması.

7. **CIHAT-PROFIL pattern tekrar doğrulandı** — Vercel uğraşırken Cihat sabırlı kaldı, ama "kafam karışıyor" dediğinde direkt en hızlı yola gidildi (web upload). Karar talebi anlık (1a 2b), uzun ritüele direnmedi (curl çıktısı yapıştır, devam). Profil dosyası bu oturumda **tekrar canlı yararlı**.

---

## Üretilen Dosyalar (8 toplam)

| Dosya | Tip | Boyut | İçerik |
|---|---|---|---|
| `api/izometri-oku.js` | Genişletme | 962 satır | +135 satır: Pre-A.1 + Pre-A.2 + Pre-A.4 + Pre-A.5 |
| `izometri-batch-incele.html` | **Yeni** | 854 satır | Manuel onay UI (devre_detay paterni) |
| `lang/tr.json` | Güncelleme | 1592 anahtar | +80 anahtar (66 izbi_* + cmn_tamam + 14 izbi_bom_*) **— web upload borçlu** |
| `lang/en.json` | Güncelleme | 1592 anahtar | +80 İngilizce çeviri |
| `lang/ar.json` | Güncelleme | 1592 anahtar | +80 Arapça çeviri |
| `vercel.json` | Geçici | — | `ignoreCommand` devre dışı (kalıcı fix 39'a) |
| `migrations/006_endustri_yapi.sql` | Rename | 102 satır | (eski 006a, isim formatı uyumu için) |
| `migrations/007_endustri_seed.sql` | Rename | 679 satır | (eski 006b) |
| `son-durum.md` | Güncelleme | — | Bu dosya |
| `CLAUDE-SON-OTURUM.md` | Yeni | — | 38 detaylı arşivi |
| `CLAUDE-SONRAKI-OTURUM.md` | Yeni | — | 39 gündemi |

---

## Mimari Kararlar (Toplam 3 yeni — K13-K15/38)

| # | Karar | Detay |
|---|---|---|
| **K13 (38)** | Manuel onay UI dikey akordeon (A pattern) | Tablo + drawer (B pattern) yerine. Sebep: operatör akışı, mobil uyum, hazır CSS sınıfları, filtre tabı ile uzun liste yönetimi. 50+ spool nadir, B pattern sapması yok. |
| **K14 (38)** | BOM tablosu spool_detay paterni + sertifika ayrı sütun | 12 sütun: # / Kod / Kategori / Açıklama / Malzeme / Kalite / Dış Çap / Et / Boy / Adet / Ağırlık / Sertifika / Not / [✕]. Heat No yok (operatör bilmez). Sertifika rozetli (3.1 mavi, 3.2 turuncu, PMI yeşil). |
| **K15 (38)** | Ağırlık `agirlik_kaynagi` field'ı (turuncu altyapı) | `agirlik_kg` her zaman var, kaynağı `pdf` ise siyah, `hesap` veya `tablo` ise turuncu + yıldız. Bugün hep PDF (siyah), tablolar geldiğinde otomatik turuncu. K4/36 (Yaklaşım Y) genişletmesi. |

---

> Bu dosya GitHub'a yüklenince 38. oturum kapanmış sayılır.
