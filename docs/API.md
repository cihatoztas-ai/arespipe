# API Endpoint'leri

> AresPipe'ın sunucu-tarafı mantığı `api/*.js` klasöründe yaşar. Her dosya bir Vercel Serverless Function'dır. Bu belge endpoint'lerin **nasıl çalıştığını**, **nasıl kullanıldığını** ve **nasıl yeni endpoint ekleneceğini** anlatır.

---

## 1. Genel Prensipler

API endpoint'leri `api/` klasörü altında yaşar, **Vercel Serverless Function** olarak çalışır — her çağrı izole bir Node runtime'da yürütülür, state yok. Soğuk başlatma ~300-800 ms, sıcak çağrı ~50-200 ms arası.

### Temel Kurallar

- **İstek gövdesi:** JSON (POST metodu varsayılan)
- **Cevap gövdesi:** JSON
- **HTTP status kodları anlamlı:**
  - `200` — başarı
  - `400` — kötü istek (eksik/geçersiz parametre)
  - `401` — kimlik doğrulanmamış
  - `403` — kimlik var, yetki yok
  - `405` — method desteklenmiyor (örn. GET yerine POST beklenen endpoint'e GET)
  - `500` — sunucu hatası (beklenmeyen istisna)

### CORS

Şu anki endpoint'ler `Access-Control-Allow-Origin: *` kullanıyor — frontend Vercel'den servis edildiği için aynı origin'den çağrılıyor, ama teknik olarak public API açık kapısı olur. 30+ oturumda müşteri öncesi gözden geçirilecek; muhtemelen origin whitelisting'e geçilecek.

### Rate Limit

Şu an yok. Vercel'in platform-seviyesi genel koruması var ama uygulama-seviyesi kullanıcı başı limit yok. `api/izometri-oku.js` Anthropic API çağırıyor — orada maliyet var, ileride kullanıcı başı günlük kota eklenmeli.

### Timeout Ayarı

Her endpoint dosyasının başında Vercel config'i vardır:

```js
export const config = { maxDuration: 30 };
```

Serverless function'ın max koşma süresi. `sorgula.js` 30s (çoğu SQL hızlı), `izometri-oku.js` 60s (Claude API'ye PDF yolluyor, uzun sürebilir).

---

## 2. İstek/Cevap Formatı

### Standart İstek

```http
POST /api/<endpoint-adi>
Content-Type: application/json

{
  "alan1": "değer",
  "alan2": 42,
  "tenant_id": "uuid-burada"
}
```

`tenant_id` hemen hemen her endpoint'te zorunlu — tenant izolasyonu (Bölüm 4).

### Standart Başarı Cevabı

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ok": true,
  "data": { ... },
  "meta": { "sayi": 5, "suresMs": 124 }
}
```

Tek obje döndürülebilir, dizi döndürülebilir — `data` içeriği endpoint'e göre değişir.

### Standart Hata Cevabı

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "tenant_id gerekli",
  "detay": "İstek gövdesinde tenant_id UUID değeri eksik."
}
```

`error` kısa, makine-okunabilir; `detay` (opsiyonel) insan-okunabilir.

### OPTIONS Preflight

CORS preflight için her endpoint'in başında:

```js
if (req.method === 'OPTIONS') return res.status(200).end();
```

---

## 3. Endpoint Listesi

<!-- AUTO-START:endpointler -->
> Toplam 11 endpoint. Son güncelleme: 2026-05-24.

- **`api/batch-baslat.js`** — api/batch-baslat.js -- 49. oturum — _=====================================================================_
- **`api/batch-kuyruga-al.js`** — api/batch-kuyruga-al.js -- 49. oturum — _=====================================================================_
- **`api/batch-spoollari.js`** — api/batch-spoollari.js -- 49. oturum — _=====================================================================_
- **`api/dosya-url-al.js`** — Supabase Storage dosyaları için signed URL üretir — _Yetki: JWT'den tenant_id okunur, yol ile eşleşmeli (cross-tenant bloklanır)_
- **`api/eslestirme-backfill.js`** — Adim4 (110, MK-110.1): zaten islenmis izometri PDF'lerini kabuk spool'a baglar.
- **`api/izometri-oku.js`** — api/izometri-oku.js -- Vercel Serverless Function (Node.js) — _=====================================================================_
- **`api/kuyruk-durum.js`** — api/kuyruk-durum.js -- 49. oturum, polling endpoint — _=====================================================================_
- **`api/kuyruk-isle-excel.js`** — Wizard'a yüklenen bom_excel dokümanlarını parse eder, sonucu kuyrukta saklar. — _101. oturum (19 Mayıs 2026)_
- **`api/kuyruk-isle-izometri.js`** — Wizard'a yüklenen izometri PDF dokümanlarını parse eder, sonucu kuyrukta saklar. — _107. oturum (21 Mayıs 2026) — MK-49.B_
- **`api/kuyruk-isle.js`** — api/kuyruk-isle.js -- 49. oturum, self-trigger chain worker — _=====================================================================_
- **`api/sorgula.js`** — Doğal dil → SQL → Supabase → Türkçe cevap — _Güvenlik: sadece SELECT, tenant_id zorunlu_
<!-- AUTO-END:endpointler -->

