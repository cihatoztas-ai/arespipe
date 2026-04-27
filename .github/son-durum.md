# AresPipe — Son Durum

> **Son güncelleme:** 27 Nisan 2026 — 37. oturum kapandı
> **CI:** YEŞİL (0 hata, 22 uyarı)
> **Aktif oturum sayısı:** 37

---

## 37. Oturum Özeti

**Tema:** İzometri Batch Backend (sıfırdan) + Endüstri Malzeme Eşleme (hub-hazır)

**Toplam süre:** ~3 saat (yoğun, mimari + kod + DB + entegrasyon + test)

**Çıktılar:**
- `migrations/006a_yapi.sql` — 102 satır (3 yeni tablo + RLS + indexler)
- `migrations/006b_seed.sql` — 679 satır (4 ürün formu + 36 malzeme + 78 form-ASTM)
- `api/izometri-oku.js` — 827 satır (sıfırdan, ARES_BORU entegre, halüsinasyon korumalı)
- `son-durum.md` — bu güncelleme
- `CLAUDE-SON-OTURUM.md` — 37 detaylı arşivi
- `CLAUDE-SONRAKI-OTURUM.md` — 38 gündemi

**Önemli karar:** MILFIT BORU 2024 başucu kartı incelenip C+ planı uygulandı — endüstri malzeme tablosu **hem AresPipe iç dispatcher hem halka açık hub** için tek DB üzerinden çalışacak. Cihat'ın stratejik müdahalesi: *"sektördeki bir kullanıcı gelip aradığı veriyi bulamazsa tekrar gelmez."*

---

## Yapılan İşler — 37 Detayı

### Faz 1 — Açılış (~10 dk)
- 5 soruluk ritüel ✓
- 36 mimarisi canlı doğrulama: 358 / 12 / 180 / 1 / 0 / 0 (`boru_dn_isim_eslesme` 9 fazla — sürpriz değil, segment dağılımı 60/60/60)

### Faz 2 — MILFIT Kartı Analizi (~20 dk)
Cihat 2 görsel yükledi (boru et kalınlığı + malzeme karşılaştırma).
8 maddeli mimari sağlamlaştırmada eksik kalan kısımlar bulundu:
- E1 — DIN/EN Seri 1-8 verisi
- E2 — EN Seri ↔ ASME schedule köprüsü
- **E3 — Ürün formu ayrımı (boru/flanş/fitting) — kritik** ✓
- **E4 — Werkstoff No ↔ EN ↔ ASTM eşleme — kritik** ✓
- E5 — Malzeme alt-grubu sözlük

