# CLAUDE — Sonraki Oturum (193) Brifingi

> **Önceki:** Oturum 192 (19 Haz 2026). Flanş + fitting FK backfill tamamlandı (+690 bağ, sıfır yanlış-bağ). Spool↔kütüphane bağı boru+flanş+fitting'te bitti. Tam kayıt: `docs/KUTUPHANE-DURUM.md` **A10**.

---

## Açılış ritüeli
```
cd ~/Desktop/arespipe && git pull --rebase && git status && git log --oneline -3
ls api/*.js | wc -l    # 12 tavan (MK-129.3)
```
Handoff oku: bu dosya + `CLAUDE-SON-OTURUM.md` + `docs/KUTUPHANE-DURUM.md` (A10 + B14 güncel).

## İLK İŞ — 192 doc commit'i indi mi
192'de **kod commit'i YOK** (tamamen DB UPDATE'leri canlıda yapıldı). `git log`'da sadece doc commit'i olmalı: KUTUPHANE-DURUM A10/B14 + handoff `[skip ci]`. Kod aranmaz. İstersen canlı teyit: bir karbon flanş/elbow spool detayı aç → STANDART kolonu dolu + satır mavi mi (FK yazıldı).

---

## Öncelikli gündem

### 1. 🟡 Renk noktası (KARAR-86.A) — ÖNÜ AÇILDI, ilk iş
192'de tüm FK (boru+flanş+fitting) bitti → nokta artık yanıltıcı değil. `spool_detay.html` render: sol-kenar çizgisi → `#` kolonuna **nokta** (🔵 standart `geomBagli+kaliteStandart` / 🟡 ara ölçü `malz-arasolc` / ⚪ kütüphanede yok `malz-tanimsiz`). Mantık (3-dallı KARAR-86.A) hazır, sadece çizgi→nokta görsel. Satır tıklama + modal AYNEN kalır.
- HTML patch deseni: anchor + `node --check` + `grep -c "</html>"` (MK-172.6) + MD5 + `arespipe_kopyala` → `gpc`.
- ÖNCE render kodunu oku (MK-126.8), nokta sınıflarının nasıl atandığını gör.

### 2. 🔴 Kütüphane seed (A10.6 yol haritası)
Backfill'in ürettiği eksik listesi — en kalabalıktan:
- Paslanmaz tee (eşit+red, ~75) · karbon tee_red (~21) · paslanmaz reducer (33, Sch 10S+80S) · paslanmaz flanş seti (316L WN/SO, B16.5-150LBS) · 1D dirsek (1) · 556 boru ölçüsü (devir).
- Yöntem A4/A5/A6 (referans-çekme, ≥2 kaynak MK-96, %100 referanstan). Seed `node scripts/seed-from-json.mjs` — artık lint-korumalı (MK-191.1, grup zorunlu + standart↔grup).
- **flansh_olculer UNIQUE constraint YOK** → flanş seed gerekirse önce DDL (BEGIN/ROLLBACK dry-run).
- **Seed sonrası:** flanş/fitting FK backfill'i `IS NULL` ile TEKRAR çalıştır (toplamsal, eski bağ bozulmaz) → yeni seed'lenenler bağlanır. SQL'ler A10.1–A10.4'te.

### 3. 🟡 Olet değerlendirmesi (~194 satır)
Weld-O-let branch fitting. Library'de karşılığı var mı, varsa hangi tabloya? Scope-dışı mı seed mi kararı — DATA ile (A10.6'da "şüpheli" işaretli).

---

## Ertelenenler (kayıtta)
- flansh_olculer UNIQUE constraint (seed upsert için).
- 2FA (Supabase+GitHub) + pg_dump off-platform yedek — ayrı oturum.
- MK-176.7 wizard review ekranı → spool_detay/devre_detay.
- boru_olculer ASME çift-etiket görsel birleştirme — kozmetik.
- Kütüphane Faz 4/5 (gerçek kesit-şema SVG, foto/3D/DXF) — Cihat: program bitince.

## Sabit kurallar
- DATA → UI → kod (MK-158.1). Kolon adı tahmin etme, `information_schema` (MK-85.3).
- `izometri-oku.js` dokunulmaz (MK-49.1). 12 endpoint tavanı (MK-129.3).
- Backfill: BEGIN/ROLLBACK dry-run önce (MK-98.2), sadece NULL doldur (MK-111.2), mevcuda dokunma. Toplamsal.
- Grup çelişkisi grup ekseninde denetlenir, literal `=` değil (MK-192.3).
- Tee/tip alt-sınıfı yapısal ölçüden, serbest-metinden değil (MK-192.1).
- Seed: grup zorunlu + standart↔grup lint (MK-191.1) otomatik.
- HTML patch: anchor + `node --check` + `grep -c "</html>"` (MK-172.6) + MD5.
- `dis_cap_mm` eşleştirmede güvenilmez (format-bağımlı + bazen bozuk) → DN'i `boyut`'tan parse et.
