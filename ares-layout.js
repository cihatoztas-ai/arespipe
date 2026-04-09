/**
 * AresPipe Layout — Ortak Sidebar + Topbar + Tema Sistemi v3.0
 *
 * Her sayfaya şu sırayla ekle:
 *   <script src="ares-store.js"></script>
 *   <script src="ares-layout.js"></script>
 *
 * Sayfa HTML yapısı (sidebar buradan oluşturulur, elle yazma):
 *   <div class="app-shell">
 *     <div class="main-content">
 *       <div class="page"> ... </div>
 *     </div>
 *   </div>
 *
 * 2 Tema:
 *   dark               → Shipyard Dark
 *   light-anthracite   → Antrasit Açık
 */
(function () {
  'use strict';

  // ── Giriş/Mobil sayfaları atla ─────────────────────────────
  const PAGE = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  if (['giris', 'mobil'].some(p => PAGE.includes(p))) return;

  // ── DİL YÖNETİCİSİ (Kural D-01) ────────────────────────────
  var _langData = {};
  var _langLoaded = false;

  function getLang() {
    return localStorage.getItem('ares_lang') || 'tr';
  }

  function setLang(lang) {
    localStorage.setItem('ares_lang', lang);
    // D-01: html[lang] attribute güncelle — MutationObserver'ları tetikler
    document.documentElement.setAttribute('lang', lang);
    if (lang === 'tr') {
      // ✅ D-01: Türkçe varsayılan — _langData temizle, sayfa HTML'i göster
      _langData = {};
      applyLang();
      updateLangToggle();
      if (typeof window._onLangChange === 'function') window._onLangChange(lang);
    } else {
      loadLang(lang, function() {
        applyLang();
        updateLangToggle();
        if (typeof window._onLangChange === 'function') window._onLangChange(lang);
      });
    }
  }

  function loadLang(lang, cb) {
    // Cache yok - her zaman fetch
    fetch('lang/' + lang + '.json?nocache=' + Date.now())
      .then(function(r){ return r.json(); })
      .then(function(data){
        // Race condition fix: fetch biterken kullanıcı başka dile geçmiş olabilir
        // Sadece hâlâ aynı dil seçiliyse uygula
        if (getLang() !== lang) return;
        _langData = data;
        _langLoaded = true;
        if (cb) cb();
      })
      .catch(function(){
        if (getLang() !== lang) return;
        _langLoaded = true;
        if (cb) cb();
      });
  }

  // t() — metin çeviri fonksiyonu (global)
  window.t = function(key, params) {
    var text = _langData[key] || key;
    if (params) {
      Object.keys(params).forEach(function(k){
        text = text.replace('{' + k + '}', params[k]);
      });
    }
    return text;
  };

  function applyLang() {
    var isTr = Object.keys(_langData).length === 0;
    // data-i18n etiketli elementleri güncelle
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      // Orijinal Türkçe metni ilk seferinde kaydet
      if (!el.hasAttribute('data-i18n-tr')) el.setAttribute('data-i18n-tr', el.textContent.trim());
      if (isTr) {
        // Türkçeye dön — orijinal HTML metnini geri yükle
        el.textContent = el.getAttribute('data-i18n-tr');
      } else {
        var text = window.t(key);
        if (text !== key) el.textContent = text;
      }
    });
    // data-i18n-placeholder etiketli elementleri güncelle
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!el.hasAttribute('data-i18n-placeholder-tr')) el.setAttribute('data-i18n-placeholder-tr', el.placeholder || '');
      if (isTr) { el.placeholder = el.getAttribute('data-i18n-placeholder-tr'); return; }
      var text = window.t(key);
      if (text !== key) el.placeholder = text;
    });
    // NAV labellarını güncelle
    updateSidebar();
  }

  var _LANG_FLAGS = {
    tr: '<rect width="20" height="14" fill="#E30A17"/><circle cx="8" cy="7" r="3" fill="white"/><circle cx="9" cy="7" r="2.2" fill="#E30A17"/><polygon points="11.5,7 12.8,6 12.8,8" fill="white"/>',
    en: '<rect width="20" height="14" fill="#012169"/><line x1="0" y1="0" x2="20" y2="14" stroke="white" stroke-width="2"/><line x1="20" y1="0" x2="0" y2="14" stroke="white" stroke-width="2"/><rect x="8" width="4" height="14" fill="white"/><rect y="5" width="20" height="4" fill="white"/><rect x="9" width="2" height="14" fill="#C8102E"/><rect y="6" width="20" height="2" fill="#C8102E"/>',
    de: '<rect width="20" height="5" fill="#000"/><rect y="5" width="20" height="4" fill="#DD0000"/><rect y="9" width="20" height="5" fill="#FFCE00"/>',
    ar: '<rect width="20" height="14" fill="#006233"/><rect y="5" width="20" height="4" fill="white"/><rect y="9" width="20" height="5" fill="#000"/>',
  };

  function updateLangToggle() {
    var lang = getLang();
    var flag = document.getElementById('lang-flag');
    var code = document.getElementById('lang-code');
    if (flag && _LANG_FLAGS[lang]) flag.innerHTML = _LANG_FLAGS[lang];
    if (code) code.textContent = lang.toUpperCase();
    // Aktif seçeneği işaretle
    document.querySelectorAll('.lang-opt').forEach(function(opt) {
      opt.style.background = opt.dataset.lang === lang ? 'var(--sur2)' : '';
      opt.style.color = opt.dataset.lang === lang ? 'var(--tx)' : '';
    });
  }

  // ── NAVIGASYON TANIMI ───────────────────────────────────────
  const NAV = [
    {
      type: 'item', key: 'index', label: 'Ana Sayfa', i18n: 'nav_ana_sayfa', href: 'index.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
    },
    { type: 'sep', label: 'PROJELER', i18n: 'nav_projeler' },
    {
      type: 'item', key: 'proje', label: 'Projeler', i18n: 'nav_projeler_menu', href: 'proje_liste.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
    },
    {
      type: 'item', key: 'devre', label: 'Aktif Devreler', i18n: 'nav_aktif_devreler', href: 'devreler.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
    },
    {
      type: 'item', key: 'izobatch', label: 'İzometri Batch', href: 'izometri-batch.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>'
    },
    { type: 'sep', label: 'ÜRETİM', i18n: 'nav_uretim' },
    {
      type: 'item', key: 'kesim', label: 'Kesim', i18n: 'nav_kesim', href: 'kesim.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>'
    },
    {
      type: 'item', key: 'bukum', label: 'Büküm', i18n: 'nav_bukum', href: 'bukum.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h6v6H4z"/><path d="M14 4h6v6h-6z"/><path d="M4 14h6v6H4z"/><path d="M17 17m-3 0a3 3 0 106 0 3 3 0 10-6 0"/></svg>'
    },
    {
      type: 'item', key: 'markalama', label: 'Markalama', i18n: 'nav_markalama', href: 'markalama.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>'
    },
    { type: 'sep', label: 'KALİTE & LOJİSTİK', i18n: 'nav_kalite_lojistik' },
    {
      type: 'item', key: 'kalite', label: 'Kalite Kontrol', i18n: 'nav_kalite_kontrol', href: 'kalite_kontrol.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    },
    {
      type: 'item', key: 'test', label: 'Testler', i18n: 'nav_testler', href: 'testler.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5m4 0h10M5 14a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/></svg>'
    },
    {
      type: 'item', key: 'sevk', label: 'Sevkiyatlar', i18n: 'nav_sevkiyatlar', href: 'sevkiyatlar.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8l5 2v5h-5V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>'
    },
    { type: 'sep', label: 'YÖNETİM', i18n: 'nav_yonetim' },
    {
      type: 'item', key: 'uyari', label: 'Uyarılar', i18n: 'nav_uyarilar', href: 'uyarilar.html', badge: true,
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>'
    },
    {
      type: 'item', key: 'tersane', label: 'Tersaneler', i18n: 'nav_tersaneler', href: 'tersaneler.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
    },
    {
      type: 'item', key: 'kullanici', label: 'Kullanıcılar', i18n: 'nav_kullanicilar', href: 'kullanicilar.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>'
    },
    {
      type: 'item', key: 'tezgah', label: 'Tezgahlar', i18n: 'nav_tezgahlar', href: 'tezgahlar.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>'
    },
    { type: 'sep', label: 'SİSTEM', i18n: 'nav_sistem' },
    {
      type: 'item', key: 'tanim', label: 'Tanımlar', i18n: 'nav_tanimlar', href: 'tanimlar.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>'
    },
    {
      type: 'item', key: 'log', label: 'İşlem Logu', i18n: 'nav_islem_logu', href: 'log.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    },
    {
      type: 'item', key: 'raporlar', label: 'Raporlar', i18n: 'nav_raporlar', href: 'raporlar.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
    },
    {
      type: 'item', key: 'ayarlar', label: 'Ayarlar', i18n: 'nav_ayarlar', href: 'ayarlar.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
    },
  ];

  // ── Aktif sayfa tespiti ─────────────────────────────────────
  function getActiveKey() {
    const p = PAGE.toLowerCase();
    if (p === 'index' || p === '') return 'index';
    if (p.includes('proje')) return 'proje';
    if (p.includes('devre') || p.includes('spool')) return 'devre';
    if (p.includes('kesim')) return 'kesim';
    if (p.includes('bukum')) return 'bukum';
    if (p.includes('markalama')) return 'markalama';
    if (p.includes('kalite') || p.includes('kk')) return 'kalite';
    if (p.includes('test')) return 'test';
    if (p.includes('sevk')) return 'sevk';
    if (p.includes('uyari')) return 'uyari';
    if (p.includes('tersane')) return 'tersane';
    if (p.includes('kullanici')) return 'kullanici';
    if (p.includes('personel')) return 'kullanici';
    if (p.includes('tezgah')) return 'tezgah';
    if (p.includes('tanim')) return 'tanim';
    if (p.includes('senaryo')) return 'senaryolar';
    if (p.includes('klavuz')) return 'klavuz';
    if (p.includes('kurallar')) return 'kurallar';
    if (p.includes('log')) return 'log';
    if (p.includes('rapor')) return 'raporlar';
    if (p.includes('ayarlar')) return 'ayarlar';
    return '';
  }

  function getUyariSayisi() {
    try { return (JSON.parse(localStorage.getItem('ares_uyarilar') || '[]')).filter(x => !x.goruldu).length; }
    catch (e) { return 0; }
  }

  function getOturum() {
    try { return JSON.parse(localStorage.getItem('ares_oturum') || '{}'); }
    catch (e) { return {}; }
  }

  function authKontrol() {
    const o = getOturum();
    if (!o || !o.rol) {
      localStorage.setItem('ares_oturum', JSON.stringify({ tamAd: 'Demo Kullanıcı', rol: 'yonetici', id: 'demo' }));
    }
    return true;
  }

  // ── GLOBAL CSS enjeksiyonu ─────────────────────────────────

  function _topbarOturumGuncelle(oturum) {
    var ad  = oturum.ad_soyad || 'Kullanıcı';
    var ilk = (ad[0] || 'U').toUpperCase();
    var rol = oturum.rol === 'yonetici' ? 'Yönetici'
            : oturum.rol === 'imalatci' ? 'İmalatçı'
            : oturum.rol || '';
    var nameEl   = document.querySelector('.user-name');
    var roleEl   = document.querySelector('.user-role');
    var avatarEl = document.querySelector('.user-chip > div:first-child');
    if (nameEl)  nameEl.textContent  = ad.split(' ')[0];
    if (roleEl)  roleEl.textContent  = rol;
    if (avatarEl) avatarEl.textContent = ilk;
  }


  function _guvenlikKoruma() {
    // Sağ tık engelle
    document.addEventListener('contextmenu', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
    });
    // Klavye kısayolları engelle
    document.addEventListener('keydown', function(e) {
      var ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      switch (e.key.toLowerCase()) {
        case 'u': case 's': case 'p':
          e.preventDefault();
          break;
        case 'a':
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
          break;
      }
      if (e.key === 'F12') { e.preventDefault(); }
    });
  }

  function injectGlobalCSS() {
    if (document.getElementById('ares-global-style')) return;
    const style = document.createElement('style');
    style.id = 'ares-global-style';
    style.textContent = `
/* ═══════════════════════════════════════════════════
   AresPipe — Global Tema & Layout CSS v3.0
   Kaynak: ares-layout.js — bu dosyayı düzenleme
   ═══════════════════════════════════════════════════ */

/* ── Temel layout ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body { background: var(--bg); color: var(--tx); font-family: 'Barlow', sans-serif; min-height: 100vh; }
.app-shell { display: flex; min-height: 100vh; }

/* ── Accent renkler — her iki temada sabit ── */
:root {
  --ac:   #2D8EFF;
  --ac2:  #1a75e8;
  --gr:   #16a36e;
  --re:   #e53e3e;
  --warn: #d97706;
  --leg:  #7c3aed;
  --or:   #f97316;
}

/* ── SHIPYARD DARK ── */
[data-theme="dark"] {
  --bg:      #0d1117;
  --sur:     #161b24;
  --sur2:    #1c2333;
  --bor:     #262f3e;
  --bor2:    #2e3a4e;
  --tx:      #e6ecf4;
  --txm:     #94a3b8;
  --txd:     #6b7a90;
  --ac-bg:   rgba(45,142,255,0.10);
  --ac-bor:  rgba(45,142,255,0.28);
  --gr-bg:   rgba(22,163,110,0.10);
  --re-bg:   rgba(229,62,62,0.10);
  --warn-bg: rgba(217,119,6,0.10);
  --leg-bg:  rgba(124,58,237,0.10);
  --shadow:    0 4px 24px rgba(0,0,0,0.40);
  --shadow-lg: 0 12px 48px rgba(0,0,0,0.55);
  --sb-bg:        #161b24;
  --sb-bor:       #262f3e;
  --sb-tx:        #e6ecf4;
  --sb-txm:       #94a3b8;
  --sb-txd:       #6b7a90;
  --sb-hover-bg:  rgba(255,255,255,0.05);
  --sb-active-bg: rgba(45,142,255,0.12);
  --sb-active-tx: #2D8EFF;
}

/* ── ANTRASİT AÇIK ── */
[data-theme="light-anthracite"] {
  --bg:      #d8dde4;
  --sur:     #e4e9ef;
  --sur2:    #d0d7e0;
  --bor:     #bcc5d0;
  --bor2:    #a8b4c0;
  --tx:      #141e2b;
  --txm:     #3a4f63;
  --txd:     #637080;
  --ac-bg:   rgba(45,142,255,0.10);
  --ac-bor:  rgba(45,142,255,0.28);
  --gr-bg:   rgba(22,163,110,0.10);
  --re-bg:   rgba(229,62,62,0.10);
  --warn-bg: rgba(217,119,6,0.10);
  --leg-bg:  rgba(124,58,237,0.10);
  --shadow:    0 2px 10px rgba(0,0,0,0.12);
  --shadow-lg: 0 8px 28px rgba(0,0,0,0.18);
  --sb-bg:        #a0aebb;
  --sb-bor:       #8a98a6;
  --sb-tx:        #141e2b;
  --sb-txm:       #1e2d3d;
  --sb-txd:       #2a3a4a;
  --sb-hover-bg:  rgba(0,0,0,0.10);
  --sb-active-bg: rgba(45,142,255,0.18);
  --sb-active-tx: #0d1f38;
}

/* ══ Sidebar ══ */
.sidebar {
  width: 220px; min-height: 100vh;
  background: var(--sb-bg) !important;
  border-right: 1px solid var(--sb-bor) !important;
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; bottom: 0;
  z-index: 200;
  transition: width 0.22s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
}
.sidebar.collapsed { width: 56px; }
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 0 16px; height: 56px;
  border-bottom: 1px solid var(--sb-bor) !important;
  flex-shrink: 0; overflow: hidden; white-space: nowrap;
  cursor: pointer;
}
.logo-mark {
  width: 28px; height: 28px; border-radius: 7px; background: var(--ac);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 800;
  color: white; flex-shrink: 0; letter-spacing: -0.5px;
}
.logo-text {
  font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800;
  color: var(--sb-tx) !important; letter-spacing: 0.5px; transition: opacity 0.15s;
}
.sidebar.collapsed .logo-text { opacity: 0; pointer-events: none; }
.sidebar-nav { flex: 1; padding: 10px 8px; overflow-y: auto; overflow-x: hidden; }
.sidebar-footer { padding: 10px 8px; border-top: 1px solid var(--sb-bor) !important; flex-shrink: 0; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 9px;
  cursor: pointer; text-decoration: none;
  color: var(--sb-txm) !important; font-size: 14px; font-weight: 500;
  white-space: nowrap; overflow: hidden;
  transition: background 0.15s, color 0.15s; margin-bottom: 2px;
}
.nav-item svg { stroke: var(--sb-txm) !important; flex-shrink: 0; }
.nav-item:hover { background: var(--sb-hover-bg) !important; color: var(--sb-tx) !important; }
.nav-item:hover svg { stroke: var(--sb-tx) !important; }
.nav-item.active { background: var(--sb-active-bg) !important; color: var(--sb-active-tx) !important; font-weight: 600; }
.nav-item.active svg { stroke: var(--sb-active-tx) !important; }
.nav-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav-label { transition: opacity 0.15s; }
.sidebar.collapsed .nav-label { opacity: 0; }
.nav-sep-label { color: var(--sb-txd) !important; opacity: 1; }
.sidebar-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--bor);
  background: var(--sur2); cursor: pointer; color: var(--txd);
  position: absolute; top: 14px; right: -14px; z-index: 201;
  transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.sidebar-toggle:hover { border-color: var(--ac); color: var(--ac); }
.sidebar-toggle svg { transition: transform 0.22s; }
.sidebar.collapsed .sidebar-toggle svg { transform: rotate(180deg); }

/* Collapsed tooltip */
.nav-item { position: relative; }
.sidebar.collapsed .nav-item:hover::after {
  content: attr(data-label); position: absolute; left: 48px; top: 50%; transform: translateY(-50%);
  background: var(--sur); border: 1px solid var(--bor); color: var(--tx); font-size: 13px;
  font-weight: 500; padding: 5px 10px; border-radius: 7px; white-space: nowrap;
  pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 300;
}

/* ══ Main content ══ */
.main-content {
  margin-left: 220px;
  transition: margin-left 0.22s cubic-bezier(.4,0,.2,1);
  flex: 1; min-width: 0;
}
.sidebar.collapsed ~ .main-content { margin-left: 56px; }

/* ══ Topbar ══ */
#ares-topbar {
  position: fixed; top: 0; left: 220px; right: 0; height: 52px;
  background: var(--sb-bg); border-bottom: 1px solid var(--sb-bor);
  display: flex; align-items: center; padding: 0 16px; gap: 10px;
  z-index: 150; transition: left 0.22s cubic-bezier(.4,0,.2,1);
}
.sidebar.collapsed ~ .main-content #ares-topbar { left: 56px; }
#tb-title        { color: var(--sb-tx) !important; }
#tb-search       { background: color-mix(in srgb, var(--sb-bg) 55%, var(--sb-bor)) !important; border-color: var(--sb-bor) !important; color: var(--sb-tx) !important; }
#tb-search::placeholder { color: var(--sb-txd) !important; }
#tb-search:focus { border-color: var(--ac) !important; outline: none; box-shadow: 0 0 0 2px var(--ac-bg); }
#tb-bell, #tb-logout {
  background: color-mix(in srgb, var(--sb-bg) 55%, var(--sb-bor)) !important;
  border-color: var(--sb-bor) !important; color: var(--sb-txm) !important;
}
#tb-bell:hover   { border-color: var(--re) !important; color: var(--re) !important; }
#tb-logout:hover { border-color: var(--re) !important; color: var(--re) !important; }
.user-chip { background: color-mix(in srgb, var(--sb-bg) 55%, var(--sb-bor)) !important; border-color: var(--sb-bor) !important; }
.user-name { color: var(--sb-tx) !important; }
.user-role { color: var(--sb-txd) !important; }
.theme-switch { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.theme-switch-icon { font-size: 13px; line-height: 1; opacity: 0.7; transition: opacity 0.2s; user-select: none; }
.theme-switch-icon.active { opacity: 1; }
.theme-switch-track {
  width: 36px; height: 20px; border-radius: 99px;
  background: rgba(0,0,0,0.20); border: 1px solid rgba(0,0,0,0.15);
  position: relative; cursor: pointer; transition: background 0.25s; flex-shrink: 0;
}
[data-theme="dark"] .theme-switch-track { background: rgba(45,142,255,0.35); border-color: rgba(45,142,255,0.3); }
.theme-switch-thumb {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  transition: transform 0.22s cubic-bezier(.4,0,.2,1);
}
[data-theme="dark"] .theme-switch-thumb { transform: translateX(16px); }
    `;
    document.head.appendChild(style);
  }

  // ── Sidebar HTML'ini sıfırdan oluştur ve app-shell'e ekle ─
  function buildSidebar() {
    if (document.getElementById('sidebar')) return; // zaten varsa çıkma
    const shell = document.querySelector('.app-shell');
    if (!shell) return;

    const nav = document.createElement('nav');
    nav.className = 'sidebar';
    nav.id = 'sidebar';
    nav.innerHTML = `
      <button class="sidebar-toggle" id="sidebarToggle" title="Menüyü aç/kapat">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="sidebar-logo">
        <div class="logo-mark">AP</div>
        <div class="logo-text">AresPipe</div>
      </div>
      <div class="sidebar-nav"></div>
      <div class="sidebar-footer"></div>
    `;

    // main-content'ten önce ekle
    const mainContent = shell.querySelector('.main-content');
    shell.insertBefore(nav, mainContent);
  }

  // ── Sidebar nav içeriğini güncelle ─────────────────────────
  function buildNav() {
    const activeKey   = getActiveKey();
    const uyariSayisi = getUyariSayisi();

    return NAV.map(item => {
      if (item.type === 'sep') {
        return `<div style="padding:12px 12px 4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;overflow:hidden;transition:opacity 0.15s;" class="nav-sep-label">${item.i18n && window.t(item.i18n) !== item.i18n ? window.t(item.i18n) : item.label}</div>`;
      }
      const active = activeKey === item.key;
      const badge  = item.badge && uyariSayisi > 0
        ? `<span style="margin-left:auto;background:var(--re);color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;padding:0 3px;">${uyariSayisi}</span>`
        : '';
      return `<a class="nav-item${active ? ' active' : ''}" href="${item.href}" data-label="${item.label}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.i18n && window.t(item.i18n) !== item.i18n ? window.t(item.i18n) : item.label}</span>
        ${badge}
      </a>`;
    }).join('');
  }

  function updateSidebar() {
    const nav = document.querySelector('.sidebar-nav');
    if (nav) nav.innerHTML = buildNav();

    const footer = document.querySelector('.sidebar-footer');
    if (footer) footer.innerHTML = '';

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const updateSep = () => {
        const c = sidebar.classList.contains('collapsed');
        document.querySelectorAll('.nav-sep-label').forEach(el => { el.style.opacity = c ? '0' : '1'; });
      };
      updateSep();
      sidebar.addEventListener('transitionend', updateSep);
    }
  }

  // ── Logo güncelle ──────────────────────────────────────────
  function updateLogoFromSettings() {
    const logoMark = document.querySelector('.logo-mark');
    const logoText = document.querySelector('.logo-text');
    if (!logoMark || !logoText) return;
    const aresLogo = localStorage.getItem('ares_logo_ares');
    const firma    = JSON.parse(localStorage.getItem('ares_firma') || '{}');
    if (aresLogo) {
      logoMark.innerHTML = `<img src="${aresLogo}" style="width:22px;height:22px;object-fit:contain;border-radius:4px;">`;
      logoMark.style.background = 'transparent';
    } else {
      logoMark.innerHTML = 'AP';
      logoMark.style.background = '';
    }
    logoText.textContent = firma.kisaAdi || 'AresPipe';
  }

  // ── Topbar oluştur ─────────────────────────────────────────
  function buildTopbar() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    const old = document.getElementById('ares-topbar');
    if (old) old.remove();

    const o   = getOturum();
    const ad  = o.tamAd || 'Kullanıcı';
    const ilk = (ad[0] || 'U').toUpperCase();
    const rol = o.rol === 'yonetici' ? 'Yönetici' : o.rol === 'imalatci' ? 'İmalatçı' : '';
    const uyariSayisi = getUyariSayisi();

    const topbar = document.createElement('div');
    topbar.id = 'ares-topbar';
    topbar.innerHTML = `
      <div id="tb-title" style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;white-space:nowrap;min-width:80px;"></div>

      <div style="flex:1;max-width:320px;position:relative;margin:0 6px;">
        <svg style="position:absolute;left:9px;top:50%;transform:translateY(-50%);opacity:0.55;pointer-events:none;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="tb-search" type="text" placeholder="Sayfa, proje, spool ara…"
          style="width:100%;padding:7px 11px 7px 28px;border-radius:8px;border:1px solid;font-size:13px;font-family:'Barlow',sans-serif;outline:none;transition:border-color 0.15s,box-shadow 0.15s;">
      </div>

      <div style="flex:1;"></div>

      <div class="theme-switch" id="theme-switch" title="Tema Değiştir">
        <span class="theme-switch-icon" id="ts-sun">☀️</span>
        <div class="theme-switch-track" id="ts-track">
          <div class="theme-switch-thumb" id="ts-thumb"></div>
        </div>
        <span class="theme-switch-icon" id="ts-moon">🌙</span>
      </div>

      <div id="lang-wrap" style="position:relative;flex-shrink:0;">
        <button id="lang-toggle" title="Dil / Language"
          style="display:flex;align-items:center;gap:6px;height:30px;padding:0 9px;border-radius:7px;border:1px solid;background:transparent;cursor:pointer;transition:all 0.15s;font-family:'Barlow',sans-serif;font-size:12px;font-weight:600;">
          <svg id="lang-flag" width="20" height="14" viewBox="0 0 20 14" style="border-radius:2px;flex-shrink:0;">${getLang()==='tr'?'<rect width="20" height="14" fill="#E30A17"/><circle cx="8" cy="7" r="3" fill="white"/><circle cx="9" cy="7" r="2.2" fill="#E30A17"/><polygon points="11.5,7 12.8,6 12.8,8" fill="white"/>':getLang()==='en'?'<rect width="20" height="14" fill="#012169"/><line x1="0" y1="0" x2="20" y2="14" stroke="white" stroke-width="2"/><line x1="20" y1="0" x2="0" y2="14" stroke="white" stroke-width="2"/><rect x="8" width="4" height="14" fill="white"/><rect y="5" width="20" height="4" fill="white"/><rect x="9" width="2" height="14" fill="#C8102E"/><rect y="6" width="20" height="2" fill="#C8102E"/>':'<rect width="20" height="5" fill="#000"/><rect y="5" width="20" height="4" fill="#DD0000"/><rect y="9" width="20" height="5" fill="#FFCE00"/>'}</svg>
          <span id="lang-code">${getLang().toUpperCase()}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.5;"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div id="lang-menu" style="position:absolute;top:calc(100% + 6px);right:0;background:var(--sur);border:1px solid var(--bor);border-radius:9px;overflow:hidden;display:none;z-index:500;min-width:120px;box-shadow:0 8px 20px rgba(0,0,0,0.18);">
          <div class="lang-opt" data-lang="tr" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:600;color:var(--txm);transition:background 0.1s;">
            <svg width="20" height="14" viewBox="0 0 20 14" style="border-radius:2px;"><rect width="20" height="14" fill="#E30A17"/><circle cx="8" cy="7" r="3" fill="white"/><circle cx="9" cy="7" r="2.2" fill="#E30A17"/><polygon points="11.5,7 12.8,6 12.8,8" fill="white"/></svg>
            Türkçe
          </div>
          <div class="lang-opt" data-lang="en" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:600;color:var(--txm);transition:background 0.1s;">
            <svg width="20" height="14" viewBox="0 0 20 14" style="border-radius:2px;"><rect width="20" height="14" fill="#012169"/><line x1="0" y1="0" x2="20" y2="14" stroke="white" stroke-width="2"/><line x1="20" y1="0" x2="0" y2="14" stroke="white" stroke-width="2"/><rect x="8" width="4" height="14" fill="white"/><rect y="5" width="20" height="4" fill="white"/><rect x="9" width="2" height="14" fill="#C8102E"/><rect y="6" width="20" height="2" fill="#C8102E"/></svg>
            English
          </div>
          <div class="lang-opt" data-lang="ar" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:600;color:var(--txm);transition:background 0.1s;">
            <svg width="20" height="14" viewBox="0 0 20 14" style="border-radius:2px;"><rect width="20" height="14" fill="#006233"/><rect y="5" width="20" height="4" fill="white"/><rect y="9" width="20" height="5" fill="#000"/></svg>
            العربية
          </div>
        </div>
      </div>

      <button id="tb-ai" title="AI Sorgu & Analiz" onclick="window._tbAiClick && window._tbAiClick()"
        style="width:36px;height:36px;border-radius:9px;border:1px solid;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;flex-shrink:0;background:transparent;border-color:rgba(99,102,241,.4);color:#6366f1;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      </button>

      <a href="uyarilar.html" id="tb-bell" title="Uyarılar"
        style="position:relative;width:36px;height:36px;border-radius:9px;border:1px solid;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:all 0.15s;flex-shrink:0;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        ${uyariSayisi > 0 ? `<span style="position:absolute;top:-5px;right:-5px;background:var(--re);color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:99px;display:flex;align-items:center;justify-content:center;padding:0 3px;border:2px solid var(--bg);">${uyariSayisi}</span>` : ''}
      </a>

      <div class="user-chip" style="display:flex;align-items:center;gap:8px;padding:4px 10px;border-radius:9px;border:1px solid;flex-shrink:0;">
        <div style="width:28px;height:28px;border-radius:8px;background:var(--ac);display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;">${ilk}</div>
        <div style="line-height:1.3;">
          <div class="user-name" style="font-size:12px;font-weight:600;">${ad.split(' ')[0]}</div>
          <div class="user-role" style="font-size:10px;">${rol}</div>
        </div>
      </div>

      <button id="tb-logout" title="Çıkış Yap"
        style="width:36px;height:36px;border-radius:9px;border:1px solid;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;flex-shrink:0;background:transparent;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    `;

    mainContent.insertBefore(topbar, mainContent.firstChild);

    // .page padding-top (topbar yüksekliği kadar boşluk)
    const page = mainContent.querySelector('.page');
    if (page) {
      const ptVal = parseInt(window.getComputedStyle(page).paddingTop) || 0;
      if (ptVal < 56) page.style.paddingTop = (ptVal + 56) + 'px';
    }

    // Sidebar collapse → topbar sol kenar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const upd = () => { topbar.style.left = sidebar.classList.contains('collapsed') ? '56px' : '220px'; };
      upd();
      new MutationObserver(upd).observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }

    // Sayfa başlığı
    setTimeout(() => {
      const h1 = document.querySelector('.page-title') || document.querySelector('h1');
      const el = document.getElementById('tb-title');
      if (el && h1) el.textContent = h1.textContent.trim();
      else if (el) el.textContent = document.title.replace(/AresPipe[\s\-–|]+/g, '').trim();
    }, 60);

    // Logout
    document.getElementById('tb-logout').onclick = () => {
      if (confirm('Çıkış yapmak istiyor musunuz?')) {
        localStorage.removeItem('ares_oturum');
        window.location.href = 'giris.html';
      }
    };

    // AI butonu — sayfa context'ine göre davran
    window._tbAiClick = function() {
      if (window._aresAnaliz) {
        // Sayfa analiz context'i tanımlamış → analiz modalı aç
        if (typeof window._aresAnalizAc === 'function') {
          window._aresAnalizAc();
        } else {
          // Fallback: sorgu sayfasına git
          window.location.href = 'sorgula.html';
        }
      } else {
        // Context yok → genel sorgu sayfası
        window.location.href = 'sorgula.html';
      }
    };

    setupSearch();
  }

  // ── Dil Dropdown ───────────────────────────────────────────
  function setupLangDropdown() {
    var toggle = document.getElementById('lang-toggle');
    var menu   = document.getElementById('lang-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    document.querySelectorAll('.lang-opt').forEach(function(opt) {
      opt.addEventListener('mouseenter', function() {
        this.style.background = 'var(--sur2)';
        this.style.color = 'var(--tx)';
      });
      opt.addEventListener('mouseleave', function() {
        var lang = getLang();
        if (this.dataset.lang !== lang) {
          this.style.background = '';
          this.style.color = '';
        }
      });
      opt.addEventListener('click', function() {
        menu.style.display = 'none';
        window._setLang && window._setLang(this.dataset.lang);
      });
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('#lang-wrap')) {
        menu.style.display = 'none';
      }
    });
  }

  // ── Tema ───────────────────────────────────────────────────
  function applyTheme(t) {
    if (!['dark', 'light-anthracite'].includes(t)) t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('ares_theme', t);
    const sun  = document.getElementById('ts-sun');
    const moon = document.getElementById('ts-moon');
    if (sun)  sun.classList.toggle('active',  t === 'light-anthracite');
    if (moon) moon.classList.toggle('active', t === 'dark');
  }

  function setupThemeSwitch() {
    const track = document.getElementById('ts-track');
    if (!track) return;
    track.addEventListener('click', function () {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(cur === 'dark' ? 'light-anthracite' : 'dark');
    });
  }

  // ── Sidebar toggle ─────────────────────────────────────────
  function setupToggle() {
    const toggle  = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggle || !sidebar) return;
    if (localStorage.getItem('sidebarCollapsed') === 'true') sidebar.classList.add('collapsed');
    toggle.onclick = () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    };
  }

  // ── Topbar arama ───────────────────────────────────────────
  function setupSearch() {
    const input = document.getElementById('tb-search');
    if (!input) return;
    const pages = NAV.filter(n => n.type === 'item').map(n => ({ label: n.label, href: n.href }));
    let dd = null;
    input.addEventListener('input', function () {
      const q = this.value.toLowerCase().trim();
      if (dd) { dd.remove(); dd = null; }
      if (!q) return;
      const results = pages.filter(p => p.label.toLowerCase().includes(q)).slice(0, 6);
      if (!results.length) return;
      dd = document.createElement('div');
      dd.style.cssText = 'position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--sur);border:1px solid var(--bor);border-radius:10px;box-shadow:var(--shadow-lg);z-index:999;overflow:hidden;';
      dd.innerHTML = results.map(p =>
        `<a href="${p.href}" style="display:block;padding:9px 14px;font-size:13px;color:var(--txm);text-decoration:none;border-bottom:1px solid var(--bor);" onmouseenter="this.style.background='var(--sur2)'" onmouseleave="this.style.background=''">${p.label}</a>`
      ).join('');
      input.parentElement.appendChild(dd);
    });
    document.addEventListener('click', e => {
      if (dd && !input.parentElement.contains(e.target)) { dd.remove(); dd = null; }
    });
  }

  // ── INIT ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Flash prevention html üzerinde zaten aktif — body'ye gerek yok

    // Sayfa açılışında transition'ı geçici kapat — soldan kayma engellemek için
    var noTr = document.createElement('style');
    noTr.id = 'ares-no-transition';
    noTr.textContent = '.sidebar, .main-content, #ares-topbar { transition: none !important; }';
    document.head.appendChild(noTr);

    authKontrol();
    injectGlobalCSS();
    applyTheme(localStorage.getItem('ares_theme') || 'dark');
    buildSidebar();
    updateSidebar();
    buildTopbar();
    setupToggle();
    setupThemeSwitch();
    setupLangDropdown();
    applyTheme(localStorage.getItem('ares_theme') || 'dark');

    // Dil yöneticisi
    window._setLang = setLang;
    var initLang = getLang();
    // D-01: Sayfa açılışında html[lang] attribute'unu ayarla
    document.documentElement.setAttribute('lang', initLang);
    loadLang(initLang, function() {
      applyLang();
      updateLangToggle();
      // ✅ D-01: Sayfa hazır olduktan sonra hook'u tetikle
      if (typeof window._onLangChange === 'function') window._onLangChange(initLang);
      // Çeviri uygulandıktan SONRA sayfayı göster — flash önleme
      document.documentElement.style.visibility = '';
    });

    // Logo tıklayınca ana sayfa
    document.addEventListener('click', function (e) {
      if (e.target.closest('.sidebar-logo')) {
        window.location.href = 'index.html';
      }
    });

    _guvenlikKoruma();
    updateLogoFromSettings();

    // Transition'ı geri aç (visibility artık loadLang callback'inde)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var el = document.getElementById('ares-no-transition');
        if (el) el.remove();
      });
    });

    // ── DEBUG BADGE (SB-05) ───────────────────────────────────
    // Sadece geliştirme ortamında gösterilir — production'da kaldırılacak
    (function _debugBadge() {
      var badge = document.createElement('div');
      badge.id = 'ares-debug-badge';
      badge.style.cssText = [
        'position:fixed', 'bottom:14px', 'right:14px', 'z-index:99999',
        'font-family:monospace', 'font-size:11px', 'font-weight:700',
        'padding:5px 10px', 'border-radius:8px', 'cursor:pointer',
        'border:1px solid', 'transition:opacity .2s', 'opacity:.85',
        'box-shadow:0 2px 8px rgba(0,0,0,.3)', 'user-select:none'
      ].join(';');

      function _guncelle() {
        var mod     = (typeof ARES !== 'undefined') ? ARES.mod : 'yükleniyor';
        var oturum  = (typeof ARES !== 'undefined' && ARES.oturumAl) ? ARES.oturumAl() : null;
        var tamam   = mod === 'supabase' && oturum;
        badge.textContent = tamam
          ? '🟢 Supabase · ' + (oturum.rol || '?')
          : mod === 'supabase'
            ? '🟡 Supabase · oturum yok'
            : '🔴 Local mod';
        badge.style.background  = tamam ? 'rgba(22,163,110,.15)'  : mod === 'supabase' ? 'rgba(217,119,6,.15)' : 'rgba(229,62,62,.15)';
        badge.style.color       = tamam ? '#16a36e' : mod === 'supabase' ? '#d97706' : '#e53e3e';
        badge.style.borderColor = tamam ? 'rgba(22,163,110,.35)' : mod === 'supabase' ? 'rgba(217,119,6,.35)' : 'rgba(229,62,62,.35)';
      }

      // Detay paneli
      badge.addEventListener('click', function() {
        var oturum = (typeof ARES !== 'undefined' && ARES.oturumAl) ? ARES.oturumAl() : null;
        var mod    = (typeof ARES !== 'undefined') ? ARES.mod : '?';
        var lines  = [
          'MOD: ' + mod,
          'TENANT: ' + (oturum?.tenant_id || '—'),
          'ROL: '    + (oturum?.rol       || '—'),
          'USER: '   + (oturum?.ad_soyad  || '—'),
          'SUPA: '   + ((typeof ARES !== 'undefined' && ARES.supabase()) ? 'bağlı' : 'bağlı değil')
        ];
        alert('AresPipe Debug\n\n' + lines.join('\n'));
      });

      document.body.appendChild(badge);
      _guncelle();
      // Her 1 saniyede güncelle
      setInterval(_guncelle, 1000);
    })();

  });

})();
