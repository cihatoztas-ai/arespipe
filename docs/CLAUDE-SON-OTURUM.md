# 100. Oturum — Devre Detay'da Belge Listesi UI 🎊

> **Tarih:** 19 Mayıs 2026
> **Tema:** Wizard yüklemelerini devre detay sayfasında görüntüleme — tree + arama
> **Süre:** ~5 saat (plan 1.5-3 saat, görsel + önizleme denemeleri ile uzadı)
> **Sonuç:** ✅ Devre detay'da iki kaynaklı, tree-yapılı, aranabilir belge listesi canlıda
> **Milestone:** AresPipe'ın 100. oturumu

---

## Açılış Durumu

99 wizard altyapısını kurdu, ama yüklenen 24 dosya `devre_dokumanlari`'nda görünmüyordu — devre detay sayfası `belgeler` (eski modal sistemi) tablosundan okuyordu. Pilot için yarım UX.

Cihat'ın 100 başlangıç tercihi: **"99'da kalan wizard işine devam ediyoruz."** Plan: önce belge listesi UI, sonra Excel parser.

99 sonu temizlik: `devre_dokumanlari` ve storage tamamen boştu, sadece `belgeler` tablosunda 1 gerçek kayıt (Sevk_Fisi_ITS26-063, AT110-Drencher-Galv devresine, 25 Nisan'da test sırasında yüklenmiş).

---

## Olay Sırası ve Karar Noktaları

### Faz 1 — DB Şema Keşfi ve Strateji

İlk önce **`belgeler` (eski) ve `devre_dokumanlari` (yeni) tablo şemalarını çıkardık**. Kritik farklar:
- Alan adları farklı: `ad` ↔ `dosya_adi`, `tur` ↔ `dokuman_tipi`, `dosya_url` ↔ `storage_yolu`, `olusturma` ↔ `yuklenme`
- `devre_dokumanlari` ek alanlar: `klasor_yolu`, `uzanti` (NOT NULL), `parse_durumu`, `versiyon`, `aktif`
- Storage bucket'ları farklı: `arespipe-dosyalar` (eski) vs `devre-belgeleri` (yeni)

Bu fark nedeniyle Cihat **iki sistemi paralel yaşatma stratejisi**ni netleştirdi: "Wizard çalışırsa eski modal'ı kaldırırız, çalışmazsa wizard'ı kaldırırız — şimdi seçmeyelim." (KARAR-100 stratejisi.)

**Sonuç mimari:** UI sadece **görüntü katmanı**, yazma akışları (modal + wizard) ayrı yaşar. Devre detay birleşik liste gösterir, sil-akışı `_kaynak`-aware.

### Faz 2 — İki Kaynaklı Belge Listesi Patch'i

Tek dosya değişikliği: `devre_detay.html`. 5 nokta:

1. **HTML**: tek liste yerine 2 grup blokları (📎 Doküman Ekle / 📁 Klasör Yükle)
2. **DOK_TURLER**: 4 tipten 11 tipe genişletildi (bom_excel, spool_imalat, 3d_pdf, sartname, akis_semasi, stp, rhino — eskisinden 7 yeni)
3. **`belgelerYukle()`**: `Promise.all` ile iki paralel SELECT, her kayda `_kaynak` etiketi
4. **`renderDokumanlar()`**: gruplu çıktı, her grup ayrı sayım
5. **`dokSil()`**: `_kaynak`-aware doğru tabloya UPDATE

Patch'in büyüklüğü: 162 satır eklendi, 18 silindi.

Commit: `90df065`.

### Faz 3 — Skeleton Çakışması (Beklenmedik Bug)

Patch sonrası devre detay'da Dokümanlar bölümünde **skeleton placeholder kaldı**. Console'da `belgelerListesi: false`, `grpBelgeler: false`.

İlk hipotez: cache. Cmd+Shift+R yetmedi. Yedek + lokal commit'i karşılaştırdık — **lokal ve HEAD birbirinin aynısı**, HTML doğruydu.

Asıl neden: satır 1153'teki `_skList('dokListesi', 3)` G-08 sayfa açılış ritüelinin parçası. Sayfa yüklenir yüklenmez `dokListesi.innerHTML = <skeleton...>` çağrılıyor → bizim 2 grup yapımızı eziyor → `renderDokumanlar()` sonra DOM'da `belgelerListesi` bulamayıp early return ediyor → skeleton sonsuza kalakalıyor.

**Seçenek C** seçildi: `_skList('dokListesi', 3)` satırı yoruma alındı. Skeleton-sız 100-200ms açılış kullanıcıya görünmez, sorun temiz çözüldü.

### Faz 4 — Klasör Tree (Cihat'ın Geri Bildirimi)

İlk wizard test yüklemesi (15 dosya) sonrası Cihat dedi:

> *"bence daha tam çalışmıyor. bu klasörün içinde 2 tane klasör var bu klasörler görünmüyor. tüm dosyalar karışık nasıl bulacaz aradığımızı"*

DB'de `klasor_yolu` doğru saklanmıştı (`AT110-Drencher-Galv/İzometri`, `.../Spool`) ama render düz listeydi. **3 seçenek sundum:**

- A) Tree (Finder hiyerarşisi)
- B) Filtre çubuğu
- C) Tree + arama kombine

