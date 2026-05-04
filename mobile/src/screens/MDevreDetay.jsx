// ============================================================================
// MDevreDetay.jsx — Devre detay (mobil React port)
// Web devre_detay.html'den 1:1 mantık, MSpoolDetay tarzı 3 sekme.
// 59. oturum — MK-58.6 sonrası birincil iş #2.
//
// Tasarım kararları (59'da onaylandı):
//   - 3 sekme: Genel | Malzeme | İşlem Kay. (Malzeme + İşlem Kay placeholder, 60+'da dolacak)
//   - Aşama pill'leri OVAL — 2-3 basamaklı sayı sığsın
//   - Renk paleti vanilla (devre_detay.html sat. 78-83, 120-125) birebir
//   - Sol bar = pill border rengi (kart aşaması bir bakışta okunuyor)
//   - Geri Bildirim FAB yok (ayrı bir iş — MDrawer'a taşınacak)
//   - Bottom nav yok (60+'da MBottomNav ortak component olarak yazılacak)
//
// MK-58.3: Kontrast-kritik renkler için sabit hex (CSS variable bypass).
// ============================================================================

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { getTenantId } from '../lib/auth'

// ── Aşama paleti — vanilla'dan birebir ─────────────────────────────────────
const STAGE_PALET = {
  bekliyor:   { bg: '#F1EFE8', bord: '#B4B2A9', txt: '#2C2C2A', dot: '#5F5E5A', bar: '#5F5E5A' },
  imalat:     { bg: '#E6F1FB', bord: '#85B7EB', txt: '#185FA5', dot: '#185FA5', bar: '#185FA5' },
  kaynak:     { bg: '#E1F5EE', bord: '#5DCAA5', txt: '#0F6E56', dot: '#1D9E75', bar: '#1D9E75' },
  on_kontrol: { bg: '#FAEEDA', bord: '#FAC775', txt: '#633806', dot: '#BA7517', bar: '#BA7517' },
  kk:         { bg: '#EEEDFE', bord: '#AFA9EC', txt: '#3C3489', dot: '#534AB7', bar: '#534AB7' },
  sevkiyat:   { bg: '#EAF3DE', bord: '#97C459', txt: '#27500A', dot: '#639922', bar: '#639922' },
  durduruldu: { bg: '#FCEBEB', bord: '#F09595', txt: '#791F1F', dot: '#A32D2D', bar: '#A32D2D' },
}

// ── Alıştırma paleti (sağ ince çubuk) ──────────────────────────────────────
const ALIST_BAR = {
  VAR:   '#1D9E75',
  KISMI: '#FAC775',
  YOK:   '#B4B2A9',
}

// ── Aşama sıralaması (tracker) ─────────────────────────────────────────────
const STAGE_SIRA = ['bekliyor', 'imalat', 'kaynak', 'on_kontrol', 'kk', 'sevkiyat']

// ── Helper'lar (60+'da format.js'e taşınacak — Açık Borç #6) ───────────────
function esc(s) {
  if (s == null) return ''
  return String(s).replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]))
}

function getStageKey(s) {
  if (s.durduruldu) return 'durduruldu'
  // on_imalat → bekliyor (vanilla aşama tracker'da on_imalat yok)
  if (s.aktif_basamak === 'on_imalat') return 'bekliyor'
  return s.aktif_basamak || 'bekliyor'
}

// MSpoolDetay'dan port — A-000553 → A-0553 (min 4 basamak pad)
function formatSpoolId(id) {
  if (!id) return ''
  const m = String(id).match(/^([A-Z]+)-(\d+)$/i)
  if (!m) return id
  const num = String(parseInt(m[2], 10)).padStart(4, '0')
  return `${m[1].toUpperCase()}-${num}`
}

// MSpoolDetay'dan port — Rev formatı
function revFmt(rev) {
  if (rev == null || rev === 0) return ''
  return `Rev${rev}`
}

