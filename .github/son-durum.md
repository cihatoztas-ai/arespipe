# AresPipe — Son Durum

> **Son güncelleme:** 27 Nisan 2026 — 36. oturum kapanışı (mimari oturumu)
> **Yaşayan dosya** — her oturum sonunda güncellenir.

---

## 36. Oturum Özeti — Mimari Sağlamlaştırma

**Tema:** Boru standart sistemi sağlam mimariye geçirildi (8 madde) + İzometri Batch DB altyapısı kuruldu + AI halüsinasyon kök nedeni tespit edildi.

**Süre:** ~3 saat. Mimari oturumu olarak temiz kapandı.

### Yapılanlar (4 ana iş)

1. **35 canlı doğrulama** — 358 satır + birim test 50/50 + CI yeşil ✅
2. **Boru standart mimarisi** — 8 madde, 3 yeni tablo, eski 35 verisi göç ettirildi
3. **İzometri Batch DB altyapısı** — 3 yeni tablo, RLS, pilot AVEVA-PAOR
4. **AI halüsinasyon teşhisi** — Cihat'ın yüklediği örnek üzerinden kök neden bulundu

### CI Durumu

🟢 **YEŞİL** — 0 hata, 22 uyarı, 74 dosya. (35 sonundan değişmedi, kod yazılmadı.)

### Kural Sayısı

