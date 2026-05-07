// mobile/src/screens/MIsBaslat.jsx
// İş Başlat — Hub komponenti
// Tüm iş_baslat ekranlarını yönetir (8 ekran):
//   rolSec → qr → spoolDetay → notEkle → fotoKapat → basamakSec → tamam
//   on_kontrol akışı: spoolDetay → sonFoto → sfTamam
//
// 64. oturum: Ekran 1 (rolSec) implement edildi, diğerleri placeholder.
// 65. oturum: Ekran 2 (qr) → IbQRTara entegre edildi.
// 68. oturum (MK-68.B): Ekran 4 (uyari) silindi. Akış-kesici uyarılar
//   artık drawer overlay olarak host ekranlarda gösterilir:
//     - cross-tenant → IbQRTara içinde drawer overlay
//     - devamEdiyor + alternatif basamak → IbSpoolDetay içinde drawer overlay
//   Hub artık 'uyari' ekran state'i taşımaz, uyariPayload state'i yok.
//
// State:
//   aktifEkran    — 'rolSec' | 'qr' | 'spoolDetay' | ...
//   seciliRol     — { id, ad, renk } (renk = blokRenkHex'ten v3.2 palette)
//   guncelSpool   — Ekran 2'de bulunan spool

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MTopBar     from '../components/MTopBar'
import MBottomNav  from '../components/MBottomNav'
import MDrawer     from '../components/MDrawer'
import IbRolSec    from '../components/isbaslat/IbRolSec'
import IbQRTara    from '../components/isbaslat/IbQRTara'
import {
  islemBloklariniGetir,
  rolKaydet,
  rolHatirla,
  blokRenkHex,
} from '../lib/isbaslat'
import { useT }     from '../lib/i18n'
import { supabase } from '../lib/supabase'

