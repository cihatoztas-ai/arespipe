# CLAUDE — 42. OTURUM GÜNDEMİ

> **Bu dosya 41 kapanışında oluşturuldu. 42 başında ilk okunacak.**

---

## 42 Açılış Mottosu

41'de **kütüphane altyapısı canlıya çıktı** — Parça Kimliği Prensibi'nin temel altyapısı kuruldu, A105 flanş pilot çalışıyor. Vizyondan kapsama alınan tek madde, gerisi vizyonda kaldı.

42'de en önemli şey: **40 canlı test borcunu kapatmak**. Bu borç 41 başında parking edildi, henüz ödenmedi. Disiplin meselesi — yapılan iş test edilmeden başka iş başlamaz prensibi.

---

## 1. Açılış Ritüeli (~5 dk)

5 cevap zorunlu (CLAUDE.md):

```
Oturum başlangıç ritüeli. 5 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -10

2. GitHub Actions sekmesinde son build rengi?

3. .github/son-durum.md içeriği?

4. 41'de yüklenecek 5 dosya yüklendi mi (4 SQL + spool_detay.html + 3 MD)?

5. admin/panel.html → Geri Bildirim sekmesinde kaç açık feedback var?
```

5 cevap geldikten sonra:
- Git temiz mi
- CI yeşil mi
- son-durum.md borçları oku
- **`docs/CIHAT-PROFIL.md`'yi oku**
- **`docs/VIZYON-VE-MODULER-MIMARI.md`'yi oku** (vizyon disiplini için kritik — 41'de kapsam değişti)
- **`docs/KUTUPHANE-KAPSAM.md`'ye göz at** (sonraki kapsam genişletme için)

---

## 2. 41 Doğrulama (~10 dk)

41'de yapılan kütüphane altyapısı canlıda çalışıyor mu kontrol et:

