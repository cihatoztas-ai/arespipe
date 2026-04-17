import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import tr from '../lang/tr.json'
import en from '../lang/en.json'
import ar from '../lang/ar.json'

const DILLER = { tr, en, ar }
const RTL_DILLER = ['ar']
const VARSAYILAN_DIL = 'tr'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [dil, setDilState] = useState(() => {
    const kayitli = localStorage.getItem('ares_lang')
    return kayitli && DILLER[kayitli] ? kayitli : VARSAYILAN_DIL
  })

  useEffect(() => {
    document.documentElement.setAttribute('lang', dil)
    document.documentElement.setAttribute('dir', RTL_DILLER.includes(dil) ? 'rtl' : 'ltr')
  }, [dil])

  const setDil = useCallback((yeniDil) => {
    if (!DILLER[yeniDil]) return
    localStorage.setItem('ares_lang', yeniDil)
    setDilState(yeniDil)
  }, [])

  const tv = useCallback((anahtar, fallback = '') => {
    const sozluk = DILLER[dil] || DILLER[VARSAYILAN_DIL]
    if (sozluk && sozluk[anahtar]) return sozluk[anahtar]
    if (dil !== VARSAYILAN_DIL && DILLER[VARSAYILAN_DIL][anahtar]) {
      return DILLER[VARSAYILAN_DIL][anahtar]
    }
    return fallback || anahtar
  }, [dil])

  const value = { tv, dil, setDil, mevcutDiller: Object.keys(DILLER) }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT() yalnızca <I18nProvider> içinde kullanılabilir')
  return ctx
}