---

## 4. Güvenlik ve Tenant İzolasyonu

### `SUPABASE_SERVICE_KEY` — Süper Güç, Dikkatli Kullan

Backend endpoint'ler Supabase'e **service key** ile bağlanır — bu RLS'yi **bypass** eder, tüm tenant'ların tüm verisine erişebilir. Bu güçlü, ama her endpoint kendi güvenlik duvarını çizmek zorunda:

```js
// Her POST endpoint'inin ilk güvenlik adımı:
const { soru, tenant_id } = req.body;
if (!tenant_id) return res.status(400).json({ error: 'tenant_id gerekli' });

// Sonra tüm DB sorgularına tenant_id filtresi ELLE ekle:
.from('devreler').select('*').eq('tenant_id', tenant_id)
```

Yazılımcı bir endpoint'e `tenant_id` filtresi eklemeyi **unutursa**: B firması endpoint'i çağırırken A firmasının verisini alır. Bu **en kritik bug sınıfı** — code review'da her yeni endpoint için "tenant_id her sorguda mı?" kontrolü zorunlu.

### SQL Enjeksiyon

`api/sorgula.js` doğal dil → SQL çeviriyor (Anthropic LLM ile). **Kendi koruması var:**
- Sadece SELECT ifadelerine izin veriliyor (INSERT/UPDATE/DELETE/DROP reddedilir)
- Sadece izinli tablolar listesinden (`IZINLI_TABLOLAR`) çağrı yapılabilir
- `tenant_id = ?` filtresi her sorguya zorunlu enjekte edilir

### JWT Token Doğrulaması (İleride)

Şu an endpoint'ler `tenant_id`'yi body'den alıyor — kullanıcı kendi `tenant_id`'sini biliyor ve gönderiyor. Bu güvenilmez! Saldırgan başka bir tenant'ın `tenant_id`'sini yazabilir.

