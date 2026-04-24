# CLAUDE — 29. Oturum Kapanış Raporu

**Tarih:** 24 Nisan 2026
**Süre:** ~4 saat
**Tema:** Devredilebilirlik Günü — Hibrit Dokümanlar
**Durum:** ✅ TAMAMLANDI (6 belge canlıda, motor çalışıyor, race condition düzeltildi)

---

## 🎯 Oturum Özeti

AresPipe'ı **yazılımcıya devredilebilir** hale getirme günü. 28'de onaylanan "Hibrit Dokümanlar" planı uygulandı: 6 belge yazıldı, AUTO bölüm güncelleme motoru kuruldu, production'da race condition yakalanıp düzeltildi. Yeni bir yazılımcı artık repo'yu açtığında `docs/ONBOARDING.md` ile başlayabilir.

---

## 📦 Teslim Edilenler

### Motor Dosyaları (canlıda, workflow yeşil)

| Dosya | Satır | Görev |
|---|---:|---|
| `.github/docs-uret.js` | ~290 | AUTO bölüm üretici (6 fonksiyon, try/catch, exit 0) |
| `.github/workflows/docs-uret.yml` | ~75 | Push tetiklemeli, [skip ci] + rebase retry |

### Dokümantasyon (6 belge, 1515 satır)

| Dosya | Satır | Manuel/AUTO |
|---|---:|---|
| `README.md` | 92 | %100 manuel |
| `docs/ONBOARDING.md` | 210 | %95 / %5 |
| `docs/ARCHITECTURE.md` | 395 | %80 / %20 |
| `docs/DATABASE.md` | 293 | %30 / %70 |
| `docs/API.md` | 329 | %20 / %80 |
| `docs/LOCAL-DEV.md` | 196 | %100 manuel |

### Fix + Keşifler

- `.github/package.json` fantom borç — 28'de lokal oluşmuş, push edilmemişti → düzeltildi
- ARCHITECTURE.md'deki AUTO-sınır örneği script tarafından gerçek sınır sanılıyordu → Türkçe karakter trick'i ile çözüldü
- docs-uret.yml race condition (kontrol.yml ile paralel) → rebase + 3x retry eklendi

---

## 🧪 Sandbox Testleri (7 edge case geçti)

Production'a göndermeden önce `/home/claude/29-test/` altında mini repo kuruldu:

1. ✅ Mutlu yol — 2 AUTO bölümlü dosya güncellendi, manuel metin korundu
2. ✅ AUTO sınırı yok olan dosyaya dokunulmadı
3. ✅ AUTO-START var AUTO-END yoksa dokunulmadı + uyarı verildi
4. ✅ Dosya yoksa geçildi, hata yok
5. ✅ İdempotent — ikinci run'da 0 güncelleme (sonsuz döngü imkansız)
6. ✅ Yorumsuz endpoint için fallback mesajı ("açıklama yok — yorum başlığı ekle")
7. ✅ Sayım doğruluğu — 4 sayfa, 3 mobil, 5 tablo, 3 endpoint, 7 kural, 2 migration

Ama **paralel workflow race condition sandbox'ta simüle edilemedi** — production'da ilk push'ta keşfedildi.

---

## 🐛 Production'da Yakalanan Buglar ve Çözümleri

### Bug 1 — Race Condition: kontrol.yml vs docs-uret.yml

**Belirti:** İkinci push sonrası docs-uret workflow'u "non-fast-forward rejected" verdi.

**Kök neden:** İki workflow paralel tetiklenir. kontrol.yml bitip `ci-son-rapor.json` auto-commit'i push ederken, docs-uret.yml de AUTO bölüm commit'ini push etmek istiyor — remote'ta yeni commit olduğu için docs-uret'in push'u reddediliyor.

**Çözüm:** docs-uret.yml'in "Auto-commit + push" step'ine rebase retry eklendi:
```bash
for i in 1 2 3; do
  git pull --rebase origin main && git push && exit 0
  echo "Push denemesi $i başarısız, tekrar deneniyor..."
  sleep 2
done
```

