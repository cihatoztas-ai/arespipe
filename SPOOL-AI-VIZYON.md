# Spool AI — Vizyon & Yol Haritası

> **AresPipe · Vizyon Belgesi · Nisan 2026 (v2.1)**
>
> Her spool, makine öğrenmesine uygun yapılandırılmış bir veri kaydıdır. Eksik bilgi kabul edilir, yapısız bilgi kabul edilmez.
>
> Bu belge konuşmalardan derlenmiştir — yaşayan bir belge, düzenli güncellenir.

---

## 📚 Belge Hakkında

- **Tür:** Ürün vizyonu + uzun vadeli strateji
- **Hedef kitle:** Cihat Öztaş, Claude, gelecek ekip
- **İlişkili belgeler:**
  - `docs/ROADMAP.md` — yakın vade plan
  - `docs/PANO-TASARIM.md` — Süper Admin Yönetim Panosu
  - `docs/CIHAT-PROFIL.md` — Claude'un Cihat'ı tanıması için kişisel not
  - `CLAUDE.md` — geliştirme kuralları
- **Önceki sürüm:** v1 (Nisan 2026) — 7 katmanlı yapı, kütüphane merkezli, fine-tune odaklı. Bu sürüm v1'in temel değerlerini koruyarak vizyonu **operasyonel veri merkezli** olarak yeniden tanımlar.
- **Güncelleme politikası:** Bir oturumda karara bağlanan her yeni fikir/karar/prototip burada yaşar. Claude bu dosyayı her oturum gündeminde "değişiklik var mı?" diye sorgular.

---

## 01 — Temel İlke

**Her spool, makine öğrenmesine uygun yapılandırılmış bir veri kaydıdır.**

Eksik bilgi olabilir — sorun değil. Kayıp parça olabilir — sorun değil. Ama **var olan her bilgi**, ML pipeline'ına doğrudan girebilecek formatta saklanmalıdır.

Spool detay sayfası bu kaydın merkezidir. AresPipe'ın tüm operasyonel ve AI özellikleri bu temelin üstüne kurulur.

---

## 02 — Vizyonun Felsefesi

Vizyon belgesinin tüm özellikleri aşağıdaki felsefe maddelerinin gözünden okunur:

### Hedef ve Sınırlar

- **Hedef metrik:** 1000 spoolda sahaya 15 hatalı yerine 1-2 hatalı (sıfır değil).
- **İnsan faktörü çıkmıyor.** AI ikinci göz olur, karar verici değil.
- **Yeni AI modeli hedefimiz yok.** Hazır teknolojiyi (Claude API, Vision, hazır modeller) kullanırız.
- **Sertifikasyon dış otoritededir** (Class, NDT lab, röntgen). AresPipe ön filtre olur, sertifikasyon yerine geçmez.
- **Şeffaflık iddiası — Class onayı vermez, takip imkânı verir.**

### Veri ve Mimari

- **Veri toplama bugün için değil, gelecek için.** Bugün ucuza biriktirdiğimiz veri, 2-3 yıl sonra olgunlaşan teknolojiyle anlam kazanır.
- **Veri sahipliği AresPipe'a değil, kullanıcıya aittir.**
- **Veri toplama hiyerarşisi:** Otomatik > yapılandırılmış arayüz > etiketleme. AresPipe mümkün olduğunca otomatik akıştan, yapamadığında 3D montaj gibi yapılandırılmış arayüzlerden, son çare olarak etiketleme yoluyla veri toplar.
- **Otomatik veri akışı zorunlu.** Doğal iş akışı içinde üretilen her veri yapılandırılmış formatta ML pipeline'ına yönlendirilir. Manuel etiketleme yalnızca insan zekâsı zorunlu olan istisnalarda kullanılır.
- **Etiketleme zaman içinde azalan eğri olmalı.** Yıl 1'de spool başına 10 etiket, yıl 2'de 3-5, yıl 3'te 0-2. Bu eğri sağlanmıyorsa sistem yanlış kuruldu demektir.
- **Halka açık veri AresPipe ana sisteminden ayrı kalır.** Müşteri verisi hiçbir zaman halka açılmaz.

