import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

const ARES_LOGO_SVG = '<svg class="giris-logo ares-logo" viewBox="0 0 381 100" aria-label="AresPipe"><defs><linearGradient id="sagPipe" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#1E5FD0"/><stop offset=".5" stop-color="#2D6CDF"/><stop offset="1" stop-color="#9CC4FF"/></linearGradient><linearGradient id="sagScan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D6CDF" stop-opacity="0"/><stop offset=".5" stop-color="#2D6CDF" stop-opacity=".95"/><stop offset="1" stop-color="#2D6CDF" stop-opacity="0"/></linearGradient></defs><g transform="translate(8,8)"><rect x="0" y="36.5" width="84" height="11" rx="5" fill="#2D8EFF" opacity="0.14"/><rect x="0" y="40.2" width="84" height="3.6" rx="1.8" fill="url(#sagPipe)"/><circle cx="42" cy="42" r="30" fill="none" stroke="var(--tx)" stroke-width="13"/><rect x="36" y="36" width="12" height="12" rx="3" fill="#34C46F"/><g fill="var(--bg)"><circle cx="63.2" cy="20.8" r="4.2"/><circle cx="20.8" cy="20.8" r="4.2"/><circle cx="20.8" cy="63.2" r="4.2"/><circle cx="63.2" cy="63.2" r="4.2"/></g><g transform="translate(0,120)"><rect x="0" y="-2" width="84" height="12" rx="6" fill="url(#sagScan)"/><rect x="0" y="2.4" width="84" height="2.6" rx="1.3" fill="#EAF2FF"/><animateTransform class="ares-tara-anim" attributeName="transform" type="translate" begin="indefinite" dur="1.3s" values="0 -16;0 90" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" fill="remove" repeatCount="1"/></g></g><g transform="translate(106,79) scale(0.0828,-0.0828)"><g fill="var(--tx)"><path d="M325 11 309 107Q309 112 303 112H176Q170 112 170 107L154 11Q153 0 141 0H24Q11 0 14 13L161 689Q163 700 174 700H309Q320 700 322 689L468 13L469 9Q469 0 458 0H338Q326 0 325 11ZM194 221H284Q289 221 288 226L241 499Q240 502 238 502Q236 502 235 499L190 226Q190 221 194 221Z"/><path transform="translate(482,0)" d="M310 510Q318 505 316 495L297 378Q296 367 283 370Q272 374 256 374Q241 374 230 370Q207 366 193 342.5Q179 319 179 288V13Q179 8 175.5 4.5Q172 1 167 1H50Q45 1 41.5 4.5Q38 8 38 13V502Q38 507 41.5 510.5Q45 514 50 514H167Q172 514 175.5 510.5Q179 507 179 502V463Q179 459 180.5 458.5Q182 458 184 461Q211 520 268 520Q295 520 310 510Z"/><path transform="translate(806,0)" d="M397 213H177Q172 213 172 208V171Q172 146 185.5 129.5Q199 113 220 113Q239 113 251 125.5Q263 138 267 157Q270 167 280 167L395 161Q400 161 403.5 157.5Q407 154 406 148Q399 71 352.5 31.5Q306 -8 220 -8Q131 -8 81 36.5Q31 81 31 160V354Q31 430 81.5 476Q132 522 220 522Q308 522 358.5 476Q409 430 409 354V225Q409 220 405.5 216.5Q402 213 397 213ZM172 344V305Q172 300 177 300H263Q268 300 268 305V344Q268 369 254.5 385Q241 401 220 401Q199 401 185.5 385Q172 369 172 344Z"/><path transform="translate(1242,0)" d="M24 142V149Q24 154 27.5 157.5Q31 161 36 161H146Q151 161 154.5 157.5Q158 154 158 149V146Q158 125 173 111.5Q188 98 210 98Q230 98 241.5 109.5Q253 121 253 139Q253 161 234 173.5Q215 186 191.5 194.5Q168 203 159 206Q104 226 66.5 261.5Q29 297 29 364Q29 437 77 479Q125 521 205 521Q288 521 336.5 477Q385 433 385 358Q385 353 381.5 349.5Q378 346 373 346H266Q261 346 257.5 349.5Q254 353 254 358V366Q254 386 241.5 398.5Q229 411 209 411Q188 411 176 397.5Q164 384 164 366Q164 342 184.5 328.5Q205 315 247 299Q290 283 320.5 266.5Q351 250 373 219.5Q395 189 395 143Q395 74 344.5 33.5Q294 -7 210 -7Q125 -7 74.5 33.5Q24 74 24 142Z"/></g><g fill="var(--ac)"><path transform="translate(1654,0)" d="M445 488Q445 395 395 339Q345 283 264 283H189Q184 283 184 278V12Q184 7 180.5 3.5Q177 0 172 0H55Q50 0 46.5 3.5Q43 7 43 12V689Q43 694 46.5 697.5Q50 701 55 701H257Q312 701 355 674Q398 647 421.5 598.5Q445 550 445 488ZM304 485Q304 529 284.5 554Q265 579 233 579H189Q184 579 184 574V398Q184 393 189 393H233Q265 393 284.5 417.5Q304 442 304 485Z"/><path transform="translate(2119,0)" d="M30 651Q30 686 52 708Q74 730 109 730Q144 730 165.5 708Q187 686 187 651Q187 617 165 594.5Q143 572 109 572Q75 572 52.5 594.5Q30 617 30 651ZM40 12V502Q40 507 43.5 510.5Q47 514 52 514H169Q174 514 177.5 510.5Q181 507 181 502V12Q181 7 177.5 3.5Q174 0 169 0H52Q47 0 43.5 3.5Q40 7 40 12Z"/><path transform="translate(2338,0)" d="M418 355V160Q418 79 382 35.5Q346 -8 278 -8Q256 -8 232 0.5Q208 9 188 31Q186 34 184 33Q182 32 182 29V-174Q182 -179 178.5 -182.5Q175 -186 170 -186H53Q48 -186 44.5 -182.5Q41 -179 41 -174V502Q41 507 44.5 510.5Q48 514 53 514H170Q175 514 178.5 510.5Q182 507 182 502V486Q182 484 184 484Q188 484 192 489Q226 522 278 522Q347 522 382.5 477.5Q418 433 418 355ZM229 402Q208 402 195 386Q182 370 182 344V171Q182 145 195 129Q208 113 229 113Q251 113 264 129Q277 145 277 171V344Q277 370 264 386Q251 402 229 402Z"/><path transform="translate(2786,0)" d="M397 213H177Q172 213 172 208V171Q172 146 185.5 129.5Q199 113 220 113Q239 113 251 125.5Q263 138 267 157Q270 167 280 167L395 161Q400 161 403.5 157.5Q407 154 406 148Q399 71 352.5 31.5Q306 -8 220 -8Q131 -8 81 36.5Q31 81 31 160V354Q31 430 81.5 476Q132 522 220 522Q308 522 358.5 476Q409 430 409 354V225Q409 220 405.5 216.5Q402 213 397 213ZM172 344V305Q172 300 177 300H263Q268 300 268 305V344Q268 369 254.5 385Q241 401 220 401Q199 401 185.5 385Q172 369 172 344Z"/></g></g></svg>';

