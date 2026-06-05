# İZO KANIT SETİ — 31 PDF (4 gemi · 11 montaj/imalat çifti) SATIR KAPSAMA ANALİZİ
> Oluşturma: oturum 155 sonu (2026-06-05). v2: +8 PDF (B1130, 4 çift). v3: +14 PDF (7 çift; B1135 yeni gemi; ALS ailesi; PIPE NO kesilme bulgusu). Amaç: format öğretim oturumlarında PDF'leri yeniden
> yüklemeden bu analizden çalışmak. Kaynak: Cihat'ın verdiği 9 izometri (aşağıda envanter).
> ⚠ METODOLOJİ SINIRI (MK-132.1): Bu belgedeki satır metinleri PDF görüntüleyici metin katmanından;
> pipeline extractor çıktısıyla boşluk/yapışıklık FARKLI olabilir (örn. burada "101.6 316L 1.95"
> ayrık, kuyrukta "101.6316L1.95" yapışıktı). KAPSAMA MATRİSİ (tip var/yok) güvenilir; YENİ DESEN
> REGEX'İ buradan YAZILMAZ — dosya sisteme yüklenir, gerçek ham_satir çıktısından yazılır.

## 1. DOSYA ENVANTERİ
| Dosya | Gemi | Tarih | Pipeline | Yüzey | Ağırlık | Not |
|---|---|---|---|---|---|---|
| 4Ax2A.S01.1 | B1110 | 16-04-25 | 4Ax2A (zone'suz!) | Paslanmaz | 7 kg | NB1124 kardeşi; 301-Cargo Manifold; BV I |
| D100-302-FWP01-E.S01.1 | B1110 | 26-11-24 | D100-302-FWP01-E | Galvaniz | 13.7 | NOT: "Blok erection alıştırma spooludur!!" |
| M100-302-01-ALS.S01.1 | B1110 | 15-11-24 | M100-302-01-ALS | Galvaniz | 68.0 | NOT: "Alistirma Parcasidir (Kaynatma!!)"; BV III |
| M130-000-002.S02.1 | B1110 | 10-03-25 | M130-000-002 | Galvaniz | 136.2 | 814-Sprinkler; en zengin tablo (8 satır) |
| E120-817-006.S01.1 | B1137 | 12-02-26 | E120-817-006 | Paslanmaz | 7 | DNV III; Continue: M130-817-006/S01 (!) |
| M110-817-007.S01.1 | B1137 | 12-02-26 | M110-817-007 | Paslanmaz | 10 | **123.C CANLI VAKASI** (2"x1-1/4"); "Uretilmeyecek" notu |
| G400-804-602.S01.1 | B1137 | 28-01-26 | G400-804-602 | Galvaniz | 27 | Continue: G300-804-602/S01; Redüser metrik |
| M100-317-21.S03.1 | B1110 | 09-01-25 | M100-317-21 | Siyah | 41.0 | Victaulic Groove OD:168 |
| AT130-816-026.S02.1 | B1130 | 22-01-25 | AT130-816-026 | Galvaniz | 122.4 | Üçüncü gemi; AT prefix ailesi |

Üç gemi: B1110 / B1130 / B1137. Hepsi aynı Cadmatic spool ailesi — fingerprint token seti
(SPOOL NAME · WELDING NUMBER · CUT NUMBER · Malzeme Listesi · Cut & Bending Info) 9/9 mevcut.
B1137 şablon varyantı: başlığa kolon numaraları (1..8) eklenmiş + satır başında sıra no var
("1 Boru...", "2 1 Redüksiyon..."); B1110/B1130'da sıra no satır başında YOK (kod+adet yapışık
gelir extractor'da). Bu fark satır-başı \d+ varsayımlarını etkileyebilir — gerçek extractor
çıktısıyla doğrulanmalı.

## 2. KAPSAMA MATRİSİ (155 sonu satir_tipleri'ne karşı)
✔ = mevcut desen söker beklenir · ⚠ = tetik tutar pattern tutmaz (ham_satir, GÖRÜNÜR) ·
✖ = tetik bile tutmaz (SESSİZ KAYIP, B-6 İHLALİ)

| Satır sınıfı | Örnek (dosya) | Durum | Not |
|---|---|---|---|
| boru_mm (metrik ST37) | 60.3x6.3 695 (D100); 355.6 (M100-302); 273.0 ×3 (M130); 168.3 (M100-317); 219.1 (AT130); 76.1/60.3 Dikişli (G400) | ✔ | "Dikişli" varyantı dahil ('Boru Dik' tetikler) |
| boru_sch (emperyal 316L) | 2" Sch 10S 1737 (E120); 2221 (M110) | ✔ | |
| reduksiyon (155 genel tip) | 4"x2" Sch 80S (4Ax2A); **2"x1-1/4" Sch (M110 = 123.C vakası)** | ✔ | A kararının saha regresyonu BU SETTE test edilebilir |
| dirsek metrik | 1.5D 273.0x6.3 381 ×2 (M130) | ✔ | |
| flans TR (Flanş Düz) | PN10 DN350 ×2 (M100-302); PN10 DN250 (M130); PN16 DN150 (M100-317) | ✔ | |
| groove (Victaulic) | DN150 OD:168 0.2 St* (M100-317) | ✔ | OD: dalı pattern'de var |
| bilezik Detay B (L='li) | Ic Bilezik Detay B ST37 DN50 L=100 10 (G400) | ✔ | dikkat: kalite DN'den ÖNCE de geçiyor — gerçek çıktıyla teyit |
| **Ic Bilezik Detay A (L='siz)** | DN50 30 ST37 2.48 ×2 (D100); DN250 30 (M130); DN200 30 ×2 (AT130) | ⚠ | pattern L= istiyor → ham. İKİNCİ notasyon; 5 satır bu sette |
| **Dış Bilezik** | Detay A DN50 10 (D100); DN250 10 (M130); DN200 10 (AT130) | ✖ | TİP YOK — 'Ic Bilezik' tetiklemez. 3 satır sessiz kayıp |
| **Redüser metrik (çift OD)** | Redüser Konsantrik Dikişli 114.3x4.5 / 76. 100 ST37 1.0996 (G400) | ✖ | "RedüSER"≠"RedüKSİYON", tetik tutmaz. Çift-OD "/" notasyonu + ondalıksız boy |
| **Flange EN (İngilizce)** | Flange Welding Neck ANSI 150-3.2 Certifi 77/64 316L (4Ax2A ×2) | ✖ | 'Flan\S*\s+D' = "Flanş Düz" varsayımı; "Flange Welding" tutmaz. NB1124'te flanşların kaybolma sebebi muhtemelen BU |
| **Ağırlıksız Alın Kaynağı** | DN50 3 ST37 [kg yok] (E120); DN32 3 ST37 (M110) | ⚠ | MK-123.B "kaynak ağırlık taşımaz" ama pattern sonda kg istiyor → ham |

## 3. 156+ KAPSAMA PAKETİ (önerilen iş listesi — adres: format-paketleri.js, MK-155.1!)
Öncelik = sessiz kayıplar önce (B-6):
1. **dis_bilezik tipi** (yeni; tetik 'D.ş Bilezik' tarzı, TR karakter esnek) — A1 katmanı (malzemeden bağımsız, ST37 örnekli ama yapı genel).
2. **redüser metrik tipi** (yeni; tetik 'Red.ser'; çift-OD "a/b" + ondalıksız boy) — KARBON facet adayı.
3. **flange_en tipi** (yeni; tetik 'Flange Welding' vb.) — PASLANMAZ facet (örnekler 316L/ANSI). NB1124 doğrulamasıyla birlikte.
4. **Ic Bilezik Detay A varyantı** — mevcut bilezik pattern'ine L='siz dal VEYA ikinci tip (motor ilk-tetik kısıtına dikkat, MK-155.3: tek tipte iki dal tercih).
5. **kaynak pattern'i ağırlıksız dala izin** (MK-123.B ile tutarlılık).
Her biri: gerçek ham_satir çıktısı → lokal aileBirlestir testi (155 yöntemi) → deploy → sha düşür
(deploy SONRASI dahil) → reset → kanıt. Bu 9 dosya W-5.1 kanıt klasörünün çekirdeği olabilir.

## 4. YAPISAL GÖZLEMLER (format dışı değer)
- **"Continue:" köprüleri:** E120-817-006/S01 → M130-817-006/S01 ve G400-804-602 → G300-804-602 —
  AYNI hattın zone-prefix değişimiyle devamı. W-4.2 (E120- prefix normalizasyonu) varsayımının
  doğrudan kanıtı; kabuk eşleştirme/alıştırma zinciri için altın bilgi (kabukta_yok teşhislerinde bak).
- **Zone prefix aileleri:** D/E/G/M/AT + yüzlük zone (G400→G300, M110/M130). 4Ax2A İSTİSNA:
  zone'suz kısa pipeline (NB1124/B1110 cargo manifold ailesi) — dosya_adi_regex'lerin "zone'lu"
  varsayımını kırar.
- **Alıştırma spool'ları NOT alanından tanınıyor:** "Alistirma Parcasidir (Kaynatma!!)" /
  "Blok erection bölgesine gelen alıştırma spooludur!!" — alistirma_ipucu sinyali olarak değerli.
- **"Uretilmeyecek" notu (M110-817):** Continue bloğunda — üretim filtresi/uyarı adayı.
- **Pipe Class çeşitliliği:** BV I / BV III / DNV III — sertifika tipi (2.2/3.1/3.2) satır
  tanımlarında; 3.2 ilk kez bu sette görüldü (4Ax2A Flange).
- **Çizen/tarih:** vkaya/ugunes/ssdanis/msen; tarih aralığı 2024-11 → 2026-02 — şablon bu aralıkta
  token-stabil (fingerprint güveni).

## 5. BU BELGEYİ KULLANIRKEN
- Kapsama matrisi 155 sonundaki satir_tipleri durumuna göredir — sonraki oturumlarda tip eklendikçe
  ✖/⚠ satırlarını güncelle (canlı belge).
- Desen yazımı için 1. bölümdeki metodoloji sınırını UNUTMA: önce dosyayı sisteme yükle, ham_satir
  çıktısından çalış. Bu 9 dosyanın storage'a yüklenip yüklenmediğini oturum başında sor.

## 6. v2 EKİ — İKİNCİ PARTİ (8 PDF, B1130)

### 6a. Envanter
| Dosya | Tip | Tarih | Pipeline | Yüzey | Ağırlık | Not |
|---|---|---|---|---|---|---|
| M120-262-803-148.S01.1 | imalat | 13-02-25 | M120-262-803-148 (4 segment!) | Galvaniz | 20.6 | DNV II; Overboard; NOT braket standardı |
| M120-262-803-148.1 | **montaj** | 13-02-25 | aynı | Galvaniz | 21 | Continue: M120-803-148 (segment DÜŞÜYOR!) |
| M110-262-711-102.S01.1 | imalat | 12-02-25 | M110-262-711-102 | Siyah | 2.1 | küçük çap 26.9x3.2; DN20 flanş |
| M110-262-711-102.1 | **montaj** | 12-02-25 | aynı | Siyah | 11 | S01+S02; valf no'ları 711.1021/1022 |
| AT110-711-101.S01.1 | imalat | 31-12-24 | AT110-711-101 | Siyah | 16.5 | Bilezik Detay B (kalite DN'den ÖNCE) |
| AT110-711-101.1 | **montaj** | 31-12-24 | aynı | Siyah | 78 | S01..S06; Continue: M110-711-101 1(2)/2(2) |
| AT130-743-001.S01.1 | imalat | 27-11-24 | AT130-743-001 | Paslanmaz | 6.2 | KESİRLİ NPS 1-1/2"; Bilezik Detay C |
| AT130-743-001.1 | **montaj** | 27-11-24 | aynı | Paslanmaz | 31 | S01..S05; Continue: AT150-743-001 |

### 6b. ÇİFT değeri (kardeş format ayrımı test vakaları)
Montaj sayfalarında Malzeme Listesi / Cut & Bending YOK; SPOOL NAME + S01..S0N işaretleri +
Continue + R= değerleri VAR; "1()" sheet notasyonu (imalat "1(1)"). Dosya adı = imalat adı eksi
.SXX. Bu 4 çift, fingerprint kardeş-ayrımının (montaj→39a2c81b / spool→e1fb879d) doğrudan
regresyon setidir. Montaj ağırlığı ≈ spool ağırlıkları toplamı (M110: 11 ≈ 2.1+S02; çapraz K2 sinyali).

### 6c. v2 ile kapsama matrisine EKLENEN satır sınıfları
| Satır sınıfı | Örnek (dosya) | Durum | Not |
|---|---|---|---|
| **Overboard Lama** | Lama 100mm DN150 150 St* (M120) | ✖ | TİP YOK — tetikleyen yok, SESSİZ KAYIP. Yeni kategori (lama/sac) |
| **Kesirli NPS boru_sch** | 1-1/2" Sch 10S 1771 316L (AT130) | ⚠ | tetik tutar, pattern (\d+)" kesiri tutmaz → ham. dirsek_sch'teki [\d/-]+ deseni boru_sch'e de gerekli |
| **Bilezik Detay C (kalite-zengin)** | Detay C Paslanmaz AISI 316 DN40 L=100 10 316L SCH40 0.68 (AT130) | ⚠ | kuyrukta "316L SCH40" — pattern kalite sonrası direkt kg ister → ham. Detay A/B/C üçüncü varyant |
| Bilezik Detay B (kalite önce) | Detay B ST37 DN40 L=100 10 ST37 0.68 (AT110) | ✔? | tetik+L= var; kalite'nin DN ÖNCESİNDE de geçmesi pattern'i şaşırtabilir — gerçek çıktıyla teyit ŞART |
| boru_mm çift-hane et | 168.3x12.5 (M120) | ✔ | x(\d+\.\d) "12.5"in 5'ini boy bloğuna kaydırır mı? gerçek yapışık çıktıyla TEYİT (şüpheli ✔) |

### 6d. Yapısal gözlemler (v2)
- **4 segmentli pipeline:** M120-262-803-148 (zone-sistem-?-no) — 3 segment varsayımını kırar;
  dosya_adi_regex ve pipeline parse desenleri için kritik.
- **Continue'da segment düşmesi:** M120-262-803-148 → "Continue: M120-803-148" — AYNI hat,
  segment eksilmiş! Eşleştirmede pipeline normalize (W-4.2 sınıfı) buna da bakmalı.
- **Montaj valf/bağlantı no'ları** (711.1021/1022): montaj parse'ının (39a2c81b) liste_alanlar
  adayları.
- **AT150 prefix'i** Continue'da göründü — zone ailesi genişliyor (AT110/130/150).

### 6e. 156+ kapsama paketine v2 EKLERİ
6. **lama tipi** (yeni; ✖ sessiz kayıp — Overboard/braket ailesi)
7. **boru_sch kesirli NPS**: (\d+)" → ([\d/-]+)" genişletmesi (dirsek_sch zaten yapıyor)
8. **bilezik Detay C / kalite-zengin kuyruk** dalı (Detay A maddesiyle birlikte tek tipte üç dal)
Sıra önerisi değişmedi: sessiz kayıplar (Dış Bilezik, Redüser, Flange EN, Lama) önce.

## 7. v3 EKİ — ÜÇÜNCÜ PARTİ (14 PDF = 7 çift; B1110×5, B1137×1, B1135×1)

### 7a. Envanter (çift başına tek satır; M=montaj, İ=imalat)
| Pipeline | Gemi | Tarih | Yüzey | İ/M kg | Not |
|---|---|---|---|---|---|
| M200-355C-210-ALS | B1110 | 03-03-25 | Paslanmaz | 10.2/16 | ALS; **başlıkta PIPE NO kesik: "...-AL"**; AISI 316L flanş |
| M110-303-015P3 1(3) | B1110 | 29-01-25 | Galvaniz | 17.8/100 | montaj ÇOK SAYFALI 1(3); S01..S05; BS104 ref; Victaulic |
| M100-323-FM03-ALS | B1110 | 30-12/13-01 | Galvaniz | 49.2/50 | **Manşon + Redüser Dikişsiz** (aşağıda); M/İ tarihleri FARKLI |
| M110-332A-001-ALS 1(2) | B1110 | 24-03-25 | Paslanmaz | 7/7 | zone-harfli segment 332A; başlık kesik "...-A"; ekipman karşı-flanş NOTu |
| M200-355-31-ALS | B1110 | 18-03-25 | Siyah | 43.3/44 | **ST45.8 kalite + Sertifikalı_St35.8** tanımı; Çelik Alın Kaynağı |
| E100-722-2015-ALS | B1137 | 17-02-26 | Siyah | 7/7 | 722 sistemi (117 ailesi!); Continue→ekipman "871.110.40 Cooling Skif" |
| M120-817-001 | **B1135** | 09-12-25 | Paslanmaz | 7/64 | YENİ GEMİ; 2-1/2" Sch; montaj'da nozül refleri (817.100, 2.1-1) + NS işaretleri |

### 7b. v3 ile kapsama matrisine EKLENENLER
| Satır sınıfı | Örnek | Durum | Not |
|---|---|---|---|
| **Manşon** | Manşon DN200 x DN15.0 19.05 SA/A105 0.1 (M100-323) | ✖ | TİP YOK, SESSİZ KAYIP. DNxDN çift ölçü + **SA/A105 kalite** (ASME!) — kalite alternatifleri ST/316L evrenini aşıyor |
| Redüser Dikişsiz | 219.1x6.3 / 168 152 ST37 (M100-323) | ✖ | v2 Redüser sınıfının teyidi: Dikişli (G400) + Dikişsiz; çift-OD "a / b" kesin desen |
| **ST45.8 ondalıklı kalite** | 551 ST45.8 9.9991 (M200-355-31 ×4 satır) | ⚠ | ST\d{2} "ST45"i alır, ".8" artar → pattern bozulur. ST\d{2}(?:\.\d)? genişletmesi TÜM tiplere; tanımda "Sertifikalı_St35.8" alt-tire notasyonu |
| Çelik Alın Kaynağı | DN150 3 ST37 [kg yok] (M200-355-31) | ⚠ | bilinen ağırlıksız-kaynak sınıfının "Çelik" varyantı (önceki: Paslanmaz) |
| 2-1/2" Sch boru | 105 316L (M120-817, B1135) | ⚠ | v2 kesirli-NPS bulgusunun ikinci gemi teyidi |

### 7c. v3 YAPISAL BULGULAR (yüksek değer)
- **PIPE NO BAŞLIKTA KESİLİYOR:** imalat başlık alanı sabit genişlik — "M200-355C-210-AL"(S kesik),
  "M110-332A-001-A"(LS kesik), "E100-722-2015-A". → AI/parse başlıktan pipeline okursa
  "pipeline_no_uyusmuyor" üretir; DOSYA ADI otoritedir (içerik-kimlik + dosya-adı-hızlandırıcı
  modeliyle uyumlu, MK-152.1). Eşleştirme/uyarı kodu bu kesilmeyi bilmeli.
- **ALS ailesi adlandırma deseni:** <pipeline>-ALS ayrı çizim seti; Continue ile ana hatta bağlanır
  (E100-722-2015-ALS → E100-722-2015). NOT alanı "Alistirma Parcasidir (Kaynatma!!)" sabit imza.
  Alıştırma tespiti için ÇİFT sinyal: dosya adı -ALS + NOT imzası.
- **722 sistemi yine sahnede** (E100-722-2015-ALS): MK-117/153.3 ailesi M110-722-21xx idi — bu
  sistemin dosyaları tarihsel olarak sorun çıkarmış; test setlerine dahil olması iyi.
- **Montaj çok sayfalı olabilir:** M110-303-015P3 "1(3)" — dosya adındaki 1(3) montaj sayfalamasıdır
  (spool 1(2).S01 desenindeki kullanım montajda sayfa anlamına geliyor).
- **Zone-harfli sistem segmenti:** 355C, 332A — pipeline regex'lerinde [A-Z]? eki şart.
- **Continue ekipmana gidebilir:** "871.110.40 Cooling Skif for Quadro M.2" — Continue hedefi her
  zaman pipeline değil; eşleştirme bunu pipeline sanmamalı.
- **M/İ tarih farkı olabilir** (M100-323: montaj 30-12, imalat 13-01) — çift eşleştirmede tarih
  eşitliği varsayılmaz.
- **B1135 montaj zenginliği:** nozül/bağlantı refleri (817.100, 2.1-1, 1.3-2) + NS işaretleri
  (65*15NS) — montaj parser (39a2c81b) liste_alanlar adayları (B1130 valf no bulgusuyla tutarlı).

### 7d. 156+ kapsama paketine v3 EKLERİ
9. **manşon tipi** (✖; DNxDN + SA/A105 kalite — kalite alternatif setini genişletme kararıyla birlikte)
10. **ST\d{2}(?:\.\d)? kalite genişletmesi** — TÜM tiplerde (ST45.8 dört satırda kanıtlı)
11. Redüser deseni Dikişli+Dikişsiz kapsar (tetik 'Red.ser' zaten ikisini tutar)
SESSİZ KAYIP TOPLAMI: Dış Bilezik · Redüser · Flange EN · Lama · **Manşon** (5 sınıf).

### 7e. Set istatistiği (v3 sonu)
31 PDF · 4 gemi (B1110/B1130/B1135/B1137) · 11 montaj+imalat çifti · tarih 2024-11→2026-02 ·
ALS ailesi 6 çift · kapsama: ✔ 8 sınıf / ⚠ 6 / ✖ 5.
## 8. v4 EKİ — DÖRDÜNCÜ PARTİ (6 PDF; B1124 YENİ GEMİ; 2 tam çift + 2 tek kanat) — oturum 156

> ⚠ Metodoloji sınırı (bölüm 1) bu eke de aynen geçerlidir: satır metinleri görüntüleyici metin
> katmanından, regex BURADAN YAZILMAZ. Bu partinin ek uyarısı: dosyalar Downloads kopyası olarak
> geldi — adlarda "(1)" macOS çoğaltma eki var (MK-52.1). Sisteme ORİJİNAL adla yüklenmeli
> (örn. `AT100-804-606.S01.1.pdf`), yoksa dosya_adi_regex sınamaları geçersizleşir.

### 8a. Envanter
| Pipeline | Gemi | Tarih | Tip | Yüzey | kg | Not |
|---|---|---|---|---|---|---|
| AT100-804-606 | **B1124** | 15-08-24 | M+İ(S01) | Galvaniz | 316 / 145.5 | Overboard; NOT: "Braket Koymayı Unutma! İçi Galvaniz Dışı Siyah!" |
| M110-262-803-537 | B1124 | 19-07-24 | M+İ(S01) | Galvaniz | 7 / 3.9 | **4-segment pipeline (262 ailesi, 2. kanıt)**; Flanş Dablin |
| M110-722-501 | B1124 | 04-09-24 | İ(S01) yalnız | Siyah | 35.2 | **Tee metrik**; Victaulic Groove; 722 ailesi (MK-117 tarihli sistem) |
| M110-722-508 | B1124 | 04-09-24 | M yalnız | Siyah | 180 | S01..S04; **Continue: M110-722-509 1(2)** (sayfa ekli Continue!) |

Beşinci gemi: **B1124** (= NB1124 projesinin PRJ NO'su — 156'da kabuk teşhisi yapılan devrenin
gemisi). Çizen: yavuz (yeni isim). Tarih aralığı 2024-07→09 — şablon stabilite penceresi
2024-07→2026-02'ye genişledi. Montaj sheet "1()", imalat "1(1)" notasyonu B1124'te de tutarlı.
Montaj ≈ Σ imalat kg çapraz sinyali tutuyor (M110-262: 7 ≈ 3.9 + S02).

### 8b. v4 ile kapsama matrisine EKLENENLER
| Satır sınıfı | Örnek (dosya) | Durum | Not |
|---|---|---|---|
| **Flanş Dablin** | Flanş Dablin Çelik PN16 - 2.2 Sertifikalı DN25 12.5 ST37 1.84 (M110-262) | ⚠? | Yeni flanş varyantı. Tetik 'Flan\S*\s+D' muhtemelen TUTAR; pattern "Düz" evrenine ayarlıysa ham düşer — gerçek ham_satir teyidi şart |
| **Tee metrik** | Tee Dikişsiz Çelik - 2.2 Sertifikalı 168.3x4.5 286 ST37 8.5436 (M110-722-501) | **?** | Kapsama matrisinde Tee sınıfı HİÇ YOKTU (31 PDF'te örneksiz). satir_tipleri'nde tee tipi var mı önce TEYİT; yoksa ✖ sessiz kayıp adayı |
| **Çelik Alın Kaynağı "- Saha"** | Çelik Alın Kaynağı - Saha DN200 3 ST37 [kg yok] (AT100) | ⚠ | Ağırlıksız kaynak ailesinin "- Saha" ekli varyantı; tetik bu eki tanımalı |
| Lama (2. örnek) | Overboard Lama 100mm DN200 150 St* (AT100) | ✖ | v2 bulgusunun (M120, DN150) ikinci gemi+ikinci DN teyidi — lama tipi artık şüphesiz gerekli |
| Ic Bilezik Detay A (3. örnek) | Ic Bilezik Detay A DN25 30 ST37 0.52 (M110-262) | ⚠ | L='siz dal, kg'LI; üçüncü örnek |
| boru_mm çift-hane et (2. örnek) | 219.1x12.5 ×2 satır (AT100) | ✔? | v2 şüphesinin teyidi; cut bloğu metin katmanında "219.1x12" KESİK görünüyor — extractor çıktısıyla doğrulama ŞART |

### 8c. Yapısal bulgular (v4)
- **Continue + sayfa eki:** "Continue: M110-722-509 1(2)" — Continue hedefi sayfa notasyonu
  taşıyabiliyor; eşleştirme/normalizasyon "1(2)"yi pipeline adından ayıklamalı (v3'ün "Continue
  ekipmana gidebilir" bulgusuyla birlikte: Continue alanı serbest metin kabul edilmeli).
- **722 ailesi B1124'te de** (501/508): MK-117/153.3 tarihli sistem üç gemide izlendi — test
  setlerinde kalıcı temsilci olmalı.
- **4-segment pipeline 2. kanıt:** M110-262-803-537 (v2: M120-262-803-148). 262 sistemi 4-segment
  adlandırıyor — kimlik çıkarımı (Madde 0) bu aileyi kapsamalı.
- **NOT alanında yüzey çelişkisi:** başlık "Galvaniz" ↔ NOT "İçi Galvaniz Dışı Siyah" (AT100) —
  yüzey tek-değer varsayımını kıran ilk örnek; uyarı sinyali adayı (K1/K3 ailesine).
- **Montaj PART ref zenginliği** (804.101 / 722.105 / 722.401, R=336.5): 39a2c81b liste_alanlar
  adaylarına B1124 örnekleri eklendi.

### 8d. 156+ kapsama paketine v4 EKLERİ
12. **tee metrik teyidi** — satir_tipleri'nde var mı? Yoksa sessiz kayıp listesine (✖) ekle.
13. **flanş pattern'i Dablin varyantı** — Düz/Dablin tek tipte iki dal (MK-155.3 tercihiyle).
14. **kaynak tetiğine "- Saha" eki** (10. maddeyle — ağırlıksız dal — birlikte tek tur).
SESSİZ KAYIP TOPLAMI (v4 sonu): Dış Bilezik · Redüser · Flange EN · Lama · Manşon (+Tee?) = 5(+1?).

### 8e. Set istatistiği (v4 sonu)
37 PDF · **5 gemi** (B1110/B1124/B1130/B1135/B1137) · 13 montaj+imalat çifti (2'si tek kanat) ·
tarih **2024-07→2026-02** · kapsama: ✔ 8 / ⚠ 9 / ✖ 5 (+1 teyit bekleyen Tee).

### 8f. 156 SAHA BAĞLANTISI (bu ek neden kritik)
156'da NB1124 (B1124) kabuk teşhisi mühürlendi: 22 spool PDF'inin 20'sinde pipeline_no NULL —
kırık nokta SATIR değil KİMLİK çıkarımı (`10Ax6A 1(2).S01.1.pdf` kalıbı kapsam dışı). Bu partinin
zone'lu dosyaları (AT100/M110, B1124) aynı geminin standart adlandırması; zone'suz `<NPS>x<NPS>`
ailesiyle (4Ax2A, 10Ax6A) AYNI gemide yan yana yaşıyor. Madde 0 (kimlik çıkarımı) her iki kalıbı
da tek gemi içinde kapsamak zorunda — "gemi başına tek adlandırma" varsayımı v4 ile resmen öldü.

### 8g. ⚠ 157 DÜZELTMESİ — 8f'nin teşhisi KANITLA DEVRİLDİ (MK-157.1/3/4)

8f'deki "kırık nokta KİMLİK çıkarımı, `10Ax6A 1(2).S01.1.pdf` kalıbı kapsam dışı" cümlesi
**yanlıştı**. 157 kanıt zinciri (node regex testi + SQL anatomi + canlı tur):

1. **dosyaAdiParse kalıbı ZATEN tutuyordu** (9/9: zone'suz, segmentli, 4-segment, zone-harf).
   Pipeline 22/22 doğru çıkmıştı; sebep `kabukta_yok` idi.
2. **kabukta_yok YAPISALDI** (MK-157.1): hhbjşlö TASLAK devreydi — eslestir() spooller'dan okur,
   taslak spooller'a yazmaz (MK-127.4). Terfi + backfill sonrası 22/22 eşleşti.
3. **Backfill 140'tan beri production'da ölüydü** (ERR_REQUIRE_ESM, MK-157.2) — "terfi sonrası
   bağlanmıyor" algısının gerçek kökü. fix(157) ile dirildi.
4. **`.SXX`'siz 22 dosya "tablosuz çizim" değil M+İ çiftinin MONTAJ kanadıydı** (MK-157.3).
   Montaj fingerprint'inde dosya_adi_regex yoktu; "Continue:" tek-segmentlide ateşlenmez, malzeme
   tablosu yapısal yok → producer 1 < eşik 2 → NULL → genel L3 çöpü. 39a2c81b'ye dosya_adi_regex
   öğretildi (36/36 ad testi) → 22/22 montaj L2/$0, eşleşme 22/22.
5. **MK-157.4:** 8f dönemindeki "yalnız 12Ax12D çözülmüş" okuması kuyruk durumu (oneri_hazir) ile
   eşleşme durumunun (eslesti) karışmasıydı — ikisi ayrı kolondur.

SONUÇ: NB1124 44/44 kapandı. Madde 0 "kimlik çıkarımı genişletmesi" bu set için GEREKSİZDİ;
üç-katman modeli (MK-156.3) geçerli kalır ama bu vakanın kırığı katmanlarda değil, (a) taslak
yaşam döngüsünde, (b) ölü backfill'de, (c) montaj fingerprint eksiğindeydi. Teşhis sırasına
EK adım: kabuk/PDF anahtarlarından ÖNCE devre durumu (taslak/aktif) kontrol edilir.
