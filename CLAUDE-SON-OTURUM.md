# Oturum 127 — Devre Wizard "İnceleme & Onay": kod-öncesi mimari + backend motoru

**Üretim kodu yazıldı (yeni dosyalar) ama canlıya alınmadı.** Mevcut `devre_wizard.html`'e sıfır
dokunuş. Çekirdek (eşleştirme + 4-durum) gerçek veriyle test edildi, geçti. Frontend (v3.html) 128'e.

## Bağlam

- Ritüel: git temiz, HEAD `1508742 docs(125)`. Omurga repo'da **v2** — v3 deltası (`OMURGA-GUNCELLEME-126.md`)
  henüz işlenmemiş. Bu oturumda v3.1 olarak işlendi.
- Cihat'ın yön çizgisi: "Tersan'ı dört dörtlük oturt → diğer formatları üstüne." + "mevcut wizard
  kurallarını bozmadan yeni tasarımı üstüne giydir." + tekrar tekrar: "burası programın kalbi,
  dikkatli olalım, geçiştirmeyelim, teknik olarak en doğru neyse onu yap."

## Verification-first zinciri (MK-126.8 ruhu — her karar canlı koddan doğrulandı)

1. **Mevcut `devre_wizard.html` (1505 satır) okundu.** DOM sözleşmesi + KORUMA-1 çağrı yüzeyi çıkarıldı:
   panel/step, `selProje/dropZone/dosyaTbody/kabukOnayAlani/btnKabukOnayla/.kabuk-spool-cb`,
   `ARES_KABUK.aktar/grupla`, `ARES_NORM`, `ARES_IZO_DRENAJ.izometriDreneEt({filtre:{devreId},onIlerleme})`.
   `kabukTabloHtml` Alıştırma sütununu sabit "— (PDF bekliyor)" basıyor → birleştirme yok.
2. **Şema:** `devre_dokumanlari`'da `parse_sonuc` YOK, `spool_id` VAR. `resim_no` hiçbir tabloda yok.
   Güven dağınık: `ai_api_log.parser_seviye` + `ai_analizler.guven`.
3. **`api/kuyruk-isle-izometri.js` eşleştirici:** iki yol — spool çizimi (`spool_id` yazar) + montaj
   (`montaj_json`, 1-çok, `spool_id` yazmaz). Anahtar `normPipeline(dosyaAdiParse(dosya_adi))|normSpoolNo`.
   `spooller`'dan okuyor → **terfi sonrası** çalışır.
