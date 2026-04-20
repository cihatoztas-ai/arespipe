# AresPipe — 12. Oturum Gündemi

> 11. oturumda biriken işler ve sonraki oturum öncelikleri.
> Başlangıçta bu dosyayı + CLAUDE.md + CLAUDE-SON-OTURUM.md birlikte oku.

---

## Oturum Başı Ritüeli

1. **CLAUDE.md** oku — mimari, kurallar (E-01..E-05, B-01, B-02, F-01), DB şeması
2. **CLAUDE-SON-OTURUM.md** oku — 11. oturum ne yapıldı, deploy durumu
3. Bu dosya (**CLAUDE-SONRAKI-OTURUM.md**) — ne yapılacak
4. `/mnt/user-data/outputs/` klasörünü tara — önceki AI'dan yarım iş var mı?
5. **Kullanıcıya sor:**
   - "11. oturum dosyalarını deploy ettin mi? (spool_detay + devre_detay + lang ×3)"
   - "Küme B testi (3-buton dedup) ve Küme D testi (devre_detay _lk) yapabilir misin?"
   - "Hangi iş önce: test mi, yeni kod mu?"

---

## 🔴 ÖNCELİK 0 — DEPLOY + TEST BORCU TEMİZLE

### Deploy edilecek dosyalar (11. oturumda hazırlandı, henüz canlıda değil)

1. **`lang/tr.json`, `en.json`, `ar.json`** — 1377 → 1379 (sp_chip_active + sp_btn_complete)
2. **`devre_detay.html`** — Öncelik 12 duplicate validation (2 patch, düşük risk)
3. **`spool_detay.html`** — Tracker i18n (6 patch) + migration localStorage fix

```bash
git add lang/tr.json lang/en.json lang/ar.json devre_detay.html spool_detay.html
git commit -m "11. oturum: tracker i18n fix + migration localStorage + Öncelik 12 validation"
git push origin main
```

### Test senaryoları — tamamlanmamış kümeler

**Küme B — 3-Buton Dedup (devre_yeni.html):**
- [ ] Aynı Excel'i iki kez yükle → 3 buton popup çıkıyor mu? (İptal / Zorla ekle sarı / Çakışanları atla mavi)
- [ ] "Çakışanları atla" → sadece yeniler INSERT, hepsi çakışıyorsa amber toast
- [ ] "Zorla ekle" → duplicate oluşuyor (regresyon kontrol)
- [ ] AR/EN dil değiştir → buton metinleri çevrilmiş mi?

**Küme C.1 — _projeNo (spool_detay.html):**
- [ ] Spool başlığı `NB1124-K110-721-414C-S01` formatında mı?
- [ ] `localStorage.getItem('ares_aktif_spool')` → `_projeNo` var, `_gemi` yok mu?
- [ ] Migration: `localStorage`'a `{_gemi:'TEST'}` yaz → F5 → `_projeNo:'TEST'` görünmeli (anında, Supabase beklemeden)

**Küme C.4 — AR tracker re-test (deploy sonrası):**
- [ ] AR dilinde spool_detay aç → F5 → tracker "ما قبل التصنيع" / "التصنيع" vb. görünmeli
- [ ] NOT: `basamak_tanimlari`'ndan DB verisi geliyorsa hâlâ TR görünür (Öncelik 14) — bu beklenen

**Küme D — devre_detay _lk Duplicate (devre_detay.html):**

