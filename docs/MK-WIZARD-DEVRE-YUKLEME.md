# MK-WIZARD — Devre Yükleme Akışı (Yeniden Tasarım)

> **Oturum:** 106
> **Durum:** Tasarım onayı alındı (Cihat). Kod yazılmadan önce omurga.
> **İlke:** *"Devreleri yüklerken hata yaparsak programın geri kalanına kimse itibar etmez."*

---

## 0. Temel İlke — Otorite Kabuktur, PDF Değil

Wizard **PDF sayısına güvenmez.** Bir klasördeki PDF'ler eksik, fazla, bozuk veya
karışık sıralı olabilir. Bu yüzden devrenin **spool listesi (kabuk)** önce resmi bir
kaynaktan kurulur; PDF'ler ve diğer dökümanlar bu kabuğa **karşı çetelelenir**, kabuğu
tanımlamaz.

Üç hata sınıfı asla sessizce geçmez:
- **Eksik:** kabukta var, dökümanı yok/okunamadı
- **Fazla:** döküman var, kabukta yok
- **Şüpheli:** eşleşti ama parse zayıf / güven düşük

Sessiz tamamlama YOK. Mutabakat ekranı geçilmeden devre "tamamlandı" olmaz.

---

## 1. Spool Listesi (Kabuk) Kaynakları

Devrenin spool kümesi (S01…Snn) üç kaynaktan biriyle doğar. Çıktı hep aynıdır:
**beklenen spool kümesi.**

| Kaynak | Ne zaman | Güven |
|--------|----------|-------|
| **K1 — IFS / Excel** | Tersaneden tatmin edici veri geliyorsa (formatı bir kez tanıtılır) | Yüksek |
| **K2 — Program şablonu** | IFS yoksa: tersane şablonuna göre Excel **dışarıda** hazırlanıp önce yüklenir | Yüksek |
| **K3 — PDF'lerden çıkar** | Son çare: PDF'lerden bulunan spool'lar + "doğrulanmadı" damgası | Düşük |

**Karar:** K1 ve K2 birincil. K3 sadece zorunlu hallerde, damgalı.

### Boş Şablon Üretimi (MK-WIZARD.1)
K2'de kullanıcı Excel'i "dışarıda hazırlar" — ama **boş şablonu wizard üretir** (elle
kurma = hata kaynağı). Format kurulunca wizard **"Boş şablon indir"** verir: içinde o
tersanenin spool-no deseni + sütun başlıkları hazır. Kullanıcı doldurup geri yükler.

---

## 2. Spool No Formatı — Tersane/Gemi Bazında, Bir Kez

Kompozit spool ID (örn. `NB1124-G200-350-FR38-Galv-S01`) tersaneye göre değişir:
bazısında hazır gelir, bazısında biz parçalardan kurarız.

**Tek mekanizma — "her zaman parçalardan kur, hazır geleni parçalarına ayırıp doğrula":**
- **Hazır geliyorsa:** kompoziti kurala göre **parçala** → her parçayı PDF/devre karşılığıyla
  **çapraz doğrula** → uyuşmazlıkta kullanıcıya sor.
