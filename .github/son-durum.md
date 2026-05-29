# Son Durum — 135. Oturum (29 Mayıs 2026)

> v3 İnceleme **K2 malzeme rozeti** tamamlandı (baş iş): `api/devre-inceleme.js`'e A2 enjeksiyonu
> (`_eslesme.detay[]` → spool, lib SAF kaldı) + `izoCell` 🟡 rozet + `duzeltAc` malzeme kıyası bölümü.
> Canlı lambda teyidi yapıldı (`/api/devre-inceleme` → `malzeme_flag:true`, dirsek çelişki + flanş montaj).
> **Dirsek bulgusunun kökü çözüldü** (MK-135.2): PDF doğru, Excel BOM hatalı — K2 bug değil, gerçek
> yakalama. Kozmetik: izo-eslesme self-test yorumu düzeltildi. Yeni endpoint yok (12/12), MK-49.1 korundu.

---

## Açılış

- git temiz, origin senkron, function 12/12. Adım 0: `5e9b0ec` (134 kod) CI'den geçmişti — kanıt araya
  giren `ed2b37f` ci-son-rapor commit'i. MK-134.1 sırası doğru.
- Patch öncesi 5 kaynak okundu (körlemesine yazma yok): `devre-inceleme.js`, `lib/izo-eslesme.js`,
  `lib/malzeme-kiyas.js`, `kuyruk-isle-izometri.js` (_eslesme.detay şeması), `uyarilar.html` (mirror).

## Yapılanlar (sıra)

### 1. v3 İnceleme K2 malzeme rozeti — BAŞ İŞ ✅ (Seçenek A2)

