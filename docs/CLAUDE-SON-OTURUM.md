# CLAUDE — Son Oturum Özeti (Oturum 109, 22 May 2026)

## Özet
108 sonu kullanıcı geri bildirimi netti: kabuk-first akış **dolambaçlı**. Wizard "klasörü hallederim"
diyip önizliyor ama spool oluşturmak için kullanıcıyı devre_detay → Dökümanlar → Excel'i bul → Aktar'a
yolluyordu. Vaat ile teslimat uyuşmuyordu. 109 bunu **A-yolu** ile çözdü: onay/INSERT mantığı ortak
`ares-kabuk.js`'e çıkarıldı, wizard artık spool'u kendi içinde oluşturuyor. Üstüne B1 (per-spool yüzey),
B2 (wizard güvenlik düğmesi), #4 (wizard spool seçimi), #5 (lang anahtarları).

## 1) ares-kabuk.js (YENİ ortak modül — A-yolu kalbi)
`ARES_KABUK` namespace, 3 API:
- `boyutParse(dn)` → {dis_cap, et}. devre_detay `_onayBoyut` + wizard `_boyutParse` birebir aynıydı → birleşti.
- `grupla(ps)` → {spoollar, atanmamis, secilenSayfa, guven}. devre_detay `_onayGrupla` AYNEN. + B1: her
  spool'a `yuzeyHam` türetimi (r.yuzey → system token).
