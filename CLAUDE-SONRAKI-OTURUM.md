# CLAUDE -- Sonraki Oturum (118) Gundemi

## Acilis ritueli (2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -8`
   (HEAD: 117 kapanis doc + 450b74c D2-genis + 44814fc ana + migration 093 arsiv olmali).
2. Bugun ne yapmak istiyorsun?
Sonra Claude: git temiz mi, CI rengi, docs/PROJE-HARITASI.md + bu 3 dosya oku, gundem onayla.
**Mid-cycle scope ekleme yok.**

## Oturum basi TEYIT (117 borclari)
```bash
git log --oneline -8                 # 450b74c + 44814fc + 117 kapanis doc + 093 arsiv
ls migrations/ | grep 093            # 093 repoda mi (kapanista eklendi mi)?
ls uygula_116_*.py 2>/dev/null       # hala duruyorsa sil (rm uygula_116_*.py)
```
```sql
-- Supabase SQL Editor -> duz ASCII
-- imalat_not CANLI dolu mu? (117 yarim kalan dogrulama)
select spool_no, pipeline_no, alistirma, imalat_not
from spooller where imalat_not is not null limit 10;
-- parser_kural hala dogru mu (flag im + alistirma kurali yok)
select parser_kural->'alanlar'->'not_metni'->>'flag' as flag,
       (parser_kural ? 'alistirma_ipucu_kurali') as alistirma_kurali_var
from izometri_format_tanimlari where id='e1fb879d-3f13-40ae-8684-59237e63d40f';
```

---

## ONCELIK 1 -- imalat_not CANLI DOGRULAMA (117 yarim kalan)