4. **Canlı veri (SQL):** `_eslesme` taslakta güvenilmez — M200 örneğinde parse `pipeline_no` dolu ama
   `_eslesme` "dosya_adi_pipeline_yok" demiş (dosyaAdiParse `.S01.` segmenti istiyor, M200'de yok).
   G400 örneğinde `bindirme_flag:true` (ağırlık %4.2) — gerçek 🟡 sinyali.
5. **`dosyaAdiParse`/`montajDosyaKok` regex'leri** + **`lib/bindir.js`** (saf, DB yok) okundu.
   `eslestirme-backfill.js` worker'dan `eslestir/normPipeline/normSpoolNo/dosyaAdiParse` import ediyor
   → endpoint'in worker'dan import etmesi GÜVENLİ (kanıtlı). `bindir` `lib/bindir.js`'ten import'lu.

## Kilitlenen kararlar (MK-127.1..5)

- **B** (İnceleme canlı dolum, drenaj `onIlerleme`) + **A** (server-side okuma endpoint).
- **İzolasyon:** `devre_wizard_v3.html` + flag `devre_wizard_v3`, pilot Demo Atölye, v2 dokunulmaz.
- **Tam-mirror eşleştirme:** dosya adından pipeline çıkmazsa fallback YOK → İnceleme = terfi önizlemesi.
  M200 dürüstçe 🟠 (sebep ekranda) → terfide sessiz hata riski yok. MK-124.1 borcu görünür kılınır.
- **A1:** 🟡 = ağırlık+yüzey çelişkisi (`bindir`) + güven<0.7. `kritik_uyari` 🟡 yapmaz (Tersan'da
  her PDF'te DN yok = gürültü). Et/çap çelişkisi 128'e (kabuk çapı client'tan gelince).

## Yazılanlar (yeni dosyalar)

| Dosya | Ne | Test |
|---|---|---|
| `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) | v2 + MK-126 deltası + MK-127.1..5 + canlı kod uzlaştırmaları | — |
| `lib/izo-eslesme.js` | Saf 4-durum çekirdeği (DB/regex/yan-etki YOK), kanonik primitifleri DIŞARIDAN alır | self-test ✅ |
| `api/devre-inceleme.js` | Okuma endpoint'i: kuyruk izometri parse'ı çek → `izometrileriDerle` → `incelemeTablosu`; SAF OKUMA | çekirdek test ✅ |

**Test (gerçek M200+G400 verisiyle):** `🟡 G400/S01 [L2, güven 1, ÇELİŞKİ]` (bindir %4.2 ağırlık) ·
`🔴 G400/S02` (izometri yok) · `🔴 M200/S01` · `🟠 M200-355C-355-ALS.1.pdf → dosya_adi_pipeline_yok` ·
özet `{toplam:3, zayif:1, eksik:2, fazla:1, isleniyor:1}`. Beklenenle birebir.

## Mimari net (canlı koddan)

- **Kabuk:** CLIENT'ta kanonik `ARES_KABUK.grupla` ile türetilir (yeni kopya yok; `kabukTuret` v3'te
  kullanılmaz → İnceleme'de gördüğün = terfide INSERT edilen). Endpoint'e `kabuk_spoollar` olarak gider.
- **Eşleştirme:** SERVER endpoint, worker primitiflerini + `bindir`'i import eder. İzometri
  `parse_sonuc` `dosya_isleme_kuyrugu`'ndan okunur. Hiçbir şeye yazmaz.
- **Dokunulmayanlar:** `ares-kabuk.js` INSERT yolu, `ares-normalize/olcu`, `izometri-oku.js` (MK-49.1),
  `kuyruk-isle-izometri.js` (sadece import), devre_detay. → sıfır regresyon yüzeyi.

## Hatalar & düzeltmeler (bu oturum)

- İlk turda "çapa = `spool_id`" demiştim; `grep` montaj yolunun `montaj_json` kullandığını gösterince
  düzelttim (sadece `spool_id`'ye bakan birleştirme montaj spool'larını yanlış 🔴 yapardı).
- İlk turda kabuk için "2a (endpoint kendi türetir)" önermiştim; `ares-kabuk.js`'in browser-global +
  ESM-değil olduğunu görünce "2b-grupla (client kanonik grupla, yeni kopya yok)"ya çevirdim — isomorphic
  refactor riskinden kaçındık.
- İlk turda endpoint için "worker'a primitif taşıma refactor'u" gerekebilir demiştim; `backfill`'in
  zaten import ettiğini görünce gereksiz olduğu anlaşıldı (sıfır worker dokunuşu).

## Süreç notu

Cihat birkaç kez "arka planı göremiyorum, sana güvenmek zorundayım" dedi. Buna karşılık her karar
küçük, kendisinin doğrulayabileceği kontrollere bağlandı (tek SQL, grep, çalıştırılabilir self-test).
v3.html ve endpoint'in DB'ye dokunan kısmı 128'de canlı testle doğrulanacak — sayfa pilot bitene
kadar canlıya ALINMAZ.

---

> 128 açılışında: `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) + `son-durum.md` + `CLAUDE-SONRAKI-OTURUM.md` oku.
> İlk iş önerisi: `devre_wizard_v3.html` iskelesi (frontend-design, mockup v5 referans).