- `aktar({supa, tid, devreId, spoollar, yuzey, perSpoolYuzey, kuyrukIds})` → Promise.
  devre_detay `onayAktar`'ın INSERT gövdesi AYNEN (spooller + spool_malzemeleri, `cizim_durumu='bekliyor'`,
  ikiz kolonlar agirlik/agirlik_kg + durum/is_durumu — MK-108.2 expand fazı korundu). DOM/toast/reload
  soyuldu. **Kabuk kilidi (MK-WIZARD.3 idempotency) modülün İÇİNDE** → mevcut pipeline|spool|rev atlanır,
  iki taraf da otomatik korunur. Çoklu kuyruk id (wizard N BOM Excel'i tek seferde tamamlandı yapar).

Doğrulama: saf fonksiyon birim testi — boyutParse 5/5 (gerçek OD "219,1 mm" dahil), grupla 2 spool +
konsolide BOM (iki Pipe satırı → tek boru kalemi 4000mm, 46.8kg) + atanmamış mantığı, B1 yüzey zinciri 3/3
(Galvaniz→galvaniz, M200-Boyali→boyali, sinyalsiz→boş→param'a düşer).

## 2) devre_detay — ince sarmalayıcı
- `_onayGrupla(ps)` → `ARES_KABUK.grupla(ps)` (alias).
- `_onayBoyut(dn)` → `ARES_KABUK.boyutParse(dn)` (alias).
- `onayAktar(kuyrukId)` → ~25 satır: checkbox seçimi + yüzey topla → `ARES_KABUK.aktar({...,kuyrukIds:[kuyrukId]})`
  → toast/reload. Kullanıcıya davranış 108 ile BİREBİR (`{ok, eklenen, atlananlar}` → eski toast mesajları).
- Kalan tek `spooller.insert` = meşru manuel ekleme (`spoolEkleKaydet`), onayAktar kalıntısı değil.

## 3) devre_detay — PDF onay butonu düzeltme
`onayBtn` artık `_kuyrukParser==='excel-generic'` ile gate'li. izometri PDF'in `parse_sonuc`'u farklı şekil
(spoollar/format/batch_id, satirlar YOK) → "Önizle/Onayla" izometride "Parse sonucu boş" veriyordu (108 borcu,
buton hiç PDF'e bağlanmamıştı). Kabuk-first'te PDF başına onay yok → izometri için pasif "İzometri — arka planda"
etiketi (tıklanamaz). Yeni tv anahtarları: `dv_izo_arka`, `dv_izo_arka_aciklama`.

## 4) devre_wizard — onay wizardın içinde (A-yolu)
- Kabuk önizleme altına "✓ Onayla / Kilitle → N spool oluştur" butonu. `WIZ._kabuk` context (satirlar,
  bomIds, tid, devreId) saklanır.
- `kabukOnayla()`: aynı satırlardan `ARES_KABUK.grupla` ile tam BOM modeli → seçili spool'ları filtrele →
  `ARES_KABUK.aktar({..., perSpoolYuzey:true, kuyrukIds:bomIds})`. Davranış B: wizard'da KAL, yerinde
  "N spool oluşturuldu ✓" + Devreyi Görüntüle öne çıkar.
- `_boyutParse` → `ARES_KABUK.boyutParse` (alias).

## 5) B1 — per-spool yüzey
`grupla` her spool'a `yuzeyHam` türetir; `aktar` `perSpoolYuzey:true` ise `ARES_NORM.yuzeyKod(yuzeyHam)`
yazar, boşsa tek `yuzey` param'ına düşer. Wizard true gönderir → önizlemede gösterilen yüzey DB'ye yazılır.
devre_detay GÖNDERMEZ → eski tek-yüzey davranışı (modal dropdown) korunur, sıfır regresyon.

## 6) B2 — wizard "Bekleyenleri işle" güvenlik düğmesi
Sonuç ekranında "⟳ Bekleyenleri işle (N)". `WIZ._izoIds` saklanır; `wizBekleyenleriIsle()` body'siz tetik
+ kendi kuyruk id'lerinden kalan bekliyor/isleniyor'u 4 sn'de bir sorgular, 0'da düğme gizlenir (max 8 tur).
devre_detay `bekleyenIzometriIsle` eşi (fark: wizard belge listesi yerine doğrudan kuyruk sayar).

## 7) #4 — wizard spool seçimi
Kabuk tablosu satır checkbox'ları (data-key = pipeline|spool|rev, varsayılan seçili) + başlıkta tümünü
seç/kaldır + canlı sayaç (`kabukSayiGuncelle`, `kabukTumSec`); 0 seçili → buton pasif. Onayla yalnız
seçilenleri oluşturur. Anahtar grupla modeliyle aynı → önizleme/insert tutarlı.

## 8) #5 — lang anahtarları
`dv_izo_arka` + `dv_izo_arka_aciklama` → tr/en/ar.json (her biri +2 satır, 1909 → 1911 anahtar, yeniden
biçimlendirme yok). AR pattern korundu: spool=السبول, İzometri=إيزومتري.

## Mimari kararlar
- **MK-109.1:** Çalışan kodu yeniden yazma — ÇIKAR + hizala. Kanıtlı onayAktar aynen taşındı.
- **MK-109.2:** Kabuk-first onay wizard'ın İÇİNDE; ortak modül iki sayfada. Dolambaç çözüldü.
- **MK-109.3:** izometri parse_sonuc ≠ Excel BOM şekli → PDF başına onay yok, butonlar parser tipiyle gate.
- **MK-109.4:** per-spool yüzey opt-in (`perSpoolYuzey`); devre_detay regresyonsuz.
- **MK-109.5:** Büyük dosyada str_replace + node --check + birim test; arespipe_kopyala şaşarsa cp + md5 gözle.

## Commit'ler
| Commit | İçerik |
|--------|--------|
| 70f7e32 | A-yolu (ares-kabuk + wizard Onayla + devre_detay sarmalayıcı + PDF buton) |
| (bu push) | B1 + B2 + #4 + #5 (ares-kabuk per-spool yüzey, wizard güvenlik düğmesi + seçim, 3 lang) |
| (doc) | kapanış dokümanları [skip ci] |

## Değişen dosyalar
- `ares-kabuk.js` (YENİ — ortak kabuk modülü)
- `devre_wizard.html` (Onayla + per-spool yüzey + güvenlik düğmesi + spool seçimi)
- `devre_detay.html` (sarmalayıcı + alias + PDF buton gate) — A-yolu, 70f7e32'de
- `lang/tr.json` + `lang/en.json` + `lang/ar.json` (+2 anahtar)

## Canlı kanıt
`cizim_durumu`: `bekliyor` 3 → 39 (wizard içi Onayla CANLI çalıştı, 36 yeni kabuk spool). `tam` 628 sabit.

## Sonraki oturum
ANA HEDEF: **Adım 4 — PDF→kabuk eşleştirme + cizim_durumu görünürlüğü/güncelleme.** Kabuk-first döngüsünün
"dön, kontrol et, eksikleri doldur" tarafı. Tasarım kararları (eşleştirme nerede, anahtar, kismi/tam eşiği,
eşleşmeyen PDF) canlı `parse_sonuc` görmeden verilemez — ayrıntı `CLAUDE-SONRAKI-OTURUM.md`.
