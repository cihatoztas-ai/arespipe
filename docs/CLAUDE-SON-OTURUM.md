# CLAUDE — Son Oturum Özeti (Oturum 110, 22 May 2026)

## Özet
ANA HEDEF Adım 4'tü: işlenen izometri PDF'ini kabuk spool'a bağla, `cizim_durumu` bekliyor→kismi
yükselt. Eşleştirme MANTIĞI bitti ve canlı doğrulandı (worker parse-sonrası adımı + backfill
endpoint). Yolda anahtar bir kez YANLIŞ kuruldu (devre+spool_no), canlı veriyle yakalandı, geri
alındı, doğru anahtarla (devre+pipeline+spool, pipeline dosya adından) yeniden kuruldu. Test
sırasında ÇOK DAHA BÜYÜK bir sorun keşfedildi: kabuk akışı boru çap/et'ini IFS'in aksine
zenginleştirmiyor (`4" Sch 10S` → çap=4mm/et=null). Bu sorun + Cihat'ın "katman katman bindirme"
vizyonu 111'e ANA TEMA olarak devredildi. `kismi` canlıda KALIYOR (kullanıcı kararı), rozet kararı 111.

## 1) ares-kabuk.js, devre_detay, wizard — DOKUNULMADI bu oturumda
109'da yazılan kabuk akışı bu oturumda DEĞİŞTİRİLMEDİ. (111'de `boyutParse` lookup'ı için açılacak.)

## 2) api/kuyruk-isle-izometri.js — eslestir() eklendi (worker, 1A)
- `parse_sonuc` UPDATE'i başarılı + `ok` ise → `eslestir(supa, dok.devre_id, is.id, okuJson)`.
  try/catch ile sarıldı: eşleşme hatası parse'ı geçersiz kılmaz (parse_sonuc zaten yazıldı), yut+logla.
- Handler response'una `eslesme` özeti eklendi ({toplam,eslesen,atanmamis,yukseltilen}).
- `izometri-oku.js`'e DOKUNULMADI (MK-49.1) — adım worker'ın PARSE-SONRASI bölümünde.

## 3) eslestir() çekirdek — ANAHTAR İKİ KEZ KURULDU
**İlk (MK-110.1, YANLIŞ):** `devre_id + spool_no`. normSpoolNo (trim+upper). Birim test 17/17 geçti,
backfill koştu, 3 kismi yazıldı. SONRA: canlı sorgu `S01 -> 26 farkli pipeline` gösterdi. Devre içi
spool_no TEKİL DEĞİL → tüm S01 PDF'leri tek spool'a (harita "ilk gelen kazanır") bağlandı. YANLIŞ.
3 kismi geri alındı (`set cizim_durumu='bekliyor'` + `parse_sonuc - '_eslesme'`).

**Doğru (MK-110.2):** `devre_id + pipeline_no + spool_no`. Tekil (`having count>1` → no rows ile
doğrulandı). Pipeline parse_sonuc.spoollar[].pipeline_no NULL → DOSYA ADINDAN:
- `dosyaAdiParse(dosyaAdi)`: `/^(.+?)(?:\s+\d+\(\d+\))?\.(S\d+(?:_\d+)?)\.\d+\.pdf$/i`
- `M100-317-30-ALS 1(2).S01.1.pdf` → {pipeline:'M100-317-30-ALS', spool:'S01'}
- 12 gerçek dosya adı + 4 negatif (atanmamışa düşmeli) → 16/16.
- harita anahtarı: `normPipeline(pipeline)+'|'+normSpoolNo(spool)`.

**A+B:** pipeline dosya adından çıkar (A). Çıkmaz / kabukta yok → atanmamış, ZORLAMA (B). Sebep
alanı: `dosya_adi_pipeline_yok` | `kabukta_yok`. "Yanlış eşleşmektense eşleşmesin."

**3C + MK-WIZARD.3:** eşleşen spool 'bekliyor' ise → 'kismi'. 'tam'/'kismi' → DOKUNMA. Filtreli
UPDATE `.eq('cizim_durumu','bekliyor').select('id')` — yalnız hala bekliyorsa, dönen satır varsa
yukseltilen++ (yarış koşulu + idempotency). eslesen (eşleşme oldu) ≠ yukseltilen (durum değişti).

**4B:** detay[].durum='atanmamis' + sebep. Özet `parse_sonuc._eslesme` jsonb'ye (şema değişmez,
oku-birleştir-yaz, mevcut parse_sonuc korunur).

## 4) api/eslestirme-backfill.js — YENİ endpoint
- Geçmiş (oneri_hazir/manuel_onay, parse_sonuc dolu) PDF'leri eşler. `eslestir()`'i IMPORT eder →
  worker ile BİREBİR aynı mantık (tek kaynak, MK-109.1).