### Geliştirme Disiplini

- **AresPipe ek iş çıkarmaz, mevcut işi azaltır veya verimli kullanır.** Hiçbir özellik kullanıcıya "bunu da yap" demez. Tasarım kriteri: bu özellik kullanıcıya yeni iş ekliyor mu, yoksa varolanı kolaylaştırıyor mu? Cevap "yeni iş" ise tasarım gözden geçirilir.
- **Zaman baskısı yok, taahhüt yok, mecburiyet yok.** Vizyon kendi imkânlarımızla, doğal hızda ilerler. Hedefler takvime değil, ölçeğe bağlıdır.
- **Test laboratuvarı → kullanıma açma akışı.** Hiçbir özellik direkt sahaya inmez. Önce süper admin sayfasında test edilir, gerçekten faydalı olduğu kanıtlanırsa programa açılır.
- **API maliyet gerçek.** Sayı tutmadan büyük plan kurulmaz; her özelliğin önce küçük maliyet testi yapılır.
- **AI minimum bağımlılık prensibi.** Sistem mümkün olduğunca AI çağrısı olmadan çalışır. Tekrarlanan görevler bir kez AI ile çözülür, sonra kural motorlarına aktarılır.
- **Tek kullanıcı varsayımı**, çoklu kullanıcı opsiyonu açık.
- **Sektörel sezgi: "Erken yakalanan her hata = kâr."** Kaynak öncesi yakalanan hata, kaynak sonrasından ucuz; kaynak sonrası yakalanan, sahadakinden ucuz.
- **AI'ın katma değeri:** Genel AI "boru" der, AresPipe AI "DN100 A106 SCH40 seamless boru, ASME B36.10" der. Domain-specific yetenek vizyonun çekirdeği.

---

## 03 — Sistem Katmanları

Vizyon altı katmandan oluşur. Katmanlar birbirine sırayla bağlı değil — her biri kendi ritminde olgunlaşır:

| Katman | İçerik | Felsefe |
|---|---|---|
| **A** — Sade Yazılım | İstatistik, kural motoru, lookup tabloları, hesaplama | AI değil, hemen yazılır |
| **B** — Hazır AI | Claude API, Vision, dil modeli çağrıları | Eğitim yok, çağrı var |
| **C** — RAG | Firma bilgisini AI'a çağrı sırasında bağlama | Eğitim değil, bilgilendirme |
| **D** — Veri Akışı | Operasyonel pipeline, mobil etiketleme, 3D oyun, arşiv | Hepsini besleyen damar |
| **E** — Uzun Vade Hedefler | Görsel parça tanıma, hata tespiti, fotogrametri | Veri olgunlaşınca, taahhüt değil |
| **F** — Belgeleme | Müşteri portalı, kayıt dosyaları | Şeffaflık, satış argümanı |

A ile B paralel koşar, ikisi de bugün başlar. C 1-3 ay sonra. D arka planda sürekli birikir. E zaman içinde D'den beslenir. F erken kazanım sağlar.

---

## 04 — Yapılacaklar Listesi (33 Madde)

### A Katmanı — Sade Yazılım (AI yok)

**1. 3D tarama paketi** — Tarama dosyasını sisteme alma, STEP/Rhino tasarımıyla karşılaştırma, sapma haritası ve müşteriye sunulacak otomatik PDF rapor üretimi. Cihaz olarak ekonomik mobil tarayıcılar (Revopoint, Creality gibi) düşünülüyor — mm altı hassasiyet gerekmez. iPad LiDAR sahada yetersiz kaldı.

