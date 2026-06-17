# son-durum.md — Oturum 188 sonu (FINAL)

## HEAD
2d20c4f. Kod commit zinciri: c0a4314 (A2-dilim2) -> a17ab3a (188/D rozet) -> 2d20c4f (188/E detay sira).
Fonksiyon 12/12. Migration yok. Self-test 3/3. CI gecti.

## 188'de yapilanlar — A2-dilim2 + 2 ufak eksik, HEPSI CANLI DOGRULANDI

### A2-dilim2 (c0a4314) — override spool damga + siralama + malzeme
- MK-188.1: incelemeTablosu (lib/izo-eslesme.js) override shell sibling izometri devralma. Override ile
  eklenen PAOR spool (spoolNo anahtari haritada YOK) ayni cizimde kardes eslestiyse 'eksik' yerine 'zayif'
  + izometri kardesten devralinir (override_kardes:true). GUARD: sp._malzeme_devralindi===true (sadece
  _paorBolShell override shell'leri). Tersan dokunulmaz (B-6 korunur).
- MK-188.2: incelemeTablosu return oncesi stabil sirala (pipeline -> spoolNo, localeCompare numeric).
- MK-182.5 KAPANDI: _paorBolShell (devre_wizard_v3.html) sibling S01 malzemesini devralir
  (anaMalzeme/kalite/cap/bom + _malzeme_devralindi:true). toplamKg=0, et=null (spesifik).

### 188/D (a17ab3a) — "kardes PDF" rozeti
mbadge override_kardes:true icin "kardes PDF" (mavi .stamp-kardes), "dogrulanmadi" (turuncu) ile ayrim.

### 188/E (2d20c4f) — devre detay siralama
devre_detay.html .order('spool_no') -> .order('pipeline_no').order('spool_no'). Tek-alan tum S01'leri
one topluyordu. Alan pipeline_no (kod + information_schema teyitli).

## Canli dogrulamalar
- D-188.1: NB138/102769, model 1 okudu operator 10 dedi. S01-S07 zayif, izometri=kardes PDF, malzeme
  devralindi, EKSIK=0, sirali. S03+ "kardes PDF" mavi rozet, S01/S02 "dogrulanmadi" turuncu.
- D-188.2: override terfi sonrasi KALICI. devre_detay 10 kayit, spool_id A-2195..A-2204. Detay siralama
  001-S01..S07 -> 002-S01 -> 003-S01..S02 ardisik (hard refresh sonrasi). Override kaybi yalniz terfi-
  oncesi hard refresh'te = TASARIM.

## Acik isler (carry — taze SQL, MK-163.1)
- Taslak-kaydet (P2): terfi-oncesi override kalicilik (WIZ._kabukSpoollar bellekte). Gercek akis terfi-
  oncesi yenileme gerektirmez -> dusuk oncelik. Istenirse draft DB kayit.
- shell ET devralma: S03+ ET bos (override spesifik alan devralmaz). Pipeline ortak et varsa devralinsin mi?
- b4af5c2b cizim_no=null devreler: override sibling cizim_no ile eslesmezse genismez (toast).
- 187 carry: A2 asagi-duzeltme fazla-render netlestirme.
- 186 carry: crop sertlestirme (cok-spool ucu), format_id=null cache envanteri, NPS->mm (Tersan Faz2).
- yukleyen_id null debt (MK-117): kuyruk-isle-izometri.js:305 abort.

## Disiplin notu
188 tamami PAOR-scoped (guard _malzeme_devralindi). Tersan dokunulmadi. Migration/api/sema YOK -> 12/12.
3 kod commit, hepsi anchor-Python+.bak+MD5, self-test 3/3, canli dogrulandi. Doc commit [skip ci].
