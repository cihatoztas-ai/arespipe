# Son Durum — 143. Oturum (2 Haziran 2026)

> **G2a tam tur kapandı: operatör değer-düzeltme döngüsü uçtan uca çalışıyor.**
> Düzelt popup'ında 7 alan düzeltilir → tabloda görünür (kalıcı, DB'den) → terfide spooller'a yazılır.
> Yeni endpoint YOK (12/12). Tüm yazma client-side + RLS. Migration 098 canlı.

## HEAD
`68e2cec` feat(143): G2a overlay-B — terfide duzeltmeler spooller basligina yazilir

## Commit zinciri (143)
- `c7db87d` chore: terk edilen `kutuphane-backfill.html` silindi (deterministik yol=097) + 2 nav linki temizlendi
- `0668bb9` migration(143): `098_taslak_duzeltmeleri.sql` — G2a tablosu (Q5: ayrı tablo) [skip ci]
- `a0ee606` feat: G2a değer yazma (7 alan inline düzelt → `taslak_duzeltmeleri` upsert)
- `dd84b64` fix: G2a 4 alan katı dropdown (malzeme/yüzey/alıştırma statik + kalite DB) + ağırlık NaN fix + popup tutarlılık
- `77b775a` feat: G2a overlay-A — düzeltme DB'den yüklenir + tabloda gösterilir (dz-cell vurgu) + sayfa genişliği 1600
- `68e2cec` feat: G2a overlay-B — terfide düzeltmeler spooller başlığına yazılır (`aktar` `duzeltmeler` param, opsiyonel)

## Yapılanlar (sıra)

### 1. C planı — backfill dosyası kararı: SİL (mekanik)
- `admin/kutuphane-backfill.html` terk edilmişti (tek-SQL 097 kazandı, "her run farklı" kaosu).
- İki nav linki vardı (`admin/kutuphane.html`, `admin/panel.html`) → `sed -i '' '/kutuphane-backfill/d'` ile temizlendi, dosya `git rm`. Sıfır referans kaldı. Statik dosya, 12-fn etkilemez.

### 2. Migration 098 — taslak_duzeltmeleri tablosu (G2a zemini)
- Q5 kararı (139): düzeltme `parse_sonuc`'a DEĞİL, ayrı sorgulanabilir tabloya.
- Anahtar `UNIQUE (tenant_id, devre_id, pipeline_no, spool_no, alan)` → **upsert (üzerine yaz)**, geçmiş tutmuyor.
- `alan` serbest text (CHECK yok). `deger` text. `duzelten` NULL serbest (yukleyen_id borcu vurmasın).
- RLS: tek `ALL` policy `tenant_id = get_tenant_id()` (devre_dokumanlari deseni birebir).
- Q5 kod-öncesi doğrulama YAPILDI: `inceleBaslat`/`wizardIptal` client-side supabase yazıyor (kanıt: 634/1100) + RLS deseni teyit edildi (`devre_dok_tenant` ALL/get_tenant_id). Ters çıkmadı, (b) yolu sağlam.

### 3. G2a — değer düzeltme döngüsü (ANA İŞ, tam tur)
**Dosya: `devre_wizard_v3.html` (`duzeltAc` ve çevresi) + `ares-kabuk.js` (`aktar`).**

- **Değer yazma:** `duzeltAc` salt-görüntüden değer-yazmaya. Her satırda ✏️ → inline input/select → ✓/✕. Kaydet = `taslak_duzeltmeleri.upsert(onConflict)`. Boş bırak = düzeltmeyi sil. Enter/Escape kısayolu.
- **7 alan + tip ayrımı:**
  - Sayısal (input, virgül→nokta normalize): **çap, et, ağırlık**.
  - Katı dropdown (kanonik KOD saklanır, etiket gösterilir): **malzeme** (ARES_NORM 5 kod), **yüzey** (ARES_NORM, malzemeye göre `uyumluYuzeyler` filtreli), **alıştırma** (VAR/KISMI/YOK), **kalite** (DB: `malzeme_tanimlari`, sistem `tenant_id IS NULL` + firma, `.or()` ile, cache).
  - Listede olmayan eski değer → "(tanımsız)" diye gösterilir (veri kaybolmaz).
