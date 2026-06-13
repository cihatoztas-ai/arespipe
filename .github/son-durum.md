# son-durum.md — Oturum 183 sonu

## HEAD
`11689c2` (183 PAOR Faz1b: incelemeTablosu kabuk anahtari cizim_no kaynakli). Fonksiyon: **12/12** (yeni api yok). Çalışma ağacı TEMİZ. Not: CI-bot `[skip ci]` rapor commit'leri araya girer → `git pull --rebase`.

## Canlıya (bu tur — 3 kod commit, hepsi EKLEMELI, Tersan'a sıfır dokunuş)
- **Faz1** (`62893a9`): PAOR `cizim_no` köprüsü kuruldu. `_paorKabukSatirlar` (wizard) Excel dosya adından `(\d{5}-\d{6})` drawing-no çıkarıp kabuk satırına `cizim_no` ekler. `ares-kabuk.js grupla` `cizim_no` pas-through (Tersan→`''`). `devre-inceleme.js:85` kabukMap anahtarı `cizim_no || pipeline`.
- **Faz1b** (`11689c2`): ASIL köprü — `lib/izo-eslesme.js incelemeTablosu` kabuk anahtarı `_kabukAnahtarKaynak = sp.cizim_no || sp.pipeline` (helper, 2 çağrı: durum hesabı + montaj seti). İzometri tarafı (`a.pipeline`) DEĞİŞMEDİ — zaten drawing-no taşıyor.

## Köprü neden gerekliydi (canlı veri)
PAOR'da iki kimlik ayrı namespace: kabuk pipeline = `Z05-SCUPPER_SYSTEM_002` (Excel İÇERİĞİ, marka/ekranda görünür) vs PDF dosya-adı drawing-no = `52600-102770`. Köprü yok → eşleşmiyordu. Çözüm: kabuk satırına `cizim_no` (Excel DOSYA ADINDAN) ekle, eşleştirmeyi PAOR'da `cizim_no | pozisyon-spool`'dan kur. PDF tarafı zaten `dosyaAdiParse.pipeline_no = 52600-102770` veriyor → iki taraf aynı namespace. Ekranda pipeline `Z05-...` KALIR (marka korunur). (MK-183.1)

## CANLI TEST — GEÇTİ
L3 AÇIK + PAOR klasörü (3 xlsx + 3 fab `-A.pdf` + 3 iso `-Isometric_View.pdf`) drop → İnceleme: **İŞLENEN 3/3, OKUNDU 2, ZAYIF 1, EKSİK 0**. M_001→102769, M_002→102770, M_003→102771 üçü de kendi PDF'ine eşleşti.

## EN ÖNEMLİ DERS — tek kök neden L3
Oturum boyunca 5 "ayrı bug" sanıldı (PDF `parser:sakla`, kuyruk `durum:iptal`, `d===imalat` routing, anahtar katmanı, namespace). GERÇEKTE TEK KÖK NEDEN: **ilk testlerde L3 kapalıydı.** L3 kapalı → fab PDF "sakla" yoluna düşer (wizard 794), parse yok. L3 AÇIK doğru testte zincir tamamlandı. (MK-183.2)
- `iptal` damgası: `_taslakIptalEt` (wizard 2966-2987, W-2.13) terk edilen taslağın kuyruğunu `iptal`'e çeker — DOĞRU davranış, Tersan'da 2473 iptal kaydı bu. ASLA global kabul listesine ekleme.

## #2b — gerçek S02/S03 + BOM dağıtımı (ANA İŞ, Cihat bugün yakaladı)
1. **Çok-spool bölme:** 102769/102771 fab PDF'i 2 spool ([1],[2]) içeriyor, kabuk her çizimi tek S01 tutuyor → S02 ayrılmadı. Üç-durum 0/1/N (MK-182.6).
2. **BOM dağıtımı:** Her PAOR çiziminin KENDİ Excel'i var (ayrı), malzeme tüm spool'lara karışıyor → kayıt-bazlı atama (MK-182.5).

## Açık işler (carry, MK-163.1)
- **Terfi köprüsü:** Faz1 yalnız İNCELEME. `spooller.cizim_no` kolonu YOK → migration (MK-98.2) + `aktar`/`kabukYukle`/`eslestir` cizim_no anahtarı. #2b paketi.
- **L3 routing `d===imalat`** (wizard 793): referans eşitliği kırılgan, dosya-adı eşleşmesine geç.
- Mükerrer test devresi temizliği · 181-3 artığı · D-182.2 · PAOR agirlik_kg · NPS→mm (Tersan Faz2).

## Disiplin
`cizim_no` Tersan satırında boş → `|| pipeline` fallback → eski davranış BİREBİR. izo-eslesme.js eklemeli + fallback'li (lib SAF). `izometri-oku.js` + `paor.js` dokunulmadı.