- Body: `{devre_id?, kuru?, limit?}`. `kuru:true` = DB'ye yazmaz, "ne eşleşirdi" raporu (kuru mantık
  da yeni anahtarla güncellendi: pipeline+spool, dosyaAdiParse). devre_dokumanlari!inner(devre_id)
  join ile devre çekilir. İdempotent.

## Birim test (test-eslestir.mjs — repoda DEGIL, container'da kaldı)
- dosyaAdiParse 5/5 (pafta ekli/eksiz, S01_1 alt-spool, negatifler).
- 110 BUG REGRESYON: aynı devrede S01→3 pipeline, PDF M100-317-24 → SADECE A-700 eşleşti,
  diğer iki S01 dokunulmadı. (Eski kod hepsini tek spool'a bağlardı.)
- Atanmamış (kabukta_yok), B güvenlik (regex tutmaz → dokunma), MK-WIZARD.3 (tam dokunma),
  _eslesme.dosya_adi yazımı. Hepsi geçti.

## Canlı kanıt (devre d6dffba8 — altın test seti: 36 bekliyor + 25 tam)
- Kuru backfill: 20 PDF, eslesen 17, atanmamis 3, yukseltilebilir 16. Doğru pipeline+spool.
- 3 atanmamış = `_1` alt-spool (`S01_1`/`S02_1`): pipeline doğru, ama kabukta spool çıplak (`S01`),
  PDF `_1`'li → birebir tutmadı. DOĞRU davranış (B). 111: `_N` fallback gerekli.
- Gerçek backfill koştu → bekliyor 33 + kismi 3 + tam 25. 25 tam DOKUNULMADI (MK-WIZARD.3 kanıtı).

## 🔴 KEŞFEDİLEN BÜYÜK SORUN (111 ANA TEMA) — boru ölçü zenginleştirme
Adım 4 testinde, başka bir devrede (G200-333-OD01, kabuk ile gelen) görüldü:
- A-0682 (kabuk): dis_cap_mm=4.00, et_kalinligi_mm=NULL. `4" Sch 10S` borusunun "4" inç sayısı
  ham çap yazılmış, SCH→DN→OD/et lookup'ı HİÇ çalışmamış.
- A-0737 (IFS ile aynı tip boru): dis_cap_mm=114.3, et=3.05. DOĞRU. (görsel kanıt)
- Kök: iki ayrı `boyutParse`. IFS (devre_yeni.html:1761-1825) NPS+SCH+WT tablosu biliyor. Kabuk
  (ares-kabuk.js:33-43) sadece DN tablosu, SCH/inç YOK → son satırda parseFloat("4")=4.
- `ares-asme.js` (2567 satır, tests/asme-lookup.test.js ile test) tam lookup motoru:
  `etKalinligi(dn,sch,malzeme)`, `disCap(dn,malzeme)`, `agirlikKgM`, `NPS_DN`/`DN_NPS`, `_schNorm`,
  `_malzemeNorm`. Kabuk bunu çağırmıyor.
- Vizyon (Cihat): Excel→PDF katman katman bindirme; çakışma görünürlüğü; zengin veri. Uygulamada
  Excel'den ~sadece spool_no alınıyor, oysa BOM (s.bom) çap/et/ağırlık zaten kabuk'a geliyor ama
  spool seviyesine taşınmıyor. Adım 4 de sadece rozete indirgendi — PDF verisini bindirmek hedefti.

## Mimari kararlar
- MK-110.1 (revize→110.2): anahtar tekilliğini CANLI VERİYLE doğrula, varsayma.
- MK-110.2: anahtar = devre+pipeline+spool, pipeline dosya adından (formata özgü regex).
- MK-110.3 (YENİ, 111 temeli): kabuk lookup eksiği; ares-asme.js ortak motor; YENİ PARSER YAZMA.
- MK-110.4 (A+B): emin değilsen zorlama, atanmamış bırak.
- MK-110.5: kuru çalışma önce (DB'ye dokunmadan raporla→doğrula→koş).

## Commit'ler
| Commit | İçerik |
|--------|--------|
| 7422009 | Adim4 eslestirme (MK-110.1, yanlis anahtar) + backfill |
| fa22eba | Adim4 anahtar duzelt (MK-110.2) + A+B + dosyaAdiParse |
| (doc) | kapanis dokumanlari [skip ci] |

## Değişen dosyalar
- `api/kuyruk-isle-izometri.js` (eslestir + dosyaAdiParse + normPipeline + export; handler eslesme)
- `api/eslestirme-backfill.js` (YENİ)
- (test-eslestir.mjs + test-pipeline-regex.mjs container'da — repoya alınmadı, istenirse 111'de)

## Sonraki oturum
🔴 ANA HEDEF: **Boru ölçü zenginleştirme + katman bindirme** (MK-110.3). Detay
CLAUDE-SONRAKI-OTURUM.md. Yan işler: `_N` fallback eşleştirme, cizim_durumu rozeti (kalsın mı kararı),
gerçek backfill'i diğer devrelere yayma. `kismi` şu an d6dffba8'de canlı, KALIYOR.
