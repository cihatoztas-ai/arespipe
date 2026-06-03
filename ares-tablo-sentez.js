// ares-tablo-sentez.js — Tablo Motoru sentez çekirdeği (151. oturum / Increment 2)
//
// Amaç: AI'ın okuduğu malzeme satırı DEĞERLERİNDEN (kod yazmadan) deterministik
//   satir_tipleri sentezle (FORMAT-TANITMA-TABLO-TASARIM.md §4.1). İlke (150, kilitli):
//   AI değer BULUR, kural yazmaz — kuralı bu modül sentezler; kanıt = kural çıktısı == AI değeri.
//
// Tek kaynak (MK-126.8): aynı modül hem format_tanit.html'de (script src) hem
//   test-tablo-motoru.mjs'te (Node) koşar. mtCikar(), lib/l2-parser.malzemeTablosuCikar'ın
//   grup_haritasi dalının BİREBİR eşleniğidir (sözleşme §4.3 — değişmez).
//
// Bağımlılık (runtime resolve, ares-olcu deseni): ARES_OLCU (o da ARES_BORU'ya devreder).
//
// Çıktı sözleşmesi — sentezle(canonText, aiSatirlar):
//   { satir_tipleri:[{ad,kategori,tetikleyici_regex,pattern,grup_haritasi}],
//     baslik_tetikleyici:string|null,
//     rapor:{ satirlar:[{idx,tanim,durum:'yesil'|'kirmizi',sebep,satir}], yesil,kirmizi },
//     dominant:{dis_cap,et,dn,sch,_et_kaynak}|null }
//
// Son güncelleme: 3 Haziran 2026 (151. oturum)

