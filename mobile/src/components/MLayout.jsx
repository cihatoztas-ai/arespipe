// mobile/src/components/MLayout.jsx
// AresPipe Mobile — Ortak sayfa iskeleti (Sıra 11 / Oturum 213)
//
// TEK KAYNAK: 100dvh flex kolon iskeleti + opsiyonel yüzen alt bar + geri slotu.
//
// Tasarım (A = topbar slot):
//   - topbar SLOT — MLayout sahiplenmez, ekran kendi verir. (Kimi ekranın
//     kendi zengin topbar'ı var: MDevreler stat çubuğu, MDevreDetay sekmeler.)
//   - geri: STANDART geri tuşu tek yerden. geri={fn} verilirse sol üstte
//     çizilir; verilmezse HİÇ gösterilmez (kural: gidecek yer yoksa yok).
//     geri + baslik birlikte verilince MLayout basit bir geri-başlık topbar'ı
//     kurar; topbar slot verilirse o öncelikli (ekran kendi topbar'ını yönetir).
//   - icerikKaydir=true (varsayılan): çocuklar flex:1 scroll alanına sarılır.
//     false: ekran kendi iç scroll'unu yönetir (MDevreler/MDevreDetay).
//   - altBar=true: yüzen MBottomNav overlay (absolute). Kök ekranlar.
//   - MDrawer opsiyonel: onDrawerKapat verilirse mount edilir.

import MDrawer from './MDrawer'
import MBottomNav from './MBottomNav'

function GeriBaslikTopbar({ geri, baslik, sag = null }) {
  return (
    <div style={g.bar}>
      <button style={g.btn} onClick={geri} aria-label="Geri" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div style={g.baslik}>{baslik || ''}</div>
      <div style={g.sag}>{sag}</div>
    </div>
  )
}

export default function MLayout({
  topbar = null,
  children,
  geri = null,             // fonksiyon → standart sol-üst geri tuşu; yoksa gizli
  baslik = null,           // geri-başlık topbar'ı için orta başlık
  topbarSag = null,        // geri-başlık topbar'ının sağ slotu (opsiyonel)
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
  // Topbar önceliği: ekran kendi slot'unu verdiyse o; yoksa geri varsa
  // standart geri-başlık topbar'ı; ikisi de yoksa topbar yok.
  const ustBant = topbar
    ? topbar
    : geri
      ? <GeriBaslikTopbar geri={geri} baslik={baslik} sag={topbarSag} />
      : null

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
      {ustBant}

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

const g = {
  bar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 8px',
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
    paddingTop: 'env(safe-area-inset-top)',
    height: 'calc(56px + env(safe-area-inset-top))',
  },
  btn: {
    width: 40, height: 40, borderRadius: 10,
    background: 'transparent',
    border: 'none',
    color: 'var(--tx)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, padding: 0,
    WebkitTapHighlightColor: 'transparent',
  },
  baslik: {
    flex: 1,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--tx)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sag: { flexShrink: 0, display: 'flex', alignItems: 'center' },
}
