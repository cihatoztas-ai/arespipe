# CLAUDE — 39. OTURUM GÜNDEMİ

> **Önceki oturum:** 38 (27 Nisan 2026)
> **Tema önerisi:** Aşama C + Aşama D + Pre-A.3 (Ekran 2 odaklı tamamlama)
> **Tahmini süre:** 3-4 saat (ortalama)

---

## Açılış Ritüeli (CLAUDE.md — 7 KONTROL)

**1. Git Sync**
```bash
cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
```

**2. CI Rengi**
GitHub Actions sekmesi → AresPipe Kod Kalite Kontrolü → yeşil mi?

**3. Son Durum**
`son-durum.md` proje dosyasından oku — 38 sonu durumu net mi?

**4. Bugünkü Plan**
Bu dosyadaki sırayı takip et. Cihat sapma istemiyor: *"sıradan gidelim bu batch sayfasını tamamlamaya odaklanalım."*

**5. Geri Bildirim**
`admin/panel.html` Geri Bildirim sekmesi → açık (yeni + inceleniyor) kaç feedback?

**6. Kredi**
Anthropic console → kredi var mı? Bu oturumda PAOR yeniden test edilebilir (~$0.03), yeni 12 sütunluk BOM görmek için.

**7. Backend Sağlık**
```bash
curl -X POST https://arespipe.vercel.app/api/izometri-oku \
  -H "Content-Type: application/json" -d '{}'
```
Beklenen: `{"error":"tenant_id zorunlu"}` veya benzeri 400 hatası.

---

## Cihat'ın Direktifi (38 Kapanışında)

> *"sıradan gidelim bu batch sayfasını tamamlamaya odaklanalım. paor batch işi tamamlanınca deneriz."*

**Yorum:** Yeni özellik / yeni alan açma yok. 38'de Ekran 2 canlıya çıktı, 39 onun **akışını tamamlama** oturumu. PAOR yeni test sırada DEĞİL — Ekran 2 fonksiyonel olduğunda son test yapılır.

---

## Bugünün Sırası (Cihat'ın Önceliği Korunarak)

| # | İş | Süre | Öncelik |
|---|---|---|---|
| 1 | tr.json web upload (38'in borcu) | 5 dk | KRİTİK |
| 2 | Aşama C — Ekran 1 demo modu kapatma + İncele linki | 40 dk | YÜKSEK |
| 3 | Aşama D — i18n eksiklerini topla (CI uyarıları) | 30 dk | YÜKSEK |
| 4 | Devre/Spool Oluştur endpoint (`/api/izometri-onayla`) | 1.5 saat | YÜKSEK |
| 5 | Pre-A.3 çoklu sayfa dispatcher (ihtiyaç olursa) | 45 dk | DÜŞÜK |
| 6 | `vercel.json` ignoreCommand kalıcı fix | 30 dk | DÜŞÜK |
| 7 | PAOR yeni test (12 sütunluk BOM kanıtı) | 5 dk | OPSİYONEL |

**Toplam ~4 saat. 1-4 zorunlu, 5-7 opsiyonel.**

---

## 1. tr.json Web Upload (5 dk — KRİTİK)

38'de yapılamadı (mv komutu Downloads'taki yanlış dosyayı buldu, kurtarma yapıldı). Yapılması gereken:

