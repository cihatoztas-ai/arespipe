// mobile/src/components/MLayout.jsx
// AresPipe Mobile — Ortak sayfa iskeleti (Sıra 11 / Oturum 213)
//
// TEK KAYNAK: 100dvh flex kolon iskeleti + opsiyonel yüzen alt bar.
//
// Tasarım (A = topbar slot):
//   - topbar SLOT — MLayout topbar'ı sahiplenmez, ekran kendi verir.
//   - İçerik `flex:1; minHeight:0; overflow-y:auto` scroll alanına girer.
//     minHeight:0 kritik: flex item default min-height:auto → overflow kilitlenir.
//   - altBar=true iken yüzen MBottomNav overlay olarak basılır (absolute).
//     Yüzen olduğundan yer kaplamaz; içerik altından akar. Scroll alanına
//     bar yüksekliği kadar alt boşluk eklenir ki son içerik bar'ın altında
//     saklanmasın (WhatsApp kalıbı).
//   - MDrawer opsiyonel: onDrawerKapat verilirse MLayout mount eder.
//
// Eski `.m-topbar` (fixed) + `.m-page` padding hilesi KULLANILMAZ — flex iskelet.

import MDrawer from './MDrawer'
import MBottomNav from './MBottomNav'

export default function MLayout({
  topbar = null,
  children,
  drawerAcik = false,
  onDrawerKapat = null,
  altBar = false,          // yüzen alt bar göster
  altBarAktif = null,      // 'anasayfa' | 'devreler' | 'uygulamalar'
  kullanici = null,        // bar avatarı için
  onMenuClick = null,      // bar Menü sekmesi → drawer aç
  scrollRef = null,
  scrollStil = null,
  arkaPlan = 'var(--bg)',
}) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: arkaPlan,
        color: 'var(--tx)',
        overflow: 'hidden',
      }}
    >
      {topbar}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: altBar
            ? 'calc(92px + env(safe-area-inset-bottom))'
            : undefined,
          ...(scrollStil || null),
        }}
      >
        {children}
      </div>

      {altBar && (
        <MBottomNav
          aktif={altBarAktif}
          kullanici={kullanici}
          onMenuClick={onMenuClick}
        />
      )}

      {onDrawerKapat && (
        <MDrawer acik={drawerAcik} kapat={onDrawerKapat} />
      )}
    </div>
  )
}
