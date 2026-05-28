# Son Durum — 131. Oturum (28 Mayıs 2026)

> 130 → 131 geçişi. **Teşhis oturumu (kod yok, bilinçli).** 130'un K4 ikilemi (Yol 2 "format
> öğret" vs Yol 1 "L3 montaj") **kökten çözüldü** — ikisi de değil. Gerçek AT110 PDF'leri (montaj +
> imalat) gerçek parser + gerçek fingerprint + gerçek pdf-parse ile canlı çalıştırılarak kök sebep
> kesinleştirildi: **tanıma (recognition) glyph-decode boşluğu.** Fix deterministik tek tabloya indi.

---

## Bu Oturumun Sonucu

**131 başarıyla kapatıldı (teşhis mühürlendi).** Montaj/spool sorunu "format öğretme" değil "tanıma"
çıktı. Tersan formatı zaten öğretilmiş (119 spool / 120 montaj); AT110 ona hiç ulaşamıyordu çünkü
tanınmıyordu. Kök sebep mekanik olarak kanıtlandı; fix yönü (glyph band-B decode tablosu) de-risk
edildi. Kod bilinçli olarak 132'ye (bulk + taze bağlam) bırakıldı.

### Yapılanlar (sırasıyla)

1. **Açılış ritüeli** — git temiz, HEAD `bbf0626` (130 doc, `[skip ci]`), CI yeşil (129 deploy Ready).
   Devir dosyaları + PARSER-VE-YUKLEME-AKISI Bölüm 7-8 okundu. Function 12/12 (kod değişmedi).

2. **Doğrulama kapısı (K4 "önce"):** Cihat 2 takım gerçek AT110 + M100 PDF gönderdi (montaj +
   imalat). İçerik ayrımı kesin: **S-segmentsiz `_1.pdf` = montaj** (Continue: topolojisi VAR,
   Malzeme Listesi YOK), **S-segmentli `_S01_1.pdf` = imalat** (Malzeme Listesi + W1-W5 + Cut&Bending).
   S-segmentsiz dosyalar kapak değil, dolu montaj resmi. K4 hedefi doğrulandı.