**Yöntem:** GitHub web arayüzü (38'de en sağlam yol bu olduğu kanıtlandı).

1. Tarayıcıda aç: https://github.com/cihatoztas-ai/arespipe/blob/main/lang/tr.json
2. ✏ Edit (kalem ikonu)
3. Tüm içeriği seç (Cmd+A) → sil
4. Yeni içeriği yapıştır (Cihat'ın Downloads'taki `lang-tr-v38v2.json` dosyasından)
5. Commit message: `feat(i18n): tr.json izbi_* + izbi_bom_* anahtarlari (38)`
6. Direct commit to main → ✓

**Doğrulama:**
```bash
cd ~/Desktop/arespipe
git pull
grep -c '"izbi_' lang/tr.json
```
Beklenen: **79**.

CI yeşillenmeli, I18N_EKSIK uyarıları **66 azalmalı** (yeni eklenenler için).

---

## 2. Aşama C — Ekran 1 Demo Modu Kapatma (40 dk — YÜKSEK)

**Problem:** `izometri-batch.html` (Ekran 1) hâlâ demo modda, gerçek batch oluşturmasına `İncele →` butonu yönlendirmiyor.

**Yapılacaklar:**

### 2.1 — Demo Modu Tespit Et
```bash
grep -n "demo\|DEMO\|sahte\|fake\|mock" izometri-batch.html | head -20
```

Demo veri kaynaklarını bul. Genellikle `_demoSpoollar()` veya `if (DEMO_MODE)` benzeri yapı vardır.

### 2.2 — Demo Verisini Sil
- Demo array'ini sil
- `if (DEMO_MODE)` koşulunu kaldır
- Gerçek backend çağrısını aktif et (`fetch('/api/izometri-oku', ...)`)
- Loading state'i koru (PDF yüklenirken kullanıcıyı bekletmek lazım, ~30 sn)

### 2.3 — İncele Linki Ekle
Batch tamamlandığında (response geldikten sonra):
```js
window.location.href = `izometri-batch-incele.html?batch=${batchId}`;
```

VEYA yeni bir tablo satırı + buton:
```html
<a href="izometri-batch-incele.html?batch=${b.id}" class="btn btn-primary">
  İncele →
</a>
```

### 2.4 — Lint Kontrol
```bash
node .github/kontrol.js --self-test
```

Yeni demo kapatma sonrası G-03 / FLASH_DARK / I18N_EKSIK kuralları temiz mi?

---

## 3. Aşama D — i18n Eksiklerini Topla (30 dk — YÜKSEK)

**Bağlam:** 37 sonu CI 22 uyarı vardı. 38'de 66 yeni anahtar eklendi (izbi_* için tr.json'da). Ama:
- `devre_detay.html`: 5 uyarı (`dv_load_error`, `dv_no_change`, `dv_dok_open`, `dv_dok_file_required`, vb.)
- `izometri-batch.html`: 8 uyarı (`izb_format_bilinmeyen`, `izb_man_onay_kucuk`, `izb_durum_man_onay`, vb.)
- `spool_detay.html`: 1 uyarı (`sp_doc_file_req`)

**Yapılacaklar:**
1. `node .github/kontrol.js --self-test` çıktısından eksik anahtar listesini çıkar
2. Hepsi için tr.json + en.json + ar.json'a karşılık ekle
3. Alfabetik sıralı kayıt
4. CI yeşil olunca commit

**Hedef:** I18N_EKSIK uyarı sayısı **0**'a düşsün.

---

## 4. Devre/Spool Oluştur Endpoint (1.5 saat — YÜKSEK)

**Problem:** Ekran 2'deki "Devre/Spool Oluştur" butonu şu an placeholder modal. Gerçek implementasyon gerekli.

**Endpoint:** `POST /api/izometri-onayla`

**Akış:**
1. Frontend gönderir: `{ batch_id, secilen_spool_indexleri (opsiyonel — boşsa hepsi onaylanır) }`
2. Backend okur: `izometri_batch_kayitlari` → `sonuc_json.spoollar`
3. Sadece `durum = 'hazir'` olanları al
4. Her biri için:
   - `pipeline_no` üzerinden `devre_kayitlari` tablosunda var mı kontrol et (varsa kullan, yoksa oluştur)
   - `spool_kayitlari` tablosuna yeni satır ekle (devre_id, spool_no, dn, et_mm, malzeme, vb.)
   - `bom_kayitlari` tablosuna malzeme listesi (PIPES + FITTINGS + FLANGES) ekle
