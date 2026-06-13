# CLAUDE — Sonraki Oturum (183) Brifingi

## Açılış ritüeli (her zaman)
```bash
cd ~/Desktop/arespipe
git pull --rebase
git status
git log --oneline -3
ls api/*.js | wc -l        # 12 olmalı (MK-129.3)
```
Sonra: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md oku. CI yeşil mi doğrula.

## İLK İŞ: PAOR L3 toplu canlı test
182'de matcher + #2a + pozisyon-fix uygulandı ama test dosyası yoktu → uçtan-uca CANLI test EDİLMEDİ. PAOR klasörü (xlsx + fab `-A.pdf` + iso `Isometric_View.pdf`) drop → **L3'ü Aç** → bekle:
- fab PDF L3 ile okunur (drenaj, ~37sn).
- Spool kimliği POZİSYONDAN: L3 spool[0] → kabuk `S01`'e eşleşir → **PDF spool_detay'da (R1) + incele'de (R2) + marka.**
- Çok-spool çizimde `[2]/[3]`→`S02/S03` **fazla** (henüz gerçek spool DEĞİL — #2b).
Teşhis (tutmazsa, MK-158.1): SQL `dosya_isleme_kuyrugu.parse_sonuc.spoollar` + `devre_dokumanlari.spool_id`; drenaj/`eslestir` log.

## #2b — gerçek S02/S03 (ana iş, KAPSAM DAR)
**Kapsam (canlı veri, MK-182.6):** 2862 kayıt 1-spool (#2a zaten yeter), ~34 çok-spool (gerçek hedef), 754 sıfır-spool (ayrı). Üç durumu ayrı ele al: **0** → S01 boş kabuk, genişletme YOK; **1** → mevcut #2a; **N** → genişlet.

**Mekanizma:**
- `aktar` (ares-kabuk.js) zaten grupla'daki N entry kadar `spooller` yaratıyor. PAOR adaptörü (`_paorKabukSatirlar`, wizard ~802) şu an **1 entry (S01)** üretiyor.
- **Adım 1 — sayı:** Adaptör L3 `sonuc_spool_sayisi`'ni alıp **N shell** (S01..SN) üretmeli. Zamanlama: kabuk Excel'den senkron, L3 sonra (drenaj) → kabuk L3-sonrası genişletilmeli (taslak, terfi öncesi). Hazır sayı kolonu: `izometri_batch_kayitlari.sonuc_spool_sayisi`.
- **Adım 2 — malzeme KAYIT-BAZLI (MK-182.5):** `spoollar[n].malzeme_listesi` BOŞSA → pipeline-paylaşımlı (`pipeline_malzemeleri`); DOLUYSA → per-spool (`spool_malzemeleri`). Tek kural dayatma — canlı veri her ikisini de içeriyor (s1=0 ve s1=11 kayıtlar var). D1 mükerrer-toplama önleme geçerli.
- **Adım 3 — resim:** İmalat+montaj PDF'i her N spool'a (`devre_dokumanlari.spool_id`) — D2.
- **cap/et zenginleştirme:** `devre-inceleme.js` ~287-298 `dal` lookup (find-by-spool_no) pozisyon-duyarlı DEĞİL → N shell oluşunca index-eşle (kabuk S0(i+1) ← L3 spool[i]). Pozisyon-fix'le tutarlı.
- **DİKKAT:** Tersan'ı bozma — Tersan Excel tüm spool'ları + per-spool BOM taşır. Ayrışma YALNIZ PAOR yolunda (`sp_kaynak:'pozisyon'` + kayıt-bazlı malzeme).

## Pozisyon-bazlı matcher (182'de kuruldu — bunun üstüne #2b)
`DOSYA_DESENLERI` (`kuyruk-isle-izometri.js`): PAOR `sp_kaynak:'pozisyon'`. `eslestir` + devre-inceleme döngüsü index'li (`'S'+(idx+1)`), L3 spool_no yok sayılır (çakışma/varyant nedeniyle). `else` dalı = Tersan değişmedi. Yeni format = `DOSYA_DESENLERI` satırı (DB değil).

## Diğer açık borçlar (carry, MK-163.1 — taze SQL ile doğrula)
- **181-3 artığı:** test taslakları (`dhgcmhgcvmh`, `yjj7ıuı`, `721df4ed`) + 247 satır sidecar `pipeline_malzemeleri`. Önce `SELECT COUNT`, sonra tek-statement sil (MK-153.2).
- **D-182.2:** imalat/montaj malzeme ayrımı (civata/conta=montaj, imalat aşamasında gereksiz). #2b malzeme yazımında düşün.
- **PAOR agirlik_kg:** null — K2 kütüphane türetimi.
- **NPS→mm bug** (`ares-olcu.js` olcuParse dis_cap): ham NPS. PAOR'u ETKİLEMİYOR ama Tersan Faz 2 blocker.
- **W-2.5** çift progress bar · **spool-bazlı hata rozeti.**

## Notlar (canlı-veri-doğrulanmış şekil)
- `izometri_batch_kayitlari`: `sonuc_json.spoollar[]` (spool object), `sonuc_spool_sayisi` (hazır int), `dosyalar` (array), `durum`.
- spool object anahtarları: `spool_no` (GÜVENİLMEZ — kullanma), `cap_mm`, `et_mm`, `dn`, `yuzey`, `kalite`, `malzeme_listesi[]`, `pipeline_no` (bazen null), `agirlik_kg`, `rev`.
- `fitting_olculer` kütüphane işi varsa: açılışta `SELECT COUNT(*)` (≈897, CuNi 328).
