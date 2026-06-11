# CLAUDE-SONRAKI-OTURUM.md — Oturum 179 giriş planı

## Ritüel (önce)
`git pull && git status && git log --oneline -5` + fonksiyon 12/12 + handoff oku.
HEAD bekle: 178 doc commit'i (KUTUPHANE-DURUM + handoff), altında 178 kod commit'i (seed-from-json.mjs).
**git status'ta yarım `migrations/` taşıması + `.bak`'lar GÖRÜNECEK — NORMAL, 178 işi değil. Panik yok.**

## Bağlam: nerede kaldık (178)
Paslanmaz B16.9 fitting kütüphanesi başladı. **90LR (19) + 45LR (19) DB'de** (fitting_olculer 897→935).
Seed kapısı açıldı (`fitting_olculer_dogal_uk`, NULLS NOT DISTINCT 7-alan). `seed-from-json.mjs` fitting'e uyarlandı.
Yöntem KESİN: %100 referans, türetme YASAK, ≥2 kaynak çapraz-doğrulama (MK-178.1). Kaynaklar: dynamicforge A403 (birincil)
+ buyfittingsonline (gerçek SS kg) + Sandvik/Alleima (otorite). Eski TAKİP belgesi emekli, yeni `docs/KUTUPHANE-DURUM.md`.

## SIRADAKİ İŞ — paslanmaz B16.9 devamı (sırayla)
Veri büyük kısmı **dynamicforge çekiminde elimde** (90SR, end cap, konsantrik reducer gördüm; eksantrik/tee/stub ek çekim).
Her parça tipi için: dynamicforge çek → buyfittingsonline ile ≥2 nokta-kontrol → JSON (karbon alan kullanımı aynalanır:
90LR→ucu_uca_a, 45LR→ucu_uca_b, reducer→ucu_uca_f + cap_kucuk_*, cap→ucu_uca_h, stub→stub_lap_*) → seed-from-json.mjs.
Sıra: **90SR → end cap → reducer_conc → reducer_ecc → tee_eq → stub_end → (sonra B16.11 socket).**

Seed artık akıcı: `node scripts/seed-from-json.mjs <dosya>` (dry-run) → `--yaz`. JSON `notlar` nested obje bırak (script stringify eder),
`_db_aksiyonu: YENI` / şüpheli satır `FLAG_SUPHELI`.

## AÇIK İŞLER / BORÇ
- **45LR + ≥DN300 90LR 2.kaynak teyit** (tek-kaynak dynamicforge; DN50/100 buyfittingsonline ile doğrula).
- **DN90 (3.1/2") 90LR FLAG_SUPHELI** — 40S=1.83<DN80 2.18; ikinci kaynak bul, çöz, yaz.
- **cunife cap** (fitting'de cunife elbow/tee/reducer var, cap ❌) + **DIN flanş eksikleri** (DIN 86087 cunife flanş → flansh tablosu).
- **boru/flanş kırılım tazeleme:** KUTUPHANE-DURUM §9 sorgusuyla granül durumu doldur (şu an total bilinir, standart×schedule değil).
- **Quirk temizliği (okuma kodu görülünce tek seferde):** yaricap_mm karbon 1.5×OD vs paslanmaz 1.5×NPS; 45° uç-uca karbon
  ucu_uca_b vs şema ucu_uca_c; standart vs geometri_std otoritesi. devre_detay / 3D render (MK-49.A) hangi alanı okuyor — yüklet, bak.
- **flansh_olculer unique constraint YOK** — flanşa geçince MK-98.2 dry-run.
- Önceki borçlar: `migrations/` taşıması commit, MK-117 (yukleyen_id null), 13 kirli devre recovery, gece cron ispatı, `1 1/4"` kesir bug.

## İLK HAMLE (179)
Cihat onaylarsa düz sırayla **90SR** çek. Yöntem kanıtlandı, araç hazır, kapı açık — akış hızlı olmalı.

## 178'de KAPANAN
- ✅ Paslanmaz B16.9 90LR + 45LR (38 satır) — çapraz-doğrulanmış, seed'li.
- ✅ Seed kapısı (fitting unique constraint) + seed-from-json.mjs fitting uyarlaması.
- ✅ Kütüphane dokümanı yenilendi (KUTUPHANE-DURUM.md), eski TAKİP emekli.
