// mobile/src/screens/MDevreler.jsx
// AresPipe — Aktif Devreler ekranı (mobil React port'u, 63. oturum)
// Vanilla devreler.html (1104 satır) yerine geçer.
//
// Özellikler:
// - Kart bazlı liste: sol şerit her zaman mavi (durduruldu istisnası kırmızı),
//   sağ şerit alıştırma rengi (VAR=yeşil, KISMI=amber, YOK=kırmızı)
// - Stat grid (sticky): devre / spool / ağırlık / ilerleme
// - Search bar (anlık filtre — devre/malzeme/proje/tersane üzerinde)
// - Sıralama bottom-sheet (tarih, ağırlık, ilerleme, spool, ad)
// - Filtre paneli (sağdan slide): firma/proje/malzeme/yüzey
//   → durumlar grubu kalktı (devre durumu spool seviyesinde tutulduğu için tek
//     skaler "durum" anlamsız; ilerleme yüzdesi yeterli özet)
// - Cascade fade-in animasyonu (45ms stagger — web G-08 mobil karşılığı)
// - i18n + useT
//
// Notlar:
// - MK-58.1 (a): spooller.alistirma kolonu DB'de uppercase ('VAR'/'KISMI'/'YOK').
//   Lowercase migration sonrası tüm proje birden döner — burada uppercase okuyoruz.
// - MK-62.3: Yeni i18n anahtarları kök lang/{tr,en,ar}.json'a eklenmeli,
//   mobile/src/lang/ predev script ile otomatik kopyalanır.

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { getOturum, getTenantId } from '../lib/auth'
import MDrawer from '../components/MDrawer'

// ───────────────────────── Sabitler ─────────────────────────

const ASAMA_PCT = {
  bekliyor: 0, on_imalat: 14, imalat: 28, kaynak: 43,
  on_kontrol: 57, kk: 71, sevkiyat: 86, tamamlandi: 100,
}

const ALISTIRMA_VAR = 'VAR'
const ALISTIRMA_KISMI = 'KISMI'

const SORT_KEYS = ['tarih_yeni', 'tarih_eski', 'agirlik', 'ilerleme', 'spool', 'ad']

const BOS_FILTRE = { firma: [], proje: [], malzeme: [], yuzey: [] }

// ───────────────────────── Component ─────────────────────────

