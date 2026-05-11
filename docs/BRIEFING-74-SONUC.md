# BRIEFING-74 Sonuçlar

## ✅ Bu oturumda tamamlanan

### Kod değişiklikleri (push'lı, sahada doğrulandı)

- **SED-74-01 — spool_id format enforcement, Yol B** (commit `e0537f1`):
  - `migrations/036_spool_id_a_prefix.sql`: A-prefix backfill versiyona alındı (73'ün drift'i) + CHECK constraint `spool_id IS NULL OR spool_id ~ '^A-[0-9]{4,}$'`
  - Frontend helper: `spoolIdFormatla()` (idempotent normalize) + `spoolIdDevreSonraki()` (devre içi max+1)
  - `devre_yeni.html` toplu insert: `kisaKodlar[idx]` helper'dan geçirilir
  - `devre_detay.html` tekil insert: payload'a `spool_id` eklendi (eskiden hiç yoktu → NULL kalıyordu)
  - Negatif test geçti: `BOZUK_FORMAT` insert'i CHECK constraint ile 23514 hatası verip reddedildi

- **SED-73-03 — 73'ten taşınan, tamamen kapatıldı** (commit'ler `2f89fe3` + `dce5e3d` + `289c4e4` + `c286e94`):
  - `spool_detay.html`'e `_normalizeBasamak()` fonksiyonu eklendi (73'teki revert'in yeniden uygulaması)
  - **Regex pattern fix**: `/kaynak/i` → `/kayna/i`. 73'ün gerçek gizemi buydu: `'kaynak'` substring `'argon_kaynagi'`'de YOK (ASCII'de "kayna-g-i", 'k' yok). devre_detay.html'de aynı bug paralel olarak vardı, ikisi de düzeltildi.
  - `devre_detay.html` `_spoolMap` satır 1312: `aktStr` normalize edilmeden `stgList.indexOf`'a giriyordu → `-1` zincir bug (durum=waiting, ilerleme=0/6, adimlar=[0,0,0,0,0,0]). Tek satır fix tüm zinciri çözdü.
  - `devre_detay.html` `_stepKey` satır 1009: `is_durumu='bekliyor'` override satırı kaldırıldı (MK-74.3)

- **SED-74-03 — Devre detay durum kolonu basamak başına renk** (commit `d1bfc93`):
  - 6 yeni CSS class: `sb-prog-on_imalat` (amber), `imalat` (mavi), `kaynak` (kırmızı), `on_kontrol` (mor açık), `kk` (mor koyu), `sevkiyat` (teal)
  - `DURUM()` haritasına 6 yeni `progress_<basamak>` entry'si
  - `_stepKey(s)` granular dönüş: `'progress_'+_normalizeBasamak(s._aktifBasamak)`

### DB değişiklikleri (Studio'da uygulandı + migration dosyası repo'da)

- **Migration 036 (yeni)**: A-prefix backfill (73'ten gelen drift kapandı) + CHECK constraint çalışıyor
- 73'teki manuel UPDATE'in (492 satır) repo/DB drift'i kapatıldı

### Kararlar

- **MK-74.1**: DB değişiklikleri migration dosyası yazılmadan uygulanmaz (73'ün drift'inden doğdu)
- **MK-74.2**: `spool_id` format kuralı (`A-[0-9]{4,}` veya NULL) CHECK constraint ile DB seviyesinde enforce
- **MK-74.3**: `is_durumu` (mobile axis: aktif/pasif) ve `s.durum` (frontend axis: basamak ilerlemesi) ayrı eksenler, biri diğerini override etmez

### Mimari haritalama

- `STAGE_SISTEM` (web) sadece üst basamakları içerir: `['on_imalat','imalat','kaynak','on_kontrol','kk','sevkiyat']`. Mobile kaynak alt-tiplerini (`argon_kaynagi`, `gazalti_kaynagi`) yazar; web tarafında normalize edilmeli.
- `_normalizeBasamak` artık iki HTML'de de var (`spool_detay.html`, `devre_detay.html`). Pattern: `/kayna/i.test(s) ? 'kaynak' : s`.
- `_stepKey(s)` granular render anahtarı üretir; CSS sınıfları `.sb-prog-<basamak>` ile eşleşir.
- `basamak_tanimlari` tablosunda renk kolonu YOK; renkler şu an hardcoded CSS. İleride `gorunen_renk` kolonu eklenip data-driven yapılabilir.

### Saha akışı durumu (DB + UI doğrulanmış)

A-0585 (NB1124, S01) test edilen ana spool:
- DB: `aktif_basamak='argon_kaynagi'`, `is_durumu='bekliyor'`, is_kayitlari'nda imalat kaydı kapanmış
- `spool_detay.html` tracker: "Kaynak" basamağında ✅
- `devre_detay.html` durum kolonu: "Kaynak" (kırmızı tonunda) ✅
- İlerleme barı: 2/6 (on_imalat + imalat tamamlanmış) ✅

Diğer spool'lar doğru basamak + ilerleme + renk gösteriyor (A-0575 Tamamlandı yeşil, A-0592 Ön Kontrol mor açık, vs.).

## 🆕 Açılan SED'ler (75+ kuyruğu)

### Yüksek öncelik

- **SED-74-02** — 40 NULL spool_id temizliği. Migration 036'da NULL'a CHECK constraint izin veriyor, ama 40 satır eski kayıt NULL. Temizlik stratejisi kararlaştırılmalı (devre içi max+1 ile backfill, veya yeni format `A-NULL-<id>`).

- **SED-74-04** — Mobile durum badge eksik. `arespipe-mob.vercel.app` ekranında bekliyor olmayan spool'larda badge boş (A-0580, A-0582, A-0585 → badge yok; A-0581/0583/0584/0586 → "Bekliyor"). Mobile kendi durum render mantığı, web'in 74'teki fix'leri yansımıyor. Web pattern'i (`_normalizeBasamak` + `_stepKey`) mobile'a port edilmeli.

- **SED-72-01 (hayalet)** — `kaynak_alt_tipleri` tablosu migration dosyası **hâlâ yazılmamış**. BRIEFING-72.md'de 036 olarak ayrılmıştı, 73'te yapılmadı, 74'te 036 numarasını A-prefix migration aldı. SED-72-01 bu yüzden **037+** olarak yazılmalı. Drawer'da hardcoded `ALT_TIP_ETIKETLERI` hâlâ yaşıyor → MK-72.1 (DB-driven) yarım.

### Orta öncelik (73'ten taşınan)

- **SED-72-09 devamı** — not_ekle + foto_ekle INSERT'leri (helper `islemLogYaz` hazır, UI eksik)
- **SED-72-11** — Mobile kapatma fotoğrafı zorunlu (kamera modal + foto INSERT + zorunlu kontrol)
- **SED-72-10** — Alıştırma 3-modlu (YOK / KISMI / VAR)
- **SED-72-12** — IbRolSec yanıp sönen çerçeve + "Devam Ediyor" badge (sadece İmalat ve Kaynak — MK-72.9)
- **SED-73-01** — Devral feedback UI (toast/banner "açık iş yüklendi")
- **SED-73-04** — Web sayfaları 60sn otomatik tazeleme + `visibilitychange` event
- **SED-73-05** — `uyarilar.html` mock'tan canlıya bağlanma

### Düşük öncelik / sıradan

- **SED-71-08..11** — iPhone PWA SW auto-update, `olasi_sonraki` JSON, vs.
- **IbSpoolDetay.jsx refactor (2229 satır)** — büyük iş, planlı
- **basamak_tanimlari.gorunen_renk kolonu** — renk DB-driven olsun (SED-74-03 ileride DB'ye taşı)

### Ertelenmiş — proje gündemi

- **MK-49.A/B** (3D model + İzometri PDF) — mobile akışı bitmeden başlanmıyor

## 📊 Test sonuçları

- **A-0585 uçtan uca** (DB + spool_detay + devre_detay): tüm zincir doğru basamakta gösteriliyor
- **Negatif test (CHECK constraint)**: `BOZUK_FORMAT` insert'i 23514 hatası ile reddedildi → enforcement çalışıyor
- **Renk farklılaştırma**: Spool Listesi tablosunda "Kaynak", "Ön Kontrol", "Tamamlandı", "Bekliyor" farklı renklerde
- **İdempotent patch script'ler**: hepsi tekrar çalıştırıldığında "atlanıyor" mesajı veriyor

## ⚠️ Bilinen sorunlar / gözlemler

- **Mobile durum badge eksik (SED-74-04)**: keşfedildi, henüz çözülmedi
- **Migration 037 hayalet (SED-72-01)**: iki oturum sessizce kaymış
- **Preview URL deceptive**: 74'te kaybolan ~15dk Cihat'ın eski preview URL (`r79g58d3`) üzerinden test etmesinden kaynaklandı. Test her zaman production URL (`arespipe.vercel.app`) üzerinden yapılmalı.
- **basamak renkleri hardcoded**: ileride DB'ye taşınmalı (her tenant aynı renkler şu an)

## 💡 Bu oturumdan büyük dersler

- **"73 fiyaskosu"nun gerçek sebebi pattern hatasıydı, scope değil.** `/kaynak/i.test('argon_kaynagi')` → `false`. ASCII'de "kayna-g-i", 'kaynak' substring YOK. 73'te Cihat fonksiyonun çalışmadığını sandı, `window._normalizeBasamak = ...` global expose denedi, o da işe yaramadı çünkü asıl bug regex'teydi. **Ders:** fonksiyon çıktısı yanlışsa, scope sorununu varsayma — önce mantığı test et. Bir `console.log(_normalizeBasamak('argon_kaynagi'))` 73'te bu işi 5dk'da çözerdi.

- **Tek satır root cause genelde 3-5 zincir bug yaratır.** devre_detay `_spoolMap` satır 1312: `indexOf=-1` → adimlar sıfır + dur='waiting' + durumText='Bekliyor'. Üç görünür bug, tek bir kaynaktan. **Ders:** birden fazla görünen bug, genelde tek bir noktadan dallanır. Önce zincirin başını bul, semptomları sayma.

- **Preview URL vs Production URL ayrımı kritik.** Vercel her commit için ayrı preview URL üretir; eski sekmede açık tutulan URL **o commit'in build'i** olarak kalır. Test her zaman production (`arespipe.vercel.app`) üzerinden. Eski preview "deploy çalışmıyor" yanılgısı doğurur.

- **`is_durumu` ile `s.durum` iki ayrı eksen (MK-74.3).** Mobile "aktif/pasif" yazar, frontend "basamak ilerlemesi" üretir. Bir UI render mantığında biri diğerini override etmemeli. _stepKey'in `is_durumu='bekliyor' → 'waiting'` satırı bu prensibi ihlal ediyordu.

- **CHECK constraint = DB-level enforcement = "fizik yasası".** Frontend bug ya da kod akışı değişikliği CHECK'i atlatamaz. Yol B (backfill + CHECK) Yol A'dan (sadece backfill) çok daha sağlam — 30dk fazla iş, ama ileride yanlış format insert'i fiziksel olarak imkansız.

- **Migration disiplini (MK-74.1).** 73'ten gelen drift bizi 74'ün başında ~1 saat geciktirdi (keşif + doğrulama + dokümentasyon + repo'ya alma). Bundan sonra DB değişiklikleri migration dosyası yazılmadan uygulanmayacak. Bunu MK-74.1 olarak yazdık.

## Sıradaki oturum (75) ne ile başlayacak?

**Araya kütüphane geliştirme** (Cihat planı): `malzeme_kataloglari` library content population — B1 ASTM A53'ten devam, paralel chat batch yapısı. Bu iş bağımsız ve paralelde yürütülebilir.

**Sonra mobile akışına geri dönüş.** Öncelik sırası:

1. **SED-72-09 devamı** — not_ekle + foto_ekle UI (helper hazır, 1-2 saat)
2. **SED-72-11** — Kapatma fotoğrafı zorunlu (72-09 ile birlikte yapılır, kamera modal + foto INSERT)
3. **SED-74-04** — Mobile durum badge (web pattern'i mobile'a port)
4. **SED-74-02** — 40 NULL spool_id temizliği (kararlaştır → migration 038)
5. **SED-72-01 hayalet** — `kaynak_alt_tipleri` migration 037 olarak yaz

**Düşük öncelik (paralelde yapılabilir):**
- SED-73-04 (60sn web tazeleme, basit)
- SED-73-05 (uyarilar.html canlı)

**75'te dikkat edilecek:**
- Migration numerasyonu net: 036 (A-prefix, yapıldı), 037 hâlâ boş (SED-72-01 için), 038+ yeni işler
- Preview URL'ye düşme — test her zaman `arespipe.vercel.app` (production)
- DB değişiklikleri migration dosyası ile (MK-74.1)
- Mobile fix'leri yapılırken web pattern'i referans alınmalı (`_normalizeBasamak` + `_stepKey` granular)
