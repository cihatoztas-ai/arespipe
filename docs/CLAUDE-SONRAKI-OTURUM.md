# CLAUDE-SONRAKI-OTURUM.md — Oturum 161 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: son kod commit'i sonrası oto-rapor · 4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md
   + docs/WIZARD-YOL-HARITASI.md (160 bölümü) + docs/FORMAT-YONETIM-MIMARI.md oku
5. Kod okuma: repo raw · 6. Teşhis: VERİ→UI→kod (MK-158.1) · 7. Ajanda onayı (Cihat sıralar)

## AÇILIŞ TEYİTLERİ (5 dk)
1. **Son paket pushlu mu?** `feat+fix(160)` son düzeltme: devre_wizard_v3.html MD5
   **840eabc19db575fca8792c55db2545bb** (zayıf sebep başlıkta + canvas 7500px emniyeti + pan sınırı
   + Excel/PDF ayrık hata mesajı). Değilse transfer+commit önce. Vendor da repoda mı:
   `ls -la vendor/xlsx.full.min.js` (MD5 31e9848e80e1ddf43c5aa31009cd2b7b).
2. **Excel sekmesi vakası:** tarayıcıda `arespipe.vercel.app/vendor/xlsx.full.min.js` aç — 404 ise
   sebep vendor eksiği/push; 200 ise sekmedeki yeni hata mesajını oku ("Excel açılamadı: …" artık
   gerçek sebebi söylüyor) → ona göre düzelt.
3. **KARARLAR.md:** MK-160.3 (salt görüntüleyici inceltmesi) + MK-160.4 (OPR kalem ekleme) +
   MK-160.5 (önizleme parse enjeksiyonu) işle — metinler son-durum.md'de hazır.

## CANLI TEST SETİ (NB1137 ykjfytjk taslağı — SİLME)
(a) Modal fit: her ekranda tam görünüyor mu, alta taşma bitti mi
(b) Sekmeler: 📐↔🗺 geçiş + 📊 Excel açılıyor mu (teyit 2 sonrası); sheet seçici çok sayfalıda
(c) Pan: her yönde, fit halinde de; sınır (görüntü kaybolamamalı); zoom 5x tavanında canvas BOŞ
    çizmemeli (7500px emniyeti)
(d) Alıştırma VAR + Yüzey Siyah + Not dolu görünüyor mu (E100-722-2015-ALS.S01); Not ✏️ düzelt
(e) Kalem inline ✏️ (PDF açık kalmalı) + kalite süzgeci (malzeme paslanmaz→liste kısalmalı)
(f) **Kalem ekleme uçtan uca:** + Ekle → tanim/tip/dn doldur → YENİ rozeti → TERFİ →
    spool_malzemeleri'nde `kod='OPR'` satırı SQL'le kanıtla; NOT overlay'i → spooller.imalat_not
(g) Zayıf başlıkta SEBEP görünüyor mu ("Excel↔PDF çelişkisi" vb.) + bilgi notu
(h) Batch "Tanıt" → format_tanit işten PDF açıyor mu (is_kuyrugu RLS riski — hata olursa SELECT
    policy SQL'i yazılır) + tersan ailesinde ⚠ paket banner

## ANA ADAYLAR (Cihat sıralar)
- **W-2.20 (160 bulgusu, operatör körlüğü):** zayıf=çelişkide HANGİ ALAN çelişti — bindirme/
  _eslesme listesi modalda satır-bazlı gösterilsin ("Et: Excel 4.5 ↔ PDF 3.05"). Read-before-write:
  bindirme listesi parse_sonuc._eslesme.detay[]'da mı spool dalında mı (kuyruk-isle 549-600).
- **W-2.19 dilim 1:** koordinat envanteri — DB-kurallı formatların parser_kural bölgeleri hangi
  alanlarda konum taşıyor; varsa değere-tıkla → dpvZoomTo bağlanır (altyapı hazır, vurgu dahil).
- **Format hattı ilk KÖPRÜLÜ öğretim turu:** batch Tanıt'tan girilerek Y200 ST37 satır öğretimi +
  W-3.9 panzehiri (adres dersi: a093eaaa=DB) — FORMAT-YONETIM-MIMARI §2 tablosu rehber.
- **Modalın devre_detay'a taşınması** (spool önizleme — Cihat istedi; kod wizard'da, taşıma deseni
  düşünülmeli: ortak modül mü kopya mı — MK-159.2 ruhu: ortak).

## KÜÇÜKLER
- Operatör NOT overlay ↔ eslestir D2 ezme etkileşimi (terfi sonrası parse NOT'u tazeler) — kural
  netleştirilecek (öneri: operatör düzeltmesi varsa eslestir imalat_not'a dokunmasın → eslestir'e
  taslak_duzeltmeleri kontrolü, dikkatli).
- Yüksek zoom'da sol form scrollbar kaybı — canvas emniyeti sonrası tekrar üret; sürerse ayrı bak.
- Glyph bozulması canvas'ta (E100-722) — metin katmanı sağlıklı; Windows/pilot görüntü konusu
  (lib/glyph-onar.js render tarafı), ayrı oturum.
- EN/AR: izb_format_tanit/_t, nav_format_tanit + dv_tab_onay/dv_onayk_*/dv_taslak_spool_yok
  (birikti) + yeni modal metinleri (İncele, + Ekle, YENİ, sebep etiketleri) — dil paketi turu.
- hhbjşlö 1 excel önerisi · 6 B1124 PDF orijinal adlarla · IZO-KANIT v4 + ad kararı · ✖ sessiz-kayıp
  doğrulaması · dosya_isleme_kuyrugu 100+ stuck kayıt (Mayıs 22) tetiksiz — drenaj cron/trigger.
- B2 kartı format_tanit'te uykuda — uyandırma ancak bağlam taşıyan köprüyle (bilinçli).

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-126.8 TAM oku
+ kolonları koddan doğrula + YORUMU EZBERDEN YAZMA (160'ta yama anchor'ı patladı — dosyadan kes) ·
MK-157.1 taslakta spooller yok · MK-158.1 VERİ→UI→kod · MK-159.3 kod gerçeği > devir (139-153
KARARLAR boşluğu ikinci kanıt) · MK-160.2 kip sözlüğü: Düzelt=değer ↔ Tanıt=kural · MK-160.3 salt
görüntüleyici serbest, öğretim altyapısı kopyası yasak · SQL şablonlarında yer tutucu verme ·
arespipe_kopyala MD5 + yeni dosyaya git add · test yatağı: g200 + aw231 + NB1137 chvvnb + **NB1137
ykjfytjk (büyük modal seti)** — silme!

> 161 açılışı: ritüel → 3 teyit → canlı test seti (a-h) → KARARLAR MK-160.3/4/5 → Cihat sıralamasıyla
> ana iş (W-2.20 / W-2.19 / köprülü öğretim turu / devre_detay taşıma) → kapanış.
