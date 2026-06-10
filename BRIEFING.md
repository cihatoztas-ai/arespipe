# AresPipe — BRIEFING (Oturum 175 girişi)

**Proje:** Vardiya/tersane pipe spool yönetimi SaaS. Tek geliştirici: Cihat. Tüm çalışma Türkçe.
**Repo:** github.com/cihatoztas-ai/arespipe · **Prod:** arespipe.vercel.app
**Stack:** Supabase/PostgreSQL (RLS), Vercel serverless (Hobby — 12 fonksiyon tavanı, MK-129.3), vanilla JS/HTML web, React Native PWA (`arespipe-mob`).

## Mimari prensipler
- **Excel = kimlik kaynağı** (hangi spool); **PDF/izometri üstüne biner**; diğer belgeler sonra. Katman katman → tek ortam (gerçek imalat simülasyonu: bir kaynakta yoksa diğerinden tamamla).
- L2 deterministik parse ($0) tercih; L3 Vision AI ($~0.03) yalnız fallback.
- Veri silinmez; status `iptal`/`silindi` + audit.
- Server-to-server Vercel çağrısı yok (MK-113/A); drenaj client-loop.

## Değişmez kurallar
- `izometri-oku.js` dokunulmaz (MK-49.1). Şema-önce (MK-85.3). Oku-sonra-yaz (MK-126.8).
- Tanı sırası DATA(SQL)→UI→code (MK-158.1); canlı-pipeline (MK-132.1).
- HTML cerrahisi = Python str_replace + abort-on-mismatch + `.bak` + `node --check` (inline JS) + brace dengesi.
- Push: tek başına `gpc "mesaj"` VEYA `git commit` sonra `gp` (karıştırma). Kod commit'i `[skip ci]` YOK.
- **MK-134.1/119.5:** çoklu-commit push'ta GitHub HEAD commit'ine bakar → HEAD `[skip ci]` ise TÜM push CI'sı atlanır. **Kod commit'leri ayrı/önce push'lanır; doc commit'i `[skip ci]` ile sonra.**

## Araçlar
- `arespipe_kopyala <kaynak> <hedef> <md5>` (3 argüman zorunlu).
- `gp` (fetch+rebase+push) · `gpc "msg"` (add+commit+rebase+push).
- `lib/excel-parser.js` (BOM parse; `seviye` L1/L2 + `guven`), `lib/l2-parser.js`, `lib/format-paketleri.js` (AILE_KAYIT), `lib/izo-eslesme.js` (4-durum), `lib/bindir.js` (Excel↔PDF alan kıyas/overlay), `lib/glyph-onar.js`.
- `ares-kabuk.js` (ARES_KABUK.grupla/aktar — paylaşılan), `ares-izometri-drenaj.js`, `ares-olcu.js`.
- `docs/KARARLAR.md` (karar günlüğü) · `docs/WIZARD-YOL-HARITASI.md`.
