# 76. Oturum Gündemi

> 75'in devamı. Kütüphane mini-projesi 78 satır ilerledi, açılan EN 1092-1 cephesi PN 16'da yarıya geldi. Cihat'a hangi yolda devam soracağız.

---

## Açılış Ritüeli (CLAUDE.md disiplini — 2 soru)

1. **`git pull` + `git log -3` çıktısı.** 75 commit'leri (`18fc4d8`) main'de olmalı.
2. **Bugün ne yapmak istiyorsun?**

Üç ana yol var:

---

## Yol A — Kütüphane'de devam (önerilen, akış sürer)

### A1 — EN-T05 (Blind) PN 16 (P0, ~1 saat)

Yarıda kalan PN 16 cephesinin son tipi. 78+15 = 93 satır PN 16 olur, "tüm yaygın tipler" tamam.

**İş:**
1. Schema sorgusu: `is_nullable` dahil tüm constraint'ler (MK-75.2)
2. Kaynak araştırması:
   - piping-world.com PN 16 BL (önceki denemede menü çıktı, gerçek tablo gerek)
   - pipingpipeline.com EN 1092-1 Type 05 BL
   - valvias.com PN-16
3. Facing tipi nüansı: Pipefittingweb PDF'i diyor ki Type 05 PN ≤ 40 default Type A (FF), B1 (RF) opsiyonel. Karar: Cihat'a sor — Type 05'in `yuzeyTipi` default neyi olsun?
4. Cıvata reuse (Wermac Type 11 PN 16 → BC, count, hex/stud) — aynı PN+DN
5. Idempotent SQL: `040_inserts_en1092_pn16_t05_blind.sql`

### A2 — B16.9 Stub End (P0, ~1.5 saat)

`fitting_olculer`'a Lap Joint pair, NPS 1/2 – 24, ~33 satır. Wermac dim_stub_ends sayfası kaynak.