14 aktif kural (35'ten değişmedi).

---

## 36. Oturumun Mimari Kararları (yeni)

- **K1 (36) — 8 madde sağlam mimari:** Boru ölçüleri için `boru_olculer` (yerine eski `asme_borular`/`cuni_borular` korunuyor şimdilik), `boru_standart_sozluk`, `boru_dn_isim_eslesme` tabloları. Schedule iki kolona ayrıldı (tipi + değeri), tolerans alanları eklendi, edisyon takibi, hesaplı kolonlar (ic_cap, hacim, yüzey alanı), hub içeriği (slug, açıklama, sektör).
- **K2 (36) — 12 standart sözlüğü:** ASME (3), ASTM (1), EEMUA (1), DIN, EN, JIS (2), GOST (2), GB/T (2). 4'ünde veri var, 8'i tanıma için hazır.
- **K3 (36) — Halüsinasyon koruması:** AI'ın PDF okurken uydurması (Cihat'ın PAOR örneğindeki gibi) DB seviyesinde tespit edilebilir. `dogrulama_uyarilari` JSONB alanı + 7 maddeli şüpheli satır kriterleri (DN yok, çap-DN tutarsız, et tolerans dışı, boy saçma, pipeline_no dosya adıyla uyuşmuyor, AI güveni düşük, malzeme bilinmeyen).
- **K4 (36) — Yaklaşım Y:** AI'a "uydurma" demek yerine "sadece yazılı olanı oku" diyeceğiz. Et/cap/ağırlık önce PDF'ten, yoksa ASME tablosundan, yoksa manuel onaya. Yeni `izometri-oku.js` 37'de bu mantıkla yazılacak.
- **K5 (36) — Eski izometri-oku.js atılacak, sıfırdan:** Cihat netti — "deneme için yapılmıştı, düzeltmeye uğraşmayalım." Karar 6 (refactor) iptal, K5 (sıfırdan) geçerli. AVEVA-PAOR pilot satırı parser_kural BOŞ olarak DB'de duruyor, 37'de gerçek PDF örneklerinden öğrenilerek dolacak.
- **K6 (36) — Çoklu standart genişleme stratejisi:** DIN, JIS, GOST, GB/T standartları sözlüğe önceden tanım eklendi (veri yok ama PDF'te tanınabilir). Veri eklenince satır INSERT, kod değişikliği yok.

---

## Yapılan İşler — 36 Detayı

### Oturum Açılışı (~5 dk)
- Standart 5 soruluk ritüel ✓
- 35 canlı doğrulama ✓ (yerel git stash gerektirdi — `ares-asme.js` ve `tests/asme-lookup.test.js` yereli güncel olmadığı için)
- Asıl beklenmedik: pull yaparken çakışma → stash → temiz pull
- Birim test 50/50 ✓

### Faz 1 — AI Sorunu Teşhis (~20 dk)

Cihat eski `izometri-oku.js`'i ve sistemin ürettiği yanlış Excel'i yükledi. PAOR PDF gerçek değerleri ile sistem çıktısı yan yana karşılaştırıldı:

| Alan | Doğru | Sistem | Durum |
|---|---|---|---|
| Pipeline | 52900-101540-Z10-2 | 11D-PAOR-50600-101540 | ❌ |
| DN | 150 | 100/150 (S01 yanlış) | ❌ |
| Çap | 168.3 | 114.3/168.3 | ❌ |
| Kalite | ST37 | P235GH/316L | ❌ |
| Boy | 149+141+379 | 1289/1314 | ❌ uydurma |
| Yüzey | Galvaniz | Siyah/Asit | ❌ |
| Rev | A | 0 | ❌ |

**Kök neden:** Few-shot leakage (prompt'taki örnek JSON'u kopyalamış) + AI'ın PDF okurken zorlandığında uydurması.

### Faz 2 — Yapı Sağlamlaştırma (~30 dk)

Cihat'ın stratejik sorusu: "Bu standartlar programın can damarı, eksik var mı?" → 8 madde tespit:
1. Tablo adı netleşsin (boru/fitting/flanş ayrı)
2. Standart sözlüğü zenginleşsin (ölçü sistemi + DN sistemi + materyal kodu)
3. NPS↔DN eşleme ayrı tabloda
4. Schedule kodu tek kolonda olmaz (tipi + değeri)
5. Tolerans alanları (et_min/et_max generated)
6. Edisyon takibi
7. Hesaplı kolonlar (ic_cap, hacim, yüzey alanı)
8. Hub içeriği (slug, açıklama, sektör)

8'in hepsi onaylandı, tek SQL'de uygulandı.

### Faz 3 — Boru Standart Migration (~30 dk)

İlk denemede kolon adı sürprizi: ben `od_mm` yazdım, gerçek `dis_cap_mm`. Ayrıca `olusturma_at` convention (ben `olusturma` yazdım). Cihat kolon listesini paylaştı, dosya v2 ile düzeltildi → temiz çalıştı.

### Faz 4 — İzometri Batch DB (~30 dk)

3 tablo: `izometri_format_tanimlari`, `izometri_batch_kayitlari`, `ai_api_log`. RLS düzgün, pilot AVEVA-PAOR satırı eklendi (parser boş, fingerprint dolu).

İlk denemede `BEGIN;` syntax hatası → BEGIN/COMMIT kaldırıldı, IF NOT EXISTS ile idempotent yapıldı → temiz çalıştı.

---

## Yarım Kalan / 37'ye Devir

1. 🔴 **Yeni `api/izometri-oku.js`** — sıfırdan, yaklaşım Y, format dispatcher, AI uydurma korumalı, yeni `boru_olculer` ile entegrasyon. ~1-1.5 saat.
2. 🔴 **Ekran 2 (manuel onay UI)** — şüpheli spool listesi + düzeltme inputları + "Format Kaydet" butonu. ~1 saat.
3. 🔴 **Ekran 1 demo modu kapanışı** — `_DEMO_MOD = false`, mock data sil, gerçek API'ye bağla. ~30 dk.
4. 🟡 **Cihat'tan 2-3 örnek PAOR/AVEVA PDF** — 37'de format kuralı (B Adımı) öğretmek için.
5. 🟡 **Format Kaydet diyalogu (Ekran 3)** — B Adımı (AI harita önerisi). 37'de eğer süre yetmezse 38'e.

---

## Aktif Borçlar — 37. Oturum Başında Dikkat

- 🔴 **37. oturum:** Yeni `izometri-oku.js` (sıfırdan) + Ekran 2 + Ekran 1 demo kapatma. Belki 38'e bölünür.
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
- 🟢 **G-10 (yeni — 36):** Eski `asme_borular` ve `cuni_borular` tabloları silinecek. 37+'da yeni helper canlıda doğrulandıktan sonra. Şimdi 35 helper'ı eski tablolara bakmaya devam ediyor.
- 🟢 **G-11 (yeni — 36):** Fitting ve flanş tabloları (~2000 satır, 9 standart kombinasyonu). 37-38 oturumlarında.

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
| **36** | **Mimari sağlamlaştırma (8 madde) + Izometri Batch DB altyapı** | **✅ KAPANDI** |
| **37** | **Yeni izometri-oku.js (sıfırdan, format dispatcher) + Ekran 2 (manuel onay) + Ekran 1 demo kapatma** | **Sırada** |
| 38 | Ekran 3 (Format Kaydet) — B Adımı (AI harita önerisi) + Excel upload + ZORUNLU SELF-TEST | — |
| 39 | C Adımı (görsel işaretleme — canvas) + genelleştirme bildirimleri | — |
| 40 | Pilot AVEVA-PAOR canlıya alınır + super_admin "AI API Kullanım" sekmesi | — |
| **Yeni site** | **ASME hub sayfası** (`tools/asme-lookup.html` halka açık, aynı DB'den canlı sorgu) | Site kurulduktan sonra |

**40+ ÜRÜN DÖNEMİ.**

---

## Bu Oturumun Dersleri

1. **Cihat'ın stratejik müdahalesi mimarinin yönünü değiştirdi** — "Bu standartlar can damarı, eksik var mı?" sorusu olmasa, ben ilk SQL'i (yetersiz) yapmış olacaktık. **Pattern:** Cihat hızlanmayı bırakıp doğru kurmak istiyor. Hızlı çıkış değil, sağlam çıkış.

2. **Convention öğrenmesi maliyetli** — Ben kolon adı tahmin ettim (`od_mm`), gerçek `dis_cap_mm`. Bu bir tur ekstra alıp götürdü. CIHAT-PROFIL.md'e convention listesi eklemek lazım.

3. **AI halüsinasyon kök nedeni teşhis edildi** — few-shot leakage + zorlandığında uydurma. Yaklaşım Y: AI'a sadece yazılı olanı oku, hesaplama kod tarafına. ASME helper bu yatırım için kuruldu (35).

4. **DB-driven mimari kanıtlandı** — Yeni standart eklemek = SQL INSERT, kod değişikliği yok. Cihat 12 standart sözlüğüne önceden tanım koydu, ileride veri eklenince anında çalışır.

5. **"Mimari oturumu" bilinçli karar** — Cihat C seçeneğini seçti (DB tablolarını şimdi, kodu 37'ye). Bu doğru karar: kod yazımına yorgun başlamak yerine, mimari net olarak 37'ye giriş.
