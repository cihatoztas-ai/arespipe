// mobile/src/screens/MIsBaslat.jsx
// İş Başlat — Hub komponenti
// Tüm iş_baslat ekranlarını yönetir (10 ekran):
//   rolSec → qr → spoolDetay → uyari → notEkle → fotoKapat → basamakSec → tamam
//   on_kontrol akışı: spoolDetay → sonFoto → sfTamam
//
// Şu an yalnızca Ekran 1 (rolSec) implement edildi.
// Diğer ekranlar sonraki oturumlarda eklenecek — placeholder bırakıldı.
//
// State:
//   aktifEkran    — 'rolSec' | 'qr' | 'spoolDetay' | 'uyari' | 'notEkle' | ...
//   seciliRol     — { id, ad, renk } (localStorage'dan hatırlanır)
//   guncelSpool   — yüklenen spool objesi (Ekran 2 sonrası)
//   ...

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MTopBar     from '../components/MTopBar'
import MBottomNav  from '../components/MBottomNav'
import MDrawer     from '../components/MDrawer'   // Mevcut MDrawer.jsx kullanılır
import IbRolSec    from '../components/isbaslat/IbRolSec'
import {
  islemBloklariniGetir,
  rolKaydet,
  rolHatirla,
} from '../lib/isbaslat'
import { useT }     from '../lib/i18n'
import { supabase } from '../lib/supabase'

export default function MIsBaslat() {
  const { tv }   = useT()
  const navigate = useNavigate()

  // ───────────────────────────────────────────────
  // State
  // ───────────────────────────────────────────────
  const [drawerAcik, setDrawerAcik] = useState(false)
  const [aktifEkran, setAktifEkran] = useState('rolSec')
  const [kullanici,  setKullanici]  = useState(null)
  const [bloklar,    setBloklar]    = useState([])
  const [seciliRol,  setSeciliRol]  = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata,       setHata]       = useState(null)

  // ───────────────────────────────────────────────
  // İlk yükleme: oturum + kullanıcı + bloklar + hatırlanan rol
  // ───────────────────────────────────────────────
  useEffect(() => {
    let iptal = false

    ;(async () => {
      try {
        // 1) Oturum kontrolü
        const { data: sd } = await supabase.auth.getSession()
        if (!sd?.session) {
          if (!iptal) navigate('/giris')
          return
        }

        // 2) Kullanıcı
        const { data: kul, error: kulErr } = await supabase
          .from('kullanicilar')
          .select('id, ad_soyad, email, rol, tenant_id, foto_url')
          .eq('id', sd.session.user.id)
          .maybeSingle()
        if (kulErr) throw kulErr
        if (!kul)   throw new Error('Kullanıcı bulunamadı')
        if (iptal) return
        setKullanici(kul)

        // 3) Atanmış işlem blokları
        const blk = await islemBloklariniGetir(kul.id, kul.tenant_id)
        if (iptal) return
        setBloklar(blk)

        // 4) localStorage'dan rol hatırla — sadece hâlâ atanmış bloklarda varsa
        const hatirlanan = rolHatirla()
        if (hatirlanan && blk.find(b => b.id === hatirlanan.id)) {
          setSeciliRol(hatirlanan)
        }

        setYukleniyor(false)
      } catch (e) {
        console.error('[MIsBaslat] yükleme hatası:', e?.message)
        if (!iptal) {
          setHata(e?.message || 'Bilinmeyen hata')
          setYukleniyor(false)
        }
      }
    })()

    return () => { iptal = true }
  }, [navigate])

  // ───────────────────────────────────────────────
  // Davranışlar
  // ───────────────────────────────────────────────
  const rolSec = (blok) => {
    setSeciliRol({ id: blok.id, ad: blok.ad, renk: blok.renk })
    rolKaydet(blok)
    // Otomatik QR'a geçmez — kullanıcı QR butonuna basar (R-10 onayı)
  }

  const qraGec = () => {
    if (!seciliRol) {
      // Geçici toast — ileride mToast eşdeğeri eklenince güncellenecek
      alert(tv('m_ib_rol_sec_uyari', 'Önce yukarıdan rolünüzü seçin'))
      return
    }
    setAktifEkran('qr')
  }

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <>
      <MTopBar
        title={tv('m_ib_baslik', 'İş Başlat')}
        kullanici={kullanici}
        onAvatarClick={() => setDrawerAcik(true)}
      />

      <main
        className="m-page"
        style={{
          paddingTop: 56,                    // top bar yüksekliği
          paddingBottom: 80,                 // bottom nav + FAB taşması
          minHeight: '100dvh',
          background: 'var(--bg)',
        }}
      >
        {yukleniyor && (
          <div style={{
            padding: '32px 24px',
            textAlign: 'center',
            color: 'var(--txd)',
            fontSize: 14,
          }}>
            {tv('m_yukleniyor', 'Yükleniyor...')}
          </div>
        )}

        {!yukleniyor && hata && (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--re)',
            fontSize: 13,
          }}>
            {hata}
          </div>
        )}

        {!yukleniyor && !hata && aktifEkran === 'rolSec' && (
          <IbRolSec
            bloklar={bloklar}
            seciliRolId={seciliRol?.id}
            onRolSec={rolSec}
          />
        )}

        {!yukleniyor && !hata && aktifEkran === 'qr' && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--txd)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', marginBottom: 8 }}>
              {tv('m_ib_qr_yapim_asamasinda_baslik', 'QR ekranı sonraki turda')}
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              {tv('m_ib_qr_yapim_asamasinda', 'Ekran 2 (QR Tarama) henüz hazır değil.')}
            </div>
            <button
              type="button"
              onClick={() => setAktifEkran('rolSec')}
              style={{
                padding: '10px 20px',
                background: 'var(--ac)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {tv('mob_geri', 'Geri')}
            </button>
          </div>
        )}
      </main>

      <MBottomNav
        aktif="anasayfa"
        qrAktif={!!seciliRol}
        onQrClick={qraGec}
        onMenuClick={() => setDrawerAcik(true)}
      />

      <MDrawer
        acik={drawerAcik}
        kapat={() => setDrawerAcik(false)}
      />
    </>
  )
}
