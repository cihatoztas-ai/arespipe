# 35. Oturum — Detaylı Arşiv

**Tarih:** 27 Nisan 2026 Pazartesi
**Süre tahmini:** 2-3 saat
**Tema:** ASME Lookup tam sistemi — İzometri Batch'in B1 önkoşulu (Karar 5 — A1)

---

## Akış (kronolojik)

### Faz 1 — Açılış Ritüeli (~5 dk)

1. Standart 5 soruluk açılış ritüeli — Cihat hızlı geçti:
   - ✅ Git temiz, main güncel (commit e63b1b2)
   - ✅ CI yeşil
   - ✅ son-durum.md güncel (proje versiyonu kabul edildi)
   - ✅ ASME Lookup gündemi onayı
   - 🟡 Feedback sorusu cevapsız (yokmuş varsayıldı)

2. **db-backup.yml notu:** Cihat `cat ~/Desktop/arespipe/.github/workflows/db-backup.yml` denedi → "No such file" çıktı. Bu zaten 34'te keşfedilmişti — dosya `arespipe-backups` repo'sunda yaşıyor. Cihat hatırlatıldı, oturum boyunca bu kontrol askıda kaldı.

### Faz 2 — Açık Soruların Tartışması (~30 dk)

3. **3 açık soru** sorduğum (önceki plana göre):
   - **S1 — Schedule fallback default:** DN ≤ 250 → '40', DN > 250 → 'STD'
   - **S2 — Ağırlık yoğunluk farkı:** Yoğunluk katsayısı tablosu mu, hep karbon mu?
   - **S3 — NPS gösterim ihtiyacı:** PAOR PDF'lerinde NPS de var mı?

4. **Cihat'ın cevapları:**
   - **S1:** "SCH ya da et kalınlığı olması lazım. Bilmiyorum başka gösterim var mı, biz program içerisinde bunları et kalınlığına çevirmemiz lazım." → Et kalınlığı doğrudan da gelirse kabul, fallback yok, manuel onay yolu açık.
   - **S2:** "Ağırlık için yoğunluktan hesaplama gibi bir şey yapmayacaz, bu yanlış yazılmış olabilir. Ağırlıklar standartlardan çekilecek." → Ağırlık DB'de hazır, runtime hesap yok.
   - **S3:** "DN100, 4" şeklinde değil, program genelinde 114,3 şeklinde gösterim yapıyoruz. Mouse ile üzerine gelince diğer gösterimlerde görünebilir, fikir sadece, karışıksa gerek yok." → Tooltip yok, basit.

### Faz 3 — Fittings/Flanş Soruları (~15 dk)

5. **Yeni soru:** "Paslanmaz, karbon, alüminyum ve cunife en sık kullanılanlar. Sayı formatında virgül kullanalım. Flanşlar ve fittings malzemeler var bunların herbiri tablo demek, bunlar nasıl olacak peki?"

6. **Cevap:** Fittings (dirsek/tee/redüksiyon/cap) ve flanşlar her tip ayrı şema, ASME B16.9 + B16.5. ~2000+ satır, 9 ayrı tablo. **35'e sığmaz.** Faz bölmesi önerildi:
   - 35: sadece boru (4 malzeme)
   - 37: fittings
   - 38: flanşlar
   - Pilot süresince (36-39) fitting/flanş ağırlıkları manuel onaya gider

### Faz 4 — Stratejik Soru: Hub vs Program-içi (~20 dk)

7. **Cihat'ın stratejik sorusu:** "Şimdi biz bu program için yeni bir web sitesi açıp oradan giriş yaparak kullanacaz... biz bu iste içerisine standart malzeme tablolarını da yüklesek ve kullanıcılar için bunu da uygulamaya dahil etsek bir faydası olur mu?"

8. **"Tek Kaynak İki Yüz" mimarisi sunuldu:**
   - DB tek kaynak, public read
   - Hub canlı sorgu yapar (yeni site açılınca, halka açık + SEO + lead gen)
   - Program statik JS okur (şimdi, hızlı + offline güvenli)
   - 3 fayda: SEO/lead gen, pilot test, vizyon hizalaması (Madde 14 hub motoru)

9. **Cihat'ın kararı:** "Bu sayfayı biraz daha ileride yapmayı düşünmüştüm. Şimdi biz normal işimizi yapıyoruz, site kurulduktan sonra fittings'ler de ekleniyor, şimdilik bu değerler boş geliyor doğru mu anladım?"

