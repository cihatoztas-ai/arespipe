// mobile/src/screens/MProfil.jsx
// Kullanıcı profil ekranı (Sıra 6).
// - Avatar (foto_url, arespipe-dosyalar bucket) — tek düzenlenebilir alan, file input
// - Ad Soyad / E-posta / Rol / Firma / Üyelik Paketi → salt-okunur
// - Hesap: Şifre Değiştir (resetPasswordForEmail) + Hesabı Sil (soft-delete + logout)
//
// NOT (üyelik paketi): henüz aboneliğe bağlı DEĞİL — statik "Kurumsal" gösterilir.
//   Abonelik altyapısı gelince gerçek alana bağlanacak (sıraya alındı).

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { dosyaUrlAl } from '../lib/dosya'
import { useT } from '../lib/i18n'
import MMarkLogo from '../components/MMarkLogo'

export default function MProfil({ kullanici }) {
  const navigate = useNavigate()
  const { tv } = useT()
  const fileRef = useRef(null)

  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarBust, setAvatarBust] = useState(0)
  const [avatarYukleniyor, setAvatarYukleniyor] = useState(false)
  const [silOnay, setSilOnay] = useState(false)
  const [silYukleniyor, setSilYukleniyor] = useState(false)
  const [toast, setToast] = useState(null)

  const rolKey = kullanici?.rol ? `m_rol_${kullanici.rol}` : null
  const rolLabel = rolKey ? tv(rolKey, kullanici.rol) : ''
  const basHarf = (kullanici?.ad_soyad || kullanici?.email || '?').charAt(0).toUpperCase()

  // Mevcut avatarı çek
  useEffect(() => {
    if (!kullanici?.foto_url) return
    ;(async () => {
      const url = await dosyaUrlAl(kullanici.foto_url)
      if (url) setAvatarUrl(url)
    })()
  }, [kullanici?.foto_url])

  function toastGoster(metin) {
    setToast(metin)
    setTimeout(() => setToast(null), 3000)
  }

  async function avatarSec(e) {
    const file = e.target.files?.[0]
    if (!file || !kullanici?.tenant_id || !kullanici?.id) return
    setAvatarYukleniyor(true)
    try {
      const yol = `${kullanici.tenant_id}/avatar/${kullanici.id}.jpg`
      const { error: upErr } = await supabase.storage
        .from('arespipe-dosyalar')
        .upload(yol, file, { upsert: true, contentType: file.type || 'image/jpeg' })
      if (upErr) throw upErr
      const { error: dbErr } = await supabase
        .from('kullanicilar')
        .update({ foto_url: yol })
        .eq('id', kullanici.id)
      if (dbErr) throw dbErr
      const url = await dosyaUrlAl(yol)
      if (url) { setAvatarUrl(url); setAvatarBust(Date.now()) }
    } catch (err) {
      console.warn('[MProfil] avatar:', err?.message || err)
      toastGoster(tv('m_profil_avatar_hata', 'Fotoğraf yüklenemedi'))
    } finally {
      setAvatarYukleniyor(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function sifreDegistir() {
    if (!kullanici?.email) return
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(kullanici.email)
      if (error) throw error
      toastGoster(tv('m_profil_sifre_gonderildi', 'Şifre sıfırlama bağlantısı e-postanıza gönderildi'))
    } catch (err) {
      console.warn('[MProfil] sifre:', err?.message || err)
      toastGoster(tv('m_profil_sifre_hata', 'Bağlantı gönderilemedi'))
    }
  }

  async function hesabiSil() {
    if (!kullanici?.id) return
    setSilYukleniyor(true)
    try {
      const { error } = await supabase
        .from('kullanicilar')
        .update({ aktif: false })
        .eq('id', kullanici.id)
      if (error) throw error
      await supabase.auth.signOut()
      navigate('/giris')
    } catch (err) {
      console.warn('[MProfil] hesap sil:', err?.message || err)
      toastGoster(tv('m_profil_sil_hata', 'İşlem başarısız'))
      setSilYukleniyor(false)
    }
  }

  return (
    <div style={s.sayfa}>
      {/* Topbar */}
      <div style={s.topbar}>
        <button style={s.geriBtn} onClick={() => navigate(-1)} aria-label={tv('m_geri', 'Geri')}>
          <span style={{ fontSize: 24 }}>‹</span>
        </button>
        <MMarkLogo style={s.topbarLogo} />
        <div style={s.topbarTitle}>{tv('m_profil_baslik', 'Profil')}</div>
      </div>

      <div style={s.scroll}>
        {/* Avatar */}
        <div style={s.avatarWrap}>
          <div style={s.avatarKutu}>
            {avatarUrl ? (
              <img key={avatarBust} src={avatarUrl} alt="" style={s.avatarImg} />
            ) : (
              <div style={s.avatarHarf}>{basHarf}</div>
            )}
            <button
              style={s.avatarRozet}
              onClick={() => fileRef.current && fileRef.current.click()}
              aria-label={tv('m_profil_foto_degistir', 'Fotoğrafı değiştir')}
              disabled={avatarYukleniyor}
            >
              <span style={{ fontSize: 15 }}>{avatarYukleniyor ? '⏳' : '📷'}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={avatarSec}
              style={{ display: 'none' }}
            />
          </div>
          <div style={s.avatarAd}>{kullanici?.ad_soyad || tv('m_kullanici', 'Kullanıcı')}</div>
          <div style={s.avatarMail}>{kullanici?.email || ''}</div>
        </div>

        {/* Bilgiler */}
        <div style={s.sectionRow}>{tv('m_profil_bilgiler', 'Bilgiler')}</div>
        <div style={{ padding: '0 16px' }}>
          <div style={s.ikiKol}>
            <div style={s.alanKutu}>
              <div style={s.alanLabel}>{tv('m_profil_rol', 'Rol')}</div>
              <span style={s.rolBadge}>{rolLabel}</span>
            </div>
            <div style={s.alanKutu}>
              <div style={s.alanLabel}>{tv('m_profil_firma', 'Firma')}</div>
              <div style={s.alanDeger}>{kullanici?.firma || '—'}</div>
            </div>
          </div>

          <div style={s.alanKutu}>
            <div style={s.alanLabel}>{tv('m_profil_paket', 'Üyelik Paketi')}</div>
            <div style={s.paketSatir}>
              <span style={{ fontSize: 16 }}>✦</span>
              <span style={s.paketAd}>{tv('m_profil_paket_deger', 'Kurumsal')}</span>
              <span style={s.paketAktif}>{tv('m_profil_paket_aktif', 'aktif')}</span>
            </div>
            <div style={s.paketUyari}>{tv('m_profil_paket_uyari', 'Üyelik paketi henüz aboneliğe bağlı değil — yakında.')}</div>
          </div>
        </div>

        {/* Hesap */}
        <div style={s.sectionRow}>{tv('m_profil_hesap', 'Hesap')}</div>
        <div style={{ padding: '0 16px 24px' }}>
          <button style={s.hesapBtn} onClick={sifreDegistir}>
            <span style={{ fontSize: 19 }}>🔑</span>
            <span style={s.hesapMetin}>{tv('m_profil_sifre_degistir', 'Şifre Değiştir')}</span>
            <span style={s.hesapOk}>›</span>
          </button>

          {!silOnay ? (
            <button style={s.silBtn} onClick={() => setSilOnay(true)}>
              <span style={{ fontSize: 19 }}>🗑️</span>
              <span style={s.hesapMetin}>{tv('m_profil_hesap_sil', 'Hesabı Sil')}</span>
              <span style={s.hesapOk}>›</span>
            </button>
          ) : (
            <div style={s.silOnayKutu}>
              <div style={s.silOnayBaslik}>{tv('m_profil_sil_onay_baslik', 'Hesabınızı silmek istediğinize emin misiniz?')}</div>
              <div style={s.silOnayAciklama}>{tv('m_profil_sil_onay_aciklama', 'Hesabınız kapatılır ve çıkış yapılır. Verileriniz korunur.')}</div>
              <div style={s.silOnayButonlar}>
                <button style={s.silIptal} onClick={() => setSilOnay(false)} disabled={silYukleniyor}>
                  {tv('m_profil_iptal', 'İptal')}
                </button>
                <button style={s.silOnayla} onClick={hesabiSil} disabled={silYukleniyor}>
                  {silYukleniyor ? '•••' : tv('m_profil_sil_onayla', 'Evet, Sil')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }} />
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}

const s = {
  sayfa: { height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--tx)' },
  topbar: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px',
    background: 'var(--sur)', borderBottom: '1px solid var(--bor)',
    paddingTop: 'env(safe-area-inset-top)', height: 'calc(56px + env(safe-area-inset-top))',
  },
  geriBtn: {
    background: 'transparent', border: 'none', color: 'var(--tx)', width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  topbarLogo: { width: 28, height: 28, display: 'block', flexShrink: 0 },
  topbarTitle: { flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--tx)' },
  scroll: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  avatarWrap: {
    background: 'var(--sur)', borderBottom: '1px solid var(--bor)',
    padding: '24px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  avatarKutu: { position: 'relative', width: 96, height: 96 },
  avatarImg: { width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bor)' },
  avatarHarf: {
    width: 96, height: 96, borderRadius: '50%', background: 'var(--sur2)', border: '2px solid var(--bor)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 800, color: 'var(--txd)',
  },
  avatarRozet: {
    position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: '50%',
    background: 'var(--ac)', border: '2px solid var(--sur)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  },
  avatarAd: { marginTop: 12, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--tx)' },
  avatarMail: { marginTop: 2, fontSize: 13, color: 'var(--txd)' },
  sectionRow: {
    padding: '18px 16px 8px', fontSize: 13, fontWeight: 700, color: 'var(--txd)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  ikiKol: { display: 'flex', gap: 12, marginBottom: 12 },
  alanKutu: { flex: 1, marginBottom: 12 },
  alanLabel: { fontSize: 12, color: 'var(--txd)', marginBottom: 6 },
  alanDeger: {
    background: 'var(--sur)', border: '1px solid var(--bor)', borderRadius: 10,
    padding: '12px 14px', fontSize: 14, color: 'var(--tx)',
  },
  rolBadge: {
    display: 'inline-block', background: 'rgba(45,142,255,.16)', color: 'var(--ac)',
    fontSize: 13, fontWeight: 700, padding: '9px 12px', borderRadius: 8,
  },
  paketSatir: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--sur)', border: '1px solid var(--bor)', borderRadius: 10, padding: '12px 14px',
  },
  paketAd: { flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--tx)' },
  paketAktif: { fontSize: 12, color: 'var(--txd)' },
  paketUyari: { fontSize: 12, color: 'var(--warn)', marginTop: 6, lineHeight: 1.4 },
  hesapBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--sur)', border: '1px solid var(--bor)', borderRadius: 10,
    padding: 14, color: 'var(--tx)', fontSize: 15, cursor: 'pointer', marginBottom: 10,
    textAlign: 'left', minHeight: 52,
  },
  hesapMetin: { flex: 1 },
  hesapOk: { fontSize: 18, color: 'var(--txd)' },
  silBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(229,62,62,.08)', border: '1px solid rgba(229,62,62,.4)', borderRadius: 10,
    padding: 14, color: 'var(--re)', fontSize: 15, cursor: 'pointer', textAlign: 'left', minHeight: 52,
  },
  silOnayKutu: {
    background: 'rgba(229,62,62,.06)', border: '1px solid rgba(229,62,62,.4)', borderRadius: 10, padding: 16,
  },
  silOnayBaslik: { fontSize: 15, fontWeight: 700, color: 'var(--re)', marginBottom: 6 },
  silOnayAciklama: { fontSize: 13, color: 'var(--txd)', lineHeight: 1.5, marginBottom: 14 },
  silOnayButonlar: { display: 'flex', gap: 10 },
  silIptal: {
    flex: 1, background: 'var(--sur2)', border: '1px solid var(--bor)', borderRadius: 10,
    padding: 12, color: 'var(--tx)', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 46,
  },
  silOnayla: {
    flex: 1, background: 'var(--re)', border: 'none', borderRadius: 10,
    padding: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 46,
  },
  toast: {
    position: 'fixed', left: '50%', transform: 'translateX(-50%)',
    bottom: 'calc(24px + env(safe-area-inset-bottom))', background: 'var(--sur2)',
    border: '1px solid var(--bor)', borderRadius: 10, padding: '12px 18px',
    fontSize: 14, color: 'var(--tx)', maxWidth: '85%', textAlign: 'center', zIndex: 50,
  },
}
