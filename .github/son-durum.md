# AresPipe — Güncel Durum (son güncelleme: Oturum 104, 20 May 2026)

## Bu oturumda yapılanlar (104) — İzometri Batch UX + Normal Excel + maliyet ölçümü

Oturum "wizard PDF parse" niyetiyle açıldı ama Cihat'ın yönlendirmesiyle **izometri batch
sayfasının toparlanmasına** döndü. 3 iş canlıya alındı, 1 büyük ölçüm + 1 PDF metin analizi yapıldı.

### 1) 104-A — İncele her zaman açılır + AI güven renklendirme (CANLI)
Bug değildi: "Manuel Onay açılmadı" → o batch'te 0 manuel spool vardı (hepsi `hazir`), buton
doğru gizliydi. ASIL sorun: incele'ye tek giriş manuel onaydı → **all-hazir batch açılamıyordu.**
- `izometri-batch.html`: her zaman erişilebilir **"Sonuçları İncele"** butonu (spool varsa aktif);
  satır içi "İncele →" tüm satırlarda.
- `izometri-batch-incele.html`: spool **AI güven pill'i** (yüksek≥85 yeşil / orta≥65 amber / düşük kırmızı),
  spool başlığı güven rengiyle, **DN/Et eksikse kırmızı "eksik"** vurgusu.
- Commit `c... fix(104): izometri batch incele her zaman acilir + AI guven renklendirme`

### 2) 104-B — Batch sayfası sadeleştirme + tek akış + legend (CANLI)
- Drop zone küçültüldü; **stat kutuları kaldırıldı**; **"Manuel Onay" butonu kaldırıldı** (İncele ile
  aynı işti, kafa karışıklığı); **"Excel İndir" batch sayfasından kaldırıldı** (Excel onaydan sonra).
- Tek post-parse aksiyon: **Sonuçları İncele**.
- İncele üstüne **renk legend** (Yüksek/Orta/Düşük/eksik).
- Commit `fix(104): batch sayfasi sadelestirme + tek inceleme girisi + renk legend`

### 3) 104-C — İncele "Normal Excel" export (CANLI, son commit 48026e0)
IFS yanına **"📊 Excel İndir"** (onaylanan spool varsa aktif). 2 sheet:
- **Spool Listesi** (devre_detay formatı): Resim No · Pipeline No · Spool No · DN · Çap · Et · Boy ·
  Ağırlık · Malzeme · Kalite · Yüzey · Rev. **Marka yerine Resim No** (= dosya/çizim adı).
- **Malzeme Listesi** (spool_detay formatı): Resim No · Spool No · Kod · Açıklama · Malzeme · Kalite ·
  Standart · Dış Çap · Et · Boy · Adet · Ağırlık · Sert. **Heat No YOK** (parse üretmez).
- Commit `feat(104): incele normal Excel export (spool + malzeme, 2 sheet, Resim No)`

### Maliyet ölçümü (C — ai_api_log, AI maliyeti $0)
- Toplam: **L3 (Vision AI) 42 çağrı = $1.34** (~17 sn/çağrı); **L2 (deterministik) 8 çağrı = $0** (23 ms).
- Format bazında L3 maliyeti:
  - **PAOR Ana Çizim: 18 · $0.62** — image-PDF, metin yok → mimari olarak çözülemez (sadece azaltılır).
  - **Tersan M110 İmalat: 15 · $0.46 (+ 8 L2 · $0)** — metin-PDF → öğrenme döngüsünün altın hedefi.
  - **Tersan M110 Montaj: 7 · $0.21** — YANLIŞ-TANIMA ŞÜPHESİ (gerçek PDF görülmedi, teyit gerek).
  - (tanımsız): 2 · $0.06.

### PDF metin analizi (4 örnek dosya incelendi)
- **PAOR isometric_view**: metin BOŞ (image) → geometri AI ister. **L3'e göndermek boşa para** (105 hedefi).
- **PAOR ana çizim**: metin DOLU (tablo + düğümler `[4] 50600-1514`) → tablo deterministik çekilebilir.
- **Tersan G200 S01**: geometri/yön dizilimi METİNDE gömülü (`45°`, `R=130`, segment boyları,
  `Rotation Angle`, `Cut & Bending Info`) → hem tablo hem **yön dizilimi $0 deterministik** çekilebilir
  → **MK-49.A (3D render) Tersan için tamamen mümkün, AI'sız.**

