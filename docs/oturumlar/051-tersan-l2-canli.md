# 51. Oturum — Tersan L2 Canlı Entegrasyon (1 Mayıs 2026)

> 📜 **KALICI ARŞİV** — Bu dosya 53. oturumda `docs/oturumlar/`'a taşındı. Üzerine yazılmaz, sadece okunur. Gelecekte "51'de ne yapmıştık?" sorusunun kanonik cevabı burası.

> **Durum:** ✅ Hedef başarıldı + bonus iş.
>
> 50. oturumun L2 prototipi canlıya bağlandı. L2 fail → L3 fallback mekanizması canlıda doğrulandı. Bonus olarak 5+ aydır gizli çalışan ASME helper bug'ı temizlendi.

---

## Hedef

51'in ana hedefi: 50'de yazılan L2 deterministik parser'ı (`lib/l2-parser.js`) `api/izometri-oku.js`'in `parserKuralIle` STUB'ına bağlamak ve canlıda Tersan PDF'leri ile doğrulamak.

CLAUDE-SONRAKI-OTURUM.md'de "3 satır iş" yazıyordu, gerçekte 5-6 satır + iki ek bug daha çıktı:
- Fingerprint tie-breaker bug'ı (47.B'den beri sessiz)
- ASME helper sütun adı bug'ı (5+ ay öncesi DB migration sonrası)

---

## Yapılanlar (Sıralı)

### 1. `parserKuralIle` STUB → Gerçek L2 Bağlandı

**Eski (STUB):**
```javascript
async function parserKuralIle({ pdf_base64, dosya_adi, formatBilgisi }) {
  return { ok: false, error: 'parser_kural ile parse henuz aktif degil (38)', http_status: 501 };
}
```

**Yeni:**
```javascript
async function parserKuralIle({ pdf_base64, dosya_adi, formatBilgisi }) {
  try {
    const buffer = Buffer.from(pdf_base64, 'base64');
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text || '';
    if (!text.trim()) {
      return { ok: false, sebep: 'pdf_text_bos', parser_seviye: 'l2_failed', http_status: 200 };
    }
    const { parse } = await import('../lib/l2-parser.js');
    const sonuc = parse(text, formatBilgisi.parser_kural);
    if (sonuc.ok) {
      return {
        ok: true,
        spoollar: sonuc.parsed?.spoollar || [],
        ham_cevap: sonuc.parsed,
        _l2_meta: { /* parser_seviye, alan_match_orani, ... */ },
      };
    }
    return { ok: false, sebep: sonuc.sebep, parser_seviye: 'l2_failed', http_status: 200 };
  } catch (e) {
    return { ok: false, sebep: 'l2_exception:...', parser_seviye: 'l2_failed', http_status: 200 };
  }
}
```

### 2. Çağrı Yerinde L3 Fallback

```javascript
} else if (formatBilgisi.format_id && formatBilgisi.parser_kural && Object.keys(formatBilgisi.parser_kural).length > 0) {
  parseSonuc = await parserKuralIle({ pdf_base64, dosya_adi, formatBilgisi });
  if (!parseSonuc.ok && parseSonuc.parser_seviye === 'l2_failed') {
    console.warn('[L2-FAIL]', { format_id, format_adi, dosya_adi, sebep });
    parseSonuc = await visionAIParse({ /* ... */ });
    if (parseSonuc.ok) {
      parseSonuc._l2_fallback = { l2_failed: true, l2_sebep };
    }
  }
}
```

### 3. Fingerprint Tie-Breaker Bug Tespiti ve Fix

İlk canlı testten sonra şaşırtıcı sonuç: yüklenen Tersan Spool PDF'leri **`84c12f61` (Tersan M110 Montaj Resmi / Isometry)** olarak tanındı, **`e1fb879d` (Tersan M110 İmalat Resmi / Spool)** değil. Halbuki parser_kural sadece İmalat Resmi'nde dolu.

**Sebep:** İki formatın 5 fingerprint sinyalinden 4'ü aynı:
- ulke: TR ✓
- tersane: Tersan Shipyard ✓
- baslik_regex: "Malzeme Listesi" ✓
- tablo_baslik_regex: "Cut & Bending Info" ✓
- pdf_uretici_anahtar: Cadmatic + Piping Isometrics & Spools ✓

Tek fark: `dosya_adi_regex`. Spool: `^[A-Z]\d+-\d+-\d+-P\d+\s+...`, Isometry: `^M\d+-\d+-\d+\.\d+\.pdf$`. İkisi de gerçek dosya `G200-303S-BS18 5(5).S09.1.pdf` ile eşleşmiyor (`P\d+` ve `M\d+` yok).

