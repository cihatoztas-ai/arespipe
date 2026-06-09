# CLAUDE-SONRAKI-OTURUM.md — 171 Acilisi

## ACILIS RITUELI
1. `git pull --rebase && git status && git log --oneline -6` — 05ca11e (hata bandi), b55157b (Isle/Izle),
   faa5079 (karar ekrani) gorunmeli + CI botu ci-son-rapor.json. Git temiz olmali.
2. Fonksiyon sayimi: `ls api/*.js | wc -l` -> 12 (MK-129.3 tavani).
3. `cat BRIEFING.md` (tek aktif baglam) + bu dosya.
4. Agir is one (context taze).

## 171 — ILK IS ADAYLARI

### A) B — SPOOL SEVIYESI HATA ROZETI
> 170/#3 dosya seviyesinde cozdu (hata bandi: hangi belge patladi + sebep). B = bunu spool satirina tasi.
- Patlayan dosya adini dosyaAdiParse ile pipeline+spoolNo'ya cevirip cetele satirini "hata" rozetle
  (su an "eksik / dokuman yok" gibi gorunuyor). UYARI: dosya-adi->spool esleme KIRILGAN; tutmazsa
  satiri rozetleme, bant yeterli. izometri-oku DOKUNULMAZ (dosyaAdiParse'i nereden cagiracagini once bul).

### B) TEKRAR DENE (hata bandina)
> Patlayan PDF'i yeniden kuyruga sok. Kucuk ama YAZMA: durum hata->bekliyor (+ deneme_sayisi?).
- Once drenaj claim/retry mantigini oku (MK-167.1 claim guard, deneme_sayisi) — durum sifirlamak yeterli
  mi yoksa baska alan lazim mi. Once-oku-sonra-yaz.

### C) ESKI DEVIR
- dosya_isleme_kuyrugu takili kayitlar (drain trigger/cron) · gece cron GERCEK testi (yine bos) ·
  W-2.9 paralel devre · W-2.5 iki ilerleme cubugu · Y200/format ogretimi (diger bilgisayar).

## ILKE HATIRLATMALARI
izometri-oku DOKUNULMAZ (MK-49.1) · 12/12 tavan (MK-129.3) · sema-once: information_schema/CHECK,
TAHMIN ETME (MK-85.3) · once-oku-sonra-dokun (MK-126.8) · HTML cerrahi: Python patch + abort-on-mismatch
(anchor tekil) + .bak + MD5 + idempotent marker; node --check ayiklanan JS'e · commit'ler ayri (kod vs doc) ·
docs/ klasorune kapanis [skip ci] · Excel = dayanak, delme (Cihat 169) · zsh ()/*/! tuzagi · tek satir commit.

## DORMANT KOD (170'te birakildi, silinmedi — bilerek)
- devre_detay.html: TASLAK_KIP / _tkBanner / _tkKilit / _taslakSpoolYukle artik ulasilmaz (redirect once).
- devre_wizard_v3.html: islenenlerOnizle() ve kararIncele() referanssiz. Geri donulmek istenirse hazir.

## TEST DEVRELERI — SILME
Sistemde GERCEK devre YOK, hepsi test (Cihat). 170: NB1099C ailesi — vmh cvv
(841b117f-ef40-4b9c-b600-488444e734b8), hvbjhovojh, ovvmhc, gsdhh, b nn, hvbn o, gcmhgcm. SILME.
