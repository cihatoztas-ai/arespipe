// ares-normalize.js — AresPipe ortak enum normalize + çeviri modülü
//
// Amaç: malzeme/yüzey/durum değerlerini tek kaynak üzerinden yönetmek.
//  - DB'de KOD saklanır (karbon, paslanmaz, asit, bekliyor, …)
//  - Okuma tarafı legacy Türkçe'yi de kabul eder (geriye uyumluluk)
//  - tv() wrapper'ları ile dil bağımsız etiketler üretir
//  - Malzeme-yüzey uyum kontrolü (5. oturum)
//
// Kullanım:
//   ARES_NORM.malzemeEtiket('Karbon Çelik')  → "Karbon Çelik" / "Carbon Steel" / "..."
//   ARES_NORM.malzemeKod('ST37')             → "karbon"
//   ARES_NORM.yuzeyEtiket(s.yuzey)           → lokalize etiket
//   ARES_NORM.durumEtiket('devam_ediyor')    → lokalize etiket
//   ARES_NORM.uyumlu('paslanmaz','galvaniz') → false
//   ARES_NORM.uyumluYuzeyler('paslanmaz')    → ['asit','diger']
//
// Script yükleme sırası (CLAUDE.md):
//   ares-store.js → ares-lang.js → ares-normalize.js → ares-layout.js
//
// Son güncelleme: 20 Nisan 2026 (5. oturum — malzeme-yüzey uyum matrisi)

