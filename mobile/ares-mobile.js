/* ═══════════════════════════════════════════════════
   AresPipe Mobile — Ortak JS
   ═══════════════════════════════════════════════════ */
'use strict';

// ── Tema ──────────────────────────────────────────
function mTemaUygula(tema) {
  if (!['dark', 'light-anthracite'].includes(tema)) tema = 'light-anthracite';
  document.documentElement.setAttribute('data-theme', tema);
  localStorage.setItem('ares_theme', tema);
  document.querySelectorAll('.m-theme-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tema === tema);
  });
}

function mTemaDegistir(tema) { mTemaUygula(tema); }

// ── Dil ───────────────────────────────────────────
function mDilUygula(dil) {
  document.documentElement.setAttribute('lang', dil);
  localStorage.setItem('ares_lang', dil);
  document.querySelectorAll('.m-lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.dil === dil);
  });
  if (typeof window._applyI18n === 'function') window._applyI18n();
}

// ── Drawer (Hamburger Menü) ───────────────────────
function mDrawerAc() {
  document.getElementById('mDrawerOverlay').classList.add('open');
  document.getElementById('mDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function mDrawerKapat() {
  document.getElementById('mDrawerOverlay').classList.remove('open');
  document.getElementById('mDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Toast ─────────────────────────────────────────
function mToast(mesaj, tip, sure) {
  var existing = document.querySelector('.m-toast');
  if (existing) existing.remove();

  var el = document.createElement('div');
  el.className = 'm-toast t-' + (tip || 'info');
  el.textContent = mesaj;
  document.body.appendChild(el);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { el.classList.add('show'); });
  });

  setTimeout(function() {
    el.classList.remove('show');
    setTimeout(function() { if (el.parentNode) el.remove(); }, 300);
  }, sure || 3000);
}

// ── Oturum & Auth ─────────────────────────────────
async function mAuthKontrol() {
  try {
    var _b = 0;
    while (_b < 60) {
      if (typeof ARES !== 'undefined') {
        var _s = ARES.supabase();
        if (_s) {
          var _ses = await _s.auth.getSession();
          if (_ses.data && _ses.data.session) {
            if (typeof ARES.oturumKontrol === 'function') await ARES.oturumKontrol();
            return true;
          }
          if (_b > 15) { location.href = '../giris.html'; return false; }
        }
      }
      await new Promise(function(r) { setTimeout(r, 100); });
      _b++;
    }
    location.href = '../giris.html';
    return false;
  } catch(e) {
    console.error('[Mobile Auth]', e);
    return false;
  }
}

function mOturum() {
  if (typeof ARES !== 'undefined' && ARES.oturumAl) return ARES.oturumAl();
  return null;
}

function mSupabase() {
  if (typeof ARES !== 'undefined') return ARES.supabase();
  return null;
}

function mTenantId() {
  if (typeof ARES !== 'undefined' && ARES.tenantId) return ARES.tenantId();
  return null;
}

// ── Logout ────────────────────────────────────────
async function mCikis() {
  try {
    if (typeof ARES !== 'undefined' && ARES.cikisYap) {
      await ARES.cikisYap();
    }
  } catch(e) {}
  location.href = '../giris.html';
}

// ── URL Params ────────────────────────────────────
function mUrlParam(key) {
  return new URLSearchParams(location.search).get(key);
}

// ── Drawer builder ────────────────────────────────
function mDrawerRender() {
  var oturum = mOturum();
  var ad = oturum ? (oturum.ad_soyad || oturum.email || 'Kullanıcı') : 'Kullanıcı';
  var rol = oturum ? (oturum.rol || '') : '';
  var tema = localStorage.getItem('ares_theme') || 'light-anthracite';
  var dil = localStorage.getItem('ares_lang') || 'tr';

  var rolLabel = {
    'super_admin': 'Süper Admin',
    'yonetici': 'Yönetici',
    'kk_uzmani': 'KK Uzmanı',
    'operator': 'Operatör',
    'izleyici': 'İzleyici'
  }[rol] || rol;

  var html = `
    <div class="m-drawer-header">
      <div class="m-drawer-user-name">${esc(ad)}</div>
      <div class="m-drawer-user-role">${esc(rolLabel)}</div>
    </div>

    <div class="m-drawer-section">
      <div class="m-drawer-section-title">Navigasyon</div>
      <a href="index.html" class="m-drawer-item">
        <div class="m-drawer-item-icon">🏠</div>Ana Sayfa
      </a>
      <a href="gemiler.html" class="m-drawer-item">
        <div class="m-drawer-item-icon">🚢</div>Gemiler
      </a>
      <a href="devreler.html" class="m-drawer-item">
        <div class="m-drawer-item-icon">🔗</div>Devreler
      </a>
      <a href="kk.html" class="m-drawer-item">
        <div class="m-drawer-item-icon">✅</div>Kalite Kontrol
      </a>
      <a href="sevkiyat.html" class="m-drawer-item">
        <div class="m-drawer-item-icon">🚚</div>Sevkiyatlar
      </a>
      <a href="tezgahlar.html" class="m-drawer-item">
        <div class="m-drawer-item-icon">⚙️</div>Tezgahlar
      </a>
    </div>

    <div class="m-drawer-footer">
      <div class="m-drawer-setting">
        <span class="m-drawer-setting-label">Tema</span>
        <div class="m-theme-toggle">
          <button class="m-theme-btn ${tema === 'light-anthracite' ? 'active' : ''}" data-tema="light-anthracite" onclick="mTemaDegistir('light-anthracite')">☀️</button>
          <button class="m-theme-btn ${tema === 'dark' ? 'active' : ''}" data-tema="dark" onclick="mTemaDegistir('dark')">🌙</button>
        </div>
      </div>
      <div class="m-drawer-setting">
        <span class="m-drawer-setting-label">Dil</span>
        <div class="m-lang-toggle">
          <button class="m-lang-btn ${dil === 'tr' ? 'active' : ''}" data-dil="tr" onclick="mDilUygula('tr')">TR</button>
          <button class="m-lang-btn ${dil === 'en' ? 'active' : ''}" data-dil="en" onclick="mDilUygula('en')">EN</button>
        </div>
      </div>
      <button class="m-logout-btn" onclick="mCikis()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Çıkış Yap
      </button>
    </div>
  `;

  var drawer = document.getElementById('mDrawer');
  if (drawer) drawer.innerHTML = html;

  // Aktif sayfa işaretle
  var path = location.pathname.split('/').pop();
  document.querySelectorAll('.m-drawer-item').forEach(function(item) {
    var href = item.getAttribute('href');
    if (href && href === path) item.classList.add('active');
  });
}

