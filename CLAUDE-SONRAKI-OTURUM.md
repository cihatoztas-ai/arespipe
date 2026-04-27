# CLAUDE — 40. OTURUM GÜNDEMİ

> **Bu dosya 39 kapanışında oluşturuldu. 40 başında ilk okunacak.**

---

## 40 Açılış Mottosu

39'da öğrenilen kritik ders: **plan dosyasına körü körüne güvenme.** Bu dosya yazılırken makul bir gündem var, ama Cihat'ın 40 başında öncelikleri farklı olabilir. **Plan değişti mi sor, sonra başla.**

5 oturumda bir self-test günü → 40 değil 41 olur. Bu oturum sadece açılış ritüeli.

---

## 1. Açılış Ritüeli (CLAUDE.md gereği) (~5 dk)

5 soru zorunlu — atla yok:

```
Oturum başlangıç ritüeli. 5 kısa kontrol:

1. Şunu çalıştırır mısın ve çıktıyı yapıştırır mısın:
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5

2. GitHub Actions sekmesinde son build rengi nedir? (yeşil / sarı / kırmızı)

3. .github/son-durum.md dosyasını bana yükler misin veya içeriğini yapıştırır mısın?

4. Bugün hangi sayfayla çalışacağız? (Sayfayı söyle, açık uyarıları göstereyim.)

5. admin/panel.html → Geri Bildirim sekmesinde açık (yeni + inceleniyor durumunda) kaç feedback var? Kritik olanları (veri kaybı / güvenlik / canlı hata) kısaca özetle.
```

5 cevap geldikten sonra:
- Git temiz mi (untracked yedek dosya yok mu)
- CI yeşil mi
- son-durum.md son halinden borçları oku
- **`docs/CIHAT-PROFIL.md`'yi oku** (özellikle 39'da eklenen "yapılan iş listesi savunma olarak okunabilir" pattern'ı)
- **`docs/SPOOL-AI-VIZYON.md`'yi hatırla** — bu işin vizyona katkısı ne
- **`docs/PANO-TASARIM.md`'yi gözden geçir** — Pano implementasyonu hâlâ borçlu

---

## 2. 39 Sonrası İlk Doğrulama (~10 dk)

39 oturumunda 5 dosya yüklendi/yüklenecek (bkz. son-durum.md). Bunların CI'da yeşil olduğunu ve canlı çalıştığını teyit et.

### Kontrol komutları
```bash
# 1. Lokal güncel mi
cd ~/Desktop/arespipe && git pull origin main

# 2. Lint hatasız mı
node .github/kontrol.js --self-test 2>&1 | tail -10

# 3. I18N_EKSIK uyarı sayısı (39 hedefi: 0)
node .github/kontrol.js 2>&1 | grep -c "I18N_EKSIK"

# 4. Anahtar sayısı 1605 mi
grep -c '":' lang/tr.json && grep -c '":' lang/en.json && grep -c '":' lang/ar.json
```

Beklediğim:
- self-test: ✓ 3/3 başarılı
- I18N_EKSIK: 0
- 3 dilde 1605 anahtar

Sapma varsa önce onu düzelt, sonra ana işe geç.

---

## 3. Canlı Uçtan Uca Test (~30 dk — YÜKSEK ÖNCELİK)

39'da 5 büyük değişiklik yapıldı, hiçbiri **uçtan uca** test edilmedi. Bu test 40'ın ilk işi olmalı.

### Test Adımları

**A. izometri-batch akışı:**
1. https://arespipe.vercel.app/izometri-batch.html
2. Bir PAOR PDF yükle (Cihat'ın test PDF'i)
3. "Başla" tıkla → ~30 sn bekle
4. Beklenen: spool listesi gözüksün, format "AVEVA E3D" görünsün
5. **Kritik:** Sayfa hata vermesin, demo modu kalıntısı yok

**B. Ekran 2 yönlendirme:**
6. Sonuç tablosunda "İncele →" butonuna tıkla (manuel onay gereken bir spool için)
7. `izometri-batch-incele.html?batch=...` doğru batch_id ile açılsın
8. Spool listesi (dikey akordeon) doğru gözüksün

**C. Spool onayı:**
9. Bir spool'u onayla (durum 'hazir' olsun)
10. Üstteki "📦 IFS Excel İndir" butonu enable olsun

**D. IFS Excel export:**
11. Butona tıkla → `IFS_Malzeme_Listesi_xxxxxxxx.xlsx` indir
12. Excel'i aç, kontrol et:
    - Sayfa adı: `All`
    - 92 sütun
    - İlk 12 sütun dolu (Pipeline No, SpoolNo, Description, Dimensions, Material, vb.)
    - Geri kalan 80 sütun boş
    - Onaylanan spool'ların malzeme listesi satır satır gözüksün

**E. devre_yeni.html import:**
13. https://arespipe.vercel.app/devre_yeni.html
14. Bir tersane seç (TERSAN OLMAYAN — örn. CIBAR, etc.)
15. **IFS sekmesi görünüyor mu?** (39'un ana fix'i)
16. Tab'a tıkla, indirdiğin Excel'i sürükle-bırak
17. Beklenen toast: `✅ N satır · M pipeline · K spool`
18. Pipeline filtresi, spool listesi doğru render olsun
19. "Tümünü Aktar" tıkla → spool'lar standart sekmesine geçsin

### Test Sonucu
- Hepsi geçerse: 39 başarılı sayılır, 40 ana işine geç (Madde 4)
- Bir adım kırılırsa: Cihat'tan ekran görüntüsü iste, hızla fix
- Beklenmeyen davranış varsa kayıt et (`.github/feedback/` klasörü?)

