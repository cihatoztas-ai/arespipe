# CLAUDE — Son Oturum Özeti (181)

## Yapılan iş
PAOR/AVEVA Excel-BOM formatını Devre Yükle wizard'ına **format adaptörü** olarak bağladım. Tersan IFS ile aynı kabuk→terfi hattı; PAOR sadece farklı kaynaktan aynı `parse_sonuc.satirlar` şeklini besliyor.

### Mimari yolculuk (düzeltmelerle — sonraki Claude için ders)
1. **Yanlış yer 1:** Önce `devre_detay.html`'e drop zone düşünüldü → yanlış. Doğru yer `devre_wizard_v3.html` Adım 1 drop (zaten klasör-walk + folder grouping var).
2. **Yanlış yaklaşım (181-3):** Sidecar — PAOR→`pipeline_malzemeleri`, kabuk-bypass. Devre taslakta kaldı, spool oluşmadı. Cihat: "PAOR farklı format, AYNI sistem." → terk edildi.
3. **Doğru mimari (181-4→181-5):** PAOR = kabuk hattına besleyen adaptör. 181-4 kabuğu **bellekte** kurdu → re-open'da (`taslagiAc`) boş döndü çünkü o, `dokuman_tipi='bom_excel'` + `parser='excel-generic'` + `parse_sonuc.satirlar`'dan kuruyor. 181-5 bunu **kalıcı** yaptı: PAOR xlsx → `paor_bom` → `dokuman_tipi='bom_excel'` + istemci-üretimli `parse_sonuc` kuyruğa yazılır. Yükleme/re-open/terfi aynı yerden.

### Adaptör (kanıtlanmış, `_paorKabukSatirlar`)
- `partNameParse` → tanim/malzeme/kalite/dn; `kimlikCoz(isoMetin)` → pipeline_no.
- `dn`→`"DN"+sayı` METNİ (ham sayı olcuParse'ta yanlış çap verir — DN125→141.3 doğru, 125→125 yanlış).
- et=null spool başlığında (DN dalı sch'siz) = Tersan davranışıyla aynı; gerçek et kalem listesinde.
- node'da gerçek `ares-olcu`/`ares-asme`/`grupla` ile 7 dosyada doğrulandı: 7 spool, doğru çap/malzeme.

### Commit zinciri
- `6ee7c6b` 181 paor wizard entegrasyon (icerik-tanimali drop) — ilk
- `0c2c4ea` 181 paor wizard kabuk hatti adaptor 1cizim1spool — 181-4
- `9ee8460` 181 paor kabuk kalici parse_sonuc yazimi — 181-5 (HEAD, doğru sürüm)

## KRİTİK — sonraki oturumun ana konusu (L3 keşfi)
Oturum sonunda Cihat "L3 PAOR'u tanıyordu, sildik mi?" diye sordu. **Kontrol ettim — silinmemiş, AKTİF.** `paor_aveva_ana` formatı L3/Vision ile fab çizimini okuyor: **3 spool ayırıyor, 11 kalem malzeme çıkarıyor** (parse_sonuc `52600-102773`, durum=iptal, 4 Haz). Yani:
- **Spool-bölme L3'te zaten var** (Cihat'ın "OCR kurunca ayırırız" beklentisi → aslında L3 yapıyor, OCR gereksiz).
- **Benim 180/181 "L3 değil" mimarim eksikti** — maliyet kararıydı, teknik tavan değil. Cihat'a bunu yanlış aktardım, düzelttim.
- **Eşleştirme kopuk:** L3 pipeline'ı parse_sonuc'a yazıyor ama `devre-inceleme.js:134` dosya adından istiyor (PAOR dosya adında pipeline yok) → 3/3 atanmamış.

Bu yüzden 181'i apar topar L3'e bağlamadım — eşleştirici-pipeline-fallback (Tersan'la ortak kod, dikkatli) + L3 maliyet-tetik kararı tasarım işi, 182'ye.

## Disiplin
Tüm patch'ler anchor-doğrulamalı Python (abort-on-mismatch, .bak, idempotent), `node --check`, MD5. paor.js'e dokunulmadı. Sistem kodu (grupla/aktar/taslagiAc) değişmedi — yalnız wizard'a adaptör eklendi.
