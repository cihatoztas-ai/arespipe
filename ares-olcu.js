// ares-olcu.js — AresPipe ortak boyut/ölçü metin parser (111. oturum / Karar 2-B)
//
// Amaç: Bir boyut metnini ("4\" Sch 10S", "88.9x8.0", "DN100") {dis_cap, et, dn, sch}'e
//   çevirmeyi TEK YERE topla. 110 sonu durum: ÜÇ ayrı boyut-parser vardı —
//     1) ares-kabuk.js::boyutParse (FAKİR: SCH/inç bilmez, "4\" Sch 10S" → dis_cap=4/et=null)
//     2) devre_yeni.html::_boyutParcala (ZENGİN ama inline _schWT KOPYASI — ARES_BORU'yu çağırmaz)
//     3) ares-asme.js (ARES_BORU): tam lookup motoru ama saf, metin parse etmez, kimse çağırmaz
//   Bu modül 1+2'yi tek metin-parser'a indirger; lookup'ı ARES_BORU'ya devreder (MK-109.1 ruhu:
//   çalışan motoru yeniden yazma, çağır). Gelecekteki PDF/STP kaynakları da buradan geçecek.
//
// Bağımlılık (runtime):
//   - ARES_BORU (ares-asme.js) — disCap(dn,malzeme), etKalinligi(dn,sch,malzeme), npsToDn(nps)
//
// Script yükleme sırası (tarayıcı):
//   ares-store → ares-lang → ares-normalize → ares-asme → ares-olcu → ares-kabuk → ares-layout
//   (ares-olcu, ares-kabuk'tan ÖNCE; ARES_BORU/ares-asme, ares-olcu'dan ÖNCE yüklenmeli)
//
// Mimari kararlar:
//   MK-110.3 — kabuk SCH/inç lookup eksiği; ortak motor ARES_BORU. Bu modül onu uygular.
//   MK-111.1 — Fiziksel kural: et >= dis_cap olamaz. "100 x 114.3" gibi DNxOD notasyonunda
//              ikinci sayı et sanılmasın diye et iptal edilir (110'da kanıtlanan bonus bug fix).
//
// Son güncelleme: 22 Mayıs 2026 (111. oturum)

(function(g){
  'use strict';

  // ── ARES_BORU runtime resolve (tarayıcı: window/global; Node: ares-asme require globalThis'e yazar)
  function _boru(){
    if (typeof ARES_BORU !== 'undefined' && ARES_BORU) return ARES_BORU;
    if (typeof window !== 'undefined' && window.ARES_BORU) return window.ARES_BORU;
    if (typeof globalThis !== 'undefined' && globalThis.ARES_BORU) return globalThis.ARES_BORU;
    return null;
  }

  // ── OLCU PARSE: boyut metni + (opsiyonel) malzeme → {dis_cap, et, dn, sch}
  //    Öncelik: NPS+Sch → açık ODxet → DN → tek sayı.
  //    et/dis_cap sayısal (mm) ya da null; dn integer ya da null; sch normalize-öncesi string ya da null.
  function olcuParse(boyutStr, malzeme){
    var s = String(boyutStr == null ? '' : boyutStr).trim();
    var bos = { dis_cap:null, et:null, dn:null, sch:null };
    if (!s) return bos;
    var B = _boru();

    // 1) NPS + Schedule: '4" Sch 10S' | '2" STD' | '6" Sch40' | '1-1/2" Sch 80'
    //    Tırnak (") inç işareti → NPS notasyonu. NPS→DN ve et lookup'ı ARES_BORU'ya devredilir.
    var mIn = s.match(/^([\d.\-\/]+)\s*"(?:\s*(.+))?/);
    if (mIn){
      var npsRaw = mIn[1];
      var schStr = mIn[2] ? mIn[2].trim() : '';
      // 'Sch 10S' / 'Sch40' / 'STD' / 'XS' → sch token
      var schM = schStr.match(/(?:SCH\s*)?(\d+[A-Z]*|STD|XXH|XXS|XH|XS)/i);
      var sch = schM ? schM[1] : null;
      var dn  = B ? B.npsToDn(npsRaw) : null;
      var od  = (B && dn != null) ? B.disCap(dn, malzeme) : null;
      var et  = (B && dn != null && sch) ? B.etKalinligi(dn, sch, malzeme) : null;
      return { dis_cap: (od != null ? od : null), et: (et != null ? et : null), dn: (dn != null ? dn : null), sch: sch };
    }

    // 2) Açık OD x et: '88.9x8.0' | '60.3 x 4.5' | '100 x 114.3'
    //    MK-111.1: ikinci sayı >= ilk sayı ise et OLAMAZ (et hep dış çaptan küçük). et iptal.
    var mx = s.match(/^([\d.,]+)\s*[xX]\s*([\d.,]+)/);
    if (mx){
      var a = parseFloat(mx[1].replace(',', '.'));
      var b = parseFloat(mx[2].replace(',', '.'));
      if (!isFinite(a)) a = null;
      if (!isFinite(b)) b = null;
      if (a != null && b != null && b >= a) b = null;   // 100 x 114.3 → et iptal (bonus bug fix)
      return { dis_cap: a, et: b, dn: null, sch: null };
    }

    // 3) Açık OD: 'OD:60' | 'OD 60.3' → dış çap (et yok). Eski kabuk boyutParse desteğiydi.
    var mo = s.match(/OD\s*:?\s*([\d.,]+)/i);
    if (mo){
      var od2 = parseFloat(mo[1].replace(',', '.'));
      return { dis_cap: isFinite(od2) ? od2 : null, et: null, dn: null, sch: null };
    }

    // 4) DN: 'DN100' | 'DN 100 L=100' → OD lookup ARES_BORU'dan (sch yok → et null)
    var md = s.match(/DN\s*(\d+)/i);
    if (md){
      var dn3 = parseInt(md[1], 10);
      var od3 = B ? B.disCap(dn3, malzeme) : null;
      return { dis_cap: (od3 != null ? od3 : null), et: null, dn: (isFinite(dn3) ? dn3 : null), sch: null };
    }

    // 5) Tek sayı (ham çap)
    var n = parseFloat(s.replace(',', '.'));
    return { dis_cap: isFinite(n) ? n : null, et: null, dn: null, sch: null };
  }

  // ── AĞIRLIK (kg/m): dn+sch+malzeme varsa ARES_BORU'dan. Yoksa null. (zenginleştirme bonusu)
  function agirlikKgM(dn, sch, malzeme){
    var B = _boru();
    if (!B || dn == null || !sch) return null;
    var v = B.agirlikKgM(dn, sch, malzeme);
    return (v != null ? v : null);
  }

  // Namespace
  var api = { olcuParse: olcuParse, agirlikKgM: agirlikKgM };
  if (typeof window !== 'undefined')     window.ARES_OLCU = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.ARES_OLCU = api;

})(typeof window !== 'undefined' ? window : globalThis);
