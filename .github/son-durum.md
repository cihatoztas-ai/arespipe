# Son Durum — 51. Oturum (1 Mayıs 2026)

> 50 → 51 geçişi. L2 mekanizması canlıda doğrulandı. ASME helper bug'ı temizlendi.

---

## Bu Oturumun Sonucu

**51 başarıyla kapatıldı.** L2 deterministik parser canlıda çalışıyor, L2 fail durumunda L3 fallback otomatik tetikleniyor, kullanıcıya kesinti yansımıyor.

### Yapılanlar (sırasıyla)

1. **`parserKuralIle` STUB → gerçek L2 parser bağlandı** (kod, `api/izometri-oku.js`)
   - PDF base64 → buffer → text → `lib/l2-parser.js::parse(text, parser_kural)`
   - Başarılı → `_l2_meta` ile spoollar dön
   - Başarısız → `parser_seviye='l2_failed'` + sebep
2. **L2 fail → L3 fallback** mekanizması (kod, çağrı yeri)
   - `[L2-FAIL]` console.warn (Format envanter UI metriği için)
   - Otomatik `visionAIParse` çağrısı, `_l2_fallback` meta
3. **`fingerprintSkor` tie-breaker bonus** (kod)
   - `dosya_adi_regex` eşleşmesi `+1` → `+5` puan
   - 47.B yorumundaki niyeti gerçekten kodladı
4. **Spool fingerprint dosya adı regex'i** (DB)
   - Eski: `^[A-Z]\d+-\d+-\d+-P\d+\s+\d+\(\d+\)\.S\d+\.\d+\.pdf$` (kendi örnek dosyalarıyla bile eşleşmiyordu)
   - Yeni: `^G\d+-[\dA-Z]+-[A-Z]+\d+\s+\d+\(\d+\)\.S\d+(?:_\d+)?\.\d+\.pdf$`
   - 7 gerçek dosya pattern'iyle test edildi (S02-S10, 303 + 303S varyantı)
5. **`boru_olculer` sütun adları DB ile uyumlu** (kod, ASME helper)
   - 12 sütun referansı düzeltildi
   - `et_kalinligi_mm` → `et_mm`
   - `schedule_kodu` → `schedule_kod`
   - `et_min`/`et_max` → `et_min_mm`/`et_max_mm`
   - 5+ aydır gizli bug, her parse'de hata logluyor, ASME zenginleştirme tamamen bozuk

### Canlı Doğrulamalar

- ✅ Tersan Spool PDF (`G200-303S-BS18 5(5).S09.1.pdf`) → format `e1fb879d` (Spool) tanındı
- ✅ `[L2-FAIL]` log: `sebep: 'zorunlu_eksik: pipeline_no'`
- ✅ L3 fallback otomatik çalıştı, kullanıcı sonucu aldı (~22 sn)
- ✅ ASME fix sonrası `[boruEtTolerans]` hatası kayboldu (yeni test, 21:35+)

---

## Commit'ler (51. Oturumda)

| Hash | Mesaj |
|------|-------|
| `14693de` | Add files via upload (parserKuralIle + L3 fallback) |
| `dd4c8ec` | fix(L2): fingerprint dosya_adi_regex tie-breaker bonus +5 |
| `fec28ae` | fix(asme): boru_olculer sütun adları DB ile uyumlu hale getirildi |

CI: ✅ YEŞİL (her commit sonrası ci-son-rapor.json otomatik güncellendi)

---

## DB Değişiklikleri

```sql
-- 51 — tersan_cadmatic_spool fingerprint dosya_adi_regex
UPDATE izometri_format_tanimlari
SET fingerprint = jsonb_set(fingerprint, '{dosya_adi_regex}',
  '"^G\\d+-[\\dA-Z]+-[A-Z]+\\d+\\s+\\d+\\(\\d+\\)\\.S\\d+(?:_\\d+)?\\.\\d+\\.pdf$"'::jsonb)
WHERE id = 'e1fb879d-3f13-40ae-8684-59237e63d40f';
```

---

## 52'ye Açık Borç (önceliğe göre)

