# CLAUDE — Sonraki Oturum (194) Brifingi

> **Önceki:** Oturum 193 (19 Haz 2026). Renk durum noktası shipped (`7acb6a0`). Paslanmaz tee_eq seed +21 + backfill +65 (fitting 530→**595**). Konvansiyon dersi MK-193.1. Tam kayıt: `docs/KUTUPHANE-DURUM.md` **A10.7**.

---

## Açılış ritüeli
```
cd ~/Desktop/arespipe && git pull --rebase && git status && git log --oneline -3
ls api/*.js | wc -l    # 12 tavan (MK-129.3)
```
Handoff oku: bu dosya + `CLAUDE-SON-OTURUM.md` + `docs/KUTUPHANE-DURUM.md` (A10.7 + B14 güncel).

## İLK İŞ — 193 indi mi
`git log` son commit'ler: `7acb6a0` (kod, durum noktası) + seed JSON `fa1a992` + bu kapanış doc'u. Canlı teyit: bir spool detayı aç → `#` kolonunda durum noktaları görünüyor mu (🔵/🟡/⚪). Bir paslanmaz `4"/4"` tee spool'u → STANDART dolu + satır mavi (FK bağlandı, 65/65).

---

## Öncelikli gündem (A10.6 seed yol haritası — kalanlar)

### 0. 🔴 DOKÜMAN SAĞLIK — birleştirme + otorite düzeltme (193 taraması, ilk iş)
Tam rapor: `docs/DOKUMAN-SAGLIK-TARAMASI-193.md` (commit `2e92243`). Üç iş:
- **KARARLAR çatallanması:** kök `./KARARLAR.md` (172'de bayat, 108 MK) vs `docs/KARARLAR.md` (193 güncel, 250 MK, OTORİTE). **7 MK numara çakışması** — özellikle MK-172.1–172.6 iki dosyada TAMAMEN FARKLI kararlara atanmış (kök: logo/antet/tarama-rengi; docs: devre-wizard/termin-takvimi/redesign). Her çakışan numara için karar gerekir: hangisi numarayı korur, diğeri hangi yeni numaraya kayar. Kör birleştirme YASAK (ikisi de geçerli karar). Kökte docs'ta olmayan 16 benzersiz kural da var (MK-108.2, 134.1 vb.) — bunlar docs'a taşınmalı.
- **BRIEFING:** kök `./BRIEFING.md` (187) vs `docs/BRIEFING.md` (167 bayat). Çatallanmış + yön ters. Ayrıca kök BRIEFING bile 187'de kalmış — handoff'lar 193'te, yani 6 oturum geride. Güncelle + tek otorite belirle.
- **Otorite kuralı:** Repo şu an iki dosya için TERS yönde otorite tutuyor (KARARLAR→docs, BRIEFING→kök). Yeni bir MK kuralıyla netleştir: her doküman için tek otorite dizin + senkron politikası. Yoksa bu dağınıklık tekrar üretilir.
- Araç: Claude Code (repo-içi tarama/diff/birleştirme için ideal). Yöntem: önce çakışmaları yan yana göster, kullanıcı her birine karar versin, sonra uygula — kör ezme yok.

### 1. 🔴 Paslanmaz tee_red + karbon tee_red (~31 satır)
- Paslanmaz `tee_red` (~10, DN150×100 `6"/4"`) + karbon `tee_red` (~21). **İkisinde de library referansı YOK** (karbon tee_red=0, paslanmaz tee=0).
- Redüksiyonlu tee `tee_eq`'ten zor: `cap_buyuk_dn` + `cap_kucuk_dn` + run/branch uç-uca (C ve M ayrı) gerekir. B16.9 reducing-tee tablosu kaynak.
- **Konvansiyon (MK-193.1 türevi):** red tee'de `cap_kucuk_dn ≠ cap_buyuk_dn` zaten (gerçek redüksiyon) → null sorunu yok ama iki çap da dolu olmalı.
- Talep: `spool_malzemeleri` `tip='fitting' + tanim ~* '\mtee\M' + boyut`'ta sol≠sağ. Sayım + NPS→DN açık eşleme (tee_eq'teki gibi).
- Backfill toplamsal → seed sonra `IS NULL` ile tekrar (MK-192.2).

### 2. 🟡 Paslanmaz reducer (33 satır, A10.6 #3)
- Sch 10S + 80S. Library'de paslanmaz reducer yok. ASME B16.9 reducer_conc, çift-çap.
- `flansh_olculer UNIQUE constraint YOK` sorunu reducer'ı etkilemez (fitting tablosu, UK var).

### 3. 🟡 Paslanmaz flanş seti (A10.6 #4)
- 316L WN EN-1092-1, AISI316 SO, B16.5-150LBS-316L. **flansh_olculer UNIQUE constraint YOK** → seed öncesi DDL gerekir (BEGIN/ROLLBACK dry-run). `seed-from-json.mjs` UNIQUE_KEY haritası `flansh_olculer: null` → constraint eklenince doldur.

---

## Yöntem (193'te kanıtlandı — tekrar et)
- **DATA→UI→kod (MK-158.1):** önce talep sayımı (SELECT), sonra dry-run, sonra UPDATE.
- **Seed konvansiyonu:** referans aynalarken bağlanması-kanıtlı aileyi seç (MK-193.1). Eşit tee `cap_kucuk_dn=cap_buyuk_dn`.
- **`dis_cap_mm` BOZUK** her formatta → DN'i `boyut`'tan parse et, açık NPS→DN eşleme (genel regex değil, `1-1/2` kesir tuzağı).
- **Backfill iki-çap kontrollü:** `cap_buyuk_dn` + `cap_kucuk_dn` ikisi de join'de.
- Seed: `node scripts/seed-from-json.mjs <json>` dry-run → `--yaz`. Lint (MK-191.1) grup+standart zorunlu.
- Backfill: BEGIN/ROLLBACK dry-run (MK-98.2), sadece `IS NULL` (MK-111.2), grup-çelişki=0, COMMIT. Toplamsal.

## Ertelenenler (kayıtta)
- `flansh_olculer` UNIQUE constraint (paslanmaz flanş seed öncesi şart).
- Olet (~194) library karşılığı değerlendirmesi (branch fitting, şüpheli).
- 2FA (Supabase+GitHub) + pg_dump off-platform yedek — ayrı oturum.
- MK-176.7 wizard review → spool_detay/devre_detay.
- ~556 boru ölçüsü (devir, A8/B14).
- Kütüphane Faz 4/5 (gerçek kesit-şema SVG, foto/3D/DXF) — program bitince.

## Sabit kurallar
- `izometri-oku.js` dokunulmaz (MK-49.1). 12 endpoint tavanı (MK-129.3).
- Kolon adı tahmin etme, `information_schema` (MK-85.3). Kod yazmadan önce mevcudu oku (MK-126.8).
- HTML patch: anchor + `node --check`(inline JS) + `grep -c "</html>"` (MK-172.6) + MD5 + `arespipe_kopyala` → `gpc`.
- Kod commit `[skip ci]` YOK; doc/veri commit `[skip ci]` (MK-134.1).
- Grup çelişkisi grup ekseninde, literal `=` değil (MK-192.3). Tee tip-alt-sınıfı geometriden (MK-192.1).
