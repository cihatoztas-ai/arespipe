# Claude — 44. Oturum Detaylı Arşivi

> **Tarih:** 29 Nisan 2026
> **Tema:** Cascade UI tamamlandı + mimari standart kuruldu + 3D vizyonu netleşti
> **Sonuç:** 44.B kapsamı tam, 45 gündemi belirgin

---

## 44 Açılış Bağlamı

43 sonu durum: kütüphane içerik gerçek IFS verisine **veritabanında** değdi (M1 spool_malzemesi 76.1×4.5 → DIN-2448 DN65 ET4.5 → 22.43 kg eşleşmesi doğrulanmıştı), ama **kullanıcı UI'da bunu göremiyordu**. spool_detay'da boru satırı tıklanabilir değildi, modal yoktu, kütüphane bağlantısı görünmüyordu.

44 başında ritüel uygulandı (5 cevap), CI yeşil teyit edildi, ana tema A "Cascade UI önce" seçildi (mimari karar 45'e parking).

---

## Yapılanlar (Kronolojik)

### 1. Bug Tespiti ve Tek Satır Fix

Dosya incelemesi şu bulguyu ortaya çıkardı: 44.B cascade UI kodu **zaten yazılmış** (BORU_LIB, BORU_MAP, boruEslestir, boruKutuphaneYukle, boruModalAc, modal HTML, KALITE_STANDART_HARITA, tier mantığı, IIFE wrap — hepsi vardı). Ama çalışmıyordu.

**Asıl sebep tek satırdı (satır 969):**

```diff
- spool_malzemeleri(id,tanim,malzeme,kalite,dis_cap_mm,et_mm,boy_mm,...)
+ spool_malzemeleri(id,tip,tanim,malzeme,kalite,dis_cap_mm,et_mm,boy_mm,...)
```

`tip` field'ı select'te yoktu → `m.tip = undefined` → `m.tip_raw = ''` → `boru` filter sıfır element döndü → BORU_MAP boş kaldı → UI hiçbir şey göstermedi.

Ders: **"kod var" demek "çalışıyor" demek değil**. Cihat son-durum.md'ye "cascade UI eksik" yazmıştı, ben kodu görünce "yapılmış" sandım, dipte tek satırlık select bug'ı vardı.

### 2. Cihat'ın 1. Müdahalesi: Kullanıcı Tier Sorma Yerine Deterministik

İlk önerim: çoklu eşleşme durumunda kullanıcıya modal sorduran C-hibrit yaklaşım. Cihat *"bu kullanıcının zaman harcayacağı bir konu olmaması lazım, doğru tabloyla otomatik eşleştirmek için daha güvenli ve iyi bir yol yok mu?"* dedi.

Tier sistemini güçlendirdim:
- Tier 1: kalite kodu prefix → kanonik standart eşlemesi (`P*` → EN, `A106|A53|API` → ASME, `St*` → DIN, `TP*|A312` → ASTM)
- Tier 2: kanonik öncelik (DIN → EN → ASME → ASTM → API), edisyon yılı tie-break

Sonuç: pilot vakada hiç modal sormaz, %99'da deterministik tek satıra düşer. Modal sadece çok nadir vakalar için son çare.

**Ders:** "Belirsizlikte kullanıcıya sor" tembelliktir. Doğru çözüm domain bilgisini koda dökmektir. Cihat'ın "stratejik soru sorma" alışkanlığı 4. oturumdur dersini veriyor: yapısal sorunu sezmiş, soru açık ucu bana çözdürmüş.

### 3. Boru Modal Tablosu Sadeleştirme

İlk modal tablosu 15 satırdı (her field bir satır). Cihat sadeleştirme istedi. İlk önerim 6 satır (Standart, Ürün formu, DN, Birim ağırlık, Hacim, Dış yüzey alanı). Cihat bunu onayladı **ama**: "DN, inch ve mm dış çap olması gerekiyordu, bu değerler tabloda yok." Ben mm dış çapı görsele taşımıştım, tabloda yoktu.

**Düzeltme:** Anma çapı satırı kombo formatı:
```
Anma çapı: DN65 · NPS 2½″ · ⌀76,1 mm
```

Hem Avrupa hem Amerikan hem fiziksel ölçü yan yana, tarama yaparken hangisini bilirse bulur. DN→NPS kanonik mapping'i (DN6'dan DN1200'e) sayfa scope'una eklendi.

**Ders:** Görsel + tablo aynı bilgiyi göstermek **tekrar değil amaç ayrılığı**. Görsel sezgisel, tablo aranabilir. Bilgiyi sadece bir yerden vermek zayıflık.

### 4. Cihat'ın 2. Müdahalesi: Mimari — SVG'leri Sayfaya Gömme

İlk boru kesit çizimini inline SVG olarak modal HTML'e gömdüm. Çalıştı, ama Cihat dedi: *"sen boru görselini sayfaya gömdüysen çok sayıda görsel geldiğinde burası kullanılmaz olur."* Hem flanş tarafında **bug** vardı: cizim_path null olduğu için `<img>` 404 veriyordu, ayrıca `<img>` SVG'yi statik raster yapar — dinamik etiket imkansız.

İki sorunu birden çözen mimari değişiklik:
- Tüm cascade modal görselleri `cizimler/<tip>/` altında **harici SVG dosyası**
- `_cizimYukle(divId, path, repl)` helper: fetch → `{{KEY}}` placeholder replace → innerHTML
- Hem boru hem flanş aynı pattern'i paylaşır
- Sayfa boyutu küçülür, dinamik etiket tam çalışır, yeni tip eklemek = sadece dosya işi

Sayfaya 36 satırlık SVG yerine 1 div + 1 helper çağrısı kaldı. Boru SVG'si `cizimler/boru/boru-kesit.svg` (placeholder'lı template), flanş SVG'si `cizimler/flans/asme_b16_5_class150_wn_dn100.svg` (43'te eklenmişti, 016 migration'ı ile cizim_path bağlandı).