3. **Format zaten öğretilmiş — 130 çerçevesi düzeltildi:** `format-paketleri.js` + `l2-parser.js`
   incelendi. İki aile de canlı: `tersan_cadmatic_spool` (e1fb879d, 119'da 6/8 PDF) +
   `tersan_cadmatic_montaj` (39a2c81b, 120'de 7 montaj PDF / 6 gemi). `montaj_modu` l2-parser'da
   çalışıyor. Yani **"Yol 2 = format öğret" yanlış kurulmuş** — öğretecek bir şey yok.

4. **Parser canlı testi (pdftotext):** Montaj parser AT110 montajını **kusursuz** okudu (pipe_no,
   spool S01, yüzey, blok B1137, sistem, 8 kg — 6/6). İmalat başlığı okundu ama malzeme satırları
   varyant (boşluklu) → ham düştü. → Demek ki parser hazır, PDF ona ulaşmıyor.

5. **Tanıma kök sebebi (mühür):** Gerçek `pdf-parse` + gerçek fingerprint skorlamasıyla:
   - AT110 montaj + imalat: Producer=`Cadmatic`, Creator=`Piping Isometrics & Spools` → üretici +1.
   - Metin sinyalleri (`Continue:` / `Malzeme Listesi` / `Cut & Bending Info`) pdf-parse çıktısında
     **dördü de bulunamadı** → skor **1 < eşik 2** → **TANINMADI → L3.** (130'un gözlemi doğruydu,
     sebebi yanlış atfedilmişti.)
   - **Linchpin:** Hem tanıma (`pdfIpucuCikar`, satır 634) hem L2 (`parserKuralIle`, satır 882)
     **pdf-parse** kullanıyor — `-layout` değil. Metin modu sorun değil, **decode** sorun.

6. **Glyph kök sebebi + deterministik kanıt:** `pdffonts` → font **gömülü-değil ArialMT, Identity-H,
   ToUnicode YOK** (`uni: no`). Metin ham glyph-ID; pdftotext standart Arial sırasıyla çözüyor,
   pdf-parse çözemeyip çöp veriyor (`pmlli`="SPOOL", `` `çåíáåìÉW ``="Continue:"). Çöp→doğru eşlemesi
   **38 giriş, SIFIR çatışma** → tamamen deterministik:
   - **Band-A (büyük harf + rakam):** tekdüze **+29** (`çöp - 29 = doğru`). glyph-onar **zaten yapıyor**.
   - **Band-B (küçük harf + Türkçe):** sabit lookup tablosu (~20 giriş, aritmetik değil ama birebir
     tutarlı). glyph-onar **yapmıyor** (l2-parser/izometri-oku satır 889: "Band B onarmaz"). **BOŞLUK BU.**

---

## Oturum 131 Kararları / Mühürlenen Bulgular

| # | Bulgu |
|---|---|
| B1 | AT110 montaj `_1.pdf` = gerçek montaj (Continue topoloji, Malzeme Listesi yok); imalat `_S01_1.pdf` = malzeme listeli spool. İçerik ayrımı kesin. |
| B2 | Tersan formatı (spool+montaj) zaten öğretilmiş ve kanıtlanmış (119/120). 130'un "Yol 2 öğret" çerçevesi geçersiz. |
| B3 | AT110 L3'e düşüyor çünkü **tanınmıyor**, parse yetersiz değil. Skor 1<2 (yalnız üretici sinyali). |
| B4 | Kök: gömülü-değil ArialMT Identity-H + ToUnicode yok → pdf-parse glyph çözemiyor. Fingerprint band-B çapaları (Continue:/Malzeme Listesi/Cut&Bending) kaymış metinde tutmuyor. |
| B5 | Çöp→doğru deterministik (38/0). Band-A=+29 (var), Band-B=sabit tablo (yok). **Fix = glyph-onar'a band-B tablosu.** Tek değişiklik tanıma + malzeme tablosu (NB1137 borcu) + montajı birden açar. izometri-oku.js'e dokunulmaz (MK-49.1 güvenli). Gömülü-değil ArialMT Identity-H her PDF'e genellenir. |
| B6 | 119/120 neden çalıştı: o 6 gemi **temiz** export'tu (pdf-parse okudu). AT110/NB1137 kaymış varyant. Tersan = temiz + kaymış iki alt-sınıf. |
| B7 | **K4 ÇÖZÜLDÜ:** ne Yol 2 ne Yol 1 — glyph band-B decode tablosu. |
| B8 | Dosya şişmesi planı (Aşama 3 → paketler DB'ye, tek kaynak DB) DURUYOR (format-paketleri.js + MK-119.2). Şu an Aşama 1 (tek tersane). Tetik: 2. tersane formatı. Tersan tuning'i bitene kadar kod tarafında kal. |

---

## CI Son Durum

- HEAD `bbf0626` (130 doc, `[skip ci]`). Bu oturumda da **kod push yok** — sadece doküman.
- Function sayısı: **12/12** (Hobby tavanı; api/ değişmedi).

---

## 132'e Açık Borç (önceliğe göre)

1. **Glyph band-B decode tablosu (B5 — baş iş):** `lib/glyph-onar.js`'e band-B lookup tablosunu ekle
   (gated, deterministik). Önce a-z + Türkçe (ç,ğ,ı,ö,ş,ü) tabloyu tamamla (AT110+M100 PDF'lerinden,
   font-seviyesi — over-fit değil). Dry-run: AT110 montaj+imalat → tanınıyor mu (skor ≥2) + parse
   ediyor mu. **Bulk doğrular:** gelen gemilerin kaçı bu font sınıfında.
2. **K1+K3 — bindirme_flag UI:** v3 İnceleme 🟡 + düzelt popup. Function tavanı bağımlı.
3. **K2 — malzeme listesi kıyası:** Excel BOM × PDF malzeme_listesi diff. İnceleme UI sonrası.
4. **MK-61.4 + doc:** PARSER-VE-YUKLEME-AKISI.md **Bölüm 7.3 EKLENDİ (131, bu push'ta)** + Bölüm 8 K4
   mührü. Kalan: BRIEFING bilgi haritası satırı + 131 MK adaylarını (131.1-131.4) KARARLAR'a işle.
5. **K5 — function konsolidasyon planı:** Katman 3 endpoint öncesi kuyruk-isle-* tek router.
6. **v3 İnceleme & Onay giydirmesi (büyük, çok-oturumluk):** mockup v5 → v3, okuma endpoint (MK-127.3).
7. **Taşınanlar:** 117 (`yukleyen_id`), web-spool sync, fitting (DIN 86087/ASME B16.9),
   `spool_dokumanlari` bağ tablosu, "fazla" UX.

---

## Push Paketi

| Dosya | Repo yolu | Tür |
|-------|-----------|-----|
| son-durum.md | `.github/son-durum.md` | doc |
| CLAUDE-SON-OTURUM.md | `CLAUDE-SON-OTURUM.md` | doc |
| CLAUDE-SONRAKI-OTURUM.md | `CLAUDE-SONRAKI-OTURUM.md` | doc |
| PARSER-VE-YUKLEME-AKISI.md | `docs/PARSER-VE-YUKLEME-AKISI.md` | **doc (Bölüm 7.3 + 8 K4 mührü, 131)** |

Hepsi doc → commit `[skip ci]` ile gidebilir. (Bölüm 7.3 + Bölüm 8 K4 mührü 131'de işlendi.)

---

> 132 açılışında: `son-durum.md` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` +
> PARSER-VE-YUKLEME-AKISI Bölüm 7 + omurga v3.1 okunur. İlk iş: **glyph band-B decode tablosu**
> (glyph-onar.js), dry-run AT110, sonra bulk.
