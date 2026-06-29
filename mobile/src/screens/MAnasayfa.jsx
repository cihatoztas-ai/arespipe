// mobile/src/screens/MAnasayfa.jsx
// Router — kullanıcıyı tipine göre doğru ana sayfaya yönlendirir.
// 4 dal (MOBIL-STRATEJI §1):
//   yönetici              → MAnasayfaYonetici (dashboard)
//   müşteri               → MMusteri (placeholder — §7-3 turu)
//   yetki bloğu var       → MIslemler (operatör; + Uygulamalar)
//   diğer (blok yok)      → MUygulamalar anaSayfaModu (uygulama kullanıcısı)
// Eski "yetki tanımlanmamış" hata ekranı KALKTI: blok yok = uygulama kullanıcısı.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { yoneticiMi, musteriMi, getKullaniciGruplari } from '../lib/yetki'
import MAnasayfaYonetici from './MAnasayfaYonetici'
import MIslemler from './MIslemler'
import MUygulamalar from './MUygulamalar'

export default function MAnasayfa() {
  const navigate = useNavigate()
  const { tv } = useT()
  const [kullanici, setKullanici] = useState(null)
  const [gruplar, setGruplar] = useState([])
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

        if (!yoneticiMi(kul) && !musteriMi(kul)) {
          const grp = await getKullaniciGruplari()
          setGruplar(grp || [])
        }
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

  if (yoneticiMi(kullanici)) {
    return <MAnasayfaYonetici kullanici={kullanici} />
  }

  if (musteriMi(kullanici)) {
    return <MMusteriPlaceholder kullanici={kullanici} tv={tv} />
  }

  if (gruplar.length > 0) {
    return <MIslemler kullanici={kullanici} />
  }

  return <MUygulamalar kullanici={kullanici} anaSayfaModu={true} />
}

function MMusteriPlaceholder({ kullanici, tv }) {
  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 24,
      background: 'var(--bg)',
      color: 'var(--tx)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 40 }}>📁</div>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24, fontWeight: 800,
      }}>
        {kullanici?.ad_soyad || kullanici?.email || tv('m_kullanici', 'Kullanıcı')}
      </div>
      <div style={{ fontSize: 15, color: 'var(--txd)', maxWidth: 280 }}>
        {tv('m_musteri_yakinda', 'Projeleriniz yakında burada görüntülenecek.')}
      </div>
    </div>
  )
}
