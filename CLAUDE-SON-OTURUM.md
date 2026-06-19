# CLAUDE — Son Oturum (193)

> **Tarih:** 19 Haziran 2026 · **Oturum:** 193
> Üç iş: **(1) renk durum noktası** (KARAR-86.A, kod) · **(2) paslanmaz tee_eq seed** (+21) · **(3) tee_eq FK backfill** (+65). Backfill öncesi bir konvansiyon hatası yakalandı → **MK-193.1**. Tam teknik kayıt: `docs/KUTUPHANE-DURUM.md` **A10.7** + **B14**.

---

## 1. ✅ Renk durum noktası (KARAR-86.A) — kod, commit `7acb6a0`
`spool_detay.html`: satırın sol-kenar 3px çizgisi tablo kenarıyla karışıyordu → **`#` kolonundaki noktaya** taşındı.
- 🔵 standart (`geomBagli+kaliteStandart`) / 🟡 ara ölçü (`malz-arasolc`) / ⚪ kütüphanede yok (`malz-tanimsiz`) / şeffaf = uç-işlemi (hizalama korunur).
- `noktaSinif` mevcut `trClasses`'ten **birebir** okunur — yeni mantık yok, 3-dallı karar aynen. Satır tıklama + modal **aynen**.
- CSS: `malz-tiklanabilir/standartdisi/arasolc/tanimsiz` `border-left` çizgileri + `td:first-child` telafileri kaldırıldı; ölü `malz-standartdisi` temizlendi; `.nokta*` eklendi.
- Doğrulama: tek gerçek `</html>` (MK-172.6), inline JS sözdizimi temiz, +7 satır.

## 2. ✅ Paslanmaz tee_eq seed — +21 satır (`fitting_olculer`)
- Kapsam **B**: DN15–DN600 (gemi-gerçekçi). Karbonun DN650–1200 dev ölçüleri atlandı.
- **Kaynak (MK-96):** B16.9 uç-uca (M) malzeme-bağımsız → birincil referans = doğrulanmış karbon B16.9 tee_eq (OD + M birebir). `et_mm`/`agirlik_kg` taşınmadı.
- `agirlik_kg = null` (MK-96: tee teorik kütle yok; paslanmaz katalogdan ≥2 kaynakla sonra).
- `seed/seed-tee-eq-paslanmaz.json` + `scripts/seed-from-json.mjs` (lint 21/0 red, idempotent). Commit `4deb188` (ilk) → `fa1a992` (konvansiyon düzeltme).

## 3. 🔴 MK-193.1 — Eşit tee konvansiyon hatası (backfill ÖNCESİ yakalandı)
Seed ilk üretimde **karbon aynalandı → `cap_kucuk_dn = NULL`**. Ama backfill **iki-çap kontrollü** (A10.3/A10.4): `NULL = dn_k` join'i düşer → satır görünür ama **bağlanmaz**. Karbon eşit tee bu konvansiyonu hiç test etmemişti (spool'da karbon eşit tee yok). Bağlanması-kanıtlı aile = **cunife** (`cap_kucuk_dn = cap_buyuk_dn`). 21 satır `UPDATE` ile hizalandı (`cap_kucuk_dn=cap_buyuk_dn`, `cap_kucuk_mm=cap_buyuk_mm`), JSON provenance düzeltildi. **Körlemesine çalıştırılsaydı 0 eşleşme + yanlış teşhis.**

## 4. ✅ tee_eq FK backfill — +65 spool bağı
Talep `spool_malzemeleri.boyut`'tan (NPS-inç çift; `dis_cap_mm` BOZUK: `4"`→`4.00`). 4 distinct boyut → **açık NPS→DN eşleme** (`1-1/2` kesir tuzağı yok):
| boyut | tip | DN | adet |
|---|---|---:|---:|
| `4" / 4"` | eşit | 100 | 62 ✓ |
| `6" / 6"` | eşit | 150 | 2 ✓ |
| `1-1/2" / 1-1/2"` | eşit | 40 | 1 ✓ |
| `6" / 4"` | **red** | 150×100 | 10 → kalır (tee_red seed) |
62+2+1 = **65** (her DN tek fitting_id). DATA-first: önce SELECT sayım (65), sonra BEGIN/ROLLBACK dry-run (65), sonra COMMIT.

## Sonuç (canlı)
`fitting_olculer` 935 → **956** (+21). Spool fitting bağı 530 → **595** (+65). Sıfır yanlış-bağ.

## Commit'ler (193)
| Tür | Hash | İçerik |
|---|---|---|
| kod | `7acb6a0` | spool_detay durum noktası (KARAR-86.A) — CI tetikli |
| veri | `4deb188` | paslanmaz tee_eq seed JSON (21) `[skip ci]` |
| veri | `fa1a992` | seed düzeltme cap_kucuk_dn=cap_buyuk_dn `[skip ci]` |
| (DB) | — | tee_eq konvansiyon UPDATE (21) COMMIT |
| (DB) | — | tee_eq FK backfill (+65) COMMIT |
| doc | (bu kapanış) | A10.7 + B14 + handoff + KARARLAR `[skip ci]` |

## KARARLAR.md'ye eklenecek
**MK-193.1 — Eşit tee kütüphane konvansiyonu (iki-çap matcher):** Backfill iki-çap kontrollü olduğundan, kütüphanedeki eşit tee `cap_kucuk_dn = cap_buyuk_dn` (+ `cap_kucuk_mm`) ile yazılır, NULL bırakılmaz — yoksa `NULL = dn_k` join'i düşer, satır görünür ama bağlanmaz. Referans aynalarken **bağlanması-kanıtlı aileyi** seç (cunife eşit tee), test edilmemiş aileyi (karbon eşit tee — spool'da hiç görünmemiş) değil. Genel ilke: kütüphane satırının "doğru görünmesi" yetmez, matcher join'inde **bağlanabilir** olması da şart; ikisi farklı denetimdir.
