// mobile/src/screens/MAnasayfa.jsx
// Router — kullanıcının rolüne göre doğru anasayfayı gösterir.
// Yönetici/super_admin → MAnasayfaYonetici (dashboard)
// Diğer herkes → MIslemler (büyük butonlar)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { yoneticiMi } from '../lib/yetki'
import MAnasayfaYonetici from './MAnasayfaYonetici'
import MIslemler from './MIslemler'

export default function MAnasayfa() {
  const navigate = useNavigate()
  const [kullanici, setKullanici] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          navigate('/giris')
          return
        }

        const { data: kul, error } = await supabase
          .from('kullanicilar')
          .select('id, ad_soyad, email, rol, tenant_id')
          .eq('id', session.user.id)
          .single()

        if (error || !kul) {
          navigate('/giris')
          return
        }

        setKullanici(kul)
      } catch (e) {
        console.warn('[MAnasayfa] Hata:', e)
      } finally {
        setYukleniyor(false)
      }
    })()
  }, [navigate])

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

  if (!kullanici) return null

  return yoneticiMi(kullanici)
    ? <MAnasayfaYonetici kullanici={kullanici} />
    : <MIslemler kullanici={kullanici} />
}
