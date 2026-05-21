# MK-B-GEOMETRI — Tersan metin-PDF geometri çekme

> 105'te oluşturuldu, **Faz 1 105'te tamamlandı.** Amaç: Tersan Cadmatic metin-PDF'lerinden
> deterministik ($0, AI'sız) hem spool malzeme tablosunu hem de 3D/AR geometri verisini çekmek.
> MK-49.A (3D render) ve AR vizyonunun veri temeli.

## Durum (faz haritası)
- **Faz 1 — Malzeme tablosu L2 → ✅ TAMAM (105, CANLI).** Tersan İmalat detay sayfasının spool alanları +
  malzeme listesi deterministik parse ediliyor ($0). Migration 087 + lib/l2-parser.js config (kod değişmedi).
  8 örneğe karşı 8/8, 0 ham. parser_kural her iki Tersan formatında (MK-105.4).
- **Faz 2 — yon_dizilim (detay geometri) → ⏳ 106.** lib/l2-parser.js KOD genişletme gerekir.
- **Faz 3 — yerleşim/AR (montaj sayfası) → ⏳ 106+.**

## Neden (Tersan kazanılır, PAOR kazanılmaz)
- Tersan = metin-PDF (pdf-parse jammed de olsa metin çıkarır) → geometri METİNDE → deterministik, $0.
- PAOR ana çizim = **metin katmanı YOK** (0 gömülü font, vektör/raster) → L2 imkânsız, vision L3 zorunlu
  (**MK-105.6**). B-geometri sadece Tersan'ı kazanır.

## İki sayfa tipi (105, pdf-parse + bağlam doğrulandı)
Örnek: `G200-303S-BS18 1(5)` serisi.

### Detay sayfası — `…(N).S0x_y.1.pdf`
Spool'un KENDİ biçimi.
- **Malzeme Listesi → Faz 1 PARSE EDİLİYOR ✅** (No/Adet/Açıklama/Boyut/Boy/Malzeme/Ağırlık;
  7 satır tipi × ST37/316L/AISI/CuNi/St.St/St*). Boyut: `ODxet` mm + `5" Sch 10S` inç.
- **Cut & Bending Info → Faz 2 (henüz değil):** segment boyları (2876/1097/1372), büküm açıları
  (90°/30°/45°), rotasyon, R=130. → yon_dizilim (3D biçim). Bunlar tablo değil → l2-parser KOD genişletme.

### Genel-görünüm / montaj sayfası — `…(N).M.pdf` (S-segmenti YOK)
Spool'un GEMİDEKİ yeri + komşu zinciri. Faz 1'de **doğru reddediliyor** (malzeme satırı yok → ok=false → L3).
- **Yerleşim → Faz 3:** güverte+kot (MAIN DECK-11300 +1849), frame (FR80/FR81), CL (4684/6360).
- **Yönelim:** Up/FW/PS/SB. **Süreklilik:** `Continue: …3(5)` komşu spool. → AR sabitleme + montaj zinciri.

**Tamamlayıcılık:** detay = biçim, montaj = yerleşim + zincir. İkisi birlikte tam 3D + AR.

## 106'da çözülecek
- **Faz 2:** detay Cut & Bending → yon_dizilim parser (l2-parser KOD). Hedef MK-49.A 3D render.
- **Faz 3:** montaj yerleşim/yönelim/Continue parser → AR.
- **pipeline_no dosya adından:** pdf-parse metni kesiyor; l2-parser dosya adı almıyor → downstream `_dosya`
  ya da mimari karar (izometri-oku dokunur → MK-49.1 dikkat).
- **Fingerprint düzgün ayrım (MK-105.4):** şu an parser_kural her iki formatta (tie-break-proof).
  Ayırt edici: dosya adında S-segmenti var/yok; ya da Malzeme Listesi satırı var/yok. Detay→İmalat, montaj→Montaj.
- **Çift-parse teyidi:** aynı spool montaj+detay'dan iki kez mi parse ediliyor.

## Hedef (ölçülebilir)
Tersan İmalat L3 oranı %65 → %20 altı. Faz 1 ile malzeme listesi zaten $0; Faz 2/3 ile geometri+yerleşim $0.

## Başlarken istenecek
Birkaç Tersan detay + montaj PDF (varyasyon), lib/l2-parser.js, ilgili parser_kural satırı
(`izometri_format_tanimlari`), test/l2-tersan-* (regresyon), `boru_olculer` (SCH/DN lookup, 44'te kurulu).
