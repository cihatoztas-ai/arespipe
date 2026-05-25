# Oturum 126 — Devre Wizard FAZ 1 (kod)

## Açılış ritüeli
Git status → CI rengi → **`docs/DEVRE-WIZARD-OMURGA.md` (v2, tek kaynak)** oku → bu gündem → açık feedback.

## ÖNCE: kod-öncesi 3 açık soru (FAZ 1 ön koşulu, kod yazmadan netleşmeli)

1. **`resim_no` çıkarma regex'leri** — eşleştirmenin temeli (omurga Bölüm 6). Dosya adından
   resim_no + spool_no çıkar; içerikten bağımsız (image-PDF'te de çalışmalı).
   - Tersan deseni: pipe-no gövdesi nasıl? (örnek dosya adlarına bak)
   - PAOR deseni: çizim no nasıl?
   - Proje kodu normalize: PDF "B1110" ↔ devre "NB1110" (`N` öneki).

2. **Kabuk → spool kayıt zamanı** — Excel kabuk onaylanınca spool'lar `spooller`'a HEMEN mi
   yazılır, yoksa mutabakat onayında (terfi) mı? Taslak modunda `spooller`'da kayıt OLMAMALI (124).

3. **K2 boş şablon mantığı** — `spool_no_sablonu` ayrı tablo mı, `excel_format_tanimlari` kardeşi mi?
   Şablon hangi kolonlar? Wizard nasıl üretir?

## SONRA: FAZ 1 kod (küçük cerrahi, KORUMA-1/2/3)

- Wizard 2 adım iskelet: (1) Devre & Belgeler tek ekran, (2) Mutabakat.
- Excel kabuk kurma + "Excel yoksa şablon indir" zorunlu kapısı (MK-125.3).
- Mutabakat 4 durum (kabuğa çetelele), onay kilidi (eksik+fazla çözülmeden kapalı).
- **KORUMA-1:** `devre_yeni` (spool ID/QR), `izometri-oku`, drenaj client-loop (113/A) → ÇAĞIR, kopyalama.
- **KORUMA-2:** açık borçları wizard'a YEDİRME (MK-124.1 pipeline hariç — eşleştirme fazının doğal parçası).
- **KORUMA-3:** mockup'ta tutmayan UI → o ekranı düzelt, belgeyi değil.

## Mockup referansı (oturum 125)
Giriş+klasör tek ekran → kabuk hazır (ağaç + Excel bulundu) → mutabakat (4 durum) → çapa işaretleme.
Tasarım kararları omurga Bölüm 5, 8, 11'de; çapa = MK-118.7 (etiket+metin, koordinat değil).

## Açık borçlar (AYRI kapanır, wizard'a yedirme yok)
MK-124.1 pipeline `E120-` önek · A-NOT boş parse · web-spool sync (`aktif_basamak`/`ilerleme`) ·
`boy_mm` int yuvarlama · 117 (`yukleyen_id` null ~11 dosya) · fitting (DIN 86087 / ASME B16.9).
