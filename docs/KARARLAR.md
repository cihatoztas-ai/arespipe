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
