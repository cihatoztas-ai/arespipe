# son-durum.md — Oturum 158 (2026-06-05)

## Bu oturumda ne yapıldı
1. **W-2.15 ONAY KUYRUĞU SEKMESİ (ana iş, canlı kanıtlı KAPANDI):** devre_detay'a 6. sekme.
   Tek liste 4 grup: ⚠ İnceleme bekleyen (manuel_onay — "Uyarıları gör" lazy uyarı listesi
   kod+mesaj+agirlik renkli + ✓Kapat tekil →tamamlandi) · 📊 Excel BOM (mevcut
   onayModalAc→onayAktar→aktar köprüsü, yeniden icat yok) · 🔗 Atanmamış içeren ("Detay" →
   `parse_sonuc._eslesme.detay[]` spool_no+sebep; aksiyonsuz, B-6 görünürlük) · ✅ Temiz öneri
   ("Tümünü kapat" toplu →tamamlandi, veri işlemi YOK). Liste sorgusu hafif: PostgREST JSON
   alias (`atan:parse_sonuc->_eslesme->>atanmamis`); uyarı/detay satır-başına lazy. Sekme
   rozeti açılışta embed-count ile dolar; `?sekme=onay` deep-link; kapatmalar `_tkKilit` guard'lı.
   **Kanıt:** g200 rozet 141, tekil kapatma manuel_onay 55→54+tamamlandi+1 (SQL) · hhbjşlö toplu
   24→0 + excel 1 yerinde + manuel 20 dokunulmadı (SQL) · aw231 atanmamışlı 8 + `S02 —
   kabukta_yok` detayı ekranda.
