# CLAUDE — 31. Oturum Gündemi

**Tema:** Bucket PRIVATE Geçişi — Faz 3-6 (30'dan devir)
**Tahmini süre:** 2-3 saat
**Öncelik:** 🔴 Yüksek (müşteri öncesi KRİTİK güvenlik, 30'dan yarım)
**Durum:** Kod 30'da yazıldı, canlı test + bucket toggle + frontend migration kaldı

---

## 🎯 Bu Oturumun Amacı

30'da iki faz tamamlandı: (1) envanter + DB/bucket temizlik, (2) `api/dosya-url-al.js` yazıldı + GitHub'a yüklendi. Ama Vercel rate limit yüzünden canlı test yapılamadı. 31'de kaldığımız yerden devam: canlı test → bucket PRIVATE → frontend migration → test → kapanış.

---

## 🚦 Oturum Başı Kontroller (Ritüelden Sonra)

**1. Vercel Rate Limit Durumu**
- Dashboard → `arespipe` → Deployments sekmesi
- Son deploy yeşil mi? Kota açıldı mı?
- `vercel.json ignoreCommand` devreye girdi mi? (Sonraki `.md`-only commit Vercel'i tetiklememeli)

**2. Son Commit'lerin Vercel'de Durumu**
- `package.json` commit'i build oldu mu?
- `api/dosya-url-al.js` commit'i deploy oldu mu?
- Hata varsa Functions logs'a bak

---

## 📋 Planlanan 4 Fazlı Akış

### Faz 3 — Canlı API Testi (~20 dk)

**Önce endpoint'in varlığını teyit:**

```bash
curl -i https://arespipe.vercel.app/api/dosya-url-al -X OPTIONS
```

Beklenen: 200 OK + CORS header'ları.

**Pozitif test — süper admin ile:**

Tarayıcıda `arespipe.vercel.app`'e giriş yap (super_admin hesap). Console'da:

```javascript
const { data: { session } } = await ARES.supabase().auth.getSession();
const token = session.access_token;
const r = await fetch('/api/dosya-url-al', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ yol: '00000000-0000-0000-0000-000000000001/test.jpg' })
});
console.log(r.status, await r.json());
```

Beklenen: 404 DOSYA_YOK (yol formatı doğru ama bucket'ta dosya yok, temiz başladık).

**Negatif test — yanlış tenant:**

Body'yi değiştir: `{ yol: 'aaaa0000-0000-0000-0000-000000000001/test.jpg' }` (başka UUID)
Beklenen: super_admin ise 404 (bypass aktif), normal user ise 403 TENANT_UYUSMAZLIGI.

**Bozuk yol testi:**

`{ yol: 'notauuid/test.jpg' }` → 400 YOL_GECERSIZ
`{ yol: '' }` → 400 YOL_EKSIK
Token olmadan → 401 YETKI_GEREKLI

### Faz 4 — Bucket PRIVATE (~10 dk)

Artık endpoint test edildi, çalışıyor. Bucket'ı PRIVATE'a çevirebiliriz.

1. Supabase Dashboard → Storage → `arespipe-dosyalar` → Settings (⚙️)
2. "Public bucket" toggle → OFF
3. Save
4. Teyit: Bucket ayarında "Private" yazmalı

**⚠️ Rollback hazırlığı:** Bir şey ters giderse toggle'ı ON'a çevirmek yeterli. Veri kaybolmaz, sadece erişim yöntemi değişir.

### Faz 5 — Frontend Migration (~60-90 dk)

**Adım 1 — Helper fonksiyon yaz:**

`assets/ares.js` (veya hangi dosya ana ARES namespace'i taşıyorsa) içine:

```javascript
ARES.dosyaUrlAl = async function(yol) {
  // Cache kontrolü (1 saatlik TTL)
  const cacheKey = 'dosya_url_' + yol;
  const cached = ARES._dosyaUrlCache?.[cacheKey];
  if (cached && cached.expiresAt > Date.now()) return cached.signedUrl;

  // API çağrısı
  const { data: { session } } = await ARES.supabase().auth.getSession();
  if (!session) throw new Error('Oturum yok');

  const r = await fetch('/api/dosya-url-al', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ yol })
  });

  if (!r.ok) {
    const err = await r.json();
    console.warn('[dosyaUrlAl]', err);
    return null; // Kırık görsel yerine placeholder göstermek için
  }

  const { signedUrl, expiresAt } = await r.json();

  // Cache
  if (!ARES._dosyaUrlCache) ARES._dosyaUrlCache = {};
  ARES._dosyaUrlCache[cacheKey] = { signedUrl, expiresAt: new Date(expiresAt).getTime() };

  return signedUrl;
};
```

**Adım 2 — DB'deki `dosya_url`'i YOL olarak kullanma kararı:**

Mevcut: `dosya_url` tam public URL saklıyor (`https://...supabase.co/storage/v1/object/public/arespipe-dosyalar/YOL`)
Yeni: Sadece YOL saklanmalı (`<tenant_id>/<kategori>/<parent_id>/<dosya>`)

**Karar seçeneği 31'de:**
- **(A)** DB'deki `dosya_url`'i yol'a migrate et (SQL UPDATE, regex ile public URL'den yolu çıkar)
- **(B)** Yeni kayıtlar yol saklar, eski kayıtlar tam URL kalır (frontend her iki durumu handle eder)
- **(C)** DB boşaltıldığı için konu yok — yeni yüklemeler direkt yol saklar

**Tahmin:** (C) — 30'da bucket sıfırlandı, DB de boş. Bu karar 31'de hızlıca teyit edilip geçilir.

**Adım 3 — Yükleme akışını değiştir:**

Spool detay, devre detay gibi dosya yükleyen sayfalarda:
- Şu an: `supabase.storage.from('arespipe-dosyalar').upload(...)` → sonra `getPublicUrl()` → DB'ye public URL yaz
- Yeni: `supabase.storage.from('arespipe-dosyalar').upload(...)` → DB'ye SADECE YOL yaz (publicUrl çağrısı yok)

**Adım 4 — Gösterim akışını değiştir:**

Her sayfada `<img src="${foto.dosya_url}">` pattern'i var. Bunu:

```javascript
// Eski
<img src="${foto.dosya_url}">

// Yeni
<img data-yol="${foto.dosya_url}" src="placeholder.png">
// Sonra JS ile:
document.querySelectorAll('img[data-yol]').forEach(async img => {
  const url = await ARES.dosyaUrlAl(img.dataset.yol);
  if (url) img.src = url;
});
```

**Etkilenen sayfalar (sıra — ilk test, sonra yaygınlaştır):**

1. `spool_detay.html` — en yoğun foto kullanıcısı, ilk burada test (muhtemelen 1 saat)
2. `devre_detay.html` — not fotoğrafları
3. `kesim.html`, `bukum.html`, `markalama.html` — operasyon sayfaları
4. `kalite_kontrol.html` — KK fotoğrafları
5. `sevkiyatlar.html` — sevkiyat belgeleri
6. `admin/panel.html` — feedback fotoğrafları (13.04 tarihli bug'ın çözüm yeri)
7. `mobile/src/screens/` — Spool detay ve fotoğraf gösteren component'ler (varsa)

**Not:** Mobil React'te foto gösterimi çok sınırlı olabilir (%5 implementasyon). Mobil 31'in kapsamı içinde olmayabilir, 34+'a kayabilir. Cihat'la teyit edilecek.

### Faz 6 — Kapsamlı Test (~30 dk)

**Test 1 — Süper admin:**
- Kendi tenant'ının fotoğrafı → görünür
- Başka tenant'ın fotoğrafı (test için 2. tenant dosya yükle) → görünür (super_admin bypass)

**Test 2 — Normal kullanıcı:**
- Kendi tenant'ı → görünür
- Başka tenant manipülasyonu (URL/body değiştir) → 403 TENANT_UYUSMAZLIGI

**Test 3 — Expiration:**
- Signed URL al, kopyala, 1 saat sonra tarayıcı adres çubuğuna yapıştır → kırık

**Test 4 — Cache:**
- Aynı sayfayı 2 kez aç → network tab'da 2. seferde `/api/dosya-url-al` çağrısı OLMAMALI (cache çalışıyor)

**Test 5 — Feedback fotoğrafı:**
- Bir sayfada geri bildirim ver + fotoğraf ekle
- Süper admin panelinden o fotoğrafı görebilmeli (13.04 bug'ı çözüm teyidi)

### Kapanış (~15 dk)

- `son-durum.md` güncelle → 31. oturum tamamlandı, 32 Sentry olacak
- `CLAUDE-SON-OTURUM.md` detay rapor
- `CLAUDE-SONRAKI-OTURUM.md` → 32. Sentry gündemi (29'un orijinal plan + 1 kayma)
- 3 dosya `present_files` ile ver

---

## ⚠️ Potansiyel Sorunlar ve Kaçınma

### Sorun 1 — Vercel rate limit hâlâ açılmadı
**Çözüm:** Oturumu ertele (32'ye), veya Vercel Pro satın al ($20/ay).

### Sorun 2 — `api/dosya-url-al.js` canlıda çalışmıyor
**Muhtemel sebep:**
- `@supabase/supabase-js` install edilmedi → Vercel build logs kontrol
- Env var eksik → Settings → Environment Variables kontrol
- Import hatası → Functions log

**Rollback:** Dosyayı silmek + revert commit'i yeterli. Bucket hâlâ PUBLIC, üretim etkilenmez.

### Sorun 3 — Frontend migration'da bir sayfa unutuldu
**Tespit:** Bucket PRIVATE olduktan sonra 403 hataları console'da görünür.
**Önlem:** 
- `grep -r "getPublicUrl\|public/arespipe-dosyalar" --include="*.html" --include="*.js"` ile tüm referansları tara
- Sayfa sayfa gözle doğrula

### Sorun 4 — Eski DB kayıtlarında `dosya_url` tam URL
**Durum:** 30'da DB boşaltıldı, bu sorun oluşmamalı.
**Ama canlı kullanıcılar varsa** (Demo Atölye dışında), eski kayıtlar bulunabilir:
```sql
SELECT COUNT(*) FROM fotograflar WHERE dosya_url LIKE 'https://%';
```
0 değilse, migration SQL'i gerekir. Muhtemelen 0 çıkacak.

### Sorun 5 — Mobil'de çalışmıyor
**Muhtemel sebep:** CORS (mobil ayrı domain)
**Çözüm:** `api/dosya-url-al.js`'de `Access-Control-Allow-Origin: *` zaten var, sorun olmamalı. Ama test edilmeli.

---

## 📊 Başarı Kriterleri (31 Sonu)

- [ ] Vercel'de `api/dosya-url-al.js` canlıda, tüm test case'leri geçiyor
- [ ] `arespipe-dosyalar` bucket'ı PRIVATE
- [ ] Web tüm sayfalarda foto gösterimi çalışıyor (signed URL ile)
- [ ] Cross-tenant erişim denemesi 403 dönüyor
- [ ] Cache çalışıyor (aynı fotoğraf için tek API çağrısı)
- [ ] `ARES.dosyaUrlAl()` helper `assets/ares.js`'de canlı
- [ ] CI yeşil, self-test bozulmadı
- [ ] son-durum.md güncel, 32. oturum Sentry planı hazır

---

## 🔗 32. Oturumdan Sonra (Güncel Plan)

| Oturum | Tema | Durum |
|---|---|---|
| 30 | Bucket PRIVATE (Faz 1-2) | ✅ (yarım) |
| **31** | **Bucket PRIVATE (Faz 3-6 devir)** | **Bu oturum** |
| 32 | Sentry entegrasyonu | 29→30→**32'ye kaydı** |
| 33 | Email sistemi | 1 kaydı |
| 34 | Staging Supabase + migration runner | 1 kaydı |
| 35 | Tenant izolasyon testleri + feature flag | 1 kaydı |

**36'dan itibaren:** Ürün dönemi (render standardı, operasyon sayfaları, mobil, Spool AI döngüsü).

---

## 🎯 Oturum İçi Disiplin (30'un Dersleri)

- **Vercel ayarları UI yerine `vercel.json`'da** — deterministik, repo-kontrollü
- **UI debugging 10 dk'yı aşıyorsa kodla çözmeye geç** — dropdown döngüsü yerine dosya yaklaşımı
- **Her iş bloğu sonunda "tamam/yarım" cümlesi** — kullanıcı yarım bilgiyle yatmasın
- **"Hızlı iş" tahminlerinde 2x buffer** — özellikle UI-bağımlı işlerde
- **Yanlış proje/ortam kontrolü** — URL bar'dan teyit standart adım
- **Yorgun kullanıcıyı sıkıştırma** — alternatif yola hemen geç

(+ 1-29'un tüm dersleri `son-durum.md` disiplin bölümünde)

---

**30. oturum sonu, 24 Nisan 2026.** Cihat yattı, Vercel kotası sabaha açılacak. 31'de ritüelden sonra direkt Faz 3 (canlı test) ile başla.
