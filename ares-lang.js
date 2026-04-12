// ═══════════════════════════════════════════════════════════════
// ares-lang.js — AresPipe Çeviri Motoru v2
// Çeviriler lang/ klasöründeki JSON dosyalarında.
// Yeni dil eklemek için: lang/fr.json oluştur — başka değişiklik yok.
// ═══════════════════════════════════════════════════════════════
(function(w) {
  'use strict';

  // ── Dil verileri — JSON dosyalarından yüklenir ───────────────
  var _LANG = {
    tr: {}  // TR fallback — sayfa içi metinler kullanılır, JSON gerekmez
  };

  // ── lang/ klasörünün yolu — ares-lang.js'e göre belirlenir ──
  // Böylece sayfanın hangi klasörde olduğundan bağımsız çalışır
  var _langBase = (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('ares-lang.js') !== -1) {
        return src.substring(0, src.lastIndexOf('/') + 1) + 'lang/';
      }
    }
    return 'lang/'; // fallback
  })();

  // ── Dil tespiti ──────────────────────────────────────────────
  function getLang() {
    return document.documentElement.getAttribute('lang') ||
           localStorage.getItem('ares_lang') || 'tr';
  }

  // ── JSON yükleme — senkron XHR (aynı sunucu, küçük dosya) ───
  // Senkron kullanımı: visibility:hidden aktifken çalışır,
  // async promise zinciri gerektirmez, mevcut sayfa kodu değişmez.
  function _loadLang(lang) {
    if (lang === 'tr' || _LANG[lang]) return; // TR fallback, ya da zaten yüklü
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', _langBase + lang + '.json', false); // false = senkron
      xhr.send();
      if (xhr.status === 200) {
        _LANG[lang] = JSON.parse(xhr.responseText);
      } else {
        console.warn('[ares-lang] ' + lang + '.json yüklenemedi: HTTP ' + xhr.status);
      }
    } catch(e) {
      console.warn('[ares-lang] ' + lang + '.json yükleme hatası:', e);
    }
  }

  // Sayfa yüklenirken aktif dili hemen yükle
  _loadLang(getLang());

  // ── Çeviri yardımcısı ────────────────────────────────────────
  function tv(key, fallback) {
    var lang = getLang();
    if (!_LANG[lang]) _loadLang(lang); // dil değiştiyse yükle
    var dict = _LANG[lang];
    if (dict && dict[key] !== undefined) return dict[key];
    return fallback !== undefined ? fallback : key;
  }

  // ── Statik HTML'e çeviri uygula ──────────────────────────────
  function applyI18n() {
    var lang = getLang();
    if (!_LANG[lang]) _loadLang(lang);

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var k = el.getAttribute('data-i18n');
      var isInp = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
      if (!el.hasAttribute('data-i18n-tr'))
        el.setAttribute('data-i18n-tr', isInp ? el.placeholder : el.textContent.trim());
      var v = tv(k, el.getAttribute('data-i18n-tr'));
      if (isInp) { el.placeholder = v; } else { el.textContent = v; }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var k = el.getAttribute('data-i18n-placeholder');
      if (!el.hasAttribute('data-i18n-ph-tr')) el.setAttribute('data-i18n-ph-tr', el.placeholder);
      el.placeholder = tv(k, el.getAttribute('data-i18n-ph-tr'));
    });
  }

  // ── MutationObserver — lang attribute değişince ──────────────
  new MutationObserver(function() {
    var lang = getLang();
    _loadLang(lang); // yeni dili yükle (önbellekte varsa atlar)
    applyI18n();
    if (typeof w._onLangChange === 'function') w._onLangChange();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // ── Sayfa tarafından ek anahtar ekleme (opsiyonel) ───────────
  // Artık gerekmez — tüm anahtarlar JSON'da.
  // Geriye dönük uyumluluk için bırakıldı.
  function extend(lang, keys) {
    if (!_LANG[lang]) _LANG[lang] = {};
    Object.assign(_LANG[lang], keys);
  }


  // ── ENUM ÇEVİRİ FONKSİYONLARI ────────────────────────────────
  // DB'den gelen normalize kodları ekrana çevirir

  function tvMalzeme(kod) {
    var harita = {
      'karbon_celik':  function(){ return tv('cmn_malzeme_karbon',  'Karbon Çelik'); },
      'paslanmaz':     function(){ return tv('cmn_malzeme_paslanmaz','Paslanmaz'); },
      'bakir_alasim':  function(){ return tv('cmn_malzeme_bakir',   'Bakır Alaşım'); },
      'aluminyum':     function(){ return tv('cmn_malzeme_alum',    'Alüminyum'); },
    };
    return (harita[kod] ? harita[kod]() : kod) || kod;
  }

  function tvYuzey(kod) {
    var harita = {
      'asit':     function(){ return tv('cmn_yuzey_asit',    'Asit'); },
      'boyali':   function(){ return tv('cmn_yuzey_boyali',  'Boyalı'); },
      'galvaniz': function(){ return tv('cmn_yuzey_galvaniz','Galvaniz'); },
      'siyah':    function(){ return tv('cmn_yuzey_siyah',   'Siyah'); },
      'epoksi':   function(){ return tv('cmn_yuzey_epoksi',  'Epoksi'); },
    };
    return (harita[kod] ? harita[kod]() : kod) || kod;
  }

  function tvDurum(kod) {
    var harita = {
      'bekliyor':    function(){ return tv('cmn_bekliyor',    'Bekliyor'); },
      'devam_ediyor':function(){ return tv('cmn_devam_ediyor','Devam Ediyor'); },
      'tamamlandi':  function(){ return tv('cmn_tamamlandi',  'Tamamlandı'); },
      'aktif':       function(){ return tv('cmn_aktif',       'Aktif'); },
      'pasif':       function(){ return tv('cmn_pasif',       'Pasif'); },
      'iptal':       function(){ return tv('cmn_iptal',       'İptal'); },
      'kismi':       function(){ return tv('cmn_kismi',       'Kısmi'); },
    };
    return (harita[kod] ? harita[kod]() : kod) || kod;
  }

  function tvUcTipi(kod) {
    var harita = {
      'duz':    function(){ return tv('ks_uc_duz',    'Düz'); },
      'kaynak': function(){ return tv('ks_uc_kaynak', 'Kaynak Ağzı'); },
      'yiv':    function(){ return tv('ks_uc_yiv',    'Yiv'); },
      'dis':    function(){ return tv('ks_uc_dis',    'Diş'); },
      'bukum':  function(){ return tv('ks_uc_bukum',  'Büküm Borusu'); },
    };
    return (harita[kod] ? harita[kod]() : kod) || kod;
  }

  // Global export
  w.tvMalzeme = tvMalzeme;
  w.tvYuzey   = tvYuzey;
  w.tvDurum   = tvDurum;
  w.tvUcTipi  = tvUcTipi;

  // ── Global export ────────────────────────────────────────────
  w.tv         = tv;
  w._applyI18n = applyI18n;
  w._getLang   = getLang;
  if (!w.ARES) w.ARES = {};
  w.ARES.lang  = { tv: tv, apply: applyI18n, extend: extend, getLang: getLang };

})(window);
