# AresPipe — 14. Oturum Özeti (21 Nisan 2026)

> Bu dosya son oturumda yapılanları ve deploy gereken dosyaları listeler.
> Yeni oturumda CLAUDE.md + CLAUDE-SONRAKI-OTURUM.md ile birlikte okunur.

---

## Oturum Başlığı

**Tarih:** 21 Nisan 2026
**Ana tema:** Liste sayfası standardizasyonu — Hero + Pill tasarımı, F-01 tam uyumu, shimmer iskelet, arama genişletmesi, export tüm filtreli veri, pagination canlandırma. **Kural G-02** oluşturuldu.
**Değişen dosyalar:** `devreler.html`, `kesim.html`, `bukum.html`, `markalama.html`

---

## Yapılanlar

### 1. devreler.html — Altın Standart Dosya ✅

Yeni G-02 kuralının baz alındığı dosya. Tüm pattern bu dosyadan çıkarıldı.

**Tasarım iyileştirmeleri:**
- Hero + pill yapısı: renkli ikon kutuları (30×30, beyaz SVG), Barlow Condensed sayfa adı, 6 eşit pill
- `wide` class kaldırıldı — Malzeme/Çap pill'leri diğerleri ile aynı boyutta
- Label kısaltmaları: "Devre Adedi" → "Devreler", "Spool Adedi" → "Spool", "Ağırlık (kg)" → "Ağırlık" + kg `<small>`, "Çap Dağılımı" → "Çap"
- Pill sayı kesilmesi çözüldü: `overflow:hidden; text-overflow:ellipsis` kaldırıldı, min-width:128 ile güvence
- Responsive media query 1200px → 1280px
- Tersane badge 10px → 14px (F-01 ihlali)
- Modal içi 12px fontlar → 14px (malzeme/çap dağılım modal'ları)
- Gemi sütunu (NB1124 vb.) font: Barlow Condensed bold → Barlow 600 15px letter-spacing:.2px (okunaklı)

**Fonksiyonel iyileştirmeler:**
- Shimmer iskelet: `_skRender`, `_skTemizle`, `_animCount` helper'ları (**sayaç animasyonu YOK**, direkt atama)
- Paralel Supabase sorguları: tersaneler + projeler + spooller 3'ü paralel + tenant_id filtresi eklendi
- Client-side sort: `_applySortTo(DEVRELER)` `_doRender` içinde — sort sayfa içi (25 satır) çalışır, `sortBy` artık server'a gitmez
- Arama haystack 4 → 9 alan: devre_no + ad + is_emri_no + zone (server) + tersane + proje_no + malzeme (kod+etiket) + yüzey (kod+etiket) (client cache üzerinden ID-bazlı OR genişletmesi)
- Excel + PDF export pagination'dan bağımsız: `_allFilteredIds` global + `_tamFiltreliListe()` async helper (500'lük chunk) + toast geri bildirimi "(X devre)"
- Pagination canlandırma: Barlow Condensed, `pg-aktif` + `pg-dots` class, info metninde strong vurgu, aktif butona gölge, «‹›» 4 nav butonu i18n tooltipli
- `_ilkYukleme` global'i ve ilgili kod temizlendi (dead code)

### 2. kesim.html, bukum.html, markalama.html — Standardizasyon ✅

3 sayfa da devreler.html standardına getirildi:

| Değişiklik | Kesim | Büküm | Markalama |
|---|:---:|:---:|:---:|
| Hero + pill yeni yapı (SVG ikon + renkli kutu) | ✅ | ✅ | ✅ |
| Shimmer iskelet + `_animCount` helper | ✅ | ✅ | ✅ |
| `updateStats` iskelet temizleyecek şekilde | ✅ | ✅ | ✅ |
| F-01 tam uyum (14px altı font: 0) | ✅ | ✅ | ✅ |
| Tersane badge 10px → 14px | ✅ | ✅ | ✅ |
| Cell-tersane 10px → 14px | ✅ | ✅ | ✅ |
| Pagination canlandırma (`active` → `pg-aktif`) | ✅ | N/A | ✅ |
| İlk/son sayfa butonu `« »` + i18n tooltip | ✅ | N/A | ✅ |
| Label kısaltmaları (Bekleyen / Listede / Bükülen) | ✅ | ✅ | ✅ |
| Responsive 1280px media query | ✅ | ✅ | ✅ |

**Renk kimlikleri korundu:**
- Kesim `--ks-c: #c2410c` (kızılkahve)
- Büküm `--bukum-c: #7c3aed` (mor)
- Markalama `--marka-p: #0e7490` (cyan)

---

## Yeni Kural: G-02 (Hero + Pill Standardı)

