# son-durum.md — Oturum 157 (2026-06-05)

## Bu oturumda ne yapıldı
1. **FORMAT TUR 1 — NB1124 TAM KAPANIŞ (44/44):** Teşhis iki kez kanıtla devrildi:
   (a) dosyaAdiParse regex'i 9/9 kalıbı (zone'suz `<NPS>x<NPS>` + segment dahil) ZATEN tutuyordu —
   Madde 0 regex genişletmesi bu aile için gereksizdi; (b) kabukta_yok ×22 YAPISALDI: hhbjşlö
   TASLAK devreydi, eslestir() spooller'dan okur, taslak spooller'a yazmaz (MK-157.1; MK-156.1'in
   eşleştirme ikizi); (c) 156'nın "22 tablosuz çizim / W-2.4 vakası" teşhisi yanlıştı — bunlar
   M+İ çiftinin MONTAJ kanadıydı (MK-157.3). 156'nın "12Ax12D çözülmüş" okuması da kuyruk durumu
   ile eşleşme durumunun karışmasıymış (oneri_hazir ≠ eslesti).
2. **eslestirme-backfill DİRİLDİ — `fix(157)` commit:** 140'tan beri production'da ölüymüş:
   modül-seviyesi `createRequire` zinciri → Vercel runtime require(ESM) desteklemiyor →
   ERR_REQUIRE_ESM, FUNCTION_INVOCATION_FAILED (izometri dalı dahil). Lokal Node 20.19+/22
   require(esm) desteklediği için lokalde görünmüyordu; repro node@20.11 ile birebir alındı.
   Fix: CJS zinciri (ares-asme/ares-olcu/malzeme-kutuphane-eslesme) lazy `import()`'a taşındı,
   yalnız tip=malzeme dalında yüklenir (üçü de UMD-guard'lı → globalThis dolar). 3 lokal test
   yeşil (20.11 yükleme + globalThis smoke + 22 regresyon). **129-130 "terfi sonrası izometri
   bağlanmıyor" borcu KAPANDI** (kökü buydu).
3. **Kanıt zinciri (canlı):** hhbjşlö terfi (22 spool + otomatik backfill — ilk seferde HTML 500
   ile düştü, log ERR_REQUIRE_ESM gösterdi) → fix deploy → kuru dry-run 22 eşleşebilir → gerçek
   koşu → **kabukta_yok 22→0, eslesti 22, cizim_durumu 22×kismi**.
4. **MONTAJ ÖĞRETİMİ (zone'suz aile):** 39a2c81b fingerprint'ine dosya_adi_regex eklendi (DB,
   dry-run→COMMIT; ilk seferde COMMIT atlandı, `fingerprint ? 'dosya_adi_regex'` teyidiyle
   yakalandı). Regex 36/36 lokal ad testi: tüm montaj kalıpları tutar (zone'suz, M110/AT,
   alt-çizgili, segmentli), imalat/diğer tutmaz — `.S01` segmenti `[._]\d+` kuralına uymadığı
   için doğal guard. Skor matrisi: montaj dosyada montaj 6-7 vs imalat 1; imalat dosyada imalat
   3+ vs montaj ≤2. 22 iş reset → global drenaj → **22/22 montaj L2 ($0, _l2_meta=object),
   montaj_var=true, montaj eşleşmesi 22/22, 22 sahte manuel_onay temizlendi.** Cache güvenliydi:
   anahtar (sha, format_id); format NULL'ken cache sorgulanmıyor → eski çöp dönemez.
5. **Onay Kuyruğu read-before-write (158 önkoşulu):** excel oneri_hazir tüketicisi VAR
   (onayModalAc→onayAktar→ARES_KABUK.aktar→tamamlandi); izometri oneri_hazir tüketicisi BİLİNÇLİ
   YOK (109/A — veri eslestir/bindir ile otomatik; "toplu onay" = durum kapatma geçişi olacak);
   izometri manuel_onay tüketicisi YOK = DELİK (buton yalnız excel dalında, uyarılar hiçbir UI'da
   açılmıyor) — 158 sekmesinin asıl yeni işi.
6. **parse_durumu KARARI:** ölü/yedek alan. Yazan: wizard INSERT + aktar (yalnız Excel
   dokümanları); izometri dokümanları hep 'bekliyor'. Okuyan devre_detay ama 102'den beri
   güvenmiyor (kuyrukMap = truth). DOKUNULMADI; KARARLAR notu: kuyruk=truth, parse_durumu=yedek.

## Bulgular (157)
- İşlenenler rozeti + boş-durum metni kuyruk gerçeğini göstermiyor: rozet taslak devre sayısı
  (0), kuyrukta 22 bekliyor vardı; "Bekleyenleri işle" GLOBAL çalışır (filtre:{}) — UI küçük işi 158.
- Vercel toast'ı backfill HTML hatasını "Unexpected token A... is not valid JSON" diye gösterdi —
  best-effort tasarımı doğru çalıştı (terfi geri alınmadı), hata mesajı yüzeye çıktı.

## Commit'ler (157)
| Commit | Mesaj |
|------|-------|
| kod | `fix(157): eslestirme-backfill ERR_REQUIRE_ESM — CJS zinciri modul seviyesinden lazy import()'a tasindi, izometri dali malzeme bagimliligindan bagimsizlasti (140'tan beri olu endpoint)` |
| doc | kapanış dosyaları (bu commit) |
DB (veri UPDATE, migration YOK): 39a2c81b fingerprint dosya_adi_regex + hhbjşlö 22 iş reset.
CI yeşil beklenir. 12/12 ✓. izometri-oku DOKUNULMADI ✓. Repo raw + lokal node repro yöntemi işledi.

## MK kayıtları (KARARLAR.md'ye işlenecek)
- **MK-157.1:** Taslak devrede kabukta_yok YAPISALDIR (eslestir spooller'dan okur; taslak
  spooller'a yazmaz, MK-127.4). kabukta_yok teşhisinde İLK kontrol = devre durumu.
- **MK-157.2:** Vercel runtime require(ESM) desteklemez; lokal Node 20.19+/22 destekler → lokal
  modül yükleme Vercel'i temsil ETMEZ. Repro standardı: `npm exec node@20.11`. Serverless'ta
  UMD/CJS dosyalar dinamik import() ile, mümkünse yalnız ilgili dalda lazy yüklenir.
- **MK-157.3:** `.SXX`'siz Cadmatic PDF = montaj adayı (M+İ çifti), tablosuz çizim varsayma.
  Montaj fingerprint'i içerik sinyaliyle yetinemez (tek-segmentlide "Continue:" yok, malzeme
  tablosu yapısal olarak yok) → dosya_adi_regex şart. W-2.4'ün "ertelenemez" gerekçesi düştü.
- **MK-157.4 (süreç):** Kuyruk DURUMU ≠ eşleşme DURUMU (oneri_hazir olmak eslesti demek değil) —
  156'daki "2 dosya çözülmüş" yanılgısının kökü. Teşhis sorgularında iki kolon ayrı okunur.

## 158 ANA İŞ
1) Onay Kuyruğu sekmesi implementasyonu (devre_detay): manuel_onay uyarı listesi
   (parse_sonuc.spoollar[].uyarilar, kod+mesaj+agirlik) + tekil kapatma · oneri_hazir toplu
   kapatma geçişi (→tamamlandi, veri işlemi YOK) · atanmamis "eşleştir" · devreler.html rozet.
   Havuz sayısını açılışta SQL ile yeniden say (157'de 22 manuel→öneri kaydı).
   Test yatağı: g200 + 265-overboard (hhbjşlö yeşil-yol örneği).
2) W-2.14 tasarımı (taslak önizleme veri katmanı — MK-127.4 bozulmaz).
3) Küçükler: İşlenenler rozet/boş-durum düzeltmesi · 6 B1124 PDF orijinal adla yükle (MK-52.1) ·
   IZO-KANIT-SETI v4 yapıştır + ad kararı · ✖ sessiz-kayıp doğrulaması · Y200 ST37 + W-3.9.
