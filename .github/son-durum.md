# Son Durum — 110. Oturum (22 May 2026)

> 109 → 110 geçişi. ANA HEDEF: Adım 4 — PDF→kabuk eşleştirme (`cizim_durumu` bekliyor→kismi).
> Eşleştirme MANTIĞI bitti ve canlı doğrulandı. AMA test sırasında çok daha büyük, AYRI bir
> sorun ortaya çıktı: kabuk akışı boru ölçülerini (çap/et) IFS akışının aksine
> ZENGİNLEŞTİRMİYOR — `4" Sch 10S` borusu çap=4mm/et=null olarak yazılıyor. Bu, 111'in ana teması.

---

## Bu Oturumun Sonucu

**110 yarı-kapandı: Adım 4 eşleştirme CANLI ve doğru çalışıyor; ama daha derin bir veri
zenginleştirme sorunu keşfedildi ve 111'e bilinçli olarak devredildi.** Eşleştirme (worker
parse-sonrası adımı + backfill endpoint) canlıda; `cizim_durumu` doğru güncelleniyor. Çap/et
lookup sorunu + "katman katman bindirme" vizyonu 111 ANA TEMA olarak ayrıntılı belgelendi.

### Yapılanlar (Adım 4 — eşleştirme)

1. **`api/kuyruk-isle-izometri.js` — `eslestir()` eklendi (worker parse-sonrası, 1A).**
   PDF parse edilip `parse_sonuc` yazıldıktan SONRA, `eslestir(supa, devreId, kuyrukId, okuJson)`
   çağrılır. izometri-oku.js'e DOKUNULMADI (MK-49.1) — adım worker'ın kendi parse-sonrası bölümünde.
   Eşleşme hatası parse'ı geçersiz kılmaz (yut+logla). Handler response'una `eslesme` özeti eklendi.
2. **`api/eslestirme-backfill.js` — YENİ endpoint.** Zaten işlenmiş (oneri_hazir/manuel_onay) PDF'leri
   geriye dönük eşler. `eslestir()`'i import eder (tek kaynak, MK-109.1). `kuru:true` = DB'ye yazmadan
   "ne eşleşirdi" raporu. `devre_id` ile tek devre, limit ile sınır. İdempotent.
3. **Anahtar İKİ KEZ revize edildi (kritik ders):**
   - **MK-110.1 (İLK, YANLIŞ):** `devre_id + spool_no`. Birim test geçti, canlı backfill koştu →
     3 spool kismi oldu. SONRA fark edildi: bir devrede `spool_no` TEKİL DEĞİL — `S01` 26 farklı
     pipeline'da, `S02` 14 pipeline'da tekrar ediyor (canlı sorgu). Tüm S01 PDF'leri tek spool'a
     (A-000620) bağlandı. 3 yanlış kismi GERİ ALINDI (`update ... set cizim_durumu='bekliyor'` +
     `parse_sonuc - '_eslesme'`).
   - **MK-110.2 (DOĞRU):** `devre_id + pipeline_no + spool_no`. Tekil anahtar (canlı "no rows" ile
     doğrulandı). Pipeline parse_sonuc'ta NULL geldiği için DOSYA ADINDAN çıkarılıyor:
     `dosyaAdiParse()` regex → `M100-317-30-ALS 1(2).S01.1.pdf` → {pipeline:'M100-317-30-ALS',
     spool:'S01'}. 12 gerçek + 4 negatif örnekle test (16/16). Bu, MK-110.1'in "dosya adı
     KULLANILMAZ" hükmünü gevşetti — pipeline disambiguation için dosya adı GEREKLİ.
4. **A+B kararı (eşleşme stratejisi):** regex tutar + pipeline kabukta varsa eşle (A); tutmaz /
   pipeline yoksa ZORLAMA, atanmamış bırak (B). "Yanlış eşleşmektense eşleşmesin" — 110 bug dersi.
5. **3C + MK-WIZARD.3:** eşleşen spool 'bekliyor' ise 'kismi'ye yükselt; 'tam'/'kismi' ise DOKUNMA
   (filtreli UPDATE `.eq('cizim_durumu','bekliyor')` — yarış koşulu + idempotency). Canlı kanıt:
   25 'tam' spool sabit kaldı, sadece bekleyenler yükseldi.
6. **4B:** eşleşmeyen → `parse_sonuc._eslesme.detay[].durum='atanmamis'` + sebep (kabukta_yok /
   dosya_adi_pipeline_yok). Şema değişmez (jsonb).

### Canlı Doğrulamalar (devre d6dffba8 — altın test seti)

