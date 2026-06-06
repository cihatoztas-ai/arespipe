# son-durum.md — Oturum 162 (2026-06-06)

## Bu oturumda ne yapıldı
1. **AÇILIŞ TEYİTLERİ (4/4):** CI yeşil — 161'in bot rapor yarışı kendiliğinden çözülmüş
   (cd7d6ed temiz, re-run gerekmedi; rapor: 0 hata / 102 uyarı baseline) · KARARLAR'a
   MK-161.1..161.5 işlendi + `[skip ci]` commit · tounicode MD5 ✓ (67bf9263...) · W-2.20
   canlı gözü ertelendi (oturum yön değiştirdi).
2. **Y200 öğretimi → YAPISAL İNCELEMEYE DÖNDÜ:** pipeline_no'da ÜÇ farklı değer (UI kural:
   G200 · eski DB kuralı: Y110 · AI: Y200). Kökler kanıtlandı: (a) **tarayıcı metni ≠ sunucu
   metni** — format_tanit `extractAll` GÖRSEL sıra (Y-koordinat gruplama), sunucu pdf-parse
   content-stream sırası; UI yeşil/kırmızısı bu sınıf alanlarda KANIT DEĞİL; (b) `cozumle()`
   oto-çözümü synth çapa disiplinini bypass ediyor (çıplak regex üretir — DB'deki eski kural
   oradan); (c) Cadmatic'te "etiketin ardından" yapısal ölü (değerler etiket bloğundan ÖNCE).
3. **pipeline_no kuralı KANITLI GEMİDE:** sunucu metni lokal dökümle test (pdf-parse +
   glyph-onar; band-A onarıldı; Continue satırları baş-boşluklu → `\n(...)\n` doğal eler) →
   a093eaaa `parser_kural.alanlar.pipeline_no` = `\n([A-Z]\d+-\d+-\d+)\n` (jsonb_set; şema-önce
   SELECT → UPDATE → doğrulama). `[A-Z]`: bölge kodu ≠ format (Cihat ilkesi).
4. **E100 vakası:** Açık PDF E100-817-005 çıktı (Y200 diğer bilgisayarda); otoTespit ÜÇÜNCÜ kez
   "tersan deneme" dedi (5/6), malzeme öğretimi yapıldı, Güncelle "değişiklik yok" → DB teyit
   satir_tipi_sayisi=0 (yanlış adrese yazım OLMADI — şans + `_patchedKural` tablo filtresi).
   YENİ ŞÜPHE (B6/W-3.11): tablo öğretiminin düzeltme-kipi yazım yolu hiç çalışmıyor olabilir.
5. **MK-162.1 [URUN] ATÖLYE KARARI (Cihat):** format_tanit uzman aracı — menüden kaldırıldı
   (`6a27723`, CI'lı kod commit). Öğretim akışı: zip → sunucu-metni dökümü → mekanik kural
   kanıtı → SQL kayıt → drenaj kanıtı. Kullanıcıya açılış şartı = C yolu (otomatik öneri+onay).
6. **MK-162.2 [URUN]:** G2a düzeltme birikimi → kural ÖNERİSİ köprüsü (Düzelt=değer / Tanıt=
   kural ayrımı KORUNUR; birikim öneriye, öneri uzman onayına). + Wizard sadeleşme kararı:
   cap/et/dn sorusu kalkar (sentez türetir) — öğretim çekirdeği KİMLİK + MALZEME BÖLGESİ.
7. **docs/FORMAT-OGRETIM-ATOLYE-162.md (YENİ):** B1-B8 kanıtlı bulgular + atölye modeli +
   borç budaması + Y200 6-adım kayıt reçetesi (B6 kontrolü gömülü).
8. **MK-85.3 İKİNCİ ihlal (Claude, kabul):** `is_kuyrugu.format_id` ezberden → hata. Şema
   gerçeği: format_id/parser_seviye/maliyet_usd/pdf_sha256 **ai_api_log** kolonları; kuyruk
   `ai_api_log_id` ile JOIN. E100-817 is_kuyrugu'da YOK (hiç işlenmemiş — bilgi).

## Bulgular (162)
- **B1 metin ayrışması** (kök — yukarıda) · **B4 sessiz fallback** (`alanCikar` eşleşmeme ile
  fallback-uydurma ayrımını çağırana vermiyor) · **B7 motor kopyası** (format_tanit `_alanCikar`
  l2-parser kopyası, ŞİMDİDEN sapmış: whitelist dalı yok) · **B6/W-3.11 tablo yazım şüphesi** ·
  a093eaaa format_kodu "nps_v1" ama Y200 satırı ODxet — ad/kod/aile haritası gözden geçirilecek.
- Hibrit sıra dersi: SQL-önce yazılan alana UI'da dokunulmaz (dirty → Güncelle ezer).

## Commit'ler (162)
| Hash | İçerik |
|---|---|
| (sabah) | docs(162): KARARLAR MK-161.1..161.5 islendi [skip ci] |
| 6a27723 | feat(162): format_tanit menuden kaldirildi - uzman araci karari MK-162.1 |
| (kapanış) | docs(162): atölye dokümanı + devir paketi [skip ci] |
DB: a093eaaa pipeline_no jsonb_set (tek UPDATE, kanıtlı). Migration YOK. 12/12 ✓.
izometri-oku DOKUNULMADI ✓. CI: yeşil.

## MK kayıtları (162 — KARARLAR'a işlenecek, metinler hazır)
- **MK-162.1 [URUN]:** format_tanit operatör ürünü değil UZMAN ARACIDIR (gerekçe + atölye akışı
  + C-yolu şartı — docs/FORMAT-OGRETIM-ATOLYE-162.md Bölüm 2).
- **MK-162.2 [URUN]:** G2a → öğrenme köprüsü: düzeltme kurala dönüşmez; BİRİKİM öneriye dönüşür,
  öneri ONAYDAN geçer (MK-160.2 inceltmesi).
- **MK-162.3 [DISIPLIN]:** Format öğretiminde kanıt makamı SUNUCU METNİDİR (pdf-parse +
  glyph-onar lokal dökümü + drenaj SQL'i); format_tanit UI testi görsel-sıra metniyle koşar,
  bu sınıf alanlarda kanıt sayılmaz. Hibrit kayıtta SQL-önce yazılan alana UI'da dokunulmaz.
- (Tekrar kaydı) MK-85.3 ikinci ihlal — şema-önce istisnasız.

## 163 ANA YÖN (Cihat kararı): YAPISAL EKSİKLER
Format çeşitliliği SONRAYA; toplu format tanıtımları Cihat diğer bilgisayardan (reçete hazır).
163 adayları: W-3.11 (B6 tablo yazım yolu doğrulama/tamir — Y200 kaydının önkoşulu da olabilir) ·
dosya_isleme_kuyrugu 100+ stuck drenaj/tetik (MK-152.3, 22 Mayıs'tan beri) · W-3.12 motor
kopyası tekleştirme + sessiz fallback taraması · KARARLAR'a MK-162.x işleme · "tersan deneme"
AD/kod düzeltmesi · OPR (f) SQL kanıtı · MK-117 (yukleyen_id) · otoTespit çapraz doğrulama
(tasarım, aciliyet düştü).
