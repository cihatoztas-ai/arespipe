# AresPipe BRIEFING — 199. Oturum Kapanışı

## Proje
Çok-tenant tersane pipe spool yönetimi SaaS. Stack: Supabase/Postgres (RLS), Vercel serverless (Hobby, 12 fn tavanı), vanilla JS/HTML web + React Native PWA. Tüm iş Türkçe, MK-kararları + numaralı oturum disiplini.

## 199 kapanışı — KALİTE KONTROL tasarımı (kod yok, spec + mockup)
- **Eksen değişti:** 199 kütüphane değil, ÜRETİM ZİNCİRİ işi. Kod değişmedi — salt-okuma keşif + tasarım dokümanı.
- **Bulgu:** kalite_kontrol.html durum-modeli DB constraint'iyle uyumsuz (`bekleyen` yazıyor, DB `bekliyor` bekliyor). Reconciliation 58-59'da sadece mobilde yapılmış, vanilla geride kalmış → davetler KK ekranına düşmüyordu ("kaliteye gönderiyorum görünmüyor"un kaynağı). Karar: sayfa yeniden yazılacak (MK-199.1).
- **KK mimarisi netleşti:** web omurga / mobil izleme (MK-199.2) · iki katman havuz+davetiye (MK-199.3) · tersane-tek guard (MK-199.4) · varsayılan-onay sonuç modeli + Faz 1 personel/foto/açıklama (MK-199.5) · client-side PDF + Storage (MK-199.6).
- **Çıktı:** `docs/KALITE-KONTROL-TASARIM.md` (tam kodlama spec) + `docs/kalite-kontrol-mockup.html`. Sonraki oturum (200) implementasyon.
- **Handoff hijyen (MK-199.7):** ayna sapması temizlendi — kök `son-durum.md` + `CLAUDE-SON-OTURUM.md` silindi. Kanonik: `.github/son-durum.md`, `docs/KARARLAR.md`, `CLAUDE-SONRAKI-OTURUM.md`.

## 198 kapanışı — KÜTÜPHANE paslanmaz flanş (A10.6 #4 KAPANDI)
- **Seed:** 20 paslanmaz flanş satırı `flansh_olculer`'a (356 → **376**). Karbon EN-T11/EN-T12/B16.5-WN satırlarından **bit-bit mirror** (MK-96, hiçbir ölçü elle yazılmadı; flanş geometrisi malzemeden bağımsız). Dağılım: EN WN PN16 (8 DN), EN SO PN16 (5 DN), EN SO PN10 (1=DN65), B16.5 WN Cl150 (6 DN). `scripts/seed-data/paslanmaz-flansh-198.json`.
- **check-then-insert (MK-198.1):** `flansh_olculer_dogal_uk` **partial** index (197, migration 109) → supabase-js `upsert(onConflict)` oturmaz → `seed-from-json.mjs`'e `CHECK_THEN_INSERT` dalı (SELECT-önce, yoksa INSERT). Commit `1bb83d3`. Idempotent (re-run 20 ATLANACAK). self-test 4/4.
- **PN10 DN65 özdeşlik DOĞRULANDI (MK-198.2):** EN-1092-1 DN10–150 PN10≡PN16 ortak gövde; Wermac PN10+PN16 + RoyMech cross-check. `notlar.pn_ozdeslik_dogrulandi=true`.
- **Backfill (MK-198.3):** parse-tabanlı (`tanim`+`boyut`, `dis_cap_mm` KULLANMA — A10.1), 192 karbon flanş simetrik. **304/304 BOM bağı** (%100, EŞLEŞMEDİ 0). Flanş FK bağı 467 → **771**. JS-simülasyon dry-run (transaction yok) → idempotent per-row update. `scripts/backfill-flansh-paslanmaz-198.mjs` commit `7282fc8`. 46 satırda SO std-isimsiz → EN varsayıldı.
- **Kalan flanş artığı:** 816 toplam → 771 dolu / **45 null** (40 karbon + 5 cunife = 192 Set-On/özel artıkları → A11).
- **A11 denetim planı eklendi** (`KUTUPHANE-DURUM.md`): Gör→Triyaj→Düzelt, 6 boyut, borç envanteri. PLANLANDI, ayrı oturuma.

