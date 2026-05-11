# BRIEFING-73 Sonuçlar

## ✅ Bu oturumda tamamlanan

### Kod değişiklikleri (push'lı, sahada doğrulandı)
- **MK-73.3 / 73-G**: `is_durumu` kontrolü DB-truth'a taşındı (commit `18655e2`).
  `IbSpoolDetay.jsx` artık `is_kayitlari` tablosundan açık kayıt okur; localStorage
  cache rolüne indi. Cache-drift bug'ı (rol parametresiz `aktifIsHatirla()` ile
  başkasının işini "benim" gibi gösterme) kapandı. Test 1 sahada geçti.
- **SED-72-09**: `islem_log` mobile yazımı (commit `9995d75`).
  Yeni helper `mobile/src/lib/islem-log.js` + IbSpoolDetay.jsx'te 3 INSERT noktası
  (handleIseBasla → `is_basla`, handleKapatOnayli → `is_kapat`,
  handleSonrakiBasamakSec → `basamak_gec`). Saha akışında baştan sona test edildi,
  3 satır islem_log'a yazıldı. Web spool_detay zaman çizelgesi (İşlemler sekmesi)
  artık dolu.

### DB değişiklikleri (Studio'da uygulandı)
- **spool_id A- prefix migration**: 492 satır eski format spool (`0015`) → yeni
  format (`A-0015`). DB sorgusuyla yapıldı: `update spooller set spool_id='A-'||spool_id
  where spool_id ~ '^[0-9]+$'`. 74 başında migration dosyası `036_spool_id_a_prefix.sql`
  olarak repo'ya yazılacak (şu an sadece live DB'de).
- **is_kayitlari test artefaktı temizliği**: 3 stale `bitis IS NULL` kaydı
  bitis=now() ile kapatıldı (saha akışından kalma test çöpü).

### Kararlar
- **MK-73.1**: `is_kayitlari.bitis` üzerinde otomatik "X saat sonra kapat" job'ı
  YAPILMAZ. Uzun süren işler normal (bazı spoollar günlerce sürer); süre tek
  başına çöp göstergesi değildir. Stale kayıt sorunu kaynağında çözülür (mobile
  uygulamadan çıkışta açık iş varsa kapatma teklif eder, vs).
- **MK-73.2**: `is_kayitlari` üzerinde unique index zaten DB'de mevcut
  (`ux_iskayitlari_acik_is`, `where bitis is null`). Aynı spool'a iki açık iş
  kaydı fiziksel olarak imkansız.
- **MK-73.3**: `is_durumu` karar mercii is_kayitlari tablosu (DB-truth);
  localStorage cache rolüne indi. Drift senaryosunda
  (`is_durumu='devam_ediyor'` ama açık kayıt yok) spool sessizce `'bekliyor'`'a
  düşürülür.
- **Spool ID format kuralı**: UI label sadeleştirme için 4 hane (A-0580),
  DB değeri sıfır-dolgulu daha geniş hane (A-000580). 4-hane dolunca 5'e,
  dolunca 6'ya kademeli geçiş. (Bu memory'e de eklendi.)

### Mimari haritalama
- Mobile **M\* (screens)** ve **Ib\* (isbaslat/components)** ayrımı doğrulandı:
  hiyerarşik, paralel değil. MIsBaslat wizard'ı IbRolSec → IbQRTara → IbSpoolDetay
  zinciri kurar. MSpoolDetay yönetici görüntüleme için (saha akışı yok).