117 kod canli AMA imalat_not eslesen devrede henuz dogrulanmadi (test devreleri yukleyen_id
null'a takildi). Eslesen, yukleyen_id DOLU bir devrede dogrula:
- NOT'u dolu KISMI/talimat PDF (orn G310 "kaynatilmayacak", M110-2113 "BSP adaptor") -> imalat_not DOLU.
- VAR (komple alistirma, orn E120/FM03-ALS) -> imalat_not BOS (D2-genis: VAR'da yazma).
- Spool detayda amber 📄 "Cizimden" blok (kullanici notu ustunde) + QR onizlemede personele gorunum.
- En temiz: yeni temiz devre olustur (wizard, yukleyen_id dolu gelir), NOT'lu PDF yukle, DB + ekran kontrol.

## ONCELIK 2 -- yukleyen_id NULL -> PARSE EDILEMIYOR (yeni kritik borc)

api/kuyruk-isle-izometri.js:305 -> dok.yukleyen_id null ise is 'yukleyen_id bos' hatasiyla kapanir
(izometri-oku kullanici_id zorunlu kilar, satir 334). yukleyen_id'siz yuklenen dosyalar (test/import)
HIC parse edilmiyor -> eslesmiyor -> hicbir veri yazilmiyor. test devresi 3174e29f boyle takildi
(M110-2104/2113 hepsi durum='hata', 'kullanici_id zorunlu', parse_sonuc null).
- Cozum A: yukleyen_id null dosyalara bir kullanici/sistem id ata (UPDATE devre_dokumanlari).
- Cozum B: kontrolu gevset -- sistem yuklemelerinde varsayilan kullanici id kullan.
- DIKKAT: veri sahipligi (KARAR-48.1). izometri-oku'nun kullanici_id'yi NE icin istedigine bak
  (loglama/audit mi, RLS mi). Once izometri-oku.js kullanici_id kullanimini grep'le (MK-49.1:
  izometri-oku fingerprint skorlama tarafina DOKUNMA -- ama kullanici_id ayri).

## STRATEJIK TEMA -- DESEN-DISI YONETIMI / FORMAT OGRENME (Cihat tespiti)

Cihat: "~10 PDF'le desen kurduk ama desen-disi kalanlar sorun. Profesyonel uygulamalarda nasil
cozulmus?" 117'de 3 kez yasandi: agirliksiz NOT (flag), bos NOT ("," yakalama), underscore dosya adi.
**Cekirdek ilke: desen-disini SESSIZCE YUTMA, YUZEYE CIKAR.**
Sektor yaklasimi (senin mimarine uyarli):
1. **Eksik/supheli alan raporu (ILK ADIM -- en ucuz, en yuksek getiri):** parse sonucuna "cikmayan
   alanlar" listesi ekle (NOT yok, yuzey yok, match_orani dusuk). Su an sessizce null -> "eksik" diye isaretle.
2. **Batch ekraninda gorunurluk:** "tam parse N / eksik M dosya -> bak" listesi. Cihat DB'de elle
   kazmasin, sistem soylesin.
3. **Confidence + human-in-the-loop:** yuksek guven->otomatik, orta->oneri_hazir/manuel_onay (durumlar
   ZATEN var, migration 084), dusuk->manuel. Desen-disi = onaya dussun, otomatik yazma.
4. **Format ogrenme dongusu (eski borc):** fingerprint ile desen-disilari grupla, birikince yeni format
   kurali turet. fingerprint kolonu zaten var.
Ilke: ONCE OLC (hangi desenler ne siklikla kiriliyor), SONRA en cok kirani duzelt (her varyasyonu
korlemesine kovalama). Bu BUYUK tema -- ayri oturum(lar). 118'de tasarlanabilir ya da once 1-2 kapatilir.

---

## IKINCIL / ACIK BORCLAR (oncelik sonrasi)
- **NOT bos yakalama:** bos NOT ("NOT: ,") regex'i "," yakaliyor. Eslesince imalat_not'a "," gidebilir.
  Regex'i bos-NOT yakalamayacak sikilastir (dusuk oncelik, eslesme borcu cozulunce gorunur olur).
- **i18n (G-01):** sp_imalat_not_kaynak (117) + 113 wizard + 112 izo drenaj + 116 montaj kart. tv() fallback calisiyor.
- **Mobil imalat NOT:** web'de var, mobil (IbSpoolDetay.jsx) imalat_not okumuyor. Personel mobilde gormeli mi? Ayri is.
- **Batch client-loop (508).** Sunucu-tarafi drenaj.
- **D1/D3 maliyet temizligi** (115'ten).
- **Yuzey survivorship:** test 1015 "Boyali" (import) vs PDF "Siyah" -- bindir sessiz ezmedi. 117 dokunmadi, beklenen.
- **Web spool durum senkronu** (aktif_basamak/ilerleme DB-truth) + ikiz kolon temizligi.
- **Test verisi temizligi** (M270/M130/M235/M240/D130/E120/M110 demo).
- **`_N` alt-spool fallback (MK-110.2).** Wizard yeni-devre UI redesign.

## Vizyon (ileri, bugunun isi degil)
- 3D/walk (MK-49.A). Ikiz gemi + hull benchmark (MK-115.3). montaj_json.continue_baglanti topoloji grafi.

## Destekleyen kararlar (akilda tut)
- **MK-117.1 (M1):** Alistirma kelimeleri MERKEZI (l2-parser ALISTIRMA_IPUCU_VARSAYILAN), format override.
  NOT cekme format-ozel. Kademeli (VAR baskin) + eski tek-deger geriye uyumlu.
- **KARAR-117 (PDF baz):** PDF VAR/KISMI uretti -> yaz (mevcut ezilir). null -> dokunma (KARAR-116.1).
- **KARAR-117.2 (D2-genis):** imalat_not yaz AMA alistirma 'VAR' ise yazma. KISMI/talimat -> yaz.
- **MK-116.x:** montaj pipeline=dosya adi koku; montajEslestir imalattan ayri; montaj PDF kaynak_dosya+devre_id.
- **MK-108.4:** kolon/CHECK/enum adi yazmadan information_schema/pg_constraint dogrula (117'de cok hata: format_adi, parser_seviye, olusturma, format_id).
- **MK-111.2:** bindirme survivorship -- bos->doldur, celiski->flag, sessiz ezme yok.
- **MK-49.1:** izometri-oku.js fingerprint skorlama tarafina DOKUNMA.

## Onemli hatirlatmalar (disiplinler)
- **Veriyi gor, varsayma** -- kok neden zincir kazma (yukleyen_id null dersi).
- **Lokal repro + CANLI test** (agirliksiz NOT flag bug'i sadece canlida cikti).
- **Cok ornekle test** (2 yetmez; 117'de 4-6 PDF).
- **Unicode-paste:** json.dumps(ensure_ascii) -> \uXXXX, backslash'siz regex.
- **CHECK/enum/kolon -> information_schema/pg_constraint** ile dogrula.
- **Migration: dry-run ROLLBACK -> dogrula -> COMMIT.** Repoya arsivle.
- **Push: add -> commit -> pull --rebase -> push.** Kod commit'i [skip ci] YOK.
- **Env:** SUPABASE_SERVICE_KEY; SELF_BASE_URL=https://arespipe.vercel.app.
- **Proje bilgisi ~52'de donmus** -- guncel durum yalniz bu dosyalar + git'ten.
- **uygula_116_*.py untracked betikleri** hala repoda -- sil.

---

## 118'e tek cumle ozet
"117'de imalat NOT + alistirma cikarimi KOD TARAFI bitti (deploy 450b74c): l2-parser merkezi
alistirma motoru (MK-117.1 M1, kademeli VAR baskin, format override), eslestir() imalat dali
alistirma (PDF baz, KARAR-117) + imalat_not (D2-genis: VAR'da yazma, KISMI/talimat'ta yaz),
spool_detay amber 📄 NOT blok + QR. parser_kural NOT regex duzeltildi + flag 'im' (agirliksiz NOT
icin kritik), eski yanlis alistirma kurali kaldirildi, migration 093 canli. Alistirma CANLI
kanitli (E120->VAR ekranda); imalat_not KOD CANLI ama eslesen devre testi BEKLIYOR (test devreleri
yukleyen_id null'a takildi -> ONCELIK 2 borc, kuyruk-isle:305). ONCELIK 1: eslesen+yukleyen_id dolu
devrede imalat_not dogrula. STRATEJIK: desen-disi yonetimi (Cihat tespiti -- eksik-alan raporu ilk adim)."
