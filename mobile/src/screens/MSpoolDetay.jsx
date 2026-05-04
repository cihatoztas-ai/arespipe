// mobile/src/screens/MSpoolDetay.jsx
//
// 58. oturum — vanilla mobile/spool_detay.html'in React port'u.
// MK-54.E/F/G + 58'de eklenenler:
//   - 3 sekme (Genel | Malzeme | İşlem Kayıtları), 3D Model atıldı
//   - Spool Bilgileri'nden Pipeline No kalktı (tam marka zaten bar'da)
//   - Alıştırma artık Spool Bilgileri'nin son satırı (işlem değil, durum)
//   - İşlem Durumu 4 satır: Kesim/Büküm/Markalama/Test, n/N renk pill
//     (devre_detay.html 1308-1310'daki nested select formülü birebir kopyalandı)
//   - Tam marka bar: proje_no-pipeline_no-spool_no[-RevN] (E-02 formatı)
//   - Sekme yazıları açık temada siyah, koyu temada açık metin (var(--tx) bypass: doğrudan hex)
//   - Tipografi tabanı yükseltildi (F-01 14px alt sınır)
//   - Devre adı uzunsa ellipsis + tıklayınca modal
//   - Topbar geri: navigate('/devre/' + devre_id) — MDevreDetay yazılınca otomatik bağlanır
//   - Geri Bildirim FAB + bottom sheet aynen korundu
//
// Tutarsızlık not (oturum sonu KARARLAR.md MK-58.X olarak):
//   spooller.alistirma kolonu mobile vanilla'da 'tam|kismi|yok', devre_detay'da
//   'VAR|KISMI|YOK' okunuyor — defensive handler ikisini de kabul ediyor.

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { getTenantId } from '../lib/auth'

// ── Helper'lar ────────────────────────────────────────────────────────────

function revFmt(rev) {
  const n = Number(rev)
  return Number.isFinite(n) && n > 0 ? `Rev${n}` : ''
}

// E-02 marka: proje_no-pipeline_no-spool_no[-RevN]
// Web spool_detay.html satır 1968-1970'in birebir port'u
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

// devre_detay.html satır 1400 islemMb helper'ının React port'u
// 0 toplam → "—", 0/N → kırmızı, N/N → yeşil, n/N → sarı
function nNRenkler(tamamlanan, toplam) {
  if (!toplam) return { txt: '—', cls: 'msd-pill-none' }
  if (!tamamlanan) return { txt: `0/${toplam}`, cls: 'msd-pill-red' }
  if (tamamlanan === toplam) return { txt: `${toplam}/${toplam}`, cls: 'msd-pill-green' }
  return { txt: `${tamamlanan}/${toplam}`, cls: 'msd-pill-yellow' }
}

// Alıştırma defensive — 'tam'/'VAR' = yapıldı, 'kismi'/'KISMI' = kısmi, 'yok'/'YOK'/null = yok
// Mobile vanilla convention'ı: yapıldı=yeşil, kısmi=sarı, yok=kırmızı
function alistirmaBilgi(v, tv) {
  const x = (v || '').toString().toLowerCase()
  if (x === 'tam' || x === 'var') {
    return { txt: tv('mob_sp_alist_var', 'Var'), cls: 'msd-alist-tam' }
  }
  if (x === 'kismi') {
    return { txt: tv('mob_sp_alist_kismi', 'Kısmi'), cls: 'msd-alist-kismi' }
  }
  return { txt: tv('mob_sp_alist_yok', 'Yok'), cls: 'msd-alist-yok' }
}

// 7 durum için topbar badge
const BADGES = {
  bekliyor:   { bg: 'rgba(107,122,144,.15)', tx: 'var(--txm)', lbl: 'Bekliyor' },
  imalat:     { bg: 'rgba(45,142,255,.14)',  tx: 'var(--ac)',  lbl: 'İmalat' },
  kaynak:     { bg: 'rgba(29,158,117,.14)',  tx: 'var(--gr)',  lbl: 'Kaynak' },
  on_kontrol: { bg: 'rgba(217,119,6,.14)',   tx: 'var(--warn)', lbl: 'Ön Kontrol' },
  kk:         { bg: 'rgba(124,58,237,.14)',  tx: 'var(--leg)', lbl: 'KK' },
  sevkiyat:   { bg: 'rgba(22,163,110,.14)',  tx: 'var(--gr)',  lbl: 'Sevkiyat' },
  durduruldu: { bg: 'rgba(229,62,62,.14)',   tx: 'var(--re)',  lbl: 'Durduruldu' },
}

function formatTarih(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return '—'
    const ay = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][d.getMonth()]
    return `${d.getDate()} ${ay} ${d.getFullYear()}`
  } catch { return '—' }
}