**2. Dia-inch ve kaynakçı performans** — PFI Technical Bulletin TB-10 standart formülüyle FDI hesaplama: NPS × kaynak sayısı × duvar faktörü × malzeme faktörü × kaynak tipi faktörü. Kaynak sayısı manuel girilir, izometri parser ile karşılaştırılır, uyumsuzluk uyarısı verilir. İleride fotoğraftan otomatik sayma eklenir. Kaynakçı bazlı haftalık/aylık DI raporu.

**3. ASME standart ölçüler modülü** — Schedule/SCH → mm dönüşümü (ASME B36.10M karbon, B36.19M paslanmaz). Boru ve fitting ağırlık hesabı (B16.9 fittings, B16.5 flanşlar, B16.11 coupling, MSS-SP-97 oletler). ~2300 satırlık lookup tablosu. `ARES_BORU.etKalinligi(dn, sch, malzeme)` ve `ARES_AGIRLIK.hesapla(parca)` helper'ları. B1, A6 ve birçok özelliği besleyen altyapı.

### B Katmanı — Hazır AI

**4. İzometri batch parser** — Üç katmanlı parser mimarisi: (1) PDF'ten metin çıkarma, (2) format başına kural motoru, (3) Vision API fallback. Format başına şablon `izometri_format_tanimlari` tablosunda saklanır. Tanıdık formatlar **sıfır API maliyetiyle** çalışır, sadece istisnalar Vision'a gider. Vision çıktıları + manuel onay yeni format kuralı için veri olur — **öğrenme döngüsü.** Hedef: ilk 6 ay %80 Vision, sonraki yıl %5-10 Vision. Sağlık kontrolü içeride: "DN100 boruya DN80 flanş bağlanmış" gibi imkânsız durumlar uyarı verir.

**5. İzometri sohbet** — Yüklenen izometriye doğal dilde soru sorma: "bu izometriyi anlat", "ortalama imalat süresi", "risk noktaları neler". Demo değeri yüksek, satış argümanı.

**6. Doğal dil sorgu (text-to-SQL)** — "Geçen yıl Sedef için DN200 kaç para idi" gibi soruları sisteme sorma. Sen her gün kullanırsın, eski projeler kaybolmaz. Süper admin için altın değerinde.

**7. Fotoğraf-izometri uyum kontrolü** — Bitmiş spoolun fotoğrafıyla izometri karşılaştırılır: "İzometride 6 parça var, fotoğrafta 5 görüyorum, bir parça eksik olabilir." %50 doğruluk bile kâr getirir çünkü kaynak öncesi yakalanan her hata büyük tasarruf. Manuel doğrulama zorunlu, sertifikasyon yerine geçmez.

### C Katmanı — RAG (Firma Bilgisi AI'a Bağlama)

**8. Firma standartları kütüphanesi** — AresPipe iç standartları, kabul kriterleri, WPS değerleri. AI çağrısında bağlam olarak kullanılır. Eğitim değil, bilgilendirme.

**9. İzometri sembol referansı** — Akademik yayınlar, eğitim dokümanları, sektör sembolleri (ISO 6520, AWS A2.4). AI'ın izometriyi doğru yorumlaması için referans katman. Doküman olarak yüklenmez, **özetlenmiş yapılandırılmış referans** olarak hazırlanır.

