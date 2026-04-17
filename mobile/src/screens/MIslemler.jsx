// mobile/src/screens/MIslemler.jsx
// Kullanıcının yetki bloklarına göre grup-bazlı büyük buton ekranı.
// - Her grup = bir buton
// - Buton adı = grup adı (veya i18n çevirisi)
// - Tıklayınca → grubun hedef sayfasına yönlendirir
//
// Hem yönetici "İşlem Başlat"tan gelince hem de operatörün ana ekranı olarak kullanılır.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { getKullaniciGruplari } from '../lib/yetki'
import { getGrupBilgisi } from '../lib/gruplar'

export default function MIslemler({ kullanici }) {
  const navigate = useNavigate()
  const { tv } = useT()

  const [gruplar, setGruplar] = useState(null)
  const [hata, setHata] = useState(null)

  // Selamlama saate göre
  const saat = new Date().getHours()
  const selamlamaKey = saat < 12 ? 'm_gunaydin' : saat < 18 ? 'm_iyi_gunler' : 'm_iyi_aksamlar'

  // Rol etiketi
  const rolKey = kullanici?.rol ? `m_rol_${kullanici.rol}` : null
  const rolLabel = rolKey ? tv(rolKey, kullanici.rol) : ''

  useEffect(() => {
    ;(async () => {
      try {
        const gpl = await getKullaniciGruplari()
        setGruplar(gpl)
      } catch (e) {
        console.warn('[MIslemler] Bloklar alınamadı:', e)
        setHata(tv('m_hata_genel', 'Bir hata oluştu'))
      }
    })()
  }, [tv])

  function grubaGit(grup_adi) {
    const bilgi = getGrupBilgisi(grup_adi)
    const hedef = bilgi.param ? `${bilgi.hedef}?${bilgi.param}` : bilgi.hedef
    navigate(hedef)
  }

  function yakinda(metin) {
    alert(tv('m_toast_yakinda', '{sayfa} sayfası yakında').replace('{sayfa}', metin))
  }

  return (
    <div style={s.sayfa}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.topbarLogo}>AP</div>
        <div style={s.topbarTitle}>{tv('m_app_title', 'AresPipe')}</div>
        <button
          style={s.topbarBtn}
          onClick={() => yakinda(tv('m_menu', 'Menü'))}
          aria-label="menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Scroll alan */}
      <div style={s.scroll}>

        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroGreeting}>{tv(selamlamaKey, 'Günaydın')}</div>
          <div style={s.heroName}>
            {kullanici?.ad_soyad || kullanici?.email || tv('m_kullanici', 'Kullanıcı')}
          </div>
          {rolLabel && <div style={s.heroMeta}>{rolLabel}</div>}
        </div>

        {/* Başlık */}
        <div style={s.sectionRow}>
          <div style={s.sectionTitle}>
            {tv('m_islemler_soru', 'Ne yapacaksınız?')}
          </div>
        </div>

        {/* Buton listesi veya boş durum */}
        {gruplar === null && !hata ? (
          <div style={s.bosDurum}>•••</div>
        ) : hata ? (
          <div style={{ ...s.bosDurum, color: 'var(--re)' }}>{hata}</div>
        ) : gruplar.length === 0 ? (
          <div style={s.bosDurum}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>
              {tv('m_yetki_yok_baslik', 'Henüz yetki tanımlanmamış')}
            </div>
            <div style={{ fontSize: 14, color: 'var(--txd)', lineHeight: 1.5 }}>
              {tv('m_yetki_yok_aciklama', 'Yöneticinizle iletişime geçin.')}
            </div>
          </div>
        ) : (
          <div style={s.butonListe}>
            {gruplar.map((grup) => {
              const bilgi = getGrupBilgisi(grup.grup_adi)
              const label = bilgi.i18n
                ? tv(bilgi.i18n, grup.grup_adi)
                : grup.grup_adi

              return (
                <GrupButonu
                  key={grup.grup_adi}
                  ikon={bilgi.ikon}
                  renk={bilgi.renk}
                  baslik={label}
                  altbaslik={tv('m_islem_baslat_alt', 'QR okut, işe başla')}
                  onClick={() => grubaGit(grup.grup_adi)}
                />
              )
            })}

            {/* QR Tara — herkese açık, blok gerektirmez */}
            <GrupButonu
              ikon="📷"
              renk="var(--ac)"
              baslik={tv('m_kart_qr_tara', 'QR Tara')}
              altbaslik={tv('m_kart_qr_tara_alt', 'Spool bilgisini gör')}
              onClick={() => yakinda(tv('m_kart_qr_tara', 'QR Tara'))}
            />
          </div>
        )}

        {/* Alt boşluk safe-area */}
        <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  )
}

/* ─── Buton componenti ─── */

function GrupButonu({ ikon, renk, baslik, altbaslik, onClick }) {
  return (
    <button style={{ ...b.btn, borderLeft: `4px solid ${renk}` }} onClick={onClick}>
      <div style={{ ...b.ikonKutu, background: `${renk}22` }}>
        <span style={{ fontSize: 26 }}>{ikon}</span>
      </div>
      <div style={b.body}>
        <div style={{ ...b.baslik, color: 'var(--tx)' }}>{baslik}</div>
        <div style={b.alt}>{altbaslik}</div>
      </div>
      <div style={{ ...b.ok, color: 'var(--txd)' }}>›</div>
    </button>
  )
}

/* ─── Stiller ─── */

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
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  bosDurum: {
    padding: '40px 24px',
    textAlign: 'center',
    color: 'var(--txd)',
    fontSize: 14,
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
}
