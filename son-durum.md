# son-durum.md — Oturum 182 sonu

## HEAD
`3ec8f4e` (matcher fix + #2a wizard) + bu oturum son commit (pozisyon-bazlı matcher fix). Fonksiyon: 12/12 (yeni api yok). Not: CI-bot `[skip ci]` rapor commit'leri araya girebilir → `git pull --rebase`.

## Canlıya (bu tur)
- **Matcher fix + #2a** (`3ec8f4e`): deklaratif `DOSYA_DESENLERI` + PAOR deseni; wizard L3 açıkken fab PDF → L3 yolu.
- **Pozisyon-bazlı matcher fix** (son commit): PAOR spool kimliği array-index'ten (`S0n`), L3 `spool_no` yok sayılır. `eslestir` + devre-inceleme döngüleri. MD5 kuyruk `0a65b39b...`, devre-inceleme `f125c676...`.

## Neden pozisyon (canlı veri keşfi)
"Test etmeden #2b" yerine mevcut 3616 batch kaydından şekli kilitledik → matcher'ın ilk `koseli_to_S` deseni ÇÜRÜDÜ: L3 `spool_no` 4 varyant + **9 çakışan kayıt** (`[1]/[1]`, `S01/S01`) → metin-normalize sessiz kayıp (B-6). Pozisyon (idx0→S01) hepsini çözer. (MK-182.2-DÜZELTME)

## Hemen sıradaki / kullanıcı adımı
- **183 ilk iş — TOPLU CANLI TEST:** PAOR klasörü + L3 ON → S01 attach (R1/R2) + marka + [2]/[3] fazla. (182'de test dosyası yoktu.)
- CI yeşil mi doğrula.

## Açık işler (kısa)
- **#2b** gerçek S02/S03: kabuk 1→N (`sonuc_spool_sayisi`) + malzeme KAYIT-BAZLI (boş→pipeline, dolu→per-spool, MK-182.5) + 0/1/N üç durum (MK-182.6) + cap/et zenginleştirme pozisyon-eşle. Kapsam DAR (~34 çok-spool). Tasarım: CLAUDE-SONRAKI-OTURUM.md.
- 181-3 artığı temizliği · D-182.2 imalat/montaj malzeme · PAOR agirlik_kg · NPS→mm bug (PAOR'u etkilemez) · W-2.5 · spool hata rozeti.

## Kapanan (182)
- Açık borç 117 (`yukleyen_id` null) — wizard `yukleyen_id: userId` ile DÜZELTİLMİŞ (MK-182.3).
- Revert boşluğu endişesi — YOK (MK-181/169/170/171 sağlam).

## Disiplin notu
PAOR ayrışması Tersan'ı bozmuyor: spool kimliği `sp_kaynak:'pozisyon'` (Tersan dosya-adı `else` dalında değişmedi), malzeme kayıt-bazlı (Tersan per-spool kalır). Kural aynı (Excel=malzeme/kimlik, L3=sayı+bölme), uygulama veri-şeklinden ayrışıyor.