**10. Parça kütüphanesi referansı** — Mevcut malzeme tanımları + ASME standart ölçüler (modül 3'ten beslenir). AI sorgularında doğru jargon kullanması için.

### D Katmanı — Veri Akışı (Hepsini Besleyen Damar)

**11. Operasyonel pipeline** — Spool yaşam döngüsü tüm olaylarının ML-uyumlu kayıt akışı. Her olay (kim, ne, ne zaman, hangi malzeme, hangi düzeltme) `islem_log` üzerinden besleniyor, `egitim_verisi_pipeline` tablosuna yapılandırılmış halde dönüştürülüyor. **Vizyonun en güçlü veri kaynağı.** Etiketli (her aşamada kim ne yapmış belli), doğrulanmış (sonunda gerçekten teslim edilmiş), zenginleştirilmiş (süre, gecikme, hata, düzeltme dahil), sıfır maliyetli (zaten oluşuyor).

**12. Mobil saha etiketleme** — Mevcut iş akışına gömülü, ek yük getirmeyen veri toplama. Personel zaten QR okutup işi başlatıyor, QR okutup bitiriyor, otomatik açılan ekranda fotoğrafı çekip sıradaki işlemi seçiyor — toplam yarım dakika. Aşama bilgisi otomatik (sistem hangi basamakta olduğunu zaten bilir), seçim diye bir yük yok. Saha çalışanına yeni iş eklenmez, doğal akış zenginleştirilir.

**13. 3D montaj aracı (kademeli olgunlaşma)** — Spool detay sayfasındaki mevcut 3D sekmesi. **Her spool için zorunlu değil.** Kullanıcı seçer: karmaşık spool, eğitim spoolu, AI eğitim örneklemi olarak değerli görünen spoollar için boş zamanda yapılır. Rutin spool için kesim/büküm/markalama satırları yeterli.

- Aşama 1 (bugün): Manuel kurulum, kullanıcı parçaları sürükle-bırak ile birleştirir
- Aşama 2 (B1 hazır olunca): İzometri parser çıktısı 3D sekmesine otomatik yüklenir, kullanıcı düzeltme yapar
- Aşama 3 (parser olgunlaştıkça): Manuel müdahale azalır, sistem doğru kurar

Çıktı her aşamada aynı: ML-uyumlu yapılandırılmış spool kaydı. Aynı zamanda firma içi eğitim aracı (tel bükmek yerine ustaya görsel anlatım) ve veri girişi alternatifi olarak kullanılır.

**14. Halka açık eğitim oyunu** — Sınırlı kapsam: 30-40 onaylanmış anonim izometri. Kullanıcılar bunları çözer, doğru yapınca puan kazanır. Yeni öğrenenler için eğitim aracı, AresPipe markası tanıtımı. **Halka açık yükleme yok** (risk yok). İleride kapsam genişlerse o zaman düşünülür.

**15. Arşiv etiketleme** — Eski projelerden gelen mevcut imalat fotoğrafları, hatalı imalat örnekleri. Süper admin sayfasında etiketleme arayüzü, sahaya açılmaz.

**16. QR ölçek altyapısı** — Boruya yapışık QR'ın fiziksel boyutu sistemde tanımlı (`ayarlar.html`'de tenant bazlı), fotogrametri için kalibrasyon temeli. E1 ve E4'ün olmazsa olmaz altyapısı.

**17. Hatalı imalat örnekleri toplama** — "Bu cunife yanlış kullanılmış", "bu flanş ezilmiş", "bu kaynak çatlak çıktı". Her hata fotoğrafı + kategori + çözüm. **Süresiz saklanan altın veri.** Etiketleme süper admin'de yapılır, sahaya açılmaz.

### E Katmanı — Uzun Vade (Veri Olgunlaşınca)

Bu katmandaki maddeler **taahhüt değil**, hedef. D katmanı yeterince beslendikten sonra kademeli olarak değerlendirilir.

**18. Kaynak öncesi hazırlık kontrolü** — Pah açısı, kök açıklığı, hizalama görsel kontrolü. QR ölçek + Vision API + 200+ etiketli örnek. Hedef: standart dışı durumlarda "manuel doğrulama önerilir" uyarısı. Sertifikasyon yerine geçmez. **Beklenen ufuk:** 6-12 ay test, 12-18 ay olgunlaşma.

**19. Görsel parça tanıma** — DN100 A106 SCH40 jargonuyla parça tanıyan domain-specific model. 500-1000+ etiketli görsel + fine-tune ya da o zamanki en uygun yöntem. **Beklenen ufuk:** 12-24 ay. Yöntem seçimi ertelenir (bulut fine-tune, geçici GPU kiralama, yeni nesil hazır model).

