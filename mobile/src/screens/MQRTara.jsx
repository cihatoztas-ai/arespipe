// mobile/src/screens/MQRTara.jsx
// AresPipe — QR Tara ekranı (mobil React port'u, 63. oturum)
// Vanilla qr.html (346 satır) yerine geçer.
//
// Özellikler:
// - BarcodeDetector API (modern Android Chrome) → jsQR CDN fallback (iOS Safari)
// - Tam ekran kamera (object-fit cover)
// - Tarama çerçevesi + animasyonlu çizgi
// - Manuel giriş bottom-sheet — tenant kodu solda sabit prefix,
//   kullanıcı sadece numara yazar (saf numerik, dinamik 4-6 hane)
// - Durum chip'leri: tarama / arama / bulundu / hata
// - Bulunduğunda /spool/:id'ye yönlenir
// - 2 saniye sonra hatadan otomatik tekrar tarama
//
// Notlar:
// - Permission akışı: vanilla A — direkt getUserMedia, hata gelirse fallback ekran
// - Manuel giriş: tenants.kod prefix solda görünür (Aresmak A-, başka firma örn CKM-)
// - 6. oturumdaki tenant_prefix kararı: spool_id format "KOD-NUMARA" (uppercase)
// - Eski kayıtlar prefix'siz olabilir (geriye uyumlu) — şu an QR ile gelirse direkt arar
// - Cross-tenant uyarısı (6. oturumdan plan) bu iterasyonda YOK — gelecek oturuma

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { getOturum, getTenantId } from '../lib/auth'

// ───────────────────────── Sabitler ─────────────────────────

const JSQR_CDN = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
const HATA_BEKLEME_MS = 2200  // bulunamadı sonrası tekrar tarama
const BULUNDU_BEKLEME_MS = 500 // bulunduğunda yönlendirme öncesi

// ───────────────────────── Component ─────────────────────────

