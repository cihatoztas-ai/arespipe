import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { I18nProvider } from './lib/i18n'

import MGiris from './screens/MGiris'
import MAnasayfa from './screens/MAnasayfa'
import MIslemler from './screens/MIslemler'

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
