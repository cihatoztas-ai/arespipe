# Oturum 136 — Açı = malzeme kimliği + çoklu-gemi BOM analizi + erişim wiring

Çoklu-gemi ham klasörünü incelerken çıkan **açı** meselesi, hem bir parser/kabuk açığını hem de
135'in eksik kök-tespitini ortaya çıkardı. Açı uçtan uca taşındı, dirsek temsil belirsizliği
(tek tek/toplam · fitting/büküm/mitre) prensibe bağlandı, devreler→v3 erişimi açıldı.

## Bağlam — neden bu oturum açıya gitti
135 v3 İnceleme K2 rozetini bitirmişti; S02 dirsek 🟡'sini "Excel BOM hatalı" diye kapatmıştık.
136'da Cihat gerçek tersane klasörü yükledi → BOM'da `Angle` kolonu görüldü → ağırlığın açıya birebir
orantılı olduğu (oran 0.389 sabit) ölçüldü → 135'in tespiti çürüdü: S02 = 6×15° segmentli bend, Excel doğru.

## Yapılanlar
1. **Açı zinciri (c660346):** excel-parser SOZLUK+sayısal `aci`; ares-kabuk konsolide anahtarı+bom `aci`;
   v3 malzeme sekmesi "Açı" kolonu + "DN"→"Ölçü". Gerçek G200 BOM ile test: açılar ayrı kalem. Geriye-uyumlu.
2. **MK mühürleri (1aaffe9):** 136.1 (açı = kalem kimliği) · 136.2 (MTO/IFS yapısı, tip-başına kolon yok,
   redüksiyon kompound Ölçü) · 136.3 (ham koruma, normalize yok, segment↔toplam dönüşümü yasak) ·
   136.4 (kesim altyapısı boru havuzunu yansıtır, sayfa sonra) · 136.B (aci kalıcılık ertelendi) ·
   135.2 REVİZYON (Excel doğru, kök = K2 açı körlüğü).
3. **devreler.html erişim wiring (kapanışta push):** v2+v3 ayrı flag'li butonlar, v1 zaten var → üçü erişilebilir.

## Kararlar / içgörüler
- **Yöntem belirsizliği insana çözdürülür:** BOM'dan fitting/büküm/mitre kesin çıkmaz (etiket "Elbow" hepsinde;
  M130 87.6° standart-dışı = büküm ama "Elbow" yazıyor). Operatör spool_detay'da seçer (MK-136.4). Bu, dün
  "geometri/içerik katmanı gerekir" çıkmazını zarifçe çözüyor — gerçekte de imalatçı karar verir.
- **Standart uydurma yok:** malzeme listesi IFS/CADMATIC + MTO konvansiyonunu mirror'lar (tek Ölçü kompound +
  tek paylaşımlı Açı + Description + shortcode). Kaynak zaten böyle veriyor.
- **Dürüst kalibrasyon:** açı işi değerliydi (135 hatasını düzeltti) ama wizard'ı "tamam"a taşımaktan saptı.
  Gerçek blokaj GAP 2 (düzelt+çapa, FAZ-1 stub) — test dosyası olmadan anlamlı bitmiyor.

## Mühürlenen MK — yukarıda (136.1/.2/.3/.4/.B + 135.2 revizyon, KARARLAR.md'de)

## Süreç notu
Körlemesine yazma yok: her patch öncesi gerçek dosya/BOM okundu; açı bulgusu canlı BOM'la ölçülerek
doğrulandı (oran sabiti); 135 kararı gerçek veriyle çürütülüp dürüstçe revize edildi ("tamam" demedik);
mockup↔v3 gap'i tek tek tarandı, tahmin edilmedi; erişim wiring v2/v3'ü dışlamak yerine üçlü karşılaştırmaya
açıldı (Cihat düzeltmesi). node --check + diff + MD5 her dosyada.

---
> 137 açılışında: son-durum + bu dosya + CLAUDE-SONRAKI-OTURUM + KARARLAR MK-136.* + PARSER (gerekirse).
> İlk iş: devreler.html push + flag teyidi + 3-buton görsel → sonra GAP 1 (Adım 1 klasör ağacı).