Karar: C+ (E3 ve E4 şimdi, E1 + E2 38'e). Hub vizyonu nedeniyle veri kapsamı genişletildi (50→78 form-ASTM eşleme).

### Faz 3 — Migration 006 (~30 dk)
İlk denemede tek dosya (848 satır) yapıldı, ASCII encoding sorunu yüzünden Supabase parser hata verdi.
**Ders:** Migration dosyalarında Türkçe karakter ve em-dash (—) kullanma. Yorumlar ASCII olmalı.

Çözüm: 2 dosyaya bölündü:
- `006a_yapi.sql` — 102 satır, sadece tablo yapısı + RLS + indexler
- `006b_seed.sql` — 679 satır, sadece INSERT'ler

İkisi de temiz çalıştı. Sonuç: 4 / 36 / 78.

### Faz 4 — Backend Yazımı (~45 dk)
`api/izometri-oku.js` sıfırdan yazıldı.

**Yapı (9 bölüm):**
1. Setup & constants (env vars, model fiyatlandırma, halüsinasyon eşikleri)
2. Ana handler (POST endpoint, validasyon, akış orkestrasyon)
3. Supabase helpers (batch CRUD, ai_api_log, token sayaçları)
4. Format dispatcher (fingerprint eşleme — şu an dosya adı, 38'de PDF metni)
5. Vision AI parser (Claude API + Yaklaşım Y prompt)
6. Yaklaşım Y prompt (6 kritik kural — uydurma yapma, pipeline_no dosya adıyla uyuşmalı vb.)
7. ASME helper entegrasyonu (ARES_BORU + boru_olculer fallback)
8. Halüsinasyon filtresi (7 madde — kritik/orta uyarı ağırlığı)
9. Maliyet hesabı (model başına input/output USD)

**Eski izometri-oku.js'ten korunanlar:** ERECTION vs FABRICATION ayrımı, yüzey işlemi keşfi, pipeline_no formatlama mantığı, spool sayısını köşeli parantez okuma. Bunlar 38'de format-spesifik prompt'a (parser_kural) taşınacak.

### Faz 5 — ARES_BORU Entegrasyonu (~15 dk)
Cihat ares-asme.js'i yükledi. **Önemli keşif:** dosya IIFE pattern'inde, 3 farklı export yöntemi var (window/module.exports/globalThis).
ESM ortamında doğru import: side-effect import + `globalThis.ARES_BORU`.

```js
import '../ares-asme.js';
const ARES_BORU = globalThis.ARES_BORU;
```

`boruOlcuBul` fonksiyonu helper-first (in-memory hızlı) + boru_olculer fallback (DIN/EN için).
Et tolerans için ayrı `boruEtTolerans` (et_min/et_max generated kolonlar boru_olculer'da).

### Faz 6 — Canlıya Çıkış + Test (~30 dk)
- Validasyon testi: `curl -d '{}'` → `400 tenant_id zorunlu` ✓
- Vercel Logs: 0 warning, 0 error → ARES_BORU temiz import edildi ✓
- PAOR PDF testi: ilk denemede `Supabase 400 durum_check` hatası

**Sebep:** 005 migration'da CHECK constraint izinli değerler `'parse_ediliyor', 'manuel_onay_bekliyor', 'tamamlandi', 'iptal', 'hata'` ve `format_durumu` için `'taraniyor', 'taninan', 'bilinmeyen'`. Ben kodda `'isleniyor'` ve `'tanindi'` kullanmıştım.

Düzeltildi: 4 noktada string değişti + bonus olarak son dosyada manuel onay varsa batch durumu `'manuel_onay_bekliyor'` (sadece `'tamamlandi'` değil).

İkinci PAOR testi: Anthropic API'ye gitti, ama **kredi yetersiz**. Backend kusursuz çalıştı, hata mesajı temiz parse oldu, Cihat'a anlamlı yanıt döndü.

**Sonuç:** Backend yapısal olarak %100 doğrulandı. Gerçek PDF→JSON çıktısı 38'in başında görülecek (kredi yüklendikten sonra).

---

## Yarım Kalan / 38'e Devir

1. 🔴 **Pre-A.1 — Yapısal güvenlik (A+B+C)** — magic byte + boyut + uzantı kontrolü. ~10 dk.
2. 🔴 **Pre-A.2 — Prompt injection koruması** — strict JSON schema + suspicious keyword scan. ~15 dk.
3. 🔴 **Pre-A.3 — Çoklu sayfa PDF dispatch (K12)** — `pdf-lib` + akıllı katmanlı (≤3/4-15/16+). ~45 dk.
4. 🟡 **PAOR PDF gerçek testi** — Anthropic kredisi yüklendikten sonra. test_paor.json zaten Cihat'ın Downloads'ında, curl komutu hazır.
5. 🔴 **Ekran 2 (manuel onay UI)** — `izometri-batch-incele.html` yeni dosya. ~1.5 saat.
6. 🔴 **Ekran 1 demo modu kapanışı** — `_DEMO_MOD = false`, mock data sil + çoklu sayfa progress bar. ~30 dk.
7. 🟡 **Format Kaydet (Ekran 3) — B Adımı** — AI harita önerisi + Cihat onay. 38 sonu veya 39.
8. 🟡 **Excel referansı (IFS) — Karar 7** — Eğitim modu opsiyonel destek. Cihat AresPipe_Izometri_2026-04-27.xlsx'i yükledi, 38'de kullanılacak.
9. 🟡 **DIN/EN Seri 1-8 verisi (E1)** + **EN Seri ↔ ASME köprüsü (E2)** — MILFIT kartının orta bloğu, ~200 satır INSERT.
10. 🟡 **006 ek malzemeler** — alaşımsız grup geri kalanı (St 35.8/I, P235GH TC1/TC2 vb.) + 1.4547 + 1.8972 + dogrulama_bekliyor 3 satırın doğrulanması.

---

## Aktif Borçlar — 38. Oturum Başında Dikkat

- 🔴 **38. oturum:** Kredi yükle → PAOR canlı test → Ekran 2 + demo kapatma. Belki 39'a bölünür.
- 🟡 **db-backup saat kontrolü** — 27 Nis bugün yapılmış (4 nisan ayı sonu kalan günler 28-30 Nis). Test devam ediyor.
- 🟡 **G-08 yaygınlaştırma** — 21 sayfa, devre_detay pattern hazır.
- 🟡 **Vercel ignoreCommand fix** — `vercel.json`.
- 🟡 **SBD-01 vs GitHub Issues kararı** — Cihat seçecek.

**Önceki dönemlerden devreden:**
- 🟢 `sorgula.js` JWT-bazlı auth refactor (güvenlik açığı)
- 🟢 Audit Log pano sekmesi
- 🟢 Tablo Render Standardı (G-06)
- 🟢 Operasyon sayfaları %100 — Kesim/Büküm/Markalama bitirme
- 🟢 Mobil sayfalar — MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- 🟢 G-05 CI lint kuralı
- 🟢 help.html
- 🟢 **G-09 — JS klasör refactor:** `ares-*.js` dosyaları kök dizinde. Sektörel standart `js/`. Yeni site açılınca uygun zaman.
- 🟢 **G-10 (36):** Eski `asme_borular` ve `cuni_borular` tabloları silinecek. Yeni `boru_olculer` aktif.
- 🟢 **G-11 (36):** Fitting ve flanş tabloları (~2000 satır, 9 standart kombinasyonu). 38-39 oturumlarında.
- 🟢 **G-12 (37 — yeni):** Migration dosyalarında ASCII disiplini. Türkçe karakter ve em-dash yorum içinde Supabase parser'ını şaşırtıyor.
- 🟢 **G-13 (37 — yeni):** Schema sorgusunu yapmadan INSERT pattern yazma. CHECK constraint'leri her zaman `pg_constraint`'ten kontrol et.

---

## Plan / Roadmap

| Oturum | Tema | Durum |
|---|---|---|
| 30 | Bucket PRIVATE Faz 1-2 | ✅ |
| 31 | Bucket PRIVATE Faz 3-6 + SED + G-08 envanter | ✅ |
| 32 | Defter temizliği — orphan, v5, S1, D5, D6 + D3/G-08 | ✅ |
| 33 | Vercel-bağımsız işler: self-test, D7, db-backup, D4 | ✅ |
| 34 | CI fix + D3 + db-backup + G-08 + İzometri Batch tasarım + Ekran 1 frontend | ✅ |
| 35 | ASME Lookup tam sistemi (B1 önkoşulu) | ✅ |
| 36 | Mimari sağlamlaştırma (8 madde) + İzometri Batch DB altyapı | ✅ |
| **37** | **Migration 006 (endüstri malzeme hub-hazır) + izometri-oku.js sıfırdan + ARES_BORU entegrasyonu** | **✅ KAPANDI** |
| **38** | **PAOR canlı test + Ekran 2 (manuel onay) + Ekran 1 demo kapatma + Pre-A güvenlik (K11) + çoklu sayfa (K12) + (kalırsa) Format Kaydet B Adımı** | **Sırada — ~6 saat** |
| 39 | C Adımı (görsel işaretleme — canvas) + genelleştirme bildirimleri + DIN/EN Seri verisi | — |
| 40 | Pilot AVEVA-PAOR canlıya alınır + super_admin "AI API Kullanım" sekmesi | — |
| **Yeni site** | **ASME hub sayfası** (`tools/asme-lookup.html` + `tools/malzeme-eslesme.html` halka açık) | Site kurulduktan sonra |

**40+ ÜRÜN DÖNEMİ.**

---

## Bu Oturumun Dersleri

1. **Hub vizyonu mimariyi büyüttü** — Cihat'ın "sektördeki kullanıcı veriyi bulamazsa tekrar gelmez" demesi C planını C+'ya çevirdi. Veri kapsamı 50 satırdan 78'e çıktı, malzeme tabloları hem iç dispatcher hem halka açık hub için tasarlandı. Tek DB, çift kullanım — Cihat'ın "kod değiştirmeden iş büyüsün" felsefesinin doğal uzantısı.

2. **ASCII disiplini migration'larda zorunlu (G-12)** — İlk 006 migration 848 satırdı, Türkçe karakter + em-dash yüzünden Supabase parser hata verdi. 2 dosyaya bölündü, ASCII'ye çevrildi, temiz çalıştı. **Pattern:** Migration yorumlarında em-dash yerine `--`, Türkçe karakter yerine ASCII karşılığı kullan.

3. **Schema kontrolü tahmin etmeye karşı (G-13)** — `izometri_batch_kayitlari.durum` ve `format_durumu` için CHECK constraint vardı, ben tahmin ederek `'isleniyor'` ve `'tanindi'` yazdım. Hata aldık. **Pattern:** Yeni tabloya INSERT yazmadan önce `pg_constraint`'ten CHECK kuralını kontrol et:
   ```sql
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'tablo_adi'::regclass AND contype = 'c';
   ```

4. **ESM/CommonJS interop için side-effect import** — ares-asme.js IIFE pattern'inde, sonunda `globalThis.ARES_BORU = api`. ESM modülde `import * from` çalışmadı çünkü dosya `module.exports` kullanıyor. Çözüm: side-effect import + globalThis'ten oku. Bu pattern AresPipe'taki diğer ares-*.js dosyaları için de geçerli (ileride api/'den çağrılırsa).

5. **Backend yapısal doğrulama ≠ uçtan uca test** — Anthropic kredisi yetmediği için PDF→JSON canlı testi yapılamadı. Ama backend tüm yolu yürüdü: validasyon → batch oluşturma → format dispatcher → Anthropic API isteği → hata yakalama → temiz response. Yapısal doğrulama %100 ama Yaklaşım Y'nin gerçek PDF üzerinde halüsinasyon koruduğunu kanıtlamadı. **38'in ilk işi.**

6. **CIHAT-PROFIL pattern doğrulandı** — Cihat strateji sorularıyla yön değiştirdi (MILFIT kartı incelemesi → C+ planı). Net karar talebi anlık verildi (1 c 2 a tek satırlık cevap). Aceleci olunca uzun ritüele direnmedi (curl çıktısını paylaşırken minimum yorum). Profil dosyası bu oturumda **canlı yararlı** oldu.

---

## Üretilen Dosyalar (5 toplam)

| Dosya | Tip | Boyut | İçerik |
|---|---|---|---|
| `migrations/006a_yapi.sql` | Yeni | ~5 KB | 3 tablo + 8 index + RLS, ASCII |
| `migrations/006b_seed.sql` | Yeni | ~25 KB | 4 + 36 + 78 INSERT, ASCII |
| `api/izometri-oku.js` | Yeniden yazıldı | ~32 KB / 827 satır | Sıfırdan, ARES_BORU entegre, halüsinasyon korumalı |
| `son-durum.md` | Güncelleme | — | Bu dosya |
| `CLAUDE-SON-OTURUM.md` | Yeni | — | 37 detaylı arşivi |
| `CLAUDE-SONRAKI-OTURUM.md` | Yeni | — | 38 gündemi |

---

## Mimari Kararlar (Toplam 6 yeni — K7-K12/37)

| # | Karar | Detay |
|---|---|---|
| **K7 (37)** | Hub-hazır endüstri malzeme tabloları | `endustri_urun_formlari` + `endustri_malzemeler` + `endustri_form_astm`. Tek DB, hem AresPipe iç hem halka açık hub. RLS: tüm tenant okur (public), super_admin yazar. |
| **K8 (37)** | MILFIT 2024 referansı | Veri kaynağı `kaynak = 'milfit-2024'`. Şüpheli satırlar `dogrulama_durumu = 'dogrulama_bekliyor'`. Hub açılmadan önce %100 doğrulama gerekecek. |
| **K9 (37)** | ASCII migration disiplini | Migration dosyalarında Türkçe karakter ve em-dash kullanma. CIHAT-PROFIL'e G-12 eklendi. |
| **K10 (37)** | ESM side-effect import pattern | ares-*.js dosyaları için `import '../ares-X.js'` + `globalThis.ARES_X` pattern. ares-store, ares-lang, ares-normalize için de kullanılacak (web tarafı). |
| **K11 (37)** | Zararlı PDF + prompt injection koruması | Mimari doğal bağışıklık (PDF sunucuda parse edilmiyor). Ek: magic byte + boyut + uzantı + JSON schema + keyword scan. 38 Pre-A.1 ve Pre-A.2. |
| **K12 (37)** | Çoklu sayfa PDF akıllı dispatch | ≤3 tek istek, 4-15 paralel, 16+ sıralı. `pdf-lib` ile sunucu-side bölme. 38 Pre-A.3. |

---

> Bu dosya GitHub'a yüklenince 37. oturum kapanmış sayılır.
