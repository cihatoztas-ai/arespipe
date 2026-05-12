# 79. Oturum Gündemi

> 78'in devamı. PN 10 flansh cephesi tam + M_K iki katına çıktı (gemi P0 cephesi açık + paslanmaz P1 genişledi). 79 için somut yollar belirlendi, Cihat seçecek.

---

## Açılış Ritüeli (CLAUDE.md disiplini — 2 soru)

1. **`git pull` + `git log -3` çıktısı.** 78 commit'leri (`edd3962`, `cfcb5ba`, `13b97d2`, 045) main'de olmalı.
2. **Bugün ne yapmak istiyorsun?**

Üç ana yol var (KUTUPHANE-YUKLEME-TAKIP.md v3'teki pratik iş sırası 3-6 arası).

---

## Yol A — EN 1092-1 PN 25 paketi (P1, ~2 saat) ⭐ ÖNERİLEN

PN 10 ve PN 16 cephesi tam (toplam 92 satır). PN 25 doğal devam: yüksek basınç, küçük çap, sık görülen.

**İş:**
1. Schema kontrolü (zaten biliyoruz, MK-75.2)
2. Kaynak araştırması:
   - ProjectMaterials EN 1092-1 PN 25 (T01 plate)
   - pipefittingweb EN 1092-1 PDF (T05/T11/T12 ortak tablo)
3. PN 25 DN aralığı: tipik DN 10-300, 15 DN — PN 16 ile aynı kapsam beklenir
4. LATERAL JOIN pattern (MK-76.2) — T11'den geometri reuse, T01/T05/T12 override
5. Migration `046_inserts_en1092_pn25_paketi.sql`
6. Beklenen: 4 tip × 15 DN = 60 satır, idempotent NOT EXISTS

**Sonuç:** flansh_olculer 308 → 368 (%19 artış)

---

## Yol B — B16.9 Stub End (A2, P1, ~1.5 saat)

76'dan beri açık. Fitting cephesinde 6. parça tipi.

**İş:**
1. Wermac `dim_stub_ends.html` fetch (önceki Cap pattern'ı 75'te kullanıldı)
2. Schema `fitting_olculer` (`stub_lap_kalinlik_mm` + `stub_lap_od_mm` özel kolonlar bu tip için)
3. 33 DN (DN 15-1200, B16.9 standart kapsamı)
4. Migration `046_inserts_b16_9_stub_end.sql` (eğer A öncelikli değilse)

**Sonuç:** fitting_olculer 424 → 457

---

## Yol C — M_K Düşük Sıcaklık Karbon (P1, ~30-45 dk)

Gemi ambar hatları (sıvı doğalgaz, soğutma sistemleri) için kritik. Hızlı iş.

**İş:**
1. ASTM A333 Grade 6 (boru, -45°C'ye kadar)
2. ASTM A420 WPL6 (BW fitting, eşleşen)
3. ASTM A350 LF2 (forged + flansh, eşleşen)
4. Mukavemet: TS=415 MPa, YS=240 MPa (A106 B ile benzer ama düşük sıcaklık sertleşmesi)
5. Migration `046_malzeme_kataloglari_dusuk_sicaklik_karbon.sql`

**Sonuç:** M_K 20 → 23 satır, gemi cryogenic cephesi başlangıç

---

## Yol D — B16.11 Socket Fittings (P1, ~3-4 saat, büyük)

Fitting_olculer'a ikinci standart eklenmesi. Küçük çap (NPS ≤ 4) socket weld fittings — karbon ve paslanmaz, Class 3000/6000.

**İş:**
1. ProjectMaterials veya Wermac B16.11 tablosu
2. Şema kontrol (`schedule_kod` kullanılabilir bu standartta — B16.9'dan farklı)
3. Parça tipleri: elbow, tee, cross, coupling, half-coupling, cap (~6 tip × ~10 DN × 2 class = ~120 satır)
4. Migration `046_inserts_b16_11_socket.sql`

**Sonuç:** fitting_olculer 424 → 540+, ikinci standart açılır

⚠ Bu büyük iş — bir oturum dolusu zaman alır. Karar yorgunluğu riski var.

---

## Yol E — Hijyen + küçük iyileştirmeler (~30-45 dk)

Karışık küçük borçlar:

- **DB kontrolü:** M_K mevcut satırlarda `cekme_mukavemeti_min_mpa` ve `akma_mukavemeti_min_mpa` dolu mu? 77'nin başlangıç 5 satırında NULL olabilir. Hızlı UPDATE ile doldur.
- **CuNi cephesi `korozyon_notlari` JSONB dolumu** — mevcut satırlarda NULL. Pratik bilgi notları eklenebilir (deniz suyu hızı limiti, H2S etkisi).
- **flansh_olculer notlar JSON şeması tutarlılık kontrolü** — 76-78 arasında pattern aynı mı?
- **`fitting_malzeme_uyum` ilk script tasarımı** — M_K × fitting_olculer otomatik üretim mantığı (büyük, ayrı oturum gerekebilir)

---

## Önerilen Sıra (78 sonu mantığı)

Cihat'ın seçimine bırakılır, ama Claude önerisi:

1. **A (PN 25 paketi)** — doğal devam, flansh cephesi büyük adım, pattern oturmuş, hızlı yapılır
2. **C (düşük sıcaklık karbon)** — hızlı kazanç, gemi P1 cephesi açılır
3. **B (Stub End)** — 76'dan beri biriken borç, fitting cephesinde temizlik
4. **D (B16.11)** — büyük iş, ayrı oturuma uygun
5. **E (hijyen)** — diğerleri arasında ara dolgu

---

## Hazır Pattern (78'den taşınanlar)

- **LATERAL JOIN reuse:** T11'den ortak geometri kopya, T01/T05/T12 override (MK-76.2)
- **VALUES dikey hizalama:** flag bloğu / numeric bloğu / text bloğu — kolon sırası göze çarpsın (MK-78.5)
- **Idempotent NOT EXISTS:** her INSERT öncesi (spec_standart + COALESCE spec_grade + tenant_id) bileşik kontrol
- **ASCII SQL comments:** Türkçe sadece TEXT string'lerde (MK-76.3)
- **MD5 + satır + byte transfer doğrulaması:** her dosya için (MK-51.1)
- **`gp` push:** otomatik rebase + push tek adımda

---

## Kritik Hatırlatmalar (78'den taşınanlar)

### Migration sırası

- **MK-78.1 EN ÖNEMLİ:** Migration numarası vermeden önce **GitHub migrations dizinine bak**. 78'de 042 çakışması ekran görüntüsüyle yakalandı.
- 78 sonunda son numara: **045** (paslanmaz). 79'da yeni dosyalar **046**'dan başlar.

### Kapanış disiplini

- **MK-78.3:** Kapanış üçlüsü hiçbir koşulda atlanmaz. 77'de atlanmıştı, 78'de düzeltildi.

### Komut zincirleri

- **MK-78.4:** `&&` zincirinde prerequisite (mkdir) önce, hedef-bağımlı sonra.

### SQL yazımı

- **MK-78.5:** VALUES'da dikey hizalama (flag/numeric/text blokları). Kolon sırası karışırsa CHECK violation veya silent yanlış veri.
- **MK-76.1:** Supabase'de explicit BEGIN/COMMIT yok (implicit).
- **MK-76.3:** SQL yorumları ASCII-only.
- **MK-76.4:** GENERATED kolonu (örn. `spec_kodu`) INSERT'e koyma.

### Kaynak doğrulama

- **MK-75.3:** Her veri için iki bağımsız kaynak. 78'de bu disiplin sayesinde T01 PN 10 (ProjectMaterials + pipefittingweb), CuNi (copper.org + cnkpipefitting + Solitaire), paslanmaz (octalsteel + dsstainlesssteel + pipingpipeline) hepsi çift doğrulandı.

---

## Süreç Disiplinleri (78'de yerleşik)

- **Heredoc yöntemi yerine present_files** — Claude tarafında dosya yaz, MD5 + satır + byte ver, Cihat indir + doğrula + kopyala
- **Vercel logs UTC** — TR saatine `AT TIME ZONE 'Europe/Istanbul'` (51'den)
- **GitHub web UI upload kullanma** — sadece terminal git akışı (51 dersi)
- **Tek tırnak commit mesajı** — Türkçe parantez/özel karakter shell'i karıştırır (eski ders)
- **CuNi notlar:** Mevcut M_K CuNi satırlarında `korozyon_notlari` (JSONB) NULL. İlerde deniz suyu hız limiti (3.5 m/s) gibi notlar buraya gidebilir.

---

## 78'in Özeti (79 başlangıcında 30 saniyede)

| İş | Sonuç |
|---|---|
| Migration 043 — PN10 T01+T12 | +16 satır flansh, PN10 cephesi tam |
| Migration 044 — M_K CuNi fitting+flansh | 2 UPDATE + 4 INSERT, gemi P0 cephesi açıldı |
| Migration 045 — M_K paslanmaz genişleme | +6 INSERT, TP304L + TP316 grade'leri |
| KUTUPHANE-YUKLEME-TAKIP.md v3 | 5+ ay belge birikimi kapatıldı |

DB delta: flansh_olculer 292→308, malzeme_kataloglari 10→20.

---

> 79 açılışında bu dosya + `son-durum.md` + `CLAUDE-SON-OTURUM.md` okunur, sonra Cihat'a *"Hangi yolu seçelim — A (PN 25), B (Stub End), C (düşük sıcaklık karbon), D (B16.11), E (hijyen)?"* sorulur.
