# CLAUDE-SONRAKI-OTURUM.md — 174 Acilisi

## ACILIS RITUELI
1. `git pull --rebase origin main && git status && git log --oneline -8`
   -> 173 commit'leri gorunmeli: 343af6c(IS1 per-satir,HEAD) · f1c39ca(IS1) · 826a2b5(C) · b8c5819(B) ·
      f3b0765(A) · f7104b5(172 docs). Git temiz olmali.
2. Fonksiyon sayimi: `ls api/*.js | wc -l` -> 12 (MK-129.3 tavani).
3. `cat BRIEFING.md` + bu dosya.
4. PUSH = HEP `gpc "mesaj"`. Kod commit'i [skip ci] YOK; doc/migration commit'i [skip ci] ILE (HEAD'de degilse — MK-134.1).

## 174 — ILK IS ADAYLARI

### A) IS2 — terfi "Aktariliyor..." donmus hissi (BUYUK, bu oturum icin ayrildi)
> Belirti: devre_wizard_v3.html "Devreyi canliya aktar" modalinda buyuk devrede terfi uzun surer; "Aktariliyor..."
  statik kalir, ekran donmus hissi verir. Cozum: klasor yuklemedeki desen (172 iskelet+cascade / 171 progressFill)
  terfi sirasinda da calissin. ONCE terfi handler'ini (eslestir/terfi akisi) + modal markup'ini OKU (MK-126.8),
  TAHMIN ETME. Buyuk olabilir; mockup'a gore ilerleme/animasyon. Server/endpoint EKLEME (12/12).

### B) W-2.5 — Step-1 iki ilerleme cubugu (kucuk-orta, gorsel karar)
> devre_wizard_v3.html Adim 1'de iki ayri sinyal var: hazirlikKutu progressFill (hazirlik/yukleme cubugu, ~satir 382)
  + islenStrip "N PDF isleniyor..." (~satir 430/1360). Hangisi gereksiz/cakisiyor = Cihat ekranda gostersin, sonra
  tek cubuga indir. Tahminle birlestirme (MK-132.1).

### C) Spool-seviyesi hata rozeti (orta, kirilgan)
> Eski borc: dosya-adi -> spool eslemesiyle spool satirinda hata rozeti. devre_wizard_v3.html'de izi YOK ->
  muhtemelen devre_detay.html / spool_detay.html ya da hic baslanmamis. ONCE nerede olacagina karar + ilgili
  dosyayi oku. dosya-adi->spool eslemesi kirilgan (pipeline+spool anahtari; _1 sonek tuzagi).

### D) ESKI DEVIR
- kuyruk takili kayitlar (dosya_isleme_kuyrugu otomatik trigger yok; client-loop/cron drenaji mekanizma).
- W-2.9 paralel devre · Y200/format ogretimi (diger bilgisayar, zip workflow — Cihat ertelemis).
- Opsiyonel: islerken nav piline capraz-gorunum noktasi (baska sekme/cron ilerlemesi). 173'te KASTEN konmadi.

### E) KARARLAR (kok) BAKIM
> MK-173.1..4 docs/KARARLAR.md koke ISLENDI (173 ayri ek dosya YOK). 172-ek de zaten kokteydi. ACIK: kokte
  MK-169/170/171 EKSIK (MK-168'den dogrudan MK-172'ye atliyor). Eski borc — o oturumlarin karar icerigi bulununca
  (CLAUDE-SON-OTURUM arsivleri / commit gecmisi) koke islenmeli. Numarayi uydurma, kaynaktan al.

## ILKE HATIRLATMALARI
izometri-oku DOKUNULMAZ (MK-49.1) · 12/12 tavan, YENI ENDPOINT EKLEME (MK-129.3) · sema-once: information_schema,
TAHMIN ETME (MK-85.3) · once-oku-sonra-dokun (MK-126.8) · canli-pipeline tani, statik tahmin degil (MK-132.1) ·
buyuk .in() DILIMLE (MK-172.5/173.2) · claim-once-parse (MK-173.1: atomik lock parse'tan ONCE) · gece cron AYRI
(server-side), client drenajdan bagimsiz · HTML cerrahi: str_replace/Python + abort-on-mismatch + .bak +
node --check (JS) / inline-script syntax + brace dengesi (HTML) · PUSH = gpc · Excel = dayanak, delme ·
zsh ()/*/! tirnak tuzagi · MD5'li arespipe_kopyala (uc arguman).

## 173'TE EKLENEN MARKER'LAR (idempotent, tekrar patch korumasi)
api/kuyruk-isle-izometri.js: 173/CLAIM-FIRST (S1/S2) · ares-izometri-drenaj.js: 173/CLAIM-FIRST.
devre_wizard_v3.html: 173/B (hataYenidenDene+hataBandi dilim) · 173/IS1 (isl-run buton, nav sade, atlandi toast).
devreler.html: 173/C (sira* + .sira-input/.takvim-popup tombstone).
Ayni bolgeye dokunulacaksa bu marker'lar grep'le bulunur.

## TEST DEVRELERI — SILME
Hepsi test. 173: cgghmcmhgvm120, cghfdkv, hthth, thjjy, kfyukfyl, kgcdkgc, uogyol. 172: NB1099C, NB1124, M120-Galv.
170: NB1099C. 171: M110-St.St, E120-St.St. SILME.
