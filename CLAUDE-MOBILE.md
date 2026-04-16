# AresPipe — Mobil Sistem Bağlamı (React)

> Bu dosya CLAUDE.md ile birlikte okunur. Mobil geliştirmeye özgü kurallar burada.
> Son güncelleme: 16 Nisan 2026
> **ÖNEMLİ:** 16 Nisan 2026'da vanilla HTML/JS'den React + Vite'a geçildi. Eski kurallar geçersiz.

---

## 1. MİMARİ

### 1.1 Stack

- **Framework:** React 18 + Vite
- **Router:** react-router-dom v6
- **Backend:** Supabase (aynı proje, aynı DB)
- **Deploy:** Vercel — `arespipe-mob.vercel.app` (ayrı proje, root: `mobile/`)
- **Repo:** cihatoztas-ai/arespipe — `mobile/` klasörü

### 1.2 Klasör Yapısı

```
mobile/
├── src/
│   ├── main.jsx              ← BrowserRouter buraya sarılı
│   ├── App.jsx               ← Routes + merkezi auth guard
│   ├── index.css             ← CSS değişkenleri + global reset
│   ├── lib/
│   │   ├── supabase.js       ← createClient — TEK bağlantı noktası
│   │   └── auth.js           ← getOturum(), getTenantId(), cikisYap()
│   ├── screens/              ← Her ekran ayrı .jsx dosyası
│   │   ├── Giris.jsx         ✅
│   │   ├── Anasayfa.jsx      ⏳
│   │   ├── Devreler.jsx      ⏳
│   │   ├── DevrDetay.jsx     ⏳
│   │   ├── SpoolDetay.jsx    ⏳
│   │   ├── IsBaslat.jsx      ⏳
│   │   └── QRTara.jsx        ⏳
│   └── components/           ← Ortak componentler
│       ├── RolKart.jsx        ⏳
│       ├── StatKart.jsx       ⏳
│       └── AlertKart.jsx      ⏳
├── package.json
└── vite.config.js
```

### 1.3 Supabase Bağlantısı

```js
// mobile/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(SUPA_URL, SUPA_KEY)

// Kullanım — her screen'de
import { supabase } from '../lib/supabase'
const { data, error } = await supabase.from('spooller').select('*')
```

**Web tarafındaki `ARES.supabase()` veya `mSupabase()` KULLANILMAZ.**

---

## 2. TEMEL KURALLAR

### R-01: State Yönetimi

```jsx
// YANLIŞ — global değişken
var _aktifSpool = null;

// DOĞRU — React state
const [aktifSpool, setAktifSpool] = useState(null)
```

### R-02: Navigasyon

```jsx
// YANLIŞ
location.href = 'devreler.html'
history.back()

// DOĞRU
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/devreler')
navigate(-1)  // geri için
```

### R-03: iOS Uyumluluk

```jsx
// File input — iOS'ta .click() çalışmaz, label kullan
<label htmlFor="fotoInput">
  <input type="file" id="fotoInput" accept="image/*" capture="environment" style={{display:'none'}} />
  Fotoğraf Çek
</label>

// Input zoom önleme — iOS font-size 16px altında zoom yapar
<input style={{ fontSize: '16px' }} />
<textarea style={{ fontSize: '16px' }} />
```

### R-04: iOS Viewport

```css
/* index.css */
html, body, #root {
  height: 100%;
  height: 100dvh;  /* dynamic viewport — iOS adres çubuğunu dahil etmez */
  overflow: hidden;
}
```

### R-05: Event Listener Temizliği

```jsx
useEffect(() => {
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)  // cleanup şart
}, [])
```

### R-06: Font Size

Minimum `14px`. Input/textarea'larda `16px` (iOS zoom önleme).

### R-07: Renk Sistemi

