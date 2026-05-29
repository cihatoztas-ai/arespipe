# Oturum 135 — v3 İnceleme K2 malzeme rozeti (A2) + dirsek kök tespiti + kozmetik

133/134'te canlı doğrulanan K2'nin operatör yüzeyinin **zor yarısı** (v3 İnceleme ekranı) tamamlandı.
134'te `uyarilar.html` (kolay yarı) bitmişti; bu oturum `devre_wizard_v3.html` İnceleme tablosuna
malzeme rozetini taşıdık — lib'i kirletmeden (A2). Dirsek 🟡 bulgusunun kökü çözüldü. Yeni endpoint
yok (12/12), MK-49.1 korundu, migration yok.

## Bağlam — neden zor yarı 135'e kalmıştı

İki operatör yüzeyi iki ayrı veri yolu kullanıyor:
- `uyarilar.html` → `_eslesme`'yi DOĞRUDAN okur (malzeme_kiyas elinde, API'siz) → 134'te bitti.
- `devre_wizard_v3` İnceleme → `/api/devre-inceleme` dönüşünü render eder; o endpoint `_eslesme`'yi
  KULLANMIYOR (`izometrileriDerle` kendi eşleştirmesini sıfırdan yapar) → malzeme_kiyas çıktıda yok.

## Karar — A2 (MK-135.1)

İki seçenek tartışıldı:
- **A1** — lib (`izo-eslesme.js`) `incelemeTablosu`'na malzeme_kiyas taşı. → REDDEDİLDİ: lib "DB yok,
  yan etki yok, saf çekirdek" sözünü bozar; malzeme_kiyas lib'in işi değil (worker'da hesaplanıyor).
- **A2** — handler'da, `incelemeTablosu` dönüşünden SONRA enjekte et. Lib DOKUNULMAZ, K2 tek dosyada.
  → SEÇİLDİ. Kanıt: endpoint `parse_sonuc`'u zaten çekiyor (`_eslesme` orada, ek sorgu yok); anahtar
  kabuk anahtarıyla birebir aynı (`normPipeline|normSpoolNo`).

## Yapılanlar

### 1. `api/devre-inceleme.js` — A2 enjeksiyon

`incelemeTablosu` sonrası: `izoKayitlar[].parse_sonuc._eslesme.detay[]`'dan (durum='eslesti' & malzeme_kiyas
olanlar) `normPipeline(pipeline_no)|normSpoolNo(spool_no)` haritası kurulur; `sonuc.spoollar[]`'a
`malzeme_flag`+`malzeme_kiyas` iliştirilir; `ozet.malzeme_flag` sayacı eklenir. Bir spool'a çok izometri
(detay+montaj) düşerse: flag'li kayıt öncelikli (yoksa ilk gelen). lib import'u/çağrısı değişmedi.

### 2. `devre_wizard_v3.html` — UI (3 dokunuş)

- satır 746: `izoCell(s.izometri, s.bindirme_flag, s.malzeme_flag)` (3. parametre).
- `izoCell`: `malzFlag` → `🟡 malzeme` rozeti, bindirme " · çelişki"sinden BAĞIMSIZ ayrı span.
- `duzeltAc`: "İzometri" bölümünden sonra `if (s.malzeme_kiyas) malzemeKiyasBlok(...)`.
- Yeni yardımcılar (uyarilar.html mirror): `MLZ_ALAN_AD_V3`, `MLZ_PT_AD_V3`, `_mlzFmtV3` (adet birimsiz,
  boy mm, ağırlık kg), `malzemeKiyasBlok` (celiski→🔧 onay-warn, excel_fazla_montaj→🔩 onay-ok, soft
  GİZLİ, excel_guven='otorite'→"PDF Excel'den sapıyor").

### 3. Doğrulama

