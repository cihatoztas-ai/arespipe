// lib/malzeme-kutuphane-eslesme.js — SAF ÇEKİRDEK (I/O yok), izo-eslesme.js deseni.
// Kanonik boyut = mm (MK-140: ares-olcu her girdiyi mm'e normalize eder; dn değil).
// Girdi: spool_malzemeleri satırı + ARES_OLCU. Malzeme kolonu zaten normalize kod
//   (karbon/paslanmaz/diger) → ARES_NORM gerekmez; bakir→cunife (kütüphane convention).
// Çıktı: { hedef_kolon, lookup } | null. Lookup mm-toleranslı (cap_mm/cap_buyuk_mm).
// MK-126.8: ares-olcu KOPYALANMAZ, çağrılır.

function _grup(malzemeKod){
  var g = String(malzemeKod||'').toLowerCase();
  if (g === 'bakir') return 'cunife';      // kütüphane convention
  if (['karbon','paslanmaz','alum','cunife','diger'].indexOf(g) !== -1) return g;
  return g || null;
}

function eslesmeAnahtari(m, ARES_OLCU){
  if (!m) return null;
  var mg = _grup(m.malzeme);
  if (!mg || mg === 'diger') return null;  // 'diger' standart-dışı (Weld-O-let, Victaulic vb.)

  // boyut → kanonik mm (4 format ares-olcu'dan; ARES_BORU runtime'da yüklü olmalı)
  var o = ARES_OLCU.olcuParse(m.boyut || '', m.malzeme || '');
  var mm = (o.dis_cap != null) ? Math.round(o.dis_cap * 10) / 10 : null;
  if (mm == null) return null;             // mm türetilemedi → eşleşme yok

  var tl = String(m.tanim||'').toLowerCase();

  // FLANŞ → flansh_olculer.cap_mm
  if (/flange|flans/.test(tl)) {
    var ftip = /welding neck|weld neck|\bwn\b/.test(tl) ? 'EN-T11'
             : (/slip[\s\-]?on/.test(tl) ? 'EN-T01' : null);
    var pn = (tl.match(/pn\s*0*(\d+)/) || [])[1] || null;   // 'PN 16'→'16'
    if (!ftip || !pn) return null;
    return { hedef_kolon:'flansh_olculer_id', cap_alani:'cap_mm', cap_mm:mm,
      lookup:{ geometri_std:'EN-1092-1', flansh_tipi:ftip, basinc_sinifi:pn, malzeme_grubu:mg } };
  }

  // FITTING → fitting_olculer.cap_buyuk_mm
  if (/elbow|dirsek/.test(tl)) {
    var lr = /1\.?5d|long/.test(tl) ? 'lr' : (/\bsr\b|short/.test(tl) ? 'sr' : 'lr');
    var aci = /\b45\b/.test(tl) ? '45' : '90';
    return { hedef_kolon:'fitting_olculer_id', cap_alani:'cap_buyuk_mm', cap_mm:mm,
      lookup:{ parca_tipi:'elbow_'+aci+lr, malzeme_grubu:mg } };
  }
  if (/reducer/.test(tl)) {
    var ecc = /eccentric/.test(tl) ? 'ecc' : 'conc';
    return { hedef_kolon:'fitting_olculer_id', cap_alani:'cap_buyuk_mm', cap_mm:mm,
      lookup:{ parca_tipi:'reducer_'+ecc, malzeme_grubu:mg } };
  }
  if (/\btee\b/.test(tl)) {
    return { hedef_kolon:'fitting_olculer_id', cap_alani:'cap_buyuk_mm', cap_mm:mm,
      lookup:{ parca_tipi:'tee_reducing', malzeme_grubu:mg } };
  }

  return null; // standart-dışı → NULL → süper-admin
}

if (typeof module !== 'undefined' && module.exports) module.exports = { eslesmeAnahtari: eslesmeAnahtari };
if (typeof window !== 'undefined') window.MALZEME_ESLESME = { eslesmeAnahtari: eslesmeAnahtari };
