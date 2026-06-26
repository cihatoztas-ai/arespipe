// mobile/src/screens/MUygulamalar.jsx
// Uygulamalar listesi ekranı (spool'dan bağımsız araçlar — yetki gerektirmez).
//
// İki mod:
//  - Route modu (varsayılan): /uygulamalar'a gelince. Üstte "Uygulamalar" başlığı.
//  - Ana sayfa modu (anaSayfaModu=true): uygulama kullanıcısının ana sayfası.
//    Hero (selamlama + ad) gösterilir, ara buton olmadan doğrudan liste (MK-206.3).
//
// Kalıp: MIslemler.jsx (topbar + hero + GrupButonu + MDrawer + s/b stil ikilisi).
// durum='yakinda' uygulamalar tıklanınca toast, durum='aktif' → navigate(hedef).

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { UYGULAMALAR } from '../lib/uygulamalar'
import MDrawer from '../components/MDrawer'

export default function MUygulamalar({ kullanici = null, anaSayfaModu = false }) {
  const navigate = useNavigate()
  const { tv } = useT()

  const [drawerAcik, setDrawerAcik] = useState(false)
  const [toast, setToast] = useState('')

  const saat = new Date().getHours()
  const selamlamaKey = saat < 12 ? 'm_gunaydin' : saat < 18 ? 'm_iyi_gunler' : 'm_iyi_aksamlar'

  function uygulamaTikla(uyg) {
    if (uyg.durum === 'aktif') {
      navigate(uyg.hedef)
      return
    }
    const ad = tv(uyg.i18n_ad, uyg.ad)
    setToast(tv('m_uyg_yakinda', '{ad} yakında').replace('{ad}', ad))
    window.clearTimeout(uygulamaTikla._t)
    uygulamaTikla._t = window.setTimeout(() => setToast(''), 1800)
  }

  return (
    <div style={s.sayfa}>
      {/* Topbar */}
      <div style={s.topbar}>
        {!anaSayfaModu && (
          <button
            style={s.topbarBtn}
            onClick={() => navigate(-1)}
            aria-label={tv('m_geri', 'Geri')}
          >
            ‹
          </button>
        )}
        <div style={s.topbarLogo}>AP</div>
        <div style={s.topbarTitle}>{tv('m_app_title', 'AresPipe')}</div>
        <button
          style={s.profilBtn}
          onClick={() => setDrawerAcik(true)}
          aria-label={tv('m_drawer_profil', 'Profil')}
        >
          {(kullanici?.ad_soyad || kullanici?.email || '?').charAt(0).toUpperCase()}
        </button>
      </div>

      {/* Scroll alan */}
      <div style={s.scroll}>

        {anaSayfaModu ? (
          /* Ana sayfa modu — hero + uygulamalarınız başlığı */
          <>
            <div style={s.hero}>
              <div style={s.heroGreeting}>{tv(selamlamaKey, 'Günaydın')}</div>
              <div style={s.heroName}>
                {kullanici?.ad_soyad || kullanici?.email || tv('m_kullanici', 'Kullanıcı')}
              </div>
              <div style={s.heroMeta}>{tv('m_uyg_basligi_alt', 'Uygulamalarınız')}</div>
            </div>
            <div style={s.sectionRow}>
              <div style={s.sectionTitle}>{tv('m_uyg_basligi', 'Uygulamalar')}</div>
            </div>
          </>
        ) : (
          /* Route modu — sade başlık */
          <div style={s.sectionRow}>
            <div style={s.sectionTitle}>{tv('m_uyg_basligi', 'Uygulamalar')}</div>
          </div>
        )}

        <div style={s.butonListe}>
          {UYGULAMALAR.map((uyg) => (
            <UygulamaButonu
              key={uyg.id}
              ikon={uyg.ikon}
              renk={uyg.renk}
              baslik={tv(uyg.i18n_ad, uyg.ad)}
              altbaslik={tv(uyg.i18n_aciklama, uyg.aciklama)}
              yakinda={uyg.durum !== 'aktif'}
              yakindaMetin={tv('m_uyg_rozet_yakinda', 'YAKINDA')}
              onClick={() => uygulamaTikla(uyg)}
            />
          ))}
        </div>

        {/* Alt boşluk safe-area */}
        <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }} />
      </div>

      {toast && <div style={s.toast}>{toast}</div>}

      <MDrawer acik={drawerAcik} kapat={() => setDrawerAcik(false)} />
    </div>
  )
}

/* ─── Buton componenti (GrupButonu kalıbı + yakında rozeti) ─── */

function UygulamaButonu({ ikon, renk, baslik, altbaslik, yakinda, yakindaMetin, onClick }) {
  return (
    <button
      style={{
        ...b.btn,
        borderLeft: `4px solid ${renk}`,
        opacity: yakinda ? 0.85 : 1,
      }}
      onClick={onClick}
    >
      <div style={{ ...b.ikonKutu, background: `${renk}22` }}>
        <span style={{ fontSize: 26 }}>{ikon}</span>
      </div>
      <div style={b.body}>
        <div style={{ ...b.baslik, color: 'var(--tx)' }}>{baslik}</div>
        <div style={b.alt}>{altbaslik}</div>
      </div>
      {yakinda ? (
        <div style={b.rozet}>{yakindaMetin}</div>
      ) : (
        <div style={{ ...b.ok, color: 'var(--txd)' }}>›</div>
      )}
    </button>
  )
}

/* ─── Stiller (MIslemler s/b ikilisinden) ─── */

const s = {
  sayfa: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    color: 'var(--tx)',
  },
  topbar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 12px',
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
    paddingTop: 'env(safe-area-inset-top)',
    height: 'calc(56px + env(safe-area-inset-top))',
  },
  topbarLogo: {
    width: 32, height: 32, borderRadius: 8,
    background: 'var(--ac)',
    color: '#fff',
    fontWeight: 800, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Barlow Condensed', sans-serif",
  },
  topbarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--tx)',
  },
  topbarBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--tx)',
    fontSize: 28,
    lineHeight: 1,
    padding: '0 4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  profilBtn: {
    width: 40, height: 40, borderRadius: 20,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    color: 'var(--tx)',
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  hero: {
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
    padding: '20px 16px 20px',
  },
  heroGreeting: {
    fontSize: 14,
    color: 'var(--txd)',
    fontWeight: 600,
    marginBottom: 4,
  },
  heroName: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--tx)',
    lineHeight: 1,
  },
  heroMeta: {
    fontSize: 14,
    color: 'var(--txd)',
    marginTop: 6,
  },
  sectionRow: {
    padding: '16px 16px 8px',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--txd)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  butonListe: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '0 16px',
  },
  toast: {
    position: 'fixed',
    left: '50%',
    bottom: 'calc(30px + env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)',
    background: 'var(--sur2)',
    color: 'var(--tx)',
    border: '1px solid var(--bor)',
    padding: '12px 20px',
    borderRadius: 12,
    fontSize: 14,
    zIndex: 99,
    maxWidth: '80%',
    textAlign: 'center',
  },
}

const b = {
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 14px',
    background: 'var(--sur)',
    border: '1px solid var(--bor)',
    borderLeft: '4px solid var(--ac)',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    minHeight: 72,
  },
  ikonKutu: {
    width: 48, height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0 },
  baslik: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  alt: { fontSize: 14, color: 'var(--txd)' },
  ok: { fontSize: 22, flexShrink: 0 },
  rozet: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--warn)',
    background: 'rgba(217,119,6,.14)',
    padding: '3px 8px',
    borderRadius: 20,
    letterSpacing: 0.4,
    flexShrink: 0,
  },
}
