# CLAUDE-SONRAKI-OTURUM.md — 172 Acilisi

## ACILIS RITUELI
1. `gp` (yeni alias) yerine acilis kontrolu: `git pull --rebase origin main && git status && git log --oneline -8`
   -> b23192a (progress+popup), 2279d3d (modal), 03d6c74 (animasyon) gorunmeli. Git temiz olmali.
2. Fonksiyon sayimi: `ls api/*.js | wc -l` -> 12 (MK-129.3 tavani).
3. `cat BRIEFING.md` (tek aktif baglam) + bu dosya.
4. NOT: gp/gpc alias'lari kurulu — push icin HEP `gpc "mesaj"` kullan (add+commit+rebase+push tek komut).
   Manuel git push yapma; CI botu araya commit atinca reddediliyor, gpc rebase'i otomatik halleder.

## 172 — ILK IS ADAYLARI

### A) HATA BANDI RETRY — CANLI DOGRULAMA
> 171'de "Hepsini yeniden dene" eklendi ama sistemde durum=hata satiri olmadigi icin uctan uca test
  EDILEMEDI. Mekanizma statik dogru (hata->bekliyor + islenenlerDrenajDevre).
- Yapay hata uret: bir test belgesinin kuyruk satirini `UPDATE dosya_isleme_kuyrugu SET durum='hata',
  hata_mesaji='TEST 172' WHERE id='<...>'`. Devreyi wizard'da ac -> bant + buton gorunur -> tikla ->
  bekliyor'a doner, drenaj kapar, bant kaybolur. Uctan uca kanit.

### B) UI BORC ENVANTERI — DOLDURMA
> docs/UI-BORC.md iskeleti acik ama BOS (37 sayfa, durum/eksik/oncelik kolonlari).
- Cihat'in "kaba" tespiti gerekiyor. Bu sohbetten tarama YAPILAMAZ (dosyalar lokalde). Iki yol:
  (1) Cihat sayfa sayfa screenshot/sed atar, birlikte doldururuz.
  (2) Claude Code oturumu acilir, repo uzerinde gezilir.
- Doldukca: 1+4 karari -> liste cikar, dert etme, isleyince cilala.

### C) ESKI DEVIR (170'ten)
- Spool-seviyesi hata rozeti (dosya-adi->spool esleme; kirilgan) · dosya_isleme_kuyrugu takili kayitlar
  (drain trigger/cron) · gece cron GERCEK testi (yine bos) · W-2.9 paralel devre · W-2.5 iki ilerleme
  cubugu · Y200/format ogretimi (diger bilgisayar).

## ILKE HATIRLATMALARI
izometri-oku DOKUNULMAZ (MK-49.1) · 12/12 tavan (MK-129.3) · sema-once: information_schema, TAHMIN ETME
(MK-85.3 — 171'de "not kolonu" uydurmasini yakaladi) · once-oku-sonra-dokun (MK-126.8) · HTML cerrahi:
Python patch + abort-on-mismatch (anchor tekil) + .bak + idempotent marker · SCOPED CSS: paylasilan
class'i ([data-panel] vb.) global degil scope'la degistir (171/GORSEL dersi) · commit'ler ayri (kod vs doc) ·
docs/ kapanis [skip ci] · PUSH = `gpc "mesaj"` (manuel push yapma) · Excel = dayanak, delme · zsh ()/*/! tuzagi.

## 171'DE EKLENEN MARKER'LAR (devre_wizard_v3.html — idempotent, tekrar patch korumasi)
171/FAZLA-14KOL · 171/RETRY · 171/PICKER-FIX · 171/TERMIN-YUKARI · 171/GORSEL · 171/ANIM · 171/POPUP · 171/FINISH.
Ayni bolgeye tekrar dokunulacaksa bu marker'lar grep'le bulunur.

## TEST DEVRELERI — SILME
Hepsi test. 171: M110-St.St, E120-St.St ailesi · 170: NB1099C ailesi. SILME.