- **Karar A2 (MK-135.1):** Enjeksiyon **handler katmanında**; `lib/izo-eslesme.js` saf çekirdek olarak
  KORUNDU (A1 lib'i kirletirdi — reddedildi). `_eslesme.detay[]` worker'da hazır; endpoint
  `normPipeline|normSpoolNo` anahtarıyla `sonuc.spoollar[]`'a `malzeme_flag`+`malzeme_kiyas` iliştirir.
  Yeniden hesaplama yok, ek sorgu yok (endpoint parse_sonuc'u zaten çekiyor).
- **`api/devre-inceleme.js`:** handler'da incelemeTablosu sonrası malzeme haritası + spool iliştirme +
  `ozet.malzeme_flag`. Bir spool'a çok izometri düşerse flag'li kazanır.
- **`devre_wizard_v3.html`:** `izoCell(izo, flag, malzFlag)` → 🟡 malzeme rozeti (bindirme çelişkisinden
  ayrı); `duzeltAc` → "Malzeme listesi kıyası (BOM ↔ PDF)" bölümü (celiski→🔧, excel_fazla_montaj→🔩,
  soft GİZLİ, excel_guven dili). Yardımcılar uyarilar.html ile birebir (`MLZ_*_V3`, `_mlzFmtV3`, `malzemeKiyasBlok`).
- **Test:** node --check (her iki dosya + inline JS), idempotency (2× → "zaten uygulanmış"), uçtan uca
  smoke (S02 fixture → dirsek 🔧 + flanş 🔩 birebir). Commit `e6db101`.
- **Canlı teyit (MK-132.1):** `/api/devre-inceleme` lambda'sı `g200` (b310cfc5…) için `ok:true`,
  `ozet.malzeme_flag:1`, S02 `{durum:'okundu', malzeme_flag:true, kiyas_var:true}`, celiski(dirsek)+
  montaj(flanş). SQL ile DB verisi de teyit edildi. **Server tarafı canlıda %100 çalışıyor.**
- **Görsel teyit BEKLİYOR:** v3 wizard `?devre_id=` ile var olan taslağı AÇMIYOR (URL param okunmuyor)
  → İnceleme tablosu ekranda açılamadı. Rozet/popup gözle görülemedi (kod kanıtlı; sadece render kaldı).
  Yeni borç (#2). Kapsamlı görsel + çoklu-gemi testi sonraki güne (Cihat kararı).

### 2. Dirsek 🟡 bulgusu — KÖK TESPİTİ ✅ (MK-135.2)

- S02 ham PDF malzeme listesi çekildi (konsolide öncesi). **Bulgu:**
  - PDF: dirsek satırı **6 kez** (her biri adet:1, agirlik:35.402, boy:457) → konsolide 6×35.4=**212.41 kg**.
  - Excel BOM: tek satır, **adet:6 ama agirlik:35.01** (= per-adet ~5.84 kg, DN323.9 için FİZİKSEL İMKANSIZ).
- **Kök:** Eski "PDF toplam / Excel birim" hipotezi ÇÜRÜDÜ. PDF doğru (212.41 fiziksel makul); **Excel
  BOM hatalı** — adet:6 yazıp ağırlığa tek dirseğin değerini koymuş (IFS export'unda adet×birim
  çarpılmamış olabilir). **K2 bug DEĞİL — gerçek bir veri tutarsızlığını doğru yakaladı.** Parser'a dokunma.
- Not: `excel_guven:'otorite'` dili bu vakada yanıltıcı ("PDF kontrol" diyor, gerçekte Excel hatalı).
  MK-133.1 otomatik güven türetme işi gelince fitting ağırlık tutarsızlığında simetrik dil düşünülebilir (acil değil).

### 3. Kozmetik — izo-eslesme self-test yorumu ✅

- `lib/izo-eslesme.js` üst-yorumu "eksik:1" diyordu, kod `=== 2` (doğru). Yorum `eksik:2` yapıldı.
  `node lib/izo-eslesme.js` → **SELF-TEST ✅ GEÇTİ**. Çalışan kod değişmedi.

## CI Son Durum

- `e6db101 feat(135)` (K2 rozeti) push edildi — kod CI tetikledi.
- Bu kapanış: tek push / iki commit → doc'lar `[skip ci]`, EN SON kozmetik kod commit'i (HEAD, CI koşar) — MK-134.1.
- function 12/12 (sabit). MK-49.1 korundu, migration yok.

## Commit'ler

| Hash | Mesaj | Tür |
|---|---|---|
| `e6db101` | feat(135): v3 Inceleme K2 malzeme rozeti — A2 enjeksiyon + izoCell rozet + duzelt popup | **kod (CI)** |
| (kapanış-1) | docs(135): kapanış üçlü + KARARLAR MK-135.1/.2 + PARSER 7.7 `[skip ci]` | doc |
| (kapanış-2, HEAD) | style(135): izo-eslesme self-test yorumu eksik:2 | **kod (CI)** |

## 136'ya Açık Borç (önceliğe göre)

1. **Kapsamlı görsel + çoklu-gemi testi:** Farklı format/gemi örnekleriyle K2 rozeti + popup'ı GERÇEK
   tabloda gör; dirsek-tipi Excel tutarsızlığı başka gemilerde tekrar ediyor mu (MK-135.2 deseni).
2. **v3 wizard `?devre_id=` ile taslak açma:** Var olan `oneri_hazir` taslağı yeniden açıp İnceleme'ye
   getirme YOK. Test/inceleme için gerekli; ~20 dk UI işi. (Bugün ortaya çıktı.)
3. **`excel_guven` otomatik türetme (MK-133.1 backlog):** format paketinden/parser_kural'dan; şimdilik sabit 'otorite'.
4. **Pipeline doğrulama (4.4-1):** POAR header pipeline × dosyaAdiParse.
5. **Taşınanlar:** "Montaj Resmi" emekli format, K5 function konsolidasyon, 117 (`yukleyen_id`),
   web-spool sync, fitting (DIN 86087/ASME B16.9), `spool_dokumanlari` bağ tablosu, dirsek bin-packing v2.

---

> 136 açılışında: bu dosya + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` + PARSER 7.7 +
> KARARLAR MK-135.1/.2. **İlk iş: kapsamlı görsel test için ya wizard taslak-açma (#2) ya çoklu-gemi örnek yükleme.**