**20. İzometri-fotoğraf hata tespiti** — Madde 7'nin olgunlaşmış hâli. Operasyonel pipeline binlerce eşleşmiş kayıt biriktirince AI doğruluğu sıçrar. **Beklenen ufuk:** 12-18 ay.

**21. QR fotogrametri ile boyut kontrolü** — Fotoğraftan ölçü çıkarma. Kalibre QR sayesinde "3m boru 2m kesilmiş" tespiti. Tek fotoğraftan ±%5 hassasiyet, iki fotoğraftan ±%2. **Beklenen ufuk:** 6-12 ay (tek fotoğraf), 18 ay (çift).

**22. Geçmiş veriden risk tahmini** — A katmanı istatistikleri + B katmanı doğal dil yorumu birleşimi. Yeni spool girince "bu tip spoolda geçmişte X% düzeltme çıktı, dikkat" uyarısı. **Beklenen ufuk:** 6-9 ay.

**23. Kaynak yüzey görsel anomali ön filtre** — Yargı vermez, ön filtre olur ("bu kaynakta sorun var gibi, ikinci göz at"). 500+ kaynak fotoğrafı + röntgen sonucu eşleşmesi gerekir. **Beklenen ufuk:** 18-36 ay, **tersane röntgen sonucu paylaşımına bağlı.** Paylaşım gelmezse hedef düşer.

### F Katmanı — Belgeleme

**24. Müşteri portalı + imalat kayıt dosyası** — Müşteri kendi şifresiyle giriş yapar, sadece kendi projesini görür, biten spoollar için **imalat kayıt dosyası PDF** indirir. **Class kalite dosyası değil**, sadece sistemde üretilen veriden organize PDF. İçerik: imalat süreç kayıtları, malzeme listesi (BOM), aşama fotoğrafları, marka/QR/izlenebilirlik, kaynakçı bilgileri, boyutsal kontrol notları, varsa 3D tarama sapma raporu. Adlandırma: **"İmalat Kayıt Dosyası"** (Class çağrışımından kaçınma). Müşteri telefon trafiğini bitirir, AB'li gemi müşterileri için satış argümanı.

### Ek Yapılacaklar

**25. Sahada offline mod** — Mobil uygulama internetsiz çalışır, gece bağlanınca senkronize olur. Service Worker + IndexedDB + queue mantığı. Tersane sektöründe kritik.

**26. Geri al / soft delete + iade** — Yanlışlıkla silinen kritik veri 24 saat içinde geri yüklenebilir. Soft delete (`silindi BOOLEAN`, `silinme_tarihi`) ve süper admin'de "iade et" butonu.

**27. Spool detay sayfasında izometri-fotoğraf etiketleme** — Renkli kutularla görsel bağ kurma. İzometride bir parçaya kutu çizilir, fotoğrafta aynı parçaya kutu çizilir, ikisi aynı renk olur, birine tıklayınca diğeri vurgulanır. **Veri silosunu kıran arayüz.** D2, D5, D7 ve B8'in görsel ortak arayüzü.

**Kolaylaştırma yöntemleri:** (1) AI önce taslak çizer, kullanıcı sadece onaylar veya düzeltir. (2) Sürükleme yerine tek tıklama ile işaret koyma. (3) Spool malzeme listesinden parçaya tıklayıp fotoğrafta yerini gösterme. (4) Sadece anlaşmazlık çözümü için manuel müdahale. **Hiçbir akışın zorunlu adımı değildir** — fırsatçı yapılır, AresPipe ekibi boş zamanlarda örnekleme yöntemiyle ilerler.

**28. Otomatik veri akışı altyapısı** — DB trigger + ETL cron'ları. Kritik tablolarda değişiklik olunca eğitim verisi tablosuna otomatik kopyalama. Gece cron ham veriyi yapılandırılmış formata dönüştürür. Sabaha veri ML-uyumlu, etiketli, bağlantılı hâlde hazır olur. **Manuel etiketleme yerine doğal akış** prensibinin teknik temeli.