CLAUDE.md'de yeni bölüm eklendi: **2.12.1 — Hero + Pill Standardı**. Tüm CSS/HTML/JS pattern'leri + label kısaltma kuralları + renk kimlikleri orada.

---

## Dil Dosyasına Eklenecek Yeni Anahtarlar

3 dil dosyasına (`lang/tr.json`, `lang/en.json`, `lang/ar.json`) **11 yeni anahtar** eklenmeli. Şu an TR fallback ile çalışıyor (EN/AR kullanıcıları TR görüyor).

### Ortak (cmn_)

| Anahtar | TR | EN | AR |
|---|---|---|---|
| `cmn_ilk_sayfa` | İlk sayfa | First page | الصفحة الأولى |
| `cmn_onceki_sayfa` | Önceki sayfa | Previous page | الصفحة السابقة |
| `cmn_sonraki_sayfa` | Sonraki sayfa | Next page | الصفحة التالية |
| `cmn_son_sayfa` | Son sayfa | Last page | الصفحة الأخيرة |

### Devreler (dr_)

| Anahtar | TR | EN | AR |
|---|---|---|---|
| `dr_circuits_short` | Devreler | Circuits | دوائر |
| `dr_spool_short` | Spool | Spool | سبول |
| `dr_cap_short` | Çap | Diameter | قطر |
| `dr_export_hazirlaniyor` | Dışa aktarım hazırlanıyor... | Preparing export... | جاري تحضير التصدير... |
| `dr_export_bos` | Dışa aktarılacak devre yok | No circuits to export | لا توجد دوائر للتصدير |
| `dr_excel_olusturuldu` | Excel oluşturuldu | Excel created | تم إنشاء Excel |
| `dr_excel_lib_hata` | Excel kütüphanesi yüklenemedi | Excel library failed to load | فشل تحميل مكتبة Excel |

### Kesim (ks_)

| Anahtar | TR | EN | AR |
|---|---|---|---|
| `ks_stat_bekleyen_short` | Bekleyen | Pending | قيد الانتظار |
| `ks_stat_inlist_short` | Listede | In List | في القائمة |

### Büküm (bk_)

| Anahtar | TR | EN | AR |
|---|---|---|---|
| `bk_stat_top_short` | Bekleyen | Pending | قيد الانتظار |
| `bk_stat_tamamlanan_short` | Bükülen | Bent | منحني |

### Markalama (mk_)

| Anahtar | TR | EN | AR |
|---|---|---|---|
| `mk_stat_bekleyen_short` | Bekleyen | Pending | قيد الانتظار |
| `mk_stat_listede_short` | Listede | In List | في القائمة |

**Eklemeden deploy edilirse:** TR fallback devreye girer, tüm dillerde TR gösterir (yanlış değil ama ideal değil).

---

## Deploy Gereken Dosyalar

4 dosya:
- `devreler.html` — altın standart
- `kesim.html`
- `bukum.html`
- `markalama.html`

Ayrıca ideal olarak: 3 dil dosyası (tr/en/ar.json) yukarıdaki 17 anahtar ile.

---

## Yapılmayan (Kalan İşler)

14. oturum kapsamında tamamlanmayanlar — 15. oturuma aktarılacak:

### Kesim / Büküm / Markalama'ya eklenmesi gerekenler

1. **Excel + PDF export** — devreler'deki `_tamFiltreliListe` pattern'i uyarlanmalı (veri modeli farklı: tenant-scoped değil, tab bazlı).
2. **Arama çubuğu** — kesim ve markalama'da yok, eklenmeli. Büküm'de var ama haystack genişletmesi yapılmamış.
3. **Gemi/proje sütunu font** — devreler'de yapıldı, diğer 3 sayfada kontrol edilmedi.

### Dönüştürülmemiş sayfalar (G-02 standardı henüz uygulanmadı)

- `kalite_kontrol.html`
- `sevkiyatlar.html`
- `tersaneler.html`
- `uyarilar.html`
- `atolye_takip.html`
- `test_yonetimi.html`
- `kullanicilar.html`
- `anasayfa.html` / `index.html`

---

## 14. Oturum'da Karar Verilmiş Seçenekler (bir sonraki oturumda devam eden)

**Sort davranışı:** Sayfa-içi sort (mevcut 25 satır) kabul edildi — tüm devreler için tam sort isteniyorsa Excel export kullanılır. 2000+ kayda ulaşıldığında RPC yazımı gündeme alınacak.

**Pagination modeli:** Mevcut `« ‹ 1 2 3 4 › »` yapısı korundu — canlandırıldı ama paradigma değişmedi. 12 farklı mockup değerlendirildi, ilk tasarım tercih edildi.

**Sayaç animasyonu:** Kullanıcı sevmedi → kaldırıldı. Pill değerleri artık direkt atanır, animasyon yok.
