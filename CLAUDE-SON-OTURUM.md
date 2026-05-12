# CLAUDE — 78. Oturum (12 Mayıs 2026)

> 76 → 77 → 78 kütüphane mini-projesi zinciri. PN 10 cephesi tamamlandı, M_K iki katına çıktı (10 → 20), gemi P0 CuNi cephesi açıldı.

---

## Ana Tema

Üç çizgide paralel ilerleme:
1. **Flansh kütüphanesi:** EN 1092-1 PN 10 cephesi tam (77 T05+T11 + 78 T01+T12 = 32 satır)
2. **Malzeme kataloğu:** 77 omurga + ilk 10 spec → 78 sonrası 20 spec (gemi P0 cephesi tam, paslanmaz P0-P1 genişledi)
3. **Belge hijyeni:** 5+ aylık birikim (KUTUPHANE-YUKLEME-TAKIP.md v3) + 77'de atlanan kapanış üçlüsü disipline alındı

---

## Açılış — 77 Envanteri

`git pull` çıktısı `77: kapanis - B0 omurga + PN10 16 satir + 8 MK + 041 rename fix` mesajıyla geldi. İlk yorumum: "PN 10 16 satır, ne kondu?"

Cihat'ın gönderdiği `.github/son-durum.md` ve `CLAUDE-SONRAKI-OTURUM.md` dosyaları 76 başlıklıydı (yani 77'de kapanış üçlüsü atlandı). Bu büyük bir keşif: bir sonraki oturum eski belgeyle çalışıyor olabilir.

GitHub migrations dizininin ekran görüntüsünü yakalayınca tam manzara çıktı:
- `040_malzeme_kataloglari_b0.sql` (77)
- `041_inserts_b3619m_dn350_600_40s80s.sql` (76 → 77 rename)
- `042_inserts_en1092_pn10_t05_t11.sql` (77)

Yani 77 aslında **üç migration birden** yapmış, "041 rename fix" 76'nın eski 040'ının 041'e taşınması, B0 ve PN10 yeni dosyalar.

**MK-78.1 doğdu:** Migration numarası atamadan önce GitHub dizinine bak. Ben 042'ye yazmıştım, çakışma vardı. Cihat'ın ekran görüntüsü kurtardı.

---

## Migration 043 — EN1092-1 PN 10 T01 + T12

### Kapsam Kararı (KARAR-78.1)

PN 16 cephesi 76'da 4 tip × 15 DN = 60 satır olarak tam kapatılmıştı. 77 PN 10'a iki tip (T05+T11) × 8 DN = 16 satır koymuştu (DN 200-600). T01 plate + T12 hubbed slip-on eksikti.

İki seçenek tartıldı:
- **α (geniş):** β + küçük DN'ler (DN 10-150, 7 DN × 4 tip = 28 satır) = toplam 44 satır
- **β (dar):** sadece DN 200-600 × T01+T12 = 16 satır

