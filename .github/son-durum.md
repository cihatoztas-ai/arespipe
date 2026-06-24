# Son Durum — Oturum 203 (24 Haziran 2026)

> **Modül:** Kalite Kontrol (KK) + TERSAN Boru Takip Formu
> **CI:** Son commit sonrası yeşil beklenir (her code commit'te `node --check` geçti).
> **Endpoint sayısı:** 12/12 (MK-129.3 tavanı korunuyor — yeni serverless eklenmedi).

---

## Bu oturumda tamamlananlar

### A. KK sekmeleri (Açık / Arşiv / Havuz) — stil + filtre + sıralama
- Tablo `devreler.html` `data-table` sistemiyle hizalandı; İş Emri kolonu, GEMİ mavi, AĞIRLIK muted, drawer'a MALZEME kolonu.
- DAVET / TERSANE ayrı kolonlara bölündü.
- Filtre + arama barları (TERSANE / arama, temizle), sıralanabilir başlıklar (paket + havuz sort).
- Filtreli seçim kapsamlandı (gizli seçimler özet/butona sızmıyor), filtreli select-all checkbox.
- Yükleme spinner geri bildirimi.

### B. Belgeler → birleşik belge merkezi
- Tek "Belgeler" listesi: üretilen (KK Listesi + Boru Takip Formu) + yüklenen + dropzone; foto galerisi ayrı.
- `kk_belgeler` tablosu + Storage entegrasyonu, RLS, kapsam (paket / spool).
- KK Listesi: **PDF** (`window.print`) + **Excel** (lib'siz HTML-as-.xls).

### C. TERSAN Boru Takip Formu (FR-DNTM-21-03) — PARÇA SEVİYESİNDE
TERSAN davetinde, Belgeler'de devre başına hazır (**PDF + Excel**). Üretim generate-on-demand.

- **Veri:** `spool_malzemeleri` çekiliyor (`_btFormVeri` ortak fonksiyon, Excel + PDF paylaşır).
- **Filtre:** `tip ∈ {boru, fitting}` **VE** negatif kalıp yok (tanım + kod'a bakar). Hariç: sleeve/**bilezik**, **sounding**, victaulic/groove (yiv), **butt/field weld** (kaynak işlemi), cıvata/conta/montaj, plaka/lama/profil/çelik. **Dahil: Weld-O-let** (fitting; "weld" geçtiği için yanlışlıkla İşlem etiketi alıyor).
- **DN parse (boyut'tan):** `DN65`→65, `DN65 x DN15`→65 (ana çap), `60.3x4.5`→DN50 (OD→DN), `100 x 114.3`→DN100, `6"`→DN150 (inch→DN). OD2DN + INCH2DN tabloları.
- **ET/PN:** boru→`et_mm` (yoksa boyut'tan "x4.5"→4,5); fitting→PN/LBS (tanım/boyut), yoksa et'e düşer.
- **Parça no:** `sira` null → sıra index'i; aynı DN+ET/PN+heat olanlar tek satır, parça no "2-3" (ardışık range).
- **KONTROL ✓** her satıra otomatik. **HEAT** = `heat_no` (spool_detay'dan girilir).
- **Excel:** JSZip ile `templates/boru-takip-formu.xlsx` şablon-doldur (setcell regex `s=` korur, `t="inlineStr"`).
- **PDF:** portrait A4, TERSAN logosu şablondan (data-uri), `thead{display:table-header-group}` ile **başlık her sayfada tekrarlar → çok sayfa otomatik**.

### D. Şablon mühendisliği
- `1-HEAT.xls` → LibreOffice ile `.xlsx` (logo korunur), openpyxl ile tek-form/sayfa portrait, print_area, GEMİ merge → `templates/boru-takip-formu.xlsx`.
- `vendor/jszip.min.js` (97KB, npm) eklendi, `<script>` ile yüklendi.

---

## Açık borçlar / sıradaki oturum
1. **BUG:** `aktif_basamak='kk'` olan spool'lar sevkiyat görünümünde yanlış çıkıyor.
2. **spool_detay / devre_detay → KK çapraz-link** henüz yok.
3. **KK i18n** anahtarları `lang/{tr,en,ar}.json` (şu an `tvv()` TR fallback).
4. **Boru Takip Formu:** Weld-O-let'in ET/PN'i boş kalıyor (outlet, basınç sınıfı yok) — Cihat onayı: normal mi, değer mi yazılsın?
5. Belgeler popup gerçek Storage binding son rötuşları.
6. **kk-tasarim.md** birikimli güncelleme (Boru Takip Formu bölümü eklenecek — orijinal metin gerekiyor).

---

## Bu oturumun kuralları (Boru Takip Formu)
- **Form filtresi:** tip ∈ {boru,fitting} + negatif kalıp (tanım **ve** kod); `bilezik`=sleeve(TR), `sounding`, `butt/field weld` hariç; Weld-O-let dahil.
- **DN parse:** DN-prefix→ilk sayı; `AxB` B<20→OD×ET→OD2DN, B>A→DN×OD→A; tek sayı nokta/>24→OD2DN, ≤24→inch2DN.
- **Gruplama:** aynı DN+ET/PN+heat → tek satır, parça no ardışık range "2-3".
- **Şablon-doldur:** JSZip `setcell` regex stil (`s=`) korur, `inlineStr`.
- **PDF çok sayfa:** `window.print()` + `thead{display:table-header-group}` (KK Listesi PDF konvansiyonu).
