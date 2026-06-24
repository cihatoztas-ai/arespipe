# Oturum 203 — KK Modülü + TERSAN Boru Takip Formu (24 Haziran 2026)

> **Durum:** ✅ KK sekme/Belgeler düzenlemeleri + Boru Takip Formu (parça seviyesi, Excel + PDF, çok sayfa) tamamlandı.
> İki bölüm: (1) Belgeler oturumu — KK sekme + Belgeler merkezi + kk_belgeler/Storage; (2) Boru Takip oturumu — TERSAN formu parça seviyesinde.

---

## Bölüm 1 — KK sekmeleri + Belgeler

- **KK sekme stil/filtre/sort (3 tur):** devreler `data-table` hizalama, İş Emri kolonu, GEMİ mavi, drawer MALZEME; DAVET/TERSANE ayrı kolon; filtre+arama+sort barları; filtreli seçim kapsamı (gizli seçim sızmıyor) + filtreli select-all; yükleme spinner.
- **Belgeler birleşik merkez:** üretilen (KK Listesi + Boru Takip Formu) + yüklenen + dropzone, foto galerisi ayrı; `kk_belgeler` tablosu + Storage + RLS + kapsam (paket/spool).
- **KK Listesi:** PDF (`window.print`, landscape, `_tabelaPdf` konvansiyonu) + Excel (lib'siz HTML-as-.xls, `application/vnd.ms-excel`).

## Bölüm 2 — TERSAN Boru Takip Formu (FR-DNTM-21-03)

### Mimari
- TERSAN davetinde Belgeler'de devre başına satır (guard: `d._tersane` "tersan" içerir). **PDF + Excel**. Generate-on-demand.
- **`_btFormVeri(davetId, devreId)`** ortak veri fonksiyonu — Excel ve PDF aynı filtre/parse/gruplamayı paylaşır.

### Veri akışı
1. Devre spool'ları → `spool_malzemeleri` (`spool_id, kod, tip, tanim, boyut, dis_cap_mm, et_mm, heat_no`).
2. **Filtre** (`_btDahil`): tip ∈ {boru,fitting} VE negatif kalıp yok (tanım+kod).
3. **DN** (`_btDn`) + **ET/PN** (`_btEtPn`) parse.
4. Parça no (index, sira null) + **gruplama** (aynı DN+ET/PN+heat → "2-3").
5. Excel: JSZip şablon-doldur; PDF: HTML + `window.print`.

### Filtre kuralı (canlı veriyle doğrulandı — 306 TANK SOUNDING devresi)
- **Çıkar:** sleeve, **bilezik** (Türkçe — "Ic Bilezik Detay C" sleeve diye geçmiyordu, "bilezik" eklendi), **sounding** ("Sounding tap with weight"), victaulic/groove, **butt/field weld** ("Carbon Steel Field Butt welding" kaynak işlemi), cıvata/conta/montaj, plaka/lama/profil.
- **Dahil:** boru, flanş, dirsek, te, redüksiyon, kep, **Weld-O-let** (gerçek fitting; "weld" yüzünden İşlem etiketi alıyor — Cihat netleştirdi).
- "weld" tek başına negatif değil (Welding Neck flanşı + Weld-O-let elenmesin); sadece "butt weld"/"field weld".

### DN parse (doğrulandı)
DN-prefix→ilk sayı · `AxB` (B<A & B<20)→OD×ET→OD2DN tablosu · `AxB` (B>A)→DN×OD→A · tek sayı (nokta veya >24)→OD2DN · tek sayı (≤24)→inch→DN.
Örn: `DN65`→65, `DN65 x DN15`→65, `60.3x4.5`→DN50+et4,5, `100 x 114.3`→DN100, `250 x 273.0`→DN250, `6`→DN150.

### ET/PN
boru→`et_mm` (yoksa boyut "x4.5"→4,5) · fitting→PN/LBS (tanım/boyut), yoksa et'e düşer · format "4,5" / "PN16" / "150LBS".

### Çıktı
- **Excel:** `templates/boru-takip-formu.xlsx`, setcell regex `s=` (stil/border) korur, `t="inlineStr"`. KONTROL ✓ + GEMİ (E6) + Devre/tarih (L6).
- **PDF:** portrait A4, TERSAN logo (şablon `xl/media/image1.png` → data-uri), tablo `thead` = logo+GEMİ/TARİH+kolonlar → **her sayfada tekrar** (çok sayfa). `window.print()` toolbar.

### Şablon mühendisliği
`1-HEAT.xls` → LibreOffice `.xlsx` (logo korunur) → openpyxl: Sayfa2 + blok 2-3 silindi, tek form/sayfa, portrait fitToPage, print_area A1:O45, GEMİ B6:D6 merge. `vendor/jszip.min.js` vendored.

### Hata düzeltmeleri (oturum içi)
- ET kolonu bazı satırlarda boştu → boru için boyut'tan, fitting için et fallback'i eklendi.
- KONTROL ✓ eklendi (örnekteki gibi).
- "(müfettiş doldurur)" alt yazısı kaldırıldı.
- Filtre kaçakları (bilezik/sounding/butt-weld) düzeltildi + kod kontrolü eklendi.

---

## Açık işler (sonraki oturum)
1. BUG: `aktif_basamak='kk'` sevkiyatta yanlış görünme.
2. spool_detay/devre_detay KK çapraz-link.
3. KK i18n (`lang/{tr,en,ar}.json`).
4. Weld-O-let ET/PN boş — karar.
5. kk-tasarim.md Boru Takip bölümü (orijinal metin gerekiyor — kayıpsız ekleme için).

## Disiplin notları
- Her code commit'te inline JS çıkarılıp `node --check`; `grep -c "</html>"` (4 normal: 1 dosya + 3 print-HTML string).
- Dosya teslimi md5 + `arespipe_kopyala`; doc commit `[skip ci]`, code commit `[skip ci]` YOK.