// MSpoolDetay'dan port — E-02 marka: proje_no-pipeline_no-spool_no[-RevN]
function markaHesapla(sp, devre, proje) {
  const parcalar = [
    proje?.proje_no || '',
    sp?.pipeline_no || '',
    sp?.spool_no || '',
    revFmt(sp?.rev),
  ].filter(Boolean)
  const m = parcalar.join('-')
  return m || sp?.spool_no || '—'
}

// Malzeme kodu → lokalize etiket (web ARES_NORM.malzemeEtiket eşi)
// Canonical kodlar: karbon, paslanmaz, bakir, alum, diger
function malzemeEtiket(kod, tv) {
  if (!kod) return '—'
  const k = String(kod).toLowerCase().trim()
  const map = {
    karbon:    tv('cmn_malzeme_karbon',    'Karbon Çelik'),
    paslanmaz: tv('cmn_malzeme_paslanmaz', 'Paslanmaz'),
    bakir:     tv('cmn_malzeme_bakir',     'Bakır Alaşım'),
    alum:      tv('cmn_malzeme_alum',      'Alüminyum'),
    diger:     tv('cmn_malzeme_diger',     'Diğer'),
  }
  return map[k] || kod
}

// ── CSS — inline style block, MSpoolDetay pattern ──────────────────────────
const styleBlock = `
.mdv-root { height: 100dvh; overflow: auto; background: var(--bg); color: var(--tx); position: relative; }

.mdv-topbar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: var(--bg); border-bottom: 1px solid var(--bor); }
.mdv-back { width: 36px; height: 36px; border: none; background: transparent; color: var(--tx); display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; border-radius: 8px; }
.mdv-back:active { background: var(--sur); }
.mdv-back svg { width: 22px; height: 22px; }
.mdv-tblabel { flex: 1; font-size: 16px; font-weight: 600; color: var(--tx); text-align: center; padding-right: 36px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mdv-tabs { display: flex; background: var(--bg); border-bottom: 1px solid var(--bor); position: sticky; top: 60px; z-index: 28; }
.mdv-tab { flex: 1; padding: 12px 0; text-align: center; font-size: 14px; font-weight: 500; color: var(--txm); background: transparent; border: none; cursor: pointer; position: relative; font-family: inherit; }
.mdv-tab.act { color: #1a1817; }
[data-theme=dark] .mdv-tab.act { color: #eceae3; }
.mdv-tab.act::after { content: ''; position: absolute; bottom: -1px; left: 16px; right: 16px; height: 2px; background: var(--ac); }
.mdv-tab:active { background: var(--sur); }

.mdv-shead { padding: 12px 14px 14px; background: var(--bg); border-bottom: 1px solid var(--bor); }
.mdv-hdr-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; gap: 10px; }
.mdv-hdr { font-size: 15px; font-weight: 500; min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mdv-hdr-gemi { color: var(--ac); font-weight: 600; }
.mdv-hdr-sep { color: var(--txd); margin: 0 5px; }
.mdv-hdr-link { font-size: 11px; color: var(--ac); font-weight: 600; flex-shrink: 0; cursor: pointer; background: transparent; border: none; padding: 0; font-family: inherit; }

.mdv-srow { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
.mdv-sbox { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--sur); border-radius: 9px; padding: 8px 10px; }
.mdv-sbox svg { width: 14px; height: 14px; color: var(--txd); flex-shrink: 0; }
.mdv-sbox input { flex: 1; background: transparent; border: none; outline: none; font-size: 14px; color: var(--tx); font-family: inherit; min-width: 0; }
.mdv-sbox input::placeholder { color: var(--txd); }
.mdv-cnt { font-size: 13px; color: var(--txm); white-space: nowrap; }
.mdv-cnt b { font-weight: 600; color: var(--tx); }
.mdv-cnt em { font-style: normal; }
.mdv-stop-cnt { display: flex; align-items: center; gap: 5px; background: #FCEBEB; padding: 4px 8px; border-radius: 999px; flex-shrink: 0; }
.mdv-stop-dot { width: 6px; height: 6px; border-radius: 50%; background: #A32D2D; }
.mdv-stop-tx { font-size: 11px; color: #791F1F; font-weight: 600; }
[data-theme=dark] .mdv-stop-cnt { background: rgba(229,62,62,.18); }
[data-theme=dark] .mdv-stop-tx { color: #fca5a5; }

.mdv-track { display: flex; align-items: flex-start; gap: 0; }
.mdv-tstep { flex: 1; display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 2px 0; }
.mdv-tstep:active .mdv-tpill { transform: scale(.95); }
.mdv-tpill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; border: 1.5px solid; transition: transform .1s ease, box-shadow .15s ease; }
.mdv-tcnt { font-size: 13px; font-weight: 600; line-height: 1; }
.mdv-tdot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.mdv-tlbl { font-size: 10.5px; color: var(--txm); margin-top: 5px; white-space: nowrap; }
.mdv-tline { height: 1px; background: var(--bor); width: 8px; margin-top: 14px; flex-shrink: 0; }
.mdv-tstep.sel .mdv-tpill { box-shadow: 0 0 0 2px currentColor; }

.mdv-fbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 14px; background: var(--sur); border-top: 1px solid var(--bor); border-bottom: 1px solid var(--bor); }
.mdv-finfo { font-size: 12px; color: var(--txm); flex: 1; }
.mdv-finfo b { font-weight: 600; color: var(--tx); }
.mdv-clear { font-size: 12px; color: var(--ac); font-weight: 600; background: transparent; border: none; cursor: pointer; padding: 4px 8px; font-family: inherit; }
.mdv-clear:active { opacity: .6; }

.mdv-list { padding: 10px 12px; }
.mdv-card { display: flex; background: var(--sur); border: 1px solid var(--bor); border-radius: 10px; margin-bottom: 8px; overflow: hidden; cursor: pointer; }
.mdv-card:active { opacity: .85; }
.mdv-bar-l { width: 4px; flex-shrink: 0; }
.mdv-bar-r { width: 3px; flex-shrink: 0; }
.mdv-cbody { flex: 1; padding: 10px 10px; min-width: 0; }
.mdv-cid { font-size: 14px; font-weight: 600; color: var(--tx); margin-bottom: 4px; }
.mdv-cno { font-size: 13px; color: var(--tx); margin-bottom: 4px; word-break: break-all; }
.mdv-cmeta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 11.5px; color: var(--txm); }
.mdv-meta-cap { color: var(--ac); font-weight: 600; }
.mdv-meta-sep { opacity: .35; }
.mdv-meta-stop { color: #A32D2D; font-weight: 500; }
[data-theme=dark] .mdv-meta-stop { color: #fca5a5; }
.mdv-cright { display: flex; align-items: center; padding-right: 10px; flex-shrink: 0; }
.mdv-cbadge { font-size: 11px; padding: 3px 8px; border-radius: 999px; font-weight: 600; white-space: nowrap; }

.mdv-empty { padding: 60px 20px; text-align: center; color: var(--txm); }
.mdv-empty-ic { font-size: 36px; margin-bottom: 10px; opacity: .5; }
.mdv-empty-tx { font-size: 14px; }
.mdv-skel { height: 70px; background: var(--sur); border: 1px solid var(--bor); border-radius: 10px; margin-bottom: 8px; opacity: .5; }

.mdv-soon { padding: 80px 20px; text-align: center; color: var(--txm); }
.mdv-soon-ic { font-size: 40px; margin-bottom: 12px; opacity: .4; }
.mdv-soon-tx { font-size: 14px; }
`

