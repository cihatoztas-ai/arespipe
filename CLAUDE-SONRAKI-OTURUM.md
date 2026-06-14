# CLAUDE — Sonraki Oturum (185) Brifingi

## Açılış ritüeli (her zaman)
```bash
cd ~/Desktop/arespipe
git pull --rebase           # CI-bot [skip ci] rapor commit'leri araya girer
git status
git log --oneline -3
ls api/*.js | wc -l         # 12 olmalı (MK-129.3)
```
Sonra: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md oku. CI yeşil mi (HEAD `[skip ci]` ise son KOD commit'inin CI'sına bak). Vercel son deploy "Ready" mi.

## DURUM: PAOR Faz1 + A (çok-spool bölme) + #2b (terfi köprüsü) CANLI ÇALIŞIYOR
184'te iki büyük iş kapandı, ikisi de canlı testle kanıtlı:
- **A — çok-spool bölme:** Bir PAOR fab PDF'i N spool içerince (L3 `sonuc_spool_sayisi`), kabuk S01..SN üretir. 7-spool testi (773/774/775 = 3+2+2) geçti, terfide 7 `spooller` satırı.
- **#2b — terfi köprüsü:** `spooller.cizim_no` (migration 104) ile terfi-sonrası izometri→spool bağlama PAOR'da çalışır. Tek-spool testi (779/780/781) geçti: cizim_no yazıldı + izometri bağlandı (`eslesti`, atanmamis 0).

## ⚠️ PAOR TEST KURALLARI
- **L3 mutlaka AÇIK** (MK-183.2). Kapalı → fab PDF "sakla" yoluna düşer, parse yok, hiçbir şey eşleşmez (bug DEĞİL).
- **TAZE devre** kullan. Terk-taslak kuyruğu `iptal` damgası alır (W-2.13). Mükerrer test devreleri biriktiği için devre-scoped SQL şart (MK-163.1) — `LIKE '%cizim%'` global sorgu YANILTIR (184'te saatler kaybettirdi: devre-scoped olmayan sorgu yanlış devreden veri çekti).
- **Hard-refresh (Cmd+Shift+R)** — wizard statik HTML cache'i.
- **Şema değişen işte: migration APPLY (canlı DB) → SONRA kod deploy** (MK-184.5). 184'te kod önce gitti, terfi denenmeden migration yetişti — şanslıydık. Supabase migration'ları auto-apply DEĞİL; SQL Editor'de elle koşulur + dosya repoya commit (iki ayrı şey).

## İLK İŞ ÖNERİSİ: çok-spool köprü tam-kapsam + B (BOM dağıtımı)
**(a) Çok-spool köprü doğrulaması (769/771 seti):** #2b yalnız tek-spool (S01) köprüsüyle canlı test edildi. Mantık aynı ama **S02/S03'ün cizim_no'yla bağlandığı henüz canlı görülmedi.** Taze devre + 769/771 (2'şer spool) → terfi → backfill → `detay`'da S01+S02 ikisi de `eslesti` mi? Hızlı, köprüyü çok-spoolda kilitler.

**(b) B — BOM dağıtımı (MK-182.5):** A'da S02..SN boş shell (M1: BOM S01'de). Şimdi kayıt-bazlı dağıtım: `spoollar[n].malzeme_listesi` BOŞSA pipeline-paylaşımlı, DOLUYSA per-spool. PAOR'da her çizimin kendi Excel'i. **DİKKAT: Tersan'ı bozma** — ayrışma yalnız PAOR yolunda.

Sıra önerisi: önce (a) hızlı doğrulama, sonra (b).

