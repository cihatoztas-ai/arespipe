# CLAUDE — Sonraki Oturum (111) Gündemi

## Açılış ritüeli (her oturum)
1. `git pull` + `git status` (temiz mi?) + `git log --oneline -5` (HEAD 110 + doküman commit'i).
2. CI rengi: son push yeşil mi?
3. Bu doküman + `son-durum.md` + `CLAUDE-SON-OTURUM.md` oku, gündemi onayla.
4. Mid-cycle scope ekleme yok.

## Oturum başı doğrulama sorguları (Supabase SQL Editor → düz ASCII)
```sql
-- d6dffba8 cizim_durumu (110 sonu: bekliyor 33, kismi 3, tam 25). kismi CANLI KALDI.
select cizim_durumu, count(*) from spooller
where devre_id='d6dffba8-8d5b-4a88-a45f-ca2ef39c01fa' and silindi=false group by 1 order by 1;

-- ZENGINLESTIRME KANITI: kabuk spool'lari fakir cap (4.00 = inc sayisi, et NULL)
select spool_id, pipeline_no, spool_no, dis_cap_mm, et_kalinligi_mm, kalite, malzeme
from spooller where pipeline_no='G200-333-OD01' and silindi=false order by spool_no;
-- Beklenti: dis_cap_mm=4.00, et_kalinligi_mm=NULL (BOZUK). Hedef: 114.3 / 3.05 (IFS gibi).

-- Karsilastirma: IFS ile gelen spool DOGRU (114.3 / 3.05)
select spool_id, pipeline_no, dis_cap_mm, et_kalinligi_mm from spooller
where spool_id='A-000737';
```

---

## ⭐ ANA HEDEF — BORU ÖLÇÜ ZENGİNLEŞTİRME + KATMAN BİNDİRME

> Bu, 110'un sonunda keşfedilen iki katmanlı bir iş. Aceleyle "boyutParse'a SCH dalı ekle" demek
> fırsatı yarım kullanır (Cihat'ın vizyonu daha büyük). İki parça halinde, sırayla.

### Bağlam — Cihat'ın orijinal vizyonu (110'da netleşti)
"Önce Excel'i sömür (ne varsa al), sonra PDF ve diğer dökümanlardan sömürdüğümüz veriyi ÜSTÜNE
BİNDİR — katman katman. Hem çakışmaları görürüz, hem kendi sistemimizde zengin veri kaynağı oluşur."

Uygulamadaki sapma: Excel'den neredeyse SADECE spool_no alınıyor (kabuk akışı). Oysa BOM'daki
çap/et/ağırlık/malzeme zaten kabuk'a geliyor (`s.bom` — ares-kabuk.js). Ama:
1. Spool seviyesine (`spooller.dis_cap_mm/et`) yazarken fakir `boyutParse` kullanılıyor → SCH/inç
   çözülmüyor → çap=4mm/et=NULL.
2. Adım 4 (PDF eşleştirme, 110'da yapıldı) PDF verisini kabuk spool'a BİNDİRMİYOR — sadece
   `cizim_durumu` rozetini değiştiriyor. PDF'teki et/çap/yön/ağırlık ZENGİNLİĞİ kullanılmıyor.

### Kök neden — KANITLANMIŞ (110)
| | dis_cap_mm | et | sebep |
|--|--|--|--|
| A-0682 (kabuk) | 4.00 ❌ | NULL ❌ | ares-kabuk.js boyutParse SCH/inç bilmiyor, parseFloat("4")=4 |
| A-0737 (IFS) | 114.3 ✅ | 3.05 ✅ | devre_yeni.html:1761 boyutParse NPS+SCH+WT tablosu biliyor |

İki ayrı `boyutParse`:
- **IFS (DOĞRU):** `devre_yeni.html:1761-1825`. `"4\" Sch 10S"` → NPS normalize + sch normalize
  (`SCH40→40`, `STD→40`, `10S→10S`...) + ASME B36.10/B36.19 WT tablosu → {dis_cap, et}.
- **Kabuk (FAKİR):** `ares-kabuk.js:33-43`. Sadece `60.3x4.5`, `OD:60`, `DN50` (sabit DN→OD
  tablosu). SCH/inç YOK → son satır: `parseFloat(s)`.
- **Ortak motor MEVCUT:** `ares-asme.js` (2567 satır, `tests/asme-lookup.test.js` ile test):
  `etKalinligi(dn,schedule,malzeme)`, `disCap(dn,malzeme)`, `icCap`, `agirlikKgM`, `cunife*`,
  `NPS_DN`/`DN_NPS`, `_schNorm`, `_malzemeNorm`. **Lookup zaten var ve çalışıyor — kabuk çağırmıyor.**

### PARÇA 1 — Kabuk ölçü lookup'ını düzelt (önce bu, daha somut)
**Hedef:** Kabuk akışı da `4" Sch 10S` → 114.3/3.05 üretsin (IFS ile aynı).
**Yol (MK-109.1 ruhu — yeniden yazma, mevcut motoru çağır):**
1. IFS'in çalışan parse'ını (`devre_yeni.html:1761-1825`) İNCELE — `"4\" Sch 10S"` metnini nasıl
   {NPS, sch, malzeme} → {dis_cap, et}'e çeviriyor. Bu mantık ya `ares-asme.js`'i çağırıyor ya
   kendi WT tablosu var (inline). İncele, ortak modüle çıkar.
2. Karar (oturum başı, A/B/C): ortak `boyutParse` NEREDE yaşasın?
   - A) `ares-asme.js`'e ekle (lookup motoru zaten orada; metin→{dn,sch,mal} parse + lookup birleşsin).
   - B) Yeni ortak modül `ares-olcu.js` (parse + ares-asme lookup köprüsü).
   - C) `ares-kabuk.js`'in boyutParse'ını IFS mantığıyla genişlet (en dar, ama iki kopya kalır).
   - İlk eğilim: **A veya B** (tek kaynak; IFS + kabuk + gelecek PDF hepsi aynı motoru kullansın).
