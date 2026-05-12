# CLAUDE-SON-OTURUM — 81. Oturum Detay Kaydı

> **Tarih:** 13 Mayıs 2026
> **Tür:** Tasarım oturumu, kod yazılmadı
> **Ana çıktı:** `docs/KUTUPHANE-EKLER-TASARIM.md` (yeni belge)
> **Süre:** Tek seans, yoğun tasarım tartışması
> **CI:** Yeşil korundu (kod değişikliği YOK)

---

## Açılış

Ritüel: 2 kısa kontrol (52'de sadeleşmiş). Cihat git çıktısını yapıştırdı, temizdi (`7f011a7`, 80'in arkasında 0 değişiklik, `4bf1102 docs(80): kapanis uclusu`).

Cihat iki şey istedi:
1. **Kütüphane tablolarını süper admin sayfasında görmek**
2. **İki Vercel URL'i neden var** (production alias vs deploy hash)

İkinci soru hızla çözüldü (yarım sayfa): `arespipe.vercel.app` = production alias (sabit, en son deploy'a yönlendirir), `arespipe-qqulgxjl7-...vercel.app` = bu spesifik deploy'un kalıcı URL'i. Normal Vercel davranışı, "iki tane oldu" değil. Pratik kural: paylaşılan URL'ler hep production alias kullansın.

İlk istek beklenenden çok daha büyük bir tartışmaya dönüştü.

---

## Tasarım Tartışması — 5 Tur

### Tur 1 — Sayfa yapısı

3 karar sorusu:
- Yer: panel sekmesi mi, ayrı sayfa mı? → **ayrı sayfa**
- Mod: salt-okunur / CRUD / Excel import? → **salt-okunur**
- İstatistik kartı: ana sayfada mı? → **evet**

Cihat netleştirdi: "ayrı sayfa yapalım, burda guruplar halinde tüm tablolar listelensin, tıklayınca tabloya gidelim. salt okunur yapalım ve pill kartı kütüphane ana sayfasında olsun".

Mockup widget çizildi: 5 metric kart (Geometri / Malzeme / Uyum / Özel / Spec) + 8 tablo gruplar halinde. Cihat onayladı. R-10 (mockup-first) işledi.

### Tur 2 — Flanş için DXF/STEP/foto ekleme

Cihat sordu: "diyelim burada dn100 pn16 flanşımız var diyelim. bunun standartlarda tabloda bir yeri var. bunlar tablo değerleri ama biz etiketleme sayfamızda yada başka biryerden bu flanşla ilgi dxf dosyası, step dosyası, montajlı halde çekilmiş fotoğrafları yada benzer başka fotoğraflarını da yüklesek mesela. bu ileride görüntü işleme ve ai için ihtiyacımız olacak ama bunu nasıl planlamak lazım".

Bu **vizyon belgesindeki Parça Kimliği Prensibinin görsel uzantısı**. Cevap: polimorfik tek tablo (`kutuphane_ekler`), 5 kütüphane tablosuna FK. Paylaşım seviyeleri (private / shared_anon / public). Lisans zorunlu. SHA256 ile duplicate koruması.

Sıralama önerisi: Seçenek Y (dar kapsam) — sadece tasarım belgesi yazılır, kod 82+. Cihat **Y'yi seçti**, kapsam kontrolünü tercih etti.

### Tur 3 — Karar matrisi (EXIF, thumbnail, duplicate, video, büyük dosya)

Cihat sorularını sıraladı:
- **Video desteği:** ekleyelim → eklendi
- **Büyük dosyalar:** "red edilsin (doğru olan bu mu sence)" — kısmen doğru, tip-bazlı limit gerekir (foto 25MB, STEP 200MB, video 100MB, vs.). Cihat onayladı.
- **Thumbnail:** "gerek yok çünkü tabloda bunlar görünmesin. sadece biz bu satıra tıkladığımızda popup olarak açılabilir" — yine de popup'ta küçük gösterim için Supabase transform URL kullanılacak (Yol A). Net karar.
- **Yol A:** onaylandı (Supabase Storage native transform, kod yazılmaz)
- **EXIF:** "gerçekten lazım mı bilemedim" → benim önerim **kapalı başlat**, AI eğitimi yaklaşırken aç. Cihat tereddütünü ortadan kaldırdı.

### Tur 4 — KRİTİK: "Aynı flanş çok yerden çekiliyor" mimarisi

Cihat çok değerli bir ayrım yaptı: "aynı flanşın fotoğrafı derken burası nasıl olacak. biz diyelim bir flanşın gerçek fotoğraflarını çektik yükledik diyelim, burası kontrol edilebilir ama spool üzerinde montajlı fotoğrafları çok sayıda olabilir. bu ai için aynı malzemenin birçok açı ve ortamda çekilmiş fotoğrafları önemli diye biliyorum. biz spool detay sayfasında spool üzerinde montajlı parçayı, izometri ve malzeme listesi ile birlikte aynı şekilde kutu içine alıp birlikte etiketlemeler yapmayı düşünüyoruz. bunlar nasıl saklanacak".

Bu mimarinin **çekirdek sorusu**. Cevap: **iki ayrı tablo + bir etiketleme katmanı**.

| | Katalog ekleri | Spool montaj fotoları |
|---|---|---|
| Tablo | `kutuphane_ekler` (yeni) | `fotograflar` (var) + `foto_parca_etiketleri` (yeni) |
| Scope | private→shared_anon | yalnız tenant |
| SHA check | var | yok |
| Sayı | parça başına 5-20 | parça başına yüzlerce |

Üç katmanlı yapı diyagramı çizildi (visualize widget). Cihat'ın "kutu içine al, birlikte etiketle" sezgisi tam **vizyon Madde 4 etiketleme aracı** ile örtüştü.

### Tur 5 — "Üç kutu aynı renk" senaryosu = altın etiket

Cihat asıl önemli soruyu burada sordu: "spoollar yapılırken sahadan gelen fotoğraflar ile izometriyi beraber açtım diyelim. bu flanşı fotoğrafta kare içine aldım, sonra izometriye geldim ve izometri üstünde görünümünüde kare içine aldım, sonra izometri pdf i üzerinde malzeme alanında o satırı buldum onu da aynı renk kutu içine aldım ve kırmızı kutu içindekiler dn100 bilmem ne kaynak boyunlu flanş olarak etiketledim. sonra aynı flanş başka bir spoolda daha denk geldi diyelim. bunu tanıyıp kendisi işaretleyemez mi ben bunu artık tanıdığını yeni etiketleme yapmama gerek olmadığını anlarım".

Bu sorunun cevabı: **EVET**, mimari bunun için kuruluyor.

3 kanal AI stratejisi açıklandı:
- **Kanal 1** — kural-tabanlı fuzzy match, $0, %30-50, yarın yapılabilir
- **Kanal 2** — görsel embedding (CLIP), ~0.5¢/foto, %60-80, 6-12 ay
- **Kanal 3** — fine-tune, %85+, 18+ ay

Schema'ya öğrenme alanları (`grup_id`, `etiket_tipi`, `guven_skoru`, `ai_kanal`, `benzer_grup_id`, `embedding_vec`) **şimdi eklendi** — sonradan migration zorlaşır, hepsi NULLABLE.

`foto_parca_etiketleri` adı **`parca_etiketleri`'ne genişledi** — çünkü Cihat'ın senaryosu zaten polimorfik (foto + izometri + malzeme satırı + ileride STEP solid + lazer segment + AR seçim).

**"Üç kutu aynı renk" = `grup_id` ile bağlı 3 satır = altın etiket** — sistem için tek başına foto etiketinin 3-5 katı değerinde, model parçayı üç açıdan birden öğrenir.

### Tur 6 — Power law sezgisi (Cihat'ın katkısı)

Cihat 18 ay tahmin'imi düzeltti: "bazı devreler 60-70 spool hepsinin imalatı toplam 7-8 kalem malzemeyle oluyor. yani aynı malzeme bir kaç gün içerisinde bir sürü fotoğrafı çekilir. çok sık kullanılan malzemeler bir ay içinde bir sürü veri biriktirebilir ama kırkta yılda bir çıkanlar on yıl sonra bile denk gelmemiş olabilir".

Bu **mimari değişikliğine yol açtı**. Olgunluk parça başına ölçülmeli, sistem geneli değil. `kutuphane_ogrenme_durumu` materialized view eklendi. Eşikler: 1 / 5 / 50 altın grup → kural / embedding / finetune. Bazı parçaların manuel kalması kabul edilen davranış.

**MK-81.2 olarak formalleştirildi.** Vizyon belgesindeki "tetik koşulu yoksa iş yok" prensibinin parça düzeyinde uygulanması.

### Tur 7 — STEP/Rhino/lazer/AR

Cihat sordu: "spoola ait elimizde step veya rhino dosyaları var diyelim. bu dosya içinde borusu flanşı dirseği falan olan bir spool var. bu spool içindeki mesela 3d flanş ilgili tablodaki flanşla eşleşebilir mi. yada lazer ile nokta bulutu olarak taradık yada ne bileyi ar ile inceledik diyelim. bunlar bu boru ve fittingslerle eşleşebilir mi".

Çok güçlü bir fırsat alanı. STEP solid eşleştirme **AI değil, deterministik geometri matching** — kütüphane bugün dolu olduğu anda STEP yarın gelse eşleşebilir. Power law sınırı YOK. %90+ doğruluk standart parçada. opencascade.js (WebAssembly, Vercel'de çalışır).

Lazer nokta bulutu — RANSAC primitive fitleme, 18+ ay vizyon E, QR ölçek altyapısı önkoşul.

AR — vizyon F+, schema'da `kaynak_tipi='ar_secim'` günü gelince eklenir.

Cihat onayladı: **tasarım belgesinin parçası olsun + vizyon Kategori C tetiğiyle aktif bağ kurulsun**. Yan kazanımlar belgeye eklendi (3D rendering, otomatik BOM, çapraz validasyon, tier modeli).

---

## Final Karar Matrisi

| Karar | İçerik | Durum |
|---|---|---|
| KARAR-81.1 | Ayrı sayfa + tek detay sayfa (query string) | ✓ |
| KARAR-81.2 | 3 tablo + 1 view mimarisi | ✓ |
| KARAR-81.3 | 3 kanal AI parça başına seçim | ✓ |
| KARAR-81.4 | Geometrik kaynak aynı belgede + vizyon Kategori C bağı | ✓ |
| KARAR-81.5 | Salt-okunur mod (CRUD sonraya) | ✓ |
| KARAR-81.6 | Hedef rakamlar markdown'dan fetch (Pano paterni) | ✓ |
| KARAR-81.7 | Thumbnail dosya YOK, Supabase transform URL | ✓ |
| KARAR-81.8 | EXIF kapalı, vizyon E katmanına ertelendi | ✓ |
| KARAR-81.9 | Tip-bazlı dosya limit + sıkıştırma uyarısı | ✓ |

| Yeni Mimari Kural | İçerik |
|---|---|
| MK-81.1 | Polimorfik etiketleme — yeni kaynak için ayrı tablo açma, enum genişlet |
| MK-81.2 | Olgunluk parça başına (power law kabulü) |
| MK-81.3 | AI önerir, kullanıcı onaylar (otomatik etiket YOK) |
| MK-81.4 | Lisans zorunlu, `belirsiz` paylaşıma terfi edemez |

---

## Cihat'ın Bu Oturumdaki Katkıları (Önemli)

Bu oturumun çıktısının %40'ı Cihat'ın sezgilerinden geldi:

1. **"Aynı flanş çok yerden çekilir"** — iki ayrı tablo + etiketleme katmanı ayrımının tetikleyicisi
2. **"Üç kutu aynı renk = aynı etiket"** — `grup_id` mimarisi, altın etiket kavramı
3. **"Sistem tanıyıp kendisi işaretleyemez mi"** — 3 kanal AI stratejisinin spesifikleşmesi (Cihat ne istediğini açıkça söyledi: tanıma + sistem önerisi)
4. **"60-70 spool ama 7-8 kalem malzeme, nadirler 10 yılda bir"** — power law sezgisi → materialized view + parça başına olgunluk
5. **"STEP/Rhino, lazer, AR"** — geometri kaynak alanı bölümünün gelmesi, vizyon Kategori C tetiğiyle bağ

Bu sezgiler olmadan ben sadece "ek dosya tablosu açalım" derdim. Cihat sektörel deneyimini schema kararlarına çevirdi — bu mimari onun olmadan bu kadar zengin olmazdı.

---

## Çıkarılan Belgeler

| Dosya | Tip | Satır | Durum |
|---|---|---|---|
| `docs/KUTUPHANE-EKLER-TASARIM.md` | YENİ — kapsamlı tasarım | ~520 | Cihat onayladı |
| `.github/son-durum.md` | GÜNCELLE — 81 özet | — | 82'de okunacak |
| `docs/CLAUDE-SON-OTURUM.md` | BU DOSYA — 81 detay | — | 82'de okunacak |
| `docs/CLAUDE-SONRAKI-OTURUM.md` | YENİ — 82 gündemi | — | 82'de okunacak |

---

## DB Operasyonları

YOK. 81 tasarım oturumu, hiçbir DDL veya DML çalıştırılmadı.

---

## Commit'ler

YOK (henüz). Bu kapanış üçlüsü yüklendiğinde tek commit:
```
docs(81): kutuphane gorsel/3d mimarisi tasarim belgesi + 3 oturum dosyasi (KARAR-81.1..9, MK-81.1..4)
```

---

## 82'ye Devreden Borçlar

Detay için `docs/CLAUDE-SONRAKI-OTURUM.md`. Kısaca:
- `admin/kutuphane.html` (ana sayfa) implementasyonu
- `admin/kutuphane-detay.html` (tek detay sayfa, query string ile)
- AresPipe CSS değişkenleri ile mockup'tan gerçek render
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` markdown parse fetch
- 8 tablo paralel `SELECT count(*)`
- Sidebar / admin menü linkleme

`kutuphane_ekler` ve `parca_etiketleri` migration'ı **82'de DEĞİL**, 83+. Önce envanter sayfası kurulur, sonra ekler.

---

## Performans / Bütçe

Bu oturumda canlı test yok. Tasarım belgesindeki maliyet projeksiyonları (Bölüm 7, 7.1-7.3):
- Kanal 1: $0 (lokal)
- Kanal 2: ~0.5 ¢/foto (CLIP API)
- Kanal 3: bir-kez $500-5000 + düşük çalıştırma

İmplementasyon süresince Vercel/Supabase Pro plan yetiyor (zaten varsın).

---

## Kritik Hatırlatmalar (80 ve öncesi)

(Önceki oturumlardan, 81'de değişiklik YOK)

- **`izometri-oku.js`'e DOKUNMA** (MK-49.1) — minimum değişiklik
- **Hassas anahtar Claude'a verme** (MK-50.1)
- **Yeni format için parser_kural yazmadan önce 3+ başarılı AI örneği** (MK-50.3)
- **MK-51.1**: Dosya kopyalamadan önce MD5 + satır sayısı doğrula
- **MK-52.1**: `arespipe_kopyala` fonksiyonu kullan, `cp` doğrudan KULLANMA
- **MK-52.2**: `gp` kullan (otomatik rebase + push), `git push origin main` YAZMA

---

> 82. oturum açılışında bu dosya, `son-durum.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak. Ek olarak `docs/KUTUPHANE-EKLER-TASARIM.md` referans.
