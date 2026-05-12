# CLAUDE-SONRAKI-OTURUM — 82. Oturum Gündemi

> **Bu dosya 82'nin açılışında okunacak.** Birlikte: `.github/son-durum.md` + `docs/CLAUDE-SON-OTURUM.md` + `docs/KUTUPHANE-EKLER-TASARIM.md`.

---

## 82. Oturum Ana Tema

**Kütüphane envanteri sayfası implementasyonu.** Tasarım 81'de mockup'la onaylandı, kararlar netleşti. Bu oturumda kod yazılır.

Hedef çıktılar:
1. `admin/kutuphane.html` — ana sayfa, 5 metric kart + 8 tablo grupları halinde
2. `admin/kutuphane-detay.html` — tek detay sayfa, query string ile (`?tablo=X`)
3. Sidebar/admin menüsünde "Kütüphane" linki
4. Süper admin yetki kontrolü

**Süre tahmini:** 1 oturum, ~3-4 saat.

---

## Önerilen Sıra (82'de)

### Saat 1 — Hazırlık ve sayfa iskeleti

1. `docs/templates/yeni-sayfa-sablonu.md`'den iskelet kopyala
2. AresPipe standartlarına uydur:
   - `<html data-theme="dark">`
   - Barlow font, CSS değişkenleri (`var(--ac)`, `var(--gr)`, vb.)
   - `ares-layout.js` + `ares-normalize.js` script yüklemesi
   - `ARES.sayfaYetkiKontrol(['super_admin'])`
   - i18n `tv()` helper, `data-i18n` attributeları
3. Sidebar'a "Kütüphane" linki ekle (super_admin için görünür)
4. `admin/` alt-dizini olduğu için script yollarına `../` ekle (R-10 referans `admin/panel.html`)

### Saat 2 — Ana sayfa (`admin/kutuphane.html`)

1. **Üst başlık:** "Kütüphane Envanteri" + alt-bilgi (toplam satır / hedef / %)
2. **5 metric kart** (G-02 Hero+Pill pattern):
   - Geometri: boru + fitting + flanş toplam / hedef
   - Malzeme: malzeme_kataloglari / 120
   - Uyum: fitting_malzeme_uyum / 8000
   - Özel parça: ozel_parcalar / ~350
   - Spec: tenant_spec_seti + spec_kural / ~765
3. **Gruplar halinde tablo listesi:**
   - GEOMETRİ → boru_olculer / fitting_olculer / flansh_olculer
   - MALZEME → malzeme_kataloglari
   - ÇAPRAZ UYUM → fitting_malzeme_uyum
   - ÖZEL PARÇA → ozel_parcalar
   - SPEC SİSTEMİ → tenant_spec_seti / spec_kural
4. Her satır:
   - Tablo teknik adı (mono font, `code` stili)
   - Türkçe etiket
   - Standart listesi (alt-yazı)
   - Sayım (canlı DB count) + hedef
   - Doluluk barı
   - `→` ikonu, tıklanınca detay sayfaya git

### Saat 3 — Hedef rakamlar markdown'dan fetch

1. `docs/KUTUPHANE-YUKLEME-TAKIP.md` markdown dosyasını fetch et
2. Parse: "Modül" tablosundaki `Beklenen` sütunu (Bölüm 1 — Özet)
3. Hedef sayıları metric kartlara + tablo satırlarına dağıt
4. Cache: ilk yüklemede fetch, sayfa içinde state'te tut
5. Hata yönetimi: markdown fetch fail olursa fallback olarak hardcoded değerler (geçici), uyarı toast

**Referans patern:** `docs/PANO-TASARIM.md` Sekme 1 — markdown parse mantığı zaten Pano'da var (24. oturumda). Aynı kodu yeniden kullan, kopyala/uyarla.

### Saat 4 — DB count sorguları

