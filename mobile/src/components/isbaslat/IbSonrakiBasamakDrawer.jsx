// mobile/src/components/isbaslat/IbSonrakiBasamakDrawer.jsx
// 3f.3 — Sonraki basamak secim drawer'i (TEK EKRAN, sadelesmis)
//
// Mimari:
//   - Drawer'da dogrudan tum olasi sonraki basamaklar gosterilir
//     (kaynak alt-tipleri zaten ayri buton — Argon Kaynagi / Gazalti Kaynagi)
//   - "Atla" yok, secim zorunlu (Cihat 71)
//   - Ilk buton primary mavi (dogal sonraki)
//
// MK-68.4 Ib-prefix
// MK-71.1 basamak adlari DB-driven (basamakAdi + dil)
// MK-71.3 lib/i18n useT() pattern: { tv, dil }
// MK-71.5 RLS permissive policy uyarisi (basamak_tanimlari multi-tenant cleanup)

import { useT } from '../../lib/i18n'
import { basamakAdi } from '../../lib/basamak-akisi'

/**
 * @param {boolean} acik
 * @param {Array} basamaklar - sonrakiBasamaklar() ciktisi (ana basamak + alt-tipler birlikte)
 * @param {(sistemAdi: string) => Promise<void>} onSec - secim callback
 * @param {boolean} yukleniyor - DB UPDATE devam ederken butonlari devre disi birak
 */
export default function IbSonrakiBasamakDrawer({
  acik,
  basamaklar = [],
  onSec,
  yukleniyor = false,
}) {
  const { tv, dil } = useT()

  if (!acik) return null

  return (
    <>
      {/* Overlay — onClick yok (atla yok, secim zorunlu) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 998,
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.18)',
          zIndex: 999,
          padding: '24px 20px 32px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 8px',
            textAlign: 'center',
          }}
        >
          {tv('m_ib_sd_sonraki_basamak_baslik', 'Sonraki Basamak')}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: '#6b7280',
            margin: '0 0 24px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {tv('m_ib_sd_sonraki_basamak_mesaj', "İşin tamamlandı. Spool'u sonraki adıma gönder.")}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {basamaklar.map((b, i) => {
            const ad = basamakAdi(b, dil)
            const isPrimary = i === 0 // Ilk eleman dogal sonraki — primary mavi
            return (
              <button
                key={b.sistem_adi}
                type="button"
                disabled={yukleniyor}
                onClick={() => onSec(b.sistem_adi)}
                style={{
                  padding: '14px 16px',
                  fontSize: 16,
                  fontWeight: 600,
                  color: isPrimary ? '#fff' : '#111827',
                  background: isPrimary ? '#2D8EFF' : '#f3f4f6',
                  border: isPrimary ? 'none' : '1px solid #e5e7eb',
                  borderRadius: 12,
                  cursor: yukleniyor ? 'not-allowed' : 'pointer',
                  opacity: yukleniyor ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{ad}</span>
                <span aria-hidden="true">→</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
