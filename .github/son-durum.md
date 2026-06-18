# Son Durum — 191. Oturum (18 Haziran 2026)

> 190 → 191. Boru matcher grup-kör bug'ı (316L→karbon B36.10M) uçtan uca kapatıldı.

## Sonuç
**191 başarıyla kapatıldı.** 4 iş, hepsi commit + CI yeşil. Boru tarafı (matcher + FK) tamam; flanş/fitting backfill 192'ye scope'landı (text-parse gerektiriyor).

## Yapılanlar
1. **Boru matcher Tier-0 grup ekseni** (`99c2fb9` + `d1fd876`) — 316L artık ASME-B36.19M'e bağlanıyor; karbon↔paslanmaz çakışması grup ekseninde çözülüyor; grup belli + o ölçüde aynı-grup yok → null (yanlış-grup bağlamaz). Deploy MD5 `6fcc5cd425faa671ed51fa421072196e`.
2. **Boru FK backfill — COMMIT** — 1674 bağlı / 556 boş. Tüm bağlar grup-tutarlı. 556 = kütüphanede eksik ölçü (seed işi), tolerans değil.
3. **Seed-gate lint MK-191.1** (`76a528c`) — `scripts/seed-from-json.mjs`: grup zorunlu+enum + standart↔grup whitelist. Yanlış satır DB'ye girmeden reddedilir.
4. **KUTUPHANE-DURUM.md A9+B14** (MD5 `754cf657…`) — Cihat'ın elinde, yüklenecek.

## CI
✅ YEŞİL — son kod commit'i `76a528c` (seed lint). `node --check` geçti.

## Açık borçlar (öncelik sırası)
1. 🔴 Flanş + fitting FK backfill — text-parse (tip='fitting' altında flanşlar, DN/PN/tip `tanim`'da). Anahtar `flansh_tipi+cap_dn+basinc_sinifi+grup`. → 192.
2. 🟡 Renk noktası (# kolonu, KARAR-86.A) — tüm backfill bitince.
3. 🟡 556 eksik boru ölçüsü — seed (ST35.8 48.3×4.5 vb.).
4. flansh_olculer UNIQUE constraint · 2FA+pg_dump · MK-176.7 wizard review.

## Sonraki oturum notu
İlk iş: 191 deploy + KUTUPHANE-DURUM indi mi teyit, 316L spool'da STANDART kolonu mavi/ASME-B36.19M mi. Sonra flanş backfill — ama önce `tanim` parse çeşitliliğini SQL ile gör (DATA→UI→kod).