- ✅ Kuru backfill: 20 işlenmiş PDF, 17 eşleşen, 3 atanmamış, 16 yükseltilebilir. Her PDF doğru
  pipeline+spool'a gitti (110 bug çözüldü — artık her S01 doğru pipeline'ına eşleşiyor).
- ✅ 3 atanmamış: hepsi `_1` alt-spool'lu (`S01_1`, `S02_1`). Pipeline DOĞRU eşleşiyor ama kabukta
  spool `S01`/`S02` (çıplak), PDF `S01_1`/`S02_1` (alt-pafta) → birebir tutmadı → atanmamış (B
  güvencesi). Bu DOĞRU davranış ama eksik: `_1` = pafta/parça eki, kök spool'a ait. **111: `_N`
  fallback kuralı gerekiyor** (önce birebir, yoksa `_N` at + kök spool dene — ama `S08_1` gibi
  GERÇEK ayrı spool'ları bozmadan).
- ✅ MK-WIZARD.3: aynı spool'a 2 PDF gelince ikincisi yükseltmedi (eslesen>yukseltilen ayrımı doğru).
- ⚠️ GERÇEK backfill yalnız d6dffba8'de koştu (3 kismi yazıldı — KALIYOR, kullanıcı kararı).
  Diğer devrelere YAYILMADI.

---

## 🔴 111 ANA TEMA — Boru ölçü zenginleştirme + katman bindirme (DETAY: CLAUDE-SONRAKI-OTURUM.md)

Adım 4 testinde keşfedildi. Kök neden + vizyon CLAUDE-SONRAKI-OTURUM.md'de uzun anlatıldı. Özet:

- **Sorun:** Kabuk akışı (`ares-kabuk.js`) `4" Sch 10S` borusunu çap=4.00mm/et=null yazıyor (inç
  sayısını ham çap sanıyor). IFS akışı (`devre_yeni.html:1761`) AYNI veriyi 114.3mm/3.05mm doğru
  çıkarıyor. Regresyon DEĞİL — kabuk akışı IFS'in SCH/inç lookup'ını miras almamış.
- **Kanıt:** A-0737 (IFS) çap 114,3 / et 3,05 ✅ ↔ A-0682 (kabuk) çap 4,00 / et null ❌. Aynı boru.
- **Kök:** İki ayrı `boyutParse`. IFS'inki (devre_yeni.html:1761-1825) NPS+SCH+WT tablosu BİLİYOR.
  Kabuk'unki (ares-kabuk.js:33-43) sadece DN tablosu, SCH/inç YOK. `ares-asme.js` (2567 satır,
  test edilmiş) tam lookup motoru — `etKalinligi/disCap/agirlikKgM/NPS_DN`. Kabuk onu çağırmıyor.
- **Vizyon (Cihat):** "Excel'i sömür → PDF/diğer dökümanları üstüne bindir → katman katman zengin
  veri + çakışma görünürlüğü." Uygulamada Excel'den neredeyse sadece spool_no alınıyor; oysa
  BOM'daki çap/et/ağırlık zaten kabuk'a geliyor (s.bom) ama spool seviyesine taşınmıyor. Adım 4
  eşleştirme de sadece `cizim_durumu` rozetine indirgendi — oysa PDF'in et/çap/yön verisini kabuk
  spool'a BİNDİRMEK asıl hedefti.

---

## Commit'ler (110)

| Hash | Mesaj |
|------|-------|
| `7422009` | feat(110): Adim4 izometri PDF -> kabuk spool eslestirme (MK-110.1) + backfill endpoint |
| `fa22eba` | fix(110): Adim4 anahtar duzelt (MK-110.2) — devre+pipeline+spool, pipeline dosya adindan, A+B |
| (doc) | chore(110): kapanis dokumanlari [skip ci] |

