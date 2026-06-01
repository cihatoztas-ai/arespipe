# AresPipe BRIEFING — 140. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> Not: 139 kapanışında BRIEFING bump'lanmamıştı; bu sürüm 138→140 atlayıp 139+140'ı içine alır.

## HEAD
`6fd32f7` fix: backfill CJS modüllerini createRequire ile yükle
- `61cba38` feat: malzeme-kütüphane eşleşme çekirdeği + backfill (mm-kanonik, tip=malzeme dalı)
- `57fb404` chore(ci) [skip ci] · `16d5d15` 139 kapanış docs

## 139'dan devreden (özet)
- PARSER-VE-YUKLEME-AKISI.md: B-çap çözüldü; Bölüm 13 operatör düzeltme döngüsü vizyonu (G2/G3/G4, Q1–Q6).
- MK-139.1: B-çap iki-parça fix (taslak=terfi). **Açık görsel teyit:** taslak incelemede çap terfi etmeden görünüyor mu — gözle bak.
- §13.7: malzeme↔kütüphane tanıma kopukluğu teşhis borcu → 140'ta ele alındı.

## 140 — yapılanlar
1. **§13.7 TEŞHİS MÜHÜRLENDİ (MK-140.1).** Kök: geometri kütüphanesini bağlayan **matcher akışta yok**. İkincil: kapsam dar.
   - Kanıt: `spool_malzemeleri` 1753 satır; `fitting_fk=0`, `boru_fk=67`, `flansh_fk=1` (hepsi eski toplu script, 3 ayrı dakika). `malzeme_ref=%89` (kalite tarafı sağlam).
   - Çürütülen hipotez: "normalize↔anahtar **format** uyuşmazlığı" değil — köprü hiç yok.
   - `flansh_olculer`'da EN-1092-1 **zaten dolu** (karbon EN-T01/T05/T11/T12, PN10+PN16). DN300 PN16 karbon slip-on **mevcut**. Eksik olan **link**, karbon flanşta veri değil. Paslanmaz/fitting'te hem link hem kapsam eksik → süper-admin (organik).
2. **097 İPTAL (MK-140.2).** Yazdığım slip-on migration mevcut EN-T01/'16' convention'la semantik mükerrerdi (`flansh_tipi='SO'`/`'PN16'` farklı etiket). Repodan silindi.
3. **A·çekirdek YAZILDI (`lib/malzeme-kutuphane-eslesme.js`).** mm-kanonik (MK-140.3): `ares-olcu.olcuParse` her girdiyi (DN/inç+Sch/OD/çift) **mm**'e indirir; anahtar `dis_cap` mm (dn değil). Malzeme kolonu zaten normalize → ARES_NORM gerekmez (bakir→cunife). 4 format gerçek-modül testiyle yeşil (DN300→323.9, elbow 323.9→323.9, 2½"Sch10S→76.1; Weld-O-let/Ic Bilezik→NULL).
4. **A·backfill YAZILDI (`api/eslestirme-backfill.js` `tip=malzeme` dalı).** Yeni endpoint yok (12/12). mm-toleranslı (±0.6) lookup, tek-net-eşleşme şartı, yarış guard'lı UPDATE, `kuru` dry-run.

## AÇIK BORÇ (141 ilk iş)
- **Backfill runtime ÇÖKÜYOR:** dry-run `HTTP 500 FUNCTION_INVOCATION_FAILED` (düz metin, handler'a girmeden = modül-yükleme seviyesi).
  - `ares-asme.js` lokal `require` ile **OK** (kanıt). createRequire fix denendi (`6fd32f7`) → **yetmedi.**
  - **Stack alınamadı** (vercel logs takip modu 5dk'da kesiyor, curl o pencerede ateşlenmedi).
  - 141: ÖNCE gerçek stack (vercel dashboard → Functions → Runtime Logs, ya da logs penceresi açıkken AYRI sekmede curl). Tahminle yazma yok (MK-126.8).
  - Olası kökler: vercel.json runtime CJS/ESM, modül-içi çağrı-anı `window`, supabase embed `spooller!inner` kolon. Log seçecek.
  - Yön (kanıta bağlı): mm-kanonik ARES_BORU ister; server'da ısrarla sorun çıkarsa **browser'a taşı** (admin re-match deseni, çalışan modüllere dokunmadan) → server `tip=malzeme` dalını geri çek.
- Hedef sabit: backfill koş → **DN300 PN16 karbon slip-on (122) flansh_olculer_id alır → spool_detay standart sütunu yeşil.**
- MK-139.1 görsel teyit (taslak çap) hâlâ açık.

## PLAN (sabit)
| Adım | Durum |
|---|---|
| §13.7 teşhis | ✅ mühür |
| A·çekirdek (mm-kanonik) | ✅ repoda, test yeşil |
| A·backfill | ⚠ yazıldı, **runtime çöküyor — 141 ilk iş** |
| B (matcher'ı akışa taşı) | A kanıtlanınca |
| C (kütüphane kapsam: paslanmaz/fitting) | arka plan, organik, süper-admin'den |

## NEREDEYİZ kuralı
Kütüphane doldurma (C) arka plan; öncelik **bağlama katmanının çalışması.** Kütüphane eksiğine odaklanmak programı durdurur (Cihat, 140).
