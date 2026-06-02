# Son Durum — 144. Oturum (2 Haziran 2026)

> **BOM güvenilirliği (spool_detay) uçtan uca: kalem rötuşu + güvensiz/güvenilir/doğrula + türetilen "Düzeltildi".**
> Sistem-türevli "Doğrulanmadı" (C3) kod doğru ama spool↔izometri devre kopukluğu yüzünden inert.
> Yeni endpoint YOK (12/12). Tüm yazma client-side + RLS. Migration 099 canlı.

## HEAD (son push ~`de09c7e`)
Commit zinciri (144):
- `48512ba` feat: C1 — bom_durum rozeti + güvensiz toggle (spool_detay malzeme sekmesi)
- `2e6a80c` migration: 099 bom_durum + spool_malzemeleri.guncelleme [skip ci]
- `d571134` feat: C2 — tip-uyarlamalı kalem rötuşu + türetilen "duzeltildi"
- `de09c7e` feat: C3 — sistem-türevli renk (K2 malzeme_flag) + dogrulanmadi + doğrula butonu

## Yapılanlar (sıra)

### 1. Migration 099 — bom_durum + guncelleme (BEGIN...ROLLBACK dry-run → COMMIT)
- `spooller.bom_durum` text NOT NULL default 'guvenilir', CHECK (guvenilir/duzeltildi/guvensiz) + `bom_durum_not` + `bom_durum_zaman`.
- `spool_malzemeleri.guncelleme timestamptz` — **latent bug fix:** sertToggle/heatKaydet bu kolonu yazıyordu ama kolon yoktu → `_supaUpdate` sessizce fail (console.warn). Şema dump + SQL ile doğrulandı (boş döndü).

### 2. C1 — güvenilirlik bayrağı (spool_detay.html)
- Malzeme Listesi başlığında 3-renk rozet + "Güvensiz işaretle"/"Güvenilir yap" toggle. `bom_durum` client-side UPDATE + RLS, log + toast. Canlı: güvensiz→F5→kalıcı→güvenilir. ✅

### 3. C2 — tip-uyarlamalı kalem rötuşu (ANA İŞ)
- Her satıra ✏️ (uç işlemi hariç) → `malzDuzenleModal`: tip seçici (boru/fitting/flanş/diğer) + kod/açıklama/malzeme(select)/kalite(datalist `kaliteListe`)/çap/et/boy/adet/ağırlık.
- Tip görünürlüğü: boy yalnız boru, et flanşta gizli (canlı taksonomiyle: fitting boy_dolu=0, flanş et_dolu=0).
- `malzDuzenleKaydet`: virgül→nokta NaN-fix, MK-111.1 (et>çap engeli), doğrudan `spool_malzemeleri` UPDATE (+guncelleme). **Tip/boyut değişince kütüphane FK (boru/fitting/flansh_olculer_id) NULL'lanır** = basit tanım, kütüphane zorlamaz. in-memory render (tam reload yok).
- SELECT'e `kod/aciklama/adet/guncelleme` eklendi → kod artık gerçek (S82464), fallback değil; adet gerçek.
- `renderBomDurum`: **"duzeltildi" türetiliyor** — herhangi bir kalem `guncelleme` doluysa sarı "✎ Düzeltildi". bom_durum sadece operatör güvenini tutar (guvenilir/guvensiz).
- **Canlı doğrulandı:** NB1137-AT110-816-026-S01 — malzeme Paslanmaz, çap 114,3/boy 2500 değişti, kod gerçek, render+log+kalıcılık tuttu. (Kalite datalist tıkla değil yazınca öneri veriyor — Cihat ilk başta boş sandı, sonra çalıştı.)