1. **`parser_kural` regex iyileştirme** — pipeline_no `\d{3}` → `[\dA-Z]+\d*` (S, A, B varyantlarını yakalasın)
2. **`_l2_meta` / `_l2_fallback` ai_api_log'a yazılması** — şu an root level'da set ediliyor, DB'ye gitmiyor → görünürlük yok
3. **Format envanter UI** — super_admin için `/admin/formatlar` sayfası
4. **5+ Tersan PDF havuzu** — parser_kural malzeme satır pattern'lerini test et (MK-50.3)
5. **"Tersan M110 Montaj Resmi" formatı** — gerçekten kullanılıyor mu? Hiç PDF görülmedi (`84c12f61` kaydı son 3 oturumda hep yanlış tanıma sonucu). Temizlik kararı 52'de.
6. **Etkileşimli format öğretme modal** — yeni format keşfedilince AI L3 sonucunu göster, parser_kural taslağı önerip kullanıcıya onaylat
7. **AI taslak üret endpoint** — L3 sonucu + 2. AI prompt → parser_kural taslağı
8. **tv() i18n eksiklikleri** — 28 uyarı, lang/tr.json + lang/en.json
9. **Hatalı kayıt aksiyonları** — kuyruk-yeniden-dene, kuyruk-sil, kuyruk-pdf-indir endpoint'leri

---

## Kritik Hatırlatmalar (51'den taşınanlar dahil)

- **`izometri-oku.js`'e DOKUNMA** (MK-49.1) — sadece ilgili fonksiyon, minimum değişiklik
- **Hassas anahtar Claude'a verme** (MK-50.1)
- **Yeni format için parser_kural yazmadan önce 3+ başarılı AI örneği** (MK-50.3)
- **Dotfile oluşturduktan sonra `ls -la` kontrol et** (MK-50.4)
- **Image-PDF formatları L2 yapamaz** (MK-50.2 — PAOR cache+L3'te kalır)
- **MK-51.1 (YENİ):** Dosya kopyalamadan önce `~/Downloads`'da MD5 + satır sayısı doğrula. 51'de `~/Downloads/izometri-oku.js` adında 3 farklı sürüm karıştı, "Add files via upload" akışı kontrolden çıktı.
- **MK-51.2 (YENİ):** Parser_kural regex'lerini en az 5 farklı gerçek dosya örneğiyle test et. 50'de 3 örnekle yazılan dosya_adi_regex kendi örnek dosyalarıyla bile eşleşmiyordu — sessiz fail.
- **MK-51.3 (YENİ):** Yeni kod yolu eklerken DB log şemasıyla uyumluluk kontrolü yap. `_l2_meta` ve `_l2_fallback` kullanıcıya gidiyor ama ai_api_log'a hiç yazılmıyor — görünürlük kayboldu.
- **MK-51.4 (YENİ):** DB schema değişikliği yapılırken kod tarafında SELECT/INSERT cümlelerini grep'le tara. `boru_olculer` sütun yeniden adlandırma 5+ ay önce yapıldı, kod hâlâ eski adları kullanıyordu — `[boruEtTolerans] hata` her PDF'te.

---

## Performans (51 doğrulamaları)

- **L2 parse (lokal):** 1-2 ms/PDF
- **L3 vision parse (canlı):** 11-25 sn/PDF
- **L2 fail → L3 fallback:** ~22 sn (L3 ile aynı, L2 anlık fail)
- **Format tanıma (fingerprint skorlama):** <100 ms/PDF
- **Hız farkı (L2 başarılıysa):** ~10,000× (deterministik vs AI)

---

## Süreç Disiplinleri (51'den)

- **Dosya kopyalama protokolü:** `~/Downloads/_arsiv/` ile eski sürümleri ayır, sonra MD5 + wc -l doğrula, sonra `cp`
- **Vercel logs zaman dilimi:** UTC saklar, 3 saat fark — `AT TIME ZONE 'Europe/Istanbul'` ile sorgula
- **DB sütun adı uyumsuzluğu:** `information_schema.columns` ile her zaman doğrula, `HINT` içeren hata mesajlarına bak (Postgres "Perhaps you meant" hint verir)
- **Fingerprint tie durumlarında:** `>` yerine niyet doğru kodlanmalı (tek bir özgün sinyalin diğer hepsini yenecek puanı olmalı)

---

## CI Son Durum

- **Build:** ✅ YEŞİL (en son `4fcb0c2` ci-son-rapor.json güncelle [skip ci])
- **Lint:** 0 hata, 22 uyarı (Faz B baseline'ı korundu)
- **Vercel:** ✅ Production = `4fcb0c2` (Current), `fec28ae` ASME fix de "Ready"

---

> 52. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