Sonuç: 4 sinyalden 3'ü aynı, ikisi 3 puan alıyor. `fingerprintSkor`'da `if (skor >= ESIK && skor > enIyiSkor)` — eşitlikte ilk gelen kazanıyor (DB sıralama şansı).

**Fix:** `dosya_adi_regex` eşleşmesi tek başına `+5` puan versin (1 yerine). Diğer 3 sinyalin toplam puanı 3, dosya adı eşleşen format kesin kazanır.

```javascript
// SİNYAL 1: dosya_adi_regex (51: tie-breaker bonus, 47.B yorumundaki niyet)
if (re.test(ipucu.dosya_adi)) skor += 5;  // önceden +1 idi
```

### 4. Spool Fingerprint Dosya Adı Regex Düzeltmesi

Tie-breaker fix'inden sonra hâlâ Isometry kazanıyordu. Sebep: **Spool fingerprint'inin dosya_adi_regex'i kendi örnek dosyalarıyla bile eşleşmiyordu.**

50'nin yazdığı: `^[A-Z]\d+-\d+-\d+-P\d+\s+\d+\(\d+\)\.S\d+\.\d+\.pdf$`

Bu `-P\d+` parçası yanlış. Gerçek dosyalar `-BS15`, `-BS18` gibi varyantlar içeriyor (`-[A-Z]+\d+`). 50'de 3 örnekle yazıldı, "kabaca uyar" varsayıldı, hiç test edilmedi → sessiz fail.

**Yeni regex:**
```
^G\d+-[\dA-Z]+-[A-Z]+\d+\s+\d+\(\d+\)\.S\d+(?:_\d+)?\.\d+\.pdf$
```

