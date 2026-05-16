# 93. Oturum Gundemi

> Push sonrasi canli test + Bug 1 (fitting/flansh malzeme_grubu NULL) cozumu.

---

## 93 Acilis Ritueli

Standart 2 kontrol:

```
1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
2. Bugun ne yapmak istiyorsun?
```

**Beklenen 1. cikti:** Son 5 commit 92 isleri olmali. Branch temiz.

**Beklenen 2. cevap:** "92'yi test edelim" veya "Bug 1'i cozelim" veya "kaldigimiz yerden".

---

## Bilgi Onceligi

**ILK MESAJ:** `docs/93-DEVRALINAN-BUGLAR.md` chat'e yapistirilabilir. Eger Claude project knowledge'da bulamadiysa Cihat manuel yapistirir. Belge 220 satir, 3 bug + cozum secenekleri.

---

## 93'un Ana Isi

### 1. Push sonrasi canli test (~15 dk)

Vercel preview deploy ~2-3 dk surer. Sonra:

**Ana sayfa (`admin/kutuphane.html`):**
- [ ] "Bekleyen Oneriler" karti iki sayim gosteriyor mu?
- [ ] "Cakismalar" karti goruluyor mu (yeni)
- [ ] `ozel` karti yok mu (silindi)
- [ ] `uyum` karti 3 capraz tabloyu listeliyor mu
- [ ] Detay sayfasi olmayan tablolar tooltip gosteriyor mu

**Oneriler sayfasi (`admin/kutuphane-oneriler.html`):**
- [ ] Tablo satirlarinda "+ Ekle" butonu var mi
- [ ] Buton tikla -> modal aciliyor mu
- [ ] DN otomatik dolu mu (114.3 -> 100)
- [ ] Agirlik formulu dogru hesap yapiyor mu
- [ ] Malzeme grubu degisince agirlik yenileniyor mu
- [ ] Submit -> RPC -> toast cikiyor mu

**Cakismalar sayfasi (`admin/kutuphane-cakismalar.html`):**
- [ ] Sayfa aciliyor mu
- [ ] Super admin yetkisi var mi (yetkisiz kullanici redirect olmali)
- [ ] Bos liste mesaji goruluyor mu

### 2. Bug 1 -- fitting/flansh malzeme_grubu NULL

**On kosul:** `docs/93-DEVRALINAN-BUGLAR.md` okunmus olmali.

3 secenek:
- **A) Hizli UPDATE 'karbon'** (~30 dk) -- yamacik cozumu
- **B) malzeme_grubu kolonunu kaldir** (~2 saat) -- mimari fix, KARAR-43 ile uyumlu
- **C) Erteleme** (~3 saat) -- her satirin standardindan tahmin

Onerilen: **A veya B**, pilot tersane durumuna gore.

### 3. Geri kalan 93 isleri (Bug 1 sonrasi)

- **Fitting/flansh icin Kutuphaneye Ekle RPC'leri** -- `ozel_parca_fitting_kaydet`, `ozel_parca_flansh_kaydet`. Boru pattern'i ile yazilir.
- **Bug 2 -- olusturma_at vs olusturma kolon adi** (P2). Yeni tablolari (boru_malzeme_uyum, flansh_malzeme_uyum, arsiv.kayit_birlestirme_log) suffix'siz rename et.
- **Generic UI altyapisi (KARAR-91.F)** -- `kutuphane-tablo.html`, `_kutuphane-konfig.js`. Eski plan, 93+'da.

---

## 93'un Acik Sorulari

**Soru 1 -- Bug 1 icin secenek?**
Cihat 92 sonunda "kutuphane sandigimizdan dolu" yorum yapti, bug'i ciddiye aliyor. Pilot tersane durumuna gore A (hizli) ya da B (mimari).

**Soru 2 -- Generic UI 93'te mi 94'te mi?**
92'de cakisma UI'lari generic olmadan da yazildi. Generic UI acil degil, belki 94'e tasinabilir.

**Soru 3 -- Fitting/flansh modal'i nasil?**
Boru modal hazir. Fitting/flansh icin: 3 tip secim sekmesi mi, parca tipine gore farkli modal mi? Mockup gerek.

---

## Tahmini Sure

- Push sonrasi canli test: 15 dk
- Bug 1 cozumu: 30 dk (Sec A) veya 2 saat (Sec B)
- Fitting/flansh RPC + modal: 1-2 saat
- Bug 2 fix (kolon rename): 30 dk

**Toplam A senaryosu:** ~4 saat
**Toplam B senaryosu:** ~5.5 saat

---

## 92'nin Acik Notlari (Hatirlatma)

- **KARAR-92.A** Cakisma yonetimi 4 katman
- **KARAR-92.B** Her parca tipinin kendi RPC'si
- **KARAR-92.C** Modal yari otomatik
- **KARAR-92.D** Gecici/kalici DB'de ayrim YOK
- **KARAR-92.E** Birlestirme yonu ozel -> sistem
- **KARAR-92.F** Yol 3 snapshot arsive
- **KARAR-92.G** Yeni standart migration -> cakisma kontrolu zorunlu

---

## Onemli Belgeler (93 baslangicinda okunacak)

1. `docs/93-DEVRALINAN-BUGLAR.md` -- 93'un ana isi
2. `.github/son-durum.md` -- 92 tam ozet
3. `CLAUDE-SON-OTURUM.md` -- 92 detay
4. `docs/KUTUPHANE-KAPSAM.md` -- Cakisma Yonetimi bolumu
5. `docs/KUTUPHANE-YUKLEME-TAKIP.md` -- icerik durumu

---

> 93 acilisinda: `docs/93-DEVRALINAN-BUGLAR.md` + `son-durum.md` okunacak. "Push'u test mi yoksa Bug 1'e direkt mi?" sorulur.