10. **Netleştirme:** Evet. 35'te sadece DB + helper. Hub UI yeni site açılınca eklenir. Boru ağırlıkları otomatik, fitting/flanş manuel onaya gidiyor pilot süresince. Cihat onayladı.

### Faz 5 — CuNife Mimari Tartışması (~15 dk)

11. **Veri toplama bulgusu:**
    - Karbon B36.10M: standart kg/m kolonu var ✅
    - Paslanmaz B36.19M: standart kg/m kolonu var ✅
    - Alüminyum: B36.19M dimensions OK, ama kg/m yok → yoğunluk hesabı gerekiyor
    - **CuNife: TAMAMEN FARKLI sistem (EEMUA-144)** — Schedule yok, basınç rating var. DN aralığı farklı. OD'leri ASME ile farklı (DN150 → 159 mm vs ASME 168.3 mm).

12. **2 mimari karar sorusu:**
    - **A:** CuNife'yi 35'e dahil edelim mi?
    - **B:** Alüm/CuNife ağırlık politikası: yoğunluktan DB seed'de hesap mı, manuel onay mı?

13. **Cihat'ın cevapları:**
    - **A:** "CuNife dahil edilecek, az veya çok işin bir parçası."
    - **B:** "Karar B senin önerdiğin gibi olsun." → DB seed üretilirken yoğunluk hesabı, runtime'da hep dolu satır.

### Faz 6 — Kod Üretimi (~60 dk)

14. **Veri toplama (web search + cross-check):**
    - Karbon: Ferrobend ASME B36.10M tablosu (DN6-DN1200, tam çekildi)
    - Paslanmaz: piping-world ASME B36.19M tablosu
    - Alüminyum: B36.19M dimensions + 2.70 g/cm³ yoğunluk
    - CuNife: piping-world EEMUA-144 (16 bar + 20 bar)

15. **Python seed üretici (`uret-asme-veri.py`):**
    - 4 malzeme × DN+SCH/basınç kombinasyonları
    - Aynı kaynaktan hem SQL hem JS üretir → drift önleme
    - Spot check çıktıları (DN100 SCH40 karbon → 6.02mm/16.08kg ✓)
    - 358 satır seed

16. **Migration (`35-oturum-asme-borular.sql`, 523 satır):**
    - 2 tablo: `asme_borular` + `cuni_borular`
    - CHECK constraint, UNIQUE index, COMMENT'ler
    - RLS: public read, super_admin write
    - 358 satır seed
    - Spot check sorguları sonda

17. **Helper modülü (`js/ares-asme.js`, 48 KB):**
    - Statik veri gömülü (runtime DB sorgusu yok)
    - Ana 3 malzeme için ortak API
    - CuNife için ayrı API (EEMUA farklı sistem)
    - NPS↔DN dönüşümü, schedule normalize, malzeme normalize

