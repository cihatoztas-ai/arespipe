# Claude — 42. Oturum (28 Nisan 2026)

> **Tema:** AI Standart Cikarimi altyapisi — 41 pilotunun gercek dunya testinde ortaya cikan eksik halka

---

## Oturumun Hikayesi

### Baslangic
41 sonunda Cihat gercek bir izometri yukledi (G200-303-BS15). PDF'te kutuphane lookup yapilamadi cunku PDF'ler **standart adi tasimiyor** — sadece kalite kodu (ST37, A106 vb.) var. Sistem standart cikarsama yapmadan kutuphane lookup imkansiz.

42 acilisinda iki secenek vardi:
1. AI ile spec PDF tarama (ayri cagri, ek maliyet)
2. Sistem kurallari ile cikarsama (deterministik, ucretsiz)

### Cihat'in Kritik Mudahalesi
"İzometri PDF parsel den veri alabiliriz, ifs ten de veri alabiliriz... biz pdf formatini sisteme yanitincaya kadar token harciyoruz... orda yoksa burdan bak icin ai sorgu gerekir mi gercekten."

Bu cumle mimari karari verdi: **Ayri AI cagrisi yapilmaz.** Izometri parser zaten Claude'a gidiyor, prompt'a 2 alan eklendi. Boylece:
- Maliyet: ~$0.0002/parse ek (50 output token)
- Yeni tablo yok (mevcut ai_api_log kullanildi)
- Halusinasyon riski sifir (AI cikarsama yapmaz, sadece yaziliyi okur)

Ben bunu kacirmistim — 2 ayri AI cagrisi planliyordum. Cihat'in sorusu mimaride gercek bir hatayi yakaladi.

---

## Yapilanlar (Sira ile)