5. Batch'i `durum = 'devre_olusturuldu'` ile güncelle
6. Response: `{ ok: true, devre_sayisi, spool_sayisi, malzeme_sayisi }`

**Frontend güncellemesi:**
- Modal'da gerçek API çağrısı
- Başarı toast: "X devre, Y spool oluşturuldu"
- Otomatik yönlendirme: `aktif-devreler.html?devre=...`

**Lint:** Yeni tablo INSERT'leri yazmadan ÖNCE CHECK constraint kontrolü yap (G-13):
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('devre_kayitlari'::regclass, 'spool_kayitlari'::regclass, 'bom_kayitlari'::regclass)
  AND contype = 'c';
```

---

## 5. Pre-A.3 Çoklu Sayfa Dispatcher (45 dk — DÜŞÜK)

**Bağlam:** 37'de tasarlandı, 38'de "PAOR 3 sayfa zaten çalışıyor, üretimde 50 sayfa yok" diye bırakıldı.

**Şu an gerek var mı?** Cihat *"sıradan gidelim"* dedi — eğer 4 ve sonraki maddeler bittiyse buraya zaman var demektir. Yoksa 40'a.

**Akış:**
- ≤3 sayfa: tek istekle dispatch (mevcut)
- 4-15 sayfa: paralel (Promise.all, max 5 eşzamanlı)
- 16+ sayfa: sıralı (rate limit koruması)

**Kullanılacak kütüphane:** `pdf-lib` (zaten mimari kararda — K12)

```js
import { PDFDocument } from 'pdf-lib';

async function pdfBol(pdfBase64) {
  const pdfDoc = await PDFDocument.load(Buffer.from(pdfBase64, 'base64'));
  const sayfaSayisi = pdfDoc.getPageCount();
  const sayfalar = [];
  for (let i = 0; i < sayfaSayisi; i++) {
    const yeniDoc = await PDFDocument.create();
    const [sayfa] = await yeniDoc.copyPages(pdfDoc, [i]);
    yeniDoc.addPage(sayfa);
    sayfalar.push(Buffer.from(await yeniDoc.save()).toString('base64'));
  }
  return sayfalar;
}
```

Sonra dispatch politikası:
```js
if (sayfalar.length <= 3) {
  return await tekIstekDispatch(pdfBase64);
} else if (sayfalar.length <= 15) {
  return await paralelDispatch(sayfalar, 5);
} else {
  return await siraliDispatch(sayfalar);
}
```

---

## 6. vercel.json ignoreCommand Kalıcı Fix (30 dk — DÜŞÜK)

**Bağlam:** 38'de devre dışı bıraktık (`"$schema": "..."` yer tutucu satırla değiştirdik). Şu an her commit'te build çalışıyor — gereksiz ama zarar yok.

**İstenen davranış:** Sadece `.github/`, `docs/`, `*.md` değişikliklerinde build atla.

**Doğru regex (ileri-geri test edilmeli):**
```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- ':!.github' ':!docs' ':!*.md'"
}
```

Mantık: `git diff --quiet` → eğer fark **yok** ise exit 0 (skip), eğer fark **var** ise exit 1 (build).

**Test yöntemi:**
1. Sadece bir markdown dosyası değiştiren commit at
2. Vercel build atladı mı? (Skip)
3. Sonra bir kod dosyası değiştiren commit at
4. Build çalıştı mı? (Run)

İki test de doğru çıkarsa kalıcı.

---

## 7. PAOR Yeni Test (5 dk — OPSİYONEL)

**Sadece kredi varsa + zaman varsa.**

12 sütunluk BOM'un canlıda dolu görünmesi için PAOR'u tekrar yükle:
```bash
cd ~/Downloads
curl -X POST https://arespipe.vercel.app/api/izometri-oku \
  -H "Content-Type: application/json" \
  --data-binary @test_paor.json --max-time 120 \
  -o paor_cevap_v2.json