1. 8 tablo paralel `SELECT count(*)`:
   ```js
   const tablolar = [
     'boru_olculer','fitting_olculer','flansh_olculer',
     'malzeme_kataloglari','fitting_malzeme_uyum','ozel_parcalar',
     'tenant_spec_seti','spec_kural'
   ];
   const sayimlar = await Promise.all(
     tablolar.map(t => supa.from(t).select('*', { count: 'exact', head: true }))
   );
   ```
2. Skeleton + cascade UI pattern (devreler.html / kesim.html referansı — `_skShimmer`, `sk-bar`, `data-ci=`)
3. Sayımlar gelene kadar `—` göster, gelince in-place güncelle (skeleton kaldırılır)

### Saat 5 — Detay sayfa (`admin/kutuphane-detay.html`)

1. Query string'den `?tablo=X` oku
2. Metadata dictionary (8 tablo için):
   - Türkçe etiket
   - Standart açıklaması
   - Sütun haritası (hangi DB sütunu nasıl gösterilsin)
   - Filtre alanları (örn. flanş için: tip, sınıf, çap)
3. `SELECT * FROM X LIMIT 100 OFFSET Y` ile sayfalama (50-100 satır)
4. Arama kutusu (basit `ILIKE %text%` ana sütunlar üzerinde)
5. Filtre dropdown'ları (metadata'dan)
6. Salt-okunur tablo render (G-03 standartına uy)
7. **Eklerin sayısı kolonu** (henüz boş, 83'te `kutuphane_ekler` migration sonrası dolar) — kolon yapısı bugünden hazırlanır, sayı `0` olarak gösterilir
8. Satıra tıklayınca **popup** (modal): tek satır detay, tüm sütunlar, formatlanmış

### Saat 6 — Test ve temizlik

1. Tüm sayfaların super_admin haricinde erişilemediği teyit
2. Lint yeşil mi (`node .github/kontrol.js --self-test`)
3. i18n eksikleri kontrol (CI'da `tv()` çağrıları için anahtar var mı)
4. Manuel test:
   - Ana sayfa açılıyor, sayılar gerçek
   - Her tabloya tıklayınca detay açılıyor
   - Detay sayfada filtre, arama, popup çalışıyor
   - F5 ve doğrudan URL ile detay sayfaya gelmek çalışıyor

---

## Açık Sorular (82'de Cihat'a sorulacak)

1. **Sayfa başlığı dili:** "Kütüphane Envanteri" mi, "Parça Kütüphanesi" mi, başka bir isim mi? (Vizyon belgesi "fitting_kutuphane.html" demiş ama içeriği sadece fitting değil — "kütüphane" yeterli)
2. **Detay sayfa hedef sayı gösterimi:** Ana sayfada doluluk gösteriyoruz, detay sayfada da göstereyim mi? (örn. flanş detay açıldığında "20/800 = %2.5" üstte tekrar)
3. **Popup yerine ayrı sayfa:** Satır detayı popup'ta mı, yoksa üçüncü seviye sayfa (`admin/kutuphane-detay.html?tablo=X&id=Y`) mı? (popup daha hızlı, ayrı sayfa kalıcı URL'li — popup'tan başlayalım, ihtiyaç olursa ayrı sayfa)
4. **Excel export:** Salt-okunur ama Excel'e indirme butonu eklenebilir, küçük iş — ekleyelim mi?

---

## İkincil İşler (82'de zaman kalırsa)

- `kutuphane_ekler` migration **TASARIM** dosyası hazır, **kod 83'e** — ama Cihat isterse 82'de migration da yazılabilir (1-2 saat ek iş)
- 80'in açık borçlarına dönüş (commit `4bf1102`'den okunur, bu oturumun gündeminde yok)

---

## Kritik Hatırlatmalar (81'de yeni eklenenler)

- **MK-81.1:** Polimorfik etiketleme — yeni etiket kaynağı için ayrı tablo açma, enum genişlet
- **MK-81.2:** Olgunluk parça başına ölçülür (power law kabulü)
- **MK-81.3:** AI önerir, kullanıcı onaylar — otomatik etiket YOK
- **MK-81.4:** Lisans zorunlu, `belirsiz` paylaşıma terfi edemez

## Kritik Hatırlatmalar (52+ den, değişmedi)

- **`izometri-oku.js`'e DOKUNMA** (MK-49.1)
- **Hassas anahtar Claude'a verme** (MK-50.1)
- **MK-51.1:** Dosya kopyalamadan önce MD5 + satır sayısı doğrula
- **MK-52.1:** `arespipe_kopyala` fonksiyonu kullan, `cp` doğrudan KULLANMA
- **MK-52.2:** `gp` kullan (otomatik rebase + push), `git push origin main` YAZMA

---

## Süreç Disiplinleri

- **Heredoc yöntemi** dosya yazma için
- **`ls -la`** dotfile kontrolü
- **Vim açılırsa:** `Esc` → `:q!` → `Enter`
- **Çakışma çözümü:** `git checkout --ours <dosya>` (rebase'de HEAD = remote)
- **Vercel logs zaman dilimi:** UTC saklar, SQL'de `AT TIME ZONE 'Europe/Istanbul'`
- **DB sütun adı uyumsuzluğu:** `information_schema.columns` ile doğrula
- **Sadece terminal git** akışı

---

## R-10 (Mockup-First) Hatırlatması

82'de yeni mockup gerekmez — ana sayfa mockup'ı 81'de onaylandı. Ama implementasyon sırasında AresPipe CSS değişkenleriyle mockup'taki yapı **birebir** çıkarılmalı (5 kart + 5 grup + 8 satır + 4 sütun her satırda). Detay sayfa için mockup zaten yok — 82'de Cihat'a basit prose anlatılır, çok mockup'a gerek yok (standart liste sayfa pattern'ı, `devreler.html` referans).

---

## Veriyle Tasarım (82+ Vizyon)

Kütüphane sayfası canlıya alındıktan sonra:
- Cihat hangi tablolara daha çok bakıyor? (analytics gerekmez, organik)
- Doluluk hızı nasıl? Hangi parçalar manuel kalacak, hangileri otomatik dolu?
- Detay sayfada hangi filtre/arama en çok kullanılıyor?

Bu sinyaller 83+'ün önceliklendirilmesinde kullanılır:
- Çok kullanılan filtreler → daha iyi UX
- Az kullanılan tablolar → detay sayfa öncelik düşük
- Manuel kalan parçalar → 85+ etiketleme aracında UI önerisi

---

## 83+ Genel Yön

Tasarım belgesindeki implementasyon takvimi (Bölüm 11):
- **83:** `kutuphane_ekler` migration + detay sayfa "Ekler" sekmesi
- **~85-90:** `parca_etiketleri` migration + 3-pencere manuel etiketleme UI
- **~90-100:** `kutuphane_ogrenme_durumu` view + olgunluk badge
- **~3 ay:** Kanal 1 (kural-tabanlı öneri)
- **~6-12 ay:** Kanal 2 (embedding)
- **Tetik gelince:** STEP/Rhino entegrasyonu (vizyon Kategori C)
- **18+ ay:** Lazer, Kanal 3 fine-tune

---

## Bonus İşler (82'de zaman kalırsa)

- Dark mode + light-anthracite tema doğrulama (kütüphane sayfası)
- Mobil görünüm test (responsive — mockup desktop için çizildi ama AresPipe genel responsive)
- Sayfa açılış performansı: 8 paralel count ne kadar sürüyor? Yavaşsa materialized count tablosuna gerek var mı? (muhtemelen yok, ölçüye göre karar)

---

> 82. oturum açılışında Cihat'a ilk soru: **"Kütüphane envanter sayfasına başlıyoruz, başka konu var mı?"** Onaylanırsa Saat 1'den başlanır. Açık sorulardan (yukarıda 1-4) ilki implementasyon başlangıcında sorulur, gerisi sayfa ilerledikçe çıktığında.
