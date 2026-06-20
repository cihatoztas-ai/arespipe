# BRIEFING — AresPipe Aktif Bağlam (195 sonu)

## Proje
Çok-tenant tersane pipe spool yönetimi SaaS. Stack: Supabase/Postgres (RLS), Vercel serverless (Hobby, 12 fn tavanı), vanilla JS/HTML web + React Native PWA. Tüm iş Türkçe, MK-kararları + numaralı oturum disiplini.

## 195 kapanışı — KÜTÜPHANE tee_red (A10.6 #1 KAPANDI)
- **Seed:** ASME B16.9 reducing tee 4 satır (paslanmaz DN150×100 + karbon DN200×150/DN100×65/DN80×50). `fitting_olculer` 956 → **960**. C=run / M=outlet merkez-uç, iki-kaynak çapraz doğrulama (piping-world+ferrobend). `scripts/seed-data/195-tee-red-asme.json` (commit `dd3541b`).
- **Backfill:** `spool_malzemeleri.fitting_olculer_id` iki-çap + grup eşleşmesi, `WHERE IS NULL`, **+31 BOM bağı** (10/10/10/1). Canlı teyit geçti (NB1124 / A-001301).
- **Açık (taşındı):** (1) cunife reducing tee matcher'da tee_eq görünüyor — tanımda "reducing" yok (`lib/malzeme-kutuphane-eslesme.js:97`), 1 satır. (2) matcher tee lookup `cap_kucuk` süzmüyor (`:98`) — latent. (3) Kalan A10.6: paslanmaz reducer seed; paslanmaz flanş seed + `flansh_olculer` UNIQUE constraint DDL (Supabase SQL editör — REST yetmez).

## Format durumu — Tersan (L2+L3) + PAOR (L3) CANLI
- **Tersan:** Cadmatic, L2 deterministik (format-paketleri katman 0-3) + L3 fallback.
- **PAOR/AVEVA:** uçtan uca canlı. Excel BOM (lib/paor.js → `pipeline_malzemeleri`, pipeline-seviyesi) + fab PDF (-A.pdf, L3 vision) + Isometric_View. Spool sayısı PDF-pozisyon'dan (devre-inceleme.js:148, idx→S0n). spooller.cizim_no köprüsü.

## 187'de yapılanlar — SPOOL SAYIM EMNİYETİ (B + A1 + A2)
- **MK-187.1 (B, 1afe670):** Sessiz-fallback emniyet ağı. crop yok (`!spool_kirpim_b64`, vision) + `spool_kaynak='pozisyon'` (PAOR) → çizim `manuel_onay`'a ("gözle say"). izometri-oku `_sayim_kirpimsiz` taşır; kuyruk-isle-izometri escalate eder. Tersan/Excel-listeli (kaynak≠pozisyon) ETKİLENMEZ.
- **MK-187.2 (A1, 87dc444):** PAOR çizim-başı SPOOL göz-onayı (Dökümanlar sekmesi). Kırpılan SPOOL kutusu thumbnail (istemcide `_spoolKirpim` YENİDEN üretir = deterministik, $0 depolama, geriye-dönük) + "PDF'ten N spool" + S0n markaları. `_spoolKirpim` drain'de expose edildi (MK-109.1).
- **MK-187.3 (A2 dilim-1, c93d66e):** PAOR spool sayısı operator override. A1 panelinde "Gerçek spool sayısı" girişi → sentetik `fazla` üret → MEVCUT `_paorBolShell` motoru (184/A) → `inceleGetir`. Terfi-öncesi katman (`WIZ._kabukSpoollar`), kabuk mutasyonu yok.
- **MK-187.4 (A2 fix, 0e50dd3):** Override BUG düzeltme — katlanma (7 yazınca kabuk şişiyordu). İdempotent "N'e AYARLA" (yukarı ekle/aşağı çıkar), `inceleGetir(bolAtla)` re-expansion atlar, panel guard kaldırıldı + panel kabuk-gerçeğini gösterir ("Düzeltildi → kabukta M").