ProjectMaterials Type 01 PN10 tablosu açıldığında **DN 200'den başlıyordu** (DN 10-150 satırları kaynakta yok). Bu doğrulama β kararını üç yönden destekledi:
1. Gemi tersane profili (PN 10 büyük çapta yaygın, küçük çap PN 16'da karşılı)
2. Kaynağın doğal kapsamı (PN 10 Type 01 standart üretim DN 200+)
3. Oturum büyüklüğü (16 satır 1 saatte biter, 44 satır oturumu sarkıtır)

### Veri Kaynağı

İki bağımsız kaynak (MK-75.3):
- **ProjectMaterials EN 1092-1 Plate Flange PN10** — T01 için 8 DN × 9 alan tablo, weight dahil
- **pipefittingweb EN 1092-1 PDF** — Type 01/02/04/05/11/12/13/21 hepsini tek tabloda, T12 için N1 hub_od + H1 hub_length + R1 corner

T01 PN10 değerleri %100 örtüştü iki kaynak arasında.

T12 için tek kanonik kaynak (pipefittingweb PDF) kullanıldı, ama T11 PN10 DN200 değerleri (N1=234, H2=62, S=6.3) DB'de mevcuttu ve PDF ile birebir eşleşti → kaynak güvenilir.

### Pattern

LATERAL JOIN ile T11 PN10 satırlarından `D, K, b, RF_OD, RF_h, A (boru OD), bolt_circle, bolt_count, bolt_holes_inch, bolt_cap_inch` reuse edildi (MK-76.2). T01 için sadece `weight` override, T12 için `hub_od_mm + hub_uzunluk_mm` eklendi.

Sonuç: DN 200 detay testi → T01/T05/T11/T12 dörtlüsü aynı D/b/K/n/M paylaşıyor, sadece hub farklı (T01/T05: NULL/NULL, T11: 234/62, T12: 246/44). EN 1092-1 tip-spesifik geometri doğru.

---

## P0 Hijyen Üçlüsü

76 ve 77'de atlanan üç P0 borç temizlendi.

### Adım 1 — M_K Durum Tespiti

77'nin `040_malzeme_kataloglari_b0.sql`'i okundu (cat ile). İki şey ortaya çıktı:
1. Tablo şeması zengin: GENERATED `spec_kodu`, malzeme_grubu/aile enum'ları, 4 uygunluk flag (boru/bw/forged/flansh), CHECK `en_az_bir_uygun`, partial unique (sistem + tenant)
2. 77 sadece CREATE TABLE değil, **5 spec içerik** de eklemiş

DB sorgusu 10 satır verdi (5 değil!), yani 77 daha geniş çalışmış:
- Karbon: A53/A106/A234/A105/EN10216 (5)
- Paslanmaz: A312/A403/A182 ×TP316L (3)
- CuNi: B466 C70600 + C71500 (2)

**Önemli bulgu:** `malzeme_kataloglari` (yeni, B0) ile `malzeme_tanimlari` (eski, 19. oturumdan UI/IFS köprüsü) farklı tablolar. 76 son-durum.md "12 satır" derken `malzeme_tanimlari`'na işaret ediyormuş, ben karıştırmıştım.

### Adım 2 — fitting_olculer Kırılımı

424 satır, hepsi `B16.9`. 8 parça tipi × 33 DN:
- reducer_ecc 114 + reducer_conc 114 (DN kombinasyon)
- cap 33 + 90LR 33 + 45LR 33 + tee_eq 33
- 90_3D 32 + 45_3D 32

`schedule_kod` hepsi NULL — B16.9 schedule bağımsız ölçüler, standart davranış.

v2 belgesindeki "~2500 satır beklenir" tahmini aşırı şişikmiş. Gerçek standart kapsamı 424 ve bunun %85'i dolu. Eksikler: 90SR, 180LR return, tee_red eşitsiz, stub_end (A2 görevi), B16.11 socket, B16.28 short radius, EN 10253.

### Adım 3 — KUTUPHANE-YUKLEME-TAKIP.md v3

Belge 43. oturumdan beri (5+ ay) güncellenmemişti. v3 olarak sıfırdan yazıldı:
- v2 → v3 senkron notu (büyük düzeltmeler dökümü)
- Özet tablo (10 modül, gerçek DB sayıları)
- 7 ana modül detay (kırılımlar + öncelikler + 80 sonu hedefler)
- 5 önemli iz (M_K vs m_tanimlari karışıklığı, B16.9 tek-standart, β kapsam vb.)
- 79+ pratik iş sırası (6 somut adım)

Eski v2 `docs/_arsiv/KUTUPHANE-YUKLEME-TAKIP_v2_43.md` olarak korundu (geçmiş referansı). v3 push edildi (commit `cfcb5ba`).

**MK-78.4 doğdu:** `&&` zincirinde mkdir → mv sırası yanlış kurulmuştu, ilk komut fail oldu zincir durdu. "Önce yer aç, sonra koy."

---

## Migration 044 — M_K CuNi Fitting + Flansh

### Niye Bu Cephe Kritik

Gemi tersane (Yalova) profili: deniz suyu sistemi = CuNi. Paslanmaz klorid pitting yapar, karbon korozyon. CuNi çözümdür. 77 sadece boru spec'i koymuş, fitting + flansh eksikti — gemi P0 cephesi yarım kalmış.

### Veri Kaynağı

- **copper.org/applications/marine/cuni/standards** — ana referans, ASTM + EEMUA + DIN listesi
- **cnkpipefitting.com** — B151 forged flange detayı
- **Solitaire Overseas** — B466 seamless + B467 welded
- **PM International CuNi datasheet** — mukavemet, density

### Karar: 3 Spec Türü

Pratikte CuNi malzeme spec'leri:
- **ASTM B466** — seamless boru + seamless BW fitting (mevcut, ama fitting flag eksikti)
- **ASTM B467** — welded boru + welded BW fitting (büyük çap için ekonomik)
- **ASTM B151** — forged rod/bar (flansh + küçük forged fitting)

Operasyon: 2 UPDATE (B466 fitting flag) + 4 INSERT (B467 ve B151 × C70600 + C71500) = M_K 10 → 14.

### Mukavemet Değerleri

| Grade | TS min (MPa) | YS min (MPa) | Density |
|---|---|---|---|
| C70600 (CuNi 90/10) | 275 | 105 | 8940 |
| C71500 (CuNi 70/30) | 345 | 138 | 8940 |

C71500 daha yüksek hız servisi için, mukavemeti daha yüksek (Ni içeriği yüksek). Sıcaklık aralığı her ikisi: -100 ila 200°C.

---

## Migration 045 — M_K Paslanmaz Genişleme

### Kapsam

Mevcut sadece TP316L (3 spec: A312/A403/A182). Eksik:
- **TP304L** (P0 yaygın, gemi mutfak + sıhhi tesisat + paslanmaz hatlar)
- **TP316** (P1, 316L'nin yüksek karbonlu kardeşi, kaynak edilmemiş parçalar için)

6 INSERT: 2 grade × 3 spec türü.

### Mukavemet (A312/A403/A182 aynı grade aynı min)

| Grade | TS min | YS min | Density |
|---|---|---|---|
| TP304L / WP304L / F304L | 485 MPa | 170 MPa | 7900 (Mo'suz) |
| TP316 / WP316 / F316 | 515 MPa | 205 MPa | 7980 (Mo'lu) |

L versiyonları (304L, 316L) düşük karbon = düşük mukavemet ama kaynak sonrası IGC dirençli. Yüksek karbonlu versiyon (316) daha güçlü ama kaynak edilmemiş parçalar için ideal.

### Yakalanan Hata (MK-78.5)

İlk SQL taslağında TP316 satırlarının kolon sırası karışmıştı:
```
('ASTM A312', 'TP316', 'paslanmaz', 'ASTM',
 7980, 515, 205, -196, 425,           <-- yanlış: flag bloğu olmalıydı
 true, false, false, false,           <-- numeric bloğu sonradan gelmeli
 ...)
```

TP304L satırları doğru, TP316 satırları yanlış. str_replace ile düzeltildi. **Yakalanmamış olsaydı:** CHECK `en_az_bir_uygun` violation alacaktı (7980 = boolean false değil, type cast hatası önce gelirdi).

Disiplin: VALUES yazımında her satırda **aynı dikey hizalama** (flag bloğu → numeric bloğu → text bloğu). Göz hatayı yakalar.

---

## DB Değişiklik Özeti

```
flansh_olculer:        292 -> 308  (+16, migration 043)
malzeme_kataloglari:    10 -> 20  (+10, migrations 044+045, iki kat)
```

### M_K Kırılım (78 sonu, 20 satır)

| Grup | Spec | Notlar |
|---|---|---|
| Karbon | 5 spec | A53/A106/A234/A105/EN10216 — 77 omurgada eklendi |
| Paslanmaz | 9 spec | TP316L + TP304L + TP316 × A312/A403/A182 |
| CuNi | 6 spec | B466 + B467 + B151 × C70600/C71500 |

### Flansh Kırılım (308 satır)

- ASME B16.5: 216 (mevcut)
- EN 1092-1 PN 16: 60 (76'da kapatıldı)
- EN 1092-1 PN 10: 32 (77: T05+T11 16, 78: T01+T12 16) — **cephe tam**

---

## Süreç Notları

### Disiplin Uygulamaları

- `gp` push 3 kez sorunsuz çalıştı
- MD5 transfer doğrulaması her dosyada (3 SQL + 1 markdown)
- Heredoc yerine present_files kullanıldı (Mac üstünde MK-51.1 protokolü)
- Power outage senaryosu (045 push sırasında elektrik kesintisi) — git atomik commit garantisiyle bütünlük korundu, sadece tarayıcıdan migrations dizini doğrulandı

### Karar Yorgunluğu Yönetimi

78 büyük bir oturumdu (4 büyük iş). β/α kapsam kararları, hijyen seçimleri, migration sıralaması — Cihat'a sade çoktan seçmeli sunmaya özen gösterildi. Bir karar Cihat'a bırakıldı ("sen öner ve başla" — KARAR-78.1 β kapsamı).

Erken bir noktada **kapanış reflexine kapıldım** ("PR oldu = oturum bitti"). Cihat haklı olarak "daha yeni başladık" dedi → reflex durduruldu, oturum devam etti, asıl iş şimdi yapıldı.

---

## Mimari Karar Kayıtları (MK) — 78'de doğan

- **MK-78.1:** Migration numarası atamadan önce GitHub migrations dizinine bak. `git pull` çıktısı + son commit mesajı YETMİYOR; numara çakışması silent dosya kaybı riski.
- **MK-78.2:** Cihat ekran görüntüsü gönderirse o **belge bana açılan tek pencere** — reflexle hemen yansıt, DB sorgusu kadar değerli.
- **MK-78.3:** Kapanış üçlüsü hiçbir koşulda atlanmaz. 77'de atlanması bir sonraki oturumu eski belgeyle başlattı.
- **MK-78.4:** `&&` zincirinde prerequisite (mkdir) önce, hedef-bağımlı (mv, cp) sonra. "Önce yer aç, sonra koy."
- **MK-78.5:** SQL `VALUES (...) AS v(kolonlar)` pattern'inde her satırda **dikey hizalama** (flag bloğu / numeric bloğu / text bloğu). Kolon sırası karışıklığı göze çarpsın. 045'te bu sayede yakalandı, CHECK violation önlendi.
- **MK-78.6:** 77'nin `040_malzeme_kataloglari_b0.sql`'inde explicit `BEGIN; ... COMMIT;` kullanılmış (MK-76.1 ile çelişiyor). Çalıştığı için sorun yaratmadı ama gelecek migration'larda implicit transaction kalsın.

---

## 79'a Hazırlık

KUTUPHANE-YUKLEME-TAKIP.md v3 belgesindeki "Pratik İş Sırası" 6 somut adım veriyor:

1. M_K CuNi fitting+flansh ✅ (78'de yapıldı)
2. M_K paslanmaz grade'leri ✅ (78'de yapıldı, TP304L+TP316)
3. EN 1092-1 PN 25 paketi (~2 sa) — flansh_olculer %38 → %53
4. B16.9 stub_end (A2, ~1.5 sa) — fitting cephesinde 6. parça tipi
5. B16.11 socket fittings (~3-4 sa) — fitting_olculer ikinci standart
6. M_K A333 + A420 (~30 dk) — düşük sıcaklık karbon (gemi ambar)

İlk 2 madde 78'de bitti. Sıradaki 4 madde 79 için adaylar — Cihat seçecek.

---

> 79. oturum açılışında bu dosya + `son-durum.md` + `CLAUDE-SONRAKI-OTURUM.md` okunacak.