- `node --check` her iki dosya + HTML inline JS (2 blok, 831 satır) → OK.
- Atomik Python patch'ler idempotent (2× çalıştırma → "zaten uygulanmış").
- Smoke (S02 fixture, gerçek malzeme_kiyas şekli): enjeksiyon anahtarı case/whitespace farkına rağmen
  eşleşti (`G200-339b-001/s02` ↔ `.../S02`), UI bloğu "🔧 Dirsek çelişkisi PDF 212.41 ↔ Excel 35.01" +
  "🔩 Flanş DN300 ×6" üretti.
- **Canlı (MK-132.1):** `/api/devre-inceleme` lambda'sı g200 için `ok:true`, `ozet.malzeme_flag:1`,
  S02 `malzeme_flag:true`/`kiyas_var:true`, celiski+montaj döndü. SQL ile DB teyit edildi.
- Commit `e6db101` (kod, CI).

### 4. Dirsek kök tespiti (MK-135.2)

S02 ham PDF malzeme listesi (konsolide öncesi) çekildi:
- **PDF:** 6 ayrı dirsek satırı, her biri adet:1/35.402 kg/457 mm → konsolide 6×35.4 = **212.41 kg**.
- **Excel BOM:** tek satır, **adet:6 ama agirlik:35.01** → per-adet ~5.84 kg = DN323.9 için imkansız.
- **Sonuç:** PDF doğru, Excel BOM hatalı (adet×birim çarpılmamış). K2 bug DEĞİL — gerçek tutarsızlık
  yakalaması, sistemin var olma sebebi. l2-parser'a dokunulmaz. (Eski basis hipotezi çürüdü.)

### 5. Kozmetik

`lib/izo-eslesme.js` self-test üst-yorumu `eksik:1` → `eksik:2` (kod zaten `=== 2`, doğruydu).
`node lib/izo-eslesme.js` → SELF-TEST ✅ GEÇTİ.

## Bir mesele — v3 wizard taslak açamıyor

`?devre_id=b310cfc5…` ile açıldı ama `WIZ.devre_id:null`, kabuk boş → wizard URL param'ı OKUMUYOR.
Var olan `oneri_hazir` taslağı yeniden açma yeteneği YOK. Bu yüzden rozeti GERÇEK tabloda gözle
göremedik (kod kanıtlı; lambda + smoke + SQL üçlü doğrulama var). Cihat kararı: kapsamlı görsel +
çoklu-gemi testini sonraya bırak, bugün baş işi fonksiyonel bitir. Borç #2 olarak yazıldı.

## Mühürlenen MK

- **MK-135.1** — v3 İnceleme K2 enjeksiyonu HANDLER katmanında (A2); `lib/izo-eslesme.js` saf çekirdek
  korunur. `_eslesme.detay[]` worker'da hazır → endpoint anahtarla spool'a iliştirir, yeniden hesap yok.
- **MK-135.2** — S02 dirsek 🟡 kökü: PDF doğru (6×35.4=212.41 makul), Excel BOM hatalı (adet:6 ama
  ağırlık tek-dirsek=35, per-adet 5.84 imkansız). K2 bug değil, gerçek veri tutarsızlığı yakalaması.
  Parser'a dokunma. Desen başka gemilerde tekrar ederse (136 testi) IFS-normalizasyon kuralı düşünülür.

## Süreç notu

132/133/134 disiplini sürdü: belge değil git gerçeği kazandı; bulgu canlı yolakta (lambda) teyit
edilmeden kapatılmadı; "lambda gereksiz mi" sorusunda — geçmiş teyit edildi (lambda = Vercel function,
zaten K2'yi canlıda kanıtlayan araç); patch öncesi 5 kaynak okundu (körlemesine yazma yok); UI görsel
teyidi alınamayınca dürüstçe "kod kanıtlı ama ekranda görülmedi" diye yazıldı, "tamam" denmedi.

---

> 136 açılışında: bu dosya + son-durum + CLAUDE-SONRAKI-OTURUM + PARSER 7.7 + KARARLAR MK-135.1/.2.
> **İlk iş: kapsamlı görsel test — wizard taslak-açma (#2) veya çoklu-gemi örnek yükleme.**