2. **devreler.html ROZETLERİ:** devre satırında `✅ N` (kuyruk gerçeği; tek sorgu
   `devre_dokumanlari!inner(devre_id)` embed → JS gruplaması → renderTable sonrası enjeksiyon;
   tıkla → `devre_detay?id=X&sekme=onay`) + İşlenenler'e turuncu ikinci rozet
   (bekliyor+isleniyor sayısı, >0'da görünür) — 157 bulgusu kapandı. Kanıt: hhbjşlö `✅ 21`
   (20m+1excel, matematik birebir), bcmghbnv `✅ 76`.
3. **W-2.14/A TASLAK VERİ KATMANI (canlı kanıtlı GEMİDE) — MK-156.1 boş gövde KAPANDI:**
   spoolYukle başında tek `if(TASLAK_KIP)` → `_taslakSpoolYukle`: devrenin excel-generic kuyruk
   işleri (oneri_hazir+manuel_onay, N iş satirlar concat) → `ARES_KABUK.grupla` → sentetik
   spooller satırı → mevcut `_spoolMap`. Render'a sıfır dokunuş (155 disiplini); akt=-1 →
   "Bekliyor", kesim/büküm boş — dürüst önizleme. Kanıt: bchmgbcmbn önizlemesi 4 spool DOLU,
   cap 60,3 / et 4,5 / ağırlıklar wizard Adım 2 ile birebir.
4. **Önizleme rötuşları (`fix(158)`):** (a) amber bant body→`.main-content`, top:52px/z:140 —
   topbar (z:150) örtülmez; (b) terfi hizası: kalite=anaMalzeme, malzeme=malKod(ham) — kalite
   kolonu doldu; (c) `taslak_duzeltmeleri` (kalem_idx=-1, alan/deger) overlay'i önizlemede
   ARES_KABUK.aktar ile AYNI ezme kuralıyla okunur (cap/et/agirlik/malzeme/kalite/yuzey/
   alistirma); (d) goSpool taslakta toast'la kilitli (sahte id ile spool_detay açılmaz).
5. **ÜÇ TEŞHİS KANITLA DEVRİLDİ — patch YAZILMADI (MK-158.1):**
   (a) "265 sekmesi boş" → benzer adlı iki devre: d222 (NB1137, 0 doküman) ayrı kayıt; 141 öneri
   aw231'de (NB1124) ve sekme orada doğruydu. (b) "backfill'de montaj dalı yok" → `eslestir()`
   montajı içinde dallıyor (kuyruk-isle:506 `okuJson.montaj`), montajda spoollar=[] Array →
   backfill ön filtresinden geçer; nitekim montaj işleri eslesen=1. (c) "montaj spool detaya
   gelmedi" → SQL: 28/36 spool montaj_json DOLU; bakılan spool ALS çiftsiz 8'dendi. UI (116/Is3)
   zinciri de sağlam. 215'te görünüp ilk bakışta 217'de görünmemesinin açıklaması veri değil
   örneklem yanılgısıydı.
6. **Canlı doğrulamalar:** terfi sonrası alıştırma sütunu DOLDU — NOT→alıştırma zinciri
   (l2-parser `alistirma_ipucu_kurali` kademeli VAR/KISMI + eslestir `deg.alistirma` +
   `deg.imalat_not`) sağlam, taslakta görünmemesi yapısal (MK-157.1). Montaj göz teyidi (157
   küçük işi) yapıldı sayılır: UI render + veri katmanı uçtan uca doğrulandı.

## Bulgular (158)
- **İş emri numarası taslak INSERT'inde üretiliyor** — karar "iptal taslaklara numara atanmaz,
  terfide üretilir"di; taslak önizlemede P26-216 görünüyor, listede 199→201→204→207→215→217
  sıçramalı. 159 teşhis: wizard INSERT + terfi akışı (read-before-write).
- PDF NOT okuma: Cihat "koptu" gözlemi bu vakada doğrulanMAdı (alıştırma doldu); genel sağlık
  için format-bazlı `not_metni` tarama + imalat_not UI görünürlük teyidi 159'a.
- hhbjşlö'nün 1 excel önerisi açık duruyor (onay modalından henüz aktarılmadı).

## Commit'ler (158)
| Commit | Mesaj |
|------|-------|
| 8174485 öncesi | `feat(158): Onay Kuyrugu sekmesi (W-2.15) — ...` |
| 486e096 | `feat(158): devreler.html onay rozetleri — ...` |
| 0a591ea | `feat(158): W-2.14/A taslak onizleme veri katmani — ...` |
| rötuş | `fix(158): taslak onizleme rotuslari — bant/kalite/duzeltme-overlay` |
| doc | kapanış dosyaları (bu commit) |
DB: migration YOK, veri UPDATE YOK. 12/12 ✓. izometri-oku DOKUNULMADI ✓. CI yeşil beklenir.

## MK kayıtları (KARARLAR.md'ye işlenecek — MK-157.x ile birlikte)
- **MK-158.1 (süreç):** Teşhis sırası VERİ (SQL) → UI → kod. Benzer adlı devre ≠ aynı devre.
  158'de üç "kırık" hipotez kanıtla öldü; sıfır gereksiz patch.
- **MK-158.2:** Onay Kuyruğu toplu kapatma = yalnız temiz izometri önerileri; atanmamışlı (B-6)
  ve excel (109/A) girmez; `_eslesme` özetsiz eski kayıtlar girer (havuz temizlenebilirliği).
- **MK-158.3:** Taslak önizleme = terfi: kalite=anaMalzeme, malzeme=malKod, taslak_duzeltmeleri
  overlay aktar ezme kuralıyla. Alıştırma/izometri taslakta yapısal yok; terfiden sonra dolar.

## 159 ANA İŞ
1) İş emri numarası terfiye taşıma teşhisi+fix. 2) NOT okuma format-bazlı kanıt turu +
imalat_not UI teyidi. 3) Format hattı (Sefine / Y200 ST37+W-3.9 / W-2.4 tasarımı).
Küçükler: KARARLAR.md MK işleme · EN/AR anahtarları · 6 B1124 PDF · IZO-KANIT-SETI v4 ·
✖ sessiz-kayıp · hhbjşlö excel aktarımı.