**Ders (son-durum.md disipline eklendi):** CI auto-commit pattern'i her zaman "commit → pull --rebase → push (3x retry)" olmalı. Sandbox tek process olduğu için bu bug orada yakalanamaz.

### Bug 2 — AUTO Sınır Örneği Parse Ediliyor

**Belirti:** ARCHITECTURE.md ilk push'tan sonra `bolumadi(?)` uyarısı verdi.

**Kök neden:** Dokümantasyonda "AUTO sınırı şöyle yazılır" örneği olarak verdiğim `<!-- AUTO-START:bolumadi -->` bloğu script'in regex'i tarafından gerçek sınır sanıldı, "bilinmeyen bölüm" uyarısı çıktı.

**Çözüm:** Örneği Türkçe karakterli yaptım (`BÖLÜM_ADI`) — regex `[\w-]+` Türkçe karakterleri yakalamaz.

**Ders:** Parser'a öğretirken parser'ın kurallarına uy; eskape yerine "regex dışı karakter kullan" daha temiz.

---

## 🎓 Bu Oturumdan 5 Önemli Öğrenme

1. **Sandbox tek process, production çok process.** Paralel workflow race condition sandbox'ta simüle edilemez. CI pattern'i baştan "senkron push" şeklinde yazılmalı.

2. **Atomik commit dersi yeniden doğrulandı.** 6 belge tek upload'da gitti, hepsi birbirine referans veriyor (README → docs/, ONBOARDING → diğer 4 belge). Aşamalı atsak ara durumlarda kırık link'ler olurdu.

3. **Dürüst dokümantasyon faydalı.** LOCAL-DEV.md "lokal çalışmıyor" diyor, yazılımcıya yalan söylemiyor. Varsayımsal "lokal kurulum" yazsaydık yanıltıcı olurdu.

4. **AUTO sınır regex kendi örneğinin kurbanı olur.** Dokümanda örnek gösterirken parser'ın dışında kalması için eskape veya karakter trick'i gerekli.

5. **Vercel free tier günlük deploy kotası var.** Yoğun push günlerinde "rate limited" yersin. Kod sorunu değil, plan sınırı. Pro geçişi ürün dönemi öncesi değerlendirilmeli.

---

## 🗓️ İşlem Tarihçesi (kronolojik)

| Saat | İş | Sonuç |
|---|---|---|
| 0:00-0:15 | Ritüel (git pull, CI yeşil teyit) | Temiz giriş |
| 0:15-0:30 | Fantom borç keşfi + `.github/package.json` push | ✅ |
| 0:30-1:30 | docs-uret.js + workflow yazımı, sandbox'ta 7 test | ✅ |
| 1:30-1:45 | Motor dosyaları GitHub'a yüklendi, ikisi de yeşil | ✅ |
| 1:45-2:00 | Cihat'tan 3 soru cevabı (kitle, dil, local dev) + API format teyit | ✅ |
| 2:00-3:30 | 6 belge yazımı (iskelet → onay → tam dosya sırasıyla) | ✅ |
| 3:30-3:45 | ARCHITECTURE.md AUTO örnek bug düzeltme | ✅ |
| 3:45-4:00 | 6 belge GitHub'a upload (tek atomik commit) | ✅ |
| 4:00-4:20 | Race condition bulundu, workflow düzeltildi, canlıda yeşil | ✅ |
| 4:20-4:30 | Cihat'ın "fotoğraf arşiv kaydı" sorusu → borca eklendi | Not |
| 4:30-... | Oturum kapanış dosyaları (bu) | ✅ |

---

## 📝 Borca Eklenen Yeni Notlar

### Fotoğraf / Belge Yaşam Döngüsü (Cihat kaydı istedi)

**Kayıt:** Aktif devrede fotoğraflar/belgeler gerçek boyutta görüntülenir. Devre tamamlanıp aktif listeden arşive (bağlı olduğu proje) taşınırken **sıkıştırılıp** depolanır. Amaç: storage maliyetini düşürmek + aktif iş akışında görsel kaliteyi korumak.

