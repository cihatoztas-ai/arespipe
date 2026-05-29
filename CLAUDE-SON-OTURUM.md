# Oturum 133 — K2 (malzeme listesi çapraz kıyası) v1 canlı

132 hijyen mührünün ardından ilk yapım oturumu. 132'nin "açık gerçek iş" diye işaret ettiği K2
(Bölüm 4.3 ayak-b) v1 olarak kodlandı, gerçek S02 verisiyle doğrulandı, üç MK ile mühürlendi.
**Yeni endpoint yok, migration yok, MK-49.1 korundu** (izometri-oku.js'e dokunulmadı). Lib evrensel
katmanda; cascade'i (117/118 mührü) tüketir, kurmaz.

## Bağlam

- Açılış: git temiz, HEAD `f71342d`, CI yeşil, function 12/12.
- 132'nin hijyen push'u (`f234856` + KARARLAR + PARSER 7.4) zaten yapılmış — re-do yok, verify ve geç.
- Cihat dört dosya gönderdi: `kuyruk-isle-izometri.js`, `ares-kabuk.js`, `l2-parser.js` + (önceki
  oturumdan) `PARSER-VE-YUKLEME-AKISI.md`.
- Cihat'ın hatırlatması: "katmanlı bir yapı kurmuştuk… formattan bağımsız / tersane / gemi". Arşivden
  doğrulandı: 117'de ilk taş, 118'de mühür — 3 katmanlı en-özel-kazanır cascade (`katman-birlestirici.js`
  + `format-paketleri.js`). K2 evrensel katmanda oturur.

## Yapılanlar (sırayla — her adım canlı kanıt)

1. **Şekil çıkarımı koddan:** l2-parser → PDF `malzeme_listesi[]` (kategori, dn|dis_cap_mm, malzeme,
   kalite, tanim, agirlik_kg, adet, boy_mm; `kategori='islem'` ayrı yakalanır). ares-kabuk → Excel
   `bom[]` + `spool_malzemeleri` INSERT şeması (`malzeme` kanonik, `kalite` ham; `tip` boru/fitting).
   kuyruk-isle-izometri eslestir (satır 498-648) → `bindir` çağrı noktası, `_eslesme.detay[]`
   yazım deseni. **Server-side `ARES_NORM` yok** (`lib/ares-normalize*` yok, `malzemeKod` referansı
   `lib/`+`api/`'de boş) → lib kendi minimal normalizasyonunu yapar.

2. **Lib v1 koşumu — canlı veriyle 3 keşif:** Cihat'ın gerçek S02 verisi (kuyruk `f713eee4...`):
   PDF 20 ham kesim satırı × Excel 5 konsolide. Naive diff yazılınca üç çakıltı:
   - PDF ham kesim, Excel konsolide → K2 önce konsolide etmeli (yoksa "11 fazla" şamatası).
   - Tanım iki dilde (PDF TR, Excel EN) → tanımla eşleştirme imkansız, parça-tipi sözlüğü TR+EN şart.
   - "Steel" içinde "Tee" substring eşleşmesi → kelime-sınırı eşleşmesi zorunlu.

3. **Lib v2 — kelime-sınırı düzeltmesi + kategoriye göre kıyas:** Boru için boy primary + ağırlık
   soft; fitting için adet exact + per-adet ağırlık; işlem kıyastan dışlanır. S02'de iki çakıltı
   açığa çıktı: (a) boru 323.9 "adet 12 vs 1" yanlış 🟡 (PDF=parça, Excel=tek satır) — borularda
   adet kıyası kapatılmalı; (b) dirsek ağırlık 212 vs 35 → baz farkı sorusu.

4. **Cihat'la baz semantiği konuşması — Üç MK doğdu:**
   - Cihat: "borular uzunluk, flanş ve fittingsler adet" + "kaynak/yiv işlem olarak tanınmalı".
     → boru = boy primary, fitting = adet + per-adet ağırlık, işlem = dışla. (MK-133.2 + işlem
     kategorisi).
   - Cihat: "flanş Excel'de var PDF'te yok kısmını anlamadım. Montaj malzemeleri civata conta gibi
     şimdilik göstermede de olur." → montaj kapsamı info bucket, fab kapsamı 🟡 (MK-133.1 kapsam).
   - Cihat: "boru ağırlık sapması nereden geliyor bilmiyorum" → soft sinyal, info (alarm değil).
   - Cihat'tan kritik müdahale: "Dirsek standart 90° düşünüyoruz ama 27° de olabilir... boru kesim
     optimizasyonu gibi". K2 ilk yaklaşımım (açı toplamı ≤ adet × 90 + fire) yanlış çerçeveydi —
     artan parça fire değil **geri-stok**. Cihat'ın gözlemi MK-133.3'ün özü.
   - Cihat: "Excel referans derken bu IFS dosyasını düşünerek söylüyorum. Eğer program çıktısı
     olmayan bir excel ise bu kadar rahat olamayız." → Excel'in otorite rolü kaynak güvenine bağlı
     (MK-133.1).

5. **Lib v3 — dirsek özel branch + excel_guven tag:** Toleranslar: cap %3 sert; boru boy %5 sert +
   ağırlık %10 yumuşak; fitting per-adet ağırlık %5; **dirsek toplam-ağırlık %15** (malzeme-korunumu,
   fire toleransı). Dirsek için adet ve boy IGNORE. S02 fixture'da:
   ```
   eslesen:3 celiski:1 pdf_fazla:0
   excel_fazla -> fab:0 montaj:1 belirsiz:0
   flagVar: true (dirsek bulgusundan)
   ```
   - boru 406.4 ✓, boru 323.9 (boy %0.2 ✓, kg soft-info), bilezik DN400 ✓.
   - dirsek 323.9 🟡 (toplam kg 212 vs 35 — yaklaşık 6× sapma; gerçek bulgu).
   - flanş Slip-On DN300 → montaj-info.

6. **Wiring — 5 noktasal patch kuyruk-isle-izometri:** import (1), batch spool_malzemeleri fetch
   (17), malzemeKiyas çağrısı bindir'in yanına (6), detay.push'a 2 alan, ozet'e 1 sayım. `node --check`
   syntax OK. Mevcut hiçbir satır silinmedi. Bindir deseniyle birebir simetrik.

7. **PARSER belge zenginleştirme:** Bölüm 4.4'e 133 güncelleme notu, Bölüm 7.5 yeni (K2 v1 canlı +
   S02 doğrulaması + 3 tasarım kararı + MK-133.1/2/3 + açık borçlar), Bölüm 8 K2 satırı "v1 CANLI",
   Bölüm 9 MK atıf haritasına MK-133.1/.2/.3. **Mevcut metin korundu, yalnız ekleme.**

## Verdict

K2 v1 çalışıyor: senin "tetikçi testi" (Bölüm 7.1-b) tam tezahür etti — dimensiyonlar tutsa bile
ağırlık üstünden yakalandı (boru 323.9 soft sapma, dirsek 6× sert sapma, flanş eksiklik). Excel-
otorite varsayımıyla dirsek bulgusu gerçek 🟡; üç olası kök (PDF parser bug, Excel parse basis,
gerçek BOM hatası) ayırt edilmiyor — sebep araştırması ayrı iş, K2'nin görevi sapmayı yüzeye
çıkarmak. **Bunu yapıyor.**

## Mühürlenen MK'lar (KARARLAR.md'ye eklenecek; copy-paste hazır `KARARLAR-ekleme-133.md`'de)

- **MK-133.1** — Çapraz doğrulamada Excel'in referans rolü kaynak güvenine bağlı (otorite/parite);
  lib aynı sapmayı üretir, `meta.excel_guven` tag'i UI dili belirler. v1 sabit `'otorite'`; format
  paketinden otomatik türetimi backlog.
- **MK-133.2** — `spool_malzemeleri.agirlik_kg` satır-toplamı semantik. Per-adet türetimi
  `agirlik/adet`. Fitting per-adet, boru toplam, dirsek toplam (özel).
- **MK-133.3** — Dirsek için malzeme-korunumu invariantı (toplam ağırlık ±%15), adet ve boy IGNORE.
  Tam kesim-optimizasyonu (bin-packing) v2 borcu — PDF açı verisi akmaya başlayınca.

## Süreç notu

132 disiplini (canlı yolak doğrulama, MK-132.1) burada da geçti: körlemesine kod yazmadım, gerçek
S02 verisi üstünde her iterasyon koşuldu. Her iterasyon yeni bir tasarım çakıltısı çıkardı (cross-
language, kapsam ayrımı, dirsek invariantı). Cihat'ın domain bilgisiyle her çakıltı bir MK'ya
mühürlendi. Doc + lib + wiring + KARARLAR aynı oturumda hizalı kapatıldı.

---

> 134 açılışında: bu dosya + son-durum + CLAUDE-SONRAKI-OTURUM + PARSER Bölüm 7.5.
> **İlk iş: toplu push paketi; ardından canlı re-parse ile S02 dirsek bulgusunun teyidi.**
