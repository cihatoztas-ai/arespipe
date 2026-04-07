/**
 * AresPipe Store — v2.3
 * Supabase entegrasyonlu veri katmanı.
 * Supabase CDN'i otomatik yükler — HTML'e ek script gerekmez.
 *
 * Değişiklikler v2.3:
 * - is_emri prefix: I → P (P26-xxx formatı)
 * - SYOS alias kaldırıldı (A2 ihlali)
 *
 * Değişiklikler v2.2:
 * - CDN yüklenince mod otomatik 'supabase'e geçer
 * - girisYap sonrası mod otomatik güncellenir
 * - sonrakiNo → Supabase sequence (G-07)
 * - oturumKontrol → JWT'den okur, DB'ye gitmez (G-06)
 * - soft_delete() entegrasyonu (G-12)
 */

const ARES = (function () {
  'use strict'; // ✅ A1

  // ── SUPABASE BAĞLANTI ────────────────────────────────────
  const SUPA_URL = 'https://ochvbepfiatzvyknkvsn.supabase.co';
  const SUPA_KEY = 'sb_publishable_82EjJYZH9phnFC1MlIxnwQ_92Ic-4eb';
  const SUPA_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  const SUPA_CDN_FALLBACK = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js';

  let _supa      = null;
  let _supaHazir = false;
  let _supaKuyruk = [];

  function _supaBaslat() {
    try {
      if (typeof window !== 'undefined' && window.supabase) {
        _supa      = window.supabase.createClient(SUPA_URL, SUPA_KEY);
        _supaHazir = true;
        console.log('[ARES] Supabase bağlantısı kuruldu');
        // Modu otomatik supabase'e al
        _modSetLocal('supabase');
        mod = 'supabase';
        // Kuyruktaki bekleyenleri çöz
        _supaKuyruk.forEach(function (fn) { fn(); });
        _supaKuyruk = [];
        return true;
      }
    } catch (e) {
      console.warn('[ARES] Supabase başlatılamadı:', e.message);
    }
    return false;
  }

  function _cdnYukle() {
    if (document.querySelector('script[data-ares-supa]')) return;
    var s   = document.createElement('script');
    s.src   = SUPA_CDN;
    s.setAttribute('data-ares-supa', '1');
    s.onload  = function () { _supaBaslat(); };
    s.onerror = function () {
      console.warn('[ARES] Ana CDN başarısız, yedek deneniyor...');
      var s2   = document.createElement('script');
      s2.src   = SUPA_CDN_FALLBACK;
      s2.setAttribute('data-ares-supa', '1');
      s2.onload  = function () { _supaBaslat(); };
      s2.onerror = function () { console.warn('[ARES] Supabase CDN yüklenemedi'); };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  }

  function _supaHazirBekle() {
    return new Promise(function (resolve) {
      if (_supaHazir && _supa) { resolve(); return; }
      _supaKuyruk.push(resolve);
    });
  }

  // ── MOD ──────────────────────────────────────────────────
  function _modSetLocal(yeniMod) {
    localStorage.setItem('ares_mod', yeniMod);
  }
  let mod = localStorage.getItem('ares_mod') || 'local';

  function modDegistir(yeniMod) {
    mod = yeniMod;
    _modSetLocal(yeniMod);
    console.log('[ARES] Mod:', yeniMod);
  }

  // ── OTURUM ───────────────────────────────────────────────
  let _oturum = null;

  async function girisYap(email, sifre) {
    await _supaHazirBekle();
    if (!_supa) return { hata: 'Supabase bağlı değil' };
    const { data, error } = await _supa.auth.signInWithPassword({ email, password: sifre });
    if (error) return { hata: error.message };

    // G-06: JWT claims'den tenant_id ve rol oku
    const jwt     = data.session?.access_token;
    const claims  = jwt ? JSON.parse(atob(jwt.split('.')[1])) : {};

    _oturum = {
      id:        data.user.id,
      tenant_id: claims.tenant_id || null,
      rol:       claims.rol       || null,
      ad_soyad:  data.user.user_metadata?.ad_soyad || email,
    };

    // Mod supabase'e geç
    modDegistir('supabase');
    return { kullanici: _oturum };
  }

  async function cikisYap() {
    if (_supa) await _supa.auth.signOut();
    _oturum = null;
    modDegistir('local');
    localStorage.removeItem('ares_oturum');
  }

  // G-06: DB'ye gitmeden JWT'den oku
  async function oturumKontrol() {
    if (!_supa) return null;
    const { data: { session } } = await _supa.auth.getSession();
    if (!session) return null;

    const jwt    = session.access_token;
    const claims = jwt ? JSON.parse(atob(jwt.split('.')[1])) : {};

    _oturum = {
      id:        session.user.id,
      tenant_id: claims.tenant_id || null,
      rol:       claims.rol       || null,
      ad_soyad:  session.user.user_metadata?.ad_soyad || session.user.email,
    };

    // Claims dolu değilse (eski token) DB'den tamamla
    if (!_oturum.tenant_id) {
      const { data: kul } = await _supa
        .from('kullanicilar')
        .select('tenant_id, rol, ad_soyad')
        .eq('id', session.user.id)
        .single();
      if (kul) {
        _oturum.tenant_id = kul.tenant_id;
        _oturum.rol       = kul.rol;
        _oturum.ad_soyad  = kul.ad_soyad;
      }
    }

    modDegistir('supabase');
    return _oturum;
  }

  function oturumAl()  { return _oturum; }
  function tenantId()  { return _oturum?.tenant_id || null; }

  // ── LOCALSTORAGE YARDIMCILARI ────────────────────────────
  function _lget(key) {
    try { return JSON.parse(localStorage.getItem('ares_' + key)) || null; }
    catch { return null; }
  }
  function _lset(key, val) {
    try { localStorage.setItem('ares_' + key, JSON.stringify(val)); return true; }
    catch { return false; }
  }
  function _ldel(key) { localStorage.removeItem('ares_' + key); }

  // ── LOG ──────────────────────────────────────────────────
  async function logEkle(islem, aciklama, katman, katmanId, meta) {
    if (mod === 'supabase' && _supa) {
      const { error } = await _supa.from('islem_log').insert({
        tenant_id: tenantId(),
        islem,
        aciklama,
        katman:    katman   || 'sistem',
        katman_id: katmanId || null,
        yapan_id:  _oturum?.id || null,
        meta:      meta || null,
        spool_id:  meta?.spool_id  || null,
        devre_id:  meta?.devre_id  || null,
        proje_id:  meta?.proje_id  || null,
      });
      if (error) console.warn('[ARES] Log hatası:', error.message);
    } else {
      const log = _lget('islemLog') || [];
      log.unshift({
        id:       'L' + Date.now(),
        tarih:    new Date().toLocaleString('tr-TR'),
        islem, aciklama,
        katman:   katman   || 'sistem',
        katmanId: katmanId || '',
        meta:     meta || {}
      });
      _lset('islemLog', log.slice(0, 1000));
    }
  }

  // ── NUMARA ÜRETİCİ — G-07 Sequence ──────────────────────
  // Config DB'den okunur (sayac_tanimlari), hardcode prefix yok.
  // tanimlar.html "Kod Serileri" sekmesinden kullanıcı duzenleyebilir.

  let _sayacConfig = null; // cache — sayacConfigSifirla() ile temizlenir

  const _SAYAC_VARSAYILAN = {
    is_emri:    { prefix: 'P', yil_ekle: true,  digits: 3, aciklama: 'Is Emri Numarasi'  },
    hakedis_no: { prefix: 'H', yil_ekle: true,  digits: 3, aciklama: 'Hakedis Numarasi'  },
    sevkiyat:   { prefix: 'S', yil_ekle: true,  digits: 3, aciklama: 'Sevkiyat Numarasi' },
    spool:      { prefix: '',  yil_ekle: false, digits: 4, aciklama: 'Spool Kisa Kod'    },
  };

  async function _sayacConfigYukle() {
    if (mod === 'supabase' && _supa) {
      const { data } = await _supa
        .from('sayac_tanimlari')
        .select('tip, prefix, yil_ekle, digits, son_no, aciklama')
        .eq('tenant_id', tenantId());
      if (data && data.length) {
        _sayacConfig = {};
        data.forEach(r => { _sayacConfig[r.tip] = r; });
        return;
      }
    }
    _sayacConfig = {};
  }

  function _sayacCfgAl(tip) {
    const db = _sayacConfig && _sayacConfig[tip];
    if (db && (db.prefix !== undefined || db.digits)) return db;
    return _SAYAC_VARSAYILAN[tip] || { prefix: '', yil_ekle: false, digits: 4 };
  }

  function _noFormatla(cfg, rawNo) {
    const yil = cfg.yil_ekle ? new Date().getFullYear().toString().slice(-2) : '';
    const sep = cfg.yil_ekle ? '-' : '';
    return (cfg.prefix || '') + yil + sep + String(rawNo).padStart(cfg.digits || 3, '0');
  }

  async function sonrakiNo(tip) {
    if (!_sayacConfig) await _sayacConfigYukle();
    const cfg = _sayacCfgAl(tip);
    if (mod === 'supabase' && _supa) {
      const { data, error } = await _supa.rpc('sonraki_no', { p_tip: tip });
      if (!error && data != null) return _noFormatla(cfg, data);
      // ✅ FIX: sessiz hata yerine açık log
      console.error('[ARES] sonrakiNo RPC basarisiz — local fallback:', tip,
        'error:', error ? error.message : '(yok)', 'data:', data, 'tenant:', tenantId());
    } else {
      console.error('[ARES] sonrakiNo — Supabase bagli degil, local fallback:',
        'mod:', mod, 'supa:', !!_supa);
    }
    return _sonrakiNoLocal(tip, cfg);
  }

  function _sonrakiNoLocal(tip, cfg) {
    const sayaclar = _lget('sayaclar') || {};
    const no = _noFormatla(cfg, sayaclar[tip] || 1);
    sayaclar[tip] = (sayaclar[tip] || 1) + 1;
    _lset('sayaclar', sayaclar);
    return no;
  }

  function sayacConfigSifirla() { _sayacConfig = null; }

  // ── SOFT DELETE — G-12 ───────────────────────────────────
  async function softSil(tablo, id) {
    if (mod === 'supabase' && _supa) {
      const { error } = await _supa.rpc('soft_delete', { p_tablo: tablo, p_id: id });
      if (error) { console.warn('[ARES] Soft delete hatası:', error.message); return false; }
      await logEkle('SİLİNDİ', tablo + ' kaydı silindi', tablo, id, {});
      return true;
    }
    return false;
  }

  // ── TERSANELER ───────────────────────────────────────────
  async function tersaneleriGetir() {
    if (mod === 'supabase' && _supa) {
      const { data, error } = await _supa
        .from('tersaneler')
        .select('*')
        .eq('aktif', true)
        .order('ad');
      if (error) { console.warn(error); return []; }
      return data;
    }
    return _lget('tersaneler') || [];
  }

  // ── PROJELER ─────────────────────────────────────────────
  async function projeleriGetir(tersaneId) {
    if (mod === 'supabase' && _supa) {
      let q = _supa.from('projeler').select('*, tersaneler(ad)').eq('aktif', true).order('proje_no');
      if (tersaneId) q = q.eq('tersane_id', tersaneId);
      const { data, error } = await q;
      if (error) { console.warn(error); return []; }
      return data;
    }
    const tum = _lget('projeler') || [];
    return tersaneId ? tum.filter(p => p.tersaneId === tersaneId) : tum;
  }

  // ── DEVRELER ─────────────────────────────────────────────
  async function devreleriGetir(projeId) {
    if (mod === 'supabase' && _supa) {
      let q = _supa.from('devreler')
        .select('*, projeler(proje_no, gemi_adi, tersaneler(ad))')
        .order('devre_no');
      if (projeId) q = q.eq('proje_id', projeId);
      const { data, error } = await q;
      if (error) { console.warn(error); return []; }
      return data;
    }
    const tum = _lget('devreler') || [];
    return projeId ? tum.filter(d => d.projeId === projeId) : tum;
  }

  async function devreGetir(id) {
    if (mod === 'supabase' && _supa) {
      const { data, error } = await _supa
        .from('devreler')
        .select('*, projeler(proje_no, gemi_adi, is_emri_no, tersaneler(ad,kod))')
        .eq('id', id)
        .single();
      if (error) { console.warn(error); return null; }
      return data;
    }
    return (_lget('devreler') || []).find(d => d.id === id) || null;
  }

  // ── SPOOLLER ─────────────────────────────────────────────
  async function spoollariGetir(devreId) {
    if (mod === 'supabase' && _supa) {
      let q = _supa.from('spooller')
        .select('*, devreler(devre_no, proje_id, projeler(proje_no, gemi_adi))')
        .order('spool_no');
      if (devreId) q = q.eq('devre_id', devreId);
      const { data, error } = await q;
      if (error) { console.warn(error); return []; }
      return data;
    }
    const tum = _lget('spooller') || [];
    return devreId ? tum.filter(s => s.devreId === devreId) : tum;
  }

  async function spoolGetir(id) {
    if (mod === 'supabase' && _supa) {
      const { data, error } = await _supa
        .from('spooller')
        .select(`
          *,
          devreler(devre_no, alistirma_devresi,
            projeler(proje_no, gemi_adi, is_emri_no,
              tersaneler(ad, kod)
            )
          ),
          spool_malzemeleri(*),
          notlar(*),
          fotograflar(*),
          belgeler(*)
        `)
        .eq('id', id)
        .single();
      if (error) { console.warn(error); return null; }
      return data;
    }
    return (_lget('spooller') || []).find(s => s.id === id) || null;
  }

  async function spoolGuncelle(id, degisiklikler) {
    if (mod === 'supabase' && _supa) {
      const { data, error } = await _supa
        .from('spooller')
        .update({ ...degisiklikler, guncelleme: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) { console.warn(error); return null; }
      return data;
    }
    const liste = _lget('spooller') || [];
    const idx   = liste.findIndex(s => s.id === id);
    if (idx === -1) return null;
    liste[idx] = { ...liste[idx], ...degisiklikler };
    _lset('spooller', liste);
    return liste[idx];
  }

  async function spoolDurdur(id, sebep, aciklama) {
    await spoolGuncelle(id, {
      durduruldu:       true,
      durdurma_sebebi:  sebep + ': ' + aciklama,
      durdurma_tarihi:  new Date().toISOString(),
    });
    await logEkle('DURDURMA', sebep + ' — ' + aciklama, 'spool', id, { spool_id: id });
    return true;
  }

  async function spoolDurdurmaKaldir(id) {
    await spoolGuncelle(id, { durduruldu: false, durdurma_sebebi: null, durdurma_tarihi: null });
    await logEkle('DURDURMA_KALDIRILDI', '', 'spool', id, { spool_id: id });
    return true;
  }

  // ── MALZEME LİSTESİ ──────────────────────────────────────
  async function malzemeleriGetir(spoolId) {
    if (mod === 'supabase' && _supa) {
      const { data, error } = await _supa
        .from('spool_malzemeleri')
        .select('*')
        .eq('spool_id', spoolId)
        .order('olusturma');
      if (error) { console.warn(error); return []; }
      return data;
    }
    return _lget('malzemeler_' + spoolId) || [];
  }

  // ── İŞLEM LOGU ───────────────────────────────────────────
  async function loguGetir(filtre, limit) {
    if (mod === 'supabase' && _supa) {
      let q = _supa.from('islem_log')
        .select('*, kullanicilar(ad_soyad)')
        .order('olusturma', { ascending: false });
      if (filtre?.katman)  q = q.eq('katman', filtre.katman);
      if (filtre?.spoolId) q = q.eq('spool_id', filtre.spoolId);
      if (filtre?.devreId) q = q.eq('devre_id', filtre.devreId);
      if (limit)           q = q.limit(limit);
      const { data, error } = await q;
      if (error) { console.warn(error); return []; }
      return data;
    }
    let log = _lget('islemLog') || [];
    if (filtre?.spoolId) log = log.filter(l => l.meta?.spool_id === filtre.spoolId);
    return limit ? log.slice(0, limit) : log;
  }

  // ── UYARILAR ─────────────────────────────────────────────
  function uyarilariGetir() { return _lget('uyarilar') || []; }

  function uyariEkle(kategori, seviye, baslik, aciklama, kaynak, link, ikon) {
    const liste = _lget('uyarilar') || [];
    const no    = 'U' + Date.now();
    liste.unshift({
      id: no, kategori, seviye, goruldu: false,
      baslik, aciklama, kaynak, link: link || '',
      olusturma: new Date().toLocaleString('tr-TR'),
      ikon: ikon || '⚠️'
    });
    _lset('uyarilar', liste);
    return no;
  }

  function uyariGoruldu(id) {
    const liste = _lget('uyarilar') || [];
    const u     = liste.find(x => x.id === id);
    if (u) { u.goruldu = true; _lset('uyarilar', liste); }
  }

  function uyariYeniSayisi() {
    return (_lget('uyarilar') || []).filter(u => !u.goruldu).length;
  }

  // ── BASAMAK SNAPSHOT (M-09) ──────────────────────────────
  async function basamaklariGetir() {
    if (mod === 'supabase' && _supa) {
      const { data, error } = await _supa
        .from('basamak_tanimlari')
        .select('*')
        .eq('aktif', true)
        .order('sira');
      if (error) { console.warn(error); return []; }
      return data;
    }
    return _lget('basamakTanimlari') || [
      { sistem_adi: 'on_imalat',  gorunen_ad: 'Ön İmalat',  sira: 1 },
      { sistem_adi: 'imalat',     gorunen_ad: 'İmalat',     sira: 2 },
      { sistem_adi: 'kaynak',     gorunen_ad: 'Kaynak',     sira: 3 },
      { sistem_adi: 'on_kontrol', gorunen_ad: 'Ön Kontrol', sira: 4 },
      { sistem_adi: 'kk',         gorunen_ad: 'KK',         sira: 5 },
      { sistem_adi: 'sevkiyat',   gorunen_ad: 'Sevkiyat',   sira: 6 },
    ];
  }

  async function basamakSnapshotOlustur() {
    const basamaklar = await basamaklariGetir();
    return basamaklar.map(b => ({
      sistem_adi: b.sistem_adi,
      gorunen_ad: b.gorunen_ad,
      sira:       b.sira
    }));
  }

  // ── UI: BELL GÜNCELLE ────────────────────────────────────
  function bellGuncelle() {
    const n         = uyariYeniSayisi();
    const bellSayac = document.getElementById('bellSayac');
    const navBadge  = document.getElementById('navBadge');
    if (n > 0) {
      if (bellSayac) { bellSayac.textContent = n; bellSayac.style.display = 'flex'; }
      if (navBadge)  { navBadge.textContent  = n; navBadge.style.display  = 'flex'; }
    } else {
      if (bellSayac) bellSayac.style.display = 'none';
      if (navBadge)  navBadge.style.display  = 'none';
    }
  }

  // ── SIFIRLA (debug) ──────────────────────────────────────
  function sifirla() {
    ['spooller','devreler','projeler','tersaneler','uyarilar',
     'islemLog','sayaclar','initialized','mod'].forEach(k => _ldel(k));
    console.log('[ARES] Store sıfırlandı');
  }

  // ── INIT ─────────────────────────────────────────────────
  (function _init() {
    if (typeof window !== 'undefined') {
      if (window.supabase) {
        _supaBaslat();
      } else {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', _cdnYukle);
        } else {
          _cdnYukle();
        }
      }
    }
  })();

  document.addEventListener('DOMContentLoaded', function () {
    bellGuncelle();
  });

  // ── PUBLIC API ───────────────────────────────────────────
  return {
    get mod() { return mod; },
    modDegistir,
    supabase: function () { return _supa; },

    // Oturum
    girisYap, cikisYap, oturumKontrol, oturumAl, tenantId,

    // Veri
    tersaneleriGetir,
    projeleriGetir,
    devreleriGetir, devreGetir,
    spoollariGetir, spoolGetir, spoolGuncelle,
    spoolDurdur, spoolDurdurmaKaldir,
    malzemeleriGetir,
    loguGetir, logEkle,
    basamaklariGetir, basamakSnapshotOlustur,

    // Uyarılar
    uyarilariGetir, uyariEkle, uyariGoruldu, uyariYeniSayisi,

    // Numara (async — G-07)
    sonrakiNo,
    sayacConfigSifirla,

    // Silme (G-12)
    softSil,

    // UI
    bellGuncelle,

    // Debug
    sifirla,
  };

})();
