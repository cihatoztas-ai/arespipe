// mobile/src/components/isbaslat/IbSpoolDetay.jsx
// AresPipe — İş Başlat Ekran 3 (Spool Detay) — 68. oturum (MK-68.B)
//
// 67'de v9-v16 mockup turuyla kilitlenen tasarım.
// İlk implementasyon: drawer entegrasyonu + iskelet seviyesinde içerik.
//
// Bu turda yapılan:
// - Üst bant (spool no) + devam_ediyor sarı varyantı
// - Foto carousel placeholder
// - Aktif basamak + Spool ID pill + Peek tab placeholder
// - Genel | Malzeme sekmeleri
// - Genel paneli (10 satır basit liste)
// - Foot CTA (bekliyor / devam_ediyor varyantları)
// - Akış-kesici drawer entegrasyonu (devamEdiyor, alternatifBasamakYetkili)
//   → Drawer açıkken İşe Başla disable
//
// 68b'ye ertelenen:
// - Foto carousel detayı (fotograflar tablosu sorgusu, prev/next, sayaç, meta)
// - Malzeme paneli BOM (spool_malzemeleri tablosu) + heat inline edit
// - Yumuşak uyarılar (alıştırma, test, not) + peek tab aktif
// - Devral sonrası foto akışı (mevcut foto carousel ekleme modu)
// - Alternatif basamak DB update + bekliyor → devam ediyor geçişi
// - Yetki kontrolü (yetkili / yetkisiz ayrımı) — şimdilik hep yetkili varsayılıyor
// - Foot butonları (İşe Başla, İşi Kapat, Not Ekle, İptal Et) gerçek akış

import { useState, useEffect } from 'react'
import { useT } from '../../lib/i18n'
import IbUyariDrawer from './IbUyariDrawer'