**Şu anki durum:**
- `fotograflar` tablosu var, `dosya_url`, `yukleyen_id`, `islem_turu`, `spool_id` kolonları mevcut
- `arespipe-dosyalar` bucket'ında orijinal boyutta yükleniyor
- **Sıkıştırma/arşivleme mekanizması YOK** — devre "tamamlandı" durumuna geçtiğinde hiçbir otomatik iş tetiklenmiyor

**Ne gerekiyor (taslak):**
- `devreler.durum = 'tamamlandi'` transition'ında trigger veya API endpoint
- Görsel sıkıştırma (muhtemelen Vercel function + Sharp veya benzeri)
- Yeni sıkıştırılmış dosyaları ayrı storage yolu altında (arşiv klasörü)
- Eski URL'lerin yeniden yazılması veya DB'deki `dosya_url` güncellenmesi
- Veri kaybı riski minimize — orijinali belki N gün saklı tutulmalı

**Ne zaman:** 30-34 aralığının birinde (muhtemelen 30 Bucket PRIVATE ile birlikte çünkü Storage altyapısına dokunulacak, ya da 33 staging ile çünkü migration + data lifecycle ilişkili). Karar 30'un sonunda verilecek.

**Öncelik:** 🟢 Orta — acil değil (storage maliyeti şu an kritik değil) ama müşteri artışından önce kurulmalı (çok proje = çok foto).

### Diğer Borçlar
- 🟡 Vercel `ci-son-rapor.json` auto-commit'inin Vercel'i tetiklememesi için "ignored build step"
- 🟡 `actions/checkout@v4` + `setup-node@v4` v5 geçişi (Node 20 deprecated warning)
- 🟡 Supabase `arespipe-dev` projesi incelemesi — eski deneme mi, canlı bir kullanımı var mı?

---

## 🚀 30. Oturum İçin Hazırlık

**Tema:** Bucket PRIVATE Geçişi + Signed URL Altyapısı

**Neden acil:** `arespipe-dosyalar` bucket'ı şu an PUBLIC. URL'i bilen herkes (rastgele veya bilerek) her firmanın her dosyasına erişebilir. **Müşteri öncesi bu kritik güvenlik açığı.**

**Kapsam (tahmini):**
1. Mevcut bucket envanter — kaç dosya, hangi yollar, toplam boyut
2. `public: false` ayarı ve mevcut dosya erişim modelini anlama
3. Signed URL (imzalı link) API endpoint'i: `api/dosya-url-al.js`
   - Yetki kontrolü (kullanıcı kendi tenant'ının dosyasına mı istiyor?)
   - Süre-sınırlı link üretimi (örn. 1 saat geçerli)
4. Frontend'de `dosya_url` doğrudan kullanımı yerine bu endpoint'i çağırma akışı
5. Hangi sayfalar etkilenir — envanter + migration planı (muhtemelen spool_detay, devre_detay, kesim, büküm, kalite_kontrol)
6. Test — başka tenant'ın dosyasına URL almaya çalışıldığında reddediliyor mu

**Tahmini süre:** 3-4 saat

**Risk:** Orta — yanlış yapılırsa mevcut dosya gösterimleri kırılır (tüm operasyon sayfalarında foto). **Önce sandbox** + önce feature flag ile bir sayfada test + sonra yaygınlaştırma önerilir.

---

## 🏁 Kapanış Notu

29'un başında korktuğum şey: 6 belge × ~250 satır = büyük iş, zaman yetmez. Gerçekte: motor dosyası en çok vakti aldı (~1.5 saat sandbox dahil), belgeler sırayla akıcı yazıldı. 28'in kurduğu atomik commit disiplini (PAT + Vercel Sensitive birlikte) bugün 6 belgenin birlikte gitmesine doğal refleks verdi.

Race condition bulduğumuzda paniğe kapılmak yerine log okumak (27'nin dersi) işe yaradı — 2 dakikada sebebi bulduk, 5 dakikada çözdük, canlıda yeşil. 29 başarılı bir oturum.

**30 için hazır.** Cihat ertesi gün geldiğinde `son-durum.md` + `CLAUDE-SONRAKI-OTURUM.md` açık ve net: Bucket PRIVATE.

---

_Oturum kapandı — 24 Nisan 2026, 29. oturum._
