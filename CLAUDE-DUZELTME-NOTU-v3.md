# Patch v3 — Devreler Sayfası Enum Çeviri Düzeltmesi

**Tarih:** 17 Nisan 2026

## Sorun

Devreler sayfasında malzeme kolonu (Karbon Çelik, Paslanmaz vb.) dil değiştirilse de
Türkçe kalıyordu. Sebep:

`devreler.html` içindeki `_normalizeMalzeme` ve `_normalizeYuzey` fonksiyonları DB'den
gelen farklı yazılmış malzeme değerlerini (karbon_celik, Celik, steel vb.) **TÜRKÇE HARDCODE**
metne çeviriyordu ("Karbon Çelik"). Bu metin sonra doğrudan ekrana basılıyor, hiç çeviriden
geçmiyordu.

## Çözüm

1. `_normalizeMalzeme` ve `_normalizeYuzey` artık **normalize kod** döndürüyor:
   - 'Karbon Çelik' → 'karbon_celik'
   - 'Paslanmaz' → 'paslanmaz'
   - 'Galvaniz' → 'galvaniz' vb.

2. `matBadge` ve `yuzeyBadge` kısımları `tvMalzeme(kod)` ve `tvYuzey(kod)` ile sarıldı:
   ```js
   label = tvMalzeme('karbon_celik')  // TR: "Karbon Çelik", EN: "Carbon Steel"
   ```

3. Pasta grafiği label'ları da tvMalzeme() üzerinden çevriliyor.

## Etki

- Devreler sayfasında dil değiştirince malzeme kolonu da değişecek
- CSS class'ları ('mb-celik', 'mb-pas' vs.) aynı kaldı — görünüm değişmez
- Yuzey badge renkleri de aynı
- Filtre mantığı dokunulmadı (MALZEME_PATTERNS hâlâ Türkçe anahtar kullanıyor,
  çünkü dropdown seçim değerleriyle eşleşiyor)

## Dosyalar

- `devreler.html` — _normalize fonksiyonları + badge görüntülemesi
- `lang/tr.json`, `lang/en.json`, `lang/ar.json` — v2'deki senkronizasyon (1310 anahtar)

## Yapılmayan (Bir Sonraki Oturum)

Benzer `_normalizeMalzeme` başka dosyada yok. Ama başka sayfalarda da aynı anti-pattern
olabilir:

- `bukum.html` satır 517-531: "Karbon Celik" (Ç'siz) hardcode demo veri — bukum.html yeniden
  yazıldığında temizlenmeli
- `proje_detay.html`, `kesim.html`, `markalama.html` gibi sayfalarda ekrana malzeme yazılan
  yerler incelenmeli — tvMalzeme() eklenmeli
- DB migration: `spooller.malzeme` kolonundaki "Karbon Çelik", "karbon_celik" gibi
  tutarsız veriler tek formata normalize edilmeli (ileride)

## Risk

DÜŞÜK. Sadece devreler.html değişti, sadece görüntüleme mantığı. Filtre çalışır durumda.

## Test

1. Devreler sayfasını aç
2. TR modunda → malzeme kolonu "Karbon Çelik, Paslanmaz" gibi görünmeli (aynı kaldı)
3. EN modunda → "Carbon Steel, Stainless" görünmeli
4. Filtre açılır menü → Malzeme seçebilmeli (dropdown değişmedi)
5. Pasta grafiği (varsa) → dil değişimine duyarlı

