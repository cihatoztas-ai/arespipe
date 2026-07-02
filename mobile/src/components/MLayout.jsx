// mobile/src/components/MLayout.jsx
// AresPipe Mobile — Ortak sayfa iskeleti (Sıra 11 / Oturum 213)
//
// TEK KAYNAK: 100dvh flex kolon iskeleti + opsiyonel yüzen alt bar.
//
// Tasarım (A = topbar slot):
//   - topbar SLOT — MLayout sahiplenmez, ekran kendi verir.
//   - icerikKaydir=true (varsayılan): çocuklar flex:1 scroll alanına sarılır
//     (minHeight:0 kritik). Basit ekranlar için.
//   - icerikKaydir=false: çocuklar doğrudan basılır; ekran kendi iç scroll'unu
//     yönetir (örn. MDevreler: sabit filtre çubuğu + kayan liste). Bu modda
//     ekran, alt bar için gereken alt boşluğu (liste paddingBottom) kendisi verir.
//   - altBar=true iken yüzen MBottomNav overlay (absolute) — yer kaplamaz.
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
  altBar = false,
  altBarAktif = null,
  kullanici = null,
  onMenuClick = null,
  icerikKaydir = true,
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

      {icerikKaydir ? (
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
      ) : (
        children
      )}

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
