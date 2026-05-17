# CLAUDE-SONRAKI-OTURUM.md — 95. Oturum Gündemi

> 94 → 95 geçişi. CuNi boru + flanş yüklendi (92 satır). Kütüphane geliştirme için **ayrı Claude projesi** açıldı — bu oturum (95) **ana proje sohbeti**, normal geliştirmeye devam.

---

## 🔀 İki Proje Koordinasyonu

**Bu sohbet (95+):** `AresPipe` (ana proje)
- Normal geliştirme işleri (kod, UI, DB schema, debug)
- Migration SQL'i yazıp DB'ye uygulama
- Kütüphane projesinden gelen JSON'ları Migration'a çevirme

**Diğer sohbet:** `AresPipe — Kütüphane Veri Kaynakları` (yeni proje)
- PDF'lerden veri çıkarma (KME, Tenaris, Alaskan, vs.)
- Veriyi JSON formatında üretme (boru/fitting/flansh kolon şemasıyla)
- DB'ye dokunmaz, sadece JSON üretir
- Cihat JSON'u indirir, ana projeye getirir, "şu JSON'dan Migration SQL üret" der

### Migration Numarası Çakışma Önleme

İki sohbet de yeni migration yazabilir. Aynı numara çakışmasın diye:

**Her yeni migration başlamadan önce kontrol:**
```bash
ls ~/Desktop/arespipe/migrations/ | sort | tail -3
```

En son numarayı görüp +1 al. `gp` (otomatik rebase) zaten karşı tarafın commit'ini çekiyor, push'tan önce conflict varsa fark eder, numarayı kaydırırsın.

### İletişim Yolu

İki proje arasında veri akışı:
1. Kütüphane sohbetinde JSON üretildi → Cihat JSON'u indirir
2. Cihat ana projeye gelir, JSON'u paylaşır
3. Bu sohbet (95+) JSON'dan Migration SQL üretir
4. Standart akış: arespipe_kopyala MD5 → git commit → gp → Supabase SQL Editor

---

## 🚀 95. Oturum Başlangıç Önerisi

Cihat oturumu açtığında, **normal başlangıç ritüeli + 1 ek adım**:

```
1. git pull origin main && git status && git log --oneline -3
2. Bugün ne yapmak istiyorsun?
3. (Yeni) Kütüphane sohbetinden JSON var mı? — varsa onunla devam, yoksa normal gündem
```

---

## 95'in Açık Borçları (Öncelik Sırası)

### 1. `docs/KUTUPHANE-YUKLEME-TAKIP.md` Güncellemesi (10 dk, kapanışta yapılmadı)

