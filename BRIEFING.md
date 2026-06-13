# BRIEFING.md — AresPipe (proje bağlam dökümanı)

## Ne
AresPipe = tersane boru spool yönetimi için çok-tenant'lı SaaS. İzometrik PDF çizimleri,
Excel BOM ve mühendislik dökümanlarını işleyip yapısal imalat verisi çıkarır.

## Stack
- Supabase/PostgreSQL (RLS) · Vercel serverless (Hobby, **12 fonksiyon tavanı — MK-129.3**)
- Vanilla JS/HTML çok-sayfalı web frontend · React Native mobil PWA (`arespipe-mob`)
- Repo: `github.com/cihatoztas-ai/arespipe` · Prod: `arespipe.vercel.app`
- Tüm iş Türkçe. Cihat tek geliştirici + ürün sahibi (terse, A/B/C kararlar, terminal çıktısı yapıştırarak onay, görsel karşılaştırma sever).

## Mimari ilkeler
- Excel = spool kimliğinin tek doğruluk kaynağı; PDF üstüne biner.
- L2 deterministik parse ($0) tercih; L3 Vision AI (~$0.03–0.05/çağrı) yalnız fallback / spool-bölme.
- Veri silinmez; `iptal`/`silindi` status + audit notu.
- Server-to-server Vercel çağrısı YOK (MK-113/A); kuyruk drenajı client-loop orkestrasyon.

## Disiplin
- Şema-önce SQL (MK-85.3), yazmadan-önce-oku (MK-126.8), `izometri-oku.js` dokunulmaz (MK-49.1).
- HTML değişiklikleri: idempotent Python patch + `.bak` + `node --check` (çıkarılan JS üzerinde) + MD5'li `arespipe_kopyala` + ayrı küçük commit'ler.
- Git: `gpc "mesaj"` (add+commit+rebase+push). `[skip ci]` token'ı HEAD commit'te tüm push'ta CI'yı atlar (MK-134.1) → kod commit'leri HEAD olmalı.
- Açılış ritüeli: `git pull && git status && git log --oneline -3` + fonksiyon 12/12 + handoff oku.

## Marka kimliği (Oturum 179'da yerleşti)
- Amblem: 4-delikli flanş halkası + boru çubuğu + yeşil merkez. Yatay logo: amblem + "AresPipe" (Ares koyu, Pipe mavi `--ac`).
- `assets/marka/`: amblem, yatay logo açık/koyu, favicon SVG+16/32, icon-180/512/1024.
- Kod helper'ları (ares-layout.js, global): `aresBelgeBasligi(o)` (belge anteti), `aresLogoPrint(h)` (print logosu), `aresFirmaLogo(h)` (tenant firma logosu/adı), `aresRefreshLogo` (menü canlı yenileme).
- Renk bağlamı (MK): print = sabit (ring #16202B, Pipe #2D6CDF); menü/hata = tema-uyumlu (`--sb-tx`/`--tx`, `--ac`).
- Tenant logoları: `ares_logo_firma` (firma, antette) + `ares_logo_ares` (white-label menü), ayarlar Logo Yönetimi'nden base64.

## Şu anki odak
PAOR/AVEVA L3 spool-bölme entegrasyonu (Oturum 181–182). PAOR = ayrı hat değil, Tersan ile aynı kabuk→incele→terfi hattından geçen farklı tersane/format (katmanlı kural: evrensel < aile < format < gemi). Matcher fix + wizard L3 aktivasyonu canlıda (`3ec8f4e`); **toplu canlı test + #2b** (gerçek S02/S03: kabuk genişletme + `pipeline_malzemeleri`) sırada. Detay: CLAUDE-SONRAKI-OTURUM.md.
