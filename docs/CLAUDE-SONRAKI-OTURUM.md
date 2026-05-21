# CLAUDE — Sonraki Oturum (110) Gündemi

## Açılış ritüeli (her oturum)
1. **CLAUDE.md = 2 kontrol:** `git pull` + `git status` (temiz mi?) + `git log --oneline -5`
   (HEAD 109'un son kod commit'i veya üstünde CI'nin `[skip ci]` raporu — zararsız).
2. **CI rengi:** son push yeşil mi?
3. **Bu doküman + `son-durum.md` oku**, gündemi onayla.
4. Mid-cycle scope ekleme yok.

## Oturum başı doğrulama sorguları (Supabase SQL Editor → düz ASCII)
```sql
-- cizim_durumu dağılımı (109 sonu: bekliyor ~39, tam 628). Adım 4 sonrası kismi/tam görmeli.
select cizim_durumu, count(*) from spooller group by 1 order by 1;

-- wizard izometri kuyruğu (508 hatalı tek PDF burada hata'da)
select durum, count(*) from dosya_isleme_kuyrugu where parser='izometri' group by 1 order by 1;

-- ÖNEMLİ: bir izometri parse_sonuc örneği çek (Adım 4 tasarımı buna bağlı)
select id, parse_sonuc from dosya_isleme_kuyrugu
  where parser='izometri' and durum in ('oneri_hazir','manuel_onay') limit 1;
```

---

## ⭐ ANA HEDEF — ADIM 4: PDF → KABUK EŞLEŞTİRME

> 109'da kabuk-first'ün İLK yarısı bitti: wizard içinde Onayla → spool oluşur (`cizim_durumu='bekliyor'`),
> dolambaç kalktı. PDF'ler arka planda işleniyor (108 self-chain). AMA işlenen PDF kabuk spool'a
> **BAĞLANMIYOR** → çizim durumu `bekliyor`'da donuyor, alıştırma/yön dolmuyor. Bu, döngünün
> "dön, kontrol et, eksikleri doldur" yarısı — wizard'ın "klasörü hallederim" vaadinin kalan kısmı.

### Hedef akış (kabuk-first'ün tamamlanmış hali)
1. (109'da hazır) Klasörü wizard'a at → Onayla → spool'lar `bekliyor`.
2. PDF'ler arka planda işlenir (109'da hazır, self-chain) → **her PDF ait olduğu kabuk spool'a
   OTOMATİK bağlanır** (Adım 4), eksikleri (alıştırma, yön) doldurur, `cizim_durumu` `bekliyor→kismi→tam`.
3. Kullanıcı dönüp bakar: rozetler PDF işlendikçe yeşeriyor.

### Oturum başında VERİLECEK kararlar (A/B/C — canlı parse_sonuc'a bakarak)
1. **Eşleştirme NEREDE çalışsın?**
   - **A) Worker'da** — `kuyruk-isle-izometri.js` PDF'i işledikten SONRA kabuğa bağlasın (sunucu, deterministik).
     **`izometri-oku.js`'e DOKUNMA (MK-49.1)** — bağlama mantığı worker'ın işlem sonrası adımına, ayrı yere girer.
   - **B) İstemcide** — devre_detay açılınca eşleştir (basit ama her açılışta tekrar iş).
   - İlk eğilim: **A** (kaynak-doğru, tek sefer). Karar canlı veriyle netleşir.
