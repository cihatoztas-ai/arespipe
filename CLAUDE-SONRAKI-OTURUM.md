# CLAUDE — Sonraki Oturum (199) Brifingi

> **Önceki:** Oturum 198 (22 Haz 2026) — KÜTÜPHANE paslanmaz flanş (A10.6 #4) KAPANDI. Seed 20 (check-then-insert, partial index) + backfill 304/304 + PN10 DN65 özdeşlik doğrulandı. A11 kapsamlı denetim planı doğdu. Commit: `1bb83d3`→`7282fc8`→`da44f1a`+kapanış.

---

## Açılış ritüeli
```
cd ~/Desktop/arespipe && git pull --rebase && ./scripts/oturum-saglik.sh 199 && cat BRIEFING.md
ls api/*.js | wc -l    # 12 tavan (MK-129.3)
```
Handoff oku: bu dosya + `.github/son-durum.md` + `BRIEFING.md` + `docs/KUTUPHANE-DURUM.md` (A10.10 + **A11** güncel).
**Otorite (MK-194.1):** kararlar `docs/KARARLAR.md`, bağlam+handoff kök.

## İLK İŞ — A11: Kütüphane Kapsamlı Denetim (PLANLANDI → uygula)

> **Tam plan:** `docs/KUTUPHANE-DURUM.md` → **A11** bölümü. Agenda orada hazır; bu özet yön verir.

**Çerçeve: Gör → Triyaj → Düzelt** (parça parça değil, bütünsel).
1. **Katman 1 — Görünürlük (araç):** `scripts/kutuphane-tutarlilik.sh` (veya .mjs) — 198'in ad-hoc çapraz-malzeme sorgusunu kalıcılaştır, **6 boyut**:
   (1) çapraz-malzeme geometri çelişkisi (≤0.5mm gürültü / üstü gerçek) · (2) yuvarlama konvansiyonu sapması · (3) formül-türetme izleri (1.5×OD gibi %100 uyum = MK-96 ihlali) · (4) backfill kapsama boşluğu (`*_olculer_id IS NULL`) · (5) belge vs canlı sayım · (6) `notlar` kaynak-izi eksikliği. **Düzeltme YOK — sadece rapor.**
2. **Katman 2 — Triyaj:** her bulgu (a) gerçek hata / (b) konvansiyon / (c) gürültü.
3. **Katman 3 — Sıralı düzeltme:** MK-158.1 (DATA→UI→code, önce okuma kodunu gör) · MK-98.2 (dry-run→say→COMMIT) · MK-96 · MK-126.8.

**Bilinen ilk gerçek-hata (en yüksek öncelik):** `fitting_olculer.yaricap_mm` karbon LR = **1.5×OD (hatalı)** vs paslanmaz 1.5×nominal (doğru) — 28 grup/66 satır (A8 borcu). Önce `spool_detay`/`kutuphane.html` okuma kodunu gör (yaricap nerede/nasıl kullanılıyor — MK-158.1), sonra dry-run UPDATE `yaricap_mm = 1.5×nominal`.

**Kapsam DIŞI (A11 değil):** yeni seed (1D dirsek/olet), parser/Excel-BOM, PAOR/AVEVA. A11 = yalnız mevcut referans verisinin bütünlüğü.

## Yöntem (198'de kanıtlandı — tekrar et)
- **DATA→UI→kod (MK-158.1):** önce SELECT/keşif, sonra dry-run, sonra yazma.
- **information_schema teyit (MK-126.8):** kolon adı varsayma. (198'de BOM'da flanş yapısal kolonu YOK çıktı → parse'a döndük.)
- **`dis_cap_mm` güvenilmez** (flanş/fitting'te null veya OD) → DN'i `boyut`'tan parse, açık NPS→DN.
- **Partial UNIQUE index → check-then-insert** (upsert değil — MK-198.1). Full index → upsert yeter (fitting).
- **Backfill:** sadece `IS NULL`, toplamsal (MK-111.2/192.2). Transaction yoksa **JS-simülasyon dry-run** (haritayı hesapla+say, DB'ye dokunma).
- **Referans çift-kaynak, türetme YOK (MK-96).** Mirror'da bit-bit + geri-doğrulama.
- Seed: `node scripts/seed-from-json.mjs <json>` dry-run → `--yaz`. Lint (MK-191.1) grup+standart zorunlu.

## Tooling notu
- **Direkt PG / transaction YOK** (.env.local'de DATABASE_URL yok, `pg` kurulu değil). Eldeki: supabase-js (PostgREST) = transaction yok, correlated UPDATE...FROM yok. SQL gerekirse Supabase SQL editör; aksi JS per-row + JS-simülasyon dry-run.
- Geçici keşif script'i: proje köküne `_x.mjs` yaz (node_modules resolve için), çalıştır, **sil** (çalışma alanı temiz kalsın).

## Ertelenenler (kayıtta)
- 🟢 A10.6 #5 — 1D dirsek (1 satır seed).
- 🟡 cunife reducing tee matcher `tee_eq` (`lib/malzeme-kutuphane-eslesme.js:97`); tee lookup `cap_kucuk` (`:98`, latent).
- 🟢 cunife-LJ-DIN partial index dışında (S1/S2 ayırıcı kolon netleşince uniqueness kazandır).
- ⚙️ `oturum-saglik.sh` ayna md5-eşitlik kontrolü (MK-194.1 backlog).
- 📝 Olet library karşılığı değerlendirmesi · 2FA (Supabase+GitHub) + pg_dump off-platform yedek · MK-176.7 wizard review · ~556 boru ölçüsü (A8/B14) · Kütüphane Faz 4/5 (program bitince).

## Sabit kurallar
- `izometri-oku.js` dokunulmaz (MK-49.1). 12 endpoint tavanı (MK-129.3).
- Kod commit `[skip ci]` YOK; doc/veri `[skip ci]` (MK-134.1).
- Grup çelişkisi grup ekseninde, literal `=` değil (MK-192.3). Tee tip-alt-sınıfı geometriden (MK-192.1).
- HTML patch: anchor + `node --check`(inline JS) + `grep -c "</html>"` + MD5 + `arespipe_kopyala` → `gpc` (MK-172.6).
- Doküman tek-otorite (MK-194.1): kararlar docs/, bağlam+handoff kök.
