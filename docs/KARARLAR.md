# AresPipe — Karar Günlüğü

> **Proje boyunca alınan kararların tek kanonik adresi.**
>
> "MK-50.3 neydi?" sorusuna **tek tıkla** cevap. Eskiden bu bilgi `son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` üçüne dağılmıştı; bu dosya doğunca tekrarlar silindi.
>
> **Yaşayan dosya** — her oturum kapanışında o oturumun kararları **eklenir**, eski kararlar **dokunulmaz**. İptal edilen kararlar silinmez, `[IPTAL]` etiketi alır.

---

## Numaralandırma Sistemi

`MK-{oturum_no}.{sira}` formatı.

- **"MK"** = "Mimari Karar" — geniş anlamda. Disiplin, sistem mimarisi, ürün, vizyon, refactor — hepsini kapsar.
- **Oturum numarası** kararın alındığı oturumdur.
- **Sıra** o oturum içinde kaçıncı kararın olduğunu gösterir.

Cihat ve Claude konuşmada "MK-50.3" diyince hızla bu dosyada bulunur.

## Kategori Etiketleri

Her kararın yanında köşeli parantezde bir etiket:

- `[DISIPLIN]` — Süreç ve çalışma kuralları (dosya kopyalama, push akışı, ritüel)
- `[MIMARI]` — Sistem mimarisi (DB yapısı, API, kod organizasyonu)
- `[URUN]` — Özellik kapsam kararları
- `[VIZYON]` — Uzun vade yön belirleyen kararlar
- `[REFACTOR]` — Mevcut kodu değiştirme kararları
- `[IPTAL]` — İptal edilmiş karar (üstüne yenisi geldi, tarihsel kayıt için duruyor)

## Bağlantılı Tematik Dosyalar

Bazı konuların **kendi karar dosyaları** var. Bu dosyaya kopya değil **referans**:

- İzometri batch kararları (K1-K14): `docs/IZOMETRI-BATCH-KARAR.md`
- L2 parser detayları: `docs/L2-PARSER-NOTLARI.md`
- Sistem mimarisi gerekçeleri: `docs/ARCHITECTURE.md` (Bölüm 9 — Tasarım Kararları)
- Pano tasarımı: `docs/PANO-TASARIM.md` (24. oturum implementasyon planı, tarihsel)
- Yol haritası: `docs/ROADMAP.md` (Faz B/C planı, tarihsel)

---

## Kronolojik Karar Listesi

### 49. Oturum

#### MK-49.1 [DISIPLIN] — `izometri-oku.js`'e dokunulmaz

**Karar:** L2 ve diğer iyileştirmeler ayrı dosyalara yazılır (`lib/l2-parser.js` gibi). `api/izometri-oku.js` yalnızca **minimum, ilgili noktada** değiştirilir.

**Sebep:** 47. oturumun self-test felaketi — 1206 satır handler'a yapılan parça müdahale beklenmedik regresyona yol açtı. Büyük dosyaya tek dokunuş = bilinmeyen alanları kırma riski.

**Geçerlilik:** ✅ Aktif.

---

### 50. Oturum

#### MK-50.1 [DISIPLIN] — Hassas anahtar paylaşım disiplini

**Karar:** Service_role JWT, API anahtarları, secret token'lar Claude'a paylaşılmaz. Script terminale env değişkeni manuel alır, Claude'a sadece çıktı gönderilir.

**Sebep:** Anahtar tek hat olmalı: Vercel/Supabase Dashboard → Mac terminal → script process. Sızıntı durumunda anında reset + cache'siz redeploy yapılır.

**Geçerlilik:** ✅ Aktif.

#### MK-50.2 [MIMARI] — Image-PDF formatları için L2 imkansız

**Karar:** PDF text layer'ı boş olan formatlar (PAOR/AVEVA E3D vb.) için L2 deterministik parser yazılmaz. Bu formatlar **L1 (cache) + L3 (vision AI)** ile çalışır.

**Sebep:** PAOR Ana Çizim PDF'inde `pdf-parse` yalnızca 2 karakter çıkarıyor. AI vision OCR ile parse ediyor. L2 sadece text-PDF formatlarda mantıklı.

**Geçerlilik:** ✅ Aktif.

#### MK-50.3 [DISIPLIN] — Yeni format için parser_kural yazmadan önce 3+ başarılı AI örneği

**Karar:** Bir formatın `parser_kural`'ı (regex'leri) yazılmadan önce o formattan en az 3 başarılı L3 (AI) parse'i alınmalı.

**Sebep:** Az örnekle yazılan kural pattern'leri gerçek varyasyonu kapsamayabilir.

**Geçerlilik:** ⚠️ MK-51.2 ile genişletildi (3 → 5 örnek). Yeni kararla MK-50.3 tarihsel kayıt olarak duruyor.

#### MK-50.4 [DISIPLIN] — Dotfile dosya adı kontrolü

**Karar:** `.gitignore`, `.env` gibi dotfile'lar oluşturulduktan sonra `ls -la` ile gizli dosya listesinde göründüğü doğrulanır.

**Sebep:** 49'da yazılan `.gitignore` aslında `gitignore` (nokta yok) olarak kayıtlandı, 1 oturum boyunca işe yaramadı.

**Geçerlilik:** ✅ Aktif.

---

### 51. Oturum

#### MK-51.1 [DISIPLIN] — Dosya kopyalama protokolü (3 adım)

**Karar:** `~/Downloads`'tan projeye kopyalamadan önce: (1) eski sürümü `~/Downloads/_arsiv/` klasörüne taşı, (2) MD5 + satır sayısı doğrula (Claude'un verdiği hash ile eşleşmeli), (3) sonra `cp`.

**Sebep:** 51'de `~/Downloads/izometri-oku.js` adında 3 farklı sürüm karıştı, "Add files via upload" akışı kontrolden çıktı.

**Geçerlilik:** ⚠️ MK-52.1 (`arespipe_kopyala`) ile otomatize edildi. Manuel protokol artık **fallback** (zsh fonksiyonu yoksa).

#### MK-51.2 [DISIPLIN] — Parser_kural regex'leri 5+ örnekle test edilir

**Karar:** Bir `parser_kural` regex'i yazıldıktan sonra en az **5 farklı gerçek dosya** ile test edilir, hepsinde eşleştiği doğrulanır.

**Sebep:** MK-50.3'ün genişletilmesi. 3 örnek yetersizdi — 50'de yazılan `dosya_adi_regex` kendi örnek dosyalarıyla bile eşleşmiyordu (sessiz fail).

**Geçerlilik:** ✅ Aktif. MK-50.3'ün yerini aldı.

#### MK-51.3 [DISIPLIN] — DB log şeması uyumluluk kontrolü

