# CLAUDE-SON-OTURUM.md — Oturum 164 özeti

## Tek cümle
164'ün omurgası "yanlış adres" oldu: G2a v1 sinyallerinin değer kaynağının Excel kabuk olduğu
kanıtlandı (164-B1) ve Cihat'ın A kararıyla kayıt-zamanı kaynak bağı (migration 103 +
deger_kaynagi/format_id) gemiye alındı; aynı refleks oturum içinde Claude'un kendi sabit-'excel'
yamasını çürüttü (MK-164.1 → alan-bazlı v2.1), parse_durumu MK-163.6 borcu grep kanıtıyla
yumuşak emekliliğe ayrıldı, Cihat'ın yakaladığı kalem-kalite boşluğu (ve kabuğun kalite=malzeme
saçması) kapatıldı, W-2.19 ucuz dilimi W-4.4 bbox-normalize standardıyla birlikte gemiye girip
Y200 öğretimine bağlandı; izometri-kaynak ve OPR-terfi kanıtları ile 42.2/3.56 katalog-paket
vakası 165'e devredildi.

## Kanıt zinciri (yöntem: repo-raw/klon kod okuma + canlı SQL + EKRAN kanıtı — MK-126.8/85.3)
1. **164-B1:** rozet kodu (wizard 1204/2027 varsayılan 'Excel') + BOM=excel-generic satirlar
   zinciri + format_id'nin yalnız izometri parse_sonuc'unda olması → v1 sinyalleri Excel
   kaynaklı, kart metni PDF formatına yanlış adres. A/B/C sunuldu; Cihat "nereden dönecez"
   sorusuyla C'nin dönüşsüzlüğünü yakaladı → A'nın gerçek maliyeti çıkarıldı (yazım noktaları
   kaynağı ZATEN biliyor) → A.
2. **Migration 103:** MK-98.2 dry-run → 7 sinyal birebir NULL kovası → COMMIT. CHECK üçlüsü +
   FK ON DELETE SET NULL + görünüm v2 (kolonlar SONA — CREATE OR REPLACE kısıtı) +
   security_invoker korunur.
3. **MK-164.1:** Cihat'ın NB1137 modal ekranı yuzey/alistirma/not'u L2 rozetiyle gösterdi —
   sabit 'excel' yanlış. duzeltAc dsatir kuralı kaynağın alan-bazlı gerçeğiydi
   (cap/et/agirlik/malzeme/kalite=xl · yuzey[yuzeyHam]/alistirma/not=izoSrc|bos) → kaydet bu
   kuralın birebir eşini yazar; izometri ise format_id (devre-inceleme'ye 1 satır:
   ps.format_id taşıma). 10/10 vaka.
4. **MK-163.6:** grep — `_parseDurumu` kurulup HİÇ tüketilmiyor (2707/2793 yalnız
   _kuyrukDurum); devre-inceleme/izo-eslesme'deki parse_durumu kolon değil ÇIKTI alanı (isim
   çakışması). A: SELECT'ten kolon çıkarıldı + alan silindi + BAYAT COMMENT. Davranış sıfır.
5. **Kalite:** KALEM_ALANLAR'da alan yok + ares-kabuk iki dalda `kalite:ham-malzeme`.
   kalemSatirAc async'ti, `_kaliteSecenekYukle` globaldi → spool yolunun birebiri (dinamik
   liste + malzeme süzgeci + kaliteKod eşleme). Kabuk: dz.kalite tercihi, fallback eski
   davranış. 6/6.
6. **W-2.19/W-4.4:** saklanan bbox öğretim-anı zoom pikselindeydi (scale kaydedilmiyor) =
   belirsiz uzay → yakalama anında normalize (norm:1) tek doğru nokta (sample çıkarımı
   scale-uzayında bitmişken). bbox'ın tek geometrik tüketicisi drawMarks (kırpma yok) —
   regresyonsuz. Tüketici sözleşmesi: norm'suz KULLANILMAZ. 6/6 (gidiş-dönüş kimliği dahil).
7. **42.2 vakası:** kuyruk SQL → format e1fb879d (KATALOG-PAKET), et_mm=3.56, satirlar=0;
   cap anahtarı null/teyitsiz. Hüküm ERTELENDİ (MK-85.3) — 165 atölye girdisi.

## Süreç dersleri (164)
- **MK-164.1:** UI'da kaynak gösteren kural varsa, yazan kod o kuralın BİREBİR EŞİNİ kullanır;
  varsayılan rozetten çıkarım yapılmaz. (Ekran görüntüsü = geçerli kanıt türü; kendi yamanı
  da çürütebilir.)
- Cihat'ın "ileride döneriz nereden dönecez" itirazı doğruydu: kaynaksız birikim + backfill
  yasağı = dönüşü olmayan veri. Erteleme kararlarında "dönüş yolu var mı" sorusu standart.
- "Çok hızlısın" anına denk gelen kullanıcı bulgusu (kalite) en değerli ürün girdisiydi —
  hız, kullanıcının ekran gözlemini beklemeyi unutturmamalı.
- JSONB teşhis SELECT'lerinde anahtar adı tahmini = MK-85.3 ihlalinin kardeşi (olusturma_at
  kazası + cap anahtarı). Önce 1 örnek satır dökümü.

## Dosyalar/commit'ler (164)
`1ed95e9` (migrations/103 YENİ + wizard + format_tanit + uyarilar) · `5a80fa7` (devre_detay)
· `7e8469b` (wizard + api/devre-inceleme + ares-kabuk) · `a36f66b` (wizard + format_tanit).
DB: migration 103 COMMIT + parse_durumu BAYAT COMMENT. Doc paketi: BRIEFING + üçlü + 5 yol
haritası 164 ekleri (kesintisiz) + KARARLAR MK-164.1..3. 12/12 ✓ · izometri-oku ✓.
