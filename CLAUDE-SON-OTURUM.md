# Oturum 139 — B-çap kapanışı + operatör düzeltme döngüsü tasarım turu

Oturum iki somut işle başladı, bir tasarım turuyla bitti. Kural boyunca korundu: körlemesine yazma yok,
her adım koşan kod/DB kanıtıyla, kod öncesi mimari doküman (MK-126.8 / MK-129'dan beri açık doküman borcu).

## 1. B-çap sürprizi — ÇÖZÜLDÜ (MK-139.1)
138'de kök bulunup 139'a bırakılmıştı. Fix planlı görünüyordu (grupla'ya türetme ekle) ama **iki parça**
çıktı ve ikincisi ancak dosyalar tek tek okununca ortaya çıktı:
- `ares-kabuk.js grupla()` spool başlığına cap/et yazmıyordu (türetme yalnız `aktar()`/terfide).
- `lib/izo-eslesme.js incelemeTablosu` çıktı spool'unu **whitelist** ediyor (spread değil) → grupla
  düzelse bile endpoint cap/et'i atıyor.
Üç tur kısmi-kanıttan-yanlış-çıkarım yaşandı (endpoint "geçiriyor" → satır 42 "çıktı çapı" → asıl whitelist
izo-eslesme'de), her biri bir sonraki dosyayla düzeltildi. **Ders:** MK-126.8 tam burada işe yaradı —
endpoint/lib görülmeden mühürlenseydi yanlış olurdu. Kabuk spool'unun çıktıya taşınan alanları tek noktada
(`incelemeTablosu` iki return dalı) belirleniyor.
Fix: grupla'ya `aktar()` ile birebir türetme; incelemeTablosu iki dalda cap/et. Container'da node --check ×2 +
orijinal self-test + uçtan uca halka testi. commit `862e965`, CI yeşil, Vercel Ready.

## 2. PARSER dokümanı — Bölüm 13 + yol haritası
Cihat dokümanı önce hazırlamak istedi (doğru — 129 borcu). Mevcut 1029 satıra cerrahi ekleme: Bölüm 13
(operatör düzeltme döngüsü vizyonu, G2/G3/G4 var-yok kod kanıtıyla, Q1-Q6 karar), §12.2 ÇÖZÜLDÜ, banner 139.
commit `4a5798f`. Sonra Cihat üç-faz yol haritasını netleştirdi → 0.0 bölümü.

## 3. Tasarım turu (kod yok)
- **Q5 (popup düzeltme nereye):** Cihat "doğru olan neresi sence" dedi. Öneri+gerekçeyle **ayrı taslak-düzeltme
  tablosu** seçildi; döngü (yayılma) kalıcı+sorgulanabilir düzeltme istediği için. Dokümana KARAR olarak işlendi.
- **Q2 (değer mi kural mı):** türe göre ayırma önerildi (Tür A glyph=kural/$0, Tür B değer=o spool). Cihat
  karar yerine **"neredeyiz/ne kalmış"ı görmek** istedi → Q2 140'a bırakıldı.
- **Yol haritası (Cihat):** Faz 1 yapısal tamamlama → Faz 2 Tersan doygunluk testi → Faz 3 formatlar.

## 4. Yeni teşhis borcu
Cihat: "kütüphane var ama yüklenen malzemeler hiç tanınmıyor — wizard yaparken kopukluk oldu." Kök BİLİNMİYOR;
tahmin yapılmadı. Teşhis planı §13.7'ye yazıldı, 140 ilk iş.

## Süreç notu
B-çap'ta üç patch container'da gerçek dosya kopyasında node --check + birim/halka testten geçti, MD5'le
transfer edildi. Terminal yapıştırmada `#` yorum + `<placeholder>` zsh hatalarına yol açtı (benim yorumlu/
placeholder'lı blok hatam) — çıplak komuta dönüldü. `arespipe_kopyala` üç argüman ister (kaynak/hedef/md5);
ilk iki-argümanlı denemede sessizce kopyalamadı, MD5 yakaladı.

## Mühür
MK-139.1 (B-çap iki-parça fix; taslak=terfi). Q5 KARAR (ayrı taslak-düzeltme tablosu). Bölüm 13 + 0.0
tasarım turu — Q1-Q4/Q6 açık.

## 140 ilk iş
Malzeme↔kütüphane tanıma kopukluğu TEŞHİSİ (§13.7) — kod yok, okuma turu. Sonra Q2 + G2a.
