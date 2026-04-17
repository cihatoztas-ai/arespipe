import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DILLER = ['tr', 'en', 'ar']

export default function Giris() {
  const [email, setEmail]             = useState('')
  const [sifre, setSifre]             = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor]   = useState(false)
  const [hata, setHata]               = useState('')
  const [tema, setTema]               = useState(() => localStorage.getItem('ares_theme') || 'light-anthracite')
  const [dil, setDil]                 = useState(() => localStorage.getItem('ares_lang') || 'tr')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('ares_theme', tema)
  }, [tema])

  useEffect(() => {
    document.documentElement.setAttribute('lang', dil)
    document.documentElement.setAttribute('dir', dil === 'ar' ? 'rtl' : 'ltr')
    localStorage.setItem('ares_lang', dil)
  }, [dil])

  async function girisYap(e) {
    e.preventDefault()
    setHata('')
    if (!email) { setHata('E-posta boş bırakılamaz.'); return }
    if (!sifre) { setHata('Şifre boş bırakılamaz.'); return }

    setYukleniyor(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre })
    setYukleniyor(false)

    if (error) {
      if (error.message.includes('Invalid login'))            setHata('E-posta veya şifre hatalı.')
      else if (error.message.includes('Email not confirmed')) setHata('E-posta adresiniz doğrulanmamış.')
      else if (error.message.includes('Too many requests'))   setHata('Çok fazla deneme. Lütfen bekleyin.')
      else setHata(error.message)
    }
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=Barlow:wght@400;600;700&display=swap" />

      {/* Üst */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px 24px' }}>

        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:52, fontWeight:900, color:'var(--ac)', letterSpacing:-2, lineHeight:1, marginBottom:6 }}>AP</div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--txd)', textTransform:'uppercase', letterSpacing:2, marginBottom:48 }}>AresPipe</div>

        <form onSubmit={girisYap} style={{ width:'100%', maxWidth:380 }}>

          <div style={{ marginBottom:14 }}>
            <label style={s.etiket}>E-posta</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="ornek@firma.com" autoComplete="email" inputMode="email" autoCapitalize="none"
              style={s.input}
              onFocus={e=>e.target.style.borderColor='var(--ac)'}
              onBlur={e=>e.target.style.borderColor='var(--bor)'} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={s.etiket}>Şifre</label>
            <div style={{ position:'relative' }}>
              <input type={sifreGoster?'text':'password'} value={sifre} onChange={e=>setSifre(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                style={{ ...s.input, paddingRight:46 }}
                onFocus={e=>e.target.style.borderColor='var(--ac)'}
                onBlur={e=>e.target.style.borderColor='var(--bor)'} />
              <button type="button" onClick={()=>setSifreGoster(v=>!v)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--txd)', cursor:'pointer', opacity:sifreGoster?1:0.5, padding:4, display:'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          {hata && (
            <div style={{ marginBottom:14, padding:'12px 14px', background:'rgba(229,62,62,.1)', border:'1px solid rgba(229,62,62,.3)', borderRadius:12, fontSize:14, color:'var(--re)', lineHeight:1.5 }}>
              {hata}
            </div>
          )}

          <button type="submit" disabled={yukleniyor}
            style={{ width:'100%', height:56, borderRadius:16, background:yukleniyor?'var(--bor)':'var(--ac)', border:'none', color:'#fff', fontSize:17, fontWeight:700, fontFamily:"'Barlow',sans-serif", cursor:yukleniyor?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:8 }}>
            {yukleniyor && <span style={{ width:20, height:20, border:'2.5px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} />}
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

        </form>
      </div>

      {/* Alt: tema + dil */}
      <div style={{ padding:'16px 24px', paddingBottom:'max(24px, env(safe-area-inset-bottom))', display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        <div style={s.toggleKap}>
          {[['light-anthracite','☀️'],['dark','🌙']].map(([t,ikon])=>(
            <button key={t} onClick={()=>setTema(t)} style={{ ...s.toggleBtn, ...(tema===t?s.toggleAktif:{}) }}>{ikon}</button>
          ))}
        </div>

        <div style={s.toggleKap}>
          {DILLER.map(d=>(
            <button key={d} onClick={()=>setDil(d)} style={{ ...s.toggleBtn, fontSize:12, fontWeight:700, padding:'6px 10px', ...(dil===d?s.toggleAktif:{}) }}>{d.toUpperCase()}</button>
          ))}
        </div>

      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const s = {
  etiket: { display:'block', fontSize:11, fontWeight:700, color:'var(--txd)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:7 },
  input:  { width:'100%', height:52, padding:'0 16px', borderRadius:14, border:'1.5px solid var(--bor)', background:'var(--sur)', color:'var(--tx)', fontSize:16, outline:'none', transition:'border-color .15s', WebkitAppearance:'none', boxSizing:'border-box', fontFamily:"'Barlow',sans-serif" },
  toggleKap:  { display:'flex', background:'var(--sur2)', border:'1px solid var(--bor)', borderRadius:8, overflow:'hidden' },
  toggleBtn:  { padding:'6px 10px', fontSize:16, background:'none', border:'none', cursor:'pointer', color:'var(--txd)', transition:'all .15s' },
  toggleAktif:{ background:'var(--ac)', color:'#fff' },
}
