// mobile/src/components/isbaslat/IbQRTara.jsx
// AresPipe — İş Başlat Ekran 2 (QR Tara) — 65. oturum
// MQRTara.jsx (63. oturum)'dan adapte edildi. Hub state pattern'i.
//
// MQRTara ile farklar:
// - navigate() yok — onGeri / onSpoolBulundu prop callback'leri
// - Üst ortada rol chip (aktifRol.ad uppercase + aktifRol.renk dot)
// - Cross-tenant erken algılama (DB sorgusu öncesi, payload prefix kontrolü)
// - Manuel modal CTA: "Spool'u Bul →" yerine "İşlem Başlat →"
// - i18n anahtarları m_qr_* yerine m_ib_qr_*
// - import path bir alt seviye (../../lib/...)
//
// 68. oturum (MK-68.B): Ekran 4 (uyari) silindi.
// Cross-tenant artık inline drawer overlay olarak içeride handle ediliyor;
// parent'a onCrossTenant callback'i fırlatılmıyor. Drawer "Tamam, geri dön"
// → drawer kapanır + tarama yeniden başlar (kullanıcı QR ekranında kalır).
//
// Akış-kesici diğer uyarılar (devamEdiyor, alternatif basamak) IbSpoolDetay
// içinde drawer overlay olarak gösterilir — onSpoolBulundu(spool) ile devreye
// girer, hub bu noktada ek check yapmaz.

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useT } from '../../lib/i18n'
import { getOturum, getTenantId } from '../../lib/auth'

// ───────────────────────── Sabitler ─────────────────────────

const JSQR_CDN = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
const HATA_BEKLEME_MS = 2200
const BULUNDU_BEKLEME_MS = 500

// ───────────────────────── Component ─────────────────────────