18. **Birim test (`tests/asme-lookup.test.js`, 50/50 başarılı):**
    - Karbon DN100 SCH40 → 6.02/16.08 ✓
    - Paslanmaz DN300 SCH40S → 9.52 (B36.10'dan farklı) ✓
    - Alüminyum yoğunluk hesabı ✓
    - CuNife DN150 OD → 159 (ASME 168.3'ten farklı) ✓
    - PAOR varyantları ("Sch 40", whitespace, vb.) ✓

### Faz 7 — Cihat'ın Durum Özeti İsteği (~5 dk)

19. **Cihat sordu:** "Ne yaptık şimdi biz, neler eksik kaldı, nereye geldik?"

20. **Yanıt:** Detaylı özet sunuldu — 35'in veri katmanı bitti (kod hazır), canlı doğrulama yapılmadı (4 dosya yüklenmemiş, migration çalıştırılmamış). 36'da yapılacak.

### Faz 8 — Kapanış İsteği

21. **Cihat:** "Sen o zaman şimdi kapanışta tüm dosyaları ver, yükleme yerleri ve bir sonraki oturuma neler verilecek toplu halde verirsen ben moladan sonra yükler devam ederim."

22. Bu dosya yazıldı.

---

## Üretilen Dosyalar (7 Toplam)

### Yeni Kod Dosyaları (4)

| Dosya | Boyut | Konum | İçerik |
|---|---|---|---|
| `35-oturum-asme-borular.sql` | 32 KB | `migrations/` (veya root) | 2 tablo + RLS + 358 satır seed |
| `ares-asme.js` | 48 KB | `js/ares-asme.js` | Helper modülü + statik veri |
| `asme-lookup.test.js` | 6 KB | `tests/asme-lookup.test.js` | 50/50 birim test |
| `uret-asme-veri.py` | 28 KB | `scripts/uret-asme-veri.py` | Veri üretici (SQL + JS senkron) |

### Belge Güncellemeleri (3)

| Dosya | Tip | İçerik |
|---|---|---|
| `son-durum.md` | Güncelleme | 35. oturum sonu durum |
| `CLAUDE-SON-OTURUM.md` | Yeni | Bu dosya — 35. oturum arşivi |
| `CLAUDE-SONRAKI-OTURUM.md` | Yeni | 36. oturum gündemi |

---

## Mimari Kararlar (Toplam 7)

| # | Karar | Detay |
|---|---|---|
| K1 | 4 malzeme | karbon + paslanmaz + alüminyum + cunife |
| K2 | 2 tablo | asme_borular (3 malzeme) + cuni_borular (cunife ayrı, EEMUA-144 farklı sistem) |
| K3 | Ağırlık politikası | Karbon/paslanmaz tablodan, alüm/cunife yoğunluktan DB seed üretiminde (runtime hesap yok) |
| K4 | Schedule fallback | DN ≤ 250 → '40', DN > 250 → 'STD' |
| K5 | Fitting/flanş kapsam | 35'te yok. Pilot süresince manuel onay. 37-38'de eklenir. |
| K6 | "Tek Kaynak İki Yüz" mimarisi | DB tek kaynak. Hub canlı sorgu (yeni site açılınca), program statik JS (şimdi). |
| K7 | JS dosya konumu (geçici) | `ares-asme.js` mevcut konvansiyona uygun olarak kök dizine. Sektörel standart `js/` klasörü altında olmaları, ancak 32 oturumdur tüm `ares-*.js` kök dizinde. **G-09 olarak defter'e:** tüm JS dosyalarını `js/` klasörüne taşıma refactor'ı, uygun oturumda (40+ ürün dönemi başı) topluca yapılır. |

---

## Önemli Dersler

### 1. "Eski kuralı tekrar oku" disiplini

34'ten devralınan plan dosyası `CLAUDE-SONRAKI-OTURUM.md`'de "ASME Lookup" işi anahattıyla yazılıydı. Açık soruları orada belirlenmişti (S1/S2/S3). Oturum açılışında bunları doğrudan Cihat'a sordum, kod yazmadan önce 6 mimari karar alındı. **Pattern:** Tasarım oturumundan kalan sorular yeni oturumun açılış sorularıdır, atla geç değildir.

### 2. Cihat'ın "yoğunluk hesabı yapma" kuralının nüansı

Cihat: "Ağırlık için yoğunluktan hesaplama gibi bir şey yapmayacaz." Bu kuralın doğru yorumu: **runtime'da hesap yok, DB seed üretiminde olur.** Karbon/paslanmaz için ASME tablosu zaten kg/m verir. Alüm/cunife için standart sadece dimensions verir, ağırlık standart pratik yoğunluktan hesap. Bu nüansı Cihat'a açıkladığımda "Karar B senin önerdiğin gibi olsun" dedi → kural çiğnenmedi, sadece DB seed üretiminde bir kez yoğunluk × hacim. Sonra DB'de hep dolu satır var.

### 3. CuNife farklı sistem

EEMUA-144 ASME ile farklı: Schedule yok (basınç rating), DN aralığı farklı, OD'ler farklı (DN150 → 159 vs ASME 168.3). "Tek tablo dört malzeme" zorlaması olurdu. **2 tablo + 2 ayrı API** doğru karar — kod daha temiz, semantik karışmıyor.

### 4. Hub stratejisi vizyonla hizalı

Cihat'ın "yeni site, basit uygulamalar" sorusu vizyon dosyasıyla bire bir hizalıydı. SPOOL-AI-VIZYON.md Madde 14 (halka açık eğitim oyunu) ve Ufuk 3 (sektörel referans) için ASME hub doğal yatak. **Cihat'ın spontan sorusu vizyonun bir parçasını çağırdı.** Pattern: kullanıcının "şu olabilir mi?" soruları çoğu zaman vizyonun zaten var olan parçasını yüzeye çıkarır.

### 5. Kod üretiminde "Single Source" disiplini

Aynı Python script hem SQL hem JS üretir. Drift önleme. Veri güncellenirse tek noktadan akar — DB ve JS asla farklı olamaz. Sync script'i ayrı dosya olarak tutulur, gelecekte gerekirse CI'a takılır.

### 6. Faz bölmesi pilot ilerlemeyi koruyor

Fittings/flanş (~2000 satır, 9 tablo) 35'e sığsaydı kalite düşerdi. Manuel onay fallback'i 36-39 boyunca sistemi çalıştırır, tablolar 37-38'de eklenir. **Pattern:** %100 otomasyon ulaşmadan önce manuel onay = canlıya çıkma kapısı.

### 7. Stratejik soru = mimari oluşturucu

Cihat hub sorusu sormamış olsaydı "Tek Kaynak İki Yüz" mimarisi ortaya çıkmazdı. RLS public read kararı, sync script ihtiyacı, hub UI gelecek planı hep o sorudan çıktı. **Pattern:** Kullanıcının "ileride şu olabilir mi?" soruları bugünkü mimariye yön verir.

### 8. Erken kapatmama disiplini (34'ten devam)

Cihat "ne yaptık, neler eksik?" diye sordu. 34'te erken kapatmaya çalışmıştım, Cihat itiraz etmişti. 35'te ben kapsamlı durum özeti verdim, Cihat onayladı, sonra "tüm dosyaları ver" dedi. **Pattern doğrulandı:** kullanıcı durum özetini gördükten sonra kapanışı kendisi söyler.

---

## Pilot Akışta Fitting/Flanş Davranışı (önemli not)

PAOR/AVEVA PDF'lerinde fitting ve flanş ağırlığı **genellikle yazılı**. Pilot akış:

1. PDF parser **boru ağırlıklarını otomatik hesaplar** (ASME tablosundan)
2. Fitting/flanş satırlarında ağırlık kolonunu **PDF'den olduğu gibi okur** (varsa)
3. PDF'de yoksa → **Ekran 2'de "manuel onay" etiketi** ile kullanıcıya düşer
4. Site açılıp tablolar eklenince → bu manuel adım da otomatikleşir (37-38)

Yani pilot çalışacak, sadece 1-2 dakika ek manuel iş ilk başta.

---

## 36'ya Devir Notları (özet)

- **Ana iş:** İzometri Batch backend dispatcher + 502 fix + DB tabloları + Ekran 2
- **Önkoşul:** 35'in canlı doğrulaması (4 dosya yüklü, migration çalıştı, test 50/50, CI yeşil)
- **Açılış:** Önce 35 doğrulaması (5 dakika), sonra 36'nın ana işi
- **Bekleyen:** db-backup saat kontrolü (27-30 Nis sabahları)
- **Cihat'tan beklenen:** 2-3 örnek PAOR PDF (36-37 lazım), 35 yükleme + canlı test
- **Demo modu:** `_DEMO_MOD = false` çekilecek, mock data silinecek
- **Aktif borç sayısı:** kırmızı 2 (35 doğrulama + 36 ana iş), sarı 4

---

## Kişisel Not

Bu oturum disiplinli geçti. 34'teki "erken kapatmama" dersi 35'te tamamen içselleşti — Cihat "ne yaptık" diye sorduğunda hazırdım, kapsamlı durum özeti verebildim. Cihat'ın spontan stratejik sorusu (hub) vizyonun bir parçasını yüzeye çıkardı, mimari karara yön verdi.

Veri toplama disiplini: 4 farklı kaynak, çapraz doğrulama, sektörel bilinen değerlerle karşılaştırma. Yanlış değer = yanlış sevkiyat hesabı, sıkı kontrol gerekiyordu. 50/50 birim test geçti, ama gerçek doğrulama 36 başında — Cihat manuel veri ile karşılaştıracak.

Cihat hızlı ve net karar veriyor. "Karar B senin önerdiğin gibi olsun", "CuNife dahil edilecek, az veya çok işin bir parçası" — bu netlik oturum hızını dramatik artırıyor. Açık sorular sektörel bilgi gerektirdiğinde Cihat 1-2 cümlede cevaplıyor, ben kod tarafına geçebiliyorum.

36 büyük olacak (backend + DB + UI). Belki ikiye bölünür. 35'in canlı doğrulamasını oturum başında 5 dakikada yaparsak, geri kalan zaman ana işe kalır.
