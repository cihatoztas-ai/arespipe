# AresPipe — 15. Oturum Gündemi

> 14. oturumdan biriken işler ve sonraki oturum öncelikleri.
> Başlangıçta bu dosyayı + CLAUDE.md + CLAUDE-SON-OTURUM.md birlikte oku.

---

## Oturum Başı Ritüeli

1. **CLAUDE.md** oku — mimari, kurallar, DB şeması (özellikle yeni **Kural G-02** — bölüm 2.12.1)
2. **CLAUDE-SON-OTURUM.md** oku — 14. oturum ne yapıldı
3. Bu dosya (**CLAUDE-SONRAKI-OTURUM.md**) — ne yapılacak
4. **Kullanıcıya sor:**
   - "14. oturum 4 dosyasını (devreler + kesim + bukum + markalama) deploy ettin mi?"
   - "Dil dosyalarına 17 yeni anahtarı ekledin mi?"
   - "Canlıda tasarım testi yaptın mı — hero+pill ikonları görünüyor mu?"
   - "Bugün öncelik: kalan sayfalar mı, yarım kalan işler mi (export/arama), yoksa başka bir şey mi?"

---

## 🔴 ÖNCELİK 0 — DEPLOY BORCU

### 14. Oturum Deploy

```
devreler.html
kesim.html
bukum.html
markalama.html
```

Ayrıca dil dosyaları (tr/en/ar) — CLAUDE-SON-OTURUM.md içindeki 17 anahtar.

Test noktaları (her 4 sayfa için):
- Hero'daki sayfa adı renkli görünüyor mu?
- Stat pill'lerin solundaki renkli ikon kutuları + beyaz SVG'ler görünüyor mu?
- Shimmer iskelet yükleme sırasında görünüp veri gelince kayboluyor mu?
- Dark mod geçişinde tutarlı mı?
- Tablolardaki "TERSAN" badge'leri 14px mi?
- Pagination (devreler, kesim, markalama) canlandırılmış görünüyor mu?

---

## 🟡 ÖNCELİK 1 — 14. Oturumun Yarım Kalan İşleri

### Kesim / Büküm / Markalama'ya tamamlanacak özellikler

**1. Excel + PDF export ekleme**
Her 3 sayfaya devreler.html'deki `_tamFiltreliListe` pattern'i uyarlanmalı. Ancak dikkat: bu sayfalardaki veri modeli devreler'den farklı:
- Kesim/markalama: tab bazlı (bekliyor/listede/tamamlanmış) + local storage + server hybrid
- Büküm: tab bazlı ama daha basit

Yaklaşım: her sayfanın kendi tab-aware export fonksiyonunu yaz, filtreli tüm satırları al, modal ile Excel/PDF seçimi sun. Toast ile "X kayıt" geri bildirimi ver.

**2. Arama çubuğu**
- Kesim'de YOK — eklenmeli. Filter-card içine search-wrap + haystack: spool_id, kesim_id, boru no, malzeme, yüzey, gemi/proje no, tersane.
- Markalama'da YOK — aynı pattern.
- Büküm'de VAR ama haystack minimum. Genişlet: şu an sadece temel alanlar, ekle: tersane + proje + malzeme + yüzey.

**3. Gemi/proje sütunu font kontrolü**
Devreler'de yapıldı (Barlow Condensed bold → Barlow 600 15px letter-spacing:.2px). 3 sayfada aynı değişiklik gerekli mi? Tablolarda `.cell-spoolid`, `.cell-kesim` vb. ilgili sütunları inceleyip aynı font'a çek.

---

## 🟢 ÖNCELİK 2 — Kalan Sayfaların G-02 Dönüşümü

Sayfalar sırasıyla (trafik yoğunluğuna göre önerilir):

1. **anasayfa.html / index.html** — kullanıcının ilk gördüğü sayfa
2. **kalite_kontrol.html** — operasyonel
3. **sevkiyatlar.html** — operasyonel
4. **tersaneler.html** — admin
5. **uyarilar.html** — destek
6. **kullanicilar.html** — admin
7. **atolye_takip.html** — opsiyonel
8. **test_yonetimi.html** — opsiyonel