---

## 4. Pre-A.3 — Çoklu Sayfa Dispatcher (~1.5 saat — ORTA ÖNCELİK)

**Bağlam:** 37'de tasarlandı, 38-39'da bırakıldı. PAOR'un 1-3 sayfalık olması yetiyor ama gerçek tersane PDF'leri 10-50+ sayfa olabilir.

**Akış:**
- ≤3 sayfa: tek istek (mevcut)
- 4-15 sayfa: paralel (Promise.all, max 5 eşzamanlı)
- 16+ sayfa: sıralı (rate limit koruması)

**Kullanılacak kütüphane:** `pdf-lib` (K12 mimari kararı)

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

Dispatch politikası:
```js
if (sayfalar.length <= 3) {
  return await tekIstekDispatch(pdfBase64);
} else if (sayfalar.length <= 15) {
  return await paralelDispatch(sayfalar, 5);
} else {
  return await siraliDispatch(sayfalar);
}
```

**Test:** 5 sayfalık bir test PDF (Cihat sağlamalı) ile paralel dispatch'i doğrula.

**Backend tarafı (`api/izometri-oku.js`):** Şu anki sözleşme her dosyada `dosya_sirasi`/`dosya_toplami` zaten alıyor — multipart batch yapısı hazır. Sadece dispatcher mantığı eklenecek.

---

## 5. vercel.json ignoreCommand Kalıcı Fix (~30 dk — ORTA ÖNCELİK)

**Bağlam:** 38'de devre dışı bırakıldı (`"$schema": "..."` yer tutucu). Şu an her commit'te build çalışıyor — gereksiz ama zarar yok.

**İstenen davranış:** Sadece `.github/`, `docs/`, `*.md` değişikliklerinde build atla.

**Doğru regex:**
```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- ':!.github' ':!docs' ':!*.md'"
}
```

Mantık: `git diff --quiet` → eğer fark **yok** ise exit 0 (skip), eğer fark **var** ise exit 1 (build).

**Test:**
1. `docs/test.md` dosyası oluştur, commit, push → build atla mı (skip log)
2. `index.html`'e dummy değişiklik, commit, push → build çalışsın

---

## 6. Diğer Borçlar (~bekle, 41+'a)

- **MIG_ISIM_BOZUK regex genişletme** — `^\d{3}_.+\.sql$` → `^\d{3}[a-z]?_.+\.sql$`. 38'de `006a/006b` rename ile geçici çözüldü, kalıcı çözüm bekliyor.
- **Eski izometri-batch yorumları temizlik** — `_yakinda` placeholder yorumları artık alakasız.
- **Pano implementasyonu** — `docs/PANO-TASARIM.md` 23. oturumda detaylı tasarlandı, hâlâ implementasyon bekliyor. Görev takibi + geri bildirim + oturum panosu üç sekmesi.

---

## Açılış Mesajı Önerisi (40 İlk Mesajına)

Cihat tipik açılışını yapacak (`yeni oturuma geçelim` veya `selam claude`).

Cevap şablonu:
```
40 başlıyor. Önce ritüel — 39'da öğrendiğim ders: plan dosyasına körü körüne
güvenme. Bu yüzden sıralı 5 cevaptan sonra "bugün gündem ne" sorusunu da
soracağım.

[Sonra 5 soru]
```

Sonra:
- 39 sonu durum kontrolü (CI yeşil, 5 dosya canlı)
- Canlı uçtan uca test (varsa Cihat zaten yapmıştır, raporunu iste)
- Sonraki iş: ya Pre-A.3 (çoklu sayfa) ya Cihat'ın yeni önceliği

---

## Önemli Hatırlatmalar (40'ta)

### CHECK Constraint G-13 Uyarısı
38'de `ai_api_log` örneği gibi sürpriz olmasın — yeni tabloya yazan kod yazmadan önce CHECK constraint'leri kontrol et.

### Tahmin Yasağı (39 dersi pekişti)
- Tablo adı: `information_schema.tables` ile gör
- Kolon adı: `information_schema.columns` ile gör
- API field adı: backend kodundan gör (Sözleşme yorum satırı / response oluşturma noktası)
- ARES.* helper signature'ı: `ares-store.js` görmeden tahmin etme

### Yapılan İş Listesi = Savunma (39'da öğrenilen)
Cihat "az iş yapıldı" dediğinde detaylı liste yapma. Bir sonraki adıma geç. İlerleme bilgisi gerekirse 1 cümle.

### Backend Canlı Test ≠ Frontend Canlı Test
"X canlıda" denilen şey curl ile mi yoksa frontend ile mi test edildi — netleşmeli. 38'in PAOR canlı testi sadece curl idi, 39'da frontend uyumsuzlukları çıktı.

### Cihat'ın Stratejik Soruları Sezgi Sinyalidir
"X harcar mı?", "Y eksik mi?", "Z sağlam mı?" — bu sorular yapısal bir şey sezdiğinin işaretidir. Hemen "yok" deme, listele, açıkla, karar sorusu sor.

---

## Kapanış Hedefi (40 Sonu)

Bu maddeler tamamlanırsa 40 başarılı:
- ✅ Canlı uçtan uca test geçti (PDF→AI→onay→IFS→devre_yeni)
- ✅ I18N_EKSIK uyarı 0 (CI'da teyit)
- ✅ Pre-A.3 çoklu sayfa dispatcher çalışıyor
- ✅ vercel.json ignoreCommand kalıcı çözümlü

Bu olunca tersane gerçek PDF'leri akabilir → 41 oturumu canlı pilot olabilir.

---

> Bu dosya 39 kapanışında oluşturuldu. 40 başında ilk okunacak.
