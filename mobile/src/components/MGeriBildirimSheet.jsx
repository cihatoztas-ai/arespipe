// mobile/src/components/MGeriBildirimSheet.jsx
//
// 60. oturum — MSpoolDetay'daki FAB + bottom-sheet'in bağımsız component'e taşınmış hali.
// MDrawer'dan açılır, ileride başka sayfalardan da çağrılabilir.
//
// Props:
//   acik: boolean       — sheet görünür mü
//   kapat: () => void   — sheet'i kapatır
//
// useLocation() ile sayfa_url otomatik alınır.
// CSS prefix: mfb-* (önceki msd-fb-* MSpoolDetay'a özeldi)
// i18n prefix: mob_fb_* (önceki mob_sp_fb_* yeniden adlandırıldı — cross-cutting feature)

import { useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { getTenantId } from '../lib/auth'

export default function MGeriBildirimSheet({ acik, kapat }) {
  const { tv } = useT()
  const location = useLocation()

  const [kat, setKat] = useState('hata')
  const [not_, setNot] = useState('')
  const [fotoData, setFotoData] = useState(null)
  const [gonderiyor, setGonderiyor] = useState(false)
  const fotoInputRef = useRef(null)

  if (!acik) return null

  function fotoSec() {
    fotoInputRef.current?.click()
  }

  function fotoYukle(ev) {
    const f = ev.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (e) => setFotoData(e.target.result)
    reader.readAsDataURL(f)
  }

  function kapatVeReset() {
    kapat()
    setNot('')
    setFotoData(null)
    setKat('hata')
  }

  async function gonder() {
    const not = not_.trim()
    if (!not || gonderiyor) return
    setGonderiyor(true)
    try {
      const tid = await getTenantId()
      const { data: { user } } = await supabase.auth.getUser()

      let foto_url = null
      if (fotoData) {
        try {
          const blob = await fetch(fotoData).then(r => r.blob())
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
            foto_url = fotoData
          }
        } catch {
          foto_url = fotoData
        }
      }

      await supabase.from('feedback_kayitlari').insert({
        tenant_id: tid,
        kullanici_id: user?.id || null,
        sayfa_url: location.pathname,
        kategori: kat,
        not_: not,
        fotograf_url: foto_url,
      })

      kapatVeReset()
    } catch (e) {
      console.error('[MGeriBildirimSheet] gonder hata:', e)
    } finally {
      setGonderiyor(false)
    }
  }

  return (
    <div className="mfb-modal">
      <div className="mfb-overlay" onClick={() => !gonderiyor && kapatVeReset()}></div>
      <div className="mfb-sheet">
        <div className="mfb-handle"></div>
        <div className="mfb-title">{tv('mob_fb_baslik', 'Geri Bildirim')}</div>

        <div className="mfb-cats">
          <button
            className={`mfb-cat ${kat === 'hata' ? 'mfb-cat-on' : ''}`}
            onClick={() => setKat('hata')}
          >
            🐛 {tv('mob_fb_hata', 'Hata')}
          </button>
          <button
            className={`mfb-cat ${kat === 'eksik' ? 'mfb-cat-on' : ''}`}
            onClick={() => setKat('eksik')}
          >
            📋 {tv('mob_fb_eksik', 'Eksik')}
          </button>
          <button
            className={`mfb-cat ${kat === 'fikir' ? 'mfb-cat-on' : ''}`}
            onClick={() => setKat('fikir')}
          >
            💡 {tv('mob_fb_fikir', 'Fikir')}
          </button>
        </div>

        <textarea
          className="mfb-textarea"
          placeholder={tv('mob_fb_placeholder', 'Ne gördünüz? Ne olmasını bekliyordunuz?')}
          value={not_}
          onChange={(e) => setNot(e.target.value)}
        />

        <div className="mfb-foto-row">
          <button className="mfb-foto-btn" onClick={fotoSec}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {tv('mob_fb_foto', 'Fotoğraf ekle')}
          </button>
          {fotoData && <img className="mfb-thumb" src={fotoData} alt="" />}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fotoInputRef}
            onChange={fotoYukle}
          />
        </div>

        <button
          className="mfb-send"
          onClick={gonder}
          disabled={!not_.trim() || gonderiyor}
        >
          {gonderiyor
            ? tv('mob_fb_gonderiliyor', 'Gönderiliyor...')
            : tv('mob_fb_gonder', 'Gönder')}
        </button>
      </div>

      <style>{styleBlock}</style>
    </div>
  )
}

const styleBlock = `
.mfb-modal{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;justify-content:flex-end;}
.mfb-overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);}
.mfb-sheet{position:relative;background:var(--sur);border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));}
.mfb-handle{width:36px;height:4px;border-radius:2px;background:var(--bor);margin:0 auto 16px;}
.mfb-title{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:var(--tx);margin-bottom:14px;}
.mfb-cats{display:flex;gap:8px;margin-bottom:12px;}
.mfb-cat{flex:1;padding:9px;border-radius:10px;border:1px solid var(--bor);background:var(--sur2);font-size:13px;font-weight:600;color:var(--txm);text-align:center;cursor:pointer;font-family:inherit;}
.mfb-cat-on{border-color:var(--ac);background:rgba(45,142,255,.08);color:var(--ac);}
.mfb-textarea{width:100%;background:var(--sur2);border:1px solid var(--bor);border-radius:12px;padding:12px;font-size:15px;color:var(--tx);font-family:inherit;resize:none;outline:none;min-height:84px;margin-bottom:10px;box-sizing:border-box;}
.mfb-textarea:focus{border-color:var(--ac);}
.mfb-foto-row{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
.mfb-foto-btn{display:flex;align-items:center;gap:6px;padding:9px 14px;border-radius:10px;border:1px dashed var(--bor);background:var(--sur2);font-size:13px;font-weight:600;color:var(--txd);cursor:pointer;font-family:inherit;}
.mfb-thumb{width:48px;height:48px;border-radius:8px;object-fit:cover;}
.mfb-send{width:100%;height:48px;border-radius:12px;background:var(--ac);border:none;color:#fff;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer;}
.mfb-send:disabled{opacity:.5;cursor:not-allowed;}
`