Her biri için pattern aynı — CLAUDE.md Kural G-02 (bölüm 2.12.1) uygula:
- CSS block ekle (stat-row, hero-left, stat-pill, shimmer, ic-*)
- HTML'i hero+pill yapısına çevir
- Helper fonksiyonları ekle (_trFmt, _skTemizle, _animCount)
- F-01 ihlallerini düzelt (14px altı font, tersane badge 10px)
- Pagination varsa canlandır (active → pg-aktif)
- updateStats fonksiyonunda _animCount kullan
- Renk kimliği seç (ilgili sayfanın CSS değişkeni)
- Hero ikonu seç (Lucide stroke SVG)
- Pill ikonları seç (saat, süzgeç, onay, etiket, kalkan, rozet vb.)
- Label kısaltmaları (Toplam/Adedi gibi ekleri çıkar)

Her sayfanın dönüşümü ~20 str_replace alır, syntax doğrulaması + outputs'a kopyalama dahil ortalama 10-15 dk.

---

## 🔵 ÖNCELİK 3 — Sonraki İyileştirmeler (uzun vadeli)

### Sort için RPC (ileride)
Devreler'de client-side sort kullanılıyor (mevcut 25 satır). 2000+ kayda ulaşıldığında tam sort gerekirse:
- `devre_ozet_listesi(filtre, sort_key, sort_dir, sayfa, sayfa_basi)` RPC yaz
- Server-side sıralı ID listesi dönsün, ana sorgu `.in(sortedIds)` ile çeksin
- Büyük iş — ayrı oturum (~2-3 saat)

### Pagination — Model S (Material Design footer) deneme
14. oturumda kullanıcı mevcut yapıyı tercih etti ama ileride "Sayfa başına: 25 ▼" dropdown'u + sade "1-25 / 77" formatı denenebilir. Sayfa sayısı 50+ olduğunda klasik pagination yorucu olabilir.

### Label override i18n pattern
Şu an kısa label'lar için `_short` suffixli anahtarlar kullanıyoruz. İleride bir i18n meta sistem kurulabilir: aynı anahtar sayfa bağlamına göre farklı görünüm.

---

## 🚫 Dokunulmayacaklar (bu oturumda işlem yok)

- CLAUDE-MOBILE.md ve mobil React uygulaması (ares-mobil) — 14. oturumda dokunulmadı, bu oturumda da kapsam dışı. Mobil dönüşümü ayrı bir oturum gerektirir (React + Tailwind-farklı standardize).
- Supabase şema değişiklikleri — şu an tüm gerekli alanlar mevcut.
- `ares-store.js`, `ares-lang.js`, `ares-normalize.js`, `ares-layout.js` — çekirdek, stabil.

---

## Hızlı Referans — G-02 pattern tamamlama checklist

Her yeni sayfaya G-02 uygulanırken:

```
□ stat-row + hero-left + stat-pill CSS bloğu eklendi
□ ic-blue/green/amber/red/cyan/violet/orange renkleri eklendi
□ shimmer keyframe + .sk class eklendi
□ Hero HTML: <svg> ikon + <div class="hero-name"> yapısı
□ Pill HTML: <div class="stat-pill-ic ic-X"> + body + .sk sk-num span
□ _trFmt + _skTemizle + _animCount helper'ları eklendi (sayaçsız)
□ updateStats/render fonksiyonu _animCount kullanıyor
□ 14px altı font: 0 (grep ile kontrol)
□ Tersane badge 14px (font-size:10px → 14px)
□ .cell-tersane 14px (varsa)
□ Pagination (varsa): active → pg-aktif, pg-info strong, pg-dots span
□ « ‹ › » 4 nav butonu + cmn_*_sayfa tooltip
□ Label kısaltmaları uygulandı
□ Syntax: 7 script bloğu 0 hata
□ Kritik ID'ler korundu (grep ile doğrula)
□ outputs/ klasörüne kopyalandı
□ Mockup ile kullanıcıya onay gösterildi
```

---

## Not

14. oturum sonu itibariyle **AresPipe'ın web arayüzünün %40'ı** yeni G-02 standardında (4/10 ana sayfa). 15. oturumda %80'e, 16. oturumda %100'e çıkması hedefleniyor.
