# son-durum.md — Oturum 160 (2026-06-06)

## Bu oturumda ne yapıldı
1. **AÇILIŞ TEYİTLERİ:** 159c commit'i (ea94f38) zaten pushluymuş ✓ · taslak NULL temizliği
   COMMIT'li (sorgu=0) ✓ · modal tıklama testleri canlı turda dolaylı yapıldı (✏️/PDF çalışıyor).
2. **KÖPRÜ ALTYAPISI (W-3.2 + format_tanit `?is=` yükleyici):** iki kuyruk/iki bucket bulgusu
   (dosya_isleme_kuyrugu→devre-belgeleri / is_kuyrugu→izometri-pdfs) → `?is=<id>&kaynak=devre|batch`
   sözleşmesi. format_tanit işten PDF açar (signed-URL→download yedekli), AI-oku köprü PDF'iyle
   çalışır, paket-katmanlı ailede ⚠ MK-155.1 banner. Batch "Tanıt" butonu (bilinmeyen satır) +
   nav "Format Tanıt" girişi + dosya-url-al allow-list'e izometri-pdfs + devre-inceleme `is_id`
   taşıma (lib SAF, K2 deseni; mekanik test 6/6 yeşil, test-isid.mjs repoda).
3. **docs/FORMAT-YONETIM-MIMARI.md (ana iş çıktısı):** dört katman (K1-K4) × yazma hedefi ×
   etkinleşme tablosu; tek otorite kararı MK-160.1 (adres-bilinçli ikilik, yeni aile AILE_KAYIT'a
   eklenmez, uzun vade facet→DB); kip sözlüğü MK-160.2 (Düzelt=değer/tekil ↔ Tanıt=kural/format).
