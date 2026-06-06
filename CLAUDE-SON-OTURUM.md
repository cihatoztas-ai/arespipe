# CLAUDE-SON-OTURUM.md — Oturum 162 özeti

## Tek cümle
Plan "Y200 satır öğretimi kaydı + yayılım"dı; pipeline_no'da kural/AI/UI'nin ÜÇ farklı değer
vermesi (G200/Y110/Y200) ve Cihat'ın "format tanıma mantığını elden geçirsek mi" + "normal
kullanıcı bunu yapamaz" yön vermeleriyle oturum yapısal incelemeye döndü — tarayıcı/sunucu
METİN AYRIŞMASI kök bulgu olarak kanıtlandı, pipeline_no kuralı sunucu metninde mekanik kanıtla
SQL'den gemiye alındı, ve format_tanit ÜRÜN OLMAKTAN ÇIKARILDI (MK-162.1 atölye kararı, menüden
kaldırma `6a27723`); Y200 malzeme kaydı reçeteyle diğer bilgisayara devredildi.

## Kanıt zinciri
1. **G200/Y110/Y200 üçlüsü:** UI "etiketin ardından PIPE NO" seçiliyken kural G200 buldu →
   alanCikar okundu (çapa kavramı motorda yok, düz match — DOĞRU tasarım; synth çapayı regex'e
   gömüyor; `cozumle()` oto-çözüm bunu BYPASS ediyor, DB'deki çıplak `(Y\d+...)` oradan).
2. **Sunucu metni dökümü (lokal node, pdf-parse+glyph-onar):** ham döküm band-A çorbası →
   `glyph_band_a_onarildi`; değer satırı (17) Continue'lardan (65/70) ÖNCE, Continue'lar satır
   başı BOŞLUKLU. İki mekanik test: `^([A-Z]\d+-\d+-\d+)$`(m) ve synth-deseni `\n(...)\n` →
   her ikisi Y200-804-414. UI'nin G200'ü = `extractAll` GÖRSEL sıra (Y-koordinat gruplama) ≠
   sunucu content-stream sırası. **UI yeşil/kırmızı bu sınıf alanlarda kanıt değil.**
3. **Kural SQL'den gemide:** şema-önce SELECT (parser_kural yapısı + kaçış konvansiyonu) →
   jsonb_set → doğrulama SELECT. a093eaaa pipeline_no = `\n([A-Z]\d+-\d+-\d+)\n`. `[A-Z]`
   bilinçli — Cihat: Y200 bölge kodudur, format kimliği değil (aynı desen başka bölgelerde).
4. **E100 vakası (otoTespit 3. tetik):** açık PDF E100-817-005'ti (Y200 değil!), otoTespit yine
   "tersan deneme" (5/6); malzeme öğretildi, Güncelle "DEĞİŞİKLİK YOK" dedi → DB teyidi
   satir_tipi_sayisi=0 (temiz — şans). İKİ bulgu: yanlış-adres riski canlı + tablo öğretiminin
   düzeltme-kipi YAZIM yolu şüphesi (B6/W-3.11: `_patchedKural` `tip!=='tablo'` filtreli).
5. **Hibrit sıra dersi:** SQL-önce yazılan alana UI'da dokunulmaz — dirty olursa Güncelle ezer
   (`_patchedKural` derin-kopya + yalnız-dirty, MK-111.2 → dokunulmadıkça SQL güvende).

## Karar (Cihat) — MK-162.1 ATÖLYE
format_tanit operatör ürünü DEĞİL, uzman aracı: menüden kaldırıldı (`6a27723`, ares-layout.js
-6 satır; sayfa feature-flag'le yaşar, batch Tanıt köprüsü uzman girişi). Öğretim = Cihat+Claude
atölyesi (zip → sunucu-metni dökümü → mekanik kural kanıtı → SQL kayıt → drenaj kanıtı).
Kullanıcıya açılma şartı: C yolu (L3 çıktılarından otomatik kural ÖNERİSİ + uzman onayı).
MK-162.2: G2a düzeltme birikimi → öneri köprüsü (Düzelt=değer/Tanıt=kural KORUNUR).
Wizard sadeleşmesi: cap/et/dn sorusu kalkar (malzeme sentezi türetir). Borç listesi buduması:
format_tanit EN/AR + B2 kartı DÜŞTÜ; W-2.19 ve UI/sunucu metin hizalaması C'ye indi.

## Süreç dersleri (162)
- **MK-85.3 İKİNCİ ihlal (kabul):** `is_kuyrugu.format_id` ezberden — gerçek: format_id/
  parser_seviye/maliyet_usd/pdf_sha256 = **ai_api_log** kolonları, kuyruk `ai_api_log_id` ile
  bağlanır. Aynı oturumda "tekrarlamayacağım" deyip tekrarlandı — şema-önce İSTİSNASIZ.
- Yer tutucu disiplini: `PDF_YOLUNU_BURAYA` / `<tam-uuid>` iki kez Cihat'a hata yaşattı —
  eldeki gerçek değer komuta GÖMÜLÜR.
- "Değişiklik yok" toast'ı çift anlamlı: bu kez kurtarıcı (yanlış PDF yazılmadı), ama yazım
  yolu kırığının da belirtisi olabilir — Y200'de ayrıştırılacak.
- E100 tablo dili (NPS+Sch `2" Sch 10S/316L`) ≠ Y200 (ODxet `139.7x4.5`) — a093eaaa
  format_kodu "cadmatic_spool_nps_v1" ad/kod/aile haritası gözden geçirilmeli.

## Dosyalar/commit'ler (162 — hepsi pushlu)
KARARLAR.md (MK-161.1..161.5 işlendi, `[skip ci]` doc commit) · ares-layout.js −6 satır
(`6a27723`, CI'lı) · docs/FORMAT-OGRETIM-ATOLYE-162.md (YENİ — B1-B8 bulguları + atölye modeli +
Y200 reçetesi; MD5 ddeaf572d125846b5e1e474bcff21084). DB: a093eaaa pipeline_no jsonb_set (tek
UPDATE, doğrulama SELECT'li). Migration YOK. 12/12 ✓. izometri-oku DOKUNULMADI. CI: sabah teyidi
yeşil (161'in bot yarışı kendiliğinden çözülmüş; re-run gerekmedi).