CSS değişkenleri `index.css`'de tanımlı — aynı sistem:
```
var(--ac), var(--gr), var(--re), var(--warn), var(--leg)
var(--bg), var(--sur), var(--bor), var(--tx), var(--txd), var(--txm)
```

---

## 3. ROUTER YAPISI

```jsx
// App.jsx
<Routes>
  <Route path="/giris" element={!oturum ? <Giris /> : <Navigate to="/" />} />
  <Route path="/" element={oturum ? <Anasayfa /> : <Navigate to="/giris" />} />
  <Route path="/devreler" element={oturum ? <Devreler /> : <Navigate to="/giris" />} />
  <Route path="/devre/:id" element={oturum ? <DevrDetay /> : <Navigate to="/giris" />} />
  <Route path="/spool/:id" element={oturum ? <SpoolDetay /> : <Navigate to="/giris" />} />
  <Route path="/is-baslat" element={oturum ? <IsBaslat /> : <Navigate to="/giris" />} />
</Routes>
```

### Auth Guard

`App.jsx`'te merkezi — `supabase.auth.onAuthStateChange()` ile oturum takip edilir. Her route `oturum` state'ine göre yönlendirir.

---

## 4. SCREEN ŞABLONU

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function OrnekEkran() {
  const navigate = useNavigate()
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    yukle()
  }, [])

  async function yukle() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/giris'); return }

      const { data, error } = await supabase
        .from('tablo')
        .select('*')
        .eq('tenant_id', session.user.id)

      if (error) throw error
      setVeri(data)
    } catch(e) {
      setHata(e.message)
    } finally {
      setYukleniyor(false)
    }
  }

  if (yukleniyor) return <div style={s.yukleniyor}>Yükleniyor...</div>
  if (hata) return <div style={s.hata}>{hata}</div>

  return (
    <div style={s.sayfa}>
      {/* İçerik */}
    </div>
  )
}

const s = {
  sayfa: { height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  yukleniyor: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--txd)' },
  hata: { padding: 16, color: 'var(--re)' },
}
```

---

## 5. SUPABASE KULLANIM KURALLARI

### Tenant ID

```jsx
import { supabase } from '../lib/supabase'

async function getTenantId() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase
    .from('kullanicilar')
    .select('tenant_id')
    .eq('id', session.user.id)
    .single()
  return data?.tenant_id
}
```

### Paralel Sorgular

```jsx
const [spoolRes, fotoRes, notRes] = await Promise.all([
  supabase.from('spooller').select('*').eq('id', spoolId).single(),
  supabase.from('fotograflar').select('*').eq('spool_id', spoolId),
  supabase.from('notlar').select('*').eq('spool_id', spoolId).eq('silindi', false),
])
```

### Fotoğraf Yükleme

```jsx
const uzanti = dosya.name.split('.').pop()
const yol = `${tenantId}/spooller/${spoolId}/${Date.now()}.${uzanti}`

const { error } = await supabase.storage
  .from('arespipe-dosyalar')
  .upload(yol, dosya, { upsert: false })

const { data } = supabase.storage
  .from('arespipe-dosyalar')
  .getPublicUrl(yol)

