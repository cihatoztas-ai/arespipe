# son-durum.md — Oturum 174 kapanışı

## Aktif iş
**devre_wizard_v3.html** — Adım 2 İnceleme & Onay. İki ana iş tamamlandı:
1. **IS2 terfi modal** (önceki turda push'landı): roketsiz; başlık durum taşıyor (yanıp sönen nokta → yeşil tik; "aktarılıyor"→"aktarıldı"); popup içi AI tarama kutusu (klasör `ai-scan`, sınırlı); minimal ilerleme çizgisi + gerçek fazlar (Spool ID/QR→İş emri→Özet→İzometri); butonlar altta (aktarırken pasif, bitince "Devre detayına git"). `ares-kabuk.js` `aktar` DOKUNULMADI (tek atomik insert korundu; gerçek per-spool sayaç REDDEDİLDİ).
2. **Excel↔PDF kalite merge — Faz 1 (kalite)** TAMAM (önizleme + terfi + etiket).

## Faz 1 (kalite) — ne yapıldı
- **Faz 1a** (`/api/devre-inceleme.js`, PUSH'LANDI): kabuk kalitesi boşsa izometri parse `malzeme_listesi` baskın kalitesini doldurur (`s.kalite` + `s.kalite_kaynak='izometri'`). cap/et/yüzey 166/A deseninin aynısı; `lib` SAF. **Kanıt ekranda:** Kalite "—" → "St 37".
- **Faz 1b** (`ares-kabuk.js` + `devre_wizard_v3.html`, BU PUSH'TA): `aktar`'a opsiyonel `birlesikler` overlay; kalite önceliği **operatör _dz > birleşik _bl > grupla taban**. Wizard `_birlesikHarita`'yı `_inceleme.spoollar.kalite`'den toplar → terfi birebir önizlemedeki kaliteyi yazar. Toplamsal/geri-uyumlu (devre_detay `birlesikler` göndermez → eski davranış).
- **Etiket** (`devre_wizard_v3.html`, BU PUSH'TA): `dsatir('kalite', s.kalite_kaynak==='izometri' ? izoSrc : 'xl')` → izometriden gelen kalite "L2" rozeti.

## Kanıtlanan kök (DATA→UI→code)
- Excel BOM satırında **kalite/grade kolonu YOK** (keys: dn,adet,birim,tanim,system,malzeme,standart,_satir_no,agirlik_kg,parca_tipi). Kalite `malzeme` metnine gömülü (ST37 / ASTM A536 G65-45-12 / Victaulic Groove-Steel).
- PDF/izometri parse `malzeme_listesi` kalite (ST37) taşır. `grupla` PDF'e bakmadığı için `anaKalite` boş üretiyordu → spool kalite '—'.
- Konsol: `grupla.kalite: undefined | inceleme.kalite: undefined` (server düşürmüyor; grupla üretmiyor).

## Dosya md5 (bu push)
- `ares-kabuk.js` = 6d6bd775959e15d6ba30dab071f9b780
- `devre_wizard_v3.html` = bd397c2382e2a825a14e03160ce59562 (Faz 1b + etiket birlikte)
- `api/devre-inceleme.js` = fc3053d23fed683c62c85d7ded78d34d (Faz 1a — ZATEN PUSH'LANDI)

## Mimari karar (Cihat, bu oturum)
- Çatışınca (Excel≠PDF dolu): **referans Excel → Excel öne; manuel Excel → PDF öne; çelişki gösterilir.** Sinyal = `excel-parser` `seviye`(L1/L2)+`guven` (L1 & guven≥70 → referans).
- Boş alan: **PDF doldurur** (koşulsuz).
- Merge yeri: **/api/devre-inceleme** (tek nokta; Excel kabuk + PDF parse ikisi de orada).
