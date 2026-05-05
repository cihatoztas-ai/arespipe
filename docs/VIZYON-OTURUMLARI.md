# AresPipe — Vizyon Oturumları

> **Bu dosya kategori belgesidir.** Vizyon, mimari yön, uzun vadeli stratejik tartışmalar her geçtiğinde **yeni bir oturum başlığı** olarak buraya eklenir. Tek seferlik sohbet özetleri ölü doğar (60 oturumda 60 belge sorunu); aynı kategoriyi tek dosyada toplamak hem aranabilir hem güncellenebilir kılar.
>
> **Sahip:** Cihat + Claude (her ikisi de yazma yetkili)
> **Tazelik penceresi:** Yok — bu bir kayıt dosyası, "güncel" tutulması gereken bir şey değil. Eski oturumlar olduğu gibi durur, yenileri eklenir.
> **İlişkili belgeler:** `SPOOL-AI-VIZYON.md`, `docs/VIZYON-VE-MODULER-MIMARI.md`, `docs/AI-VE-3D-VIZYON-v3.md`, `docs/KUTUPHANE-KAPSAM.md`, `docs/KUTUPHANE-YUKLEME-TAKIP.md`

---

## 61. Oturum — Vizyon Konsolidasyonu (5 Mayıs 2026)

> **Bu oturum bir kod oturumu değildi.** 61'in açılış gündemi MGiris.jsx i18n idi; Cihat *"araya başka bir konu al"* dedi, eline 4 vizyon belgesi geldi (3'ü repo'da, 1'i yeni — `AI-VE-3D-VIZYON-v3.md`), birlikte okuyup karşılaştırma yapıldı. Sohbet uzun sürdü ama **karar oturumuydu**: 4 yeni MK karar adayı çıktı, sistemin gerçek anatomisi yazılı hâle geldi, gelecekte master vizyon konsolidasyonu için yol bağlandı.

### Bağlam — 4 vizyon belgesinin durumu

Sohbete girilirken 4 belge yan yana konuldu:

| Belge | Tarih | Statü öncesi | Statü sonrası |
|---|---|---|---|
| `SPOOL-AI-VIZYON.md` v2.1 | 26 Nis 2026 (28. oturum civarı) | Repo kökünde, BRIEFING bilgi haritasında ✓ | Aynı yerde, çelişkili olduğu yerler `AI-VE-3D-VIZYON-v3.md`'de revize edildi |
| `docs/VIZYON-VE-MODULER-MIMARI.md` | 40. oturum | Repo'da var, **bilgi haritasında yok** (yetim) | Bilgi haritasına eklendi |
| `docs/KUTUPHANE-KAPSAM.md` | 40. oturum | Repo'da var, bilgi haritasında yok | Bilgi haritasına eklendi |
| `docs/KUTUPHANE-YUKLEME-TAKIP.md` | 43. oturum | Repo'da var, bilgi haritasında yok | Bilgi haritasına eklendi |
| `docs/AI-VE-3D-VIZYON-v3.md` | 4-5 May 2026 (60 sonrası kahve sohbeti) | Cihat'ın elindeki belge, **repo'da yoktu** | 61'de repo'ya alındı, bilgi haritasına eklendi |

**Operasyonel ders:** Bilgi haritası eksiği = belge yokmuş gibi davranma riski. Sohbet başında üç belgeyi *"yetim"* sandım (BRIEFING haritasında olmadığı için), repo cloning + grep ile gerçeği gördüm. Bu deneyim **MK-61.4'ün doğum kanıtı** oldu (yeni belge yaratırken bilgi haritası satırı zorunlu).

### 4 belgenin DNA ortaklıkları

Üçü de aynı çekirdek prensiplerden besleniyor, çelişmiyorlar burada:

- **Spool = ML-uyumlu yapılandırılmış kayıt.** Yapısız bilgi kabul edilmez, eksik bilgi kabul edilir.
- **AI ikinci göz**, karar verici değil. Sertifikasyon dış otorite.
- **Tetik koşulu olmadan iş yok** — *"lazım olabilir"* yetmez.
- **Modülerlik birinci sınıf.** Yeni özellik ana akışı şişirmesin.
- **Veri silinmez, sıkıştırılır/arşivlenir** — bugün ucuza biriktirilen veri 2-3 yıl sonra anlam kazanır.
- **RAG yolu (eğitim değil, akıllı arama)** — fine-tune yapılmaz, pgvector + Claude API.
- **Optionality** — hiçbir kapı kapanmasın, gelecekteki olasılıklar açık kalsın.

