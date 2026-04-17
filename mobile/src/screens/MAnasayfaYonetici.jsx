// mobile/src/screens/MAnasayfaYonetici.jsx
// Yönetici/super_admin anasayfası.
// Önceki MAnasayfa.jsx'in içeriği + üstte "İşlem Başlat" butonu.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import MDrawer from '../components/MDrawer'

export default function MAnasayfaYonetici({ kullanici }) {
  const navigate = useNavigate()
  const { tv } = useT()
  const [drawerAcik, setDrawerAcik] = useState(false)

  const [istatistik, setIstatistik] = useState({
    devre: null, bekleyen: null, kk: null, sevk: null, durdurulmus: 0,
  })
  const [aktiviteler, setAktiviteler] = useState(null)
  const [aktiviteYukleniyor, setAktiviteYukleniyor] = useState(true)

  const tenantId = kullanici?.tenant_id

  const saat = new Date().getHours()
  const selamlamaKey = saat < 12 ? 'm_gunaydin' : saat < 18 ? 'm_iyi_gunler' : 'm_iyi_aksamlar'
  const rolKey = kullanici?.rol ? `m_rol_${kullanici.rol}` : null
  const rolLabel = rolKey ? tv(rolKey, kullanici.rol) : ''

  // İstatistikler
  useEffect(() => {
    if (!tenantId) return
    ;(async () => {
      try {
        const buAyBas = new Date()
        buAyBas.setDate(1); buAyBas.setHours(0, 0, 0, 0)

        const [rDvr, rBek, rKK, rSvk, rUyari] = await Promise.all([
          supabase.from('devreler')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .or('silindi.is.null,silindi.eq.false'),
          supabase.from('spooller')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('aktif_basamak', 'bekleyen'),
          supabase.from('spooller')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('aktif_basamak', 'on_kontrol'),
          supabase.from('sevkiyatlar')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('tarih', buAyBas.toISOString()),
          supabase.from('spooller')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('durduruldu', true),
        ])

        setIstatistik({
          devre: rDvr.count ?? 0,
          bekleyen: rBek.count ?? 0,
          kk: rKK.count ?? 0,
          sevk: rSvk.count ?? 0,
          durdurulmus: rUyari.count ?? 0,
        })
      } catch (e) {
        console.warn('[MAnasayfaYonetici] Stat:', e)
      }
    })()
  }, [tenantId])

  // Son aktiviteler
  useEffect(() => {
    if (!tenantId) return
    ;(async () => {
      try {
        const { data: loglar } = await supabase
          .from('islem_log')
          .select('islem, katman, olusturma, yapan_id')
          .eq('tenant_id', tenantId)
          .order('olusturma', { ascending: false })
          .limit(6)
        setAktiviteler(loglar || [])
      } catch (e) {
        console.warn('[MAnasayfaYonetici] Aktivite:', e)
        setAktiviteler([])
      } finally {
        setAktiviteYukleniyor(false)
      }
    })()
  }, [tenantId])

  function formatSure(tarihISO) {
    if (!tarihISO) return ''
    const fark = Math.floor((Date.now() - new Date(tarihISO).getTime()) / 1000)
    if (fark < 60) return tv('m_sure_az_once', 'az önce')
    if (fark < 3600) return tv('m_sure_dk', '{n} dk').replace('{n}', Math.floor(fark / 60))
    if (fark < 86400) return tv('m_sure_sa', '{n} sa').replace('{n}', Math.floor(fark / 3600))
    return tv('m_sure_gun', '{n} gün').replace('{n}', Math.floor(fark / 86400))
  }

  function yakinda(sayfa) {
    alert(tv('m_toast_yakinda', '{sayfa} sayfası yakında').replace('{sayfa}', sayfa))
  }

  return (
    <div style={s.sayfa}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.topbarLogo}>AP</div>
        <div style={s.topbarTitle}>{tv('m_app_title', 'AresPipe')}</div>
        <button
          style={s.profilBtn}
          onClick={() => setDrawerAcik(true)}
          aria-label={tv('m_drawer_profil', 'Profil')}
        >
          {(kullanici?.ad_soyad || kullanici?.email || '?').charAt(0).toUpperCase()}
        </button>
      </div>

      <div style={s.scroll}>

        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroGreeting}>{tv(selamlamaKey, 'Günaydın')}</div>
          <div style={s.heroName}>
            {kullanici?.ad_soyad || kullanici?.email || tv('m_kullanici', 'Kullanıcı')}
          </div>
          {rolLabel && <div style={s.heroMeta}>{rolLabel}</div>}
        </div>

        {/* İŞLEM BAŞLAT — dolu mavi buton (YÖNETİCİ'NİN OPERATÖR EKRANINA GEÇİŞ NOKTASI) */}
        <div style={{ padding: '16px 16px 4px' }}>
          <button
            style={s.islemBaslatBtn}
            onClick={() => navigate('/islemler')}
          >
            <div style={s.islemBaslatIkon}>⚡</div>
            <div style={s.islemBaslatBody}>
              <div style={s.islemBaslatBaslik}>
                {tv('m_islem_baslat', 'İşlem Başlat')}
              </div>
              <div style={s.islemBaslatAlt}>
                {tv('m_islem_baslat_alt', 'Kesim, imalat, KK, sevk...')}
              </div>
            </div>
            <div style={s.islemBaslatOk}>›</div>
          </button>
        </div>

        {/* Uyarı banner */}
        {istatistik.durdurulmus > 0 && (
          <button style={s.uyariBanner} onClick={() => yakinda(tv('m_uyarilar', 'Uyarılar'))}>
            <div style={s.uyariIcon}>⚠️</div>
            <div style={s.uyariText}>
              {tv('m_uyari_durdurulmus_spool', '{n} durdurulmuş spool var — detayları inceleyin')
                .replace('{n}', istatistik.durdurulmus)}
            </div>
            <div style={s.uyariArrow}>›</div>
          </button>
        )}

        {/* Genel Durum */}
        <div style={s.sectionRow}>
          <div style={s.sectionTitle}>{tv('m_baslik_genel_durum', 'Genel Durum')}</div>
        </div>

        <div style={s.quickGrid}>
          <StatKart renk="var(--ac)"   label={tv('m_stat_aktif_devre', 'Aktif Devre')}     deger={istatistik.devre}    sub={tv('m_stat_aktif_devre_sub', 'Devam eden')}       onClick={() => yakinda(tv('m_kart_devreler', 'Devreler'))} />
          <StatKart renk="var(--warn)" label={tv('m_stat_bekleyen_spool', 'Bekleyen Spool')} deger={istatistik.bekleyen} sub={tv('m_stat_bekleyen_spool_sub', 'İşlem gerekiyor')} onClick={() => yakinda(tv('m_stat_bekleyen_spool', 'Bekleyen'))} />
          <StatKart renk="var(--leg)"  label={tv('m_stat_kk_bekleyen', 'KK Bekleyen')}       deger={istatistik.kk}        sub={tv('m_stat_kk_bekleyen_sub', 'Onay bekliyor')}   onClick={() => yakinda(tv('m_kart_kk', 'KK'))} />
          <StatKart renk="var(--gr)"   label={tv('m_stat_bu_ay_sevk', 'Bu Ay Sevk')}         deger={istatistik.sevk}      sub={tv('m_stat_bu_ay_sevk_sub', 'Tamamlandı')}       onClick={() => yakinda(tv('m_kart_sevkiyat', 'Sevkiyat'))} />
        </div>

        <div style={s.separator} />

        {/* Son Aktiviteler */}
        <div style={s.sectionRow}>
          <div style={s.sectionTitle}>{tv('m_baslik_son_aktiviteler', 'Son Aktiviteler')}</div>
        </div>

        <div style={s.aktiviteWrap}>
          {aktiviteYukleniyor ? (
            <div style={s.bosDurum}>•••</div>
          ) : aktiviteler && aktiviteler.length > 0 ? (
            aktiviteler.map((l, i) => (
              <div key={i} style={{
                ...s.aktiviteItem,
                borderBottom: i === aktiviteler.length - 1 ? 'none' : '1px solid var(--bor)',
              }}>
                <div style={{ ...s.aktiviteDot, background: renkIslem(l.islem) }} />
                <div style={s.aktiviteBody}>
                  <div style={s.aktiviteTitle}>{l.katman || '—'}</div>
                  <div style={s.aktiviteSub}>{l.islem || '—'}</div>
                </div>
                <div style={s.aktiviteTime}>{formatSure(l.olusturma)}</div>
              </div>
            ))
          ) : (
            <div style={s.bosDurum}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div>{tv('m_aktivite_yok', 'Henüz aktivite yok')}</div>
            </div>
          )}
        </div>

        <div style={{ height: 'calc(16px + env(safe-area-inset-bottom))' }} />
      </div>

      <MDrawer acik={drawerAcik} kapat={() => setDrawerAcik(false)} />
    </div>
  )
}