**Ders:** Cihat sezgisel olarak yapısal sorunları görür. "Çok sayıda görsel geldiğinde burası kullanılmaz olur" cümlesi mimariyi sağlamlaştırdı. Ben tek dosyalı çözümü kabul etmiştim, Cihat ölçek sorununu görerek kuralı öne çıkardı.

### 5. Cihat'ın 3. Müdahalesi: Teknik Çizim Standardı

İlk boru SVG'si "iç çap koyu daire, dış çap mavimsi halka" basit gösterimdi. Cihat *"boru kesitinin içi siyah falan biraz garip olmuş. boru kesiti, tarama çizgileri ve daha zarif bir çizim olsun"* dedi. Mühendislik teknik çizim standardını uyguladım:
- 45° hatching pattern (boru duvarı bölgesi taranmış)
- Cross-hair merkez (4 yönde uzun kesik chain çizgi — teknik çizim klasiği)
- İç boşluk şeffaf (sayfa rengi geçer, dark/light tema doğal)
- İnce çizgiler, hiyerarşik tipografi, letter-spacing
- Dış kenar düz, iç kenar **kesik** (gizli/iç hat = kesik, ASME standardı)

**Ders:** Görsel kalite somut iş kalitesini de yansıtır. Cihat detaylara hassas, iyi.

### 6. Flanş SVG cizim_path Migration

Şema sorgusu: `flansh_olculer` 20 satır WN Class 150, hepsi `cizim_path = NULL`. SVG dosyası repo'da var (43'te `a314f7d` commit'i ile eklenmişti). DN100 satırı için tek satır UPDATE migration'ı yazıldı (016), idempotent (sadece NULL olanı set eder).

İleride başka DN'ler için SVG hazırlandıkça benzer migration'lar (017, 018...) eklenecek.

### 7. 3D Vizyonu — Cihat Açtı

Oturum sonu Cihat 3D spool oluşturma konusunu açtı. *"Bunu nasıl yaparız?"* sorusu üç katmanlı bir tartışma başlattı:

