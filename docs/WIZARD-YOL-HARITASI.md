# WIZARD YOL HARİTASI — Devre Yüklemesi Uçtan Uca (son güncelleme: oturum 156)

> Amaç: Yazılımcı olmayan bir operatör, elindeki klasörü wizard'a bıraksın; sistem kabuğu kursun,
> belgeleri arka planda işlesin, tanımadığı formatı operatöre kolayca öğretsin, operatör taslağı
> gerçek devre detay görünümünde kontrol edip onaylasın → devre aktif listeye geçsin.
> Format öğretme ÇİFT TARAFLI: hem wizard hem izometri batch sayfasından aynı akışa girilir.
>
> İşaretleme: `[x]` bitti · `[~]` kısmen · `[ ]` açık. Madde kodları (W-xx) oturumlarda referans için.

---

## BAŞARI TANIMI (hepsi sağlanınca "sorunsuz yükleme" diyeceğiz)

- [ ] B-1 Operatör klasörü sürükler, bilgi-amaçlı klasörleri (revizyon öncesi vb.) baştan dışlar.
- [ ] B-2 Excel kabuk + PDF eşleştirme arka planda kendi kendine yürür; operatör beklemez, butona basmaz.
- [ ] B-3 Tanınmayan format = kırmızı satır + "Formatı tanıt" butonu; öğretilen kural kalıcı kaydedilir, aynı aile bir daha AI'a gitmez.
- [~] B-4 Taslak gerçek devre detay görünümünde kontrol EDİLEBİLİYOR; köprü TAMAM (156: İşlenenler→Önizle, df11ac1) ama MK-156.1: önizleme spooller'dan render eder, taslak spooller'a yazmaz (MK-127.4) → BOŞ GÖVDE. Kalan: W-2.14 taslak veri katmanı + onay akışıyla bağ.
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
- [ ] W-2.1 Adım 1: tersane ve proje AYRI seçim alanları (aynı kutuda değil).
- [ ] W-2.2 "Mevcut devre / yeni devre" ayrımı kalkar. Mevcut devreye ekleme = devre detay "Spool ekle" → wizard'ın devre kipi (?devre_id=); onay sonrası devre detaya dönüş.
- [ ] W-2.3 Klasör ağacı: sürükle-bırakta Windows gezgini görünümü (mockup v5, MK-97.6). Klasör/dosya bazında dahil/hariç işareti.
- [ ] W-2.4 "Bilgi amaçlı" klasör/belge dışlama: revizyon-öncesi klasörler VE tablosuz çizimler (.SXX'siz) işlemeye GİRMEZ. (Hariç tutulanlar kayıtta görünür kalır, sessiz silinmez.) 156 KANITI: NB1124'te 22 tablosuz çizim L3'e gitti, manuel_onay'ı şişirdi, para yaktı — ARTIK ERTELENEMEZ, Tur 1 kapsamında (157).
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
- [ ] W-2.14 (156, MK-156.1) Taslak önizleme VERİ katmanı: ?taslak=1 kipinde spooller yerine taslak
      katmanı (ARES_KABUK.grupla modeli + kuyruk önerileri) render edilmeli — taslak spooller'a
      yazmaz (MK-127.4), mevcut önizleme boş gövde. Gerilim: 155'in "render'a sıfır dokunuş"
      disiplini ↔ veri kaynağı değişimi; tasarım kararı 157.
- [ ] W-2.15 (156 kararları) ONAY KUYRUĞU sekmesi — devre_detay'a (MK-156.2: yük AKTİF devrelerde,
      953 işin tamamı; İşlenenler taslak yüzü). Tek liste iki davranış: oneri_hazir yeşil/TOPLU
      (yalnız devre kapsamı, kritik uyarılı satır girmez) · manuel_onay amber/TEKİL (içerik
      parse_sonuc.spoollar[].uyarilar: kod+mesaj+agirlik — hazır JSONB, yeni veri üretimi YOK) ·
      atanmamis ayrı alt grup ("eşleştir"). devreler.html'e bekleyen-onay rozeti. ÖNKOŞUL
      read-before-write (157): oneri_hazir "onayla" tüketicisi kodda var mı? Test yatağı hazır:
      g200 + 265-overboard + hhbjşlö (327 iş).

## FAZ 3 — FORMAT TANIMA ÇİFT TARAFLI + SON KULLANICI KOLAYLIĞI

> İlke: format öğretme ayrı bir "yazılımcı seansı" değil, akışın içinde tek tıkla girilen bir adım.
> Giriş noktaları hazır: format_tanit ?format_id=&alan= + picker (149).