**Yapılacaklar:**
- DIN-86019 boru: 0 → 44 satır eklendi, **hedef rakam doğru yaz (yanlış '18' yazılıydı, gerçek 30-50)**
- DIN-86037-2 LJ: 0 → 29 satır eklendi (yeni kayıt)
- EN-1092-3 EN-T05: 0 → 19 satır eklendi (yeni kayıt)
- **EEMUA-144 boru** ekle: 24 satır mevcut, hedef ~30 P1 CuNi (UI'da "tanımsız standart" rozetinden çıksın)
- **Vocabulary kararı not düş:** "Lap-joint stub end flanşları (ASME LJ + DIN 86037-2) aynı kategori. UI/DB'de 'LJ' kullanılır."
- Genel istatistik güncel: boru 495, flansh 48 yeni (toplam? — DB'den sayım), fitting 0

### 2. 93'ten Devralınan `olusturma_at` Rename (Açık Borç)

**Bağlam:** 93 kapanışında KARAR-93.6 ile 94'e ertelendi. 94'te de farklı yön seçildi (CuNi yüklemesi). Hâlâ açık.

**İş kapsamı:**
- Migration 076 önce — UI ve API'lerde `olusturma` kolonu standardı `olusturma_at` olarak rename edildi (93'te)
- Bazı eski tablolarda hâlâ `olusturma` (rename yapılmamış)
- Migration `076b_olusturma_at_rename.sql` veya benzer ad ile tam yap

Önce SQL ile hangi tablolar `olusturma` (rename yapılmamış) kontrol et:
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name IN ('olusturma', 'olusturma_at')
ORDER BY table_name, column_name;
```

### 3. Kütüphane Sohbetinden Gelecek JSON İşleme (Sürekli)

Kütüphane sohbeti DIN 86089 fitting için JSON üretirse, bu sohbet:
1. JSON'u oku, geometrik sanity check
2. Migration 078 SQL üret (fitting_olculer schema'ya göre)
3. arespipe_kopyala + commit + push + Supabase Run
4. Doğrulama sorgusu + UI test

Pattern Migration 076/077 ile aynı.

### 4. Diğer Geliştirme İşleri

Cihat'tan gelecek normal işler (önceki oturumlardan, KUTUPHANE-YUKLEME-TAKIP.md kapsamı dışı):
- Pano implementasyonu (23. oturumdan)
- Format envanter UI (super_admin için /admin/formatlar)
- Devre wizard UI (Session 50+)
- Reducer dimension table entegrasyonu (43. oturumdan)
- Test Yönetimi sayfası (CLAUDE.md son-durum'dan)

---

## ⚠️ Kritik Hatırlatmalar (94 + öncesi)

**94'te öğrenilen MK disiplinleri:**

- **MK-94.1:** Yeni standart eklerken **sözlük tablosunun kolon tiplerini önceden çek** (JSONB vs TEXT[] tuzağı).
  ```sql
  SELECT column_name, data_type, udt_name
  FROM information_schema.columns
  WHERE table_name = '<sözlük_tablosu>'
  ORDER BY ordinal_position;
  ```

- **MK-94.2:** Yeni veri yüklemeden önce **target tablonun NOT NULL ve kolon listesini doğrula**:
  ```sql
  SELECT column_name, is_nullable, data_type
  FROM information_schema.columns
  WHERE table_name = '<hedef_tablo>'
  ORDER BY ordinal_position;
  ```

- **MK-94.3:** Composite/lap-joint design flanşlar için DB schema bolt kolonları NULL kabul eder. ASME integral'e özel constraint değildir.

- **MK-94.4:** Vocabulary kararı PDF üreticinin terminolojisinden değil, **teknik fiziksel tasarımdan** alınır.

- **MK-94.5:** Programatik sanity check yeterli, manuel 5 örnek karşılaştırma gerekmedi. Yeni veri için **Python sanity scripti** (geometrik mantık, fizik formülü) tek seferde tüm satırlara uygulanır.

**Önceki oturumlardan:**

- **MK-43:** PDF context stream yerine `pdftotext -layout` disk extraction
- **MK-48.1:** Vercel build cache stale node_modules — manuel redeploy + "Use existing Build Cache" kapalı
- **MK-50.3:** Yeni format/standart için 5 örnek doğrulama → 94'te programatik sanity check ile değiştirildi
- **MK-51.1:** arespipe_kopyala MD5 ile, tahmin yok
- **MK-52.2:** `gp` push (otomatik rebase)

---

## 📋 Süreç Disiplinleri (94 + 93'ten)

- **Supabase SQL Editor BEGIN/COMMIT desteklemez** → panoya alırken filtrele:
  ```bash
  grep -v -E "^(BEGIN|COMMIT);$" file.sql | pbcopy
  ```
  Dosyada kalır (psql/CI uyumu).
- **Doğrulama her zaman ayrı SELECT** ile, Editor "Success" göstermese bile commit olmuş olabilir.
- **Aynı PDF'ten çoklu standart yüklerken** tek migration'da BEGIN/COMMIT kullan, hata olunca tüm satırlar rollback.
- **GitHub web UI upload yok**, sadece terminal git akışı (51. oturumda "Add files via upload" karışıklığı yaşandı).

---

## 🎯 96+ Vizyon

**Kütüphane tarafı:**
- CuNi fitting (Migration 078) — yeni kütüphane projesinden gelecek
- ASTM A312 paslanmaz boru — Outokumpu/Tubacex/Sandvik PDF (yeni projeye yüklenir)
- ASTM A106/A53 karbon boru — Tenaris Dalmine PDF (yeni projeye yüklenir)
- malzeme_kataloglari modülü (~120 grade) — ayrı yol haritası
- A790 Duplex (Sandvik özel et)

**Ana geliştirme tarafı:**
- Devre wizard UI tamamlama
- Pano implementasyonu
- Format envanter UI
- Reducer dimension table entegrasyonu

**Hedef ölçü:** 96 sonunda CuNi tüm kategorilerde **doluluk %70+** (boru + flanş + fitting + malzeme katalog hepsi var).

---

## 📁 İlgili Dosyalar

- `.github/son-durum.md` — 94 özet
- `CLAUDE-SON-OTURUM.md` — 94 detaylı
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` — yükleme takip (güncellenmesi gerek)
- `docs/KUTUPHANE-KAPSAM.md` — kapsam haritası
- `KUTUPHANE-PROJE-PROMPTU.md` — yeni Claude projesine yüklenecek (bu oturumda hazırlandı)
- `CLAUDE.md` — proje ana bağlam

---

> 95. oturum açılışında bu dosya + `.github/son-durum.md` + `CLAUDE-SON-OTURUM.md` okunur.
> Önerilen açılış: "Kütüphane projesinden JSON geldi mi? Yoksa hangi gündem?" — Cihat'ın yönü belirler.