// ── Component ───────────────────────────────────────────────────────────────
export default function MDevreDetay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tv } = useT()

  const [devre, setDevre] = useState(null)
  const [proje, setProje] = useState(null)
  const [spooller, setSpooller] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [bulunamadi, setBulunamadi] = useState(false)

  const [aktifTab, setAktifTab] = useState('genel')
  const [secili, setSecili] = useState(new Set())
  const [arama, setArama] = useState('')

  // ── Veri yükle ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setBulunamadi(true); setYukleniyor(false); return }

    let iptal = false
    async function yukle() {
      try {
        const tid = await getTenantId()
        if (!tid) return

        const { data: devreData, error: devreErr } = await supabase
          .from('devreler')
          .select('id, devre_no, ad, zone, projeler(id, proje_no, tersaneler(ad))')
          .eq('id', id)
          .single()

        if (iptal) return

        if (devreErr || !devreData) {
          setBulunamadi(true); setYukleniyor(false); return
        }

        setDevre(devreData)
        setProje(devreData.projeler || null)

        const { data: spData } = await supabase
          .from('spooller')
          .select('id, spool_id, spool_no, pipeline_no, rev, aktif_basamak, durduruldu, durdurma_sebebi, dis_cap_mm, malzeme, kalite, alistirma')
          .eq('tenant_id', tid)
          .eq('devre_id', id)
          .order('spool_id', { ascending: true })

        if (iptal) return

        // Durdurulmuşlar önce
        const sorted = (spData || []).slice().sort((a, b) => (b.durduruldu ? 1 : 0) - (a.durduruldu ? 1 : 0))
        setSpooller(sorted)
        setYukleniyor(false)
      } catch (e) {
        console.error('[MDevreDetay] yukle hata:', e)
        if (!iptal) { setBulunamadi(true); setYukleniyor(false) }
      }
    }

    yukle()
    return () => { iptal = true }
  }, [id])

  // ── Filtre ────────────────────────────────────────────────────────────────
  function toggleStage(stage) {
    setSecili(prev => {
      const next = new Set(prev)
      if (next.has(stage)) next.delete(stage); else next.add(stage)
      return next
    })
  }

  function clearFilters() {
    setSecili(new Set())
    setArama('')
  }

  // ── Hesaplanan değerler ───────────────────────────────────────────────────
  const stageCounts = STAGE_SIRA.reduce((acc, k) => { acc[k] = 0; return acc }, {})
  let durdurulduCnt = 0
  spooller.forEach(s => {
    if (s.durduruldu) { durdurulduCnt++; return }
    const k = getStageKey(s)  // on_imalat → bekliyor
    if (stageCounts.hasOwnProperty(k)) stageCounts[k]++
  })

  const arGm = arama.toLowerCase().trim()
  const gosterilen = spooller.filter(s => {
    if (secili.size > 0) {
      const sk = getStageKey(s)
      if (!secili.has(sk)) return false
    }
    if (!arGm) return true
    const blob = `${s.spool_id || ''} ${s.spool_no || ''} ${s.malzeme || ''} ${s.kalite || ''}`.toLowerCase()
    return blob.includes(arGm)
  })

  const total = spooller.length
  const filtreAktif = secili.size > 0 || arGm.length > 0

  // ── Render: yükleniyor / bulunamadı ───────────────────────────────────────
  if (yukleniyor) {
    return (
      <div className="mdv-root">
        <style>{styleBlock}</style>
        <div className="mdv-topbar">
          <button className="mdv-back" onClick={() => navigate('/devreler')} aria-label={tv('mob_dv_geri', 'Geri')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="mdv-tblabel">{tv('mob_dv_baslik', 'Devre')}</div>
        </div>
        <div className="mdv-list">
          <div className="mdv-skel" /><div className="mdv-skel" /><div className="mdv-skel" /><div className="mdv-skel" />
        </div>
      </div>
    )
  }

  if (bulunamadi) {
    return (
      <div className="mdv-root">
        <style>{styleBlock}</style>
        <div className="mdv-topbar">
          <button className="mdv-back" onClick={() => navigate('/devreler')} aria-label={tv('mob_dv_geri', 'Geri')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="mdv-tblabel">{tv('mob_dv_baslik', 'Devre')}</div>
        </div>
        <div className="mdv-empty">
          <div className="mdv-empty-ic">⚠️</div>
          <div className="mdv-empty-tx">{tv('mob_dv_bulunamadi', 'Devre bulunamadı')}</div>
        </div>
      </div>
    )
  }

  // ── Spool kartı ───────────────────────────────────────────────────────────
  function spoolKart(s) {
    const stage = getStageKey(s)
    const palet = STAGE_PALET[stage] || STAGE_PALET.bekliyor
    const alist = ALIST_BAR[s.alistirma] || ALIST_BAR.YOK
    const stopMeta = s.durduruldu && s.durdurma_sebebi
      ? `⛔ ${esc(s.durdurma_sebebi.substring(0, 30))}`
      : null

    const stageLabel = {
      bekliyor: tv('mob_dv_bekliyor', 'Bekliyor'),
      imalat: tv('mob_dv_imalat', 'İmalat'),
      kaynak: tv('mob_dv_kaynak', 'Kaynak'),
      on_kontrol: tv('mob_dv_on_kontrol', 'Ön Kontrol'),
      kk: tv('mob_dv_kk', 'KK'),
      sevkiyat: tv('mob_dv_sevkiyat', 'Sevkiyat'),
      durduruldu: tv('mob_dv_durduruldu', 'Durduruldu'),
    }[stage]

    return (
      <div key={s.id} className="mdv-card" onClick={() => navigate(`/spool/${s.id}`)}>
        <div className="mdv-bar-l" style={{ background: palet.bar }} />
        <div className="mdv-cbody">
          <div className="mdv-cid">{formatSpoolId(s.spool_id) || '—'}</div>
          <div className="mdv-cno">{markaHesapla(s, devre, proje)}</div>
          <div className="mdv-cmeta">
            <span className="mdv-meta-cap">Ø{s.dis_cap_mm || '—'}</span>
            <span className="mdv-meta-sep">·</span>
            <span>{malzemeEtiket(s.malzeme, tv)}</span>
            {s.kalite && <><span className="mdv-meta-sep">·</span><span>{s.kalite}</span></>}
            {stopMeta && <><span className="mdv-meta-sep">·</span><span className="mdv-meta-stop">{stopMeta}</span></>}
          </div>
        </div>
        <div className="mdv-cright">
          <span className="mdv-cbadge" style={{ background: palet.bg, color: palet.txt }}>{stageLabel}</span>
        </div>
        <div className="mdv-bar-r" style={{ background: alist }} />
      </div>
    )
  }

  // ── Render: Genel sekmesi ─────────────────────────────────────────────────
  function renderGenel() {
    return (
      <>
        <div className="mdv-shead">
          <div className="mdv-hdr-row">
            <div className="mdv-hdr">
              {proje?.proje_no && <><span className="mdv-hdr-gemi">{proje.proje_no}</span><span className="mdv-hdr-sep">/</span></>}
              <span>{devre?.ad || devre?.devre_no || '—'}</span>
            </div>
            <button className="mdv-hdr-link" onClick={() => navigate('/devreler')}>
              {tv('mob_dv_tum_devreler', 'Tüm Devreler')}
            </button>
          </div>

          <div className="mdv-srow">
            <div className="mdv-sbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                value={arama}
                onChange={e => setArama(e.target.value)}
                placeholder={tv('mob_dv_spool_ara', 'Spool ara...')}
              />
            </div>
            <div className="mdv-cnt">
              <b>{filtreAktif ? `${gosterilen.length}/${total}` : total}</b>{' '}
              <em>{tv('mob_dv_spool', 'spool')}</em>
            </div>
            {durdurulduCnt > 0 && (
              <div className="mdv-stop-cnt">
                <div className="mdv-stop-dot" />
                <span className="mdv-stop-tx">{durdurulduCnt} {tv('mob_dv_durdu_kisa', 'durdu')}</span>
              </div>
            )}
          </div>

          <div className="mdv-track">
            {STAGE_SIRA.map((stage, i) => {
              const palet = STAGE_PALET[stage]
              const cnt = stageCounts[stage]
              const sel = secili.has(stage)
              const lbl = {
                bekliyor: tv('mob_dv_bekliyor', 'Bekliyor'),
                imalat: tv('mob_dv_imalat', 'İmalat'),
                kaynak: tv('mob_dv_kaynak', 'Kaynak'),
                on_kontrol: tv('mob_dv_on_kont', 'Ön Kont.'),
                kk: tv('mob_dv_kk', 'KK'),
                sevkiyat: tv('mob_dv_sevkiyat', 'Sevkiyat'),
              }[stage]
              return (
                <React.Fragment key={stage}>
                  <div
                    className={`mdv-tstep ${sel ? 'sel' : ''}`}
                    onClick={() => toggleStage(stage)}
                    style={{ color: palet.dot }}
                  >
                    <div
                      className="mdv-tpill"
                      style={{ background: palet.bg, borderColor: palet.bord }}
                    >
                      <span className="mdv-tcnt" style={{ color: palet.txt }}>{cnt}</span>
                      <div className="mdv-tdot" style={{ background: palet.dot }} />
                    </div>
                    <div className="mdv-tlbl">{lbl}</div>
                  </div>
                  {i < STAGE_SIRA.length - 1 && <div className="mdv-tline" />}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {filtreAktif && (
          <div className="mdv-fbar">
            <div className="mdv-finfo">
              <b>{gosterilen.length}/{total}</b> {tv('mob_dv_gosteriyor', 'spool gösteriliyor')}
            </div>
            <button className="mdv-clear" onClick={clearFilters}>
              {tv('mob_filtre_temizle', 'Temizle')}
            </button>
          </div>
        )}

        <div className="mdv-list">
          {gosterilen.length === 0 ? (
            <div className="mdv-empty">
              <div className="mdv-empty-ic">📦</div>
              <div className="mdv-empty-tx">
                {filtreAktif
                  ? tv('mob_dv_filtre_bos', 'Filtreye uyan spool yok')
                  : tv('mob_dv_spool_yok', 'Bu devreye ait spool bulunamadı')
                }
              </div>
            </div>
          ) : (
            gosterilen.map(spoolKart)
          )}
        </div>
      </>
    )
  }

  // ── Render: Ana iskelet ───────────────────────────────────────────────────
  return (
    <div className="mdv-root">
      <style>{styleBlock}</style>

      <div className="mdv-topbar">
        <button className="mdv-back" onClick={() => navigate('/devreler')} aria-label={tv('mob_dv_geri', 'Geri')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="mdv-tblabel">{devre?.devre_no || tv('mob_dv_baslik', 'Devre')}</div>
      </div>

      <div className="mdv-tabs">
        <button className={`mdv-tab ${aktifTab === 'genel' ? 'act' : ''}`} onClick={() => setAktifTab('genel')}>
          {tv('mob_dv_sekme_genel', 'Genel')}
        </button>
        <button className={`mdv-tab ${aktifTab === 'malzeme' ? 'act' : ''}`} onClick={() => setAktifTab('malzeme')}>
          {tv('mob_dv_sekme_malzeme', 'Malzeme')}
        </button>
        <button className={`mdv-tab ${aktifTab === 'islem' ? 'act' : ''}`} onClick={() => setAktifTab('islem')}>
          {tv('mob_dv_sekme_islem', 'İşlem Kay.')}
        </button>
      </div>

      {aktifTab === 'genel' && renderGenel()}

      {aktifTab === 'malzeme' && (
        <div className="mdv-soon">
          <div className="mdv-soon-ic">🧱</div>
          <div className="mdv-soon-tx">{tv('mob_dv_malzeme_yakinda', 'Devre malzeme listesi yakında')}</div>
        </div>
      )}

      {aktifTab === 'islem' && (
        <div className="mdv-soon">
          <div className="mdv-soon-ic">📋</div>
          <div className="mdv-soon-tx">{tv('mob_dv_islem_yakinda', 'İşlem kayıtları yakında')}</div>
        </div>
      )}
    </div>
  )
}