export default function MQRTara() {
  const navigate = useNavigate()
  const { tv } = useT()

  // UI state
  const [durum, setDurum] = useState('tarama') // tarama|arama|bulundu|hata|kameraYok
  const [durumYazi, setDurumYazi] = useState('')
  const [manuelAcik, setManuelAcik] = useState(false)
  const [manuelDeger, setManuelDeger] = useState('')
  const [tenantKod, setTenantKod] = useState('')

  // Refs (re-render tetiklemez — kamera/RAF yönetimi için)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const detectorRef = useRef(null)
  const taramaAcikRef = useRef(true)
  const bulundupRef = useRef(false)
  const inputRef = useRef(null)

  // ─── Tenant kodunu yükle ───
  useEffect(() => {
    let iptal = false
    async function tenantKodYukle() {
      try {
        const tid = await getTenantId()
        if (!tid) return
        // RLS 400 sorunu yaşanmaması için ayrı sorgu (CLAUDE-MOBILE.md notu)
        const { data, error } = await supabase
          .from('tenants')
          .select('kod')
          .eq('id', tid)
          .maybeSingle()
        if (error || iptal) return
        if (data?.kod) setTenantKod(data.kod)
      } catch (e) {
        console.warn('[MQRTara] tenant kod yüklenemedi:', e)
      }
    }
    tenantKodYukle()
    return () => { iptal = true }
  }, [])

  // ─── jsQR dinamik yükleme ───
  const jsQRYukle = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (typeof window.jsQR !== 'undefined') { resolve(); return }
      const s = document.createElement('script')
      s.src = JSQR_CDN
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }, [])

  // ─── Spool arama ───
  const spoolAra = useCallback(async (spoolIdRaw) => {
    if (bulundupRef.current) return
    bulundupRef.current = true
    taramaAcikRef.current = false

    if (navigator.vibrate) {
      try { navigator.vibrate(100) } catch (e) {}
    }

    const spoolId = (spoolIdRaw || '').trim().toUpperCase()
    setDurum('arama')
    setDurumYazi(spoolId + ' ' + tv('m_qr_araniyor', 'aranıyor…'))

    try {
      const oturum = await getOturum()
      if (!oturum) { navigate('/giris'); return }
      const tid = await getTenantId()
      if (!tid) {
        setDurum('hata')
        setDurumYazi(tv('m_qr_baglanti_hatasi', 'Bağlantı kurulamadı'))
        setTimeout(taramayiTekrarBaslat, HATA_BEKLEME_MS)
        return
      }

      // 6. oturum: QR payload format "KOD-NUMARA:UUID" planlanmıştı.
      // Şu an payload sadece "KOD-NUMARA" — UUID parse'ı gelecek oturumda eklenir.
      // Eski prefix'siz kayıtlar da spool_id'de "0504" formatında olabilir.
      const { data, error } = await supabase
        .from('spooller')
        .select('id, spool_id')
        .eq('tenant_id', tid)
        .eq('spool_id', spoolId)
        .or('silindi.is.null,silindi.eq.false')
        .limit(1)
        .maybeSingle()

      if (error || !data) {
        setDurum('hata')
        setDurumYazi(tv('m_qr_bulunamadi', 'Spool bulunamadı') + ': ' + spoolId)
        setTimeout(taramayiTekrarBaslat, HATA_BEKLEME_MS)
        return
      }

      setDurum('bulundu')
      setDurumYazi(tv('m_qr_bulundu', 'Bulundu — yönlendiriliyor…'))
      setTimeout(() => navigate('/spool/' + data.id), BULUNDU_BEKLEME_MS)
    } catch (e) {
      console.warn('[MQRTara] arama hatası:', e)
      setDurum('hata')
      setDurumYazi(tv('m_qr_baglanti_hatasi', 'Bağlantı kurulamadı'))
      setTimeout(taramayiTekrarBaslat, HATA_BEKLEME_MS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, tv])

  // Tekrar tarama — hata sonrası
  function taramayiTekrarBaslat() {
    bulundupRef.current = false
    taramaAcikRef.current = true
    setDurum('tarama')
    setDurumYazi(tv('m_qr_durum_baslangic', 'Kodu çerçeveye hizala'))
    taramaCalistir()
  }

  // ─── Tarama döngüsü ───
  function taramaCalistir() {
    if (!taramaAcikRef.current) return
    const video = videoRef.current
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(taramaCalistir)
      return
    }

    if (detectorRef.current) {
      // BarcodeDetector path
      detectorRef.current.detect(video).then(barcodes => {
        if (!taramaAcikRef.current) return
        if (barcodes && barcodes.length > 0) {
          spoolAra(barcodes[0].rawValue)
          return
        }
        rafRef.current = requestAnimationFrame(taramaCalistir)
      }).catch(() => {
        if (taramaAcikRef.current) {
          rafRef.current = requestAnimationFrame(taramaCalistir)
        }
      })
    } else if (typeof window.jsQR !== 'undefined') {
      // jsQR path
      const canvas = canvasRef.current
      if (!canvas) {
        rafRef.current = requestAnimationFrame(taramaCalistir)
        return
      }
      const ctx = canvas.getContext('2d')
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code && code.data) {
          spoolAra(code.data)
          return
        }
      } catch (e) {}
      rafRef.current = requestAnimationFrame(taramaCalistir)
    }
  }

  // ─── Kamera + dedektör başlat ───
  useEffect(() => {
    let iptal = false

    async function kameraBaslat() {
      // Dedektör seç
      let dedektorVar = false
      if ('BarcodeDetector' in window) {
        try {
          const desteklenen = await window.BarcodeDetector.getSupportedFormats()
          if (desteklenen.includes('qr_code')) {
            detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
            dedektorVar = true
          }
        } catch (e) {}
      }
      if (!dedektorVar) {
        try {
          await jsQRYukle()
          dedektorVar = typeof window.jsQR !== 'undefined'
        } catch (e) {
          if (!iptal) setDurum('kameraYok')
          return
        }
      }
      if (iptal) return

      // Kamera başlat
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        if (iptal) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        video.srcObject = stream
        video.addEventListener('loadedmetadata', function onLoad() {
          if (canvasRef.current) {
            canvasRef.current.width = video.videoWidth
            canvasRef.current.height = video.videoHeight
          }
          taramaAcikRef.current = true
          bulundupRef.current = false
          setDurum('tarama')
          taramaCalistir()
        }, { once: true })
      } catch (e) {
        console.warn('[MQRTara] kamera açılmadı:', e)
        if (!iptal) setDurum('kameraYok')
      }
    }

    setDurumYazi(tv('m_qr_durum_baslangic', 'Kodu çerçeveye hizala'))
    kameraBaslat()

    return () => {
      iptal = true
      taramaAcikRef.current = false
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Manuel modal — body scroll lock + ESC + autofocus ───
  useEffect(() => {
    if (manuelAcik) {
      const onceki = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      // Manuel açıkken arka tarama duruyor (CPU + battery)
      taramaAcikRef.current = false

      // Autofocus
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus()
      }, 100)

      function onKey(e) {
        if (e.key === 'Escape') manuelKapat()
      }
      window.addEventListener('keydown', onKey)
      return () => {
        document.body.style.overflow = onceki
        window.removeEventListener('keydown', onKey)
      }
    } else {
      // Manuel kapandığında tarama tekrar açılır (eğer hata akışında değilsek)
      if (durum === 'tarama' && !bulundupRef.current) {
        taramaAcikRef.current = true
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuelAcik])

  function manuelAc() {
    setManuelDeger('')
    setManuelAcik(true)
  }
  function manuelKapat() {
    setManuelAcik(false)
    setManuelDeger('')
    // Tarama tekrar başlat (hata akışında değilsek)
    if (!bulundupRef.current && durum !== 'kameraYok') {
      taramaAcikRef.current = true
      taramaCalistir()
    }
  }
  function manuelDegerChange(e) {
    // Sadece rakam kabul et
    const yeni = (e.target.value || '').replace(/\D/g, '').slice(0, 6)
    setManuelDeger(yeni)
  }
  function manuelGonder() {
    if (!manuelDeger.trim()) return
    if (!tenantKod) {
      // Tenant kodu yüklenememişse raw değeri ara
      setManuelAcik(false)
      spoolAra(manuelDeger.trim())
      return
    }
    const tamId = tenantKod + '-' + manuelDeger.trim()
    setManuelAcik(false)
    spoolAra(tamId)
  }
  function manuelKeyDown(e) {
    if (e.key === 'Enter') manuelGonder()
  }

  // ─── Geri ───
  function geriDon() {
    taramaAcikRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    navigate(-1)
  }

  // ─── Render yardımcıları ───
  const durumStilSinifi = ({
    tarama:  s.stTarama,
    arama:   s.stArama,
    bulundu: s.stBulundu,
    hata:    s.stHata,
  })[durum] || s.stTarama

  // ─── Render ───
  return (
    <div style={s.page}>
      {/* Kamera */}
      {durum !== 'kameraYok' && (
        <>
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={s.video}
          />
          <canvas ref={canvasRef} style={s.canvas} />
        </>
      )}

      {/* Topbar */}
      <div style={s.topbar}>
        <button
          style={s.tbBtn}
          onClick={geriDon}
          aria-label={tv('m_qr_geri', 'Geri')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={s.tbTitle}>{tv('m_qr_baslik', 'QR Tara')}</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Çerçeve + tarama çizgisi (kamera açıkken) */}
      {durum !== 'kameraYok' && (
        <div style={s.cerceveWrap} aria-hidden="true">
          <div style={s.cerceve}>
            <span style={{ ...s.kose, ...s.koseTL }} />
            <span style={{ ...s.kose, ...s.koseTR }} />
            <span style={{ ...s.kose, ...s.koseBL }} />
            <span style={{ ...s.kose, ...s.koseBR }} />
            <div style={s.taramaCizgi} />
          </div>
        </div>
      )}

      {/* Durum badge'i */}
      {durum !== 'kameraYok' && (
        <div style={s.durumWrap}>
          <div style={{ ...s.durum, ...durumStilSinifi }}>
            <span style={{
              ...s.durumNokta,
              background: durum === 'arama'   ? '#fbbf24'
                       : durum === 'bulundu' ? '#4ade80'
                       : durum === 'hata'    ? '#f87171'
                                              : '#7ec8ff',
            }} />
            <span>{durumYazi}</span>
          </div>
        </div>
      )}

      {/* Alt kısım — manuel giriş butonu */}
      {durum !== 'kameraYok' && (
        <div style={s.altBilgi}>
          <div style={s.altYazi}>
            {tv('m_qr_alt_yazi', 'Spool QR kodunu çerçeveye getirin')}
          </div>
          <button style={s.manuelBtn} onClick={manuelAc}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="14" rx="2"/>
              <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>
            </svg>
            <span>{tv('m_qr_manuel', 'Manuel Giriş')}</span>
          </button>
        </div>
      )}

      {/* Kamera yok ekranı */}
      {durum === 'kameraYok' && (
        <div style={s.kameraYok}>
          <div style={s.kameraYokIkon}>📵</div>
          <div style={s.kameraYokBaslik}>
            {tv('m_qr_kamera_yok_baslik', 'Kamera erişilemedi')}
          </div>
          <div style={s.kameraYokYazi}>
            {tv('m_qr_kamera_yok_yazi', 'Manuel giriş kullanabilirsiniz.')}
          </div>
          <button style={s.manuelBtnAlt} onClick={manuelAc}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="14" rx="2"/>
              <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>
            </svg>
            <span>{tv('m_qr_manuel', 'Manuel Giriş')}</span>
          </button>
        </div>
      )}

      {/* Manuel giriş modal */}
      {manuelAcik && (
        <>
          <div style={s.modalOvl} onClick={manuelKapat} />
          <div style={s.modal} role="dialog" aria-label={tv('m_qr_modal_baslik', 'Spool ID Gir')}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>{tv('m_qr_modal_baslik', 'Spool ID Gir')}</span>
              <button
                style={s.modalX}
                onClick={manuelKapat}
                aria-label={tv('m_qr_kapat', 'Kapat')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={s.idWrap}>
              {tenantKod ? (
                <span style={s.idPre}>{tenantKod}-</span>
              ) : null}
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                value={manuelDeger}
                onChange={manuelDegerChange}
                onKeyDown={manuelKeyDown}
                placeholder="0504"
                style={s.idInput}
                maxLength={6}
              />
            </div>
            <div style={s.modalHint}>
              {tenantKod
                ? tv('m_qr_hint_sadece_numara', 'Sadece spool numarasını yazın')
                : tv('m_qr_hint_tam_id', 'Tam spool ID girin')}
            </div>

            <button
              style={{
                ...s.modalBtn,
                opacity: manuelDeger.trim() ? 1 : 0.5,
              }}
              onClick={manuelGonder}
              disabled={!manuelDeger.trim()}
            >
              {tv('m_qr_btn_bul', "Spool'u Bul")} →
            </button>
            <button style={s.modalIptal} onClick={manuelKapat}>
              {tv('m_qr_iptal', 'İptal')}
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes mQrScan {
          0%   { top: 8%;  opacity: 1; }
          50%  { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
        @keyframes mQrFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes mQrSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─────── Stiller ───────

const s = {
  page: {
    position: 'relative',
    height: '100dvh',
    width: '100%',
    background: '#000',
    color: '#fff',
    fontFamily: 'Barlow, system-ui, sans-serif',
    overflow: 'hidden',
  },

  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  canvas: {
    display: 'none',
  },

  topbar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    padding: 'max(14px, env(safe-area-inset-top)) 14px 12px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
    display: 'flex', alignItems: 'center', gap: 10,
    zIndex: 10,
  },
  tbBtn: {
    width: 36, height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    padding: 0,
  },
  tbTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700, fontSize: 19,
    color: '#fff', letterSpacing: 0.3,
  },

  cerceveWrap: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -58%)',
    width: 220, height: 220,
    pointerEvents: 'none',
    zIndex: 5,
  },
  cerceve: {
    position: 'absolute', inset: 0,
  },
  kose: {
    position: 'absolute',
    width: 36, height: 36,
    borderColor: '#fff',
    borderStyle: 'solid',
  },
  koseTL: { top: 0, left: 0,   borderWidth: '3px 0 0 3px', borderRadius: '4px 0 0 0' },
  koseTR: { top: 0, right: 0,  borderWidth: '3px 3px 0 0', borderRadius: '0 4px 0 0' },
  koseBL: { bottom: 0, left: 0,  borderWidth: '0 0 3px 3px', borderRadius: '0 0 0 4px' },
  koseBR: { bottom: 0, right: 0, borderWidth: '0 3px 3px 0', borderRadius: '0 0 4px 0' },
  taramaCizgi: {
    position: 'absolute',
    left: 10, right: 10,
    height: 2,
    background: 'linear-gradient(90deg, transparent, #2D8EFF, transparent)',
    boxShadow: '0 0 8px #2D8EFF',
    animation: 'mQrScan 2.2s ease-in-out infinite',
  },

  durumWrap: {
    position: 'absolute',
    bottom: 200, left: 0, right: 0,
    display: 'flex', justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
    padding: '0 16px',
  },
  durum: {
    display: 'inline-flex', alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 25,
    fontSize: 14, fontWeight: 600,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    maxWidth: '90vw',
  },
  durumNokta: {
    width: 8, height: 8, borderRadius: '50%',
    flexShrink: 0,
  },
  stTarama:  {
    background: 'rgba(45,142,255,0.22)',
    border: '1px solid rgba(45,142,255,0.5)',
    color: '#7ec8ff',
  },
  stArama:   {
    background: 'rgba(217,119,6,0.22)',
    border: '1px solid rgba(217,119,6,0.5)',
    color: '#fbbf24',
  },
  stBulundu: {
    background: 'rgba(22,163,110,0.22)',
    border: '1px solid rgba(22,163,110,0.5)',
    color: '#4ade80',
  },
  stHata:    {
    background: 'rgba(229,62,62,0.22)',
    border: '1px solid rgba(229,62,62,0.5)',
    color: '#f87171',
  },

  altBilgi: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: '24px 20px max(40px, env(safe-area-inset-bottom))',
    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
    textAlign: 'center',
    zIndex: 10,
  },
  altYazi: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  manuelBtn: {
    display: 'inline-flex', alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 25,
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Barlow, sans-serif',
    WebkitTapHighlightColor: 'transparent',
  },

  // Kamera yok ekranı
  kameraYok: {
    position: 'absolute', inset: 0,
    background: '#0d1117',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 12,
    textAlign: 'center',
    zIndex: 6,
  },
  kameraYokIkon: { fontSize: 48 },
  kameraYokBaslik: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 18, fontWeight: 700,
    color: '#e6ecf4',
    marginTop: 8,
  },
  kameraYokYazi: {
    fontSize: 14, color: '#94a3b8',
    lineHeight: 1.5, maxWidth: 280,
  },
  manuelBtnAlt: {
    marginTop: 8,
    display: 'inline-flex', alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 25,
    background: '#2D8EFF',
    border: 'none',
    color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Barlow, sans-serif',
  },

  // Modal
  modalOvl: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 100,
    animation: 'mQrFade 240ms ease-out forwards',
  },
  modal: {
    position: 'fixed',
    bottom: 0, left: 0, right: 0,
    background: 'var(--sur)',
    color: 'var(--tx)',
    borderRadius: '20px 20px 0 0',
    padding: '20px 18px max(24px, env(safe-area-inset-bottom))',
    maxWidth: 480,
    margin: '0 auto',
    zIndex: 101,
    animation: 'mQrSlideUp 280ms cubic-bezier(.4,0,.2,1) forwards',
  },
  modalHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 18, fontWeight: 700,
    color: 'var(--tx)',
  },
  modalX: {
    width: 30, height: 30,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--txd)',
    cursor: 'pointer',
    padding: 0,
  },

  idWrap: {
    display: 'flex',
    border: '1.5px solid var(--ac)',
    borderRadius: 11,
    overflow: 'hidden',
    background: 'var(--sur2)',
  },
  idPre: {
    display: 'flex', alignItems: 'center',
    padding: '0 14px',
    background: 'rgba(45,142,255,0.18)',
    borderRight: '1px solid var(--bor)',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 18, fontWeight: 700,
    color: 'var(--ac)',
    letterSpacing: 1,
    flexShrink: 0,
  },
  idInput: {
    flex: 1,
    padding: '14px 14px',
    border: 'none',
    background: 'transparent',
    color: 'var(--tx)',
    fontSize: 18,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    letterSpacing: 1.5,
    outline: 'none',
    minWidth: 0,
    width: '100%',
  },
  modalHint: {
    fontSize: 12,
    color: 'var(--txd)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  modalBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 11,
    background: 'var(--ac)',
    color: '#fff',
    fontSize: 15, fontWeight: 700,
    border: 'none',
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    marginBottom: 7,
    transition: 'opacity .15s',
  },
  modalIptal: {
    width: '100%',
    padding: 12,
    borderRadius: 11,
    background: 'transparent',
    border: '1px solid var(--bor)',
    color: 'var(--txd)',
    fontSize: 14,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
  },
}