Cihat: **A** seçti — "elimizdeki şekilde klasör yapısını görelim."

Patch: `renderDokumanlar()`'da wizard kayıtları için **recursive ağaç oluşturma + nodeHTML render**. Klasörler tıklanır, aç/kapa (`▾`/`▸`), state oturum boyunca korunur. Belgeler grubu düz liste kaldı.

Sayım rozeti: `3 (·15)` = bu klasörün direkt dosyaları + alt klasörler dahil toplam.

### Faz 5 — Arama (Cihat Beğendi, B'ye Geçtik)

> *"süper çalışıyor ama senden birşey daha rica etsem yapar mısın..."*

Bu aşamada Cihat **B planı**'na geçmeyi onayladı:
- B.1 Arama
- B.2 Slugify kozmetik
- B.3 Kapanış

Arama patch'i: dokListesi başına `<input>` kutusu, **≥8 dosyada otomatik görünür** (eşik). Filtre: dosya adı + klasör yolu + tip. Match olan klasörler otomatik açık (drill-down kaldırır). Debounce 150ms, temizle butonu, sonuç sayısı metni.

Sayım badge'leri filtreye göre güncellenir: `(4/15)` formatı.

### Faz 6 — Önizleme Modal (İki Deneme, Revert)

Cihat sordu: *"buradaki dosyalara önizleme de ekleyebilir miyiz?"*

Önce tartıştık:
- Hangi formatlar mümkün?
- SheetJS zaten yüklü mü? → Evet, Excel önizlemesi mümkün
- Sayfa performansına etki?
- "Önizlenemiyen formatlar bloklansın" yaklaşımı

Plan: PDF (iframe), IMG (img), TXT (fetch + pre), Excel (SheetJS sheet_to_html), diğerleri için "indirin" mesajı.

**Patch v1 (patch-100e-onizleme.py):**
- 358 satırlık Python script
- Modal HTML + dokOnizle fonksiyonu + satır onclick + ↗ stopPropagation
- Sonuç: `Uncaught SyntaxError: Invalid or unexpected token` @ satır 2892
- **Sebep:** Python heredoc içinde JS string oluştururken `\\'` escape karmaşası