**Uzun vadeli çözüm** (30+ oturum): Her istekte `Authorization: Bearer <jwt>` header'ı okunacak, JWT'den `tenant_id` çıkarılacak (kullanıcının body'de gönderdiği değer yok sayılacak). Supabase JWT'leri hazır — sadece endpoint tarafında doğrulama adımı eklenmeli.

### API Key'ler

| Endpoint | Gereken Env Variable | Sensitive? |
|---|---|---|
| `api/izometri-oku.js` | `ANTHROPIC_API_KEY` | 🔒 Evet |
| `api/sorgula.js` | `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY` | 🔒 Evet |

Her ikisi de Vercel'de **Sensitive** olarak saklanıyor — dashboard'da görünmez, sadece runtime'da okunur (28. oturumda geçiş yapıldı).

---

## 5. Endpoint Ekleme Rehberi

Yeni bir endpoint eklemek için **5 adımlı akış:**

### Adım 1 — Dosya Oluştur

`api/` klasörü altına `yeni-endpoint.js` dosyası oluştur. Dosya adı kebab-case, URL'e doğrudan map olur (`api/yeni-endpoint.js` → `/api/yeni-endpoint`).

### Adım 2 — Yorum Şablonunu Uy

**Dosyanın ilk 3 satırı CI tarafından parse ediliyor** — `docs-uret.js` bu satırları okuyup `docs/API.md`'nin endpoint listesini üretiyor. Format zorunlu:

```js
// api/yeni-endpoint.js — Vercel Serverless Function (Node.js)
// <Endpoint ne yapar, bir cümle açıklama>
// <Güvenlik notu veya önemli kısıtlama>
```

Örnek:

```js
// api/parca-ara.js — Vercel Serverless Function (Node.js)
// IFS malzeme koduna göre parça ara, fuzzy match ile alternatifleri dön
// Güvenlik: tenant_id zorunlu, sadece izinli kategoriler
```

Bu yoruma dikkat etmezsen `API.md`'de endpoint adı yanında `_(açıklama yok — yorum başlığı ekle)_` uyarısı çıkar.

### Adım 3 — İskelet Kod

```js
// api/yeni-endpoint.js — Vercel Serverless Function (Node.js)
// ...

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tenant_id, ...params } = req.body;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id gerekli' });

    // İş mantığı burada

    return res.status(200).json({ ok: true, data: {} });
  } catch (err) {
    console.error('yeni-endpoint hata:', err);
    return res.status(500).json({ error: 'Sunucu hatası', detay: err.message });
  }
}
```

### Adım 4 — Test

- **Preview deploy** — PR aç, Vercel preview URL'de test et.
- **Çağrı örneği:**
  ```
  curl -X POST https://<preview-url>/api/yeni-endpoint \
    -H "Content-Type: application/json" \
    -d '{"tenant_id":"uuid-burada","param1":"deger"}'
  ```
- **Başarısız durumları da test et:** `tenant_id` eksik, yanlış method (GET), beklenmeyen body.

### Adım 5 — Canlıya Al

PR merge edilir → main push → Vercel prod deploy → `docs-uret.js` otomatik `API.md`'yi günceller → commit atar.

---

## 6. Kullanım Örnekleri

### Terminal'den (curl)

```bash
# Başarılı çağrı
curl -X POST https://arespipe.vercel.app/api/sorgula \
  -H "Content-Type: application/json" \
  -d '{
    "soru": "son 7 günde kaç spool üretildi?",
    "tenant_id": "12345678-90ab-cdef-1234-567890abcdef"
  }'

# Başarısız örneği (tenant_id eksik)
curl -X POST https://arespipe.vercel.app/api/sorgula \
  -H "Content-Type: application/json" \
  -d '{"soru": "..."}'
# → 400 Bad Request, { "error": "tenant_id gerekli" }
```

### Frontend'den (fetch)

```javascript
// Tarayıcıda, sayfada çağrı örneği
async function doğalDilSorgula(soru) {
  const { data: { user } } = await ARES.supabase().auth.getUser();
  const tenant_id = user.user_metadata.tenant_id;

  const res = await fetch('/api/sorgula', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ soru, tenant_id })
  });

  if (!res.ok) {
    const hata = await res.json();
    console.error('API hatası:', hata);
    return null;
  }

  return await res.json();
}

// Kullanım
const sonuc = await doğalDilSorgula('bu ay kaç sevkiyat yapıldı?');
console.log(sonuc.data);
```

### Mobilden (React — mobile/src/)

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

function SorguBileseni() {
  const [cevap, setCevap] = useState(null)

  async function çalıştır(soru) {
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/sorgula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        soru,
        tenant_id: user.user_metadata.tenant_id
      })
    })
    const sonuc = await res.json()
    setCevap(sonuc)
  }

  return <button onClick={() => çalıştır('test sorusu')}>Sor</button>
}
```

---

## Ekler

### Yararlı Linkler

- **Vercel Deployment Logs:** Dashboard → proje → Deployments → ilgili deploy → "Functions" sekmesi. Endpoint çağrısı canlı log'u burada.
- **Vercel Serverless Function Docs:** https://vercel.com/docs/functions
- **Anthropic API Docs:** https://docs.claude.com
- **Supabase Client Docs:** https://supabase.com/docs/reference/javascript

### İlgili Dosyalar

- Endpoint kodu: `api/<dosya>.js`
- AUTO üretici: `.github/docs-uret.js` → `apiEndpointListesi()` fonksiyonu
- Yorum şablonu: Bölüm 5, Adım 2
- Mimari bağlamı: `docs/ARCHITECTURE.md` → "API Katmanı"

### İlgili Oturumlar

- 24. oturum — Pano endpoint'leri (feedback, görevler)
- 28. oturum — Anthropic API key Vercel Sensitive geçişi
- 28. oturum — `api/izometri-oku.js` teyidi (Spool AI katman 1 aktif)

---

_Bölüm 3 (Endpoint Listesi) otomatik güncellenir. Diğer bölümler manuel — yeni endpoint eklendiğinde sadece dosyanın kendisini yazarsın, listeye elle eklemene gerek yok._
