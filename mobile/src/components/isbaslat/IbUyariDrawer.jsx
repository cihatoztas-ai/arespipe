// mobile/src/components/isbaslat/IbUyariDrawer.jsx
// AresPipe — İş Başlat akış-kesici uyarı drawer'ı — 68. oturum (MK-68.B)
//
// Ortak drawer komponent. Hem IbQRTara (cross-tenant) hem IbSpoolDetay
// (devamEdiyor + alternatif basamak) için kullanılır.
//
// Tipler:
//   crossTenant                — kırmızı, tek koyu solid buton "Tamam, geri dön"
//   devamEdiyor                — amber, [Devral][İptal]
//   alternatifBasamakYetkili   — mavi info, [{Alternatif} ile başla][İptal]
//   alternatifBasamakYetkisiz  — mavi info, tek koyu solid buton "İptal"
//
// Props:
//   tip       — string (yukarıdaki 4 değerden biri)
//   payload   — { operatorAd?, aktifBasamak?, alternatif? }
//   onKapat   — () => void (İptal / Tamam butonları çağırır)
//   onAksiyon — (aksiyon: 'devral' | 'alternatifeBasla') => void
//
// Mockup referansı: 68. oturum v19 4-senaryo görseli.

import { useT } from '../../lib/i18n'

export default function IbUyariDrawer({ tip, payload = {}, onKapat, onAksiyon }) {
  const { tv } = useT()

  const konfig = (() => {
    switch (tip) {
      case 'crossTenant':
        return {
          aksent: 'var(--re)',
          aksentBg: 'rgba(229,62,62,0.12)',
          ikonStroke: 'var(--re)',
          ikonSvg: (
            <>
              <line x1="6" y1="6" x2="18" y2="18"/>
              <line x1="18" y1="6" x2="6" y2="18"/>
            </>
          ),
          baslik: tv('m_ib_uy_ct_baslik', 'Bu spool size ait değil'),
          mesaj:  tv('m_ib_uy_ct_mesaj',  'Bu spool başka bir firmaya ait. Görüntüleyemezsiniz.'),
          butonlar: [
            { etiket: tv('m_ib_uy_ct_btn', 'Tamam, geri dön'), tip: 'koyu', onClick: onKapat },
          ],
        }

      case 'devamEdiyor': {
        const ad = payload.operatorAd && payload.operatorAd.trim()
          ? payload.operatorAd
          : tv('m_ib_uy_de_baska', 'Başka bir operatör')
        return {
          aksent: 'var(--warn)',
          aksentBg: 'rgba(186,117,23,0.12)',
          ikonStroke: 'var(--warn)',
          ikonSvg: (
            <>
              <circle cx="12" cy="12" r="9"/>
              <polyline points="12 7 12 12 15 14"/>
            </>
          ),
          baslik: tv('m_ib_uy_de_baslik', 'Bu işi başkası yürütüyor'),
          mesaj:  ad + ' ' + tv('m_ib_uy_de_mesaj_son', 'bu işi yarım bıraktı.'),
          butonlar: [
            { etiket: tv('m_ib_uy_de_devral', 'Devral'), tip: 'birincil', onClick: () => onAksiyon && onAksiyon('devral') },
            { etiket: tv('m_ib_uy_iptal',     'İptal'),  tip: 'ikincil',  onClick: onKapat },
          ],
        }
      }

      case 'alternatifBasamakYetkili': {
        const akt = payload.aktifBasamak || ''
        const alt = payload.alternatif    || ''
        return {
          aksent: 'var(--ac)',
          aksentBg: 'rgba(45,142,255,0.12)',
          ikonStroke: 'var(--ac)',
          ikonSvg: (
            <>
              <circle cx="12" cy="12" r="9"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </>
          ),
          baslik: akt
            ? `${tv('m_ib_uy_ab_baslik_pre', 'Sıra')} ${akt}`
            : tv('m_ib_uy_ab_baslik_default', 'Alternatif basamak'),
          mesaj: akt && alt
            ? `${akt} ${tv('m_ib_uy_ab_msg_mid', 'henüz yapılmamış.')} ${alt} ${tv('m_ib_uy_ab_msg_son', 'kaynağından başlayabilirsiniz.')}`
            : tv('m_ib_uy_ab_msg_generic', 'Aktif basamak farklı, alternatif yapılabilir.'),
          butonlar: [
            {
              etiket: alt
                ? `${alt} ${tv('m_ib_uy_ab_basla', 'ile başla')}`
                : tv('m_ib_uy_ab_basla_default', 'Başla'),
              tip: 'birincil',
              onClick: () => onAksiyon && onAksiyon('alternatifeBasla'),
            },
            { etiket: tv('m_ib_uy_iptal', 'İptal'), tip: 'ikincil', onClick: onKapat },
          ],
        }
      }

      case 'alternatifBasamakYetkisiz': {
        const akt = payload.aktifBasamak || ''
        return {
          aksent: 'var(--ac)',
          aksentBg: 'rgba(45,142,255,0.12)',
          ikonStroke: 'var(--ac)',
          ikonSvg: (
            <>
              <circle cx="12" cy="12" r="9"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </>
          ),
          baslik: akt
            ? `${tv('m_ib_uy_ab_baslik_pre', 'Sıra')} ${akt}`
            : tv('m_ib_uy_ab_baslik_default', 'Alternatif basamak'),
          mesaj: tv('m_ib_uy_ab_yz_mesaj', 'Bu işi yapma yetkiniz yok.'),
          butonlar: [
            { etiket: tv('m_ib_uy_iptal', 'İptal'), tip: 'koyu', onClick: onKapat },
          ],
        }
      }

      default:
        return null
    }
  })()

  if (!konfig) return null

  return (
    <div style={s.overlay}>
      <div style={{ ...s.kart, borderLeft: `4px solid ${konfig.aksent}` }}>
        <div style={{ ...s.ikonDaire, background: konfig.aksentBg }}>
          <svg
            width="20" height="20" viewBox="0 0 24 24"
            fill="none"
            stroke={konfig.ikonStroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {konfig.ikonSvg}
          </svg>
        </div>
        <p style={s.baslik}>{konfig.baslik}</p>
        <p style={s.mesaj}>{konfig.mesaj}</p>
        <div style={s.butonlarWrap}>
          {konfig.butonlar.map((btn, i) => (
            <button
              key={i}
              type="button"
              style={
                btn.tip === 'birincil' ? s.btnBirincil :
                btn.tip === 'koyu'     ? s.btnKoyu     :
                                          s.btnIkincil
              }
              onClick={btn.onClick}
            >
              {btn.etiket}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    animation: 'ibUyFade 240ms ease-out forwards',
  },
  kart: {
    background: 'var(--sur)',
    color: 'var(--tx)',
    borderRadius: 14,
    padding: '18px 18px 16px',
    width: '100%',
    maxWidth: 360,
    fontFamily: 'Barlow, system-ui, sans-serif',
  },
  ikonDaire: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  baslik: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 17,
    fontWeight: 700,
    margin: '0 0 8px',
    color: 'var(--tx)',
    letterSpacing: 0.3,
  },
  mesaj: {
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--txd)',
    margin: '0 0 16px',
  },
  butonlarWrap: {
    display: 'flex',
    gap: 8,
  },
  btnBirincil: {
    flex: 1,
    padding: 12,
    background: 'var(--ac)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  btnIkincil: {
    flex: 1,
    padding: 12,
    background: 'transparent',
    color: 'var(--tx)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  btnKoyu: {
    flex: 1,
    padding: 12,
    background: 'var(--tx)',
    color: 'var(--sur)',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
}