export default function Giris() {
  const { tv, dil, setDil, mevcutDiller } = useT()
  const logoRef = useRef(null)

  const [email, setEmail]             = useState('')
  const [sifre, setSifre]             = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor]   = useState(false)
  const [hata, setHata]               = useState('')
  const [tema, setTema]               = useState(() => localStorage.getItem('ares_theme') || 'light-anthracite')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('ares_theme', tema)
  }, [tema])

  // Logo tarama animasyonu — acilista bir kez tetiklenir (web kalibi)
  useEffect(() => {
    const t = setTimeout(() => {
      const a = logoRef.current?.querySelector('.ares-tara-anim')
      if (a && a.beginElement) { try { a.beginElement() } catch (e) {} }
    }, 250)
    return () => clearTimeout(t)
  }, [])

  async function girisYap(e) {
    e.preventDefault()
    setHata('')
    if (!email) { setHata(tv('m_gr_hata_email_bos')); return }
    if (!sifre) { setHata(tv('m_gr_hata_sifre_bos')); return }

    setYukleniyor(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre })
    setYukleniyor(false)

    if (error) {
      if (error.message.includes('Invalid login'))            setHata(tv('m_gr_hata_kimlik'))
      else if (error.message.includes('Email not confirmed')) setHata(tv('m_gr_hata_dogrulama'))
      else if (error.message.includes('Too many requests'))   setHata(tv('m_gr_hata_cok_deneme'))
      else setHata(error.message)
    }
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=Barlow:wght@400;600;700&display=swap" />

      {/* Üst */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px 24px' }}>

        <div
          ref={logoRef}
          className="giris-logo-wrap"
          dangerouslySetInnerHTML={{ __html: ARES_LOGO_SVG }}
        />

        <form onSubmit={girisYap} style={{ width:'100%', maxWidth:380 }}>

          <div style={{ marginBottom:14 }}>
            <label style={s.etiket}>{tv('m_gr_email_lbl')}</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder={tv('m_gr_email_ph')} autoComplete="email" inputMode="email" autoCapitalize="none"
              style={s.input}
              onFocus={e=>e.target.style.borderColor='var(--ac)'}
              onBlur={e=>e.target.style.borderColor='var(--bor)'} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={s.etiket}>{tv('m_gr_sifre_lbl')}</label>
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
            {yukleniyor ? tv('m_gr_btn_yukleniyor') : tv('m_gr_btn_giris')}
          </button>

        </form>
      </div>

      {/* Alt: tema + dil */}
      <div style={{ padding:'16px 24px', paddingBottom:'max(24px, env(safe-area-inset-bottom))', display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        <div style={s.toggleKap}>
          {[['light-anthracite','☀️'],['dark','🌙']].map(([tem,ikon])=>(
            <button key={tem} onClick={()=>setTema(tem)} style={{ ...s.toggleBtn, ...(tema===tem?s.toggleAktif:{}) }}>{ikon}</button>
          ))}
        </div>

        <div style={s.toggleKap}>
          {mevcutDiller.map(d=>(
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