```

Yeni `batch_id` çıkar, sayfayı aç:
```
https://arespipe.vercel.app/izometri-batch-incele.html?batch=YENI_BATCH_ID
```

**Beklenen:**
- BOM tablosunda 12 sütun
- `kod` (M1, M2...) doldu
- `dis_cap_mm`, `et_mm` ARES_BORU lookup'tan
- `sertifika_tipi` ve `malzeme_notu` PAOR'da muhtemelen null (3.2 sertifika yazmıyor)
- `agirlik_kg` muhtemelen null (PAOR'da ağırlık sütunu yok), `—` ile gösterilir

**Maliyet:** ~$0.03

---

## Özel Notlar

### Cihat'ın Profili (38'de Tekrar Doğrulandı)
- **Sapmama disiplinine sadık:** "sıradan gidelim" dedi — bu oturumda yeni özellik açma talebi olmazsa, yeni özellik açma.
- **Net karar talebi:** "1a 2b" gibi tek satırlık cevaplar bekler. Uzun ritüele direnir.
- **Stratejik müdahale:** Mola sonrası `spool_detay.html` örneği ile BOM'u profesyonelleştirmek istedi. Beklenen: bu oturumda da benzer geri bildirimler olabilir, hazır ol.
- **Kapatma talebi:** "kapanışa gidelim" dediğinde kapat, fazla ekleme yapma.

### Vercel Tehlike Bölgesi
- 38'de Vercel ~1.5 saat zaman kaybettirdi. Bu oturumda dikkat:
  - Push sonrası Deployments sayfasını kontrol et
  - Yeni commit görünmüyorsa **manuel redeploy** yapılabilir (Settings/Git üzerinden Disconnect/Reconnect SON ÇARE)
  - `ignoreCommand` şu an devre dışı — her commit build edilir, sürpriz olmamalı

### Yanlış Dosya Yüklemesi Tehlikesi
38'de iki kez tekrarlandı. Önlem:
- Yeni dosyaları **versiyonlu isimle** teslim ettim (`EKRAN2-incele-v2.html`)
- Cihat `mv ~/Downloads/...` öncesi `wc -l` ile boyut kontrolü yapsın
- `git diff --stat` sayılarını **commit etmeden önce** doğrula
- Felaket sayıları (örn. `792 deletions`) görünce DURDUR, geri al, yeniden başla

### CHECK Constraint G-13 Uyarısı
Devre/Spool Oluştur endpoint'i (Madde 4) yazmadan önce CHECK constraint sorgusu çalıştır. 38'de `ai_api_log` örneğindeki gibi sürpriz olmasın.

---

## Açılış Mesajı Önerisi (39 İlk Mesajına)

Cihat tipik açılışını yapacak (`yeni oturuma geçelim` veya `selam claude` benzeri).

Cevap şablonu:
```
38 sonu durum: ...
Bugün öncelik (Cihat'ın direktifine sadık): tr.json web upload + Aşama C + Aşama D + Devre/Spool endpoint.

İlk iş: tr.json web upload. Hâlâ Downloads'taki `lang-tr-v38v2.json` orada mı?
ls -la ~/Downloads/ | grep lang-tr
```

Sonra sırayla.

---

## Kapanış Hedefi (39 Sonu)

Bu maddeler tamamlandığında 39 başarılı:
- ✅ tr.json canlıda (1592 anahtar)
- ✅ Ekran 1 demo modu kapalı, İncele linki çalışıyor
- ✅ Aşama D: I18N_EKSIK uyarı 0
- ✅ `/api/izometri-onayla` endpoint canlıda, Ekran 2'den çalışıyor
- ✅ PAOR'dan başlayan akış: PDF yükle → Ekran 2 incele → Devre Oluştur → aktif devreye dönüş

Bu olunca Cihat tersanede **gerçek bir izometri akışını uçtan uca test edebilir.** 40 ya da 41 oturumu canlı pilot olur.

---

> Bu dosya 38 kapanışında oluşturuldu. 39 başında ilk okunacak.