export default function MIsBaslat() {
  const { tv }   = useT()
  const navigate = useNavigate()

  // ───────────────────────────────────────────────
  // State
  // ───────────────────────────────────────────────
  const [drawerAcik,   setDrawerAcik]   = useState(false)
  const [aktifEkran,   setAktifEkran]   = useState('rolSec')
  const [kullanici,    setKullanici]    = useState(null)
  const [bloklar,      setBloklar]      = useState([])
  const [seciliRol,    setSeciliRol]    = useState(null)
  const [guncelSpool,  setGuncelSpool]  = useState(null)
  const [yukleniyor,   setYukleniyor]   = useState(true)
  const [hata,         setHata]         = useState(null)

  // ───────────────────────────────────────────────
  // İlk yükleme: oturum + kullanıcı + bloklar + hatırlanan rol
  // ───────────────────────────────────────────────
  useEffect(() => {
    let iptal = false

    ;(async () => {
      try {
        const { data: sd } = await supabase.auth.getSession()
        if (!sd?.session) {
          if (!iptal) navigate('/giris')
          return
        }

        const { data: kul, error: kulErr } = await supabase
          .from('kullanicilar')
          .select('id, ad_soyad, email, rol, tenant_id, foto_url')
          .eq('id', sd.session.user.id)
          .maybeSingle()
        if (kulErr) throw kulErr
        if (!kul)   throw new Error('Kullanıcı bulunamadı')
        if (iptal) return
        setKullanici(kul)

        const blk = await islemBloklariniGetir(kul.id, kul.tenant_id)
        if (iptal) return
        setBloklar(blk)

        // localStorage'dan rol hatırla — sadece hâlâ atanmış bloklarda varsa.
        // 65. oturum: renk localStorage'da değil, runtime'da blokRenkHex'ten alınır.
        const hatirlanan = rolHatirla()
        if (hatirlanan && blk.find(b => b.id === hatirlanan.id)) {
          setSeciliRol({
            id:   hatirlanan.id,
            ad:   hatirlanan.ad,
            renk: blokRenkHex(hatirlanan.ad),
          })
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
  // Ekran 1 → 2 davranışları
  // ───────────────────────────────────────────────
  // Karta tıklayınca rol seçilir VE direkt QR'a geçilir (kısa yol).
  // FAB ise rol değiştirmeden tekrar QR açmak için (operatör yeni spool için).
  const rolSec = (blok) => {
    setSeciliRol({
      id:   blok.id,
      ad:   blok.ad,
      renk: blok.renkHex || blokRenkHex(blok.ad), // v3.2 palette
    })
    rolKaydet(blok)
    setAktifEkran('qr')
  }

  const qraGec = () => {
    if (!seciliRol) {
      alert(tv('m_ib_rol_sec_uyari', 'Önce yukarıdan rolünüzü seçin'))
      return
    }
    setAktifEkran('qr')
  }

  // ───────────────────────────────────────────────
  // IbQRTara callback'leri
  // ───────────────────────────────────────────────
  const handleQrGeri = () => {
    setAktifEkran('rolSec')
  }

  const handleSpoolBulundu = (spool) => {
    if (!spool) return

    // 68. oturum (MK-68.B): Akış-kesici uyarılar (devamEdiyor /
    // alternatif basamak) artık IbSpoolDetay içinde drawer overlay
    // olarak hesaplanır. Hub'ın görevi sadece spool'u Ekran 3'e iletmek.
    setGuncelSpool(spool)
    setAktifEkran('spoolDetay')
  }

  // ───────────────────────────────────────────────
  // QR ekranı tam ekran kamera — MTopBar/MBottomNav gizlenir
  // ───────────────────────────────────────────────
  if (aktifEkran === 'qr') {
    return (
      <IbQRTara
        aktifRol={seciliRol}
        onGeri={handleQrGeri}
        onSpoolBulundu={handleSpoolBulundu}
      />
    )
  }

  // ───────────────────────────────────────────────
  // Standart layout: TopBar + content + BottomNav
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
          paddingTop: 56,
          paddingBottom: 80,
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

        {/* ── Ekran 1: Rol Seç ── */}
        {!yukleniyor && !hata && aktifEkran === 'rolSec' && (
          <IbRolSec
            bloklar={bloklar}
            seciliRolId={seciliRol?.id}
            onRolSec={rolSec}
          />
        )}

        {/* ── Ekran 3: Spool Detay (placeholder) ── */}
        {!yukleniyor && !hata && aktifEkran === 'spoolDetay' && (
          <PlaceholderEkran
            ikon="📦"
            baslik="Spool Detay (Ekran 3)"
            aciklama={
              guncelSpool
                ? `Bulundu: ${guncelSpool.spool_id || guncelSpool.id}`
                : 'Spool yok.'
            }
            geriEtiket={tv('mob_geri', 'Geri')}
            onGeri={() => setAktifEkran('rolSec')}
            tv={tv}
          >
            <pre style={{
              fontSize: 11,
              color: 'var(--txd)',
              background: 'var(--sur2)',
              padding: 12,
              borderRadius: 8,
              overflow: 'auto',
              maxWidth: 320,
              margin: '12px auto',
              textAlign: 'left',
            }}>
{JSON.stringify({
  id: guncelSpool?.id,
  spool_id: guncelSpool?.spool_id,
  is_durumu: guncelSpool?.is_durumu,
  aktif_basamak: guncelSpool?.aktif_basamak,
  rol: seciliRol?.ad,
}, null, 2)}
            </pre>
          </PlaceholderEkran>
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

// ───────────────────────────────────────────────
// Yardımcı: Placeholder ekran (Ekran 3 için)
// 68. oturum geçici — IbSpoolDetay yazılınca silinir.
// ───────────────────────────────────────────────
function PlaceholderEkran({ ikon, baslik, aciklama, geriEtiket, onGeri, tv, children }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--txd)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{ikon}</div>
      <div style={{
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--tx)',
        marginBottom: 8,
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: 0.5,
      }}>
        {baslik}
      </div>
      {aciklama && (
        <div style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          {aciklama}
        </div>
      )}
      {children}
      <button
        type="button"
        onClick={onGeri}
        style={{
          marginTop: 8,
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
        {geriEtiket}
      </button>
    </div>
  )
}
