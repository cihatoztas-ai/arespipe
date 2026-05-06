// mobile/src/components/MBottomNav.jsx
// AresPipe Mobile — Alt Navigasyon (paylaşılan)
// 5 sekme: Ana Sayfa · Ara · QR (FAB ortada) · Bildirim · Menü
// Sınıflar ares-mobile.css'ten gelir: .m-bottomnav, .m-nav-item, .m-nav-item.active,
// .m-nav-icon, .m-nav-label, .m-nav-qr, .m-nav-qr-btn

import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n'

// SVG ikonlar — ares-mobile.js'teki homeIcon/searchIcon vs ile birebir
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const QrIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="3" height="3" />
    <rect x="18" y="14" width="3" height="3" />
    <rect x="14" y="18" width="3" height="3" />
    <rect x="18" y="18" width="3" height="3" />
  </svg>
)

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6"  x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export default function MBottomNav({
  aktif,            // 'anasayfa' | 'ara' | 'bildirim' (qr ve menü active olmaz)
  qrAktif,          // boolean — false olduğunda FAB pasif görünür
  onQrClick,        // FAB tıklama (rol pasifse toast atılması üst bileşene bırakıldı)
  onMenuClick,      // Menü sekmesi tıklanınca drawer açılır
  bildirimSayisi,   // > 0 ise kırmızı badge
}) {
  const navigate = useNavigate()
  const { tv } = useT()

  const sinif = (k) => 'm-nav-item' + (aktif === k ? ' active' : '')
  const bs = Number(bildirimSayisi) || 0

  return (
    <nav className="m-bottomnav">
      {/* 1 — Ana Sayfa */}
      <button type="button" className={sinif('anasayfa')} onClick={() => navigate('/')}>
        <div className="m-nav-icon"><HomeIcon /></div>
        <span className="m-nav-label">{tv('mob_nav_anasayfa', 'Ana Sayfa')}</span>
      </button>

      {/* 2 — Ara */}
      <button type="button" className={sinif('ara')} onClick={() => navigate('/ara')}>
        <div className="m-nav-icon"><SearchIcon /></div>
        <span className="m-nav-label">{tv('mob_nav_ara', 'Ara')}</span>
      </button>

      {/* 3 — QR (FAB) */}
      <div className="m-nav-qr">
        <button
          type="button"
          className="m-nav-qr-btn"
          onClick={onQrClick}
          aria-label={tv('m_ib_qr_tara', 'QR Tara')}
          aria-disabled={qrAktif ? 'false' : 'true'}
          style={qrAktif ? undefined : {
            background: 'var(--bor)',
            cursor: 'not-allowed',
          }}
        >
          <QrIcon />
        </button>
      </div>

      {/* 4 — Bildirim */}
      <button
        type="button"
        className={sinif('bildirim')}
        onClick={() => navigate('/bildirim')}
        style={{ position: 'relative' }}
      >
        {bs > 0 && (
          <span style={{
            position: 'absolute',
            top: 6,
            right: 18,
            background: 'var(--re)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 600,
            borderRadius: 8,
            padding: '1px 5px',
            minWidth: 14,
            textAlign: 'center',
            lineHeight: 1.4,
          }}>
            {bs > 99 ? '99+' : bs}
          </span>
        )}
        <div className="m-nav-icon"><BellIcon /></div>
        <span className="m-nav-label">{tv('mob_nav_bildirim', 'Bildirim')}</span>
      </button>

      {/* 5 — Menü (drawer açar) */}
      <button type="button" className="m-nav-item" onClick={onMenuClick}>
        <div className="m-nav-icon"><MenuIcon /></div>
        <span className="m-nav-label">{tv('mob_nav_menu', 'Menü')}</span>
      </button>
    </nav>
  )
}
