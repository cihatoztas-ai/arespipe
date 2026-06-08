# 169 EK NOT — COZULDU (oturum sonu)

> **DURUM: KAPANDI.** Bu nottaki `_1`-eki + eslestirme problemi 169'da cozuldu ve CANLI KANITLANDI.
> - A1: K2 elle eslestirme UI (fazla PDF -> Excel spool, overlay '_pdf_spool_map'). Commit 5f19c6e.
> - A2: terfide eslestir() overlay'i uygular (S46_1->S46, cizim_durumu eksik->kismi). Commit 09ae6ca.
> - Canli test: devre 2f88d92e, 12 elle eslestirme + terfi, hedef spool'lar 'kismi' + cap/et dolu.
> - Kural (Cihat): Excel = dayanak, sistem Excel'i delmez; global normSpoolNo soyma YAPILMADI (dar cozum).
> Asagisi 169 baslangicindaki ORIJINAL teshis notu (tarihce icin korundu).

---

# 169 EK NOT — gjsfj (NB1137) eslestirme bulgulari (168 sonu)

> Bu not 168'in EN SONUNDA, kapanis dosyalari push'landiktan SONRA bulundu. 169 acilisinda
> CLAUDE-SONRAKI-OTURUM.md ile birlikte oku. Konu: buyuk devre (gjsfj/NB1137, 165 spool) onizlemesinde
> 68 eksik + 3 fazla cikti, "tamamlanmis gibi sessiz gecti" (Cihat). KANIT zip elimde: M100-Heating_Coil
> (227 PDF, 401/402/403/404/405/406/606-HC pipeline'lari).

## TESHIS (kanitlanmis)
1. **Sorun ISLEME degil, ESLESTIRME.** Kuyruk durumu 12:58'de: bekliyor=0, hata=0, oneri_hazir=601,
   manuel_onay=103. Yani TUM PDF'ler ISLENDI (parse oldu). "68 eksik / dokuman yok" = parse oldu AMA
   spool'a baglanamadi (eslestirme anahtari tutmadi). "Henuz islenmedi" DEGIL.
2. **PDF'ler VAR (zip kaniti).** 404/405/406/606-HC'nin spool cizimleri zip'te mevcut (orn.
   `M100-355-404-HC 1(8).S03.1.pdf`) ama onizlemede HEPSI "dokuman yok". Spool PDF sayilari:
   401=44, 402=48, 403=19, 404=19, 405=11, 406=11, 606=13.
3. **Pipeline deseni — kok soru:** 401/402 ESLESTI (okundu), 403 KISMEN, 404/405/406/606 HIC eslesmedi.
   AYNI dosya adi formati. Neden bir grup tutuyor digeri tutmuyor? 169'da ESLESTIRME ANAHTARI incele:
   `devre_id + normPipeline(pipeline_no) + normSpoolNo(spool_no)` (izo-eslesme.js/kuyruk-isle-izometri.js).
   Kabukta (Excel) bu pipeline'larin pipeline_no'su dosya adindan cikanla tutuyor mu? Canli SQL ile bak:
   `SELECT pipeline_no, COUNT(*) FROM spooller WHERE devre_id=<gjsfj> GROUP BY pipeline_no;` vs dosya
   adindan dosyaAdiParse ciktisini karsilastir.

## `_1` EKI BUG'I — KANITLANDI (dun hipotez, bugun kabuk dolu oldugu icin ortaya cikti)
- Zip'te 14 `_1` ekli spool PDF var. Karsilastir:
  - `S42_1.1.pdf` → kabukta `S42_1` spool'u VAR (Excel oyle yazmis) → ESLESTI (KISMI okundu).
  - `S46_1.1.pdf` → kabukta `S46` var ama `S46_1` YOK → TUTMADI (Fazla/kabukta_yok).
- **Kok:** Excel kabugu bazi spool'lari `_1` ile (S42_1, S43_1), bazilarini `_1`siz (S46, S47) tanimliyor;
  PDF dosya adi HEP `_1` ekli. Anahtar TAM-eslesme istedigi icin yarisi tutuyor (S42_1=S42_1), yarisi
  tutmuyor (S46_1 != S46).
- **Fazla cikanlar (kabukta_yok):** M100-355-402-HC S46_1, S47_1 · M100-355-403-HC S02_1.
- **COZUM DIKKATLI OLMALI (110 dersi — yanlis eslesmektense eslesmesin):** `_1` soyma yapilmadan ONCE
  veriden dogrula: kabukta hem `S46` hem `S46_1` AYRI spool olarak var mi? Yoksa (sadece S46 var) →
  normSpoolNo'da guvenli `_\d+` soyma + birim test → S46_1 PDF'i S46 kabuguna baglanir. Varsa (ikisi de
  ayri) → soyma FELAKET, dokunma. SQL: `SELECT spool_no FROM spooller WHERE devre_id=<gjsfj> AND
  spool_no LIKE 'S46%';` → S46 ve S46_1 ikisi de donerse ayri; sadece biri donerse soy.

## "SESSIZ GECTI" — TERFI GUVENLIK ACIGI (Cihat'in asil endisesi)
- Cihat ilkesi: "devreleri yuklerken hata yaparsak programin geri kalanina kimse itibar etmez."
- 165 spool'un 68'i eksik gorunuyor ama PDF'ler aslinda var (zip) + parse oldu (kuyruk bos) — sadece
  ESLESMEDI. Yine de "Devreyi Onayla" butonu AKTIF → kullanici yarisi eksikken/eslesmemisken terfi
  edebilir. Onizlemedeki "68 eksik · onayda uyari cikarir" YETERLI DEGIL (zayif uyari).
- **169 borcu (yuksek oncelik):** Terfi-oncesi GUCLU kapi. Secenekler: (a) eksik/eslesmemis spool varken
  terfi engelle/sert onay iste, (b) "X spool eslesmedi, PDF'ler var ama anahtar tutmadi — once duzelt"
  net uyari, (c) terfi-sonrasi backfill'in eslesmeyenleri tekrar denemesi + sonucu gosterme.

## ZIP REFERANSI (169'da analiz icin)
- Cihat'in yukledigi: M100-Heating_Coil.zip = 227 PDF + 2 xlsm + 1 xlsx + 1 db. Bu, gjsfj devresinin
  tam dosya seti. 169'da `_1` eki + pipeline-anahtar sorununu bu zip'le yerel olarak test edebiliriz
  (dosyaAdiParse'a gercek adlari verip ne cikardigina bakmak — izometri-oku DOKUNULMADAN).

## 169 ONCELIK SIRASI (oneri)
1. **gjsfj eslestirme kok neden:** neden 404/405/406/606 hic eslesmedi (pipeline_no anahtari) — SQL.
2. **`_1` eki:** kabukta rakip var mi (SQL) → yoksa guvenli soyma + birim test.
3. **Sessiz terfi kapisi:** eslesmemis spool varken guclu uyari/engel.
4. (Onceki borclar: A=UI soru kaldir, B=ST35.8/ST37 karbon, W-2.UI yukleme takilmasi, MK-168.1 schedule,
   MK-168.3 508.)

## KUYRUK ANLIK (168 sonu, 12:58)
bekliyor=0 · hata=0 · oneri_hazir=601 · manuel_onay=103 · tamamlandi=186 · iptal=1336.
Backlog eridi (oglen 142 bekliyor + 4 hata → 0). hata 4→0 NASIL temizlendi belirsiz — 169'da bak
(wizard manuel-retry? baska yol? devre iptali?).
