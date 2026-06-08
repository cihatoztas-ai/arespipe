# WIZARD YOL HARİTASI — Devre Yüklemesi Uçtan Uca (son güncelleme: oturum 169)

> Amaç: Yazılımcı olmayan bir operatör, elindeki klasörü wizard'a bıraksın; sistem kabuğu kursun,
> belgeleri arka planda işlesin, tanımadığı formatı operatöre kolayca öğretsin, operatör taslağı
> gerçek devre detay görünümünde kontrol edip onaylasın → devre aktif listeye geçsin.
> Format öğretme ÇİFT TARAFLI: hem wizard hem izometri batch sayfasından aynı akışa girilir.
>
> İşaretleme: `[x]` bitti · `[~]` kısmen · `[ ]` açık. Madde kodları (W-xx) oturumlarda referans için.
> **KUTU MUTABAKATI (164):** ek bölümlerde hükme bağlanan maddelerin gövde kutuları çevrildi —
> ham `[ ]` sayımı artık güncel durumu verir. Mutabakat etiketi maddenin başındadır; ekler tarihçedir.

---

## BAŞARI TANIMI (hepsi sağlanınca "sorunsuz yükleme" diyeceğiz)

- [ ] B-1 Operatör klasörü sürükler, bilgi-amaçlı klasörleri (revizyon öncesi vb.) baştan dışlar.
- [ ] B-2 Excel kabuk + PDF eşleştirme arka planda kendi kendine yürür; operatör beklemez, butona basmaz.
- [ ] B-3 Tanınmayan format = kırmızı satır + "Formatı tanıt" butonu; öğretilen kural kalıcı kaydedilir, aynı aile bir daha AI'a gitmez.
- [x] B-4 KAPANDI (158): taslak gerçek devre detay görünümünde kontrol EDİLEBİLİYOR — köprü (156, df11ac1) + veri katmanı (158, W-2.14/A) canlı kanıtlı; onay=terfi wizard'dan (W-2.8 sıralı akış). MK-127.4 korunur.
- [~] B-5 "İşlenenler" takibi GEMİDE (154); paralel yükleme akışı (W-2.9) açık.
- [ ] B-6 Hiçbir belge/satır sessizce kaybolmaz: eşleşmeyen, çelişen, tanınmayan her şey görünür.

---

## FAZ 0 — TEMEL (TAMAMLANDI — kanıtlı)