CI: kod commit'leri ayrı push'landı (MK-109.6 — `[skip ci]` yalnız doküman commit'inde, tek başına).

---

## Mimari Kararlar (110)

- **MK-110.1 (REVİZE EDİLDİ → 110.2):** İlk anahtar `devre+spool_no` idi, YANLIŞ. Devre içi spool_no
  tekil DEĞİL (S01 → 26 pipeline). Ders: anahtar tekilliğini canlı veriyle DOĞRULA, varsayma.
- **MK-110.2:** Eşleşme anahtarı = `devre_id + pipeline_no + spool_no`. Pipeline parse'ta NULL →
  DOSYA ADINDAN regex ile çıkarılır (`dosyaAdiParse`). Regex formata özgü (M100/Tersan `-ALS` +
  `.S<n>.<rev>.pdf`); başka format → null → atanmamış (B). 12 gerçek + 4 negatif test.
- **MK-110.3 (YENİ — 111'in temeli):** Kabuk akışı IFS'in boru ölçü lookup'ını miras almamış. İki
  ayrı `boyutParse` var; IFS'inki SCH/inç biliyor, kabuk'unki bilmiyor. `ares-asme.js` ortak motor —
  111'de kabuk akışı da onu kullanmalı (tek lookup, MK-109.1 ruhu). YENİ PARSER YAZMA, mevcut çağır.
- **MK-110.4 (A+B):** Eşleştirmede emin değilsen ZORLAMA — atanmamış bırak. Yanlış veri yazmaktansa
  boş bırak (110'da 3 yanlış kismi yazılıp geri alındı; bu kural o dersten).
- **MK-110.5:** Kuru çalışma (`kuru:true`) modu HER backfill/toplu işlemde olsun. Önce DB'ye
  dokunmadan "ne olurdu" raporu, gözle doğrula, SONRA gerçek koş. 110 bug'ı kuru→tek-devre→doğrula
  sırası sayesinde 3 spool'la sınırlı kaldı, yayılmadı.

---

## DB Değişiklikleri

Migration YOK. `cizim_durumu` CHECK constraint ('bekliyor','kismi','tam') zaten 108'de vardı, 'kismi'
izinli. Eşleşme meta'sı `parse_sonuc._eslesme` jsonb içine yazılıyor (şema değişmez).

Doğrulama sorguları (Supabase SQL Editor → düz ASCII):
```sql
-- d6dffba8 cizim_durumu dagilimi (110 sonu: bekliyor 33, kismi 3, tam 25)
select cizim_durumu, count(*) from spooller
where devre_id='d6dffba8-8d5b-4a88-a45f-ca2ef39c01fa' and silindi=false group by 1 order by 1;

-- KANIT: devre ici spool_no tekil DEGIL (S01 -> 26 pipeline)
select spool_no, count(*) adet, count(distinct pipeline_no) farkli_pipeline
from spooller where devre_id='d6dffba8-8d5b-4a88-a45f-ca2ef39c01fa' and silindi=false
group by spool_no order by adet desc;
```

---

## 111'e Açık Borç (önceliğe göre)

1. **🔴 ANA TEMA: Boru ölçü zenginleştirme + katman bindirme (MK-110.3).** Detay
   CLAUDE-SONRAKI-OTURUM.md. İki parça: (a) kabuk `boyutParse` → `ares-asme.js` lookup'ına bağla
   (SCH/inç çözülsün), (b) Adım 4 eşleştirme PDF verisini kabuk spool'a BİNDİRSİN (sadece rozet değil).
2. **`_N` fallback eşleştirme (MK-110.2 eksiği).** `S01_1` → kök `S01`'e eşleşsin (pafta eki), AMA
   `S08_1` gibi gerçek ayrı spool'u bozmadan: önce birebir dene, yoksa `_N` at + kök dene.
3. **`cizim_durumu` UI rozeti (Adım 4 Parça 3 — YAPILMADI).** devre_detay spool listesinde
   bekliyor/kismi/tam göstergesi. KARAR 111'e bırakıldı: rozet kalsın mı (i) gitsin mi — çünkü
   katman bindirme tasarımı rozetin anlamını değiştirebilir.
4. **GERÇEK backfill yalnız d6dffba8'de koştu** — diğer devreler için (zenginleştirme tasarımı
   netleşince) tekrar koşulacak. Şu an 3 kismi canlıda KALIYOR (kullanıcı kararı).
5. **HTTP 508 PDF** (`M100-323-FM12-ALS.S02.1.pdf`) — kalıcı hata, izometri-oku 508 sebebi.
6. **İkiz kolon temizliği** (`SEMA-IKIZLER.md`, MK-108.2) — ayrı oturum.
7. **3D hattı** (MK-49.A), öğrenme döngüsü (MK-107.x), "Tersan M110 Montaj Resmi" format temizliği.

---

## Kritik Hatırlatmalar

- **`izometri-oku.js`'e DOKUNMA** (MK-49.1) — eşleştirme worker'ın parse-SONRASINA girdi, ayrı yer.
- **`cp ~/Downloads/<dosya>` + `md5` gözle teyit** (arespipe_kopyala şaşabilir — MK-109.5).
- **Önce `git commit`, SONRA `gp`.** Yeni dosya → `git add <dosya>` açıkça.
- **Kuru çalışma önce** (MK-110.5) — toplu/yıkıcı işlemde DB'ye dokunmadan raporla, doğrula, sonra koş.
- **Anahtar tekilliğini canlı veriyle doğrula** (MK-110.1 dersi) — "tekil olmalı" varsayma, SQL at.
- **Env:** `SUPABASE_SERVICE_KEY`; `SELF_BASE_URL=https://arespipe.vercel.app`.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

> 111 açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
