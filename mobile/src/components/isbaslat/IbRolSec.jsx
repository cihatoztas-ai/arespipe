// mobile/src/components/isbaslat/IbRolSec.jsx
// İş Başlat — Ekran 1: Rol Seç
// Operatörün atanmış işlem bloklarını liste olarak gösterir.
// Tıklayınca rolü aktif eder (highlighted), bottom nav'daki QR FAB butonu kullanılabilir hale gelir.
// Sınıflar ares-mobile.css'ten gelir: .m-card-list, .m-card-item, .cl-*, .m-card-icon, .m-card-body, .m-card-title

import { blokIkon, blokRenkSinifi, blokIkonRenkStili } from '../../lib/isbaslat'
import { useT } from '../../lib/i18n'

export default function IbRolSec({ bloklar, seciliRolId, onRolSec }) {
  const { tv } = useT()

  // ───────────────────────────────────────────────
  // Yetki yok durumu
  // ───────────────────────────────────────────────
  if (!bloklar || bloklar.length === 0) {
    return (
      <div style={{
        padding: '32px 24px',
        textAlign: 'center',
        color: 'var(--txd)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>🔒</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>
          {tv('m_ib_yetki_yok', 'İşlem yetkiniz bulunmuyor')}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          {tv('m_ib_yetki_yok_aciklama', 'Yöneticinizden işlem bloğu yetkisi tanımlanmasını isteyin.')}
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────
  // Liste
  // ───────────────────────────────────────────────
  return (
    <div className="m-card-list">
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--txd)',
        letterSpacing: 0.8,
        margin: '0 4px 4px',
        textTransform: 'uppercase',
      }}>
        {tv('m_ib_ne_yapacaksiniz', 'Ne yapacaksınız?')}
      </div>

      {bloklar.map(blok => {
        const sec = seciliRolId === blok.id
        return (
          <button
            key={blok.id}
            type="button"
            className={`m-card-item ${blokRenkSinifi(blok.renk)}`}
            onClick={() => onRolSec(blok)}
            style={{
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              ...(sec ? {
                background: 'var(--ac2)',
                borderColor: 'var(--ac)',
              } : {}),
            }}
          >
            <div className="m-card-icon" style={blokIkonRenkStili(blok.renk)}>
              {blokIkon(blok.ad)}
            </div>
            <div className="m-card-body">
              <div className="m-card-title">{blok.ad}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
