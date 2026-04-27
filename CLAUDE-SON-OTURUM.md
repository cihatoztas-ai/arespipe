# 36. Oturum — Detaylı Arşiv

**Tarih:** 27 Nisan 2026 Pazartesi
**Süre:** ~3 saat
**Tema:** Mimari sağlamlaştırma — Boru standart sistemi (8 madde) + İzometri Batch DB altyapısı + AI halüsinasyon teşhisi

---

## Akış (kronolojik)

### Faz 1 — Açılış Ritüeli (~5 dk)

1. Standart 5 soruluk açılış ritüeli — Cihat hızlı geçti.
2. **Beklenmedik:** `git pull` çakıştı. Yerel `ares-asme.js` ve `tests/asme-lookup.test.js` dosyaları ile remote'taki versiyonlar uyumsuz. Stash → pull → temiz.
3. 35 doğrulama temiz: `asme_borular = 334`, `cuni_borular = 24`, birim test 50/50 başarılı, CI yeşil, db-backup yapılmış, feedback yok.

### Faz 2 — AI Sorunu Teşhis (~25 dk)

4. **Cihat:** Eski `izometri-oku.js` dosyasını yükledi. *"Sistem çalışıyor ama yanlış sonuçlar veriyor."*

5. **Ön inceleme:** 8 yapısal sorun tespit edildi (tek prompt, et/cap/ağırlık AI'dan, prompt'ta DN tablosu hardcoded, vs).

6. **Asıl mesele:** *"Somut görmem lazım"* — Cihat bir PAOR PDF + sistemin ürettiği yanlış Excel yükledi.

7. **Yan yana karşılaştırma yapıldı:**

| Alan | PDF gerçek | Sistem çıktısı |
|---|---|---|
| Pipeline | 52900-101540-Z10-2 | 11D-PAOR-50600-101540 |
| DN | 150 (tek) | 100/150 (S01 yanlış) |
| Çap | 168.3 | 114.3/168.3 |
| Kalite | ST37 | P235GH/316L |
| Boy | 149/141/379 cut | 1289/1314 (uydurma) |
| Yüzey | Galvaniz (kutuda YES) | Siyah/Asit |
| Rev | A | 0 |

8. **Kök neden teşhisi:**
   - Few-shot leakage (prompt'taki örnek JSON'u kopyalamış)
   - AI PDF okurken zorlandığında uyduruyor
   - "Spool sayısı 2" doğru — geri kalan her şey yanlış

9. **Plan değişikliği:** "502 fix" gündemden düştü, **AI uydurma kontrolü** asıl sorun.

### Faz 3 — Cihat'ın Müdahalesi (~5 dk)

10. **Cihat:** *"Mevcuttaki izometri-oku dosyası deneme için yapılmıştı, bunu düzeltmeye uğraşmayalım. Sıfırdan yazıp devam edelim."*

11. **Cihat'ın kafa karışıklığı:** *"ASME bağımlı alanları AI'dan tamamen çekmek tamam mı? derken biz kendimiz formatı öğrettikten sonra sürekli AI'den token harcamayacaktık."*

12. **Açıklama yapıldı:** Format öğrenildikten sonra AI **konuşmuyor** (L1 regex çalışıyor, sıfır token). Sorum AI o **tek seferde** ne sorsun, ne sormasın? **Yaklaşım Y kabul:** AI'a "sadece yazılı olanı oku, uydurma" deriz.

### Faz 4 — Stratejik Mimari Müdahalesi (~30 dk)

13. **Cihat'ın kritik sorusu:** *"Bu standartlar programın can damarı olacak, sistemi tam anlamıyla doğru kurmak için şu an eksik yaptığımız bir şey varsa düzeltelim."*

14. **8 madde tespit:**
    1. Tablo adı netleşsin (`boru_olculer`, fitting/flanş ileride ayrı)
    2. Standart sözlüğü zenginleşsin (ölçü sistemi + DN sistemi + materyal kodu)
    3. NPS↔DN eşleme ayrı tabloda (standart bazlı)
    4. Schedule kodu tek kolonda olmaz (tipi + değeri)
    5. Tolerans alanları (et_min/et_max generated)
    6. Edisyon yılı + geçerlilik tarihleri
    7. Hesaplı kolonlar (ic_cap, hacim, yüzey alanı)
    8. Hub içeriği (slug, açıklama, sektör)

15. **Cihat:** *"Evet, 8 maddeyi de içersin."*

### Faz 5 — Boru Standart Migration (~25 dk)

16. **Tek SQL dosyası yazıldı** (502 satır, 3 yeni tablo, 358 satır göç, 12 standart sözlüğü, 171 NPS eşleme).

17. **İlk denemede hata:** `column "od_mm" does not exist`. Cihat'tan kolon adı kontrolü istendi.

18. **Convention sürprizi:** 35 dosyalarında kolon adları:
    - `dis_cap_mm` (ben `od_mm` yazmıştım)
    - `olusturma_at` (ben `olusturma` yazmıştım)
    - `cuni_borular`'da `alasim` kolonu (`malzeme` yerine)