(function(g){
  'use strict';

  function _olcu(){
    if (typeof ARES_OLCU !== 'undefined' && ARES_OLCU) return ARES_OLCU;
    if (typeof window !== 'undefined' && window.ARES_OLCU) return window.ARES_OLCU;
    if (typeof globalThis !== 'undefined' && globalThis.ARES_OLCU) return globalThis.ARES_OLCU;
    return null;
  }

  function escRe(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // kalite metni → ARES_BORU malzeme anahtarı (lookup köprüsü; _malzemeNorm 'AISI 316L' hamını tanımaz)
  function kaliteMalzeme(kalite){
    var s = String(kalite || '').toUpperCase();
    if (/CUNI|CU-NI|90\/10|70\/30/.test(s)) return 'cunife';
    if (/316|304|AISI|PASLANMAZ|ST\.?\s?ST|\bSS\b|14571/.test(s)) return 'paslanmaz';
    if (/AL[UÜ]M|6061|6063/.test(s)) return 'aluminyum';
    return 'karbon'; // ST37/S235/bilinmeyen — OD karbon=paslanmaz aynı, et farkı asme zincirine kalır
  }

  // AI kategori → l2 kategori (PIPES→boru; FITTINGS/FLANGES→fitting; ağırlıksız/kaynak→islem)
  function kategoriCevir(r){
    var k = String(r.kategori || '').toUpperCase();
    var t = String(r.tanim || '');
    if (/KAYNA|GROOVE|SAHA/i.test(t)) return 'islem';
    if (r.agirlik_kg == null && !/PIPE/i.test(k)) return 'islem';
    if (/PIPE|BORU/.test(k)) return 'boru';
    if (/FITTING|FLANGE|FLAN/.test(k)) return 'fitting';
    return 'islem';
  }

  // ── değer avı: v'nin satırdaki span'ı. Yapışık metin kuralı (Cadmatic):
  //   önceki karakter rakamsa SADECE mevcut bir span'ın bitişiğindeyse kabul ('ST37|12.3', '4.5|979');
  //   sonraki karakter rakam/ondalıksa red ('12.3' ≠ '12.34' öneki).
  function degerSpan(line, v, spans, sondan){
    var sv = String(v == null ? '' : v); if (!sv) return null;
    var num = parseFloat(sv.replace(',', '.'));
    var formlar = [sv]; if (sv.indexOf('.') > -1) formlar.push(sv.replace('.', ','));
    var hits = [];
    formlar.forEach(function(f){
      var i = -1;
      while ((i = line.indexOf(f, i + 1)) > -1){
        var end = i + f.length;
        // sondaki-sıfır genişlemesi: PDF '4.3820' yazar, AI '4.382' döner — sayısal değer
        // EŞİT kaldığı sürece takip eden rakamları span'a kat ('10'→'100' eşit değil, katılmaz)
        if (!isNaN(num)){
          while (end < line.length && /\d/.test(line[end])){
            var aday = parseFloat(line.slice(i, end + 1).replace(',', '.'));
            if (Math.abs(aday - num) < 1e-9) end++; else break;
          }
        }
        var b = i > 0 ? line[i-1] : '';
        var a = (end < line.length) ? line[end] : '';
        var oncRakam = /\d/.test(b);
        var sonRakam = /\d/.test(a) || a === '.' || a === ',';
        var bitisik = (spans || []).some(function(sp){ return sp.end === i; });
        if ((!oncRakam || bitisik) && !sonRakam) hits.push({ start:i, end:end });
      }
    });
    if (!hits.length) return null;
    hits.sort(function(x,y){ return x.start - y.start; });
    return sondan ? hits[hits.length-1] : hits[0];
  }
  // skor için gevşek içerme (yapışıklık skoru düşürmesin; tanım kelimeleri ayrıştırır)
  function numIcerir(line, v){ return v != null && String(line).indexOf(String(v)) > -1; }

  // ── boyut notasyonu avı (ham span + grup core): NPS+Sch → ODxet → DN ──
  var BOYUT_TANIM = [
    { re: /\d[\d\-\/ ]*"\s*(?:[Ss][Cc][Hh]\s*\d+[A-Za-z]?|STD|XXS|XS|XXH|XH)?/,
      core: '(\\d[\\d\\-\\/ ]*"\\s*(?:Sch\\s*\\d+[A-Za-z]?|STD|XXS|XS|XXH|XH)?)' },
    { re: /\d+(?:[.,]\d+)?\s*[xX]\s*\d+(?:[.,]\d+)?/,
      core: '(\\d+(?:[.,]\\d+)?\\s*[xX]\\s*\\d+(?:[.,]\\d+)?)' },
    { re: /DN\s*\d+/i,
      core: '(DN\\s*\\d+)' }
  ];
  function boyutSpan(line){
    for (var i = 0; i < BOYUT_TANIM.length; i++){
      var m = line.match(BOYUT_TANIM[i].re);
      if (m) return { start:m.index, end:m.index + m[0].length, core:BOYUT_TANIM[i].core };
    }
    return null;
  }

  // bilinen kalite havuzu — tek satırdan genellenebilir alternation (canlı desen pratiği)
  var KALITE_CORE = '((?:AISI\\s*)?(?:316L?|304L?|ST\\.?\\s?ST\\.?|ST\\s?\\d{2}|S235(?:JR)?|S355|CuNi[\\w.\\/]*|1\\.4571|SA\\/?A?\\s?\\d{3}[A-Z]?|A\\d{3}[A-Z]?|Galv\\w*))';

  // segment literalleştirme: rakam dizisi→\d+ · boşluk→\s* · gerisi escape (cozumle/genKod ruhu)
  function genSeg(s){
    var o = '', i = 0, x = String(s);
    while (i < x.length){
      var c = x[i];
      if (/\d/.test(c)){
        var j = i; while (j < x.length && /\d/.test(x[j])) j++;
        if (j < x.length && /[.,]/.test(x[j]) && j + 1 < x.length && /\d/.test(x[j+1])){
          j++; while (j < x.length && /\d/.test(x[j])) j++;
          o += '\\d+[.,]\\d+';
        } else o += '\\d+';
        i = j;
      }
      else if (/\s/.test(c)){ var k = i; while (k < x.length && /\s/.test(x[k])) k++; o += '\\s*'; i = k; }
      else { o += escRe(c); i++; }
    }
    return o;
  }

  // tanım kelimesinden yapışık DN/rakam kuyruğunu sıyır ('ManşonDN40'→'Manşon') — format-geneli tetik
  function kelimeSade(w){
    var t = String(w || '').replace(/DN\s*\d.*$/i, '').replace(/\d+$/, '');
    return t.length >= 2 ? t : String(w || '');
  }

  function slug(s){
    return String(s || 'satir').toLowerCase()
      .replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u')
      .replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,24) || 'satir';
  }

  // ── tek satır + AI değerlerinden desen sentezi ──
  // dönen: { pattern, grup_haritasi, tetikleyici_regex } | null
  function satirDesen(line, r){
    var spans = [];
    function ekle(ad, sp, core, oncelik){
      if (!sp) return;
      for (var i = 0; i < spans.length; i++){
        var o = spans[i];
        if (sp.start < o.end && o.start < sp.end){ // çakışma → düşük öncelik atılır
          if (oncelik > o.oncelik){ spans.splice(i,1); i--; } else return;
        }
      }
      spans.push({ ad:ad, start:sp.start, end:sp.end, core:core, oncelik:oncelik });
    }

    var bs = boyutSpan(line);
    // ODxet yapışık kırpma (Cadmatic '60.3x4.5979' = et 4.5 + boy 979): regex et'i taşmışsa
    // AI et değerine eşit EN KISA önekte kes; ondalık sayısı desene işlenir (canlı '\d+\.\d' pratiği).
    if (bs && r.et_mm != null){
      var seg = line.slice(bs.start, bs.end);
      var xi = seg.search(/[xX]/);
      if (xi > -1){
        var etHam = seg.slice(xi + 1).trim();
        if (Math.abs(parseFloat(etHam.replace(',', '.')) - r.et_mm) > 0.0005){
          var sonra = line.slice(bs.start + xi + 1);
          var lead = (sonra.match(/^\s*/) || [''])[0].length;
          var run = ((sonra.slice(lead).match(/^[\d.,]+/) || [''])[0]);
          var best = null;
          for (var L = 1; L <= run.length; L++){
            var pfx = run.slice(0, L);
            if (/[.,]$/.test(pfx)) continue;
            if (Math.abs(parseFloat(pfx.replace(',', '.')) - r.et_mm) < 0.0005){ best = pfx; break; }
          }
          if (best){
            var d = (best.split(/[.,]/)[1] || '').length;
            bs = { start: bs.start, end: bs.start + xi + 1 + lead + best.length,
                   core: '(\\d+(?:[.,]\\d+)?\\s*[xX]\\s*' + (d > 0 ? ('\\d+[.,]\\d{' + d + '}') : '\\d+') + ')' };
          }
        }
      }
    }
    if (bs) ekle('boyut', bs, bs.core, 5);
    if (r.kalite){
      var ki = line.toUpperCase().lastIndexOf(String(r.kalite).toUpperCase());
      if (ki >= 0) ekle('kalite', { start:ki, end:ki + String(r.kalite).length }, KALITE_CORE, 3);
    }
    if (r.agirlik_kg != null) ekle('agirlik_kg', degerSpan(line, r.agirlik_kg, spans, true), '(\\d+(?:[.,]\\d+)?)', 4);
    if (r.boy_mm != null) ekle('boy_mm', degerSpan(line, r.boy_mm, spans, false), '(\\d+)', 2);
    if (r.adet != null && r.adet !== 1) ekle('adet', degerSpan(line, r.adet, spans, false), '(\\d+)', 1);

    // tanim: AI tanımının ilk kelimesinden, takip eden ilk span'a kadar
    var ilkKelime = kelimeSade(String(r.tanim || '').trim().split(/\s+/)[0] || '');
    if (ilkKelime){
      var ti = line.toUpperCase().indexOf(ilkKelime.toUpperCase());
      if (ti >= 0){
        var sonraki = line.length;
        spans.forEach(function(sp){ if (sp.start > ti && sp.start < sonraki) sonraki = sp.start; });
        if (sonraki > ti) ekle('tanim', { start:ti, end:sonraki }, '(.+?)', 0);
      }
    }
    if (!spans.length) return null;

    spans.sort(function(a,b){ return a.start - b.start; });
    var pat = '^', gh = {}, gi = 0, poz = 0;
    spans.forEach(function(sp){
      pat += genSeg(line.slice(poz, sp.start));
      gi++; pat += sp.core.indexOf('(') === 0 ? sp.core : '(' + sp.core + ')';
      gh[sp.ad] = gi;
      poz = sp.end;
    });
    pat += genSeg(line.slice(poz)) + '$';

    // tetikleyici: aday tetikler (2-kelime → 1-kelime → ham) ÖRNEK SATIRA koşulur, ilk tutan yazılır.
    // (kelimeSade sıyırma bitişikliği bozabilir: 'ManşonDN40 x' → /Manşon\s*x/ kendi satırını yakalamaz.)
    var kelHam = String(r.tanim || '').trim().split(/\s+/).filter(Boolean).slice(0,3)
      .map(kelimeSade).filter(function(w){ return w.length >= 2; });
    var adaylar = [];
    if (kelHam.length >= 2) adaylar.push(kelHam.slice(0,2).map(escRe).join('\\s*'));
    if (kelHam.length >= 1) adaylar.push(escRe(kelHam[0]));
    adaylar.push(escRe(ilkKelime || line.slice(0,8)));
    var tetik = null;
    for (var ai = 0; ai < adaylar.length; ai++){
      try { if (new RegExp(adaylar[ai], 'i').test(line)){ tetik = adaylar[ai]; break; } } catch(e){}
    }
    if (!tetik) tetik = adaylar[adaylar.length - 1];

    return { pattern: pat, grup_haritasi: gh, tetikleyici_regex: tetik };
  }

  // ── l2-parser.malzemeTablosuCikar grup_haritasi dalı eşleniği (§4.3 — birebir) ──
  function _tipCevir(ad, value){
    if (value == null || value === '') return null;
    if (ad === 'agirlik_kg' || ad === 'cap_mm' || ad === 'et_mm' || ad === 'dis_cap_mm'){
      var n = parseFloat(String(value).replace(',', '.')); return isNaN(n) ? null : n;
    }
    if (ad === 'dn' || ad === 'adet' || ad === 'boy_mm'){
      var i = parseInt(value, 10); return isNaN(i) ? null : i;
    }
    if (ad === 'kalite') return String(value).replace(/\s+/g, '');
    return String(value).trim();
  }
  // tek satır + tip → malzeme nesnesi (mtCikar çekirdeği; doğrulama da BUNU çağırır — tek kaynak)
  function satirIsle(satir, tip){
    var m = null;
    try { m = satir.match(new RegExp(tip.pattern, 'i')); } catch(e){ m = null; }
    if (!m) return { kategori:tip.kategori, tanim:satir, ham_satir:true, uyari:'pattern_tutmadi' };
    var mal = { kategori:tip.kategori, malzeme:tip.malzeme_default || null, ham_satir:false };
    if (tip.grup_haritasi){
      for (var ad in tip.grup_haritasi){
        var ham = m[tip.grup_haritasi[ad]];
        if (ham !== undefined) mal[ad] = _tipCevir(ad, ham);
      }
      if (mal.adet === undefined) mal.adet = 1;
    }
    return mal;
  }
  function mtCikar(text, kural){
    if (!kural || !kural.aktif || !Array.isArray(kural.satir_tipleri)) return [];
    var out = [];
    var satirlar = String(text).split('\n').map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; });
    var basla = 0;
    if (kural.baslik_tetikleyici && typeof kural.baslik_tetikleyici === 'string'){
      for (var bi = 0; bi < satirlar.length; bi++){ if (satirlar[bi].indexOf(kural.baslik_tetikleyici) > -1){ basla = bi + 1; break; } }
    }
    for (var i = basla; i < satirlar.length; i++){
      var satir = satirlar[i];
      if (satir.length < 5) continue;
      var tip = null;
      for (var t = 0; t < kural.satir_tipleri.length; t++){
        try { if (new RegExp(kural.satir_tipleri[t].tetikleyici_regex, 'i').test(satir)){ tip = kural.satir_tipleri[t]; break; } } catch(e){}
      }
      if (!tip) continue;
      out.push(satirIsle(satir, tip));
    }
    return out;
  }

  // ── kıyas yardımcıları ──
  function _esitNum(a, b, tol){ var x = parseFloat(a), y = parseFloat(b); return !isNaN(x) && !isNaN(y) && Math.abs(x - y) <= (tol || 0.05); }

  // ── ANA: sentezle(canonText, aiSatirlar) ──
  function sentezle(canonText, aiSatirlar){
    var O = _olcu();
    var lines = String(canonText || '').split('\n').map(function(s){ return s.trim(); }).filter(function(s){ return s.length >= 5; });
    var rows = Array.isArray(aiSatirlar) ? aiSatirlar : [];
    var rapor = { satirlar: [], yesil: 0, kirmizi: 0 };
    var tipler = {};            // ad → tip nesnesi (exemplar bazlı)
    var kullanilan = {};        // line idx → true (1 AI satırı = 1 metin satırı)
    var eslesmeler = [];        // {r, line, lineIdx} | {r, line:null}

    // 1) satır bulma (değer-çapalı: agirlik → boy → tanim kelimeleri)
    rows.forEach(function(r, ri){
      var best = null, bestSkor = 0;
      lines.forEach(function(L, li){
        if (kullanilan[li]) return;
        var s = 0;
        if (r.agirlik_kg != null && numIcerir(L, r.agirlik_kg)) s += 3;
        if (r.boy_mm != null && numIcerir(L, r.boy_mm)) s += 2;
        String(r.tanim || '').split(/\s+/).filter(function(w){ return w.length > 2; }).slice(0,3)
          .forEach(function(w){ if (L.toUpperCase().indexOf(w.toUpperCase()) > -1) s += 1; });
        if (s > bestSkor){ bestSkor = s; best = li; }
      });
      if (best !== null && bestSkor >= 2){ kullanilan[best] = true; eslesmeler.push({ r:r, ri:ri, line:lines[best], lineIdx:best }); }
      else eslesmeler.push({ r:r, ri:ri, line:null, lineIdx:-1 });
    });

    // 2+3) tip sınıflandırma + desen sentezi (tip = kategori + tanım ilk kelimesi; exemplar ilk satır)
    eslesmeler.forEach(function(e){
      if (!e.line){
        rapor.satirlar.push({ idx:e.ri, tanim:e.r.tanim || '', durum:'kirmizi', sebep:'satir_bulunamadi', satir:null });
        rapor.kirmizi++; return;
      }
      var kat = kategoriCevir(e.r);
      var ad = kat + '_' + slug(kelimeSade(String(e.r.tanim || '').split(/\s+/)[0]));
      if (!tipler[ad]){
        var d = satirDesen(e.line, e.r);
        if (!d){
          rapor.satirlar.push({ idx:e.ri, tanim:e.r.tanim || '', durum:'kirmizi', sebep:'desen_sentezlenemedi', satir:e.line });
          rapor.kirmizi++; return;
        }
        tipler[ad] = { ad:ad, kategori:kat, tetikleyici_regex:d.tetikleyici_regex, pattern:d.pattern, grup_haritasi:d.grup_haritasi };
      }
      e.tipAd = ad;
    });

    var satir_tipleri = Object.keys(tipler).map(function(k){ return tipler[k]; });

    // başlık tetikleyici: ilk eşleşen satırın üstündeki 6 satırda malzeme/material başlığı
    var baslik = null, ilkIdx = -1;
    eslesmeler.forEach(function(e){ if (e.lineIdx >= 0 && (ilkIdx < 0 || e.lineIdx < ilkIdx)) ilkIdx = e.lineIdx; });
    if (ilkIdx > 0){
      for (var b = Math.max(0, ilkIdx - 6); b < ilkIdx; b++){
        if (/MALZEME|MATERIAL/i.test(lines[b]) && lines[b].length <= 40){ baslik = lines[b]; }
      }
    }

    // 4) doğrulama (kanıt): her AI satırının KENDİ metni üzerinde — runtime tetik sırası + desen + olcuParse kıyas
    eslesmeler.forEach(function(e){
      if (!e.line || !e.tipAd) return; // zaten raporlandı
      // runtime'da bu satırı hangi tip yakalar? (l2 tetik sırası: ilk eşleşen kazanır)
      var fiili = null;
      for (var t = 0; t < satir_tipleri.length; t++){
        try { if (new RegExp(satir_tipleri[t].tetikleyici_regex, 'i').test(e.line)){ fiili = satir_tipleri[t]; break; } } catch(err){}
      }
      if (!fiili || fiili.ad !== e.tipAd){
        rapor.satirlar.push({ idx:e.ri, tanim:e.r.tanim || '', durum:'kirmizi', sebep:'tetik_karisti:' + (fiili ? fiili.ad : 'yok'), satir:e.line });
        rapor.kirmizi++; return;
      }
      var c = satirIsle(e.line, fiili);
      if (!c || c.ham_satir){
        rapor.satirlar.push({ idx:e.ri, tanim:e.r.tanim || '', durum:'kirmizi', sebep:'pattern_tutmadi', satir:e.line });
        rapor.kirmizi++; return;
      }
      // olcuParse normalize + AI kıyas (yalnız iki taraf da doluysa)
      var sorun = [];
      if (c.boyut && O){
        var p = O.olcuParse(c.boyut, kaliteMalzeme(c.kalite || e.r.kalite));
        c.dis_cap_mm = (c.dis_cap_mm != null) ? c.dis_cap_mm : p.dis_cap;
        if (c.et_mm == null && p.et != null){ c.et_mm = p.et; c._et_kaynak = /[xX]/.test(c.boyut) ? 'metin' : 'asme'; }
        if (c.dn == null) c.dn = p.dn;
        if (!c.sch && p.sch) c.sch = p.sch;
      }
      if (e.r.dis_cap_mm != null && c.dis_cap_mm != null && !_esitNum(c.dis_cap_mm, e.r.dis_cap_mm)) sorun.push('cap');
      if (e.r.et_mm != null && c.et_mm != null && !_esitNum(c.et_mm, e.r.et_mm)) sorun.push('et');
      if (e.r.boy_mm != null && c.boy_mm != null && !_esitNum(c.boy_mm, e.r.boy_mm, 0.5)) sorun.push('boy');
      if (e.r.agirlik_kg != null && c.agirlik_kg != null && !_esitNum(c.agirlik_kg, e.r.agirlik_kg)) sorun.push('agirlik');
      if (sorun.length){
        rapor.satirlar.push({ idx:e.ri, tanim:e.r.tanim || '', durum:'kirmizi', sebep:'kiyas_tutmadi:' + sorun.join(','), satir:e.line });
        rapor.kirmizi++;
      } else {
        rapor.satirlar.push({ idx:e.ri, tanim:e.r.tanim || '', durum:'yesil', sebep:null, satir:e.line });
        rapor.yesil++;
        e._c = c;
      }
    });

    // dominant boru → türetilmiş spool ölçüleri (kenar §5: dn HEP dominant borudan)
    var dominant = null;
    eslesmeler.forEach(function(e){
      if (!e._c || e._c.kategori !== 'boru' || e._c.dis_cap_mm == null) return;
      if (!dominant || e._c.dis_cap_mm > dominant.dis_cap) dominant = {
        dis_cap: e._c.dis_cap_mm, et: (e._c.et_mm != null ? e._c.et_mm : null),
        dn: (e._c.dn != null ? e._c.dn : null), sch: (e._c.sch || null),
        _et_kaynak: e._c._et_kaynak || (e._c.et_mm != null ? 'metin' : null)
      };
    });

    return { satir_tipleri:satir_tipleri, baslik_tetikleyici:baslik, rapor:rapor, dominant:dominant };
  }

  var api = { sentezle:sentezle, mtCikar:mtCikar, satirDesen:satirDesen, kaliteMalzeme:kaliteMalzeme };
  if (typeof window !== 'undefined')     window.ARES_TABLO_SENTEZ = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.ARES_TABLO_SENTEZ = api;

})(typeof window !== 'undefined' ? window : globalThis);
