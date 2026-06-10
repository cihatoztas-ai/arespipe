# CLAUDE-SONRAKI-OTURUM.md — Oturum 176 giriş planı

## Ritüel (önce)
`git pull && git status && git log --oneline -5` + fonksiyon 12/12 + handoff oku. HEAD bekle: eb12c0c (+ bu oturumun doc commit'i).

## Bağlam: nerede kaldık
Excel↔PDF katman birleştirmenin alan-doldurma + rozet kısmı BİTTİ (kalite 174, cap/et/yüzey 175). NPS→mm veri sızıntısı kapatıldı (58 spool). **Faz 2 (gerçek çelişki kazananı) sıradaki büyük iş.**

## SIRADAKİ İŞ

### 1) Faz 2 — çelişki kazananı ⭐ (asıl iş)
İki kaynak DOLU ve farklıysa kazananı provenance'a göre seç:
- **Referans Excel** (IFS/Cadmatic export, sözlük başlığı tanındı = `seviye=L1` & `guven>=70`) → Excel kazanır (mevcut "kabuk korunur" davranışı zaten doğru).
- **Manuel Excel** (düşük güven) → PDF kazanır (bindir şu an kabuğu koruyor → bunu çevir).
- Çelişki rozeti her halükârda korunur.

**KRİTİK TASARIM SORUNU (175'te bulundu):** sinyal `spooller`'da kalıcı kolon olarak YOK (SQL doğruladı). `excel-parser` dönüşü `seviye`/`guven` **dosya-bazında** (satır değil — bir IFS export ya tanınır ya tanınmaz, satır satır değişmez → kural basit). Ama `bindir(pdfSpool, kabukSpool)`'a bu sinyal ulaşmıyor.
**Yapılacak karar:**
- (a) `devreler` (veya uygun) tabloya bir bayrak: `excel_referans boolean` → şema migration (MK-85.3 information_schema önce, MK-98.2 dry-run). Kalıcı, devre_detay yolu da kullanır.
- (b) Akış-içi taşıma: terfi/önizleme nesnesine `excelReferans` iliştir, bindir'e `opts` parametresi. Şema yok ama devre_detay yolu için ayrıca düşünülmeli.
- bindir'e `opts.excelReferans` ekle: referans & çelişki → kabuk kazanır (mevcut); !referans & çelişki → `deg`'e PDF değerini yaz + flag korunur.
- **Önce:** Excel yüklenince `seviye`/`guven` nereye yazılıyor/atılıyor izle (kuyruk parse_sonuc'ta mı, hiç saklanmıyor mu). excel-parser bende var.

### 2) ESKİ AÇIK
- **KARARLAR.md MK-169/170/171 boşluğu** (168→172 atlıyor) — 175'te de kapatılmadı. Eski oturum özetlerinden türetilip doldurulmalı.
- **MK-117 (yukleyen_id null):** devre_dokumanlari yukleyen_id null → kuyruk-isle-izometri.js:305 abort. Çözüm: user ID ata VEYA sistem yüklemesi için kontrolü gevşet.
- **1 1/4" boşluklu kesir bug:** `olcuParse("1 1/4\"")`→1 (regex boşlukta kesiliyor); tireli doğru. `ares-olcu.js` branch-1 regex'i + ondalık NPS (1.25/1.5) genişletme. Düşük öncelik.
- **Gece cron (03:00):** hâlâ ispatsız (gündüz drenajı kuyruğu boşaltıyor).

## TEST DEVRESİ TEMİZLİĞİ (birikiyor)
Carry-over listesi 174'ten devam. G200-333-OD01/03/04/06 ve M200-355C-*-ALS devreleri 175 düzeltme turunda dokunuldu — bunlar GERÇEK test/prod verisi, silme listesine alınmamalı, sadece dis_cap düzeltildi.

## İLK HAMLE (176)
"excel-parser seviye/guven Excel yüklemede nereye gidiyor" izle (kuyruk parse_sonuc'ta saklanıyor mu?) → Faz 2 madde 1 (a/b) kararını ver → bindir opts taşıma kanalını kur. Bu, kök "Excel referans mı manuel mi" sinyalini bindir'e ulaştırır = Faz 2'nin kalbi.
