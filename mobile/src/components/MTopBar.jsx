// mobile/src/components/MTopBar.jsx
// AresPipe Mobile — Üst Bar (paylaşılan)
// Sol: AP logo · Orta: dinamik başlık · Sağ: avatar (drawer açar)
// Sınıflar ares-mobile.css'ten gelir: .m-topbar, .m-topbar-logo, .m-topbar-title, .m-topbar-actions, .m-topbar-btn

import { useT } from '../lib/i18n'

function _inisiyalCiz(kullanici) {
  if (!kullanici) return '—'
  const ad = kullanici.ad_soyad || kullanici.email || '?'
  const parcalar = ad.trim().split(/\s+/).filter(Boolean)
  if (parcalar.length >= 2) {
    return (parcalar[0][0] + parcalar[1][0]).toUpperCase()
  }
  if (ad.includes('@')) {
    // email — ilk 2 harf
    return ad.substring(0, 2).toUpperCase()
  }
  return ad.substring(0, 2).toUpperCase()
}

export default function MTopBar({ title, kullanici, onAvatarClick }) {
  const { tv } = useT()
  const inisiyal = _inisiyalCiz(kullanici)

  return (
    <div className="m-topbar">
      <div className="m-topbar-logo">AP</div>
      <div className="m-topbar-title">
        {title || tv('m_app_baslik', 'AresPipe')}
      </div>
      <div className="m-topbar-actions">
        <button
          type="button"
          className="m-topbar-btn"
          onClick={onAvatarClick}
          aria-label={tv('m_profil', 'Profil')}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--sur2)',
            color: 'var(--tx)',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--bor)',
          }}
        >
          {inisiyal}
        </button>
      </div>
    </div>
  )
}
