# Son Durum — 146. Oturum (3 Haziran 2026)

> **B'nin kalanı (kalem-seviyesi BOM rötuşu) UÇTAN UCA KAPANDI** — wizard ✏️ → taslak_duzeltmeleri (kalem_idx≥0) → terfide aktar overlay → spool_malzemeleri. Canlı kanıtlandı (NB1137).
> Sıfır regresyon (aktar birim testli). Yeni endpoint YOK (12/12). Yeni migration YOK.

## HEAD (son push `1d9345b`)
- `1d9345b` fix(146): kalem rotus UI — hucre-bazli rozet + ayri Duzelt kolonu
- `f1b4d99` feat(146): kalem-seviyesi BOM rotus — wizard popup + aktar kalemDuzeltmeler overlay

## Yapılanlar
### 1. aktar kalem overlay (ares-kabuk.js)
- Opsiyonel `kalemDuzeltmeler` param + malRows idx-anahtarlı overlay. Defaults parse değerine düşer → eski davranış (devre_detay göndermez). Birim test 4/4 (regresyon, dirsek ağırlık, boru boy/dn, komşu izolasyon).

### 2. Wizard kalem UI (devre_wizard_v3.html)
- `KALEM_ALANLAR` (malzeme/DN/adet-boy/ağırlık; kalite çap/et türev → ayrı yok; açı persist yok → dışarıda).
- `kalemDuzeltAc` (duzeltOverlay yeniden kullanıldı) + satır aç/kaydet/iptal/çiz + `_kalemDuzeltmeleriYukle` (gte kalem_idx 0). Anahtar `WIZ._kalemDuzelt[(pipeline|spool)][idx]` = aktar.kalemDuzeltmeler şekli.
- `malzSekmesiRender`: ✏️ ayrı "Düzelt" kolonu (9 kolon) + overlay değer + **hücre-bazlı** rozet.
- onayEt: terfi öncesi garanti yükleme + aktar'a kalemDuzeltmeler.
- Spool-seviyesi yol (kalem_idx=-1, DUZELT_ALANLAR/duzeltAc) DOKUNULMADI.

## CANLI DOĞRULAMA (NB1137, devre 0739d514, S01)
- spool_malzemeleri: S82109 malzeme/kalite='paslanmaz'; S63043 adet=3; S67455 agirlik_kg=25.000. Her kalem yalnız kendi alanı, komşular parse değerinde. idx hizası kanıtlandı.

## MÜHÜR
- **MK-146.1:** kalem_idx = gruplu grupla().bom[] sırası (MK-145.1 revizyonu). konsolide deterministik, render+terfi aynı saf fonksiyon → idx hizalı.

## İki UI kusuru (oturum içinde düzeltildi)
- Rozet satır-seviyesinde malzeme hücresindeydi → "malzeme değişti" yanılgısı. Hücre-bazlı yapıldı.
- ✏️ KG değerini kapatıyordu → ayrı "Düzelt" kolonuna alındı (thead +1).

## NOT (davranış)
- Malzeme düzeltince kalite de güncelleniyor (aktar kalite=ham malzeme). İstenirse 147+ ayrı alan.
- açı: spool_malzemeleri'de kolon yok → düzenlenebilir değil (spool_detay editörü de doğrular).

## NEREDEYIZ
B kalanı kapandı. 147: spool_detay kütüphane-tıklama bug (FK dolu kalem açılmıyor; A-001090/9ce6869a, kalem bed61203), C4 downstream damga.

## Hatalarım (kayıt)
- "Commit etme, ikisini birlikte test edelim" dedim; Cihat zaten f1b4d99'da iki dosyayı birlikte commit etmişti (doğrusu da o). Gereksiz `git add ares-kabuk.js` önerdim → git status okumadan; sonra status okuyunca düzeldi. Ders: commit önerisinden önce git log/status.
- İlk UI'da rozeti satır-seviyesinde malzemeye koydum → yanıltıcı. Render'da görsel-niyet test edilmeli (hangi alan = hangi hücre).
