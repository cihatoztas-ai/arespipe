# CLAUDE — 33. Oturum Gündemi

**Tema:** Vercel-bağımsız iş kalemleri önde + Vercel açıldıktan sonra deferred testler
**Tahmini süre:** 1.5-2.5 saat (kapsama bağlı)
**Öncelik:** 🟢 Esnek — bekleyen testler hazır, yeni mekanik işler de hazır

---

## ⚠️ ZORUNLU OKUMA — 32. Oturum Bağlamı

32. oturumda 6 SED kapatıldı + 2 yarım kapanış var:

**Tamamlandı:** orphan temizlik, GitHub Actions v5, S1, D5, D6
**Yarım — DEPLOY BEKLİYOR:** D3 (Vercel rate limit)
**Yarım — GÖRSEL İNCELEME BEKLİYOR:** G-08 devre_detay (Cihat "tam aynı değil" dedi, somut fark belirtilmedi)

Detay: `CLAUDE-SON-OTURUM.md`. Defter güncel: `docs/SAYFA-EKSIKLERI.md`.

---

## 🎯 33. Oturum Stratejisi

**Cihat'ın talebi:** *"Vercel gerektirmeyen iş kalemlerini öne al. Yarın çalışamıyorum, bugün biraz ilerleyelim."*

→ Önce Vercel build'i tetiklemeyen klasörlerde iş yap (`.github/`, `docs/`, `migrations/`, `*.md`). Sonra Vercel açıldığında deferred testler ve UI değişiklikleri.

**Vercel ignoreCommand zaten ignore ediyor:** `.github/`, `docs/`, `*.md`. Yani bu klasörlerdeki commit'ler hem hata vermez hem rate limit harcamaz.

---

## 🚦 Oturum Başı Ritüeli (Standart)

Standart 5 soru ritüelinin yanında bu oturumda ek 2 kontrol:

1. **Vercel rate limit hâlâ açık mı?**
   - GitHub repo ana sayfasında "Vercel — arespipe" kontrolü
   - Yeşil/passing → açık, deploy çalışır
   - Hâlâ kırmızı → 24 saat dolmamış, Vercel-bağımsız işlerle devam

2. **D3 deploy doğrulaması:**
   - Tarayıcıda canlı devre detay sayfası aç → F12 console
   - Komut: `tersaneIsEmriKaydet.toString().includes('supa.from')`
   - `true` → yeni kod canlıda, D3 testi yapılabilir
   - `false` → cache temizle (Cmd+Shift+R), tekrar dene

---

## 📋 ÖNCELİKLİ — Vercel Bağımsız İşler (sırayla)

### A) D7 — devre_detay durdurma_tarihi migration + kod fix (~25-30 dk) ⭐

**Defterde 32'den devir:** `durdurma_tarihi` kolonu `devreler` tablosunda yok (`spooller`'da var). Devre durdurma tarihi takip edilemiyor — audit/raporlama için kritik açık.

**Pattern: D3'ün birebir aynısı.**