2. **Eşleşme anahtarı:** kabuk spool `pipeline_no + spool_no + rev`. PDF'in `parse_sonuc`'unda karşılığı
   ne (resim_no? spool_no? format'a göre değişir mi)? Birebir mi, normalize edip mi (ARES_NORM.marka)?
3. **`kismi` vs `tam` eşiği:** PDF gelince hemen `tam` mı, yoksa "alıştırma + yön DOLDU → tam, biri eksik → kismi" mi?
4. **Eşleşmeyen PDF:** kabukta karşılığı olmayan spool gelirse — yeni spool mu, "atanmamış" kuyruğu mu,
   kullanıcıya mı sorulur?

### İkinci parça — `cizim_durumu` UI rozeti
devre_detay spool listesine kabuk-durumu rozeti/sütun (bekliyor/kismi/tam). Adım 4 `kismi/tam` güncellemesi
bunun üstünde görünür olur. (109'da rozet YOK — sadece DB kolonu var.)

### Hatırlatma: 109'da ne ÇALIŞIYOR (üstüne inşa et)
- `ARES_KABUK.aktar` ortak modül — kabuk INSERT tek yerde. Adım 4 spool'u oluşturmaz, MEVCUT kabuğu zenginleştirir.
- Wizard içi Onayla (+ per-spool yüzey, spool seçimi). devre_detay onayAktar sarmalayıcı.
- izometri PDF onay butonu pasifleştirildi ("İzometri — arka planda"). Adım 4 ile rozet bu pasif etiketin yerini alabilir.

---

## Açık borçlar (110'a taşınan)
1. **Adım 4 (yukarıda) + cizim_durumu UI rozeti** — ANA TEMA.
2. **HTTP 508 PDF** (`M100-323-FM12-ALS.S02.1.pdf`) — kalıcı `hata`; `is_id` ile yeniden dene, izometri-oku 508 sebebi araştır.
3. **İkiz kolon temizliği** — `SEMA-IKIZLER.md`, expand–contract, ayrı oturum (MK-108.2).
4. **Öğrenme döngüsü:** düzeltme sözlüğü (MK-107.3) + 3-katman (MK-107.5) + süper admin Öğrenme Yönetimi (MK-107.7). İlk müşteriler: "St*", "Field Butt welding".
5. **3D hattı** (MK-49.A + MK-107.6) — `yon_dizilim` JSON'dan deterministik client-side render, sıfır AI.
6. **"Tersan M110 Montaj Resmi" formatı GERÇEK** — silme, doğru tanıma.
7. **Düşük öncelik:** wizard tam i18n (dinamik JS metinleri düz TR — tutarlı; EN/AR isterse büyük pass).

## Destekleyen kararlar (akılda tut)
- **MK-49.1:** `izometri-oku.js`'e DOKUNMA — Adım 4 bağlama mantığı worker'ın SONRASINA, ayrı yere.
- **MK-108.1:** Wizard kuyruğu = `dosya_isleme_kuyrugu` + `devre-belgeleri` + `kuyruk-isle-izometri.js` (cron DEĞİL).
- **MK-108.4:** Kolon adı yazmadan önce `information_schema` ile doğrula.
- **MK-109.1:** Çalışan kodu yeniden yazma, çıkar+hizala. **MK-109.2:** onay wizardın içinde.
- **MK-109.3:** izometri parse_sonuc (spoollar/format/batch_id) ≠ Excel BOM (satirlar) — eşleştirmede bunu oku.
- **MK-WIZARD.3:** Kabuk kilidi (idempotent) `ARES_KABUK.aktar` içinde — Adım 4 zenginleştirme yaparken spool ÇOĞALTMA.
- **MK-WIZARD.5:** Eşleşme anahtarı resim_no + spool_no (canlı parse_sonuc'la teyit et).

## Önemli hatırlatmalar (disiplinler)
- `cp ~/Downloads/<dosya> ~/Desktop/arespipe/` + `md5` gözle teyit (arespipe_kopyala şaşabilir — MK-109.5).
- **Önce `git commit`, SONRA `gp`.** Yeni dosya → `git add <dosya>` açıkça (`-u` yakalamaz).
- Şema migration: `BEGIN…ROLLBACK` dry-run → `COMMIT` (MK-98.2). Yeni enum: `pg_get_constraintdef` (MK-101.5).
- HTML/JS tam dosya değişimi; JS doğrulama: inline script ayıkla → `node --check` (+ saf fonksiyon birim testi).
- Supabase SQL Editor düz ASCII (Unicode bozar); `.md` + `.json` git commit'leri Türkçe/Arapça karakter OK.
- Env: `SUPABASE_SERVICE_KEY` (ROLE_KEY değil); `SELF_BASE_URL=https://arespipe.vercel.app`.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.
