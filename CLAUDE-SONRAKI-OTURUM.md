# CLAUDE — Sonraki Oturum (184) Brifingi

## Açılış ritüeli
```bash
cd ~/Desktop/arespipe
git pull --rebase
git status
git log --oneline -3
ls api/*.js | wc -l        # 12 (MK-129.3)
```
Sonra: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md oku. CI yeşil mi.

## DURUM: PAOR Faz1 (inceleme köprüsü) CANLI ÇALIŞIYOR
183'te drawing-no köprüsü kuruldu + L3 açık testte EKSİK 0 ile kanıtlandı. Kalan: terfi + bölme.

## PAOR TEST KURALI (MK-183.2)
PAOR testinde **L3 mutlaka AÇIK**. L3 kapalı → fab PDF "sakla", parse yok, eşleşme yok (bug DEĞİL). Yeni test devresi (terk taslak kuyruğu `iptal`, W-2.13). Hard-refresh (Cmd+Shift+R).

## İLK İŞ: #2b — gerçek S02/S03 bölme + BOM dağıtımı
**A) Çok-spool bölme (MK-182.6, 0/1/N):** 102769/102771 fab PDF 2 spool ([1],[2]), kabuk tek S01 tutuyor. `_paorKabukSatirlar` (~803) çizim başına 1 entry üretiyor → L3 `sonuc_spool_sayisi` (izometri_batch_kayitlari) alıp N shell (S01..SN). Kabuk L3-sonrası genişletilmeli (taslak, terfi öncesi). `aktar` N entry kadar spooller yaratır.
**B) BOM kayıt-bazlı (MK-182.5):** Her PAOR çiziminin KENDİ Excel'i. `spoollar[n].malzeme_listesi` BOŞSA → pipeline-paylaşımlı; DOLUYSA → per-spool. Tersan'ı bozma (tek BOM hepsine).

## İKİNCİ İŞ: Terfi köprüsü
Faz1 yalnız İNCELEME. Terfide `cizim_no` köprüsü YOK → terfi sonrası eşleşme kopar.
- `spooller.cizim_no` kolonu YOK → migration (MK-98.2 dry-run).
- `aktar` (ares-kabuk.js): INSERT'e `cizim_no`. `kabukYukle` (577-625): SELECT + `harita` anahtarı `cizim_no||pipeline`. `eslestir` (~657): `pipelineHam` PAOR'da `cizim_no`.
- A/B ile aynı paket (aktar/spooller katmanı).

## L3 routing (küçük): wizard 793 `d===imalat` referans eşitliği kırılgan → dosya-adı eşleşmesine geçir.

## Carry borçlar (taze SQL, MK-163.1)
Mükerrer test devresi temizliği (102769/770/771 birçok devre_id) · 181-3 artığı · D-182.2 · PAOR agirlik_kg null · NPS→mm (Tersan Faz2) · W-2.5 · hata rozeti.

## Notlar (183 doğrulanmış)
- PAOR kabuk anahtarı = `cizim_no | pozisyon-spool`. İzometri = `drawing-no | pozisyon-spool`. Tersan = `pipeline_no | spool_no`.
- `_kabukAnahtarKaynak(sp) = sp.cizim_no || sp.pipeline` (izo-eslesme.js).
- Kuyruk durum (183): iptal 2473, oneri_hazir 1317, tamamlandi 660, manuel_onay 223. PAOR L3 başarılı → oneri_hazir.
- `fitting_olculer` işi varsa açılışta `SELECT COUNT(*)` (≈935, CuNi 328).