- Web **4 sayfa** denetimi: devre_detay (canlı), spool_detay (canlı),
  tezgahlar (canlı), uyarilar.html (**SYOS mock store** — DB'ye bağlı değil).
- **`IbSpoolDetay.jsx` 2229 satır** — patolojik şişme, refactor adayı. Style obje
  inline 630 satır, alt component'ler dosya içinde. 74+'ta bölünme aday.

### Saha akışı durumu (DB-doğrulanmış)
A-0580 spool'u baştan sona test edildi: `on_imalat → imalat → argon_kaynagi`
zinciri DB'de yazıldı, is_kayitlari başlangıç/bitiş kaydedildi, islem_log 3 satır
düştü, tezgahlar canlı sayaç çalıştı/durdu, devre_detay yanıp sönen nokta çıktı.
Yani saha akışının **backend tarafı %100 çalışıyor**.

## 🆕 Açılan SED'ler (74+ kuyruğu)

### Yüksek öncelik
- **SED-72-09 devamı**: not_ekle + foto_ekle INSERT'leri.
  Helper hazır (`islemLogYaz`), sadece UI + 2 handler eksik. Not Ekle ve İptal Et
  butonları `IbSpoolDetay.jsx`'te placeholder (alert() ile) — 68b'den beri açık.
- **SED-72-11**: Mobile kapatma fotoğrafı zorunlu. `handleKapatOnayli`'de
  şu an foto INSERT yok. Kamera modal + `fotograflar` INSERT + zorunlu kontrol.
- **SED-73-03**: Web `spool_detay.html` tracker'ında `argon_kaynagi` /
  `gazalti_kaynagi` "Başlamadı"ya düşüyor — `_normalizeBasamak` fonksiyonu
  global scope'a girmediği için. 73 oturumunda denendi, başarısız oldu, revert
  edildi. **74'te dosya yapısı (IIFE/script tag yapısı) anlaşıldıktan sonra
  tekrar ele alınacak**. `devre_detay.html` SED-71-05'te aynı sorunu çözdü,
  pattern oradan alınabilir.

### Orta öncelik
- **SED-72-10**: Alıştırma 3-modlu (YOK / KISMI / VAR). `spooller.alistirma`
  kolonu zaten text, sadece UI değişimi.
- **SED-72-12**: `IbRolSec` yanıp sönen çerçeve + "Devam Ediyor" badge
  (sadece İmalat ve Kaynak — MK-72.9).
- **SED-73-01**: Devral feedback UI. MK-73.3 ile cache-drift backend tarafında
  çözüldü, ama mobile'da kullanıcıya "açık iş yüklendi" görsel bildirimi yok
  — sessizce devam moduna giriyor. Toast/banner ile küçük bir UX iyileştirme.
- **SED-73-04**: Web sayfaları otomatik tazeleme. 60sn periyodik fetch +
  `visibilitychange` event ile arka planda durur, öne gelince hemen yenilenir.
  spool_detay + devre_detay + tezgahlar üçü için.
- **SED-73-05** (yeni): `uyarilar.html` mock'tan canlıya bağlanma.
  Bu oturumda bulundu — sayfa `notlar` veya `is_kayitlari` tablosundan
  beslenmeli, şu an SYOS mock store kullanıyor.
- **Migration 036**: `spool_id` A- prefix DB değişikliği migration dosyasına
  yazılacak (`migrations/036_spool_id_a_prefix.sql`). 5dk iş, kolay.

### Düşük öncelik / sıradan
- **SED-71-08..11**: 71'den kalan iPhone PWA SW auto-update, `olasi_sonraki`
  JSON, vs (BRIEFING-72'den taşınan kuyruk).
- **IbSpoolDetay.jsx refactor (2229 satır)**: style obje ayırma + GenelPanel /
  MalzemePanel / FotoCarousel ayrı dosya. Kapsamı büyük, planlı iş.

### Ertelenmiş — proje gündemi
- **MK-49.A/B**: 3D model render + İzometri PDF yükleme bileşeni (memory'de
  duruyor). Mobile akışı tamamlanmadan başlanmayacak.

## 📊 Test sonuçları
- **A-0580 (S06, NB1124)** — saha akışı uçtan uca DB-doğrulandı:
  `on_imalat / bekliyor → on_imalat / devam_ediyor → imalat / devam_ediyor
  → imalat / bekliyor + is_kapat log → argon_kaynagi / bekliyor + basamak_gec log`.
  islem_log'da 3 satır (`is_basla`, `is_kapat`, `basamak_gec`).
  is_kayitlari'nda baslangic/bitis düzgün, sure_dakika otomatik.
  Web tezgahlar canlı sayaç çalıştı/durdu.
- **Web spool_detay tracker eksikliği**: Görsel olarak hâlâ "Başlamadı"
  gözüküyor (SED-73-03 revert'li, 74'e taşındı). Backend doğru, sadece render bug.

## ⚠️ Bilinen sorunlar / gözlemler
- **spool_detay.html JS script yapısı**: `_normalizeBasamak` fonksiyonu dosyada
  satır 1457'de tanımlı ama global scope'a girmedi (`typeof` undefined dönüyor).
  Aynı satırlardaki `var STAGE_SISTEM` global oluyor. Sebep belirsiz — IIFE,
  ES module, veya `<script type="module">` olabilir. 74'te dosyayı temiz okumadan
  yama denenmeyecek.
- **basamak_tanimlari karışıklığı**: Tablo `tenant_id` bazlı, farklı tenant'larda
  farklı basamak listeleri (Demo'da 6 üst basamak, başkalarında alt-tip karışık).
  Sorgu daima `tenant_id` filtresi ile yapılmalı, yoksa karışır.
- **Migration tarihçesi disiplinsiz**: Bu oturumda DB'de manuel UPDATE atıldı
  (spool_id A- prefix), migration dosyası yazılmadı. 74'te dosya açılacak ama
  prensip: **bundan sonra DB değişiklikleri migrations/'a yazılmadan
  uygulanmayacak**.

## 💡 Bu oturumdan büyük dersler

- **"Döndük durduk" hissinin gerçek sebebi**: Saha akışı %60 bitmiş, %40 eksik
  (not, foto, islem_log). Bu %40 doğal akışın ortasında olduğu için tek seferlik
  uçtan uca test asla geçmiyor — "hiç çalışmıyor" hissi veriyor.
  Çözüm her birini ayrı SED olarak tamamlayıp test etmek (SED-72-09 örneği).
- **IbSpoolDetay.jsx 2229 satır asıl yavaşlatıcı**: Her feature ekleyecekken
  dosyada gezinmek gerekiyor, state ekleniyor, eski state ile çakışıyor.
  Refactor 75+'a planlanmalı.
- **Web ve mobile arası "yansıtmıyor" şikayetlerinin altında genellikle
  kod bug'ı değil, mobile'ın o tabloyu hiç yazmaması var.** islem_log örneği:
  web kodu doğru okuyordu, mobile yazmıyordu.
- **Cache-drift en sinsi bug türü**: localStorage karar mercii olarak
  kullanılıyorsa, DB ile arada drift her zaman olur. DB-truth her zaman daha
  güvenli (MK-73.3 dersi).
- **Yama yazarken script'in patterns'ı dikkatli kontrol edilmeli**: SED-73-03
  pattern'ı `\s*` whitespace toleransıyla hem header yorum hem gerçek kod
  yorumunu yakaladı, yanlış yere yazdı. v3 ile literal `[ ]` kullanarak
  düzeltildi — bundan sonra Python patch script'lerinde **literal space**
  ve **brace balance pre-check** zorunlu pattern.

## Sıradaki oturum (74) ne ile başlayacak?

Öncelik sırası:
1. **Migration 036 dosyası** (5dk) — A- prefix değişikliği versiyona.
2. **SED-72-09 devamı** — not_ekle + foto_ekle (helper hazır, UI eksik).
3. **SED-72-11** — Kapatma fotoğrafı zorunlu (foto akışı 72-09 ile beraber yazılır).
4. **SED-73-03 yeniden** — spool_detay tracker, ama önce script yapısı anlaşılarak.
5. **SED-73-04** — 60sn web tazeleme (basit, paralelde yapılabilir).

Memory'e eklenen yeni bilgi: spool_id format kuralı (4→5→6 hane).
