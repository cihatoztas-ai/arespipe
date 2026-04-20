# AresPipe — Son Oturum Deploy Listesi

**Tarih:** 20 Nisan 2026 (5. oturum)
**Risk seviyesi:** DÜŞÜK — DB migration+constraint sorunsuz geçti, kod refactor'leri adım adım doğrulandı, syntax check'ler temiz

---

## Bu Oturumda Ne Yapıldı

Tek başlık altında çok iş: **Malzeme-Yüzey Uyum Sistemi** (matris + popup + DB constraint). Buna eklenen 3 yan iş: devreler.html durum sütunu kaldırma, sapma mantığı çoğunluk-baz'a çevirme, aluminyum → alum migration.

### 1. Uyum Matrisi (Kural E-02)

| Malzeme | Asit | Galvaniz | Siyah | Boya | Diğer |
|---|:-:|:-:|:-:|:-:|:-:|
| Karbon | ✅ | ✅ | ✅ | ✅ | ✅ |
| Paslanmaz | ✅ | ❌ | ❌ | ❌ | ✅ |
| Bakır Alaşım | ✅ | ❌ | ❌ | ❌ | ✅ |
| Alüminyum | ✅ | ❌ | ❌ | ✅ | ✅ |
| Diğer | ✅ | ✅ | ✅ | ✅ | ✅ |

`yuzey='diger'` her malzemeyle uyumlu (özel işlem kaçışı).

### 2. DB Migration — 3 Adım

**Adım A:** `UPDATE spooller SET malzeme='alum' WHERE malzeme='aluminyum'` (83 kayıt — 4. oturumdan borç)

**Adım B:** 8 uyumsuz kayıt asit'e çevrildi (hepsi 7 Nisan toplu test verisiydi — ilerleme=0, bekliyor):
- 4 paslanmaz+galvaniz, 1 paslanmaz+siyah
- 1 alum+galvaniz
- 2 bakir+siyah

**Adım C:** İki yeni kolon + CHECK constraint:
```sql
ALTER TABLE spooller ADD COLUMN yuzey_aciklama TEXT;
ALTER TABLE devreler ADD COLUMN yuzey_aciklama TEXT;
ALTER TABLE spooller ADD CONSTRAINT malzeme_yuzey_uyumu CHECK (
  malzeme IS NULL OR yuzey IS NULL
  OR malzeme = 'diger' OR yuzey = 'diger'
  OR NOT (
    (malzeme = 'paslanmaz' AND yuzey IN ('galvaniz','siyah','boyali')) OR
    (malzeme = 'bakir'     AND yuzey IN ('galvaniz','siyah','boyali')) OR
    (malzeme = 'alum'      AND yuzey IN ('galvaniz','siyah'))
  )
);
```

### 3. ares-normalize.js — +2 API

```js
ARES_NORM.uyumlu('paslanmaz','galvaniz')  // → false
ARES_NORM.uyumluYuzeyler('paslanmaz')     // → ['asit','diger']
```

Her iki fonksiyon ham değerleri de kabul eder (`ARES_NORM.uyumlu('Paslanmaz','Galvaniz')` → `false`).

### 4. Fark Tespit Popup (devre_yeni + devre_duzenle)

Generic diff framework: **kaydet öncesi** form beyanı ↔ spool gerçeği.

- Malzeme + yüzey için ayrı kartlar
- Her kart: **Beyan** (mavi pill) → **Yüklenen** (kırmızı pill'ler) + uyumsuz spool listesi
- 3 buton:
  - **İptal et** — confirm + devreler.html'e dönüş
  - **Düzelt** — popup kapan, formda kal, kaydet iptal
  - **Yüklemeye devam et** — farkı kabul et, kayıt devam (amber)

Neden kaydet'te değil de spool eklerken değil? Tüm import yolları (manuel + IFS Excel + AI PDF) tek noktadan geçer, güvenlik ağı oradadır.

### 5. Yüzey "Diğer" + yuzey_aciklama

- `devre_yeni.html` + `devre_duzenle.html` yüzey radio grubuna "Diğer" eklendi
- Seçilince altında text input açılır (placeholder: "anodize, pasivasyon…")
- DB'de `yuzey='diger'` + `yuzey_aciklama='açıklama'` çifti kaydedilir
- devre_yeni spool INSERT'te fallback: `s.yuzeyAciklama || yuzeyAciklama` (devre geneli her spool'a miras)
- `"Boyalı"` → `"Boya"` formlarında da düzeltildi

### 6. Malzeme Değişince Uyum Disable

`yuzeyUyumGuncelle()` fonksiyonu:
- ARES_NORM.uyumluYuzeyler(malzeme) ile izinli yüzeyleri al
- Diğer radio'ları disable + strikethrough + tooltip (`dny_uyum_uyari` mesajı)
- Eğer seçili yüzey artık yasaksa Asit'e çek (varsayılan)

**devre_duzenle'de grace period:** Sayfa açılınca mevcut uyumsuz seçim zorla değişmez (_formHazir flag'i false), sadece diğer radio'lar disable edilir. Kullanıcı manuel değişiklik yaptığında kural işler.

### 7. devreler.html — Durum Sütunu + Sapma

