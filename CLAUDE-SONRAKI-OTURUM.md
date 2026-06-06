# CLAUDE-SONRAKI-OTURUM.md — Oturum 163 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md + **docs/FORMAT-OGRETIM-ATOLYE-162.md**
   (162'nin tek-kaynak bulgu/karar dokümanı, B1-B8) + WIZARD-YOL-HARITASI.md (162 bölümü) oku
4. Kod okuma: repo raw · 5. Teşhis: VERİ→UI→kod (MK-158.1) · 6. Ajanda onayı (Cihat sıralar)

## AÇILIŞ TEYİTLERİ (5 dk)
1. **CI:** `6a27723` (menü kaldırma) + kapanış doc commit'i sonrası yeşil mi (bot rapor commit'i
   dahil). Menü kanıtı: canlıda sol menüde "Format Tanıt" YOK; format_tanit.html URL'den flag'li
   tenant'ta hâlâ açılıyor.
2. **KARARLAR.md:** MK-161.1..5 işli (162 sabah commit'i) ✓; **MK-162.1/162.2/162.3 işlenecek**
   (metinler son-durum.md'de hazır) → tek doc commit `[skip ci]`.
3. **a093eaaa kural teyidi:** pipeline_no = `\n([A-Z]\d+-\d+-\d+)\n` duruyor mu (SELECT şablonu
   atölye dokümanında). Cihat diğer bilgisayardan Y200 kaydı yaptıysa satir_tipi_sayisi 2→N
   olmuş mu + pipeline_no DEĞİŞMEMİŞ mi — yayılım kanıtı oradan devam.

## ANA YÖN (Cihat 162 kararı): YAPISAL EKSİKLER — format çeşitliliği SONRAYA
Toplu format tanıtımları Cihat diğer bilgisayardan yürütür (reçete: ATOLYE-162.md son bölüm).
163 oturumu yapısal borçlara gider; Cihat sıralar, adaylar önem sırası ÖNERİSİYLE:

1. **W-3.11 — B6 tablo yazım yolu (Y200 kaydının da önkoşulu olabilir):** Düzeltme kipinde
   malzeme/tablo öğretimi Güncelle'ye GERÇEKTEN yazılıyor mu? 162'de "değişiklik yok" dedi
   (yanlış PDF'ti — şans). Kanıt yolu: `_patchedKural` `tip!=='tablo'` filtreli; tablonun ayrı
   yazım yolunu kodda izle (Güncelle handler → satir_tipleri'ni kim taşıyor?), gerekirse Y200
   öncesi tamir. Kırıksa W-3.4 yayılım zinciri bütünüyle bloke demektir.
2. **dosya_isleme_kuyrugu drenajı (MK-152.3):** 100+ kayıt 22 Mayıs'tan beri TETİKSİZ, sıfır
   retry. is_kuyrugu cron+self-chain AYRI sistem — karıştırma. Karar gerekir: tetik mi (hangi
   sayfa/endpoint), tek seferlik drenaj mı, Pro sonrası gerçek cron'a mı parklanır (12/12
   duvarı! yeni endpoint açılamaz — mevcut bir endpoint'e bindirme veya client-loop).
3. **W-3.12 — motor tekleştirme + sessiz fallback:** format_tanit `_alanCikar` kopyasını
   l2-parser tek kaynağına bağla (ares-tablo-sentez deseni: aynı modül iki tarafta) + mevcut
   kayıtlı kurallarda `fallback` kullanımı taraması (eşleşmeme ≠ uydurma ayrımı).
4. **Ad/kod düzeltmesi:** "tersan deneme" → yapısal ad (B3 ilkesi: bölge kodu ≠ format; ad
   şablonu/dizayn ofisini anlatır). format_kodu "cadmatic_spool_nps_v1" vs Y200 ODxet satırı
   çelişkisi — aile haritasıyla birlikte gözden geçir (FORMAT-YONETIM-MIMARI §2 güncellemesi).
5. **OPR kalem-ekleme (f) SQL kanıtı:** + Ekle → terfi → `spool_malzemeleri kod='OPR'` SELECT.
6. **MK-117 (yukleyen_id):** sistem yüklemelerine kullanıcı ata VEYA kontrolü sistem-yükleme
   için gevşet (veri sahipliği notuyla).

## ATÖLYE HATTI (paralel, Cihat tetikler)
- Y200 kaydı diğer bilgisayardan (reçete ATOLYE-162.md): sert yenile → a093eaaa seç →
  pipeline_no'ya DOKUNMA (UI kırmızı/G200 = B1 yanlış alarmı) → malzeme bölgesi → 🧮 kanıtı →
  Güncelle → **B6 kontrolü** (satir_tipi_sayisi 2→N; "değişiklik yok" derse DUR, W-3.11'e dön).
- Yayılım: hedefli pdf_sha256 NULL (155 tuzağı: kural-sonrası aynı-gün L2 sha'ları DAHİL) →
  kardeş reset (.SXX) → drenaj → kanıt JOIN (`is_kuyrugu k LEFT JOIN ai_api_log l ON
  l.id=k.ai_api_log_id`): format_id=a093eaaa + parser_seviye=l2 + maliyet_usd=0 +
  pipeline=Y200-804-414 + ham_satir düşmesi yok.
- Zip atölyesi: Cihat çeşitli gemi/devre PDF'leri verdiğinde akış = sunucu-metni dökümü →
  kural mekanik kanıt → SQL kayıt. Format ÇEŞİTLİLİĞİ bilinçli SONRAYA (162 kararı).

## KÜÇÜKLER (birikti — 162'de budanmış liste)
- EN/AR dil paketi: yalnız OPERATÖR yüzleri (wizard/devre_detay modal metinleri); format_tanit
  EN/AR DÜŞTÜ (uzman aracı). · hhbjşlö 1 excel önerisi · 6 B1124 PDF orijinal adlarla ·
  IZO-KANIT v4 yapıştırma + ad kararı · ✖ sessiz-kayıp doğrulaması · E120-722-1015 kuyruğu
  komple `iptal` (kalıntı — temizlik kararı) · W-2.20 canlı göz (okundu→zayıf dağılımı) ·
  G2a öneri-sinyali SQL görünümü (MK-162.2 yakın işi — ucuz).

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · **MK-85.3
şema-önce İSTİSNASIZ (162'de İKİNCİ ihlal — utanç tekrarı yok)** · MK-158.1 VERİ→UI→kod ·
MK-160.2 Düzelt=değer ↔ Tanıt=kural (+MK-162.2 inceltmesi) · MK-161.1 canlı HTML testi = önce
SERT YENİLE · **MK-162.3 format kanıt makamı = SUNUCU METNİ (UI testi görsel-sıra, kanıt
değil); SQL-önce yazılan alana UI'da DOKUNULMAZ** · yer tutucu yerine GERÇEK değer gömülür
(162'de iki kez Cihat'a hata yaşattı) · arespipe_kopyala MD5 + yeni dosyaya git add · pipeline
çapası Continue satırından YAZILMAZ (Continue'lar baş-boşluklu — `\n(...)\n` doğal eler) ·
test yatakları: g200 + aw231 + NB1137 chvvnb + ykjfytjk — SİLME · a093eaaa = "tersan deneme"
(ad yanıltıcı, 163'te düzelecek; pipeline_no kuralı 162'de SQL'le yenilendi) · e1fb879d =
paket ailesi · şema gerçeği: format_id/parser_seviye/maliyet/pdf_sha256 → ai_api_log;
is_kuyrugu → ai_api_log_id JOIN.

> 163 açılışı: ritüel → 3 teyit → yapısal sıra (Cihat onayıyla: W-3.11 → kuyruk drenajı →
> W-3.12 → ad düzeltmesi → küçükler) → kapanış. Atölye hattı paralelde Cihat'ın tetiğinde.
