# CLAUDE — Son Oturum (190)

> **Tarih:** 18 Haziran 2026 · **Oturum:** 190
> Başlangıç: Kütüphane faz planına devam (Faz 3). Asıl keşif: spool_detay kütüphane matcher'ı kopuktu.

---

## Ne yapıldı

### 1. ✅ Faz 3 — Kütüphane karşılaştırma peer mantığı (DEPLOY, commit `e93860f`)
`kutuphane.html` — üç düzeltme, iki noktada:
- **Boru:** "en yakın et" → **DN + dış çap + et tam eşleşme (±0.05)**. Schedule kayması bitti (alu SCH10 ↔ çelik SCH40 artık olmaz). CuNi metrik serisi (OD 57/108) dış çapla otomatik ayrışır.
- **Fitting:** `.eq('parca_tipi')` → `.in('parca_tipi', rawCodesFor(p, normTip(...)))` — çapraz-standart eşi (`90LR` ASME ↔ `elbow_90lr` DIN) yakalanır.
- **Flanş:** `basinc_sinifi` her zaman anahtarda (önleyici; canlıda boş yok).
- Veri-doğrulamalı: PROBE-1 → et malzemeler arası birebir çakışıyor, OD nominal oynuyor.

### 2. ✅ "Duplicate" araştırması → HATA DEĞİL
`boru_olculer`'da 43 grup "çift" görünüyordu. BEGIN/ROLLBACK ile bakıldı: aynı et iki schedule adıyla (STD≡SCH40, XS≡SCH80). ASME gerçeği, bilinçli yazılmış, arama iki adı da bulsun diye. **Silinmedi.** Görsel birleştirme ("STD / 40") program bitince.

### 3. ✅ spool_detay boru matcher KOPUK BAĞI bulundu + düzeltildi (commit BEKLENİYOR — MD5 `60d62eea003f1cd2f57fbd6ee5805d41`)
**Şikâyet:** spool detayda hiçbir malzeme kütüphaneye tanınmıyor.
**Eleme (DATA önce, kademe kademe):**
- feature flag `kutuphane_parca_kimligi` → tenant 1 için `aktif=true` ✓
- `tip='boru'` → 2357 satır, 2230 ölçülü ✓
- Konsol: `KUTUPHANE_AKTIF=true`, sarmalayıcı kurulu, tenant doğru, `BORU_LIB=8` ama **`BORU_MAP=0`** ← kopma burada
- Sebep: spool OD **324**, kütüphane OD **323.9** = 0.1mm fark; matcher toleransı `<0.05` → eleniyor.
**Fix (`spool_detay.html`, `boruEslestir`):** tek `tol=0.05` → **OD ±1.0mm, et ±0.06** ayrık tolerans. OD nominal yuvarlamadan oynar; et farklı DN'leri zaten ayırır → OD gevşetmek güvenli. Canlıda doğrulandı: `["DIN-86019 323.9×4"]` tek temiz eşleşme.

### 4. ✅ KUTUPHANE-DURUM.md güncellendi (MD5 `ec683de200a1465125773f7ef68d30fd`)
B8 (karşılaştırma kuralları + çözüldü), B13 (Faz 3 ✅, Faz 4/5 ertelendi), B14 (yeni borçlar).

---

## Dosyalar / commit'ler

| Dosya | Durum | MD5 | Commit |
|---|---|---|---|
| `kutuphane.html` | ✅ canlıda | — | `e93860f` |
| `spool_detay.html` | ⚠ deploy bekliyor | `60d62eea003f1cd2f57fbd6ee5805d41` | — |
| `docs/KUTUPHANE-DURUM.md` | deploy bekliyor | `ec683de200a1465125773f7ef68d30fd` | — |

---

## Yan tespitler (gelecek işler)
- **FK boş:** runtime matcher ekranı besliyor ama DB'ye `boru_olculer_id`/`flansh_olculer_id` yazmıyor (boru 67/2230). → `geom_standart` boş kalıyor (modal standardı gösteriyor ama malzeme tablosu "—"), süper admin "eksik" listesi FK-null saydığı için 30+ yanlış-pozitif. → **FK backfill** sıradaki en öncelikli iş.
- **316L tier şüphesi:** Bir 316L boru modalında "ASME-B36.10M" (karbon std) göründü — paslanmaz için `B36.19M` beklenirdi. Backfill öncesi tier kalite ayrımı doğrulanmalı.
- **Renk kodu görsel:** sol-kenar çizgisi tablo kenarıyla karışıyor → `#` kolonuna nokta (mavi/turuncu/gri). Mantık (KARAR-86.A 3-dallı) hazır.
