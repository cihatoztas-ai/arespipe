import { createContext, useContext, useState, useEffect } from 'react'

const TemaContext = createContext(null)
const TEMALAR = ['dark', 'light-anthracite']

function ilkTemayiOku() {
  try {
    const t = localStorage.getItem('ares_theme')
    if (t && TEMALAR.includes(t)) return t
  } catch {}
  return 'light-anthracite'
}

export function TemaProvider({ children }) {
  const [tema, setTemaState] = useState(ilkTemayiOku)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    try { localStorage.setItem('ares_theme', tema) } catch {}
  }, [tema])

  const setTema = (yeni) => {
    if (TEMALAR.includes(yeni)) setTemaState(yeni)
  }

  const tersCevir = () => {
    setTemaState(t => t === 'dark' ? 'light-anthracite' : 'dark')
  }

  return (
    <TemaContext.Provider value={{ tema, setTema, tersCevir }}>
      {children}
    </TemaContext.Provider>
  )
}

export function useTema() {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema TemaProvider icinde kullanilmali')
  return ctx
}
