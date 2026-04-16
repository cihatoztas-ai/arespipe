import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Giris from './screens/Giris'
import Anasayfa from './screens/Anasayfa'
import Devreler from './screens/Devreler'
import IsBaslat from './screens/IsBaslat'

function App() {
  const [oturum, setOturum] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setOturum(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setOturum(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (oturum === undefined) return null

  return (
    <Routes>
      <Route path="/giris" element={!oturum ? <Giris /> : <Navigate to="/" />} />
      <Route path="/" element={oturum ? <Anasayfa /> : <Navigate to="/giris" />} />
      <Route path="/devreler" element={oturum ? <Devreler /> : <Navigate to="/giris" />} />
      <Route path="/is-baslat" element={oturum ? <IsBaslat /> : <Navigate to="/giris" />} />
    </Routes>
  )
}

export default App