- [x] W-00.1 L2 deterministik motor + fingerprint yönlendirme (4 sinyal, l2-parser).
- [x] W-00.2 İçerik-öncelikli fingerprint: kimlik = içerik, dosya adı = hızlandırıcı + kardeş-format tie-breaker (MK-152.1, kanıt 5/5).
- [x] W-00.3 format_tanit.html: yeni format tanıtma + düzeltme kipi (B1) + oto-tespit + alan yeşil/kırmızı + AI-oku + prompt_template.
- [x] W-00.4 Tablo motoru (ares-tablo-sentez): malzeme satır desenleri deterministik sentez, 3-PDF mekanik test yeşil.
- [x] W-00.5 Schedule türetme zinciri gemide (NPS+Sch → cap/dn/et, ASME dürüst kaynak).
- [x] W-00.6 İlk kural kaydı canlıda: cadmatic_spool_nps_v1 (a093eaaa, satir_tipleri=2).
- [x] W-00.7 Wizard v3 iskeleti: Adım 1 (devre+belgeler, taslak devre DB'de) → Adım 2 (inceleme, 4-renk eşleşme), Excel kabuk zorunlu (MK-125.3).
- [x] W-00.8 Katman bindirme (bindir.js, MK-111.2: sessiz ezme yok) + eslestirme-backfill.
- [x] W-00.9 Glyph onarımı Band-A (gate'li Caesar +29).

---

## FAZ 1 — KUYRUK VE OTOMATİK İŞLEME ("neden biz basıyoruz" sorununun cevabı)

> Kök neden (152 teşhisi): dosya_isleme_kuyrugu TETİKSİZ — hiçbir sayfa çağırmıyor, cron bakmıyor;
> 100+ kayıt 22 Mayıs'tan beri bekliyor (MK-152.3). Client-loop sayfa kapanınca ölüyor → "duruyor" hissi.

- [x] W-1.1 Kuyruk tetiği KARARI (153): client-loop, cron YOK — 508 saha kanıtı + MK-113/A blanket. Yeni endpoint yok (12/12 ✓). Kalıcı tetik yüzü = W-2.7 İşlenenler sekmesi.
- [x] W-1.2 Client-loop TAM (154): MK-153.1 çok-tur koşu + kalıcı UI yüzü W-2.7 İşlenenler'de "Bekleyenleri işle" — konsol global drenaj devri bitti, canlı kanıtlı.
- [x] W-1.3 MK-117 KAPANDI (153): kök = devre_dokumanlari.yukleyen_id NULL, tek küme (M110-722-21xx, 11 dosya), veri onarımıyla sahiplendirildi → 12/12 hatasız. (Null INSERT akışı 155'te KAPANDI: iki wizard'da getUser sessiz-null fallback'i → session fallback + sert iptal; hiçbir şey yüklenmeden durur.)
- [x] W-1.4 TAHLİYE TAMAM (153): 269 iş işlendi, bekliyor 233→3 (kalan IFS xlsm = excel hattı). Rapor: L2=206 (%83, $0) / L3=41 ($1.15) — 52'nin %70+ pilot eşiği sahada aşıldı.
- [x] W-1.5 Buton yedek + konsol global drenaj yolu çalışıyor (153).
- [~] W-1.6 KANIT kısmi (153, Y200 ile): format a093eaaa+L2+$0 ✓ · kardeş ayrımı (montaj→39a2c81b) ✓ · MK-111.2 bindirme koruması canlı ✓ · çöp cap/et regex temizlendi ✓. AÇIK: schedule et kanıtı — satir_tipleri Y200 ST37 satırlarını tutmuyor → satır öğretimi + cache düşürme. 155: yöntem NB1124 redüksiyonla İKİNCİ KEZ uçtan uca kanıtlandı (öğret→sha düşür→reset→L2 $0); KRİTİK ADRES DERSİ MK-155.1 — e1fb879d ailesi öğretimi DB'ye değil format-paketleri.js'e (aileBirlestir DB'yi okumaz).

## FAZ 2 — WIZARD AKIŞ YENİDEN TASARIMI (153 geri bildirimleri)

### Giriş ve yükleme
- [x] W-2.1 **[KAPANDI — 166]** Adım 1: tersane ve proje AYRI seçim alanları + çift yönlü senkron (proje seçilince tersane oturur; tersane değişince uyumlu proje korunur). "Tersan — NB1124" karışık etiketi bitti.
- [ ] W-2.2 "Mevcut devre / yeni devre" ayrımı kalkar. Mevcut devreye ekleme = devre detay "Spool ekle" → wizard'ın devre kipi (?devre_id=); onay sonrası devre detaya dönüş.
- [~] W-2.3 **[YARIM — 137: gruplu ağaç + tip-seçici + sil GEMİDE; AÇIK: gerçek iç-içe görünüm + manuel dahil/hariç tiki; kutu mutabakatı 164]** Klasör ağacı: sürükle-bırakta Windows gezgini görünümü (mockup v5, MK-97.6). Klasör/dosya bazında dahil/hariç işareti.
- [~] W-2.4 **[YARIM — 137: otomatik revizyon-öncesi TESPİTİ + rozet GEMİDE ama KOZMETİK (KARAR-137.2/2a: işleme dokunmaz); AÇIK: hariç=işlemeye girmez + görünür kayıt; kutu mutabakatı 164]** "Bilgi amaçlı" klasör/belge dışlama: revizyon-öncesi klasörler vb. işlemeye GİRMEZ. (Hariç tutulanlar kayıtta görünür kalır, sessiz silinmez.) 157 REVİZYON (MK-157.3): 156'nın "22 tablosuz çizim" kanıtı DÜŞTÜ — o dosyalar M+İ çiftinin MONTAJ kanadıydı, montaj öğretimiyle 22/22 L2/$0 çözüldü. Madde örneksiz tasarım maddesi olarak açık kalır; "ertelenemez" değil.
- [ ] W-2.5 İlerleme göstergesi ikiye ayrılır: (a) dosyaların sisteme yüklenmesi, (b) arka plan işleme (kuyruk). Tek çubuk ikisini karıştırmaz.

### Onay ve terfi (durum makinesi)
- [x] W-2.6 ÇÖZÜLDÜ (154, B kararı / MK-154.1): işleniyor/hazır KOLON DEĞİL, kuyruktan TÜRETİLİR (taslak+açık iş=işleniyor; iş yok=hazır). Migration sıfır, senkron borcu sıfır; CHECK zaten taslak/aktif/iptal tutuyordu. Onay→aktif terfisi mevcut akışta (sıralı, W-2.8).
- [x] W-2.7 İşlenenler GEMİDE (154, canlı kanıtlı): wizard panel 3 + stepper girişi + devreler.html rozetli buton (?sekme=islenenler). Satır=türetilmiş durum (işleniyor X/Y · N hata · hazır) + öneri/manuel sayaçları (dar kapsam: sayı+köprü, onay UI ayrı oturum) + İncele→taslagiAc + satır iptali (W-2.13 çekirdeği). "Bekleyenleri işle"=global drenaj UI yüzü.
- [x] W-2.8 ZATEN SIRALIYMIŞ (154 kod okuması): onayEt → terfi → backfill → toast → otomatik devre_detay yönlendirmesi (1-2.5sn). Paralel "görüntüle" butonu kodda yok; kod değişikliği yapılmadı.
- [ ] W-2.9 Paralel devre yükleme: bir devrenin işlemesi sürerken yeni devre yüklenebilir; ikisi de İşlenenler'de ayrı satır.
- [ ] W-2.10 Devre detay "Spool ekle" → ekleme yapıldıysa buton "Eklenenleri işle"ye döner → İşlenenler sekmesine yönlendirir → onay → devre detaya geri.

### Taslak önizleme (en büyük parça — karar gerekli)
- [x] W-2.11 GEMİDE (155, canlı kanıtlı): devre_detay ?taslak=1 kipi — TASLAK_KIP flag + _tkKilit() çekirdeği (19/19 yazma fonksiyonu tek satır guard, MK-154.2 deseni) + amber bant/rozet. Render'a sıfır dokunuş; normal kipte davranış birebir (regresyon ✓). Köprü KAPANDI (156, df11ac1): İşlenenler satırında 👁 Önizle → ?taslak=1 YENİ SEKMEDE (drenaj loop'u ölmesin); İncele Adım 2'de kaldı (iki kapı iki amaç). YENİ AÇIK UÇ: MK-156.1 boş gövde → W-2.14.
      A) devre_detay.html taslak kipi (?taslak=1): birebir aynılık garantili, çift bakım yok; risk = canlı-kritik sayfaya kip.
      B) Ortak render modülü + wizard içinde çizim: canlı sayfa dokunulmaz; risk = refactor maliyeti / kopya kod (MK-126.8).
      → Karar öncesi read-before-write: devre_detay taslak devreyle bugün ne kadar sorunsuz açılıyor?
- [x] W-2.12 GEMİDE (155, W-2.11 ile birlikte): amber sticky bant ("ÖNİZLEME — TASLAK DEVRE · değişiklikler kilitli") + başlık TASLAK rozeti + kilit toast'ları; 3 dil anahtarı (tr/en/ar). Tam ekran filigran bilinçli eklenmedi (bant+rozet+toast yeterli, ekran kirliliği yok).
- [x] W-2.13 KAPANDI (154, canlı kanıtlı): (a) veri onarımı — 356 yetim kuyruk işi 'iptal'e çekildi (281'i silinmiş taslakların oneri_hazir'ı; onay havuzunun %32'si hayaletmiş), 20 taslak koloni silindi; (b) wizardIptal → _taslakIptalEt çekirdeği: soft-delete+silinme_tarihi+kuyruk temizliği ('isleniyor' yarış koşulu nedeniyle hariç, MK-154.2); (c) drenaj ikinci savunma hattı: silinmiş devrenin işi HİÇ alınmaz, konsola yazılır. NOT: 'aktif hayalet' bulgusu doğrulanmadı — 138/A filtresi zaten çalışıyordu, hgtrghh aktif değildi.
- [x] W-2.14 GEMİDE (158, A kararı — canlı kanıtlı; MK-156.1 boş gövde KAPANDI): spoolYukle tek
      `if(TASLAK_KIP)` ile dallanır → excel kuyruk önerileri (N iş birleşir) → ARES_KABUK.grupla
      (terfiyle aynı çekirdek, MK-139.1 cap/et başlıkta) → sentetik satır → _spoolMap. Render'a
      sıfır dokunuş (155 disiplini korundu). Terfi hizası (MK-158.3): kalite=anaMalzeme,
      malzeme=malKod, taslak_duzeltmeleri (kalem_idx=-1) overlay'i aktar ezme kuralıyla okunur.
      goSpool taslakta kilitli; amber bant main-content'e taşındı (topbar örtme fix). Alıştırma/
      izometri verisi taslakta YAPISAL yok (MK-157.1) — terfiden sonra dolar (158'de kanıtlandı).
      B refactor'ü (ortak render modülü) reddedildi: üçüncü tüketici doğarsa yeniden açılır.
- [x] W-2.15 KAPANDI (158, canlı kanıtlı): devre_detay 6. sekme "✅ Onay Kuyruğu", 4 grup —
      manuel_onay amber/TEKİL (lazy uyarı listesi spoollar[].uyarilar + ✓Kapat →tamamlandi) ·
      excel öneri (mevcut onayModalAc köprüsü) · atanmamışlı izometri ("Detay" → _eslesme.detay
      spool+sebep; B-6 görünür, toplu kapatmaya GİRMEZ) · temiz öneri TOPLU (→tamamlandi, veri
      işlemi YOK; _eslesme özetsizler girer — MK-158.2). atanmamis kuyruk durumu DEĞİL,
      _eslesme özetinden türetilir (PostgREST JSON alias). Sekme rozeti + ?sekme=onay deep-link
      + _tkKilit guard. devreler.html: satır rozeti ✅N (kuyruk gerçeği, köprülü) + İşlenenler'e
      bekleyen-iş rozeti (157 bulgusu kapandı). KANIT: g200 tekil 55→54 · hhbjşlö toplu 24→0
      (excel+manuel dokunulmadı) · aw231 atanmamışlı 8 + kabukta_yok detayı. "Eşleştir" aksiyonu
      bilinçli ertelendi (gerçek eşleştirme aracı ayrı tasarım).
- [x] W-2.16 KAPANDI (159, canlı kanıtlı — MK-159.1): iş emri numarası YALNIZ TERFİDE üretilir.
      Migration 101 (is_emri_no DROP NOT NULL + durum='taslak' OR dolu CHECK) · taslak INSERT
      null · onayEt: mevcut numara korunur → yoksa sonraki_no RPC (atomik) →
      eq('durum','taslak') guard'lı update. KANIT: sayaç 217→218 tek terfiyle; iptal yakmadı;
      P26-218=bcmbvö. Kural istisnasız: kalan taslakların numarası NULL'lanır (160 teyidi).
      devre_detay TASLAK_KIP "Terfide üretilecek" (tr/en/ar).
- [x] W-2.17 KAPANDI (159, görünüm kanıtlı; tıklama testleri 160 açılışı): spool düzelt modalı
      zenginleştirme — 📄 PDF'i aç (storage_yolu lazy, dokAc-102 deseni, dosyaUrlAl
      devre-belgeleri) + Malzemeler (N kalem) bölümü → 146/B kalem modalına köprü (kalemDuzeltAc
      donusIdx paramı, "← Spool'a dön"; köprü anahtarı = kabuk anahtarı pipeline|spoolNo).
      Çapa stub KALDIRILDI (MK-159.2: görsel okuma format_tanit'te; omurga 8/18.d düştü).
      NOT (MK-159.3): 146/B zaten uçtan uca tamdı (aktar.kalemDuzeltmeler dahil) — 145 "B kalanı"
      kaydı eskimişti.
- [x] W-2.18 **[KAPANDI modal hali — 160; kutu mutabakatı 164]** (159 tasarım bulgusu — Cihat akışının kilit taşı): ÖNİZLEMEDE İZOMETRİ PARSE VERİSİ.
      Taslak önizleme bugün yalnız Excel kabuk + düzeltme overlay gösterir; L2'nin söktüğü her şey
      (malzeme_listesi, alıştırma, ölçüler) terfiden SONRA iner (MK-157.1 yapısal sınır). Hedef:
      kuyruktaki izometri işlerinin parse_sonuc.spoollar[] verisi DB'ye yazılmadan önizleme
      satırlarına üçüncü katman olarak bindirilir (excel kabuk + izometri overlay + düzeltme
      overlay). Operatör onaydan ÖNCE PDF'ten geleni görür.

## FAZ 3 — FORMAT TANIMA ÇİFT TARAFLI + SON KULLANICI KOLAYLIĞI

> İlke: format öğretme ayrı bir "yazılımcı seansı" değil, akışın içinde tek tıkla girilen bir adım.
> Giriş noktaları hazır: format_tanit ?format_id=&alan= + picker (149).

- [x] W-3.1 **[İPTAL — 162/MK-162.1, kutu mutabakatı 164]** Wizard inceleme: zayıf/çelişkili/L3/tanınmadı rozetli satıra "Formatı düzelt / tanıt"
      butonu → format_tanit. 159 NETLEŞMESİ (MK-159.2): köprü `?is_id=` ile DOSYA TAŞIR —
      format_tanit PDF'i storage'dan kendisi açar, format/spool bağlamını işten okur; operatör
      dosya ARAMAZ. format_tanit'e DEĞER KİPİ eklenir (B2 ürünleşmesi: değer →
      taslak_duzeltmeleri işaretli; "alan hep burada" → B1 kural patch) — sol bilgi + sağ PDF
      tek ekran, wizard'a ikinci PDF görüntüleyici GÖMÜLMEZ. 160 ANA İŞ paketi.
- [x] W-3.2 **[GEMİDE — 161 canlı tık kanıtlı, kutu mutabakatı 164]** İzometri batch sayfası: aynı buton/köprü (tanınmadı satırı → format_tanit `?is_id=`).
      İki taraf AYNI çekirdeği kullanır, kopya akış yok. (159: Cihat kararı — format tanıtma
      izometri batch gibi AYRI MODÜL kimliğinde kalır, hepsi aynı altyapı, çift taraflı gelişir.)
- [ ] W-3.3 L2-fail davranış seçimi devre düzeyinde: "AI'a gitsin (L3)" / "AI kapalı — tanınmayanı bana göster". Kapalıyken dosya sessiz kaybolmaz, "tanınmadı → formatı tanıt" satırı olur. (Muhtemel küçük migration — MK-98.2 dry-run.)
- [ ] W-3.4 Öğretilen kural kaydedilince: aynı devredeki kardeş dosyalar otomatik yeniden işlenir (kuyruğa geri) — operatör tek PDF öğretir, gerisi kendiliğinden okunur.
- [x] W-3.5 **[C YOLUNA DEVİR — 162/MK-162.1, wizard kapsamından çıktı; kutu mutabakatı 164]** Son kullanıcı dili sadeleştirme: format_tanit metinleri operatör diliyle (B1 "okuma yerini düzelt" ↔ B2 "değeri düzelt" ayrımı ekranda anlaşılır); et_mm "runtime'da ASME'den dolar" mesajı; kaydet modal otomatik kapanış + toast.
- [x] W-3.6 **[C YOLUNA DEVİR — 162/MK-162.1; kutu mutabakatı 164]** format_kodu otomatik öneri (operatöre sistematik kod sorulmaz, sistem önerir).
- [~] W-3.7 **[ÇÖZÜLDÜ — 161 kök neden; AÇIK: yalnız Windows CANLI TEYİDİ; kutu mutabakatı 164]** Windows render sorunu: pilot operatörleri Windows'ta — format_tanit PDF görüntüsü Windows'ta düzgün olmadan "son kullanıcı kolay" hedefi sağlanamaz.
- [ ] W-3.8 Band-B glyph tablosu (~20 karakter): NB1137 spool ailesi L3'ten L2'ye iner ($0).
- [x] W-3.9 **[KAPANDI — 153 + 163/D3 yazım katmanı; kutu mutabakatı 164]** (153 bulgu) format_tanit TURETILEN_ALANLAR panzehiri: cap_mm/et_mm/dn için kayıtlı (eski/çöp) regex olsa bile _alanlariKos KOŞMAZ, patch YAZMAZ, çip 🧮 türetilmişe zorlanır. (Çöp regex'in ekrana kırmızı, üretime 2358 bastığı kanıtlandı; veri onarıldı ama kod kapısı açık.)
- [x] W-3.10 KAPANDI (157, kanıtla): kimlik çıkarımı adresi = kuyruk-isle-izometri.dosyaAdiParse;
      mevcut regex listelenen TÜM kalıpları (zone'suz <NPS>x<NPS>, segment, 4-segment, zone-harf)
      ZATEN tutuyordu (9/9 node testi). 156'nın "20/22 kimlik dışı" teşhisi yanlıştı — kabukta_yok
      taslak-yapısaldı (MK-157.1) + .SXX'siz dosyalar montajdı (MK-157.3, 39a2c81b'ye
      dosya_adi_regex öğretildi, 36/36 test, 22/22 L2/$0). NB1124 44/44 çözüldü. Kalan: yeni
      gemilerde kanıt sürdürme (montaj fingerprint'i artık zone'suz adları da tanır).

## FAZ 4 — VERİ SAĞLIĞI VE PROPAGASYON

- [~] W-4.1 Propagasyon: eslestirme-backfill 157'de DİRİLDİ (ERR_REQUIRE_ESM, MK-157.2). 158
      kanıtı: backfill MONTAJI da eşler — eslestir() montaj dalını içinde barındırır
      (kuyruk-isle:506), montajda spoollar=[] Array olduğundan ön filtreden geçer; bcmghbnv
      terfisinde 28/36 spool montaj_json doldu, spool_detay "Montaj Resmi" UI'ı çalışıyor
      (116/Is3 göz teyidi TAMAM). Kalan: eski L3 / yanlış-format aile yeniden parse turu.
- [ ] W-4.2 pipeline_no E120- prefix normalizasyonu (wizard eşleştirme/mutabakat fazında; 289 montaj kaydını yeniden parse ETMEK çözüm değil).
- [ ] W-4.3 Dirsek 323.9 ağırlık normalizasyonu (PDF toplam ↔ Excel birim; l2-parser tarafı, K2 bug'ı değil).
- [x] W-4.4 **[KAPANDI — 164: yakalama-anı scale-1 normalize + norm:1; norm'suz bbox tüketilmez]** bbox → PDF-point normalize (konum_ipucu).
- [ ] W-4.5 K1+K3 bulgularının uyarilar.html + wizard inceleme ekranında yüzeye çıkması (K2 deseniyle).
- [x] W-4.6 KAPANDI (154): vercel.json'a ares-izometri-drenaj.js no-cache başlığı eklendi (1e89804).
- [x] W-4.7 CEVAPLANDI (154): 3 IFS xlsm 'bekliyor' YETİMMİŞ (sahipleri taslak/silinmiş devre) — excel hattı tetiksiz değildi; W-2.13 onarımıyla kapandı, bekliyor=0.

## FAZ 5 — UÇTAN UCA CANLI KANIT (MK-132.1: canlı test olmadan kapanmaz)

- [ ] W-5.1 Gerçek bir devre klasörüyle tam tur: sürükle → dışlama → kabuk → arka plan işleme → 1 tanınmayan format öğret → kardeşler otomatik okunur → taslak önizleme → İşlenenler → aktif devreler.
- [ ] W-5.2 Aynı turda ölçüm: AI çağrı sayısı / L2 oranı / toplam maliyet (ai_api_log) — hedef yönü: AI payı %5-10'a.
- [ ] W-5.3 Mevcut devreye ekleme turu: Spool ekle → Eklenenleri işle → onay → devre detaya dönüş.

---

## SIRA ÖNERİSİ (Claude — 159 güncel)

1. ~~FAZ 1~~ ✓ · ~~omurga (W-2.6/2.7/2.11/2.14/2.15)~~ ✓ · ~~W-2.16/2.17~~ ✓ (159).
2. **160: FORMAT YÖNETİM MİMARİSİ** (Cihat teşhisi): tek otorite (DB vs paket, MK-155.1) +
   öğretim adresi tablosu + format_tanit DEĞER KİPİ + W-3.1/3.2 `?is_id=` köprüleri + W-3.4
   kardeş yayılımı. Çıktı: FORMAT-YONETIM-MIMARI.md + ilk köprü canlı.
3. **W-2.18** (önizlemede izometri overlay) — Cihat akışının kalan kilit taşı.
4. W-2.3/2.4 (klasör ağacı + dışlama) — 159'da fiili öncelik FAZ 3'e kaydı, geriye düştü.
5. FAZ 3 kalanları (W-3.3 L3 anahtarı, W-3.5-3.9) → FAZ 4 → FAZ 5 kanıt turu.

## UFUK (159 profesyonel kıyas — Spoolgen/Isogen/PCF dünyasıyla; çelişki değil konumlanma)

- **U-1 Çoklu veri kaynağı:** PDF bugünün tersane gerçeği (dizayn ofisi PCF vermez); ileride
  Rhino / STEP / PCF-IDF aynı kabuğa inen alternatif kapılar olur. Mimari hazır: Excel kabuk
  otorite + katman bindirme → yeni kaynak = yeni katman, kırılma yok. Yapısal veri varsa parse
  atlanır (IFS köprüsü deseni).
- **U-2 Devre bazlı kalite dosyası:** iş bitiminde devreye ait kalite dosyası çıktısı (Cihat:
  benzer yapı var). Profesyonel araçların kaynak/weld izlenebilirliğinin bizdeki karşılığı;
  kaynak-numarası düzeyine inilecekse bu pakette tasarlanır.
- **U-3 Spec-doğrulama:** boru sınıfı (piping spec) otoritesi bilinçli kapsam DIŞI — sistem
  BOM→kütüphane çapraz doğrulamayla (K2, 2-kaynak konsensüsü) ilerler. Tersane spec verirse
  yeniden değerlendirilir.
- **U-4 Revizyon derinliği:** rev sütunu VAR; çizimlerin hangi revizyonda olduğu tabloya
  işlenecek (Cihat planı). İleri adım (rev-diff: "rev2'de ne değişti") ihtiyaç doğunca.

## AÇIK KARARLAR (Cihat)

- ~~K-1~~ CEVAPLANDI (154): W-2.11 = A (devre_detay ?taslak=1 kipi). Uygulama 155.
- K-2: W-3.3 L3 anahtarının varsayılanı ne olsun? (Öneri: pilot döneminde AÇIK; format kütüphanesi olgunlaşınca devre bazında kapatılır.)
- K-3: W-1.1 cron zinciri Hobby tek-cron hakkıyla mı, yoksa İşlenenler sekmesi client-loop'u yeterli mi? (Öneri: ikisi birden — sekme anlık, cron emniyet ağı.)

---

## 160 GÜNCELLEMESİ (2026-06-06) — spool modalı "büyük ekran"a evrildi
Durum değişiklikleri (yukarıdaki maddelerin üstüne):
- **W-3.1 → İPTAL (Cihat kararı):** zayıf satırdan format_tanit'e köprü YOK — değer işi spool
  modalında çözülür; format öğretimi batch Tanıt + nav'dan. `spool.izometri.is_id` devre-inceleme
  API'de duruyor (ileride köprü gerekirse hazır).
- **W-3.2 → GEMİDE:** batch "Tanıt" → `format_tanit?is=&kaynak=batch`. Canlı tık testi 161'de
  (is_kuyrugu client SELECT RLS riski — hata mesajı artık sebebi söylüyor).
- **W-2.18 → KAPANDI (modal hali):** "PDF'ten okunan (ham)" bölümü — parse dalı generic döküm
  (kesimler/koordinat/not/malzeme tablosu, alan listesi sabitlenmeden). + Önizleme enjeksiyonu:
  alıştırma (117 kuralı birebir: ALS dosya→VAR / alistirma_ipucu) + NOT + yüzey (kabuk_bos kuralı)
  endpoint'te satıra taşınır (MK-160.5 adayı).
- **W-2.19 → YENİ, YARIM:** `dpvZoomTo(sayfa,bbox)` + sarı vurgu altyapısı gemide (konsoldan
  denenebilir); değere-tıkla bağlantısı KOORDİNAT ENVANTERİ ister (motor alan konumu yazmıyor) —
  161+ tasarım işi. Dilim 2: kural bölgelerinden koordinat / motor alan-konum eki.
- **YENİ — spool modalı büyük ekran (MK-160.3):** pdfjs SALT görüntüleyici (sayfa/zoom/drag-pan
  sınırlı/canvas-emniyetli) + sekmeler 📐izometri ↔ 🗺montaj ↔ 📊Excel (SheetJS vendor) + inline
  kalem düzeltme + **kalem EKLEME** (kalem_idx≥bom.length → aktar `kod:'OPR'` satırı, MK-160.4
  adayı) + NOT alanı düzeltilebilir (aktar `not`→imalat_not) + kalite-malzeme süzgeci
  (kategori_kod) + her satırda buton (zayıf=Düzelt sarı, sağlam=İncele yeşil) + zayıf SEBEBİ
  başlıkta (çelişki/kritik/güven) + "düzeltme rozeti değiştirmez" bilgi notu.
- **YENİ AÇIKLAR (160 testinden):** (a) zayıf ÇELİŞKİ DETAYI — hangi alan çelişti, bindirme/_eslesme
  listesi modalda gösterilmeli (operatör neyi düzelteceğini bilsin); (b) Excel sekmesi ilk testte
  açılmadı — hata mesajı detaylandırıldı, 161'de vendor `/vendor/xlsx.full.min.js` 404 kontrolü;
  (c) yüksek zoom'da sol form scrollbar kaybı — canvas emniyeti (7500px) sonrası tekrar test;
  (d) operatör NOT overlay'i ↔ eslestir D2 ezme etkileşimi (terfi sonrası parse NOT'u tazeler);
  (e) bu modal devre_detay'a da taşınacak (spool önizleme — Cihat istedi); (f) glyph bozulması
  canvas'ta (pilot/Windows konusu, metin katmanı sağlıklı).
- K-2 (W-3.3 L3 anahtarı varsayılanı) ve K-3 (cron zinciri) AÇIK duruyor.

---

## 161 GÜNCELLEMESİ (2026-06-06) — modal açıkları kapandı + glyph canvas ÇÖZÜLDÜ
Durum değişiklikleri (160 güncellemesinin üstüne):
- **W-2.20 (160 açığı a) → KAPANDI (canlı kanıtlı):** zayıf ÇELİŞKİ DETAYI modalda — "⚠ Çelişen
  alanlar" bölümü, satır bazlı `Et: Kabuk(Excel) 4.5 ↔ PDF 3.05 · kabuk korunur` + kaynak dosya.
  Veri yolu K2 enjeksiyon deseni (lib SAF): izometrileriDerle anahtarına `bindirme_celiski`
  (flag'li bindir satırları) → endpoint haritayla spool'a taşır. BONUS KÖK BULGU: `kabukBindirHedef`
  "client cap/et göndermiyor" BAYAT notuyla et/çap'ı null'luyordu (MK-159.3 üçüncü vaka) —
  MK-139.1'den beri gönderiliyor; düzeltildi → **et/çap çelişkisi önizlemede İLK KEZ doğuyor**
  (bazı "okundu" spool'lar zayıfa düşebilir; gürültü değil, görünmeyen gerçek çelişki).
  Mekanik test: test-w220.mjs 6/6 + test-isid.mjs 6/6 regresyonsuz.
- **W-3.9 → KAPANDI:** `_turetZorunlu()` (oturum sentezi VEYA DB satir_tipleri aktif) altı kapı:
  hydrate çöp regex'i yüklemez · _alanlariKos koşmaz · markDirty elle dönüşü keser (toast) ·
  buildParserKural + düzelt-kipi patch'i yazmaz · çip metni zorunluda "elle dönüş" cümlesini
  gizler. 153'ün "2358" vakası kod seviyesinde kapalı.
- **W-3.7 → ÇÖZÜLDÜ (canlı kanıtlı, "glyph: temiz ✓"):** kök neden = Cadmatic'in GEÇERSİZ
  `/ToUnicode /Identity-H` satırı (isim; stream referansı değil) + font gömülü değil → pdf.js
  glyph→unicode kuramayıp canvas'a çorba basıyordu (Acrobat/Chrome sistem Arial'ıyla maskeliyor).
  Çare: **ares-pdf-tounicode.js** — bellekte ARTIMLI ToUnicode (identity 0x20-0x17F) enjeksiyonu,
  iki taban: klasik xref (E120) + XRef stream (Y200). Kanıt: pdf.js 1.10 mekanik 5/5+5/5 çapa,
  idempotent, poppler çapraz; kapılı (gerçek ToUnicode'lu/yapısı uymayan dosyaya DOKUNMAZ),
  storage'a YAZILMAZ. Entegrasyon: wizard dpvSec + format_tanit loadPdf.
- **W-3.2 köprü CANLI KANITLANDI:** batch Tanıt → `?is=&kaynak=batch` ile format_tanit PDF'i işten
  açtı (RLS sorunsuz); otoTespit a093eaaa 6/6 yeşil (Y200), spool_no→S01.
- **160 açıkları (b)+(c) KAPANDI:** Excel sekmesi — vendor 200 ✓; gerçek kök = IFS'in BOŞ İLK
  SAYFASI (`!ref` yok) sheet_to_html'i patlatıyordu → dolu sayfaya oto-kayma + "Bu sayfa boş" notu
  + lokal try. Scroll/scrollbar kaybı kökü = grid/flex `min-height:auto` zinciri (`.dp-split>*` +
  `.dpv-wrap` min-height:0) — sol form scrollbar'ı da aynı fix'le döndü. + Excel UX: hücre seç →
  oklarla gez, üstte hücre çubuğu (adres+TAM içerik), td max-width 280px + çift tık kolon toggle.
- **YENİ — kg/mm tek ondalık standardı:** `f1()` yardımcısı (tr-TR, min/max 1) — float çöpü
  (1670.5000610000002) bitti; 10 gösterim noktası bağlandı; et/çap BİLEREK dokunulmadı (spec değeri).
- **YENİ AÇIK (161 saha bulgusu — W-2.4/K2 belirtisi):** format_tanit otoTespit yalnız
  `requires_ai=false` formatları tarar → paket-ailesi PDF'inde (E120, üretimde e1fb879d) tek DB
  formatına ("tersan deneme"/a093eaaa) "otomatik eşleşti ✓" der, ⚠ MK-155.1 banner'ı HİÇ tetiklenmez
  — operatör yanlış adrese yazmaya bir tık mesafede. Çare adayı: otoTespit sonucu fingerprint/üretim
  formatıyla çapraz doğrulanmadan "eşleşti" güveni verilmez.
- **KALAN:** Y200 ST37 satır öğretimi KAYDI + W-3.4 yayılım (sha düşür→reset→kanıt) → 162 ilk iş ·
  OPR kalem-ekleme (f) SQL kanıtı yapılmadı · "tersan deneme" AD düzeltmesi (pilotta kötü görünür).

---

## 162 GÜNCELLEMESİ (2026-06-06) — FAZ 3 İLKESİ REVİZE: format öğretimi ATÖLYEYE alındı (MK-162.1)
- **FAZ 3'ün giriş ilkesi ("format öğretme akışın içinde tek tıkla") DEVRİLDİ:** 161+162 kanıtı
  (UI testi iki kez yanılttı — tarayıcı GÖRSEL-sıra metni ≠ sunucu content-stream metni; adres
  iki kez yanlış formata gidiyordu — E120/161 + E100/162) → **format_tanit uzman aracı.** Menü
  girişi kaldırıldı (`6a27723`), feature-flag korur, batch "Tanıt" köprüsü uzman girişi olarak
  kalır. Operatör formata HİÇ dokunmaz; bilinmeyen format L3'le çalışır, uzman atölyesi (Cihat+
  Claude: zip → sunucu-metni dökümü → kural kanıtı → SQL kayıt → drenaj kanıtı) formatı $0'a
  indirir. W-3.x ailesinin "son kullanıcı kolaylığı" maddeleri C yoluna devredildi (otomatik
  kural önerisi + uzman onayı; G2a düzeltme birikimi köprüsü MK-162.2 ile beslenir).
- **W-3.4 yayılımın ön adımı gemide:** a093eaaa pipeline_no = `\n([A-Z]\d+-\d+-\d+)\n` (SQL,
  sunucu metninde mekanik kanıtlı — Continue tuzağı baştaki boşlukla doğal eleniyor; `[A-Z]`
  çünkü bölge kodu ≠ format). KALAN: malzeme satır öğretimi kaydı (diğer bilgisayar, reçete:
  docs/FORMAT-OGRETIM-ATOLYE-162.md) → sha düşür → kardeş reset → L2/$0 kanıt.
- **YENİ AÇIK — W-3.11 (B6 şüphesi):** düzeltme kipinde tablo öğretimi Güncelle'de "değişiklik
  yok" dedi (E100 vakası — yanlış PDF olması bizi kurtardı ama): `_patchedKural` `tip!=='tablo'`
  filtreli, tablonun AYRI yazım yolu doğrulanmadı. Y200 kaydında 1 numaralı kontrol; kırıksa
  tamir 163 yapısal işi.
- **YENİ AÇIK — W-3.12:** format_tanit `_alanCikar` = l2-parser KOPYASI ve sapmış (whitelist
  yok) → tek kaynağa bağlanmalı (ares-tablo-sentez deseni). + `alanCikar` sessiz `fallback`
  dalı taranmalı (eşleşmeme ≠ fallback-uydurma ayrımı çağırana gitmeli).
- otoTespit çapraz doğrulama (161 açığı) üçüncü vakayla pekişti (E100) — atölye modelinde
  aciliyet düştü, tasarım borcu duruyor.
- **163 YÖNÜ (Cihat):** yapısal eksikler — W-1.x kuyruk drenajı (100+ stuck) + W-3.11 + W-3.12;
  format ÇEŞİTLİLİĞİ sonraya, toplu tanıtımlar diğer bilgisayardan.

---

## 163 GÜNCELLEMESİ (2026-06-06) — YAPISAL TEMİZLİK: W-3.11/W-3.12 kapandı, iki hayalet borç silindi
- **W-3.11 → KAPANDI (hüküm + patch):** tablo yazım yolu SAĞLAMDI (152 köprüsü `kaydet`
  içinde); gerçek kapı `_tabloSentezle`'nin `yesil>0` şartı + sentezin TARAYICI metnine
  (CANON_ALL) koşması — B1'in tablo izdüşümü. 162 "değişiklik yok" semptomu kırık yol olmadan
  üretilebiliyor. Patch (13/13 mekanik test): D1 toast tablo durumunu ayrıştırır ("yeşil kanıt
  0 — YAZILMAZ" / "kayıtlıyla AYNI" / "AI oku") · D2 `_tabloYeniMt/_tabloDegistiMi` tek kaynak
  → tamamlaAc önizlemesi = kaydet yazımı (162'nin "modal gösterdi" yanılgısının kökü) · D3
  `_patchedKural`'a W-3.9 kapısı (türetilen alan sızıntısı — 153/2358'in açık kapısı kapandı).
  ATÖLYE REÇETESİNE EK ŞART: Güncelle öncesi "🧮 N satır tipi · yeşil>0" kutusu görülmeli.
- **W-3.12 → KAPANDI:** çekirdek `ares-alan-cikar.js` (kök, IIFE — ares-tablo-sentez deseni);
  l2-parser ince delege (export imzaları aynen), format_tanit kopyaları silindi. Kopyada
  whitelist'e ek **format_template dalı da eksikmiş**. Sessiz `fallback` taraması (F1): 6
  format / 27 alan kuralında fallback/whitelist/format_template kullanımı SIFIR → B4 bugün
  TEORİK; görünürlük gerekirse tek yerden eklenir.
- **FAZ 1 girişindeki "100+ stuck (MK-152.3)" notu TARİHSELDİR — 163 denetimi:** kuyrukta
  bekliyor=0 (K1/K2 SQL kanıtı); 153-154 zaten çözmüştü (W-1.1/1.2/1.4). Tek kalıntı (19 May
  excel `hata`: Donatım Kontrol Formu = BOM dışı) iz notuyla iptal. **MK-117 de aynı durumda:**
  W-1.3'ün 153/155 kapanışı taze SQL ile teyitli (2 legacy null, hepsi final). DERS → MK-163.1:
  devir borçları taşınmadan TAZELENİR.
- **Onay birikimi temizliği:** 428 oneri_hazir/manuel_onay'ın 281'i 22 May test kalıntısıydı
  (P26-039 + P26-149) → toplu iptal (Cihat). Kalan ~147 = 5-6 Haz taze kuşağı → W-2.15 Onay
  Kuyruğu'ndan ürün-akışı eritme turu 164 adayı.
- **B3 ad/kod (B5'in kökü görünür):** a093eaaa → "Tersan Cadmatic Spool — Öğretim
  (çok-notasyon)" / `tersan_cadmatic_spool_ogretim_v1` · e1fb879d → "Tersan Cadmatic İmalat
  (Spool) — Katalog" · 39a2c81b → "Tersan Cadmatic Montaj — Katalog". a093eaaa ile e1fb879d
  AYNI yapısal aile (spool PDF'inde iki başlık da var); ayrım KAYNAK: katalog-paket vs
  DB-öğretim (MK-119.2 ikiliği). format_kodu YASAK kümesi = AILE_KAYIT anahtarları.
- **G2a köprüsünün v1'i gemide (MK-162.2):** migration 102 `g2a_duzeltme_sinyali`
  (security_invoker=true) + uyarilar.html 📐 "Format Kuralı Şüphesi" kutusu. v2 = format bağı
  (parse_sonuc anahtar keşfi 164'te).
- **YENİ BORÇ (MK-163.6):** `devre_dokumanlari.parse_durumu` bayat (1611 'bekliyor' / kuyruk 0)
  — UI kuyruktan okuyor (102 fix), canlı bug değil; emekli-mi-trigger-mı kararı açık.
- **OPR (f) → reçeteyle Cihat'ta:** mekanik kanıt tamam (ares-kabuk 261-274); canlı tur =
  + Ekle → terfi → `spool_malzemeleri kod='OPR'` SELECT.

---

## 164 İŞARETLERİ (2026-06-06) — G2a kaynak bağı + ürün rötuşları
- **G2a v2 GEMİDE (MK-162.2 v2, Cihat: A kararı):** migration 103 — `taslak_duzeltmeleri`'ne
  `deger_kaynagi` (CHECK: excel/izometri/operator) + `format_id` (FK, ON DELETE SET NULL);
  `g2a_duzeltme_sinyali` görünümü kaynak kırılımlı (security_invoker korunur). **164-B1
  bulgusu:** v1 sinyallerinin değer kaynağı Excel kabuktu; v1 kart metni PDF format kuralına
  YANLIŞ adres veriyordu. Karar gerekçesi: görünüm-zamanı çıkarım = tahmin; kayıt-zamanı bağ =
  gerçek (eski satırlar NULL='bilinmiyor', backfill YOK).
- **MK-164.1 (aynı-oturum öz-düzeltme):** ilk yama sabit `'excel'` yazıyordu — ekran kanıtı
  (NB1137 modalı: yuzey/alistirma/not L2 rozetli) yanlışı yakaladı. v2.1: kaynak ALAN-BAZLI,
  dsatir rozet kuralının birebir eşi (cap/et/agirlik/malzeme/kalite→excel ·
  yuzey[yuzeyHam varsa]/alistirma/not→izometri+format_id · izometri eşleşmesi yoksa→operator).
  `devre-inceleme` artık `parse_sonuc.format_id`'yi önizleme izometrisine taşır. 10/10 test.
- **W-2.15 onay kuşağı tazelendi:** 147 değil **162** (manuel_onay 27 + oneri_hazir 135);
  P26-217 tek başına 76. Eritme turu yapılmadı → 165 adayı.
- **W-2.19 UCUZ DİLİM GEMİDE + W-4.4 KAPANDI:** format_tanit bbox'ı artık YAKALAMA ANINDA
  scale-1'e normalize kaydeder (`norm:1`); drawMarks norm-duyarlı çizer. Wizard Malzemeler
  başlığına **🔍 Tablo** — `parser_kural.malzeme_tablosu.konum_ipucu` (YALNIZ norm'lu bbox) →
  izometri sekmesi → `dpvZoomTo`+sarı vurgu. Norm'suz eski kayıt KULLANILMAZ (dürüst toast,
  tahmin yok). Bugün hiçbir formatta norm bölge yok → **Y200 tablo öğretimi yapıldığı an
  buton canlanır** (tek reçetede birleşti). Tam dilim (alan-bazlı konum = motor konum eki,
  B1 metin-ayrışmasına komşu) ayrı tasarım borcu.
- **Kalem KALİTE alanı (Cihat bulgusu):** kalem editöründe kalite yoktu (paslanmaz seçilir,
  304/316L girilemezdi); üstelik kabuk her iki dalda `kalite`'ye HAM MALZEME yazıyordu
  (OPR'de 'paslanmaz' saçması). KALEM_ALANLAR + yeni-kalem listesi + dinamik süzgeçli dropdown
  (spool yolunun birebiri) + kabukta `dz.kalite` tercihi (yoksa eski davranış — sıfır regresyon).
- **MK-163.6 KAPANDI — parse_durumu A (yumuşak emeklilik):** grep kanıtı `_parseDurumu`'nun
  TÜKETİCİSİ YOKTU (2707/2793 yalnız `_kuyrukDurum`); devre-inceleme/izo-eslesme'deki aynı ad
  ÇIKTI alanıdır, kolon değil. SELECT'ten çıkarıldı, ölü alan silindi, kolona BAYAT COMMENT
  (yazımlar sürer, veri silinmez, YENİ KOD OKUMAZ).
- **Canlı kanıtlar:** kalite(spool)→`excel` ✓ · yeni kalem(idx≥bom)→`operator` ✓ · 📐 kart yeni
  "kaynak kayıtlı değil (103 öncesi)" metni canlı ✓. **AÇIK:** izometri-kaynak kanıtı (1
  alistirma düzeltmesi + SELECT) · OPR TERFİ kanıtı (`spool_malzemeleri kod='OPR'` hâlâ 0 —
  taslak kaydı doğdu, terfi turu eksik).
- **YENİ BORÇ (165):** M130-817-008.S01 PDF çap 42.2 / et 3.56 ↔ kabuk 60.3 / 2.77. Kuyruk
  gerçeği: format **e1fb879d (KATALOG-PAKET)** — adres paket kuralı, DB-öğretim değil. Hipotez:
  redüksiyonun küçük ucu (1-1/4"=42.16) spool çapı seçilmiş; et schedule ailesiyle akraba.
  Teşhis SELECT'inde cap anahtarı null döndü (anahtar adı TEYİTSİZ — MK-85.3), satirlar=0,
  seviye=null → parse_sonuc şeması atölyede sunucu verisiyle incelenir.

---

## 165 İŞARETLERİ (2026-06-07) — 42.2/3.56 KAPANDI + atölye standardı + teyit üçlüsü
- **42.2/3.56 VAKASI KAPANDI (164 borcu):** parse_sonuc dökümü hükmü verdi — dn=32 (alan-regex
  KAYNAK satırına çapa atmış), cap 42.2 + et 3.56 `asmeFallbackDoldur`'dan (dolduruldu:
  "ares_boru (SCH 40)"; 164'ün "satirlar=0" okuması yanılgıydı, 3 satır temizdi). Üç kök:
  emperyal satırda boyut alanı yok (MK-165.1) · dn ilk-eşleşme yanlış çapası (MK-165.2) ·
  fallback ÇİFT KÖRLÜĞÜ (helper malzeme-kör + DB schedule-kör — MK-165.3; 153'ün 3.68/3.91
  kökü). Drenaj kanıtı: S01+S02 **dn=50 · 60.3 · 2.77 · ares_boru (SCH 10S)**, cache_hit yok;
  yeni bindirme uyarılarında (A-001211/12) et/çap kalemi YOK, yalnız ağırlık yuvarlaması.
  Bağımsız set kanıtı: G400-817-015 + E100-817-005 → 2.77. Commit'ler: 5edbba1 + 1596481.
- **Atölye koşum aracı GEMİDE (MK-165.5):** `scripts/atolye-kosum.mjs <klasör>` — tersan.zip
  (6 gemi/15 PDF) 30 sn'de tarandı, 15/15 L2 + sonda ham=0. Bilezik Detay satır tipi eklendi
  (af90f85): 7 ham (İç) + 3 SESSİZ (Dış) satır kurtarıldı. Cihat hedefi: ~10 çeşitli paket
  daha → emperyal/metrik vektör-PDF ailesinde açık kalmaz (PAOR/image-PDF L3'te kalır).
- **dnBul GEMİDE (f86ff81):** DN basmayan ODxet çizimleri (AT110-804) → spool dn dominant
  borunun OD'sinden ters eşleme (tek-eşleşme, uydurma yok); 76.1 gibi ASME-dışı null kalır.
- **AÇILIŞ TEYİT ÜÇLÜSÜ MÜHÜRLENDİ:** (a) izometri-kaynak ✓ — alistirma=YOK + yuzey=asit →
  `deger_kaynagi='izometri'` + format_id=e1fb879d DOLU (üç dal tamam); (b) **OPR TERFİ ✓ —
  f borcu KAPANDI:** satır spool_malzemeleri'ne indi (boy/ağırlık/malzeme/miktar doğru;
  adet=null boru için TASARIM). Nüans: kalite='paslanmaz' regresyon DEĞİL — operatör kalite
  GİRMEDİĞİ için fallback; dz.kalite tercihi canlıda nötr kaldı (164'ün 6/6 testiyle kanıtlı
  sayıldı); (c) G2a kart ✓ — eşik (3+) doğru; bugünkü 1'er izometri sinyali dal doğurmadı
  (NORMAL), NULL kova 7 kart doğru metinle duruyor.
- **YENİ BORÇLAR (MK-165.7):** OPR "dn" alanı → dis_cap'e OD sanılıyor (DN200→200.0, doğrusu
  219.1; fakir boyutParse) · devre_detay taslak görünümünden wizard'a "düzenle" köprüsü yok
  (MK-136 URL'i görünmez) · uyarı mükerrerliği (aynı uyarı 2-3 dk arayla çift).
- **DÜŞÜK ÖNCELİK:** M130-817-006 eski et uyarısı (2.77↔3.91) duruyor — drenaj kapsamı
  dışıydı; doğal parse'ta düzelir ya da sha+reset reçetesi.
- W-2.15 onay kuşağı (162 kayıt) ERİTİLMEDİ → 166 adayı. Y200 öğretimi bekliyor (diğer
  bilgisayar). W-2.19 tam dilim tasarımı duruyor.

---

## 166 İŞARETLERİ (2026-06-08) — DÜZEN TURU (sayfa düzeni + okunan-değer fidelity; format öğretimi atlandı)
> Tema: wizard/devre_detay sayfa düzenini tutarlılaştırma + "okundu ama yüzeye çıkmadı" hissini bitirme.
> izometri-oku DOKUNULMADI · 12/12 (yeni endpoint yok) · migration YOK.

- **W-2.1 KAPANDI:** tersane/proje çift yönlü senkron (yukarıda işaretlendi).
- **MK-165.7/2 KAPANDI — taslak→wizard köprüsü:** devre_detay ?taslak=1 kipinde aktif-devre
  aksiyon butonları (Düzenle/Etiketler/Aktar/Durdur/KK/Sevkiyat + spool listesi yazma butonları)
  GİZLENDİ (kilitli-görünür "bozuk" hissi bitti); tek aksiyon = "✏️ Wizard'da düzenle & onayla"
  (?devre_id=, MK-136). Ters köprü: Adım 2'ye "👁 Önizle" (devre_detay ?taslak=1 yeni sekme).
  İki kapı bağlandı; rol netleşti = taslak önizleme SALT kontrol penceresi. 3 dil anahtarı eklendi.
- **K2-A GEMİDE — terfide öneri kapanışı:** onayEt backfill başarılıysa o devrenin TEMİZ izometri
  önerilerini (`_eslesme.atanmamis>0 DEĞİL`) otomatik `tamamlandi` yapar; atanmamışlı + manuel_onay
  AÇIK kalır (B-6); backfill hatalıysa hiçbirine dokunmaz. devre_detay Onay Kuyruğu sekmesi aktif
  devrede rozet=0 ise GİZLİ (taslakta hep görünür). Wizard artığı görünümü bitti; onay kuşağı
  birikiminin büyüme kaynağı kurudu.
- **Adım 1 yedek alanları:** malzeme/yüzey/alıştırma — DOKÜMAN ÖNCELİKLİ (BOM/PDF ezer), yalnız
  dokümanda bulunamayan spool'a iner (okunamayan PDF/manuel Excel güvenlik ağı). aktar'a opsiyonel
  `malzemeVarsayilan`/`alistirmaVarsayilan` (yuzey param zaten vardı; devre_detay göndermez → 0
  regresyon). Adım 1 yardım metni artık doğru (eski "opsiyonel" yalanı düzeldi).
- **← Geri butonu** (Adım 1 başlık) — taslağı silmeden devrelere döner.
- **devreler +N rozeti DÜZELDİ:** malzeme/yüzey "⚠ +N" artık çoğunluk dışı SPOOL ADEDİ değil farklı
  TÜR SAYISI (galvaniz+11 siyah → +1; galvaniz+siyah+asit → +2). Spool adedi tooltip'e taşındı.
- **YÜKLE AKIŞI YENİDEN (W-2.5/2.9'a kısmi cevap):** Adım 1'de iki buton (İncele/Beklemeye Al)
  yerine TEK "⬆ Yükle". Dosyalar PARALEL HAVUZla (6 eşzamanlı) yüklenir (356 dosya sıralı yarım
  saat yerine dakikalar). Bitince KARAR EKRANI: ➕ Yeni Devre Yükle (sıfırdan) · 🔍 İncele & Onayla ·
  📋 İşlenenler'e Git. izometri SIRAYA alınır, BURADA İŞLENMEZ (istemci drenajı gerçeği — MK-166.1).
  Küçük devrede uyarısız; her ekranda çıkış yolu görünür, seçim tek yönlü değil.
- **W-2.19 TAM DİLİM GEMİDE (kalem-zoom — Cihat fikri):** düzelt modalında ✏️'ye basınca alanın
  DEĞERİ pdf.js metin katmanında aranır → zoom + sarı vurgu. Konum tarayıcı uzayında (B1 uyumlu),
  motor/izometri-oku'ya dokunmaz, format öğretimi gerektirmez. SATIR GRUPLAMA (MK-166.2): Cadmatic
  parçalı metnini ("Pas"+"lanmaz") boşluklu+boşluksuz satırda yakalar; tek-item araması yetmiyordu.
  Görünürlük toast'ı ("🔍 'x' — 1/N"), çoklu eşleşme gezinme (aynı ✏️ → sonraki). 🔍 Tablo norm
  bbox yoksa "Malzeme Listesi" başlık-arama fallback'i (Y200 öğretiminde hassas bbox'a terfi eder).
- **Excel hücre-git:** Excel sekmesi açıkken ✏️ → değer hücrede aranır (aktif sayfa DOM + diğer
  sayfalar workbook taraması, sayfa-geçişli), hücre seçilir+ortalanır+hücre çubuğu dolar. PDF
  tarafıyla simetrik sözleşme. (🔍 Tablo istisna: pdfZorla — PDF bölgesi demektir.)
- **OKUNAN-DEĞER YÜZEYE (Cihat A/B/C — "okunmamış hissi"ni bitirdi):**
  - **A (görünüm):** devre-inceleme — kabuk çap/et boşsa (fitting-ağırlıklı spool'da düz boru yok →
    kabuk türetemez, MK-166.3) izometri parse dalından gösterilir; terfide backfill aynı değeri yazar.
  - **B (terfi+görünüm):** grupla baskın kalem KALİTESİNİ türetir (`anaKalite`, 316L), spool çıktısına
    `kalite` ekler (izo-eslesme passthrough); aktar zinciri dz.kalite > kalem kalitesi > anaMalzeme →
    **terfide spool kalite'sine 316L yazılır.**
  - **C (genelleme — MK-166.4):** yüzey alanı stainless okuyorsa (paslanmaz/316/304/...) → `asit`
    (paslanmaz yüzey işlemi asitlemedir); yuzeyKod + yuzeyBadge normalize → tabloda da "Asit".

### 166 — değişen dosyalar
devre_wizard_v3.html (çok dalga) · devreler.html · devre_detay.html · ares-kabuk.js · ares-normalize.js ·
lib/izo-eslesme.js · api/devre-inceleme.js · lang/{tr,en,ar}.json. **TARAYICIDA yüklü → sert yenile
(MK-161.1): ares-kabuk.js, ares-normalize.js.** Bookend commit'ler: `d5b8c9e` (ilk — wizard düzen
paketi) → `595c435` (son — okunan değer A/B/C). Aradakiler topic bazlı (+N rozet · kalem-zoom v1/v2 ·
taslak rol+köprü · excel hücre-git · yükle/paralel/karar ekranı) — açılışta `git log --oneline` ile sırala.

### 166 — AÇIK KALANLAR / 167 ADAYLARI
- **CRON / sayfa-kapalı izometri işleme (167 ANA TASARIM — MK-166.1):** izometri parse İSTEMCİ
  drenajı (sunucu worker'ı yok). Çözüm: `kuyruk-isle.js` (mevcut cron+self-chain worker) `is_kuyrugu`
  yanına `dosya_isleme_kuyrugu` izometri dalı eklesin (YENİ ENDPOINT YOK — 12/12 koru) + atomik claim
  guard (cron↔tarayıcı çift-işleme önlenir) + frekans kararı (Hobby gece-1 / Pro dakika / dış
  zamanlayıcı). Pro ŞART DEĞİL — self-chain Hobby'de de yürür; Pro frekansı+timeout'u açar.
- **MK-165.7/1 OPR dn→dis_cap kabuk düzeltmesi** (DN200→200.0, doğrusu 219.1; olcuParse+dnBul) — AÇIK.
- **MK-165.7/3 uyarı mükerrerliği** (aynı uyarı 2-3 dk arayla çift) — AÇIK.
- **W-2.5** tam değil (yükleme çubuğu netleşti ama "iki ayrı çubuk: yükleme+işleme" değil) ·
  **W-2.9** eşzamanlı paralel devre değil (karar ekranı SERİ yüklemeyi akıttı).
- **Onay kuşağı eritme** (162 kayıt; P26-217=76) — AÇIK · **Y200 öğretimi** (diğer bilgisayar) — AÇIK.
- **W-2.19 hassas bbox hali** Y200 tablo öğretiminde gelir (kalem-zoom değer-arama şimdi çalışıyor).
- **KARARLAR.md'ye MK-166.1..6 işlenmeli** (kök dosya — bu pakette DEĞİL, ayrı append).
- **Küçükler:** kalem-zoom yanlış-yere-gitme aday-listesi inceltmesi · karar ekranı küçük-devre canlı doğrulama.
- **MK-85.3 öz-ihlal notu:** spooller kolon adı tahmin edildi (cap_mm yanlış; doğrusu dis_cap_mm /
  et_kalinligi_mm). Şema-önce istisnasız.

---

## 167 İŞARETLERİ (2026-06-08) — CRON / SAYFA-KAPALI İZOMETRİ İŞLEME UYGULANDI

> 166'nın "ANA TASARIM" olarak işaretlediği madde (MK-166.1) bu oturumda **uçtan uca kuruldu**.
> Tema yalnız buydu (format öğretimi yine atlandı). 12/12 korundu, migration yok, izometri-oku dokunulmadı.

- [x] **W-1.x CRON izometri drenajı GEMİDE (MK-167.3):** `kuyruk-isle.js` (mevcut cron+self-chain
  worker) `is_kuyrugu` (PDF) yolundan SONRA, KALAN zaman bütçesiyle `dosya_isleme_kuyrugu`/izometri'yi
  sürer. Yeni mantık YOK — `kuyruk-isle-izometri.js`'in zaten export ettiği kanıtlı `drenajTuru`
  çağrılır (MK-112.1 iç-döngü). YENİ ENDPOINT YOK (import lib-içi; 12/12 korundu). Bütçe: 60s
  maxDuration − geçen süre − 8s pay; `maxMs` tavanı 50s = tarayıcı drenajıyla AYNI (cron tarayıcıdan
  agresif değil). Hem erken-return (is_kuyrugu boş) hem ana-return yoluna kondu; **yalnız `batch_id`
  YOK iken** (global) çalışır → tarayıcı PDF batch çağrısı (batch_id'li) dokunulmaz.
- [x] **Atomik claim guard GEMİDE (MK-167.1):** `birIsIsle` lock'u artık
  `UPDATE ... .eq('id').in('durum',['bekliyor','hata']).select('id')`. Satır dönerse iş bizim; boş
  dönerse başka worker (cron↔hâlâ açık tarayıcı drenajı) kapmış → `sonuc:'atlandi'`, sessiz geç.
  Çift `izometri-oku` çağrısı (çift batch + çift maliyet) önlendi. `'hata'` dahil: wizard manuel-retry
  (is_id modu) korunur.
- [x] **CRON_SECRET gate GEMİDE (MK-167.2):** `/api/kuyruk-isle` global yol (batch_id YOK) için Bearer
  CRON_SECRET ZORUNLU (sert mod — env yoksa 500, yanlış/eksik token 401). batch_id'li çağrı (tek
  frontend çağrısı: `izometri-batch.html:514`, body'de batch_id var — grep'le doğrulandı) AÇIK →
  0 regresyon. Vercel gece cron + GitHub Actions aynı secret'ı gönderir.
- [x] **Dış tetik GEMİDE:** `.github/workflows/izometri-cron.yml` (`*/3` + workflow_dispatch + concurrency).
  POST `/api/kuyruk-isle` `{}` + Bearer secret. GitHub pratikte 5-10 dk oturabilir — saniye hassasiyeti
  DEĞİL, sayfa-kapalı backlog eritici. Acil tek devre zaten tarayıcı butonuyla anlık işlenir.
- **Yedek:** `vercel.json` gece cron (03:00, `/api/kuyruk-isle`) DEĞİŞMEDİ — GitHub Actions bozulursa
  gece yine süpürür (artık izometri dalı da çalışır).

### 167 — kanıt (mekanizma)
- secret'sız `curl POST /api/kuyruk-isle {}` → **401** (gate çalışıyor).
- secret'lı → **200** + `{"ok":true,...,"izometri":{"calisti":true,"islenen":0,"kalan_var":false}}`
  (dal çalıştı; kuyrukta `bekliyor` izometri = 0 olduğu için 0 işledi — beklenen).
- Kuyruk anlık görüntü (167): izometri iptal=1336 · manuel_onay=70 · oneri_hazir=400 · tamamlandi=183 ·
  **bekliyor=0**. excel-generic: iptal=65/oneri=14/tamam=62. sakla=376. → uçtan uca doğal-yol testi:
  bir izometri PDF sıraya alınıp sayfa kapatıldıktan sonra cron'un işlediği SQL'le doğrulanacak (KULLANICI).

### 167 — değişen dosyalar
api/kuyruk-isle.js (import + CRON_SECRET + gate + helper izoDrenajCalistir + 2 return) ·
api/kuyruk-isle-izometri.js (claim guard) · .github/workflows/izometri-cron.yml (YENİ — web'den eklendi).
Commit: `0e7108d` (kod, feat 167). Workflow GitHub web'den (PAT'ta `workflow` scope yok → push reddi →
`git reset --soft HEAD~1` ile kod ayrıldı, workflow web arayüzünden). **168 açılışı: lokal diskte
izometri-cron.yml var ama uzağa web'den eklendi → `git pull --rebase` ile senkronla.**

### 167 — AÇIK KALANLAR / 168 ADAYLARI
- **Uçtan uca doğal-yol testi** (KULLANICI yürütüyor): PDF yükle → sayfa kapat → */3 turu → SQL teyit.
- **KARARLAR.md'ye işlenecek (kök dosya — pakette DEĞİL):** MK-166.1..6 + MK-85.3 (166 borcu) +
  **MK-167.1/2/3** (bu oturum).
- Devreden (değişmedi): MK-165.7/1 OPR dn→dis_cap (DN200→200.0 vs 219.1) · MK-165.7/3 uyarı mükerrerliği ·
  onay kuşağı eritme (GÜNCEL: oneri_hazir=400 + manuel_onay=70) · Y200 öğretimi (diğer bilgisayar) ·
  W-2.5 (iki ayrı çubuk) · W-2.9 (eşzamanlı paralel devre) · W-2.19 hassas bbox (Y200 tablo öğretiminde).


---

## 169 — CIKIS KAPILARI + ELLE ESLESTIRME (canli kanitli)

> Cihat tespiti: operator "eslesmedi/eksik" duvarinda tikaniyor, cikis yok. Iptal edip basa donse
> ayni hatayi aliyor -> gelistiriciye ulasmasi gerekiyor. Bu, B-2 + B-6'nin pratikteki bosllugu.

- [x] **A acigi — operator artik tikanmiyor (canli).** devre_wizard_v3 inceleme:
  - Teshis bandi: kabuk=0 / fazla>0 / eksik>0 durumunu okur, dogru yonlendirir (Excel=dayanak mesaji).
  - Sert onay kapisi: eslesmemis/eksik varken "Onayla" sessiz gecmez (onay kutusu sarti); kabuk=0'da engel.
  - K3 cikis: "Excel'i kontrol et / Iptal" -> _taslakIptalEt -> taze wizard (ayni duvara carpmaz).
  - Commit 1960fca.
- [x] **A1 — K2 elle eslestirme UI (canli).** Fazla PDF (S46_1) "🔗 Eslestir" -> popup, ayni pipeline'in
  eksik Excel spool'lari (S46), "Bagla". Overlay taslak_duzeltmeleri (alan='_pdf_spool_map'). Excel sayisi
  DEGISMEZ, yeni spool YOK. Commit 5f19c6e.
- [x] **A2 — terfide gercek bag (canli).** eslestir() overlay'i okur, S46_1->S46 map'ler, PDF verisini
  hedef spool'a bindirir, cizim_durumu eksik->kismi. Terfi SQL kaniti (2f88d92e). Commit 09ae6ca.

### Cihat kurali (169 — kalici)
Excel = guvenlik dayanagi. Excel'de N spool varsa PDF'ten N!= yuklenmez; sistem Excel'i ASLA delmez.
Eslesmeyen PDF -> ya yanlis yazim (elle eslestir) ya Excel eksik (insana yonlendir). Sayi farkinda
otomatik ekleme YOK. `_1`-eki cozumu DAR (devre-bazli overlay); global normSpoolNo'ya DOKUNULMADI.

### 169 — acik (170 adaylari)
- Modal yanlis sayi (KUCUK): onayAc eslestirme overlay'ini okumuyor, "12 eslesemedi" gosteriyor
  (terfi mantigi dogru, sadece sayi). Cozum: onayAc'ta WIZ._pdfMap'i fazladan dus.
- spool_detay PDF gorunmuyor (TESHIS EDILMEDI): terfi sonrasi spool_detay'da PDF yok. Once kaynak bul.
- kismi/bekliyor karisik: elle eslestirilen 12 hedeften bazi kismi bazi bekliyor — dogrula.
- B-6 (sessiz kayip yok): fazla/eslesmeyen artik gorunur + eslestirilebilir; modal sayisi henuz tam degil.