3. **DİKKAT — ares-kabuk.js'e dokunma disiplini:** 109'da yazıldı, node --check + birim testle
   doğrulandı. Kopya → str_replace → node --check → birim test (boyutParse'ın yeni dalları için).
   Mevcut `boyutParse(dn)` TEK argüman alıyor — ama SCH+malzeme lazım. `s.bom` satırında (b.dn,
   b.tanim, b.malzeme) bunlar VAR (ares-kabuk.js:207). Yani veri elde; sadece boyutParse'a
   geçirilmiyor + SCH parse edilmiyor. Çağrı imzasını genişletmek gerekebilir (b.tanim'dan SCH çek).
4. **KRİTİK — `s.bom`'daki ham veriyi incele:** PDF parse'ta malzeme_listesi.tanim =
   "Boru Dikişsiz Paslanmaz 316L SCH10S - 2.2 Sertifik 4" Sch 10S 4877 316L 40.813". SCH/inç burada
   GÖMÜLÜ. Excel BOM'da da (kuyruk-isle-excel.js / excel-parser.js) benzer. Önce gerçek `s.bom`
   şeklini canlı görmeden imza tasarlama (110 dersi: veriyi gör, varsayma).

**Doğrulama:** Bir kabuk devresini (G200-333-OD01) yeniden aktar VEYA tek seferlik düzeltme script/
endpoint ile mevcut fakir spool'ları yeniden hesapla. Sonra A-0682 → 114.3/3.05 görmeli.

### PARÇA 2 — Katman bindirme (Adım 4'ün gerçek hedefi)
**Hedef:** Adım 4 eşleştirme (110'da yapıldı) artık sadece rozet değil — eşleşen PDF'in verisini
kabuk spool'a BİNDİRSİN. "Excel katmanı + PDF katmanı = zengin spool."
**Tasarım kararları (oturum başı, canlı veriyle):**
1. Hangi alanlar bindirilsin? PDF parse_sonuc.spoollar[]'da: cap_mm, et_mm, agirlik_kg, yuzey,
   alistirma_ipucu, malzeme_listesi, yon (henüz yok). Excel zaten bazılarını koydu (belki fakir).
2. Çakışma kuralı: Excel çap=4 (fakir) ↔ PDF çap=114.3 → hangisi kazanır? Boş alanı doldur mu,
   yoksa "daha güvenilir kaynak" mı? Kaynak güven sırası? (Excel BOM mu PDF mi daha güvenilir?)
3. Çakışma GÖRÜNÜRLÜĞÜ (Cihat'ın vizyonu): iki kaynak farklı değer derse kullanıcıya göster
   (devre_detay'da uyarı/badge). Sessizce ezme.
4. `kismi` → `tam` eşiği: 110'da 3C ile "PDF geldi = kismi" dedik. Bindirme sonrası: tüm zorunlu
   alanlar (et+yön+alıştırma) doldu → tam? Bu eşik PARÇA 2 ile netleşir.
5. `cizim_durumu` UI ROZETİ: 110'da YAPILMADI. Karar 111'e bırakıldı (rozet kalsın mı/gitsin mi).
   Bindirme tasarımı rozetin anlamını belirler → rozet PARÇA 2 sonrası yapılmalı.

### Hatırlatma: 110'da ne ÇALIŞIYOR (üstüne inşa et, geri ALMA)
- `eslestir()` (kuyruk-isle-izometri.js) — devre+pipeline+spool anahtarı, A+B, 3C, MK-WIZARD.3. CANLI.
- `eslestirme-backfill.js` — kuru + gerçek mod, `eslestir()` import eder. CANLI.
- `dosyaAdiParse()` — formata özgü regex (M100/Tersan). 16/16 test.
- d6dffba8'de 3 kismi CANLI (kullanıcı bıraktı). 25 tam dokunulmadı.

---

## Açık borçlar (111'e taşınan, öncelik sırası)
1. **🔴 ANA: Boru ölçü zenginleştirme + katman bindirme (yukarıda PARÇA 1 + PARÇA 2).**
2. **`_N` fallback eşleştirme (MK-110.2 eksiği).** `S01_1` PDF → kabukta `S01` varsa ona eşleş
   (pafta eki). AMA `S08_1` gibi GERÇEK ayrı spool'u bozma. Kural: önce birebir `pipeline|S01_1`
   dene; yoksa `_N` at → `pipeline|S01` dene; o da yoksa atanmamış. (d6dffba8'de 3 atanmamış bekliyor.)
3. **cizim_durumu UI rozeti** — PARÇA 2'ye bağlı (kalsın mı kararı orada).
4. **GERÇEK backfill'i diğer devrelere yay** — zenginleştirme tasarımı netleşince. Şu an yalnız
   d6dffba8'de koştu.
5. **HTTP 508 PDF** (`M100-323-FM12-ALS.S02.1.pdf`) — kalıcı hata; izometri-oku 508 sebebi.
6. **İkiz kolon temizliği** (SEMA-IKIZLER.md, MK-108.2) — ayrı oturum.
7. **3D hattı** (MK-49.A) — `yon_dizilim` JSON'dan deterministik render. Katman bindirme `yon`
   verisini de getirirse 3D'nin girdisi hazırlanmış olur (bağlantılı).
8. **Öğrenme döngüsü** (MK-107.x), "Tersan M110 Montaj Resmi" format temizliği.

## Destekleyen kararlar (akılda tut)
- **MK-49.1:** `izometri-oku.js`'e DOKUNMA.
- **MK-108.1:** Wizard kuyruğu = `dosya_isleme_kuyrugu` + `devre-belgeleri` + `kuyruk-isle-izometri.js`.
- **MK-108.4:** Kolon adı yazmadan `information_schema` ile doğrula.
- **MK-109.1:** Çalışan kodu YENİDEN YAZMA — çıkar/çağır + hizala. (PARÇA 1'in ÖZÜ: IFS'in çalışan
  lookup'ını kabuk'a bağla, sıfırdan yazma.)
- **MK-109.5:** `cp` + `md5` gözle teyit (arespipe_kopyala şaşabilir).
- **MK-110.2:** Eşleşme anahtarı = devre+pipeline+spool, pipeline dosya adından.
- **MK-110.3:** Kabuk lookup eksiği — ares-asme.js ortak motor (111 ANA TEMA temeli).
- **MK-110.4 (A+B):** Emin değilsen eşleştirme/bindirme ZORLAMA — boş/atanmamış bırak.
- **MK-110.5:** Kuru çalışma önce — DB'ye dokunmadan raporla, doğrula, koş.
- **MK-WIZARD.3:** Kabuk kilidi idempotent — bindirme spool ÇOĞALTMA, mevcut spool'u zenginleştir.

## Önemli hatırlatmalar (disiplinler)
- `cp ~/Downloads/<dosya>` + `md5` gözle teyit. Önce `git commit`, SONRA `gp`. Yeni dosya → `git add`.
- HTML/JS tam dosya değişimi; JS doğrulama: inline script ayıkla → `node --check` + saf fonksiyon
  birim testi. ares-kabuk.js + ares-asme.js dokunulurken bu disiplin zorunlu (ikisi de test edilmiş).
- Şema migration: `BEGIN…ROLLBACK` dry-run → `COMMIT` (MK-98.2). Supabase SQL Editor düz ASCII.
- **Veriyi gör, varsayma (110'un en büyük dersi):** anahtar tekilliği, s.bom şekli, çakışma —
  hepsini canlı SQL/çıktı ile doğrula, sonra kod yaz. 110'da varsayım 3 yanlış kismi yazdırdı.
- Env: `SUPABASE_SERVICE_KEY`; `SELF_BASE_URL=https://arespipe.vercel.app`.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

## 111'e tek cümle özet
"110'da PDF→spool eşleştirme (rozet seviyesi) kuruldu ve çalışıyor; 111'de işin ASIL hedefine
geçiyoruz: kabuk akışının fakir boru ölçülerini IFS'in zengin lookup'ıyla düzelt (PARÇA 1) ve
Excel+PDF verisini spool üstüne KATMAN KATMAN bindir (PARÇA 2) — Cihat'ın baştan beri vizyonu buydu."