### 4. C3 — sistem-türevli renk (KOD DOĞRU, DEVRE-BAĞI BORCUNA TAKILDI)
- `bomK2SinyalYukle()`: yüklemede arka planda `dosya_isleme_kuyrugu.parse_sonuc._eslesme.detay[]`'ten bu spool'un `malzeme_flag`'i (devre-inceleme ile aynı kaynak, yeni endpoint yok) → `SP.k2Flag`.
- `renderBomDurum`: yeni türev **'dogrulanmadi'** (k2Flag var + operatör karar yok → sarı "⚠ Doğrulanmadı" + tooltip). Öncelik: guvensiz > duzeltildi > dogrulanmadi > guvenilir.
- "✓ Doğrula" butonu (yalnız dogrulanmadı'da) → `bom_durum='guvenilir' + bom_durum_zaman=now` (karar damgası, yeni kolon yok).
- **TAKILDI — kök kanıtlandı:** `bomK2SinyalYukle` `SP.devre_id` ile filtreliyor. Test spool'u (`5d149e43`, AT110-816-027/S01) `SP.devre_id=fb80d315` (devre "AT110-Drencher-Galv"), ama izometri+K2 flag `7ed93033` (devre "g230") devresinde. Konsol testi: `SP.devre_id=7ed93033` ile sorgu ERROR null / 12 kayıt / 8 flag döndürdü (kod+RLS sağlam); ama `SP.devre_id` yanlış devre. pipeline+spool tenant'ta **13 farklı devrede tekrar** ediyor → devre-bağımsız eşleşme GÜVENSİZ. Sonuç: C3 fail-safe yeşile düşüyor (zarar/hata/regresyon yok, sadece sarı tetiklenmiyor).

## CANLI DOĞRULAMA
- C1 ✅ · C2 ✅ · C3 kod ✅ (konsol/SQL) ama UI sarı görünmüyor (devre-bağı borcu).

## NEREDEYIZ
spool_detay BOM güvenilirliği (terfi sonrası) çalışıyor. C3 sinyali devre-bağı borcuna bağlı (D borcu, 129/130). Terfi öncesi (B) + downstream damga (C4) yapılmadı.

## 145 — ÖNCELİK
1. **C3 devre-bağı (D borcu):** spool↔izometri devre kopukluğunu çöz → C3 sarısı canlanır. Kanıt yukarıda. Tahmin yok: spool'un izometrisinin gerçek devresini hangi ilişki veriyor, oku.
2. **B — terfi öncesi BOM kalem rötuşu + güvensiz (wizard):** kalemler zaten görünür (`WIZ._kabukSatirlar`, salt-okunur). Kalem-seviyesi taslak katmanı + terfide aktar'a taşıma. `malzeme_flag` İnceleme'de hazır.
3. **C4 — downstream damga:** kesim/büküm/markalama'da güvensiz görünür uyarı (engel değil).

## Mühürlenecek MK (KARARLAR.md)
- **MK-144.1:** BOM güvenilirlik = `spooller.bom_durum`. Saklanan: guvenilir/guvensiz (operatör güveni). Türetilen: 'duzeltildi' (kalem guncelleme dolu), 'dogrulanmadi' (K2 malzeme_flag + karar yok). `bom_durum_zaman` = operatör açık karar damgası (güvensiz/doğrula). Client-side + RLS, yeni endpoint yok.
- **MK-144.2:** Kalem rötuşu spool_detay'da doğrudan `spool_malzemeleri` UPDATE (terfi-sonrası gerçek veri, taslak DEĞİL). Tip-uyarlamalı. Tip/boyut değişince kütüphane FK NULL'lanır (basit tanım).
- **MK-144.3:** `spool_malzemeleri.guncelleme` latent-bug (kolonsuz UPDATE sessiz fail) migration 099 ile kapatıldı.
- **MK-144.4:** C3 sistem-türevli renk, spool↔izometri **devre kopukluğuna** bağlı — `SP.devre_id` ile K2 eşleşmesi yanlış devreyi vuruyor; pipeline+spool tenant'ta tekil değil (13×) → devre-bağımsız eşleşme yasak. C3 fail-safe yeşil (zararsız). D borcu çözülünce aktif.

## Hatalarım (kayıt)
- C3'ü kurarken `bomK2SinyalYukle`'yi `SP.devre_id`'ye kilitledim — spool↔izometri devre kopukluğunu (bilinen D borcu) hesaba katmadım, test aşamasında çıktı. Ders: yeni sinyal-çekme yazmadan önce "bu spool'un kaynak verisi gerçekten hangi devrede" diye doğrula.
- Test yönlendirmesinde "nereye bakacağımı" baştan söylemedim; Cihat haklı olarak sordu → flag'li spool'u SQL'le bulduk.