## Mimari kararlar (104)
- **MK-104.1** — İzometri batch SADECE Excel verir; devreye bağlanmaz. (Onaylanan spool→gerçek kayıt fikri İPTAL.)
- **MK-104.2** — Excel akışı: parse → incele → düzelt → onayla → Excel. Batch sayfasında Excel butonu yok.
- **MK-104.3** — İki Excel: IFS (devre_yeni "All" 92 sütun) + Normal (devre_detay spool + spool_detay malzeme,
  2 sheet, Marka→Resim No, Heat No yok). İkisi de sadece onaylanan (`hazir`) spool'ları verir.
- **MK-104.4** — AI güven gösterimi SPOOL bazlı (`guven_skoru`). Alan-bazlı güven prompt değişikliği ister
  (izometri-oku, MK-49.1) → ertelendi.
- **MK-104.5** — Geometri kaynağı formata bağlı: metin-PDF (Tersan) metinde → $0 deterministik + 3D verisi;
  image-PDF (PAOR isometric_view) yok → AI. PAOR'da tek L3 çağrısında tablo+geometri birlikte istenebilir
  (aynı maliyet, fazla getiri).
- **MK-104.6** — Maliyet ölçüm protokolü: `ai_api_log` parser_seviye dağılımı + format bazında L3 maliyeti.
  Ölçmeden optimize etme (B'nin değip değmeyeceği ölçümle belirlenir).

## CI Son Durum
- **Build:** ✅ YEŞİL (son commit `48026e0`). 3 commit temiz rebase+push, çakışma yok.
- İncele dosyaları MD5 doğrulamayla yüklendi (>45KB, MK-51.1).

## AÇIK BORÇLAR (sıra önemli)
1. **105 — Hızlı tasarruf:** PAOR `isometric_view` (metni boş) L3'e gitmesin → boşa para kesilir.
   + Tersan M110 Montaj yanlış-tanıma teyit/temizlik (1 sorgu + örnek PDF).
2. **106+ — B-geometri (büyük, en yüksek getiri):** Tersan metin-PDF için deterministik parser:
   tablo + `yon_dizilim` (metinden) → o format $0 + 3D render verisi (MK-49.A). Kendi MK belgesiyle.
3. **B-öğrenme:** düzeltme → `parser_kural` geri-yazma (MK-48.5) + cache'in düzeltmeyi taşıması.
   NOT: image-PDF (PAOR) bunu çözmez — metin yok.
4. **Wizard'ı bu hazır backend'e bağla** (MK-49.B) — en son.
5. **Normal Excel "Standart" sütunu boş** — Açıklama içinden regex ile ayıklanabilir (küçük).
6. **Alan-bazlı AI güven** — prompt değişikliği (MK-49.1, dikkatli).
7. **batch ↔ incele cache:** incele'de onay sonrası batch sayfası `_tumSpooller` cache'i yansıtmıyor
   (geri dönünce tazelenmeli) — küçük.
8. `excelIndir`/`manuelOnayAc` batch sayfasında ölü kod (zararsız, istenirse silinir).

## Önemli öğrenmeler (104)
- **Görmeden yazma 2 kez kurtardı:** (a) "incele düzenlenemiyor" dedim → meğer `form-grid` editleme VAR
  (`spoolFormDegis`); (b) "kopukluk = alan uyuşmazlığı" dedim → meğer tesisat tutarlı (DURUM='manuel_onay'
  her yerde aynı). İki yanlış teşhis de koda bakınca düzeldi.
- "Devre Oluştur" butonu meğer Excel indiriyor + görünür label zaten "IFS Excel İndir" (sadece id eski).
- Cost ölçümü stratejiyi değiştirdi: B (öğrenme) paranın ~%50'sini (Tersan metin-PDF) çözebilir, PAOR'u çözemez.
