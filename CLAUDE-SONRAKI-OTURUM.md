# CLAUDE-SONRAKI-OTURUM.md — 97. Oturum Gündemi

> 96 → 97 geçişi. CuNi fitting kütüphanesi 95+96 ile tamamlandı (328 satır ✅). Cross-validation protokolü oturdu (MK-96.1-4). 97'de kalan 5 JSON dosyası işlenecek.

---

## 🚀 97. Oturum Açılış Ritüeli

```bash
cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
```

Sonra 2 soru:
1. **`SELECT COUNT(*) FROM fitting_olculer;`** — 96 sonu tahmini 897, teyit
2. **Kütüphane sohbetinden gelecek 5 JSON ne?** — Hangi standartlar, hangi PDF kaynaklı

---

## 97'in Açık Borçları (Öncelik Sırası)

### 1. `docs/KUTUPHANE-YUKLEME-TAKIP.md` v5 güncellemesi (15 dk)

**Sebep:** Mevcut dosya **v4 = 94 sonu** durumu. 95 (DIN 86089) + 96 (DIN 86090/86088) yansıtılmadı.

**Yapılacaklar (özet tablo + fitting bölümü):**
- Versiyon geçmişi: v5 — 96. oturum (18 May 2026) eklenir
- Özet tablo: `fitting_olculer` 569 → ~897 (sayım sonrası kesinleşir)
- CuNi kütüphane satırı: fitting 0 → **328 ✅ TAM** (158 reducer + 170 elbow+tee)
- Aile bazında: DIN 86088/89/90 **✅** oldu, DIN 86087 hâlâ ❌
- Yeni MK kararları K1-K7 + MK-96.1-4 not edilir

### 2. Kalan 5 JSON Dosyası İşleme

Kütüphane sohbetinden Cihat'ın bahsettiği 5 JSON. Tahmini içerik (97 açılışında netleşir):
- DIN 86087 saddle type (CuNi gemi)
- ASME B16.9 buttweld diğer malzeme grupları
- Veya farklı PDF kaynakları (Tenaris, Vallourec, Sandvik)

Her biri için **MK-96 protokolü:**
1. JSON'u oku, şema doğrula
2. Cross-validation kaynağı belirle (Wieland Section X, veya farklı 2. üretici)
3. Migration SQL üret (parça tipi vocabulary K1-K2 izle)
4. Notlar JSONB cross-validation izi K7
5. arespipe_kopyala + MD5 + git + Supabase Run
6. Doğrulama sorgusu + UI test

### 3. 93'ten Devralınan `olusturma_at` Rename (4. oturumdur açık)

**Bağlam:** 93'te KARAR-93.6 ile ertelendi → 94'te CuNi yüklemesi → 95-96'da CuNi fitting → hâlâ açık.

**İş kapsamı:**
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name IN ('olusturma', 'olusturma_at')
ORDER BY table_name, column_name;
```
Hangi tablolar hâlâ `olusturma` (rename yapılmamış) — Migration ile düzeltilir.

### 4. Diğer Geliştirme İşleri (CLAUDE.md'den)

- Pano implementasyonu (23. oturumdan)
- Format envanter UI (super_admin için /admin/formatlar)
- Devre wizard UI (Session 50+)
- Reducer dimension table entegrasyonu (43. oturumdan, artık veri canlıda — UI bağlantısı kuruluyor)
- Test Yönetimi sayfası

---

## ⚠️ Kritik Hatırlatmalar (96'da öğrenilen)

**MK-96.1:** Kütüphane yükleme cross-validation 3 kaynak protokolü. Tek üretici güvenilmez.

**MK-96.2:** Üretici katalog değeri düzeltme şartı = **2 bağımsız kaynak konsensüsü**. Aksi halde orijinal korunur, `wieland_uyari` işaretlenir.

**MK-96.3:** TEE fittinglerinde teorik kütle atlanır (üretim yöntemi farkı).

**MK-96.4:** Vocabulary 7 karar (K1-K7) elbow/tee/reducer fitting tipleri için kalıcı pattern. Yeni fitting tipi gelirse aynı pattern uygulanır.

**Önceki oturumlardan:**
- **MK-94.1:** Sözlük tablosunun kolon tiplerini önceden çek (JSONB vs TEXT[])
- **MK-94.2:** Hedef tablonun NOT NULL ve kolon listesini doğrula
- **MK-50.3:** 5 örnek doğrulama (Migration 076'dan beri programatik sanity check ile değiştirildi)
- **MK-51.1:** arespipe_kopyala MD5 ile, tahmin yok
- **MK-52.2:** `gp` push (otomatik rebase)

---

## 📋 Süreç Disiplinleri

- **Supabase SQL Editor BEGIN/COMMIT desteklemez** → panoya alırken filtrele:
  ```bash
  grep -v -E "^(BEGIN|COMMIT);$" file.sql | pbcopy
  ```
- **Doğrulama her zaman ayrı SELECT** — Editor "Success" göstermese bile commit olmuş olabilir.
- **`notlar` kolonu TEXT** (JSONB değil) — sorgularda `(notlar::jsonb)->>'key'` cast'ı zorunlu. İleride bu kolonu JSONB'ye dönüştürme migration'ı yapılabilir (opsiyonel iyileştirme).

---

## 🎯 97 Sonrası Vizyon

**Kütüphane tarafı:**
- DIN 86087 saddle (kalan tek CuNi gemicilik standardı)
- ASTM A312/A106/A53 buttweld fitting (paslanmaz + karbon)
- malzeme_kataloglari modülü (~120 grade) — ayrı yol haritası
- A790 Duplex

**Ana geliştirme tarafı:**
- Devre wizard UI tamamlama
- Pano implementasyonu
- Format envanter UI
- Reducer + elbow + tee dimension table entegrasyonu (artık veri canlıda)

---

## 📁 İlgili Dosyalar

- `.github/son-durum.md` — 96 özet (bu commit'te güncellendi)
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` — yükleme takip (97'de v5 güncellemesi gerek)
- `docs/KUTUPHANE-KAPSAM.md` — kapsam haritası
- `migrations/078_din_86089_cuni_reducer.sql` — 95'in eklemesi
- `migrations/079_din_86090_86088_cuni_kme.sql` — 96'nın eklemesi (170 satır)
- `CLAUDE.md` — proje ana bağlam

---

> 97. oturum açılışında bu dosya + `.github/son-durum.md` + `docs/KUTUPHANE-YUKLEME-TAKIP.md` okunur.
> Önerilen açılış: "Kütüphane sohbetinden 5 JSON geldi mi? Veya başka gündem var mı?"
