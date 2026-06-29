// mobile/src/components/MMarkLogo.jsx
// Ortak marka mark logosu — topbar köşesinde kullanılır.
// Açılışta (mount) bir kez tarama animasyonu tetiklenir (giriş ekranı kalıbı).
// MK-109.1: tek paylaşılan çekirdek — 4 topbar bunu çağırır, kopya yok.

import { useRef, useEffect } from 'react'

const MARK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84"><defs><linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D6CDF" stop-opacity="0"/><stop offset=".5" stop-color="#2D6CDF" stop-opacity=".95"/><stop offset="1" stop-color="#2D6CDF" stop-opacity="0"/></linearGradient></defs><circle cx="42" cy="42" r="30" fill="none" stroke="#16202B" stroke-width="13"/><rect x="36" y="36" width="12" height="12" rx="3" fill="#22A35A"/><g fill="#FAFBFC"><circle cx="63.2" cy="20.8" r="4.2"/><circle cx="20.8" cy="20.8" r="4.2"/><circle cx="20.8" cy="63.2" r="4.2"/><circle cx="63.2" cy="63.2" r="4.2"/></g><g><rect x="0" y="2" width="84" height="11" rx="5" fill="url(#scan)"/><rect x="0" y="6.4" width="84" height="2.6" rx="1.3" fill="#2D6CDF"/><animateTransform class="ares-tara-anim" attributeName="transform" type="translate" begin="indefinite" values="0 -16;0 90" keyTimes="0;1" dur="1.3s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="remove" repeatCount="1"/></g></svg>'

export default function MMarkLogo({ style }) {
  const ref = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const animler = ref.current?.querySelectorAll('.ares-tara-anim')
      animler?.forEach(a => { if (a.beginElement) { try { a.beginElement() } catch (e) {} } })
    }, 250)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      ref={ref}
      style={style}
      dangerouslySetInnerHTML={{ __html: MARK_SVG }}
    />
  )
}
