# Oturum 137 — Erişim teyidi → Adım 1 klasör ağacı (+ test dosyası beklemesi)

## Açılış ritüeli
Git pull/status/log → CI rengi (136 son kod commit'i = devreler.html erişim wiring; doc paketi [skip ci]) →
şu dosyalar: `son-durum.md` (136), `CLAUDE-SON-OTURUM.md` (136), bu dosya → KARARLAR **MK-136.1/.2/.3/.4/.B
+ MK-135.2 revizyon** → gündem teyidi.
**Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12. (137'de de yeni endpoint YOK.)

## 136 nerede bıraktı
- Açı zinciri canlı (parser+kabuk+v3 malzeme sekmesi), pushlandı (c660346). MK'lar mühürlendi (1aaffe9).
- devreler.html erişim wiring HAZIR ama **bu kapanışta mı pushlandı teyit et** (MD5 2568fe0b904c95d8cc5cf3714e451179).
- Çoklu-gemi BOM analizi yapıldı; dirsek temsil prensibi MK-136.3/.4'e bağlandı. Kesim sayfası ERTELENDİ.

## Yapılacaklar (sıra)

### 1. devreler → v3 erişimi TEYİT (görsel)
- Flag durumu: `select tenant_id,feature_kod,aktif from tenant_features where feature_kod like 'devre_wizard%';`
  Karşılaştırma için Demo Atölye'de **hem devre_wizard_v2 HEM devre_wizard_v3 aktif** olmalı.
- Deploy sonrası Devreler sayfasında 3 giriş: "Yeni Devre" (v1) + "Klasör Yükle (v2)" + "Klasör Yükle (v3)".
- v3 butonu → devre_wizard_v3.html açılıyor mu gözle gör. Erişim borcu (#1) ancak burada kapanır.

### 2. GAP 1 — Adım 1 klasör ağacı (DOSYASIZ, orta iş)
- v3 Adım 1 şu an düz tablo (`dosyaTablo` / `dosyaTbody`). Mockup'ta aç-kapa klasör ağacı (izometri/ montaj/
  + **eski-rev/ "hariç"** klasörü, güven rozetleri).
- Ağaç bileşeni v3'te ZATEN var (`buildTreeDok`/`fol`/`fitem`/`ftree`, Dökümanlar sekmesinde). Adım 1'e bağla.
- **Eski/hariç klasör görselleştirmesi** önemli — OLD/Üretime Verilen/Kaplini klasörlerini görünür "hariç"
  işaretle (folder-hygiene; `gizliDosyaMi` sadece `.Old`+Thumbs.db eliyor, OLD/old/Üretime elenmiyor).
- Mevcut sıfırdan-akış + taslagiAc bozulmadan. Atomik patch + node --check.

### 3. Test dosyaları gelince (BLOKE — beklemede)
- **GAP 2 — düzelt-yazma + çapa/öğrenme:** v3 düzelt popup salt-okuma + çapa stub (FAZ-1, omurga 8/18.d).
  Değer yazma yolu + çapa görsel arayüzü + format öğrenme. Wizard'ın değer önerisinin KALBİ. Gerçek PDF'e
  karşı düzelt/öğret → test dosyası şart.
- Çoklu-gemi K2 + açı sağlamlaştırma: M130 ideal ikinci gemi (küçük, OLD yok, farklı format, 87.6° büküm).
- Terfi + spool oluşturma gerçek veriyle doğruluk.

### 4. Diğer borçlar (öncelik dışı)
MK-136.B (spool_malzemeleri.aci kalıcılık — kesim havuzu kurulurken) · GAP 3 (DEV modu, düşük) ·
devreler "(v2)/(v3)" etiketleri karar sonrası temizlik · 129/130 terfi-sonrası imalat-izo görünmeme ·
117 (yukleyen_id) · pipeline doğrulama (4.4-1) · fitting (DIN 86087/ASME B16.9) · spool_dokumanlari bağ tablosu.

## KORUMA bantları
- MK-49.1: izometri-oku.js'e DOKUNMA.  · MK-129.3: api/*.js = 12, yeni endpoint yok.
- MK-136.1: açı = kalem kimliği (parser SOZLUK + kabuk konsolide anahtarı).
- MK-136.2: tip-başına kolon yok; tek Ölçü (kompound) + tek Açı; IFS/MTO mirror.
- MK-136.3: ham koruma, normalize yok, **otomatik segment↔toplam dönüşümü YASAK**.
- MK-136.4: yöntem kararı operatöre ait (spool_detay); kesim altyapısı boru havuzunu yansıtır.
- MK-135.2 revizyon: dirsek "çelişkisi" Excel hatası değil; K2 açı-farkındalığı kazanmadan "Excel hatalı" deme.
- MK-134.1: kod commit'i + [skip ci] doc aynı push'ta doc-HEAD'de gönderilmez.

## Hatırlatmalar
- `arespipe_kopyala` + MD5 + git status mandatory (MK-101.1 sessiz kayıp).
- sed HTML/JS'de yok → atomik str_replace/Python (MK-129.3 ruhu).
- Doc [skip ci]; kod CI tetikler — tek push/çok commit ise HEAD=kod (MK-134.1).
- v3 test devresi: g200 / b310cfc5-2a09-41be-8d3a-78c1af43b591 (S02 dirsek=6×15° segment, açı verisi hazır).

---
> 137'nin ilk somut adımı: devreler.html push + flag teyidi + 3-buton görsel (#1) → GAP 1 Adım 1 ağacı (#2).
> Asıl wizard "tamam" blokajı GAP 2; o test dosyalarına bağlı, gelince açılır.
