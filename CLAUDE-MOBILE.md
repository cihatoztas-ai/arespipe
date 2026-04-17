# AresPipe — Mobil Sistem Bağlamı (React)

> Bu dosya CLAUDE.md ile birlikte okunur. Mobil geliştirmeye özgü kurallar burada.
> Son güncelleme: 17 Nisan 2026
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
│   ├── App.jsx               ← Routes + I18nProvider + auth guard ✅
│   ├── index.css             ← CSS değişkenleri + global reset
│   ├── lib/
│   │   ├── supabase.js       ← createClient — TEK bağlantı noktası (JWT anon key)
│   │   ├── auth.js           ← getOturum(), getTenantId(), cikisYap()
│   │   ├── i18n.jsx          ← I18nProvider + useT() hook ✅
│   │   ├── yetki.js          ← Blok/grup/gizli_bolumler helper ✅
│   │   └── gruplar.js        ← Grup → ikon/renk/hedef haritası ✅
│   ├── lang/                 ← i18n JSON dosyaları ✅
│   │   ├── tr.json
│   │   ├── en.json
│   │   └── ar.json (RTL)
│   ├── screens/              ← Her ekran ayrı .jsx dosyası
│   │   ├── MGiris.jsx            ✅
│   │   ├── MAnasayfa.jsx         ✅ Router: role göre yönlendirir
│   │   ├── MAnasayfaYonetici.jsx ✅ Dashboard + İşlem Başlat btn
│   │   ├── MIslemler.jsx         ✅ Grup bazlı büyük buton ekranı
│   │   ├── MIsBaslat.jsx         ⏳ Yazılacak (eski is_baslat.html'den)
│   │   ├── MDevreler.jsx         ⏳
│   │   ├── MDevreDetay.jsx       ⏳
│   │   ├── MSpoolDetay.jsx       ⏳
│   │   └── MQRTara.jsx           ⏳
│   └── components/           ← Ortak componentler
│       └── MDrawer.jsx       ⏳ YAZILACAK — logout, dil, tema, menü
├── package.json
└── vite.config.js
```

### 1.3 İsimlendirme: "M" ön eki

**Tüm mobil React component'leri "M" ön ekiyle başlar:**
- `MGiris.jsx`, `MAnasayfa.jsx`, `MIslemler.jsx`, `MDrawer.jsx`

**Neden:**
- Web tarafındaki `mInit()`, `mSupabase()`, `m-topbar` pattern'i ile tutarlı
- Dosya ağacında mobil component'ler hemen ayırt edilir
- Web'teki aynı ekrandan karışıklık olmaz (örn. `Giris.html` ≠ `MGiris.jsx`)

### 1.4 Supabase Bağlantısı

```js
// mobile/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(SUPA_URL, SUPA_KEY)

// Kullanım — her screen'de
import { supabase } from '../lib/supabase'
const { data, error } = await supabase.from('spooller').select('*')
```

**Web tarafındaki `ARES.supabase()` veya `mSupabase()` KULLANILMAZ.**

**ÖNEMLİ:** Anon key olarak **JWT formatı (eyJ...)** kullanılır — `sb_publishable_` formatı kullanılmaz (auth sorunlarına yol açıyor).

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

**YASAK:** Hardcode hex renk (`#2D8EFF` vb.) kullanma — sadece CSS değişkenleri.

### R-08: i18n (17 Nisan 2026)

**KESİN KURAL:** Hiçbir string hardcode olmaz — hepsi `tv()` üzerinden:

```jsx
import { useT } from '../lib/i18n'

function Ekran() {
  const { tv } = useT()
  return (
    <div>
      <h1>{tv('m_baslik', 'Türkçe fallback')}</h1>
      <button>{tv('m_buton_kaydet', 'Kaydet')}</button>
    </div>
  )
}
```

**Anahtar adlandırması:**
- `m_` prefix ile başlar (mobil anahtar)
- `snake_case` kullanılır
- Hiyerarşi: `m_<bolum>_<alt_bolum>` (örn. `m_giris_email`, `m_kart_is_baslat`)

---

## 3. YETKİ SİSTEMİ (17 Nisan 2026)

### 3.1 Temel Mimari: Grup = Buton, Blok = Yetki

**Kavramlar:**
- `yetki_bloklari` → Her kullanıcı bir veya daha fazla bloğa sahiptir (teknik yetki)
- **grup** kolonu → Ekrandaki buton adı (kullanıcıya görünen)
- Her blok bir gruba aittir (şu an 1:1, gelecekte aynı grupta N blok olabilir)
- Birden fazla blok aynı gruba aitse → tek buton (grup adıyla)

### 3.2 yetki.js Helper Fonksiyonları

```js
import {
  getKullaniciBloklari,     // → Array<{id, ad, grup, renk, ...}>
  getKullaniciGruplari,     // → Array<{grup_adi, renk, sira, bloklar}>
  getGizliBolumler,         // (sayfa_kodu) → Array<string>
  sayfaErisimiVar,          // (sayfa_kodu) → boolean
  yoneticiMi,               // (kullanici) → boolean
} from '../lib/yetki'
```

### 3.3 Gizli Bölümler Mantığı

Kullanıcının aynı sayfaya erişebilen birden fazla bloğu varsa:
- Her bloğun `gizli_bolumler` listesi çekilir
- **KESİŞİM** alınır (yani: bir blok bile gösteriyorsa, kullanıcı görür)

```js
// Örnek: Kullanıcı "Büküm" ve "Büküm-Ölçü" bloklarına sahip
// Büküm bloğu: gizli_bolumler = ['olcu_girme']
// Büküm-Ölçü bloğu: gizli_bolumler = []
// Kesişim: [] (hiçbir şey gizli değil — kullanıcı ölçü girebilir)
```

### 3.4 Role Bazlı Anasayfa Yönlendirmesi

`MAnasayfa.jsx` router olarak çalışır:

```jsx
if (yoneticiMi(kullanici)) return <MAnasayfaYonetici />
return <MIslemler />  // Operatör direkt işlemler ekranı
```

- **Yönetici/super_admin** → Dashboard (istatistik + İşlem Başlat butonu)
- **Herkes başka** → Direkt İşlemler ekranı (büyük butonlar)

### 3.5 Grup Haritası (gruplar.js)

Her grup için `ikon`, `renk`, `hedef`, `param`, `i18n` tanımlı:

```js
'Büküm': {
  ikon: '↩️',
  renk: 'var(--ac)',
  hedef: '/is-baslat',
  param: 'islem=bukum',
  i18n: 'm_grup_bukum',
}
```

Yeni grup eklenince **hem DB'ye hem `gruplar.js`'e hem dil dosyalarına** eklenmelidir.

---

## 4. ROUTER YAPISI

```jsx
// App.jsx
<I18nProvider>
  <Routes>
    <Route path="/giris" element={!oturum ? <MGiris /> : <Navigate to="/" />} />
    <Route path="/" element={oturum ? <MAnasayfa /> : <Navigate to="/giris" />} />
    <Route path="/islemler" element={oturum ? <MIslemlerSayfasi /> : <Navigate to="/giris" />} />
    <Route path="*" element={<Navigate to={oturum ? '/' : '/giris'} />} />
  </Routes>
</I18nProvider>
```

### Auth Guard

`App.jsx`'te merkezi — `supabase.auth.onAuthStateChange()` ile oturum takip edilir. Her route `oturum` state'ine göre yönlendirir.

---

## 5. SCREEN ŞABLONU

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

export default function MOrnekEkran() {
  const navigate = useNavigate()
  const { tv } = useT()
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

  if (yukleniyor) return <div style={s.yukleniyor}>{tv('m_yukleniyor', 'Yükleniyor...')}</div>
  if (hata) return <div style={s.hata}>{hata}</div>

  return (
    <div style={s.sayfa}>
      <h1>{tv('m_ornek_baslik', 'Örnek Başlık')}</h1>
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

## 6. SUPABASE KULLANIM KURALLARI

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

### RLS Kuralları (Kritik!)

`kullanici_bloklar` tablosuna INSERT yaparken **`tenant_id` ZORUNLU** — aksi halde RLS filtreler ve satır görünmez.

```sql
-- YANLIŞ (tenant_id NULL olur)
INSERT INTO kullanici_bloklar (kullanici_id, blok_id) VALUES (...);

-- DOĞRU
INSERT INTO kullanici_bloklar (kullanici_id, blok_id, tenant_id)
VALUES (?, ?, (SELECT tenant_id FROM kullanicilar WHERE id = ?));
```

---

## 7. KRİTİK KOLON ADLARI

**spooller:**
- `spool_id TEXT` — kısa görüntü ID ("0431") — UUID değil
- `dis_cap_mm`, `et_kalinligi_mm`, `agirlik`
- `is_durumu` — `bekliyor` / `devam_ediyor`
- `alistirma` — `VAR` / `KISMI` / `YOK`
- `aktif_basamak` — `on_imalat`, `on_kontrol`, `kaynak`, `imalat`, `kk`, `sevkiyat`
- `ilerleme INTEGER` — 0-100

**notlar:** `metin` (icerik değil), `ekleyen_id` (yapan_id değil), `qr_goster`, `silindi`

**fotograflar:** `dosya_url`, `yukleyen_id`, `islem_turu`, `spool_id`

**yetki_bloklari:** `ad`, `grup`, `renk`, `sistem_preset`, `sira`, `tenant_id` (NULL=sistem)

**kullanici_bloklar:** `kullanici_id`, `blok_id`, **`tenant_id` (ZORUNLU — RLS kontrolü)**

**blok_sayfa_yetkileri:** `blok_id`, `sayfa_kodu`, `gizli_bolumler TEXT[]`

**Storage bucket:** `arespipe-dosyalar`

---

## 8. DEPLOYMENT

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

## 9. EKRAN TASARIM KURALLARI

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

### Büyük Buton (İşlemler ekranı stili)

Operatör ekranında her grup için büyük buton. Minimum 72px yükseklik (eldivenli el için):

```jsx
<button style={{
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '16px 14px',
  background: 'var(--sur)',
  border: '1px solid var(--bor)',
  borderLeft: `4px solid ${renk}`,
  borderRadius: 12,
  minHeight: 72,
  width: '100%',
}}>
  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${renk}22`, ...}}>{ikon}</div>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 16, fontWeight: 700 }}>{baslik}</div>
    <div style={{ fontSize: 14, color: 'var(--txd)' }}>{alt}</div>
  </div>
  <div style={{ fontSize: 22 }}>›</div>
