# CLAUDE — Sonraki Oturum (189) Brifingi

## Acilis ritueli
cd ~/Desktop/arespipe && git pull --rebase && git status && git log --oneline -6 && ls api/*.js | wc -l
(12 olmali, MK-129.3). Sonra oku: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md + BRIEFING.md.
CI yesil mi, Vercel Ready mi.

## DURUM: 188 A2-dilim2'yi KAPATTI (canli-dogrulandi)
- MK-188.1 (c0a4314): override shell sibling izometri devralma — "Eksik/dokuman yok" yanlis damgasi gitti.
- MK-188.2 (c0a4314): stabil siralama S01->SN ardisik.
- MK-182.5 KAPANDI (c0a4314): shell malzeme devralma (anaMalzeme/kalite/cap/bom).
- D-188.1: NB138/102769 ekran teyitli (S01-S07 zayif, izometri kardes PDF, EKSIK=0, sirali).

## SIRADAKI — secim (A/B/C onerisi 189 acilisinda)
A) D-188.1 render rozeti (KUCUK): override_kardes:true spool'a "kardes PDF" etiketi. Gercek L3-zayif ile
   override-kardes'i operatore ayirt ettir. devre_wizard_v3.html render fonksiyonu (renderInceleme/
   incele tablosu cizen yer) okunacak. Su an ikisi de duz "Zayif/dogrulanmadi" -> ayni gorunuyor.
B) 187 carry: A2 asagi-duzeltme fazla-render netlestirme (PDF'ten az sayi yazinca kalan spool'lar fazla
   render olur, honest ama UI'da netlestir).
C) 186 carry temizligi: crop sertlestirme (cok-spool 5-6 ucu), format_id=null cache envanteri, NPS->mm
   bug (Tersan Faz2).

## Acik isler (carry — taze SQL, MK-163.1)
- shell ET devralma: S03+ ET bos (override spesifik alan devralmaz). Pipeline ortak et varsa devralinsin mi?
- Override kalicilik: WIZ._kabukSpoollar bellekte; sayfa kapanirsa kaybolur, terfide kesinlesir (TASARIM,
  istenirse taslak-kaydet eklenebilir).
- b4af5c2b cizim_no=null devreler: override sibling cizim_no ile eslesmezse genismez (toast). Bu devrelerin
  kabugu nasil null cizim_no aldi — gerekirse incele.
- yukleyen_id null debt (MK-117/open): api/kuyruk-isle-izometri.js:305 null yukleyen_id'de abort.
- Guvenlik: Supabase + GitHub 2FA (en yuksek oncelik, hala acik); pg_dump off-platform backup.

## Notlar (188 canli-dogrulanmis)
- incelemeTablosu (lib/izo-eslesme.js): KABUK OTORITE. Kabuk spool anahtari _kabukAnahtarKaynak =
  cizim_no || pipeline. _cizimDevral: _norm(cizim_no) -> ilk eslesen izometri. Devralma GUARD =
  sp._malzeme_devralindi===true (yalniz _paorBolShell override shell'leri).
- _paorBolShell (devre_wizard_v3.html ~839): sibling S01'den shell uretir; malzeme devralir
  (_malzeme_devralindi:true), toplamKg=0, et=null.
- Self-test (node lib/izo-eslesme.js): 3 vaka — 127 (eksik korunur), 184/A (kismi eslesme), 188/A
  (override devralma+siralama). Hepsi ✅ kalmali; degisiklikte once self-test kosur.