// DB'ye kaydet
await supabase.from('fotograflar').insert({
  tenant_id: tenantId,
  spool_id: spoolId,
  dosya_url: data.publicUrl,
  yukleyen_id: session.user.id,
  islem_turu: islemTuru,
  olusturma: new Date().toISOString(),
})
```

---

## 6. KRİTİK KOLON ADLARI

**spooller:**
- `spool_id TEXT` — kısa görüntü ID ("0431") — UUID değil
- `dis_cap_mm`, `et_kalinligi_mm`, `agirlik`
- `is_durumu` — `bekliyor` / `devam_ediyor`
- `alistirma` — `VAR` / `KISMI` / `YOK`
- `aktif_basamak` — `on_imalat`, `on_kontrol`, `kaynak`, `imalat`, `kk`, `sevkiyat`
- `ilerleme INTEGER` — 0-100

**notlar:** `metin` (icerik değil), `ekleyen_id` (yapan_id değil), `qr_goster`, `silindi`

**fotograflar:** `dosya_url`, `yukleyen_id`, `islem_turu`, `spool_id`

**Storage bucket:** `arespipe-dosyalar`

---

## 7. DEPLOYMENT

```
git push origin main
→ Vercel otomatik algılar
→ mobile/ klasörü build edilir (npm run build)
→ arespipe-mob.vercel.app'e deploy olur
```

**Vercel Proje Adı:** `arespipe-mob`
**Root Directory:** `mobile`
**Build Command:** `npm run build` (override açık)
**Install Command:** `npm install` (override açık)

---

## 8. EKRAN TASARIM KURALLARI

### Genel Layout

```jsx
<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
  {/* Topbar — flex-shrink: 0 */}
  {/* Scroll alan — flex: 1, overflow-y: auto */}
  {/* Alt buton bar — flex-shrink: 0, paddingBottom: safe-area */}
</div>
```

### Scrollbar Gizleme

```css
* { scrollbar-width: none; }
*::-webkit-scrollbar { display: none; }
```

### Alt Buton Bar — 3'lü (İş Başlat devam durumu)

```jsx
<div style={{ display: 'flex', gap: 6 }}>
  <button style={btnKirmizi}>İşi Tamamla</button>
  <button style={btnGhostMavi}>Not Ekle</button>
  <button style={btnGhostKirmizi}>İptal Et</button>
</div>
```

### Topbar Durumları (İş Başlat)

- `bekliyor` → `background: var(--sur)`, normal başlık
- `devam_ediyor` → `background: #fef3c7`, sarı, pulse nokta
- `tamamlandı` → `background: #dcfce7`, yeşil

### Kart Tasarım Sistemi

**Rol kartı:**
```jsx
<div style={{ borderLeft: `4px solid ${renk}`, background: 'var(--sur)', borderRadius: 10, padding: '14px 13px' }}>
```

**Stat kartı (2'li grid):**
```jsx
<div style={{ borderLeft: `3px solid var(--ac)`, background: 'var(--sur)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
```

**Alert kartı:**
```jsx
// Kırmızı (alıştırma)
{ background: '#fef2f2', border: '1px solid #fca5a5', borderLeft: '4px solid var(--re)' }
// Amber (test)
{ background: '#fffbeb', border: '1px solid #fcd34d', borderLeft: '4px solid var(--warn)' }
// Mavi (not)
{ background: '#eff6ff', border: '1px solid #93c5fd', borderLeft: '4px solid var(--ac)' }
```

---

## 9. SCREEN TESLIM KONTROL LİSTESİ

```
□ useState/useEffect doğru kullanıldı
□ useEffect cleanup var (event listener varsa)
□ iOS: file input label ile sarıldı
□ iOS: input/textarea font-size 16px
□ iOS: height 100dvh kullanıldı
□ Navigasyon useNavigate ile yapıldı (location.href değil)
□ Supabase sorguları try/catch içinde
□ Tenant ID kontrolü var
□ Oturum kontrolü var
□ Renk değişkenleri kullanıldı (hardcode renk yok)
□ Scrollbar gizlendi
□ Alt buton bar safe-area padding'i var
```

---

## 10. BEKLEYEN EKRANLAR

| Ekran | Dosya | Durum |
|---|---|---|
| Giriş | Giris.jsx | ✅ Tamamlandı |
| Ana Sayfa | Anasayfa.jsx | ⏳ Placeholder |
| Devreler | Devreler.jsx | ⏳ |
| Devre Detay | DevrDetay.jsx | ⏳ |
| Spool Detay | SpoolDetay.jsx | ⏳ |
| İş Başlat | IsBaslat.jsx | ⏳ Mockup onaylandı |
| QR Tara | QRTara.jsx | ⏳ |
