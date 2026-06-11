# son-durum.md — Oturum 178 kapanışı

## Özet
**Paslanmaz B16.9 dirsek kütüphanesi başladı + seed kapısı açıldı + seed aracı fitting'e uyarlandı.**
`fitting_olculer` 897 → **935**. Paslanmaz ASME-B16.9 90LR (19) + 45LR (19) DB'de.
Yöntem cunife-seviyesi rigor: referans katalogdan çek → ≥2 kaynak çapraz-doğrula (MK-96) → JSON → seed.

## Yapılanlar (sırayla)
1. **Sıradaki grup DB'den seçildi** (MK-158.1). fitting_olculer GROUP BY → cunife/karbon tam, paslanmaz=0.
   Cihat seçimi: **A) Paslanmaz B16.9+B16.11 fitting**.
2. **Ağırlık kuralı netleşti (MK-178.1):** türetme/yoğunluk-faktörü/formül YASAK; %100 referanstan, ≥2 kaynak,
   tablo 2. kaynakla doğrulanır. Karbon-bazlı ağırlık paslanmaz için kabul değil. Sandvik paslanmaz otorite kaynak.
3. **Kaynak avı + çapraz-doğrulama:** dynamicforge A403/A815 (birincil ağırlık+ölçü) ↔ buyfittingsonline (gerçek SS
   ürün kg) **<%1 örtüştü** (DN40/50/80 90LR). ZIZI karbon-bazlı çizelge %7 sapma + iç typo → **elendi** (cross-val iş başında).
   Ölçü B16.9/MSS-SP-43 (malzemeden bağımsız) + mevcut karbon DB ile teyitli.
4. **JSON üretildi:** `paslanmaz_b16_9_90lr_v1.json` (20 satır DN15-600, DN90 FLAG_SUPHELI),
   `paslanmaz_b16_9_45lr_v1.json` (19 satır DN15-600). Fiziksel monotonluk + JSON geçerlilik kontrol edildi.
5. **Seed kapısı (MK-178.2):** fitting_olculer'da unique constraint yoktu. Dry-run çakışma kontrolü (boş → güvenli) +
   `standart`/`geometri_std` NULL kontrolü (0). Constraint eklendi:
   `fitting_olculer_dogal_uk = UNIQUE NULLS NOT DISTINCT (standart, malzeme_grubu, parca_tipi, cap_buyuk_dn, cap_kucuk_dn, schedule_kod, class_no)`.
   (Supabase editörü BEGIN/ROLLBACK'i yutar — dry-run ALTER kalıcı oldu, tanım pg_get_constraintdef ile teyit edildi.)
6. **Seed:** doğrudan INSERT...ON CONFLICT SQL ile yazıldı → 45LR=19, 90LR=19 teyitli (DN90 FLAG atlandı).
7. **seed-from-json.mjs fitting'e uyarlandı (MK-178):** UNIQUE_KEY.fitting_olculer 7-alan, notlar nested→stringify
   (tablo-bilinçli; boru JSONB'ye dokunmadı), YENI_AKSIYONLAR'a 'YENI', generic dry-run preview. node --check temiz.
   md5 = **1c544d9fa91758838ba2f5d735254893**.
8. **Doküman:** `KUTUPHANE-DURUM.md` (kapsam + tablo-tablo takip çizelgesi + yöntem + kural + kaynak hiyerarşisi).
   Eski `KUTUPHANE-YUKLEME-TAKIP.md` (bayat, fitting=0 diyordu) `docs/arsiv/`'e taşındı (git mv).

## Canlı durum
- HEAD = e6f9bf7 (177) → bu oturum: +1 KOD commit (seed script) + 1 DOC commit (KUTUPHANE-DURUM + arsiv + handoff).
- **Fonksiyon: 12/12** (seed CLI script, serverless değil).
- DB: fitting_olculer 935 (cunife 328 / karbon 569 / paslanmaz 38).

## WORKING TREE — DİKKAT (dokunulmadı)
- `migrations/` → `schema/`+`data/` yarım taşıma (önceki oturum) hâlâ commit bekliyor — bu oturum dokunmadı.
- `giris.html.bak2`, `giris.html.bak3` (patch yedekleri — commit etme, sil/gitignore), `sandvik_...json` (veri DB'de).
- paslanmaz JSON'lar (90lr/45lr) repoda DEĞİL — script re-seed isterse `kutuphane/` veya `migrations/data/`'a konabilir (Cihat kararı).

## Açık (sonraki oturum) — §CLAUDE-SONRAKI-OTURUM
Paslanmaz devamı (90SR→cap→reducer→tee→stub→socket), 45LR+DN300 2.kaynak teyit, DN90 FLAG çözümü,
cunife cap, DIN flanş, boru/flanş kırılım tazeleme, quirk temizliği (yaricap/45°-alan/standart-geometri_std).

## Dosya md5
- scripts/seed-from-json.mjs = 1c544d9fa91758838ba2f5d735254893
- docs/KUTUPHANE-DURUM.md = 62bd665ca2513b0d42353f885c0b13f4
