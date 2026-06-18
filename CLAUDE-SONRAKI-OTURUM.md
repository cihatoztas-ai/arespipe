# CLAUDE — Sonraki Oturum (191) Brifingi

> **Önceki:** Oturum 190 (18 Haz 2026). Kütüphane Faz 3 + spool_detay matcher kopuk bağı düzeltildi.

---

## Açılış ritüeli (her oturum)
```
cd ~/Desktop/arespipe && git pull --rebase && git status && git log --oneline -3
ls api/*.js | wc -l    # 12 tavan (MK-129.3)
```
Handoff oku: bu dosya + `CLAUDE-SON-OTURUM.md` + `docs/KUTUPHANE-DURUM.md`.

## İLK İŞ — 190 deploy'u indi mi teyit et
190 kapanışında 2 dosya deploy bekliyordu. `git log`'da şu commit'ler VAR MI:
- `spool_detay boru matcher OD tolerans` (MD5 `60d62eea...`)
- `KUTUPHANE-DURUM B8/B13/B14`
Yoksa önce onları yükle (Downloads'tan `arespipe_kopyala`).
Sonra bir boru spool detayı aç → satırlar tanınıyor mu (mavi/tıklanabilir, modal açılıyor) gör.

---

## Öncelikli gündem (sıra)

### 1. 🔴 FK backfill (en öncelikli)
**Amaç:** runtime eşleşmelerini DB'ye kalıcı yaz (`boru_olculer_id` + `flansh_olculer_id`). Çözer: (a) malzeme tablosunda standart "—" yerine ad gösterimi (`geom_standart` dolar), (b) süper admin "eksik" listesi 30+ → gerçek sayıya iner.
**ÖNCE mantık doğrula (koda/yazıma geçmeden):**
- Matcher 316L boruyu hangi standarda bağlıyor? Beklenen `ASME-B36.19M` (paslanmaz), ama 190'da modalda `B36.10M` (karbon) göründü → tier kalite ayrımı şüpheli. `boruEslestir` tier 1 (`KALITE_STANDART_HARITA` regex) doğru daraltıyor mu, canlıda/SQL ile teyit. Yanlışsa tier'ı düzelt, SONRA backfill.
- Backfill **aynı OD-tolerans mantığını** kullanmalı (OD±1mm, et±0.06) — yoksa 324↔323.9 yine kaçar.
- **BEGIN/ROLLBACK dry-run** (MK-98.2), veri-silme yok, sadece FK UPDATE.

### 2. 🟡 Renkli durum noktası (backfill SONRASI)
`spool_detay.html` render (~satır 2486-2580). Sol-kenar çizgisi → `#` kolonuna nokta:
- 🔵 mavi = standart (geomBagli + kaliteStandart)
- 🟡 turuncu = ara ölçü (`malz-arasolc`)
- ⚪ gri = kütüphanede yok (`malz-tanimsiz`)
Mantık (KARAR-86.A 3-dallı) DURUYOR — sadece çizgi→nokta. Satır tıklama + modal AYNEN kalır. Konum: `#` kolonu (Cihat onayı). Backfill sonrası çünkü renkler değişecek.

### 3. 🟡 Gerçekten eksik 9 boru ölçüsü
PROBE'da kütüphanede karşılığı OLMAYANLAR: 60.3×4.5 paslanmaz · 65×2 / 125×2.5 / 200×3 1.4571 (EN ince-cidar paslanmaz, EN 10216-5) · 48.3×4.5 St37 · 48.3×6.3 St37 · 60.3×6.3 St37 · 139.7×4.5 St37. Standart mı ara-ölçü mü ayrımı → standartsa JSON/seed, ara-ölçüyse süper-admin. (Not: bunların bir kısmı backfill + matcher fix sonrası "eksik" listesinden düşebilir — backfill'i bekle.)

---

## Ertelenenler (kayıtta, atlanmadı)
- **Faz 4/5** — fitting/flanş SVG kesit-şema + medya/3D/DXF (Cihat: program bitince).
- **boru_olculer çift-etiket görsel birleştirme** ("STD / 40") — saf kozmetik.
- **2FA + pg_dump off-platform yedek** — Cihat ayrı oturum yapacak. 2FA adımları hazır, yedek için `pg_dump --version` + yedek konumu kararı bekliyor.
- **schedule_tipi etiket normalize** (sch_no/designator/SCH karışık, paslanmaz "SCH" öneksiz).

## Sabit kurallar (hatırlatma)
- DATA → UI → kod (MK-158.1). Kolon adı tahmin etme, `information_schema` (MK-85.3).
- `izometri-oku.js` dokunulmaz (MK-49.1). 12 endpoint tavanı (MK-129.3).
- HTML patch: anchor + `node --check` inline JS + `grep -c "</html>"` (MK-172.6) + MD5.
