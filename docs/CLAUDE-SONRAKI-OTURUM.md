# CLAUDE-SONRAKI-OTURUM.md — 169 Acilisi

## ACILIS RITUELI
1. `git pull --rebase && git status && git log --oneline -6` — `bf87c6a` (docs 168 KARARLAR) ve
   `ee33cf9` (izometri-cron.yml agaca) gorunmeli + CI botu ci-son-rapor.json. Git temiz olmali
   (168'de lokal=origin dogrulandi, ayrisma YOK).
2. Fonksiyon sayimi: `ls api/*.js | wc -l` → **12** (MK-129.3 tavani; workflow Vercel fonksiyonu degil).
3. `cat BRIEFING.md` (tek aktif baglam) + bu dosya.
4. Agir is one (context taze).

## 169 — ILK IS: GECE CRON GERCEK TESTI TEYIDI
> 168 sonunda buyuk bir devre yuklendi, sayfa kapatildi, beklendi. 03:00 Vercel cron izometriyi
> surmeli (CRON_SECRET Production'da → Bearer otomatik → MK-167.2 kabul → 200). Bu, manuel dispatch'le
> kanitlanan mekanizmanin OTOMATIK halinin ilk gercek testi.

**Teyit SQL:**
```sql
SELECT durum, COUNT(*), MAX(bitis_at) AS son
FROM dosya_isleme_kuyrugu WHERE parser='izometri'
GROUP BY durum ORDER BY durum;
```
Beklenen: `bekliyor` dusmus, `oneri_hazir`/`manuel_onay` artmis, `son` ~03:00 (Europe/Istanbul'a cevir:
UTC+3 → DB UTC saklar, 00:00 UTC civari) zaman damgali. Agir/cok-sayfali PDF'ler `hata`'da (508,
MK-168.3) kalabilir; gerisi islenmis olmali. Vercel → Logs/Deployments → 03:00 cron calismasi 200 mu.
**Cron 200 ama islenmediyse:** CRON_SECRET son deploy'dan SONRA eklendiyse redeploy gerekebilir (env
yansimasi). Once Vercel cron log'unun HTTP kodunu gor.

## 169 — C-A-B KALANI (C yapildi, A+B sirada)
- **A (UI — onerilen ilk is):** Devre yuklenince "islensin mi / siraya mi atayim" SORUSUNU KALDIR.
  Yuklenen her dokuman otomatik islenecekler kuyruguna dussun → kullanici "Islenenler"den takip etsin
  (167 felsefesi: yukle-kapat-git). **Once kaynagi bul (MK-126.8):** soru nerede soruluyor —
  devre_wizard_v3.html yukle akisi mi, MK-49.B upload bileseni mi? grep ile bul, sonra dokun. Kucuk UX.
- **B (malzeme):** ST35.8 ve ST37 KARBON CELIK ama sistem "Diger" diyor. **Once "Diger"i kim yaziyor
  bul** (lib/excel-parser.js sozlugu / ARES_NORM regex / lib/malzeme-kutuphane-eslesme.js), sonra
  karbon eslesmesi ekle. izometri-oku DOKUNMA (MK-49.1).

## 169 — TERFI-SONRASI ESLESTIRME TESTI (C bulgusunun gercek dogrulamasi)
> 168'de "Fazla/kabukta yok" satirlarinin bug DEGIL, terfi-edilmemis-kabuk oldugu kanitlandi (taslak
> devre, spooller bos). Gercek dogrulama: bir taslak devreyi "Incele & Onayla" ile TERFI et →
> (a) spooller doluyor mu (terfi kabugu yaziyor mu), (b) eslestirme-backfill "Fazla"lari bagliyor mu.
> EGER backfill sonrasi `_1`-ekli dosyalar (orn. S02_1.1.pdf) hala atanmamis kaliyorsa → O ZAMAN
> gercek bir anahtar sorunu var (dosyaAdiParse `S02_1` cikariyor, kabuk `S02` → tutmuyor); cozum
> normSpoolNo'da guvenli `_\d+` soyma + birim test (kabukta `S02_1` rakip YOKSA). Kabukta hem S02 hem
> S02_1 varsa AYRI spool → soyma FELAKET → dokunma. Veriden karar ver.
- Onay kusagi GUNCEL: oneri_hazir=480 + manuel_onay=79. Aktif devrelerde 277 atanmamis (terfi-sonrasi
  re-esle kosmus mu / anahtar neden tutmuyor — ayri borc, dogal ornekle).

## ACIK BORCLAR (oncelik)
- **W-2.UI** (168 tespit): yukleme/acilis ekrani 78 belgede UZUN "yukleniyor"da takiliyor (senkron
  tum-dokuman). Pilot riski (Windows operator). Cozum: ozet/sayac + lazy-load.
- **MK-168.1** GitHub `*/3` schedule gun-ICI otomatik tetiklenmiyor. 169'da Actions → izometri-kuyruk-
  drenaj'da schedule kosusu cikti mi izle. Gelmezse: frekansi seyret veya gece cron'a yaslan (Pro SART
  DEGIL). Mekanizma manuel dispatch + gece cron ile zaten calisiyor.
- **MK-168.3** izometri-oku HTTP 508 (server self-call). Agir/cok-sayfali PDF cron yolunda 508.
  izometri-oku DOKUNULMAZ → cozum cagri katmaninda (client-parse esdegeri / farkli cagri). BUYUK is.
- **Y200 ogretimi** (diger bilgisayar; rece FORMAT-OGRETIM-ATOLYE-162.md'de aynen) — schedule et kaniti.
- **W-2.5** (iki ayri cubuk: yukleme + arka isleme) · **W-2.9** (eszamanli paralel devre).

## ILKE HATIRLATMALARI
izometri-oku DOKUNULMAZ (MK-49.1) · 12/12 tavan (MK-129.3) · sema-once (MK-85.3 — 168'de 2 kez ihlal
edip duzelttim: dosya_adi + batch_id kolonlari; information_schema ile dogrula, TAHMIN ETME) ·
once-oku-sonra-dokun (MK-126.8 — 168'de iki bos commit'ten korudu) · arespipe_kopyala MD5 (MK-51.1,
sira: kaynak ONCE/hedef SONRA) + git status (MK-101.1) · migration olursa BEGIN…ROLLBACK dry-run
(MK-98.2) · commit'ler ayri blok (kod vs doc) · KARARLAR.md = docs/KARARLAR.md (kok DEGIL, eski) ·
node --check + birim test ship oncesi · docs/ klasorune kapanis [skip ci] · zsh `()`/`*`/`!` tuzagi.

## TEST DEVRELERI — SILME
"bn omn" (77bfbc98) · "b nn" (e0af361d, taslak) · 168 yuklemeleri: ae39c5c2 (taslak, 78 belge),
bcb3192a (M100-355-401/402-HC, 508 veren agir PDF'ler).