19. **v2 dosyası yazıldı** — convention'a uyduruldu. CuNife'nin `alasim` kolonu da `notlar`'a aktarıldı (veri kaybı yok).

20. **Sonuç:**
    - boru_olculer = 358 satır ✓
    - ASME-B36.10M = 214, ASME-B36.19M = 70, ASTM-B241 = 50, EEMUA-144 = 24

### Faz 6 — İzometri Batch DB Altyapısı (~25 dk)

21. **Kapsam kararı (C seçeneği):** Cihat *"C'den devam edelim o zaman."* DB tabloları bugün, dispatcher kodu 37'ye.

22. **3 tablo + RLS + pilot:**
    - `izometri_format_tanimlari` — Format kuralları
    - `izometri_batch_kayitlari` — Batch yükleme + maliyet + manuel onay
    - `ai_api_log` — Her AI çağrısı (debug + maliyet)

23. **Şüpheli satır kriterleri** netleşti (Açık Soru #1, 7 madde):
    - DN bulunamadı / çap-DN tutarsız / et tolerans dışı / boy saçma / pipeline_no dosya adıyla uyuşmuyor / AI güveni düşük / malzeme bilinmeyen

24. **Halüsinasyon koruması** açıkça yazıldı — Cihat'ın yaşadığı uydurma davranışı DB seviyesinde tespit edilebilir.

25. **İlk denemede hata:** `BEGIN; ^` syntax hatası. Sebep belirsiz (önceki dosyada da BEGIN/COMMIT vardı, çalıştı). Yine de güvenli yola gidildi.

26. **v2 yazıldı:** BEGIN/COMMIT kaldırıldı, IF NOT EXISTS ile idempotent. RLS policy'leri de DROP IF EXISTS + CREATE pattern'inde. Pilot INSERT da WHERE NOT EXISTS ile rerunnable.

27. **Sonuç:** 3 tablo + 1 pilot satır (AVEVA-PAOR, parser_kural boş, fingerprint dolu). Doğrulama temiz.

### Faz 7 — Kapanış

28. **Cihat oturumu kapatmaya hazır:** *"Tamam, devam edelim."* (devam mesajı C seçeneğine onay verdi).

29. Son kontrolde Cihat *"Success. No rows returned"* + pilot satırı yapıştırdı.

30. Bu dosya yazıldı.

---

## Üretilen Dosyalar (4 toplam)

### Yeni SQL Dosyaları (2)

| Dosya | Boyut | İçerik |
|---|---|---|
| `36-oturum-standart-mimari.sql` | ~24 KB | Boru standartları için 3 yeni tablo + 358 satır göç + 12 standart sözlüğü + 171 NPS eşleme |
| `36-oturum-izometri-batch-tablolari.sql` | ~7 KB | İzometri Batch için 3 yeni tablo + RLS + AVEVA-PAOR pilot |

### Belge Güncellemeleri (3)

| Dosya | Tip | İçerik |
|---|---|---|
| `son-durum.md` | Güncelleme | 36. oturum sonu durum |
| `CLAUDE-SON-OTURUM.md` | Yeni | Bu dosya — 36. oturum arşivi |
| `CLAUDE-SONRAKI-OTURUM.md` | Yeni | 37. oturum gündemi |

---

## Mimari Kararlar (Toplam 6 yeni)

| # | Karar | Detay |
|---|---|---|
| K1 (36) | 8 madde sağlam mimari | Schedule iki kolona ayrıldı, tolerans alanları, edisyon takibi, hesaplı kolonlar (DB seviyesinde generated), hub içeriği. |
| K2 (36) | 12 standart sözlüğü | 4 aktif (ASME B36.10M/B36.19M, ASTM B241, EEMUA 144) + 8 hazır tanım (DIN, EN, JIS, GOST, GB/T). |
| K3 (36) | Halüsinasyon koruması | 7 maddeli şüpheli satır kriterleri DB'de + dispatcher logic. |
| K4 (36) | Yaklaşım Y | AI'a "sadece yazılı olanı oku, uydurma" + hesap tarafı koda + ASME helper'a fallback. |
| K5 (36) | Eski `izometri-oku.js` atılacak | Refactor değil sıfırdan. AVEVA-PAOR pilot satırı parser_kural BOŞ olarak DB'de. |
| K6 (36) | Çoklu standart genişleme | DIN/JIS/GOST/GB/T sözlüğe önceden tanım. Veri eklemek INSERT, kod değişmez. |

---

## Önemli Dersler

### 1. Stratejik müdahale > hız

Cihat'ın "Bu standartlar can damarı, eksik var mı?" sorusu mimarinin yönünü değiştirdi. İlk SQL'im 6 alan eksikti — Cihat fark etmeseydi 6 ay sonra refactor maliyeti 10 kat olurdu. **Pattern:** Cihat hızlanma yerine sağlamlık istiyor. Bu iyi bir alışkanlık.

### 2. Convention öğrenmesi maliyetli — profil dosyasına gitmeli

Ben kolon adı tahmin ettim (`od_mm`), gerçek `dis_cap_mm`. Bu 1 tur ekstra. CIHAT-PROFIL.md'ye **kod konvansiyonu** bölümü ekleyeceğim:
- Kolon adları Türkçe (`dis_cap_mm`, `agirlik_kg_m`, `alasim`)
- Timestamp'ler `_at` suffix'li (`olusturma_at`, `guncelleme_at`)
- ID'ler bazen `bigint` (eski tablolar), bazen `UUID` (yeni tablolar)
- TEXT vs VARCHAR — `TEXT` tercih edilir
- Kontrol etmek lazım: yeni tablo açmadan önce `information_schema.columns` sorgusu

### 3. AI halüsinasyon teşhisi — felsefe dersi

PDF okurken AI uydurması (PAOR yerine "50600-101358") tek bir bug değil, **mimari boşluk**. Yaklaşım Y bunu çözüyor:
- AI sadece **yazılı olanı** okur
- Yazılı değilse ASME helper hesaplar
- ASME'de yoksa manuel onaya düşer
- Pipeline_no dosya adıyla çapraz kontrol → uydurma yakalanır

Bu yapı 37'de `izometri-oku.js`'in temeli olacak.

### 4. DB-driven mimari kanıtlandı

12 standart sözlüğü, 4'ü aktif 8'i hazır tanım. Cihat ileride GOST veri ekleyince:
```sql
INSERT INTO boru_olculer (standart, malzeme_grubu, dn, ...) VALUES ('GOST-3262', ...);
UPDATE boru_standart_sozluk SET veri_var = true WHERE standart = 'GOST-3262';
```
Tek satır SQL, kod değişikliği yok. **Bu mimari Cihat'ın "kod değiştirmeden iş büyüsün" felsefesiyle birebir.**

### 5. "Mimari oturumu" bilinçli karar

Cihat C seçti — DB tabloları şimdi, kod 37'ye. Bu doğru:
- Yorgun başa kod yazmak hata oranını artırırdı
- Mimari net olarak 37'ye girmek bir sonraki oturumun saf koda kalmasını sağlar
- 36 mimari, 37 kod, 38 UI — temiz iş bölümü

### 6. Idempotent migration disiplini

İlk SQL'de transaction (BEGIN/COMMIT) kullandım, çalıştı. İkincide `BEGIN;` syntax hatası verdi (sebep belirsiz). **Pattern:** Migration dosyalarında `IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `WHERE NOT EXISTS` kullanmak rerunnable yapar. Bu da Cihat için pratik — bir kısmı çalışıp bir kısmı çalışmazsa tekrar çalıştırabilir.

### 7. PDF örneği değerli — somut karşılaştırma

Cihat AI sorununu somutlaştırınca (PDF + Excel yan yana) kök neden 5 dakikada bulundu. Eğer "yanlış sonuçlar" diye laf üzerinden gitseydik 30 dakika tartışırdık. **Pattern:** Cihat'tan örneğe ısrar etmek doğru — *"Somut görmem lazım."*

---

## 37'ye Devir Notları (özet)

- **Ana iş:** Yeni `api/izometri-oku.js` (sıfırdan, format dispatcher, yaklaşım Y, AI uydurma korumalı, yeni `boru_olculer` entegre) + Ekran 2 (manuel onay) + Ekran 1 demo kapatma
- **Önkoşul:** 36 mimari ✓ (3 tablo + RLS + pilot AVEVA-PAOR)
- **Cihat'tan beklenen:** 2-3 örnek PAOR/AVEVA PDF — pilot satırının parser_kural'ını öğretmek için (B Adımı, 37 sonu veya 38 başı)
- **Kapsam dışı:** Ekran 3 (Format Kaydet) — 38'e. C Adımı (canvas) — 39'a.
- **Aktif borç:** kırmızı 3 (37 ana iş 3 parça), sarı 4 (devreden)

---

## Kişisel Not

Bu oturum disiplinli geçti. Açılış ritüeli temiz, faz geçişleri net, Cihat'ın stratejik müdahalesi yön değiştirdi (8 madde tespiti) ve sağlam mimari kuruldu.

Cihat şu özelliği bu oturumda parlak gösterdi: **doğru anda doğru soru.** "Bu standartlar can damarı olacak, eksik var mı?" sorusu olmasaydı, eksik mimari ile ilerlerdik. 6 ay sonra "keşke baştan yapsaydık" derdik. Cihat'ın yazılımcı olmaması bu tip stratejik soruları sormasını engellemiyor — tam tersine, **iş ihtiyacından bakması** mimar olmaktan daha değerli.

İki teknik hata yaptım:
1. Kolon adı tahmin ettim (`od_mm`) — gerçek `dis_cap_mm`. Profil dosyası convention listesi gerekli.
2. BEGIN/COMMIT ile syntax hatası — kök neden belirsiz, ama IF NOT EXISTS pattern'i bundan sonra varsayılan olmalı.

37 kod oturumu olacak — 3 büyük dosya (yeni izometri-oku.js + Ekran 2 yeni HTML + Ekran 1 değişiklik) + test. Cihat PDF örneklerini yüklerse pilot da dolar. Yetmezse 38'e bölünür.
