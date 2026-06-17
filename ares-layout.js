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
  if (['giris', 'mobil', 'format_tanit'].some(p => PAGE.includes(p))) return;

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
    fetch('/lang/' + lang + '.json?nocache=' + Date.now())
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

  // t() — geriye uyumluluk aliası → tv()'ye yönlendirir
  // Yeni kodda tv() kullan, bu fonksiyon kaldırılacak
  window.t = function(key, params) {
    if (typeof window.tv === 'function') return window.tv(key, params);
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
      var _tv = typeof window.tv === 'function' ? window.tv : window.t;
      if (isTr) {
        el.textContent = el.getAttribute('data-i18n-tr');
      } else {
        var text = _tv(key, el.getAttribute('data-i18n-tr'));
        if (text && text !== key) el.textContent = text;
      }
    });
    // data-i18n-placeholder etiketli elementleri güncelle
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!el.hasAttribute('data-i18n-placeholder-tr')) el.setAttribute('data-i18n-placeholder-tr', el.placeholder || '');
      var _tv2 = typeof window.tv === 'function' ? window.tv : window.t;
      if (isTr) { el.placeholder = el.getAttribute('data-i18n-placeholder-tr'); return; }
      var text = _tv2(key, el.getAttribute('data-i18n-placeholder-tr'));
      if (text && text !== key) el.placeholder = text;
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
      type: 'item', key: 'uygulamalar', label: 'Uygulamalar', i18n: 'nav_uygulamalar', href: 'uygulamalar.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
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
      type: 'item', key: 'etiketleme', label: 'Etiketleme', i18n: 'nav_etiketleme', href: 'etiketleme.html',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
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
    if (p.includes('tezgah')) return 'tezgah';
    if (p.includes('tanim')) return 'tanim';
    if (p.includes('senaryo')) return 'senaryolar';
    if (p.includes('klavuz')) return 'klavuz';
    if (p.includes('kurallar')) return 'kurallar';
    if (p.includes('log')) return 'log';
    if (p.includes('rapor')) return 'raporlar';
    if (p.includes('etiketleme')) return 'etiketleme';
    if (p.includes('ayarlar')) return 'ayarlar';
    if (p.includes('uygulama') || p.includes('izometri') || p.includes('izobatch')) return 'uygulamalar';
    if (p.includes('sorgula')) return ''; // sorgula — sidebar'da aktif öğe yok
    if (p.includes('qr')) return ''; // qr_tara sayfası — sidebar aktif öğe yok
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
    // Supabase native token'ını kontrol et (sb-*-auth-token)
    var supaKey = Object.keys(localStorage).find(function(k) {
      return k.startsWith('sb-') && k.endsWith('-auth-token');
    });
    var supaToken = null;
    if (supaKey) {
      try { supaToken = JSON.parse(localStorage.getItem(supaKey) || 'null'); } catch(e) {}
    }
    if (!supaToken || !supaToken.access_token) {
      window.location.href = (PAGE.includes('admin') || PAGE.includes('portal') ? '../' : '') + 'giris.html';
      return false;
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
[data-theme=dark] {
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
[data-theme=light-anthracite] {
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
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.logo-mark .ares-amblem { width: 100%; height: 100%; display: block; overflow: hidden; }
.logo-mark.logo-mark-tenant img { width: 30px; height: 30px; object-fit: contain; border-radius: 6px; display: block; }
.logo-text {
  font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800;
  color: var(--sb-tx) !important; letter-spacing: 0.5px; transition: opacity 0.15s;
}
.logo-text.logo-text-svg { display: flex; align-items: center; }
.logo-text.logo-text-svg svg { height: 34px; width: auto; display: block; }
.sidebar.collapsed .sidebar-logo { padding: 0; justify-content: center; gap: 0; }
.sidebar.collapsed .logo-mark { width: 30px; height: 30px; }
.sidebar.collapsed .logo-text { display: none; }
.sidebar-nav { flex: 1; padding: 10px 8px; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
.sidebar-nav::-webkit-scrollbar { display: none; }
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
[data-theme=dark] .theme-switch-track { background: rgba(45,142,255,0.35); border-color: rgba(45,142,255,0.3); }
.theme-switch-thumb {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  transition: transform 0.22s cubic-bezier(.4,0,.2,1);
}
[data-theme=dark] .theme-switch-thumb { transform: translateX(16px); }

/* ── Scrollbar ── */
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--bor);border-radius:99px;}
::-webkit-scrollbar-thumb:hover{background:var(--txd);}
::-webkit-scrollbar-corner{background:transparent;}
*{scrollbar-width:thin;scrollbar-color:var(--bor) transparent;}
    `;
    if (!document.querySelector(".sidebar")) { document.head.appendChild(style); }
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
        <div class="logo-mark"></div>
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

    // Rol kontrolü
    var _oturum2 = (typeof ARES !== 'undefined' && ARES.oturumAl) ? ARES.oturumAl() : null;
    var _rol = _oturum2 ? _oturum2.rol : null;
    var _OPERATOR_KEYS = ['index', 'uyari', 'tezgah'];

    return NAV.map(item => {
      // Operatör sadece belirli sayfaları görsün
      if (_rol === 'operator') {
        if (item.type === 'sep') return '';
        if (item.type === 'item' && !_OPERATOR_KEYS.includes(item.key)) return '';
      }
      if (item.type === 'sep') {
        return `<div style="padding:12px 12px 4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;overflow:hidden;transition:opacity 0.15s;" class="nav-sep-label">${(typeof window.tv === 'function' ? window.tv(item.i18n, item.label) : (window.t(item.i18n) !== item.i18n ? window.t(item.i18n) : item.label))}</div>`;
      }
      const active = activeKey === item.key;
      const badge  = item.badge && uyariSayisi > 0
        ? `<span style="margin-left:auto;background:var(--re);color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;padding:0 3px;">${uyariSayisi}</span>`
        : '';
      return `<a class="nav-item${active ? ' active' : ''}" href="${item.href}" data-label="${item.label}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${(typeof window.tv === 'function' ? window.tv(item.i18n, item.label) : (window.t(item.i18n) !== item.i18n ? window.t(item.i18n) : item.label))}</span>
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
  const ARES_AMBLEM_SVG = '<svg class="ares-amblem" viewBox="0 0 84 84" aria-hidden="true"><defs><linearGradient id="ambPipe" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#1E5FD0"/><stop offset=".5" stop-color="#2D6CDF"/><stop offset="1" stop-color="#9CC4FF"/></linearGradient><linearGradient id="ambScan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C8DF5" stop-opacity="0"/><stop offset=".5" stop-color="#4C8DF5" stop-opacity=".95"/><stop offset="1" stop-color="#4C8DF5" stop-opacity="0"/></linearGradient></defs><rect x="0" y="36.5" width="84" height="11" rx="5" fill="#2D6CDF" opacity="0.12"/><rect x="0" y="40.2" width="84" height="3.6" rx="1.8" fill="url(#ambPipe)"/><circle cx="42" cy="42" r="30" fill="none" stroke="var(--sb-tx)" stroke-width="13"/><rect x="36" y="36" width="12" height="12" rx="3" fill="#34C46F"/><g fill="var(--sb-bg)"><circle cx="63.2" cy="20.8" r="4.2"/><circle cx="20.8" cy="20.8" r="4.2"/><circle cx="20.8" cy="63.2" r="4.2"/><circle cx="63.2" cy="63.2" r="4.2"/></g><g transform="translate(0,120)"><rect x="0" y="-2" width="84" height="12" rx="6" fill="url(#ambScan)"/><rect x="0" y="2.4" width="84" height="2.6" rx="1.3" fill="#2D8EFF"/><animateTransform class="ares-tara-anim" attributeName="transform" type="translate" begin="indefinite" dur="1.3s" values="0 -16;0 90" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" fill="remove" repeatCount="1"/></g></svg>';
  const ARES_WORDMARK_SVG = '<svg class="ares-wordmark" viewBox="104 15.5 269.8 82" aria-label="AresPipe"><g transform="translate(106,79) scale(0.0828,-0.0828)"><g fill="var(--sb-tx)"><path d="M325 11 309 107Q309 112 303 112H176Q170 112 170 107L154 11Q153 0 141 0H24Q11 0 14 13L161 689Q163 700 174 700H309Q320 700 322 689L468 13L469 9Q469 0 458 0H338Q326 0 325 11ZM194 221H284Q289 221 288 226L241 499Q240 502 238 502Q236 502 235 499L190 226Q190 221 194 221Z"/><path transform="translate(482,0)" d="M310 510Q318 505 316 495L297 378Q296 367 283 370Q272 374 256 374Q241 374 230 370Q207 366 193 342.5Q179 319 179 288V13Q179 8 175.5 4.5Q172 1 167 1H50Q45 1 41.5 4.5Q38 8 38 13V502Q38 507 41.5 510.5Q45 514 50 514H167Q172 514 175.5 510.5Q179 507 179 502V463Q179 459 180.5 458.5Q182 458 184 461Q211 520 268 520Q295 520 310 510Z"/><path transform="translate(806,0)" d="M397 213H177Q172 213 172 208V171Q172 146 185.5 129.5Q199 113 220 113Q239 113 251 125.5Q263 138 267 157Q270 167 280 167L395 161Q400 161 403.5 157.5Q407 154 406 148Q399 71 352.5 31.5Q306 -8 220 -8Q131 -8 81 36.5Q31 81 31 160V354Q31 430 81.5 476Q132 522 220 522Q308 522 358.5 476Q409 430 409 354V225Q409 220 405.5 216.5Q402 213 397 213ZM172 344V305Q172 300 177 300H263Q268 300 268 305V344Q268 369 254.5 385Q241 401 220 401Q199 401 185.5 385Q172 369 172 344Z"/><path transform="translate(1242,0)" d="M24 142V149Q24 154 27.5 157.5Q31 161 36 161H146Q151 161 154.5 157.5Q158 154 158 149V146Q158 125 173 111.5Q188 98 210 98Q230 98 241.5 109.5Q253 121 253 139Q253 161 234 173.5Q215 186 191.5 194.5Q168 203 159 206Q104 226 66.5 261.5Q29 297 29 364Q29 437 77 479Q125 521 205 521Q288 521 336.5 477Q385 433 385 358Q385 353 381.5 349.5Q378 346 373 346H266Q261 346 257.5 349.5Q254 353 254 358V366Q254 386 241.5 398.5Q229 411 209 411Q188 411 176 397.5Q164 384 164 366Q164 342 184.5 328.5Q205 315 247 299Q290 283 320.5 266.5Q351 250 373 219.5Q395 189 395 143Q395 74 344.5 33.5Q294 -7 210 -7Q125 -7 74.5 33.5Q24 74 24 142Z"/></g><g fill="var(--ac)"><path transform="translate(1654,0)" d="M445 488Q445 395 395 339Q345 283 264 283H189Q184 283 184 278V12Q184 7 180.5 3.5Q177 0 172 0H55Q50 0 46.5 3.5Q43 7 43 12V689Q43 694 46.5 697.5Q50 701 55 701H257Q312 701 355 674Q398 647 421.5 598.5Q445 550 445 488ZM304 485Q304 529 284.5 554Q265 579 233 579H189Q184 579 184 574V398Q184 393 189 393H233Q265 393 284.5 417.5Q304 442 304 485Z"/><path transform="translate(2119,0)" d="M30 651Q30 686 52 708Q74 730 109 730Q144 730 165.5 708Q187 686 187 651Q187 617 165 594.5Q143 572 109 572Q75 572 52.5 594.5Q30 617 30 651ZM40 12V502Q40 507 43.5 510.5Q47 514 52 514H169Q174 514 177.5 510.5Q181 507 181 502V12Q181 7 177.5 3.5Q174 0 169 0H52Q47 0 43.5 3.5Q40 7 40 12Z"/><path transform="translate(2338,0)" d="M418 355V160Q418 79 382 35.5Q346 -8 278 -8Q256 -8 232 0.5Q208 9 188 31Q186 34 184 33Q182 32 182 29V-174Q182 -179 178.5 -182.5Q175 -186 170 -186H53Q48 -186 44.5 -182.5Q41 -179 41 -174V502Q41 507 44.5 510.5Q48 514 53 514H170Q175 514 178.5 510.5Q182 507 182 502V486Q182 484 184 484Q188 484 192 489Q226 522 278 522Q347 522 382.5 477.5Q418 433 418 355ZM229 402Q208 402 195 386Q182 370 182 344V171Q182 145 195 129Q208 113 229 113Q251 113 264 129Q277 145 277 171V344Q277 370 264 386Q251 402 229 402Z"/><path transform="translate(2786,0)" d="M397 213H177Q172 213 172 208V171Q172 146 185.5 129.5Q199 113 220 113Q239 113 251 125.5Q263 138 267 157Q270 167 280 167L395 161Q400 161 403.5 157.5Q407 154 406 148Q399 71 352.5 31.5Q306 -8 220 -8Q131 -8 81 36.5Q31 81 31 160V354Q31 430 81.5 476Q132 522 220 522Q308 522 358.5 476Q409 430 409 354V225Q409 220 405.5 216.5Q402 213 397 213ZM172 344V305Q172 300 177 300H263Q268 300 268 305V344Q268 369 254.5 385Q241 401 220 401Q199 401 185.5 385Q172 369 172 344Z"/></g></g></svg>';
  function _aresTara(scope) {
    if (!scope) return;
    const a = scope.querySelector('.ares-tara-anim');
    if (a && a.beginElement) { try { a.beginElement(); } catch (e) {} }
  }
  function updateLogoFromSettings() {
    const logoMark = document.querySelector('.logo-mark');
    const logoText = document.querySelector('.logo-text');
    if (!logoMark || !logoText) return;
    const aresLogo = localStorage.getItem('ares_logo_ares');
    const firma    = JSON.parse(localStorage.getItem('ares_firma') || '{}');
    if (aresLogo) {
      logoMark.classList.add('logo-mark-tenant');
      logoMark.innerHTML = `<img src="${aresLogo}" alt="">`;
      logoText.classList.remove('logo-text-svg');
      logoText.textContent = firma.kisaAdi || 'AresPipe';
    } else {
      logoMark.classList.remove('logo-mark-tenant');
      logoMark.innerHTML = ARES_AMBLEM_SVG;
      logoText.classList.add('logo-text-svg');
      logoText.innerHTML = ARES_WORDMARK_SVG;
      _aresTara(logoMark);
    }
  }

  // ── Belge/baski logosu + antet (PDF/yazdir ciktilari) ──────
  const ARES_LOGO_PRINT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 381 100" style="height:34px;width:auto;display:block;"><defs><linearGradient id="apPipe" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#1E5FD0"/><stop offset=".5" stop-color="#2D6CDF"/><stop offset="1" stop-color="#9CC4FF"/></linearGradient></defs><g transform="translate(8,8)"><rect x="0" y="36.5" width="84" height="11" rx="5" fill="#2D6CDF" opacity="0.14"/><rect x="0" y="40.2" width="84" height="3.6" rx="1.8" fill="url(#apPipe)"/><circle cx="42" cy="42" r="30" fill="none" stroke="#16202B" stroke-width="13"/><rect x="36" y="36" width="12" height="12" rx="3" fill="#22A35A"/><g fill="#FFFFFF"><circle cx="63.2" cy="20.8" r="4.2"/><circle cx="20.8" cy="20.8" r="4.2"/><circle cx="20.8" cy="63.2" r="4.2"/><circle cx="63.2" cy="63.2" r="4.2"/></g></g><g transform="translate(106,79) scale(0.0828,-0.0828)"><g fill="#16202B"><path d="M325 11 309 107Q309 112 303 112H176Q170 112 170 107L154 11Q153 0 141 0H24Q11 0 14 13L161 689Q163 700 174 700H309Q320 700 322 689L468 13L469 9Q469 0 458 0H338Q326 0 325 11ZM194 221H284Q289 221 288 226L241 499Q240 502 238 502Q236 502 235 499L190 226Q190 221 194 221Z"/><path transform="translate(482,0)" d="M310 510Q318 505 316 495L297 378Q296 367 283 370Q272 374 256 374Q241 374 230 370Q207 366 193 342.5Q179 319 179 288V13Q179 8 175.5 4.5Q172 1 167 1H50Q45 1 41.5 4.5Q38 8 38 13V502Q38 507 41.5 510.5Q45 514 50 514H167Q172 514 175.5 510.5Q179 507 179 502V463Q179 459 180.5 458.5Q182 458 184 461Q211 520 268 520Q295 520 310 510Z"/><path transform="translate(806,0)" d="M397 213H177Q172 213 172 208V171Q172 146 185.5 129.5Q199 113 220 113Q239 113 251 125.5Q263 138 267 157Q270 167 280 167L395 161Q400 161 403.5 157.5Q407 154 406 148Q399 71 352.5 31.5Q306 -8 220 -8Q131 -8 81 36.5Q31 81 31 160V354Q31 430 81.5 476Q132 522 220 522Q308 522 358.5 476Q409 430 409 354V225Q409 220 405.5 216.5Q402 213 397 213ZM172 344V305Q172 300 177 300H263Q268 300 268 305V344Q268 369 254.5 385Q241 401 220 401Q199 401 185.5 385Q172 369 172 344Z"/><path transform="translate(1242,0)" d="M24 142V149Q24 154 27.5 157.5Q31 161 36 161H146Q151 161 154.5 157.5Q158 154 158 149V146Q158 125 173 111.5Q188 98 210 98Q230 98 241.5 109.5Q253 121 253 139Q253 161 234 173.5Q215 186 191.5 194.5Q168 203 159 206Q104 226 66.5 261.5Q29 297 29 364Q29 437 77 479Q125 521 205 521Q288 521 336.5 477Q385 433 385 358Q385 353 381.5 349.5Q378 346 373 346H266Q261 346 257.5 349.5Q254 353 254 358V366Q254 386 241.5 398.5Q229 411 209 411Q188 411 176 397.5Q164 384 164 366Q164 342 184.5 328.5Q205 315 247 299Q290 283 320.5 266.5Q351 250 373 219.5Q395 189 395 143Q395 74 344.5 33.5Q294 -7 210 -7Q125 -7 74.5 33.5Q24 74 24 142Z"/></g><g fill="#2D6CDF"><path transform="translate(1654,0)" d="M445 488Q445 395 395 339Q345 283 264 283H189Q184 283 184 278V12Q184 7 180.5 3.5Q177 0 172 0H55Q50 0 46.5 3.5Q43 7 43 12V689Q43 694 46.5 697.5Q50 701 55 701H257Q312 701 355 674Q398 647 421.5 598.5Q445 550 445 488ZM304 485Q304 529 284.5 554Q265 579 233 579H189Q184 579 184 574V398Q184 393 189 393H233Q265 393 284.5 417.5Q304 442 304 485Z"/><path transform="translate(2119,0)" d="M30 651Q30 686 52 708Q74 730 109 730Q144 730 165.5 708Q187 686 187 651Q187 617 165 594.5Q143 572 109 572Q75 572 52.5 594.5Q30 617 30 651ZM40 12V502Q40 507 43.5 510.5Q47 514 52 514H169Q174 514 177.5 510.5Q181 507 181 502V12Q181 7 177.5 3.5Q174 0 169 0H52Q47 0 43.5 3.5Q40 7 40 12Z"/><path transform="translate(2338,0)" d="M418 355V160Q418 79 382 35.5Q346 -8 278 -8Q256 -8 232 0.5Q208 9 188 31Q186 34 184 33Q182 32 182 29V-174Q182 -179 178.5 -182.5Q175 -186 170 -186H53Q48 -186 44.5 -182.5Q41 -179 41 -174V502Q41 507 44.5 510.5Q48 514 53 514H170Q175 514 178.5 510.5Q182 507 182 502V486Q182 484 184 484Q188 484 192 489Q226 522 278 522Q347 522 382.5 477.5Q418 433 418 355ZM229 402Q208 402 195 386Q182 370 182 344V171Q182 145 195 129Q208 113 229 113Q251 113 264 129Q277 145 277 171V344Q277 370 264 386Q251 402 229 402Z"/><path transform="translate(2786,0)" d="M397 213H177Q172 213 172 208V171Q172 146 185.5 129.5Q199 113 220 113Q239 113 251 125.5Q263 138 267 157Q270 167 280 167L395 161Q400 161 403.5 157.5Q407 154 406 148Q399 71 352.5 31.5Q306 -8 220 -8Q131 -8 81 36.5Q31 81 31 160V354Q31 430 81.5 476Q132 522 220 522Q308 522 358.5 476Q409 430 409 354V225Q409 220 405.5 216.5Q402 213 397 213ZM172 344V305Q172 300 177 300H263Q268 300 268 305V344Q268 369 254.5 385Q241 401 220 401Q199 401 185.5 385Q172 369 172 344Z"/></g></g></svg>';
  function aresBelgeBasligi(o) {
    o = o || {};
    var firmaLogo = '';
    var firma = {};
    try { firmaLogo = localStorage.getItem('ares_logo_firma') || ''; } catch (e) {}
    try { firma = JSON.parse(localStorage.getItem('ares_firma') || '{}'); } catch (e) {}
    var firmaAd = o.firmaAdi || firma.ad || firma.kisaAdi || '';
    var sol = firmaLogo
      ? '<img src="' + firmaLogo + '" style="height:40px;max-width:220px;object-fit:contain;display:block;">'
      : (firmaAd ? '<div style="font:800 18px Arial,sans-serif;color:#16202B;letter-spacing:.3px;">' + firmaAd + '</div>' : '');
    var baslik   = o.baslik   ? '<div style="font:800 17px Arial,sans-serif;color:#0f172a;margin-top:4px;">' + o.baslik + '</div>' : '';
    var altbilgi = o.altbilgi ? '<div style="font:600 11px Arial,sans-serif;color:#64748b;margin-top:2px;">' + o.altbilgi + '</div>' : '';
    return '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;border-bottom:2px solid #16202B;padding-bottom:10px;margin-bottom:16px;">'
      + '<div style="display:flex;flex-direction:column;">' + sol + baslik + altbilgi + '</div>'
      + '<div style="flex-shrink:0;">' + ARES_LOGO_PRINT + '</div>'
      + '</div>';
  }
  window.aresBelgeBasligi = aresBelgeBasligi;
  window.aresRefreshLogo  = updateLogoFromSettings;
  window.aresLogoPrint = function (h) { return ARES_LOGO_PRINT.replace('height:34px', 'height:' + (h||34) + 'px'); };
  window.aresFirmaLogo = function (h) {
    h = h || 38;
    var logo = '', firma = {};
    try { logo = localStorage.getItem('ares_logo_firma') || ''; } catch (e) {}
    try { firma = JSON.parse(localStorage.getItem('ares_firma') || '{}'); } catch (e) {}
    if (logo) return '<img src="' + logo + '" style="height:' + h + 'px;max-width:220px;object-fit:contain;display:block;">';
    var ad = firma.ad || firma.kisaAdi || '';
    return ad ? '<span style="font:800 17px Arial,sans-serif;color:#16202B;letter-spacing:.5px;">' + ad + '</span>' : '';
  };

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

      <button id="tb-feedback" title="Geri Bildirim / Hata Bildir" onclick="window._feedbackAc && window._feedbackAc()"
        style="width:36px;height:36px;border-radius:9px;border:1px solid;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;flex-shrink:0;background:transparent;border-color:rgba(217,119,6,.4);color:var(--warn);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
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

      <div id="tb-clock" style="font-size:12px;color:var(--sb-txd);font-family:'Barlow Condensed',sans-serif;font-weight:600;letter-spacing:0.3px;flex-shrink:0;text-align:right;line-height:1.3;user-select:none;"></div>

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
    document.getElementById('tb-logout').onclick = async () => {
      if (confirm('Çıkış yapmak istiyor musunuz?')) {
        if (typeof ARES !== 'undefined' && typeof ARES.cikisYap === 'function') {
          await ARES.cikisYap();
        } else {
          localStorage.removeItem('ares_oturum');
        }
        window.location.href = 'giris.html';
      }
    };

    // AI butonu — sayfa context'ine göre davran
    window._tbAiClick = function() {
      if (window._aresAnaliz) {
        if (typeof window._aresAnalizAc === 'function') {
          window._aresAnalizAc();
        } else {
          window.location.href = 'sorgula.html';
        }
      } else {
        window.location.href = 'sorgula.html';
      }
    };

    // Debug badge kaldırıldı (production)

    // Saat — her saniye güncelle
    function _saatGuncelle() {
      var el = document.getElementById('tb-clock');
      if (!el) return;
      var now = new Date();
      var gun = now.toLocaleDateString(document.documentElement.getAttribute('lang')==='ar'?'ar-SA':'tr-TR', {weekday:'short',day:'numeric',month:'short'});
      var saat = now.toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'});
      el.innerHTML = gun + '<br>' + saat;
    }
    _saatGuncelle();
    setInterval(_saatGuncelle, 1000);

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
    if (!['dark', 'light-anthracite'].includes(t)) t = 'light-anthracite';
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
    applyTheme(localStorage.getItem('ares_theme') || 'light-anthracite');
    buildSidebar();
    updateSidebar();
    buildTopbar();
    setupToggle();
    setupThemeSwitch();
    setupLangDropdown();
    applyTheme(localStorage.getItem('ares_theme') || 'light-anthracite');

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
    const _slogo = document.querySelector('.sidebar-logo');
    if (_slogo) _slogo.addEventListener('mouseenter', () => _aresTara(_slogo));

    // Transition'ı geri aç (visibility artık loadLang callback'inde)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var el = document.getElementById('ares-no-transition');
        if (el) el.remove();
      });
    });

    // Debug badge kaldırıldı (production)

    // ── FEEDBACK SİSTEMİ ─────────────────────────────────────
    setupFeedback();

  });

  // ── FEEDBACK FONKSİYONU ────────────────────────────────────
  function setupFeedback() {
    // Modal HTML oluştur
    var modal = document.createElement('div');
    modal.id = 'ares-feedback-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
      <div style="background:var(--sur);border:1px solid var(--bor);border-radius:18px;padding:24px;width:100%;max-width:480px;box-shadow:0 24px 60px rgba(0,0,0,0.5);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:var(--tx);">Geri Bildirim</div>
          <button onclick="document.getElementById('ares-feedback-modal').style.display='none'" style="background:none;border:none;color:var(--txd);font-size:22px;cursor:pointer;line-height:1;">✕</button>
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;font-weight:700;color:var(--txd);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Kategori</label>
          <div style="display:flex;gap:8px;">
            <label style="flex:1;"><input type="radio" name="fb-kat" value="hata" checked style="display:none;">
              <div class="fb-kat-btn" data-val="hata" style="padding:8px;border-radius:9px;border:2px solid var(--re);background:rgba(229,62,62,.08);color:var(--re);text-align:center;cursor:pointer;font-size:13px;font-weight:600;">🐛 Hata</div>
            </label>
            <label style="flex:1;"><input type="radio" name="fb-kat" value="eksik" style="display:none;">
              <div class="fb-kat-btn" data-val="eksik" style="padding:8px;border-radius:9px;border:1px solid var(--bor);background:var(--sur2);color:var(--txm);text-align:center;cursor:pointer;font-size:13px;font-weight:600;">📋 Eksik</div>
            </label>
            <label style="flex:1;"><input type="radio" name="fb-kat" value="fikir" style="display:none;">
              <div class="fb-kat-btn" data-val="fikir" style="padding:8px;border-radius:9px;border:1px solid var(--bor);background:var(--sur2);color:var(--txm);text-align:center;cursor:pointer;font-size:13px;font-weight:600;">💡 Fikir</div>
            </label>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;font-weight:700;color:var(--txd);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Not *</label>
          <textarea id="fb-not" placeholder="Ne gördünüz? Hangi sayfada? Ne olmasını bekliyordunuz?" style="width:100%;padding:10px 12px;border-radius:9px;border:1px solid var(--bor);background:var(--sur2);color:var(--tx);font-size:14px;font-family:'Barlow',sans-serif;outline:none;resize:vertical;min-height:90px;"></textarea>
        </div>

        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:12px;font-weight:700;color:var(--txd);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Fotoğraf (opsiyonel)</label>
          <div id="fb-foto-alan" style="border:2px dashed var(--bor);border-radius:9px;padding:16px;text-align:center;cursor:pointer;transition:border-color .15s;" onclick="document.getElementById('fb-foto-inp').click()">
            <div style="font-size:13px;color:var(--txd);">📎 Fotoğraf seç veya sürükle</div>
            <input type="file" id="fb-foto-inp" accept="image/*" style="display:none;" onchange="window._fbFotoSec(this)">
          </div>
          <div id="fb-foto-oniz" style="display:none;margin-top:8px;position:relative;">
            <img id="fb-foto-img" style="width:100%;max-height:160px;object-fit:cover;border-radius:9px;border:1px solid var(--bor);">
            <button onclick="window._fbFotoKaldir()" style="position:absolute;top:6px;right:6px;background:rgba(229,62,62,.85);border:none;color:#fff;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;">✕</button>
          </div>
        </div>

        <div style="display:flex;gap:10px;">
          <button onclick="document.getElementById('ares-feedback-modal').style.display='none'" style="flex:1;padding:10px;border-radius:9px;border:1px solid var(--bor);background:var(--sur2);color:var(--txm);font-family:'Barlow',sans-serif;font-size:14px;cursor:pointer;">İptal</button>
          <button id="fb-gonder-btn" onclick="window._fbGonder()" style="flex:2;padding:10px;border-radius:9px;border:none;background:var(--warn);color:#fff;font-family:'Barlow',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">Gönder</button>
        </div>
        <div id="fb-hata" style="display:none;margin-top:10px;padding:8px 12px;border-radius:8px;background:rgba(229,62,62,.1);border:1px solid rgba(229,62,62,.3);color:var(--re);font-size:13px;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    // Kategori seçimi görsel
    modal.querySelectorAll('.fb-kat-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        modal.querySelectorAll('.fb-kat-btn').forEach(function(b) {
          b.style.border = '1px solid var(--bor)';
          b.style.background = 'var(--sur2)';
          b.style.color = 'var(--txm)';
        });
        var val = this.dataset.val;
        var renk = val === 'hata' ? 'var(--re)' : val === 'eksik' ? 'var(--ac)' : 'var(--warn)';
        var bgRenk = val === 'hata' ? 'rgba(229,62,62,.08)' : val === 'eksik' ? 'rgba(45,142,255,.08)' : 'rgba(217,119,6,.08)';
        this.style.border = '2px solid ' + renk;
        this.style.background = bgRenk;
        this.style.color = renk;
      });
    });

    var _fbFotoData = null;

    window._fbFotoSec = function(inp) {
      var file = inp.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        _fbFotoData = e.target.result;
        document.getElementById('fb-foto-img').src = _fbFotoData;
        document.getElementById('fb-foto-oniz').style.display = 'block';
        document.getElementById('fb-foto-alan').style.display = 'none';
      };
      reader.readAsDataURL(file);
    };

    window._fbFotoKaldir = function() {
      _fbFotoData = null;
      document.getElementById('fb-foto-inp').value = '';
      document.getElementById('fb-foto-oniz').style.display = 'none';
      document.getElementById('fb-foto-alan').style.display = 'block';
    };

    window._fbGonder = async function() {
      var not = (document.getElementById('fb-not').value || '').trim();
      if (!not) {
        document.getElementById('fb-hata').textContent = 'Not alanı zorunludur.';
        document.getElementById('fb-hata').style.display = 'block';
        return;
      }
      document.getElementById('fb-hata').style.display = 'none';
      var btn = document.getElementById('fb-gonder-btn');
      btn.disabled = true;
      btn.textContent = 'Gönderiliyor...';

      try {
        var supa = (typeof ARES !== 'undefined') ? ARES.supabase() : null;
        if (!supa) throw new Error('Bağlantı yok');

        var oturum = (typeof ARES !== 'undefined' && ARES.oturumAl) ? ARES.oturumAl() : null;
        var kategori = document.querySelector('input[name="fb-kat"]:checked')?.value || 'hata';
        var sayfa = window.location.pathname;

        var fotograf_url = null;
        if (_fbFotoData) {
          try {
            var blob = await fetch(_fbFotoData).then(function(r){ return r.blob(); });
            var fbTenantId = oturum?.tenant_id;
            if (fbTenantId) {
              // Bucket PRIVATE — yol UUID prefix'iyle başlar (helper yetki kontrolü için)
              var dosyaAdi = fbTenantId + '/feedback/' + Date.now() + '.jpg';
              var yukle = await supa.storage.from('arespipe-dosyalar').upload(dosyaAdi, blob, { contentType: 'image/jpeg' });
              if (!yukle.error) {
                // Path saklanır — admin panel signed URL'i ARES.dosyaUrlAl ile alır
                fotograf_url = dosyaAdi;
              } else {
                // Storage başarısız — base64 data URL olarak kaydet
                console.warn('[FB] Storage upload hatası, base64 kullanılıyor:', yukle.error.message);
                fotograf_url = _fbFotoData;
              }
            } else {
              // Tenant yok (anonim/giriş yapmamış) — base64 olarak sakla
              fotograf_url = _fbFotoData;
            }
          } catch(uploadErr) {
            fotograf_url = _fbFotoData; // her türlü hata — base64 fallback
          }
        }

        var kayit = {
          tenant_id: oturum?.tenant_id || null,
          kullanici_id: oturum?.id || null,
          sayfa_url: sayfa,
          kategori: kategori,
          not_: not,
          fotograf_url: fotograf_url,
        };

        var { error } = await supa.from('feedback_kayitlari').insert(kayit);
        if (error) throw new Error(error.message);

        // Başarılı — modalı kapat, not temizle
        document.getElementById('fb-not').value = '';
        window._fbFotoKaldir();
        document.getElementById('ares-feedback-modal').style.display = 'none';

        // Toast göster
        var toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--sur);border:1px solid var(--bor);border-left:3px solid var(--gr);border-radius:10px;padding:12px 20px;font-size:14px;font-weight:600;color:var(--gr);z-index:99999;animation:tin .3s ease;box-shadow:0 8px 24px rgba(0,0,0,.2);';
        toast.textContent = '✓ Geri bildirim gönderildi, teşekkürler!';
        document.body.appendChild(toast);
        setTimeout(function(){ if (toast.parentNode) toast.remove(); }, 3000);

      } catch(e) {
        document.getElementById('fb-hata').textContent = 'Hata: ' + e.message;
        document.getElementById('fb-hata').style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Gönder';
      }
    };

    window._feedbackAc = function() {
      document.getElementById('ares-feedback-modal').style.display = 'flex';
      document.getElementById('fb-not').focus();
    };
  }

})();