/* ─── Alt componentler ─── */

function StatKart({ renk, label, deger, sub, onClick }) {
  return (
    <button style={{ ...st.statKart, borderTopColor: renk }} onClick={onClick}>
      <div style={st.statLabel}>{label}</div>
      <div style={st.statVal}>{deger ?? '—'}</div>
      <div style={st.statSub}>{sub}</div>
    </button>
  )
}

function renkIslem(islem) {
  if (islem === 'insert') return 'var(--gr)'
  if (islem === 'update') return 'var(--ac)'
  if (islem === 'delete') return 'var(--re)'
  return 'var(--warn)'
}

/* ─── Stiller ─── */

const s = {
  sayfa: { height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--tx)' },
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
  topbarTitle: { flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--tx)' },
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
  profilBtn: {
    width: 40, height: 40, borderRadius: 20,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    color: 'var(--tx)',
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  scroll: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  hero: {
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
    padding: '20px 16px 20px',
  },
  heroGreeting: { fontSize: 14, color: 'var(--txd)', fontWeight: 600, marginBottom: 4 },
  heroName: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--tx)',
    lineHeight: 1,
  },
  heroMeta: { fontSize: 14, color: 'var(--txd)', marginTop: 6 },
  islemBaslatBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    background: 'var(--ac)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    color: '#fff',
    textAlign: 'left',
    minHeight: 66,
  },
  islemBaslatIkon: {
    fontSize: 26,
    flexShrink: 0,
  },
  islemBaslatBody: { flex: 1, minWidth: 0 },
  islemBaslatBaslik: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  islemBaslatAlt: { fontSize: 14, opacity: 0.85 },
  islemBaslatOk: { fontSize: 22, flexShrink: 0 },
  uyariBanner: {
    margin: '12px 16px 0',
    background: 'rgba(229,62,62,.1)',
    border: '1px solid var(--re)',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: 'calc(100% - 32px)',
    textAlign: 'left',
    cursor: 'pointer',
  },
  uyariIcon: { fontSize: 22, flexShrink: 0 },
  uyariText: { flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--re)', lineHeight: 1.4 },
  uyariArrow: { color: 'var(--re)', fontSize: 18, flexShrink: 0 },
  sectionRow: { padding: '16px 16px 8px' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--txd)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' },
  separator: { height: 1, background: 'var(--bor)', margin: '20px 16px 0' },
  aktiviteWrap: {
    margin: '0 16px 16px',
    background: 'var(--sur)',
    border: '1px solid var(--bor)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  aktiviteItem: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' },
  aktiviteDot: { width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0 },
  aktiviteBody: { flex: 1, minWidth: 0 },
  aktiviteTitle: { fontSize: 14, fontWeight: 600, color: 'var(--tx)' },
  aktiviteSub: { fontSize: 14, color: 'var(--txd)', marginTop: 2 },
  aktiviteTime: { fontSize: 14, color: 'var(--txd)', flexShrink: 0, marginTop: 2 },
  bosDurum: { padding: 24, textAlign: 'center', color: 'var(--txd)', fontSize: 14 },
}

const st = {
  statKart: {
    background: 'var(--sur)',
    border: '1px solid var(--bor)',
    borderTop: '3px solid var(--ac)',
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    textAlign: 'left',
    cursor: 'pointer',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--txd)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statVal: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 40,
    fontWeight: 800,
    lineHeight: 1,
    color: 'var(--tx)',
  },
  statSub: { fontSize: 14, color: 'var(--txd)', marginTop: -4 },
}
