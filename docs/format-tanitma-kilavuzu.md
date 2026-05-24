# Format Tanitma Kilavuzu — AresPipe Izometri Parser

> **Surum:** Oturum 118 (24 May 2026). 116'daki "format-tanitma-arayuzu-vizyon.md" notunun
> kapsamli halefi.
> **Durum:** MIMARI KARAR + GERCEK VERI ile dogrulanmis tasarim. Kod henuz yok; icraat sonraki oturum.
> **Veri tabani:** 15 Tersan PDF (6 gemi) + 4 capraz kaynak PDF (Sefine, Yonteknik, Royal, ada/PAOR)
> + 4 ekran goruntusu (SEFT, Navis/Kongsberg, Salt, Cadmatic-Sefine) -> 5 metinli format ailesi + 1 image.

---

## 1. Problem

Yeni bir izometri formati geldiginde (farkli tersane, farkli tasarim ofisi, alanlarin yeri/adi farkli),
su an format ELLE tanitiliyor: icerik imzasi olcum, parser_kural (alan regex'leri), eslesme anahtari,
lokal repro ile bug avi. Bu muhendislik isi — 1 oturum suruyor.

116'da eklenen kritik soru, 118'de derinlesti: **kurallari tek formata gore yaziyoruz; oysa bazi
kurallar o gemiye, bazilari o ofise, bazilari evrensel.** Tek monolit kural seti kirilgan.

### Somut kanit (kirilma)
NB1110 projelerinden cikarilan format kurallari, NB1137 yuklenince kirildi. Sebep (Bolum 5):
gemiye ozel sanilan bir desen, aslinda cok-dar yazilmis bir aile-seviyesi kuraliydi.

---

## 2. Yanlis yaklasim (yapma) — 116'dan korunur

**Tam otomatik format tanima:** Kullanici PDF yukler, sistem AI ile parser_kural'i otomatik uretir.
-> RISKLI. AI-agir (maliyet, halusinasyon), rule-based/deterministik tercihle celisir, regex otomatik
uretimi kirilgan. ELLE/GORSEL tanitim cok daha guvenilir.

**118 eki:** Asagidaki "kismi tanima" ve "gorsel isaretleme" davranislari bu kurali IHLAL ETMEZ.
On-doldurma, AI'nin regex uydurmasi degil; zaten dogrulanmis deterministik kurallarin bagimsizca
eslesmesidir (L1/L2, sifir AI). Kullanici da kural yazmaz; yalnizca DOGRULAR ya da GOSTERIR.

---

## 3. Cekirdek model — Seselici tabanli katmanli kural paketleri

Eski model: bir format = tek monolit satir (parser_kural + fingerprint). Yeni model:

**Kurallar tek bir formata degil, SESELICILERE (selector) bagli kural paketlerine dagilir.**
Her PDF bir PARMAK IZI (facet seti) tasir. Bir PDF parse edilirken, seselicisi kendi etiketlerine
uyan TUM paketler birlesir; cakismada en ozel (en ust katman) kazanir.

Profesyonel karsiliklari:
- **CSS class kompozisyonu** — bir element birden cok class tasir, kurallar birlesir (agac degil).
- **Kubernetes label & selector** — kaynak bir etiket seti tasir, politikalar kombinasyonu hedefler.
- **AWS IDP "system defaults + override-only"** — taban katman miras alinir, sadece fark yazilir.

### Neden agac (filesystem) DEGIL
"Tersane klasoru > gemi klasoru > kurallar" gibi tekli kalitim YANLIS. Cunku (Bolum 5'te veriyle):
ayni gemide iki format, ayni tersanede uc format, farkli kaynaklarda ayni format olabilir. Format
kimligi tersane->gemi ekseninde temiz parcalanmaz; cok-boyutlu/kompozisyon gerekir.

---

## 4. Katmanlar

Asagidan yukariya, en genelden en ozele. Cakismada ust (ozel) kazanir.

| # | Katman | Ne icerir | Seselici |
|---|--------|-----------|----------|
| 0 | **Evrensel** | "kaynatilmayacak -> alistirma", NPS<->DN, malzeme sozlugu, halusinasyon korumalari | yok (herkese uyar) |
| 1 | **Format ailesi** (tasarim ofisi sablonu, surume bagli) | cizim iskeleti, bolum capalari (materyal listesi / cut anahtari), montaj/imalat ayrimi, continue sozdizimi, dil, standart ailesi (DIN/EN/ASME) | **yapisal parmak izi** (baslik token seti) — ofis/CAD/surum yalnizca ipucu |
| 2 | **Malzeme grubu** (CAPRAZ) | boyut/cap/et bicimi: karbon=metrik ODxWT, paslanmaz=inc+Sch | malzeme/kalite tokeni (316L, St.St, Galv) |
| 3 | **Sistem / gemi** | pipeline_no onek varyantlari, devre-spesifik incelikler | gemi/sistem etiketi |
| 4 | **Baglam** | bazi formatlarda PDF govdesinde olmayan alanlar (Tersan'da proje_kodu) | klasor/yukleme baglami |

> **MK-118.1 — Seselici yapisal parmak izidir; Producer metadata DEGIL.** Producer/Creator metadata
> sadece zayif ipucudur (Bolum 5 kanit: Yonteknik metadata'yi siler; Sefine'de ayni Cadmatic farkli sablon).
>
> **MK-118.4 (DUZELTILDI) — Tasarim ofisi formatin EN GUCLU YORDAYICISIDIR (predictor), KIMLIGI DEGIL.**
> Ofis facet'i seselici aday havuzunu daraltir ama tek basina garanti vermez: ayni ofis zamanla yazilim
> surumunu/sablonunu degistirebilir. Format KIMLIGI yine yapisal parmak izinde durur (o, surum degisse de
> neyin degistigini fiilen gorur). Kanit (Bolum 5.3): SEFINE 3 ofisle 3 format; SEFT tek format. Yani
> ayni tersane != ayni format; ayni ofis ~= ayni format (kesin degil). [Eski "ayni ofis = ayni format"
> ifadesi cok katiydi; MK-118.1 ile celisiyordu — duzeltildi.]
>
> **MK-118.5 — Surum de bir facet'tir; surum kaymasi = kismi tanima yolu.** Aile "SEFT" degil "SEFT@surum-X".
> Ofis yeni surume gecince PDF eski paketin cogu kuralina uyar (yuksek guven), birkac alan kayar (orta,
> isaretli), bir-iki alan uymaz (insana sor). Sistem cokmez; tanidigini doldurur, kayani sorar; insanin
> duzeltmesi yeni surum icin ince bir override paketi dogurur. Format kendini surum surum gunceller.

---

## 5. Gercek veri bulgulari (118 — capraz dogrulanmis)

### 5.1 Tersan paketi (15 PDF, 6 gemi: nb1110/1124/1130/1135/1136/1137)

**Sabit (Format ailesi / Tersan-Cadmatic sablonu):**
- Cizim iskeleti: "Drawing symbols / SPOOL NAME / PART NUMBER / WELDING NUMBER / CUT NUMBER" — 15/15 ayni.
- Imalat (spool, .S01): "Cut & Bending Info" + "Malzeme Listesi" var. Montaj (izometri, .1): yok,
  yerine "Continue:" baglantilari. -> montaj/imalat ayrimi (116 Q1) burada.
- Malzeme sozlugu (TR): "Boru Dikissiz Celik", "Flans Duz Celik PN16", "Manson", "Dirsek Dikissiz
  1.5D", "Ic/Dis Bilezik Detay A", "Reduser Konsantrik", "Paslanmaz Alin Kaynagi - Saha" — tum
  gemilerde ayni. -> Evrensel (TR sozluk) adayi.
- NOT alani yeri + hemen ardindan toplam "kg" — 15/15 sabit konum.

**Kirilan (yanlis katmanlanmis):**
- pipeline_no oneki. Gozlemlenen: M100, AT110, G600, Y110, G400, E100 (+ continue'larda M110, M120, Y100).
  Eski regex `-(G\d+-...)` G varsaydi -> G disi her sey kirildi. DUZELTME: `[A-Z]{1,3}\d{2,3}-...`,
  ve bu Katman 1'de (aile) durmali — gemi override'inda DEGIL. (Kirilma, katmani yanlis sectigimiz icindi.)

**Capraz facet — malzeme grubu (en onemli bulgu):**
- Karbon/Galv (nb1110/1124/1130/1135 + nb1137'nin AT110-Galv parcasi): boyut metrik `ODxWT`
  (168.3x4.5, 60.3x6.3, 219.1x6.3).
- Paslanmaz 316L (nb1136 G400-St.St, nb1137 E100-St.St): boyut emperyal inc+Sch (1-1/2" Sch 10S, 2" Sch 10S).
- **NB1137 ICINDE IKISI DE VAR** (E100-St.St emperyal, AT110-Galv metrik). -> "Ayni gemide iki format"
  birebir kanit. Ayrimi yapan gemi degil, MALZEME GRUBU; gemiler arasindan geciyor (1136 ve 1137 paslanmazi paylasiyor).

**NOT alani icerigi (evrensel ayrim):**
- nb1110: "NOT: Alistirma Parcasidir (Kaynatma!!)" -> alistirma=VAR sinyali (MK-117.1 ile uyumlu).
- nb1124-804: "NOT: Ici Galvaniz Disi Siyah Olacak!" -> yuzey/imalat talimati (imalat_not).
- Cogu: "NOT: ," -> bos.
- Sonuc: NOT'un YERI/bicimi Katman 1 (sabit); ICERIGININ YORUMU Katman 0 (evrensel).

**Devreler sistem siniri asiyor:** E100 cizimi "Continue: M110-817-005" ve "Continue: Y100-817-005";
AT110 cizimi "Continue: M120-816-026". pipeline_no asla tek-onek varsayamaz.

**Proje kodu:** Tersan cizim govdesinde YOK (15/15 grep "yok"). -> Katman 4 (baglam/klasor) alani.

### 5.2 Capraz kaynaklar (4 PDF)

| Kaynak | Producer metadata | Iskelet | Sayfa | Aile |
|--------|-------------------|---------|-------|------|
| **Tersan** | Cadmatic ("Piping Isometrics & Spools") | Drawing symbols / SPOOL NAME / Cut & Bending / Malzeme Listesi (TR) | 1 | A1 |
| **Yonteknik** | iLovePDF (orijinal silik) | Drawing symbols / SPOOL NAME / WELDING NUMBER / Continue: — **Tersan ile AYNI** | 11 | A1 (ayni aile!) |
| **Sefine** | Cadmatic | ZONE: / Part Number / Cut Number (EN, zone-tabanli) | 7 | A2 |
| **Royal** | Ghostscript / PScript5 | Ra / PCD / Pos. / Qty / Part / Weld (AB makine detayi, virgullu ondalik) | 14 | C (izometri degil) |
| **ada / PAOR** | PDF-XChange | ~1 karakter metin = **image-PDF**, AVEVA E3D | 1 | E (image -> L3, MK-50.2) |

**Cikan iki kesin sonuc:**
1. **Producer metadata guvenilmez seselici.** Yonteknik onu siler; Sefine'de ayni Cadmatic farkli sablon. -> zayif ipucu.
2. **Yapisal parmak izi gercek seselici.** "Drawing symbols + SPOOL NAME + WELDING NUMBER" token seti,
   Tersan + Yonteknik'i dogru sekilde ayni aileye koyar (farkli kaynak, ayni format) ve Sefine'yi ayirir.

### 5.3 Tasarim ofisi facet'i + format ailesi katalogu (4 ekran goruntusu)

**Birincil kanit — ayni tersane, farkli ofis, farkli format:**
- SEFINE tersanesi 3 ayri ofisle 3 ayri format: Navis/Kongsberg, Salt Ship Design, Cadmatic-direkt (nb68).
- SEFT ofisi 2 ayri cizimde (Charge Air + Exhaust, Karadeniz PS) AYNI format.
- Sonuc: ayni tersane != ayni format; ayni ofis ~= ayni format. -> MK-118.4 (yordayici, kimlik degil).

**Format ailesi katalogu (su ana kadar):**

| Aile | Tasarim ofisi | Tersane | Ayirt edici capa | Dil / standart | Materyal listesi anahtari | Cut anahtari |
|------|---------------|---------|------------------|----------------|---------------------------|--------------|
| A1 | Cadmatic-Tersan sablonu | Tersan, Yonteknik | SPOOL NAME / Malzeme Listesi | TR / DIN | "Malzeme Listesi" | "Cut & Bending Info" |
| A2 | Cadmatic-Sefine sablonu | Sefine (nb68) | ZONE: / Part Number / Cut Number | EN | (zone-tabanli) | — |
| B | SEFT Muhendislik | Karadeniz PS | FABRICATION + ERECTION MATERIALS | EN / DIN | "FABRICATION/ERECTION MATERIALS" | "CUT PIPE LENGTH" |
| C | Navis Consult (Kongsberg) | Sefine | FABRICATION MATERIALS + CODE, N.D. | EN / ASME+EN | "FABRICATION MATERIALS" (CODE) | "CUT PIPE LENGTH" |
| D | Salt Ship Design | Sefine | PREFABRICATED + LOOSE PARTS | EN / EN | "PREFABRICATED/LOOSE PARTS" | "CUTTING" |
| E | AVEVA E3D (PAOR) | ada | image-PDF, metin yok | — | — (L3) | — |

**Alan capalarinin aile-bagimliligi (kritik tasarim notu):** "materyal listesi var" neredeyse evrensel
ama BOLUM CAPASI aileye gore degisiyor (Malzeme Listesi / FABRICATION MATERIALS / PREFABRICATED PARTS).
Ayni sekilde cut tablosu, yuzey bilgisi (TR NOT / checkbox / SURFACE / PROTECTION), agirlik (kg / MASS),
continue (Continue: / CONT. ON-FROM). -> Her alanin SESELICISI format ailesidir; deger cikarimi ortak
olabilir ama capa ailenin parmak izinden gelir.

**Yan bulgular:**
- Bu 4 ornek vektor PDF (metinli) -> gercek PDF'leri gelince L2'ye uygun (sadece PAOR image).
- proje_kodu: Tersan'da klasorde; SEFT/Navis/Salt'ta BASLIK BLOGUNDA yapili alan. -> yeri aile-bagimli facet.
- Standart ailesi degisken: DIN (Tersan/SEFT), ASME+EN (Navis), EN (Salt). -> "standart sozlugu" aile-bagimli.

---

## 6. Eslestirme mantigi (tanima) — seselici skoru + esik

Bu, "bu PDF hangi paketlere uyar?" problemidir (cikarimdan ayri). Profesyonel desenleri SECICI aldik:

- **Meta-etiket vs kanit:** ofis / CAD araci / surum birer META-ETIKETTIR (ipucu); formatin NEDENI
  uretilen yapinin kendisidir (yapisal parmak izi = kanit). Ipucu aday havuzunu daraltir, kanit karari verir.
- **Paket basina skor + esik (TEK SOMUT EKLENTI):** mevcut `fingerprintSkor` / L1-L2 guven, paket
  duzeyine cikarilir: "bu PDF A1'e %92, C'ye %30 uyuyor". En yuksek skorlu aile onerilir; ikincil aday
  "degilse bu" diye gosterilir; esik altinda hicbiri yoksa "yeni format" akisina girer.
- **Specificity = katman sirasidir.** Ayri bir CSS-tarzi specificity motoru KURMUYORUZ; en-ozel =
  en-ust katmanda eslesen. (Gereksiz karmasa.)
- **Eslesme/oncelik ayrimi gereksiz.** Oncelik zaten katman sirasi oldugu icin K8s-tarzi ayri formulasyon yapilmaz.
- **Otomatik cakisma cozumu (salience) ERTELENDI.** Su an paket sayisi az, cakisma nadir; MK-118.2
  ("iki adayi goster + insana sor") yeterli ve guvenli. Paket sayisi buyuyup cakisma siklasinca yeniden degerlendir.

> **MK-118.6 — Profesyonel desenleri SECICI al.** Bir IDP/rule-engine deseni ancak (a) mevcut kurgunun
> eksik parcasiysa ve (b) mevcut bilesenlerin uzerine minimum eklemeyse alinir. Katman modelinin zaten
> kapsadigi mekanikler (ayri specificity motoru, eslesme/oncelik ayrimi, salience) eklenmez. "Olmayan
> soruna cozum" reddedilir. Karmasiklik, fayda gerektirdiginde eklenir.

---

## 7. Davranis sozlesmesi — Kismi tanima (yeni format / hibrit / surum kaymasi)

Yeni/degismis bir PDF "kismen A, kismen B, kismen yabanci" olabilir. Sistem ne "hibrit" diye yeni tur
yaratir ne sifirdan baslar. **Alan alan, uyan tum facet kurallarini birlestirir; uymayanlari insana sorar.**

Ornek (kismi):
- pipeline_no -> A1 kurali uydu -> on-dolu, yuksek guven
- malzeme/DN -> evrensel sozluk -> on-dolu, yuksek guven
- et/boy -> baska ailenin tablo duzeni uydu -> on-dolu, **isaretli (orta guven)**
- imalat notu -> hicbir sey uymadi -> **sadece bu alan insana sorulur**

### Guven kademesi
- Ozel facet eslesti -> yuksek guven -> on-dolu, hafif onay
- Sadece evrensel/gevsek kural -> orta guven -> on-dolu + "gozden gecir" isareti
- Hicbir sey eslesmedi -> insana sor

> **MK-118.2 — Cakismada tahmin etme, iki adayi goster.** Iki kural ayni alanda celisirse sistem sessizce
> birini SECMEZ; guveni dusurur, iki adayi da sunar. Yanlis alani yuksek guvenle doldurmak, bos birakip
> sormaktan tehlikelidir (MK-96 ile uyumlu). Bu kapi promote aninda da calisir.

### Ogrenme + promote
Insanin onayladigi/isaretledigi yabanci alan, o PDF'in facet'lerinden turetilmis YENI ince kural paketi
olur. Yeni format elle bastan tanimlanmaz; facet facet kendiliginden olusur.

> **Promote esigi (guncellendi):** "5+ kullanim" yerine **bagimsiz dogrulama**:
> **(a) iki ayri firma ayni formatta ayni alana ayni cevabi verir, VEYA (b) super admin onaylar.**
> (MK-96 capraz dogrulama ruhu: sayi degil, bagimsiz iki kaynak.)

---

## 8. Mevcut isin korunmasi — Tembel refactor

> **MK-118.3 — Gecis ek bir katman birlestiricidir; mevcut korunur; ayristirma tembeldir.**

- Mevcut Tersan satiri (`e1fb879d`) = ilk ve en olgun facet pack. Silinmez.
- `lib/l2-parser.js` motoru yeniden yazilmaz. `parse(text, parser_kural)` imzasi korunur; oNUNE eslesen
  paketleri birlestiren kucuk bir "katman birlestirici" eklenir, sonra AYNI parse cagrilir.
- Migration'lar tarihte kalir (append-only). Gecis = yeni ileri migration (dry-run BEGIN...ROLLBACK, MK-98.2).
- Calisan Tersan'a DOKUNULMAZ. NB1137 ince override olur; override yazilirken hangi kuralin gemiye/
  malzeme-grubuna ozel oldugu kendiliginden cikar. Toptan yeniden-tanitim YOK.
- 84c12f61 "Montaj Resmi" gerilimi yumusar: format artik "hep ya hic" degil; kismen calisabilir.

---

## 9. Yeni Format Onaylama Akisi (gorsel isaretleme — Cihat modeli)

Cikis noktasi: **DB tablolarimiz belli, neye ihtiyacimiz oldugunu biz biliyoruz.** Kullanici formati
ANLATMAZ; eksik alanlari GOSTERIR ya da DOGRULAR. Bu, 116'nin "Asama 2 (isaretleme)" adimini merkeze ceker.

Kullanicidan istenen yalnizca uc eylem:
1. **Onay:** "Biz bu alanin bu oldugunu dusunuyoruz, dogru mu?" (evet/hayir)
2. **Secim:** "Su alan icin: a / b / c?"
3. **Isaretleme:** "Su alan PDF'te nerede?" -> PDF ekrana gelir, kullanici mouse ile kutu cizer (+ kisa aciklama opsiyonel)

Akis:
1. PDF yuklenir; **image mi metinli mi** kontrol (MK-50.2). Image ise isaretleme degil ELLE GIRIS modu.
2. **Skorla** (Bolum 6): en yakin aile onerilir.
3. **Yakaladiklarimizi onaylat** (guven kademesi, kismi tanima).
4. **Eksik alanlar** (DB tablosu icin gerekli ama cikmayan) icin: "bu PDF'te su alanlari bulamadik" uyarisi
   -> sirayla "yuzey islem nerede? / proje no nerede?" diye sorar -> kullanici kutuyla isaretler.
5. **Saglamlastirma:** opsiyonel olarak birkac farkli ornek istenir; verirse onlari da isaretler.
6. Kaydet -> kullanici **hemen kendi projelerinde kullanmaya baslar** (statu: firma-taslak).
7. Bilgiler **super admin sayfasina** duser; orada biz kullanicinin isaretleyemeyecegi seyleri
   (konum->metin esleme, turetilebilir veri) isleriz.

> **MK-118.7 — Isaretleme KOORDINAT degil CAPA olarak saklanir.** Kullanici kutuyu pikselde cizer; ama
> ayni formatin baska PDF'inde bilgi kayabilir. Kalici kural = kutudaki METIN + cevresindeki SABIT ETIKET
> ("SURFACE:", "NOT:", "PIPE CLASS:"). Koordinat sadece "kullanici burayi gosterdi" ipucu. (Tersan'daki
> sabit "NOT: ... kg" kalibi tam buydu.)

> **MK-118.8 — Uc statu: firma-taslak -> firma-onayli -> evrensel.** Kullanici taslakla CALISIR ama havuza
> cikmaz. Iki bagimsiz firma ayni capayi/degeri uretirse VEYA super admin onaylarsa -> evrensel. Promote'ta
> sadece KURAL+ETIKET anonim cikar; firma PDF icerigi/proje/spool verisi ASLA (KARAR-48.1).

Dogrulama akisin dogal yan urunu: ayni formati ikinci firma yukleyince sistem yine ayni yerde takilir,
"yuzey islem nerede?" diye sorar; ikisi ayni capayi gosterirse dogru kabul. Farkli gosterirse ->
super admin'e "iki firma farkli isaretledi, hangisi?" (MK-118.2). "Aynilik" koordinat degil, **cikarilan capa/deger** uzerinden olculur.

---

## 10. Taninan Formatta Eksik/Okunamayan Alan Akisi (sessiz hata yok)

Taninan formatta (or. Tersan) bir PDF'te bir alan cikmadi (tarama bozuk, bos birakilmis, kucuk varyasyon).
**Sessiz gecmek yasak** (117 yukleyen_id borcunun ozu sessiz hataydi). Ama kullaniciyi da bogmamali.

> **MK-118.9 — Eksik alan asla sessizce gecilmez; format-seviyesi duzeltme kuyrugun kalanina otomatik uygulanir.**

Akis (10 PDF'lik kuyruk ornegi):
1. Eksik alan yuzeye cikar (sessiz degil).
2. Sistem sorar: **"Bu duzeltme bu PDF'e mi, formatin tumune mi?"** — VARSAYILAN ONERI: "formatin tumune"
   (cunku ayni format; kullanici 10 kez aynisini onaylamasin).
3. **"Formatin geneli"** -> duzeltme aile/firma katmanina yazilir; kuyruktaki AYNI AILEDEN digerleri
   otomatik yeniden degerlendirilir; ayni eksik cozulurse tek tek sorulmaz.
4. **"Sadece bu PDF"** -> o spool/devre kaydina islenir; kural degismez; kuyruk devam eder.
5. Otomatik yeniden degerlendirme **sessiz duzeltme degildir**: "9 PDF yeniden islendi, 7 cozuldu, 2'sinde hala eksik" ozeti gosterilir.

Ince noktalar:
- **Aile garantisi:** otomatik uygulama yalnizca ayni format ailesine (karisik kuyrukta hepsine degil).
  Skor + esik (Bolum 6) bunu saglar.
- **Bos vs okunamadi:** "PDF'te gercekten yok" (gecerli bos, alan opsiyonel ogrenilir) ile "var ama
  okuyamadik" (isaretleme) ayri cevaplardir; arayuz ayirir.
- **Atla:** kullanici emin degilse "simdilik atla" -> o PDF manuel_onay'da bekler, kuyruk akar.

---

## 11. Arayuzun soracagi sorular — katman etiketli (116'nin 8 sorusu, guncel)

Arayuz parser URETMEZ, VERI TOPLAR. Cogu artik gorsel isaretlemeyle cevaplanir; sorular katmana yonlendirir:

1. MONTAJ mi IMALAT mi? -> Katman 1 (Malzeme Listesi var/yok)
2. pipe_no nerede? -> Katman 3 (isaretle)
3. Spool numarasi nasil? (S01, S01_1) -> Katman 1
4. Dosya adi yapisi? (".1.pdf" / "_1(2)" / " 1(4)" / "-P2") -> Katman 1
5. NOT alani nerede/ne icerir? -> YER Katman 1 (isaretle), ICERIK Katman 0
6. Bir cizimde birden cok spool var mi? -> Katman 1
7. Agirlik / blok / sistem / guverte / yuzey nerede? -> isaretle (Katman 1/3)
8. continue/devam? ("Continue:" / "CONT. ON") -> Katman 1 (+ sistem siniri, Katman 3 notu)
9. Boyut/cap bicimi metrik (ODxWT) mi emperyal (inc+Sch) mi? -> Katman 2 (CAPRAZ)
10. PDF metinli mi image mi? -> isleme yolu (MK-50.2)
11. Tek sayfa mi cok sayfa mi? -> isleme yolu (cok-sayfa L2 sinirina dikkat)
12. Tasarim ofisi/proje no nerede? -> isaretle (Katman 1/4)

---

## 12. Isleme yolu sinirlari (veriden teyit)

- **Image-PDF (PAOR/AVEVA):** metin yok -> L2 imkansiz -> ELLE GIRIS / L3 (MK-50.2). Faceted model zarifce
  karsilar: iskelet eslesmez -> L3'e duser.
- **Cok sayfali (Sefine 7, Royal 14, Yonteknik 11):** Tersan hep 1 sayfa. Cok-sayfa L2 sinirina dikkat (51).
- **Royal:** izometri/spool degil, AB makine detay cizimi; "izometri" filtresine girmeyebilir.

---

## 13. Yol haritasi (kademeli)

### Asama 0 — Bu kilavuz + facet haritasi (TAMAM, bu oturum)

### Asama 1 — Katman birlestirici (kod, sonraki oturum)
`l2-parser.js` onune evrensel<-aile<-malzeme<-gemi birlestirici. Mevcut `parse()` korunur. PILOT alan:
boyut/cap (metrik vs inc+Sch); NB1110 + NB1137 ikisinde de calistigini kanitla (MK-51.2: 5+ ornek).

### Asama 2 — Eslestirme skoru + esik (kod)
fingerprintSkor'u paket duzeyine cikar; en yakin aile onerisi + ikincil aday + esik (Bolum 6).

### Asama 3 — Facet kapsama raporu (UI, super admin)
parse_sonuc / dogrulama_uyarilari'ni okuyup alan-kapsama + facet kumeleri gosterir (eski "format envanter" borcu).
Yeni tasarim tabani burada prova edilir.

### Asama 4 — Gorsel isaretleme arayuzu (Bolum 9 akisi)
PDF render + kutu cizme + capa esleme + uc statu. 116'da "v2/en zor" denmisti; Cihat modeliyle asil guvenilir yol bu.

### Asama 5 — Eksik alan / kuyruk otomatik yeniden degerlendirme (Bolum 10 akisi)

---

## 14. Acik sorular / sonraki veri ihtiyaci

- Aile katalogu su an 5 (A1, A2, B, C, D) + image (E). Her aile icin daha cok ornek -> orta-guven netlesir.
- Yonteknik'in Tersan (A1) ile %100 ayni mi yoksa kucuk farklar mi.
- SEFT (B), Navis (C), Salt (D) ailelerinin alan capalarinin tam haritasi (gercek metinli PDF'lerle).
- Ayni ofisin iki SURUMUNE ait ornek (MK-118.5'i veriyle gormek).
- "Cok buyuk" / "yanimda olmayan" formatlar (Cihat'ta) — toplaninca aile listesi genisler.
- proje_kodu: Tersan klasorden, digerleri baslik blogundan -> aile-bagimli cikarim kurali.
- Capa esleme (koordinat->metin) icin pdftotext konumlu cikti + render koordinat hizalamasi.

---

## 15. Kaydedilecek MK kararlari (ozet)

- **MK-118.1** — Seselici yapisal parmak izidir; Producer metadata zayif ipucu.
- **MK-118.2** — Cakismada tahmin etme; guveni dusur, iki adayi goster (promote'ta da gecerli).
- **MK-118.3** — Gecis ek katman birlestiricidir; mevcut korunur; ayristirma tembeldir.
- **MK-118.4 (duzeltildi)** — Tasarim ofisi formatin EN GUCLU YORDAYICISI; KIMLIGI degil. Kimlik parmak izinde.
- **MK-118.5** — Surum bir facet'tir; surum kaymasi = kismi tanima yolu.
- **MK-118.6** — Profesyonel desenleri SECICI al (eksik parca + minimum ekleme; salience ertelendi).
- **MK-118.7** — Isaretleme koordinat degil CAPA (metin + sabit etiket) olarak saklanir.
- **MK-118.8** — Uc statu: firma-taslak -> firma-onayli -> evrensel; promote'ta sadece anonim kural cikar (KARAR-48.1).
- **MK-118.9** — Eksik alan asla sessizce gecilmez; format-seviyesi duzeltme kuyrugun kalanina otomatik uygulanir (ayni aile + ozet).

> Onceki ilgili kararlar: MK-50.2 (image-PDF L2 yapamaz), MK-50.3 (3+ ornek olmadan kural yazma),
> MK-51.2 (regex 5+ gercek ornekle test), MK-117.1 (alistirma kelimeleri merkezi/evrensel),
> MK-96 (capraz dogrulama), KARAR-48.1 (veri sahipligi: musteri verisi musterinin, anonim kural AresPipe'in).
