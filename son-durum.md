# AresPipe — Güncel Durum (son güncelleme: Oturum 105, 21 May 2026)

## Bu oturumda yapılanlar (105)

105 "küçük temizlik" açıldı, ama İş 2 ölçüm sonrası **B-geometri Faz 1'e** dönüştü ve Faz 1 bu
oturumda tamamlandı. Üç sonuç: İş 1 (CANLI), Tersan İmalat L2 parser_kural (DB CANLI, commit bekliyor),
PAOR ana çizim feasibility bulgusu (MK-105.6). Scope ortada büyütülmedi; B-geometri planlıydı.

### İş 1 — PAOR isometric_view parse-dışı, saklama (CANLI, commit f45ceae)
104 varsayımı (iso_view L3'e gidip para yakıyor) ölçümle çürütüldü: `ai_api_log`'da
`paor_aveva_iso_view` satırı YOK → iso_view hiç yüklenmemiş, boşa para $0. İş 1 ÖNLEYİCİ
(format requires_ai=true; ileride PAOR çiftinde her iso_view ~$0.03 yakardı). Fix:
- **Migration 086:** `izometri_format_tanimlari.parse_disi BOOLEAN` + iso_view=true +
  `is_kuyrugu.durum`'a `saklama` (DROP+ADD idempotent).
- **api/kuyruk-isle.js:** parse_disi formatları çek; dosya adı `fingerprint.dosya_adi_regex` ile
  eşleşeni L3'e göndermeden `durum='saklama'` yap. izometri-oku.js'e DOKUNULMADI (MK-49.1).
- **api/kuyruk-durum.js / izometri-batch.html:** 'saklama' kovası + "📦 Saklandı" UI.

### B-geometri Faz 1 — Tersan İmalat L2 parser_kural (DB CANLI, repo commit BEKLİYOR)
İş 2 ölçümü: 7 Montaj L3 çağrısının hepsi spool_sayisi=1 → gerçek spool çıkıyor, parse_disi ile
atlamak veri kaybı olurdu. Cihat B-geometri'ye, Faz 1'den başlanmasını seçti. Yapılan:
- **lib/l2-parser.js** jenerik config-parser; **server pdf-parse kullanıyor** (jammed/boşluksuz metin),
  pdftotext değil → regex'ler pdf-parse çıktısına göre yazıldı. Kod değişmedi (sadece config).
- **8 gerçek Tersan İmalat örneğine karşı (MK-51.2)** kapsamlı parser_kural yazıldı:
  - **Alanlar:** spool_no, agirlik_kg, yuzey (Galvaniz/Paslanmaz/CUNIFE/Siyah/Asit/Boyali), tarih,
    cap_mm + et_mm (ana borudan).
  - **7 satır tipi:** boru-mm (`ODxet`), boru-SCH (`5" Sch 10S`), groove (ağırlıksız/0.2),
    kaynak (Çelik Alın Kaynağı, ağırlıksız), Ic Bilezik, Dirsek, Flanş.
  - **Malzeme aileleri:** ST37, 316L, AISI 316L, CuNi10Fe1. (pdf-parse kesik), St.St, St*.
  - **Türkçe karakter YOK** (SQL Unicode riski; tanım `.+?`, tetikleyiciler ASCII, ör. `Al.n Kayna`).
- **SONUÇ: 8/8, 0 ham** — 7 detay tam parse (spool alanları + malzeme listesi), 1 montaj sayfası
  doğru reddedildi (malzeme yok → ok=false → L3 fallback).
- **Migration 087:** `UPDATE … parser_kural = $pk$<JSON>$pk$::jsonb` (dollar-quote, escape derdi yok),
  **HER İKİ Tersan formatına** (`tersan_cadmatic_spool` + `tersan_cadmatic_isometry`) — MK-105.4 (A).
  **DB'ye uygulandı, teyit: 2 satır, satir_tipi=7.**
- **test/** (regresyon): `l2-tersan-kural.json` (parser_kural ayna kopya), `l2-tersan-fixtures.json`
  (9 örnek, pdf-parse metin + beklenen — **gerçek çizim metni, MK-48.6**), `l2-tersan-test.mjs`
  (`node test/l2-tersan-test.mjs` → 9/9, repodaki lib/l2-parser.js'e karşı). CI'a bağlı değil.
- pipeline_no parser'dan ÇIKARILDI (pdf-parse metni kesiyor: `-Suc`, `-Penetra`) → dosya adından
  downstream gelecek (106 mimari).

### PAOR ana çizim — L2 imkânsız (MK-105.6)
6 PAOR ana çizim: pdf-parse 2-6 karakter (boş), pdftotext 1 karakter, pdffonts 0 gömülü font →
**metin katmanı yok** (malzeme listesi dahil her şey vektör/raster, AVEVA CAD). Hiçbir metin-çıkarıcı
okuyamaz → **deterministik L2 imkânsız, vision (L3) zorunlu.** $0.62 ana çizim L3 gideri kaçınılmaz.
Tersan'dan temelde farklı (Tersan'da gerçek metin katmanı vardı). 104'teki "metni dolu" notu
yanıltıcıymış (platform render+OCR'ı, server pdf-parse'ı değil).

## Mimari kararlar (105)
- **MK-105.1** — Format-bazlı parse_disi bayrağı (image/overview format tek SQL ile L3-dışı).
- **MK-105.2** — 'saklama' terminal durum (metrik kirliliği önler, 080 ile tutarlı).
- **MK-105.3** — Ölç-sonra-karar / görmeden yazma (İş 1 $0 çıktı; pdf-parse gerçeği pdftotext değil).
- **MK-105.4** — Tersan Montaj/İmalat fingerprint G200 için ayrışmaz → parser_kural HER İKİ formata
  (tie-break-proof: detay→L2 $0; montaj→L2 fail→L3 fallback). Düzgün ayrım 106.
- **MK-105.5** — Montaj sayfası = AR/3D yerleşim verisi; detay sayfası = yon_dizilim.
- **MK-105.6** — PAOR ana çizim metin katmanı yok (0 gömülü font) → L2 imkânsız, L3 zorunlu.
- (**MK-51.2** uygulandı: 5+ örneğe karşı doğrulamadan genelleme yapma — 1 örnekteki regex'ler 7
  örneğin çoğunda kırılmıştı; 8 örnekle kapsamlı kural çıktı.)

## Maliyet tablosu (105 sonrası beklenen)
- Tersan İmalat detay → **$0** (L2 deterministik, yeni yüklemeler; cache'li eskiler L3 sonucunu döndürür).
- Tersan Montaj → L3 (geometri 106'ya kadar).
- PAOR iso_view → saklama (L3 yakmaz).
- PAOR ana çizim → **L3 kalıcı ($0.62)**, vision zorunlu (MK-105.6).

## Önemli kalıcı hatırlatmalar
- **izometri-oku.js'e DOKUNMA** (MK-49.1). Maliyet/öğrenme/geometri = dispatch/worker/parser_kural tarafı.
- **İzometri batch = SADECE Excel** (MK-104.1).
- parser_kural değişirse **DB + test/l2-tersan-kural.json İKİSİ** güncellenir (senkron).
- Kuralın yeri: DB (`izometri_format_tanimlari.parser_kural`, runtime gerçeği); migration = tohum kaydı;
  lib/l2-parser.js = jenerik motor (tek kopya). "Her format ayrı tutulur" = her formatın kendi DB satırı.