function formatTarihSaat(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return '—'
    const ay = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][d.getMonth()]
    const ss = String(d.getMinutes()).padStart(2, '0')
    return `${d.getDate()} ${ay} ${d.getFullYear()}, ${d.getHours()}:${ss}`
  } catch { return '—' }
}

function formatSure(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return '—'
  const fark = (Date.now() - d.getTime()) / 1000
  if (fark < 60) return 'az önce'
  if (fark < 3600) return `${Math.floor(fark/60)} dk önce`
  if (fark < 86400) return `${Math.floor(fark/3600)} saat önce`
  if (fark < 604800) return `${Math.floor(fark/86400)} gün önce`
  return formatTarih(isoStr)
}

// ── Ana bileşen ───────────────────────────────────────────────────────────

function formatSpoolId(id) {
  if (!id) return '';
  const m = String(id).match(/^([A-Z]+)-(\d+)$/i);
  if (!m) return id;
  const num = String(parseInt(m[2], 10)).padStart(4, '0');
  return `${m[1].toUpperCase()}-${num}`;
}

export default function MSpoolDetay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tv } = useT()

  const [sp, setSp] = useState(null)
  const [proje, setProje] = useState(null)
  const [devre, setDevre] = useState(null)
  const [fotolar, setFotolar] = useState([])
  const [fotoIdx, setFotoIdx] = useState(0)
  const [malzemeler, setMalzemeler] = useState([])
  const [belgeler, setBelgeler] = useState([])
  const [loglar, setLoglar] = useState([])
  const [kkBilgi, setKkBilgi] = useState(null)
  const [sevkBilgi, setSevkBilgi] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [bulunamadi, setBulunamadi] = useState(false)
  const [aktifTab, setAktifTab] = useState('genel')
  const [devreModalAcik, setDevreModalAcik] = useState(false)

  // Geri bildirim modal
  const [fbAcik, setFbAcik] = useState(false)
  const [fbKat, setFbKat] = useState('hata')
  const [fbNot, setFbNot] = useState('')
  const [fbFotoData, setFbFotoData] = useState(null)
  const [fbGonderiyor, setFbGonderiyor] = useState(false)
  const fotoInputRef = useRef(null)

  // ── Veri yükle ─────────────────────────────────────────────────────────
  useEffect(() => {
    let iptal = false

    async function yukle() {
      if (!id) { setBulunamadi(true); setYukleniyor(false); return }
      const tid = await getTenantId()
      if (!tid) { setBulunamadi(true); setYukleniyor(false); return }

      try {
        // Ana spool + nested kalemler (n/N için) — devre_detay.html 1201'in port'u
        const { data: spData, error: spErr } = await supabase
          .from('spooller')
          .select(`
            *,
            kesim_kalemleri(id, kesildi),
            bukum_kalemleri(id, bukuldu),
            markalama_kalemleri(id, markalandi),
            devreler(id, devre_no, ad, zone, projeler(proje_no, tersaneler(ad)))
          `)
          .eq('id', id)
          .eq('tenant_id', tid)
          .single()

        if (iptal) return
        if (spErr || !spData) { setBulunamadi(true); setYukleniyor(false); return }

        setSp(spData)
        setDevre(spData.devreler || null)
        setProje(spData.devreler?.projeler || null)

        // Paralel yüklemeler
        const [rFoto, rKK, rSevk, rBelge, rMalz, rLog] = await Promise.all([
          supabase.from('fotograflar')
            .select('dosya_url, olusturma, yukleyen_id, islem_turu')
            .eq('spool_id', spData.id)
            .order('olusturma', { ascending: false })
            .limit(20),
          supabase.from('kk_davet_spooller')
            .select('kk_davetler(davet_no, olusturma)')
            .eq('spool_id', spData.id),
          supabase.from('sevkiyat_spooller')
            .select('sevkiyatlar(sevk_no, tarih)')
            .eq('spool_id', spData.id)
            .limit(1),
          supabase.from('belgeler')
            .select('ad, dosya_url, olusturma')
            .eq('spool_id', spData.id)
            .order('olusturma', { ascending: false }),
          supabase.from('spool_malzemeleri')
            .select('malzeme, kalite, dis_cap_mm, et_mm, boy_mm')
            .eq('spool_id', spData.id),
          supabase.from('islem_log')
            .select('katman, islem, olusturma')
            .eq('spool_id', spData.id)
            .order('olusturma', { ascending: false })
            .limit(30),
        ])

        if (iptal) return
        setFotolar(rFoto?.data || [])
        setFotoIdx(0)
        const kkList = (rKK?.data || [])
          .map(r => r.kk_davetler)
          .filter(Boolean)
          .sort((a, b) => new Date(b.olusturma) - new Date(a.olusturma))
        setKkBilgi(kkList[0] || null)
        const svlar = rSevk?.data?.[0]?.sevkiyatlar
        setSevkBilgi(svlar || null)
        setBelgeler(rBelge?.data || [])
        setMalzemeler(rMalz?.data || [])
        setLoglar(rLog?.data || [])
        setYukleniyor(false)

      } catch (e) {
        console.error('[MSpoolDetay] yukle hata:', e)
        if (!iptal) { setBulunamadi(true); setYukleniyor(false) }
      }
    }

    yukle()
    return () => { iptal = true }
  }, [id])

  // ── Türetilmiş değerler ────────────────────────────────────────────────
  const marka = sp ? markaHesapla(sp, devre, proje) : ''

  // n/N hesapları (devre_detay.html 1308-1310 birebir)
  const islemler = sp ? {
    kesim:     { toplam: (sp.kesim_kalemleri||[]).length,     tamamlanan: (sp.kesim_kalemleri||[]).filter(k=>k.kesildi).length },
    bukum:     { toplam: (sp.bukum_kalemleri||[]).length,     tamamlanan: (sp.bukum_kalemleri||[]).filter(k=>k.bukuldu).length },
    markalama: { toplam: (sp.markalama_kalemleri||[]).length, tamamlanan: (sp.markalama_kalemleri||[]).filter(k=>k.markalandi).length },
    test:      { toplam: 0, tamamlanan: 0 }, // schema'da test_kalemleri yok (devre_detay 1328 ile aynı)
  } : null

  const islemTamamSayac = islemler
    ? ['kesim','bukum','markalama','test'].filter(k => islemler[k].toplam > 0 && islemler[k].tamamlanan === islemler[k].toplam).length
    : 0
  const islemAktifSayac = islemler
    ? ['kesim','bukum','markalama','test'].filter(k => islemler[k].toplam > 0).length
    : 0

  const aktifBasamak = sp?.durduruldu ? 'durduruldu' : (sp?.aktif_basamak || 'bekliyor')
  const badge = BADGES[aktifBasamak] || BADGES.bekliyor

  const alist = sp ? alistirmaBilgi(sp.alistirma, tv) : null

  // ── Geri bildirim handler'ları ────────────────────────────────────────
  function fbFotoSec() {
    fotoInputRef.current?.click()
  }
  function fbFotoYukle(ev) {
    const f = ev.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (e) => setFbFotoData(e.target.result)
    reader.readAsDataURL(f)
  }
  async function fbGonder() {
    const not = fbNot.trim()
    if (!not || fbGonderiyor) return
    setFbGonderiyor(true)
    try {
      const tid = await getTenantId()
      const { data: { user } } = await supabase.auth.getUser()

      let foto_url = null
      if (fbFotoData) {
        try {
          const blob = await fetch(fbFotoData).then(r => r.blob())
          const dosyaAdi = `feedback/${Date.now()}.jpg`
          const yukle = await supabase.storage
            .from('arespipe-dosyalar')
            .upload(dosyaAdi, blob, { contentType: 'image/jpeg' })
          if (!yukle.error) {
            const { data: urlData } = supabase.storage
              .from('arespipe-dosyalar')
              .getPublicUrl(dosyaAdi)
            foto_url = urlData?.publicUrl || null
          } else {
            foto_url = fbFotoData
          }
        } catch {
          foto_url = fbFotoData
        }
      }

      await supabase.from('feedback_kayitlari').insert({
        tenant_id: tid,
        kullanici_id: user?.id || null,
        sayfa_url: `/spool/${id}`,
        kategori: fbKat,
        not_: not,
        fotograf_url: foto_url,
      })

      // Kapanış + reset
      setFbAcik(false)
      setFbNot('')
      setFbFotoData(null)
      setFbKat('hata')
      // Toast yok — eğer mobile'da global toast varsa (örn. mToast benzeri) buraya çağrılır
    } catch (e) {
      console.error('[MSpoolDetay] fbGonder hata:', e)
    } finally {
      setFbGonderiyor(false)
    }
  }

  function geriDon() {
    if (devre?.id) {
      navigate(`/devre/${devre.id}`)
    } else {
      navigate('/devreler')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (yukleniyor) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--txd)', fontSize: 14 }}>
        {tv('mob_sp_yukleniyor', 'Yükleniyor...')}
      </div>
    )
  }

  if (bulunamadi || !sp) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--bg)', color: 'var(--txd)', fontSize: 15, padding: 20 }}>
        <div>{tv('mob_sp_bulunamadi', 'Spool bulunamadı')}</div>
        <button
          onClick={() => navigate('/devreler')}
          style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--bor)', background: 'var(--sur)', color: 'var(--tx)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          {tv('mob_sp_devrelere_don', 'Devrelere dön')}
        </button>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', overflow: 'auto', background: 'var(--bg)', color: 'var(--tx)', position: 'relative' }}>
      <style>{styleBlock}</style>

      {/* Topbar */}
      <div className="msd-topbar">
        <button className="msd-back" onClick={geriDon} aria-label={tv('mob_sp_geri', 'Geri')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="msd-tblabel">{formatSpoolId(sp.spool_id) || sp.spool_no || tv('mob_sp_baslik', 'Spool Detay')}</div>
        <div className="msd-tbbadge" style={{ background: badge.bg, color: badge.tx }}>
          {tv(`mob_sp_durum_${aktifBasamak}`, badge.lbl)}
        </div>
      </div>

      {/* Stop banner */}
      {sp.durduruldu && (
        <div className="msd-stop">
          <span className="msd-stop-ic">⛔</span>
          <span className="msd-stop-tx">
            {sp.durdurma_sebebi || tv('mob_durum_durduruldu', 'Durduruldu')}
          </span>
        </div>
      )}

      {/* Fotoğraf carousel */}
      <div className="msd-foto">
        {fotolar.length === 0 ? (
          <div className="msd-foto-empty">
            <div className="msd-foto-empty-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <span>{tv('mob_sp_foto_yok', 'Fotoğraf eklenmemiş')}</span>
          </div>
        ) : (
          <>
            <img className="msd-foto-img" src={fotolar[fotoIdx]?.dosya_url} alt="" />
            {fotolar.length > 1 && (
              <div className="msd-foto-cnt">
                <button
                  className="msd-foto-arrow"
                  onClick={() => setFotoIdx((fotoIdx - 1 + fotolar.length) % fotolar.length)}
                  aria-label={tv('mob_sp_foto_onceki', 'Önceki')}
                >‹</button>
                <div className="msd-foto-num">{fotoIdx + 1}/{fotolar.length}</div>
                <button
                  className="msd-foto-arrow"
                  onClick={() => setFotoIdx((fotoIdx + 1) % fotolar.length)}
                  aria-label={tv('mob_sp_foto_sonraki', 'Sonraki')}
                >›</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Foto meta */}
      {fotolar.length > 0 && (
        <div className="msd-foto-meta">
          <span className="msd-foto-date">{formatTarihSaat(fotolar[fotoIdx]?.olusturma)}</span>
          <span className="msd-foto-user">{fotolar[fotoIdx]?.yukleyen_id || '—'}</span>
          <span className="msd-foto-stage">{fotolar[fotoIdx]?.islem_turu || '—'}</span>
        </div>
      )}

      {/* Tam marka bar */}
      <div className="msd-marka">
        <div className="msd-marka-tx">{marka}</div>
      </div>

      {/* Sekmeler */}
      <div className="msd-tabs">
        <button
          className={`msd-tab ${aktifTab === 'genel' ? 'msd-tab-on' : ''}`}
          onClick={() => setAktifTab('genel')}
        >{tv('mob_sp_tab_genel', 'Genel')}</button>
        <button
          className={`msd-tab ${aktifTab === 'malzeme' ? 'msd-tab-on' : ''}`}
          onClick={() => setAktifTab('malzeme')}
        >{tv('mob_sp_tab_malzeme', 'Malzeme')}</button>
        <button
          className={`msd-tab ${aktifTab === 'islem' ? 'msd-tab-on' : ''}`}
          onClick={() => setAktifTab('islem')}
        >{tv('mob_sp_tab_islem', 'İşlem Kay.')}</button>
      </div>

      {/* GENEL */}
      {aktifTab === 'genel' && (
        <div>
          <div className="msd-dg">
            <div className="msd-dg-t">{tv('mob_sp_spool_bilgi', 'Spool Bilgileri')}</div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_revizyon', 'Revizyon')}</span><span className="msd-v">{sp.rev || '—'}</span></div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_cap', 'Çap')}</span><span className="msd-v">{sp.dis_cap_mm ? `${sp.dis_cap_mm} mm` : '—'}</span></div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_et', 'Et Kalınlığı')}</span><span className="msd-v">{sp.et_kalinligi_mm ? `${sp.et_kalinligi_mm} mm` : '—'}</span></div>
            <div className="msd-r"><span className="msd-k">{tv('mob_stat_agirlik', 'Ağırlık')}</span><span className="msd-v">{sp.agirlik ? `${Number(sp.agirlik).toFixed(1)} kg` : '—'}</span></div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_malzeme_kal', 'Malzeme / Kalite')}</span><span className="msd-v">{[sp.malzeme, sp.kalite].filter(Boolean).join(' / ') || '—'}</span></div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_yuzey', 'Yüzey')}</span><span className="msd-v">{sp.yuzey || '—'}</span></div>
            <div className="msd-r">
              <span className="msd-k">{tv('mob_sp_alistirma', 'Alıştırma')}</span>
              <span className={`msd-alist ${alist?.cls || ''}`}>
                <span className="msd-alist-dot"></span>
                {alist?.txt || '—'}
              </span>
            </div>
          </div>

          <div className="msd-dg">
            <div className="msd-dg-t">
              <span>{tv('mob_sp_islem_dur', 'İşlem Durumu')}</span>
              <span className="msd-dg-tcount">
                {islemTamamSayac}/{islemAktifSayac || 4} {tv('mob_sp_tamam', 'tamam')}
              </span>
            </div>
            {[
              ['kesim',     'mob_sp_kesim',     'Kesim'],
              ['bukum',     'mob_sp_bukum',     'Büküm'],
              ['markalama', 'mob_sp_markalama', 'Markalama'],
              ['test',      'mob_sp_test',      'Test'],
            ].map(([k, ik, fb]) => {
              const r = nNRenkler(islemler[k].tamamlanan, islemler[k].toplam)
              return (
                <div className="msd-r" key={k}>
                  <span className="msd-k">{tv(ik, fb)}</span>
                  <span className={`msd-pill ${r.cls}`}>{r.txt}</span>
                </div>
              )
            })}
          </div>

          <div className="msd-dg">
            <div className="msd-dg-t">{tv('mob_sp_kk_sevk', 'KK & Sevkiyat')}</div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_kk', 'Kalite Kontrol')}</span><span className="msd-v">{kkBilgi?.davet_no || <span className="msd-v-muted">—</span>}</span></div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_kk_tarih', 'KK Tarihi')}</span><span className="msd-v">{kkBilgi ? formatTarih(kkBilgi.olusturma) : <span className="msd-v-muted">—</span>}</span></div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_sevk', 'Sevkiyat')}</span><span className="msd-v">{sevkBilgi?.sevk_no || <span className="msd-v-muted">—</span>}</span></div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_sevk_tarih', 'Sevk Tarihi')}</span><span className="msd-v">{sevkBilgi ? formatTarih(sevkBilgi.tarih) : <span className="msd-v-muted">—</span>}</span></div>
          </div>

          <div className="msd-dg">
            <div className="msd-dg-t">{tv('mob_sp_devre_bilgi', 'Devre Bilgisi')}</div>
            <div className="msd-r">
              <span className="msd-k">{tv('mob_sp_gemi_proje', 'Gemi / Proje')}</span>
              <span className="msd-v">{proje?.proje_no || '—'}</span>
            </div>
            <div className="msd-r" onClick={() => devre?.ad && setDevreModalAcik(true)} style={{ cursor: devre?.ad ? 'pointer' : 'default' }}>
              <span className="msd-k">{tv('mob_sp_devre', 'Devre')}</span>
              <span className="msd-v msd-v-trunc">{devre?.ad || devre?.devre_no || '—'}</span>
            </div>
            <div className="msd-r"><span className="msd-k">{tv('mob_sp_zone', 'Zone')}</span><span className="msd-v">{devre?.zone || '—'}</span></div>
          </div>

          <div className="msd-dg">
            <div className="msd-dg-t">{tv('mob_sp_belgeler', 'Belgeler')}</div>
            {belgeler.length === 0 ? (
              <div className="msd-belge-empty">{tv('mob_sp_belge_yok', 'Belge eklenmemiş')}</div>
            ) : belgeler.map((b, i) => (
              <div className="msd-belge" key={i} onClick={() => b.dosya_url && window.open(b.dosya_url, '_blank')}>
                <div className="msd-belge-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="msd-belge-body">
                  <div className="msd-belge-ad">{b.ad || tv('mob_sp_belge', 'Belge')}</div>
                  <div className="msd-belge-meta">{formatTarih(b.olusturma)}</div>
                </div>
                <div className="msd-belge-arr">›</div>
              </div>
            ))}
          </div>

          <div style={{ height: 100 }} />
        </div>
      )}

      {/* MALZEME */}
      {aktifTab === 'malzeme' && (
        <div>
          <div style={{ overflowX: 'auto', marginTop: 8, background: 'var(--sur)' }}>
            <table className="msd-malt">
              <thead>
                <tr>
                  <th>{tv('mob_sp_th_malzeme', 'Malzeme')}</th>
                  <th>{tv('mob_sp_th_kalite', 'Kalite')}</th>
                  <th>{tv('mob_sp_th_cap', 'Çap')}</th>
                  <th>{tv('mob_sp_th_et', 'Et')}</th>
                  <th>{tv('mob_sp_th_boy', 'Boy')}</th>
                </tr>
              </thead>
              <tbody>
                {malzemeler.length === 0 ? (
                  <tr><td colSpan={5} className="msd-malt-empty">{tv('mob_sp_malzeme_bos', 'Malzeme listesi boş')}</td></tr>
                ) : malzemeler.map((m, i) => (
                  <tr key={i}>
                    <td>{m.malzeme || '—'}</td>
                    <td>{m.kalite || '—'}</td>
                    <td>{m.dis_cap_mm ? `${m.dis_cap_mm}` : '—'}</td>
                    <td>{m.et_mm ? `${m.et_mm}` : '—'}</td>
                    <td>{m.boy_mm ? `${m.boy_mm}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {malzemeler.length > 0 && (
            <div className="msd-mfoot">
              {malzemeler.length} {tv('mob_sp_kalem_salt_okur', 'kalem · salt-okur (ölçüler mm)')}
            </div>
          )}
          <div style={{ height: 100 }} />
        </div>
      )}

      {/* İŞLEM KAY. */}
      {aktifTab === 'islem' && (
        <div>
          <div className="msd-log">
            {loglar.length === 0 ? (
              <div className="msd-log-empty">{tv('mob_sp_islem_yok', 'İşlem kaydı yok')}</div>
            ) : loglar.map((l, i) => {
              const renkMap = { insert: 'var(--gr)', update: 'var(--ac)', delete: 'var(--re)' }
              return (
                <div className="msd-logr" key={i}>
                  <div className="msd-logd" style={{ background: renkMap[l.islem] || 'var(--txd)' }}></div>
                  <div className="msd-logb">
                    <div className="msd-logt">{(l.katman || '—')} · {(l.islem || '—')}</div>
                    <div className="msd-logm">{formatSure(l.olusturma)}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ height: 100 }} />
        </div>
      )}

      {/* FAB Geri Bildirim */}
      <button className="msd-fab" onClick={() => setFbAcik(true)} aria-label={tv('mob_sp_geri_bildirim', 'Geri Bildirim')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </button>

      {/* Geri Bildirim modal */}
      {fbAcik && (
        <div className="msd-fb-modal">
          <div className="msd-fb-overlay" onClick={() => !fbGonderiyor && setFbAcik(false)}></div>
          <div className="msd-fb-sheet">
            <div className="msd-fb-handle"></div>
            <div className="msd-fb-title">{tv('mob_sp_geri_bildirim', 'Geri Bildirim')}</div>
            <div className="msd-fb-cats">
              <button className={`msd-fb-cat ${fbKat === 'hata' ? 'msd-fb-cat-on' : ''}`} onClick={() => setFbKat('hata')}>
                🐛 {tv('mob_sp_fb_hata', 'Hata')}
              </button>
              <button className={`msd-fb-cat ${fbKat === 'eksik' ? 'msd-fb-cat-on' : ''}`} onClick={() => setFbKat('eksik')}>
                📋 {tv('mob_sp_fb_eksik', 'Eksik')}
              </button>
              <button className={`msd-fb-cat ${fbKat === 'fikir' ? 'msd-fb-cat-on' : ''}`} onClick={() => setFbKat('fikir')}>
                💡 {tv('mob_sp_fb_fikir', 'Fikir')}
              </button>
            </div>
            <textarea
              className="msd-fb-textarea"
              placeholder={tv('mob_sp_fb_placeholder', 'Ne gördünüz? Ne olmasını bekliyordunuz?')}
              value={fbNot}
              onChange={(e) => setFbNot(e.target.value)}
            />
            <div className="msd-fb-foto-row">
              <button className="msd-fb-foto-btn" onClick={fbFotoSec}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {tv('mob_sp_fb_foto', 'Fotoğraf ekle')}
              </button>
              {fbFotoData && <img className="msd-fb-thumb" src={fbFotoData} alt="" />}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fotoInputRef}
                onChange={fbFotoYukle}
              />
            </div>
            <button
              className="msd-fb-send"
              onClick={fbGonder}
              disabled={!fbNot.trim() || fbGonderiyor}
            >
              {fbGonderiyor ? tv('mob_sp_fb_gonderiliyor', 'Gönderiliyor...') : tv('mob_sp_fb_gonder', 'Gönder')}
            </button>
          </div>
        </div>
      )}

      {/* Devre adı modal (uzun ad) */}
      {devreModalAcik && (
        <div className="msd-fb-modal" onClick={() => setDevreModalAcik(false)}>
          <div className="msd-fb-overlay"></div>
          <div className="msd-fb-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="msd-fb-handle"></div>
            <div className="msd-fb-title">{tv('mob_sp_devre', 'Devre')}</div>
            <div style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--tx)', marginBottom: 16, wordBreak: 'break-word' }}>
              {devre?.ad || devre?.devre_no || '—'}
            </div>
            <button className="msd-fb-send" onClick={() => setDevreModalAcik(false)}>
              {tv('mob_sp_kapat', 'Kapat')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Stil bloğu ─────────────────────────────────────────────────────────────
// CSS variable cascade güvenliği için sekme rengi sabit hex; geri kalanı --xxx kullanır.
// Light/Dark tema için [data-theme=...] selector'ları index.css'te çözülür.

const styleBlock = `
.msd-topbar{position:sticky;top:0;height:54px;background:var(--sur);border-bottom:1px solid var(--bor);display:flex;align-items:center;padding:0 14px;gap:10px;z-index:50;}
.msd-back{width:36px;height:36px;border-radius:9px;background:var(--sur2);border:1px solid var(--bor);display:flex;align-items:center;justify-content:center;color:var(--tx);flex-shrink:0;cursor:pointer;padding:0;}
.msd-back svg{width:18px;height:18px;}
.msd-tblabel{font-size:15px;font-weight:500;color:var(--tx);flex:1;}
.msd-tbbadge{font-size:12px;font-weight:700;padding:4px 11px;border-radius:20px;flex-shrink:0;letter-spacing:.3px;}

.msd-stop{background:rgba(229,62,62,.1);border-bottom:2px solid var(--re);padding:10px 16px;display:flex;align-items:center;gap:10px;}
.msd-stop-ic{font-size:18px;}
.msd-stop-tx{font-size:14px;font-weight:600;color:var(--re);line-height:1.4;}

.msd-foto{position:relative;background:#0e0d0c;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;}
.msd-foto-img{width:100%;height:100%;object-fit:cover;display:block;}
.msd-foto-empty{display:flex;flex-direction:column;align-items:center;gap:8px;color:#7a7872;font-size:14px;}
.msd-foto-empty-ic svg{width:40px;height:40px;}
.msd-foto-cnt{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;align-items:center;}
.msd-foto-arrow{width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.55);border:none;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;cursor:pointer;}
.msd-foto-num{font-size:13px;font-weight:600;color:#fff;background:rgba(0,0,0,.55);padding:4px 11px;border-radius:20px;}
.msd-foto-meta{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;background:var(--sur2);border-bottom:1px solid var(--bor);font-size:13px;}
.msd-foto-date{font-weight:600;color:var(--tx);}
.msd-foto-user{color:var(--txm);}
.msd-foto-stage{font-weight:600;color:var(--ac);}

.msd-marka{padding:13px 14px;border-bottom:1px solid var(--bor);text-align:center;background:var(--sur);}
.msd-marka-tx{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;color:var(--ac);letter-spacing:.5px;line-height:1.1;word-break:break-all;}

.msd-tabs{display:flex;background:var(--sur2);border-bottom:1px solid var(--bor);position:sticky;top:54px;z-index:40;}
.msd-tab{flex:1;padding:13px 4px;font-size:15px;font-weight:600;color:#1a1817;border:none;border-bottom:3px solid transparent;background:none;cursor:pointer;font-family:inherit;white-space:nowrap;margin-bottom:-1px;}
[data-theme=dark] .msd-tab{color:#eceae3;}
.msd-tab-on{color:var(--ac) !important;border-bottom-color:var(--ac);font-weight:700;font-size:16px;background:var(--sur);}

.msd-dg{background:var(--sur);margin-top:8px;}
.msd-dg-t{font-size:13px;font-weight:700;color:var(--txd);text-transform:uppercase;letter-spacing:.6px;padding:11px 16px 7px;border-bottom:1px solid var(--bor);display:flex;justify-content:space-between;align-items:center;}
.msd-dg-tcount{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;color:var(--tx);letter-spacing:0;text-transform:none;}
.msd-r{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--bor);gap:12px;}
.msd-r:last-child{border-bottom:none;}
.msd-k{font-size:14px;color:var(--txd);flex-shrink:0;}
.msd-v{font-size:15px;font-weight:500;color:var(--tx);text-align:right;}
.msd-v-muted{color:var(--txm);}
.msd-v-trunc{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%;}

.msd-pill{display:inline-block;padding:4px 11px;border-radius:7px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;letter-spacing:.4px;line-height:1.1;min-width:42px;text-align:center;}
.msd-pill-red{background:rgba(229,62,62,.14);color:#b91c1c;}
.msd-pill-yellow{background:rgba(217,119,6,.20);color:#92400e;}
.msd-pill-green{background:rgba(22,163,110,.16);color:#15803d;}
.msd-pill-none{background:transparent;color:var(--txm);min-width:auto;font-family:inherit;font-size:14px;font-weight:500;}
[data-theme=dark] .msd-pill-red{background:rgba(248,113,113,.20);color:#fca5a5;}
[data-theme=dark] .msd-pill-yellow{background:rgba(252,211,77,.22);color:#fde68a;}
[data-theme=dark] .msd-pill-green{background:rgba(74,222,128,.20);color:#86efac;}

.msd-alist{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:13px;font-weight:700;}
.msd-alist-dot{width:7px;height:7px;border-radius:50%;background:currentColor;}
.msd-alist-tam{background:rgba(22,163,110,.14);color:var(--gr);}
.msd-alist-kismi{background:rgba(217,119,6,.18);color:var(--warn);}
.msd-alist-yok{background:rgba(229,62,62,.12);color:var(--re);}
[data-theme=dark] .msd-alist-tam{background:rgba(74,222,128,.18);color:#86efac;}
[data-theme=dark] .msd-alist-kismi{background:rgba(252,211,77,.20);color:#fde68a;}
[data-theme=dark] .msd-alist-yok{background:rgba(248,113,113,.18);color:#fca5a5;}

.msd-belge{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--bor);cursor:pointer;}
.msd-belge:last-child{border-bottom:none;}
.msd-belge:active{opacity:.75;}
.msd-belge-ic{width:40px;height:40px;border-radius:9px;background:rgba(45,142,255,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--ac);}
.msd-belge-ic svg{width:20px;height:20px;}
.msd-belge-body{flex:1;min-width:0;}
.msd-belge-ad{font-size:14px;font-weight:600;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.msd-belge-meta{font-size:13px;color:var(--txm);margin-top:3px;}
.msd-belge-arr{color:var(--txm);font-size:18px;flex-shrink:0;}
.msd-belge-empty{padding:16px;font-size:14px;color:var(--txm);text-align:center;}

.msd-malt{width:100%;border-collapse:collapse;}
.msd-malt th{padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:var(--txd);text-transform:uppercase;letter-spacing:.4px;border-bottom:1px solid var(--bor);background:var(--sur2);}
.msd-malt td{padding:11px 12px;border-bottom:1px solid var(--bor);color:var(--tx);font-size:14px;}
.msd-malt tr:nth-child(even) td{background:rgba(0,0,0,.025);}
[data-theme=dark] .msd-malt tr:nth-child(even) td{background:rgba(255,255,255,.025);}
.msd-malt tr:last-child td{border-bottom:none;}
.msd-malt-empty{text-align:center;padding:20px;color:var(--txm);font-size:14px;}
.msd-mfoot{padding:12px 16px;font-size:13px;color:var(--txm);background:var(--sur);border-top:1px solid var(--bor);}

.msd-log{background:var(--sur);margin-top:8px;}
.msd-logr{display:flex;align-items:flex-start;gap:11px;padding:11px 16px;border-bottom:1px solid var(--bor);}
.msd-logr:last-child{border-bottom:none;}
.msd-logd{width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0;}
.msd-logb{flex:1;}
.msd-logt{font-size:14px;font-weight:600;color:var(--tx);}
.msd-logm{font-size:13px;color:var(--txm);margin-top:3px;}
.msd-log-empty{padding:24px;text-align:center;font-size:14px;color:var(--txm);}

.msd-fab{position:fixed;bottom:76px;right:16px;width:52px;height:52px;border-radius:15px;background:var(--ac);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;z-index:60;box-shadow:0 4px 16px rgba(45,142,255,.4);}
.msd-fab svg{width:22px;height:22px;}

.msd-fb-modal{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;justify-content:flex-end;}
.msd-fb-overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);}
.msd-fb-sheet{position:relative;background:var(--sur);border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));}
.msd-fb-handle{width:36px;height:4px;border-radius:2px;background:var(--bor);margin:0 auto 16px;}
.msd-fb-title{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:var(--tx);margin-bottom:14px;}
.msd-fb-cats{display:flex;gap:8px;margin-bottom:12px;}
.msd-fb-cat{flex:1;padding:9px;border-radius:10px;border:1px solid var(--bor);background:var(--sur2);font-size:13px;font-weight:600;color:var(--txm);text-align:center;cursor:pointer;font-family:inherit;}
.msd-fb-cat-on{border-color:var(--ac);background:rgba(45,142,255,.08);color:var(--ac);}
.msd-fb-textarea{width:100%;background:var(--sur2);border:1px solid var(--bor);border-radius:12px;padding:12px;font-size:15px;color:var(--tx);font-family:inherit;resize:none;outline:none;min-height:84px;margin-bottom:10px;box-sizing:border-box;}
.msd-fb-textarea:focus{border-color:var(--ac);}
.msd-fb-foto-row{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
.msd-fb-foto-btn{display:flex;align-items:center;gap:6px;padding:9px 14px;border-radius:10px;border:1px dashed var(--bor);background:var(--sur2);font-size:13px;font-weight:600;color:var(--txd);cursor:pointer;font-family:inherit;}
.msd-fb-thumb{width:48px;height:48px;border-radius:8px;object-fit:cover;}
.msd-fb-send{width:100%;height:48px;border-radius:12px;background:var(--ac);border:none;color:#fff;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer;}
.msd-fb-send:disabled{opacity:.5;cursor:not-allowed;}
`
