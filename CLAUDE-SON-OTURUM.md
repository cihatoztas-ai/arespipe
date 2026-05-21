# CLAUDE-SON-OTURUM — Oturum 105 (21 May 2026)

## Tema
"Küçük temizlik" açıldı; İş 1 canlıya alındı, İş 2 ölçümle B-geometri Faz 1'e dönüştü ve Faz 1
tamamlandı (Tersan İmalat L2 parser_kural). PAOR ana çizim feasibility kapatıldı (MK-105.6).

## İş 1 — iso_view parse-dışı (CANLI, f45ceae)
Ölçüm: `paor_aveva_iso_view` ai_api_log'da YOK → boşa para $0; İş 1 ÖNLEYİCİ. Tasarım A/B → B
('saklama' yeni durum; metrik kirliliği yok, 080 ile tutarlı). Tespit = format-flag (parse_disi, DB-driven),
hardcode regex değil. Migration 086 (parse_disi + 'saklama' durum, DROP+ADD, dry-run sonrası kalıcı).
kuyruk-isle.js worker filtresi + kuyruk-durum.js + izometri-batch.html UI. izometri-oku'ya DOKUNULMADI.

## B-geometri Faz 1 — Tersan İmalat L2 (DB CANLI, commit BEKLİYOR)
### Süreç
- lib/l2-parser.js = jenerik regex_text parser. **Server pdf-parse** (jammed metin) kullanıyor →
  regex'ler ona göre. Kod değişmedi.
- 1 örnekteki taslak regex'ler 7 yeni örnekte kırıldı (SCH/inç boyut, CuNi/316L, ağırlıksız satırlar,
  kesik pipeline) → **MK-51.2 doğrulandı.** 8 örneğe karşı kapsamlı kural yazıldı.
- 7 satır tipi (boru-mm, boru-SCH, groove, kaynak, Ic Bilezik, Dirsek, Flanş) × ST37/316L/AISI/CuNi/St.St/St*.
  Türkçe karakter yok (tetikleyici ASCII, tanım `.+?`).
- **8/8, 0 ham** (7 detay tam + 1 montaj doğru red). Lokal harness = test düzeneği.

### Deploy
- **Migration 087:** dollar-quote (`$pk$…$pk$::jsonb`) parser_kural, **HER İKİ Tersan formatına**
  (MK-105.4 = A; tie-break-proof). DB uygulandı, teyit 2 satır / satir_tipi=7.
- **test/** 3 dosya: l2-tersan-kural.json (ayna), l2-tersan-fixtures.json (9 örnek, gerçek metin → MK-48.6
  commit/gitignore Cihat kararı), l2-tersan-test.mjs (9/9, repo lib'e karşı). CI'a bağlı değil.
- pipeline_no parser'dan çıkarıldı (metin kesik) → dosya adından downstream (106).

## PAOR ana çizim — L2 imkânsız (MK-105.6)
6 ana çizim: pdf-parse ~boş, pdftotext 1 char, pdffonts 0 font → metin katmanı yok (vektör/raster).
Deterministik L2 mümkün değil; vision L3 zorunlu. $0.62 kaçınılmaz. iso_view = saklama (İş 1).

## MK (105)
MK-105.1 (parse_disi bayrağı), MK-105.2 ('saklama' terminal), MK-105.3 (ölç-sonra/pdf-parse gerçeği),
MK-105.4 (Tersan fingerprint ayrışmaz → kural her iki formata), MK-105.5 (montaj=yerleşim, detay=yon_dizilim),
**MK-105.6 (PAOR ana çizim metinsiz → L2 imkânsız, L3 zorunlu)**. + MK-51.2 uygulandı.

## Commit'ler (105)
| Hash | Mesaj |
|------|-------|
| f45ceae | feat(105): iso_view parse-disi saklama — worker filtresi + 086 migration + batch UI |
| (bekliyor) | feat(105): tersan imalat L2 parser_kural + regresyon testi (087 + test/) |
| (bekliyor) | docs(105): kapanis [skip ci] |

## 106'ya devreden (öncelik sırası)
1. **Canlı teyit:** yeni Tersan İmalat PDF → ai_api_log parser_seviye='l2', maliyet=0 (105'te yapılmadıysa ilk iş).
2. **B-geometri Faz 2/3:** yon_dizilim (detay) + yerleşim/AR (montaj) — lib/l2-parser.js KOD genişletme.
3. pipeline_no dosya adından; düzgün fingerprint ayrımı (S-segmenti var/yok); çift-parse teyidi.
4. B-öğrenme (MK-48.5): düzeltme → parser_kural otomatik geri-yazma.

> 106 açılışında oku: son-durum.md + bu dosya + CLAUDE-SONRAKI-OTURUM.md + docs/MK-B-GEOMETRI.md.
