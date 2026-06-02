# AresPipe BRIEFING — 141. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.

## HEAD
`9bef168` fix(spool_detay): flansh modal/MAP terk edilen spool_flansh_eslesme yerine FK'dan
- `7e86e72` STANDART sutunu tip yerine FK · `ba6911c` tarayici backfill suʼper-admin sayfasi

## 141 — yapılanlar
1. **MK-141.1 — Sunucu backfill çöktü → B PLANI.** `eslestirme-backfill` tip=malzeme dali Vercel'de modul-yukleme cokuyordu (ares-asme/ares-olcu serverless'ta patliyor, createRequire yetmedi). Stack 2 oturumdur alinamadi. Karar: backfill tek-seferlik veri isi → **tarayiciya tasindi** (MK-127.4 deseni). Server dali olu kaldi (142'de geri cekilecek mi karar).
2. **MK-141.2 — admin/kutuphane-backfill.html.** Suʼper-admin sayfasi: ARES_OLCU/ARES_BORU+cekirdek tarayicida, RLS suʼper-admin oturumuyla cozuldu. Cekirdege browser-guard (`window.MALZEME_ESLESME`), CJS export korundu (tek kaynak MK-109.1). kutuphane.html + panel.html nav'a link. Yeni sunucu fn yok (12/12).
3. **Backfill kostu (CANLI):** 1000 FK-bos satir, 308 anahtar, **142 lookup → 142 FK yazildi** (DB sayim 143). DN15..DN300 karbon slip-on/WN baglandi. M5 DN300 → EN-1092-1 canlida teyit + modal aciliyor.
4. **MK-141.3 — spool_detay FK-oncelikli.** geomStandart + geomBagli + FLANSH_MAP artik tip yerine DOLU FK'ya bakar (kalem tip='fitting' ama flansh — kaynak veri yanlis). `spool_flansh_eslesme` OLU tablo (tek 41.oturum pilot kaydi) terk edildi; modal/MAP FK'dan. BORU_MAP'e dokunulmadi (runtime boruEslestir, ayri tasarim).
5. **MK-141.4 — TESHIS: backfill kismi, IKI BUG.** Cihat yakaladi: taninan cok malzeme var, kutuphane dolu (flansh 15+ profil, fitting 897 satir) ama baglanmadi. Kanit:
   - **BUG-A (fitting kod uyumsuzlugu, BUYUK):** cekirdek `parca_tipi:'elbow_90lr'` uretiyor; `fitting_olculer` profili `elbow_90lr|cunife:23`, ama karbon/paslanmaz fitting kutuphanede `45SW|karbon`, `90_3D|karbon` gibi FARKLI kodlarda. 897 fitting satiri, 0 baglandi. Cekirdek fitting anahtari ↔ kutuphane parca_tipi semasi UYUSMUYOR.
   - **BUG-B (DN125 tolerans, KUCUK):** cekirdek DN125 karbon → cap_mm=141.3; kutuphane EN-T01 PN16'da 139.7 var. Fark 1.6 > tolerans ±0.6 → eslesmedi. ares-olcu DN125 mm sapmasi VEYA tolerans dar.
   - **Paslanmaz flansh:** kutuphanede YOK (sadece karbon EN-T01 + cunife EN-T05) → C plani, dogru NULL.

## §13.7 DURUM
Baglama katmani KURULDU ve calisiyor (matcher→FK→render→modal uctan uca). 142 karbon flansh canli. **AMA** fitting tamamen, bazi flansh olculeri (DN125) ve paslanmaz baglanamadi — bug + kapsam. §13.7 "katman var" tarafi KAPANDI; "tum taninan baglanir" tarafi 142'ye.

## AÇIK BORÇ (142 ilk is)
- **BUG-A fitting kod kazisi (ILK IS):** cekirdek `elbow_90lr/elbow_45sr/reducer_conc/tee_eq` ↔ kutuphane `45SW/90_3D/...`. Hangisi kanonik? Kutuphane karbon fitting kodlamasi tutarsiz gorunuyor (`45SW`, `90_3D` vs cunife `elbow_90lr`). ONCE kutuphane parca_tipi semasini oku (tum distinct degerler), sonra cekirdegi/kutuphaneyi hizala. Tahminle yazma (MK-126.8).
- **BUG-B DN125 tolerans:** ares-olcu DN125→141.3 mu 139.7 mi dogru? EN-1092-1 DN125 OD=139.7. ares-olcu'da DN125 sapmasi varsa duzelt; yoksa flansh toleransini gozden gecir (riskli, yanlis eslesme).
- **Backfill idempotent:** iki bug duzelince admin/kutuphane-backfill.html tekrar kostur → kalanlar baglanir.
- **tip='fitting' ama flansh = AYRI VERI BORCU:** render FK-oncelikli ile maskelendi ama tip alani yanlis (rapor/filtre/sayim etkilenebilir). Kok duzeltme ayri.
- **Sunucu eslestirme-backfill tip=malzeme dali:** olu/cokuyor. Geri cekilsin mi (endpoint izometri'ye donsun, temizlik) yoksa dursun mu — karar 142.
- **C plani (kapsam):** paslanmaz EN-1092-1 flansh, DN400+ slip-on, fitting karbon/paslanmaz veri. Organik, suʼper-admin.
- **MK-139.1 gorsel teyit (taslak cap):** hala acik.

## PLAN
| Adim | Durum |
|---|---|
| A·cekirdek (mm-kanonik) | ✅ repoda, test yesil |
| A·backfill (tarayici, B plani) | ✅ calisti, 142 FK |
| spool_detay FK-oncelikli (STANDART+modal) | ✅ canli teyit |
| BUG-A fitting kod hizalama | ⚠ 142 ILK IS |
| BUG-B DN125 tolerans | ⚠ 142 |
| Backfill re-run (bug sonrasi) | bug'lar cozulunce |
| C (kutuphane kapsam) | arka plan, organik |

## NEREDEYIZ
Baglama katmani calisiyor, ispatlandi (142 canli). Sirada baglamanin KAPSAMI: fitting kod uyumsuzlugu cozulunce 897 satir devreye girer. Kutuphane doldurma (C) hala arka plan.
