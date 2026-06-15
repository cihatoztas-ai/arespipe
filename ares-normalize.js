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
// Son güncelleme: 22 Nisan 2026 (19. oturum — Faz 1: kaliteKod + kaliteGoster eklendi, DB master tablo ile eş)

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
    // 166 (Cihat): yüzey alanı paslanmaz/stainless okuyorsa → asit. Paslanmaz çelik yüzey işlemi
    //   asitlemedir; kaynakta malzeme adı yüzeye sızdığında doğru kanonik kod 'asit'tir.
    if (/paslanmaz|stainless|inox|316|304|321|347/.test(h)) return 'asit';
    if (/galvaniz|galvan/.test(h))   return 'galvaniz';
    if (/siyah|black/.test(h))       return 'siyah';
    if (/boyal|boya|paint/.test(h))  return 'boyali';
    return 'diger';
  }

  // ── KALİTE: ham → canonical kod (19. oturum — master tablo ile eş)
  // DB'deki kalite_kod_normalize() fonksiyonunun JS karşılığı.
  // Kategori isimleri (karbon, paslanmaz...) kalite DEĞİLDİR → null döner.
  // Tanınmayan kalite → null (admin UI'dan master'a eklenmesi beklenir).
  // Döndürülen canonical kodlar master tabloda sistem preset olarak kayıtlıdır.
  function kaliteKod(raw){
    if (raw == null) return null;
    var h = String(raw).trim();
    if (!h) return null;
    h = h.toUpperCase()
         .replace(/Ç/g,'C').replace(/Ğ/g,'G').replace(/İ/g,'I')
         .replace(/Ö/g,'O').replace(/Ş/g,'S').replace(/Ü/g,'U');

    // Kategori isimleri kalite değildir — kesin reddet
    var kategoriIsimleri = [
      'KARBON','PASLANMAZ','BAKIR','ALUM','ALUMINYUM','DIGER','DIĞER',
      'KARBONCELIK','KARBON CELIK','CARBONSTEEL','CARBON STEEL',
      'STAINLESS','COPPER','BAKIRALASIM','BAKIR ALASIM',
      'ALUMINUM','ALUMINIUM','BRONZE','BRASS','PIRINC'
    ];
    if (kategoriIsimleri.indexOf(h) !== -1) return null;

    if (/CUNI|CU-NI|CU NI/.test(h))                            return 'CUNI9010';
    if (/^1[\.\s]?4571$/.test(h) || h==='316TI' || h==='316 TI') return '14571';
    if (/^A\s?312[-\s]?TP?\s?316\s?L$/.test(h))                return 'A312TP316L';
    if (/^A\s?106[-\s]?GR?\s?B$/.test(h) ||
        /^A\s?106[-\s]?B$/.test(h) || h==='A106')               return 'A106B';
    if (/^A\s?53([-\s]?[A-Z])?$/.test(h))                      return 'A53';
    if (/^ST[-\s]?37$/.test(h))                                return 'ST37';
    if (/^S235/.test(h))                                       return 'S235JR';
    if (/^316\s?L$/.test(h))                                   return '316L';
    if (/^304\s?L$/.test(h))                                   return '304L';
    if (h === '316')                                           return '316';
    if (h === '304')                                           return '304';
    if (/^6061[-\s]?T6$/.test(h) || h==='6061')                return '6061T6';

    return null; // Tanımsız kalite (admin UI'dan eklenecek)
  }

  // ── KALİTE: kod → görsel etiket (master tabloda kalite_goster karşılığı)
  // DB fetch olmadan canonical formatı döndürür. Frontend hızlı gösterim için.
  function kaliteGoster(kodOrRaw){
    if (kodOrRaw == null) return '';
    var kod = String(kodOrRaw).toUpperCase().trim();
    if (!kod) return '';
    // Eğer kod değilse önce kod'a çevir
    if (!/^[A-Z0-9]+$/.test(kod.replace(/\s/g,''))) {
      var k = kaliteKod(kodOrRaw);
      if (!k) return String(kodOrRaw).trim(); // bilinmeyeni ham döndür
      kod = k;
    }
    var goster = {
      'ST37':'St 37', 'S235JR':'S235JR', 'A106B':'A106-B', 'A53':'A53',
      '316L':'316L', '304L':'304L', '316':'316', '304':'304',
      '14571':'1.4571', 'A312TP316L':'A312-TP316L',
      'CUNI9010':'CuNi 90/10',
      '6061T6':'6061-T6'
    };
    return goster[kod] || String(kodOrRaw).trim();
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

  // ── MARKA: parçalardan birleşik spool markası oluştur (6. oturum) ────
  // Kullanım:
  //   ARES_NORM.marka(sp.pipeline_no, sp.spool_no)
  //     → "M100-262-302-47-S01"
  //   ARES_NORM.marka(prj.proje_no, sp.pipeline_no, sp.spool_no)
  //     → "NB1137-M100-262-302-47-S01"
  //   ARES_NORM.marka(prj.proje_no, sp.pipeline_no, sp.spool_no, sp.rev)
  //     → "NB1137-M100-262-302-47-S01-R2"
  // Null/undefined/boş parçalar otomatik atlanır.
  function marka(){
    return Array.prototype.slice.call(arguments)
      .map(function(p){ return (p == null ? '' : String(p)).trim(); })
      .filter(Boolean)
      .join('-');
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

  // E-02 marka formatı: rev göstergesi
  // Kurallar:
  //   - boş / null / undefined     → ''  (marka'ya eklenmez)
  //   - "0", "Rev0", "R0", "rev-0" → ''  (rev-0 yok-say)
  //   - "2" veya "Rev2"            → "Rev2"
  //   - "A" veya "RevA"            → "RevA"
  // Kullanım: ARES_NORM.marka(gemi, pipeline, spool_no, ARES_NORM.revFmt(rev))
  function revFmt(rev) {
    if (rev === null || rev === undefined) return '';
    var r = String(rev).trim();
    if (!r) return '';
    // "0", "Rev0", "R0", "rev-0", "rev_0", "rev 0" formatlarını yok say
    if (/^(0+|rev[\s\-_]*0+|r[\s\-_]*0+)$/i.test(r)) return '';
    // Zaten "Rev" ile başlıyorsa olduğu gibi, değilse "Rev" önüne ekle
    return /^rev/i.test(r) ? r : 'Rev' + r;
  }

  // ── KAPSAM ETİKETİ (185) — malzeme iş-akışı sınıfı: imalat | montaj | islem ──
  // MK-185.1: spool_detay malzeme listesinde gösterim çipi (İmalat/Montaj/İşlem).
  //   · imalat = spool'a KAYNAKLA birleşen (boru, dirsek, te, flanş, bilezik/stub,
  //     doubler, sleeve). Kesim/büküm/markalama bu kalemlerle çalışır.
  //   · montaj = sahada eklenen (vana/armatür, civata, somun, conta, rondela,
  //     strainer). Veri SİLİNMEZ; çiple gizlenir (default kapalı). Montaj-ekibi
  //     versiyonunda bu çip açılır — tekrar iş yok.
  //   · islem  = malzeme değil iş (yiv/groove, kaynak). Tersan malzeme listesinde
  //     "işlem" etiketiyle gelir; imalat akışında kalır.
  // DİKKAT: malzeme-kiyas.js'in `kapsam`'ından FARKLI (o PDF↔Excel kıyas beklentisi;
  //   flans orada montaj). Bu UI iş-akışı etiketi — flanş burada imalat (kaynaklı).
  //   Tek kaynak BURASI (global). Backend filtre gerekirse köprü ileride kurulur.
  var _KAPSAM_ISLEM  = ['kaynak','welding','weld','yiv','groove','thread','tornalama','dis cekme','lehim','solder','braze'];
  var _KAPSAM_MONTAJ = ['vana','valve','armatur','strainer','suzgec','civata','bolt','stud','somun','nut','conta','gasket','seal','rondela','washer','nipel','nipple','u-bolt','u bolt'];
  var _KAPSAM_IMALAT = ['boru','pipe','tube','dirsek','elbow','bend','tee','branch','reduksiyon','reducer','reduction','konik','kapak','blind','kor tapa','cap','bilezik','ring','collar','stub','flans','flange','doubler','sleeve'];
  function _kapsamGecer(hamAscii, kw){
    var k = kw.toLowerCase();
    var re = new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '([^a-z0-9]|$)');
    return re.test(hamAscii);
  }
  // Öncelik: islem > montaj > imalat. Bilinmeyen → imalat (güvenli varsayım).
  function kapsamEtiket(tanim){
    var h = _ascii(tanim);
    if(!h) return 'imalat';
    for(var i=0;i<_KAPSAM_ISLEM.length;i++)  if(_kapsamGecer(h,_KAPSAM_ISLEM[i]))  return 'islem';
    for(var j=0;j<_KAPSAM_MONTAJ.length;j++) if(_kapsamGecer(h,_KAPSAM_MONTAJ[j])) return 'montaj';
    for(var k=0;k<_KAPSAM_IMALAT.length;k++) if(_kapsamGecer(h,_KAPSAM_IMALAT[k])) return 'imalat';
    return 'imalat';
  }

  // Namespace
  g.ARES_NORM = {
    malzemeKod: malzemeKod,     yuzeyKod: yuzeyKod,     durumKod: durumKod,
    kaliteKod:  kaliteKod,      kaliteGoster: kaliteGoster,
    tvMalzeme:  tvMalzeme,      tvYuzey:  tvYuzey,      tvDurum:  tvDurum,
    malzemeEtiket: malzemeEtiket,
    yuzeyEtiket:   yuzeyEtiket,
    durumEtiket:   durumEtiket,
    uyumlu: uyumlu,
    uyumluYuzeyler: uyumluYuzeyler,
    marka: marka,
    revFmt: revFmt,
    kapsamEtiket: kapsamEtiket,
    _ascii: _ascii,
  };

  // spool_detay.html geriye uyumluluğu — global tvMalzeme/tvYuzey
  if (typeof g.tvMalzeme !== 'function') g.tvMalzeme = tvMalzeme;
  if (typeof g.tvYuzey   !== 'function') g.tvYuzey   = tvYuzey;
  if (typeof g.tvDurum   !== 'function') g.tvDurum   = tvDurum;

})(window);