### v3'ün eskileri revize ettiği üç nokta

**1. Ürünün karakteri.** v2 SPOOL-AI-VIZYON ve VIZYON-VE-MODULER *"pilot tersane"*, *"satış konuşması"*, *"Tier 0-3 müşteri"* dilinde yazılmıştı. v3 net olarak: *"AresPipe SaaS değil, internal tool. Müşteri kazanma zorunluluğu yok. Premium tier varsayımları çıkarıldı."* Mimari (multi-tenant, RLS) duruyor — *"satılırsa hazır olsun"* optionality bedeli düşük. Ama strateji konuşurken SaaS dilinden çıkmak gerekiyor.

**2. Hacim varsayımı.** v2 *"1.000-3.000 spool kaydı sonrası Ufuk 1"* derken, v3 *"Aylık 1000 spool tek firma için zaten normal. Bunun altı rantabl değil."* dedi → tek müşteri yıllık 60.000+ foto. ML eşiklerine olgunlaşma süresi *"12-24 ay"*tan *"veri biriktiğinde 6-12 ay"*a indi.

**3. Foto akışı tasarımı.** SPOOL-AI-VIZYON madde 12 soft hâli vardı, v3 madde 17 çok daha somutlaştı: QR oku → iş başlat → QR oku → iş bitir → **otomatik foto ekranı** → kaydet tuşu foto olmadan çıkmaz. `fotograflar` tablosuna `imalat_asamasi`, `cekim_sirasi`, `qr_referansi` yeni kolonları + yeni `spool_aksiyonlari` tablosu.

### Sistemin gerçek anatomisi — Cihat'ın anlattığı

Cihat sohbette uzun bir metinle sistemi anlattı (vizyon dilinde değil, *"ne oluyor ve bana nasıl hizmet etsin"* dilinde). Buradan çıkan **iskelet**:

**Spool = agregat root.** Devre = paket. Spool = kayıt. Havuzlar = aynı işin toplandığı kuyruklar. Log = anlatı. Spool detay sayfası bir agregat — diğer sayfaların her biri (kesim, markalama, büküm, KK, sevk, test, foto, log) o agregata enjekte ediyor. Bu mimari sezgi belgelerde yok ama Cihat'ın kafasında oturmuş. DDD literatüründe "aggregate root" diye geçer.

**Havuz batching pattern.** Kesim, markalama, büküm — üçü de aynı kalıp: spool detayında girilen veri → tip+spec'e göre filtrelenmiş havuz → batching/optimizasyon → makine → "yapıldı" sinyali → spool detayına geri yansıma. **Aynı kalıbın üç tekrarı.** Vizyon belgelerinin hiçbirinde yok — Cihat tek başına geliştirdiği bir pattern, farkına varmamış. Dördüncü havuz geldiğinde hazır şablon olur.

**Bağlı raporlar zinciri.** Spool detayda KK tarihi → KK rapor → sevk irsaliyesi → parti. Bu **iz sürme** zinciri F katmanı (müşteri portalı) altyapısının temeli. Cihat farkında değildi — sayfaları yaparken zaten F katmanı için fişi takmış oldu.

**Tezgahlar canlı görünürlük.** Anlık operasyonel görünürlük. Vizyon belgelerinde yok. Cihat'ın *"sıkışma analizi yorumu"* (madde 33) gelecekte aynı veriden üretilecek — şimdiden zemin sermiş.

**Uyarılar sayfası kural-tabanlı.** "Eksiği olan, revizyon gelecek, durdurulmuş" spoollar — manuel durdurma + QR okutmada uyarı. Gelecekteki AI uyarıları aynı sayfaya akacak.

**Yetki blokları (RBAC).** Süper admin (sistem) / admin (firma) / personel (mobile-only). Web erişimine kapatılan personel zaten sadece mobile'a girer. QR okutma sadece mobile'da.

**Devre arşivi = görünürlük filtresi.** "Soft archive" değil, durum filtresi. Devre = aktif/biten. Gemi = aktif devre var/yok. Devre yeniden geldiğinde otomatik aktif olur. UI etiketlerle gizler/gösterir, veri yerinde durur.