**İş:**
1. Wermac fetch + markdown'a kaydet
2. Schema kontrolü `fitting_olculer` (Cap pattern'i biliniyor zaten)
3. Parser → JSON → transformer → 041 SQL (idempotent)

### A3 — EN 1092-1 PN 10 paketi (P1, ~2 saat)

PN 16 pattern'i birebir tekrar: T01 + T11 + T12 + T05 (eğer A1 bitmişse). ~60 satır.

**Wermac PN 10 WN + RoyMech (eğer PN 10 sayfası varsa) + Wermac bolt PN 10.**

Pattern aynı → hızlı geçiş. Tek başına bir oturumda biter.

### A4 — B36.19M paslanmaz boru içerik teyidi (P0, ~1 saat)

DB'de 70 satır var ama 75'te dokunulmadı. İçerik kim tarafından yüklendi belirsiz. Cross-check:
- Wermac/Ferrobend B36.19M tablosu fetch
- DB ile karşılaştır (DN, schedule, dış çap, et)
- Sapma varsa not düş, ±0.5mm tolerans dışı satırları işaretle

---

## Yol B — Ana proje (kütüphane dışı)

75 ana proje akışından ayrıydı. Eğer ana proje devam edilecekse 74'te kalan iş:
- `briefing-74-sonuc` + MK-74.3 (is_durumu vs s.durum eksenleri)
- Bu konuda detay 75'in kayıtlarında yok — eski son-durum.md'ye veya 74'ün dosyalarına bak

**Açılış:** *"75 kütüphane oturumuydu, ana proje 74'te kalmıştı. is_durumu / s.durum konusu vardı, devam edelim mi yoksa başka bir konu mu?"*

---

## Yol C — Migrations 027-031 push (hijyen, ~15 dk)

DB'de aktif olan ama GitHub'a hiç push edilmemiş kütüphane migration'ları:
- 027_boru_olculer_tenant_ekle.sql
- 028_tenant_spec_sozluk.sql
- 029_boru_agirlik_function.sql
- 030_dogrulama.sql
- 031_public_views_ve_rls.sql

Bu dosyalar muhtemelen Cihat'ın elinde (önceki kütüphane oturumlarından) veya regenerate edilebilir. Disiplin gereği repo'ya girmeli — sürüm kontrol kayıp olmasın.

**Eğer Cihat'ın elinde dosyalar varsa hızlı.** Yoksa rejenerasyon iş.

---

## Önerilen Sıra (Cihat seçimine bırakılır)

Üç yol da geçerli. Öncelik sezgisi:
1. **A1 (EN-T05 Blind)** → PN 16 tam tamamlanır, "parça kimliği" prensibi PN 16'da %100 örnek olur
2. **C (027-031 push)** → 15 dk, küçük temizlik
3. **A4 (B36.19M teyit)** → açık veriyi kontrol etme, etik
4. **A2 (Stub End)** → fitting cephesinde Cap'ten sonra natural devam
5. **A3 (PN 10)** → MVP genişletme (PN 16 örneğinden hızlı)
6. **B (ana proje)** → kütüphaneden çıkıp ana akışa

---

## Hazır Pattern (76'da hızlandırıcı)

75'te aşağıdaki disiplinler oturdu:
- Schema sorgusu: `column_name, is_nullable, data_type` (NOT NULL atlanamasın)
- Idempotent INSERT: `WHERE NOT EXISTS` her satırda
- Çift kaynak doğrulama: DN 100 spot + 7 alan ±0.5mm
- Standart edisyon kontrolü: yeni vs eski sürüm farklılıkları (MK-75.4)
- Cıvata reuse: aynı PN+DN'de tüm tipler aynı bolt pattern → Wermac WN sayfası tek başına yeterli
- `notlar` JSON string olarak yaz (TEXT kolon), SELECT'te `::jsonb` cast

Bu pattern A1, A2, A3, A4'te birebir uygulanır. Cihat onayladığı anda iş başlar.

---

## Kritik Hatırlatmalar (75'ten taşınanlar)

- **MK-75.1:** `notlar` TEXT, SELECT'te `::jsonb` cast şart
- **MK-75.2:** INSERT öncesi `is_nullable` sorgula
- **MK-75.3:** Çift kaynak doğrulama disiplini
- **MK-75.4:** Standart edisyon farkları, en güncel referans
- **MK-75.A:** EN flanş tip kodu `EN-T01`, `EN-T05`, `EN-T11`, `EN-T12` (B16.5'ten ayrı)
- **MK-75.B:** `basinc_sinifi` sadece sayı ('16', '150')
- **MK-75.C:** `bolt_holes_inch`/`bolt_cap_inch` çift anlamı
- **MK-75.D:** Idempotent INSERT pattern

Ana proje tarafından taşınanlar (51 + öncesi):
- `izometri-oku.js`'e DOKUNMA (MK-49.1)
- Hassas anahtar Claude'a verme (MK-50.1)
- Dosya kopyalama protokolü (MK-51.1, `arespipe_kopyala` zsh fonksiyonu)
- Parser_kural regex'leri 5+ örnekle test (MK-51.2)
- DB schema değişikliği grep tarama (MK-51.4)

---

## Süreç Disiplinleri

- **`gp` push kullan** (otomatik rebase) — `git push origin main` YAZMA
- **Heredoc yöntemi** Mac dosya transferi için
- **Vercel logs UTC** — TR saatine `AT TIME ZONE 'Europe/Istanbul'`
- **GitHub web UI upload kullanma** — sadece terminal git akışı
- **Tek tırnak commit mesajı** — Türkçe parantez + özel karakter shell'i karıştırır (`'data(75): ...'`)

---

> 76 açılışında bu dosya + `son-durum.md` + `KUTUPHANE-BRIEFING.md` v2 + `CLAUDE-SON-OTURUM.md` okunur.
> Sonra Cihat'a *"Hangi yolu seçelim — kütüphane mi, ana proje mi?"* sorulur. Beklenen cevaba göre detaylı plana geçilir.
