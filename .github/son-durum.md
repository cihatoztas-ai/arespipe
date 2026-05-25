# AresPipe — Güncel Durum (Oturum 125 sonrası)

**Tarih:** 2026-05-26 · **CI:** yeşil (doc-only, `[skip ci]`) · **Kod:** bu oturumda yazılmadı

## Bu oturumda (125)
Devre Wizard tasarımı tek omurgaya konsolide edildi + uçtan uca mockup'landı. Kod yok.

- **`docs/DEVRE-WIZARD-OMURGA.md` (v2)** oluşturuldu — 97 (mimari) / 106 (akış) / 124 (omurga) +
  format motoru (117-123) tek sentez. Eski 4 belge → arşiv/atıf.
- Profesyonel kıyas (AVEVA / ISOGEN / SpoolGen üretir, AresPipe okur; Voortman'a karşı interaktif
  rapor) eleştirileri kapatıldı (omurga Bölüm 16.B).
- Tüm wizard ekranları mockup'landı: giriş+klasör tek ekran → kabuk hazır → mutabakat 4 durum →
  çapa işaretleme.
- Yeni kararlar: MK-125.1 (L3 zorla), 125.2 (image-PDF öğrenme yok), 125.3 (Excel kabuk zorunlu /
  eski K3 düştü), 125.4 (wizard 2 adım / meta opsiyonel / iş emri terfide).

## Wizard akışı (kilitli)
**2 adım.** (1) Devre & Belgeler — tersane (kilitli, tenant tek) + proje + devre adı (mecburi) +
opsiyonel meta (sona) + klasör sürükle-bırak (**Excel zorunlu**: IFS varsa varsayılan, yoksa
şablon indir). (2) Mutabakat → Onay — kabuk 4 durum (okundu/zayıf/eksik/fazla), çapa düzelt,
onay = canlıya terfi.

## Kod durumu
- ✅ Format motoru (Aşama 0-1.8), wizard altyapı (migration 080, iskelet, Excel parser).
- ❌ Yazılmadı: füzyon UI, mutabakat ekranı, çapa UI, taslak modu, terfi.

## Sıradaki (FAZ 1 ön koşulu)
Kod-öncesi 3 açık soru: `resim_no` regex (Tersan/PAOR), kabuk→spool kayıt zamanı, K2 şablon mantığı.
