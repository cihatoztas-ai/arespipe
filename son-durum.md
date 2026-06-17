# son-durum.md — Oturum 188 sonu

## HEAD
188 kapanisi. Kod commit: c0a4314 (188/A). Fonksiyon 12/12 (yeni api yok). Migration yok. Self-test 3/3.

## 188'de yapilanlar — A2-dilim2 KAPANDI (override spool damga + siralama + malzeme), canli-dogrulandi

### MK-188.1 — override shell sibling izometri devralma (c0a4314)
incelemeTablosu (lib/izo-eslesme.js): operator override ile eklenen PAOR shell spool (kendi spoolNo
anahtari haritada YOK) ayni cizimde kardes spool eslestiyse 'eksik' yerine 'zayif' + temsil izometri
kardesten devralinir (override_kardes:true). GUARD: yalniz sp._malzeme_devralindi===true. Tersan
S01/S02 ayni pipeline anahtarini paylasir ama override degil -> devralma YOK, gercek eksik kirmizi
kalir (B-6 korunur). _cizimDevral map: _norm(cizim_no) -> ilk eslesen izometri.

### MK-188.2 — stabil siralama (c0a4314)
incelemeTablosu return oncesi spoollar.sort: pipeline sonra spoolNo, localeCompare numeric.
_paorBolShell concat shell'i sona ekliyordu -> liste dagilik. Artik S01->S02->...->SN ardisik.

### MK-182.5 KAPANDI — shell malzeme devralma (c0a4314)
_paorBolShell (devre_wizard_v3.html) shell uretirken sibling S01 pipeline-seviyesi malzemesini
devralir: anaMalzeme/kalite/cap/et... duzeltme: anaMalzeme/kalite/cap/bom + _malzeme_devralindi:true.
toplamKg=0 (kardesin agirligi degil). et SPESIFIK -> null kalir (S03+ ET bos = dogru).

## Canli dogrulama (D-188.1)
NB138/102769: model 1 okudu, operator 10 dedi. S01-S07 hepsi zayif, izometri=...-PAOR-52600-102769-A
(kardes PDF), malzeme Karbon Celik/St37 devralindi, EKSIK=0, siralama S01->S07 ardisik. Ekran teyitli.
Not: S01/S02 ET dolu (4.5) + yuzey Galvaniz (gercek parse); S03+ ET "—" + yuzey "okunamadi" (override,
spesifik alan devralinmaz) = bilincli/dogru.

## Acik isler (carry — taze SQL, MK-163.1)
- D-188.1 render rozeti: override_kardes:true spool'a "kardes PDF" etiketi (su an duz "Zayif/dogrulanmadi").
  Kozmetik; gercek L3-zayif ile override-kardes ayrimini operatore gosterir. devre_wizard_v3.html render.
- shell ET devralma karari: S03+ ET bos. Pipeline ortak et varsa devralinabilir mi? (su an spesifik say -> null).
- Override kalicilik: WIZ._kabukSpoollar bellekte; terfide kesinlesir (TASARIM).
- b4af5c2b cizim_no=null devreler: override sibling cizim_no ile eslesmezse genismez (toast).
- 187 carry: A2 asagi-duzeltme fazla-render netlestirme.
- 186 carry: crop sertlestirme (cok-spool ucu), format_id=null cache envanteri, NPS->mm (Tersan Faz2).

## Disiplin notu
188 PAOR-scoped (guard _malzeme_devralindi). Tersan dokunulmadi. Migration/api/sema YOK -> 12/12.
Anchor-dogrulamali Python patch + .bak + MD5; node --check; self-test 3/3 ✅. Kod commit [skip ci]'siz.
