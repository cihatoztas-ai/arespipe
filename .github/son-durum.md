# Son Durum — 127. Oturum (27 Mayıs 2026)

> 126 → 127 geçişi. Devre Wizard "İnceleme & Onay" — kod-öncesi mimari kilitlendi + backend
> motoru (eşleştirme + 4-durum) yazıldı ve test edildi. Frontend (v3.html) 128'e.

---

## Bu Oturumun Sonucu

**127 başarıyla kapatıldı.** İnceleme & Onay'ın backend çekirdeği (kabuk × izometri eşleştirme +
spool başına 4-durum) yazıldı, gerçek canlı veriyle test edildi, geçti. Mevcut `devre_wizard.html`
(canlı, 4-panel) **bir karaktere dokunulmadı** — tüm yeni iş ayrı dosyalarda.

### Yapılanlar (sırasıyla)

1. **Kod-öncesi mimari kilitlendi (canlı kod doğrulamasıyla, MK-126.8):**
   - **B** — İnceleme canlı dolum: drenaj `ARES_IZO_DRENAJ.izometriDreneEt` `onIlerleme` ile döner,
     her PDF bitince tablo 🔴→🟢. Senkron bekleme yok.
   - **A** — İnceleme eşleştirmesi server-side okuma endpoint'i; kanonik primitifleri çağırır.
   - **İzolasyon (MK-127.2):** `devre_wizard_v3.html` + flag `devre_wizard_v3`, pilot **Demo Atölye**;
     v2 dokunulmaz. (Teyit: v2'de birleştirme/4-durum kodu yok — `grep` boş.)
   - **Tam-mirror eşleştirme (fallback yok):** dosya adından pipeline çıkmazsa parse.pipeline_no'ya
     dönülmez → İnceleme = terfinin birebir önizlemesi → terfide sessiz hata yok.
   - **A1:** 🟡 zayıf = AĞIRLIK+YÜZEY çelişkisi (`bindir`) + düşük güven. Et/çap çelişkisi 128'e.

2. **Canlı koddan doğrulananlar (`api/kuyruk-isle-izometri.js`, `lib/bindir.js`, `eslestirme-backfill.js`):**
   - `parse_sonuc` `devre_dokumanlari`'da YOK → `dosya_isleme_kuyrugu`'nda.
   - `resim_no` kolonu YOK → eşleşme anahtarı `normPipeline(dosyaAdiParse(dosya_adi))|normSpoolNo`.
   - İki eşleştirme yolu: spool çizimi (`devre_dokumanlari.spool_id`) + montaj (`montaj_json`, 1-çok).
   - `_eslesme` taslakta güvenilmez (M200 örneği: parse pipeline'ı biliyor ama `_eslesme` "atanmamis").
   - Primitifler export'lu (472-491); `bindir` `lib/bindir.js`'te SAF (DB yok). `backfill` bunları
     import ediyor → endpoint'in worker'dan import etmesi GÜVENLİ (kanıtlı).

3. **Yazılan + test edilen (hepsi YENİ dosya, canlıya sıfır dokunuş):**
   - `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) — v2 üstüne MK-126 deltası + MK-127.1..5 işlendi.
   - `lib/izo-eslesme.js` — saf 4-durum çekirdeği (DB/regex yok). Self-test ✅.
   - `api/devre-inceleme.js` — okuma endpoint'i (saf okuma, hiçbir şeye yazmaz). Çekirdek test ✅
     (G400/S01 → 🟡: Excel 24.956 kg vs PDF 26 kg = %4.2 → bindirme_flag yakalandı).

### 4-durum sinyalleri (MK-127.5, doğrulanmış)
🟢 okundu = ≥1 eşleşme + çelişki yok · 🟡 zayıf = `bindirme_flag` (ağırlık/yüzey) VEYA güven<0.7 ·
🔴 eksik = kabukta var, eşleşen izometri yok · 🟠 fazla = izometri anahtar üretti, kabukta yok
(VEYA anahtar çıkmadı → MK-124.1 ekranda görünür).

---

## Yeni MK Kararları (127)

| MK | Karar |
|----|-------|
| MK-127.1 | Çakışma kapısı: wizard'a dokunmadan önce omurga MK tablosu + son-durum borç + son 2 oturum taranır; çakışma → sessiz ilerleme yok |
| MK-127.2 | İzolasyon: `devre_wizard_v3.html` + flag `devre_wizard_v3`; v2 dokunulmaz; pilot Demo Atölye |
| MK-127.3 | A: İnceleme eşleştirmesi server-side okuma endpoint'i; kanonik primitifleri çağırır |
| MK-127.4 | Draft eşleştirme = okuma katmanı (spooller'a yazmaz); kanonik bağ terfide (mevcut matcher) |
| MK-127.5 | 4-durum sinyalleri (kabuk × izometri parse + `bindir` çelişki/güven) |

---

## CI Son Durum

- **Push'ta KOD var** (`lib/izo-eslesme.js`, `api/devre-inceleme.js`) → CI **çalışacak** (`[skip ci]` YOK).
- ⚠️ **Olası CI riski:** İki kod dosyası yorumlarda + self-test `console.log`'unda emoji (🟢🟡🔴🟠)
  içeriyor. CI kuralları bağlam-kör (yorum/kod ayırmaz). CI kırmızı yanarsa kozmetik — durum mantığı
  saf ASCII ('okundu'/'zayif'/'eksik'/'fazla'). Düzeltme hızlı (emojileri yoruma/string'den çıkar).
- Önceki yeşil korunuyordu; bu push CI'ı tetikleyecek, sonucu push sonrası görülür.

---

## 128'e Açık Borç (önceliğe göre)

1. **`devre_wizard_v3.html` iskelesi** — 2 adım, devre_detay tabanlı İnceleme, endpoint JSON render
   (frontend-design). Mockup v5 referans. Flag arkasında, canlıya alınmaz.
2. **B canlı dolum bağlama** — drenaj `onIlerleme` → `/api/devre-inceleme` yeniden çağrı.
3. **Devreler girişi** — "Devre Yükle" (yeni) + onay bekleyenler listesi (MK-126.4, yöneticiye açık).
4. **A2 (et/çap çelişki)** — client `grupla` çıktısına çap ekler (`capCikar`), endpoint et/çap bindir.
5. **Terfide yeniden-eşle kararı** — PDF yeniden parse (basit/israf) vs `parse_sonuc`'tan ucuz yeniden-eşle.
6. **MK-124.1** — `dosya_adi_regex` M200 desenini (`.S01.` segmentsiz) yakalamıyor (≥5 örnek, MK-51.2).
7. **K2 boş şablon** — `spool_no_sablonu` tablo yeri (kolonlar onaylı, üretim SheetJS).

**Wizard dışı (AYRI):** 117 (`yukleyen_id` null), web-spool sync (`aktif_basamak`/`ilerleme`),
fitting (DIN 86087 / ASME B16.9), `spool_dokumanlari` bağ tablosu bağlanmadı.

---

## Push Paketi (tek seferde)

| Dosya | Repo yolu | Tür |
|-------|-----------|-----|
| DEVRE-WIZARD-OMURGA.md | `docs/DEVRE-WIZARD-OMURGA.md` | doc (v2'nin yerine) |
| izo-eslesme.js | `lib/izo-eslesme.js` | **kod (yeni)** |
| devre-inceleme.js | `api/devre-inceleme.js` | **kod (yeni)** |
| son-durum.md | `.github/son-durum.md` | doc |
| CLAUDE-SON-OTURUM.md | `CLAUDE-SON-OTURUM.md` | doc |
| CLAUDE-SONRAKI-OTURUM.md | `CLAUDE-SONRAKI-OTURUM.md` | doc |

---

> 128. oturum açılışında bu dosya + `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) + `CLAUDE-SONRAKI-OTURUM.md`
> okunur. Sonra Cihat'a "Hangi işle başlayalım?" sorulur. Önerilen: v3.html iskelesi (frontend-design).
