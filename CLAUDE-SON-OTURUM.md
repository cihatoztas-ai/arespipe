# Oturum 125 — Devre Wizard Omurga + Mockup

**Kod yazılmadı.** Tasarım konsolidasyonu + profesyonel kıyas eleştirisi + uçtan uca mockup.

## Yapılanlar

1. **Omurga belge** `docs/DEVRE-WIZARD-OMURGA.md` (v2): dağınık 4 belge (97 mimari, 106 akış,
   124 omurga, 117-123 format motoru) tek sentez. 18 bölüm + MK özeti + atıf haritası. Eskiler arşiv.

2. **Eleştiri kapanışı** (omurga 16.B): profesyonel programlarla tartıldı. AVEVA E3D / Smart 3D /
   ISOGEN / SpoolGen izometri *üretir*, AresPipe *okur* (rakip değil tamamlayıcı); Voortman'a karşı
   interaktif rapor avantajı. 6 eleştiri → hepsi bilinçli sınır ya da mevcut akışta çözülü:
   çapa↔image-PDF (Excel'den veri), revizyon (mevcut iptal/pasif), parça kimliği (malzeme→kütüphane),
   eşzamanlılık (devre-gemi tekilliği), tek-aşamalı onay (sadelik), 3D (erteleme).

3. **Mockup turu** (KORUMA-3 — ekranda sınandı):
   - Giriş+klasör **TEK ekran** (tersane kilitli, proje, devre adı mecburi, opsiyonel meta sona,
     klasör sürükle-bırak, **Excel zorunlu** kuralı).
   - Klasör yüklendi → ağaç + IFS Excel bulundu → 25 spool kabuğu + revizyon-öncesi ayıkla.
   - Mutabakat (taslak bandı, 4 durum, onay eksik/fazla çözülmeden kilitli).
   - Çapa işaretleme (PDF + "yüzey işlem nerede?" + etiket+metin çapası, MK-118.7, formatın tümüne).

4. **Yeni MK:** 125.1 (format yeni+L3 kapalı → L3 zorla), 125.2 (image-PDF öğrenme/çapa yok),
   125.3 (Excel kabuk zorunlu / eski K3 düştü / kaynak seçim ekranı yok), 125.4 (wizard 2 adım /
   meta opsiyonel / iş emri terfide).

## Önemli düzeltmeler (gerçek devre_yeni.html görseliyle)
- Tersane = tenant, **kilitli** (dropdown değil, tek seçenek).
- İş emri no giriş ekranında **YOK** — terfide üretilir.
- Kaynak seçim ekranı (K1/K2/K3) **kaldırıldı** — Excel zorunlu, sistem klasörde arar.
- Malzeme/yüzey/termin/zone/alıştırma **opsiyonel**, sayfa sonunda, girilirse dökümanlarla doğrulanır.
- 5 adımlı wizard → **2 adım**; "Oluştur Mutabakata Geç" → kibar "Devam Et".
