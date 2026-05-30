# Son Durum — 136. Oturum (30 Mayıs 2026)

> Çoklu-gemi BOM incelemesinden çıkan **açı** meselesi uçtan uca çözüldü: parser açıyı yakalıyor,
> kabuk açıları ayrı kalem tutuyor, v3 malzeme sekmesinde "Açı" kolonu + redüksiyonda kompound "Ölçü".
> MK-135.2 REVİZE edildi (S02 dirsek = Excel hatası DEĞİL, 6×15° segmentli bend; kök = K2 açı körlüğü).
> devreler→wizard erişim wiring'i: v1/v2/v3 üçü birden erişilebilir (ayrı flag'li butonlar).
> Yeni endpoint yok (12/12), MK-49.1 korundu, migration yok.

## Yapılanlar (sıra)

### 1. taslagiAc — ?devre_id= ile taslak açma (bu oturum başı, zaten deploy + görsel teyit "evet görünüyor")
v3 wizard URL param okuyup var olan oneri_hazir taslağı İnceleme'de açabiliyor. 135 görsel borcu kapandı.

### 2. Çoklu-gemi BOM analizi (G200/G310/M100/M100-ALS/M130) → AÇI bulgusu
- Gerçek tersane ham klasörü incelendi. BOM tek IFS/CADMATIC formatı → L1, hepsi okunur. İzometriler metin-PDF → L2, $0.
- **Kök bulgu:** BOM ağırlığı AÇIYA bağlı (323.9x6.3: 15°→5.83, 90°→35.01 kg, oran sabit). Parser+kabuk açıyı
  düşürüyordu (SOZLUK'ta yok + konsolide anahtarında yok) → farklı açılar tek satıra çöküyordu.
- S02 "çelişkisi" = 6×15° segmentli 90° bend; Excel TUTARLI. 135'in "Excel hatalı" tespiti açı körlüğüymüş.

### 3. Açı zinciri — parser → kabuk → v3 malzeme sekmesi (PUSH: c660346)
- `lib/excel-parser.js`: SOZLUK'a `aci` (angle/açı/derece) + SAYISAL_ALANLAR'a `aci`.
- `ares-kabuk.js`: konsolide anahtarı `tanim|malzeme|dn|aci|tip` + bom kalemine `aci`. Geriye-uyumlu (aktar DB'ye yazmıyor).
- `devre_wizard_v3.html`: malzeme tablosuna "Açı" kolonu; "DN" → "Ölçü" (redüksiyon kompound otomatik).
- Gerçek G200 BOM ile test: açı yakalanıyor, açılar ayrı kalem (15°/30°/45°/60°/90° + 22.5°). node --check OK.

### 4. KARARLAR.md — MK-136.1/.2/.3/.4 + MK-136.B + MK-135.2 revizyon (PUSH: 1aaffe9, [skip ci])

### 5. devreler.html — wizard erişim wiring (BU KAPANIŞTA PUSH)
- Eski: "Klasör Yükle" tek buton → v2, sadece devre_wizard_v2 flag'iyle. v3'e erişim YOKTU.
- Yeni: v2 ve v3 için AYRI butonlar, kendi flag'leriyle bağımsız. v1 = "Yeni Devre" (devre_yeni.html) zaten var.
  → Karşılaştırma için üçü birden erişilebilir. node --check OK. MD5 2568fe0b904c95d8cc5cf3714e451179.

### 6. spool_detay büküm/dirsek/mitre fikri — kararlaştırıldı (gelecek iş, MK-136.4)
Operatör spool_detay'da yöntem seçer (büküm/dirsek/mitre); seçilen dirsek malzeme listesinden gelir, kesim
havuzuna gider, satınalmadan düşer. Kesim sayfası + algoritma SONRA. Yöntem belirsizliği insana çözdürülür.

## CI / commit
- `c660346 feat(136)` açı kod (CI) · `1aaffe9 docs(136)` KARARLAR [skip ci]. function 12/12. MK-49.1 korundu.
- Bu kapanış: devreler.html (kod, CI) + üçlü doc [skip ci]. Sıra MK-134.1: kod commit'i doc'lardan önce/HEAD'de.

## 137'ye Açık Borç (öncelik)
1. **devreler.html push + flag teyidi + GÖRSEL:** Demo Atölye'de devre_wizard_v2 VE devre_wizard_v3 flag'leri
   aktif mi (`select * from tenant_features where feature_kod like 'devre_wizard%'`). İkisi de aktifse Devreler
   sayfasında 3 buton görünür → v3 erişimi gözle doğrula.
2. **GAP 1 — Adım 1 klasör ağacı:** v3 Adım 1 düz tablo (`dosyaTablo`); mockup'ta aç-kapa ağaç (+ eski-rev/hariç).
   Bileşen v3'te VAR (buildTreeDok, Dökümanlar'da). Adım 1'e bağlanacak. ORTA iş, DOSYASIZ yapılabilir.
3. **GAP 2 — düzelt-yazma + çapa/öğrenme:** v3 düzelt popup salt-okuma + çapa STUB (FAZ-1, omurga 8/18.d).
   Wizard'ın değer önerisinin kalbi. BÜYÜK + TEST DOSYASI gerektirir (gerçek PDF'e karşı düzelt/öğret).
4. **Test dosyaları bekleniyor** — gelince bol örnekle sağlamlaştırma + GAP 2 + çoklu-gemi K2 (M130 ideal: küçük/temiz/farklı format).
5. **MK-136.B (ertelendi):** spool_malzemeleri.aci kalıcılık (kolon + aktar) — kesim havuzu kurulurken.
6. GAP 3 (DEV modu) düşük öncelik. devreler.html'deki "(v2)/(v3)" etiketleri karar sonrası temizlenir.

## "Wizard tamam" tanımı (v1/v2 iptali için)
[ ] Devrelerden v3 açılıyor (137'de teyit)  [ ] mockup parite (GAP 1)  [ ] düzelt+çapa çalışıyor (GAP 2)
[ ] 2-3 gerçek gemi sorunsuz (test dosyaları)  [ ] v1/v2/v3 karşılaştırıldı → v3 ikisinin işini görüyor
