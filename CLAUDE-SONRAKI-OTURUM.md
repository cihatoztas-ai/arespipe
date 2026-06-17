# CLAUDE — Sonraki Oturum (189) Brifingi

## Acilis ritueli
cd ~/Desktop/arespipe && git pull --rebase && git status && git log --oneline -6 && ls api/*.js | wc -l
(12 olmali). Sonra oku: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md + BRIEFING.md. CI yesil, Vercel Ready mi.

## DURUM: 188 A2-dilim2 + 2 ufak eksik KAPANDI (hepsi canli-dogrulandi)
- A2-dilim2 (c0a4314): override spool "Eksik" yanlis damgasi gitti + siralama + malzeme devralma (MK-182.5 kapandi).
- 188/D (a17ab3a): "kardes PDF" rozeti (override_kardes mavi, parse-zayif turuncu).
- 188/E (2d20c4f): devre detay siralama pipeline_no->spool_no.
- Canli: NB138/102769 — S01-S07 sirali, kardes PDF rozeti, terfi sonrasi 10 kayit kalici (A-2195..A-2204).

## SIRADAKI — secim (189 acilisinda A/B/C oner)
A) shell ET devralma: S03+ override spool'larda ET bos ("—"). _paorBolShell et=null uretir (spesifik say).
   Pipeline ortak et degeri varsa (pipeline_malzemeleri?) devralinabilir mi — DATA ile bak. KUCUK.
B) 187 carry: A2 asagi-duzeltme fazla-render netlestirme (PDF'ten az sayi yazinca kalan spool fazla render).
C) 186 carry: crop sertlestirme (cok-spool 5-6 ucu), format_id=null cache envanteri, NPS->mm (Tersan Faz2).
   Tersan Faz2 buyuk kalem — yeni sohbet/oturum konusu olabilir.

## Acik isler (carry — taze SQL, MK-163.1)
- Taslak-kaydet (P2 dusuk): terfi-oncesi override kalicilik (WIZ._kabukSpoollar bellekte). Gercek akis
  terfi-oncesi hard refresh gerektirmez -> dusuk oncelik. Istenirse draft DB kayit.
- b4af5c2b cizim_no=null devreler: override sibling cizim_no ile eslesmezse genismez (toast). Kabuk null
  cizim_no'yu nasil aldi — gerekirse incele.
- yukleyen_id null debt (MK-117): api/kuyruk-isle-izometri.js:305 null yukleyen_id'de abort.
- Guvenlik: Supabase + GitHub 2FA (en yuksek oncelik, hala acik); pg_dump off-platform backup.

## Notlar (188 canli-dogrulanmis)
- incelemeTablosu (lib/izo-eslesme.js): KABUK OTORITE. _kabukAnahtarKaynak = cizim_no||pipeline.
  _cizimDevral: _norm(cizim_no)->ilk eslesen izometri. Devralma GUARD = sp._malzeme_devralindi===true.
- _paorBolShell (devre_wizard_v3.html ~839): sibling S01'den shell; malzeme devralir, toplamKg=0, et=null.
- mbadge(d, overrideKardes): override_kardes -> "kardes PDF" mavi rozet (.stamp-kardes).
- devre_detay.html spool yukleme: .order('pipeline_no').order('spool_no'). Alan pipeline_no.
- Self-test (node lib/izo-eslesme.js): 3 vaka (127 eksik korunur, 184/A kismi eslesme, 188/A override).
  Hepsi GECMELI; degisiklikte once self-test kosur.
- PAOR spool kaynagi = PDF-pozisyon. Excel YALNIZ S01 verir (farkli_spool=1).
