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

**Geçerlilik:** ✅ Aktif. Indexleme gecikmesi ~1-2 dakika — push'tan hemen sonra yeni oturum açılırsa son commit'ler eski snapshot'tan görünebilir.

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