(function(g){
  'use strict';

  // Türkçe karakterleri ASCII'ye indir + lowercase
  function _ascii(s){
    return String(s||'').toLowerCase()
      .replace(/ı/g,'i').replace(/İ/g,'i')
      .replace(/ç/g,'c').replace(/Ç/g,'c')
      .replace(/ğ/g,'g').replace(/Ğ/g,'g')
      .replace(/ş/g,'s').replace(/Ş/g,'s')
      .replace(/ü/g,'u').replace(/Ü/g,'u')
      .replace(/ö/g,'o').replace(/Ö/g,'o')
      .trim();
  }

  // ── MALZEME: ham → kod ────────────────────────────────────────────
  function malzemeKod(raw){
    var h = _ascii(raw);
    if (!h) return '';
    if (['karbon','paslanmaz','bakir','alum','diger'].indexOf(h) !== -1) return h;
    if (/st37|s235|s275|a106|a53|a333|karbon|carbon|celik/.test(h))      return 'karbon';
    if (/316|304|321|347|paslanmaz|stainless|inox/.test(h))              return 'paslanmaz';
    if (/cuni|cu-ni|bakir|copper|bronze|pirinc|brass/.test(h))           return 'bakir';
    if (/alum|aluminum|aluminium|al-/.test(h))                           return 'alum';
    return 'diger';
  }

  // ── YÜZEY: ham → kod ──────────────────────────────────────────────
  function yuzeyKod(raw){
    var h = _ascii(raw);
    if (!h) return '';
    if (['asit','galvaniz','siyah','boyali','diger'].indexOf(h) !== -1) return h;
    if (/asit|acid/.test(h))         return 'asit';
    if (/galvaniz|galvan/.test(h))   return 'galvaniz';
    if (/siyah|black/.test(h))       return 'siyah';
    if (/boyal|boya|paint/.test(h))  return 'boyali';
    return 'diger';
  }

  // ── DURUM: is_durumu zaten kod; normalize için ────────────────────
  function durumKod(raw){
    var h = _ascii(raw);
    if (!h) return '';
    if (['bekliyor','devam_ediyor','tamamlandi','iptal'].indexOf(h) !== -1) return h;
    return h.replace(/\s+/g,'_');
  }

  // ── UYUM: malzeme + yüzey kombinasyon kontrolü (5. oturum) ────────
  // Matris kararları:
  //   karbon, diger malzeme → tüm yüzeyler serbest
  //   paslanmaz, bakir      → sadece asit (+ yuzey=diger özel işlem)
  //   alum                  → asit + boyali (+ yuzey=diger)
  // yuzey='diger' her malzemeyle uyumlu (özel işlem açıklaması verilecek)
  // Mal veya yüzey boş/NULL ise uyumlu kabul edilir (henüz girilmemiş)
  function uyumlu(malKodOrRaw, yuzKodOrRaw){
    if (!malKodOrRaw || !yuzKodOrRaw) return true;
    var mal = malzemeKod(malKodOrRaw);
    var yuz = yuzeyKod(yuzKodOrRaw);
    if (!mal || !yuz) return true;
    if (mal === 'diger' || yuz === 'diger') return true;
    if (mal === 'paslanmaz' && (yuz === 'galvaniz' || yuz === 'siyah' || yuz === 'boyali')) return false;
    if (mal === 'bakir'     && (yuz === 'galvaniz' || yuz === 'siyah' || yuz === 'boyali')) return false;
    if (mal === 'alum'      && (yuz === 'galvaniz' || yuz === 'siyah')) return false;
    return true;
  }

  // Belirli bir malzeme için izinli yüzey kodlarını dizi olarak dön.
  // UI tarafında radio disable mantığı için pratik:
  //   var izinli = ARES_NORM.uyumluYuzeyler('paslanmaz');  // ['asit','diger']
  //   radio.disabled = (izinli.indexOf(radio.value) === -1);
  function uyumluYuzeyler(malKodOrRaw){
    var mal = malKodOrRaw ? malzemeKod(malKodOrRaw) : '';
    if (!mal || mal === 'karbon' || mal === 'diger') {
      return ['asit','galvaniz','siyah','boyali','diger'];
    }
    if (mal === 'paslanmaz' || mal === 'bakir') return ['asit','diger'];
    if (mal === 'alum')                         return ['asit','boyali','diger'];
    return ['asit','galvaniz','siyah','boyali','diger'];
  }

  // ── tv() yardımcıları ─────────────────────────────────────────────
  function _tvFn(){ return g._tv || g.tv || function(k,f){return f||k;}; }

  function tvMalzeme(kodOrRaw, fb){
    var kod = kodOrRaw;
    if (kod && !/^[a-z_]+$/.test(String(kod))) kod = malzemeKod(kod);
    if (!kod) return fb || '—';
    var def = { karbon:'Karbon Çelik', paslanmaz:'Paslanmaz',
                bakir:'Bakır Alaşım', alum:'Alüminyum', diger:'Diğer' }[kod]
              || fb || kod;
    return _tvFn()('cmn_malzeme_'+kod, def);
  }

  function tvYuzey(kodOrRaw, fb){
    var kod = kodOrRaw;
    if (kod && !/^[a-z_]+$/.test(String(kod))) kod = yuzeyKod(kod);
    if (!kod) return fb || '—';
    var def = { asit:'Asit', galvaniz:'Galvaniz', siyah:'Siyah',
                boyali:'Boya', diger:'Diğer' }[kod] || fb || kod;
    return _tvFn()('cmn_yuzey_'+kod, def);
  }

  function tvDurum(kodOrRaw, fb){
    var kod = durumKod(kodOrRaw);
    if (!kod) return fb || '—';
    var def = { bekliyor:'Bekliyor', devam_ediyor:'Devam Ediyor',
                tamamlandi:'Tamamlandı', iptal:'İptal' }[kod] || fb || kod;
    return _tvFn()('cmn_durum_'+kod, def);
  }

  // Kısa yol: ham → etiket (en sık kullanım)
  function malzemeEtiket(raw){ return raw ? tvMalzeme(malzemeKod(raw), raw) : '—'; }
  function yuzeyEtiket(raw){   return raw ? tvYuzey(yuzeyKod(raw), raw)     : '—'; }
  function durumEtiket(raw){   return raw ? tvDurum(durumKod(raw), raw)     : '—'; }

  // Namespace
  g.ARES_NORM = {
    malzemeKod: malzemeKod,     yuzeyKod: yuzeyKod,     durumKod: durumKod,
    tvMalzeme:  tvMalzeme,      tvYuzey:  tvYuzey,      tvDurum:  tvDurum,
    malzemeEtiket: malzemeEtiket,
    yuzeyEtiket:   yuzeyEtiket,
    durumEtiket:   durumEtiket,
    uyumlu: uyumlu,
    uyumluYuzeyler: uyumluYuzeyler,
    _ascii: _ascii,
  };

  // spool_detay.html geriye uyumluluğu — global tvMalzeme/tvYuzey
  if (typeof g.tvMalzeme !== 'function') g.tvMalzeme = tvMalzeme;
  if (typeof g.tvYuzey   !== 'function') g.tvYuzey   = tvYuzey;
  if (typeof g.tvDurum   !== 'function') g.tvDurum   = tvDurum;

})(window);
