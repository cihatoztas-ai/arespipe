# BRIEFING — AresPipe Aktif Bağlam (185 sonu)

## Proje
Çok-tenant tersane pipe spool yönetimi SaaS. Stack: Supabase/Postgres (RLS), Vercel serverless (Hobby, 12 fn tavanı), vanilla JS/HTML web + React Native PWA. Tüm iş Türkçe, MK-kararları + numaralı oturum disiplini.

## Format durumu — Tersan (L2+L3) + PAOR (L3) CANLI
- **Tersan:** Cadmatic, L2 deterministik parser (format-paketleri katman 0-3) + L3 fallback.
- **PAOR/AVEVA:** uçtan uca canlı (yükle→incele→terfi→izometri bağla). Excel BOM (lib/paor.js) + fab PDF (-A.pdf, text'siz vektör, L3) + Isometric_View. spooller.cizim_no köprüsü (184).

## 185'te yapılanlar
- **MK-185.1 (PUSH f7936ff):** kapsam-etiketli malzeme görünümü. spool_detay'da imalat/montaj/işlem çip + rozet. ares-normalize.kapsamEtiket global helper. Veri silinmez, filtrelenir. Tersan'a sıfır risk.
- **MK-185.2 (migration 105, CANLI):** PAOR L3 spool-sayma prompt fix. Varsayılan prompt "[1][2]=2" örneğine şartlıydı, 3-spool (782) kaçıyordu. paor_aveva_ana prompt_template güçlendirildi (2/3/4/5+ örnek). 773/782→3 spool kanıtlı. GEÇİCİ override (186 kompozisyona taşır).
- **MK-185.3 (SPEC → 186):** prompt+cache mimarisi. docs/186-PROMPT-CACHE-MIMARI-SPEC.md.

## 186 ANA İŞ
docs/186-PROMPT-CACHE-MIMARI-SPEC.md — prompt override→kompozisyon + cache prompt-sürümü. Detay: CLAUDE-SONRAKI-OTURUM.md.

## Mimari ilkeler
- **Tersan kırmızı çizgisi:** her PAOR müdahalesi format_id/scope ile izole, DRY ile Tersan'a değmediği kanıtlanır. malzeme-kiyas.js/ares-kabuk.js/izometri-oku.js/paor.js DOKUNULMAZ (MK-49.1).
- **Kapsam etiketi ≠ kıyas kapsamı:** ares-normalize.kapsamEtiket (iş-akışı: flanş=imalat) FARKLI malzeme-kiyas.kapsam (PDF↔Excel kıyas: flanş=montaj beklentisi).
- **Spool kimliği:** PAOR pozisyon (idx→S0n), parse spool_no güvenilmez. cizim_no || pipeline_no eşleştirme anahtarı.
- **Cache:** pdf_sha256+format_id+tenant_id+basarili. Prompt sürümü YOK (186 ekleyecek). invalidate = basarili=false, format_id scoped.

## Kritik kurallar
- L3 AÇIK + TAZE devre + hard-refresh (MK-183.2). Devre-scoped SQL (MK-163.1). Migration APPLY→kod deploy (MK-184.5). information_schema ile kolon doğrula (MK-85.3). BEGIN/ROLLBACK dry-run (MK-98.2).

## Anahtar dosyalar
- ares-normalize.js (kapsamEtiket — 185)
- spool_detay.html (kapsam çip — 185)
- migrations/schema/105_paor_ana_prompt_spool_guclendir.sql (185, GEÇİCİ)
- docs/186-PROMPT-CACHE-MIMARI-SPEC.md (186 spec)
- lib/izo-eslesme.js, api/kuyruk-isle-izometri.js, ares-kabuk.js, api/devre-inceleme.js, devre_wizard_v3.html (PAOR çekirdek)
- api/izometri-oku.js (cacheKontrol:516, prompt:721, YAKLASIM_Y_PROMPT:957 — DOKUNULMAZ, 186'da MK-49.1 kararı)

## Açık borçlar
MK-185.3 prompt+cache mimarisi (186 ana iş) · devre_detay kapsam çip · B-tam BOM per-spool · format_id=null 251 cache envanteri · 184 carry (184.1/184.2/184.4) · PAOR veri-kalite (agirlik/et/kalite/D-182.2) · NPS→mm (Tersan Faz2).

## Repo / DB
- Repo github.com/cihatoztas-ai/arespipe @ ~/Desktop/arespipe. Prod arespipe.vercel.app.
- Supabase ochvbepfiatzvyknkvsn. SQL Editor wrapper'sız. arespipe_kopyala <src> <dst> <md5>. gpc=add+commit+rebase+push.
- Migration son: 105. APPLY canlıya elle + dosya commit (ayrı).