- **Ağırlık NaN fix:** `Number(String(v).replace(',','.'))` + `isFinite` guard. Eski `8 → NaN kg` artık `8 kg`. Kayıt nokta, gösterim Türkçe virgül.
- **Overlay-A (gösterim):** `inceleGetir` → `_duzeltmeleriYukle(j)` DB'den çeker, `spoollar[i]._duzelt`'e basar (anahtar `pipeline|spoolNo`). `renderInceleme` 7 alanda `_alanDeger` kullanır → düzeltme tabloda görünür, hücre turuncu `.dz-cell` vurgulu. `duzeltKapat` tabloyu yeniden çizer. **Sayfa yenilense de kalıcı** (DB'den).
- **Overlay-B (terfi):** `ares-kabuk.js` `aktar`'a opsiyonel `duzeltmeler` parametresi. `{(pipeline|spoolNo):{alan:deger}}`. Spool BAŞLIK alanları (cap/et/agirlik/malzeme/kalite/yuzey/alistirma) düzeltme varsa onunla yazılır, yoksa parse. `devre_detay` göndermez → sıfır regresyon. Bonus: `alistirma` artık null değil, düzeltme yazılıyor.

## CANLI DOĞRULAMA ✅
- Image 1 (devre detay A-1095/A-1096): Malzeme **Paslanmaz**, Kalite **316L**, Yüzey **Asit**, Et **5,2 mm** → terfide düzeltmeler spooller'a yazıldı. Devre özeti de Paslanmaz/Asit. **Tam tur doğrulandı.**

## NEREDEYIZ
G2a (operatör düzeltme döngüsünün DEĞER kısmı) bitti: düzelt → tabloda gör (kalıcı) → terfide canlıya yaz.
Yayılma (G3a), L3 eşiği (G4), BOM kalem düzeltme + güvensiz-bayrak HENÜZ yapılmadı.

## 143'te ÇIKAN AMA YAPILMAYAN BULGULAR (143'ün işiyle ilgisiz, ayrı teşhis)
1. **🔴 "Hep zayıf / %100 çelişki / okunamadı" (NB1124 G310 — Image 3):** Tüm spool'lar zayıf+çelişkili. İzometri PDF parse ediliyor ama eşleşmiyor/çelişki üretiyor. Format-özgü olabilir. **Taze bağlam + kanıt teşhisi gerekir (TAHMİN YOK).** En öncelikli.
2. **PDF'ler spool detaya gelmedi (Image 1):** terfi sonrası izometri eşleştirme (`eslestirme-backfill`) izometrileri bağlamıyor. Memory borcu "129/130 terfi-sonrası imalat-izo görünmeme" ile aynı olabilir.
3. **Native `confirm()` (Image 2):** wizard iptal "Vazgeçmek istediğinize emin misiniz?" tarayıcı kutusu → kendi modal'a çevrilmeli (kozmetik, küçük).

## SONRAKİ OTURUM — ANA İŞ ADAYI
**BOM malzeme listesi düzeltme + güvensiz-bayrak** (Cihat'ın asıl derdi):
- Spool'un `spool_malzemeleri` kalemleri (spool detay malzeme sekmesi). Tersan/Cadmatic Excel'den temiz gelir ama Excel'siz formatlarda BOM güvenilmez → bu alan kritikleşir.
- 3 durum: **güvenilir** (Excel temiz) / **küçük düzeltme** (operatör kalem rötuşu) / **güvensiz** (operatör "buna güvenmiyorum" → `malzeme_guvensiz=true`, canlıya çıkar ama damgalı, manuel takibe düşer).
- Felsefe: yanlış-ama-güvenilir-görünen veri yerine "güvensiz" damgası → sessiz overwrite yok, görünür çelişki.
- **Kod öncesi oku (MK-126.8):** `spool_malzemeleri` şeması, spool detay malzeme sekmesi render, K2 kıyas yapısı. Yeni bayrak kolonu migration gerekebilir.

## Diğer açık borçlar (devam)
- **G3a yayılma:** bir spool düzeltmesi aynı hatalı diğer spool'lara otomatik. Q1 (anahtar) + Q2 (değer-kopyala mı/kural-öğret mi) kararı GEREKLİ (139'da ertelendi).
- **Durum/özet tutarlılığı:** düzeltilen satır hâlâ "zayıf/çelişki" + üst özet/stat eski parse değerini sayıyor. Düzeltme durum/stat/özet hesabına dahil edilmeli (gösterim, risksiz).
- BUG-B DN125 (park) · MK-139.1 görsel teyit · tip='fitting' ama flanş · ara-açı dirsek (3D).

## Mühürlenecek MK (KARARLAR.md)
- **MK-143.1:** Operatör düzeltmesi ayrı tabloda (`taslak_duzeltmeleri`), upsert (üzerine yaz). Client-side+RLS, yeni endpoint yok.
- **MK-143.2:** Düzeltilebilir alanlardan malzeme/yüzey/alıştırma/kalite KATI dropdown (kanonik kod) — serbest yazı tabloları bozar. Kalite DB'den (`malzeme_tanimlari` sistem+firma).
- **MK-143.3:** `ares-kabuk.aktar` opsiyonel `duzeltmeler` param ile spool başlığını ezer — devre_detay göndermez, sıfır regresyon. BOM kalemleri (spool_malzemeleri) overlay'e dahil DEĞİL (ayrı iş).
- **MK-143.4:** Düzeltme overlay yalnız spooller BAŞLIK alanı; BOM güvenilirliği ayrı (güvensiz-bayrak işi).

## Hatalarım (kayıt)
- "Ağırlık diğerlerinden farklı mı" diye gereksiz sordum → kafa karıştırdım; aslında tek fark gösterim formatıydı (toplamKg ham, ekranda formatlı). Cihat haklı olarak "tablo değeri neyse o" dedi.
- İlk turda malzeme/kalite/yüzey/alıştırma'yı serbest text bıraktım — Cihat "bunlar tanımlı seçenekler olmalı, yazım farkı tabloları bozar" diye düzeltti. Doğru: kanonik dropdown. Ders: "DB kolon tipi text" ≠ "UI'da serbest giriş".