**Adımlar:**
1. Schema doğrulama:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name='devreler' AND column_name LIKE '%durdurma%';
```
Beklenen: `durdurma_sebebi` var, `durdurma_tarihi` yok.

2. Migration dosyası: `migrations/002_devreler_durdurma_tarihi_ekle.sql`
```sql
BEGIN;
ALTER TABLE devreler ADD COLUMN durdurma_tarihi TIMESTAMPTZ;
COMMIT;
```
+ Manuel SQL çalıştırma (Supabase Dashboard).

3. Kod fix (`devre_detay.html`):
   - `devreYukle`: `durdurmaTarihi:d.durdurma_tarihi||null` ekle
   - `durdurKaydet` fonksiyonunda DB UPDATE'e `durdurma_tarihi:new Date().toISOString()` ekle
   - `durdurmaKaldir` fonksiyonunda DB UPDATE'e `durdurma_tarihi:null` ekle (durdurma kalktığında temizle)
   - UI'da gösterim opsiyonel (info paneline veya tooltip — Cihat'a sor)

4. Test (Vercel açıldıktan sonra): bir spool durdur → DB'de durdurma_tarihi dolu mu kontrol et.

**Vercel etkisi:** Migration dosyası `migrations/` altında — ignore edilmez ama rate limit'e tek deploy katar (kabul edilir). Asıl `devre_detay.html` push'u Vercel rate limit açıldıktan sonra atılabilir, ya da migration ile aynı commit'e konur (1 deploy daha).

---

### B) `kurallar.json` + `CLAUDE.md` güncellemeleri (~15-20 dk)

**SED-01 kuralını formalize et** (defterde tarif var, lint'te yok):
- `kurallar.json`'a yeni madde:
  - id: SED-01
  - tarif: "Sayfa eksiklerini defter'e (`docs/SAYFA-EKSIKLERI.md`) yaz"
  - kapsam: yeni sayfa açıldığında Claude tarama yapar, eksikleri Cihat'a sunar
  - test: defter dosyasının var olması yeterli (manual self-test, otomatik değil — yarın kafa yorulur)

**32. oturum derslerini CLAUDE.md disiplin bölümüne ekle:**
- Deploy doğrulama tekniği (`fnAdı.toString().includes(...)`)
- Schema drift uçtan uca tarama (insert + read + render + map)
- Vercel push tasarrufu (mob ignoreCommand)

**Vercel etkisi:** Yok — `.github/` ve kök `*.md` ignore.

---

### C) `vercel.json` ignoreCommand genişletme (~10 dk) — Vercel açıldıktan sonra ilk push

**Hedef:** `arespipe-mob` projesi için `mobile/` klasörü değişmedikçe build skip.

**Mevcut `vercel.json`:**
```json
{
  "ignoreCommand": "git diff HEAD^ HEAD --quiet -- ':(exclude).github' ':(exclude)docs' ':(exclude)*.md'"
}
```

**Düşünce:** İki proje aynı `vercel.json`'u mu kullanıyor, yoksa Vercel dashboard'da ayrı ayrı mı tanımlı? Karar: dashboard'a bak, ya da iki ayrı `vercel.json` mantığı kur.

**En basit fix:** `arespipe-mob` Vercel dashboard'da **Settings → Git → Ignored Build Step**'e:
```bash
git diff HEAD^ HEAD --quiet -- mobile/ && exit 0 || exit 1
```
Bu kural sadece mobile/ klasörü değiştiğinde build eder. Mob hâlâ %5'te, hep build etmesi anlamsız.

**Test:** Bir non-mobile değişiklik commit'le (ör. `docs/`). arespipe build olur, arespipe-mob skip edilir.

**Vercel etkisi:** Tek seferlik kurulum, sonrası yok. Bu fix uzun vadede push başına 1 deploy düşer = limit yarıya iner.

---

### D) MProfil.jsx mockup-first (opsiyonel, ~30-45 dk)

**Defterdeki yarım iş:** 23'ten beri açık. R-10 kuralı: "kod yazmadan önce mockup".

**Bu oturumda kod YAZMA**, sadece mockup yap:
- Avatar yükleme alanı (drag-drop + file picker)
- Kişisel bilgi formu (ad, soyad, email, telefon)
- Görsel: A vs B mockup (Cihat seç)

**Vercel etkisi:** Yok — sadece görsel/markdown.

**Mockup formatı:** Markdown + ASCII layout, ya da basit HTML preview. Kod sonraki oturumda yazılır.

**Eğer Cihat'ın enerjisi varsa yapılır, yoksa atla.**

---

## 🟡 Vercel Açılmasını Bekleyenler (sırayla)

### E) D3 canlı doğrulama (~5 dk)
- Cihat tarayıcıda canlı devre_detay aç
- F12 console: `tersaneIsEmriKaydet.toString().includes('supa.from')` → `true` doğrula
- Tersane iş emri gir → kaydet → toast → F5 → değer durmalı
- Sayfadan çıkıp gel → hâlâ orada
- Boş yap, kaydet, F5 → boş kalır

### F) G-08 görsel fark inceleme (~15-30 dk) ⚠ kritik
- İki sayfa yan yana aç: `devreler.html` (referans) + `devre_detay.html` (uygulama)
- Cihat'tan **somut fark** iste — neyin "aynı değil"i:
  - Skeleton satır sayısı?
  - Shimmer hızı/parlaklığı?
  - Cascade gecikmesi (45ms farklı mı)?
  - Cascade yönü (yukarıdan aşağı vs aşağıdan yukarı)?
  - Stat shimmer renk tonu?
  - Tablo class'ı (.dt vs .data-table) → CSS specificity sorunu?

Cihat fark söyleyince fix uygulanır. Eğer "boş ver" derse defter'e "32+33'te yarım uygulama, görsel uyumsuzluk açık" notuyla bırakılır.

### G) Vercel ignoreCommand commit (~5 dk)
C maddesinin push aşaması. Test: push sonrası arespipe build olur, arespipe-mob "skipped" gösterir.

---

## ⚖️ 32'den Devir Karar Konuları (33'te tekrar gündem)

Bu kararlar 32 başında atlandı, hâlâ Cihat'ın seçimini bekliyor:

### Karar 1 — SBD-01 yaklaşımı
- **A:** Mevcut markdown defter, sayfa-merkezli yeniden yapı
- **B:** GitHub Issues + Tech Debt Sprint
- **C:** Hybrid (şimdi A, 35+ ürün döneminde B)

**Önceki tavsiye:** **C**.

### Karar 2 — 33-35 sıralaması
- **A:** Sentry öncelikli (33: Sentry, 34: Email, 35: Staging)
- **B:** G-08 yaygınlaştırma öncelikli (33-34: G-08, 35: Sentry)

**Cihat'a sorulacak tek soru:** *"Lansman tarihin (müşteri demoya hazır olmak istediğin tarih) belli mi? 1-2 ay sonraysa A, 3-4 ay sonraysa B."*

Bu kararlar 33'te alınmazsa 34'e devreder.

---

## 📋 Önerilen 33. Oturum Akışı (Vercel kapalıyken başla)

```
Saat 1 — Vercel-bağımsız işler
  ✓ Ritüel + son-durum okuma
  ✓ A) D7 migration + kod fix (Vercel açılmadıysa fix dosyada bekler, sonra push)
  ✓ B) kurallar.json + CLAUDE.md güncellemeleri