## 197 kapanışı — flansh UNIQUE index ön koşulu (MK-197.1)
- `flansh_olculer_dogal_uk` **partial** UNIQUE index (migration 109, canlıda COMMIT'li, commit `bf27968`). 7 kolon, `NULLS NOT DISTINCT`, `cap_dn` (cap_nps değil). cunife-LJ-DIN ailesi `WHERE` ile dışlandı (S1/S2 gerçek çift, MK-190.4). Paslanmaz flanş seed ön koşuluydu — 197 yarım kapandı, seed 198'e devretti.

## 196 kapanışı — paslanmaz reducer (A10.6 #3 KAPANDI)
- ASME B16.9 `reducer_conc` 14 satır (paslanmaz, DN40×32→DN300×250), `fitting_olculer` 960→**974**. Backfill +38 (fitting bağ 626→664). `schedule_kod=null` çoğaltmama kanıtlı. MK-196.1, commit `ab1ce78`.

## A10.6 yol haritası — DURUM
1. ✅ Paslanmaz tee (193+195) · 2. ✅ Karbon tee_red (195) · 3. ✅ Paslanmaz reducer (196) · 4. ✅ **Paslanmaz flanş (198)** · 5. ⚪ 1D dirsek (1 satır, düşük öncelik) · 6. ~556 boru ölçüsü (A8/B14 devir).
**Kütüphane toplamları (198 canlı):** `boru_olculer` 547 · `fitting_olculer` 974 · `flansh_olculer` **376** (karbon 308/paslanmaz 20/cunife 48).

## Format durumu — Tersan (L2+L3) + PAOR (L3) CANLI
- **Tersan:** Cadmatic, L2 deterministik (format-paketleri katman 0-3) + L3 fallback.
- **PAOR/AVEVA:** uçtan uca canlı. Excel BOM (lib/paor.js → `pipeline_malzemeleri`) + fab PDF (L3 vision) + Isometric_View. Spool sayısı PDF-pozisyon'dan.

## Kritik kurallar
Kod commit `[skip ci]` YOK; doc/veri `[skip ci]` (MK-134.1). Devre-scoped SQL (MK-163.1). information_schema kolon doğrula, kod yazmadan oku (MK-126.8). BEGIN/ROLLBACK (yoksa JS-simülasyon) dry-run (MK-98.2). DATA→UI→kod (MK-158.1). Sadece `IS NULL` backfill, toplamsal (MK-111.2/192.2). Referans çift-kaynak, türetme YOK (MK-96). Partial index → check-then-insert, upsert değil (MK-198.1). 12 endpoint tavanı (MK-129.3). gpc=add+commit+rebase+push.

## Anahtar dosyalar (kütüphane hattı)
- `scripts/seed-from-json.mjs` (check-then-insert dalı + lint MK-191.1; UNIQUE_KEY haritası)
- `scripts/seed-data/*.json` (seed artefaktları — 195/196/198)
- `scripts/backfill-flansh-paslanmaz-198.mjs` (parse-tabanlı flanş backfill, idempotent)
- `docs/KUTUPHANE-DURUM.md` (A bölümü veri + A10.x aile kayıtları + A11 denetim planı; B sayfa mimarisi)
- `lib/malzeme-kutuphane-eslesme.js` (runtime matcher — flanşta YOK, %100 FK)

## Açık borçlar (öncelik)
0. 🔵 **KK sayfası implementasyonu (Oturum 200)** — spec `docs/KALITE-KONTROL-TASARIM.md` hazır, mockup onaylı. Tersane davet formu şablonu kullanıcıdan bekleniyor (spec 7.2).
1. 🟡 **A11 — kütüphane kapsamlı denetim** (PLANLANDI): tutarlılık tarama aracı (`scripts/kutuphane-tutarlilik.sh`), 6 boyut, Gör→Triyaj→Düzelt. İlk gerçek-hata adayı: `fitting_olculer.yaricap_mm` karbon LR = 1.5×OD (hatalı, doğru=1.5×nominal), 28 grup/66 satır (A8 borcu).
2. 🟢 A10.6 #5 — 1D dirsek (1 satır).
3. 🟡 cunife reducing tee matcher `tee_eq` (`lib/malzeme-kutuphane-eslesme.js:97`, tanım-bazlı) — 1 satır; tee lookup `cap_kucuk` süzmüyor (`:98`, latent).
4. 🟢 cunife-LJ-DIN partial index DIŞINDA (S1/S2 ayırıcı kolon netleşince).
5. ⚙️ `oturum-saglik.sh`'e ayna md5-eşitlik kontrolü (MK-194.1 backlog).
6. Olet değerlendirmesi · 2FA+pg_dump · MK-176.7 wizard review.

## Repo / DB
- Repo github.com/cihatoztas-ai/arespipe @ ~/Desktop/arespipe. Prod arespipe.vercel.app. Supabase ochvbepfiatzvyknkvsn.
- Migration son: **109** (197). Fonksiyon 12/12. Son commit'ler: `1bb83d3` (check-then-insert) · `7282fc8` (backfill script) · `da44f1a` (KUTUPHANE-DURUM 198+A11).
