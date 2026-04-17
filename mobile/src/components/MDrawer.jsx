import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { useTema } from '../lib/tema'

const DILLER = [
  { kod: 'tr', bayrak: '🇹🇷', anahtar: 'm_dil_tr' },
  { kod: 'en', bayrak: '🇬🇧', anahtar: 'm_dil_en' },
  { kod: 'ar', bayrak: '🇸🇦', anahtar: 'm_dil_ar' },
]

export default function MDrawer({ acik, kapat }) {
  const navigate = useNavigate()
  const { tv, dil, setDil } = useT()
  const { tema, setTema } = useTema()
  const [kullanici, setKullanici] = useState(null)
  const [tenantAd, setTenantAd] = useState(null)
  const [dilMenuAcik, setDilMenuAcik] = useState(false)
  const dilMenuRef = useRef(null)

  useEffect(() => {
    if (!acik) { setDilMenuAcik(false); return }
    let iptal = false

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data: kul } = await supabase
          .from('kullanicilar')
          .select('id, ad_soyad, email, rol, tenant_id, foto_url')
          .eq('id', session.user.id)
          .single()

        if (iptal || !kul) return
        setKullanici(kul)

        if (kul.tenant_id) {
          const { data: tnt } = await supabase
            .from('tenants')
            .select('ad')
            .eq('id', kul.tenant_id)
            .single()
          if (!iptal) setTenantAd(tnt?.ad || null)
        }
      } catch (e) {
        console.error('MDrawer yukle hatasi:', e)
      }
    })()

    return () => { iptal = true }
  }, [acik])

  useEffect(() => {
    if (!acik) return
    const h = (e) => { if (e.key === 'Escape') kapat() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [acik, kapat])

  useEffect(() => {
    if (!dilMenuAcik) return
    const h = (e) => {
      if (dilMenuRef.current && !dilMenuRef.current.contains(e.target)) {
        setDilMenuAcik(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [dilMenuAcik])

  async function cikisYap() {
    try {
      await supabase.auth.signOut()
      kapat()
      navigate('/giris')
    } catch (e) {
      console.error('Cikis hatasi:', e)
    }
  }

  function rolEtiketi(rol) {
    if (rol === 'yonetici') return tv('m_drawer_rol_yonetici', 'Yönetici')
    if (rol === 'super_admin') return tv('m_drawer_rol_super_admin', 'Süper Yönetici')
    return tv('m_drawer_rol_operator', 'Operatör')
  }

  function dilSec(yeniDil) {
    setDil(yeniDil)
    setDilMenuAcik(false)
  }

  const aktifDil = DILLER.find(d => d.kod === dil) || DILLER[0]
  const karanlik = tema === 'dark'
  const bas = kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || '?'

  return (
    <>
      <div
        onClick={kapat}
        style={{
          ...s.overlay,
          opacity: acik ? 1 : 0,
          pointerEvents: acik ? 'auto' : 'none',
        }}
      />

      <aside
        style={{
          ...s.panel,
          transform: acik ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Kapatma */}
        <div style={s.kapatBar}>
          <button onClick={kapat} style={s.kapatBtn} aria-label={tv('m_drawer_kapat', 'Kapat')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* HERO: Avatar + isim + email + rol + tenant */}
        <div style={s.hero}>
          <div style={s.avatarWrap}>
            <div style={s.avatar}>
              {kullanici?.foto_url ? (
                <img src={kullanici.foto_url} alt={bas} style={s.avatarImg} />
              ) : (
                <span style={s.avatarText}>{bas}</span>
              )}
            </div>
            <button style={s.avatarKamera} aria-label="Fotograf yukle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          </div>

          <div style={s.ad}>{kullanici?.ad_soyad || '—'}</div>
          <div style={s.email}>{kullanici?.email || ''}</div>

          <div style={s.rozetRow}>
            <span style={s.rolRozet}>{rolEtiketi(kullanici?.rol)}</span>
            {tenantAd && <span style={s.tenantRozet}>{tenantAd}</span>}
          </div>
        </div>

        <div style={s.ayirici} />

        {/* İçerik */}
        <div style={s.icerik}>

          {/* Profili Düzenle */}
          <button style={s.satir} onClick={() => { kapat(); navigate('/profil') }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--txm)" strokeWidth="1.8">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span style={s.satirMetin}>{tv('m_drawer_profili_duzenle', 'Profili Düzenle')}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txd)" strokeWidth="1.8">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Tema satırı — toggle */}
          <div style={s.satir}>
            <span style={s.satirMetin}>{tv('m_drawer_tema', 'Tema')}</span>
            <div style={s.toggleWrap}>
              <span style={{ ...s.toggleIkon, opacity: karanlik ? 0.4 : 1 }}>☀️</span>
              <button
                onClick={() => setTema(karanlik ? 'light-anthracite' : 'dark')}
                style={s.toggle}
                aria-label={tv('m_drawer_tema', 'Tema')}
              >
                <div style={{
                  ...s.toggleTopuz,
                  left: karanlik ? 19 : 1,
                  background: karanlik ? 'var(--tx)' : 'var(--tx)',
                }} />
              </button>
              <span style={{ ...s.toggleIkon, opacity: karanlik ? 1 : 0.4 }}>🌙</span>
            </div>
          </div>

          {/* Dil satırı — dropdown */}
          <div style={s.satir} ref={dilMenuRef}>
            <span style={s.satirMetin}>{tv('m_drawer_dil', 'Dil')}</span>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDilMenuAcik(v => !v)}
                style={s.dilBtn}
              >
                <span style={{ fontSize: 14 }}>{aktifDil.bayrak}</span>
                <span>{aktifDil.kod.toUpperCase()}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="var(--txm)" strokeWidth="2"
                  style={{ transform: dilMenuAcik ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {dilMenuAcik && (
                <div style={s.dilMenu}>
                  {DILLER.map((d, i) => (
                    <button
                      key={d.kod}
                      onClick={() => dilSec(d.kod)}
                      style={{
                        ...s.dilMenuItem,
                        background: d.kod === dil ? 'rgba(45,142,255,0.1)' : 'transparent',
                        color: d.kod === dil ? 'var(--ac)' : 'var(--tx)',
                        borderTop: i === 0 ? 'none' : '1px solid var(--bor)',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{d.bayrak}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>{tv(d.anahtar, d.kod)}</span>
                      {d.kod === dil && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Çıkış */}
        <div style={s.cikisWrap}>
          <button onClick={cikisYap} style={s.cikisBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>{tv('m_drawer_cikis', 'Çıkış Yap')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 998,
    transition: 'opacity 220ms ease',
  },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 'min(340px, 88vw)',
    background: 'var(--sur)',
    zIndex: 999,
    transition: 'transform 280ms cubic-bezier(.2,.8,.2,1)',
    display: 'flex', flexDirection: 'column',
    boxShadow: '-8px 0 30px rgba(0,0,0,0.35)',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  kapatBar: { display: 'flex', justifyContent: 'flex-end', padding: '14px 16px 0' },
  kapatBtn: {
    width: 32, height: 32, borderRadius: 16,
    background: 'transparent', border: 'none',
    color: 'var(--txm)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  hero: {
    padding: '6px 24px 26px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: 18 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    background: 'linear-gradient(135deg, #2D8EFF 0%, #1668c9 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', cursor: 'pointer',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
  },
  avatarKamera: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    background: 'var(--sur)',
    border: '1.5px solid var(--ac)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  ad: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 26, fontWeight: 700,
    color: 'var(--tx)', lineHeight: 1.1, marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 14, color: 'var(--txm)', marginBottom: 14,
    textAlign: 'center',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  rozetRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  rolRozet: {
    padding: '4px 11px',
    background: 'rgba(45,142,255,0.12)',
    color: 'var(--ac)',
    fontSize: 14, fontWeight: 500,
    borderRadius: 999,
  },
  tenantRozet: {
    padding: '4px 11px',
    background: 'rgba(148,163,184,0.12)',
    color: 'var(--txm)',
    fontSize: 14, fontWeight: 500,
    borderRadius: 999,
  },

  ayirici: { height: 1, background: 'var(--bor)', margin: '0 20px' },

  icerik: { flex: 1, padding: '8px 8px', overflow: 'visible' },

  satir: {
    width: '100%',
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
    background: 'transparent', border: 'none', borderRadius: 10,
    color: 'var(--tx)', cursor: 'pointer', textAlign: 'left',
  },
  satirMetin: { flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--tx)' },

  toggleWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  toggleIkon: { fontSize: 15, transition: 'opacity 150ms' },
  toggle: {
    position: 'relative',
    width: 40, height: 22,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: 999,
    cursor: 'pointer',
    padding: 0,
  },
  toggleTopuz: {
    position: 'absolute',
    top: 1,
    width: 18, height: 18,
    borderRadius: 9,
    transition: 'left 200ms cubic-bezier(.2,.8,.2,1)',
  },

  dilBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px',
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: 8,
    color: 'var(--tx)',
    fontSize: 14, fontWeight: 500,
    cursor: 'pointer',
  },
  dilMenu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    insetInlineEnd: 0,
    minWidth: 160,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  dilMenuItem: {
    width: '100%',
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px',
    border: 'none',
    fontSize: 14, fontWeight: 500,
    cursor: 'pointer',
  },

  cikisWrap: { padding: '12px 20px 20px' },
  cikisBtn: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 14,
    background: 'transparent',
    border: '1px solid rgba(229,62,62,0.4)',
    borderRadius: 12,
    color: 'var(--re)',
    fontSize: 14, fontWeight: 500,
    cursor: 'pointer',
  },
}
