# Son Durum — 132. Oturum (28 Mayıs 2026)

> 131 → 132 geçişi. **Teşhis düzeltme oturumu (kod yok, bilinçli).** 131'in glyph band-B
> tezi canlı kodla uçtan uca çalıştırılarak **çürütüldü.** Parse yolağı bugün tamamen
> sağlam: glyph onarımı (band-A+B) çalışıyor, tanıma çalışıyor, dispatch L2'ye giriyor,
> kaymış montaj PDF'i `montaj{}` üretiyor. 132'nin planlı "baş işi" (band-B tablosu)
> **konusuz.** Yapılacak glyph işi yok.

---

## Bu Oturumun Sonucu

131 bir teşhis oturumuydu ve **canlı yolağı hiç çalıştırmamıştı.** Bayat bir kod yorumuna
(`izometri-oku.js:889` "Band B onarmaz") + onarım-öncesi ham metne bakıp dört kez yanlış
sonuca vardı. 132'de gerçek E100 + M100 PDF'leri (montaj + imalat) gerçek `pdf-parse`,
gerçek `metinNormalle`, gerçek DB fingerprint'leri, gerçek `aileBirlestir` + `parse` ile
uçtan uca koşuldu. Sonuç tek: **kod doğru çalışıyor.**

### Dört turluk doğrulama (hepsi canlı kanıt)

1. **metinNormalle band-B'yi onarıyor mu?** → EVET. Kaymış E100 montaj+imalat ham
   pdf-parse çıktısına uygulandı: `SPOOL NAME`, `Malzeme Listesi`, `Cut & Bending Info`,
   `Continue:` çapaları + tam malzeme satırları kurtarıldı. **0 eşlenmeyen karakter.**
   (131'in "band-B tablosu yok" tezi yanlış; tablo 122'de eklenmiş, çalışıyor.)

2. **Tanıma onarılmış metni skorluyor mu?** → EVET. `pdfIpucuCikar` (642) `metinNormalle`
   çağırıp `normMetin`'i `ilk_sayfa_metni`'ne veriyor. Gerçek `fingerprintSkor`:
   - E100 montaj → `tersan_cadmatic_montaj` (skor 2: üretici+1, `Continue:`+1)
   - E100 imalat → `tersan_cadmatic_spool` (skor 3: üretici+1, Malzeme+1, Cut&Bending+1)
   - M100 montaj/imalat (temiz) → aynı şekilde tanınıyor.
   Producer=`Cadmatic`, Creator=`Piping Isometrics & Spools`. **Hepsi ≥2 → tanınıyor.**

3. **Dispatch L2'ye giriyor mu?** → EVET. DB `parser_kural` boş değil (`pk_bos=false`),
   kapı (215) geçiyor → `parserKuralIle`. `requires_ai` dispatch'te kullanılmıyor.

4. **Uçtan uca L2 ne üretiyor?** → Dördü de `parser_seviye=l2`, parse.ok=true:
   - E100 montaj (kaymış): montaj{} → pipe E100-817-005, spool[S01–S06], continue[Y100,
     M110], blok B1137, Paslanmaz.
   - E100 imalat (kaymış): spool S01, Paslanmaz, 5kg, 2 malzeme satırı.
   - M100 montaj (temiz): montaj{} → pipe M100-317-18-ALS, spool[S01], alıştırma=PARCA.
   - M100 imalat (temiz): spool S01, cap 168.3/et 4.5, 18.9kg, 7 malzeme satırı.

### ai_api_log + DB yer-gerçeği (teşhisi mühürledi)

- **SHA araması:** Bu 4 PDF'in canlı SHA256'ları ai_api_log'da arandı. Yalnız M100 imalat
  kaydı var (22 May, l2, spool üretti — doğru). E100'ler bu byte'larla hiç yüklenmemiş →
  bunlar **taze test örnekleri**, 130'un symptom'unu gören gerçek devre değil.
- **Format dağılımı:** Montaj Cizimi (genel) l2=30 (23 May→27 May), l3 yalnız 3 (23 May
  anlık). İmalat Resmi l2=95, l3 eski (1-9 May). Yani montaj/imalat **bugün L2 çalışıyor.**
- **"Montaj Resmi" şüphesi temizlendi:** `tersan_cadmatic_isometry` `aktif=false` (120'de
  emekli), üstelik fingerprint'i spool imzası (`Malzeme Listesi`+`Cut & Bending`) → montaja
  hiç eşleşmez. Suçlu değil; sadece yanlış adlı emekli kopya.