**Patch v2 (patch-100f-onizleme-v2.py):**
- ↗ butonu kaldırıldı (modal'da var)
- DOM API (createElement) + event delegation kullanıldı, inline string concat azaltıldı
- Python raw string `r'''` ile Unicode escape sorunu giderildi
- `node --check` ile JS syntax önceden doğrulandı, geçti
- Sonuç: **YİNE syntax error** @ satır 3010, farklı bir noktada

İkinci başarısızlık sonrası Cihat: *"yapmasaydık keşke bozduk sanki :("*

**Karar:** Revert. `cp` ile yedekten geri al, commit `revert(100): onizleme patch geri alindi (syntax bug)`.

Bu **doğru karardı** — saat geç, önizleme tek başına bir oturum hak ediyor, bugünün diğer kazanımları zaten somut.

### Faz 7 — Mimari Konuşmalar (Paralel)

Cihat oturum boyunca 3 önemli mimari soru sordu, hepsine cevap verdik:

**1. İzometri Batch Sayfası Geleceği:**
- Wizard ana akış, batch sayfası "Uygulamalar" altında alternatif/güç-kullanıcı aracı olarak kalır
- KARAR-100.A: Her iki UI da **aynı kuyruğa yazar**, tek parser endpoint çalışır
- Format öğrenme iki kaynaktan beslenir

**2. `izometri-oku.js` Bölünmesi:**
- 101'de kuyruk wrapper yazılırken doğal zaman
- Hedef yapı: `api/izometri-oku.js` (dispatcher) + `api/parsers/aveva-paor.js`, `aveva-e3d.js`, vb.
- MK-49.1 ihlali değil — iç davranış aynı, dosya organizasyonu değişiyor

**3. Vanilla JS Uzun Vade Endişesi:**
- Cihat: "5 yıl sonra desteklenmez denirse ne yaparız?"
- Cevap: Vanilla = web standardı = eskimez. Asıl risk **framework**'lerde (Vue 2→3 gibi)
- Topyekun rewrite gerekmez, parça parça modernleşme (Alpine.js, Lit gibi mikro-framework'ler tek-tek sayfalara eklenebilir)
- Bugün buradayız çünkü vanilla seçildi — React'la 50. oturumda olurduk

**Bonus:** Sayfa parçalama stratejisi (3500+ satıra ulaşan dosyalar için Yöntem 1 — `<script src=...>` ile JS ayrımı). 105+ borcuna eklendi.

---

## Süre Dağılımı (Yaklaşık)

- Açılış ritüeli + DB keşfi + plan: 30 dk
- Faz 2 patch (iki kaynaklı liste): 45 dk
- Faz 3 skeleton bug + fix: 30 dk
- Faz 4 tree render patch + test: 40 dk
- Faz 5 arama patch: 35 dk
- Faz 6 önizleme deneme v1 + v2 + revert: 90 dk (en uzun, en az verimli)
- Faz 7 mimari konuşmalar (paralel, dağınık): 30 dk
- Kapanış belgeleri: 30 dk

**Toplam:** ~5 saat (gerçek), 1.5-3 saat (plan). Önizleme denemeleri %30 zaman aldı, geri alındı. Faz 7 konuşmalar 101+ için zemin hazırladı, vakit kaybı değil.

---

## Anlamlı Anlar

- **Tree görünümü onaylanma anı:** Cihat 15 dosyalı klasör + alt klasörler tree render'ı görünce *"süper çalışıyor"* dedi. Bu wizard'ın gerçek değer noktası — Finder/dosya sistemi kavramının web'de yansıması.
- **"Vanilla eskimez" konuşması:** Cihat haklı bir endişe taşıyordu, cevap onu rahatlattı. Bu konuşma 101+ oturumlarda da geçerli kalır.
- **Cihat'ın disiplini:** İki kez önizleme patch fail edince *"yapmasaydık keşke bozduk sanki :("* dedi. Bu duygusal değil — geri al kararı hemen sonra onaylandı, AresPipe'ın "yavaş yavaş doğru yap" felsefesi tam burada işledi.
- **MK-100.2 yazımı:** "Python heredoc ile JS patch" anti-pattern'i 100'de iki kez yenildi. Bu artık yazılı, 101+'da kaçınılır.

---

## Eklenen Mimari Kararlar (MK)

- **MK-100.1:** İki kaynaklı UI deseni — eski + yeni sistem paralel yaşar, UI birleşik gösterim
- **MK-100.2:** Python heredoc + JS patch = anti-pattern. Alternatif: küçük str_replace, ayrı .js dosyası, DOM API
- **MK-100.3:** Tree render state oturum-içi global (`window.DOK_TREE_ACIK`), DB persist yok
- **KARAR-100.A:** Wizard + İzometri Batch ortak kuyruk mimarisi

---

## Çıkarılan Dersler (101+ Claude'lar için)

1. **DB şemasını ön-keşif:** Yeni tabloya yazmadan önce `information_schema.columns` SELECT zorunlu. 100'de `tip` kolonu varsayımı patladı, MK-98.1 ihlal edildi → düzeltildi.

2. **Skeleton + yeni HTML çakışması:** G-08 ritüelinde `_skList('xxx', N)` bir elementin tüm innerHTML'ini ezer. Eğer o element içine sonradan dinamik yapı koyacaksak, skeleton'ı o element için **kapatmak veya inner yapıya enjekte etmek** gerekir.

3. **Python heredoc + JS patch fragility:** Inline string concat ile JS üretmek `\\'` escape karmaşası getirir. **`r'''...'''` raw string** Unicode sorununu çözer ama tek tırnak escape'i çözmez. DOM API + ayrı .js dosyası tek temiz yol.

4. **Patch validation:** `node --check` JS syntax doğrular ama HTML/JS sınırı bağlamını **doğrulamaz**. Patch sonrası **mecburi** browser console testi.

5. **Pilot strateji = iki sistem paralel:** Eski + yeni sistem paralel yaşatma riski düşük (kayıt sayısı eski sistemde fiilen 1, yeni sistemde 15). Pilot kullanım sonrası karar net olur. Erken birleştirme yapma.

6. **Cihat'ın UX feedback'i %20 görünür, %80 derin:** "Çalışıyor" dese bile detaylı bakınca eksik bulur (klasör görünmüyor, arama yok vb). Bu yüzden teslim sonrası **birlikte 5-10 dk gerçek kullanım** geçirmek değerli.

7. **Saat geç olunca patch denemesi pahalı:** Faz 6'daki iki yeniden yazım 90 dk yedi, hiçbir kalıcı kazanım sağlamadı. **Yorulduktan sonra revert + sonraki oturum** daha verimli.

---

## 101 Gündemine Mektup

Sevgili 101 Claude'u,

100 wizard'ın UX'ini gerçekten tamamladı — Finder gibi klasör görünümü, arama, iki sistem paralel. Pilot için canlıda hazır.

**101'in 3 işi var, sırayla:**

1. **Önizleme modal v3** (~1 saat) — 100'de iki kez yenildik. Bu sefer farklı:
   - **`devre_detay.html`'in içine yazma**, ayrı `js/dok-onizle.js` dosyası oluştur
   - DOM API kullan (`createElement` + `appendChild`), inline string concat YAPMA
   - Python heredoc patch YAPMA, dosyayı doğrudan yaz
   - SheetJS Excel için zaten yüklü, kullan
   - PDF (iframe), IMG (img), TXT (fetch + pre), Excel (sheet_to_html), diğeri "indir"

2. **Excel generic parser** (~2 saat):
   - L1 sözlük match (kolon adı eşleştirme)
   - L2 pattern (başlık satırı bul)
   - L3 Haiku fallback **102+'a ertelendi** — şimdilik L2 başarısız olursa manuel onay
   - Yeni endpoint `api/kuyruk-isle-excel.js`
   - `pipeline_malzemeleri` tablosuna INSERT
   - **MK-50.3 disiplini:** En az 3 farklı format dosyasıyla test et (Donatım, IFS, Tutanak)

3. **İzometri parser wrapper** (~1.5 saat):
   - `api/kuyruk-isle-izometri.js` (yeni)
   - Mevcut `api/izometri-oku.js`'i HTTP POST ile çağırır (in-process import değil — port izolasyonu)
   - Eğer zaman elveriyorsa `parsers/aveva-paor.js` taşıması da başlat
   - **KARAR-100.A:** Wizard ve izometri-batch.html aynı kuyruğa yazsın

**Önce önizlemeyi yap** — küçük iş, hızlı kullanıcı değeri. Sonra parser'ları (yoğunluk gerektirir).

**MK-100.2'yi unutma:** Python heredoc + büyük JS = bug. Patch script yerine direkt dosya yaz. Veya küçük str_replace ile parça parça.

**KARAR-100.A'yı netleştir:** Wizard `parser='izometri-oku'` yazsın, batch sayfası `parser='izometri-oku'` yazsın, tek wrapper tüketsin.

Açık borç listesi `son-durum.md`'de uzun. 105+ için `devre_detay.html` parçalama ufukta. **Önizleme modal'ı ayrı dosya olarak başlatırsan** o parçalamanın ilk adımı atılır.

**Görsel polish** Cihat'ın istediği bir şey ama 101'de değil. Wizard akışı tamamlanınca (~104 sonrası) tek bir oturum buna ayrılabilir.

İyi çalışmalar.

— 100 Claude