</button>
```

---

## 10. SCREEN TESLIM KONTROL LİSTESİ

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
□ i18n: TÜM metinler tv() üzerinden (hardcode string yok)
□ i18n anahtarları tr/en/ar'ın üçüne de eklendi
□ "M" ön ekiyle adlandırıldı
```

---

## 11. TAMAMLANAN / BEKLEYEN EKRANLAR

| Ekran | Dosya | Durum |
|---|---|---|
| Giriş | MGiris.jsx | ✅ Tamamlandı (i18n'li) |
| Ana Sayfa Router | MAnasayfa.jsx | ✅ Tamamlandı |
| Yönetici Dashboard | MAnasayfaYonetici.jsx | ✅ Tamamlandı |
| Operatör İşlemler | MIslemler.jsx | ✅ Tamamlandı (grup bazlı) |
| **Drawer (menü)** | **MDrawer.jsx** | **⏳ ÖNCELİKLİ — logout yok** |
| İş Başlat | MIsBaslat.jsx | ⏳ Eski is_baslat.html'den |
| Devreler | MDevreler.jsx | ⏳ |
| Devre Detay | MDevreDetay.jsx | ⏳ |
| Spool Detay | MSpoolDetay.jsx | ⏳ |
| QR Tara | MQRTara.jsx | ⏳ |

---

## 12. ÖNEMLİ HATIRLATMALAR

### "M" ön eki — her yerde
Component adı, dosya adı, JSX kullanımı — hepsi "M" ile başlar.

### i18n — hiç istisna yok
En basit "OK" butonunda bile `tv('m_tamam', 'Tamam')` kullan.

### RLS ve tenant_id
`kullanici_bloklar` INSERT'lerinde tenant_id mutlaka set et.

### Supabase key
JWT anon key (eyJ...) kullan, `sb_publishable_` değil.

### Vercel deploy otomatik
`git push origin main` → Vercel otomatik deploy. Vite config'de `base: './'` gibi göreli yol YOK (önceki hata).