export default function MDevreler() {
  const navigate = useNavigate()
  const { tv } = useT()

  // Veri
  const [devreler, setDevreler] = useState([])
  const [spoolAgg, setSpoolAgg] = useState({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(null)

  // UI state
  const [drawerAcik, setDrawerAcik] = useState(false)
  const [filtreAcik, setFiltreAcik] = useState(false)
  const [sortAcik, setSortAcik] = useState(false)
  const [arama, setArama] = useState('')
  const [siralama, setSiralama] = useState('tarih_yeni')

  const [aktifFiltreler, setAktifFiltreler] = useState(BOS_FILTRE)
  const [bekleyenFiltreler, setBekleyenFiltreler] = useState(BOS_FILTRE)
  const [acikAkordionlar, setAcikAkordionlar] = useState({
    firma: false, proje: false, malzeme: false, yuzey: false,
  })

  // ─── Yükleme ───
  useEffect(() => {
    let iptal = false
    async function yukle() {
      try {
        setYukleniyor(true)
        setHata(null)

        const oturum = await getOturum()
        if (!oturum) { navigate('/giris'); return }

        const tid = await getTenantId()
        if (!tid) { setHata('baglanti'); return }

        // 1) Devreler + proje + tersane
        const { data: devreList, error: dvErr } = await supabase
          .from('devreler')
          .select('id, is_emri_no, devre_no, ad, zone, durum, durdurma_sebebi, ilerleme, agirlik, malzeme, yuzey, guncelleme, olusturma, projeler(proje_no, gemi_adi, tersaneler(ad))')
          .eq('tenant_id', tid)
          .or('silindi.is.null,silindi.eq.false')
          .order('guncelleme', { ascending: false })

        if (dvErr) throw dvErr
        if (iptal) return
        const liste = devreList || []
        setDevreler(liste)

        // 2) Spool aggregate (devre_id bazında)
        const agg = {}
        if (liste.length > 0) {
          const ids = liste.map(d => d.id)
          const { data: spoolList, error: spErr } = await supabase
            .from('spooller')
            .select('devre_id, agirlik, alistirma, aktif_basamak')
            .in('devre_id', ids)
            .or('silindi.is.null,silindi.eq.false')

          if (spErr) throw spErr
          if (iptal) return

          ;(spoolList || []).forEach(sp => {
            if (!agg[sp.devre_id]) {
              agg[sp.devre_id] = {
                count: 0, agirlik: 0, ilerlemeToplam: 0,
                varCount: 0, kismiCount: 0, yokCount: 0,
              }
            }
            const a = agg[sp.devre_id]
            a.count++
            a.agirlik += parseFloat(sp.agirlik || 0)
            a.ilerlemeToplam += ASAMA_PCT[(sp.aktif_basamak || 'bekliyor').toLowerCase()] || 0

            if (sp.alistirma === ALISTIRMA_VAR) a.varCount++
            else if (sp.alistirma === ALISTIRMA_KISMI) a.kismiCount++
            else a.yokCount++
          })

          Object.keys(agg).forEach(id => {
            const a = agg[id]
            a.ilerlemeAvg = a.count > 0 ? Math.round(a.ilerlemeToplam / a.count) : 0
            if (a.count > 0 && a.varCount === a.count) a.alistirma = ALISTIRMA_VAR
            else if (a.varCount > 0 || a.kismiCount > 0) a.alistirma = ALISTIRMA_KISMI
            else a.alistirma = 'YOK'
          })
        }
        setSpoolAgg(agg)
      } catch (e) {
        console.warn('[MDevreler]', e)
        if (!iptal) setHata('yukleme')
      } finally {
        if (!iptal) setYukleniyor(false)
      }
    }
    yukle()
    return () => { iptal = true }
  }, [navigate])

  // ─── Türetilmiş filtre seçenekleri ───
  const filtreSec = useMemo(() => {
    const f = { firma: new Set(), proje: new Set(), malzeme: new Set(), yuzey: new Set() }
    devreler.forEach(d => {
      const ts = d.projeler?.tersaneler?.ad
      if (ts) f.firma.add(ts)
      if (d.projeler?.proje_no) f.proje.add(d.projeler.proje_no)
      if (d.malzeme) f.malzeme.add(d.malzeme)
      if (d.yuzey) f.yuzey.add(d.yuzey)
    })
    const cmp = (a, b) => a.localeCompare(b, 'tr')
    return {
      firma: Array.from(f.firma).sort(cmp),
      proje: Array.from(f.proje).sort(cmp),
      malzeme: Array.from(f.malzeme).sort(cmp),
      yuzey: Array.from(f.yuzey).sort(cmp),
    }
  }, [devreler])

  // ─── Filtre + arama + sıralama ───
  const gosterilenler = useMemo(() => {
    let liste = devreler

    if (aktifFiltreler.firma.length)
      liste = liste.filter(d => aktifFiltreler.firma.includes(d.projeler?.tersaneler?.ad))
    if (aktifFiltreler.proje.length)
      liste = liste.filter(d => aktifFiltreler.proje.includes(d.projeler?.proje_no))
    if (aktifFiltreler.malzeme.length)
      liste = liste.filter(d => aktifFiltreler.malzeme.includes(d.malzeme))
    if (aktifFiltreler.yuzey.length)
      liste = liste.filter(d => aktifFiltreler.yuzey.includes(d.yuzey))

    const q = arama.trim().toLocaleLowerCase('tr')
    if (q) {
      liste = liste.filter(d => {
        const fields = [
          d.is_emri_no, d.devre_no, d.ad, d.malzeme, d.yuzey, d.zone,
          d.projeler?.proje_no, d.projeler?.gemi_adi, d.projeler?.tersaneler?.ad,
        ]
        return fields.some(f => f && String(f).toLocaleLowerCase('tr').includes(q))
      })
    }

    const sorted = [...liste]
    switch (siralama) {
      case 'tarih_yeni':
        sorted.sort((a, b) => (b.guncelleme || '').localeCompare(a.guncelleme || ''))
        break
      case 'tarih_eski':
        sorted.sort((a, b) => (a.guncelleme || '').localeCompare(b.guncelleme || ''))
        break
      case 'agirlik':
        sorted.sort((a, b) => (spoolAgg[b.id]?.agirlik || 0) - (spoolAgg[a.id]?.agirlik || 0))
        break
      case 'ilerleme':
        sorted.sort((a, b) => (spoolAgg[b.id]?.ilerlemeAvg || 0) - (spoolAgg[a.id]?.ilerlemeAvg || 0))
        break
      case 'spool':
        sorted.sort((a, b) => (spoolAgg[b.id]?.count || 0) - (spoolAgg[a.id]?.count || 0))
        break
      case 'ad':
        sorted.sort((a, b) =>
          (a.ad || a.devre_no || '').localeCompare(b.ad || b.devre_no || '', 'tr')
        )
        break
      default: break
    }
    return sorted
  }, [devreler, aktifFiltreler, arama, siralama, spoolAgg])

  // ─── Stat ───
  const stat = useMemo(() => {
    let spool = 0, ag = 0, ilerToplam = 0, ilerSay = 0
    gosterilenler.forEach(d => {
      const a = spoolAgg[d.id]
      if (!a) return
      spool += a.count || 0
      ag += a.agirlik || 0
      if (a.count > 0) {
        ilerToplam += a.ilerlemeAvg
        ilerSay++
      }
    })
    const agirlikText = ag >= 1000
      ? (ag / 1000).toFixed(1) + ' t'
      : Math.round(ag) + ' kg'
    return {
      devre: gosterilenler.length,
      spool,
      agirlikText,
      ilerleme: ilerSay > 0 ? Math.round(ilerToplam / ilerSay) : 0,
    }
  }, [gosterilenler, spoolAgg])

  // ─── Filtre/sort handler'ları ───
  function filtreAc() {
    setBekleyenFiltreler({
      firma: [...aktifFiltreler.firma],
      proje: [...aktifFiltreler.proje],
      malzeme: [...aktifFiltreler.malzeme],
      yuzey: [...aktifFiltreler.yuzey],
    })
    setFiltreAcik(true)
  }
  function filtreUygula() {
    setAktifFiltreler(bekleyenFiltreler)
    setFiltreAcik(false)
  }
  function filtreTumunuTemizle() {
    setBekleyenFiltreler(BOS_FILTRE)
  }
  function secimToggle(tip, deger) {
    setBekleyenFiltreler(prev => {
      const arr = prev[tip] || []
      const idx = arr.indexOf(deger)
      const yeni = idx >= 0 ? arr.filter((_, i) => i !== idx) : [...arr, deger]
      return { ...prev, [tip]: yeni }
    })
  }
  function chipKaldir(tip, deger) {
    setBekleyenFiltreler(prev => ({
      ...prev,
      [tip]: (prev[tip] || []).filter(v => v !== deger),
    }))
  }
  function akordionToggle(key) {
    setAcikAkordionlar(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const aktifFiltreSayi =
    aktifFiltreler.firma.length + aktifFiltreler.proje.length +
    aktifFiltreler.malzeme.length + aktifFiltreler.yuzey.length
  const bekleyenFiltreSayi =
    bekleyenFiltreler.firma.length + bekleyenFiltreler.proje.length +
    bekleyenFiltreler.malzeme.length + bekleyenFiltreler.yuzey.length

  // ─── ESC ile kapama ───
  useEffect(() => {
    if (!filtreAcik && !sortAcik) return
    function onKey(e) {
      if (e.key !== 'Escape') return
      if (sortAcik) setSortAcik(false)
      else if (filtreAcik) setFiltreAcik(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtreAcik, sortAcik])

  // ─── Body scroll lock ───
  useEffect(() => {
    if (filtreAcik || sortAcik) {
      const onceki = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = onceki }
    }
  }, [filtreAcik, sortAcik])

  // ─── Renk yardımcıları ───
  function solRenk(d) {
    if (d.durdurma_sebebi || (d.durum || '').toLowerCase() === 'durduruldu') return 'var(--re)'
    return 'var(--ac)'
  }
  function sagRenk(devreId) {
    const a = spoolAgg[devreId]
    if (!a) return 'var(--bor)'
    if (a.alistirma === ALISTIRMA_VAR) return 'var(--gr)'
    if (a.alistirma === ALISTIRMA_KISMI) return 'var(--warn)'
    return 'var(--re)'
  }
  function progRenk(pct) {
    if (pct >= 100) return 'var(--gr)'
    if (pct >= 50) return 'var(--ac)'
    if (pct > 0) return 'var(--warn)'
    return 'var(--bor)'
  }

  function devreAc(id) { navigate('/devre/' + id) }

  // ─── Render ───
  return (
    <div style={s.page}>
      {/* TOPBAR */}
      <div style={s.topbar}>
        <button style={s.tbBtn} onClick={() => navigate(-1)} aria-label={tv('m_dvr_geri', 'Geri')}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={s.tbTitle}>{tv('m_dvr_baslik', 'Aktif Devreler')}</div>
        <button style={s.tbBtn} onClick={() => setDrawerAcik(true)} aria-label={tv('m_drawer_profil', 'Menü')}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* SEARCH / FILTER / SORT BAR */}
      <div style={s.qb}>
        <label style={s.qbInput}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txd)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={arama}
            onChange={e => setArama(e.target.value)}
            placeholder={tv('m_dvr_ara_pl', 'Ara — devre, malzeme, proje…')}
            style={s.qbInputField}
          />
        </label>
        <button
          style={s.qbBtn}
          onClick={filtreAc}
          aria-label={tv('m_dvr_filtre_baslik', 'Filtrele')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {aktifFiltreSayi > 0 && <span style={s.qbBtnDot} />}
        </button>
        <button style={s.qbSortBtn} onClick={() => setSortAcik(true)} aria-label={tv('m_dvr_sirala_baslik', 'Sıralama')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M6 12h12M9 18h6"/>
          </svg>
          <span>{tv(sortLabelKey(siralama), sortFallback(siralama))}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* STAT GRID */}
      <div style={s.statWrap}>
        <div style={s.statGrid}>
          <div style={{ ...s.statKart, borderLeftColor: 'var(--leg)' }}>
            <div style={{ ...s.statIkon, background: 'rgba(124,58,237,0.16)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--leg)" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </div>
            <div>
              <div style={s.statLabel}>{tv('m_dvr_stat_devre', 'Devre')}</div>
              <div style={s.statVal}>{yukleniyor ? '—' : stat.devre}</div>
            </div>
          </div>

          <div style={{ ...s.statKart, borderLeftColor: 'var(--gr)' }}>
            <div style={{ ...s.statIkon, background: 'rgba(22,163,110,0.16)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gr)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <div>
              <div style={s.statLabel}>{tv('m_dvr_stat_spool', 'Spool')}</div>
              <div style={s.statVal}>{yukleniyor ? '—' : stat.spool}</div>
            </div>
          </div>

          <div style={{ ...s.statKart, borderLeftColor: 'var(--ac)' }}>
            <div style={{ ...s.statIkon, background: 'rgba(45,142,255,0.16)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2">
                <path d="M12 2a3 3 0 013 3v1h3a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h3V5a3 3 0 013-3z"/>
              </svg>
            </div>
            <div>
              <div style={s.statLabel}>{tv('m_dvr_stat_agirlik', 'Ağırlık')}</div>
              <div style={{ ...s.statVal, fontSize: 18 }}>{yukleniyor ? '—' : stat.agirlikText}</div>
            </div>
          </div>

          <div style={{ ...s.statKart, borderLeftColor: 'var(--re)' }}>
            <div style={{ ...s.statIkon, background: 'rgba(229,62,62,0.14)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--re)" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={s.statLabel}>{tv('m_dvr_stat_ilerleme', 'İlerleme')}</div>
              <div style={s.statVal}>{yukleniyor ? '—' : '%' + stat.ilerleme}</div>
              <div style={s.statProg}>
                <div style={{ ...s.statProgFill, width: stat.ilerleme + '%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LİSTE / İSKELET / BOŞ DURUMLAR */}
      <div style={s.dl}>
        {yukleniyor && (
          [0, 1, 2, 3, 4, 5].map(i => (
            <div key={'sk' + i} style={s.iskelet}>
              <div style={{ ...s.skLine, width: '30%', height: 9 }} />
              <div style={{ ...s.skLine, width: '70%', height: 14 }} />
              <div style={{ ...s.skLine, width: '50%', height: 9 }} />
              <div style={{ ...s.skLine, width: '85%', height: 9, marginTop: 4 }} />
            </div>
          ))
        )}

        {!yukleniyor && hata === 'baglanti' && (
          <div style={s.bos}>
            <div style={{ fontSize: 36 }}>⚠️</div>
            <div style={s.bosText}>{tv('m_dvr_baglanti_hatasi', 'Bağlantı kurulamadı')}</div>
          </div>
        )}
        {!yukleniyor && hata === 'yukleme' && (
          <div style={s.bos}>
            <div style={{ fontSize: 36 }}>⚠️</div>
            <div style={s.bosText}>{tv('m_dvr_yuklenemiyor', 'Devreler yüklenemedi')}</div>
          </div>
        )}
        {!yukleniyor && !hata && devreler.length === 0 && (
          <div style={s.bos}>
            <div style={{ fontSize: 36 }}>🔗</div>
            <div style={s.bosText}>{tv('m_dvr_henuz_yok', 'Henüz devre yok')}</div>
          </div>
        )}
        {!yukleniyor && !hata && devreler.length > 0 && gosterilenler.length === 0 && (
          <div style={s.bos}>
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={s.bosText}>{tv('m_dvr_bulunamadi', 'Eşleşen devre bulunamadı')}</div>
          </div>
        )}

        {!yukleniyor && gosterilenler.length > 0 && (
          <div style={s.devreListe}>
            {gosterilenler.map((d, i) => {
              const pct = d.ilerleme || 0
              const a = spoolAgg[d.id] || {}
              const proje = d.projeler || {}
              const tersaneAd = proje.tersaneler?.ad || ''
              const sub = [tersaneAd, proje.proje_no, d.zone].filter(Boolean).join(' · ')
              const adText = d.devre_no ? d.devre_no + (d.ad ? ' — ' + d.ad : '') : (d.ad || '—')
              const durduruldu = !!(d.durdurma_sebebi || (d.durum || '').toLowerCase() === 'durduruldu')

              return (
                <div
                  key={d.id}
                  style={{ ...s.devreKart, animationDelay: (i * 45 + 80) + 'ms' }}
                  onClick={() => devreAc(d.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') devreAc(d.id) }}
                >
                  <div style={{ ...s.dkSol, background: solRenk(d) }} />
                  <div style={s.dkIc}>
                    <div style={s.dkUst}>
                      <div style={s.dkMeta}>
                        {durduruldu ? (
                          <div style={{ ...s.dkIsEmri, color: 'var(--re)', display: 'flex', alignItems: 'center', gap: 5, textTransform: 'none' }}>
                            <span style={s.pauseIc} aria-hidden="true" />
                            {(d.is_emri_no || '—') + ' · ' + tv('m_dvr_durduruldu', 'Durduruldu')}
                          </div>
                        ) : (
                          <div style={s.dkIsEmri}>{d.is_emri_no || '—'}</div>
                        )}
                        <div style={s.dkAd}>{adText}</div>
                        {sub && <div style={s.dkSub}>{sub}</div>}
                      </div>
                      <div style={s.dkProgWrap}>
                        <div style={{ ...s.dkPct, color: progRenk(pct) }}>{pct}%</div>
                        <div style={s.dkProgBar}>
                          <div style={{ ...s.dkProgFill, width: Math.min(pct, 100) + '%', background: progRenk(pct) }} />
                        </div>
                      </div>
                    </div>
                    <div style={s.dkAlt}>
                      {d.malzeme && <span style={s.dkAltMetin}>{d.malzeme}</span>}
                      {d.malzeme && d.yuzey && <span style={s.dkAltSep}>|</span>}
                      {d.yuzey && <span style={s.dkAltMetin}>{d.yuzey}</span>}
                      {(d.malzeme || d.yuzey) && a.agirlik > 0 && <span style={s.dkAltSep}>|</span>}
                      {a.agirlik > 0 && <span style={s.dkAltMetin}>{Math.round(a.agirlik) + ' kg'}</span>}
                      <span style={s.dkSpool}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--txd)" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 8v4l3 3"/>
                        </svg>
                        {tv('m_dvr_spool_adet', '{n} spool').replace('{n}', a.count || 0)}
                      </span>
                    </div>
                  </div>
                  <div style={{ ...s.dkSag, background: sagRenk(d.id) }} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FILTRE PANELI */}
      {filtreAcik && (
        <>
          <div style={s.ovl} onClick={() => setFiltreAcik(false)} />
          <div style={s.fpn} role="dialog" aria-label={tv('m_dvr_filtre_baslik', 'Filtrele')}>
            <div style={s.fpnHead}>
              <span style={s.fpnTitle}>{tv('m_dvr_filtre_baslik', 'Filtrele')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button style={s.fpnClear} onClick={filtreTumunuTemizle}>
                  {tv('m_dvr_filtre_temizle', 'Temizle')}
                </button>
                <button
                  style={s.fpnX}
                  onClick={() => setFiltreAcik(false)}
                  aria-label={tv('m_dvr_kapat', 'Kapat')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div style={s.selWrap}>
              <div style={s.selTitle}>{tv('m_dvr_filtre_secili', 'Seçili Filtreler')}</div>
              {bekleyenFiltreSayi === 0 ? (
                <div style={s.selBos}>{tv('m_dvr_filtre_bos', 'Henüz filtre seçilmedi')}</div>
              ) : (
                <div style={s.selChips}>
                  {Object.entries(bekleyenFiltreler).flatMap(([tip, arr]) =>
                    arr.map(deger => (
                      <button
                        key={tip + ':' + deger}
                        style={s.chip}
                        onClick={() => chipKaldir(tip, deger)}
                      >
                        <span style={{ fontSize: 13, color: 'var(--ac)' }}>{deger}</span>
                        <svg
                          width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--ac)' }}
                        >
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={s.akordionScroll}>
              {[
                { key: 'firma',   label: tv('m_dvr_filtre_firmalar',   'Firmalar') },
                { key: 'proje',   label: tv('m_dvr_filtre_projeler',   'Projeler') },
                { key: 'malzeme', label: tv('m_dvr_filtre_malzemeler', 'Malzemeler') },
                { key: 'yuzey',   label: tv('m_dvr_filtre_yuzeyler',   'Yüzeyler') },
              ].map(({ key, label }, idx, arr) => {
                const seciliSayi = bekleyenFiltreler[key].length
                const acik = !!acikAkordionlar[key]
                const son = idx === arr.length - 1

                return (
                  <div key={key} style={{ ...s.akordion, ...(son ? { borderBottom: 'none' } : null) }}>
                    <button
                      style={s.akordionHead}
                      onClick={() => akordionToggle(key)}
                      aria-expanded={acik}
                    >
                      <span style={{
                        ...s.akordionLabel,
                        ...(seciliSayi > 0 ? { color: 'var(--ac)' } : null),
                      }}>
                        {label}
                        {seciliSayi > 0 && <span style={s.akordionBadge}>{seciliSayi}</span>}
                      </span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        style={{
                          ...s.akordionOk,
                          transform: acik ? 'rotate(180deg)' : 'rotate(0)',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    {acik && (
                      <div style={s.akordionIcerik}>
                        {filtreSec[key].length === 0 ? (
                          <div style={s.bosFiltreText}>
                            {tv('m_dvr_filtre_secenek_yok', 'Seçenek bulunamadı')}
                          </div>
                        ) : (
                          filtreSec[key].map(deger => {
                            const secili = bekleyenFiltreler[key].includes(deger)
                            return (
                              <button
                                key={deger}
                                style={{ ...s.secimSatir, ...(secili ? s.secimSatirSecili : null) }}
                                onClick={() => secimToggle(key, deger)}
                                aria-pressed={secili}
                              >
                                <span style={{
                                  ...s.secimText,
                                  ...(secili ? { color: 'var(--ac)' } : null),
                                }}>{deger}</span>
                                <div style={{ ...s.secimCb, ...(secili ? s.secimCbSecili : null) }}>
                                  {secili && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  )}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={s.fpnBot}>
              <button style={s.btnUygula} onClick={filtreUygula}>
                {tv('m_dvr_filtre_uygula', 'Uygula')}
                {bekleyenFiltreSayi > 0 ? (' (' + bekleyenFiltreSayi + ')') : ''}
              </button>
            </div>
          </div>
        </>
      )}

      {/* SORT BOTTOM SHEET */}
      {sortAcik && (
        <>
          <div style={s.ovl} onClick={() => setSortAcik(false)} />
          <div style={s.sortSheet} role="dialog" aria-label={tv('m_dvr_sirala_baslik', 'Sıralama')}>
            <div style={s.sortHandle} />
            <div style={s.sortHead}>{tv('m_dvr_sirala_baslik', 'Sıralama')}</div>
            {SORT_KEYS.map(k => {
              const aktif = siralama === k
              return (
                <button
                  key={k}
                  style={{ ...s.sortItem, ...(aktif ? s.sortItemAktif : null) }}
                  onClick={() => { setSiralama(k); setSortAcik(false) }}
                  aria-pressed={aktif}
                >
                  <span>{tv(sortLabelKey(k), sortFallback(k))}</span>
                  {aktif && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* CSS keyframes (sadece bu ekran için) */}
      <style>{`
        @keyframes mDvrFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mDvrSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes mDvrSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes mDvrFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mDvrShim { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }
      `}</style>

      {/* DRAWER */}
      <MDrawer acik={drawerAcik} kapat={() => setDrawerAcik(false)} />
    </div>
  )
}

// ─────── i18n key helpers ───────

function sortLabelKey(k) {
  return ({
    tarih_yeni: 'm_dvr_sirala_tarih_yeni',
    tarih_eski: 'm_dvr_sirala_tarih_eski',
    agirlik:    'm_dvr_sirala_agirlik',
    ilerleme:   'm_dvr_sirala_ilerleme',
    spool:      'm_dvr_sirala_spool',
    ad:         'm_dvr_sirala_ad',
  })[k] || k
}

function sortFallback(k) {
  return ({
    tarih_yeni: 'Tarih (Yeni)',
    tarih_eski: 'Tarih (Eski)',
    agirlik:    'Ağırlık',
    ilerleme:   'İlerleme',
    spool:      'Spool',
    ad:         'Ad',
  })[k] || k
}

// ─────── Stiller ───────

const s = {
  page: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    overflow: 'hidden',
    color: 'var(--tx)',
  },

  topbar: {
    height: 50,
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 4px',
    flexShrink: 0,
  },
  tbBtn: {
    width: 38, height: 38, borderRadius: 9,
    background: 'transparent', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--txm)', cursor: 'pointer', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
    padding: 0,
  },
  tbTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700, fontSize: 17,
    color: 'var(--tx)', letterSpacing: 0.2,
  },

  qb: {
    height: 46,
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
    padding: '7px 9px',
    display: 'flex', alignItems: 'center', gap: 6,
    flexShrink: 0,
  },
  qbInput: {
    flex: 1, minWidth: 0,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: 9, height: 32,
    display: 'flex', alignItems: 'center',
    padding: '0 10px', gap: 7,
    cursor: 'text',
  },
  qbInputField: {
    flex: 1, minWidth: 0,
    border: 'none', outline: 'none', background: 'transparent',
    color: 'var(--tx)', fontSize: 16,
    fontFamily: 'inherit',
    padding: 0,
  },
  qbBtn: {
    width: 32, height: 32,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--txm)', cursor: 'pointer',
    position: 'relative', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
    padding: 0,
  },
  qbBtnDot: {
    position: 'absolute', top: 4, right: 4,
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--ac)',
    border: '1.5px solid var(--sur2)',
  },
  qbSortBtn: {
    height: 32,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: 8,
    padding: '0 9px',
    display: 'flex', alignItems: 'center', gap: 5,
    color: 'var(--txm)', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', flexShrink: 0,
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent',
  },

  statWrap: {
    background: 'var(--bg)',
    padding: '9px 11px 8px',
    borderBottom: '1px solid var(--bor)',
    flexShrink: 0,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 7,
  },
  statKart: {
    background: 'var(--sur)',
    border: '1px solid var(--bor)',
    borderRadius: 11,
    padding: '9px 10px',
    display: 'flex', alignItems: 'center', gap: 9,
    borderLeftWidth: 3, borderLeftStyle: 'solid',
    minHeight: 50,
  },
  statIkon: {
    width: 28, height: 28, borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 11, fontWeight: 500, color: 'var(--txd)',
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 2,
  },
  statVal: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 22, fontWeight: 700,
    color: 'var(--tx)', lineHeight: 1,
  },
  statProg: {
    width: 54, height: 3,
    background: 'var(--bor)',
    borderRadius: 99, marginTop: 5,
    overflow: 'hidden',
  },
  statProgFill: {
    height: '100%', borderRadius: 99,
    background: 'linear-gradient(90deg, var(--warn), var(--gr))',
    transition: 'width .3s ease',
  },

  dl: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '9px 11px 100px',
    scrollbarWidth: 'none',
  },
  iskelet: {
    background: 'var(--sur)',
    border: '1px solid var(--bor)',
    borderRadius: 12,
    padding: '12px 13px',
    display: 'flex', flexDirection: 'column', gap: 7,
    marginBottom: 8,
  },
  skLine: {
    background: 'linear-gradient(90deg, var(--bor) 0%, var(--sur2) 50%, var(--bor) 100%)',
    backgroundSize: '300px 100%',
    animation: 'mDvrShim 1.4s ease-in-out infinite',
    borderRadius: 4,
  },
  bos: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px', gap: 10,
  },
  bosText: { fontSize: 14, color: 'var(--txd)' },

  devreListe: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  devreKart: {
    background: 'var(--sur)',
    border: '1px solid var(--bor)',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex', alignItems: 'stretch',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    opacity: 0,
    animation: 'mDvrFadeIn 260ms ease-out forwards',
  },
  dkSol: { width: 4, flexShrink: 0 },
  dkSag: { width: 4, flexShrink: 0 },
  dkIc: { flex: 1, padding: '10px 11px', minWidth: 0 },
  dkUst: {
    display: 'flex', justifyContent: 'space-between',
    gap: 7, marginBottom: 3,
  },
  dkMeta: { minWidth: 0, flex: 1 },
  dkIsEmri: {
    fontSize: 11, fontWeight: 500, color: 'var(--txd)',
    letterSpacing: 0.5, marginBottom: 2,
    textTransform: 'uppercase',
  },
  dkAd: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 17, fontWeight: 700,
    color: 'var(--tx)', lineHeight: 1.2,
    whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dkSub: {
    fontSize: 14, color: 'var(--txd)',
    marginTop: 2,
    whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dkProgWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-end', gap: 4,
    flexShrink: 0,
  },
  dkPct: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 19, fontWeight: 700, lineHeight: 1,
  },
  dkProgBar: {
    width: 38, height: 3,
    background: 'var(--bor)',
    borderRadius: 99, overflow: 'hidden',
  },
  dkProgFill: { height: '100%', borderRadius: 99 },
  dkAlt: {
    display: 'flex', alignItems: 'center',
    borderTop: '1px solid var(--bor)',
    paddingTop: 7, marginTop: 5,
  },
  dkAltMetin: { fontSize: 14, color: 'var(--txm)', fontWeight: 500 },
  dkAltSep: { fontSize: 14, color: 'var(--bor)', margin: '0 6px' },
  dkSpool: {
    marginLeft: 'auto',
    fontSize: 14, color: 'var(--tx)',
    fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  pauseIc: {
    display: 'inline-block', width: 8, height: 9,
    borderLeft: '2px solid currentColor',
    borderRight: '2px solid currentColor',
  },

  // Filtre paneli
  ovl: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 100,
    animation: 'mDvrFade 280ms ease-out forwards',
  },
  fpn: {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    width: '82%', maxWidth: 360,
    background: 'var(--sur)',
    borderLeft: '1px solid var(--bor)',
    zIndex: 101,
    display: 'flex', flexDirection: 'column',
    animation: 'mDvrSlideIn 320ms cubic-bezier(.4,0,.2,1) forwards',
  },
  fpnHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px 12px',
    borderBottom: '1px solid var(--bor)',
    flexShrink: 0,
  },
  fpnTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 17, fontWeight: 700, color: 'var(--tx)',
  },
  fpnClear: {
    fontSize: 14, color: 'var(--ac)',
    fontWeight: 500, background: 'none', border: 'none',
    cursor: 'pointer', padding: '4px 6px',
    fontFamily: 'inherit',
  },
  fpnX: {
    width: 30, height: 30,
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--txd)', cursor: 'pointer',
    padding: 0,
  },

  selWrap: {
    margin: '11px 14px',
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    padding: '11px 12px',
    flexShrink: 0,
  },
  selTitle: {
    fontSize: 11, fontWeight: 500, color: 'var(--txd)',
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 8,
  },
  selChips: {
    display: 'flex', flexWrap: 'wrap', gap: 5,
  },
  selBos: { fontSize: 14, color: 'var(--txd)' },
  chip: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '4px 9px', borderRadius: 99,
    background: 'rgba(45,142,255,0.12)',
    border: '1px solid rgba(45,142,255,0.28)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  akordionScroll: {
    flex: 1, overflowY: 'auto',
    padding: '0 14px',
    scrollbarWidth: 'none',
  },
  akordion: {
    borderBottom: '1px solid var(--bor)',
  },
  akordionHead: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 2px',
    background: 'transparent', border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent',
  },
  akordionLabel: {
    fontSize: 14, color: 'var(--txm)', fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 7,
  },
  akordionBadge: {
    background: 'rgba(45,142,255,0.16)',
    padding: '1px 8px', borderRadius: 10,
    fontSize: 12, color: 'var(--ac)', fontWeight: 700,
  },
  akordionOk: {
    color: 'var(--txd)', flexShrink: 0,
    transition: 'transform .2s',
  },
  akordionIcerik: {
    display: 'flex', flexDirection: 'column', gap: 5,
    paddingBottom: 10,
  },
  bosFiltreText: {
    fontSize: 14, color: 'var(--txd)',
    padding: '8px 11px',
  },

  secimSatir: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 11px',
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderRadius: 9,
    cursor: 'pointer',
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent',
    transition: 'border-color .12s',
    width: '100%',
  },
  secimSatirSecili: {
    borderColor: 'var(--ac)',
    background: 'var(--sur)',
  },
  secimText: {
    fontSize: 14, color: 'var(--txd)',
    whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0, flex: 1, textAlign: 'left',
  },
  secimCb: {
    width: 19, height: 19,
    border: '1.5px solid var(--bor)',
    borderRadius: 5,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  secimCbSecili: {
    background: 'var(--ac)',
    borderColor: 'var(--ac)',
  },

  fpnBot: {
    padding: '12px 14px max(24px, env(safe-area-inset-bottom))',
    borderTop: '1px solid var(--bor)',
    flexShrink: 0,
  },
  btnUygula: {
    width: '100%', padding: 14,
    borderRadius: 11, border: 'none',
    background: 'var(--ac)', color: '#fff',
    fontSize: 15, fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer',
    transition: 'opacity .15s',
  },

  // Sort sheet
  sortSheet: {
    position: 'fixed',
    bottom: 0, left: 0, right: 0,
    background: 'var(--sur)',
    borderTop: '1px solid var(--bor)',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    zIndex: 101,
    padding: '8px 0 max(24px, env(safe-area-inset-bottom))',
    display: 'flex', flexDirection: 'column',
    animation: 'mDvrSlideUp 280ms cubic-bezier(.4,0,.2,1) forwards',
  },
  sortHandle: {
    width: 38, height: 4,
    background: 'var(--bor)',
    borderRadius: 2,
    margin: '0 auto 12px',
  },
  sortHead: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 17, fontWeight: 700, color: 'var(--tx)',
    padding: '0 18px 12px',
    borderBottom: '1px solid var(--bor)',
  },
  sortItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px',
    background: 'transparent', border: 'none',
    color: 'var(--tx)', fontSize: 16,
    fontFamily: 'inherit', cursor: 'pointer',
    textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
  },
  sortItemAktif: {
    color: 'var(--ac)', fontWeight: 600,
  },
}