export default function IbSpoolDetay({
  spool,
  aktifRol,
  kullanici,
  onBaskaSpool,
  onGeri,
}) {
  const { tv } = useT()

  // ─── State ───
  const [yerelSpool, setYerelSpool] = useState(spool)
  const [aktifSekme, setAktifSekme] = useState('genel')
  const [uyariDrawer, setUyariDrawer] = useState(null)

  // ─── Akış-kesici uyarı kontrolü ───
  // Mount + spool değişiminde tek seferde değerlendirilir.
  // Öncelik: devamEdiyor > alternatifBasamak.
  useEffect(() => {
    if (!yerelSpool) return

    // 1. devamEdiyor — başkasının aktif işi
    if (yerelSpool.is_durumu === 'devam_ediyor') {
      // aktif_isci farklı kullanıcıysa devral senaryosu.
      // aktif_isci yoksa (eski kayıt) yine de devamEdiyor göster.
      const aktifIsciId = yerelSpool.aktif_isci_id || yerelSpool.aktif_kullanici_id
      const benimMi = aktifIsciId && kullanici?.id && aktifIsciId === kullanici.id
      if (!benimMi) {
        setUyariDrawer({
          tip: 'devamEdiyor',
          payload: {
            // 68b: kullanicilar tablosundan ad çekilecek; şimdilik spool'da
            // saklı bir ad varsa kullan, yoksa default.
            operatorAd: yerelSpool.aktif_isci_ad || yerelSpool.son_isci_ad || '',
          },
        })
        return
      }
    }

    // 2. alternatifBasamak — aktif basamak rol ile uyumsuz
    if (yerelSpool.aktif_basamak && aktifRol?.ad) {
      const aktif = String(yerelSpool.aktif_basamak).toLowerCase().trim()
      const rol   = String(aktifRol.ad).toLowerCase().trim()
      // Basit normalize: birbirini içeriyorsa uyumlu say
      // (örn. "argon_kaynagi" vs "Argon Kaynağı" — ikisi de "argon" içerir).
      const uyumlu =
        aktif === rol ||
        aktif.includes(rol.split(' ')[0]) ||
        rol.includes(aktif.split('_')[0]) ||
        rol.includes(aktif.split(' ')[0])
      if (!uyumlu) {
        // 68b: yetki kontrolü ile yetkili/yetkisiz ayrımı.
        // Şu an varsayılan: yetkili (alternatif teklifi göster).
        setUyariDrawer({
          tip: 'alternatifBasamakYetkili',
          payload: {
            aktifBasamak: yerelSpool.aktif_basamak,
            alternatif:   aktifRol.ad,
          },
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yerelSpool?.id])

  // ─── Drawer handler'ları ───
  function handleUyariKapat() {
    setUyariDrawer(null)
  }

  function handleUyariAksiyon(aksiyon) {
    // 68b: gerçek akışlar buraya gelecek.
    // - devral: foto akışı + DB aktif_isci güncellemesi
    // - alternatifeBasla: aktif_basamak update + bekliyor → devam_ediyor
    if (aksiyon === 'devral') {
      alert(tv('m_ib_sd_devral_placeholder', "(Devral akışı 68b'de eklenecek — foto çekme + DB update)"))
    } else if (aksiyon === 'alternatifeBasla') {
      alert(tv('m_ib_sd_alt_placeholder', "(Alternatif başla akışı 68b'de eklenecek — DB update)"))
    }
    setUyariDrawer(null)
  }

  // ─── Foot CTA handler'ları (placeholder) ───
  function iseBasla() {
    alert(tv('m_ib_sd_basla_placeholder', "(İşe Başla akışı 68b'de eklenecek)"))
  }
  function isiKapat() {
    alert(tv('m_ib_sd_kapat_placeholder', "(İşi Kapat akışı 68b'de eklenecek)"))
  }
  function notEkle() {
    alert(tv('m_ib_sd_not_placeholder', "(Not Ekle akışı 68b'de eklenecek)"))
  }
  function isiIptal() {
    alert(tv('m_ib_sd_iptal_placeholder', "(İptal Et akışı 68b'de eklenecek)"))
  }

  // ─── Render ───
  if (!yerelSpool) {
    return (
      <div style={s.merkezBos}>
        <p style={s.bosYazi}>{tv('m_ib_sd_spool_yok', 'Spool yok.')}</p>
        <button type="button" style={s.btnIkincil} onClick={onBaskaSpool}>
          {tv('m_ib_sd_baska', 'Başka spool tara')}
        </button>
      </div>
    )
  }

  const isDevamEdiyor = yerelSpool.is_durumu === 'devam_ediyor'
  const drawerAcik = !!uyariDrawer

  // Üst bant metni — gemi/proje + pipeline + spool + rev
  const ustBantParcalari = [
    yerelSpool.gemi || yerelSpool.proje_no || yerelSpool.proje_adi,
    yerelSpool.pipeline_no,
    yerelSpool.spool_no,
    yerelSpool.rev,
  ].filter(Boolean).join(' · ')

  return (
    <div style={s.kapsayici}>

      {/* ───── Üst bant ───── */}
      <div style={isDevamEdiyor ? s.ustBantDevam : s.ustBant}>
        {isDevamEdiyor && <span style={s.pulseNokta} aria-hidden="true" />}
        <span style={s.ustBantYazi}>{ustBantParcalari || '—'}</span>
      </div>

      {/* ───── Foto carousel placeholder ───── */}
      <div style={s.fotoBlok}>
        <span style={s.fotoBosYazi}>{tv('m_ib_sd_foto_yok', 'Foto yok')}</span>
      </div>

      {/* ───── Aktif basamak + Spool ID + Peek tab satırı ───── */}
      <div style={s.idSatir}>
        <span style={s.aktifBasamak}>{yerelSpool.aktif_basamak || '—'}</span>
        <span style={s.spoolPill}>{yerelSpool.spool_id || '—'}</span>
        {/* Peek tab — şimdilik pasif placeholder. 68b'de yumuşak uyarı sayısı geldiğinde aktif. */}
        <span style={s.peekPasif} aria-hidden="true" />
      </div>

      {/* ───── Sekmeler ───── */}
      <div style={s.sekmeler}>
        <button
          type="button"
          style={aktifSekme === 'genel' ? s.sekmeAktif : s.sekme}
          onClick={() => setAktifSekme('genel')}
        >
          {tv('m_ib_sd_genel', 'Genel')}
        </button>
        <button
          type="button"
          style={aktifSekme === 'malzeme' ? s.sekmeAktif : s.sekme}
          onClick={() => setAktifSekme('malzeme')}
        >
          {tv('m_ib_sd_malzeme', 'Malzeme')}
        </button>
      </div>

      {/* ───── İçerik ───── */}
      <div style={s.icerik}>
        {aktifSekme === 'genel'   && <GenelPanel spool={yerelSpool} tv={tv} />}
        {aktifSekme === 'malzeme' && <MalzemePanel tv={tv} />}
      </div>

      {/* ───── Foot CTA ───── */}
      <div style={s.footWrap}>
        {!isDevamEdiyor ? (
          <div style={s.footRow}>
            <button
              type="button"
              style={drawerAcik ? s.footBtnYesilDisabled : s.footBtnYesil}
              onClick={iseBasla}
              disabled={drawerAcik}
            >
              {tv('m_ib_sd_basla', 'İşe Başla')}
            </button>
            <button type="button" style={s.footBtnIkincil} onClick={onBaskaSpool}>
              {tv('m_ib_sd_baska_kisa', 'Başka Spool')}
            </button>
          </div>
        ) : (
          <div style={s.footRow}>
            <button type="button" style={s.footBtnKirmizi} onClick={isiKapat}>
              {tv('m_ib_sd_kapat', 'İşi Kapat')}
            </button>
            <button type="button" style={s.footBtnIkincil} onClick={notEkle}>
              {tv('m_ib_sd_not', 'Not Ekle')}
            </button>
            <button type="button" style={s.footBtnKirmiziGhost} onClick={isiIptal}>
              {tv('m_ib_sd_iptal', 'İptal Et')}
            </button>
          </div>
        )}
      </div>

      {/* ───── Drawer overlay ───── */}
      {uyariDrawer && (
        <IbUyariDrawer
          tip={uyariDrawer.tip}
          payload={uyariDrawer.payload}
          onKapat={handleUyariKapat}
          onAksiyon={handleUyariAksiyon}
        />
      )}
    </div>
  )
}

// ─────────── Genel Paneli (iskelet — 68b'de detay) ───────────

function GenelPanel({ spool, tv }) {
  const satirlar = [
    { etiket: tv('m_ib_sd_g_proje',     'Proje'),         deger: spool.proje_no || spool.gemi || spool.proje_adi },
    { etiket: tv('m_ib_sd_g_devre',     'Devre'),         deger: spool.devre_no || spool.devre_adi },
    { etiket: tv('m_ib_sd_g_pipeline',  'Pipeline'),      deger: spool.pipeline_no },
    { etiket: tv('m_ib_sd_g_spool',     'Spool'),         deger: spool.spool_no },
    { etiket: tv('m_ib_sd_g_rev',       'Rev'),           deger: spool.rev },
    { etiket: tv('m_ib_sd_g_malzeme',   'Malzeme'),       deger: spool.malzeme },
    { etiket: tv('m_ib_sd_g_yuzey',     'Yüzey'),         deger: spool.yuzey },
    { etiket: tv('m_ib_sd_g_durum',     'Durum'),         deger: spool.is_durumu },
    { etiket: tv('m_ib_sd_g_basamak',   'Aktif basamak'), deger: spool.aktif_basamak },
    { etiket: tv('m_ib_sd_g_ilerleme',  'İlerleme'),      deger: spool.ilerleme != null ? `%${spool.ilerleme}` : null },
  ]

  return (
    <div style={s.gp}>
      {satirlar.map((sat, i) => (
        <div key={i} style={s.gpSatir}>
          <span style={s.gpEtiket}>{sat.etiket}</span>
          <span style={s.gpDeger}>{sat.deger || '—'}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────── Malzeme Paneli (iskelet — 68b'de BOM + heat inline) ───────────

function MalzemePanel({ tv }) {
  return (
    <div style={s.merkezBos}>
      <p style={s.bosYazi}>
        {tv('m_ib_sd_malzeme_yakinda', "Malzeme listesi 68b'de eklenecek.")}
      </p>
    </div>
  )
}

// ─────────── Stiller ───────────

const s = {
  kapsayici: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100dvh - 56px - 80px)',
    background: 'var(--bg)',
    color: 'var(--tx)',
  },

  // Üst bant
  ustBant: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
  },
  ustBantDevam: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: '#fef3c7',
    borderBottom: '1px solid #fcd34d',
    position: 'relative',
  },
  ustBantYazi: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--tx)',
    letterSpacing: 0.3,
  },
  pulseNokta: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 6px rgba(34,197,94,0.8)',
    flexShrink: 0,
    animation: 'ibSdPulse 1.4s ease-in-out infinite',
  },

  // Foto blok
  fotoBlok: {
    height: 160,
    background: 'var(--sur2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid var(--bor)',
  },
  fotoBosYazi: {
    fontSize: 13,
    color: 'var(--txd)',
  },

  // ID satırı
  idSatir: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
    gap: 12,
  },
  aktifBasamak: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--txd)',
    flexShrink: 0,
  },
  spoolPill: {
    fontSize: 14,
    fontWeight: 700,
    color: '#534AB7',
    background: '#EEEDFE',
    padding: '4px 12px',
    borderRadius: 999,
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: 0.5,
  },
  peekPasif: {
    width: 24,
    height: 24,
    flexShrink: 0,
    // 68b: yumuşak uyarı sayısı varsa sarı + sayı badge
  },

  // Sekmeler
  sekmeler: {
    display: 'flex',
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
  },
  sekme: {
    flex: 1,
    padding: '12px 8px',
    background: 'transparent',
    color: 'var(--txd)',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  sekmeAktif: {
    flex: 1,
    padding: '12px 8px',
    background: 'transparent',
    color: 'var(--tx)',
    border: 'none',
    borderBottom: '2px solid var(--ac)',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },

  // İçerik
  icerik: {
    flex: 1,
    padding: '14px 14px 24px',
    overflowY: 'auto',
  },

  // Genel paneli
  gp: {
    background: 'var(--sur)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  gpSatir: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    borderBottom: '1px solid var(--bor)',
    gap: 12,
  },
  gpEtiket: {
    fontSize: 14,
    color: 'var(--txd)',
    flexShrink: 0,
  },
  gpDeger: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--tx)',
    textAlign: 'right',
    overflowWrap: 'anywhere',
  },

  // Boş durum
  merkezBos: {
    padding: 32,
    textAlign: 'center',
  },
  bosYazi: {
    fontSize: 14,
    color: 'var(--txd)',
    margin: '0 0 16px',
  },
  btnIkincil: {
    padding: '10px 20px',
    background: 'transparent',
    color: 'var(--tx)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
  },

  // Foot CTA
  footWrap: {
    flexShrink: 0,
    padding: '10px 14px',
    background: 'var(--sur)',
    borderTop: '1px solid var(--bor)',
  },
  footRow: {
    display: 'flex',
    gap: 6,
  },
  footBtnYesil: {
    flex: 1,
    padding: '14px 12px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  footBtnYesilDisabled: {
    flex: 1,
    padding: '14px 12px',
    background: 'var(--sur2)',
    color: 'var(--txd)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'not-allowed',
  },
  footBtnIkincil: {
    flex: 1,
    padding: '14px 12px',
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
  footBtnKirmizi: {
    flex: 1,
    padding: '14px 12px',
    background: 'var(--re)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  footBtnKirmiziGhost: {
    flex: 1,
    padding: '14px 12px',
    background: 'transparent',
    color: 'var(--re)',
    border: '1px solid var(--re)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
}

// Pulse animasyonu için global keyframe
if (typeof document !== 'undefined') {
  const KEYFRAME_ID = 'ib-sd-keyframes'
  if (!document.getElementById(KEYFRAME_ID)) {
    const styleEl = document.createElement('style')
    styleEl.id = KEYFRAME_ID
    styleEl.textContent = `
      @keyframes ibSdPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%      { opacity: 0.4; transform: scale(0.85); }
      }
      @keyframes ibUyFade {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    `
    document.head.appendChild(styleEl)
  }
}