// ── Bottomnav builder ─────────────────────────────
function mBottomnavRender() {
  var path = location.pathname.split('/').pop() || 'index.html';

  var items = [
    { href: 'index.html',   icon: homeIcon(),   label: 'Ana Sayfa', key: 'index' },
    { href: 'ara.html',     icon: searchIcon(), label: 'Ara',       key: 'ara' },
    { href: 'qr.html',      icon: null,         label: '',          key: 'qr', isQR: true },
    { href: 'bildirim.html', icon: bellIcon(),  label: 'Bildirim',  key: 'bildirim' },
    { href: '#',            icon: menuIcon(),   label: 'Menü',      key: 'menu', isMenu: true },
  ];

  var html = items.map(function(item) {
    if (item.isQR) return `
      <div class="m-nav-qr">
        <a href="${item.href}" class="m-nav-qr-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
            <rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/>
            <rect x="18" y="18" width="3" height="3"/>
          </svg>
        </a>
      </div>`;

    if (item.isMenu) return `
      <button class="m-nav-item" onclick="mDrawerAc()">
        <div class="m-nav-icon">${item.icon}</div>
        <span class="m-nav-label">${item.label}</span>
      </button>`;

    var active = path === item.href ? 'active' : '';
    return `
      <a href="${item.href}" class="m-nav-item ${active}">
        <div class="m-nav-icon">${item.icon}</div>
        <span class="m-nav-label">${item.label}</span>
      </a>`;
  }).join('');

  var nav = document.getElementById('mBottomNav');
  if (nav) nav.innerHTML = html;
}

// ── Durum Rengi ───────────────────────────────────
function mDurumBadge(durum) {
  var map = {
    'bekleyen':    ['b-warn',  'Bekleyen'],
    'imalat':      ['b-blue',  'İmalat'],
    'kaynak':      ['b-blue',  'Kaynak'],
    'on_kontrol':  ['b-warn',  'Ön Kontrol'],
    'kalite':      ['b-leg',   'Kalite'],
    'sevke_hazir': ['b-green', 'Sevke Hazır'],
    'sevk_edildi': ['b-gray',  'Sevk Edildi'],
    'tamamlandi':  ['b-green', 'Tamamlandı'],
    'durduruldu':  ['b-red',   'Durduruldu'],
  };
  var v = map[durum] || ['b-gray', durum || '—'];
  return `<span class="m-badge ${v[0]}">${v[1]}</span>`;
}

// ── Yardımcılar ───────────────────────────────────
function esc(s) {
  var d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function mFormatTarih(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mFormatSure(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── SVG İkonlar ───────────────────────────────────
function homeIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`; }
function searchIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`; }
function bellIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>`; }
function menuIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`; }
function arrowIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`; }

// ── Ortak HTML Blokları ───────────────────────────
function mLayoutHtml(opts) {
  opts = opts || {};
  return `
  <div id="mDrawerOverlay" class="m-drawer-overlay" onclick="mDrawerKapat()"></div>
  <div id="mDrawer" class="m-drawer"></div>
  <nav class="m-bottomnav" id="mBottomNav"></nav>
  `;
}

// ── Sayfa Başlatma ────────────────────────────────
async function mInit(opts) {
  opts = opts || {};

  // Tema & Dil
  var tema = localStorage.getItem('ares_theme') || 'light-anthracite';
  var dil = localStorage.getItem('ares_lang') || 'tr';
  document.documentElement.setAttribute('data-theme', tema);
  document.documentElement.setAttribute('lang', dil);

  // Auth
  var ok = await mAuthKontrol();
  if (!ok) return false;

  // Drawer & Nav
  mDrawerRender();
  mBottomnavRender();

  // Görünür yap
  document.documentElement.style.visibility = '';

  return true;
}
