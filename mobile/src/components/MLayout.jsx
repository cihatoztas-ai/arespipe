// mobile/src/components/MLayout.jsx
// AresPipe Mobile — Ortak sayfa iskeleti (Sıra 11 / Oturum 213)
//
// TEK KAYNAK: 100dvh flex kolon iskeleti. Ekranlar artık kendi
// `s.sayfa` + `s.scroll` kopyalarını taşımaz; hepsi buraya girer.
//
// Tasarım (Oturum 213 kararı, A = topbar slot):
//   - topbar SLOT olarak alınır — MLayout topbar'ı SAHİPLENMEZ.
//     Her ekran kendi topbar JSX'ini verir (kök: logo+avatar,
//     detay: geri+baslik). Böylece MDevreler'in arama barı /
//     MDevreDetay'ın sekmeleri kırılmaz.
//   - İçerik `flex:1; minHeight:0; overflow-y:auto` scroll alanına girer.
//     minHeight:0 kritik — flex item default min-height:auto olduğundan
//     içerik taşınca scroll çalışmaz; 0 vermeden overflow kilitlenir.
//   - MDrawer opsiyonel: onDrawerKapat verilirse MLayout mount eder
//     (4 kök ekran ayrı ayrı mount ediyordu — tek yere alındı).
//
// NOT: Eski `.m-topbar` (position:fixed) + `.m-page` padding hilesi
// KULLANILMAZ. Fixed + padding matematiği IbSpoolDetay'daki ölü alanın
// kaynağıydı; flex iskelet bunu tamamen ortadan kaldırır.

import MDrawer from './MDrawer'

export default function MLayout({
  topbar = null,          // Ekranın topbar JSX'i (slot). flexShrink:0 kendi içinde.
  children,               // Scroll alanına girer.
  drawerAcik = false,     // MDrawer açık state'i.
  onDrawerKapat = null,   // Verilirse MDrawer mount edilir; verilmezse drawer yok.
  scrollRef = null,       // Opsiyonel — scroll DOM erişimi (nadiren).
  scrollStil = null,      // Opsiyonel — scroll alanı ek stil override.
  arkaPlan = 'var(--bg)',
}) {
  return (
    <div
      style={{
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
          ...(scrollStil || null),
        }}
      >
        {children}
      </div>

      {onDrawerKapat && (
        <MDrawer acik={drawerAcik} kapat={onDrawerKapat} />
      )}
    </div>
  )
}
