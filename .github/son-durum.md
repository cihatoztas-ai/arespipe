# son-durum.md — AresPipe güncel durum (oturum 123 kapanışı)

**HEAD:** `8f39de8` | **CI:** yeşil | **Pilot:** test/asama1-pilot.mjs 64 test | **Mühür:** test/asama1-l2-canli.mjs 28 assertion

## ÖNCELİK 1 — Band-B uçtan uca L2 — MÜHÜRLENDİ (MK-51.2 kapandı)
Oturum 122'de band-B METİN onarımı kanıtlanmıştı; bu oturumda **gerçek L2 motoru** (`metinNormalle → aileBirlestir('tersan_cadmatic_spool') → parse`) 13 gerçek NB1137 glyph spool PDF'ine çalıştırıldı.
- 13/13 PDF: `durum=glyph_band_a_onarildi`, band-B çalıştı, **hepsi `parser_seviye=l2`** (L3 değil).
- Y200 karbon kusursuz (dis_cap=139.7, et=4.5, ST37, 38.283kg). Paslanmaz boru_sch doğru (2", 10S, 316L).
- Mühür: `test/asama1-l2-canli.mjs` (PDF'siz, `\u`-escape anonim fixture — müşteri ID'leri KARAR-48.1 gereği nötrlendi DEMO-000-00X/B0000). 28 assertion, 28/28 yeşil.

## Paslanmaz fitting kapsamı — MK-123.A/B/C (lib/format-paketleri.js, CANLI)
Uçtan uca test 3 boşluk yakaladı (glyph/L2 hatası DEĞİL, fitting kapsamı eksiği):
- **MK-123.A:** paslanmaz dirsek inç+Sch → `dirsek_sch` (emperyal, tetik `Dirsek.*"\s*Sch`, spesifiklik 10 → metrik CuNi dirseğini gölgelemez).
- **MK-123.B:** "Alın Kaynağı - Saha" → `kaynak` pattern sondaki ağırlık opsiyonel + `SA/A\d+` dövme sınıfı. Ağırlıksız kaynak `kategori:'islem'`.
- **MK-123.C:** Manşon + Redüksiyon → `manson` satır tipi + `reduksiyon_sch` (sessiz kayıp giderildi, KARAR-122.1).
- 13/13 PDF `ham=0`. Pilot T1 üst-küme mantığına çevrildi (MK-119.1 kasıtlı genişleme; setEsit → drift guard + bilinen genişleme).

## Montaj eşleşme kök nedeni — MK-123.D (TEŞHİS MÜHÜRLENDİ, çözüm sıradaki oturum)
Spool detayda imalat PDF geliyor, montaj gelmiyordu. Kök neden adım adım daraltıldı:
- İmalat eşleşmesi `pipeline_no` ile doğrudan (`spool_detay.html:1068`) → çalışıyor.
- Montaj eşleşmesi `spooller.montaj_json.kaynak_dosya` üzerinden (yazıcı tek: `kuyruk-isle-izometri.js:702`).
- 1026 spool'dan sadece 25'inde `montaj_json` dolu. 645 montaj PDF yüklü.
- Montaj tarafı KUSURSUZ: 7/7 montaj PDF gerçek motorda L2, `montajDosyaKok` doğru kök, `spool_listesi` doluyor, anahtar temiz. Pipeline eşleşmesi de tam (`M200-302-038-ALS` → devrede var).
- **ASIL SEBEP:** parse edilmiş montajların `parse_sonuc`'u BAYAT — `format_kodu=null`, `seviye=null`, `montaj_var=false`, `spool_adet=1`. Montaj PDF'leri SPOOL gibi, aile registry + glyph gelmeden önce parse edilmiş. `montaj_var=false` → `montajEslestir` hiç çağrılmıyor → `montaj_json` yazılmıyor.
- **117 DEĞİL:** 645 montajın 495'i `yukleyen_id` dolu, sadece 11'i null.
- **KANIT:** yeni devre wizard'dan yüklendi → `Y100-817-012` montajı 🔧 Montaj Resmi olarak DOĞRU geldi. Yeni kod montajı tanıyor (`izometri-oku.js:900-941` güncel). Çözüm = eski ~289 bayat montajı RE-PARSE (kod değişikliği yok).

## 123/B — boş/çöp imalat_not gizleme — CANLI (MK-123.E)
Parse boş NOT alanını `","` ile dolduruyor (`spooller.imalat_not`); spool detay onu amber kartta gösteriyordu. `spool_detay.html` iki yer (NOTLAR + QR önizleme): trim + Unicode harf/rakam kontrolü (`/[\p{L}\p{N}]/u`) → sadece-noktalama/boş değer gizlenir. Render savunması; KAYNAK (parse `","` yazması) ayrı borç.

## Açık borçlar (oturum 123 kapsamı dışı)
- **A — montaj toplu re-parse:** ~289 bayat montaj (`montaj_var=false`) → kuyruk `bekliyor`'a çek + devre-özgü drenaj → `montaj_json` dolacak. **SIRADAKİ ÖNCELİK 1.** Tek-montaj kanıt yolu hazır.
- **A-NOT (parse kaynak):** `izometri-oku`/L2 parser boş NOT alanını `","` yazıyor. "Anlamlı NOT yoksa null" düzeltmesi (parse motoru, risk → ayrı iş).
- **boy_mm int yuvarlama:** motorda `_tipCevir` 95.25→95 yuvarlıyor; fitting kesim boyunda mm-altı kayıp.
- **117:** yukleyen_id null → ~11 montaj/sistem yüklemesi parse edilemiyor (kuyruk-isle-izometri.js:305). Montaj bug'ının sebebi DEĞİL.
- **MK-120.6:** L3 politikası. **Montaj aşama tanıma:** fingerprint "Continue:" (2/7 taşımaz). **Fitting library:** DIN 86087 (saddle), ASME B16.9 diğer gruplar. **Çok-dilli parse** (KARAR-122.1).

## Stack
Supabase/PostgreSQL (RLS, migration), Vercel serverless, Vanilla JS/HTML, GitHub Actions CI (kontrol.js/kontrol.yml). pdf-parse v1.1.1 ZORUNLU (MK-119.4). Mobil PWA: arespipe-mob (React).