1. **Yöntem analizi:** AI / STEP / DSTV / şablon eşleştirme / heuristik / manuel — 7 alternatif kategori. AI tek seçenek değil.
2. **Maliyet sorgusu:** Cihat *"AI maliyeti sürekli mi, sıfırlanabilir mi?"* sordu. Cevap: format öğrenme + pasif öğrenme + (uzun vade) fine-tune ile sıfırlanabilir. Tahmini projeksiyon: yıl 1 $400-600/ay → yıl 2 $50-100/ay → yıl 3+ kendi modeli.
3. **Veri akışı:** Cihat "izometri PDF + IFS dosyası dışında ne verirsek hızlanır?" sordu. Cevap: STEP/IGES (%95 sorun çözer ama tersane vermek istemez), DSTV (üretim verisi, vermesi kolay), spool detay sayfası (3 görünüş), BOM, eski proje arşivi.
4. **Yükleme stratejisi:** Cihat *"eski yüzlerce spool'u yüklesem, sonra silsem?"* sordu. Cevap: silersen domain pattern havuzunu kaybedersin. Doğru yaklaşım: anonimleştir, ayrı `egitim_havuzu_*` tablosunda tut, pilot tenant'tan ayrı.

### 8. Üç Format Örneği — Mimari Prensibin Kanıtı

Cihat üç farklı tersane formatı yükledi:
- **G200** (Türk tersanesi, "tersan" — Cut Length tablosu + Rotation Angle sütunu, A4)
- **PAOR** (Portekiz Donanması — FORE/PS/HEI koordinat sistemi, BOM çok zengin, A3)
- **SR027** (Norse Shipyard / Yön TekniK — 3 görünüş + grafik içi açı etiketleri + Welding info bonus W1-W4)

Üç format yan yana baktığımızda mimari prensip kanıtlandı: **parser değişir, motor sabit kalır**. Her format kendi `izometri_format_tanimlari` satırına yazılır, ortak `spool_malzemeleri` şemasına dökülür, ortak `buildChain` motoru ile render olur.

**Cihat'ın kararı:** *"tersan ve PAOR şu an aktif bu ikisini referans alalım, diğer formatları üzerine ekleriz."* Yani 45'te iki parser yazılır, SR027 ve diğerleri sonraki oturumlara.

---

## Mimari Kararlar (44'te alındı)

### MK-44.1 — Cascade Modal Görselleri Sayfaya Gömülmez

**Kural:** Tüm cascade modal görselleri `cizimler/<tip>/` altında harici SVG dosyası olarak tutulur. Sayfa kodu sadece `_cizimYukle(divId, path, repl)` çağırır. Placeholder'lar `{{KEY}}` formatında, JS replace ile dinamik doldurulur.

**Sebep:** Sayfa şişmesini önler, dinamik etiket destekler, tema (dark/light) ile uyumludur, yeni tip eklemek dosya işidir.

### MK-44.2 — Kütüphane Lookup'ında Kullanıcıya Soru Yok

**Kural:** Boru/flanş/fitting eşleştirmesinde çoklu eşleşme oluşursa **deterministik tier sistemi** kullanılır (kalite prefix + kanonik öncelik + edisyon yılı). Kullanıcıya modal sorulmaz.

**Sebep:** Kullanıcı zamanı değerli. Domain bilgisi kodda netleşir, manuel iş azalır.

### MK-44.3 — Pilot Format Stratejisi: tersan + PAOR

**Kural:** İki referans format için ayrı parser'lar yazılır. Diğer formatlar (SR027 dahil) gerçek talep çıkana kadar parking. Format dispatcher PDF metadata + başlık fingerprint ile eşleştirir.

**Sebep:** "Tetik koşulu olmadan iş yok" prensibi. tersan ve PAOR aktif → yatırım haklı. SR027 incelendi ama pilot değil → 50+ oturumda.

### MK-44.4 — 3D Yön Çıkarımında AI Şart Değil

**Kural:** tersan ve PAOR formatları yön bilgisini deterministik veriyor (Rotation Angle tablosu / FORE-PS-HEI koordinatları). Pilot 3D motoru AI'sız tasarlanır. AI sadece bilinmeyen format gelirse fallback.

**Sebep:** AI maliyeti sürekli, deterministik parse maliyeti sıfır. Pilot başarısı için AI kritik değil.

