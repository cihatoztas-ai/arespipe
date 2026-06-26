import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { I18nProvider } from './lib/i18n'

import MGiris from './screens/MGiris'
import MAnasayfa from './screens/MAnasayfa'
import MIslemler from './screens/MIslemler'
import MSpoolDetay from './screens/MSpoolDetay'
import MDevreDetay from './screens/MDevreDetay'
import MDevreler from './screens/MDevreler'
import MQRTara from './screens/MQRTara'
import MIsBaslat from './screens/MIsBaslat'
import MUygulamalar from './screens/MUygulamalar'

export default function App() {
  const [oturum, setOturum] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setOturum(session)
      setYukleniyor(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setOturum(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (yukleniyor) {
    return (
      <div style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--txd)',
        fontSize: 14,
      }}>
        •••
      </div>
    )
  }

  return (
    <I18nProvider>
      <Routes>
        <Route path="/giris" element={!oturum ? <MGiris /> : <Navigate to="/" />} />
        <Route path="/" element={oturum ? <MAnasayfa /> : <Navigate to="/giris" />} />
        <Route path="/islemler" element={oturum ? <MIslemlerSayfasi /> : <Navigate to="/giris" />} />
        <Route path="/spool/:id" element={oturum ? <MSpoolDetay /> : <Navigate to="/giris" />} />
        <Route path="/devre/:id" element={oturum ? <MDevreDetay /> : <Navigate to="/giris" />} />
        <Route path="/devreler" element={oturum ? <MDevreler /> : <Navigate to="/giris" />} />
        <Route path="/qr" element={oturum ? <MQRTara /> : <Navigate to="/giris" />} />
        <Route path="/is-baslat" element={oturum ? <MIsBaslat /> : <Navigate to="/giris" />} />
        <Route path="/uygulamalar" element={oturum ? <MUygulamalar /> : <Navigate to="/giris" />} />
        {/* 67. oturum: bottom nav loop'u önlemek için placeholder rotalar */}
        <Route path="/ara" element={oturum ? <MYakinda baslik="Ara" /> : <Navigate to="/giris" />} />
        <Route path="/bildirim" element={oturum ? <MYakinda baslik="Bildirim" /> : <Navigate to="/giris" />} />
        <Route path="*" element={<Navigate to={oturum ? '/' : '/giris'} />} />
      </Routes>
    </I18nProvider>
  )
}

// /islemler rotası için: kullanıcı bilgisini çekip MIslemler'e prop olarak ver.
// MIslemler component'i bu prop'a dayanıyor.
function MIslemlerSayfasi() {
  const [kullanici, setKullanici] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const { data } = await supabase
          .from('kullanicilar')
          .select('id, ad_soyad, email, rol, tenant_id')
          .eq('id', session.user.id)
          .single()
        setKullanici(data)
      } finally {
        setYukleniyor(false)
      }
    })()
  }, [])

  if (yukleniyor) {
    return (
      <div style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--txd)',
        fontSize: 14,
      }}>
        •••
      </div>
    )
  }

  if (!kullanici) return <Navigate to="/giris" />

  return <MIslemler kullanici={kullanici} />
}

// 67. oturum: /ara ve /bildirim için sade placeholder.
// Bottom nav'daki sekmeler oraya yönlendirildiğinde kullanıcı boş ekrana
// veya catch-all loop'a düşmesin diye. Gerçek sayfalar yapıldığında bu
// komponent silinir, route'lar gerçek ekrana bağlanır.
function MYakinda({ baslik }) {
  const navigate = useNavigate()
  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      background: 'var(--bg)',
      color: 'var(--tx)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <div style={{
        fontSize: 22,
        fontWeight: 700,
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: 0.5,
      }}>
        {baslik}
      </div>
      <div style={{ fontSize: 14, color: 'var(--txd)', maxWidth: 280, lineHeight: 1.5 }}>
        Bu sayfa yakında geliyor.
      </div>
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          marginTop: 16,
          padding: '12px 28px',
          background: 'var(--ac)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Ana Sayfa
      </button>
    </div>
  )
}
