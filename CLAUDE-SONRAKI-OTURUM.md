# CLAUDE — Sonraki Oturum (195) Brifingi

> **Önceki:** Oturum 194 (19 Haz 2026) — doküman sağlık oturumu. KARARLAR çatallanması birleştirildi, doküman tek-otorite MK-194.1, kopya temizliği, revizyon damgaları. Kod/DB değişmedi. Zincir: `2e92243`→`8d88690`→`ea9cca9`→`36cea8a`→`daaccab`+kapanış.

---

## Açılış ritüeli
```
cd ~/Desktop/arespipe && git pull --rebase && git status && git log --oneline -3
ls api/*.js | wc -l    # 12 tavan (MK-129.3)
```
Handoff oku: bu dosya + `CLAUDE-SON-OTURUM.md` + `son-durum.md` + `docs/KUTUPHANE-DURUM.md` (A10.7 + B14 güncel).
**Otorite (MK-194.1):** kararlar `docs/KARARLAR.md` (kök stub), bağlam+handoff kök. Kök KARARLAR.md artık stub — okuma docs/'tan.

## İLK İŞ — 195 tee_red seed (A10.6 #1, 193'ten devir)

### 1. 🔴 Paslanmaz tee_red + karbon tee_red (~31 satır)
- Paslanmaz `tee_red` (~10, DN150×100 `6"/4"`) + karbon `tee_red` (~21). **İkisinde de library referansı YOK.**
- Redüksiyonlu tee `tee_eq`'ten zor: `cap_buyuk_dn` + `cap_kucuk_dn` + run/branch uç-uca (C ve M ayrı). B16.9 reducing-tee tablosu kaynak.
- **Konvansiyon (MK-193.1 türevi):** red tee'de `cap_kucuk_dn ≠ cap_buyuk_dn` zaten (gerçek redüksiyon) → null sorunu yok ama iki çap da dolu olmalı.
- Talep: `spool_malzemeleri` `tip='fitting' + tanim ~* '\mtee\M' + boyut`'ta sol≠sağ. Sayım + NPS→DN açık eşleme (tee_eq'teki gibi).
- Backfill toplamsal → seed sonra `IS NULL` ile tekrar (MK-192.2).

### 2. 🟡 Paslanmaz reducer (33 satır, A10.6 #3)
- Sch 10S + 80S. Library'de paslanmaz reducer yok. ASME B16.9 reducer_conc, çift-çap.

### 3. 🟡 Paslanmaz flanş seti (A10.6 #4)
- 316L WN EN-1092-1, AISI316 SO, B16.5-150LBS-316L. **flansh_olculer UNIQUE constraint YOK** → seed öncesi DDL gerekir (BEGIN/ROLLBACK dry-run).

---

## Yöntem (193'te kanıtlandı — tekrar et)
- **DATA→UI→kod (MK-158.1):** önce talep sayımı (SELECT), sonra dry-run, sonra UPDATE.
- **Seed konvansiyonu:** referans aynalarken bağlanması-kanıtlı aileyi seç (MK-193.1).
- **`dis_cap_mm` BOZUK** her formatta → DN'i `boyut`'tan parse et, açık NPS→DN eşleme (`1-1/2` kesir tuzağı).
- **Backfill iki-çap kontrollü:** `cap_buyuk_dn` + `cap_kucuk_dn` ikisi de join'de.
- Seed: `node scripts/seed-from-json.mjs <json>` dry-run → `--yaz`. Lint (MK-191.1) grup+standart zorunlu.
- Backfill: BEGIN/ROLLBACK dry-run (MK-98.2), sadece `IS NULL` (MK-111.2), grup-çelişki=0, COMMIT. Toplamsal.

## Ertelenenler (kayıtta)
- ⚙️ `oturum-saglik.sh`'e ayna md5-eşitlik kontrolü (MK-194.1 backlog).
- 📝 Kök `BRIEFING.md` 187 → güncel tazeleme (handoff'lar ileride, BRIEFING geride).
- `flansh_olculer` UNIQUE constraint (paslanmaz flanş seed öncesi şart).
- Olet (~195+) library karşılığı değerlendirmesi (branch fitting, şüpheli).
- 2FA (Supabase+GitHub) + pg_dump off-platform yedek — ayrı oturum.
- MK-176.7 wizard review → spool_detay/devre_detay.
- ~556 boru ölçüsü (devir, A8/B14). Kütüphane Faz 4/5 — program bitince.

## Sabit kurallar
- `izometri-oku.js` dokunulmaz (MK-49.1). 12 endpoint tavanı (MK-129.3).
- Kolon adı tahmin etme, `information_schema` (MK-85.3). Kod yazmadan önce mevcudu oku (MK-126.8).
- HTML patch: anchor + `node --check`(inline JS) + `grep -c "</html>"` (MK-172.6) + MD5 + `arespipe_kopyala` → `gpc`.
- Kod commit `[skip ci]` YOK; doc/veri commit `[skip ci]` (MK-134.1).
- Grup çelişkisi grup ekseninde, literal `=` değil (MK-192.3). Tee tip-alt-sınıfı geometriden (MK-192.1).
- **Doküman tek-otorite (MK-194.1):** kararlar docs/, bağlam+handoff kök; otorite-dışı kopya yazma; ayna md5-eşit.