7 gerçek dosyayla test edildi:
- `G200-303-BS15 3(5).S06.1.pdf` ✓
- `G200-303-BS15 4(5).S08.1.pdf` ✓
- `G200-303S-BS18 5(5).S10.1.pdf` ✓ (`303S` varyantı)
- `G200-303-BS15 3(5).S03_1.1.pdf` ✓ (`_1` opsiyonel)
- `M110-303-BS15.1.pdf` ✗ (Isometry'e bırakılır)
- `11D-PAOR-50600-101409-A.pdf` ✗ (PAOR'a bırakılır)

DB'de `UPDATE izometri_format_tanimlari` ile uygulandı.

### 5. ASME Helper Sütun Adı Bug Tespiti ve Fix

Canlı testte log'da:

```
[supaFetch] hata: boru_olculer?...select=et_kalinligi_mm,... 400
column boru_olculer.et_kalinligi_mm does not exist
[boruEtTolerans] hata: Supabase 400: ...
```

`boru_olculer` tablosu DB'de **var**, ama 5+ ay önce sütun adları değişmiş, kod güncellenmemiş. Bug 51 ile ilgili değil ama her PDF parse'inde tetikleniyor — Excel raporlardaki "Malzeme alani bos" uyarısının gizli sebeplerinden biri.

**12 sütun referansı düzeltildi (`api/izometri-oku.js`):**

| Kod (Eski) | DB (Doğru) |
|-----------|-----------|
| `et_kalinligi_mm` | `et_mm` |
| `schedule_kodu` | `schedule_kod` |
| `et_min` | `et_min_mm` |
| `et_max` | `et_max_mm` |

Düzeltilen yerler: `boruOlcuBul` helper return + DB SELECT, `boruEtTolerans` SELECT + filter, `asmeFallbackDoldur` field okuma, `halusinasyonFiltresi` Madde 3 et toleransı kontrol.

---

## Canlı Test Sonuçları

| Saat | Test | Format Tanındı | parser_seviye | Sonuç |
|------|------|----------------|---------------|-------|
| 18:13 UTC | Tersan S09 (eski kod) | `84c12f61` (Isometry) ❌ | l3 | Yanlış format → düz L3 |
| 21:13 TR (sonra) | Tersan S09 (yeni kod) | `e1fb879d` (Spool) ✓ | l3 (l2_failed → fallback) | Doğru format, L2 fail tespit edildi, L3 fallback çalıştı |
| 21:35 TR (sonra) | Tersan PDF | `e1fb879d` ✓ | l3 | ASME hata yok, temiz |

L2 fail sebebi: **`zorunlu_eksik: pipeline_no`**. parser_kural'daki `pipeline_no` regex'i `(G\d{3}-\d{3}-[A-Z0-9]+)` — 3 rakam dayatıyor, "303**S**" yakalayamıyor. Aynı bug pattern'i (5+ örnek olmadan yazılmış regex). 52'de düzeltilecek.

---

## Veriyle Tasarım Hatırlatması

51 boyunca üç defa MK-50.3 ihlali görüldü:
1. Spool dosya_adi_regex (3 örnek, kendi örnekleriyle bile fail)
2. parser_kural pipeline_no regex (3 örnek, "303S" varyantı kaçtı)
3. Tüm parser_kural alanları potansiyel olarak benzer şekilde dar

**Yeni kural önerisi (MK-51.2):** Parser_kural regex'leri en az 5 farklı gerçek dosya örneğiyle test edildikten sonra commit'lenmeli.

---

## Süreç Olayları

### Dosya Kopyalama Krizi

51'in başında bir Claude'un verdiği güncel `izometri-oku.js`, Cihat'ın `~/Downloads`'da zaten bulunan eski bir sürümle çakıştı. `cp ~/Downloads/izometri-oku.js api/izometri-oku.js` yanlış (eski) dosyayı kopyaladı, **282 satır silindi** (cache mekanizması, pdf-parse import'u, vs.). `git push` reddedildi (uzakta yenisi vardı), `git reset --hard` ile lokal commit atıldı.

**MK-51.1 (yeni):** Dosya kopyalamadan önce `~/Downloads`'da:
1. Eski sürümü `_arsiv/` klasörüne taşı
2. MD5 + satır sayısı doğrula (Claude verdiği hash ile eşleşmeli)
3. Sonra `cp`

51'in geri kalanında her dosya transferinde bu protokol uygulandı, problem tekrarlamadı.

### "Add files via upload" Akışı Karışıklığı

Cihat parallel olarak GitHub Web UI üzerinden de dosya yüklüyordu. Hem `git push` hem web upload aynı anda çalışınca commit historyde "Add files via upload" satırları yer aldı, push reddedildi, rebase'de "skipped previously applied commit" uyarıları çıktı.

**Karar:** Bundan sonra sadece terminal git akışı kullanılacak, GitHub web UI upload bırakılacak.

### Saat Dilimi Sorunu

`ai_api_log.olusturma_at` UTC saklar, Cihat Türkiye saatiyle düşünüyor. SQL filtresi `> '19:00:00+00'` (UTC) yazıldığında 22:00 TR sonrası kayıtları filtreliyordu, "yeni log gelmiyor" yanılgısı doğdu. **`AT TIME ZONE 'Europe/Istanbul'`** ile sorgula → her iki saat de görünür.

### `_l2_meta` / `_l2_fallback` DB Görünürlük Bug'ı

Bizim eklediğimiz fallback meta `parseSonuc` root level'da set ediliyor, ama `cevap_full = parsed` (sadece AI cevabı) olduğu için DB'ye gitmiyor. Yani kullanıcı response'unda görünür ama log'da görünmez. 52'nin işi.

---

## DB Operasyonları

```sql
-- Spool fingerprint dosya_adi_regex düzeltme
UPDATE izometri_format_tanimlari
SET fingerprint = jsonb_set(fingerprint, '{dosya_adi_regex}',
  '"^G\\d+-[\\dA-Z]+-[A-Z]+\\d+\\s+\\d+\\(\\d+\\)\\.S\\d+(?:_\\d+)?\\.\\d+\\.pdf$"'::jsonb),
    guncelleme_at = now()
WHERE id = 'e1fb879d-3f13-40ae-8684-59237e63d40f';
```

---

## Commit'ler

| Hash | Mesaj | Etkisi |
|------|-------|--------|
| `14693de` | Add files via upload | parserKuralIle bağlama + L3 fallback |
| `dd4c8ec` | fix(L2): fingerprint dosya_adi_regex tie-breaker bonus +5 (51) | +5 puan tie-breaker |
| `fec28ae` | fix(asme): boru_olculer sütun adları DB ile uyumlu hale getirildi (51) | 12 sütun referansı |

CI: ✅ YEŞİL (her commit sonrası otomatik ci-son-rapor.json güncellemesi)

---

## 52'ye Devreden Borçlar

Detay için `CLAUDE-SONRAKI-OTURUM.md`. Kısaca:
- parser_kural regex iyileştirme (öncelik 1, kullanıcı L2'nin gerçekten çalıştığını hâlâ görmedi)
- `_l2_meta`/`_l2_fallback` ai_api_log'a yazılması (görünürlük)
- Format envanter UI
- "Tersan M110 Montaj Resmi" formatı temizlik kararı

---

## Performans

- **L2 deterministik parse (lokal):** 1-2 ms/PDF
- **L3 vision parse (canlı):** 11-25 sn/PDF
- **L2 fail → L3 fallback:** ~22 sn (kullanıcıya kesintisiz, L2 anlık fail)
- **Format tanıma:** <100 ms/PDF
- **Hız farkı (L2 başarılı senaryo):** ~10,000× (deterministik vs AI)
- **L2 fail oranı (51 tarihinde):** %100 (parser_kural eksik, 52'de düşürülecek)

---

> 51'den 52'ye devir. Bu dosya 53. oturumda `docs/oturumlar/` arşivine alındı, kalıcı kayıt.
