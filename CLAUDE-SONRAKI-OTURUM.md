# CLAUDE-SONRAKI-OTURUM.md — 173 Acilisi

## ACILIS RITUELI
1. `git pull --rebase origin main && git status && git log --oneline -8`
   -> 172 commit'leri gorunmeli (devreler sadelestirme, islenenler fix/redesign/durdur, iskelet/cascade,
      KARARLAR MK-172.x doc). Git temiz olmali.
2. Fonksiyon sayimi: `ls api/*.js | wc -l` -> 12 (MK-129.3 tavani).
3. `cat BRIEFING.md` + bu dosya.
4. PUSH = HEP `gpc "mesaj"` (add+commit+rebase+push). Manuel git push yapma (CI botu araya commit atinca reddediyor).
   Kod commit'i [skip ci] YOK; doc/migration commit'i [skip ci] ILE (ama HEAD'de degilse — MK-134.1).

## 173 — ILK IS ADAYLARI

### A) 508 / CLAIM-FIRST — bos L3 odemesini bitir (oncelik adayi)
> Belirti: in-page drenajda zaten islenmis/baska processor'un aldigi isler icin client ONCE PDF indirir +
  izometri-oku (L3 vision, pahali) cagirir, SONRA kuyruk-isle-izometri 409/508 doner. Yani bos yere L3 odenir.
> izometri-oku DOKUNULMAZ (MK-49.1). Fikir: _birIsIsle'de parse ONCESI isi "claim" (lock/owner damgasi)
  et; claim basarisizsa (baskasi almis) parse'i ATLA. kuyruk-isle-izometri server'da lock yapiyor; oradan
  "claim-only" bir mod ya da on-kontrol gerekebilir. ONCE server akisini oku (kuyruk-isle-izometri.js),
  TAHMIN ETME (MK-85.3/126.8). Server endpoint sayisi 12/12 — yeni endpoint EKLEME, mevcut moda parametre.

### B) hataYenidenDene UPDATE buyuk-.in() (MK-172.5 sinifi, latent)
> devre_wizard_v3.html hataYenidenDene: dosya_isleme_kuyrugu.update(...).in('devre_dokuman_id', ids)
  ids cok belgeli devrede yuzlerce -> ayni URL sismesi riski. _inDilimli mantigini UPDATE'e uyarla
  (dilim dilim update). Su an patlamadi ama buyuk devrede patlar.

### C) DEVRELER OLU KOD TEMIZLIGI (kucuk, opsiyonel)
> siraGuncelle / getSiraMap / _siraCache + eski .takvim-* / .sira-input CSS artik kullanilmiyor (172'de
  sira-input ve ozel takvim kaldirildi). Otomatik calismaz, zararsiz. Tek temiz patch ile sil.

### D) ESKI DEVIR (170/171'den)
- spool-seviyesi hata rozeti (dosya-adi->spool esleme; kirilgan) · dosya_isleme_kuyrugu takili kayitlar ·
  W-2.9 paralel devre · W-2.5 iki ilerleme cubugu · Y200/format ogretimi (diger bilgisayar, zip workflow).
- NOT: "gece cron gercek testi" 172'de Cihat tarafindan dogrulandi -> KAPANDI.

### E) OPSIYONEL — ISLENENLER SALT-IZLEME POLL
> Mimari: drenaj client-loop (MK-153.1), islemek icin sekme acik kalmali ya da gece cron. Eger Cihat
  "drenaj baslatmadan da ilerlemeyi izleyeyim" isterse: panel acikken islenenlerYukle'yi periyodik (orn
  4sn) poll'la (cron/baska tarayici ilerlemesi gorunur). Mimariyi degistirmez, salt gorunurluk.

## ILKE HATIRLATMALARI
izometri-oku DOKUNULMAZ (MK-49.1) · 12/12 tavan, YENI ENDPOINT EKLEME (MK-129.3) · sema-once: information_schema,
TAHMIN ETME (MK-85.3) · once-oku-sonra-dokun (MK-126.8) · canli-pipeline tani, statik tahmin degil (MK-132.1) ·
buyuk .in() listelerini DILIMLE (MK-172.5) · tek-drenaj/durdur deseni (MK-172.7) · gece cron AYRI (server-side),
client drenajdan bagimsiz · HTML cerrahi: str_replace/Python + abort-on-mismatch + .bak + JS node --check /
HTML inline-script syntax check · PUSH = gpc · Excel = dayanak, delme · zsh ()/*/! tirnak tuzagi.

## 172'DE EKLENEN MARKER'LAR (idempotent, tekrar patch korumasi)
devreler.html: 172/BTN · 172/HEAD · 172/SIRA · 172/TERMIN.
devre_wizard_v3.html: 172/ISL-FIX · 172/ISL-UI · 172/ISL-BTN · 172/ISL-PROG · 172/ISL-SK · 172/ISL-CASCADE ·
  172/ANIM-FIX · 172/DURDUR.
ares-izometri-drenaj.js: 172/DURDUR.
Ayni bolgeye dokunulacaksa bu marker'lar grep'le bulunur.

## TEST DEVRELERI — SILME
Hepsi test. 172: NB1099C, NB1124, M120-Galv. 170: NB1099C. 171: M110-St.St, E120-St.St. SILME.