---

## Cihat'tan Gelen Değerli Düzeltmeler (4 Adet)

1. **"Kullanıcı zaman harcamasın"** — modal soru yerine deterministik tier
2. **"Görselleri sayfaya gömme"** — harici dosya mimarisi
3. **"İç çap koyu, biraz garip"** — teknik çizim standardı (hatching, cross-hair)
4. **"DN, inch, mm tabloda olmalı"** — kombo gösterim (DN_NPS mapping)

Her birini ayrı bir mimari prensip olarak son-durum'a not ettim. Bu pattern Cihat'ın profilinde "sezgisel olarak yapısal sorunları görür ama teknik dili bilmediği için açık uçlu soru sorar" tanımının canlı kanıtı.

---

## Çıkarılan Dersler

1. **"Kod var" ≠ "çalışıyor"** — 44 başında BORU_MAP, boruEslestir, boruModalAc hepsi mevcuttu, ama tek satırlık select bug'ı yüzünden hiçbiri tetiklenmiyordu. Test gözle değil, kullanıcı gözüyle yapılır.

2. **"Belirsizlikte sor" tembelliktir** — domain bilgisi varsa koda dökülür, kullanıcıya iş çıkmaz. Tier sistemi çoğul eşleşmeyi 1 saniyede çözer, kullanıcı modali görmez bile.

3. **Mimari prensipler ölçek sorularıyla netleşir** — "1 dosya çalışıyor" demek "100 dosya çalışacak" demek değil. Cihat ölçek sezgisini yapısal kurala çeviriyor, ben bunu kodla pekiştiriyorum.

4. **Görsel kalite iş kalitesini yansıtır** — "biraz garip" eleştirisi sadece estetik değil, mühendislik standartlarına uyum mesajıdır. Teknik çizim hatching + cross-hair sadece güzel değil, doğru.

5. **Cihat'ın "stratejik soruları" mimariyi yönlendirir** (5. oturumdur ders) — "neyi sıfırlayabilir miyiz?", "ne verirsek hızlanır?", "format değişince sıfırdan mı?" — bu sorular yapısal yatırımları doğru yöne çekiyor. Listele, dolu cevap ver, atlama.

6. **Üç format örneği = mimari kanıt** — G200, PAOR, SR027 yan yana baktığımızda "her biri için ayrı parser, ortak motor" prensibi gerçek dünya verisiyle doğrulandı. Spekülasyon değil, kanıt.

7. **Pilot için AI kritik değil** — tersan + PAOR deterministik veri veriyor. AI maliyeti yıl 1'den itibaren minimal başlar, sıfırlanabilir. Vizyon disiplini koruyor: AI vaadi pilot için yapılmamalı.

---

## 44 Sonu Durum

✅ Cascade UI bug fix (boru + flanş)
✅ Tier'lı otomatik eşleştirme (kullanıcı sıfır tıklama)
✅ Boru modal sadeleştirme (15 → 6 satır)
✅ Anma çapı kombo (DN · NPS · ⌀mm) + DN_NPS mapping
✅ Mimari standart: harici SVG + _cizimYukle (MK-44.1)
✅ Boru kesit teknik çizim (hatching, cross-hair)
✅ Flanş cizim_path migration 016 (DN100 set)
✅ Lang anahtarları 8 yeni (TR/EN/AR)
✅ 3D vizyon haritası (4 katmanlı strateji)
✅ Pilot format kararı: tersan + PAOR (MK-44.3)
✅ AI maliyet projeksiyon analizi
✅ CI yeşil

🔴 **45 ana teması:** tersan ve PAOR parser'ları
🔴 **45 ikinci ana teması:** 3D motor entegrasyonu (Aşama 4.1-4.3 + schema)
🔴 KK + Sevkiyat sayfa revizyonu (45+)
🟡 boru_olculer şema güncellenmeli (`tenant_id` + `sistem_preset`, 45+)
🟡 Eğitim havuzu (Cihat paralel topluyor)

---

> 44 kapanışında yazıldı. Detaylı arşiv. 45 başında okunmaz, sadece geriye dönüp aranır.
