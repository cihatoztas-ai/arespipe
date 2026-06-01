# CLAUDE — 141. Oturum Girişi

## İLK İŞ: backfill runtime 500'ünü çöz (stack ÖNCE, tahmin YOK)
Dry-run komutu:
```
curl -s -i -X POST https://arespipe.vercel.app/api/eslestirme-backfill -H 'Content-Type: application/json' -d '{"tip":"malzeme","tenant_id":"00000000-0000-0000-0000-000000000001","kuru":true}'
```
Şu an: `HTTP 500 FUNCTION_INVOCATION_FAILED` (düz metin = modül-yükleme seviyesi, handler'a girmeden).

### Stack'i AL (kritik — bunsuz yazma)
- Vercel dashboard → Project → son deployment → Functions → `eslestirme-backfill` → **Runtime Logs**. EN GÜVENİLİR.
- VEYA: `vercel logs https://arespipe.vercel.app` AÇIK pencere + **AYRI sekmede** curl → stack canlı düşer. (Tek pencerede takip modu 5dk'da kesiliyor, curl ateşlenmiyor — 140'ta bu yüzden alınamadı.)

### Kanıtlananlar (tekrar deneme)
- `node -e "require('./ares-asme.js')"` → OK (lokal). ares-asme require'da çökmüyor.
- Zincir testi (yapışırken kırıldı, 141'de tek satır tekrar): `node -e "require('./ares-asme.js');require('./ares-olcu.js');const m=require('./lib/malzeme-kutuphane-eslesme.js');console.log('zincir',!!globalThis.ARES_OLCU,typeof m.eslesmeAnahtari)"` → 'zincir true function' bekleniyor.
- createRequire fix denendi (`6fd32f7`) → 500 sürüyor. Yani kök CJS/ESM import biçiminden DAHA derin.

### Olası kökler (log seçecek — tahminle yazma)
1. vercel.json `functions` runtime / `type:module` ile CJS dosya çatışması.
2. ares-asme/ares-olcu içinde **çağrı-anı** (require değil, ilk kullanım) `window` referansı — serverless'ta patlar.
3. supabase embed `spooller!inner(devre_id,tenant_id)` kolon/FK adı yanlış (ama bu handler-içi, 500 düz metin handler-öncesini gösteriyor → düşük olasılık).

### Çözüm yönü (kanıta bağlı)
- Kök import/runtime ise: server'da düzelt.
- ares-asme server'da ısrarla sorunsa: **backfill'i browser'a taşı** (admin re-match deseni, MK-127.4 kardeşi). ARES_BORU/OLCU orada zaten yüklü+çalışıyor, ares-normalize'a dokunmadan. Server `tip=malzeme` dalını geri çek. Çekirdek (`lib/malzeme-kutuphane-eslesme.js`) aynen çağrılır.

### Hedef (değişmez)
Backfill koş (`kuru:false`) → DN300 PN16 karbon slip-on (122) `flansh_olculer_id` alır →
```
SELECT count(*) FROM spool_malzemeleri sm JOIN spooller s ON s.id=sm.spool_id
WHERE s.tenant_id='00000000-0000-0000-0000-000000000001' AND sm.flansh_olculer_id IS NOT NULL;  -- 122+
```
spool_detay'da bir DN300 flanşı aç → standart sütunu YEŞİL → §13.7 kapanır.

## SONRA
- B: matcher'ı akışa taşı (parse/aktar sonrası), backfill kanıtlanınca. Çekirdek hazır, aynen kullanılır.
- C (arka plan, organik): kütüphane kapsam — paslanmaz EN-1092-1 (matcher mm-eşler ama veri yok), fitting EN10253/B16.9 (elbow/reducer/tee — anahtar üretiliyor, veri yok). Süper-admin önerilerinden zamana yayılarak.
- MK-139.1 görsel teyit: taslak incelemede çap terfi etmeden görünüyor mu.

## Hatırlatma
- mm-kanonik matcher elbow `323.9x6.3` ve `2½" Sch 10S`'i de mm'e indiriyor (NULL değil) — fitting verisi dolunca eşleşir.
- ares-normalize.js'e DOKUNMA (Cihat: çalışıyor, bozma; malzeme kolonu zaten normalize, gerekmiyor).
