# BRIEFING — AresPipe Aktif Bağlam (186 sonu)

## Proje
Çok-tenant tersane pipe spool yönetimi SaaS. Stack: Supabase/Postgres (RLS), Vercel serverless (Hobby, 12 fn tavanı), vanilla JS/HTML web + React Native PWA. Tüm iş Türkçe, MK-kararları + numaralı oturum disiplini.

## Format durumu — Tersan (L2+L3) + PAOR (L3) CANLI
- **Tersan:** Cadmatic, L2 deterministik parser (format-paketleri katman 0-3) + L3 fallback.
- **PAOR/AVEVA:** uçtan uca canlı. Excel BOM (lib/paor.js) + fab PDF (-A.pdf, text'siz vektör, L3) + Isometric_View. spooller.cizim_no köprüsü (184).

## 186'da yapılanlar (185.3 prompt+cache mimari borcu KAPANDI)
- **MK-186.1 (332827e):** prompt override→KOMPOZİSYON. lib/prompt-birlestirici.js (EVRENSEL_PROMPT + format.prompt_ek). PAOR prompt_ek BOŞ. Step 7: ölü YAKLASIM_Y_PROMPT silindi, mig108 prompt_template geri al.
- **MK-186.2:** temperature 0 (varyans bitti).
- **MK-186.3 (543711d):** SPOOL kutusu zoom kırpımı → L3 2. görsel. Eksik-sayım KÖK çözümü (çözünürlük, prompt değil). 780→3, yeni set 10/10.
- **MK-186.4 (ad45644):** cache sürümleme (istek_surum). Köstebek kalıcı bitti (13/13 l3_odeme=1). Manuel invalidate dansı yok.

## Mimari ilkeler
- **Tersan kırmızı çizgisi:** her PAOR müdahalesi format_id/scope ile izole, kanıtla. malzeme-kiyas.js/ares-kabuk.js/paor.js DOKUNULMAZ. izometri-oku INCE (prompt mantığı lib'de — MK-49.1 esnetme).
- **Prompt = KOMPOZİSYON:** EVRENSEL_PROMPT (çekirdek, spool-sayma güçlü madde-3 burada) + format.prompt_ek (kısa, format-özel). Yeni format = kısa ek. Evrensel düzeltme tüm formatlara yayılır. prompt_template ARTIK KULLANILMAZ (mig108 NULL'ladı, MK-155.1).
- **Cache = sürümlü:** anahtar pdf_sha256+format_id+tenant_id+basarili **+ istek_surum** (=sha256 PARSE_SURUM|model|prompt|crop). Prompt/crop değişince otomatik MISS. Eski NULL → MISS (temiz tazeleme). Manuel invalidate GEREKMEZ.
- **SPOOL sayma = crop-destekli:** drain pdf.js ile SPOOL kolonunu kırpar (spool_kirpim_b64) → L3 2. görsel + KIRPIM_TALIMATI. Çözünürlük modelin kaçırmasını çözer. Tek çağrı, 12/12 korunur.
- **Spool kimliği:** PAOR pozisyon (idx→S0n). cizim_no || pipeline_no eşleştirme anahtarı.

## Kritik kurallar
- L3 AÇIK + TAZE devre + hard-refresh (MK-183.2). Devre-scoped SQL (MK-163.1). **Migration APPLY→kod deploy + repo commit AYRI (MK-184.5).** information_schema kolon doğrula (MK-85.3). BEGIN/ROLLBACK dry-run (MK-98.2). DATA→UI→kod (MK-158.1), kanıt=server verisi (MK-162.3).

## Anahtar dosyalar
- lib/prompt-birlestirici.js (EVRENSEL_PROMPT + promptBirlestir — 186, prompt TEK KAYNAK)
- ares-izometri-drenaj.js (_spoolKirpim crop — 186; client-loop drenaj)
- api/izometri-oku.js (cacheKontrol + istek_surum + KIRPIM_TALIMATI/PARSE_SURUM — 186; YAKLASIM_Y_PROMPT SİLİNDİ; prompt mantığı YOK, lib'de)
- lib/izo-eslesme.js, api/kuyruk-isle-izometri.js, ares-kabuk.js, api/devre-inceleme.js, devre_wizard_v3.html (PAOR çekirdek)
- migrations 106/107/108 (186)

## Açık borçlar
Spool-sayım sertleştirme (emniyet ağı/sessiz-fallback alarmı/çok-spool testi/_SPOOL_KIRP ayarı) · B-tam BOM per-spool · format_id=null 251 cache envanteri · 184 carry (184.1/184.2/184.4) · PAOR veri-kalite (agirlik/et/D-182.2 = "Zayıf" rozetleri, sayım değil) · NPS→mm (Tersan Faz2) · devre_detay kapsam çip (185 carry).

## Repo / DB
- Repo github.com/cihatoztas-ai/arespipe @ ~/Desktop/arespipe. Prod arespipe.vercel.app.
- Supabase ochvbepfiatzvyknkvsn. SQL Editor wrapper'sız. arespipe_kopyala <src> <dst> <md5>. gpc=add+commit+rebase+push.
- Migration son: 108. APPLY canlıya elle + dosya repo commit (ayrı iş, MK-184.5).
