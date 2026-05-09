// mobile/src/lib/dosya.js
// AresPipe — Storage signed URL helper (mobile)
// 69. oturum, Adım 3b-fix3 (signed URL endpoint geçişi)
//
// Web tarafındaki ARES.dosyaUrlAl(yol) fonksiyonunun mobile React muadili.
// arespipe-dosyalar bucket'ı private olduğu için supabase-js client'tan
// direkt createSignedUrl çağrısı RLS'e takılıyor ("Object not found"
// canlı testte doğrulandı). Çözüm: backend endpoint'i üzerinden git —
// service_key sunucu tarafında RLS bypass eder, JWT'den okunan tenant_id
// path ile karşılaştırılarak cross-tenant erişim bloklanır.
//
// Endpoint: POST /api/dosya-url-al
//   header  Authorization: Bearer <jwt>
//   body    { yol }
//   200     { signedUrl, expiresAt }
//   401     YETKI_GEREKLI / TOKEN_GECERSIZ / KULLANICI_YOK
//   403     TENANT_UYUSMAZLIGI
//   404     DOSYA_YOK
//
// API base URL env var'dan okunur:
//   mobile/.env  →  VITE_API_BASE=https://arespipe.vercel.app
// Vercel mobile project env var'ına da aynı değeri ekle (production
// build için). Eklenmezse fetch URL "/api/..." (relative) olur,
// arespipe-mob domain'inde 404 alır.
//
// Cache: 5 dk buffer'lı. Aynı yol için tekrar fetch yapmaz; signed URL
// 1 saat geçerli (endpoint default'u), token süresi bitmeden 5 dk önce
// otomatik yenileme. Spool detayında 5 foto varsa sayfayı 5 kez
// gez-gel-gez yapsa bile 1 fetch yeter.

import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const _CACHE = {}
const _BUFFER_MS = 5 * 60 * 1000

if (!API_BASE && import.meta.env.DEV) {
  console.warn(
    '[dosya.js] VITE_API_BASE env var tanımlı değil. ' +
    '/api/dosya-url-al çağrıları muhtemelen 404 verecek. ' +
    'mobile/.env dosyasına şunu ekle: VITE_API_BASE=https://arespipe.vercel.app'
  )
}

export async function dosyaUrlAl(yol) {
  if (!yol || typeof yol !== 'string') return null

  // Zaten full URL ise olduğu gibi geri ver (geriye uyumluluk —
  // bazı eski kayıtlarda dosya_url'a https://... yazılmış olabilir).
  if (/^https?:\/\//i.test(yol)) return yol

  // Cache kontrolü (expiresAt - 5dk buffer)
  const cached = _CACHE[yol]
  if (cached && (cached.expiresAt - _BUFFER_MS) > Date.now()) {
    return cached.signedUrl
  }

  // Oturum kontrolü — JWT Bearer token'sız endpoint 401 döner
  const sessRes = await supabase.auth.getSession()
  const session = sessRes?.data?.session
  if (!session) {
    console.warn('[dosyaUrlAl] oturum yok, yol:', yol)
    return null
  }

  // API çağrısı
  try {
    const r = await fetch(`${API_BASE}/api/dosya-url-al`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ yol }),
    })

    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      console.warn('[dosyaUrlAl]', r.status, err.kod || err.error || 'unknown', 'yol:', yol)
      return null
    }

    const body = await r.json()
    if (!body?.signedUrl) {
      console.warn('[dosyaUrlAl] signedUrl response\'da yok:', body)
      return null
    }

    _CACHE[yol] = {
      signedUrl: body.signedUrl,
      // expiresAt parse et — endpoint ISO string döner; parse edemezse
      // 1 saat varsay (cache'in çok uzun yaşamasını engellemek için)
      expiresAt: body.expiresAt
        ? new Date(body.expiresAt).getTime()
        : Date.now() + 60 * 60 * 1000,
    }
    return body.signedUrl
  } catch (e) {
    console.warn('[dosyaUrlAl] hata:', e?.message || e, 'yol:', yol)
    return null
  }
}