Saat 1.5 — Vercel açılış kontrolü
  → Açıldıysa: E (D3 doğrulama), F (G-08 görsel fark), G (vercel.json fix), D7 push
  → Hâlâ kapalıysa: D (MProfil mockup) veya defter detayları

Saat 2 — Karar oturumu (zaman varsa)
  ⚖ SBD-01 kararı
  ⚖ Sentry vs G-08 sıralaması

Saat sonu — Kapanış
```

---

## 🎯 Başarı Kriterleri (33 sonu)

**Minimum (Vercel kapalı kalsa bile):**
- [ ] D7 kod hazır (migration + devre_detay.html), test deploy bekler
- [ ] kurallar.json'a SED-01 eklendi
- [ ] CLAUDE.md disiplin bölümüne 32 dersleri eklendi
- [ ] Defter güncel

**Vercel açılırsa:**
- [ ] D3 canlı doğrulandı (`tersane_is_emri` kaydetme F5'te durur)
- [ ] G-08 görsel fark tespit edildi (somut madde) ya da Cihat "boş ver" dedi
- [ ] arespipe-mob build skip kuralı çalışıyor

**Bonus:**
- [ ] MProfil mockup hazır
- [ ] Karar oturumu (SBD-01 + sıralama)

---

## ⚠️ Potansiyel Engeller

### Engel 1: Vercel hâlâ kapalı
**Plan:** Vercel-bağımsız işlere odaklan (A, B, D). Deferred testleri 34'e ya da bir sonraki oturuma kaydır. D7 kod hazır kalır, Vercel açılınca push edilir.

### Engel 2: D7 schema doğrulamasında sürpriz
Eğer `durdurma_tarihi` aslında zaten varsa (defter eski olabilir), kapatılır not: "D7 zaten kapalı, defter güncellendi".

### Engel 3: G-08 görsel farkı tespit edilemiyor
Tarayıcı dev tools ile bilek bükme: iki sayfayı yan yana aç, F12 → Computed CSS karşılaştır, animasyon timing'ini incele. Yoksa: Cihat'a "screen recording yapar mısın" sor, fark videodan netleşir.

### Engel 4: Cihat enerjisi düşük
**Plan:** Sadece A (D7) yapılır, kapanış. Diğerleri 34'e.

---

## 🔗 33'ten Sonra (Plan)

| Oturum | Tema | Durum |
|---|---|---|
| 33 | **Vercel-bağımsız işler + deferred test + karar** | **Bu oturum** |
| 34 | Email sistemi | Sırada |
| 35 | Staging Supabase + migration runner | Sırada |
| 36 | Tenant izolasyon testleri | Sırada |
| 37+ | ÜRÜN DÖNEMİ — G-08 yaygınlaştırma + müşteri demo | — |

---

## 🎯 Oturum İçi Disiplin (32'nin Dersleri)

- **Plan dosyalarına ezbere uyma, gerçek schema/kod tara** — feedback kolon adları yanlıştı (32 tecrübe)
- **Schema değişikliği planlarken information_schema sorgusu zorunlu**
- **Schema drift uçtan uca tarama** — insert + read + render + map (S2 + tur/tip dersi)
- **Yanıltıcı başarı toast'ı önle** — try/catch'te toast + erken return (D6 dersi)
- **Deploy doğrulama tekniği** — `fnAdı.toString().includes(...)` (32 dersi)
- **Vercel push tasarrufu** — mob ignoreCommand, gereksiz commit'i toplu yap

(+ 1-31'in tüm dersleri `son-durum.md` disiplin bölümünde)

---

## 📌 Cihat'ın Talimatı (32 sonu, doğrudan alıntı)

> "Sen sohbeti kapat, bir sonraki sohbete bana vercel gerektirmeyen iş kalemlerini öne al. Yarın zaten çalışamıyorum. Bugün biraz ilerleyelim."

→ 33'ün ilk 90 dakikası A + B (Vercel-bağımsız), Vercel açılırsa E + F + G, kalan zaman D ya da kararlar.

---

**32. oturum kapanışı:** 25 Nisan 2026 Cumartesi. 33. oturum: aynı gün ilerisi ya da sonraki uygun zaman.