- **Durum sütunu + filter kaldırıldı** (75/75 kayıt 'aktif' idi, DURUM_MAP ölü kod)
- **Sapma çoğunluk-baz:** Eski kod `Object.keys(malzemeSet)[0]` (ilk insert) baz alıyordu → 60 karbon + 1 paslanmaz ama paslanmaz ilk girdiyse "Paslanmaz ⚠ +60" yazabiliyordu. Yeni: `malzemeSayim[mk]++` sayım → en çok olan baz, badge sırası çoğunluktan aza.
- İptal akışı korundu (`d.durum === 'iptal'` kontrolleri saklı)

---

## Değişen Dosyalar (7)

| Dosya | Değişim | Boyut |
|---|---|---|
| `ares-normalize.js` | +uyumlu, +uyumluYuzeyler | 116 → 164 satır |
| `lang/tr.json` | +10 anahtar | 1338 → 1348 |
| `lang/en.json` | +10 anahtar | 1338 → 1348 |
| `lang/ar.json` | +10 anahtar | 1338 → 1348 |
| `devre_yeni.html` | Popup + uyum + yüzey diger + yuzey_aciklama | 1751 → 2009 |
| `devre_duzenle.html` | Popup + uyum + grace period + yüzey diger | 358 → 628 |
| `devreler.html` | Durum sütunu − + sapma çoğunluk-baz | 2357 → 2340 |

---

## Deploy Sırası (Önerilen)

**Aşama 1 — Risksiz altyapı:**
1. `lang/tr.json`, `lang/en.json`, `lang/ar.json`
2. `ares-normalize.js`

Bu iki adım deploy edilince hiçbir şey bozulmaz (HTML'ler yeni anahtarları henüz kullanmıyor).

**Aşama 2 — HTML'ler:**
3. `devre_yeni.html`
4. `devre_duzenle.html`
5. `devreler.html`

**Aşama 3 — DB (zaten yapıldı):**
- ✅ `aluminyum → alum` migration
- ✅ 8 uyumsuz kayıt düzeltildi
- ✅ `spooller.yuzey_aciklama` kolonu
- ✅ `devreler.yuzey_aciklama` kolonu
- ✅ `malzeme_yuzey_uyumu` CHECK constraint

---

## Test Önerileri

### devre_yeni.html
1. **Uyum disable testi:** Malzeme "Paslanmaz" seç → Galvaniz/Siyah/Boya gri + üstü çizili olmalı, tıklanamaz
2. **Yüzey Diğer:** "Diğer" seç → altında text input açılmalı
3. **Fark popup:** Malzeme = Karbon, 1 spool ekle (manuel: malzeme="paslanmaz") → Kaydet → popup açılmalı
4. **İptal/Düzelt/Devam:** 3 buton farklı davranmalı
5. **Dil değişimi:** Tüm popup metinleri 3 dile çevrilmeli

### devre_duzenle.html
1. **Grace period:** Mevcut uyumsuz kayıt (paslanmaz+galvaniz gibi eski kayıt olsaydı) açılırken radio'lar korunur
2. **Manuel değişiklik:** Malzemeyi değiştir → yüzey uyumsuzsa Asit'e çekilmeli
3. **Fark popup:** Devre beyanı değiştir (paslanmaz→karbon), altında karbon spool'lar yoksa popup → uyumsuzluk + 3 buton
4. **yuzey_aciklama:** Yüzey "Diğer" seç + açıklama gir + kaydet → DB'de `devreler.yuzey_aciklama` doldu mu?

### devreler.html
1. **Durum sütunu yok:** Tabloda artık görünmemeli
2. **Sapma:** Karma malzemeli devrelerde çoğunluk badge'i önce, "⚠ +N" doğru sayıyı göstermeli (test: `438cc33e` devresi — 9 karbon + 1 paslanmaz → "Karbon Çelik ⚠ +1")
3. **İptal akışı:** Bir devreyi iptal et → row-iptal class'ı çalışmalı, ⊘ İptal badge görünmeli

---

## Bilinen Açık Sorunlar (Sonraki Oturuma)

Hepsi CLAUDE-SONRAKI-OTURUM.md'de detaylı:

1. **spool_detay.html kolon adları (78 yanlış referans)** — en kritik, sessiz bug
2. **`devreler.malzeme` legacy format** — hâlâ "Karbon Çelik" Türkçe formatında (spooller gibi canonical'e çekilmeli)
3. **devre_yeni.html `devreler.yuzey_aciklama` yazmıyor** — sadece devre_duzenle yazıyor, tutarlılık için eklenebilir
4. **devreler.html Excel export'ta hâlâ `d.durum` kolonu** — DURUM_MAP kaldırıldı ama export'ta veri çıkmaya devam ediyor
5. **Dil dosyalarında ölü anahtarlar:** `cmn_aktif`, `cmn_th_durum`, `dr_status_*`, `dr_all_statuses` — i18n linter ile temizlenebilir
6. **MProfil.jsx** — mobil, mockup-first
7. **Diğer sayfalarda enum refactor** — bukum/sevkiyat/kk/raporlar taranmadı

---

## Bu Dosyanın Ömrü

Bu dosya her oturum sonunda **üzerine yazılır**. Versiyon numarası tutulmaz. Deploy tamamlandıktan sonra içerik çöp olur, ama Claude'a yeni oturumda yüklendiğinde bir önceki oturumun ne yaptığını görmesini sağlar.

Uzun vadeli proje tarihçesi `CLAUDE.md` Bölüm 11 / 11A / 11B / 11C / 11D'de yaşar — oraya bakılır.
