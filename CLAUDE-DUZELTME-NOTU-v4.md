# Patch v4 — Sidebar Çevirileri + Devreler Enum Fix

**Tarih:** 17 Nisan 2026

## Bu Patch'te Ne Var

### 1. Dil Dosyaları — Kapsamlı Tarama (TR=EN=AR=1335)

Önceki tarayıcılar kaçırmıştı:
- **`i18n: 'key'` obje property'leri** — `ares-layout.js` sidebar tanımı bu pattern'i kullanıyor
- **Sonuç:** 24 `nav_*` anahtarı geri geldi

Yeni tarama hem HTML hem JS dosyalarındaki 4 pattern'i birden yakalıyor:
- `tv('key', 'fallback')`
- `data-i18n="key"`
- `data-i18n-placeholder="key"`
- `i18n: 'key'` (obje property)

### 2. devreler.html — Enum Çeviri Düzeltmesi (v3'teki)

`_normalizeMalzeme` ve `_normalizeYuzey` artık kod döndürüyor, badge'ler `tvMalzeme`/`tvYuzey` ile sarılı.

## Dosyalar

- `lang/tr.json`, `en.json`, `ar.json` — 1335 anahtar, 3 dilde senkron
- `devreler.html` — enum çevirileri

## Deploy

3 + 1 = 4 dosya. Üzerine yaz, commit, push.

## Test

1. Sidebar linkleri dil değişince çevriliyor mu? (Kesim → Cutting → القطع)
2. Devreler'de malzeme kolonu çevriliyor mu?
3. Devreler'de yüzey kolonu çevriliyor mu?

## Gelecek Plan — Freeze & Translate

Bu projedeki strateji kararı alındı:

- `_status.json` veya karmaşık i18n yönetim aracı **yapılmayacak**
- Proje bitince `tr.json` "freeze" edilir
- Profesyonel çevirmene/CAT tool'a (veya Claude'a sözlükle birlikte) gönderilir
- Geri gelen `en.json` ve `ar.json` direkt kullanılır

## Gelecek İş Listesi

Bir sonraki oturumlarda:

- [ ] Benzer `_normalize*` anti-pattern'i başka sayfalarda var mı tara
   (kesim.html, markalama.html, proje_detay.html, bukum.html)
- [ ] i18n linter scripti yaz — yeni anahtar silinmediğinden emin olmak için
- [ ] TR kontrolü oturumu — tutarsız Türkçe metinleri (İptal/Vazgeç vb.) standartlaştır
- [ ] Diğer büyük sayfalara tvMalzeme/tvYuzey entegrasyonu