- [ ] W-3.1 Wizard inceleme: zayıf/çelişkili/L3/tanınmadı rozetli satıra "Formatı düzelt / tanıt" butonu → format_tanit.
- [ ] W-3.2 İzometri batch sayfası: aynı buton/köprü (tanınmadı satırı → format_tanit). İki taraf AYNI çekirdeği kullanır, kopya akış yok.
- [ ] W-3.3 L2-fail davranış seçimi devre düzeyinde: "AI'a gitsin (L3)" / "AI kapalı — tanınmayanı bana göster". Kapalıyken dosya sessiz kaybolmaz, "tanınmadı → formatı tanıt" satırı olur. (Muhtemel küçük migration — MK-98.2 dry-run.)
- [ ] W-3.4 Öğretilen kural kaydedilince: aynı devredeki kardeş dosyalar otomatik yeniden işlenir (kuyruğa geri) — operatör tek PDF öğretir, gerisi kendiliğinden okunur.
- [ ] W-3.5 Son kullanıcı dili sadeleştirme: format_tanit metinleri operatör diliyle (B1 "okuma yerini düzelt" ↔ B2 "değeri düzelt" ayrımı ekranda anlaşılır); et_mm "runtime'da ASME'den dolar" mesajı; kaydet modal otomatik kapanış + toast.
- [ ] W-3.6 format_kodu otomatik öneri (operatöre sistematik kod sorulmaz, sistem önerir).
- [ ] W-3.7 Windows render sorunu: pilot operatörleri Windows'ta — format_tanit PDF görüntüsü Windows'ta düzgün olmadan "son kullanıcı kolay" hedefi sağlanamaz.
- [ ] W-3.8 Band-B glyph tablosu (~20 karakter): NB1137 spool ailesi L3'ten L2'ye iner ($0).
- [ ] W-3.9 (153 bulgu) format_tanit TURETILEN_ALANLAR panzehiri: cap_mm/et_mm/dn için kayıtlı (eski/çöp) regex olsa bile _alanlariKos KOŞMAZ, patch YAZMAZ, çip 🧮 türetilmişe zorlanır. (Çöp regex'in ekrana kırmızı, üretime 2358 bastığı kanıtlandı; veri onarıldı ama kod kapısı açık.)
- [ ] W-3.10 (156, MK-156.3) Pipeline KİMLİK çıkarımı ("Madde 0"): kapsama = KİMLİK + SATIR +
      BELGE SINIFI üç katman. Kalıplar: zone'suz <NPS>x<NPS> ("10Ax6A 1(2).S01.1.pdf") · " 1(2)"
      sayfa segmenti · 4-segment (M110-262-803-537, 2 kanıt) · zone-harf eki (355C/332A) ·
      Continue+sayfa eki · DOSYA ADI OTORİTE (başlık kesilebilir, v3). 156 kanıtı: NB1124'te
      20/22 spool PDF'i kimlik çıkarımı dışı → kabukta_yok. ÖNKOŞUL: çıkarımın adresi
      read-before-write (MK-155.1 satır içindi — bu FARKLI mekanizma olabilir). Aynı gemide
      zone'lu+zone'suz yan yana yaşar (v4 — "gemi başına tek adlandırma" varsayımı öldü).

## FAZ 4 — VERİ SAĞLIĞI VE PROPAGASYON

- [ ] W-4.1 Propagasyon: eslestirme-backfill ile eski L3 / yanlış-format aile yeniden parse (alias deseni: dok_id:devre_dokuman_id).
- [ ] W-4.2 pipeline_no E120- prefix normalizasyonu (wizard eşleştirme/mutabakat fazında; 289 montaj kaydını yeniden parse ETMEK çözüm değil).
- [ ] W-4.3 Dirsek 323.9 ağırlık normalizasyonu (PDF toplam ↔ Excel birim; l2-parser tarafı, K2 bug'ı değil).
- [ ] W-4.4 bbox → PDF-point normalize (konum_ipucu).
- [ ] W-4.5 K1+K3 bulgularının uyarilar.html + wizard inceleme ekranında yüzeye çıkması (K2 deseniyle).
- [x] W-4.6 KAPANDI (154): vercel.json'a ares-izometri-drenaj.js no-cache başlığı eklendi (1e89804).
- [x] W-4.7 CEVAPLANDI (154): 3 IFS xlsm 'bekliyor' YETİMMİŞ (sahipleri taslak/silinmiş devre) — excel hattı tetiksiz değildi; W-2.13 onarımıyla kapandı, bekliyor=0.

## FAZ 5 — UÇTAN UCA CANLI KANIT (MK-132.1: canlı test olmadan kapanmaz)

- [ ] W-5.1 Gerçek bir devre klasörüyle tam tur: sürükle → dışlama → kabuk → arka plan işleme → 1 tanınmayan format öğret → kardeşler otomatik okunur → taslak önizleme → İşlenenler → aktif devreler.
- [ ] W-5.2 Aynı turda ölçüm: AI çağrı sayısı / L2 oranı / toplam maliyet (ai_api_log) — hedef yönü: AI payı %5-10'a.
- [ ] W-5.3 Mevcut devreye ekleme turu: Spool ekle → Eklenenleri işle → onay → devre detaya dönüş.

---

## SIRA ÖNERİSİ (Claude)

1. **FAZ 1** (W-1.1→1.6): "neden biz basıyoruz" + MK-117 + tahliye + Y100 kanıtı. Diğer her şeyin altyapısı.
2. **W-2.11 kararı + W-2.6/2.7** (durum makinesi + İşlenenler sekmesi): akışın omurgası; UI maddeleri (W-2.1, 2.5, 2.8) bunun üstüne ucuz.
3. **W-2.3/2.4** (klasör ağacı + dışlama): eşleşme kirliliğini kökten keser.
4. **FAZ 3** (çift taraflı tanıtma + L3 anahtarı + sadeleştirme).
5. **FAZ 4 → FAZ 5** kanıt turu.

## AÇIK KARARLAR (Cihat)

- ~~K-1~~ CEVAPLANDI (154): W-2.11 = A (devre_detay ?taslak=1 kipi). Uygulama 155.
- K-2: W-3.3 L3 anahtarının varsayılanı ne olsun? (Öneri: pilot döneminde AÇIK; format kütüphanesi olgunlaşınca devre bazında kapatılır.)
- K-3: W-1.1 cron zinciri Hobby tek-cron hakkıyla mı, yoksa İşlenenler sekmesi client-loop'u yeterli mi? (Öneri: ikisi birden — sekme anlık, cron emniyet ağı.)
