# AresPipe BRIEFING — 157. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> İlerleme aynası: docs/WIZARD-YOL-HARITASI.md (157 işaretleri işlendi).

## HEAD
- Kod: `fix(157): eslestirme-backfill ERR_REQUIRE_ESM — CJS zinciri lazy import()` + kapanış doc commit'i üstte.
- **DB:** migration YOK. Endpoint YOK (12/12). Veri: 39a2c81b fingerprint'e dosya_adi_regex eklendi
  (montaj öğretimi) + hhbjşlö 22 montaj işi reset→yeniden işlendi. izometri-oku DOKUNULMADI.

## 157 — yapılanlar (Format Tur 1: NB1124 TAM KAPANIŞ, 44/44)
1. **Teşhis İKİ KEZ devrildi (kanıtla):** (a) dosyaAdiParse regex'i zone'suz `<NPS>x<NPS>` dahil
   9/9 kalıbı ZATEN tutuyordu — Madde 0 regex genişletmesi gereksizdi; (b) kabukta_yok ×22
   YAPISALDI: taslak devrede spooller boş, eslestir spooller'dan okur (MK-157.1, MK-156.1'in ikizi);
   (c) ".SXX'siz 22 dosya" tablosuz çizim değil M+İ çiftinin MONTAJ kanadıydı (MK-157.3).
2. **eslestirme-backfill 140'tan beri production'da ÖLÜYMÜŞ:** ERR_REQUIRE_ESM — Vercel runtime
   require(ESM) desteklemiyor, modül yüklemede tüm endpoint çöküyordu (MK-157.2). 129-130
   "terfi sonrası izometri bağlanmıyor" borcunun köküydü → fix: CJS zinciri lazy import(),
   yalnız tip=malzeme dalında. Repro standardı: node@20.11 (lokal 20.19+/22 Vercel'i temsil etmez).
3. **Kanıt zinciri:** hhbjşlö terfi (22 spool) → backfill canlı → kabukta_yok 22→0, eslesti 22,
   cizim_durumu 22×kismi.
4. **Montaj öğretimi:** 39a2c81b'ye dosya_adi_regex (DB fingerprint; 36/36 lokal ad testi: montaj
   tutar, imalat/diğer tutmaz — `.SXX` doğal guard) → 22 iş reset → drenaj → 22/22 montaj L2 **$0**,
   montaj eşleşmesi 22/22 (eslesen=1/atanmamis=0 her dosyada), 22 sahte manuel_onay temizlendi.
   Cache güvenliydi: anahtar (sha, format_id) ve format NULL'ken cache hiç sorgulanmıyor.
5. **Onay Kuyruğu read-before-write (158 önkoşulu):** excel oneri_hazir tüketicisi VAR
   (onayModalAc→onayAktar→aktar); izometri oneri_hazir tüketicisi BİLİNÇLİ YOK (109/A — veri
   otomatik uygulanır, "toplu onay"=durum kapatma geçişi); izometri manuel_onay tüketicisi YOK =
   DELİK (uyarılar hiçbir UI'da açılmıyor) — 158 sekmesinin asıl işi.
6. **parse_durumu kararı:** ölü/yedek alan — UI 102'den beri kuyruk-truth kullanıyor (kuyrukMap);
   izometri dokümanları 'bekliyor' kalır, zararsız. DOKUNMA; KARARLAR notu: kuyruk=truth.

## ⚠ MK-157.1 / 157.2 / 157.3
**MK-157.1:** Taslak devrede kabukta_yok YAPISALDIR (MK-127.4 sonucu). kabukta_yok teşhisinde İLK
kontrol = devre durumu (taslak/aktif); format/regex suçlamadan önce.
**MK-157.2:** Vercel runtime require(ESM) desteklemez; lokal modül yükleme testi Vercel'i temsil
etmez. Modül-seviyesi require şüphesinde repro: `npm exec node@20.11`. Serverless'ta UMD/CJS
dosyalar dinamik import() ile, mümkünse yalnız ilgili dalda lazy yüklenir.
**MK-157.3:** `.SXX`'siz Cadmatic PDF = montaj adayı (M+İ çifti), "tablosuz çizim" değil. Montaj
fingerprint'inde içerik sinyali tek başına yetmez (tek-segmentlide "Continue:" yok, malzeme tablosu
zaten yok) → dosya_adi_regex şart. W-2.4 dışlamanın "ertelenemez" gerekçesi düştü (vaka örneksiz kaldı).

## 158 ANA İŞ
1) **Onay Kuyruğu sekmesi implementasyonu** (tasarım 156 + read-before-write 157 tamam): izometri
   manuel_onay uyarı listesi (parse_sonuc.spoollar[].uyarilar) + tekil kapatma; oneri_hazir toplu
   kapatma geçişi (oneri_hazir→tamamlandi, veri işlemi yok); atanmamis "eşleştir"; devreler.html
   rozet. Test yatağı: g200 + 265-overboard (hhbjşlö artık çözüldü — yeşil yol örneği olarak iyi).
   Havuz sayısı değişti (22 manuel→öneri) — 158 açılışında SQL ile yeniden say.
2) W-2.14 tasarımı (taslak önizleme veri katmanı). 3) Küçükler: İşlenenler rozeti kuyruk gerçeğini
   göstermiyor (0 taslak ≠ 0 bekleyen iş — 157 bulgusu) · 6 B1124 PDF orijinal adla yükle (MK-52.1)
   · IZO-KANIT-SETI v4 yapıştır + ad kararı · ✖ sessiz-kayıp doğrulaması · Y200 ST37 + W-3.9.

## NEREDEYIZ — ÖZET
NB1124 vakası 44/44 kapandı ve üç yapısal ders bıraktı; backfill dirildi (129-130 borcu kapandı);
montaj ailesi zone'suz adlandırmayı da tanıyor. Onay Kuyruğu'nun önünde engel kalmadı: tasarım,
veri ve tüketici haritası tamam — 158 saf implementasyon. Sıfır migration, tek kod commit'i, 12/12.