- **817-005 spool'ları DB'de yok** → symptom başka devrede (muhtemelen bayat veri).

---

## Mühürlenen Bulgular

| # | Bulgu |
|---|---|
| B1 | `metinNormalle` band-A + band-B yapar (122'den beri). Kaymış Cadmatic tam çözülüyor (0 eşlenmeyen). |
| B2 | Tanıma `normMetin` skorluyor (642). E100/M100 montaj+imalat tanınıyor (skor 2-3). |
| B3 | Dispatch L2'ye giriyor (`pk_bos=false`). `requires_ai` dispatch'te kullanılmıyor. |
| B4 | Uçtan uca: 4 PDF'in dördü de L2, montaj PDF'leri `montaj{}` üretiyor (kaymış E100 dahil). |
| B5 | **131'in 4 tezi de yanlış:** band-B yok (yanlış), E100 tanınmıyor (yanlış), tanıma onarmıyor (yanlış), dispatch atlıyor (yanlış). Kök: bayat 889 yorumu + canlı yolak koşulmadı. |
| B6 | 130'un montaj_json-null symptom'u = parse bug'ı DEĞİL. Kod doğru. Muhtemel sebep bayat veri (122 öncesi L3 parse). Çözüm: ilgili devrenin yeniden parse'ı; yeni kod değil. |
| B7 | "Montaj Resmi" (`tersan_cadmatic_isometry`) aktif=false, montaja eşleşmez → suçsuz. Yine de temizlik borcu (yanlış ad) açık. |

---

## CI Son Durum

- HEAD `2acef13` (131 doc). Bu oturumda da **kod push yok** — teşhis + doküman.
- Function: 12/12 (api/ değişmedi).

---

## 133'e Açık Borç (önceliğe göre)

1. **Hijyen (bu oturumda kararlaştırıldı, push'ta uygulanır):**
   - `izometri-oku.js:887-890` bayat yorum düzeltmesi (comment-only, sıfır mantık).
   - KARARLAR'a **MK-132.1** (canlı-yolak doğrulama disiplini) + **MK-132.2** (glyph band-B
     gerçeği). **131.1-131.4 YAZILMAYACAK** (yanlış teşhis).
   - PARSER-VE-YUKLEME-AKISI.md Bölüm 7.4 (132 düzeltmesi) — 7.3/8'in glyph tezini iptal eder.
2. **K2 — malzeme listesi kıyası:** Excel BOM × PDF `malzeme_listesi` diff. En self-contained
   gerçek iş. (133 baş iş adayı.)
3. **K1+K3 — bindirme_flag UI:** v3 İnceleme 🟡 + düzelt popup. Function tavanı bağımlı.
4. **(opsiyonel) Bayat-veri teyidi:** 130'un gerçek devresinde montaj_json null mı bak;
   gerekiyorsa backfill (re-parse). Kuvvetle muhtemel veri işi, kod değil.
5. **Taşınanlar:** "Montaj Resmi" emekli formatın silinmesi/yeniden adlandırılması,
   K5 function konsolidasyon, v3 giydirme, 117 (`yukleyen_id`), web-spool sync, fitting.

---

## Push Paketi

| Dosya | Repo yolu | Tür |
|-------|-----------|-----|
| son-durum.md | `.github/son-durum.md` | doc |
| CLAUDE-SON-OTURUM.md | `CLAUDE-SON-OTURUM.md` | doc |
| CLAUDE-SONRAKI-OTURUM.md | `CLAUDE-SONRAKI-OTURUM.md` | doc |
| (elle) izometri-oku.js | `api/izometri-oku.js` | **comment-only fix (887-890)** |
| (elle) KARARLAR.md | `KARARLAR.md` | MK-132.1 + MK-132.2 |
| (elle) PARSER-VE-YUKLEME-AKISI.md | `docs/...` | Bölüm 7.4 (132 düzeltmesi) |

Doc dosyaları `[skip ci]` ile gidebilir. izometri-oku.js comment-only ama CI tetikler (kod
yolu) — yorum değişiminin lint'i geçmesi beklenir.

---

> 133 açılışında: `son-durum.md` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` +
> PARSER Bölüm 7.4 okunur. **Glyph/tanıma konusu KAPALI.** İlk iş: K2 (malzeme listesi kıyası).