**Karar:** Yeni kod yolu eklerken (özellikle `parseSonuc`'a yeni alan) DB log şemasında o alanın yazılıp yazılmadığı kontrol edilir.

**Sebep:** `_l2_meta` ve `_l2_fallback` kullanıcıya gidiyordu ama `ai_api_log.cevap_full` sadece AI parse JSON'u taşıdığı için DB'ye yazılmıyordu — görünürlük kayboldu.

**Geçerlilik:** ✅ Aktif. (Çözümü 52/53'te yapılacak.)

#### MK-51.4 [DISIPLIN] — DB schema değişikliğinde kod taraması

**Karar:** DB schema değişikliği (sütun adı, tablo adı, tip) yapılırken kod tarafında SELECT/INSERT cümleleri grep'lenir, eski adları kullanan yerler düzeltilir.

**Sebep:** `boru_olculer` sütun yeniden adlandırma 5+ ay önce yapıldı, kod hâlâ eski adları kullanıyordu — `[boruEtTolerans] hata` her PDF'te logluyordu.

**Geçerlilik:** ✅ Aktif.

---

### 52. Oturum

#### MK-52.1 [DISIPLIN] — `arespipe_kopyala` zsh fonksiyonu

**Karar:** `~/Downloads`'tan projeye dosya kopyalama için `arespipe_kopyala` zsh fonksiyonu kullanılır. MD5 doğrulamalı kopyalar, yanlış sürümü reddeder.

**Kullanım:**
```bash
arespipe_kopyala ~/Downloads/dosya.js ~/Desktop/arespipe/api/dosya.js <BEKLENEN_MD5>
```

**Sebep:** macOS Downloads'un `(1)`, `(2)` ekleme problemi. 15+ oturum boyunca yanlış dosya kopyalama yaşandı, her seferi 30+ dakika düzeltme + yanlış push.

**Geçerlilik:** ✅ Aktif. MK-51.1 manuel protokolü fallback.

#### MK-52.2 [DISIPLIN] — `gp` zsh fonksiyonu

**Karar:** `git push origin main` yerine `gp` kullanılır. Önce origin fetch + rebase yapar, sonra push eder. Conflict olursa abort eder, kullanıcıya bildirir.

**Kullanım:**
```bash
git add ... && git commit -m "..." && gp
```

**Sebep:** GitHub Actions'ın `[skip ci]` commit'leri yüzünden manuel `git pull --rebase` her oturumda 5+ kez gerekiyordu, akışı bozuyordu.

**Geçerlilik:** ✅ Aktif. `git push origin main` artık doğrudan kullanılmaz.

#### MK-52.3 [DISIPLIN] — Açılış ritüeli sadeleştirme (5 → 2 madde)

**Karar:** Oturum başlangıç ritüeli 2 maddeye indirildi: (1) `git pull && git status && git log` çıktısı, (2) "bugün ne yapmak istiyorsun?". Eski 5 maddeli ritüel (CI rengi sorma, geri bildirim sayısı sorma, "bugün hangi sayfa") atıldı.

**Sebep:** Bilgi vermeyen adımlar kullanıcıyı yoruyordu. CI durumu zaten `son-durum.md`'de, geri bildirim genelde 0, "hangi sayfa" gündem konuşulunca çıkıyor.

**Geçerlilik:** ✅ Aktif. `CLAUDE.md`'de tanımlı.

#### MK-52.4 [MIMARI] — Knowledge ↔ repo bağlantısı

**Karar:** Claude project knowledge'ı GitHub repo'ya bağlandı. Repo'daki tüm dosyalar push sonrası knowledge'a otomatik indekslenir. Manuel dosya yükleme akışı sona erdi.

**Sebep:** Eskiden her oturum sonunda 3 özet dosyası manuel olarak Files'a yükleniyordu. Tek doğru kaynak yoktu, senkron riski vardı, bağlam dardı (5-10 dosya). Şimdi 40+ web sayfa + tüm `docs/` + `migrations/` + `.github/` indexli.

**Geçerlilik:** ⚠️ MK-56.2 ile **revize edildi**. 56'da kanıtlandı: indekleme gecikmesi öngörülemez (1-2 dakika değil, saatler olabiliyor — Anthropic'te açık ticket'lar var). Birincil bağlam aktarım yöntemi artık `cat BRIEFING.md` çıktısının yapıştırılması; project knowledge yedek katman.

---

### 53. Oturum

#### MK-53.1 [DISIPLIN] — KARARLAR.md doğdu: tek kanonik karar adresi

**Karar:** Tüm proje kararları artık tek dosyada — `docs/KARARLAR.md`. Kararlar oturum sırasıyla, `MK-{oturum}.{sira}` formatında numaralandırılmış, kategori etiketli olarak listelenir.

**Sebep:** MK kuralları üç dosyada tekrar ediyordu (`son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md`). "MK-50.3 neydi?" sorusunda hangisinin güncel olduğu belirsizdi. Cihat 53'te şikayet etti: *"sohbette aldığımız kararları geri dönüp bulamıyorum"*.

**Bu kararla birlikte:**
- `son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` üçündeki MK listeleri **silinir**, yerine "Detay: KARARLAR.md" referansı kalır.
- `CLAUDE.md`'deki MK-52.1/52.2 detayları kalabilir (komut kullanım disiplini orada okunmaya devam eder), ama "tanım kaynağı" KARARLAR.md olur.

**Geçerlilik:** ✅ Aktif. 53. oturumun ilk kararı.

#### MK-53.2 [DISIPLIN] — Terminal komut çıktı disiplini

**Karar:** Tek seferde birden fazla dosyanın içeriğini ekrana basan komutlar (`for f in ...; do cat "$f"; done` gibi) doğrudan kullanılmaz. Sebep: terminal çıktısı şişer, komutun başlangıç noktasını bulmak güçleşir, sohbete yapıştırınca okunabilirlik düşer.

**Onun yerine:**
- Dosya başına ayrı komut bloğu kullan
- Ya da öne özet komutu ekle (`wc -l`, `head -3`, `ls -la`)
- Tek seferde toplu çıktı şart ise `>` ile dosyaya yönlendirip sadece dosya yolunu sohbete ver

**Sebep:** 53'te `for f in ...; cat "$f"; done` komutu üç dosyayı zincirleyince Cihat "komutun başladığı yeri bile bulmak zor" diye şikayet etti. Haklıydı.

**Geçerlilik:** ✅ Aktif. Claude bu desende toplu komut yazdığında durup yeniden tasarlamalı.

#### MK-53.3 [DISIPLIN] — Dökümantasyon revizyonu: YAŞAR / ÖLÜR / UYUR

**Karar:** Her döküman üç kategoriden biri olmalıdır:

- **YAŞAR** = Net rolü + net tetikleyicisi + sahibi olan dosya. Her oturum kapanışında ilgiliyse güncellenir.
- **ÖLÜR** = Hedef tarihi/oturumu geçmiş, sonuç başka yerde yaşıyor olan dosya. `docs/arsiv/`'e taşınır, başına `> ⚠️ ARŞİV — DONDURULDU` damgası vurulur. Silinmez (tarihsel kayıt), ama Claude "güncel bilgi kaynağı" olarak okumaz.
- **UYUR** = Aktif değil ama ileride uyanacak modül için bekleyen dosya. `docs/uyku/`'ya taşınır, üzerinde `> ⏸ UYKU MODU` damgası olur.

**"Yaşar" dosya kabul edilmesinin üç şartı** (üçü birden olmalı): rol netliği, tetikleyici netliği, sahip belli (Cihat veya Claude'un anında müdahale ettiği konu).

**Bu kararla birlikte 53'te yapılanlar:**
- `docs/ROADMAP.md` ÖLDÜ — `docs/arsiv/ROADMAP-faz-b-c.md` adıyla arşivlendi, içeriği `docs/PROJE-HARITASI.md`'ye emildi.
- `docs/PANO-TASARIM.md` ÖLDÜ — `docs/arsiv/PANO-TASARIM-24-oturum.md` adıyla arşivlendi.
- `docs/PROJE-HARITASI.md` doğdu (referansı CLAUDE.md ve CLAUDE-CALISMA-MODU.md'de zaten vardı, dosyanın kendisi yoktu).
- `CLAUDE-MOBILE.md` UYKU sayılmadı, "yarı aktif" kalır — mobil 55+ oturumda yoğun başlayacak.

**Sebep:** Cihat 53'te şikayet etti: *"yakışıklı hazırlanmış cafcaflı dosyalar düzenleyip kenara atmak istemiyorum. ya canlı tutamayacağımız dosyalar olmasın ya da hiç olmasın. ben nasıl olsa kaydettik diye güveniyorum, aradan 20 oturum geçmiş, ortada çoktan ölmüş dosyalar var. olmadığını bilsem önlem alırım. şu anki durum en kötü şey."* Bayatlamış dosyalar gerçekten zarar vermişti — sapmış sürümlere güveniliyordu.

**Geçerlilik:** ✅ Aktif. Yeni döküman doğmadan önce hangi kategoride olacağı kararlaştırılır.

#### MK-53.4 [DISIPLIN] — PROJE-HARITASI canlılık disiplini

**Karar:** `docs/PROJE-HARITASI.md` her oturum kapanışında **mutlaka** taranır. O oturumda etkilenen modül satırı güncellenir (Aşama yüzdesi, Son Durum kısa metni, Sonraki Adım). Etkilenmediyse dokunulmaz, ama tarama atlanmaz.

**Yeni bir modül doğunca** ilgili gruba yeni satır eklenir.

**Aşama tahminleri yanlışsa** Cihat anında düzeltir, Claude güvenle kabul eder. Yanlış aşama tehlikeli değildir çünkü dosya yaşıyor — bir sonraki oturumda kendiliğinden temizlenir.

**Sebep:** 53'te kuruldu. PROJE-HARITASI'nın ölmemesi için kapanış protokolüne bağlanması şart. ROADMAP ve PANO-TASARIM'ın öldüğü düşünüldüğünde (kimse güncel tutmadı), bu disiplin olmadan PROJE-HARITASI da aynı kaderi paylaşır.

**Geçerlilik:** ✅ Aktif. 53'ten itibaren her oturum kapanışı.

#### MK-53.5 [DISIPLIN] — Etki taraması (sohbet içi anlık karar yakalama)

**Karar:** Sohbet sırasında bir karar alındığında Claude bunu **kapanışı beklemeden anında** ilgili yaşayan dosyaya işler. Eğer dosyaya o anda yazmak akışı bozacaksa en azından "[KARAR-53.X] ...... — `docs/X.md`'ye yazılacak" diye sohbet içinde işaretler ki kapanışta hiçbir karar kaybolmasın.

**Etiketleme formatı:** Sohbet içinde net karar alındığında `[KARAR-{oturum}.{sira}]` etiketi konur. Bu etiket KARARLAR.md'ye işlenirken kullanılır.

**Sebep:** Cihat-Profil'de yazılı: *"Cihat değerli bir şey söylediğinde (vizyon değişikliği, mimari karar, karakter notu, gözlem), oturum sonunu bekleme. **O anda** sor: 'Bunu CIHAT-PROFIL.md veya VIZYON dosyasına eklememiz gerek. Ekleyelim mi?' Sonra **o anda** ekle. Bekleme. Aksi halde değerli içerik kaybolur — Cihat'ın bizzat şikayet ettiği konu bu."* Bu kural CIHAT-PROFIL'de yaşıyordu ama KARARLAR'a düşmemişti — şimdi resmi karar.

**Geçerlilik:** ✅ Aktif.

---

#### MK-54.A [VIZYON] — Mobile = web'in light versiyonu

**Karar:** Mobile uygulaması web'in tüm özelliklerini değil, **light versiyonunu** sunar. İçerik:
- **Saha kullanıcısı için:** Veri girişi (kesim/büküm/markalama kaydet, fotoğraf ekle, QR oku, not gir)
- **Ofis kullanıcısı için:** İzleme (devre listesi, spool detayı, KK durumu, sevkiyat durumu, raporlar)
- **Hiçbir zaman dahil olmayacak:** Üretim ekranları (devre tanımlama, IFS import, izometri batch yükleme, kesim wizard'ı, malzeme havuzu yönetimi)

**Sebep:** 54'te Cihat'ın açtığı vizyon konuşmasında çıktı. "Mobile büyük olabilir mi?" sorusuna verilen yanıt: büyük ≠ kötü, ama büyük + bakımsız = felaket. Web'de 40 sayfa var, mobile bunların light alt-kümesi olur. Üretim ekranları zaten masaüstü merkezli (devre tanımlama 3225 satırlık spool_detay'a bakıyor — telefonda anlamsız).

**Geçerlilik:** ✅ Aktif. Yeni mobile ekranı önerildiğinde "bu üretim mi izleme mi?" sorusu sorulur, üretimse reddedilir.

#### MK-54.B [DISIPLIN] — Web öncül, mobile follower

**Karar:** Yeni özellik **önce web'de** doğar, sonra mobile'a yansıtılır. Mobile-only özellik **eklenmez**. Web'de olmayan bir şey mobile'a önerilince reddedilir veya önce web'e tasarım yapılır.

**Pratik etki:** Bakım yükü tek yönlü. Web'de yeni filtre eklenirse mobile'a da gelir; mobile'da yeni filtre denemek istersen önce web'de kur.

**Sebep:** Tek geliştirici (Cihat + AI), iki platformun bakımı paralel zor. 5 hafta atalet bunun kanıtı: web hızla evrildi (devre/spool/IFS/izometri batch refactor'ları), mobile geride kaldı çünkü bağımsız evrilme baskısı yoktu. Tek-yönlü akış disiplini bunun tekrarını önler.

**Geçerlilik:** ✅ Aktif. Mobile için yeni özellik istendiğinde "web'de var mı?" ilk kontrol.

#### MK-54.C [VIZYON] — Vanilla mobile referans, kopyalanmaz

**Karar:** 16 Nisan öncesi yazılan vanilla mobile (`mobile.zip`, 7 HTML sayfası) **referans olarak korunur**, **kopya/port edilmez**. Yeni React M ekranları yazılırken:
- **Tasarım/UX kararları** vanilla'dan alınır (sayfa yapısı, sekme düzeni, kart pattern'leri, tipografi, navigasyon — yıllık iş, atılmaz)
- **DB sorguları** web'in **bugünkü** halinden alınır (vanilla 5 hafta önceki şemayla yazılmış, kopyalamak ölü iş)
- **i18n anahtarları** web'le paylaşılan `lang/*.json`'dan kullanılır (MK-54.D ile birlikte)

**Pratik etki:** Vanilla'da olan ama React'te olmayan bir şey görüldüğünde "atalım mı" değil, "neden vardı, ne işe yaradı, React'te nasıl olmalı" sorusu sorulur.

**Sebep:** 5 hafta önceki vanilla tasarımı **tamamen değersiz değil** — Cihat'ın o zamanki UX kararları olgun (PWA hazır, drawer mantıklı, 6-aşama timeline, K/B/M chip'leri). Bunları sıfırdan icat etmek hata. Ama 5 haftadır web evrildi, DB değişti — kod kopyalamak da hata.

**Geçerlilik:** ✅ Aktif. Mobile React ekranı yazılırken vanilla referans dosya açılır, web'in güncel sayfası açılır, ikisinin sentezi yapılır.

#### MK-54.D [ALTYAPI] — Mobile prebuild pattern (web lang/ paylaşımlı)

**Karar:** Mobile React projesi `lang/*.json` dosyalarını **kendi tutmaz**. Repo kökündeki `lang/`'dan **build aşamasında otomatik kopyalanır.**

**Uygulama:**
- `mobile/package.json` scripts:
  - `prebuild`: `rm -rf src/lang && mkdir -p src/lang && cp ../lang/*.json src/lang/`
  - `predev`: `npm run prebuild`
- npm convention gereği `prebuild` her `npm run build` öncesi otomatik çalışır
- `predev` her `npm run dev` öncesi çalışır → lokal geliştirmede de güncel
- `mobile/.gitignore`'da `src/lang/` var (auto-generated, repo kirletmez)
- Vercel deploy'da `npm run build` çalıştığında prebuild otomatik tetiklenir

**Pratik etki:** Anahtar tek yerde tutulur (`/lang/tr.json` 1659 anahtar), web ve mobile aynı dosyayı kullanır. Yeni anahtar eklenince **bir kez** ekle, hem web hem mobile alır. Çift bakım yok.

**Sebep:** 54'te keşfedildi: `mobile/src/lib/i18n.jsx` profesyonelce kuruldu ama 3 import edilen JSON dosyası **yoktu**. Yarım iş. Prebuild pattern bu boşluğu tek-kaynak ile kapatır, gelecekte de aynı yarım kalmamasını garanti eder.

**Geçerlilik:** ✅ Aktif. Mobile build/dev her zaman bu pattern üzerinden çalışır.

#### MK-54.E [TASARIM] — MSpoolDetay sekme yapısı (3 sekme, 3D yok)

**Karar:** MSpoolDetay.jsx **3 sekme** içerir: **Genel** + **Malzeme** + **İşlem Kayıtları**.
- **3D Model sekmesi YOK.** Web'deki 3D doğruluk problemi çözülene kadar mobile'a eklenmez.
- **Malzeme sekmesi salt-okur.** Tablo (malzeme/kalite/çap/et/boy) görüntülenir, satıra tıklanmaz, kütüphane kaydı detayı açılmaz.
- **Belgeler bölümü** Genel sekmesi içindedir (PDF listesi, tıklama eksik — Storage signedUrl borç kalır).
- **Geri bildirim FAB** sayfanın sağ-alt köşesinde, tüm sekmelerde görünür.

**Sebep:**
- 3D olgunlaşmamışken sahaya yanlış görsel vermek **fire üretir**. Personel ekrandaki yanlış spool şekline güvenip yanlış büküm yapar.
- Malzeme tıklama mobile'da değer üretmez (kütüphane sertifikası vs masaüstü işi). Tıklama açılırsa tasarım bütünlüğü bozulur, scroll cehennemi gelir.
- Vanilla'da 4. sekme "3D Model" placeholder vardı (`🧊 yakında`) — kullanıcı tıklar, hayal kırıklığı yaşar, sayfaya güveni azalır. Boş söz vermek > söz vermemek.

**Geçerlilik:** ✅ Aktif. 3D olgunlaştığında MK kararla yeniden değerlendirilir (tahmini 56-58. oturumlar).

#### MK-54.F [TASARIM] — MSpoolDetay tipografisi (kompakt + okunur)

**Karar:** MSpoolDetay sekmelerinde **vanilla'nın tek-satır key-value yapısı korunur**, sadece okunabilirlik düzeltmeleri yapılır:

| Element | Eski (vanilla) | Yeni (MSpoolDetay) |
|---|---|---|
| Topbar yüksekliği | 52px | 56px (iOS standart) |
| Sayfa başlığı (topbar label) | 17px | 18px |
| Durum badge (sağ üst) | 10px | 12px |
| Spool ID (D001-S001-R0) | 18px | 20-22px |
| Sekme yazısı | 11px | **14px** |
| Sekme başlığı (SPOOL BİLGİLERİ) | 10px `var(--txd)` | **12px `var(--txm)`** (kontrast 3.2:1 → 7:1) |
| Alan adı (Pipeline No) | 13px `var(--txd)` | **14px `var(--txm)`** |
| Değer (G200-303-BS15) | 13px | **15px** |

**Önemli:** Renkler `var(--txm)` gibi **CSS değişkeni** üzerinden tanımlanır, hardcoded hex yazılmaz. Aksi halde açık tema'da iyi görünüp koyu tema'da kötü olur (vanilla'nın hatasıydı).

**Sebep:** Cihat 54'te screenshot ile gösterdi: vanilla'nın 11px sekme yazıları açık tema'da okunmuyor. WCAG kontrast hesabıyla doğrulandı: `--txd` üzerine `--sur` zemin = 3.2:1 (FAIL). `--txm` ile 7:1 (AAA seviyesi). Vanilla ekranlarda da bu sorun var ama orada çözülmedi (pratik test eksikti).

**Stacked (alt-alta) yapı reddedildi** — Cihat tek-satır kompakt yapıyı tercih etti, dikey alan tasarrufu için.

**Geçerlilik:** ✅ Aktif. MSpoolDetay başta uygulanır, MDevreDetay vs. diğer M ekranları aynı sistem üzerine kurulur.

#### MK-54.G [TASARIM] — İşlem Durumu n/N format + tema-spesifik renkler

**Karar:** MSpoolDetay'ın "İşlem Durumu" bölümünde her operasyon (Kesim/Büküm/Markalama) **n/N formatında** gösterilir, **ilerleme barı yok, sadece sayı**:

```
Kesim       3/3      (yeşil)
Büküm       1/3      (sarı)
Markalama   0/3      (kırmızı)
```

**Renk paleti — tema-spesifik:**
- Açık tema (`light-anthracite`):
  - `--status-done`: `#15803d` (koyu yeşil)
  - `--status-wip`: `#A16207` (koyu amber, sarı turuncuya kaymadan)
  - `--status-no`: `#B91C1C` (koyu kırmızı)
- Koyu tema (`dark`):
  - `--status-done`: `#4ADE80` (parlak yeşil)
  - `--status-wip`: `#FBBF24` (parlak amber)
  - `--status-no`: `#F87171` (açık kırmızı)

Her tema kombinasyonu **AA kontrast** üzerinde tutulur (özellikle açık tema'da sarı standart `#EAB308` kontrast 2.8:1 = FAIL, koyulaştırılmış varyant kullanılır).

**Veri kaynağı:** `kesim_kalemleri`, `bukum_kalemleri`, `markalama_kalemleri` tabloları (web `devre_detay.html` satır 1200'deki nested select pattern'i: `.select('*, kesim_kalemleri(id,kesildi), ...')`).

**Sebep:**
- Vanilla'nın "Kesim ✓ Tamamlandı / Büküm ● Devam" tek-durum yapısı yetersiz — bir spool 3 parça kesim gerektirebilir, "1 parça kesildi" durumu kaybolur. n/N bunu açıkça gösterir.
- Bar gereksiz görsel gürültü; kart zaten n/N + renkle dolu, bar bilgi katmıyor.
- Tek hex renk (örn. `#EAB308`) yazılırsa açık temada okunmaz. Tema-spesifik tanım WCAG güvencesi sağlar.

**Geçerlilik:** ✅ Aktif. MSpoolDetay'da uygulanır, MDevreDetay'ın 6-aşama timeline'da da aynı renk sistemi kullanılır.

#### MK-54.1 [BORÇ] — M ekranları i18n hook'unu bypass ediyor

**Borç (henüz çözülmedi, 55'te ele alınacak):** Mobile React iskeletindeki M ekranları `i18n.jsx` provider'ını ve `useT()` hook'unu **kullanmıyor**. Tespit MGiris.jsx'te yapıldı, diğerlerinde de büyük ihtimalle aynı sorun var.

**Tespit:**
- 54'te dil değiştirme testi: TR → EN → AR seçimi `localStorage` ve html `lang` attribute'unu güncelliyor, **ama içerik aynı kalıyor.**
- Sebep: MGiris.jsx kendi `[dil, setDil] = useState(...)` paralel state'ini tutuyor, `useT()` hook'unu hiç çağırmıyor, JSX'te tüm yazılar hardcoded TR.
- 5 hafta önce yarım kalmış: i18n provider kuruldu, dil seçici eklendi, ama M ekranları bağlanmadı.

**Etkilenen dosyalar (denetim 55'te):**
- `mobile/src/screens/MGiris.jsx` — kanıtlı bypass
- `mobile/src/screens/MAnasayfa.jsx` — şüpheli
- `mobile/src/screens/MAnasayfaYonetici.jsx` — şüpheli
- `mobile/src/screens/MIslemler.jsx` — şüpheli
- `mobile/src/screens/MDrawer.jsx` — şüpheli

**Yan etki:** PROJE-HARITASI'nda bu ekranlar "%100 i18n'li çalışıyor" yazıyordu — yanlış bilgi, 54 kapanışında düzeltildi. Aşamalar gerçek değerlere çekildi (%60: açılıyor ama i18n borç).

**55'te yapılacak:** Her M ekranını tek tek aç, `useT()` hook'una bağla, hardcoded string'leri `tv('anahtar', 'fallback')` formatına çevir, eksik anahtarları `lang/tr.json` + `en.json` + `ar.json`'a ekle.

---

#### MK-55.1 [DISIPLIN] — Oturum sağlık script'i (mekanik açılış/kapanış kontrolü)

**Karar:** Her oturum **açılış ve kapanışında** `scripts/oturum-saglik.sh` çalıştırılır. Üç ritüel dosyasının (`CLAUDE-SONRAKI-OTURUM.md`, `CLAUDE-SON-OTURUM.md`, `.github/son-durum.md`) güncel olup olmadığını mekanik kontrol eder.

**Açılış modu** — `./scripts/oturum-saglik.sh N`:
- `CLAUDE-SONRAKI-OTURUM.md` başlığı `# N. Oturum` ile başlamalı
- `CLAUDE-SON-OTURUM.md` başlığı `# (N-1). Oturum` ile başlamalı
- Tutarsızsa **❌ BAYAT** (exit 1), tutarlıysa **✅ TEMİZ** (exit 0)
- Git status + son 3 commit + her dosyanın mtime'ı + başlığı tek çıktıda görünür

**Kapanış modu** — `./scripts/oturum-saglik.sh N --kapanis`:
- `CLAUDE-SON-OTURUM.md` başlığı `# N. Oturum` (bu oturumun özeti)
- `CLAUDE-SONRAKI-OTURUM.md` başlığı `# (N+1). Oturum` (sonraki oturum gündemi)
- Üç dosyanın mtime'ı bugün olmalı
- Hepsi geçerse: `git add` + `git commit`. Push manuel `gp` ile.

**BAYAT durumunda (kritik kural):** Claude gündem işine başlamaz, **onarım moduna girer**:
1. `git log --oneline --since=...` ile eksik oturumların commit'lerini topla
2. `docs/KARARLAR.md` son N kararını oku
3. Eksik özet(ler)i geriye dönük yaz: `CLAUDE-SON-OTURUM.md` (geçen oturum), `CLAUDE-SONRAKI-OTURUM.md` (bu oturum), `.github/son-durum.md` (güncel borç)
4. Script'i tekrar çalıştır, **TEMİZ** olduğunu doğrula
5. **Sonra** gündem işine başla

**Açılış ritüeli güncellemesi (CLAUDE.md):** Mevcut 1. madde:
```
cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
```
**Yeni 1. madde:**
```
cd ~/Desktop/arespipe && git pull origin main && ./scripts/oturum-saglik.sh N
```
Script `git status` + `log -3` çıktılarını da içine alır.

**Sebep:** 52 kapanışında üç ritüel dosyası atlandı. 53'te tamir edilmedi (sadece KARARLAR'a dökümantasyon revizyonu yazıldı). 54'te yine tamir edilmedi (mobile gündemi geldi). 55 açılışında "spool_detay yapıyorduk oradan devam" denildiğinde Claude'un elinde somut gündem yoktu — userMemories'ten sahte bir gündem türetmeye çalıştı, 55 boş başladı. Cihat haklı olarak şikayet etti: *"nasıl önceki oturumdan güncel durum gelmemiş olabilir... yoksa tüm dökümanlarımız bayatlar."*

Üç oturum üst üste atlamasının sebebi insan dikkati değil, **mekanik kapı eksikliği**. Yazılı kural ("Claude oturum sonu mutlaka şunu yapar") sıkışık anda atlanıyor. Script çağrısı atlanırsa zaten görüyor: BAYAT. Atlanamayan tek yol bu.

**Geçerlilik:** ⚠️ MK-56.2 ile **revize edildi**. Üç ritüel dosyası tek `BRIEFING.md`'ye birleştirildi. Script'in hedef dosyaları değişti (BRIEFING.md başlık + mtime). BAYAT/onarım modu disiplini aynı, sadece kontrol nesnesi tek dosya oldu. Script konumu: `scripts/oturum-saglik.sh` (56'da 331 satıra çıktı, MD5: `c0ee88cb745298de2c2fed99c3ff3f48`).

---

#### MK-56.1 [DISIPLIN] — Kapanış Cihat onayı (otomasyon yok)

**Karar:** Oturum kapanışında BRIEFING.md hazırlandıktan sonra **Cihat onayı olmadan** otomatik commit + push yapılmaz. `oturum-saglik.sh --kapanis` script'i sadece **kontrol + öneri** sunar (mtime + başlık eşleşmesi + git status). Cihat *"doğru, push"* dedikten sonra **manuel** `git add -A && git commit && gp` çalıştırılır.

**Sebep:** 55. oturum kapanışında script BRIEFING benzeri bir kontrol yapmıştı, ama içeriğin **doğruluğu** kontrol edilmiyordu. Önceki Claude *"55'in birincil işi i18n"* yazdı (yanlış özet), kimse onaylamadan push edildi, 56'da bağlam tıkanıklığı yarattı, yarım gün kayıp. Mekanik kapı + insan onayı = hibrit Katman 1 + Katman 3.

**Hibrit model (Katman 1 + 2 + 3):**
- **Katman 1 (Script):** Kanıtlanabilir gerçekler — git diff, başlık eşleşmesi, mtime, tazelik etiketleri.
- **Katman 2 (Claude):** Yorum gerektiren tespit — bu sohbette yeni MK var mı, mimari değişti mi, alerji ifade edildi mi. Konuşmadan kanıtla cevap verir.
- **Katman 3 (Cihat):** Son söz — Claude'un yorumunu denetler, *"yanlış anladın"* diyebilir, kapanışı reddedebilir.

Hiçbir katman tek başına yeterli değil; üçü birlikte aynı hatayı aynı anda yapma olasılığını azaltır.

**Geçerlilik:** ✅ Aktif. 56'da yazıldı.

#### MK-56.2 [DISIPLIN] — BRIEFING.md tek aktif bağlam dosyası

**Karar:** Sohbet açılışında ihtiyaç duyulan tüm dinamik bilgi tek `BRIEFING.md` dosyasında bulunur. Eski 3 ritüel dosyası (`CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md`, `.github/son-durum.md`) `docs/arsiv/` altına taşındı.

**BRIEFING.md zorunlu bölümleri:**
- 🎯 Sıradaki Oturum Gündemi
- ✅ Bu Oturumda Yapılanlar
- 🗺️ Bilgi Haritası (hangi soru hangi referans dosyada)
- 📋 Açık Borçlar
- 🔧 Aktif Kritik MK Kararları
- 🔄 Tazelik Durumu (MK-56.3 tablosu)
- ⚙️ Sistem Sağlık Durumu
- 📦 Son 5 Commit
- 🚪 Sonraki Oturum Açılış Komutu

**Gerekçe:**
1. Project knowledge GitHub sync gecikmesi/bug'ları — push edilen dosya hemen indekslenmiyor (Anthropic'te açık ticket'lar: claude-ai-mcp#180, claude-code#10647, claude-code#32244). 56 açılışında 55'in commit'i push'ta görünüyordu ama project knowledge hâlâ 51-52 chunk'ları döndürüyordu.
2. 4-5 dosya hatırlama yükü Cihat için ağır.
3. Dağınık dosyalarda yanlış özet yazılırsa sonraki sohbet yanılır (55→56 sapması).

Tek dosya = tek doğruluk noktası.

**Birincil bağlam aktarım yöntemi:** `cat BRIEFING.md` çıktısının sohbete yapıştırılması. Çünkü:
- Terminalden okunan dosya **az önceki** halidir (sync gecikmesi yok)
- Cihat gözle görür, kontrol edilebilir
- 56'da kanıtlandı: `cat son-durum.md` yapıştırılınca bağlam düzeldi

**Yedek katmanlar:**
- GitHub sync (manuel "Sync now") — birincil yöntem fail ederse
- Drag-and-drop dosya yükleme — son çare (terminal yoksa)

**Geçerlilik:** ✅ Aktif. 56'da yazıldı. MK-52.4 ve MK-55.1 bu kararla revize edildi.

#### MK-56.3 [DISIPLIN] — Tazelik kapısı (yavaş değişen dosyalar için periyodik gözden geçirme)

**Karar:** Yavaş değişen referans dosyaları (vizyon, mimari, profil, çalışma modu, mobile, onboarding) BRIEFING.md'nin "🔄 Tazelik Durumu" tablosunda izlenir. Her dosya için: `son_gozden_gecirme` (oturum no) + `sonraki_zorunlu` (oturum no) + tetikleyici. `oturum-saglik.sh --acilis` her oturum başında bunu kontrol eder; `sonraki_zorunlu ≤ aktif oturum` ise **uyarı** verir (BAYAT yapmaz, gözden geçirme görevi olarak listeler).

**İzlenen dosyalar ve periyotlar (56'da):**

| Dosya | Periyot | Tetikleyici |
|---|---|---|
| `SPOOL-AI-VIZYON.md` | 20 oturum | Yeni katman, prototip→yapım geçişi |
| `docs/ARCHITECTURE.md` | 15 oturum | Mimari karar değişimi |
| `CLAUDE-MOBILE.md` | 15 oturum | Yeni mobile şablon, prebuild değişimi |
| `docs/CIHAT-PROFIL.md` | 10 oturum | Yeni alerji/tercih tespiti |
| `docs/CLAUDE-CALISMA-MODU.md` | 10 oturum | Yeni Claude disiplin dersi |
| `docs/ONBOARDING.md` | 20 oturum | Yeni yazılımcı katılımı, sistem değişimi |

**Hariç tutulanlar:** `KARARLAR.md`, `SAYFA-EKSIKLERI.md`, `kurallar.json` — zaten her oturumda dokunulan defter dosyaları, periyodik kapı gereksiz.

**Tazelik tablosu güncelleme akışı:** Bir dosya gözden geçirildiğinde, BRIEFING.md tablosundaki `son_gozden_gecirme` aktif oturum no olur, `sonraki_zorunlu` aktif + periyot olur. Cihat tarafından elle güncellenir, kapanışta MK-56.1 ile onaylanır.

**Gerekçe:** Cihat'ın gözlemi (56): *"25. oturumdaki AI vizyonu mesela 75. oturumda da aynı olabilir mi? Ya çok sağlam bir vizyon olması lazım ya da bayatlamış bir dosyadır."* Yavaş dosyalar bayatlığını ne CI ne yazılı kural yakalıyor. Mekanik periyodik uyarı = çözüm.

**Geçerlilik:** ✅ Aktif. 56'da yazıldı, ilk uyarı 66. oturumda CIHAT-PROFIL ve CLAUDE-CALISMA-MODU için tetiklenecek.

#### MK-56.4 [DISIPLIN] — Kapanış orkestra protokolü (etkileşimli `--kapanis` flag'i)

**Karar:** `oturum-saglik.sh N --kapanis` kapanışta üç-katmanlı bir protokol çalıştırır. Katman 1 (script): git diff, status, BRIEFING.md başlık + mtime, tazelik kapısı — kanıtlanabilir gerçekler. Katman 2 (Claude): tek toplu kapanış raporu üretir; "bu oturumda olanlar" listesi + her madde için `git diff` çelişki kontrolü (eksiklik = "yapıldı dedi ama dosya değişmemiş", fazlalık = "yapılmadı dedi ama dosya değişmiş"). Katman 3 (Cihat): raporu yargılar — "doğru" / "şunu kaçırdın" / "yanlış anladın". Üç DUR noktası: Katman 1 alarmı, Katman 2 çelişkisi, Katman 3 reddi. Hiçbir DUR'da kısa devre yok — eksik tamamlanmadan push olmaz.

**Sınır kabulü:** Script "sohbette ne konuşuldu"yu bilemez, bu Claude'un yorumu. Claude bir konuyu kaçırırsa Katman 3 yakalar — üç katmanın aynı anda yanlış yapma olasılığı düşüktür.

**Cihat'ın bilmesi gereken yok:** Hangi konunun hangi dosyaya gitmesi gerektiği Claude'un iç işidir. Cihat sadece raporu yargılar — bilgi sahibi değil, yargı sahibi olur.

**Sabit kategori listesi (Claude'un dahili kullanımı):** Yeni MK → KARARLAR, mimari → ARCHITECTURE, alerji → CIHAT-PROFIL, sayfa eksiği → SAYFA-EKSIKLERI, vizyon → SPOOL-AI-VIZYON, CI kural → kurallar.json, DB → migrations + DATABASE. Sabit liste çünkü dinamikse Claude soruyu kendi eleyebilir, kapı zayıflar.

**Detay:** Tam akış adımları, çelişki şablonu, doğum kanıtı (56 sızıntısı), genişleme noktaları → `docs/KAPANIS-ORKESTRA-TASARIM.md`. Bu MK kararı sadece referans tutar.

**Gerekçe — doğum kanıtı (56):** 56 BRIEFING.md "Yapılanlar" listesinde *"CIHAT-PROFIL.md'ye yeni alerji eklendi"* yazılı, ama 57 açılışında `git log` ve `grep` kanıtladı: dosya 56'da hiç dokunulmamış, frazlar dosyada yok. 56 Claude'un öz-kontrolü "EKSİK" tespit etmişti ama BRIEFING'e yansıtmadı, "yapıldı" yazdı. Cihat onayında çelişki kaçtı. Bu sistem olsaydı: *"Yeni alerji konuşuldu? EVET. CIHAT-PROFIL.md değişti? HAYIR (git diff'te yok). ALARM."* — kapanış durur, alerji eklenir, BRIEFING dürüst yazılır. **MK-56.4 bu sızıntının doğurduğu telafidir.**

**Geçerlilik:** ✅ Aktif. 57'de yazıldı. `--kapanis` flag'i 57'de veya 58'de kodlanacak. Tasarım dosyası: `docs/KAPANIS-ORKESTRA-TASARIM.md` (159 satır, MD5: 0d85796ea6ff468a330257b622c2273e).


---

#### MK-58.1 [DB] — spooller.alistirma kanonik enum belirlemesi (PENDING)

**Karar:** Vanilla `mobile/spool_detay.html` `tam|kismi|yok` lowercase enum okuyor, `devre_detay.html` `VAR|KISMI|YOK` uppercase okuyor — aynı kolon iki farklı convention. MSpoolDetay React port'unda defensive handler yazıldı (her iki convention'ı da kabul ediyor: `alistirmaBilgi(v, tv)` fonksiyonu `v.toLowerCase()` üzerinden eşler). 59'da `SELECT DISTINCT alistirma FROM spooller` ile DB'deki kanonik değer tespit edilecek, lowercase'e standardize migration yazılacak (`UPDATE spooller SET alistirma = LOWER(alistirma)` veya tek yönlü `UPPER → lower` map).

**Etki:** MSpoolDetay'da Alıştırma satırı ("Var/Kısmi/Yok") düzgün görünüyor, ama vanilla devre_detay.html iki convention'ı yan yana okumaya devam ediyor. Migration sonrası tek convention kalır, defensive handler basitleştirilebilir.

**Geçerlilik:** ⏳ PENDING — 59 başında migration.

#### MK-58.2 [MİMARİ] — Mobil rota konvansiyonu (detay tekil + :id, liste çoğul)

**Karar:** Mobile React rotaları:

- Detay sayfaları: tekil + `:id` parametresi → `/spool/:id`, `/devre/:id`, `/proje/:id`, `/firma/:id`
- Liste sayfaları: çoğul → `/devreler`, `/spoollar`, `/projeler`, `/firmalar`

`App.jsx`'te yeni screen eklenirken bu konvansiyona uyulur. Tutarlılık için web URL'leri ile **kasıtlı farklı**: Web `?id=` query param kullanıyor (örn. `/spool_detay.html?id=...`), mobile React Router URL parametre. İki ayrı projeye ayrı URL şeması — web vanilla'nın query-param mantığını mobile'a taşımıyoruz.

**Geçerlilik:** ✅ Aktif. MSpoolDetay (`/spool/:id`) ile başlatıldı (58). MDevreDetay 59'da `/devre/:id` olarak yazılacak.

#### MK-58.3 [TASARIM] — Kontrast-kritik renkler için sabit hex (CSS variable bypass)

**Karar:** Kontrast-kritik UI öğelerinde (sekme yazıları, aktif buton metni, durum badge metinleri) `var(--tx)` gibi CSS değişkenleri kullanılmaz; sabit hex kullanılır + `[data-theme=dark]` selector ile koyu tema override'lanır. CSS variable cascade tema toggle anında tutarsız davranabilir, sabit hex deterministik.

Örnek (MSpoolDetay sekmeleri):

```css
.msd-tab { color: #1a1817; }   /* sabit, açık tema okunaklı */
[data-theme="dark"] .msd-tab { color: #eceae3; }  /* koyu tema explicit override */
```

**Tema değişkenlerine güven ölçüsü:** Kart arka planı, ana yazı rengi, kenarlık → `var(--*)` OK. "Tıklanabilir kontrol metni" gibi okunabilirlik kritik yerler → sabit hex. Karar değil, kural — tasarım kuralı olarak `CLAUDE-MOBILE.md` R-09'a ek nota dönüştürülecek (59 borcu).

**Geçerlilik:** ✅ Aktif. MSpoolDetay sekmelerinde uygulandı.

#### MK-58.4 [MİMARİ] — Root lang/ tek kaynak, mobile türev (prebuild kopyalar)

**Karar:** `lang/{tr,en,ar,...}.json` kök dizinde **tek kaynak**. Web doğrudan oradan okur. Mobile `mobile/src/lang/` türev — `.gitignore`'da, her build'de `mobile/package.json` `prebuild` script'i kopyalar:

```json
"prebuild": "rm -rf src/lang && mkdir -p src/lang && cp ../lang/*.json src/lang/"
```

**Yeni dil eklemek için:** sadece `lang/<kod>.json` (root) eklemek yeter — mobile prebuild otomatik kopyalar. UI dropdown'larında `<kod>` listesini güncellemek ayrı iş (web `ares-lang.js`, mobile `mobile/src/lib/i18n.jsx`).

**Anahtar prefix konvansiyonu:** Web ve mobile için ayrı prefix'ler kullanılır (örn. mobile `mob_*`, web `sp_*`, `cmn_*`, `dny_*`). Aynı kavram iki ayrı isim alabilir — senkronizasyon scripti yazılana kadar (15. oturumdan beri açık borç) bu manuel takip edilir.

**58'de doğrulama:** Mobile/src/lang'a manuel eklenen 65 anahtar root'a taşındı, prebuild ile mobile tazelendi. Sayım 1659 → 1718, 3 dilde (TR/EN/AR) simetrik.

**Geçerlilik:** ✅ Aktif.

#### MK-58.5 [BORÇ] — Süper admin paneli mobile preview hardcoded UUID (PENDING)

**Karar:** `admin/panel.html` Mobile Önizleme sekmesi şu an hardcoded test UUID kullanıyor: `c79d0983-e0f3-406f-afde-bb7bc9ad92c3` (S03 / AT110-816-026 / NB1137 — gerçek bir spool, fotoğraf yok ama Spool Bilgileri dolu).

```html
<option value="https://arespipe-mob.vercel.app/spool/c79d0983-e0f3-406f-afde-bb7bc9ad92c3">Spool Detay (test)</option>
```

**59'da:** panel'e dinamik bir input alanı eklenecek (UUID elle yapıştırılabilsin) veya son N spool dropdown'dan seçilebilsin (RLS'e takılmayacak şekilde, Supabase service_role değil normal session ile).

**Geçerlilik:** ⏳ PENDING — 59'da dinamik input.

#### MK-58.6 [BUG-FIX] — MSpoolDetay 4 Supabase sorgusu schema uyumsuzluğu (✅ 59'da TAMAMLANDI)

**Karar:** Vanilla `mobile/spool_detay.html`'den miras 4 sorgu DB schema ile uyumsuz, 400 Bad Request veriyor. Etkilenen bölümler MSpoolDetay'da boş gözüküyor:

| Sorgu | Eski (yanlış) | Yeni (doğru) |
|---|---|---|
| `belgeler` | `select=ad,dosya_adi,url,olusturma` | `select=ad,dosya_url,olusturma` (`dosya_adi`, `url` kolonları yok) |
| `islem_log` | `.eq('kayit_id', X)` | `.eq('spool_id', X)` (`kayit_id` kolonu yok, `spool_id` direkt var) |
| `kk_davetler` | `.contains('spool_ids', [X])` (`spool_ids` kolonu yok) | `kk_davet_spooller` junction üzerinden + `kk_davetler(davet_no, olusturma)` nested + `kk_no` → `davet_no` |
| `sevkiyat_spooller` | `select=sevkiyatlar(sevkiyat_no,tarih)` | `select=sevkiyatlar(sevk_no,tarih)` (`sevkiyat_no` yok, `sevk_no` doğrusu) |

**Ek değişiklikler:** UI tarafında `kkBilgi?.kk_no` → `davet_no`, `sevkBilgi?.sevkiyat_no` → `sevk_no`, `b.url` → `b.dosya_url` (2 yerde), `b.dosya_adi` ölü fallback temizlendi. KK davet sıralaması foreignTable order karmaşası nedeniyle JS tarafına alındı (`kkList.sort` + `setKkBilgi`).

**Birincil işlev sağlam:** Spool Bilgileri (Çap, Et, Ağırlık, Malzeme), tam marka, sekmeler, tema, n/N, Alıştırma — hepsi çalışıyor. 58'de bu 4 sorgudan beslenen UI alanları boştu, 59'da düzeltildi.

**59'da yapılan adımlar:**
1. Supabase SQL editor'de `information_schema.columns` ile gerçek kolon isimleri tespit edildi (4 + `sevkiyatlar` + `kk_davet_spooller` junction)
2. MSpoolDetay.jsx'te 5 sorgu yeniden yazıldı (kk_davetler junction'a çevrildi)
3. UI tarafında 6 yer güncellendi (kk_no, sevkiyat_no, dosya_adi/url referansları)
4. Localhost'ta Network 4 sorgu 200 OK doğrulandı, ardından canlıda da yeşil

**Geçerlilik:** ✅ TAMAMLANDI — Commit `674435e` (59. oturum, 4 Mayıs 2026). Localhost + canlı doğrulandı, panel mobil önizleme yeşil.

#### MK-58.7 [TASARIM] — Spool ID format minimum 4 basamak pad (dinamik genişleme)

**Karar:** Spool ID display formatı: `<PREFIX>-<N>` formatı, N kısmı min 4 basamağa zero-pad, daha büyük rakamlar otomatik genişler.

| DB değeri | UI gösterim |
|---|---|
| `A-000072` | `A-0072` (4 basamak) |
| `A-000555` | `A-0555` (4 basamak) |
| `A-012345` | `A-12345` (5 basamak — auto genişler) |
| `A-123456` | `A-123456` (6 basamak) |

**Helper fonksiyon (MSpoolDetay'da inline):**

```js
function formatSpoolId(id) {
  if (!id) return '';
  const m = String(id).match(/^([A-Z]+)-(\d+)$/i);
  if (!m) return id;
  const num = String(parseInt(m[2], 10)).padStart(4, '0');
  return `${m[1].toUpperCase()}-${num}`;
}
```

**59'da:** Helper `mobile/src/lib/format.js`'e taşınacak — MDevreDetay ve diğer sayfalar da kullanacak.

**Geçerlilik:** ✅ Aktif. MSpoolDetay topbar'ında uygulanıyor.

---

#### MK-59.1 [TASARIM] — `on_imalat` aşaması UI'da "Bekliyor" sayacına map'lenir

**Karar:** Vanilla `devre_detay.html`'in aşama tracker'ı 6 step gösterir (Bekliyor / İmalat / Kaynak / Ön Kont. / KK / Sevkiyat) ama DB'de `spooller.aktif_basamak` 7. değer olarak `on_imalat` (Ön İmalat) içeriyor. Vanilla'da bu spool'lar yutuluyordu — sayaç 0 görünüyordu, kullanıcı şaşırıyordu.

**MDevreDetay React port'unda:** `getStageKey()` helper'ı `on_imalat` → `bekliyor` map'ler. Bu spool'lar artık Bekliyor sayacında görünür ve aşama pill'ine tıklanınca filtrelenir.

```js
function getStageKey(s) {
  if (s.durduruldu) return 'durduruldu'
  if (s.aktif_basamak === 'on_imalat') return 'bekliyor'  // ← MK-59.1
  return s.aktif_basamak || 'bekliyor'
}
```

**Mantığı:** Ön imalat = "iş henüz başlamadı" anlamı taşıyor, kullanıcı zihninde "Bekliyor"a yakın. Ayrı 7. step açmak da seçenekti ama mockup'ı sıkıştırırdı (mobil viewport'ta 6 step zaten dar).

**Sınır:** Bu mapping SADECE UI seviyesinde. DB'ye dokunulmaz, `aktif_basamak` kolonu olduğu gibi kalır. İleride 7. step açma ihtiyacı doğarsa MDevreDetay'da `STAGE_SIRA` listesine `on_imalat` eklenir + i18n + paletten yeni renk seçilir.

**Geçerlilik:** ✅ Aktif. MDevreDetay'da uygulanıyor (commit `2c1e339`). MSpoolDetay'da bu sorun yok — orada tek spool görüntüleniyor, sayaç hesabı yapılmıyor.

#### MK-59.2 [DİSİPLİN] — Outputs'a dosya unique isim ile sun (Chrome `(1)` suffix riski)

**Karar:** Claude `/mnt/user-data/outputs/`'a dosya koyarken **her seferinde unique isim** kullanır. Aynı isim Cihat'ın `~/Downloads/` klasöründe varsa Chrome `(1)` suffix'le ikinci kopyayı kaydeder, Cihat `cp ~/Downloads/X.jsx ...` komutu eski/orijinal dosyayı yapıştırabilir.

**59'da yaşanan vaka:** MSpoolDetay.jsx fix'i `MSpoolDetay.jsx` ismiyle outputs'a kondu. Cihat aynı dosyayı GitHub'dan da `MSpoolDetay.jsx` olarak indirmişti. Yeni indirme `MSpoolDetay (1).jsx` olarak kaydedildi. `cp ~/Downloads/MSpoolDetay.jsx ...` komutu **bug'lı orijinal dosyayı kopyaladı**. Sayfa yine bug'lı görüntüsüne döndü, panik yaşandı (~5 dk kayıp).

**Çözüm pattern:** Dosya adına MK kodu / değişiklik tipi / oturum numarası ekle.

| ❌ Çakışma riski | ✅ Unique isim |
|---|---|
| `MSpoolDetay.jsx` | `MSpoolDetay-MK586-fix.jsx` |
| `MDevreDetay.jsx` | `MDevreDetay-MK59-format-fix.jsx`, `MDevreDetay-MK59-stage-fix.jsx` |
| `App.jsx` | `App-MK59-route.jsx` |
| `tr.json` | `tr-MK59-mobdv.json` |

**Cihat tarafında `cp` komutu** kopyalarken zaten doğru ismi yazıyor:

```bash
cp ~/Downloads/MSpoolDetay-MK586-fix.jsx ~/Desktop/arespipe/mobile/src/screens/MSpoolDetay.jsx
```

**Geçerlilik:** ✅ Aktif. Tüm `present_files` çağrılarında unique isim zorunlu. (Sapma dersi #11 olarak BRIEFING.md'ye de eklenir.)

### MK-60.1 — TemaProvider App.jsx'e eklenmeli (4 Mayıs 2026, 60. oturum)

**Karar:** `mobile/src/App.jsx` Provider zincirinde `<TemaProvider>` bulunmalı. Mevcut zincir sadece `<I18nProvider>` sarıyor; `useTema()` `<TemaProvider>` zorunluluğu tanımlıyor (`if (!ctx) throw new Error('useTema TemaProvider icinde kullanilmali')`).

**Doğum kanıtı:** 60'ta `useT()` bypass denetimi sırasında MGiris.jsx ile ilgili "tam vs minimal scope" tartışmasında MGiris'in kendi local `tema` state'ini kullandığı görüldü. *"Provider'a bağla"* önerisi sırasında `App.jsx` kontrol edildi → `TemaProvider` orada yok. `MDrawer.jsx` `useTema()` çağırıyor ve canlıda çalışıyor; sebep: oturum öncesi MDrawer ulaşılamaz, `useTema()` hiç tetiklenmiyor. Yani kod canlıdaki yolda crash etmiyor ama her an etmesi mümkün.

**Yapılacak (61. oturum birincil iş #1 parçası):**
1. `mobile/src/App.jsx`'te `TemaProvider`'ı `I18nProvider`'ın dışına/içine sar (sırası fark etmez, ikisi bağımsız context):
   ```jsx
   <TemaProvider>
     <I18nProvider>
       <Routes>...</Routes>
     </I18nProvider>
   </TemaProvider>
   ```
2. MGiris.jsx kendi `tema`/`dil` local state'ini sil, `useTema()`/`useT()` üzerinden al.

**Geçerlilik:** ✅ Aktif. 61'de implementasyon birincil iş.

---

### MK-60.2 — `mobile/src/lib/format.js` ortak helper modülü (4 Mayıs 2026, 60. oturum)

**Karar:** Mobil ekranlar arasında paylaşılan format/dönüştürme fonksiyonları `mobile/src/lib/format.js` altında tek noktada tutulur. Yeni bir mobil screen yazılırken format işi gerekiyorsa **önce buradan import** edilir; yeni helper gerekirse buraya eklenir, ekrana yazılmaz.

**60'ta export edilen 10 helper:**
- Sayı/format: `revFmt`, `markaHesapla`, `nNRenkler`, `formatSpoolId`
- Tarih: `formatTarih`, `formatTarihSaat`, `formatSure`
- Veri: `alistirmaBilgi` (defensive enum reader), `malzemeEtiket` (i18n + map)
- Güvenlik: `esc` (HTML escape, JSX dışı string concat için)

**Doğum kanıtı:** 58. oturumda MSpoolDetay'a yazılan 8 helper, 59. oturumda MDevreDetay'da 3'ü kopyalandı + 1'inde drift oluştu (`revFmt('0')` → `'Rev0'` bug, MSpoolDetay'ın defensive sürümünde yok). 60'ta açık borç #3 kapatılırken kanonik sürümler tek dosyada birleştirildi, 33 birim test geçti, MSpoolDetay -73 satır, MDevreDetay -38 satır. MDevreDetay'ın bug'lı `revFmt`'i MSpoolDetay sürümüyle değiştirildi (net bug fix).

**UI'a özel kalanlar (format.js'e gitmedi):**
- `getStageKey(s)` — MDevreDetay'a özgü, `on_imalat → bekliyor` UI map'i (MK-59.1).

**Geçerlilik:** ✅ Aktif. Yeni mobil screen'ler buradan başlar.

---

### MK-60.3 — `oturum-saglik.sh --kapanis` Katman 1 canlı (4 Mayıs 2026, 60. oturum)

**Karar:** MK-56.4'te tasarımı yazılan kapanış orkestra protokolünün **Katman 1 (Script)** kısmı 60'ta implement edildi ve canlıya çıktı. Artık `./scripts/oturum-saglik.sh N --kapanis` çağrısı her kapanış öncesi mekanik kontrol sağlar.

**Katman 1 ürettiği veriler:**
- BRIEFING.md başlık tutarlılığı (`# AresPipe BRIEFING — N. Oturum Kapanışı`)
- BRIEFING.md mtime bugün mü
- Bu oturumun commit listesi (önceki kapanış SHA'sından HEAD'e — `docs(N-1): kapanis` pattern'i veya BRIEFING mtime fallback)
- Working tree değişimleri (henüz commit'lenmedi)
- 7 kategori dosyası taraması: `docs/KARARLAR.md`, `docs/ARCHITECTURE.md`, `docs/CIHAT-PROFIL.md`, `docs/SAYFA-EKSIKLERI.md`, `SPOOL-AI-VIZYON.md`, `kurallar.json`, `migrations/` — her biri için commit + ws diff şort-stat
- Tazelik kapısı uyarıları (varsa)
- Onay akışı talimatı (Katman 2 + Katman 3 sözleşmesi)

**Otomatik commit YAPMAZ.** MK-56.1 kapısı: Cihat onayı zorunlu. Script sadece **veri sunar**, karar Cihat'ın.

**Doğum kanıtı:** 57. oturumda MK-56.4 tasarımı yazıldı (`docs/KAPANIS-ORKESTRA-TASARIM.md`), 57-58-59 boyunca implementasyon zaman bulamadı. 60'ta ikincil iş olarak yapıldı, fake repo'da 4 senaryo testi geçti, gerçek repoda BRIEFING başlığı reddetti (beklenen davranış — production'da çalıştığını doğruladı), commit `afac0a8`.

**61+ iyileştirme adayları:**
- Çıktı format okunabilirliği (kategori taramasında uzun bir kategori varsa output dağılıyor)
- Kategori taraması JSON output opsiyonu (programatik denetim için, KAPANIS-ORKESTRA-TASARIM.md'de yazılı genişleme)

**Geçerlilik:** ✅ Aktif. Her kapanış bu script'i çalıştırır.

---

### MK-61.1 — Foto arşiv stratejisi: sıkıştırılmış cloud + orijinal yerel (5 Mayıs 2026, 61. oturum)

**Karar:** Saha fotoğrafları **iki kanalda** saklanır:

1. **Sıkıştırılmış sürüm (web boyutu, ~500KB)** — Supabase Storage'a yüklenir, sistem bu sürümü gösterir, AI çağrıları (Vision, RAG) bunu kullanır.
2. **Orijinal sürüm (~5MB)** — Yerel diskte (Cihat'ın bilgisayarı + 3-2-1 yedek prensibiyle harici disk + off-site kopya) arşivlenir. Sistem orijinale doğrudan ulaşmaz.

**Doğum kanıtı:** 61'de vizyon konsolidasyonu sırasında foto arşivi tartışıldı. v3 madde 19 *"3 versiyon paralel saklama"* (orijinal Backblaze + web Supabase + vektör pgvector) öneriyor. Cihat'ın endişesi: *"Veri biriktikçe büyüklük yönetilemez olabilir, ama orijinali silmek de saçma."* Üçüncü yol bulundu: bulut soğuk depo maliyeti **ortadan kalktı** (1 müşteri × 300GB Backblaze ~$1.5/ay tasarrufu küçük ama disipline yöneticisi yerel olduğu için Cihat zaten bunu yapıyor — 3-2-1 yedek prensibiyle SPOOL-AI-VIZYON 8. teknik kararı uyumlu).

**v2/v3 uyumu:** SPOOL-AI-VIZYON v2.1 *"Veri yedek politikası: fiziksel yedek, 3-2-1 prensibi"* diyor. v3 madde 19'un cloud bağımlılığı bu kararla yumuşatıldı. v3'ün esas niyeti *"orijinal kayboldu mu"* sorusunu ortadan kaldırmaktı — bu karar onu sağlıyor (orijinal yerel diskte hep var).

**Pratik takas:** AI çağrısı sıkıştırılmış sürümü kullanır, 500KB foto Vision için yeterli (Vision API zaten upload'u 5MB'ı 2048x2048'e küçültüyor). Eğer ileride yüksek çözünürlük gerekirse (örn. mikro-çatlak tespiti), yerel arşivden geçici upload yapılabilir.

**Geçerlilik:** ✅ Aktif. `fotograflar` tablosunda `dosya_url` (Supabase) + `arsiv_yerel_yolu` (TEXT, opsiyonel) kolonu olur. Yeni foto upload akışı: orijinal yerel'e kopyala (kullanıcı tarafında JS ile, manuel disipline güvenir), sıkıştırılmış sürüm Supabase'e gönder.

---

### MK-61.2 — Foto aşama bilgisi QR okutmadan alınır, kişiden değil (5 Mayıs 2026, 61. oturum)

**Karar:** Bir fotoğrafın hangi imalat aşamasına ait olduğu, **fotoğrafı çeken kişinin rolünden değil**, fotoğrafın çekildiği anda **aktif QR okutma session'ından** belirlenir.

**Sebep:** Personel rolleri 1:1 aşama eşlemesi vermez. Aynı kaynakçı farklı zamanlarda hem argon hem gazaltı kaynak yapabilir; aynı kişi sabah kesim yapıp öğleden sonra markalama da yapabilir. Ek olarak, **yöneticiler sahada gezerken foto çekebilir** — yönetici hangi aşamada çekti belirsizdir, eşleştirilemez.

**Akış:**
1. Personel QR okutur → `spool_aksiyonlari` tablosuna kayıt: `(spool_id, asama, aksiyon=basla, personel_id, zaman)`
2. İş bittiğinde tekrar QR okutur → `(spool_id, asama, aksiyon=bitir, personel_id, zaman)` + foto ekranı açılır
3. Çekilen foto otomatik `aksiyon_id`'ye bağlanır, `asama` aksiyon'dan kopyalanır.

**İstisna — yönetici gözlem fotosu:** Yönetici bir spool'u sahada görüp foto çekerse, **aşama YOK**. Sadece `spool_id` + foto + not. (Bu için ayrı bir MK adayı 62'de yazılacak — `docs/VIZYON-OTURUMLARI.md`'de kayıtlı.)

**v3 uyumu:** v3 madde 17 *"asama otomatik aksiyondan kopyalanır"* diyor, bu karar onu yazılı kılar.

**DB etkisi:** `spool_aksiyonlari` tablosu doğacak (henüz yok), `fotograflar.aksiyon_id` FK olacak (henüz yok), `fotograflar.asama` enum kolonu (kopyalanmış değer, denormalize) — bu schema değişiklikleri 62-63 civarı bir migration'da yapılır. Bugün karar yazılı, implementasyon sonra.

**Geçerlilik:** ✅ Aktif. QR-tetikli foto akışı tasarlanırken bu sözleşme korunur.

---

### MK-61.3 — Devre arşivlenmesi soft archive değil, görünürlük filtresi (5 Mayıs 2026, 61. oturum)

**Karar:** Devre/proje arşivlenmesi **DB'den çıkarmaz, görünürlük filtresi** uygular.

**Tasarım:**
- Devre durumu = aktif / biten (`spooller` tablosundaki tüm spool'lar tamamlandığında otomatik "biten" olur)
- Aktif Devreler sayfası: sadece `durum = 'aktif'` olanları listeler
- Gemi sayfası: gemiye bağlı tüm devreleri (aktif + biten) gösterir, biten devre kartı sönük renkle çizilir
- Gemi `aktif` sayılması: en az bir aktif devresi olması. Tüm devreler bittiyse gemi de "tamamlanmış" görünür ama veri yerinde kalır
- Devre yeniden devraldığında (yeni iş geldi): otomatik aktif olur, hiçbir manuel işlem yok
- Veri **hiç silinmez**, sadece UI'da gizlenir

**Sebep:** Tersane operasyonunda bir gemi projesi 5 yıl sonra geri açılabilir (garanti, modifikasyon, yedek parça siparişi). Soft delete (silindi=true) bunu zorlaştırır. Görünürlük filtresi UI mantığına bırakır, veri özgür kalır.

**Foto boyutu ile karışmaz:** Bu karar **görünürlük** ile ilgili. **Foto sıkıştırma** ayrı bir konu (MK-61.1). Cihat sohbette *"5MB → 500KB"* diye foto küçültmeyi devre arşivlenmesi anına bağlamıştı, ama o yanlış bir bağlanmadır. Foto sıkıştırma **upload anında** olur (MK-61.1), devre arşivlenmesi sadece UI filtresi olur (bu karar). İki sistem birbirinden bağımsız.

**Geçerlilik:** ✅ Aktif. Aktif Devreler sayfası filtresi + Gemi sayfası birleşik gösterimi bu karara göre tasarlanır.

---

### MK-61.4 — Yeni belge yaratırken bilgi haritası satırı + sahip + tazelik penceresi zorunlu (5 Mayıs 2026, 61. oturum)

**Karar:** AresPipe repo'sunda yeni bir markdown belge yaratıldığında, **aynı oturumda** şunlar yapılmazsa belge oluşturulmaz:
1. **BRIEFING.md bilgi haritasına** belgenin sorduğu soru tipini içeren satır eklenir.
2. Belgenin başına **sahip** yazılır (Cihat / Cihat+Claude / Claude).
3. Belgenin başına **tazelik penceresi** yazılır (sonraki_zorunlu kaç oturum sonra) **ya da** *"kayıt dosyası, tazelik kapısına alınmaz"* notu.

Bu üç şart sağlanmadıysa: belge yaratılmaz, içerik **mevcut bir belgeye eklenir**.

**Doğum kanıtı:** 61'de keşfedildi: 40-43. oturumlarda yaratılan üç belge (`docs/KUTUPHANE-KAPSAM.md`, `docs/KUTUPHANE-YUKLEME-TAKIP.md`, `docs/VIZYON-VE-MODULER-MIMARI.md`) BRIEFING bilgi haritasına hiç eklenmemiş. 18-21 oturum boyunca **yetim** kaldılar — Claude bilmedikleri için varlığını farketmedi, Cihat hatırlatınca repo'da bulundu. 61. oturum başında Claude bu üç belgeyi *"repo'da olmayabilir"* sandı; gerçek doğrulama için repo cloning + `find` gerekti. Bu deneyim **belge ölümünün ana sebebini** ortaya koydu: bilgi haritasında yer almayan belge yokmuş gibi davranılır.

**Yan ürün:** Bu karar aynı zamanda **belge yaratma cazibesine direnç** sağlar. *"Yeni belge yapıyorum"* duygusal olarak tatmin edicidir, ama doğru iş genelde mevcut belgeye paragraf eklemektir. Üç şart kontrolü, belgeyi yaratmak yerine *"acaba mevcut belgenin bir bölümü olabilir mi?"* sorusunu zorlar.

**İstisna — kategori belgeleri:** Kümülatif kayıt belgeleri (örn. `docs/VIZYON-OTURUMLARI.md`) tazelik penceresi yerine *"kayıt dosyası, tazelik kapısına alınmaz"* notuyla geçer. Bu meşru çünkü içeriği zaten her oturumda büyür, "güncel" tutulması gereken bir tek-değer yok.

**Geçerlilik:** ✅ Aktif. Tüm yeni belge yaratımları bu kontrol altında.

---

---

## Açık Borçlar (henüz karar değil — gözlem)

Bu maddeler bir karara dönüştüğünde kendi `MK-XX.X` numaralarını alıp yukarıdaki listeye eklenecek.

- DB değişiklikleri için migration disiplini — şu an Supabase SQL Editor'da elle UPDATE çalıştırılıyor (51'de Spool fingerprint, 52'de planlanan parser_kural pipeline_no), repo görmüyor. Her DB değişikliğini `migrations/NNN_*.sql` olarak yazma kararı 53'te konuşuldu, henüz somut karara dönüşmedi.
- `docs/CLAUDE-CALISMA-MODU.md` ile `docs/CIHAT-PROFIL.md` arasındaki overlap (Cihat tanımı iki dosyada) — birinden silinmesi gerekebilir, ama hangisi henüz net değil.
- Eski `asme_borular` ve `cuni_borular` tablolarının silinmesi (35'te dondu, 37-38'de silinecekti, yapıldı mı bilinmiyor).

---

## Değişiklik Tarihçesi

| Tarih | Oturum | Değişiklik |
|---|---|---|
| 2 Mayıs 2026 | 53 | KARARLAR.md doğdu. MK-49.1 ila MK-52.4 ilk kez tek dosyada toplandı. MK-52.3 (ritüel sadeleştirme) ve MK-52.4 (knowledge ↔ repo bağlantısı) bu tarama sırasında geriye dönük yazıldı. MK-53.1 ile dosyanın kendisi karar olarak kaydedildi. |
| 2 Mayıs 2026 | 53 | MK-53.2 (terminal komut çıktı disiplini), MK-53.3 (dökümantasyon revizyonu — ROADMAP+PANO-TASARIM arşivlendi, PROJE-HARITASI doğdu), MK-53.4 (PROJE-HARITASI canlılık disiplini), MK-53.5 (etki taraması — anlık karar yakalama) eklendi. |

| 3 Mayıs 2026 | 54 | MK-54.A (mobile = light versiyon) + MK-54.B (web öncül mobile follower) + MK-54.C (vanilla referans, kopyalanmaz) + MK-54.D (prebuild pattern) + MK-54.E (MSpoolDetay 3 sekme, 3D yok) + MK-54.F (MSpoolDetay tipografisi) + MK-54.G (n/N format + tema renkler) eklendi. MK-54.1 (M ekranları i18n bypass borcu) kayda alındı. |
| 3 Mayıs 2026 | 55 | MK-55.1 (oturum sağlık script'i — mekanik açılış/kapanış kontrolü) eklendi. 53+54 ritüel atlamasının üst üste birikmesinin sebebi tespit edildi: yazılı kural sıkışık anda atlanabiliyor. Mekanik kapı (script BAYAT/TEMIZ) atlanamaz tek yol. |
| 3 Mayıs 2026 | 56 | MK-56.1 (kapanış Cihat onayı, otomasyon yok) + MK-56.2 (BRIEFING.md tek aktif bağlam dosyası) + MK-56.3 (tazelik kapısı, yavaş değişen dosyalar için periyodik gözden geçirme) eklendi. Eski 3 ritüel dosyası (`CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md`, `.github/son-durum.md`) `docs/arsiv/`'a taşındı. `oturum-saglik.sh` BRIEFING.md odaklı yeniden yazıldı (331 satır, MD5: c0ee88cb745298de2c2fed99c3ff3f48, 3 senaryo testi yeşil). MK-52.4 ve MK-55.1 revize işareti aldı. 55'in sapması belgelendi: önceki Claude `son-durum.md` "Açık Borçlar" listesini gündem sandı, oysa o liste CI bakım kuyruğu — asıl iş (MSpoolDetay) hiç başlamadı. CIHAT-PROFIL.md'ye alerji ekleneceği yazıldı ("varsayım yapma, kanıttan git") ama 57 açılışında git log+grep ile dosyaya hiç dokunulmadığı tespit edildi — bu yarı yalan MK-56.4'ün doğum kanıtı oldu. Telafi 57'de yapıldı. |
| 4 Mayıs 2026 | 57 | MK-56.4 (kapanış orkestra protokolü — etkileşimli `--kapanis` flag'i, üç-katmanlı sistem: Script + Claude rapor + Cihat yargı, iki yönlü çelişki kontrolü) eklendi. Tasarım dosyası `docs/KAPANIS-ORKESTRA-TASARIM.md` doğdu (159 satır, MD5: 0d85796ea6ff468a330257b622c2273e). 56 sızıntısı telafi: `docs/CIHAT-PROFIL.md`'ye iki alerji **gerçekten** eklendi — "varsayım yapma, kanıttan git" + "heredoc + Türkçe markdown güvenilmez" (uzun dosyalarda heredoc/TextEdit yöntemleri başarısız, Claude `create_file` + Cihat `cp` standart yöntem oldu). BRIEFING.md yenilendi (5/6. sapma dersleri eklendi). `--kapanis` flag implementasyonu 58'e devredildi (tasarım yazılı, sıra kodda). |
| 4 Mayıs 2026 | 58 | MSpoolDetay React port (vanilla `mobile/spool_detay.html` 635 satır → `mobile/src/screens/MSpoolDetay.jsx` ~775 satır) tamamlandı. 7 MK kararı eklendi: MK-58.1 (alistirma enum, PENDING), MK-58.2 (mobil rota konvansiyonu), MK-58.3 (kontrast-kritik renkler sabit hex), MK-58.4 (root lang tek kaynak), MK-58.5 (panel hardcoded UUID, PENDING), MK-58.6 (4 Supabase sorgu schema, PENDING), MK-58.7 (spool ID min 4 basamak format). 5 push, 7 dosya değişti. Bonus: SPA fallback eksik bug yakalandı + düzeltildi (`mobile/vercel.json` doğdu), süper admin panel mobile preview React URL'lerine güncellendi (eski vanilla yolları silindi). Birincil iş tamam, ikincil iş `oturum-saglik.sh --kapanis` flag implementasyonu 59'a devredildi (MK-56.4 tasarımı yazılı, kod sırada). |
| 4 Mayıs 2026 | 59 | **Birincil iş #1 tamam:** MK-58.6 [PENDING] → ✅ TAMAMLANDI (commit `674435e`). 5 sorgu yeniden yazıldı: `kk_davetler.spool_ids` yok → `kk_davet_spooller` junction; `kk_no` → `davet_no`; `sevkiyatlar.sevkiyat_no` → `sevk_no`; `belgeler.dosya_adi/url` yok → `ad/dosya_url`; `islem_log.kayit_id` yok → `spool_id` direkt. UI'da 6 yer güncellendi. Localhost + canlı doğrulandı. **Birincil iş #2 tamam:** MDevreDetay React port (vanilla `mobile/devre_detay.html` 502 satır → `mobile/src/screens/MDevreDetay.jsx` 502 satır, commit `2c1e339`). 3 sekme yapısı: Genel TAM (sticky header + aşama tracker + spool kartları), Malzeme + İşlem Kay. placeholder ("Yakında", 60+'da dolacak). Vanilla 1:1 mantık + mockup-first onaylı tasarım: aşama pill'leri OVAL (2-3 basamaklı sayı sığsın), renk paleti vanilla'dan birebir (sp-* CSS class hex'leri), sol bar = pill rengi (kart aşaması bir bakışta okunuyor). `formatSpoolId`, `markaHesapla`, `revFmt`, `malzemeEtiket` helper'ları MDevreDetay'a kopyalandı (taşıma hâlâ açık borç). Spooller select'ine `pipeline_no, rev` eklendi (full marka için). 23 yeni `mob_dv_*` i18n anahtarı 3 dilde (1718 → 1741). 2 yeni MK kararı: MK-59.1 (`on_imalat` UI'da Bekliyor sayacına map'lenir, vanilla'da yutuluyordu), MK-59.2 (Outputs'a unique isim disiplini, Chrome `(1)` suffix riskini önler). 6 push (MK-58.6 fix + MDevreDetay + lang + 3 CI bot rebase). **İkincil iş 60'a devredildi:** MDrawer'a Geri Bildirim satırı + MSpoolDetay FAB temizlik (Cihat onayı: "tutarlılık için global çözüm"). `oturum-saglik.sh --kapanis` flag hâlâ açık borç (57-58-59 boyunca yetişmedi). |
| 4 Mayıs 2026 | 60 | **5 ana iş tamam:** Geri Bildirim MDrawer'a taşındı + MSpoolDetay FAB temizlik (commit `a5b75a2`, ~110 satır temizlik, MGeriBildirimSheet bağımsız component, 8 i18n rename + 1 yeni). `oturum-saglik.sh --kapanis` Katman 1 implementasyonu (commit `afac0a8`, MK-60.3 — MK-56.4'ün ilk somut çıktısı, 152+ insertions, 7 kategori taraması). Açık Borç #8 kapandı (`.DS_Store` track'ten çıkarıldı, commit `22a66a7`). Açık Borç #7 kapandı (`Devreler.jsx` + `IsBaslat.jsx` boş stub'lar silindi, commit `767efb8`). Açık Borç #3 kapandı: 10 helper `mobile/src/lib/format.js`'e taşındı (commit `d714bb2`, MK-60.2, MSpoolDetay -73 + MDevreDetay -38 satır, `revFmt` defensive sürümü MDevreDetay'daki silent bug'ı düzeltti, 33 birim test geçti). **3 yeni MK kararı:** MK-60.1 (TemaProvider App.jsx'e eklenmeli — useTema crash riski, oturum öncesi MDrawer açılmıyor diye sessiz kalan tehlike), MK-60.2 (format.js mobil ortak helper modülü), MK-60.3 (oturum-saglik.sh --kapanis Katman 1 canlı). **Yarı kapalı:** MK-54.1 useT bypass denetimi — 4 M ekran ✓ useT'li, MAnasayfa ✓ temiz (router), MGiris ⚠️ atlandı (61 birincil iş). **Bilinçli atlanan:** Açık Borç #9 CI sarı temizliği (limit korunması). 11 push (5 ana commit + 3 CI bot rebase + 3 docs auto). 4 yeni sapma dersi belgelendi (BRIEFING.md sapma 14-17): kod bloğu terminale yapıştırma, SQL editöre bash, Vite zombie portlar, TemaProvider sessiz mimari boşluk. |
| 5 Mayıs 2026 | 61 | **Vizyon konsolidasyon oturumu** (kod oturumu değil). Cihat 60 gündemini *"araya konu al"* dedi, eline 4 vizyon belgesi geldi (`SPOOL-AI-VIZYON.md`, `docs/VIZYON-VE-MODULER-MIMARI.md`, `docs/AI-VE-3D-VIZYON-v3.md`, `docs/KUTUPHANE-KAPSAM.md` + `docs/KUTUPHANE-YUKLEME-TAKIP.md`). Üçü repo'da olmasına rağmen BRIEFING bilgi haritasında yoktu (yetim) — Claude başta varlığını sandı, repo cloning + `find` ile gerçek doğrulandı. Sohbet sistem anatomisini yazılı hâle getirdi: spool agregat root, havuz batching pattern, bağlı raporlar zinciri, tezgahlar canlı görünürlük, devre arşivi görünürlük filtresi. **`docs/AI-VE-3D-VIZYON-v3.md` repo'ya alındı** (918 satır, repo entegrasyon notu eklendi, v2.1'in 4 maddesini revize eder: ürün karakteri SaaS değil internal tool, hacim 1000 spool/ay, foto akışı QR-tetikli, tier modeli terk). **`docs/VIZYON-OTURUMLARI.md` doğdu** (146 satır, kategori belgesi — 61 ilk kayıt, vizyon her geçtiğinde başlık eklenir). **BRIEFING bilgi haritasına 5 belge satırı eklendi** (KUTUPHANE-KAPSAM, KUTUPHANE-YUKLEME-TAKIP, VIZYON-VE-MODULER, AI-VE-3D-VIZYON-v3, VIZYON-OTURUMLARI). **4 yeni MK kararı:** MK-61.1 (foto arşiv: sıkıştırılmış cloud + orijinal yerel, 3-2-1 yedek), MK-61.2 (foto aşama bilgisi QR'dan, kişiden değil), MK-61.3 (devre arşivi görünürlük filtresi, soft archive değil), MK-61.4 (yeni belge yaratırken bilgi haritası satırı + sahip + tazelik penceresi zorunlu — doğum kanıtı: 18-21 oturum yetim üç belge). **5 MK karar adayı 62'ye taşındı** (VIZYON-OTURUMLARI.md'de kayıtlı): spool agregat root pattern, havuz batching pattern, format tanıtımı görsel template editor, etiketleme dörtlü bağ parca_id'den, yönetici gözlem fotosu. **2 yeni sapma dersi (BRIEFING sapma 18-19):** bilgi haritası eksiği = belge yokmuş gibi davranma riski (MK-61.4 doğum kanıtı), Cihat'ın "biz şunu yaptık" cümleleri kontrol edilmiş varsayım kabul (Claude yanılgı: Parça Kimliği eksik sandı, migration dosyalarında `tg_spool_malzemeleri_ref_sync` trigger bulundu). **Bilinçli atlanan:** MGiris.jsx (62 birincil iş), CIHAT-PROFIL güncellemesi (62'ye, heyecan sarkacı + kıyas yorumlamama farkındalıkları), 5 MK adayı (62'ye). Master vizyon konsolidasyonu hedef: 65-70 oturum civarı 4 belge → tek `docs/VIZYON.md`. |

### MK-62.1 — Mimari pattern adlandırması: spool agregat root + havuz batching (5 Mayıs 2026, 62. oturum)

**Karar:** AresPipe'ta isim verilmemiş iki mimari pattern artık adlandırılmış sayılır ve gelecek özellik kararlarında zorunlu sorgu hâline getirilir.

**Pattern A — Spool agregat root (DDD anlamında).** Spool detay sayfası bir aggregate'tir. Devre = paket, spool = kayıt, havuzlar = aynı işin toplandığı kuyruklar, log = anlatı. Diğer sayfalar (kesim, markalama, büküm, KK, sevk, test, foto, log) bu agregata enjekte olur, bağımsız varlık değildir.

**Pattern B — Havuz batching.** Kesim, markalama, büküm üçü de aynı kalıbın tekrarı: spool detayda girilen veri → tip+spec'e göre filtrelenmiş havuz → batching/optimizasyon → makine → "yapıldı" sinyali → spool detayına geri yansıma. Aynı kalıp 3 kez tekrarlandı, 4. havuz için referans şablon hazır.

**Sebep:** Pattern adı olmadan her yeni sayfa kendi yöntemini icat eder. 5 havuz olduğunda 5 farklı uygulama çıkar; tutarsızlık geri-dönülemez bir teknik borçtur. İsim koymak = gelecekteki tutarlılığın sıfır maliyetli garantisi. 61'in sistem anatomisi tartışmasında her iki pattern de Cihat'ın kafasında oturmuş ama belgelerde adlandırılmamış olarak yakalandı.

**Uygulama kuralı:**
- Yeni özellik kararı verilirken zorunlu sorgu: *"Bu spool agregatına mı enjekte oluyor, yoksa yan tabloda mı duruyor?"* Yan tabloda duruyorsa spool detayı şişirme; agregata enjekte ediliyorsa enjeksiyon noktası standart olmalı (mevcut kesim/markalama/büküm referans alınır).
- Yeni batching ihtiyacında (4. havuz, 5. havuz) önce mevcut kesim/markalama/büküm pattern'i referans alınır, sıfırdan tasarım yapılmaz. Pattern'den sapma gerekçesi yazılı olarak belgelenir.

**Tetik koşulu:** Yok — koruyucu kural, anında geçerli.

---

### MK-62.2 — Foto tipi ayrımı: aşama-fotosu vs gözlem-fotosu (5 Mayıs 2026, 62. oturum)

**Karar:** `fotograflar` tablosunda `fotograf_tipi` kolonu zorunlu hâle gelir, iki değer alır:

- **`asama_fotosu`** — QR okutma akışından doğan otomatik foto. `imalat_asamasi` zorunlu (MK-61.2 kapsamı), `qr_referansi` zorunlu.
- **`gozlem_fotosu`** — yönetici sahada gözlem yaparken çektiği foto. `imalat_asamasi` NULL, `not` zorunlu, `uyari_olustur` boolean (true ise uyarılar sayfasına düşer).

**Sebep:** MK-61.2 foto aşamasını QR okutma session'ından alıyor. Ama yönetici sahada gezerken foto çekerse aktif QR session yok — *kişi → aşama* eşlemesi 61'in ana dersinde zaten reddedildi. Tek tabloda iki akışı `fotograf_tipi` ayrımı olmadan tutmak, `imalat_asamasi NULL`'unun anlamını bozar (eksik mi, gözlem mi belirsiz). Tip ayrımı = NULL'a anlam kazandırır + gözlem fotolarının uyarı kanalına bağlanmasının doğal yeri.

**Tasarım:**
- Mobile QR okutma akışında çekilen foto → `asama_fotosu` (otomatik).
- Yönetici sahada "Gözlem ekle" akışında çekilen foto → `gozlem_fotosu`, ekran alanları: foto + not (zorunlu) + "Bu bir uyarı oluştursun" checkbox'ı (opsiyonel).
- `uyari_olustur=true` ise `uyarilar` tablosuna kayıt düşer, uyarılar sayfasında görünür.
- DB constraint: `CHECK ((fotograf_tipi = 'asama_fotosu' AND imalat_asamasi IS NOT NULL) OR (fotograf_tipi = 'gozlem_fotosu' AND not IS NOT NULL))`.

**Tetik koşulu:** Schema kararı şimdi alınır (MK-61.2'nin temiz uygulanması için). Yönetici gözlem foto UI'ı tetik geldiğinde (sahada talep çıkarsa) eklenir, ama tablo şeması bugün bu ayrımı destekleyecek şekilde tasarlanır.



### MK-62.3 — `lang/` tek-otorite, `mobile/src/lang/` otomatik üretilir (5 Mayıs 2026, 62. oturum)

**Karar:** Repo kökündeki `lang/{tr,en,ar}.json` dosyaları i18n için tek-otorite kaynaktır. `mobile/src/lang/{tr,en,ar}.json` dizini her `npm run dev` ve `npm run build` öncesinde `predev`/`prebuild` script'i tarafından silinip kök `lang/`'dan yeniden kopyalanır (`rm -rf src/lang && cp ../lang/*.json src/lang/`).

Yeni i18n anahtarı eklenirken/güncellenirken hedef sadece `lang/{tr,en,ar}.json` dosyalarıdır. `mobile/src/lang/` dizinine elle yazılan her şey ilk dev/build çağrısında sessizce silinir — lint yakalamaz, runtime'da ham anahtar adları (`m_gr_email_lbl` gibi) UI'da görünür.

**Sebep:** 62'de bu tuzak gerçek hâliyle yaşandı. MGiris.jsx için 10 yeni anahtar `mobile/src/lang/`'a yazıldı. `npm run dev` çalışınca `predev` dizini sildi, kök `lang/`'dan kopyaladı, 10 anahtar uçtu. Tarayıcı henüz açılmadığı için fark edildi; açılsaydı dolaylı tespit gerekecekti. CLAUDE-MOBILE.md'deki "m_* anahtarlar 3 dilde senkron" notu kök `lang/` ile mobil senkronu ima ediyordu, ama mimarinin yönü açıkça yazılmamıştı.

**Uygulama kuralı:**
- Yeni mobil anahtar eklenirken hedef yalnızca `lang/{tr,en,ar}.json`. Mobil dizinine asla yazılmaz.
- Mobil ekran build'i debug edilirken anahtar görünmüyorsa önce `lang/`'a bakılır, ardından `mobile/src/lang/`'ın tarihçesi kontrol edilir (`stat` veya `git log`).
- Bu kural CLAUDE-MOBILE.md'de yazılı görünür hâle getirilir — 62 kapanışında satır eklenir.
- `mobile/src/lang/` dizinine 1 satırlık README.md eklenir: kaynak dizinin nerede olduğunu söyler.

**Tetik koşulu:** Yok — koruyucu kural, anında geçerli. CLAUDE-MOBILE.md satırı ve mobil dizin README'si bu oturum kapanışında yazılır.

---

### MK-63.A — DB sütun adlarını varsaymadan kanonik isimlerle çalış (6 Mayıs 2026, 63. oturum)

**Karar:** Yeni bir SELECT/INSERT/UPDATE yazılırken sütun adı **vanilla kodda nasıl geçiyorsa** öyle değil, **kanonik DB şemasında** nasıl tanımlıysa öyle yazılır. Ezbere yazılan ya da knowledge base'den hatırlanan ad şüphelidir, yazmadan önce şu üçünden biriyle doğrulanır: (1) `information_schema.columns` sorgusu, (2) Supabase MCP query, (3) güncel migration dosyası.

**Sebep:** 63'te `MDevreler` port'unda iki kez kolon-adı bug'ı yaşandı: `zone_no` (yok) → 4c7c77f fix(63.1) ile düzeltildi, `olusturulma` (yok, doğrusu `olusturma`) → b139a60 fix(63.5) ile düzeltildi. İki canlı 400 hatası, iki ek commit, ~10 dakika kayıp. Knowledge base'deki şema bilgisi her zaman bayat olabilir; kod yazımı sırasında kontrol gözden kaçtı.

**Geçerlilik:** ✅ Aktif. Yeni DB sorgusu yazarken kontrol zorunlu, atlandığında bir sonraki canlı testte 400 dönen sorgu sapmayı belgeler.

---

### MK-63.B — "Planlandı" notu yapılmamış değildir, vanilla cross-check zorunlu (6 Mayıs 2026, 63. oturum)

**Karar:** Bir önceki briefing/karar dosyasında *"X planlandı"* notu varsa, X'in yapılmamış olduğu varsayılmaz. Yapılıp yapılmadığı **vanilla kod** veya **git log** ile cross-check edilir, ardından devam edilir.

**Sebep:** 63'te QR payload formatı (`KOD-NUMARA:UUID`) 6. oturumda *"planlandı"* diye yazılmıştı; 7. oturumda implemente edilmişti ama 63 açılışında planlanmış-ama-yapılmamış varsayılıp eski format için kod yazıldı. Vanilla `qr.html` 5 dakikalık bir bakışla doğru formatı gösteriyordu, kontrol atlandı; 4ef6c6e + c7fe6e6 fix(63.4) ile payload parse düzeltilmek zorunda kalındı.

**Geçerlilik:** ✅ Aktif. Yeni port işlerinde "vanilla nasıl çalışıyor?" sorusu **planı okumadan önce** sorulur.

---

### MK-63.C — Knowledge base sayım/tarih bayatlığı; baseline komutlarıyla doğrulama (6 Mayıs 2026, 63. oturum)

**Karar:** Knowledge base'deki sayılar (lang anahtar adedi, dosya satır sayısı, son commit, bağımlılık sürümü) yazma zamanından bu yana güncelliğini yitirmiş olabilir. Sayıyla iş yapacak her oturum açılışında üç baseline komutu çalıştırılır: `wc -l <ilgili dosyalar>`, `git log --oneline -3`, `cat package.json` (veya ilgili manifest).

**Sebep:** 63'te knowledge base `mobile/src/lang/` altında 61 anahtarlı eski snapshot tutuyordu. Bu dizin 54. oturumda silinmiş ve `predev` script'i kök `lang/`'dan kopyalıyordu (MK-62.3); knowledge base bunu bilmiyordu. Açılışta `wc -l` veya `ls` çekilseydi sapma anlık yakalanırdı.

**Geçerlilik:** ✅ Aktif. `oturum-saglik.sh` (MK-55.1) zaten git baseline kontrolü yapıyor, 64+'da i18n anahtar sayımı baseline'a eklenebilir (66+ aday).

---

### MK-64.1 — claude.ai chat URL auto-link sorunu, kod editör zorunlu (6 Mayıs 2026, 64. oturum)

**Karar:** Kod düzenleme **terminal yapıştırması ile yapılmaz**. Doğrudan editör (VS Code / TextEdit, Smart Quotes/Dashes kapalı) kullanılır. Terminal yapıştırması yalnızca komut satırı için (örn. `git commit`, `cp`, `npm run dev`) kullanılır.

**Sebep:** claude.ai chat arayüzü, yapıştırılan terminal çıktısındaki nokta-ayrımlı identifier'ları (örn. `sd.session.user.id`, `e.target.value`, `os.path.expanduser`) otomatik olarak markdown linke çeviriyor: `[sd.session.user.id](http://sd.session.user.id)`. Sed/Python heredoc komutları içinde böyle identifier varsa terminal yapıştırmasında köşeli parantez + URL yapısı kodu bozar. 64'te 3 kez yaşandı (MIsBaslat.jsx 64. satır, isbaslat.js 101. satır + bir tane daha), her seferinde ek tur attırdı. 65'te tekrar oluştu (MK-65.7 — devam kararı).

**Geçerlilik:** ✅ Aktif. Çoklu satır kod yamaları her zaman editörde, terminale yapıştırmadan.

---

### MK-64.2 — Mobile React + ares-mobile.css bağlama (6 Mayıs 2026, 64. oturum)

**Karar:** Mobile React projesi (`mobile/`) vanilla CSS class'larını otomatik almaz. Vanilla'dan adapte edilen ekranlarda ortak class kullanılacaksa (`m-card-item`, `m-bottomnav`, `m-topbar` vb.) `mobile/public/ares-mobile.css` + `mobile/index.html` `<link>` zinciri devrede olmalıdır. Yeni komponent yazımında bu class'lar import gerektirmeden kullanılabilir.

**Sebep:** 64. oturumdan önceki React komponentleri (MIslemler, MAnasayfa, MAnasayfaYonetici) tamamen inline-style kullandığı için CSS bağlama ihtiyacı doğmamıştı. 64'te MTopBar/MBottomNav ortak komponentleri için `m-card-item` / `m-bottomnav` class'ları gerekti; CSS bağlama tamamlandı, sonraki komponentler bu altyapıyı bedava kullanır.

**Geçerlilik:** ✅ Aktif. 65'te IbRolSec/IbQRTara bu altyapıyı kullandı, 66+ ekranlarda da aynen geçerli.

---

### MK-64.3 — Lang master = root `lang/` (MK-62.3'ün güçlendirilmiş tekrarı) (6 Mayıs 2026, 64. oturum)

**Karar:** Mobile React build-time'da `prebuild` script'i (`rm -rf src/lang && mkdir -p src/lang && cp ../lang/*.json src/lang/`) ile senkronize eder. Doğrudan `mobile/src/lang/`'a yapılan değişiklikler bir sonraki dev/build'te override olur, git status'ta da görünmez. Yeni i18n anahtarı eklerken hedef **her zaman** `lang/{tr,en,ar}.json` (kök) olur.

**Sebep:** Bu MK-62.3 ile aynı kararın güçlendirilmiş yeniden yazımıdır. 62'de tuzak gerçek hâliyle yaşandı (10 anahtar uçtu); 64'te de aynı tuzağa düşme riski oluştu, kontrol noktasında MK-62.3 hatırlatıldı. CLAUDE-MOBILE.md satır 184'teki uyarı genişletildi.

**Geçerlilik:** ✅ Aktif. MK-62.3 ile birlikte tek-otorite kuralı koruyor.

---

### MK-64.4 — `kullanicilar` tablosunda `auth_id` kolonu yoktur (6 Mayıs 2026, 64. oturum)

**Karar:** `kullanicilar.id` doğrudan `auth.users.id` ile aynı UUID'dir. Kullanıcı sorgusu **her zaman** `.eq('id', session.user.id)` kalıbıyla yazılır; `auth_id` kolonu **yok**.

**Sebep:** 64'te MIsBaslat.jsx'in kullanıcı sorgusunda `auth_id` kullanıldı, canlı testte 400 hatası döndü. 00817de fix(64) ile düzeltildi. MAnasayfa.jsx ve App.jsx zaten doğru pattern'i kullanıyordu, referans alınmadan yazılmıştı.

**Geçerlilik:** ✅ Aktif. Yeni sayfada kullanıcı sorgusu yazılırken pattern: `.eq('id', session.user.id)`.

---

### MK-64.5 — `yetki_bloklari` tablosunda `tip` kolonu yoktur (6 Mayıs 2026, 64. oturum)

**Karar:** `yetki_bloklari` tablosunun gerçek kolonları: `id, ad, renk` (+ standart `olusturma`/`guncelleme`). `tip` **yok** — vanilla'daki `is_islem_blogu_mu()` fonksiyonu blok adına göre çalışır, kod tarafında `ISLEM_BLOK_ADLARI` listesi ile karşılaştırma yapar; DB'de `tip` enum'ı tutulmaz.

**Sebep:** 64'te SELECT'e `yetki_bloklari(id, ad, renk, tip)` yazıldı, canlı testte 400 hatası döndü. b077cff fix(64) ile düzeltildi.

**Geçerlilik:** ✅ Aktif. Blok-tip ayrımı UI tarafında ad listesi karşılaştırmasıyla yapılır.

---

### MK-65.1 — Lang merge script'i `~/Downloads/` path konvansiyonu kullanır (6 Mayıs 2026, 65. oturum)

**Karar:** Claude'un verdiği dosyalar Cihat'ın Mac'inde **her zaman** `~/Downloads/` altına iner. Lang merge / batch dosya işleme script'leri `/mnt/user-data/outputs/` yerine `os.path.expanduser('~/Downloads')` veya bash'te `$DL` (`export DL=~/Downloads`) kullanır.

**Sebep:** 65'te ilk önerilen `python3 -c` script'i `/mnt/user-data/outputs/` path'ini kullanıyordu; bu sandbox path'i Cihat'ın Mac'inde mevcut değil, "No such file or directory" hatasıyla durdu. `~/Downloads` ile yeniden yazılınca çalıştı.

**Geçerlilik:** ✅ Aktif. Sonraki oturumlarda dosya entegrasyon komutları bu konvansiyonu kullanır.

---

### MK-65.2 — Mobile React tarafında 6-haneli spool_id format (geçici fix, kalıcı çözüm normalize.js) (6 Mayıs 2026, 65. oturum)

**Karar:** DB'de spool_id `<TENANT>-<6_HANELI_PADDED>` formatında saklanır (örn. `A-000575`, 8. oturum sayaç digits=6 kararı). Mobile React tarafında manuel girişte `padStart(6, '0')` ile bu formata dönüştürme yapılır. Bu **geçici fix**'tir; **kalıcı çözüm** `mobile/src/lib/normalize.js` portudur (`ares-normalize.js`'in mobile karşılığı, `markaId()` + `marka()` + `revFmt()` + `malzemeEtiket()` helper'ları).

**Sebep:** 65'te IbQRTara manuel girişte `tenantKod + '-' + manuelDeger.trim()` kullandı; Cihat `0001` aradı, `A-0001` üretti, DB'de `A-000001` olduğu için bulamadı. Ek olarak eski legacy spool'lar (`0169`, `0170`) prefix'siz 4-haneli, ama bunlar artık ana akışta değil. 65'te `padStart(6, '0')` direkt IbQRTara'ya yazıldı, normalize.js portu 66'ya bırakıldı.

**Geçerlilik:** ✅ Geçici aktif. 66 birincil iş #2 olarak kalıcı normalize.js port'u yazılır, ardından geçici padStart kaldırılır.

---

### MK-65.3 — Hub kontrolleri Ekran 4 (uyarı) mockup'ından önce yazılmaz (6 Mayıs 2026, 65. oturum)

**Karar:** İş başlatma akışında uyarı/uyumsuzluk kontrolleri (`is_durumu === 'devam_ediyor'`, `aktif_basamak` × rol matrisi, cross-tenant) **gerçek DB değerleriyle doğrulanmadan** ve **Ekran 4 (uyarı) mockup'ı tasarlanmadan** kod tarafında yazılmaz. False-positive uyarı kullanıcıyı yorar, akış UX'i bozulur.

**Sebep:** 65'te ilk versiyonda kontroller yazılmıştı, ama rol haritası tahminliydi (gerçek DB değerleri `on_imalat`, `alim_kontrol` brifing'te yoktu). Test sırasında her spool Ekran 4 placeholder'a düştü, Cihat'ın doğal akışı (Büküm rolü → A-000575 spool → spool detayı görmek) bozuldu. Tüm kontroller askıya alındı, `aktifBasamakRolaUyumlu` helper'ı isbaslat.js'te export edili kaldı (66'da kullanılır).

**Geçerlilik:** ✅ Aktif. 66'da Ekran 4 mockup turu + `aktif_basamak` × rol matrix tablosu birlikte yazılır, kontroller ondan sonra kod tarafına döner.

---

### MK-65.4 — Rol chip / durum chip görsel tutarlılık (6 Mayıs 2026, 65. oturum)

**Karar:** Kameralı / dinamik arka planlı ekranlarda chip stilleri tek bir görsel dile sabitlenir: **koyu opak arka plan** (`rgba(13,18,28,0.9)` civarı) + **2px solid renkli border** (rolün veya durumun rengi) + **box shadow**. Transparan beyaz arka plan + ince border kombinasyonu **yasak** — kameralı/açık arka planlarda zorla okunur.

**Sebep:** 65'te ilk roleChip stili `rgba(255,255,255,0.13)` arka plan + `1px rgba(255,255,255,0.3)` border ile yazıldı; kameralı arka planda chip yazısı kayboldu. Durum chip pattern'i (zaten koyu opak) referans alınarak hizalandı. İki chip artık aynı görsel dilde, kullanıcı algısı tutarlı.

**Geçerlilik:** ✅ Aktif. Yeni dinamik arka planlı ekranlarda chip stili default olarak bu pattern'le açılır.

---

### MK-65.5 — Hub'a gömülü component'lerde navigate yerine callback (6 Mayıs 2026, 65. oturum)

**Karar:** Bir hub komponent (örn. MIsBaslat) içine gömülü alt komponent (örn. IbQRTara, IbRolSec, IbSpoolDetay), router üzerinde **navigate** çağırmaz. Bunun yerine hub'ın geçirdiği callback prop'larını kullanır (örn. `onGeri`, `onSpoolBulundu`, `onCrossTenant`, `onIslemBaslat`). Hub ekran geçişini kendi state machine'iyle yönetir (`setAktifEkran`).

**Sebep:** 65'te IbQRTara'nın geri butonu MQRTara stand-alone versiyonundan kopya `navigate(-1)` çağırıyordu; bu çağrı hub'ın state machine'ini bypass etti, kullanıcıyı `/is-baslat`'tan tamamen çıkardı. setAktifEkran('rolSec') pattern'iyle düzeltildi. Hub'a gömülü component yazımında en kolay düşülen tuzak.

**Geçerlilik:** ✅ Aktif. Yeni hub-altı bileşenlerde navigate kullanılmaz; her geçiş callback üzerinden hub'a bildirilir.

---

### MK-65.6 — Kart tıklama → QR shortcut UX kararı (6 Mayıs 2026, 65. oturum)

**Karar:** MIsBaslat'ta rol kartına tıklama = **rol seç + direkt QR ekranını aç** (kısa yol). FAB ise rol değiştirmeden, hatırlanan rolle, tekrar QR açmak için (kart tıklamadan).

**Sebep:** 64. oturumun v4 mockup'ında *"tek yetki için otomatik geçiş kaldırıldı"* kararı vardı; bu karar **otomatik atlama**'yı kapsıyordu (sayfa açılır açılmaz tek role atla), **kart tıklama**'yı değil. 65'te Cihat'ın niyeti netleşti: kart tıklama açıkça bir kullanıcı eylemi, otomatik atlama değil. İkisi farklı UX olayları.

**Geçerlilik:** ✅ Aktif. IbRolSec callback'inde `setAktifEkran('qr')` çalışır.

---

### MK-65.7 — claude.ai URL auto-link sorunu sürdü (MK-64.1 devam) (6 Mayıs 2026, 65. oturum)

**Karar:** MK-64.1 aynen geçerli; 65'te tekrar yaşandı (`os.path.expanduser('~/Downloads')` linke dönüşmedi ✓ ama `e.target.value` gibi nokta-ayrımlı identifier'lar yine risk taşıyor). Bu karar yeni bir kural eklemez, MK-64.1'in genelliğini doğrular.

**Sebep:** 64'te 3 kez, 65'te 1 kez tekrar oldu. Tetik koşulu: kod parçası terminal yapıştırması üzerinden gönderildiğinde. Editör kullanımı zorunluluğu pekişti.

**Geçerlilik:** ✅ Aktif. MK-64.1'in pekiştirilmesi.

---

### MK-65.8 — Sapmama protokolü ihlalleri + kapanış mimarisinin kırıldığı an (6 Mayıs 2026, 65. oturum, KRİTİK)

**Karar:** Bu karar 65'in kapanışında fark edilen ÜÇ sapmanın belgelenmesi ve gelecek için mekanik koruma çağrısıdır:

**Sapma 1 — MK-52.1 ihlali (`arespipe_kopyala` atlandı):** Cihat 65'te 4-5 kez `~/Downloads/` → repo dosya transferi yaptı, hiçbirinde MD5 doğrulamalı `arespipe_kopyala` helper'ı kullanılmadı, düz `cp $DL/X /path/...` çalıştırıldı. macOS'un `(1)`, `(2)` suffix riski koruyamadı (şanslıyız ki sorun çıkmadı).

**Sapma 2 — MK-52.2 ihlali (`gp` atlandı):** Push reddedildiğinde `git pull --rebase` + `git push` manuel zinciri kullanıldı, `gp` (otomatik rebase + push helper'ı) çağrılmadı.

**Sapma 3 — MK-56.2 ihlali (KAPANIŞ MİMARİSİ KIRILDI):** 65'in kapanışında `.github/son-durum.md` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` üçüsü yazıldı. Bu **MK-56.2 öncesi (56'dan eski) mimari**. MK-56.2 ile bu üç dosya 56'da `docs/arsiv/`'a taşınmış, BRIEFING.md tek aktif bağlam dosyası olmuştu. 63-64-65 boyunca compact konuşmalarda bu mimari değişimi gözden kaçtı, dosyalar yeniden canlandı. 65 kapanışında MK-65.8 kararı **eski mimari içinde** yazıldı (3 dosyayı tamamlama, bd24774); 66 açılışında gerçek düzeltme yapıldı (193e49f commit'i ile üç dosya `docs/arsiv/*-yanlis-yazim.md` adıyla arşive taşındı, BRIEFING.md ve KARARLAR.md restorasyonu yapıldı).

**Kök neden (üçü için ortak):** Oturum 7. saatine girmişti, fast-forward kapanış. Mekanik kapı (script) çağrılmadı. **Eğer `oturum-saglik.sh 65 --kapanis` (MK-60.3) çağrılsaydı:** BRIEFING.md başlık kontrolü Sapma 3'ü yakalardı (script *"# AresPipe BRIEFING — 65. Oturum Kapanışı"* arar, bulamayınca BAYAT döndürürdü). Sapma 1 ve 2 script kapsamında değil, ama `--kapanis` çıktısındaki commit listesi turundan Cihat farkına vardırılırdı.

**Çözüm (66+ için kalıcı):**
1. **Kapanış başlangıcında zorunlu komut:** `./scripts/oturum-saglik.sh N --kapanis` her oturum sonunda çalıştırılır. Çıktısı yeşil değilse kapanış commit'i atılmaz.
2. **Claude tarafında otomatik kontrol:** Kullanıcı *"X'i kapatıyoruz"* dediği anda Claude şu üçünü tek seferde kontrol eder: (a) BRIEFING.md başlık güncel mi (N. Oturum Kapanışı yazıyor mu), (b) `arespipe_kopyala` her dosya transferinde kullanıldı mı, (c) `gp` push'larda kullanıldı mı. Eksik varsa kapanışa geçmeden tamamlatır.
3. **Eski 3-dosya mimarisi yasak:** `.github/son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` **YAZILMAZ** (MK-56.2). Bağlam BRIEFING.md, kararlar KARARLAR.md, kapanış orkestra script'i + Claude raporu (MK-56.4 / MK-60.3). Bu üç dosya repo köküne tekrar dönerse bu MK-56.2 ihlali kabul edilir, derhal arşive taşınır.

**Geçerlilik:** ✅ Aktif (KRİTİK). Bu karar MK-52.1, MK-52.2, MK-56.2, MK-56.4, MK-60.3'ün hepsini birlikte canlı tutan bekçi karardır. 66 açılışında bu sapmanın delili `docs/arsiv/*-yanlis-yazim.md` dosyaları ve 193e49f commit'i ile korundu.


## MK-66.1 — Migration dosya adı sıralı, oturum numarasından bağımsız (6 Mayıs 2026)

**Bağlam:** 66'da Supabase RLS güvenlik fix'i için ilk migration yazılırken dosya adı `066_rls_fix_5_tablo.sql` olarak verildi (oturum numarasıyla karıştırıldı). Cihat fark etti — repo'daki son migration `031_public_views_ve_rls.sql`, sıralı devam etmesi gerekiyordu. Düzeltme: `032_rls_fix_5_tablo.sql`.

**Karar:** Migration dosya adı **sıralı (NNN_)**, oturum numarasından **bağımsız**. Mevcut son numaranın bir fazlası alınır. Oturum referansı dosya yorumunda verilir, dosya numarasında değil.

**Format (`migrations/README.md` korundu):**
```
NNN_kisa_aciklama.sql
```
- 3 haneli sıra numarası (000, 001, ..., 099, 100)
- snake_case açıklama, 2-5 kelime
- Header yorum: Tarih + Oturum + Amac + Idempotent
- BEGIN/COMMIT atomik (psql uyumu için, MK-66.5 ile birlikte)
- DROP POLICY IF EXISTS + CREATE POLICY (idempotent)
- Geri alma notu zorunlu

**Uygulama:**
```bash
ls migrations/ | tail -3                    # son numarayı bul
# NNN'yi +1 yap, dosyayı yaz
# Supabase SQL Editor'de çalıştır
# Doğrulama yap
git add migrations/NNN_*.sql
git commit -m "..."
gp
```

**Etki:** 66'da `032_rls_fix_5_tablo.sql` ve `033_tenant_features_eski_policy_temizlik.sql` bu disipline göre yazıldı, her ikisi de header'da "Oturum: 66" yazıyor.

---

## MK-66.2 — RLS aktif eden migration'larda eski policy taraması zorunlu (6 Mayıs 2026)

**Bağlam:** 66'da `tenant_features` tablosuna RLS aktif edildikten sonra doğrulama sorgusunda **10 policy** çıktı (beklenen 8). İki eski policy zaten yazılıydı ama RLS kapalı olduğu için "uyuyordu":
- `tenant_features_all` — `USING (true)`, roles `{public}`, cmd `ALL` → **fiilen RLS bypass** ediyordu, 032'nin yeni policy'lerini iptal ediyordu, anon dahil herkese tam erişim veriyordu.
- `super_admin_feature_yonet` — eski JWT path (`auth.jwt() -> 'app_metadata' ->> 'rol'`), 032'nin yeni policy'siyle (`auth.jwt() ->> 'rol'`) duplikat.

**Karar:** RLS aktif eden migration'larda her tabloya policy yazmadan **önce** `pg_policies` taraması yapılır. Boş dönmüyorsa eski policy'ler ya migration'a `DROP IF EXISTS` ile dahil edilir ya da uyumlu hale getirilir. Özellikle **`USING (true)` görünce alarm** — bu RLS'i fiilen kapatır.

**Tarama sorgusu:**
```sql
SELECT policyname, cmd, qual, with_check, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'X';
```

**Tehlike sinyalleri:**
- `qual = 'true'` veya `qual IS NULL` (cmd ALL/SELECT için) → RLS bypass
- `roles = '{public}'` → anon erişim (authenticated yerine olmalı)
- Yeni policy ile aynı cmd'ye sahip eski policy → OR mantığı çakışması (genelde sorun değil ama temizlenmeli)

**Etki:** `migrations/033_tenant_features_eski_policy_temizlik.sql` bu kararın doğum belgesi. Diğer 4 tablo (testler, egitim_verisi, yetki_tanimlari, basamak_sablonlari) tarandı, eski policy yoktu, 032 tek başına yeterli oldu.

---

## MK-66.3 — Mockup-first turunda vanilla'yı bütün okumadan iterasyona başlama yasağı (6 Mayıs 2026)

**Bağlam:** 66'da MIsBaslat Ekran 3 (IbSpoolDetay) için mockup-first protokolü (R-10) başlatıldı. Vanilla referansı olarak `is_baslat.html` repo'da 1772 satırdı, **prod 1930 satırdı** — 158 satır boşluk fark edilmeden 4 iterasyon harcandı. Cihat 4. iterasyondan sonra "ben hatırlamıyorum" deyince kontrol yapıldı, fark çıktı. 7 iterasyon sonunda hâlâ prod'a girecek tasarım bulunamadı, oturum kapatıldı. Bu MK-63.B'nin (knowledge base güncel olmayabilir, vanilla cross-check zorunlu) tam tetiklenmesi.

**Karar:** Mockup-first turunda iterasyona başlamadan önce vanilla'nın gerçek satır sayısı + kritik fonksiyonlar grep'lenir. Sadece repo'daki dosyaya değil, **prod'a güncel olan dosyaya** bakılır.

**Açılış protokolü:**
1. Repo'daki vanilla satır sayısı + son commit tarihi → `wc -l X.html && git log -1 X.html`
2. Cihat'tan prod'un güncel olup olmadığını sor → uyumsuzsa Cihat kopyala-yapıştırla prod versiyonunu verir
3. Kritik fonksiyonların kaynaklarını grep'le çıkar (örnek: `uyarilariTopla`, `ROL_BASAMAKLAR`, foot CTA dinamik mantığı)
4. Cihat'a açılış sorusu: **"Mevcut ekran prod'da çalışıyor — neyi değiştirmek istiyoruz?"**
5. Özgür tasarım YASAK — özellikle yorgun oturumlarda "sana özgür tasarım yapayım mı?" sorusu Cihat'ı daha çok yorar, geri besleme döngüsü uzar.

**Etki:** 67 açılışında Ekran 3 mockup turu yeniden başlarsa bu protokole uyulur. Alternatif yollar (Ekran 7 veya normalize.js portu) daha az tartışmalı, sıcak temas için tercih edilebilir.

---

## MK-66.5 — Supabase SQL Editor BEGIN/COMMIT kabul etmiyor, dosyada kalır ama atlanır (6 Mayıs 2026)

**Bağlam:** 66'da `migrations/033_tenant_features_eski_policy_temizlik.sql` Supabase SQL Editor'e yapıştırıldığında `ERROR: 42601: syntax error at or near ";"` ve `LINE 44: BEGIN;` hatası verdi. Sebep: Supabase SQL Editor zaten kendi transaction'ında çalışıyor, nested `BEGIN`/`COMMIT` kabul etmiyor.

**Karar:** Migration dosyasında BEGIN/COMMIT **kalır** (psql uyumu için, README.md disiplini gereği), ama Supabase SQL Editor'de manuel çalıştırırken **atlanır** — sadece DDL/DML komutları yapıştırılır.

**Pratik:**
- **Dosyada:** BEGIN; ... COMMIT; (kanonik form, atomik intent belgesi)
- **SQL Editor'de:** sadece içerideki komutlar yapıştırılır
- **psql ile:** dosya olduğu gibi çalıştırılır (`psql ... < migrations/NNN_*.sql`)

**Alternatif çözüm (gelecekte):** Supabase CLI (`supabase db push`) entegrasyonu kurulursa BEGIN/COMMIT olduğu gibi çalışır. Şu an manuel SQL Editor disiplini kullanıldığı için bu workaround geçerli.

**Etki:** 67'de prod Supabase'inde 032+033 koşulurken aynı yöntem kullanılır.

---

## MK-66.4 — boş bırakıldı (numara rezerve, 6 Mayıs 2026 itibarıyla içerik yok)

Numaralandırma sırasında 66.4 atlandı (66.5 doğrudan tahsis edildi). Gelecek bir karar için saklanır veya kalıcı olarak boş bırakılabilir.

---

## MK-67.1 — Tek Supabase ortamı (dev = prod, 7 Mayıs 2026)

**Bağlam:** 66 BRIEFING'i 67'nin birinci işi olarak "prod RLS migration — `032+033` prod Supabase'inde koşulur, dev'le senkron olur" diye verdi. 67 açılışında prod ref'i araştırıldığında üç doğrulama eş zamanlı yapıldı:
1. Vercel `arespipe` projesi env: `SUPABASE_URL = https://ochvbepfiatzvyknkvsn.supabase.co`
2. Repo geneli grep: `grep -r "supabase.co" ...` → tek URL `ochvbepfiatzvyknkvsn.supabase.co`
3. `mobile/src/lib/supabase.js` hardcoded: aynı URL

`arespipe-dev` adı tek Supabase projesinin ismi, ayrı bir prod projesi yok. Hem `arespipe.vercel.app` (web) hem `arespipe-mob.vercel.app` (mobil) bu tek projeye bağlı. 66'da yapılan `032+033` migration'ları aslında dev değil, fiilen **canlı veriyi etkileyen tek ortam** üzerinde koşulmuş.

**Karar:** AresPipe şu an tek Supabase ortamında çalışır. "dev'e migration koş, sonra prod'a da koş" akışı **yoktur**. Tek koşum, canlı veri.

**Sonuçlar:**
- BRIEFING'in açılış ritüelinden "Prod RLS migration" maddesi çıkarıldı
- Sıralı disiplin (MK-66.1) ve `pg_policies` tarama disiplini (MK-66.2) **aynen geçerli**, hatta tek ortam olduğu için DAHA kritik — yanlış migration kurtarılacak başka kopya yok
- 66'daki "smoke test atlandı, yeşilse commit" notu (BRIEFING) aslında canlı sistemde doğrulanmamış migration anlamına geliyordu — bu doğrulukla kayda alındı

**Risk:** Tek ortam = canlı veri üstünde geliştirme. ROADMAP Faz C'de (33+ ileri oturum) staging Supabase planı duruyor. O zamana kadar bilinçli kabul. Migration'ları küçük tut, `BEGIN`/`ROLLBACK` ile lokal dene mümkünse, `pg_policies` + `pg_tables` taramasını her zaman yap.

**İlişkili:** MK-66.1 (sıralı migration), MK-66.2 (policy taraması), ROADMAP Faz C (staging projesi).

---

## MK-67.2 — `mobile/src/lib/normalize.js` canonical, `format.js` köprülü (7 Mayıs 2026)

**Bağlam:** Web tarafı `ares-normalize.js` (kök, 251 satır) AresPipe'ın enum normalize + lokalize etiket + uyum matrisi + marka format kanonik kaynağı. Mobile tarafında 60. oturumda `mobile/src/lib/format.js` doğmuştu — içinde `revFmt`, `markaHesapla`, `malzemeEtiket` üç fonksiyonu vanilla'dan birebir kopyalanmıştı (kod tekrarı). 65'te `IbQRTara`'da `padStart(6, '0')` geçici fix yazıldığında BRIEFING "kalıcı çözüm `mobile/src/lib/normalize.js` portu" demişti.

67 açılışında üç port stratejisi tartışıldı:
- **B0**: `format.js` dokunulmaz, `normalize.js` doğar — iki kaynak yan yana
- **B düz**: `format.js`'ten 3 fonksiyon silinir, ekran import'ları güncellenir
- **B2.5 (köprülü)**: `normalize.js` canonical, `format.js` 3 satır re-export + 1 adapter

Cihat "ekranlar bozulmasın" sorumluluğu nedeniyle B2.5 seçildi.

**Karar:** Mobil tarafta enum normalize tek kanonik kaynak `mobile/src/lib/normalize.js`. ES module export'lar, web ile birebir semantik. `format.js` 3 fonksiyon için ince köprü:
- `revFmt` → `normalize.js`'ten re-export (web semantik: alfanumerik destekli, "RevA" gibi)
- `malzemeEtiket` → `normalize.js`'ten re-export (kod + ham kabul)
- `markaHesapla` → object-wrapper, içeride `marka(...parts)` çağırır (mobil ergonomi: `(sp, devre, proje)` imzası korundu)

**Web tarafı dokunulmadı.** `is_baslat.html`, `ares-normalize.js`, `admin/`, `portal/` aynen kalır.

**Geliştirici kuralı:**
- Yeni fonksiyon eklenecekse `normalize.js`'e eklenir, `format.js`'e değil
- `format.js` UI helper'lar (`nNRenkler`, `formatSpoolId`, `alistirmaBilgi`, `formatTarih*`, `formatSure`, `esc`) için kalır — bunlar mobil-özgü, port edilmez
- Ekran 3+ implementasyonunda `yuzeyEtiket`, `kaliteGoster`, `uyumlu` gibi yeni fonksiyonlar **doğrudan** `normalize.js`'ten import edilir

**Davranış değişiklikleri:**
- `revFmt('A')` artık `'RevA'` döner (eski `Number(rev)` defensive sürüm `''` dönerdi). DB'de `rev = 'A'` varsa otomatik düzgün gösterilecek
- `malzemeEtiket('ST37', tv)` artık `'Karbon Çelik'` döner (eski mobil sadece kod kabul ediyordu, ham fail ediyordu)

**Etki:** Commit `c42325b`. Build `91 modules`, bundle 775.16 → 775.96 KB (+800 byte). 2 ekran (`MSpoolDetay.jsx`, `MDevreDetay.jsx`) import satırlarına dokunulmadı, davranış aynı.

**İlişkili:** MK-56.2 (tek canonical kaynak disiplini), MK-65.2 (`padStart(6)` borç teyit — MK-67.5'te netleşti).

---

## MK-67.3 — `firma_admin` rolü `yoneticiMi` kapsamına alındı (geçici, 7 Mayıs 2026)

**Bağlam:** 67 mid-session'da Cihat "ana sayfada kalıyoruz, ilerlenmiyor" dedi. Araştırma:
- `MAnasayfa.jsx` rol bazlı router → `yoneticiMi(kullanici)` true ise dashboard, false ise `MIslemler` (büyük buton listesi)
- `yoneticiMi` sadece `super_admin` + `yonetici` kabul ediyor
- DB'deki rol dağılımı: `super_admin`, `yonetici`, `firma_admin`, `kk_uzmani`, `operatör`
- Cihat'ın hesabı (`cihatoztas@gmail.com`) `firma_admin` → MIslemler'e düşüyor → "imalat / kaynak" kart listesi → kafa karışıklığı

**Karar (geçici):** `yoneticiMi`'ye `firma_admin` eklendi. Üç rol dashboard görür: `super_admin`, `yonetici`, `firma_admin`.

```js
return ['super_admin', 'yonetici', 'firma_admin'].includes(kullanici.rol)
```

**Neden geçici:** `firma_admin` semantiği `super_admin`/`yonetici`'den farklı:
- `super_admin` — tüm tenant'lara erişim
- `yonetici` — kendi tenant'ı + yönetim yetkileri
- `firma_admin` — kendi tenant'ı + sadece kendi firma yetkileri (sınırlı)
- `kk_uzmani` — sadece KK akışı
- `operatör` — sadece operatör akışı

`firma_admin`'in dashboard görmesi mantıklı (firma genel durumu önemli) ama `yoneticiMi` fonksiyonu **dashboard görme yetkisi** ile **yönetim aksiyonları yetkisi**ni karıştırıyor. İleride dashboard erişimi ile yönetim aksiyonları ayrı yetkilere bölünmeli.

**Açık borç:** 68 veya sonrasında yetki haritası gözden geçirilir. Olası ayrım:
- `dashboardYetkili(kullanici)` — kim dashboard görür (super_admin, yonetici, firma_admin)
- `yoneticiMi(kullanici)` — kim yönetim aksiyonları yapar (super_admin, yonetici)
- `superAdminMi(kullanici)` — kim cross-tenant aksiyon yapar (super_admin)

`kk_uzmani` ve `operatör` MIslemler ekranını görmeye devam eder (yetki bloklarına göre büyük buton listesi).

**Yan etkiler (aynı commit):**
- `MAnasayfaYonetici` "İşlem Başlat" butonu `/islemler` yerine `/is-baslat`'a yönlendirildi (vanilla MIsBaslat React akışına geçiş noktası)
- Bekleyen Spool ve KK Bekleyen stat kartları `yakinda(...)` alert yerine `/devreler`'e bağlandı (filtreli liste sonra eklenir)
- App.jsx'e `/ara` ve `/bildirim` placeholder route'ları eklendi (`MYakinda` inline komponenti) — bottom nav loop'unu kapattı

**Etki:** Commit `088c9b4`. 3 dosya, 60 insertion / 5 deletion.

**İlişkili:** ROADMAP yetki haritası genişletmesi, MK-25 yetki sistemi (eski).

---

## MK-67.4 — Supabase API key migration (sb_publishable / sb_secret), 69'a ertelendi (7 Mayıs 2026)

**Bağlam:** 67 kapanışına yakın `arespipe-backups` GitHub Action workflow'u "All jobs have failed" maili attı. İnceleme:
- Son başarılı backup: `2026-05-01_03-55-15` UTC (1 hafta önce)
- DB dump ✓ geçiyor (31s, password connection string kullanıyor, JWT'ye bağlı değil)
- Storage backup ✗ (`InvalidAccessKeyId: The Access Key Id you provided does not exist in our records`)
- Hem S3 path (`rclone`) hem HTTP fallback path (`curl + Authorization: Bearer ${SERVICE_KEY}`) fail

Supabase Dashboard → Settings → API Keys incelemesi:
- **"Your new API keys are here"** banner görünüyor
- Yeni format: `sb_publishable_*` (frontend) + `sb_secret_*` (backend)
- Eski JWT-tabanlı `anon` + `service_role` artık "Legacy anon, service_role API keys" sekmesine düşmüş
- "Secret keys" listesi → "No secret API keys found" (yeni format'ta hiç yok)

Supabase 2026 başında API key sistemini yenilemiş. Eski `service_role` JWT muhtemelen invalide edildi (büyük ihtimalle 66'da yaptığımız RLS güvenlik fix'inin tetiklediği güvenlik politikası kapsamında). Mobil + web hâlâ çalışıyor — Supabase grace period'da legacy key'leri kabul etmeye devam ediyor, ama ne zaman keseceği belirsiz.

`arespipe-backups` workflow'u zaten yanlış konfigure: rclone S3 config'inde `access_key_id` olarak proje ref kullanıyor (`access_key_id = ${SUPABASE_HOST%%.*}`) — bu hiç çalışmamış olmalı. HTTP fallback şu ana kadar kurtarmış.

**Karar:** Bu kapsamlı migration **69. oturumun birinci işi.** 67'de yarım yamalak yapma riski yüksek, 67 ana mesai başka konuda (Ekran 3 mockup + dashboard fix). 68 zaten dolu (Ekran 3 + Ekran 4 implementasyonu).

**69. oturum işleri:**
1. Supabase Dashboard'da yeni `sb_secret_*` oluştur, GitHub Secrets güncelle (`SUPABASE_SERVICE_KEY`)
2. Mobil `mobile/src/lib/supabase.js` + web `ares-store.js` + `admin/index.html` + `sw.js` eski JWT → yeni `sb_publishable_*` migration
3. Vercel env vars (web + mob projeleri) update — kontrollü migration için önce yeni key'i ekle (eski JWT yanına), test et, sonra eski JWT'yi sil
4. `arespipe-backups` workflow temizle: S3 mantığı sil (zaten yanlış), sadece HTTP API kullan
5. Smoke test: mobil giriş, web giriş, RLS kontrolleri (66'da fix'lenen 5 tablo + tenant_features), backup workflow re-run
6. Supabase'in legacy key timeout tarihini öğren — Dashboard banner'ında veya mailde olabilir

**Risk:** Legacy key'ler bir sabah uyandığımızda kesilirse hem mobil hem web aniden 401 atar. Migration'ı kontrollü yapmak için **yeni key'i mevcut JWT'nin yanına** ekle, test et, sonra eski JWT'yi sil.

**Geçici durum (67-68 arası):** DB backup'lar zaten çalışıyor (en kritik). Storage backup fail — son storage backup 1 Mayıs (1 hafta önce, hâlâ 30 günlük retention içinde). Storage'da yeni dosyalar varsa şimdilik yedeksiz, ama 69'da düzgün migration sonrası geri başlar.

**İlişkili:** MK-66.2 (RLS policy taraması — yeni key'ler RLS'ye dokunmaz), `arespipe-backups` repo, Vercel `arespipe` + `arespipe-mob` projeleri, Supabase legacy key sunset roadmap.

---

## MK-67.5 — MK-65.2 yanlış teşhis: `padStart(6, '0')` geçici fix değil, kanonik DB-arama format (7 Mayıs 2026)

**Bağlam:** 65. oturumda `IbQRTara.jsx`'te (manuel input, satır 362) yazılmış kod:

```js
const tamId = tenantKod + '-' + num.padStart(6, '0')
```

65'te bu "geçici fix" olarak etiketlendi (MK-65.2), kalıcı çözüm "`mobile/src/lib/normalize.js` portu" diye verildi. 67'de port tamamlandı, MK-65.2 cleanup adımına geçildiğinde kod gerçekten incelendi:

```js
function manuelGonder() {
  if (!manuelDeger.trim()) return
  const num = manuelDeger.trim()
  if (!tenantKod) {
    setManuelAcik(false)
    spoolAra(num)
    return
  }
  // 6-haneli padding (8. oturum sayaç digits=6 kararıyla uyumlu).
  // Kullanıcı '554' yazınca 'A-000554' arar — DB'deki formatla eşleşir.
  // QR ile gelen payload zaten dolu geldiği için padding etkilemez.
  const tamId = tenantKod + '-' + num.padStart(6, '0')
  setManuelAcik(false)
  spoolAra(tamId)
}
```

`padStart(6)` **DB-arama format**'ı: kullanıcı `554` yazınca `A-000554` arar — DB'de spool_id'ler 6-hane padded saklanıyor (8. oturum kararı). Kalıcı **doğru** kod.

`normalize.js`'teki `markaId` ise tam tersi — **display** için: `A-000554` → `A-0554` (4-hane). DB'de `A-0554` aranırsa eşleşme bulunmaz.

**Karar:** MK-65.2'deki "geçici fix" etiketi **yanlış teşhis**. `padStart(6)` doğru, kalıcı kod, kalmalı. `normalize.js` portu bu kodu **etkilemez** — port `markaId` (display) için, bu satır DB-arama (input). İki ayrı iş.

**Cleanup işlemi yapıldı:** Yok. Kod aynen kalır.

**Olası küçük iyileştirme (zorunlu değil):** Magic number temizliği için `normalize.js`'e yeni helper:

```js
export function spoolDbId(tenantKod, kisaNumara) {
  return tenantKod + '-' + String(kisaNumara).padStart(6, '0')
}
```

`IbQRTara.jsx` bu fonksiyonu çağırır. Bu DRY iyileştirme, gerçek bug yok. Düşük öncelik, açık borç değil.

**Etki:** MK-65.2 listeden düştü (yanlış teşhis kapatıldı). 67 cleanup commit'i atılmadı çünkü değişiklik yok.

**İlişkili:** MK-65.2 (yanlış teşhis), MK-67.2 (`normalize.js` canonical port), 8. oturum spool_id sayaç digits=6 kararı.

---

## MK-68.1 — Ekran 4 silindi: drawer-tabanlı mimari (B seçimi, 7 Mayıs 2026)

**Bağlam:** 67 sonunda Cihat "akış-kesici uyarılar (cross-tenant, devamEdiyor başka operatör, rolUyumsuz) için ayrı bir ekrana gerçekten ihtiyacımız var mı?" sorusunu açtı. İki seçenek BRIEFING'e taşındı:
- **A — Vanilla mantığı koru:** Ekran 4 (uyari) ayrı ekran kalır, sadece akış-kesici uyarılar için. Spool-içi uyarılar (alıştırma, test, not) Ekran 3 drawer'ında.
- **B — Tek pattern:** Ekran 4 silinir. Tüm uyarılar Ekran 3 drawer'ında.

68 başında karar verildi: **B seçildi.** Tek pattern hem mimari olarak temiz hem de UX olarak tutarlı (kullanıcı tek bir UI elementinden — peek tab + drawer — tüm uyarıları görüyor).

**Karar:** AresPipe mobil tarafında akış-kesici ve yumuşak uyarılar **tek drawer pattern'i** ile gösterilir. Ekran 4 (`MUyari` placeholder) silindi, hub mantığı (`MIsBaslat.jsx`'in `setAktifEkran('uyari')` çağrıları) kaldırıldı.

**Drawer kategori şeması:**

| Tip | Renk | Tetikleyici | Davranış |
|---|---|---|---|
| **Akış-kesici** crossTenant | Mor | Spool farklı tenant'ta | IbQRTara'da overlay, üzerine kapatılamaz |
| **Akış-kesici** devamEdiyor | Kırmızı | Başka operatör çalışıyor | IbSpoolDetay'da overlay, "Devral" / "İptal" |
| **Akış-kesici** alternatifBasamakYetkili | Mavi | Alternatif basamağa geçiş yetkisi var | "Alternatife başla" / "İptal" |
| **Akış-kesici** alternatifBasamakYetkisiz | Gri | Alternatif basamak ama yetki yok | Sadece bilgi, "Anladım" |
| **Yumuşak** alıştırma | Kırmızı kart | `spool.alistirma=VAR/KISMI` | Drawer içi kart, "Anladım, devam et" |
| **Yumuşak** test | Mavi kart | Devreye test tanımlı | Drawer içi kart, "Anladım, devam et" |
| **Yumuşak** not | Sarı kart | `notlar` tablosunda `qr_goster=true` not var | Drawer içi kart (her not ayrı), "Anladım, devam et" |

**Öncelik kuralı:** Akış-kesici varsa yumuşak drawer **atlanır** (kullanıcıyı çift onaya zorlamamak için). Sadece akış-kesici overlay açılır, kullanıcı çözünce (Devral, alternatife başla, vb.) yumuşak uyarılar zaten kartlara yansıtılmış olarak görünür.

**Alternatif basamak kapsam kuralı:** Alternatif basamak SADECE kaynak ailesi içinde tetiklenir (argon ↔ gazaltı). İmalat ↔ ön imalat geçişi drawer çıkarmaz, RLS DB tarafında halleder.

**Etki:** Mobil mimari sadeleşti, 5 ekran yerine 4 ekran (giriş, anasayfa, işlemler, IsBaslat hub'ı) + alt-akış component'leri. Yeni dosya: `mobile/src/components/isbaslat/IbUyariDrawer.jsx` (peek tab + 4 akış-kesici tipi + 3 yumuşak kart üreticisi).

**İlişkili:** MK-68.4 (Ib-prefix konvansiyonu), MK-68.2 (IbSpoolDetay implementasyonu), 67 mockup turu v9-v16 kararları.

---

## MK-68.2 — IbSpoolDetay Ekran 3 implementasyonu (Adım 3a + 68b notlar wiring, 7 Mayıs 2026)

**Bağlam:** 67 mockup turu (v9 → v16) tasarımı kilitledi. 68'de implementasyon. Tek oturuma sığmadı, token sebepli "68b" alt-bölmesinde devam etti (aynı oturum bağlamı).

**Karar:** `mobile/src/components/isbaslat/IbSpoolDetay.jsx` (947 satır) Ekran 3'ün ana komponenti. 68'de Adım 3a (foto bloğu, ID + sekmeler, Genel paneli, foot CTA, IbUyariDrawer entegrasyonu, `MIsBaslat.jsx`'ten `is_baslat` kanonik akışı) tamamlandı. 68b'de notlar drawer wiring + üst bant `gemi_adi` cleanup + CI hex renk düzeltmesi.

**68 (Adım 3a) commitleri:**
- `767580e` — feat(mobile): devre fetch + Is Emri/Devre satirlari + malzeme fetch
- `68c2fdc` — feat(mobile): proje fetch + testler kart + format normalize + R-06 (oturum 68 - Adim 3a kapanis)

**68b commitleri:**
- `c1faccc` — MK-68b.1: IbSpoolDetay notlar drawer wiring + üst bant gemi_adi cleanup
- `1085344` — MK-68b.1b: CI red fix + m_ib_uy_yu_* lang keys (6 anahtar × 3 dil)

**68b'de eklenenler:**
- `notlar` tablosundan fetch: `OR(spool_id, devre_id) + tenant_id + silindi=false + qr_goster=true + olusturma DESC`
- Yumuşak drawer'a sarı not kart tipi (her not için ayrı kart)
- `pulseNokta.background` `#22c55e` → `var(--gr)` (R-07 hardcode renk düzeltmesi)
- Stable React keys (B-02 disiplini): `alis`, `test`, `not_${n.id}`
- 6 yeni i18n anahtarı (`m_ib_uy_yu_alis_baslik`, `_alis_mesaj`, `_test_baslik`, `_test_mesaj`, `_not_baslik`, `_anladim`) tr/en/ar üçüne birden eklendi (R-08 disiplini)

**Final dosya kanıtı:**
```
mobile/src/components/isbaslat/IbSpoolDetay.jsx  MD5 95f329c81fa8ff508467cdcc316bce6d  947 satır
lang/tr.json                                      MD5 a20e6c19da2045972bdc3b48ec807fbc  1841 satır
lang/en.json                                      MD5 9c87fa88b595ce11a4c0e0e45a4cbb4b  1841 satır
lang/ar.json                                      MD5 aa9ac024c677305b86302fe281f2cfc5  1841 satır
```

**Veri tarafı temizlik (DB UPDATE):** İki projede `gemi_adi` em-dash/proje_no prefix kirli idi:
```sql
UPDATE projeler SET gemi_adi = 'Kargo Gemisi' WHERE id = '3d309111-1d9c-46ff-9266-4937f24c8a99';  -- NB1124
UPDATE projeler SET gemi_adi = 'Yük Gemisi'   WHERE id = 'f3f5e5f7-369f-4923-9054-bde91b95a908';  -- NB138
```

**Bilinçli ertelenenler (69'a):** Foto carousel detayı, Malzeme paneli BOM listesi, Devral/alternatife başla DB UPDATE akışları, basamak_tanimlari label, yetki kontrolü (alternatifBasamakYetkili / yetkisiz), İşe Başla / İşi Kapat / Not Ekle / İptal Et gerçek akışları, Genel paneli'nde Büküm/Markalama/Kesim ilerleme badge'leri.

**İlişkili:** MK-68.1 (drawer mimarisi), MK-68.3 (üst bant kuralı), MK-68.4 (Ib-prefix), MK-68.5 (lang tek kaynak), 67 mockup serisi.

---

## MK-68.3 — Üst bant: sadece `proje_no` (gemi_adi UI'a sızmaz, 7 Mayıs 2026)

**Bağlam:** 67 BRIEFING'inde Ekran 3 üst bant formatı için "Gemi adı: NB1137 (üst bantta görünmeli)" notu vardı. 68'de implementasyon sırasında tuzak tespit edildi: NB1137 aslında `projeler.proje_no` değeri, gerçek `projeler.gemi_adi` (örn. "MV Poseidon") UI'da görünmemeliydi. Briefing'in not dilinden tuzağa düşüldü.

68b'de canlı testte spool A-0575 (proje NB1124) tarandığında üst bantta "**NB1124 — Kargo Gemisi**-G200-350-FR38-Galv-S01" görünüyordu — em-dash ile birleştirilmiş kirli string. Üç katmanlı sebep:
1. `projeler.gemi_adi` alanına biri "NB1124 — Kargo Gemisi" yazmış (veri girişi hatası, em-dash dahil)
2. IbSpoolDetay üst bant render'ı `proje?.gemi_adi || proje?.proje_no` mantığıyla gemi_adi'yi öne alıyordu
3. SELECT sorgusu `gemi_adi`'ni de çekiyordu

**Karar:** Üst bant SADECE `proje_no` kullanır. `gemi_adi` UI'a sızmaz. Format:

```
{proje.proje_no}-{spool.pipeline_no}-{spool.spool_no}-{spool.rev}
```

(rev varsa, yoksa atlanır.)

**68b'de uygulanan kod düzeltmesi (commit `c1faccc`):**
- `IbSpoolDetay.jsx` SELECT: `'id, proje_no, gemi_adi'` → `'id, proje_no'`
- Render: `proje?.gemi_adi || proje?.proje_no` → `proje?.proje_no`
- Yorum bloğu güncellendi (gemi_adi'nın bilinçli çıkarıldığı not edildi)

**68b'de uygulanan veri temizliği (DB UPDATE):** İki projede `gemi_adi` em-dash + proje_no prefix temizlendi (MK-68.2'de detaylı). Tarama sorgusu (`gemi_adi LIKE '%—%' OR LIKE '% - %' OR ~ '^NB\d+'`) artık boş dönüyor.

**67 BRIEFING'i hatası:** "Gemi adı: NB1137 üst bantta görünmeli" satırı yanıltıcıydı, 68 BRIEFING'inde silinecek (eski not, MK-68.3 ile geçersiz).

**İlişkili:** SED-68-01 (devre_yeni.html form validation borcu — bu tipte kirliliği DB seviyesinde engellemek için).

---

## MK-68.4 — Ib-prefix konvansiyonu: alt-akış component'leri (7 Mayıs 2026)

**Bağlam:** 67-68'de İş Başlat akışı için MIsBaslat host'unun yanı sıra alt-akış component'leri yazılmaya başlandı (IbRolSec, IbQRTara, IbSpoolDetay, IbUyariDrawer). Bu dosyaların M-prefix konvansiyonuna (CLAUDE-MOBILE.md Bölüm 1.3) sığmadığı, çünkü tam-ekran screens değil hub-içi alt component'ler oldukları gözlemlendi.

**Karar:** Mobil component'lerinde iki prefix konvansiyonu birlikte yaşar:
- **M-prefix** (`mobile/src/screens/M*.jsx`) — Tam-ekran screens, route'ta tanımlı (örn. `MGiris`, `MAnasayfa`, `MIsBaslat`).
- **Ib-prefix** (`mobile/src/components/isbaslat/Ib*.jsx`) — İş Başlat akışı alt-akış component'leri, MIsBaslat hub'ı içinde render edilir (örn. `IbRolSec`, `IbQRTara`, `IbSpoolDetay`, `IbUyariDrawer`).

**Genel kural:** Eğer bir akış (örn. İş Başlat) hub-tabanlı bir host (örn. MIsBaslat) ile alt-akış component'leri içeriyorsa, alt-akışlar `mobile/src/components/<akış-adı>/<Akış>*.jsx` altında, kendi prefix'leriyle yaşar. Bu yapı M-prefix tutarlılığını korur (sadece tam-ekran screens M ile başlar) ama klasör isimlendirmesini de net tutar.

**Mevcut durum (68b sonu):**
```
mobile/src/screens/
  MIsBaslat.jsx                             ✅ host, M-prefix

mobile/src/components/isbaslat/
  IbRolSec.jsx                              ✅ rol seçim alt-akışı
  IbQRTara.jsx                              ✅ QR tarama alt-akışı
  IbSpoolDetay.jsx                          ✅ spool detay alt-akışı
  IbUyariDrawer.jsx                         ✅ uyarı drawer alt-akışı
```

**İlişkili:** MK-68.1 (Ekran 4 silindi → IbUyariDrawer doğdu), CLAUDE-MOBILE.md Bölüm 1.3 (M-prefix kuralı).

---

## MK-68.5 — Lang tek kaynak prensibi pekişti: CLAUDE.md tutarsızlığı düzeltildi (7 Mayıs 2026)

**Bağlam:** MK-62.3 (`mobile/src/lang/README.md` predev silme problemi) lang dosyalarının tek kaynaktan (kök `lang/`) yönetildiği prensibini kararlaştırmıştı. CLAUDE-MOBILE.md Bölüm R-08 satır 184 bu kuralı doğru yazdı: *"Hedef dosya — kök `lang/`, mobil değil. `mobile/src/lang/` her dev/build başlangıcında predev/prebuild script'i tarafından silinip kök `lang/`'dan yeniden kopyalanır."*

Ancak CLAUDE.md Bölüm 3.3 (Dil Dosyaları) bu kurala uymuyordu:
- Satır 1203: "Mobil'de dil dosyaları: `mobile/src/lang/{tr,en,ar}.json` — Vite bundle'a dahil eder (fetch yok, hızlı)" — predev silmesinden bahsetmiyor, mobil dosyalar otonom imiş gibi yazıyor
- Satır 1217-1221: `mobile/src/lang/` ayrı tablo, "61 m_* anahtarı" eski sayım
- Satır 1223: "**Senkron tutma:** Web ve mobil ayrı JSON'ları var. İleride senkronize edilmesi için npm script eklenebilir." — yanlış (zaten predev script var, MK-62.3)
- Satır 1393 (klasör ağacı): `lang/ ✅ tr.json, en.json, ar.json (61 m_* anahtarı)` — yanıltıcı

68b'de canlı bir push akışında bu tutarsızlığın etkisi gözlendi: `mobile/.gitignore` satır 27 `src/lang/` ignore ediyordu (predev kaynaklı), kullanıcı lang dosyalarını `mobile/src/lang/` altına taşıdığında git radarına girmiyor + commit edilemiyordu. Doğru hedef kök `lang/`.

**Karar:** CLAUDE.md Bölüm 3.3 düzeltildi — mobil tek bir alt-tablo değil, prebuild auto-generated kopya olarak belgelendi. CLAUDE-MOBILE.md Bölüm 1.2 klasör yapısında "61 m_* anahtarı" eski sayımı kaldırıldı, MK-62.3 referansı eklendi.

**Tek kaynak kuralı (özet):**
- Yazılır: `lang/{tr,en,ar}.json` (kök)
- Üretilir: `mobile/src/lang/{tr,en,ar}.json` (predev/prebuild kopyası, gitignored)
- Mobil ekranlar Vite bundle'da `mobile/src/lang/` dosyalarını okur (runtime)
- Sayım: 67 sonu 1834 anahtar, 68 sonu 1841 anahtar (+6 `m_ib_uy_yu_*` + diğer küçük artışlar). Mobil ve web ayrı sayım YOK; tek kaynak tek sayım.

**İlişkili:** MK-62.3 (predev silme sorunu — bu kararın temeli), R-08 (i18n disiplini), 68b push akışında ortaya çıkan `mobile/.gitignore` satır 27 davranışı.

---

## MK-69.1 — Mobile env var disiplini: yerel `.env` + `.env.example` + Vercel project (9 Mayıs 2026)

**Bağlam:** 69. oturum 3b-fix3'te `mobile/src/lib/dosya.js` helper'ı kuruldu, `/api/dosya-url-al` endpoint'ini çağırmak için `VITE_API_BASE` env var'ı eklendi. İlk eklemede yerel `mobile/.env`'e yazıldı + Vite restart ile masaüstü çalıştı. Ama production'da iPhone Safari'de foto gelmedi. Tanı: `arespipe-mob` Vercel project Settings → Environment Variables'a env var **eklenmemişti** → production bundle'da `import.meta.env.VITE_API_BASE` `undefined` → fetch URL relative oluyordu → `arespipe-mob.vercel.app/api/...` 405 dönüyordu (mobile project'te `api/` klasörü yok).

Bu sorun yaklaşık 30 dk emek aldı çünkü disiplin yazılı değildi. Aynı disiplin önceden olsa: env var ekleme = (a) yerel `.env`, (b) Vercel project, (c) `.env.example` repo'da → Cihat ilk seferde üçünü beraber yapardı, prod-dev tutarsızlığı oluşmazdı.

**Karar:** Yeni mobile env var ekleme disiplini üç adımdan oluşur, hiçbiri atlanamaz:
1. **Yerel `mobile/.env`** — geliştirici makinesine yazılır, gitignore'da kalır, Vite dev için.
2. **`mobile/.env.example`** — repo'ya commit'lenir, env var **anahtarı** + örnek değer içerir (gerçek secret değil), hangi env var'ların var olduğunu yeni geliştiriciler görür.
3. **Vercel project Environment Variables** — `arespipe-mob` (mobile) için ayrı ayrı eklenir, Production + Preview + Development işaretlenir.

Vercel'de ekleme sonrası **redeploy** zorunlu (env var sadece sonraki build'e işler, mevcut deploy onsuz build edildi). Cache'siz fresh build için "Use existing Build Cache" işaretlenmemeli.

**Mobil deploy mimarisi farkındalığı:** `arespipe-mob.vercel.app` ayrı bir Vercel projesi (mobile React build), kök `api/` klasörünü görmez. Mobile'ın endpoint çağrıları cross-origin olarak `arespipe.vercel.app/api/*`'a gider (CORS endpoint'te zaten açık). Bu yüzden `VITE_API_BASE` mobile project'te `https://arespipe.vercel.app` olarak set edilir, mobile'ın kendi domain'i değil.

**İlişkili:** MK-69.2 (mobile lib helper kütüphanesi — env var bu helper'ları besler), MK-67.4 (Supabase API key migration — mobile `supabase.js` hardcoded JWT'leri benzer disiplinle env var'a alınmalı), R-06 (kapsamı baştan tam çıkar).

---

## MK-69.2 — Mobile için web ARES helper'larının muadili sistematik kurulur (9 Mayıs 2026)

**Bağlam:** 69. oturum 3b'de foto carousel için signed URL üretimi yapılırken üç yanlış patika denendi (getPublicUrl → createSignedUrl → endpoint), her biri canlı testte kırıldı. Doğru çözüm web tarafının `ARES.dosyaUrlAl(yol)` fonksiyonunu (ares-store.js satır 923) mobile React'a port etmek oldu. Yeni dosya: `mobile/src/lib/dosya.js` (124 satır, 5 dakika buffer'lı cache, JWT Bearer auth, web pattern'inin birebir muadili).

Bu olay genelleştirilirse: **web ARES global'i altında çoğu sistem-kanalı helper'ı yıllar içinde test edilmiş halde duruyor.** Mobile React tarafında bunların muadilleri ihtiyaç bazlı ad-hoc yazılıyor — bu sadece ek emek değil, hata riski (3b'de yaşandığı gibi) ve tutarsızlık üretiyor.

**Karar:** Mobile için `mobile/src/lib/*` altında web ARES helper'larının muadili sistematik kurulur. Disiplin:
- **Ad denkliği:** `ARES.fonksiyonAdi` ↔ `lib/dosya.js` içinde aynı isimli export. Örnek: `ARES.dosyaUrlAl` ↔ `dosyaUrlAl`.
- **Davranış denkliği:** Cache stratejisi, error handling, return tipleri web ile aynı. Mobile'a özel davranış varsa (örn. async storage) açıkça yorumda belirtilir.
- **Yeni helper ihtiyacı doğunca:** Önce web'de muadili var mı? Varsa ARES'tekiyle başla. Yoksa pattern uydur (gelecekte web tarafında da aynı isimle açılabilir).

**Mevcut durum (69 sonu):** `mobile/src/lib/` altında sadece `dosya.js` (yeni) + `supabase.js` (mevcut, ama hardcoded JWT — MK-69.1 ile env var'a alınmalı) + `i18n.js` (mevcut) + `yetki.js` (mevcut, 70'in 3d işinde kullanılacak) var.

**Gelecek adaylar (ihtiyaç bazlı):**
- `lib/oturum.js` — `ARES.oturumAl` muadili (current user, tenant_id, rol)
- `lib/format.js` — `ARES.format.tarih`, `ARES.format.sayi` muadili
- `lib/normalize.js` — `ARES_NORM.malzemeEtiket` (TR-capitalize + lokalize) muadili

**İlişkili:** MK-69.1 (env var disiplini — bu helper'lar env var'lara dayanır), 3b deneyimi (web pattern referans alma dersi), R-06 (kapsamı baştan tam çıkar — sıfırdan yazma yerine mevcut testli pattern'i taşı).

---

## MK-69.3 — Mobile saha app'i viewport: `maximum-scale=1, user-scalable=no` (9 Mayıs 2026)

**Bağlam:** 69. oturum 3c-fix push edildikten sonra Cihat iPhone'da test ederken: heat input alanına dokununca sayfa otomatik yakınlaştı (zoom), kayıt sonrası küçültmek için elle pinch gerekti. Bu, iOS Safari'nin klasik davranışı — input `font-size < 16px` olan herhangi bir alana focus olunca "kullanıcı daha rahat yazabilsin diye" sayfayı zoom yapıyor. Heat input bizde 14px (kart tasarımıyla uyumlu).

İki çözüm yolu var:
1. **Tüm input'ları 16px yap.** Tek input için kabul edilebilir ama tüm app boyunca tasarım disiplinini bozar (kart içinde 13-14px hierarchy var).
2. **Viewport meta tag'ine `maximum-scale=1` + `user-scalable=no`.** Tek dosya değişikliği (`mobile/index.html`), tüm app için input zoom kapanır. Twitter/Instagram/native saha uygulamaları bu pattern'i kullanır.

**Karar:** AresPipe mobile (saha app'i), `mobile/index.html` viewport meta tag'inde aşağıdaki standart kullanılır:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
```

- `maximum-scale=1` — manuel zoom kapalı
- `user-scalable=no` — pinch-to-zoom kapalı
- `viewport-fit=cover` — iPhone notch/dynamic island kullanım alanı tam (bonus)

**Trade-off (kabul edildi):** Pinch-to-zoom kapanır, görme zorluğu olan kullanıcılar manuel zoom yapamaz. Endüstriyel saha app'i için bu kabul edilebilir bir trade-off — operatör tek elinde telefonla iş yapıyor, native app benzeri davranış (zoom yok) bekliyor.

**Kapsam:** Sadece `mobile/` (operatör saha app'i). Web tarafı (`index.html`, `admin/index.html`, `panel.html` vb.) bu disiplinden etkilenmez — masaüstü/tablet kullanım, zoom kapatılmamalı.

**İlişkili:** R-07 (CSS variable disiplini — viewport meta CSS değil ama ortak temaya bağlı UX kararı), saha kullanım senaryoları (operatör tek el, telefon, eldiven olabilir).

---

### MK-70.1 — Mobile-DB schema-first, web pattern ikincil (9 Mayıs 2026, 70. oturum)

**Bağlam:** 70'te 3f.1 implementasyonu sırasında web `is_baslat.html:1517` `is_kayitlari` INSERT pattern'i incelendi:

```js
// Web kodu — fail ediyor (silent):
{
  kullanici_id: oturum.id,         // DB'de: personel_id
  basamak:      _seciliBasamak.x,  // DB'de: islem_tipi
  tarih:        new Date().toIso() // DB'de: baslangic (NOT NULL)
}
```

DB schema'da bu kolon adları yok. NOT NULL ihlaliyle silent fail. Web tarafı `/* opsiyonel */` yorumuyla try/catch yutuyor — bu yüzden web tarafı muhtemelen `is_kayitlari` tablosuna **hiç** kayıt yazmamış.

R-06 disiplini ("web pattern'i birebir port") yarı uygulandı: pattern semantiği alındı (kayıt yaz, qr_baslangic=true), kolon adları DB schema'ya doğru çevrildi (`personel_id`, `islem_tipi`, `baslangic`). Web pattern tam kopyalansaydı mobile da silent fail ederdi.

**Karar:** R-06 (web pattern referans alma) **mutlak değil**. Web'in pattern semantiği değerli (akış mantığı, tetikleyici, yan etki sırası), ama:
- **Kolon adları:** Mobile DB schema'sını izler (kanonik kaynak)
- **Davranış:** Web'de fail eden bir akış varsa mobile düzeltebilir
- **Pattern düzeltme yetkisi:** Web bug'ı tespit edilirse mobile koduna doğrusu yazılır, web tarafı SED-XX-NN olarak ayrı borç olur

**Pratik uygulama:**
1. Yeni mobile akışı yazılırken önce web pattern incelenir (R-06)
2. Web'in DB sorguları schema ile cross-check edilir (information_schema.columns veya Supabase Studio)
3. Schema uyumsuzluğu varsa mobile DB schema'ya yazar, web tarafı SED-XX-NN olarak işaretlenir
4. Cihat'a not edilir: "Web tarafında benzer bug var, fix gerekir"

**Doğum kanıtı:** 70 oturum sonu DB sorgusu (`is_kayitlari`'nın "no rows returned" döndürmesi 3 commit sonrası) bu disiplinin değerini kanıtladı. Mobile pattern doğruydu, web tarafı yanlış. Ama RLS bug ayrı bir mesele — o MK-70.3'te.

**İlişkili:** R-06 (web pattern referans), SED-71-04 (web is_baslat.html INSERT kolon adları), MK-58.6 (vanilla DB sorgu schema uyumsuzluğu — benzer disiplinin web↔mobile versiyonu).

---

### MK-70.2 — Silent fail yakalama: `.select()` chain veya count kontrolü (9 Mayıs 2026, 70. oturum)

**Bağlam:** 70'te `is_kayitlari` INSERT pattern Supabase RLS'in default davranışı yüzünden silent fail ediyordu:

```js
const { error } = await supabase
  .from('is_kayitlari')
  .insert({ ... })

if (error) {
  // bu BLOK GİRMEDİ — error null döndü
}
// Devam etti, spooller UPDATE de geçti
// Ama is_kayitlari'nda satır YOK
```

PostgreSQL RLS, INSERT'i reddederken `qual` policy'si false döndürürse error fırlatmaz, sadece 0 satır ekler. Supabase client error null döndürür. Mobile kodu "INSERT başarılı" sanır.

**Tespit:** 70'in son saatinde DB sorgusuyla yapıldı: 6 spool `is_durumu='devam_ediyor'` ama hepsinin `is_kayitlari` kaydı yok (3e + 3f.1 commitlerinden 3 oturum boyunca biriken yetim spool'lar). 70b.A `aktifIsleriDBdenSenkronize` fonksiyonu bu boş `is_kayitlari` üzerinden çalıştığı için persistence çalışmıyordu.

**Karar:** Yeni Supabase mutation'larında error null + 0 satır eklendi durumunu tespit etmek için savunma katmanı eklenir:

**Yöntem 1: `.select().single()` chain (önerilen):**
```js
const { data, error } = await supabase
  .from('is_kayitlari')
  .insert({ ... })
  .select()
  .single()  // 0 satırda error fırlatır

if (error) {
  // RLS reddi veya başka bir hata yakalanır
}
```

`.single()` çağrısı 0 veya 1+ satır döndüğünde error verir; INSERT 1 satır eklediği için bu yöntemde başarı = `data` dolu, hata = `error` dolu.

**Yöntem 2: count kontrolü (alternatif, batch INSERT için):**
```js
const { data, error } = await supabase
  .from('is_kayitlari')
  .insert(payload)
  .select()

if (error || !data || data.length === 0) {
  console.error('Silent fail tespit edildi')
  // ... handle
}
```

**Pratik uygulama:**
- Kritik DB write akışlarında (3e iseBasla, 3f.1 handleKapatOnayli, vb.) `.select().single()` veya `.select() + length check` zorunlu
- Read sorgularında gereksiz (zaten data === null kontrolü doğal)
- UPDATE/DELETE'de gerekirse aynı pattern: `.select()` chain + 0 satır kontrolü

**Doğum kanıtı:** 70 RLS bug 4 commit boyunca tespit edilmedi çünkü hiçbir kod silent fail'i yakalamıyordu. Eğer 3e'de `.select().single()` kullanılsaydı ilk testte hata fırlatırdı, RLS bug 70'in başında çıkardı.

**İlişkili:** MK-70.3 (RLS policy review — silent fail'in kök sebebi), R-04 (fail-loud > silent fail).

---

### MK-70.3 — RLS policy: subquery yerine `get_tenant_id()` SECURITY DEFINER pattern (9 Mayıs 2026, 70. oturum)

**Bağlam:** 70'te `is_kayitlari` tablosunun mevcut policy'si silent INSERT fail üretiyordu:

```sql
-- ESKİ (problem):
CREATE POLICY tenant_isolation ON is_kayitlari
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()))
  WITH CHECK NULL  ← INSERT için kontrol YOK!
```

İki problem birlikte:

**Problem 1: Subquery RLS chaining.** `kullanicilar` tablosunun kendi RLS'i subquery'yi engelliyor → NULL döndürür → `tenant_id = NULL` her zaman FALSE → policy reddi. Bu chaining bağımlılık zinciri kırılgan, başka tablolarda RLS değiştirildiğinde silent regresyon yaşanır.

**Problem 2: `with_check NULL`.** PostgreSQL RLS'te `qual` SELECT cmd için, `with_check` INSERT/UPDATE cmd için kullanılır. `FOR ALL` policy'sinde `qual` ALL cmd'ye uygulanır AMA `with_check NULL` ise INSERT'te kontrol bypass olur (ancak `qual` da uygulanmaz — bu Supabase + PostgreSQL'in default deny davranışıyla birleşince INSERT silent fail eder).

**`spooller` policy'si daha sağlam (referans):**
```sql
CREATE POLICY spool_tenant ON spooller
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());
```

`get_tenant_id()` fonksiyonu:
```sql
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER  -- ← yazarın haklarıyla çalışır, RLS bypass eder
AS $function$
  SELECT COALESCE(
    (auth.jwt()->'app_metadata'->>'tenant_id')::uuid,    -- JWT app_metadata
    (auth.jwt()->>'tenant_id')::uuid,                     -- JWT root claim
    (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())  -- DB fallback
  );
$function$
```

`SECURITY DEFINER` etiketi fonksiyonu yazarın (admin) hakları ile çalıştırır → `kullanicilar` RLS'ini bypass eder → 3 fallback de güvenli çalışır → subquery chaining problemi yok.

**Karar:** Yeni RLS policy'leri yazılırken **`get_tenant_id()` pattern'i kullanılır**, subquery (`SELECT tenant_id FROM kullanicilar WHERE id = auth.uid()`) yazılmaz.

**Standart şablon:**
```sql
CREATE POLICY <tablo_adi>_tenant ON <tablo>
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());
```

`get_tenant_id()` fonksiyonu zaten DB'de var. Yeni tablo eklenirken bu pattern uygulanır.

**Manuel fix uygulandı (70'te, repo'da migration YOK):**
```sql
DROP POLICY IF EXISTS tenant_isolation ON is_kayitlari;
CREATE POLICY is_kayitlari_tenant ON is_kayitlari
  FOR ALL
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());
```

71'de SED-71-02 ile `migrations/034_is_kayitlari_rls_get_tenant_id.sql` olarak repo'ya alınır.

**Pratik uygulama:**
1. Yeni tablo eklenirken RLS policy yazılır → bu pattern
2. Mevcut tablo policy'si subquery kullanıyorsa cross-check edilir (silent fail riski)
3. RLS değişikliği kapsamında MK-66.2 disiplini geçerli (policy taraması zorunlu)
4. SECURITY DEFINER fonksiyonlar veritabanı güvenliği için dikkatlice yazılır (audit log + parametre doğrulama)

**Doğum kanıtı:** 70 RLS bug `is_kayitlari` policy'sinin subquery chaining yüzünden silent fail ettiği keşfi. `spooller` aynı tenant_id ile UPDATE'i geçiyordu (get_tenant_id pattern'i), `is_kayitlari` INSERT'i geçemiyordu (subquery pattern'i). Aynı user, aynı tenant, farklı policy → farklı sonuç. Pattern fark = bug fark.

**İlişkili:** MK-66.1 (sıralı migration disiplini), MK-66.2 (policy taraması), MK-70.2 (silent fail yakalama — bu RLS bug'ın yakalanmamasının sebebi), SED-71-02 (RLS migration repo'ya).

---
## MK-74.1 — DB değişiklikleri migration dosyası yazılmadan uygulanmaz

**Karar:** Canlı DB üzerinde yapılan her schema veya data değişikliği aynı oturum içinde `migrations/NNN_*.sql` dosyasına yazılır. Migration dosyası yazılmadan canlı DB'ye UPDATE/ALTER atılmaz.

**Sebep:** 73. oturumda `spool_id` A- prefix UPDATE'i (492 satır) live DB'ye atıldı, migration dosyası yazılmadı. Repo/DB drift oluştu. 74'te keşfedildi: sıfırdan kurulan bir ortam aynı sonuca varamazdı. Bu drift sessiz bir bug zemini.

**Uygulama:**
1. SQL değişikliği planı yazılır
2. `migrations/NNN_*.sql` dosyası açılır, idempotent yazılır
3. Önce dosya, sonra Studio'da çalıştırma (veya tersi — ama ikisi aynı commit'te)
4. Doğrulama bloğu (`do $$ ... raise exception ... $$`) eklenir
5. Commit mesajı migration numarasını içerir

**Doğum kanıtı:** 73 sonu drift keşfi (BRIEFING-73-SONUC.md). 74'te `migrations/036_spool_id_a_prefix.sql` ile kapatıldı.

**İlişkili:** MK-66.1 (sıralı migration disiplini), MK-66.2 (policy taraması).

---

## MK-74.2 — spool_id format kuralı (CHECK constraint ile enforce)

**Karar:** `spooller.spool_id` değeri NULL VEYA `^A-[0-9]{4,}$` pattern'ine uyar. DB seviyesinde CHECK constraint (`spool_id_format_chk`) ile zorlanır.

**Format detayı:**
- UI'da 4 hane gösterilir (`A-0580`)
- DB değeri sıfır-dolgulu daha geniş hane olabilir (`A-000580`)
- 4 hane dolunca 5'e, dolunca 6'ya kademeli geçiş
- Şu an 4 hane yeterli (max ~600 spool)

**Uygulama:**
- DB: `migrations/036_spool_id_a_prefix.sql` CHECK constraint ekler
- Frontend: `spoolIdFormatla(deger)` helper'ı her insert noktasında normalize eder
- `devre_yeni.html`: toplu insert, `kisaKodlar[idx]` helper'dan geçirilir
- `devre_detay.html`: tekil insert, `spoolIdDevreSonraki(SPOOLS)` ile devre içi max+1 üretilir

**NULL durumu:** spool_id NULL olabilir (atanmamış spool). Şu an 40 satır NULL — SED-74-02 ile temizlenecek.

**Tekil ID değildir:** spool_id UNIQUE değildir, her devrede tekrarlanabilir. Gerçek tekil referans `spooller.id` (uuid). Bu format kuralı sadece "human-readable label" rolünü standardize eder.

**Doğum kanıtı:** 74'te SED-74-01 (Yol B — backfill + schema enforcement). DB durum ölçümü: 566 A-uyumlu, 40 NULL, 0 anomali → CHECK regex `IS NULL OR ^A-[0-9]{4,}$` güvenli.

**İlişkili:** SED-74-01 (kapatıldı), SED-74-02 (NULL temizliği — açık).

---
## MK-74.3 — is_durumu (mobile axis) ve s.durum (frontend axis) ayrı eksenler

**Karar:** `is_durumu` (DB, mobile yazar) ve `s.durum` (frontend `_spoolMap` üretir) iki ayrı semantik ekseni temsil eder. UI render mantığı bu iki ekseni karıştırmaz, biri diğerini override etmez.

**Eksenler:**

- **`is_durumu` — mobile axis (aktif/pasif):** Sahada o anda iş yapılıyor mu?
  - `'devam_ediyor'`: bir işçi aktif iş kaydı tutuyor (is_kayitlari'nda açık satır var → pulse-dot)
  - `'bekliyor'`: aktif iş kaydı yok, ama spool herhangi bir basamakta olabilir

- **`s.durum` — frontend axis (basamak ilerlemesi):** Spool üretim hattının neresinde?
  - `'waiting'`: hiç başlanmamış (aktif basamak yok)
  - `'progress'`: bir basamakta (on_imalat, imalat, kaynak, vs.) — basamak adı gösterilir
  - `'qc'`: kalite kontrol basamağında
  - `'done'`: tamamlanmış (sevkiyat sonrası)
  - `'stopped'`: durduruldu

**Hatalı varsayım (74'te düzeltildi):** Önceki `_stepKey` mantığı `is_durumu='bekliyor'` durumunda otomatik `'waiting'` döndürüyordu. Bu, "aktif iş kaydı yok = hiç başlanmamış" varsayımına dayanıyordu. Yanlış: kaynak aşamasındaki bir spool ânlık olarak iş kaydı tutmuyor olabilir, ama basamak ilerlemesi açık.

**Doğru render mantığı:**
1. `is_durumu='devam_ediyor'` → `s.durum`'dan bağımsız: basamak rengi + pulse-dot
2. `is_durumu='bekliyor'` → `s.durum`'a düş (basamak adı veya "Bekliyor")
3. Pulse-dot ve durum kolonu farklı bilgileri taşır: pulse-dot = "şu an aktif", durum kolonu = "üretim hattı pozisyonu"

**Doğum kanıtı:** 74'te SED-73-03'ün son adımı. A-0585 DB'de `aktif_basamak='argon_kaynagi'` + `is_durumu='bekliyor'` durumundayken, devre_detay tablosu "Bekliyor" gösteriyordu. Beklenen: "Kaynak". `_stepKey`'deki `is_durumu==='bekliyor'` override satırı silindi; tablo doğru basamak adını göstermeye başladı.

**Etki:** Spool listesinde "Bekliyor" yığınları dağıldı; her spool gerçek basamağında görünüyor (İmalat, Kaynak, Ön Kontrol, vs.).

**İlişkili:** MK-70.1 (is_durumu birincil kaynak), MK-73.3 (is_durumu DB-truth), SED-73-03 (74'te tamamen kapatıldı).

---

## KARAR-95.1 — `olusturma_at` Rename Refactor'u İptal (17 May 2026, 95. Oturum)

**Bağlam:** 93. oturumda bazı tablolardaki `olusturma` (timestamp) kolonu `olusturma_at` olarak rename edildi. 18 tablo (kütüphane + AI + parser tarafı) yapıldı, 50 tablo (runtime: devre/spool/kk/sevkiyat/hakedis/kullanıcı/...) yapılmadı. 94'te ertelendi, 95'te durum tespit edildi.

**Tespit (95. oturumda):**
- 50 tablo eski adla (`olusturma`), 18 tablo yeni adla (`olusturma_at`) — yarım kalmış refactor
- Orijinal kararın gerekçesi `KARARLAR.md`'de **dokümante edilmemiş** (momentum/ezber işi)
- Tamamlama maliyeti: 2-3 oturum (50 tablo + ~150 kod referansı + 3 view DROP/CREATE + RLS policy taraması)
- Riskler: silent JS bug'ları (kolon yok → null döner, hata vermez), RLS policy referansı (multi-tenant sızıntı), view kırılması, deploy timing 400 hataları
- Kazanç: sadece "tutarlılık" — son 50 oturumda bu yüzden yaşanmış bir bug raporu yok

**Karar:** Refactor iptal edildi. Mevcut durum kabul edildi:
- **Eski tablolar** (50 adet) `olusturma` ile **kalır.** Dokunulmuyor.
- **Yeni tablolar** (95+ açılacaklar) `olusturma_at` canonical adıyla yaratılır.
- İki ad da geçerli alias kabul edilir. Kod tarafında her tablonun kendi adı kullanılır.

**İstisna:** 93'te oluşturulan `boru_malzeme_uyum` ve `flansh_malzeme_uyum` tabloları yeni olmalarına rağmen `olusturma` ile yaratılmış. 0 satır oldukları + henüz kod referansı olmadığı için bir sonraki kütüphane oturumunda (kod yazımı başlamadan önce) tek migration ile `olusturma_at`'e çekilebilir — opsiyonel, risk sıfır. Acil değil.

**Sebep gerekçeleri:**
1. **Gerçek bir bug raporu yok.** 50 oturumda bu tutarsızlık yüzünden yaşanmış bir sorun belgelenmedi. Hayali kazanç peşinde 2-3 oturum harcamak verimsiz.
2. **Risk/kazanç oranı kötü.** Refactor riskleri (RLS sızıntı, silent fail, view kırılma) reel; kazanç (geliştirici ergonomi) hayali.
3. **YAGNI prensibi** — gerçek sıkıntı çıkana kadar dokunma.
4. **Bilinçli kapatma > sürekli erteleme** — açık borç listesinde 3 oturumdur bekleyen iş, kapatılarak liste temizlenir.

**Geri dönüş tetikleri:** Aşağıdaki sinyaller görülürse karar tekrar açılabilir:
- Aynı yer için 3+ kez `olusturma` vs `olusturma_at` karıştırılıp silent null bug yaşandı
- Yeni geliştirici onboarding'inde "hangi ad?" tekrar tekrar soruluyor
- ORM/codegen kullanmaya geçtik (Drizzle, Prisma gibi) — şemayı standartlaştırması fayda sağlar

**Açık borçtan çıkarılır:** `.github/son-durum.md` ve `CLAUDE-SONRAKI-OTURUM.md` dosyalarındaki "olusturma_at rename" maddesi 95 kapanışında silinir.

---

---

## MK-136.1 — Açı, malzeme kalemi kimliğinin parçasıdır
Parser açıyı yakalar (`lib/excel-parser.js` SOZLUK → `aci`, BOM `Angle` kolonu); kabuk konsolide
anahtarı açıyı içerir (`ares-kabuk.js`: `tanim|malzeme|dn|aci|tip`). Aynı DN×et×açı = aynı kalem;
farklı açı = farklı kalem. Aynı çapın 15/22.5/30/45/60/90°'leri AYRI satır kalır, tek "Elbow DN"
satırına çökmez. Malzeme sekmesinde "Açı" kolonu (v3). Sonraki depo/kesim adımının veri ön koşulu.

## MK-136.2 — Malzeme listesi yapısı: MTO / IFS-CADMATIC konvansiyonu (uydurma yok)
Tek **Ölçü** alanı (redüksiyon = kompound "büyük / küçük", küçük çap AYRI KOLON DEĞİL — IFS export'u
`323.9x6.3 / 273.0x6.3` diye tek hücrede veriyor), tek paylaşımlı **Açı** alanı, **Description** +
**IFS shortcode** (commodity kodu). Tip-başına kolon tanımlanmaz. Kaynak (IFS/CADMATIC export) esas
alınır, şema uydurulmaz. `spool_malzemeleri` bu yapıyı yansıtır: `boyut` kompound + tek `aci` kolonu.
Sektör dayanağı: MTO "reducing size" + "shortcode" + "description carries type/grade/wall/spec"
konvansiyonu (whatispiping / wermac MTO-BOM). v3 malzeme kolonu "DN" → "Ölçü" olarak düzeltildi.

## MK-136.3 — Dirsek/büküm temsili ingestion'da HAM korunur, normalize EDİLMEZ
Segment adetleri, açı, yarıçap (1D/1.5D), seamless/welded olduğu gibi saklanır. İki konvansiyon da
değiştirilmeden taşınır:
- "Tek tek / segment" (G200: S02=15°×6=90°, S06=22.5°×4=90°, S05=15°×2=30°) — mitre/segment imzası.
- "Toplam / tam fitting" (M100: Seamless 1×90°) — satın alınan standart fitting.
Yöntem (fitting / büküm / mitre) etiketten KESİN türetilmez — "Elbow" etiketi hepsinde aynı; M130'da
`Seamless 1.5D 87.6°` standart-dışı açı = aslında büküm ama etiket "Elbow". Açı-standartlığı (45/90 =
fitting sinyali; 15/20/22.5/60/87.6 = büküm/mitre sinyali) + spool-içi tekrarın temiz toplama (90°)
ulaşması + Seamless/Welded yalnızca HEURİSTİK sinyaldir. Kesin yöntem kararı OPERATÖRE aittir
(spool_detay imalat planlama adımı: büküm/dirsek/mitre seçimi); gerekirse izometri geometrisi
(içerik katmanı). **Otomatik segment↔toplam dönüşümü YASAK** — hangi tersanenin hangi konvansiyonu
kullandığı + geometri bilinmeden yapılamaz, diğer konvansiyonda yanlış olur.

## MK-136.4 — Dirsek kesim altyapısı boru kesim havuzunu yansıtır (kesim sayfası ertelendi)
Kesilecek/işlenecek dirsekler, borular gibi kesim havuzuna gider. Boru havuzu (`kesim.html`)
`kesim_kalemleri` → `spool_malzemeleri(dis_cap_mm, et_mm, malzeme, kalite)` join'iyle
**malzeme × kalite × çap × et** anahtarında filtreleyip 6000mm stok boya optimize ediyor. Dirsek
havuzu bunu birebir yansıtacak: anahtar **+ açı + yarıçap (1D/1.5D)**, stok = standart 90° dirsek.
Operatör spool_detay'da büküm/dirsek/mitre seçer; havuza giden dirsek satınalma listesinden DÜŞER
(çift malzeme önlenir) ve kaynak `spool_malzemeleri` kalemine bağlanır (izlenebilirlik).
**Şu an yalnızca veri altyapısı hazırlanır; havuz filtresi + algoritma + kesim sayfası sonraki iş.**

## MK-136.B — (AÇIK / ERTELENDİ) spool_malzemeleri.aci kalıcılığı
Açı zinciri şu an BOM → parser → kabuk → malzeme sekmesi (göster) seviyesinde canlı. Eksik halka:
`aktar()` açıyı `spool_malzemeleri`'ne YAZMIYOR (açı kabuk/önizleme katmanında, kalıcı spool satırında
değil). Gelecekteki dirsek havuzunun `spool_malzemeleri.aci` okuması için gerekli. İş: `aci NUMERIC NULL`
kolonu (migration, MK-98.2 BEGIN…ROLLBACK dry-run'lı) + `aktar()` malRows'a tek satır `aci: b.aci`.
Wizard'ın kendisi buna muhtaç değil (sekme açıyı kabuktan gösteriyor); kesim havuzu kurulurken eklenecek.

## MK-135.2 — REVİZYON (MK-136.1 ışığında)
135'teki "S02 dirsek çelişkisi = Excel BOM hatası (adet×birim çarpılmamış)" tespiti EKSİKTİ. Açı
kolonuyla görüldü: S02 = "15°, adet 6, 35.01 kg" → 6×15° segmentli 90° bend; Excel kendi içinde
TUTARLI (per-adet/açı oranı sabit ≈0.389: 15°→5.83, 90°→35.01 kg). Kök sebep Excel değil, K2/PDF'in
AÇI KÖRLÜĞÜ (her 15° segmenti tam 35.4 kg'lık 90° dirsek okumuş). Sonuç: K2 malzeme kıyası
açı-farkındalığı kazanmadan dirsek çelişkilerine "Excel hatalı" DEMEMELİ — yoksa her segmentli bend
yanlış çelişki üretir. "Excel'e dokunma / parser doğru" kararı geçerli ama gerekçesi değişti.

## MK-137.1 — Malzeme hazırlık = yıldız DB kuyruk, miktar bazlı
Malzeme hazırlık kuyruğu üyeliği `devreler.malzeme_kuyrukta` (localStorage DEĞİL → çok-cihaz/mobil görünür).
Yıldız rengi `spool_malzemeleri` teslim/ihtiyaç toplamından TÜRETİLİR (0→🔴, kısmen→🟡, tam→🟢), miktar bazlı
(`teslim_adet`, boolean değil). Kapsam = kit staging (malzemenin imalat sahasına gelmesi); stok/depo modülü
DIŞARIDA (depo yazılımı ayrı, çelişmesin — Cihat kararı).

## MK-137.2 — Malzeme gerçek kaynağı spool_malzemeleri; pipeline_malzemeleri TERK
Kanonik malzeme kaynağı `spool_malzemeleri` (1750 kalem; `spool_id → spooller.devre_id` zinciri).
`pipeline_malzemeleri` pratikte boş/terk (1 satır/tüm tenant). Malzeme okuyan her yüzey (devreler modalı,
toplu çekim export, K2 kıyas) bu kaynağı kullanmalı. Toplama anahtarı `tip|dis_cap_mm|et_mm|malzeme|kalite`.
Teslim satır bazında tutulur, ekranda birleşik gösterilir.

## MK-137.3 — Web manager modalı kısmiyi ezmesin (dirty-only yazım)
Web malzeme kontrol modalı yalnız DEĞİŞEN (dirty) kalemleri yazar → mobilde girilen kısmi teslimleri EZMEZ.
Son-yazan-kazanır yerine alan-bazlı dirty yazım.

## MK-138.1 — İnceleme dosya_adi bazında dedup (mükerrer/bayat-cache)
Aynı `dosya_adi` için birden çok kuyruk kaydı (tekrar yükleme/yeniden-parse/bayat-cache) olabilir.
`api/devre-inceleme.js izometrileriDerle` en bilgilendirici kaydı seçer — skor: montaj{} 3 > spoollar dolu 2
> işlendi 1 > boş 0. Boş kopyalar 🟠 Fazla üretmez. Kök vaka: aynı montaj PDF'i bir devrede montaj{}, başka
devrede `cache_hit` ile montajsız gelmiş; boş kopya spool dalına düşüp `dosya_adi_pipeline_yok` Fazla yapıyordu.

## MK-138.2 — Montaj/genel çizim tespiti deterministik + ayrı bölüm
Montaj/genel çizim = `montajDosyaKok(dosya)!=null && dosyaAdiParse(dosya)==null` (S-segmentsiz `*.1.pdf`).
Dosya adından, AI yok (MK-49.1). `montaj_belge=true` kayıtlar spool çetelesine ve Fazla'ya GİRMEZ; ayrı
`montajlar[]` bölümünde gösterilir (`ozet.montaj`). `montaj{}` parse'ta olmasa da (bayat-cache) dosya adından
montaj sayılır (`icerik_okundu=false` → "dosya adından tanındı"). Dosyalar: `lib/izo-eslesme.js` +
`api/devre-inceleme.js` + `devre_wizard_v3.html`. (§11.1-A regex hipotezi `node -e` ile çürütüldü; regex sağlam.)

## MK-138.3 — Taslak devreler Aktif listede gizli + iptalde soft-delete
Terfi edilmemiş taslak devreler Aktif Devreler'de gizli (`devreler.html applyFilters` → `durum != 'taslak'`,
tek nokta → count/liste/id tutarlı). Wizard iptalinde (`wizardIptal()`) taslak `silindi=true` (soft, yalnız
`durum='taslak'`; aktife dokunmaz). Kök: `inceleBaslat()` "İncele →" anında taslak INSERT ediyor (devre_id
storage/kuyruk için lazım), terk edilince yetim kalıyordu. Hard-delete + storage temizliği yeni endpoint
gerektirdiğinden (MK-129.3 tavanı) ertelendi — toplu cleanup ileride.

---

## ⚠ BOŞLUK NOTU — MK-139 … MK-153 (160'ta tespit)

160 açılış kontrolünde görüldü: bu dosyaya en son MK-138.3 işlenmiş; 139–159 arası ~20 oturumun
kararları oturum devir dosyalarında kalmış, buraya hiç gelmemiş (MK-159.3'ün ikiz vakası: devir
"157-159 birikti" diyordu, gerçek boşluk 139'dan başlıyor). 160'ta yalnız **kaynak-kanıtlı tam
metni elde olan 154+ seti** işlendi (kaynaklar: FORMAT-TANITMA-URETIM-SPEC.md, FORMAT-TANITMA-
ILERLEME.md, WIZARD-YOL-HARITASI.md, oturum 159 kapanış dosyaları). **139–153 geri-doldurma ayrı
iştir** — o oturumların devir dosyaları/arşivi okunarak yapılır, ezberden YAZILMAZ (MK-126.8).
Bilinen adaylar (referansları yaşayan dokümanlarda geçiyor): MK-139.1, MK-145.3/4, MK-148.1,
MK-150.x, MK-151.4/5, MK-152.1/2/3/4, MK-153.1/2/3.

---

## MK-154.1 [MIMARI] — Taslak işleme durumu kolon değil, kuyruktan TÜRETİLİR
"işleniyor/hazır" devre kolonu açılmadı: taslak + açık kuyruk işi = işleniyor; iş kalmadı = hazır.
Migration sıfır, senkron borcu sıfır; durum CHECK'i (taslak/aktif/iptal) değişmedi. Kuyruk =
gerçeğin kaynağı ilkesinin ilk büyük uygulaması (devamı MK-157.4). (Kaynak: W-2.6, 154.)

## MK-154.2 [MIMARI] — Tek-nokta yazma kilidi deseni + 'isleniyor' işlere dokunulmaz
İki bağlı kural: (a) bir kipte yazmayı kilitlemek = her yazma fonksiyonunun başına TEK satır guard
(taslak önizleme `_tkKilit()` 19/19 fonksiyon — render'a dokunmadan); (b) taslak iptali/kuyruk
temizliği `durum='isleniyor'` işleri ATLAR — worker o anda üzerinde çalışıyor olabilir (yarış
koşulu), iş kendi akışında biter. (Kaynak: W-2.11/W-2.13, 154-155.)

## MK-155.1 [MIMARI] — AILE_KAYIT'lı formatta etkin kural PAKETTEN derlenir; DB parser_kural OKUNMAZ
izometri-oku ~900: `aileBirlestir(format_kodu) || DB_parser_kural`. AILE_KAYIT'taki formatlarda
(160 itibarıyla: tersan_cadmatic_spool, tersan_cadmatic_montaj) etkin kural lib/format-paketleri.js
facet katmanlarından derlenir; DB kuralı yalnız fallback. Bu ailelerde satır/alan öğretimi = KOD
DEĞİŞİKLİĞİ + DEPLOY. Kanıt: 155 NB1124 turu — DB'ye yapılan ilk öğretim (tip 7→8, RETURNING'li)
HİÇ okunmadı. Çözüm çerçevesi: docs/FORMAT-YONETIM-MIMARI.md §3 + MK-160.1. (Kaynak: SPEC/ILERLEME 155.)

## MK-155.2 [MIMARI] — Motor boy_mm'i int'e çevirir; istisna açılmadı
177.8 → 177. MK-118.3 (motor yeniden yazılmaz) gereği kabul; 0.8 mm imalat toleransında ihmal
edilebilir. Bilinçli sınır, bug değil. (Kaynak: ILERLEME 155.)

## MK-155.3 [MIMARI] — Örtüşen tetikleyicili iki satır tipi TUZAKTIR; tek genel tip
Motor sözleşmesi: satır İLK tetikleyen tipte kalır, o tipin deseni tutmazsa ham_satir'a düşer
(görünür — B-6). Bu yüzden tetikleyicileri kesişen iki ayrı tip ('reduksiyon' ↔ 'reduksiyon_sch';
risk adayları 'Red.ser', 'Dış/İç Bilezik') yazılmaz — tek genel tip + desen alternation. Yeni tip
eklerken tetik örtüşme denetimi checklist maddesi. (Kaynak: ILERLEME 155-156.)

## MK-156.3 [MIMARI] — Format kapsaması ÜÇ katman; format_tanit yalnız SATIR/ALAN öğretir
KİMLİK çıkarımı + SATIR tipleri + BELGE SINIFI (dışlama) ayrı ayrı kırılır. "Formatı tanıttım"
satır katmanını çözer; kimlik (pipeline çıkarımı) ve dışlama (W-2.4) ayrı mekanizmadır — tanıtma
sonrası süren kabukta_yok'ta kullanıcı format öğretimine değil kimlik/eşleşmeye yönlendirilir.
Adres tablosunun tamamı: docs/FORMAT-YONETIM-MIMARI.md §1-2. (Kaynak: SPEC 156, NB1124 vakası.)

## MK-157.1 [DISIPLIN] — kabukta_yok teşhisinde İLK kontrol: devre durumu
Taslak devrede spooller tablosu YAPISAL boştur (kabuk terfide yazılır) → kabukta_yok taslakta
normaldir, parser/eşleşme suçlanmaz. Teşhis sırası: devre durumu → kabuk anahtarları → PDF
anahtarları → format kıyası. (Kaynak: SPEC 157; 156'nın "20/22 kimlik kırık" teşhisini devirdi.)

## MK-157.2 [DISIPLIN] — Vercel repro standardı: node@20.11
Vercel runtime require(ESM) desteklemez; Node 20.19+/22 lokalde bunu MASKELER. eslestirme-backfill
140'tan beri bu yüzden ölüydü (modül-seviyesi createRequire zinciri tüm endpoint'i çökertiyordu;
fix: lazy import(), yalnız tip=malzeme dalında). Runtime hatası repro'su node@20.11 ile yapılır.
(Kaynak: ILERLEME 157.)

## MK-157.3 [MIMARI] — İçerik-fakir belge sınıflarında dosya_adi_regex ŞARTTIR
Montaj gibi başlıksız/tablosuz formatlar içerik sinyalleriyle eşik (2) altında kalır → format NULL
→ genel L3 (maliyet + halüsinasyon). Fingerprint'e dosya_adi_regex öğretilir (montaj: 36/36 ad
testi, iki yönde güvenli; `.S01` imalat için doğal guard). İçerik-öncelik ilkesi (MK-152.1)
geçerli kalır — bu, sinyalin hiç olmadığı sınıflar için zorunlu tamamlayıcıdır. (Kaynak: ILERLEME 157.)

## MK-157.4 [MIMARI] — Kuyruk durumu ≠ eşleşme durumu
dosya_isleme_kuyrugu.durum işin İŞLENDİĞİNİ söyler (oneri_hazir/manuel_onay/hata); spool'a
EŞLEŞTİĞİNİ söylemez. Eşleşme parse_sonuc._eslesme / spool tablolarından okunur. Teşhiste ikisi
karıştırılmaz ("kuyruk = gerçeğin kaynağı" ilkesi yalnız İŞLEME durumu için geçerlidir).
(Kaynak: 157 devri.)

## MK-158.1 [DISIPLIN] — Teşhis sırası: VERİ (SQL) → UI → kod; benzer adlı devre ≠ aynı devre
Şikâyet geldiğinde önce DB sorgusuyla veri gerçeği, sonra UI'ın o veriyi nasıl gösterdiği, en son
kod okuması. Ve: ada benzeyen iki devre aynı devre sayılmaz — kimlik id'den doğrulanır (145.3
test-kirliliği dersinin genellemesi). (Kaynak: 158 devri.)

## MK-158.2 [URUN] — Onay Kuyruğu grupları + toplu kapatma sınırı
devre_detay "Onay Kuyruğu" 4 grup: manuel_onay (amber, TEKİL kapatılır) · excel önerisi (mevcut
modal köprüsü) · atanmamış izometri ("Detay" ile sebep-bazlı; B-6 görünürlük, TOPLU kapatmaya
GİRMEZ) · temiz öneri (TOPLU →tamamlandi, veri işlemi YOK; _eslesme özeti olmayan öneriler de bu
gruba girer). atanmamis bir kuyruk durumu değil, _eslesme özetinden türetilir. (Kaynak: W-2.15, 158.)

## MK-158.3 [MIMARI] — Taslak önizleme terfi hizası
Önizleme satırları terfiyle AYNI çekirdekten türetilir (ARES_KABUK.grupla): kalite=anaMalzeme,
malzeme=malKod, taslak_duzeltmeleri (kalem_idx=-1) overlay'i aktar'ın ezme kuralıyla okunur.
Alıştırma/izometri verisi taslakta YAPISAL yoktur (MK-157.1) — terfiden sonra dolar. (Kaynak: W-2.14, 158.)

## MK-159.1 [MIMARI] — İş emri numarası YALNIZ terfide üretilir
Migration 101: is_emri_no DROP NOT NULL + (durum='taslak' OR is_emri_no IS NOT NULL) CHECK.
Taslak INSERT null; onayEt: mevcut numara korunur → yoksa sonraki_no RPC (atomik UPDATE…RETURNING)
→ eq('durum','taslak') guard'lı update. Taslak/iptal numara YAKMAZ. Kural istisnasız: tüm canlı
taslakların numarası NULL (geçiş temizliği 159-160'ta COMMIT'li). Kanıt: sayaç 217→218 tek
terfiyle, P26-218=bcmbvö. devre_detay taslakta "Terfide üretilecek" (tr/en/ar). (Kaynak: son-durum 159.)

## MK-159.2 [URUN] — format_tanit AYRI MODÜLDÜR; köprü dosya taşır; iki kip tek ekranda ayrışır
Görsel okuma (sol bilgi + sağ PDF) yalnız format_tanit'te yaşar; wizard/spool modalına ikinci PDF
görüntüleyici GÖMÜLMEZ (159'da modal-içi çapa stub'ı kaldırıldı). Giriş: `format_tanit?is=<id>
&kaynak=devre|batch` — dosya/format/spool bağlamı İŞTEN okunur, operatör dosya ARAMAZ (160'ta
gemiye alındı, W-3.1/3.2). KURAL kipi (B1, okuma yeri) ↔ DEĞER kipi (B2, taslak_duzeltmeleri'ne
işaretli) ayrımı: MK-160.2. (Kaynak: 159 devri + ILERLEME 159.)

## MK-159.3 [DISIPLIN] — Kod gerçeği > devir hafızası
Devir kayıtları eskiyebilir: 145'in "B kalanı" borcu 159'da uçtan uca TAM çıktı (146/B kalem
rötuşu aktar.kalemDuzeltmeler dahil gemideymiş); read-before-write çift-yazımı önledi. 160'ta
ikinci vaka: "MK-157/158/159 birikti" devri, gerçek KARARLAR.md boşluğunun 139'dan başladığını
gizliyordu. "Eski borç kaydı ≠ hâlâ borç" ve "eski 'işlendi' kaydı ≠ gerçekten işli" — iki yönde
de dosya gerçeği esastır. (Kaynak: 159 devri + 160 tespiti.)

## MK-160.1 [MIMARI] — Öğretim adresi: kısa vadede ikilik kabul, format_tanit ADRES-BİLİNÇLİ; yeni aile AILE_KAYIT'a EKLENMEZ
MK-155.1 ikiliğinin yönetimi: DB-kurallı formatta öğretim DB'ye (bugünkü akış); AILE_KAYIT'lı
formatta format_tanit ⚠ "paket-katmanlı — deploy gerektirir" uyarısı gösterir (160'ta gemide),
sessiz başarısızlık yok. Yeni format aileleri AILE_KAYIT'a eklenmez — ikilik büyümez. Uzun vade
YÖN: facet katmanları DB'ye taşınır (aileBirlestir DB'den derler), tetik = paket ailelerinde
öğretim talebi; ayrı planlı paket. Tam analiz: docs/FORMAT-YONETIM-MIMARI.md §3.

## MK-160.2 [URUN] — Kip sözlüğü: "sadece bu spool" → Düzelt · "hepsi okunmuyor" → Tanıt
Tekil değer düzeltme wizard inceleme Düzelt modalında kalır (taslak_duzeltmeleri, işaretli);
sistematik okuma sorunu Tanıt → format_tanit (kural öğretimi). format_tanit SAF KURAL kipidir —
B2 değer kipi ancak W-3.5 dil/rozet ayrımıyla ("okuma yerini düzelt" ↔ "değeri düzelt") birlikte
eklenir; etiketsiz kip karışımı yasak. (Kaynak: 160 Cihat-Claude kip tartışması.)


## MK-160.3 [MIMARI] — MK-159.2 inceltmesi: yasak olan ÖĞRETİM ALTYAPISI kopyasıdır; SALT görüntüleyici serbest
format_tanit'in öğretim/çapa altyapısı (bölge seçimi, kural yazımı, fingerprint) başka ekrana
KOPYALANMAZ — bu MK-159.2'nin özüdür. Ancak salt PDF görüntüleyici (pdfjs render + pan + zoom +
sekme, vendor format_tanit ile ORTAK, lazy yüklenir) serbesttir. Spool modalı yan paneli bu
kapsamda pdfjs viewer oldu; embed denemesi pan ihtiyacıyla aynı gün aşıldı. Kural koruma ile ürün
isteği bağdaştı: operatör PDF'i düzeltme ekranının YANINDA görür, öğretime yönlendirilmez.
(Kaynak: son-durum 160; Cihat yön düzeltmesi "buradan format tanıma ekranı çıkmasın".)

## MK-160.4 [URUN] — Operatör kalem ekleme (OPR kapısı): kalem_idx≥bom.length, aktar kod='OPR'
PDF'te olup kabukta olmayan gerçek eksikler için "+ Ekle": yeni kalem taslak_duzeltmeleri'nde
kalem_idx≥bom.length ile yaşar (YENİ rozeti + 🗑, terfi öncesi silinebilir); terfide aktar
spool_malzemeleri'ne kod='OPR' satırı yazar. tanim/tip ek alanları YALNIZ yeni kalemde — mevcut
kalem düzeltme setine sızmaz. Kaynak izi korunur: OPR = operatör beyanı, parse çıktısı değil
(Parça Kimliği Prensibi ihlal edilmez). (Kaynak: son-durum 160; "PDF 3 satır / kabuk 2 kalem" vakası.)

## MK-160.5 [MIMARI] — Önizleme parse enjeksiyonu: eslestir'in terfi-sonrası alanları endpoint'te AYNI kurallarla taşınır
Taslakta spooller yapısal yok (MK-157.1) → alıştırma/NOT/yüzey önizlemede boş kalıyordu.
devre-inceleme endpoint'i bu alanları eslestir'in 117 kurallarıyla BİREBİR (ALS dosya→VAR /
alistirma_ipucu + NOT + kabuk_bos yüzey kuralı) satıra enjekte eder — yalnız GÖSTERİM için.
Kalıcı yazım yine terfi/eslestir hattındadır; endpoint DB'ye yazmaz. Kural çatallanması yasak:
eslestir kuralı değişirse enjeksiyon da aynı kaynaktan güncellenir. (Kaynak: son-durum 160, W-2.14.)

## MK-161.1 [DISIPLIN] — Canlı HTML testinde İLK adım sert yenile
Cmd+Shift+R atılmadan test sonucu kanıt sayılmaz. 161'de deploy doğruyken tarayıcı cache'i
aynı oturumda ÜÇ kez sahte iz üretti ("PDF açılamadı" düz metni repo kodunda üretilemezdi).

## MK-161.2 [MIMARI] — pdf-tounicode katmanı: görüntü onarımı ≠ çıkarım onarımı
ares-pdf-tounicode.js canvas/metin GÖRÜNTÜ katmanını onarır (Cadmatic'in geçersiz
/ToUnicode /Identity-H girdisi); glyph-onar.js ÇIKARIM katmanıdır. Tounicode bellekte,
kapılı (gerçek ToUnicode'a dokunmaz), idempotent, storage'a asla yazmaz.

## MK-161.3 [URUN] — kg/mm gösterimi tek ondalık (f1, tr-TR)
Tüm kg ve uzunluk gösterimleri f1() ile tek ondalık. İstisna: et/çap HAM kalır —
spec değeridir, 3.05 bilgi taşır.

## MK-161.4 [DISIPLIN] — Tek-satır anchor'a satır-içi // yorum eklenmez
Satırın devamını yorumlar, parantez dengesi patlar (W-3.9 yamasında yaşandı).
Açıklama gerekiyorsa blok yorum /* */ anchor'ın ÖNÜNE konur.

## MK-161.5 [DISIPLIN] — Kanıt çıktısı head ile kesilmez
E120'de poppler çıktısının ilk 8 satırı rakamdı, "çorba" sanılıp yanlış yöne -29 map
yazıldı. Kontrol grubu tam çıktıyla kurulur; uzunsa dosyaya yaz, grep'le sorgula.


## MK-162.1 [URUN] — format_tanit operatör ürünü değil, UZMAN ARACIDIR (atölye kararı)
161+162'de iki uzman, kaynak kod + SQL erişimiyle tek alanın kuralını ancak motor içlerini
söküp kanıtlayabildi; UI testi iki kez yanılttı (B1 metin ayrışması), adres iki oturumda iki
kez yanlış formata gitmek üzereydi (B5). Menü girişi kaldırıldı (6a27723); sayfa feature-flag
ile yaşar (MK-159.2), batch "Tanıt" köprüsü uzman girişidir. Öğretim akışı = ATÖLYE (Cihat+
Claude): zip → sunucu-metni dökümü → mekanik kural kanıtı → SQL kayıt → drenaj kanıtı.
Kullanıcıya açılma şartı: C yolu (L3 çıktılarından otomatik kural ÖNERİSİ + uzman onayı).
Tek kaynak: docs/FORMAT-OGRETIM-ATOLYE-162.md. (Kaynak: 162.)

## MK-162.2 [URUN] — G2a düzeltme birikimi → kural ÖNERİSİ köprüsü (MK-160.2 inceltmesi)
Düzelt=değer / Tanıt=kural ayrımı KORUNUR: operatör düzeltmesi hiçbir zaman doğrudan kurala
dönüşmez. taslak_duzeltmeleri etiketli veridir; aynı yönde sistematik birikim (örn. 3+) uzmana
"format kuralı şüphesi" SİNYALİ olur; BİRİKİM öneriye dönüşür, öneri ONAYDAN geçer. Yakın iş
(163'te gemide): g2a_duzeltme_sinyali görünümü + uyarilar kutusu. (Kaynak: 162.)

## MK-162.3 [DISIPLIN] — Format öğretiminde kanıt makamı SUNUCU METNİDİR
format_tanit UI testi görsel-sıra metniyle (extractAll) koşar — bu sınıf alanlarda yeşil/
kırmızı KANIT DEĞİLDİR. Kanıt: lokal pdf-parse+glyph-onar dökümü + drenaj SQL'i. Hibrit
kayıtta SQL-önce yazılan alana UI'da DOKUNULMAZ (dirty → Güncelle ezer). 163 eki: tablo
SENTEZİ de CANON_ALL (tarayıcı metni) üzerinde koşar — tablo öğretiminin nihai kanıtı da
drenaj JOIN'idir. (Kaynak: 162 + 163.)

## MK-163.1 [DISIPLIN] — Devir borcu taşınmadan TAZELENİR ("eski borç kaydı ≠ hâlâ borç", devir ikizi)
162 devri "100+ stuck kuyruk (MK-152.3)" ve "MK-117 açık" taşıyordu; ikisi de 153-155'te
çözülmüştü — 163'te taze SQL denetimiyle hayalet çıktılar. Kural: ajandaya giren her devir
borcu için açılış teyitlerinde 1 tazeleme sorgusu ("borç hâlâ borç mu?"). MK-159 dersinin
("dosya gerçeği esastır") devir-dosyası izdüşümü. (Kaynak: 163.)

## MK-163.2 [TEKNIK] — W-3.11 hükmü: tablo yazım yolu sağlam; kapı sentez yeşilidir; önizleme=yazım
Düzeltme kipinde tablo patch'i tek kaynaktan üretilir: _tabloYeniMt() + _tabloDegistiMi();
kaydet ve tamamlaAc AYNI bindirmeyi görür (D2). "Değişiklik yok" toast'ı tablo durumunu
ayrıştırır — sessiz fallback yok (D1). _patchedKural W-3.9 kapısını uygular: türetilen alan
(cap/et/dn) elle işaretlense de patch'e SIZAMAZ — sayan filtre = yazan filtre (D3; 153/2358
vakasının açık kapısıydı). _satirTipleri yalnız sentez yesil>0 ise doğar. (Kaynak: 163.)

## MK-163.3 [MIMARI] — alanCikar/postProcess TEK KAYNAK: ares-alan-cikar.js
Gövdeler kök IIFE çekirdeğinde (ares-tablo-sentez deseni); lib/l2-parser.js ve format_tanit
DELEGEDİR, export imzaları değişmez (izometri-oku dinamik import'u etkilenmez). Bu gövdeler
bir daha HİÇBİR dosyaya kopyalanmaz. 162/B7 kapandı (kopyada whitelist + format_template
eksikti); B4 sessiz-fallback F1 ölçümüyle teorik (27 kuralda kullanım sıfır) — görünürlük
ihtiyacı doğarsa tek yerden eklenir. (Kaynak: 163.)

## MK-163.4 [VERI/URUN] — Format ad/kod yapısal kimliktir; format_kodu YASAK kümesi = AILE_KAYIT anahtarları
Ad şablon/dizayn-ofisi/kaynağı anlatır (B3): a093eaaa = "Tersan Cadmatic Spool — Öğretim
(çok-notasyon)" / tersan_cadmatic_spool_ogretim_v1; e1fb879d ve 39a2c81b "— Katalog" ekli.
format_kodu ASLA AILE_KAYIT anahtarlarına (tersan_cadmatic_spool, tersan_cadmatic_montaj)
eşitlenmez — eşitlenirse aileBirlestir DB kuralı yerine paketleri koşturur (MK-119.2 / MK-155.1
ikiliği). B5'in kökü kayda geçti: a093eaaa ↔ e1fb879d aynı yapısal aile, ayrım KAYNAK
(öğretim-DB vs katalog-paket). (Kaynak: 163.)

## MK-163.5 [URUN] — G2a sinyal hattı v1: görünüm + kutu; format bağı v2'de
migration 102 g2a_duzeltme_sinyali: alan+seviye+değer yönünde 3+ düzeltme birikimi;
security_invoker=true ZORUNLU (yoksa view sahip yetkisiyle koşar, taslak_duzeltmeleri RLS'i
bypass = çok-tenant sızıntı). uyarilar.html 📐 kutusu yalnız UZMANA sinyaldir — hiçbir şey
otomatik kurala dönüşmez (MK-162.2). v1'de format bağı bilinçli YOK (tablo format taşımıyor);
v2 = parse_sonuc anahtar keşfi VEYA düzeltme kaydına format_id kolonu. (Kaynak: 163.)

## MK-163.6 [BORC] — devre_dokumanlari.parse_durumu BAYAT denormalize kolon
1611 kayıt 'bekliyor' / kuyrukta bekleyen 0: kolon insert'te yazılır, yalnız terfi yolu
(ares-kabuk:307) günceller. UI kuyruk gerçeğini ayrıca çeker (devre_detay:2635 — 102. oturum
fix'i) → canlı bug DEĞİL, tek-kaynak borcu. Karar açık: emekli (yorum + okuyan-kalmadı grep
kanıtı) ya da trigger. Kuyruk durumları (oneri_hazir/manuel_onay/iptal) kolon CHECK kümesine
1:1 oturmadığından TAHMİNLE toplu backfill YAPILMAZ. (Kaynak: 163.)

## MK-164.1 [DISIPLIN] — Rozet varsayılanı ≠ kaynak kuralı
UI bir değerin kaynağını gösteriyorsa (rozet/badge), o göstergeyi üreten KURAL kaynağın tek
gerçeğidir; yazan kod bu kuralın BİREBİR EŞİNİ kullanır. Varsayılan değerden ("rozet default
Excel") kaynak çıkarımı yapılmaz. 164'te sabit `deger_kaynagi:'excel'` yaması ekran kanıtıyla
(L2 rozetli yuzey/alistirma/not) aynı oturumda çürütüldü → dsatir kuralının eşi yazıldı.
Ek ders: JSONB teşhis SELECT'lerinde anahtar adı tahmini MK-85.3 ihlalinin kardeşidir — önce
1 örnek satırın `jsonb_pretty` dökümü. (Kaynak: 164.)

## MK-164.2 [MIMARI] — konum_ipucu.bbox normalize standardı (W-4.4)
`parser_kural.*.konum_ipucu.bbox` SCALE-1 (PDF viewport birimi) uzayında ve `norm:1`
bayrağıyla saklanır; captureBox yakalama ANINDA böler, drawMarks çizimde aktif zoom'la çarpar.
TÜKETİCİ SÖZLEŞMESİ: norm'suz bbox kullanılmaz (öğretim-anı zoom'u kaydedilmediğinden uzayı
belirsizdir) — dürüst toast, tahmin yok. İlk tüketici: wizard 🔍 Tablo (dpvZoomTo, W-2.19
ucuz dilim). (Kaynak: 164.)

## MK-164.3 [URUN] — G2a kaynak sözlüğü (migration 103)
`taslak_duzeltmeleri.deger_kaynagi` ∈ {excel, izometri, operator} (CHECK'li):
excel = düzeltilen değer Excel kabuktan · izometri = PDF parse değerinden (`format_id` DOLU —
sinyal formata adreslenir) · operator = sistem okuması yokken operatör girdisi (yeni kalem /
boş alan) · NULL = 103 öncesi kayıt, "bilinmiyor". Geriye dönük TAHMİN BACKFILL YASAK.
Uyarı kartı adresi kaynağa dallanır; Düzelt=değer / Tanıt=kural ayrımı ve uzman onayı AYNEN
(MK-160.2/162.2). (Kaynak: 164.)

## MK-165.1 [TEKNIK] — Emperyal satırda boyut sentezi: nps_inc+schedule_kod → yerel boyutStr
boru_sch/dirsek_sch tipi satırlar `boyut` alanı TAŞIMAZ (NPS ve schedule ayrık yakalanır) —
olcuZenginlestir bu yüzden atlıyor, satır dominant-boru adayı olamıyordu (42.2/3.56 vakasının
1. kökü). Çözüm: boyut yoksa nps_inc+schedule_kod'dan YEREL string sentezi ('2" Sch 10S') →
olcuParse NPS yolu DN/OD/et'i ARES_BORU'dan çözer. `m.boyut`'a YAZILMAZ (ham yakalama ilkesi —
sentez türetilmiş veridir, kaynak alanı kirletmez). sch'siz nps-only: dis_cap+dn dolar, et
null kalır. (Kaynak: 165, commit 5edbba1.)

## MK-165.2 [MIMARI] — dn HEP dominant borudan: kenar §5 kodlandı + dnBul ters eşleme
spoolOlcuTuret dn'i dominant borudan HER ZAMAN yazar (alan-regex değerini ezer) — kenar §5'in
("dn HEP dominant borudan, İç Bilezik/kaynak ASLA") birebir kodlanması. M130-817-008.S01'de
alan-regex tek DN'i kaynak satırından (DN32) almıştı; dominant boru temiz satırdan gelir,
tablo bozuksa dominant yok = ezme yok. MK-111.2 "dolu ezilmez" ÖĞRETİM-PATCH bağlamıdır; parse
türetiminde kenar §5 üstündür. Dominant borunun dn'i yoksa (saf ODxet çizimleri, AT110-804):
ARES_BORU.dnBul(od, malzeme) ters eşleme — dnListesi×disCap taraması, ±0.15mm, TEK-eşleşme
şartı, cunife dahil; ASME-dışı OD (76.1) null kalır ve dn_bulunamadi uyarısı HAKLI olarak
sürer (uydurma yok). (Kaynak: 165, commit'ler 5edbba1 + f86ff81.)

## MK-165.3 [MIMARI] — asmeFallbackDoldur ÇİFT KÖR; satır-kaynaklı asme et spool'a yazılır (151 revizyonu)
151'in "schedule-türetilmiş et spool'a yazılmaz, asmeFallbackDoldur schedule-bilinçli doldurur"
varsayımı İKİ yönden çürük çıktı (kanıt: ikinci drenaj turu et=1.65 "boru_olculer (SCH SCH5)"):
(1) helper yolu MALZEME-KÖR — malzeme_en_kodu null → 'karbon' varsayımı → karbon tablosunda
10S yok → fail; (2) DB yolu SCHEDULE-KÖR — boru_olculer sorgusunda schedule_kod filtresi YOK,
limit=1 rastgele ilk satırı (SCH5) seçer. İkisi de izometri-oku İÇİNDE (MK-49.1 dokunulmaz) →
çözüm dışarıdan: satırın KENDİ kalitesi (doğru malzeme) + BASILI schedule ile hesaplanan asme
et artık spoolOlcuTuret'te spool'a yazılır; etiket fallback'in birebir eşi 'ares_boru (SCH X)'
(MK-164.1 ruhu: tüketici yüzeyi değişmez) → kör fallback'e hiç girilmez. 153'teki 3.68/3.91
bulgusunun kökü buydu (emperyal aile için kurudu). sch'siz satır eski davranışta (fallback'e
gider). (Kaynak: 165, commit 1596481; bağımsız kanıt: G400-817-015 + E100-817-005 → 2.77.)

## MK-165.4 [DISIPLIN] — Log hedefleme original_log_id üzerinden; UPDATE etkisi SELECT teyidiyle
ai_api_log.cevap_full KUYRUK katmanının alanlarını (dosya_adi vb.) TAŞIMAZ — cevap_full'a
ILIKE ile sha temizliği 0 satır günceller ve Supabase'in "Success. No rows returned" mesajı
bunu MASKELER (UPDATE'te de aynı mesaj). Doğru adres: kuyruk parse_sonuc._cache_meta.
original_log_id → o kayıtların pdf_sha256'ları → hedefli NULL. Her UPDATE'in etkisi ayrı
SELECT ile teyit edilir. Ek ders: drenaj FİLTRELİDİR (wizard is_id / devre dokuman listesi) —
'bekliyor'a reset edilen satır, ait olduğu devre AÇILMADAN işlenmez; başka devreye yükleme
YENİ satır yaratır, eskisini akıtmaz. (Kaynak: 165 — iki kez yaşandı.)

## MK-165.5 [ATOLYE] — Zip-paket regresyon standardı: scripts/atolye-kosum.mjs
Atölye modelinin (MK-162.1) koşulabilir hali: `node scripts/atolye-kosum.mjs <pdf_klasoru>` —
pdfParse → glyph-onar → aileBirlestir → L2.parse (sunucu hattının birebiri), PDF başına tek
satır envanter + ham satır dökümü, ~30 sn/15 PDF. Her parser/paket değişikliği gerçek-PDF
setiyle taranır (MK-105.8: üretim PDF'i > sentetik; MK-132.1 sınırını da çözer — satır
metinleri GERÇEK extractor çıktısından). İlk uygulama (tersan.zip, 6 gemi/15 PDF): bilezik_detay
vakası — 7 HAM (İç, L='siz varyant pattern'e takılıyor) + 3 SESSİZ (Dış, tetik 'Ic Bilezik'
hiç uymuyor — MK-123.C sınıfı); yeni tip spesifiklik 6 / tetik 'Bilezik Detay', 10/10 satır +
tetik ayrımı kanıtlı. (Kaynak: 165, commit af90f85.)

## MK-165.6 [DISIPLIN] — Commit'ler ayrı komut bloklarında; && zinciri "nothing to commit"te kırılır
Zincirli çift-commit kalıbında ilk `git commit` "nothing to commit" ile non-zero çıkarsa &&
zinciri KESİLİR ve ikinci commit + push SESSİZCE koşmaz (165'te yaşandı: bilezik commit'i
önceki turda atılmıştı, dnBul commit'i zincirde kayboldu). Standart: her commit ayrı blok;
zincir yalnız tek-commit akışında. (Kaynak: 165.)

## MK-165.7 [BORC] — 165 ürün borçları: OPR dn→dis_cap sapması · taslak→wizard köprüsü · uyarı mükerrerliği
(1) OPR kalem editöründeki "dn" alanı kabukta fakir boyutParse'tan geçip dis_cap_mm'e OD
sanılarak yazılıyor (DN200 girişi → dis_cap 200.0; doğrusu 219.1) — çözüm adayı: kabukta
ARES_OLCU.olcuParse + ARES_BORU.dnBul (165'te eklendi, simetrik iş). (2) devre_detay taslak
önizlemesi kilitli ve wizard'a "düzenle" köprüsü YOK — MK-136 ?devre_id= URL'i var ama
görünür değil; kullanıcı düzeltme yolunu bulamıyor. (3) uyarilar'da aynı uyarının 2-3 dk
arayla mükerrer kayıtları (örn. A-000954 20:01:17 + 20:03:23) — teşhis edilmedi. (Kaynak: 165.)

## MK-85.3 (hatirlatma — 167'de bir kez ihlal edilip duzeltildi)
Sema-once: SQL kolon/anahtar adlari TAHMIN edilmez, once `information_schema` veya canli sorgu ile
dogrulanir. Spooller olcu kolonlari: `dis_cap_mm` ve `et_kalinligi_mm` (cap/et degil). 167'de bir kez
`olusturulma` tahmin edildi, sema `olusturma` cikti — aninda duzeltildi. JSONB teshis SELECT'lerinde
anahtar adi tahmini de bu ihlalin kardesidir; once gercek anahtari gor.

## MK-166 (Oturum 166)
- **MK-166.1 (ANA TASARIM):** izometri parse ISTEMCI drenaji ile yurur; sayfa-kapali isleme
  cron + sunucu-worker gerektirir. 166'nin tek buyuk mimari maddesi — 167'de uctan uca kuruldu.
- **MK-166.2:** Deger->koordinat aramasinda (kalem-zoom / hucre-git) SATIR GRUPLAMA sart. Cadmatic
  parcali metin uretir (tek kelime birden cok text node'a bolunur) → tek-item arama yetmez, satir
  bazinda gruplayip ara.
- **MK-166.3:** Kabuk fitting-only spool'da cap/et turetemez (icinde duz boru yok). Bu durumda cap/et
  degeri izometri parse dalinin ham ciktisindan gosterilir; terfide backfill ayni degeri yazar.
- **MK-166.4 (genelleme):** Yuzey alani stainless okuyorsa (paslanmaz/316/304/...) → `asit`
  (paslanmaz yuzey islemi asitlemedir). yuzeyKod + yuzeyBadge normalize; tabloda "Asit" gosterilir.
- **MK-166.5:** Taslak onizleme = salt KONTROL penceresi. Kilitli butonlar gizli, tek aksiyon Wizard
  koprusu. (MK-165.7/2 kapandi.)
- **MK-166.6:** Yukle akisi = paralel havuz + karar ekrani (yeni devre / incele / islenenler), tek
  "Yukle" butonu. izometri SIRADA alinir, BURADA ISLENMEZ — isleme Incele&Onayla akisinda veya
  Islenenler listesinde (istemci drenaji gercegi, MK-166.1 ile tutarli).

## MK-167 (Oturum 167)
- **MK-167.1 — Atomik claim guard:** `birIsIsle` lock'u
  `UPDATE ... deneme_sayisi+1 ... .eq('id').in('durum',['bekliyor','hata']).select('id')`. Satir
  donerse is bizim; bos donerse baska worker (cron <-> tarayici drenaji, ayni tenant ici cok-kullanici)
  zaten kapmis → `sonuc:'atlandi'` sessiz gec. Cift izometri-oku (cift batch + cift maliyet) onlenir;
  idempotent. `'hata'` dahil → wizard manuel-retry (is_id modu) korunur.
- **MK-167.2 — CRON_SECRET gate (sert mod):** `/api/kuyruk-isle` GLOBAL yol (batch_id YOK) → Bearer
  CRON_SECRET ZORUNLU (env yoksa 500, yanlis/eksik token 401). batch_id'li cagri (frontend PDF batch,
  izometri-batch.html) ACIK kaldi → 0 regresyon. Gate scope'a gore ayrilir; mevcut acik akis kirilmaz.
- **MK-167.3 — Cron izometri drenaji = mevcut worker'a dal:** `kuyruk-isle.js`, is_kuyrugu (PDF)
  sonrasi KALAN zaman butcesiyle `drenajTuru` (kuyruk-isle-izometri.js, zaten export, MK-112.1 ic-dongu)
  cagrilir. YENI ENDPOINT YOK (12/12 korunur — MK-129.3; import lib-ici). Butce 60s-gecen-8s; maxMs
  tavani 50s = tarayici drenajiyla AYNI (cron daha agresif olamaz). izometri-oku DOKUNULMADI (MK-49.1).

## MK-168 (Oturum 168)
- **MK-168.1 — GitHub schedule gecikmesi/guvenilmezligi:** Yeni eklenen `*/3` schedule ilk kosusunu
  35+ dk'da yapmadi; workflow sayfasi yalniz `workflow_dispatch` tetikleyicisini gosterdi. GitHub
  schedule yeni workflow'u tanimakta gecikir + dusuk-oncelikli kuyrukta atlayabilir (bilinen davranis).
  Mekanizma `workflow_dispatch`/curl ile KANITLI (200 + izometri.calisti:true, islenen:4). Yedek:
  vercel.json gece cron (03:00) + manuel dispatch. NOT: schedule tetikleyicinin calismasi icin
  workflow varsayilan dalin (main) HEAD AGACINDA commit'li olmali — 168'de `izometri-cron.yml` agaca
  islendi (commit ee33cf9); oncesi `tree-exit=1` (agacta yoktu) → schedule hic tetiklenmemisti.
- **MK-168.2 — (YANLIS ALARM, kapatildi):** "Drenaj `hata` islerini sonsuz retry'lar" endisesi YANLIS.
  Drenaj cekme sorgusu `.eq('durum','bekliyor')` → `hata` HIC cekilmez. `birIsIsle` claim'indeki
  `'hata'` yalniz wizard `is_id` manuel-retry icindir, cron/drenaj icin degil. Tavan gereksiz.
  Ders: kod okumadan (MK-126.8) tavan eklenmedi → bos commit'ten korundu.
- **MK-168.3 — izometri-oku HTTP 508 (Loop Detected):** Cron/drenaj yolu `opts.oncedenParse` olmadan
  cagrilinca sunucu kendi icinden `izometri-oku`'yu HTTP ile cagirir → Vercel self-call "loop detected"
  (508). Tarayici yolu PDF'i client'ta parse edip gonderir (skipParse) → 508'i asar; cron yolunda o
  kestirme YOK → agir/cok-sayfali PDF'lerde (M100-355-401/402-HC, 15-17 sayfa) 508. izometri-oku
  DOKUNULMAZ (MK-49.1) → kok neden orada duzeltilemez; cozum cagri katmaninda (cron yolu icin
  skip-parse esdegeri ya da farkli cagri mimarisi). BUYUK, AYRI IS. 508 isleri 'hata'da kalir, drenaji
  bogmaz (MK-168.2), ama parse de olamaz.
- **MK-168.4 — Ayni tenant ici cok-kullanici yukleme guvenli:** Ayni firma (tenant) icinde birden cok
  kullanici ayni anda devre yukleyebilir; ortak kuyrugu paylasirlar. Koruma RLS DEGIL (ayni tenant) —
  koruma tamamen MK-167.1 atomik claim guard'dir: birden cok worker (her kullanicinin tarayici drenaji
  + cron) ayni isi kapamaz, cift izometri-oku / cift maliyet olmaz. Sinir: backlog hiz siniri (4'er/tur,
  ~50s butce) + agir PDF 508 (MK-168.3). Dogal kullanim (hizli yukle-cik, arkada isle) desteklenir.


## 171. Oturum — Devre Yukleme Ekrani Yeniden Tasarim (2026-06-09)

**MK-171.1 — Inceleme cetelesi Fazla satiri 14 hucre.** "kabukta yok / Fazla" satiri tam 14 kolon:
# + colspan10 aciklama + DURUM + IZOMETRI(dosya adi TEK sefer) + ISLEM(Eslestir). Onceki 13-hucre
kayma + cift dosya-adi bug'i kapandi. Montaj satiri (colspan11) zaten saglamdi, dokunulmaz.

**MK-171.2 — Hata bandi retry = once hata->bekliyor, sonra mevcut drenaj.** Izometri drenajinin IS-SECEN
filtresi yalniz durum=bekliyor ceker (kuyruk-isle-izometri.js:209); 'hata' satiri seim asamasinda elenir.
Bu yuzden "yeniden dene" = hata satirlarini bekliyor'a cevir (+hata_mesaji:null) + mevcut
islenenlerDrenajDevre cagir. deneme_sayisi'ye DOKUNULMAZ (izo drenajinda MAX guard yok). Yeni endpoint yok.

**MK-171.3 — Tek tiklama-tek input picker.** Drop alani KENDI onclick'iyle pencere ACMAZ; sadece iki
buton acar (Klasor Sec / Dosya Sec), her biri type="button" + event.stopPropagation(). Cift-.click()
cakismasi (dropZone folder + buton file) bu sekilde kokten engellenir.

**MK-171.4 — Devre seviyesi NOT alani YOK.** devreler tablosunda not/aciklama kolonu yoktur (yalniz
yuzey_aciklama, o yuzeye ozeldir). Devre formuna serbest not eklenmez (information_schema teyidi — MK-85.3).
Termin OPSIYONEL ama formun GORUNUR parcasidir (gizli details'te degil).

**MK-171.5 — Paylasilan class restyle SCOPE ile yapilir, global degil.** .fld/.card-t/.sel/.inp Adim 2'de
de kullanilir; gorsel degisiklik [data-panel="1"] altina scope'lanir (yuksek ozgulluk, global kurallar durur).
Bir paneli restyle etmek digerini ETKILEMEZ. Markup'a dokunmadan salt CSS ile yapilir.

**MK-171.6 — Yukleme animasyonu GERCEK ilerlemeye baglanir, sahte timer'a degil.** .ftree.ai-tarama scan
efekti + .fitem'ler biten/toplam oranina gore kademeli .okundu. Paralel havuzda (6 esz.) sira onemsiz
oldugu icin oran-bazli isaretleme dogru yaklasimdir. Klasor basliginda SOL CIZGI YOK (ne mavi ne yesil) —
tarama cizgisi + satir mavilesme + ✓ yeterli gostergedir (Cihat karari).

**MK-171.7 — Yukleme sonrasi karar ekrani MODAL.** #sonucKuti akista degil, ortada modal + backdrop+blur.
wizardSifirla zaten location.href ile sayfayi yeniler -> modal elle kapatilmaz. Salt UI, server degismez.

**MK-171.8 — Ilerleme cubugu agacin USTUNDE.** Progress (#hazirlikKutu) #tree1'in onunde, agaca bitisik
ince cizgi. Popup icerigi: ✓ ikon + baslik + 4 ozet kutu (belge/izometri/BOM/diger gercek sayilar) +
<small> aciklamali butonlar.

**MK-171.9 (operasyonel) — Push HEP `gpc` ile.** ~/.zshrc'de gp() ve gpc() kuruldu. gpc "mesaj" =
git add -A + commit + pull --rebase + push. CI botu araya ci-son-rapor.json commit'i attigi icin manuel
`git push` surekli reddediliyordu; gpc rebase'i otomatik halleder. Manuel push YAPILMAZ.

**MK-171.10 (ilke) — Sayfa YARIM birakilmaz.** Fonksiyon bitince "gorseli sonra" deyip gecmek borc
biriktirir (Cihat'in dile getirdigi endise). Bir sayfa ele alindiginda fonksiyon+gorsel+cila ayni
oturumda bitirilmeye calisilir. Erteleme zorunluysa docs/UI-BORC.md'ye ACIK kayit dusulur.
# KARARLAR.md — 172. OTURUM EKI (MK-172.1 .. MK-172.10)

> Bu blogu docs/KARARLAR.md kok dosyasinin sonuna ekle (kok dosya pakette degildi).

## MK-172.1 — Devreler tek giris: yesil "Devre Ekle" -> wizard v3
v1 (devre_yeni.html) ve v2 (devre_wizard.html) EMEKLI + git rm (gecmis korur). devreler.html'de tek YESIL
"Devre Ekle" butonu kosulsuz devre_wizard_v3.html'e gider; flag gating (tenant_features.devre_wizard_v3)
sorgusu + Islenenler nav butonu + v3-outline KALDIRILDI. proje_detay.html "Yeni Devre" da v3'e baglandi.
Gerekce: v3 artik tek yol; pilot flag donemi bitti. tenant_features satiri DB'de durur, okunmaz.

## MK-172.2 — Devreler tablosunda "Son guncelleme" damgasi
Tablo basligindaki devre sayisi (ust stat kartinda zaten var) kaldirildi; saga "Son guncelleme: GG/AA/YYYY
SS:DD" geldi. veriYukle (acilista 1 kez, filtreden bagimsiz, RLS tenant-scoped) en yeni olusturma + en yeni
non-null guncelleme ceker, JS max'ini gosterir. KURAL: PostgREST .order(col,{ascending:false}) NULL'lari
BASA alir -> guncelleme-only sorgu bos doner; olusturma yedegi + .not('guncelleme','is',null) sart.

## MK-172.3 — Imalat sira numarasi kaldirildi
devreler satirindaki sira-input (ares_devre_sira localStorage) goruntuden kaldirildi; yildiz (malzeme
durumu rozeti) kaldi. siraGuncelle/getSiraMap olu kod oldu (ileride temizlik).

## MK-172.4 — Native termin takvimi
Ozel takvim popup'i (#takvimPopup + takvimAc/terminKaydet/terminTemizle/takvimKapat) emekli. Satirda gizli
<input type=date>; termin-btn'e tiklayinca terminAc -> input.showPicker() (yedek focus+click). onchange ->
terminSec aninda Supabase'e yazar (Kaydet butonu yok). Temizleme native picker'in kendi temizlemesiyle (bos->null).

## MK-172.5 — Buyuk .in() listelerini DILIMLE (Bad Request korumasi)
Cok ogeli .in() listesi (yuzlerce UUID) URL'i sisirip PostgREST 400 "Bad Request" verir. Cozum: idleri
dilimleyip (orn 150) sirayla cek, birlestir (_inDilimli). islenenlerYukle'de devre_dokumanlari +
dosya_isleme_kuyrugu sorgulari boylece bolundu. GENEL KURAL: tenant geneli .in() sorgularinda dilim sart.
Ipucu: "Bad Request" (kolon hatasi degil aciklayici mesaj gelmemesi) + "hacim artinca bozuldu" = buyuk-.in().

## MK-172.6 — Islenenler ekrani redesign (kutu-per-satir)
Eski .isl-satir (sade grid) -> mockup: kart hover/yukselme, durum-renkli ince kenar (hazir/isleniyor/hatali),
isleniyor satirinda animasyonlu progress (gercek biten/toplam), oneri/manuel cikti blogu, baslikta
"N hazir . M isleniyor" ozeti. Render _islSatirHtml + _islOzetYaz helper'larina ayrildi.

## MK-172.7 — Drenaj durdur()/interrupt: tek-drenaj + oncelik
ares-izometri-drenaj.js'e isbirlikci iptal: durdur() bayrak set eder, dongu her is/tur arasinda kontrol
eder (devam eden is biter, sonrakine gecmeden durur — 113 cift-odeme garantisi korunur), ozet.iptal doner.
Wizard'da tek-drenaj: yeni drenaj baslamadan kosani durdurup bekler (_drenajOnceDurdur + WIZ._aktifDrenaj +
_drenajTk token). Bir devre islenirken baska "Isle"ye basinca mevcut durur, oncelikli baslar. islenenlerDrenaj
(global) + drenajiBaslat (Inceleme oto) da ayni mekanizmaya bagli. SONUC: iki eszamanli client-loop'un
ayni isi cekip urettigi 409 (Conflict) seli BITTI. GECE CRON (kuyruk-isle.js izoDrenajCalistir, server-side)
AYRI koddur, bu degisiklikten ETKILENMEZ; lock sayesinde cron ile in-page cakismaz.

## MK-172.8 — Islenenler yukleme: shimmer iskelet + cascade reveal
"Yukleniyor" statik beklemesi kaldirildi. Gercek satir yoksa acilista ANINDA shimmer iskelet (devreler 14.
oturum .sk deseni). Veri gelince satirlar yukaridan asagi kademeli acilir (_islCascade, --ci ile 45ms artan
gecikme, ilk 20 satir; devreler _cascadeIn deseni). Yenilemede (drenaj 3'luk tazeleme) ci=null -> animasyon
YOK (flicker/ziplama yok). Ders: bekleme hissini iki-fazli render degil, ANINDA iskelet kapatir.

## MK-172.9 — per-device "Isleniyor" butonu: beyaz + yanip sonen nokta
"Isle"ye basinca buton mavi yerine beyaz "Isleniyor" + solunda yanip sonen mavi nokta (kum saati YOK).
Render WIZ._islDrenajDevreId'yi bilir -> 3'luk liste yenilemesinde durum korunur. Islenenler nav butonundaki
kum saati de yanip sonen noktaya cevrildi (sayfadaki diger kum saatleri ayni formata).

## MK-172.10 — Step 1 "<- Geri" -> Islenenler listesi
Wizard Adim 1 header Geri butonu devreler.html yerine islenenlerAc() (panel 3 / liste) cagirir. devreler'e
cikis breadcrumb "Devreler" veya "Iptal" ile. Gerekce: Islenenler listesi wizard'in dogal "geri" hub'i.

## EK NOT (172 ANIM-FIX)
.ftree { overflow:hidden } — Step 1 tarama cizgisi (tScan top:0->100%) tasip gecici yatay scrollbar
yaratiyordu; clip'lendi. (Bu, MK-172.8 cascade'inden AYRI bir kozmetik fix.)

# KARARLAR.md — 173. OTURUM EKI (MK-173.1 .. MK-173.4)

## MK-173.1 — CLAIM-FIRST: atomik lock parse'tan ONCE
In-page izometri drenajinda tarayici PARSE'tan (PDF indir + izometri-oku = L3 vision, pahali) ONCE isi "claim"
eder. Claim baskasinda (gece cron / baska sekme) ise parse YAPILMAZ -> bos L3 odemesi ve 409/508 israfi biter.
KOK NEDEN: server claim'i (MK-167.1) zaten atomikti AMA parse'tan SONRA calisiyordu; sira yanlisti. Atomik lock
dogru yerde degilse ise yaramaz — claim-ONCE-parse.
Uygulama (yeni endpoint YOK — MK-129.3; izometri-oku DOKUNULMAZ — MK-49.1):
- kuyruk-isle-izometri.js is_id dalina `claim_only:true` modu (SADECE atomik claim, indirme/izometri-oku yok),
  {claimed:true/false} doner. `zaten_claim:true` -> sonuc-post guard'i durum='isleniyor'a izin verir (kendi
  claim'imiz). birIsIsle: zatenClaim ise re-claim ATLANIR (yoksa bos doner -> yanlislikla 'atlandi').
- ares-izometri-drenaj.js _birIsIsle parse ONCESI claim postlar; claimed:false -> {sonuc:'atlandi'} (parse yok).
  ozet.atlandi sayaci (islenen DEGIL, hata DEGIL).
- deneme_sayisi claim'de 1x artar (sonuc-post'ta artmaz). Tarayici claim sonrasi cokerse staleLockTemizle toparlar.
- Gece cron (drenajTuru->birIsIsle opts'suz) normal re-claim yolunda, ETKILENMEZ. Eski client geriye uyumlu.

## MK-173.2 — Buyuk .in() dilimle: AYNI fonksiyon degil, AYNI ids'i kullanan komsu sorgular da (MK-172.5 genisletme)
Bir fonksiyondaki buyuk .in() (URL sismesi -> 400) duzeltilirken, AYNI ids'i kullanan KOMSU sorgular da taranir;
tek nokta yetmez. devre_wizard_v3.html: hataYenidenDene UPDATE 150'lik dilim dongusuyle bolundu; hataBandiYukle
SELECT (ayni ids) _inDilimli(150) ile bolundu — yoksa retry butonunu barindiran bant once 400 yer, buton hic
gorunmez, UPDATE fix'i etkisiz kalirdi.

## MK-173.3 — Olu kod silmeden once grep kaniti + cagiranlari ayni patch'te kaldir
Olu kod silmeden once her sembol grep'le "tanim var, cagri yok" diye kanitlanir. Bir tanim siliniyorsa onu cagiran
TUM satirlar AYNI patch'te kaldirilir (ReferenceError onlemi). 173/C: getSiraMap/siraGuncelle + _siraCache atamasi
+ .sira-input/.takvim-popup CSS (172 SIRA/TERMIN emeklileri) silindi. _siraCache atanip okunmuyordu; getSiraMap
silinince onu cagiran satir ayni patch'te gitti. Native termin picker (.termin-* + .termin-dt) AKTIF, dokunulmadi.

## MK-173.4 — Tek aksiyon = tek buton + tek blink sinyali
Bir aksiyon icin TEK buton; islem sinyali (yanip sonen nokta) TEK yerde (aksiyon butonu) durur. Cakisan ikinci bir
"yanip sonen buton" (nav pili) gurultudur, kaldirilir. devre_wizard_v3.html: #btnIslDrenaj bosta mavi .btn.pri,
islerken beyaz + yanip sonen mavi nokta (.isl-run; id+class specificity .btn.pri:disabled greyini ezer). Nav pili
#btnIslenenler sureki blink (.isl-btn-dot) kaldirildi -> sade "Islenenler (sayi)" navigasyonu (Adim 1/2 giris
kapisi oldugu icin silinmez). ozet.atlandi (MK-173.1) toast'ta gosterilir (global + per-satir): claim-first ile
"baska isleyici almis" NORMAL sonuctur, hata DEGIL.

## EK NOT (173 ISLENMEYEN / AYRI OTURUM)
IS2 (terfi "Aktariliyor..." donmus hissi -> iskelet/cascade animasyon) Cihat karari ile AYRI OTURUMA (buyuk).
W-2.5 (Step-1 iki ilerleme cubugu progressFill + islenStrip) gorsel/UX karar, ekranda gosterilmeden tahminle
birlestirilmez (MK-132.1). Islerken nav piline capraz-gorunum noktasi tek-buton istegine sadik kalmak icin KASTEN
konmadi.
# KARARLAR.md — Oturum 175 ekleri (HEAD eb12c0c sonrası)

## MK-175.1 — Excel↔PDF cap/et/yüzey boş-doldurma uçtan uca kanıtlandı (DATA-first)
Faz 1b'nin kalanı için karar: **B (böl) mimarisi** — alan başına TEK yazıcı.
- kalite → `birlesikler` kanalı (terfi-zamanı, wizard `_birlesikHarita`). backfill kalite YAZMAZ (Excel BOM'da kalite kolonu yok + bindir kalite üretmez).
- cap/et/yüzey/not → `eslestirme-backfill` → `eslestir()` → `bindir()` (terfi-sonrası + devre_detay yolu). birlesikler bunları YAZMAZ.
- **Neden A (tek kanal) reddedildi:** backfill HEM wizard HEM devre_detay yolunu besler (MK-49.B); birlesikler yalnız wizard. Alan boş-doldurma backfill'den çıkamaz → "tek kanal" aslında ikinci yazıcı ekler, çift-yazım borcu yaratır.
- **Kanıt (canlı SQL):** `parse_sonuc._eslesme.detay[].bindirme` `kabuk_bos_dolduruldu` kayıtları spooller kolonlarıyla birebir eşleşti; linkage `pdf_bagli=true`. Saha dağılımı (flag/sebep):
  - yüzey: 624 dolduruldu / 218 eşit / 5 çelişki
  - et: 61 dolduruldu / 697 eşit / 57 çelişki
  - cap: 15 dolduruldu / 724 eşit / 76 çelişki (NOT: bunların 46'sı sahte — MK-175.3)
- `bindir` davranışı saf boş-doldurma: pdf yoksa dokunma; kabuk boş→doldur; eşit→geç; farklı→kabuk korunur+flag (ezme yok). Ağırlık %3 tolerans.

## MK-175.2 — Wizard cap/et/yüzey kaynak rozeti türetildi (PUSH: eb12c0c)
**Sorun:** wizard Adım 2 önizlemede cap/et rozeti sabit 'xl' (Excel) basıyordu; yüzey `yuzeyHam` varlığına bakıyordu (Excel yüzeyi de yanlışlıkla L2 diyordu). Kalite (174) dinamikti, cap/et/yüzey değildi.
**Çözüm (TÜRETİLMİŞ — şema dokunulmadı, MK-164.3 uyumlu, retroaktif kaynak yazımı YOK):**
- `api/devre-inceleme.js`: cap/et/yüzey boş-doldururken `s.cap_kaynak / s.et_kaynak / s.yuzey_kaynak = 'izometri'` izi (kalite deseninin eşi, ~satır 307-310). Yalnız `_inceleme.spoollar` çıktısı zenginleşir, DB'ye yazım yok, lib SAF.
- `devre_wizard_v3.html` (~satır 2664-2665): `dsatir('cap'/'et'/'yuzey', s.X_kaynak==='izometri' ? izoSrc : 'xl')`.
- MD5: devre-inceleme.js = ceeab43e8d741ce5040a6baff02f141b · devre_wizard_v3.html = ca4c7722c163ba70000bab5c6994a470
- devre_detay'da kaynak rozeti YOK (Cihat teyit etti) → kapsam yalnız wizard. (Cihat: önizleme ekranına ileride devre_detay'dan erişim verilecek → rozetler oraya bedavaya taşınır.)

## MK-175.3 — NPS→mm dis_cap_mm sızıntısı kapatıldı (58 spool, DATA düzeltme)
**Belirti:** çap çelişkilerinde Excel kabuk değeri "3"/"4" (NPS, inç), PDF "88.9"/"114.3" (gerçek mm). 76 çap çelişkisinin 46'sı bu yüzden SAHTE.
**Kök (kanıtlı):** ESKİ VERİ — kod sağlam. `ARES_OLCU.olcuParse` 14 gerçek format birebir test edildi (`4" Sch 10S`→114.3, `DN100`→114.3, `3" x 2-1/2"`→88.9, `4" / 4" Sch.10S`→114.3, slash/nokta/çift-NPS dahil), hepsi DOĞRU. `ARES_BORU.disCap(100)=114.3` doğru. Sızıntı ≤21 Mayıs "fakir boyutParse" döneminden (SCH/inç bilmiyordu, `4" Sch 10S`→dis_cap=4). Tarih kanıtı: yığın 22-23 Mayıs (olcuParse 22 Mayıs/111. oturumda geldi); son 6 günde yeni sızıntı YOK → kod fix gerekmez.
**Düzeltme (BEGIN...COMMIT, dry-run önce):**
- Faz A: `dis_cap_mm IN (2,3,4) AND dis_cap_mm <= et_kalinligi_mm` (fiziksel imkansız) → CASE 2→60.3, 3→88.9, 4→114.3. **46 spool.** (Dış çap malzeme-bağımsız — paslanmaz da karbon da aynı, kanıtlı.)
- Faz B: et=null şüpheliler (12 spool, hepsi ham boyut `4" Sch 10S`/DN100) → cap=114.3 + **et=3.05 birlikte** (Cihat kararı: çap ve et aynı deterministik kaynaktan ayrılmaz; eti backfill'e bırakmak "iki ıraksak yol" hatasının tekrarı olurdu). id-bazlı hedefli UPDATE.
- 21.30 (gerçek ½" mm dış çap, 23 satır) DOKUNULMADI — `<30` tek başına sızıntı değil; gerçek imza `cap <= et`.
- **Veri silinmez:** kaynak ham `boyut` `spool_malzemeleri`'nde korunuyor, yeniden türetilebilir → onarım, kayıp değil.
- Sonuç: tüm `<30` sızıntı 0; kalan 23 satır hepsi gerçek 21.30.

## Açık (bu oturumda KAPATILMADI)
- **KARARLAR.md MK-169/170/171 boşluğu** HÂLÂ var (168→172 atlıyor). Bu oturum 174+175 eklendi; 169/170/171 boş.
- **MK-117 (yukleyen_id null)** duruyor.
- **`1 1/4"` boşluklu kesir** ayrı nadir bug: `olcuParse("1 1/4\"")`→dis_cap=1 (regex `[\d.\-\/]+` boşlukta kesiliyor). Tireli (`1-1/4"`)→42.2 doğru. Düşük öncelik, sahada nadir; istenirse `ares-olcu.js` regex'i boşluklu kesir + ondalık NPS (1.25/1.5) için genişletilir.
# KARARLAR.md — Oturum 176 eki (docs/KARARLAR.md'ye eklenecek)

> Bu blok mevcut KARARLAR.md'nin sonuna eklenir. MK-169/170/171 boşluğu da burada
> dolduruluyor (oturum özetleri eksikti — girişler 176'da KODDAKİ yorumlardan türetildi,
> aşağıda "[koddan türetildi]" ile işaretli; gerekirse ilgili oturum sahibi düzeltir).

---

## MK-169 — Wizard İnceleme: teşhis bandı + manuel PDF→kabuk eşleştirme [koddan türetildi]
- **MK-169 (teşhis bandı):** `devre_wizard_v3.html` İnceleme'de durum-bazlı yönlendirme bandı
  (`teshisBandiCiz`): kabuk=0 → "Excel okunamadı/eksik" (kırmızı); fazla>0 → "izometri eşleşmedi,
  Excel'i kontrol et" (amber, **Excel=dayanak** kuralı); eksik>0 → "izometri gelmemiş, eksik
  bırakıp terfi edebilirsin"; hepsi temiz → bant gizli.
- **MK-169/A1 (manuel eşleştirme):** Fazla (🟠) PDF spool'u operatör elle bir kabuk spool'una bağlar.
- **MK-169/A2 (`_pdf_spool_map` overlay):** Eşleştirme `taslak_duzeltmeleri` tablosunda
  `alan='_pdf_spool_map'`, `kalem_idx=-1`, `deger=hedef kabuk spool_no` olarak saklanır. Hem önizleme
  (`devre-inceleme.js`) hem kanonik eşleştirici (`kuyruk-isle-izometri.js` `eslestir`/`kabukYukle`)
  bu overlay'i okur (`pdfSpoolMap`) — fazla PDF'i hedef kabuğa map'ler. Anahtar uzayı
  `normPipeline|normSpoolNo` (harita ile aynı).

## MK-170 — Wizard: dosya-seviyesi hata bandı [koddan türetildi]
- `hataBandiYukle` / `hataYenidenDene` (`devre_wizard_v3.html`): bu devrenin `durum='hata'` belgelerini
  istemci tarafında çekip kırmızı bantta listeler (server `devre-inceleme` hata döndürmüyor → 12/12
  değişmez). "Hepsini yeniden dene" → hata satırlarını `bekliyor`'a çevirip drenajı tetikler.
- **MK-170/#3:** ids yüzlerceyse `.in()` URL şişmesi → `_inDilimli` 150'lik dilim (MK-172.5 sınıfı).

## MK-171 — Wizard: tarama animasyonu + RETRY [koddan türetildi]
- **MK-171/ANIM:** Belge yükleme sırasında ağaç-tarama efekti (`ai-tarama`/`.fitem.okundu`),
  oran-bazlı satır işaretleme (paralel havuzda sıra önemsiz).
- **MK-171/RETRY:** `hataYenidenDene` — devrenin TÜM hata satırlarını `bekliyor`'a çevir
  (`deneme_sayisi`'ye dokunma, `hata_mesaji:null`) + per-devre drenaj. 150'lik UPDATE dilimleri.

---

## MK-176.1 — Faz 2 (Excel↔PDF çelişki kazananı) KAPATILDI
- **Karar:** Faz 2'nin net-yeni mantığı (manuel Excel → PDF kazanır flip) kurulmadı.
- **Gerekçe (DATA, MK-158.1):** `dosya_isleme_kuyrugu` parser='excel-generic' dağılımı: **184 kayıt
  L1/güven 95/ref_uygun=true (referans), 1 fail.** `guven<70` manuel Excel = **0 vaka.** Flip'in hedef
  popülasyonu boş. Mevcut `bindir` (kabuk her zaman kazanır + flag) prod'un %100'ünü doğru işliyor.
- **Ek gerekçe:** Manuel Excel sistemde `manuel_onay`'a düşüp kolonları İNSAN eşliyor → "manuel = az
  güvenilir → PDF kazansın" varsayımı tartışmalı (insan-eşlemeli BOM, oto-parse PDF'ten az değil).
- **Sinyal yeri (gelecek referansı):** `excelReferans ≡ parse_sonuc.otomatik_insert_uygun
  ≡ (seviye='L1' && guven>=70)`, dosya-bazında, `dosya_isleme_kuyrugu.parse_sonuc`'ta saklı.
  `spooller`'da kalıcı kolon YOK. Manuel Excel gerçekten gelirse çelişki flag'i zaten 🟡 gösterir.

## MK-176.2 — Backfill sayfalama (terfi timeout kökü, teşhis)
- **Kök:** `api/eslestirme-backfill.js` izometri dalı, devrenin TÜM oneri_hazir/manuel_onay kayıtlarını
  TEK invocation'da işliyordu. Çok-belgeli devrede (örn. 356 PDF) her `eslestir` kabuğu baştan yükler
  → 60sn `maxDuration` aşılır → `FUNCTION_INVOCATION_TIMEOUT` → terfide `izoHata` → auto-close atlanır
  → kuyruk birikir. **129/130 "terfi sonrası izometri bağlanmıyor" borcunun GERÇEK kökü** (157 ESM
  fix'inin altında kalan ölçek sorunu). Yaygınlık: 14 aktif devre, 1127 açık kuyruk.
- **Fix:** keyset imleç (`id ASC` + `after_id`) + sınırlı `batch` + zaman bütçesi; istemci/terfi
  client-loop ile `bitti=true`'ya dek çağırır (MK-113/A: sunucu-sunucu YOK). `eslestir` durum'u
  değiştirmez → imleç tekrar seçmez; idempotent.

## MK-176.3 — Backfill kabuk-cache (throughput)
- **Ölçüm:** non-kuru ~1.3sn/kayıt; bunun ~0.5sn'si her `eslestir`'in kabuğu (spooller +
  taslak_duzeltmeleri + spool_malzemeleri = 3 SELECT) DEVRE BAŞINA TEKRAR yüklemesi.
- **Fix:** `kabukYukle(supa, devreId)` export'u (3 SELECT tek yerde). `eslestir`/`montajEslestir`'e
  opsiyonel `ctx` — verilirse kabuğu yeniden yüklemez. **ctx===undefined → drenaj yolu BİT-AYNI**
  (MK-109.1 korunur). Backfill devre-bazlıysa kabuğu batch başına TEK yükler. Promote sonrası
  `hedef.cizim_durumu='kismi'` (ctx-cache tutarlılığı: aynı batch'te 2. kayıt STALE 'bekliyor'
  görüp guard'ı yanlış tetiklemesin).

## MK-176.4 — Backfill budget girişten ölçülür + batch=40 (timeout sağlamlığı)
- **Bulgu:** batch=120'de bütçe guard fetch'ten SONRA başlıyordu; dolu parse_sonuc JSONB fetch'i
  wall-clock yiyordu → ağır fetch + 45s işlem 60s'yi aşıp hard-timeout. **`_t0` artık fonksiyon
  girişinde** (fetch dahil). BUTCE 45→40s (20s pay). batch varsayılan 120→40 (hafif fetch).
  montaj `ozet`'inde `yukseltilen` yok → `(||0)` NaN guard.
- **Kanıt:** kfukfuyk (356 PDF) 8 turda, hard-timeout YOK, ~2:42'de tam drene; spooller bekliyor
  173→**0**, hepsi `kismi`. Efektif ~0.45sn/kayıt.

## MK-176.5 — Wizard terfi backfill client-loop
- `devre_wizard_v3.html` terfi: tek `fetch(backfill)` → client-loop (`bitti`'ye dek `after_id`).
  Loop temiz biterse `izoHata=null` → mevcut 166/K2-A auto-close çalışır → **yeni terfiler kuyruğu
  temiz bırakır.** Güvenlik tavanı 60 tur. Herhangi tur hata/boş → izoHata set, dur (auto-close atlanır,
  devre_detay'dan recovery edilebilir).

## MK-176.6 — devre_detay recovery butonu (kirli devre)
- Onay Kuyruğu başlığında "↻ İzometriyi yeniden eşleştir" → client-loop backfill (MK-176.5 eşi) →
  `onayKuyruguYukle` (taze `_eslesme`) → `onayTopluKapat` (yalnız TEMİZ izometri; atanmamış/manuel
  AÇIK kalır, B-6) → `spoolYukle`. Yeniden parse YOK ($0). `_tkKilit` aktif devrede tetiklenmez.
- **Kanıt (kfukfuyk):** önce oneri_hazir 311 / manuel 45 → sonra tamamlandi 314 / manuel 45 / oneri 0.

## MK-176.7 — Onay Kuyruğu mimarisi (Cihat fikri, SONRAKİ OTURUM)
- Cihat'ın gözlemi: aktif devrede ayrı "onay kuyruğu" yerine **wizard İnceleme/düzenleme ekranını
  spool_detay/devre_detay'da göster** → veri isteyen oraya bakar, ayrı kuyruğa gerek kalmaz.
- **Karar:** Bugün YAPILMADI (ayrı oturum — IS2 deseni). Kök rahatsızlık (canlı devrede 228 kuyruk)
  zaten bir BUG'dı (backfill timeout), bu oturumda çözüldü → sağlıklı aktif devrede Onay Kuyruğu
  zaten görünmüyor (166/K2-A: rozet 0 → sekme gizli). Sekme yalnız gerçek sinyal (atanmamış/manuel/
  post-terfi-Excel) varken çıkıyor — bunlar TEŞHİS, sessizce gizlenmemeli (B-6).
- **Sonraki oturum kapsam araştırması:** `devre-inceleme.js` taslak-dışı bağlamda anlamı, spool_detay
  yapısı, aktif devrede "düzeltme/eşleştirme" eyleminin karşılığı (terfi yok artık).

## MK-177.1 — Kütüphane verisi migration değil, seed script ile girer
- **Karar:** boru/fitting/flanş ölçü katalogları "schema versiyonu" değil "doğru hâl"dir. Numaralı/sıralı/
  rollback'li migration yanlış araç (Cihat'ın eski sezgisi doğruydu). Doğru araç: idempotent upsert.
- **Akış:** `PDF → JSON → node scripts/seed-from-json.mjs <dosya> [--yaz] → DB`. `--dry-run` varsayılan.
  Sadece `_db_aksiyonu IN (YENI_*)` yazar; `onConflict`= tablo unique-key (script içi `UNIQUE_KEY` haritası).
- **Eski migration'lara DOKUNULMAZ** (arşiv, ölü, koşmuş). `migrations/data/*.sql` korunur. Yeni VERİ için
  migration yazılmaz; yeni SCHEMA için yazılır (CREATE/ALTER hâlâ migration).
- **İzlenebilirlik kaybolmaz:** kaynak/MD5/tarih JSON `meta` + her satır `kaynak`/`notlar` kolonunda.
- **Kanıt:** Sandvik paslanmaz `boru_olculer` 52 satır, 0 hata. DB B36.19M=89 / B36.10M=43, beklentiyle birebir.
- Commit 3243e51, push 87c36c1. Script CLI'dir (serverless değil) → 12/12 fonksiyon tavanı etkilenmez.

## MK-177.2 — Seed: generated kolon kendi kendini iyileştirme
- **Bulgu:** `boru_olculer`'da et_min_mm/et_max_mm/ic_cap_mm GENERATED ALWAYS (DB hesaplar). Bu kolonlara
  değer göndermek "cannot insert a non-DEFAULT value into column X" hatası verir.
- **Çözüm:** Hardcode liste YERİNE — upsert hatasından kolon adını regex'le yakala (`non-DEFAULT value into
  column "X"`) → o kolonu tüm satırlardan düş → aynı batch'i retry (en fazla 6 deneme). Her tabloda çalışır,
  tablo-özel hardcode gerekmez. `_`-prefiksli iç alanlar (`_db_aksiyonu`, `_sanity_*`) ayrıca baştan atılır.

## MK-177.3 — Fitting/flanş seed: önce unique key kararı (AÇIK, sonraki oturum)
- **Engel:** `fitting_olculer` doğal UNIQUE constraint YOK (sadece id pkey) → upsert `onConflict` dayanağı yok.
  Boru'da `(standart,malzeme_grubu,dn,schedule_tipi,schedule_deger)` vardı; fitting'de tanımlanmalı.
- **Öneri (DOĞRULANACAK):** `(standart, malzeme_grubu, parca_tipi, cap_buyuk_dn, cap_kucuk_dn)`. Dolu 897-satır
  tabloda MK-98.2 dry-run ALTER + `GROUP BY ... HAVING COUNT(*)>1` çakışma kontrolü ŞART (tekrar varsa ALTER patlar).
- **İkinci engel:** eski cunife JSON'larında `_db_aksiyonu` YOK (94-96 dönemi) → script "yazılacak yok" der.
  Uyarlama: alan hiç yoksa tüm satırları yaz.
- **Gerçek eksik (DB teyitli):** DIN 28011 cap (21) + DIN 86087 saddle → fitting_olculer'da YOK. JSON'lar hazır.
## Oturum 178 — Kütüphane: Paslanmaz B16.9 fitting

### MK-178.1 — Kütüphane veri girişi: %100 referans, türetme YASAK
Parça kütüphanesine (ölçü + **ağırlık**) giren her değer referans belgeden gelir. Türetme / yoğunluk-faktörü /
formül-hesabı **yasak** — yanlış değer = yanlış malzeme planı = imalat hatası. Karbon-bazlı ağırlığı paslanmaz için
kabul etmeyiz (~%2 yoğunluk farkı önemli). Ağırlık atlanmaz; bir kaynakta yoksa başka referanstan çekilir. Oluşturulan
tablo **en az ikinci bağımsız kaynakla doğrulanır** (MK-96). `notlar`'a `kaynak` + `dogrulandi` + sapma yazılır.
Ölçü malzemeden bağımsızdır (ASME B16.9 / MSS-SP-43 paslanmaz+nikeli aynı geometriyle kapsar) ama yine de mevcut
DB geometrisiyle teyit edilir, körü körüne kopyalanmaz. Şüpheli satır `_db_aksiyonu: FLAG_SUPHELI` → yazılmaz.

### MK-178.2 — `fitting_olculer` doğal unique key
`fitting_olculer`'da doğal unique constraint yoktu (sadece id pkey) → idempotent upsert imkansızdı. Eklendi:
`fitting_olculer_dogal_uk = UNIQUE NULLS NOT DISTINCT (standart, malzeme_grubu, parca_tipi, cap_buyuk_dn, cap_kucuk_dn, schedule_kod, class_no)`.
NULLS NOT DISTINCT şart (B16.9 geometri satırlarında schedule_kod/class_no/cap_kucuk_dn NULL; upsert için null'lar eşit
sayılmalı, Postgres 15+). MK-98.2 dry-run ile çakışma kontrol edildi (mevcut 897'de tekrar yok). NOT: Supabase SQL editörü
BEGIN/ROLLBACK'i her zaman tutmaz → DDL sonrası `pg_get_constraintdef` ile teyit zorunlu. `flansh_olculer` için constraint
HENÜZ yok (flanşa geçince aynı prosedür).

### MK-178.3 — Paslanmaz fitting kaynak hiyerarşisi
Birincil: **dynamicforge A403/A815** (ASME B16.9 ölçü + duvar + schedule-başına ağırlık çizelgesi).
Doğrulama: **buyfittingsonline** (gerçek 304/316 ürün ağırlığı) — DN40/50/80 90LR'de <%1 örtüştü.
Otorite: **Sandvik/Alleima** (5S–Sch160, 304/316 + dupleks, ASME SA403). Karbon-bazlı çizelgeler (ZIZI vb.) güvenilmez,
çapraz-doğrulamada elenir. (cunife: KME OSNA + Wieland + Stirlings. paslanmaz boru: Sandvik.)

### MK-178.4 — seed-from-json.mjs fitting'e uyarlandı
UNIQUE_KEY.fitting_olculer 7-alan; `notlar` nested obje → JSON.stringify (TABLO-BİLİNÇLİ: TEXT_JSON_KOLONLAR;
boru_olculer.notlar JSONB'ye DOKUNMA, çift-encode olur); YENI_AKSIYONLAR'a 'YENI' eklendi; dry-run preview generic.

### Açık quirk (temizlenecek — okuma kodu görülünce tek seferde)
- `yaricap_mm`: karbon satırları 1.5×OD tutuyor (DN100=171.4, muhtemel hata); paslanmaz 1.5×NPS (doğru, =A). Hizalanacak.
- 45° uç-uca: karbon `ucu_uca_b_mm` kullanıyor; şema yorumu `ucu_uca_c_mm` der. Paslanmaz uyumluluk için b kullandı.
- `standart` vs `geometri_std` ikiliği — kod hangisini otorite alıyor netleşmeli.
<!-- docs/KARARLAR.md SONUNA EKLENECEK — Oturum 181 -->

## Oturum 181 — PAOR/AVEVA wizard entegrasyonu (12 Haziran 2026)

**MK-181.1 — PAOR = format adaptörü, ayrı hat DEĞİL.**
PAOR Excel-BOM, Tersan IFS ile aynı kabuk→terfi hattından geçer. PAOR xlsx → `dokuman_tipi='bom_excel'`; kabuk satırları İSTEMCİDE üretilip (`paor.js` partNameParse/kimlikCoz/convert) `dosya_isleme_kuyrugu.parse_sonuc.satirlar`'a yazılır (sunucu PAOR formatını parse edemez — server excel-generic parser PAOR şemasını tanımaz). Böylece yükleme, re-open (`taslagiAc`) ve terfi AYNI yerden (`parse_sonuc.satirlar` → `ARES_KABUK.grupla`) kabuğu kurar. Sidecar (`pipeline_malzemeleri` + kabuk-bypass) TERK EDİLDİ — devre taslakta kalıyordu, spool oluşmuyordu.

**MK-181.2 — İçerik-tanıma, dosya adı değil.**
PAOR wizard drop'unda içerikten tanınır: xlsx başlık token'ları (`DPN` + `Part Name` + `Make/Buy`) + Isometric_View.pdf varlığı. Buton yok; mevcut wizard `dosyalariEkle` sonrası `_paorTara()` ile. xlsx → `tip_kodu='paor_bom'`, PDF'ler → `'diger'`.

**MK-181.3 — 1 çizim = 1 spool (S01); dn → "DN"+sayı metni.**
PAOR Excel pipeline-seviyesi (spool_no kolonu yok) → doğal eşleme her çizim = tek spool (`spool_no='S01'`). Çizim-içi `SPOOL[1][2]` bölünmesi L3/Faz 2'ye ertelendi. `dn` alanı `ARES_OLCU.olcuParse`'a METİN olarak verilir (`"DN125"`) — ham sayı (`125`) DN dalına düşmez, dis_cap=125 yanlış çıkar. Doğrulandı: DN125→141.3, DN50→60.3 (ASME tablosu, ARES_BORU).

**MK-181.4 — PAOR PDF'leri 'diger'/'sakla', L3'e gitmez (MALİYET kararı, teknik tavan DEĞİL).**
181 hattında PAOR iso+vektör PDF'leri `'diger'/'sakla'` → L3 koşmaz (çizim başına ~37sn + para). `devre_dokumanlari`'na saklanır, belge olarak ulaşılır. **ÖNEMLİ DÜZELTME:** Bu, L3'ün PAOR'u okuyamadığı anlamına GELMEZ. Bkz MK-181.6.

**MK-181.5 — PAOR kabuk başlık et=null = Tersan davranışıyla aynı.**
Kabuk spool başlığı çap/et'i anaBoru `dn`'inden `olcuParse` ile türer; DN dalı sch'siz → et=null. Bu Tersan IFS'te de böyle (et ayrı kolon değilse). Gerçek et kalem listesinde (`parse_sonuc.satirlar[].` partNameParse et_mm). Sıfır regresyon.

**MK-181.6 — PAOR L3 hattı MEVCUT, AKTİF ve spool-bölme YAPIYOR (180/181 mimari düzeltmesi).**
`izometri_format_tanimlari`: `paor_aveva_ana` (id `995b5514`, aktif, requires_ai, egitim_kaynagi=vision_only, kullanım 68) fab çizimini (`-A.pdf`) L3/Vision ile okur. Kanıt (`parse_sonuc`, `11D-PAOR-52600-102773-A.pdf`): **3 spool ayrıldı** ([1][2][3]), spool [1] için 11 kalemlik malzeme listesi (et_mm/kalite/kategori/DIN std), cap 60.3, güven 0.82. Yani:
- Spool-bölme L3'te ZATEN var — OCR gereksiz (Vision görüntüyü okur, çıkarılabilir metin şart değil).
- 180'in "PAOR = Excel, L3 değil" kararı MALİYET temelliydi; teknik imkânsızlık değildi.
- **Eşleştirme kopuk:** L3 pipeline'ı parse_sonuc'a yazıyor (`52600-102773`) ama `devre-inceleme.js` + kanonik eşleştirici pipeline'ı DOSYA ADINDAN istiyor (MK-127.3, fallback yok). PAOR dosya adında pipeline yok → spool'lar atanmamış.
- **182 işi:** PAOR pipeline-fallback (Tersan-güvenli) + L3 maliyet-tetik politikası + Excel($0)/L3(spool-bölme) hibridi.

**MK-181.7 — Vendored pdfjs istemci tarafı PAOR parse için.**
`vendor/pdfjs-1.10.100/pdf.js` + worker wizard'a eklendi; `paor.js` ESM `<script type="module">` ile `window.PAOR`'a köprülendi. Isometric_View.pdf'ten pipeline_no istemcide çıkarılır (`_paorPdfMetin` y-koordinat satır rekonstrüksiyonu).

---
**Carry — önceki oturum kararları (boşsa doldurulacak):** MK-180.1–7, MK-169/170/171 (MK-163.1: taze SQL ile doğrula).

**Fantom borç düşümleri:**
- `tur` kolonu bug'ı FANTOM: `plExcelYukle` şemaya uyarlanıyor, `plMalzKaydet` tur'suz çalışıyor. Borç listesinden düşüldü.
- `ares-olcu.js` repo KÖKÜNDE var (handoff-180 "YOK" demişti — yanlıştı).
- handoff-180 "dispatch worker'a bağla" yönü YANLIŞTI — doğru yer wizard kabuk hattı, senkron istemci (bu oturumda kanıtlandı).

---

## Oturum 182 — PAOR/AVEVA L3 spool-bölme: matcher + wizard aktivasyon (12 Haziran 2026)

**MK-182.1 — PAOR L3 spool-bölme AKTİF; MK-180 bir MALİYET kuralıydı, teknik tavan değil.**
`paor_aveva_ana` (id `995b5514`) batch sayfasında fab `-A.pdf`'i L3/Vision ile okuyor ve spool ayırıyor — `izometri_batch_kayitlari`'nda ~3616 tamamlandı, **0 hata**, ~$0.05/çizim. 181 handoff'un "iptal" anlatımı `dosya_isleme_kuyrugu` (devre-eşleştirme silosu) idi, batch silosu DEĞİL — L3 PAOR okuması hep çalışıyordu. Spool-bölme için OCR gereksiz (Vision görüntüyü okur).

**MK-182.2 — Eşleştirme pipeline'ı DOSYA ADINDAN; deklaratif DOSYA_DESENLERI tablosu (DB migration YOK).**
PAOR pipeline dosya adında ZATEN var (`11D-PAOR-52600-102773-A.pdf` → `52600-102773`). 181 handoff'un "pipeline dosya adında yok" teşhisi yanlıştı — yalnız PAOR deseni `dosyaAdiParse`'da eksikti. Çözüm: `kuyruk-isle-izometri.js` + `devre-inceleme.js`'e deklaratif `DOSYA_DESENLERI` tablosu (Tersan satırı bire bir korundu + PAOR satırı). Kural koda gömülü — DB migration gerekmedi.

**MK-182.2-DÜZELTME — Spool kimliği POZİSYON-BAZLI (array index), metin-normalize DEĞİL.**
İlk tasarım `koseli_to_S` deseniyle (`[1]`→`S01`) eşleştiriyordu. Canlı veri (50+ çok-spool kayıt) bunu çürüttü — L3 `spool_no` TEK FORMAT DEĞİL ve GÜVENİLİR KİMLİK DEĞİL:
- 4 varyant: `["[1]","[2]"]` (koseli, 11 kayıt), `["S01","S02"]` (S, 13), `["1","2"]` (çıplak, 2), `["S03_1","S02_1"]` (diğer, 1).
- **9 kayıt ÇAKIŞAN** `spool_no` (`[1]/[1]`×3, `S01/S01`×2, `S02/S02`×1...): L3 iki ayrı spool görmüş ama ikisine de AYNI no vermiş. Metin-normalize bunları tek anahtara indirir → eşleştiricide ikinci spool birinciyi ezer (**B-6 sessiz veri kaybı**).
Karar: `DOSYA_DESENLERI` satırına `sp_kaynak:'pozisyon'`. PAOR'da `spoolHam = 'S'+(index+1)` (idx0→S01, idx1→S02) — L3 `spool_no` YOK SAYILIR. Gerekçe: kimlik Excel kabuğunda (MK-127.3); L3 yalnız "kaçıncı spool" sırasını taşır, numara gürültü. `eslestir` + `devre-inceleme` döngüleri index'li (`else` dalı = Tersan, birebir değişmedi). `spoolNormalize`/`koseli_to_S` jenerik util olarak kaldı (PAOR kullanmıyor). 7/7 varyant (çakışanlar dahil) benzersiz S0n üretti, çakışma bitti.

**MK-182.3 — R1/R2 invariant korundu + açık borç 117 KAPANDI.**
Matcher fix yalnız çıktı-zenginleştirme (MK-164.3). Kimlik hâlâ Excel kabuğu — L3 spool YARATMAZ. Açık borç 117 (`yukleyen_id` null) wizard satır 1089'da `yukleyen_id: userId` ile DÜZELTİLMİŞ (doğrulandı). Borç kapandı.

**MK-182.4 — Spool markası = ARES_NORM.marka yan ürünü (kayıp değildi).**
PAOR spool etiketi `proje-pipeline-spool-RevN` formatı `ares-normalize.js:175`'te otomatik üretilir; ayrı iş gerekmez.

**MK-182.5 — Malzeme yeri KAYIT-BAZLI; tek kural ("hep pipeline-seviyesi") YANLIŞ.**
İlk tasarım "malzeme hep `pipeline_malzemeleri`, spool'a N× yazma" diyordu. Canlı veri çürüttü — L3 malzeme dağılımı kayda göre değişiyor:
- `e79177be`: spool[0]=11 kalem, spool[1]=**0** → malzeme yalnız ilk spool'da (pipeline-paylaşımlı niyet).
- `882f0456`: spool[0]=11, spool[1]=**11** → her spool TAM kendi listesi (per-spool).
- `3ebc8d29`: 6 / 3 (karışık).
Karar (#2b'ye): malzeme yerleşimi **kayıttan türetilmeli** — `spoollar[n].malzeme_listesi` boşsa pipeline-paylaşımlı (`pipeline_malzemeleri`), doluysa per-spool. Tek kural dayatma. D1 (mükerrer toplama önleme) hâlâ geçerli ama uygulama kayıt-duyarlı.

**MK-182.6 — Çok-spool KENAR DURUM; sıfır-spool AYRI kategori.**
`sonuc_spool_sayisi` dağılımı (3616 tamamlanmış): **2862× 1-spool** (çoğunluk → #2a yeter, genişletme gerekmez), **~34× çok-spool** (gerçek #2b kapsamı: 22×2, 4×3, kalanı 4–10), **754× 0-spool** (L3 hiç spool çıkaramadı — boş/okunamaz; #2b genişletme 0'a bölmemeli, S01 boş kabuk kalır). #2b dar kapsamlı + üç durumu (0/1/N) ayrı ele almalı.

**#2a (wizard aktivasyon, commit `3ec8f4e`):**
`_paorTara`: L3 açıkken fab(`imalat`) PDF → `'izometri'` (drenaj+matcher); iso/L3-kapalı → `'sakla'`. `l3Toggle` → `_paorTara()` tazeler. Bu olmadan matcher fix uyuyordu. Anchor-Python patch, MD5 `6fa0a155...`.

**Pozisyon-fix (bu oturum son kod commit'i):**
`eslestir` (kuyruk-isle-izometri.js) + devre-inceleme eşleştirme döngüsü index-bazlı; PAOR `sp_kaynak:'pozisyon'`. MD5 kuyruk `0a65b39b958016f4ad5070b43b1914e5`, devre-inceleme `f125c676c352180927c261ede053937d`. `node --check` temiz, 7/7 varyant testi geçti.

**Açık (183):**
- **Toplu canlı test:** PAOR klasörü + L3 ON → `S01` attach (R1/R2) + marka + `[2]/[3]` fazla (182'de test dosyası yoktu).
- **#2b — gerçek S02/S03:** kabuk genişletme (1→N, `sonuc_spool_sayisi`) + malzeme yerleşimi KAYIT-BAZLI (MK-182.5) + terfi ayrışması. 0/1/N üç durum (MK-182.6). `aktar` zaten N spool yaratıyor; PAOR adaptörü şu an 1 üretiyor.
- **cap/et zenginleştirme:** `devre-inceleme.js` ~287-298 `dal` lookup (find-by-spool_no) HENÜZ pozisyon-duyarlı DEĞİL → #2b'de kabuk N'e çıkınca index-eşlemeli yap (S0(i+1) ← L3 spool[i]). Pre-#2b regresyon değil.
- **D-182.2:** imalat/montaj malzeme ayrımı (civata/conta=montaj).
- **181-3 artığı:** test taslakları + 247 satır sidecar `pipeline_malzemeleri` temizliği (önce `SELECT COUNT`, MK-153.2).
