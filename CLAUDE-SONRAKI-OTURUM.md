# CLAUDE — Sonraki Oturum (192) Brifingi

> **Önceki:** Oturum 191 (18 Haz 2026). Boru matcher grup-kör bug'ı kapatıldı (Tier-0 grup ekseni), boru FK backfill yapıldı (1674), seed-gate lint kuruldu (MK-191.1).

---

## Açılış ritüeli
```
cd ~/Desktop/arespipe && git pull --rebase && git status && git log --oneline -3
ls api/*.js | wc -l    # 12 tavan (MK-129.3)
```
Handoff oku: bu dosya + `CLAUDE-SON-OTURUM.md` + `docs/KUTUPHANE-DURUM.md` (A9 + B14 güncel).

## İLK İŞ — 191 deploy + KUTUPHANE-DURUM indi mi
`git log`'da olmalı: `99c2fb9` (matcher), `d1fd876` (191b), `76a528c` (seed lint). KUTUPHANE-DURUM.md A9 bölümü repoda mı (MD5 `754cf657…`). Bir 316L boru spool aç → STANDART kolonu **ASME-B36.19M** + mavi mi (boru backfill canlı teyit).

---

## Öncelikli gündem

### 1. 🔴 Flanş + fitting FK backfill — ZOR İŞ (text-parse)
**Neden boru gibi değil:** spool tarafında flanşın DN/PN/tip'i **yapısal kolonda YOK**, `tanim` metnine gömülü ("Flange WN DN50 PN16"). Ayrıca **`tip` alanı güvenilmez** — flanşların çoğu `tip='fitting'` altında (191 probe: 817 ipuçlu satır vs `tip='flansh'` sadece 12).
**Adımlar (sırayla, koda geçmeden DATA):**
- (a) `tip IN ('flansh','fitting')` + `tanim` ipucuyla gerçek flanşları ayıkla; false-positive denetle.
- (b) `tanim`'dan DN / PN / flanş-tipi (WN/SO/BL/LJ) parse — örnek tanım çeşitliliğini önce SQL ile gör (`SELECT DISTINCT tanim … LIMIT 50`).
- (c) grup türet (191'deki `_boruGrupBelirle` mantığı / seed lint STD_GRUP ile aynı eksen).
- (d) `flansh_olculer` eşleşme anahtarı: `flansh_tipi + cap_dn + basinc_sinifi + grup` — **`basinc_sinifi` ŞART** (DN200/250/300'de çoklu PN karbon satırı var, PN'siz yanlış-bağlar).
- (e) BEGIN/ROLLBACK dry-run (MK-98.2), grup-tutarlılık + PN-tutarlılık verify, sonra COMMIT.
- Fitting: benzer ama `parca_tipi(norm) + cap_buyuk_dn + cap_kucuk_dn + grup`. `TIPNORM`/`rawCodesFor` (kütüphane B5) referans.
> Not: `flansh_olculer` için UNIQUE constraint hâlâ yok (seed upsert flanşı bloklar) — flanş seed gerekirse önce DDL (B-A7 dry-run deseni).

### 2. 🟡 Renk noktası (TÜM backfill bitince)
`spool_detay.html` render (~satır 2513-2580, KARAR-86.A 3-dallı): sol-kenar çizgisi → `#` kolonuna nokta (🔵 standart `geomBagli+kaliteStandart` / 🟡 ara ölçü `malz-arasolc` / ⚪ yok `malz-tanimsiz`). FK'ya bağlı → flanş+fitting backfill bitmeden yapılırsa o satırlar gri kalır (yanıltıcı). Satır tıklama + modal AYNEN kalır.

### 3. 🟡 Eksik 556 boru ölçüsü — seed
Kütüphanede karşılığı OLMAYAN: ST35.8 48.3×4.5 (496), St37 DIN-OD 139.7/48.3/60.3 @ 4.5/6.3, EN ince-cidar paslanmaz 1.4571 65×2 / 125×2.5 / 200×3. Standart mı ara-ölçü mü ayrımı → "Kütüphane Veri Kaynakları" projesi → JSON → `seed-from-json.mjs` (artık lint-korumalı). **Tolerans gevşetme YAPMA** (schedule kimliği bozulur).

---

## Ertelenenler (kayıtta)
- `flansh_olculer` UNIQUE constraint (seed upsert için).
- 2FA (Supabase+GitHub) + pg_dump off-platform yedek — ayrı oturum.
- MK-176.7 wizard review ekranı → spool_detay/devre_detay.
- boru_olculer ASME çift-etiket görsel birleştirme ("STD / 40") — kozmetik.

## Sabit kurallar
- DATA → UI → kod (MK-158.1). Kolon adı tahmin etme, `information_schema` (MK-85.3).
- `izometri-oku.js` dokunulmaz (MK-49.1). 12 endpoint tavanı (MK-129.3).
- Backfill: BEGIN/ROLLBACK dry-run önce (MK-98.2), sadece NULL doldur, mevcuda dokunma.
- Seed: grup zorunlu + standart↔grup lint (MK-191.1) artık otomatik.
- HTML patch: anchor + `node --check` + `grep -c "</html>"` (MK-172.6) + MD5.