### Frontend doğrulama
1. https://arespipe.vercel.app/spool_detay.html?id=9a54bcec-76a5-4f40-99bd-d3a536c1a04e
2. Malzeme Listesi sekmesi → 3. satır (F-001 / WN 150# RF Flanş / A105) sol kenar mavi mi?
3. Tıklayınca modal açılıyor mu?
4. Modal'da çizim alanı boş ama yer tutucu kart görünüyor mu?
5. Tablo değerleri doğru mu (O=229, tf=22.4, X=135, Y=32, B=102.4, W=190.5, 8×5/8")?
6. PDF İndir butonu yeni sekme açıyor mu, A4 dikey baskı?
7. Heat No / Sertifika checkbox / Sil butonu tıklayınca modal açılmamalı (eski davranış korunsun)

### DB doğrulama
```sql
SELECT count(*) FROM flansh_olculer;        -- 1
SELECT count(*) FROM fitting_malzeme_uyum;  -- 1
SELECT count(*) FROM spool_flansh_eslesme;  -- 1
SELECT count(*) FROM tenant_features WHERE feature_kod = 'kutuphane_parca_kimligi'; -- 7
```

Bir sorun varsa **42'nin önceliği** kütüphane düzeltmesi olur, sonra 40 borcuna geçilir.

---

## 3. 40 Canlı Test Borcu (~1-1.5 saat — EN YÜKSEK ÖNCELİK)

40'ta yapılan operasyon sayfası standardizasyonları henüz canlıda uçtan uca test edilmedi. 41 başında **Grup 1 ✓ markalama tablo+modal** test edildi, gerisi parking.

### A. Markalama (15 dk)
- ✅ Grup 1 (41'de yapıldı)
- Grup 2 — modal açılışı, progress bar, 4 buton
- Grup 3 — manuel ekleme akışı (manuelMarkModal)
- Grup 4 — arşiv görünümü
- Grup 5 — i18n geçişleri (TR/EN/AR)

### B. Bukum (10 dk)
- modalBukumOnayi açılıyor mu (40'ta null bug fix yapıldı)
- aciklama scope bug fix doğrula (Supabase modu kapalıyken hata yok mu)

### C. Kalite Kontrol (10 dk)
- Yeni hero+pill standardı görsel onay (yeşil --kk-c)
- TR yazım fix kontrolü (Agirlik→Ağırlık vb.)

### D. Sevkiyatlar (10 dk)
- Renk lejandı broken HTML fix doğrulaması
- 2 textarea i18n çalışıyor mu

### E. 39 PAOR Akışı (15 dk)
40 öncesinden kalan canlı test borcu — 39'da yapılan PAOR (proje, aktivite, organizasyon, raporlama) akışı.

**Eğer hata bulunursa:** O hatayı çöz, sonra teste devam et. *"Sonra düzeltirim"* deme — borç birikmesin.

---

## 4. Kütüphane Genişletme — Süper Admin UI (~30-45 dk, opsiyonel)

40 borcu bittiyse ve süre kalırsa Cihat'ın istediği iş:

> *"süper admin sayfasından bazı firmalara açık bazılarına kapalı olacak"*

`admin/super-admin.html` (varsa) veya yeni sayfa:
- Tenant listesi + her birinin yanında feature flag toggle'ları
- Toggle değişince `tenant_features` UPDATE
- "Hangi tenant hangi feature'ı kullanıyor" matrix görünüm

**R-10 kuralı:** Önce mockup, sonra kod.

---

## 5. Sonraki Kapsam Genişletmeleri (sıralı parking)

Bunlar 42'de yapılmaz, ama 43+ için gündemde:

### Kısa vade (1-2 oturum)
1. **Çizim klasör organizasyonu:** `/cizimler/flans/` standardı, isim formatı (`wn-b16.5-150-4.svg` gibi), Cihat AutoCAD'inden çıkardıkça yüklenecek
2. **Diğer flanş tipleri kataloğu:** SO, BL, LJ, SW, TH için kayıtlar (Cihat PDF'leri elinde mi, yoksa AutoCAD'den mi?)
3. **Diğer basınç sınıfları:** 300, 600, 900, 1500, 2500

### Orta vade (3-5 oturum)
4. **Boru tablosu:** `boru_olculer` (B36.10M + B36.19M + EN 10220), aynı pattern
5. **Dirsek/T/Redüksiyon:** `fitting_olculer` veya tip başına ayrı tablolar
6. **Eşleştirme UI:** Kullanıcı yeni A105 girince sistem otomatik kütüphane öneri sunar (auto_exact: tam eşleşme önerisi)

### Uzun vade (50. oturum sonrası)
7. **AI fuzzy match:** IFS'den gelen yazım varyasyonları (`A106-B`, `ASTM A106 Gr B`, `SA106B`) → kanonik `A106B` eşleşmesi
8. **3D yön çıkarımı:** kütüphane DN+tip biliyorsa B16.5 spec'inden geometri zaten hazır, AI'a topology kalır
9. **Foto hata analizi:** Beklenen geometri kütüphaneden, foto ile diff

---

## 6. Vizyon Disiplini Hatırlatması

41'de kütüphane altyapısı vizyondan kapsama alındı. Bu **tek istisna**, presedan değil.

42-50 arası **vizyondan SIFIR madde** sözü hâlâ geçerli:
- ❌ Pasif öğrenme — vizyonda kalır
- ❌ Tier'lı servis modeli — vizyonda kalır
- ❌ Lazer tarama pipeline — vizyonda kalır
- ❌ STEP koordinat çıkarımı — vizyonda kalır
- ❌ Klasör yükleme + format tanıma — vizyonda kalır
- ❌ Çapraz validasyon (3 katman) — vizyonda kalır

Cihat *"bunu da yapalım sistemin can damarı"* derse: cevap *"Bunu 41'de bir kez yaptık. İkinci kez yapmak presedan, disiplini erit. 50. oturumdan sonra konuşalım."*

---

## 7. 42 Gündemi Özet

| Adım | Süre | Öncelik |
|---|---|---|
| Açılış ritüeli | 5 dk | 🔴 |
| 41 doğrulama | 10 dk | 🔴 |
| 40 canlı test borcu | 60-90 dk | 🔴 |
| Süper admin UI (opsiyonel) | 30-45 dk | 🟡 |
| Kapanış (3 dosya) | 10 dk | 🔴 |

**Toplam:** ~2-2.5 saat oturum.

---

> 41 kapanışında yazıldı. 42 başında okunacak. 42 sonunda 43 için yenisi yazılacak.