export default function IbQRTara({ aktifRol, onGeri, onSpoolBulundu }) {
  const { tv } = useT()

  // UI state
  const [durum, setDurum] = useState('tarama') // tarama|arama|bulundu|hata|kameraYok
  const [durumYazi, setDurumYazi] = useState('')
  const [manuelAcik, setManuelAcik] = useState(false)
  const [manuelDeger, setManuelDeger] = useState('')
  const [tenantKod, setTenantKod] = useState('')
  // 68. oturum: akış-kesici uyarı drawer'ı (şu an sadece crossTenant).
  // null → kapalı; { tip: 'crossTenant' } → açık.
  const [uyariDrawer, setUyariDrawer] = useState(null)

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
        console.warn('[IbQRTara] tenant kod yüklenemedi:', e)
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

    // Payload formatları (6. → 7. oturum kararı):
    //   Yeni: "KOD-NUMARA:UUID"   (örn. "A-0575:9911DC39-...")
    //   Eski: "KOD-NUMARA"        (örn. "A-0575")
    //   Çok eski: "NUMARA"        (prefix'siz, örn. "0575" — geriye uyumlu)
    const raw = (spoolIdRaw || '').trim().toUpperCase()
    let spoolKodu = raw
    let spoolUuid = null
    if (raw.includes(':')) {
      const parcalar = raw.split(':')
      spoolKodu = parcalar[0]
      const olasiUuid = (parcalar[1] || '').toLowerCase()
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      if (UUID_RE.test(olasiUuid)) spoolUuid = olasiUuid
    }

    // ─── Cross-tenant erken algılama (DB sorgusu YOK) ───
    // Payload "KOD-NUMARA" formatındaysa ve KOD kullanıcı tenant'ından farklıysa,
    // drawer overlay göster. RLS zaten keser ama UX için açıklama önemli.
    // 68. oturum: parent'a callback fırlatmak yerine inline drawer.
    if (tenantKod && spoolKodu.includes('-')) {
      const payloadTenant = spoolKodu.split('-')[0]
      if (payloadTenant && payloadTenant !== tenantKod) {
        setUyariDrawer({ tip: 'crossTenant' })
        return
      }
    }

    setDurum('arama')
    setDurumYazi(spoolKodu + ' ' + tv('m_ib_qr_araniyor', 'aranıyor…'))

    try {
      const oturum = await getOturum()
      if (!oturum) { onGeri && onGeri(); return }
      const tid = await getTenantId()
      if (!tid) {
        setDurum('hata')
        setDurumYazi(tv('m_ib_qr_baglanti_hatasi', 'Bağlantı kurulamadı'))
        setTimeout(taramayiTekrarBaslat, HATA_BEKLEME_MS)
        return
      }

      // UUID varsa onunla ara (kesin eşleşme), yoksa spool_id ile.
      let sorgu = supabase
        .from('spooller')
        .select('*')
        .eq('tenant_id', tid)
        .or('silindi.is.null,silindi.eq.false')
        .limit(1)
      sorgu = spoolUuid ? sorgu.eq('id', spoolUuid) : sorgu.eq('spool_id', spoolKodu)

      const { data, error } = await sorgu.maybeSingle()

      if (error || !data) {
        setDurum('hata')
        setDurumYazi(tv('m_ib_qr_bulunamadi', 'Spool bulunamadı') + ': ' + spoolKodu)
        setTimeout(taramayiTekrarBaslat, HATA_BEKLEME_MS)
        return
      }

      // Bulundu — hub'a teslim et. Akış-kesici uyarılar (devamEdiyor /
      // alternatif basamak) IbSpoolDetay içinde drawer overlay olarak hesaplanır.
      setDurum('bulundu')
      setDurumYazi(tv('m_ib_qr_bulundu', 'Bulundu — yönlendiriliyor…'))
      setTimeout(() => {
        if (onSpoolBulundu) onSpoolBulundu(data)
      }, BULUNDU_BEKLEME_MS)
    } catch (e) {
      console.warn('[IbQRTara] arama hatası:', e)
      setDurum('hata')
      setDurumYazi(tv('m_ib_qr_baglanti_hatasi', 'Bağlantı kurulamadı'))
      setTimeout(taramayiTekrarBaslat, HATA_BEKLEME_MS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantKod, onSpoolBulundu, onGeri, tv])

  // Tekrar tarama — hata sonrası ve drawer kapanışı sonrası
  function taramayiTekrarBaslat() {
    bulundupRef.current = false
    taramaAcikRef.current = true
    setDurum('tarama')
    setDurumYazi(tv('m_ib_qr_durum_baslangic', 'Kodu çerçeveye hizala'))
    taramaCalistir()
  }

  // 68. oturum: drawer kapanış handler — tarama moduna döner.
  function uyariDrawerKapat() {
    setUyariDrawer(null)
    taramayiTekrarBaslat()
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
        console.warn('[IbQRTara] kamera açılmadı:', e)
        if (!iptal) setDurum('kameraYok')
      }
    }

    setDurumYazi(tv('m_ib_qr_durum_baslangic', 'Kodu çerçeveye hizala'))
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
      taramaAcikRef.current = false

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
    if (!bulundupRef.current && durum !== 'kameraYok') {
      taramaAcikRef.current = true
      taramaCalistir()
    }
  }
  function manuelDegerChange(e) {
    const yeni = (e.target.value || '').replace(/\D/g, '').slice(0, 6)
    setManuelDeger(yeni)
  }
  function manuelGonder() {
    if (!manuelDeger.trim()) return
    const num = manuelDeger.trim()
    if (!tenantKod) {
      setManuelAcik(false)
      spoolAra(num)
      return
    }
    // 6-haneli padding (8. oturum sayaç digits=6 kararıyla uyumlu).
    // Kullanıcı '554' yazınca 'A-000554' arar — DB'deki formatla eşleşir.
    // QR ile gelen payload zaten dolu geldiği için padding etkilemez.
    const tamId = tenantKod + '-' + num.padStart(6, '0')
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
    if (onGeri) onGeri()
  }

  // ─── Render yardımcıları ───
  const durumStilSinifi = ({
    tarama:  s.stTarama,
    arama:   s.stArama,
    bulundu: s.stBulundu,
    hata:    s.stHata,
  })[durum] || s.stTarama

  // Rol adı uppercase — Türkçe locale ile (ı→I, i→İ doğru çevrilsin)
  const rolAdUpper = aktifRol?.ad
    ? aktifRol.ad.toLocaleUpperCase('tr-TR')
    : ''
  const rolRenk = aktifRol?.renk || 'rgba(255,255,255,0.4)'

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
          aria-label={tv('m_ib_qr_geri', 'Geri')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={s.tbTitle}>{tv('m_ib_qr_baslik', 'QR Tara')}</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Rol chip — top bar altında ortada */}
      {rolAdUpper && (
        <div style={s.roleWrap} aria-label={aktifRol?.ad}>
          <div
            style={{
              ...s.roleChip,
              border: `2px solid ${rolRenk}`,
            }}
          >
            <span
              style={{
                ...s.roleDot,
                background: rolRenk,
                boxShadow: `0 0 6px ${hexToRgba(rolRenk, 0.6)}`,
              }}
            />
            <span>{rolAdUpper}</span>
          </div>
        </div>
      )}

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
            {tv('m_ib_qr_alt_yazi', 'Spool QR kodunu çerçeveye getirin')}
          </div>
          <button style={s.manuelBtn} onClick={manuelAc}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="14" rx="2"/>
              <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>
            </svg>
            <span>{tv('m_ib_qr_manuel', 'Manuel Giriş')}</span>
          </button>
        </div>
      )}

      {/* Kamera yok ekranı */}
      {durum === 'kameraYok' && (
        <div style={s.kameraYok}>
          <div style={s.kameraYokIkon}>📵</div>
          <div style={s.kameraYokBaslik}>
            {tv('m_ib_qr_kamera_yok_baslik', 'Kamera erişilemedi')}
          </div>
          <div style={s.kameraYokYazi}>
            {tv('m_ib_qr_kamera_yok_yazi', 'Manuel giriş kullanabilirsiniz.')}
          </div>
          <button style={s.manuelBtnAlt} onClick={manuelAc}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="14" rx="2"/>
              <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>
            </svg>
            <span>{tv('m_ib_qr_manuel', 'Manuel Giriş')}</span>
          </button>
        </div>
      )}

      {/* Manuel giriş modal */}
      {manuelAcik && (
        <>
          <div style={s.modalOvl} onClick={manuelKapat} />
          <div style={s.modal} role="dialog" aria-label={tv('m_ib_qr_modal_baslik', 'Spool ID Gir')}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>{tv('m_ib_qr_modal_baslik', 'Spool ID Gir')}</span>
              <button
                style={s.modalX}
                onClick={manuelKapat}
                aria-label={tv('m_ib_qr_kapat', 'Kapat')}
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
                ? tv('m_ib_qr_hint_sadece_numara', 'Sadece spool numarasını yazın')
                : tv('m_ib_qr_hint_tam_id', 'Tam spool ID girin')}
            </div>

            <button
              style={{
                ...s.modalBtn,
                opacity: manuelDeger.trim() ? 1 : 0.5,
              }}
              onClick={manuelGonder}
              disabled={!manuelDeger.trim()}
            >
              {tv('m_ib_qr_btn_islem_baslat', 'İşlem Başlat')} →
            </button>
            <button style={s.modalIptal} onClick={manuelKapat}>
              {tv('m_ib_qr_iptal', 'İptal')}
            </button>
          </div>
        </>
      )}

      {/* ───────────── 68. oturum: Akış-kesici uyarı drawer overlay ───────────── */}
      {/* Şu an sadece crossTenant tipi. devamEdiyor + alternatif basamak
          IbSpoolDetay içinde aynı pattern'le hostlanır — Adım 3'te ortak
          komponente çıkarılır (IbUyariDrawer.jsx). */}
      {uyariDrawer && uyariDrawer.tip === 'crossTenant' && (
        <div style={s.drawerOvl}>
          <div style={s.drawerKart}>
            <div style={s.drawerIkonDaire}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--re)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18"/>
                <line x1="18" y1="6" x2="6" y2="18"/>
              </svg>
            </div>
            <p style={s.drawerBaslik}>
              {tv('m_ib_uy_ct_baslik', 'Bu spool size ait değil')}
            </p>
            <p style={s.drawerMesaj}>
              {tv('m_ib_uy_ct_mesaj', 'Bu spool başka bir firmaya ait. Görüntüleyemezsiniz.')}
            </p>
            <button style={s.drawerBtnPrimary} onClick={uyariDrawerKapat}>
              {tv('m_ib_uy_ct_btn', 'Tamam, geri dön')}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ibQrScan {
          0%   { top: 8%;  opacity: 1; }
          50%  { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
        @keyframes ibQrFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ibQrSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Helper ───

// Hex string'i rgba'ya çevirir (glow box-shadow için).
// İçeride 3-haneli (#fff) ve 6-haneli (#ffffff) hex destekler.
// rgba(...) gibi string gelirse olduğu gibi döner.
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  if (typeof hex !== 'string') return `rgba(255,255,255,${alpha})`
  if (hex.startsWith('rgb')) return hex
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('')
  }
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
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

  // Rol chip — top bar altında ortada
  // Durum chip ile aynı koyu opak arka plan + box shadow.
  // Border dinamik (rol rengi), inline style ile uygulanır.
  roleWrap: {
    position: 'absolute',
    top: 'calc(max(14px, env(safe-area-inset-top)) + 56px)',
    left: 0, right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
    padding: '0 16px',
  },
  roleChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 16px',
    borderRadius: 20,
    background: 'rgba(13,18,28,0.9)',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: 1.2,
    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
  },
  roleDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    flexShrink: 0,
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
    animation: 'ibQrScan 2.2s ease-in-out infinite',
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
    padding: '10px 18px',
    borderRadius: 25,
    fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
    maxWidth: '90vw',
    lineHeight: 1.3,
  },
  durumNokta: {
    width: 8, height: 8, borderRadius: '50%',
    flexShrink: 0,
  },
  stTarama:  {
    background: 'rgba(13,18,28,0.9)',
    border: '2px solid #2D8EFF',
    color: '#7ec8ff',
  },
  stArama:   {
    background: 'rgba(13,18,28,0.9)',
    border: '2px solid #d97706',
    color: '#fbbf24',
  },
  stBulundu: {
    background: 'rgba(13,18,28,0.92)',
    border: '2px solid #16a36e',
    color: '#4ade80',
  },
  stHata:    {
    background: 'rgba(13,18,28,0.92)',
    border: '2px solid #e53e3e',
    color: '#fca5a5',
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
    animation: 'ibQrFade 240ms ease-out forwards',
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
    animation: 'ibQrSlideUp 280ms cubic-bezier(.4,0,.2,1) forwards',
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

  // 68. oturum: Akış-kesici uyarı drawer overlay
  // Mockup v19 cross-tenant kart tasarımı.
  drawerOvl: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    animation: 'ibQrFade 240ms ease-out forwards',
  },
  drawerKart: {
    background: 'var(--sur)',
    color: 'var(--tx)',
    borderRadius: 14,
    padding: '18px 18px 16px',
    width: '100%',
    maxWidth: 360,
    borderLeft: '4px solid var(--re)',
    fontFamily: 'Barlow, system-ui, sans-serif',
  },
  drawerIkonDaire: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(229,62,62,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  drawerBaslik: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 17,
    fontWeight: 700,
    margin: '0 0 8px',
    color: 'var(--tx)',
    letterSpacing: 0.3,
  },
  drawerMesaj: {
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--txd)',
    margin: '0 0 18px',
  },
  drawerBtnPrimary: {
    width: '100%',
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