## Mimari ilkeler (187 eklentileri)
- **Spool sayım emniyeti = 2 katman:** B (otomatik, sessiz-fail → manuel_onay) + A1 (görsel çetele, gözle teyit). İkisi de YALNIZ PAOR (spool_kaynak='pozisyon' / `-PAOR-` deseni). Tersan kırmızı çizgisi korunur.
- **Override = idempotent SET:** operatör N yazar → kabuk tam N olur (artır=ekle, azalt=çıkar). Tekrar bassa katlanmaz. `inceleGetir(true)` ile re-expansion atlanır.
- **1→N genişleme MEVCUT (184/A, MK-182.6):** `_paorBolShell` PDF fazla'sını boş shell olarak enjekte. Override sentetik fazla ile aynı motoru kullanır.
- **PAOR Excel'de spool ayrımı YOK (kanıtlı):** her BOM Excel `farkli_spool=1` (hepsi S01); `pipeline_malzemeleri` pipeline-seviyesi. Spool sayısı yalnız PDF'ten.

## Kritik kurallar
L3 AÇIK + TAZE devre + hard-refresh (MK-183.2). Devre-scoped SQL (MK-163.1). Migration APPLY→deploy+repo AYRI (MK-184.5). information_schema kolon doğrula (MK-85.3). BEGIN/ROLLBACK dry-run (MK-98.2). DATA→UI→kod (MK-158.1), kanıt=server verisi (MK-162.3). HTML patch = anchor-doğrulamalı Python + .bak + MD5 (MK-172.6).

## Anahtar dosyalar
- api/izometri-oku.js (`_sayim_kirpimsiz` — B; cache/prompt plumbing — 186)
- api/kuyruk-isle-izometri.js (durum kararı: B escalation, spool_kaynak='pozisyon')
- ares-izometri-drenaj.js (`_spoolKirpim` expose — A1; `_SPOOL_KIRP` crop)
- devre_wizard_v3.html (A1 göz-onayı paneli `_gozOnayiRender` + A2 override `_a2SayiYukselt`; `_paorBolShell` 184/A; `inceleGetir(bolAtla)`)
- api/devre-inceleme.js (4-durum eşleştirme `pipeline|spoolNo`; spool N üretimi :148)
- ares-kabuk.js (`grupla`/`aktar` — terfi yazımı; idempotent)
- lib/paor.js (PAOR Excel → pipeline_malzemeleri)

## Açık borçlar (öncelikli → A2-dilim2)
- **A2-dilim2 (SIRADAKİ ASIL):** Override ile eklenen spool "Eksik/döküman yok" alıyor → YANLIŞ. Kök sebep: eşleştirme `pipeline|spoolNo`, izometri tarafında eklenen spoolNo yok. ÇÖZÜM: `_paorBolShell` shell'i kardeş S01'in `is_id`/`dosya_adi`'sini devralsın → aynı-PDF spool'u olsun; devre-inceleme durum + **sıralama** (S01→S02→S03 ardışık) bunu yansıtsın.
- shell malzeme devralma (MK-182.5: S0n, S01'in pipeline malzemesini paylaşsın — şu an "—" boş).
- A2 aşağı-düzeltme: PDF'ten az yazınca kalanlar `fazla` render olur (honest ama UI'da netleştir).
- `b4af5c2b` gibi cizim_no=null devrelerde override (sibling eşleşmezse toast verir, genişlemez).
- 186 carry: crop sertleştirme (çok-spool ucu), format_id=null cache envanteri, NPS→mm (Tersan Faz2).

## Repo / DB
- Repo github.com/cihatoztas-ai/arespipe @ ~/Desktop/arespipe. Prod arespipe.vercel.app. Supabase ochvbepfiatzvyknkvsn.
- Migration son: 108 (187'de yeni migration YOK). Fonksiyon 12/12. gpc=add+commit+rebase+push. arespipe_kopyala <src> <dst> <md5>.