Önkoşul: Aynı devrede `pipeline1+S01` + `pipeline2+S01` oluştur (manuel DB insert veya 2 farklı pipeline'lı Excel).

- [ ] Inline edit: 2. spool rev'ini güncelle → sadece o güncellensin
- [ ] Sağ tık → Durdur → sadece doğru spool durdurulsun
- [ ] Toplu KK/Sevkiyat → iki spool ayrı checkbox, ikisi de seçilebilsin
- [ ] Etiket modal → `etc_UUID1`, `etc_UUID2` DOM'da ayrı mı?
- [ ] Sil → sadece bir tanesi silinsin

---

## ÖNCELİK 5 DEVAMI — DEVRE.gemi → DEVRE.projeNo

`devre_detay.html` içinde `DEVRE.gemi` 10+ yerde kullanılıyor (başlık, breadcrumb, Excel export, yazdır, etiket). Aslında `projeler.proje_no` tutuyor.

**Önemli ayrım (CLAUDE.md 4.2):**
- `DEVRE.gemi` = `projeler.proje_no` (NB1137 gibi proje kodu)
- `projeler.gemi_adi` = gerçek gemi adı ("MV Ocean Star" gibi)

**Fix:** `devre_detay.html` yükle, tüm `DEVRE.gemi` referanslarını `DEVRE.projeNo` yap + localStorage persist güncelle.

**Süre:** 1.5-2 saat. Orta risk (localStorage cross-page persist var).

---

## ÖNCELİK 11 — DEVRE.gemi Rename Devamı (devreler.html + ares-store.js)

`devre_detay.html`'deki rename tamamlanınca `devreler.html` ve `ares-store.js`'te de `gemi` → `projeNo` bakılmalı. Cross-file rename — önce `grep -rn "DEVRE.gemi\|\.gemi"` ile kapsam çıkar.

---

## ÖNCELİK 13 — `devreler.notlar` vs `notlar` Tablosu İkiliği

`devreler` tablosunda `notlar TEXT` kolonu + ayrı `notlar` tablosu var. Hangisi canonical? İkisi birden mi kullanılıyor?

**Araştırma planı:**
1. `SELECT COUNT(*) FROM devreler WHERE notlar IS NOT NULL AND notlar != ''`
2. `SELECT COUNT(*) FROM notlar WHERE devre_id IS NOT NULL`
3. `grep -n "devreler.*notlar\|DEVRE\.notlar" *.html` — hangi sayfa ne kullanıyor?

Sonuca göre: ya `devreler.notlar` kolonu DROP et, ya da `notlar` tablosuna yönlendir.

**Süre:** 30-45 dk. Düşük-orta risk.

---

## ÖNCELİK 14 (YENİ) — basamak_tanimlari Çok Dil Desteği

**Keşif (11. oturumda):** `basamak_tanimlari.gorunen_ad` sadece TR. Tracker AR/EN'de bu değerleri `tv('dyn_on_imalat', 'Ön İmalat')` ile dönüştürmeye çalışıyor ama `dyn_*` anahtarları lang dosyasında yok → TR fallback.

**Fix stratejisi:**
1. `ALTER TABLE basamak_tanimlari ADD COLUMN gorunen_ad_en TEXT`
2. `ALTER TABLE basamak_tanimlari ADD COLUMN gorunen_ad_ar TEXT`
3. Mevcut kayıtlara EN/AR karşılıkları yaz (İmalat → Manufacturing → التصنيع vb.)
4. `_basamaklariYukle()` — dil bazlı kolon seç: `gorunen_ad` (TR), `gorunen_ad_en` (EN), `gorunen_ad_ar` (AR)
5. STAGE_KEYS'i lang tabanlı üretmek yerine doğrudan çevrilmiş adları kullan

**Süre:** 2-3 saat. Orta-yüksek risk (DB migration + tüm tenant kayıtlarını güncelleme).

---

## ÖNCELİK 4 — Denormalizasyon Borcu (spooller ↔ spool_malzemeleri)

`spooller.malzeme/kalite` kolonları ile `spool_malzemeleri.malzeme/kalite` ikiliği. Option A: `spooller.malzeme/kalite` kaldır, UI `spool_malzemeleri`'nden aggregate etsin.

**Önce grep:** `spooller.malzeme` SELECT eden dosyalar: `devre_detay.html`, `spool_detay.html`, `kesim.html`, `markalama.html`, `devreler.html`. 10+ nokta → büyük iş, ayrı oturum.

**Süre:** 3-4 saat. Yüksek risk.

---

## ÖNCELİK 8 — Mobil Ekranlar (React)

- `MProfil.jsx` — avatar yükleme + kişisel bilgi (R-10 mockup-first)
- `MIsBaslat.jsx` — operatör iş akışı (R-10 mockup-first)
- `MDevreler.jsx`, `MDevreDetay.jsx`, `MSpoolDetay.jsx`, `MQRTara.jsx`

**Not:** `MQRTara.jsx` yazılırken tenant prefix formatını (`A-0504:UUID`) parse etmeli, cross-tenant uyarı vermeli (CLAUDE.md Bölüm 8 / 2.14).

---

## Yeni Kural Hatırlatmaları (Bu Oturumda Eklendi)

- **B-02:** Client-side array'lerde `_lk` stabil local key kullan — CLAUDE.md Bölüm 2.17
- **Migration bloğu = hemen persist:** `if (_gemi)` gibi migration bloklarından sonra anında `localStorage.setItem` şart
- **Oturum özeti = sonuç, niyet değil:** "bağlandı" değil "test edildi + X/Y sonuç verdi" yaz

---

## Özet — 12. Oturum Ne Beklenebilir

**Kısa:** 11. oturumda 5 fix bitti ama 3 dosya deploy edilmedi ve Küme B+D testleri atlandı. 12. oturum **önce deploy + kalan testler**. Test temizse Öncelik 5 devamı (DEVRE.gemi rename) veya Öncelik 14 (basamak_tanimlari multilang).

**Risk uyarısı:**
- `spool_detay.html` tracker fix deploy sonrası `basamak_tanimlari`'ndan veri gelen tenant'larda tracker TR kalır (beklenen, Öncelik 14)
- `devre_detay.html` Öncelik 12 fix regex-free, düşük risk

**Önerilen oturum yapısı:**
1. İlk 15 dk — deploy (3 lang + 2 HTML)
2. Sonra 30 dk — Küme B + C.1 re-test + C.4 re-test
3. Küme D için test verisi hazırla (duplicate spool ihtiyaç var)
4. Bug yoksa — Öncelik 5 devamı veya Öncelik 13 (notlar ikiliği, hızlı)
5. Zamanla Öncelik 14 başlangıcı (DB migration)
