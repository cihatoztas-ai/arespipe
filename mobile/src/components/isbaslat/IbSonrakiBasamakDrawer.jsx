// mobile/src/components/isbaslat/IbSonrakiBasamakDrawer.jsx
// 3f.3 — Sonraki basamak secim drawer'i (iki ekranli)
//
// Mimari:
//   1) Ana ekran: basamak_tanimlari'ndan sonraki tum basamaklar (n buton)
//      - ilk buton primary mavi (dogal sonraki)
//      - digerleri secondary gri (atlama secenekleri)
//   2) Kaynak alt ekrani: "Kaynak" basildiginda alt-tip secimi (Argon / Gazalti)
//      - "Geri" linki ile basamak ekranina donulebilir
//
// MK-68.4 Ib-prefix
// MK-71.1 basamak adlari DB-driven (basamakAdi + dil)
// MK-71.3 lib/i18n useT() pattern: { tv, dil, setDil, mevcutDiller }
// Cihat 71: "Atla yok, secim zorunlu" + "coklu basamak secimi"

import { useState, useEffect } from 'react'
import { useT } from '../../lib/i18n'
import { basamakAdi, KAYNAK_ALT_TIPLERI } from '../../lib/basamak-akisi'

/**
 * @param {boolean} acik
 * @param {Array} basamaklar - sonrakiBasamaklar() ciktisi (sira ASC)
 * @param {(sistemAdi: string) => Promise<void>} onSec - secim callback
 *        sistemAdi: 'on_kontrol' / 'argon_kaynagi' / 'gazalti_kaynagi' vb.
 * @param {boolean} yukleniyor - DB UPDATE devam ederken butonlari devre disi birak
 */
export default function IbSonrakiBasamakDrawer({
  acik,
  basamaklar = [],
  onSec,
  yukleniyor = false,
}) {
  const { tv, dil } = useT()

  // Drawer ic state: hangi ekran gosteriliyor
  const [ekran, setEkran] = useState('basamak') // 'basamak' | 'kaynak_yontemi'

  // Drawer her acildiginda basamak ekranina don
  useEffect(() => {
    if (acik) setEkran('basamak')
  }, [acik])

  if (!acik) return null

  // Ana basamak ekraninda buton tikina
  const handleBasamakSec = (basamak) => {
    if (basamak.sistem_adi === 'kaynak') {
      // Kaynak — alt-tip secimine gec
      setEkran('kaynak_yontemi')
      return
    }
    // Diger basamaklar — direkt onSec
    onSec(basamak.sistem_adi)
  }

  // Kaynak alt-tip secimi
  const handleKaynakAltTipi = (altTipKodu) => {
    onSec(altTipKodu)
  }

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
        {ekran === 'basamak' ? (
          <BasamakEkrani
            tv={tv}
            dil={dil}
            basamaklar={basamaklar}
            yukleniyor={yukleniyor}
            onBasamakSec={handleBasamakSec}
          />
        ) : (
          <KaynakYontemEkrani
            tv={tv}
            yukleniyor={yukleniyor}
            onYontemSec={handleKaynakAltTipi}
            onGeri={() => setEkran('basamak')}
          />
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Ekran 1: Sonraki basamak listesi
// ─────────────────────────────────────────────────────────────────
function BasamakEkrani({ tv, dil, basamaklar, yukleniyor, onBasamakSec }) {
  return (
    <>
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
              onClick={() => onBasamakSec(b)}
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
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Ekran 2: Kaynak yontem secimi (alt-tip)
// ─────────────────────────────────────────────────────────────────
function KaynakYontemEkrani({ tv, yukleniyor, onYontemSec, onGeri }) {
  // KAYNAK_ALT_TIPLERI'deki i18nKey'lerin TR fallback'leri
  const kaynakFallback = {
    m_ib_sd_kaynak_yontemi_argon: 'Argon Kaynağı',
    m_ib_sd_kaynak_yontemi_gazalti: 'Gazaltı Kaynağı',
  }

  return (
    <>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 8px',
          textAlign: 'center',
        }}
      >
        {tv('m_ib_sd_kaynak_yontemi_baslik', 'Kaynak Yöntemi')}
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
        {tv(
          'm_ib_sd_kaynak_yontemi_mesaj',
          'Spool için kaynak yöntemini seç. Sonraki kaynakçı bu seçime göre yönlendirilir.'
        )}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {KAYNAK_ALT_TIPLERI.map((alt, i) => (
          <button
            key={alt.kod}
            type="button"
            disabled={yukleniyor}
            onClick={() => onYontemSec(alt.kod)}
            style={{
              padding: '14px 16px',
              fontSize: 16,
              fontWeight: 600,
              color: i === 0 ? '#fff' : '#111827',
              background: i === 0 ? '#2D8EFF' : '#f3f4f6',
              border: i === 0 ? 'none' : '1px solid #e5e7eb',
              borderRadius: 12,
              cursor: yukleniyor ? 'not-allowed' : 'pointer',
              opacity: yukleniyor ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{tv(alt.i18nKey, kaynakFallback[alt.i18nKey] || alt.kod)}</span>
            <span aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      {/* Geri (basamak ekranina don) — kaynak secimi yanlis basildiysa */}
      <button
        type="button"
        disabled={yukleniyor}
        onClick={onGeri}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '10px',
          fontSize: 13,
          fontWeight: 500,
          color: '#6b7280',
          background: 'transparent',
          border: 'none',
          cursor: yukleniyor ? 'not-allowed' : 'pointer',
          opacity: yukleniyor ? 0.5 : 1,
        }}
      >
        ← {tv('m_ib_sd_kaynak_yontemi_geri', 'Basamak seçimine dön')}
      </button>
    </>
  )
}