## Diğer açık borçlar (carry — taze SQL ile doğrula, MK-163.1)
- **MK-184.1 — Şef konsolidasyonu (orta iş):** Spool-kimlik stratejisi DUPLİKE/satır-içi: `devre-inceleme.js:147` + `kuyruk-isle-izometri.js:663` aynı `if(sp_kaynak==='pozisyon') S0n` mantığını elle kopyalıyor + `spoolNormalize` eslestir'de var inceleme'de YOK (drift riski). Çözüm: kanonik `spoolAnahtarlariUret(dp, spoollar)` helper, iki tüketici onu çağırsın. Yeni format = tablo satırı + tek case. Cihat "orkestra şefi" diye sordu: tablo (`DOSYA_DESENLERI`) VAR ama tüketici-strateji dağınık — konsolidasyon bunu kapatır. ~1 oturum, düşük risk.
- **MK-184.2 — ölü kod:** `izo-eslesme.js` `eslesenIzoIdx` artık fazla'da kullanılmıyor (184/A anahtar-seviyesine geçti), eşleştirme döngüsünde populate kalıyor. Temizlik, düşük öncelik.
- **MK-184.4 — montaj köprü boşluğu:** `kuyruk-isle-izometri.js:840` `montajEslestir` ctx-siz harita'sı cizim_no taşımıyor → drain-yolu PAOR-montaj bağlama kopuk. Backfill yolu (ctx.harita, satır 826) zaten kabukYukle'nin düzeltilmiş harita'sını devralır → kapsanıyor. Yalnız drain-yolu PAOR montajı için 840+831'e cizim_no eklemek gerekir (Tersan fallback ile güvenli). PAOR montaj test edilmemiş — dikkatli.
- **PAOR veri-kalite paketi:**
  - `agirlik_kg` null (tüm PAOR spool'ları 0 kg) — `_paorKabukSatirlar` `agirlik_kg:''` sabit → K2 kütüphane türetimi gerek.
  - Kalem-seviyesi kalite "karbon" (kalite değil malzeme metni). Spool başlığı doğru (St 37); kalem `grupla.konsolide` kalite taşımıyor → `aktar` `b.kalite` undefined. **DİKKAT: ares-kabuk.js Tersan-paylaşımlı, dikkatli.**
  - Et boş — adaptör kabuğa yalnız DN geçiriyor (`T:x MM` çıkarmıyor), boyutParse tablo türetmesine kalıyor.
  - Yüzey: 779/780/781'de "Galvaniz" GELDİ (iyileşme), ama bazı setlerde "Diğer" — `_yuzeyHamCikar` token bağımlı.
  - **D-182.2** imalat/montaj malzeme çelişkileri: K2 kıyas yakalıyor (`malzeme_kiyas.celiski_sayisi`), örn. 779'da et 6.8(pdf) vs 8.8(excel), flans adet 2 vs 1, DOUBLER Ø300 vs Ø305. Bağlamayı bozmuyor, ayrı iş.
- **#2b L3 routing kırılganlığı (carry):** `devre_wizard_v3.html:793` `else if(WIZ.l3_acik && d===imalat)` referans-eşitliği. Dosya-adı eşleşmesine geçir (`d.dosya_adi===imalat.dosya_adi` / `!Isometric_View`). Düşük öncelik, temiz akışta tutuyor.
- **Mükerrer test devresi temizliği:** 102769/770/771/773/774/775/779/780/781 birçok devre_id'de. Önce devre-scoped `SELECT COUNT`, sonra tek-statement.
- **NPS→mm bug** (`ares-olcu.js`): PAOR'u ETKİLEMEZ, Tersan Faz2 blocker.
- **MK-184.3 KARARLAR.md eksik:** Köprü kararı KARARLAR.md'ye eklenmedi (commit'te yalnız .sql vardı). 185 açılışında backfill et.

## Notlar (184 canlı-doğrulanmış)
- **Eşleştirme anahtarı (her üç tüketici):** PAOR = `cizim_no | pozisyon-spool (S0n)`. İzometri tarafı = `dosyaAdiParse.pipeline_no (drawing-no) | S0n`. Tersan = `pipeline_no | spool_no` (cizim_no boş → fallback). İnceleme (`izo-eslesme.js _kabukAnahtarKaynak`), terfi-bağlama (`kuyruk-isle kabukYukle harita`), her ikisi `cizim_no || pipeline_no`.
- `dosyaAdiParse('11D-PAOR-52600-NNNNNN-A.pdf')` → `{pipeline_no:'52600-NNNNNN', spool_no:null, aile:'paor', spool_kaynak:'pozisyon'}`. Isometric_View dosyası → null (regex `-[A-Z0-9]+\.pdf$`'e uymaz).
- `izometri_batch_kayitlari.sonuc_spool_sayisi` (int) = otorite spool sayısı. AMA inceleme endpoint'i bunu DEĞİL `dosya_isleme_kuyrugu.parse_sonuc.spoollar`'ı okur — orada da N spool var (kuyruk_spool_say). spool obj `spool_no` GÜVENİLMEZ ("[1]" vb.), endpoint pozisyonla S0n üretir.
- **FAZLA artık anahtar-seviyesi** (184/A): çok-anahtarlı izometride bir spool tutsa da eşleşmeyen anahtarlar (S02..SN) ayrı fazla'ya düşer. Wizard `_paorBolShell` (canlı) bu fazla'dan boş shell enjekte eder + tek re-call → S02 eşleşir.
- `spooller`: `cizim_no` (text, null) CANLI (migration 104, count=1 doğrulandı). `olusturma` (NOT `olusturma_at`), `spool_id` text (A-002162 wider format). İzometri bağ kaydı `dosya_isleme_kuyrugu.parse_sonuc._eslesme.{eslesen,atanmamis,detay[]}` içinde — `detay[].durum:'eslesti'` = bağlandı.
- Kuyruk durum: PAOR L3 başarı → `oneri_hazir`. `iptal` = W-2.13 terk-taslak (Tersan'da 2473+, ASLA global kabul listesine ekleme).
- `fitting_olculer` işi varsa açılışta `SELECT COUNT(*)` (≈935, CuNi 328).
