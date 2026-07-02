// mobile/src/components/MBottomNav.jsx
// AresPipe Mobile — Yüzen alt navigasyon (Oturum 213 / Sıra 11)
//
// WhatsApp dili: yüzen pill, blur + yarı-şeffaf zemin (arka içerik seçilir),
// aktif sekmede hafif accent kabartma. Ekranın dibine yapışık DEĞİL — kenardan
// boşluklu, alan öldürmez (içerik altından akar).
//
// 4 sabit slot: Ana Sayfa · Devreler · Uygulamalar · Menü(avatar).
//   (Ortadaki büyük AI butonu sonraya — kullanıma göre eklenecek.)
//
// Eski 5-slot + QR FAB kaldırıldı (QR artık İş Başlat akışı içinde).
// Stiller inline + CSS var (--sur/--tx/--txd/--ac/--bor) → tema otomatik.
// Yarı-şeffaflık: color-mix (iOS Safari 16.2+); desteklenmezse solid var(--sur).

import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const DevreIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const AppsIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9">
    <circle cx="6" cy="6" r="2.4" />
    <circle cx="18" cy="6" r="2.4" />
    <circle cx="6" cy="18" r="2.4" />
    <circle cx="18" cy="18" r="2.4" />
    <circle cx="12" cy="12" r="2.4" />
  </svg>
)

export default function MBottomNav({ aktif, kullanici, onMenuClick }) {
  const navigate = useNavigate()
  const { tv } = useT()

  const bas = (kullanici?.ad_soyad || kullanici?.email || '?').charAt(0).toUpperCase()

  const Item = ({ k, etiket, onClick, cocuk }) => {
    const secili = aktif === k
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={etiket}
        aria-current={secili ? 'page' : undefined}
        style={{
          ...s.item,
          ...(secili ? s.itemAktif : null),
          color: secili ? 'var(--ac)' : 'var(--txd)',
        }}
      >
        {cocuk}
        <span style={s.etiket}>{etiket}</span>
      </button>
    )
  }

  return (
    <nav style={s.bar} aria-label={tv('mob_nav_baslik', 'Navigasyon')}>
      <Item k="anasayfa"    etiket={tv('mob_nav_anasayfa', 'Ana Sayfa')}    onClick={() => navigate('/')}            cocuk={<HomeIcon />} />
      <Item k="devreler"    etiket={tv('mob_nav_devreler', 'Devreler')}     onClick={() => navigate('/devreler')}    cocuk={<DevreIcon />} />
      <Item k="uygulamalar" etiket={tv('mob_nav_uygulama', 'Uygulama')}     onClick={() => navigate('/uygulamalar')} cocuk={<AppsIcon />} />
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={tv('mob_nav_menu', 'Menü')}
        style={s.item}
      >
        <div style={s.avatar}>{bas}</div>
        <span style={{ ...s.etiket, color: 'var(--txd)' }}>{tv('mob_nav_menu', 'Menü')}</span>
      </button>
    </nav>
  )
}

const s = {
  bar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 'calc(14px + env(safe-area-inset-bottom))',
    height: 62,
    borderRadius: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 6px',
    zIndex: 40,
    border: '1px solid var(--bor)',
    background: 'color-mix(in srgb, var(--sur) 82%, transparent)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '6px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 16,
    cursor: 'pointer',
    color: 'var(--txd)',
    WebkitTapHighlightColor: 'transparent',
  },
  itemAktif: {
    background: 'rgba(45,142,255,0.15)',
  },
  etiket: {
    fontSize: 10,
    fontWeight: 500,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--tx)',
  },
}
