# CLAUDE — Sonraki Oturum (182) Brifingi

## Açılış ritüeli (her zaman)
```bash
cd ~/Desktop/arespipe
git pull --rebase
git status
git log --oneline -3
ls api/*.js | wc -l        # 12 olmalı (MK-129.3)
```
Sonra: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md oku.

## 182'nin ANA KONUSU: PAOR L3 spool-bölme hibridi
**Kanıt elde (181):** `paor_aveva_ana` L3 formatı aktif, fab çiziminden **3 spool ayırıyor + 11 kalem malzeme okuyor** (Vision, OCR'sız). Çıktı şekli: `parse_sonuc.spoollar[]` (her biri spool_no `[1]/[2]/[3]`, dn, cap_mm, et_mm, yuzey, kalite, malzeme_listesi[], pipeline_no, guven_skoru). Örnek SQL ile çekildi (`52600-102773`, durum=iptal).

**İki engel (çözülecek):**
1. **Eşleştirme-pipeline kopuk.** `api/devre-inceleme.js:134` + kanonik eşleştirici (`kuyruk-isle-izometri.js`) pipeline'ı **dosya adından** çıkarıyor (`dosyaAdiParse`), parse_sonuc'a fallback YOK (bilinçli — MK-127.3, terfi sürprizi olmasın). PAOR dosya adı (`11D-PAOR-52600-102773-A.pdf`) pipeline taşımıyor; pipeline parse_sonuc'ta (`52600-102773`). → L3 spool'ları "atanmamış/fazla" düşüyor. **Çözüm tasarımı:** PAOR formatı için parse_sonuc.pipeline_no fallback'i (format-spesifik, Tersan'ı bozmadan). DİKKAT: bu ortak Tersan yolu — değiştirmeden önce `dosyaAdiParse` + `eslestir` oku, Tersan regresyonu testi yap.
2. **Maliyet/tetik kararı.** L3 ~37 sn/çizim + para. Excel hattı $0 (181'de kuruldu). Hibrit politikası: Excel malzeme+identity $0 her zaman; L3 spool-bölme yalnız (a) kullanıcı seçince mi, (b) hep mi, (c) Excel yetersizse mi? Cihat'a A/B/C sun.

**Neden iptal?** parse_sonuc durum=`iptal`. İptal nedeni belirsiz (maliyet kararı mı, eşleştirme kopukluğu mu). 182 açılışında SQL ile son PAOR L3 işlerinin durum geçmişini çek, nedeni netleştir.

### Önerilen 182 yolu
1. SQL: PAOR L3 iptal nedeni + parse_sonuc.spoollar şeklini tam doğrula.
2. `dosyaAdiParse` + `eslestir` oku → PAOR pipeline-fallback tasarla (Tersan-güvenli).
3. Cihat'a hibrit maliyet politikası A/B/C.
4. Karar sonrası: PAOR L3 hattını wizard'a bağla (Excel kabuk + L3 spool-bölme birleştir). bindir.js survivorship (Excel malzeme ↔ L3 spool yapısı).

## Diğer açık borçlar (carry)
- **Test taslağı temizliği:** `dhgcmhgcvmh`, `yjj7ıuı`, `721df4ed` (247 satır sidecar `pipeline_malzemeleri` — 181-3 artığı). SQL ile sil (önce SELECT COUNT doğrula).
- **PAOR agirlik_kg:** Faz 1.5 — K2 kütüphane türetimi (şu an null).
- **NPS→mm bug** (`ares-olcu.js` olcuParse dis_cap branch): ham NPS dönüyor, Faz 2 blocker. (PAOR'u etkilemiyor — PAOR "DN"+sayı metni veriyor.)
- **Açık borç 117:** `yukleyen_id` null → `kuyruk-isle-izometri.js:305` abort. Wizard'da `_dosyaYukle` artık `yukleyen_id: userId` yazıyor — DOĞRULA (gerçekten doluyor mu).
- **W-2.5** çift progress bar (görsel karar) · **spool-bazlı hata rozeti.**
- **KARARLAR.md:** MK-169/170/171 hâlâ eksikse doldur (MK-163.1 — taze SQL ile doğrula, fantom borç olmasın).

## Notlar
- Format aile kayıtlı PAOR: kurallar `lib/format-paketleri.js` kodunda (MK-155.1), DB parser_kural={} (boş — runtime'da yok sayılır).
- `fitting_olculer` kütüphane işi varsa: oturum açılışında `SELECT COUNT(*)` (≈897, CuNi 328).