**29. Veri kalite skor sayfası (süper admin)** — Yapılandırılmış veri yüzdesi, eksik alan oranı, etiketleme tamamlanma oranı. Sayı düşerse kırmızı uyarı. Disiplin kaybını anında görmek için.

**30. Etiketleme azalan eğri göstergesi** — Etiket sayısı zaman içinde düşmüyorsa sistem yanlış kuruldu, alarm verir. Spool başına ortalama etiket sayısı aylık ölçülür. Yıl 1'de 10, yıl 2'de 3-5, yıl 3'te 0-2 hedefi. Sapma varsa mimari gözden geçirilir.

### İleri Vade (Şimdi yapılmaz, listede durur)

**31. Teklif fiyat aralığı + güven aralığı** — Geçmiş benzer işlere bakıp fiyat tahmini, "körlüğüne fiyat verme" kuralı. "Bu spool 1.200₺ tahmin, ama benzer 12 örnekten 4'ü %20 üstüne çıkmış, dikkat" çıktısı.

**32. Teklif yazma asistanı** — Müşteri talebinden taslak teklif metni üretme. Geçmiş benzer iş + risk + taslak metin. Sen üstünde 15 dakika çalışıp gönderirsin.

**33. Sıkışma analizi yorumu** — Hangi aşamada darboğaz oluşuyor, doğal dil yorumla. "Kaynak öncesi malzeme bekleme darboğaz, paralel tedarik düşünülebilir."

---

## 05 — Vizyondan Çıkarılanlar

Eski belgeden (v1) bilinçli olarak çıkarılan kararlar:

| Çıkan madde | Sebep |
|---|---|
| Kaynak yapısal güvenlik kararı | AresPipe'ın işi değil, sertifikasyon dış otoritede |
| Sıfırdan LLM eğitimi | Anthropic'in işi, bizim çağrıyla yetiniriz |
| Sabit GPU kiralama planı | Bugün gereksiz, ileride bulut servisleri (Roboflow, RunPod) yeterli |
| TRELLIS'in çekirdekte yer alması | Form tespiti gerekirse opsiyonel araç, vizyon merkezinde değil |
| Sentetik 3D'den 8 açı screenshot merkezli AI eğitim planı | Operasyonel pipeline daha güçlü kaynak çıktı |
| Crowdsourced kütüphanenin çekirdek hedef olması | İkincil hedef, halka açık oyundan opsiyonel besleme (madde 14, sınırlı kapsam) |
| "İmalat planlamada yol gösterme" geniş ifadesi | Madde 31, 32, 33 ile somutlaştı |
| Eski Faz 1-5 yapısı | A-B-C-D-E-F katman yapısıyla değişti |
| Eski Katman 1-7 (sıralı bağımlı yapı) | Katmanlar paralel olgunlaşır, sıralı değil |
| "500+ veri sonrası model kararı" geniş ifadesi | E katmanı maddelerinde her birinin ufku ayrı belirlendi |
| Müşteri portalında "Class kalite dosyası" iddiası | Sadece "İmalat Kayıt Dosyası", Class belgesini tersane hazırlar |

---

## 06 — Stratejik Hedefler (Üç Ufuk)

Vizyon üç ayrı ufka kilitlenir. Her ufkun gerçekleşmesi bir öncekinden çıkar. **Hedefler takvime değil, kayıt ölçeğine bağlıdır** — yavaş ilerlersek geç, hızlı ilerlersek erken gelir, ikisi de doğru.

### Ufuk 1 — Operasyonel Zekâ (1.000-3.000 yapılandırılmış spool kayıt sonrası)

**Hedef:** Kendi kendini bilen firma. Tahmin yerine ölçüm.

İlk birikim sürecinde elimizde **yapılandırılmış 1.000-3.000 spool kaydı** olduğunda:

- Hangi tip işin gerçek maliyeti çıkar, **maliyet körlüğünden kurtuluş**
- Geçmişe dayalı süre tahmini, müşteri taahhüdü doğrulaşır
- Sahaya gitmeden saha görme — veri tabanlı yönetim
- Ekip yetkinlik haritası — adaletli, veri tabanlı

Bu seviyede AI henüz devrede değil. Sade istatistik + iyi görselleştirme yeterli. **Ama yapılandırılmış veri olmadan yapılamaz.**

### Ufuk 2 — Tahmin Sistemi (20.000+ kayıt sonrası)

**Hedef:** Olmadan önce söyleyebilen sistem. Tahmin yerine olasılık.

İkinci aşamada sistem:

- Yeni spool girince benzer 47 spoola bakar, süre/maliyet/risk tahmini verir
- Anomali tespit eder (bu kaynakçının düzeltme oranı %19'a çıktı, yorgun olabilir)
- Müşteri davranışı kalıbını öğrenir
- Tasarım vs gerçek sapma analizi yapar — tasarımı geri besler

AI yardımcı olur ama karar veren değil. İnsanın gözünden geçer, ama **insan görmediğini sistem görür.**

### Ufuk 3 — Domain-Specific Zekâ (60.000+ kayıt sonrası)

**Hedef:** Sektörel referans olabilmek.

Bu ölçekte:

- AresPipe'a özel AI modeli — DN100 A106 SCH40 jargonunu akıcı konuşan
- Sektörel benchmark — diğer tersaneler "**ortalama ne kadar?**" diye sorar
- Servis genişlemesi — yazılım firması olarak konumlanma fırsatı
- Sektörel iyileştirme önerileri — Class kuruluşlarına veri tabanlı geri besleme

**Bu ufuklar olabilir, ama hiçbiri garanti değil.** Risk faktörleri:

- Veri kalitesi yetersiz olabilir (disiplin sürekli korunmalı)
- Pazar koşulu değişebilir (sektörel daralma)
- Teknoloji sıçrar (yeni AI bedavaya çözer mi?)
- Cihat'ın enerjisi tükenebilir (en büyük risk, uzun yol)

Bu zorluklar bilinerek yola çıkılır. Üç ufuktan biri çıksa bile diğer ikisi avantaj kalır — risk paylaşımlı.

---

## 07 — Mevcut Prototipler

### `spool_usta.html` — İzometri Okuma Oyunu (✅ Aktif)

İzometri görseli gelir. Kullanıcı segmentlere tıklar. Her segment için 4 malzeme seçeneği gelir. Doğru seçimde puan, açıklama ve kombo. Yanlışta ikinci şans ve ipucu. Yeni çalışanlar izometri okumayı öğrenir, her oturum etiketli veri üretir.

**Yeni rol:** Madde 14 (halka açık eğitim oyunu) için motor olabilir.

### `spool_3d_montaj.html` — 3D Montaj Aracı (✅ Aktif)

Kütüphaneden parça seç, sahneye ekle. Mavi uç noktalarına tıkla → popup → parça seç → otomatik yapışır, hizalanır. Y/Z ekseninde döndür. Zincir büyür. DN uyumsuzluğunda uyarı verir.

**Gerçek ASME ölçüleri:** DN100 Ø114.3mm, SCH40 et 6.02mm, LR dirsek R=171.5mm, WN flanş Ø229mm.

**Yeni rol:** Madde 13'ün (kademeli olgunlaşan 3D montaj) motoru. Spool detay sayfasındaki mevcut 3D sekmesiyle entegre olur.

---

## 08 — Teknik Kararlar

| Konu | Karar |
|---|---|
| **AI altyapısı** | Vercel Serverless Functions (`/api`) üzerinden Claude API çağrısı. Mevcut 502 Bad Gateway iş borcu, B katmanı başlamadan çözülecek. |
| **Veri formatı** | Yapılandırılmış (canonical kodlar, ARES_NORM), bağlantılı (parça merkezli mimari), zaman damgalı (`islem_log`), etiketli, doğrulanabilir. |
| **3D motor** | Three.js — CAD hassasiyeti gerekmez. Kalite kontrol ve eğitim için yeterli. |
| **GPU** | Sabit GPU kiralama yok. Eğer fine-tune gerekirse o zamanki en uygun yöntem (bulut servis, geçici kiralama, yeni nesil hazır model). |
| **Veri yedek politikası** | Fiziksel yedek, 3-2-1 prensibi (3 kopya, 2 medya, 1 off-site). Yedeklenmemiş veri aktif sistemden silinemez. |
| **Veri yaşam döngüsü** | Sıcak (Supabase), soğuk (gelecek katman), silme listesi. Süresiz saklananlar: hatalı imalat örnekleri, etiketli eğitim verileri, 3D taramalar, müşteri talep ettiği as-built belgeler. |
| **Halka açık veri** | AresPipe ana sisteminden ayrı havuz. Müşteri verisi hiçbir zaman halka açılmaz. |
| **Maliyet izleme** | `ai_api_log` tablosu (gerektiğinde), aylık API maliyet eşiği belirlenir. |

---

## 09 — Ana Programa Engel Olmayan ama Vizyona Hizmet Eden Disiplin

Cihat ana programa odaklı çalışırken aşağıdaki disiplinler vizyonun gerçekleşebilmesi için bilinçli korunur. Yeni özellik değil, alışkanlık kuralı.

- Yeni sayfa yazılırken her kritik eylem `islem_log`'a düşsün, `meta JSONB` zenginleştirilsin.
- Spool tamamlanma kartı tam dolu olsun — eksik alanların sebebine bakılsın.
- Aşama bazlı `baslangic_at` ve `bitis_at` zaman damgaları olsun.
- Hata kategorisi her red/iptal anında zorunlu olsun.
- `fotograflar.metadata JSONB` bugünden eklensin (boş başlasa bile).
- Eski veri ve "ağızdan ağza geçen bilgi" için basit not/aktarım kapıları olsun.

---

## 10 — Belge Geçmişi

| Sürüm | Tarih | Notlar |
|---|---|---|
| v1 | Nisan 2026 (23. oturum) | İlk belge: 7 katmanlı yapı, kütüphane merkezli, fine-tune odaklı, Faz 1-5 yol haritası. |
| v2 | 26 Nisan 2026 | Operasyonel veri merkezli vizyon. 33 maddelik temiz liste. A-B-C-D-E-F katman yapısı. Üç ufuk stratejisi. v1'in temel değerleri korundu, ama TRELLIS, GPU planı, sentetik veri merkezliliği, sıralı faz bağımlılığı çıkarıldı. Cihat'ın "her spool ML-uyumlu kayıt olmalı" sezgisi vizyonun çekirdeğine yerleşti. |
| v2.1 | 26 Nisan 2026 | Felsefe netleştirme: "AresPipe ek iş çıkarmaz, mevcut işi azaltır" + "zaman baskısı yok, mecburiyet yok" maddeleri eklendi. Üç ufuk takvim referansından (yıl) ölçek referansına (kayıt sayısı) çevrildi. Madde 12 (mobil etiketleme) mevcut iş akışına entegre olduğu netleştirildi — personele yeni iş eklemiyor. Madde 13 (3D montaj) opsiyonel olduğu, sadece seçilen spoollar için yapılacağı netleştirildi. Madde 27 (etiketleme) kolaylaştırma yöntemleri eklendi, "fırsatçı, zorunlu değil" vurgusu yapıldı. |

---

> Son güncelleme: 26 Nisan 2026 — v2.1 yayını. Cihat'ın "AresPipe ayak bağı değil yardımcı olmalı" felsefe testi sonucu netleştirmeler.
