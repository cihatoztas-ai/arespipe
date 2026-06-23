# Akış: Devre Oluşturma (Wizard)
**Durum:** 🟡 iskelet (doldurulacak) · **Sayfalar/parçalar:** aktif_devreler.html (giriş) · wizard adımları · `batch-baslat` + `batch-kuyruga-al` (API) · `dosya_isleme_kuyrugu` · excel-parser · izometri parser · glyph-onar · **Yazma yetkisi:** web

> **Bu dosya, "kompleks akış tek sayfaya sığmaz" örneğidir.** Wizard tek özellik ama yarım düzine sayfa + backend + kuyruk + parser'dan oluşur. Hepsi burada **bütün** olarak durur; sayfa kataloğunda her parça ayrı satır olarak akışa link verir.

## Amaç *(taslak)*
Yeni devre geldiğinde elde ne varsa (Excel BOM, spool imalat resimleri, 3D görünüş PDF'leri, stp/rhino, akış/montaj resimleri) sürükle-bırak yüklenir; önce spool listesi oluşturulur, arka planda diğer dökümanlar okunarak boşluk bilgiler doldurulur. Kullanıcı saatlerce beklemez.

## Yaşam döngüsü *(taslak)*
```
aktif_devreler "Yeni Devre Ekle" --> Wizard
  Adım: dosya yükleme (sürükle-bırak, çoklu tip)
  --batch-baslat--> dosya_isleme_kuyrugu (client-loop, otomatik trigger YOK · MK-113/A)
  --batch-kuyruga-al--> her dosya tipine göre parser:
     Excel BOM --> excel-parser (L1/L2) --> parse_sonuc JSONB
     izometri PDF --> izometri parser (L2 det. / L3 vision) + glyph-onar --> yon_dizilim, NOT, alıştırma
  --> spooller / devreler / malzemeler yazımı (önce liste, sonra boşluk doldurma)
```

## Bu akışın sayfaları/parçaları *(doldurulacak)*
- **aktif_devreler.html** — "Yeni Devre Ekle" girişi; üst bilgi kartları + filtreler.
- **Wizard adımları** — dosya yükleme (Step 1) · izometri yükleme (Step 2, skip'li) · …
- **`batch-baslat` / `batch-kuyruga-al`** (API) — kuyruk başlat + sıraya al. Devre wizard'ı ve devre_detay İzometri sekmesi aynı endpoint'leri paylaşır (MK-49.B).
- **dosya_isleme_kuyrugu** — wizard kuyruğu, otomatik trigger yok, client-loop (MK-113/A).
- **excel-parser.js** — SheetJS, L1/L2, bilingual; `parse_sonuc` JSONB (INSERT yok). Migration 083+084.
- **izometri parser + glyph-onar.js** — L2 ($0) öncelik, L3 fallback; Cadmatic glyph onarımı.

## Bağlı tablolar *(doldurulacak)*
`dosya_isleme_kuyrugu` · `spooller` · `devreler` · `malzemeler` · …

## İş kuralları *(doldurulacak)*
- MK-49.A/B (3D render deterministik; izometri component paylaşımı) · MK-113/A (client-loop) · MK-155.1 (format kuralı kodda) · MK-117 (yukleyen_id null borcu) · …

## Açık borç
- MK-117: `yukleyen_id` null → `kuyruk-isle-izometri.js:305` parse abort → izometri/NOT/alıştırma yazılmıyor.

## Görsel
*(eklenecek)*

---
> **Not:** Bu stub, akış-merkezli yapının kompleks durumu nasıl topladığını gösterir. Wizard kodlandıkça/netleştikçe doldurulur. Karşılaştır: KK akışı tek ana sayfa + 3 dokunuş; wizard 6+ parça — ikisi de aynı şablonda, aynı bütünlükte.
