// mobile/src/components/isbaslat/IbRolSec.jsx
// İş Başlat — Ekran 1: Rol Seç
// 64. oturumda yazıldı, 65. oturumda güncellendi:
//   - v3.2 renk palette'i (turkuaz/indigo/turuncu/pembe/mor) — blokRenkHex
//   - Sol şerit ve ikon arka planı runtime hex ile (CSS cl-X preset yerine)
//   - Kart başlığı uppercase + 16px + letter-spacing (Ekran 2 chip ile tutarlı)
//
// Operatörün atanmış işlem bloklarını liste olarak gösterir.
// Tıklayınca rolü aktif eder (highlighted), bottom nav'daki QR FAB
// butonu kullanılabilir hale gelir.

import { blokIkon, blokRenkHex, hexToRgba } from '../../lib/isbaslat'
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
        // v3.2 palette önceliklidir; eski entry'lerde (renkHex yoksa) fallback
        const renkHex = blok.renkHex || blokRenkHex(blok.ad)

        const baseStyle = {
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          borderLeft: `4px solid ${renkHex}`,
        }
        const finalStyle = sec
          ? { ...baseStyle, background: 'var(--ac2)' }
          : baseStyle

        return (
          <button
            key={blok.id}
            type="button"
            className="m-card-item"
            onClick={() => onRolSec(blok)}
            style={finalStyle}
          >
            <div
              className="m-card-icon"
              style={{
                background: hexToRgba(renkHex, 0.14),
                color: renkHex,
              }}
            >
              {blokIkon(blok.ad)}
            </div>
            <div className="m-card-body">
              <div
                className="m-card-title"
                style={{
                  textTransform: 'uppercase',
                  fontSize: 16,
                  letterSpacing: 0.8,
                  fontWeight: 700,
                }}
              >
                {blok.ad}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