- **Biz kuruyorsak:** parçaları (proje=devreden, pipeline+spool=PDF'ten, yüzey=devreden…)
  toplayıp kurala göre **birleştir**.

İkisi de aynı **alan haritası**nı kullanır (yön farklı: ayrıştır vs birleştir).

**Format tenant'a kaydedilir, wizard'da önizlenir:**
> "Spool isimleri böyle görünecek: NB1124-G200-350-FR38-Galv-S01"
> [Yanlışsa burada düzelt]

Netleşince tersane/gemi başına nadiren değişir. (Format kütüphanesi felsefesiyle aynı:
*bir format otur, hepsi aynı altyapıda.*)

### Önerilen şablon yapısı (taslak — `spool_no_sablonu`, tenant bazlı)
```
kaynak_tipi      : ifs | sablon | pdf
kompozit_kural   : "{proje}-{pipeline}-{sistem}-{frame}-{yuzey}-{spool}"   (varsa)
spool_no_deseni  : "S{:02d}"   (S01, S02…)
alan_kaynaklari  : { proje: devre, pipeline: pdf, frame: ?, yuzey: devre, ... }
```
> ⚠️ Açık soru: `frame` (FR38) ve `350` (sistem?) alanları nereden geliyor — PDF'te var mı,
> başka kaynaktan mı? **Örnek Excel satırı + PDF dosya adı gelince netleşecek.**

---

## 3. Eşleştirme — resim_no + spool_no (içerikten BAĞIMSIZ)

**Kritik bulgu (106, 2 örnek):** İzometri *içeriğini* parse edip eşleştirmek Tersan'da
(text-PDF) çalışır ama PAOR'da (image-PDF, metin yok) çalışmaz. İkisinde de ortak ve
güvenilir olan iki şey var → eşleştirme bunlara dayanmalı, parse'a değil:

1. **Resim/çizim no** — Tersan'da pipe no gövdesi (`M100-262-302-47`), PAOR'da çizim no
   (`52600-102778-A`). **Dosya adından** güvenle çıkarılır (Cihat onayı); Excel'de yedek sütun.
2. **Spool no** — S01, S02 (Tersan PDF'te yazılı; PAOR'da çizimde [1]/[2] + Excel'de).

```
Eşleştirme anahtarı:  resim_no + spool_no   → image-PDF'te de çalışır (içerik parse'ı şart değil)
Proje kodu:           PDF "B1110" ↔ devre "NB1110" → 'N' ön-eki normalize edilip teyit
```

### İlişki N:N (MK-WIZARD.5)
- **Bir resim → çok spool:** PAOR örneği — `11D-PAOR-52600-102778-A` tek çizimde [1]+[2] = S01+S02.
- **Bir spool → çok resim:** detay + montaj sayfaları aynı spool'a bağlanır
  ("detaydan aynı resme bağlantı" — Cihat).
- Çözüm: bağ tablosu **`spool_dokumanlari`** (spool_id ↔ devre_dokuman_id), ortak alan resim_no.

### İki tersane karşılaştırması (doğrulanmış örnekler)
| | Tersan (M100-262) | PAOR (Z06) |
|--|--|--|
| Kompozit | `NB1110-M100-262-302-47-S01` | `NB1110-Z06 52600-102778-A-S01/S02` |
| PDF tipi | text (L2 mümkün) | **image (L2 imkânsız, L3/Excel zorunlu)** |
| Resim no | pipe no gövdesi `M100-262-302-47` (dosya adı) | çizim no `52600-102778-A` (dosya adı) |
| 1 PDF = | 1 spool | **2 spool** |
| proje (PDF) | B1110 → NB1110 | NB1110 |

> Not: Sadece bu 2 tersane sağlam kurulur. Üçüncü gelince aynı altyapıya 1 satır eklenir
> (format kütüphanesi felsefesi) — havada genelleme yapılmaz.

---

## 4. Soru Sorma Politikası — "Bu mu / Bu mu", Asla Sınav

Kullanıcıya soru sorma izni var (Cihat onayı) ama **sadece cevabı bir şeyi değiştiren
belirsizlikte.** Bilineni veya cevabı hiçbir şeyi değiştirmeyeni sorma.

**Eşik mantığı:**
| Durum | Aksiyon |
|-------|---------|
| Net eşleşme (spool_no + pipeline + proje tutuyor) | **Sessiz kabul**, soru yok |
| Kısmi eşleşme (spool_no tutuyor, pipeline farklı) | **Tek soru:** "Bu PDF S07 mi S17 mi?" + özet |
| Eksik (kabukta var, PDF yok) | Kırmızı; "sonra eklerim" onayı (spool silinmez) |
| Fazla (PDF var, kabukta yok) | "Yanlış dosya mı, listeye eklensin mi?" |

**İki soru sınıfı (karıştırma):**
- **Eşleştirme sorusu** (geri alınabilir, ucuz): akış içinde, hızlı.
- **Kabuk sorusu** (pahalı, kabuğu etkiler): ayrı/vurgulu, dikkatli.

Sorular: kolay, seçmeli, açıklama gerektirmez. "Bu mu, bu mu, yoksa bu mu."

---

## 5. Eksik PDF ≠ Eksik Spool (MK-WIZARD.2)

Bir spool'un PDF'i bugün gelmemiş olabilir ama spool **yine de devrede var** (kabuktan).
Mutabakat "S07 eksik" derken **spool'u silmez** — "S07'nin izometrisi henüz yok" der.
Spool kaydı kabuktan gelir, PDF sonradan eklenir. İmalatın "spool var, çizimi bekliyor"
gerçeğine uyar.

---

## 6. Kabuk Kilidi (MK-WIZARD.3)

Spool kabuğu onaylandıktan sonra (S01…S25 sabit), döküman aşamasında kabuk **değişmez** —
PDF'ler ona eşleşir. "Aslında 26 spool varmış" çıkarsa → **bilinçli geri-adım** (kabuğa
dönüş), sessizce 26'ya çıkmaz. Kabuk = imzalı sözleşme.

---

## 7. "Doğrulanmadı" Damgası (MK-WIZARD.4)

PDF'ten okunan ama Excel/şablonla teyit edilmemiş alan (parse zayıf, güven düşük) →
spool kaydında gizli **"doğrulanmadı"** bayrağı. Devre detayda sarı görünür, sonradan
teyit edilebilir. Sistem **uydurmaz**, "emin değilim" der. ("Uydurmadan tam doğru"
hedefinin teknik karşılığı.)

---

## 8. Önerilen 5 Adımlı Akış (kod değil, ekran ekran)

```
Adım 1 — DEVRE & KAYNAK SEÇ
  • Devre seç (mevcut) veya yeni devre
  • "Spool listesi nereden gelecek?"  → K1 IFS / K2 Şablon / K3 PDF
  • (K2 ise) "Boş şablon indir" sunulur

Adım 2 — KABUK OLUŞTUR
  • K1: IFS Excel yükle → parse → beklenen küme (S01…Snn)
  • K2: Doldurulmuş şablon Excel yükle → küme
  • K3: (sonraki adımda PDF'lerden, damgalı)
  • Çıktı: beklenen spool kümesi + sayısı

Adım 3 — FORMAT ÖNİZLE & ONAYLA
  • "Spool isimleri böyle görünecek: NB1124-G200-350-FR38-Galv-S01"
  • Yanlışsa düzelt → KABUK KİLİTLENİR (Madde 6)

Adım 4 — DÖKÜMAN YÜKLE & EŞLEŞTİR
  • Klasör/dosya sürükle-bırak (mevcut tip tespiti: klasör adı → ad-katmanı → uzantı)
  • Her PDF parse → spool_no/pipeline çıkar → kabuğa eşleştir (Madde 3)
  • Belirsizde "bu mu/bu mu" sorusu (Madde 4)
  • izometri PDF → izometri-oku (L2/L3) → NOT + alıştırma ipucu dahil (Oturum 106 işi)

Adım 5 — MUTABAKAT (değişmez kalp)
  ┌─────────────────────────────────────────────┐
  │ Beklenen: 25 spool (kaynak: IFS Excel)        │
  │   ✅ Eşleşen + okundu      22                  │
  │   🟠 Eşleşen, parse zayıf   1   → [kontrol et] │
  │   🔴 Eksik (PDF yok)        2   → S07, S14     │
  │   ⚠️ Fazla (listede yok)    1   → S26          │
  │  [Eksikleri kabul et+devam]  [Geri dön, ekle] │
  └─────────────────────────────────────────────┘
  • Bu ekran geçilmeden devre "tamamlandı" olmaz. 23/25 asla sessiz geçmez.
```

---

## 9. Mevcut Wizard ile İlişki (103 durumu)

103-A şunu yapıyor (BİTMİŞ):
- 4 adım (Devre Seç → Dosya Yükle → Onay → Yükleme)
- Dosya tip tespiti (klasör adı → Excel ad-katmanı → uzantı → diger)
- BOM Excel → `dosya_isleme_kuyrugu (parser='excel-generic')` → oto-parse → `parse_sonuc`

Bu yeniden tasarım **103-A'yı genişletir, çöpe atmaz:**
- BOM oto-parse → **kabuk kaynağı K1/K2** olur (zaten parse ediyor, "beklenen küme"ye bağla)
- izometri PDF → şu an `'sakla'` (103-B eksik) → **izometri-oku'ya yönlendir** (MK-49.B)
- Yeni: kaynak seçimi, format önizleme, kabuk kilidi, mutabakat ekranı

---

## 10. Açık Sorular (106'da netleşenler ✓ / kalanlar)

**Netleşti (106):**
1. ✓ **Proje kodu:** PDF `B1110` ↔ devre `NB1110` — `N` ön-eki normalize, devreden alınır.
2. ✓ **Resim no:** dosya adından güvenle çıkarılır; Excel'de yedek sütun.
3. ✓ **N:N ilişki:** bir resim→çok spool (PAOR) + bir spool→çok resim (detay+montaj) — ikisi de
   desteklenir → `spool_dokumanlari` bağ tablosu.
4. ✓ **Kapsam:** sadece Tersan + PAOR sağlam kurulur; 3. tersane gelince 1 satır eklenir.

**Kalanlar (sonraki oturum):**
5. **Kaynak modeli:** K1/K2/K3 üçlüsü onaylandı mı, sadeleştirme mi?
6. **Şablon depolama:** `spool_no_sablonu` ayrı tablo mı, `izometri_format_tanimlari` kardeşi mi?
7. **Kabuk → spool kaydı:** Kabuk onaylanınca spool'lar hemen `spooller`'a mı, mutabakat sonrası mı?
8. **MK-49.B routing:** izometri PDF → `dosya_isleme_kuyrugu (parser='izometri')` + yeni worker
   `/api/kuyruk-isle-izometri` (BOM deseni) — PAOR image-PDF'i L3'e, Tersan text-PDF'i L2'ye gider.
9. **resim_no çıkarma deseni:** Tersan (pipe no gövdesi) ve PAOR (çizim no) için dosya adı regex'leri.

---

## 11. İlgili Mimari Kararlar

- **MK-49.1:** `izometri-oku.js`'e dokunma — çağır, değiştirme.
- **MK-104.1:** izometri-batch Excel-only; wizard devreye bağlanır (ayrı tüketici, aynı motor).
- **Oturum 106:** L2 parser NOT yakalama + KISMI alıştırma ipucu (089) — wizard izometri
  parse'ı bunu doğrudan devre/QR ekranına taşıyacak.
- **9. oturum dedup felsefesi:** sessiz birleşme yok, açık onay — mutabakat ekranı bunun
  devamı.

---

> Bu belge wizard yeniden tasarımının omurgasıdır. Kod yazmadan önce Madde 10'daki açık
> sorular netleşmeli. Sonraki oturum açılışında okunacak.