4. **KARARLAR.md BÜYÜK BULGU + GERİ DOLDURMA:** dosyada en son MK-138.3 işliydi — 139-159 hiç
   işlenmemiş (MK-159.3'ün ikinci vakası: "157-159 birikti" devri boşluğu küçük gösteriyordu).
   154-160 seti kaynak-kanıtlı işlendi (18 kayıt), 139-153 BOŞLUK NOTU dosyada (ezberden yazılmadı,
   MK-126.8). MK-160.3/4/5 161'de işlenecek.
5. **YÖN DEĞİŞİMİ (Cihat) → SPOOL MODALI "BÜYÜK EKRAN":** W-3.1 wizard köprüsü İPTAL ("buradan
   format tanıma ekranı çıkmasın") — değer işi Düzelt modalında, PDF YANINDA. Aynı gün canlı test
   döngüsüyle evrim: (a) yan PDF paneli → pdfjs SALT görüntüleyici (MK-159.2 inceltmesi MK-160.3:
   öğretim altyapısı kopyası yasak, salt görüntüleyici serbest; vendor format_tanit ile aynı, lazy);
   sayfa/zoom(5x tavan + 7500px canvas emniyeti)/drag-pan(transform tabanlı, sınırlı — görüntü
   kaybolamaz). (b) Sekmeler: 📐izometri ↔ 🗺montaj (kok+bagli_spoollar eşleşmesi — fit
   düzeltmesinden sonra GELDİ) ↔ 📊**Excel** (SheetJS vendor/xlsx.full.min.js, sheet seçici, doğal
   scroll; ilk testte açılmadı — hata mesajı detaylandırıldı, 161 kontrolü). (c) Modal fit:
   fixed+calc — viewport'tan büyüyemez, z-index 600. (d) Her satırda buton: zayıf=Düzelt(sarı),
   sağlam=İncele(yeşil). (e) Kalem ✏️ INLINE (modal değişmez, PDF açık kalır; aynı kalemKaydet
   motoru, _kalemCfg birleşik lookup). (f) **KALEM EKLEME**: "+ Ekle" → kalem_idx≥bom.length,
   YENİ rozeti + 🗑; terfide aktar `kod:'OPR'` spool_malzemeleri satırı (tanim/tip ek alanları
   yalnız yeni kalemde — mevcut düzeltme setine sızmaz). (g) "PDF'TEN OKUNAN (HAM)" bölümü —
   parse dalının generic dökümü (W-2.18 modal hali). (h) Önizleme enjeksiyonu (devre-inceleme):
   alıştırma 117 kuralı BİREBİR (ALS dosya→VAR / alistirma_ipucu) + NOT + yüzey (kabuk_bos kuralı).
   (i) NOT alanı düzeltilebilir → aktar `not`→imalat_not overlay (D2 ezme etkileşimi notlu).
   (j) Kalite süzgeci: kategori_kod ile malzemeye göre (paslanmaz→paslanmaz kaliteleri).
   (k) Zayıf SEBEBİ başlıkta (çelişki/kritik/güven) + "düzeltme rozeti değiştirmez" bilgi notu.
   (l) W-2.19 altyapısı: `dpvZoomTo(sayfa,bbox)` + sarı vurgu — bağlantı koordinat envanteri (161+).
   (m) 159 ölü butonu temizlendi (cizimdenOku — tanımsız fonksiyon, ReferenceError atıyordu).

## Bulgular (160)
- "PDF 3 satır / kabuk 2 kalem" vakası muhtemelen KONSOLİDE (1+1 flanş = "2 ad"), atlama değil —
  ama gerçek eksikler için kalem-ekleme kapısı artık var. ZAYIF ÇELİŞKİ DETAYI açık: hangi alanın
  çeliştiği modalda gösterilmiyor (bindirme/_eslesme listesi) — operatör neyi düzelteceğini bilmeli.
- Glyph bozulması canvas'ta belirgin (E100-722 ailesi), metin katmanı/ham döküm SAĞLIKLI —
  Windows/pilot görüntü konusu.
- Yüksek zoom'da sol form scrollbar kaybı raporlandı — canvas emniyeti (7500px) sonrası tekrar test.

## Commit'ler (160) — Cihat push etti / EDECEK
| Durum | İçerik |
|---|---|
| pushlu | feat(160) köprü paketi (6 dosya + test-isid.mjs) |
| pushlu | docs(160) FORMAT-YONETIM-MIMARI (01bc368) + KARARLAR 154-160 (aeed56d) |
| pushlu | feat(160) B2 değer kipi (sonra uykuya alındı) · feat+fix büyük modal paketi · Excel kipi |
| **BEKLİYOR** | son düzeltme paketi: devre_wizard_v3.html (840eabc19db575fca8792c55db2545bb) — zayıf sebep + canvas/pan emniyeti + hata mesajları |
DB değişikliği YOK (migration yok). 12/12 ✓. izometri-oku DOKUNULMADI ✓ (yalnız salt okuma).

## MK kayıtları
- **MK-160.1 + MK-160.2** KARARLAR.md'de İŞLİ (aeed56d).
- **MK-160.3 (161'de işlenecek):** MK-159.2 İNCELTMESİ — yasak olan öğretim/çapa ALTYAPISININ
  kopyasıdır; SALT görüntüleyici (render+pan+zoom+sekme, vendor ortak) serbesttir. Spool modalı
  yan paneli bu kapsamda pdfjs viewer oldu; embed denemesi aynı gün aşıldı (pan ihtiyacı).
- **MK-160.4 (161'de):** Operatör kalem ekleme — kalem_idx≥bom.length taslak_duzeltmeleri'nde
  yaşar; aktar `kod:'OPR'` ile spool_malzemeleri'ne yazar; tanim/tip ek alanları yalnız yeni kalem.
- **MK-160.5 (161'de):** Önizleme parse enjeksiyonu — taslakta spooller yok (MK-157.1) diye
  eslestir'in terfi-sonrası yazdığı alanlar (alıştırma/NOT/yüzey) endpoint'te AYNI kurallarla
  (117 birebir) satıra taşınır; kalıcı yazım yine terfi/eslestir hattında.

## 161 ANA ADAYLAR (Cihat sıralar)
Son paket push+deploy → büyük modal canlı test seti (aşağıda, SONRAKI dosyada) → zayıf ÇELİŞKİ
DETAYI (W-2.20) → format hattı ilk köprülü öğretim turu (batch Tanıt) → devre_detay'a modal taşıma.