### Cihat'ın 15+ cevabıyla berraklaşan mimari kararlar

Sohbet boyunca Cihat'tan toplam 15 ana soru + 5 takip sorusu cevaplandı. Önemli olanlar:

| Konu | Karar |
|---|---|
| Foto arşiv stratejisi | Sıkıştırılmış cloud + orijinal **yerel disk** (3-2-1 yedek). AI çağrıları sıkıştırılmış sürümü kullanır. v3'ün "3 versiyon paralel" stratejisinin hibrit hâli — bulut soğuk depo maliyeti ortadan kalkar. → **MK-61.1** |
| Foto aşama bilgisi | QR okutma anındaki spool aşamasından alınır, kişiden değil. Personel farklı aşamalarda çalışıyor olabilir; kişi → aşama eşlemesi sağlam değil. v3 madde 17 ile uyumlu. → **MK-61.2** |
| Foto metadata gerçeği | Spool detayda **kütüphane bağlamı kuruldu**: `spool_malzemeleri.malzeme_ref_id` + `tg_spool_malzemeleri_ref_sync` trigger. Tıklayınca tablo verisi popup oluyor. Yani Parça Kimliği canlı, sadece kütüphane organik dolmaya devam ediyor. |
| Yönetici gözlem fotosu | Aşama YOK. Yönetici sahada gezerken bir şey görürse → foto + not + opsiyonel "uyarı" kutucuğu. İşaretlenirse uyarılar sayfasına düşer. Bu **fotograf_tipi** ayrımı yaratır (aşama-fotosu vs gözlem-fotosu). |
| Kütüphane %30 yorumu | "Her parça %30 hazır" değil — **p0 listesinin %30'u**. P0 = en yoğun kullanılan (A105 WN, CuNi B466, B16.9 LR dirsek). KUTUPHANE-YUKLEME-TAKIP'in 28 Nis 2026 kayıtlı %0.6 trajektorisi muhtemelen tutmadı. |
| Etiketleme dörtlü bağ | foto + izometri PDF + 2D çizim + STP/Rhino → hepsi **`parca_id` üzerinden ortak omurgaya** bağlanır. Kullanıcı dörtünü aynı anda açmaz; bir kez `parca_id`'ye bağlandı mı, sistem geri kalan üç görüntüyü kendi üretir. |
| Devre wizard'ı | Asenkron arka plan. İzometri batch çalışıyor (tersan PDF). Diğer formatlar görsel **template editor** ile tanıtılacak (Canva-vari) — prompt yazımı yok. Pilot tek format. |
| Geri bildirim ayrıştırması | İmalat sapma → kendi sayfası. Program/UI hata → süper admin. Karışmaz. |
| Devre arşivi | Soft archive değil, görünürlük filtresi. → **MK-61.3** |
| Test çift yönlü | Spool ↔ Test raporu çift yönlü ilişki. |
| Tezgahlar canlı | QR ile sayaç başlar/biter. Kırmızı boşluk sayacı yeni işe başlayana kadar. Sebep girişi opsiyonel (gelecekte). |
| Lazer tarama tetiği | Vizyon belgeleri "18-36 ay" dedi (AI'lı görsel hata tespiti için). Cihat'ın söylediği klasik CV (lazer → STEP karşılaştırma, ICP algoritması, Open3D). Bu **3D verisi olgunlaştığı anda** başlanabilir, AI değil. |
| Hatalı imalat arşivi | Şu an Notion + bilgisayar. Etiketleme sayfası canlandığında zip import edilebilir. |
| MGiris.jsx tutum | "Sen bana bakma bazen heyecan yapıyorum, doğru sıradan ilerleyelim." → MGiris.jsx 62'nin birincil işi. |

### 8 MK karar adayı (4'ü 61'de, 4'ü 62'ye)

**61'de yazıldı (kritik — yapılmazsa default davranış belirsiz, geri dönüşsüz hata riski):**
- MK-61.1 — Foto arşiv stratejisi (sıkıştırılmış cloud + orijinal yerel disk)
- MK-61.2 — Foto aşama bilgisi QR okutma anındaki spool aşamasından alınır
- MK-61.3 — Devre arşivlenmesi görünürlük filtresi (soft archive değil)
- MK-61.4 — Yeni belge yaratma kuralı (bilgi haritası satırı + sahip + tazelik penceresi zorunlu)

**62'ye kaldı (önemli ama acelesi yok):**
- Spool agregat root pattern (yeni özellik kararlarında "bu spool agregatına mı enjekte olur?" sorusu zorunlu)
- Havuz batching pattern (yeni batching ihtiyacında bu desen referans)
- Format tanıtımı görsel template editor (prompt yazımı değil, görsel işaretleme)
- Etiketleme dörtlü bağ `parca_id`'den (foto/izometri/2D/STP ortak omurga)
- Yönetici gözlem fotosu (aşama yok, opsiyonel uyarı kutucuğu)

### "Ne kaçırıyorum" sorusunun cevabı

Cihat sohbet sonunda *"yazılımcılar Claude'la ne yapıyor, hangi teknikleri kullanıyor, ben ne kaçırıyorum?"* diye sordu. Claude'un cevabı: **kritik bir şey kaçırmıyor**.

Geliştiricilerin tipik kalıpları (plan-then-execute, spec-first, context engineering, sub-agent pattern, repo-aware araçlar) — Cihat sezgisel olarak çoğunu zaten yapıyor: BRIEFING + bilgi haritası + tazelik kapısı = context engineering'in gelişmiş hâli, MK kararları = spec-first'ün hafif versiyonu, kapanış protokolü = plan-execute ayrımı.

Test edilmeye değer **tek şey** Claude Code (terminal CLI) — küçük mekanik işler için (CSS rename, ufak refactor) hızlandırabilir. Mimari konuşmalar burada kalmalı, IDE bunu bozar.

Önemli düzeltme: Claude'un *"ortalama yazılım projelerinin üstünde"* gibi kıyas dilini bırakması gerekiyor. Cihat'ı kendi standardıyla değerlendir, başkalarını anma. → CIHAT-PROFIL'e eklenecek farkındalık.

### Yeni proje transferi — Cihat'ın "buradan kayıp olmasın" kaygısına cevap

AresPipe bittikten sonra başka bir alanda yeni proje yapılırsa:

**Transfer edilenler (3 paket):**
1. **Kişi paketi** — CIHAT-PROFIL.md + CLAUDE-CALISMA-MODU.md (sana özel, AresPipe'a değil)
2. **Sistem paketi** — BRIEFING formatı + oturum-saglik.sh + KARARLAR formatı + tazelik kapısı + bilgi haritası yapısı (template'lenmiş, AresPipe içeriğinden temizlenmiş)
3. **Genel mühendislik dersleri paketi** — MK kararlarının genel olanları + sapma dersleri (heredoc, zsh history, CI race, Vite zombie portları — domain-bağımsız)

**Transfer edilmeyenler:** Domain bilgisi (ASME, izometri parser, CuNi spec'leri), uygulamaya özel kod (component'ler, RLS politikaları).

**Önemli sınır:** Claude hatırlamaz. CIHAT-PROFIL.md'yi vermeden Claude seni tanımaz. Hafıza dosyalardır, bende değil. Bu sınırın farkında olmak iyimserliği törpüler.

**Pratik zaman:** Bu üç paketi ayıklamak için 1-2 oturum lazım, **AresPipe biraz daha olgunlaşınca** (70-80 oturum civarı). Erken yaparsan ayıklayacak şey az olur, geç yaparsan AresPipe'a özel ile genel olanı ayırmak zor olur.

### Master vizyon konsolidasyonu — gelecek planı

4 vizyon belgesi (SPOOL-AI-VIZYON, VIZYON-VE-MODULER, AI-VE-3D-VIZYON-v3, KUTUPHANE-KAPSAM) aynı sorunun farklı zamanlarda yazılmış üç cevabı + 1 destekleyici referans. Bir gün **`docs/VIZYON.md`** diye tek bir master belgeye indirilebilir. Şimdi yapma — v3 hâlâ taze, sindirilmesi lazım. **65-70 oturum civarı konsolidasyon zamanı.** Bilgi haritası şimdilik dördünü doğru ayırır, çelişen yerler `AI-VE-3D-VIZYON-v3.md`'nin başında not edildi.

### Bu oturumun kaydedilmiş çıktıları

- `docs/AI-VE-3D-VIZYON-v3.md` repo'ya eklendi
- `BRIEFING.md` bilgi haritasına 4 belge satırı eklendi
- `docs/KARARLAR.md`'ye MK-61.1, MK-61.2, MK-61.3, MK-61.4 eklendi
- `docs/CIHAT-PROFIL.md`'ye 2 farkındalık satırı eklendi (heyecan sarkacı + kıyas yorumlamama) — *zaman kalırsa*
- `docs/VIZYON-OTURUMLARI.md` bu dosya doğdu (kategori belgesi)

### Kapanış disiplin notu

Bu oturum bir kod oturumu olmadığı için BRIEFING "Yapılanlar" listesi alışılmış formatından farklı: yapılan iş **konsolidasyon ve karar** kategorisinde. MK-56.4 kapanış orkestra protokolü 60'ta canlandı, bu oturumda da Katman 1 sağlık scripti çalıştırıldı, kayıt tutuldu. Cihat onayı (MK-56.1) push öncesi alındı.

---

> **Sonraki vizyon oturumu** ne zaman geçerse, bu dosyaya **yeni başlık** olarak eklenir. 61. oturum referans olarak korunur.
---

## 62. Oturum — 5 Aday Değerlendirmesi + Disiplin Birikimi (5 Mayıs 2026)

> **Bu oturum karma idi.** 61'den taşınan 5 MK aday tartışıldı, 3'ü karara bağlandı (MK-62.1, 62.2, 62.3), 2'si master vizyon konsolidasyonuna bekliyor. Asıl iş MGiris i18n bağlanmasıydı; o sırada 4 disiplin notu birikti.

### 5 adayın akıbeti

61'in VIZYON-OTURUMLARI'nda listelenen 5 MK aday için 62 kararı:

| Aday | 62 kararı |
|---|---|
| Spool agregat root pattern | ✅ MK-62.1 olarak yazıldı (havuz batching ile birleştirildi) |
| Havuz batching pattern | ✅ MK-62.1 ile aynı paket |
| Format tanıtımı görsel template editor | ⏳ Master konsolidasyona (65-70) — tetik koşulu yok |
| Etiketleme dörtlü bağ parça-id'den | ⏳ Master konsolidasyona — etiketleme sayfası canlandığında değer kazanır |
| Yönetici gözlem fotosu | ✅ MK-62.2 olarak yazıldı (foto tipi ayrımı: aşama vs gözlem) |

61'de 8 aday vardı (4'ü 61'de yazılı, 4'ü 62'ye); 62 aslında 5 inceledi (61 listesinde "5'e kaldı" diyordu, doğrusu o). Toplam 8 adaydan 7'si karara bağlı (4 MK-61.x + 3 MK-62.x), 2'si master konsolidasyona bekliyor.

### 62'de yeni doğan kavramlar

- **Lang tek-otorite mimarisi (MK-62.3).** Repo köküne çıktığımız bir yapı; 62 öncesi mobile/src/lang dizini sanılıyordu, 62'de tuzak yaşandı, doğru kanal yazılı hâle geldi.
- **Foto tipi ayrımı (MK-62.2).** MK-61.2'nin tamamlayıcısı; yönetici gözlem fotosu kavramı schema seviyesinde işlendi.
- **Mimari pattern adlandırması (MK-62.1).** Cihat'ın sezgisel olarak kurduğu iki pattern (spool agregat root, havuz batching) belgelerde ilk defa adlandırıldı.

### Birikmiş disiplin (CLAUDE-CALISMA-MODU'ya geçti)

62 boyunca paste-converter, hook API tahmini, lang dizini, terminal görsel artefaktı konularında 4 yeni disiplin notu yazıldı. Bunlar canlı talimatlar dosyasına alındı, oradan referans olarak okunur. VIZYON-OTURUMLARI'nda kayıt değil sadece işaret.

### Bekleyen soru

**Local component state ile context state çakışırsa hangisi kazanır?** MGiris i18n bağlanırken karşılaşıldı (kendi `dil` state'i vardı, `<I18nProvider>` da `dil` tutuyordu, çakıştı). 62'de tek vakaya dayalı kural yazılmadı — tetik: 63+'ta ikinci ekranda da aynı çakışma görülürse MK olarak yazılır.