### Faz A — Mimari Tashihat (~30 dk)
- ai_cagri_log tablosunu actim → mevcut ai_api_log varmis, gereksiz duplika oldu, DROP edildi
- izometri-oku.js'in zaten ai_api_log'a yazip maliyet hesapladigini gordum (38'den beri)
- Yeni mimari: tek AI cagrisi, prompt genisletme

### Faz B — Altyapi SQL'leri (~1 saat)
- **011:** malzeme_standart_ipucu tablosu (RLS aktif, sistem preset + tenant)
- **013:** boru_olculer'a 48 DIN-2448 + EN-10216-1 kayit (DN15-DN200, ET schedule sistemi yeni eklendi)
- **012:** 18 pilot kalite ipucu kaydi (boru:12, flansh:3, fitting:3)

### Faz C — Normalize Modulu (~30 dk)
- ares-kalite-normalize.js (3 fonksiyon: normalize, eslesir, enIyiEslesme)
- "A106 Gr.B" / "A 106 Grade B" / "ASTM A106 Gr.B" → hepsi "A106GRB"
- Test sayfasi 39/39 yesil

### Faz D — Prompt Guncelleme (~30 dk)
- izometri-oku.js'in YAKLASIM_Y_PROMPT'una 2 madde eklendi
- JSON sema malzeme_listesi'ne 2 alan eklendi
- AI sadece yazili olani cekiyor, cikarsama yazilim tarafinda

### Faz E — Deploy + CI Cikismasi (~30 dk)
- GitHub web upload yontemi kullanildi
- Cihat yanlislikla ares-normalize.js'i sildi (isim benzerligi: ares-normalize vs ares-kalite-normalize) → git restore ile geri alindi (kritik kaza, 6 sayfa kirilirdi)
- test-kalite-normalize.html yanlislikla repo'ya yuklendi → CI kirmizi → silindi
- Sonunda CI yesil, Vercel iki deploy da basariili

---

## Cihat'in Onemli Cumleleri

- "Pdf parse edebiliyoruz, formatini sisteme yanitincaya kadar token harciyoruz... orda yoksa burdan bak icin ai sorgu gerekir mi gercekten" (mimari karari)
- "Halusinasyon riskini sifirlama ve prompt guncelleme onemli" (AI cikarsama yapmasin onayi)
- "Bunu kontrol altinda tutabilmek gerekir... cok kullanim olursa bu ozelligi super adminden kapatabilsek iyi olur" (feature flag karari)
- "Hicbiryerden bulunmazsa malzeme modali bos kalacak" (graceful degrade)
- "Bırakmayacan yoksa pesimi" (40 canli test borcu sozu, 43 basi)

---

## Anahtar Ogrenmeler

1. **Tahmin yasagi etkili oldu.** 36'da kolon adi tahmin etmistim, fail. 41'de tekrar, fail. 42'de feature_flags.varsayilan_aktif tahmin etmistim, fail (gercek: varsayilan). information_schema.columns ile dogrulama refleksimi gelistiriyorum.

2. **Mevcut altyapiyi kontrol et, duplicate olusturma.** ai_cagri_log gereksiz tablomuz oldu cunku ai_api_log zaten 38'den beri vardi ve maliyet hesabi cozulmustu. izometri-oku.js'i okumadan tablo acmak hata.

3. **AI cikarsama yapmasin prensibi.** Cihat 36'da halusinasyon yedi, hala dersi taze. AI sadece yaziliyi okur, hesap/cikarsama kod tarafinda. 42'de bu prensip standart cikarimi icin tekrar uygulandi.

4. **Isim benzerligi tehlikesi.** ares-normalize.js (mevcut, kritik) ile ares-kalite-normalize.js (yeni) karistirilabilir. 42'de bu yuzden bir kaza oldu (yanlislikla silindi). 43+'da yeni dosya isimlendirmede "normalize" kelimesini ayri tutmak gerek.

5. **GitHub web upload + lokal git senkronizasyonu.** Web'den upload yapilinca lokal "behind" kalir. git pull ile senkronlama gerek. Bu basit ama Cihat icin yeni bir akis — ileride her oturumda gorulebilir.

6. **CI test dosyasini repo'ya almaz.** test-kalite-normalize.html ARES_LAYOUT_EKSIK kuralina takildi. Test dosyalari ya repo disinda kalmali ya da .ciignore benzeri bir dosyada listelenmeli.

7. **Mimari onerileri Cihat'tan gelir.** Cihat yazilimci degil ama yapisal sorunlari sezgisel goruyor. "Token harciyor zaten" sezgisi mimaride dogru karari verdi.

---

## Bu Oturumda Uretilen Dosyalar

| Dosya | Yer | Boyut |
|---|---|---|
| `migrations/011_malzeme_standart_ipucu.sql` | repo (yeni) | ~150 satir |
| `migrations/013_din_en_boru_kayitlari.sql` | repo (yeni) | ~80 satir |
| `ares-kalite-normalize.js` | repo (yeni) | 125 satir |
| `api/izometri-oku.js` | repo | 963 → 985 satir |
| `son-durum.md` | repo | bu oturum guncellemesi |
| `CLAUDE-SON-OTURUM.md` | repo | bu dosya |
| `CLAUDE-SONRAKI-OTURUM.md` | repo | 43 gundemi |

(Not: 012 SQL idempotent yazildi ama Supabase Editor unicode bug yuzunden chat icinden VALUES bloku ile elle yapildi — repo'da 012 dosyasi yok, sadece DB'de.)

---

## 42 Sonu Durum

✅ AI standart cikarimi altyapisi kurulu
✅ izometri-oku.js prompt guncellendi
✅ Vercel iki deploy yesil
✅ CI yesil
✅ 424 yeni kayit DB'de (48 boru + 18 ipucu + diger)
✅ ares-kalite-normalize.js test 39/39

🔴 40 canli test borcu acik (43 basi en yuksek oncelik — Cihat soz aldi)
🟡 Kutuphane icerigi %95 bos
🟡 Frontend cascade UI yok

---

> 42 kapanisinda yazildi. Detayli arsiv. 43 basinda okunmaz, sadece geriye donup aranir.
